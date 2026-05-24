import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  ClipboardList,
  FileText,
  PackageCheck,
  RefreshCw,
  Route,
  Search,
  ShieldCheck,
  Truck,
  Warehouse,
  Wallet,
} from "lucide-react";
import {
  calculateMerchantSettlement,
  createInvoice,
  createRiderHandover,
  dataEntryTemplateFields,
  financialDashboardMetrics,
  merchantMaster,
  nextWarehouseStatus,
  sampleShipments,
  warehouseTemplateFields,
  type EnterpriseShipment,
  type OperationalStatus,
  type ScanType,
} from "@/lib/enterpriseWorkflow";

type ViewKey = "control" | "warehouse" | "finance" | "templates";

const statusOrder: OperationalStatus[] = [
  "Pending Pickup",
  "Pickup Assigned",
  "Picked Up",
  "Received",
  "In Warehouse",
  "Sorting",
  "Bagged",
  "Dispatched",
  "Out for Delivery",
  "Delivered",
  "Failed Attempt",
  "Returned",
  "Finance Pending",
  "Closed",
];

export default function ProductionOperationsPage() {
  const [shipments, setShipments] = useState<EnterpriseShipment[]>(sampleShipments);
  const [view, setView] = useState<ViewKey>("control");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(sampleShipments[0]?.id ?? "");
  const [scanType, setScanType] = useState<ScanType>("Inbound Scan");
  const [notice, setNotice] = useState("Production control tower loaded with operational, warehouse, rider, finance, invoice, and waybill workflows.");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return shipments;
    return shipments.filter((shipment) =>
      [
        shipment.pickupId,
        shipment.deliverId,
        shipment.invoiceNo,
        shipment.waybillNo,
        shipment.trackingNo,
        shipment.merchantName,
        shipment.receiverName,
        shipment.status,
        shipment.riderName ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [query, shipments]);

  const selectedShipment = shipments.find((shipment) => shipment.id === selectedId) ?? shipments[0];
  const selectedMerchant = merchantMaster.find((merchant) => merchant.id === selectedShipment?.merchantId) ?? merchantMaster[0];
  const deliveredCodShipments = shipments.filter((shipment) => shipment.status === "Delivered" && shipment.codAmount > 0);
  const riderHandover = createRiderHandover({
    riderId: selectedShipment?.riderId ?? "RD009",
    riderName: selectedShipment?.riderName ?? "Rider",
    shiftDate: selectedShipment?.pickupDate ?? new Date().toISOString().slice(0, 10),
    routeZone: selectedShipment?.routeZone ?? "YGN Route",
    shipments: deliveredCodShipments,
    cashReceived: deliveredCodShipments.reduce((sum, shipment) => sum + shipment.codAmount, 0),
    verifiedBy: "Operations Cashier",
  });
  const merchantSettlement = calculateMerchantSettlement(shipments, selectedMerchant);
  const invoice = createInvoice(shipments, selectedMerchant, "Current Billing Period");

  const metrics = {
    total: shipments.length,
    active: shipments.filter((shipment) => !["Delivered", "Returned", "Closed"].includes(shipment.status)).length,
    delivered: shipments.filter((shipment) => shipment.status === "Delivered").length,
    exceptions: shipments.filter((shipment) => shipment.status === "Failed Attempt" || shipment.status === "Returned").length,
    cod: shipments.reduce((sum, shipment) => sum + shipment.codAmount, 0),
    financePending: shipments.filter((shipment) => shipment.status === "Finance Pending" || shipment.status === "Delivered").length,
  };

  function updateStatus(id: string, status: OperationalStatus) {
    setShipments((prev) => prev.map((shipment) => (shipment.id === id ? { ...shipment, status } : shipment)));
    setNotice(`${id} moved to ${status}. Linked IDs, waybill, invoice, COD, and settlement visibility are preserved.`);
  }

  function applyWarehouseScan() {
    if (!selectedShipment) return;
    const next = nextWarehouseStatus(scanType);
    setShipments((prev) =>
      prev.map((shipment) =>
        shipment.id === selectedShipment.id
          ? {
              ...shipment,
              status: next,
              bagCode: scanType === "Bag Scan" ? `BAG-${shipment.merchantCode}-${shipment.parcelCount}` : shipment.bagCode,
              routeZone: `${shipment.township} Route`,
            }
          : shipment,
      ),
    );
    setNotice(`${scanType} recorded for ${selectedShipment.waybillNo}; next status is ${next}.`);
  }

  function closeFinance(id: string) {
    setShipments((prev) =>
      prev.map((shipment) =>
        shipment.id === id
          ? {
              ...shipment,
              status: "Closed",
              invoiceStatus: "Closed",
              settlementStatus: "Closed",
              handoverStatus: shipment.codAmount > 0 ? "Locked" : shipment.handoverStatus,
            }
          : shipment,
      ),
    );
    setNotice(`${id} financially closed and locked.`);
  }

  return (
    <div className="min-h-screen bg-[#f6f8fc] p-8 text-slate-950">
      <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.24em] text-blue-700">Britium Express Production</p>
          <h1 className="mt-3 text-5xl font-black tracking-tight">Enterprise Operations Control Tower</h1>
          <p className="mt-4 max-w-5xl text-lg font-semibold leading-8 text-slate-500">
            Unified workflow from Customer Service pickup intake to Data Entry, Warehouse, Rider App, COD handover, invoices, waybills, settlement, and finance close.
          </p>
        </div>
        <button type="button" onClick={() => setNotice("Control tower refreshed.")} className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-7 py-4 text-lg font-black shadow-sm hover:bg-slate-50">
          <RefreshCw size={20} /> Refresh
        </button>
      </header>

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-6">
        <Metric title="Total Ways" value={metrics.total} icon={<Route size={18} />} />
        <Metric title="Active" value={metrics.active} icon={<Truck size={18} />} />
        <Metric title="Delivered" value={metrics.delivered} icon={<CheckCircle2 size={18} />} />
        <Metric title="Exceptions" value={metrics.exceptions} icon={<AlertTriangle size={18} />} />
        <Metric title="COD Expected" value={`${metrics.cod.toLocaleString()} Ks`} icon={<Wallet size={18} />} />
        <Metric title="Finance Pending" value={metrics.financePending} icon={<Banknote size={18} />} />
      </div>

      <div className="mt-8 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 xl:grid-cols-[1fr_180px]">
          <div className="relative">
            <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Pickup ID, Deliver ID, Invoice No, Waybill No, rider, merchant, status..." className="h-16 w-full rounded-2xl border border-slate-200 bg-white pl-14 pr-5 text-lg font-semibold outline-none focus:border-blue-500" />
          </div>
          <button type="button" onClick={() => setNotice("Search synced across shipment, waybill, invoice, COD, settlement, and rider views.")} className="rounded-2xl bg-blue-700 px-6 py-4 text-lg font-black text-white shadow-sm hover:bg-blue-800">Search / Sync</button>
        </div>
        <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-base font-bold text-emerald-700">{notice}</div>
      </div>

      <div className="mt-8 grid grid-cols-4 rounded-[28px] bg-slate-100 p-1 text-center text-base font-black text-slate-500">
        <TabButton active={view === "control"} onClick={() => setView("control")} label="Way Control" />
        <TabButton active={view === "warehouse"} onClick={() => setView("warehouse")} label="Warehouse" />
        <TabButton active={view === "finance"} onClick={() => setView("finance")} label="Finance" />
        <TabButton active={view === "templates"} onClick={() => setView("templates")} label="Templates" />
      </div>

      {view === "control" ? (
        <div className="mt-8 grid gap-8 xl:grid-cols-[1fr_440px]">
          <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-3xl font-black">Shipment Lifecycle Queue</h2>
            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
              <div className="grid grid-cols-7 gap-3 bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-500">
                <div>Waybill</div><div>Pickup</div><div>Merchant</div><div>Receiver</div><div>Status</div><div>Rider</div><div>Move</div>
              </div>
              {filtered.map((shipment) => (
                <div key={shipment.id} className="grid grid-cols-7 gap-3 border-t border-slate-100 px-4 py-4 text-sm font-semibold text-slate-700">
                  <div className="font-mono font-black text-blue-700">{shipment.waybillNo}</div>
                  <div className="font-mono text-xs">{shipment.pickupId}</div>
                  <div>{shipment.merchantName}</div>
                  <div>{shipment.receiverName}</div>
                  <div><StatusBadge value={shipment.status} /></div>
                  <div>{shipment.riderName ?? "Unassigned"}</div>
                  <div>
                    <select value={shipment.status} onChange={(event) => updateStatus(shipment.id, event.target.value as OperationalStatus)} className="w-full rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-bold">
                      {statusOrder.map((status) => <option key={status}>{status}</option>)}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <ShipmentCard shipment={selectedShipment} setSelectedId={setSelectedId} shipments={shipments} closeFinance={closeFinance} />
        </div>
      ) : view === "warehouse" ? (
        <div className="mt-8 grid gap-8 xl:grid-cols-[1fr_440px]">
          <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="flex items-center gap-3 text-3xl font-black"><Warehouse size={28} />Warehouse Scan Workspace</h2>
            <p className="mt-3 text-base font-semibold text-slate-500">Scan Waybill, Pickup ID, or Deliver ID. Merchant, expected count, COD, route, current status, and bag/dispatch fields auto-fill.</p>
            <div className="mt-7 grid gap-5 md:grid-cols-2">
              <Field label="Selected Waybill"><select value={selectedId} onChange={(event) => setSelectedId(event.target.value)} className="control">{shipments.map((shipment) => <option key={shipment.id} value={shipment.id}>{shipment.waybillNo} · {shipment.merchantName}</option>)}</select></Field>
              <Field label="Scan Type"><select value={scanType} onChange={(event) => setScanType(event.target.value as ScanType)} className="control"><option>Inbound Scan</option><option>Sorting Scan</option><option>Bag Scan</option><option>Dispatch Scan</option><option>Exception Scan</option></select></Field>
              <Field label="Pickup ID"><input value={selectedShipment?.pickupId ?? ""} readOnly className="control locked" /></Field>
              <Field label="Deliver ID"><input value={selectedShipment?.deliverId ?? ""} readOnly className="control locked" /></Field>
              <Field label="Invoice No"><input value={selectedShipment?.invoiceNo ?? ""} readOnly className="control locked" /></Field>
              <Field label="Merchant"><input value={`${selectedShipment?.merchantCode ?? ""} · ${selectedShipment?.merchantName ?? ""}`} readOnly className="control locked" /></Field>
              <Field label="Expected Parcel Count"><input value={selectedShipment?.parcelCount ?? 0} readOnly className="control locked" /></Field>
              <Field label="Current Status"><input value={selectedShipment?.status ?? ""} readOnly className="control locked" /></Field>
            </div>
            <button type="button" onClick={applyWarehouseScan} className="mt-7 rounded-2xl bg-blue-700 px-7 py-4 font-black uppercase tracking-wider text-white hover:bg-blue-800">Record Warehouse Scan</button>
          </section>
          <TemplateList title="Warehouse Template Fields" fields={warehouseTemplateFields} icon={<Warehouse size={22} />} />
        </div>
      ) : view === "finance" ? (
        <div className="mt-8 grid gap-8 xl:grid-cols-3">
          <FinanceCard title="Rider Handover" icon={<Wallet size={24} />} rows={[
            ["Settlement Ref", riderHandover.settlementRef],
            ["Rider", riderHandover.riderName],
            ["COD Expected", `${riderHandover.totalCodExpected.toLocaleString()} Ks`],
            ["Cash Received", `${riderHandover.totalCashReceived.toLocaleString()} Ks`],
            ["Shortage / Excess", `${riderHandover.shortageOrExcess.toLocaleString()} Ks`],
            ["Status", riderHandover.status],
          ]} />
          <FinanceCard title="Merchant Settlement" icon={<Banknote size={24} />} rows={[
            ["Settlement Batch", merchantSettlement.settlementBatch],
            ["Merchant", merchantSettlement.merchantName],
            ["COD Collected", `${merchantSettlement.codCollected.toLocaleString()} Ks`],
            ["Deductions", `${merchantSettlement.deductions.toLocaleString()} Ks`],
            ["Net Payable", `${merchantSettlement.netPayable.toLocaleString()} Ks`],
            ["Status", merchantSettlement.status],
          ]} />
          <FinanceCard title="Invoice / Waybill Close" icon={<FileText size={24} />} rows={[
            ["Invoice No", invoice.invoiceNo],
            ["Waybill No", invoice.waybillNo],
            ["Delivered", `${invoice.deliveredCount}`],
            ["Failed / Returned", `${invoice.failedReturnedCount}`],
            ["Net", `${invoice.netPayableOrReceivable.toLocaleString()} Ks`],
            ["Status", invoice.paymentStatus],
          ]} />
          <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm xl:col-span-3">
            <h2 className="text-3xl font-black">Financial Monitoring Dashboard Metrics</h2>
            <div className="mt-6 grid gap-3 md:grid-cols-3 xl:grid-cols-4">
              {financialDashboardMetrics.map((metric) => <div key={metric} className="rounded-2xl bg-slate-50 p-4 text-sm font-black text-slate-600">{metric}</div>)}
            </div>
          </section>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 xl:grid-cols-2">
          <TemplateList title="Data Entry Upload Template" fields={dataEntryTemplateFields} icon={<ClipboardList size={22} />} />
          <TemplateList title="Warehouse Template" fields={warehouseTemplateFields} icon={<Warehouse size={22} />} />
        </div>
      )}

      <style>{`.control{height:58px;width:100%;border-radius:18px;border:1px solid #e2e8f0;padding:0 18px;font-size:16px;font-weight:700;outline:none;background:white}.control:focus{border-color:#2563eb}.locked{background:#f1f5f9;color:#475569}`}</style>
    </div>
  );
}

function Metric({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) {
  return <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between text-slate-500"><div className="text-xs font-black uppercase tracking-wider">{title}</div>{icon}</div><div className="mt-4 text-3xl font-black">{value}</div></div>;
}
function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) { return <button type="button" onClick={onClick} className={`rounded-2xl py-4 ${active ? "bg-white text-blue-700 shadow" : ""}`}>{label}</button>; }
function StatusBadge({ value }: { value: string }) { return <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-black uppercase text-blue-700">{value}</span>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-sm font-black uppercase tracking-wider text-slate-500">{label}</span>{children}</label>; }
function Mini({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-slate-50 p-3"><div className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</div><div className="mt-1 font-mono text-xs font-black text-slate-700">{value}</div></div>; }
function ShipmentCard({ shipment, shipments, setSelectedId, closeFinance }: { shipment?: EnterpriseShipment; shipments: EnterpriseShipment[]; setSelectedId: (id: string) => void; closeFinance: (id: string) => void }) { if (!shipment) return null; return <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm"><h2 className="text-3xl font-black">Active Record</h2><select value={shipment.id} onChange={(event) => setSelectedId(event.target.value)} className="control mt-5">{shipments.map((row) => <option key={row.id} value={row.id}>{row.waybillNo} · {row.merchantName}</option>)}</select><div className="mt-5 grid grid-cols-2 gap-3"><Mini label="Pickup ID" value={shipment.pickupId} /><Mini label="Deliver ID" value={shipment.deliverId} /><Mini label="Invoice" value={shipment.invoiceNo} /><Mini label="Waybill" value={shipment.waybillNo} /><Mini label="POD" value={shipment.podStatus ?? "Pending"} /><Mini label="COD" value={`${shipment.codAmount.toLocaleString()} Ks`} /></div><button type="button" onClick={() => closeFinance(shipment.id)} className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-6 py-3 font-black text-white"><PackageCheck size={18} /> Finance Close</button></section>; }
function FinanceCard({ title, icon, rows }: { title: string; icon: React.ReactNode; rows: Array<[string, string]> }) { return <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm"><h2 className="flex items-center gap-3 text-2xl font-black">{icon}{title}</h2><div className="mt-5 space-y-3">{rows.map(([label, value]) => <div key={label} className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4"><span className="text-sm font-black uppercase tracking-wider text-slate-400">{label}</span><span className="text-right font-black text-slate-800">{value}</span></div>)}</div></section>; }
function TemplateList({ title, fields, icon }: { title: string; fields: string[]; icon: React.ReactNode }) { return <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm"><h2 className="flex items-center gap-3 text-3xl font-black">{icon}{title}</h2><div className="mt-6 grid gap-2 md:grid-cols-2">{fields.map((field, index) => <div key={field} className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600"><span className="mr-2 text-slate-400">{index + 1}.</span>{field}</div>)}</div></section>; }
