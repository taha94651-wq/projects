# Builds the CV HTML from content/site.json (the same data the site shows), plus key projects.
import json, html
S = json.load(open('/home/user/projects/content/site.json'))
P = S['profile']; e = lambda s: html.escape(s or '')
en = lambda v: v.get('en', '') if isinstance(v, dict) else (v or '')
PORTFOLIO = 'taha94651-wq.github.io/projects'
projects = [
 ('BEOND Office', 'Al Nafel, Riyadh — ground-floor office fit-out for the premium airline: execution (in progress)'),
 ('Makhazen Al Enaya', '13 branches: 7 new branches designed to the new brand identity, 6 makeup-section renovations, a 17-unit display catalogue, and display units executed in 4 branches'),
 ('ASSAF', '11 branches across KSA: display units with shop drawings, sample boards and full supervision; Galeria Mall booth; campaign photo booth'),
 ('Al Fakhriya Palace', '630 m² private palace: fit-out execution with backlit onyx island and feature wall (Safana)'),
 ('Al Nakheel Villa', '490 m², VIP client, Riyadh: business development, pricing, execution and furniture'),
 ('Sayl 31 Apartment', '160 m², Riyadh: design to handover — concept, drawings, pricing and execution'),
 ('Fitness Time Ladies & Old School Gym', 'Gym fit-out: pricing, execution and handover'),
 ('Laverne', 'In-mall booth at Cenomi Al Nakheel Mall: specification, pricing, fabrication and installation in 10 days'),
 ('Rasees & Beluar', 'Brand events, Tuwaiq: material selection and execution supervision'),
]
exp = ''.join(f'''<div class="job"><div class="jh"><div><b>{e(en(x['role']))}</b> — {e(en(x['company']))}</div><span>{e(en(x['period']))}</span></div>
<ul>{''.join(f"<li>{e(en(p))}</li>" for p in x['points'])}</ul></div>''' for x in S['experience'])
edu = ''.join(f'<div class="jh"><b>{e(en(x["title"]))}</b><span>{e(x.get("period",""))}</span></div>' for x in S['education'])
proj = ''.join(f'<li><b>{e(a)}</b> — {e(b)}</li>' for a, b in projects)
clients = ' · '.join(e(en(c['name'])) for c in S['clients'])
skills = ''.join(f'<div><h3>{e(en(g["group"]))}</h3><ul class="cols">{"".join(f"<li>{e(i)}</li>" for i in g["items"])}</ul></div>' for g in S['skills'])
soft = ''.join(f'<p><b>{e(en(g["group"]))}:</b> {e(" · ".join(g["items"]))}</p>' for g in S['software'])
langs = ' · '.join(f'{e(en(l["name"]))} ({e(en(l["level"]))})' for l in S['languages'])
links = '<br>'.join(f'{e(s["label"])}: <a href="{e(s["url"])}">{e(s["url"].replace("https://",""))}</a>' for s in P['socials'])
page = f'''<!doctype html><html><head><meta charset="utf-8"><style>
@page {{ size: A4; margin: 16mm 16mm 14mm; }}
* {{ box-sizing: border-box; }}
body {{ font-family: "Liberation Sans", Arial, sans-serif; color: #141412; font-size: 9.6pt; line-height: 1.42; margin: 0; }}
header {{ border-bottom: 1.5pt solid #141412; padding-bottom: 10pt; margin-bottom: 12pt; }}
h1 {{ font-size: 28pt; font-weight: 400; letter-spacing: -0.5pt; margin: 0 0 2pt; }}
.title {{ font-size: 12pt; margin: 0 0 8pt; }} .title span {{ color: #b8965a; }}
.contact {{ font-size: 8.8pt; color: #555; }} .contact a {{ color: #555; text-decoration: none; }}
a {{ color: #141412; }}
.contact b {{ color: #141412; font-weight: 400; }}
h2 {{ font-size: 8.5pt; letter-spacing: 1.6pt; text-transform: uppercase; color: #b8965a; margin: 14pt 0 6pt; padding-bottom: 3pt; border-bottom: 0.5pt solid #ddd; break-after: avoid; }}
h3 {{ font-size: 9pt; margin: 4pt 0 3pt; }}
p {{ margin: 0 0 4pt; }} ul {{ margin: 2pt 0 0; padding-left: 13pt; }} li {{ margin: 0 0 2pt; }}
.jh {{ display: flex; justify-content: space-between; gap: 12pt; }} .jh span {{ color: #666; white-space: nowrap; }}
.job {{ margin-bottom: 8pt; break-inside: avoid; }}
.cols {{ columns: 2; column-gap: 18pt; }}
.skills {{ display: grid; grid-template-columns: 1fr 1fr; gap: 16pt; }} .skills .cols {{ columns: 1; }}
.kp {{ break-inside: avoid; }}
.clients {{ font-size: 9.8pt; }}
</style></head><body>
<header><h1>{e(en(P['name']))}</h1><p class="title">Fit-Out Manager <span>| Architect</span></p>
<div class="contact"><b>{e(P['phone'])}</b> · <a href="mailto:{e(P['email'])}">{e(P['email'])}</a> · {e(en(P['location']))} · Portfolio: <a href="https://{PORTFOLIO}/"><b>{PORTFOLIO}</b></a></div></header>
<p>{e(en(P['summary']))}</p>
<h2>Key clients</h2><p class="clients">{clients}</p>
<h2>Work experience</h2>{exp}
<section class="kp"><h2>Key projects</h2><ul>{proj}</ul></section>
<h2>Education</h2>{edu}
<h2>Skills</h2><div class="skills">{skills}</div>
<h2>Software</h2>{soft}
<h2>Languages</h2><p>{langs}</p>
<h2>Online</h2><p>{links}</p>
</body></html>'''
open(__import__('os').path.join(__import__('os').path.dirname(__file__), 'cv.html'), 'w').write(page)
