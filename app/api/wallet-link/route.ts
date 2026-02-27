import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory storage for development
// In production, use Vercel KV, database, or localStorage
const walletLinks = new Map<string, string>()

/**
 * GET /api/wallet-link?twitterId={id}
 * Get linked wallet for a Twitter user
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const twitterId = searchParams.get('twitterId')

  if (!twitterId) {
    return NextResponse.json(
      { error: 'Twitter ID required' },
      { status: 400 }
    )
  }

  const walletAddress = walletLinks.get(twitterId) || null

  return NextResponse.json({
    walletAddress,
    isLinked: !!walletAddress
  })
}

/**
 * POST /api/wallet-link
 * Link wallet address to Twitter user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { twitterId, walletAddress } = body

    if (!twitterId || !walletAddress) {
      return NextResponse.json(
        { error: 'Twitter ID and wallet address required' },
        { status: 400 }
      )
    }

    // Basic wallet address validation
    if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      )
    }

    // Save the link
    walletLinks.set(twitterId, walletAddress)

    console.log(`✅ Linked Twitter ${twitterId} → Wallet ${walletAddress}`)

    return NextResponse.json({
      success: true,
      walletAddress
    })
  } catch (error) {
    console.error('Error linking wallet:', error)
    return NextResponse.json(
      { error: 'Failed to link wallet' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/wallet-link?twitterId={id}
 * Unlink wallet from Twitter user
 */
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const twitterId = searchParams.get('twitterId')

  if (!twitterId) {
    return NextResponse.json(
      { error: 'Twitter ID required' },
      { status: 400 }
    )
  }

  walletLinks.delete(twitterId)

  return NextResponse.json({ success: true })
}
