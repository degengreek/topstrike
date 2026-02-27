import './globals.css'
import type { Metadata } from 'next'
import { AuthProvider } from './providers'

export const metadata: Metadata = {
  title: 'TopStrike Squad Viewer',
  description: 'View your TopStrike player lineup on MegaETH',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
