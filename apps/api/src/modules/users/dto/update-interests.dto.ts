import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsUUID } from 'class-validator';

export class UpdateInterestsDto {
  @ApiProperty({
    example: ['550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440001'],
    description: 'Array of interest IDs',
  })
  @IsArray()
  @IsString({ each: true })
  @IsUUID('4', { each: true })
  interestIds: string[];
}
