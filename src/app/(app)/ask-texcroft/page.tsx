import { PageHeader } from "@/components/shared";
import { AskPanel } from "./ask-panel";

export default function AskTexcroftPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader
        title="Ask Texcroft"
        description="Deterministic answers computed from live application data — not a general-purpose AI."
      />
      <AskPanel />
    </div>
  );
}
