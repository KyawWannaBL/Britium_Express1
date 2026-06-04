import React, { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ClipboardList, Headphones, PackagePlus, RefreshCw, Search, ShieldCheck, Truck } from "lucide-react";
import { generateOperationalIds, merchantMaster, type MerchantMaster, type PaymentMethod } from "@/lib/enterpriseWorkflow";

type Priority = "Low" | "Medium" | "High" | "Urgent";
type Status = "DATA ENTRY IN PROGRESS" | "READY FOR DATA ENTRY" | "ASSIGNED" | "COMPLETED";

type PickupRequest = {
  pickupId: string;
  deliverId: string;
  invoiceNo: string;
  waybillNo: string;
  merchantId: string;
  merchantName: string;
  merchantCode: string;
  merchantAddress: string;
  pickupDate: string;
  pickupTime: string;
  parcelCount: number;
  payment: PaymentMethod;
  priority: Priority;
  status: Status;
};

type TicketRow = {
  ticketNo: string;
  subject: string;
  description: string;
  priority: Priority;
  pickupId?: string;
};

function pad3(value: number) {
  return String(Math.max(0, value)).padStart(3, "0");
}

function getMerchant(merchantId: string): MerchantMaster {
  return merchantMaster.find((row) => row.id === merchantId) ?? merchantMaster[0];
}

function createPickupFromMaster(merchantId: string, pickupDate: string, parcelCount: number, priority: Priority, status: Status): PickupRequest {
  const merchant = getMerchant(merchantId);
  return {
    ...generateOperationalIds(pickupDate, merchant.code, parcelCount),
    merchantId: merchant.id,
    merchantName: merchant.name,
    merchantCode: merchant.code,
    merchantAddress: merchant.pickupAddress,
    pickupDate,
    pickupTime: merchant.defaultPickupTime,
    parcelCount,
    payment: merchant.paymentMethod,
    priority,
    status,
  };
}

const initialPickups: PickupRequest[] = [
  createPickupFromMaster("MRC-002", "2026-05-25", 15, "Medium", "DATA ENTRY IN PROGRESS"),
  createPickupFromMaster("MRC-001", "2026-05-25", 15, "High", "READY FOR DATA ENTRY"),
];

