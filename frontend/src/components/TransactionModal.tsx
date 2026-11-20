import React, { useState, useEffect, useCallback, memo } from 'react';
import api from '../api/client';
import { Transaction, Category, TransactionType, Account } from '../types';
import {
  CURRENCY_LIST,
  getRateToINR,
  convertToINR,
  formatINR,
  formatAmountWithCurrency,
} from '../utils/currency';
import {
  X,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRight,
  ArrowLeftRight,
  Calendar,
  Clock,
  CreditCard,
  Wallet,
  Tag,
  Paperclip,
  Lock,
  ExternalLink,
  Hash,
  MapPin,
  Globe,
  Ban,
  RotateCcw,
  GitFork,
  ChevronDown,
  Check,
  Plus,
  Sparkles,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Transaction>) => Promise<void>;
  transactionToEdit: Transaction | null;
  categories: Category[];
  isReadOnly: boolean;
}

const DEFAULT_ACCOUNTS = [
  'Main Checking',
  'Savings Account',
  'Credit Card',
  'Cash Wallet',
  'Investment Portfolio',
];

const PAYMENT_TYPES = [
  'Credit card',
  'Debit card',
  'Bank transfer',
  'Cash',
  'PayPal / Electronic',
  'Crypto',
];

const PRESET_TAGS = [
  'Personal',
  'Tax Deductible',
  'Subscription',
  'Work & Business',
  'Groceries',
  'Travel',
  'Family',
  'Dining',
];

