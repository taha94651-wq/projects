import type { Dataset, EntityKey, Settings, User } from '@shared/types'

export type DataMode = 'sample' | 'targets' | 'empty'

export class ApiError extends Error { constructor(message: string, public status: number) { super(message) } }

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api${url}`, {
    method, credentials: 'same-origin',
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : method === 'GET' ? {} : { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : method === 'GET' ? undefined : '{}',
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError((json as { error?: string }).error ?? `Request failed (${res.status})`, res.status)
  return json as T
}
export interface Bootstrap { user: User; settings: Settings; data: Dataset }

export const api = {
  status: () => request<{ configured: boolean; user: User | null; setupCodeRequired?: boolean }>('GET', '/auth/status'),
  setup: (b: { name: string; email: string; password: string; mode: DataMode; setupCode?: string }) => request<{ user: User }>('POST', '/auth/setup', b),
  login: (b: { email: string; password: string }) => request<{ user: User }>('POST', '/auth/login', b),
  logout: () => request<{ ok: true }>('POST', '/auth/logout'),
  profile: (b: { name: string; email: string }) => request<{ user: User }>('PUT', '/auth/profile', b),
  password: (b: { current: string; next: string }) => request<{ ok: true }>('POST', '/auth/password', b),
  bootstrap: () => request<Bootstrap>('GET', '/bootstrap'),
  saveSettings: (s: Partial<Settings>) => request<Settings>('PUT', '/settings', s),
  reset: (mode: DataMode) => request<{ data: Dataset }>('POST', '/reset', { mode }),
  create: <T>(e: EntityKey, row: unknown) => request<T>('POST', `/data/${e}`, row),
  createMany: <T>(e: EntityKey, rows: unknown[]) => request<T[]>('POST', `/data/${e}`, rows),
  update: <T>(e: EntityKey, id: string, patch: unknown) => request<T>('PUT', `/data/${e}/${id}`, patch),
  remove: (e: EntityKey, id: string) => request<{ ok: true }>('DELETE', `/data/${e}/${id}`),
  upload: async (file: File, owner: { activityId?: string; applicationId?: string; companyId?: string }) => {
    const buf = new Uint8Array(await file.arrayBuffer())
    let bin = ''
    for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000))
    return request<import('@shared/types').Attachment>('POST', '/attachments', { name: file.name, mime: file.type, data: btoa(bin), ...owner })
  },
}
