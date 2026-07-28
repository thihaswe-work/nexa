import { Injectable, Logger } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import { DatabaseService } from '../../database/database.service';
import { NotificationQueueService } from './notification-queue.service';

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  data?: Record<string, any>;
}

export interface SendMessageNotificationParams {
  recipientUserId: string;
  senderName: string;
  senderId: string;
  conversationId: string;
  messageId: string;
  content: string;
}

export interface SendFriendRequestNotificationParams {
  toUserId: string;
  fromUserId: string;
  fromName: string;
  friendRequestId: string;
}

export interface SendNearbyInviteNotificationParams {
  toUserId: string;
  fromUserId: string;
  fromName: string;
  locationName: string;
  conversationId: string;
}

export interface SendAnnouncementParams {
  userIds: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface NotificationResult {
  inAppId?: string;
  pushSent: boolean;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly queue: NotificationQueueService,
  ) {}

  // ─── In-App Notification ────────────────────

  async createInApp(params: CreateNotificationParams): Promise<string> {
    const notification = await this.db.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        body: params.body,
        data: (params.data ?? {}) as Prisma.JsonObject,
      },
    });
    return notification.id;
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await this.db.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.db.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async getUserNotifications(
    userId: string,
    limit = 50,
    offset = 0,
  ): Promise<{ notifications: any[]; total: number; unreadCount: number }> {
    const [notifications, total, unreadCount] = await Promise.all([
      this.db.notification.findMany({
        where: { userId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.db.notification.count({ where: { userId, deletedAt: null } }),
      this.db.notification.count({ where: { userId, isRead: false, deletedAt: null } }),
    ]);

    return { notifications, total, unreadCount };
  }

  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    await this.db.notification.updateMany({
      where: { id: notificationId, userId },
      data: { deletedAt: new Date() },
    });
  }

  // ─── Helper: resolve FCM tokens ─────────────

  private async getUserFcmTokens(userId: string): Promise<string[]> {
    const devices = await this.db.device.findMany({
      where: { userId, isActive: true, deletedAt: null, fcmToken: { not: null } },
      select: { fcmToken: true },
    });
    return devices.map((d) => d.fcmToken!).filter(Boolean);
  }

  // ─── High-Level Notification Senders ────────

  async notifyNewMessage(params: SendMessageNotificationParams): Promise<NotificationResult> {
    const inAppId = await this.createInApp({
      userId: params.recipientUserId,
      type: NotificationType.MESSAGE,
      title: params.senderName,
      body: params.content.length > 200 ? params.content.slice(0, 197) + '...' : params.content,
      data: {
        type: 'MESSAGE',
        conversationId: params.conversationId,
        messageId: params.messageId,
        senderId: params.senderId,
      },
    });

    const tokens = await this.getUserFcmTokens(params.recipientUserId);
    if (tokens.length > 0) {
      await this.queue.enqueueMessagePush({
        tokens,
        conversationId: params.conversationId,
        messageId: params.messageId,
        senderName: params.senderName,
        senderId: params.senderId,
        content: params.content,
      });
    }

    return { inAppId, pushSent: tokens.length > 0 };
  }

  async notifyFriendRequest(params: SendFriendRequestNotificationParams): Promise<NotificationResult> {
    const inAppId = await this.createInApp({
      userId: params.toUserId,
      type: NotificationType.FRIEND_REQUEST,
      title: 'Friend Request',
      body: `${params.fromName} sent you a friend request`,
      data: {
        type: 'FRIEND_REQUEST',
        fromUserId: params.fromUserId,
        friendRequestId: params.friendRequestId,
      },
    });

    const tokens = await this.getUserFcmTokens(params.toUserId);
    if (tokens.length > 0) {
      await this.queue.enqueueFriendRequestPush({
        tokens,
        fromUserId: params.fromUserId,
        fromName: params.fromName,
        friendRequestId: params.friendRequestId,
      });
    }

    return { inAppId, pushSent: tokens.length > 0 };
  }

  async notifyFriendAccepted(params: { toUserId: string; fromName: string }): Promise<NotificationResult> {
    const inAppId = await this.createInApp({
      userId: params.toUserId,
      type: NotificationType.FRIEND_ACCEPTED,
      title: 'Friend Request Accepted',
      body: `${params.fromName} accepted your friend request`,
      data: { type: 'FRIEND_ACCEPTED', fromName: params.fromName },
    });

    const tokens = await this.getUserFcmTokens(params.toUserId);
    if (tokens.length > 0) {
      await this.queue.enqueueFriendRequestPush({
        tokens,
        fromUserId: '',
        fromName: params.fromName,
        friendRequestId: '',
      });
    }

    return { inAppId, pushSent: tokens.length > 0 };
  }

  async notifyNearbyInvite(params: SendNearbyInviteNotificationParams): Promise<NotificationResult> {
    const inAppId = await this.createInApp({
      userId: params.toUserId,
      type: NotificationType.NEARBY_INVITE,
      title: 'Nearby Invitation',
      body: `${params.fromName} invited you to ${params.locationName}`,
      data: {
        type: 'NEARBY_INVITE',
        fromUserId: params.fromUserId,
        conversationId: params.conversationId,
        locationName: params.locationName,
      },
    });

    const tokens = await this.getUserFcmTokens(params.toUserId);
    if (tokens.length > 0) {
      await this.queue.enqueueNearbyInvitePush({
        tokens,
        fromUserId: params.fromUserId,
        fromName: params.fromName,
        locationName: params.locationName,
        conversationId: params.conversationId,
      });
    }

    return { inAppId, pushSent: tokens.length > 0 };
  }

  async notifyAnnouncement(params: SendAnnouncementParams): Promise<void> {
    const tokensByUser: { userId: string; tokens: string[] }[] = [];

    for (const userId of params.userIds) {
      await this.createInApp({
        userId,
        type: NotificationType.ANNOUNCEMENT,
        title: params.title,
        body: params.body,
        data: params.data,
      });

      const tokens = await this.getUserFcmTokens(userId);
      tokensByUser.push({ userId, tokens });
    }

    await this.queue.enqueueAnnouncementPush({
      tokensByUser,
      title: params.title,
      body: params.body,
      data: params.data,
    });
  }
}
