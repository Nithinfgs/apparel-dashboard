# Apparel Sourcing & Garment Manufacturing Operations Platform (ERP)

A full-lifecycle operations and enterprise resource planning (ERP) platform designed for apparel sourcing and garment manufacturing enterprises. It manages the complete journey from initial buyer enquiry through dynamic costing, physical sampling gates, raw material procurement, cut-make-trim (CMT) production tracking, inline & AQL 2.5 quality control, carton packing, dispatch logistics, and multi-tenant buyer/factory portals.

Read `AGENTS.md` and everything in `docs/` before making changes — they are the source of truth for architecture, data model, routes, design system, business rules, and current build status.

---

## Key Modules & Core Capabilities

- **Enquiry & Buyer Management**: Manage buyer RFQs, technical packages, target prices, order quantities, and track communication pipelines.
- **Costing Engine & Bill of Materials (BOM)**: Granular itemization of yarns, knitting, dyeing, prints, embroideries, CMT, trims, accessories, packaging, and shipping margins with historical version diffing.
- **Sample Tracker & Sampling Gate**: Enforce rigorous proto, fit, size-set, pre-production (PP), and top-of-production (TOP) approval gates that prevent unauthorized bulk manufacturing before PP clearance.
- **Material Sourcing & Inventory**: Fabric lots, yarn tracking, trims & accessories procurement, supplier scorecards, lead-time variance tracking, and automated shortage alerts.
- **Production Tracking & Line Allocation**: Daily multi-stage updates (knitting/weaving, dyeing, cutting, sewing, finishing, packing) with deterministic event-sourced tracking and 30-day factory utilization horizon.
- **Quality Control (QC) & Audits**: Inline inspections, end-line audits, 4-point fabric grading, AQL 2.5 defect tracking, and defect trend analytics.
- **Carton Packing & Dispatch Logistics**: Packing lists, carton barcode structures, container allocations, shipping documentation, and dispatch tracking.
- **Finance & Invoicing**: Commercial invoices, proforma invoices, milestone payment schedules, and partial settlement reconciliation.
- **Deterministic Risk Engine & Action Center**: Real-time evaluation of schedule delays, critical dispatch horizons, unapproved samples, and material arrival bottlenecks.
- **Role-Based Portals**:
  - **Internal Shell (`/(app)`)**: Full operations workspace for founders, merchandisers, production managers, QC inspectors, and finance officers.
  - **Buyer Portal (`/portal`)**: Secure client workspace for live milestone tracking, sample approvals, digital spec review, and change requests.
  - **Factory Partner Portal (`/partner`)**: Simplified execution portal for assigned partner factories to log daily floor output and flag blocker issues.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript (strict mode)
- **Styling & UI**: Tailwind CSS v4 + shadcn/ui (Radix primitives) + Lucide Icons + `tw-animate-css`
- **Data & Tables**: TanStack Table v8, Recharts, `date-fns`, Sonner toast notifications
- **Forms & Validation**: React Hook Form + Zod v4 schemas
- **Target Backend**: Supabase (PostgreSQL + Row-Level Security + Auth) — see "Data layer" below

---

## Data Layer Architecture

**Zero-Configuration In-Memory Seed State**:
The application runs out of the box against an internally-consistent, realistic in-memory dataset (`src/lib/seed/`) shaped to mirror the PostgreSQL schema documented in `docs/DATA_MODEL.md`.

- Operates cleanly in local and preview environments with **zero external dependencies or database setup**.
- State mutations (such as logging daily production quantities or submitting sample reviews) modify the in-memory store for the life of the server process.
- Designed for plug-and-play Supabase connection: client factories (`src/lib/supabase/*`) are pre-wired. Connecting to production Postgres requires only setting the environment variables and routing the data layer (`src/lib/data/*`) to Supabase queries.

### Optional Environment Variables (for Supabase connection)

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

---

## Getting Started

### 1. Installation

```bash
npm install
```

### 2. Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Demo & Role-Based Access Accounts

All accounts can be selected instantly from the login screen (`/login`) with zero password entry in development mode:

| Email | Role | Accessible Scope |
|---|---|---|
| `admin@texcroft.demo` | Founder / Admin | Full global system access |
| `management@texcroft.demo` | Management | Full operations & executive analytics (excluding user admin) |
| `kranti@texcroft.demo` / `arjun@texcroft.demo` | Merchandiser | Enquiries, costing, orders, sampling, production, quality, logistics |
| `sourcing@texcroft.demo` | Sourcing Manager | Raw materials, purchase orders, supplier scorecards |
| `production@texcroft.demo` | Production Manager | Orders, line allocation, daily output, partner factories |
| `qc@texcroft.demo` | QC Inspector | Quality audit logs, defect tracking, inspection reports |
| `finance@texcroft.demo` | Finance | Invoices, payment reconciliation, buyer ledger |
| `factory@texcroft.demo` | Factory Partner | Partner Portal (`/partner/*`) — isolated solely to assigned factory orders |
| `buyer@texcroft.demo` | Buyer | Buyer Portal (`/portal/*`) — isolated solely to buyer company orders |

**Walkthrough Order**: Explore order **`TC-2609-014`** (Heavyweight Oversized Hoodie, 5,000 pcs) for the complete end-to-end flow: Dashboard &rarr; Order 360 &rarr; "View as Buyer" &rarr; Buyer Portal.

---

## Verification & Testing

The repository includes a comprehensive 17-suite test suite verifying calculation engines, milestone variances, sampling blockers, event-sourced progress, and multi-tenant RBAC boundaries:

```bash
# Run unit & domain rule test suites
npm test

# Run TypeScript strict type verification
npx tsc --noEmit

# Run ESLint validation
npm run lint

# Build production bundle
npm run build
```

---

## Repository Structure

```
src/
  app/            Next.js App Router: (app) internal operations, portal/ buyer portal,
                  partner/ factory portal, login/ mock auth
  components/
    ui/           Radix UI / shadcn design system primitives
    layout/       Header, Sidebar, breadcrumbs, global command search, portal navigation
    shared/       Reusable data tables, metric cards, status badges, timelines
    dashboard/    Executive charts, pipeline summaries, revenue metrics
    quality/      Defect trend visualizers and QC scorecards
  lib/
    data/         Entity data-access layer
    seed/         In-memory domain seed store
    calculations/ Pure domain logic (risk evaluation, milestone variance, costing BOM, supplier scoring)
    permissions/  Centralized RBAC resource-action map
    constants/    Status codes, workflow stages, branding constants
    auth/         Session state & authentication utilities
    supabase/     Supabase client factories
  types/          Domain entity types matching schema specifications
docs/             Architecture, data model, route map, design tokens, business rules, and handoff guides
```
