import { PageHeader, DetailRow } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ORDER_PREFIX, CURRENCY_SYMBOLS, ORDER_STAGE_LABELS } from "@/lib/constants";
import { ORDER_STAGES } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="Settings" description="Company configuration. Kept intentionally minimal — see brief §50." />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Company</CardTitle>
          </CardHeader>
          <CardContent>
            <DetailRow label="Company Name" value="Apparel Manufacturing & Sourcing" />
            <DetailRow label="Location" value="Tiruppur / Coimbatore, Tamil Nadu" />
            <DetailRow label="Order Prefix" value={ORDER_PREFIX} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Currencies</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.entries(CURRENCY_SYMBOLS).map(([code, symbol]) => (
              <DetailRow key={code} label={code} value={symbol} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Production Stages</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1.5">
            {ORDER_STAGES.map((s) => (
              <Badge key={s} variant="secondary">
                {ORDER_STAGE_LABELS[s]}
              </Badge>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">QC Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <DetailRow label="Inspection Types" value="Fabric QC, Inline QC, End-Line QC, Measurement, Final Inspection" />
            <DetailRow label="Result Options" value="Pass, Conditional Pass, Hold, Fail" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
