import {
  getRevenueOverTime,
  getTopBuyersByProfitability,
  getFactoryUtilisationChart,
  getFactoryOnTimePerformance,
  getSupplierLeadTimes,
  getDefectTrendsByCategory,
  getDelayedOrderReasons,
  getOverallOnTimeDeliveryPercent,
} from "@/lib/data";
import { PageHeader, MetricCard, PercentageDisplay } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RevenueOverTimeChart, HorizontalBarChart, VerticalBarChart } from "@/components/analytics/simple-charts";

export default async function AnalyticsPage() {
  const [revenue, topBuyers, factoryUtilisation, factoryOnTime, supplierLeadTimes, defectTrends, delayReasons, onTimePercent] =
    await Promise.all([
      getRevenueOverTime(),
      getTopBuyersByProfitability(),
      getFactoryUtilisationChart(),
      getFactoryOnTimePerformance(),
      getSupplierLeadTimes(),
      getDefectTrendsByCategory(),
      getDelayedOrderReasons(),
      getOverallOnTimeDeliveryPercent(),
    ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Company-wide performance, computed from live application data." />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard label="On-Time Delivery" value={<PercentageDisplay value={onTimePercent} />} />
        <MetricCard label="Top Buyer" value={topBuyers[0]?.buyerName ?? "—"} />
        <MetricCard label="Most Utilised Factory" value={[...factoryUtilisation].sort((a, b) => b.utilisation - a.utilisation)[0]?.factoryName ?? "—"} />
        <MetricCard label="Top Defect Category" value={[...defectTrends].sort((a, b) => b.count - a.count)[0]?.category ?? "—"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Revenue Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueOverTimeChart data={revenue} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Top Buyers by Profitability</CardTitle>
          </CardHeader>
          <CardContent>
            <HorizontalBarChart data={topBuyers} dataKey="estimatedProfit" labelKey="buyerName" format="money" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Factory Utilisation</CardTitle>
          </CardHeader>
          <CardContent>
            <HorizontalBarChart data={factoryUtilisation} dataKey="utilisation" labelKey="factoryName" format="percent" color="var(--chart-3)" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Factory On-Time Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <HorizontalBarChart data={factoryOnTime} dataKey="onTimePercent" labelKey="factoryName" format="percent" color="var(--chart-2)" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Supplier Lead Time (days)</CardTitle>
          </CardHeader>
          <CardContent>
            <HorizontalBarChart data={supplierLeadTimes} dataKey="leadTimeDays" labelKey="supplierName" format="days" color="var(--chart-5)" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Defects by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <VerticalBarChart data={defectTrends} dataKey="count" labelKey="category" color="var(--chart-4)" />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Delayed Order Reasons</CardTitle>
          </CardHeader>
          <CardContent>
            <VerticalBarChart data={delayReasons} dataKey="count" labelKey="reason" color="var(--chart-1)" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
