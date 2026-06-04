import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { generateOperationalIds, type MerchantMaster } from "@/lib/enterpriseWorkflow";
import { loadLiveMasterDataSnapshot } from "@/lib/liveMasterData";

type OrderRow = { waybillNo: string; pickupId: string; deliverId: string; invoiceNo: string; merchantName: string; pickupAddress: string; receiverName: string; receiverPhone: string; deliveryAddress: string; status: string };

function makeOrder(merchant: MerchantMaster, count: number, receiverName: string, receiverPhone: string, deliveryAddress: string): OrderRow {
  const ids = generateOperationalIds("2026-05-25", merchant.code, count);
  return { ...ids, merchantName: merchant.name, pickupAddress: merchant.pickupAddress, receiverName: receiverName || "Pending receiver", receiverPhone: receiverPhone || "Pending", deliveryAddress: deliveryAddress || "Pending delivery address", status: "Pending Pickup" };
}

export default function CustomerPortal() {
  const [merchants, setMerchants] = useState<MerchantMaster[]>([]);
  const [merchantId, setMerchantId] = useState("");
  const [countText, setCountText] = useState("1");
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [query, setQuery] = useState("");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("Loading shared master data.");

  async function syncMasterData() {
    setLoading(true);
    const snapshot = await loadLiveMasterDataSnapshot();
    setMerchants(snapshot.merchants);
    setMerchantId((current) => snapshot.merchants.some((row) => row.id === current) ? current : snapshot.merchants[0]?.id ?? "");
    setOrders((current) => current.length ? current : snapshot.merchants.slice(0, 3).map((merchant, index) => makeOrder(merchant, index + 1, `Receiver ${index + 1}`, merchant.phone, "Pending delivery address")));
    setNotice(`Portal synchronized with ${snapshot.merchants.length} merchant records.`);
    setLoading(false);
  }

  useEffect(() => { void syncMasterData(); }, []);

  const merchant = useMemo(() => merchants.find((row) => row.id === merchantId) ?? merchants[0], [merchantId, merchants]);
  const packageCount = Math.max(1, Number(countText) || 1);
  const previewIds = useMemo(() => generateOperationalIds("2026-05-25", merchant?.code ?? "XXX", packageCount), [merchant?.code, packageCount]);
  const filteredOrders = useMemo(() => { const q = query.trim().toLowerCase(); return q ? orders.filter((row) => Object.values(row).join(" ").toLowerCase().includes(q)) : orders; }, [orders, query]);

  function createOrder() {
    if (!merchant) { setNotice("No merchant selected from master data."); return; }
    const next = makeOrder(merchant, packageCount, receiverName, receiverPhone, deliveryAddress);
    setOrders((current) => [next, ...current.filter((row) => row.waybillNo !== next.waybillNo)]);
    setNotice(`${next.waybillNo} created from synchronized master data.`);
  }

  return <div className="min-h-screen bg-[#f6f8fc] p-8 text-slate-950"><header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between"><div><p className="text-sm font-black uppercase tracking-[0.24em] text-blue-700">Customer Portal</p><h1 className="mt-3 text-5xl font-black tracking-tight">Order Booking</h1><p className="mt-4 max-w-5xl text-lg font-semibold leading-8 text-slate-500">Booking, sender data, IDs, and tracking use the shared master-data snapshot.</p></div><button type="button" onClick={syncMasterData} className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-7 py-4 text-lg font-black shadow-sm hover:bg-slate-50"><RefreshCw size={20} className={loading ? "animate-spin" : ""} />Sync Master Data</button></header><div className="mt-8 grid gap-5 md:grid-cols-3"><Metric title="Merchant Master" value={merchants.length} /><Metric title="Orders" value={filteredOrders.length} /><Metric title="Sync" value={loading ? 0 : 1} /></div><section className="mt-8 rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm"><div className="grid gap-5 xl:grid-cols-[360px_1fr]"><label className="block"><span className="mb-2 block text-sm font-black uppercase tracking-wider text-slate-500">Merchant Account</span><select value={merchantId} onChange={(event) => setMerchantId(event.target.value)} className="control">{merchants.map((row) => <option key={row.id} value={row.id}>{row.name} - {row.code}</option>)}</select></label><div className="relative self-end"><Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search order, waybill, receiver, merchant..." className="h-16 w-full rounded-2xl border border-slate-200 bg-white pl-14 pr-5 text-lg font-semibold outline-none focus:border-blue-500" /></div></div><div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-base font-bold text-emerald-700"><CheckCircle2 className="mr-2 inline" size={18} />{notice}</div><div className="mt-8 grid gap-5 md:grid-cols-3"><Info label="Merchant Code" value={merchant?.code ?? ""} /><Info label="Sender Name" value={merchant?.contactPerson || merchant?.name || ""} /><Info label="Sender Phone" value={merchant?.phone ?? ""} /><Info label="Pickup Address" value={merchant?.pickupAddress ?? ""} /><Info label="Township / City" value={merchant ? `${merchant.pickupTownship}, ${merchant.pickupCity}` : ""} /><Info label="Payment" value={merchant?.paymentMethod ?? ""} /></div></section><div className="mt-8 grid gap-8 xl:grid-cols-[1fr_430px]"><section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm"><h2 className="text-3xl font-black">Book New Order</h2><div className="mt-7 grid gap-5 md:grid-cols-3"><Field label="Receiver Name"><input value={receiverName} onChange={(event) => setReceiverName(event.target.value)} className="control" /></Field><Field label="Receiver Phone"><input value={receiverPhone} onChange={(event) => setReceiverPhone(event.target.value)} className="control" /></Field><Field label="Delivery Address"><input value={deliveryAddress} onChange={(event) => setDeliveryAddress(event.target.value)} className="control" /></Field><Field label="Packages"><input type="number" min="1" value={countText} onChange={(event) => setCountText(event.target.value)} className="control" /></Field><Field label="Pickup ID"><input readOnly value={previewIds.pickupId} className="control idfield" /></Field><Field label="Deliver ID"><input readOnly value={previewIds.deliverId} className="control idfield" /></Field><Field label="Invoice"><input readOnly value={previewIds.invoiceNo} className="control idfield" /></Field><Field label="Waybill"><input readOnly value={previewIds.waybillNo} className="control idfield" /></Field></div><button type="button" onClick={createOrder} className="mt-7 rounded-2xl bg-blue-700 px-7 py-4 font-black uppercase tracking-wider text-white hover:bg-blue-800">Submit Booking</button></section><section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm"><h2 className="text-3xl font-black">My Orders</h2><div className="mt-6 space-y-4">{filteredOrders.map((row) => <div key={row.waybillNo} className="rounded-2xl border border-slate-200 p-5"><div className="font-mono text-lg font-black text-blue-700">{row.waybillNo}</div><div className="mt-2 text-lg font-black">{row.merchantName}</div><div className="mt-1 text-sm font-semibold text-slate-500">{row.deliveryAddress}</div><div className="mt-3 grid grid-cols-2 gap-2"><Mini label="Pickup" value={row.pickupId} /><Mini label="Deliver" value={row.deliverId} /><Mini label="Invoice" value={row.invoiceNo} /><Mini label="Status" value={row.status} /></div></div>)}</div></section></div><style>{`.control{height:58px;width:100%;border-radius:18px;border:1px solid #e2e8f0;padding:0 18px;font-size:16px;font-weight:700;outline:none;background:white}.control:focus{border-color:#2563eb}.idfield{background:#eff6ff;color:#1d4ed8;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-weight:900}`}</style></div>;
}

function Metric({ title, value }: { title: string; value: number }) { return <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between text-slate-500"><div className="text-sm font-black uppercase tracking-wider">{title}</div><ShieldCheck size={18} /></div><div className="mt-4 text-5xl font-black">{value}</div></div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-sm font-black uppercase tracking-wider text-slate-500">{label}</span>{children}</label>; }
function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-slate-50 p-4"><div className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</div><div className="mt-1 text-sm font-black text-slate-700">{value}</div></div>; }
function Mini({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-slate-50 p-3"><div className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</div><div className="mt-1 font-mono text-xs font-black text-slate-700">{value}</div></div>; }
