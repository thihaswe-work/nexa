import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { InterestsService } from './interests.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Interests')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('interests')
export class InterestsController {
  constructor(private readonly interestsService: InterestsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all available interests' })
  async findAll() {
    return this.interestsService.findAll();
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get interests grouped by category' })
  async getByCategories() {
    return this.interestsService.getByCategories();
  }
}
