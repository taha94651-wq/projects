import { t } from '@/i18n'
import { BarChart3, Lightbulb, Scale, Bell, Briefcase, Building2, CalendarDays, Contact, LayoutDashboard, MessagesSquare, Settings, type LucideIcon } from 'lucide-react'

export const NAV: { to: string; label: string; icon: LucideIcon; end?: boolean }[] = [
  { to: '/', label: t('Dashboard'), icon: LayoutDashboard, end: true },
  { to: '/companies', label: t('Companies'), icon: Building2 },
  { to: '/applications', label: t('Applications'), icon: Briefcase },
  { to: '/interviews', label: t('Interviews'), icon: MessagesSquare },
  { to: '/follow-ups', label: t('Follow-ups'), icon: Bell },
  { to: '/contacts', label: t('Contacts'), icon: Contact },
  { to: '/calendar', label: t('Calendar'), icon: CalendarDays },
  { to: '/analytics', label: t('Analytics'), icon: BarChart3 },
  { to: '/compare', label: t('Compare'), icon: Scale },
  { to: '/suggestions', label: t('Suggestions'), icon: Lightbulb },
  { to: '/settings', label: t('Settings'), icon: Settings },
]
