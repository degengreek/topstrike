/**
 * Fixtures API Proxy
 * Bypasses CORS restrictions by fetching server-side
 */

import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Build headers with optional auth from environment variables
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

    const response = await fetch('https://play.topstrike.io/api/fapi-server/fixtures', {
      headers,
      cache: 'no-store', // Don't cache, get fresh data
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch fixtures', status: response.status },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600', // Cache for 5 minutes
      },
    })
  } catch (error) {
    console.error('Fixtures API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch fixtures', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
