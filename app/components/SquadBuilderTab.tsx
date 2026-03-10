'use client'

import { useState, useEffect } from 'react'
import { formations, FormationType } from '@/lib/formations'
import { getCurrentGameweek, isSquadLocked, getTimeUntilChange, formatTimeRemaining, type Gameweek } from '@/lib/gameweek'
import { getStoredScores, getPlayerScore, type PlayerScore } from '@/lib/scores'

interface Player {
  id: string
  name: string
  position: string
  team: string
  imageUrl?: string | null
}

// Position compatibility mapping
const positionCompatibility: Record<string, string[]> = {
  // Goalkeeper positions
  'GK': ['GK'],

  // Defender positions
  'DEF': ['CB', 'LB', 'RB', 'LWB', 'RWB'],

  // Midfielder positions
  'MID': ['CM', 'CDM', 'CAM', 'LM', 'RM', 'LWB', 'RWB'],

  // Forward positions
  'FWD': ['ST', 'LW', 'RW', 'CF'],
}

// Check if a player can play in a formation position
function canPlayInPosition(playerPosition: string, formationPosition: string): boolean {
  const compatiblePositions = positionCompatibility[playerPosition] || []
  return compatiblePositions.includes(formationPosition)
}

// Score Circle Component
function ScoreCircle({ score }: { score: number }) {
  return (
    <div
      className={`
        w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
        ${score === 0
          ? 'bg-gray-500 text-gray-300'  // Grey for no score
          : 'bg-white text-gray-900'      // White with black text for scores
        }
      `}
      title={score === 0 ? 'No recent match' : `${score} points`}
    >
      {score}
    </div>
  )
}

interface SquadBuilderTabProps {
  players: Player[]
  assignedPlayers: Map<string, Player>
  onAssignPlayer: (positionId: string, player: Player) => void
  onRemovePlayer: (positionId: string) => void
  onClearAll: () => void
  formation: FormationType
  onFormationChange: (formation: FormationType) => void
  onSaveSquad: () => Promise<void>
}

