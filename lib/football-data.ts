/**
 * Football-Data.org API Integration
 * Free tier: 10 requests/minute, 100/day
 * More accurate and up-to-date than TheSportsDB
 */

const FOOTBALL_DATA_API_URL = 'https://api.football-data.org/v4'
const API_KEY = process.env.NEXT_PUBLIC_FOOTBALL_DATA_API_KEY || '' // Optional: add API key for higher limits

export interface FootballDataPlayer {
  id: number
  name: string
  position: string
  dateOfBirth: string
  nationality: string
  currentTeam?: {
    name: string
  }
}

export interface PlayerInfo {
  imageUrl: string | null
  position: string | null
  team: string | null
}

/**
 * Search for a player by name
 * Note: Free tier has rate limits (10 req/min)
 */
export const searchPlayerByName = async (playerName: string): Promise<PlayerInfo> => {
  try {
    // Football-Data.org doesn't have a direct player search endpoint
    // We would need to search competitions -> teams -> players
    // For now, return null to use as fallback only
    console.log(`⚠️  Football-Data.org requires competition/team context for player search`)
    return { imageUrl: null, position: null, team: null }
  } catch (error) {
    console.error('Football-Data.org API error:', error)
    return { imageUrl: null, position: null, team: null }
  }
}

/**
 * Get player info by ID (if we have it)
 */
export const getPlayerById = async (playerId: number): Promise<PlayerInfo> => {
  try {
    const headers: HeadersInit = {
      'X-Auth-Token': API_KEY
    }

    const response = await fetch(
      `${FOOTBALL_DATA_API_URL}/persons/${playerId}`,
      { headers }
    )

    if (!response.ok) {
      return { imageUrl: null, position: null, team: null }
    }

    const data: FootballDataPlayer = await response.json()

    return {
      imageUrl: null, // Football-Data.org doesn't provide images
      position: data.position || null,
      team: data.currentTeam?.name || null
    }
  } catch (error) {
    console.error('Football-Data.org API error:', error)
    return { imageUrl: null, position: null, team: null }
  }
}

/**
 * Note: Football-Data.org is best used when you know:
 * 1. The competition (Premier League, La Liga, etc.)
 * 2. The team
 * 3. Then you can get accurate player lists
 *
 * For name-based search, TheSportsDB is actually better.
 * Football-Data.org is better for:
 * - Live match data
 * - Standings
 * - Team rosters
 * - Competition info
 */
