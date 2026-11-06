export type FxOwlMood = 'idle' | 'wave' | 'sleep' | 'happy' | 'thinking' | 'cheer' | 'encourage'

export const OWL_PRIORITY: Record<FxOwlMood, number> = {
  idle: 0,
  wave: 1,
  sleep: 1,
  happy: 2,
  thinking: 3,
  cheer: 4,
  encourage: 5,
}

export const OWL_WAVE_MS = 5000
export const OWL_SLEEP_MS = 15000

export function mergeOwlMood(cur: FxOwlMood, next: FxOwlMood): FxOwlMood {
  return OWL_PRIORITY[next] >= OWL_PRIORITY[cur] ? next : cur
}

export function idleMood(msSinceKey: number): 'wave' | 'sleep' | null {
  if (msSinceKey >= OWL_SLEEP_MS) return 'sleep'
  if (msSinceKey >= OWL_WAVE_MS) return 'wave'
  return null
}
