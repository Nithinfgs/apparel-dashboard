"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Check, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader, StatusBadge, EmptyState } from "@/components/shared";
import { formatRelative, notificationHref } from "@/lib/utils/format";
import type { AppNotification } from "@/types";
import { markNotificationReadAction, markAllNotificationsReadAction } from "./actions";

interface NotificationsViewProps {
  notifications: AppNotification[];
}

export function NotificationsView({ notifications }: NotificationsViewProps) {
  const [isPending, startTransition] = useTransition();
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    startTransition(async () => {
      try {
        await markAllNotificationsReadAction();
        toast.success("All notifications marked as read");
      } catch {
        toast.error("Failed to update notifications");
      }
    });
  };

  const handleMarkRead = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      try {
        await markNotificationReadAction(id);
        toast.success("Notification marked as read");
      } catch {
        toast.error("Failed to update notification");
      }
    });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Notifications"
        description={`${unreadCount} unread of ${notifications.length}.`}
        actions={
          unreadCount > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={isPending}
              className="gap-1.5"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all as read
            </Button>
          ) : undefined
        }
      />

      {notifications.length === 0 ? (
        <EmptyState title="No notifications" description="You're all caught up." />
      ) : (
        <Card>
          <CardContent className="divide-y divide-border p-0">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-center justify-between gap-3 px-4 py-3 text-sm transition-colors hover:bg-accent/40 ${
                  !n.read ? "bg-primary/[0.02]" : ""
                }`}
              >
                <Link
                  href={notificationHref(n.entityType, n.entityId)}
                  className="min-w-0 flex-1 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <p className={`font-medium ${!n.read ? "text-foreground font-semibold" : "text-foreground"}`}>
                      {n.title}
                    </p>
                    {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{n.message}</p>
                </Link>

                <div className="flex shrink-0 items-center gap-3">
                  <StatusBadge status={n.type} />
                  <span className="text-xs text-muted-foreground">{formatRelative(n.createdAt)}</span>
                  {!n.read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      title="Mark as read"
                      onClick={(e) => handleMarkRead(e, n.id)}
                      disabled={isPending}
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span className="sr-only">Mark as read</span>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
