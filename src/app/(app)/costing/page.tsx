import { listCostings } from "@/lib/data";
import { PageHeader, DataTable } from "@/components/shared";
import { costingColumns } from "./columns";

export default async function CostingPage() {
  const costings = await listCostings();

  return (
    <div className="space-y-5">
      <PageHeader title="Costing" description={`${costings.length} costing sheets across all orders and versions.`} />
      <DataTable columns={costingColumns} data={costings} emptyTitle="No costings yet" pageSize={20} />
    </div>
  );
}
