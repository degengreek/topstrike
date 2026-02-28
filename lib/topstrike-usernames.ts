/**
 * TopStrike Username Mapping
 * Manual mapping of wallet addresses to TopStrike usernames
 *
 * Add entries as you discover users' TopStrike usernames:
 * "walletAddress": "topStrikeUsername"
 */

export const TOPSTRIKE_USERNAMES: Record<string, string> = {
  // Example:
  // "0xcea46daf960e65a56350b6968c40bb9cb1fb81a4": "xxbozohead",

  // Add your mappings here...
}

/**
 * Get TopStrike username for a wallet address
 * Returns null if no mapping exists
 */
export function getTopStrikeUsername(walletAddress: string): string | null {
  const normalizedAddress = walletAddress.toLowerCase()
  return TOPSTRIKE_USERNAMES[normalizedAddress] || null
}
