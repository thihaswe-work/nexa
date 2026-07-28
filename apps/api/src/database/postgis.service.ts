import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from './database.service';

export interface NearbyUserResult {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  distanceMeters: number;
  lat: number;
  lng: number;
  isOnline: boolean;
}

export interface GeoBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

@Injectable()
export class PostgisService {
  private readonly logger = new Logger(PostgisService.name);

  constructor(private readonly db: DatabaseService) {}

  async findNearbyUsers(
    lat: number,
    lng: number,
    radiusMeters = 1000,
    excludeUserId?: string,
    maxResults = 50,
  ): Promise<NearbyUserResult[]> {
    const excludeCondition = excludeUserId
      ? Prisma.sql`AND u.id <> ${excludeUserId}::uuid`
      : Prisma.empty;

    const result = await this.db.$queryRaw<NearbyUserResult[]>`
      SELECT
        u.id AS "userId",
        p.display_name AS "displayName",
        p.avatar_url AS "avatarUrl",
        ST_Distance(
          p.location::geography,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
        ) AS "distanceMeters",
        p.lat,
        p.lng,
        u.is_online AS "isOnline"
      FROM users u
      JOIN profiles p ON p.user_id = u.id
      WHERE u.deleted_at IS NULL
        AND p.deleted_at IS NULL
        AND p.lat IS NOT NULL
        AND p.lng IS NOT NULL
        ${excludeCondition}
        AND ST_DWithin(
          p.location::geography,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
          ${radiusMeters}
        )
      ORDER BY "distanceMeters" ASC
      LIMIT ${maxResults}
    `;

    return result;
  }

  async countUsersInRadius(
    lat: number,
    lng: number,
    radiusMeters = 1000,
  ): Promise<number> {
    const result = await this.db.$queryRaw<{ count: number }[]>`
      SELECT COUNT(*)::int AS count
      FROM users u
      JOIN profiles p ON p.user_id = u.id
      WHERE u.deleted_at IS NULL
        AND p.deleted_at IS NULL
        AND p.lat IS NOT NULL
        AND p.lng IS NOT NULL
        AND ST_DWithin(
          p.location::geography,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
          ${radiusMeters}
        )
    `;

    return result[0]?.count ?? 0;
  }

  async findPlacesInBounds(
    bounds: GeoBounds,
    limit = 50,
    offset = 0,
  ): Promise<any[]> {
    return this.db.$queryRaw`
      SELECT *
      FROM places
      WHERE deleted_at IS NULL
        AND lat BETWEEN ${bounds.south} AND ${bounds.north}
        AND lng BETWEEN ${bounds.west} AND ${bounds.east}
      ORDER BY created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;
  }

  async findNearestPlace(
    lat: number,
    lng: number,
  ): Promise<any | null> {
    const result = await this.db.$queryRaw<any[]>`
      SELECT *,
        ST_Distance(
          location::geography,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
        ) AS distance_meters
      FROM places
      WHERE deleted_at IS NULL
      ORDER BY location::geography <-> ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
      LIMIT 1
    `;

    return result[0] ?? null;
  }

  async getLocationHistoryInBounds(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any[]> {
    return this.db.$queryRaw`
      SELECT
        lat,
        lng,
        accuracy,
        altitude,
        heading,
        speed,
        source,
        activity,
        created_at AS "createdAt"
      FROM location_history
      WHERE user_id = ${userId}::uuid
        AND deleted_at IS NULL
        AND created_at BETWEEN ${startDate} AND ${endDate}
      ORDER BY created_at ASC
    `;
  }

  async updateUserLocation(
    userId: string,
    lat: number,
    lng: number,
  ): Promise<void> {
    await this.db.$executeRaw`
      UPDATE profiles
      SET lat = ${lat}, lng = ${lng}, updated_at = NOW()
      WHERE user_id = ${userId}::uuid AND deleted_at IS NULL
    `;
  }

  async calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): Promise<number> {
    const result = await this.db.$queryRaw<{ distance: number }[]>`
      SELECT ST_Distance(
        ST_SetSRID(ST_MakePoint(${lng1}, ${lat1}), 4326)::geography,
        ST_SetSRID(ST_MakePoint(${lng2}, ${lat2}), 4326)::geography
      ) AS distance
    `;

    return result[0]?.distance ?? 0;
  }
}
