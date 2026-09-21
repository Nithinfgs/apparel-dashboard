import { UserAvatar } from "./user-avatar";
import { formatRelative } from "@/lib/utils/format";
import { EmptyState } from "./empty-error-state";

export interface ActivityItem {
  id: string;
  actorName: string;
  action: string;
  createdAt: string;
}

export function ActivityTimeline({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) return <EmptyState title="No activity yet" description="Actions on this record will show up here." />;

  return (
    <ol className="space-y-4">
      {items.map((item) => (
        <li key={item.id} className="flex gap-3">
          <UserAvatar name={item.actorName} className="h-7 w-7" />
          <div className="min-w-0 flex-1 border-b border-border/70 pb-4 text-sm last:border-b-0 last:pb-0">
            <p className="text-foreground">
              <span className="font-medium">{item.actorName}</span> {item.action}
            </p>
            <p className="text-xs text-muted-foreground">{formatRelative(item.createdAt)}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
