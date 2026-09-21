import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getOrderById,
  getOrderMilestones,
  getOrderStageProgress,
  getOrderProductionProgress,
  getOrderMaterials,
  getOrderSamples,
  getOrderQualityInspections,
  getOrderInvoices,
  getOrderDocuments,
  getOrderActivity,
  checkBulkProductionGate,
  getCostingVersionsForOrder,
  getOrderNextAction,
  getOrderMilestoneImpacts,
  getOrderCostVariance,
  getIssuesForOrder,
  getChangeRequestsForOrder,
  listFactories,
  listActiveProductionOrders,
} from "@/lib/data";
import { PageHeader, RiskBadge, MoneyDisplay, DateDisplay, PercentageDisplay, DetailRow, OrderProgress, MilestoneTimeline, ActivityTimeline, DocumentList, StatusBadge } from "@/components/shared";
import { calculateMaterialAvailability, calculateOutstandingPayment } from "@/lib/calculations";
import { formatSampleType } from "@/lib/utils/format";
import { CHANGE_REQUEST_FIELD_LABELS, PRODUCTION_ISSUE_TYPE_LABELS, PRODUCTION_STAGE_LABELS } from "@/lib/constants";
import { INTERNAL_STAFF_PROFILES } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Eye } from "lucide-react";
import { IssueForm } from "../../production/issues/issue-form";
import { ChangeRequestForm } from "./change-request-form";
import { ChangeRequestDecision } from "./change-request-decision";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  const [
    milestones,
    stageProgress,
    productionProgress,
    materials,
    samples,
    inspections,
    invoices,
    documents,
    activity,
    bulkGate,
    costingVersions,
    nextAction,
    milestoneImpacts,
    costVariance,
    issues,
    changeRequests,
    factories,
    activeOrders,
  ] = await Promise.all([
    getOrderMilestones(order.id),
    getOrderStageProgress(order.id),
    getOrderProductionProgress(order.id),
    getOrderMaterials(order.id),
    getOrderSamples(order.id),
    getOrderQualityInspections(order.id),
    getOrderInvoices(order.id),
    getOrderDocuments(order.id),
    getOrderActivity(order.id),
    checkBulkProductionGate(order.id),
    getCostingVersionsForOrder(order.id),
    getOrderNextAction(order.id),
    getOrderMilestoneImpacts(order.id),
    getOrderCostVariance(order.id),
    getIssuesForOrder(order.id),
    getChangeRequestsForOrder(order.id),
    listFactories(),
    listActiveProductionOrders(),
  ]);

  const latestCosting = costingVersions[costingVersions.length - 1];
  const openIssues = issues.filter((i) => i.status === "open" || i.status === "in_progress");
  const owners = INTERNAL_STAFF_PROFILES.map((p) => ({ id: p.id, fullName: p.fullName }));
  const thisFactory = factories.find((f) => f.id === order.factoryId);
  const thisOrderOnly = activeOrders.filter((o) => o.id === order.id);

  return (
    <div className="space-y-5">
      <PageHeader
        title={order.orderNo}
        crumbs={[{ label: "Orders", href: "/orders" }, { label: order.orderNo }]}
        description={
          <span>
            {order.buyerName} · {order.styleName} · {order.quantity.toLocaleString("en-IN")} pcs
          </span>
        }
        actions={
          <>
            <RiskBadge level={order.risk.level} reasons={order.risk.reasons} className="h-8 px-3 text-[13px]" />
            <Button variant="secondary" asChild>
              <Link href={`/portal/orders/${order.id}`}>
                <Eye className="h-4 w-4" /> View as Buyer
              </Link>
            </Button>
          </>
        }
      />

      {!bulkGate.allowed && (order.stage === "sourcing" || order.stage === "cutting") && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Bulk production gate</AlertTitle>
          <AlertDescription>{bulkGate.reason}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="py-1">
          <OrderProgress stages={stageProgress} currentStage={order.stage} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Card>
          <CardContent className="space-y-0.5 py-1">
            <p className="text-xs text-muted-foreground">Order Value</p>
            <p className="text-lg font-semibold">
              <MoneyDisplay amount={order.orderValue} currency={order.currency} />
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-0.5 py-1">
            <p className="text-xs text-muted-foreground">Expected Dispatch</p>
            <p className="text-lg font-semibold">
              <DateDisplay value={order.expectedDispatchDate} />
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-0.5 py-1">
            <p className="text-xs text-muted-foreground">Factory</p>
            <p className="text-lg font-semibold">{order.factoryName}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-0.5 py-1">
            <p className="text-xs text-muted-foreground">Expected Margin</p>
            <p className="text-lg font-semibold">
              {latestCosting ? <MoneyDisplay amount={latestCosting.breakdown.totalOrderProfit} currency={order.currency} compact /> : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-0.5 py-1">
            <p className="text-xs text-muted-foreground">Next Action</p>
            {nextAction ? (
              <>
                <p className="text-sm font-semibold leading-tight">{nextAction.action}</p>
                <p className="text-xs text-muted-foreground">
                  {nextAction.ownerName} · <DateDisplay value={nextAction.dueDate} />
                </p>
              </>
            ) : (
              <p className="text-lg font-semibold">—</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="summary">
        <TabsList className="flex-wrap">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="production">Production</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
          <TabsTrigger value="issues">
            Issues &amp; Changes
            {(openIssues.length > 0 || changeRequests.some((cr) => cr.status === "pending")) && (
              <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 text-[10px] font-semibold text-white">
                {openIssues.length + changeRequests.filter((cr) => cr.status === "pending").length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailRow label="Buyer" value={<Link href={`/buyers/${order.buyerId}`} className="hover:underline">{order.buyerName}</Link>} />
              <DetailRow label="PO Number" value={order.poNumber} />
              <DetailRow label="Style" value={<Link href={`/styles/${order.styleId}`} className="hover:underline">{order.styleName}</Link>} />
              <DetailRow label="Quantity" value={`${order.quantity.toLocaleString("en-IN")} pcs`} />
              <DetailRow label="Price / Piece" value={<MoneyDisplay amount={order.pricePerPiece} currency={order.currency} />} />
              <DetailRow label="Currency" value={order.currency} />
              <DetailRow label="Order Value" value={<MoneyDisplay amount={order.orderValue} currency={order.currency} />} />
              <DetailRow label="Stage" value={<StatusBadge status={order.stage} />} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Sampling</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {samples.length === 0 && <p className="text-sm text-muted-foreground">No samples logged for this order yet.</p>}
              {samples.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-md border border-border p-2.5 text-sm">
                  <div>
                    <p className="font-medium">{formatSampleType(s.sampleType)} Sample</p>
                    <p className="text-xs text-muted-foreground">{s.comments}</p>
                  </div>
                  <StatusBadge status={s.status} />
                </div>
              ))}
            </CardContent>
          </Card>

          {costVariance && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm">Estimated vs. Current Cost &amp; Margin</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Estimated Cost / Piece</p>
                    <p className="text-base font-semibold">
                      <MoneyDisplay amount={costVariance.estimatedCostPerPiece} currency={costVariance.currency} />
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Current Cost / Piece</p>
                    <p className="text-base font-semibold">
                      <MoneyDisplay amount={costVariance.currentCostPerPiece} currency={costVariance.currency} />
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Variance</p>
                    <p className={`text-base font-semibold ${costVariance.costPerPieceVariance > 0 ? "text-red-600" : "text-emerald-600"}`}>
                      {costVariance.costPerPieceVariance > 0 ? "+" : ""}
                      <MoneyDisplay amount={costVariance.costPerPieceVariance} currency={costVariance.currency} />
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Original → Current Margin</p>
                    <p className="text-base font-semibold">
                      <PercentageDisplay value={costVariance.originalMarginPercent} digits={1} /> →{" "}
                      <PercentageDisplay value={costVariance.currentProjectedMarginPercent} digits={1} />
                    </p>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Estimated</TableHead>
                      <TableHead className="text-right">Current</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {costVariance.breakdown.map((row) => (
                      <TableRow key={row.category}>
                        <TableCell className="font-medium capitalize">{row.category}</TableCell>
                        <TableCell className="text-right">
                          {row.category === "rework" && !costVariance.hasReworkData ? (
                            <span className="text-muted-foreground">No data</span>
                          ) : (
                            <MoneyDisplay amount={row.estimated} currency={costVariance.currency} />
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {row.category === "rework" && !costVariance.hasReworkData ? (
                            <span className="text-muted-foreground">No data</span>
                          ) : (
                            <MoneyDisplay amount={row.current} currency={costVariance.currency} />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="production">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Production Progress</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Stage</TableHead>
                    <TableHead className="text-right">Completed</TableHead>
                    <TableHead className="text-right">Rejected</TableHead>
                    <TableHead className="text-right">Reworked</TableHead>
                    <TableHead className="text-right">Daily Avg.</TableHead>
                    <TableHead className="text-right">Progress</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productionProgress.map((p) => (
                    <TableRow key={p.stage}>
                      <TableCell className="font-medium capitalize">{p.stage.replace(/_/g, " ")}</TableCell>
                      <TableCell className="text-right tabular-nums">{p.completedQty.toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-right tabular-nums">{p.rejectedQty.toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-right tabular-nums">{p.reworkedQty.toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-right tabular-nums">{Math.round(p.dailyAverage).toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-right">
                        <PercentageDisplay value={p.percent} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materials">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Materials</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead className="text-right">Required</TableHead>
                    <TableHead className="text-right">Received</TableHead>
                    <TableHead className="text-right">Available</TableHead>
                    <TableHead className="text-right">Shortage</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materials.map((m) => {
                    const a = calculateMaterialAvailability(m);
                    return (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.description}</TableCell>
                        <TableCell className="text-right tabular-nums">{m.requiredQty.toLocaleString("en-IN")}</TableCell>
                        <TableCell className="text-right tabular-nums">{m.receivedQty.toLocaleString("en-IN")}</TableCell>
                        <TableCell className="text-right tabular-nums">{a.availableQty.toLocaleString("en-IN")}</TableCell>
                        <TableCell className="text-right tabular-nums">{a.shortage.toLocaleString("en-IN")}</TableCell>
                        <TableCell>
                          <StatusBadge status={a.status} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {materials.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                        No materials sourced for this order yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quality Inspections</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Inspected</TableHead>
                    <TableHead className="text-right">Defects (m/M/c)</TableHead>
                    <TableHead>Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inspections.map((q) => (
                    <TableRow key={q.id}>
                      <TableCell className="font-medium capitalize">{q.inspectionType.replace(/_/g, " ")}</TableCell>
                      <TableCell>
                        <DateDisplay value={q.date} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{q.quantityInspected.toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {q.minorDefects}/{q.majorDefects}/{q.criticalDefects}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={q.result} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {inspections.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                        No inspections recorded yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="issues" className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm">Open Issues</CardTitle>
              {thisFactory && (
                <IssueForm
                  orders={thisOrderOnly.length > 0 ? thisOrderOnly : [{ id: order.id, orderNo: order.orderNo, factoryId: order.factoryId }]}
                  factories={[{ id: thisFactory.id, name: thisFactory.name }]}
                  owners={owners}
                />
              )}
            </CardHeader>
            <CardContent className="space-y-2">
              {issues.length === 0 && <p className="text-sm text-muted-foreground">No issues reported for this order.</p>}
              {issues.map((issue) => (
                <Link
                  key={issue.id}
                  href={`/production/issues/${issue.id}`}
                  className="block rounded-md border border-border p-2.5 text-sm transition-colors hover:bg-accent/40"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{PRODUCTION_ISSUE_TYPE_LABELS[issue.issueType]}</span>
                    <div className="flex items-center gap-1.5">
                      <RiskBadge level={issue.severity} />
                      <StatusBadge status={issue.status} />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {PRODUCTION_STAGE_LABELS[issue.stage]} · {issue.ownerName}
                  </p>
                  <p className="mt-1 text-xs text-foreground">{issue.description}</p>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm">Change Requests</CardTitle>
              <ChangeRequestForm orderId={order.id} />
            </CardHeader>
            <CardContent className="space-y-2">
              {changeRequests.length === 0 && <p className="text-sm text-muted-foreground">No change requests logged for this order.</p>}
              {changeRequests.map((cr) => (
                <div key={cr.id} className="rounded-md border border-border p-2.5 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{CHANGE_REQUEST_FIELD_LABELS[cr.field]}</span>
                    <StatusBadge status={cr.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <span className="line-through">{cr.oldValue}</span> → <span className="font-medium text-foreground">{cr.newValue}</span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Requested by {cr.requestedBy} — {cr.reason}
                  </p>
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <StatusBadge status={cr.implementationStatus} label={`Implementation: ${cr.implementationStatus.replace("_", " ")}`} />
                    {cr.status === "pending" && <ChangeRequestDecision changeRequestId={cr.id} status="pending" />}
                    {cr.status === "approved" && cr.implementationStatus === "pending" && (
                      <ChangeRequestDecision changeRequestId={cr.id} status="approved" />
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Time & Action Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <MilestoneTimeline milestones={milestones} />
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-sm">Milestone Dependency Impact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {milestoneImpacts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No delays currently affecting the schedule.</p>
              ) : (
                milestoneImpacts.map((impact) => (
                  <div key={impact.milestoneKey} className="rounded-md border border-amber-200 bg-amber-50 p-2.5 text-sm dark:border-amber-900 dark:bg-amber-950/30">
                    {impact.message}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Payments</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                    <TableHead>Due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => {
                    const financials = calculateOutstandingPayment(inv, []);
                    return (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium">{inv.invoiceNo}</TableCell>
                        <TableCell>
                          <StatusBadge status={inv.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <MoneyDisplay amount={inv.amount} currency={inv.currency} />
                        </TableCell>
                        <TableCell className="text-right">
                          <MoneyDisplay amount={financials.outstandingAmount} currency={inv.currency} />
                        </TableCell>
                        <TableCell>
                          <DateDisplay value={inv.dueDate} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {invoices.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                        No invoices raised for this order yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <DocumentList items={documents} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityTimeline items={activity} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
