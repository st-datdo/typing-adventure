import { describe, expect, it } from 'vitest'
import {
  allKeyframeNames,
  cssBlocks,
  cssDecls,
  keyframes,
  mediaBlock,
  readStyle,
  rulesMatching,
  toMs,
} from './css-helpers'

const fx = readStyle('fx.css')
const decor = readStyle('decor.css')
const globals = readStyle('globals.css')

function stripMedia(css: string): string {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '')
  let out = ''
  let i = 0
  const re = /@media[^{]*\{/g
  let m: RegExpExecArray | null
  while ((m = re.exec(clean))) {
    out += clean.slice(i, m.index)
    let depth = 0
    let j = m.index + m[0].length - 1
    for (; j < clean.length; j++) {
      if (clean[j] === '{') depth++
      else if (clean[j] === '}') {
        depth--
        if (depth === 0) break
      }
    }
    i = j + 1
    re.lastIndex = i
  }
  return out + clean.slice(i)
}

const base = stripMedia(fx)
const reduced = mediaBlock(fx, /prefers-reduced-motion:\s*reduce/)

function baseRule(selector: string): Record<string, string> {
  const merged: Record<string, string> = {}
  for (const b of cssBlocks(base))
    if (b.selectors.includes(selector)) Object.assign(merged, cssDecls(b.body))
  return merged
}

function animationEnd(value: string): number {
  let end = 0
  for (const part of value.split(/,(?![^(]*\))/)) {
    const times = part.match(/-?[\d.]+m?s\b/g) ?? []
    const dur = times[0] ? toMs(times[0]) : 0
    const delay = times[1] ? toMs(times[1]) : 0
    end = Math.max(end, dur + delay)
  }
  return end
}

function keyframeProps(name: string): string[] {
  const kf = keyframes(fx, name) ?? ''
  const props = new Set<string>()
  for (const f of cssBlocks(kf)) for (const p of Object.keys(cssDecls(f.body))) props.add(p)
  return [...props]
}

describe('FX css', () => {
  it('FX-01 fx.css is imported after game.css', () => {
    const g = globals.indexOf("@import './game.css'")
    const f = globals.indexOf("@import './fx.css'")
    expect(g).toBeGreaterThan(-1)
    expect(f).toBeGreaterThan(g)
  })

  it('FX-01 decor.css drops the HF side burst and fireworks', () => {
    for (const sel of ['.combo-burst', '.combo-side', '.fw-spark', '.fw-rocket']) {
      expect(
        rulesMatching(decor, (s) => s.includes(sel)),
        sel,
      ).toHaveLength(0)
    }
    expect(keyframes(decor, 'fw-pop')).toBeNull()
    expect(keyframes(decor, 'fw-rise')).toBeNull()
  })

  it('FX-03 FX-19 label sits centered above the text and ignores the pointer', () => {
    const r = baseRule('.fx-combo-label')
    expect(r['pointer-events']).toBe('none')
    expect(r.position).toBe('absolute')
    expect(r.left).toBe('50%')
    expect(r.bottom.replace(/\s+/g, '')).toContain('calc(100%-12px)')
  })

  it('FX-03 label keyframes only move and fade, finish within 900ms, never loop', () => {
    const names = allKeyframeNames(fx).filter((n) => n.startsWith('fx-label-'))
    expect(names.length).toBeGreaterThanOrEqual(4)
    for (const n of names) {
      for (const p of keyframeProps(n)) expect(['transform', 'opacity'], n).toContain(p)
    }
    const rules = rulesMatching(base, (s) => /^\.fx-combo-label/.test(s))
    let animated = 0
    for (const r of rules) {
      const d = cssDecls(r.body)
      const a = d.animation ?? ''
      if (!a || a === 'none') continue
      animated++
      expect(a, r.selectors.join()).not.toMatch(/infinite/)
      expect(animationEnd(a), r.selectors.join()).toBeLessThanOrEqual(900)
    }
    expect(animated).toBeGreaterThanOrEqual(4)
  })

  it('FX-15 reduced motion stops the label', () => {
    const r: Record<string, string> = {}
    for (const b of cssBlocks(reduced))
      if (b.selectors.includes('.fx-combo-label')) Object.assign(r, cssDecls(b.body))
    expect(r.animation).toBe('none')
  })
})
