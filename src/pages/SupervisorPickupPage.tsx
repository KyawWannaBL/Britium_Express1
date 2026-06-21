import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Bell, CheckCircle2, ClipboardCheck, Download, Filter, Loader2, RefreshCw, Search, Send, Truck, UploadCloud, UserCheck } from "lucide-react";
import {
  asText,
  assignSupervisorPickup,
  emptySupervisorMasters,
  fleetLabel,
  loadSupervisorMasters,
  loadSupervisorPickupQueue,
  markSupervisorPickupNotificationRead,
  sameBranchOrAny,
  subscribeSupervisorSync,
  workerLabel,
  workerValue,
  type SupervisorFleet,
  type SupervisorMasters,
  type SupervisorPickupRow,
  type SupervisorWorker,
} from "@/lib/supervisorSync";

const NOTE_LIMIT = 500;

function isAssigned(row: SupervisorPickupRow) {
  return ["ASSIGNED", "RIDER_ASSIGNED", "ASSIGNED_TO_DRIVER", "PICKUP_ASSIGNED"].includes(asText(row.supervisor_status || row.pickup_status).toUpperCase());
}

export default function SupervisorPickupPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [message, setMessage] = useState("Synchronize the supervisor pickup queue to begin.");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);

  const [queue, setQueue] = useState<SupervisorPickupRow[]>([]);
  const [masters, setMasters] = useState<SupervisorMasters>(emptySupervisorMasters);

  const [selectedId, setSelectedId] = useState("");
  const [selectedRider, setSelectedRider] = useState("");
  const [selectedDriver, setSelectedDriver] = useState("");
  const [selectedHelper, setSelectedHelper] = useState("");
  const [selectedFleet, setSelectedFleet] = useState("");
  const [supervisorNote, setSupervisorNote] = useState("");

  const selectedPickup = useMemo(
    () => queue.find((item) => item.id === selectedId || item.pickup_id === selectedId || item.request_code === selectedId) || queue[0] || null,
    [queue, selectedId],
  );

  const selectedRiderRecord = useMemo(() => masters.riders.find((item) => workerValue(item) === selectedRider) || null, [masters.riders, selectedRider]);
  const selectedDriverRecord = useMemo(() => masters.drivers.find((item) => workerValue(item) === selectedDriver) || null, [masters.drivers, selectedDriver]);
  const selectedHelperRecord = useMemo(() => masters.helpers.find((item) => workerValue(item) === selectedHelper) || null, [masters.helpers, selectedHelper]);
  const selectedFleetRecord = useMemo(() => masters.fleets.find((item) => item.id === selectedFleet || item.vehicle_no === selectedFleet) || null, [masters.fleets, selectedFleet]);

  const eligibleRiders = useMemo(() => masters.riders.filter((item) => sameBranchOrAny(item.branch_code, selectedPickup?.branch_code)), [masters.riders, selectedPickup]);
  const eligibleDrivers = useMemo(() => masters.drivers.filter((item) => sameBranchOrAny(item.branch_code, selectedPickup?.branch_code)), [masters.drivers, selectedPickup]);
  const eligibleHelpers = useMemo(() => masters.helpers.filter((item) => sameBranchOrAny(item.branch_code, selectedPickup?.branch_code)), [masters.helpers, selectedPickup]);
  const eligibleFleets = useMemo(
    () => masters.fleets.filter((item) => sameBranchOrAny(item.branch_code, selectedPickup?.branch_code) && (!selectedPickup?.vehicle_type || !item.vehicle_type || item.vehicle_type === selectedPickup.vehicle_type)),
    [masters.fleets, selectedPickup],
  );

  const filteredQueue = useMemo(() => {
    const q = search.trim().toLowerCase();
    return queue.filter((item) => {
      if (!q) return true;
      return [item.pickup_id, item.request_code, item.pickup_waybill_id, item.waybill_no, item.merchant_name, item.merchant_code, item.township, item.city, item.branch_code, item.pickup_status, item.workflow_stage]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [queue, search]);

  const assignedCount = queue.filter(isAssigned).length;
  const pendingCount = queue.length - assignedCount;
  const unreadCount = queue.filter((item) => item.has_unread_notification).length;
  const blockingError = !selectedPickup || !selectedRiderRecord || supervisorNote.length > NOTE_LIMIT || masters.riders.length === 0;

  const loadData = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const [pickupRows, nextMasters] = await Promise.all([
        loadSupervisorPickupQueue({ fromDate, toDate }),
        loadSupervisorMasters(),
      ]);
      setQueue(pickupRows);
      setMasters(nextMasters);
      setLastSyncAt(new Date());
      if (pickupRows.length) {
        setSelectedId((current) => (pickupRows.some((item) => item.id === current || item.pickup_id === current || item.request_code === current) ? current : pickupRows[0].id || pickupRows[0].pickup_id));
      } else {
        setSelectedId("");
      }
      setMessage(`Synced ${pickupRows.length} pickup(s), ${nextMasters.riders.length} rider(s), ${nextMasters.drivers.length} driver(s), ${nextMasters.helpers.length} helper(s), and ${nextMasters.fleets.length} fleet item(s).`);
    } catch (error: any) {
      setMessage(error?.message || "Unable to synchronize supervisor pickup queue.");
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const unsubscribe = subscribeSupervisorSync(() => void loadData(false));
    return unsubscribe;
  }, [loadData]);

  function handlePickupSelect(item: SupervisorPickupRow) {
    setSelectedId(item.id || item.pickup_id || item.request_code);
    setSelectedRider(item.assigned_rider_email || item.assigned_rider_code || "");
    setSelectedDriver(item.assigned_driver_email || item.assigned_driver_code || "");
    setSelectedHelper(item.assigned_helper_email || item.assigned_helper_code || "");
    setSelectedFleet(item.assigned_vehicle_id || item.assigned_fleet_id || "");
    setSupervisorNote("");
  }

  function smartSuggest() {
    if (!selectedPickup) return;
    const township = asText(selectedPickup.township || selectedPickup.pickup_address).toLowerCase();
    const rider = eligibleRiders.find((item) => [item.zone, item.branch_code, item.name].join(" ").toLowerCase().includes(township)) || eligibleRiders[0];
    const fleet = eligibleFleets.find((item) => selectedPickup.vehicle_type && item.vehicle_type === selectedPickup.vehicle_type) || eligibleFleets[0];
    setSelectedRider(rider ? workerValue(rider) : "");
    setSelectedFleet(fleet?.id || "");
    setMessage(`Suggested ${rider?.code || "rider"}${fleet ? ` and ${fleet.vehicle_no}` : ""} from branch, zone, and vehicle requirement.`);
  }

  async function confirmAssignment() {
    if (!selectedPickup) {
      setMessage("Please select a pickup request.");
      return;
    }
    if (!selectedRiderRecord) {
      setMessage("Go-live workflow requires a rider assignment.");
      return;
    }
    if (supervisorNote.length > NOTE_LIMIT) {
      setMessage("Supervisor note must be 500 characters or fewer.");
      return;
    }

    setAssigning(true);
    setMessage("Assigning pickup and sending job to rider/driver app...");
    try {
      await assignSupervisorPickup({
        pickup: selectedPickup,
        rider: selectedRiderRecord,
        driver: selectedDriverRecord,
        helper: selectedHelperRecord,
        fleet: selectedFleetRecord,
        note: supervisorNote,
      });
      await markSupervisorPickupNotificationRead(selectedPickup.pickup_id);
      setMessage(`Assigned ${selectedPickup.pickup_id}. Rider/Driver app job is now visible.`);
      setSelectedId("");
      setSelectedRider("");
      setSelectedDriver("");
      setSelectedHelper("");
      setSelectedFleet("");
      setSupervisorNote("");
      await loadData(false);
    } catch (error: any) {
      setMessage(error?.message || "Assignment failed.");
    } finally {
      setAssigning(false);
    }
  }

  function downloadReport() {
    const headers = ["pickup_id", "merchant_code", "merchant_name", "township", "city", "branch_code", "expected_parcels", "pickup_date", "pickup_status", "workflow_stage", "supervisor_status", "assigned_rider_email", "assigned_driver_email", "assigned_helper_email"];
    const csv = [
      headers.join(","),
      ...filteredQueue.map((row) => headers.map((header) => `"${String((row as any)[header] || "").replaceAll('"', '""')}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "supervisor-pickup-assignment-report.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function handleBulkUpload(file: File | null) {
    if (!file) return;
    setMessage(`Selected upload file: ${file.name}. Bulk registration must be handled by the production upload RPC when enabled.`);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="space-y-6 overflow-x-hidden">
      <div className="border-b border-[#1a3a5c] pb-4">
        <h1 className="mb-1 text-[16px] uppercase tracking-widest text-[#f6b84b]">SUPERVISOR PICKUP ASSIGNMENT</h1>
        <p className="text-[13px] text-[#4d7a9b]">Live CS pickup queue. Assignment writes rider, driver, helper, and vehicle data to backend so mobile apps receive jobs.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Metric label="Pending" value={pendingCount} tone="text-[#f6b84b]" />
        <Metric label="Assigned" value={assignedCount} tone="text-[#22c55e]" />
        <Metric label="Unread Alerts" value={unreadCount} tone="text-[#ff4f93]" />
        <Metric label="Active Riders" value={masters.riders.length} tone="text-[#4ea8de]" />
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-[#1a3a5c] bg-[#0b2236] p-6 lg:flex-row lg:items-end">
        <DateField label="From Date" value={fromDate} onChange={setFromDate} />
        <DateField label="To Date" value={toDate} onChange={setToDate} />
        <div className="w-full lg:flex-1">
          <label className="mb-2 flex items-center gap-1 text-[11px] uppercase tracking-widest text-[#4d7a9b]"><Search size={12} /> Search Pickup</label>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pickup ID / merchant / township..." className="w-full rounded-xl border border-[#1a3a5c] bg-[#061524] p-3 text-[13px] text-[#eef8ff] outline-none focus:border-[#f6b84b]" />
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={downloadReport} className="inline-flex items-center gap-2 rounded-xl border border-[#1a3a5c] bg-[#1a3a5c] px-5 py-3 text-[12px] uppercase tracking-wider text-[#eef8ff]"><Download size={14} /> Report</button>
          <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-xl bg-[#f6b84b] px-5 py-3 text-[12px] font-black uppercase tracking-wider text-[#061524]"><UploadCloud size={14} /> Upload</button>
          <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(event) => handleBulkUpload(event.target.files?.[0] || null)} />
        </div>
      </div>

      <div className="rounded-2xl border border-[#1a3a5c] bg-[#0b2236] p-4 text-[13px] font-bold text-[#eef8ff]">
        <div className="flex items-start gap-3"><AlertTriangle size={16} className="mt-0.5 shrink-0 text-[#f6b84b]" /><span className="break-words">{message}</span></div>
        <div className="mt-2 text-xs text-[#4d7a9b]">Last sync: {lastSyncAt ? lastSyncAt.toLocaleString() : "not yet"}</div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(420px,0.95fr)]">
        <div className="flex min-h-[560px] min-w-0 flex-col rounded-2xl border border-[#1a3a5c] bg-[#0b2236]">
          <div className="flex flex-col gap-2 border-b border-[#1a3a5c] p-4 md:flex-row md:items-center md:justify-between">
            <h3 className="flex items-center gap-2 text-[14px] uppercase tracking-widest text-[#eef8ff]"><ClipboardCheck size={16} className="text-[#4ea8de]" /> Live Supervisor Queue</h3>
            <button type="button" onClick={() => loadData()} className="flex items-center gap-1 text-[12px] uppercase tracking-widest text-[#4ea8de]"><RefreshCw size={12} className={loading ? "animate-spin" : ""} /> {loading ? "Syncing..." : "Sync"}</button>
          </div>
          <div className="flex-1 space-y-3 overflow-auto p-4">
            {filteredQueue.length === 0 ? (
              <div className="rounded-xl border border-[#1a3a5c] bg-[#061524] p-6 text-center text-[13px] text-[#4d7a9b]">{loading ? "Loading backend pickup queue..." : "No pickup requests loaded from supervisor queue."}</div>
            ) : (
              filteredQueue.map((item) => (
                <button key={`${item.id}-${item.pickup_id}`} type="button" onClick={() => handlePickupSelect(item)} className={`w-full min-w-0 rounded-xl border bg-[#061524] p-4 text-left transition-colors hover:border-[#f6b84b] ${selectedPickup?.id === item.id ? "border-[#f6b84b]" : "border-[#1a3a5c]"}`}>
                  <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 break-words text-[13px] font-bold text-[#f6b84b]">{item.has_unread_notification && !isAssigned(item) ? <Bell size={14} className="text-[#ff4f93]" /> : null}<span>{item.pickup_id || "Missing Pickup ID"}</span></div>
                      <div className="mt-1 break-words text-[11px] text-[#4ea8de]">{item.waybill_no ? `Waybill: ${item.waybill_no}` : item.pickup_waybill_id}</div>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] uppercase tracking-widest ${isAssigned(item) ? "border-[#0d6b4c] bg-[#083927] text-[#22c55e]" : "border-[#ff4f93]/40 bg-[#2a1934] text-[#ff4f93]"}`}>{isAssigned(item) ? "Assigned" : "New Request"}</span>
                  </div>
                  <div className="grid min-w-0 grid-cols-1 gap-3 text-[12px] md:grid-cols-3">
                    <Info label="Merchant" value={`${item.merchant_code ? `${item.merchant_code} - ` : ""}${item.merchant_name || "-"}`} />
                    <Info label="Location" value={[item.township, item.city, item.branch_code].filter(Boolean).join(", ") || "-"} />
                    <Info label="Parcels / Vehicle" value={`${item.expected_parcels || 1} / ${item.vehicle_type || "Any"}`} />
                  </div>
                  <div className="mt-3 break-words text-[12px] text-[#4d7a9b]">{item.pickup_address || "No pickup address available."}</div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6 min-w-0">
          <div className="flex min-w-0 flex-col rounded-2xl border border-[#1a3a5c] bg-[#0b2236] p-6">
            <h3 className="mb-6 flex items-center gap-2 border-b border-[#1a3a5c] pb-4 text-[14px] uppercase tracking-widest text-[#eef8ff]"><UserCheck size={16} className="text-[#4ea8de]" /> Assignment Control</h3>
            <div className="space-y-4">
              <Readonly label="Selected Pickup ID" value={selectedPickup?.pickup_id || ""} placeholder="Select a pickup request" />
              <Select label="Rider - required" value={selectedRider} onChange={setSelectedRider} placeholder="Select Rider" options={eligibleRiders.map((item) => ({ value: workerValue(item), label: workerLabel(item) }))} />
              <Select label="Driver" value={selectedDriver} onChange={setSelectedDriver} placeholder="Select Driver" options={eligibleDrivers.map((item) => ({ value: workerValue(item), label: workerLabel(item) }))} />
              <Select label="Helper" value={selectedHelper} onChange={setSelectedHelper} placeholder="Select Helper" options={eligibleHelpers.map((item) => ({ value: workerValue(item), label: workerLabel(item) }))} />
              <Select label="Vehicle / Fleet" value={selectedFleet} onChange={setSelectedFleet} placeholder="Select Vehicle" options={eligibleFleets.map((item) => ({ value: item.id, label: fleetLabel(item) }))} />
              <label className="block"><span className="mb-2 block text-[11px] uppercase tracking-widest text-[#4d7a9b]">Supervisor Note ({supervisorNote.length}/{NOTE_LIMIT})</span><textarea value={supervisorNote} onChange={(event) => setSupervisorNote(event.target.value.slice(0, NOTE_LIMIT + 50))} placeholder="Special instructions..." className="min-h-[96px] w-full rounded-xl border border-[#1a3a5c] bg-[#061524] p-3 text-[13px] text-[#eef8ff] outline-none focus:border-[#f6b84b]" /></label>
              <div className="grid gap-2 sm:grid-cols-2"><button type="button" onClick={smartSuggest} disabled={!selectedPickup || !eligibleRiders.length} className="rounded-xl border border-[#1a3a5c] bg-[#102b45] p-4 text-[12px] font-black uppercase tracking-wider text-[#eef8ff] disabled:opacity-50">Smart Suggest</button><button type="button" onClick={confirmAssignment} disabled={loading || assigning || blockingError} className="flex items-center justify-center gap-2 rounded-xl bg-[#f6b84b] p-4 text-[12px] font-black uppercase tracking-wider text-[#061524] disabled:opacity-50">{assigning ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Confirm + Send to App</button></div>
            </div>
          </div>
          <div className="rounded-2xl border border-[#1a3a5c] bg-[#0b2236] p-6">
            <h3 className="mb-4 flex items-center gap-2 text-[14px] uppercase tracking-widest text-[#eef8ff]"><CheckCircle2 size={16} className="text-[#22c55e]" /> Go-Live Check</h3>
            <Check label="Pickup selected" ok={Boolean(selectedPickup)} detail={selectedPickup?.pickup_id || "Select a pickup request."} />
            <Check label="Rider selected" ok={Boolean(selectedRiderRecord)} detail={selectedRiderRecord ? workerLabel(selectedRiderRecord) : "Rider is required."} />
            <Check label="Rider master" ok={masters.riders.length > 0} detail={`${masters.riders.length} active rider(s) loaded.`} />
            <Check label="Fleet master" ok={masters.fleets.length > 0} warn detail={`${masters.fleets.length} fleet item(s) loaded.`} />
            <Check label="Note length" ok={supervisorNote.length <= NOTE_LIMIT} detail={`${supervisorNote.length}/${NOTE_LIMIT}`} />
          </div>
        </div>
      </div>
    </div>
  );
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <div className="w-full lg:w-auto"><label className="mb-2 flex items-center gap-1 text-[11px] uppercase tracking-widest text-[#4d7a9b]"><Filter size={12} /> {label}</label><input type="date" value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-[#1a3a5c] bg-[#061524] p-3 text-[13px] text-[#eef8ff] outline-none focus:border-[#f6b84b]" /></div>;
}

function Metric({ label, value, tone }: { label: string; value: number; tone: string }) {
  return <div className="rounded-2xl border border-[#1a3a5c] bg-[#0b2236] p-5"><div className="text-[11px] uppercase tracking-widest text-[#4d7a9b]">{label}</div><div className={`mt-1 text-2xl font-black ${tone}`}>{Number(value || 0).toLocaleString()}</div></div>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><div className="text-[10px] uppercase tracking-wider text-[#4d7a9b]">{label}</div><div className="break-words text-[#eef8ff]">{value}</div></div>;
}

function Readonly({ label, value, placeholder }: { label: string; value: string; placeholder: string }) {
  return <label className="block"><span className="mb-2 block text-[11px] uppercase tracking-widest text-[#4d7a9b]">{label}</span><input readOnly value={value} placeholder={placeholder} className="w-full rounded-xl border border-[#1a3a5c] bg-[#061524] p-3 text-[13px] text-[#4d7a9b] outline-none" /></label>;
}

function Select({ label, value, onChange, placeholder, options }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; options: Array<{ value: string; label: string }> }) {
  return <label className="block"><span className="mb-2 block text-[11px] uppercase tracking-widest text-[#4d7a9b]">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="w-full cursor-pointer rounded-xl border border-[#1a3a5c] bg-[#061524] p-3 text-[13px] text-[#eef8ff] outline-none focus:border-[#f6b84b]"><option value="">{placeholder}</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}

function Check({ label, ok, detail, warn = false }: { label: string; ok: boolean; detail: string; warn?: boolean }) {
  const tone = ok ? "border-[#0d6b4c] bg-[#082f35] text-[#22c55e]" : warn ? "border-[#f6b84b] bg-[#1b2331] text-[#f6b84b]" : "border-[#ff4f93] bg-[#1b2034] text-[#ff4f93]";
  return <div className={`mb-3 rounded-xl border p-4 ${tone}`}><div className="font-bold text-[#eef8ff]">{label}</div><div className="mt-1 break-words text-[12px] opacity-90">{detail}</div></div>;
}
