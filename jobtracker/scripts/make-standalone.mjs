// Turns the preview build into ONE self-contained HTML file that opens by double-click (works offline).
import fs from 'node:fs'
import { execSync } from 'node:child_process'
execSync('node scripts/make-preview.mjs', { stdio: 'inherit' })
const frag = fs.readFileSync('dist-demo/preview-fragment.html', 'utf8').replace(/<title>[\s\S]*?<\/title>\s*/, '')
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#1a1d1b">
<title>Pipeline Job Tracker</title>
<style>:root{color-scheme:light}html,body{margin:0}body{font:14px system-ui,-apple-system,"Segoe UI",sans-serif;background:#f6f5f1}</style>
</head>
<body>
<noscript><p style="padding:24px;font:16px system-ui">This app needs JavaScript. Please enable it and reload.</p></noscript>
${frag}
</body>
</html>
`
fs.writeFileSync('dist-demo/Pipeline-Job-Tracker.html', html)
console.log(`Pipeline-Job-Tracker.html: ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB`)
