# CV generator

Builds `assets/docs/Mostafa-Taha-CV.pdf` from `content/site.json` (profile, experience, clients, skills…) plus the key projects list in `build.py`.

```
python3 tools/cv/build.py
cd tools/cv && node pdf.js && mv Mostafa-Taha-CV.pdf ../../assets/docs/
```
