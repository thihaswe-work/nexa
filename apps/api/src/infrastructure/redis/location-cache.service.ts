import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';

export interface CachedLocation {
  lat: number;
  lng: number;
  updatedAt: string;
  accuracy?: number;
}

const LOCATION_CACHE_TTL = 300;

@Injectable()
export class LocationCacheService {
  private readonly logger = new Logger(LocationCacheService.name);

  constructor(private readonly redis: RedisService) {}

  async setLocation(userId: string, lat: number, lng: number, accuracy?: number): Promise<void> {
    const location: CachedLocation = {
      lat,
      lng,
      updatedAt: new Date().toISOString(),
      accuracy,
    };
    const client = this.redis.getRawClient();
    const geoKey = this.redis.key('location:geo');
    await Promise.all([
      this.redis.set(`location:current:${userId}`, location, LOCATION_CACHE_TTL),
      client.geoadd(geoKey, lng, lat, userId),
      client.expire(geoKey, LOCATION_CACHE_TTL),
    ]);
  }

  async getLocation(userId: string): Promise<CachedLocation | null> {
    return this.redis.get<CachedLocation>(`location:current:${userId}`);
  }

  async removeLocation(userId: string): Promise<void> {
    const client = this.redis.getRawClient();
    await Promise.all([
      this.redis.del(`location:current:${userId}`),
      client.zrem(this.redis.key('location:geo'), userId),
    ]);
  }

  async hasLocation(userId: string): Promise<boolean> {
    return this.redis.exists(`location:current:${userId}`);
  }

  async findNearbyUserIds(
    lat: number,
    lng: number,
    radiusMeters: number,
    excludeUserId?: string,
  ): Promise<{ userId: string; distanceMeters: number }[]> {
    const client = this.redis.getRawClient();
    const results = await client.georadius(
      this.redis.key('location:geo'),
      lng,
      lat,
      radiusMeters,
      'm',
      'WITHDIST',
    ) as [string, string][];

    return results
      .filter(([id]) => id !== excludeUserId)
      .map(([userId, distance]) => ({
        userId,
        distanceMeters: Math.round(parseFloat(distance) * 10) / 10,
      }));
  }

  async countNearby(lat: number, lng: number, radiusMeters: number): Promise<number> {
    const client = this.redis.getRawClient();
    const count = await client.georadius(
      this.redis.key('location:geo'),
      lng,
      lat,
      radiusMeters,
      'm',
      'COUNT',
    );
    return Array.isArray(count) ? count.length : 0;
  }

  async getAllCachedLocations(): Promise<Map<string, CachedLocation>> {
    const client = this.redis.getRawClient();
    const keys = await client.keys(this.redis.key('location:current:*'));
    const map = new Map<string, CachedLocation>();
    for (const rawKey of keys) {
      const shortKey = rawKey.replace(this.redis.key(''), '');
      const userId = shortKey.split(':').pop()!;
      const location = await this.redis.get<CachedLocation>(shortKey);
      if (location) map.set(userId, location);
    }
    return map;
  }

  async cleanStaleGeoEntries(): Promise<number> {
    const client = this.redis.getRawClient();
    const geoKey = this.redis.key('location:geo');
    const members = await client.zrange(geoKey, 0, -1);
    let removed = 0;
    for (const userId of members) {
      if (!(await this.redis.exists(`location:current:${userId}`))) {
        await client.zrem(geoKey, userId);
        removed++;
      }
    }
    if (removed > 0) {
      this.logger.log(`Cleaned ${removed} stale geo entries`);
    }
    return removed;
  }
}
