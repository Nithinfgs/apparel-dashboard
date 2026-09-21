import type { Role } from "@/types";

export type Resource =
  | "dashboard"
  | "enquiries"
  | "buyers"
  | "styles"
  | "costing"
  | "orders"
  | "samples"
  | "materials"
  | "purchase_orders"
  | "suppliers"
  | "factories"
  | "production"
  | "quality"
  | "packing"
  | "dispatch"
  | "finance"
  | "analytics"
  | "ask_texcroft"
  | "settings"
  | "users"
  | "issues"
  | "change_requests"
  | "action_center";

export type Action = "view" | "create" | "edit" | "delete" | "approve";

/**
 * Centralised permission map. Never scatter `if (role === 'admin')` checks
 * through page/component code — call `can(role, action, resource)` instead.
 * See AGENTS.md §2.6.
 */
const FULL_ACCESS: Resource[] = [
  "dashboard",
  "enquiries",
  "buyers",
  "styles",
  "costing",
  "orders",
  "samples",
  "materials",
  "purchase_orders",
  "suppliers",
  "factories",
  "production",
  "quality",
  "packing",
  "dispatch",
  "finance",
  "analytics",
  "ask_texcroft",
  "settings",
  "users",
  "issues",
  "change_requests",
  "action_center",
];

const ROLE_RESOURCES: Record<Role, Resource[]> = {
  admin: FULL_ACCESS,
  management: FULL_ACCESS.filter((r) => r !== "settings" && r !== "users"),
  merchandiser: [
    "dashboard",
    "enquiries",
    "buyers",
    "styles",
    "costing",
    "orders",
    "samples",
    "materials",
    "suppliers",
    "factories",
    "production",
    "quality",
    "packing",
    "dispatch",
    "analytics",
    "ask_texcroft",
    "issues",
    "change_requests",
    "action_center",
  ],
  sourcing_manager: [
    "dashboard",
    "materials",
    "purchase_orders",
    "suppliers",
    "orders",
    "factories",
    "analytics",
    "issues",
    "action_center",
  ],
  production_manager: [
    "dashboard",
    "orders",
    "production",
    "factories",
    "materials",
    "quality",
    "analytics",
    "issues",
    "action_center",
  ],
  qc_inspector: ["dashboard", "quality", "orders", "production", "issues"],
  finance: ["dashboard", "finance", "buyers", "orders", "analytics", "action_center"],
  // Factory partners raise/see issues for their own assigned orders only —
  // never change_requests or the action_center, which surface internal
  // costs/margins and cross-order data. Data-layer scoping (src/lib/data/partner.ts)
  // is the actual isolation boundary; this is the first line of defense.
  factory_partner: ["production", "orders", "issues"],
  // Buyers see the status of their own change requests (they're often the
  // requester) but never production issues, costs, or margins — the buyer
  // portal's data layer (src/lib/data/portal.ts) never exposes those fields
  // regardless of this permission map.
  buyer: ["orders", "samples", "change_requests"],
};

const READ_ONLY_ROLES: Role[] = ["qc_inspector", "factory_partner", "buyer", "finance"];

export function can(role: Role, action: Action, resource: Resource): boolean {
  const resources = ROLE_RESOURCES[role] ?? [];
  if (!resources.includes(resource)) return false;
  if (action === "view") return true;
  if (READ_ONLY_ROLES.includes(role)) {
    // Narrow exceptions: factory partners can create production entries and
    // report issues, QC inspectors can create inspections, buyers can
    // approve samples.
    if (role === "factory_partner" && resource === "production" && action === "create") return true;
    if (role === "factory_partner" && resource === "issues" && action === "create") return true;
    if (role === "qc_inspector" && resource === "quality" && (action === "create" || action === "edit")) return true;
    if (role === "buyer" && resource === "samples" && action === "approve") return true;
    return false;
  }
  return true;
}

export function resourcesFor(role: Role): Resource[] {
  return ROLE_RESOURCES[role] ?? [];
}
