import "server-only";
import * as seed from "@/lib/seed";
import { calculateBuyerKpis } from "@/lib/calculations";
import type { Buyer } from "@/types";

export interface BuyerWithKpis extends Buyer {
  kpis: ReturnType<typeof calculateBuyerKpis>;
}

function enrich(buyer: (typeof seed.buyers)[number]): BuyerWithKpis {
  const kpis = calculateBuyerKpis(buyer, seed.orders, (o) => o.quantity * o.pricePerPiece);
  return { ...buyer, kpis };
}

export async function listBuyers(search?: string) {
  let items = seed.buyers.map(enrich);
  if (search) {
    const q = search.toLowerCase();
    items = items.filter((b) => b.companyName.toLowerCase().includes(q) || b.country.toLowerCase().includes(q));
  }
  return items;
}

export async function getBuyerById(id: string) {
  const buyer = seed.buyers.find((b) => b.id === id);
  return buyer ? enrich(buyer) : undefined;
}

export async function getBuyerContacts(buyerId: string) {
  return seed.buyerContacts.filter((c) => c.buyerId === buyerId);
}

export async function getBuyerInvoices(buyerId: string) {
  return seed.invoices.filter((i) => i.buyerId === buyerId);
}

export async function getBuyerRevenueDistribution() {
  return seed.buyers.map((b) => ({
    buyerId: b.id,
    buyerName: b.companyName,
    value: seed.orders.filter((o) => o.buyerId === b.id).reduce((s, o) => s + o.quantity * o.pricePerPiece, 0),
  }));
}
