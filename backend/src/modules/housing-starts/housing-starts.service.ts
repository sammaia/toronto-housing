import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

interface HousingStartsFilters {
  geography?: string;
  dwellingType?: string;
  year?: number;
}

@Injectable()
export class HousingStartsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: HousingStartsFilters) {
    const where: Record<string, unknown> = {};
    if (filters.geography) where.geography = filters.geography;
    if (filters.dwellingType) where.dwellingType = filters.dwellingType;
    if (filters.year) where.year = filters.year;

    return this.prisma.housingStart.findMany({
      where,
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
    });
  }

  async findAnnualTotals(geography?: string) {
    const where: Record<string, string> = {};
    if (geography) where.geography = geography;

    const data = await this.prisma.housingStart.findMany({
      where,
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
    });

    const byYearType = new Map<string, number>();
    data.forEach((row) => {
      const key = `${row.year}-${row.dwellingType}`;
      byYearType.set(key, (byYearType.get(key) || 0) + row.units);
    });

    const result: Record<string, unknown>[] = [];
    const years = [...new Set(data.map((d) => d.year))].sort();
    const types = [...new Set(data.map((d) => d.dwellingType))];

    for (const year of years) {
      const entry: Record<string, unknown> = { year };
      for (const type of types) {
        entry[type] = byYearType.get(`${year}-${type}`) || 0;
      }
      result.push(entry);
    }

    return result;
  }
}
