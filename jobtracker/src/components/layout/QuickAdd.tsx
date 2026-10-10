import { Briefcase, Building2, Contact, MessagesSquare, Plus, Bell, History } from 'lucide-react'
import { openForm, type FormKind } from '@/ui-store'
import { Popover } from '../ui/Menu'

const ITEMS: { kind: FormKind; label: string; icon: typeof Plus }[] = [
  { kind: 'company', label: 'Company', icon: Building2 }, { kind: 'application', label: 'Application', icon: Briefcase },
  { kind: 'contact', label: 'Contact', icon: Contact }, { kind: 'interview', label: 'Interview', icon: MessagesSquare },
  { kind: 'followup', label: 'Follow-up', icon: Bell }, { kind: 'activity', label: 'Activity', icon: History },
]
export function QuickAdd() {
  return (
    <Popover panelClass="w-56 p-1.5" trigger={({ toggle, ref, props }) => (
      <button ref={ref} className="btn btn-primary" onClick={toggle} {...props}><Plus className="size-4" /><span className="hidden sm:inline">Quick add</span><span className="sr-only sm:hidden">Quick add</span></button>
    )}>
      {close => (
        <div role="menu" aria-label="Quick add">
          {ITEMS.map(({ kind, label, icon: Icon }) => (
            <button key={kind} role="menuitem" className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-start text-[13.5px] text-ink-800 hover:bg-brand-50"
              onClick={() => { close(); openForm({ kind }) }}>
              <span className="grid size-7 place-items-center rounded-md bg-brand-50 text-brand-600"><Icon className="size-3.5" /></span>+ {label}
            </button>
          ))}
        </div>
      )}
    </Popover>
  )
}
