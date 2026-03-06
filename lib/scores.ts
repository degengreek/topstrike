/**
 * Player Scores Utilities
 * Fetch and manage player scores from TopStrike API
 */

export interface PlayerScore {
  player_id: string
  player_name: string
  most_recent_score: number
  match_date: string | null
  match_opponent: string | null
  match_state: string | null
  last_updated?: string
}

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
 * Fetch score for a single player from TopStrike API (client-side)
 */
async function fetchPlayerScoreFromTopStrike(playerId: string, playerName: string): Promise<PlayerScore> {
  try {
    const url = `https://play.topstrike.io/api/fapi-server/player-match-history?tokenId=${playerId}&limit=1`

    console.log(`🔍 Fetching player ${playerId} (${playerName})...`)
    const response = await fetch(url)

    if (!response.ok) {
      console.error(`❌ API returned ${response.status} for player ${playerId}`)
      throw new Error(`API returned ${response.status}`)
    }

    const data: TopStrikeMatch[] = await response.json()
    console.log(`📦 Response for ${playerName}:`, data)

    // No match history
    if (!data || data.length === 0) {
      console.log(`⚠️ No match history for ${playerName}`)
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
    console.log(`✅ ${playerName}: ${recentMatch.totalScore} points vs ${recentMatch.opponentName}`)

    return {
      player_id: playerId,
      player_name: playerName,
      most_recent_score: recentMatch.totalScore,
      match_date: recentMatch.matchDate,
      match_opponent: recentMatch.opponentName,
      match_state: recentMatch.matchState
    }
  } catch (error) {
    console.error(`❌ Failed to fetch score for player ${playerId} (${playerName}):`, error)
    // Return 0 score on error
    return {
      player_id: playerId,
      player_name: playerName,
      most_recent_score: 0,
      match_date: null,
      match_opponent: null,
      match_state: null
    }
  }
}

/**
 * Fetch scores for multiple players from TopStrike API (client-side)
 * Stores results in database
 */
export async function fetchPlayerScores(players: Array<{ id: string, name: string }>) {
  try {
    console.log(`📊 Fetching scores for ${players.length} players from TopStrike API...`)

    const results: PlayerScore[] = []

    // Fetch scores for each player (with small delay to avoid rate limiting)
    for (const player of players) {
      const score = await fetchPlayerScoreFromTopStrike(player.id, player.name)
      results.push(score)

      // Small delay between requests (200ms)
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    console.log(`✅ Fetched ${results.length} scores`)

    // Save to database via API
    const response = await fetch('/api/scores/save-scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scores: results })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to save scores')
    }

    const data = await response.json()
    return data
  } catch (error: any) {
    console.error('Error fetching player scores:', error)
    throw error
  }
}

/**
 * Get all stored scores from database
 */
export async function getStoredScores(): Promise<PlayerScore[]> {
  try {
    const response = await fetch('/api/scores/fetch-scores')

    if (!response.ok) {
      throw new Error('Failed to fetch stored scores')
    }

    const data = await response.json()
    return data.scores || []
  } catch (error: any) {
    console.error('Error getting stored scores:', error)
    return []
  }
}

/**
 * Get score for a specific player
 */
export function getPlayerScore(scores: PlayerScore[], playerId: string): number {
  const score = scores.find(s => s.player_id === playerId)
  return score?.most_recent_score || 0
}
