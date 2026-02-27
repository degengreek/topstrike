/**
 * Football API-Sports Integration
 * https://www.api-football.com/
 *
 * Free tier: 10 requests per minute
 */

// Team ID mapping: Player team name → API-Football team ID
export const TEAM_ID_MAP: Record<string, number> = {
  // Premier League
  "Manchester City": 50,
  "Liverpool": 40,
  "Arsenal": 42,
  "Chelsea": 49,
  "Manchester United": 33,
  "Tottenham": 47,
  "Tottenham Hotspur": 47,
  "Newcastle": 34,
  "Newcastle United": 34,
  "West Ham": 48,
  "West Ham United": 48,
  "Brighton": 51,
  "Aston Villa": 66,
  "Crystal Palace": 52,
  "Fulham": 36,
  "Everton": 45,
  "Brentford": 55,
  "Nottingham Forest": 65,
  "Wolves": 39,
  "Wolverhampton": 39,
  "Bournemouth": 35,
  "Leicester": 46,
  "Leeds United": 63,
  "Southampton": 41,
  "Ipswich": 57,

  // La Liga
  "Real Madrid": 541,
  "Barcelona": 529,
  "Atletico Madrid": 530,
  "Sevilla": 536,
  "Valencia": 532,
  "Villarreal": 533,
  "Real Sociedad": 548,
  "Athletic Bilbao": 531,
  "Real Betis": 543,

  // Serie A
  "Inter": 505,
  "AC Milan": 489,
  "Juventus": 496,
  "Napoli": 492,
  "Roma": 497,
  "Lazio": 487,
  "Atalanta": 499,
  "Fiorentina": 502,
  "Bologna": 500,
  "Torino": 503,
  "Como": 512,
  "Spezia": 515,

  // Bundesliga
  "Bayern Munich": 157,
  "Borussia Dortmund": 165,
  "RB Leipzig": 173,
  "Bayer Leverkusen": 168,
  "Eintracht Frankfurt": 169,
  "Wolfsburg": 178,
  "Stuttgart": 172,
  "VfB Stuttgart": 172,
  "Borussia Monchengladbach": 163,
  "Union Berlin": 28,
  "Freiburg": 160,
  "Werder Bremen": 162,

  // Ligue 1
  "PSG": 85,
  "Paris Saint Germain": 85,
  "Marseille": 81,
  "Monaco": 91,
  "Lyon": 80,
  "Lille": 79,
  "Nice": 82,
  "Lens": 77,
  "Rennes": 92,

  // Other
  "Club Brugge": 569,
}

export interface LiveFixture {
  fixture: {
    id: number
    date: string
    status: {
      long: string
      short: string
      elapsed: number | null
    }
  }
  league: {
    name: string
    country: string
    logo: string
    flag: string
  }
  teams: {
    home: {
      id: number
      name: string
      logo: string
    }
    away: {
      id: number
      name: string
      logo: string
    }
  }
  goals: {
    home: number | null
    away: number | null
  }
  score: {
    halftime: {
      home: number | null
      away: number | null
    }
    fulltime: {
      home: number | null
      away: number | null
    }
  }
}

export interface UpcomingFixture {
  fixture: {
    id: number
    date: string
    timestamp: number
  }
  league: {
    name: string
    country: string
  }
  teams: {
    home: {
      id: number
      name: string
      logo: string
    }
    away: {
      id: number
      name: string
      logo: string
    }
  }
}

interface APIResponse {
  response: any[]
}

/**
 * Rate limiter to stay within 10 requests/minute
 */
class RateLimiter {
  private requests: number[] = []
  private readonly maxRequests = 10
  private readonly windowMs = 60000 // 1 minute

  async throttle(): Promise<void> {
    const now = Date.now()

    // Remove requests older than 1 minute
    this.requests = this.requests.filter(time => now - time < this.windowMs)

    if (this.requests.length >= this.maxRequests) {
      // Calculate wait time until oldest request expires
      const oldestRequest = this.requests[0]
      const waitTime = this.windowMs - (now - oldestRequest) + 100 // +100ms buffer

      console.log(`⏳ Rate limit: waiting ${Math.round(waitTime / 1000)}s...`)
      await new Promise(resolve => setTimeout(resolve, waitTime))

      // Retry
      return this.throttle()
    }

    this.requests.push(now)
  }

  getRemaining(): number {
    const now = Date.now()
    this.requests = this.requests.filter(time => now - time < this.windowMs)
    return this.maxRequests - this.requests.length
  }
}

const rateLimiter = new RateLimiter()

/**
 * Fetch from Football API with rate limiting
 */
