# HANDOFF.md — Texcroft OS

Keep this file current at the end of every session (AGENTS.md §3/§5). Most
recent entry at the top.

---

## 2026-09-21 — Session 6d (Claude Sonnet) — Real product photography + bolder homepage sections

### Context

Two rounds of follow-up feedback: (1) "What Texcroft Does" and the product
rail still looked like the generic default template — they hadn't been
touched by the cinematic redesign pass; (2) the product cards' flat vector
t-shirt icons looked cheap even after the shading upgrade — the user asked
for real garment photography.

### What was built

- **`WhatWeDo`** (`src/components/site/home/what-we-do.tsx`) rebuilt from a
  plain two-column bullet list + floating-badge icon into a dark, full-width
  section matching the hero/footer (same fabric-thread background), with a
  numbered 6-cell capability grid (hover tints the cell gold and shifts the
  title) instead of a `<ul>`.
- **`ProductRail`** (`src/components/site/home/product-rail.tsx`) rebuilt
  from a row of small bordered white cards into a dark editorial bento grid
  — one large feature card plus four smaller ones (`md:grid-cols-3
  md:grid-rows-2`, feature spans both rows), each with a bottom gradient
  overlay and a gold border + "EXPLORE →" that only appears on hover.
- **Real product photography.** No image-generation tool is available in
  this environment, so real, freely-licensed photos were sourced live from
  Pexels (search → confirm licence-free/no-attribution-required → pull the
  direct `images.pexels.com` CDN URL → download) for all 9 categories, saved
  to `public/images/products/*.{jpg,png}` and wired in via a new `image`
  field on `PublicProductCategory` (`src/lib/site/products.ts`). Applied
  everywhere a category renders: the homepage rail, `/products`, and
  `/products/[category]`'s hero image — all via `next/image` with a subtle
  `grayscale(10-15%) contrast(1.05)` filter plus the same dark bottom-gradient
  treatment, so photography of varying original lighting/background reads as
  one consistent product line rather than mismatched stock photos.
  `TShirtSVG`/`AnimatedTShirtSVG` are kept and still used for the abstract
  hero/Design Lab moments, where a literal product photo wouldn't work
  (colour-configurable garment, decorative brand texture) — this is not a
  wholesale replacement of the illustration system, just the product-catalogue
  surfaces.
- One oversized source (`hoodies-sweatshirts`, originally a 3.5MB PNG)
  downsized and re-encoded as an ~360KB JPEG before committing, so the repo
  doesn't carry an unnecessarily large binary — `next/image` still optimizes
  further at request time regardless.

### Licensing note

All 9 photos are from Pexels, whose license permits free commercial use
with no attribution required (https://www.pexels.com/license/). They are
generic stock photography standing in for Texcroft's own product photos
until real photography is supplied — see AGENTS.md §4's broader
"no real assets in this environment" constraint, which the earlier SVG
illustrations were already documented against.

### Verified

`npm run lint` / `npx tsc --noEmit` — clean. `npm test` — 46/46 (unchanged).
`npm run build` — 66 routes, clean. Live-verified: homepage bento grid and
capability grid, `/products` listing (all 9 real photos), and a
`/products/[category]` detail page all render correctly with the new
photography and dark gradient treatment.

---

## 2026-09-21 — Session 6c (Claude Sonnet) — Cinematic redesign: dark hero, custom cursor, scroll-driven journey

### Context

Further feedback: Session 6b's polish pass still "looked the same as the
old website" — a nicer garment icon and magnetic buttons don't change a
site's structure. Agreed direction with the user (asked explicitly rather
than guessing): (1) dark, cinematic art direction; (2) replace literal
garment-icon clipart with an abstract fabric/thread visual language; (3)
build the deferred scroll-driven "garment journey" and a custom cursor now,
not later.

### What was built

- **New homepage hero** (`src/components/site/home/hero.tsx`) — full-bleed
  near-black section with a radial gold spotlight + film-grain noise
  texture, oversized asymmetric type (`text-[15vw]`-scale, not a fixed
  size) that breaks the centered-hero template, a per-letter/per-word
  headline reveal with a slow animated gold shimmer on the second line, and
  a mouse-parallax drift on the background art. The header is `fixed` (not
  `sticky`) so it can render fully transparent with white text over this
  hero and only turn into the blurred white pill once scrolled — see the
  bug note below for why that required a layout change everywhere.
- **`HeroFabricArt`/`ThreadJourneySVG`** (new,
  `src/components/site/fabric-art.tsx`) — Texcroft's own abstract visual
  language: flowing gold/white thread lines with a hand-drawn `pathLength`
  entrance, replacing literal t-shirt-icon clipart in the hero. This is
  intentionally not another garment illustration — the feedback was that
  garment icons read as generic regardless of shading quality.
