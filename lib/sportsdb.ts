/**
 * TheSportsDB API Integration
 * Free API for fetching sports player data and images
 */

import { getPlayerIdOverride } from './player-overrides'

const SPORTSDB_API_URL = 'https://www.thesportsdb.com/api/v1/json/3'

export interface SportsDBPlayer {
  idPlayer: string
  strPlayer: string
  strThumb?: string // Player thumbnail image
  strCutout?: string // Player cutout image (transparent background)
  strPosition?: string
  strNationality?: string
  strTeam?: string
}

export interface PlayerInfo {
  imageUrl: string | null
  position: string | null
  team: string | null
}

/**
 * Convert TheSportsDB position strings to our standardized format
 * Maps various position names to FWD, MID, DEF, or GK
 */
export const normalizePosition = (sportsDbPosition: string | null): 'FWD' | 'MID' | 'DEF' | 'GK' | 'Unknown' => {
  if (!sportsDbPosition) return 'Unknown'

  const pos = sportsDbPosition.toLowerCase()

  // Goalkeepers
  if (pos.includes('goalkeeper') || pos.includes('goalie')) return 'GK'

  // Forwards / Attackers
  if (
    pos.includes('forward') ||
    pos.includes('striker') ||
    pos.includes('winger') ||
    pos.includes('wing') ||
    pos.includes('attacker') ||
    pos === 'left wing' ||
    pos === 'right wing' ||
    pos === 'centre forward'
  ) return 'FWD'

  // Midfielders
  if (
    pos.includes('midfield') ||
    pos.includes('midfielder') ||
    pos.includes('playmaker') ||
    pos.includes('attacking midfield') ||
    pos.includes('defensive midfield')
  ) return 'MID'

  // Defenders
  if (
    pos.includes('defender') ||
    pos.includes('defence') ||
    pos.includes('back') ||
    pos.includes('sweeper') ||
    pos.includes('centre back') ||
    pos.includes('full back')
  ) return 'DEF'

  return 'Unknown'
}

interface SportsDBResponse {
  player?: SportsDBPlayer[] | null
}

/**
 * Search for a player by name
 * Returns player image, position, and team
 */
export const searchPlayerByName = async (playerName: string): Promise<PlayerInfo> => {
  try {
    const cleanName = playerName.trim()

    // Check if player has a manual override (for players search can't find)
    const overrideId = getPlayerIdOverride(cleanName)
    if (overrideId) {
      console.log(`🔧 Using manual override for "${cleanName}" (ID: ${overrideId})`)
      const lookupResponse = await fetch(
        `${SPORTSDB_API_URL}/lookupplayer.php?id=${overrideId}`
      )

      if (lookupResponse.ok) {
        const lookupData: SportsDBResponse = await lookupResponse.json()
        if (lookupData.player && lookupData.player.length > 0) {
          const player = lookupData.player[0]
          console.log(`✅ Found via override: ${player.strPlayer} (${player.strPosition || 'Unknown position'})`)
          return {
            imageUrl: player.strCutout || player.strThumb || null,
            position: player.strPosition || null,
            team: player.strTeam || null
          }
        }
      }
    }

    // Try searching with original name first
    let response = await fetch(
      `${SPORTSDB_API_URL}/searchplayers.php?p=${encodeURIComponent(cleanName)}`
    )

    if (!response.ok) {
      console.error('SportsDB API error:', response.status)
      return { imageUrl: null, position: null, team: null }
    }

    let data: SportsDBResponse = await response.json()

    // If no results and name has special characters, try without them
    if ((!data.player || data.player.length === 0) && /[''`]/.test(cleanName)) {
      const nameWithoutSpecialChars = cleanName.replace(/[''`]/g, '')
      console.log(`Retrying "${playerName}" without apostrophes: "${nameWithoutSpecialChars}"`)

      response = await fetch(
        `${SPORTSDB_API_URL}/searchplayers.php?p=${encodeURIComponent(nameWithoutSpecialChars)}`
      )

      if (response.ok) {
        data = await response.json()
      }
    }

    // Check if player found
    if (!data.player || data.player.length === 0) {
      console.log(`❌ No player found on SportsDB for: ${playerName}`)
      return { imageUrl: null, position: null, team: null }
    }

    // Get first matching player
    const player = data.player[0]
    console.log(`✅ Found on SportsDB: ${player.strPlayer} (${player.strPosition || 'Unknown position'})`)

    return {
      imageUrl: player.strCutout || player.strThumb || null,
      position: player.strPosition || null,
      team: player.strTeam || null
    }

  } catch (error) {
    console.error(`Error fetching player data for ${playerName}:`, error)
    return { imageUrl: null, position: null, team: null }
  }
}

/**
 * Batch fetch images for multiple players
 * Returns a map of player name -> image URL
 */
export const batchFetchPlayerImages = async (
  playerNames: string[]
): Promise<Map<string, string>> => {
  const imageMap = new Map<string, string>()

  // Fetch images in parallel (with reasonable delay to avoid rate limiting)
  const promises = playerNames.map(async (name, index) => {
    // Add small delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, index * 100))

    const playerInfo = await searchPlayerByName(name)
    if (playerInfo && playerInfo.imageUrl) {
      imageMap.set(name, playerInfo.imageUrl)
    }
  })

  await Promise.all(promises)

  return imageMap
}

/**
 * Get a placeholder image URL for when player image is not found
 */
export const getPlaceholderImage = (): string => {
  // Return a simple data URL for a placeholder avatar
  return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect fill="%234B5563" width="100" height="100"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="white" font-family="Arial" font-size="40"%3E%3F%3C/text%3E%3C/svg%3E'
}
