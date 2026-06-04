import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Package2, RefreshCw, Search, Truck } from "lucide-react";
import {
  generateOperationalIds,
  type MerchantMaster,
  type PaymentMethod,
} from "@/lib/enterpriseWorkflow";
import { loadLiveMasterDataSnapshot } from "@/lib/liveMasterData";

type DeliveryRow = {
  pickupId: string;
  deliverId: string;
  invoiceNo: string;
  waybillNo: string;
  merchantId: string;
  merchantName: string;
  merchantCode: string;
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  packageCount: number;
  paymentMethod: PaymentMethod;
  status: string;
};

function makeDeliveryRow(input: {
  merchant: MerchantMaster;
  pickupDate: string;
  packageCount: number;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
}): DeliveryRow {
  const ids = generateOperationalIds(input.pickupDate, input.merchant.code, input.packageCount);
  return {
    ...ids,
    merchantId: input.merchant.id,
    merchantName: input.merchant.name,
    merchantCode: input.merchant.code,
    senderName: input.merchant.contactPerson || input.merchant.name,
    senderPhone: input.merchant.phone,
    senderAddress: input.merchant.pickupAddress,
    recipientName: input.recipientName || "Pending receiver",
    recipientPhone: input.recipientPhone || "Pending",
    recipientAddress: input.recipientAddress || "Pending delivery address",
    packageCount: input.packageCount,
    paymentMethod: input.merchant.paymentMethod,
    status: "pending_pickup",
  };
}

