# ROUTES.md — Texcroft OS

Legend: ✅ built · 🚧 partial · ⬜ not started. Keep this in sync with
`docs/BUILD_PROGRESS.md` (this file = what a route does; that file = build
status by module).

## Public website (`src/app/(site)/**`, no auth — the customer-facing layer)
| Route | Purpose |
|---|---|
| `/` | Homepage — hero, trust strip, what Texcroft does, product rail, why Texcroft, Design Lab preview, buyer visibility, quote form |
| `/products` | Product category grid (GSM/fabric/finishes/MOQ per category) |
| `/products/[category]` | Product detail — specs, "Customize in Design Lab" / "Request Quote" |
| `/how-we-work` | The 6-step production process |
| `/quality` | Quality checkpoints, AQL standard, zero-defect policy |
| `/design` | AI Design Lab — 5-step configurator (Product → Colour → Design → Specs → Contact), submits a real Enquiry |
| `/about` | Company positioning, pillars, quote form |
| `/contact` | Offices, hours, direct contacts, quote form |
| `/blog`, `/blog/[slug]` | Manufacturing-knowledge articles, with Article JSON-LD |

Every quote/enquiry submission on these pages calls the same
`submitPublicEnquiry` server action (BUSINESS_RULES.md §20) — there is no
per-page form backend. "Track Order" and "Get a Quote" in the site header
link to `/login` and `/contact` respectively.

## Auth
| Route | Purpose |
|---|---|
| `/login` | Role-switch demo login (email/password against Supabase in production). Also where the public site's "Track Order" sends buyers — reuses the existing buyer session, not a separate public order-lookup endpoint. |

## Internal ops app (sidebar shell)
| Route | Purpose |
|---|---|
| `/dashboard` | Command Center — KPIs, pipeline, at-risk orders, upcoming dispatches, production chart, buyer revenue, activity |
| `/enquiries` | Enquiry pipeline — kanban + table |
| `/enquiries/[id]` | Enquiry detail, communication timeline, convert-to-order |
| `/buyers` | Buyer list |
| `/buyers/[id]` | Buyer 360 — overview/orders/contacts/documents/payments/activity tabs |
| `/styles` | Style/product catalogue |
| `/styles/[id]` | Style detail + version history |
| `/costing` | Costing list |
| `/costing/[id]` | Costing editor with cost breakdown + margin calc + version compare |
| `/orders` | Orders table — filter/search/sort/paginate |
| `/orders/[id]` | **Order 360** — the most important screen; lifecycle bar, summary, production, materials, quality, timeline, activity, documents, notes, payments |
| `/samples` | Sample tracker list |
| `/samples/[id]` | Sample detail, versions, buyer approval status |
| `/materials` | Material sourcing list with shortage alerts |
| `/purchase-orders` | PO list |
| `/purchase-orders/[id]` | PO detail — items, receipts, invoice upload |
| `/suppliers` | Supplier list with scorecards |
| `/suppliers/[id]` | Supplier detail — performance, PO history |
| `/factories` | Factory list — capacity/utilisation |
| `/factories/[id]` | Factory detail — current/upcoming orders, history, on-time %, defect % |
| `/production` | Production Control Center — board/table by stage |
| `/production/daily` | Daily Production Update — mobile-first entry form |
| `/production/issues` | Production issues / escalations list — create, filter, resolve |
| `/production/issues/[id]` | Production issue detail |
| `/quality/inspections` | Inspections list |
| `/quality/inspections/[id]` | Inspection detail |
| `/quality/defects` | Defect analytics |
| `/packing` | Packing / carton records |
| `/dispatch` | Dispatch list |
| `/dispatch/[id]` | Dispatch detail — documents, tracking |
| `/finance/invoices` | Invoice list |
| `/finance/payments` | Payment list / record payment |
| `/analytics` | Charts: revenue, on-time %, efficiency, top buyers, profitability, factory utilisation, supplier lead time, defect trends |
| `/ask-texcroft` | Deterministic Q&A over live application data |
| `/action-center` | Action / Exception Center — everything needing attention, grouped by category, reusing existing risk/notification/milestone/QC/finance/production logic |
| `/settings` | Company, users, roles, stages, order prefix, currencies, notifications, QC config |

## Buyer Portal (`/portal`, separate shell, buyer-scoped data only)
| Route | Purpose |
|---|---|
| `/portal/dashboard` | Buyer's active orders, upcoming dispatches, approvals required, recently completed |
| `/portal/orders` | Buyer's orders list |
| `/portal/orders/[id]` | Buyer-safe Order 360 — timeline, QC summary, documents, shipment tracking; never costs/margins/supplier data |
| `/portal/approvals` | Pending sample/document approvals with approve/request-change actions |
| `/portal/documents` | Documents attached to the buyer's orders |

## Factory Partner Portal (`/partner`, separate shell, factory-scoped only)
| Route | Purpose |
|---|---|
| `/partner/dashboard` | Assigned orders, today's work, upcoming deadlines |
| `/partner/production` | Mobile production entry (same underlying form as `/production/daily`, scoped to this factory) |
| `/partner/issues` | Raise/view issues for assigned orders |

## Navigation contract

Every route above appears in `Sidebar.tsx` under the group named in the brief
(SALES/ORDERS/SOURCING/PRODUCTION/QUALITY/LOGISTICS/FINANCE/INTELLIGENCE/
SYSTEM) or in the relevant portal shell — there is no orphan route reachable
only by typing a URL. Breadcrumbs in the header are derived from this table's
grouping, not hardcoded per page.
