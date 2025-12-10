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

// Middleware
// CORS configuration - allow all origins in Vercel/production, specific in dev
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (same-origin, mobile apps, Postman)
    if (!origin) return callback(null, true);
    
    // In Vercel or production, allow all origins (frontend and API on same domain)
    if (process.env.VERCEL || process.env.VERCEL_ENV || process.env.NODE_ENV === 'production') {
      return callback(null, true);
    }
    
    // Development - allow localhost
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    callback(null, true); // Default: allow
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

