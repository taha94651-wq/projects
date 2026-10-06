# Turns the renovation BOQ workbooks into site-styled PDFs (prices removed).
# usage: python3 build.py <xlsx> <slug> "<English branch>" "<Arabic branch>"  -> writes <slug>.html (render with pdf.js)
import sys, os, io, base64, html, openpyxl
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
src, slug, br_en, br_ar = sys.argv[1:5]
wb = openpyxl.load_workbook(src)           # formulas and images
e = lambda s: html.escape(str(s or '')).replace('\n', '<br>')
def font(name, fam, w): return f'@font-face{{font-family:{fam};font-weight:{w};src:url(data:font/woff2;base64,{base64.b64encode(open(os.path.join(HERE,name),"rb").read()).decode()}) format("woff2")}}'
def thumb(img):
    im = Image.open(io.BytesIO(img._data())).convert('RGB'); im.thumbnail((360, 360))
    b = io.BytesIO(); im.save(b, 'JPEG', quality=72); return 'data:image/jpeg;base64,' + base64.b64encode(b.getvalue()).decode()

packages = []; total = 0
for ws in wb.worksheets[1:]:
    imgs = {}
    for im in getattr(ws, '_images', []):
        r = im.anchor._from.row + 1; imgs.setdefault(r, []).append(thumb(im))
    rows = []; sub = ''
    for i, r in enumerate(ws.iter_rows(values_only=True), start=1):
        r = list(r) + [None] * 8
        if i == 1: continue
        if isinstance(r[0], (int, float)) and not r[3] and (r[1] or r[2]):   # sub-heading row
            sub = r[2] or r[1]; rows.append(('h', sub)); continue
        if isinstance(r[0], (int, float)) and r[2] and r[3] is not None:
            rows.append(('i', int(r[0]), r[1], r[2], r[3], r[4], imgs.get(i, [])))
    n = sum(1 for x in rows if x[0] == 'i'); total += n
    if n: packages.append((ws.title, n, rows))

qty = lambda q: (f'{q:g}' if isinstance(q, (int, float)) else e(q))
body = ''
for k, (title, n, rows) in enumerate(packages, 1):
    trs = ''
    for x in rows:
        if x[0] == 'h': trs += f'<tr class="sub"><td colspan="5">{e(x[1])}</td></tr>'; continue
        _, no, item, desc, q, u, ims = x
        pics = ''.join(f'<img src="{s}">' for s in ims[:2])
        trs += f'<tr><td class="no">{no}</td><td class="it"><b>{e(item)}</b>{e(desc)}</td><td class="q">{qty(q)}</td><td class="u">{e(u)}</td><td class="im">{pics}</td></tr>'
    body += f'''<section class="pk"><div class="pkh"><span>{k:02d}</span><h2>{e(title)}</h2><em>{n} بند</em></div>
<table><thead><tr><th>#</th><th>البند والوصف</th><th>الكمية</th><th>الوحدة</th><th>لقطات توضيحية</th></tr></thead><tbody>{trs}</tbody></table></section>'''

