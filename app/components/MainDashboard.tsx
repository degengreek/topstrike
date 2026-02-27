'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { ethers } from 'ethers'
import { fetchUserPortfolio, type PlayerData, getProvider } from '@/lib/megaeth'
import { getPlayerByName } from '@/lib/player-database'
import { normalizePosition } from '@/lib/sportsdb'
import { getTeamOverride } from '@/lib/team-overrides'
import { getVerifiedPlayerData } from '@/lib/verified-players'
import { loadSquad, saveSquad, clearSavedSquad } from '@/lib/squad-storage'
import { saveWalletLink, getWalletLink } from '@/lib/wallet-storage'
import { formations, FormationType } from '@/lib/formations'
import Header from './Header'
import SquadBuilderTab from './SquadBuilderTab'
import PortfolioSummaryTab from './PortfolioSummaryTab'
import FixturesTab from './FixturesTab'

interface Player {
  id: string
  name: string
  position: string
  team: string
  imageUrl?: string | null
  currentPriceInWei?: string
  sharesOwnedInFullShares?: number
}

// Add placeholder image generator
function getPlaceholderImage(name: string): string {
  // Generate a simple placeholder based on player name
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=128`
}

export default function MainDashboard() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<'squad' | 'portfolio' | 'fixtures'>('squad')
  const [walletAddress, setWalletAddress] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(false)
  const [showWalletLink, setShowWalletLink] = useState(false)
  const [formation, setFormation] = useState<FormationType>('4-3-3')
  const [assignedPlayers, setAssignedPlayers] = useState<Map<string, Player>>(new Map())
  const [walletBalance, setWalletBalance] = useState<string>('0')
  const [portfolioValue, setPortfolioValue] = useState<string>('0')

  // Check for linked wallet on session change or mount
  useEffect(() => {
    // Check localStorage for saved wallet (even without Twitter login)
    const savedWallet = localStorage.getItem('topstrike_wallet')
    if (savedWallet) {
      setWalletAddress(savedWallet)
      handleSearch(savedWallet)
      return
    }

    // Check Twitter-linked wallet
    if (session?.user?.id) {
      const linkedWallet = getWalletLink(session.user.id)
      if (linkedWallet && linkedWallet.walletAddress) {
        setWalletAddress(linkedWallet.walletAddress)
        handleSearch(linkedWallet.walletAddress)
      } else {
        setShowWalletLink(true)
      }
    }
  }, [session])

  // Load saved squad when wallet changes
  useEffect(() => {
    if (walletAddress && players.length > 0) {
      const saved = loadSquad(walletAddress)
      if (saved) {
        setFormation(saved.formation as FormationType)
        const newAssigned = new Map<string, Player>()
        Object.entries(saved.assignedPlayers).forEach(([posId, playerData]: [string, any]) => {
          const player = players.find(p => p.id === playerData.id)
          if (player) {
            newAssigned.set(posId, player)
          }
        })
        setAssignedPlayers(newAssigned)
      }
    }
  }, [walletAddress, players])

  // Auto-save squad on changes
  useEffect(() => {
    if (walletAddress && assignedPlayers.size > 0) {
      saveSquad(walletAddress, formation, assignedPlayers)
    }
  }, [walletAddress, formation, assignedPlayers])

  const handleSearch = async (address: string) => {
    if (!address || !address.trim()) return

    setLoading(true)
    setShowWalletLink(false)
    try {
      const portfolio: PlayerData[] = await fetchUserPortfolio(address)

      const enrichedPlayers: Player[] = await Promise.all(
        portfolio.map(async (p) => {
          // 1. Check team overrides first (manual overrides)
          const override = getTeamOverride(p.name)
          if (override) {
            // Also check player database for image
            let imageUrl = null
            try {
              const dbPlayer = await getPlayerByName(p.name)
              if (dbPlayer && dbPlayer.imageUrl) {
                imageUrl = dbPlayer.imageUrl
              }
            } catch (err) {
              // No image found, use null
            }

            return {
              id: p.id.toString(),
              name: p.name,
              position: normalizePosition(override.position),
              team: override.team,
              imageUrl: imageUrl,
              currentPriceInWei: p.currentPriceInWei,
              sharesOwnedInFullShares: p.sharesOwnedInFullShares
            }
          }

          // 2. Check verified players (small curated list)
          const verified = getVerifiedPlayerData(p.name)
          if (verified) {
            // Also check player database for image
            let imageUrl = null
            try {
              const dbPlayer = await getPlayerByName(p.name)
              if (dbPlayer && dbPlayer.imageUrl) {
                imageUrl = dbPlayer.imageUrl
              }
            } catch (err) {
              // No image found, use null
            }

            return {
              id: p.id.toString(),
              name: p.name,
              position: normalizePosition(verified.position),
              team: verified.team,
              imageUrl: imageUrl,
              currentPriceInWei: p.currentPriceInWei,
              sharesOwnedInFullShares: p.sharesOwnedInFullShares
            }
          }

          // 3. Check the comprehensive player database
          try {
            const dbPlayer = await getPlayerByName(p.name)
            if (dbPlayer && dbPlayer.team && dbPlayer.position) {
              return {
                id: p.id.toString(),
                name: p.name,
                position: normalizePosition(dbPlayer.position),
                team: dbPlayer.team,
                imageUrl: dbPlayer.imageUrl,
                currentPriceInWei: p.currentPriceInWei,
                sharesOwnedInFullShares: p.sharesOwnedInFullShares
              }
            }
          } catch (err) {
            console.warn(`Could not find ${p.name} in player database`)
          }

          // 4. Default fallback
          return {
            id: p.id.toString(),
            name: p.name,
            position: 'MID',
            team: 'Unknown',
            imageUrl: null,
            currentPriceInWei: p.currentPriceInWei,
            sharesOwnedInFullShares: p.sharesOwnedInFullShares
          }
        })
      )

      setPlayers(enrichedPlayers)
      setWalletAddress(address)

      // Calculate portfolio value (total value of all player shares)
      let totalValueInWei = BigInt(0)
      for (const player of enrichedPlayers) {
        if (player.currentPriceInWei && player.sharesOwnedInFullShares) {
          const pricePerShare = BigInt(player.currentPriceInWei)
          const shares = BigInt(player.sharesOwnedInFullShares)
          totalValueInWei += pricePerShare * shares
        }
      }
      const portfolioValueInEth = ethers.formatEther(totalValueInWei)
      setPortfolioValue(portfolioValueInEth)

      // Fetch wallet balance
      try {
        const provider = getProvider()
        const balance = await provider.getBalance(address)
        const balanceInEth = ethers.formatEther(balance)
        setWalletBalance(balanceInEth)
      } catch (err) {
        console.error('Failed to fetch wallet balance:', err)
        setWalletBalance('0')
      }

      // Save to localStorage (persists even without Twitter login)
      localStorage.setItem('topstrike_wallet', address)

      // Also link wallet to Twitter if signed in
      if (session?.user?.id) {
        saveWalletLink(session.user.id, session.user.name || '', address)
      }
    } catch (error) {
      console.error('Failed to fetch portfolio:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAssignPlayer = (positionId: string, player: Player) => {
    const newAssigned = new Map(assignedPlayers)
    newAssigned.set(positionId, player)
    setAssignedPlayers(newAssigned)
  }

  const handleRemovePlayer = (positionId: string) => {
    const newAssigned = new Map(assignedPlayers)
    newAssigned.delete(positionId)
    setAssignedPlayers(newAssigned)
  }

  const handleClearAll = () => {
    setAssignedPlayers(new Map())
  }

  const handleFormationChange = (newFormation: FormationType) => {
    setFormation(newFormation)
    // Clear assignments when changing formation
    setAssignedPlayers(new Map())
  }

  const playerTeamNames = Array.from(new Set(players.map(p => p.team).filter(t => t && t !== 'Unknown'))) as string[]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 35px, rgba(34, 197, 94, 0.1) 35px, rgba(34, 197, 94, 0.1) 70px),
            repeating-linear-gradient(90deg, transparent, transparent 35px, rgba(34, 197, 94, 0.1) 35px, rgba(34, 197, 94, 0.1) 70px)
          `
        }}></div>
      </div>

      {/* Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSearch={handleSearch}
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        walletAddress={walletAddress}
        walletBalance={walletBalance}
      />

      {/* Main Content */}
      <main className="relative z-10 px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center min-h-[600px]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Loading portfolio...</p>
            </div>
          </div>
        ) : players.length === 0 ? (
          <div className="flex items-center justify-center min-h-[600px]">
            <div className="text-center max-w-md">
              <div className="text-6xl mb-4">⚽</div>
              <h2 className="text-2xl font-bold text-white mb-2">Welcome to TopStrike Manager</h2>
              <p className="text-gray-400 mb-6">
                Enter your TopStrike wallet address in the search bar above to get started
              </p>
              <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                <p className="text-sm text-green-300 mb-3">
                  💡 Your wallet will be saved automatically for next time!
                </p>
                {showWalletLink && session?.user && (
                  <p className="text-xs text-gray-400">
                    Signed in as @{session.user.name}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'squad' && (
              <SquadBuilderTab
                players={players}
                assignedPlayers={assignedPlayers}
                onAssignPlayer={handleAssignPlayer}
                onRemovePlayer={handleRemovePlayer}
                onClearAll={handleClearAll}
                formation={formation}
                onFormationChange={handleFormationChange}
              />
            )}

            {activeTab === 'portfolio' && (
              <PortfolioSummaryTab
                players={players}
                walletAddress={walletAddress}
                walletBalance={walletBalance}
                portfolioValue={portfolioValue}
              />
            )}

            {activeTab === 'fixtures' && (
              <FixturesTab playerTeams={playerTeamNames} />
            )}
          </>
        )}
      </main>
    </div>
  )
}
