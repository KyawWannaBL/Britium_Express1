import React from "react";
import LeafletRoutePanel from "../components/LeafletRoutePanel";

export default function LiveTrackingScreen() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-black text-[#0d2c54]">Live Tracking</h1>
        <p className="mt-2 text-sm text-slate-500">Tracking command panel scaffold.</p>
      </div>
      <LeafletRoutePanel />
    </div>
  );
}
