/**
 * Test Supabase Connection
 * GET /api/test-supabase
 */

import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('Testing Supabase connection...')

    // Test with admin client (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from('gameweeks')
      .select('*')
      .limit(1)

    console.log('Supabase response:', { data, error })

    if (error) {
      return Response.json({
        success: false,
        error: error.message,
        details: error
      }, { status: 500 })
    }

    return Response.json({
      success: true,
      message: '✅ Supabase connected!',
      gameweeks: data
    })

  } catch (error: any) {
    console.error('Supabase test error:', error)
    return Response.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
