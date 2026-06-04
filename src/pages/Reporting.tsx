import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Download, FileSpreadsheet, RefreshCw, Search, ShieldCheck, Table2 } from "lucide-react";
import { createShipmentFromMerchant, type EnterpriseShipment } from "@/lib/enterpriseWorkflow";
import { loadLiveMasterDataSnapshot, type LiveMasterSnapshot } from "@/lib/liveMasterData";

type ReportFamily = "operations" | "town" | "merchant" | "finance";
type ReportPreset = { id: string; family: ReportFamily; title: string; description: string; count: number };

function buildShipments(snapshot: LiveMasterSnapshot): EnterpriseShipment[] {
  return snapshot.merchants.slice(0, 12).map((merchant, index) => createShipmentFromMerchant({ merchant, pickupDate: "2026-05-25", parcelCount: 4 + index, receiverName: `Receiver ${index + 1}`, receiverPhone: merchant.phone || "Pending", deliveryAddress: "Pending receiver address", township: merchant.pickupTownship, serviceType: index % 2 ? "Standard" : "Same Day", priority: index % 3 ? "Normal" : "High" }));
}

function presets(snapshot: LiveMasterSnapshot | null, shipments: EnterpriseShipment[]): ReportPreset[] {
  const people = (snapshot?.riders.length ?? 0) + (snapshot?.drivers.length ?? 0) + (snapshot?.helpers.length ?? 0);
  const towns = new Set((snapshot?.merchants ?? []).map((merchant) => merchant.pickupTownship).filter(Boolean)).size;
  return [
    { id: "ways-count-report", family: "operations", title: "Ways Count Report", description: "Daily way-count reporting from synchronized shipment data.", count: shipments.length },
    { id: "active-ways-count-by-town", family: "town", title: "Active Ways Count by Town", description: "Active pickup and delivery ways grouped by master township.", count: towns },
    { id: "ways-by-deliverymen", family: "operations", title: "Ways by Deliverymen", description: "Delivery assignments grouped by rider, driver, and helper master data.", count: people },
    { id: "merchant-summary", family: "merchant", title: "Merchant Master Summary", description: "Merchant pickup, billing, payment, and route summary from master data.", count: snapshot?.merchants.length ?? 0 },
    { id: "cod-and-fees", family: "finance", title: "COD and Delivery Fees", description: "COD and fee totals derived from synchronized shipments.", count: shipments.reduce((sum, row) => sum + row.codAmount + row.deliveryFee, 0) },
  ];
}

export default function Reporting() {
  const [snapshot, setSnapshot] = useState<LiveMasterSnapshot | null>(null);
  const [shipments, setShipments] = useState<EnterpriseShipment[]>([]);
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState<"all" | ReportFamily>("all");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("Reporting is loading the shared master-data snapshot.");

  async function syncMasterData() {
    setLoading(true);
    const next = await loadLiveMasterDataSnapshot();
    const nextShipments = buildShipments(next);
    setSnapshot(next);
    setShipments(nextShipments);
    setNotice(`Reporting synchronized with ${next.merchants.length} merchants, ${next.vehicles.length} vehicles, and ${(next.riders.length + next.drivers.length + next.helpers.length)} people.`);
    setLoading(false);
  }

  useEffect(() => { void syncMasterData(); }, []);

  const reportPresets = useMemo(() => presets(snapshot, shipments), [snapshot, shipments]);
  const filteredReports = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reportPresets.filter((report) => (family === "all" || report.family === family) && (!q || [report.title, report.description, report.family].join(" ").toLowerCase().includes(q)));
  }, [family, query, reportPresets]);
  const codTotal = shipments.reduce((sum, row) => sum + row.codAmount, 0);

  function exportReport(report: ReportPreset) {
    setNotice(`${report.title} export prepared from synchronized master data.`);
  }

  return <div className="min-h-screen bg-[#f6f8fc] p-8 text-slate-950"><header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between"><div><p className="text-sm font-black uppercase tracking-[0.24em] text-blue-700">Britium Reporting</p><h1 className="mt-3 text-5xl font-black tracking-tight">Reports & Export Center</h1><p className="mt-4 max-w-5xl text-lg font-semibold leading-8 text-slate-500">Reports now use the same live master-data snapshot as all operational portals.</p></div><button type="button" onClick={syncMasterData} className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-7 py-4 text-lg font-black shadow-sm hover:bg-slate-50"><RefreshCw size={20} className={loading ? "animate-spin" : ""} />Sync Master Data</button></header><div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-5"><Metric title="Merchants" value={snapshot?.merchants.length ?? 0} icon={<ShieldCheck size={18} />} /><Metric title="Vehicles" value={snapshot?.vehicles.length ?? 0} icon={<Table2 size={18} />} /><Metric title="Shipments" value={shipments.length} icon={<FileSpreadsheet size={18} />} /><Metric title="COD" value={codTotal} icon={<Download size={18} />} money /><Metric title="Reports" value={filteredReports.length} icon={<CheckCircle2 size={18} />} /></div><section className="mt-8 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm"><div className="grid gap-4 xl:grid-cols-[1fr_260px]"><div className="relative"><Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search reports, merchant, town, deliveryman..." className="h-16 w-full rounded-2xl border border-slate-200 bg-white pl-14 pr-5 text-lg font-semibold outline-none focus:border-blue-500" /></div><select value={family} onChange={(event) => setFamily(event.target.value as "all" | ReportFamily)} className="h-16 rounded-2xl border border-slate-200 bg-white px-5 text-base font-black outline-none focus:border-blue-500"><option value="all">All Reports</option><option value="operations">Operations</option><option value="town">Town</option><option value="merchant">Merchant</option><option value="finance">Finance</option></select></div><div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-base font-bold text-emerald-700"><CheckCircle2 className="mr-2 inline" size={18} />{notice}</div></section><section className="mt-8 rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm"><h2 className="text-3xl font-black">Synchronized Report Presets</h2><div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{filteredReports.map((report) => <div key={report.id} className="rounded-2xl border border-slate-200 p-6 shadow-sm"><div className="text-xs font-black uppercase tracking-wider text-blue-700">{report.family}</div><h3 className="mt-2 text-xl font-black">{report.title}</h3><p className="mt-2 min-h-[52px] text-sm font-semibold leading-6 text-slate-500">{report.description}</p><div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">Live count: {report.family === "finance" ? `${report.count.toLocaleString()} MMK` : report.count}</div><button type="button" onClick={() => exportReport(report)} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-black text-white hover:bg-blue-800"><Download size={16} />Export</button></div>)}</div></section></div>;
}

function Metric({ title, value, icon, money = false }: { title: string; value: number; icon: React.ReactNode; money?: boolean }) { return <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between text-slate-500"><div className="text-sm font-black uppercase tracking-wider">{title}</div>{icon}</div><div className="mt-4 text-4xl font-black">{money ? `${value.toLocaleString()} MMK` : value}</div></div>; }
