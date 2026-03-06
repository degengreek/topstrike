/**
 * Fetch Player Scores API
 * Fetches most recent match scores from TopStrike API and stores in database
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { authOptions } from '@/lib/auth'

interface TopStrikeMatch {
  matchDate: string
  opponentName: string
  totalScore: number
  matchState: string
  goals: number
  assists: number
  minutesPlayed: number
}

/**
 * POST /api/scores/fetch-scores
 * Fetches scores for given player IDs from TopStrike API
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { playerIds } = body // Array of {id, name} objects

    if (!playerIds || !Array.isArray(playerIds)) {
      return NextResponse.json(
        { error: 'playerIds array required' },
        { status: 400 }
      )
    }

    console.log(`📊 Fetching scores for ${playerIds.length} players...`)

    const results = []
    const errors = []

    // Fetch scores for each player (with small delay to avoid rate limiting)
    for (const player of playerIds) {
      try {
        const score = await fetchPlayerScore(player.id, player.name)
        results.push(score)

        // Small delay between requests (100ms)
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error: any) {
        console.error(`Failed to fetch score for player ${player.id}:`, error.message)
        errors.push({
          playerId: player.id,
          playerName: player.name,
          error: error.message
        })

        // Store 0 score for failed fetches
        results.push({
          player_id: player.id,
          player_name: player.name,
          most_recent_score: 0,
          match_date: null,
          match_opponent: null,
          match_state: null
        })
      }
    }

    // Bulk upsert to database
    const { error: dbError } = await supabaseAdmin
      .from('player_scores')
      .upsert(results, { onConflict: 'player_id' })

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to save scores to database' },
        { status: 500 }
      )
    }

    console.log(`✅ Successfully fetched and stored ${results.length} scores`)

    return NextResponse.json({
      success: true,
      fetched: results.length,
      errorCount: errors.length,
      results,
      errors
    })

  } catch (error: any) {
    console.error('Error in fetch-scores:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

/**
 * Fetch score for a single player from TopStrike API
 */
async function fetchPlayerScore(playerId: string, playerName: string) {
  const url = `https://play.topstrike.io/api/fapi-server/player-match-history?tokenId=${playerId}&limit=1`

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json',
      'Referer': 'https://play.topstrike.io/'
    }
  })

  if (!response.ok) {
    throw new Error(`API returned ${response.status}`)
  }

  const data: TopStrikeMatch[] = await response.json()

  // No match history
  if (!data || data.length === 0) {
    return {
      player_id: playerId,
      player_name: playerName,
      most_recent_score: 0,
      match_date: null,
      match_opponent: null,
      match_state: null
    }
  }

  // Get most recent match
  const recentMatch = data[0]

  return {
    player_id: playerId,
    player_name: playerName,
    most_recent_score: recentMatch.totalScore,
    match_date: recentMatch.matchDate,
    match_opponent: recentMatch.opponentName,
    match_state: recentMatch.matchState
  }
}

/**
 * GET /api/scores/fetch-scores
 * Get all stored scores from database
 */
export async function GET(request: NextRequest) {
  try {
    const { data: scores, error } = await supabaseAdmin
      .from('player_scores')
      .select('*')
      .order('last_updated', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ scores })

  } catch (error: any) {
    console.error('Error fetching scores:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
