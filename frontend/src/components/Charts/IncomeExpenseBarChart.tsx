import React, { memo } from 'react';
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
import { MonthlyTrend } from '../../types';
import { formatINR } from '../../utils/currency';

interface Props {
  data: MonthlyTrend[];
}

export const IncomeExpenseBarChart: React.FC<Props> = memo(({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-ink-muted dark:text-ink-darkmuted">
        <p className="text-xs">No comparison data available</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#141210] text-[#f2efe9] text-xs rounded-xl p-3 shadow-2xl border border-[#24211d]">
          <p className="font-semibold mb-1 text-[#8c857b]">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`bar-${index}`} className="flex justify-between gap-4 font-mono font-medium" style={{ color: entry.fill }}>
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
        <BarChart data={data} margin={{ top: 10, right: 15, left: -10, bottom: 5 }}>
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
          <Bar dataKey="income" name="Income" fill="#4cc38a" radius={[6, 6, 0, 0]} />
          <Bar dataKey="expense" name="Expense" fill="#ef6a57" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

IncomeExpenseBarChart.displayName = 'IncomeExpenseBarChart';
