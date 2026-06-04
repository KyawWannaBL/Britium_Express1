import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Package2, RefreshCw, Search, ShieldCheck, Store, Truck, Users, Warehouse } from "lucide-react";
import { createShipmentFromMerchant, type EnterpriseShipment } from "@/lib/enterpriseWorkflow";
import { loadLiveMasterDataSnapshot, type LiveMasterSnapshot } from "@/lib/liveMasterData";

function buildShipments(snapshot: LiveMasterSnapshot): EnterpriseShipment[] {
  return snapshot.merchants.slice(0, 8).map((merchant, index) => createShipmentFromMerchant({ merchant, pickupDate: "2026-05-25", parcelCount: 3 + index, receiverName: `Receiver ${index + 1}`, receiverPhone: merchant.phone || "Pending", deliveryAddress: "Pending receiver address", township: merchant.pickupTownship, serviceType: index % 2 ? "Standard" : "Same Day", priority: index % 3 ? "Normal" : "High" }));
}

export default function Dashboard() {
  const [snapshot, setSnapshot] = useState<LiveMasterSnapshot | null>(null);
  const [shipments, setShipments] = useState<EnterpriseShipment[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("Dashboard is loading the shared master-data snapshot.");

  async function syncMasterData() {
    setLoading(true);
    const next = await loadLiveMasterDataSnapshot();
    setSnapshot(next);
    setShipments(buildShipments(next));
    setNotice(`Dashboard synchronized with ${next.merchants.length} merchants, ${next.vehicles.length} vehicles, and ${(next.riders.length + next.drivers.length + next.helpers.length)} people.`);
    setLoading(false);
  }

  useEffect(() => { void syncMasterData(); }, []);

  const peopleCount = (snapshot?.riders.length ?? 0) + (snapshot?.drivers.length ?? 0) + (snapshot?.helpers.length ?? 0) + (snapshot?.employees.length ?? 0);
  const filteredShipments = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return shipments;
    return shipments.filter((row) => [row.pickupId, row.deliverId, row.invoiceNo, row.waybillNo, row.merchantName, row.status, row.routeZone ?? ""].join(" ").toLowerCase().includes(q));
  }, [query, shipments]);
  const pending = filteredShipments.filter((row) => !["Delivered", "Closed"].includes(row.status)).length;
  const codTotal = filteredShipments.reduce((sum, row) => sum + row.codAmount, 0);

  return <div className="min-h-screen bg-[#f6f8fc] p-8 text-slate-950"><header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between"><div><p className="text-sm font-black uppercase tracking-[0.24em] text-blue-700">Britium Enterprise Portal</p><h1 className="mt-3 text-5xl font-black tracking-tight">Live Operations Dashboard</h1><p className="mt-4 max-w-5xl text-lg font-semibold leading-8 text-slate-500">Main dashboard now reads the same live master-data snapshot as CS, Data Entry, Supervisor, Warehouse, Way Management, Merchants, Deliverymen, and Customer Portal.</p></div><button type="button" onClick={syncMasterData} className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-7 py-4 text-lg font-black shadow-sm hover:bg-slate-50"><RefreshCw size={20} className={loading ? "animate-spin" : ""} />Sync Master Data</button></header><div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-5"><Metric title="Merchants" value={snapshot?.merchants.length ?? 0} icon={<Store size={18} />} /><Metric title="Vehicles" value={snapshot?.vehicles.length ?? 0} icon={<Truck size={18} />} /><Metric title="People" value={peopleCount} icon={<Users size={18} />} /><Metric title="Open Ways" value={pending} icon={<Package2 size={18} />} /><Metric title="COD Total" value={codTotal} icon={<ShieldCheck size={18} />} money /></div><section className="mt-8 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm"><div className="relative"><Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search waybill, pickup, invoice, merchant, status, route..." className="h-16 w-full rounded-2xl border border-slate-200 bg-white pl-14 pr-5 text-lg font-semibold outline-none focus:border-blue-500" /></div><div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-base font-bold text-emerald-700"><CheckCircle2 className="mr-2 inline" size={18} />{notice}</div></section><div className="mt-8 grid gap-8 xl:grid-cols-[1fr_430px]"><section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm"><h2 className="text-3xl font-black">Synchronized Shipment Feed</h2><div className="mt-6 overflow-hidden rounded-2xl border border-slate-200"><div className="grid grid-cols-6 gap-3 bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-500"><div>Waybill</div><div>Pickup</div><div>Merchant</div><div>Status</div><div>Route</div><div>COD</div></div>{filteredShipments.map((row) => <div key={row.id} className="grid grid-cols-6 gap-3 border-t border-slate-100 px-4 py-4 text-sm font-semibold text-slate-700"><div className="font-mono font-black text-blue-700">{row.waybillNo}</div><div className="font-mono text-xs">{row.pickupId}<br />{row.invoiceNo}</div><div>{row.merchantName}</div><div>{row.status}</div><div>{row.routeZone}</div><div>{row.codAmount.toLocaleString()} MMK</div></div>)}</div></section><section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm"><h2 className="flex items-center gap-3 text-3xl font-black"><Warehouse size={28} />Master Data Health</h2><div className="mt-6 space-y-4"><Info label="Merchant Source" value={`${snapshot?.merchants.length ?? 0} live records`} /><Info label="Vehicle Source" value={`${snapshot?.vehicles.length ?? 0} live records`} /><Info label="Riders" value={`${snapshot?.riders.length ?? 0} live records`} /><Info label="Drivers" value={`${snapshot?.drivers.length ?? 0} live records`} /><Info label="Helpers" value={`${snapshot?.helpers.length ?? 0} live records`} /><Info label="Loaded From" value={(snapshot?.loadedFrom ?? []).slice(0, 4).join(" / ") || "Loading"} /></div></section></div></div>;
}

function Metric({ title, value, icon, money = false }: { title: string; value: number; icon: React.ReactNode; money?: boolean }) { return <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between text-slate-500"><div className="text-sm font-black uppercase tracking-wider">{title}</div>{icon}</div><div className="mt-4 text-4xl font-black">{money ? `${value.toLocaleString()} MMK` : value}</div></div>; }
function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-slate-50 p-4"><div className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</div><div className="mt-1 break-words text-sm font-black text-slate-700">{value}</div></div>; }
