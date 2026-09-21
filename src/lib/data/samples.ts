import "server-only";
import * as seed from "@/lib/seed";

export async function listSamples() {
  return seed.samples.map((s) => ({
    ...s,
    orderNo: seed.orders.find((o) => o.id === s.orderId)?.orderNo,
    styleName: seed.styles.find((st) => st.id === s.styleId)?.name ?? "Unknown",
  }));
}

export async function getSampleById(id: string) {
  const sample = seed.samples.find((s) => s.id === id);
  if (!sample) return undefined;
  return {
    ...sample,
    orderNo: seed.orders.find((o) => o.id === sample.orderId)?.orderNo,
    styleName: seed.styles.find((st) => st.id === sample.styleId)?.name ?? "Unknown",
    approval: seed.sampleApprovals.find((a) => a.sampleId === id),
  };
}
