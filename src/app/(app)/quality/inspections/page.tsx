import { listInspections } from "@/lib/data";
import { PageHeader, DataTable } from "@/components/shared";
import { inspectionColumns } from "./columns";

export default async function InspectionsPage() {
  const inspections = await listInspections();

  return (
    <div className="space-y-5">
      <PageHeader title="Quality Inspections" description={`${inspections.length} inspections logged.`} />
      <DataTable columns={inspectionColumns} data={inspections} emptyTitle="No inspections yet" pageSize={20} />
    </div>
  );
}
