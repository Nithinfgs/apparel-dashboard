"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ALL_NAV_ITEMS } from "@/lib/nav";

/** Derives the breadcrumb trail from the current route and the nav config — never hardcoded per page. */
export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const topLevel = "/" + (segments[0] ?? "");
  const navItem = ALL_NAV_ITEMS.find((item) => item.href === topLevel || pathname.startsWith(item.href));

  const crumbs = [{ label: navItem?.label ?? "Texcroft OS", href: navItem?.href ?? "/dashboard" }];
  if (segments.length > 1) {
    crumbs.push({ label: decodeURIComponent(segments[segments.length - 1]).replace(/-/g, " "), href: pathname });
  }

  return (
    <nav className="flex min-w-0 items-center gap-1.5 text-sm">
      {crumbs.map((c, i) => (
        <span key={i} className="flex min-w-0 items-center gap-1.5">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
          {i === crumbs.length - 1 ? (
            <span className="truncate font-medium text-foreground capitalize">{c.label}</span>
          ) : (
            <Link href={c.href} className="truncate text-muted-foreground hover:text-foreground">
              {c.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
