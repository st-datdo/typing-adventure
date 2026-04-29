import type { Metadata } from 'next'
import '@/styles/globals.css'
import { SessionProvider } from '@/components/providers/SessionProvider'

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
    <html lang="vi" suppressHydrationWarning>
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}
