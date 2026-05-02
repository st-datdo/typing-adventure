'use client'

// Re-export from the context provider.
// Socket lifecycle is now managed by MultiplayerProvider in the (multiplayer) layout,
// so it persists across /lobby ↔ /race route transitions.
export { useMultiplayerContext as useMultiplayer } from '@/components/multiplayer/MultiplayerProvider'
export type { MultiplayerState } from '@/components/multiplayer/MultiplayerProvider'
