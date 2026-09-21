import { listOrders, listBuyers, listFactories } from "@/lib/data";
import { PageHeader, SearchInput, FilterBar, DataTable } from "@/components/shared";
import { orderColumns } from "./columns";
import { ORDER_STAGES, ORDER_STAGE_LABELS } from "@/lib/constants";
import type { OrderStage, RiskLevel } from "@/types";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; stage?: string; buyerId?: string; factoryId?: string; risk?: string }>;
}) {
  const params = await searchParams;
  const [buyers, factories, { items, total }] = await Promise.all([
    listBuyers(),
    listFactories(),
    listOrders({
      search: params.q,
      stage: params.stage as OrderStage | undefined,
      buyerId: params.buyerId,
      factoryId: params.factoryId,
      risk: params.risk as RiskLevel | undefined,
      pageSize: 100,
    }),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader title="Orders" description={`${total} orders across every stage of production.`} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SearchInput placeholder="Search order no., buyer, style…" className="w-72" />
        <FilterBar
          filters={[
            { paramKey: "stage", label: "Stages", options: ORDER_STAGES.map((s) => ({ value: s, label: ORDER_STAGE_LABELS[s] })) },
            { paramKey: "buyerId", label: "Buyers", options: buyers.map((b) => ({ value: b.id, label: b.companyName })) },
            { paramKey: "factoryId", label: "Factories", options: factories.map((f) => ({ value: f.id, label: f.name })) },
            {
              paramKey: "risk",
              label: "Risk",
              options: [
                { value: "low", label: "Low" },
                { value: "medium", label: "Medium" },
                { value: "high", label: "High" },
                { value: "critical", label: "Critical" },
              ],
            },
          ]}
        />
      </div>

      <DataTable
        columns={orderColumns}
        data={items}
        pageSize={20}
        emptyTitle="No orders match your filters"
        emptyDescription="Try clearing a filter or searching by order number."
      />
    </div>
  );
}
