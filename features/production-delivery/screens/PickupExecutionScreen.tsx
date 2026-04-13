import React from "react";
import WorkflowTimeline from "../components/WorkflowTimeline";
import PhotoEvidenceField from "../components/PhotoEvidenceField";

export default function PickupExecutionScreen() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-black text-[#0d2c54]">Pickup Execution</h1>
        <p className="mt-2 text-sm text-slate-500">Pickup chain-of-custody workflow scaffold.</p>
      </div>
      <WorkflowTimeline
        steps={[
          { key: "assigned", label: "Pickup assigned", status: "done" },
          { key: "onsite", label: "Agent on site", status: "current" },
          { key: "handover", label: "Chain of custody handover", status: "pending" },
        ]}
      />
      <PhotoEvidenceField label="Pickup Handover Evidence" />
    </div>
  );
}
