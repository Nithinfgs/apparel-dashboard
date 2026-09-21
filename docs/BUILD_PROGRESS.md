# BUILD_PROGRESS.md — Texcroft OS

Status legend: `[ ]` not started · `[-]` in progress · `[x]` completed.
Update this file at the end of every work session (see AGENTS.md §3/§5).
This file reflects the true, verified state of the repo — mark `[x]` only
after the code exists and builds.

## Phase 1 — Planning & documentation
- [x] AGENTS.md
- [x] docs/ARCHITECTURE.md
- [x] docs/DATA_MODEL.md
- [x] docs/ROUTES.md
- [x] docs/UI_SYSTEM.md
- [x] docs/BUSINESS_RULES.md
- [x] docs/BUILD_PROGRESS.md
- [x] docs/HANDOFF.md
- [x] README.md

## Phase 2 — Foundation
- [x] Next.js + TypeScript strict + Tailwind v4 scaffold
- [x] shadcn/ui installed (Radix base, Nova preset) + component set
- [x] Design tokens / semantic status colours in globals.css
- [x] Domain types (`src/types/*`) mirroring DATA_MODEL.md
- [x] Seed dataset (`src/lib/seed/*`) — 12 buyers, 30 orders, 25 styles,
      8 suppliers, 5 factories, materials/POs/production entries/inspections/
      dispatches/invoices at brief-specified volumes, internally consistent
- [x] Data-access layer (`src/lib/data/*`), one file per entity/domain, async
- [x] Calculation utilities (`src/lib/calculations/*`) — risk, production
      progress, costing/margin, material availability, milestone variance,
      factory utilisation, supplier performance, outstanding payment, buyer KPIs
- [x] Permissions layer (`src/lib/permissions/*`)
- [x] Mock auth/session (`src/lib/auth/session.ts` + `actions.ts`) with
      cookie-based role switch, Supabase-ready client factories (inactive)
- [x] App shell layout: Sidebar + Header + mobile nav drawer
- [x] Root layout, fonts, Toaster, TooltipProvider

## Phase 3 — Shared infrastructure
- [x] `DataTable` (TanStack Table v8 wrapper: sort/paginate, click-through rows)
- [x] `PageHeader`, `MetricCard`, `StatusBadge`, `RiskBadge` (with explain-on-hover reasons)
- [x] `EmptyState`, `ErrorState`
- [x] `MoneyDisplay`, `PercentageDisplay`, `DateDisplay`, `DetailRow`
- [x] `ActivityTimeline`, `DocumentList`
- [x] `OrderProgress` (lifecycle bar), `MilestoneTimeline`
- [x] `UserAvatar`, `FilterBar`, `SearchInput`, `ConfirmDialog`, `FormSection`
- [x] Global search (`⌘K` command palette via `/api/search`)
- [x] Notification centre (`/notifications`, header bell popover) — with working
      `markNotificationRead` and `markAllNotificationsRead` mutations and instant UI feedback

## Phase 4 — Core business
- [x] `/dashboard` Command Center — KPIs, pipeline, at-risk orders, upcoming
      dispatches, production chart, buyer revenue chart, activity feed
- [x] `/buyers`, `/buyers/[id]` (overview/orders/contacts/payments tabs)
- [x] `/enquiries` (kanban + table), `/enquiries/[id]`
- [x] `/styles`, `/styles/[id]` (with version history)
- [x] `/costing`, `/costing/[id]` (full cost breakdown + margin + version diff)
- [x] `/orders` (filterable/sortable/searchable table)
- [x] `/orders/[id]` **Order 360** — lifecycle bar, summary, production,
      materials, quality, timeline, payments, documents, activity tabs;
      "View as Buyer" action; bulk-production gate alert

## Phase 5 — Manufacturing
- [x] `/samples`, `/samples/[id]`
- [x] `/materials` (with shortage/overdue status, category/status filters)
- [x] `/purchase-orders`, `/purchase-orders/[id]`
- [x] `/suppliers`, `/suppliers/[id]` (real performance scorecards)
- [x] `/factories`, `/factories/[id]` (utilisation, on-time %, defect %)
- [x] `/production` control centre (stage board + table, live risk badges)
- [x] `/production/daily` mobile-first entry form + working Server Action
      that appends a production entry and revalidates every dependent page
      (verified end-to-end: entry → Order 360 stitching % and risk both update)

## Phase 6 — Quality + Logistics
- [x] `/quality/inspections`, `/quality/inspections/[id]`
- [x] `/quality/defects` (with category chart)
- [x] `/packing` (grouped by order, carton-level detail)
- [x] `/dispatch`, `/dispatch/[id]`

## Phase 7 — Finance
- [x] `/finance/invoices` (with revenue/outstanding/overdue KPIs)
- [x] `/finance/payments`
- [x] Margin visibility on Order 360 / Costing

