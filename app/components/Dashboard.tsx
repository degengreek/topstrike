'use client'

import { useState, useEffect } from 'react'
import { Search, Users, X, Save, Trash2, LogIn, LogOut, Link } from 'lucide-react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { fetchUserPortfolio, type PlayerData } from '@/lib/megaeth'
import { searchPlayerByName, getPlaceholderImage, normalizePosition } from '@/lib/sportsdb'
import { loadPlayerDatabase, getPlayerFromCache, isDatabaseLoaded } from '@/lib/player-cache'
import { getTeamOverride } from '@/lib/team-overrides'
import { getVerifiedPlayerData } from '@/lib/verified-players'
import { saveSquad, loadSquad, clearSavedSquad } from '@/lib/squad-storage'
import { saveWalletLink, getWalletLink, hasWalletLink } from '@/lib/wallet-storage'
import FormationSelector, { getFormationPositions } from './FormationSelector'
import PlayerPool from './PlayerPool'
import PortfolioSummary from './PortfolioSummary'
import FixturesNew from './FixturesNew'

// ==============================================================================
// TYPE DEFINITIONS
// ==============================================================================

/**
 * Player Interface - Matches data from TopStrike smart contract
 */
interface Player {
  id: number
  name: string
  sharesOwned: string // Amount of shares owned (from contract)
  sharesOwnedInFullShares: number // Cards owned (e.g., 1)
  totalSupplyInFullShares: number // Total cards (e.g., 46)
  currentPriceInWei: string // Current price in wei
  imageUrl: string | null // Player image from TheSportsDB
  position: string // Player position (FWD, MID, DEF, GK) - normalized
  originalPosition: string | null // Original position from TheSportsDB (e.g., "Left Wing")
  team: string | null // Player team (e.g., "Roma")
  formationPosition: string // Position in formation (ST, CM, etc.)
}

// ==============================================================================
// PLAYER SPRITE COMPONENT
// ==============================================================================

/**
 * PlayerSprite - Displays real player images from TheSportsDB API
 * Falls back to placeholder if image not available
 */
const PlayerSprite = ({ player }: { player: Player | null }) => {
  if (!player) {
    // Empty slot - shows a dashed outline
    return (
      <div className="w-16 h-16 border-2 border-dashed border-white/30 rounded-full flex items-center justify-center">
        <Users className="w-8 h-8 text-white/30" />
      </div>
    )
  }

  // Display real player image or placeholder
  return (
    <div className="relative w-16 h-16">
      <img
        src={player.imageUrl || getPlaceholderImage()}
        alt={player.name}
        className="w-full h-full object-contain rounded-lg bg-white/10 border-2 border-white/20"
        onError={(e) => {
          // Fallback if image fails to load
          e.currentTarget.src = getPlaceholderImage()
        }}
      />
    </div>
  )
}

// ==============================================================================
// PLAYER CARD COMPONENT
// ==============================================================================

/**
 * InteractivePlayerCard - Clickable position slot that can be assigned a player
 */
