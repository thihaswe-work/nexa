import {
  Controller, Post, Get, Delete, Param, Query, Body, ForbiddenException,
  UseInterceptors, UploadedFile, HttpCode, HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { FilesService } from './files.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { DatabaseService } from '../../database/database.service';

@ApiTags('Files')
@ApiBearerAuth()
@Controller('files')
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly db: DatabaseService,
  ) {}

  @Post('upload/:category')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 100 * 1024 * 1024 },
    }),
  )
  @ApiOperation({ summary: 'Upload a file (image/video/audio/document)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Param('category') category: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.filesService.upload(file, category, userId);
  }

  @Get('signed-url')
  @ApiOperation({ summary: 'Get a signed URL for a stored file key' })
  async getSignedUrl(
    @CurrentUser('sub') userId: string,
    @Query('key') key: string,
    @Query('expiry') expiry?: string,
  ) {
    if (!key) {
      throw new ForbiddenException('Access denied');
    }

    const attachment = await this.db.messageAttachment.findFirst({
      where: { url: { contains: key } },
      include: {
        message: {
          include: {
            conversation: {
              include: {
                participants: {
                  where: { userId },
                  select: { userId: true },
                },
              },
            },
          },
        },
      },
    });

    const avatarProfile = await this.db.profile.findFirst({
      where: { avatarUrl: { contains: key }, deletedAt: null },
    });

    if (!attachment && !avatarProfile) {
      throw new ForbiddenException('Access denied');
    }

    if (attachment && attachment.message.conversation.participants.length === 0) {
      throw new ForbiddenException('Access denied');
    }

    const signedUrl = await this.filesService.getSignedUrl(
      key,
      expiry ? parseInt(expiry, 10) : undefined,
    );
    return { key, signedUrl };
  }

  @Delete('cleanup')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN')
  @ApiOperation({ summary: '[ADMIN] Remove orphaned files not referenced in the database' })
  async cleanupOrphaned(
    @Query('prefix') prefix?: string,
  ) {
    const deleted = await this.filesService.cleanupOrphaned(prefix);
    return { deleted };
  }
}