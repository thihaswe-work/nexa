import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';

export enum AllowMessagesFrom {
  EVERYONE = 'everyone',
  FRIENDS = 'friends',
  NOBODY = 'nobody',
}

export class UpdatePrivacyDto {
  @ApiPropertyOptional({ example: true, description: 'Show last seen status' })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  showLastSeen?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Show online status' })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  showOnline?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Show location on map' })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  showLocation?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Allow friend requests' })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  allowFriendRequests?: boolean;

  @ApiPropertyOptional({ example: 'everyone', enum: AllowMessagesFrom, description: 'Who can send messages' })
  @IsOptional()
  @IsEnum(AllowMessagesFrom)
  allowMessagesFrom?: AllowMessagesFrom;
}
