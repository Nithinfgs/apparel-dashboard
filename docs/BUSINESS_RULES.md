# BUSINESS_RULES.md — Texcroft OS

This document is the authoritative description of how a garment order moves
through Texcroft's real workflow, and the deterministic rules the app enforces
or computes. Every rule here must be implemented as a pure function in
`src/lib/calculations/` — never re-derived ad hoc inside a component.

## 1. Order lifecycle stages

```
enquiry → costing → sampling → sourcing → cutting → stitching → finishing →
quality → packing → dispatch → completed
```

An `orders.stage` value is the order's *current* stage. Earlier stages are
implicitly complete; the UI (`OrderLifecycleBar`) renders all stages with
✅/percentage/pending based on computed progress, not just the single
`stage` field, because multiple stages can have partial concurrent progress
(e.g. cutting 100%, stitching 72%, finishing 18% — all real at once).

## 2. Enquiry → Order conversion

An enquiry can be converted to an order only when `status = confirmed`.
Conversion (`convertEnquiryToOrder`):
- Creates an `order` carrying over `buyer_id`, product summary → style
  reference (or prompts to create/select a style), and the latest costing.
- Sets `enquiries.converted_order_id` and leaves the enquiry visible from the
  order for history (never deletes the enquiry).
- The order's `owner_id` defaults to the enquiry's `merchandiser_id`.

## 3. Sampling gate (hard rule)

**An order cannot enter bulk production (`stage` moving to `stitching` or
beyond) until it has at least one `sample` of `sample_type = pp` with
`status = approved`.**

`canEnterBulkProduction(order, samples): { allowed: boolean; reason?: string }`
is the single implementation of this check. Any UI action that would advance
an order past `sourcing`/`cutting` into `stitching` must call this first and
block with the reason if it returns `allowed: false`.

## 4. Production totals are event-sourced

Daily entries in `production_entries` are the only way cumulative production
changes. `orders.production_progress` is **never** written directly by a
form; it is always:

```
completed(stage) = SUM(production_entries.produced_qty
                        WHERE order_id = X AND stage = Y)
progress(stage)  = completed(stage) / order.quantity
```

`calculateProductionProgress(order, entries)` returns per-stage completed
quantity, percentage, rejected quantity, reworked quantity, and daily average
(completed / distinct days with entries). This guarantees totals shown on the
Order 360 page, the buyer portal, the factory portal, and the production
board can never drift apart — they are all computed from the same entries at
render time.

## 5. Material availability

```
available_qty = max(0, received_qty - allocated_qty)
shortage      = max(0, required_qty - received_qty)
```

Shortage is a **procurement** signal (did enough arrive), not a stock-on-hand
signal — comparing `required_qty` against leftover `available_qty` would flag
a "shortage" on material that has simply been consumed by production as
expected. `calculateMaterialAvailability(material)` returns both figures plus
a `status: 'sufficient' | 'shortage' | 'overdue'` (overdue when
`expected_arrival < today` and `status` is not yet `received`).

## 6. Milestone variance

For each `order_milestone`:
```
variance_days = actual_date ? (actual_date - planned_date in days) : (today - planned_date in days, only if today > planned_date and no actual_date yet)
status = actual_date ? 'done' : (variance_days > 0 ? 'delayed' : 'pending'/'in_progress')
```
`calculateMilestoneVariance(milestone)` implements this. A positive variance
is late; the UI always shows the sign explicitly (`+2 days`).

## 7. Risk engine (deterministic, explainable)

`calculateOrderRisk(order, entries, materials, samples, milestones)` returns
`{ level: 'low'|'medium'|'high'|'critical', reasons: string[] }`. It is rule
based — no ML, no opaque score. Contributing factors, each of which can push
the level up:

1. **Production behind plan:** expected completion-by-today (linear from
   order start to `expected_dispatch_date`) minus actual completion % beyond
   a threshold.
   - gap ≥ 25 points → contributes HIGH
   - gap 10–24 points → contributes MEDIUM
2. **Material ETA after required date:** any material with `expected_arrival`
   later than the planned cutting-start milestone → contributes HIGH.
3. **QC failure:** any `quality_inspection.result = fail` on the order and
   unresolved → contributes HIGH.
4. **Buyer approval pending:** a required sample/document approval
   outstanding within 7 days of a dependent milestone → contributes MEDIUM.
5. **Dispatch proximity with incomplete stages:** `expected_dispatch_date`
   within 5 days and any stage before `packing` not 100% → contributes
   CRITICAL.
6. **Factory overload:** assigned factory's `calculateFactoryUtilisation()` >
   100% → contributes MEDIUM.

