// Types
export type {
  Level,
  SoundMode,
  GameMode,
  KeyboardCase,
  Theme,
  SpeechRate,
  Lang,
  Finger,
  KeyDef,
  WordBoundary,
  GameState,
  GameResult,
  Settings,
  UserRecord,
  HistoryEntry,
  AchievementDef,
  LessonDef,
  KeypressResult,
} from './types'

// Words
export {
  WORDS,
  LESSONS,
  pickWords,
  generateLessonWords,
  generateChallengeWords,
} from './words'

// Scoring
export {
  SCORE_PER_CHAR,
  COMBO_MILESTONES,
  STAR_THRESHOLDS,
  getComboMultiplier,
  getAccuracyBonus,
  calculateCharScore,
  calculateFinalScore,
  calculateStars,
} from './scoring'

// Achievements
export { ACHIEVEMENTS, checkAchievements } from './achievements'

// Keyboard
export {
  KEYBOARD_ROWS,
  KEY_FINGER_MAP,
  getFingerForKey,
} from './keyboard'

// Engine
export {
  CHALLENGE_LIVES,
  CHALLENGE_MISTAKES_PER_LIFE,
  createInitialState,
  createStateFromCustomText,
  computeWordBoundaries,
  processKeypress,
  isComboMilestone,
  calculateResult,
  formatTime,
} from './engine'
