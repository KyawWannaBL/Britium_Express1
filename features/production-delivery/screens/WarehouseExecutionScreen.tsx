import React from "react";
import DeviceQrScanner from "../components/DeviceQrScanner";
import WorkflowTimeline from "../components/WorkflowTimeline";

export default function WarehouseExecutionScreen() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-black text-[#0d2c54]">Warehouse Execution</h1>
        <p className="mt-2 text-sm text-slate-500">Warehouse and command center execution scaffold.</p>
      </div>
      <DeviceQrScanner onDetected={(value) => alert(`Scanned: ${value}`)} />
      <WorkflowTimeline
        steps={[
          { key: "intake", label: "Inbound scan", status: "done" },
          { key: "sort", label: "Sorting", status: "current" },
          { key: "bag", label: "Bag control / dispatch", status: "pending" },
        ]}
      />
    </div>
  );
}
