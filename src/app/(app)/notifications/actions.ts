"use server";

import { revalidatePath } from "next/cache";
import { markNotificationRead, markAllNotificationsRead } from "@/lib/data/notifications";
import { getCurrentUser } from "@/lib/auth/session";

export async function markNotificationReadAction(id: string) {
  await markNotificationRead(id);
  revalidatePath("/notifications");
  revalidatePath("/", "layout");
}

export async function markAllNotificationsReadAction() {
  const user = await getCurrentUser();
  await markAllNotificationsRead(user.id);
  revalidatePath("/notifications");
  revalidatePath("/", "layout");
}
