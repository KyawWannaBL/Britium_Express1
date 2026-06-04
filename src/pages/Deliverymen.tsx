import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, RefreshCw, Search, Truck, User, Wallet } from "lucide-react";
import { createShipmentFromMerchant, type EnterpriseShipment } from "@/lib/enterpriseWorkflow";
import { loadLiveMasterDataSnapshot, type LiveMasterPerson, type LiveMasterSnapshot } from "@/lib/liveMasterData";

type TaskRow = {
  id: string;
  waybillNo: string;
  pickupId: string;
  merchantName: string;
  receiverName: string;
  receiverPhone: string;
  address: string;
  routeZone: string;
  status: string;
  codAmount: number;
};

function personLabel(person: LiveMasterPerson) {
  return `${person.name} - ${person.role} - ${person.assignedZone}`;
}

function taskFromShipment(shipment: EnterpriseShipment): TaskRow {
  return {
    id: shipment.id,
    waybillNo: shipment.waybillNo,
    pickupId: shipment.pickupId,
    merchantName: shipment.merchantName,
    receiverName: shipment.receiverName,
    receiverPhone: shipment.receiverPhone,
    address: shipment.deliveryAddress,
    routeZone: shipment.routeZone ?? `${shipment.township} Route`,
    status: shipment.status,
    codAmount: shipment.codAmount,
  };
}

