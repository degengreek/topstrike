/**
 * Save Player Scores API
 * Saves player scores to database (called from client after fetching from TopStrike)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { authOptions } from '@/lib/auth'

/**
 * POST /api/scores/save-scores
 * Saves scores to database
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { scores } = body

    if (!scores || !Array.isArray(scores)) {
      return NextResponse.json(
        { error: 'scores array required' },
        { status: 400 }
      )
    }

    console.log(`💾 Saving ${scores.length} scores to database...`)

    // Bulk upsert to database
    const { error: dbError } = await supabaseAdmin
      .from('player_scores')
      .upsert(scores, { onConflict: 'player_id' })

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to save scores to database' },
        { status: 500 }
      )
    }

    console.log(`✅ Successfully saved ${scores.length} scores`)

    return NextResponse.json({
      success: true,
      saved: scores.length
    })

  } catch (error: any) {
    console.error('Error in save-scores:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
