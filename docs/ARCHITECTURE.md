# ARCHITECTURE.md — Texcroft OS

## Stack

- **Framework:** Next.js (App Router), TypeScript strict mode
- **UI:** Tailwind CSS v4 + shadcn/ui (Radix primitives), Lucide icons
- **Forms:** React Hook Form + Zod
- **Tables:** TanStack Table (wrapped by `DataTable`)
- **Charts:** Recharts
- **Dates:** date-fns
- **Toasts:** Sonner
- **Target backend (production):** Supabase (Postgres + Auth + RLS)
- **Current data layer (development):** typed in-memory seed data behind the
  same async interfaces Supabase would need (see AGENTS.md §4). This is the
  one deliberate deviation from "just use Supabase directly" and it exists
  because this coding session has no provisioned Supabase project. Every
  function in `src/lib/data/` is written so only its body changes when a real
  project is connected — callers are unaffected.

## Folder structure

```
texcroft-os/
  src/
    app/                        Next.js App Router routes
      (app)/                    Internal ops app shell (sidebar + header)
        dashboard/
        enquiries/
        buyers/
        styles/
        costing/
        orders/
        samples/
        materials/
        purchase-orders/
        suppliers/
        factories/
        production/
          daily/
        quality/
          inspections/
          defects/
        packing/
        dispatch/
        finance/
          invoices/
          payments/
        analytics/
        ask-texcroft/
        settings/
      portal/                   Buyer-facing shell (separate layout)
        dashboard/
        orders/
        approvals/
        documents/
      partner/                  Factory-partner shell (separate layout)
      login/
      layout.tsx                 Root layout (fonts, ToastProvider, TooltipProvider)
      globals.css
    components/
      ui/                        shadcn/ui primitives (generated, do not hand-edit patterns)
      layout/                    Sidebar, Header, AppShell, PortalShell, PartnerShell
      shared/                    PageHeader, MetricCard, StatusBadge, RiskBadge,
                                  DataTable, EmptyState, ErrorState, ActivityTimeline,
                                  DocumentList, OrderProgress, MilestoneTimeline,
                                  MoneyDisplay, PercentageDisplay, DateDisplay,
                                  UserAvatar, FilterBar, SearchInput, ConfirmDialog,
                                  FormSection, DetailRow
      dashboard/                 Dashboard-only composite components
      orders/                    Order-module composite components (OrderLifecycle, etc.)
      production/
      quality/
      buyers/
    lib/
      supabase/                  Supabase client factories (browser/server) — ready,
                                  inactive until env vars are provided
      data/                      Data-access layer: one file per entity
                                  (orders.ts, buyers.ts, ...). Only these files
                                  know whether data comes from seed arrays or Supabase.
      seed/                      Seed dataset, shaped like docs/DATA_MODEL.md
      calculations/              Pure functions: risk, progress, costing, margin, etc.
      permissions/                can(role, action, resource), ROLE_PERMISSIONS map
      validation/                 Zod schemas, one per form/entity
      constants/                  status colours, order stages, prefixes, currencies
      utils.ts                    cn() and small generic helpers (from shadcn)
    types/                       Domain TypeScript types, mirrors DATA_MODEL.md
    hooks/                       use-permissions, use-current-user, use-debounce, etc.
  docs/                          This documentation set
  AGENTS.md
```

## Component architecture

- **Server Components by default.** A component only becomes a Client
  Component (`"use client"`) when it needs interactivity (forms, dropdowns,
  local UI state, charts). Data fetching happens in Server Components or
  route handlers, not in `useEffect`.
- **Composite vs. primitive:** `components/ui/*` are unmodified shadcn
  primitives. `components/shared/*` are the standardized, reused building
  blocks listed in AGENTS.md §2.9 — every module composes pages from these
  rather than reinventing them. `components/<module>/*` are composites
  specific to one domain (e.g. `OrderLifecycleBar`) that themselves compose
  `shared` primitives.
- **Page composition pattern:** every list route follows
  `PageHeader` → `FilterBar` → `DataTable`. Every detail route follows
  `PageHeader` (with breadcrumb + actions) → summary cards → tabbed or
  stacked detail sections built from `DetailRow`/`FormSection`.
- Components are split by responsibility, not by line count. A 40-line
  component that does one clear thing is preferred over either a 5-line
  wrapper or an 800-line page.

## State architecture

- **Server state:** fetched via `src/lib/data/*` inside Server Components
  wherever possible (list pages, detail pages).
