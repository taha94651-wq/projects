# CV generator

Builds `assets/docs/Mostafa-Taha-CV.pdf` in the style of the site's Profile section, from `content/site.json` (profile, photo, clients, experience, skills, software, languages, links) plus the key-projects list in `build.py`. Fonts (Hanken Grotesk) and the portfolio QR code are embedded.

```
python3 tools/cv/build.py
node tools/cv/pdf.js      # needs Playwright
```
