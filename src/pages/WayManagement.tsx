// @ts-nocheck


import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  Search,
  RefreshCw,
  Route,
  AlertTriangle,
  RotateCcw,
  ShieldAlert,
  FileScan,
  Eye,
  CheckCircle2,
  Truck,
  Clock3,
  XCircle,
  Loader2,
  PackageCheck,
  MapPin,
  Phone,
  MessageSquare,
  X,
} from "lucide-react";

type RawShipment = Record<string, unknown>;
type TimelineEvent = {
  id?: string;
  event_code?: string;
  to_status?: string;
  internal_status?: string;
  public_status?: string;
  event_at?: string;
  notes?: string | null;
  branch_id?: string | null;
  rider_user_id?: string | null;
};

type PodRecord = {
  id?: string;
  pod_type?: string | null;
  recipient_name?: string | null;
  recipient_relationship?: string | null;
  photo_url?: string | null;
  signature_image_url?: string | null;
  otp_verified?: boolean;
  collected_at?: string | null;
};

type WayRow = {
  id: string;
  trackingNo: string;
  customerName: string;
  phone: string;
  status: string;
  collectable: number;
  riderRemark: string;
  lastLocation: string;
  createdAt: string;
};

type ModalType = "status" | "reassign" | "hold" | "return" | "escalate" | null;

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

function toText(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "-";
}

function toNumber(...values: unknown[]): number {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return 0;
}

