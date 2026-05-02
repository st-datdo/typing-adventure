'use client'

interface CountdownTimerProps {
  seconds: number
}

export function CountdownTimer({ seconds }: CountdownTimerProps) {
  return (
    <div className="mp-countdown-overlay">
      <div className="mp-countdown-number" key={seconds}>
        {seconds === 0 ? 'GO!' : seconds}
      </div>
    </div>
  )
}
