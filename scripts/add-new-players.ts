/**
 * Add New Players Only Script
 *
 * Scans ONLY for players that are newer than what we have in the database.
 * Fast and efficient - doesn't re-scan existing players.
 */

import { ethers } from 'ethers'
import * as fs from 'fs'
import * as path from 'path'

const RPC_URL = 'https://rpc-megaeth-mainnet.globalstake.io'
const CONTRACT_ADDRESS = '0xf3393dC9E747225FcA0d61BfE588ba2838AFb077'
const SPORTSDB_API_URL = 'https://www.thesportsdb.com/api/v1/json/3'

// Configuration
const CONFIG = {
  delayBetweenRequests: 15000, // 15 seconds
  maxRetries: 3,
  retryDelay: 5000,
  saveInterval: 5, // Save every 5 new players
}

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
  lastAttempt?: string
  attempts?: number
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Load existing database
 */
function loadExistingDatabase(outputPath: string): PlayerData[] {
  if (fs.existsSync(outputPath)) {
    const content = fs.readFileSync(outputPath, 'utf-8')
    return JSON.parse(content)
  }
  return []
}

/**
 * Save database to disk
 */
function saveDatabase(outputPath: string, database: PlayerData[]) {
  fs.writeFileSync(outputPath, JSON.stringify(database, null, 2))
}

/**
 * Search TheSportsDB with retry logic
 */
async function searchSportsDB(
  playerName: string,
  retries = CONFIG.maxRetries
): Promise<Partial<PlayerData>> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = CONFIG.retryDelay * Math.pow(2, attempt - 1)
        console.log(`  ⏳ Retry ${attempt}/${retries} after ${delay}ms delay...`)
        await sleep(delay)
      }

      let url = `${SPORTSDB_API_URL}/searchplayers.php?p=${encodeURIComponent(playerName)}`
      let response = await fetch(url)

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        if (attempt === retries - 1) {
          console.log(`  ⚠️  Rate limited after ${retries} attempts`)
          return { imageUrl: null, position: null, team: null, sportsDbId: null }
        }
        continue
      }

      let data = await response.json()

      // Try without apostrophe if not found
      if ((!data.player || data.player.length === 0) && /[''`]/.test(playerName)) {
        const nameWithoutApostrophe = playerName.replace(/[''`]/g, '')
        console.log(`  🔄 Trying without apostrophe: ${nameWithoutApostrophe}`)
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
      if (attempt === retries - 1) {
        console.error(`  ❌ Error after ${retries} attempts:`, error)
        return {
          imageUrl: null,
          position: null,
          team: null,
          sportsDbId: null
        }
      }
    }
  }

  return { imageUrl: null, position: null, team: null, sportsDbId: null }
}

/**
 * Main function
 */
async function addNewPlayers() {
  console.log('🚀 Add New Players Script\n')
  console.log('⚙️  Configuration:')
  console.log(`   Delay between requests: ${CONFIG.delayBetweenRequests}ms`)
  console.log(`   Max retries: ${CONFIG.maxRetries}`)
  console.log(`   Save interval: Every ${CONFIG.saveInterval} players\n`)

  const outputPath = path.join(__dirname, '../public/player-database.json')

  // Load existing database
  let playerDatabase = loadExistingDatabase(outputPath)
  console.log(`📂 Loaded existing database: ${playerDatabase.length} players`)

  // Find highest player ID
  const maxExistingId = playerDatabase.length > 0
    ? Math.max(...playerDatabase.map(p => p.id))
    : 0

  console.log(`🔍 Highest existing player ID: ${maxExistingId}\n`)

  // Connect to contract
  const provider = new ethers.JsonRpcProvider(RPC_URL)
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)

  // Get total number of players
  const nextPlayerId = await contract.nextPlayerId()
  const totalPlayers = Number(nextPlayerId)
  console.log(`📊 Total players in TopStrike contract: ${totalPlayers - 1}`)

  const startFromId = maxExistingId + 1

  // Check if there are new players
  if (startFromId >= totalPlayers) {
    console.log('\n✅ No new players found! Database is already up to date.')
    console.log(`   Current players in database: ${maxExistingId}`)
    console.log(`   Total players in contract: ${totalPlayers - 1}`)
    return
  }

  const newPlayersCount = totalPlayers - startFromId
  console.log(`\n🆕 Found ${newPlayersCount} new player(s) to add!`)
  console.log(`📋 Scanning player IDs ${startFromId} to ${totalPlayers - 1}\n`)

  let addedCount = 0

  // Fetch only NEW players
  for (let id = startFromId; id < totalPlayers; id++) {
    try {
      const playerData = await contract.players(id)
      const name = playerData.name

      console.log(`[${id}/${totalPlayers - 1}] ${name} - 🆕 NEW`)

      // Delay to avoid rate limiting
      await sleep(CONFIG.delayBetweenRequests)

      // Search TheSportsDB
      const sportsData = await searchSportsDB(name)

      // Create new player entry
      const playerEntry: PlayerData = {
        id,
        name,
        imageUrl: sportsData.imageUrl || null,
        position: sportsData.position || null,
        team: sportsData.team || null,
        sportsDbId: sportsData.sportsDbId || null,
        lastAttempt: new Date().toISOString(),
        attempts: 1
      }

      playerDatabase.push(playerEntry)
      addedCount++

      if (sportsData.imageUrl) {
        console.log(`  ✅ Found: ${sportsData.position || 'Unknown'} - ${sportsData.team || 'Unknown team'}`)
      } else {
        console.log(`  ❌ Not found on SportsDB`)
      }

      // Incremental save
      if (addedCount % CONFIG.saveInterval === 0) {
        playerDatabase.sort((a, b) => a.id - b.id)
        saveDatabase(outputPath, playerDatabase)
        console.log(`  💾 Progress saved (${addedCount}/${newPlayersCount} new players added)`)
      }

    } catch (error) {
      console.error(`  ❌ Error fetching player ${id}:`, error)
    }
  }

  // Final save
  playerDatabase.sort((a, b) => a.id - b.id)
  saveDatabase(outputPath, playerDatabase)

  // Stats
  const foundCount = playerDatabase.filter(p => p.imageUrl).length
  const notFoundCount = playerDatabase.filter(p => !p.imageUrl).length

  console.log(`\n✅ New players added successfully!`)
  console.log(`📁 Saved to: ${outputPath}`)
  console.log(`\n📊 Stats:`)
  console.log(`   Total players in database: ${playerDatabase.length}`)
  console.log(`   New players added this run: ${addedCount}`)
  console.log(`   Found on SportsDB: ${foundCount} (${Math.round(foundCount / playerDatabase.length * 100)}%)`)
  console.log(`   Not found: ${notFoundCount} (${Math.round(notFoundCount / playerDatabase.length * 100)}%)`)
}

// Run the script
addNewPlayers().catch(console.error)
