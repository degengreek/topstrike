import { ethers } from 'ethers'

// MegaETH Configuration
export const MEGAETH_RPC_URL = 'https://rpc-megaeth-mainnet.globalstake.io'
export const TOPSTRIKE_CONTRACT_ADDRESS = '0xf3393dC9E747225FcA0d61BfE588ba2838AFb077'

// Contract ABI - only the functions we need
const CONTRACT_ABI = [
  // Get player info
  "function players(uint256) view returns (string name, bool tradingEnabled, uint256 ipoWindowStartTimestamp, uint256 ipoWindowEndTimestamp)",

  // Get all players (with pagination)
  "function getAllPlayers(uint256 offset, uint256 limit) view returns (uint256[] ids, string[] names, bool[] tradingEnableds)",

  // Get user's portfolio
  "function getPortfolioHoldingsInUnits(address user, uint256 offset, uint256 limit) view returns (uint256[] playerIds, uint256[] quantities)",

  // Get user's holding for specific player in full shares
  "function getUserPlayerHoldingInFullShares(address user, uint256 playerId) view returns (uint256)",

  // Get shares supply (in units)
  "function sharesSupply(uint256 playerId) view returns (uint256)",

  // Get buy price for amount of units
  "function getBuyPriceByUnits(uint256 playerId, uint256 amountUnits) view returns (uint256)",

  // Constants
  "function ONE_FULL_SHARE_IN_UNITS() view returns (uint256)",

  // Get next player ID
  "function nextPlayerId() view returns (uint256)"
]

/**
 * Get provider instance for MegaETH
 */
export const getProvider = () => {
  return new ethers.JsonRpcProvider(MEGAETH_RPC_URL)
}

/**
 * Get TopStrike contract instance
 */
export const getContract = () => {
  const provider = getProvider()
  return new ethers.Contract(TOPSTRIKE_CONTRACT_ADDRESS, CONTRACT_ABI, provider)
}

/**
 * Player interface matching contract data
 */
export interface PlayerData {
  id: number
  name: string
  tradingEnabled: boolean
  sharesOwned: string // Amount of shares user owns (in units)
  sharesOwnedInFullShares: number // User's shares as full shares (cards)
  totalSupplyInFullShares: number // Total supply as full shares
  currentPriceInWei: string // Current buy price for 1 share
}

/**
 * Fetch player portfolio for a wallet address
 * Returns list of players the user has shares in
 */
export const fetchUserPortfolio = async (walletAddress: string): Promise<PlayerData[]> => {
  try {
    // Validate address
    if (!ethers.isAddress(walletAddress)) {
      throw new Error('Invalid wallet address')
    }

    const contract = getContract()

    // Get user's portfolio (all players they have shares in)
    // Using offset=0, limit=100 to get up to 100 players
    const [playerIds, quantities] = await contract.getPortfolioHoldingsInUnits(
      walletAddress,
      0,
      100
    )

    // If no players found
    if (playerIds.length === 0) {
      throw new Error('No player shares found for this wallet')
    }

    // Get constants from contract
    const ONE_FULL_SHARE = await contract.ONE_FULL_SHARE_IN_UNITS()
    console.log('📊 One full share in units:', ONE_FULL_SHARE.toString())

    // Fetch details for each player
    const players: PlayerData[] = []

    for (let i = 0; i < playerIds.length; i++) {
      const playerId = Number(playerIds[i])
      const sharesOwnedInUnits = quantities[i]

      try {
        // Fetch all data in parallel for this player
        // Note: 1 card = 0.5 full shares, so get price for 0.5 shares
        const ONE_CARD_IN_UNITS = ONE_FULL_SHARE / BigInt(2)
        const [playerData, fullSharesFromContract, totalSupply, priceFor1Card] = await Promise.all([
          contract.players(playerId),
          contract.getUserPlayerHoldingInFullShares(walletAddress, playerId),
          contract.sharesSupply(playerId),
          contract.getBuyPriceByUnits(playerId, ONE_CARD_IN_UNITS)
        ])

        // TopStrike: 1 card = 0.5 shares, so we calculate from raw units
        // Cards = (units / ONE_FULL_SHARE) * 2
        const sharesAsDecimal = Number(sharesOwnedInUnits) / Number(ONE_FULL_SHARE)
        const userCardsOwned = Math.floor(sharesAsDecimal * 2) // Multiply by 2 to convert shares to cards

        const totalSharesAsDecimal = Number(totalSupply) / Number(ONE_FULL_SHARE)
        const totalCards = Math.floor(totalSharesAsDecimal * 2)

        console.log(`\n🎮 Player: ${playerData.name}`)
        console.log(`   Raw units owned: ${sharesOwnedInUnits.toString()}`)
        console.log(`   ONE_FULL_SHARE: ${ONE_FULL_SHARE.toString()}`)
        console.log(`   Shares as decimal: ${sharesAsDecimal}`)
        console.log(`   ✅ Cards owned: ${userCardsOwned}`)
        console.log(`   ✅ Total cards: ${totalCards}`)
        console.log(`   💰 Price per card: ${priceFor1Card.toString()} wei`)

        players.push({
          id: playerId,
          name: playerData.name,
          tradingEnabled: playerData.tradingEnabled,
          sharesOwned: sharesOwnedInUnits.toString(),
          sharesOwnedInFullShares: userCardsOwned,
          totalSupplyInFullShares: totalCards,
          currentPriceInWei: priceFor1Card.toString()
        })

      } catch (err) {
        console.error(`Failed to fetch player ${playerId}:`, err)
        // Continue with other players
      }
    }

    return players
  } catch (error: any) {
    console.error('Error fetching portfolio:', error)

    // Provide user-friendly error messages
    if (error.code === 'NETWORK_ERROR') {
      throw new Error('Unable to connect to MegaETH network. Please try again.')
    }
    if (error.message?.includes('No player shares found')) {
      throw error
    }

    throw new Error(`Failed to fetch player data: ${error.message}`)
  }
}

/**
 * Fetch details for a specific player by ID
 */
export const fetchPlayerById = async (playerId: number): Promise<PlayerData | null> => {
  try {
    const contract = getContract()
    const playerData = await contract.players(playerId)

    return {
      id: playerId,
      name: playerData.name,
      tradingEnabled: playerData.tradingEnabled,
      sharesOwned: '0',
      sharesOwnedInFullShares: 0,
      totalSupplyInFullShares: 0,
      currentPriceInWei: '0'
    }
  } catch (error) {
    console.error(`Error fetching player ${playerId}:`, error)
    return null
  }
}

/**
 * Get total number of players in the contract
 */
export const getTotalPlayers = async (): Promise<number> => {
  try {
    const contract = getContract()
    const nextId = await contract.nextPlayerId()
    return Number(nextId) - 1 // nextPlayerId is the next available ID
  } catch (error) {
    console.error('Error fetching total players:', error)
    return 0
  }
}
