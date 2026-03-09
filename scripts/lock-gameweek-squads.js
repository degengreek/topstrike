/**
 * Lock Gameweek Squads
 * Run at lock time (Friday 14:00 UTC) to snapshot all squads
 * This prevents users from changing squads after seeing match results
 *
 * Usage:
 *   node scripts/lock-gameweek-squads.js
 *
 * Or for specific gameweek:
 *   node scripts/lock-gameweek-squads.js 1
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

// Supabase setup
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * Get current active gameweek
 */
async function getCurrentGameweek(weekNumber) {
  if (weekNumber) {
    // Get specific gameweek
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
    // Get current active gameweek
    const { data, error } = await supabase
      .from('gameweeks')
      .select('*')
      .eq('is_active', true)
      .single()

    if (error || !data) {
      console.error('❌ No active gameweek found')
      return null
    }

    return data
  }
}

/**
 * Get all users with squads
 */
async function getUserSquads() {
  const { data: squads, error } = await supabase
    .from('squads')
    .select(`
      user_id,
      formation,
      players,
      users (
        twitter_username
      )
    `)

  if (error) {
    console.error('❌ Error fetching squads:', error)
    return []
  }

  return squads
}

/**
 * Lock squads for gameweek
 */
async function lockSquads() {
  const weekNumber = process.argv[2] ? parseInt(process.argv[2]) : null

  console.log('\n🔒 Locking Gameweek Squads')
  console.log('=' .repeat(50))

  // Get gameweek
  const gameweek = await getCurrentGameweek(weekNumber)
  if (!gameweek) {
    console.log('❌ Cannot lock squads without a gameweek')
    return
  }

  console.log(`\n📅 Locking squads for Gameweek #${gameweek.week_number}`)
  console.log(`   Lock Time: ${gameweek.lock_deadline}`)
  console.log(`   Gameweek: ${gameweek.start_date} → ${gameweek.end_date}\n`)

  // Get all squads
  console.log('👥 Fetching user squads...')
  const squads = await getUserSquads()
  console.log(`   Found ${squads.length} squads\n`)

  if (squads.length === 0) {
    console.log('⚠️  No squads to lock')
    return
  }

  // Check if already locked
  const { data: existingLocks } = await supabase
    .from('user_gameweek_points')
    .select('user_id')
    .eq('gameweek_id', gameweek.id)

  const alreadyLocked = new Set(existingLocks?.map(l => l.user_id) || [])

  // Create lock entries (squad snapshots)
  console.log('🔒 Creating squad snapshots...\n')
  const snapshots = []
  let newLocks = 0
  let skipped = 0

  for (const squad of squads) {
    const username = squad.users?.twitter_username || 'Unknown'

    if (alreadyLocked.has(squad.user_id)) {
      console.log(`   ⏭️  ${username}: Already locked`)
      skipped++
      continue
    }

    // Count assigned players
    const players = squad.players || {}
    const playerCount = Object.values(players).filter(p => p && p.id).length

    console.log(`   🔒 ${username}: ${playerCount} players locked`)

    snapshots.push({
      user_id: squad.user_id,
      gameweek_id: gameweek.id,
      points: 0, // Will be calculated later
      squad_snapshot: squad.players,
      calculated_at: null // Not calculated yet
    })

    newLocks++
  }

  if (snapshots.length === 0) {
    console.log('\n✅ All squads already locked!')
    return
  }

  // Save snapshots to database
  console.log('\n💾 Saving squad snapshots...')
  const { error } = await supabase
    .from('user_gameweek_points')
    .insert(snapshots)

  if (error) {
    console.error('❌ Error saving snapshots:', error)
    return
  }

  console.log('✅ Squad snapshots saved!')

  // Summary
  console.log('\n📊 Summary:')
  console.log(`   New Locks: ${newLocks}`)
  console.log(`   Already Locked: ${skipped}`)
  console.log(`   Total: ${squads.length}`)
  console.log('\n🔒 Squads are now locked for Gameweek #' + gameweek.week_number)
  console.log('   Users cannot cheat by changing squads after matches!\n')
}

// Run the script
lockSquads().catch(console.error)
