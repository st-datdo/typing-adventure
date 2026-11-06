import { describe, expect, it } from 'vitest'
import { FX_TTL, INITIAL_FX, fxStep, slotTtl, type FxEvent, type FxState } from '../fx/director'
import type { EffectsLevel } from '../fx/levels'
import { mulberry32 } from '../fx/rng'
import { LABEL_STYLES, OWL_ENCOURAGE_KEYS, OWL_PRAISE_KEYS, PRAISE_KEYS } from '../fx/pools'

const TEXT = 'asdf jkl '.repeat(200)
const ONE_SHOTS = [
  'pop',
  'sparks',
  'word',
  'label',
  'confetti',
  'runner',
  'rain',
  'fireworks',
  'evolve',
  'bubble',
] as const

function sim(level: EffectsLevel = 'lots', seed = 7) {
  const rng = mulberry32(seed)
  let state = fxStep(INITIAL_FX, { type: 'level', value: level }, rng)
  let combo = 0
  let index = 0
  let now = 0
  const step = (correct: boolean, dt = 200) => {
    now += dt
    const char = TEXT[index]
    let word: [number, number] | null = null
    if (correct) {
      combo++
      const next = TEXT[index + 1]
      if (char !== ' ' && (next === ' ' || next === undefined)) {
        let s = index
        while (s > 0 && TEXT[s - 1] !== ' ') s--
        word = [s, index + 1]
      }
    } else combo = 0
    state = fxStep(state, { type: 'key', correct, combo, index, char, word, now }, rng)
    if (correct) index++
    return state
  }
  const send = (e: FxEvent) => (state = fxStep(state, e, rng))
  const expire = (slot: (typeof ONE_SHOTS)[number] | 'owl') => {
    const s = state[slot] as { id: number } | null
    if (s) send({ type: 'expire', slot, id: s.id })
  }
  return { step, send, expire, get: () => state, combo: () => combo }
}

const ids = (s: FxState) => ONE_SHOTS.map((k) => (s[k] as { id: number } | null)?.id ?? null)

