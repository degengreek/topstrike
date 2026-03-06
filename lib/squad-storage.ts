/**
 * Squad Storage Utility
 * Saves and loads squad formations to/from Supabase + localStorage backup
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
 * Save draft to localStorage only (auto-save for drafts)
 */
export const saveDraftToLocalStorage = (
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
    console.log('💾 Draft saved to localStorage')
  } catch (error) {
    console.error('Failed to save draft:', error)
  }
}

/**
 * Save squad to Supabase (manual save button)
 */
export const saveSquadToSupabase = async (
  formation: string,
  assignedPlayers: Map<string, any>
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Convert Map to simple object
    const playersObj: Record<string, any> = {}
    assignedPlayers.forEach((player, positionId) => {
      playersObj[positionId] = {
        id: player.id,
        name: player.name,
        position: player.position,
        team: player.team
      }
    })

    const response = await fetch('/api/squad', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        formation,
        players: playersObj
      })
    })

    if (response.ok) {
      console.log('✅ Squad saved to Supabase')
      return { success: true }
    } else {
      const data = await response.json()
      return { success: false, error: data.error || 'Failed to save squad' }
    }
  } catch (error: any) {
    console.error('Failed to save squad to Supabase:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Load saved squad from Supabase (with localStorage fallback)
 */
export const loadSquad = async (walletAddress: string): Promise<SavedSquad | null> => {
  try {
    // Try loading from Supabase first
    try {
      const response = await fetch('/api/squad')
      if (response.ok) {
        const { squad } = await response.json()
        if (squad && squad.players) {
          console.log('✅ Loaded squad from Supabase')
          return {
            walletAddress,
            formation: squad.formation,
            assignedPlayers: squad.players,
            savedAt: squad.updated_at
          }
        }
      }
    } catch (apiError) {
      console.warn('⚠️ Supabase load failed, trying localStorage:', apiError)
    }

    // Fallback to localStorage
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