export default function CustomerServicePortalPage() {
  const [pickups, setPickups] = useState<PickupRequest[]>(initialPickups);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [tab, setTab] = useState<"pickup" | "tickets" | "shipment">("pickup");
  const [query, setQuery] = useState("");
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketPriority, setTicketPriority] = useState<Priority>("Medium");
  const [merchantId, setMerchantId] = useState(merchantMaster[1]?.id ?? merchantMaster[0]?.id ?? "");
  const [pickupDate, setPickupDate] = useState("2026-05-25");
  const [parcelCount, setParcelCount] = useState("15");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [notice, setNotice] = useState("Customer Service queue is ready. Pickup merchant selection is synchronized with merchant master data.");

  const merchant = useMemo(() => getMerchant(merchantId), [merchantId]);
  const count = Math.max(1, Number(parcelCount) || 1);
  const ids = useMemo(() => generateOperationalIds(pickupDate, merchant.code, count), [count, merchant.code, pickupDate]);

  const filteredPickups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pickups;
    return pickups.filter((pickup) => Object.values(pickup).join(" ").toLowerCase().includes(q));
  }, [pickups, query]);

  function createPickup() {
    const next: PickupRequest = {
      ...ids,
      merchantId: merchant.id,
      merchantName: merchant.name,
      merchantCode: merchant.code,
      merchantAddress: merchant.pickupAddress,
      pickupDate,
      pickupTime: merchant.defaultPickupTime,
      parcelCount: count,
      payment: merchant.paymentMethod,
      priority,
      status: "DATA ENTRY IN PROGRESS",
    };
    setPickups((prev) => [next, ...prev.filter((row) => row.pickupId !== next.pickupId)]);
    setNotice(`${next.pickupId} created for Data Entry from ${merchant.name}. ${next.deliverId}, ${next.invoiceNo}, and ${next.waybillNo} were auto-filled from master data.`);
  }

  function createTicket() {
    if (!ticketSubject.trim()) {
      setNotice("Ticket subject is required.");
      return;
    }
    const next: TicketRow = {
      ticketNo: `CS-${pad3(tickets.length + 1)}`,
      subject: ticketSubject.trim(),
      description: ticketDescription.trim() || "Customer request requires follow-up.",
      priority: ticketPriority,
      pickupId: filteredPickups[0]?.pickupId,
    };
    setTickets((prev) => [next, ...prev]);
    setTicketSubject("");
    setTicketDescription("");
    setNotice(`${next.ticketNo} created successfully.`);
  }

  const urgentOpen = tickets.filter((ticket) => ticket.priority === "High" || ticket.priority === "Urgent").length;

  return (
    <div className="min-h-screen bg-[#f6f8fc] p-8 text-slate-950">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-5xl font-black tracking-tight">Customer Service</h1>
          <p className="mt-4 text-lg font-semibold text-slate-500">Tickets, pickup intake, shipment search, backend queue, supervisor assignment, and notifications.</p>
        </div>
        <button type="button" onClick={() => setNotice("Customer Service queue refreshed from merchant master data.")} className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-7 py-4 text-lg font-black shadow-sm hover:bg-slate-50"><RefreshCw size={20} />Refresh</button>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        <Metric title="Total Tickets" value={tickets.length} icon={<Headphones size={18} />} />
        <Metric title="Open Requests" value={pickups.length} icon={<ClipboardList size={18} />} />
        <Metric title="Pickup Requests" value={pickups.length} icon={<PackagePlus size={18} />} />
        <Metric title="Urgent Open" value={urgentOpen} icon={<AlertTriangle size={18} />} />
        <Metric title="Merchant Options" value={merchantMaster.length} icon={<ShieldCheck size={18} />} />
      </div>

      <div className="mt-8 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 xl:grid-cols-[1fr_180px]">
          <div className="relative">
            <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search pickup ID, merchant, phone, ticket, tracking..." className="h-16 w-full rounded-2xl border border-slate-200 bg-white pl-14 pr-5 text-lg font-semibold outline-none focus:border-blue-500" />
          </div>
          <button type="button" onClick={() => setNotice("Search synced with canonical pickup records and merchant master data.")} className="rounded-2xl bg-blue-700 px-6 py-4 text-lg font-black text-white shadow-sm hover:bg-blue-800">Search / Sync</button>
        </div>
        <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1fr_160px_150px]">
          <input value={ticketSubject} onChange={(event) => setTicketSubject(event.target.value)} placeholder="New ticket subject" className="h-14 rounded-2xl border border-slate-200 px-5 text-base font-semibold outline-none focus:border-blue-500" />
          <input value={ticketDescription} onChange={(event) => setTicketDescription(event.target.value)} placeholder="Description / customer request" className="h-14 rounded-2xl border border-slate-200 px-5 text-base font-semibold outline-none focus:border-blue-500" />
          <select value={ticketPriority} onChange={(event) => setTicketPriority(event.target.value as Priority)} className="h-14 rounded-2xl border border-slate-200 px-4 text-base font-black outline-none focus:border-blue-500"><option>Low</option><option>Medium</option><option>High</option><option>Urgent</option></select>
          <button type="button" onClick={createTicket} className="rounded-2xl bg-blue-700 px-6 py-3 text-base font-black text-white hover:bg-blue-800">Create Ticket</button>
        </div>
        <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-base font-bold text-emerald-700"><CheckCircle2 className="mr-2 inline" size={18} />{notice}</div>
      </div>

      <div className="mt-8 grid grid-cols-3 rounded-[28px] bg-slate-100 p-1 text-center text-base font-black text-slate-500">
        <button type="button" onClick={() => setTab("pickup")} className={`rounded-2xl py-4 ${tab === "pickup" ? "bg-white text-blue-700 shadow" : ""}`}>Pickup Request Intake</button>
        <button type="button" onClick={() => setTab("tickets")} className={`rounded-2xl py-4 ${tab === "tickets" ? "bg-white text-blue-700 shadow" : ""}`}>Tickets</button>
        <button type="button" onClick={() => setTab("shipment")} className={`rounded-2xl py-4 ${tab === "shipment" ? "bg-white text-blue-700 shadow" : ""}`}>Shipment Search</button>
      </div>

      {tab === "pickup" ? <PickupPanel merchant={merchant} ids={ids} pickupDate={pickupDate} setPickupDate={setPickupDate} parcelCount={parcelCount} setParcelCount={setParcelCount} merchantId={merchantId} setMerchantId={setMerchantId} priority={priority} setPriority={setPriority} createPickup={createPickup} pickups={filteredPickups} /> : tab === "tickets" ? <TicketsPanel tickets={tickets} /> : <ShipmentPanel pickups={filteredPickups} />}

      <style>{`.control{height:58px;width:100%;border-radius:18px;border:1px solid #e2e8f0;padding:0 18px;font-size:16px;font-weight:700;outline:none;background:white}.control:focus{border-color:#2563eb}.locked{background:#f1f5f9;color:#475569}.idfield{background:#eff6ff;color:#1d4ed8;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-weight:900}`}</style>
    </div>
  );
}

