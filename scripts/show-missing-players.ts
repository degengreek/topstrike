/**
 * Show Missing Players
 * Lists all players that don't have data from TheSportsDB
 */

import * as fs from 'fs'
import * as path from 'path'

interface PlayerData {
  id: number
  name: string
  imageUrl: string | null
  position: string | null
  team: string | null
}

async function showMissingPlayers() {
  const dbPath = path.join(__dirname, '../public/player-database.json')
  const database: PlayerData[] = JSON.parse(fs.readFileSync(dbPath, 'utf-8'))

  const missingPlayers = database.filter(p => !p.imageUrl || !p.position)

  console.log('🔍 Missing Players (no data from TheSportsDB)\n')
  console.log('=' .repeat(60))
  console.log(`Total missing: ${missingPlayers.length}/${database.length}\n`)

  missingPlayers.forEach((player, index) => {
    console.log(`${index + 1}. [ID: ${player.id}] ${player.name}`)
    console.log(`   Search: https://www.thesportsdb.com/search.php?s=${encodeURIComponent(player.name)}`)
    console.log('')
  })

  console.log('=' .repeat(60))
  console.log('\n💡 How to add missing players:')
  console.log('1. Search for each player on TheSportsDB.com')
  console.log('2. Find their position and team')
  console.log('3. Add to lib/verified-players.ts')
  console.log('\nExample:')
  console.log(`"${missingPlayers[0]?.name}": {`)
  console.log(`  position: "Central Midfield",  // From TheSportsDB`)
  console.log(`  team: "Manchester City"        // From TheSportsDB`)
  console.log(`},`)
}

showMissingPlayers().catch(console.error)
