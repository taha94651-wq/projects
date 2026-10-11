import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cx } from './Badge'

/** Accessible modal built on the native <dialog> (focus trap, Esc, inert background). */
export function Modal({ open, onClose, title, description, children, footer, size = 'md' }: {
  open: boolean; onClose: () => void; title: string; description?: string; children: ReactNode; footer?: ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])
  if (!open) return null
  const width = { sm: 'max-w-sm', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' }[size]
  return (
    <dialog
      ref={ref}
      onCancel={e => { e.preventDefault(); onClose() }}
      onMouseDown={e => { if (e.target === ref.current) onClose() }}
      aria-labelledby="modal-title"
      className={cx('anim-pop m-auto max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-ink-200 bg-surface p-0 shadow-pop', width)}
    >
      <div className="flex max-h-[calc(100dvh-1.5rem)] flex-col">
        <header className="flex items-start justify-between gap-4 border-b border-ink-100 px-5 py-4">
          <div>
            <h2 id="modal-title" className="text-[15px] font-semibold text-ink-900">{title}</h2>
            {description && <p className="mt-0.5 text-[13px] text-ink-500">{description}</p>}
          </div>
          <button type="button" className="btn btn-ghost btn-icon btn-sm -me-1.5 -mt-1" onClick={onClose} aria-label="Close"><X className="size-4" /></button>
        </header>
        <div className="scroll-thin overflow-y-auto px-5 py-4">{children}</div>
        {footer && <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-ink-100 bg-ink-50/60 px-5 py-3">{footer}</footer>}
      </div>
    </dialog>
  )
}
