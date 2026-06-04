import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, RefreshCw, Search, Truck } from "lucide-react";
import { generateOperationalIds, type MerchantMaster } from "@/lib/enterpriseWorkflow";
import { loadLiveMasterDataSnapshot } from "@/lib/liveMasterData";

type PickupRow = {
  pickupId: string;
  deliverId: string;
  invoiceNo: string;
  waybillNo: string;
  merchantName: string;
  address: string;
  parcels: number;
  status: string;
};

function buildPickup(merchant: MerchantMaster, date: string, parcels: number): PickupRow {
  return {
    ...generateOperationalIds(date, merchant.code, parcels),
    merchantName: merchant.name,
    address: merchant.pickupAddress,
    parcels,
    status: "DATA ENTRY IN PROGRESS",
  };
}

export default function CustomerServicePortalPage() {
  const [merchants, setMerchants] = useState<MerchantMaster[]>([]);
  const [merchantId, setMerchantId] = useState("");
  const [date, setDate] = useState("2026-05-25");
  const [parcels, setParcels] = useState("15");
  const [rows, setRows] = useState<PickupRow[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("Loading shared master-data snapshot.");

  async function syncMasterData() {
    setLoading(true);
    const snapshot = await loadLiveMasterDataSnapshot();
    setMerchants(snapshot.merchants);
    setMerchantId((current) =>
      snapshot.merchants.some((merchant) => merchant.id === current)
        ? current
        : snapshot.merchants[0]?.id ?? "",
    );
    setRows((current) =>
      current.length
        ? current
        : snapshot.merchants.slice(0, 3).map((merchant) => buildPickup(merchant, "2026-05-25", 15)),
    );
    setNotice(`Synchronized with ${snapshot.merchants.length} merchant master records.`);
    setLoading(false);
  }

  useEffect(() => {
    void syncMasterData();
  }, []);

  const merchant = useMemo(
    () => merchants.find((item) => item.id === merchantId) ?? merchants[0],
    [merchantId, merchants],
  );
  const parcelCount = Math.max(1, Number(parcels) || 1);
  const ids = useMemo(
    () => generateOperationalIds(date, merchant?.code ?? "XXX", parcelCount),
    [date, merchant?.code, parcelCount],
  );
  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => Object.values(row).join(" ").toLowerCase().includes(q));
  }, [query, rows]);

  function createPickup() {
    if (!merchant) {
      setNotice("No merchant is selected from master data.");
      return;
    }
    const next = buildPickup(merchant, date, parcelCount);
    setRows((current) => [next, ...current.filter((row) => row.pickupId !== next.pickupId)]);
    setNotice(`${next.pickupId} created from synchronized master data.`);
  }

  return (
    <div className="min-h-screen bg-[#f6f8fc] p-8 text-slate-950">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-5xl font-black tracking-tight">Customer Service</h1>
          <p className="mt-4 text-lg font-semibold text-slate-500">
            Pickup intake uses the same live master-data snapshot as Data Entry, Supervisor, and Warehouse.
          </p>
        </div>
        <button type="button" onClick={syncMasterData} className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-7 py-4 text-lg font-black shadow-sm hover:bg-slate-50">
          <RefreshCw size={20} className={loading ? "animate-spin" : ""} /> Sync Master Data
        </button>
      </div>

      <div className="mt-8 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="relative">
          <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search pickup, merchant, or waybill..." className="h-16 w-full rounded-2xl border border-slate-200 pl-14 pr-5 text-lg font-semibold outline-none focus:border-blue-500" />
        </div>
        <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-base font-bold text-emerald-700">
          <CheckCircle2 className="mr-2 inline" size={18} />{notice}
        </div>
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-[1fr_430px]">
        <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-3xl font-black">Create pickup request for Data Entry</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            <Field label="Merchant"><select value={merchantId} onChange={(event) => setMerchantId(event.target.value)} className="control">{merchants.map((item) => <option key={item.id} value={item.id}>{item.name} - {item.code}</option>)}</select></Field>
            <Field label="Code"><input readOnly value={merchant?.code ?? ""} className="control locked" /></Field>
            <Field label="Phone"><input readOnly value={merchant?.phone ?? ""} className="control locked" /></Field>
            <Field label="Pickup Address"><input readOnly value={merchant?.pickupAddress ?? ""} className="control locked" /></Field>
            <Field label="Township"><input readOnly value={merchant?.pickupTownship ?? ""} className="control locked" /></Field>
            <Field label="Payment"><input readOnly value={merchant?.paymentMethod ?? ""} className="control locked" /></Field>
            <Field label="Pickup Date"><input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="control" /></Field>
            <Field label="Parcels"><input type="number" min="1" value={parcels} onChange={(event) => setParcels(event.target.value)} className="control" /></Field>
            <Field label="Pickup ID"><input readOnly value={ids.pickupId} className="control idfield" /></Field>
            <Field label="Deliver ID"><input readOnly value={ids.deliverId} className="control idfield" /></Field>
            <Field label="Invoice No"><input readOnly value={ids.invoiceNo} className="control idfield" /></Field>
            <Field label="Waybill No"><input readOnly value={ids.waybillNo} className="control idfield" /></Field>
          </div>
          <button type="button" onClick={createPickup} className="mt-7 inline-flex items-center gap-3 rounded-2xl bg-blue-700 px-7 py-4 text-base font-black uppercase tracking-wider text-white hover:bg-blue-800">
            <Truck size={18} /> Create Pickup Request
          </button>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-3xl font-black">Recent CS Pickups</h2>
          <div className="mt-6 space-y-4">
            {filteredRows.map((row) => <div key={row.pickupId} className="rounded-2xl border border-slate-200 p-5 shadow-sm"><div className="font-mono text-lg font-black text-blue-700">{row.pickupId}</div><div className="mt-2 text-lg font-black">{row.merchantName}</div><div className="mt-1 text-sm font-semibold text-slate-500">{row.address}</div><div className="mt-3 font-mono text-xs font-black text-slate-600">{row.deliverId} / {row.invoiceNo} / {row.waybillNo}</div><div className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-500">{row.status}</div></div>)}
          </div>
        </section>
      </div>
      <style>{`.control{height:58px;width:100%;border-radius:18px;border:1px solid #e2e8f0;padding:0 18px;font-size:16px;font-weight:700;outline:none;background:white}.locked{background:#f1f5f9;color:#475569}.idfield{background:#eff6ff;color:#1d4ed8;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-weight:900}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-sm font-black uppercase tracking-wider text-slate-500">{label}</span>{children}</label>;
}
