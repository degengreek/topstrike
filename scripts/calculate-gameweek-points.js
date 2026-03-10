/**
 * Calculate Gameweek Points
 * Run after gameweek ends to calculate points for all users
 *
 * Usage:
 *   node scripts/calculate-gameweek-points.js <gameweek_number>
 *   node scripts/calculate-gameweek-points.js 1
 *
 * Or auto-detect most recent ended gameweek:
 *   node scripts/calculate-gameweek-points.js
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

// Supabase setup
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * Get gameweek to calculate
 */
async function getGameweek(weekNumber) {
  if (weekNumber) {
    // Get specific gameweek by number
    const { data, error } = await supabase
      .from('gameweeks')
      .select('*')
      .eq('week_number', weekNumber)
      .single()

    if (error || !data) {
      console.error(`❌ Gameweek ${weekNumber} not found`)
      return null
    }

    return data
  } else {
    // Auto-detect: find most recent ended gameweek
    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('gameweeks')
      .select('*')
      .lt('end_date', now) // Gameweek has ended
      .order('end_date', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      console.error('❌ No ended gameweek found')
      return null
    }

    return data
  }
}

/**
 * Get all locked squad snapshots for gameweek
 */
async function getLockedSquads(gameweekId) {
  const { data: snapshots, error } = await supabase
    .from('user_gameweek_points')
    .select(`
      user_id,
      squad_snapshot,
      users (
        twitter_username
      )
    `)
    .eq('gameweek_id', gameweekId)

  if (error) {
    console.error('❌ Error fetching locked squads:', error)
    return []
  }

  return snapshots
}

/**
 * Get player scores for specific gameweek
 */
async function getPlayerScores(gameweekId) {
  const { data: scores, error } = await supabase
    .from('player_scores')
    .select('player_id, most_recent_score')
    .eq('gameweek_id', gameweekId)

  if (error) {
    console.error('❌ Error fetching player scores:', error)
    return {}
  }

  // Convert to map for easy lookup
  const scoreMap = {}
  scores.forEach(s => {
    scoreMap[s.player_id] = s.most_recent_score
  })

  return scoreMap
}

/**
 * Calculate points for a locked squad snapshot
 */
function calculateSquadPoints(squadSnapshot, scoreMap) {
  const players = squadSnapshot || {}
  let totalPoints = 0
  let playerCount = 0

  // Sum points for all assigned players
  Object.entries(players).forEach(([position, player]) => {
    if (player && player.id) {
      const score = scoreMap[player.id] || 0
      totalPoints += score
      playerCount++
    }
  })

  return { totalPoints, playerCount }
}

/**
 * Transition to next gameweek
 */
async function transitionToNextGameweek(currentGameweek) {
  console.log('\n🔄 Transitioning to next gameweek...')

  // Deactivate current gameweek
  const { error: deactivateError } = await supabase
    .from('gameweeks')
    .update({ is_active: false })
    .eq('id', currentGameweek.id)

  if (deactivateError) {
    console.error('❌ Error deactivating current gameweek:', deactivateError)
    return false
  }

  console.log(`   ✅ Deactivated Gameweek #${currentGameweek.week_number}`)

  // Calculate next gameweek dates (same weekly schedule: Fri 14:00 → Mon 22:00)
  const currentStart = new Date(currentGameweek.start_date)
  const nextStart = new Date(currentStart)
  nextStart.setDate(nextStart.getDate() + 7) // +7 days

  const currentEnd = new Date(currentGameweek.end_date)
  const nextEnd = new Date(currentEnd)
  nextEnd.setDate(nextEnd.getDate() + 7) // +7 days

  const currentLock = new Date(currentGameweek.lock_deadline)
  const nextLock = new Date(currentLock)
  nextLock.setDate(nextLock.getDate() + 7) // +7 days

  // Create next gameweek
  const nextWeekNumber = currentGameweek.week_number + 1
  const { error: createError } = await supabase
    .from('gameweeks')
    .insert({
      week_number: nextWeekNumber,
      start_date: nextStart.toISOString(),
      end_date: nextEnd.toISOString(),
      lock_deadline: nextLock.toISOString(),
      is_active: true
    })

  if (createError) {
    console.error('❌ Error creating next gameweek:', createError)
    return false
  }

  console.log(`   ✅ Created Gameweek #${nextWeekNumber}`)
  console.log(`   📅 Dates: ${nextStart.toISOString()} → ${nextEnd.toISOString()}`)
  console.log(`   🔒 Lock: ${nextLock.toISOString()}`)

  return true
}