- **Custom cursor** (`src/components/site/custom-cursor.tsx`, loaded via
  `custom-cursor-loader.tsx`) — a small dot plus a lagging ring that
  expands and shows a short label (`data-cursor="GO"` etc.) over tagged
  CTAs. Desktop/fine-pointer only; disabled under
  `prefers-reduced-motion`; the real cursor's click affordance is untouched
  (this is a visual overlay, `pointer-events-none`).
- **How We Work "garment journey"** (new,
  `src/components/site/how-we-work-journey.tsx`) — the brief's originally
  deferred signature piece. A tall pinned (`position: sticky`) section
  scroll-drives a single thread through 6 stitch nodes
  (`useScroll`+`pathLength`) while the active process step crossfades in
  place, derived from scroll progress via `useMotionValueEvent` (see bug
  note). Falls back to a plain stacked list under
  `prefers-reduced-motion`.
- `MagneticButton`/`MagneticOutlineButton` extended to the footer CTA band
  (Session 6b); nav links got an animated underline; the mobile drawer
  became a circular clip-path reveal.

### Bugs found and fixed during live verification

1. **Fixed-header layout migration.** Overlaying the header transparently
   on the dark hero required switching it from `sticky` to `fixed`, which
   removes it from document flow — every other page's content would
   otherwise render underneath it. Fixed by giving `<main>` a
   `pt-[76px]` in the shared `(site)` layout and having the homepage hero
   pull itself back up with a matching `-mt-[76px]` (it already pads its
   own content below that via internal `pt-32`). `SiteHeader` now checks
   `pathname === "/" && !scrolled` to decide whether to render white-on-
   transparent or dark-on-white text/logo.
2. **Continuous per-panel scroll-crossfade produced permanently-stuck
   ghost text.** The first "garment journey" implementation gave each of
   the 6 step panels its own `useTransform(progress, [4 points], [0,1,1,0])`
   opacity curve. Two bugs compounded: (a) the first/last panels' input
   arrays had a duplicate leading/trailing value (e.g. `[0, 0, 0.147,
   0.167]`), which isn't strictly increasing and produced wrong
   interpolation; (b) even after correcting that, one panel's computed
   opacity would freeze at a stale intermediate value instead of
   continuing to update as scroll progressed further, confirmed by reading
   `getComputedStyle(panel).opacity` directly via the browser tool rather
   than guessing from screenshots. Root-caused by switching to a
   fundamentally simpler, more robust approach: a single discrete
   `activeIndex` derived from scroll progress via `useMotionValueEvent`,
   rendering only the active step through `AnimatePresence mode="wait"` —
   no per-panel continuous interpolation at all. Verified via direct DOM
   opacity queries at multiple scroll depths after the fix (exactly one
   panel present in the DOM at any time, opacity always 0 or 1).
3. **`CustomCursor` caused a real hydration mismatch**, not a false alarm —
   confirmed by testing in a **fresh browser tab** after a full dev-server
   restart and `.next` cache clear (earlier apparent "fixes" were being
   masked by stale Fast Refresh module state in a long-lived tab, which
   produced the same misleading console errors regardless of the actual
   code — a reminder to open a fresh tab, not just re-navigate, when
   chasing a hydration/HMR-shaped bug). The real fix: the component's
   `enabled` flag controlled `return null` vs. rendering two fixed divs,
   so no lazy-initializer or effect-timing trick could give server and
   client the same first-render output. Resolved properly by loading it
   through `next/dynamic(..., { ssr: false })` via a small client-only
   loader module (`custom-cursor-loader.tsx`), so it never renders on the
   server at all and there's nothing for the client to reconcile against.

### Verified

`npm run lint` / `npx tsc --noEmit` — clean. `npm test` — 46/46 (unchanged;
no business logic touched). `npm run build` — 66 routes, clean. Live
verification: hero renders correctly with white-on-transparent header over
the dark hero and dark-on-white header on every other page; the How We Work
journey scrolled start-to-finish with exactly one step panel visible at any
scroll depth (checked via direct DOM opacity reads, not just screenshots);
a fresh browser tab confirmed zero hydration/console errors end-to-end.

### Still deferred

Applying the dark/cinematic treatment beyond the homepage hero, footer, and
How We Work (Products/Quality/About/Blog remain the light-theme treatment
from Session 6, which suits their denser informational content); a
dedicated Track Order lookup flow; analytics event instrumentation.

---

## 2026-09-21 — Session 6b (Claude Sonnet) — Premium visual pass on the public site

### Context

