/**
 * Player Scores API Proxy - TEST ENDPOINT
 * Bypasses CORS and Cloudflare protection by fetching server-side
 */

import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    // Get date from query params, default to yesterday
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date(Date.now() - 86400000).toISOString().split('T')[0]

    // Build headers similar to fixtures API
    const headers: HeadersInit = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Origin': 'https://play.topstrike.io',
      'Referer': 'https://play.topstrike.io/',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
    }

    // Add auth cookies if provided (from .env.local)
    const cookies = process.env.TOPSTRIKE_COOKIES
    if (cookies) {
      headers['Cookie'] = cookies
    }

    const response = await fetch(
      `https://play.topstrike.io/api/fapi-server/playerScoresForDate?date=${date}`,
      {
        headers,
        cache: 'no-store',
      }
    )

    if (!response.ok) {
      return NextResponse.json(
        {
          error: 'Failed to fetch player scores',
          status: response.status,
          message: 'This endpoint requires authentication. Add TOPSTRIKE_COOKIES to .env.local'
        },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200', // Cache for 1 hour
      },
    })
  } catch (error) {
    console.error('Player Scores API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch player scores',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
