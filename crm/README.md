# Fit-Out CRM

A bilingual (English / Arabic with RTL) CRM dashboard for a fit-out, interior-construction and execution business in Saudi Arabia: leads, companies, drag-and-drop sales pipeline, projects & weighted pipeline, follow-ups, reports, and a Settings area where categories, stages, sources, dropdowns, custom fields and table columns are all editable data (no code changes).

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · shadcn-style components (Radix) · Recharts · React Hook Form + Zod · dnd-kit · Supabase (Postgres + Auth + RLS) · PapaParse / read-excel-file / write-excel-file.

This folder is self-contained; the portfolio site in the repository root is untouched.

## Run locally

```bash
cd crm
npm install
npm run dev          # http://localhost:3000
```

With no environment variables the app runs in **Local browser storage mode** (see below). The first launch creates the default configuration and loads clearly-flagged **demo data**.

```bash
npm run build && npm start   # production
npm run typecheck
npm test                     # unit tests (business logic, seed integrity, i18n key parity)
npm run e2e                  # browser test (needs `npm start -p 3100` running; uses Playwright + Chromium)
```

## Two storage modes (read this)

| Mode | When | What it really is |
|---|---|---|
| **Supabase database** | `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set | Real Postgres database, sign-in required, protected by Row Level Security. Shared across devices. |
| **Local browser storage** | variables missing | IndexedDB in *this* browser profile. Survives refresh / closing the browser, **but it is not a server database**: not shared between devices or people, and lost if site data is cleared. The UI says so in a banner, the sidebar and Settings → Data & backup. |

Use **Settings → Data & backup → Download full backup** regularly in either mode.

## Connect Supabase (real database)

1. Create a project at <https://supabase.com>.
2. Open **SQL Editor**, paste and run `supabase/migrations/0001_schema.sql` (tables, foreign keys, indexes, triggers, RLS policies).
3. **Authentication → Users → Add user** (email + password) for yourself and your staff. In **Authentication → Providers → Email** turn **off** “Allow new users to sign up” so nobody else can register.
4. Copy `.env.example` to `.env.local` and fill in **Project URL** and the **anon/public key** (Project Settings → API):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```
5. Restart `npm run dev`. You will be asked to sign in; defaults + demo data are created in your database on first sign-in.

**Security notes**
- Only the anon key is used in the browser. **Never** put the `service_role` key in this project or any `NEXT_PUBLIC_*` variable.
- RLS: every table has `owner_id default auth.uid()`; policies allow only `authenticated` users to touch rows where `owner_id = auth.uid()`. `anon` has no access. For a shared team workspace see the comment at the end of the SQL file.
- Deploying: set the same two variables in your host (Vercel, etc.). The app is a normal Next.js app (not suited to GitHub Pages as-is).

## Database schema (summary)

`settings`, `categories` (self-referencing `parent_id`: groups → services), `stages` (`kind` open/won/lost/hold), `options` (generic dropdown lists: source, priority, client type, assignee, size, industry, relationship, project type/status, activity type, loss reason, city), `custom_fields`, `companies` ← `contacts` (cascade), `leads` (→ company, stage, priority, source, assignee; unique `owner_id, code`), `projects` (→ company, lead, status), `activities` (→ lead, cascade). Referenced configuration rows use `on delete restrict`, so the database itself refuses to delete a stage/option that is still in use. Each row stores the indexed/foreign-key columns plus the full record in `data jsonb`.

## Implemented features

