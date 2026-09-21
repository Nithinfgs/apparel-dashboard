import { notFound } from "next/navigation";
import { getStyleById, getStyleVersions } from "@/lib/data";
import { PageHeader, DetailRow, StatusBadge, DateDisplay } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function StyleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const style = await getStyleById(id);
  if (!style) notFound();
  const versions = await getStyleVersions(id);

  return (
    <div className="space-y-5">
      <PageHeader
        title={style.name}
        crumbs={[{ label: "Styles", href: "/styles" }, { label: style.name }]}
        description={`${style.styleCode} · ${style.buyerName}`}
        actions={<StatusBadge status={style.approvalStatus} />}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Style Details</CardTitle>
          </CardHeader>
          <CardContent>
            <DetailRow label="Category" value={style.category} />
            <DetailRow label="Fabric" value={style.fabric} />
            <DetailRow label="Composition" value={style.composition} />
            <DetailRow label="GSM" value={style.gsm} />
            <DetailRow label="Wash" value={style.washType ?? "—"} />
            <DetailRow label="Print / Embroidery" value={style.printDetails ?? style.embroideryDetails ?? "—"} />
            <DetailRow label="Labels" value={style.labelInstructions ?? "—"} />
            <DetailRow label="Packaging" value={style.packagingInstructions ?? "—"} />
            <DetailRow label="Current Version" value={`v${style.currentVersion}`} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Colours &amp; Sizes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-1.5 text-xs text-muted-foreground">Colours</p>
              <div className="flex flex-wrap gap-1.5">
                {style.colours.map((c) => (
                  <Badge key={c} variant="secondary">
                    {c}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-xs text-muted-foreground">Sizes</p>
              <div className="flex flex-wrap gap-1.5">
                {style.sizes.map((s) => (
                  <Badge key={s} variant="secondary">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {versions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Version History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {versions.map((v) => (
              <div key={v.id} className="flex items-center justify-between rounded-md border border-border p-2.5 text-sm">
                <div>
                  <p className="font-medium">Version {v.versionNumber}</p>
                  <p className="text-xs text-muted-foreground">{v.changeSummary}</p>
                </div>
                <DateDisplay value={v.createdAt} className="text-xs text-muted-foreground" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
