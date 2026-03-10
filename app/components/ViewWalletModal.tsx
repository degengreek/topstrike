'use client'

import { X, Eye, TrendingUp } from 'lucide-react'
import { getTopStrikeUsername } from '@/lib/topstrike-usernames'
import { useState } from 'react'

interface Player {
  id: string
  name: string
  position: string
  team: string
  imageUrl?: string | null
  currentPriceInWei?: string
  sharesOwnedInFullShares?: number
}

interface GameweekHistory {
  week_number: number
  points: number
  start_date?: string
  end_date?: string
}

interface ViewWalletModalProps {
  walletAddress: string
  players: Player[]
  portfolioValue: string
  walletBalance: string
  onClose: () => void
}

export default function ViewWalletModal({
  walletAddress,
  players,
  portfolioValue,
  walletBalance,
  onClose
}: ViewWalletModalProps) {
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null)
  const [playerHistory, setPlayerHistory] = useState<Record<string, GameweekHistory[]>>({})
  const [loadingHistory, setLoadingHistory] = useState<Record<string, boolean>>({})

  const formatBalance = (balance: string) => {
    if (!balance) return '0.00'
    const eth = parseFloat(balance)
    return eth.toFixed(4)
  }

  const fetchPlayerHistory = async (playerId: string) => {
    // If already fetched, just toggle
    if (playerHistory[playerId]) {
      setExpandedPlayer(expandedPlayer === playerId ? null : playerId)
      return
    }

    // Fetch history
    setLoadingHistory({ ...loadingHistory, [playerId]: true })
    try {
      const response = await fetch(`/api/player-scores/history?player_id=${playerId}`)
      if (response.ok) {
        const data = await response.json()
        setPlayerHistory({ ...playerHistory, [playerId]: data.history || [] })
        setExpandedPlayer(playerId)
      }
    } catch (error) {
      console.error('Failed to fetch player history:', error)
    } finally {
      setLoadingHistory({ ...loadingHistory, [playerId]: false })
    }
  }

  const shortAddress = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
  const username = getTopStrikeUsername(walletAddress)

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 rounded-2xl border-2 border-blue-500 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {username ? `Viewing ${username}` : 'Viewing Wallet'}
                </h2>
                <p className="text-sm text-blue-100">{shortAddress}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 rounded-full text-white flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-500/30 rounded-xl p-4">
              <p className="text-gray-400 text-sm mb-1">Total Players</p>
              <p className="text-3xl font-bold text-white">{players.length}</p>
            </div>

            <div className="bg-gradient-to-br from-yellow-500/20 to-orange-600/20 border border-yellow-500/30 rounded-xl p-4">
              <p className="text-gray-400 text-sm mb-1">Portfolio Value</p>
              <p className="text-2xl font-bold text-white">
                {formatBalance(portfolioValue)} ETH
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-4">
              <p className="text-gray-400 text-sm mb-1">Wallet Balance</p>
              <p className="text-2xl font-bold text-white">
                {formatBalance(walletBalance)} ETH
              </p>
            </div>
          </div>

          {/* Players Grid */}
          <div className="bg-gray-800/50 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Players in Portfolio</h3>
            {players.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400">No players found in this wallet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {players.map((player) => {
                  const isExpanded = expandedPlayer === player.id
                  const history = playerHistory[player.id] || []
                  const isLoading = loadingHistory[player.id]

                  return (
                    <div
                      key={player.id}
                      className="relative bg-gray-700/50 rounded-lg p-4 border border-gray-600 hover:border-blue-500 transition-all cursor-pointer"
                      onClick={() => fetchPlayerHistory(player.id)}
                    >
                      {/* Shares Badge */}
                      {player.sharesOwnedInFullShares && player.sharesOwnedInFullShares > 1 && (
                        <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
                          {player.sharesOwnedInFullShares}
                        </div>
                      )}

                      <div className="flex flex-col items-center mb-3">
                        {player.imageUrl ? (
                          <img
                            src={player.imageUrl}
                            alt={player.name}
                            className="w-20 h-20 rounded-full object-cover border-2 border-gray-600 mb-3"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-gray-600 flex items-center justify-center border-2 border-gray-600 mb-3">
                            <span className="text-xl font-bold text-gray-400">
                              {player.name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <p className="font-semibold text-white text-sm text-center">{player.name}</p>
                      </div>

                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-green-400 bg-green-400/10 px-2 py-1 rounded">
                          {player.position}
                        </span>
                        <p className="text-xs text-gray-400">{player.team}</p>
                      </div>

                      {/* Gameweek History */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-gray-600">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-4 h-4 text-blue-400" />
                            <p className="text-xs font-semibold text-blue-400">Gameweek History</p>
                          </div>

                          {isLoading ? (
                            <div className="text-center py-2">
                              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                            </div>
                          ) : history.length === 0 ? (
                            <p className="text-xs text-gray-500 text-center py-2">No gameweek data yet</p>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {history.map((gw) => (
                                <div
                                  key={gw.week_number}
                                  className={`flex flex-col items-center px-2 py-1 rounded text-xs ${
                                    gw.points > 15
                                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                      : gw.points > 10
                                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                      : gw.points > 5
                                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                  }`}
                                >
                                  <span className="font-bold">{gw.points}</span>
                                  <span className="text-[10px] opacity-70">GW{gw.week_number}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {!isExpanded && (
                        <p className="text-xs text-center text-blue-400 mt-2 opacity-70">
                          Click to view history
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700 p-4 bg-gray-800/50">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
