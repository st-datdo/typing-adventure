import type { PetKind, PetStage, PetState } from './types'

export const PET_KINDS: PetKind[] = ['kitty', 'puppy', 'dino']

export const PET_EMOJI: Record<PetKind, string> = {
  kitty: '🐱',
  puppy: '🐶',
  dino: '🦕',
}

export const PET_STAGES: PetStage[] = [
  { index: 0, minDays: 0, hatched: false, scale: 0.8, accessory: null },
  { index: 1, minDays: 1, hatched: true, scale: 0.6, accessory: null },
  { index: 2, minDays: 3, hatched: true, scale: 0.7, accessory: null },
  { index: 3, minDays: 5, hatched: true, scale: 0.8, accessory: '🎀' },
  { index: 4, minDays: 8, hatched: true, scale: 0.9, accessory: '🎀' },
  { index: 5, minDays: 12, hatched: true, scale: 1, accessory: '🎩' },
  { index: 6, minDays: 17, hatched: true, scale: 1.1, accessory: '🎩' },
  { index: 7, minDays: 23, hatched: true, scale: 1.2, accessory: '👑' },
  { index: 8, minDays: 30, hatched: true, scale: 1.3, accessory: '👑' },
]

export const EMPTY_PET: PetState = { kind: null, days: 0, lastDay: '' }

export function choosePet(pet: PetState, kind: PetKind): PetState {
  if (pet.kind !== null) return pet
  return { ...pet, kind }
}

export function getPetStage(days: number): PetStage {
  let stage = PET_STAGES[0]
  for (const s of PET_STAGES) {
    if (days >= s.minDays) stage = s
  }
  return stage
}

export function daysToNextStage(days: number): number | null {
  const next = PET_STAGES.find(s => s.minDays > days)
  return next ? next.minDays - days : null
}

export function feedPet(pet: PetState, today: string): { pet: PetState; grew: boolean; hatched: boolean } {
  if (pet.kind === null || pet.lastDay === today) return { pet, grew: false, hatched: false }
  const next = { ...pet, days: pet.days + 1, lastDay: today }
  const before = getPetStage(pet.days)
  const after = getPetStage(next.days)
  return { pet: next, grew: after.index > before.index, hatched: !before.hatched && after.hatched }
}
