import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../../../prisma/prisma.service.js';
import type { DataFetcher } from './data-fetcher.interface.js';

// Bank of Canada Valet API
// V39079  = Bank Rate (policy rate proxy, published weekly)
// V80691311 = Chartered bank 5-yr conventional mortgage rate (weekly)
const BOC_URL =
  'https://www.bankofcanada.ca/valet/observations/V39079,V80691311/json?recent=600';

interface BocObservation {
  d: string; // "2024-11-27"
  V39079?: { v: string };
  V80691311?: { v: string };
}

@Injectable()
export class BocRatesFetcher implements DataFetcher {
  readonly sourceKey = 'boc_rates';
  private readonly logger = new Logger(BocRatesFetcher.name);

  constructor(private readonly prisma: PrismaService) {}

  async fetch(): Promise<void> {
    const { data } = await axios.get<{ observations: BocObservation[] }>(BOC_URL);

    // Aggregate weekly observations into annual averages
    const byYear = new Map<number, { policy: number[]; fixed5yr: number[] }>();
    for (const obs of data.observations) {
      const year = parseInt(obs.d.slice(0, 4), 10);
      if (year < 2018) continue;
      const policyVal = obs.V39079?.v;
      const mortgageVal = obs.V80691311?.v;
      if (!policyVal || policyVal === 'nan' || !mortgageVal || mortgageVal === 'nan') continue;
      if (!byYear.has(year)) byYear.set(year, { policy: [], fixed5yr: [] });
      const entry = byYear.get(year)!;
      entry.policy.push(parseFloat(policyVal));
      entry.fixed5yr.push(parseFloat(mortgageVal));
    }

    const avg = (arr: number[]) =>
      parseFloat((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2));

    for (const [year, { policy, fixed5yr }] of byYear) {
      if (policy.length === 0 || fixed5yr.length === 0) continue;
      const bankOfCanadaPolicyRate = avg(policy);
      const avg5yrFixedRate = avg(fixed5yr);
      // Variable rate approximated as Bank Rate + 1.5% (typical prime-linked spread)
      const avgVariableRate = parseFloat((bankOfCanadaPolicyRate + 1.5).toFixed(2));

      await this.prisma.mortgageRate.upsert({
        where: { year },
        update: { bankOfCanadaPolicyRate, avg5yrFixedRate, avgVariableRate },
        create: { year, bankOfCanadaPolicyRate, avg5yrFixedRate, avgVariableRate },
      });
    }

    this.logger.log(`BocRatesFetcher: synced ${byYear.size} year(s)`);
  }
}
