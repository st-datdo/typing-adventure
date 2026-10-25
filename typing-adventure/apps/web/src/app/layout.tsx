import type { Metadata } from 'next'
import { Baloo_2 } from 'next/font/google'
import '@/styles/globals.css'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ThemeApplier } from '@/components/ui/ThemeApplier'

const kidFont = Baloo_2({
  subsets: ['latin', 'vietnamese'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-kid',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Typing Adventure - Luyện Gõ Phím',
  description: 'Website luyện gõ phím dành cho trẻ em',
}

const THEME_BOOT = `try{var j=JSON.parse(localStorage.getItem('typingAdventure_settings')||'{}')||{};var t=(j.state||{}).theme;if((j.version||0)<1||(t!=='dark'&&t!=='colorful'))t='light';document.documentElement.setAttribute('data-theme',t)}catch(e){}`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" data-theme="light" className={kidFont.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      </head>
      <body>
        <ErrorBoundary>
          <SessionProvider>
            <ThemeApplier />
            {children}
          </SessionProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
