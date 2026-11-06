import type { ParticleShape } from '@/lib/fx/pools'

export const LINE = '#1E3A8A'

export const PARTICLE_PATHS: Record<ParticleShape, string> = {
  star: '<path d="M12 2.5l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 16.9 6.3 20l1.2-6.4L2.8 9.2l6.4-.8z"/>',
  dot: '<circle cx="12" cy="12" r="7"/>',
  heart:
    '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.2 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>',
  bubble:
    '<circle cx="12" cy="12" r="7.5" fill="none" stroke="currentColor" stroke-width="2.5"/><circle cx="9.5" cy="9.5" r="2"/>',
  sparkle: '<path d="M12 2l2 7.5 7.5 2.5-7.5 2.5-2 7.5-2-7.5L2.5 12 10 9.5z"/>',
  note: '<path d="M10 17.5a3 3 0 1 1-2-2.8V4.5l10-2.2v11.2a3 3 0 1 1-2-2.8V5.8l-6 1.3z"/>',
}

export function particleSvg(shape: ParticleShape): string {
  return `<svg viewBox="0 0 24 24" fill="currentColor" stroke="${LINE}" stroke-width="1.2" stroke-linejoin="round" aria-hidden="true" focusable="false">${PARTICLE_PATHS[shape]}</svg>`
}

export function ParticleSprite({ shape, size = 20 }: { shape: ParticleShape; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      stroke={LINE}
      strokeWidth={1.2}
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{ __html: PARTICLE_PATHS[shape] }}
    />
  )
}

export function CheckStamp({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 28 28" width={size} height={size} aria-hidden="true" focusable="false">
      <circle cx={14} cy={14} r={12} fill="var(--kr-success)" stroke={LINE} strokeWidth={2} />
      <path
        d="M8 14.5l4 4 8-9"
        fill="none"
        stroke="var(--kr-on-success)"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export type OwlAccessoryKind = 'sunglasses' | 'party-hat' | 'crown' | 'headphones' | 'bowtie'
export type OwlEvolveKind = 'phoenix' | 'star' | 'hero'

export function OwlAccessory({ kind }: { kind: OwlAccessoryKind }) {
  return (
    <g className={`owl-acc owl-acc--${kind}`} stroke={LINE} strokeWidth={3} strokeLinejoin="round">
      {kind === 'sunglasses' && (
        <>
          <path d="M26 40h68" fill="none" strokeLinecap="round" />
          <rect x={28} y={38} width={28} height={18} rx={8} fill="#0F172A" />
          <rect x={64} y={38} width={28} height={18} rx={8} fill="#0F172A" />
          <path d="M34 43l6-2M70 43l6-2" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
        </>
      )}
      {kind === 'party-hat' && (
        <>
          <path d="M44 22L58 -10 72 22z" fill="#EC4899" />
          <path d="M50 10l14 4M47 17l20 4" stroke="#FDE68A" strokeWidth={3} strokeLinecap="round" />
          <circle cx={58} cy={-12} r={5} fill="#FDE68A" />
        </>
      )}
      {kind === 'crown' && (
        <>
          <path d="M38 24l4-22 12 12 6-16 6 16 12-12 4 22z" fill="#FBBF24" />
          <circle cx={60} cy={16} r={3} fill="#EC4899" stroke="none" />
        </>
      )}
      {kind === 'headphones' && (
        <>
          <path d="M20 50c0-34 80-34 80 0" fill="none" strokeWidth={6} strokeLinecap="round" />
          <rect x={12} y={44} width={16} height={24} rx={7} fill="#EC4899" />
          <rect x={92} y={44} width={16} height={24} rx={7} fill="#EC4899" />
        </>
      )}
      {kind === 'bowtie' && (
        <>
          <path d="M60 76l-16-9v18zM60 76l16-9v18z" fill="#EC4899" />
          <circle cx={60} cy={76} r={4} fill="#FDE68A" />
        </>
      )}
    </g>
  )
}

export function OwlEvolve({ kind }: { kind: OwlEvolveKind }) {
  return (
    <g className={`owl-evolve owl-evolve--${kind}`}>
      <circle
        className="owl-evolve-aura"
        cx={60}
        cy={64}
        r={56}
        fill="var(--kr-tint-yellow)"
        opacity={0.6}
      />
      {kind === 'phoenix' && (
        <g stroke={LINE} strokeWidth={3} strokeLinejoin="round">
          <path d="M26 60C6 50 0 26 4 10c8 14 18 22 30 26z" fill="#F59E0B" />
          <path d="M94 60c20-10 26-34 22-50-8 14-18 22-30 26z" fill="#F59E0B" />
          <path d="M24 66C10 64 4 50 6 40c6 8 12 12 22 14z" fill="#EC4899" />
          <path d="M96 66c14-2 20-16 18-26-6 8-12 12-22 14z" fill="#EC4899" />
        </g>
      )}
      {kind === 'star' && (
        <g fill="#FBBF24" stroke={LINE} strokeWidth={2} strokeLinejoin="round">
          {[
            [14, 22],
            [106, 22],
            [6, 74],
            [114, 74],
            [60, 2],
          ].map(([x, y]) => (
            <path
              key={`${x}-${y}`}
              d={`M${x} ${y - 8}l2.4 5.2 5.6.6-4.2 3.8 1.2 5.6-5-2.8-5 2.8 1.2-5.6-4.2-3.8 5.6-.6z`}
            />
          ))}
        </g>
      )}
      {kind === 'hero' && (
        <path
          d="M30 40c-10 30-14 54-20 72 16-6 30-4 50 0 20-4 34-6 50 0-6-18-10-42-20-72z"
          fill="#EC4899"
          stroke={LINE}
          strokeWidth={3}
          strokeLinejoin="round"
        />
      )}
    </g>
  )
}
