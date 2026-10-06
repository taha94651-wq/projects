// node pdf.js <slug> -> ../../assets/docs/boq-<slug>.pdf
const path = require('path'); const { chromium } = require('playwright');
(async () => { const s = process.argv[2]; const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file://' + path.join(__dirname, s + '.html')); await p.evaluate(() => document.fonts.ready);
  await p.pdf({ path: path.join(__dirname, '../../assets/docs/boq-' + s + '.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true });
  await b.close(); console.log('pdf', s); })();
