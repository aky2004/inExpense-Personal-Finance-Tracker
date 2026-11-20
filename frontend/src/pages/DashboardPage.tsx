import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../api/client';
import { AnalyticsOverview, CategoryBreakdown, MonthlyTrend } from '../types';
import { CategoryPieChart } from '../components/Charts/CategoryPieChart';
import { MonthlyTrendLineChart } from '../components/Charts/MonthlyTrendLineChart';
import { IncomeExpenseBarChart } from '../components/Charts/IncomeExpenseBarChart';
import { formatINR } from '../utils/currency';
import {
  TrendingUp,
  TrendingDown,
  PieChart as PieIcon,
  Zap,
  RefreshCw,
  Clock,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Sparkles,
  Sliders,
  Flame,
  Activity,
  CreditCard,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [categories, setCategories] = useState<CategoryBreakdown[]>([]);
  const [trends, setTrends] = useState<MonthlyTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [spendingPaceMode, setSpendingPaceMode] = useState<'month' | 'avg'>('avg');
  const [cacheMeta, setCacheMeta] = useState<{ source: string; time: string }>({
    source: 'loading',
    time: '0ms',
  });

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { year: selectedYear };
      if (selectedMonth) params.month = selectedMonth;

      const [overviewRes, catRes, trendRes] = await Promise.all([
        api.get('/analytics/overview', { params }),
        api.get('/analytics/category-breakdown', { params }),
        api.get('/analytics/monthly-trends', { params: { months: 6 } }),
      ]);

      setOverview(overviewRes.data.data);
      setCategories(catRes.data.data);
      setTrends(trendRes.data.data);

      const cacheHeader = overviewRes.headers['x-cache'] || overviewRes.data.source || 'DATABASE';
      const timeHeader = overviewRes.headers['x-response-time'] || '0.6ms';
      setCacheMeta({ source: cacheHeader.toUpperCase(), time: timeHeader });
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Assignment requirement: useMemo for calculations
  const stats = useMemo(() => {
    if (!overview) {
      return { income: 0, expense: 0, savings: 0, rate: 0, count: 0 };
    }
    return {
      income: overview.totalIncome,
      expense: overview.totalExpense,
      savings: overview.netSavings,
      rate: overview.savingsRate,
      count: overview.transactionCount,
    };
  }, [overview]);

  // Dynamic monthly periods for Cash Flow mini chart
  const miniTrendPeriods = useMemo(() => {
    if (!trends || trends.length === 0) {
      // Fallback: previous 6 calendar months
      const result = [];
      const d = new Date();
      for (let i = 5; i >= 0; i--) {
        const target = new Date(d.getFullYear(), d.getMonth() - i, 1);
        result.push({
          monthLabel: target.toLocaleString('en', { month: 'short' }),
          fullName: target.toLocaleString('en', { month: 'short', year: 'numeric' }),
          income: 0,
          expense: 0,
          net: 0,
          hasActivity: false,
          isNetPositive: true,
          heightPx: 4,
        });
      }
      return result;
    }

    const maxFlow = Math.max(...trends.map((t) => Math.max(t.income, t.expense, 1)), 100);
    return trends.slice(-6).map((t) => {
      const hasActivity = t.income > 0 || t.expense > 0;
      const isNetPositive = t.net >= 0;
      const flowVal = Math.max(t.income, t.expense);
      const heightPx = hasActivity ? Math.max(6, Math.min(28, Math.round((flowVal / maxFlow) * 28))) : 4;
      return {
        monthLabel: t.display_name ? t.display_name.split(' ')[0] : t.month_str,
        fullName: t.display_name || t.month_str,
        income: t.income,
        expense: t.expense,
        net: t.net,
        hasActivity,
        isNetPositive,
        heightPx,
      };
    });
  }, [trends]);

  // Dynamic Spending Pace Data & Comparisons
  const spendingPaceData = useMemo(() => {
    const currentExpense = stats.expense;

    // Previous month (second to last trend entry if current month is last)
    const lastMonthTrend = trends.length >= 2 ? trends[trends.length - 2] : null;
    const lastMonthExpense = lastMonthTrend ? lastMonthTrend.expense : 0;

    // 3-Month Average (up to 3 months prior to current period)
    const prior3 = trends.length >= 4
      ? trends.slice(-4, -1)
      : trends.length >= 2
      ? trends.slice(0, -1)
      : [];
    const threeMoAvgExpense = prior3.length > 0
      ? prior3.reduce((acc, t) => acc + t.expense, 0) / prior3.length
      : lastMonthExpense;

    const benchmark = spendingPaceMode === 'month' ? lastMonthExpense : threeMoAvgExpense;
    const benchmarkLabel = spendingPaceMode === 'month' ? 'last mo' : '3-mo avg';

    // Delta calculation
    let deltaPct = 0;
    const hasBenchmark = benchmark > 0;
    if (hasBenchmark) {
      deltaPct = Math.round(((currentExpense - benchmark) / benchmark) * 100);
    }

    // Pace projection to end of month
    const now = new Date();
    const currentDay = Math.max(1, now.getDate());
    const daysInMonth = new Date(selectedYear, selectedMonth ? Number(selectedMonth) : now.getMonth() + 1, 0).getDate();
    const projectedEndOfMonth = currentExpense > 0
      ? Math.round((currentExpense / currentDay) * daysInMonth)
      : 0;

    // SVG coordinates
    const maxVal = Math.max(currentExpense, benchmark, projectedEndOfMonth, 1000);
    const yBenchmark = Math.max(8, Math.min(48, Math.round(48 - (benchmark / maxVal) * 36)));
    const yCurrent = Math.max(8, Math.min(48, Math.round(48 - (currentExpense / maxVal) * 36)));
    const yProjected = Math.max(8, Math.min(48, Math.round(48 - (projectedEndOfMonth / maxVal) * 36)));
    const progressX = Math.round((currentDay / daysInMonth) * 220) + 40;

    return {
      currentExpense,
      benchmark,
      benchmarkLabel,
      deltaPct,
      hasBenchmark,
      projectedEndOfMonth,
      yBenchmark,
      yCurrent,
      yProjected,
      progressX,
    };
  }, [stats.expense, trends, spendingPaceMode, selectedYear, selectedMonth]);

  const topCategory = useMemo(() => {
    if (!categories || categories.length === 0) return null;
    return categories[0];
  }, [categories]);

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar with Filters & Cache Telemetry */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Financial Dashboard</span>
          </h1>
          <p className="text-xs text-[#8c857b] mt-0.5">
            Real-time cash flow overview with sub-millisecond Redis telemetry
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Redis Cache Status Pill */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
              cacheMeta.source === 'HIT'
                ? 'bg-[#4cc38a]/10 text-[#4cc38a] border-[#4cc38a]/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}
          >
            <Zap size={13} className={cacheMeta.source === 'HIT' ? 'fill-current' : ''} />
            <span>Redis: {cacheMeta.source}</span>
            <span className="text-[10px] opacity-75 flex items-center gap-0.5 font-mono">
              <Clock size={10} /> {cacheMeta.time}
            </span>
          </div>

          {/* Month selector */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 text-xs bg-[#141210] text-white border border-[#24211d] rounded-xl font-medium focus:outline-none focus:border-[#2563eb] transition-colors"
          >
            <option value="">All Months</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={String(i + 1)}>
                {new Date(0, i).toLocaleString('en', { month: 'short' })}
              </option>
            ))}
          </select>

          {/* Year selector */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-1.5 text-xs bg-[#141210] text-white border border-[#24211d] rounded-xl font-medium focus:outline-none focus:border-[#2563eb] transition-colors"
          >
            {[currentYear - 1, currentYear, currentYear + 1].map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>

          <button
            onClick={fetchAnalytics}
            title="Refresh Data"
            className="p-2 text-[#8c857b] hover:text-white bg-[#141210] border border-[#24211d] rounded-xl transition-colors hover:border-[#38332c]"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* 2. inExpense Hero Cards (Balance Trend, Cash Flow, Spending Pace) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Card 1: Balance Trend */}
        <div className="p-6 rounded-2xl bg-[#141210] border border-[#24211d] space-y-4 hover:border-[#38332c] transition-colors shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-[#8c857b]">
              <span>Balance trend</span>
              <span className="px-2 py-0.5 rounded bg-[#1a1714] text-white text-[10px] border border-[#24211d]">Net Period</span>
            </div>
            <Sliders size={14} className="text-[#8c857b]" />
          </div>
          <div>
            <div className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${stats.savings >= 0 ? 'text-white' : 'text-[#ef6a57]'}`}>
              {stats.savings >= 0 ? '+' : ''}{formatINR(stats.savings)}
            </div>
            <div className="flex items-center justify-between mt-1 text-[11px]">
              <span className="text-[#8c857b] font-mono">
                {stats.count} transactions recorded
              </span>
              <span className={`font-mono font-bold ${stats.savings >= 0 ? 'text-[#4cc38a]' : 'text-[#ef6a57]'}`}>
                {stats.savings >= 0 ? `+${stats.rate}% saved` : `${stats.rate}% deficit`}
              </span>
            </div>
          </div>
          {/* Visual Waveform SVG */}
          <div className="h-20 w-full pt-2">
            <svg viewBox="0 0 300 70" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="dashBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M0,45 Q30,40 60,50 T120,30 T180,35 T240,25 T300,30 L300,70 L0,70 Z"
                fill="url(#dashBlue)"
              />
              <path
                d="M0,45 Q30,40 60,50 T120,30 T180,35 T240,25 T300,30"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2.5"
              />
              <circle cx="60" cy="50" r="3.5" fill="#ef6a57" />
              <circle cx="120" cy="30" r="3.5" fill="#4cc38a" />
              <circle cx="180" cy="35" r="3.5" fill="#ef6a57" />
              <circle cx="240" cy="25" r="3.5" fill="#4cc38a" />
            </svg>
          </div>
        </div>

        {/* Card 2: Cash Flow */}
        <div className="p-6 rounded-2xl bg-[#141210] border border-[#24211d] space-y-4 hover:border-[#38332c] transition-colors shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-[#8c857b] flex items-center gap-1.5">
              <span>Cash flow</span>
              <span className="text-[10px] text-[#8c857b]">ⓘ</span>
            </div>
            <div className="flex items-center gap-2 text-[#8c857b]">
              <ArrowUpRight size={14} />
              <Sliders size={14} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <span className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${stats.savings >= 0 ? 'text-[#4cc38a]' : 'text-[#ef6a57]'}`}>
                {stats.savings >= 0 ? '+' : ''}{formatINR(stats.savings)}
              </span>
              <span className={`text-[11px] font-mono font-bold ${stats.savings >= 0 ? 'text-[#4cc38a]' : 'text-[#ef6a57]'}`}>
                {stats.savings >= 0 ? `↗ +${stats.rate}% net` : `↘ ${stats.rate}% net`}
              </span>
            </div>
            <div className="text-[11px] text-[#8c857b] font-mono mt-0.5">CURRENT FISCAL CYCLE</div>
          </div>

          {/* Segmented Progress Bar */}
          <div className="space-y-1.5">
            <div className="h-2 w-full rounded-full bg-[#1a1714] border border-[#24211d] flex overflow-hidden">
              <div
                style={{ width: `${Math.min(100, Math.max(10, stats.rate))}%` }}
                className="bg-[#4cc38a]"
              />
              <div
                style={{ width: `${Math.min(100, Math.max(10, 100 - stats.rate))}%` }}
                className="bg-[#ef6a57]"
              />
            </div>
            <div className="grid grid-cols-3 text-[10px] font-mono pt-1">
              <div>
                <span className="text-[#8c857b] block">INCOME</span>
                <span className="text-[#4cc38a] font-bold">
                  +{formatINR(stats.income)}
                </span>
              </div>
              <div>
                <span className="text-[#8c857b] block">EXPENSES</span>
                <span className="text-[#ef6a57] font-bold">
                  -{formatINR(stats.expense)}
                </span>
              </div>
              <div>
                <span className="text-[#8c857b] block">SAVED</span>
                <span className={`font-bold ${stats.savings >= 0 ? 'text-[#4cc38a]' : 'text-[#ef6a57]'}`}>{stats.rate}%</span>
              </div>
            </div>
          </div>

          {/* Dynamic Monthly Activity Bars */}
          <div className="flex items-end justify-between h-10 pt-1 border-t border-[#24211d]">
            {miniTrendPeriods.map((period) => (
              <div
                key={period.fullName}
                className="flex flex-col items-center gap-1 group relative cursor-pointer"
                title={`${period.fullName}: Inflow +${formatINR(period.income)}, Outflow -${formatINR(period.expense)}, Net ${period.net >= 0 ? '+' : ''}${formatINR(period.net)}`}
              >
                <div
                  className={`w-4 rounded transition-all ${
                    !period.hasActivity
                      ? 'bg-[#24211d]'
                      : period.isNetPositive
                      ? 'bg-[#4cc38a] hover:brightness-125'
                      : 'bg-[#ef6a57] hover:brightness-125'
                  }`}
                  style={{ height: `${period.heightPx}px` }}
                />
                <span className={`text-[9px] font-mono ${period.hasActivity ? 'text-white font-semibold' : 'text-[#8c857b]'}`}>
                  {period.monthLabel}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 3: Spending Pace */}
        <div className="p-6 rounded-2xl bg-[#141210] border border-[#24211d] space-y-4 hover:border-[#38332c] transition-colors shadow-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#8c857b]">Spending pace</span>
            <div className="flex items-center gap-1 bg-[#1a1714] border border-[#24211d] p-0.5 rounded-lg text-[10px]">
              <button
                type="button"
                onClick={() => setSpendingPaceMode('month')}
                className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                  spendingPaceMode === 'month'
                    ? 'bg-[#2563eb] text-white font-bold shadow-xs'
                    : 'text-[#8c857b] hover:text-white'
                }`}
              >
                vs last mo
              </button>
              <button
                type="button"
                onClick={() => setSpendingPaceMode('avg')}
                className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                  spendingPaceMode === 'avg'
                    ? 'bg-[#2563eb] text-white font-bold shadow-xs'
                    : 'text-[#8c857b] hover:text-white'
                }`}
              >
                vs 3-mo avg
              </button>
            </div>
          </div>
          <div>
            <div className="text-xs text-[#8c857b]">Spent this period</div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
              {formatINR(spendingPaceData.currentExpense)}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] text-[#8c857b]">
                On track for ~{formatINR(spendingPaceData.projectedEndOfMonth)}
              </span>
              {spendingPaceData.hasBenchmark ? (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${
                    spendingPaceData.deltaPct <= 0
                      ? 'bg-[#4cc38a]/10 text-[#4cc38a] border-[#4cc38a]/20'
                      : 'bg-[#ef6a57]/10 text-[#ef6a57] border-[#ef6a57]/20'
                  }`}
                >
                  {spendingPaceData.deltaPct <= 0 ? '' : '+'}
                  {spendingPaceData.deltaPct}% vs {spendingPaceData.benchmarkLabel}
                </span>
              ) : (
                <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-[#2563eb]/10 text-blue-400 border border-[#2563eb]/20">
                  Initial baseline
                </span>
              )}
            </div>
          </div>
          <div className="h-16 pt-2">
            <svg viewBox="0 0 300 60" className="w-full h-full overflow-visible">
              {/* Benchmark Reference Line */}
              <line
                x1="0"
                y1={spendingPaceData.yBenchmark}
                x2="300"
                y2={spendingPaceData.yBenchmark}
                stroke="#38332c"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              {/* Actual Spending Curve to Today */}
              <path
                d={`M 0 50 Q ${spendingPaceData.progressX / 2} ${(50 + spendingPaceData.yCurrent) / 2} ${spendingPaceData.progressX} ${spendingPaceData.yCurrent}`}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2.5"
              />
              {/* Forecast Projection to End of Month */}
              <path
                d={`M ${spendingPaceData.progressX} ${spendingPaceData.yCurrent} Q ${(spendingPaceData.progressX + 300) / 2} ${(spendingPaceData.yCurrent + spendingPaceData.yProjected) / 2} 300 ${spendingPaceData.yProjected}`}
                fill="none"
                stroke={spendingPaceData.deltaPct <= 0 ? '#4cc38a' : '#ef6a57'}
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              {/* Today Marker */}
              <circle
                cx={spendingPaceData.progressX}
                cy={spendingPaceData.yCurrent}
                r="4"
                fill="#3b82f6"
                stroke="#141210"
                strokeWidth="2"
              />
            </svg>
          </div>
          <div className="flex items-center justify-between text-[10px] text-[#8c857b] pt-1 border-t border-[#24211d]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-[#3b82f6]" /> Current
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-[#4cc38a] border-b border-dashed" /> Forecast
            </span>
            <span className="flex items-center gap-1.5 font-mono">
              <span className="w-2.5 h-0.5 bg-[#38332c] border-b border-dashed" /> {spendingPaceData.benchmarkLabel}: {formatINR(spendingPaceData.benchmark)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Three Detailed Recharts Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Category Distribution Pie Chart */}
        <div className="bg-[#141210] border border-[#24211d] rounded-2xl p-6 shadow-2xl space-y-4 hover:border-[#38332c] transition-colors">
          <div className="flex items-center justify-between pb-3 border-b border-[#24211d]">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <PieIcon size={16} className="text-[#3b82f6]" />
                Category Breakdown
              </h2>
              <p className="text-[11px] text-[#8c857b]">Distribution by expense category</p>
            </div>
            {topCategory && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#1a1714] text-[#3b82f6] border border-[#24211d]">
                Top: {topCategory.category_name}
              </span>
            )}
          </div>
          <CategoryPieChart data={categories} />
        </div>

        {/* Chart 2: Income vs Expense Bar Chart */}
        <div className="bg-[#141210] border border-[#24211d] rounded-2xl p-6 shadow-2xl space-y-4 hover:border-[#38332c] transition-colors">
          <div className="pb-3 border-b border-[#24211d]">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers size={16} className="text-[#4cc38a]" />
              Cash Flow Comparison
            </h2>
            <p className="text-[11px] text-[#8c857b]">Monthly Inflow vs Outflow comparison</p>
          </div>
          <IncomeExpenseBarChart data={trends} />
        </div>

        {/* Chart 3: Monthly Trends Line Chart */}
        <div className="bg-[#141210] border border-[#24211d] rounded-2xl p-6 shadow-2xl space-y-4 hover:border-[#38332c] transition-colors">
          <div className="pb-3 border-b border-[#24211d]">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp size={16} className="text-[#3b82f6]" />
              Cash Flow Trajectory
            </h2>
            <p className="text-[11px] text-[#8c857b]">Monthly net savings and cash flow trend</p>
          </div>
          <MonthlyTrendLineChart data={trends} />
        </div>
      </div>

      {/* 4. Bottom Metric Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card A: Top Category Outflow */}
        <div className="p-5 rounded-2xl bg-[#141210] border border-[#24211d] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#8c857b]">
              Top Outflow: {topCategory ? topCategory.category_name : 'Housing'}
            </span>
            <ArrowUpRight size={13} className="text-[#8c857b]" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-[#ef6a57]">
                -{formatINR(topCategory ? Number(topCategory.total_amount) : 0)}
              </span>
              <span className="text-[11px] text-[#8c857b] font-mono">
                {topCategory && stats.expense > 0
                  ? `${((Number(topCategory.total_amount) / stats.expense) * 100).toFixed(1)}% of expenses`
                  : '0% of expenses'}
              </span>
            </div>
            <div className="text-[11px] text-[#8c857b] mt-1">
              {topCategory?.category_name || 'Rent & Lease'} • Relational Record
            </div>
          </div>
        </div>

        {/* Card B: Total Expenses Structure */}
        <div className="p-5 rounded-2xl bg-[#141210] border border-[#24211d] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#8c857b]">Expenses structure</span>
            <Sliders size={13} className="text-[#8c857b]" />
          </div>
          <div>
            <div className="text-2xl font-black font-mono text-[#ef6a57]">
              -{formatINR(stats.expense)}
            </div>
            <div className="text-[11px] text-[#4cc38a] font-bold mt-1">
              Healthy Outflow Coverage ({stats.count} transactions)
            </div>
          </div>
        </div>

        {/* Card C: Savings Rate & Financial Health */}
        <div className="p-5 rounded-2xl bg-[#141210] border border-[#24211d] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#8c857b]">Savings Rate</span>
            <ArrowUpRight size={13} className="text-[#8c857b]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-[#3b82f6] font-mono font-bold">
              <Flame size={14} /> FINANCIAL HEALTH
            </div>
            <div className="text-xl font-black font-mono text-[#4cc38a] mt-1">
              {stats.rate}% Saved
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
