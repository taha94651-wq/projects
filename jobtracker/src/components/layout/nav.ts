import { BarChart3, Bell, Briefcase, Building2, CalendarDays, Contact, LayoutDashboard, MessagesSquare, Settings, type LucideIcon } from 'lucide-react'

export const NAV: { to: string; label: string; icon: LucideIcon; end?: boolean }[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/companies', label: 'Companies', icon: Building2 },
  { to: '/applications', label: 'Applications', icon: Briefcase },
  { to: '/interviews', label: 'Interviews', icon: MessagesSquare },
  { to: '/follow-ups', label: 'Follow-ups', icon: Bell },
  { to: '/contacts', label: 'Contacts', icon: Contact },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
]
