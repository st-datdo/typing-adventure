import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Icon } from '../Icon'
import { ICONS, type IconName } from '../icons'

const REQUIRED: IconName[] = [
  'menu',
  'close',
  'logout',
  'restart',
  'soundOn',
  'soundOff',
  'home',
  'arrowLeft',
  'globe',
  'clock',
  'bolt',
  'rocket',
  'target',
  'coin',
  'crown',
  'flame',
  'heart',
  'heartOutline',
  'pencil',
  'keyCap',
  'book',
  'stopwatch',
  'shield',
  'arrowUp',
  'arrowDown',
  'arrowsUpDown',
  'rainbow',
  'hillSmall',
  'hillDouble',
  'mountainFlag',
  'check',
  'gamepad',
  'sparkle',
  'star',
]

const PICTO = /\p{Extended_Pictographic}/u

describe('Icon', () => {
  it('KR-05 the icon set contains every structural icon', () => {
    for (const name of REQUIRED) expect(ICONS[name], name).toBeTruthy()
  })

  it('KR-05 every icon renders a decorative currentColor svg without emoji', () => {
    for (const name of Object.keys(ICONS) as IconName[]) {
      const html = renderToStaticMarkup(<Icon name={name} />)
      expect(html.startsWith('<svg'), name).toBe(true)
      expect(html, name).toContain('aria-hidden="true"')
      expect(html, name).toContain('focusable="false"')
      expect(html, name).toMatch(/(stroke|fill)="currentColor"/)
      expect(html, name).toContain(`data-icon="${name}"`)
      expect(html, name).not.toMatch(PICTO)
    }
  })

  it('KR-05 size controls width and height', () => {
    const html = renderToStaticMarkup(<Icon name="star" size={36} />)
    expect(html).toContain('width="36"')
    expect(html).toContain('height="36"')
  })

  it('KR-05 an icon with a title is exposed to assistive tech', () => {
    const html = renderToStaticMarkup(<Icon name="heart" title="Lives" />)
    expect(html).not.toContain('aria-hidden')
    expect(html).toContain('role="img"')
    expect(html).toContain('<title>Lives</title>')
  })
})