- **URL state:** filters, sort, pagination, and tab selection live in the URL
  query string (`useSearchParams` / `nuqs`-style patterns via plain
  `URLSearchParams` helpers) so state survives refresh and is shareable.
- **Local component state:** form inputs, dialog open/close, optimistic UI —
  plain `useState`/`useReducer` in the smallest component that needs it.
- **No global client store.** Redux/Zustand/Jotai are intentionally not used.
  If a genuine cross-tree client state need appears (e.g. the command-K quick
  search), it is handled with React Context scoped to the app shell, not a
  general-purpose store.

## Backend architecture (target: Supabase)

- Postgres schema per `docs/DATA_MODEL.md`, UUID primary keys,
  `created_at`/`updated_at` on every table.
- Supabase Auth for identity; a `profiles` table (1:1 with `auth.users`)
  carries `role`, `full_name`, `buyer_id` (for buyer users), `factory_id`
  (for factory-partner users).
- Row Level Security policies enforce: buyer users only see rows where
  `orders.buyer_id = profiles.buyer_id`; factory-partner users only see rows
  where `production_assignments.factory_id = profiles.factory_id`. RLS is the
  last line of defense — the app-level `permissions` layer and scoped data
  queries are the first line, so a UI bug never becomes a data leak.
- Server Actions / Route Handlers perform writes; they validate with the same
  Zod schemas used on the client, then call the data-access layer.

## Authentication

- Supabase Auth (email/password for the demo). `src/lib/supabase/server.ts`
  and `client.ts` are pre-built factories. Until a Supabase project is
  connected, `src/lib/auth/session.ts` returns a mock session driven by a
  `?as=` dev switch / a simple cookie, so every screen can be built and
  reviewed against each of the demo roles today. Swapping to real Supabase
  Auth only touches `session.ts`.
- Demo accounts and roles are documented in `README.md`.

## Data access

- One file per entity in `src/lib/data/` (e.g. `orders.ts` exports
  `listOrders(filters)`, `getOrderById(id)`, `getOrderTimeline(id)`, etc.).
- Every function is `async` even though the current implementation is
  synchronous in memory — this keeps calling code identical after the
  Supabase swap.
- Cross-entity joins (e.g. "order with buyer name and style name") are
  resolved inside the data-access layer, never in the component.

## Naming conventions

- Files: `kebab-case.ts(x)`.
- Components: `PascalCase` exported as named exports (`export function
  MetricCard() {}`), one primary component per file.
- Types: `PascalCase` (`Order`, `OrderStage`), enums-as-union-types where
  possible (`type OrderStage = "enquiry" | "costing" | ...`).
- Data-access functions: verbs — `list*`, `get*ById`, `create*`, `update*`.
- Calculation functions: verbs — `calculate*`.
- IDs shown to users use the Texcroft order-prefix scheme (`TC-2609-014`) —
  see `docs/BUSINESS_RULES.md`. Internally every row still has a UUID `id`.

## Shared utilities

- `formatMoney`, `formatPercent`, `formatDate` live in
  `src/lib/utils/format.ts` and back the `MoneyDisplay`, `PercentageDisplay`,
  `DateDisplay` components — never call `Intl.NumberFormat` ad hoc in a page.
- `cn()` (shadcn) for conditional class composition.

## API conventions

- Mutations go through Next.js Server Actions colocated with the form that
  triggers them (`src/app/(app)/orders/[id]/actions.ts`) or, where a REST-ish
  handler is genuinely useful (webhooks, external integration surface), a
  Route Handler under `src/app/api/*` returning `{ data }` or
  `{ error: { message } }`.
- All inputs are validated with Zod before touching the data layer.
- All list endpoints/functions accept a typed `filters` object and return
  `{ items, total }` so pagination is consistent everywhere.

## Error handling

- Data-access functions throw a typed `AppError` (`src/lib/errors.ts`) with a
  `code` and human message.
- Route-level `error.tsx` boundaries render `ErrorState`.
- Forms surface field errors inline via Zod + React Hook Form and a top-level
  toast (Sonner) on submit failure.
- Never swallow an error silently; never show a blank screen.

## Design philosophy

Enterprise-grade, dense-but-readable, state communicated through colour, no
decorative motion. See `docs/UI_SYSTEM.md` for the full visual language. The
guiding test for every screen: *would a Texcroft merchandiser trust this
number enough to tell a buyer it's correct?*
