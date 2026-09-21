import { resolvePortalFactoryId } from "@/lib/auth/portal-context";
import { getFactoryById, listActiveProductionOrders } from "@/lib/data";
import { DailyProductionForm } from "@/app/(app)/production/daily/daily-form";

export default async function PartnerProductionPage() {
  const factoryId = await resolvePortalFactoryId();
  const [factory, allOrders] = await Promise.all([getFactoryById(factoryId), listActiveProductionOrders()]);
  const orders = allOrders.filter((o) => o.factoryId === factoryId);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Production Entry</h1>
        <p className="text-sm text-muted-foreground">{factory?.name}</p>
      </div>
      <DailyProductionForm factories={factory ? [{ id: factory.id, name: factory.name }] : []} orders={orders} />
    </div>
  );
}
