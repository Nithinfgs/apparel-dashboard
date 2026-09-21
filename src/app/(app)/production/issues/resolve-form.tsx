"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { resolveProductionIssue } from "./actions";
import { CheckCircle2 } from "lucide-react";

export function ResolveForm({ issueId }: { issueId: string }) {
  const [resolution, setResolution] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await resolveProductionIssue({ issueId, resolution });
      if (result.success) {
        toast.success("Issue marked as resolved");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label>Resolution</Label>
        <Textarea value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="How was this resolved?" required />
      </div>
      <Button type="submit" disabled={!resolution || isPending} size="sm">
        <CheckCircle2 className="h-3.5 w-3.5" /> Mark Resolved
      </Button>
    </form>
  );
}
