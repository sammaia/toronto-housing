import { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { getHousingStartsAnnual } from '../services/api';

interface ChartData {
  year: number;
  Single: number;
  'Semi-Detached': number;
  Row: number;
  Apartment: number;
}

export function HousingStartsChart() {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHousingStartsAnnual('Toronto CMA')
      .then((d) => setData(d as ChartData[]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h2>Housing Starts by Type — Toronto CMA</h2>
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Area type="monotone" dataKey="Apartment" stackId="1" fill="#2563eb" stroke="#2563eb" />
          <Area type="monotone" dataKey="Row" stackId="1" fill="#7c3aed" stroke="#7c3aed" />
          <Area type="monotone" dataKey="Semi-Detached" stackId="1" fill="#dc2626" stroke="#dc2626" />
          <Area type="monotone" dataKey="Single" stackId="1" fill="#f59e0b" stroke="#f59e0b" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
