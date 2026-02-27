'use client'

import { useState, useEffect } from 'react'
import { Zap, Clock } from 'lucide-react'
import type { FootballDataMatch } from '@/lib/football-data-fixtures'

interface FixturesTabProps {
  playerTeams: string[] // Array of team names from user's players
}

export default function FixturesTab({ playerTeams }: FixturesTabProps) {
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
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
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
    <div className="max-w-6xl mx-auto">
      {/* Sub-tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveSubTab('live')}
          className={`
            px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2
            ${activeSubTab === 'live'
              ? 'bg-red-600 text-white shadow-lg'
              : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
            }
          `}
        >
          <Zap className="w-5 h-5" />
          Live ({liveGames.length})
        </button>

        <button
          onClick={() => setActiveSubTab('upcoming')}
          className={`
            px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2
            ${activeSubTab === 'upcoming'
              ? 'bg-green-600 text-white shadow-lg'
              : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
            }
          `}
        >
          <Clock className="w-5 h-5" />
          Upcoming ({upcomingFixtures.length})
        </button>
      </div>

      {/* Content */}
      <div className="bg-gray-800/50 rounded-xl p-6">
        {activeSubTab === 'live' && (
          <div className="space-y-4">
            {liveGames.length === 0 ? (
              <div className="text-center text-gray-400 py-16">
                <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No live games right now</p>
              </div>
            ) : (
              liveGames.map((game) => (
                <div
                  key={game.id}
                  className="bg-gradient-to-r from-red-600/20 to-orange-600/20 border border-red-500/50 rounded-lg p-4 hover:shadow-lg transition-shadow"
                >
                  {/* Competition & Status */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span className="font-semibold text-red-400 flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        LIVE
                      </span>
                      <span>•</span>
                      <span>{game.competition.name}</span>
                      <span>•</span>
                      <span className="text-red-400">{game.status === 'PAUSED' ? 'HT' : game.status}</span>
                    </div>
                  </div>

                  {/* Teams & Score */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={game.homeTeam.crest} alt="" className="w-8 h-8 object-contain" />
                        <span className="text-white font-semibold">{game.homeTeam.name}</span>
                      </div>
                      <span className="text-white font-bold text-2xl">{game.score.fullTime.home ?? '-'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={game.awayTeam.crest} alt="" className="w-8 h-8 object-contain" />
                        <span className="text-white font-semibold">{game.awayTeam.name}</span>
                      </div>
                      <span className="text-white font-bold text-2xl">{game.score.fullTime.away ?? '-'}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeSubTab === 'upcoming' && (
          <div className="space-y-4">
            {upcomingFixtures.length === 0 ? (
              <div className="text-center text-gray-400 py-16">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No upcoming fixtures</p>
              </div>
            ) : (
              upcomingFixtures.map((fixture) => (
                <div
                  key={fixture.id}
                  className="bg-gray-700/50 rounded-lg p-4 hover:bg-gray-700 transition-colors border border-gray-600 hover:border-green-500"
                >
                  {/* Competition & Time */}
                  <div className="flex items-center justify-between mb-3 text-xs text-gray-400">
                    <span>{fixture.competition.name}</span>
                    <span className="text-green-400 font-semibold">{formatDate(fixture.utcDate)}</span>
                  </div>

                  {/* Teams */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={fixture.homeTeam.crest} alt="" className="w-8 h-8 object-contain" />
                        <span className="text-white font-semibold">{fixture.homeTeam.name}</span>
                      </div>
                      <span className="text-gray-400 text-xs font-semibold">HOME</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={fixture.awayTeam.crest} alt="" className="w-8 h-8 object-contain" />
                        <span className="text-white font-semibold">{fixture.awayTeam.name}</span>
                      </div>
                      <span className="text-gray-400 text-xs font-semibold">AWAY</span>
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
