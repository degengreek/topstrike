import { NextRequest, NextResponse } from 'next/server'
import {
  fetchMatchesForTeamsCached,
  clearFootballDataCache,
  getFootballDataTeamIds
} from '@/lib/football-data-fixtures'

/**
 * GET /api/football-data?teamNames=Arsenal,Liverpool,Chelsea
 * GET /api/football-data?clearCache=true (to clear cache)
 * Fetch live games and upcoming fixtures using Football-Data.org
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const teamNamesParam = searchParams.get('teamNames')
    const shouldClearCache = searchParams.get('clearCache') === 'true'

    // Clear cache if requested
    if (shouldClearCache) {
      clearFootballDataCache()
      return NextResponse.json({
        success: true,
        message: 'Football-Data cache cleared'
      })
    }

    if (!teamNamesParam) {
      return NextResponse.json(
        { error: 'teamNames parameter required' },
        { status: 400 }
      )
    }

    // Parse team names (URL encoded)
    const teamNames = teamNamesParam.split(',').map(name => decodeURIComponent(name))

    if (teamNames.length === 0) {
      return NextResponse.json(
        { error: 'No valid team names provided' },
        { status: 400 }
      )
    }

    console.log('🔍 Fetching data for teams:', teamNames)

    // Get team IDs from team names
    const teamIds = getFootballDataTeamIds(teamNames)

    if (teamIds.length === 0) {
      return NextResponse.json(
        { error: 'No teams found in Football-Data mapping' },
        { status: 400 }
      )
    }

    // Fetch data (with caching)
    const data = await fetchMatchesForTeamsCached(teamIds)

    console.log('✅ API Route Response:', {
      teamNames,
      teamIds,
      liveMatchesCount: data.liveMatches?.length || 0,
      upcomingMatchesCount: data.upcomingMatches?.length || 0
    })

    return NextResponse.json({
      success: true,
      teamNames,
      teamIds,
      liveGames: data.liveMatches,
      upcomingFixtures: data.upcomingMatches,
      cachedAt: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Error fetching Football-Data:', error)

    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch football data',
        liveGames: [],
        upcomingFixtures: []
      },
      { status: 500 }
    )
  }
}
