import express from 'express';
import { supabaseAdmin } from '../lib/supabaseClient.js';
import { authMiddleware } from '../lib/authMiddleware.js';
import { asyncHandler } from '../lib/errorHandler.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/wallets - Get all wallets for user
router.get('/', asyncHandler(async (req, res) => {
  const { userId } = req.user;

  const { data, error } = await supabaseAdmin
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch wallets: ${error.message}`);
  }

  res.json(data || []);
}));

// GET /api/wallets/:id - Get single wallet
router.get('/:id', asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;

  const { data, error } = await supabaseAdmin
    .from('wallets')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: 'Wallet not found' });
  }

  res.json(data);
}));

// POST /api/wallets - Create new wallet
router.post('/', asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const { name, type, balance, currency } = req.body;

  if (!name || !type) {
    return res.status(400).json({ error: 'Missing required fields: name, type' });
  }

  const validTypes = ['bank', 'card', 'cash', 'wallet'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: `Invalid type. Must be one of: ${validTypes.join(', ')}` });
  }

  const { data, error } = await supabaseAdmin
    .from('wallets')
    .insert({
      user_id: userId,
      name: name.trim(),
      type,
      balance: parseFloat(balance || 0),
      currency: currency || 'INR',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create wallet: ${error.message}`);
  }

  res.status(201).json(data);
}));

// PUT /api/wallets/:id - Update wallet
router.put('/:id', asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;
  const { name, type, balance, currency } = req.body;

  // Verify wallet belongs to user
  const { data: existing, error: fetchError } = await supabaseAdmin
    .from('wallets')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (fetchError || !existing) {
    return res.status(404).json({ error: 'Wallet not found' });
  }

  const updateData = {};
  if (name !== undefined) updateData.name = name.trim();
  if (type !== undefined) {
    const validTypes = ['bank', 'card', 'cash', 'wallet'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: `Invalid type. Must be one of: ${validTypes.join(', ')}` });
    }
    updateData.type = type;
  }
  if (balance !== undefined) {
    const balanceNum = parseFloat(balance);
    if (balanceNum < 0) {
      return res.status(400).json({ error: 'Balance must be non-negative' });
    }
    updateData.balance = balanceNum;
  }
  if (currency !== undefined) updateData.currency = currency;

  const { data, error } = await supabaseAdmin
    .from('wallets')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update wallet: ${error.message}`);
  }

  res.json(data);
}));

// DELETE /api/wallets/:id - Delete wallet
router.delete('/:id', asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;

  // Verify wallet belongs to user
  const { data: existing, error: fetchError } = await supabaseAdmin
    .from('wallets')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (fetchError || !existing) {
    return res.status(404).json({ error: 'Wallet not found' });
  }

  const { error } = await supabaseAdmin
    .from('wallets')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete wallet: ${error.message}`);
  }

  res.status(204).send();
}));

// GET /api/wallets/:id/summary - Get wallet summary
router.get('/:id/summary', asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;
  const { startDate, endDate } = req.query;

  // Verify wallet belongs to user
  const { data: wallet, error: walletError } = await supabaseAdmin
    .from('wallets')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (walletError || !wallet) {
    return res.status(404).json({ error: 'Wallet not found' });
  }

  // Get transactions for this wallet
  let query = supabaseAdmin
    .from('transactions')
    .select('amount, type, txn_date')
    .eq('user_id', userId)
    .eq('wallet_id', id);

  if (startDate) {
    query = query.gte('txn_date', startDate);
  }
  if (endDate) {
    query = query.lte('txn_date', endDate);
  }

  const { data: transactions, error: txnError } = await query;

  if (txnError) {
    throw new Error(`Failed to fetch transactions: ${txnError.message}`);
  }

  // Calculate totals
  const totalIncome = (transactions || [])
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const totalExpense = (transactions || [])
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  // Group by month for trend
  const monthlyData = {};
  (transactions || []).forEach(txn => {
    const month = txn.txn_date.substring(0, 7); // YYYY-MM
    if (!monthlyData[month]) {
      monthlyData[month] = { income: 0, expense: 0 };
    }
    if (txn.type === 'income') {
      monthlyData[month].income += parseFloat(txn.amount || 0);
    } else {
      monthlyData[month].expense += parseFloat(txn.amount || 0);
    }
  });

  const trend = Object.entries(monthlyData)
    .map(([period, data]) => ({
      period,
      income: data.income,
      expense: data.expense,
    }))
    .sort((a, b) => a.period.localeCompare(b.period));

  res.json({
    wallet,
    summary: {
      total_income: totalIncome,
      total_expense: totalExpense,
      net_change: totalIncome - totalExpense,
      transaction_count: (transactions || []).length,
    },
    trend,
  });
}));

// GET /api/wallets/:id/transactions - Get transactions for wallet
router.get('/:id/transactions', asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;
  const { startDate, endDate, type, limit = 100 } = req.query;

  // Verify wallet belongs to user
  const { error: walletError } = await supabaseAdmin
    .from('wallets')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (walletError) {
    return res.status(404).json({ error: 'Wallet not found' });
  }

  let query = supabaseAdmin
    .from('transactions')
    .select(`
      *,
      categories (
        id,
        name,
        icon,
        color
      )
    `)
    .eq('user_id', userId)
    .eq('wallet_id', id)
    .order('txn_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(parseInt(limit));

  if (startDate) {
    query = query.gte('txn_date', startDate);
  }
  if (endDate) {
    query = query.lte('txn_date', endDate);
  }
  if (type && (type === 'income' || type === 'expense')) {
    query = query.eq('type', type);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch transactions: ${error.message}`);
  }

  // Transform data
  const transactions = (data || []).map(txn => ({
    ...txn,
    category_name: txn.categories?.name || null,
    category_icon: txn.categories?.icon || null,
    category_color: txn.categories?.color || null,
    categories: undefined,
  }));

  res.json(transactions);
}));

export default router;

