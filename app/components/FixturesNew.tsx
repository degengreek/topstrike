'use client'

import { useState, useEffect } from 'react'
import { Zap, Clock } from 'lucide-react'
import type { FootballDataMatch } from '@/lib/football-data-fixtures'

interface FixturesNewProps {
  playerTeams: string[] // Array of team names from user's players
}

export default function FixturesNew({ playerTeams }: FixturesNewProps) {
  const [liveGames, setLiveGames] = useState<FootballDataMatch[]>([])
  const [upcomingFixtures, setUpcomingFixtures] = useState<FootballDataMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeSubTab, setActiveSubTab] = useState<'live' | 'upcoming'>('live')

  useEffect(() => {
    if (playerTeams.length > 0) {
      fetchFixtures()
    }
  }, [playerTeams])

  const fetchFixtures = async () => {
    try {
      setLoading(true)
      setError(null)

      if (playerTeams.length === 0) {
        setError('No teams found in your portfolio')
        setLoading(false)
        return
      }

      console.log(`🔍 Fetching fixtures for ${playerTeams.length} teams...`)

      // Call our API route with team names (URL encoded)
      const teamNamesParam = playerTeams.map(name => encodeURIComponent(name)).join(',')
      const response = await fetch(`/api/football-data?teamNames=${teamNamesParam}`)
      const data = await response.json()

      console.log('📊 Football-Data Response:', data)
      console.log('🔴 Live games:', data.liveGames?.length || 0)
      console.log('📅 Upcoming fixtures:', data.upcomingFixtures?.length || 0)

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch fixtures')
      }

      if (data.error) {
        throw new Error(data.error)
      }

      setLiveGames(data.liveGames || [])
      setUpcomingFixtures(data.upcomingFixtures || [])

      // Auto-switch to live sub-tab if there are live games
      if (data.liveGames && data.liveGames.length > 0) {
        setActiveSubTab('live')
      } else {
        setActiveSubTab('upcoming')
      }

    } catch (err: any) {
      console.error('Failed to fetch fixtures:', err)
      setError(err.message || 'Unable to load fixtures')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (utcDateString: string) => {
    const date = new Date(utcDateString)
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })

    if (date.toDateString() === now.toDateString()) {
      return `Today ${timeStr}`
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow ${timeStr}`
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-gray-800/50 rounded-xl p-8 min-h-[600px] flex items-center justify-center">
          <div className="text-gray-400">Loading fixtures...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-gray-800/50 rounded-xl p-8 min-h-[600px] flex items-center justify-center">
          <div className="text-center px-4">
            <div className="text-6xl mb-4">⚽</div>
            <p className="text-gray-400 mb-2">Unable to Load Fixtures</p>
            <p className="text-gray-500 text-sm">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-xl p-4 h-[700px] flex flex-col">
      {/* Header with Tabs */}
      <div className="mb-4 pb-3 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-bold text-white">Fixtures</h3>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`
              px-4 py-2 rounded-lg text-sm font-semibold transition-all
              ${activeTab === 'upcoming'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }
            `}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Upcoming ({upcomingFixtures.length})
            </div>
          </button>

          <button
            onClick={() => setActiveTab('live')}
            className={`
              px-4 py-2 rounded-lg text-sm font-semibold transition-all
              ${activeTab === 'live'
                ? 'bg-red-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }
            `}
          >
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Live ({liveGames.length})
            </div>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'live' && (
          <div className="space-y-3">
            {liveGames.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                No live games right now
              </div>
            ) : (
              liveGames.map((game) => (
                <div
                  key={game.id}
                  className="bg-gradient-to-r from-red-600/20 to-orange-600/20 border border-red-500/50 rounded-lg p-3 animate-pulse-slow"
                >
                  {/* League & Live Badge */}
                  <div className="text-xs text-gray-400 mb-2 flex items-center gap-2">
                    <Zap className="w-3 h-3 text-red-400" />
                    <span className="font-semibold text-red-400">LIVE</span>
                    <span>•</span>
                    <span>{game.competition.name}</span>
                    <span>•</span>
                    <span className="text-red-400">{game.status === 'PAUSED' ? 'HT' : game.status}</span>
                  </div>

                  {/* Teams & Score */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img src={game.homeTeam.crest} alt="" className="w-5 h-5" />
                        <span className="text-white font-medium text-sm">
                          {game.homeTeam.name}
                        </span>
                      </div>
                      <span className="text-white font-bold text-lg">
                        {game.score.fullTime.home ?? '-'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img src={game.awayTeam.crest} alt="" className="w-5 h-5" />
                        <span className="text-white font-medium text-sm">
                          {game.awayTeam.name}
                        </span>
                      </div>
                      <span className="text-white font-bold text-lg">
                        {game.score.fullTime.away ?? '-'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'upcoming' && (
          <div className="space-y-3">
            {upcomingFixtures.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                No upcoming fixtures
              </div>
            ) : (
              upcomingFixtures.map((fixture) => (
                <div
                  key={fixture.id}
                  className="bg-gray-700/50 rounded-lg p-3 hover:bg-gray-700 transition-colors"
                >
                  {/* League & Time */}
                  <div className="text-xs text-gray-400 mb-2">
                    {fixture.competition.name} • {formatDate(fixture.utcDate)}
                  </div>

                  {/* Teams */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img src={fixture.homeTeam.crest} alt="" className="w-5 h-5" />
                        <span className="text-white font-medium text-sm">
                          {fixture.homeTeam.name}
                        </span>
                      </div>
                      <span className="text-gray-400 text-xs">HOME</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img src={fixture.awayTeam.crest} alt="" className="w-5 h-5" />
                        <span className="text-white font-medium text-sm">
                          {fixture.awayTeam.name}
                        </span>
                      </div>
                      <span className="text-gray-400 text-xs">AWAY</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
