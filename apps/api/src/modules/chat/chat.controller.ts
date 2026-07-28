import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, HttpCode, HttpStatus, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreatePrivateConversationDto,
  CreateGroupConversationDto,
  CreateNearbyConversationDto,
} from './dto/create-conversation.dto';
import { SendMessageDto, EditMessageDto, AddReactionDto } from './dto/send-message.dto';
import { PaginationDto } from './dto/pagination.dto';
import { NearbyChatQueryDto } from './dto/nearby-chat-query.dto';
import { ConversationListDto, ConversationDto } from './dto/conversation-response.dto';
import { MessageListDto, MessageDto, MessageReactionDto } from './dto/message-response.dto';

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // ─── Conversations ───────────────────────────

  @Get('conversations')
  @ApiOperation({ summary: 'List user conversations' })
  @ApiOkResponse({ type: ConversationListDto })
  async getConversations(
    @CurrentUser('sub') userId: string,
    @Query() pagination: PaginationDto,
  ): Promise<ConversationListDto> {
    return this.chatService.getConversations(userId, pagination);
  }

  @Post('conversations/private')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get or create a private conversation' })
  @ApiOkResponse({ type: ConversationDto })
  async getOrCreatePrivate(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreatePrivateConversationDto,
  ): Promise<ConversationDto> {
    return this.chatService.getOrCreatePrivateConversation(userId, dto);
  }

  @Post('conversations/nearby')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a location-based nearby chat room' })
  @ApiOkResponse({ type: ConversationDto })
  async createNearby(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateNearbyConversationDto,
  ): Promise<ConversationDto> {
    return this.chatService.createNearbyConversation(userId, dto);
  }

  // ─── Messages ────────────────────────────────

  @Get('conversations/:conversationId/messages')
  @ApiOperation({ summary: 'Get message history with pagination' })
  @ApiOkResponse({ type: MessageListDto })
  async getMessages(
    @CurrentUser('sub') userId: string,
    @Param('conversationId') conversationId: string,
    @Query() pagination: PaginationDto,
  ): Promise<MessageListDto> {
    return this.chatService.getMessages(userId, conversationId, pagination);
  }

  @Post('conversations/:conversationId/messages')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send a message' })
  @ApiOkResponse({ type: MessageDto })
  async sendMessage(
    @CurrentUser('sub') userId: string,
    @Param('conversationId') conversationId: string,
    @Body() dto: SendMessageDto,
  ): Promise<MessageDto> {
    return this.chatService.sendMessage(userId, conversationId, dto);
  }

  @Patch('messages/:messageId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Edit a message' })
  @ApiOkResponse({ type: MessageDto })
  async editMessage(
    @CurrentUser('sub') userId: string,
    @Param('messageId') messageId: string,
    @Body() dto: EditMessageDto,
  ): Promise<MessageDto> {
    return this.chatService.editMessage(userId, messageId, dto);
  }

  @Delete('messages/:messageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a message' })
  async deleteMessage(
    @CurrentUser('sub') userId: string,
    @Param('messageId') messageId: string,
  ): Promise<void> {
    return this.chatService.deleteMessage(userId, messageId);
  }

  // ─── Reactions ───────────────────────────────

  @Post('messages/:messageId/reactions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add an emoji reaction' })
  @ApiOkResponse({ type: MessageReactionDto })
  async addReaction(
    @CurrentUser('sub') userId: string,
    @Param('messageId') messageId: string,
    @Body() dto: AddReactionDto,
  ): Promise<MessageReactionDto> {
    return this.chatService.addReaction(userId, messageId, dto);
  }

  @Delete('messages/:messageId/reactions/:emoji')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove an emoji reaction' })
  async removeReaction(
    @CurrentUser('sub') userId: string,
    @Param('messageId') messageId: string,
    @Param('emoji') emoji: string,
  ): Promise<void> {
    return this.chatService.removeReaction(userId, messageId, emoji);
  }

  // ─── Nearby Chat ─────────────────────────────

  @Get('nearby/rooms')
  @ApiOperation({ summary: 'Find nearby chat rooms based on location' })
  @ApiOkResponse({ type: ConversationListDto })
  async getNearbyRooms(
    @CurrentUser('sub') userId: string,
    @Query() query: NearbyChatQueryDto,
  ): Promise<ConversationListDto> {
    return this.chatService.getNearbyRooms(userId, query);
  }

  @Post('nearby/rooms/:conversationId/join')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Join a nearby chat room' })
  async joinNearbyRoom(
    @CurrentUser('sub') userId: string,
    @Param('conversationId') conversationId: string,
  ): Promise<{ success: boolean }> {
    await this.chatService.joinNearbyRoom(userId, conversationId);
    return { success: true };
  }

  @Post('nearby/rooms/:conversationId/leave')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Leave a nearby chat room' })
  async leaveNearbyRoom(
    @CurrentUser('sub') userId: string,
    @Param('conversationId') conversationId: string,
  ): Promise<{ success: boolean }> {
    await this.chatService.leaveNearbyRoom(userId, conversationId);
    return { success: true };
  }
}