export default function CreateDelivery() {
  const [merchants, setMerchants] = useState<MerchantMaster[]>([]);
  const [merchantId, setMerchantId] = useState("");
  const [pickupDate, setPickupDate] = useState(new Date().toISOString().slice(0, 10));
  const [packageCountText, setPackageCountText] = useState("1");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [query, setQuery] = useState("");
  const [createdRows, setCreatedRows] = useState<DeliveryRow[]>([]);
  const [loadingMaster, setLoadingMaster] = useState(false);
  const [notice, setNotice] = useState("Create Delivery is loading the shared master-data snapshot.");

  async function syncMasterData() {
    setLoadingMaster(true);
    const snapshot = await loadLiveMasterDataSnapshot();
    setMerchants(snapshot.merchants);
    setMerchantId((current) =>
      snapshot.merchants.some((merchant) => merchant.id === current)
        ? current
        : snapshot.merchants[0]?.id ?? "",
    );
    setNotice(`Create Delivery synchronized with ${snapshot.merchants.length} Merchant Master records.`);
    setLoadingMaster(false);
  }

  useEffect(() => {
    void syncMasterData();
  }, []);

  const selectedMerchant = useMemo(
    () => merchants.find((merchant) => merchant.id === merchantId) ?? merchants[0],
    [merchantId, merchants],
  );
  const packageCount = Math.max(1, Number(packageCountText) || 1);
  const previewIds = useMemo(
    () => generateOperationalIds(pickupDate, selectedMerchant?.code ?? "XXX", packageCount),
    [packageCount, pickupDate, selectedMerchant?.code],
  );
  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return createdRows;
    return createdRows.filter((row) => Object.values(row).join(" ").toLowerCase().includes(q));
  }, [createdRows, query]);

  function createDelivery() {
    if (!selectedMerchant) {
      setNotice("No merchant master record is selected.");
      return;
    }

    const next = makeDeliveryRow({
      merchant: selectedMerchant,
      pickupDate,
      packageCount,
      recipientName,
      recipientPhone,
      recipientAddress,
    });
    setCreatedRows((current) => [next, ...current.filter((row) => row.waybillNo !== next.waybillNo)]);
    setNotice(`${next.waybillNo} created from synchronized Merchant Master data.`);
  }

  return (
    <div className="min-h-screen bg-[#f6f8fc] p-8 text-slate-950">
      <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.24em] text-blue-700">Britium Express</p>
          <h1 className="mt-3 text-5xl font-black tracking-tight">Create Delivery / Order Picking</h1>
          <p className="mt-4 max-w-5xl text-lg font-semibold leading-8 text-slate-500">
            Merchant selection now uses the same live master-data snapshot as Customer Service, Data Entry, Supervisor, and Warehouse.
          </p>
        </div>
        <button
          type="button"
          onClick={syncMasterData}
          className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-7 py-4 text-lg font-black shadow-sm hover:bg-slate-50"
        >
          <RefreshCw size={20} className={loadingMaster ? "animate-spin" : ""} />
          Sync Master Data
        </button>
      </header>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        <Metric title="Merchant Master" value={merchants.length} icon={<Package2 size={18} />} />
        <Metric title="Created Ways" value={createdRows.length} icon={<Truck size={18} />} />
        <Metric title="Sync Status" value={loadingMaster ? 0 : 1} icon={<CheckCircle2 size={18} />} />
      </div>

      <div className="mt-8 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="relative">
          <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search created waybill, merchant, recipient..."
            className="h-16 w-full rounded-2xl border border-slate-200 bg-white pl-14 pr-5 text-lg font-semibold outline-none focus:border-blue-500"
          />
        </div>
        <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-base font-bold text-emerald-700">
          <CheckCircle2 className="mr-2 inline" size={18} />
          {notice}
        </div>
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-[1fr_460px]">
        <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-3xl font-black">Create Delivery</h2>
          <p className="mt-3 text-base font-semibold text-slate-500">
            Merchant code, phone, pickup address, township, payment, and operational IDs are locked from master data.
          </p>
          <div className="mt-7 grid gap-5 md:grid-cols-3">
            <Field label="Merchant">
              <select value={merchantId} onChange={(event) => setMerchantId(event.target.value)} className="control">
                {merchants.map((merchant) => (
                  <option key={merchant.id} value={merchant.id}>{merchant.name} - {merchant.code}</option>
                ))}
              </select>
            </Field>
            <Field label="Merchant Code"><input readOnly value={selectedMerchant?.code ?? ""} className="control locked" /></Field>
            <Field label="Merchant Phone"><input readOnly value={selectedMerchant?.phone ?? ""} className="control locked" /></Field>
            <Field label="Pickup Address"><input readOnly value={selectedMerchant?.pickupAddress ?? ""} className="control locked" /></Field>
            <Field label="Township / City"><input readOnly value={selectedMerchant ? `${selectedMerchant.pickupTownship}, ${selectedMerchant.pickupCity}` : ""} className="control locked" /></Field>
            <Field label="Payment Method"><input readOnly value={selectedMerchant?.paymentMethod ?? ""} className="control locked" /></Field>
            <Field label="Pickup Date"><input type="date" value={pickupDate} onChange={(event) => setPickupDate(event.target.value)} className="control" /></Field>
            <Field label="Package Count"><input type="number" min="1" value={packageCountText} onChange={(event) => setPackageCountText(event.target.value)} className="control" /></Field>
            <Field label="Recipient Name"><input value={recipientName} onChange={(event) => setRecipientName(event.target.value)} className="control" /></Field>
            <Field label="Recipient Phone"><input value={recipientPhone} onChange={(event) => setRecipientPhone(event.target.value)} className="control" /></Field>
            <Field label="Recipient Address"><input value={recipientAddress} onChange={(event) => setRecipientAddress(event.target.value)} className="control" /></Field>
            <Field label="Pickup ID"><input readOnly value={previewIds.pickupId} className="control idfield" /></Field>
            <Field label="Deliver ID"><input readOnly value={previewIds.deliverId} className="control idfield" /></Field>
            <Field label="Invoice No"><input readOnly value={previewIds.invoiceNo} className="control idfield" /></Field>
            <Field label="Waybill No"><input readOnly value={previewIds.waybillNo} className="control idfield" /></Field>
          </div>
          <button
            type="button"
            onClick={createDelivery}
            className="mt-7 rounded-2xl bg-blue-700 px-7 py-4 font-black uppercase tracking-wider text-white hover:bg-blue-800"
          >
            Create Delivery
          </button>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-3xl font-black">Created Orders</h2>
          <div className="mt-6 space-y-4">
            {filteredRows.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-6 font-semibold text-slate-500">No delivery created yet.</div>
            ) : filteredRows.map((row) => (
              <div key={row.waybillNo} className="rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="font-mono text-lg font-black text-blue-700">{row.waybillNo}</div>
                <div className="mt-2 text-lg font-black">{row.merchantName}</div>
                <div className="mt-1 text-sm font-semibold text-slate-500">{row.senderAddress}</div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-xs font-bold text-slate-600">
                  <Mini label="Pickup" value={row.pickupId} />
                  <Mini label="Deliver" value={row.deliverId} />
                  <Mini label="Invoice" value={row.invoiceNo} />
                  <Mini label="Packages" value={`${row.packageCount}`} />
                </div>
                <div className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-500">{row.status}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <style>{`.control{height:58px;width:100%;border-radius:18px;border:1px solid #e2e8f0;padding:0 18px;font-size:16px;font-weight:700;outline:none;background:white}.control:focus{border-color:#2563eb}.locked{background:#f1f5f9;color:#475569}.idfield{background:#eff6ff;color:#1d4ed8;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-weight:900}`}</style>
    </div>
  );
}

function Metric({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between text-slate-500"><div className="text-sm font-black uppercase tracking-wider">{title}</div>{icon}</div><div className="mt-4 text-5xl font-black">{value}</div></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-sm font-black uppercase tracking-wider text-slate-500">{label}</span>{children}</label>;
}

function Mini({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-slate-50 p-3"><div className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</div><div className="mt-1 font-mono text-xs font-black text-slate-700">{value}</div></div>;
}
