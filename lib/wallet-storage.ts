/**
 * Client-side wallet storage using localStorage
 * Persists wallet links between sessions
 */

const STORAGE_KEY = 'topstrike_wallet_links'

interface WalletLink {
  twitterId: string
  twitterUsername: string
  walletAddress: string
  topStrikeUsername?: string  // Optional: TopStrike username if known
  linkedAt: string
}

/**
 * Save wallet link to localStorage
 */
export function saveWalletLink(
  twitterId: string,
  twitterUsername: string,
  walletAddress: string,
  topStrikeUsername?: string
): void {
  try {
    const links = getAllWalletLinks()

    // Update or add
    const existingIndex = links.findIndex(l => l.twitterId === twitterId)
    const newLink: WalletLink = {
      twitterId,
      twitterUsername,
      walletAddress,
      topStrikeUsername,  // Store TopStrike username if provided
      linkedAt: new Date().toISOString()
    }

    if (existingIndex >= 0) {
      links[existingIndex] = newLink
    } else {
      links.push(newLink)
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(links))
    console.log('✅ Wallet link saved to localStorage')
  } catch (error) {
    console.error('Failed to save wallet link:', error)
  }
}

/**
 * Get wallet address for a Twitter user
 */
export function getWalletLink(twitterId: string): string | null {
  try {
    const links = getAllWalletLinks()
    const link = links.find(l => l.twitterId === twitterId)
    return link?.walletAddress || null
  } catch (error) {
    console.error('Failed to get wallet link:', error)
    return null
  }
}

/**
 * Get all wallet links
 */
export function getAllWalletLinks(): WalletLink[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Failed to get wallet links:', error)
    return []
  }
}

/**
 * Remove wallet link
 */
export function removeWalletLink(twitterId: string): void {
  try {
    const links = getAllWalletLinks()
    const filtered = links.filter(l => l.twitterId !== twitterId)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    console.log('✅ Wallet link removed')
  } catch (error) {
    console.error('Failed to remove wallet link:', error)
  }
}

/**
 * Check if wallet is linked
 */
export function hasWalletLink(twitterId: string): boolean {
  return getWalletLink(twitterId) !== null
}
