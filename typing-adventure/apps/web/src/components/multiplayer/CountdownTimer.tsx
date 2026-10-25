'use client'

interface CountdownTimerProps {
  seconds: number
}

export function CountdownTimer({ seconds }: CountdownTimerProps) {
  const go = seconds === 0
  return (
    <div className="ui-overlay mp-countdown-overlay" role="status" aria-live="assertive">
      <div className={`mp-countdown-bubble ${go ? 'mp-countdown-bubble--go' : ''}`} key={seconds}>
        {go ? 'GO!' : seconds}
      </div>
    </div>
  )
}
