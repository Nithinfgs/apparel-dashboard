"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";

interface SearchResult {
  group: string;
  label: string;
  sublabel?: string;
  href: string;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const runSearch = useCallback(async (q: string) => {
    setQuery(q);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setResults(data.results ?? []);
  }, []);

  const groups = Array.from(new Set(results.map((r) => r.group)));

  return (
    <>
      <Button
        variant="secondary"
        className="h-8 w-56 justify-between px-2.5 text-xs font-normal text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <span className="flex items-center gap-2">
          <Search className="h-3.5 w-3.5" /> Search orders, buyers…
        </span>
        <kbd className="rounded border border-border bg-background px-1 py-0.5 text-[10px]">⌘K</kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen} title="Search Apparel OS" description="Search orders, buyers, styles, suppliers, factories">
        <CommandInput placeholder="Search orders, buyers, styles…" value={query} onValueChange={runSearch} />
        <CommandList>
          <CommandEmpty>{query ? "No results found." : "Type to search across Apparel OS."}</CommandEmpty>
          {groups.map((group) => (
            <CommandGroup key={group} heading={group}>
              {results
                .filter((r) => r.group === group)
                .map((r) => (
                  <CommandItem
                    key={r.href}
                    onSelect={() => {
                      setOpen(false);
                      router.push(r.href);
                    }}
                  >
                    <span className="font-medium">{r.label}</span>
                    {r.sublabel && <span className="ml-2 text-xs text-muted-foreground">{r.sublabel}</span>}
                  </CommandItem>
                ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
