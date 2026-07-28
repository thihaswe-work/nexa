import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from '../../database/database.service';
import { LocationCacheService } from '../../infrastructure/redis/location-cache.service';
import { PresenceService } from '../../infrastructure/redis/presence.service';
import { RedisPubSubService } from '../../infrastructure/redis/redis-pubsub.service';
import { NearbyQueryDto } from './dto/nearby-query.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import {
  NearbySearchResponseDto,
  NearbyUserDto,
} from './dto/nearby-response.dto';

const COORD_PRECISION = 0.001;
const DISTANCE_PRECISION = 10;

interface NearbyUserRaw {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  distanceMeters: number;
  isOnline: boolean;
  interestName: string | null;
}

@Injectable()
export class NearbyService {
  private readonly logger = new Logger(NearbyService.name);
  private readonly activeThresholdMinutes = 30;

  constructor(
    private readonly db: DatabaseService,
    private readonly locationCache: LocationCacheService,
    private readonly presenceService: PresenceService,
    private readonly pubSubService: RedisPubSubService,
  ) {}

  async updateLocation(
    userId: string,
    dto: UpdateLocationDto,
  ): Promise<{ success: boolean; nearbyCount: number }> {
    await this.db.$transaction([
      this.db.$executeRaw`
        UPDATE profiles
        SET lat = ${dto.lat}, lng = ${dto.lng}, updated_at = NOW()
        WHERE user_id = ${userId}::uuid AND deleted_at IS NULL
      `,
      this.db.$executeRaw`
        INSERT INTO location_history (id, user_id, lat, lng, source, is_background)
        VALUES (gen_random_uuid(), ${userId}::uuid, ${dto.lat}, ${dto.lng}, 'GPS', false)
      `,
      this.db.$executeRaw`
        UPDATE users
        SET is_online = true, last_login_at = CASE WHEN last_login_at IS NULL THEN NOW() ELSE last_login_at END
        WHERE id = ${userId}::uuid
      `,
    ]);

    await Promise.all([
      this.locationCache.setLocation(userId, dto.lat, dto.lng),
      this.presenceService.setOnline(userId),
    ]);

    const nearbyCount = await this.countNearbyRaw(dto.lat, dto.lng, 1000, userId);

    const cachedCount = await this.locationCache.countNearby(dto.lat, dto.lng, 1000);
    this.logger.log(`Location updated for user ${userId}: (${dto.lat}, ${dto.lng}) — ${cachedCount} cached nearby`);

    await this.pubSubService.publishLocationUpdate(
      userId,
      this.obfuscateCoord(dto.lat),
      this.obfuscateCoord(dto.lng),
    );

    return { success: true, nearbyCount };
  }

  async findNearby(
    userId: string,
    query: NearbyQueryDto,
  ): Promise<NearbySearchResponseDto> {
    const radius = query.radius ?? 1000;
    const limit = query.limit ?? 50;

    const userProfile = await this.db.$queryRaw<{ lat: number; lng: number }[]>`
      SELECT lat, lng
      FROM profiles
      WHERE user_id = ${userId}::uuid AND deleted_at IS NULL AND lat IS NOT NULL AND lng IS NOT NULL
      LIMIT 1
    `;

    if (userProfile.length === 0) {
      return {
        approximateLat: 0,
        approximateLng: 0,
        radius,
        total: 0,
        users: [],
      };
    }

    const { lat, lng } = userProfile[0];

    const activeSince = new Date(
      Date.now() - this.activeThresholdMinutes * 60 * 1000,
    ).toISOString();

    const raw = await this.db.$queryRaw<NearbyUserRaw[]>`
      SELECT
        u.id AS "userId",
        p.display_name AS "displayName",
        p.avatar_url AS "avatarUrl",
        ST_Distance(
          p.location::geography,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
        ) AS "distanceMeters",
        u.is_online AS "isOnline",
        (
          SELECT i.name
          FROM profile_interests pi
          JOIN interests i ON i.id = pi.interest_id
          WHERE pi.profile_id = p.id AND i.deleted_at IS NULL
          LIMIT 1
        ) AS "interestName"
      FROM users u
      JOIN profiles p ON p.user_id = u.id
      LEFT JOIN privacy_settings ps ON ps.user_id = u.id
      WHERE u.id <> ${userId}::uuid
        AND u.deleted_at IS NULL
        AND u.is_active = true
        AND p.deleted_at IS NULL
        AND p.lat IS NOT NULL
        AND p.lng IS NOT NULL
        AND p.is_nearby_visible = true
        AND (ps.show_location IS NULL OR ps.show_location = true)
        AND (u.is_online = true OR u.last_login_at >= ${activeSince}::timestamp)
        AND ST_DWithin(
          p.location::geography,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
          ${radius}
        )
      ORDER BY "distanceMeters" ASC
      LIMIT ${limit}
    `;

    const users: NearbyUserDto[] = raw.map((u) =>
      this.toNearbyUserDto(u),
    );

    return {
      approximateLat: this.obfuscateCoord(lat),
      approximateLng: this.obfuscateCoord(lng),
      radius,
      total: users.length,
      users,
    };
  }

