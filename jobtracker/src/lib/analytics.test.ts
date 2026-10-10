import { describe, expect, it } from 'vitest'
import { buildSeed } from '@shared/seed'
import { computeAnalytics, positionGroup } from './analytics'
import { buildNotifications } from './derive'
import { parseCsv, toCsv } from './csv'
import { diffDays, addDays } from './dates'

const TODAY = new Date(2026, 9, 10)
const data = buildSeed(TODAY)
const a = computeAnalytics(data, 6, '2026-10-10')

describe('analytics on the sample dataset', () => {
  it('counts submitted applications (wishlist excluded)', () => {
    expect(a.totals.applications).toBe(13)
    expect(a.totals.offers).toBe(3)
    expect(a.totals.rejected).toBe(2)
    expect(a.totals.active).toBe(8) // 13 minus accepted, rejected x2, withdrawn x2
  })
  it('computes rates', () => {
    expect(a.offerRate).toBeCloseTo(3 / 13)
    expect(a.rejectionRate).toBeCloseTo(2 / 13)
    expect(a.interviewRate).toBeCloseTo(7 / 13)
  })
  it('computes pipeline conversion steps', () => {
    expect(a.funnel.map(f => [f.base, f.reached])).toEqual([[13, 10], [10, 7], [7, 4], [4, 3], [3, 1]])
  })
  it('computes average days from application to first interview', () => {
    // first interview offsets from application date: alnoor 8, gulf1 9, axis 8, meridian 7, capital2 4, modern0 15, horizon0 10
    expect(a.avgDaysToInterview).toBeCloseTo((8 + 9 + 8 + 7 + 4 + 15 + 10) / 7)
  })
  it('computes average days from interview to offer', () => {
    // gulf1: -26 -> -2 = 24, modern0: -65 -> -55 = 10, horizon0: -60 -> -52 = 8
    expect(a.avgDaysInterviewToOffer).toBeCloseTo((24 + 10 + 8) / 3)
  })
  it('groups by source and position', () => {
    expect(a.bySource.reduce((s, r) => s + r.count, 0)).toBe(13)
    expect(positionGroup('Senior Architect – Hospitality')).toBe('Senior Architect')
  })
  it('has a 6 month series covering the current month', () => {
    expect(a.months).toHaveLength(6)
    expect(a.months.at(-1)!.key).toBe('2026-10')
    expect(a.months.reduce((s, m) => s + m.applications, 0)).toBeGreaterThan(0)
  })
})

describe('notifications', () => {
  const n = buildNotifications(data, 7, '2026-10-10')
  it('flags overdue, due-today, interview today/tomorrow and offers', () => {
    const kinds = new Set(n.map(x => x.kind))
    for (const k of ['followup-overdue', 'followup-today', 'interview-today', 'interview-tomorrow', 'offer', 'waiting']) expect(kinds.has(k as never)).toBe(true)
  })
})

describe('helpers', () => {
  it('dates', () => {
    expect(diffDays('2026-10-10', '2026-10-01')).toBe(9)
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
  })
  it('csv round-trips quotes, commas and newlines and neutralises formulas', () => {
    const csv = toCsv([{ a: 'x,"y"', b: '=SUM(A1)' }, { a: 'line\nbreak', b: 'ok' }], [{ header: 'a', value: r => r.a }, { header: 'b', value: r => r.b }])
    const rows = parseCsv(csv)
    expect(rows[1]).toEqual(['x,"y"', "'=SUM(A1)"])
    expect(rows[2]).toEqual(['line\nbreak', 'ok'])
  })
})
