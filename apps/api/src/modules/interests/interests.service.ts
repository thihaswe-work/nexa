import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class InterestsService {
  private readonly logger = new Logger(InterestsService.name);

  constructor(private readonly db: DatabaseService) {}

  async findAll() {
    return this.db.interest.findMany({
      where: { deletedAt: null },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  async getByCategories() {
    const interests = await this.db.interest.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });

    const grouped: Record<string, typeof interests> = {};

    for (const interest of interests) {
      const category = interest.category || 'Other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(interest);
    }

    return Object.entries(grouped).map(([category, items]) => ({
      category,
      interests: items,
    }));
  }

  async findByIds(ids: string[]) {
    return this.db.interest.findMany({
      where: { id: { in: ids }, deletedAt: null },
    });
  }
}
