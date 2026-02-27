'use client'

import { useState, useEffect } from 'react'
import { Calendar } from 'lucide-react'

interface Fixture {
  id: string
  homeTeam: string
  awayTeam: string
  competition: string
  date: string
  status?: string
}

export default function Fixtures() {
  const [fixtures, setFixtures] = useState<Fixture[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchFixtures()
  }, [])

  const fetchFixtures = async () => {
    try {
      setLoading(true)
      // Use our API route to bypass CORS
      const response = await fetch('/api/fixtures')

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      // Handle error responses from our API
      if (data.error) {
        throw new Error(data.error)
      }

      // Parse the fixtures data (structure TBD based on API response)
      if (Array.isArray(data)) {
        setFixtures(data.slice(0, 10)) // Show first 10 fixtures
      } else if (data.fixtures) {
        setFixtures(data.fixtures.slice(0, 10))
      } else {
        setFixtures([])
      }

      setError(null)
    } catch (err) {
      console.error('Failed to fetch fixtures:', err)
      setError('Unable to load fixtures')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      if (date.toDateString() === today.toDateString()) {
        return `Today ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
      } else if (date.toDateString() === tomorrow.toDateString()) {
        return `Tomorrow ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
      } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      }
    } catch {
      return dateString
    }
  }

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-xl p-4 h-[700px]">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-700">
          <Calendar className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-bold text-white">Upcoming Fixtures</h3>
        </div>
        <div className="flex items-center justify-center h-[600px]">
          <div className="text-gray-400">Loading fixtures...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-xl p-4 h-[700px]">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-700">
          <Calendar className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-bold text-white">Upcoming Fixtures</h3>
        </div>
        <div className="flex items-center justify-center h-[600px]">
          <div className="text-center px-4">
            <div className="text-6xl mb-4">⚽</div>
            <p className="text-gray-400 mb-2">Fixtures Unavailable</p>
            <p className="text-gray-500 text-sm mb-4">
              TopStrike API requires authentication
            </p>
            <div className="bg-gray-700/50 rounded-lg p-4 text-left text-xs text-gray-400">
              <p className="mb-2">To enable fixtures:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Check TopStrike app DevTools</li>
                <li>Find fixtures API headers</li>
                <li>Add auth token to API route</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-xl p-4 h-[700px] overflow-y-auto">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-700 sticky top-0 bg-gray-800">
        <Calendar className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-bold text-white">Upcoming Fixtures</h3>
      </div>

      {fixtures.length === 0 ? (
        <div className="text-center text-gray-400 py-8">
          No fixtures available
        </div>
      ) : (
        <div className="space-y-3">
          {fixtures.map((fixture, index) => (
            <div
              key={fixture.id || index}
              className="bg-gray-700/50 rounded-lg p-3 hover:bg-gray-700 transition-colors"
            >
              {/* Competition */}
              {fixture.competition && (
                <div className="text-xs text-gray-400 mb-2">
                  {fixture.competition}
                </div>
              )}

              {/* Teams */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium text-sm">
                    {fixture.homeTeam}
                  </span>
                  <span className="text-gray-400 text-xs">HOME</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium text-sm">
                    {fixture.awayTeam}
                  </span>
                  <span className="text-gray-400 text-xs">AWAY</span>
                </div>
              </div>

              {/* Date/Time */}
              <div className="mt-2 text-xs text-blue-400">
                {formatDate(fixture.date)}
              </div>

              {/* Status */}
              {fixture.status && (
                <div className="mt-2 text-xs text-green-400">
                  {fixture.status}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
