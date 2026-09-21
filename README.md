# Texcroft OS

An operations platform for **Texcroft**, an apparel sourcing and garment
manufacturing company based in Coimbatore / Tiruppur, Tamil Nadu. It takes a
buyer enquiry all the way through costing, sampling, sourcing, production,
quality control, packing, dispatch, and payment — one system instead of
WhatsApp, spreadsheets, and email.

Read `AGENTS.md` and everything in `docs/` before making changes — they are
the source of truth for architecture, data model, routes, design system,
business rules, and current build status. This is a multi-model project
(built with Claude, continued with Gemini Flash); those documents exist so
both stay coherent.

## Stack

- Next.js (App Router) + TypeScript (strict) + Tailwind CSS v4
- shadcn/ui (Radix primitives) + Lucide icons
- React Hook Form + Zod
- TanStack Table, Recharts, date-fns, Sonner
- Target backend: Supabase (Postgres + Auth + RLS) — see "Data layer" below

## Data layer — important

**No Supabase project is connected in this environment.** The app runs today
against a realistic, internally-consistent in-memory seed dataset
(`src/lib/seed/`) shaped exactly like the Postgres schema in
`docs/DATA_MODEL.md`, behind the same async data-access functions
(`src/lib/data/`) a Supabase-backed version would use. This means:

- The app is fully functional and demoable right now with **zero setup**.
- Mutations (e.g. the Daily Production Update form) write into the in-memory
  seed array for the life of the dev server process, and reset on restart.
- Connecting a real Supabase project is a scoped, mechanical follow-up:
  create the schema from `docs/DATA_MODEL.md`, set the environment variables
  below, and swap each function body in `src/lib/data/*` from "read the seed
  array" to "query Supabase" — callers do not change. See `AGENTS.md` §4.

## Environment variables (for a future Supabase connection)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Not required to run the app today — `src/lib/supabase/*` client factories
are wired but inactive until these are set.

## Setup

```bash
npm install
```

## Run locally

```bash
npm run dev
```

Open http://localhost:3000 and pick a demo account on the login screen.

## Demo accounts

All demo accounts are reachable from `/login` — no password needed in this
mock-auth build (see `src/lib/auth/session.ts`). For a future real-auth
build, use the addresses below with a development-only password you set in
Supabase Auth; never reuse this pattern in production.

| Email | Role | Sees |
|---|---|---|
| admin@texcroft.demo | Founder / Admin | Everything |
| management@texcroft.demo | Management | Everything except Settings/Users |
| kranti@texcroft.demo / arjun@texcroft.demo | Merchandiser | Sales, orders, production, quality, logistics |
| sourcing@texcroft.demo | Sourcing Manager | Materials, POs, suppliers |
| production@texcroft.demo | Production Manager | Orders, production, factories |
| qc@texcroft.demo | QC Inspector | Quality screens, read-only production |
| finance@texcroft.demo | Finance | Invoices, payments, buyers |
| factory@texcroft.demo | Factory Partner | `/partner/*` — only their own factory's orders |
| buyer@texcroft.demo | Buyer | `/portal/*` — only their own company's orders |

The flagship demo order is **TC-2609-014** (North & Row Apparel, Heavyweight
Oversized Hoodie, 5,000 pcs) — see brief §37/§57 for the intended walkthrough:
Dashboard → TC-2609-014 → Order 360 → "View as Buyer" → Buyer Portal.

## Build

```bash
npm run build
npm run lint
npx tsc --noEmit
```

All three must be clean before a change is considered done — see `AGENTS.md`
§2.8.

## Deployment

Standard Next.js deployment (Vercel or any Node host). Set the Supabase
environment variables above once a project is connected; until then the app
runs entirely on seed data and needs no external services.

## Folder architecture

See `docs/ARCHITECTURE.md` for the full breakdown. Summary:

```
src/
  app/            Next.js routes — (app) internal shell, portal/ buyer shell,
                  partner/ factory shell, login/
  components/
    ui/           shadcn/ui primitives
    layout/       Sidebar, Header, portal/partner nav
    shared/       Standardized building blocks (DataTable, StatusBadge, …)
    dashboard/ orders/ production/ quality/ analytics/  Module-specific composites
  lib/
    data/         Data-access layer (one file per entity)
    seed/         In-memory seed dataset
    calculations/ Pure business-rule functions (risk, costing, progress, …)
    permissions/  Centralized role → resource access map
    constants/    Status colours, stage labels, prefixes
    auth/         Mock session + Supabase-ready factories
    supabase/     Supabase client factories (inactive until env vars are set)
  types/          Domain types mirroring docs/DATA_MODEL.md
docs/             Architecture, data model, routes, UI system, business
                  rules, build progress, handoff notes
```