toc = ''.join(f'<li><span>{k:02d}</span>{e(t)}<em>{n} بند</em></li>' for k, (t, n, _) in enumerate(packages, 1))
page = f'''<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>BOQ — {e(br_en)}</title><style>
{font("almarai-arabic-300-normal.woff2","A",300)}{font("almarai-arabic-400-normal.woff2","A",400)}{font("almarai-arabic-700-normal.woff2","A",700)}{font("hanken-grotesk-latin-400-normal.woff2","H",400)}
@page {{ size:A4; margin:0; }}
.page {{ padding:12mm 13mm; -webkit-box-decoration-break:clone; box-decoration-break:clone; }}
:root {{ --bg:#efebe4; --fg:#0b0b0a; --muted:rgba(11,11,10,.55); --line:rgba(11,11,10,.16); --gold:#b8965a; }}
html,body {{ margin:0; background:var(--bg); color:var(--fg); font-family:H,A,sans-serif; font-size:8pt; line-height:1.55; -webkit-print-color-adjust:exact; print-color-adjust:exact; }}
.cover {{ padding:4mm 0 8mm; border-bottom:.6pt solid var(--line); margin-bottom:6mm; }}
.top {{ display:flex; justify-content:space-between; font-family:H; font-size:7pt; letter-spacing:.16em; text-transform:uppercase; color:var(--muted); direction:ltr; padding-bottom:5mm; border-bottom:.6pt solid var(--line); margin-bottom:8mm; }}
h1 {{ font-weight:400; font-size:28pt; line-height:1.15; margin:0 0 2mm; }} h1 small {{ display:block; font-family:H; font-size:12pt; color:var(--muted); }}
.lead {{ font-size:10pt; font-weight:300; max-width:150mm; margin:4mm 0 6mm; }}
.stats {{ display:flex; gap:12mm; margin-bottom:6mm; }} .stats div b {{ display:block; font-family:H; font-size:22pt; font-weight:400; color:var(--gold); }} .stats div {{ color:var(--muted); }}
.toc {{ list-style:none; margin:0; padding:0; }} .toc li {{ display:flex; gap:4mm; padding:2mm 0; border-top:.6pt solid var(--line); font-size:10pt; }} .toc li span {{ color:var(--gold); font-family:H; font-size:8pt; padding-top:.6mm; }} .toc li em {{ margin-right:auto; font-style:normal; color:var(--muted); font-size:8pt; }}
.pk {{ margin-top:7mm; }} .pk + .pk {{ break-before:page; margin-top:0; }}
.pkh {{ display:flex; align-items:baseline; gap:4mm; padding-bottom:3mm; border-bottom:.6pt solid var(--fg); }} .pkh span {{ font-family:H; color:var(--gold); }} .pkh h2 {{ margin:0; font-size:15pt; font-weight:400; }} .pkh em {{ margin-right:auto; font-style:normal; color:var(--muted); }}
table {{ width:100%; border-collapse:collapse; }} th {{ text-align:right; font-weight:400; font-size:7pt; color:var(--muted); padding:2mm 1.5mm; border-bottom:.6pt solid var(--line); }}
td {{ vertical-align:top; padding:2.2mm 1.5mm; border-bottom:.6pt solid var(--line); }} tr {{ break-inside:avoid; }} thead {{ display:table-header-group; }}
.no {{ width:7mm; color:var(--gold); font-family:H; }} .it b {{ display:block; font-weight:700; margin-bottom:.8mm; }} .it {{ color:rgba(11,11,10,.82); }}
.q {{ width:13mm; font-family:H; font-size:9.5pt; text-align:center; }} .u {{ width:13mm; color:var(--muted); text-align:center; }}
.im {{ width:36mm; }} .im img {{ width:34mm; max-height:26mm; object-fit:cover; display:block; margin-bottom:1mm; border-radius:1mm; }}
tr.sub td {{ background:rgba(11,11,10,.04); font-weight:700; }}
.foot {{ margin-top:6mm; color:var(--muted); font-size:7pt; direction:ltr; display:flex; justify-content:space-between; font-family:H; }}
</style></head><body><div class="page">
<div class="cover"><div class="top"><span>Makhazen Al Enaya — Makeup Section Renovation</span><span>Bill of Quantities</span></div>
<h1>جدول الكميات — {e(br_ar)}<small>Bill of Quantities — {e(br_en)}</small></h1>
<p class="lead">جدول كميات ومواصفات أعمال ترميم قسم الميكب وفق الهوية الجديدة، مقسّم إلى حزم أعمال، لكل بند وصف فني وكمية ووحدة قياس ولقطات توضيحية من التصميم. الأسعار محذوفة من هذه النسخة.</p>
<div class="stats"><div><b>{total}</b>بند</div><div><b>{len(packages)}</b>حزم أعمال</div></div>
<ul class="toc">{toc}</ul></div>
{body}
<div class="foot"><span>Prepared by Mostafa Taha — prices removed</span><span>taha94651-wq.github.io/projects</span></div>
</div></body></html>'''
open(os.path.join(HERE, slug + '.html'), 'w').write(page)
print(slug, total, [(t, n) for t, n, _ in packages])