const InteractivePlayerCard = ({
  player,
  positionId,
  positionLabel,
  positionType,
  isSelected,
  onClick,
  onRemove
}: {
  player: Player | null
  positionId: string
  positionLabel: string
  positionType: 'FWD' | 'MID' | 'DEF' | 'GK'
  isSelected: boolean
  onClick: () => void
  onRemove: () => void
}) => {
  const [isHovered, setIsHovered] = useState(false)

  // Format price from wei to ETH
  const formatPrice = (priceInWei: string): string => {
    try {
      const wei = BigInt(priceInWei)
      const eth = Number(wei) / 1e18
      return eth.toFixed(6) + ' ETH'
    } catch {
      return '- ETH'
    }
  }

  // Empty slot
  if (!player) {
    return (
      <div className="flex flex-col items-center gap-1 relative">
        <button
          onClick={onClick}
          className={`
            w-16 h-16 border-2 rounded-full flex items-center justify-center
            transition-all cursor-pointer
            ${isSelected
              ? 'border-blue-500 bg-blue-500/20 scale-110 animate-pulse'
              : 'border-dashed border-white/30 hover:border-blue-400 hover:bg-blue-500/10'
            }
          `}
        >
          <Users className={`w-8 h-8 ${isSelected ? 'text-blue-400' : 'text-white/30'}`} />
        </button>
        <div className={`
          bg-black/50 px-2 py-1 rounded text-xs font-semibold
          ${isSelected ? 'text-blue-400' : 'text-white/50'}
        `}>
          {positionLabel}
        </div>
        {isSelected && (
          <div className="absolute -bottom-8 text-[10px] text-blue-400 whitespace-nowrap">
            Select player →
          </div>
        )}
      </div>
    )
  }

  // Assigned player
  return (
    <div
      className="flex flex-col items-center gap-1 relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        <PlayerSprite player={player} />
        {/* Remove button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="w-3 h-3 text-white" />
        </button>
      </div>

      {/* Player Info */}
      <div className="bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs text-white text-center min-w-[100px]">
        <div className="font-bold truncate max-w-[120px]">{player.name}</div>
        <div className="text-[10px] mt-0.5 text-gray-300 flex items-center justify-center gap-1">
          <span className="font-semibold text-blue-400">{player.position}</span>
          {player.team && (
            <>
              <span className="text-gray-500">•</span>
              <span className="truncate max-w-[80px]">{player.team}</span>
            </>
          )}
        </div>
      </div>

      {/* Hover Tooltip */}
      {isHovered && (
        <div className="absolute top-full mt-2 z-50 bg-gray-900 border-2 border-blue-500 rounded-lg px-3 py-2 shadow-xl min-w-[140px]">
          <div className="text-xs space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Cards:</span>
              <span className="text-white font-bold">
                {player.sharesOwnedInFullShares}/{player.totalSupplyInFullShares}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Price:</span>
              <span className="text-green-400 font-semibold text-[10px]">
                {formatPrice(player.currentPriceInWei)}
              </span>
            </div>
          </div>
          {/* Arrow */}
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-blue-500"></div>
        </div>
      )}
    </div>
  )
}

// ==============================================================================
// MAIN DASHBOARD COMPONENT
// ==============================================================================

