import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Database, Loader2, RefreshCw, Server, Wifi } from "lucide-react";
import type { AppScreen } from "@/lib/appScreens";
import { loadScreenBackendData, previewColumns, previewValue, subscribeScreenBackend, type BackendApiResult } from "@/lib/backendApi";

type Props = {
  screen: AppScreen;
};

const initialResult: BackendApiResult = {
  status: "empty",
  source: "not loaded",
  rows: [],
  checked: [],
  updatedAt: "",
};

export default function LiveApiScreen({ screen }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BackendApiResult>(initialResult);

  const loadData = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const nextResult = await loadScreenBackendData(screen, 50);
      setResult(nextResult);
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, [screen]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    return subscribeScreenBackend(screen, () => void loadData(false));
  }, [screen, loadData]);

  const columns = useMemo(() => previewColumns(result.rows, 7), [result.rows]);
  const checkedRpc = result.checked.filter((item) => item.startsWith("rpc:")).length;
  const checkedTables = result.checked.filter((item) => item.startsWith("table:")).length;
  const ok = result.status === "success";

  return (
    <div className="space-y-6 overflow-x-hidden">
      <div className="border-b border-[#1a3a5c] pb-4">
        <div className="mb-2 text-[11px] uppercase tracking-widest text-[#4d7a9b]">{screen.category}</div>
        <h1 className="mb-1 text-[18px] uppercase tracking-widest text-[#f6b84b]">{screen.title}</h1>
        <p className="max-w-5xl text-[13px] leading-6 text-[#4d7a9b]">{screen.description}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Metric icon={<Database size={18} />} label="Rows" value={result.rows.length} tone="text-[#f6b84b]" />
        <Metric icon={<Server size={18} />} label="RPC Checks" value={checkedRpc} tone="text-[#4ea8de]" />
        <Metric icon={<Wifi size={18} />} label="Table Checks" value={checkedTables} tone="text-[#22c55e]" />
        <Metric icon={<CheckCircle2 size={18} />} label="Status" value={ok ? 1 : 0} textValue={ok ? "Live" : result.status} tone={ok ? "text-[#22c55e]" : "text-[#ff4f93]"} />
      </div>

      <div className="rounded-2xl border border-[#1a3a5c] bg-[#0b2236] p-4 text-[13px] font-bold text-[#eef8ff]">
        <div className="flex items-start gap-3">
          {loading ? <Loader2 size={16} className="mt-0.5 shrink-0 animate-spin text-[#4ea8de]" /> : <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[#f6b84b]" />}
          <span className="break-words">
            {ok
              ? `Backend connected through ${result.source}.`
              : result.error
                ? `No live rows yet. Last backend response: ${result.error}`
                : "No live rows returned yet. The frontend route is ready and will show data as soon as the configured RPC/table is available."}
          </span>
        </div>
        <div className="mt-2 text-xs text-[#4d7a9b]">Last sync: {result.updatedAt ? new Date(result.updatedAt).toLocaleString() : "not yet"}</div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(360px,0.7fr)]">
        <div className="overflow-hidden rounded-2xl border border-[#1a3a5c] bg-[#0b2236]">
          <div className="flex flex-col gap-3 border-b border-[#1a3a5c] p-4 md:flex-row md:items-center md:justify-between">
            <h3 className="text-[14px] uppercase tracking-widest text-[#eef8ff]">Live Backend Preview</h3>
            <button type="button" onClick={() => loadData()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f6b84b] px-5 py-3 text-[12px] font-black uppercase tracking-wider text-[#061524] disabled:opacity-50">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Sync Now
            </button>
          </div>

          <div className="overflow-auto">
            {result.rows.length === 0 ? (
              <div className="p-10 text-center text-[13px] text-[#4d7a9b]">No preview rows loaded for this screen yet.</div>
            ) : (
              <table className="min-w-[900px] w-full border-separate border-spacing-0 text-left text-sm">
                <thead className="bg-[#061524] text-[11px] uppercase tracking-widest text-[#4d7a9b]">
                  <tr>
                    {columns.map((column) => <th key={column} className="px-4 py-4">{column}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.slice(0, 20).map((row, index) => (
                    <tr key={index} className="hover:bg-[#061524]">
                      {columns.map((column) => <td key={column} className="max-w-[260px] truncate border-b border-[#1a3a5c] px-4 py-4 text-[#eef8ff]">{previewValue(row[column])}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-[#1a3a5c] bg-[#0b2236] p-6">
            <h3 className="mb-4 text-[14px] uppercase tracking-widest text-[#eef8ff]">Frontend Route</h3>
            <Info label="Path" value={screen.path} />
            <Info label="Screen Key" value={screen.key} />
            <Info label="Category" value={screen.category} />
          </div>

          <div className="rounded-2xl border border-[#1a3a5c] bg-[#0b2236] p-6">
            <h3 className="mb-4 text-[14px] uppercase tracking-widest text-[#eef8ff]">Backend API Wiring</h3>
            <Info label="RPC Fallbacks" value={screen.backend.rpc.join(", ")} />
            <Info label="Table Fallbacks" value={screen.backend.tables.join(", ")} />
            <Info label="Realtime Tables" value={(screen.backend.realtimeTables || screen.backend.tables).join(", ")} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ icon, label, value, textValue, tone }: { icon: JSX.Element; label: string; value: number; textValue?: string; tone: string }) {
  return <div className="rounded-2xl border border-[#1a3a5c] bg-[#0b2236] p-5"><div className="mb-3 flex items-center justify-between text-[#4d7a9b]">{icon}<span className="text-[10px] uppercase tracking-widest">Live</span></div><div className="text-[11px] uppercase tracking-widest text-[#4d7a9b]">{label}</div><div className={`mt-1 text-2xl font-black capitalize ${tone}`}>{textValue || Number(value || 0).toLocaleString()}</div></div>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="mb-4"><div className="text-[10px] uppercase tracking-widest text-[#4d7a9b]">{label}</div><div className="mt-1 break-words text-[12px] font-bold text-[#eef8ff]">{value || "-"}</div></div>;
}
