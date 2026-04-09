"use client";

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

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

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

  if (["delivered", "success", "completed"].includes(s)) {
    return "bg-emerald-100 text-emerald-700";
  }
  if (["failed", "delivery_failed", "cancelled"].includes(s)) {
    return "bg-rose-100 text-rose-700";
  }
  if (["returned", "return_initiated"].includes(s)) {
    return "bg-amber-100 text-amber-700";
  }
  if (["on_hold", "hold"].includes(s)) {
    return "bg-violet-100 text-violet-700";
  }

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
    trackingNo: toText(
      item.tracking_no,
      item.trackingNo,
      item.waybill_no,
      item.waybillNo,
      item.code
    ),
    customerName: toText(
      item.customer_name,
      item.customerName,
      item.recipient_name,
      item.recipientName,
      item.sender_name,
      item.senderName
    ),
    phone: toText(
      item.phone,
      item.recipient_phone,
      item.customer_phone,
      item.sender_phone
    ),
    status: toText(
      item.current_status,
      item.status,
      item.delivery_status,
      "processing"
    ).toLowerCase(),
    collectable: toNumber(
      item.total_collectable,
      item.totalCollectable,
      item.cod_amount,
      item.codAmount,
      item.total_charge,
      item.totalCharge,
      item.delivery_fee,
      item.deliveryFee,
      item.delivery_fee_kms
    ),
    riderRemark: toText(
      item.rider_remark,
      item.riderRemark,
      item.comments,
      item.remark,
      "No comments"
    ),
    lastLocation: toText(
      item.last_location,
      item.lastLocation,
      item.address,
      item.current_branch,
      "Processing"
    ),
    createdAt: toText(item.created_at, item.createdAt, "-"),
  }));
}

