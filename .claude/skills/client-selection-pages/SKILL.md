---
name: client-selection-pages
description: Build, extend or fix a client-facing Arabic (RTL) selection/approval page for the fit-out company (VIVID / PHZYN) and publish it on this repo's GitHub Pages. Use when the user sends items (xlsx/pdf/images) for a client to approve, choose options, or pick fabrics/carpets/lighting/chairs, or asks to add options, design shots or alternatives to an existing page.
---

# Client selection pages (Arabic, RTL, GitHub Pages)

Live pages in this repo (copy the closest one, do not start from zero):
- `murshid/` wardrobe accessories (cart-style picks) 
- `murshid-lighting/` lighting: one card per item, design shot + N options, client picks one or "none"
- `fabrics-bedrooms/` fabrics: designer's proposal, client decides ✓ approve / ✕ reject / ↻ pick another sample (photo + code)
- `carpets/` same flow as fabrics, grouped by floor
- `plants-comparison/` manager-facing quote comparison (not a client choice)

## Standing rules (from the user, all earlier sessions)
1. Arabic, right-to-left, Saudi-formal wording. Never "شوف/مفيش/ابعت/اختار". Force RTL (`html{direction:rtl}` plus a script setting `document.documentElement.dir`), because previews open as LTR.
2. Simple for the client: opens EMPTY on every visit (no saved state), result goes out as a picture table (canvas PNG via Web Share) or WhatsApp text, never forms with name/phone.
3. Use ONLY data the user sent. Never invent prices, specs, names, quantities. Say what was read from a ticket and ask to confirm.
4. Look: VIVID pages follow `plants-comparison` (Cairo + Barlow, black/orange/red, sticky nav, red-bar section titles); PHZYN pages follow `murshid-lighting`. No company name/logo when the user says so.
5. Item numbers and order of the user's source never change. Items without new data keep their old content; never hide or delete items. "فضّي الخيارات" means clear the options of that item, not remove the item.
6. One folder per task in the repo, link published on the user's github.io (works without Claude, `noindex`, Open Graph title/description/image for the WhatsApp preview; the title includes the project name).

## Workflow
1. Read the user's source. xlsx with pictures in cells: `unzip` and take `xl/media/*` plus `xl/richData` rels to map image to row. pdf: `pdfimages -png` and `pdftoppm -r 200`; map by position. Images sent in chat are saved under `/tmp/.../images/NN.ext`; read the highest numbers first. If a message has an image but no file path, the image was NOT saved: say so and ask for it as an attachment.
2. Tickets/labels: rotate/crop so the text is readable (check with Read), then transcribe catalog + code; show the user the values before relying on them.
3. Put data in one JSON/array (items → options → images). Options > 1 means "pick one"; a single alternative means approve/reject. Quantity and spec blocks are optional.
4. Build, then test with Playwright at 390px and 1280px: no horizontal scroll, no broken images, click through decisions, generate the PNG table, check the WhatsApp text.
5. Ship: branch from `origin/main` → commit → push → PR → merge (merge method `merge`). Pages takes 1–3 minutes.
6. Reply in Arabic with the live URL plus `?v=N` (bump N each time) so cached copies are bypassed, say exactly what changed, what was assumed, and what is still missing.

## Gotchas learned
- Gmail rewrites links in drafts through google.com; for clean links give a copy-paste page instead.
- github.io is blocked from the sandbox: verify via the `pages build` workflow status and by reading the merged files; the user's "not added" is almost always browser cache (use `?v=N`, private window).
- Image resolution: images extracted from xlsx/pdf are small (250–1000px); say so rather than upscale silently.
- When the user says "حط دول في 1 و 2" apply to every item named. When the item number is missing, infer from the previous message and state the assumption.
- Generate PDFs/presentations from the same HTML with Playwright (`preferCSSPageSize`), design big on the right, small shots on the left, ticket across the bottom (user's layout). Include the interactive link on the cover.
- Do not merge or rewrite old data: check the merged `main` with a script (items, option counts, files exist) before claiming "done".
