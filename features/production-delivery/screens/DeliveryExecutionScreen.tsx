import React, { useState } from "react";
import PhotoEvidenceField from "../components/PhotoEvidenceField";
import SignaturePad from "../components/SignaturePad";
import WorkflowTimeline from "../components/WorkflowTimeline";

export default function DeliveryExecutionScreen() {
  const [signature, setSignature] = useState("");

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-black text-[#0d2c54]">Delivery Proof / Exception Flow</h1>
        <p className="mt-2 text-sm text-slate-500">Electronic signature and exception evidence scaffold.</p>
      </div>
      <WorkflowTimeline
        steps={[
          { key: "arrival", label: "Arrived at destination", status: "done" },
          { key: "proof", label: "Collect proof of delivery", status: "current" },
          { key: "close", label: "Close delivery / raise exception", status: "pending" },
        ]}
      />
      <PhotoEvidenceField label="Delivery Evidence" />
      <SignaturePad onChange={setSignature} />
      {signature ? <div className="text-xs text-slate-500">Signature captured.</div> : null}
    </div>
  );
}
