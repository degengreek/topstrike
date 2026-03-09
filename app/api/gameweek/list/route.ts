/**
 * List All Gameweeks API
 * GET - Get all gameweeks (for dropdown selector)
 */

import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data: gameweeks, error } = await supabase
      .from('gameweeks')
      .select('*')
      .order('week_number', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({
      gameweeks: gameweeks || []
    })

  } catch (error: any) {
    console.error('Error fetching gameweeks:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
