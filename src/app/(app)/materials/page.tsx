import { listMaterials } from "@/lib/data";
import { PageHeader, DataTable, FilterBar } from "@/components/shared";
import { materialColumns } from "./columns";

export default async function MaterialsPage({ searchParams }: { searchParams: Promise<{ status?: string; category?: string }> }) {
  const { status, category } = await searchParams;
  const materials = await listMaterials({ status, category });
  const shortages = materials.filter((m) => m.availability.status !== "sufficient").length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Materials"
        description={`${materials.length} materials tracked${shortages > 0 ? ` · ${shortages} need attention` : ""}.`}
      />
      <FilterBar
        filters={[
          {
            paramKey: "status",
            label: "Status",
            options: ["required", "rfq", "ordered", "partial", "received", "qc_hold"].map((s) => ({ value: s, label: s })),
          },
          {
            paramKey: "category",
            label: "Category",
            options: ["fabric", "rib", "thread", "buttons", "zippers", "labels", "packaging", "other"].map((c) => ({ value: c, label: c })),
          },
        ]}
      />
      <DataTable columns={materialColumns} data={materials} emptyTitle="No materials found" pageSize={20} />
    </div>
  );
}