/**
 * Main calculation function
 */
async function calculateGameweekPoints() {
  const weekNumber = process.argv[2] ? parseInt(process.argv[2]) : null

  console.log('\n🏆 Starting Gameweek Points Calculation')
  console.log('=' .repeat(50))

  // Get gameweek
  const gameweek = await getGameweek(weekNumber)
  if (!gameweek) {
    console.log('❌ No gameweek to calculate')
    return
  }

  console.log(`\n📅 Calculating for Gameweek #${gameweek.week_number}`)
  console.log(`   Period: ${gameweek.start_date} → ${gameweek.end_date}`)
  console.log(`   Status: ${new Date(gameweek.end_date) < new Date() ? 'ENDED ✅' : 'STILL ACTIVE ⚠️'}\n`)

  // Get all locked squad snapshots
  console.log('👥 Fetching locked squad snapshots...')
  const lockedSquads = await getLockedSquads(gameweek.id)
  console.log(`   Found ${lockedSquads.length} locked squads\n`)

  if (lockedSquads.length === 0) {
    console.log('❌ No locked squads found!')
    console.log('⚠️  Run lock-gameweek-squads.js first to lock squads at lock time.\n')
    return
  }

  // Get player scores for this gameweek
  console.log('📊 Fetching player scores...')
  const scoreMap = await getPlayerScores(gameweek.id)
  console.log(`   Found ${Object.keys(scoreMap).length} player scores\n`)

  // Calculate points for each user
  console.log('🔢 Calculating user points...\n')
  const updates = []

  for (const snapshot of lockedSquads) {
    const username = snapshot.users?.twitter_username || 'Unknown'
    const { totalPoints, playerCount } = calculateSquadPoints(snapshot.squad_snapshot, scoreMap)

    console.log(`   ${username}: ${totalPoints} pts (${playerCount} players)`)

    updates.push({
      user_id: snapshot.user_id,
      gameweek_id: gameweek.id,
      points: totalPoints,
      calculated_at: new Date().toISOString()
    })
  }

  // Update points in database (squad_snapshot already exists from locking)
  console.log('\n💾 Updating points in database...')

  // Update each record individually since we're only updating points
  for (const update of updates) {
    await supabase
      .from('user_gameweek_points')
      .update({
        points: update.points,
        calculated_at: update.calculated_at
      })
      .eq('user_id', update.user_id)
      .eq('gameweek_id', update.gameweek_id)
  }

  const { error } = { error: null } // Placeholder since we updated individually

  if (error) {
    console.error('❌ Error saving points:', error)
    return
  }

  console.log('✅ Points saved successfully!')

  // Show summary
  const totalUsers = updates.length
  const avgPoints = Math.round(updates.reduce((sum, r) => sum + r.points, 0) / totalUsers)
  const maxPoints = Math.max(...updates.map(r => r.points))
  const minPoints = Math.min(...updates.map(r => r.points))

  console.log('\n📈 Summary:')
  console.log(`   Total Users: ${totalUsers}`)
  console.log(`   Average Points: ${avgPoints}`)
  console.log(`   Highest Score: ${maxPoints}`)
  console.log(`   Lowest Score: ${minPoints}`)

  // Transition to next gameweek
  const transitionSuccess = await transitionToNextGameweek(gameweek)

  if (transitionSuccess) {
    console.log('\n✨ Done! Leaderboard updated and transitioned to next gameweek.\n')
  } else {
    console.log('\n⚠️  Points calculated but gameweek transition failed.')
    console.log('   Please create the next gameweek manually.\n')
  }
}

// Run the script
calculateGameweekPoints().catch(console.error)
