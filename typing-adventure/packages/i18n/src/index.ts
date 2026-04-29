import { vi } from './vi'
import { en } from './en'
import type { Lang } from '@typing-adventure/game-engine'

export { vi, en }

export type TranslationKey = keyof typeof vi

const translations: Record<Lang, Record<TranslationKey, string>> = { vi, en }

export function t(lang: Lang, key: TranslationKey): string {
  return translations[lang]?.[key] ?? translations.vi[key] ?? key
}

export function tReplace(lang: Lang, key: TranslationKey, ...args: (string | number)[]): string {
  let str = t(lang, key)
  args.forEach((val, i) => {
    str = str.replace(`{${i}}`, String(val))
  })
  return str
}
