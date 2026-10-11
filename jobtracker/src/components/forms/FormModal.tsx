import type { FormEvent, ReactNode } from 'react'
import { Modal } from '../ui/Modal'
import { useUI } from '@/ui-store'

export function FormModal({ title, description, onSubmit, busy, submitLabel = 'Save', children, size = 'md', extraFooter }: {
  title: string; description?: string; onSubmit: (e?: FormEvent) => void; busy: boolean; submitLabel?: string; children: ReactNode; size?: 'sm' | 'md' | 'lg'; extraFooter?: ReactNode
}) {
  const close = useUI(s => s.closeForm)
  return (
    <Modal open onClose={close} title={title} description={description} size={size}
      footer={<>
        {extraFooter}
        <button type="button" className="btn" onClick={close}>Cancel</button>
        <button type="submit" form="entity-form" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : submitLabel}</button>
      </>}>
      <form id="entity-form" onSubmit={onSubmit} noValidate>
        {children}
        <button type="submit" className="hidden" tabIndex={-1} aria-hidden />
      </form>
    </Modal>
  )
}
