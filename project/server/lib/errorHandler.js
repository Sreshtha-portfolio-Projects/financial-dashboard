/**
 * Central error handler middleware
 */
export const errorHandler = (err, req, res, next) => {
  console.error('=== Server Error ===');
  console.error('Method:', req.method);
  console.error('Path:', req.path);
  console.error('Error Message:', err.message);
  console.error('Error Stack:', err.stack);
  console.error('Full Error:', err);
  console.error('===================');

  // Default error
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      path: req.path,
      method: req.method,
    }),
  });
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

