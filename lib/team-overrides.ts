/**
 * Team overrides for players with incorrect/missing team data
 * Use this when TheSportsDB returns wrong data (retired players, wrong teams, etc.)
 */

interface PlayerTeamOverride {
  team: string
  position?: string  // Optional: also override position if wrong
}

export const TEAM_OVERRIDES: Record<string, PlayerTeamOverride> = {
  // Players with incorrect TheSportsDB data
  "Mohamed Amoura": {
    team: "Wolfsburg",
    position: "Centre-Forward"
  },
  "Micky van de Ven": {
    team: "Tottenham Hotspur",
    position: "Centre-Back"
  },
  // Add more as needed
  // "Player Name": { team: "Team Name", position: "Position" }
}

/**
 * Get team override for a player
 */
export const getTeamOverride = (playerName: string): PlayerTeamOverride | null => {
  return TEAM_OVERRIDES[playerName] || null
}
