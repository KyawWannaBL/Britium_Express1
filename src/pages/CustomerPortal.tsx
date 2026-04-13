import React from "react";
import { Headset, MapPinned, PackageSearch, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

import LiveTrackingScreen from "../../features/production-delivery/screens/LiveTrackingScreen";

export default function CustomerPortal() {
  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,#081526_0%,#0b1e37_100%)] p-6 text-white shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
              Customer Self Service
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
              Britium Express Customer Portal
            </h1>
            <p className="mt-3 max-w-3xl text-sm text-slate-200/80">
              Track shipments, review delivery progress, and quickly contact customer support when needed.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/production/live-tracking"
              className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-black text-[#04101d] shadow"
            >
              <MapPinned className="h-4 w-4" />
              Open Tracking
            </Link>
            <Link
              to="/customer-service"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-black text-white"
            >
              <Headset className="h-4 w-4" />
              Contact Support
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="inline-flex rounded-2xl bg-slate-100 p-3 text-slate-600">
            <PackageSearch className="h-4 w-4" />
          </div>
          <div className="mt-4 text-base font-black text-slate-800">Track by Waybill</div>
          <div className="mt-2 text-sm text-slate-500">
            Search by tracking number and review the latest shipment milestones.
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="inline-flex rounded-2xl bg-slate-100 p-3 text-slate-600">
            <MapPinned className="h-4 w-4" />
          </div>
          <div className="mt-4 text-base font-black text-slate-800">Live Delivery View</div>
          <div className="mt-2 text-sm text-slate-500">
            Follow dispatch progress and delivery-stage updates in real time.
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="inline-flex rounded-2xl bg-slate-100 p-3 text-slate-600">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="mt-4 text-base font-black text-slate-800">Secure Support</div>
          <div className="mt-2 text-sm text-slate-500">
            Escalate delivery concerns to the customer-service team with a clear audit trail.
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
        <LiveTrackingScreen />
      </section>
    </div>
  );
}
