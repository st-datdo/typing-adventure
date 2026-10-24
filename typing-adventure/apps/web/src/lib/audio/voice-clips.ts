import { t, tReplace } from '@typing-adventure/i18n'
import type { TranslationKey } from '@typing-adventure/i18n'
import {
  BALLOON_TARGET,
  KID_PICTURE_WORDS,
  LETTER_CARDS,
  LETTER_ORDER,
  PICTURE_ROUND_SIZE,
  PICTURE_WORDS,
  STICKERS,
} from '@typing-adventure/game-engine'
import type { Lang } from '@typing-adventure/game-engine'

export interface VoiceClip {
  lang: Lang
  id: string
  text: string
}

export const VOICE_LINE_KEYS = [
  'littleHello',
  'littleFindLetter',
  'littleTypeWord',
  'littleSleep',
  'littleNewSticker',
  'praise0',
  'praise1',
  'praise2',
  'praise3',
  'praise4',
  'praise5',
  'petChoose',
  'petEggPicked',
  'petHatched',
  'petGrew',
  'petHappy',
  'petKitty',
  'petPuppy',
  'petDino',
  'islandSun',
  'islandForest',
  'islandCandy',
  'islandWhale',
  'islandStar',
  'islandNew',
  'islandAllDone',
  'gameBalloonIntro',
  'gamePictureIntro',
  'gameNewBest',
] as const satisfies readonly TranslationKey[]

export type VoiceLineKey = (typeof VOICE_LINE_KEYS)[number]

const DONE_MAX = 20
const LANGS: Lang[] = ['vi', 'en']

function slug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function letterClip(letter: string): string {
  return `letter-${letter}`
}

export function cardClip(letter: string): string {
  return `card-${letter}`
}

export function wordClip(word: string): string {
  return `word-${slug(word)}`
}

export function doneClip(found: number): string {
  return `littleDone-${found}`
}

export function balloonResultClip(popped: number): string {
  return `gameBalloonResult-${popped}`
}

export function pictureResultClip(firstTry: number, total: number): string {
  return `gamePictureResult-${firstTry}-${total}`
}

export function cardText(letter: string): string {
  const upper = letter.toUpperCase()
  return `${upper}! ${upper} for ${LETTER_CARDS[letter].word}.`
}

export function listVoiceClips(): VoiceClip[] {
  const out: VoiceClip[] = []
  for (const letter of LETTER_ORDER) {
    out.push({ lang: 'en', id: letterClip(letter), text: letter.toUpperCase() })
    out.push({ lang: 'en', id: cardClip(letter), text: cardText(letter) })
  }
  const words = new Set<string>([
    ...PICTURE_WORDS.map(p => p.word),
    ...KID_PICTURE_WORDS.map(p => p.word),
    ...STICKERS.map(s => s.name),
  ])
  for (const word of [...words].sort()) out.push({ lang: 'en', id: wordClip(word), text: word })
  for (const lang of LANGS) {
    for (const key of VOICE_LINE_KEYS) out.push({ lang, id: key, text: t(lang, key) })
    for (let n = 1; n <= DONE_MAX; n++) out.push({ lang, id: doneClip(n), text: tReplace(lang, 'littleDone', n) })
    out.push({ lang, id: balloonResultClip(BALLOON_TARGET), text: tReplace(lang, 'gameBalloonResult', BALLOON_TARGET) })
    for (let k = 0; k <= PICTURE_ROUND_SIZE; k++) {
      out.push({
        lang,
        id: pictureResultClip(k, PICTURE_ROUND_SIZE),
        text: tReplace(lang, 'gamePictureResult', k, PICTURE_ROUND_SIZE),
      })
    }
  }
  return out
}
