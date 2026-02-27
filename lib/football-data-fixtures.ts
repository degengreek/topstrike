/**
 * Football-Data.org Integration
 * https://www.football-data.org/
 *
 * Free tier: 10 requests/minute, current season access
 * API Key: f7bac0daf4af42bcaef870ddbdc59287
 */

// Team ID mapping: Player team name → Football-Data.org team ID
export const FOOTBALL_DATA_TEAM_MAP: Record<string, number> = {
  // Premier League
  "Arsenal": 57,
  "Liverpool": 64,
  "Manchester City": 65,
  "Manchester United": 66,
  "Chelsea": 61,
  "Tottenham": 73,
  "Tottenham Hotspur": 73,
  "Newcastle": 67,
  "Newcastle United": 67,
  "West Ham": 563,
  "West Ham United": 563,
  "Brighton": 397,
  "Aston Villa": 58,
  "Crystal Palace": 354,
  "Fulham": 63,
  "Everton": 62,
  "Brentford": 402,
  "Nottingham Forest": 351,
  "Wolves": 76,
  "Wolverhampton": 76,
  "Bournemouth": 1044,
  "Leicester": 338,
  "Leeds United": 341,
  "Southampton": 340,
  "Ipswich": 349,

  // La Liga
  "Real Madrid": 86,
  "Barcelona": 81,
  "Atletico Madrid": 78,
  "Sevilla": 559,
  "Valencia": 95,
  "Villarreal": 94,
  "Real Sociedad": 92,
  "Athletic Bilbao": 77,
  "Real Betis": 90,

  // Serie A
  "Inter": 108,
  "Inter Milan": 108,
  "AC Milan": 98,
  "Juventus": 109,
  "Napoli": 113,
  "Roma": 100,
  "Lazio": 110,
  "Atalanta": 102,
  "Fiorentina": 99,
  "Bologna": 103,
  "Torino": 586,
  "Como": 5890,
  "Spezia": 488,

  // Bundesliga
  "Bayern Munich": 5,
  "Borussia Dortmund": 4,
  "RB Leipzig": 721,
  "Bayer Leverkusen": 3,
  "Eintracht Frankfurt": 19,
  "Wolfsburg": 11,
  "Stuttgart": 10,
  "VfB Stuttgart": 10,
  "Borussia Monchengladbach": 18,
  "Union Berlin": 28,
  "Freiburg": 17,
  "Werder Bremen": 12,

  // Ligue 1
  "PSG": 524,
  "Paris Saint Germain": 524,
  "Marseille": 516,
  "Monaco": 548,
  "Lyon": 523,
  "Lille": 521,
  "Nice": 522,
  "Lens": 546,
  "Rennes": 529,

  // Other
  "Club Brugge": 510,
}

export interface FootballDataMatch {
  id: number
  utcDate: string
  status: string // "TIMED", "IN_PLAY", "PAUSED", "FINISHED", "SCHEDULED"
  matchday: number
  homeTeam: {
    id: number
    name: string
    shortName: string
    tla: string
    crest: string
  }
  awayTeam: {
    id: number
    name: string
    shortName: string
    tla: string
    crest: string
  }
  score: {
    winner: string | null
    duration: string
    fullTime: {
      home: number | null
      away: number | null
    }
    halfTime: {
      home: number | null
      away: number | null
    }
  }
  competition: {
    id: number
    name: string
    emblem: string
  }
}

interface FootballDataResponse {
  matches: FootballDataMatch[]
}

/**
 * Get Football-Data team IDs from player team names
 */
export function getFootballDataTeamIds(teamNames: string[]): number[] {
  const uniqueTeams = Array.from(new Set(teamNames))
  const teamIds: number[] = []

  for (const teamName of uniqueTeams) {
    const teamId = FOOTBALL_DATA_TEAM_MAP[teamName]
    if (teamId) {
      teamIds.push(teamId)
    } else {
      console.warn(`⚠️  Football-Data team ID not found for: ${teamName}`)
    }
  }

  return Array.from(new Set(teamIds)) // Remove duplicates
}

/**
 * Fetch all matches for the next 10 days (API maximum)
 */
