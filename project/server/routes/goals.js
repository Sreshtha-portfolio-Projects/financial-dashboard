import express from 'express';
import { supabaseAdmin } from '../lib/supabaseClient.js';
import { authMiddleware } from '../lib/authMiddleware.js';
import { asyncHandler } from '../lib/errorHandler.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/goals - Get all goals for user
router.get('/', asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const { active } = req.query; // Filter active goals only

  let query = supabaseAdmin
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (active === 'true') {
    const today = new Date().toISOString().split('T')[0];
    query = query.or(`deadline.is.null,deadline.gte.${today}`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch goals: ${error.message}`);
  }

  // Calculate completion metrics
  const goalsWithMetrics = (data || []).map(goal => {
    const target = parseFloat(goal.target_amount);
    const current = parseFloat(goal.current_amount || 0);
    const remaining = target - current;
    const percentage = target > 0 ? (current / target) * 100 : 0;
    const isCompleted = current >= target;

    // Estimate completion time (if spending rate can be calculated)
    let estimatedCompletion = null;
    if (goal.deadline && !isCompleted && remaining > 0) {
      const deadlineDate = new Date(goal.deadline);
      const today = new Date();
      const daysRemaining = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
      estimatedCompletion = daysRemaining > 0 ? daysRemaining : 0;
    }

    return {
      ...goal,
      remaining,
      percentage: Math.min(percentage, 100),
      is_completed: isCompleted,
      estimated_completion_days: estimatedCompletion,
    };
  });

  res.json(goalsWithMetrics);
}));

// GET /api/goals/:id - Get single goal with allocations
router.get('/:id', asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;

  const { data: goal, error: goalError } = await supabaseAdmin
    .from('goals')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (goalError || !goal) {
    return res.status(404).json({ error: 'Goal not found' });
  }

  // Get allocations
  const { data: allocations, error: allocError } = await supabaseAdmin
    .from('goal_allocations')
    .select(`
      *,
      wallets (
        id,
        name,
        type,
        currency
      )
    `)
    .eq('goal_id', id);

  if (allocError) {
    throw new Error(`Failed to fetch allocations: ${allocError.message}`);
  }

  const target = parseFloat(goal.target_amount);
  const current = parseFloat(goal.current_amount || 0);
  const remaining = target - current;
  const percentage = target > 0 ? (current / target) * 100 : 0;

  res.json({
    ...goal,
    remaining,
    percentage: Math.min(percentage, 100),
    is_completed: current >= target,
    allocations: (allocations || []).map(alloc => ({
      ...alloc,
      wallet_name: alloc.wallets?.name || null,
      wallet_type: alloc.wallets?.type || null,
      wallet_currency: alloc.wallets?.currency || null,
      wallets: undefined,
    })),
  });
}));

// POST /api/goals - Create new goal
router.post('/', asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const { name, type, target_amount, current_amount, deadline } = req.body;

  if (!name || !type || !target_amount) {
    return res.status(400).json({ 
      error: 'Missing required fields: name, type, target_amount' 
    });
  }

  const validTypes = ['savings', 'debt', 'tax', 'investment'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ 
      error: `Invalid type. Must be one of: ${validTypes.join(', ')}` 
    });
  }

  if (parseFloat(target_amount) <= 0) {
    return res.status(400).json({ error: 'Target amount must be greater than 0' });
  }

  const { data, error } = await supabaseAdmin
    .from('goals')
    .insert({
      user_id: userId,
      name: name.trim(),
      type,
      target_amount: parseFloat(target_amount),
      current_amount: parseFloat(current_amount || 0),
      deadline: deadline || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create goal: ${error.message}`);
  }

  const target = parseFloat(data.target_amount);
  const current = parseFloat(data.current_amount || 0);
  const remaining = target - current;
  const percentage = target > 0 ? (current / target) * 100 : 0;

  res.status(201).json({
    ...data,
    remaining,
    percentage: Math.min(percentage, 100),
    is_completed: current >= target,
  });
}));

