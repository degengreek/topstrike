# 🔌 Blockchain Integration Guide

This guide shows you **exactly where** to plug in real MegaETH blockchain data.

## 📍 Key Integration Points

### 1. Fetching Players (Lines 32-66 in Dashboard.tsx)

**Current Code (Mock):**
```typescript
const fetchMockPlayers = async (walletAddress: string): Promise<Player[]> => {
  await new Promise(resolve => setTimeout(resolve, 1000))

  const mockPlayers: Player[] = [
    { id: 1, name: 'Striker Alpha', attack: 85, defense: 40, position: 'ST' },
    // ... more mock players
  ]

  return mockPlayers
}
```

**Replace With Real Blockchain Call:**
```typescript
import { ethers } from 'ethers'

// MegaETH Configuration
const MEGAETH_RPC = "https://rpc.megaeth.com" // Your actual RPC URL
const CONTRACT_ADDRESS = "0x..." // Your TopStrike contract address

const CONTRACT_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  // Add your contract's functions here
]

const fetchPlayersFromBlockchain = async (walletAddress: string): Promise<Player[]> => {
  // Step 1: Connect to MegaETH network
  const provider = new ethers.JsonRpcProvider(MEGAETH_RPC)
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)

  // Step 2: Get number of NFTs owned by wallet
  const balance = await contract.balanceOf(walletAddress)

  // Step 3: Fetch each player NFT
  const players: Player[] = []

  for (let i = 0; i < balance; i++) {
    // Get token ID
    const tokenId = await contract.tokenOfOwnerByIndex(walletAddress, i)

    // Get token metadata (could be on-chain or IPFS)
    const tokenURI = await contract.tokenURI(tokenId)
    const metadata = await fetch(tokenURI).then(res => res.json())

    // Parse player data from metadata
    players.push({
      id: Number(tokenId),
      name: metadata.name,
      attack: metadata.attributes.find(a => a.trait_type === 'attack')?.value || 50,
      defense: metadata.attributes.find(a => a.trait_type === 'defense')?.value || 50,
      position: determinePosition(i)
    })
  }

  return players
}
```

### 2. Search Handler (Line 167 in Dashboard.tsx)

**Find this line:**
```typescript
const fetchedPlayers = await fetchMockPlayers(walletAddress)
```

**Change to:**
```typescript
const fetchedPlayers = await fetchPlayersFromBlockchain(walletAddress)
```

### 3. Wallet Validation (Line 159 in Dashboard.tsx)

**Add validation before fetching:**
```typescript
const handleSearch = async () => {
  // Validate wallet address format
  if (!walletAddress.trim()) {
    alert('Please enter a wallet address')
    return
  }

  // Check if it's a valid Ethereum address
  if (!ethers.isAddress(walletAddress)) {
    alert('Invalid wallet address format')
    return
  }

  setLoading(true)
  try {
    const fetchedPlayers = await fetchPlayersFromBlockchain(walletAddress)
    setPlayers(fetchedPlayers)
    setSearched(true)
  } catch (error) {
    console.error('Error:', error)
    alert(`Failed to fetch players: ${error.message}`)
  } finally {
    setLoading(false)
  }
}
```

## 🎯 Smart Contract Structure

Your TopStrike smart contract should implement these functions:

```solidity
// Example TopStrike Contract Interface
contract TopStrike {
    // Standard ERC-721 functions
    function balanceOf(address owner) public view returns (uint256);
    function tokenOfOwnerByIndex(address owner, uint256 index) public view returns (uint256);

    // TopStrike-specific functions
    struct Player {
        string name;
        uint256 attack;
        uint256 defense;
        string position;
        uint256 rarity;
    }

    mapping(uint256 => Player) public players;

    function getPlayer(uint256 tokenId) public view returns (Player memory);
    function getPlayersByOwner(address owner) public view returns (Player[] memory);
}
```

## 📦 Install Required Packages

```bash
npm install ethers
```

## 🔐 Environment Variables

Create `.env.local`:

```env
# MegaETH Network
NEXT_PUBLIC_MEGAETH_RPC_URL=https://rpc.megaeth.com
NEXT_PUBLIC_CHAIN_ID=1234

# TopStrike Contract
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourContractAddressHere

# Optional: For X Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
TWITTER_CLIENT_ID=your-client-id
TWITTER_CLIENT_SECRET=your-client-secret
```

