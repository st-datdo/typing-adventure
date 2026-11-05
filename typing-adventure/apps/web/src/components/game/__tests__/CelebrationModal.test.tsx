import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createInitialState, type GameMode, type GameResult } from '@typing-adventure/game-engine'
import { CelebrationModal } from '../CelebrationModal'

const result: GameResult = {
  wpm: 31,
  cps: 2.6,
  accuracy: 94,
  score: 12345,
  stars: 3,
  timeSeconds: 75,
  wordCount: 10,
  maxCombo: 17,
  mistakeMap: { a: 2, s: 1 },
}

const render = (
  mode: GameMode,
  extra: Record<string, unknown> = {},
  r: Partial<GameResult> = {},
) => {
  const gameState = { ...createInitialState(mode, 'easy', 5), ...extra }
  return renderToStaticMarkup(
    <CelebrationModal
      gameState={gameState}
      result={{ ...result, ...r }}
      onPlayAgain={() => {}}
      onTryLevel={() => {}}
      onPracticeWeak={() => {}}
    />,
  )
}

describe('CelebrationModal', () => {
  it('KR-21 KR-10 shows the same stats as before', () => {
    const html = render('classic')
    expect(html).toContain((12345).toLocaleString())
    expect(html).toContain('1:15')
    expect(html).toContain('2.6')
    expect(html).toContain('>31<')
    expect(html).toContain('94%')
    expect(html).toContain('x17')
    expect(html).toContain('Tuyệt vời!')
  })

  it('KR-10 lesson mode shows the lesson name', () => {
    const html = render('lesson')
    expect(html).toMatch(/cstat-lbl">[^<]*Bài/)
  })

  it('KR-10 challenge shows heart icons with a label and the out-of-lives title', () => {
    const html = render('challenge', { lives: 0 }, { stars: 1 })
    expect(html).toContain('Hết mạng!')
    expect(html).toContain('aria-label="Còn 0/3 mạng"')
    const live = render('challenge', { lives: 2 })
    expect((live.match(/data-icon="heart"/g) ?? []).length).toBeGreaterThanOrEqual(2)
  })

  it('KR-10 time attack shows words completed and the clock illustration', () => {
    const html = render('timeAttack', { wordsCompleted: 12 })
    expect(html).toContain('Hết giờ!')
    expect(html).toContain('>12<')
    expect(html).toMatch(
      /<img[^>]*src="\/illustrations\/result-clock\.svg"[^>]*alt=""|<img[^>]*alt=""[^>]*src="\/illustrations\/result-clock\.svg"/,
    )
  })

  it('KR-10 actions follow stars, level and mistakes', () => {
    const html = render('classic')
    expect(html).toContain('ui-btn--go')
    expect(html).toContain('ui-btn--sun')
    const two = render('classic', {}, { stars: 2, mistakeMap: {} })
    expect(two).not.toContain('ui-btn--sun')
    expect(two).not.toContain('Luyện chữ yếu')
    expect(html).toContain('Luyện chữ yếu')
    const hard = renderToStaticMarkup(
      <CelebrationModal
        gameState={{ ...createInitialState('classic', 'hard', 5) }}
        result={result}
        onPlayAgain={() => {}}
        onTryLevel={() => {}}
        onPracticeWeak={() => {}}
      />,
    )
    expect(hard).not.toContain('ui-btn--sun')
  })

  it('KR-04 owl mood follows the result and no emoji remain', () => {
    expect(render('classic')).toContain('data-mood="cheer"')
    expect(render('classic', {}, { stars: 2 })).toContain('data-mood="happy"')
    expect(render('challenge', { lives: 0 }, { stars: 1 })).toContain('data-mood="encourage"')
    for (const html of [
      render('classic'),
      render('challenge', { lives: 2 }),
      render('timeAttack'),
    ]) {
      expect(html).not.toMatch(/🥳|😵|⏰|★|☆|🎮|🔥|❤️/u)
    }
  })

  it('KR-10 the dialog is focusable', () => {
    expect(render('classic')).toMatch(
      /role="dialog"[^>]*tabindex="-1"|tabindex="-1"[^>]*role="dialog"/,
    )
  })
})
