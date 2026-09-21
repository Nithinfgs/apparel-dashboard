import { notFound } from "next/navigation";
import Link from "next/link";
import { getBuyerById, getBuyerContacts, getOrdersByBuyer, getBuyerInvoices } from "@/lib/data";
import { PageHeader, MetricCard, DetailRow, StatusBadge, MoneyDisplay, PercentageDisplay, DateDisplay } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function BuyerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const buyer = await getBuyerById(id);
  if (!buyer) notFound();

  const [contacts, orders, invoices] = await Promise.all([getBuyerContacts(id), getOrdersByBuyer(id), getBuyerInvoices(id)]);

  return (
    <div className="space-y-5">
      <PageHeader
        title={buyer.companyName}
        crumbs={[{ label: "Buyers", href: "/buyers" }, { label: buyer.companyName }]}
        description={`${buyer.country} · ${buyer.currency}`}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <MetricCard label="Lifetime Value" value={<MoneyDisplay amount={buyer.kpis.lifetimeOrderValue} currency="INR" compact />} />
        <MetricCard label="Active Orders" value={buyer.kpis.activeOrders} />
        <MetricCard label="Completed Orders" value={buyer.kpis.completedOrders} />
        <MetricCard label="Avg. Order Size" value={<MoneyDisplay amount={buyer.kpis.averageOrderSize} currency="INR" compact />} />
        <MetricCard label="On-Time Delivery" value={<PercentageDisplay value={buyer.kpis.onTimeDeliveryPercent} />} />
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Buyer Details</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailRow label="Contact" value={buyer.contactName} />
              <DetailRow label="Email" value={buyer.email} />
              <DetailRow label="Phone" value={buyer.phone} />
              <DetailRow label="Shipping Location" value={buyer.shippingLocation} />
              <DetailRow label="Payment Terms" value={buyer.paymentTerms} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Style</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Dispatch</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-medium">
                        <Link href={`/orders/${o.id}`} className="hover:underline">
                          {o.orderNo}
                        </Link>
                      </TableCell>
                      <TableCell>{o.styleName}</TableCell>
                      <TableCell className="text-right tabular-nums">{o.quantity.toLocaleString("en-IN")}</TableCell>
                      <TableCell>
                        <StatusBadge status={o.stage} />
                      </TableCell>
                      <TableCell>
                        <DateDisplay value={o.expectedDispatchDate} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts">
          <Card>
            <CardContent className="space-y-3 py-4">
              {contacts.map((c) => (
                <div key={c.id} className="rounded-md border border-border p-3 text-sm">
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.roleTitle}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.email} · {c.phone}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">{inv.invoiceNo}</TableCell>
                      <TableCell className="text-right">
                        <MoneyDisplay amount={inv.amount} currency={inv.currency} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={inv.status} />
                      </TableCell>
                      <TableCell>
                        <DateDisplay value={inv.dueDate} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
