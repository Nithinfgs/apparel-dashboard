"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { PRODUCTION_STAGES, PRODUCTION_STAGE_LABELS, PRODUCTION_ISSUE_TYPE_LABELS } from "@/lib/constants";
import { createProductionIssue } from "./actions";
import type { ProductionStage, ProductionIssueType, RiskLevel } from "@/types";
import { AlertTriangle } from "lucide-react";

const ISSUE_TYPES = Object.keys(PRODUCTION_ISSUE_TYPE_LABELS) as ProductionIssueType[];
const SEVERITIES: RiskLevel[] = ["low", "medium", "high", "critical"];

interface OrderOption {
  id: string;
  orderNo: string;
  factoryId: string;
}
interface FactoryOption {
  id: string;
  name: string;
}
interface OwnerOption {
  id: string;
  fullName: string;
}

export function IssueForm({ orders, factories, owners }: { orders: OrderOption[]; factories: FactoryOption[]; owners: OwnerOption[] }) {
  const [open, setOpen] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [factoryId, setFactoryId] = useState("");
  const [stage, setStage] = useState<ProductionStage>("stitching");
  const [issueType, setIssueType] = useState<ProductionIssueType>("other");
  const [severity, setSeverity] = useState<RiskLevel>("medium");
  const [ownerId, setOwnerId] = useState("");
  const [description, setDescription] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleOrderChange(id: string) {
    setOrderId(id);
    const order = orders.find((o) => o.id === id);
    if (order) setFactoryId(order.factoryId);
  }

  function resetForm() {
    setOrderId("");
    setFactoryId("");
    setDescription("");
    setOwnerId("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await createProductionIssue({ orderId, factoryId, stage, issueType, severity, ownerId, description });
      if (result.success) {
        toast.success("Issue reported");
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
        <Button size="sm">
          <AlertTriangle className="h-3.5 w-3.5" /> Report Issue
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Report a Production Issue</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
          <div className="space-y-1.5">
            <Label>Order</Label>
            <Select value={orderId} onValueChange={handleOrderChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select order" />
              </SelectTrigger>
              <SelectContent>
                {orders.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.orderNo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Factory</Label>
            <Select value={factoryId} onValueChange={setFactoryId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select factory" />
              </SelectTrigger>
              <SelectContent>
                {factories.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Stage</Label>
              <Select value={stage} onValueChange={(v) => setStage(v as ProductionStage)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCTION_STAGES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {PRODUCTION_STAGE_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Issue Type</Label>
              <Select value={issueType} onValueChange={(v) => setIssueType(v as ProductionIssueType)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ISSUE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {PRODUCTION_ISSUE_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Severity</Label>
              <Select value={severity} onValueChange={(v) => setSeverity(v as RiskLevel)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITIES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Owner</Label>
              <Select value={ownerId} onValueChange={setOwnerId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Assign to" />
                </SelectTrigger>
                <SelectContent>
                  {owners.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What happened, and what's affected?" required />
          </div>

          <SheetFooter className="px-0">
            <Button type="submit" disabled={!orderId || !factoryId || !ownerId || !description || isPending} className="w-full">
              {isPending ? "Submitting…" : "Report Issue"}
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
