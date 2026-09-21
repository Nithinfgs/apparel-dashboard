import type { AppDocument, AppNotification, ActivityLog } from "@/types";
import { orders } from "./orders";
import { qualityInspections, dispatches } from "./operations";
import { samples } from "./orders";
import { addDaysIso } from "./rng";

export const documents: AppDocument[] = [];

const flagship = orders.find((o) => o.id === "order-014")!;

documents.push(
  {
    id: "doc-flagship-pp",
    entityType: "order",
    entityId: flagship.id,
    name: "Approved PP Sample.pdf",
    fileUrl: "#",
    mimeType: "application/pdf",
    uploadedBy: "user-mrc-1",
    uploadedAt: addDaysIso(flagship.createdAt, 3),
  },
  {
    id: "doc-flagship-confirmation",
    entityType: "order",
    entityId: flagship.id,
    name: "Order Confirmation.pdf",
    fileUrl: "#",
    mimeType: "application/pdf",
    uploadedBy: "user-mrc-1",
    uploadedAt: flagship.createdAt,
  },
  {
    id: "doc-flagship-production-update",
    entityType: "order",
    entityId: flagship.id,
    name: "Production Update — Week 5.pdf",
    fileUrl: "#",
    mimeType: "application/pdf",
    uploadedBy: "user-factory",
    uploadedAt: addDaysIso(flagship.createdAt, 30),
  }
);

orders
  .filter((o) => o.id !== flagship.id)
  .slice(0, 12)
  .forEach((o, i) => {
    documents.push({
      id: `doc-${o.id}`,
      entityType: "order",
      entityId: o.id,
      name: i % 2 === 0 ? "Order Confirmation.pdf" : "Tech Pack.pdf",
      fileUrl: "#",
      mimeType: "application/pdf",
      uploadedBy: "user-mrc-2",
      uploadedAt: o.createdAt,
    });
  });

// ---------- Notifications (event-driven — see BUSINESS_RULES.md §13) ----------

export const notifications: AppNotification[] = [];
let notifCounter = 1;

const atRiskFlagship: AppNotification = {
  id: `notification-${notifCounter++}`,
  recipientId: "user-mrc-1",
  type: "risk",
  title: "Order behind schedule",
  message: `${flagship.orderNo} is behind production plan — stitching is 8% behind planned completion.`,
  entityType: "order",
  entityId: flagship.id,
  read: false,
  createdAt: addDaysIso(flagship.createdAt, 33),
};
notifications.push(atRiskFlagship);

qualityInspections
  .filter((q) => q.result === "fail")
  .forEach((q) => {
    notifications.push({
      id: `notification-${notifCounter++}`,
      recipientId: "user-prod",
      type: "quality",
      title: "Final QC failed",
      message: `Final QC failed for order ${orders.find((o) => o.id === q.orderId)?.orderNo ?? q.orderId}.`,
      entityType: "quality_inspection",
      entityId: q.id,
      read: false,
      createdAt: q.date,
    });
  });

dispatches
  .filter((d) => d.status === "delivered")
  .slice(0, 3)
  .forEach((d) => {
    notifications.push({
      id: `notification-${notifCounter++}`,
      recipientId: "user-mrc-2",
      type: "dispatch",
      title: "Dispatch completed",
      message: `Dispatch completed for order ${orders.find((o) => o.id === d.orderId)?.orderNo ?? d.orderId}.`,
      entityType: "dispatch",
      entityId: d.id,
      read: true,
      createdAt: d.actualDate ?? d.plannedDate,
    });
  });

samples
  .filter((s) => s.status === "approved")
  .slice(0, 3)
  .forEach((s) => {
    notifications.push({
      id: `notification-${notifCounter++}`,
      recipientId: "user-mrc-1",
      type: "sample",
      title: "PP Sample approved",
      message: `PP sample approved by buyer for order ${orders.find((o) => o.id === s.orderId)?.orderNo ?? s.orderId}.`,
      entityType: "sample",
      entityId: s.id,
      read: true,
      createdAt: s.buyerResponseDate ?? s.createdAt,
    });
  });

// ---------- Activity log ----------

export const activityLogs: ActivityLog[] = [
  {
    id: "activity-1",
    actorId: "user-mrc-1",
    action: `approved PP sample for ${flagship.orderNo}`,
    entityType: "sample",
    entityId: `sample-${flagship.id}-pp`,
    createdAt: addDaysIso(flagship.createdAt, 3),
  },
  {
    id: "activity-2",
    actorId: "user-factory",
    action: `added 384 pcs stitching production for ${flagship.orderNo}`,
    entityType: "order",
    entityId: flagship.id,
    createdAt: addDaysIso(flagship.createdAt, 24),
  },
  {
    id: "activity-3",
    actorId: "user-qc",
    action: "completed Final QC inspection",
    entityType: "quality_inspection",
    entityId: qualityInspections[0]?.id ?? "qc-order-021-1",
    createdAt: qualityInspections[0]?.date ?? addDaysIso(flagship.createdAt, 40),
  },
  {
    id: "activity-4",
    actorId: "user-fin",
    action: "recorded advance payment",
    entityType: "invoice",
    entityId: `invoice-${flagship.id}-advance`,
    createdAt: addDaysIso(flagship.createdAt, 10),
  },
  {
    id: "activity-5",
    actorId: "user-mrc-1",
    action: `updated dispatch date for ${flagship.orderNo}`,
    entityType: "order",
    entityId: flagship.id,
    createdAt: addDaysIso(flagship.createdAt, 2),
  },
];