- **Dashboard**: 10 KPI cards + 6 interactive charts (category, stage, monthly acquisition, won vs lost, revenue by service, source performance), upcoming activities, recent leads. All recomputed from live data on every add/edit/delete/stage change. Stage→KPI mapping is configurable (Settings → Pipeline) so renaming stages never breaks statistics.
- **Leads**: all 27 requested fields + custom fields; validated form (Saudi phone formats, email, URL, numbers, dates); duplicate; delete with confirmation; search (company, contact, phone in any format, email, project, ID); filters (category/group, city, stage, priority, source, follow-up); sortable columns; pagination; multi-select bulk update/delete; CSV/Excel import with preview, validation and duplicate detection; CSV/Excel export of filtered or selected rows; detail page with chronological timeline, notes, multiple contacts.
- **Sales Pipeline**: 12-stage Kanban with drag-and-drop (mouse, touch, keyboard) plus a “move to stage” dropdown; moving to Won/Lost asks for outcome (final value, reason, notes). Stage changes are logged on the timeline.
- **Follow-Ups**: today / overdue / upcoming / meetings / site visits / calls & WhatsApp / emails sent / quotations awaiting response / completed; overdue alerts; complete an activity, record the outcome and schedule the next action in one dialog (also from the lead profile).
- **Companies**: central database, duplicate-name protection (also auto-linking when a lead uses an existing name), multiple contacts, linked opportunities, projects and interaction history.
- **Projects & Opportunities**: all requested fields; *Weighted Pipeline Value = opportunity value × probability* (opportunity value = quotation value, falling back to estimated budget).
- **Categories & Services / Lead Sources**: full add/rename/reorder/delete/move; usage counts; source performance charts and table; custom sources.
- **Reports**: filter by date range, category, source, stage, city, result; conversion rate, estimated vs actual contract value, follow-up performance, breakdown tables; export report CSV/Excel, leads CSV/Excel, print/PDF.
- **Settings**: categories, stages, all dropdown lists, custom fields (text, number, date, dropdown, multi-select, URL, email, phone), table columns & order, default filters, reminders, currency, language, backup/restore, demo data, erase.
- **Data safety**: deleting anything in use opens a *reassign* dialog (nothing is silently orphaned); custom-field type changes and option removals are blocked while values exist; deleting a field with data requires explicit confirmation.
- **Demo data**: 14 fictional Saudi companies, 29 leads, 11 projects, activities. Every demo record carries a *Demo* badge; **Remove demo data** deletes only them (real records pointing at demo ones are detached, not deleted).
- **i18n / RTL**: English and Arabic (all UI strings; category/stage/list items have English + Arabic names), logical CSS properties for RTL, Latin digits for phones/IDs. Light/dark theme.

## Remaining limitations (honest list)

- **Filtering, sorting and pagination run in the browser** over all loaded records (data is fetched in 1,000-row pages from Supabase on start). Fine for thousands of leads; for tens of thousands, move queries server-side.
- **Local mode is single-browser only** and has no authentication.
- Supabase mode keeps one data set per user (owner-based RLS). Team sharing needs the policy change described above; there is no per-role permission model, and no real-time sync between open tabs/devices (reload to see others' changes). Concurrent edits are last-write-wins.
- Currency setting changes display only; no conversion or multi-currency totals.
- Reminders are an in-app banner/badge (no email/WhatsApp/push notifications).
- Excel import reads the first sheet of `.xlsx` (legacy `.xls` is not supported; save as `.xlsx` or CSV).
- Revenue-by-service splits a lead's value evenly across its categories (documented on the chart).
- Attachments/file uploads are not implemented (notes and interaction history are).
- The Supabase path was written against the supplied SQL but could not be exercised end-to-end in this build environment (no project credentials); the local mode and all business logic were tested (unit + browser tests). Please run the checklist below after connecting your project.

## Testing checklist (CRUD + persistence)

Run in each storage mode (local first, then after connecting Supabase).

**Leads**
- [ ] New lead (company only) saves; with invalid phone/email/URL shows clear errors and does not save.
- [ ] Reload → lead is still there. (Supabase: also sign out/in, and open on another device.)
- [ ] Edit from the detail page; change stage; edit again → *Last updated* changes.
- [ ] Duplicate → new ID, stage reset to New Lead. Delete → confirmation → gone after reload.
- [ ] Search by phone in `055…` and `+966 55…` formats; filter by category/stage/priority/source/city/follow-up; sort a column.
- [ ] Select 3 leads → bulk change priority; bulk delete.
- [ ] Import `leads-import-template.csv` (download from the dialog) → preview → import. Re-import → duplicates flagged. Export filtered CSV + Excel and open in Excel.
- [ ] Using an existing company name links to it instead of creating a duplicate; add 2nd contact under the company.

**Pipeline / dashboard**
- [ ] Drag a card to another stage → reload → still there; dashboard KPIs/charts change.
- [ ] Drag to Won → outcome dialog (final value) → *Won Contract Value* increases. Drag to Lost → reason.

**Follow-ups**
- [ ] Overdue tab shows red alerts; complete one with outcome + next action/date → new activity appears under Upcoming and on the lead timeline.
- [ ] Schedule, edit and delete an activity from a lead profile.

**Companies / projects**
- [ ] Add company; duplicate name rejected; edit renames linked leads; delete keeps leads (unlinked).
- [ ] Add project: probability 40 %, quotation 1,000,000 → weighted value 400,000. End before start rejected.

**Settings**
- [ ] Add/rename/reorder a category, add a service, assign it to a lead. Delete it → reassign dialog.
- [ ] Rename a stage and add a stage; delete a used stage → must choose replacement.
- [ ] Add dropdown item, a custom source, a custom field of each type; fill them on a lead; export includes them; try to change type of a used field → blocked.
- [ ] Hide/reorder lead table columns; set a default filter; switch to Arabic (RTL) and back; change currency.
- [ ] Download backup → Erase all → Restore backup → everything returns.
- [ ] Remove demo data → only demo records disappear.
