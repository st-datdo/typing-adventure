import { existsSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const dir = join(__dirname, '../../../public/illustrations')

const FILES = [
  'scene-day-top.svg',
  'scene-day-bottom.svg',
  'scene-candy-top.svg',
  'scene-candy-bottom.svg',
  'scene-night-top.svg',
  'scene-night-bottom.svg',
  'age-little.svg',
  'age-kid.svg',
  'age-big.svg',
  'game-balloon.svg',
  'game-picture.svg',
  'result-clock.svg',
]

const size = (f: string) => (existsSync(join(dir, f)) ? statSync(join(dir, f)).size : Infinity)
const KB = 1024

describe('KR illustrations', () => {
  it('KR-16 all 12 illustration files exist', () => {
    for (const f of FILES) expect(existsSync(join(dir, f)), f).toBe(true)
  })

  it('KR-16 each illustration stays within its byte budget', () => {
    for (const f of FILES) {
      const limit = f.startsWith('scene-') ? 18 * KB : f === 'result-clock.svg' ? 6 * KB : 8 * KB
      expect(size(f), f).toBeLessThanOrEqual(limit)
    }
  })

  it('KR-16 first screen illustrations total at most 200 KB', () => {
    const first = [
      'scene-day-top.svg',
      'scene-day-bottom.svg',
      'age-little.svg',
      'age-kid.svg',
      'age-big.svg',
    ]
    const total = first.reduce((sum, f) => sum + size(f), 0)
    expect(total).toBeLessThanOrEqual(200 * KB)
  })

  it('KR-16 illustrations are inert, same-origin SVG', () => {
    for (const f of FILES) {
      if (!existsSync(join(dir, f))) throw new Error(`missing ${f}`)
      const svg = readFileSync(join(dir, f), 'utf8')
      expect(svg, f).toMatch(/<svg[\s>]/)
      expect(svg, f).not.toMatch(/<script/i)
      expect(svg, f).not.toMatch(/\son\w+\s*=/i)
      expect(svg, f).not.toMatch(/(xlink:)?href\s*=\s*["']https?:/i)
      const urls = [...svg.matchAll(/https?:\/\/[^\s"')]+/g)].map((m) => m[0])
      for (const u of urls) expect(u, f).toMatch(/^http:\/\/www\.w3\.org\//)
      const withPos = [...svg.matchAll(/https?:\/\/[^\s"')]+/g)]
      for (const m of withPos) {
        const before = svg.slice(Math.max(0, (m.index ?? 0) - 12), m.index)
        expect(before, f).toMatch(/xmlns(:\w+)?=["']$/)
      }
    }
  })
})
