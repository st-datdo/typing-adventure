import { describe, it, expect } from 'vitest'
import { EMPTY_PET, PET_STAGES, choosePet, daysToNextStage, feedPet, getPetStage } from '../pet'

describe('choosePet', () => {
  it('sets the kind once and never replaces it', () => {
    const pet = choosePet(EMPTY_PET, 'kitty')
    expect(pet.kind).toBe('kitty')
    expect(choosePet(pet, 'dino').kind).toBe('kitty')
  })
})

describe('feedPet', () => {
  it('does nothing before a pet is chosen', () => {
    const r = feedPet(EMPTY_PET, '2026-10-24')
    expect(r.pet).toBe(EMPTY_PET)
    expect(r.grew).toBe(false)
  })

  it('grows at most once per day', () => {
    const pet = choosePet(EMPTY_PET, 'puppy')
    const first = feedPet(pet, '2026-10-24')
    expect(first.pet.days).toBe(1)
    expect(first.hatched).toBe(true)
    expect(first.grew).toBe(true)
    const again = feedPet(first.pet, '2026-10-24')
    expect(again.pet.days).toBe(1)
    expect(again.grew).toBe(false)
  })

  it('never shrinks after days without play', () => {
    let pet = choosePet(EMPTY_PET, 'dino')
    pet = feedPet(pet, '2026-10-01').pet
    pet = feedPet(pet, '2026-10-02').pet
    const later = feedPet(pet, '2026-12-25')
    expect(later.pet.days).toBe(3)
    expect(later.hatched).toBe(false)
  })

  it('reports growth only when a new stage is reached', () => {
    const pet = { kind: 'kitty' as const, days: 1, lastDay: '2026-10-01' }
    expect(feedPet(pet, '2026-10-02').grew).toBe(false)
    expect(feedPet({ ...pet, days: 2 }, '2026-10-03').grew).toBe(true)
  })
})

describe('getPetStage', () => {
  it('is an egg at day 0 and hatched from day 1', () => {
    expect(getPetStage(0).hatched).toBe(false)
    expect(getPetStage(1).hatched).toBe(true)
  })

  it('stays at the last stage forever', () => {
    const last = PET_STAGES[PET_STAGES.length - 1]
    expect(getPetStage(last.minDays + 500)).toBe(last)
    expect(daysToNextStage(last.minDays)).toBeNull()
  })

  it('stages grow monotonically after hatching', () => {
    const hatched = PET_STAGES.filter(s => s.hatched)
    for (let i = 1; i < hatched.length; i++) {
      expect(hatched[i].minDays).toBeGreaterThan(hatched[i - 1].minDays)
      expect(hatched[i].scale).toBeGreaterThanOrEqual(hatched[i - 1].scale)
    }
  })

  it('counts days to the next stage', () => {
    expect(daysToNextStage(0)).toBe(1)
    expect(daysToNextStage(1)).toBe(2)
  })
})
