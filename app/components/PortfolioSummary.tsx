'use client'

import { Wallet, TrendingUp } from 'lucide-react'
import { ethers } from 'ethers'

interface Player {
  id: number
  name: string
  sharesOwnedInFullShares: number
  totalSupplyInFullShares: number
  currentPriceInWei: string
}

interface PortfolioSummaryProps {
  players: Player[]
}

export default function PortfolioSummary({ players }: PortfolioSummaryProps) {
  // Calculate total value
  const totalValue = players.reduce((sum, player) => {
    const cardsOwned = player.sharesOwnedInFullShares
    const pricePerCard = BigInt(player.currentPriceInWei)
    const playerValue = BigInt(cardsOwned) * pricePerCard
    return sum + playerValue
  }, BigInt(0))

  // Calculate total cards
  const totalCards = players.reduce((sum, player) => sum + player.sharesOwnedInFullShares, 0)

  // Format ETH value
  const formatEth = (weiValue: bigint): string => {
    const eth = ethers.formatEther(weiValue)
    const num = parseFloat(eth)
    if (num < 0.001) return num.toFixed(6)
    if (num < 1) return num.toFixed(4)
    return num.toFixed(3)
  }

  // Calculate average price per card
  const avgPricePerCard = totalCards > 0 ? totalValue / BigInt(totalCards) : BigInt(0)

  return (
    <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-4 shadow-lg">
      <div className="flex items-center gap-2 mb-3">
        <Wallet className="w-5 h-5 text-white" />
        <h3 className="text-lg font-bold text-white">Portfolio Summary</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Total Value */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
          <div className="text-xs text-blue-200 mb-1">Total Value</div>
          <div className="text-2xl font-bold text-white">
            {formatEth(totalValue)} <span className="text-sm">ETH</span>
          </div>
        </div>

        {/* Total Cards */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
          <div className="text-xs text-blue-200 mb-1">Total Cards</div>
          <div className="text-2xl font-bold text-white">{totalCards}</div>
        </div>

        {/* Number of Players */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
          <div className="text-xs text-blue-200 mb-1">Players</div>
          <div className="text-xl font-bold text-white">{players.length}</div>
        </div>

        {/* Average Price */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
          <div className="text-xs text-blue-200 mb-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Avg Price/Card
          </div>
          <div className="text-xl font-bold text-white">
            {formatEth(avgPricePerCard)} <span className="text-xs">ETH</span>
          </div>
        </div>
      </div>
    </div>
  )
}
