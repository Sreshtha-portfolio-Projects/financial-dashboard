import express from 'express';
import { supabaseAdmin } from '../lib/supabaseClient.js';
import { authMiddleware } from '../lib/authMiddleware.js';
import { asyncHandler } from '../lib/errorHandler.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/categories - Get all categories for user
router.get('/', asyncHandler(async (req, res) => {
  const { userId } = req.user;

  const { data, error } = await supabaseAdmin
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch categories: ${error.message}`);
  }

  res.json(data || []);
}));

// POST /api/categories - Create new category
router.post('/', asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const { name, icon, color } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Category name is required' });
  }

  // Check if category with same name already exists for user
  const { data: existing } = await supabaseAdmin
    .from('categories')
    .select('id')
    .eq('user_id', userId)
    .eq('name', name.trim())
    .single();

  if (existing) {
    return res.status(400).json({ error: 'Category with this name already exists' });
  }

  const { data, error } = await supabaseAdmin
    .from('categories')
    .insert({
      user_id: userId,
      name: name.trim(),
      icon: icon || null,
      color: color || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create category: ${error.message}`);
  }

  res.status(201).json(data);
}));

// PUT /api/categories/:id - Update category
router.put('/:id', asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;
  const { name, icon, color } = req.body;

  // Verify category belongs to user
  const { data: existing, error: fetchError } = await supabaseAdmin
    .from('categories')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (fetchError || !existing) {
    return res.status(404).json({ error: 'Category not found' });
  }

  // If name is being changed, check for duplicates
  if (name && name.trim() !== existing.name) {
    const { data: duplicate } = await supabaseAdmin
      .from('categories')
      .select('id')
      .eq('user_id', userId)
      .eq('name', name.trim())
      .single();

    if (duplicate) {
      return res.status(400).json({ error: 'Category with this name already exists' });
    }
  }

  const updateData = {};
  if (name !== undefined) updateData.name = name.trim();
  if (icon !== undefined) updateData.icon = icon || null;
  if (color !== undefined) updateData.color = color || null;

  const { data, error } = await supabaseAdmin
    .from('categories')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update category: ${error.message}`);
  }

  res.json(data);
}));

// DELETE /api/categories/:id - Delete category
router.delete('/:id', asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;

  // Verify category belongs to user
  const { data: existing, error: fetchError } = await supabaseAdmin
    .from('categories')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (fetchError || !existing) {
    return res.status(404).json({ error: 'Category not found' });
  }

  // Check if category is in use
  const { data: transactions } = await supabaseAdmin
    .from('transactions')
    .select('id')
    .eq('category_id', id)
    .eq('user_id', userId)
    .limit(1);

  if (transactions && transactions.length > 0) {
    // Option 1: Prevent deletion
    // return res.status(400).json({ error: 'Cannot delete category that is in use' });
    
    // Option 2: Set category_id to null for related transactions (handled by ON DELETE SET NULL)
    // Just proceed with deletion
  }

  const { error } = await supabaseAdmin
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete category: ${error.message}`);
  }

  res.status(204).send();
}));

export default router;

