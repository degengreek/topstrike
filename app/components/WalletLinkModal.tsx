'use client'

import { useState } from 'react'
import { X, Wallet } from 'lucide-react'

interface WalletLinkModalProps {
  onLink: (walletAddress: string) => void
  onClose: () => void
}

export default function WalletLinkModal({ onLink, onClose }: WalletLinkModalProps) {
  const [walletInput, setWalletInput] = useState('')
  const [error, setError] = useState('')

  const handleLink = () => {
    if (!walletInput.trim()) {
      setError('Please enter a wallet address')
      return
    }

    // Basic validation - Ethereum addresses are 42 characters (0x + 40 hex chars)
    if (!walletInput.startsWith('0x') || walletInput.length !== 42) {
      setError('Invalid wallet address format')
      return
    }

    onLink(walletInput.trim())
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl border-2 border-green-500 shadow-2xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Wallet className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Link Your Wallet</h2>
              <p className="text-sm text-gray-400">Connect your TopStrike wallet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-gray-700 rounded-full text-white flex items-center justify-center hover:bg-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-300">
            This will be your permanent wallet linked to your Twitter account. You can change it later if needed.
          </p>
        </div>

        {/* Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Wallet Address
          </label>
          <input
            type="text"
            value={walletInput}
            onChange={(e) => {
              setWalletInput(e.target.value)
              setError('')
            }}
            placeholder="0x..."
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {error && (
            <p className="text-red-400 text-sm mt-2">{error}</p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleLink}
            className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors font-medium"
          >
            Link Wallet
          </button>
        </div>
      </div>
    </div>
  )
}
