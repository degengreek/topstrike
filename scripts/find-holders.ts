/**
 * Helper script to find wallet addresses that own TopStrike player shares
 * Run with: npx ts-node scripts/find-holders.ts
 */

import { getContract } from '../lib/megaeth'

async function findHolders() {
  try {
    console.log('🔍 Searching for TopStrike player holders...\n')

    const contract = getContract()

    // Get total number of players
    const nextPlayerId = await contract.nextPlayerId()
    const totalPlayers = Number(nextPlayerId) - 1

    console.log(`📊 Total players in contract: ${totalPlayers}\n`)

    // Get first few players to see their names
    console.log('Top 10 Players:')
    console.log('─'.repeat(50))

    for (let i = 1; i <= Math.min(10, totalPlayers); i++) {
      try {
        const player = await contract.players(i)
        const supply = await contract.sharesSupply(i)
        console.log(`${i}. ${player.name} - Supply: ${supply.toString()} units`)
      } catch (err) {
        console.log(`${i}. [Error fetching player]`)
      }
    }

    console.log('\n📝 Note: To find wallet addresses that own shares:')
    console.log('1. Visit: https://megaeth.blockscout.com/address/0xf3393dC9E747225FcA0d61BfE588ba2838AFb077')
    console.log('2. Click the "Transactions" or "Events" tab')
    console.log('3. Look for addresses that appear multiple times (active users)')
    console.log('4. Copy a wallet address and search for it in the app!')

    console.log('\n✨ Example addresses to test:')
    console.log('- Look for "Trade" events in the contract')
    console.log('- Check "from" addresses in recent transactions')
    console.log('- Any address that bought/sold shares recently')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

findHolders()
