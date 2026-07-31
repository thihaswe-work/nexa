import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RedisService } from './redis.service';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  totalLimit: number;
}

const RATE_LIMIT_LUA = `
  local key = KEYS[1]
  local limit = tonumber(ARGV[1])
  local window = tonumber(ARGV[2])
  local now = tonumber(ARGV[3])

  local clearBefore = now - window
  redis.call('ZREMRANGEBYSCORE', key, 0, clearBefore)

  local count = redis.call('ZCARD', key)
  if count >= limit then
    local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
    local resetAt = tonumber(oldest[2]) + window
    return {0, limit - count, resetAt, limit}
  end

  redis.call('ZADD', key, now, now .. ':' .. math.random())
  redis.call('EXPIRE', key, window)
  return {1, limit - count - 1, now + window, limit}
`;

@Injectable()
export class RateLimitService implements OnModuleInit {
  private readonly logger = new Logger(RateLimitService.name);
  private scriptSha: string | null = null;

  constructor(private readonly redis: RedisService) {}

  async onModuleInit(): Promise<void> {
    await this.loadScript();
  }

  private async loadScript(): Promise<void> {
    try {
      this.scriptSha = await this.redis.getRawClient().script('LOAD', RATE_LIMIT_LUA) as string;
    } catch (error) {
      this.logger.warn(`Rate limit script load failed: ${(error as Error).message}`);
    }
  }

  /**
   * Sliding-window rate limit check.
   *
   * @param namespace - Category (e.g. 'auth:login', 'api:general')
   * @param key       - Unique identifier (userId, IP, etc.)
   * @param limit     - Max requests in the window
   * @param windowSeconds - Time window in seconds
   */
  async check(
    namespace: string,
    key: string,
    limit: number,
    windowSeconds: number,
  ): Promise<RateLimitResult> {
    const redisKey = `ratelimit:${namespace}:${key}`;
    const now = Date.now();

    try {
      if (this.scriptSha) {
        const result = await this.redis.eval(
          this.scriptSha,
          [this.redis.key(redisKey)],
          [limit, windowSeconds * 1000, now],
        );
        const [allowed, remaining, resetAt, totalLimit] = result as [number, number, number, number];
        return {
          allowed: allowed === 1,
          remaining: Math.max(0, remaining),
          resetAt,
          totalLimit,
        };
      }
    } catch {
      // Fall through to non-script implementation
    }

    // Fallback: non-atomic implementation
    return this.checkWithoutScript(redisKey, limit, windowSeconds);
  }

  /** Get the remaining quota without consuming a request. */
  async getRemaining(
    namespace: string,
    key: string,
    limit: number,
    windowSeconds: number,
  ): Promise<number> {
    const redisKey = `ratelimit:${namespace}:${key}`;
    const now = Date.now();
    const clearBefore = now - windowSeconds * 1000;
    await this.redis.zremrangebyscore(redisKey, 0, clearBefore);
    return limit - (await this.redis.zcard(redisKey));
  }

  /** Reset a rate limit counter. */
  async reset(namespace: string, key: string): Promise<void> {
    await this.redis.del(`ratelimit:${namespace}:${key}`);
  }

  private async checkWithoutScript(
    redisKey: string,
    limit: number,
    windowSeconds: number,
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const clearBefore = now - windowMs;

    await this.redis.zremrangebyscore(redisKey, 0, clearBefore);
    const count = await this.redis.zcard(redisKey);

    if (count >= limit) {
      const oldest = await this.redis.zrangebyscore(redisKey, 0, now, 0, 1);
      let resetAt = now + windowMs;
      if (oldest.length > 0) {
        const parts = oldest[0].split(':');
        const ts = parseInt(parts[0], 10);
        if (!isNaN(ts)) resetAt = ts + windowMs;
      }
      return { allowed: false, remaining: 0, resetAt, totalLimit: limit };
    }

    const member = `${now}:${Math.random().toString(36).slice(2, 8)}`;
    await this.redis.getRawClient().zadd(this.redis.key(redisKey), now, member);
    await this.redis.expire(redisKey, windowSeconds);
    const remaining = limit - count - 1;

    return { allowed: true, remaining, resetAt: now + windowMs, totalLimit: limit };
  }
}
