import React, { useState } from "react";
import DeviceQrScanner from "../components/DeviceQrScanner";
import PhotoEvidenceField from "../components/PhotoEvidenceField";
import WorkflowTimeline from "../components/WorkflowTimeline";
import LeafletRoutePanel from "../components/LeafletRoutePanel";

export default function CreateDeliveryScreen() {
  const [scans, setScans] = useState<string[]>([]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-black text-[#0d2c54]">Enterprise Delivery Creation</h1>
        <p className="mt-2 text-sm text-slate-500">
          User-friendlier delivery creation workflow with scanner, photo evidence, OCR-ready intake, and route preview.
        </p>
      </div>

      <DeviceQrScanner onDetected={(value) => setScans((prev) => [value, ...prev])} />
      <PhotoEvidenceField label="Parcel Intake Photo" />
      <WorkflowTimeline
        steps={[
          { key: "scan", label: "Scan parcel / label", status: scans.length ? "done" : "current" },
          { key: "review", label: "Review intake data", status: scans.length ? "current" : "pending" },
          { key: "dispatch", label: "Route for dispatch", status: "pending" },
        ]}
      />
      <LeafletRoutePanel />
    </div>
  );
}
