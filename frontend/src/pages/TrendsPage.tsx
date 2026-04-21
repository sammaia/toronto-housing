import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getVacancyRates,
  getRentalPrices,
  getHousingStartsAnnual,
  getPopulation,
  getImmigration,
  getAffordability,
  type HousingStart,
  type PopulationData,
  type ImmigrationData,
  type AffordabilityData,
} from '@/services/api';
import { DarkTooltip } from '@/components/charts/ChartTooltip';
import { COLOR_SEQUENCE, darkAxisProps, darkGridProps } from '@/components/charts/chartTheme';

const BEDROOM_TYPES = ['Total', 'Bachelor', '1 Bedroom', '2 Bedroom', '3 Bedroom+'];

interface RentalRow {
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
  return new Intl.NumberFormat('en-CA').format(Math.round(value));
}

// ─── Rental Market Tab ───────────────────────────────────────────────────────

function RentalMarketTab() {
  const [bedroomType, setBedroomType] = useState('Total');
  const [vacancyData, setVacancyData] = useState<RentalRow[]>([]);
  const [rentalData, setRentalData] = useState<RentalRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getVacancyRates({ bedroomType }).catch(() => []),
      getRentalPrices({ bedroomType: bedroomType === 'Total' ? '2 Bedroom' : bedroomType }).catch(() => []),
    ]).then(([vRates, rPrices]) => {
      const vacMap = new Map<number, RentalRow>();
      vRates.forEach((r) => {
        if (!vacMap.has(r.year)) vacMap.set(r.year, { year: r.year, 'Toronto CMA': 0, Ontario: 0 });
        const row = vacMap.get(r.year)!;
        if (r.geography === 'Toronto CMA') row['Toronto CMA'] = r.vacancyRate;
        if (r.geography === 'Ontario') row['Ontario'] = r.vacancyRate;
      });
      setVacancyData(Array.from(vacMap.values()).sort((a, b) => a.year - b.year));

      const rentMap = new Map<number, RentalRow>();
      rPrices.forEach((r) => {
        if (!rentMap.has(r.year)) rentMap.set(r.year, { year: r.year, 'Toronto CMA': 0, Ontario: 0 });
        const row = rentMap.get(r.year)!;
        if (r.geography === 'Toronto CMA') row['Toronto CMA'] = r.averageRent;
        if (r.geography === 'Ontario') row['Ontario'] = r.averageRent;
      });
      setRentalData(Array.from(rentMap.values()).sort((a, b) => a.year - b.year));

      setLoading(false);
    });
  }, [bedroomType]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-foreground">Rental Market Analysis</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Vacancy rates and average rents by bedroom type</p>
        </div>
        <div className="w-44">
          <Select value={bedroomType} onValueChange={setBedroomType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BEDROOM_TYPES.map((bt) => (
                <SelectItem key={bt} value={bt}>
                  {bt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {[0, 1].map((i) => <Card key={i} className="h-72 animate-pulse bg-muted/30" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Vacancy Rate — {bedroomType}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={vacancyData} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                  <CartesianGrid {...darkGridProps} />
                  <XAxis dataKey="year" {...darkAxisProps} />
                  <YAxis unit="%" {...darkAxisProps} />
                  <Tooltip content={<DarkTooltip formatter={(v) => `${v}%`} />} />
                  <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8', paddingTop: 8 }} />
                  <Line type="monotone" dataKey="Toronto CMA" stroke={COLOR_SEQUENCE[0]} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                  <Line type="monotone" dataKey="Ontario" stroke={COLOR_SEQUENCE[1]} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Average Rent — {bedroomType === 'Total' ? '2 Bedroom' : bedroomType}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={rentalData} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                  <CartesianGrid {...darkGridProps} />
                  <XAxis dataKey="year" {...darkAxisProps} />
                  <YAxis tickFormatter={(v: number) => `$${(v / 1000).toFixed(1)}k`} {...darkAxisProps} />
                  <Tooltip content={<DarkTooltip formatter={(v) => formatCurrency(v)} />} />
                  <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8', paddingTop: 8 }} />
                  <Bar dataKey="Toronto CMA" fill={COLOR_SEQUENCE[0]} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Ontario" fill={COLOR_SEQUENCE[1]} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── Housing Starts Tab ──────────────────────────────────────────────────────

function HousingStartsTab() {
  const [data, setData] = useState<HousingStart[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHousingStartsAnnual('Toronto CMA')
      .then((d) => setData(d))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-foreground">Housing Starts by Dwelling Type</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Toronto CMA — annual units by structure type</p>
      </div>

      {loading ? (
        <Card className="h-96 animate-pulse bg-muted/30" />
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Annual Housing Starts — Toronto CMA</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={360}>
              <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid {...darkGridProps} />
                <XAxis dataKey="year" {...darkAxisProps} />
                <YAxis tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} {...darkAxisProps} />
                <Tooltip content={<DarkTooltip formatter={(v) => formatNumber(v)} />} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8', paddingTop: 8 }} />
                <Area type="monotone" dataKey="Apartment" stackId="1" stroke={COLOR_SEQUENCE[0]} fill={`${COLOR_SEQUENCE[0]}33`} strokeWidth={2} />
                <Area type="monotone" dataKey="Row" stackId="1" stroke={COLOR_SEQUENCE[2]} fill={`${COLOR_SEQUENCE[2]}33`} strokeWidth={2} />
                <Area type="monotone" dataKey="Semi-Detached" stackId="1" stroke={COLOR_SEQUENCE[3]} fill={`${COLOR_SEQUENCE[3]}33`} strokeWidth={2} />
                <Area type="monotone" dataKey="Single" stackId="1" stroke={COLOR_SEQUENCE[4]} fill={`${COLOR_SEQUENCE[4]}33`} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Demographics Tab ────────────────────────────────────────────────────────

function DemographicsTab() {
  const [popData, setPopData] = useState<PopulationData[]>([]);
  const [immigrationData, setImmigrationData] = useState<ImmigrationData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getPopulation().catch(() => []),
      getImmigration().catch(() => []),
    ]).then(([pop, imm]) => {
      setPopData(pop);
      setImmigrationData(imm);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-foreground">Demographics</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Population growth and immigration trends</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {[0, 1].map((i) => <Card key={i} className="h-72 animate-pulse bg-muted/30" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Population growth */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Population Growth</CardTitle>
              <p className="text-xs text-muted-foreground">Annual growth rate (%)</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={popData} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                  <CartesianGrid {...darkGridProps} />
                  <XAxis dataKey="year" {...darkAxisProps} />
                  <YAxis unit="%" {...darkAxisProps} />
                  <Tooltip content={<DarkTooltip formatter={(v) => `${v.toFixed(2)}%`} />} />
                  <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8', paddingTop: 8 }} />
                  <Line type="monotone" dataKey="growth" stroke={COLOR_SEQUENCE[3]} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Immigration */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">New Permanent Residents</CardTitle>
              <p className="text-xs text-muted-foreground">Annual immigration arrivals</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={immigrationData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid {...darkGridProps} />
                  <XAxis dataKey="year" {...darkAxisProps} />
                  <YAxis tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} {...darkAxisProps} />
                  <Tooltip content={<DarkTooltip formatter={(v) => formatNumber(v)} />} />
                  <Bar dataKey="newPermanentResidents" name="New Residents" fill={COLOR_SEQUENCE[1]} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── Affordability Tab ───────────────────────────────────────────────────────

function AffordabilityTab() {
  const [data, setData] = useState<AffordabilityData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAffordability()
      .then(setData)
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-foreground">Affordability Analysis</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Income ratios and housing supply gap — Toronto CMA
        </p>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {[0, 1].map((i) => <Card key={i} className="h-72 animate-pulse bg-muted/30" />)}
          </div>
          <Card className="h-72 animate-pulse bg-muted/30" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Price-to-Income */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Price-to-Income Ratio</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Years of median income needed to purchase a home (Toronto CMA)
                </p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                    <CartesianGrid {...darkGridProps} />
                    <XAxis dataKey="year" {...darkAxisProps} />
                    <YAxis
                      tickFormatter={(v: number) => `${v}×`}
                      domain={[0, 'auto']}
                      {...darkAxisProps}
                    />
                    <Tooltip content={<DarkTooltip formatter={(v) => `${v}×`} />} />
                    <ReferenceLine
                      y={5}
                      stroke="#10b981"
                      strokeDasharray="5 3"
                      label={{ value: 'benchmark 5×', position: 'insideTopLeft', fill: '#10b981', fontSize: 11 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="priceToIncome"
                      name="Price-to-Income"
                      stroke="#f43f5e"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Rent-to-Income */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Rent-to-Income Ratio</CardTitle>
                <p className="text-xs text-muted-foreground">
                  % of annual median income spent on a 2-bedroom rental (Toronto CMA)
                </p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                    <CartesianGrid {...darkGridProps} />
                    <XAxis dataKey="year" {...darkAxisProps} />
                    <YAxis unit="%" {...darkAxisProps} />
                    <Tooltip content={<DarkTooltip formatter={(v) => `${v}%`} />} />
                    <ReferenceLine
                      y={30}
                      stroke="#f59e0b"
                      strokeDasharray="5 3"
                      label={{ value: 'threshold 30%', position: 'insideTopLeft', fill: '#f59e0b', fontSize: 11 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="rentToIncome"
                      name="Rent-to-Income"
                      stroke="#ec4899"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Supply Gap */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Supply Gap — Housing Starts vs. Estimated Demand</CardTitle>
              <p className="text-xs text-muted-foreground">
                Units started per year vs. new households needed · demand = pop. growth ÷ 2.5 persons/household
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid {...darkGridProps} />
                  <XAxis dataKey="year" {...darkAxisProps} />
                  <YAxis
                    tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                    {...darkAxisProps}
                  />
                  <Tooltip content={<DarkTooltip formatter={(v) => formatNumber(v)} />} />
                  <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8', paddingTop: 8 }} />
                  <Area
                    type="monotone"
                    dataKey="housingStarts"
                    name="Housing Starts"
                    stroke={COLOR_SEQUENCE[0]}
                    fill={`${COLOR_SEQUENCE[0]}33`}
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="estimatedDemand"
                    name="Estimated Demand"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    strokeDasharray="6 3"
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export function TrendsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-foreground">Trends</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Detailed rental, construction, and demographic analysis
        </p>
      </div>

      <Tabs defaultValue="rental">
        <TabsList className="mb-2">
          <TabsTrigger value="rental">Rental Market</TabsTrigger>
          <TabsTrigger value="starts">Housing Starts</TabsTrigger>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
          <TabsTrigger value="affordability">Affordability</TabsTrigger>
        </TabsList>

        <TabsContent value="rental">
          <RentalMarketTab />
        </TabsContent>
        <TabsContent value="starts">
          <HousingStartsTab />
        </TabsContent>
        <TabsContent value="demographics">
          <DemographicsTab />
        </TabsContent>
        <TabsContent value="affordability">
          <AffordabilityTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
