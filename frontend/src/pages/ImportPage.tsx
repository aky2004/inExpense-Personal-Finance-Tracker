import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatINR } from '../utils/currency';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Download,
  Trash2,
  FileText,
  Sliders,
  Database,
  Zap,
  TrendingUp,
  TrendingDown,
  Layers,
  HelpCircle,
  CreditCard,
  Building,
  History,
  Copy,
  Check,
  Search,
  Filter,
  ExternalLink,
  ShieldAlert,
  Clock,
  ChevronRight,
  Info,
} from 'lucide-react';

// Robust ISO Date Normalizer (handles DD-MM-YYYY, DD/MM/YYYY, DD-Mon-YYYY, ISO, timestamps)
export function normalizeDateToISO(raw: any): string {
  if (!raw) return new Date().toISOString().split('T')[0];
  let str = String(raw).trim();
  if (!str) return new Date().toISOString().split('T')[0];

  // Strip timestamp part if present (e.g., "16-10-2026 14:30:22" or "2026-10-16T14:30:00")
  if (str.includes('T')) {
    str = str.split('T')[0].trim();
  } else if (str.includes(' ')) {
    const parts = str.split(' ');
    if (parts[0].includes('-') || parts[0].includes('/') || parts[0].includes('.')) {
      str = parts[0].trim();
    }
  }

  // Already standard ISO: YYYY-MM-DD
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(str)) {
    const [y, m, d] = str.split('-');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Format: YYYY/MM/DD
  if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(str)) {
    const [y, m, d] = str.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Format: DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY
  const sepMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (sepMatch) {
    let [, p1, p2, p3] = sepMatch;
    let year = parseInt(p3, 10);
    if (year < 100) year += 2000;
    const num1 = parseInt(p1, 10);
    const num2 = parseInt(p2, 10);

    let day = num1;
    let month = num2;

    // Invert if month > 12 (must be MM-DD-YYYY)
    if (month > 12 && day <= 12) {
      day = num2;
      month = num1;
    }

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  // Format: DD-Mon-YYYY (e.g., 16-Oct-2026 or 16-OCT-26)
  const monMap: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  };
  const monMatch = str.match(/^(\d{1,2})[-/ ]([A-Za-z]{3})[-/ ](\d{2,4})$/);
  if (monMatch) {
    let [, d, monStr, y] = monMatch;
    const m = monMap[monStr.toLowerCase().substring(0, 3)];
    if (m) {
      let year = parseInt(y, 10);
      if (year < 100) year += 2000;
      return `${year}-${m}-${d.padStart(2, '0')}`;
    }
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return new Date().toISOString().split('T')[0];
}

interface ParsedRow {
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  category_name?: string;
  account?: string;
  payment_type?: string;
  note?: string;
  isValid: boolean;
  validationError?: string;
}

interface ColumnMapping {
  date: string;
  description: string;
  amount: string;
  type: string;
  category: string;
  account: string;
}

interface ImportBatch {
  id: number;
  batch_id: string;
  filename: string;
  total_records: number;
  inflow_amount: number;
  outflow_amount: number;
  net_amount: number;
  account: string;
  status: string;
  created_at: string;
}

export const ImportPage: React.FC = () => {
  const { isReadOnly } = useAuth();
  const navigate = useNavigate();

  // Tab State: 'upload' | 'history'
  const [activeTab, setActiveTab] = useState<'upload' | 'history'>('upload');

  // File & Parsing State
  const [file, setFile] = useState<File | null>(null);
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({
    date: '',
    description: '',
    amount: '',
    type: '',
    category: '',
    account: '',
  });

  // Categories & Accounts
  const [categories, setCategories] = useState<{ id: number; name: string; type: string }[]>([]);
  const [accounts, setAccounts] = useState<{ id: number; name: string }[]>([]);
  const [defaultAccount, setDefaultAccount] = useState<string>('HDFC Salary Account');
  const [defaultCategory, setDefaultCategory] = useState<string>('');

  // Preview filtering & search
  const [previewSearch, setPreviewSearch] = useState<string>('');
  const [previewTypeFilter, setPreviewTypeFilter] = useState<'all' | 'income' | 'expense'>('all');

  // Parsed Output & Submission
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    count: number;
    batchId: string;
    inflow: number;
    outflow: number;
    net: number;
    message: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Import History State
  const [historyList, setHistoryList] = useState<ImportBatch[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [historySearch, setHistorySearch] = useState<string>('');
  const [copiedBatchId, setCopiedBatchId] = useState<string | null>(null);
  const [rollingBackId, setRollingBackId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch Categories, Accounts, and Import History
  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.get('/transactions/imports');
      if (res.data?.data) {
        setHistoryList(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load import history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    api
      .get('/categories')
      .then((res) => {
        if (res.data?.data) setCategories(res.data.data);
      })
      .catch((err) => console.error('Failed to load categories:', err));

    api
      .get('/accounts')
      .then((res) => {
        if (res.data?.data) {
          setAccounts(res.data.data);
          if (res.data.data.length > 0) setDefaultAccount(res.data.data[0].name);
        }
      })
      .catch((err) => console.error('Failed to load accounts:', err));

    fetchHistory();
  }, []);

  // Robust CSV Line Parser
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' || char === "'") {
        if (inQuotes && line[i + 1] === char) {
          current += char;
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const processFile = (selectedFile: File) => {
    setFile(selectedFile);
    setImportResult(null);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const lines = content
        .split(/\r\n|\n|\r/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      if (lines.length < 2) {
        setErrorMessage('The selected CSV file must have a header row and at least one data row.');
        return;
      }

      const headers = parseCSVLine(lines[0]);
      setRawHeaders(headers);

      const rows: string[][] = [];
      for (let i = 1; i < lines.length; i++) {
        const parsed = parseCSVLine(lines[i]);
        if (parsed.some((cell) => cell.length > 0)) {
          rows.push(parsed);
        }
      }
      setRawRows(rows);

      // Auto-detect column mapping
      const autoMapping: ColumnMapping = {
        date: '',
        description: '',
        amount: '',
        type: '',
        category: '',
        account: '',
      };

      headers.forEach((h) => {
        const lower = h.toLowerCase().trim();
        if (!autoMapping.date && (lower.includes('date') || lower.includes('time') || lower.includes('txn'))) {
          autoMapping.date = h;
        } else if (
          !autoMapping.description &&
          (lower.includes('desc') ||
            lower.includes('narration') ||
            lower.includes('payee') ||
            lower.includes('merchant') ||
            lower.includes('particular') ||
            lower.includes('detail'))
        ) {
          autoMapping.description = h;
        } else if (
          !autoMapping.amount &&
          !lower.includes('balance') &&
          !lower.includes('bal') &&
          (lower.includes('amount') || lower.includes('amt') || lower.includes('total') || lower.includes('sum'))
        ) {
          autoMapping.amount = h;
        } else if (!autoMapping.type && (lower.includes('type') || lower.includes('dr/cr') || lower.includes('direction'))) {
          autoMapping.type = h;
        } else if (!autoMapping.category && (lower.includes('cat') || lower.includes('tag') || lower.includes('label'))) {
          autoMapping.category = h;
        } else if (
          !autoMapping.account &&
          !lower.includes('balance') &&
          !lower.includes('bal') &&
          !lower.includes('amount') &&
          !lower.includes('amt') &&
          !lower.includes('total') &&
          (lower.includes('account') || lower.includes('bank') || lower === 'wallet' || lower.includes('wallet name') || lower.includes('card'))
        ) {
          autoMapping.account = h;
        }
      });

      if (!autoMapping.date && headers.length > 0) autoMapping.date = headers[0];
      if (!autoMapping.description && headers.length > 1) autoMapping.description = headers[1];
      if (!autoMapping.amount && headers.length > 2) autoMapping.amount = headers[2];

      const fname = selectedFile.name.toLowerCase();
      if (fname.includes('mobikwik') || fname.includes('paytm') || fname.includes('phonepe') || fname.includes('wallet')) {
        setDefaultAccount('Cash & UPI Wallet');
      }

      setMapping(autoMapping);
    };

    reader.readAsText(selectedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Re-compute parsed rows
  useEffect(() => {
    if (rawRows.length === 0 || rawHeaders.length === 0) {
      setParsedData([]);
      return;
    }

    const dateIdx = rawHeaders.indexOf(mapping.date);
    const descIdx = rawHeaders.indexOf(mapping.description);
    const amtIdx = rawHeaders.indexOf(mapping.amount);
    const typeIdx = mapping.type ? rawHeaders.indexOf(mapping.type) : -1;
    const catIdx = mapping.category ? rawHeaders.indexOf(mapping.category) : -1;
    const accIdx = mapping.account ? rawHeaders.indexOf(mapping.account) : -1;

    const parsed: ParsedRow[] = rawRows.map((row) => {
      const rawDateStr = dateIdx >= 0 ? row[dateIdx] || '' : '';
      const rawDescStr = descIdx >= 0 ? row[descIdx] || '' : 'Transaction';
      const rawAmtStr = amtIdx >= 0 ? (row[amtIdx] || '').replace(/[^0-9.-]/g, '') : '0';
      const rawTypeStr = typeIdx >= 0 ? (row[typeIdx] || '').toLowerCase() : '';
      const rawCatStr = catIdx >= 0 ? row[catIdx] || '' : defaultCategory;
      const rawAccStr = accIdx >= 0 ? row[accIdx] || '' : defaultAccount;

      const numAmt = parseFloat(rawAmtStr);
      let isValid = true;
      let validationError = '';

      if (isNaN(numAmt) || numAmt === 0) {
        isValid = false;
        validationError = 'Invalid amount';
      }

      // Smart Type Inference from explicit type OR description / narration keywords
      let inferredType: 'income' | 'expense' | 'transfer' = 'expense';
      const descLower = rawDescStr.toLowerCase();

      if (rawTypeStr) {
        if (rawTypeStr.includes('inc') || rawTypeStr.includes('credit') || rawTypeStr === 'cr' || rawTypeStr === '+') {
          inferredType = 'income';
        } else if (rawTypeStr.includes('trans') || rawTypeStr === 'tr') {
          inferredType = 'transfer';
        } else if (rawTypeStr.includes('exp') || rawTypeStr.includes('debit') || rawTypeStr === 'dr' || rawTypeStr === '-') {
          inferredType = 'expense';
        } else if (numAmt < 0) {
          inferredType = 'expense';
        }
      } else {
        const incomeKeywords = [
          'received', 'refund', 'cashback', 'salary', 'credit', 'interest',
          'dividend', 'deposit', 'added to wallet', 'reversal', 'inward', 'bonus', 'cr'
        ];
        const expenseKeywords = [
          'paid to', 'payment to', 'purchase', 'spent', 'debited', 'recharge',
          'bill', 'sent to', 'transferred to', 'withdrawn', 'fee', 'charge', 'dr'
        ];

        if (incomeKeywords.some((kw) => descLower.includes(kw))) {
          inferredType = 'income';
        } else if (expenseKeywords.some((kw) => descLower.includes(kw))) {
          inferredType = 'expense';
        } else if (numAmt < 0) {
          inferredType = 'expense';
        }
      }

      // Smart Category Inference from description if unmapped
      let cleanCatStr = rawCatStr;
      if (!cleanCatStr) {
        if (descLower.includes('pharmacy') || descLower.includes('health') || descLower.includes('apollo') || descLower.includes('hospital')) {
          cleanCatStr = 'Healthcare';
        } else if (descLower.includes('uber') || descLower.includes('ola') || descLower.includes('metro') || descLower.includes('fuel') || descLower.includes('petrol')) {
          cleanCatStr = 'Transportation';
        } else if (descLower.includes('swiggy') || descLower.includes('zomato') || descLower.includes('restaurant') || descLower.includes('coffee') || descLower.includes('starbucks')) {
          cleanCatStr = 'Food & Dining';
        } else if (descLower.includes('amazon') || descLower.includes('flipkart') || descLower.includes('myntra') || descLower.includes('shopping')) {
          cleanCatStr = 'Shopping';
        } else if (descLower.includes('recharge') || descLower.includes('electricity') || descLower.includes('bill') || descLower.includes('bescom') || descLower.includes('jio') || descLower.includes('airtel')) {
          cleanCatStr = 'Utilities';
        } else if (descLower.includes('netflix') || descLower.includes('prime') || descLower.includes('spotify') || descLower.includes('movie')) {
          cleanCatStr = 'Entertainment';
        } else if (descLower.includes('rent') || descLower.includes('housing') || descLower.includes('maintenance')) {
          cleanCatStr = 'Housing & Rent';
        } else if (descLower.includes('salary') || descLower.includes('payroll')) {
          cleanCatStr = 'Salary';
        } else if (descLower.includes('freelance') || descLower.includes('client') || descLower.includes('consulting')) {
          cleanCatStr = 'Freelance';
        }
      }

      // Clean and normalize date
      const cleanDate = normalizeDateToISO(rawDateStr);

      // Clean and normalize account: if numeric (e.g. from balance column) or blank, use fallback default
      let cleanAccStr = rawAccStr.trim();
      if (!cleanAccStr || /^[\d.,]+$/.test(cleanAccStr)) {
        cleanAccStr = defaultAccount;
      }

      return {
        date: cleanDate,
        description: rawDescStr || 'Imported Entry',
        amount: Math.abs(numAmt) || 0,
        type: inferredType,
        category_name: cleanCatStr || undefined,
        account: cleanAccStr || defaultAccount,
        isValid,
        validationError,
      };
    });

    setParsedData(parsed);
  }, [rawRows, rawHeaders, mapping, defaultAccount, defaultCategory]);

  // Statistics
  const validRows = parsedData.filter((r) => r.isValid);
  const totalInflow = validRows.filter((r) => r.type === 'income').reduce((acc, r) => acc + r.amount, 0);
  const totalOutflow = validRows.filter((r) => r.type === 'expense').reduce((acc, r) => acc + r.amount, 0);

  // Filtered Preview Rows
  const filteredPreviewRows = useMemo(() => {
    return parsedData.filter((r) => {
      const matchSearch =
        previewSearch === '' ||
        r.description.toLowerCase().includes(previewSearch.toLowerCase()) ||
        r.date.includes(previewSearch) ||
        (r.category_name && r.category_name.toLowerCase().includes(previewSearch.toLowerCase()));
      const matchType = previewTypeFilter === 'all' || r.type === previewTypeFilter;
      return matchSearch && matchType;
    });
  }, [parsedData, previewSearch, previewTypeFilter]);

  // History Statistics
  const totalBatches = historyList.length;
  const cumulativeImportedRecords = historyList.reduce((acc, b) => acc + b.total_records, 0);
  const cumulativeInflow = historyList.reduce((acc, b) => acc + b.inflow_amount, 0);
  const cumulativeOutflow = historyList.reduce((acc, b) => acc + b.outflow_amount, 0);

  // Filtered History List
  const filteredHistory = useMemo(() => {
    if (!historySearch) return historyList;
    const lower = historySearch.toLowerCase();
    return historyList.filter(
      (b) =>
        b.batch_id.toLowerCase().includes(lower) ||
        b.filename.toLowerCase().includes(lower) ||
        b.account.toLowerCase().includes(lower)
    );
  }, [historyList, historySearch]);

  // Execute Import
  const handleConfirmImport = async () => {
    if (isReadOnly) {
      alert('Read-only accounts cannot modify or import transactions.');
      return;
    }

    if (validRows.length === 0) {
      setErrorMessage('No valid transactions found to import.');
      return;
    }

    setImporting(true);
    setErrorMessage(null);

    try {
      const payload = {
        filename: file?.name || 'bank_statement.csv',
        transactions: validRows.map((r) => ({
          date: r.date,
          description: r.description,
          amount: r.amount,
          type: r.type,
          category_name: r.category_name,
          account: r.account,
          payment_type: 'Credit card',
          note: `CSV Ingestion (${file?.name || 'statement'})`,
        })),
      };

      const res = await api.post('/transactions/import', payload);
      setImportResult({
        success: true,
        count: res.data.count || validRows.length,
        batchId: res.data.batchId || 'IMP-BATCH',
        inflow: res.data.inflow || totalInflow,
        outflow: res.data.outflow || totalOutflow,
        net: res.data.net || (totalInflow - totalOutflow),
        message: res.data.message || `Successfully imported ${validRows.length} transactions.`,
      });

      // Refresh import history in background
      fetchHistory();
    } catch (err: any) {
      console.error('Import failed:', err);
      setErrorMessage(err.response?.data?.error || 'Failed to import transactions. Please verify file columns.');
    } finally {
      setImporting(false);
    }
  };

  // Rollback batch
  const handleRollbackBatch = async (batchId: string) => {
    if (isReadOnly) {
      alert('Read-only accounts cannot delete import batches.');
      return;
    }

    if (!window.confirm(`Are you sure you want to rollback batch ${batchId}? This will remove all transactions created by this import.`)) {
      return;
    }

    setRollingBackId(batchId);
    try {
      await api.delete(`/transactions/imports/${batchId}`);
      await fetchHistory();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to rollback batch.');
    } finally {
      setRollingBackId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBatchId(text);
    setTimeout(() => setCopiedBatchId(null), 2000);
  };

  // Preset Template Loader
  const loadPreset = (preset: 'hdfc' | 'sbi' | 'generic') => {
    let csv = '';
    if (preset === 'hdfc') {
      csv =
        'Date,Narration,Amount,Type,Category,Account\n' +
        '2026-11-21,Salary Credit TechBridge Corp,145000.00,income,Salary,HDFC Salary Account\n' +
        '2026-11-20,Apollo Pharmacy Health,1850.00,expense,Healthcare,HDFC Salary Account\n' +
        '2026-11-18,Bescom Power Bill,2850.00,expense,Utilities,HDFC Salary Account\n' +
        '2026-11-17,Prestige Estates Rent,32000.00,expense,Housing & Rent,HDFC Salary Account\n';
      setDefaultAccount('HDFC Salary Account');
    } else if (preset === 'sbi') {
      csv =
        'Txn Date,Merchant Details,Debit/Credit,Amount,Category,Card\n' +
        '2026-11-20,Amazon India Shopping,debit,4800.00,Shopping,SBI Platinum Card\n' +
        '2026-11-19,Netflix & Prime Subscriptions,debit,1450.00,Entertainment,SBI Platinum Card\n' +
        '2026-11-16,Uber Premier Ride,debit,620.00,Transportation,SBI Platinum Card\n';
      setDefaultAccount('SBI Platinum Card');
    } else {
      csv =
        'Date,Description,Amount,Type,Category,Account\n' +
        '2026-11-20,Starbucks Coffee,340.00,expense,Food & Dining,Cash & UPI Wallet\n' +
        '2026-11-19,Client Retainer Freelance,45000.00,income,Freelance,HDFC Salary Account\n' +
        '2026-11-18,Zepto Quick Essentials,850.00,expense,Food & Dining,Cash & UPI Wallet\n';
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const fileObj = new File([blob], `${preset}_statement_sample.csv`, { type: 'text/csv' });
    processFile(fileObj);
  };

  const downloadSampleTemplate = () => {
    const csvContent =
      'Date,Description,Amount,Type,Category,Account\n' +
      '2026-11-21,TechBridge Monthly Salary,145000.00,income,Salary,HDFC Salary Account\n' +
      '2026-11-20,Starbucks Reserve Espresso,340.00,expense,Food & Dining,HDFC Salary Account\n' +
      '2026-11-19,Client Freelance Retainer,45000.00,income,Freelance,HDFC Salary Account\n' +
      '2026-11-18,Amazon India Electronics,4299.00,expense,Shopping,SBI Platinum Card\n' +
      '2026-11-17,Prestige Apartment Maintenance,3500.00,expense,Housing & Rent,HDFC Salary Account\n' +
      '2026-11-16,Uber Ride to Airport,850.00,expense,Transportation,Cash & UPI Wallet\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'inexpense_sample_transactions.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    setFile(null);
    setRawHeaders([]);
    setRawRows([]);
    setParsedData([]);
    setImportResult(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. Header Banner & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#24211d]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#2563eb] to-[#3b82f6] text-white flex items-center justify-center font-black shadow-md shadow-[#2563eb]/20">
              <FileSpreadsheet size={18} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                <span>Transaction Ingestion Hub</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#2563eb]/20 text-[#3b82f6] border border-[#2563eb]/30 font-bold uppercase tracking-wider">
                  CSV • ACID
                </span>
              </h1>
              <p className="text-xs text-[#8c857b]">
                Parse, normalize, and bulk-commit statement exports with automated category mapping and an audit log of past imports.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={downloadSampleTemplate}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#8c857b] hover:text-white bg-[#141210] border border-[#24211d] hover:border-[#38332c] transition-colors cursor-pointer"
            title="Download ready-to-use CSV template"
          >
            <Download size={13} />
            <span>Download CSV Template</span>
          </button>
          <Link
            to="/transactions"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#2563eb] hover:bg-[#1d4ed8] shadow-xs transition-all"
          >
            <CreditCard size={13} />
            <span>Open Ledger</span>
          </Link>
        </div>
      </div>

      {/* 2. Cumulative Ingestion KPI Telemetry Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Batches Card */}
        <div className="p-4 rounded-2xl bg-[#141210] border border-[#24211d] space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-[#8c857b] text-[11px] font-mono">
            <span>IMPORT BATCHES</span>
            <History size={13} className="text-[#3b82f6]" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{totalBatches}</div>
          <div className="text-[10px] text-[#8c857b]">Audited Ingestion Runs</div>
        </div>

        {/* Total Records Card */}
        <div className="p-4 rounded-2xl bg-[#141210] border border-[#24211d] space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-[#8c857b] text-[11px] font-mono">
            <span>TOTAL TRANSACTIONS</span>
            <Database size={13} className="text-[#4cc38a]" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{cumulativeImportedRecords}</div>
          <div className="text-[10px] text-[#8c857b]">Committed to PostgreSQL</div>
        </div>

        {/* Total Inflow Card */}
        <div className="p-4 rounded-2xl bg-[#141210] border border-[#24211d] space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-[#4cc38a] text-[11px] font-mono">
            <span>CUMULATIVE INFLOW</span>
            <TrendingUp size={13} />
          </div>
          <div className="text-2xl font-black text-[#4cc38a] font-mono">
            +{formatINR(cumulativeInflow)}
          </div>
          <div className="text-[10px] text-[#8c857b]">Imported Credits</div>
        </div>

        {/* Total Outflow Card */}
        <div className="p-4 rounded-2xl bg-[#141210] border border-[#24211d] space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-[#ef6a57] text-[11px] font-mono">
            <span>CUMULATIVE OUTFLOW</span>
            <TrendingDown size={13} />
          </div>
          <div className="text-2xl font-black text-[#ef6a57] font-mono">
            -{formatINR(cumulativeOutflow)}
          </div>
          <div className="text-[10px] text-[#8c857b]">Imported Debits</div>
        </div>
      </div>

      {/* Read-Only Banner */}
      {isReadOnly && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-xs text-amber-400">
          <AlertCircle size={15} className="shrink-0" />
          <span>
            You are logged in with a <strong>Read-Only</strong> role. You can inspect mappings and preview rows, but database insertion is disabled.
          </span>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-[#ef6a57]/10 border border-[#ef6a57]/30 flex items-center gap-3 text-xs text-[#ef6a57]">
          <AlertCircle size={15} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 3. Segmented Navigation Bar: Upload & Ingest vs Import History */}
      <div className="flex items-center justify-between border-b border-[#24211d] pb-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-[#2563eb] text-white shadow-sm'
                : 'text-[#8c857b] hover:text-white hover:bg-[#141210]'
            }`}
          >
            <UploadCloud size={15} />
            <span>Upload &amp; Ingest</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('history');
              fetchHistory();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-[#2563eb] text-white shadow-sm'
                : 'text-[#8c857b] hover:text-white hover:bg-[#141210]'
            }`}
          >
            <History size={15} />
            <span>Import History &amp; Audit Log</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === 'history'
                  ? 'bg-white/20 text-white'
                  : 'bg-[#1a1714] text-[#8c857b] border border-[#24211d]'
              }`}
            >
              {historyList.length}
            </span>
          </button>
        </div>

        {activeTab === 'history' && (
          <button
            onClick={fetchHistory}
            className="p-1.5 rounded-lg text-[#8c857b] hover:text-white hover:bg-[#141210] transition-colors"
            title="Refresh History"
          >
            <RefreshCw size={13} className={loadingHistory ? 'animate-spin' : ''} />
          </button>
        )}
      </div>

      {/* =========================================================================
          TAB 1: UPLOAD & INGEST PIPELINE (RESTRUCTURED BALANCED FLOW)
         ========================================================================= */}
      {activeTab === 'upload' && (
        <div className="space-y-6">
          {/* Success Banner if batch completed */}
          {importResult && (
            <div className="p-8 rounded-2xl bg-[#141210] border border-[#24211d] text-center space-y-5 shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-[#4cc38a]/20 text-[#4cc38a] flex items-center justify-center mx-auto">
                <CheckCircle2 size={36} />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-white tracking-tight">Batch Import Settled!</h2>
                <p className="text-sm text-[#8c857b] max-w-lg mx-auto">
                  Successfully ingested <strong className="text-white">{importResult.count}</strong> transactions under Batch ID{' '}
                  <span className="font-mono text-[#3b82f6] font-bold">{importResult.batchId}</span> into PostgreSQL ACID storage.
                </p>
              </div>

              {/* Ingestion Financial Delta Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto pt-2">
                <div className="p-3 rounded-xl bg-[#1a1714] border border-[#24211d] text-center space-y-0.5">
                  <div className="text-[10px] font-mono text-[#4cc38a] uppercase">Inflow Added</div>
                  <div className="text-base font-bold text-[#4cc38a] font-mono">+{formatINR(importResult.inflow)}</div>
                </div>
                <div className="p-3 rounded-xl bg-[#1a1714] border border-[#24211d] text-center space-y-0.5">
                  <div className="text-[10px] font-mono text-[#ef6a57] uppercase">Outflow Added</div>
                  <div className="text-base font-bold text-[#ef6a57] font-mono">-{formatINR(importResult.outflow)}</div>
                </div>
                <div className="p-3 rounded-xl bg-[#1a1714] border border-[#24211d] text-center space-y-0.5">
                  <div className="text-[10px] font-mono text-[#3b82f6] uppercase">Net Impact</div>
                  <div className="text-base font-bold text-white font-mono">{formatINR(importResult.net)}</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#1a1714] border border-[#24211d] max-w-md mx-auto flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2 text-[#4cc38a]">
                  <Database size={14} />
                  <span>PostgreSQL ACID Settled</span>
                </div>
                <div className="flex items-center gap-2 text-[#3b82f6]">
                  <Zap size={14} />
                  <span>Redis Cache Flushed</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
                <Link
                  to="/transactions"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold shadow-md transition-all"
                >
                  <CreditCard size={14} />
                  <span>View in Ledger</span>
                  <ArrowRight size={13} />
                </Link>
                <button
                  onClick={() => setActiveTab('history')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1a1714] hover:bg-[#24211d] text-white text-xs font-bold border border-[#24211d] transition-all cursor-pointer"
                >
                  <History size={14} />
                  <span>View Import History</span>
                </button>
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-[#8c857b] hover:text-white transition-colors cursor-pointer"
                >
                  <span>Import Another File</span>
                </button>
              </div>
            </div>
          )}

          {!importResult && (
            <div className="space-y-6">
              {/* TOP ROW: File Dropzone (left) + Fast Statement Presets & Info (right) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
                {/* 1. File Upload Dropzone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-2 shadow-sm min-h-[160px] ${
                    file
                      ? 'border-[#2563eb] bg-[#2563eb]/5'
                      : 'border-[#24211d] hover:border-[#38332c] bg-[#141210]'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt,.tsv"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <div className="w-11 h-11 rounded-2xl bg-[#1a1714] border border-[#24211d] flex items-center justify-center text-[#3b82f6] shadow-sm">
                    <UploadCloud size={22} />
                  </div>

                  {file ? (
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-white truncate max-w-xs">
                        {file.name}
                      </p>
                      <p className="text-[11px] text-[#8c857b]">
                        {(file.size / 1024).toFixed(1)} KB • {rawRows.length} rows parsed
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReset();
                        }}
                        className="mt-1 inline-flex items-center gap-1 text-[11px] text-[#ef6a57] hover:underline cursor-pointer"
                      >
                        <Trash2 size={11} /> Clear / Replace File
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-white">
                        Click to select or drop CSV file here
                      </p>
                      <p className="text-[11px] text-[#8c857b]">
                        Supports CSV, TSV, or TXT bank statement exports
                      </p>
                    </div>
                  )}
                </div>

                {/* 2. Fast Statement Presets Card */}
                <div className="p-6 rounded-2xl bg-[#141210] border border-[#24211d] flex flex-col justify-between space-y-3 shadow-sm min-h-[160px]">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <Building size={14} className="text-[#3b82f6]" /> Fast Bank Presets
                      </span>
                      <span className="text-[10px] text-[#8c857b] font-mono">1-Click Test Data</span>
                    </div>
                    <p className="text-[11px] text-[#8c857b] leading-relaxed">
                      Instant pre-mapped statement samples to test the pipeline, column mapper, and PostgreSQL ingestion:
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => loadPreset('hdfc')}
                      className="p-2.5 rounded-xl bg-[#1a1714] hover:bg-[#24211d] text-[11px] font-semibold text-white border border-[#24211d] hover:border-[#2563eb]/50 transition-all text-center cursor-pointer group"
                    >
                      <div className="font-bold group-hover:text-[#3b82f6] transition-colors">HDFC Bank</div>
                      <div className="text-[9px] text-[#8c857b]">Checking/Salary</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => loadPreset('sbi')}
                      className="p-2.5 rounded-xl bg-[#1a1714] hover:bg-[#24211d] text-[11px] font-semibold text-white border border-[#24211d] hover:border-[#2563eb]/50 transition-all text-center cursor-pointer group"
                    >
                      <div className="font-bold group-hover:text-[#3b82f6] transition-colors">SBI Card</div>
                      <div className="text-[9px] text-[#8c857b]">Credit Card</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => loadPreset('generic')}
                      className="p-2.5 rounded-xl bg-[#1a1714] hover:bg-[#24211d] text-[11px] font-semibold text-white border border-[#24211d] hover:border-[#2563eb]/50 transition-all text-center cursor-pointer group"
                    >
                      <div className="font-bold group-hover:text-[#3b82f6] transition-colors">Generic CSV</div>
                      <div className="text-[9px] text-[#8c857b]">Standard Format</div>
                    </button>
                  </div>
                </div>
              </div>

              {/* MIDDLE ROW: Column Mapping (Full-width clean card!) */}
              {rawHeaders.length > 0 && (
                <div className="p-5 rounded-2xl bg-[#141210] border border-[#24211d] space-y-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#24211d]">
                    <div className="flex items-center gap-2">
                      <Sliders size={15} className="text-[#3b82f6]" />
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                        Column Mapping &amp; Ingestion Rules
                      </h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#4cc38a]/10 text-[#4cc38a] border border-[#4cc38a]/20 font-bold">
                        Auto-Detected ({rawHeaders.length} headers)
                      </span>
                    </div>
                    <span className="text-[11px] text-[#8c857b]">
                      Map each ledger field to your CSV columns
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                    {/* Date */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-[#8c857b]">Date Column *</label>
                      <select
                        value={mapping.date}
                        onChange={(e) => setMapping({ ...mapping, date: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-[#1a1714] border border-[#24211d] text-xs text-white focus:outline-none focus:border-[#2563eb]"
                      >
                        <option value="">-- Header --</option>
                        {rawHeaders.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Description */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-[#8c857b]">Description *</label>
                      <select
                        value={mapping.description}
                        onChange={(e) => setMapping({ ...mapping, description: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-[#1a1714] border border-[#24211d] text-xs text-white focus:outline-none focus:border-[#2563eb]"
                      >
                        <option value="">-- Header --</option>
                        {rawHeaders.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Amount */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-[#8c857b]">Amount *</label>
                      <select
                        value={mapping.amount}
                        onChange={(e) => setMapping({ ...mapping, amount: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-[#1a1714] border border-[#24211d] text-xs text-white focus:outline-none focus:border-[#2563eb]"
                      >
                        <option value="">-- Header --</option>
                        {rawHeaders.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Type */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-[#8c857b]">Type (Optional)</label>
                      <select
                        value={mapping.type}
                        onChange={(e) => setMapping({ ...mapping, type: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-[#1a1714] border border-[#24211d] text-xs text-white focus:outline-none focus:border-[#2563eb]"
                      >
                        <option value="">Auto-infer</option>
                        {rawHeaders.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Category */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-[#8c857b]">Category</label>
                      <select
                        value={mapping.category}
                        onChange={(e) => setMapping({ ...mapping, category: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-[#1a1714] border border-[#24211d] text-xs text-white focus:outline-none focus:border-[#2563eb]"
                      >
                        <option value="">Auto-detect</option>
                        {rawHeaders.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Account */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-[#8c857b]">Account</label>
                      <select
                        value={mapping.account}
                        onChange={(e) => setMapping({ ...mapping, account: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-[#1a1714] border border-[#24211d] text-xs text-white focus:outline-none focus:border-[#2563eb]"
                      >
                        <option value="">-- None (Use Fallback Account) --</option>
                        {rawHeaders.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Fallback Overrides Strip */}
                  <div className="pt-3 border-t border-[#24211d] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-[#8c857b]">
                      <Info size={13} />
                      <span>Fallback Defaults (applied if column is unmapped or blank):</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#8c857b] text-[11px]">Account:</span>
                        <select
                          value={defaultAccount}
                          onChange={(e) => setDefaultAccount(e.target.value)}
                          className="px-2.5 py-1 rounded-lg bg-[#1a1714] border border-[#24211d] text-xs text-white focus:outline-none"
                        >
                          {accounts.length > 0 ? (
                            accounts.map((acc) => (
                              <option key={acc.id} value={acc.name}>
                                {acc.name}
                              </option>
                            ))
                          ) : (
                            <>
                              <option value="HDFC Salary Account">HDFC Salary Account</option>
                              <option value="SBI Platinum Card">SBI Platinum Card</option>
                              <option value="Cash & UPI Wallet">Cash &amp; UPI Wallet</option>
                            </>
                          )}
                        </select>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[#8c857b] text-[11px]">Category:</span>
                        <select
                          value={defaultCategory}
                          onChange={(e) => setDefaultCategory(e.target.value)}
                          className="px-2.5 py-1 rounded-lg bg-[#1a1714] border border-[#24211d] text-xs text-white focus:outline-none"
                        >
                          <option value="">Auto-Detect</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* BOTTOM ROW: Parsed Preview & Ingestion Table (Full-width!) */}
              {parsedData.length > 0 ? (
                <div className="space-y-4">
                  {/* Live Metric Strip */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="p-4 rounded-xl bg-[#141210] border border-[#24211d] space-y-0.5 shadow-sm">
                      <div className="text-[10px] font-mono uppercase text-[#8c857b]">Validated Rows</div>
                      <div className="text-xl font-bold text-white font-mono">
                        {validRows.length} <span className="text-xs text-[#8c857b] font-normal">/ {parsedData.length}</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-[#141210] border border-[#24211d] space-y-0.5 shadow-sm">
                      <div className="text-[10px] font-mono uppercase text-[#4cc38a] flex items-center gap-1">
                        <TrendingUp size={11} /> Total Inflow
                      </div>
                      <div className="text-lg font-bold text-[#4cc38a] font-mono">
                        +{formatINR(totalInflow)}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-[#141210] border border-[#24211d] space-y-0.5 shadow-sm">
                      <div className="text-[10px] font-mono uppercase text-[#ef6a57] flex items-center gap-1">
                        <TrendingDown size={11} /> Total Outflow
                      </div>
                      <div className="text-lg font-bold text-[#ef6a57] font-mono">
                        -{formatINR(totalOutflow)}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-[#141210] border border-[#24211d] space-y-0.5 shadow-sm">
                      <div className="text-[10px] font-mono uppercase text-[#3b82f6] flex items-center gap-1">
                        <Zap size={11} /> Net Delta
                      </div>
                      <div className="text-lg font-bold text-white font-mono">
                        {totalInflow - totalOutflow >= 0 ? '+' : ''}{formatINR(totalInflow - totalOutflow)}
                      </div>
                    </div>
                  </div>

                  {/* Preview Table Card with Search & Filters */}
                  <div className="p-5 rounded-2xl bg-[#141210] border border-[#24211d] space-y-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-[#24211d]">
                      <div className="flex items-center gap-2">
                        <Layers size={15} className="text-[#3b82f6]" />
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                          Parsed Records Preview
                        </h3>
                        <span className="text-[11px] text-[#8c857b]">
                          (Showing {filteredPreviewRows.length} of {parsedData.length} records)
                        </span>
                      </div>

                      {/* Search & Filter inside table */}
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8c857b]" />
                          <input
                            type="text"
                            placeholder="Filter preview rows..."
                            value={previewSearch}
                            onChange={(e) => setPreviewSearch(e.target.value)}
                            className="pl-7 pr-2.5 py-1 rounded-lg bg-[#1a1714] border border-[#24211d] text-xs text-white placeholder-[#8c857b] focus:outline-none focus:border-[#2563eb]"
                          />
                        </div>

                        <select
                          value={previewTypeFilter}
                          onChange={(e) => setPreviewTypeFilter(e.target.value as any)}
                          className="px-2.5 py-1 rounded-lg bg-[#1a1714] border border-[#24211d] text-xs text-white focus:outline-none"
                        >
                          <option value="all">All Types</option>
                          <option value="income">Income Only</option>
                          <option value="expense">Expense Only</option>
                        </select>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-[#24211d] max-h-[420px] overflow-y-auto">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-[#1a1714] text-[#8c857b] border-b border-[#24211d] sticky top-0 z-10">
                          <tr>
                            <th className="p-3">Date</th>
                            <th className="p-3">Description / Payee</th>
                            <th className="p-3">Category</th>
                            <th className="p-3">Destination Account</th>
                            <th className="p-3 text-right">Amount</th>
                            <th className="p-3 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#24211d] text-[#f2efe9]">
                          {filteredPreviewRows.length > 0 ? (
                            filteredPreviewRows.map((row, idx) => (
                              <tr key={idx} className="hover:bg-[#1a1714]/60 transition-colors">
                                <td className="p-3 text-[#8c857b] whitespace-nowrap">{row.date}</td>
                                <td className="p-3 font-sans font-medium text-white max-w-xs">
                                  {row.description}
                                </td>
                                <td className="p-3 text-[11px]">
                                  {row.category_name ? (
                                    <span className="px-2 py-0.5 rounded-md bg-[#2563eb]/15 text-[#3b82f6] border border-[#2563eb]/25 font-semibold">
                                      {row.category_name}
                                    </span>
                                  ) : (
                                    <span className="text-[#8c857b]">--</span>
                                  )}
                                </td>
                                <td className="p-3 text-[11px] text-[#8c857b] max-w-[160px]">
                                  {row.account}
                                </td>
                                <td
                                  className={`p-3 text-right font-bold whitespace-nowrap ${
                                    row.type === 'income' ? 'text-[#4cc38a]' : 'text-[#ef6a57]'
                                  }`}
                                >
                                  {row.type === 'income' ? '+' : '-'}₹{row.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="p-3 text-center">
                                  {row.isValid ? (
                                    <span className="inline-flex items-center text-[#4cc38a] gap-1 text-[11px]" title="Valid row">
                                      <CheckCircle2 size={13} />
                                      <span className="font-sans">Valid</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center text-[#ef6a57] gap-1 text-[11px]" title={row.validationError}>
                                      <AlertCircle size={13} />
                                      <span className="font-sans">Invalid</span>
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-[#8c857b] font-sans">
                                No records matching your filter.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <button
                        onClick={handleReset}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-[#8c857b] hover:text-white bg-[#1a1714] border border-[#24211d] hover:border-[#38332c] transition-colors cursor-pointer"
                      >
                        Clear File
                      </button>

                      <button
                        onClick={handleConfirmImport}
                        disabled={importing || validRows.length === 0 || isReadOnly}
                        className="inline-flex items-center justify-center gap-2 px-7 py-2.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold transition-all shadow-md shadow-[#2563eb]/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {importing ? (
                          <>
                            <RefreshCw size={14} className="animate-spin" />
                            <span>Committing {validRows.length} Rows to PostgreSQL...</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud size={15} />
                            <span>Commit &amp; Ingest ({validRows.length}) Transactions</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Empty state when no file uploaded yet */
                <div className="p-10 rounded-2xl bg-[#141210] border border-[#24211d] text-center space-y-3 shadow-sm">
                  <div className="w-12 h-12 rounded-2xl bg-[#1a1714] border border-[#24211d] text-[#8c857b] flex items-center justify-center mx-auto">
                    <FileText size={22} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white">Ready for Ingestion</h3>
                    <p className="text-xs text-[#8c857b] max-w-sm mx-auto leading-relaxed">
                      Upload your statement above or click any bank preset to preview rows with automatic column mapping.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: IMPORT HISTORY & AUDIT LOG
         ========================================================================= */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* History Search & Filters Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#141210] border border-[#24211d]">
            <div className="relative flex-1 max-w-md">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8c857b]" />
              <input
                type="text"
                placeholder="Search by batch ID, file name, or account..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#1a1714] border border-[#24211d] text-xs text-white placeholder-[#8c857b] focus:outline-none focus:border-[#2563eb]"
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-[#8c857b]">
              <span>Showing {filteredHistory.length} of {historyList.length} batches</span>
            </div>
          </div>

          {/* History Table */}
          {filteredHistory.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-[#24211d] bg-[#141210] shadow-sm">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#1a1714] text-[#8c857b] border-b border-[#24211d]">
                  <tr>
                    <th className="p-3.5">Batch ID</th>
                    <th className="p-3.5">File Name</th>
                    <th className="p-3.5">Account</th>
                    <th className="p-3.5">Timestamp</th>
                    <th className="p-3.5 text-center">Records</th>
                    <th className="p-3.5 text-right">Inflow</th>
                    <th className="p-3.5 text-right">Outflow</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#24211d] text-[#f2efe9]">
                  {filteredHistory.map((batch) => (
                    <tr key={batch.id} className="hover:bg-[#1a1714]/60 transition-colors">
                      {/* Batch ID with Copy */}
                      <td className="p-3.5 whitespace-nowrap">
                        <button
                          onClick={() => copyToClipboard(batch.batch_id)}
                          className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-bold transition-colors cursor-pointer group"
                          title="Click to copy batch ID"
                        >
                          <span>{batch.batch_id}</span>
                          {copiedBatchId === batch.batch_id ? (
                            <Check size={11} className="text-[#4cc38a]" />
                          ) : (
                            <Copy size={11} className="opacity-40 group-hover:opacity-100" />
                          )}
                        </button>
                      </td>

                      {/* File Name */}
                      <td className="p-3.5 font-sans font-medium text-white truncate max-w-[180px]">
                        <div className="flex items-center gap-1.5">
                          <FileSpreadsheet size={13} className="text-[#3b82f6] shrink-0" />
                          <span className="truncate">{batch.filename}</span>
                        </div>
                      </td>

                      {/* Destination Account */}
                      <td className="p-3.5 text-[11px] text-[#8c857b] truncate max-w-[140px]">
                        {batch.account}
                      </td>

                      {/* Timestamp */}
                      <td className="p-3.5 text-[11px] text-[#8c857b] whitespace-nowrap">
                        {new Date(batch.created_at).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Total Records */}
                      <td className="p-3.5 text-center font-bold text-white">
                        {batch.total_records}
                      </td>

                      {/* Inflow */}
                      <td className="p-3.5 text-right text-[#4cc38a] font-bold whitespace-nowrap">
                        +{formatINR(batch.inflow_amount)}
                      </td>

                      {/* Outflow */}
                      <td className="p-3.5 text-right text-[#ef6a57] font-bold whitespace-nowrap">
                        -{formatINR(batch.outflow_amount)}
                      </td>

                      {/* Status */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#4cc38a]/10 text-[#4cc38a] border border-[#4cc38a]/20">
                          <CheckCircle2 size={10} />
                          <span>Settled</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to="/transactions"
                            className="p-1.5 rounded-lg text-[#8c857b] hover:text-white hover:bg-[#1a1714] border border-[#24211d] transition-colors"
                            title="View transactions in Ledger"
                          >
                            <ExternalLink size={12} />
                          </Link>
                          <button
                            onClick={() => handleRollbackBatch(batch.batch_id)}
                            disabled={isReadOnly || rollingBackId === batch.batch_id}
                            className="p-1.5 rounded-lg text-[#ef6a57] hover:bg-[#ef6a57]/10 border border-[#24211d] hover:border-[#ef6a57]/30 transition-colors cursor-pointer disabled:opacity-40"
                            title="Rollback batch and delete transactions"
                          >
                            {rollingBackId === batch.batch_id ? (
                              <RefreshCw size={12} className="animate-spin" />
                            ) : (
                              <Trash2 size={12} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Empty History State */
            <div className="p-12 rounded-2xl bg-[#141210] border border-[#24211d] text-center space-y-4 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-[#1a1714] border border-[#24211d] text-[#8c857b] flex items-center justify-center mx-auto">
                <History size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">No Previous Imports Recorded</h3>
                <p className="text-xs text-[#8c857b] max-w-sm mx-auto leading-relaxed">
                  Batch imports committed to PostgreSQL will appear here in the audit log with record counts, inflow/outflow deltas, and rollback options.
                </p>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => setActiveTab('upload')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-xs transition-all cursor-pointer"
                >
                  <UploadCloud size={13} />
                  <span>Upload Your First CSV</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImportPage;
