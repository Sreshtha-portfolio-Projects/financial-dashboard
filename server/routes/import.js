import express from 'express';
import { supabaseAdmin } from '../lib/supabaseClient.js';
import { authMiddleware } from '../lib/authMiddleware.js';
import { asyncHandler } from '../lib/errorHandler.js';
import { parseCSV, mapCSVRowToTransaction } from '../lib/csvUtils.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// POST /api/import/csv - Import transactions from CSV
router.post('/csv', asyncHandler(async (req, res) => {
  const { userId } = req.user;

  // Expect multipart/form-data with file and mapping config
  // For simplicity, we'll accept JSON with base64 file or use multer
  // Here we'll use a simpler approach: expect file buffer in body.file and mapping in body.mapping
  
  const { file, mapping } = req.body;

  if (!file || !mapping) {
    return res.status(400).json({ 
      error: 'Missing required fields: file (base64 or buffer) and mapping config' 
    });
  }

  // Decode base64 file if needed
  let fileBuffer;
  if (typeof file === 'string') {
    // Assume base64
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
  } catch (error) {
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

  // Process rows
  const results = {
    success: [],
    failed: [],
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      // Map CSV row to transaction
      const txnData = mapCSVRowToTransaction(row, mapping, userId);

      // Resolve or create category if category_name is provided
      let categoryId = null;
      if (txnData.category_name) {
        // Check if category exists
        const { data: existingCategory, error: findError } = await supabaseAdmin
          .from('categories')
          .select('id')
          .eq('user_id', userId)
          .eq('name', txnData.category_name.trim())
          .maybeSingle();

        if (existingCategory) {
          categoryId = existingCategory.id;
        } else if (!findError) {
          // Category doesn't exist, create new one
          const { data: newCategory, error: catError } = await supabaseAdmin
            .from('categories')
            .insert({
              user_id: userId,
              name: txnData.category_name.trim(),
            })
            .select()
            .single();

          if (!catError && newCategory) {
            categoryId = newCategory.id;
          }
        }
      }

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
        throw new Error(txnError.message);
      }

      results.success.push({ row: i + 1, transaction_id: transaction.id });
    } catch (error) {
      results.failed.push({
        row: i + 1,
        error: error.message,
      });
    }
  }

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
    results: {
      success: results.success.slice(0, 10), // Limit response size
      failed: results.failed.slice(0, 10),
    },
  });
}));

export default router;