export async function fetchUpcomingMatches(): Promise<{
  liveMatches: FootballDataMatch[]
  upcomingMatches: FootballDataMatch[]
}> {
  const API_KEY = 'f7bac0daf4af42bcaef870ddbdc59287'

  try {
    // Get date range: today to 10 days from now (API maximum)
    const today = new Date()
    const tenDaysLater = new Date(today)
    tenDaysLater.setDate(tenDaysLater.getDate() + 10)

    const dateFrom = today.toISOString().split('T')[0] // YYYY-MM-DD
    const dateTo = tenDaysLater.toISOString().split('T')[0]

    console.log(`📡 Fetching matches from ${dateFrom} to ${dateTo}...`)

    const response = await fetch(
      `https://api.football-data.org/v4/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`,
      {
        headers: {
          'X-Auth-Token': API_KEY
        }
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Football-Data API Error:', response.status, errorText)
      throw new Error(`API error: ${response.status}`)
    }

    const data: FootballDataResponse = await response.json()

    console.log(`📊 Total matches (next 10 days): ${data.matches?.length || 0}`)

    // Separate into live and upcoming
    const liveMatches = data.matches.filter(m => m.status === 'IN_PLAY' || m.status === 'PAUSED')
    const upcomingMatches = data.matches.filter(m => m.status === 'TIMED' || m.status === 'SCHEDULED')

    console.log(`🔴 Live matches: ${liveMatches.length}`)
    console.log(`📅 Upcoming matches: ${upcomingMatches.length}`)

    return {
      liveMatches,
      upcomingMatches
    }

  } catch (error) {
    console.error('❌ Failed to fetch Football-Data matches:', error)
    return {
      liveMatches: [],
      upcomingMatches: []
    }
  }
}

/**
 * Filter matches by team IDs
 */
export function filterMatchesByTeams(
  matches: FootballDataMatch[],
  teamIds: number[]
): FootballDataMatch[] {
  return matches.filter(match => {
    return teamIds.includes(match.homeTeam.id) || teamIds.includes(match.awayTeam.id)
  })
}

/**
 * Fetch matches for specific teams
 */
export async function fetchMatchesForTeams(teamIds: number[]): Promise<{
  liveMatches: FootballDataMatch[]
  upcomingMatches: FootballDataMatch[]
}> {
  console.log(`🔍 Fetching matches for ${teamIds.length} teams...`)
  console.log(`📋 Your team IDs:`, teamIds)

  // Fetch all matches for next 7 days
  const { liveMatches, upcomingMatches } = await fetchUpcomingMatches()

  // Filter to only matches with our teams
  const filteredLive = filterMatchesByTeams(liveMatches, teamIds)
  const allUpcomingForOurTeams = filterMatchesByTeams(upcomingMatches, teamIds)

  // Get only the NEXT match for each team (deduplicate)
  const nextMatchPerTeam = new Map<number, FootballDataMatch>()

  // Sort by date first
  const sortedUpcoming = allUpcomingForOurTeams.sort((a, b) => {
    return new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime()
  })

  // For each team, find their next match
  const teamsWithMatches = new Set<number>()
  const teamsWithoutMatches: number[] = []

  teamIds.forEach(teamId => {
    const nextMatch = sortedUpcoming.find(match =>
      match.homeTeam.id === teamId || match.awayTeam.id === teamId
    )
    if (nextMatch) {
      // Use match ID as key to avoid duplicates (if two teams play each other)
      nextMatchPerTeam.set(nextMatch.id, nextMatch)
      teamsWithMatches.add(teamId)
    } else {
      teamsWithoutMatches.push(teamId)
    }
  })

  const filteredUpcoming = Array.from(nextMatchPerTeam.values()).sort((a, b) => {
    return new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime()
  })

  console.log(`✅ Found ${filteredLive.length} live matches for your teams`)
  console.log(`✅ Found ${filteredUpcoming.length} upcoming matches (next match per team)`)
  console.log(`📊 Teams with matches: ${teamsWithMatches.size}/${teamIds.length}`)

  if (teamsWithoutMatches.length > 0) {
    console.log(`⚠️  Teams without matches in next 7 days:`, teamsWithoutMatches)
  }

  // Log matches for debugging
  filteredLive.forEach(match => {
    console.log(`   🔴 LIVE: ${match.homeTeam.name} vs ${match.awayTeam.name}`)
  })
  filteredUpcoming.forEach(match => {
    const matchDate = new Date(match.utcDate)
    const formattedDate = matchDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    const formattedTime = matchDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    console.log(`   📅 UPCOMING: ${match.homeTeam.name} vs ${match.awayTeam.name} (${formattedDate} ${formattedTime})`)
  })

  return {
    liveMatches: filteredLive,
    upcomingMatches: filteredUpcoming
  }
}

/**
 * Get cached data or fetch fresh (with 2 minute cache for live matches)
 */
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 2 * 60 * 1000 // 2 minutes (shorter for live matches)

export async function fetchMatchesForTeamsCached(teamIds: number[]): Promise<{
  liveMatches: FootballDataMatch[]
  upcomingMatches: FootballDataMatch[]
}> {
  const cacheKey = teamIds.sort().join(',')
  const cached = cache.get(cacheKey)

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('💾 Using cached Football-Data')
    return cached.data
  }

  console.log('🔄 Fetching fresh Football-Data...')
  const data = await fetchMatchesForTeams(teamIds)
  cache.set(cacheKey, { data, timestamp: Date.now() })

  return data
}

/**
 * Clear the cache
 */
export function clearFootballDataCache() {
  cache.clear()
  console.log('🗑️ Football-Data cache cleared')
}
