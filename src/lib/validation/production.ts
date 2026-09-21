import { z } from "zod";

export const productionEntrySchema = z.object({
  factoryId: z.string().min(1, "Select a factory"),
  orderId: z.string().min(1, "Select an order"),
  stage: z.enum(["fabric_ready", "cutting", "printing_embroidery", "stitching", "washing", "finishing", "qc", "packing"]),
  date: z.string().min(1, "Select a date"),
  producedQty: z.coerce.number().int().min(1, "Must produce at least 1 piece"),
  rejectedQty: z.coerce.number().int().min(0).default(0),
  reworkedQty: z.coerce.number().int().min(0).default(0),
  workersCount: z.coerce.number().int().min(0).optional(),
  notes: z.string().optional(),
});

export type ProductionEntryInput = z.infer<typeof productionEntrySchema>;
