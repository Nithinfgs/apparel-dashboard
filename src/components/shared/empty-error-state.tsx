import type { ReactNode } from "react";
import { Inbox, AlertTriangle } from "lucide-react";

export function EmptyState({
  title = "Nothing here yet",
  description,
  icon,
  action,
}: {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-14 text-center">
      <div className="text-muted-foreground">{icon ?? <Inbox className="h-8 w-8" />}</div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && <p className="max-w-sm text-xs text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description = "This page couldn't load its data. Try again in a moment.",
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-red-200 bg-red-50 py-14 text-center dark:border-red-900 dark:bg-red-950/30">
      <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
      <div className="space-y-1">
        <p className="text-sm font-medium text-red-700 dark:text-red-400">{title}</p>
        <p className="max-w-sm text-xs text-red-600/80 dark:text-red-400/70">{description}</p>
      </div>
      {action}
    </div>
  );
}
