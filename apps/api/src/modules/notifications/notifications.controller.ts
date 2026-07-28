import {
  Controller, Get, Post, Patch, Delete,
  Param, Query, Body, HttpCode, HttpStatus, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from '../../infrastructure/notifications/notification.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaginationDto } from '../chat/dto/pagination.dto';
import { IsUUID } from 'class-validator';

class MarkReadDto {
  @IsUUID()
  id!: string;
}

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications for current user' })
  async list(
    @CurrentUser('id') userId: string,
    @Query() pagination: PaginationDto,
  ) {
    const limit = pagination.limit ?? 50;
    const offset = pagination.offset ?? 0;
    return this.notifications.getUserNotifications(userId, limit, offset);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a notification as read' })
  async markRead(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    await this.notifications.markAsRead(id, userId);
    return { success: true };
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllRead(
    @CurrentUser('id') userId: string,
  ): Promise<{ success: boolean }> {
    await this.notifications.markAllAsRead(userId);
    return { success: true };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a notification' })
  async delete(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<void> {
    await this.notifications.deleteNotification(id, userId);
  }
}
