-- Personal Finance Dashboard Database Schema
-- Run this in your Supabase SQL Editor

-- Create enum for transaction types
CREATE TYPE transaction_type AS ENUM ('income', 'expense');

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT,
    color TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    type transaction_type NOT NULL,
    txn_date DATE NOT NULL,
    note TEXT,
    source TEXT DEFAULT 'manual',
    external_ref TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create import_batches table
CREATE TABLE IF NOT EXISTS public.import_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source TEXT NOT NULL,
    original_file_path TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    total_rows INT,
    success_rows INT,
    failed_rows INT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    error_message TEXT
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, txn_date);
CREATE INDEX IF NOT EXISTS idx_transactions_user_type ON public.transactions(user_id, type);
CREATE INDEX IF NOT EXISTS idx_categories_user ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_import_batches_user ON public.import_batches(user_id);

-- Enable Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categories
CREATE POLICY "Users can view their own categories"
    ON public.categories FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories"
    ON public.categories FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
    ON public.categories FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
    ON public.categories FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for transactions
CREATE POLICY "Users can view their own transactions"
    ON public.transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
    ON public.transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
    ON public.transactions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions"
    ON public.transactions FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for import_batches
CREATE POLICY "Users can view their own import batches"
    ON public.import_batches FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own import batches"
    ON public.import_batches FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own import batches"
    ON public.import_batches FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own import batches"
    ON public.import_batches FOR DELETE
    USING (auth.uid() = user_id);

-- Create view for monthly summary
CREATE OR REPLACE VIEW public.v_monthly_summary AS
SELECT
    user_id,
    DATE_TRUNC('month', txn_date) AS month,
    COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS total_income,
    COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expense
FROM public.transactions
GROUP BY user_id, DATE_TRUNC('month', txn_date);

-- Create view for category monthly summary
CREATE OR REPLACE VIEW public.v_category_monthly_summary AS
SELECT
    t.user_id,
    DATE_TRUNC('month', t.txn_date) AS month,
    COALESCE(c.name, 'Uncategorized') AS category_name,
    SUM(t.amount) AS category_expense
FROM public.transactions t
LEFT JOIN public.categories c ON t.category_id = c.id
WHERE t.type = 'expense'
GROUP BY t.user_id, DATE_TRUNC('month', t.txn_date), c.name;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for transactions updated_at
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

