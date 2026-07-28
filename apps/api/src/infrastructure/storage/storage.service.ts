import { Injectable, Logger, BadRequestException, OnModuleInit } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
  ObjectIdentifier,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';
import { AppConfigService } from '../../config/config.service';

export enum FileCategory {
  AVATAR = 'avatars',
  COVER = 'covers',
  CHAT_IMAGE = 'chat/images',
  CHAT_VIDEO = 'chat/videos',
  CHAT_AUDIO = 'chat/audio',
  DOCUMENT = 'documents',
  MISC = 'misc',
}

export interface UploadResult {
  key: string;
  url: string;
  signedUrl: string;
  size: number;
  width?: number;
  height?: number;
  mimeType: string;
}

export interface SignedUrlResult {
  key: string;
  signedUrl: string;
  expiresIn: number;
}

const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_MIMES = ['video/mp4', 'video/webm', 'video/quicktime'];
const ALLOWED_AUDIO_MIMES = ['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/mp4'];
const ALLOWED_DOCUMENT_MIMES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/csv',
];

const MAX_IMAGE_SIZE = 15 * 1024 * 1024;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;
const MAX_AUDIO_SIZE = 50 * 1024 * 1024;
const MAX_DOCUMENT_SIZE = 50 * 1024 * 1024;

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private client: S3Client | null = null;
  private bucket = '';
  private publicUrl = '';
  private signedUrlExpiry = 3600;
  private useLocalFallback = false;
  private readonly uploadDir: string;
  private readonly baseUrl: string;

  constructor(private readonly config: AppConfigService) {
    this.uploadDir = process.env.UPLOAD_DIR || './uploads';
    this.baseUrl = process.env.APP_URL || 'http://localhost:4000';
  }

  async onModuleInit(): Promise<void> {
    if (this.config.isS3Configured) {
      this.client = new S3Client({
        endpoint: this.config.s3Endpoint,
        region: this.config.s3Region,
        credentials: {
          accessKeyId: this.config.s3AccessKeyId,
          secretAccessKey: this.config.s3SecretAccessKey,
        },
        forcePathStyle: true,
      });
      this.bucket = this.config.s3Bucket;
      this.publicUrl = this.config.s3PublicUrl || `${this.config.s3Endpoint}/${this.bucket}`;
      this.signedUrlExpiry = this.config.s3SignedUrlExpiry;
      this.logger.log(`S3 client initialized: endpoint=${this.config.s3Endpoint}, bucket=${this.bucket}`);
    } else {
      this.useLocalFallback = true;
      for (const cat of Object.values(FileCategory)) {
        this.ensureDir(path.join(this.uploadDir, cat));
      }
      this.logger.warn('S3 not configured — using local filesystem fallback');
    }
  }

  async upload(
    file: Express.Multer.File,
    category: FileCategory,
    userId: string,
    options?: { compress?: boolean; maxWidth?: number; maxHeight?: number },
  ): Promise<UploadResult> {
    this.validateFile(file, category);

    let buffer = file.buffer;
    let width: number | undefined;
    let height: number | undefined;
    const mimeType = file.mimetype;

    if (this.isImage(mimeType) && options?.compress !== false) {
      const compressed = await this.compressImage(
        buffer,
        mimeType,
        options?.maxWidth ?? 2000,
        options?.maxHeight ?? 2000,
      );
      buffer = compressed.buffer;
      width = compressed.width;
      height = compressed.height;
    }

    const ext = this.extensionFromMime(mimeType);
    const key = `${category}/${userId}_${uuidv4().slice(0, 12)}${ext}`;

    if (this.useLocalFallback) {
      const filepath = path.join(this.uploadDir, key);
      this.ensureDir(path.dirname(filepath));
      fs.writeFileSync(filepath, buffer);
      const url = `${this.baseUrl}/uploads/${key}`;
      return { key, url, signedUrl: url, size: buffer.length, width, height, mimeType };
    }

    await this.client!.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      CacheControl: 'public, max-age=31536000',
    }));

    const signedUrl = await this.generateSignedUrl(key);
    const url = `${this.publicUrl}/${key}`;

    this.logger.debug(`Uploaded ${category}/${key} (${buffer.length} bytes)`);

    return { key, url, signedUrl, size: buffer.length, width, height, mimeType };
  }

  async delete(key: string): Promise<void> {
    if (!key) return;

    if (this.useLocalFallback) {
      const filepath = path.join(this.uploadDir, key);
      try {
        fs.unlinkSync(filepath);
        this.logger.debug(`Deleted local file: ${key}`);
      } catch {
        // file may not exist
      }
      return;
    }

    try {
      await this.client!.send(new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }));
      this.logger.debug(`Deleted S3 object: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete S3 object ${key}: ${(error as Error).message}`);
    }
  }

  async deleteByPrefix(prefix: string): Promise<number> {
    if (this.useLocalFallback) return 0;

    let deleted = 0;
    let continuationToken: string | undefined;

    try {
      do {
        const listResult = await this.client!.send(new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        }));

        if (!listResult.Contents || listResult.Contents.length === 0) break;

        const objects: ObjectIdentifier[] = listResult.Contents
          .filter((obj) => obj.Key)
          .map((obj) => ({ Key: obj.Key! }));

        await this.client!.send(new DeleteObjectsCommand({
          Bucket: this.bucket,
          Delete: { Objects: objects, Quiet: true },
        }));

        deleted += objects.length;
        continuationToken = listResult.NextContinuationToken;
      } while (continuationToken);

      this.logger.log(`Deleted ${deleted} objects with prefix ${prefix}`);
    } catch (error) {
      this.logger.error(`Failed to delete objects by prefix ${prefix}: ${(error as Error).message}`);
    }

    return deleted;
  }

  async generateSignedUrl(key: string, expirySeconds?: number): Promise<string> {
    if (this.useLocalFallback) {
      return `${this.baseUrl}/uploads/${key}`;
    }

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.client!, command, {
      expiresIn: expirySeconds ?? this.signedUrlExpiry,
    });
  }

  async getSignedUrls(keys: string[], expirySeconds?: number): Promise<SignedUrlResult[]> {
    return Promise.all(
      keys.map(async (key) => ({
        key,
        signedUrl: await this.generateSignedUrl(key, expirySeconds),
        expiresIn: expirySeconds ?? this.signedUrlExpiry,
      })),
    );
  }

  async extractKeyFromUrl(url: string): Promise<string | null> {
    if (this.useLocalFallback) {
      const prefix = '/uploads/';
      const idx = url.indexOf(prefix);
      if (idx === -1) return null;
      return url.slice(idx + prefix.length);
    }

    const publicPrefix = `${this.publicUrl}/`;
    if (url.startsWith(publicPrefix)) {
      return url.slice(publicPrefix.length);
    }
    return null;
  }

  async cleanupOrphaned(objectsToKeep: string[], searchPrefix?: string): Promise<number> {
    if (this.useLocalFallback) return 0;

    const keepSet = new Set(objectsToKeep);
    let deleted = 0;
    let continuationToken: string | undefined;

    try {
      const command: any = { Bucket: this.bucket, ContinuationToken: continuationToken };
      if (searchPrefix) command.Prefix = searchPrefix;

      do {
        const listResult = await this.client!.send(new ListObjectsV2Command(command));

        if (!listResult.Contents || listResult.Contents.length === 0) break;

        const toDelete: ObjectIdentifier[] = [];
        for (const obj of listResult.Contents) {
          if (obj.Key && !keepSet.has(obj.Key)) {
            toDelete.push({ Key: obj.Key });
          }
        }

        if (toDelete.length > 0) {
          await this.client!.send(new DeleteObjectsCommand({
            Bucket: this.bucket,
            Delete: { Objects: toDelete, Quiet: true },
          }));
          deleted += toDelete.length;
        }

        continuationToken = listResult.NextContinuationToken;
        command.ContinuationToken = continuationToken;
      } while (continuationToken);

      this.logger.log(`Cleaned up ${deleted} orphaned objects${searchPrefix ? ` under ${searchPrefix}` : ''}`);
    } catch (error) {
      this.logger.error(`Failed to cleanup orphaned objects: ${(error as Error).message}`);
    }

    return deleted;
  }

  // ─── Image Compression ──────────────────────

  private async compressImage(
    buffer: Buffer,
    mimeType: string,
    maxWidth: number,
    maxHeight: number,
  ): Promise<{ buffer: Buffer; width: number; height: number }> {
    try {
      const image = sharp(buffer);
      const metadata = await image.metadata();

      let pipeline = image;

      if ((metadata.width && metadata.width > maxWidth) || (metadata.height && metadata.height > maxHeight)) {
        pipeline = pipeline.resize({
          width: maxWidth,
          height: maxHeight,
          fit: 'inside',
          withoutEnlargement: true,
        });
      }

      if (mimeType === 'image/png') {
        pipeline = pipeline.png({ quality: 80, compressionLevel: 8 });
      } else if (mimeType === 'image/gif') {
        // pass through GIF as-is
      } else {
        pipeline = pipeline.webp({ quality: 80 });
      }

      const result = await pipeline.toBuffer();
      const meta = await sharp(result).metadata();

      return {
        buffer: result,
        width: meta.width ?? metadata.width ?? 0,
        height: meta.height ?? metadata.height ?? 0,
      };
    } catch (error) {
      this.logger.warn(`Image compression failed, using original: ${(error as Error).message}`);
      const meta = await sharp(buffer).metadata();
      return { buffer, width: meta.width ?? 0, height: meta.height ?? 0 };
    }
  }

  // ─── Validation ──────────────────────────────

  private validateFile(file: Express.Multer.File, category: FileCategory): void {
    if (!file) throw new BadRequestException('No file provided');

    const mime = file.mimetype;

    switch (category) {
      case FileCategory.AVATAR:
      case FileCategory.COVER:
      case FileCategory.CHAT_IMAGE:
        if (!ALLOWED_IMAGE_MIMES.includes(mime)) {
          throw new BadRequestException(`Invalid image type: ${mime}. Allowed: ${ALLOWED_IMAGE_MIMES.join(', ')}`);
        }
        if (file.size > MAX_IMAGE_SIZE) {
          throw new BadRequestException(`Image too large. Max: ${MAX_IMAGE_SIZE / 1024 / 1024}MB`);
        }
        break;

      case FileCategory.CHAT_VIDEO:
        if (!ALLOWED_VIDEO_MIMES.includes(mime)) {
          throw new BadRequestException(`Invalid video type: ${mime}. Allowed: ${ALLOWED_VIDEO_MIMES.join(', ')}`);
        }
        if (file.size > MAX_VIDEO_SIZE) {
          throw new BadRequestException(`Video too large. Max: ${MAX_VIDEO_SIZE / 1024 / 1024}MB`);
        }
        break;

      case FileCategory.CHAT_AUDIO:
        if (!ALLOWED_AUDIO_MIMES.includes(mime)) {
          throw new BadRequestException(`Invalid audio type: ${mime}. Allowed: ${ALLOWED_AUDIO_MIMES.join(', ')}`);
        }
        if (file.size > MAX_AUDIO_SIZE) {
          throw new BadRequestException(`Audio too large. Max: ${MAX_AUDIO_SIZE / 1024 / 1024}MB`);
        }
        break;

      case FileCategory.DOCUMENT:
        if (!ALLOWED_DOCUMENT_MIMES.includes(mime)) {
          throw new BadRequestException(`Invalid document type: ${mime}. Allowed: ${ALLOWED_DOCUMENT_MIMES.join(', ')}`);
        }
        if (file.size > MAX_DOCUMENT_SIZE) {
          throw new BadRequestException(`Document too large. Max: ${MAX_DOCUMENT_SIZE / 1024 / 1024}MB`);
        }
        break;

      default:
        if (file.size > MAX_IMAGE_SIZE) {
          throw new BadRequestException(`File too large. Max: ${MAX_IMAGE_SIZE / 1024 / 1024}MB`);
        }
    }
  }

  private isImage(mime: string): boolean {
    return ALLOWED_IMAGE_MIMES.includes(mime);
  }

  private extensionFromMime(mime: string): string {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
      'video/mp4': '.mp4',
      'video/webm': '.webm',
      'video/quicktime': '.mov',
      'audio/mpeg': '.mp3',
      'audio/ogg': '.ogg',
      'audio/wav': '.wav',
      'audio/mp4': '.m4a',
      'application/pdf': '.pdf',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
      'text/plain': '.txt',
      'text/csv': '.csv',
    };
    return map[mime] || '.bin';
  }

  private ensureDir(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}
