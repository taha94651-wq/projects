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
 ('BEOND Office', 'Office fit-out for the premium airline — in progress', 'Al Nafel, Riyadh', '2026'),
 ('Makhazen Al Enaya', '13 branches in 6 cities; 265-item BOQs', '6 KSA cities', '2026'),
 ('ASSAF', 'Display units in 11 branches; Galeria Mall booth', 'KSA', '2026'),
 ('Al Nakheel Villa', '490 m² VIP villa — pricing, execution, project controls', 'Al Nakheel, Riyadh', '2025'),
 ('Al Zahrani Office', '120 m² executive office — walnut joinery, marble desk', 'Al Malqa, Riyadh', '2025'),
 ('Fitness Time Ladies · Old School Gym', 'Gym fit-outs — pricing, execution and handover', 'Riyadh', '2025'),
 ('Al Fakhriya Palace', '630 m² private palace — onyx island and feature wall', 'Al Fakhriya', '2024'),
]

# CV-only curation (the site keeps the full lists)
CV_ABOUT = 'Fit-Out Manager with an architectural background and 5+ years in commercial and residential fit-out — retail chains, offices, gyms and villas in Riyadh. Manages projects end to end: client brief, design coordination, material selection, pricing, site execution and handover, with a specialism in joinery and furniture production.'
CV_SKILLS = [
 ('Management & Commercial', ['Fit-Out Project Management', 'Team Leadership', 'Cost Estimation & Pricing', 'Value Engineering', 'Tendering & Negotiation', 'Variation Orders & Claims', 'Subcontractor Management', 'Business Development']),
 ('Technical', ['Shop Drawing Review', 'Joinery & Furniture Production', 'MEP Coordination with Finishes', 'Mall Landlord Approvals', 'Material Submittals', 'QA/QC & Snagging', 'Site Execution & Handover']),
]
CV_SOFT = [
 ('Management & AI', ['Microsoft Excel', 'Claude (Code, Excel)', 'ChatGPT', 'Nano Banana', 'Google Flow']),
 ('Design & Visualization', ['AutoCAD', 'Revit', '3ds Max', 'SketchUp', 'V-Ray', 'Corona', 'Lumion', 'Photoshop', 'Rhino']),
]
CV_POINTS = {
 'Fit-Out Manager': [
  'Turn client requirements into design briefs, review design output, and secure material approvals with sample boards and value engineering.',
  'Prepare concept-stage cost estimates and priced proposals with target margins; negotiate with subcontractors, suppliers and clients to close deals.',
  'Run sites end to end: subcontractors and suppliers, programmes, shop-drawing approval, finishing quality, snagging and handover.'],
 'Military Engineer': ['Supervised construction, renovation and finishing works on base; inspected and accepted contractor works and led on-site teams.'],
 'Architect & Supervisor (Business Development & Pricing)': [
  'Sourced new projects through a personal network of clients, design offices and developers; presented proposals and closed deals directly.',
  'Prepared pricing and tender submissions for fit-out and finishing works; maintained client relationships that generated repeat projects.',
  'Led the design team on incoming projects and reviewed architectural and shop drawings in the technical office.',
  'Supervised site execution of fit-out works through to handover.'],
 'Production & Fit-Out Engineer': [
  'Developed joinery shop drawings and supervised factory production (cutting, assembly, upholstery, paint) for a premium furniture brand.',
  'Managed installation and handover at 10+ client homes.'],
 'Architect & Supervisor': [
  'Developed interior concepts, construction drawings and 3D renders for client presentations.',
  'Supervised site execution to match the approved designs.'],
}

