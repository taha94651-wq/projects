import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { IS_DEMO } from './env'

async function boot() {
  if (IS_DEMO) (await import('./demo-api')).installDemoApi() // fonts come from Google Fonts in the preview page
  else await Promise.all([import('@fontsource-variable/inter'), import('@fontsource/instrument-serif'), import('@fontsource-variable/noto-sans-arabic'), import('@fontsource-variable/noto-naskh-arabic')])
  createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
}
void boot()
