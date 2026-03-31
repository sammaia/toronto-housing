import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

interface RentalFilters {
  geography?: string;
  bedroomType?: string;
}

@Injectable()
export class RentalService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: RentalFilters) {
    const where: Record<string, string> = {};
    if (filters.geography) where.geography = filters.geography;
    if (filters.bedroomType) where.bedroomType = filters.bedroomType;

    return this.prisma.rentalPrice.findMany({
      where,
      orderBy: { year: 'asc' },
    });
  }
}
