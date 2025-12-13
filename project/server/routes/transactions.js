import express from 'express';
import { supabaseAdmin } from '../lib/supabaseClient.js';
import { authMiddleware } from '../lib/authMiddleware.js';
import { asyncHandler } from '../lib/errorHandler.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/transactions - Get transactions with optional filters
router.get('/', asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const {
    startDate,
    endDate,
    type,
    categoryId,
    search,
  } = req.query;

  // Build query
  let query = supabaseAdmin
    .from('transactions')
    .select(`
      *,
      categories (
        id,
        name,
        icon,
        color
      ),
      wallets (
        id,
        name,
        type,
        currency
      )
    `)
    .eq('user_id', userId)
    .order('txn_date', { ascending: false })
    .order('created_at', { ascending: false });

  // Apply filters
  if (startDate) {
    query = query.gte('txn_date', startDate);
  }
  if (endDate) {
    query = query.lte('txn_date', endDate);
  }
  if (type && (type === 'income' || type === 'expense')) {
    query = query.eq('type', type);
  }
  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }
  if (walletId) {
    query = query.eq('wallet_id', walletId);
  }
  if (search) {
    query = query.or(`note.ilike.%${search}%,external_ref.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch transactions: ${error.message}`);
  }

  // Transform data to include category and wallet info
  const transactions = data.map(txn => ({
    ...txn,
    category_name: txn.categories?.name || null,
    category_icon: txn.categories?.icon || null,
    category_color: txn.categories?.color || null,
    wallet_name: txn.wallets?.name || null,
    wallet_type: txn.wallets?.type || null,
    wallet_currency: txn.wallets?.currency || null,
    categories: undefined, // Remove nested object
    wallets: undefined, // Remove nested object
  }));

  res.json(transactions);
}));

// POST /api/transactions - Create new transaction
router.post('/', asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const {
    amount,
    type,
    txn_date,
    category_id,
    wallet_id,
    note,
    source = 'manual',
  } = req.body;

  // Validation
  if (!amount || !type || !txn_date) {
    return res.status(400).json({ error: 'Missing required fields: amount, type, txn_date' });
  }

  if (type !== 'income' && type !== 'expense') {
    return res.status(400).json({ error: 'Type must be "income" or "expense"' });
  }

  if (parseFloat(amount) < 0) {
    return res.status(400).json({ error: 'Amount must be non-negative' });
  }

  // Verify wallet belongs to user if provided
  if (wallet_id) {
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from('wallets')
      .select('id')
      .eq('id', wallet_id)
      .eq('user_id', userId)
      .single();

    if (walletError || !wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }
  }

  const { data, error } = await supabaseAdmin
    .from('transactions')
    .insert({
      user_id: userId,
      amount: parseFloat(amount),
      type,
      txn_date,
      category_id: category_id || null,
      wallet_id: wallet_id || null,
      note: note || null,
      source,
    })
    .select(`
      *,
      categories (
        id,
        name,
        icon,
        color
      ),
      wallets (
        id,
        name,
        type,
        currency
      )
    `)
    .single();

  if (error) {
    throw new Error(`Failed to create transaction: ${error.message}`);
  }

  const transaction = {
    ...data,
    category_name: data.categories?.name || null,
    category_icon: data.categories?.icon || null,
    category_color: data.categories?.color || null,
    wallet_name: data.wallets?.name || null,
    wallet_type: data.wallets?.type || null,
    wallet_currency: data.wallets?.currency || null,
    categories: undefined,
    wallets: undefined,
  };

  res.status(201).json(transaction);
}));

// PUT /api/transactions/:id - Update transaction
router.put('/:id', asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;
  const {
    amount,
    type,
    txn_date,
    category_id,
    wallet_id,
    note,
  } = req.body;

  // First verify the transaction belongs to the user
  const { data: existing, error: fetchError } = await supabaseAdmin
    .from('transactions')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (fetchError || !existing) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  // Build update object
  const updateData = {};
  if (amount !== undefined) {
    if (parseFloat(amount) < 0) {
      return res.status(400).json({ error: 'Amount must be non-negative' });
    }
    updateData.amount = parseFloat(amount);
  }
  if (type !== undefined) {
    if (type !== 'income' && type !== 'expense') {
      return res.status(400).json({ error: 'Type must be "income" or "expense"' });
    }
    updateData.type = type;
  }
  if (txn_date !== undefined) updateData.txn_date = txn_date;
  if (category_id !== undefined) updateData.category_id = category_id || null;
  if (wallet_id !== undefined) {
    // Verify wallet belongs to user if provided
    if (wallet_id) {
      const { data: wallet, error: walletError } = await supabaseAdmin
        .from('wallets')
        .select('id')
        .eq('id', wallet_id)
        .eq('user_id', userId)
        .single();

      if (walletError || !wallet) {
        return res.status(404).json({ error: 'Wallet not found' });
      }
    }
    updateData.wallet_id = wallet_id || null;
  }
  if (note !== undefined) updateData.note = note || null;

  const { data, error } = await supabaseAdmin
    .from('transactions')
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
      ),
      wallets (
        id,
        name,
        type,
        currency
      )
    `)
    .single();

  if (error) {
    throw new Error(`Failed to update transaction: ${error.message}`);
  }

  const transaction = {
    ...data,
    category_name: data.categories?.name || null,
    category_icon: data.categories?.icon || null,
    category_color: data.categories?.color || null,
    wallet_name: data.wallets?.name || null,
    wallet_type: data.wallets?.type || null,
    wallet_currency: data.wallets?.currency || null,
    categories: undefined,
    wallets: undefined,
  };

  res.json(transaction);
}));

// DELETE /api/transactions/:id - Delete transaction
router.delete('/:id', asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;

  const { error } = await supabaseAdmin
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete transaction: ${error.message}`);
  }

  res.status(204).send();
}));

export default router;

