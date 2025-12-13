import express from 'express';
import { supabaseAdmin } from '../lib/supabaseClient.js';
import { authMiddleware } from '../lib/authMiddleware.js';
import { asyncHandler } from '../lib/errorHandler.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/analytics/spending-by-category - Spending by category over time
router.get('/spending-by-category', asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const { startDate, endDate, groupBy = 'month' } = req.query;

  let query = supabaseAdmin
    .from('transactions')
    .select(`
      amount,
      type,
      txn_date,
      category_id,
      categories (
        id,
        name,
        color
      )
    `)
    .eq('user_id', userId)
    .eq('type', 'expense');

  if (startDate) {
    query = query.gte('txn_date', startDate);
  }
  if (endDate) {
    query = query.lte('txn_date', endDate);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch transactions: ${error.message}`);
  }

  // Group by period and category
  const grouped = {};
  (data || []).forEach(txn => {
    let period;
    if (groupBy === 'month') {
      period = txn.txn_date.substring(0, 7); // YYYY-MM
    } else if (groupBy === 'week') {
      const date = new Date(txn.txn_date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      period = weekStart.toISOString().split('T')[0].substring(0, 7) + '-W' + 
        Math.ceil((date.getDate() - date.getDay()) / 7);
    } else {
      period = txn.txn_date; // daily
    }

    const categoryName = txn.categories?.name || 'Uncategorized';
    const categoryColor = txn.categories?.color || '#9CA3AF';

    if (!grouped[period]) {
      grouped[period] = {};
    }
    if (!grouped[period][categoryName]) {
      grouped[period][categoryName] = {
        name: categoryName,
        color: categoryColor,
        amount: 0,
      };
    }
    grouped[period][categoryName].amount += parseFloat(txn.amount || 0);
  });

  // Convert to array format
  const result = Object.entries(grouped)
    .map(([period, categories]) => ({
      period,
      categories: Object.values(categories),
    }))
    .sort((a, b) => a.period.localeCompare(b.period));

  res.json(result);
}));

// GET /api/analytics/income-vs-expense - Income vs expense trends
router.get('/income-vs-expense', asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const { startDate, endDate, groupBy = 'month' } = req.query;

  let query = supabaseAdmin
    .from('transactions')
    .select('amount, type, txn_date')
    .eq('user_id', userId);

  if (startDate) {
    query = query.gte('txn_date', startDate);
  }
  if (endDate) {
    query = query.lte('txn_date', endDate);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch transactions: ${error.message}`);
  }

  // Group by period
  const grouped = {};
  (data || []).forEach(txn => {
    let period;
    if (groupBy === 'month') {
      period = txn.txn_date.substring(0, 7);
    } else if (groupBy === 'week') {
      const date = new Date(txn.txn_date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      period = weekStart.toISOString().split('T')[0].substring(0, 7) + '-W' + 
        Math.ceil((date.getDate() - date.getDay()) / 7);
    } else {
      period = txn.txn_date;
    }

    if (!grouped[period]) {
      grouped[period] = { income: 0, expense: 0 };
    }
    if (txn.type === 'income') {
      grouped[period].income += parseFloat(txn.amount || 0);
    } else {
      grouped[period].expense += parseFloat(txn.amount || 0);
    }
  });

  const result = Object.entries(grouped)
    .map(([period, data]) => ({
      period,
      income: data.income,
      expense: data.expense,
      net: data.income - data.expense,
    }))
    .sort((a, b) => a.period.localeCompare(b.period));

  res.json(result);
}));

// GET /api/analytics/top-merchants - Top merchants/notes
router.get('/top-merchants', asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const { startDate, endDate, limit = 10 } = req.query;

  let query = supabaseAdmin
    .from('transactions')
    .select('amount, note')
    .eq('user_id', userId)
    .eq('type', 'expense')
    .not('note', 'is', null);

  if (startDate) {
    query = query.gte('txn_date', startDate);
  }
  if (endDate) {
    query = query.lte('txn_date', endDate);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch transactions: ${error.message}`);
  }

  // Group by note
  const grouped = {};
  (data || []).forEach(txn => {
    const note = txn.note?.trim();
    if (!note) return;

    if (!grouped[note]) {
      grouped[note] = { name: note, amount: 0, count: 0 };
    }
    grouped[note].amount += parseFloat(txn.amount || 0);
    grouped[note].count += 1;
  });

  const result = Object.values(grouped)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, parseInt(limit));

  res.json(result);
}));

// GET /api/analytics/wallet-expense-split - Wallet-wise expense split
router.get('/wallet-expense-split', asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const { startDate, endDate } = req.query;

  let query = supabaseAdmin
    .from('transactions')
    .select(`
      amount,
      wallet_id,
      wallets (
        id,
        name,
        type,
        currency
      )
    `)
    .eq('user_id', userId)
    .eq('type', 'expense')
    .not('wallet_id', 'is', null);

  if (startDate) {
    query = query.gte('txn_date', startDate);
  }
  if (endDate) {
    query = query.lte('txn_date', endDate);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch transactions: ${error.message}`);
  }

  // Group by wallet
  const grouped = {};
  (data || []).forEach(txn => {
    const walletName = txn.wallets?.name || 'Unknown';
    const walletId = txn.wallet_id;

    if (!grouped[walletId]) {
      grouped[walletId] = {
        wallet_id: walletId,
        wallet_name: walletName,
        wallet_type: txn.wallets?.type || null,
        wallet_currency: txn.wallets?.currency || null,
        amount: 0,
        count: 0,
      };
    }
    grouped[walletId].amount += parseFloat(txn.amount || 0);
    grouped[walletId].count += 1;
  });

  const total = Object.values(grouped).reduce((sum, w) => sum + w.amount, 0);

  const result = Object.values(grouped).map(wallet => ({
    ...wallet,
    percentage: total > 0 ? (wallet.amount / total) * 100 : 0,
  })).sort((a, b) => b.amount - a.amount);

  res.json(result);
}));

export default router;

