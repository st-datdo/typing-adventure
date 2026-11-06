import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const dir = join(__dirname, '..')
const read = (f: string) => (existsSync(join(dir, f)) ? readFileSync(join(dir, f), 'utf8') : '')
const stripComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '')

interface Block {
  selectors: string[]
  body: string
}

function blocks(css: string): Block[] {
  const out: Block[] = []
  const re = /([^{}]+)\{([^{}]*)\}/g
  let m: RegExpExecArray | null
  while ((m = re.exec(stripComments(css)))) {
    out.push({
      selectors: m[1]
        .split(',')
        .map((s) => s.trim().replace(/'/g, '"'))
        .filter(Boolean),
      body: m[2],
    })
  }
  return out
}

function decls(body: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const part of body.split(';')) {
    const i = part.indexOf(':')
    if (i < 0) continue
    out[part.slice(0, i).trim()] = part
      .slice(i + 1)
      .trim()
      .replace(/\s+/g, ' ')
  }
  return out
}

function themeTokens(css: string, selector: string): Record<string, string> {
  const merged: Record<string, string> = {}
  for (const b of blocks(css)) {
    if (b.selectors.includes(selector)) Object.assign(merged, decls(b.body))
  }
  return merged
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as [number, number, number]
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string): number {
  const la = luminance(a)
  const lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

const tokensCss = read('tokens.css')
const globalsCss = read('globals.css')

const THEMES = {
  light: themeTokens(tokensCss, '[data-theme="light"]'),
  colorful: {
    ...themeTokens(tokensCss, '[data-theme="light"]'),
    ...themeTokens(tokensCss, '[data-theme="colorful"]'),
  },
  dark: {
    ...themeTokens(tokensCss, '[data-theme="light"]'),
    ...themeTokens(tokensCss, '[data-theme="dark"]'),
  },
}
const ROOT = themeTokens(tokensCss, ':root')

const isColor = (v: string) => /^(#[0-9a-f]{3,8}|rgba?\()/i.test(v)

describe('KR tokens', () => {
  it('KR-01 light palette matches the design', () => {
    const light = { ...ROOT, ...THEMES.light }
    const expected: Record<string, string> = {
      '--kr-bg': '#EFF6FF',
      '--kr-card': '#FFFFFF',
      '--kr-fg': '#0F172A',
      '--kr-fg-muted': '#475569',
      '--kr-primary': '#2563EB',
      '--kr-play': '#F59E0B',
      '--kr-fun': '#EC4899',
      '--kr-danger': '#DC2626',
    }
    for (const [k, v] of Object.entries(expected)) {
      expect(light[k]?.toUpperCase(), k).toBe(v)
    }
  })

  it('KR-01 light block is shared with :root so guests get the palette', () => {
    const b = blocks(tokensCss).find((x) => x.selectors.includes('[data-theme="light"]'))
    expect(b?.selectors).toContain(':root')
  })

  it('KR-02 colorful and dark define every light color token', () => {
    const lightOnly = themeTokens(tokensCss, '[data-theme="light"]')
    const colorKeys = Object.keys(lightOnly).filter(
      (k) => k.startsWith('--kr-') && isColor(lightOnly[k]),
    )
    expect(colorKeys.length).toBeGreaterThanOrEqual(20)
    for (const theme of ['[data-theme="colorful"]', '[data-theme="dark"]']) {
      const own = themeTokens(tokensCss, theme)
      for (const k of colorKeys) expect(own[k], `${theme} ${k}`).toBeTruthy()
    }
  })

  describe('KR-17 contrast per theme', () => {
    const text45: [string, string][] = [
      ['--kr-fg', '--kr-card'],
      ['--kr-fg', '--kr-bg'],
      ['--kr-fg-muted', '--kr-card'],
      ['--kr-fg-muted', '--kr-bg'],
      ['--kr-fg-muted', '--kr-card-soft'],
      ['--kr-on-primary', '--kr-primary'],
      ['--kr-on-play', '--kr-play'],
      ['--kr-on-fun', '--kr-fun'],
      ['--kr-on-danger', '--kr-danger'],
      ['--kr-on-success', '--kr-success'],
      ['--kr-success', '--kr-card'],
      ['--kr-danger', '--kr-card'],
    ]
    for (const name of ['light', 'colorful', 'dark'] as const) {
      it(`KR-17 ${name} text pairs reach 4.5:1 and ring reaches 3:1`, () => {
        const tk = THEMES[name]
        for (const [fg, bg] of text45) {
          expect(tk[fg], `${name} ${fg}`).toMatch(/^#/)
          expect(tk[bg], `${name} ${bg}`).toMatch(/^#/)
          expect(contrast(tk[fg], tk[bg]), `${name} ${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5)
        }
        expect(contrast(tk['--kr-ring'], tk['--kr-bg']), `${name} ring`).toBeGreaterThanOrEqual(3)
      })
    }
  })

  it('KR-03 font tokens use Baloo via --font-kid without Comic Sans or Nunito', () => {
    const all = decls(
      blocks(tokensCss + globalsCss)
        .map((b) => b.body)
        .join(';'),
    )
    for (const k of ['--font-ui', '--font-body', '--font-heading']) {
      expect(all[k], k).toContain('var(--font-kid)')
      expect(all[k], k).not.toMatch(/Comic Sans|Nunito/)
    }
  })

  it('KR-02 KR-13 legacy aliases are declared alongside little-root so Little resolves new colors', () => {
    const alias = blocks(globalsCss).find((b) => /--ink:\s*var\(--kr-fg\)/.test(b.body))
    expect(alias, 'alias block').toBeTruthy()
    expect(alias!.selectors).toContain('.little-root:not(.games-root)')
    expect(alias!.selectors).toContain(':root')
    const d = decls(alias!.body)
    expect(d['--surface']).toBe('var(--kr-card)')
    expect(d['--berry']).toBe('var(--kr-primary)')
    expect(d['--sun']).toBe('var(--kr-play)')
    expect(d['--coral']).toBe('var(--kr-danger)')
    expect(d['--leaf']).toBe('var(--kr-success)')
    expect(d['--scene']).toBe('var(--kr-bg)')
    const little = themeTokens(tokensCss, '.little-root:not(.games-root)')
    expect(little['--kr-bg']?.toUpperCase()).toBe('#EFF6FF')
    expect(little['--kr-fg']?.toUpperCase()).toBe('#0F172A')
  })

  it('KR-02 dark theme in globals no longer hard-codes legacy colors', () => {
    const dark = themeTokens(globalsCss, '[data-theme="dark"]')
    for (const [k, v] of Object.entries(dark)) {
      if (k.startsWith('--')) expect(v, k).not.toMatch(/^#/)
    }
  })

  it('KR-16 tokens.css is imported first and body drops fixed background', () => {
    const imports = [...globalsCss.matchAll(/@import\s+['"]([^'"]+)['"]/g)].map((m) => m[1])
    expect(imports[0]).toBe('./tokens.css')
    const body = blocks(globalsCss).filter((b) => b.selectors.includes('body'))
    expect(body.length).toBeGreaterThan(0)
    for (const b of body) expect(b.body).not.toMatch(/background-attachment:\s*fixed/)
  })
})
