import type { AchievementDef, UserRecord, HistoryEntry } from './types'

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_game',
    icon: '🌟',
    nameKey: 'achFirstGame',
    descKey: 'achFirstGameDesc',
    check: (r) => r.totalGames >= 1,
  },
  {
    id: 'games_10',
    icon: '📚',
    nameKey: 'ach10Games',
    descKey: 'ach10GamesDesc',
    check: (r) => r.totalGames >= 10,
  },
  {
    id: 'games_50',
    icon: '📖',
    nameKey: 'ach50Games',
    descKey: 'ach50GamesDesc',
    check: (r) => r.totalGames >= 50,
  },
  {
    id: 'games_100',
    icon: '🏅',
    nameKey: 'ach100Games',
    descKey: 'ach100GamesDesc',
    check: (r) => r.totalGames >= 100,
  },
  {
    id: 'streak_3',
    icon: '🔥',
    nameKey: 'achStreak3',
    descKey: 'achStreak3Desc',
    check: (r) => r.dayStreak >= 3,
  },
  {
    id: 'streak_7',
    icon: '🔥',
    nameKey: 'achStreak7',
    descKey: 'achStreak7Desc',
    check: (r) => r.dayStreak >= 7,
  },
  {
    id: 'streak_30',
    icon: '🌋',
    nameKey: 'achStreak30',
    descKey: 'achStreak30Desc',
    check: (r) => r.dayStreak >= 30,
  },
  {
    id: 'wpm_20',
    icon: '💨',
    nameKey: 'achWpm20',
    descKey: 'achWpm20Desc',
    check: (r) => Math.max(r.bestWpm.easy ?? 0, r.bestWpm.medium ?? 0, r.bestWpm.hard ?? 0) >= 20,
  },
  {
    id: 'wpm_40',
    icon: '💨',
    nameKey: 'achWpm40',
    descKey: 'achWpm40Desc',
    check: (r) => Math.max(r.bestWpm.easy ?? 0, r.bestWpm.medium ?? 0, r.bestWpm.hard ?? 0) >= 40,
  },
  {
    id: 'wpm_60',
    icon: '🚀',
    nameKey: 'achWpm60',
    descKey: 'achWpm60Desc',
    check: (r) => Math.max(r.bestWpm.easy ?? 0, r.bestWpm.medium ?? 0, r.bestWpm.hard ?? 0) >= 60,
  },
  {
    id: 'wpm_80',
    icon: '🚀',
    nameKey: 'achWpm80',
    descKey: 'achWpm80Desc',
    check: (r) => Math.max(r.bestWpm.easy ?? 0, r.bestWpm.medium ?? 0, r.bestWpm.hard ?? 0) >= 80,
  },
  {
    id: 'wpm_100',
    icon: '⚡',
    nameKey: 'achWpm100',
    descKey: 'achWpm100Desc',
    check: (r) => Math.max(r.bestWpm.easy ?? 0, r.bestWpm.medium ?? 0, r.bestWpm.hard ?? 0) >= 100,
  },
  {
    id: 'perfect',
    icon: '🎯',
    nameKey: 'achPerfect',
    descKey: 'achPerfectDesc',
    check: (_r, h) => h.some(g => g.accuracy === 100),
  },
  {
    id: 'three_star_all',
    icon: '🏆',
    nameKey: 'ach3StarAll',
    descKey: 'ach3StarAllDesc',
    check: (_r, h) => {
      const levels = ['easy', 'medium', 'hard'] as const
      return levels.every(l => h.some(g => g.level === l && g.stars === 3))
    },
  },
  {
    id: 'combo_50',
    icon: '🦸',
    nameKey: 'achCombo50',
    descKey: 'achCombo50Desc',
    check: (_r, h) => h.some(g => (g.maxCombo ?? 0) >= 50),
  },
  {
    id: 'cps_5',
    icon: '⚡',
    nameKey: 'achCps5',
    descKey: 'achCps5Desc',
    check: (_r, h) => h.some(g => Number(g.cps) >= 5),
  },
]

export function checkAchievements(
  records: UserRecord,
  history: HistoryEntry[],
  unlockedIds: string[],
): string[] {
  const newUnlocks: string[] = []
  for (const ach of ACHIEVEMENTS) {
    if (unlockedIds.includes(ach.id)) continue
    if (ach.check(records, history)) {
      newUnlocks.push(ach.id)
    }
  }
  return newUnlocks
}
