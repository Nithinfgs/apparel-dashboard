import { listSamples } from "@/lib/data";
import { PageHeader, DataTable } from "@/components/shared";
import { sampleColumns } from "./columns";

export default async function SamplesPage() {
  const samples = await listSamples();

  return (
    <div className="space-y-5">
      <PageHeader title="Samples" description={`${samples.length} samples tracked across development and approval.`} />
      <DataTable columns={sampleColumns} data={samples} emptyTitle="No samples yet" pageSize={20} />
    </div>
  );
}
