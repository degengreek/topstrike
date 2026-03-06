/**
 * Leaderboard API
 * GET - Fetch leaderboard (current gameweek or all-time)
 */

import { supabase } from '@/lib/supabase'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const view = searchParams.get('view') || 'alltime' // 'current' or 'alltime'

    if (view === 'current') {
      // Current gameweek leaderboard (will show data once points are calculated)
      const { data, error } = await supabase
        .from('leaderboard_current')
        .select('*')
        .limit(100)

      if (error) throw error

      return Response.json({
        leaderboard: data || [],
        view: 'current'
      })
    } else {
      // All-time leaderboard (shows total_points from squads)
      const { data, error } = await supabase
        .from('leaderboard_alltime')
        .select('*')
        .limit(100)

      if (error) throw error

      return Response.json({
        leaderboard: data || [],
        view: 'alltime'
      })
    }

  } catch (error: any) {
    console.error('Leaderboard API error:', error)
    return Response.json({
      error: error.message,
      leaderboard: []
    }, { status: 500 })
  }
}
