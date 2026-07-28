import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../infrastructure/redis/redis.service';

const SOCKET_TTL = 86400;

@Injectable()
export class WsConnectionManager {
  private readonly logger = new Logger(WsConnectionManager.name);

  constructor(private readonly redis: RedisService) {}

  /** Register a user-to-socket mapping. */
  async register(userId: string, socketId: string): Promise<void> {
    const client = this.redis.getRawClient();
    await Promise.all([
      client.sadd(this.redis.key(`socket:user:${userId}`), socketId),
      client.setex(this.redis.key(`socket:sid:${socketId}`), SOCKET_TTL, userId),
    ]);
  }

  /** Remove a socket mapping. Returns the userId if known. */
  async unregister(socketId: string): Promise<string | null> {
    const userId = await this.redis.get<string>(`socket:sid:${socketId}`);
    if (userId) {
      const client = this.redis.getRawClient();
      await Promise.all([
        client.srem(this.redis.key(`socket:user:${userId}`), socketId),
        this.redis.del(`socket:sid:${socketId}`),
      ]);
    }
    return userId;
  }

  /** Get all socket IDs for a user. */
  async getUserSockets(userId: string): Promise<string[]> {
    const client = this.redis.getRawClient();
    return client.smembers(this.redis.key(`socket:user:${userId}`));
  }

  /** Get the userId associated with a socket. */
  async getUserIdBySocket(socketId: string): Promise<string | null> {
    return this.redis.get<string>(`socket:sid:${socketId}`);
  }

  /** Get the number of active sockets for a user. */
  async countUserConnections(userId: string): Promise<number> {
    const client = this.redis.getRawClient();
    return client.scard(this.redis.key(`socket:user:${userId}`));
  }

  /** Check if a user is connected to any socket. */
  async isUserConnected(userId: string): Promise<boolean> {
    const count = await this.countUserConnections(userId);
    return count > 0;
  }

  /** Get all users currently connected to any socket. */
  async getAllConnectedUserIds(): Promise<string[]> {
    const client = this.redis.getRawClient();
    const keys = await client.keys(this.redis.key('socket:user:*'));
    return keys.map((k) => k.replace(this.redis.key('socket:user:'), ''));
  }

  /** Get total active socket count. */
  async getTotalConnectionCount(): Promise<number> {
    const client = this.redis.getRawClient();
    const keys = await client.keys(this.redis.key('socket:sid:*'));
    return keys.length;
  }

  /** Remove stale socket entries (run on a timer). */
  async cleanStaleSockets(): Promise<number> {
    const client = this.redis.getRawClient();
    const userKeys = await client.keys(this.redis.key('socket:user:*'));
    let cleaned = 0;
    for (const key of userKeys) {
      const members = await client.smembers(key);
      for (const socketId of members) {
        const exists = await this.redis.exists(`socket:sid:${socketId}`);
        if (!exists) {
          await client.srem(key, socketId);
          cleaned++;
        }
      }
    }
    if (cleaned > 0) {
      this.logger.log(`Cleaned ${cleaned} stale socket entries`);
    }
    return cleaned;
  }
}
