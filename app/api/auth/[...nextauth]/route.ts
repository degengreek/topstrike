import NextAuth, { NextAuthOptions } from "next-auth"
import TwitterProvider from "next-auth/providers/twitter"

const authOptions: NextAuthOptions = {
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
    async session({ session, token }) {
      // Add Twitter ID to session for wallet linking
      if (session.user) {
        session.user.id = token.sub as string
        session.user.name = token.name as string
      }
      return session
    },
    async jwt({ token, account, profile }) {
      // Store Twitter username in token
      if (account && profile) {
        token.username = (profile as any).data?.username || profile.name
      }
      return token
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
