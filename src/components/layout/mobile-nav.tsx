"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { NAV_GROUPS } from "@/lib/nav";
import { can, type Resource } from "@/lib/permissions";
import type { Role } from "@/types";

export function MobileNav({ role }: { role: Role }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden">
          <Menu className="h-4.5 w-4.5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetTitle className="border-b border-border px-4 py-3.5 text-sm font-semibold">
          APPAREL <span className="font-normal text-muted-foreground">OS</span>
        </SheetTitle>
        <nav className="space-y-4 overflow-y-auto px-2 py-4">
          {NAV_GROUPS.map((group, gi) => {
            const visible = group.items.filter((item) => can(role, "view", item.resource as Resource));
            if (visible.length === 0) return null;
            return (
              <div key={gi}>
                {group.label && <p className="mb-1.5 px-2.5 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">{group.label}</p>}
                <ul className="space-y-0.5">
                  {visible.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-foreground/80 hover:bg-accent"
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
