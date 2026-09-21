-- ==============================================================================
-- 0001_initial_schema.sql — Texcroft OS Database Schema
-- Matches docs/DATA_MODEL.md and domain types
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- Helper trigger function to update updated_at timestamp
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ------------------------------------------------------------------------------
-- 1. Identity & Access
-- ------------------------------------------------------------------------------

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  avatar_url text,
  role text not null check (role in (
    'admin', 'management', 'merchandiser', 'sourcing_manager',
    'production_manager', 'qc_inspector', 'finance', 'factory_partner', 'buyer'
  )),
  buyer_id uuid,
  factory_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------------------------
-- 2. Sales & Buyers
-- ------------------------------------------------------------------------------

create table if not exists buyers (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text not null,
  email text not null,
  phone text not null,
  country text not null,
  currency text not null check (currency in ('INR', 'USD', 'GBP', 'EUR')),
  shipping_location text,
  payment_terms text,
  tax_details text,
  notes text,
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add foreign key from profiles to buyers
alter table profiles
  add constraint fk_profiles_buyer foreign key (buyer_id) references buyers(id) on delete set null;

create table if not exists buyer_contacts (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references buyers(id) on delete cascade,
  name text not null,
  role_title text not null,
  email text not null,
  phone text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists enquiries (
  id uuid primary key default gen_random_uuid(),
  enquiry_no text not null unique,
  buyer_id uuid not null references buyers(id) on delete cascade,
  merchandiser_id uuid not null references profiles(id) on delete restrict,
  product_summary text not null,
  expected_quantity integer not null,
  target_price numeric(12, 2) not null,
  currency text not null check (currency in ('INR', 'USD', 'GBP', 'EUR')),
  delivery_deadline date not null,
  status text not null check (status in (
    'new', 'requirements_received', 'costing', 'quote_sent', 'negotiation', 'confirmed', 'lost'
  )),
  notes text,
  tech_pack_document_id uuid,
  converted_order_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------------------------
-- 3. Products & Styles
-- ------------------------------------------------------------------------------

create table if not exists styles (
  id uuid primary key default gen_random_uuid(),
  style_code text not null unique,
  name text not null,
  category text not null,
  buyer_id uuid not null references buyers(id) on delete cascade,
  fabric text not null,
  composition text not null,
  gsm integer not null,
  colours text[] not null default '{}',
  sizes text[] not null default '{}',
  measurements jsonb default '{}'::jsonb,
  print_details text,
  embroidery_details text,
  wash_type text,
  label_instructions text,
  packaging_instructions text,
  current_version integer not null default 1,
  approval_status text not null check (approval_status in ('draft', 'pending_approval', 'approved')),
  created_by uuid not null references profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists style_versions (
  id uuid primary key default gen_random_uuid(),
  style_id uuid not null references styles(id) on delete cascade,
  version_number integer not null,
  snapshot jsonb not null,
  change_summary text,
  created_by uuid not null references profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------------------
-- 4. Factories
-- ------------------------------------------------------------------------------

create table if not exists factories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text not null,
  contact_name text not null,
  contact_phone text not null,
  capabilities text[] not null default '{}',
  daily_capacity_pieces integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles
  add constraint fk_profiles_factory foreign key (factory_id) references factories(id) on delete set null;

-- ------------------------------------------------------------------------------
-- 5. Costings
-- ------------------------------------------------------------------------------

create table if not exists costings (
  id uuid primary key default gen_random_uuid(),
  order_id uuid,
  enquiry_id uuid references enquiries(id) on delete set null,
  style_id uuid not null references styles(id) on delete cascade,
  version_number integer not null default 1,
  selling_price_per_piece numeric(12, 2) not null,
  currency text not null check (currency in ('INR', 'USD', 'GBP', 'EUR')),
  status text not null check (status in ('draft', 'final')),
  created_by uuid not null references profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists costing_items (
  id uuid primary key default gen_random_uuid(),
  costing_id uuid not null references costings(id) on delete cascade,
  category text not null check (category in (
    'fabric', 'rib', 'thread', 'labels', 'buttons_zippers',
    'printing', 'embroidery', 'washing',
    'cutting', 'stitching', 'finishing',
    'packing', 'freight', 'other'
  )),
  unit text not null,
  consumption numeric(10, 4) not null,
  rate numeric(12, 2) not null,
  waste_percent numeric(5, 2) not null default 0,
  calculated_cost numeric(12, 2) not null
);

-- ------------------------------------------------------------------------------
-- 6. Orders & Items & Milestones
-- ------------------------------------------------------------------------------

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_no text not null unique,
  enquiry_id uuid references enquiries(id) on delete set null,
  buyer_id uuid not null references buyers(id) on delete restrict,
  style_id uuid not null references styles(id) on delete restrict,
  costing_id uuid references costings(id) on delete set null,
  po_number text not null,
  quantity integer not null check (quantity > 0),
  price_per_piece numeric(12, 2) not null,
  currency text not null check (currency in ('INR', 'USD', 'GBP', 'EUR')),
  order_value numeric(14, 2) not null,
  factory_id uuid references factories(id) on delete set null,
  stage text not null check (stage in (
    'costing', 'sampling', 'sourcing', 'cutting', 'stitching',
    'finishing', 'quality', 'packing', 'dispatch', 'completed'
  )),
  expected_dispatch_date date not null,
  actual_dispatch_date date,
  owner_id uuid not null references profiles(id) on delete restrict,
  risk_level text not null default 'low' check (risk_level in ('low', 'medium', 'high', 'critical')),
  risk_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table enquiries
  add constraint fk_enquiries_converted_order foreign key (converted_order_id) references orders(id) on delete set null;

alter table costings
  add constraint fk_costings_order foreign key (order_id) references orders(id) on delete set null;

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  colour text not null,
  size text not null,
  quantity integer not null check (quantity >= 0)
);

create table if not exists order_milestones (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  milestone_key text not null check (milestone_key in (
    'techpack_approved', 'fabric_ordered', 'fabric_arrival', 'pp_sample',
    'buyer_approval', 'cutting_start', 'cutting_complete', 'stitching_complete',
    'finishing_complete', 'final_qc', 'packing', 'dispatch'
  )),
  planned_date date not null,
  actual_date date,
  status text not null check (status in ('pending', 'in_progress', 'done', 'delayed')),
  owner_id uuid not null references profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------------------------
-- 7. Sampling & Approvals
-- ------------------------------------------------------------------------------

create table if not exists samples (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  style_id uuid not null references styles(id) on delete cascade,
  sample_type text not null check (sample_type in (
    'development', 'proto', 'fit', 'lab_dip', 'size_set', 'pp'
  )),
  version_number integer not null default 1,
  status text not null check (status in (
    'requested', 'in_development', 'sent', 'buyer_review', 'changes_requested', 'approved', 'rejected'
  )),
  courier text,
  sent_date date,
  buyer_response_date date,
  comments text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sample_approvals (
  id uuid primary key default gen_random_uuid(),
  sample_id uuid not null references samples(id) on delete cascade,
  approved_by_buyer_contact_id uuid not null references buyer_contacts(id) on delete restrict,
  decision text not null check (decision in ('approved', 'changes_requested', 'rejected')),
  comments text,
  decided_at timestamptz not null default now()
);

-- ------------------------------------------------------------------------------
-- 8. Sourcing & Materials & Purchase Orders
-- ------------------------------------------------------------------------------

create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text not null,
  contact_name text not null,
  contact_email text not null,
  contact_phone text not null,
  material_categories text[] not null default '{}',
  lead_time_days integer not null default 14,
  payment_terms text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists materials (
  id uuid primary key default gen_random_uuid(),
  sku text not null,
  description text not null,
  category text not null check (category in (
    'fabric', 'rib', 'thread', 'buttons', 'zippers', 'labels', 'packaging', 'other'
  )),
  supplier_id uuid not null references suppliers(id) on delete restrict,
  colour text,
  gsm integer,
  required_qty numeric(12, 2) not null,
  ordered_qty numeric(12, 2) not null default 0,
  received_qty numeric(12, 2) not null default 0,
  allocated_qty numeric(12, 2) not null default 0,
  cost numeric(12, 2) not null,
  unit text not null,
  expected_arrival date not null,
  status text not null check (status in ('required', 'rfq', 'ordered', 'partial', 'received', 'qc_hold')),
  order_id uuid not null references orders(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Supplier quoting lookup: "which suppliers can quote this material category,
-- at roughly what rate/MOQ" — kept separate from `materials` (which is
-- always scoped to one order) so it can be queried without an order in
-- context. See docs/DATA_MODEL.md "supplier_materials".
create table if not exists supplier_materials (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references suppliers(id) on delete cascade,
  material_category text not null check (material_category in (
    'fabric', 'rib', 'thread', 'buttons', 'zippers', 'labels', 'packaging', 'other'
  )),
  typical_rate numeric(12, 2),
  moq integer,
  created_at timestamptz not null default now()
);

create table if not exists purchase_orders (
  id uuid primary key default gen_random_uuid(),
  po_no text not null unique,
  supplier_id uuid not null references suppliers(id) on delete restrict,
  order_date date not null,
  eta date not null,
  status text not null check (status in ('draft', 'sent', 'partial', 'received', 'closed')),
  payment_status text not null check (payment_status in ('pending', 'partial', 'paid')),
  total_value numeric(14, 2) not null,
  currency text not null check (currency in ('INR', 'USD', 'GBP', 'EUR')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references purchase_orders(id) on delete cascade,
  material_id uuid not null references materials(id) on delete restrict,
  quantity numeric(12, 2) not null,
  rate numeric(12, 2) not null,
  received_quantity numeric(12, 2) not null default 0
);

create table if not exists material_receipts (
  id uuid primary key default gen_random_uuid(),
  purchase_order_item_id uuid not null references purchase_order_items(id) on delete cascade,
  received_qty numeric(12, 2) not null,
  received_date date not null,
  received_by uuid not null references profiles(id) on delete restrict,
  qc_hold boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------------------
-- 9. Production & Assignments & Entries
-- ------------------------------------------------------------------------------

create table if not exists production_assignments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  factory_id uuid not null references factories(id) on delete restrict,
  assigned_quantity integer not null check (assigned_quantity > 0),
  assigned_date date not null,
  status text not null check (status in ('active', 'completed', 'reassigned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists production_entries (
  id uuid primary key default gen_random_uuid(),
  production_assignment_id uuid not null references production_assignments(id) on delete cascade,
  order_id uuid not null references orders(id) on delete cascade,
  factory_id uuid not null references factories(id) on delete restrict,
  stage text not null check (stage in (
    'fabric_ready', 'cutting', 'printing_embroidery', 'stitching',
    'washing', 'finishing', 'qc', 'packing'
  )),
  date date not null,
  produced_qty integer not null default 0 check (produced_qty >= 0),
  rejected_qty integer not null default 0 check (rejected_qty >= 0),
  reworked_qty integer not null default 0 check (reworked_qty >= 0),
  workers_count integer,
  notes text,
  photo_document_id uuid,
  entered_by uuid not null references profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------------------
-- 10. Quality Inspections & Defects
-- ------------------------------------------------------------------------------

create table if not exists quality_inspections (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  factory_id uuid not null references factories(id) on delete restrict,
  inspector_id uuid not null references profiles(id) on delete restrict,
  inspection_type text not null check (inspection_type in (
    'fabric_qc', 'inline_qc', 'endline_qc', 'measurement', 'final_inspection'
  )),
  date date not null,
  quantity_inspected integer not null check (quantity_inspected > 0),
  minor_defects integer not null default 0,
  major_defects integer not null default 0,
  critical_defects integer not null default 0,
  result text not null check (result in ('pass', 'conditional_pass', 'hold', 'fail')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists quality_defects (
  id uuid primary key default gen_random_uuid(),
  quality_inspection_id uuid not null references quality_inspections(id) on delete cascade,
  category text not null check (category in (
    'stitching', 'measurement', 'fabric', 'colour', 'printing', 'embroidery', 'finishing', 'packing', 'other'
  )),
  count integer not null default 1 check (count > 0),
  severity text not null check (severity in ('minor', 'major', 'critical')),
  description text not null,
  photo_document_id uuid,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------------------
-- 11. Logistics: Packing & Dispatches
-- ------------------------------------------------------------------------------

create table if not exists packing_records (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  carton_number text not null,
  colour text not null,
  size text not null,
  quantity integer not null check (quantity > 0),
  packed_date date not null,
  packed_by uuid not null references profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists dispatches (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  planned_date date not null,
  actual_date date,
  mode text not null check (mode in ('sea', 'air', 'road')),
  forwarder text not null,
  awb_or_bl_number text,
  container_number text,
  tracking_reference text,
  destination text not null,
  status text not null check (status in ('preparing', 'ready', 'dispatched', 'in_transit', 'delivered')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------------------------
-- 12. Finance: Invoices & Payments
-- ------------------------------------------------------------------------------

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_no text not null unique,
  order_id uuid not null references orders(id) on delete cascade,
  buyer_id uuid not null references buyers(id) on delete restrict,
  amount numeric(14, 2) not null,
  currency text not null check (currency in ('INR', 'USD', 'GBP', 'EUR')),
  issue_date date not null,
  due_date date not null,
  status text not null check (status in ('draft', 'sent', 'partially_paid', 'paid', 'overdue')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  amount numeric(14, 2) not null check (amount > 0),
  currency text not null check (currency in ('INR', 'USD', 'GBP', 'EUR')),
  paid_date date not null,
  method text not null,
  reference text,
  recorded_by uuid not null references profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------------------
-- 13. Cross-Cutting: Documents, Notifications, Activity Logs, Inventory
-- ------------------------------------------------------------------------------

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in (
    'buyer', 'order', 'style', 'sample', 'purchase_order',
    'quality_inspection', 'dispatch', 'production_entry', 'quality_defect'
  )),
  entity_id uuid not null,
  name text not null,
  file_url text not null,
  mime_type text not null,
  version integer,
  uploaded_by uuid not null references profiles(id) on delete restrict,
  uploaded_at timestamptz not null default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references profiles(id) on delete cascade,
  type text not null check (type in ('risk', 'material', 'sample', 'quality', 'finance', 'dispatch', 'general')),
  title text not null,
  message text not null,
  entity_type text,
  entity_id uuid,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references profiles(id) on delete restrict,
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

create table if not exists inventory_items (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  category text not null check (category in ('raw_material', 'wip', 'finished_goods')),
  material_id uuid references materials(id) on delete set null,
  order_id uuid references orders(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists inventory_transactions (
  id uuid primary key default gen_random_uuid(),
  inventory_item_id uuid not null references inventory_items(id) on delete cascade,
  movement_type text not null check (movement_type in (
    'purchase_receipt', 'allocation', 'production_issue', 'return', 'adjustment', 'finished_production', 'dispatch'
  )),
  quantity numeric(12, 2) not null,
  reference_entity_type text,
  reference_entity_id uuid,
  created_by uuid not null references profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------------------
-- Indexes on High-Traffic Foreign Keys & Search Fields
-- ------------------------------------------------------------------------------

create index if not exists idx_orders_buyer on orders(buyer_id);
create index if not exists idx_orders_factory on orders(factory_id);
create index if not exists idx_orders_stage on orders(stage);
create index if not exists idx_orders_risk on orders(risk_level);
create index if not exists idx_production_entries_order on production_entries(order_id);
create index if not exists idx_production_entries_factory on production_entries(factory_id);
create index if not exists idx_production_entries_date on production_entries(date);
create index if not exists idx_materials_order on materials(order_id);
create index if not exists idx_materials_supplier on materials(supplier_id);
create index if not exists idx_supplier_materials_supplier on supplier_materials(supplier_id);
create index if not exists idx_invoices_order on invoices(order_id);
create index if not exists idx_invoices_buyer on invoices(buyer_id);
create index if not exists idx_payments_invoice on payments(invoice_id);
create index if not exists idx_notifications_recipient on notifications(recipient_id, read);
create index if not exists idx_documents_entity on documents(entity_type, entity_id);

-- ------------------------------------------------------------------------------
-- Updated_At Triggers
-- ------------------------------------------------------------------------------

create trigger trg_profiles_updated_at before update on profiles for each row execute function set_updated_at();
create trigger trg_buyers_updated_at before update on buyers for each row execute function set_updated_at();
create trigger trg_enquiries_updated_at before update on enquiries for each row execute function set_updated_at();
create trigger trg_styles_updated_at before update on styles for each row execute function set_updated_at();
create trigger trg_factories_updated_at before update on factories for each row execute function set_updated_at();
create trigger trg_costings_updated_at before update on costings for each row execute function set_updated_at();
create trigger trg_orders_updated_at before update on orders for each row execute function set_updated_at();
create trigger trg_order_milestones_updated_at before update on order_milestones for each row execute function set_updated_at();
create trigger trg_samples_updated_at before update on samples for each row execute function set_updated_at();
create trigger trg_suppliers_updated_at before update on suppliers for each row execute function set_updated_at();
create trigger trg_materials_updated_at before update on materials for each row execute function set_updated_at();
create trigger trg_purchase_orders_updated_at before update on purchase_orders for each row execute function set_updated_at();
create trigger trg_production_assignments_updated_at before update on production_assignments for each row execute function set_updated_at();
create trigger trg_quality_inspections_updated_at before update on quality_inspections for each row execute function set_updated_at();
create trigger trg_dispatches_updated_at before update on dispatches for each row execute function set_updated_at();
create trigger trg_invoices_updated_at before update on invoices for each row execute function set_updated_at();
create trigger trg_inventory_items_updated_at before update on inventory_items for each row execute function set_updated_at();
