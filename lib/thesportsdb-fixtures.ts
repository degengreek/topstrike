/**
 * TheSportsDB Fixtures Integration
 * https://www.thesportsdb.com/
 *
 * Free tier: Unlimited requests
 */

// Team ID mapping: Player team name → TheSportsDB team ID
export const SPORTSDB_TEAM_ID_MAP: Record<string, string> = {
  // Premier League
  "Manchester City": "133613",
  "Liverpool": "133602",
  "Arsenal": "133604",
  "Chelsea": "133610",
  "Manchester United": "133612",
  "Tottenham": "133616",
  "Tottenham Hotspur": "133616",
  "Newcastle": "133614",
  "Newcastle United": "133614",
  "West Ham": "133623",
  "West Ham United": "133623",
  "Brighton": "133632",
  "Aston Villa": "133626",
  "Crystal Palace": "133609",
  "Fulham": "133636",
  "Everton": "133608",
  "Brentford": "133626",
  "Nottingham Forest": "133615",
  "Wolves": "133599",
  "Wolverhampton": "133599",
  "Bournemouth": "133633",
  "Leicester": "133611",
  "Leeds United": "133635",
  "Southampton": "133618",
  "Ipswich": "133637",

  // La Liga
  "Real Madrid": "133600",
  "Barcelona": "133603",
  "Atletico Madrid": "133601",
  "Sevilla": "133624",
  "Valencia": "133628",
  "Villarreal": "133627",
  "Real Sociedad": "133621",
  "Athletic Bilbao": "133605",
  "Real Betis": "133606",

  // Serie A
  "Inter": "133676",
  "Inter Milan": "133676",
  "AC Milan": "133675",
  "Juventus": "133677",
  "Napoli": "133679",
  "Roma": "133680",
  "Lazio": "133678",
  "Atalanta": "133673",
  "Fiorentina": "133674",
  "Bologna": "133671",
  "Torino": "133682",
  "Como": "135011",
  "Spezia": "135014",

  // Bundesliga
  "Bayern Munich": "133536",
  "Borussia Dortmund": "133534",
  "RB Leipzig": "135235",
  "Bayer Leverkusen": "133533",
  "Eintracht Frankfurt": "133539",
  "Wolfsburg": "133543",
  "Stuttgart": "133541",
  "VfB Stuttgart": "133541",
  "Borussia Monchengladbach": "133535",
  "Union Berlin": "136321",
  "Freiburg": "133540",
  "Werder Bremen": "133537",

  // Ligue 1
  "PSG": "133716",
  "Paris Saint Germain": "133716",
  "Marseille": "133714",
  "Monaco": "133715",
  "Lyon": "133713",
  "Lille": "133712",
  "Nice": "133708",
  "Lens": "133710",
  "Rennes": "133709",

  // Other
  "Club Brugge": "134283",
}

export interface SportsDBFixture {
  idEvent: string
  strEvent: string // "Team A vs Team B"
  strHomeTeam: string
  strAwayTeam: string
  idHomeTeam: string
  idAwayTeam: string
  intHomeScore: string | null
  intAwayScore: string | null
  strLeague: string
  dateEvent: string // YYYY-MM-DD
  strTime: string // HH:MM:SS
  strTimestamp?: string
  strThumb?: string
  strStatus?: string
}

export interface SportsDBLiveMatch {
  idEvent: string
  strEvent: string
  strHomeTeam: string
  strAwayTeam: string
  idHomeTeam: string
  idAwayTeam: string
  intHomeScore: string
  intAwayScore: string
  strLeague: string
  strProgress: string // "45'" or "HT" etc
  dateEvent: string
  strTime: string
}

/**
 * Get TheSportsDB team IDs from player team names
 */
export function getSportsDBTeamIds(teamNames: string[]): string[] {
  const uniqueTeams = Array.from(new Set(teamNames))
  const teamIds: string[] = []

  for (const teamName of uniqueTeams) {
    const teamId = SPORTSDB_TEAM_ID_MAP[teamName]
    if (teamId) {
      teamIds.push(teamId)
    } else {
      console.warn(`⚠️  TheSportsDB Team ID not found for: ${teamName}`)
    }
  }

  return Array.from(new Set(teamIds)) // Remove duplicates
}

/**
 * Fetch upcoming fixtures for a team
 *
 * NOTE: TheSportsDB's eventsnext.php endpoint is currently broken!
 * It returns the same fixtures (Bolton Wanderers) for ALL team IDs.
 * This is a known API bug on their side.
 */
async function fetchUpcomingFixtures(teamId: string): Promise<SportsDBFixture[]> {
  try {
    // TEMPORARY: API endpoint is broken, returning empty array
    // TheSportsDB's eventsnext.php returns Bolton Wanderers for all teams
    console.warn(`⚠️  TheSportsDB eventsnext.php is broken - skipping team ${teamId}`)
    return []

    /* ORIGINAL CODE - Keep for when API is fixed:
    const response = await fetch(
      `https://www.thesportsdb.com/api/v1/json/3/eventsnext.php?id=${teamId}`
    )

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()

    console.log(`📡 TheSportsDB Response for team ${teamId}:`, {
      fixturesCount: data.events?.length || 0
    })

    // Return only the next match (first fixture) for this team
    return data.events ? data.events.slice(0, 1) : []
    */
  } catch (error) {
    console.error(`❌ Failed to fetch fixtures for team ${teamId}:`, error)
    return []
  }
}

