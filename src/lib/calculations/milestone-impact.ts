import type { OrderMilestone, MilestoneKey } from "@/types";
import { MILESTONE_SEQUENCE, MILESTONE_LABELS } from "@/lib/constants";
import { calculateMilestoneVariance } from "./milestones";

export interface MilestoneImpact {
  milestoneKey: MilestoneKey;
  delayDays: number;
  message: string;
}

/**
 * Simple, deterministic dependency-impact messaging over the existing T&A
 * milestones — deliberately not a scheduling engine (brief item 6). For any
 * milestone that finished late, this names the very next milestone in
 * MILESTONE_SEQUENCE as "may start late" and carries the same day count
 * through to a "potential dispatch impact" line.
 *
 * Milestones that have not been reached yet (no actual date, status still
 * `pending`/`in_progress`) are only evaluated up to and including the
 * order's current bottleneck — the first one not yet done. Milestones
 * further downstream haven't started, so comparing their planned date
 * against "today" independently would report every one of them as
 * separately "late" purely because nobody has touched them yet, which is a
 * data-freshness artifact, not a real cascading dependency risk. Stopping at
 * the current bottleneck keeps the output to genuine, actionable cases. See
 * BUSINESS_RULES.md §15.
 */
export function calculateMilestoneImpacts(milestones: OrderMilestone[], today: Date = new Date()): MilestoneImpact[] {
  const byKey = new Map(milestones.map((m) => [m.milestoneKey, m]));
  const impacts: MilestoneImpact[] = [];

  for (let index = 0; index < MILESTONE_SEQUENCE.length; index++) {
    const key = MILESTONE_SEQUENCE[index];
    const milestone = byKey.get(key);
    if (!milestone) continue;

    const variance = calculateMilestoneVariance(milestone, today);
    const notYetReached = variance.status !== "done";

    if (variance.varianceDays > 0) {
      const isLast = index === MILESTONE_SEQUENCE.length - 1;
      const nextKey = MILESTONE_SEQUENCE[index + 1];

      const chain = [`${MILESTONE_LABELS[key]} ${variance.status === "done" ? "was" : "is"} ${variance.varianceDays} day(s) late`];
      if (!isLast && nextKey) chain.push(`${MILESTONE_LABELS[nextKey]} may start late`);
      if (!isLast) chain.push(`potential dispatch impact +${variance.varianceDays} day(s)`);

      impacts.push({ milestoneKey: key, delayDays: variance.varianceDays, message: chain.join(" → ") });
    }

    // Stop at the first not-yet-done milestone (the current bottleneck) —
    // everything after it hasn't started, so it isn't independently "late" yet.
    if (notYetReached) break;
  }

  return impacts;
}
