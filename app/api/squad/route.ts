/**
 * Squad API
 * GET - Load user's squad
 * POST - Save user's squad
 */

import { getServerSession } from 'next-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// GET - Load user's squad
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from Supabase
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('twitter_id', session.user.id)
      .single()

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    // Get user's squad
    const { data: squad, error } = await supabaseAdmin
      .from('squads')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error loading squad:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ squad: squad || null })

  } catch (error: any) {
    console.error('Squad GET error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

// POST - Save user's squad
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { formation, players } = body

    if (!formation || !players) {
      return Response.json({ error: 'Missing formation or players' }, { status: 400 })
    }

    // Get user from Supabase
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('twitter_id', session.user.id)
      .single()

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    // Upsert squad (insert or update)
    const { data: squad, error } = await supabaseAdmin
      .from('squads')
      .upsert({
        user_id: user.id,
        formation,
        players,
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving squad:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ Squad saved for user:', session.user.name)

    return Response.json({ success: true, squad })

  } catch (error: any) {
    console.error('Squad POST error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
