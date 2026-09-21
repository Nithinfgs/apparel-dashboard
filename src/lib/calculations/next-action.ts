import type { OrderMilestone } from "@/types";
import { MILESTONE_SEQUENCE, MILESTONE_LABELS } from "@/lib/constants";

export interface NextAction {
  action: string;
  ownerId: string;
  dueDate: string;
}

/**
 * Derives "what happens next" for an order from its own Time & Action
 * milestones — never a separately-tracked field, so it can never drift from
 * the milestone data shown elsewhere on Order 360. Reuses MILESTONE_SEQUENCE
 * (BUSINESS_RULES.md §15) to find the first milestone that isn't `done`,
 * in canonical order rather than array order.
 */
export function calculateNextAction(milestones: OrderMilestone[]): NextAction | undefined {
  const byKey = new Map(milestones.map((m) => [m.milestoneKey, m]));

  for (const key of MILESTONE_SEQUENCE) {
    const milestone = byKey.get(key);
    if (milestone && milestone.status !== "done") {
      return {
        action: MILESTONE_LABELS[key],
        ownerId: milestone.ownerId,
        dueDate: milestone.plannedDate,
      };
    }
  }

  return undefined;
}