Follow-up feedback on Session 6's public website: it "looked generic" and
the garment illustration didn't read as a real product. This pass upgraded
the visual/motion quality without touching page structure, routes, the
Enquiry integration, or RBAC — purely the presentation layer flagged as
deferred in Session 6 (BUILD_PROGRESS.md Phase 12's "not started" items).

### What changed

- **`TShirtSVG`/`AnimatedTShirtSVG`** (`src/components/site/garment-svg.tsx`)
  rebuilt from a single flat-fill shape into a layered, studio-lit
  illustration: a linear-gradient base fill, a radial sheen highlight, an
  ambient-occlusion shadow gradient, fabric fold/seam lines, a rib-knit
  collar, a soft drop shadow filter, and a ground shadow ellipse. A cheap
  luminance check (`shadeStops`) flips shading intensity for light vs. dark
  colours so the same illustration reads correctly recoloured to black or
  white. This is reused everywhere the garment appears (hero, product rail,
  product detail, Design Lab) — one component, so the upgrade applied
  sitewide with no per-page changes.
- **Hero** (`src/components/site/home/hero.tsx`) rebuilt with: a radial
  gold-spotlight backdrop plus a subtle SVG-noise grain texture; a
  per-letter, per-word headline reveal (`SplitLine` — word-grouped so
  "GARMENT" never breaks mid-word) with a slow animated gold-gradient
  shimmer on the third line; a mouse-parallax 3D tilt on the garment stage
  (`useMotionValue`/`useSpring`/`useTransform`, perspective + rotateX/Y,
  only after the drop-in spring settles) with a full static fallback under
  `prefers-reduced-motion`; and a pulsing live-status dot plus a scroll-cue
  indicator.
- **`MagneticButton`/`MagneticOutlineButton`** (new,
  `src/components/site/magnetic-button.tsx`) — a cursor-pull hover effect
  plus a diagonal sheen sweep and an arrow that translates on hover.
  Reused for every primary marketing CTA (header, mobile drawer, hero,
  footer CTA band); the plain `GoldButton`/`OutlineButton` from Session 6
  are kept as-is for dense in-flow UI (form submits, wizard step
  navigation) where a magnetic pull would feel out of place.
- **Header** — nav links now get an animated underline on hover; the
  mobile drawer's open/close is a circular clip-path reveal from the
  hamburger's corner with staggered link entrance, instead of a plain
  slide-down panel.
- **Footer CTA band** — a radial gold glow, "PRODUCTION?" recoloured gold,
  and the new magnetic buttons.

### Bug fixed

The first per-letter headline implementation split every character into
its own `inline-block` span with no word grouping, so the browser's normal
line-wrapping broke words mid-letter ("TO FINISHED GAR / MENT"). Fixed by
grouping letters per word inside a `white-space: nowrap` wrapper, so
wrapping can only happen between words, matching how the rest of the
headline typography behaves.

### Verified

`npm run lint` / `npx tsc --noEmit` — clean. `npm test` — 46/46 (unchanged;
this pass touched no business logic). `npm run build` — 66 routes, clean.
Live-verified in-browser: hero renders correctly with the new garment
shading/shadow, the shimmer headline wraps as one clean line, the product
rail's garments inherit the same upgrade automatically, and the footer CTA
band's glow/buttons render correctly.

### Still deferred (unchanged from Session 6)

Signature GSAP scroll-choreographed sequences (hero→section garment
travel, How We Work's garment journey), a dedicated Track Order lookup
flow, custom cursor, and analytics event instrumentation — none of this
session's scope.

---

## 2026-09-21 — Session 6 (Claude Sonnet) — Public website, AI Design Lab, Enquiry integration

### Context

A large brief to build the customer-facing public Texcroft website
(texcroft.com) as an integrated layer on top of the existing Texcroft OS,
not a disconnected marketing site. Explicit requirements: reuse the
existing data model/RBAC/auth, never duplicate business logic, keep
Texcroft's real brand (white/black/gold, Barlow Condensed/Inter — discovered
by inspecting the real texcroft.com, which does not match Texcroft OS's own
invented indigo-navy design system), and make every public lead-capture
surface create a real Enquiry inside Texcroft OS.

### What was built

- **Public site shell** (`src/app/(site)/**`) — its own layout, scoped
  design tokens (`site.css`, imported only by that layout so Texcroft OS's
  `globals.css` tokens are untouched), Barlow Condensed + Inter fonts added
  alongside the existing Geist fonts in the root layout. Root `/` — which
  previously just `redirect()`-ed to `/dashboard` — now serves the real
  public homepage; internal login already redirected straight to
  `/dashboard` (not `/`), so this didn't disturb the internal sign-in flow.
- **Homepage** — animated hero (T-shirt SVG drop-in with a spring overshoot,
  gentle idle float, full `prefers-reduced-motion` fallback), trust strip,
  "What Texcroft Does" with floating spec-annotation chips, a horizontal
  product rail, why-Texcroft pillars, an interactive Design Lab colour
  preview (a real working swatch picker, not a screenshot), a
  buyer-visibility mock, and the canonical quote form.
- **Content pages** — `/products`, `/products/[category]`,
  `/how-we-work`, `/quality`, `/about`, `/contact`, `/blog`, `/blog/[slug]`,
  all built from Texcroft's real site copy (fetched and read directly from
  texcroft.com in-session) rather than invented content.
