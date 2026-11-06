const QUERY = '(prefers-reduced-motion: reduce)'

export interface ReducedMotionSource {
  subscribe: (onChange: () => void) => () => void
  getSnapshot: () => boolean
  getServerSnapshot: () => boolean
}

export function createReducedMotionSource(
  matchMedia: ((query: string) => MediaQueryList) | undefined,
): ReducedMotionSource {
  const mql = matchMedia ? matchMedia(QUERY) : null
  return {
    subscribe(onChange) {
      if (!mql) return () => {}
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    getSnapshot: () => (mql ? mql.matches : false),
    getServerSnapshot: () => false,
  }
}