function PickupPanel(props: { merchant: MerchantMaster; ids: ReturnType<typeof generateOperationalIds>; pickupDate: string; setPickupDate: (value: string) => void; parcelCount: string; setParcelCount: (value: string) => void; merchantId: string; setMerchantId: (value: string) => void; priority: Priority; setPriority: (value: Priority) => void; createPickup: () => void; pickups: PickupRequest[] }) {
  return <div className="mt-8 grid gap-8 xl:grid-cols-[1fr_430px]"><section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm"><h2 className="text-3xl font-black">Create pickup request for Data Entry</h2><p className="mt-3 text-base font-semibold text-slate-500">Select merchant from Merchant Master. Related fields auto-fill and lock for checking only.</p><div className="mt-8 grid gap-5 md:grid-cols-3"><Field label="Merchant"><select value={props.merchantId} onChange={(event) => props.setMerchantId(event.target.value)} className="control">{merchantMaster.map((row) => <option key={row.id} value={row.id}>{row.name} · {row.code}</option>)}</select></Field><Field label="Merchant Code"><input readOnly value={props.merchant.code} className="control locked" /></Field><Field label="Contact Person"><input readOnly value={props.merchant.contactPerson} className="control locked" /></Field><Field label="Phone"><input readOnly value={props.merchant.phone} className="control locked" /></Field><Field label="Pickup Address"><input readOnly value={props.merchant.pickupAddress} className="control locked" /></Field><Field label="Township / City"><input readOnly value={`${props.merchant.pickupTownship}, ${props.merchant.pickupCity}`} className="control locked" /></Field><Field label="Pickup Time"><input readOnly value={props.merchant.defaultPickupTime} className="control locked" /></Field><Field label="Tariff Profile"><input readOnly value={props.merchant.tariffProfile} className="control locked" /></Field><Field label="Billing Profile"><input readOnly value={props.merchant.billingProfile} className="control locked" /></Field><Field label="Pickup Date"><input type="date" value={props.pickupDate} onChange={(event) => props.setPickupDate(event.target.value)} className="control" /></Field><Field label="Pickup Parcels"><input type="number" min="1" value={props.parcelCount} onChange={(event) => props.setParcelCount(event.target.value)} className="control" /></Field><Field label="Payment Method"><input readOnly value={props.merchant.paymentMethod} className="control locked" /></Field><Field label="Priority"><select value={props.priority} onChange={(event) => props.setPriority(event.target.value as Priority)} className="control"><option>Low</option><option>Medium</option><option>High</option><option>Urgent</option></select></Field><Field label="Pickup ID"><input readOnly value={props.ids.pickupId} className="control idfield" /></Field><Field label="Deliver ID"><input readOnly value={props.ids.deliverId} className="control idfield" /></Field><Field label="Invoice No"><input readOnly value={props.ids.invoiceNo} className="control idfield" /></Field><Field label="Waybill No"><input readOnly value={props.ids.waybillNo} className="control idfield" /></Field></div><button type="button" onClick={props.createPickup} className="mt-7 inline-flex items-center gap-3 rounded-2xl bg-blue-700 px-7 py-4 text-base font-black uppercase tracking-wider text-white hover:bg-blue-800"><Truck size={18} />Create Pickup Request</button></section><section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm"><h2 className="text-3xl font-black">Recent CS Pickups</h2><div className="mt-6 space-y-4">{props.pickups.map((pickup) => <div key={pickup.pickupId} className="rounded-2xl border border-slate-200 p-5 shadow-sm"><div className="font-mono text-lg font-black text-blue-700">{pickup.pickupId}</div><div className="mt-2 text-lg font-black">{pickup.merchantName}</div><div className="mt-1 text-sm font-semibold text-slate-500">{pickup.merchantAddress}</div><div className="mt-4 grid grid-cols-2 gap-3 text-sm"><Mini label="Deliver ID" value={pickup.deliverId} /><Mini label="Invoice" value={pickup.invoiceNo} /><Mini label="Waybill" value={pickup.waybillNo} /><Mini label="Parcels" value={`${pickup.parcelCount}`} /></div><div className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-500">{pickup.status}</div></div>)}</div></section></div>;
}

function TicketsPanel({ tickets }: { tickets: TicketRow[] }) { return <section className="mt-8 rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm"><h2 className="text-3xl font-black">Tickets</h2><div className="mt-6 space-y-3">{tickets.length === 0 ? <div className="rounded-2xl bg-slate-50 p-6 font-semibold text-slate-500">No tickets created yet.</div> : tickets.map((ticket) => <div key={ticket.ticketNo} className="rounded-2xl border border-slate-200 p-5"><div className="font-black text-blue-700">{ticket.ticketNo}</div><div className="mt-1 text-lg font-black">{ticket.subject}</div><div className="mt-1 text-sm text-slate-500">{ticket.description}</div></div>)}</div></section>; }
function ShipmentPanel({ pickups }: { pickups: PickupRequest[] }) { return <section className="mt-8 rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm"><h2 className="text-3xl font-black">Shipment Search</h2><p className="mt-3 text-base font-semibold text-slate-500">Use Pickup ID, Deliver ID, Invoice No, or Waybill No to trace the shipment.</p><div className="mt-6 grid gap-4 md:grid-cols-4">{pickups.map((pickup) => <div key={pickup.pickupId} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="font-mono font-black text-blue-700">{pickup.waybillNo}</div><div className="mt-2 text-sm font-semibold text-slate-600">{pickup.merchantName}</div><div className="mt-1 text-xs text-slate-400">{pickup.status}</div></div>)}</div></section>; }
function Metric({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) { return <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between text-slate-500"><div className="text-sm font-black uppercase tracking-wider">{title}</div>{icon}</div><div className="mt-4 text-5xl font-black">{value}</div></div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-sm font-black uppercase tracking-wider text-slate-500">{label}</span>{children}</label>; }
function Mini({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-slate-50 p-3"><div className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</div><div className="mt-1 font-mono text-xs font-black text-slate-700">{value}</div></div>; }
