import express from 'express';
import { supabaseAdmin } from '../lib/supabaseClient.js';
import { authMiddleware } from '../lib/authMiddleware.js';
import { asyncHandler } from '../lib/errorHandler.js';
import { generateCSV } from '../lib/csvUtils.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/export/csv - Export transactions to CSV
router.get('/csv', asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const {
    startDate,
    endDate,
    type,
    categoryId,
    search,
  } = req.query;

  // Build query (same as GET /api/transactions)
  let query = supabaseAdmin
    .from('transactions')
    .select(`
      *,
      categories (
        name
      )
    `)
    .eq('user_id', userId)
    .order('txn_date', { ascending: false });

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
  if (search) {
    query = query.or(`note.ilike.%${search}%,external_ref.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch transactions: ${error.message}`);
  }

  // Transform to format expected by generateCSV
  const transactions = (data || []).map(txn => ({
    txn_date: txn.txn_date,
    type: txn.type,
    category_name: txn.categories?.name || null,
    amount: txn.amount,
    note: txn.note,
    source: txn.source || 'manual',
  }));

  // Generate CSV
  const csvContent = generateCSV(transactions);

  // Set headers for CSV download
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="transactions-${new Date().toISOString().split('T')[0]}.csv"`);
  
  res.send(csvContent);
}));

export default router;

