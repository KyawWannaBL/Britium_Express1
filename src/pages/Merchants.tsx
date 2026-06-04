import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, RefreshCw, Search, Store, Truck, Wallet } from "lucide-react";
import { createShipmentFromMerchant, generateOperationalIds, type MerchantMaster } from "@/lib/enterpriseWorkflow";
import { loadLiveMasterDataSnapshot } from "@/lib/liveMasterData";

type MerchantShipment = { waybillNo: string; pickupId: string; deliverId: string; invoiceNo: string; receiver: string; destination: string; status: string; deliveryFee: number; codAmount: number };
type MerchantPickup = { pickupId: string; pickupDate: string; timeWindow: string; parcelCount: number; address: string; status: string };

function makeShipments(merchant: MerchantMaster): MerchantShipment[] {
  return [1, 2, 3].map((item) => {
    const shipment = createShipmentFromMerchant({ merchant, pickupDate: "2026-05-25", parcelCount: item + 2, receiverName: `Receiver ${item}`, receiverPhone: merchant.phone, deliveryAddress: "Pending delivery address", township: merchant.pickupTownship, serviceType: item % 2 ? "Same Day" : "Standard", priority: item === 1 ? "High" : "Normal" });
    return { waybillNo: shipment.waybillNo, pickupId: shipment.pickupId, deliverId: shipment.deliverId, invoiceNo: shipment.invoiceNo, receiver: shipment.receiverName, destination: shipment.deliveryAddress, status: shipment.status, deliveryFee: shipment.deliveryFee, codAmount: shipment.codAmount };
  });
}

function makePickups(merchant: MerchantMaster): MerchantPickup[] {
  return [10, 15].map((count, index) => ({ ...generateOperationalIds("2026-05-25", merchant.code, count), pickupDate: "2026-05-25", timeWindow: merchant.defaultPickupTime, parcelCount: count, address: merchant.pickupAddress, status: index === 0 ? "SCHEDULED" : "READY" }));
}

