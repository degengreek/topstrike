#!/usr/bin/env tsx
/**
 * Injury Sync Script
 *
 * Syncs injury data to Supabase:
 * 1. Reads injury data from lib/injury-data.ts (78 injuries)
 * 2. Reads TopStrike players from public/player-database.json (185 players)
 * 3. Fuzzy matches injuries to players by name
 * 4. Updates Supabase injury_status table with matched injuries
 * 5. Logs matched and unmatched injuries
 *
 * Run: npx tsx scripts/sync-injuries.ts
 * Or: npm run sync-injuries (after adding to package.json)
 */

import { createClient } from '@supabase/supabase-js'
import { INJURY_DATA, LAST_UPDATED } from '../lib/injury-data'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

interface Player {
  id: number
  name: string
  team: string | null
  position: string | null
}

interface MatchedInjury {
  player_id: string
  player_name: string
  team: string
  position: string
  injury_status: 'injured' | 'suspended'
  injury_type: string
  expected_return: string | null
}

// Normalize name for fuzzy matching
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim()
}

// Calculate similarity between two strings (simple approach)
function similarity(s1: string, s2: string): number {
  const longer = s1.length > s2.length ? s1 : s2
  const shorter = s1.length > s2.length ? s2 : s1

  if (longer.length === 0) return 1.0

  const editDistance = levenshteinDistance(longer, shorter)
  return (longer.length - editDistance) / longer.length
}

// Levenshtein distance for fuzzy matching
function levenshteinDistance(s1: string, s2: string): number {
  const costs: number[] = []
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j
      } else if (j > 0) {
        let newValue = costs[j - 1]
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1
        }
        costs[j - 1] = lastValue
        lastValue = newValue
      }
    }
    if (i > 0) costs[s2.length] = lastValue
  }
  return costs[s2.length]
}

// Find player by name with fuzzy matching
function findPlayer(injuryPlayerName: string, players: Player[]): Player | null {
  const normalizedInjuryName = normalizeName(injuryPlayerName)

  // First try exact match
  for (const player of players) {
    if (normalizeName(player.name) === normalizedInjuryName) {
      return player
    }
  }

  // Try fuzzy match (90%+ similarity)
  let bestMatch: Player | null = null
  let bestScore = 0

  for (const player of players) {
    const score = similarity(normalizedInjuryName, normalizeName(player.name))
    if (score >= 0.9 && score > bestScore) {
      bestMatch = player
      bestScore = score
    }
  }

  return bestMatch
}

// Determine if injury is suspension
function isSuspension(injuryType: string): boolean {
  const suspensionKeywords = ['suspension', 'red card', 'yellow cards', 'banned', 'disciplinary']
  const lowerInjury = injuryType.toLowerCase()
  return suspensionKeywords.some(keyword => lowerInjury.includes(keyword))
}

async function main() {
  console.log('🏥 TopStrike Injury Sync')
  console.log('=' .repeat(60))
  console.log(`Injury data last updated: ${LAST_UPDATED}`)
  console.log(`Total injuries to process: ${INJURY_DATA.length}`)
  console.log()

  // Load player database
  const playerDbPath = path.join(process.cwd(), 'public', 'player-database.json')
  const playerData = JSON.parse(fs.readFileSync(playerDbPath, 'utf-8')) as Player[]

  // Filter out invalid players
  const validPlayers = playerData.filter(p =>
    p.name &&
    !p.name.includes('DO NOT BUY') &&
    !p.name.includes('PLAYER')
  )

  console.log(`📊 Loaded ${validPlayers.length} valid TopStrike players`)
  console.log()

  // Match injuries to players
  const matchedInjuries: MatchedInjury[] = []
  const unmatchedInjuries: typeof INJURY_DATA = []

  console.log('🔍 Matching injuries to players...')
  console.log()

  for (const injury of INJURY_DATA) {
    const player = findPlayer(injury.player, validPlayers)

    if (player) {
      const injuryStatus = isSuspension(injury.injury) ? 'suspended' : 'injured'

      matchedInjuries.push({
        player_id: player.id.toString(),
        player_name: player.name,
        team: player.team || injury.team,
        position: player.position || injury.position,
        injury_status: injuryStatus,
        injury_type: injury.injury,
        expected_return: injury.return_date
      })

      const statusEmoji = injuryStatus === 'suspended' ? '⛔' : '🤕'
      console.log(`  ✅ ${statusEmoji} ${injury.player} → ID ${player.id} (${player.name})`)
    } else {
      unmatchedInjuries.push(injury)
    }
  }

  console.log()
  console.log('=' .repeat(60))
  console.log(`✅ Matched: ${matchedInjuries.length} injuries`)
  console.log(`❌ Unmatched: ${unmatchedInjuries.length} injuries (not in TopStrike DB)`)
  console.log()

  // Show unmatched injuries
  if (unmatchedInjuries.length > 0) {
    console.log('❌ Unmatched Injuries:')
    for (const injury of unmatchedInjuries) {
      console.log(`  • ${injury.player} (${injury.team}) - ${injury.injury}`)
    }
    console.log()
  }

  // Update Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in environment variables')
    console.error('   Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  console.log('☁️  Updating Supabase...')

  try {
    // Delete all existing injury records
    const { error: deleteError } = await supabase
      .from('injury_status')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (deleteError) {
      console.error('❌ Error deleting old records:', deleteError.message)
      process.exit(1)
    }

    // Insert new matched injuries
    if (matchedInjuries.length > 0) {
      const { error: insertError } = await supabase
        .from('injury_status')
        .insert(matchedInjuries)

      if (insertError) {
        console.error('❌ Error inserting new records:', insertError.message)
        process.exit(1)
      }
    }

    console.log('✅ Supabase updated successfully!')
    console.log()
    console.log('=' .repeat(60))
    console.log('📊 Summary:')
    console.log(`   • Total injuries processed: ${INJURY_DATA.length}`)
    console.log(`   • Matched to TopStrike players: ${matchedInjuries.length}`)
    console.log(`   • Not in database: ${unmatchedInjuries.length}`)
    console.log(`   • Injured: ${matchedInjuries.filter(i => i.injury_status === 'injured').length}`)
    console.log(`   • Suspended: ${matchedInjuries.filter(i => i.injury_status === 'suspended').length}`)
    console.log()
    console.log('🎉 Sync complete!')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  }
}

main()
