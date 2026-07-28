import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateLocationDto {
  @ApiProperty({ example: 40.7128, description: 'Current latitude' })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({ example: -74.006, description: 'Current longitude' })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;
}
