export type UserRole = 'admin' | 'user' | 'read-only';

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  created_at?: string;
  transaction_count?: number;
  total_income?: number;
  total_expense?: number;
}

export interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
}

export interface Account {
  id: number;
  user_id: number;
  name: string;
  category: string;
  currency: string;
  initial_balance: number;
  credit_limit: number;
  default_payment_type: string;
  group_name: string;
  color?: string;
  icon?: string;
  current_balance: number;
  transaction_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface AccountsSummary {
  totalBalance: number;
  assets: number;
  liabilities: number;
  vehicles: number;
  accountCount: number;
}

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: number;
  user_id: number;
  user_name?: string;
  user_email?: string;
  category_id: number | null;
  category_name: string | null;
  category_color: string | null;
  category_icon: string | null;
  type: TransactionType;
  amount: number;
  currency?: string;
  exchange_rate?: number;
  amount_inr?: number;
  date: string;
  description: string;
  account?: string;
  to_account?: string | null;
  payee?: string | null;
  tags?: string[];
  payment_type?: string;
  note?: string | null;
  external_url?: string | null;
  external_ref?: string | null;
  location?: string | null;
  exclude_from_stats?: boolean;
  created_at?: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AnalyticsOverview {
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsRate: number;
  transactionCount: number;
  year?: number;
  month?: number | null;
}

export interface CategoryBreakdown {
  category_name: string;
  color: string;
  icon: string;
  total_amount: number;
  count: number;
}

export interface MonthlyTrend {
  month_str: string;
  display_name: string;
  income: number;
  expense: number;
  net: number;
}