export default function Deliverymen() {
  const [snapshot, setSnapshot] = useState<LiveMasterSnapshot | null>(null);
  const [people, setPeople] = useState<LiveMasterPerson[]>([]);
  const [personId, setPersonId] = useState("");
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("Deliverymen portal is loading the shared master-data snapshot.");

  async function syncMasterData() {
    setLoading(true);
    const next = await loadLiveMasterDataSnapshot();
    const nextPeople = [...next.riders, ...next.drivers, ...next.helpers];
    const nextTasks = next.merchants.slice(0, 8).map((merchant, index) =>
      taskFromShipment(createShipmentFromMerchant({
        merchant,
        pickupDate: "2026-05-25",
        parcelCount: 5 + index,
        receiverName: `Receiver ${index + 1}`,
        receiverPhone: merchant.phone || "Pending",
        deliveryAddress: "Pending receiver address",
        township: merchant.pickupTownship,
        serviceType: index % 2 ? "Standard" : "Same Day",
        priority: index % 3 ? "Normal" : "High",
      })),
    );
    setSnapshot(next);
    setPeople(nextPeople);
    setPersonId((current) => nextPeople.some((person) => person.id === current) ? current : nextPeople[0]?.id ?? "");
    setTasks(nextTasks);
    setNotice(`Deliverymen synchronized with ${nextPeople.length} rider/driver/helper records and ${nextTasks.length} tasks.`);
    setLoading(false);
  }

  useEffect(() => { void syncMasterData(); }, []);

  const selectedPerson = useMemo(() => people.find((person) => person.id === personId) ?? people[0], [people, personId]);
  const visibleTasks = useMemo(() => {
    const base = selectedPerson ? tasks.filter((task) => task.routeZone.includes(selectedPerson.assignedZone) || selectedPerson.assignedZone === "Unassigned Zone") : tasks;
    const q = query.trim().toLowerCase();
    return q ? base.filter((task) => Object.values(task).join(" ").toLowerCase().includes(q)) : base;
  }, [query, selectedPerson, tasks]);
  const codTotal = visibleTasks.reduce((sum, task) => sum + task.codAmount, 0);

  function markCompleted(taskId: string) {
    setTasks((current) => current.map((task) => task.id === taskId ? { ...task, status: "Delivered" } : task));
    setNotice(`Task ${taskId} marked delivered using synchronized rider assignment data.`);
  }

  return <div className="min-h-screen bg-[#f6f8fc] p-8 text-slate-950"><header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between"><div><p className="text-sm font-black uppercase tracking-[0.24em] text-blue-700">Britium Express</p><h1 className="mt-3 text-5xl font-black tracking-tight">Deliverymen / Rider Portal</h1><p className="mt-4 max-w-5xl text-lg font-semibold leading-8 text-slate-500">Rider, driver, helper, route, task, and COD data now use the shared master-data snapshot.</p></div><button type="button" onClick={syncMasterData} className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-7 py-4 text-lg font-black shadow-sm hover:bg-slate-50"><RefreshCw size={20} className={loading ? "animate-spin" : ""} />Sync Master Data</button></header><div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4"><Metric title="People Master" value={people.length} icon={<User size={18} />} /><Metric title="Assigned Tasks" value={visibleTasks.length} icon={<Truck size={18} />} /><Metric title="COD Total" value={codTotal} icon={<Wallet size={18} />} money /><Metric title="Merchants" value={snapshot?.merchants.length ?? 0} icon={<CheckCircle2 size={18} />} /></div><section className="mt-8 rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm"><div className="grid gap-5 xl:grid-cols-[360px_1fr]"><label className="block"><span className="mb-2 block text-sm font-black uppercase tracking-wider text-slate-500">Rider / Driver / Helper</span><select value={personId} onChange={(event) => setPersonId(event.target.value)} className="control">{people.map((person) => <option key={person.id} value={person.id}>{personLabel(person)}</option>)}</select></label><div className="relative self-end"><Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search waybill, pickup, merchant, receiver, route..." className="h-16 w-full rounded-2xl border border-slate-200 bg-white pl-14 pr-5 text-lg font-semibold outline-none focus:border-blue-500" /></div></div><div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-base font-bold text-emerald-700">{notice}</div>{selectedPerson ? <div className="mt-8 grid gap-5 md:grid-cols-4"><Info label="Name" value={selectedPerson.name} /><Info label="Role" value={selectedPerson.role} /><Info label="Assigned Zone" value={selectedPerson.assignedZone} /><Info label="Status" value={selectedPerson.status} /></div> : null}</section><section className="mt-8 rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm"><h2 className="text-3xl font-black">Live Tasks</h2><div className="mt-6 overflow-hidden rounded-2xl border border-slate-200"><div className="grid grid-cols-7 gap-3 bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-500"><div>Waybill</div><div>Pickup</div><div>Merchant</div><div>Receiver</div><div>Route</div><div>COD</div><div>Action</div></div>{visibleTasks.map((task) => <div key={task.id} className="grid grid-cols-7 gap-3 border-t border-slate-100 px-4 py-4 text-sm font-semibold text-slate-700"><div className="font-mono font-black text-blue-700">{task.waybillNo}</div><div className="font-mono text-xs">{task.pickupId}</div><div>{task.merchantName}</div><div>{task.receiverName}<div className="text-xs text-slate-400">{task.receiverPhone}</div></div><div>{task.routeZone}</div><div>{task.codAmount.toLocaleString()} MMK</div><div><button type="button" onClick={() => markCompleted(task.id)} className="rounded-xl bg-blue-700 px-4 py-2 text-xs font-black text-white hover:bg-blue-800">Delivered</button></div></div>)}</div></section><style>{`.control{height:58px;width:100%;border-radius:18px;border:1px solid #e2e8f0;padding:0 18px;font-size:16px;font-weight:700;outline:none;background:white}.control:focus{border-color:#2563eb}`}</style></div>;
}

function Metric({ title, value, icon, money = false }: { title: string; value: number; icon: React.ReactNode; money?: boolean }) { return <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between text-slate-500"><div className="text-sm font-black uppercase tracking-wider">{title}</div>{icon}</div><div className="mt-4 text-4xl font-black">{money ? `${value.toLocaleString()} MMK` : value}</div></div>; }
function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-slate-50 p-4"><div className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</div><div className="mt-1 text-sm font-black text-slate-700">{value}</div></div>; }
