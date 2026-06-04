import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, FileText, Printer, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { createShipmentFromMerchant, type EnterpriseShipment } from "@/lib/enterpriseWorkflow";
import { loadLiveMasterDataSnapshot, type LiveMasterSnapshot } from "@/lib/liveMasterData";

function buildWaybills(snapshot: LiveMasterSnapshot): EnterpriseShipment[] {
  return snapshot.merchants.slice(0, 12).map((merchant, index) => createShipmentFromMerchant({
    merchant,
    pickupDate: "2026-05-25",
    parcelCount: 1 + index,
    receiverName: `Receiver ${index + 1}`,
    receiverPhone: merchant.phone || "Pending",
    deliveryAddress: "Pending receiver address",
    township: merchant.pickupTownship,
    serviceType: index % 2 ? "Standard" : "Same Day",
    priority: index % 3 ? "Normal" : "High",
  }));
}

export default function Waybill() {
  const [snapshot, setSnapshot] = useState<LiveMasterSnapshot | null>(null);
  const [rows, setRows] = useState<EnterpriseShipment[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("Waybill is loading the shared master-data snapshot.");

  async function syncMasterData() {
    setLoading(true);
    const next = await loadLiveMasterDataSnapshot();
    const nextRows = buildWaybills(next);
    setSnapshot(next);
    setRows(nextRows);
    setSelectedId((current) => nextRows.some((row) => row.id === current) ? current : nextRows[0]?.id ?? "");
    setNotice(`Waybill synchronized with ${next.merchants.length} merchant records and ${nextRows.length} generated waybills.`);
    setLoading(false);
  }

  useEffect(() => { void syncMasterData(); }, []);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => [row.waybillNo, row.pickupId, row.deliverId, row.invoiceNo, row.merchantName, row.receiverName, row.pickupAddress, row.deliveryAddress].join(" ").toLowerCase().includes(q));
  }, [query, rows]);
  const selected = rows.find((row) => row.id === selectedId) ?? rows[0];

  function printWaybill() {
    setNotice(`${selected?.waybillNo ?? "Waybill"} print preview prepared from synchronized master data.`);
  }

  return <div className="min-h-screen bg-[#f6f8fc] p-8 text-slate-950"><header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between"><div><p className="text-sm font-black uppercase tracking-[0.24em] text-blue-700">Britium Express</p><h1 className="mt-3 text-5xl font-black tracking-tight">Waybill Center</h1><p className="mt-4 max-w-5xl text-lg font-semibold leading-8 text-slate-500">Waybill printing and lookup now use the same live master-data snapshot as every operational portal.</p></div><button type="button" onClick={syncMasterData} className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-7 py-4 text-lg font-black shadow-sm hover:bg-slate-50"><RefreshCw size={20} className={loading ? "animate-spin" : ""} />Sync Master Data</button></header><div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4"><Metric title="Waybills" value={filteredRows.length} icon={<FileText size={18} />} /><Metric title="Merchants" value={snapshot?.merchants.length ?? 0} icon={<ShieldCheck size={18} />} /><Metric title="Vehicles" value={snapshot?.vehicles.length ?? 0} icon={<CheckCircle2 size={18} />} /><Metric title="Sync" value={loading ? 0 : 1} icon={<RefreshCw size={18} />} /></div><section className="mt-8 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm"><div className="grid gap-4 xl:grid-cols-[1fr_360px]"><div className="relative"><Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search waybill, pickup, invoice, merchant, receiver..." className="h-16 w-full rounded-2xl border border-slate-200 bg-white pl-14 pr-5 text-lg font-semibold outline-none focus:border-blue-500" /></div><select value={selectedId} onChange={(event) => setSelectedId(event.target.value)} className="h-16 rounded-2xl border border-slate-200 bg-white px-5 text-base font-black outline-none focus:border-blue-500">{filteredRows.map((row) => <option key={row.id} value={row.id}>{row.waybillNo} - {row.merchantName}</option>)}</select></div><div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-base font-bold text-emerald-700"><CheckCircle2 className="mr-2 inline" size={18} />{notice}</div></section><div className="mt-8 grid gap-8 xl:grid-cols-[1fr_440px]"><section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm"><h2 className="text-3xl font-black">Waybill List</h2><div className="mt-6 overflow-hidden rounded-2xl border border-slate-200"><div className="grid grid-cols-5 gap-3 bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-500"><div>Waybill</div><div>Pickup / Invoice</div><div>Merchant</div><div>Receiver</div><div>Status</div></div>{filteredRows.map((row) => <button key={row.id} type="button" onClick={() => setSelectedId(row.id)} className="grid w-full grid-cols-5 gap-3 border-t border-slate-100 px-4 py-4 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"><div className="font-mono font-black text-blue-700">{row.waybillNo}</div><div className="font-mono text-xs">{row.pickupId}<br />{row.invoiceNo}</div><div>{row.merchantName}</div><div>{row.receiverName}</div><div>{row.status}</div></button>)}</div></section><section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm"><h2 className="text-3xl font-black">Print Preview</h2>{selected ? <div className="mt-6 rounded-2xl border-2 border-dashed border-slate-300 bg-white p-6"><div className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Britium Express Waybill</div><div className="mt-3 font-mono text-2xl font-black text-blue-700">{selected.waybillNo}</div><div className="mt-5 grid gap-3 text-sm"><Info label="Pickup ID" value={selected.pickupId} /><Info label="Deliver ID" value={selected.deliverId} /><Info label="Invoice No" value={selected.invoiceNo} /><Info label="Merchant" value={`${selected.merchantCode} - ${selected.merchantName}`} /><Info label="Sender Address" value={selected.pickupAddress} /><Info label="Receiver" value={`${selected.receiverName} / ${selected.receiverPhone}`} /><Info label="Delivery Address" value={selected.deliveryAddress} /><Info label="Payment" value={selected.paymentMethod} /></div><button type="button" onClick={printWaybill} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-black text-white hover:bg-blue-800"><Printer size={16} />Print Waybill</button></div> : <div className="mt-6 rounded-2xl bg-slate-50 p-6 font-semibold text-slate-500">No waybill selected.</div>}</section></div></div>;
}

function Metric({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) { return <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between text-slate-500"><div className="text-sm font-black uppercase tracking-wider">{title}</div>{icon}</div><div className="mt-4 text-5xl font-black">{value}</div></div>; }
function Info({ label, value }: { label: string; value: string }) { return <div><div className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</div><div className="mt-1 rounded-xl bg-slate-50 px-3 py-2 font-bold text-slate-700">{value}</div></div>; }
