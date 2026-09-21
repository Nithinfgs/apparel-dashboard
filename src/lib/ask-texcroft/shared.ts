export interface AskAnswer {
  summary: string;
  rows: { label: string; detail: string }[];
}

export const SAMPLE_QUESTIONS = [
  "Which orders are at risk?",
  "What is dispatching this week?",
  "Which factory has the highest workload?",
  "Which buyer owes us the most?",
  "Show QC failures this month.",
];
