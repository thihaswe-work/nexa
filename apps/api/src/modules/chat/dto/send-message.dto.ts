import { IsOptional, IsString, IsEnum, IsUUID, MaxLength, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageType, AttachmentType } from '@prisma/client';
import { Type } from 'class-transformer';

export class AttachmentUploadDto {
  @ApiProperty({ description: 'S3 key returned from file upload' })
  @IsString()
  key!: string;

  @ApiProperty({ enum: AttachmentType })
  @IsEnum(AttachmentType)
  type!: AttachmentType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  fileSize?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  width?: number;

  @ApiPropertyOptional()
  @IsOptional()
  height?: number;

  @ApiPropertyOptional()
  @IsOptional()
  duration?: number;
}

export class SendMessageDto {
  @IsString()
  @MaxLength(5000)
  content!: string;

  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType;

  @IsOptional()
  @IsUUID()
  replyToId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentUploadDto)
  @ApiPropertyOptional({ type: [AttachmentUploadDto] })
  attachments?: AttachmentUploadDto[];
}

export class EditMessageDto {
  @IsString()
  @MaxLength(5000)
  content!: string;
}

export class AddReactionDto {
  @IsString()
  @MaxLength(100)
  emoji!: string;
}
