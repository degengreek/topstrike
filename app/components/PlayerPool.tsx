/**
 * Player Pool Component
 * Shows all available players that can be assigned to positions
 */

import { getPlaceholderImage } from '@/lib/sportsdb'

interface Player {
  id: number
  name: string
  sharesOwned: string
  sharesOwnedInFullShares: number
  totalSupplyInFullShares: number
  currentPriceInWei: string
  imageUrl: string | null
  position: string
  originalPosition: string | null
  team: string | null
  formationPosition: string
}

interface PlayerPoolProps {
  players: Player[]
  assignedPlayerIds: Set<number>
  onPlayerSelect: (player: Player) => void
  selectedPosition: string | null
}

export default function PlayerPool({
  players,
  assignedPlayerIds,
  onPlayerSelect,
  selectedPosition
}: PlayerPoolProps) {

  // Group players by position type
  const forwards = players.filter(p => p.position === 'FWD')
  const midfielders = players.filter(p => p.position === 'MID')
  const defenders = players.filter(p => p.position === 'DEF')
  const goalkeepers = players.filter(p => p.position === 'GK')
  const unknown = players.filter(p => p.position === 'Unknown')
  const others = players.filter(p => !['FWD', 'MID', 'DEF', 'GK', 'Unknown'].includes(p.position))

  const renderPlayerGroup = (title: string, playerList: Player[]) => {
    if (playerList.length === 0) return null

    return (
      <div className="mb-4">
        <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2 flex items-center gap-2">
          {title}
          <span className="text-gray-500">({playerList.length})</span>
        </h4>
        <div className="space-y-1">
          {playerList.map((player) => {
            const isAssigned = assignedPlayerIds.has(player.id)
            const isClickable = selectedPosition !== null && !isAssigned

            return (
              <button
                key={player.id}
                onClick={() => isClickable && onPlayerSelect(player)}
                disabled={isAssigned || selectedPosition === null}
                className={`
                  w-full p-2 rounded-lg flex items-center gap-2 text-left transition-all
                  ${isAssigned
                    ? 'bg-gray-800 opacity-50 cursor-not-allowed'
                    : isClickable
                      ? 'bg-gray-700 hover:bg-blue-600 hover:scale-102 cursor-pointer'
                      : 'bg-gray-700 opacity-60 cursor-not-allowed'
                  }
                `}
              >
                <img
                  src={player.imageUrl || getPlaceholderImage()}
                  alt={player.name}
                  className="w-10 h-10 rounded object-contain bg-white/10"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white text-sm truncate">
                    {player.name}
                  </div>
                  <div className="text-xs text-gray-400 flex items-center gap-2">
                    <span className="font-semibold text-blue-400">{player.position}</span>
                    {player.originalPosition && player.originalPosition !== player.position && (
                      <span className="text-gray-500">({player.originalPosition})</span>
                    )}
                    {player.team && (
                      <>
                        <span>•</span>
                        <span className="truncate">{player.team}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-xs text-green-400 font-semibold whitespace-nowrap">
                  {player.sharesOwnedInFullShares}/{player.totalSupplyInFullShares}
                </div>
                {isAssigned && (
                  <div className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                    ✓ On Pitch
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-xl p-4 h-[700px] overflow-y-auto">
      <div className="mb-4 sticky top-0 bg-gray-800 pb-2 border-b border-gray-700">
        <h3 className="text-lg font-bold text-white">Available Players</h3>
        <p className="text-xs text-gray-400 mt-1">
          {selectedPosition
            ? `Click a player to assign to ${selectedPosition}`
            : 'Click a position on the pitch first'}
        </p>
      </div>

      {renderPlayerGroup('⚽ Forwards', forwards)}
      {renderPlayerGroup('🎯 Midfielders', midfielders)}
      {renderPlayerGroup('🛡️ Defenders', defenders)}
      {renderPlayerGroup('🧤 Goalkeepers', goalkeepers)}
      {unknown.length > 0 && renderPlayerGroup('❓ Unknown Position (can assign anywhere)', unknown)}
      {others.length > 0 && renderPlayerGroup('❓ Other', others)}
    </div>
  )
}
