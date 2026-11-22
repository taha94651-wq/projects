# Generates a small share page per project (p/<id>/index.html) so links sent on WhatsApp / LinkedIn
# show the project's own title, description and image instead of the portfolio card.
# The page sends a visitor straight on to the project inside the site, keeping ?view= / ?lang=.
#   python3 tools/share/build.py      (re-run after adding or renaming projects)
import json, os, html, re
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
LIVE = 'https://taha94651-wq.github.io/projects/'
D = json.load(open(os.path.join(ROOT, 'content/projects.json'), encoding='utf8'))['projects']
S = json.load(open(os.path.join(ROOT, 'content/site.json'), encoding='utf8'))
NAME = S['profile']['name']['en']
e = lambda s: html.escape(s or '', quote=True)
os.makedirs(os.path.join(ROOT, 'assets/og'), exist_ok=True)

def og_image(p):
    src = p.get('cover') or next((m['src'] for m in p.get('media', []) if m.get('type') == 'image' and m.get('src')), '') \
        or next((m.get('poster') for m in p.get('media', []) if m.get('poster')), '')
    f = os.path.join(ROOT, src) if src else ''
    if not f or not os.path.isfile(f): return 'assets/images/og-card.jpg'
    im = Image.open(f).convert('RGB'); W, H = 1200, 630
    s = max(W / im.width, H / im.height); im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    x, y = (im.width - W) // 2, (im.height - H) // 2
    out = f'assets/og/{p["id"]}.jpg'; im.crop((x, y, x + W, y + H)).save(os.path.join(ROOT, out), quality=80, optimize=True, progressive=True)
    return out

n = 0
for p in D:
    en, ar = p['title'].get('en', ''), p['title'].get('ar', '')
    title = f'{en} · {ar} — {NAME}' if ar and ar != en else f'{en} — {NAME}'
    meta = ' · '.join(x for x in [p.get('location', {}).get('en', ''), p.get('area', ''), p.get('year', '')] if x)
    desc = re.sub(r'\s+', ' ', (p.get('summary') or {}).get('en', '')).strip()
    desc = (meta + ' — ' if meta else '') + (desc[:220].rsplit(' ', 1)[0] + '…' if len(desc) > 220 else desc)
    img = LIVE + og_image(p); url = LIVE + f'p/{p["id"]}/'
    page = f'''<!doctype html><html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="{e(NAME)} — Portfolio" />
<meta property="og:title" content="{e(title)}" />
<meta property="og:description" content="{e(desc)}" />
<meta property="og:url" content="{url}" />
<meta property="og:image" content="{img}" />
<meta property="og:image:secure_url" content="{img}" />
<meta property="og:image:type" content="image/jpeg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="{e(title)}" />
<meta name="twitter:description" content="{e(desc)}" />
<meta name="twitter:image" content="{img}" />
<link rel="canonical" href="{LIVE}#/p/{p["id"]}" />
<script>location.replace("../../" + location.search + "#/p/{p["id"]}");</script>
<meta http-equiv="refresh" content="0; url=../../#/p/{p["id"]}" />
</head><body style="background:#0b0b0a;color:#efebe4;font-family:sans-serif;padding:40px">
<a style="color:#b8965a" href="../../#/p/{p["id"]}">{e(en)}</a></body></html>
'''
    d = os.path.join(ROOT, 'p', p['id']); os.makedirs(d, exist_ok=True)
    open(os.path.join(d, 'index.html'), 'w', encoding='utf8').write(page); n += 1
print(n, 'share pages written')
