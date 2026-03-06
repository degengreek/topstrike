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

// Supabase setup
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Configuration
const FETCH_INTERVAL = 60 * 60 * 1000 // 1 hour in milliseconds
const MAX_PLAYER_ID = 200 // Adjust this based on total players in TopStrike
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
async function fetchPlayerScore(playerId, playerName, index, total) {
  try {
    const url = `https://play.topstrike.io/api/fapi-server/player-match-history?tokenId=${playerId}&limit=1`

    // Add timeout to prevent hanging
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Referer': 'https://play.topstrike.io/'
      },
      signal: controller.signal
    })

    clearTimeout(timeout)

    if (!response.ok) {
      // Player doesn't exist or no data - skip silently
      if (response.status === 404 || response.status === 400) {
        if (index % 20 === 0) console.log(`  [${index}/${total}] ⏭️  Skipping...`)
        return null
      }
      throw new Error(`API returned ${response.status}`)
    }

    const data = await response.json()

    // No match history - skip
    if (!data || data.length === 0) {
      return null
    }

    // Get most recent match
    const match = data[0]

    // Extract actual player name if available
    const actualPlayerName = match.playerTeamName ? `${playerName} (${match.playerTeamName})` : playerName

    if (index % 10 === 0) {
      console.log(`  [${index}/${total}] ✅ Player ${playerId}: ${match.totalScore} pts`)
    }

    return {
      player_id: playerId,
      player_name: actualPlayerName,
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
 * Fetch all scores and update database
 */
async function fetchAndUpdateScores() {
  console.log('\n🚀 Starting score fetch...')
  console.log(`⏰ ${new Date().toLocaleString()}\n`)

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
    const score = await fetchPlayerScore(player.id, player.name, i + 1, players.length)

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