export default function WayManagementPage() {
  // Removed local client;

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

  useEffect(() => {
    fetchShipments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  async function buildHeaders(json = true) {
    const headers = new Headers();
    headers.set("Accept", "application/json");
    headers.set(
      "X-Request-Id",
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}`
    );

    if (json) headers.set("Content-Type", "application/json");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.access_token) {
      headers.set("Authorization", `Bearer ${session.access_token}`);
    }

    return headers;
  }

  async function apiRequest<T>(
    path: string,
    init?: RequestInit
  ): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
      ...init,
      cache: "no-store",
    });

    if (!response.ok) {
      let message = `Request failed (${response.status})`;
      try {
        const problem = await response.json();
        message = problem?.detail || problem?.title || message;
      } catch {
        // ignore
      }
      throw new Error(message);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json() as Promise<T>;
  }

  async function fetchShipments() {
    setListLoading(true);
    setError(null);

    try {
      const headers = await buildHeaders(false);
      const params = new URLSearchParams();

      if (statusFilter !== "all") params.set("status", statusFilter);
      if (query.trim()) params.set("tracking_no", query.trim());

      const data = await apiRequest<unknown>(
        `/api/v1/shipments${params.toString() ? `?${params}` : ""}`,
        {
          method: "GET",
          headers,
        }
      );

      setRows(normalizeShipments(data));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load shipments";
      setError(message);
      setRows([]);
    } finally {
      setListLoading(false);
    }
  }

  async function openDetails(row: WayRow) {
    setSelected(row);
    setDetailLoading(true);
    setTimeline([]);
    setPod(null);

    try {
      const headers = await buildHeaders(false);

      const [timelineRes, podRes] = await Promise.allSettled([
        apiRequest<{ items?: TimelineEvent[] } | TimelineEvent[]>(
          `/api/v1/shipments/${row.id}/timeline`,
          { method: "GET", headers }
        ),
        apiRequest<PodRecord>(
          `/api/v1/shipments/${row.id}/pod`,
          { method: "GET", headers }
        ),
      ]);

      if (timelineRes.status === "fulfilled") {
        const data = timelineRes.value;
        setTimeline(Array.isArray(data) ? data : data.items || []);
      }

      if (podRes.status === "fulfilled") {
        setPod(podRes.value);
      }
    } catch (err) {
      setToast(
        err instanceof Error
          ? err.message
          : "Failed to load timeline details"
      );
    } finally {
      setDetailLoading(false);
    }
  }

  async function submitAction() {
    if (!selected || !modalType) return;

    setActionLoading(true);
    setError(null);

    try {
      if (modalType === "status") {
        const headers = await buildHeaders(true);
        await apiRequest(
          `/api/v1/shipments/${selected.id}/status`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              event_code: modalPayload.event_code || "STATUS_UPDATED",
              to_status: modalPayload.to_status,
              reason_code: modalPayload.reason_code || null,
              notes: modalPayload.notes || null,
            }),
          }
        );
      }

      if (modalType === "reassign") {
        const headers = await buildHeaders(true);
        await apiRequest(
          `/api/v1/shipments/${selected.id}/reassign-route`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              to_branch_id: modalPayload.to_branch_id || null,
              notes: modalPayload.notes || null,
            }),
          }
        );
      }

      if (modalType === "hold") {
        const headers = await buildHeaders(true);
        await apiRequest(
          `/api/v1/shipments/${selected.id}/hold`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              reason_code: modalPayload.reason_code || "MANUAL_HOLD",
              notes: modalPayload.notes || null,
            }),
          }
        );
      }

      if (modalType === "return") {
        const headers = await buildHeaders(true);
        await apiRequest(
          `/api/v1/shipments/${selected.id}/return`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              reason_code: modalPayload.reason_code || "RETURN_TO_SENDER",
              notes: modalPayload.notes || null,
            }),
          }
        );
      }

      if (modalType === "escalate") {
        const headers = await buildHeaders(true);
        await apiRequest(`/api/v1/support/tickets`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            shipment_id: selected.id,
            category: "way_management_escalation",
            priority: modalPayload.priority || "high",
            subject: `Escalation for ${selected.trackingNo}`,
            description:
              modalPayload.notes || `Manual escalation for ${selected.trackingNo}`,
          }),
        });
      }

      setToast("Action completed successfully / လုပ်ဆောင်ချက်ပြီးပါပြီ");
      setModalType(null);

      await fetchShipments();
      await openDetails(selected);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit action"
      );
    } finally {
      setActionLoading(false);
    }
  }

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        row.trackingNo.toLowerCase().includes(q) ||
        row.customerName.toLowerCase().includes(q) ||
        row.phone.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all" ? true : row.status === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [rows, query, statusFilter]);

  const totalWays = filteredRows.length;
  const successCount = filteredRows.filter((x) =>
    ["delivered", "success", "completed"].includes(x.status)
  ).length;
  const failureCount = filteredRows.filter((x) =>
    ["failed", "delivery_failed", "cancelled"].includes(x.status)
  ).length;
  const returnCount = filteredRows.filter((x) =>
    ["returned", "return_initiated"].includes(x.status)
  ).length;

  return (
    <div className="min-h-screen bg-[#f7f9fc] p-8">
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">
          Britium Express Delivery
        </p>

        <h1 className="text-4xl font-black uppercase tracking-tight text-[#0d2c54]">
          Way Management <span className="font-normal">/ ကုန်စည်စီမံခန့်ခွဲမှု</span>
        </h1>

        <p className="text-slate-500">
          Chain of custody, QR scanning, dispatch routing, status control, and
          proof-of-delivery review. / ကုန်စည်လမ်းကြောင်း၊ QR စကင်န်ဖတ်ခြင်း၊
          လမ်းကြောင်းပြန်သတ်မှတ်ခြင်း၊ အခြေအနေပြင်ဆင်ခြင်းနှင့် POD စစ်ဆေးခြင်း
        </p>
      </div>

      {toast && (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          {toast}
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
          {error}
        </div>
      )}

      <div className="mt-8 grid gap-4 lg:grid-cols-4">
        <MetricCard
          icon={<Truck className="text-white/90" size={28} />}
          badge="ACTIVE"
          badgeClass="bg-emerald-100 text-emerald-700"
          title="All Ways / စုစုပေါင်း"
          value={totalWays}
          dark
        />
        <MetricCard
          icon={<CheckCircle2 className="text-emerald-500" size={28} />}
          badge="SUCCESS"
          badgeClass="bg-emerald-100 text-emerald-700"
          title="Success / အောင်မြင်မှု"
          value={successCount}
        />
        <MetricCard
          icon={<XCircle className="text-rose-500" size={28} />}
          badge="FAILURE"
          badgeClass="bg-rose-100 text-rose-700"
          title="Failures / မအောင်မြင်မှု"
          value={failureCount}
        />
        <MetricCard
          icon={<RotateCcw className="text-amber-500" size={28} />}
          badge="RETURN"
          badgeClass="bg-amber-100 text-amber-700"
          title="Returns / ပြန်ပို့မှု"
          value={returnCount}
        />
      </div>

      <div className="mt-8 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr_0.5fr]">
          <div className="relative">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by tracking / customer / phone ... | ကုန်စည်နံပါတ်၊ အမည်၊ ဖုန်းဖြင့်ရှာရန်"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-medium text-slate-700 outline-none transition focus:border-[#0d2c54] focus:bg-white"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-[#0d2c54] focus:bg-white"
          >
            <option value="all">All Statuses / အခြေအနေအားလုံး</option>
            <option value="pending_pickup">Pending Pickup / လာယူရန်စောင့်ဆိုင်း</option>
            <option value="out_for_delivery">Out for Delivery / ပို့ဆောင်နေသည်</option>
            <option value="delivered">Delivered / ပို့ပြီး</option>
            <option value="delivery_failed">Delivery Failed / မပို့နိုင်</option>
            <option value="returned">Returned / ပြန်ပို့ပြီး</option>
            <option value="on_hold">On Hold / ဆိုင်းငံ့</option>
          </select>

          <button
            onClick={fetchShipments}
            className="flex items-center justify-center gap-2 rounded-2xl bg-[#0d2c54] px-4 py-3 text-sm font-black uppercase tracking-wider text-white transition hover:opacity-95"
          >
            {listLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            Refresh / ပြန်ဖတ်
          </button>
        </div>

        <div className="mt-8 overflow-x-auto rounded-[28px] border border-slate-200">
          <table className="min-w-full border-separate border-spacing-0 text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-slate-500">
                <th className="border-b border-slate-200 px-4 py-4 font-black uppercase tracking-wider">
                  Tracking / ကုန်စည်နံပါတ်
                </th>
                <th className="border-b border-slate-200 px-4 py-4 font-black uppercase tracking-wider">
                  Customer / ဖောက်သည်
                </th>
                <th className="border-b border-slate-200 px-4 py-4 font-black uppercase tracking-wider">
                  Status / အခြေအနေ
                </th>
                <th className="border-b border-slate-200 px-4 py-4 font-black uppercase tracking-wider">
                  Collectable / ကောက်ခံရမည့်ငွေ
                </th>
                <th className="border-b border-slate-200 px-4 py-4 font-black uppercase tracking-wider">
                  Location / တည်နေရာ
                </th>
                <th className="border-b border-slate-200 px-4 py-4 font-black uppercase tracking-wider">
                  Rider Remarks / မှတ်ချက်
                </th>
                <th className="border-b border-slate-200 px-4 py-4 font-black uppercase tracking-wider">
                  Actions / လုပ်ဆောင်ချက်
                </th>
              </tr>
            </thead>

            <tbody className="bg-white">
              {listLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Loading records / မှတ်တမ်းများဖတ်နေသည်
                    </div>
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                    No matching way records. / ကိုက်ညီသောမှတ်တမ်းမရှိပါ
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="border-b border-slate-100 px-4 py-4">
                      <div className="font-black text-[#0d2c54]">{row.trackingNo}</div>
                      <div className="mt-1 text-xs text-slate-400">{formatDate(row.createdAt)}</div>
                    </td>

                    <td className="border-b border-slate-100 px-4 py-4">
                      <div className="font-bold text-slate-700">{row.customerName}</div>
                      <div className="mt-1 text-xs text-slate-400">{row.phone}</div>
                    </td>

                    <td className="border-b border-slate-100 px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${getStatusBadge(
                          row.status
                        )}`}
                      >
                        {prettifyStatus(row.status)}
                      </span>
                    </td>

                    <td className="border-b border-slate-100 px-4 py-4 font-black text-emerald-600">
                      {formatMMK(row.collectable)}
                    </td>

                    <td className="border-b border-slate-100 px-4 py-4 text-slate-600">
                      {row.lastLocation}
                    </td>

                    <td className="border-b border-slate-100 px-4 py-4 text-slate-500 italic">
                      {row.riderRemark}
                    </td>

                    <td className="border-b border-slate-100 px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <ActionButton
                          label="Timeline"
                          mm="အစီအစဉ်"
                          icon={<Eye size={14} />}
                          tone="slate"
                          onClick={() => openDetails(row)}
                        />
                        <ActionButton
                          label="Status"
                          mm="အခြေအနေ"
                          icon={<FileScan size={14} />}
                          tone="blue"
                          onClick={() => {
                            setSelected(row);
                            setModalType("status");
                          }}
                        />
                        <ActionButton
                          label="Reassign"
                          mm="ပြန်သတ်မှတ်"
                          icon={<Route size={14} />}
                          tone="amber"
                          onClick={() => {
                            setSelected(row);
                            setModalType("reassign");
                          }}
                        />
                        <ActionButton
                          label="Hold"
                          mm="ဆိုင်းငံ့"
                          icon={<AlertTriangle size={14} />}
                          tone="violet"
                          onClick={() => {
                            setSelected(row);
                            setModalType("hold");
                          }}
                        />
                        <ActionButton
                          label="Return"
                          mm="ပြန်ပို့"
                          icon={<RotateCcw size={14} />}
                          tone="orange"
                          onClick={() => {
                            setSelected(row);
                            setModalType("return");
                          }}
                        />
                        <ActionButton
                          label="Escalate"
                          mm="တင်ပြ"
                          icon={<ShieldAlert size={14} />}
                          tone="rose"
                          onClick={() => {
                            setSelected(row);
                            setModalType("escalate");
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="mt-8 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black text-[#0d2c54]">
                Shipment Lifecycle / ကုန်စည်လမ်းကြောင်းအခြေအနေ
              </h2>
              <p className="mt-1 text-slate-500">
                {selected.trackingNo} · {selected.customerName}
              </p>
            </div>

            <button
              onClick={() => setSelected(null)}
              className="rounded-2xl bg-slate-100 px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-700 hover:bg-slate-200"
            >
              Close / ပိတ်မည်
            </button>
          </div>

          {detailLoading ? (
            <div className="py-10 text-center text-slate-400">
              <div className="inline-flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Loading detail / အသေးစိတ်ဖတ်နေသည်
              </div>
            </div>
          ) : (
            <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <InfoCard
                    icon={<PackageCheck size={18} className="text-[#0d2c54]" />}
                    title="Tracking / ကုန်စည်နံပါတ်"
                    value={selected.trackingNo}
                  />
                  <InfoCard
                    icon={<Clock3 size={18} className="text-[#0d2c54]" />}
                    title="Status / အခြေအနေ"
                    value={prettifyStatus(selected.status)}
                  />
                  <InfoCard
                    icon={<Truck size={18} className="text-[#0d2c54]" />}
                    title="Collectable / ကောက်ခံငွေ"
                    value={formatMMK(selected.collectable)}
                    valueClass="text-emerald-600"
                  />
                  <InfoCard
                    icon={<MapPin size={18} className="text-[#0d2c54]" />}
                    title="Last Location / နောက်ဆုံးတည်နေရာ"
                    value={selected.lastLocation}
                  />
                </div>

                <div className="rounded-2xl border border-slate-200 p-5">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">
                    Timeline / အစီအစဉ်
                  </h3>

                  <div className="mt-5 space-y-4">
                    {timeline.length === 0 ? (
                      <div className="text-sm text-slate-400">
                        No timeline records found. / အစီအစဉ်မှတ်တမ်းမရှိပါ
                      </div>
                    ) : (
                      timeline.map((event, idx) => (
                        <div key={event.id || idx} className="flex items-start gap-4">
                          <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#0d2c54] text-white">
                            <Clock3 size={14} />
                          </div>
                          <div>
                            <p className="font-black text-[#0d2c54]">
                              {toText(
                                event.public_status,
                                event.internal_status,
                                event.to_status,
                                event.event_code,
                                "EVENT"
                              )}
                            </p>
                            <p className="text-sm text-slate-500">
                              {formatDate(event.event_at)} · {toText(event.notes, "No notes / မှတ်ချက်မရှိ")}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 p-5">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">
                    Proof of Delivery / ပို့ဆောင်မှုအထောက်အထား
                  </h3>

                  <div className="mt-4 space-y-3 text-sm text-slate-600">
                    <div className="flex items-center gap-3">
                      <PackageCheck size={16} className="text-slate-400" />
                      <span>Type / အမျိုးအစား: {toText(pod?.pod_type, "-")}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone size={16} className="text-slate-400" />
                      <span>Recipient / လက်ခံသူ: {toText(pod?.recipient_name, "-")}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 size={16} className="text-slate-400" />
                      <span>
                        OTP / OTP အတည်ပြုချက်: {pod?.otp_verified ? "Verified / အတည်ပြုပြီး" : "Not verified / မအတည်ပြုရသေး"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock3 size={16} className="text-slate-400" />
                      <span>Collected / စုဆောင်းချိန်: {formatDate(pod?.collected_at || null)}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-5">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">
                    Notes / မှတ်ချက်
                  </h3>
                  <div className="mt-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                    {selected.riderRemark}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {modalType && selected && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-2xl rounded-[28px] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-2xl font-black text-[#0d2c54]">
                  {getModalTitle(modalType)}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {selected.trackingNo} · {selected.customerName}
                </p>
              </div>

              <button
                onClick={() => setModalType(null)}
                className="rounded-xl bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {modalType === "status" && (
                <>
                  <FieldLabel text="Target Status / သတ်မှတ်မည့်အခြေအနေ" />
                  <select
                    value={modalPayload.to_status}
                    onChange={(e) =>
                      setModalPayload((prev) => ({
                        ...prev,
                        to_status: e.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none"
                  >
                    <option value="out_for_delivery">Out for Delivery / ပို့ဆောင်နေသည်</option>
                    <option value="delivered">Delivered / ပို့ပြီး</option>
                    <option value="delivery_attempted">Delivery Attempted / ပို့ရန်ကြိုးစားခဲ့</option>
                    <option value="delivery_failed">Delivery Failed / မပို့နိုင်</option>
                    <option value="received_at_destination">At Destination / ရောက်ရှိပြီး</option>
                    <option value="on_hold">On Hold / ဆိုင်းငံ့</option>
                  </select>

                  <FieldLabel text="Event Code / ဖြစ်စဉ်ကုဒ်" />
                  <input
                    value={modalPayload.event_code}
                    onChange={(e) =>
                      setModalPayload((prev) => ({
                        ...prev,
                        event_code: e.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none"
                    placeholder="STATUS_UPDATED"
                  />
                </>
              )}

              {modalType === "reassign" && (
                <>
                  <FieldLabel text="Target Branch ID / ပြောင်းမည့်ရုံး ID" />
                  <input
                    value={modalPayload.to_branch_id}
                    onChange={(e) =>
                      setModalPayload((prev) => ({
                        ...prev,
                        to_branch_id: e.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none"
                    placeholder="destination-branch-id"
                  />
                </>
              )}

              {(modalType === "hold" || modalType === "return") && (
                <>
                  <FieldLabel text="Reason Code / အကြောင်းပြချက်ကုဒ်" />
                  <input
                    value={modalPayload.reason_code}
                    onChange={(e) =>
                      setModalPayload((prev) => ({
                        ...prev,
                        reason_code: e.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none"
                    placeholder={
                      modalType === "hold"
                        ? "MANUAL_HOLD"
                        : "RETURN_TO_SENDER"
                    }
                  />
                </>
              )}

              {modalType === "escalate" && (
                <>
                  <FieldLabel text="Priority / ဦးစားပေးအဆင့်" />
                  <select
                    value={modalPayload.priority}
                    onChange={(e) =>
                      setModalPayload((prev) => ({
                        ...prev,
                        priority: e.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none"
                  >
                    <option value="medium">Medium / အလတ်စား</option>
                    <option value="high">High / မြင့်</option>
                    <option value="urgent">Urgent / အရေးကြီး</option>
                  </select>
                </>
              )}

              <FieldLabel text="Notes / မှတ်ချက်" />
              <textarea
                value={modalPayload.notes}
                onChange={(e) =>
                  setModalPayload((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                rows={5}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none"
                placeholder="Enter notes here... / မှတ်ချက်ရေးပါ"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setModalType(null)}
                className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-black uppercase tracking-wider text-slate-700 hover:bg-slate-200"
              >
                Cancel / ပယ်ဖျက်
              </button>

              <button
                onClick={submitAction}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#0d2c54] px-5 py-3 text-sm font-black uppercase tracking-wider text-white hover:opacity-95 disabled:opacity-60"
              >
                {actionLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <MessageSquare size={16} />
                )}
                Submit / တင်ပို့
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  icon,
  badge,
  badgeClass,
  title,
  value,
  dark = false,
}: {
  icon: React.ReactNode;
  badge: string;
  badgeClass: string;
  title: string;
  value: number;
  dark?: boolean;
}) {
  return (
    <div className={`rounded-[28px] p-6 shadow-sm ${dark ? "bg-[#192b4d] text-white" : "bg-white"}`}>
      <div className="mb-6 flex items-center justify-between">
        {icon}
        <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${badgeClass}`}>
          {badge}
        </span>
      </div>
      <p className={`text-xs font-black uppercase tracking-[0.2em] ${dark ? "text-white/60" : "text-slate-400"}`}>
        {title}
      </p>
      <p className={`mt-4 text-5xl font-black ${dark ? "text-white" : "text-[#0d2c54]"}`}>
        {value}
      </p>
    </div>
  );
}

function ActionButton({
  label,
  mm,
  icon,
  tone,
  onClick,
}: {
  label: string;
  mm: string;
  icon: React.ReactNode;
  tone: "slate" | "blue" | "amber" | "violet" | "orange" | "rose";
  onClick: () => void;
}) {
  const toneMap: Record<string, string> = {
    slate: "bg-slate-100 text-slate-700 hover:bg-slate-200",
    blue: "bg-blue-50 text-blue-700 hover:bg-blue-100",
    amber: "bg-amber-50 text-amber-700 hover:bg-amber-100",
    violet: "bg-violet-50 text-violet-700 hover:bg-violet-100",
    orange: "bg-orange-50 text-orange-700 hover:bg-orange-100",
    rose: "bg-rose-50 text-rose-700 hover:bg-rose-100",
  };

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-wider ${toneMap[tone]}`}
    >
      {icon}
      {label} / {mm}
    </button>
  );
}

function InfoCard({
  icon,
  title,
  value,
  valueClass = "text-[#0d2c54]",
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          {title}
        </p>
      </div>
      <p className={`mt-2 font-black ${valueClass}`}>{value}</p>
    </div>
  );
}

function FieldLabel({ text }: { text: string }) {
  return (
    <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
      {text}
    </label>
  );
}

function getModalTitle(type: ModalType) {
  switch (type) {
    case "status":
      return "Status Update Console / အခြေအနေပြင်ဆင်ရန်";
    case "reassign":
      return "Routing & Reassignment / လမ်းကြောင်းပြန်သတ်မှတ်ရန်";
    case "hold":
      return "Hold / Exception Handling / ဆိုင်းငံ့မှု";
    case "return":
      return "Return to Sender / ပြန်ပို့ရန်";
    case "escalate":
      return "Escalation Management / အရေးပေါ်တင်ပြရန်";
    default:
      return "Action / လုပ်ဆောင်ချက်";
  }
}
