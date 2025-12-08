import { parse } from 'csv-parse/sync';

/**
 * Parse CSV file buffer to array of objects
 */
export function parseCSV(buffer, options = {}) {
  const { columns = true, skip_empty_lines = true, trim = true } = options;
  
  try {
    // Convert buffer to string if needed
    const csvString = Buffer.isBuffer(buffer) ? buffer.toString('utf8') : buffer;
    
    const records = parse(csvString, {
      columns,
      skip_empty_lines,
      trim,
      cast: true,
      cast_date: true,
    });
    return records;
  } catch (error) {
    throw new Error(`CSV parsing failed: ${error.message}`);
  }
}

/**
 * Transform CSV row to transaction object based on field mapping
 */
export function mapCSVRowToTransaction(row, mapping, userId) {
  const {
    amountField,
    typeField,
    categoryField,
    dateField,
    noteField,
  } = mapping;

  // Extract and validate amount
  const amount = parseFloat(row[amountField]);
  if (isNaN(amount) || amount === 0) {
    throw new Error(`Invalid amount: ${row[amountField]}`);
  }
  
  // If amount is negative, it might indicate income (money coming in)
  // We'll use Math.abs for the stored value, but preserve sign for type detection
  const isNegative = amount < 0;

  // Extract and validate type
  let type = 'expense'; // Default to expense
  if (typeField && row[typeField]) {
    const typeRaw = String(row[typeField]).toLowerCase().trim();
    if (typeRaw === 'income' || typeRaw === 'expense') {
      type = typeRaw;
    } else {
      // If type field exists but value is invalid, infer from amount sign
      // Negative amounts often indicate income (money coming in)
      type = isNegative ? 'income' : 'expense';
    }
  } else {
    // If no type field, infer from amount sign
    // Negative amounts often indicate income (money coming in)
    type = isNegative ? 'income' : 'expense';
  }

  // Extract date
  const dateStr = row[dateField];
  let txnDate;
  if (dateStr instanceof Date) {
    txnDate = dateStr.toISOString().split('T')[0];
  } else {
    // Try to parse date string
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) {
      throw new Error(`Invalid date: ${dateStr}`);
    }
    txnDate = parsed.toISOString().split('T')[0];
  }

  // Extract category name (if provided)
  const categoryName = categoryField ? String(row[categoryField] || '').trim() : null;

  // Extract note
  const note = noteField ? String(row[noteField] || '').trim() : null;

  return {
    amount: Math.abs(amount),
    type,
    txn_date: txnDate,
    category_name: categoryName,
    note: note || null,
    source: 'csv',
    external_ref: null, // Could generate a hash from row data if needed
  };
}

/**
 * Generate CSV content from transactions array
 */
export function generateCSV(transactions) {
  const headers = ['Date', 'Type', 'Category', 'Amount', 'Note', 'Source'];
  
  const rows = transactions.map(txn => [
    txn.txn_date,
    txn.type,
    txn.category_name || 'Uncategorized',
    txn.amount,
    txn.note || '',
    txn.source || 'manual',
  ]);

  const csvRows = [
    headers.join(','),
    ...rows.map(row => 
      row.map(cell => {
        // Escape commas and quotes in cell values
        const str = String(cell || '');
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',')
    ),
  ];

  return csvRows.join('\n');
}

