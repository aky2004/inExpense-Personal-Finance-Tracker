import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { Account, AccountsSummary, Transaction } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  formatINR,
  formatAmountWithCurrency,
  convertToINR,
  CURRENCY_LIST,
} from '../utils/currency';
import {
  Wallet,
  Plus,
  CreditCard,
  Building,
  Car,
  PiggyBank,
  TrendingUp,
  Plane,
  ShieldAlert,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  X,
  ChevronRight,
  ChevronDown,
  Check,
  Edit2,
  Trash2,
  ExternalLink,
  PieChart as PieIcon,
  Sliders,
  Search,
  Clock,
  DollarSign,
  Tag,
  Shield,
  Activity,
  Layers,
  FileSpreadsheet,
  Sparkles,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

const ACCOUNT_CATEGORIES = [
  'General',
  'Cash',
  'Current account',
  'Credit card',
  'Saving account',
  'Bonus',
  'Insurance',
  'Investment',
  'Vehicle asset',
  'Overdraft',
  'Crypto',
];

const CURRENCIES = CURRENCY_LIST;

const GROUP_OPTIONS = [
  'Day-to-day',
  'Savings & Goals',
  'Investments',
  'Vehicles',
  'Liabilities',
];

const CHART_COLORS = ['#2563eb', '#4cc38a', '#ef6a57', '#3b82f6', '#f59e0b', '#06b6d4', '#ec4899', '#0284c7'];

export const AccountsPage: React.FC = () => {
  const { isReadOnly } = useAuth();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [summary, setSummary] = useState<AccountsSummary>({
    totalBalance: 0,
    assets: 0,
    liabilities: 0,
    vehicles: 0,
    accountCount: 0,
  });
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [accountDetails, setAccountDetails] = useState<(Account & { transactions: Transaction[] }) | null>(null);
  const [accountAnalytics, setAccountAnalytics] = useState<{ categories: any[]; trends: any[] } | null>(null);
  const [rightTab, setRightTab] = useState<'transactions' | 'analytics'>('transactions');

  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [quickCreating, setQuickCreating] = useState<string | null>(null);
  const [upcomingNotice, setUpcomingNotice] = useState<string | null>(null);

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [modalName, setModalName] = useState('');
  const [modalCategory, setModalCategory] = useState('General');
  const [modalCurrency, setModalCurrency] = useState('INR');
  const [modalInitialBalance, setModalInitialBalance] = useState('0');
  const [modalCreditLimit, setModalCreditLimit] = useState('0');
  const [modalDefaultPayment, setModalDefaultPayment] = useState('None');
  const [modalGroupName, setModalGroupName] = useState('Day-to-day');
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Fetch all accounts and portfolio metrics
  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/accounts');
      const data: Account[] = res.data.data;
      setAccounts(data);
      if (res.data.summary) {
        setSummary(res.data.summary);
      }

      // Default select the first account if none selected
      if (data.length > 0 && selectedAccountId === null) {
        setSelectedAccountId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load accounts:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedAccountId]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Fetch selected account details, transactions, and analytics
  const fetchSelectedAccountData = useCallback(async (id: number) => {
    setDetailsLoading(true);
    try {
      const [detailRes, analyticsRes] = await Promise.all([
        api.get(`/accounts/${id}`),
        api.get(`/accounts/${id}/analytics`),
      ]);
      setAccountDetails(detailRes.data.data);
      setAccountAnalytics(analyticsRes.data);
    } catch (err) {
      console.error('Failed to load account details:', err);
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedAccountId) {
      fetchSelectedAccountData(selectedAccountId);
    }
  }, [selectedAccountId, fetchSelectedAccountData]);

  // Group accounts by group_name
  const groupedAccounts = useMemo(() => {
    const groups: { [key: string]: { accounts: Account[]; total: number } } = {};
    accounts.forEach((acc) => {
      const g = acc.group_name || 'Manual Accounts';
      if (!groups[g]) {
        groups[g] = { accounts: [], total: 0 };
      }
      groups[g].accounts.push(acc);
      groups[g].total += Number(acc.current_balance) || 0;
    });
    return groups;
  }, [accounts]);

  // Modal Handlers
  const handleOpenCreateModal = (defaultGroup = 'Day-to-day', defaultCategory = 'General') => {
    if (isReadOnly) return;
    setEditingAccount(null);
    setModalName('');
    setModalCategory(defaultCategory);
    setModalCurrency('INR');
    setModalInitialBalance('0');
    setModalCreditLimit('0');
    setModalDefaultPayment('None');
    setModalGroupName(defaultGroup);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleQuickCreateAccount = async (
    name: string,
    category: string,
    group_name: string,
    initial_balance: number,
    credit_limit: number,
    default_payment_type: string
  ) => {
    if (isReadOnly) return;
    setQuickCreating(name);
    try {
      await api.post('/accounts', {
        name,
        category,
        group_name,
        currency: 'INR',
        initial_balance,
        credit_limit,
        default_payment_type,
        color: '#2563eb',
        icon: category === 'Credit card' ? 'CreditCard' : category === 'Cash' ? 'Wallet' : 'Building',
      });
      await fetchAccounts();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create account.');
    } finally {
      setQuickCreating(null);
    }
  };

  const handleOpenEditModal = (acc: Account) => {
    if (isReadOnly) return;
    setEditingAccount(acc);
    setModalName(acc.name);
    setModalCategory(acc.category);
    setModalCurrency(acc.currency || 'USD');
    setModalInitialBalance(String(acc.initial_balance || 0));
    setModalCreditLimit(String(acc.credit_limit || 0));
    setModalDefaultPayment(acc.default_payment_type || 'None');
    setModalGroupName(acc.group_name || 'Day-to-day');
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleDeleteAccount = async (id: number, name: string) => {
    if (isReadOnly) return;
    if (!window.confirm(`Are you sure you want to delete account "${name}"?`)) return;

    try {
      await api.delete(`/accounts/${id}`);
      setSelectedAccountId(null);
      fetchAccounts();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete account');
    }
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;

    if (!modalName.trim()) {
      setModalError('Account name is required.');
      return;
    }

    setModalSubmitting(true);
    setModalError(null);

    try {
      const payload = {
        name: modalName.trim(),
        category: modalCategory,
        currency: modalCurrency,
        initial_balance: parseFloat(modalInitialBalance) || 0,
        credit_limit: parseFloat(modalCreditLimit) || 0,
        default_payment_type: modalDefaultPayment,
        group_name: modalGroupName,
      };

      if (editingAccount) {
        await api.put(`/accounts/${editingAccount.id}`, payload);
      } else {
        const res = await api.post('/accounts', payload);
        setSelectedAccountId(res.data.data.id);
      }

      setIsModalOpen(false);
      fetchAccounts();
    } catch (err: any) {
      setModalError(err.response?.data?.error || 'Failed to save account');
    } finally {
      setModalSubmitting(false);
    }
  };

  const getAccountIcon = (category: string) => {
    const c = category.toLowerCase();
    if (c.includes('cash')) return <Wallet size={15} />;
    if (c.includes('credit')) return <CreditCard size={15} />;
    if (c.includes('saving')) return <PiggyBank size={15} />;
    if (c.includes('vehicle')) return <Car size={15} />;
    if (c.includes('invest')) return <TrendingUp size={15} />;
    return <Building size={15} />;
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Accounts</span>
          </h1>
          <p className="text-xs text-[#8c857b] mt-0.5">
            Manage multi-currency bank accounts, credit lines, assets, and per-account telemetry
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleOpenCreateModal('Day-to-day', 'General')}
            disabled={isReadOnly}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#2563eb] hover:bg-[#1d4ed8] transition-all shadow-md shadow-[#2563eb]/30 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={14} />
            <span>Add account</span>
          </button>
        </div>
      </div>

      {/* Read-Only Status Bar */}
      {isReadOnly && (
        <div className="p-3.5 bg-amber-950/30 border border-amber-900/60 rounded-xl text-xs text-amber-300 flex items-center gap-2.5">
          <ShieldAlert size={16} className="text-amber-400 shrink-0" />
          <span>
            <strong>Read-Only Mode:</strong> Account modification and creation are locked. You can view all balances and per-account analytics.
          </span>
        </div>
      )}

      {/* 2. KPI Portfolio Overview Card (Total Balance, Assets, Liabilities, Vehicles) */}
      <div className="p-6 rounded-2xl bg-[#141210] border border-[#24211d] shadow-2xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-center">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#8c857b]">
              Total Balance
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-white mt-1">
              ≈ {formatINR(summary.totalBalance)}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#8c857b]">
              Assets
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-[#4cc38a] mt-1">
              {formatINR(summary.assets)}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#8c857b]">
              Liabilities
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-[#ef6a57] mt-1">
              {summary.liabilities < 0 ? '-' : ''}{formatINR(Math.abs(summary.liabilities))}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#8c857b]">
              Vehicles &amp; Assets
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-white mt-1">
              {formatINR(summary.vehicles)}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bank Connections (Upcoming Feature Banner) */}
      <div className="p-4 rounded-xl bg-[#100e0c] border border-[#24211d] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-white uppercase font-bold text-[10px] tracking-wider">
              Bank Connections
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-950/40 text-blue-300 border border-blue-800/60">
              Upcoming • v1.1
            </span>
          </div>
          <p className="text-[#8c857b] leading-relaxed">
            Automated live bank synchronization via Plaid and OpenBanking APIs is in active development. Manual account management and balance tracking are fully operational.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setUpcomingNotice('Automated bank synchronization via Plaid & OpenBanking is scheduled for v1.1. You can track and manage all accounts manually in the meantime.');
            setTimeout(() => setUpcomingNotice(null), 4000);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a1714] text-[#8c857b] hover:text-[#3b82f6] border border-[#24211d] hover:border-[#38332c] transition-colors font-semibold text-xs shrink-0"
        >
          <Building size={13} />
          <span>Connect bank (Upcoming)</span>
        </button>
      </div>

      {upcomingNotice && (
        <div className="p-3 bg-blue-950/30 border border-blue-800/60 rounded-xl text-xs text-blue-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-[#3b82f6] shrink-0" />
            <span>{upcomingNotice}</span>
          </div>
          <button onClick={() => setUpcomingNotice(null)} className="text-[#8c857b] hover:text-white">
            <X size={13} />
          </button>
        </div>
      )}

      {/* 4. Accounts Content (Loading OR Enhanced Empty State OR Split Screen) */}
      {loading ? (
        <div className="h-96 flex flex-col items-center justify-center bg-[#141210] border border-[#24211d] rounded-2xl text-[#8c857b] gap-3">
          <div className="w-8 h-8 border-2 border-[#2563eb] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs">Loading accounts ledger...</p>
        </div>
      ) : accounts.length === 0 ? (
        <div className="bg-[#141210] border border-[#24211d] rounded-2xl p-8 sm:p-12 shadow-2xl space-y-8">
          <div className="max-w-xl mx-auto text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#2563eb]/10 border border-[#2563eb]/30 text-[#3b82f6] flex items-center justify-center mx-auto shadow-lg shadow-[#2563eb]/10">
              <Wallet size={32} />
            </div>

            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#1a1714] text-[#8c857b] border border-[#24211d]">
                <Layers size={11} className="text-[#3b82f6]" /> Accounts Directory Empty
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                No Accounts Configured Yet
              </h2>
              <p className="text-xs text-[#8c857b] leading-relaxed">
                Connect your bank accounts, credit cards, or cash wallets to track real-time balances, reconcile ledger transactions, and view automated cash flow analytics.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => handleOpenCreateModal()}
                disabled={isReadOnly}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-lg shadow-[#2563eb]/25 transition-all cursor-pointer active:scale-95"
              >
                <Plus size={15} /> Add First Account
              </button>
              <Link
                to="/import"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#1a1714] text-[#8c857b] hover:text-white border border-[#24211d] hover:border-[#38332c] transition-colors"
              >
                <FileSpreadsheet size={15} className="text-[#3b82f6]" /> Import Statement CSV
              </Link>
            </div>
          </div>

          {/* Quick-Seed Starter Accounts Strip */}
          <div className="border-t border-[#24211d] pt-6 max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Sparkles size={14} className="text-[#3b82f6]" /> Quick Starter Presets
              </span>
              <span className="text-[11px] text-[#8c857b]">1-Click standard configuration</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Preset 1: HDFC Salary Account */}
              <button
                type="button"
                onClick={() =>
                  handleQuickCreateAccount(
                    'HDFC Salary Account',
                    'Saving account',
                    'Day-to-day',
                    145000,
                    0,
                    'NetBanking'
                  )
                }
                disabled={isReadOnly || !!quickCreating}
                className="p-4 rounded-xl bg-[#1a1714] hover:bg-[#201d19] border border-[#24211d] hover:border-[#2563eb]/50 text-left transition-all group cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-[#2563eb]/10 text-[#3b82f6] flex items-center justify-center">
                    <Building size={15} />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[#4cc38a]">+₹1,45,000</span>
                </div>
                <h3 className="text-xs font-bold text-white mt-2 group-hover:text-[#3b82f6] transition-colors">
                  HDFC Salary Account
                </h3>
                <p className="text-[10px] text-[#8c857b] mt-0.5">Primary checking &amp; salary</p>
                <div className="mt-3 text-[10px] font-semibold text-[#2563eb] flex items-center gap-1">
                  <span>{quickCreating === 'HDFC Salary Account' ? 'Creating...' : '+ Quick Add'}</span>
                </div>
              </button>

              {/* Preset 2: SBI Platinum Card */}
              <button
                type="button"
                onClick={() =>
                  handleQuickCreateAccount(
                    'SBI Platinum Card',
                    'Credit card',
                    'Liabilities',
                    0,
                    200000,
                    'Credit card'
                  )
                }
                disabled={isReadOnly || !!quickCreating}
                className="p-4 rounded-xl bg-[#1a1714] hover:bg-[#201d19] border border-[#24211d] hover:border-[#2563eb]/50 text-left transition-all group cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-[#ef6a57]/10 text-[#ef6a57] flex items-center justify-center">
                    <CreditCard size={15} />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[#8c857b]">Limit: ₹2L</span>
                </div>
                <h3 className="text-xs font-bold text-white mt-2 group-hover:text-[#3b82f6] transition-colors">
                  SBI Platinum Card
                </h3>
                <p className="text-[10px] text-[#8c857b] mt-0.5">Credit line &amp; rewards</p>
                <div className="mt-3 text-[10px] font-semibold text-[#2563eb] flex items-center gap-1">
                  <span>{quickCreating === 'SBI Platinum Card' ? 'Creating...' : '+ Quick Add'}</span>
                </div>
              </button>

              {/* Preset 3: Cash & UPI Wallet */}
              <button
                type="button"
                onClick={() =>
                  handleQuickCreateAccount(
                    'Cash & UPI Wallet',
                    'Cash',
                    'Day-to-day',
                    5000,
                    0,
                    'UPI'
                  )
                }
                disabled={isReadOnly || !!quickCreating}
                className="p-4 rounded-xl bg-[#1a1714] hover:bg-[#201d19] border border-[#24211d] hover:border-[#2563eb]/50 text-left transition-all group cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-[#4cc38a]/10 text-[#4cc38a] flex items-center justify-center">
                    <Wallet size={15} />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[#4cc38a]">+₹5,000</span>
                </div>
                <h3 className="text-xs font-bold text-white mt-2 group-hover:text-[#3b82f6] transition-colors">
                  Cash &amp; UPI Wallet
                </h3>
                <p className="text-[10px] text-[#8c857b] mt-0.5">MobiKwik, Paytm &amp; UPI</p>
                <div className="mt-3 text-[10px] font-semibold text-[#2563eb] flex items-center gap-1">
                  <span>{quickCreating === 'Cash & UPI Wallet' ? 'Creating...' : '+ Quick Add'}</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ================= LEFT: Grouped Accounts List ================= */}
          <div className="lg:col-span-5 space-y-4">
            <div className="text-xs font-bold text-[#8c857b] uppercase tracking-wider px-1">
              Accounts Directory ({accounts.length})
            </div>

            <div className="space-y-4">
              {Object.keys(groupedAccounts).map((groupName) => {
                const grp = groupedAccounts[groupName];
                return (
                  <div
                    key={groupName}
                    className="bg-[#141210] border border-[#24211d] rounded-2xl overflow-hidden shadow-xl"
                  >
                    {/* Group Header */}
                    <div className="px-4 py-3 bg-[#1a1714] border-b border-[#24211d] flex items-center justify-between text-xs">
                      <span className="font-bold text-white">{groupName}</span>
                      <span className="text-[#8c857b] font-mono text-[11px]">
                        {grp.accounts.length} {grp.accounts.length === 1 ? 'account' : 'accounts'} ≈ {formatINR(grp.total)}
                      </span>
                    </div>

                    {/* Accounts Rows in this Group */}
                    <div className="divide-y divide-[#24211d]">
                      {grp.accounts.map((acc) => {
                        const isSelected = selectedAccountId === acc.id;
                        const bal = Number(acc.current_balance) || 0;
                        return (
                          <div
                            key={acc.id}
                            onClick={() => setSelectedAccountId(acc.id)}
                            className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors ${isSelected
                              ? 'bg-[#2563eb]/10 border-l-4 border-l-[#2563eb]'
                              : 'hover:bg-[#1a1714]/60'
                              }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-[#24211d] flex items-center justify-center text-[#3b82f6] shrink-0">
                                {getAccountIcon(acc.category)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-white truncate">
                                  {acc.name}
                                </p>
                                <p className="text-[10px] text-[#8c857b]">
                                  {acc.category} • {acc.currency}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <div className="text-right">
                                <span
                                  className={`font-mono text-xs font-bold block ${bal >= 0 ? 'text-white' : 'text-[#ef6a57]'
                                    }`}
                                >
                                  {bal < 0 ? '-' : ''}{formatAmountWithCurrency(Math.abs(bal), acc.currency).formattedNative}
                                </span>
                                {acc.currency !== 'INR' && (
                                  <span className="block text-[10px] text-[#8c857b] font-mono font-normal">
                                    ≈ {formatINR(convertToINR(bal, acc.currency))}
                                  </span>
                                )}
                              </div>
                              <ChevronRight size={14} className="text-[#8c857b]" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ================= RIGHT: Selected Account Detail & History ================= */}
          <div className="lg:col-span-7 space-y-5">
            {detailsLoading ? (
              <div className="h-96 flex flex-col items-center justify-center bg-[#141210] border border-[#24211d] rounded-2xl text-[#8c857b] gap-3">
                <div className="w-8 h-8 border-2 border-[#2563eb] border-t-transparent rounded-full animate-spin" />
                <p className="text-xs">Loading account telemetry...</p>
              </div>
            ) : accountDetails ? (
            <div className="space-y-5">
              {/* Card 1: Account Overview & Details */}
              <div className="bg-[#141210] border border-[#24211d] rounded-2xl p-6 shadow-2xl space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#24211d]">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#2563eb]/15 border border-[#2563eb]/30 flex items-center justify-center text-[#3b82f6]">
                      {getAccountIcon(accountDetails.category)}
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-white">{accountDetails.name}</h2>
                      <div className="text-2xl font-black font-mono mt-0.5 text-white flex items-baseline gap-2 flex-wrap">
                        <span>
                          {accountDetails.current_balance < 0 ? '-' : ''}
                          {formatAmountWithCurrency(Math.abs(accountDetails.current_balance), accountDetails.currency).formattedNative}
                        </span>
                        {accountDetails.currency !== 'INR' && (
                          <span className="text-xs text-[#8c857b] font-normal">
                            (≈ {formatINR(convertToINR(accountDetails.current_balance, accountDetails.currency))})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditModal(accountDetails)}
                      disabled={isReadOnly}
                      className="p-2 rounded-xl bg-[#1a1714] text-[#8c857b] hover:text-white border border-[#24211d] hover:border-[#38332c] transition-colors"
                      title="Edit Account Details"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteAccount(accountDetails.id, accountDetails.name)}
                      disabled={isReadOnly}
                      className="p-2 rounded-xl bg-[#1a1714] text-[#8c857b] hover:text-[#ef6a57] border border-[#24211d] hover:border-[#38332c] transition-colors"
                      title="Delete Account"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Account Details Metadata Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="p-3 bg-[#100e0c] rounded-xl border border-[#24211d]">
                    <span className="text-[#8c857b] text-[10px] uppercase font-bold block">
                      Initial Balance
                    </span>
                    <span className="font-mono font-bold text-white mt-1 block">
                      {formatAmountWithCurrency(accountDetails.initial_balance || 0, accountDetails.currency).formattedNative}
                    </span>
                  </div>

                  <div className="p-3 bg-[#100e0c] rounded-xl border border-[#24211d]">
                    <span className="text-[#8c857b] text-[10px] uppercase font-bold block">
                      Credit Limit
                    </span>
                    <span className="font-mono font-bold text-white mt-1 block">
                      {formatAmountWithCurrency(accountDetails.credit_limit || 0, accountDetails.currency).formattedNative}
                    </span>
                  </div>

                  <div className="p-3 bg-[#100e0c] rounded-xl border border-[#24211d]">
                    <span className="text-[#8c857b] text-[10px] uppercase font-bold block">
                      Category
                    </span>
                    <span className="font-semibold text-white mt-1 block">
                      {accountDetails.category}
                    </span>
                  </div>

                  <div className="p-3 bg-[#100e0c] rounded-xl border border-[#24211d]">
                    <span className="text-[#8c857b] text-[10px] uppercase font-bold block">
                      Payment Type
                    </span>
                    <span className="font-semibold text-white mt-1 block">
                      {accountDetails.default_payment_type || 'None'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Per-Account Transactions & Analytics Tabs */}
              <div className="bg-[#141210] border border-[#24211d] rounded-2xl overflow-hidden shadow-2xl">
                {/* Tabs Switcher */}
                <div className="px-5 py-3.5 bg-[#1a1714] border-b border-[#24211d] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setRightTab('transactions')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${rightTab === 'transactions'
                        ? 'bg-[#2563eb] text-white shadow-xs'
                        : 'text-[#8c857b] hover:text-white'
                        }`}
                    >
                      Transactions ({accountDetails.transactions?.length || 0})
                    </button>

                    <button
                      onClick={() => setRightTab('analytics')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${rightTab === 'analytics'
                        ? 'bg-[#2563eb] text-white shadow-xs'
                        : 'text-[#8c857b] hover:text-white'
                        }`}
                    >
                      Analytics
                    </button>
                  </div>

                  <Link
                    to={`/transactions?account=${encodeURIComponent(accountDetails.name)}`}
                    className="text-xs font-semibold text-[#8c857b] hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <span>View all</span>
                    <ExternalLink size={12} />
                  </Link>
                </div>

                {/* Tab Content: Transactions List */}
                {rightTab === 'transactions' && (
                  <div className="divide-y divide-[#24211d] max-h-[420px] overflow-y-auto">
                    {accountDetails.transactions && accountDetails.transactions.length > 0 ? (
                      accountDetails.transactions.map((tx) => {
                        const isIncome = tx.type === 'income';
                        const isTransfer = tx.type === 'transfer';
                        return (
                          <div
                            key={tx.id}
                            className="p-4 flex items-center justify-between hover:bg-[#1a1714]/80 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${isIncome
                                  ? 'bg-[#4cc38a]/10 text-[#4cc38a] border-[#4cc38a]/20'
                                  : isTransfer
                                    ? 'bg-[#2563eb]/10 text-[#3b82f6] border-[#2563eb]/20'
                                    : 'bg-[#ef6a57]/10 text-[#ef6a57] border-[#ef6a57]/20'
                                  }`}
                              >
                                {isIncome ? (
                                  <ArrowDownLeft size={14} />
                                ) : isTransfer ? (
                                  <ArrowLeftRight size={14} />
                                ) : (
                                  <ArrowUpRight size={14} />
                                )}
                              </div>

                              <div className="min-w-0">
                                <p className="text-xs font-bold text-white truncate">
                                  {tx.payee || tx.description || 'Transaction'}
                                </p>
                                <div className="flex items-center gap-2 text-[10px] text-[#8c857b] mt-0.5">
                                  <span>{tx.date}</span>
                                  {tx.category_name && <span>• {tx.category_name}</span>}
                                  {tx.tags && tx.tags.length > 0 && <span>• #{tx.tags[0]}</span>}
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span
                                className={`font-mono text-xs font-bold block ${isIncome
                                  ? 'text-[#4cc38a]'
                                  : isTransfer
                                    ? 'text-[#3b82f6]'
                                    : 'text-[#ef6a57]'
                                  }`}
                              >
                                {isIncome ? '+' : isTransfer ? '⇄ ' : '-'}
                                {formatAmountWithCurrency(tx.amount, tx.currency || accountDetails.currency).formattedNative}
                              </span>
                              {tx.currency && tx.currency !== 'INR' && (
                                <span className="block text-[10px] text-[#8c857b] font-mono font-normal">
                                  ≈ {formatINR(tx.amount_inr || convertToINR(tx.amount, tx.currency))}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-16 text-center text-[#8c857b] text-xs">
                        No transactions recorded for this account yet.
                      </div>
                    )}
                  </div>
                )}

                {/* Tab Content: Per-Account Analytics */}
                {rightTab === 'analytics' && (
                  <div className="p-6 space-y-6">
                    {/* Category Distribution for this account */}
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
                        Expense Breakdown ({accountDetails.name})
                      </h4>
                      {accountAnalytics?.categories && accountAnalytics.categories.length > 0 ? (
                        <div className="h-56">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={accountAnalytics.categories}
                                dataKey="total_amount"
                                nameKey="category_name"
                                cx="50%"
                                cy="50%"
                                innerRadius={45}
                                outerRadius={75}
                                paddingAngle={3}
                              >
                                {accountAnalytics.categories.map((entry: any, idx: number) => (
                                  <Cell
                                    key={`pie-${idx}`}
                                    fill={entry.color || CHART_COLORS[idx % CHART_COLORS.length]}
                                  />
                                ))}
                              </Pie>
                              <RechartsTooltip
                                contentStyle={{
                                  backgroundColor: '#141210',
                                  borderColor: '#24211d',
                                  borderRadius: '0.75rem',
                                  color: '#f2efe9',
                                  fontSize: '11px',
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <p className="text-xs text-[#8c857b]">No expense categories for this account.</p>
                      )}
                    </div>

                    {/* Monthly Inflow vs Outflow for this account */}
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
                        Monthly Activity
                      </h4>
                      {accountAnalytics?.trends && accountAnalytics.trends.length > 0 ? (
                        <div className="h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={accountAnalytics.trends}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#24211d" />
                              <XAxis dataKey="display_name" tick={{ fill: '#8c857b', fontSize: 10 }} />
                              <YAxis
                                tick={{ fill: '#8c857b', fontSize: 10 }}
                                tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                              />
                              <RechartsTooltip
                                contentStyle={{
                                  backgroundColor: '#141210',
                                  borderColor: '#24211d',
                                  borderRadius: '0.75rem',
                                  color: '#f2efe9',
                                  fontSize: '11px',
                                }}
                              />
                              <Bar dataKey="income" name="Inflow" fill="#4cc38a" radius={[4, 4, 0, 0]} />
                              <Bar dataKey="expense" name="Outflow" fill="#ef6a57" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <p className="text-xs text-[#8c857b]">No monthly trend data available.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-96 flex flex-col items-center justify-center bg-[#141210] border border-[#24211d] rounded-2xl text-[#8c857b] gap-3 p-8 text-center">
              <Building size={32} className="text-[#3b82f6]/40" />
              <p className="text-xs font-bold text-white">Select an Account</p>
              <p className="text-[11px] text-[#8c857b] max-w-xs">
                Choose an account from the directory on the left to inspect its real-time balance, transaction records, and cash flow analytics.
              </p>
            </div>
          )}
        </div>
      </div>
    )}

      {/* 5. Create / Edit Account Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-[#141210] border border-[#24211d] shadow-2xl z-10 overflow-hidden p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#24211d]">
              <h3 className="text-lg font-black text-white">
                {editingAccount ? 'Edit account' : 'Add account'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#8c857b] hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-[#ef6a57]/10 border border-[#ef6a57]/30 text-[#ef6a57] rounded-xl text-xs font-semibold">
                {modalError}
              </div>
            )}

            <form onSubmit={handleModalSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[#8c857b]">Account name</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={modalName}
                    onChange={(e) => setModalName(e.target.value)}
                    placeholder="e.g. Main Checking, Cash, Investments"
                    className="w-full bg-[#100e0c] border border-[#24211d] rounded-xl px-3.5 py-2.5 text-white font-semibold focus:outline-none focus:border-[#2563eb]"
                  />
                  <Wallet size={15} className="absolute right-3.5 top-3 text-[#8c857b]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#8c857b]">Currency</label>
                  <select
                    value={modalCurrency}
                    onChange={(e) => setModalCurrency(e.target.value)}
                    className="w-full bg-[#100e0c] border border-[#24211d] rounded-xl px-3 py-2.5 text-white font-semibold focus:outline-none focus:border-[#2563eb]"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#8c857b]">Group Name</label>
                  <select
                    value={modalGroupName}
                    onChange={(e) => setModalGroupName(e.target.value)}
                    className="w-full bg-[#100e0c] border border-[#24211d] rounded-xl px-3 py-2.5 text-white font-semibold focus:outline-none focus:border-[#2563eb]"
                  >
                    {GROUP_OPTIONS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#8c857b]">Account category</label>
                <select
                  value={modalCategory}
                  onChange={(e) => setModalCategory(e.target.value)}
                  className="w-full bg-[#100e0c] border border-[#24211d] rounded-xl px-3 py-2.5 text-white font-semibold focus:outline-none focus:border-[#2563eb]"
                >
                  {ACCOUNT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#8c857b]">Initial balance</label>
                  <input
                    type="number"
                    step="0.01"
                    value={modalInitialBalance}
                    onChange={(e) => setModalInitialBalance(e.target.value)}
                    className="w-full bg-[#100e0c] border border-[#24211d] rounded-xl px-3.5 py-2.5 text-white font-mono font-bold focus:outline-none focus:border-[#2563eb]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#8c857b]">Credit limit</label>
                  <input
                    type="number"
                    step="0.01"
                    value={modalCreditLimit}
                    onChange={(e) => setModalCreditLimit(e.target.value)}
                    className="w-full bg-[#100e0c] border border-[#24211d] rounded-xl px-3.5 py-2.5 text-white font-mono font-bold focus:outline-none focus:border-[#2563eb]"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-[#8c857b] hover:text-white bg-[#1a1714] border border-[#24211d]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting || isReadOnly}
                  className="px-5 py-2 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold transition-all shadow-md shadow-[#2563eb]/30"
                >
                  {modalSubmitting ? 'Saving...' : editingAccount ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountsPage;
