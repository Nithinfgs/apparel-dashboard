import type { Invoice, Payment, InvoiceStatus } from "@/types";
import { isBefore, parseISO } from "date-fns";

export interface InvoiceFinancials {
  paidAmount: number;
  outstandingAmount: number;
  derivedStatus: InvoiceStatus;
}

/** See BUSINESS_RULES.md §11. */
export function calculateOutstandingPayment(
  invoice: Invoice,
  payments: Payment[],
  today: Date = new Date()
): InvoiceFinancials {
  const paidAmount = payments
    .filter((p) => p.invoiceId === invoice.id)
    .reduce((sum, p) => sum + p.amount, 0);
  const outstandingAmount = invoice.amount - paidAmount;

  let derivedStatus: InvoiceStatus;
  if (outstandingAmount <= 0) {
    derivedStatus = "paid";
  } else if (paidAmount > 0) {
    derivedStatus = "partially_paid";
  } else if (isBefore(parseISO(invoice.dueDate), today)) {
    derivedStatus = "overdue";
  } else {
    derivedStatus = "sent";
  }

  return { paidAmount, outstandingAmount, derivedStatus };
}
