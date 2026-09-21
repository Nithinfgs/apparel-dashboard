"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const QUICK_CREATE_ITEMS = [
  { label: "Enquiry", href: "/enquiries?new=1" },
  { label: "Order", href: "/orders?new=1" },
  { label: "Buyer", href: "/buyers?new=1" },
  { label: "Style", href: "/styles?new=1" },
  { label: "Sample", href: "/samples?new=1" },
  { label: "Purchase Order", href: "/purchase-orders?new=1" },
  { label: "Inspection", href: "/quality/inspections?new=1" },
  { label: "Production Update", href: "/production/daily" },
];

export function QuickCreate() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" className="h-8 gap-1.5">
          <Plus className="h-3.5 w-3.5" /> New
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {QUICK_CREATE_ITEMS.map((item) => (
          <DropdownMenuItem key={item.href} asChild>
            <Link href={item.href}>{item.label}</Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
