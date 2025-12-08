import express from 'express';
import { supabaseAdmin } from '../lib/supabaseClient.js';
import { authMiddleware } from '../lib/authMiddleware.js';
import { asyncHandler } from '../lib/errorHandler.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/dashboard/summary - Get summary (total income, expense, net)
router.get('/summary', asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const { startDate, endDate } = req.query;

  let query = supabaseAdmin
    .from('transactions')
    .select('type, amount')
    .eq('user_id', userId);

  if (startDate) {
    query = query.gte('txn_date', startDate);
  }
  if (endDate) {
    query = query.lte('txn_date', endDate);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch summary: ${error.message}`);
  }

  const totalIncome = (data || [])
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const totalExpense = (data || [])
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const net = totalIncome - totalExpense;

  res.json({
    totalIncome,
    totalExpense,
    net,
  });
}));

// GET /api/dashboard/trend - Get income/expense trend over time
router.get('/trend', asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const { startDate, endDate, groupBy = 'month' } = req.query;

  // Validate groupBy
  if (!['day', 'week', 'month'].includes(groupBy)) {
    return res.status(400).json({ error: 'groupBy must be "day", "week", or "month"' });
  }

  let query = supabaseAdmin
    .from('transactions')
    .select('txn_date, type, amount')
    .eq('user_id', userId)
    .order('txn_date', { ascending: true });

  if (startDate) {
    query = query.gte('txn_date', startDate);
  }
  if (endDate) {
    query = query.lte('txn_date', endDate);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch trend data: ${error.message}`);
  }

  // Group transactions by time period
  const grouped = {};
  
  (data || []).forEach(txn => {
    const date = new Date(txn.txn_date);
    let key;
    
    if (groupBy === 'day') {
      key = date.toISOString().split('T')[0];
    } else if (groupBy === 'week') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = weekStart.toISOString().split('T')[0];
    } else { // month
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    if (!grouped[key]) {
      grouped[key] = { period: key, income: 0, expense: 0 };
    }

    const amount = parseFloat(txn.amount || 0);
    if (txn.type === 'income') {
      grouped[key].income += amount;
    } else {
      grouped[key].expense += amount;
    }
  });

  // Convert to array and sort
  const trend = Object.values(grouped).sort((a, b) => a.period.localeCompare(b.period));

  res.json(trend);
}));

// GET /api/dashboard/category-breakdown - Get expense breakdown by category
router.get('/category-breakdown', asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const { startDate, endDate } = req.query;

  let query = supabaseAdmin
    .from('transactions')
    .select(`
      amount,
      category_id,
      categories (
        id,
        name,
        icon,
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
    throw new Error(`Failed to fetch category breakdown: ${error.message}`);
  }

  // Group by category
  const breakdown = {};
  
  (data || []).forEach(txn => {
    const categoryId = txn.category_id || 'uncategorized';
    const categoryName = txn.categories?.name || 'Uncategorized';
    const categoryIcon = txn.categories?.icon || null;
    const categoryColor = txn.categories?.color || null;

    if (!breakdown[categoryId]) {
      breakdown[categoryId] = {
        category_id: categoryId === 'uncategorized' ? null : categoryId,
        category_name: categoryName,
        category_icon: categoryIcon,
        category_color: categoryColor,
        total: 0,
      };
    }

    breakdown[categoryId].total += parseFloat(txn.amount || 0);
  });

  // Convert to array and sort by total descending
  const result = Object.values(breakdown).sort((a, b) => b.total - a.total);

  res.json(result);
}));

export default router;

