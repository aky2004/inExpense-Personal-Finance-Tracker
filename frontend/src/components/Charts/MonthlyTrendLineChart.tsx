import React, { memo } from 'react';
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
import { MonthlyTrend } from '../../types';
import { formatINR } from '../../utils/currency';

interface Props {
  data: MonthlyTrend[];
}

export const MonthlyTrendLineChart: React.FC<Props> = memo(({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-ink-muted dark:text-ink-darkmuted">
        <p className="text-xs">No trend data available</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#141210] text-[#f2efe9] text-xs rounded-xl p-3 shadow-2xl border border-[#24211d]">
          <p className="font-semibold mb-1 text-[#8c857b]">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} className="flex justify-between gap-4 font-mono font-medium" style={{ color: entry.color }}>
              <span>{entry.name}:</span>
              <span>{formatINR(entry.value)}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 15, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#24211d" opacity={0.8} />
          <XAxis
            dataKey="display_name"
            tick={{ fill: '#8c857b', fontSize: 10, fontFamily: 'Manrope' }}
            axisLine={{ stroke: '#24211d' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#8c857b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
            axisLine={{ stroke: '#24211d' }}
            tickLine={false}
            tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => (
              <span className="text-[11px] text-[#8c857b] font-medium">
                {value}
              </span>
            )}
          />
          <Line
            type="monotone"
            dataKey="income"
            name="Income"
            stroke="#4cc38a"
            strokeWidth={2.5}
            dot={{ r: 3.5, fill: '#4cc38a' }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="expense"
            name="Expense"
            stroke="#ef6a57"
            strokeWidth={2.5}
            dot={{ r: 3.5, fill: '#ef6a57' }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="net"
            name="Net Savings"
            stroke="#3b82f6"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={{ r: 3, fill: '#3b82f6' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});

MonthlyTrendLineChart.displayName = 'MonthlyTrendLineChart';
