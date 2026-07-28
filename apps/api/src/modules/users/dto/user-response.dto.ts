import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class InterestDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  category?: string;

  @ApiPropertyOptional()
  icon?: string;
}

class ProfileDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  displayName: string;

  @ApiPropertyOptional()
  bio?: string;

  @ApiPropertyOptional()
  avatarUrl?: string;

  @ApiPropertyOptional()
  coverUrl?: string;

  @ApiPropertyOptional()
  phoneNumber?: string;

  @ApiPropertyOptional()
  dateOfBirth?: string;

  @ApiPropertyOptional()
  gender?: string;

  @ApiPropertyOptional()
  city?: string;

  @ApiPropertyOptional()
  country?: string;

  @ApiProperty()
  isNearbyVisible: boolean;

  @ApiProperty({ type: [InterestDto] })
  interests: InterestDto[];

  @ApiProperty()
  createdAt: Date;
}

class PrivacyDto {
  @ApiProperty()
  showLastSeen: boolean;

  @ApiProperty()
  showOnline: boolean;

  @ApiProperty()
  showLocation: boolean;

  @ApiProperty()
  allowFriendRequests: boolean;

  @ApiProperty()
  allowMessagesFrom: string;
}

export class UserProfileResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  role: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  isOnline: boolean;

  @ApiPropertyOptional()
  lastLoginAt?: Date;

  @ApiProperty()
  emailVerified: boolean;

  @ApiProperty({ type: ProfileDto })
  profile: ProfileDto;

  @ApiProperty({ type: PrivacyDto })
  privacy: PrivacyDto;

  @ApiProperty()
  createdAt: Date;
}

export class AvatarResponseDto {
  @ApiProperty()
  avatarUrl: string;
}
