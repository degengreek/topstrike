/**
 * Overall Leaderboard API
 * GET - Get cumulative leaderboard (sum of all gameweeks)
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Get all user gameweek points and sum them
    const { data: allPoints, error } = await supabaseAdmin
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

    if (error) {
      console.error('Error fetching overall leaderboard:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Group by user and sum points
    const userTotals: Record<string, any> = {}

    allPoints.forEach(entry => {
      const userId = entry.user_id
      if (!userTotals[userId]) {
        userTotals[userId] = {
          twitter_username: entry.users?.twitter_username || 'Unknown',
          twitter_handle: entry.users?.twitter_handle || null,
          wallet_address: entry.users?.wallet_address || null,
          total_points: 0
        }
      }
      userTotals[userId].total_points += entry.points
    })

    // Convert to array and sort
    const leaderboard = Object.values(userTotals)
      .sort((a, b) => b.total_points - a.total_points)

    return NextResponse.json({
      leaderboard
    })

  } catch (error: any) {
    console.error('Error in overall leaderboard:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
