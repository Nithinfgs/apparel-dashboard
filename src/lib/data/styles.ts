import "server-only";
import * as seed from "@/lib/seed";

export async function listStyles(search?: string) {
  let items = seed.styles.map((s) => ({
    ...s,
    buyerName: seed.buyers.find((b) => b.id === s.buyerId)?.companyName ?? "Unknown",
  }));
  if (search) {
    const q = search.toLowerCase();
    items = items.filter((s) => s.name.toLowerCase().includes(q) || s.styleCode.toLowerCase().includes(q));
  }
  return items;
}

export async function getStyleById(id: string) {
  const style = seed.styles.find((s) => s.id === id);
  if (!style) return undefined;
  return {
    ...style,
    buyerName: seed.buyers.find((b) => b.id === style.buyerId)?.companyName ?? "Unknown",
  };
}

export async function getStyleVersions(styleId: string) {
  return seed.styleVersions.filter((v) => v.styleId === styleId);
}
