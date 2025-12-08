# Quick Fix for Server Error

The error `supabaseUrl is required` means your environment variables aren't loaded.

## Solution

1. **Create a `.env` file in the root directory** (same level as `package.json`)

2. **Copy the template from `env.example` and fill in your Supabase credentials:**

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_JWT_SECRET=your_jwt_secret_here
PORT=5000
NODE_ENV=development
```

3. **Get your Supabase credentials:**
   - Go to your Supabase project dashboard
   - Navigate to **Settings** > **API**
   - Copy:
     - **Project URL** → `SUPABASE_URL`
     - **anon public** key → `SUPABASE_ANON_KEY`
     - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`
     - **JWT Secret** → `SUPABASE_JWT_SECRET` (found in Settings > API > JWT Settings)

4. **Restart the server** after creating/updating the `.env` file

## Note

Make sure the `.env` file is in the root directory (`g:\financial_dashboard\.env`), not in the `server` folder.

