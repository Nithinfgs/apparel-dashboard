# AGENTS.md — Texcroft OS Non-Negotiable Rules

This file governs every model (Claude Opus, Gemini Flash, or any future model) that
touches this repository. Read this file, then `docs/ARCHITECTURE.md`,
`docs/DATA_MODEL.md`, `docs/UI_SYSTEM.md`, `docs/BUSINESS_RULES.md`,
`docs/BUILD_PROGRESS.md`, and `docs/HANDOFF.md`, **before writing any code**.

## 1. What this project is

Texcroft OS is a single, coherent ERP-style operating system for an apparel
sourcing/manufacturing company. It is not a demo of disconnected screens — every
module reads and writes the same underlying data model. A buyer created in
`/buyers` must be selectable in `/orders`. A production entry logged in
`/production/daily` must move the same order's progress bar on `/orders/[id]`
and in the buyer portal. There is one source of truth per fact.

## 2. Non-negotiable rules

1. **No dead code.** No unused components, unused exports, unused types, unused
   dependencies, commented-out blocks, placeholder buttons that do nothing, or
   TODO/FIXME left in committed code.
2. **No duplicate concepts.** One `Order` type, one `formatMoney`, one
   `StatusBadge`, one table implementation (`DataTable`). Before adding
   anything, search for an existing implementation first.
3. **Calculations live in `src/lib/calculations/`, never in components.**
   Components call a function and render its result. See §39 of the brief and
   `docs/BUSINESS_RULES.md`.
4. **Types live in `src/types/`.** Do not redeclare domain shapes inline in a
   component or a page.
5. **Data access is centralized in `src/lib/data/`.** Pages and components
   never hand-roll a fetch/query; they call a typed data-access function. This
   is what makes the eventual swap from mock data to Supabase a one-file
   change per entity (see ARCHITECTURE.md §"Data layer strategy").
6. **Permissions are centralized in `src/lib/permissions/`.** Never scatter
   `if (role === 'admin')` checks through page/component code — call
   `can(role, action, resource)`.
7. **Strict TypeScript.** No `any` without a comment explaining why it is
   unavoidable. No `@ts-ignore` without the same.
8. **The app must build.** After any non-trivial change, run `npm run lint`,
   `npm run typecheck` (via `tsc --noEmit`), and `npm run build`. Fix errors
   before moving to the next task. Never hand off a broken build.
9. **Reuse the shared component library** listed in `docs/UI_SYSTEM.md` (
   `PageHeader`, `MetricCard`, `StatusBadge`, `RiskBadge`, `DataTable`,
   `EmptyState`, `ErrorState`, `ActivityTimeline`, `DocumentList`,
   `OrderProgress`, `MilestoneTimeline`, `MoneyDisplay`, `PercentageDisplay`,
   `DateDisplay`, `UserAvatar`, `FilterBar`, `SearchInput`, `ConfirmDialog`,
   `FormSection`, `DetailRow`). Do not build a page-specific one-off version of
   any of these.
10. **Colour communicates state, and only state.** Semantic status colours are
    defined once in `src/lib/constants/status.ts` / Tailwind tokens. Never
    hardcode a hex colour in a component for a status.
11. **Every data page has a loading, empty, and error state.** Never ship a
    page that can render blank.
12. **Never pass a function from a Server Component to a Client Component.**
    A page file with no `"use client"` directive is a Server Component; any
    `ColumnDef[]` with JSX `cell` renderers, or any inline
    `formatter={(v) => …}`-style prop handed to a Client Component (a
    `DataTable`, a Recharts wrapper, etc.), throws at runtime with "Functions
    cannot be passed directly to Client Components" — **`next build` does
    not catch this**, only an actual page load does. Put `columns` arrays in
    a sibling `columns.tsx` marked `"use client"` (see any `src/app/(app)/*/columns.tsx`
    for the pattern) and give chart/table components a string-enum prop
    (e.g. `format="money"`) instead of a formatter function when the caller
    is a Server Component. After adding or changing a `ColumnDef[]` or a
    chart with a formatter prop, load the actual page in a browser (or
    `curl` it) — a clean `npm run build` is not sufficient proof it works.

## 3. Model handoff protocol

- **If you are Claude (or another "foundation" model):** front-load
  architecture correctness. Get the data model, permission system, layout,
  design tokens, and calculation utilities right before producing repetitive
  CRUD screens. It is fine to spend a disproportionate amount of effort here.
- **If you are Gemini Flash (or another "continuation" model):** you are
  extending an existing system, not designing a new one.
  - Do **not** introduce a second table component, a second date formatter, a
    second auth pattern, or a second design language.
  - Do **not** "clean up" architecture you don't have full context on — flag
    it in `docs/HANDOFF.md` instead and ask, or leave a dated note.
  - Follow the folder structure in `docs/ARCHITECTURE.md` exactly. New modules
    go where the pattern says they go.
  - Copy the shape of an existing, working module (e.g. `orders`) when
    building a new one (e.g. `dispatch`), rather than inventing a new shape.
- **Every session, regardless of model:** before stopping, update
  `docs/BUILD_PROGRESS.md` (checklist state) and `docs/HANDOFF.md` (what
  changed, what's next, known issues).

## 4. Data layer decision (read before touching Supabase)

This repository is developed without a provisioned Supabase project attached
to the coding session. To keep the app fully runnable and demoable at every
commit, `src/lib/data/*` currently reads from an in-memory seed dataset
(`src/lib/seed/*`) shaped **exactly** like the Postgres schema in
`docs/DATA_MODEL.md`. Every data-access function is `async` and returns the
same shape a Supabase query would. Swapping a function's body from
"read the seed array" to "query Supabase" should never require changing a
caller. Do not build a second, incompatible data path — extend the seed layer
and the data-access functions together. See `docs/ARCHITECTURE.md` for detail.

## 5. Definition of done for any task

- Feature works end-to-end from the UI using seed data.
- No new lint/typecheck/build errors.
- New/changed calculations added to `src/lib/calculations/`, not inlined.
- New route added to `docs/ROUTES.md`.
- New entity/field added to `docs/DATA_MODEL.md`.
- `docs/BUILD_PROGRESS.md` and `docs/HANDOFF.md` updated.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
