import { listPurchaseOrders } from "@/lib/data";
import { PageHeader, DataTable } from "@/components/shared";
import { purchaseOrderColumns } from "./columns";

export default async function PurchaseOrdersPage() {
  const purchaseOrders = await listPurchaseOrders();

  return (
    <div className="space-y-5">
      <PageHeader title="Purchase Orders" description={`${purchaseOrders.length} purchase orders raised with suppliers.`} />
      <DataTable columns={purchaseOrderColumns} data={purchaseOrders} emptyTitle="No purchase orders yet" pageSize={20} />
    </div>
  );
}
