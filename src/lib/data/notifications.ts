import "server-only";
import * as seed from "@/lib/seed";

export async function listNotifications(recipientId?: string) {
  let items = [...seed.notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (recipientId) items = items.filter((n) => n.recipientId === recipientId);
  return items;
}

export async function getUnreadCount(recipientId?: string) {
  const items = await listNotifications(recipientId);
  return items.filter((n) => !n.read).length;
}

export async function listActivity(limit = 20) {
  return [...seed.activityLogs]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
    .map((a) => ({ ...a, actorName: seed.profiles.find((p) => p.id === a.actorId)?.fullName ?? "System" }));
}

export async function listDocumentsForEntity(entityType: string, entityId: string) {
  return seed.documents.filter((d) => d.entityType === entityType && d.entityId === entityId);
}

export async function markNotificationRead(id: string) {
  const notification = seed.notifications.find((n) => n.id === id);
  if (notification) {
    notification.read = true;
  }
  return notification;
}

export async function markAllNotificationsRead(recipientId?: string) {
  for (const n of seed.notifications) {
    if (!recipientId || n.recipientId === recipientId) {
      n.read = true;
    }
  }
  return true;
}

