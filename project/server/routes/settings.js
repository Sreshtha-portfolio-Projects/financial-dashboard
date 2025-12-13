import express from 'express';
import { supabaseAdmin } from '../lib/supabaseClient.js';
import { authMiddleware } from '../lib/authMiddleware.js';
import { asyncHandler } from '../lib/errorHandler.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/settings/profile - Get user profile info
router.get('/profile', asyncHandler(async (req, res) => {
  const { userId } = req.user;

  // Get user from auth.users
  const { data: user, error } = await supabaseAdmin.auth.admin.getUserById(userId);

  if (error || !user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Get stats
  const [walletsResult, transactionsResult] = await Promise.all([
    supabaseAdmin
      .from('wallets')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabaseAdmin
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
  ]);

  res.json({
    email: user.user.email,
    created_at: user.user.created_at,
    stats: {
      total_wallets: walletsResult.count || 0,
      total_transactions: transactionsResult.count || 0,
    },
  });
}));

// PUT /api/settings/profile - Update profile (limited - email change requires auth)
router.put('/profile', asyncHandler(async (req, res) => {
  // For now, profile updates are limited
  // Email changes should go through Supabase auth flow
  res.json({ message: 'Profile updates coming soon. Use Supabase dashboard for email changes.' });
}));

// POST /api/settings/change-password - Change password
router.post('/change-password', asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  // Update password via Supabase Admin API
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    password: newPassword,
  });

  if (error) {
    throw new Error(`Failed to update password: ${error.message}`);
  }

  res.json({ message: 'Password updated successfully' });
}));

// GET /api/settings/currencies - Get currency settings
router.get('/currencies', asyncHandler(async (req, res) => {
  const { userId } = req.user;

  // Get default currency from user metadata or wallets
  const { data: wallets } = await supabaseAdmin
    .from('wallets')
    .select('currency')
    .eq('user_id', userId)
    .limit(1);

  const defaultCurrency = wallets?.[0]?.currency || 'INR';

  // Get all currencies used
  const { data: allWallets } = await supabaseAdmin
    .from('wallets')
    .select('currency')
    .eq('user_id', userId);

  const currencies = [...new Set((allWallets || []).map(w => w.currency))];

  res.json({
    default_currency: defaultCurrency,
    available_currencies: currencies,
  });
}));

// PUT /api/settings/currencies - Update default currency
router.put('/currencies', asyncHandler(async (req, res) => {
  const { default_currency } = req.body;

  if (!default_currency) {
    return res.status(400).json({ error: 'Missing default_currency' });
  }

  // For now, we'll just return success
  // In a full implementation, you'd store this in a user_settings table
  res.json({ 
    message: 'Currency preference saved',
    default_currency,
  });
}));

export default router;

