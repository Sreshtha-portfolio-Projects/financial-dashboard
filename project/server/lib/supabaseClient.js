import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

// Get the directory of the current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Only load .env file if it exists (for local development)
// On Render, environment variables are already in process.env
const envPath = join(__dirname, '../../.env');
if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  // Try root directory as fallback
  dotenv.config();
}

// Validate environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ SUPABASE_URL is missing from environment variables');
  console.error('Current process.env keys:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
  throw new Error('SUPABASE_URL environment variable is required. Please check your environment variables on Render.');
}

if (!supabaseServiceRoleKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is missing from environment variables');
  console.error('Current process.env keys:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
  throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required. Please check your environment variables on Render.');
}

// Service role client for backend operations
// This has admin privileges and bypasses RLS
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

