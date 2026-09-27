import { PageHeader } from "@/components/shared";
import { AskPanel } from "./ask-panel";

export default function AskTexcroftPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader
        title="AI Operations Assistant"
        description="Deterministic answers computed from live application data."
      />
      <AskPanel />
    </div>
  );
}
