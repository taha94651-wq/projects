import { t } from '@/i18n'
import type { ReactNode } from 'react'
import { AlertTriangle, ArrowDown, ArrowUp, Minus } from 'lucide-react'
import type { CompanyStatus, Priority, Stage } from '@shared/constants'

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

export const STAGE_STYLE: Record<Stage, { badge: string; dot: string }> = {
  Wishlist: { badge: 'bg-ink-100 text-ink-600', dot: 'bg-ink-400' },
  Applied: { badge: 'bg-info-50 text-info-700', dot: 'bg-info-500' },
  'HR Contact': { badge: 'bg-info-100 text-info-700', dot: 'bg-info-500' },
  Screening: { badge: 'bg-brand-50 text-brand-700', dot: 'bg-brand-400' },
  'Technical Interview': { badge: 'bg-warn-50 text-warn-700', dot: 'bg-warn-500' },
  'Final Interview': { badge: 'bg-warn-100 text-warn-700', dot: 'bg-warn-500' },
  Offer: { badge: 'bg-brand-600 text-white', dot: 'bg-brand-600' },
  Accepted: { badge: 'bg-brand-800 text-white', dot: 'bg-brand-800' },
  Rejected: { badge: 'bg-danger-50 text-danger-700', dot: 'bg-danger-500' },
  Withdrawn: { badge: 'bg-ink-200/70 text-ink-600', dot: 'bg-ink-300' },
}
export const COMPANY_STATUS_STYLE: Record<CompanyStatus, string> = {
  Target: 'bg-ink-100 text-ink-600', Contacted: 'bg-info-50 text-info-700', Active: 'bg-brand-50 text-brand-700',
  Interviewing: 'bg-warn-50 text-warn-700', Offer: 'bg-brand-600 text-white', Closed: 'bg-ink-200/70 text-ink-500',
}
const TONES = {
  neutral: 'bg-ink-100 text-ink-600', green: 'bg-brand-50 text-brand-700', amber: 'bg-warn-50 text-warn-700',
  red: 'bg-danger-50 text-danger-700', blue: 'bg-info-50 text-info-700', solid: 'bg-ink-900 text-white',
}
export type Tone = keyof typeof TONES
export function Badge({ tone = 'neutral', className, children }: { tone?: Tone; className?: string; children: ReactNode }) {
  return <span className={cx('badge', TONES[tone], className)}>{children}</span>
}
export const StageBadge = ({ stage }: { stage: Stage }) => (
  <span className={cx('badge', STAGE_STYLE[stage].badge)}><span className={cx('size-1.5 rounded-full', STAGE_STYLE[stage].dot, stage === 'Offer' || stage === 'Accepted' ? 'bg-white' : '')} />{t(stage)}</span>
)
export const CompanyStatusBadge = ({ status }: { status: CompanyStatus }) => <span className={cx('badge', COMPANY_STATUS_STYLE[status])}>{t(status)}</span>

const P = { High: { cls: 'bg-danger-50 text-danger-700', Icon: ArrowUp }, Medium: { cls: 'bg-warn-50 text-warn-700', Icon: Minus }, Low: { cls: 'bg-ink-100 text-ink-500', Icon: ArrowDown } }
export function PriorityBadge({ priority, compact }: { priority: Priority; compact?: boolean }) {
  const { cls, Icon } = P[priority]
  return <span className={cx('badge', cls)} title={t('{p} priority', { p: t(priority) })}><Icon className="size-3" aria-hidden />{compact ? <span className="sr-only">{t(priority)}</span> : t(priority)}</span>
}
export const OverdueFlag = ({ children }: { children: ReactNode }) => (
  <span className="inline-flex items-center gap-1 text-xs font-semibold text-danger-700"><AlertTriangle className="size-3.5" aria-hidden />{children}</span>
)
