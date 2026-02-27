'use client'

import { useState } from 'react'
import { formations, FormationType } from '@/lib/formations'

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

interface SquadBuilderTabProps {
  players: Player[]
  assignedPlayers: Map<string, Player>
  onAssignPlayer: (positionId: string, player: Player) => void
  onRemovePlayer: (positionId: string) => void
  onClearAll: () => void
  formation: FormationType
  onFormationChange: (formation: FormationType) => void
}

export default function SquadBuilderTab({
  players,
  assignedPlayers,
  onAssignPlayer,
  onRemovePlayer,
  onClearAll,
  formation,
  onFormationChange
}: SquadBuilderTabProps) {
  const [draggedPlayer, setDraggedPlayer] = useState<Player | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [positionFilter, setPositionFilter] = useState('All')

  const currentFormation = formations[formation]

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
    setDraggedPlayer(player)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (positionId: string) => {
    if (!draggedPlayer) return

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
              draggable
              onDragStart={() => handleDragStart(player)}
              className="bg-gray-700 rounded-lg p-3 cursor-move hover:bg-gray-600 transition-colors border border-gray-600 hover:border-green-500"
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

                <span className="text-xs font-semibold text-green-400 bg-green-400/10 px-2 py-1 rounded">
                  {player.position}
                </span>
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
        {/* Header with Formation Selector and Clear All */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Formation
            </label>
            <select
              value={formation}
              onChange={(e) => onFormationChange(e.target.value as FormationType)}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="4-3-3">4-3-3</option>
              <option value="4-4-2">4-4-2</option>
              <option value="3-5-2">3-5-2</option>
              <option value="4-2-3-1">4-2-3-1</option>
              <option value="3-4-3">3-4-3</option>
            </select>
          </div>
          <button
            onClick={onClearAll}
            className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors font-medium"
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
                      <div className="w-20 h-24 bg-gray-900/90 rounded-lg border-2 border-green-400 shadow-lg flex flex-col items-center justify-between p-1.5 cursor-pointer hover:bg-gray-800 transition-all overflow-hidden">
                        {/* Player Image */}
                        {assignedPlayers.get(position.id)!.imageUrl ? (
                          <img
                            src={assignedPlayers.get(position.id)!.imageUrl!}
                            alt={assignedPlayers.get(position.id)!.name}
                            className="w-14 h-14 rounded-full object-cover border-2 border-green-400"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center border-2 border-green-400">
                            <span className="text-base font-bold text-white">
                              {assignedPlayers.get(position.id)!.name.charAt(0)}
                            </span>
                          </div>
                        )}
                        {/* Position label at bottom */}
                        <div className="w-full bg-green-400/20 rounded px-1.5 py-0.5">
                          <span className="text-[9px] text-green-400 font-bold block text-center">
                            {position.label}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => onRemovePlayer(position.id)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    // Empty Slot
                    <div className="w-20 h-24 bg-gray-900/60 rounded-lg border-2 border-dashed border-gray-500 shadow-lg flex flex-col items-center justify-center hover:border-green-400 hover:bg-gray-800/60 transition-all">
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
      </div>
    </div>
  )
}
