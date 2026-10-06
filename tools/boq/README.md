# BOQ PDFs

Turns the renovation BOQ workbooks into site-styled Arabic PDFs (unit prices and totals are dropped).

```
python3 tools/boq/build.py <file.xlsx> <slug> "<English branch>" "<Arabic branch>"
node tools/boq/pdf.js <slug>     # -> assets/docs/boq-<slug>.pdf
```
