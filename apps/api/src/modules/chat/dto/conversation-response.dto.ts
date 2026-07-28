import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ConversationParticipantDto {
  @ApiProperty()
  userId!: string;

  @ApiProperty()
  displayName!: string;

  @ApiPropertyOptional()
  avatarUrl?: string;

  @ApiProperty()
  joinedAt!: string;

  @ApiProperty()
  lastReadAt!: string;

  @ApiPropertyOptional()
  lastDeliveredAt?: string;
}

export class ConversationDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional()
  name?: string;

  @ApiProperty()
  isGroup!: boolean;

  @ApiProperty()
  isLocationBased!: boolean;

  @ApiPropertyOptional()
  locationLat?: number;

  @ApiPropertyOptional()
  locationLng?: number;

  @ApiPropertyOptional()
  locationRadius?: number;

  @ApiPropertyOptional()
  locationName?: string;

  @ApiProperty()
  unreadCount!: number;

  @ApiPropertyOptional()
  participantCount?: number;

  @ApiPropertyOptional()
  distanceMeters?: number;

  @ApiPropertyOptional()
  isJoined?: boolean;

  @ApiPropertyOptional()
  lastMessagePreview?: string;

  @ApiPropertyOptional()
  lastMessageAt?: string;

  @ApiProperty()
  participants!: ConversationParticipantDto[];

  @ApiProperty()
  createdAt!: string;
}

export class ConversationListDto {
  @ApiProperty({ type: [ConversationDto] })
  conversations!: ConversationDto[];

  @ApiProperty()
  total!: number;
}
