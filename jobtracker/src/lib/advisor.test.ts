import { describe, expect, it } from 'vitest'
import { buildSeed } from '@shared/seed'
import type { Dataset } from '@shared/types'
import { buildSuggestions, summarise } from './advisor'
import { draftText, defaultDraftLang } from './drafts'

const TODAY = '2026-10-10'
const fresh = (): Dataset => structuredClone(buildSeed(new Date(2026, 9, 10)))
const ids = (d: Dataset, staleDays = 7) => buildSuggestions(d, staleDays, 'Mostafa', TODAY).map(s => s.id)

describe('recruitment advisor on the sample data', () => {
  it('flags a below-expectation offer, a missing named contact and unclassified companies — and nothing else', () => {
    const list = buildSuggestions(fresh(), 7, 'Mostafa', TODAY)
    expect(list.map(s => s.id)).toEqual(['negotiate-ap_gulf1', 'classify', 'contact-ap_horizon'])
    expect(list[0].severity).toBe('high')
    expect(list[0].why).toContain('4%') // 26,000 offer vs 27,000 expected
    expect(list[0].draft?.kind).toBe('negotiate')
  })
  it('asks for a follow-up when an application has waited without a scheduled follow-up', () => {
    const d = fresh(); d.followUps = d.followUps.filter(f => f.applicationId !== 'ap_urban')
    const s = buildSuggestions(d, 7, '', TODAY).find(x => x.id === 'chase-ap_urban')!
    expect(s.severity).toBe('medium') // 12 days idle
    expect(s.cta?.form).toBe('followup')
    d.activities = d.activities.filter(a => !(a.applicationId === 'ap_urban' && a.type === 'Email')) // now 14 days since applying
    expect(buildSuggestions(d, 7, '', TODAY).find(x => x.id === 'chase-ap_urban')!.severity).toBe('high')
  })
  it('does not nag before the stale threshold', () => {
    const d = fresh(); d.followUps = d.followUps.filter(f => f.applicationId !== 'ap_urban')
    expect(ids(d, 14)).not.toContain('chase-ap_urban')
  })
  it('reminds you to say thanks within days of an interview', () => {
    const d = fresh()
    d.interviews.push({ id: 'iv_x', applicationId: 'ap_horizon', type: 'HR', date: '2026-10-09', time: '10:00', location: '', interviewer: '', status: 'Completed', prepNotes: '', postNotes: '', result: 'Pending', createdAt: '' })
    const s = buildSuggestions(d, 7, 'Mostafa', TODAY).find(x => x.id === 'thanks-iv_x')!
    expect(s.severity).toBe('high')
    expect(s.draft?.kind).toBe('thankyou')
  })
  it('asks for interview preparation when none is written', () => {
    const d = fresh(); d.interviews.find(i => i.id === 'iv_9')!.prepNotes = ''
    expect(ids(d)).toContain('prep-iv_9')
  })
  it('suggests another channel after a silent attempt, then pauses after three', () => {
    const d = fresh()
    d.attempts = [{ ...d.attempts.find(a => a.id === 'at_3')!, date: '2026-10-02' }] // WhatsApp, waiting 8 days
    const s = buildSuggestions(d, 7, '', TODAY).find(x => x.id.startsWith('channel-co_falcon'))!
    expect(s.cta?.defaults).toMatchObject({ method: 'Email', emailKind: 'HR email' })
    const three = [1, 2, 3].map(n => ({ ...d.attempts[0], id: `a${n}`, date: `2026-09-0${n}`, method: 'Email' as const, emailKind: 'HR email' as const }))
    d.attempts = three
    expect(ids(d)).toContain('pause-co_falcon')
  })
  it('suggests sending the CV when a company replied but no application exists', () => {
    const d = fresh(); d.applications = d.applications.filter(a => a.companyId !== 'co_modernspaces')
    expect(ids(d)).toContain('replied-at_2')
  })
  it('collapses many "start outreach" items into one', () => {
    const d = fresh()
    d.applications = []; d.attempts = []; d.companies.forEach(c => (c.status = 'Target'))
    const raw = buildSuggestions(d, 7, '', TODAY)
    expect(raw.filter(s => s.group === 'start').length).toBe(13)
    const sum = summarise(raw)
    expect(sum.filter(s => s.group === 'start').length).toBe(0)
    expect(sum.some(s => s.id === 'start-many')).toBe(true)
  })
})

describe('message drafts', () => {
  it('fills placeholders in English and Arabic', () => {
    const en = draftText('followup', { company: 'Acme', position: 'Architect', name: 'Sara', me: 'Mostafa', date: '2026-10-01' }, 'en')
    expect(en).toContain('Hello Sara')
    expect(en).toContain('Architect role at Acme')
    expect(en).not.toMatch(/\{\w+\}/)
    const ar = draftText('thankyou', { company: 'سمو', position: 'مهندس', me: 'مصطفى', type: 'فنية' }, 'ar')
    expect(ar).toContain('فريق التوظيف') // no name → neutral greeting
    expect(ar).not.toMatch(/\{\w+\}/)
  })
  it('picks Arabic for Arabic company names', () => {
    expect(defaultDraftLang('شركة سمو')).toBe('ar')
    expect(defaultDraftLang('Omrania')).toBe('en')
  })
})