export default function Dashboard() {
  // ==============================================================================
  // STATE MANAGEMENT
  // ==============================================================================

  const { data: session, status } = useSession()
  const [walletAddress, setWalletAddress] = useState('')
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  // Squad builder state
  const [selectedFormation, setSelectedFormation] = useState('4-3-3')
  const [assignedPlayers, setAssignedPlayers] = useState<Map<string, Player>>(new Map())
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null)
  const [showSaveNotification, setShowSaveNotification] = useState(false)

  // Twitter auth & wallet linking state
  const [linkedWallet, setLinkedWallet] = useState<string | null>(null)
  const [showLinkWallet, setShowLinkWallet] = useState(false)
  const [tempWallet, setTempWallet] = useState('')
  const [linkingWallet, setLinkingWallet] = useState(false)

  // ==============================================================================
  // EFFECTS
  // ==============================================================================

  // Load player database on mount
  useEffect(() => {
    loadPlayerDatabase()
  }, [])

  // Auto-save squad when it changes
  useEffect(() => {
    if (walletAddress && assignedPlayers.size > 0) {
      saveSquad(walletAddress, selectedFormation, assignedPlayers)
    }
  }, [assignedPlayers, selectedFormation, walletAddress])

  // Check for linked wallet when user signs in
  useEffect(() => {
    if (session?.user?.id) {
      checkLinkedWallet(session.user.id)
    }
  }, [session])

  // ==============================================================================
  // HANDLERS
  // ==============================================================================

  /**
   * handleSearch - Fetches players from TopStrike contract on MegaETH
   *
   * ✅ REAL BLOCKCHAIN INTEGRATION ACTIVE!
   * 1. Validates wallet address format
   * 2. Connects to MegaETH mainnet
   * 3. Fetches user's player portfolio from TopStrike contract
   * 4. Fetches real player images from TheSportsDB API
   */
  const handleSearch = async () => {
    console.clear() // Clear console for fresh logs
    console.log('🚀 SEARCH STARTED')
    console.log('=' .repeat(50))

    if (!walletAddress.trim()) {
      alert('Please enter a wallet address')
      return
    }

    setLoading(true)
    setSearched(false)

    try {
      await performSearch(walletAddress)
    } catch (error: any) {
      console.error('Error fetching players:', error)
      alert(error.message || 'Failed to fetch players. Please try again.')
      setPlayers([])
      setSearched(false)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Perform the actual portfolio search (extracted for reuse)
   */
  const performSearch = async (searchWallet: string) => {
    try {
      // Step 1: Fetch player portfolio from blockchain
      console.log('🔍 START: Fetching portfolio for:', searchWallet)
      const portfolioData = await fetchUserPortfolio(searchWallet)

      console.log('✅ SUCCESS: Found players:', portfolioData.length)
      console.log('📋 Full portfolio data:', portfolioData)

      if (portfolioData.length === 0) {
        const message = `No TopStrike player shares found for this wallet.\n\nThis wallet hasn't purchased any player shares yet.`
        alert(message)
        setPlayers([])
        setSearched(true)
        setLoading(false)
        return
      }

      // Step 2: Fetch player info (images, position, team) from TheSportsDB API
      const playersWithInfo: Player[] = await Promise.all(
        portfolioData.map(async (playerData) => {
          // No auto-assignment - users manually build their squad
          const formationPosition = 'POOL' // All players start in the pool

          console.log(`\n🎮 Processing: ${playerData.name}`)
          console.log(`   📊 Cards owned: ${playerData.sharesOwnedInFullShares}`)
          console.log(`   📈 Total supply: ${playerData.totalSupplyInFullShares}`)
          console.log(`   💰 Price: ${playerData.currentPriceInWei}`)

          // Fetch player info - Priority: Verified > Cache > TheSportsDB
          let playerInfo: { imageUrl: string | null, position: string | null, team: string | null } = { imageUrl: null, position: null, team: null }

          // PRIORITY 1: Check verified manual data first (highest priority)
          const verifiedData = getVerifiedPlayerData(playerData.name)
          if (verifiedData) {
            playerInfo.position = verifiedData.position
            playerInfo.team = verifiedData.team
            console.log(`   ✅ VERIFIED: ${verifiedData.position} - ${verifiedData.team}`)
          }

          // PRIORITY 2: Check cache (if no verified data or need image)
          if (!verifiedData && isDatabaseLoaded()) {
            const cachedInfo = getPlayerFromCache(playerData.id)
            if (cachedInfo) {
              playerInfo = cachedInfo
              console.log(`   💾 From cache: ${playerInfo.position || 'Unknown'} - ${playerInfo.team || 'Unknown team'}`)
            }
          }

          // If verified data exists but no image yet, try to get image from cache
          if (verifiedData && !playerInfo.imageUrl && isDatabaseLoaded()) {
            const cachedInfo = getPlayerFromCache(playerData.id)
            if (cachedInfo?.imageUrl) {
              playerInfo.imageUrl = cachedInfo.imageUrl
              console.log(`   🖼️  Image from cache`)
            }
          }

          // Fall back to live TheSportsDB search if not in cache
          if (!playerInfo.imageUrl && !isDatabaseLoaded()) {
            try {
              playerInfo = await searchPlayerByName(playerData.name)
              console.log(`   🌐 From SportsDB: ${playerInfo.imageUrl ? 'Found' : 'Not found'}`)
              console.log(`   ⚽ Position: ${playerInfo.position || 'Unknown'}`)
              console.log(`   🏟️  Team: ${playerInfo.team || 'Unknown'}`)
            } catch (err) {
              console.error(`   ❌ Failed to fetch info for ${playerData.name}:`, err)
            }
          }

          // PRIORITY 3: Apply team overrides (only if not verified)
          if (!verifiedData) {
            const teamOverride = getTeamOverride(playerData.name)
            if (teamOverride) {
              console.log(`   🔧 Team override applied: ${teamOverride.team}`)
              playerInfo.team = teamOverride.team
              if (teamOverride.position) {
                playerInfo.position = teamOverride.position
              }
            }
          }

          return {
            id: playerData.id,
            name: playerData.name,
            sharesOwned: playerData.sharesOwned,
            sharesOwnedInFullShares: playerData.sharesOwnedInFullShares,
            totalSupplyInFullShares: playerData.totalSupplyInFullShares,
            currentPriceInWei: playerData.currentPriceInWei,
            imageUrl: playerInfo.imageUrl,
            position: normalizePosition(playerInfo.position),
            originalPosition: playerInfo.position,
            team: playerInfo.team,
            formationPosition
          }
        })
      )

      setPlayers(playersWithInfo)
      setSearched(true)
      setLoading(false)

      // Try to load saved squad for this wallet
      const savedSquad = loadSquad(searchWallet)
      if (savedSquad) {
        console.log('📥 Found saved squad, restoring...')

        // Restore formation
        setSelectedFormation(savedSquad.formation)

        // Restore assigned players
        const restoredAssignments = new Map<string, Player>()
        Object.entries(savedSquad.assignedPlayers).forEach(([positionId, savedPlayer]) => {
          // Find the full player object from the fetched players
          const fullPlayer = playersWithInfo.find(p => p.id === savedPlayer.id)
          if (fullPlayer) {
            restoredAssignments.set(positionId, fullPlayer)
          }
        })

        if (restoredAssignments.size > 0) {
          setAssignedPlayers(restoredAssignments)
          // Show notification
          setShowSaveNotification(true)
          setTimeout(() => setShowSaveNotification(false), 3000)
        }
      }

    } catch (error: any) {
      console.error('Error in performSearch:', error)
      setPlayers([])
      setSearched(false)
      setLoading(false)
      throw error
    }
  }

  /**
   * handleConnectX - Placeholder for X (Twitter) OAuth connection
   */
  const handleConnectX = () => {
    alert('X (Twitter) connection coming soon!')
  }

  /**
   * Handle position click - select a position to assign a player to
   */
  const handlePositionClick = (positionId: string) => {
    setSelectedPosition(positionId)
  }

  /**
   * Handle player selection - assign a player to the selected position
   */
  const handlePlayerSelect = (player: Player, positionType: 'FWD' | 'MID' | 'DEF' | 'GK') => {
    if (!selectedPosition) return

    // Validate position compatibility
    const isCompatible = validatePositionCompatibility(player.position, positionType)
    if (!isCompatible) {
      const posDisplay = player.originalPosition ? `${player.position} - "${player.originalPosition}"` : player.position
      alert(`❌ ${player.name} (${posDisplay}) cannot be assigned to a ${positionType} position!`)
      return
    }

    // Assign player to position
    const newAssignments = new Map(assignedPlayers)
    newAssignments.set(selectedPosition, player)
    setAssignedPlayers(newAssignments)
    setSelectedPosition(null)
  }

  /**
   * Validate if a player's position is compatible with the pitch position
   */
  const validatePositionCompatibility = (playerPos: string, positionType: 'FWD' | 'MID' | 'DEF' | 'GK'): boolean => {
    // Allow "Unknown" position players to be assigned to any non-GK position
    if (playerPos === 'Unknown' && positionType !== 'GK') return true

    // Exact match
    if (playerPos === positionType) return true

    // Strict GK validation
    if (positionType === 'GK' && playerPos !== 'GK') return false
    if (playerPos === 'GK' && positionType !== 'GK') return false

    return playerPos === positionType
  }

  /**
   * Remove player from position
   */
  const handleRemovePlayer = (positionId: string) => {
    const newAssignments = new Map(assignedPlayers)
    newAssignments.delete(positionId)
    setAssignedPlayers(newAssignments)
    setSelectedPosition(null)
  }

  /**
   * Clear all assignments when formation changes
   */
  const handleFormationChange = (formation: string) => {
    setSelectedFormation(formation)
    setAssignedPlayers(new Map())
    setSelectedPosition(null)
  }

  /**
   * Clear entire squad
   */
  const handleClearSquad = () => {
    if (assignedPlayers.size === 0) return

    const confirmed = window.confirm('Clear all players from the pitch?')
    if (confirmed) {
      setAssignedPlayers(new Map())
      setSelectedPosition(null)
      clearSavedSquad()
      console.log('🗑️ Squad cleared')
    }
  }

  /**
   * Check if Twitter user has a linked wallet
   */
  const checkLinkedWallet = async (twitterId: string) => {
    try {
      // Check localStorage first (client-side, persists between sessions)
      const storedWallet = getWalletLink(twitterId)

      if (storedWallet) {
        console.log('✅ Found linked wallet in localStorage:', storedWallet)
        setLinkedWallet(storedWallet)
        setWalletAddress(storedWallet)
        setShowLinkWallet(false)
        // Auto-trigger search
        handleSearchWithWallet(storedWallet)
        return
      }

      console.log('💡 No linked wallet found, showing link prompt')
      setShowLinkWallet(true)
    } catch (error) {
      console.error('Failed to check linked wallet:', error)
      setShowLinkWallet(true)
    }
  }

  /**
   * Link wallet to Twitter account
   */
  const handleLinkWallet = async () => {
    if (!session?.user?.id || !session?.user?.name || !tempWallet.trim()) {
      alert('Please enter a valid wallet address')
      return
    }

    // Validate wallet format
    if (!tempWallet.match(/^0x[a-fA-F0-9]{40}$/)) {
      alert('Invalid wallet address format. Should be 0x followed by 40 hex characters.')
      return
    }

    setLinkingWallet(true)

    try {
      // Save to localStorage (persists between sessions)
      saveWalletLink(session.user.id, session.user.name, tempWallet)

      console.log('✅ Wallet linked successfully to localStorage')
      setLinkedWallet(tempWallet)
      setWalletAddress(tempWallet)
      setShowLinkWallet(false)

      // Auto-load portfolio
      handleSearchWithWallet(tempWallet)
    } catch (error) {
      console.error('Error linking wallet:', error)
      alert('Failed to link wallet. Please try again.')
    } finally {
      setLinkingWallet(false)
    }
  }

  /**
   * Handle search with a specific wallet address (for auto-load)
   */
  const handleSearchWithWallet = async (wallet: string) => {
    if (!wallet) return

    console.clear()
    console.log('🚀 AUTO-LOADING PORTFOLIO')
    console.log('=' .repeat(50))

    setLoading(true)
    setSearched(false)

    try {
      await performSearch(wallet)
    } finally {
      setLoading(false)
    }
  }

  // ==============================================================================
  // FORMATION LAYOUT - Dynamic based on selected formation
  // ==============================================================================

  /**
   * Get formation structure based on selected formation
   */
  const getFormationStructure = () => {
    const formations: Record<string, { forwards: string[], midfielders: string[], defenders: string[] }> = {
      '4-3-3': {
        forwards: ['LW', 'ST', 'RW'],
        midfielders: ['LCM', 'CM', 'RCM'],
        defenders: ['LB', 'LCB', 'RCB', 'RB']
      },
      '4-4-2': {
        forwards: ['LST', 'RST'],
        midfielders: ['LM', 'LCM', 'RCM', 'RM'],
        defenders: ['LB', 'LCB', 'RCB', 'RB']
      },
      '4-5-1': {
        forwards: ['ST'],
        midfielders: ['LM', 'LCM', 'CM', 'RCM', 'RM'],
        defenders: ['LB', 'LCB', 'RCB', 'RB']
      },
      '3-5-2': {
        forwards: ['LST', 'RST'],
        midfielders: ['LM', 'LCM', 'CM', 'RCM', 'RM'],
        defenders: ['LCB', 'CB', 'RCB']
      },
      '3-4-3': {
        forwards: ['LW', 'ST', 'RW'],
        midfielders: ['LM', 'LCM', 'RCM', 'RM'],
        defenders: ['LCB', 'CB', 'RCB']
      }
    }
    return formations[selectedFormation] || formations['4-3-3']
  }

  const formationStructure = getFormationStructure()
  const assignedPlayerIds = new Set(Array.from(assignedPlayers.values()).map(p => p.id))

  // Get unique team names from players for fixtures
  const playerTeamNames = Array.from(new Set(players.map(p => p.team).filter(Boolean))) as string[]

  /**
   * Get position type from position ID for validation
   */
  const getPositionType = (posId: string): 'FWD' | 'MID' | 'DEF' | 'GK' => {
    if (posId === 'GK') return 'GK'
    if (['LW', 'RW', 'ST', 'LST', 'RST', 'CF'].includes(posId)) return 'FWD'
    if (['LM', 'RM', 'CM', 'LCM', 'RCM', 'CAM', 'CDM'].includes(posId)) return 'MID'
    return 'DEF'
  }

  // ==============================================================================
  // RENDER
  // ==============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-4">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <header className="text-center mb-8 pt-6">
          <h1 className="text-4xl font-bold text-white mb-2">
            ⚽ TopStrike Squad Viewer
          </h1>
          <p className="text-gray-400 mb-3">View your player shares portfolio on MegaETH Mainnet</p>

          {/* Twitter Auth Status */}
          <div className="flex justify-center items-center gap-3 mb-3">
            {/* Blockchain Info Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-lg">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-xs text-green-400 font-mono">
                Connected to TopStrike Contract
              </span>
              <a
                href="https://megaeth.blockscout.com/address/0xf3393dC9E747225FcA0d61BfE588ba2838AFb077"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 underline"
              >
                View Contract
              </a>
            </div>

            {/* Twitter Auth Badge */}
            {session ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <span className="text-xs text-blue-400 font-semibold">
                  🐦 @{session.user?.name}
                </span>
                <button
                  onClick={() => signOut()}
                  className="text-xs text-red-400 hover:text-red-300 underline"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn('twitter')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Sign in with Twitter
              </button>
            )}
          </div>
        </header>

        {/* WALLET LINKING MODAL */}
        {showLinkWallet && session && (
          <div className="max-w-2xl mx-auto mb-8 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-2 border-blue-500/50 rounded-xl p-6 animate-fade-in">
            <div className="text-center mb-4">
              <Link className="w-12 h-12 mx-auto mb-3 text-blue-400" />
              <h2 className="text-2xl font-bold text-white mb-2">Link Your TopStrike Wallet</h2>
              <p className="text-gray-300 text-sm">
                Welcome, <span className="text-blue-400 font-semibold">@{session.user?.name}</span>!
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Enter your TopStrike wallet address to view your portfolio.
                You'll only need to do this once!
              </p>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="0x..."
                value={tempWallet}
                onChange={(e) => setTempWallet(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLinkWallet()}
                className="flex-1 px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500 font-mono text-sm"
              />
              <button
                onClick={handleLinkWallet}
                disabled={linkingWallet || !tempWallet.trim()}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-50 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors"
              >
                {linkingWallet ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Linking...
                  </>
                ) : (
                  <>
                    <Link className="w-5 h-5" />
                    Link Wallet
                  </>
                )}
              </button>
            </div>

            <div className="mt-4 text-xs text-gray-400 bg-gray-800/50 rounded-lg p-3">
              <p className="mb-1">💡 <strong>Where to find your wallet address:</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Open TopStrike app</li>
                <li>Click your profile/wallet icon</li>
                <li>Copy your wallet address (starts with 0x)</li>
              </ol>
            </div>
          </div>
        )}

        {/* SEARCH BAR - Only show if not using Twitter login or wallet is linked */}
        {(!session || (session && linkedWallet)) && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter wallet address (0x...)"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500"
                disabled={session && linkedWallet ? true : false}
              />
              <button
                onClick={handleSearch}
                disabled={loading || (session && linkedWallet ? true : false)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Loading...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Search
                  </>
                )}
              </button>
            </div>

            {session && linkedWallet && (
              <div className="mt-3 text-center text-sm text-gray-400">
                Using linked wallet: <span className="text-blue-400 font-mono">{linkedWallet.slice(0, 6)}...{linkedWallet.slice(-4)}</span>
              </div>
            )}
          </div>
        )}

        {/* FORMATION SELECTOR & SQUAD CONTROLS */}
        {searched && players.length > 0 && (
          <div className="mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <FormationSelector
                currentFormation={selectedFormation}
                onFormationChange={handleFormationChange}
              />

              {/* Squad Controls */}
              <div className="flex gap-2">
                <button
                  onClick={handleClearSquad}
                  disabled={assignedPlayers.size === 0}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:opacity-50 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors text-sm"
                  title="Clear all players from pitch"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Squad
                </button>

                {/* Auto-save indicator */}
                <div className="px-4 py-2 bg-green-600/10 border border-green-600/30 text-green-400 rounded-lg flex items-center gap-2 text-sm">
                  <Save className="w-4 h-4" />
                  Auto-saved
                </div>
              </div>
            </div>

            {/* Saved Squad Notification */}
            {showSaveNotification && (
              <div className="mt-4 bg-blue-600/20 border border-blue-500/50 text-blue-300 px-4 py-3 rounded-lg flex items-center gap-2 animate-fade-in">
                <Save className="w-5 h-5" />
                <span>Loaded your saved squad!</span>
              </div>
            )}
          </div>
        )}

        {/* PORTFOLIO SUMMARY */}
        {searched && players.length > 0 && (
          <div className="mb-6">
            <PortfolioSummary players={players} />
          </div>
        )}

        {/* SQUAD BUILDER - Three Column Layout */}
        {searched && players.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* LEFT COLUMN: Player Pool */}
            <div className="lg:col-span-1">
              <PlayerPool
                players={players}
                assignedPlayerIds={assignedPlayerIds}
                onPlayerSelect={(player) => {
                  if (selectedPosition) {
                    handlePlayerSelect(player, getPositionType(selectedPosition))
                  }
                }}
                selectedPosition={selectedPosition}
              />
            </div>

            {/* CENTER COLUMN: Football Pitch */}
            <div className="lg:col-span-2">
              <div className="relative bg-gradient-to-b from-green-600 to-green-700 rounded-2xl shadow-2xl overflow-hidden"
                   style={{ minHeight: '700px' }}>

          {/* Field Lines */}
          <div className="absolute inset-0">
            {/* Center Circle */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-4 border-white/40 rounded-full"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white/40 rounded-full"></div>

            {/* Center Line */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-white/40 transform -translate-y-1/2"></div>

            {/* Penalty Areas */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-64 h-24 border-4 border-white/40 border-t-0"></div>
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-64 h-24 border-4 border-white/40 border-b-0"></div>

            {/* Goal Areas */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-32 h-12 border-4 border-white/40 border-t-0"></div>
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-32 h-12 border-4 border-white/40 border-b-0"></div>

            {/* Corner Arcs */}
            <div className="absolute top-0 left-0 w-8 h-8 border-4 border-white/40 border-t-0 border-l-0 rounded-br-full"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-4 border-white/40 border-t-0 border-r-0 rounded-bl-full"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-4 border-white/40 border-b-0 border-l-0 rounded-tr-full"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-4 border-white/40 border-b-0 border-r-0 rounded-tl-full"></div>
          </div>

          {/* PLAYER POSITIONS - Dynamic Formation */}
          <div className="relative z-10 h-full p-12">

            {/* FORWARDS */}
            <div className={`flex ${formationStructure.forwards.length === 1 ? 'justify-center' : formationStructure.forwards.length === 2 ? 'justify-around px-32' : 'justify-around'} mb-16`}>
              {formationStructure.forwards.map((posId) => (
                <InteractivePlayerCard
                  key={posId}
                  player={assignedPlayers.get(posId) || null}
                  positionId={posId}
                  positionLabel={posId}
                  positionType="FWD"
                  isSelected={selectedPosition === posId}
                  onClick={() => handlePositionClick(posId)}
                  onRemove={() => handleRemovePlayer(posId)}
                />
              ))}
            </div>

            {/* MIDFIELDERS */}
            <div className={`flex ${formationStructure.midfielders.length <= 3 ? 'justify-around px-12' : 'justify-around'} mb-16`}>
              {formationStructure.midfielders.map((posId) => (
                <InteractivePlayerCard
                  key={posId}
                  player={assignedPlayers.get(posId) || null}
                  positionId={posId}
                  positionLabel={posId}
                  positionType="MID"
                  isSelected={selectedPosition === posId}
                  onClick={() => handlePositionClick(posId)}
                  onRemove={() => handleRemovePlayer(posId)}
                />
              ))}
            </div>

            {/* DEFENDERS */}
            <div className={`flex ${formationStructure.defenders.length === 3 ? 'justify-around px-20' : 'justify-around'} mb-16`}>
              {formationStructure.defenders.map((posId) => (
                <InteractivePlayerCard
                  key={posId}
                  player={assignedPlayers.get(posId) || null}
                  positionId={posId}
                  positionLabel={posId}
                  positionType="DEF"
                  isSelected={selectedPosition === posId}
                  onClick={() => handlePositionClick(posId)}
                  onRemove={() => handleRemovePlayer(posId)}
                />
              ))}
            </div>

            {/* GOALKEEPER */}
            <div className="flex justify-center">
              <InteractivePlayerCard
                player={assignedPlayers.get('GK') || null}
                positionId="GK"
                positionLabel="GK"
                positionType="GK"
                isSelected={selectedPosition === 'GK'}
                onClick={() => handlePositionClick('GK')}
                onRemove={() => handleRemovePlayer('GK')}
              />
            </div>
          </div>
            </div>
          </div>

            {/* RIGHT COLUMN: Fixtures */}
            <div className="lg:col-span-1">
              <FixturesNew playerTeams={playerTeamNames} />
            </div>
          </div>
        ) : (
          /* EMPTY STATE */
          <div className="relative bg-gradient-to-b from-green-600 to-green-700 rounded-2xl shadow-2xl overflow-hidden" style={{ minHeight: '700px' }}>
            {/* Field Lines */}
            <div className="absolute inset-0">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-4 border-white/40 rounded-full"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white/40 rounded-full"></div>
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-white/40 transform -translate-y-1/2"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="text-center text-white p-8">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h2 className="text-2xl font-bold mb-2">No Squad Loaded</h2>
                <p className="text-gray-300">Enter a wallet address to view their TopStrike squad</p>
              </div>
            </div>
          </div>
        )}

        {/* STATS SUMMARY */}
        {searched && players.length > 0 && (
          <div className="mt-8 bg-gray-800 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Portfolio Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="text-gray-400 text-sm">Total Players</div>
                <div className="text-2xl font-bold text-white">{players.length}</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="text-gray-400 text-sm">Total Cards</div>
                <div className="text-2xl font-bold text-green-400">
                  {players.reduce((sum, p) => sum + p.sharesOwnedInFullShares, 0)}
                </div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="text-gray-400 text-sm">Network</div>
                <div className="text-lg font-bold text-blue-400 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  MegaETH
                </div>
              </div>
            </div>

            {/* Player List */}
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-gray-400 mb-3">All Players</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className="bg-gray-700 rounded-lg p-3 flex items-center gap-3"
                  >
                    <img
                      src={player.imageUrl || getPlaceholderImage()}
                      alt={player.name}
                      className="w-10 h-10 rounded object-contain bg-white/10"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-white text-sm">{player.name}</div>
                      <div className="text-xs text-gray-400 flex items-center gap-2">
                        <span className="font-semibold text-blue-400">{player.position}</span>
                        {player.team && (
                          <>
                            <span>•</span>
                            <span className="truncate">{player.team}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-semibold text-green-400">
                        {player.sharesOwnedInFullShares}/{player.totalSupplyInFullShares}
                      </div>
                      <div className="text-[10px] text-gray-400">cards</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
