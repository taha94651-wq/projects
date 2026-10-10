// Builds the preview and turns Vite's HTML into a body-only fragment (the Artifact host adds <html>/<head>).
import { execSync } from 'node:child_process'
import fs from 'node:fs'
execSync('npx vite build -c vite.demo.config.ts', { stdio: 'inherit' })
const html = fs.readFileSync('dist-demo/index.html', 'utf8')
const styles = [...html.matchAll(/<style[^>]*>[\s\S]*?<\/style>/g)].map(m => m[0])
const scripts = [...html.matchAll(/<script[^>]*>[\s\S]*?<\/script>/g)].map(m => m[0])
const fragment = `<title>Pipeline Job Tracker</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400..700&family=Instrument+Serif&family=Noto+Sans+Arabic:wght@400..700&family=Noto+Naskh+Arabic:wght@400..700&display=swap">
${styles.join('\n')}
<div id="root"></div>
${scripts.join('\n')}
`
fs.writeFileSync('dist-demo/preview-fragment.html', fragment)
console.log(`preview-fragment.html: ${(fragment.length / 1024).toFixed(0)} KB`)
