import { useEffect, useRef } from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { useUI } from '@/ui-store'
import { Modal } from './Modal'
import { cx } from './Badge'

export function Toaster() {
  const { toasts, dismissToast } = useUI()
  const icon = { success: <CheckCircle2 className="size-4 text-brand-300" />, error: <AlertCircle className="size-4 text-danger-100" />, info: <Info className="size-4 text-info-100" /> }
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[100] flex flex-col items-center gap-2 px-4 lg:bottom-6" aria-live="polite" role="status">
      {toasts.map(t => (
        <div key={t.id} className={cx('anim-pop pointer-events-auto flex max-w-md items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm text-white shadow-pop', t.tone === 'error' ? 'bg-danger-700' : 'bg-ink-900')}>
          {icon[t.tone]}<span>{t.message}</span>
          <button className="-me-1 ms-1 rounded p-1 text-white/60 hover:text-white" onClick={() => dismissToast(t.id)} aria-label="Dismiss"><X className="size-3.5" /></button>
        </div>
      ))}
    </div>
  )
}

export function ConfirmHost() {
  const { confirmReq, resolveConfirm } = useUI()
  const btn = useRef<HTMLButtonElement>(null)
  useEffect(() => { if (confirmReq) setTimeout(() => btn.current?.focus(), 30) }, [confirmReq])
  if (!confirmReq) return null
  return (
    <Modal open size="sm" title={confirmReq.title} onClose={() => resolveConfirm(false)}
      footer={<>
        <button className="btn" onClick={() => resolveConfirm(false)}>Cancel</button>
        <button ref={btn} className={cx('btn', confirmReq.tone === 'danger' ? 'btn-danger' : 'btn-primary')} onClick={() => resolveConfirm(true)}>{confirmReq.confirmLabel ?? 'Confirm'}</button>
      </>}>
      <p className="text-sm leading-relaxed text-ink-600">{confirmReq.message}</p>
    </Modal>
  )
}
