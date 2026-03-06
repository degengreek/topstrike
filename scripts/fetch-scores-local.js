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
const WALLET_ADDRESS = process.env.WALLET_ADDRESS || '' // Your wallet address

/**
 * Fetch player IDs from wallet or database
 */
async function getPlayerIds() {
  if (WALLET_ADDRESS) {
    console.log(`📍 Fetching players from wallet: ${WALLET_ADDRESS}`)
    // You can add wallet fetching logic here if needed
    // For now, we'll get player IDs from the database
  }

  // Get existing player IDs from database
  const { data: scores, error } = await supabase
    .from('player_scores')
    .select('player_id, player_name')

  if (error) {
    console.error('❌ Error fetching player IDs from database:', error)
    return []
  }

  console.log(`📊 Found ${scores.length} players in database`)
  return scores.map(s => ({ id: s.player_id, name: s.player_name }))
}

/**
 * Fetch score for a single player from TopStrike API
 */
async function fetchPlayerScore(playerId, playerName) {
  try {
    const url = `https://play.topstrike.io/api/fapi-server/player-match-history?tokenId=${playerId}&limit=1`

    console.log(`  🔍 Fetching ${playerName} (ID: ${playerId})...`)

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Referer': 'https://play.topstrike.io/'
      }
    })

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`)
    }

    const data = await response.json()

    // No match history
    if (!data || data.length === 0) {
      console.log(`  ⚠️  No matches found for ${playerName}`)
      return {
        player_id: playerId,
        player_name: playerName,
        most_recent_score: 0,
        match_date: null,
        match_opponent: null,
        match_state: null
      }
    }

    // Get most recent match
    const match = data[0]
    console.log(`  ✅ ${playerName}: ${match.totalScore} pts vs ${match.opponentName}`)

    return {
      player_id: playerId,
      player_name: playerName,
      most_recent_score: match.totalScore,
      match_date: match.matchDate,
      match_opponent: match.opponentName,
      match_state: match.matchState
    }
  } catch (error) {
    console.error(`  ❌ Failed to fetch ${playerName}:`, error.message)
    return {
      player_id: playerId,
      player_name: playerName,
      most_recent_score: 0,
      match_date: null,
      match_opponent: null,
      match_state: null
    }
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

  // Fetch scores for each player
  for (const player of players) {
    const score = await fetchPlayerScore(player.id, player.name)
    results.push(score)

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200))
  }

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
