/**
 * Local Score Fetcher Script
 * Run this locally to fetch TopStrike scores and update Supabase database
 *
 * Usage:
 *   node scripts/fetch-scores-local.js
 *
 * Or run continuously:
 *   node scripts/fetch-scores-local.js --watch
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const { exec } = require('child_process')
const { promisify } = require('util')

const execAsync = promisify(exec)

// Supabase setup
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Configuration
const FETCH_INTERVAL = 60 * 60 * 1000 // 1 hour in milliseconds
const MAX_PLAYER_ID = 200 // Fetch all players
const START_PLAYER_ID = 1

/**
 * Get all player IDs to fetch
 * Fetches scores for ALL players in TopStrike (not wallet-specific)
 */
async function getPlayerIds() {
  console.log(`📊 Fetching scores for ALL players (ID ${START_PLAYER_ID} to ${MAX_PLAYER_ID})`)
  console.log(`   This benefits all users, not just one wallet!\n`)

  const players = []
  for (let id = START_PLAYER_ID; id <= MAX_PLAYER_ID; id++) {
    players.push({ id: id.toString(), name: `Player ${id}` })
  }

  return players
}

/**
 * Fetch score for a single player from TopStrike API
 */
async function fetchPlayerScore(playerId, playerName, index, total, gameweek) {
  try {
    const url = `https://play.topstrike.io/api/fapi-server/player-match-history?tokenId=${playerId}&limit=1`

    // Use curl instead of fetch to bypass Cloudflare
    const curlCommand = `curl -s "${url}" -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" -H "Accept: application/json" -H "Referer: https://play.topstrike.io/"`

    const { stdout, stderr } = await execAsync(curlCommand, { timeout: 10000 })

    if (stderr) {
      console.log(`  → curl error: ${stderr}`)
      return null
    }

    let data
    try {
      data = JSON.parse(stdout)
    } catch (e) {
      // Not valid JSON - probably Cloudflare or player doesn't exist
      return null
    }

    // No match history - skip
    if (!data || data.length === 0) {
      return null
    }

    // Get most recent match
    const match = data[0]

    // Check if match is within current gameweek
    const matchDate = new Date(match.matchDate)
    const gwStart = new Date(gameweek.start_date)
    const gwEnd = new Date(gameweek.end_date)

    // If match is NOT in current gameweek, set score to 0
    if (matchDate < gwStart || matchDate > gwEnd) {
      return {
        player_id: playerId,
        player_name: playerName,
        gameweek_id: gameweek.id,
        most_recent_score: 0, // Not in current gameweek
        match_date: null,
        match_opponent: null,
        match_state: null
      }
    }

    if (index % 10 === 0) {
      console.log(`  [${index}/${total}] ✅ Player ${playerId}: ${match.totalScore} pts (${match.matchDate})`)
    }

    return {
      player_id: playerId,
      player_name: playerName,
      gameweek_id: gameweek.id,
      most_recent_score: match.totalScore,
      match_date: match.matchDate,
      match_opponent: match.opponentName,
      match_state: match.matchState
    }
  } catch (error) {
    // Handle timeout or other errors
    if (error.name === 'AbortError') {
      if (index % 20 === 0) console.log(`  [${index}/${total}] ⏱️  Timeout, skipping...`)
    }
    // Skip players that error out (likely don't exist)
    return null
  }
}

/**
 * Get current active gameweek
 */
async function getCurrentGameweek() {
  const { data: gameweek, error } = await supabase
    .from('gameweeks')
    .select('*')
    .eq('is_active', true)
    .single()

  if (error || !gameweek) {
    console.error('❌ No active gameweek found!')
    return null
  }

  console.log(`📅 Current Gameweek: #${gameweek.week_number}`)
  console.log(`   Dates: ${gameweek.start_date} → ${gameweek.end_date}`)
  return gameweek
}

/**
 * Fetch all scores and update database
 */
async function fetchAndUpdateScores() {
  console.log('\n🚀 Starting score fetch...')
  console.log(`⏰ ${new Date().toLocaleString()}\n`)

  // Get current active gameweek
  const currentGameweek = await getCurrentGameweek()
  if (!currentGameweek) {
    console.log('❌ Cannot fetch scores without an active gameweek.')
    return
  }

  // Get player IDs
  const players = await getPlayerIds()

  if (players.length === 0) {
    console.log('❌ No players found. Add players to database first.')
    return
  }

  const results = []
  let successCount = 0
  let skipCount = 0

  // Fetch scores for each player
  for (let i = 0; i < players.length; i++) {
    const player = players[i]
    const score = await fetchPlayerScore(player.id, player.name, i + 1, players.length, currentGameweek)

    if (score) {
      results.push(score)
      successCount++
    } else {
      skipCount++
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 150))
  }

  console.log(`\n📊 Fetch complete: ${successCount} players found, ${skipCount} skipped`)

  // Save to database
  console.log('\n💾 Saving scores to database...')

  const { error } = await supabase
    .from('player_scores')
    .upsert(results, { onConflict: 'player_id' })

  if (error) {
    console.error('❌ Error saving to database:', error)
    return
  }

  const totalScore = results.reduce((sum, r) => sum + r.most_recent_score, 0)
  const avgScore = Math.round(totalScore / results.length)

  console.log('\n✅ Successfully updated scores!')
  console.log(`📈 Total: ${totalScore} pts | Average: ${avgScore} pts`)
  console.log(`📊 ${results.filter(r => r.most_recent_score > 0).length}/${results.length} players with scores\n`)
}

/**
 * Main function
 */
async function main() {
  const isWatchMode = process.argv.includes('--watch')

  if (isWatchMode) {
    console.log('👀 Running in watch mode (fetches every hour)')
    console.log('Press Ctrl+C to stop\n')

    // Run immediately
    await fetchAndUpdateScores()

    // Then run every hour
    setInterval(fetchAndUpdateScores, FETCH_INTERVAL)
  } else {
    // Run once
    await fetchAndUpdateScores()
    console.log('✨ Done! Run with --watch to keep it running.')
  }
}

// Run the script
main().catch(console.error)
