import { describe, expect, it } from 'vitest'
import { vi as viDict, en as enDict, tReplace } from '@typing-adventure/i18n'
import { COMBO_MILESTONES } from '@typing-adventure/game-engine'

const NEW_KEYS = [
  'comboPraise5',
  'comboPraise10',
  'comboPraise20',
  'comboPraise50',
  'comboAnnounce',
  'starsLabel',
  'livesLabel',
  'gamesNew',
  'loadingText',
]

const dicts: Record<'vi' | 'en', Record<string, string>> = { vi: viDict, en: enDict }

describe('KR i18n', () => {
  it('KR-22 new keys exist and are non-empty in vi and en', () => {
    for (const lang of ['vi', 'en'] as const) {
      for (const key of NEW_KEYS) {
        expect(typeof dicts[lang][key], `${lang}.${key}`).toBe('string')
        expect(dicts[lang][key].trim().length, `${lang}.${key}`).toBeGreaterThan(0)
      }
    }
  })

  it('KR-09 KR-22 every combo milestone has a praise key', () => {
    for (const m of COMBO_MILESTONES) {
      expect(dicts.vi[`comboPraise${m}`]).toBeTruthy()
      expect(dicts.en[`comboPraise${m}`]).toBeTruthy()
    }
  })

  it('KR-09 KR-22 comboAnnounce replaces both placeholders', () => {
    for (const lang of ['vi', 'en'] as const) {
      const s = tReplace(lang, 'comboAnnounce' as never, 10, 'x')
      expect(s).toContain('10')
      expect(s).toContain('x')
      expect(s).not.toMatch(/\{\d\}/)
    }
  })

  it('KR-22 starsLabel and livesLabel contain {0}', () => {
    for (const lang of ['vi', 'en'] as const) {
      expect(dicts[lang].starsLabel).toContain('{0}')
      expect(dicts[lang].livesLabel).toContain('{0}')
    }
  })

  it('KR-22 Vietnamese praise has diacritics', () => {
    expect(dicts.vi.comboPraise10).toMatch(/[À-ỹ]/)
  })

  it('KR-13 KR-11 existing mode/level/lesson labels stay unchanged', () => {
    expect(viDict.modeClassic).toBe('🎮 Cổ điển')
    expect(viDict.modeLesson).toBe('🎒 Bài học')
    expect(viDict.modeTimeAttack).toBe('⚡ Đua tốc độ')
    expect(viDict.modeChallenge).toBe('🐉 Thử thách')
    expect(viDict.lessonAll).toBe('🌈 Tất cả')
    expect(viDict.lvEasy).toBe('🐣 Dễ')
    expect(viDict.lvMedium).toBe('🐥 Vừa')
    expect(viDict.lvHard).toBe('🦅 Khó')
    expect(enDict.modeClassic).toBe('🎮 Classic')
    expect(enDict.modeLesson).toBe('🎒 Lesson')
    expect(enDict.modeTimeAttack).toBe('⚡ Time Attack')
    expect(enDict.modeChallenge).toBe('🐉 Challenge')
    expect(enDict.lessonAll).toBe('🌈 All')
    expect(enDict.lvEasy).toBe('🐣 Easy')
    expect(enDict.lvMedium).toBe('🐥 Medium')
    expect(enDict.lvHard).toBe('🦅 Hard')
  })
})
