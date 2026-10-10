import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { BottomNav, Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { FormHost } from '../forms/FormHost'
import { ConfirmHost, Toaster } from '../ui/Feedback'
import { IS_DEMO } from '@/env'

export function AppShell() {
  const { pathname } = useLocation()
  useEffect(() => window.scrollTo(0, 0), [pathname])
  return (
    <div className="min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:z-[200] focus:rounded-lg focus:bg-ink-900 focus:px-3 focus:py-2 focus:text-white">Skip to content</a>
      <Sidebar />
      <div className="lg:ps-60">
        {IS_DEMO && <p className="bg-ink-900 px-4 py-1.5 text-center text-xs text-ink-200">Live preview · your changes are saved in this browser only · reset anytime in Settings</p>}
        <Topbar />
        <main id="main" className="mx-auto max-w-[1500px] px-4 pb-28 pt-6 sm:px-6 md:pb-12 lg:px-8"><Outlet /></main>
      </div>
      <BottomNav />
      <FormHost />
      <ConfirmHost />
      <Toaster />
    </div>
  )
}
