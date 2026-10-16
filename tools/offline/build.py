# Builds a single self-contained HTML of the portfolio (for Google Drive / offline sharing).
# Images are downscaled and embedded; videos, PDFs, Excel files and demo tools link to the live site.
#   python3 tools/offline/build.py   ->  dist/Mostafa-Taha-Portfolio.html
import json, os, re, io, base64, sys
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
LIVE = 'https://taha94651-wq.github.io/projects/'
MAX = int(os.environ.get('MAXPX', 1100)); Q = int(os.environ.get('Q', 62))
rd = lambda p: open(os.path.join(ROOT, p), encoding='utf8').read()
cache = {}

def embed(path):
    if path in cache: return cache[path]
    f = os.path.join(ROOT, path)
    if not os.path.isfile(f): cache[path] = LIVE + path; return cache[path]
    im = Image.open(f); im.load()
    alpha = im.mode in ('RGBA', 'LA', 'P') and path.lower().endswith('.png')
    im.thumbnail((MAX, MAX))
    buf = io.BytesIO()
    if alpha: im.convert('RGBA').save(buf, 'PNG', optimize=True); mime = 'image/png'
    else: im.convert('RGB').save(buf, 'WEBP', quality=Q, method=6); mime = 'image/webp'
    cache[path] = f'data:{mime};base64,' + base64.b64encode(buf.getvalue()).decode()
    return cache[path]

def fix(v):
    if isinstance(v, dict): return {k: fix(x) for k, x in v.items()}
    if isinstance(v, list): return [fix(x) for x in v]
    if isinstance(v, str):
        if re.match(r'^assets/.+\.(jpe?g|png|webp)$', v, re.I): return embed(v)
        if re.match(r'^(assets/|demo/)', v): return LIVE + v
    return v

content = {n: fix(json.loads(rd(f'content/{n}.json'))) for n in ['site', 'projects', 'ai', 'photos', 'controls']}
html = rd('index.html'); css = rd('styles.css'); js = rd('app.js')
js = js.replace('const load = (f) => fetch(f, { cache: "no-cache" }).then((r) => {',
                'const load = (f) => (window.__CONTENT ? Promise.resolve(window.__CONTENT[f.replace(/^content\\/|\\.json$/g, "")]) : fetch(f, { cache: "no-cache" })).then((r) => { if (window.__CONTENT) return r;', 1)
assert 'window.__CONTENT' in js, 'loader patch failed'
data = json.dumps(content, ensure_ascii=False).replace('</', '<\\/')
html = html.replace('<link rel="stylesheet" href="styles.css" />', f'<style>\n{css}\n</style>')
jsx = js.replace('</script', '<\\/script')
html = html.replace('<script src="app.js"></script>', '<script>window.__CONTENT = ' + data + ';</script>\n<script>\n' + jsx + '\n</script>')
html = html.replace('<head>', f'<head>\n  <base target="_self" />\n  <!-- Offline copy of {LIVE} -->', 1)
os.makedirs(os.path.join(ROOT, 'dist'), exist_ok=True)
out = os.path.join(ROOT, 'dist', 'Mostafa-Taha-Portfolio.html')
open(out, 'w', encoding='utf8').write(html)
print(out, round(os.path.getsize(out) / 1e6, 1), 'MB,', len(cache), 'images')
