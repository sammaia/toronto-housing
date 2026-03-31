import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

interface VacancyFilters {
  geography?: string;
  bedroomType?: string;
}

@Injectable()
export class VacancyService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: VacancyFilters) {
    const where: Record<string, string> = {};
    if (filters.geography) where.geography = filters.geography;
    if (filters.bedroomType) where.bedroomType = filters.bedroomType;

    return this.prisma.vacancyRate.findMany({
      where,
      orderBy: { year: 'asc' },
    });
  }
}