describe('FX director', () => {
  it('FX-02 label once per tier', () => {
    const s = sim()
    const changes: number[] = []
    let last: number | null = null
    for (let c = 1; c <= 100; c++) {
      const st = s.step(true)
      const id = st.label?.id ?? null
      if (id !== last && id !== null) changes.push(c)
      if (c === 3) expect(st.label).toBeNull()
      last = id
    }
    expect(changes).toEqual([5, 10, 15, 20, 30, 40, 50, 75, 100])
  })

  it('FX-02 restart after miss', () => {
    const s = sim()
    for (let i = 0; i < 12; i++) s.step(true)
    const before = s.get().label!.id
    s.step(false)
    for (let i = 0; i < 4; i++) s.step(true)
    expect(s.get().label!.id).toBe(before)
    s.step(true)
    expect(s.combo()).toBe(5)
    expect(s.get().label!.tier).toBe(5)
    expect(s.get().label!.id).toBeGreaterThan(before)
  })

  it('FX-03 single label replaced at the next tier', () => {
    const s = sim()
    for (let i = 0; i < 10; i++) s.step(true)
    const st = s.get()
    expect(st.label!.tier).toBe(10)
    expect(Object.keys(st).filter((k) => k === 'label')).toHaveLength(1)
  })

  it('FX-03 expire with an old id keeps the newer label', () => {
    const s = sim()
    for (let i = 0; i < 5; i++) s.step(true)
    const old = s.get().label!.id
    for (let i = 0; i < 5; i++) s.step(true)
    s.send({ type: 'expire', slot: 'label', id: old })
    expect(s.get().label!.tier).toBe(10)
    s.expire('label')
    expect(s.get().label).toBeNull()
  })

  it('FX-05 praise no immediate repeat', () => {
    const s = sim()
    const seen: string[] = []
    for (let r = 0; r < 5; r++) {
      for (let i = 0; i < 5; i++) s.step(true)
      seen.push(s.get().label!.praise)
      s.step(false)
    }
    expect(seen).toHaveLength(5)
    expect(new Set(seen).size).toBe(5)
    for (const p of seen) expect(PRAISE_KEYS).toContain(p)
  })

  it('FX-05 param variety at the same tier', () => {
    const s = sim()
    const params = new Set<string>()
    for (let r = 0; r < 10; r++) {
      for (let i = 0; i < 10; i++) s.step(true)
      const l = s.get().label!
      params.add(`${l.tilt}|${l.rise}`)
      expect(Math.abs(l.tilt)).toBeLessThanOrEqual(4)
      expect(l.rise).toBeGreaterThanOrEqual(28)
      expect(l.rise).toBeLessThanOrEqual(36)
      expect(LABEL_STYLES).toContain(l.style)
      s.step(false)
    }
    expect(params.size).toBeGreaterThanOrEqual(2)
  })

  it('FX-07 pop kind never repeats back to back; few has no pop', () => {
    const s = sim()
    const kinds: string[] = []
    for (let i = 0; i < 20; i++) {
      const st = s.step(true)
      expect(st.pop!.index).toBe(i)
      kinds.push(st.pop!.kind)
    }
    for (let i = 1; i < kinds.length; i++) expect(kinds[i]).not.toBe(kinds[i - 1])
    expect(new Set(kinds).size).toBeGreaterThanOrEqual(4)
    const few = sim('few')
    for (let i = 0; i < 5; i++) expect(few.step(true).pop).toBeNull()
  })

  it('FX-08 sparks only at lots and never for space', () => {
    const s = sim()
    for (let i = 0; i < 9; i++) {
      const prev = s.get().sparks?.id ?? null
      const char = TEXT[i]
      const st = s.step(true)
      if (char === ' ') {
        expect(st.sparks?.id ?? null).toBe(prev)
      } else {
        expect(st.sparks!.count).toBeGreaterThanOrEqual(3)
        expect(st.sparks!.count).toBeLessThanOrEqual(5)
        expect(st.sparks!.index).toBe(i)
        expect(st.sparks!.shapes.length).toBeGreaterThanOrEqual(1)
      }
    }
    for (const lvl of ['some', 'few'] as const) {
      const o = sim(lvl)
      for (let i = 0; i < 6; i++) expect(o.step(true).sparks).toBeNull()
    }
  })

  it('FX-10 word fx only on word completion, never on the trailing space', () => {
    const s = sim()
    const kinds: string[] = []
    for (let i = 0; i < 60; i++) {
      const prev = s.get().word?.id ?? null
      const st = s.step(true)
      const fired = (st.word?.id ?? null) !== prev
      const char = TEXT[i]
      const completes = char !== ' ' && TEXT[i + 1] === ' '
      expect(fired, `i=${i}`).toBe(completes)
      if (fired) {
        kinds.push(st.word!.kind)
        expect(st.word!.range[1]).toBe(i + 1)
      }
    }
    for (let i = 1; i < kinds.length; i++) expect(kinds[i]).not.toBe(kinds[i - 1])
    const few = sim('few')
    for (let i = 0; i < 20; i++) expect(few.step(true).word).toBeNull()
  })

  it('FX-11 owl praise about 1 in 6 words, none with a live label or at few', () => {
    const run = (level: EffectsLevel) => {
      const rng = mulberry32(42)
      let st = fxStep(INITIAL_FX, { type: 'level', value: level }, rng)
      let count = 0
      const praises: string[] = []
      for (let i = 0; i < 600; i++) {
        const prev = st.bubble?.id ?? null
        st = fxStep(
          st,
          {
            type: 'key',
            correct: true,
            combo: 1,
            index: 3,
            char: 'f',
            word: [0, 4],
            now: i * 2000,
          },
          rng,
        )
        if (st.bubble && st.bubble.id !== prev && st.bubble.kind === 'praise') {
          count++
          praises.push(st.bubble.text)
          expect(st.owl.mood).toBe('happy')
          st = fxStep(st, { type: 'expire', slot: 'bubble', id: st.bubble.id }, rng)
        }
      }
      return { count, praises }
    }
    const lots = run('lots')
    expect(lots.count).toBeGreaterThanOrEqual(70)
    expect(lots.count).toBeLessThanOrEqual(130)
    for (let i = 0; i < lots.praises.length; i++) {
      expect(OWL_PRAISE_KEYS).toContain(lots.praises[i])
      expect(lots.praises.slice(Math.max(0, i - 5), i)).not.toContain(lots.praises[i])
    }
    expect(run('few').count).toBe(0)

    const s = sim()
    for (let i = 0; i < 5; i++) s.step(true)
    expect(s.get().label).not.toBeNull()
    for (let i = 0; i < 200; i++) {
      s.step(true)
      if (s.get().label === null) break
      expect(s.get().bubble?.kind ?? null).not.toBe('praise')
      if (s.combo() >= 9) break
    }
  })

  it('FX-12 owl events', () => {
    const s = sim()
    for (let i = 0; i < 5; i++) s.step(true)
    expect(s.get().owl.mood).toBe('cheer')
    s.expire('owl')
    s.expire('label')
    expect(s.get().owl.mood).toBe('idle')
    s.step(false)
    expect(s.get().owl.mood).toBe('thinking')
    s.step(false)
    s.step(false)
    expect(s.get().owl.mood).toBe('encourage')
    expect(s.get().bubble!.kind).toBe('encourage')
    expect(OWL_ENCOURAGE_KEYS).toContain(s.get().bubble!.text)
    s.expire('owl')
    s.send({ type: 'idle', mood: 'wave' })
    expect(s.get().owl.mood).toBe('wave')
    s.send({ type: 'idle', mood: 'sleep' })
    expect(s.get().owl.mood).toBe('sleep')
    s.step(true)
    expect(s.get().owl.mood).toBe('happy')
    expect(slotTtl(s.get(), 'owl')).toBe(800)
    s.send({ type: 'idle', mood: 'wave' })
    s.step(true)
    expect(s.get().owl.mood).not.toBe('wave')
    const moods = new Set<string>()
    const r = sim()
    for (let i = 0; i < 80; i++) moods.add(r.step(i % 4 !== 3).owl.mood)
    expect(moods.has('sad')).toBe(false)
  })

  it('FX-13 miss with combo >= 3 smokes and drops held state', () => {
    const s = sim()
    for (let i = 0; i < 31; i++) s.step(true)
    const st = s.get()
    expect(st.sky).not.toBeNull()
    expect(st.accessory).not.toBeNull()
    expect(st.superMode).not.toBeNull()
    const before = ids(st)
    const smoke = st.meter.smokeId
    const after = s.step(false)
    expect(after.meter.smokeId).toBe(smoke + 1)
    expect(after.sky).toBeNull()
    expect(after.accessory).toBeNull()
    expect(after.superMode).toBeNull()
    expect(ids(after)).toEqual(before)

    const low = sim()
    low.step(true)
    low.step(true)
    const sm = low.get().meter.smokeId
    expect(low.step(false).meter.smokeId).toBe(sm)
  })

  it('FX-04 held state and per-level materials', () => {
    const s = sim()
    for (let i = 0; i < 20; i++) s.step(true)
    expect(s.get().sky).not.toBeNull()
    expect(s.get().accessory).not.toBeNull()
    for (let i = 0; i < 10; i++) s.step(true)
    expect(s.get().superMode).not.toBeNull()
    for (let i = 0; i < 20; i++) s.step(true)
    expect(s.get().evolve).not.toBeNull()
    expect(s.get().accessory).not.toBeNull()

    const lots = sim()
    const seen: Record<string, number> = {}
    for (let c = 1; c <= 100; c++) {
      const prev = ids(lots.get())
      const st = lots.step(true, 400)
      ONE_SHOTS.forEach((k, i) => {
        if (ids(st)[i] !== prev[i] && ids(st)[i] !== null) seen[`${k}@${c}`] = 1
      })
    }
    expect(seen['confetti@10']).toBe(1)
    expect(seen['runner@15']).toBe(1)
    expect(seen['rain@40']).toBe(1)
    expect(seen['evolve@50']).toBe(1)
    expect(seen['fireworks@75']).toBe(1)
    expect(seen['fireworks@100']).toBe(1)

    const some = sim('some')
    for (let c = 1; c <= 100; c++) {
      const st = some.step(true, 400)
      expect(st.runner).toBeNull()
      expect(st.rain).toBeNull()
      expect(st.fireworks).toBeNull()
      if (c >= 30) expect(st.superMode).toBeNull()
      if ([15, 30, 40, 75].includes(c)) expect(st.label!.tier).toBe(c)
    }
  })

  it('FX-15 few keeps a static bubble label only', () => {
    const s = sim('few')
    for (let c = 1; c <= 100; c++) {
      const st = s.step(true, 400)
      if (c >= 5 && st.label) {
        expect(st.label.animate).toBe(false)
        expect(st.label.style).toBe('bubble')
      }
      expect(st.confetti).toBeNull()
      expect(st.runner).toBeNull()
      expect(st.rain).toBeNull()
      expect(st.fireworks).toBeNull()
      expect(st.evolve).toBeNull()
      expect(st.sky).toBeNull()
    }
    expect(slotTtl(s.get(), 'label')).toBe(FX_TTL.labelStatic)
  })

  it('FX-16 flash gate makes the 4th tier within a second static', () => {
    const s = sim()
    for (let c = 1; c <= 4; c++) s.step(true, 1000)
    const tiers: { animate: boolean; tier: number }[] = []
    for (let c = 5; c <= 20; c++) {
      const st = s.step(true, 40)
      if (st.label && st.label.tier === c) tiers.push({ animate: st.label.animate, tier: c })
    }
    expect(tiers.map((t) => t.tier)).toEqual([5, 10, 15, 20])
    expect(tiers.slice(0, 3).every((t) => t.animate)).toBe(true)
    expect(tiers[3].animate).toBe(false)

    const g = sim()
    for (let c = 1; c <= 35; c++) g.step(true, 1000)
    for (let c = 36; c <= 39; c++) g.step(true, 1000)
    g.step(true, 1000)
    const rain = g.get().rain?.id
    expect(rain).toBeDefined()
  })

  it('FX-16 gated tier fires no canvas or rain', () => {
    const rng = mulberry32(7)
    let st = INITIAL_FX
    const at = (combo: number, now: number) =>
      (st = fxStep(
        st,
        { type: 'key', correct: true, combo, index: combo, char: 'a', word: null, now },
        rng,
      ))
    at(5, 0)
    at(10, 100)
    at(15, 200)
    const before = { confetti: st.confetti?.id, rain: st.rain?.id, fw: st.fireworks?.id }
    at(40, 300)
    expect(st.label!.tier).toBe(40)
    expect(st.label!.animate).toBe(false)
    expect(st.rain?.id).toBe(before.rain)
    at(75, 400)
    expect(st.fireworks?.id).toBe(before.fw)
    at(10, 2000)
    expect(st.confetti?.id).not.toBe(before.confetti)
  })

  it('FX-18 suppress blocks new one-shots; reset returns to initial', () => {
    const s = sim()
    for (let i = 0; i < 4; i++) s.step(true)
    s.send({ type: 'suppress', value: true })
    const before = ids(s.get())
    s.step(true)
    expect(ids(s.get())).toEqual(before)
    expect(s.get().label).toBeNull()
    s.send({ type: 'suppress', value: false })
    for (let i = 0; i < 25; i++) s.step(true)
    const r = s.send({ type: 'reset' })
    const { seq, history, ...rest } = r
    const { seq: s0, history: h0, ...init } = INITIAL_FX
    expect(seq).toBeGreaterThanOrEqual(s0)
    expect(history).toBeDefined()
    expect(h0).toBeDefined()
    expect(rest).toEqual(init)
  })

  it('FX-03 TTL table', () => {
    expect(FX_TTL.label).toBeLessThanOrEqual(900)
    expect(FX_TTL.labelStatic).toBeLessThanOrEqual(900)
    expect(FX_TTL.pop).toBeLessThanOrEqual(400)
    expect(FX_TTL.word).toBeLessThanOrEqual(700)
    expect(FX_TTL.runner).toBeLessThanOrEqual(2500)
    expect(FX_TTL.rain).toBeLessThanOrEqual(2500)
    expect(FX_TTL.fireworks).toBeLessThanOrEqual(2500)
    expect(FX_TTL.evolve).toBeLessThanOrEqual(2000)
    expect(FX_TTL.bubble).toBeLessThanOrEqual(1500)
  })
})
