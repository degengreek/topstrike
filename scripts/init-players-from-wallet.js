/**
 * Initialize Players from Wallet
 * Fetches player IDs from a wallet and adds them to the database
 *
 * Usage:
 *   node scripts/init-players-from-wallet.js <wallet_address>
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const { ethers } = require('ethers')

// Supabase setup
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// MegaETH contract setup
const CONTRACT_ADDRESS = '0xf3393dC9E747225FcA0d61BfE588ba2838AFb077'
const RPC_URL = 'https://rpc.megaeth.com'

const CONTRACT_ABI = [
  'function getUserHoldings(address user) view returns (tuple(uint256 id, uint256 shares)[] memory)'
]

/**
 * Fetch player holdings from blockchain
 */
async function fetchPlayersFromWallet(walletAddress) {
  console.log(`🔗 Connecting to MegaETH blockchain...`)
  console.log(`📍 Wallet: ${walletAddress}\n`)

  const provider = new ethers.JsonRpcProvider(RPC_URL)
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)

  console.log(`📊 Fetching player holdings...`)
  const holdings = await contract.getUserHoldings(walletAddress)

  const players = holdings.map(h => ({
    id: h.id.toString(),
    shares: h.shares.toString()
  }))

  console.log(`✅ Found ${players.length} players in wallet\n`)

  return players
}

/**
 * Initialize player scores in database
 */
async function initializePlayerScores(players) {
  console.log(`💾 Adding players to database...`)

  const records = players.map(p => ({
    player_id: p.id,
    player_name: `Player ${p.id}`, // Will be updated when scores are fetched
    most_recent_score: 0,
    match_date: null,
    match_opponent: null,
    match_state: null
  }))

  const { error } = await supabase
    .from('player_scores')
    .upsert(records, { onConflict: 'player_id' })

  if (error) {
    console.error('❌ Error saving to database:', error)
    return false
  }

  console.log(`✅ Successfully initialized ${players.length} players!`)
  return true
}

/**
 * Main function
 */
async function main() {
  const walletAddress = process.argv[2]

  if (!walletAddress) {
    console.error('❌ Error: Wallet address required')
    console.log('\nUsage:')
    console.log('  node scripts/init-players-from-wallet.js <wallet_address>')
    console.log('\nExample:')
    console.log('  node scripts/init-players-from-wallet.js 0x1234...')
    process.exit(1)
  }

  console.log('🚀 Initializing players from wallet\n')

  const players = await fetchPlayersFromWallet(walletAddress)
  const success = await initializePlayerScores(players)

  if (success) {
    console.log('\n✨ Done! Now run the score fetcher:')
    console.log('   node scripts/fetch-scores-local.js')
  }
}

main().catch(console.error)