export const TransactionModal: React.FC<Props> = memo(({
  isOpen,
  onClose,
  onSubmit,
  transactionToEdit,
  categories,
  isReadOnly,
}) => {
  // Left Column States
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState<string>('INR');
  const [account, setAccount] = useState<string>('HDFC Salary Account');
  const [toAccount, setToAccount] = useState<string>('ICICI Savings & FD');
  const [categoryId, setCategoryId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState<string>('12:00');
  const [payee, setPayee] = useState<string>('');
  const [isPlanned, setIsPlanned] = useState<boolean>(false);

  // Right Column ("MORE OPTIONS") States
  const [paymentType, setPaymentType] = useState<string>('Credit card');
  const [note, setNote] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState<string>('');
  const [showTagDropdown, setShowTagDropdown] = useState<boolean>(false);

  // Quick Action Fields (revealed on pill click)
  const [showExternalUrl, setShowExternalUrl] = useState<boolean>(false);
  const [externalUrl, setExternalUrl] = useState<string>('');
  const [showExternalRef, setShowExternalRef] = useState<boolean>(false);
  const [externalRef, setExternalRef] = useState<string>('');
  const [showLocation, setShowLocation] = useState<boolean>(false);
  const [locationVal, setLocationVal] = useState<string>('');
  const [excludeFromStats, setExcludeFromStats] = useState<boolean>(false);

  // Modal Control States
  const [createMore, setCreateMore] = useState<boolean>(false);
  const [showTemplates, setShowTemplates] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [userAccounts, setUserAccounts] = useState<Account[]>([]);

  // Fetch user accounts from API whenever modal opens
  useEffect(() => {
    if (isOpen) {
      api.get('/accounts')
        .then((res) => {
          if (res.data?.data && res.data.data.length > 0) {
            setUserAccounts(res.data.data);
            if (!transactionToEdit) {
              setAccount((prev) => (prev && res.data.data.some((a: Account) => a.name === prev) ? prev : res.data.data[0].name));
              if (res.data.data.length > 1) {
                setToAccount((prev) => (prev && res.data.data.some((a: Account) => a.name === prev) ? prev : res.data.data[1].name));
              }
            }
          }
        })
        .catch((err) => console.error('Failed to load accounts in transaction modal:', err));
    }
  }, [isOpen, transactionToEdit]);

  // Initialize or reset on open / transactionToEdit change
  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type || 'expense');
      setAmount(String(transactionToEdit.amount || ''));
      setCurrency(transactionToEdit.currency || 'INR');
      setAccount(transactionToEdit.account || 'HDFC Salary Account');
      setToAccount(transactionToEdit.to_account || 'ICICI Savings & FD');
      setCategoryId(transactionToEdit.category_id ? String(transactionToEdit.category_id) : '');
      setDate(transactionToEdit.date || new Date().toISOString().split('T')[0]);
      setPayee(transactionToEdit.payee || transactionToEdit.description || '');
      setPaymentType(transactionToEdit.payment_type || 'Credit card');
      setNote(transactionToEdit.note || '');
      setTags(transactionToEdit.tags || []);
      setExternalUrl(transactionToEdit.external_url || '');
      setShowExternalUrl(!!transactionToEdit.external_url);
      setExternalRef(transactionToEdit.external_ref || '');
      setShowExternalRef(!!transactionToEdit.external_ref);
      setLocationVal(transactionToEdit.location || '');
      setShowLocation(!!transactionToEdit.location);
      setExcludeFromStats(!!transactionToEdit.exclude_from_stats);
    } else {
      setType('expense');
      setAmount('');
      setCurrency('INR');
      setAccount('HDFC Salary Account');
      setToAccount('ICICI Savings & FD');
      setCategoryId('');
      setDate(new Date().toISOString().split('T')[0]);
      setTime(new Date().toTimeString().slice(0, 5));
      setPayee('');
      setPaymentType('Credit card');
      setNote('');
      setTags([]);
      setExternalUrl('');
      setShowExternalUrl(false);
      setExternalRef('');
      setShowExternalRef(false);
      setLocationVal('');
      setShowLocation(false);
      setExcludeFromStats(false);
    }
    setError(null);
    setSuccessToast(null);
  }, [transactionToEdit, isOpen]);

  // Handle Tag Addition
  const handleAddTag = useCallback((tagToAdd: string) => {
    const cleaned = tagToAdd.trim().replace(/^#/, '');
    if (cleaned && !tags.includes(cleaned)) {
      setTags((prev) => [...prev, cleaned]);
    }
    setTagInput('');
    setShowTagDropdown(false);
  }, [tags]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  }, []);

  // Quick Templates
  const handleApplyTemplate = useCallback((template: {
    type: TransactionType;
    payee: string;
    account: string;
    paymentType: string;
    tags: string[];
    catName?: string;
  }) => {
    setType(template.type);
    setPayee(template.payee);
    setAccount(template.account);
    setPaymentType(template.paymentType);
    setTags(template.tags);
    if (template.catName) {
      const match = categories.find((c) => c.name.toLowerCase().includes(template.catName!.toLowerCase()));
      if (match) setCategoryId(String(match.id));
    }
    setShowTemplates(false);
  }, [categories]);

  // Form Submission
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isReadOnly) return;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }

    if (!date) {
      setError('Please select a valid date.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload: Partial<Transaction> = {
        type,
        amount: parsedAmount,
        currency,
        date,
        category_id: categoryId ? parseInt(categoryId, 10) : null,
        description: payee.trim() || (type === 'transfer' ? `Transfer to ${toAccount}` : (type === 'income' ? 'Income' : 'Expense')),
        account,
        to_account: type === 'transfer' ? toAccount : null,
        payee: payee.trim(),
        tags,
        payment_type: paymentType,
        note: note.trim(),
        external_url: externalUrl.trim() || null,
        external_ref: externalRef.trim() || null,
        location: locationVal.trim() || null,
        exclude_from_stats: excludeFromStats,
      };

      await onSubmit(payload);

      if (createMore && !transactionToEdit) {
        // Reset inputs for rapid subsequent entry
        const formattedSaved = formatAmountWithCurrency(parsedAmount, currency).formattedNative;
        setSuccessToast(`Saved ${formattedSaved} (${payee || type}) successfully! Ready for next.`);
        setAmount('');
        setPayee('');
        setNote('');
        setTimeout(() => setSuccessToast(null), 3000);
      } else {
        onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save transaction.');
    } finally {
      setLoading(false);
    }
  }, [
    isReadOnly,
    amount,
    date,
    type,
    categoryId,
    payee,
    toAccount,
    account,
    tags,
    paymentType,
    note,
    externalUrl,
    externalRef,
    locationVal,
    excludeFromStats,
    onSubmit,
    createMore,
    transactionToEdit,
    onClose,
  ]);

  // Keyboard shortcut listener (Cmd/Ctrl + Enter to submit, Escape to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleSubmit, onClose]);

  if (!isOpen) return null;

  const selectedCategory = categories.find((c) => String(c.id) === categoryId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      {/* Click outside backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Main Modal Card */}
      <div className="relative w-full max-w-4xl rounded-2xl bg-[#141210] border border-[#24211d] shadow-2xl z-10 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Top Header Bar */}
        <div className="px-6 py-4 border-b border-[#24211d] bg-[#1a1714] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-black text-white tracking-tight">
              {transactionToEdit ? 'Edit transaction' : 'Add transaction'}
            </h2>

            {/* Templates Dropdown Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTemplates(!showTemplates)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#24211d] text-xs font-semibold text-[#8c857b] hover:text-white transition-colors border border-[#38332c]"
              >
                <Sparkles size={12} className="text-[#3b82f6]" />
                <span>Templates</span>
                <ChevronDown size={12} />
              </button>

              {showTemplates && (
                <div className="absolute left-0 mt-2 w-56 rounded-xl bg-[#1a1714] border border-[#24211d] shadow-2xl p-1.5 z-20 space-y-1 text-xs">
                  <div className="px-2.5 py-1 text-[10px] uppercase font-bold text-[#8c857b] tracking-wider">
                    Quick Templates
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleApplyTemplate({
                        type: 'expense',
                        payee: 'Trader Joe’s Groceries',
                        account: 'Main Checking',
                        paymentType: 'Credit card',
                        tags: ['Groceries', 'Personal'],
                        catName: 'Food',
                      })
                    }
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#24211d] text-white transition-colors"
                  >
                    🛒 Grocery Shopping
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleApplyTemplate({
                        type: 'income',
                        payee: 'Direct Deposit Payroll',
                        account: 'Main Checking',
                        paymentType: 'Bank transfer',
                        tags: ['Work & Business'],
                        catName: 'Salary',
                      })
                    }
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#24211d] text-white transition-colors"
                  >
                    💼 Salary Direct Deposit
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleApplyTemplate({
                        type: 'transfer',
                        payee: 'Transfer to Emergency Fund',
                        account: 'Main Checking',
                        paymentType: 'Bank transfer',
                        tags: ['Savings'],
                      })
                    }
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#24211d] text-white transition-colors"
                  >
                    ⇄ Checking → Savings Transfer
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleApplyTemplate({
                        type: 'expense',
                        payee: 'Netflix & Spotify',
                        account: 'Credit Card',
                        paymentType: 'Credit card',
                        tags: ['Subscription'],
                        catName: 'Entertainment',
                      })
                    }
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#24211d] text-white transition-colors"
                  >
                    📺 Monthly Subscriptions
                  </button>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-[#8c857b] hover:text-white px-2 py-1 rounded-lg hover:bg-[#24211d] transition-colors"
          >
            Close
          </button>
        </div>

        {/* Notifications Bar */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-[#ef6a57]/10 border border-[#ef6a57]/30 text-[#ef6a57] rounded-xl text-xs font-semibold flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-[#ef6a57]">
              <X size={14} />
            </button>
          </div>
        )}

        {successToast && (
          <div className="mx-6 mt-4 p-3 bg-[#4cc38a]/10 border border-[#4cc38a]/30 text-[#4cc38a] rounded-xl text-xs font-semibold flex items-center gap-2">
            <Check size={14} />
            <span>{successToast}</span>
          </div>
        )}

        {/* Modal Form Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* ================= LEFT COLUMN ================= */}
            <div className="md:col-span-7 space-y-5">
              {/* 1. Transaction Type Selector Tabs */}
              <div>
                <div className="grid grid-cols-3 gap-2 bg-[#100e0c] p-1 rounded-xl border border-[#24211d]">
                  <button
                    type="button"
                    onClick={() => setType('expense')}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                      type === 'expense'
                        ? 'bg-[#ef6a57]/15 text-[#ef6a57] border border-[#ef6a57]/40 shadow-xs'
                        : 'text-[#8c857b] hover:text-white'
                    }`}
                  >
                    <ArrowDownLeft size={14} />
                    <span>Expense</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setType('income')}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                      type === 'income'
                        ? 'bg-[#4cc38a]/15 text-[#4cc38a] border border-[#4cc38a]/40 shadow-xs'
                        : 'text-[#8c857b] hover:text-white'
                    }`}
                  >
                    <ArrowUpRight size={14} />
                    <span>Income</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setType('transfer')}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                      type === 'transfer'
                        ? 'bg-[#2563eb]/15 text-[#3b82f6] border border-[#2563eb]/40 shadow-xs'
                        : 'text-[#8c857b] hover:text-white'
                    }`}
                  >
                    <ArrowLeftRight size={14} />
                    <span>Transfer</span>
                  </button>
                </div>
              </div>

              {/* 2. Amount Input & Currency Selector */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#8c857b]">Amount</label>
                  <span className="text-[11px] text-[#8c857b]">
                    Primary: <strong className="text-white">INR (₹)</strong>
                  </span>
                </div>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-[#100e0c] border border-[#24211d] rounded-xl pl-4 pr-32 py-2.5 text-white font-mono text-base font-bold placeholder-[#8c857b]/50 focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] transition-all"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="bg-[#1a1714] border border-[#24211d] rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-white focus:outline-none focus:border-[#2563eb] cursor-pointer hover:border-[#38332c]"
                    >
                      {CURRENCY_LIST.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code} ({c.symbol})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Auto Currency Conversion Banner for Non-INR Transactions */}
                {currency !== 'INR' && parseFloat(amount) > 0 && (
                  <div className="p-2.5 rounded-xl bg-[#2563eb]/10 border border-[#2563eb]/30 flex items-center justify-between text-xs animate-in fade-in">
                    <span className="text-[#8c857b] font-medium flex items-center gap-1.5">
                      <ArrowLeftRight size={13} className="text-[#3b82f6]" />
                      <span>Converted to INR for calculations:</span>
                    </span>
                    <span className="font-mono font-bold text-[#4cc38a]">
                      {formatINR(convertToINR(parseFloat(amount), currency))}
                      <span className="text-[10px] text-[#8c857b] ml-1.5 font-normal">
                        (1 {currency} ≈ ₹{getRateToINR(currency)})
                      </span>
                    </span>
                  </div>
                )}
              </div>

              {/* 3. Account Selector */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#8c857b]">
                    {type === 'transfer' ? 'From Account' : 'Account'}
                  </label>
                  <a
                    href="/accounts"
                    className="text-[11px] font-semibold text-[#8c857b] hover:text-[#3b82f6] flex items-center gap-1 transition-colors"
                  >
                    <Wallet size={11} />
                    <span>Manage accounts</span>
                  </a>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3b82f6]">
                      <CreditCard size={15} />
                    </div>
                    <select
                      value={account}
                      onChange={(e) => setAccount(e.target.value)}
                      className="w-full bg-[#100e0c] border border-[#24211d] rounded-xl pl-9 pr-8 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-[#2563eb] appearance-none cursor-pointer"
                    >
                      {userAccounts.length > 0
                        ? userAccounts.map((acc) => (
                            <option key={acc.id} value={acc.name}>
                              {acc.name} ({formatAmountWithCurrency(acc.current_balance, acc.currency).formattedNative})
                            </option>
                          ))
                        : DEFAULT_ACCOUNTS.map((acc) => (
                            <option key={acc} value={acc}>
                              {acc}
                            </option>
                          ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8c857b] pointer-events-none" />
                  </div>

                  {/* Planned Toggle */}
                  <button
                    type="button"
                    onClick={() => setIsPlanned(!isPlanned)}
                    className={`flex items-center gap-1 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                      isPlanned
                        ? 'bg-[#2563eb]/15 text-[#3b82f6] border-[#2563eb]/40'
                        : 'bg-[#100e0c] text-[#8c857b] border-[#24211d] hover:text-white'
                    }`}
                  >
                    <Clock size={13} />
                    <span>Planned</span>
                  </button>
                </div>
              </div>

              {/* 3b. To Account (When Transfer is selected) */}
              {type === 'transfer' && (
                <div className="space-y-1.5 animate-in fade-in duration-150">
                  <label className="text-xs font-bold text-[#8c857b]">To Account</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4cc38a]">
                      <ArrowRight size={14} />
                    </div>
                    <select
                      value={toAccount}
                      onChange={(e) => setToAccount(e.target.value)}
                      className="w-full bg-[#100e0c] border border-[#24211d] rounded-xl pl-9 pr-8 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-[#2563eb] appearance-none cursor-pointer"
                    >
                      {userAccounts.length > 0
                        ? userAccounts
                            .filter((acc) => acc.name !== account)
                            .map((acc) => (
                              <option key={acc.id} value={acc.name}>
                                {acc.name} ({formatAmountWithCurrency(acc.current_balance, acc.currency).formattedNative})
                              </option>
                            ))
                        : DEFAULT_ACCOUNTS.filter((acc) => acc !== account).map((acc) => (
                            <option key={acc} value={acc}>
                              {acc}
                            </option>
                          ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8c857b] pointer-events-none" />
                  </div>
                </div>
              )}

              {/* 4. Category Selector with Split Action */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#8c857b]">Category</label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <div
                      className="w-3 h-3 rounded-full absolute left-3 top-1/2 -translate-y-1/2"
                      style={{ backgroundColor: selectedCategory?.color || '#2563eb' }}
                    />
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full bg-[#100e0c] border border-[#24211d] rounded-xl pl-9 pr-14 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-[#2563eb] appearance-none cursor-pointer"
                    >
                      <option value="">Select Category (Optional)</option>
                      {categories
                        .filter((cat) => (type === 'transfer' ? true : cat.type === type))
                        .map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                    </select>

                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-[#8c857b]">
                      {categoryId && (
                        <button
                          type="button"
                          onClick={() => setCategoryId('')}
                          className="hover:text-white"
                          title="Clear category"
                        >
                          <X size={13} />
                        </button>
                      )}
                      <ChevronDown size={13} />
                    </div>
                  </div>

                  {/* Split Button */}
                  <button
                    type="button"
                    title="Split receipt across multiple categories (adds breakdown template to Note)"
                    onClick={() => {
                      if (!note.includes('[Split receipt]')) {
                        setNote((prev) => (prev ? `${prev}\n[Split receipt breakdown]: ` : '[Split receipt breakdown]: '));
                      }
                    }}
                    className="flex items-center gap-1 px-3 py-2.5 rounded-xl text-xs font-semibold bg-[#100e0c] text-[#8c857b] border border-[#24211d] hover:text-white transition-colors"
                  >
                    <GitFork size={13} />
                    <span>Split</span>
                  </button>
                </div>
              </div>

              {/* 5. Datetime Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#8c857b]">Datetime</label>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2 relative">
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-[#100e0c] border border-[#24211d] rounded-xl px-3 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-[#2563eb]"
                    />
                  </div>
                  <div className="relative">
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full bg-[#100e0c] border border-[#24211d] rounded-xl px-3 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-[#2563eb]"
                    />
                  </div>
                </div>
              </div>

              {/* 6. Payee Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#8c857b]">Payee</label>
                <input
                  type="text"
                  value={payee}
                  onChange={(e) => setPayee(e.target.value)}
                  placeholder="Select a payee or merchant..."
                  className="w-full bg-[#100e0c] border border-[#24211d] rounded-xl px-4 py-2.5 text-xs font-medium text-white placeholder-[#8c857b]/50 focus:outline-none focus:border-[#2563eb]"
                />
              </div>
            </div>

            {/* ================= RIGHT COLUMN ("MORE OPTIONS") ================= */}
            <div className="md:col-span-5 space-y-5 md:border-l md:border-[#24211d] md:pl-8">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#8c857b]">
                More Options
              </div>

              {/* 1. Payment Type Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#8c857b]">Payment type</label>
                <div className="relative">
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value)}
                    className="w-full bg-[#100e0c] border border-[#24211d] rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-[#2563eb] appearance-none cursor-pointer"
                  >
                    {PAYMENT_TYPES.map((pt) => (
                      <option key={pt} value={pt}>
                        {pt}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8c857b] pointer-events-none">
                    <ChevronDown size={14} />
                  </div>
                </div>
              </div>

              {/* 2. Note Textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#8c857b]">Note</label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Note or transaction details..."
                  className="w-full bg-[#100e0c] border border-[#24211d] rounded-xl px-3.5 py-2 text-xs font-medium text-white placeholder-[#8c857b]/50 focus:outline-none focus:border-[#2563eb] resize-none"
                />
              </div>

              {/* 3. Tags Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#8c857b]">Tags</label>

                {/* Selected Tags Chips */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-1">
                    {tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#2563eb]/15 border border-[#2563eb]/30 text-[#3b82f6] text-[11px] font-semibold"
                      >
                        #{t}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(t)}
                          className="hover:text-white"
                        >
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Tag Input Field & Dropdown */}
                <div className="relative">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onFocus={() => setShowTagDropdown(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (tagInput.trim()) handleAddTag(tagInput);
                      }
                    }}
                    placeholder="Select or type tag, press Enter..."
                    className="w-full bg-[#100e0c] border border-[#24211d] rounded-xl px-3.5 py-2 text-xs font-medium text-white placeholder-[#8c857b]/50 focus:outline-none focus:border-[#2563eb]"
                  />

                  {showTagDropdown && (
                    <div className="absolute left-0 right-0 mt-1 bg-[#1a1714] border border-[#24211d] rounded-xl p-2 shadow-2xl z-20 space-y-1">
                      <div className="text-[10px] font-bold text-[#8c857b] uppercase tracking-wider px-2 py-0.5">
                        Recommended Tags
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {PRESET_TAGS.filter((t) => !tags.includes(t)).map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => handleAddTag(preset)}
                            className="px-2 py-1 rounded-md bg-[#24211d] hover:bg-[#2563eb] text-xs font-medium text-white transition-colors"
                          >
                            #{preset}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Attachments Dropzone Mockup */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#8c857b]">Attachments</label>
                <div className="p-3 border border-dashed border-[#24211d] rounded-xl bg-[#100e0c] text-xs text-[#8c857b] flex items-center justify-between cursor-pointer hover:border-[#38332c] transition-colors">
                  <div className="flex items-center gap-2">
                    <Paperclip size={14} />
                    <span>Add attachments</span>
                  </div>
                  <Lock size={12} className="text-[#8c857b]" />
                </div>
              </div>

              {/* 5. Quick Option Pills ("Add") */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-bold text-[#8c857b]">Add details</label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowExternalUrl(!showExternalUrl)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border flex items-center gap-1.5 transition-colors ${
                      showExternalUrl
                        ? 'bg-[#2563eb]/15 text-[#3b82f6] border-[#2563eb]/40'
                        : 'bg-[#100e0c] text-[#8c857b] border-[#24211d] hover:text-white'
                    }`}
                  >
                    <ExternalLink size={11} />
                    <span>External URL</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowExternalRef(!showExternalRef)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border flex items-center gap-1.5 transition-colors ${
                      showExternalRef
                        ? 'bg-[#2563eb]/15 text-[#3b82f6] border-[#2563eb]/40'
                        : 'bg-[#100e0c] text-[#8c857b] border-[#24211d] hover:text-white'
                    }`}
                  >
                    <Hash size={11} />
                    <span>External reference</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowLocation(!showLocation)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border flex items-center gap-1.5 transition-colors ${
                      showLocation
                        ? 'bg-[#2563eb]/15 text-[#3b82f6] border-[#2563eb]/40'
                        : 'bg-[#100e0c] text-[#8c857b] border-[#24211d] hover:text-white'
                    }`}
                  >
                    <MapPin size={11} />
                    <span>Location</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExcludeFromStats(!excludeFromStats)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border flex items-center gap-1.5 transition-colors ${
                      excludeFromStats
                        ? 'bg-[#ef6a57]/15 text-[#ef6a57] border-[#ef6a57]/40'
                        : 'bg-[#100e0c] text-[#8c857b] border-[#24211d] hover:text-white'
                    }`}
                  >
                    <Ban size={11} />
                    <span>Exclude from stats</span>
                  </button>
                </div>

                {/* Conditional Inputs for Clicked Pills */}
                {showExternalUrl && (
                  <div className="pt-1.5 animate-in fade-in duration-150">
                    <input
                      type="url"
                      value={externalUrl}
                      onChange={(e) => setExternalUrl(e.target.value)}
                      placeholder="https://merchant.com/receipt/123"
                      className="w-full bg-[#100e0c] border border-[#24211d] rounded-xl px-3 py-1.5 text-xs text-white placeholder-[#8c857b]/50 focus:outline-none focus:border-[#2563eb]"
                    />
                  </div>
                )}

                {showExternalRef && (
                  <div className="pt-1.5 animate-in fade-in duration-150">
                    <input
                      type="text"
                      value={externalRef}
                      onChange={(e) => setExternalRef(e.target.value)}
                      placeholder="Ref / Invoice #INV-9824"
                      className="w-full bg-[#100e0c] border border-[#24211d] rounded-xl px-3 py-1.5 text-xs text-white placeholder-[#8c857b]/50 focus:outline-none focus:border-[#2563eb]"
                    />
                  </div>
                )}

                {showLocation && (
                  <div className="pt-1.5 animate-in fade-in duration-150">
                    <input
                      type="text"
                      value={locationVal}
                      onChange={(e) => setLocationVal(e.target.value)}
                      placeholder="City, Store, or Address"
                      className="w-full bg-[#100e0c] border border-[#24211d] rounded-xl px-3 py-1.5 text-xs text-white placeholder-[#8c857b]/50 focus:outline-none focus:border-[#2563eb]"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="pt-6 border-t border-[#24211d] flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Create More Toggle Switch */}
            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-[#8c857b] select-none hover:text-white transition-colors">
              <div className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  checked={createMore}
                  onChange={(e) => setCreateMore(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-[#24211d] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2563eb]"></div>
              </div>
              <span>Create more</span>
            </label>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#8c857b] hover:text-white bg-[#1a1714] border border-[#24211d] hover:border-[#38332c] transition-all"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading || isReadOnly}
                className="flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold text-white bg-[#2563eb] hover:bg-[#1d4ed8] transition-all shadow-md shadow-[#2563eb]/30 disabled:opacity-50 active:scale-[0.99]"
              >
                {loading ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <span>{transactionToEdit ? 'Save Changes' : 'Create'}</span>
                    <span className="text-[10px] font-mono opacity-80 bg-black/20 px-1.5 py-0.5 rounded">
                      ⌘ ↵
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
});

TransactionModal.displayName = 'TransactionModal';
