import React, { useState } from "react";
import { Database, FileText, Package2, ScanLine } from "lucide-react";

import ParcelIntakeScreen from "../../features/production-delivery/screens/ParcelIntakeScreen";
import OcrWorkbenchScreen from "../../features/production-delivery/screens/OcrWorkbenchScreen";
import CreateDeliveryScreen from "../../features/production-delivery/screens/CreateDeliveryScreen";

type DataEntryTab = "parcel_intake" | "ocr_workbench" | "manual_entry";

const tabs: Array<{
  id: DataEntryTab;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}> = [
  {
    id: "parcel_intake",
    title: "Parcel Intake",
    subtitle: "Scan, register, and receive incoming parcels",
    icon: <ScanLine className="h-4 w-4" />,
  },
  {
    id: "ocr_workbench",
    title: "OCR Workbench",
    subtitle: "Review label text and convert it into structured records",
    icon: <FileText className="h-4 w-4" />,
  },
  {
    id: "manual_entry",
    title: "Manual Entry",
    subtitle: "Create shipments manually when labels are incomplete",
    icon: <Package2 className="h-4 w-4" />,
  },
];

export default function DataEntryPortal() {
  const [activeTab, setActiveTab] = useState<DataEntryTab>("parcel_intake");

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,#081526_0%,#0b1e37_100%)] p-6 text-white shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
              Data Entry Workspace
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
              Britium Express Data Entry Portal
            </h1>
            <p className="mt-3 max-w-3xl text-sm text-slate-200/80">
              Dedicated tools for parcel intake, OCR-assisted data extraction, and manual shipment creation.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-2xl border border-cyan-400/15 bg-white/5 px-4 py-3 text-sm font-semibold text-cyan-200">
            <Database className="h-4 w-4" />
            Intake + OCR + Manual Entry
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-[24px] border p-5 text-left transition ${
                active
                  ? "border-cyan-300/40 bg-cyan-500/10 shadow-[0_18px_40px_rgba(34,211,238,0.10)]"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <div className={`inline-flex rounded-2xl p-3 ${active ? "bg-cyan-500/15 text-cyan-300" : "bg-slate-100 text-slate-600"}`}>
                {tab.icon}
              </div>
              <div className={`mt-4 text-base font-black ${active ? "text-[#0d2c54]" : "text-slate-800"}`}>
                {tab.title}
              </div>
              <div className="mt-2 text-sm text-slate-500">{tab.subtitle}</div>
            </button>
          );
        })}
      </section>

      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
        {activeTab === "parcel_intake" ? <ParcelIntakeScreen /> : null}
        {activeTab === "ocr_workbench" ? <OcrWorkbenchScreen /> : null}
        {activeTab === "manual_entry" ? <CreateDeliveryScreen /> : null}
      </section>
    </div>
  );
}
