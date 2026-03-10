/**
 * Player Gameweek History API
 * GET - Get all gameweek scores for a specific player
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const playerId = searchParams.get('player_id')

    if (!playerId) {
      return NextResponse.json(
        { error: 'player_id required' },
        { status: 400 }
      )
    }

    // Get all gameweek scores for this player
    const { data: scores, error } = await supabaseAdmin
      .from('player_scores')
      .select(`
        most_recent_score,
        gameweek_id,
        gameweeks (
          week_number,
          start_date,
          end_date
        )
      `)
      .eq('player_id', playerId)
      .order('gameweek_id', { ascending: true })

    if (error) {
      console.error('Error fetching player history:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Format response
    const history = (scores || []).map((score: any) => {
      const gameweek = Array.isArray(score.gameweeks) ? score.gameweeks[0] : score.gameweeks
      return {
        week_number: gameweek?.week_number || 0,
        points: score.most_recent_score || 0,
        start_date: gameweek?.start_date,
        end_date: gameweek?.end_date
      }
    })

    return NextResponse.json({
      player_id: playerId,
      history
    })

  } catch (error: any) {
    console.error('Error in player history:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
