# Builds tools/cv/cv.html from content/site.json in the style of the site's Profile section.
# Render to PDF with: node tools/cv/pdf.js  (writes assets/docs/Mostafa-Taha-CV.pdf)
import json, html, os, io, base64
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
S = json.load(open(os.path.join(ROOT, 'content/site.json')))
P = S['profile']; e = lambda s: html.escape(s or '')
en = lambda v: v.get('en', '') if isinstance(v, dict) else (v or '')
PORTFOLIO = 'https://taha94651-wq.github.io/projects/'

def b64(path, mime):
    return f'data:{mime};base64,' + base64.b64encode(open(path, 'rb').read()).decode()

def qr_svg(url):
    import qrcode, qrcode.image.svg
    buf = io.BytesIO(); qrcode.make(url, image_factory=qrcode.image.svg.SvgPathImage, border=0).save(buf)
    return 'data:image/svg+xml;base64,' + base64.b64encode(buf.getvalue()).decode()

# key projects: (name, scope, place, year)
projects = [
 ('BEOND Office', 'Office fit-out execution for the premium airline: blockwork, MEP, floor slab — in progress', 'Al Nafel, Riyadh', '2026'),
 ('Makhazen Al Enaya', '13 branches: 7 new branches, 6 makeup-section renovations, a 17-unit display catalogue, 265-item BOQs; units executed in 4 branches', 'Riyadh · Jeddah · Dammam · Al Khobar · Abha · Qassim', '2026'),
 ('ASSAF', 'Display units in 11 branches: shop drawings, sample boards, full supervision; Galeria Mall booth; campaign set', 'KSA', '2026'),
 ('Private villa — project controls', 'Project structure, 50-activity programme, 16 procurement schedules; AI-built client approval tools', 'Al Nakheel, Riyadh', '2026'),
 ('Al Fakhriya Palace', '630 m² private palace — fit-out execution, backlit onyx island and feature wall', 'Safana Architects', '2024'),
 ('Al Zahrani Office', '120 m² executive office — walnut joinery, backlit shelving, bespoke marble desk', 'Al Malqa, Riyadh', '2025'),
 ('Al Nakheel Villa', '490 m², VIP client — business development, pricing, execution and furniture', 'Riyadh', '2025'),
 ('Sayl 31 Apartment', '160 m² — design to handover: concept, drawings, pricing, execution', 'Al Nada, Riyadh', '2024'),
 ('Fitness Time Ladies · Old School Gym', 'Gym fit-out: pricing, execution and handover', 'Riyadh', '2025'),
 ('Laverne', 'In-mall booth: specification, pricing, fabrication and installation in 10 days', 'Cenomi Al Nakheel Mall', '2026'),
]

row = lambda label, body, cls='': f'<section class="row {cls}"><div class="lab">{label}</div><div class="body">{body}</div></section>'
clients = ''.join(f'<div class="cl"><b>{e(en(c["name"]))}</b><span>{e(en(c["sector"]))}</span></div>' for c in S['clients'])
exp = ''.join(f'''<div class="job"><div class="per">{e(en(x["period"]))}</div><div><h3>{e(en(x["role"]))}</h3><p class="co">{e(en(x["company"]))}</p>
<ul>{"".join(f"<li>{e(en(p))}</li>" for p in x["points"])}</ul></div></div>''' for x in S['experience'])
proj = ''.join(f'<div class="pj"><div class="n">{i+1:02d}</div><div><b>{e(a)}</b><p>{e(b)}</p></div><div class="pl">{e(c)}</div><div class="yr">{e(d)}</div></div>' for i,(a,b,c,d) in enumerate(projects))
edu = ''.join(f'<div class="ed"><b>{e(en(x["title"]))}</b><span>{e(x.get("period",""))}</span></div>' for x in S['education'])
skills = ''.join(f'<div><h4>{e(en(g["group"]))}</h4><div class="chips">{"".join(f"<span>{e(i)}</span>" for i in g["items"])}</div></div>' for g in S['skills'])
soft = ''.join(f'<div><h4>{e(en(g["group"]))}</h4><div class="chips">{"".join(f"<span>{e(i)}</span>" for i in g["items"])}</div></div>' for g in S['software'])
langs = ''.join(f'<div class="ed"><b>{e(en(l["name"]))}</b><span>{e(en(l["level"]))}</span></div>' for l in S['languages'])
links = ''.join(f'<div class="ed"><b>{e(s["label"])}</b><a href="{e(s["url"])}">{e(s["url"].replace("https://www.","").replace("https://",""))}</a></div>' for s in P['socials'])
font = lambda w: f'@font-face{{font-family:H;font-weight:{w};src:url({b64(os.path.join(HERE,f"hanken-grotesk-latin-{w}-normal.woff2"),"font/woff2")}) format("woff2")}}'
photo = b64(os.path.join(ROOT, P['photo']), 'image/jpeg')

