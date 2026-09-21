"use client";

import type { ReactNode } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export interface FilterOption {
  paramKey: string;
  label: string;
  options: { value: string; label: string }[];
}

/** URL-state filter dropdowns, composed alongside SearchInput above a DataTable. */
export function FilterBar({ filters, extra }: { filters: FilterOption[]; extra?: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") params.delete(key);
    else params.set(key, value);
    router.replace(`${pathname}?${params.toString()}`);
  }

  const hasActiveFilters = filters.some((f) => searchParams.get(f.paramKey));

  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.map((f) => (
        <Select key={f.paramKey} value={searchParams.get(f.paramKey) ?? "all"} onValueChange={(v) => setParam(f.paramKey, v)}>
          <SelectTrigger size="sm" className="w-auto min-w-[140px]">
            <SelectValue placeholder={f.label} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All {f.label}</SelectItem>
            {f.options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={() => router.replace(pathname)}>
          <X className="h-3.5 w-3.5" /> Clear
        </Button>
      )}
      {extra}
    </div>
  );
}
