/**
 * Manual player data overrides for players that TheSportsDB search cannot find
 * Maps player name -> TheSportsDB player ID
 */

export const PLAYER_OVERRIDES: Record<string, string> = {
  // Players with apostrophes or rate-limited during database build
  "Nico O'Reilly": "34244585",
  "Harvey Barnes": "34161470",
  "Christopher Nkunku": "34162097",
  "Matheus Cunha": "34169290",
  "Marcus Thuram": "34169289",
  "Rayan Ait Nouri": "34181914",
  "Matias Soule": "34247113",
  // Add more as needed
  // "Name": "TheSportsDB_ID"
}

/**
 * Get TheSportsDB player ID for a given player name
 */
export const getPlayerIdOverride = (playerName: string): string | null => {
  return PLAYER_OVERRIDES[playerName] || null
}
