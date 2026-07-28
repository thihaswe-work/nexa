import { IsOptional, IsString, IsUUID, IsNumber, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePrivateConversationDto {
  @IsUUID()
  participantId!: string;
}

export class CreateGroupConversationDto {
  @IsString()
  name!: string;

  @IsUUID('4', { each: true })
  participantIds!: string[];
}

export class CreateNearbyConversationDto {
  @IsString()
  name!: string;

  @IsNumber()
  @Min(-90)
  lat!: number;

  @IsNumber()
  @Min(-180)
  lng!: number;

  @IsOptional()
  @IsNumber()
  @Min(100)
  radius?: number;
}
