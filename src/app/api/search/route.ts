import { NextResponse } from "next/server";
import * as seed from "@/lib/seed";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").toLowerCase().trim();
  if (!q) return NextResponse.json({ results: [] });

  const results: { group: string; label: string; sublabel?: string; href: string }[] = [];

  seed.orders
    .filter((o) => o.orderNo.toLowerCase().includes(q))
    .slice(0, 6)
    .forEach((o) =>
      results.push({
        group: "Orders",
        label: o.orderNo,
        sublabel: seed.buyers.find((b) => b.id === o.buyerId)?.companyName,
        href: `/orders/${o.id}`,
      })
    );

  seed.buyers
    .filter((b) => b.companyName.toLowerCase().includes(q))
    .slice(0, 5)
    .forEach((b) => results.push({ group: "Buyers", label: b.companyName, sublabel: b.country, href: `/buyers/${b.id}` }));

  seed.styles
    .filter((s) => s.name.toLowerCase().includes(q) || s.styleCode.toLowerCase().includes(q))
    .slice(0, 5)
    .forEach((s) => results.push({ group: "Styles", label: s.name, sublabel: s.styleCode, href: `/styles/${s.id}` }));

  seed.suppliers
    .filter((s) => s.name.toLowerCase().includes(q))
    .slice(0, 5)
    .forEach((s) => results.push({ group: "Suppliers", label: s.name, sublabel: s.location, href: `/suppliers/${s.id}` }));

  seed.factories
    .filter((f) => f.name.toLowerCase().includes(q))
    .slice(0, 5)
    .forEach((f) => results.push({ group: "Factories", label: f.name, sublabel: f.location, href: `/factories/${f.id}` }));

  return NextResponse.json({ results });
}
