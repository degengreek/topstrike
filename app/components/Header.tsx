'use client'

import { useState } from 'react'
import { Search, LogOut, Wallet, Eye, EyeOff, Copy, Check } from 'lucide-react'
import { signIn, signOut, useSession } from 'next-auth/react'

interface HeaderProps {
  activeTab: 'squad' | 'portfolio' | 'fixtures' | 'leaderboard'
  onTabChange: (tab: 'squad' | 'portfolio' | 'fixtures' | 'leaderboard') => void
  onSearch: (address: string) => void
  searchValue: string
  onSearchChange: (value: string) => void
  walletAddress?: string
  walletBalance?: string
}

export default function Header({
  activeTab,
  onTabChange,
  onSearch,
  searchValue,
  onSearchChange,
  walletAddress,
  walletBalance
}: HeaderProps) {
  const { data: session } = useSession()
  const [showWalletInfo, setShowWalletInfo] = useState(false)
  const [showBalance, setShowBalance] = useState(true)
  const [copied, setCopied] = useState(false)

  // Format balance for display
  const formatBalance = (balance?: string) => {
    if (!balance) return '0.00'
    const eth = parseFloat(balance)
    return eth.toFixed(4)
  }

  // Copy wallet address to clipboard
  const copyWalletAddress = async () => {
    if (walletAddress) {
      try {
        await navigator.clipboard.writeText(walletAddress)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Failed to copy:', err)
      }
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchValue.trim()) {
      onSearch(searchValue.trim())
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar */}
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-2xl">⚽</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">TopStrike Manager</h1>
              <p className="text-xs text-gray-400">Build Your Ultimate Squad</p>
            </div>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="View another wallet's portfolio..."
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </form>

          {/* User Profile */}
          <div className="flex items-center gap-3">
            {session?.user ? (
              <>
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{session.user.name}</p>
                  <p className="text-xs text-gray-400">@{session.user.name}</p>
                </div>

                {/* Wallet Info Icon with Click */}
                {walletAddress && (
                  <div className="relative">
                    <button
                      onClick={() => setShowWalletInfo(!showWalletInfo)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                      title="Wallet Info"
                    >
                      <Wallet className="w-5 h-5" />
                    </button>

                    {/* Wallet Info Popover */}
                    {showWalletInfo && (
                      <>
                        {/* Backdrop to close on outside click */}
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setShowWalletInfo(false)}
                        />

                        <div className="absolute right-0 top-full mt-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-4 z-50">
                          <div className="mb-3">
                            <p className="text-xs text-gray-400 mb-1">Wallet Address</p>
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-mono text-white break-all flex-1">{walletAddress}</p>
                              <button
                                onClick={copyWalletAddress}
                                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors flex-shrink-0"
                                title="Copy address"
                              >
                                {copied ? (
                                  <Check className="w-4 h-4 text-green-400" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                          <div className="pt-3 border-t border-gray-700">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-xs text-gray-400">Balance</p>
                              <button
                                onClick={() => setShowBalance(!showBalance)}
                                className="p-1 text-gray-400 hover:text-white transition-colors"
                                title={showBalance ? "Hide balance" : "Show balance"}
                              >
                                {showBalance ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                            <p className="text-lg font-bold text-green-400">
                              {showBalance ? `${formatBalance(walletBalance)} ETH` : '••••••'}
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                <button
                  onClick={() => signOut()}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <button
                onClick={() => signIn('twitter')}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
                Sign in with Twitter
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 -mb-px">
          <button
            onClick={() => onTabChange('squad')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'squad'
                ? 'text-white border-b-2 border-green-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Squad Builder
          </button>
          <button
            onClick={() => onTabChange('portfolio')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'portfolio'
                ? 'text-white border-b-2 border-green-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Portfolio Summary
          </button>
          <button
            onClick={() => onTabChange('fixtures')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'fixtures'
                ? 'text-white border-b-2 border-green-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Fixtures
          </button>
          <button
            onClick={() => onTabChange('leaderboard')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'leaderboard'
                ? 'text-white border-b-2 border-green-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🏆 Leaderboard
          </button>
        </div>
      </div>
    </header>
  )
}
