import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { getRentalPrices } from '../services/api';

interface ChartData {
  year: number;
  'Toronto CMA': number;
  Ontario: number;
}

export function RentalChart() {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRentalPrices({ bedroomType: '2 Bedroom' })
      .then((prices) => {
        const byYear = new Map<number, ChartData>();
        prices.forEach((r) => {
          if (!byYear.has(r.year)) {
            byYear.set(r.year, { year: r.year, 'Toronto CMA': 0, Ontario: 0 });
          }
          const entry = byYear.get(r.year)!;
          if (r.geography === 'Toronto CMA') entry['Toronto CMA'] = r.averageRent;
          if (r.geography === 'Ontario') entry['Ontario'] = r.averageRent;
        });
        setData(Array.from(byYear.values()).sort((a, b) => a.year - b.year));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h2>Average Rent (2 Bedroom) — Toronto CMA vs Ontario</h2>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis unit="$" />
          <Tooltip formatter={(value) => `$${value}`} />
          <Legend />
          <Bar dataKey="Toronto CMA" fill="#2563eb" />
          <Bar dataKey="Ontario" fill="#dc2626" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
