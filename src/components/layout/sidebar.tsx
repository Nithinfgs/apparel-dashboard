"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NAV_GROUPS } from "@/lib/nav";
import { can, type Resource } from "@/lib/permissions";
import type { Role } from "@/types";
import { cn } from "@/lib/utils";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-150 md:flex",
        collapsed ? "w-[68px]" : "w-60"
      )}
    >
      <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
        {!collapsed && (
          <Link href="/dashboard" className="text-sm font-semibold tracking-tight text-sidebar-foreground">
            TEXCROFT <span className="font-normal text-muted-foreground">OS</span>
          </Link>
        )}
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setCollapsed((c) => !c)}>
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-2 py-4">
        {NAV_GROUPS.map((group, gi) => {
          const visibleItems = group.items.filter((item) => can(role, "view", item.resource as Resource));
          if (visibleItems.length === 0) return null;
          return (
            <div key={gi}>
              {group.label && !collapsed && (
                <p className="mb-1.5 px-2.5 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">{group.label}</p>
              )}
              <ul className="space-y-0.5">
                {visibleItems.map((item) => {
                  const active = isActive(pathname, item.href);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        title={collapsed ? item.label : undefined}
                        className={cn(
                          "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
                          active
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