/**
 * Fetch all live soccer matches
 *
 * NOTE: TheSportsDB's livescore.php endpoint returns 404
 * This endpoint appears to be unavailable or requires different parameters
 */
async function fetchLiveMatches(): Promise<SportsDBLiveMatch[]> {
  try {
    // TEMPORARY: API endpoint returns 404
    console.warn(`⚠️  TheSportsDB livescore.php endpoint unavailable (404)`)
    return []

    /* ORIGINAL CODE - Keep for reference:
    const response = await fetch(
      'https://www.thesportsdb.com/api/v1/json/3/livescore.php'
    )

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()

    console.log(`📡 TheSportsDB Live Matches:`, {
      totalLive: data.events?.length || 0
    })

    return data.events || []
    */
  } catch (error) {
    console.error(`❌ Failed to fetch live matches:`, error)
    return []
  }
}

/**
 * Fetch dashboard data (live games + upcoming fixtures)
 */
export async function fetchSportsDBDashboard(teamIds: string[]): Promise<{
  liveGames: SportsDBLiveMatch[]
  upcomingFixtures: SportsDBFixture[]
}> {
  console.log(`🔍 Fetching TheSportsDB data for ${teamIds.length} teams...`)
  console.log(`📋 Your team IDs:`, teamIds)

  // 1. Fetch all live matches
  console.log('📡 Fetching live matches...')
  const allLiveMatches = await fetchLiveMatches()

  // Filter to only matches involving our teams
  const liveGames = allLiveMatches.filter((match) => {
    const isOurMatch = teamIds.includes(match.idHomeTeam) || teamIds.includes(match.idAwayTeam)
    if (isOurMatch) {
      console.log(`✅ Live match found: ${match.strEvent} (Home: ${match.idHomeTeam}, Away: ${match.idAwayTeam})`)
    }
    return isOurMatch
  })

  console.log(`✅ Found ${liveGames.length} live games for your teams (filtered from ${allLiveMatches.length} total)`)

  // 2. Fetch upcoming fixtures for each team
  console.log(`📡 Fetching upcoming fixtures for ${teamIds.length} teams...`)

  const upcomingPromises = teamIds.map(teamId => fetchUpcomingFixtures(teamId))
  const upcomingResults = await Promise.all(upcomingPromises)

  // Flatten and deduplicate by event ID
  const upcomingMap = new Map<string, SportsDBFixture>()
  const allFixtures = upcomingResults.flat()

  console.log(`📊 Processing ${allFixtures.length} total fixtures from API...`)

  // Debug: Show first fixture structure
  if (allFixtures.length > 0) {
    const sample = allFixtures[0]
    console.log(`🔍 Sample fixture:`, {
      event: sample.strEvent,
      homeTeam: sample.strHomeTeam,
      awayTeam: sample.strAwayTeam,
      idHomeTeam: sample.idHomeTeam,
      idAwayTeam: sample.idAwayTeam
    })
  }

  allFixtures.forEach((fixture) => {
    if (fixture.idEvent) {
      // Double-check that at least one team matches our team IDs
      const isOurMatch = teamIds.includes(fixture.idHomeTeam) || teamIds.includes(fixture.idAwayTeam)
      if (isOurMatch) {
        upcomingMap.set(fixture.idEvent, fixture)
        console.log(`✅ Keeping: ${fixture.strEvent} (Home: ${fixture.idHomeTeam}, Away: ${fixture.idAwayTeam})`)
      } else {
        console.log(`⚠️  Filtered out: ${fixture.strEvent} (Home: ${fixture.idHomeTeam}, Away: ${fixture.idAwayTeam})`)
      }
    }
  })

  const upcomingFixtures = Array.from(upcomingMap.values())
    .sort((a, b) => {
      // Sort by date + time
      const dateA = new Date(`${a.dateEvent} ${a.strTime}`).getTime()
      const dateB = new Date(`${b.dateEvent} ${b.strTime}`).getTime()
      return dateA - dateB
    })
    // Show all fixtures (one per team, deduplicated if teams play each other)

  console.log(`✅ Found ${upcomingFixtures.length} upcoming fixtures (one per team)`)

  // Log first few upcoming fixtures for verification
  upcomingFixtures.slice(0, 3).forEach(fixture => {
    console.log(`   📅 ${fixture.strEvent} - Home: ${fixture.idHomeTeam}, Away: ${fixture.idAwayTeam}`)
  })

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

export async function fetchSportsDBDashboardCached(teamIds: string[]): Promise<{
  liveGames: SportsDBLiveMatch[]
  upcomingFixtures: SportsDBFixture[]
}> {
  const cacheKey = teamIds.sort().join(',')
  const cached = cache.get(cacheKey)

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('💾 Using cached TheSportsDB data')
    return cached.data
  }

  console.log('🔄 Fetching fresh TheSportsDB data...')
  const data = await fetchSportsDBDashboard(teamIds)
  cache.set(cacheKey, { data, timestamp: Date.now() })

  return data
}

/**
 * Clear the cache (for testing/debugging)
 */
export function clearSportsDBCache() {
  cache.clear()
  console.log('🗑️ TheSportsDB cache cleared')
}
