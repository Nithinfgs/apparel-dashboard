import { listInvoices, getFinanceSummary } from "@/lib/data";
import { PageHeader, MetricCard, DataTable, MoneyDisplay } from "@/components/shared";
import { invoiceColumns } from "./columns";

export default async function InvoicesPage() {
  const [invoices, summary] = await Promise.all([listInvoices(), getFinanceSummary()]);

  return (
    <div className="space-y-5">
      <PageHeader title="Invoices" description={`${invoices.length} invoices raised across all buyers.`} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricCard label="Revenue Collected" value={<MoneyDisplay amount={summary.revenue} compact />} />
        <MetricCard label="Outstanding" value={<MoneyDisplay amount={summary.outstanding} compact />} deltaTone="warning" />
        <MetricCard label="Overdue" value={<MoneyDisplay amount={summary.overdue} compact />} deltaTone={summary.overdue > 0 ? "danger" : "neutral"} />
      </div>

      <DataTable columns={invoiceColumns} data={invoices} emptyTitle="No invoices yet" pageSize={20} />
    </div>
  );
}
