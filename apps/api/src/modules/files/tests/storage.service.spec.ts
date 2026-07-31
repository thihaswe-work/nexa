import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { StorageService, FileCategory } from '../../../infrastructure/storage/storage.service';
import { AppConfigService } from '../../../config/config.service';

jest.mock('sharp', () => {
  return jest.fn().mockImplementation(() => ({
    resize: jest.fn().mockReturnThis(),
    webp: jest.fn().mockReturnThis(),
    png: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('compressed')),
    metadata: jest.fn().mockResolvedValue({ width: 200, height: 200 }),
  }));
});

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn(),
  })),
  PutObjectCommand: jest.fn(),
  GetObjectCommand: jest.fn(),
  DeleteObjectCommand: jest.fn(),
  ListObjectsV2Command: jest.fn(),
  DeleteObjectsCommand: jest.fn(),
}));

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://signed-url.example.com/file'),
}));

jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('abcdef123456'),
}));

describe('StorageService', () => {
  let service: StorageService;
  let config: jest.Mocked<AppConfigService>;

  const mockConfig = {
    isS3Configured: true,
    s3Endpoint: 'https://s3.example.com',
    s3Region: 'us-east-1',
    s3AccessKeyId: 'access-key',
    s3SecretAccessKey: 'secret-key',
    s3Bucket: 'test-bucket',
    s3PublicUrl: 'https://cdn.example.com',
    s3SignedUrlExpiry: 3600,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        { provide: AppConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
    config = module.get(AppConfigService) as jest.Mocked<AppConfigService>;
  });

  describe('initialization', () => {
    it('should initialize S3 client when configured', async () => {
      await service.onModuleInit();
      expect(service['client']).not.toBeNull();
    });

    it('should use local fallback when S3 not configured', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          StorageService,
          {
            provide: AppConfigService,
            useValue: { ...mockConfig, isS3Configured: false },
          },
        ],
      }).compile();

      const localService = module.get<StorageService>(StorageService);
      await localService.onModuleInit();
      expect(localService['useLocalFallback']).toBe(true);
    });
  });

  describe('file validation', () => {
    it('should reject missing file', () => {
      expect(() =>
        (service as any).validateFile(null, FileCategory.AVATAR),
      ).toThrow(BadRequestException);
    });

    it('should reject invalid image mime type', () => {
      const file = { mimetype: 'application/pdf', size: 1000 } as Express.Multer.File;
      expect(() =>
        (service as any).validateFile(file, FileCategory.AVATAR),
      ).toThrow(BadRequestException);
    });

    it('should reject oversized images', () => {
      const file = { mimetype: 'image/jpeg', size: 20 * 1024 * 1024 } as Express.Multer.File;
      expect(() =>
        (service as any).validateFile(file, FileCategory.AVATAR),
      ).toThrow(BadRequestException);
    });

    it('should accept valid images', () => {
      const file = { mimetype: 'image/jpeg', size: 1000 } as Express.Multer.File;
      expect(() =>
        (service as any).validateFile(file, FileCategory.AVATAR),
      ).not.toThrow();
    });

    it('should reject invalid video mime types', () => {
      const file = { mimetype: 'image/jpeg', size: 1000 } as Express.Multer.File;
      expect(() =>
        (service as any).validateFile(file, FileCategory.CHAT_VIDEO),
      ).toThrow(BadRequestException);
    });
  });

  describe('extensionFromMime', () => {
    it('should return correct extension for known mime types', () => {
      expect((service as any).extensionFromMime('image/jpeg')).toBe('.jpg');
      expect((service as any).extensionFromMime('image/png')).toBe('.png');
      expect((service as any).extensionFromMime('video/mp4')).toBe('.mp4');
      expect((service as any).extensionFromMime('application/pdf')).toBe('.pdf');
    });

    it('should return .bin for unknown mime types', () => {
      expect((service as any).extensionFromMime('application/octet-stream')).toBe('.bin');
    });
  });

  describe('extractKeyFromUrl', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should extract S3 key from public URL', async () => {
      const key = await service.extractKeyFromUrl('https://cdn.example.com/avatars/user1_abc.jpg');
      expect(key).toBe('avatars/user1_abc.jpg');
    });

    it('should return null for non-matching URL', async () => {
      const key = await service.extractKeyFromUrl('https://other.com/file.jpg');
      expect(key).toBeNull();
    });
  });

  describe('delete', () => {
    it('should not throw when deleting with empty key', async () => {
      await expect(service.delete('')).resolves.toBeUndefined();
    });
  });
});
