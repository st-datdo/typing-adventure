'use client'

import dynamic from 'next/dynamic'
import { LoadingScreen } from '@/components/ui/LoadingScreen'

const MultiplayerProvider = dynamic(
  () => import('@/components/multiplayer/MultiplayerProvider').then((m) => m.MultiplayerProvider),
  { ssr: false, loading: () => <LoadingScreen icon="🏁" /> },
)

export default function MultiplayerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <MultiplayerProvider>{children}</MultiplayerProvider>
}
