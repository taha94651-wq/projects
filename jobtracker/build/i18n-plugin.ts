import type { Plugin } from 'vite'
import { transformSource } from './i18n-transform'

export function i18nPlugin(): Plugin {
  return {
    name: 'pipeline-i18n',
    enforce: 'pre',
    transform(code, id) {
      const file = id.split('?')[0]
      if (!file.endsWith('.tsx') || file.includes('node_modules') || !file.includes('/src/')) return null
      const r = transformSource(code, file)
      return r.changed ? { code: r.code, map: null } : null
    },
  }
}
