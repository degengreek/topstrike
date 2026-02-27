/**
 * Player Database - Comprehensive player data
 */

interface PlayerDatabaseEntry {
  id: number
  name: string
  imageUrl: string | null
  position: string | null
  team: string | null
  sportsDbId: string | null
  lastAttempt?: string
  attempts?: number
}

let playerDatabase: PlayerDatabaseEntry[] | null = null

/**
 * Load the player database from the JSON file
 */
export const loadPlayerDatabase = async (): Promise<PlayerDatabaseEntry[]> => {
  if (playerDatabase) {
    return playerDatabase
  }

  try {
    const response = await fetch('/player-database.json')
    if (!response.ok) {
      throw new Error('Failed to load player database')
    }
    playerDatabase = await response.json()
    return playerDatabase || []
  } catch (error) {
    console.error('Error loading player database:', error)
    return []
  }
}

/**
 * Get player data by name from the database
 */
export const getPlayerByName = async (playerName: string): Promise<{
  imageUrl: string | null
  position: string | null
  team: string | null
} | null> => {
  const db = await loadPlayerDatabase()

  // Try exact match first
  let player = db.find(p => p.name === playerName)

  // If no exact match, try case-insensitive
  if (!player) {
    player = db.find(p => p.name.toLowerCase() === playerName.toLowerCase())
  }

  if (player) {
    return {
      imageUrl: player.imageUrl,
      position: player.position,
      team: player.team
    }
  }

  return null
}

/**
 * Get all players from the database
 */
export const getAllPlayers = async (): Promise<PlayerDatabaseEntry[]> => {
  return await loadPlayerDatabase()
}