Final level = the highest contributing level. `reasons` lists every factor
that fired, in the exact language shown in the UI (e.g. "Stitching is 8%
behind planned completion"), so a risk badge is always explainable on hover —
never an unexplained colour.

## 8. Costing → Margin

```
material_cost      = Σ costing_items where category in fabric/rib/thread/labels/buttons_zippers
processing_cost     = Σ costing_items where category in printing/embroidery/washing
manufacturing_cost  = Σ costing_items where category in cutting/stitching/finishing
packaging_cost      = costing_items where category = packing
logistics_cost      = costing_items where category = freight
overhead_cost       = costing_items where category = other
cost_per_piece      = material + processing + manufacturing + packaging + logistics + overhead
                       (each item's calculated_cost = consumption * rate * (1 + waste_percent/100))
profit_per_piece    = selling_price_per_piece - cost_per_piece
margin_percent      = profit_per_piece / selling_price_per_piece * 100
total_order_profit  = profit_per_piece * order.quantity
```
`calculateCosting(items, sellingPrice, quantity)` implements this and is the
only place these numbers are computed. Costing versions are immutable once
created; a new version is a new row referencing the same order/style, and the
UI diffs two versions side by side (`compareCostingVersions`).

## 9. Factory utilisation

```
committed_pieces  = Σ active production_assignments.assigned_quantity for that factory
horizon_capacity  = daily_capacity_pieces * planning_horizon_days   (default horizon: 30 days)
utilisation_pct   = committed_pieces / horizon_capacity * 100
```
`assigned_quantity` is a whole order's quantity, not a daily rate, so it is
compared against capacity over a planning horizon (an order's typical
production window) rather than a single day — comparing a multi-week order
total against one day of capacity would make every factory look permanently
overloaded. `calculateFactoryUtilisation(factory, assignments,
planningHorizonDays?)` — used both on the factory page and as a risk-engine
input.

## 10. Supplier performance

Computed only from actual seeded purchase order / receipt data — never an
arbitrary rating:
```
on_time_pct        = receipts on/before PO eta ÷ total receipts * 100
avg_lead_time_days = avg(receipt_date - po.order_date)
qc_acceptance_pct  = receipts with qc_hold = false ÷ total receipts * 100
total_purchase_value = Σ purchase_orders.total_value for that supplier
```
`calculateSupplierPerformance(supplier, purchaseOrders, receipts)`.

## 11. Outstanding payments

```
outstanding_amount = invoice.amount - Σ payments.amount for that invoice
invoice.status derives from outstanding_amount and due_date:
  0 → paid
  0 < outstanding < amount → partially_paid
  outstanding = amount and due_date < today → overdue
  outstanding = amount and due_date >= today → sent
```
`calculateOutstandingPayment(invoice, payments)`.

## 12. Buyer/order KPIs

- `lifetime_order_value = Σ orders.order_value for buyer`
- `average_order_size = lifetime_order_value / count(orders)`
- `on_time_delivery_pct = orders with actual_dispatch_date <= expected_dispatch_date ÷ dispatched orders * 100`

## 13. Notifications are event-driven, not manufactured

A notification is only ever created as a side effect of a real state change
(production entry behind plan detected on save, QC result = fail recorded,
material ETA slip detected, buyer approval received, invoice crossing
overdue, dispatch completed). The notification centre never displays a
notification that doesn't correspond to an actual row/event in the seed
data — this keeps the "Ask Texcroft" and dashboard numbers trustworthy and
consistent with each other.

## 14. Ask Texcroft

Implemented as deterministic query interpretation over the same data-access
layer everything else uses (`src/lib/ask-texcroft/`): a small set of intent
matchers (risk, dispatch-this-week, factory-workload, buyer-receivables,
qc-failures) each calling the same `list*`/`calculate*` functions used
elsewhere, so an answer here can never disagree with the dashboard. Built so
the intent-matching layer (regex/keyword today) can be swapped for an LLM
call later without touching the underlying query functions.

## 15. Next Action & milestone dependency impact (extensions, not a scheduler)

Both features read the existing `order_milestones` rows and
`MILESTONE_SEQUENCE` (the canonical ordered list of milestone keys, now
defined once in `src/lib/constants` and reused by seed generation) — neither
stores or duplicates any scheduling data of its own.

- **Next Action** (`calculateNextAction`, `src/lib/calculations/next-action.ts`):
  walks `MILESTONE_SEQUENCE` in order and returns the first milestone whose
  status isn't `done`, along with its existing owner and planned date. This
  is exactly "the next thing on the T&A plan" — there is no separate
  next-action table.
- **Milestone dependency impact** (`calculateMilestoneImpacts`,
  `src/lib/calculations/milestone-impact.ts`): deliberately not a scheduling
  engine (the brief explicitly rules this out). For a milestone that
  finished late, it names the very next milestone in `MILESTONE_SEQUENCE` as
  "may start late" and carries the same day count into a "potential dispatch
  impact" line, e.g. "PP Sample is 2 day(s) late → Buyer Approval may start
  late → potential dispatch impact +2 day(s)". Evaluation stops at the
  order's current bottleneck (the first not-yet-`done` milestone) —
  milestones further downstream haven't started yet, so independently
  comparing their planned date to "today" would flag every one of them as
  late purely because nobody has touched them, which is a data-freshness
  artifact, not a real cascading risk.

## 16. Production issues influence risk, they don't replace it

`ProductionIssue` reuses the existing `RiskLevel` type for its `severity`
field (no separate issue-severity enum). `calculateOrderRisk` takes the
order's open/in-progress issues as an additional input and, for each one,
raises the order's risk level to at least the issue's severity and appends a
human-readable reason ("Open issue: <description>") to the existing reasons
list — this is one more sequential risk factor alongside the pre-existing
ones (§7), not a parallel or overriding calculation.

## 17. Estimated vs. actual cost/margin — never fabricated

`calculateCostVariance` (`src/lib/calculations/costing.ts`) compares the
order's first costing version ("estimated") against its latest version
("current"), adding actual rework cost derived from summing
`production_entries` rework quantities for the order at the latest costing's
stitching rate per piece. It reports `costPerPieceVariance`,
`originalMarginPercent`, and `currentProjectedMarginPercent`, plus a
breakdown by fabric/production/rework/freight/other drawn directly from the
existing `CostingBreakdown` line items (§8) — no new cost categories are
invented. When there is no rework data to derive an actual rework cost from,
`hasReworkData` is `false` and the rework figure is `0`, never a guessed
value; the UI must show "no data" rather than treating that zero as a
verified actual cost.

## 18. Action / Exception Center is a view, not a new engine

`getActionCenterItems` (`src/lib/data/action-center.ts`) contains no new
business logic of its own beyond grouping and labelling. It re-reads
existing computed results — `listOrders` (delay/risk), material
availability, sample approvals pending, QC failures, upcoming dispatches,
overdue invoices, factory utilisation, and open production issues — and
projects each into a common `ExceptionItem` shape (issue, severity, owner,
due date, status, next action) for a single triage view. Fixing an
underlying condition (e.g. resolving a production issue) removes it from the
Action Center on the next read; there is no separate resolution flow to
maintain.

## 19. Order change requests preserve history, never overwrite silently

An `OrderChangeRequest` row is an immutable record of one proposed edit to
one field (quantity, colour, measurements, artwork, trims, packaging, or
delivery date): it captures `oldValue`, `newValue`, `requestedBy`, `reason`,
approval decision, and implementation status. Approving a change request
does not itself mutate the order — a separate, explicit "mark implemented"
action (`markChangeRequestImplemented`) records that the approved change was
actually carried into the order's own data, keeping "what was requested/
approved" and "what was actually changed and when" as two distinct,
auditable facts rather than one row silently overwritten in place. Buyers
can see the status of their own change requests (read-only, in the buyer
portal) but cannot approve or reject them — only internal roles can.

## 20. The public website is a front door onto the same Enquiry pipeline

The public marketing site (`src/app/(site)/**`) is not a separate product
with its own lead-storage tables. Every public lead surface — the homepage
quote form, About, Contact, a product page's "Request Quote", and every
Design Lab submission — calls the one canonical entry point,
`createPublicEnquiry` (`src/lib/public/enquiry-intake.ts`), via the single
server action `submitPublicEnquiry` (`src/app/(site)/actions.ts`). Each
caller only varies `source` (`"website_quote"` or `"design_lab"`) and which
optional fields it fills in — there is one submission shape
(`publicEnquirySchema`, `src/lib/validation/public-enquiry.ts`), not one
form implementation per page.

That entry point:

- **Finds or creates the Buyer by email** (case-insensitive) instead of a
  parallel "website lead" table — a repeat submission from the same email
  attaches to the same `Buyer` record. A newly created prospect Buyer gets
  `"To be confirmed"` for the fields Texcroft doesn't know yet (shipping
  location, payment terms, tax details) — never a guessed value.
