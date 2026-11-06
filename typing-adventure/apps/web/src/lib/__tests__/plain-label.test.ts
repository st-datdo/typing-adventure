import { describe, expect, it } from 'vitest'
import { plainLabel } from '../kr/plain-label'

describe('plainLabel', () => {
  it('KR-11 strips the leading emoji cluster', () => {
    expect(plainLabel('🎮 Cổ điển')).toBe('Cổ điển')
    expect(plainLabel('🌈 All')).toBe('All')
    expect(plainLabel('🕹️ Chế độ chơi')).toBe('Chế độ chơi')
  })

  it('KR-11 leaves plain strings unchanged', () => {
    expect(plainLabel('Home Row')).toBe('Home Row')
  })

  it('KR-11 does not cut accented leading letters', () => {
    expect(plainLabel('Ếch')).toBe('Ếch')
  })
})
