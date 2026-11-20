import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../api/client';
import { Transaction, Category, Pagination } from '../types';
import { useAuth } from '../context/AuthContext';
import { TransactionModal } from '../components/TransactionModal';
import { VirtualTransactionList } from '../components/VirtualTransactionList';
import {
  formatINR,
  formatAmountWithCurrency,
  convertToINR,
} from '../utils/currency';
import {
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Calendar,
  Tag,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  List,
  Sparkles,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  CreditCard,
  Sliders,
} from 'lucide-react';

export const TransactionsPage: React.FC = () => {
  const { isReadOnly } = useAuth();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  const [viewMode, setViewMode] = useState<'table' | 'virtual'>('table');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/categories')
      .then((res) => setCategories(res.data.data))
      .catch((err) => console.error('Failed to load categories:', err));
  }, []);

  const fetchTransactions = useCallback(async (pageToLoad = 1, customLimit?: number) => {
    setLoading(true);
    try {
      const limit = customLimit || (viewMode === 'virtual' ? 100 : 10);
      const params: any = {
        page: pageToLoad,
        limit,
        sortBy,
        sortOrder,
      };

      if (typeFilter !== 'all') params.type = typeFilter;
      if (categoryFilter) params.categoryId = categoryFilter;
      if (search) params.search = search;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await api.get('/transactions', { params });
      setTransactions(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [viewMode, sortBy, sortOrder, typeFilter, categoryFilter, search, startDate, endDate]);

  useEffect(() => {
    fetchTransactions(1);
  }, [fetchTransactions]);

  const clientFilteredList = useMemo(() => {
    return transactions;
  }, [transactions]);

  const listStats = useMemo(() => {
    let income = 0;
    let expense = 0;
    clientFilteredList.forEach((tx) => {
      const amt = Number(tx.amount_inr ?? tx.amount);
      if (tx.type === 'income') income += amt;
      else if (tx.type === 'expense') expense += amt;
    });
    return { income, expense, balance: income - expense };
  }, [clientFilteredList]);

  const handleOpenAddModal = useCallback(() => {
    if (isReadOnly) return;
    setEditingTransaction(null);
    setIsModalOpen(true);
  }, [isReadOnly]);

  const handleOpenEditModal = useCallback((tx: Transaction) => {
    if (isReadOnly) return;
    setEditingTransaction(tx);
    setIsModalOpen(true);
  }, [isReadOnly]);

  const handleDelete = useCallback(async (id: number) => {
    if (isReadOnly) return;
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;

    try {
      await api.delete(`/transactions/${id}`);
      fetchTransactions(pagination.page);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete transaction');
    }
  }, [isReadOnly, fetchTransactions, pagination.page]);

  const handleModalSubmit = useCallback(async (data: Partial<Transaction>) => {
    if (editingTransaction) {
      await api.put(`/transactions/${editingTransaction.id}`, data);
    } else {
      await api.post('/transactions', data);
    }
    fetchTransactions(1);
  }, [editingTransaction, fetchTransactions]);

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Transactions Ledger
          </h1>
          <p className="text-xs text-[#8c857b] mt-0.5">
            Full relational ledger view with search, categorization, and windowed scrolling
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="bg-[#141210] border border-[#24211d] p-1 rounded-xl flex items-center text-xs font-semibold">
            <button
              onClick={() => { setViewMode('table'); fetchTransactions(1, 10); }}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                viewMode === 'table'
                  ? 'bg-[#2563eb] text-white font-bold shadow-xs'
                  : 'text-[#8c857b] hover:text-white'
              }`}
            >
              <List size={13} /> Table
            </button>
            <button
              onClick={() => { setViewMode('virtual'); fetchTransactions(1, 100); }}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                viewMode === 'virtual'
                  ? 'bg-[#2563eb] text-white font-bold shadow-xs'
                  : 'text-[#8c857b] hover:text-white'
              }`}
            >
              <Sparkles size={13} /> Virtual Feed
            </button>
          </div>

          {/* Add Transaction Button */}
          <button
            onClick={handleOpenAddModal}
            disabled={isReadOnly}
            title={isReadOnly ? 'Read-only users cannot add transactions' : 'New Transaction'}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-[#2563eb]/20 ${
              isReadOnly
                ? 'bg-[#1a1714] border border-[#24211d] text-[#8c857b] cursor-not-allowed opacity-50'
                : 'bg-[#2563eb] hover:bg-[#1d4ed8] text-white active:scale-[0.99]'
            }`}
          >
            <Plus size={15} />
            <span>New Transaction</span>
          </button>
        </div>
      </div>

      {/* Read-only Alert Bar */}
      {isReadOnly && (
        <div className="p-3.5 bg-amber-950/30 border border-amber-900/60 rounded-xl text-xs text-amber-300 flex items-center gap-2.5">
          <ShieldAlert size={16} className="text-amber-400 shrink-0" />
          <span>
            <strong>Read-Only Mode:</strong> Mutation privileges are locked. Creating, modifying, and deleting transactions are disabled.
          </span>
        </div>
      )}

      {/* Page Flow Summary Bar (Normalized in INR) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-[#141210] border border-[#24211d] rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#8c857b] tracking-wider block">Inflow</span>
            <span className="text-xl font-black font-mono text-[#4cc38a] mt-0.5 block">
              +{formatINR(listStats.income)}
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#4cc38a]/10 text-[#4cc38a] flex items-center justify-center border border-[#4cc38a]/20">
            <ArrowDownLeft size={18} />
          </div>
        </div>

        <div className="p-4 bg-[#141210] border border-[#24211d] rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#8c857b] tracking-wider block">Outflow</span>
            <span className="text-xl font-black font-mono text-[#ef6a57] mt-0.5 block">
              -{formatINR(listStats.expense)}
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#ef6a57]/10 text-[#ef6a57] flex items-center justify-center border border-[#ef6a57]/20">
            <ArrowUpRight size={18} />
          </div>
        </div>

        <div className="p-4 bg-[#141210] border border-[#24211d] rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#8c857b] tracking-wider block">Net Ledger Balance</span>
            <span className={`text-xl font-black font-mono mt-0.5 block ${
              listStats.balance >= 0 ? 'text-[#4cc38a]' : 'text-[#ef6a57]'
            }`}>
              {listStats.balance >= 0 ? '+' : ''}{formatINR(listStats.balance)}
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#2563eb]/10 text-[#3b82f6] flex items-center justify-center border border-[#2563eb]/20">
            <Sliders size={18} />
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="p-5 bg-[#141210] border border-[#24211d] rounded-2xl space-y-3.5 shadow-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-3 text-[#8c857b]" />
            <input
              type="text"
              placeholder="Search description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-[#0e0c0a] border border-[#24211d] rounded-xl text-xs text-white placeholder-[#524b42] focus:outline-none focus:border-[#2563eb] transition-colors"
            />
          </div>

          {/* Type Filter */}
          <div className="relative">
            <Filter size={14} className="absolute left-3.5 top-3 text-[#8c857b]" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full pl-9 pr-3.5 py-2 bg-[#0e0c0a] border border-[#24211d] rounded-xl text-xs text-white focus:outline-none focus:border-[#2563eb] transition-colors"
            >
              <option value="all">All Types</option>
              <option value="income">Income Only</option>
              <option value="expense">Expense Only</option>
              <option value="transfer">Transfer Only</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Tag size={14} className="absolute left-3.5 top-3 text-[#8c857b]" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-[#0e0c0a] border border-[#24211d] rounded-xl text-xs text-white focus:outline-none focus:border-[#2563eb] transition-colors"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div className="relative">
            <Calendar size={14} className="absolute left-3.5 top-3 text-[#8c857b]" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-[#0e0c0a] border border-[#24211d] rounded-xl text-xs font-mono text-white focus:outline-none focus:border-[#2563eb] transition-colors"
            />
          </div>

          {/* End Date */}
          <div className="relative">
            <Calendar size={14} className="absolute left-3.5 top-3 text-[#8c857b]" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-[#0e0c0a] border border-[#24211d] rounded-xl text-xs font-mono text-white focus:outline-none focus:border-[#2563eb] transition-colors"
            />
          </div>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center justify-between text-[11px] text-[#8c857b] pt-2.5 border-t border-[#24211d]">
          <div className="flex items-center gap-2">
            <ArrowUpDown size={13} />
            <span>Sort:</span>
            <button
              onClick={() => {
                if (sortBy === 'date') setSortOrder((o) => (o === 'ASC' ? 'DESC' : 'ASC'));
                else { setSortBy('date'); setSortOrder('DESC'); }
              }}
              className={`font-semibold hover:underline ${sortBy === 'date' ? 'text-[#3b82f6]' : ''}`}
            >
              Date ({sortBy === 'date' ? sortOrder : 'DESC'})
            </button>
            <span>•</span>
            <button
              onClick={() => {
                if (sortBy === 'amount') setSortOrder((o) => (o === 'ASC' ? 'DESC' : 'ASC'));
                else { setSortBy('amount'); setSortOrder('DESC'); }
              }}
              className={`font-semibold hover:underline ${sortBy === 'amount' ? 'text-[#3b82f6]' : ''}`}
            >
              Amount ({sortBy === 'amount' ? sortOrder : 'DESC'})
            </button>
          </div>

          <span className="font-mono">{transactions.length} displayed • {pagination.total} total</span>
        </div>
      </div>

      {/* Main Content: Virtual Feed vs Table */}
      {viewMode === 'virtual' ? (
        <VirtualTransactionList
          transactions={clientFilteredList}
          isReadOnly={isReadOnly}
          onEdit={handleOpenEditModal}
          onDelete={handleDelete}
        />
      ) : (
        <div className="bg-[#141210] border border-[#24211d] rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1a1714] text-[#8c857b] uppercase tracking-wider font-bold border-b border-[#24211d]">
                <tr>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Description / Payee</th>
                  <th className="py-3.5 px-4">Account</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#24211d]">
                {clientFilteredList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#8c857b]">
                      No transactions found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  clientFilteredList.map((tx) => {
                    const isIncome = tx.type === 'income';
                    const isTransfer = tx.type === 'transfer';
                    return (
                      <tr
                        key={tx.id}
                        className="hover:bg-[#1a1714]/80 transition-colors"
                      >
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                              isIncome
                                ? 'bg-[#4cc38a]/10 text-[#4cc38a] border-[#4cc38a]/20'
                                : isTransfer
                                ? 'bg-[#2563eb]/10 text-[#3b82f6] border-[#2563eb]/20'
                                : 'bg-[#ef6a57]/10 text-[#ef6a57] border-[#ef6a57]/20'
                            }`}
                          >
                            {isIncome ? (
                              <ArrowDownLeft size={10} />
                            ) : isTransfer ? (
                              <ArrowLeftRight size={10} />
                            ) : (
                              <ArrowUpRight size={10} />
                            )}
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[#8c857b]">
                          {tx.date}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white">
                            {tx.payee || tx.description || '-'}
                          </div>
                          {tx.note && (
                            <div className="text-[11px] text-[#8c857b] truncate max-w-xs">
                              {tx.note}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-white font-medium text-xs flex items-center gap-1">
                              <CreditCard size={11} className="text-[#8c857b]" />
                              {tx.account || 'Main Checking'}
                              {tx.to_account && (
                                <span className="text-[#8c857b] text-[10px]">
                                  → {tx.to_account}
                                </span>
                              )}
                            </span>
                            {tx.tags && tx.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                {tx.tags.slice(0, 2).map((t) => (
                                  <span
                                    key={t}
                                    className="text-[9px] text-[#3b82f6] bg-[#2563eb]/10 px-1.5 py-0.2 rounded font-mono"
                                  >
                                    #{t}
                                  </span>
                                ))}
                                {tx.tags.length > 2 && (
                                  <span className="text-[9px] text-[#8c857b] font-mono">
                                    +{tx.tags.length - 2}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {tx.category_name ? (
                            <span
                              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border"
                              style={{
                                backgroundColor: `${tx.category_color || '#2563eb'}15`,
                                color: tx.category_color || '#3b82f6',
                                borderColor: `${tx.category_color || '#2563eb'}35`,
                              }}
                            >
                              <Tag size={10} />
                              {tx.category_name}
                            </span>
                          ) : (
                            <span className="text-[#8c857b] opacity-60">Uncategorized</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-sm">
                          <span
                            className={
                              isIncome
                                ? 'text-[#4cc38a]'
                                : isTransfer
                                ? 'text-[#3b82f6]'
                                : 'text-[#ef6a57]'
                            }
                          >
                            {isIncome ? '+' : isTransfer ? '⇄ ' : '-'}
                            {formatAmountWithCurrency(tx.amount, tx.currency || 'INR').formattedNative}
                          </span>
                          {tx.currency && tx.currency !== 'INR' && (
                            <span className="block text-[10px] text-[#8c857b] font-mono font-normal">
                              ≈ {formatINR(tx.amount_inr || convertToINR(tx.amount, tx.currency))}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(tx)}
                              disabled={isReadOnly}
                              title={isReadOnly ? 'Read-only users cannot edit' : 'Edit'}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isReadOnly
                                  ? 'opacity-25 cursor-not-allowed text-[#8c857b]'
                                  : 'text-[#8c857b] hover:text-[#3b82f6] hover:bg-[#1a1714]'
                              }`}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(tx.id)}
                              disabled={isReadOnly}
                              title={isReadOnly ? 'Read-only users cannot delete' : 'Delete'}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isReadOnly
                                  ? 'opacity-25 cursor-not-allowed text-[#8c857b]'
                                  : 'text-[#8c857b] hover:text-[#ef6a57] hover:bg-[#1a1714]'
                              }`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="p-4 border-t border-[#24211d] flex items-center justify-between text-xs text-[#8c857b] bg-[#100e0c]">
              <span>
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} records)
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => fetchTransactions(pagination.page - 1)}
                  className="p-1.5 rounded-lg border border-[#24211d] bg-[#141210] text-[#8c857b] disabled:opacity-30 hover:text-white hover:border-[#38332c] transition-colors"
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchTransactions(pagination.page + 1)}
                  className="p-1.5 rounded-lg border border-[#24211d] bg-[#141210] text-[#8c857b] disabled:opacity-30 hover:text-white hover:border-[#38332c] transition-colors"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        transactionToEdit={editingTransaction}
        categories={categories}
        isReadOnly={isReadOnly}
      />
    </div>
  );
};

export default TransactionsPage;
