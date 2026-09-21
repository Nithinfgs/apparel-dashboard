import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { listNotifications } from "@/lib/data";
import { formatRelative, notificationHref } from "@/lib/utils/format";
import type { Profile } from "@/types";
import { StatusBadge } from "@/components/shared";

export async function NotificationBell({ user }: { user: Profile }) {
  const notifications = await listNotifications(user.id);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-semibold text-white">
              {unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b border-border px-3 py-2 text-sm font-semibold">Notifications</div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 && <p className="p-4 text-center text-xs text-muted-foreground">You&apos;re all caught up.</p>}
          {notifications.slice(0, 8).map((n) => (
            <Link
              key={n.id}
              href={notificationHref(n.entityType, n.entityId)}
              className="block border-b border-border/60 px-3 py-2.5 text-sm last:border-b-0 hover:bg-accent/60"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-foreground">{n.title}</p>
                {!n.read && <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />}
              </div>
              <p className="text-xs text-muted-foreground">{n.message}</p>
              <div className="mt-1 flex items-center gap-2">
                <StatusBadge status={n.type} />
                <span className="text-[11px] text-muted-foreground">{formatRelative(n.createdAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
