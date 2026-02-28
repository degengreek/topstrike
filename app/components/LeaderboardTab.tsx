'use client'

import { Trophy, Crown, Medal, Star, Sparkles } from 'lucide-react'
import { getAllWalletLinks } from '@/lib/wallet-storage'
import { useEffect, useState } from 'react'

interface LeaderboardEntry {
  twitterUsername: string
  topStrikeUsername?: string
  walletAddress: string
  points: number
}

export default function LeaderboardTab() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])

  useEffect(() => {
    // Get all users who linked their wallets via Twitter sign-in
    const links = getAllWalletLinks()

    const leaderboardData = links.map(link => ({
      twitterUsername: link.twitterUsername,
      topStrikeUsername: link.topStrikeUsername,
      walletAddress: link.walletAddress,
      points: 0 // Will be calculated later
    }))

    // Sort by points (descending) - for now all 0
    leaderboardData.sort((a, b) => b.points - a.points)

    setEntries(leaderboardData)
  }, [])

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="w-6 h-6 text-yellow-400" />
      case 1:
        return <Medal className="w-6 h-6 text-gray-400" />
      case 2:
        return <Medal className="w-6 h-6 text-orange-400" />
      default:
        return <div className="w-6 h-6 flex items-center justify-center text-gray-400 font-bold">{index + 1}</div>
    }
  }

  const getRankBadge = (index: number) => {
    switch (index) {
      case 0:
        return 'bg-gradient-to-r from-yellow-500 to-amber-500 border-yellow-400'
      case 1:
        return 'bg-gradient-to-r from-gray-400 to-gray-500 border-gray-300'
      case 2:
        return 'bg-gradient-to-r from-orange-500 to-amber-600 border-orange-400'
      default:
        return 'bg-gray-800/50 border-gray-700'
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Prize Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-900/40 via-pink-900/40 to-purple-900/40 border-2 border-purple-500/30 rounded-2xl p-8 mb-8">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(168, 85, 247, 0.4) 0%, transparent 50%),
                              radial-gradient(circle at 80% 80%, rgba(236, 72, 153, 0.4) 0%, transparent 50%),
                              radial-gradient(circle at 40% 20%, rgba(147, 51, 234, 0.3) 0%, transparent 50%)`
          }}></div>
        </div>

        <div className="relative z-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
            <Trophy className="w-12 h-12 text-yellow-400" />
            <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
          </div>

          <h2 className="text-4xl font-bold text-white mb-3">
            Compete & Win Amazing Prizes! 🏆
          </h2>

          <p className="text-lg text-purple-200 mb-6 max-w-2xl mx-auto">
            Battle for the top spot on the leaderboard! Weekly rewards and exclusive prizes
            await the best managers. Track your performance and climb the ranks!
          </p>

          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
              <span className="text-yellow-400 font-bold">🥇 1st Place:</span>
              <span className="text-white ml-2">Premium Rewards</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
              <span className="text-gray-300 font-bold">🥈 2nd Place:</span>
              <span className="text-white ml-2">Elite Prizes</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
              <span className="text-orange-400 font-bold">🥉 3rd Place:</span>
              <span className="text-white ml-2">Special Rewards</span>
            </div>
          </div>

          <div className="mt-6 inline-flex items-center gap-2 bg-green-500/20 border border-green-500/30 rounded-lg px-4 py-2">
            <Star className="w-4 h-4 text-green-400" />
            <span className="text-sm text-green-300 font-medium">
              Points system coming soon! Get ready to compete 🔥
            </span>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-6 h-6" />
            Global Leaderboard
          </h3>
          <p className="text-sm text-green-100 mt-1">
            {entries.length} {entries.length === 1 ? 'manager' : 'managers'} competing
          </p>
        </div>

        <div className="p-4">
          {entries.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-2">No competitors yet!</p>
              <p className="text-gray-500 text-sm">
                Be the first to link your wallet and join the competition
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry, index) => (
                <div
                  key={entry.walletAddress}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all hover:scale-[1.02] ${getRankBadge(index)}`}
                >
                  {/* Rank */}
                  <div className="flex-shrink-0 w-12 flex items-center justify-center">
                    {getRankIcon(index)}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {entry.topStrikeUsername && (
                        <p className="text-white font-bold text-lg truncate">
                          {entry.topStrikeUsername}
                        </p>
                      )}
                      <p className="text-gray-400 text-sm truncate">
                        @{entry.twitterUsername}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 font-mono truncate">
                      {entry.walletAddress.slice(0, 10)}...{entry.walletAddress.slice(-8)}
                    </p>
                  </div>

                  {/* Points */}
                  <div className="flex-shrink-0 text-right">
                    <div className="bg-gray-900/50 rounded-lg px-4 py-2 min-w-[100px]">
                      <p className="text-2xl font-bold text-white">{entry.points}</p>
                      <p className="text-xs text-gray-400">points</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <Star className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
          <div>
            <h4 className="text-white font-bold mb-2">How It Works</h4>
            <ul className="text-sm text-blue-200 space-y-1">
              <li>• Link your wallet and sign in with Twitter to join the leaderboard</li>
              <li>• Earn points based on your players' real-world performance</li>
              <li>• Compete weekly for prizes and exclusive rewards</li>
              <li>• Build the best squad to maximize your points!</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
