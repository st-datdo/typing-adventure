import type { Metadata } from 'next'
import { Baloo_2 } from 'next/font/google'
import '@/styles/globals.css'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const kidFont = Baloo_2({
  subsets: ['latin', 'vietnamese'],
  weight: ['500', '700', '800'],
  variable: '--font-kid',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Typing Adventure - Luyện Gõ Phím',
  description: 'Website luyện gõ phím dành cho trẻ em',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" className={kidFont.variable} suppressHydrationWarning>
      <body>
        <ErrorBoundary>
          <SessionProvider>{children}</SessionProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
