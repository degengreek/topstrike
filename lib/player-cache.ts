/**
 * Player Cache - Uses pre-built player database instead of querying TheSportsDB
 */

interface CachedPlayer {
  id: number
  name: string
  imageUrl: string | null
  position: string | null
  team: string | null
  sportsDbId: string | null
}

let playerDatabase: CachedPlayer[] | null = null

/**
 * Load player database (if it exists)
 */
export async function loadPlayerDatabase(): Promise<void> {
  try {
    // Try to fetch the database file
    const response = await fetch('/player-database.json')
    if (response.ok) {
      playerDatabase = await response.json()
      console.log(`✅ Loaded player database: ${playerDatabase?.length || 0} players`)
    } else {
      throw new Error('Database file not found')
    }
  } catch (error) {
    // Database doesn't exist yet - that's OK, will fall back to live API
    console.log('⚠️  Player database not found. Using live TheSportsDB API. Run "npm run build-db" to create cache.')
    playerDatabase = null
  }
}

/**
 * Get player info from cache by player ID
 */
export function getPlayerFromCache(playerId: number): {
  imageUrl: string | null
  position: string | null
  team: string | null
} | null {
  if (!playerDatabase) return null

  const player = playerDatabase.find(p => p.id === playerId)
  if (!player) return null

  return {
    imageUrl: player.imageUrl,
    position: player.position,
    team: player.team
  }
}

/**
 * Get player info from cache by player name
 */
export function getPlayerFromCacheByName(playerName: string): {
  imageUrl: string | null
  position: string | null
  team: string | null
} | null {
  if (!playerDatabase) return null

  const player = playerDatabase.find(p => p.name.toLowerCase() === playerName.toLowerCase())
  if (!player) return null

  return {
    imageUrl: player.imageUrl,
    position: player.position,
    team: player.team
  }
}

/**
 * Check if database is loaded
 */
export function isDatabaseLoaded(): boolean {
  return playerDatabase !== null && playerDatabase.length > 0
}

/**
 * Get database stats
 */
export function getDatabaseStats() {
  if (!playerDatabase) return null

  return {
    total: playerDatabase.length,
    withImages: playerDatabase.filter(p => p.imageUrl).length,
    withoutImages: playerDatabase.filter(p => !p.imageUrl).length
  }
}
