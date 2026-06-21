import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ClipboardList, MapPinned, RefreshCw, Route, Search, Truck, Users } from "lucide-react";
import { asText, loadSupervisorMasters, loadSupervisorPickupQueue, loadSupervisorWayplans, subscribeSupervisorSync, type SupervisorMasters, type SupervisorPickupRow, type SupervisorWayplanRow, emptySupervisorMasters } from "@/lib/supervisorSync";

function statusTone(status: string) {
  const value = asText(status).toUpperCase();
  if (["ASSIGNED", "RIDER_ASSIGNED", "PICKUP_ASSIGNED", "READY", "OK"].some((x) => value.includes(x))) return "border-[#0d6b4c] bg-[#082f35] text-[#22c55e]";
  if (["CANCEL", "REJECT", "FAILED", "ERROR"].some((x) => value.includes(x))) return "border-[#ff4f93] bg-[#2a1934] text-[#ff4f93]";
  return "border-[#f6b84b]/50 bg-[#1b2331] text-[#f6b84b]";
}

function isPickupSynced(plan: SupervisorWayplanRow, pickups: SupervisorPickupRow[]) {
  return pickups.some((pickup) => pickup.pickup_id === plan.pickup_id || pickup.request_code === plan.pickup_id || pickup.waybill_no === plan.waybill_no || pickup.pickup_waybill_id === plan.waybill_no);
}

