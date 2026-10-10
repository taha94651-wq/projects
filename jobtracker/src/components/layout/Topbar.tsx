import { useNavigate } from 'react-router-dom'
import { LogOut, Menu as MenuIcon, Settings, User } from 'lucide-react'
import { useStore } from '@/store'
import { useUI } from '@/ui-store'
import { Popover } from '../ui/Menu'
import { Avatar } from '../ui/misc'
import { GlobalSearch } from './GlobalSearch'
import { Notifications } from './Notifications'
import { QuickAdd } from './QuickAdd'
import { Logo } from './Sidebar'

export function Topbar() {
  const user = useStore(s => s.user)
  const signOut = useStore(s => s.signOut)
  const setNav = useUI(s => s.setNav)
  const nav = useNavigate()
  return (
    <header className="sticky top-0 z-20 border-b border-ink-200/70 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1500px] items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:px-8">
        <button className="btn btn-ghost btn-icon -ms-2 lg:hidden" onClick={() => setNav(true)} aria-label="Open menu"><MenuIcon className="size-5" /></button>
        <div className="hidden text-ink-900 max-sm:hidden md:hidden"><Logo /></div>
        <GlobalSearch />
        <div className="ms-auto flex items-center gap-1.5 sm:gap-2">
          <QuickAdd />
          <Notifications />
          <Popover panelClass="w-60 p-1.5" trigger={({ toggle, ref, props }) => (
            <button ref={ref} onClick={toggle} {...props} className="rounded-lg p-0.5 hover:bg-ink-100" aria-label="Profile menu"><Avatar name={user?.name ?? '?'} /></button>
          )}>
            {close => (
              <div role="menu">
                <div className="px-3 py-2.5"><p className="truncate text-sm font-semibold">{user?.name}</p><p className="truncate text-xs text-ink-500">{user?.email}</p></div>
                <div className="my-1 h-px bg-ink-100" />
                <button role="menuitem" className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] hover:bg-ink-50" onClick={() => { close(); nav('/settings') }}><User className="size-4 text-ink-400" />Profile</button>
                <button role="menuitem" className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] hover:bg-ink-50" onClick={() => { close(); nav('/settings') }}><Settings className="size-4 text-ink-400" />Settings</button>
                <button role="menuitem" className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-danger-700 hover:bg-danger-50" onClick={() => void signOut()}><LogOut className="size-4" />Sign out</button>
              </div>
            )}
          </Popover>
        </div>
      </div>
    </header>
  )
}
