import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, RefreshCw, Search, Truck, XCircle } from "lucide-react";
import { createShipmentFromMerchant, type MerchantMaster } from "@/lib/enterpriseWorkflow";
import { loadLiveMasterDataSnapshot, type LiveMasterSnapshot } from "@/lib/liveMasterData";

type WayRow = {
  id: string;
  trackingNo: string;
  pickupId: string;
  deliverId: string;
  invoiceNo: string;
  customerName: string;
  phone: string;
  merchantCode: string;
  status: string;
  collectable: number;
  lastLocation: string;
  routeZone: string;
};

function formatMMK(value: number): string {
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Number.isFinite(value) ? value : 0)} MMK`;
}

function getStatusBadge(status: string) {
  const s = status.toLowerCase();
  if (["delivered", "success", "completed"].includes(s)) return "bg-emerald-100 text-emerald-700";
  if (["failed", "delivery_failed", "cancelled"].includes(s)) return "bg-rose-100 text-rose-700";
  if (["returned", "return_initiated"].includes(s)) return "bg-amber-100 text-amber-700";
  return "bg-sky-100 text-sky-700";
}

function rowFromMerchant(merchant: MerchantMaster, index: number): WayRow {
  const shipment = createShipmentFromMerchant({
    merchant,
    pickupDate: "2026-05-25",
    parcelCount: 10 + index,
    receiverName: "Data Entry Queue",
    receiverPhone: merchant.phone || "Pending",
    deliveryAddress: "Pending delivery address",
    township: merchant.pickupTownship,
    serviceType: index % 2 ? "Standard" : "Same Day",
    priority: index % 3 ? "Normal" : "High",
  });
  return {
    id: shipment.id,
    trackingNo: shipment.waybillNo,
    pickupId: shipment.pickupId,
    deliverId: shipment.deliverId,
    invoiceNo: shipment.invoiceNo,
    customerName: shipment.receiverName,
    phone: shipment.receiverPhone,
    merchantCode: shipment.merchantCode,
    status: shipment.status.toLowerCase().replace(/ /g, "_"),
    collectable: shipment.codAmount + shipment.deliveryFee + shipment.extraWeightFee,
    lastLocation: merchant.pickupAddress,
    routeZone: shipment.routeZone ?? `${merchant.pickupTownship} Route`,
  };
}

export default function WayManagementPage() {
  const [snapshot, setSnapshot] = useState<LiveMasterSnapshot | null>(null);
  const [rows, setRows] = useState<WayRow[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("Way Management is loading the shared master-data snapshot.");

  async function syncMasterData() {
    setLoading(true);
    const next = await loadLiveMasterDataSnapshot();
    const nextRows = next.merchants.map(rowFromMerchant);
    setSnapshot(next);
    setRows(nextRows);
    setNotice(`Way Management synchronized with ${next.merchants.length} merchants, ${next.vehicles.length} vehicles, and ${(next.riders.length + next.drivers.length + next.helpers.length)} pickup/delivery people.`);
    setLoading(false);
  }

  useEffect(() => { void syncMasterData(); }, []);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesQuery = !q || [row.trackingNo, row.pickupId, row.deliverId, row.invoiceNo, row.customerName, row.phone, row.merchantCode, row.lastLocation, row.routeZone].join(" ").toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || row.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [rows, query, statusFilter]);

  return (
    <div className="min-h-screen bg-[#f7f9fc] p-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Britium Express Delivery</p>
          <h1 className="text-4xl font-black uppercase tracking-tight text-[#0d2c54]">Way Management <span className="font-normal">/ ကုန်စည်စီမံခန့်ခွဲမှု</span></h1>
          <p className="max-w-4xl text-sm font-semibold text-slate-500">Way Management now uses the same live master-data snapshot as Create Delivery, Customer Service, Data Entry, Supervisor, and Warehouse.</p>
        </div>
        <button onClick={syncMasterData} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0d2c54] px-6 py-4 text-sm font-black text-white">
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Sync Master Data
        </button>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-4">
        <MetricCard icon={<Truck size={28} />} badge="WAYS" title="Total Ways / စုစုပေါင်း" value={filteredRows.length} dark />
        <MetricCard icon={<CheckCircle2 className="text-emerald-500" size={28} />} badge="MERCHANTS" title="Merchant Master" value={snapshot?.merchants.length ?? 0} />
        <MetricCard icon={<Truck className="text-sky-500" size={28} />} badge="VEHICLES" title="Vehicle Master" value={snapshot?.vehicles.length ?? 0} />
        <MetricCard icon={<XCircle className="text-amber-500" size={28} />} badge="PEOPLE" title="Rider Driver Helper" value={(snapshot?.riders.length ?? 0) + (snapshot?.drivers.length ?? 0) + (snapshot?.helpers.length ?? 0)} />
      </div>

      <div className="mt-8 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search waybill, pickup, invoice, merchant, route..." className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-medium outline-none focus:border-[#0d2c54]" />
          </div>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none">
            <option value="all">All Statuses / အခြေအနေအားလုံး</option>
            <option value="pending_pickup">Pending Pickup</option>
            <option value="pickup_assigned">Pickup Assigned</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>
        <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">{notice}</div>

        <div className="mt-8 overflow-x-auto rounded-[28px] border border-slate-200">
          <table className="min-w-full border-separate border-spacing-0 text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left font-black uppercase tracking-wider text-slate-500">
                <th className="px-4 py-4">Waybill</th>
                <th className="px-4 py-4">Pickup / Deliver / Invoice</th>
                <th className="px-4 py-4">Merchant</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Collectable</th>
                <th className="px-4 py-4">Master Location</th>
                <th className="px-4 py-4">Route</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {filteredRows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="border-b border-slate-100 px-4 py-4 font-black text-[#0d2c54]">{row.trackingNo}</td>
                  <td className="border-b border-slate-100 px-4 py-4 font-mono text-xs text-slate-600">{row.pickupId}<br />{row.deliverId}<br />{row.invoiceNo}</td>
                  <td className="border-b border-slate-100 px-4 py-4"><div>{row.customerName}</div><div className="text-xs text-slate-400">{row.merchantCode} - {row.phone}</div></td>
                  <td className="border-b border-slate-100 px-4 py-4"><span className={`rounded-full px-3 py-1 text-[10px] font-black ${getStatusBadge(row.status)}`}>{row.status.toUpperCase()}</span></td>
                  <td className="border-b border-slate-100 px-4 py-4 font-black text-emerald-600">{formatMMK(row.collectable)}</td>
                  <td className="border-b border-slate-100 px-4 py-4 text-slate-600">{row.lastLocation}</td>
                  <td className="border-b border-slate-100 px-4 py-4 text-slate-600">{row.routeZone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, badge, title, value, dark = false }: any) {
  return <div className={`rounded-[28px] p-6 shadow-sm ${dark ? "bg-[#192b4d] text-white" : "bg-white"}`}><div className="mb-6 flex items-center justify-between">{icon}<span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase text-slate-700">{badge}</span></div><p className="text-xs font-black uppercase tracking-[0.2em] opacity-60">{title}</p><p className="mt-4 text-5xl font-black">{value}</p></div>;
}
