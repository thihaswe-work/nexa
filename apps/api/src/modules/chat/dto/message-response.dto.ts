import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MessageReactionDto {
  @ApiProperty()
  emoji!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  createdAt!: string;
}

export class MessageAttachmentDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  type!: string;

  @ApiProperty()
  url!: string;

  @ApiPropertyOptional()
  fileName?: string;

  @ApiPropertyOptional()
  fileSize?: number;

  @ApiPropertyOptional()
  mimeType?: string;

  @ApiPropertyOptional()
  width?: number;

  @ApiPropertyOptional()
  height?: number;

  @ApiPropertyOptional()
  duration?: number;
}

export class ReplyPreviewDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  content!: string;

  @ApiProperty()
  senderId!: string;

  @ApiProperty()
  senderName!: string;
}

export class MessageDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  conversationId!: string;

  @ApiProperty()
  senderId!: string;

  @ApiProperty()
  senderName!: string;

  @ApiPropertyOptional()
  senderAvatarUrl?: string;

  @ApiPropertyOptional()
  content?: string;

  @ApiProperty()
  type!: string;

  @ApiPropertyOptional()
  deliveredAt?: string;

  @ApiPropertyOptional()
  readAt?: string;

  @ApiPropertyOptional()
  editedAt?: string;

  @ApiProperty()
  editCount!: number;

  @ApiProperty({ type: [MessageReactionDto] })
  reactions!: MessageReactionDto[];

  @ApiProperty({ type: [MessageAttachmentDto] })
  attachments!: MessageAttachmentDto[];

  @ApiPropertyOptional({ type: ReplyPreviewDto })
  replyTo?: ReplyPreviewDto;

  @ApiProperty()
  createdAt!: string;
}

export class MessageListDto {
  @ApiProperty({ type: [MessageDto] })
  messages!: MessageDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  hasMore!: boolean;
}