- **Assigns a merchandiser round-robin** from the same merchandiser pool
  seed generation uses, so a public lead lands in a real merchandiser's
  queue exactly like an internally-logged enquiry.
- **Never fabricates `targetPrice`** — it's `undefined` until a
  merchandiser costs the enquiry (the enquiries list/detail pages render
  "Pending costing" instead of a false ₹0). This is the same
  never-invent-a-number principle as cost variance (§17).
- **Tags provenance** via `Enquiry.source` and, for Design Lab submissions,
  attaches a serializable `DesignLabConfig` (garment, colour, sleeve style,
  artwork filenames, fabric/GSM/print preferences) plus a `sizeBreakdown`
  map — so a merchandiser opening the enquiry sees exactly what the buyer
  configured (a "View Design" card on the enquiry detail page), not a text
  summary that loses the original configuration.

The Design Lab enforces a 50-piece minimum order quantity
(`DESIGN_LAB_MOQ`) client-side before Step 4 can proceed, but the server
action re-validates independently — a request that reaches
`createPublicEnquiry` with a malformed shape is rejected outright, not
partially recorded.

**AI Generate is architected honestly.** No AI image-generation service is
connected in this environment. Clicking Generate never fabricates a
successful result; it surfaces exactly that ("AI image generation isn't
connected in this environment yet — this is where your prompt would be sent
to Texcroft's design-generation service"), consistent with the same
no-fabrication principle applied everywhere else in this system.

Draft Design Lab state (garment, colour, artwork filenames, size
quantities — never contact details) is persisted to `localStorage` so a
page refresh doesn't lose a buyer's in-progress configuration; it's cleared
on successful submission.
