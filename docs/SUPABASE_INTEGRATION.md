# Supabase Integration Implementation Plan

## Overview
Integrate Supabase for user management, squad persistence, and leaderboard functionality.

---

## ✅ Completed
- [x] Database schema design
- [x] Migration files created
- [x] Setup documentation

---

## 🔨 Implementation Steps

### 1. Supabase Client Setup

**Create:** `lib/supabase.ts`
```typescript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Server-side client (for API routes)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

**Install:**
```bash
npm install @supabase/supabase-js
```

---

### 2. User Management

**Update:** `app/api/auth/[...nextauth]/route.ts`

Add callback to save user to Supabase on sign in:

```typescript
callbacks: {
  async signIn({ user, account, profile }) {
    // Save/update user in Supabase
    const { data, error } = await supabaseAdmin
      .from('users')
      .upsert({
        twitter_id: account.providerAccountId,
        twitter_username: profile.data.username,
        twitter_handle: profile.data.name,
        twitter_avatar_url: profile.data.profile_image_url,
      })
      .select()

    return true
  }
}
```

---

### 3. Wallet Linking

**Create:** `app/api/wallet-link/route.ts`

Update existing API to save to Supabase:

```typescript
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { wallet } = await req.json()

  // Update user in Supabase
  const { data, error } = await supabaseAdmin
    .from('users')
    .update({ wallet_address: wallet })
    .eq('twitter_id', session.user.id)

  return Response.json({ success: true })
}
```

---

### 4. Squad Persistence

**Create:** `app/api/squad/route.ts`

```typescript
// GET - Load user's squad
export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('twitter_id', session.user.id)
    .single()

  const { data: squad } = await supabase
    .from('squads')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return Response.json({ squad })
}

// POST - Save user's squad
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { formation, players } = await req.json()

  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('twitter_id', session.user.id)
    .single()

  const { data, error } = await supabaseAdmin
    .from('squads')
    .upsert({
      user_id: user.id,
      formation,
      players,
    })

  return Response.json({ success: true, data })
}
```

**Update:** `app/components/SquadBuilderTab.tsx`

Replace localStorage with API calls:
```typescript
// Load squad on mount
useEffect(() => {
  if (session) {
    fetch('/api/squad')
      .then(res => res.json())
      .then(data => {
        if (data.squad) {
          setFormation(data.squad.formation)
          setPlayerPositions(data.squad.players)
        }
      })
  }
}, [session])

// Save squad
const handleSaveSquad = async () => {
  await fetch('/api/squad', {
    method: 'POST',
    body: JSON.stringify({ formation, players: playerPositions })
  })
}
```

---

### 5. Leaderboard Integration

**Create:** `app/api/leaderboard/route.ts`

```typescript
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const view = searchParams.get('view') || 'current' // 'current' or 'alltime'

  const tableName = view === 'current'
    ? 'leaderboard_current'
    : 'leaderboard_alltime'

  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .limit(100)

  return Response.json({ leaderboard: data })
}
```

**Update:** `app/components/LeaderboardTab.tsx`

Replace mock data with real Supabase data:
```typescript
useEffect(() => {
  fetch(`/api/leaderboard?view=${view}`)
    .then(res => res.json())
    .then(data => setLeaderboard(data.leaderboard))
}, [view])
```

---

### 6. Gameweek Management

**Create:** `app/api/gameweek/route.ts`

```typescript
// Get current active gameweek
export async function GET(req: Request) {
  const { data: gameweek } = await supabase
    .from('gameweeks')
    .select('*')
    .eq('is_active', true)
    .single()

  return Response.json({ gameweek })
}
```

---

## 🔄 Migration Plan

1. Set up Supabase project
2. Run migrations
3. Install dependencies
4. Create Supabase client
5. Update NextAuth callbacks
6. Create API routes
7. Update frontend components
8. Test with existing users
9. Deploy

---

## 🧪 Testing Checklist

- [ ] User signs in → Saved to Supabase
- [ ] User links wallet → Updated in Supabase
- [ ] User saves squad → Persisted to Supabase
- [ ] User loads squad → Retrieved from Supabase
- [ ] Leaderboard shows current gameweek
- [ ] Leaderboard shows all-time
- [ ] RLS policies work (users can't edit others' data)

---

## 📝 Notes

- Keep existing localStorage as fallback during migration
- Existing username mapping (`lib/topstrike-usernames.ts`) can stay for now
- Points calculation system will be added in Phase 2
- Consider adding loading states and error handling