page = f'''<!doctype html><html><head><meta charset="utf-8"><title>Mostafa Taha — CV</title><style>
{font(300)}{font(400)}{font(500)}
@page {{ size: A4; margin: 0; }}
:root {{ --bg:#efebe4; --fg:#0b0b0a; --muted:rgba(11,11,10,.55); --line:rgba(11,11,10,.16); --gold:#b8965a; }}
* {{ box-sizing:border-box; }}
html,body {{ margin:0; background:var(--bg); color:var(--fg); font-family:H,"Liberation Sans",sans-serif; font-weight:400; font-size:8.4pt; line-height:1.4; -webkit-print-color-adjust:exact; print-color-adjust:exact; }}
.page {{ padding:13mm 15mm 11mm; -webkit-box-decoration-break:clone; box-decoration-break:clone; }}
.top {{ display:flex; justify-content:space-between; font-size:7pt; letter-spacing:.16em; text-transform:uppercase; color:var(--muted); padding-bottom:6mm; border-bottom:.6pt solid var(--line); }}
.hero {{ display:grid; grid-template-columns:34mm 1fr 22mm; gap:8mm; align-items:center; padding:5mm 0; border-bottom:.6pt solid var(--line); }}
.hero img.ph {{ width:34mm; height:34mm; border-radius:50%; object-fit:cover; background:#fff; }}
h1 {{ font-weight:400; font-size:34pt; line-height:.95; letter-spacing:-.03em; margin:0 0 3mm; }}
.sub {{ font-size:10.5pt; color:var(--muted); margin:0 0 3mm; }} .sub i {{ font-style:normal; color:var(--gold); }}
.contact {{ font-size:8pt; color:var(--muted); }} .contact b {{ color:var(--fg); font-weight:500; }} a {{ color:inherit; text-decoration:none; }}
.qr {{ text-align:center; font-size:6.5pt; letter-spacing:.12em; text-transform:uppercase; color:var(--muted); }} .qr img {{ width:24mm; height:24mm; display:block; margin:0 auto 2mm; }}
.row {{ display:grid; grid-template-columns:34mm 1fr; gap:6mm; padding:3.8mm 0; border-bottom:.6pt solid var(--line); }}
.lab {{ font-size:7pt; letter-spacing:.18em; text-transform:uppercase; color:var(--muted); padding-top:1mm; }}
.summary {{ font-size:10pt; line-height:1.4; font-weight:300; letter-spacing:-.005em; margin:0; }}
.clients {{ display:grid; grid-template-columns:repeat(3,1fr); }} .cl {{ border-top:.6pt solid var(--line); padding:1.5mm 3mm 1.5mm 0; break-inside:avoid; }}
.cl b {{ display:block; font-weight:400; font-size:11pt; letter-spacing:-.01em; }} .cl span {{ color:var(--muted); font-size:7.5pt; }}
.job {{ display:grid; grid-template-columns:24mm 1fr; gap:5mm; padding:0 0 3mm; margin-bottom:3mm; border-bottom:.6pt solid var(--line); }} .job li, .job h3 {{ break-inside:avoid; }} .job h3 {{ break-after:avoid; }} .job:last-child {{ border:0; margin:0; padding:0; }}
.per {{ color:var(--muted); font-size:7.8pt; padding-top:1mm; }}
h3 {{ font-weight:400; font-size:12pt; letter-spacing:-.01em; margin:0; }} .co {{ color:var(--muted); margin:0 0 2mm; }}
ul {{ margin:0; padding:0; list-style:none; }} .job li {{ position:relative; padding-left:4mm; margin-bottom:.6mm; color:rgba(11,11,10,.8); }} .job li:before {{ content:"—"; position:absolute; left:0; color:var(--gold); }}
.pj {{ display:grid; grid-template-columns:7mm 1fr 38mm 10mm; gap:4mm; padding:1.4mm 0; border-top:.6pt solid var(--line); break-inside:avoid; }}
.pj .n {{ color:var(--gold); font-size:7.5pt; padding-top:.8mm; }} .pj b {{ font-weight:400; font-size:10.5pt; }} .pj p {{ margin:.6mm 0 0; color:var(--muted); }}
.pj .pl, .pj .yr {{ color:var(--muted); font-size:7.8pt; padding-top:.8mm; }} .pj .yr {{ text-align:right; }}
.ed {{ display:flex; justify-content:space-between; gap:6mm; padding:1.6mm 0; border-top:.6pt solid var(--line); }} .ed b {{ font-weight:400; font-size:10pt; }} .ed span, .ed a {{ color:var(--muted); }}
.two {{ display:grid; grid-template-columns:1fr 1fr; gap:8mm; }}
h4 {{ font-size:7pt; letter-spacing:.16em; text-transform:uppercase; font-weight:500; margin:0 0 2mm; }}
.list li {{ padding:1.5mm 0; border-top:.6pt solid var(--line); }}
.chips {{ display:flex; flex-wrap:wrap; gap:1.6mm; }} .chips span {{ border:.6pt solid var(--line); border-radius:99px; padding:.6mm 2.4mm; font-size:7.4pt; }}
.keep {{ break-inside:avoid; }}
.kf {{ display:grid; grid-template-columns:repeat(4,1fr); gap:4mm; }} .kf b {{ display:block; font-weight:300; font-size:22pt; line-height:1; color:var(--gold); }} .kf span {{ color:var(--muted); font-size:7.6pt; }}
.foot {{ display:flex; justify-content:space-between; padding-top:5mm; font-size:7pt; color:var(--muted); letter-spacing:.06em; }}
</style></head><body><div class="page">
<div class="top"><span>{e(en(P["title"]))}</span><span>{e(en(P["location"]))}</span></div>
<div class="hero"><img class="ph" src="{photo}" alt=""><div><h1>{e(en(P["name"]))}</h1>
<p class="sub">Fit-Out Manager <i>| Architect</i></p>
<div class="contact"><b>{e(P["phone"])}</b> · <a href="mailto:{e(P["email"])}">{e(P["email"])}</a><br>Portfolio: <a href="{PORTFOLIO}"><b>{PORTFOLIO.replace("https://","").rstrip("/")}</b></a></div></div>
<div class="qr"><img src="{qr_svg(PORTFOLIO)}" alt="">Portfolio</div></div>
{row("About", f'<p class="summary">{e(en(P["summary"]))}</p>')}
{row("Key figures", '<div class="kf">' + ''.join(f'<div><b>{e(x["value"])}</b><span>{e(en(x["label"]))}</span></div>' for x in P.get("stats", [])) + '</div>', "keep")}
{row("Major clients", f'<div class="clients">{clients}</div>', "keep")}
{row("Experience", exp)}
{row("Key projects", proj)}
{row("Education", edu, "keep")}
{row("Skills", f'<div class="two">{skills}</div>', "keep")}
{row("Software", f'<div class="two">{soft}</div>', "keep")}
{row("Languages · Online", f'<div class="two"><div>{langs}</div><div>{links}</div></div>', "keep")}
<div class="foot"><span>{e(en(P["name"]))} — CV</span><span>{PORTFOLIO.replace("https://","").rstrip("/")}</span></div>
</div></body></html>'''
open(os.path.join(HERE, 'cv.html'), 'w').write(page)
print('cv.html written')
