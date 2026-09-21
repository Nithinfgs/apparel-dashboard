import { resolvePortalBuyerId } from "@/lib/auth/portal-context";
import { getBuyerDocuments } from "@/lib/data";
import { PageHeader, DocumentList } from "@/components/shared";
import { Card, CardContent } from "@/components/ui/card";

export default async function PortalDocumentsPage() {
  const buyerId = await resolvePortalBuyerId();
  const documents = await getBuyerDocuments(buyerId);

  return (
    <div className="space-y-5">
      <PageHeader title="Documents" description="Every file Texcroft has shared across your orders." />
      <Card>
        <CardContent>
          <DocumentList items={documents} />
        </CardContent>
      </Card>
    </div>
  );
}
