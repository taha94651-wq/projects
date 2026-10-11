import { create } from 'zustand'

export interface Toast { id: number; message: string; tone: 'success' | 'error' | 'info' }
export type FormKind = 'company' | 'attempt' | 'attemptSaved' | 'application' | 'contact' | 'interview' | 'followup' | 'activity' | 'reschedule' | 'import'
export interface FormRequest { kind: FormKind; id?: string; defaults?: Record<string, unknown> }
export interface ConfirmRequest { title: string; message: string; confirmLabel?: string; tone?: 'danger' | 'default'; resolve: (ok: boolean) => void }

interface UIState {
  toasts: Toast[]
  form: FormRequest | null
  confirmReq: ConfirmRequest | null
  navOpen: boolean
  toast: (message: string, tone?: Toast['tone']) => void
  dismissToast: (id: number) => void
  openForm: (req: FormRequest) => void
  closeForm: () => void
  confirm: (opts: Omit<ConfirmRequest, 'resolve'>) => Promise<boolean>
  resolveConfirm: (ok: boolean) => void
  setNav: (open: boolean) => void
}
let seq = 0
export const useUI = create<UIState>((set, get) => ({
  toasts: [], form: null, confirmReq: null, navOpen: false,
  toast: (message, tone = 'success') => {
    const id = ++seq
    set(s => ({ toasts: [...s.toasts.slice(-3), { id, message, tone }] }))
    setTimeout(() => get().dismissToast(id), tone === 'error' ? 6000 : 3500)
  },
  dismissToast: id => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
  openForm: form => set({ form }),
  closeForm: () => set({ form: null }),
  confirm: opts => new Promise<boolean>(resolve => set({ confirmReq: { ...opts, resolve } })),
  resolveConfirm: ok => { get().confirmReq?.resolve(ok); set({ confirmReq: null }) },
  setNav: navOpen => set({ navOpen }),
}))
export const toast = (m: string, t?: Toast['tone']) => useUI.getState().toast(m, t)
export const openForm = (r: FormRequest) => useUI.getState().openForm(r)
export const confirmDialog = (o: Omit<ConfirmRequest, 'resolve'>) => useUI.getState().confirm(o)
