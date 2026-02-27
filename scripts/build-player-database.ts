/**
 * Build Player Database Script
 *
 * Fetches all players from TopStrike contract and their data from TheSportsDB
 * Saves to a JSON file for the app to use (no repeated API calls!)
 */

import { ethers } from 'ethers'
import * as fs from 'fs'
import * as path from 'path'

const RPC_URL = 'https://rpc-megaeth-mainnet.globalstake.io'
const CONTRACT_ADDRESS = '0xf3393dC9E747225FcA0d61BfE588ba2838AFb077'

const SPORTSDB_API_URL = 'https://www.thesportsdb.com/api/v1/json/3'

// Minimal ABI for what we need
const CONTRACT_ABI = [
  'function nextPlayerId() view returns (uint256)',
  'function players(uint256) view returns (string name, bool tradingEnabled, uint256 ipoWindowStartTimestamp, uint256 ipoWindowEndTimestamp)'
]

interface PlayerData {
  id: number
  name: string
  imageUrl: string | null
  position: string | null
  team: string | null
  sportsDbId: string | null
}

interface SportsDBPlayer {
  idPlayer: string
  strPlayer: string
  strThumb?: string
  strCutout?: string
  strPosition?: string
  strTeam?: string
}

interface SportsDBResponse {
  player?: SportsDBPlayer[] | null
}

/**
 * Search TheSportsDB for a player
 */
async function searchSportsDB(playerName: string): Promise<Partial<PlayerData>> {
  try {
    // Try original name
    let url = `${SPORTSDB_API_URL}/searchplayers.php?p=${encodeURIComponent(playerName)}`
    let response = await fetch(url)

    // Check if we got JSON (not HTML error page)
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      console.log(`  ⚠️  Rate limited or error response`)
      return { imageUrl: null, position: null, team: null, sportsDbId: null }
    }

    let data: SportsDBResponse = await response.json()

    // If not found and has apostrophe, try without
    if ((!data.player || data.player.length === 0) && /[''`]/.test(playerName)) {
      const nameWithoutApostrophe = playerName.replace(/[''`]/g, '')
      console.log(`  Retry without apostrophe: ${nameWithoutApostrophe}`)
      url = `${SPORTSDB_API_URL}/searchplayers.php?p=${encodeURIComponent(nameWithoutApostrophe)}`
      response = await fetch(url)
      data = await response.json()
    }

    if (data.player && data.player.length > 0) {
      const player = data.player[0]
      return {
        imageUrl: player.strCutout || player.strThumb || null,
        position: player.strPosition || null,
        team: player.strTeam || null,
        sportsDbId: player.idPlayer
      }
    }

    return {
      imageUrl: null,
      position: null,
      team: null,
      sportsDbId: null
    }
  } catch (error) {
    console.error(`  Error fetching from SportsDB:`, error)
    return {
      imageUrl: null,
      position: null,
      team: null,
      sportsDbId: null
    }
  }
}

/**
 * Main function
 */
async function buildPlayerDatabase() {
  console.log('🚀 Building TopStrike Player Database...\n')

  // Connect to contract
  const provider = new ethers.JsonRpcProvider(RPC_URL)
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)

  // Get total number of players
  const nextPlayerId = await contract.nextPlayerId()
  const totalPlayers = Number(nextPlayerId)
  console.log(`📊 Total players in TopStrike: ${totalPlayers}\n`)

  const playerDatabase: PlayerData[] = []

  // Fetch each player
  for (let id = 1; id < totalPlayers; id++) {
    try {
      // Get player from contract
      const playerData = await contract.players(id)
      const name = playerData.name

      console.log(`[${id}/${totalPlayers - 1}] ${name}`)

      // Search TheSportsDB (with delay to avoid rate limiting)
      await new Promise(resolve => setTimeout(resolve, 10000)) // 10 second delay to avoid rate limits

      const sportsData = await searchSportsDB(name)

      playerDatabase.push({
        id,
        name,
        imageUrl: sportsData.imageUrl || null,
        position: sportsData.position || null,
        team: sportsData.team || null,
        sportsDbId: sportsData.sportsDbId || null
      })

      if (sportsData.imageUrl) {
        console.log(`  ✅ Found: ${sportsData.position || 'Unknown'} - ${sportsData.team || 'Unknown team'}`)
      } else {
        console.log(`  ❌ Not found on SportsDB`)
      }

    } catch (error) {
      console.error(`  Error fetching player ${id}:`, error)
      playerDatabase.push({
        id,
        name: 'Unknown',
        imageUrl: null,
        position: null,
        team: null,
        sportsDbId: null
      })
    }
  }

  // Save to JSON file in public folder (so it can be fetched via HTTP)
  const outputPath = path.join(__dirname, '../public/player-database.json')
  fs.writeFileSync(outputPath, JSON.stringify(playerDatabase, null, 2))

  console.log(`\n✅ Player database saved to: ${outputPath}`)
  console.log(`📊 Stats:`)
  console.log(`   Total players: ${playerDatabase.length}`)
  console.log(`   Found on SportsDB: ${playerDatabase.filter(p => p.imageUrl).length}`)
  console.log(`   Not found: ${playerDatabase.filter(p => !p.imageUrl).length}`)
}

// Run the script
buildPlayerDatabase().catch(console.error)
