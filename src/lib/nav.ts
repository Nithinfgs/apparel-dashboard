import type { Resource } from "@/lib/permissions";
import {
  LayoutDashboard,
  Inbox,
  Building2,
  Calculator,
  ShoppingBag,
  Shirt,
  Beaker,
  Boxes,
  ClipboardList,
  Factory,
  Wrench,
  CalendarCheck,
  ShieldCheck,
  AlertOctagon,
  Package,
  Ship,
  Receipt,
  Wallet,
  BarChart3,
  Sparkles,
  Bell,
  Users,
  Settings,
  AlertTriangle,
  ListChecks,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  resource: Resource;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/** Drives both Sidebar rendering and (indirectly) breadcrumb grouping. See docs/ROUTES.md. */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "",
    items: [{ label: "Command Center", href: "/dashboard", icon: LayoutDashboard, resource: "dashboard" }],
  },
  {
    label: "Sales",
    items: [
      { label: "Enquiries", href: "/enquiries", icon: Inbox, resource: "enquiries" },
      { label: "Buyers", href: "/buyers", icon: Building2, resource: "buyers" },
      { label: "Costing", href: "/costing", icon: Calculator, resource: "costing" },
    ],
  },
  {
    label: "Orders",
    items: [
      { label: "Orders", href: "/orders", icon: ShoppingBag, resource: "orders" },
      { label: "Styles", href: "/styles", icon: Shirt, resource: "styles" },
      { label: "Samples", href: "/samples", icon: Beaker, resource: "samples" },
    ],
  },
  {
    label: "Sourcing",
    items: [
      { label: "Materials", href: "/materials", icon: Boxes, resource: "materials" },
      { label: "Purchase Orders", href: "/purchase-orders", icon: ClipboardList, resource: "purchase_orders" },
      { label: "Suppliers", href: "/suppliers", icon: Factory, resource: "suppliers" },
    ],
  },
  {
    label: "Production",
    items: [
      { label: "Production", href: "/production", icon: Wrench, resource: "production" },
      { label: "Factories", href: "/factories", icon: Factory, resource: "factories" },
      { label: "Daily Updates", href: "/production/daily", icon: CalendarCheck, resource: "production" },
      { label: "Issues", href: "/production/issues", icon: AlertTriangle, resource: "issues" },
    ],
  },
  {
    label: "Quality",
    items: [
      { label: "Inspections", href: "/quality/inspections", icon: ShieldCheck, resource: "quality" },
      { label: "Defects", href: "/quality/defects", icon: AlertOctagon, resource: "quality" },
    ],
  },
  {
    label: "Logistics",
    items: [
      { label: "Packing", href: "/packing", icon: Package, resource: "packing" },
      { label: "Dispatch", href: "/dispatch", icon: Ship, resource: "dispatch" },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Invoices", href: "/finance/invoices", icon: Receipt, resource: "finance" },
      { label: "Payments", href: "/finance/payments", icon: Wallet, resource: "finance" },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { label: "Analytics", href: "/analytics", icon: BarChart3, resource: "analytics" },
      { label: "Ask Texcroft", href: "/ask-texcroft", icon: Sparkles, resource: "ask_texcroft" },
      { label: "Action Center", href: "/action-center", icon: ListChecks, resource: "action_center" },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Notifications", href: "/notifications", icon: Bell, resource: "dashboard" },
      { label: "Users", href: "/settings/users", icon: Users, resource: "users" },
      { label: "Settings", href: "/settings", icon: Settings, resource: "settings" },
    ],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);
