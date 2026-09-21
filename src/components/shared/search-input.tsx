"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";

/** URL-state search box: writes `?q=` and lets Server Components read it. */
export function SearchInput({ placeholder = "Search…", paramKey = "q", className }: { placeholder?: string; paramKey?: string; className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get(paramKey) ?? "");
  const [, startTransition] = useTransition();

  function handleChange(next: string) {
    setValue(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next) params.set(paramKey, next);
    else params.delete(paramKey);
    startTransition(() => router.replace(`${pathname}?${params.toString()}`));
  }

  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input value={value} onChange={(e) => handleChange(e.target.value)} placeholder={placeholder} className="pl-8" />
    </div>
  );
}
