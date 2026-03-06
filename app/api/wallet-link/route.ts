/**
 * Wallet Link API
 * Links Twitter users to their wallet addresses in Supabase
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { NextAuthOptions } from 'next-auth'
import TwitterProvider from 'next-auth/providers/twitter'

// Auth options for session validation
const authOptions: NextAuthOptions = {
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: "2.0",
      authorization: {
        url: "https://twitter.com/i/oauth2/authorize",
        params: {
          scope: "users.read tweet.read offline.access",
        },
      },
    })
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string
        session.user.name = token.name as string
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}

/**
 * GET /api/wallet-link
 * Get linked wallet for current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's wallet from Supabase
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('wallet_address')
      .eq('twitter_id', session.user.id)
      .single()

    if (error) {
      console.error('Error fetching wallet:', error)
      return NextResponse.json(
        { walletAddress: null, isLinked: false }
      )
    }

    return NextResponse.json({
      walletAddress: user?.wallet_address || null,
      isLinked: !!user?.wallet_address
    })

  } catch (error) {
    console.error('Error in wallet-link GET:', error)
    return NextResponse.json(
      { error: 'Failed to fetch wallet' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/wallet-link
 * Link wallet address to current user
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { walletAddress } = body

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 400 }
      )
    }

    // Basic wallet address validation (Ethereum format)
    if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      )
    }

    // Update user's wallet address in Supabase
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ wallet_address: walletAddress.toLowerCase() })
      .eq('twitter_id', session.user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating wallet:', error)
      return NextResponse.json(
        { error: 'Failed to link wallet' },
        { status: 500 }
      )
    }

    console.log(`✅ Linked ${session.user.name} → Wallet ${walletAddress}`)

    return NextResponse.json({
      success: true,
      walletAddress: data.wallet_address
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
 * DELETE /api/wallet-link
 * Unlink wallet from current user
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Remove wallet address from user
    const { error } = await supabaseAdmin
      .from('users')
      .update({ wallet_address: null })
      .eq('twitter_id', session.user.id)

    if (error) {
      console.error('Error unlinking wallet:', error)
      return NextResponse.json(
        { error: 'Failed to unlink wallet' },
        { status: 500 }
      )
    }

    console.log(`✅ Unlinked wallet for ${session.user.name}`)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error unlinking wallet:', error)
    return NextResponse.json(
      { error: 'Failed to unlink wallet' },
      { status: 500 }
    )
  }
}