row = lambda label, body, cls='': f'<section class="row {cls}"><div class="lab">{label}</div><div class="body">{body}</div></section>'
cname = lambda c: ('<a href="%s">%s</a>' % (e(c["url"]), e(en(c["name"])))) if c.get("url") else e(en(c["name"]))
clients = ''.join(f'<div class="cl"><b>{cname(c)}</b><span>{e(en(c["sector"]))}</span></div>' for c in S['clients'])
exp = ''.join(f'''<div class="job"><div class="per">{e(en(x["period"]))}</div><div><h3>{e(en(x["role"]))}</h3><p class="co">{e(en(x["company"]))}</p>
<ul>{"".join(f"<li>{e(p)}</li>" for p in CV_POINTS.get(en(x["role"]), [en(q) for q in x["points"]]))}</ul></div></div>''' for x in S['experience'])
proj = ''.join(f'<div class="pj"><div class="n">{i+1:02d}</div><div><b>{e(a)}</b><p>{e(b)}</p></div><div class="pl">{e(c)}</div><div class="yr">{e(d)}</div></div>' for i,(a,b,c,d) in enumerate(projects))
edu = ''.join(f'<div class="ed"><b>{e(en(x["title"]))}</b><span>{e(x.get("period",""))}</span></div>' for x in S['education'])
certs = ''.join(f'<div class="ct"><b>{e(en(x["title"]))}</b><span>{e(en(x["issuer"]))} · {e(x.get("date",""))}</span></div>' for x in S.get('certifications', []) if 'Summer School' not in en(x["title"]))
skills = ''.join(f'<p class="sk"><b>{e(a)}</b>{" · ".join(e(i) for i in c)}</p>' for a, c in CV_SKILLS)
soft = ''.join(f'<p class="sk"><b>{e(a)}</b>{" · ".join(e(i) for i in c)}</p>' for a, c in CV_SOFT)
langs = ''.join(f'<div class="ed"><b>{e(en(l["name"]))}</b><span>{e(en(l["level"]))}</span></div>' for l in S['languages'])
links = ''.join(f'<div class="ed"><b>{e(s["label"])}</b><a href="{e(s["url"])}">{e(s["url"].replace("https://www.","").replace("https://",""))}</a></div>' for s in P['socials'] if s['label'].lower() != 'instagram')
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
.row {{ display:grid; grid-template-columns:34mm 1fr; gap:6mm; padding:2.5mm 0; border-bottom:.6pt solid var(--line); }}
.lab {{ font-size:7pt; letter-spacing:.18em; text-transform:uppercase; color:var(--muted); padding-top:1mm; }}
.summary {{ font-size:10pt; line-height:1.4; font-weight:300; letter-spacing:-.005em; margin:0; }}
.clients {{ display:grid; grid-template-columns:repeat(5,1fr); }} .cl {{ border-top:.6pt solid var(--line); padding:1.5mm 3mm 1.5mm 0; break-inside:avoid; }}
.cl a {{ color:inherit; text-decoration:none; }} .cl b {{ display:block; font-weight:400; font-size:9.6pt; letter-spacing:-.01em; }} .cl span {{ color:var(--muted); font-size:7.5pt; }}
.job {{ break-inside:avoid; display:grid; grid-template-columns:24mm 1fr; gap:5mm; padding:0 0 3mm; margin-bottom:3mm; border-bottom:.6pt solid var(--line); }} .job li, .job h3 {{ break-inside:avoid; }} .job h3 {{ break-after:avoid; }} .job:last-child {{ border:0; margin:0; padding:0; }}
.per {{ color:var(--muted); font-size:7.8pt; padding-top:1mm; }}
h3 {{ font-weight:400; font-size:12pt; letter-spacing:-.01em; margin:0; }} .co {{ color:var(--muted); margin:0 0 2mm; }}
ul {{ margin:0; padding:0; list-style:none; }} .job li {{ position:relative; padding-left:4mm; margin-bottom:.6mm; color:rgba(11,11,10,.8); }} .job li:before {{ content:"—"; position:absolute; left:0; color:var(--gold); }}
.pj {{ display:grid; grid-template-columns:7mm 1fr 38mm 10mm; gap:4mm; padding:1.4mm 0; border-top:.6pt solid var(--line); break-inside:avoid; }}
.pj .n {{ color:var(--gold); font-size:7.5pt; padding-top:.8mm; }} .pj b {{ font-weight:400; font-size:10.5pt; }} .pj p {{ margin:.6mm 0 0; color:var(--muted); }}
.pj .pl, .pj .yr {{ color:var(--muted); font-size:7.8pt; padding-top:.8mm; }} .pj .yr {{ text-align:right; }}
.stack {{ display:grid; gap:3mm; }}
.sk {{ margin:0; padding:1.5mm 0; border-top:.6pt solid var(--line); color:rgba(11,11,10,.8); }} .sk b {{ display:block; font-size:7pt; letter-spacing:.14em; text-transform:uppercase; font-weight:500; color:var(--fg); margin-bottom:.6mm; }}
.cts {{ display:grid; }} .ct {{ padding:1.4mm 0; border-top:.6pt solid var(--line); }} .ct b {{ display:block; font-weight:400; font-size:9.5pt; }} .ct span {{ color:var(--muted); font-size:8pt; }}
.ed {{ display:flex; justify-content:space-between; gap:6mm; padding:1.6mm 0; border-top:.6pt solid var(--line); }} .ed b {{ font-weight:400; font-size:10pt; }} .ed span, .ed a {{ color:var(--muted); }}
.two {{ display:grid; grid-template-columns:1fr 1fr; gap:8mm; }}
h4 {{ font-size:7pt; letter-spacing:.16em; text-transform:uppercase; font-weight:500; margin:0 0 2mm; }}
.list li {{ padding:1.5mm 0; border-top:.6pt solid var(--line); }}
.chips {{ display:flex; flex-wrap:wrap; gap:1.6mm; }} .chips span {{ border:.6pt solid var(--line); border-radius:99px; padding:.6mm 2.4mm; font-size:7.4pt; }}
.keep {{ break-inside:avoid; }}
.kf {{ display:grid; grid-template-columns:repeat(4,1fr); gap:4mm; }} .kf b {{ display:block; font-weight:300; font-size:22pt; line-height:1; color:var(--gold); }} .kf span {{ color:var(--muted); font-size:7.6pt; }}
.foot {{ display:flex; justify-content:space-between; padding-top:3mm; font-size:7pt; color:var(--muted); letter-spacing:.06em; }}
</style></head><body><div class="page">
<div class="top"><span>{e(en(P["title"]))}</span><span>{e(en(P["location"]))}</span></div>
<div class="hero"><img class="ph" src="{photo}" alt=""><div><h1>{e(en(P["name"]))}</h1>
<p class="sub">Fit-Out Manager <i>| Architect</i></p>
<div class="contact"><b>{e(P["phone"])}</b> · <a href="mailto:{e(P["email"])}">{e(P["email"])}</a><br>LinkedIn: <a href="https://www.linkedin.com/in/mostafa-taha-4b1198167"><b>linkedin.com/in/mostafa-taha-4b1198167</b></a><br>Behance: <a href="https://www.behance.net/mostafataha20"><b>behance.net/mostafataha20</b></a><br>Portfolio: <a href="{PORTFOLIO}"><b>{PORTFOLIO.replace("https://","").rstrip("/")}</b></a></div></div>
<div class="qr"><img src="{qr_svg(PORTFOLIO)}" alt="">Portfolio</div></div>
{row("About", f'<p class="summary">{e(CV_ABOUT)}</p>')}
{row("Key figures", '<div class="kf">' + ''.join(f'<div><b>{e(x["value"])}</b><span>{e(en(x["label"]))}</span></div>' for x in P.get("stats", [])) + '</div>', "keep")}
{row("Major clients", f'<div class="clients">{clients}</div>', "keep")}
{row("Experience", exp)}
{row("Key projects", proj)}
{row("Skills · Software", f'<div>{skills}{soft}</div>', "keep")}
{row("Education · Languages", f'<div><p class="sk"><b>Education</b>{" · ".join(e(en(x["title"])) + (" (" + e(x.get("period","")).replace(" ", "") + ")" if x.get("period") else "") for x in S["education"])}</p><p class="sk"><b>Certifications</b>{" · ".join(e(en(x["title"])) + " — " + e(en(x["issuer"])) + ", " + e(x.get("date","")) for x in S.get("certifications", []) if "Summer School" not in en(x["title"]))}</p><p class="sk"><b>Languages</b>{" · ".join(e(en(l["name"])) + " (" + e(en(l["level"])).lower() + ")" for l in S["languages"])}</p></div>', "keep")}

<div class="foot"><span>{e(en(P["name"]))} — CV</span><span>{PORTFOLIO.replace("https://","").rstrip("/")}</span></div>
</div></body></html>'''
open(os.path.join(HERE, 'cv.html'), 'w').write(page)
print('cv.html written')
