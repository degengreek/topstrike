/**
 * Current Gameweek API
 * GET - Get currently active gameweek
 */

import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Get active gameweek
    const { data, error } = await supabase
      .from('gameweeks')
      .select('*')
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      throw error
    }

    return Response.json({
      gameweek: data || null
    })

  } catch (error: any) {
    console.error('Error fetching current gameweek:', error)
    return Response.json({
      error: error.message,
      gameweek: null
    }, { status: 500 })
  }
}
