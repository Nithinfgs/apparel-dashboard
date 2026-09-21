import { listDispatches } from "@/lib/data";
import { PageHeader, DataTable } from "@/components/shared";
import { dispatchColumns } from "./columns";

export default async function DispatchPage() {
  const dispatches = await listDispatches();

  return (
    <div className="space-y-5">
      <PageHeader title="Dispatch" description={`${dispatches.length} shipments in the logistics pipeline.`} />
      <DataTable columns={dispatchColumns} data={dispatches} emptyTitle="No dispatches yet" pageSize={20} />
    </div>
  );
}
