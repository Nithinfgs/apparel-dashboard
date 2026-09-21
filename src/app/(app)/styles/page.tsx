import { listStyles } from "@/lib/data";
import { PageHeader, SearchInput, DataTable } from "@/components/shared";
import { styleColumns } from "./columns";

export default async function StylesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const styles = await listStyles(q);

  return (
    <div className="space-y-5">
      <PageHeader title="Styles" description={`${styles.length} styles in the catalogue.`} />
      <SearchInput placeholder="Search styles…" className="w-72" />
      <DataTable columns={styleColumns} data={styles} emptyTitle="No styles found" pageSize={20} />
    </div>
  );
}
