/**
 * UPGRADED Player Database Builder
 *
 * Improvements:
 * - Incremental saves (progress not lost)
 * - Resume from where it left off
 * - Better rate limit handling
 * - Retry logic with exponential backoff
 * - Configurable delays
 */

import { ethers } from 'ethers'
import * as fs from 'fs'
import * as path from 'path'

const RPC_URL = 'https://rpc-megaeth-mainnet.globalstake.io'
const CONTRACT_ADDRESS = '0xf3393dC9E747225FcA0d61BfE588ba2838AFb077'
const SPORTSDB_API_URL = 'https://www.thesportsdb.com/api/v1/json/3'

// Configuration
const CONFIG = {
  delayBetweenRequests: 15000, // 15 seconds (increased from 10)
  maxRetries: 3,
  retryDelay: 5000,
  saveInterval: 10, // Save every 10 players
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
  lastAttempt?: string // ISO timestamp of last attempt
  attempts?: number // Number of attempts
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Load existing database if it exists
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
        const delay = CONFIG.retryDelay * Math.pow(2, attempt - 1) // Exponential backoff
        console.log(`  ⏳ Retry ${attempt}/${retries} after ${delay}ms delay...`)
        await sleep(delay)
      }

      // Try original name
      let url = `${SPORTSDB_API_URL}/searchplayers.php?p=${encodeURIComponent(playerName)}`
      let response = await fetch(url)

      // Check if we got JSON (not HTML error page)
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        if (attempt === retries - 1) {
          console.log(`  ⚠️  Rate limited after ${retries} attempts`)
          return { imageUrl: null, position: null, team: null, sportsDbId: null }
        }
        continue // Retry
      }

      let data = await response.json()

      // If not found and has apostrophe, try without
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

      // Not found but request succeeded
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
async function buildPlayerDatabase() {
  console.log('🚀 UPGRADED Player Database Builder\n')
  console.log('⚙️  Configuration:')
  console.log(`   Delay between requests: ${CONFIG.delayBetweenRequests}ms`)
  console.log(`   Max retries: ${CONFIG.maxRetries}`)
  console.log(`   Save interval: Every ${CONFIG.saveInterval} players\n`)

  // Paths
  const outputPath = path.join(__dirname, '../public/player-database.json')
  const tempPath = path.join(__dirname, '../public/player-database.temp.json')

  // Load existing database
  let playerDatabase = loadExistingDatabase(outputPath)
  console.log(`📂 Loaded existing database: ${playerDatabase.length} players\n`)

  // Connect to contract
  const provider = new ethers.JsonRpcProvider(RPC_URL)
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)

  // Get total number of players
  const nextPlayerId = await contract.nextPlayerId()
  const totalPlayers = Number(nextPlayerId)
  console.log(`📊 Total players in TopStrike: ${totalPlayers - 1}\n`)

  // Build index of existing players
  const existingPlayers = new Map<number, PlayerData>()
  playerDatabase.forEach(p => existingPlayers.set(p.id, p))

  let newPlayersFound = 0
  let updatedPlayers = 0

  // Fetch each player
  for (let id = 1; id < totalPlayers; id++) {
    try {
      // Get player from contract
      const playerData = await contract.players(id)
      const name = playerData.name

      // Check if we already have this player with data
      const existing = existingPlayers.get(id)

      if (existing && existing.imageUrl) {
        console.log(`[${id}/${totalPlayers - 1}] ${name} - ✅ Already cached`)
        continue
      }

      // Check if we recently failed to find this player (skip for now)
      if (existing && existing.attempts && existing.attempts >= CONFIG.maxRetries) {
        const lastAttempt = existing.lastAttempt ? new Date(existing.lastAttempt) : null
        if (lastAttempt) {
          const hoursSince = (Date.now() - lastAttempt.getTime()) / (1000 * 60 * 60)
          if (hoursSince < 24) {
            console.log(`[${id}/${totalPlayers - 1}] ${name} - ⏭️  Skipping (failed recently)`)
            continue
          }
        }
      }

      console.log(`[${id}/${totalPlayers - 1}] ${name}`)

      // Delay before API call to avoid rate limiting
      await sleep(CONFIG.delayBetweenRequests)

      // Search TheSportsDB
      const sportsData = await searchSportsDB(name)

      // Create or update player data
      const playerEntry: PlayerData = {
        id,
        name,
        imageUrl: sportsData.imageUrl || null,
        position: sportsData.position || null,
        team: sportsData.team || null,
        sportsDbId: sportsData.sportsDbId || null,
        lastAttempt: new Date().toISOString(),
        attempts: (existing?.attempts || 0) + 1
      }

      // Update or add to database
      if (existing) {
        const index = playerDatabase.findIndex(p => p.id === id)
        playerDatabase[index] = playerEntry
        updatedPlayers++
      } else {
        playerDatabase.push(playerEntry)
        newPlayersFound++
      }

      if (sportsData.imageUrl) {
        console.log(`  ✅ Found: ${sportsData.position || 'Unknown'} - ${sportsData.team || 'Unknown team'}`)
      } else {
        console.log(`  ❌ Not found on SportsDB`)
      }

      // Incremental save
      if (id % CONFIG.saveInterval === 0) {
        saveDatabase(tempPath, playerDatabase)
        console.log(`  💾 Progress saved (${id}/${totalPlayers - 1})`)
      }

    } catch (error) {
      console.error(`  ❌ Error fetching player ${id}:`, error)
    }
  }

  // Sort by ID before final save
  playerDatabase.sort((a, b) => a.id - b.id)

  // Final save
  saveDatabase(outputPath, playerDatabase)

  // Remove temp file
  if (fs.existsSync(tempPath)) {
    fs.unlinkSync(tempPath)
  }

  // Stats
  const foundCount = playerDatabase.filter(p => p.imageUrl).length
  const notFoundCount = playerDatabase.filter(p => !p.imageUrl).length

  console.log(`\n✅ Database build complete!`)
  console.log(`📁 Saved to: ${outputPath}`)
  console.log(`\n📊 Final Stats:`)
  console.log(`   Total players: ${playerDatabase.length}`)
  console.log(`   Found on SportsDB: ${foundCount} (${Math.round(foundCount / playerDatabase.length * 100)}%)`)
  console.log(`   Not found: ${notFoundCount} (${Math.round(notFoundCount / playerDatabase.length * 100)}%)`)
  console.log(`   New players found this run: ${newPlayersFound}`)
  console.log(`   Updated players: ${updatedPlayers}`)
}

// Run the script
buildPlayerDatabase().catch(console.error)
