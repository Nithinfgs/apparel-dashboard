import { z } from "zod";

export const changeRequestSchema = z.object({
  orderId: z.string().min(1),
  field: z.enum(["quantity", "colour", "measurements", "artwork", "trims", "packaging", "delivery_date"]),
  oldValue: z.string().min(1, "Record the current value"),
  newValue: z.string().min(1, "Record the requested value"),
  requestedBy: z.string().min(1, "Who requested this change?"),
  reason: z.string().min(3, "Briefly explain why"),
});

export type ChangeRequestInput = z.infer<typeof changeRequestSchema>;

export const changeRequestDecisionSchema = z.object({
  changeRequestId: z.string().min(1),
  decision: z.enum(["approved", "rejected"]),
});

export type ChangeRequestDecisionInput = z.infer<typeof changeRequestDecisionSchema>;
