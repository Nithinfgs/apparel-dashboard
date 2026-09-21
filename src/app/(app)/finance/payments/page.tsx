import { listPayments } from "@/lib/data";
import { PageHeader, DataTable } from "@/components/shared";
import { paymentColumns } from "./columns";

export default async function PaymentsPage() {
  const payments = await listPayments();

  return (
    <div className="space-y-5">
      <PageHeader title="Payments" description={`${payments.length} payments recorded.`} />
      <DataTable columns={paymentColumns} data={payments} emptyTitle="No payments recorded yet" pageSize={20} />
    </div>
  );
}