// PUT /api/goals/:id - Update goal
router.put('/:id', asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;
  const { name, type, target_amount, current_amount, deadline } = req.body;

  // Verify goal belongs to user
  const { data: existing, error: fetchError } = await supabaseAdmin
    .from('goals')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (fetchError || !existing) {
    return res.status(404).json({ error: 'Goal not found' });
  }

  const updateData = {};
  if (name !== undefined) updateData.name = name.trim();
  if (type !== undefined) {
    const validTypes = ['savings', 'debt', 'tax', 'investment'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        error: `Invalid type. Must be one of: ${validTypes.join(', ')}` 
      });
    }
    updateData.type = type;
  }
  if (target_amount !== undefined) {
    if (parseFloat(target_amount) <= 0) {
      return res.status(400).json({ error: 'Target amount must be greater than 0' });
    }
    updateData.target_amount = parseFloat(target_amount);
  }
  if (current_amount !== undefined) {
    const current = parseFloat(current_amount);
    if (current < 0) {
      return res.status(400).json({ error: 'Current amount must be non-negative' });
    }
    updateData.current_amount = current;
  }
  if (deadline !== undefined) updateData.deadline = deadline || null;

  const { data, error } = await supabaseAdmin
    .from('goals')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update goal: ${error.message}`);
  }

  const target = parseFloat(data.target_amount);
  const current = parseFloat(data.current_amount || 0);
  const remaining = target - current;
  const percentage = target > 0 ? (current / target) * 100 : 0;

  res.json({
    ...data,
    remaining,
    percentage: Math.min(percentage, 100),
    is_completed: current >= target,
  });
}));

// DELETE /api/goals/:id - Delete goal
router.delete('/:id', asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;

  // Verify goal belongs to user
  const { data: existing, error: fetchError } = await supabaseAdmin
    .from('goals')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (fetchError || !existing) {
    return res.status(404).json({ error: 'Goal not found' });
  }

  const { error } = await supabaseAdmin
    .from('goals')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete goal: ${error.message}`);
  }

  res.status(204).send();
}));

// POST /api/goals/:id/allocations - Add allocation to goal
router.post('/:id/allocations', asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;
  const { wallet_id, amount } = req.body;

  if (!wallet_id || !amount) {
    return res.status(400).json({ error: 'Missing required fields: wallet_id, amount' });
  }

  // Verify goal belongs to user
  const { data: goal, error: goalError } = await supabaseAdmin
    .from('goals')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (goalError || !goal) {
    return res.status(404).json({ error: 'Goal not found' });
  }

  // Verify wallet belongs to user
  const { data: wallet, error: walletError } = await supabaseAdmin
    .from('wallets')
    .select('id')
    .eq('id', wallet_id)
    .eq('user_id', userId)
    .single();

  if (walletError || !wallet) {
    return res.status(404).json({ error: 'Wallet not found' });
  }

  const { data, error } = await supabaseAdmin
    .from('goal_allocations')
    .insert({
      goal_id: id,
      wallet_id,
      amount: parseFloat(amount),
    })
    .select(`
      *,
      wallets (
        id,
        name,
        type,
        currency
      )
    `)
    .single();

  if (error) {
    throw new Error(`Failed to create allocation: ${error.message}`);
  }

  res.status(201).json({
    ...data,
    wallet_name: data.wallets?.name || null,
    wallet_type: data.wallets?.type || null,
    wallet_currency: data.wallets?.currency || null,
    wallets: undefined,
  });
}));

// DELETE /api/goals/:id/allocations/:allocationId - Remove allocation
router.delete('/:id/allocations/:allocationId', asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const { id, allocationId } = req.params;

  // Verify goal belongs to user
  const { data: goal, error: goalError } = await supabaseAdmin
    .from('goals')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (goalError || !goal) {
    return res.status(404).json({ error: 'Goal not found' });
  }

  const { error } = await supabaseAdmin
    .from('goal_allocations')
    .delete()
    .eq('id', allocationId)
    .eq('goal_id', id);

  if (error) {
    throw new Error(`Failed to delete allocation: ${error.message}`);
  }

  res.status(204).send();
}));

export default router;

