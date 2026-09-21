import "server-only";
import * as seed from "@/lib/seed";

function enrichChangeRequest(cr: (typeof seed.orderChangeRequests)[number]) {
  return {
    ...cr,
    orderNo: seed.orders.find((o) => o.id === cr.orderId)?.orderNo ?? cr.orderId,
    approvedByName: cr.approvedBy ? seed.profiles.find((p) => p.id === cr.approvedBy)?.fullName ?? cr.approvedBy : undefined,
  };
}

export async function getChangeRequestsForOrder(orderId: string) {
  return seed.orderChangeRequests
    .filter((cr) => cr.orderId === orderId)
    .map(enrichChangeRequest)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getChangeRequestById(id: string) {
  const cr = seed.orderChangeRequests.find((c) => c.id === id);
  return cr ? enrichChangeRequest(cr) : undefined;
}

export async function listPendingChangeRequests() {
  return seed.orderChangeRequests.filter((cr) => cr.status === "pending").map(enrichChangeRequest);
}
