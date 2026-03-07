'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface Player {
  id: string
  name: string
}

export default function AdminScoresPage() {
  const { data: session } = useSession()
  const [players, setPlayers] = useState<Player[]>([])
  const [scores, setScores] = useState<Record<string, number>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Load players and current scores
    fetch('/api/scores/fetch-scores')
      .then(res => res.json())
      .then(data => {
        if (data.scores) {
          const scoreMap: Record<string, number> = {}
          data.scores.forEach((s: any) => {
            scoreMap[s.player_id] = s.most_recent_score || 0
          })
          setScores(scoreMap)
        }
      })
  }, [])

  const handleScoreChange = (playerId: string, value: string) => {
    const numValue = parseInt(value) || 0
    setScores(prev => ({ ...prev, [playerId]: numValue }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Convert scores object to array format
      const scoresArray = Object.entries(scores).map(([player_id, most_recent_score]) => ({
        player_id,
        player_name: players.find(p => p.id === player_id)?.name || 'Unknown',
        most_recent_score,
        match_date: new Date().toISOString().split('T')[0],
        match_opponent: 'Manual Entry',
        match_state: 'FT'
      }))

      const response = await fetch('/api/scores/save-scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scores: scoresArray })
      })

      if (!response.ok) throw new Error('Failed to save')

      alert('✅ Scores saved successfully!')
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleBulkImport = () => {
    const input = prompt('Paste player scores (format: playerId:score, one per line)\n\nExample:\n14:34\n70:28\n86:15')
    if (!input) return

    const lines = input.trim().split('\n')
    const newScores = { ...scores }

    lines.forEach(line => {
      const [id, score] = line.split(':').map(s => s.trim())
      if (id && score) {
        newScores[id] = parseInt(score) || 0
      }
    })

    setScores(newScores)
    alert('✅ Bulk import successful!')
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-4">Admin Access Required</h1>
          <p className="text-gray-400">Please sign in to access this page</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Manual Score Entry</h1>
          <p className="text-gray-400">
            Temporary solution while we work on automatic score fetching
          </p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <div className="flex gap-4 mb-6">
            <button
              onClick={handleBulkImport}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
            >
              📋 Bulk Import
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold disabled:opacity-50"
            >
              {saving ? 'Saving...' : '💾 Save All Scores'}
            </button>
          </div>

          <div className="text-sm text-gray-400 mb-4">
            <p className="mb-2">
              <strong className="text-white">How to get scores from TopStrike:</strong>
            </p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Go to <a href="https://play.topstrike.io" target="_blank" className="text-blue-400 underline">play.topstrike.io</a></li>
              <li>Open each player's page and note their recent match score</li>
              <li>Enter scores below or use bulk import</li>
            </ol>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {Object.entries(scores).map(([playerId, score]) => (
              <div key={playerId} className="flex items-center gap-4 bg-gray-700 p-3 rounded-lg">
                <span className="text-white flex-1">
                  Player ID: {playerId}
                </span>
                <input
                  type="number"
                  value={score}
                  onChange={(e) => handleScoreChange(playerId, e.target.value)}
                  className="w-24 px-3 py-2 bg-gray-600 text-white rounded border border-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Score"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="text-sm text-gray-500 text-center">
          <p>This is a temporary admin page. Automatic fetching will be enabled once we solve the API access issue.</p>
        </div>
      </div>
    </div>
  )
}
