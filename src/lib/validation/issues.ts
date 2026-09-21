import { z } from "zod";

export const productionIssueSchema = z.object({
  orderId: z.string().min(1, "Select an order"),
  factoryId: z.string().min(1, "Select a factory"),
  stage: z.enum(["fabric_ready", "cutting", "printing_embroidery", "stitching", "washing", "finishing", "qc", "packing"]),
  issueType: z.enum([
    "material_shortage",
    "machine_breakdown",
    "quality_defect",
    "labour_shortage",
    "fabric_defect",
    "power_outage",
    "logistics_delay",
    "other",
  ]),
  description: z.string().min(5, "Describe the issue in a few words"),
  severity: z.enum(["low", "medium", "high", "critical"]),
  ownerId: z.string().min(1, "Assign an owner"),
});

export type ProductionIssueInput = z.infer<typeof productionIssueSchema>;

export const resolveIssueSchema = z.object({
  issueId: z.string().min(1),
  resolution: z.string().min(3, "Describe how this was resolved"),
});

export type ResolveIssueInput = z.infer<typeof resolveIssueSchema>;
