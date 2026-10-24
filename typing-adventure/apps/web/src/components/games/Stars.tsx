'use client'

const MAX_STARS = 3

export function Stars({ n }: { n: number }) {
  return (
    <span className="games-stars" aria-label={`${n}/${MAX_STARS}`}>
      {Array.from({ length: MAX_STARS }, (_, i) => (
        <span key={i} className={i < n ? 'games-star games-star--on' : 'games-star'}>★</span>
      ))}
    </span>
  )
}
