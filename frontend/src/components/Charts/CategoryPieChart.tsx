import React, { memo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { CategoryBreakdown } from '../../types';
import { formatINR } from '../../utils/currency';

interface Props {
  data: CategoryBreakdown[];
}

// inExpense signature category palette (Royal Blues, Greens, Slate)
const INEXPENSE_COLORS = [
  '#2563eb', // Royal Blue
  '#1b7f4d', // Money Green
  '#c24129', // Expense Terracotta
  '#3b82f6', // Accent Blue
  '#f59e0b', // Auto Amber
  '#06b6d4', // Heloc Cyan
  '#0284c7', // Sky Blue
  '#ec4899', // Medical Pink
  '#ea580c', // Crypto Orange
  '#64748b', // Other Slate
];

export const CategoryPieChart: React.FC<Props> = memo(({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-ink-muted dark:text-ink-darkmuted">
        <p className="text-xs">No expense records found for this period</p>
      </div>
    );
  }

  const chartData = data.map((item, index) => {
    let sliceColor = item.color || INEXPENSE_COLORS[index % INEXPENSE_COLORS.length];
    if (sliceColor === '#8b5cf6' || sliceColor === '#7355be' || sliceColor === '#8365ce' || sliceColor === '#9376de') {
      sliceColor = '#2563eb';
    }
    return {
      name: item.category_name,
      value: Number(item.total_amount),
      color: sliceColor,
    };
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const entry = payload[0];
      return (
        <div className="bg-[#141210] text-[#f2efe9] text-xs rounded-xl px-3 py-2 shadow-2xl border border-[#24211d]">
          <p className="font-semibold text-white">{entry.name}</p>
          <p className="text-[#3b82f6] font-mono font-bold mt-0.5">
            {formatINR(entry.value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={95}
            paddingAngle={3}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => (
              <span className="text-[11px] text-ink-muted dark:text-ink-darkmuted font-medium">
                {value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
});

CategoryPieChart.displayName = 'CategoryPieChart';
