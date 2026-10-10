# Pipeline — personal job-search CRM

A private dashboard to track offices/companies, applications, interviews, follow-ups and contacts
(architecture, interiors, fit-out, project management, FF&E, joinery, construction).

**Stack:** React 19 + TypeScript + Vite + Tailwind · Express · SQLite (`node:sqlite`, Node ≥ 22.13) · zustand.

## Run

```bash
cd jobtracker
npm install
npm run build && npm start      # http://localhost:3001  (serves the built app + API)
# or, for development with hot reload:
npm run dev                     # web on :5173, API on :3001
```

First visit → create your account (single user, scrypt-hashed password, signed HttpOnly session cookie).
Choose what to start with: **your 33 target offices**, fictional **demo data**, or **empty**.

Environment variables: `PORT` (3001), `HOST` (127.0.0.1 — set `0.0.0.0` to expose on your network; put it behind HTTPS),
`JOBTRACKER_DATA` (data folder, default `./data`: database + uploads + session secret).

## Features

Dashboard (KPIs, upcoming actions, drag-and-drop pipeline, activity) · Companies CRM (+ profile, archive, CSV import/export) ·
Applications (table + board, filters, sorting, detail with timeline & attachments) · Interviews (list + calendar) ·
Follow-ups (overdue/today/upcoming, complete / reschedule / skip) · Contacts (+ interaction history) ·
Calendar (month/week/day/agenda) · Analytics (conversion funnel, response times, best source/type…) ·
Global search (Ctrl/⌘ K) · Quick add · Notifications · Settings (locale, currency SAR/EGP/USD/AED/EUR, password, backup).

## Data model

`companies 1─* contacts`, `companies 1─* applications`, `applications 1─* interviews`,
`applications 1─* follow_ups (─? contact)`, `activities` (company / application / contact), `attachments`, `users`.
Foreign keys use `ON DELETE CASCADE` (contacts/follow-ups/activities detach with `SET NULL` when a contact is deleted).
Schema is declared once in `shared/schema.ts`; stage history is derived from `Stage change` activities.

## Quality checks

```bash
npm run typecheck
npm test               # unit tests: analytics calculations, notifications, CSV, dates
e2e/run.sh             # ~90 browser checks on a throw-away database (needs Playwright's Chromium)
```
