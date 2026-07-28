import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  HttpException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBearerAuth,
  ApiExtraModels,
  refs,
} from '@nestjs/swagger';
import { NearbyService } from './nearby.service';
import { UpdateLocationDto } from './dto/update-location.dto';
import { NearbyQueryDto } from './dto/nearby-query.dto';
import {
  NearbySearchResponseDto,
  LocationUpdateResponseDto,
} from './dto/nearby-response.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Nearby')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('nearby')
export class NearbyController {
  constructor(private readonly nearbyService: NearbyService) {}

  @Patch('location')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update current location' })
  @ApiOkResponse({ type: LocationUpdateResponseDto })
  async updateLocation(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateLocationDto,
  ): Promise<LocationUpdateResponseDto> {
    return this.nearbyService.updateLocation(userId, dto);
  }

  @Get('users')
  @ApiOperation({ summary: 'Find nearby users' })
  @ApiOkResponse({ type: NearbySearchResponseDto })
  async findNearby(
    @CurrentUser('sub') userId: string,
    @Query() query: NearbyQueryDto,
  ): Promise<NearbySearchResponseDto> {
    if (!query.radius && !query.limit) {
      const hasLocation = await this.nearbyService.getLocation(userId);
      if (!hasLocation) {
        throw new HttpException(
          'No location set. Please update your location first.',
          HttpStatus.PRECONDITION_FAILED,
        );
      }
    }

    return this.nearbyService.findNearby(userId, query);
  }

  @Post('location/clear')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear current location and go offline' })
  @ApiOkResponse({ description: 'Location cleared' })
  async clearLocation(
    @CurrentUser('sub') userId: string,
  ): Promise<{ success: boolean }> {
    await this.nearbyService.clearLocation(userId);
    return { success: true };
  }
}
