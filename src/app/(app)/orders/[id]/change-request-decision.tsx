"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { decideChangeRequest, markChangeRequestImplemented } from "./actions";
import { Check, X, ClipboardCheck } from "lucide-react";

export function ChangeRequestDecision({ changeRequestId, status }: { changeRequestId: string; status: "pending" | "approved" }) {
  const [isPending, startTransition] = useTransition();

  function decide(decision: "approved" | "rejected") {
    startTransition(async () => {
      const result = await decideChangeRequest({ changeRequestId, decision });
      if (result.success) toast.success(`Change request ${decision}`);
      else toast.error(result.error);
    });
  }

  function implement() {
    startTransition(async () => {
      const result = await markChangeRequestImplemented(changeRequestId);
      if (result.success) toast.success("Marked as implemented");
      else toast.error(result.error);
    });
  }

  if (status === "pending") {
    return (
      <div className="flex gap-1.5">
        <Button size="sm" variant="secondary" disabled={isPending} onClick={() => decide("rejected")}>
          <X className="h-3.5 w-3.5" /> Reject
        </Button>
        <Button size="sm" disabled={isPending} onClick={() => decide("approved")}>
          <Check className="h-3.5 w-3.5" /> Approve
        </Button>
      </div>
    );
  }

  return (
    <Button size="sm" variant="secondary" disabled={isPending} onClick={implement}>
      <ClipboardCheck className="h-3.5 w-3.5" /> Mark Implemented
    </Button>
  );
}
