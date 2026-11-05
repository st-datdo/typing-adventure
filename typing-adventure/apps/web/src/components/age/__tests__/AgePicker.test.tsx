import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { AgePicker } from '../AgePicker'

const html = renderToStaticMarkup(<AgePicker />)

describe('AgePicker', () => {
  it('KR-12 renders three age cards with static illustrations', () => {
    const cards =
      html.match(/<button[^>]*class="[^"]*\bage-card\b[^"]*"[^>]*>[\s\S]*?<\/button>/g) ?? []
    expect(cards).toHaveLength(3)
    ;['little', 'kid', 'big'].forEach((age, i) => {
      expect(cards[i]).toMatch(new RegExp(`<img[^>]*src="/illustrations/age-${age}\\.svg"[^>]*>`))
      const img = cards[i].match(/<img[^>]*>/)![0]
      expect(img).toContain('alt=""')
      expect(img).toMatch(/width="\d+"/)
      expect(img).toMatch(/height="\d+"/)
    })
  })

  it('KR-04 KR-12 owl waves and the bubble is a status region', () => {
    expect(html).toContain('data-mood="wave"')
    expect(html).toMatch(
      /class="little-bubble[^"]*"[^>]*role="status"|role="status"[^>]*class="little-bubble/,
    )
  })

  it('KR-05 KR-12 no emoji remain', () => {
    expect(html).not.toMatch(/🐣|🐥|🦅|🦉|🇬🇧|🇻🇳/u)
  })

  it('KR-07 blocks enter with stagger index 0..6', () => {
    const idx = [
      ...html.matchAll(
        /class="[^"]*\bkr-enter\b[^"]*"[^>]*style="--i:(\d+)"|style="--i:(\d+)"[^>]*class="[^"]*\bkr-enter\b/g,
      ),
    ].map((m) => Number(m[1] ?? m[2]))
    expect(idx.sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6])
  })
})