  async getLocation(userId: string): Promise<{ lat: number; lng: number } | null> {
    const cached = await this.locationCache.getLocation(userId);
    if (cached) return { lat: cached.lat, lng: cached.lng };
    const result = await this.db.$queryRaw<{ lat: number; lng: number }[]>`
      SELECT lat, lng
      FROM profiles
      WHERE user_id = ${userId}::uuid AND deleted_at IS NULL AND lat IS NOT NULL AND lng IS NOT NULL
      LIMIT 1
    `;

    if (result.length === 0) return null;

    return {
      lat: result[0].lat,
      lng: result[0].lng,
    };
  }

  async clearLocation(userId: string): Promise<void> {
    await this.db.$executeRaw`
      UPDATE profiles
      SET lat = NULL, lng = NULL, updated_at = NOW()
      WHERE user_id = ${userId}::uuid AND deleted_at IS NULL
    `;

    await this.db.$executeRaw`
      UPDATE users
      SET is_online = false
      WHERE id = ${userId}::uuid
    `;

    await Promise.all([
      this.locationCache.removeLocation(userId),
      this.presenceService.setOffline(userId),
    ]);

    await this.pubSubService.publishPresenceChange(userId, 'offline');

    this.logger.log(`Location cleared for user ${userId}`);
  }

  private async countNearbyRaw(
    lat: number,
    lng: number,
    radiusMeters: number,
    excludeUserId: string,
  ): Promise<number> {
    const activeSince = new Date(
      Date.now() - this.activeThresholdMinutes * 60 * 1000,
    ).toISOString();

    const result = await this.db.$queryRaw<{ count: number }[]>`
      SELECT COUNT(*)::int AS count
      FROM users u
      JOIN profiles p ON p.user_id = u.id
      LEFT JOIN privacy_settings ps ON ps.user_id = u.id
      WHERE u.id <> ${excludeUserId}::uuid
        AND u.deleted_at IS NULL
        AND u.is_active = true
        AND p.deleted_at IS NULL
        AND p.lat IS NOT NULL
        AND p.lng IS NOT NULL
        AND p.is_nearby_visible = true
        AND (ps.show_location IS NULL OR ps.show_location = true)
        AND (u.is_online = true OR u.last_login_at >= ${activeSince}::timestamp)
        AND ST_DWithin(
          p.location::geography,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
          ${radiusMeters}
        )
    `;

    return result[0]?.count ?? 0;
  }

  private toNearbyUserDto(raw: NearbyUserRaw): NearbyUserDto {
    const roundedDistance =
      Math.round(raw.distanceMeters / DISTANCE_PRECISION) * DISTANCE_PRECISION;

    return {
      userId: raw.userId,
      displayName: raw.displayName,
      avatarUrl: raw.avatarUrl ?? undefined,
      approximateDistance: Math.max(roundedDistance, DISTANCE_PRECISION),
      distanceLabel: this.formatDistance(roundedDistance),
      isOnline: raw.isOnline,
      commonInterest: raw.interestName ?? undefined,
    };
  }

  private obfuscateCoord(coord: number): number {
    return Math.round(coord / COORD_PRECISION) * COORD_PRECISION;
  }

  private formatDistance(meters: number): string {
    if (meters < 1000) {
      return `~${meters}m`;
    }
    return `~${(meters / 1000).toFixed(1)}km`;
  }
}