- **AI Design Lab** (`/design`) — the full 5-step wizard: Product (category
  + garment grid) → Colour (18 swatches + custom hex + live SVG recolour) →
  Design (front/back upload with type/size validation, an AI-generate field
  that is **honestly stubbed** — see below) → Specs (per-size steppers with
  live 50-pc MOQ enforcement and a progressive-disclosure "more options"
  panel) → Contact (project summary + submit). Draft state persists to
  `localStorage` (never contact details) so a refresh doesn't lose progress.
- **Public → Enquiry integration (the critical piece)** —
  `src/lib/public/enquiry-intake.ts`'s `createPublicEnquiry` is the single
  entry point every public form calls (via the `submitPublicEnquiry` server
  action). It finds-or-creates a `Buyer` by email, round-robins a
  merchandiser from the same pool seed generation uses, and pushes a real
  `Enquiry` — extended with new **optional** fields (`source`,
  `contactName/Email/Phone`, `sizeBreakdown`, `designConfig`, and
  `targetPrice` made optional) so zero existing internal enquiries or their
  3 render sites broke. Verified live end-to-end: submitted a homepage
  quote and a full Design Lab project, both appeared correctly in
  `/enquiries` with "Pending costing" (never a fabricated price) and, for
  the Design Lab one, a new "Design Lab Submission" card on the enquiry
  detail page showing the garment/colour/artwork/size breakdown a staff
  member can actually reopen.
- Added `motion` (Framer Motion) as the one animation dependency. No GSAP
  yet.

### Deliberate honesty decisions (per the brief's own instructions)

1. **AI Generate is not faked.** No image-generation service is connected
   in this environment. Clicking Generate always shows the same honest
   message — where the request would go — never a fabricated "generated"
   image.
2. **Artwork uploads are not actually persisted.** There is no file-storage
   backend in this environment (AGENTS.md §4 applies to the public site
   too). Uploads are validated (type/size) and their filename is recorded
   in the enquiry's `designConfig`; the binary itself isn't stored anywhere.
   Documented in `docs/DATA_MODEL.md`, not silently pretended to work.
3. **`targetPrice` is never fabricated** for a public lead — it's
   `undefined` until a merchandiser costs it, matching the existing
   never-invent-a-number principle from cost variance (§17).

### What was deferred, and why

