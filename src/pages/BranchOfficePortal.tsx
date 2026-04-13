import React, { useMemo, useState } from "react";
import {
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Globe2,
  MapPin,
  Package2,
  RefreshCw,
  ShieldCheck,
  Truck,
  WalletCards,
  AlertTriangle,
} from "lucide-react";

type Language = "en" | "my" | "both";

type QueueRow = {
  id: string;
  awb: string;
  customer: string;
  township: string;
  status: string;
  assignee: string;
};

type CashRow = {
  batch: string;
  amount: string;
  state: string;
  updated: string;
};

function bi(language: Language, en: string, my: string) {
  if (language === "en") return en;
  if (language === "my") return my;
  return `${en} / ${my}`;
}

function badgeClass(status: string) {
  const token = status.toUpperCase();
  if (["DELIVERED", "READY", "ACTIVE", "CLEARED"].includes(token)) return "bg-emerald-100 text-emerald-700";
  if (["PENDING", "HOLD", "IN_TRANSIT", "QUEUE"].includes(token)) return "bg-amber-100 text-amber-700";
  if (["FAILED", "ESCALATED", "BLOCKED"].includes(token)) return "bg-rose-100 text-rose-700";
  return "bg-slate-100 text-slate-700";
}

function Surface({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-5">
      <div className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">{eyebrow}</div>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{subtitle}</p>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  caption,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <Surface>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">{label}</div>
          <div className="mt-3 text-3xl font-black tracking-tight text-slate-900">{value}</div>
          <div className="mt-2 text-sm text-slate-500">{caption}</div>
        </div>
        <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
          <Icon size={18} />
        </div>
      </div>
    </Surface>
  );
}

