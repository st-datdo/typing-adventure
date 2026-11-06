import {
  OwlAccessory,
  OwlEvolve,
  type OwlAccessoryKind,
  type OwlEvolveKind,
} from '../game/fx/sprites'

export const OWL_MOODS = [
  'idle',
  'wave',
  'happy',
  'cheer',
  'encourage',
  'sad',
  'thinking',
  'sleep',
] as const

export type OwlMood = (typeof OWL_MOODS)[number]
export type OwlSize = 'sm' | 'md' | 'lg'

const SIZES: Record<OwlSize, number> = { sm: 40, md: 96, lg: 140 }

const LINE = '#1E3A8A'
const BODY = '#60A5FA'
const WING = '#3B82F6'
const BELLY = '#FEF3C7'
const SCALE = '#FDE68A'
const BEAK = '#F59E0B'
const BEAK_LINE = '#B45309'
const CHEEK = '#F9A8D4'
const INK = '#0F172A'

interface OwlMascotProps {
  mood?: OwlMood
  size?: OwlSize
  still?: boolean
  className?: string
  accessory?: OwlAccessoryKind
  evolve?: OwlEvolveKind
  live?: boolean
}

const WING_L = 'M24 58c-12 10-12 28 2 38 5-12 5-26-2-38z'
const WING_R = 'M96 58c12 10 12 28-2 38-5-12-5-26 2-38z'
const WING_R_UP = 'M94 62c10-6 18-16 20-30-12 4-20 12-24 24z'
const WING_L_UP = 'M26 62c-10-6-18-16-20-30 12 4 20 12 24 24z'
const WING_L_OPEN = 'M24 60c-14 4-18 18-12 30 8-6 12-16 12-30z'
const WING_R_OPEN = 'M96 60c14 4 18 18 12 30-8-6-12-16-12-30z'
const WING_L_CHIN = 'M28 60c-6 8-2 18 10 18 6 0 10-2 12-6-8 0-16-4-22-12z'

function Eyes({ mood, loop }: { mood: OwlMood; loop: string }) {
  if (mood === 'wave' || mood === 'happy') {
    return (
      <g className="owl-eyes" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round">
        <path d="M34 48q9-11 18 0" />
        <path d="M68 48q9-11 18 0" />
      </g>
    )
  }
  if (mood === 'sleep') {
    return (
      <g className="owl-eyes" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round">
        <path d="M34 46q9 9 18 0" />
        <path d="M68 46q9 9 18 0" />
      </g>
    )
  }
  const dx = mood === 'thinking' ? 4 : 0
  const dy = mood === 'thinking' ? -4 : 0
  return (
    <g className={mood === 'idle' ? `owl-eyes owl-eyes--blink ${loop}` : 'owl-eyes'}>
      <circle
        cx={43}
        cy={46}
        r={16}
        fill="#fff"
        stroke={LINE}
        strokeWidth={3}
        className="owl-line"
      />
      <circle
        cx={77}
        cy={46}
        r={16}
        fill="#fff"
        stroke={LINE}
        strokeWidth={3}
        className="owl-line"
      />
      {mood === 'cheer' ? (
        <g fill={BEAK} stroke={BEAK_LINE} strokeWidth={1.5} strokeLinejoin="round">
          <path d="M43 37l3 6 6 1-4.5 4 1 6-5.5-3-5.5 3 1-6-4.5-4 6-1z" />
          <path d="M77 37l3 6 6 1-4.5 4 1 6-5.5-3-5.5 3 1-6-4.5-4 6-1z" />
        </g>
      ) : (
        <g fill={INK}>
          <circle cx={43 + dx} cy={47 + dy} r={7} />
          <circle cx={77 + dx} cy={47 + dy} r={7} />
          <circle cx={45.5 + dx} cy={44.5 + dy} r={2.5} fill="#fff" />
          <circle cx={79.5 + dx} cy={44.5 + dy} r={2.5} fill="#fff" />
        </g>
      )}
      {mood === 'sad' && (
        <g fill={BODY} stroke={LINE} strokeWidth={3} className="owl-line">
          <path d="M27 46a16 16 0 0 1 32 0z" />
          <path d="M61 46a16 16 0 0 1 32 0z" />
        </g>
      )}
      {(mood === 'encourage' || mood === 'sad') && (
        <g fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round">
          {mood === 'encourage' ? (
            <>
              <path d="M32 26q10-7 20-1" />
              <path d="M68 25q10-6 20 1" />
            </>
          ) : (
            <>
              <path d="M32 24q10 4 20 6" />
              <path d="M68 30q10-2 20-6" />
            </>
          )}
        </g>
      )}
    </g>
  )
}

