# Mostafa Taha — Portfolio

موقع بورتفوليو شخصي (عربي / إنجليزي) — HTML و CSS و JavaScript من غير أي مكتبات أو خطوات بناء.

## الملفات

| الملف | الوظيفة |
|---|---|
| `data.js` | **كل محتوى الموقع** — ده الملف الوحيد اللي بتعدّل فيه |
| `assets/images` | صور المشاريع وصورتك الشخصية |
| `assets/videos` | فيديوهات المشاريع (mp4) |
| `assets/cv` | ملف الـ CV للتحميل |
| `index.html`, `styles.css`, `app.js` | الشكل والبرمجة — مش محتاج تلمسهم |

## إضافة مشروع

1. حط صور المشروع في `assets/images` (يفضل ‎.jpg بعرض حوالي 2000px وحجم أقل من 500KB).
2. افتح `data.js` وانسخ أي مشروع جوه `projects` وعدّل بياناته.
3. `disciplines`: ‏`["execution"]` أو `["design"]` أو الاتنين — بيحدد القسم.
4. `type`: ‏`retail` / `gym` / `residential` / `offices` / `events`.
5. أي خانة تسيبها فاضية `""` مش هتظهر، وأي صورة فاضية هيظهر مكانها صورة مؤقتة.

## اللينكات

- الموقع بالإنجليزي: `…/?lang=en` — بالعربي: `…/?lang=ar`
- لينك مباشر لمشروع: `…/#/p/assaf-perfumes`

## التشغيل على جهازك

افتح `index.html` في المتصفح مباشرة، أو:

```bash
python3 -m http.server 8000
```

## النشر (GitHub Pages)

Settings ← Pages ← Source: *Deploy from a branch* ← اختار الفرع والفولدر `/ (root)`.
