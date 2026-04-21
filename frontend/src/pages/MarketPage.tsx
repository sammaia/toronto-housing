import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  ComposedChart,
  ReferenceArea,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  getHomePrices,
  getMortgageRates,
  getMarketActivity,
  type HomePrice,
  type MortgageRate,
  type MarketActivityData,
} from '@/services/api';
import { DarkTooltip } from '@/components/charts/ChartTooltip';
import { COLOR_SEQUENCE, CHART_COLORS, darkAxisProps, darkGridProps } from '@/components/charts/chartTheme';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  }).format(value);
}

interface InsightItem {
  label: string;
  value: string;
  direction: 'up' | 'down' | 'neutral';
  description: string;
}

function MarketSummaryCard({ prices, rates }: { prices: HomePrice[]; rates: MortgageRate[] }) {
  const latestPrice = prices[prices.length - 1];
  const prevPrice = prices[prices.length - 2];
  const latestRate = rates[rates.length - 1];

  if (!latestPrice || !latestRate) return null;

  const detachedChange =
    prevPrice && prevPrice.detached
      ? ((latestPrice.detached - prevPrice.detached) / prevPrice.detached) * 100
      : null;

  const insights: InsightItem[] = [
    {
      label: 'Detached Homes',
      value: formatCurrency(latestPrice.detached),
      direction: detachedChange !== null && detachedChange > 0 ? 'up' : detachedChange !== null && detachedChange < 0 ? 'down' : 'neutral',
      description:
        detachedChange !== null
          ? `${detachedChange > 0 ? '+' : ''}${detachedChange.toFixed(1)}% vs prior year`
          : 'Latest average price',
    },
    {
      label: 'Condo Apartments',
      value: formatCurrency(latestPrice.condo),
      direction: 'neutral',
      description: 'Average sale price',
    },
    {
      label: '5-Yr Fixed Rate',
      value: `${latestRate.fixed5yr.toFixed(2)}%`,
      direction: latestRate.fixed5yr > 5 ? 'down' : 'up',
      description: 'Current benchmark rate',
    },
    {
      label: 'Policy Rate',
      value: `${latestRate.policyRate.toFixed(2)}%`,
      direction: 'neutral',
      description: 'Bank of Canada rate',
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Market Summary</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {latestPrice.year}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">Key market indicators at a glance</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {insights.map((item) => (
            <div
              key={item.label}
              className="flex flex-col gap-1 p-3 rounded-lg bg-muted/30 border border-border/50"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{item.label}</span>
                {item.direction === 'up' && <TrendingUp className="w-3 h-3 text-emerald-400" />}
                {item.direction === 'down' && <TrendingDown className="w-3 h-3 text-rose-400" />}
                {item.direction === 'neutral' && <Minus className="w-3 h-3 text-muted-foreground" />}
              </div>
              <p className="text-lg font-bold text-foreground leading-none">{item.value}</p>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 rounded-lg" style={{ background: 'hsla(38, 95%, 52%, 0.07)', border: '1px solid hsla(38, 95%, 52%, 0.18)' }}>
          <p className="text-xs leading-relaxed" style={{ color: 'hsl(38, 95%, 72%)' }}>
            <span className="font-semibold">Market context:</span> Toronto&apos;s housing market
            remains significantly supply-constrained. Rising immigration and population growth
            continue to outpace new construction, maintaining upward pressure on both rents and
            purchase prices across all property types.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function MarketPage() {
  const [homePrices, setHomePrices] = useState<HomePrice[]>([]);
  const [mortgageRates, setMortgageRates] = useState<MortgageRate[]>([]);
  const [activityData, setActivityData] = useState<MarketActivityData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getHomePrices().catch(() => []),
      getMortgageRates().catch(() => []),
      getMarketActivity().catch(() => []),
    ]).then(([prices, rates, activity]) => {
      setHomePrices(prices);
      setMortgageRates(rates);
      setActivityData(activity);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl text-foreground">Market</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Home prices and mortgage rate trends
        </p>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <Card className="xl:col-span-2 h-96 animate-pulse bg-muted/30" />
            <Card className="h-96 animate-pulse bg-muted/30" />
          </div>
          <Card className="h-72 animate-pulse bg-muted/30" />
          <Card className="h-72 animate-pulse bg-muted/30" />
        </div>
      ) : (
        <>
          {/* Home prices + market summary */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <Card className="xl:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Home Prices by Property Type</CardTitle>
                <p className="text-xs text-muted-foreground">Average sale price — Toronto</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={homePrices} margin={{ top: 4, right: 8, bottom: 0, left: 10 }}>
                    <CartesianGrid {...darkGridProps} />
                    <XAxis dataKey="year" {...darkAxisProps} />
                    <YAxis
                      tickFormatter={(v: number) => `$${(v / 1000000).toFixed(1)}M`}
                      {...darkAxisProps}
                    />
                    <Tooltip content={<DarkTooltip formatter={(v) => formatCurrency(v)} />} />
                    <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8', paddingTop: 8 }} />
                    <Line type="monotone" dataKey="detached" name="Detached" stroke={COLOR_SEQUENCE[0]} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                    <Line type="monotone" dataKey="semiDetached" name="Semi-Detached" stroke={COLOR_SEQUENCE[1]} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                    <Line type="monotone" dataKey="townhouse" name="Townhouse" stroke={COLOR_SEQUENCE[2]} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                    <Line type="monotone" dataKey="condo" name="Condo" stroke={COLOR_SEQUENCE[3]} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <MarketSummaryCard prices={homePrices} rates={mortgageRates} />
          </div>

          {/* Mortgage rates */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Mortgage Rate Comparison</CardTitle>
              <p className="text-xs text-muted-foreground">
                5-yr fixed vs variable vs Bank of Canada policy rate
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={mortgageRates} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                  <CartesianGrid {...darkGridProps} />
                  <XAxis dataKey="year" {...darkAxisProps} />
                  <YAxis unit="%" {...darkAxisProps} />
                  <Tooltip content={<DarkTooltip formatter={(v) => `${v.toFixed(2)}%`} />} />
                  <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8', paddingTop: 8 }} />
                  <Line type="monotone" dataKey="fixed5yr" name="5-Yr Fixed" stroke={COLOR_SEQUENCE[0]} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                  <Line type="monotone" dataKey="variable" name="Variable" stroke={COLOR_SEQUENCE[4]} strokeWidth={2} strokeDasharray="5 3" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                  <Line type="monotone" dataKey="policyRate" name="Policy Rate" stroke={CHART_COLORS.rose} strokeWidth={2} strokeDasharray="3 2" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* SNLR */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Sales-to-New-Listings Ratio (SNLR)
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Market balance indicator — below 40%: buyer's market · 40–60%: balanced · above 60%: seller's market
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={activityData} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                  <ReferenceArea y1={60} y2={100} fill="rgba(244,63,94,0.07)" />
                  <ReferenceArea y1={40} y2={60}  fill="rgba(245,158,11,0.07)" />
                  <ReferenceArea y1={0}  y2={40}  fill="rgba(16,185,129,0.07)" />
                  <CartesianGrid {...darkGridProps} />
                  <XAxis dataKey="year" {...darkAxisProps} />
                  <YAxis unit="%" domain={[0, 80]} {...darkAxisProps} />
                  <Tooltip content={<DarkTooltip formatter={(v) => `${v}%`} />} />
                  <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8', paddingTop: 8 }} />
                  <Line
                    type="monotone"
                    dataKey="snlr"
                    name="SNLR"
                    stroke={COLOR_SEQUENCE[0]}
                    strokeWidth={2}
                    dot={{ r: 3, strokeWidth: 0, fill: COLOR_SEQUENCE[0] }}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
