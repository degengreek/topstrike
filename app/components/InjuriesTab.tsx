'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Heart, HeartOff, Ban, Calendar, AlertCircle } from 'lucide-react'

interface InjuryStatus {
  id: string
  player_id: string
  player_name: string
  team: string
  position: string
  injury_status: 'injured' | 'suspended'
  injury_type: string
  expected_return: string | null
  last_updated: string
}

export default function InjuriesTab() {
  const [injuries, setInjuries] = useState<InjuryStatus[]>([])
  const [suspensions, setSuspensions] = useState<InjuryStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<string | null>(null)

  useEffect(() => {
    fetchInjuries()
  }, [])

  const fetchInjuries = async () => {
    setLoading(true)
    setError(null)

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase credentials not configured')
      }

      const supabase = createClient(supabaseUrl, supabaseKey)

      const { data, error: fetchError } = await supabase
        .from('injury_status')
        .select('*')
        .order('player_name', { ascending: true })

      if (fetchError) throw fetchError

      if (data) {
        const injured = data.filter(i => i.injury_status === 'injured')
        const suspended = data.filter(i => i.injury_status === 'suspended')

        setInjuries(injured)
        setSuspensions(suspended)

        // Get most recent update time
        if (data.length > 0) {
          const sorted = [...data].sort((a, b) =>
            new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime()
          )
          setLastUpdate(sorted[0].last_updated)
        }
      }
    } catch (err) {
      console.error('Error fetching injuries:', err)
      setError(err instanceof Error ? err.message : 'Failed to load injury data')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Unknown'

    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    } catch {
      return 'Unknown'
    }
  }

  const formatLastUpdate = (dateString: string): string => {
    try {
      const date = new Date(dateString)
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
    } catch {
      return 'Unknown'
    }
  }

  const InjuryCard = ({ injury }: { injury: InjuryStatus }) => {
    const isInjured = injury.injury_status === 'injured'

    return (
      <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600/50 hover:border-gray-500/50 transition-all">
        <div className="flex items-start justify-between gap-4">
          {/* Player Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {isInjured ? (
                <HeartOff className="w-5 h-5 text-red-400 flex-shrink-0" />
              ) : (
                <Ban className="w-5 h-5 text-orange-400 flex-shrink-0" />
              )}
              <h3 className="text-white font-bold text-lg truncate">
                {injury.player_name}
              </h3>
            </div>

            <div className="text-gray-300 text-sm mb-2">
              {injury.team} • {injury.position}
            </div>

            <div className="text-gray-400 text-sm">
              <span className={isInjured ? 'text-red-300' : 'text-orange-300'}>
                {injury.injury_type}
              </span>
            </div>
          </div>

          {/* Return Date */}
          <div className="flex flex-col items-end text-right flex-shrink-0">
            <div className="text-xs text-gray-400 mb-1">Expected Return</div>
            <div className="flex items-center gap-1 text-sm">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className={injury.expected_return ? 'text-white font-medium' : 'text-gray-500'}>
                {formatDate(injury.expected_return)}
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-400">Loading injury data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <h3 className="text-red-300 font-bold text-lg mb-2">Failed to Load Injuries</h3>
        <p className="text-gray-400 text-sm">{error}</p>
        <button
          onClick={fetchInjuries}
          className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  const totalCount = injuries.length + suspensions.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Injuries & Suspensions
            </h2>
            <p className="text-gray-400 text-sm">
              Showing {totalCount} affected {totalCount === 1 ? 'player' : 'players'} from your TopStrike database
            </p>
          </div>
          {lastUpdate && (
            <div className="text-right">
              <div className="text-xs text-gray-500 mb-1">Last Updated</div>
              <div className="text-sm text-gray-300 font-medium">
                {formatLastUpdate(lastUpdate)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <HeartOff className="w-8 h-8 text-red-400" />
            <div>
              <div className="text-3xl font-bold text-white">{injuries.length}</div>
              <div className="text-red-300 text-sm font-medium">Injured Players</div>
            </div>
          </div>
        </div>

        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <Ban className="w-8 h-8 text-orange-400" />
            <div>
              <div className="text-3xl font-bold text-white">{suspensions.length}</div>
              <div className="text-orange-300 text-sm font-medium">Suspended Players</div>
            </div>
          </div>
        </div>
      </div>

      {/* Injured Players */}
      {injuries.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <HeartOff className="w-6 h-6 text-red-400" />
            Injured Players ({injuries.length})
          </h3>
          <div className="space-y-3">
            {injuries.map(injury => (
              <InjuryCard key={injury.id} injury={injury} />
            ))}
          </div>
        </div>
      )}

      {/* Suspended Players */}
      {suspensions.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Ban className="w-6 h-6 text-orange-400" />
            Suspended Players ({suspensions.length})
          </h3>
          <div className="space-y-3">
            {suspensions.map(suspension => (
              <InjuryCard key={suspension.id} injury={suspension} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {totalCount === 0 && (
        <div className="text-center py-12">
          <Heart className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">All Clear!</h3>
          <p className="text-gray-400">
            No injuries or suspensions in your player database
          </p>
        </div>
      )}
    </div>
  )
}
