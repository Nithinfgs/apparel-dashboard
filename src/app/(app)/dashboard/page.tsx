import Link from "next/link";
import {
  getDashboardKpis,
  getPipelineSummary,
  getOrdersRequiringAttention,
  getDashboardUpcomingDispatches,
  getProductionChartData,
  getBuyerRevenueChart,
  listActivity,
} from "@/lib/data";
import { PageHeader, MetricCard, RiskBadge, MoneyDisplay, DateDisplay, ActivityTimeline } from "@/components/shared";
import { PipelineStrip } from "@/components/dashboard/pipeline-strip";
import { ProductionChart } from "@/components/dashboard/production-chart";
import { BuyerRevenueChart } from "@/components/dashboard/buyer-revenue-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/roles";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const canViewFinance = can(user.role, "view", "finance");
  const canViewBuyers = can(user.role, "view", "buyers");

  const [kpis, pipeline, attention, dispatches, chartData, buyerRevenue, activity] = await Promise.all([
    getDashboardKpis(),
    getPipelineSummary(),
    getOrdersRequiringAttention(5),
    getDashboardUpcomingDispatches(6),
    getProductionChartData(),
    getBuyerRevenueChart(),
    listActivity(8),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Command Center" description="Texcroft's operations at a glance — enquiry to dispatch." />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-4">
        <MetricCard label="Active Orders" value={kpis.activeOrders} />
        <MetricCard label="Orders at Risk" value={kpis.atRisk} deltaTone="warning" delta={kpis.atRisk > 0 ? "Needs review" : undefined} />
        <MetricCard label="Orders Delayed" value={kpis.delayed} deltaTone="danger" delta={kpis.delayed > 0 ? "Action required" : undefined} />
        <MetricCard label="Dispatches This Week" value={kpis.dispatchesThisWeek} />
        {canViewFinance && <MetricCard label="Production Value" value={<MoneyDisplay amount={kpis.productionValue} compact />} />}
        {canViewBuyers && <MetricCard label="Pending Buyer Approvals" value={kpis.pendingApprovals} />}
        <MetricCard label="QC Issues" value={kpis.qcFailures} deltaTone={kpis.qcFailures > 0 ? "danger" : "neutral"} />
        {canViewFinance && <MetricCard label="Receivables" value={<MoneyDisplay amount={kpis.receivables} compact />} />}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Production Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <PipelineStrip data={pipeline} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Orders Requiring Attention</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {attention.length === 0 && <EmptyState title="No orders at risk" description="Every order is tracking to plan." />}
            {attention.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-accent/50"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{order.orderNo}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {order.styleName} · {order.quantity.toLocaleString("en-IN")} pcs
                  </p>
                  {order.risk.reasons[0] && <p className="mt-0.5 truncate text-xs text-amber-700">{order.risk.reasons[0]}</p>}
                </div>
                <RiskBadge level={order.risk.level} reasons={order.risk.reasons} />
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Upcoming Dispatches</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead>Dispatch</TableHead>
                  <TableHead>Risk</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dispatches.map((o) => (
                  <TableRow key={o.id} className="cursor-pointer">
                    <TableCell className="font-medium">
                      <Link href={`/orders/${o.id}`}>{o.orderNo}</Link>
                    </TableCell>
                    <TableCell className="max-w-[140px] truncate">{o.buyerName}</TableCell>
                    <TableCell className="text-right tabular-nums">{o.quantity.toLocaleString("en-IN")}</TableCell>
                    <TableCell>
                      <DateDisplay value={o.expectedDispatchDate} />
                    </TableCell>
                    <TableCell>
                      <RiskBadge level={o.risk.level} reasons={o.risk.reasons} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className={`grid gap-4 ${canViewBuyers ? "lg:grid-cols-2" : ""}`}>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Planned vs. Actual Production</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductionChart data={chartData} />
          </CardContent>
        </Card>
        {canViewBuyers && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Revenue by Buyer</CardTitle>
            </CardHeader>
            <CardContent>
              <BuyerRevenueChart data={buyerRevenue} />
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityTimeline items={activity} />
        </CardContent>
      </Card>
    </div>
  );
}
