import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { i18nPlugin } from './build/i18n-plugin'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  plugins: [i18nPlugin(), react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src'), '@shared': path.resolve(import.meta.dirname, 'shared') } },
  server: { port: 5173, proxy: { '/api': 'http://127.0.0.1:3001' } },
  test: { include: ['src/**/*.test.ts'] },
})
