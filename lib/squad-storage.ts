/**
 * Squad Storage Utility
 * Saves and loads squad formations to/from localStorage
 */

export interface SavedSquad {
  walletAddress: string
  formation: string
  assignedPlayers: Record<string, {
    id: number
    name: string
    position: string
    team: string | null
  }>
  savedAt: string
}

const STORAGE_KEY = 'topstrike_saved_squad'

/**
 * Save current squad to localStorage
 */
export const saveSquad = (
  walletAddress: string,
  formation: string,
  assignedPlayers: Map<string, any>
): void => {
  try {
    // Convert Map to simple object for storage
    const playersObj: Record<string, any> = {}
    assignedPlayers.forEach((player, positionId) => {
      playersObj[positionId] = {
        id: player.id,
        name: player.name,
        position: player.position,
        team: player.team
      }
    })

    const squadData: SavedSquad = {
      walletAddress,
      formation,
      assignedPlayers: playersObj,
      savedAt: new Date().toISOString()
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(squadData))
    console.log('✅ Squad saved to localStorage')
  } catch (error) {
    console.error('Failed to save squad:', error)
  }
}

/**
 * Load saved squad from localStorage
 */
export const loadSquad = (walletAddress: string): SavedSquad | null => {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY)
    if (!savedData) return null

    const squad: SavedSquad = JSON.parse(savedData)

    // Verify it's for the same wallet
    if (squad.walletAddress !== walletAddress) {
      console.log('💡 Saved squad is for different wallet, ignoring')
      return null
    }

    console.log('✅ Loaded saved squad from localStorage')
    return squad
  } catch (error) {
    console.error('Failed to load squad:', error)
    return null
  }
}

/**
 * Clear saved squad from localStorage
 */
export const clearSavedSquad = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY)
    console.log('✅ Cleared saved squad')
  } catch (error) {
    console.error('Failed to clear squad:', error)
  }
}

/**
 * Check if there's a saved squad for a wallet
 */
export const hasSavedSquad = (walletAddress: string): boolean => {
  const squad = loadSquad(walletAddress)
  return squad !== null
}
