'use client'

import dynamic from 'next/dynamic'

const MultiplayerProvider = dynamic(
  () => import('@/components/multiplayer/MultiplayerProvider').then((m) => m.MultiplayerProvider),
  { ssr: false },
)

export default function MultiplayerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <MultiplayerProvider>{children}</MultiplayerProvider>
}
