export type Level = 'easy' | 'medium' | 'hard'
export type SoundMode = 'default' | 'character' | 'word'
export type GameMode = 'classic' | 'lesson' | 'timeAttack' | 'challenge'
export type KeyboardCase = 'lower' | 'upper'
export type Theme = 'dark' | 'light' | 'colorful'
export type SpeechRate = 'slow' | 'normal' | 'fast'
export type Lang = 'vi' | 'en'
export type AgeGroup = 'little' | 'kid' | 'big'

export interface AgeProfile {
  allowedModes: GameMode[]
  showSpeedStats: boolean
  social: boolean
}

export interface LetterCard {
  letter: string
  word: string
  emoji: string
}

export interface PictureWord {
  word: string
  emoji: string
}

export type LittleItem =
  | { kind: 'letter'; target: string; card: LetterCard }
  | { kind: 'word'; target: string; picture: PictureWord }

export interface LittleSession {
  stages: LittleItem[][]
}

export type LetterProgress = Record<string, { seen: number; firstTry: number }>

export interface DailyPlay {
  date: string
  sessions: number
  bonus: number
}

export interface Sticker {
  emoji: string
  name: string
}

export type PetKind = 'kitty' | 'puppy' | 'dino'

export interface PetState {
  kind: PetKind | null
  days: number
  lastDay: string
}

export interface PetStage {
  index: number
  minDays: number
  hatched: boolean
  scale: number
  accessory: string | null
}

export type IslandId = 'sun' | 'forest' | 'candy' | 'whale' | 'star'

export interface Island {
  id: IslandId
  emoji: string
  letters: string[]
}

export type IslandStatus = 'done' | 'current' | 'locked'

export interface IslandView {
  island: Island
  mastered: string[]
  status: IslandStatus
}

export type MiniGameId = 'balloon' | 'picture'

export interface LittleSaved {
  progress: LetterProgress
  stickers: string[]
  daily: DailyPlay
  dailyLimit: number
  pet: PetState
}

export interface GamesSaved {
  best: Partial<Record<MiniGameId, number>>
  plays: Partial<Record<MiniGameId, number>>
}

export interface ChildProgress {
  little: LittleSaved
  games: GamesSaved
  updatedAt: number
}

export type Finger =
  | 'left-pinky'
  | 'left-ring'
  | 'left-middle'
  | 'left-index'
  | 'right-index'
  | 'right-middle'
  | 'right-ring'
  | 'right-pinky'
  | 'thumb'

export interface KeyDef {
  key: string
  finger: Finger
  label?: string
  cls?: string
}

export interface WordBoundary {
  word: string
  startIndex: number
  endIndex: number
}

export interface GameState {
  text: string
  currentIndex: number
  startTime: number | null
  totalKeystrokes: number
  correctKeystrokes: number
  isFinished: boolean
  level: Level
  soundMode: SoundMode
  gameMode: GameMode
  wordBoundaries: WordBoundary[]
  combo: number
  maxCombo: number
  score: number
  mistakeMap: Record<string, number>
  lives: number
  challengeMistakes: number
  wordsCompleted: number
  timeAttackDuration: number
  timeRemaining: number
  lessonIndex: number
}

export interface GameResult {
  wpm: number
  cps: number
  accuracy: number
  score: number
  stars: number
  timeSeconds: number
  wordCount: number
  maxCombo: number
  mistakeMap: Record<string, number>
}

export interface Settings {
  keyboardCase: KeyboardCase
  level: Level
  soundMode: SoundMode
  soundEnabled: boolean
  speechRate: SpeechRate
  wordCount: number
  fingerGuide: boolean
  theme: Theme
  lang: Lang
  ageGroup: AgeGroup | null
}

export interface UserRecord {
  bestWpm: Record<Level, number>
  bestAccuracy: Record<Level, number>
  bestScore: Record<Level, number>
  totalGames: number
  totalWords: number
  dayStreak: number
  lastPlayDate: string | null
}

export interface HistoryEntry {
  date: string
  level: Level
  wpm: number
  cps: number
  accuracy: number
  time: number
  wordCount: number
  score: number
  stars: number
  maxCombo: number
}

export interface AchievementDef {
  id: string
  icon: string
  nameKey: string
  descKey: string
  check: (records: UserRecord, history: HistoryEntry[]) => boolean
}

export interface LessonDef {
  name: string
  chars: string
}

export interface KeypressResult {
  newState: GameState
  isCorrect: boolean
  completedWord: string | null
}