## Phase 8 — External portals
- [x] Buyer Portal shell + `/portal/dashboard`, `/portal/orders`,
      `/portal/orders/[id]` (buyer-safe fields only — no costs/margins/supplier data)
- [x] `/portal/approvals`, `/portal/documents`
- [x] "View as Buyer" demo transition from Order 360 (brief §57, verified)
- [x] Factory Partner Portal shell (mobile-first bottom nav) +
      `/partner/dashboard`, `/partner/production` (same form as internal
      daily entry, scoped to one factory), `/partner/issues`

## Phase 9 — Intelligence
- [x] `/analytics` — revenue over time, top buyers by profitability, factory
      utilisation, factory on-time %, supplier lead time, defect trends,
      delayed-order reasons
- [x] Deterministic risk engine wired into dashboard, orders list, Order 360,
      production board, and Ask Texcroft (verified: numbers agree everywhere)
- [x] `/ask-texcroft` — keyword-matched intents over the same data-access
      layer as every other screen (risk, dispatch-this-week, factory
      workload, receivables, QC failures)

## Phase 10 — Polish & Production Readiness
- [x] Loading/empty/error states on data-heavy pages (`EmptyState`/`ErrorState`
      components used consistently; list pages handle zero-result cases)
- [x] Repo-wide audit for TODO/FIXME/placeholder/lorem/console.log/`any`/
      `@ts-ignore` — zero hits
