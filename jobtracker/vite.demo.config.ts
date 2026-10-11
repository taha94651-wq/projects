import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { i18nPlugin } from './build/i18n-plugin'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

/** Browser-only preview: one self-contained HTML file (see scripts/make-preview.mjs). */
export default defineConfig({
  base: './',
  plugins: [i18nPlugin(), react(), tailwindcss(), viteSingleFile()],
  resolve: { alias: { '@': import.meta.dirname + '/src', '@shared': import.meta.dirname + '/shared' } },
  define: { 'import.meta.env.VITE_DEMO': JSON.stringify('1') },
  build: { outDir: 'dist-demo', emptyOutDir: true },
})
