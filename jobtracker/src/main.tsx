import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

async function boot() {
  // Compared inline (not via a shared constant) so the bundler can drop the branch that does not apply to this build.
  if (import.meta.env.VITE_DEMO === '1') {
    try { await (await import('./demo-api')).installDemoApi() } catch (e) { console.error('preview storage failed', e) } // fonts come from Google Fonts in the preview page
  }
  else await Promise.all([import('@fontsource-variable/inter'), import('@fontsource/instrument-serif'), import('@fontsource-variable/noto-sans-arabic'), import('@fontsource-variable/noto-naskh-arabic')])
  createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
}
void boot()
