"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PRODUCTION_STAGES, PRODUCTION_STAGE_LABELS } from "@/lib/constants";
import { recordProductionEntry } from "./actions";
import type { ProductionStage } from "@/types";

interface FactoryOption {
  id: string;
  name: string;
}
interface OrderOption {
  id: string;
  orderNo: string;
  factoryId: string;
}

export function DailyProductionForm({ factories, orders }: { factories: FactoryOption[]; orders: OrderOption[] }) {
  const [factoryId, setFactoryId] = useState("");
  const [orderId, setOrderId] = useState("");
  const [stage, setStage] = useState<ProductionStage>("stitching");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [producedQty, setProducedQty] = useState("");
  const [rejectedQty, setRejectedQty] = useState("0");
  const [reworkedQty, setReworkedQty] = useState("0");
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  const ordersForFactory = orders.filter((o) => o.factoryId === factoryId);

  function resetForm() {
    setOrderId("");
    setProducedQty("");
    setRejectedQty("0");
    setReworkedQty("0");
    setNotes("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await recordProductionEntry({
        factoryId,
        orderId,
        stage,
        date,
        producedQty: Number(producedQty),
        rejectedQty: Number(rejectedQty),
        reworkedQty: Number(reworkedQty),
        notes: notes || undefined,
      });
      if (result.success) {
        toast.success("Production entry recorded");
        resetForm();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-5">
      <div className="space-y-1.5">
        <Label>Factory</Label>
        <Select value={factoryId} onValueChange={(v) => { setFactoryId(v); setOrderId(""); }}>
          <SelectTrigger className="h-12 w-full text-base">
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

      <div className="space-y-1.5">
        <Label>Order</Label>
        <Select value={orderId} onValueChange={setOrderId} disabled={!factoryId}>
          <SelectTrigger className="h-12 w-full text-base">
            <SelectValue placeholder={factoryId ? "Select order" : "Select a factory first"} />
          </SelectTrigger>
          <SelectContent>
            {ordersForFactory.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.orderNo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Stage</Label>
          <Select value={stage} onValueChange={(v) => setStage(v as ProductionStage)}>
            <SelectTrigger className="h-12 w-full text-base">
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
          <Label>Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-12 text-base" required />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Produced Today</Label>
        <Input
          type="number"
          inputMode="numeric"
          min={1}
          value={producedQty}
          onChange={(e) => setProducedQty(e.target.value)}
          className="h-14 text-lg font-semibold"
          placeholder="0"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Rejected</Label>
          <Input type="number" inputMode="numeric" min={0} value={rejectedQty} onChange={(e) => setRejectedQty(e.target.value)} className="h-12 text-base" />
        </div>
        <div className="space-y-1.5">
          <Label>Reworked</Label>
          <Input type="number" inputMode="numeric" min={0} value={reworkedQty} onChange={(e) => setReworkedQty(e.target.value)} className="h-12 text-base" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Notes (optional)</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any observations from the floor…" />
      </div>

      <Button type="submit" className="h-12 w-full text-base" disabled={!factoryId || !orderId || !producedQty || isPending}>
        {isPending ? "Submitting…" : "Submit Update"}
      </Button>
    </form>
  );
}
