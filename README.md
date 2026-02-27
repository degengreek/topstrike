# ⚽ TopStrike Squad Viewer

A React/Next.js application for viewing TopStrike player portfolios and building custom squads on the MegaETH network.

![TopStrike Demo](https://via.placeholder.com/800x400/10b981/ffffff?text=TopStrike+Squad+Viewer)

## 📚 Documentation

- **[PROJECT_STATUS.md](./PROJECT_STATUS.md)** - Complete project overview, features, and architecture
- **[IMPROVEMENTS.md](./IMPROVEMENTS.md)** - Latest improvements and new features
- **[BEGINNER_GUIDE.md](./BEGINNER_GUIDE.md)** - For developers new to the project

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Twitter Developer account (for Twitter login feature)

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Set up Twitter OAuth (Optional but recommended):**
   - Follow **[TWITTER_AUTH_SETUP.md](./TWITTER_AUTH_SETUP.md)** for detailed instructions
   - Get Twitter API credentials from https://developer.twitter.com
   - Add to `.env.local`

3. **Run the development server:**
```bash
npm run dev
```

4. **Open your browser:**
Navigate to [http://localhost:3001](http://localhost:3001)

## 📁 Project Structure

```
soccer/
├── app/
│   ├── components/
│   │   └── Dashboard.tsx    # Main component with all logic
│   ├── globals.css          # Tailwind CSS styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
├── package.json
├── tailwind.config.js
└── next.config.js
```

## 🎯 Features

### Core Features ✅
- ✅ **Real Blockchain Integration** - Connected to TopStrike on MegaETH mainnet
- ✅ **5 Formation Options** - 4-3-3, 4-4-2, 4-5-1, 3-5-2, 3-4-3
- ✅ **Interactive Squad Builder** - Click-to-assign players to positions
- ✅ **Real Player Images** - From TheSportsDB API
- ✅ **Player Database Cache** - 148+ players with instant lookup
- ✅ **Position Validation** - Smart position compatibility checking
- ✅ **Portfolio Summary** - Card counts, pricing, team breakdown
- ✅ **Upcoming Fixtures** - Live match data

### New Features 🆕
- ✅ **Twitter Authentication** - Sign in with Twitter OAuth
- ✅ **Wallet Linking** - Link your TopStrike wallet once, use forever
- ✅ **Auto-Load Portfolio** - Portfolio loads automatically after Twitter sign-in
- ✅ **Auto-Save Squads** - Squads persist between sessions using localStorage
- ✅ **Auto-Load Squads** - Saved squads restore automatically
- ✅ **Clear Squad Button** - One-click to reset formation
- ✅ **Visual Indicators** - Auto-save badge, load notifications

## 🔌 Integrating Real MegaETH Data

### Step 1: Install Web3 Library

```bash
npm install ethers
# or
npm install viem
```

### Step 2: Set Up MegaETH Connection

Create a new file `lib/megaeth.ts`:

```typescript
import { ethers } from 'ethers'

// MegaETH RPC endpoint
const MEGAETH_RPC_URL = "YOUR_MEGAETH_RPC_URL_HERE"

// Your TopStrike contract address
const CONTRACT_ADDRESS = "YOUR_CONTRACT_ADDRESS_HERE"

// Your contract ABI (Application Binary Interface)
const CONTRACT_ABI = [
  // Add your contract ABI here
  // Example:
  // "function getPlayersByOwner(address owner) view returns (uint256[])",
  // "function getPlayer(uint256 tokenId) view returns (string name, uint256 attack, uint256 defense)"
]

export const getProvider = () => {
  return new ethers.JsonRpcProvider(MEGAETH_RPC_URL)
}

export const getContract = () => {
  const provider = getProvider()
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)
}
```

### Step 3: Update the Dashboard Component

In `app/components/Dashboard.tsx`, replace the `fetchMockPlayers` function:

```typescript
// Replace the mock function with this real implementation
const fetchRealPlayers = async (walletAddress: string): Promise<Player[]> => {
  try {
    // Get contract instance
    const contract = getContract()

    // Fetch player token IDs owned by the wallet
    const tokenIds = await contract.getPlayersByOwner(walletAddress)

    // Fetch details for each player
    const players = await Promise.all(
      tokenIds.map(async (tokenId, index) => {
        const playerData = await contract.getPlayer(tokenId)
        return {
          id: index + 1,
          name: playerData.name,
          attack: Number(playerData.attack),
          defense: Number(playerData.defense),
          position: determinePosition(index) // Helper to assign positions
        }
      })
    )

    return players
  } catch (error) {
    console.error('Error fetching players from MegaETH:', error)
    throw error
  }
}

// Helper function to assign positions based on order
const determinePosition = (index: number): string => {
  const positions = ['ST', 'LW', 'RW', 'CM', 'CM', 'CM', 'LB', 'CB', 'CB', 'RB', 'GK']
  return positions[index] || 'SUB'
}
```

### Step 4: Add Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_MEGAETH_RPC_URL=https://your-megaeth-rpc-url
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourContractAddress
```

### Step 5: Update the Search Handler

In the `handleSearch` function, change:

```typescript
// Change this line:
const fetchedPlayers = await fetchMockPlayers(walletAddress)

// To this:
const fetchedPlayers = await fetchRealPlayers(walletAddress)
```

## 🎨 Customizing Player Sprites

### Option 1: Use PNG Images

1. Add your 32x32 PNG sprites to `public/sprites/`
2. Update the `PlayerSprite` component:

```tsx
const PlayerSprite = ({ player }: { player: Player | null }) => {
  if (!player) {
    return <div className="w-8 h-8 border-2 border-dashed border-white/30 rounded-full" />
  }

  return (
    <img
      src={`/sprites/player-${player.id}.png`}
      alt={player.name}
      className="w-8 h-8"
    />
  )
}
```

### Option 2: Generate Dynamic Sprites

Use player traits to generate unique sprites on-the-fly based on NFT metadata.

## 🔐 Adding X (Twitter) Authentication

To implement "Connect with X" functionality:

1. **Set up X OAuth** in your Twitter Developer Portal
2. **Install NextAuth.js:**
```bash
npm install next-auth
```

3. **Create an auth API route** at `app/api/auth/[...nextauth]/route.ts`
4. **Link wallet addresses** to X accounts in your database
5. **Update the** `handleConnectX` **function** to use the OAuth flow

## 📚 Code Explanation for Beginners

### Key Concepts

1. **React State (`useState`)**:
   - Stores data that can change (wallet address, players, loading status)
   - When state changes, the component re-renders automatically

2. **Async/Await**:
   - Used for blockchain calls that take time
   - `async` marks a function that does asynchronous work
   - `await` pauses execution until the blockchain responds

3. **Components**:
   - Reusable pieces of UI (like PlayerCard, PlayerSprite)
   - Accept `props` (properties) as inputs
   - Return JSX (HTML-like syntax for React)

4. **Tailwind CSS**:
   - Utility-first CSS framework
   - Classes like `bg-green-600`, `rounded-lg` style elements
   - Responsive with prefixes like `md:grid-cols-4`

### Component Breakdown

```
Dashboard
├── Search Bar (input + button)
├── Football Pitch
│   ├── Field Lines (decorative)
│   └── Player Positions
│       └── PlayerCard (repeated 11 times)
│           ├── PlayerSprite (32x32 image)
│           └── Player Info (name, stats)
└── Squad Stats (summary)
```

## 🛠️ Development Tips

### Testing with Mock Data

The app includes mock data by default. Test your UI before connecting to the blockchain:

```typescript
// Use test wallet addresses like:
setWalletAddress('0x742d35Cc6634C0532925a3b844Bc454e4438f44e')
```

### Debugging

Add console logs to track data flow:

```typescript
console.log('Fetched players:', fetchedPlayers)
console.log('Formation:', formation)
```

### Common Issues

1. **"Module not found"**: Run `npm install`
2. **Port 3000 in use**: Use `npm run dev -- -p 3001`
3. **Tailwind styles not working**: Restart the dev server

## 🚢 Deployment

### Deploy to Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

### Environment Variables

Remember to add these in your hosting platform:
- `NEXT_PUBLIC_MEGAETH_RPC_URL`
- `NEXT_PUBLIC_CONTRACT_ADDRESS`

## 📖 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [ethers.js Documentation](https://docs.ethers.org/)
- [MegaETH Documentation](https://docs.megaeth.com) *(replace with actual docs)*

## 🤝 Contributing

This is your project! Feel free to:
- Add more formations (4-4-2, 3-5-2, etc.)
- Implement player trading
- Add animations and transitions
- Create a player marketplace

## 📝 License

MIT License - feel free to use this for your TopStrike project!

---

**Built with ❤️ for the MegaETH ecosystem**
