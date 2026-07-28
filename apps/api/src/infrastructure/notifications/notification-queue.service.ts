import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { AppConfigService } from '../../config/config.service';
import { QUEUES, JOBS, DEFAULT_JOB_OPTIONS } from './notification.constants';
import { FcmService, FcmMessage } from './fcm.service';

export interface MessagePushData {
  tokens: string[];
  conversationId: string;
  messageId: string;
  senderName: string;
  senderId: string;
  content: string;
}

export interface FriendRequestPushData {
  tokens: string[];
  fromUserId: string;
  fromName: string;
  friendRequestId: string;
}

export interface NearbyInvitePushData {
  tokens: string[];
  fromUserId: string;
  fromName: string;
  locationName: string;
  conversationId: string;
}

export interface AnnouncementPushData {
  tokensByUser: { userId: string; tokens: string[] }[];
  title: string;
  body: string;
  data?: Record<string, string>;
}

@Injectable()
export class NotificationQueueService implements OnModuleDestroy {
  private readonly logger = new Logger(NotificationQueueService.name);
  private readonly connection: Redis;
  private readonly queues: Map<string, Queue> = new Map();
  private readonly workers: Worker[] = [];

  constructor(
    private readonly config: AppConfigService,
    private readonly fcmService: FcmService,
  ) {
    this.connection = new Redis(config.redisUrl, {
      maxRetriesPerRequest: null,
      enableOfflineQueue: false,
    });

    this.setupQueues();
    this.setupWorkers();
  }

  private setupQueues(): void {
    for (const name of Object.values(QUEUES)) {
      this.queues.set(name, new Queue(name, { connection: this.connection }));
    }
  }

  private setupWorkers(): void {
    const concurrency = this.config.bullmqConcurrency;

    const handlers: Record<string, (job: Job) => Promise<void>> = {
      [JOBS.SEND_MESSAGE_PUSH]: (job) => this.sendToTokens(job.data.tokens, job.data),
      [JOBS.SEND_FRIEND_REQUEST_PUSH]: (job) => this.sendToTokens(job.data.tokens, job.data),
      [JOBS.SEND_NEARBY_INVITE_PUSH]: (job) => this.sendToTokens(job.data.tokens, job.data),
      [JOBS.SEND_ANNOUNCEMENT_PUSH]: async (job) => {
        const data = job.data as AnnouncementPushData;
        for (const entry of data.tokensByUser) {
          if (entry.tokens.length > 0) {
            await this.sendToTokens(entry.tokens, { ...data, userId: entry.userId });
          }
        }
      },
    };

    for (const [queueName, handler] of Object.entries(handlers)) {
      const worker = new Worker(queueName, handler, {
        connection: this.connection,
        concurrency,
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      });

      worker.on('completed', (job) => {
        this.logger.debug(`Job ${job.name} (${job.id}) completed`);
      });

      worker.on('failed', (job, error) => {
        this.logger.error(`Job ${job?.name} (${job?.id}) failed after ${job?.attemptsMade} attempts: ${error.message}`);
      });

      this.workers.push(worker);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all([
      ...Array.from(this.queues.values()).map((q) => q.close()),
      ...this.workers.map((w) => w.close()),
      this.connection.quit(),
    ]);
  }

  // ─── Enqueue Methods ────────────────────────

  async enqueueMessagePush(data: MessagePushData): Promise<void> {
    if (data.tokens.length === 0) return;
    await this.queues.get(QUEUES.MESSAGE)!.add(JOBS.SEND_MESSAGE_PUSH, data, DEFAULT_JOB_OPTIONS);
  }

  async enqueueFriendRequestPush(data: FriendRequestPushData): Promise<void> {
    if (data.tokens.length === 0) return;
    await this.queues.get(QUEUES.FRIEND_REQUEST)!.add(JOBS.SEND_FRIEND_REQUEST_PUSH, data, DEFAULT_JOB_OPTIONS);
  }

  async enqueueNearbyInvitePush(data: NearbyInvitePushData): Promise<void> {
    if (data.tokens.length === 0) return;
    await this.queues.get(QUEUES.NEARBY_INVITE)!.add(JOBS.SEND_NEARBY_INVITE_PUSH, data, DEFAULT_JOB_OPTIONS);
  }

  async enqueueAnnouncementPush(data: AnnouncementPushData): Promise<void> {
    const hasTokens = data.tokensByUser.some((e) => e.tokens.length > 0);
    if (!hasTokens) return;
    await this.queues.get(QUEUES.ANNOUNCEMENT)!.add(JOBS.SEND_ANNOUNCEMENT_PUSH, data, DEFAULT_JOB_OPTIONS);
  }

  // ─── Shared Sender ──────────────────────────

  private async sendToTokens(tokens: string[], data: any): Promise<void> {
    const notification = this.buildNotification(data);
    const dataPayload = this.buildDataPayload(data);

    const messages: FcmMessage[] = tokens.map((token) => ({
      token,
      notification,
      data: dataPayload,
    }));

    if (messages.length > 0) {
      await this.fcmService.sendMulticast(messages);
    }
  }

  private buildNotification(data: any): { title: string; body: string } {
    if (data.type === 'MESSAGE' || data.senderName) {
      return {
        title: data.senderName ?? 'New Message',
        body: data.content?.length > 150 ? data.content.slice(0, 147) + '...' : (data.content ?? ''),
      };
    }
    if (data.type === 'FRIEND_REQUEST' || data.friendRequestId) {
      return {
        title: 'Friend Request',
        body: `${data.fromName ?? 'Someone'} sent you a friend request`,
      };
    }
    if (data.type === 'NEARBY_INVITE' || data.locationName) {
      return {
        title: 'Nearby Invitation',
        body: `${data.fromName ?? 'Someone'} invited you to join ${data.locationName ?? 'a nearby chat'}`,
      };
    }
    return { title: data.title ?? 'Notification', body: data.body ?? '' };
  }

  private buildDataPayload(data: any): Record<string, string> {
    const payload: Record<string, string> = {};
    if (data.type) payload.type = data.type;
    if (data.conversationId) payload.conversationId = data.conversationId;
    if (data.senderId) payload.senderId = data.senderId;
    if (data.messageId) payload.messageId = data.messageId;
    if (data.friendRequestId) payload.friendRequestId = data.friendRequestId;
    if (data.fromUserId) payload.fromUserId = data.fromUserId;
    if (data.locationName) payload.locationName = data.locationName;
    return payload;
  }
}
