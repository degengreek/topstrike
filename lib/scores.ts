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
 * Fetch scores for multiple players from TopStrike API
 * Uses server-side API to bypass CORS restrictions
 */
export async function fetchPlayerScores(players: Array<{ id: string, name: string }>) {
  try {
    console.log(`📊 Fetching scores for ${players.length} players...`)

    const response = await fetch('/api/scores/fetch-scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerIds: players })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch scores')
    }

    const data = await response.json()
    console.log(`✅ Fetched ${data.fetched} scores, ${data.errorCount} errors`)

    return data
  } catch (error: any) {
    console.error('Error fetching player scores:', error)
    throw error
  }
}

/**
 * Get all stored scores from database (current gameweek only)
 */
export async function getStoredScores(): Promise<PlayerScore[]> {
  try {
    // Get current gameweek first
    const gwResponse = await fetch('/api/gameweek/current')
    if (!gwResponse.ok) return []

    const gwData = await gwResponse.json()
    const currentGameweek = gwData.gameweek

    if (!currentGameweek) return []

    // Get scores for current gameweek only
    const response = await fetch(`/api/scores/fetch-scores?gameweek_id=${currentGameweek.id}`)

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
