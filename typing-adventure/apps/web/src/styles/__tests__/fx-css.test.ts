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

  it('FX-07 six pop kinds only touch transform, opacity or color within 400ms', () => {
    for (const kind of ['squash', 'wiggle', 'hop', 'flip', 'jelly', 'tint']) {
      const r = baseRule(`.char[data-pop="${kind}"]`)
      expect(r.animation, kind).toBeTruthy()
      const name = r.animation.split(' ')[0]
      expect(name).toBe(`fx-pop-${kind}`)
      expect(animationEnd(r.animation), kind).toBeLessThanOrEqual(400)
      expect(r.animation).not.toMatch(/infinite/)
      for (const p of keyframeProps(name))
        expect(['transform', 'opacity', 'color'], name).toContain(p)
    }
  })

  it('FX-08 particles ignore the pointer and fade within 600ms', () => {
    expect(baseRule('.fx-p')['pointer-events']).toBe('none')
    expect(baseRule('.fx-word-layer')['pointer-events']).toBe('none')
    const kf = keyframes(fx, 'fx-spark')
    expect(kf).toBeTruthy()
    const rules = rulesMatching(base, (s) => /\.fx-p/.test(s)).filter((r) =>
      /fx-spark|fx-confetti-bit/.test(cssDecls(r.body).animation ?? ''),
    )
    expect(rules.length).toBeGreaterThan(0)
    for (const r of rules) {
      const a = cssDecls(r.body).animation
      expect(a).not.toMatch(/infinite/)
      expect(animationEnd(a)).toBeLessThanOrEqual(600)
    }
  })

  it('FX-10 word effects finish within 700ms', () => {
    const names = allKeyframeNames(fx).filter((n) => n.startsWith('fx-word-'))
    expect(names.length).toBeGreaterThanOrEqual(3)
    const rules = rulesMatching(base, (s) => /fx-word/.test(s))
    let n = 0
    for (const r of rules) {
      const a = cssDecls(r.body).animation
      if (!a || a === 'none') continue
      n++
      expect(a).not.toMatch(/infinite/)
      expect(animationEnd(a), r.selectors.join()).toBeLessThanOrEqual(700)
    }
    expect(n).toBeGreaterThan(0)
  })

  it('FX-15 reduced motion removes pops, particles and word effects', () => {
    const sels = cssBlocks(reduced).flatMap((b) => {
      const d = cssDecls(b.body)
      return d.animation === 'none' || d.display === 'none' ? b.selectors : []
    })
    expect(sels).toContain('.char[data-pop]')
    expect(sels).toContain('.fx-p')
    expect(sels).toContain('.fx-word')
  })

  it('KR-15 fx keyframes never animate layout properties', () => {
    const names = allKeyframeNames(fx)
    expect(names.length).toBeGreaterThan(0)
    for (const name of names) {
      for (const p of keyframeProps(name)) {
        expect(p, name).not.toMatch(/^(width|height|top|left|right|bottom|margin.*|padding.*)$/)
      }
    }
  })

  it('FX-16 looping fx animations that fade cycle no faster than 334ms', () => {
    const rules = rulesMatching(fx, (s) => /fx-loop/.test(s))
    expect(rules.length).toBeGreaterThan(0)
    for (const r of cssBlocks(fx)) {
      const a = cssDecls(r.body).animation ?? ''
      if (!/infinite/.test(a)) continue
      const name = a.split(/\s+/)[0]
      const fades = keyframeProps(name).some((p) => p === 'opacity' || p === 'filter')
      if (!fades) continue
      expect(animationEnd(a), r.selectors.join()).toBeGreaterThanOrEqual(334)
    }
  })

  it('FX-12 fx-loop is never paused by the playing selector', () => {
    const motion = readStyle('motion.css')
    for (const css of [fx, motion]) {
      const paused = rulesMatching(css, (s) => /\[data-playing/.test(s) && /fx-loop/.test(s))
      expect(paused).toHaveLength(0)
    }
    const owl = rulesMatching(base, (s) => /\.owl--sleep .*\.fx-loop/.test(s))
    expect(owl.length).toBeGreaterThan(0)
    expect(cssDecls(owl[0].body).animation).toMatch(/infinite/)
  })

  it('FX-11 FX-12 owl bubble ignores the pointer and stays under 1500ms', () => {
    const r = baseRule('.fx-owl-bubble')
    expect(r['pointer-events']).toBe('none')
    expect(r.position).toBe('absolute')
    expect(animationEnd(r.animation ?? '')).toBeLessThanOrEqual(1500)
    const ev = rulesMatching(base, (s) => /\.owl-evolve/.test(s) || /\[data-evolve\]/.test(s))
    for (const b of ev) {
      const a = cssDecls(b.body).animation
      if (a && a !== 'none') expect(animationEnd(a)).toBeLessThanOrEqual(2000)
    }
  })

  it('FX-16 FX-01 backdrop sits behind content, dim and inert', () => {
    const r = baseRule('.fx-backdrop')
    expect(r.position).toBe('fixed')
    expect(r['z-index']).toBe('0')
    expect(parseFloat(r.opacity)).toBeLessThanOrEqual(0.6)
    expect(r['pointer-events']).toBe('none')
    expect(r.overflow).toBe('hidden')
  })

  it('FX-19 runner track clips and the run ends within 2500ms', () => {
    expect(baseRule('.fx-runner-track').overflow).toBe('hidden')
    expect(baseRule('.fx-runner-track')['pointer-events']).toBe('none')
    const run = rulesMatching(base, (s) => /^\.fx-runner\b/.test(s)).find((r) =>
      /fx-run\b/.test(cssDecls(r.body).animation ?? ''),
    )
    expect(run).toBeTruthy()
    const a = cssDecls(run!.body).animation
    expect(a).not.toMatch(/infinite/)
    expect(animationEnd(a)).toBeLessThanOrEqual(2500)
  })

  it('FX-04 sticker rain falls within 2200ms', () => {
    const r = baseRule('.fx-sticker')
    expect(r.animation).toMatch(/fx-rain/)
    expect(r.animation).not.toMatch(/infinite/)
    expect(animationEnd(r.animation)).toBeLessThanOrEqual(2200)
    expect(keyframes(fx, 'fx-rain')).toBeTruthy()
  })

  it('FX-16 sky transitions run once within 1000ms', () => {
    const names = allKeyframeNames(fx).filter((n) => n.startsWith('fx-sky-'))
    expect(names.length).toBeGreaterThanOrEqual(2)
    const rules = rulesMatching(base, (s) => /fx-sky/.test(s))
    let n = 0
    for (const r of rules) {
      const a = cssDecls(r.body).animation
      if (!a || a === 'none') continue
      n++
      expect(a).not.toMatch(/infinite/)
      expect(animationEnd(a)).toBeLessThanOrEqual(1000)
    }
    expect(n).toBeGreaterThan(0)
  })

  it('FX-16 super mode is static and fx never uses the danger colour', () => {
    const sup = rulesMatching(fx, (s) => /\[data-fx-super/.test(s))
    expect(sup.length).toBeGreaterThan(0)
    for (const r of sup) {
      const d = cssDecls(r.body)
      expect(d.animation ?? 'none').toBe('none')
    }
    expect(fx).not.toMatch(/--kr-danger/)
  })

  it('FX-15 reduced motion hides runners and stickers', () => {
    const hidden = cssBlocks(reduced).flatMap((b) =>
      cssDecls(b.body).display === 'none' ? b.selectors : [],
    )
    expect(hidden).toContain('.fx-runner')
    expect(hidden).toContain('.fx-sticker')
  })

  it('FX-15 reduced motion hides the canvases', () => {
    const hidden = cssBlocks(reduced).flatMap((b) =>
      cssDecls(b.body).display === 'none' ? b.selectors : [],
    )
    expect(hidden).toContain('.fx-canvas')
  })

  it('FX-16 every repeating keyframe that fades or filters cycles no faster than 334ms', () => {
    const names = new Set(allKeyframeNames(fx))
    for (const r of cssBlocks(fx)) {
      const d = cssDecls(r.body)
      const anim = d.animation ?? ''
      const name = d['animation-name'] ?? anim.split(/\s+/)[0]
      if (!name || !names.has(name)) continue
      const count =
        d['animation-iteration-count'] ??
        anim.match(/\binfinite\b|\s(\d+(?:\.\d+)?)(?=\s|$)/)?.[0] ??
        '1'
      const repeats = /infinite/.test(count) || Number(count.trim()) > 1
      if (!repeats) continue
      const fades = keyframeProps(name).some((p) => p === 'opacity' || p === 'filter')
      if (!fades) continue
      const dur = d['animation-duration'] ? toMs(d['animation-duration']) : animationEnd(anim)
      expect(dur, r.selectors.join()).toBeGreaterThanOrEqual(334)
    }
  })

  it('FX-16 no full-screen fixed layer animates opacity or filter outside a static dim backdrop', () => {
    for (const r of cssBlocks(base)) {
      const d = cssDecls(r.body)
      if (d.position !== 'fixed' || d.inset !== '0') continue
      const anim = d.animation ?? d['animation-name'] ?? 'none'
      const name = anim.split(/\s+/)[0]
      const animates =
        name !== 'none' && keyframeProps(name).some((p) => p === 'opacity' || p === 'filter')
      expect(animates, r.selectors.join()).toBe(false)
      expect(d.transition ?? '', r.selectors.join()).not.toMatch(/opacity|filter/)
      if (r.selectors.includes('.fx-backdrop')) {
        expect(Number(d.opacity)).toBeLessThanOrEqual(0.6)
      } else if (d.opacity !== undefined) {
        expect(Number(d.opacity), r.selectors.join()).toBe(1)
      }
    }
  })
})
