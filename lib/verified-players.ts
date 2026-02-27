/**
 * Verified Player Data - Manually curated, highest priority
 * This data overrides TheSportsDB and cache
 */

import playerDataJson from './player-data.json'

interface VerifiedPlayer {
  position: string
  team: string
  verified: boolean
  notes?: string
}

interface PlayerDataFile {
  comment: string
  players: Record<string, VerifiedPlayer>
}

const playerData = playerDataJson as PlayerDataFile

/**
 * Get verified player data (manually curated)
 * Returns null if player not in verified list
 */
export const getVerifiedPlayerData = (playerName: string): {
  position: string
  team: string
} | null => {
  const verified = playerData.players[playerName]

  if (!verified || !verified.verified) {
    return null
  }

  return {
    position: verified.position,
    team: verified.team
  }
}

/**
 * Check if a player has verified data
 */
export const hasVerifiedData = (playerName: string): boolean => {
  return !!playerData.players[playerName]?.verified
}

/**
 * Get all verified player names
 */
export const getVerifiedPlayerNames = (): string[] => {
  return Object.keys(playerData.players).filter(
    name => playerData.players[name].verified
  )
}

/**
 * Get stats about verified data
 */
export const getVerifiedStats = () => {
  const all = Object.values(playerData.players)
  return {
    total: all.length,
    verified: all.filter(p => p.verified).length,
    needsReview: all.filter(p => !p.verified).length
  }
}
