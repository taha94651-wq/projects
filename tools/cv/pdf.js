const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file://' + process.cwd() + '/cv.html'); await p.pdf({ path: 'Mostafa-Taha-CV.pdf', format: 'A4', printBackground: true, preferCSSPageSize: true });
  await b.close(); console.log('ok'); })();
