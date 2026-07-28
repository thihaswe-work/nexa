import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';

export interface UserPresence {
  userId: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeenAt: string;
  updatedAt: string;
}

const PRESENCE_TTL = 120;
const AWAY_THRESHOLD_MS = 5 * 60 * 1000; // 5min inactivity → away

@Injectable()
export class PresenceService {
  private readonly logger = new Logger(PresenceService.name);

  constructor(private readonly redis: RedisService) {}

  /** Mark user online with a heartbeat. Repeated calls refresh the TTL. */
  async setOnline(userId: string, status: UserPresence['status'] = 'online'): Promise<void> {
    const now = new Date().toISOString();
    const presence: UserPresence = {
      userId,
      status,
      lastSeenAt: now,
      updatedAt: now,
    };
    await Promise.all([
      this.redis.set(`presence:online:${userId}`, now, PRESENCE_TTL),
      this.redis.set(`presence:status:${userId}`, presence, PRESENCE_TTL),
      this.redis.sadd('presence:online-set', userId),
      this.redis.expire(`presence:online:${userId}`, PRESENCE_TTL),
    ]);
  }

  /** Mark user offline immediately. */
  async setOffline(userId: string): Promise<void> {
    await Promise.all([
      this.redis.del(`presence:online:${userId}`),
      this.redis.del(`presence:status:${userId}`),
      this.redis.srem('presence:online-set', userId),
    ]);
  }

  /** Check if user is currently considered online. */
  async isOnline(userId: string): Promise<boolean> {
    return this.redis.exists(`presence:online:${userId}`);
  }

  /** Get all online user IDs. */
  async getOnlineUserIds(): Promise<string[]> {
    return this.redis.smembers('presence:online-set');
  }

  /** Count of currently online users. */
  async getOnlineCount(): Promise<number> {
    return this.redis.scard('presence:online-set');
  }

  /** Get a user's presence status with auto-away detection. */
  async getUserStatus(userId: string): Promise<UserPresence | null> {
    const presence = await this.redis.get<UserPresence>(`presence:status:${userId}`);
    if (!presence) return null;

    if (presence.status === 'online') {
      const lastSeen = new Date(presence.lastSeenAt).getTime();
      if (Date.now() - lastSeen > AWAY_THRESHOLD_MS) {
        presence.status = 'away';
        await this.setOnline(userId, 'away');
      }
    }

    return presence;
  }

  /** Update lastSeenAt (e.g. on API request) without changing online status. */
  async heartbeat(userId: string): Promise<void> {
    const now = new Date().toISOString();
    const current = await this.redis.get<UserPresence>(`presence:status:${userId}`);
    if (current) {
      current.lastSeenAt = now;
      current.updatedAt = now;
      await Promise.all([
        this.redis.set(`presence:online:${userId}`, now, PRESENCE_TTL),
        this.redis.set(`presence:status:${userId}`, current, PRESENCE_TTL),
        this.redis.expire(`presence:online:${userId}`, PRESENCE_TTL),
      ]);
    }
  }

  /** Clean stale entries from the online set (run on a timer). */
  async cleanStaleEntries(): Promise<number> {
    const members = await this.redis.smembers('presence:online-set');
    let removed = 0;
    for (const userId of members) {
      const exists = await this.redis.exists(`presence:online:${userId}`);
      if (!exists) {
        await this.redis.srem('presence:online-set', userId);
        await this.redis.del(`presence:status:${userId}`);
        removed++;
      }
    }
    if (removed > 0) {
      this.logger.log(`Cleaned ${removed} stale presence entries`);
    }
    return removed;
  }

  /**
   * Returns users who have been active within a given number of minutes.
   * Used by NearbyService to filter recently active users without hitting DB.
   */
  async getRecentlyActiveUserIds(minutes = 30): Promise<string[]> {
    const threshold = Date.now() - minutes * 60 * 1000;
    const all = await this.redis.smembers('presence:online-set');
    const active: string[] = [];
    for (const userId of all) {
      const ts = await this.redis.get<string>(`presence:online:${userId}`);
      if (ts) {
        const time = new Date(ts).getTime();
        if (time >= threshold) active.push(userId);
      }
    }
    return active;
  }
}