export default function SquadBuilderTab({
  players,
  assignedPlayers,
  onAssignPlayer,
  onRemovePlayer,
  onClearAll,
  formation,
  onFormationChange,
  onSaveSquad
}: SquadBuilderTabProps) {
  const [draggedPlayer, setDraggedPlayer] = useState<Player | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [gameweek, setGameweek] = useState<Gameweek | null>(null)
  const [countdown, setCountdown] = useState('')
  const [isLocked, setIsLocked] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [positionFilter, setPositionFilter] = useState('All')

  // Scores state
  const [scores, setScores] = useState<PlayerScore[]>([])

  const currentFormation = formations[formation]

  // Fetch current gameweek on mount
  useEffect(() => {
    getCurrentGameweek().then(gw => {
      setGameweek(gw)
      if (gw) {
        setIsLocked(isSquadLocked(gw))
      }
    })
  }, [])

  // Load stored scores on mount
  useEffect(() => {
    getStoredScores().then(setScores)
  }, [])

  // Update countdown every minute
  useEffect(() => {
    if (!gameweek) return

    const updateCountdown = () => {
      const timeData = getTimeUntilChange(gameweek)
      setIsLocked(timeData.isLocked)
      setCountdown(`${timeData.label} ${formatTimeRemaining(timeData.timeRemaining)}`)
    }

    updateCountdown() // Initial update
    const interval = setInterval(updateCountdown, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [gameweek])

  // Get list of assigned player IDs
  const assignedPlayerIds = new Set(
    Array.from(assignedPlayers.values()).map(p => p.id)
  )

  // Filter players (exclude already assigned)
  const filteredPlayers = players.filter(player => {
    // Exclude assigned players
    if (assignedPlayerIds.has(player.id)) return false

    const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         player.team.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesPosition = positionFilter === 'All' || player.position === positionFilter
    return matchesSearch && matchesPosition
  })

  const uniquePositions = ['All', ...Array.from(new Set(players.map(p => p.position)))]

  const handleDragStart = (player: Player) => {
    if (isLocked) return // Disable drag when locked
    setDraggedPlayer(player)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (positionId: string) => {
    if (!draggedPlayer || isLocked) return // Disable drop when locked

    // Get the formation position
    const formationPos = currentFormation.positions.find(p => p.id === positionId)
    if (!formationPos) return

    // Check if player can play in this position
    if (!canPlayInPosition(draggedPlayer.position, formationPos.label)) {
      alert(`${draggedPlayer.name} (${draggedPlayer.position}) cannot play as ${formationPos.label}`)
      setDraggedPlayer(null)
      return
    }

    onAssignPlayer(positionId, draggedPlayer)
    setDraggedPlayer(null)
  }

  const handleSaveSquad = async () => {
    setSaving(true)
    setSaveError('')
    setSaveSuccess(false)

    try {
      await onSaveSquad()
      setSaveSuccess(true)

      // Hide success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false)
      }, 3000)
    } catch (error: any) {
      setSaveError(error.message || 'Failed to save squad')
    } finally {
      setSaving(false)
    }
  }


  return (
    <div className="flex gap-6 min-h-[calc(100vh-200px)]">
      {/* Left Sidebar - Player List */}
      <div className="w-80 bg-gray-800/50 rounded-xl p-4 flex flex-col max-h-[calc(100vh-200px)] overflow-hidden">
        <h2 className="text-lg font-bold text-white mb-4">Available Players</h2>

        {/* Search */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search players..."
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-green-500"
        />

        {/* Position Filter */}
        <select
          value={positionFilter}
          onChange={(e) => setPositionFilter(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          {uniquePositions.map(pos => (
            <option key={pos} value={pos}>{pos}</option>
          ))}
        </select>

        {/* Player List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          {filteredPlayers.map((player) => (
            <div
              key={player.id}
              draggable={!isLocked}
              onDragStart={() => handleDragStart(player)}
              className={`bg-gray-700 rounded-lg p-3 transition-colors border border-gray-600 ${
                isLocked
                  ? 'opacity-50 cursor-not-allowed'
                  : 'cursor-move hover:bg-gray-600 hover:border-green-500'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Player Image */}
                {player.imageUrl ? (
                  <img
                    src={player.imageUrl}
                    alt={player.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-gray-600"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center border-2 border-gray-600">
                    <span className="text-xs font-bold text-gray-400">
                      {player.name.charAt(0)}
                    </span>
                  </div>
                )}

                <div className="flex-1">
                  <p className="font-semibold text-white text-sm">{player.name}</p>
                  <p className="text-xs text-gray-400">{player.team}</p>
                </div>

                <div className="flex items-center gap-2">
                  <ScoreCircle score={getPlayerScore(scores, player.id)} />
                  <span className="text-xs font-semibold text-green-400 bg-green-400/10 px-2 py-1 rounded">
                    {player.position}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-700">
          <p className="text-xs text-gray-400 text-center">
            Drag players to formation →
          </p>
        </div>
      </div>

      {/* Right Side - Formation */}
      <div className="flex-1 bg-gray-800/50 rounded-xl p-6 flex flex-col sticky top-4 self-start">
        {/* Lock/Unlock Status Banner */}
        {gameweek && (
          <div className={`mb-4 rounded-lg p-3 text-center font-semibold ${
            isLocked
              ? 'bg-red-500/20 border border-red-500/50 text-red-400'
              : 'bg-blue-500/20 border border-blue-500/50 text-blue-400'
          }`}>
            {isLocked ? (
              <div className="flex items-center justify-center gap-2">
                <span className="text-xl">🔒</span>
                <span>{countdown}</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <span className="text-xl">⏰</span>
                <span>{countdown}</span>
              </div>
            )}
          </div>
        )}

        {/* Header with Formation Selector and Clear All */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Formation
            </label>
            <select
              value={formation}
              onChange={(e) => onFormationChange(e.target.value as FormationType)}
              disabled={isLocked}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="4-3-3">4-3-3</option>
              <option value="4-4-2">4-4-2</option>
              <option value="3-5-2">3-5-2</option>
              <option value="4-2-3-1">4-2-3-1</option>
              <option value="3-4-3">3-4-3</option>
              <option value="5-3-2">5-3-2</option>
              <option value="5-4-1">5-4-1</option>
            </select>
          </div>
          <button
            onClick={onClearAll}
            disabled={isLocked}
            className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear All
          </button>
        </div>

        {/* Football Pitch */}
        <div className="flex-1 flex items-start justify-center pt-4">
          <div className="relative w-full max-w-2xl mx-auto aspect-[2/3]">
            {/* Pitch Background - Vertical orientation */}
            <div className="absolute inset-0 bg-gradient-to-b from-green-600 via-green-700 to-green-800 rounded-xl overflow-hidden">
              {/* Pitch Lines */}
              <div className="absolute inset-0">
                {/* Border */}
                <div className="absolute inset-2 border-2 border-white/30 rounded-sm"></div>

                {/* Center line (horizontal) */}
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/30 transform -translate-y-1/2"></div>

                {/* Center circle */}
                <div className="absolute top-1/2 left-1/2 w-24 h-24 border-2 border-white/30 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white/30 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>

                {/* Top penalty box */}
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-48 h-20 border-2 border-b-0 border-white/30"></div>
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-12 border-2 border-b-0 border-white/30"></div>

                {/* Bottom penalty box */}
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-48 h-20 border-2 border-t-0 border-white/30"></div>
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-12 border-2 border-t-0 border-white/30"></div>
              </div>
            </div>

            {/* Formation Layout */}
            <div className="relative w-full h-full p-6">
              {currentFormation.positions.map((position) => (
                <div
                  key={position.id}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(position.id)}
                  className="absolute"
                  style={{
                    left: `${position.x}%`,
                    top: `${position.y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  {assignedPlayers.has(position.id) ? (
                    // Assigned Player
                    <div className="relative group">
                      <div className="w-24 h-32 bg-gray-900/90 rounded-lg border-2 border-green-400 shadow-lg flex flex-col items-center justify-between p-1.5 cursor-pointer hover:bg-gray-800 transition-all overflow-hidden">
                        {/* Player Image */}
                        {assignedPlayers.get(position.id)!.imageUrl ? (
                          <img
                            src={assignedPlayers.get(position.id)!.imageUrl!}
                            alt={assignedPlayers.get(position.id)!.name}
                            className="w-14 h-14 rounded-full object-cover border-2 border-green-400 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center border-2 border-green-400 flex-shrink-0">
                            <span className="text-base font-bold text-white">
                              {assignedPlayers.get(position.id)!.name.charAt(0)}
                            </span>
                          </div>
                        )}
                        {/* Player Name & Team */}
                        <div className="w-full text-center flex-1 flex flex-col justify-center">
                          <p className="text-[9px] text-white font-semibold leading-tight truncate px-0.5">
                            {assignedPlayers.get(position.id)!.name}
                          </p>
                          <p className="text-[8px] text-gray-400 leading-tight truncate">
                            ({assignedPlayers.get(position.id)!.team})
                          </p>
                        </div>
                        {/* Position label at bottom */}
                        <div className="w-full bg-green-400/20 rounded px-1.5 py-0.5">
                          <span className="text-[9px] text-green-400 font-bold block text-center">
                            {position.label}
                          </span>
                        </div>
                      </div>
                      {/* Score Circle Overlay */}
                      <div className="absolute -top-2 -left-2">
                        <ScoreCircle score={getPlayerScore(scores, assignedPlayers.get(position.id)!.id)} />
                      </div>
                      {!isLocked && (
                        <button
                          onClick={() => onRemovePlayer(position.id)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ) : (
                    // Empty Slot
                    <div className="w-24 h-32 bg-gray-900/60 rounded-lg border-2 border-dashed border-gray-500 shadow-lg flex flex-col items-center justify-center hover:border-green-400 hover:bg-gray-800/60 transition-all">
                      <span className="text-[10px] text-gray-400 font-semibold">
                        {position.label}
                      </span>
                      <span className="text-[8px] text-gray-500 mt-0.5">
                        Drop here
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 text-sm text-center">
          <span className="text-gray-400">
            Players: {assignedPlayers.size} / {currentFormation.positions.length}
          </span>
        </div>

        {/* Save Team Button */}
        <div className="mt-6 space-y-3">
          <button
            onClick={handleSaveSquad}
            disabled={saving || isLocked}
            className="w-full px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-500 hover:to-emerald-500 transition-all font-semibold text-sm shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                💾 Save Team
              </>
            )}
          </button>


          {/* Success Message */}
          {saveSuccess && (
            <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 text-center animate-fade-in">
              <p className="text-green-400 font-semibold flex items-center justify-center gap-2">
                <span className="text-xl">✅</span>
                Squad Saved!
              </p>
              <p className="text-xs text-green-300 mt-1">
                Saved at {new Date().toLocaleTimeString()}
              </p>
            </div>
          )}

          {/* Error Message */}
          {saveError && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-center">
              <p className="text-red-400 font-semibold">❌ {saveError}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
