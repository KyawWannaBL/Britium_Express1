import React, { useMemo, useState } from "react";
import { CheckCircle2, ClipboardList, Database, FileSpreadsheet, RefreshCw, Search, ShieldCheck, Warehouse } from "lucide-react";

type PaymentMethod = "COD" | "Prepaid" | "Account" | "Collect";
type QueueStatus = "READY" | "CHECKING" | "WAREHOUSE READY" | "ERROR";

type Merchant = {
  id: string;
  name: string;
  code: string;
  phone: string;
  address: string;
  township: string;
  city: string;
  tariff: string;
  payment: PaymentMethod;
};

type EntryRow = {
  pickupId: string;
  deliverId: string;
  invoiceNo: string;
  waybillNo: string;
  merchantId: string;
  merchantName: string;
  merchantCode: string;
  parcelCount: number;
  payment: PaymentMethod;
  codAmount: number;
  status: QueueStatus;
};

const merchants: Merchant[] = [
  { id: "MRC-001", name: "BBK Merchant", code: "BBK", phone: "09-***-001", address: "Default pickup address 1", township: "South Okkalapa", city: "Yangon", tariff: "Same Day Zone A", payment: "COD" },
  { id: "MRC-002", name: "BBW Merchant", code: "BBW", phone: "09-***-002", address: "Default pickup address 2", township: "East Dagon", city: "Yangon", tariff: "Account Zone B", payment: "Account" },
  { id: "MRC-003", name: "CTF Merchant", code: "CTF", phone: "09-***-003", address: "Default pickup address 3", township: "Hlaing", city: "Yangon", tariff: "Standard", payment: "Prepaid" },
];

const warehouseColumns = ["Scan Date", "Scan Time", "Warehouse Branch", "Operator", "Pickup ID", "Deliver ID", "Invoice No", "Waybill No", "Merchant Code", "Expected Parcel Count", "Scanned Parcel Count", "Current Status", "Bag Code", "Validation Status"];
const dataEntryColumns = ["Row No", "Requester Type", "Merchant ID", "Merchant Code", "Merchant Name", "Pickup Date", "Pickup Time", "Pickup Parcels", "Pickup ID", "Deliver ID", "Invoice No", "Waybill No", "Recipient Name", "Recipient Phone", "Delivery Address", "Payment Method", "COD Amount", "Service Type", "Priority", "Upload Status", "API Message"];

function pad3(value: number) {
  return String(Math.max(0, value)).padStart(3, "0");
}

function mmdd(date: string) {
  const [, month = "00", day = "00"] = date.split("-");
  return `${month}${day}`;
}

function makeIds(date: string, code: string, count: number) {
  const safeCode = code.toUpperCase().slice(0, 3).padEnd(3, "X");
  return {
    pickupId: `P${mmdd(date)}-${safeCode}-${pad3(count)}`,
    deliverId: `D${mmdd(date)}-${safeCode}-${pad3(count + 1)}`,
    invoiceNo: `I${mmdd(date)}-${safeCode}-${pad3(count)}`,
    waybillNo: `W${mmdd(date)}-${safeCode}-${pad3(count)}`,
  };
}