function formatMMK(value: number): string {
  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0)} MMK`;
}

function formatDate(value?: string | null): string {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function prettifyStatus(status: string) {
  return status.replace(/_/g, " ").toUpperCase();
}

function getStatusBadge(status: string) {
  const s = status.toLowerCase();
  if (["delivered", "success", "completed"].includes(s)) return "bg-emerald-100 text-emerald-700";
  if (["failed", "delivery_failed", "cancelled"].includes(s)) return "bg-rose-100 text-rose-700";
  if (["returned", "return_initiated"].includes(s)) return "bg-amber-100 text-amber-700";
  if (["on_hold", "hold"].includes(s)) return "bg-violet-100 text-violet-700";
  return "bg-sky-100 text-sky-700";
}

function normalizeShipments(input: unknown): WayRow[] {
  const source = Array.isArray(input)
    ? input
    : input && typeof input === "object" && Array.isArray((input as Record<string, unknown>).items)
    ? ((input as Record<string, unknown>).items as RawShipment[])
    : input && typeof input === "object" && Array.isArray((input as Record<string, unknown>).shipments)
    ? ((input as Record<string, unknown>).shipments as RawShipment[])
    : [];

  return source.map((item, index) => ({
    id: toText(item.id, `row-${index}`),
    trackingNo: toText(item.tracking_no, item.trackingNo, item.waybill_no, item.waybillNo, item.code),
    customerName: toText(item.customer_name, item.customerName, item.recipient_name, item.recipientName, item.sender_name, item.senderName),
    phone: toText(item.phone, item.recipient_phone, item.customer_phone, item.sender_phone),
    status: toText(item.current_status, item.status, item.delivery_status, "processing").toLowerCase(),
    collectable: toNumber(item.total_collectable, item.totalCollectable, item.cod_amount, item.codAmount, item.total_charge, item.totalCharge, item.delivery_fee, item.deliveryFee),
    riderRemark: toText(item.rider_remark, item.riderRemark, item.comments, item.remark, "No comments"),
    lastLocation: toText(item.last_location, item.lastLocation, item.address, item.current_branch, "Processing"),
    createdAt: toText(item.created_at, item.createdAt, "-"),
  }));
}

export default function WayManagementPage() {
  const [rows, setRows] = useState<WayRow[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<WayRow | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [pod, setPod] = useState<PodRecord | null>(null);
  const [listLoading, setListLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [modalPayload, setModalPayload] = useState({
    to_status: "out_for_delivery",
    event_code: "STATUS_UPDATED",
    reason_code: "",
    notes: "",
    to_branch_id: "",
    priority: "high",
  });

  useEffect(() => { fetchShipments(); }, []);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(null), 3000); return () => clearTimeout(timer); }, [toast]);

  async function buildHeaders(json = true) {
    const headers = new Headers();
    headers.set("Accept", "application/json");
    headers.set("X-Request-Id", typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}`);
    if (json) headers.set("Content-Type", "application/json");
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) headers.set("Authorization", `Bearer ${session.access_token}`);
    return headers;
  }

  async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, { ...init, cache: "no-store" });
    if (!response.ok) {
      let message = `Request failed (${response.status})`;
      try { const problem = await response.json(); message = problem?.detail || problem?.title || message; } catch {}
      throw new Error(message);
    }
    return response.status === 204 ? {} as T : response.json() as Promise<T>;
  }

  async function fetchShipments() {
    setListLoading(true); setError(null);
    try {
      const headers = await buildHeaders(false);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (query.trim()) params.set("tracking_no", query.trim());
      const data = await apiRequest<unknown>(`/api/v1/shipments${params.toString() ? `?${params}` : ""}`, { method: "GET", headers });
      setRows(normalizeShipments(data));
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to load shipments"); setRows([]); } finally { setListLoading(false); }
  }

  async function openDetails(row: WayRow) {
    setSelected(row); setDetailLoading(true); setTimeline([]); setPod(null);
    try {
      const headers = await buildHeaders(false);
      const [timelineRes, podRes] = await Promise.allSettled([
        apiRequest<{ items?: TimelineEvent[] } | TimelineEvent[]>(`/api/v1/shipments/${row.id}/timeline`, { method: "GET", headers }),
        apiRequest<PodRecord>(`/api/v1/shipments/${row.id}/pod`, { method: "GET", headers }),
      ]);
      if (timelineRes.status === "fulfilled") { const data = timelineRes.value; setTimeline(Array.isArray(data) ? data : data.items || []); }
      if (podRes.status === "fulfilled") setPod(podRes.value);
    } catch (err) { setToast(err instanceof Error ? err.message : "Failed to load timeline"); } finally { setDetailLoading(false); }
  }

  async function submitAction() {
    if (!selected || !modalType) return;
    setActionLoading(true); setError(null);
    try {
      const headers = await buildHeaders(true);
      let endpoint = `/api/v1/shipments/${selected.id}/status`;
      let body = {};
      if (modalType === "status") body = { event_code: modalPayload.event_code, to_status: modalPayload.to_status, notes: modalPayload.notes };
      if (modalType === "reassign") { endpoint = `/api/v1/shipments/${selected.id}/reassign-route`; body = { to_branch_id: modalPayload.to_branch_id, notes: modalPayload.notes }; }
      if (modalType === "hold") { endpoint = `/api/v1/shipments/${selected.id}/hold`; body = { reason_code: modalPayload.reason_code || "MANUAL_HOLD", notes: modalPayload.notes }; }
      if (modalType === "return") { endpoint = `/api/v1/shipments/${selected.id}/return`; body = { reason_code: modalPayload.reason_code || "RETURN_TO_SENDER", notes: modalPayload.notes }; }
      if (modalType === "escalate") { endpoint = `/api/v1/support/tickets`; body = { shipment_id: selected.id, category: "way_management", priority: modalPayload.priority, subject: `Escalation ${selected.trackingNo}`, description: modalPayload.notes }; }

      await apiRequest(endpoint, { method: "POST", headers, body: JSON.stringify(body) });
      setToast("Action completed / လုပ်ဆောင်ချက်ပြီးပါပြီ");
      setModalType(null);
      await fetchShipments();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to submit action"); } finally { setActionLoading(false); }
  }

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const q = query.trim().toLowerCase();
      const matchesQuery = !q || row.trackingNo.toLowerCase().includes(q) || row.customerName.toLowerCase().includes(q) || row.phone.includes(q);
      const matchesStatus = statusFilter === "all" ? true : row.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [rows, query, statusFilter]);

  return (
    <div className="min-h-screen bg-[#f7f9fc] p-8">
      {/* UI Headers */}
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Britium Express Delivery</p>
        <h1 className="text-4xl font-black uppercase tracking-tight text-[#0d2c54]">Way Management <span className="font-normal">/ ကုန်စည်စီမံခန့်ခွဲမှု</span></h1>
      </div>

      {/* Metrics Section */}
      <div className="mt-8 grid gap-4 lg:grid-cols-4">
        <MetricCard icon={<Truck size={28} />} badge="ACTIVE" title="Total Ways / စုစုပေါင်း" value={filteredRows.length} dark />
        <MetricCard icon={<CheckCircle2 className="text-emerald-500" size={28} />} badge="SUCCESS" title="Delivered / ပို့ပြီး" value={filteredRows.filter(r => r.status === 'delivered').length} />
        <MetricCard icon={<XCircle className="text-rose-500" size={28} />} badge="FAILURE" title="Failed / မအောင်မြင်မှု" value={filteredRows.filter(r => r.status.includes('failed')).length} />
        <MetricCard icon={<RotateCcw className="text-amber-500" size={28} />} badge="RETURN" title="Returns / ပြန်ပို့မှု" value={filteredRows.filter(r => r.status.includes('return')).length} />
      </div>

      {/* Control Bar */}
      <div className="mt-8 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr_0.5fr]">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tracking... | ကုန်စည်နံပါတ်ဖြင့်ရှာရန်" className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-medium outline-none focus:border-[#0d2c54]" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none">
            <option value="all">All Statuses / အခြေအနေအားလုံး</option>
            <option value="pending_pickup">Pending Pickup</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
          </select>
          <button onClick={fetchShipments} className="flex items-center justify-center gap-2 rounded-2xl bg-[#0d2c54] px-4 py-3 text-sm font-black text-white">
            {listLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} Refresh
          </button>
        </div>

        {/* Data Table */}
        <div className="mt-8 overflow-x-auto rounded-[28px] border border-slate-200">
          <table className="min-w-full border-separate border-spacing-0 text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-slate-500 font-black uppercase tracking-wider">
                <th className="px-4 py-4">Tracking</th>
                <th className="px-4 py-4">Customer</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Collectable</th>
                <th className="px-4 py-4">Location</th>
                <th className="px-4 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {filteredRows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="px-4 py-4 font-black text-[#0d2c54] border-b border-slate-100">{row.trackingNo}</td>
                  <td className="px-4 py-4 border-b border-slate-100"><div>{row.customerName}</div><div className="text-xs text-slate-400">{row.phone}</div></td>
                  <td className="px-4 py-4 border-b border-slate-100"><span className={`rounded-full px-3 py-1 text-[10px] font-black ${getStatusBadge(row.status)}`}>{row.status.toUpperCase()}</span></td>
                  <td className="px-4 py-4 font-black text-emerald-600 border-b border-slate-100">{formatMMK(row.collectable)}</td>
                  <td className="px-4 py-4 text-slate-600 border-b border-slate-100">{row.lastLocation}</td>
                  <td className="px-4 py-4 border-b border-slate-100">
                    <button onClick={() => openDetails(row)} className="text-[#0d2c54] hover:underline font-bold">Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Sub-components
function MetricCard({ icon, badge, title, value, dark = false }: any) {
  return (
    <div className={`rounded-[28px] p-6 shadow-sm ${dark ? "bg-[#192b4d] text-white" : "bg-white"}`}>
      <div className="mb-6 flex items-center justify-between">{icon} <span className="bg-slate-100 text-slate-700 rounded-full px-3 py-1 text-[10px] font-black uppercase">{badge}</span></div>
      <p className="text-xs font-black uppercase tracking-[0.2em] opacity-60">{title}</p>
      <p className="mt-4 text-5xl font-black">{value}</p>
    </div>
  );
}