Access in code:
```typescript
const RPC_URL = process.env.NEXT_PUBLIC_MEGAETH_RPC_URL
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
```

## 🖼️ Player Sprites Integration

### Option 1: On-Chain SVG

If your NFTs store SVG data on-chain:

```typescript
const PlayerSprite = ({ player }: { player: Player | null }) => {
  if (!player?.imageURI) return <DefaultSprite />

  return (
    <div dangerouslySetInnerHTML={{ __html: player.imageURI }} />
  )
}
```

### Option 2: IPFS Images

If sprites are stored on IPFS:

```typescript
const PlayerSprite = ({ player }: { player: Player | null }) => {
  if (!player?.imageHash) return <DefaultSprite />

  return (
    <img
      src={`https://ipfs.io/ipfs/${player.imageHash}`}
      alt={player.name}
      className="w-8 h-8"
    />
  )
}
```

### Option 3: Centralized CDN

If you host sprites on your server:

```typescript
const PlayerSprite = ({ player }: { player: Player | null }) => {
  if (!player) return <DefaultSprite />

  return (
    <img
      src={`/api/sprites/${player.id}`}
      alt={player.name}
      className="w-8 h-8"
    />
  )
}
```

## 🔄 Real-Time Updates with Wallet Connection

### Add Wallet Connection (MetaMask, WalletConnect, etc.)

```bash
npm install wagmi viem @tanstack/react-query
```

Update Dashboard to use connected wallet:

```typescript
'use client'
import { useAccount } from 'wagmi'

export default function Dashboard() {
  const { address, isConnected } = useAccount()

  useEffect(() => {
    if (isConnected && address) {
      // Automatically load user's squad
      setWalletAddress(address)
      handleSearch()
    }
  }, [isConnected, address])

  // ... rest of component
}
```

## 🧪 Testing

### Test with Hardhat Local Network

```javascript
// hardhat.config.js
module.exports = {
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545"
    }
  }
}
```

Update RPC URL to `http://127.0.0.1:8545` for local testing.

### Test Data

```typescript
// Test wallet addresses
const TEST_WALLETS = {
  withPlayers: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
  empty: '0x0000000000000000000000000000000000000000',
}
```

## 🚨 Error Handling

Add comprehensive error handling:

```typescript
const fetchPlayersFromBlockchain = async (walletAddress: string): Promise<Player[]> => {
  try {
    const provider = new ethers.JsonRpcProvider(MEGAETH_RPC)
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)

    const balance = await contract.balanceOf(walletAddress)

    if (balance === 0n) {
      throw new Error('No players found for this wallet')
    }

    // ... fetch players

  } catch (error) {
    // Handle specific errors
    if (error.code === 'NETWORK_ERROR') {
      throw new Error('Unable to connect to MegaETH network')
    }
    if (error.code === 'CALL_EXCEPTION') {
      throw new Error('Invalid contract address or ABI')
    }
    throw error
  }
}
```

## 📊 Caching Strategy

Implement caching to reduce RPC calls:

```typescript
// Simple in-memory cache
const playerCache = new Map<string, { players: Player[], timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

const fetchPlayersWithCache = async (walletAddress: string): Promise<Player[]> => {
  const cached = playerCache.get(walletAddress)

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.players
  }

  const players = await fetchPlayersFromBlockchain(walletAddress)
  playerCache.set(walletAddress, { players, timestamp: Date.now() })

  return players
}
```

## ✅ Integration Checklist

- [ ] Install ethers.js: `npm install ethers`
- [ ] Create `.env.local` with RPC URL and contract address
- [ ] Add your contract ABI
- [ ] Replace `fetchMockPlayers` with `fetchPlayersFromBlockchain`
- [ ] Update the search handler to use the real function
- [ ] Add wallet address validation
- [ ] Test with a known wallet address
- [ ] Implement error handling
- [ ] Add loading states
- [ ] Test with empty wallet (no NFTs)
- [ ] Optimize with caching

## 🎓 Next Steps

1. **Start with testnet**: Test on MegaETH testnet first
2. **Add wallet connection**: Integrate MetaMask or WalletConnect
3. **Implement metadata**: Parse player attributes from NFT metadata
4. **Add player details**: Show rarity, special abilities, etc.
5. **Enable trading**: Let users buy/sell players
6. **Add animations**: Animate player movements

---

**Need help?** Check the main README or create an issue!
