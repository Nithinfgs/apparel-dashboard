import { FileText, Download } from "lucide-react";
import { formatDate } from "@/lib/utils/format";
import { EmptyState } from "./empty-error-state";
import { Button } from "@/components/ui/button";

export interface DocumentItem {
  id: string;
  name: string;
  uploadedAt: string;
  version?: number;
}

export function DocumentList({ items }: { items: DocumentItem[] }) {
  if (items.length === 0) return <EmptyState title="No documents" description="Files attached to this record will appear here." />;

  return (
    <ul className="divide-y divide-border/70">
      {items.map((doc) => (
        <li key={doc.id} className="flex items-center justify-between gap-3 py-2.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {doc.name}
                {doc.version && <span className="ml-1.5 text-xs text-muted-foreground">v{doc.version}</span>}
              </p>
              <p className="text-xs text-muted-foreground">{formatDate(doc.uploadedAt)}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="shrink-0">
            <Download className="h-4 w-4" />
          </Button>
        </li>
      ))}
    </ul>
  );
}
