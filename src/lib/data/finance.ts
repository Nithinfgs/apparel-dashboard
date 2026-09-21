import "server-only";
import * as seed from "@/lib/seed";
import { calculateOutstandingPayment } from "@/lib/calculations";

export async function listInvoices() {
  return seed.invoices.map((inv) => {
    const financials = calculateOutstandingPayment(inv, seed.payments);
    return {
      ...inv,
      ...financials,
      status: financials.derivedStatus,
      buyerName: seed.buyers.find((b) => b.id === inv.buyerId)?.companyName ?? "Unknown",
      orderNo: seed.orders.find((o) => o.id === inv.orderId)?.orderNo ?? inv.orderId,
    };
  });
}

export async function listPayments() {
  return seed.payments.map((p) => {
    const invoice = seed.invoices.find((i) => i.id === p.invoiceId);
    return {
      ...p,
      invoiceNo: invoice?.invoiceNo ?? p.invoiceId,
      buyerName: seed.buyers.find((b) => b.id === invoice?.buyerId)?.companyName ?? "Unknown",
    };
  });
}

export async function getFinanceSummary() {
  const enriched = await listInvoices();
  const revenue = enriched.reduce((s, i) => s + i.paidAmount, 0);
  const outstanding = enriched.reduce((s, i) => s + i.outstandingAmount, 0);
  const overdue = enriched.filter((i) => i.status === "overdue").reduce((s, i) => s + i.outstandingAmount, 0);
  return { revenue, outstanding, overdue };
}
