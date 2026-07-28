import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { FilesService } from '../files.service';
import { StorageService, FileCategory } from '../../../infrastructure/storage/storage.service';
import { DatabaseService } from '../../../database/database.service';

describe('FilesService', () => {
  let service: FilesService;
  let storage: jest.Mocked<StorageService>;
  let db: jest.Mocked<DatabaseService>;

  const mockStorage = {
    upload: jest.fn(),
    generateSignedUrl: jest.fn(),
    extractKeyFromUrl: jest.fn(),
    cleanupOrphaned: jest.fn(),
  };

  const mockDb = {
    messageAttachment: {
      findMany: jest.fn(),
    },
    profile: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        { provide: StorageService, useValue: mockStorage },
        { provide: DatabaseService, useValue: mockDb },
      ],
    }).compile();

    service = module.get<FilesService>(FilesService);
    storage = module.get(StorageService) as jest.Mocked<StorageService>;
    db = module.get(DatabaseService) as jest.Mocked<DatabaseService>;
  });

  describe('upload', () => {
    const mockFile = { mimetype: 'image/jpeg', size: 5000, buffer: Buffer.from('test') } as Express.Multer.File;
    const userId = 'user-1';

    it('should upload an image file', async () => {
      mockStorage.upload.mockResolvedValue({
        key: 'chat/images/user-1_abc.jpg',
        url: 'https://cdn.example.com/chat/images/user-1_abc.jpg',
        signedUrl: 'https://signed.example.com/file',
        size: 5000,
        width: 200,
        height: 200,
        mimeType: 'image/jpeg',
      });

      const result = await service.upload(mockFile, 'image', userId);

      expect(storage.upload).toHaveBeenCalledWith(mockFile, FileCategory.CHAT_IMAGE, userId);
      expect(result.key).toBe('chat/images/user-1_abc.jpg');
      expect(result.width).toBe(200);
      expect(result.height).toBe(200);
    });

    it('should reject invalid category', async () => {
      await expect(service.upload(mockFile, 'invalid', userId)).rejects.toThrow(BadRequestException);
    });

    it('should upload video files to CHAT_VIDEO category', async () => {
      mockStorage.upload.mockResolvedValue({
        key: 'chat/videos/user-1_abc.mp4',
        url: 'https://cdn.example.com/chat/videos/user-1_abc.mp4',
        signedUrl: 'https://signed.example.com/file',
        size: 50000,
        mimeType: 'video/mp4',
      });

      const videoFile = { mimetype: 'video/mp4', size: 50000, buffer: Buffer.from('test') } as Express.Multer.File;
      const result = await service.upload(videoFile, 'video', userId);

      expect(storage.upload).toHaveBeenCalledWith(videoFile, FileCategory.CHAT_VIDEO, userId);
      expect(result.mimeType).toBe('video/mp4');
    });

    it('should upload documents to DOCUMENT category', async () => {
      mockStorage.upload.mockResolvedValue({
        key: 'documents/user-1_abc.pdf',
        url: 'https://cdn.example.com/documents/user-1_abc.pdf',
        signedUrl: 'https://signed.example.com/file',
        size: 50000,
        mimeType: 'application/pdf',
      });

      const docFile = { mimetype: 'application/pdf', size: 50000, buffer: Buffer.from('test') } as Express.Multer.File;
      const result = await service.upload(docFile, 'document', userId);

      expect(storage.upload).toHaveBeenCalledWith(docFile, FileCategory.DOCUMENT, userId);
      expect(result.mimeType).toBe('application/pdf');
    });
  });

  describe('getSignedUrl', () => {
    it('should delegate to storage service', async () => {
      mockStorage.generateSignedUrl.mockResolvedValue('https://signed.url/file');
      const url = await service.getSignedUrl('avatars/user_1.jpg');
      expect(url).toBe('https://signed.url/file');
      expect(storage.generateSignedUrl).toHaveBeenCalledWith('avatars/user_1.jpg', undefined);
    });

    it('should pass expiry to storage service', async () => {
      mockStorage.generateSignedUrl.mockResolvedValue('https://signed.url/file');
      await service.getSignedUrl('avatars/user_1.jpg', 7200);
      expect(storage.generateSignedUrl).toHaveBeenCalledWith('avatars/user_1.jpg', 7200);
    });
  });

  describe('cleanupOrphaned', () => {
    it('should collect keys from attachments and profiles', async () => {
      mockDb.messageAttachment.findMany.mockResolvedValue([
        { url: 'https://cdn.example.com/chat/images/msg1.jpg' },
      ]);
      mockDb.profile.findMany
        .mockResolvedValueOnce([
          { avatarUrl: 'https://cdn.example.com/avatars/user1.jpg' },
        ])
        .mockResolvedValueOnce([
          { coverUrl: 'https://cdn.example.com/covers/user1.jpg' },
        ]);
      mockStorage.extractKeyFromUrl
        .mockResolvedValueOnce('chat/images/msg1.jpg')
        .mockResolvedValueOnce('avatars/user1.jpg')
        .mockResolvedValueOnce('covers/user1.jpg');
      mockStorage.cleanupOrphaned.mockResolvedValue(0);

      await service.cleanupOrphaned();

      expect(mockStorage.cleanupOrphaned).toHaveBeenCalled();
      const keys = mockStorage.cleanupOrphaned.mock.calls[0][0] as string[];
      expect(keys).toContain('chat/images/msg1.jpg');
      expect(keys).toContain('avatars/user1.jpg');
      expect(keys).toContain('covers/user1.jpg');
    });

    it('should handle empty results', async () => {
      mockDb.messageAttachment.findMany.mockResolvedValue([]);
      mockDb.profile.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

      await service.cleanupOrphaned();
      expect(storage.cleanupOrphaned).toHaveBeenCalledWith([], undefined);
    });
  });
});
