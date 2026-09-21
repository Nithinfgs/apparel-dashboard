import type { OrderMilestone, MilestoneStatus } from "@/types";
import { differenceInCalendarDays, parseISO } from "date-fns";

export interface MilestoneVariance {
  varianceDays: number;
  status: MilestoneStatus;
}

/** See BUSINESS_RULES.md §6. */
export function calculateMilestoneVariance(
  milestone: OrderMilestone,
  today: Date = new Date()
): MilestoneVariance {
  const planned = parseISO(milestone.plannedDate);

  if (milestone.actualDate) {
    const actual = parseISO(milestone.actualDate);
    return { varianceDays: differenceInCalendarDays(actual, planned), status: "done" };
  }

  const daysPastPlanned = differenceInCalendarDays(today, planned);
  if (daysPastPlanned > 0) {
    return { varianceDays: daysPastPlanned, status: "delayed" };
  }
  return { varianceDays: 0, status: milestone.status === "in_progress" ? "in_progress" : "pending" };
}
