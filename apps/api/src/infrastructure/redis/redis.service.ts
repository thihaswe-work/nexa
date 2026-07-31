import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis, { RedisOptions, ChainableCommander } from 'ioredis';
import { AppConfigService } from '../../config/config.service';

export type RedisValue = string | number | Buffer;
export type RedisPipeline = ChainableCommander;

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;
  private subscriber: Redis;
  private readonly prefix: string;

  constructor(private readonly configService: AppConfigService) {
    this.prefix = configService.redisPrefix;
    const options: RedisOptions = {
      retryStrategy: (times) => {
        const delay = Math.min(times * 100, 3000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableOfflineQueue: false,
      lazyConnect: true,
    };
    this.client = new Redis(configService.redisUrl, options);
    this.subscriber = new Redis(configService.redisUrl, options);
  }

  async onModuleInit(): Promise<void> {
    this.client.on('connect', () => this.logger.log('Redis connected'));
    this.client.on('error', (error) => this.logger.error(`Redis error: ${error.message}`));
    this.client.on('close', () => this.logger.warn('Redis connection closed'));

    this.subscriber.on('error', (error) => this.logger.error(`Redis subscriber error: ${error.message}`));

    try {
      if (this.client.status === 'wait') {
        await this.client.connect();
      }
      if (this.subscriber.status === 'wait') {
        await this.subscriber.connect();
      }
      await this.client.ping();
      this.logger.log('Redis ready');
    } catch (error) {
      this.logger.error(`Redis connection failed: ${(error as Error).message}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await Promise.all([
        this.client.quit(),
        this.subscriber.quit(),
      ]);
    } catch (error) {
      this.logger.warn(`Redis disconnect failed: ${(error as Error).message}`);
    }
    this.logger.log('Redis disconnected');
  }

  getRawClient(): Redis {
    return this.client;
  }

  getSubscriber(): Redis {
    return this.subscriber;
  }

  /** Build a namespaced key. */
  key(...parts: string[]): string {
    return `${this.prefix}${parts.join(':')}`;
  }

  // ─── String Operations ─────────────────────────────────

  async get<T = string>(key: string): Promise<T | null> {
    const value = await this.client.get(this.buildKey(key));
    if (value === null) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<'OK'> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttlSeconds) {
      return this.client.setex(this.buildKey(key), ttlSeconds, serialized);
    }
    return this.client.set(this.buildKey(key), serialized);
  }

  async setNx(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    const fullKey = this.buildKey(key);
    const result = ttlSeconds
      ? await this.client.set(fullKey, serialized, 'PX', ttlSeconds * 1000, 'NX')
      : await this.client.setnx(fullKey, serialized);
    return result === 'OK' || result === 1;
  }

  async del(key: string): Promise<number> {
    return this.client.del(this.buildKey(key));
  }

  async scanKeys(pattern: string): Promise<string[]> {
    const fullPattern = this.buildKey(pattern);
    const keys: string[] = [];
    let cursor = '0';
    do {
      const [nextCursor, batch] = await this.client.scan(cursor, 'MATCH', fullPattern, 'COUNT', 100);
      cursor = nextCursor;
      keys.push(...batch);
    } while (cursor !== '0');
    return keys;
  }

  async delByPattern(pattern: string): Promise<number> {
    const keys = await this.scanKeys(pattern);
    if (keys.length === 0) return 0;
    return this.client.del(...keys);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(this.buildKey(key));
    return result === 1;
  }

  async ttl(key: string): Promise<number> {
    return this.client.ttl(this.buildKey(key));
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    const result = await this.client.expire(this.buildKey(key), seconds);
    return result === 1;
  }

  async incr(key: string): Promise<number> {
    return this.client.incr(this.buildKey(key));
  }

  async incrBy(key: string, increment: number): Promise<number> {
    return this.client.incrby(this.buildKey(key), increment);
  }

  // ─── Hash Operations ─────────────────────────────────

  async hget<T = string>(key: string, field: string): Promise<T | null> {
    const value = await this.client.hget(this.buildKey(key), field);
    if (value === null) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  async hset(key: string, field: string, value: any): Promise<number> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    return this.client.hset(this.buildKey(key), field, serialized);
  }

  async hmset(key: string, data: Record<string, any>): Promise<'OK'> {
    const serialized: Record<string, string> = {};
    for (const [k, v] of Object.entries(data)) {
      serialized[k] = typeof v === 'string' ? v : JSON.stringify(v);
    }
    return this.client.hmset(this.buildKey(key), serialized);
  }

  async hdel(key: string, ...fields: string[]): Promise<number> {
    return this.client.hdel(this.buildKey(key), ...fields);
  }

  async hgetall<T = Record<string, any>>(key: string): Promise<T | null> {
    const result = await this.client.hgetall(this.buildKey(key));
    if (Object.keys(result).length === 0) return null;
    const parsed: Record<string, any> = {};
    for (const [k, v] of Object.entries(result)) {
      try { parsed[k] = JSON.parse(v); } catch { parsed[k] = v; }
    }
    return parsed as T;
  }

  async hexists(key: string, field: string): Promise<boolean> {
    const result = await this.client.hexists(this.buildKey(key), field);
    return result === 1;
  }

  async hincrby(key: string, field: string, increment: number): Promise<number> {
    return this.client.hincrby(this.buildKey(key), field, increment);
  }

  async hlen(key: string): Promise<number> {
    return this.client.hlen(this.buildKey(key));
  }

  async hkeys(key: string): Promise<string[]> {
    return this.client.hkeys(this.buildKey(key));
  }

  async hvals<T = any>(key: string): Promise<T[]> {
    const values = await this.client.hvals(this.buildKey(key));
    return values.map((v) => {
      try { return JSON.parse(v); } catch { return v; }
    }) as T[];
  }

  // ─── Set Operations ──────────────────────────────────

  async sadd(key: string, ...members: string[]): Promise<number> {
    return this.client.sadd(this.buildKey(key), ...members);
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    return this.client.srem(this.buildKey(key), ...members);
  }

  async smembers(key: string): Promise<string[]> {
    return this.client.smembers(this.buildKey(key));
  }

  async sismember(key: string, member: string): Promise<boolean> {
    const result = await this.client.sismember(this.buildKey(key), member);
    return result === 1;
  }

  async scard(key: string): Promise<number> {
    return this.client.scard(this.buildKey(key));
  }

  async srandmember(key: string): Promise<string | null> {
    return this.client.srandmember(this.buildKey(key));
  }

  async srandmemberCount(key: string, count: number): Promise<string[]> {
    return this.client.srandmember(this.buildKey(key), count) as Promise<string[]>;
  }

  // ─── Sorted Set Operations ──────────────────────────────

  async zadd(key: string, score: number, member: string): Promise<number> {
    return this.client.zadd(this.buildKey(key), score, member);
  }

  async zrem(key: string, ...members: string[]): Promise<number> {
    return this.client.zrem(this.buildKey(key), ...members);
  }

  async zscore(key: string, member: string): Promise<number | null> {
    const result = await this.client.zscore(this.buildKey(key), member);
    return result ? parseFloat(result) : null;
  }

  async zrangebyscore(key: string, min: number | string, max: number | string, offset?: number, count?: number): Promise<string[]> {
    if (offset !== undefined && count !== undefined) {
      return this.client.zrangebyscore(this.buildKey(key), min, max, 'LIMIT', offset, count);
    }
    return this.client.zrangebyscore(this.buildKey(key), min, max);
  }

  async zremrangebyscore(key: string, min: number | string, max: number | string): Promise<number> {
    return this.client.zremrangebyscore(this.buildKey(key), min, max);
  }

  async zcard(key: string): Promise<number> {
    return this.client.zcard(this.buildKey(key));
  }

  async zcount(key: string, min: number | string, max: number | string): Promise<number> {
    return this.client.zcount(this.buildKey(key), min, max);
  }

  // ─── Pub/Sub ─────────────────────────────────────────

  async publish(channel: string, message: string): Promise<number> {
    return this.client.publish(this.buildKey(channel), message);
  }

  async subscribe(channel: string, handler: (message: string, channel: string) => void): Promise<void> {
    const fullChannel = this.buildKey(channel);
    await this.subscriber.subscribe(fullChannel);
    this.subscriber.on('message', (ch: string, msg: string) => {
      if (ch === fullChannel) handler(msg, channel);
    });
  }

  async unsubscribe(channel: string): Promise<void> {
    await this.subscriber.unsubscribe(this.buildKey(channel));
  }

  // ─── Pipeline ─────────────────────────────────────────

  pipeline(): RedisPipeline {
    return this.client.pipeline();
  }

  multi(): RedisPipeline {
    return this.client.multi();
  }

  // ─── Lua Script ───────────────────────────────────────

  async eval(script: string, keys: string[], args: (string | number)[]): Promise<any> {
    return this.client.eval(script, keys.length, ...keys, ...args);
  }

  // ─── Health ───────────────────────────────────────────

  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }

  async info(): Promise<string> {
    return this.client.info();
  }

  async flushDb(): Promise<'OK'> {
    return this.client.flushdb();
  }

  private buildKey(suffix: string): string {
    if (suffix.startsWith(this.prefix)) return suffix;
    return `${this.prefix}${suffix}`;
  }
}
