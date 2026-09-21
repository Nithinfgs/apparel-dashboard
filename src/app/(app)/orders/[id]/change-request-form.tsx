"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { CHANGE_REQUEST_FIELD_LABELS } from "@/lib/constants";
import { createChangeRequest } from "./actions";
import type { ChangeRequestField } from "@/types";
import { Plus } from "lucide-react";

const FIELDS = Object.keys(CHANGE_REQUEST_FIELD_LABELS) as ChangeRequestField[];

export function ChangeRequestForm({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false);
  const [field, setField] = useState<ChangeRequestField>("quantity");
  const [oldValue, setOldValue] = useState("");
  const [newValue, setNewValue] = useState("");
  const [requestedBy, setRequestedBy] = useState("");
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  function resetForm() {
    setOldValue("");
    setNewValue("");
    setRequestedBy("");
    setReason("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await createChangeRequest({ orderId, field, oldValue, newValue, requestedBy, reason });
      if (result.success) {
        toast.success("Change request logged");
        resetForm();
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" variant="secondary">
          <Plus className="h-3.5 w-3.5" /> Log Change Request
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Log an Order Change Request</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
          <div className="space-y-1.5">
            <Label>What changed?</Label>
            <Select value={field} onValueChange={(v) => setField(v as ChangeRequestField)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIELDS.map((f) => (
                  <SelectItem key={f} value={f}>
                    {CHANGE_REQUEST_FIELD_LABELS[f]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Old Value</Label>
              <Input value={oldValue} onChange={(e) => setOldValue(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>New Value</Label>
              <Input value={newValue} onChange={(e) => setNewValue(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Requested By</Label>
            <Input value={requestedBy} onChange={(e) => setRequestedBy(e.target.value)} placeholder="Buyer contact or internal team" required />
          </div>
          <div className="space-y-1.5">
            <Label>Reason</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why is this being requested?" required />
          </div>
          <SheetFooter className="px-0">
            <Button type="submit" disabled={!oldValue || !newValue || !requestedBy || !reason || isPending} className="w-full">
              {isPending ? "Saving…" : "Log Change Request"}
            </Button>
            <SheetClose asChild>
              <Button type="button" variant="secondary" className="w-full">
                Cancel
              </Button>
            </SheetClose>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