export default function BranchOfficePortal() {
  const [language, setLanguage] = useState<Language>("both");
  const [branchCode] = useState("BEX-YGN-HQ");
  const [search, setSearch] = useState("");

  const queueRows = useMemo<QueueRow[]>(
    () => [
      { id: "1", awb: "BEX-24041001", customer: "Ko Min Zaw", township: "Kamayut", status: "QUEUE", assignee: "Dispatch Desk A" },
      { id: "2", awb: "BEX-24041002", customer: "Daw Hnin Ei", township: "Sanchaung", status: "IN_TRANSIT", assignee: "Rider R-21" },
      { id: "3", awb: "BEX-24041003", customer: "Ko Thet Naing", township: "Hlaing", status: "HOLD", assignee: "Warehouse Gate 2" },
      { id: "4", awb: "BEX-24041004", customer: "Ma Pwint", township: "Insein", status: "DELIVERED", assignee: "Rider R-18" },
    ],
    []
  );

  const cashRows = useMemo<CashRow[]>(
    () => [
      { batch: "COD-2026-04-10-A", amount: "2,450,000 MMK", state: "PENDING", updated: "10:20 AM" },
      { batch: "COD-2026-04-10-B", amount: "1,180,000 MMK", state: "CLEARED", updated: "09:45 AM" },
      { batch: "COD-2026-04-09-C", amount: "980,000 MMK", state: "CLEARED", updated: "Yesterday" },
    ],
    []
  );

  const filteredQueue = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return queueRows;
    return queueRows.filter((row) =>
      [row.awb, row.customer, row.township, row.status, row.assignee].join(" ").toLowerCase().includes(q)
    );
  }, [queueRows, search]);

  return (
    <div className="space-y-6">
      <Surface className="overflow-hidden bg-[linear-gradient(135deg,#061120_0%,#0d2340_60%,#16345d_100%)] text-white shadow-[0_24px_70px_rgba(2,6,23,0.22)]">
        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.85fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-white/80">
              <Building2 size={14} />
              {bi(language, "Branch Office Portal", "Branch Office Portal / ရုံးခွဲပေါ်တယ်")}
            </div>
            <h1 className="mt-4 text-4xl font-black tracking-tight">
              {bi(language, "Branch Operations Command", "ရုံးခွဲလုပ်ငန်းလည်ပတ်မှုထိန်းချုပ်စင်တာ")}
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/75">
              {bi(
                language,
                "Monitor dispatch queue, branch workload, warehouse coordination, COD follow-up, and customer-service escalations from one branch workspace.",
                "Dispatch queue, ရုံးခွဲအလုပ်भार, warehouse coordination, COD follow-up နှင့် customer-service escalation များကို ရုံးခွဲတစ်နေရာတည်းမှ စီမံနိုင်သည်။"
              )}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[24px] border border-white/10 bg-white/10 p-5">
              <div className="text-xs font-black uppercase tracking-[0.25em] text-white/60">
                {bi(language, "Branch Code", "ရုံးခွဲကုဒ်")}
              </div>
              <div className="mt-3 text-2xl font-black">{branchCode}</div>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/10 p-5">
              <div className="text-xs font-black uppercase tracking-[0.25em] text-white/60">
                {bi(language, "Queue Health", "Queue အခြေအနေ")}
              </div>
              <div className="mt-3 text-2xl font-black">Stable</div>
            </div>
          </div>
        </div>
      </Surface>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500">
            <Globe2 size={14} />
            <span>Language</span>
          </div>
          {[
            { value: "en", label: "EN" },
            { value: "my", label: "မြန်မာ" },
            { value: "both", label: "EN + မြန်မာ" },
          ].map((item) => {
            const active = item.value === language;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setLanguage(item.value as Language)}
                className={[
                  "rounded-xl px-3 py-2 text-sm font-semibold transition",
                  active ? "bg-[#0d2c54] text-white shadow" : "bg-slate-50 text-slate-600 hover:bg-slate-100",
                ].join(" ")}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <button className="inline-flex items-center gap-2 rounded-2xl bg-[#0d2c54] px-5 py-3 text-sm font-black text-white">
          <RefreshCw size={16} />
          {bi(language, "Refresh Branch Data", "ရုံးခွဲဒေတာ ပြန်ရယူမည်")}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Package2} label={bi(language, "Queued Shipments", "စောင့်ဆိုင်းနေသော shipment များ")} value="126" caption={bi(language, "Waiting for dispatch or branch action", "Dispatch သို့မဟုတ် branch action စောင့်နေသည်")} />
        <KpiCard icon={Truck} label={bi(language, "Live Riders", "လက်ရှိ rider များ")} value="18" caption={bi(language, "Active delivery assignments", "လက်ရှိ delivery assignment များ")} />
        <KpiCard icon={WalletCards} label={bi(language, "COD Pending", "စောင့်ဆိုင်းနေသော COD")} value="3,630,000 MMK" caption={bi(language, "Uncleared branch COD batches", "မရှင်းလင်းရသေးသော COD batch များ")} />
        <KpiCard icon={AlertTriangle} label={bi(language, "Escalations", "တင်ပြထားသော ပြဿနာများ")} value="7" caption={bi(language, "Require supervisor or HQ review", "Supervisor သို့မဟုတ် HQ review လိုအပ်သည်")} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Surface>
          <SectionTitle eyebrow={bi(language, "Dispatch Queue", "Dispatch Queue")} title={bi(language, "Branch shipment queue", "ရုံးခွဲ shipment queue")} subtitle={bi(language, "Search and review the current branch-level dispatch and warehouse queue.", "လက်ရှိ branch-level dispatch နှင့် warehouse queue ကို ရှာဖွေကြည့်ရှုနိုင်သည်။")} />
          <div className="relative mb-5">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={bi(language, "Search AWB, customer, township, status", "AWB၊ customer၊ township၊ status ဖြင့်ရှာရန်")}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none"
            />
          </div>

          <div className="overflow-hidden rounded-[24px] border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {[bi(language, "AWB", "AWB"), bi(language, "Customer", "ဖောက်သည်"), bi(language, "Township", "မြို့နယ်"), bi(language, "Status", "အခြေအနေ"), bi(language, "Assignee", "တာဝန်ခံ")].map((header) => (
                      <th key={header} className="px-4 py-3 text-left text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredQueue.map((row) => (
                    <tr key={row.id} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-bold text-slate-900">{row.awb}</td>
                      <td className="px-4 py-3 text-slate-700">{row.customer}</td>
                      <td className="px-4 py-3 text-slate-700">{row.township}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${badgeClass(row.status)}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{row.assignee}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Surface>

        <div className="space-y-6">
          <Surface>
            <SectionTitle eyebrow={bi(language, "COD Batches", "COD Batches")} title={bi(language, "Branch settlement follow-up", "ရုံးခွဲ COD settlement follow-up")} subtitle={bi(language, "Monitor branch cash batches and pending settlement states.", "ရုံးခွဲ cash batch များနှင့် စာရင်းရှင်းလင်းမှုအခြေအနေကို စောင့်ကြည့်နိုင်သည်။")} />
            <div className="space-y-3">
              {cashRows.map((row) => (
                <div key={row.batch} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-black text-slate-900">{row.batch}</div>
                      <div className="mt-1 text-sm text-slate-500">{row.updated}</div>
                    </div>
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${badgeClass(row.state)}`}>
                      {row.state}
                    </span>
                  </div>
                  <div className="mt-3 text-lg font-black text-[#0d2c54]">{row.amount}</div>
                </div>
              ))}
            </div>
          </Surface>

          <Surface>
            <SectionTitle eyebrow={bi(language, "Branch Actions", "Branch Actions")} title={bi(language, "Operational shortcuts", "လုပ်ငန်းဆိုင်ရာ shortcut များ")} subtitle={bi(language, "Quick branch tools for queue review, handoff, and exception handling.", "Queue review, handoff နှင့် exception handling အတွက် ရုံးခွဲ shortcut များ။")} />
            <div className="grid gap-3 md:grid-cols-2">
              {[
                [CalendarClock, bi(language, "Pickup Queue", "Pickup Queue")],
                [MapPin, bi(language, "Delivery Zone Board", "Delivery Zone Board")],
                [Clock3, bi(language, "Pending Exceptions", "စောင့်ဆိုင်းနေသော exception များ")],
                [ShieldCheck, bi(language, "Supervisor Escalation", "Supervisor escalation")],
              ].map(([Icon, label]) => (
                <div key={String(label)} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-white p-3 text-slate-700 shadow-sm">
                      {React.createElement(Icon as React.ComponentType<{ size?: number }>, { size: 16 })}
                    </div>
                    <div className="text-sm font-bold text-slate-800">{label as string}</div>
                  </div>
                </div>
              ))}
            </div>
          </Surface>
        </div>
      </div>
    </div>
  );
}