function Wings({ mood, live }: { mood: OwlMood; live: boolean }) {
  let left = WING_L
  let right = WING_R
  if (mood === 'wave' || mood === 'encourage') right = WING_R_UP
  if (mood === 'happy') {
    left = WING_L_OPEN
    right = WING_R_OPEN
  }
  if (mood === 'cheer') {
    left = WING_L_UP
    right = WING_R_UP
  }
  if (mood === 'thinking') left = WING_L_CHIN
  return (
    <g fill={WING} stroke={LINE} strokeWidth={3} strokeLinejoin="round" className="owl-line">
      <path className="owl-wing owl-wing--l" d={left} />
      <path
        className={
          live && mood === 'wave' ? 'owl-wing owl-wing--r fx-loop' : 'owl-wing owl-wing--r'
        }
        d={right}
      />
    </g>
  )
}

function Extras({ mood, loop }: { mood: OwlMood; loop: string }) {
  if (mood === 'happy' || mood === 'cheer') {
    const spots =
      mood === 'cheer'
        ? [
            [10, 20],
            [108, 18],
            [6, 70],
            [112, 72],
          ]
        : [
            [12, 24],
            [106, 22],
          ]
    return (
      <g className="owl-sparkles" fill={BEAK}>
        {spots.map(([x, y]) => (
          <path key={`${x}-${y}`} d={`M${x} ${y - 7}l2 5 5 2-5 2-2 5-2-5-5-2 5-2z`} />
        ))}
      </g>
    )
  }
  if (mood === 'encourage') {
    return (
      <path
        className="owl-heart"
        d="M108 16c-2-4-8-3-8 1 0 4 8 8 8 8s8-4 8-8c0-4-6-5-8-1z"
        fill="#EC4899"
      />
    )
  }
  if (mood === 'thinking') {
    return (
      <g className="owl-dots" fill={LINE}>
        <circle cx={96} cy={14} r={3} />
        <circle cx={105} cy={10} r={3} />
        <circle cx={114} cy={6} r={3} />
      </g>
    )
  }
  if (mood === 'sleep') {
    return (
      <g
        className={`owl-zzz ${loop}`}
        fill="none"
        stroke={LINE}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M92 18h10l-10 10h10" />
        <path d="M106 4h7l-7 7h7" />
      </g>
    )
  }
  return null
}

export function OwlMascot({
  mood = 'idle',
  size = 'md',
  still = false,
  className,
  accessory,
  evolve,
  live = false,
}: OwlMascotProps) {
  const loop = live ? 'fx-loop' : 'kr-loop'
  const px = SIZES[size]
  const cls = ['owl', `owl--${mood}`, still ? 'owl--still' : '', className ?? '']
    .filter(Boolean)
    .join(' ')
  const smiling = mood === 'wave' || mood === 'happy' || mood === 'cheer' || mood === 'encourage'
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 120"
      width={px}
      height={px}
      className={cls}
      data-mood={mood}
      data-accessory={accessory}
      data-evolve={evolve}
      aria-hidden="true"
      focusable="false"
    >
      <ellipse cx={60} cy={113} rx={30} ry={5} fill="rgba(15,23,42,.15)" />
      {evolve && <OwlEvolve kind={evolve} />}
      <g className={mood === 'idle' ? `owl-body ${loop}` : 'owl-body'}>
        <path
          d="M30 30l-4-18 18 10zM90 30l4-18-18 10z"
          fill={BODY}
          stroke={LINE}
          strokeWidth={3}
          strokeLinejoin="round"
          className="owl-line"
        />
        <ellipse
          cx={60}
          cy={64}
          rx={38}
          ry={44}
          fill={BODY}
          stroke={LINE}
          strokeWidth={3}
          className="owl-line"
        />
        <ellipse cx={60} cy={82} rx={24} ry={24} fill={BELLY} />
        <g fill="none" stroke={SCALE} strokeWidth={3} strokeLinecap="round">
          <path d="M50 76l4 4 4-4M62 76l4 4 4-4M56 88l4 4 4-4" />
        </g>
        <Wings mood={mood} live={live} />
        <Eyes mood={mood} loop={loop} />
        <circle cx={30} cy={62} r={5} fill={CHEEK} opacity={0.8} />
        <circle cx={90} cy={62} r={5} fill={CHEEK} opacity={0.8} />
        <path
          d={mood === 'sad' ? 'M54 60l6 9 6-9z' : 'M54 58l6 10 6-10z'}
          fill={BEAK}
          stroke={BEAK_LINE}
          strokeWidth={2}
          strokeLinejoin="round"
        />
        {smiling && (
          <path
            d="M55 70q5 4 10 0"
            fill="none"
            stroke={BEAK_LINE}
            strokeWidth={2}
            strokeLinecap="round"
          />
        )}
        <g fill={BEAK} stroke={BEAK_LINE} strokeWidth={2} strokeLinejoin="round">
          <path d="M46 104l-4 6h10zM74 104l-4 6h10z" />
        </g>
      </g>
      <Extras mood={mood} loop={loop} />
      {accessory && <OwlAccessory kind={accessory} />}
    </svg>
  )
}