async function fetchWithRateLimit(url: string): Promise<any> {
  await rateLimiter.throttle()

  const apiKey = process.env.NEXT_PUBLIC_FOOTBALL_API_KEY
  if (!apiKey) {
    throw new Error('NEXT_PUBLIC_FOOTBALL_API_KEY not configured')
  }

  const response = await fetch(url, {
    headers: {
      'x-apisports-key': apiKey,
      'x-rapidapi-key': apiKey, // Fallback for RapidAPI users
    }
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('❌ Football API Error:', response.status, errorText)
    throw new Error(`API error: ${response.status} - ${errorText}`)
  }

  const data: APIResponse = await response.json()
  console.log('📡 Football API Response:', {
    url,
    resultsCount: data.response?.length || 0,
    errors: (data as any).errors || null,
    message: (data as any).message || null
  })
  return data.response
}

/**
 * Get team IDs from player team names
 */
export function getTeamIds(teamNames: string[]): number[] {
  const uniqueTeams = Array.from(new Set(teamNames))
  const teamIds: number[] = []

  for (const teamName of uniqueTeams) {
    const teamId = TEAM_ID_MAP[teamName]
    if (teamId) {
      teamIds.push(teamId)
    } else {
      console.warn(`⚠️  Team ID not found for: ${teamName}`)
    }
  }

  return Array.from(new Set(teamIds)) // Remove duplicates
}

/**
 * Fetch dashboard data (live games + upcoming fixtures)
 */
export async function fetchDashboardData(teamIds: number[]): Promise<{
  liveGames: LiveFixture[]
  upcomingFixtures: UpcomingFixture[]
}> {
  console.log(`🔍 Fetching data for ${teamIds.length} teams...`)
  console.log(`⚡ Rate limit: ${rateLimiter.getRemaining()}/10 requests available`)

  // 1. Fetch live games (1 request)
  console.log('📡 Fetching live games...')
  const liveResponse = await fetchWithRateLimit(
    'https://v3.football.api-sports.io/fixtures?live=all'
  )

  // Filter to only games involving our teams
  const liveGames = liveResponse.filter((fixture: LiveFixture) => {
    const homeId = fixture.teams.home.id
    const awayId = fixture.teams.away.id
    return teamIds.includes(homeId) || teamIds.includes(awayId)
  })

  console.log(`✅ Found ${liveGames.length} live games`)

  // 2. Fetch upcoming fixtures for each team
  // To stay within rate limit, we'll limit to first 9 teams (1 live + 9 upcoming = 10 requests)
  const teamsToFetch = teamIds.slice(0, 9)

  if (teamIds.length > 9) {
    console.log(`⚠️  Limiting to first 9 teams (rate limit protection)`)
  }

  console.log(`📡 Fetching upcoming fixtures for ${teamsToFetch.length} teams...`)

  // Get current season and date range
  // Season is required by API, date range filters to upcoming only
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  const season = currentMonth >= 8 ? currentYear : currentYear - 1

  const fromDate = now.toISOString().split('T')[0] // YYYY-MM-DD
  const toDate = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  console.log(`📅 Using season ${season}, fetching fixtures from ${fromDate} to ${toDate}`)

  const upcomingPromises = teamsToFetch.map(async (teamId) => {
    try {
      // Fetch fixtures with BOTH season (required) and date range (filter)
      const url = `https://v3.football.api-sports.io/fixtures?team=${teamId}&season=${season}&from=${fromDate}&to=${toDate}`
      console.log(`📡 Fetching team ${teamId}: ${url}`)

      const fixtures = await fetchWithRateLimit(url)

      console.log(`   → Team ${teamId}: ${fixtures.length} fixtures found`)

      // Sort by date and take first 5
      const sorted = fixtures.sort((a: UpcomingFixture, b: UpcomingFixture) => {
        return a.fixture.timestamp - b.fixture.timestamp
      })

      return sorted.slice(0, 5) // Take first 5 upcoming
    } catch (error) {
      console.error(`❌ Failed to fetch fixtures for team ${teamId}:`, error)
      return []
    }
  })

  const upcomingResults = await Promise.all(upcomingPromises)

  // Flatten and deduplicate by fixture ID
  const upcomingMap = new Map<number, UpcomingFixture>()
  upcomingResults.flat().forEach((fixture: UpcomingFixture) => {
    upcomingMap.set(fixture.fixture.id, fixture)
  })

  const upcomingFixtures = Array.from(upcomingMap.values())
    .sort((a, b) => a.fixture.timestamp - b.fixture.timestamp)
    .slice(0, 10) // Show max 10 upcoming fixtures

  console.log(`✅ Found ${upcomingFixtures.length} upcoming fixtures`)
  console.log(`⚡ Rate limit: ${rateLimiter.getRemaining()}/10 requests remaining`)

  return {
    liveGames,
    upcomingFixtures
  }
}

/**
 * Get cached data or fetch fresh (with 5 minute cache)
 */
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export async function fetchDashboardDataCached(teamIds: number[]): Promise<{
  liveGames: LiveFixture[]
  upcomingFixtures: UpcomingFixture[]
}> {
  const cacheKey = teamIds.sort().join(',')
  const cached = cache.get(cacheKey)

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('💾 Using cached data')
    return cached.data
  }

  console.log('🔄 Fetching fresh data...')
  const data = await fetchDashboardData(teamIds)
  cache.set(cacheKey, { data, timestamp: Date.now() })

  return data
}

/**
 * Clear the cache (for testing/debugging)
 */
export function clearCache() {
  cache.clear()
  console.log('🗑️ Cache cleared')
}
