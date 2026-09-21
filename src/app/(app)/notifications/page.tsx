import { getCurrentUser } from "@/lib/auth/session";
import { listNotifications } from "@/lib/data";
import { NotificationsView } from "./notifications-view";

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  const notifications = await listNotifications(user.id);

  return <NotificationsView notifications={notifications} />;
}
