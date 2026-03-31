import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Home,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Percent,
  Building,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getKpis, getVacancyRates, getRentalPrices, type KpiData } from '@/services/api';
import { DarkTooltip } from '@/components/charts/ChartTooltip';
import { COLOR_SEQUENCE, darkAxisProps, darkGridProps } from '@/components/charts/chartTheme';

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string;
  subtext?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  accentColor: string;
}

function KpiCard({ label, value, subtext, trend, icon: Icon, accentColor }: KpiCardProps) {
  return (
    <Card className="relative overflow-hidden hover:border-border/80 transition-colors group">
      {/* Subtle colored left border accent */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl"
        style={{ background: accentColor }}
      />
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {label}
            </p>
            <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
            {subtext && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                {trend === 'up' && <TrendingUp className="w-3 h-3 text-emerald-400" />}
                {trend === 'down' && <TrendingDown className="w-3 h-3 text-rose-400" />}
                <span
                  className={
                    trend === 'up'
                      ? 'text-emerald-400'
                      : trend === 'down'
                      ? 'text-rose-400'
                      : 'text-muted-foreground'
                  }
                >
                  {subtext}
                </span>
              </p>
            )}
          </div>
          <div
            className="flex items-center justify-center w-10 h-10 rounded-lg opacity-80 group-hover:opacity-100 transition-opacity"
            style={{ background: `${accentColor}1a` }}
          >
            <Icon className="w-5 h-5" style={{ color: accentColor }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Vacancy chart data shape ────────────────────────────────────────────────
interface VacancyChartRow {
  year: number;
  'Toronto CMA': number;
  Ontario: number;
}

interface RentalChartRow {
  year: number;
  'Toronto CMA': number;
  Ontario: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-CA').format(value);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const [kpis, setKpis] = useState<KpiData | null>(null);
  const [vacancyData, setVacancyData] = useState<VacancyChartRow[]>([]);
  const [rentalData, setRentalData] = useState<RentalChartRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getKpis().catch(() => null),
      getVacancyRates({ bedroomType: 'Total' }).catch(() => []),
      getRentalPrices({ bedroomType: '2 Bedroom' }).catch(() => []),
    ]).then(([kpiData, vacancyRates, rentalPrices]) => {
      setKpis(kpiData);

      // Transform vacancy rates into chart rows
      const vacMap = new Map<number, VacancyChartRow>();
      vacancyRates.forEach((r) => {
        if (!vacMap.has(r.year)) vacMap.set(r.year, { year: r.year, 'Toronto CMA': 0, Ontario: 0 });
        const row = vacMap.get(r.year)!;
        if (r.geography === 'Toronto CMA') row['Toronto CMA'] = r.vacancyRate;
        if (r.geography === 'Ontario') row['Ontario'] = r.vacancyRate;
      });
      setVacancyData(Array.from(vacMap.values()).sort((a, b) => a.year - b.year));

      // Transform rental prices into chart rows
      const rentMap = new Map<number, RentalChartRow>();
      rentalPrices.forEach((r) => {
        if (!rentMap.has(r.year)) rentMap.set(r.year, { year: r.year, 'Toronto CMA': 0, Ontario: 0 });
        const row = rentMap.get(r.year)!;
        if (r.geography === 'Toronto CMA') row['Toronto CMA'] = r.averageRent;
        if (r.geography === 'Ontario') row['Ontario'] = r.averageRent;
      });
      setRentalData(Array.from(rentMap.values()).sort((a, b) => a.year - b.year));

      setLoading(false);
    });
  }, []);

  const kpiCards: KpiCardProps[] = kpis
    ? [
        // Row 1: Rental & rates
        {
          label: 'Vacancy Rate',
          value: `${kpis.vacancyRate.toFixed(1)}%`,
          subtext: 'Toronto CMA total',
          trend: 'neutral',
          icon: Percent,
          accentColor: COLOR_SEQUENCE[0],
        },
        {
          label: 'Avg Rent (2-Bed)',
          value: formatCurrency(kpis.avgRent2Bed),
          subtext:
            kpis.rentChange > 0
              ? `+${kpis.rentChange.toFixed(1)}% YoY`
              : `${kpis.rentChange.toFixed(1)}% YoY`,
          trend: kpis.rentChange > 0 ? 'up' : 'down',
          icon: DollarSign,
          accentColor: COLOR_SEQUENCE[1],
        },
        {
          label: '5-Yr Mortgage Rate',
          value: `${kpis.mortgageRate5yr.toFixed(2)}%`,
          subtext: `Policy rate ${kpis.policyRate.toFixed(2)}%`,
          trend: 'neutral',
          icon: Building,
          accentColor: COLOR_SEQUENCE[3],
        },
        {
          label: 'Population Growth',
          value: `+${kpis.populationGrowth.toFixed(1)}%`,
          subtext: `${formatNumber(kpis.newPermanentResidents)} new residents`,
          trend: 'up',
          icon: Users,
          accentColor: COLOR_SEQUENCE[5],
        },
        // Row 2: Prices & affordability
        {
          label: 'Avg Detached Price',
          value: formatCurrency(kpis.avgDetachedPrice),
          subtext: `${kpis.year}`,
          trend: 'neutral',
          icon: Home,
          accentColor: COLOR_SEQUENCE[4],
        },
        {
          label: 'Price-to-Income',
          value: kpis.priceToIncome != null ? `${kpis.priceToIncome}×` : '—',
          subtext: 'benchmark saudável: 5×',
          trend: kpis.priceToIncome != null && kpis.priceToIncome > 5 ? 'down' : 'neutral',
          icon: TrendingUp,
          accentColor: '#f43f5e',
        },
        {
          label: 'Rent-to-Income',
          value: kpis.rentToIncome != null ? `${kpis.rentToIncome}%` : '—',
          subtext: 'limite crítico: 30%',
          trend: kpis.rentToIncome != null && kpis.rentToIncome > 30 ? 'down' : 'neutral',
          icon: Percent,
          accentColor: '#ec4899',
        },
        {
          label: 'Rent Change YoY',
          value: `${kpis.rentChange > 0 ? '+' : ''}${kpis.rentChange.toFixed(1)}%`,
          subtext: `As of ${kpis.year}`,
          trend: kpis.rentChange > 0 ? 'up' : 'down',
          icon: TrendingUp,
          accentColor: kpis.rentChange > 0 ? '#10b981' : '#f43f5e',
        },
      ]
    : [];

  return (
    <div className="space-y-8">
      {/* Page heading */}
      <div>
        <h1 className="text-3xl text-foreground">Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Toronto housing market at a glance
        </p>
      </div>

      {/* KPI cards */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="h-28 animate-pulse bg-muted/30" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {kpiCards.map((card) => (
            <KpiCard key={card.label} {...card} />
          ))}
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Vacancy rates line chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Vacancy Rates</CardTitle>
            <p className="text-xs text-muted-foreground">Toronto CMA vs Ontario — all bedroom types</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={vacancyData} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                <CartesianGrid {...darkGridProps} />
                <XAxis dataKey="year" {...darkAxisProps} />
                <YAxis unit="%" {...darkAxisProps} />
                <Tooltip
                  content={<DarkTooltip formatter={(v) => `${v}%`} />}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12, color: '#94a3b8', paddingTop: 8 }}
                />
                <Line
                  type="monotone"
                  dataKey="Toronto CMA"
                  stroke={COLOR_SEQUENCE[0]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
                <Line
                  type="monotone"
                  dataKey="Ontario"
                  stroke={COLOR_SEQUENCE[1]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Rental prices bar chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Average Rent — 2 Bedroom</CardTitle>
            <p className="text-xs text-muted-foreground">Toronto CMA vs Ontario</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={rentalData} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                <CartesianGrid {...darkGridProps} />
                <XAxis dataKey="year" {...darkAxisProps} />
                <YAxis
                  tickFormatter={(v: number) => `$${(v / 1000).toFixed(1)}k`}
                  {...darkAxisProps}
                />
                <Tooltip
                  content={<DarkTooltip formatter={(v) => formatCurrency(v)} />}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12, color: '#94a3b8', paddingTop: 8 }}
                />
                <Bar dataKey="Toronto CMA" fill={COLOR_SEQUENCE[0]} radius={[3, 3, 0, 0]} />
                <Bar dataKey="Ontario" fill={COLOR_SEQUENCE[1]} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
