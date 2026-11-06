import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ChoiceCards } from '../ChoiceCards'

const html = renderToStaticMarkup(
  <ChoiceCards
    labelId="lbl-mode"
    value="lesson"
    onChange={() => {}}
    options={[
      { value: 'classic', label: 'Cổ điển', icon: 'keyCap' },
      { value: 'lesson', label: 'Bài học', icon: 'book' },
      { value: 'timeAttack', label: 'Đua tốc độ', icon: 'stopwatch' },
    ]}
  />,
)

describe('ChoiceCards', () => {
  it('KR-11 is a labelled radiogroup', () => {
    expect(html).toMatch(
      /role="radiogroup"[^>]*aria-labelledby="lbl-mode"|aria-labelledby="lbl-mode"[^>]*role="radiogroup"/,
    )
  })

  it('KR-11 KR-18 one checked radio owns the roving tabindex', () => {
    const radios = html.match(/<button[^>]*role="radio"[^>]*>/g) ?? []
    expect(radios).toHaveLength(3)
    const checked = radios.filter((r) => r.includes('aria-checked="true"'))
    expect(checked).toHaveLength(1)
    expect(checked[0]).toContain('tabindex="0"')
    for (const r of radios.filter((r) => !r.includes('aria-checked="true"'))) {
      expect(r).toContain('tabindex="-1"')
    }
  })

  it('KR-05 KR-08 each card has an icon and the selected one a tick', () => {
    const cards = html.match(/<button[^>]*role="radio"[\s\S]*?<\/button>/g) ?? []
    for (const c of cards) expect(c).toContain('<svg')
    const check = html.match(/class="choice-check"[^>]*>[\s\S]*?<\/span>/)
    expect(check).toBeTruthy()
    expect(check![0]).toContain('<svg')
    expect((html.match(/class="choice-check"/g) ?? []).length).toBe(1)
  })
})

describe('ChoiceCards columns and description', () => {
  it('FX-14 columns 3 and describedBy', () => {
    const out = renderToStaticMarkup(
      <ChoiceCards
        labelId="lbl-fx"
        describedBy="fx-hint"
        columns={3}
        value="some"
        onChange={() => {}}
        options={[
          { value: 'lots', label: 'Nhiều', icon: 'rainbow' },
          { value: 'some', label: 'Vừa', icon: 'sparkle' },
          { value: 'few', label: 'Ít', icon: 'star' },
        ]}
      />,
    )
    const group = out.match(/<div[^>]*role="radiogroup"[^>]*>/)![0]
    expect(group).toContain('choice-cards--3')
    expect(group).toContain('aria-describedby="fx-hint"')
    expect(html).not.toContain('aria-describedby')
  })
})
