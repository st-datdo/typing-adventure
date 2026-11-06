import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Stars } from '../Stars'
import { GamesHub } from '../GamesHub'

describe('Stars', () => {
  it('KR-10 renders 3 SVG stars with an accessible label', () => {
    const html = renderToStaticMarkup(<Stars n={2} size="lg" animate />)
    expect(html).toMatch(/role="img"/)
    expect(html).toContain('aria-label="Đạt 2/3 sao"')
    expect((html.match(/<svg/g) ?? []).length).toBe(3)
    expect((html.match(/star--on/g) ?? []).length).toBe(2)
    expect((html.match(/star--off/g) ?? []).length).toBe(1)
    expect(html).not.toMatch(/★|☆/)
  })

  it('KR-10 animate staggers earned stars by starDelays', () => {
    const html = renderToStaticMarkup(<Stars n={3} size="lg" animate />)
    expect(html).toContain('animation-delay:300ms')
    expect(html).toContain('animation-delay:520ms')
    expect(html).toContain('animation-delay:740ms')
  })
})

describe('GamesHub', () => {
  const html = renderToStaticMarkup(<GamesHub />)

  it('KR-05 game cards use static illustrations, not emoji', () => {
    expect(html).toMatch(
      /<img[^>]*src="\/illustrations\/game-balloon\.svg"[^>]*alt=""|<img[^>]*alt=""[^>]*src="\/illustrations\/game-balloon\.svg"/,
    )
    expect(html).toMatch(/<img[^>]*src="\/illustrations\/game-picture\.svg"/)
    expect(html).not.toMatch(/🎈|🖼️|🎮|✨/u)
  })

  it('KR-05 new badge uses gamesNew text with a sparkle icon', () => {
    const badge = html.match(/class="games-card-new"[^>]*>[\s\S]*?<\/span>/)
    expect(badge).toBeTruthy()
    expect(html).toContain('Mới!')
    expect(html).toMatch(/games-card-new[\s\S]*?data-icon="sparkle"/)
  })

  it('KR-06 KR-07 hub has a scene backdrop and entrance animation', () => {
    expect(html).toContain('kr-scene--hub')
    expect(html).toContain('kr-enter')
  })
})
