import express from 'express';
import { supabaseAdmin } from '../lib/supabaseClient.js';
import { authMiddleware } from '../lib/authMiddleware.js';
import { asyncHandler } from '../lib/errorHandler.js';
import { parseCSV, mapCSVRowToTransaction } from '../lib/csvUtils.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * Normalize category name for consistent matching
 * - Trim whitespace
 * - Capitalize first letter
 * - Handle common variations
 */
function normalizeCategoryName(name) {
  if (!name) return null;
  
  let normalized = String(name).trim();
  if (!normalized) return null;
  
  // Capitalize first letter, lowercase the rest
  normalized = normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
  
  // Handle common plural/singular variations
  const categoryMap = {
    'Grocery': 'Groceries',
    'Transport': 'Transportation',
    'Bill': 'Utilities',
    'Utility': 'Utilities',
    'Health': 'Healthcare',
    'Entertain': 'Entertainment',
  };
  
  // Check if we should map to a standard name
  for (const [key, value] of Object.entries(categoryMap)) {
    if (normalized.startsWith(key)) {
      normalized = value;
      break;
    }
  }
  
  return normalized;
}

/**
 * Get or create category with case-insensitive matching
 */
async function getOrCreateCategory(userId, categoryName, categoryCache) {
  if (!categoryName) return null;
  
  const normalizedName = normalizeCategoryName(categoryName);
  if (!normalizedName) return null;
  
  // Check cache first
  const cacheKey = normalizedName.toLowerCase();
  if (categoryCache.has(cacheKey)) {
    return categoryCache.get(cacheKey);
  }
  
  // Fetch all user categories for case-insensitive matching
  const { data: allCategories, error: fetchError } = await supabaseAdmin
    .from('categories')
    .select('id, name')
    .eq('user_id', userId);
  
  if (fetchError) {
    console.error('Error fetching categories:', fetchError);
    return null;
  }
  
  // Find case-insensitive match
  const existingCategory = allCategories?.find(
    cat => cat.name.toLowerCase() === normalizedName.toLowerCase()
  );
  
  if (existingCategory) {
    // Cache it
    categoryCache.set(cacheKey, existingCategory.id);
    return existingCategory.id;
  }
  
  // Create new category
  const { data: newCategory, error: createError } = await supabaseAdmin
    .from('categories')
    .insert({
      user_id: userId,
      name: normalizedName,
    })
    .select()
    .single();
  
  if (createError) {
    console.error('Error creating category:', createError);
    return null;
  }
  
  // Cache the new category
  if (newCategory) {
    categoryCache.set(cacheKey, newCategory.id);
    return newCategory.id;
  }
  
  return null;
}

// POST /api/import/csv - Import transactions from CSV
router.post('/csv', asyncHandler(async (req, res) => {
  const { userId } = req.user;

  console.log('Import request received:', {
    userId,
    mapping: req.body.mapping,
    fileSize: req.body.file?.length
  });

  const { file, mapping } = req.body;

  if (!file || !mapping) {
    return res.status(400).json({ 
      error: 'Missing required fields: file (base64 or buffer) and mapping config' 
    });
  }

  // Decode base64 file if needed
  let fileBuffer;
  if (typeof file === 'string') {
    fileBuffer = Buffer.from(file, 'base64');
  } else if (Buffer.isBuffer(file)) {
    fileBuffer = file;
  } else {
    return res.status(400).json({ error: 'Invalid file format' });
  }

  // Validate mapping
  const requiredFields = ['amountField', 'dateField'];
  for (const field of requiredFields) {
    if (!mapping[field]) {
      return res.status(400).json({ error: `Missing required mapping field: ${field}` });
    }
  }

  // Parse CSV
  let rows;
  try {
    rows = parseCSV(fileBuffer);
    console.log('CSV parsed successfully:', {
      rowCount: rows.length,
      firstRow: rows[0],
      headers: Object.keys(rows[0] || {})
    });
  } catch (error) {
    console.error('CSV parsing error:', error);
    return res.status(400).json({ error: `CSV parsing failed: ${error.message}` });
  }

  if (!rows || rows.length === 0) {
    return res.status(400).json({ error: 'CSV file is empty' });
  }

  // Create import batch record
  const { data: batch, error: batchError } = await supabaseAdmin
    .from('import_batches')
    .insert({
      user_id: userId,
      source: 'csv',
      total_rows: rows.length,
      status: 'pending',
      success_rows: 0,
      failed_rows: 0,
    })
    .select()
    .single();

  if (batchError) {
    throw new Error(`Failed to create import batch: ${batchError.message}`);
  }

  // Category cache to avoid duplicate lookups
  const categoryCache = new Map();

  // Process rows
  const results = {
    success: [],
    failed: [],
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      if (i < 3) {
        console.log(`Processing row ${i + 1}:`, row);
      }

      // Map CSV row to transaction
      const txnData = mapCSVRowToTransaction(row, mapping, userId);
      
      if (i < 3) {
        console.log(`Mapped transaction ${i + 1}:`, txnData);
      }

      // Get or create category with improved matching
      const categoryId = await getOrCreateCategory(
        userId, 
        txnData.category_name, 
        categoryCache
      );

      // Insert transaction
      const { data: transaction, error: txnError } = await supabaseAdmin
        .from('transactions')
        .insert({
          user_id: userId,
          amount: txnData.amount,
          type: txnData.type,
          txn_date: txnData.txn_date,
          category_id: categoryId,
          note: txnData.note,
          source: txnData.source,
          external_ref: txnData.external_ref,
        })
        .select()
        .single();

      if (txnError) {
        console.error(`Transaction insert error for row ${i + 1}:`, txnError);
        throw new Error(txnError.message);
      }

      if (i < 3) {
        console.log(`Successfully inserted transaction ${i + 1}:`, transaction.id);
      }

      results.success.push({ row: i + 1, transaction_id: transaction.id });
    } catch (error) {
      console.error(`Error processing row ${i + 1}:`, error.message);
      results.failed.push({
        row: i + 1,
        error: error.message,
      });
    }
  }

  console.log('Import complete:', {
    total: rows.length,
    success: results.success.length,
    failed: results.failed.length,
    categoriesCreated: categoryCache.size,
    failedDetails: results.failed.slice(0, 5)
  });

  // Update import batch
  const status = results.failed.length === 0 
    ? 'completed' 
    : (results.success.length === 0 ? 'failed' : 'partial');

  await supabaseAdmin
    .from('import_batches')
    .update({
      status,
      success_rows: results.success.length,
      failed_rows: results.failed.length,
      completed_at: new Date().toISOString(),
      error_message: results.failed.length > 0 
        ? `${results.failed.length} rows failed` 
        : null,
    })
    .eq('id', batch.id);

  res.json({
    batch_id: batch.id,
    total_rows: rows.length,
    success_rows: results.success.length,
    failed_rows: results.failed.length,
    status,
    categories_created: categoryCache.size,
    results: {
      success: results.success.slice(0, 10),
      failed: results.failed.slice(0, 10),
    },
  });
}));

export default router;

