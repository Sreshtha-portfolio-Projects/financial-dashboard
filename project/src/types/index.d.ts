export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string | null;
  amount: number;
  type: TransactionType;
  txn_date: string;
  note: string | null;
  source: string;
  external_ref: string | null;
  created_at: string;
  updated_at: string;
  category_name?: string | null;
  category_icon?: string | null;
  category_color?: string | null;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon: string | null;
  color: string | null;
  created_at: string;
}

export interface ImportBatch {
  id: string;
  user_id: string;
  source: string;
  original_file_path: string | null;
  status: 'pending' | 'completed' | 'failed' | 'partial';
  total_rows: number | null;
  success_rows: number | null;
  failed_rows: number | null;
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
}

export interface DashboardSummary {
  totalIncome: number;
  totalExpense: number;
  net: number;
}

export interface TrendDataPoint {
  period: string;
  income: number;
  expense: number;
}

export interface CategoryBreakdown {
  category_id: string | null;
  category_name: string;
  category_icon: string | null;
  category_color: string | null;
  total: number;
}

export interface Filters {
  startDate: string | null;
  endDate: string | null;
  type: 'all' | 'income' | 'expense';
  categoryId: string | null;
  search: string;
}

