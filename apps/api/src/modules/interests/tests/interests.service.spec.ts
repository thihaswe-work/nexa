import { Test, TestingModule } from '@nestjs/testing';
import { InterestsService } from '../interests.service';
import { DatabaseService } from '../../../database/database.service';

describe('InterestsService', () => {
  let service: InterestsService;
  let db: jest.Mocked<DatabaseService>;

  const mockInterests = [
    { id: '1', name: 'Photography', category: 'Arts & Culture' },
    { id: '2', name: 'Painting', category: 'Arts & Culture' },
    { id: '3', name: 'Running', category: 'Sports & Fitness' },
    { id: '4', name: 'Yoga', category: 'Sports & Fitness' },
  ];

  const mockDb = {
    interest: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterestsService,
        { provide: DatabaseService, useValue: mockDb },
      ],
    }).compile();

    service = module.get<InterestsService>(InterestsService);
    db = module.get(DatabaseService) as jest.Mocked<DatabaseService>;
  });

  describe('findAll', () => {
    it('should return all interests', async () => {
      mockDb.interest.findMany.mockResolvedValue(mockInterests);

      const result = await service.findAll();

      expect(result).toEqual(mockInterests);
      expect(db.interest.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
      });
    });

    it('should return empty array when no interests exist', async () => {
      mockDb.interest.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('getByCategories', () => {
    it('should group interests by category', async () => {
      mockDb.interest.findMany.mockResolvedValue(mockInterests);

      const result = await service.getByCategories();

      expect(result).toEqual([
        {
          category: 'Arts & Culture',
          interests: [
            { id: '1', name: 'Photography', category: 'Arts & Culture' },
            { id: '2', name: 'Painting', category: 'Arts & Culture' },
          ],
        },
        {
          category: 'Sports & Fitness',
          interests: [
            { id: '3', name: 'Running', category: 'Sports & Fitness' },
            { id: '4', name: 'Yoga', category: 'Sports & Fitness' },
          ],
        },
      ]);
    });

    it('should return empty array when no interests', async () => {
      mockDb.interest.findMany.mockResolvedValue([]);

      const result = await service.getByCategories();

      expect(result).toEqual([]);
    });

    it('should handle interests with unique categories', async () => {
      mockDb.interest.findMany.mockResolvedValue([
        { id: '1', name: 'Cooking', category: 'Food' },
      ]);

      const result = await service.getByCategories();

      expect(result).toEqual([
        {
          category: 'Food',
          interests: [{ id: '1', name: 'Cooking', category: 'Food' }],
        },
      ]);
    });
  });
});