export default function SupervisorWayplanPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("Synchronize the supervisor wayplan board to begin.");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [wayplans, setWayplans] = useState<SupervisorWayplanRow[]>([]);
  const [pickups, setPickups] = useState<SupervisorPickupRow[]>([]);
  const [masters, setMasters] = useState<SupervisorMasters>(emptySupervisorMasters);

  const loadData = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const [nextWayplans, nextPickups, nextMasters] = await Promise.all([
        loadSupervisorWayplans(),
        loadSupervisorPickupQueue(),
        loadSupervisorMasters(),
      ]);
      setWayplans(nextWayplans);
      setPickups(nextPickups);
      setMasters(nextMasters);
      setLastSyncAt(new Date());
      const source = nextWayplans[0]?.source || "no source";
      setMessage(`Synced ${nextWayplans.length} wayplan row(s) from ${source}; cross-checked against ${nextPickups.length} pickup row(s).`);
    } catch (error: any) {
      setMessage(error?.message || "Unable to synchronize supervisor wayplan board.");
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const unsubscribe = subscribeSupervisorSync(() => void loadData(false));
    return unsubscribe;
  }, [loadData]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return wayplans.filter((row) => {
      const statusMatch = statusFilter === "all" || asText(row.status).toLowerCase().includes(statusFilter);
      if (!statusMatch) return false;
      if (!q) return true;
      return [row.wayplan_id, row.pickup_id, row.waybill_no, row.merchant_code, row.merchant_name, row.route_zone, row.pickup_address, row.township, row.city, row.branch_code, row.assigned_rider, row.assigned_driver, row.assigned_vehicle, row.status, row.source]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [wayplans, search, statusFilter]);

  const syncedCount = wayplans.filter((plan) => isPickupSynced(plan, pickups)).length;
  const assignedCount = wayplans.filter((plan) => asText(plan.assigned_rider || plan.assigned_driver || plan.assigned_vehicle)).length;
  const routeCount = new Set(wayplans.map((plan) => plan.route_zone).filter(Boolean)).size;
  const fallbackMode = wayplans[0]?.source === "pickup_queue_fallback";

  return (
    <div className="space-y-6 overflow-x-hidden">
      <div className="border-b border-[#1a3a5c] pb-4">
        <h1 className="mb-1 text-[16px] uppercase tracking-widest text-[#f6b84b]">SUPERVISOR WAYPLAN</h1>
        <p className="text-[13px] text-[#4d7a9b]">Live wayplan board synchronized with pickup assignment data, rider/driver/helper masters, and realtime pickup updates.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Metric icon={<Route size={20} />} label="Wayplans" value={wayplans.length} tone="text-[#f6b84b]" />
        <Metric icon={<CheckCircle2 size={20} />} label="Pickup Synced" value={syncedCount} tone="text-[#22c55e]" />
        <Metric icon={<Truck size={20} />} label="Assigned" value={assignedCount} tone="text-[#4ea8de]" />
        <Metric icon={<MapPinned size={20} />} label="Route Zones" value={routeCount} tone="text-[#ff4f93]" />
      </div>

      <div className="rounded-2xl border border-[#1a3a5c] bg-[#0b2236] p-4 text-[13px] font-bold text-[#eef8ff]">
        <div className="flex items-start gap-3"><AlertTriangle size={16} className="mt-0.5 shrink-0 text-[#f6b84b]" /><span className="break-words">{message}</span></div>
        <div className="mt-2 text-xs text-[#4d7a9b]">Last sync: {lastSyncAt ? lastSyncAt.toLocaleString() : "not yet"}</div>
        {fallbackMode ? <div className="mt-2 text-xs text-[#f6b84b]">No dedicated wayplan RPC/table returned rows, so this page is using the live pickup queue fallback to stay synchronized.</div> : null}
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-[#1a3a5c] bg-[#0b2236] p-6 lg:flex-row lg:items-end">
        <div className="w-full lg:flex-1">
          <label className="mb-2 flex items-center gap-1 text-[11px] uppercase tracking-widest text-[#4d7a9b]"><Search size={12} /> Search Wayplan</label>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Wayplan / pickup / merchant / rider / zone..." className="w-full rounded-xl border border-[#1a3a5c] bg-[#061524] p-3 text-[13px] text-[#eef8ff] outline-none focus:border-[#f6b84b]" />
        </div>
        <div className="w-full lg:w-72">
          <label className="mb-2 block text-[11px] uppercase tracking-widest text-[#4d7a9b]">Status</label>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="w-full rounded-xl border border-[#1a3a5c] bg-[#061524] p-3 text-[13px] text-[#eef8ff] outline-none focus:border-[#f6b84b]">
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="assign">Assigned</option>
            <option value="pickup">Pickup</option>
            <option value="ready">Ready</option>
          </select>
        </div>
        <button type="button" onClick={() => loadData()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f6b84b] px-6 py-3 text-[12px] font-black uppercase tracking-wider text-[#061524] disabled:opacity-50">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Sync Now
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.75fr)]">
        <div className="overflow-hidden rounded-2xl border border-[#1a3a5c] bg-[#0b2236]">
          <div className="flex items-center justify-between gap-3 border-b border-[#1a3a5c] p-4">
            <h3 className="flex items-center gap-2 text-[14px] uppercase tracking-widest text-[#eef8ff]"><ClipboardList size={16} className="text-[#4ea8de]" /> Live Wayplan Rows</h3>
            <span className="text-[12px] text-[#4d7a9b]">{filteredRows.length} row(s)</span>
          </div>

          <div className="overflow-auto">
            <table className="min-w-[980px] w-full border-separate border-spacing-0 text-left text-sm">
              <thead className="bg-[#061524] text-[11px] uppercase tracking-widest text-[#4d7a9b]">
                <tr>
                  <th className="px-4 py-4">Wayplan / Pickup</th>
                  <th className="px-4 py-4">Merchant</th>
                  <th className="px-4 py-4">Route</th>
                  <th className="px-4 py-4">Assigned Team</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Sync</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-[#4d7a9b]">{loading ? "Loading wayplan data..." : "No supervisor wayplan rows loaded."}</td></tr>
                ) : (
                  filteredRows.map((row) => {
                    const synced = isPickupSynced(row, pickups);
                    return (
                      <tr key={`${row.id}-${row.pickup_id}`} className="border-b border-[#1a3a5c] hover:bg-[#061524]">
                        <td className="border-b border-[#1a3a5c] px-4 py-4">
                          <div className="font-mono text-[13px] font-black text-[#f6b84b]">{row.wayplan_id || row.pickup_id || "-"}</div>
                          <div className="mt-1 text-[12px] text-[#4ea8de]">Pickup: {row.pickup_id || "-"}</div>
                          <div className="mt-1 text-[11px] text-[#4d7a9b]">Waybill: {row.waybill_no || "-"}</div>
                        </td>
                        <td className="border-b border-[#1a3a5c] px-4 py-4"><div className="font-bold text-[#eef8ff]">{row.merchant_name || "-"}</div><div className="text-[12px] text-[#4d7a9b]">{row.merchant_code || "-"}</div></td>
                        <td className="border-b border-[#1a3a5c] px-4 py-4"><div className="font-bold text-[#eef8ff]">{row.route_zone || row.township || "-"}</div><div className="mt-1 text-[12px] text-[#4d7a9b]">{[row.city, row.branch_code].filter(Boolean).join(" / ") || row.pickup_address || "-"}</div></td>
                        <td className="border-b border-[#1a3a5c] px-4 py-4"><TeamLine label="R" value={row.assigned_rider} /><TeamLine label="D" value={row.assigned_driver} /><TeamLine label="H" value={row.assigned_helper} /><TeamLine label="V" value={row.assigned_vehicle} /></td>
                        <td className="border-b border-[#1a3a5c] px-4 py-4"><span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusTone(row.status)}`}>{row.status || "PENDING"}</span></td>
                        <td className="border-b border-[#1a3a5c] px-4 py-4"><span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${synced ? "border-[#0d6b4c] bg-[#082f35] text-[#22c55e]" : "border-[#ff4f93]/40 bg-[#2a1934] text-[#ff4f93]"}`}>{synced ? "Pickup synced" : "Missing pickup"}</span><div className="mt-2 text-[11px] text-[#4d7a9b]">{row.source}</div></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-[#1a3a5c] bg-[#0b2236] p-6">
            <h3 className="mb-4 flex items-center gap-2 text-[14px] uppercase tracking-widest text-[#eef8ff]"><Users size={16} className="text-[#4ea8de]" /> Master Sync</h3>
            <SideMetric label="Riders" value={masters.riders.length} />
            <SideMetric label="Drivers" value={masters.drivers.length} />
            <SideMetric label="Helpers" value={masters.helpers.length} />
            <SideMetric label="Fleet" value={masters.fleets.length} />
          </div>
          <div className="rounded-2xl border border-[#1a3a5c] bg-[#0b2236] p-6">
            <h3 className="mb-4 flex items-center gap-2 text-[14px] uppercase tracking-widest text-[#eef8ff]"><CheckCircle2 size={16} className="text-[#22c55e]" /> Synchronization Checks</h3>
            <Check label="Wayplan source" ok={wayplans.length > 0} detail={wayplans[0]?.source || "No wayplan source returned rows."} />
            <Check label="Pickup queue source" ok={pickups.length > 0} detail={`${pickups.length} live pickup row(s) loaded.`} />
            <Check label="Pickup cross-check" ok={syncedCount === wayplans.length || fallbackMode} detail={`${syncedCount}/${wayplans.length} wayplan row(s) match pickup queue.`} />
            <Check label="Realtime watcher" ok detail="Listening for pickup, notification, workforce, and wayplan table changes." />
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ icon, label, value, tone }: { icon: JSX.Element; label: string; value: number; tone: string }) {
  return <div className="rounded-2xl border border-[#1a3a5c] bg-[#0b2236] p-5"><div className="mb-3 flex items-center justify-between text-[#4d7a9b]">{icon}<span className="text-[10px] uppercase tracking-widest">Live</span></div><div className="text-[11px] uppercase tracking-widest text-[#4d7a9b]">{label}</div><div className={`mt-1 text-2xl font-black ${tone}`}>{Number(value || 0).toLocaleString()}</div></div>;
}

function TeamLine({ label, value }: { label: string; value: string }) {
  return <div className="mb-1 text-[12px]"><span className="mr-2 inline-flex w-5 justify-center rounded bg-[#061524] font-black text-[#f6b84b]">{label}</span><span className="text-[#eef8ff]">{value || "-"}</span></div>;
}

function SideMetric({ label, value }: { label: string; value: number }) {
  return <div className="mb-3 flex items-center justify-between rounded-xl border border-[#1a3a5c] bg-[#061524] px-4 py-3"><span className="text-[12px] uppercase tracking-widest text-[#4d7a9b]">{label}</span><span className="font-black text-[#f6b84b]">{Number(value || 0).toLocaleString()}</span></div>;
}

function Check({ label, ok, detail }: { label: string; ok: boolean; detail: string }) {
  return <div className={`mb-3 rounded-xl border p-4 ${ok ? "border-[#0d6b4c] bg-[#082f35] text-[#22c55e]" : "border-[#ff4f93] bg-[#1b2034] text-[#ff4f93]"}`}><div className="font-bold text-[#eef8ff]">{label}</div><div className="mt-1 break-words text-[12px] opacity-90">{detail}</div></div>;
}
