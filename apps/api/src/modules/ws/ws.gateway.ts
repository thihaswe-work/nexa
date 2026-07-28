import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsException,
} from '@nestjs/websockets';
import { Injectable, Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../../database/database.service';
import { PresenceService } from '../../infrastructure/redis/presence.service';
import { RedisPubSubService } from '../../infrastructure/redis/redis-pubsub.service';
import { WsConnectionManager } from './ws.connection.manager';
import { WsEvent, WsRoom } from './ws.events';
import {
  TypingEvent,
  MessageDeliveredEvent,
  MessageReadEvent,
  ConversationReadEvent,
} from './dto/ws-events.dto';

@Injectable()
@WebSocketGateway({
  namespace: '/',
  pingInterval: 25000,
  pingTimeout: 20000,
})
export class WsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WsGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly db: DatabaseService,
    private readonly presenceService: PresenceService,
    private readonly connectionManager: WsConnectionManager,
    private readonly pubSubService: RedisPubSubService,
  ) {}

  // ─── Auth Middleware ──────────────────────────────────

  async handleConnection(socket: Socket): Promise<void> {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.query?.token as string;

      if (!token) {
        this.logger.warn(`Socket ${socket.id} connected without token — disconnecting`);
        socket.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);
      const userId = payload.sub;

      const user = await this.db.user.findUnique({
        where: { id: userId },
        select: { id: true, isActive: true, deletedAt: true },
      });

      if (!user || !user.isActive || user.deletedAt) {
        socket.disconnect();
        return;
      }

      // Attach user data to socket
      (socket as any).userId = userId;
      (socket as any).userRole = payload.role;

      // Register in connection manager and join rooms
      await this.connectionManager.register(userId, socket.id);
      socket.join(WsRoom.user(userId));

      // Update presence
      const wasOffline = !(await this.presenceService.isOnline(userId));
      await this.presenceService.setOnline(userId);

      // Broadcast online status to others if this is the first connection
      if (wasOffline) {
        this.server.emit(WsEvent.USER_ONLINE, {
          userId,
          status: 'online',
        });
        await this.pubSubService.publishPresenceChange(userId, 'online');
      }

      this.logger.log(`Socket ${socket.id} connected — user ${userId}`);
    } catch (error) {
      this.logger.warn(`Socket ${socket.id} auth failed: ${(error as Error).message}`);
      socket.disconnect();
    }
  }

  async handleDisconnect(socket: Socket): Promise<void> {
    const userId = (socket as any).userId;
    if (!userId) return;

    // Unregister this socket
    const removedUserId = await this.connectionManager.unregister(socket.id);
    if (!removedUserId) return;

    // Check if user still has active sockets
    const hasOtherConnections = await this.connectionManager.isUserConnected(userId);

    if (!hasOtherConnections) {
      // User has no more sockets — mark offline
      await this.presenceService.setOffline(userId);

      this.server.emit(WsEvent.USER_OFFLINE, {
        userId,
        status: 'offline',
        lastSeenAt: new Date().toISOString(),
      });

      await this.pubSubService.publishPresenceChange(userId, 'offline');
    } else {
      // Still connected from another device — just log the partial disconnect
      const count = await this.connectionManager.countUserConnections(userId);
      this.logger.log(`User ${userId} disconnected from socket ${socket.id} — ${count} remaining`);
    }

    this.logger.log(`Socket ${socket.id} disconnected — user ${userId}`);
  }

  // ─── Typing Events ────────────────────────────────────

  @SubscribeMessage(WsEvent.TYPING_START)
  async handleTypingStart(socket: Socket, payload: TypingEvent): Promise<void> {
    const userId = (socket as any).userId;
    if (!userId) return;

    socket.to(WsRoom.conversation(payload.conversationId)).emit(WsEvent.TYPING_START, {
      conversationId: payload.conversationId,
      userId,
    });
  }

  @SubscribeMessage(WsEvent.TYPING_STOP)
  async handleTypingStop(socket: Socket, payload: TypingEvent): Promise<void> {
    const userId = (socket as any).userId;
    if (!userId) return;

    socket.to(WsRoom.conversation(payload.conversationId)).emit(WsEvent.TYPING_STOP, {
      conversationId: payload.conversationId,
      userId,
    });
  }

  // ─── Message Delivery Events ──────────────────────────

  @SubscribeMessage(WsEvent.MESSAGE_DELIVERED)
  async handleMessageDelivered(socket: Socket, payload: MessageDeliveredEvent): Promise<void> {
    const userId = (socket as any).userId;
    if (!userId) return;

    try {
      const message = await this.db.message.findUnique({
        where: { id: payload.messageId },
        select: { id: true, senderId: true, conversationId: true, deliveredAt: true },
      });

      if (!message || message.deliveredAt) return;

      const now = new Date();
      await this.db.message.update({
        where: { id: payload.messageId },
        data: { deliveredAt: now },
      });

      await this.db.conversationParticipant.updateMany({
        where: {
          conversationId: message.conversationId,
          userId,
        },
        data: { lastDeliveredAt: now },
      });

      // Notify the sender that the message was delivered
      this.server.to(WsRoom.user(message.senderId)).emit(WsEvent.MESSAGE_STATUS, {
        messageId: payload.messageId,
        conversationId: message.conversationId,
        status: 'delivered',
        timestamp: now.toISOString(),
      });
    } catch (error) {
      this.logger.error(`Failed to mark message delivered: ${(error as Error).message}`);
      socket.emit(WsEvent.ERROR, { code: 'DELIVERY_FAILED', message: 'Failed to mark message as delivered' });
    }
  }

  @SubscribeMessage(WsEvent.MESSAGE_READ)
  async handleMessageRead(socket: Socket, payload: MessageReadEvent): Promise<void> {
    const userId = (socket as any).userId;
    if (!userId) return;

    try {
      const now = new Date();

      // Mark all specified messages as read
      await this.db.message.updateMany({
        where: {
          id: { in: payload.messageIds },
          readAt: null,
        },
        data: { readAt: now },
      });

      // Get senders to notify them
      const messages = await this.db.message.findMany({
        where: { id: { in: payload.messageIds } },
        select: { id: true, senderId: true, conversationId: true },
      });

      // Update conversation lastReadAt
      await this.db.conversationParticipant.updateMany({
        where: {
          conversationId: payload.conversationId,
          userId,
        },
        data: { lastReadAt: now },
      });

      // Notify each sender that their messages were read
      const senderIds = [...new Set(messages.map((m) => m.senderId))];
      const readEvent: ConversationReadEvent = {
        conversationId: payload.conversationId,
        lastReadAt: now.toISOString(),
      };

      for (const senderId of senderIds) {
        this.server.to(WsRoom.user(senderId)).emit(WsEvent.CONVERSATION_READ, readEvent);
      }

      // Emit per-message read status
      for (const message of payload.messageIds) {
        this.server.to(WsRoom.user(messages.find((m) => m.id === message)?.senderId ?? '')).emit(WsEvent.MESSAGE_STATUS, {
          messageId: message,
          conversationId: payload.conversationId,
          status: 'read',
          timestamp: now.toISOString(),
        });
      }
    } catch (error) {
      this.logger.error(`Failed to mark messages read: ${(error as Error).message}`);
      socket.emit(WsEvent.ERROR, { code: 'READ_FAILED', message: 'Failed to mark messages as read' });
    }
  }

  // ─── Join Conversation Room ───────────────────────────

  @SubscribeMessage('conversation:join')
  async handleJoinConversation(socket: Socket, conversationId: string): Promise<void> {
    const userId = (socket as any).userId;
    if (!userId) return;

    const participant = await this.db.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (!participant) {
      socket.emit(WsEvent.ERROR, { code: 'FORBIDDEN', message: 'You are not a participant in this conversation' });
      return;
    }

    socket.join(WsRoom.conversation(conversationId));
  }

  @SubscribeMessage('conversation:leave')
  async handleLeaveConversation(socket: Socket, conversationId: string): Promise<void> {
    socket.leave(WsRoom.conversation(conversationId));
  }

  // ─── Send Event to User (for REST API use) ────────────

  sendToUser(userId: string, event: string, data: any): void {
    this.server.to(WsRoom.user(userId)).emit(event, data);
  }

  sendToConversation(conversationId: string, event: string, data: any): void {
    this.server.to(WsRoom.conversation(conversationId)).emit(event, data);
  }
}
