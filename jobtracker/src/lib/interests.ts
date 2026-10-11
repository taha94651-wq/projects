import { INTERESTS } from '@shared/constants'

export const parseInterests = (s: string | null | undefined): string[] => (s ?? '').split(',').map(x => x.trim()).filter(Boolean)
export const joinInterests = (list: string[]) => [...new Set(list)].join(',')
/** Known options first (in canonical order), then any custom ones the user has typed. */
export const interestOptions = (used: string[] = []) => [...INTERESTS, ...[...new Set(used)].filter(u => !(INTERESTS as readonly string[]).includes(u))]
