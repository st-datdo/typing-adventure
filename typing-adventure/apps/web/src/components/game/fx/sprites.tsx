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
