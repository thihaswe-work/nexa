import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';

export type MessageHandler = (message: string, channel: string) => void;

/**
 * Typed pub/sub for real-time communication.
 * Used for socket events, presence broadcasts, location updates, etc.
 */
@Injectable()
export class RedisPubSubService {
  private readonly logger = new Logger(RedisPubSubService.name);
  private readonly handlers = new Map<string, Set<MessageHandler>>();

  constructor(private readonly redis: RedisService) {}

  /** Publish a message to a channel. */
  async publish(channel: string, message: string): Promise<number> {
    return this.redis.publish(channel, message);
  }

  /** Publish a structured event to a channel (auto-serializes). */
  async publishEvent<T = any>(channel: string, event: string, payload: T): Promise<number> {
    return this.publish(channel, JSON.stringify({ event, payload, timestamp: new Date().toISOString() }));
  }

  /** Subscribe to a channel with a handler. */
  async subscribe(channel: string, handler: MessageHandler): Promise<void> {
    if (!this.handlers.has(channel)) {
      this.handlers.set(channel, new Set());
      await this.redis.subscribe(channel, (message, ch) => {
        const handlers = this.handlers.get(ch);
        if (handlers) {
          handlers.forEach((h) => h(message, ch));
        }
      });
    }
    this.handlers.get(channel)!.add(handler);
  }

  /** Remove a handler from a channel. */
  async unsubscribe(channel: string, handler?: MessageHandler): Promise<void> {
    if (handler) {
      const handlers = this.handlers.get(channel);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.handlers.delete(channel);
          await this.redis.unsubscribe(channel);
        }
      }
    } else {
      this.handlers.delete(channel);
      await this.redis.unsubscribe(channel);
    }
  }

  /** Get number of channels with active subscriptions. */
  get subscribedChannelCount(): number {
    return this.handlers.size;
  }

  // ─── Typed Channels ─────────────────────────────────

  /** Notify nearby users when a user updates their location. */
  async publishLocationUpdate(userId: string, approximateLat: number, approximateLng: number): Promise<void> {
    await this.publishEvent('location:updates', 'user_moved', {
      userId,
      approximateLat,
      approximateLng,
    });
  }

  /** Notify others when a user comes online / goes offline. */
  async publishPresenceChange(userId: string, status: string): Promise<void> {
    await this.publishEvent('presence:changes', 'status_change', {
      userId,
      status,
    });
  }

  /** Send a direct message notification to a user's channel. */
  async publishUserNotification(userId: string, notification: any): Promise<void> {
    await this.publishEvent(`user:${userId}`, 'notification', notification);
  }
}
