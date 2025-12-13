import express from 'express';
import { supabaseAdmin } from '../lib/supabaseClient.js';
import { authMiddleware } from '../lib/authMiddleware.js';
import { asyncHandler } from '../lib/errorHandler.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Helper function to calculate budget spent
async function calculateBudgetSpent(userId, categoryId, startDate, endDate) {
  let query = supabaseAdmin
    .from('transactions')
    .select('amount')
    .eq('user_id', userId)
    .eq('type', 'expense')
    .eq('category_id', categoryId)
    .gte('txn_date', startDate);

  if (endDate) {
    query = query.lte('txn_date', endDate);
  }

  const { data, error } = await query;

  if (error) {
    return 0;
  }

  return (data || []).reduce((sum, txn) => sum + parseFloat(txn.amount || 0), 0);
}

// GET /api/budgets - Get all budgets for user
router.get('/', asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const { active } = req.query; // Filter active budgets only

  let query = supabaseAdmin
    .from('budgets')
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
    .order('created_at', { ascending: false });

  if (active === 'true') {
    const today = new Date().toISOString().split('T')[0];
    query = query.or(`end_date.is.null,end_date.gte.${today}`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch budgets: ${error.message}`);
  }

  // Calculate spent amounts for each budget
  const budgetsWithSpent = await Promise.all(
    (data || []).map(async (budget) => {
      const today = new Date();
      let periodStart, periodEnd;

      if (budget.period === 'monthly') {
        periodStart = new Date(today.getFullYear(), today.getMonth(), 1)
          .toISOString().split('T')[0];
        periodEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
          .toISOString().split('T')[0];
      } else if (budget.period === 'weekly') {
        const dayOfWeek = today.getDay();
        const diff = today.getDate() - dayOfWeek;
        periodStart = new Date(today.setDate(diff))
          .toISOString().split('T')[0];
        periodEnd = new Date(today.setDate(diff + 6))
          .toISOString().split('T')[0];
      } else {
        // custom
        periodStart = budget.start_date;
        periodEnd = budget.end_date || null;
      }

      const spent = await calculateBudgetSpent(
        userId,
        budget.category_id,
        periodStart,
        periodEnd
      );

      // Calculate last period spent
      let lastPeriodStart, lastPeriodEnd;
      if (budget.period === 'monthly') {
        lastPeriodStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
          .toISOString().split('T')[0];
        lastPeriodEnd = new Date(today.getFullYear(), today.getMonth(), 0)
          .toISOString().split('T')[0];
      } else if (budget.period === 'weekly') {
        const dayOfWeek = today.getDay();
        const diff = today.getDate() - dayOfWeek - 7;
        lastPeriodStart = new Date(today.setDate(diff))
          .toISOString().split('T')[0];
        lastPeriodEnd = new Date(today.setDate(diff + 6))
          .toISOString().split('T')[0];
      }

      const lastPeriodSpent = lastPeriodStart
        ? await calculateBudgetSpent(
            userId,
            budget.category_id,
            lastPeriodStart,
            lastPeriodEnd
          )
        : 0;

      const remaining = parseFloat(budget.amount) - spent;
      const percentageUsed = parseFloat(budget.amount) > 0
        ? (spent / parseFloat(budget.amount)) * 100
        : 0;

      return {
        ...budget,
        category_name: budget.categories?.name || null,
        category_icon: budget.categories?.icon || null,
        category_color: budget.categories?.color || null,
        categories: undefined,
        spent,
        last_period_spent: lastPeriodSpent,
        remaining,
        percentage_used: percentageUsed,
        is_over_budget: spent > parseFloat(budget.amount),
      };
    })
  );

  res.json(budgetsWithSpent);
}));

// GET /api/budgets/:id - Get single budget
router.get('/:id', asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;

  const { data, error } = await supabaseAdmin
    .from('budgets')
    .select(`
      *,
      categories (
        id,
        name,
        icon,
        color
      )
    `)
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: 'Budget not found' });
  }

  // Calculate spent
  const today = new Date();
  let periodStart, periodEnd;

  if (data.period === 'monthly') {
    periodStart = new Date(today.getFullYear(), today.getMonth(), 1)
      .toISOString().split('T')[0];
    periodEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      .toISOString().split('T')[0];
  } else if (data.period === 'weekly') {
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek;
    periodStart = new Date(today.setDate(diff))
      .toISOString().split('T')[0];
    periodEnd = new Date(today.setDate(diff + 6))
      .toISOString().split('T')[0];
  } else {
    periodStart = data.start_date;
    periodEnd = data.end_date || null;
  }

  const spent = await calculateBudgetSpent(
    userId,
    data.category_id,
    periodStart,
    periodEnd
  );

  const remaining = parseFloat(data.amount) - spent;
  const percentageUsed = parseFloat(data.amount) > 0
    ? (spent / parseFloat(data.amount)) * 100
    : 0;

  res.json({
    ...data,
    category_name: data.categories?.name || null,
    category_icon: data.categories?.icon || null,
    category_color: data.categories?.color || null,
    categories: undefined,
    spent,
    remaining,
    percentage_used: percentageUsed,
    is_over_budget: spent > parseFloat(data.amount),
  });
}));

// POST /api/budgets - Create new budget
router.post('/', asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const { category_id, amount, period, start_date, end_date } = req.body;

  if (!category_id || !amount || !period || !start_date) {
    return res.status(400).json({ 
      error: 'Missing required fields: category_id, amount, period, start_date' 
    });
  }

  const validPeriods = ['monthly', 'weekly', 'custom'];
  if (!validPeriods.includes(period)) {
    return res.status(400).json({ 
      error: `Invalid period. Must be one of: ${validPeriods.join(', ')}` 
    });
  }

  // Verify category belongs to user
  const { data: category, error: catError } = await supabaseAdmin
    .from('categories')
    .select('id')
    .eq('id', category_id)
    .eq('user_id', userId)
    .single();

  if (catError || !category) {
    return res.status(404).json({ error: 'Category not found' });
  }

  const { data, error } = await supabaseAdmin
    .from('budgets')
    .insert({
      user_id: userId,
      category_id,
      amount: parseFloat(amount),
      period,
      start_date,
      end_date: end_date || null,
    })
    .select(`
      *,
      categories (
        id,
        name,
        icon,
        color
      )
    `)
    .single();

  if (error) {
    throw new Error(`Failed to create budget: ${error.message}`);
  }

  res.status(201).json({
    ...data,
    category_name: data.categories?.name || null,
    category_icon: data.categories?.icon || null,
    category_color: data.categories?.color || null,
    categories: undefined,
    spent: 0,
    remaining: parseFloat(data.amount),
    percentage_used: 0,
    is_over_budget: false,
  });
}));

// PUT /api/budgets/:id - Update budget
router.put('/:id', asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;
  const { category_id, amount, period, start_date, end_date } = req.body;

  // Verify budget belongs to user
  const { data: existing, error: fetchError } = await supabaseAdmin
    .from('budgets')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (fetchError || !existing) {
    return res.status(404).json({ error: 'Budget not found' });
  }

  const updateData = {};
  if (category_id !== undefined) {
    // Verify category belongs to user
    const { data: category, error: catError } = await supabaseAdmin
      .from('categories')
      .select('id')
      .eq('id', category_id)
      .eq('user_id', userId)
      .single();

    if (catError || !category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    updateData.category_id = category_id;
  }
  if (amount !== undefined) {
    if (parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }
    updateData.amount = parseFloat(amount);
  }
  if (period !== undefined) {
    const validPeriods = ['monthly', 'weekly', 'custom'];
    if (!validPeriods.includes(period)) {
      return res.status(400).json({ 
        error: `Invalid period. Must be one of: ${validPeriods.join(', ')}` 
      });
    }
    updateData.period = period;
  }
  if (start_date !== undefined) updateData.start_date = start_date;
  if (end_date !== undefined) updateData.end_date = end_date || null;

  const { data, error } = await supabaseAdmin
    .from('budgets')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', userId)
    .select(`
      *,
      categories (
        id,
        name,
        icon,
        color
      )
    `)
    .single();

  if (error) {
    throw new Error(`Failed to update budget: ${error.message}`);
  }

  // Recalculate spent
  const today = new Date();
  let periodStart, periodEnd;

  if (data.period === 'monthly') {
    periodStart = new Date(today.getFullYear(), today.getMonth(), 1)
      .toISOString().split('T')[0];
    periodEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      .toISOString().split('T')[0];
  } else if (data.period === 'weekly') {
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek;
    periodStart = new Date(today.setDate(diff))
      .toISOString().split('T')[0];
    periodEnd = new Date(today.setDate(diff + 6))
      .toISOString().split('T')[0];
  } else {
    periodStart = data.start_date;
    periodEnd = data.end_date || null;
  }

  const spent = await calculateBudgetSpent(
    userId,
    data.category_id,
    periodStart,
    periodEnd
  );

  const remaining = parseFloat(data.amount) - spent;
  const percentageUsed = parseFloat(data.amount) > 0
    ? (spent / parseFloat(data.amount)) * 100
    : 0;

  res.json({
    ...data,
    category_name: data.categories?.name || null,
    category_icon: data.categories?.icon || null,
    category_color: data.categories?.color || null,
    categories: undefined,
    spent,
    remaining,
    percentage_used: percentageUsed,
    is_over_budget: spent > parseFloat(data.amount),
  });
}));

// DELETE /api/budgets/:id - Delete budget
router.delete('/:id', asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;

  // Verify budget belongs to user
  const { data: existing, error: fetchError } = await supabaseAdmin
    .from('budgets')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (fetchError || !existing) {
    return res.status(404).json({ error: 'Budget not found' });
  }

  const { error } = await supabaseAdmin
    .from('budgets')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete budget: ${error.message}`);
  }

  res.status(204).send();
}));

export default router;

