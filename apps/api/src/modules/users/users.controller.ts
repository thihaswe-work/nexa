import {
  Controller,
  Get,
  Patch,
  Post,
  Put,
  Delete,
  Body,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  Param,
  ParseBoolPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePrivacyDto } from './dto/update-privacy.dto';
import { UpdateInterestsDto } from './dto/update-interests.dto';
import {
  UserProfileResponseDto,
  AvatarResponseDto,
} from './dto/user-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile with interests and privacy' })
  @ApiResponse({ status: 200, type: UserProfileResponseDto })
  async getProfile(
    @CurrentUser('sub') userId: string,
  ): Promise<UserProfileResponseDto> {
    return this.usersService.getProfile(userId);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update profile information' })
  @ApiResponse({ status: 200, type: UserProfileResponseDto })
  async updateProfile(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateProfileDto,
  ): Promise<UserProfileResponseDto> {
    return this.usersService.updateProfile(userId, dto);
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  @ApiOperation({ summary: 'Upload profile avatar' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file (jpeg, png, webp, gif)',
        },
      },
    },
  })
  @ApiResponse({ status: 200, type: AvatarResponseDto })
  async uploadAvatar(
    @CurrentUser('sub') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<AvatarResponseDto> {
    return this.usersService.uploadAvatar(userId, file);
  }

  @Delete('avatar')
  @ApiOperation({ summary: 'Remove profile avatar' })
  @ApiResponse({ status: 200, description: 'Avatar removed' })
  async deleteAvatar(@CurrentUser('sub') userId: string): Promise<{ message: string }> {
    await this.usersService.deleteAvatar(userId);
    return { message: 'Avatar removed successfully' };
  }

  @Put('interests')
  @ApiOperation({ summary: 'Set profile interests' })
  @ApiResponse({
    status: 200,
    schema: {
      example: { interests: [{ id: 'uuid', name: 'Photography', category: 'Arts' }] },
    },
  })
  async updateInterests(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateInterestsDto,
  ) {
    return this.usersService.updateInterests(userId, dto);
  }

  @Get('privacy')
  @ApiOperation({ summary: 'Get privacy settings' })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        showLastSeen: true,
        showOnline: true,
        showLocation: true,
        allowFriendRequests: true,
        allowMessagesFrom: 'everyone',
      },
    },
  })
  async getPrivacy(@CurrentUser('sub') userId: string) {
    return this.usersService.getPrivacySettings(userId);
  }

  @Patch('privacy')
  @ApiOperation({ summary: 'Update privacy settings' })
  async updatePrivacy(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdatePrivacyDto,
  ) {
    return this.usersService.updatePrivacySettings(userId, dto);
  }

  @Patch('nearby-visibility')
  @ApiOperation({ summary: 'Enable or disable nearby visibility' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { visible: { type: 'boolean' } },
    },
  })
  async setNearbyVisibility(
    @CurrentUser('sub') userId: string,
    @Body('visible', ParseBoolPipe) visible: boolean,
  ): Promise<{ isNearbyVisible: boolean }> {
    return this.usersService.setNearbyVisibility(userId, visible);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get public profile by user ID' })
  async getPublicProfile(@Param('id') userId: string) {
    return this.usersService.getPublicProfile(userId);
  }
}
