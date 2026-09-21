import { listBuyers } from "@/lib/data";
import { PageHeader, SearchInput, DataTable } from "@/components/shared";
import { buyerColumns } from "./columns";

export default async function BuyersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const buyers = await listBuyers(q);

  return (
    <div className="space-y-5">
      <PageHeader title="Buyers" description={`${buyers.length} buyer relationships.`} />
      <SearchInput placeholder="Search buyers…" className="w-72" />
      <DataTable columns={buyerColumns} data={buyers} emptyTitle="No buyers found" />
    </div>
  );
}
