'use client'

import { useState } from 'react'
import { Eye, EyeOff, X } from 'lucide-react'

interface Player {
  id: string
  name: string
  position: string
  team: string
  imageUrl?: string | null
  currentPriceInWei?: string
  sharesOwnedInFullShares?: number
}

interface PortfolioSummaryTabProps {
  players: Player[]
  walletAddress: string
  walletBalance?: string
  portfolioValue?: string
}

export default function PortfolioSummaryTab({
  players,
  walletAddress,
  walletBalance,
  portfolioValue
}: PortfolioSummaryTabProps) {
  const [showBalance, setShowBalance] = useState(true)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)

  // Format balance for display
  const formatBalance = (balance?: string) => {
    if (!balance) return '0.00'
    const eth = parseFloat(balance)
    return eth.toFixed(4)
  }

  // Calculate stats
  const totalPlayers = players.length
  const uniqueTeams = new Set(players.map(p => p.team)).size
  const positionCounts = players.reduce((acc, player) => {
    acc[player.position] = (acc[player.position] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="max-w-6xl mx-auto">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Total Players</p>
              <p className="text-3xl font-bold text-white">{totalPlayers}</p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-600/20 border border-blue-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Teams</p>
              <p className="text-3xl font-bold text-white">{uniqueTeams}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⚽</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/20 to-orange-600/20 border border-yellow-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-gray-400 text-sm mb-1">Portfolio Value</p>
              <p className="text-2xl font-bold text-white">
                {portfolioValue ? `${formatBalance(portfolioValue)} ETH` : 'N/A'}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-gray-400 text-sm">Wallet Balance</p>
                <button
                  onClick={() => setShowBalance(!showBalance)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-2xl font-bold text-white">
                {showBalance
                  ? walletBalance ? `${formatBalance(walletBalance)} ETH` : 'N/A'
                  : '••••••'
                }
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💼</span>
            </div>
          </div>
        </div>
      </div>

      {/* Position Breakdown */}
      <div className="bg-gray-800/50 rounded-xl p-6 mb-8">
        <h3 className="text-lg font-bold text-white mb-4">Position Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(positionCounts)
            .sort(([, a], [, b]) => b - a)
            .map(([position, count]) => (
              <div key={position} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                <p className="text-gray-400 text-xs mb-1">{position}</p>
                <p className="text-2xl font-bold text-white">{count}</p>
              </div>
            ))}
        </div>
      </div>

      {/* Player Grid */}
      <div className="bg-gray-800/50 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">All Players</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {players.map((player) => (
            <div
              key={player.id}
              onClick={() => setSelectedPlayer(player)}
              className="relative bg-gray-700/50 rounded-lg p-4 border border-gray-600 hover:border-green-500 transition-colors cursor-pointer"
            >
              {/* Shares Badge */}
              {player.sharesOwnedInFullShares && player.sharesOwnedInFullShares > 1 && (
                <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
                  {player.sharesOwnedInFullShares}
                </div>
              )}

              <div className="flex flex-col items-center mb-3">
                {/* Player Image - Large */}
                {player.imageUrl ? (
                  <img
                    src={player.imageUrl}
                    alt={player.name}
                    className="w-24 h-24 rounded-full object-cover border-2 border-gray-600 mb-3"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-600 flex items-center justify-center border-2 border-gray-600 mb-3">
                    <span className="text-2xl font-bold text-gray-400">
                      {player.name.charAt(0)}
                    </span>
                  </div>
                )}
                <p className="font-semibold text-white text-sm text-center">{player.name}</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-green-400 bg-green-400/10 px-2 py-1 rounded">
                  {player.position}
                </span>
                <p className="text-xs text-gray-400">{player.team}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Player Detail Modal */}
      {selectedPlayer && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPlayer(null)}
        >
          <div
            className="bg-gray-900 rounded-2xl border-2 border-green-500 shadow-2xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with close button */}
            <div className="relative h-32 bg-gradient-to-br from-green-600 via-green-700 to-emerald-800">
              <button
                onClick={() => setSelectedPlayer(null)}
                className="absolute top-4 right-4 w-8 h-8 bg-red-500 rounded-full text-white flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Player Image - Large */}
              <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
                {selectedPlayer.imageUrl ? (
                  <img
                    src={selectedPlayer.imageUrl}
                    alt={selectedPlayer.name}
                    className="w-32 h-32 rounded-full object-cover border-4 border-green-500 bg-gray-900"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center border-4 border-green-500">
                    <span className="text-4xl font-bold text-white">
                      {selectedPlayer.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="pt-20 pb-6 px-6">
              {/* Name & Position */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">{selectedPlayer.name}</h2>
                <div className="flex items-center justify-center gap-2">
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-semibold">
                    {selectedPlayer.position}
                  </span>
                  <span className="text-gray-400 text-sm">{selectedPlayer.team}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <p className="text-xs text-gray-400 mb-3 text-center">Stats</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <p className="text-xs text-gray-400 mb-1">Goals</p>
                    <p className="text-lg font-bold text-white">-</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400 mb-1">Assists</p>
                    <p className="text-lg font-bold text-white">-</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400 mb-1">Matches</p>
                    <p className="text-lg font-bold text-white">-</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
