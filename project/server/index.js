import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

// Load environment variables FIRST before any other imports
// On Render, env vars are already in process.env, but we load .env for local dev
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '../.env');

if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  // Try default location (for local dev)
  dotenv.config();
}

import express from 'express';
import cors from 'cors';
import path from 'path';
import { errorHandler } from './lib/errorHandler.js';

// Import routes
import authRoutes from './routes/auth.js';
import transactionsRoutes from './routes/transactions.js';
import categoriesRoutes from './routes/categories.js';
import dashboardRoutes from './routes/dashboard.js';
import importRoutes from './routes/import.js';
import exportRoutes from './routes/export.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Log environment configuration on startup
console.log('=== Server Configuration ===');
console.log('PORT:', PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('RENDER:', process.env.RENDER ? '✓ Detected' : '✗ Not detected');
console.log('VERCEL:', process.env.VERCEL ? '✓ Detected' : '✗ Not detected');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✓ Set' : '✗ Missing');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ Set' : '✗ Missing');
console.log('===========================');

// Disable ETag generation to prevent 304 responses
app.set('etag', false);

// Middleware
// CORS configuration - explicitly allow all origins in production (Render/Vercel)
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (same-origin, mobile apps, Postman)
    if (!origin) return callback(null, true);
    
    // In production (Render/Vercel), allow all origins
    // Check for Render environment, Vercel environment, or production mode
    if (process.env.RENDER || process.env.VERCEL || process.env.VERCEL_ENV || process.env.NODE_ENV === 'production') {
      console.log('CORS: Allowing origin:', origin);
      return callback(null, true);
    }
    
    // Development - allow localhost
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    // Default: allow
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
  preflightContinue: false,
}));

// Explicit OPTIONS handler for CORS preflight requests
// MUST be placed right after CORS middleware to catch preflight requests early
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  console.log('OPTIONS handler - Origin:', origin);
  
  // When credentials: true, we MUST use the specific origin, not '*'
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    // Only use '*' if no origin (shouldn't happen with credentials)
    res.header('Access-Control-Allow-Origin', '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  
  res.status(204).end();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add CORS headers to all API responses (backup in case CORS middleware fails)
app.use('/api', (req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  next();
});

// Request logging middleware (for debugging in production too)
app.use('/api', (req, res, next) => {
  console.log(`[${req.method}] ${req.path} - Origin: ${req.headers.origin || 'same-origin'}`);
  if (req.method === 'OPTIONS') {
    console.log('OPTIONS preflight request received');
  }
  next();
});

// Add cache-control headers to prevent 304 responses for API routes
app.use('/api', (req, res, next) => {
  // Remove any conditional request headers that might trigger 304
  delete req.headers['if-none-match'];
  delete req.headers['if-modified-since'];
  
  // Override status method to prevent 304
  const originalStatus = res.status.bind(res);
  res.status = function(code) {
    // Force 200 if Express tries to send 304
    if (code === 304) {
      console.warn('Prevented 304 response, forcing 200');
      return originalStatus(200);
    }
    return originalStatus(code);
  };
  
  // Intercept end/send to ensure we never send 304
  const originalEnd = res.end.bind(res);
  res.end = function(...args) {
    if (res.statusCode === 304) {
      console.warn('Prevented 304 response in end(), forcing 200');
      res.statusCode = 200;
    }
    return originalEnd(...args);
  };
  
  const originalSend = res.send.bind(res);
  res.send = function(...args) {
    if (res.statusCode === 304) {
      console.warn('Prevented 304 response in send(), forcing 200');
      res.statusCode = 200;
    }
    return originalSend(...args);
  };
  
  const originalJson = res.json.bind(res);
  res.json = function(...args) {
    if (res.statusCode === 304) {
      console.warn('Prevented 304 response in json(), forcing 200');
      res.statusCode = 200;
    }
    return originalJson(...args);
  };
  
  // Disable caching for all API responses
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
  });
  
  // Remove ETag and Last-Modified headers if they exist
  res.removeHeader('ETag');
  res.removeHeader('Last-Modified');
  
  next();
});

// Root path - provide API information
app.get('/', (req, res) => {
  res.json({
    message: 'Financial Dashboard API Server',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      api: {
        auth: '/api/auth',
        transactions: '/api/transactions',
        categories: '/api/categories',
        dashboard: '/api/dashboard',
        import: '/api/import',
        export: '/api/export',
      },
    },
    note: 'This is the API server. Access the frontend at http://localhost:3000 in development.',
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/import', importRoutes);
app.use('/api/export', exportRoutes);

// 404 handler for unmatched API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.path,
    method: req.method,
  });
});

// Serve static files from the Vite build in production (only for non-Vercel deployments)
// Vercel serves static files automatically, so we skip this
if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
  app.use(express.static(path.join(__dirname, '../dist')));
  
  // Handle React Router - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, '../dist/index.html'));
    }
  });
}

// Error handler (must be last)
app.use(errorHandler);

// Only start listening if not in Vercel environment
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Export app for Vercel serverless functions
export default app;

