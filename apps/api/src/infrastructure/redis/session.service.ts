import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';

export interface SessionData {
  userId: string;
  refreshTokenHash: string;
  createdAt: string;
  expiresAt: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface BlacklistedJwt {
  jti: string;
  revokedAt: string;
  expiresAt: string;
}

const SESSION_TTL = 7 * 86400; // 7 days

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(private readonly redis: RedisService) {}

  // ─── Session Management ──────────────────────────────

  /** Store a refresh token session in Redis (cache alongside DB). */
  async createSession(
    userId: string,
    refreshTokenHash: string,
    ttlSeconds = SESSION_TTL,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const now = new Date();
    const session: SessionData = {
      userId,
      refreshTokenHash,
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + ttlSeconds * 1000).toISOString(),
      ipAddress,
      userAgent,
    };
    await this.redis.set(`sessions:${userId}:${refreshTokenHash.slice(0, 12)}`, session, ttlSeconds);
  }

  /** Validate that a session exists and return its data. */
  async getSession(userId: string, refreshTokenHash: string): Promise<SessionData | null> {
    const prefix = 'sessions';
    const keys = await this.redis.scanKeys(`${prefix}:${userId}:*`);
    for (const rawKey of keys) {
      const shortKey = this.stripPrefix(rawKey);
      const session = await this.redis.get<SessionData>(shortKey);
      if (session && session.refreshTokenHash === refreshTokenHash) {
        return session;
      }
    }
    return null;
  }

  /** Revoke a specific session. */
  async revokeSession(userId: string, refreshTokenHash: string): Promise<boolean> {
    const prefix = 'sessions';
    const keys = await this.redis.scanKeys(`${prefix}:${userId}:*`);
    for (const rawKey of keys) {
      const shortKey = this.stripPrefix(rawKey);
      const session = await this.redis.get<SessionData>(shortKey);
      if (session && session.refreshTokenHash === refreshTokenHash) {
        await this.redis.del(shortKey);
        return true;
      }
    }
    return false;
  }

  private stripPrefix(rawKey: string): string {
    return rawKey.replace(this.redis.key(''), '').replace(/^nexa:/, '');
  }

  /** Revoke all sessions for a user. */
  async revokeAllUserSessions(userId: string): Promise<number> {
    return this.redis.delByPattern(`sessions:${userId}:*`);
  }

  /** Count active sessions for a user. */
  async countUserSessions(userId: string): Promise<number> {
    const keys = await this.redis.scanKeys(`sessions:${userId}:*`);
    return keys.length;
  }

  // ─── JWT Blacklist ───────────────────────────────────

  /** Blacklist a JWT so it cannot be used (for logout). */
  async blacklistAccessToken(jti: string, expiresInSeconds: number): Promise<void> {
    await this.redis.set(`blacklist:jwt:${jti}`, 'true', expiresInSeconds);
  }

  /** Check if a JWT has been blacklisted. */
  async isTokenBlacklisted(jti: string): Promise<boolean> {
    return this.redis.exists(`blacklist:jwt:${jti}`);
  }

  /** Remove expired blacklisted tokens (cleanup is automatic via TTL). */
  async countBlacklistedTokens(): Promise<number> {
    const keys = await this.redis.scanKeys('blacklist:jwt:*');
    return keys.length;
  }

  // ─── Token Rotation Tracking ─────────────────────────

  /** Track a refresh token chain to detect rotation attacks. */
  async trackTokenFamily(
    userId: string,
    oldTokenHash: string,
    newTokenHash: string,
  ): Promise<void> {
    const familyKey = `token-family:${userId}`;
    await this.redis.hset(familyKey, oldTokenHash, newTokenHash);
    await this.redis.expire(familyKey, 7 * 86400);
  }

  /** Check if a token was already rotated (theft detection). */
  async isTokenReused(userId: string, tokenHash: string): Promise<boolean> {
    return this.redis.hexists(`token-family:${userId}`, tokenHash);
  }
}
