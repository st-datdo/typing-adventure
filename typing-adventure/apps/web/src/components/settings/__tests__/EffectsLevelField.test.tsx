import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { vi as viDict, en as enDict } from '@typing-adventure/i18n'
import { EffectsLevelFieldView } from '../EffectsLevelField'

const render = (p: Partial<Parameters<typeof EffectsLevelFieldView>[0]> = {}) =>
  renderToStaticMarkup(
    <EffectsLevelFieldView lang="vi" value="lots" reduced={false} onChange={() => {}} {...p} />,
  )

const radios = (html: string) => html.match(/<button[^>]*role="radio"[\s\S]*?<\/button>/g) ?? []

describe('EffectsLevelField', () => {
  it('FX-14 vi labels', () => {
    const html = render()
    expect(html).toContain('Hiệu ứng')
    expect(html).toContain(viDict.fxDesc)
    const r = radios(html)
    expect(r).toHaveLength(3)
    expect(r[0]).toContain('Nhiều')
    expect(r[1]).toContain('Vừa')
    expect(r[2]).toContain('Ít')
    expect(r[0]).toContain('aria-checked="true"')
    expect(html).toContain(viDict.fxLotsHint)
    expect(html).toContain('choice-cards--3')
  })

  it('FX-14 en labels', () => {
    const html = render({ lang: 'en' })
    expect(html).toContain('Effects')
    const r = radios(html)
    expect(r[0]).toContain('Lots')
    expect(r[1]).toContain('Some')
    expect(r[2]).toContain('Few')
    expect(html).toContain(enDict.fxLotsHint)
  })

  it('FX-15 reduced note', () => {
    const on = render({ reduced: true })
    const note = on.match(/<div[^>]*role="note"[^>]*>([\s\S]*?)<\/div>/)
    expect(note).toBeTruthy()
    expect(note![1]).toContain(viDict.fxReducedNote)
    expect(render()).not.toContain('role="note"')
  })

  it('FX-14 hint follows value and is referenced by the radiogroup', () => {
    const html = render({ value: 'few' })
    expect(html).toContain(viDict.fxFewHint)
    expect(html).not.toContain(viDict.fxLotsHint)
    const group = html.match(/<div[^>]*role="radiogroup"[^>]*>/)![0]
    const ref = group.match(/aria-describedby="([^"]+)"/)![1]
    const ids = ref.split(' ')
    const hint = html.match(new RegExp(`id="${ids[ids.length - 1]}"[^>]*>([^<]*)<`))
    expect(hint).toBeTruthy()
    expect(hint![1]).toBe(viDict.fxFewHint)
    expect(html).toMatch(/aria-live="polite"/)
    expect(radios(html)[2]).toContain('aria-checked="true"')
  })
})
