import { describe, expect, it } from 'vitest'
import { cssBlocks, cssDecls, keyframes, mediaBlock, readStyle, ruleFor } from './css-helpers'

const decor = readStyle('decor.css')

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

const base = stripMedia(decor)
const fwNames = [...decor.matchAll(/@keyframes\s+(fw-[\w-]+)/g)].map((m) => m[1])

describe('HF decor', () => {
  it('HF-05 HF-06 effect layers ignore pointer', () => {
    expect(ruleFor(base, '.combo-burst')['pointer-events']).toBe('none')
    for (const sel of ['.combo-side', '.fw-spark']) {
      const pe = ruleFor(base, sel)['pointer-events']
      expect(pe === undefined || pe === 'none', sel).toBe(true)
    }
  })

  it('HF-06 keyframes fw-* only animate transform/opacity, iteration 1, no infinite', () => {
    expect(fwNames.length).toBeGreaterThan(0)
    for (const name of fwNames) {
      const kf = keyframes(decor, name) ?? ''
      for (const frame of cssBlocks(kf)) {
        for (const prop of Object.keys(cssDecls(frame.body))) {
          expect(['transform', 'opacity'], name).toContain(prop)
        }
      }
    }
    for (const sel of ['.fw-rocket', '.fw-spark']) {
      const r = ruleFor(base, sel)
      expect(r.animation ?? '', sel).toMatch(/fw-/)
      expect(r.animation ?? '', sel).not.toMatch(/infinite/)
      expect(r['animation-iteration-count'] ?? '1').toBe('1')
    }
  })

  it('HF-06 sparks fill both', () => {
    const a = ruleFor(base, '.fw-spark').animation ?? ''
    expect(a).toMatch(/\bboth\b/)
    expect(a).not.toMatch(/infinite/)
  })

  it('HF-10 reduced motion', () => {
    const media = mediaBlock(decor, /prefers-reduced-motion:\s*reduce/)
    expect(ruleFor(media, '.combo-side').animation).toBe('none')
    const burst = ruleFor(media, '.fw-burst').display
    const spark = ruleFor(media, '.fw-spark').display
    expect(burst === 'none' || spark === 'none').toBe(true)
  })

  it('HF-05 HF-11 side positions', () => {
    const wide = mediaBlock(decor, /min-width:\s*1024px/)
    const w = ruleFor(wide, '.combo-side')
    expect(w.top).toBe('0')
    expect(w.bottom).toBe('0')
    expect(w.width).toBe('var(--hf-gutter)')
    const n = ruleFor(base, '.combo-side')
    expect(n.bottom).toBe('calc(100% + 4px)')
    expect(n.height).toBe('92px')
    expect(n['container-type']).toBe('size')
  })

  it('KR-09 no centered burst', () => {
    expect(decor).not.toContain('.combo-spark')
    expect(keyframes(decor, 'combo-pop') ?? '').not.toMatch(/translate\(-50%,\s*-50%\)/)
  })
})
