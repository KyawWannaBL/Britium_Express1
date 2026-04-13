import React from "react";
import LeafletRoutePanel from "../components/LeafletRoutePanel";

export default function WayManagementScreen() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-black text-[#0d2c54]">Way Management Command Center</h1>
        <p className="mt-2 text-sm text-slate-500">Route planning and focused way management scaffold.</p>
      </div>
      <LeafletRoutePanel
        points={[
          { lat: 16.8661, lng: 96.1951, label: "Yangon Hub" },
          { lat: 21.9588, lng: 96.0891, label: "Mandalay Node" },
        ]}
      />
    </div>
  );
}
