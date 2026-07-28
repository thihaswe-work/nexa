import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { StorageService, FileCategory } from '../../infrastructure/storage/storage.service';
import { DatabaseService } from '../../database/database.service';

const CATEGORY_MAP: Record<string, FileCategory> = {
  image: FileCategory.CHAT_IMAGE,
  video: FileCategory.CHAT_VIDEO,
  audio: FileCategory.CHAT_AUDIO,
  document: FileCategory.DOCUMENT,
};

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    private readonly storage: StorageService,
    private readonly db: DatabaseService,
  ) {}

  async upload(file: Express.Multer.File, category: string, userId: string) {
    const fileCategory = CATEGORY_MAP[category];
    if (!fileCategory) {
      throw new BadRequestException(
        `Invalid category "${category}". Use: image, video, audio, document`,
      );
    }

    const result = await this.storage.upload(file, fileCategory, userId);
    return {
      key: result.key,
      url: result.url,
      signedUrl: result.signedUrl,
      size: result.size,
      width: result.width,
      height: result.height,
      mimeType: result.mimeType,
    };
  }

  async getSignedUrl(key: string, expiry?: number): Promise<string> {
    return this.storage.generateSignedUrl(key, expiry);
  }

  async cleanupOrphaned(prefix?: string): Promise<number> {
    const allAttachments = await this.db.messageAttachment.findMany({
      where: { deletedAt: null },
      select: { url: true },
    });

    const keysToKeep: string[] = [];
    for (const att of allAttachments) {
      const key = await this.storage.extractKeyFromUrl(att.url);
      if (key) keysToKeep.push(key);
    }

    const allProfiles = await this.db.profile.findMany({
      where: { deletedAt: null, avatarUrl: { not: null } },
      select: { avatarUrl: true },
    });
    for (const p of allProfiles) {
      if (p.avatarUrl) {
        const key = await this.storage.extractKeyFromUrl(p.avatarUrl);
        if (key) keysToKeep.push(key);
      }
    }

    const allCovers = await this.db.profile.findMany({
      where: { deletedAt: null, coverUrl: { not: null } },
      select: { coverUrl: true },
    });
    for (const p of allCovers) {
      if (p.coverUrl) {
        const key = await this.storage.extractKeyFromUrl(p.coverUrl);
        if (key) keysToKeep.push(key);
      }
    }

    return this.storage.cleanupOrphaned(keysToKeep, prefix);
  }
}