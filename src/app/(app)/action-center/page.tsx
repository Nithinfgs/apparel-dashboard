import Link from "next/link";
import { getActionCenterItems, categoryLabel } from "@/lib/data/action-center";
import { PageHeader, MetricCard, RiskBadge, StatusBadge, DateDisplay } from "@/components/shared";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared";

export default async function ActionCenterPage() {
  const items = await getActionCenterItems();
  const critical = items.filter((i) => i.severity === "critical" || i.severity === "high").length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Action / Exception Center"
        description="Everything that needs attention right now, pulled from live order, production, quality, and finance data — no separate tracking of its own."
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard label="Total Exceptions" value={items.length} />
        <MetricCard label="High / Critical" value={critical} deltaTone={critical > 0 ? "danger" : "neutral"} />
        <MetricCard label="Production Delays" value={items.filter((i) => i.category === "production_delay").length} />
        <MetricCard label="Unresolved Issues" value={items.filter((i) => i.category === "production_issue").length} />
      </div>

      {items.length === 0 && <EmptyState title="Nothing needs attention" description="Every order, material, QC result, and invoice is on track." />}

      <Card>
        <CardContent className="divide-y divide-border p-0">
          {items.map((item) => (
            <Link key={item.id} href={item.href} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-accent/40">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">{categoryLabel(item.category)}</span>
                  <RiskBadge level={item.severity} />
                </div>
                <p className="mt-0.5 truncate font-medium text-foreground">{item.issue}</p>
                <p className="text-xs text-muted-foreground">Next: {item.nextAction}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1 text-xs text-muted-foreground">
                <StatusBadge status={item.status} />
                <span>{item.owner}</span>
                {item.dueDate && (
                  <span>
                    Due <DateDisplay value={item.dueDate} />
                  </span>
                )}
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
