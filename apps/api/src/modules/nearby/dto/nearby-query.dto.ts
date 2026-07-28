import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsIn, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export const NEARBY_RADII = [100, 500, 1000, 5000] as const;
export type NearbyRadius = (typeof NEARBY_RADII)[number];

export class NearbyQueryDto {
  @ApiPropertyOptional({
    example: 1000,
    description: 'Search radius in meters',
    enum: [100, 500, 1000, 5000],
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([100, 500, 1000, 5000])
  @Min(100)
  @Max(5000)
  radius?: NearbyRadius;

  @ApiPropertyOptional({
    example: 20,
    description: 'Maximum number of results',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
