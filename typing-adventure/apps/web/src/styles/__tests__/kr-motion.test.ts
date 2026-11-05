import { describe, expect, it } from 'vitest'
import {
  allKeyframeNames,
  cssBlocks,
  cssDecls,
  keyframes,
  mediaBlock,
  readStyle,
  ruleFor,
  rulesMatching,
  toMs,
  tokenValue,
} from './css-helpers'

const motion = readStyle('motion.css')
const globals = readStyle('globals.css')

function num(v: string | undefined): number {
  return v ? parseFloat(v.replace(/!important/, '').trim()) : NaN
}

function lastFrame(body: string): Record<string, string> {
  const frames = cssBlocks(body)
  const last = frames.find((f) => f.selectors.includes('to') || f.selectors.includes('100%'))
  return last ? cssDecls(last.body) : {}
}

describe('KR motion system', () => {
  it('KR-14 motion.css is imported globally', () => {
    expect(globals).toMatch(/@import\s+['"]\.\/motion\.css['"]/)
  })

  it('KR-14 global reduced-motion block shortens every animation and transition', () => {
    const media = mediaBlock(motion, /prefers-reduced-motion:\s*reduce/)
    const block = cssBlocks(media).find(
      (b) =>
        b.selectors.includes('*') &&
        b.selectors.includes('*::before') &&
        b.selectors.includes('*::after'),
    )
    expect(block, 'universal reduced-motion rule').toBeTruthy()
    const d = cssDecls(block!.body)
    expect(d['animation-duration']).toMatch(/!important/)
    expect(num(d['animation-duration']?.replace('ms', ''))).toBeLessThanOrEqual(0.01)
    expect(d['animation-duration']).toMatch(/ms/)
    expect(d['animation-iteration-count']).toMatch(/^1\s*!important$/)
    expect(d['transition-duration']).toMatch(/!important/)
    expect(num(d['transition-duration']?.replace('ms', ''))).toBeLessThanOrEqual(0.01)
  })

  it('KR-07 kr-pop-in only touches opacity/transform and ends at rest', () => {
    const kf = keyframes(motion, 'kr-pop-in')
    expect(kf, 'kr-pop-in keyframes').toBeTruthy()
    for (const frame of cssBlocks(kf!)) {
      for (const prop of Object.keys(cssDecls(frame.body))) {
        expect(['opacity', 'transform']).toContain(prop)
      }
    }
    const end = lastFrame(kf!)
    expect(end.opacity).toBe('1')
    expect(end.transform).toBe('none')
  })

  it('KR-07 kr-enter staggers by --i with back-out easing and 300-450ms duration', () => {
    const enter = ruleFor(motion, '.kr-enter')
    expect(enter['animation-delay']?.replace(/\s+/g, '')).toBe('calc(var(--i)*var(--kr-stagger))')
    expect(enter.animation ?? enter['animation-name']).toMatch(/kr-pop-in/)
    expect(enter.animation ?? '').toMatch(/var\(--kr-dur-enter\)/)
    expect(enter.animation ?? '').toMatch(/var\(--kr-ease-back\)/)
    expect(enter.animation ?? '').toMatch(/\bbackwards\b/)
    expect(enter.animation ?? '').not.toMatch(/\b(both|forwards)\b/)
    const stagger = toMs(tokenValue('--kr-stagger') ?? '')
    expect(stagger).toBeGreaterThanOrEqual(40)
    expect(stagger).toBeLessThanOrEqual(120)
    const dur = toMs(tokenValue('--kr-dur-enter') ?? '')
    expect(dur).toBeGreaterThanOrEqual(300)
    expect(dur).toBeLessThanOrEqual(450)
    const ease = tokenValue('--kr-ease-back') ?? ''
    const m = ease.match(/cubic-bezier\(([^)]+)\)/)
    expect(m).toBeTruthy()
    const [, y1, , y2] = m![1].split(',').map((x) => parseFloat(x))
    expect(y1).toBeGreaterThan(1)
    expect(y2).toBe(1)
  })

  it('KR-16 decorative loops pause while playing', () => {
    const rules = rulesMatching(motion, (s) => /\[data-playing="true"\] \.kr-loop$/.test(s))
    expect(rules.length).toBeGreaterThan(0)
    expect(rules.some((r) => /animation-play-state:\s*paused/.test(r.body))).toBe(true)
  })

  it('KR-07 KR-15 no keyframes animate layout properties', () => {
    const names = allKeyframeNames(motion)
    expect(names.length).toBeGreaterThan(0)
    for (const name of names) {
      const kf = keyframes(motion, name) ?? ''
      for (const frame of cssBlocks(kf)) {
        for (const prop of Object.keys(cssDecls(frame.body))) {
          expect(prop, `${name}`).not.toMatch(/^(width|height|top|left|right|bottom|margin.*)$/)
        }
      }
    }
  })
})
