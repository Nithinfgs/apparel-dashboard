import "server-only";
import * as seed from "@/lib/seed";

function enrichIssue(issue: (typeof seed.productionIssues)[number]) {
  return {
    ...issue,
    orderNo: seed.orders.find((o) => o.id === issue.orderId)?.orderNo ?? issue.orderId,
    factoryName: seed.factories.find((f) => f.id === issue.factoryId)?.name ?? "Unknown",
    ownerName: seed.profiles.find((p) => p.id === issue.ownerId)?.fullName ?? "Unassigned",
    reportedByName: seed.profiles.find((p) => p.id === issue.reportedBy)?.fullName ?? issue.reportedBy,
  };
}

export interface ProductionIssueFilters {
  status?: string;
  severity?: string;
  factoryId?: string;
}

export async function listProductionIssues(filters: ProductionIssueFilters = {}) {
  let items = seed.productionIssues.map(enrichIssue);
  if (filters.status) items = items.filter((i) => i.status === filters.status);
  if (filters.severity) items = items.filter((i) => i.severity === filters.severity);
  if (filters.factoryId) items = items.filter((i) => i.factoryId === filters.factoryId);
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getProductionIssueById(id: string) {
  const issue = seed.productionIssues.find((i) => i.id === id);
  return issue ? enrichIssue(issue) : undefined;
}

export async function getIssuesForOrder(orderId: string) {
  return seed.productionIssues.filter((i) => i.orderId === orderId).map(enrichIssue);
}

export async function getIssuesForFactory(factoryId: string) {
  return seed.productionIssues.filter((i) => i.factoryId === factoryId).map(enrichIssue);
}

export async function getOpenIssueCount() {
  return seed.productionIssues.filter((i) => i.status === "open" || i.status === "in_progress").length;
}
