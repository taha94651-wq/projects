import { t, tDesc } from '@/i18n'
import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Briefcase, Building2, CalendarClock, Gift, MapPin, MessagesSquare, Plus, ThumbsDown, Bell, CircleAlert, CheckCircle2 } from 'lucide-react'
import { useData, useLocale, useStore } from '@/store'
import { openForm } from '@/ui-store'
import { diffDays, fmtDate, fmtShort, fmtTime, relDay, todayISO } from '@/lib/dates'
import { categoryStats } from '@/lib/compare'
import { actionItems, interviewStamp, isUpcomingInterview, pendingFollowUps } from '@/lib/derive'
import { Badge, cx, StageBadge } from '@/components/ui/Badge'
import { EmptyState, PageHeader, Section, Stat } from '@/components/ui/misc'
import { FollowUpCard } from '@/components/features/FollowUpCard'
import { KanbanBoard } from '@/components/features/KanbanBoard'
import { ACTIVITY_ICON } from '@/components/features/Timeline'

export default function Dashboard() {
  const data = useData(), locale = useLocale(), user = useStore(s => s.user), staleDays = useStore(s => s.settings.staleDays)
  const nav = useNavigate()
  const today = todayISO()
  const cos = useMemo(() => new Map(data.companies.map(c => [c.id, c])), [data.companies])
  const apps = useMemo(() => new Map(data.applications.map(a => [a.id, a])), [data.applications])

  const kpi = {
    companies: data.companies.filter(c => !c.archived).length,
    active: data.applications.filter(a => ['Applied', 'HR Contact', 'Screening', 'Technical Interview', 'Final Interview', 'Offer'].includes(a.status)).length,
    interviews: data.interviews.filter(i => isUpcomingInterview(i, today)).length,
    offers: data.applications.filter(a => a.status === 'Offer').length,
    rejected: data.applications.filter(a => a.status === 'Rejected').length,
  }
  const due = pendingFollowUps(data).filter(f => f.dueDate <= today).sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  const overdue = due.filter(f => f.dueDate < today).length
  const upcomingInterviews = data.interviews.filter(i => isUpcomingInterview(i, today) && diffDays(i.date, today) <= 14).sort((a, b) => interviewStamp(a).localeCompare(interviewStamp(b)))
  const actions = actionItems(data, staleDays).slice(0, 6)
  const recent = [...data.activities].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)).slice(0, 9)
  const hour = new Date().getHours()
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening' // keys: 'Good morning, {name}' …
  const todoCount = due.length + upcomingInterviews.filter(i => diffDays(i.date, today) <= 1).length

  return (
    <>
      <PageHeader title={t(`${greet}, {name}`, { name: user?.name.split(' ')[0] ?? '' })}
        subtitle={<>{fmtDate(today, locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · {todoCount ? <strong className="font-semibold text-ink-700">{t(todoCount === 1 ? '{n} thing needs your attention' : '{n} things need your attention', { n: todoCount })}</strong> : t('nothing urgent today')}</>}
        actions={<><button className="btn" onClick={() => openForm({ kind: 'company' })}><Plus className="size-4" />Company</button><button className="btn btn-dark" onClick={() => openForm({ kind: 'application' })}><Plus className="size-4" />Application</button></>} />

      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="Companies" value={kpi.companies} icon={Building2} onClick={() => nav('/companies')} hint="in your database" />
        <Stat label="Active applications" value={kpi.active} icon={Briefcase} tone="brand" onClick={() => nav('/applications')} hint="in progress" />
        <Stat label="Interviews" value={kpi.interviews} icon={MessagesSquare} tone="warn" onClick={() => nav('/interviews')} hint="upcoming" />
        <Stat label="Offers" value={kpi.offers} icon={Gift} tone="brand" onClick={() => nav('/applications?status=Offer')} hint="awaiting decision" />
        <Stat label="Rejected" value={kpi.rejected} icon={ThumbsDown} onClick={() => nav('/applications?status=Rejected')} hint="closed" />
        <Stat label="Follow-ups due" value={due.length} icon={Bell} tone={overdue ? 'danger' : 'default'} onClick={() => nav('/follow-ups')} hint={overdue ? t('{n} overdue', { n: overdue }) : t('today or earlier')} />
      </div>

      {data.applications.length === 0 && data.companies.length > 0 && (
        <section className="card mb-8 flex flex-wrap items-center justify-between gap-4 border-brand-300 bg-brand-50/50 p-5" aria-label="Getting started">
          <div className="min-w-0"><h2 className="text-[15px] font-semibold">Your list is ready</h2><p className="mt-1 max-w-xl text-sm text-ink-600">{t('{n} companies are in your list. Classify them, then log each application as you apply.', { n: data.companies.filter(c => !c.archived).length })}</p></div>
          <div className="flex flex-wrap gap-2"><Link to="/companies?category=Unclassified" className="btn">Classify companies</Link><button className="btn btn-primary" onClick={() => openForm({ kind: 'application' })}>Add first application</button></div>
        </section>
      )}
      <section aria-labelledby="cat-h" className="mb-8">
        <div className="mb-3 flex items-center justify-between"><h2 id="cat-h" className="text-[15px] font-semibold">By category</h2><Link to="/compare" className="btn btn-sm">Compare <ArrowRight className="size-3.5 rtl:-scale-x-100" /></Link></div>
        <div className="grid gap-3 sm:grid-cols-3">
          {categoryStats(data).filter(r => r.type !== 'Unclassified').map(({ type, stats }) => (
            <Link key={type} to={`/companies?category=${encodeURIComponent(type)}`} className="card p-4 transition hover:border-ink-300 hover:shadow-pop">
              <p className="font-display text-2xl">{t(type)}</p>
              <dl className="mt-2 grid grid-cols-4 gap-2 text-center">
                {([['Companies', stats.companies], ['Applications', stats.applications], ['Interviews', stats.interviews], ['Offers', stats.offers]] as const).map(([k, v]) => <div key={k}><dd className="text-lg font-semibold tabular-nums">{v}</dd><dt className="truncate text-[11px] text-ink-500">{t(k)}</dt></div>)}
              </dl>
            </Link>
          ))}
        </div>
        {categoryStats(data).find(r => r.type === 'Unclassified')!.stats.companies > 0 && <p className="mt-2 text-xs text-ink-500"><Link to="/companies?category=Unclassified" className="font-medium text-brand-700 hover:underline">{t('{n} companies still need a category', { n: categoryStats(data).find(r => r.type === 'Unclassified')!.stats.companies })}</Link></p>}
      </section>

      <div className="mb-8 grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section aria-labelledby="upcoming-h" className="card overflow-hidden">
          <header className="flex items-center justify-between border-b border-ink-100 bg-gradient-to-r from-brand-50/70 to-transparent px-5 py-4">
            <div><h2 id="upcoming-h" className="text-[15px] font-semibold">Upcoming actions</h2><p className="text-xs text-ink-500">What to do next, most urgent first</p></div>
            {todoCount === 0 && <Badge tone="green"><CheckCircle2 className="size-3" />All clear</Badge>}
          </header>
          <div className="space-y-6 p-5">
            <div>
              <h3 className="eyebrow mb-2.5 flex items-center gap-1.5"><Bell className="size-3.5" />{t('Follow-ups due')} {overdue > 0 && <span className="rounded bg-danger-50 px-1.5 py-px text-danger-700 normal-case tracking-normal">{t('{n} overdue', { n: overdue })}</span>}</h3>
              {due.length ? <div className="grid gap-3 lg:grid-cols-2">{due.slice(0, 4).map(f => <FollowUpCard key={f.id} f={f} compact />)}</div> : <p className="rounded-lg bg-ink-50 px-3 py-3 text-sm text-ink-500">No follow-ups due. Nice.</p>}
              {due.length > 4 && <Link to="/follow-ups" className="mt-2 inline-flex items-center gap-1 text-[13px] font-medium text-brand-700 hover:underline">View all {due.length} <ArrowRight className="size-3.5 rtl:-scale-x-100" /></Link>}
            </div>
            <div>
              <h3 className="eyebrow mb-2.5 flex items-center gap-1.5"><CalendarClock className="size-3.5" />Interviews coming up</h3>
              {upcomingInterviews.length ? (
                <ul className="divide-y divide-ink-100 rounded-xl border border-ink-200/80">
                  {upcomingInterviews.slice(0, 4).map(i => {
                    const app = apps.get(i.applicationId); const co = cos.get(app?.companyId ?? ''); const n = diffDays(i.date, today)
                    return (
                      <li key={i.id}><Link to="/interviews" className="flex items-center gap-3 px-3.5 py-3 hover:bg-ink-50">
                        <div className={cx('grid w-12 shrink-0 place-items-center rounded-lg py-1 text-center', n <= 1 ? 'bg-warn-50 text-warn-700' : 'bg-ink-100 text-ink-600')}>
                          <span className="text-[10px] font-semibold uppercase">{fmtDate(i.date, locale, { month: 'short' })}</span><span className="text-lg font-semibold leading-none">{fmtDate(i.date, locale, { day: 'numeric' })}</span>
                        </div>
                        <div className="min-w-0 flex-1"><p className="truncate text-[13.5px] font-medium">{co?.name} · {app?.position}</p><p className="truncate text-xs text-ink-500">{t('{type} interview', { type: t(i.type) })}{i.time && ` · ${fmtTime(i.time, locale)}`}{i.location && ` · ${i.location}`}</p></div>
                        <Badge tone={n === 0 ? 'amber' : n === 1 ? 'blue' : 'neutral'}>{relDay(i.date)}</Badge>
                      </Link></li>
                    )
                  })}
                </ul>
              ) : <p className="rounded-lg bg-ink-50 px-3 py-3 text-sm text-ink-500">No interviews in the next two weeks.</p>}
            </div>
            <div>
              <h3 className="eyebrow mb-2.5 flex items-center gap-1.5"><CircleAlert className="size-3.5" />Applications requiring action</h3>
              {actions.length ? (
                <ul className="divide-y divide-ink-100 rounded-xl border border-ink-200/80">
                  {actions.map(({ app, reason, tone }) => (
                    <li key={app.id}><Link to={`/applications/${app.id}`} className="flex items-center gap-3 px-3.5 py-3 hover:bg-ink-50">
                      <span className={cx('size-2 shrink-0 rounded-full', { danger: 'bg-danger-500', warn: 'bg-warn-500', info: 'bg-info-500', green: 'bg-brand-500' }[tone])} aria-hidden />
                      <div className="min-w-0 flex-1"><p className="truncate text-[13.5px] font-medium">{cos.get(app.companyId)?.name} · {app.position}</p><p className="text-xs text-ink-500">{reason}</p></div>
                      <StageBadge stage={app.status} />
                    </Link></li>
                  ))}
                </ul>
              ) : <p className="rounded-lg bg-ink-50 px-3 py-3 text-sm text-ink-500">Nothing needs action right now.</p>}
            </div>
          </div>
        </section>

        <Section title="Recent activity" icon={MapPin} flush>
          {recent.length ? (
            <ul className="px-5 pb-4" aria-label="Recent activity">
              {recent.map(a => {
                const { icon: Icon, tone } = ACTIVITY_ICON[a.type]
                const co = cos.get(a.companyId ?? ''); const app = a.applicationId ? apps.get(a.applicationId) : undefined
                return (
                  <li key={a.id} className="flex gap-3 border-t border-ink-100 py-3 first:border-0">
                    <span className={cx('grid size-7 shrink-0 place-items-center rounded-full', tone)}><Icon className="size-3.5" aria-hidden /></span>
                    <div className="min-w-0 text-[13px]">
                      <p className="leading-snug text-ink-800">{tDesc(a.description) || t(a.type)}</p>
                      <p className="mt-0.5 truncate text-xs text-ink-500">{app ? <Link to={`/applications/${app.id}`} className="hover:underline">{co?.name} · {app.position}</Link> : co?.name} · {fmtShort(a.date, locale)}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : <EmptyState icon={MapPin} title="No activity yet" text="Applications, interviews and notes will show up here." />}
        </Section>
      </div>

      <section aria-labelledby="pipeline-h">
        <div className="mb-3 flex items-center justify-between">
          <div><h2 id="pipeline-h" className="text-[15px] font-semibold">Application pipeline</h2><p className="text-xs text-ink-500">Drag cards between stages, or use the ⋯ menu</p></div>
          <Link to="/applications" className="btn btn-sm">Open tracker <ArrowRight className="size-3.5 rtl:-scale-x-100" /></Link>
        </div>
        <KanbanBoard apps={data.applications} />
      </section>
    </>
  )
}
