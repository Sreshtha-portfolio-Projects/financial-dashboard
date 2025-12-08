# Setup Guide

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Supabase:**
   - Create a new Supabase project at https://supabase.com
   - Go to Project Settings > API to get your keys
   - Copy `env.example` to `.env` and fill in your Supabase credentials
   - Create another `.env` file in the root for Vite (or add `VITE_` prefixed vars to the same file)

3. **Run database migrations:**
   - Open Supabase SQL Editor
   - Copy and paste the contents of `database/schema.sql`
   - Execute the SQL script

4. **Start the application:**
   ```bash
   npm run dev
   ```

   This starts both the backend (port 5000) and frontend (port 3000).

5. **Access the application:**
   - Open http://localhost:3000
   - Sign up for a new account
   - Start managing your finances!

## Environment Variables

### Backend (.env)
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret
PORT=5000
NODE_ENV=development
```

### Frontend (.env or same file with VITE_ prefix)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=http://localhost:5000/api
```

## Getting Supabase JWT Secret

The JWT secret is found in your Supabase project settings:
1. Go to Project Settings > API
2. Look for "JWT Secret" (not the anon key or service role key)
3. Copy this value to `SUPABASE_JWT_SECRET` in your `.env` file

Note: The JWT secret is used by the backend to verify tokens. The frontend uses the anon key for authentication.

## Troubleshooting

### "Missing Supabase environment variables" error
- Make sure you've created a `.env` file with `VITE_` prefixed variables for the frontend
- Restart the Vite dev server after adding environment variables

### "Authentication failed" errors
- Verify your Supabase credentials are correct
- Check that RLS policies are enabled in Supabase
- Ensure the database schema has been run

### CSV Import not working
- Make sure your CSV has headers in the first row
- Verify the column mapping matches your CSV structure
- Check browser console for detailed error messages

### Charts not displaying
- Ensure you have transaction data for the selected date range
- Check browser console for any errors
- Verify Recharts is installed: `npm list recharts`

## Development

- Backend only: `npm run dev:server`
- Frontend only: `npm run dev:client`
- Build for production: `npm run build`

