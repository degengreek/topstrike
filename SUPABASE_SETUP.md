# Supabase Setup Guide

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project
3. Save your project credentials:
   - **Project URL**: `https://xxx.supabase.co`
   - **Anon/Public Key**: `eyJhbG...`
   - **Service Role Key**: `eyJhbG...` (keep secret!)

## Step 2: Run Migrations

### Option A: Using Supabase Dashboard (Easiest)

1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the contents of `supabase/migrations/001_initial_schema.sql`
5. Paste and click **Run**
6. Repeat for `supabase/migrations/002_seed_data.sql`

### Option B: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

## Step 3: Configure Environment Variables

Add to your `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG... # Server-side only
```

## Step 4: Install Supabase Client

```bash
npm install @supabase/supabase-js
```

## Step 5: Test Connection

You can test the connection by creating a simple Supabase client:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Test query
const { data, error } = await supabase.from('gameweeks').select('*')
console.log('Gameweeks:', data)
```

## Database Structure

### Tables:
- **users** - Twitter OAuth users + wallet links
- **squads** - User squads (one per user)
- **gameweeks** - Weekly competition periods
- **user_gameweek_points** - Points per user per gameweek

### Views:
- **leaderboard_current** - Current gameweek rankings
- **leaderboard_alltime** - All-time total points rankings

## Row Level Security (RLS)

All tables have RLS enabled:
- **Public read** on all tables (anyone can view)
- **Authenticated write** on user-owned data only
- Users can only modify their own profile and squad

## Next Steps

1. Create `lib/supabase.ts` for Supabase client
2. Update NextAuth to save users to Supabase on login
3. Create API routes for squad saving/loading
4. Update leaderboard to read from Supabase
5. Add wallet linking functionality

See implementation guide in `/docs/SUPABASE_INTEGRATION.md`
