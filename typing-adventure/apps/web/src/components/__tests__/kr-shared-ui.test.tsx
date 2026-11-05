import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { LoadingScreen } from '../ui/LoadingScreen'
import { SceneBackdrop } from '../decor/SceneBackdrop'

const decorCss = (() => {
  try {
    return readFileSync(join(__dirname, '../../styles/decor.css'), 'utf8')
  } catch {
    return ''
  }
})()
const globalsCss = readFileSync(join(__dirname, '../../styles/globals.css'), 'utf8')

describe('KR shared UI', () => {
  it('render harness: LoadingScreen renders a status region', () => {
    const html = renderToStaticMarkup(<LoadingScreen label="x" />)
    expect(html).toContain('role="status"')
  })

  for (const variant of ['game', 'picker', 'hub'] as const) {
    it(`KR-06 SceneBackdrop ${variant} renders decorative, non-focusable layers`, () => {
      const html = renderToStaticMarkup(<SceneBackdrop variant={variant} />)
      const divs = html.match(/<div[^>]*>/g) ?? []
      expect(divs.length).toBeGreaterThanOrEqual(2)
      for (const d of divs) {
        expect(d).toContain('aria-hidden="true"')
        expect(d).toMatch(new RegExp(`class="[^"]*\\bkr-scene\\b[^"]*\\bkr-scene--${variant}\\b`))
      }
      expect(html).not.toMatch(/tabindex|<button|<a\s|<img/i)
    })
  }

  it('KR-06 decor.css is imported and scene layers ignore pointer events', () => {
    expect(globalsCss).toMatch(/@import\s+['"]\.\/decor\.css['"]/)
    expect(decorCss).toMatch(/\.kr-scene\s*\{[^}]*pointer-events:\s*none/)
  })

  it('KR-02 scene art switches per theme', () => {
    expect(decorCss).toMatch(/\[data-theme=['"]dark['"]\][^{]*\.kr-scene[^{]*\{[^}]*scene-night-/)
    expect(decorCss).toMatch(
      /\[data-theme=['"]colorful['"]\][^{]*\.kr-scene[^{]*\{[^}]*scene-candy-/,
    )
    expect(decorCss).toMatch(/scene-day-top\.svg/)
    expect(decorCss).toMatch(/scene-day-bottom\.svg/)
  })

  it('KR-06 KR-20 top scene layer is hidden below 768px', () => {
    const m = decorCss.match(/@media\s*\(max-width:\s*767px\)\s*\{([\s\S]*?)\n\}/)
    expect(m, 'mobile media query').toBeTruthy()
    expect(m![1]).toMatch(/\.kr-scene--top[^{]*\{[^}]*display:\s*none/)
  })
})