The brief's own Phase 58 says "do not start animation before underlying
content/layout is stable." This session built Phases 1–9 (audit → design
tokens → nav/footer → all content pages → Design Lab → Enquiry integration)
to a solid, fully-working state with tasteful Framer Motion reveals/hero
motion, but explicitly did **not** attempt the signature GSAP
scroll-choreographed sequences (hero→section garment travel, the How We
Work "garment journey" scroll animation, Quality page annotation
choreography) — those are large, easy-to-get-wrong pieces best built once
the rest is confirmed stable, and are called out as not-started in
`docs/BUILD_PROGRESS.md` Phase 12 rather than shipped half-working.
Similarly, "Track Order" currently links straight to the existing `/login`
demo session (reusing real auth, per the brief's explicit "do not build an
insecure public order lookup") rather than a dedicated
reference-number-plus-email lookup flow, which is real future work.

### Bugs found and fixed during live verification

1. **Header/Design-Lab `react-hooks/set-state-in-effect` lint errors.** The
   mobile-drawer "close on route change" effect and the Design Lab's
   "restore draft from localStorage on mount" effect both called `setState`
   directly inside a plain effect body, which the project's React Compiler
   ESLint rule flags. Fixed by (a) adjusting `mobileOpen` during render via
   the "track last pathname" comparison pattern instead of an effect, and
   (b) moving the localStorage restore into `useState`'s lazy initializer
   (guarded for SSR with `typeof window === "undefined"`) instead of a
   post-mount effect.
2. **Black colour swatch invisible against a dark section background** (the
   homepage Design Lab preview) — fixed by adding a subtle white/30 border
   to every swatch button so black reads correctly on `--tx-ink`.
3. **Repeated `Reveal`+nested-`div` duplicate-style bug** introduced by
   copy-pasting the same "wrap in Reveal, then re-wrap in a styled div"
   pattern across several new page files (`why-texcroft.tsx`,
   `buyer-visibility.tsx`, `quality/page.tsx`, `contact/page.tsx`,
   `blog/[slug]/page.tsx`) — `Reveal` doesn't accept a `style` prop, so each
   was passing `style={undefined}` redundantly. Fixed by removing the outer
   style prop and keeping styling on the single inner `div` in every case;
   also extended `Reveal` to accept an optional `id` (needed for the
   `#quote` anchor on the Contact page).

### Verified

- `npm run lint` / `npx tsc --noEmit` — clean.
- `npm test` — 46/46 passing (42 pre-existing + 4 new Workflow 18 tests
  covering enquiry creation, buyer dedup by email, Design Lab config
  serialization, and malformed-submission rejection).
- `npm run build` — 66 routes, all public pages compiled (most statically
  generated; `/design` and `/contact`'s form are the dynamic exceptions).
- Live browser verification: full Design Lab walkthrough (product → colour
  → design → MOQ-blocked-then-met specs → contact → submit) end to end;
  homepage quote form submission; both confirmed present with correct data
  in `/enquiries`; mobile (375px) spot-check on homepage and Design Lab;
  real Texcroft mountain-mark logo swapped in for both light and dark
  (footer) contexts after the user shared the actual logo mid-session.

### Known gaps for the next session

- Signature GSAP animations (Phase 11 of the original brief) not started.
- No real garment photography/renders exist in this environment — an SVG
  silhouette (`TShirtSVG`/`AnimatedTShirtSVG`) stands in throughout,
  documented as such rather than presented as a real product photo.
- Track Order is not yet a dedicated reference+email lookup flow.
- Analytics events (`quote_started`, `design_lab_completed`, etc. — brief
  §54) are not yet instrumented.

---

## 2026-09-20 — Session 5 (Claude Sonnet) — Enhancement pass: issues, action center, change requests, cost variance, next action, milestone impact

### Context

Scoped enhancement request — explicitly not a redesign, explicitly bounded
to six items, with a hard rule against duplicating existing risk/notification/
milestone/QC/finance/production logic. All six items were extensions of the
existing architecture; no new module boundaries, no new RBAC model, no new
design system components.

### What was built

1. **Production Issues / Escalations** — new `ProductionIssue` entity
   (`src/types/domain.ts`) reusing the existing `RiskLevel` type for
   severity and `ProductionStage` for stage (no duplicate enums). New
   `/production/issues` list + `/production/issues/[id]` detail pages, a
   shared `IssueForm`/`ResolveForm` reused unmodified across the internal
   app, Order 360, and the factory partner portal (`/partner/issues`, which
   was rewritten to read real persisted issues via `getIssuesForFactory`
   instead of its previous non-persisting toast-only form).
2. **Action / Exception Center** (`/action-center`) — `getActionCenterItems`
   (`src/lib/data/action-center.ts`) contains **no new calculations**; it
   re-reads `listOrders`, `calculateMaterialAvailability`, `listSamples`,
   `listInspections`, `getUpcomingDispatches`, `listInvoices`,
   `calculateFactoryUtilisation`, and `listProductionIssues` and projects
   each into one common shape for triage. See BUSINESS_RULES.md §18.
3. **Order Change Requests** — new `OrderChangeRequest` entity, immutable
   per-field revision records (old value, new value, requester, reason,
   approval, implementation status) rather than in-place mutation of order
   fields. Create/decide/implement Server Actions on Order 360; buyers see a
   read-only card in the buyer portal with no approve/reject controls. See
   BUSINESS_RULES.md §19.
4. **Estimated vs. actual cost/margin** — `calculateCostVariance`
   (`src/lib/calculations/costing.ts`) compares the order's first vs. latest
   costing version plus real rework cost summed from `production_entries`,
   with a `hasReworkData` flag so the UI never presents a fabricated actual
   value as if it were verified. Surfaced as a new Cost & Margin card on
   Order 360's Summary tab.
5. **Next Action visibility** — `calculateNextAction`
   (`src/lib/calculations/next-action.ts`) walks the existing milestone
   sequence for the first not-yet-`done` milestone; added as a 5th metric
   card on Order 360 (grid went from 4 to 5 columns).
6. **Milestone dependency impact** — `calculateMilestoneImpacts`
   (`src/lib/calculations/milestone-impact.ts`), explicitly not a scheduling
   engine: names the next milestone in sequence as "may start late" and
   carries the delay into a "potential dispatch impact" line, stopping at
   the order's current bottleneck. New card in Order 360's Timeline tab,
   below the existing `MilestoneTimeline`.

Supporting work: centralized `MILESTONE_SEQUENCE` in `src/lib/constants`
(previously a local const duplicated in seed generation); extended
`calculateOrderRisk` with a 7th sequential risk factor for open production
issues (appended as the last parameter to preserve positional
backward-compatibility with existing callers/tests); RBAC additions to
`src/lib/permissions/roles.ts` for three new resources (`issues`,
`change_requests`, `action_center`) with buyer/factory-partner isolation
enforced per the brief (buyers never see issues/action_center; factory
partners never see change_requests/action_center, only their own factory's
issues, plus a narrow exception letting factory partners create issues on
their own assigned orders).

### Bug found and fixed during live verification

`calculateMilestoneImpacts`'s first version independently flagged every
future not-yet-started milestone as "late" (5 noisy cascading messages on
the flagship order instead of a clean 1–2), because their planned dates had
already passed relative to the fixed "today" even though nobody had reached
them yet. Fixed by stopping evaluation at the order's current bottleneck
(the first not-yet-`done` milestone) — confirmed via live browser re-check
that this reduced the flagship order's messages to exactly 2 correct,
actionable ones.

### Verified

- `npm run lint` — clean (0 errors; 1 pre-existing React Compiler warning on
  `DataTable`'s `useReactTable`, unrelated to this session's changes).
- `npm run typecheck` — clean.
- `npm test` — 42/42 tests passing across 17 workflow suites (26 pre-existing
  + 16 new, covering cost variance, next action, milestone impact, issues
  data access, change requests data access, and the action center).
- `npm run build` — all 41 routes compile, including the three new ones
  (`/production/issues`, `/production/issues/[id]`, `/action-center`).
- Live browser check of Order 360 (TC-2609-014) confirmed the new Cost &
  Margin card, Next Action metric, Issues tab, and Milestone Dependency
  Impact card all render correctly with real data, and that the impact-noise
  bug above was fixed.

### Docs updated

`docs/DATA_MODEL.md` (`production_issues`, `order_change_requests`
entities), `docs/BUSINESS_RULES.md` (§15–§19: next action & milestone
impact, production issues risk influence, cost variance, action center,
change requests), `docs/ROUTES.md` (three new routes), `docs/BUILD_PROGRESS.md`.
`docs/UI_SYSTEM.md` needed no changes — every form/table/badge pattern used
was already in the shared component library.

---

## 2026-09-20 — Session 4 (Claude Sonnet) — Audit fixes (Supabase schema/RLS, notification routing, dashboard chart)

### Context

A read-only audit (see the report pasted into this session) reviewed Session
3's additions (test suite, notification mutations, Supabase migrations) and
found 2 HIGH, 2 MEDIUM, and 2 LOW priority issues. This session fixed all of
them.

### What was fixed

1. **H-1 — `supplier_materials` table was documented but never added to the
   DDL.** Added it to `supabase/migrations/0001_initial_schema.sql` (fk to
   `suppliers`, `material_category` check constraint, `typical_rate`, `moq`)
   with an index and RLS policy, matching `docs/DATA_MODEL.md`.
2. **H-2 — RLS helper functions were declared in the `auth` schema**
   (`auth.current_role()` etc.), which a normal Supabase migration role
   cannot create objects in (that schema is owned by `supabase_auth_admin`).
   Moved all four to `public.*` in `supabase/migrations/0002_rls_policies.sql`
   and updated every policy that referenced them. While in there, also
   pinned `search_path = public, pg_temp` on each `security definer`
   function — standard hardening against search_path hijacking that the
   audit didn't flag but is the same class of issue.
3. **M-2 — `factory_orders_select` RLS policy only checked `orders.factory_id`**,
   so a factory holding an order via `production_assignments` (e.g. a
   reassignment) but not as the order's primary factory would not see it.
   Broadened the policy to check both.
4. **M-1 — Dashboard's "Planned vs Actual Production" chart used a synthetic
   planned line** (`8000 + week * 400`) unrelated to any order data. Replaced
   it with a real derivation: each order's quantity spread evenly across its
   own `createdAt`→`expectedDispatchDate` window, summed per week by how much
   of that window falls in that week. `actual` was already a real sum of
   `production_entries`; now both lines answer "how much should/did happen
   this week" from the same order data. See `getProductionChartData` in
   `src/lib/data/dashboard.ts`.
5. **L-1 — Notification click-through only handled `entityType === "order"`**,
   defaulting everything else (`quality_inspection`, `sample`, `dispatch`,
   `invoice`) to `href="#"`. Added a single `notificationHref(entityType,
   entityId)` helper in `src/lib/utils/format.ts` and used it in both
   `notification-bell.tsx` and `notifications-view.tsx` (AGENTS.md §2.2: one
   implementation, not two copies of the same switch).
6. **L-2 — Defect rows always rendered as a `<Link>`**, falling back to
   `href="#"` when a defect's parent inspection wasn't found. Now renders a
   plain non-interactive row in that case instead of a dead link.

### Verification

- `npx tsc --noEmit`: clean.
- `npm test`: 26/26 still passing (no calculation logic changed, only the
  dashboard chart's planned-value derivation, which isn't under test).
- `npm run lint`: clean (same 1 pre-existing TanStack Table compiler note).
- `npm run build`: clean, all 39 routes.
- Loaded `/dashboard` and `/quality/defects` live and confirmed both render
  correctly with the new logic; no console errors beyond benign HMR
  websocket noise from the dev proxy.

### Remaining work

Same as Session 3's list — Supabase project not yet connected in this
environment (apply the two migration files once one is), and Playwright/
visual-regression coverage beyond the `npm test` unit suite is still open.

---

## 2026-09-20 — Session 3 (Gemini 2.5 Pro) — Test Suite, Notification Mutations, & Supabase DDL/RLS

### What was built

1. **Automated Test Suite for Core Workflows & Business Rules (`tests/workflows.test.ts`)**:
   - 26 automated unit/integration tests covering all 12 key workflows from brief §60:
     1. Production event-sourced calculations & cumulative stage totals (`calculateProductionProgress`, `calculateOrderStageProgress`).
     2. Bulk production sampling gate enforcement (`canEnterBulkProduction` blocking until PP sample approved).
     3. Deterministic risk engine evaluation (`calculateOrderRisk` checking production delay, material ETA, milestone variance, factory overload, dispatch proximity).
     4. Material procurement availability & shortage logic (`calculateMaterialAvailability` checking procurement sufficiency vs required).
     5. Costing breakdown, item waste percent calculations, margin, and version comparisons (`calculateCosting`, `compareCostingVersions`).
     6. Milestone variance tracking (`calculateMilestoneVariance` for planned vs actual dates, positive variance days).
     7. Factory utilisation over planning horizons (`calculateFactoryUtilisation` 30-day capacity vs committed orders).
     8. Supplier scorecards and performance metrics (`calculateSupplierPerformance` on-time %, lead time, QC acceptance %).
     9. Invoice financials and outstanding payment status derivations (`calculateOutstandingPayment` paid, partially paid, overdue, sent).
     10. Buyer KPIs and lifetime value (`calculateBuyerKpis`).
     11. Permissions and RBAC security matrix (`can(role, action, resource)`).
     12. Data access layer integrity & relationship consistency (Order 360 flagship TC-2609-014 integrity, Buyer Portal safe fields isolation, and Factory Partner isolation).
   - Added `npm test` script using `tsx --conditions=react-server --test tests/**/*.test.ts`. All 26 tests passing.

2. **Notification Mutations & Interactive Management**:
   - Implemented `markNotificationRead` and `markAllNotificationsRead` in `src/lib/data/notifications.ts`.
   - Created Server Actions in `src/app/(app)/notifications/actions.ts`.
   - Built interactive `NotificationsView` (`src/app/(app)/notifications/notifications-view.tsx`) with instant optimistic feedback, toast notifications, single-click read checkmarks, and "Mark all as read" button in the header.

3. **Supabase Database Schema & RLS Migrations**:
   - Created `supabase/migrations/0001_initial_schema.sql` defining all 22+ tables, relationships, UUID defaults, check constraints, indexes on foreign keys, and `updated_at` trigger functions.
   - Created `supabase/migrations/0002_rls_policies.sql` establishing granular Row Level Security (RLS) policies enforcing multi-tenant isolation for Buyers and Factory Partners, and internal staff role permissions.

### Verification

- `npm run lint`: Clean (0 errors, 1 standard React compiler note for TanStack table).
- `npx tsc --noEmit`: Clean (0 errors across whole codebase).
- `npm test`: 26/26 tests passing across 12 test suites.
- `npm run build`: Clean (39/39 routes compiled and statically generated/verified).

### Remaining work & Next steps

- When a live Supabase project is attached, provide `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in environment variables and apply `supabase/migrations/0001_initial_schema.sql` and `0002_rls_policies.sql`.
- The in-memory data-access layer (`src/lib/data/*`) can have individual function bodies swapped to direct Supabase queries with no change required in any UI component or server action.

---

## 2026-09-20 — Session 2 (Claude Sonnet) — Full application build

### What was built

Everything in `docs/BUILD_PROGRESS.md` Phases 2–9, plus most of Phase 10.
In one session, on top of the Session 1 scaffold: the complete data/type/
calculation/permission foundation, the full shared component library, the
app shell, and **every module route in the brief** — Sales (enquiries,
buyers, costing), Orders (orders, styles, samples), Sourcing (materials,
purchase orders, suppliers), Production (control centre, daily entry,
factories), Quality (inspections, defects), Logistics (packing, dispatch),
Finance (invoices, payments), Intelligence (analytics, Ask Texcroft), plus
the Buyer Portal and Factory Partner Portal. `npm run lint`, `npx tsc
--noEmit`, and `npm run build` are all clean (39 routes, 0 errors).

### Verified in-browser (not just "it compiles")

- The flagship demo path from brief §57 works exactly as specified:
  Dashboard → **TC-2609-014** → Order 360 (North & Row Apparel, 5,000
  Heavyweight Oversized Hoodie, ₹28,50,000, 72% stitching, 18% finishing,
  MEDIUM risk, 29 Sep 2026 dispatch) → "View as Buyer" → Buyer Portal shows
  the same order with only buyer-safe fields.
- Submitted a real Daily Production Update for TC-2609-014 and watched Order
  360's stitching progress and risk level update live with no other code
  touched — confirms the event-sourced production model in
  `BUSINESS_RULES.md` §4 actually holds, not just documented intent.
- Ask Texcroft's "highest workload" answer matches the same numbers the
  Factories page shows, computed through the same `calculateFactoryUtilisation`.

### Bugs found during manual QA and root-caused (not papered over)

1. **Factory utilisation always read "overloaded."** `assigned_quantity` is a
   whole order's quantity, not a daily rate, so comparing it against
   `daily_capacity_pieces` directly made every factory look permanently over
   capacity, which cascaded into ~28 of 30 orders showing MEDIUM+ risk. Fixed
   by comparing committed pieces against capacity over a 30-day planning
   horizon instead of one day. See `calculateFactoryUtilisation` in
   `src/lib/calculations/factory.ts` and BUSINESS_RULES.md §9.
2. **Seed order dates put most dispatch dates in the past.** The original
   generator anchored all order timelines to a fixed April 2026 start, so by
   "today" (2026-09-20) most in-progress orders' dispatch dates had already
   passed — which broke the risk engine's expected-vs-actual progress
   comparison (division by an already-elapsed span). Fixed by generating
   in-progress orders with dispatch dates in the future and only-dispatch/
   completed orders with dates in the past, relative to today. See
   `src/lib/seed/orders.ts`.
3. **Material "shortage" flagged fully-received, fully-consumed material.**
   The original formula compared `required_qty` against leftover
   `available_qty` (received − allocated), so material that had simply been
   consumed by production as expected looked like a shortage. Shortage is
   now `required_qty − received_qty` (a procurement-sufficiency check);
   leftover stock is tracked separately and never drives the flag. See
   `calculateMaterialAvailability` in `src/lib/calculations/materials.ts` and
   BUSINESS_RULES.md §5.
4. **Flagship order's currency resolved to GBP** (North & Row Apparel's
   default) instead of the INR figures the brief specifies for TC-2609-014.
   Root cause turned out bigger: `order.currency` was derived from
   `buyer.currency`, so summing `quantity * pricePerPiece` across a buyer's
   orders for KPIs silently mixed currencies (one buyer showed a £3M
   "lifetime value" built from adding raw GBP and INR numbers together).
   Fixed at the source: every order's value is now recorded in INR — Texcroft's
   internal books-of-record currency, matching the ₹ figures used everywhere
   on the dashboard — and `buyer.currency` is kept as separate metadata
   (their own invoicing preference) never used in an order-value sum. See
   the comment on `Order.currency` assignment in `src/lib/seed/orders.ts`.
5. **`ColumnDef[]` arrays with JSX `cell` renderers, and chart formatter
   props, are functions — and 10 list pages had them defined directly in a
   Server Component page file** (no `"use client"`), which throws
   "Functions cannot be passed directly to Client Components" **at page-load
   time only** — `npm run build` stays green because static generation
   doesn't exercise this path the same way. Caught by manually loading pages
   in a browser and then confirmed with a `curl` sweep of all 39 routes.
   Fixed by moving every such `columns` array into a sibling `columns.tsx`
   marked `"use client"` (pattern already established in
   `src/app/(app)/orders/columns.tsx`), and by giving the analytics chart
   components a `format: "money" | "percent" | "days" | "plain"` string prop
   instead of a `valueFormatter` function prop. **Added as AGENTS.md §2.12** —
   this is exactly the kind of mistake a continuation model could easily
   reintroduce by copying an old page as a template, so a `curl`/browser
   check of any new list or chart page is now a documented requirement, not
   just "run the build."

---

## 2026-09-20 — Session 1 (Claude Opus/Sonnet) — Planning & scaffold

### What was built
- Full documentation set (AGENTS.md + all files in `docs/`) per the client
  brief's Phase 1 requirement.
- Next.js 16 (App Router) + TypeScript strict + Tailwind v4 project scaffolded
  at `texcroft-os/`.
- shadcn/ui initialized (Radix base, Nova preset) with the core component set
  installed: button, card, badge, table, dialog, sheet, dropdown-menu,
  select, input, label, textarea, tabs, separator, avatar, tooltip, popover,
  command, calendar, checkbox, switch, progress, skeleton, scroll-area,
  accordion, alert, alert-dialog, breadcrumb, navigation-menu, sonner.
- Core dependencies installed: zod, react-hook-form, @hookform/resolvers,
  @tanstack/react-table, recharts, date-fns, sonner, lucide-react,
  @supabase/supabase-js, @supabase/ssr, class-variance-authority, clsx,
  tailwind-merge.
