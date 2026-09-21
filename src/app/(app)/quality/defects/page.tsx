import Link from "next/link";
import { listDefects, getDefectTrends } from "@/lib/data";
import { PageHeader, StatusBadge } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DefectTrendsChart } from "@/components/quality/defect-trends-chart";

export default async function DefectsPage() {
  const [defects, trends] = await Promise.all([listDefects(), getDefectTrends()]);

  return (
    <div className="space-y-5">
      <PageHeader title="Defect Analytics" description={`${defects.length} defect records across all inspections.`} />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Defects by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <DefectTrendsChart data={trends} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="divide-y divide-border p-0">
          {defects.map((d) => {
            const row = (
              <>
                <div>
                  <span className="font-medium capitalize">{d.category}</span>{" "}
                  <span className="text-muted-foreground">× {d.count}</span>
                </div>
                <StatusBadge status={d.severity} />
              </>
            );
            const rowClassName = "flex items-center justify-between gap-3 px-4 py-2.5 text-sm";
            return d.inspection ? (
              <Link key={d.id} href={`/quality/inspections/${d.inspection.id}`} className={`${rowClassName} hover:bg-accent/40`}>
                {row}
              </Link>
            ) : (
              <div key={d.id} className={rowClassName}>
                {row}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
