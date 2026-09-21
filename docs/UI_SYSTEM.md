# UI_SYSTEM.md — Texcroft OS Design System

Visual reference points: Linear, Stripe Dashboard, Ramp, Vercel. The result
must be original, not a skin of any one of them.

## Design tokens

Defined as CSS variables in `src/app/globals.css`, consumed via Tailwind.

- **Surfaces:** `--background` near-white (`oklch(0.99 0 0)`), `--card` white,
  `--muted` very light neutral grey for secondary surfaces.
- **Text:** `--foreground` near-black for primary text, `--muted-foreground`
  mid-grey for secondary text/labels.
- **Border:** a single subtle `--border` grey used everywhere; no ad hoc
  border colours.
- **Accent:** one brand accent (deep indigo/navy, `--primary`) used sparingly
  for primary actions and active nav state — not for decoration.
- **Semantic status colours** (`src/lib/constants/status.ts` +
  Tailwind utility classes `status-success`, `status-warning`,
  `status-danger`, `status-info`, `status-neutral`):
  - Green = completed / healthy / on-time
  - Amber = warning / at risk / MEDIUM risk
  - Red = delayed / failed / urgent / HIGH or CRITICAL risk
  - Blue = active / informational / in-progress
  - Grey = pending / inactive / not started
  These five map directly to `StatusBadge` and `RiskBadge` variants. No
  component picks a colour outside this set for a status meaning.

## Typography

- One font family (system/Inter-class sans) at a restrained scale:
  - Page title: 20–24px semi-bold
  - Section heading: 15–16px semi-bold
  - Body/table text: 13–14px regular
  - Micro/label text: 12px medium, `muted-foreground`, often uppercase with
    letter-spacing for table headers and eyebrow labels
- Numbers (money, quantities, percentages) use tabular figures so columns
  align.

## Spacing

- Base unit 4px via Tailwind's default scale. Page padding 24px (`p-6`) on
  desktop, 16px (`p-4`) on mobile. Card padding 16–20px. Vertical rhythm
  between sections: 24px. Tables/lists: row height ~44–48px, dense enough for
  professional daily use without feeling cramped.

## Cards

- White surface, `1px` `--border`, `rounded-lg` (8px), subtle shadow only on
  hover/interactive cards, never a heavy drop shadow at rest.
- `MetricCard`: label (muted, small) → big number → optional delta/sub-label.
  No icons-as-decoration; an icon is only used if it adds scannable meaning
  (e.g. a small trend arrow).

## Tables (`DataTable`)

- One implementation wrapping TanStack Table for every list page.
- Sticky header, right-aligned numeric columns, left-aligned text columns.
- Sortable column headers show a subtle caret only when sortable/sorted.
- Row click navigates to the detail page; explicit row actions live in a
  trailing `...` menu, never a bare icon soup.
- Built-in states: loading (skeleton rows), empty (`EmptyState`), and paginated
  footer (page size + prev/next + "X–Y of Z").
- Column visibility and row selection are opt-in props, not always shown.

## Modals / Sheets

- `Dialog` for short confirmations and small forms (≤1 screen of fields).
- `Sheet` (slide-over) for longer forms or detail-adjacent editing (e.g.
  "Add Production Entry") so context on the page behind isn't lost.
- `ConfirmDialog` is the single implementation for every destructive/confirm
  action — never a bespoke `window.confirm` or one-off dialog.

## Forms

- React Hook Form + Zod resolver. `FormSection` groups related fields with a
  small heading and optional description.
- Every field has a visible `Label`. Inline error text sits directly under
  the field in the danger colour. Submit buttons show a loading spinner state
  and disable while pending. Success is confirmed via a Sonner toast; the
  form does not silently reset without feedback.

## Buttons

- One `Button` component (shadcn) with variants: `default` (primary, filled,
  accent colour — one per view max), `secondary` (outline/neutral, most
  actions), `ghost` (low-emphasis/table row actions), `destructive` (red,
  confirm-gated). No custom one-off button styles.

## Badges

- `StatusBadge` — stage/status text (e.g. "In Transit", "Approved") mapped
  through the semantic colour set.
- `RiskBadge` — always shows the level (LOW/MEDIUM/HIGH/CRITICAL) and, on
  hover/tooltip, the computed reason text from the risk engine. Never a bare
  colour dot with no label.

## Status colours reference

| Meaning | Colour | Used for |
|---|---|---|
| Healthy / done | Green | Completed stage, on-time milestone, PASS QC, paid invoice |
| Active / info | Blue | In-progress stage, active order, informational badges |
| Pending / inactive | Grey | Not started, draft, inactive |
| Warning / at risk | Amber | MEDIUM risk, partial receipt, conditional QC pass, overdue soon |
| Danger / urgent | Red | HIGH/CRITICAL risk, delayed milestone, FAIL QC, overdue invoice |

## Charts

- Recharts only. Every chart has: axis labels, a tooltip, a legend when more
  than one series, and responds to a date-range control where relevant
  (dashboard production chart, analytics). No chart is purely decorative —
  each answers a specific question named in its heading (e.g. "Planned vs.
  Actual Production").
- Chart colour: use the same semantic palette as status where the series maps
  to a status meaning (e.g. planned = grey, actual = blue); otherwise a small
  fixed categorical palette (max 6 hues) shared across all charts.

## Navigation

- **Sidebar** (`components/layout/Sidebar.tsx`): logo/wordmark, grouped nav
  (SALES, ORDERS, SOURCING, PRODUCTION, QUALITY, LOGISTICS, FINANCE,
  INTELLIGENCE, SYSTEM) matching `docs/ROUTES.md`. Active route highlighted
  with accent-coloured left bar + tinted background. Collapsible to icon-only
  rail; state persisted client-side.
- **Header** (`components/layout/Header.tsx`): breadcrumb (derived from
  route), global search (`SearchInput`, `⌘K`), quick-create (`+ New`
  dropdown), notification bell with unread count, user avatar/menu.
- **Portal/Partner shells** are visually related (same tokens, typography,
  components) but simplified: a lighter top nav instead of the full sidebar,
  because their scope is a fraction of the internal app's.

## Responsive behaviour

- **Internal ops app:** desktop-first, fully usable at tablet width (sidebar
  collapses to icon rail ≤1024px, tables scroll horizontally rather than
  break). Not optimized for phone width beyond "doesn't break."
- **Daily Production Update, QC entry:** mobile-first — single column, large
  tap targets, numeric keypads for quantity fields, minimal chrome.
- **Buyer Portal:** fully responsive desktop→mobile, since buyers may check
  on a phone.
- **Factory Partner Portal:** mobile-first, same reasoning as production
  entry — a supervisor uses this on a phone on the shop floor.

## Standard components (see AGENTS.md §2.9 for the full list)

Each is documented at the top of its own file with its props. Pages compose
these rather than re-implementing layout/formatting logic. `MoneyDisplay`,
`PercentageDisplay`, and `DateDisplay` all wrap the shared `format.ts`
helpers so number/date formatting is identical everywhere in the app.
