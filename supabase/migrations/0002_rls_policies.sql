-- ==============================================================================
-- 0002_rls_policies.sql — Row Level Security (RLS) Policies
-- Enforces multi-tenant isolation for Buyers and Factory Partners
-- ==============================================================================

-- Helper functions to extract user role, buyer_id, and factory_id from JWT /
-- profile. Defined in `public` (not `auth`) — the `auth` schema is owned by
-- Supabase's internal `supabase_auth_admin` role, and a normal migration
-- role cannot create objects there. `set search_path` on every
-- `security definer` function is deliberate hardening against search_path
-- hijacking (a security definer function without a pinned search_path can
-- be tricked into resolving an attacker-created object of the same name).
create or replace function public.current_profile()
returns profiles as $$
  select * from public.profiles where id = auth.uid() limit 1;
$$ language sql stable security definer set search_path = public, pg_temp;

create or replace function public.current_role()
returns text as $$
  select role from public.profiles where id = auth.uid() limit 1;
$$ language sql stable security definer set search_path = public, pg_temp;

create or replace function public.current_buyer_id()
returns uuid as $$
  select buyer_id from public.profiles where id = auth.uid() limit 1;
$$ language sql stable security definer set search_path = public, pg_temp;

create or replace function public.current_factory_id()
returns uuid as $$
  select factory_id from public.profiles where id = auth.uid() limit 1;
$$ language sql stable security definer set search_path = public, pg_temp;

-- Enable RLS on all sensitive tables
alter table profiles enable row level security;
alter table buyers enable row level security;
alter table buyer_contacts enable row level security;
alter table enquiries enable row level security;
alter table styles enable row level security;
alter table costings enable row level security;
alter table costing_items enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_milestones enable row level security;
alter table samples enable row level security;
alter table sample_approvals enable row level security;
alter table suppliers enable row level security;
alter table supplier_materials enable row level security;
alter table materials enable row level security;
alter table purchase_orders enable row level security;
alter table purchase_order_items enable row level security;
alter table material_receipts enable row level security;
alter table factories enable row level security;
alter table production_assignments enable row level security;
alter table production_entries enable row level security;
alter table quality_inspections enable row level security;
alter table quality_defects enable row level security;
alter table packing_records enable row level security;
alter table dispatches enable row level security;
alter table invoices enable row level security;
alter table payments enable row level security;
alter table documents enable row level security;
alter table notifications enable row level security;
alter table activity_logs enable row level security;

-- ------------------------------------------------------------------------------
-- Internal Staff Policy (admin, management, merchandiser, sourcing, prod, qc, finance)
-- ------------------------------------------------------------------------------

create policy staff_all_access_profiles on profiles
  for all using (public.current_role() in ('admin', 'management', 'merchandiser', 'sourcing_manager', 'production_manager', 'qc_inspector', 'finance') or id = auth.uid());

create policy staff_all_access_orders on orders
  for all using (public.current_role() in ('admin', 'management', 'merchandiser', 'sourcing_manager', 'production_manager', 'qc_inspector', 'finance'));

create policy staff_all_access_buyers on buyers
  for all using (public.current_role() in ('admin', 'management', 'merchandiser', 'sourcing_manager', 'production_manager', 'qc_inspector', 'finance'));

create policy staff_all_access_costings on costings
  for all using (public.current_role() in ('admin', 'management', 'merchandiser', 'finance'));

create policy staff_all_access_suppliers on suppliers
  for all using (public.current_role() in ('admin', 'management', 'merchandiser', 'sourcing_manager', 'finance'));

create policy staff_all_access_supplier_materials on supplier_materials
  for all using (public.current_role() in ('admin', 'management', 'merchandiser', 'sourcing_manager', 'finance'));

create policy staff_all_access_materials on materials
  for all using (public.current_role() in ('admin', 'management', 'merchandiser', 'sourcing_manager', 'production_manager'));

create policy staff_all_access_production on production_entries
  for all using (public.current_role() in ('admin', 'management', 'merchandiser', 'production_manager', 'qc_inspector'));

-- ------------------------------------------------------------------------------
-- Buyer Role Isolation Policies
-- Buyers can ONLY view records belonging to their assigned buyer_id
-- ------------------------------------------------------------------------------

create policy buyer_orders_select on orders
  for select using (
    public.current_role() = 'buyer' and buyer_id = public.current_buyer_id()
  );

create policy buyer_styles_select on styles
  for select using (
    public.current_role() = 'buyer' and buyer_id = public.current_buyer_id()
  );

create policy buyer_samples_select on samples
  for select using (
    public.current_role() = 'buyer' and exists (
      select 1 from orders where orders.id = samples.order_id and orders.buyer_id = public.current_buyer_id()
    )
  );

create policy buyer_sample_approvals_insert on sample_approvals
  for insert with check (
    public.current_role() = 'buyer' and exists (
      select 1 from samples join orders on orders.id = samples.order_id
      where samples.id = sample_approvals.sample_id and orders.buyer_id = public.current_buyer_id()
    )
  );

create policy buyer_documents_select on documents
  for select using (
    public.current_role() = 'buyer' and (
      (entity_type = 'order' and exists (select 1 from orders where orders.id = documents.entity_id and orders.buyer_id = public.current_buyer_id())) or
      (entity_type = 'buyer' and documents.entity_id = public.current_buyer_id())
    )
  );

-- ------------------------------------------------------------------------------
-- Factory Partner Isolation Policies
-- Factories can ONLY view assigned orders and create/view production entries for their factory
-- ------------------------------------------------------------------------------

-- An order's primary `factory_id` covers the common case, but production can
-- be sub-assigned to a different factory via `production_assignments`
-- (e.g. reassigned mid-run) — checking only `orders.factory_id` would hide
-- that order from the factory actually holding the assignment.
create policy factory_orders_select on orders
  for select using (
    public.current_role() = 'factory_partner' and (
      factory_id = public.current_factory_id() or
      exists (
        select 1 from production_assignments
        where production_assignments.order_id = orders.id
        and production_assignments.factory_id = public.current_factory_id()
      )
    )
  );

create policy factory_assignments_select on production_assignments
  for select using (
    public.current_role() = 'factory_partner' and factory_id = public.current_factory_id()
  );

create policy factory_entries_select on production_entries
  for select using (
    public.current_role() = 'factory_partner' and factory_id = public.current_factory_id()
  );

create policy factory_entries_insert on production_entries
  for insert with check (
    public.current_role() = 'factory_partner' and factory_id = public.current_factory_id()
  );

-- ------------------------------------------------------------------------------
-- Notifications & Activity Logs Isolation
-- ------------------------------------------------------------------------------

create policy notifications_user_isolation on notifications
  for all using (recipient_id = auth.uid());

create policy activity_logs_staff_select on activity_logs
  for select using (public.current_role() in ('admin', 'management', 'merchandiser', 'sourcing_manager', 'production_manager', 'qc_inspector', 'finance'));
