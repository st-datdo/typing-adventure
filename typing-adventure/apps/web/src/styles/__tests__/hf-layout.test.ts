import { describe, expect, it } from 'vitest'
import { cssBlocks, cssDecls, mediaBlock, readStyle, ruleFor } from './css-helpers'

const game = readStyle('game.css')

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

function declsWhere(css: string, test: (sel: string) => boolean): Record<string, string> {
  const out: Record<string, string> = {}
  for (const b of cssBlocks(css)) if (b.selectors.some(test)) Object.assign(out, cssDecls(b.body))
  return out
}

const wide = mediaBlock(game, /min-width:\s*1024px/)
const base = stripMedia(game)

describe('HF layout', () => {
  it('HF-01 wide media', () => {
    expect(ruleFor(wide, '.main')['max-width']).toBe('1240px')
    const grid = ruleFor(wide, '.kb-stage--hands')
    expect(grid.display).toBe('grid')
    expect(grid['grid-template-columns']).toContain('minmax(84px, 160px)')
    expect(grid['grid-template-columns']).toContain('minmax(772px, 820px)')
    expect(ruleFor(wide, '.kb-stage--hands .hands-guide').display).toBe('contents')
    const left = declsWhere(wide, (s) => s.endsWith('.finger-label[data-side="left"]'))
    const right = declsWhere(wide, (s) => s.endsWith('.finger-label[data-side="right"]'))
    expect(left['grid-column']).toBe('1')
    expect(right['grid-column']).toBe('3')
    const svg = declsWhere(wide, (s) => /\.hand-(svg|left|right)$/.test(s))
    expect(svg['pointer-events']).toBe('none')
  })

  it('HF-05 text gutter', () => {
    expect(ruleFor(wide, '.word-stage')['padding-inline']).toContain('var(--hf-gutter)')
  })

  it('HF-03 narrow unchanged', () => {
    expect(ruleFor(base, '.main')['max-width']).toBe('1000px')
    const mobile = mediaBlock(game, /max-width:\s*640px/)
    expect(mobile).toMatch(/\.hands-guide/)
    expect(mobile).toMatch(/\.hand-svg/)
  })

  it('HF-04 keyboard width unchanged', () => {
    expect(ruleFor(base, '.keyboard')['max-width']).toBe('820px')
  })
})
