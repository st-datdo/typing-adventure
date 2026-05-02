/**
 * Custom performance metrics for typing game.
 * Reports to Vercel Analytics (if deployed) and Sentry (if configured).
 */

export function reportMetric(name: string, value: number) {
  // Report to Sentry custom metrics
  if (typeof window !== 'undefined') {
    import('@sentry/nextjs')
      .then((Sentry) => {
        Sentry.setMeasurement(name, value, 'millisecond')
      })
      .catch(() => {
        // Sentry not available
      })
  }
}

/** Measure game load time (from page load to first keystroke ready) */
export function measureGameLoad(startTime: number) {
  const loadTime = performance.now() - startTime
  reportMetric('game_load_time', loadTime)
}

/** Measure keypress-to-visual-feedback latency */
export function measureKeypressLatency(startTime: number) {
  const latency = performance.now() - startTime
  reportMetric('keypress_latency', latency)
}

/** Measure API response time */
export function measureApiResponseTime(endpoint: string, startTime: number) {
  const responseTime = performance.now() - startTime
  reportMetric(`api_response_${endpoint.replace(/\//g, '_')}`, responseTime)
}
