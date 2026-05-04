import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCurrency } from '@/lib/format'

export interface TrendDatum {
  month: string
  expected: number
  collected: number
}

export function CollectionChart({ data }: { data: TrendDatum[] }) {
  return (
    <div className="h-64 w-full md:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E4DE" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B6B65' }} />
          <YAxis
            tick={{ fontSize: 11, fill: '#6B6B65' }}
            tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            formatter={(value: number) => formatCurrency(value)}
            contentStyle={{ borderRadius: 12, borderColor: '#E5E4DE' }}
          />
          <Legend />
          <Bar dataKey="expected" name="Expected" fill="#D1D0C8" radius={[4, 4, 0, 0]} />
          <Bar dataKey="collected" name="Collected" fill="#0F6E56" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