export default function DataEntryPortalPage() {
  const [merchantId, setMerchantId] = useState("MRC-002");
  const [pickupDate, setPickupDate] = useState("2026-05-25");
  const [parcelCount, setParcelCount] = useState("15");
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<EntryRow[]>([]);
  const [notice, setNotice] = useState("Data Entry dashboard restored. Master data, tariff data, employee records, and historical support are available in canonical mode.");

  const merchant = useMemo(() => merchants.find((item) => item.id === merchantId) ?? merchants[0], [merchantId]);
  const count = Math.max(1, Number(parcelCount) || 1);
  const ids = useMemo(() => makeIds(pickupDate, merchant.code, count), [count, merchant.code, pickupDate]);

  const queue = useMemo(() => {
    const source = rows.length ? rows : [
      { ...makeIds("2026-05-25", "BBW", 15), merchantId: "MRC-002", merchantName: "BBW Merchant", merchantCode: "BBW", parcelCount: 15, payment: "Account" as PaymentMethod, codAmount: 0, status: "CHECKING" as QueueStatus },
      { ...makeIds("2026-05-25", "BBK", 15), merchantId: "MRC-001", merchantName: "BBK Merchant", merchantCode: "BBK", parcelCount: 15, payment: "COD" as PaymentMethod, codAmount: 0, status: "READY" as QueueStatus },
    ];
    const q = query.trim().toLowerCase();
    if (!q) return source;
    return source.filter((row) => Object.values(row).join(" ").toLowerCase().includes(q));
  }, [query, rows]);

  function addRow() {
    const next: EntryRow = {
      ...ids,
      merchantId: merchant.id,
      merchantName: merchant.name,
      merchantCode: merchant.code,
      parcelCount: count,
      payment: merchant.payment,
      codAmount: merchant.payment === "COD" ? 0 : 0,
      status: "READY",
    };
    setRows((prev) => [next, ...prev.filter((row) => row.pickupId !== next.pickupId)]);
    setNotice(`${next.pickupId} added. Deliver ID, Invoice No, and Waybill No were auto-filled from master data.`);
  }

  return (
    <div className="min-h-screen bg-[#f6f8fc] p-8 text-slate-950">
      <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.24em] text-slate-400">Britium Enterprise Portal</p>
            <h1 className="mt-3 text-5xl font-black tracking-tight">Data Entry Dashboard</h1>
            <p className="mt-4 max-w-4xl text-lg font-semibold leading-8 text-slate-500">Use master data, merchant records, tariff records, employee records, historical entries, and warehouse formats to reduce misspelling, inconsistent formats, and incorrect account information.</p>
          </div>
          <button type="button" onClick={() => setNotice("Master data and data-entry queue refreshed.")} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 font-black shadow-sm hover:bg-slate-50"><RefreshCw size={18} /> Refresh</button>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <Module title="Merchant Master Data" value={`${merchants.length} active records`} icon={<Database size={20} />} />
          <Module title="Tariff Master Data" value="Zone and fee auto-fill ready" icon={<FileSpreadsheet size={20} />} />
          <Module title="Employee Master Data" value="Pickup by / verifier lookup ready" icon={<ShieldCheck size={20} />} />
          <Module title="Historical Entry Support" value={`${queue.length} canonical examples`} icon={<ClipboardList size={20} />} />
        </div>

        <div className="mt-8 rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-base font-bold text-emerald-700"><CheckCircle2 className="mr-2 inline" size={18} />{notice}</div>
      </section>

      <div className="mt-8 grid gap-8 xl:grid-cols-[1fr_520px]">
        <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-3xl font-black">Create Data Entry Record</h2>
          <p className="mt-3 text-base font-semibold text-slate-500">Merchant lookup auto-fills code, phone, pickup address, township, city, tariff, and payment profile. ID fields are generated and locked.</p>

          <div className="mt-7 grid gap-5 md:grid-cols-3">
            <Field label="Merchant">
              <select value={merchantId} onChange={(event) => setMerchantId(event.target.value)} className="control">
                {merchants.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </Field>
            <Field label="Merchant Code"><input readOnly value={merchant.code} className="control locked" /></Field>
            <Field label="Merchant Phone"><input readOnly value={merchant.phone} className="control locked" /></Field>
            <Field label="Pickup Address"><input readOnly value={merchant.address} className="control locked" /></Field>
            <Field label="Township / City"><input readOnly value={`${merchant.township}, ${merchant.city}`} className="control locked" /></Field>
            <Field label="Tariff"><input readOnly value={merchant.tariff} className="control locked" /></Field>
            <Field label="Pickup Date"><input type="date" value={pickupDate} onChange={(event) => setPickupDate(event.target.value)} className="control" /></Field>
            <Field label="Pickup Parcels"><input type="number" min="1" value={parcelCount} onChange={(event) => setParcelCount(event.target.value)} className="control" /></Field>
            <Field label="Payment Method"><input readOnly value={merchant.payment} className="control locked" /></Field>
            <Field label="Pickup ID"><input readOnly value={ids.pickupId} className="control idfield" /></Field>
            <Field label="Deliver ID"><input readOnly value={ids.deliverId} className="control idfield" /></Field>
            <Field label="Invoice No"><input readOnly value={ids.invoiceNo} className="control idfield" /></Field>
            <Field label="Waybill No"><input readOnly value={ids.waybillNo} className="control idfield" /></Field>
          </div>

          <button type="button" onClick={addRow} className="mt-7 rounded-2xl bg-blue-700 px-7 py-4 font-black uppercase tracking-wider text-white hover:bg-blue-800">Add to Data Entry Queue</button>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-3xl font-black">Data Entry Queue</h2>
          <div className="relative mt-6">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ID, merchant, status..." className="h-14 w-full rounded-2xl border border-slate-200 pl-12 pr-4 font-semibold outline-none focus:border-blue-500" />
          </div>
          <div className="mt-5 space-y-4">
            {queue.map((row) => (
              <div key={row.pickupId} className="rounded-2xl border border-slate-200 p-5">
                <div className="font-mono text-lg font-black text-blue-700">{row.pickupId}</div>
                <div className="mt-2 font-black">{row.merchantName} · {row.parcelCount} parcels</div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs font-bold text-slate-600">
                  <Mini label="Deliver" value={row.deliverId} />
                  <Mini label="Invoice" value={row.invoiceNo} />
                  <Mini label="Waybill" value={row.waybillNo} />
                </div>
                <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-500">{row.status}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-2">
        <TemplateCard title="Data Entry Template Format" columns={dataEntryColumns} />
        <TemplateCard title="Warehouse Template Format" columns={warehouseColumns} icon={<Warehouse size={20} />} />
      </div>

      <style>{`.control{height:58px;width:100%;border-radius:18px;border:1px solid #e2e8f0;padding:0 18px;font-size:16px;font-weight:700;outline:none;background:white}.control:focus{border-color:#2563eb}.locked{background:#f1f5f9;color:#475569}.idfield{background:#eff6ff;color:#1d4ed8;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-weight:900}`}</style>
    </div>
  );
}

function Module({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return <div className="rounded-2xl bg-slate-50 p-6"><div className="flex items-center gap-2 font-black">{icon}{title}</div><p className="mt-3 font-semibold text-slate-500">{value}</p></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-sm font-black uppercase tracking-wider text-slate-500">{label}</span>{children}</label>;
}

function Mini({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-slate-50 p-3"><div className="text-[10px] uppercase tracking-wider text-slate-400">{label}</div><div className="mt-1 font-mono text-[11px] font-black">{value}</div></div>;
}

function TemplateCard({ title, columns, icon }: { title: string; columns: string[]; icon?: React.ReactNode }) {
  return <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm"><h2 className="flex items-center gap-2 text-2xl font-black">{icon}{title}</h2><div className="mt-5 grid gap-2 md:grid-cols-2">{columns.map((column, index) => <div key={column} className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600"><span className="mr-2 text-slate-400">{index + 1}.</span>{column}</div>)}</div></section>;
}
