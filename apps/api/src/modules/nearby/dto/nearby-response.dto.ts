import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NearbyUserDto {
  @ApiProperty({ description: 'User ID (obfuscated hash for privacy)' })
  userId: string;

  @ApiProperty({ example: 'John Doe' })
  displayName: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  avatarUrl?: string;

  @ApiProperty({ example: 450, description: 'Approximate distance in meters (rounded to 10m)' })
  approximateDistance: number;

  @ApiProperty({ example: '~500m', description: 'Human-readable distance label' })
  distanceLabel: string;

  @ApiProperty({ example: true, description: 'Whether the user is currently online' })
  isOnline: boolean;

  @ApiProperty({ example: 'Photography', description: 'First interest as a conversation starter' })
  commonInterest?: string;
}

export class LocationUpdateResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 3 })
  nearbyCount: number;
}

export class NearbySearchResponseDto {
  @ApiProperty({ example: 40.713, description: 'Approximate latitude (rounded to ~100m precision)' })
  approximateLat: number;

  @ApiProperty({ example: -74.006, description: 'Approximate longitude (rounded to ~100m precision)' })
  approximateLng: number;

  @ApiProperty({ example: 1000, description: 'Search radius in meters' })
  radius: number;

  @ApiProperty({ example: 12 })
  total: number;

  @ApiProperty({ type: [NearbyUserDto] })
  users: NearbyUserDto[];
}
