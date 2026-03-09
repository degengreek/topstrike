/**
 * Gameweek Leaderboard API
 * GET - Get leaderboard for specific gameweek
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const gameweekId = searchParams.get('gameweek_id')

    if (!gameweekId) {
      return NextResponse.json(
        { error: 'gameweek_id required' },
        { status: 400 }
      )
    }

    // Get leaderboard for specific gameweek
    const { data: leaderboard, error } = await supabaseAdmin
      .from('user_gameweek_points')
      .select(`
        points,
        user_id,
        users (
          twitter_username,
          twitter_handle,
          wallet_address
        )
      `)
      .eq('gameweek_id', gameweekId)
      .order('points', { ascending: false })

    if (error) {
      console.error('Error fetching gameweek leaderboard:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Format response
    const formattedLeaderboard = leaderboard.map(entry => ({
      twitter_username: entry.users?.twitter_username || 'Unknown',
      twitter_handle: entry.users?.twitter_handle || null,
      wallet_address: entry.users?.wallet_address || null,
      total_points: entry.points
    }))

    return NextResponse.json({
      leaderboard: formattedLeaderboard
    })

  } catch (error: any) {
    console.error('Error in gameweek leaderboard:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
