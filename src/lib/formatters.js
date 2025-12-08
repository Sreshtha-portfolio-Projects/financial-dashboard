/**
 * Format number as currency
 */
export function formatCurrency(amount, currency = 'USD', locale = 'en-US') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format date string
 */
export function formatDate(dateString, options = {}) {
  const date = new Date(dateString);
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  };
  return new Intl.DateTimeFormat('en-US', defaultOptions).format(date);
}

/**
 * Format date for input[type="date"]
 */
export function formatDateForInput(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
}

/**
 * Get date range for common periods
 */
export function getDateRange(period) {
  const today = new Date();
  const endDate = formatDateForInput(today.toISOString());
  
  let startDate;
  switch (period) {
    case 'today':
      startDate = endDate;
      break;
    case 'week':
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      startDate = formatDateForInput(weekAgo.toISOString());
      break;
    case 'month':
      const monthAgo = new Date(today);
      monthAgo.setMonth(today.getMonth() - 1);
      startDate = formatDateForInput(monthAgo.toISOString());
      break;
    case 'year':
      const yearAgo = new Date(today);
      yearAgo.setFullYear(today.getFullYear() - 1);
      startDate = formatDateForInput(yearAgo.toISOString());
      break;
    default:
      startDate = null;
  }
  
  return { startDate, endDate };
}

