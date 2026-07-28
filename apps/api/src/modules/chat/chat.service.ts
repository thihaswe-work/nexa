import { Injectable, Logger, ForbiddenException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { LocationCacheService } from '../../infrastructure/redis/location-cache.service';
import { NotificationsService } from '../../infrastructure/notifications/notification.service';
import { WsGateway } from '../ws/ws.gateway';
import { WsEvent } from '../ws/ws.events';
import { SendMessageDto, EditMessageDto, AddReactionDto } from './dto/send-message.dto';
import { CreatePrivateConversationDto, CreateNearbyConversationDto } from './dto/create-conversation.dto';
import { PaginationDto } from './dto/pagination.dto';
import { NearbyChatQueryDto } from './dto/nearby-chat-query.dto';
import { MessageDto, MessageReactionDto, ReplyPreviewDto } from './dto/message-response.dto';
import { ConversationDto, ConversationParticipantDto, ConversationListDto } from './dto/conversation-response.dto';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly locationCache: LocationCacheService,
    private readonly wsGateway: WsGateway,
    private readonly notifications: NotificationsService,
  ) {}

  // ─── Conversations ─────────────────────────────

  async getConversations(userId: string, pagination: PaginationDto): Promise<ConversationListDto> {
    const limit = pagination.limit ?? 50;
    const offset = pagination.offset ?? 0;

    const [participants, total] = await Promise.all([
      this.db.conversationParticipant.findMany({
        where: { userId },
        include: {
          conversation: {
            include: {
              participants: {
                include: {
                  user: {
                    select: {
                      id: true,
                      profile: { select: { displayName: true, avatarUrl: true } },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { conversation: { lastMessageAt: { sort: 'desc', nulls: 'last' } } },
        take: limit,
        skip: offset,
      }),
      this.db.conversationParticipant.count({ where: { userId } }),
    ]);

    const conversations = await Promise.all(
      participants.map(async (p) => {
        const conv = p.conversation;
        const unreadCount = conv.lastMessageAt
          ? await this.db.message.count({
              where: {
                conversationId: conv.id,
                senderId: { not: userId },
                createdAt: { gt: p.lastReadAt },
                deletedAt: null,
              },
            })
          : 0;

        return this.toConversationDto(conv, unreadCount, userId);
      }),
    );

    return { conversations, total };
  }

  async getOrCreatePrivateConversation(userId: string, dto: CreatePrivateConversationDto): Promise<ConversationDto> {
    const existing = await this.db.conversation.findFirst({
      where: {
        isGroup: false,
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: dto.participantId } } },
        ],
        deletedAt: null,
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, profile: { select: { displayName: true, avatarUrl: true } } },
            },
          },
        },
      },
    });

    if (existing) {
      return this.toConversationDto(existing, 0, userId);
    }

    const conversation = await this.db.conversation.create({
      data: {
        isGroup: false,
        createdByUserId: userId,
        participants: {
          createMany: {
            data: [
              { userId },
              { userId: dto.participantId },
            ],
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, profile: { select: { displayName: true, avatarUrl: true } } },
            },
          },
        },
      },
    });

    const dto_result = this.toConversationDto(conversation, 0, userId);

    // Notify both participants
    for (const p of conversation.participants) {
      this.wsGateway.sendToUser(p.userId, WsEvent.CHAT_CONVERSATION_CREATED, dto_result);
    }

    return dto_result;
  }

  async createNearbyConversation(userId: string, dto: CreateNearbyConversationDto): Promise<ConversationDto> {
    const conversation = await this.db.conversation.create({
      data: {
        name: dto.name,
        isGroup: true,
        isLocationBased: true,
        locationLat: dto.lat,
        locationLng: dto.lng,
        locationRadius: dto.radius ?? 1000,
        locationName: dto.name,
        createdByUserId: userId,
        participants: {
          create: { userId },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, profile: { select: { displayName: true, avatarUrl: true } } },
            },
          },
        },
      },
    });

    return this.toConversationDto(conversation, 0, userId);
  }

  async getNearbyRooms(userId: string, query: NearbyChatQueryDto): Promise<ConversationListDto> {
    const radius = query.radius ?? 5000;

    let lat: number | undefined = query.lat;
    let lng: number | undefined = query.lng;

    if (lat === undefined || lng === undefined) {
      const cached = await this.locationCache.getLocation(userId);
      if (cached) {
        lat = cached.lat;
        lng = cached.lng;
      } else {
        const result = await this.db.$queryRaw<{ lat: number; lng: number }[]>`
          SELECT lat, lng FROM profiles
          WHERE user_id = ${userId}::uuid AND deleted_at IS NULL AND lat IS NOT NULL AND lng IS NOT NULL
          LIMIT 1
        `;
        if (result.length > 0) {
          lat = result[0].lat;
          lng = result[0].lng;
        }
      }
    }

    if (lat === undefined || lng === undefined) {
      return { conversations: [], total: 0 };
    }

    const rows = await this.db.$queryRaw<{
      id: string; name: string | null; locationName: string | null;
      locationLat: number; locationLng: number; locationRadius: number;
      distanceMeters: number; participantCount: number;
    }[]>`
      SELECT
        c.id, c.name, c.location_name AS "locationName",
        c.location_lat AS "locationLat", c.location_lng AS "locationLng",
        c.location_radius AS "locationRadius",
        ST_Distance(
          ST_SetSRID(ST_MakePoint(c.location_lng, c.location_lat), 4326)::geography,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
        ) AS "distanceMeters",
        (SELECT COUNT(*) FROM conversation_participants cp WHERE cp.conversation_id = c.id) AS "participantCount"
      FROM conversations c
      WHERE c.is_location_based = true
        AND c.deleted_at IS NULL
        AND ST_DWithin(
          ST_SetSRID(ST_MakePoint(c.location_lng, c.location_lat), 4326)::geography,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
          ${radius}
        )
      ORDER BY "distanceMeters" ASC
      LIMIT 50
    `;

    const isUserIn = new Map<string, boolean>();
    if (rows.length > 0) {
      const convIds = rows.map((r) => r.id) as string[];
      const memberships = await this.db.conversationParticipant.findMany({
        where: { conversationId: { in: convIds }, userId },
        select: { conversationId: true },
      });
      for (const m of memberships) {
        isUserIn.set(m.conversationId, true);
      }
    }

    const conversations: ConversationDto[] = rows.map((r) => ({
      id: r.id,
      name: r.name ?? undefined,
      isGroup: true as boolean,
      isLocationBased: true as boolean,
      locationLat: r.locationLat,
      locationLng: r.locationLng,
      locationRadius: r.locationRadius,
      locationName: r.locationName ?? undefined,
      unreadCount: 0,
      participantCount: Number(r.participantCount),
      distanceMeters: Math.round(Number(r.distanceMeters)),
      isJoined: isUserIn.has(r.id),
      participants: [],
      createdAt: undefined,
    } as any));

    return { conversations, total: conversations.length };
  }

  async joinNearbyRoom(userId: string, conversationId: string): Promise<void> {
    const conv = await this.db.conversation.findUnique({
      where: { id: conversationId },
      select: { id: true, isLocationBased: true, deletedAt: true },
    });

    if (!conv || conv.deletedAt) throw new NotFoundException('Conversation not found');
    if (!conv.isLocationBased) throw new ForbiddenException('Not a location-based room');

    await this.db.conversationParticipant.upsert({
      where: { conversationId_userId: { conversationId, userId } },
      update: {},
      create: { conversationId, userId },
    });
  }

  async leaveNearbyRoom(userId: string, conversationId: string): Promise<void> {
    await this.db.conversationParticipant.deleteMany({
      where: { conversationId, userId },
    });
  }

  // ─── Messages ─────────────────────────────────

  async getMessages(userId: string, conversationId: string, pagination: PaginationDto): Promise<{
    messages: MessageDto[]; total: number; hasMore: boolean;
  }> {
    await this.assertParticipant(userId, conversationId);

    const limit = pagination.limit ?? 50;
    const offset = pagination.offset ?? 0;

    const [rows, total] = await Promise.all([
      this.db.message.findMany({
        where: { conversationId, deletedAt: null },
        include: {
          sender: {
            select: {
              id: true,
              profile: { select: { displayName: true, avatarUrl: true } },
            },
          },
          attachments: { where: { deletedAt: null } },
          reactions: { where: { deletedAt: null } },
          replyTo: {
            select: {
              id: true,
              content: true,
              senderId: true,
              sender: { select: { profile: { select: { displayName: true } } } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        skip: offset,
      }),
      this.db.message.count({ where: { conversationId, deletedAt: null } }),
    ]);

    const hasMore = rows.length > limit;
    const messages = rows.slice(0, limit).reverse().map((m) => this.toMessageDto(m));

    return { messages, total, hasMore };
  }

  async sendMessage(userId: string, conversationId: string, dto: SendMessageDto): Promise<MessageDto> {
    await this.assertParticipant(userId, conversationId);

    const message = await this.db.message.create({
      data: {
        conversationId,
        senderId: userId,
        content: dto.content,
        type: dto.type ?? 'TEXT',
        replyToId: dto.replyToId ?? null,
        ...(dto.attachments?.length ? {
          attachments: {
            create: dto.attachments.map((a) => ({
              type: a.type,
              url: a.key,
              fileName: a.fileName,
              fileSize: a.fileSize,
              mimeType: a.mimeType,
              width: a.width,
              height: a.height,
              duration: a.duration,
            })),
          },
        } : {}),
      },
      include: {
        sender: {
          select: {
            id: true,
            profile: { select: { displayName: true, avatarUrl: true } },
          },
        },
        attachments: { where: { deletedAt: null } },
        reactions: { where: { deletedAt: null } },
        replyTo: {
          select: {
            id: true,
            content: true,
            senderId: true,
            sender: { select: { profile: { select: { displayName: true } } } },
          },
        },
      },
    });

    // Update conversation preview
    const preview = dto.content.length > 200 ? dto.content.substring(0, 197) + '...' : dto.content;
    await this.db.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: message.createdAt, lastMessagePreview: preview },
    });

    const dto_result = this.toMessageDto(message);

    // Broadcast to conversation room
    this.wsGateway.sendToConversation(conversationId, WsEvent.CHAT_MESSAGE_CREATED, dto_result);

    // Send push notifications to other participants
    const otherParticipants = await this.db.conversationParticipant.findMany({
      where: { conversationId, userId: { not: userId } },
      select: {
        userId: true,
        user: {
          select: {
            profile: { select: { displayName: true } },
          },
        },
      },
    });

    for (const p of otherParticipants) {
      this.notifications.notifyNewMessage({
        recipientUserId: p.userId,
        senderName: dto_result.senderName,
        senderId: userId,
        conversationId,
        messageId: message.id,
        content: dto.content,
      }).catch((err) => this.logger.error(`Failed to notify user ${p.userId}: ${err.message}`));
    }

    return dto_result;
  }

  async editMessage(userId: string, messageId: string, dto: EditMessageDto): Promise<MessageDto> {
    const message = await this.db.message.findUnique({
      where: { id: messageId },
      select: { id: true, senderId: true, conversationId: true, deletedAt: true },
    });

    if (!message || message.deletedAt) throw new NotFoundException('Message not found');
    if (message.senderId !== userId) throw new ForbiddenException('Cannot edit another user\'s message');

    const updated = await this.db.message.update({
      where: { id: messageId },
      data: {
        content: dto.content,
        editedAt: new Date(),
        editCount: { increment: 1 },
      },
      include: {
        sender: {
          select: {
            id: true,
            profile: { select: { displayName: true, avatarUrl: true } },
          },
        },
        attachments: { where: { deletedAt: null } },
        reactions: { where: { deletedAt: null } },
        replyTo: {
          select: {
            id: true,
            content: true,
            senderId: true,
            sender: { select: { profile: { select: { displayName: true } } } },
          },
        },
      },
    });

    const dto_result = this.toMessageDto(updated);
    this.wsGateway.sendToConversation(message.conversationId, WsEvent.CHAT_MESSAGE_UPDATED, dto_result);

    return dto_result;
  }

  async deleteMessage(userId: string, messageId: string): Promise<void> {
    const message = await this.db.message.findUnique({
      where: { id: messageId },
      select: { id: true, senderId: true, conversationId: true, deletedAt: true },
    });

    if (!message || message.deletedAt) throw new NotFoundException('Message not found');
    if (message.senderId !== userId) throw new ForbiddenException('Cannot delete another user\'s message');

    await this.db.message.update({
      where: { id: messageId },
      data: { deletedAt: new Date(), content: null },
    });

    this.wsGateway.sendToConversation(message.conversationId, WsEvent.CHAT_MESSAGE_DELETED, {
      messageId,
      conversationId: message.conversationId,
    });
  }

  // ─── Reactions ────────────────────────────────

  async addReaction(userId: string, messageId: string, dto: AddReactionDto): Promise<MessageReactionDto> {
    const message = await this.db.message.findUnique({
      where: { id: messageId },
      select: { id: true, conversationId: true, deletedAt: true },
    });

    if (!message || message.deletedAt) throw new NotFoundException('Message not found');

    await this.db.messageReaction.upsert({
      where: { messageId_userId_emoji: { messageId, userId, emoji: dto.emoji } },
      update: { deletedAt: null },
      create: { messageId, userId, emoji: dto.emoji },
    });

    const reaction: MessageReactionDto = {
      emoji: dto.emoji,
      userId,
      createdAt: new Date().toISOString(),
    };

    this.wsGateway.sendToConversation(message.conversationId, WsEvent.CHAT_REACTION_ADDED, {
      messageId,
      reaction,
    });

    return reaction;
  }

  async removeReaction(userId: string, messageId: string, emoji: string): Promise<void> {
    const message = await this.db.message.findUnique({
      where: { id: messageId },
      select: { id: true, conversationId: true, deletedAt: true },
    });

    if (!message || message.deletedAt) throw new NotFoundException('Message not found');

    await this.db.messageReaction.deleteMany({
      where: { messageId, userId, emoji },
    });

    this.wsGateway.sendToConversation(message.conversationId, WsEvent.CHAT_REACTION_REMOVED, {
      messageId,
      userId,
      emoji,
    });
  }

  // ─── Helpers ──────────────────────────────────

  private async assertParticipant(userId: string, conversationId: string): Promise<void> {
    const participant = await this.db.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!participant) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }
  }

  private toConversationDto(conv: any, unreadCount: number, currentUserId: string): ConversationDto {
    const participants: ConversationParticipantDto[] = conv.participants?.map((p: any) => ({
      userId: p.user.id,
      displayName: p.user.profile?.displayName ?? 'Unknown',
      avatarUrl: p.user.profile?.avatarUrl ?? undefined,
      joinedAt: p.joinedAt?.toISOString?.() ?? p.joinedAt,
      lastReadAt: p.lastReadAt?.toISOString?.() ?? p.lastReadAt,
      lastDeliveredAt: p.lastDeliveredAt?.toISOString?.() ?? p.lastDeliveredAt,
    })) ?? [];

    return {
      id: conv.id,
      name: conv.name,
      isGroup: conv.isGroup,
      isLocationBased: conv.isLocationBased ?? false,
      locationLat: conv.locationLat ?? undefined,
      locationLng: conv.locationLng ?? undefined,
      locationRadius: conv.locationRadius ?? undefined,
      locationName: conv.locationName ?? undefined,
      unreadCount,
      lastMessagePreview: conv.lastMessagePreview ?? undefined,
      lastMessageAt: conv.lastMessageAt?.toISOString?.() ?? conv.lastMessageAt,
      participants,
      createdAt: conv.createdAt?.toISOString?.() ?? conv.createdAt,
    };
  }

  private toMessageDto(m: any): MessageDto {
    const reactions: MessageReactionDto[] = m.reactions?.map((r: any) => ({
      emoji: r.emoji,
      userId: r.userId,
      createdAt: r.createdAt?.toISOString?.() ?? r.createdAt,
    })) ?? [];

    const attachments = m.attachments?.map((a: any) => ({
      id: a.id,
      type: a.type,
      url: a.url,
      fileName: a.fileName ?? undefined,
      fileSize: a.fileSize ?? undefined,
      mimeType: a.mimeType ?? undefined,
      width: a.width ?? undefined,
      height: a.height ?? undefined,
      duration: a.duration ?? undefined,
    })) ?? [];

    let replyTo: ReplyPreviewDto | undefined;
    if (m.replyTo) {
      replyTo = {
        id: m.replyTo.id,
        content: m.replyTo.content ?? '',
        senderId: m.replyTo.senderId,
        senderName: m.replyTo.sender?.profile?.displayName ?? 'Unknown',
      };
    }

    return {
      id: m.id,
      conversationId: m.conversationId,
      senderId: m.sender.id,
      senderName: m.sender.profile?.displayName ?? 'Unknown',
      senderAvatarUrl: m.sender.profile?.avatarUrl ?? undefined,
      content: m.content ?? undefined,
      type: m.type,
      deliveredAt: m.deliveredAt?.toISOString?.() ?? m.deliveredAt,
      readAt: m.readAt?.toISOString?.() ?? m.readAt,
      editedAt: m.editedAt?.toISOString?.() ?? m.editedAt,
      editCount: m.editCount ?? 0,
      reactions,
      attachments,
      replyTo,
      createdAt: m.createdAt?.toISOString?.() ?? m.createdAt,
    };
  }
}
