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

/**
 * Fetch scores for multiple players from TopStrike API
 * Stores results in database
 */
export async function fetchPlayerScores(players: Array<{ id: string, name: string }>) {
  try {
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
