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
  AgeGroup,
  AgeProfile,
  LetterCard,
  PictureWord,
  LittleItem,
  LittleSession,
  LetterProgress,
  DailyPlay,
  Sticker,
  PetKind,
  PetState,
  PetStage,
  IslandId,
  Island,
  IslandStatus,
  IslandView,
  MiniGameId,
  LittleSaved,
  GamesSaved,
  ChildProgress,
} from './types'

export {
  PET_KINDS,
  PET_EMOJI,
  PET_STAGES,
  EMPTY_PET,
  choosePet,
  getPetStage,
  daysToNextStage,
  feedPet,
} from './pet'

export {
  ISLANDS,
  getIslandViews,
  countDoneIslands,
  getCurrentIsland,
  newlyReachedIsland,
} from './islands'

export {
  emptyChildProgress,
  normalizeChildProgress,
  mergeChildProgress,
  sameChildProgress,
} from './child-progress'

export type { Balloon, BalloonGameState } from './balloon-game'
export {
  BALLOON_TARGET,
  BALLOON_COLORS,
  BALLOON_SPAWN_MS,
  createBalloonGame,
  tickBalloons,
  popBalloon,
  balloonStars,
  balloonCapacity,
  balloonSpeed,
} from './balloon-game'

export type { PictureGameState, PictureOutcome } from './picture-game'
export {
  KID_PICTURE_WORDS,
  PICTURE_ROUND_SIZE,
  PICTURE_HINT_IDLE_MS,
  createPictureGame,
  getPictureWord,
  pictureKeypress,
  shouldShowPictureHint,
  pictureStars,
} from './picture-game'

export { AGE_PROFILES, isModeAllowed } from './age'

export {
  LETTER_ORDER,
  LETTER_CARDS,
  PICTURE_WORDS,
  STICKERS,
  MASTERY_FIRST_TRY,
  STAGE_COUNT,
  ITEMS_PER_STAGE,
  HINT_LEVEL_1_MS,
  HINT_LEVEL_2_MS,
  DEFAULT_DAILY_LIMIT,
  MIN_DAILY_LIMIT,
  MAX_DAILY_LIMIT,
  PRAISE_COUNT,
} from './little-content'

export { buildLittleSession, getMasteredLetters, getLearningLetters } from './little-session'

export type { LittleOutcome, LittleState } from './little-state'
export {
  createLittleState,
  littleKeypress,
  getCurrentItem,
  getExpectedChar,
  getHintLevel,
  canStartLittleSession,
  markLittleSessionStarted,
  grantBonusSession,
  sessionsLeftToday,
  nextSticker,
  pickPraiseIndex,
  clampDailyLimit,
} from './little-state'

// Words
export {
  WORDS,
  LESSONS,
  pickWords,
  pickWordsFromPool,
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

export { MAX_WPM, checkSessionPlausibility } from './plausibility'
export type { SessionClaim } from './plausibility'

// Achievements
export { ACHIEVEMENTS, checkAchievements } from './achievements'

// Keyboard
export { KEYBOARD_ROWS, KEY_FINGER_MAP, getFingerForKey } from './keyboard'

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

export type { ModerationReason, ModerationRejection, ModerationResult } from './moderation'
export { moderateWords, DEFAULT_BLOCKLIST, MAX_WORD_LENGTH } from './moderation'
