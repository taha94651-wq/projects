import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, MemoryRouter, Navigate, Route, Routes } from 'react-router-dom'
import { IS_DEMO } from './env'
import { useStore } from './store'
import { AppShell } from './components/layout/AppShell'
import { AuthPage } from './pages/Login'
import Dashboard from './pages/Dashboard'

const Companies = lazy(() => import('./pages/Companies'))
const CompanyDetail = lazy(() => import('./pages/CompanyDetail'))
const Applications = lazy(() => import('./pages/Applications'))
const ApplicationDetail = lazy(() => import('./pages/ApplicationDetail'))
const Interviews = lazy(() => import('./pages/Interviews'))
const FollowUps = lazy(() => import('./pages/FollowUps'))
const Contacts = lazy(() => import('./pages/Contacts'))
const ContactDetail = lazy(() => import('./pages/ContactDetail'))
const Calendar = lazy(() => import('./pages/Calendar'))
const Analytics = lazy(() => import('./pages/Analytics'))
const Settings = lazy(() => import('./pages/Settings'))

const Router = IS_DEMO ? MemoryRouter : BrowserRouter
const Spinner = () => <div className="grid min-h-[40vh] place-items-center" role="status" aria-label="Loading"><div className="size-6 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" /></div>

export default function App() {
  const { phase, init, settings } = useStore()
  useEffect(() => { void init() }, [init])
  useEffect(() => { document.documentElement.lang = settings.locale.slice(0, 2) }, [settings.locale])
  if (phase === 'loading') return <Spinner />
  if (phase === 'setup' || phase === 'login') return <AuthPage mode={phase} />
  return (
    <Router>
      <Suspense fallback={<Spinner />}>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Dashboard />} />
            <Route path="companies" element={<Companies />} />
            <Route path="companies/:id" element={<CompanyDetail />} />
            <Route path="applications" element={<Applications />} />
            <Route path="applications/:id" element={<ApplicationDetail />} />
            <Route path="interviews" element={<Interviews />} />
            <Route path="follow-ups" element={<FollowUps />} />
            <Route path="contacts" element={<Contacts />} />
            <Route path="contacts/:id" element={<ContactDetail />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  )
}