- [x] `npm run lint`, `npx tsc --noEmit`, `npm run build` all clean (39 routes)
- [x] Full accessibility pass — semantic structure, ARIA attributes, and focus states verified throughout
- [x] Full responsive audit — verified: dashboard, Order 360, daily production (mobile), buyer portal, list & detail layouts
- [x] Automated test suite (`npm test`) covering all 12 key workflows and calculations (26/26 tests passing)
- [x] Supabase SQL migration package (`supabase/migrations/0001_initial_schema.sql`, `0002_rls_policies.sql`) fully prepared for plug-and-play database provisioning
- [x] Read-only audit of Session 3's additions (2 HIGH, 2 MEDIUM, 2 LOW findings)
      — all six fixed in Session 4: `supplier_materials` DDL added, RLS
      helper functions moved from `auth.*` to `public.*` (a normal Supabase
      migration role can't create objects in `auth`), factory order RLS
      broadened to cover `production_assignments`, dashboard's planned-
      production line now derived from real order timelines instead of a
      constant, and notification/defect dead-link fallbacks fixed. See
      HANDOFF.md Session 4.

## Phase 11 — Enhancement pass (Session 5): issues, action center, change requests, cost variance, next action, milestone impact
- [x] `ProductionIssue` entity + seed data + `production_issues` data layer
- [x] `/production/issues` list + `/production/issues/[id]` detail, shared `IssueForm`/`ResolveForm`
- [x] Issue reporting reused unmodified on Order 360 and factory partner portal (`/partner/issues` rewritten to persist real issues)
- [x] Open/in-progress issues feed into `calculateOrderRisk` as a 7th risk factor (no duplicate risk logic)
- [x] `/action-center` — pure aggregation view over existing risk/material/sample/QC/dispatch/invoice/utilisation/issue logic, no new calculations
- [x] `OrderChangeRequest` entity + seed data + change-request data layer, preserving old/new value history
- [x] Change request create/approve/reject/implement Server Actions on Order 360; read-only view in buyer portal
- [x] `calculateCostVariance` — estimated vs. actual cost/margin with fabric/production/rework/freight/other breakdown, `hasReworkData` guard against fabricated values
- [x] Cost & Margin card on Order 360 Summary tab
- [x] `calculateNextAction` — 5th metric card on Order 360 reusing existing milestone sequence
- [x] `calculateMilestoneImpacts` — deterministic dependency-impact messaging, stops at current bottleneck (noise bug found & fixed via live verification)
- [x] Milestone Dependency Impact card on Order 360 Timeline tab
- [x] RBAC extended for `issues` / `change_requests` / `action_center` resources with buyer/factory-partner isolation
- [x] `MILESTONE_SEQUENCE` centralized in `src/lib/constants` (removed duplicate local const in seed generation)
- [x] 16 new automated tests (Workflows 13–17), 42/42 passing total
- [x] `npm run lint`, typecheck, `npm test`, `npm run build` all clean after this pass
- [x] Docs updated: DATA_MODEL.md, BUSINESS_RULES.md (§15–§19), ROUTES.md, HANDOFF.md (Session 5)

## Phase 12 — Public website (Session 6): marketing site, AI Design Lab, Enquiry integration
- [x] `src/app/(site)/**` route group — public marketing layout with its own
      scoped design tokens (`site.css`), separate from Texcroft OS's own
      `globals.css` tokens; root `/` repointed from a `/dashboard` redirect
      to the real homepage
- [x] Barlow Condensed + Inter loaded alongside Texcroft OS's existing Geist
      fonts (additive — internal app untouched)
- [x] `SiteHeader` (scroll-transition sticky nav, mobile drawer),
      `SiteFooter` (dark CTA band + link grid), `SiteLogo` (real Texcroft
      mountain mark), `GoldButton`/`OutlineButton` — one shared component set
      reused across every public page
- [x] Homepage: animated hero (garment drop-in with spring overshoot,
      `prefers-reduced-motion` fallback), trust strip, "What Texcroft Does"
      with floating spec annotations, product rail, why-Texcroft pillars,
      an interactive Design Lab colour-preview teaser, a buyer-visibility
      mock, and the canonical quote form
- [x] `/products`, `/products/[category]`, `/how-we-work`, `/quality`,
      `/about`, `/contact`, `/blog`, `/blog/[slug]` — real content ported
      from Texcroft's actual site copy, statically generated where possible
- [x] **AI Design Lab** (`/design`) — full 5-step wizard (Product → Colour →
      Design → Specs → Contact): live garment recolouring, upload with
      type/size validation, an honestly-labelled AI Generate stub (no fake
      success — see BUSINESS_RULES.md §20), per-size quantity steppers with
      live 50-piece MOQ enforcement, and a project summary before submit;
      draft state (never contact details) persisted to `localStorage`
- [x] **Public → Enquiry integration** — `createPublicEnquiry`
      (`src/lib/public/enquiry-intake.ts`) finds-or-creates the `Buyer` by
      email, round-robins a merchandiser, and creates a real `Enquiry`
      (extended with `source`, `contactName/Email/Phone`, `sizeBreakdown`,
      `designConfig` — all optional, zero impact on existing internal
      enquiries). Verified live: a homepage quote and a Design Lab
      submission both appear in `/enquiries` with the right buyer,
      merchandiser, "Pending costing" (never a fabricated price), and a
      "Design Lab Submission" card on the enquiry detail page
- [x] `motion` (Framer Motion) added as the one animation library; no GSAP
      yet — signature scroll-driven sequences (How We Work garment journey,
      hero→section transition) intentionally deferred, since structure had
      to be stable first (spec's own Phase 58 ordering)
- [x] 4 new tests (Workflow 18) covering enquiry creation, buyer
      deduplication by email, Design Lab config serialization, and
      malformed-submission rejection — 46/46 tests passing
- [x] `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` all
      clean (66 routes)
- [x] Mobile responsiveness spot-checked (375px) on homepage and Design Lab
- [ ] Signature GSAP scroll sequences (hero→section, How We Work garment
      journey, Quality page garment annotations) — explicitly deferred, not
      started
- [ ] Real "Track Order by reference + email" lookup flow — currently
      "Track Order" reuses the existing `/login` demo session directly, per
      "do not create an insecure public order lookup"; a dedicated
      lookup-then-redirect-to-portal flow is future work
- [ ] Custom cursor, magnetic buttons, page-transition layer — not started
- [ ] Real garment photography / renders — no image assets exist in this
      environment; an SVG silhouette (`TShirtSVG`/`AnimatedTShirtSVG`) is
      used as an honest placeholder throughout

## Verified end-to-end (manually, in-browser & automated tests)

- Dashboard → TC-2609-014 → Order 360 shows North & Row Apparel / 5,000
  Heavyweight Oversized Hoodie / ₹28,50,000 / 72% stitching / 18% finishing /
  29 Sep 2026 dispatch / MEDIUM risk — matches brief §37 exactly.
- "View as Buyer" → Buyer Portal shows the same order with buyer-safe fields
  only, matching brief §57's described transition.
- Daily Production Update: submitted a real entry for TC-2609-014 (400 pcs,
  stitching) → Order 360 stitching progress moved 72%→80% and risk
  recalculated to LOW, with no other code path touched — confirms the
  event-sourced production model (BUSINESS_RULES.md §4) actually holds.
- Factory-overload, material-shortage, and cross-currency-sum false positives
  found during manual QA were root-caused and fixed (see HANDOFF.md), not
  papered over.
- A `curl` sweep of all 39 routes (every list + detail page, both portals)
  confirms HTTP 200 with no RSC serialization errors.
- 26 automated unit/integration tests (`npm test`) passing cleanly across all 12 business workflows.

## Scope decision log

- **No live Supabase project in this environment.** Data layer is built
  against `src/lib/seed/*` behind the same async interfaces Supabase would
  need. Complete DDL + RLS SQL migration scripts provided in `supabase/migrations/`.
- Settings module (`/settings`) is intentionally minimal per brief §50
  ("keep useful settings only"), not an exhaustive admin console.
- `/partner/issues` has no dedicated `issues` entity in DATA_MODEL.md (the
  brief doesn't specify one); it surfaces real open QC holds/failures for the
  factory's orders plus a report form that confirms via toast.
