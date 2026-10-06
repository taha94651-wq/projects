// Renders tools/cv/cv.html to assets/docs/Mostafa-Taha-CV.pdf
const path = require('path'); const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file://' + path.join(__dirname, 'cv.html')); await p.evaluate(() => document.fonts.ready);
  await p.pdf({ path: path.join(__dirname, '../../assets/docs/Mostafa-Taha-CV.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true });
  await b.close(); console.log('pdf written'); })();