export default function Merchants() {
  const [merchants, setMerchants] = useState<MerchantMaster[]>([]);
  const [merchantId, setMerchantId] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("Merchant portal is loading the shared master-data snapshot.");

  async function syncMasterData() {
    setLoading(true);
    const snapshot = await loadLiveMasterDataSnapshot();
    setMerchants(snapshot.merchants);
    setMerchantId((current) => snapshot.merchants.some((row) => row.id === current) ? current : snapshot.merchants[0]?.id ?? "");
    setNotice(`Merchant portal synchronized with ${snapshot.merchants.length} Merchant Master records.`);
    setLoading(false);
  }

  useEffect(() => { void syncMasterData(); }, []);

  const merchant = useMemo(() => merchants.find((row) => row.id === merchantId) ?? merchants[0], [merchantId, merchants]);
  const shipments = useMemo(() => merchant ? makeShipments(merchant) : [], [merchant]);
  const pickups = useMemo(() => merchant ? makePickups(merchant) : [], [merchant]);
  const filteredShipments = useMemo(() => { const q = query.trim().toLowerCase(); return q ? shipments.filter((row) => Object.values(row).join(" ").toLowerCase().includes(q)) : shipments; }, [query, shipments]);
  const codPending = filteredShipments.reduce((sum, row) => sum + row.codAmount, 0);
  const deliveryFees = filteredShipments.reduce((sum, row) => sum + row.deliveryFee, 0);

  return <div className="min-h-screen bg-[#f6f8fc] p-8 text-slate-950"><header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between"><div><p className="text-sm font-black uppercase tracking-[0.24em] text-blue-700">Merchant Portal</p><h1 className="mt-3 text-5xl font-black tracking-tight">Merchant Dashboard</h1><p className="mt-4 max-w-5xl text-lg font-semibold leading-8 text-slate-500">Merchant profile, pickups, shipments, COD, and billing are synchronized with the same live master-data snapshot used by operations.</p></div><button type="button" onClick={syncMasterData} className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-7 py-4 text-lg font-black shadow-sm hover:bg-slate-50"><RefreshCw size={20} className={loading ? "animate-spin" : ""} />Sync Master Data</button></header><div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4"><Metric title="Merchant Master" value={merchants.length} icon={<Store size={18} />} /><Metric title="Shipments" value={filteredShipments.length} icon={<Truck size={18} />} /><Metric title="COD Pending" value={codPending} icon={<Wallet size={18} />} money /><Metric title="Delivery Fees" value={deliveryFees} icon={<CheckCircle2 size={18} />} money /></div><section className="mt-8 rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm"><div className="grid gap-5 xl:grid-cols-[360px_1fr]"><label className="block"><span className="mb-2 block text-sm font-black uppercase tracking-wider text-slate-500">Merchant</span><select value={merchantId} onChange={(event) => setMerchantId(event.target.value)} className="control">{merchants.map((row) => <option key={row.id} value={row.id}>{row.name} - {row.code}</option>)}</select></label><div className="relative self-end"><Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search shipment, pickup, invoice, receiver..." className="h-16 w-full rounded-2xl border border-slate-200 bg-white pl-14 pr-5 text-lg font-semibold outline-none focus:border-blue-500" /></div></div><div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-base font-bold text-emerald-700">{notice}</div><div className="mt-8 grid gap-5 md:grid-cols-3"><Info label="Merchant Code" value={merchant?.code ?? ""} /><Info label="Contact" value={merchant?.contactPerson ?? ""} /><Info label="Phone" value={merchant?.phone ?? ""} /><Info label="Pickup Address" value={merchant?.pickupAddress ?? ""} /><Info label="Township / City" value={merchant ? `${merchant.pickupTownship}, ${merchant.pickupCity}` : ""} /><Info label="Payment" value={merchant?.paymentMethod ?? ""} /><Info label="Tariff" value={merchant?.tariffProfile ?? ""} /><Info label="Billing" value={merchant?.billingProfile ?? ""} /><Info label="Pickup Window" value={merchant?.defaultPickupTime ?? ""} /></div></section><div className="mt-8 grid gap-8 xl:grid-cols-[1fr_420px]"><section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm"><h2 className="text-3xl font-black">Shipments</h2><div className="mt-6 overflow-hidden rounded-2xl border border-slate-200"><div className="grid grid-cols-5 gap-3 bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-500"><div>Waybill</div><div>Pickup</div><div>Receiver</div><div>Status</div><div>COD</div></div>{filteredShipments.map((row) => <div key={row.waybillNo} className="grid grid-cols-5 gap-3 border-t border-slate-100 px-4 py-4 text-sm font-semibold text-slate-700"><div className="font-mono font-black text-blue-700">{row.waybillNo}</div><div className="font-mono text-xs">{row.pickupId}<br />{row.invoiceNo}</div><div>{row.receiver}</div><div>{row.status}</div><div>{row.codAmount.toLocaleString()} MMK</div></div>)}</div></section><section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm"><h2 className="text-3xl font-black">Pickup Requests</h2><div className="mt-6 space-y-4">{pickups.map((row) => <div key={row.pickupId} className="rounded-2xl border border-slate-200 p-5"><div className="font-mono text-lg font-black text-blue-700">{row.pickupId}</div><div className="mt-2 text-sm font-semibold text-slate-500">{row.address}</div><div className="mt-3 grid grid-cols-2 gap-2 text-xs"><Mini label="Date" value={row.pickupDate} /><Mini label="Window" value={row.timeWindow} /><Mini label="Parcels" value={`${row.parcelCount}`} /><Mini label="Status" value={row.status} /></div></div>)}</div></section></div><style>{`.control{height:58px;width:100%;border-radius:18px;border:1px solid #e2e8f0;padding:0 18px;font-size:16px;font-weight:700;outline:none;background:white}.control:focus{border-color:#2563eb}`}</style></div>;
}

function Metric({ title, value, icon, money = false }: { title: string; value: number; icon: React.ReactNode; money?: boolean }) { return <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between text-slate-500"><div className="text-sm font-black uppercase tracking-wider">{title}</div>{icon}</div><div className="mt-4 text-4xl font-black">{money ? `${value.toLocaleString()} MMK` : value}</div></div>; }
function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-slate-50 p-4"><div className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</div><div className="mt-1 text-sm font-black text-slate-700">{value}</div></div>; }
function Mini({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-slate-50 p-3"><div className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</div><div className="mt-1 font-mono text-xs font-black text-slate-700">{value}</div></div>; }
