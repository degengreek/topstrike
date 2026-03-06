import NextAuth, { NextAuthOptions } from "next-auth"
import TwitterProvider from "next-auth/providers/twitter"
import { supabaseAdmin } from "@/lib/supabase"

export const authOptions: NextAuthOptions = {
  debug: true, // Enable debug mode to see detailed logs
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: "2.0", // Use Twitter API v2
      authorization: {
        url: "https://twitter.com/i/oauth2/authorize",
        params: {
          scope: "users.read tweet.read offline.access",
        },
      },
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Save/update user in Supabase on sign in
      if (account?.provider === 'twitter' && profile) {
        try {
          const twitterProfile = (profile as any).data

          const { error } = await supabaseAdmin
            .from('users')
            .upsert({
              twitter_id: account.providerAccountId,
              twitter_username: twitterProfile?.username || user.name || 'Unknown',
              twitter_handle: twitterProfile?.name || user.name,
              twitter_avatar_url: twitterProfile?.profile_image_url || user.image,
            }, {
              onConflict: 'twitter_id'
            })

          if (error) {
            console.error('Error saving user to Supabase:', error)
          } else {
            console.log('✅ User saved to Supabase:', twitterProfile?.username)
          }
        } catch (err) {
          console.error('Exception saving user:', err)
        }
      }
      return true
    },
    async jwt({ token, account, profile }) {
      // Store Twitter ID and username in token on first sign-in
      if (account && profile) {
        token.twitter_id = account.providerAccountId // Store the actual Twitter ID
        token.username = (profile as any).data?.username || profile.name
      }
      return token
    },
    async session({ session, token }) {
      // Add Twitter ID to session for wallet linking
      if (session.user) {
        session.user.id = (token.twitter_id as string) || (token.sub as string) // Use twitter_id if available
        session.user.name = token.name as string
      }
      return session
    }
  },
  pages: {
    signIn: '/', // Redirect to home page for sign in
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false // Set to false for local development
      }
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
