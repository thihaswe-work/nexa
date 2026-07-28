import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from '../../../database/database.service';
import { LocationCacheService } from '../../../infrastructure/redis/location-cache.service';
import { PresenceService } from '../../../infrastructure/redis/presence.service';
import { RedisPubSubService } from '../../../infrastructure/redis/redis-pubsub.service';
import { NearbyService } from '../nearby.service';
import { UpdateLocationDto } from '../dto/update-location.dto';
import { NearbyQueryDto } from '../dto/nearby-query.dto';

describe('NearbyService', () => {
  let service: NearbyService;
  let db: jest.Mocked<DatabaseService>;
  let locationCache: jest.Mocked<LocationCacheService>;
  let presenceService: jest.Mocked<PresenceService>;
  let pubSubService: jest.Mocked<RedisPubSubService>;

  const mockUserId = '550e8400-e29b-41d4-a716-446655440000';

  const mockDb = {
    $executeRaw: jest.fn(),
    $queryRaw: jest.fn(),
    $transaction: jest.fn(),
  };

  const mockLocationCache = {
    setLocation: jest.fn().mockResolvedValue(undefined),
    getLocation: jest.fn(),
    removeLocation: jest.fn().mockResolvedValue(undefined),
    countNearby: jest.fn().mockResolvedValue(3),
  };

  const mockPresenceService = {
    setOnline: jest.fn().mockResolvedValue(undefined),
    setOffline: jest.fn().mockResolvedValue(undefined),
    isOnline: jest.fn(),
  };

  const mockPubSubService = {
    publishLocationUpdate: jest.fn().mockResolvedValue(undefined),
    publishPresenceChange: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NearbyService,
        { provide: DatabaseService, useValue: mockDb },
        { provide: LocationCacheService, useValue: mockLocationCache },
        { provide: PresenceService, useValue: mockPresenceService },
        { provide: RedisPubSubService, useValue: mockPubSubService },
      ],
    }).compile();

    service = module.get<NearbyService>(NearbyService);
    db = module.get(DatabaseService) as jest.Mocked<DatabaseService>;
    locationCache = module.get(LocationCacheService) as jest.Mocked<LocationCacheService>;
    presenceService = module.get(PresenceService) as jest.Mocked<PresenceService>;
    pubSubService = module.get(RedisPubSubService) as jest.Mocked<RedisPubSubService>;

    jest.clearAllMocks();
  });

  describe('updateLocation', () => {
    const dto: UpdateLocationDto = { lat: 40.7128, lng: -74.006 };

    it('should update location, cache it, and return nearby count', async () => {
      mockDb.$transaction.mockResolvedValue([undefined, undefined, undefined]);
      mockDb.$queryRaw.mockResolvedValue([{ count: 5 }]);

      const result = await service.updateLocation(mockUserId, dto);

      expect(result.success).toBe(true);
      expect(result.nearbyCount).toBe(5);
      expect(mockDb.$transaction).toHaveBeenCalledTimes(1);
      expect(mockLocationCache.setLocation).toHaveBeenCalledWith(mockUserId, 40.7128, -74.006);
      expect(mockPresenceService.setOnline).toHaveBeenCalledWith(mockUserId);
      expect(mockPubSubService.publishLocationUpdate).toHaveBeenCalled();
    });

    it('should return zero nearby count when no users nearby', async () => {
      mockDb.$transaction.mockResolvedValue([undefined, undefined, undefined]);
      mockDb.$queryRaw.mockResolvedValue([{ count: 0 }]);

      const result = await service.updateLocation(mockUserId, dto);

      expect(result.success).toBe(true);
      expect(result.nearbyCount).toBe(0);
    });
  });

  describe('findNearby', () => {
    const query: NearbyQueryDto = { radius: 1000, limit: 20 };

    it('should return nearby users with obfuscated coordinates', async () => {
      mockDb.$queryRaw
        .mockResolvedValueOnce([
          { lat: 40.7128, lng: -74.006 },
        ])
        .mockResolvedValueOnce([
          {
            userId: '660e8400-e29b-41d4-a716-446655440099',
            displayName: 'Jane Doe',
            avatarUrl: 'https://example.com/avatar.jpg',
            distanceMeters: 450.3,
            isOnline: true,
            interestName: 'Photography',
          },
          {
            userId: '660e8400-e29b-41d4-a716-446655440100',
            displayName: 'Bob Smith',
            avatarUrl: null,
            distanceMeters: 1234.7,
            isOnline: false,
            interestName: null,
          },
        ]);

      const result = await service.findNearby(mockUserId, query);

      expect(result.approximateLat).toBe(40.713);
      expect(result.approximateLng).toBe(-74.006);
      expect(result.radius).toBe(1000);
      expect(result.total).toBe(2);
      expect(result.users).toHaveLength(2);

      expect(result.users[0].approximateDistance).toBe(450);
      expect(result.users[0].distanceLabel).toBe('~450m');
      expect(result.users[0].commonInterest).toBe('Photography');

      expect(result.users[1].approximateDistance).toBe(1230);
      expect(result.users[1].distanceLabel).toBe('~1.2km');
    });

    it('should return empty when user has no location', async () => {
      mockDb.$queryRaw.mockResolvedValueOnce([]);

      const result = await service.findNearby(mockUserId, query);

      expect(result.total).toBe(0);
      expect(result.users).toHaveLength(0);
    });

    it('should use default radius and limit when not provided', async () => {
      const defaultQuery: NearbyQueryDto = {};

      mockDb.$queryRaw
        .mockResolvedValueOnce([
          { lat: 40.7128, lng: -74.006 },
        ])
        .mockResolvedValueOnce([]);

      const result = await service.findNearby(mockUserId, defaultQuery);

      expect(result.radius).toBe(1000);
      expect(result.users).toHaveLength(0);
    });
  });

  describe('getLocation', () => {
    it('should return cached location when available', async () => {
      mockLocationCache.getLocation.mockResolvedValue({ lat: 40.7128, lng: -74.006, updatedAt: new Date().toISOString() });

      const result = await service.getLocation(mockUserId);

      expect(result).toEqual({ lat: 40.7128, lng: -74.006 });
      expect(mockDb.$queryRaw).not.toHaveBeenCalled();
    });

    it('should fall back to DB when not cached', async () => {
      mockLocationCache.getLocation.mockResolvedValue(null);
      mockDb.$queryRaw.mockResolvedValueOnce([
        { lat: 40.7128, lng: -74.006 },
      ]);

      const result = await service.getLocation(mockUserId);

      expect(result).toEqual({ lat: 40.7128, lng: -74.006 });
      expect(mockDb.$queryRaw).toHaveBeenCalledTimes(1);
    });

    it('should return null when location not set', async () => {
      mockLocationCache.getLocation.mockResolvedValue(null);
      mockDb.$queryRaw.mockResolvedValueOnce([]);

      const result = await service.getLocation(mockUserId);

      expect(result).toBeNull();
    });
  });

  describe('clearLocation', () => {
    it('should clear location, cache, and presence', async () => {
      mockDb.$executeRaw.mockResolvedValue([{ count: 1 }]);

      await service.clearLocation(mockUserId);

      expect(mockDb.$executeRaw).toHaveBeenCalledTimes(2);
      expect(mockLocationCache.removeLocation).toHaveBeenCalledWith(mockUserId);
      expect(mockPresenceService.setOffline).toHaveBeenCalledWith(mockUserId);
      expect(mockPubSubService.publishPresenceChange).toHaveBeenCalledWith(mockUserId, 'offline');
    });
  });
});
