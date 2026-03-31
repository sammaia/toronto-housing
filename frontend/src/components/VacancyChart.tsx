import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { getVacancyRates } from '../services/api';

interface ChartData {
  year: number;
  'Toronto CMA': number;
  Ontario: number;
}

export function VacancyChart() {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getVacancyRates({ bedroomType: 'Total' })
      .then((rates) => {
        const byYear = new Map<number, ChartData>();
        rates.forEach((r) => {
          if (!byYear.has(r.year)) {
            byYear.set(r.year, { year: r.year, 'Toronto CMA': 0, Ontario: 0 });
          }
          const entry = byYear.get(r.year)!;
          if (r.geography === 'Toronto CMA') entry['Toronto CMA'] = r.vacancyRate;
          if (r.geography === 'Ontario') entry['Ontario'] = r.vacancyRate;
        });
        setData(Array.from(byYear.values()).sort((a, b) => a.year - b.year));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h2>Vacancy Rates — Toronto CMA vs Ontario</h2>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis unit="%" domain={[0, 'auto']} />
          <Tooltip formatter={(value) => `${value}%`} />
          <Legend />
          <Line
            type="monotone"
            dataKey="Toronto CMA"
            stroke="#2563eb"
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="Ontario"
            stroke="#dc2626"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
