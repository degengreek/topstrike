/**
 * Supabase Client
 * Handles database connections for the app
 */

import { createClient } from '@supabase/supabase-js'

// Client-side Supabase client (uses anon key)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Server-side Supabase client (uses service role key - full access)
// Only use this in API routes, never on the client!
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Database type definitions (will expand as we use more tables)
export type Database = {
  users: {
    id: string
    twitter_id: string
    twitter_username: string
    twitter_handle: string | null
    twitter_avatar_url: string | null
    wallet_address: string | null
    created_at: string
    updated_at: string
  }
  squads: {
    id: string
    user_id: string
    formation: string
    players: Record<string, number> // {position: playerId}
    total_points: number
    is_locked: boolean
    created_at: string
    updated_at: string
  }
  gameweeks: {
    id: string
    week_number: number
    start_date: string
    end_date: string
    lock_deadline: string
    is_active: boolean
    created_at: string
  }
  user_gameweek_points: {
    id: string
    user_id: string
    gameweek_id: string
    points: number
    squad_snapshot: Record<string, any> | null
    calculated_at: string | null
  }
}
