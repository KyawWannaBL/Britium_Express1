

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Calculator,
  CheckCircle2,
  Download,
  Globe2,
  History,
  Inbox,
  Lock,
  Map,
  MapPin,
  Network,
  PlusCircle,
  RefreshCw,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Store,
  Truck,
  Upload,
  UserCog,
  UserPlus,
  XCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DEFAULT_ROLES,
  PERMISSIONS,
  STORAGE_KEY,
  type Account,
  type AccountStatus,
  type AuthorityRequest,
  type Role,
  activeGrantsFor,
  approveAuthorityRequest,
  can,
  canApplyAuthorityDirect,
  canRequestAuthorityChange,
  csvParse,
  csvStringify,
  defaultPortalPermissionsForRole,
  ensureAtLeastOneSuperAdminActive,
  getAccountByEmail,
  grantDirect,
  isEmailValid,
  loadStore,
  nowIso,
  pushAudit,
  rejectAuthorityRequest,
  requestAuthorityChange,
  revokeDirect,
  roleIsPrivileged,
  safeLower,
  saveStore,
  uuid,
  bootstrapSignedInUser,
} from "@/lib/accountControlStore";

type Language = "en" | "my" | "both";
type SettingsTab =
  | "system"
  | "tariff"
  | "network"
  | "geo"
  | "routePoints"
  | "towns"
  | "terms"
  | "auth";
type RoutePointTab = "highway" | "postOffice" | "poi";
type AuthView = "ACCOUNTS" | "AUTH_REQUESTS" | "AUDIT";
type Toast = { type: "ok" | "err" | "warn"; msg: string };

type SystemField = {
  key: string;
  labelEn: string;
  labelMy: string;
  value: string;
  hintEn: string;
  hintMy: string;
};

type SystemToggle = {
  key: string;
  labelEn: string;
  labelMy: string;
  enabled: boolean;
  hintEn: string;
  hintMy: string;
};

function bi(language: Language, en: string, my: string) {
  if (language === "en") return en;
  if (language === "my") return my;
  return `${en} / ${my}`;
}

function LanguageToggle({
  value,
  onChange,
}: {
  value: Language;
  onChange: (value: Language) => void;
}) {
  const items: Array<{ value: Language; label: string }> = [
    { value: "en", label: "EN" },
    { value: "my", label: "မြန်မာ" },
    { value: "both", label: "EN + မြန်မာ" },
  ];

  return (
    <div className="inline-flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
      <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500">
        <Globe2 size={14} />
        <span>Language</span>
      </div>
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
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
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-black text-[#0d2c54]">{title}</h2>
      {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      <div className="mt-4">{children}</div>
    </div>
  );
}

function StatusPill({
  text,
  tone,
}: {
  text: string;
  tone: "default" | "good" | "warn" | "bad";
}) {
  const cls = {
    default: "bg-slate-100 text-slate-700",
    good: "bg-emerald-100 text-emerald-700",
    warn: "bg-amber-100 text-amber-700",
    bad: "bg-rose-100 text-rose-700",
  }[tone];

  return <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase ${cls}`}>{text}</span>;
}

function Modal(props: {
  open: boolean;
  title: string;
  onClose: () => void;
  widthClass?: string;
  children: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!props.open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && props.onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [props.open, props.onClose]);

  useEffect(() => {
    if (props.open) setTimeout(() => panelRef.current?.focus(), 0);
  }, [props.open]);

  if (!props.open) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={props.onClose} />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        className={`relative w-full ${props.widthClass ?? "max-w-3xl"} max-h-[90vh] overflow-y-auto rounded-[2rem] bg-[#05080F] shadow-2xl outline-none ring-1 ring-white/10`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/5 bg-[#05080F]/90 p-6 backdrop-blur-md">
          <div>
            <div className="font-black uppercase italic text-white">{props.title}</div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
              enterprise_identity_governance
            </div>
          </div>
          <Button variant="ghost" className="text-slate-400 hover:text-white" onClick={props.onClose}>
            <XCircle className="h-5 w-5" />
          </Button>
        </div>
        <div className="p-6">{props.children}</div>
      </div>
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-11 w-full rounded-xl border border-white/10 bg-[#0B101B] px-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/40 ${props.className ?? ""}`}
    />
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`min-h-[92px] w-full rounded-xl border border-white/10 bg-[#0B101B] px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/40 ${props.className ?? ""}`}
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`h-11 w-full rounded-xl border border-white/10 bg-[#0B101B] px-4 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/40 ${props.className ?? ""}`}
    />
  );
}

function Divider() {
  return <div className="h-px w-full bg-white/5" />;
}

function Pill(props: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black tracking-tighter ${props.className ?? ""}`}>
      {props.children}
    </span>
  );
}

function roleBadgeClass(role: Role): string {
  if (role === "SYS" || role === "APP_OWNER") return "bg-emerald-500/10 text-emerald-400";
  if (role === "SUPER_ADMIN") return "bg-sky-500/10 text-sky-400";
  if (role === "ADMIN" || role === "ADM" || role === "MGR") return "bg-amber-500/10 text-amber-300";
  return "bg-white/5 text-slate-300";
}

function formatStatus(status: AccountStatus): { label: string; cls: string } {
  switch (status) {
    case "ACTIVE":
      return { label: "ACTIVE", cls: "text-emerald-400" };
    case "PENDING":
      return { label: "PENDING", cls: "text-amber-400" };
    case "SUSPENDED":
      return { label: "SUSPENDED", cls: "text-rose-400" };
    case "REJECTED":
      return { label: "REJECTED", cls: "text-rose-400" };
    case "ARCHIVED":
      return { label: "ARCHIVED", cls: "text-slate-500" };
    default:
      return { label: status, cls: "text-slate-400" };
  }
}

function downloadBlob(filename: string, contentType: string, data: string) {
  const blob = new Blob([data], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function SettingsAuthorizationPortal() {
  const supabase = useMemo(() => createClient(), []);
  const [actorEmail, setActorEmail] = useState("");

  const [language, setLanguage] = useState<Language>("both");
  const [activeTab, setActiveTab] = useState<SettingsTab>("system");
  const [routePointTab, setRoutePointTab] = useState<RoutePointTab>("highway");
  const [saved, setSaved] = useState(false);
  const [activeOnly, setActiveOnly] = useState(true);
  const [authView, setAuthView] = useState<AuthView>("ACCOUNTS");
  const [termsBody, setTermsBody] = useState(
    "Terms and Conditions\n\n1. Parcels must comply with platform rules.\n2. Prohibited items are not accepted.\n3. Merchants are responsible for accurate customer details.",
  );

  const t = (en: string, my: string) => bi(language, en, my);

  useEffect(() => {
    let mounted = true;
    async function loadActor() {
      const { data, error } = await supabase.auth.getUser();
      if (!mounted) return;
      if (error) {
        setActorEmail("");
        return;
      }
      setActorEmail(data.user?.email ?? "");
    }
    void loadActor();
    return () => {
      mounted = false;
    };
  }, [supabase]);

  const [systemFields, setSystemFields] = useState<SystemField[]>([
    {
      key: "wayIdTrailingLength",
      labelEn: "Way ID trailing length",
      labelMy: "Way ID နောက်ဆုံးစာလုံးအရှည်",
      value: "6",
      hintEn: "The random number of 6 digits will be added to the end of way ID. The minimum length should be 6 digits. Default is 6.",
      hintMy: "Way ID ၏ နောက်ဆုံးတွင် random 6 လုံး ထည့်သွင်းမည်။ အနည်းဆုံး 6 လုံးရှိရမည်။ Default = 6",
    },
    {
      key: "promotionCodeLength",
      labelEn: "Promotion code length",
      labelMy: "Promotion code အရှည်",
      value: "6",
      hintEn: "The promotion code will be generated with random characters and numbers. The minimum length should be 6. Default is 6.",
      hintMy: "Promotion code ကို random အက္ခရာနှင့် နံပါတ်များဖြင့် ဖန်တီးမည်။ အနည်းဆုံး 6 လုံးရှိရမည်။ Default = 6",
    },
    {
      key: "lastPickupHour",
      labelEn: "Last pickup hour [24h format]",
      labelMy: "နောက်ဆုံး pickup အချိန် [24h format]",
      value: "15",
      hintEn: "When order is received before 15 o'clock, it will be collected on that day, otherwise next day. Please use 24h format.",
      hintMy: "အော်ဒါကို 15 နာရီမတိုင်မီ လက်ခံရရှိပါက ထိုနေ့တွင်ပင် pickup ပြုလုပ်မည်၊ မဟုတ်ပါက နောက်နေ့ pickup ပြုလုပ်မည်။",
    },
    {
      key: "lastDeliveryHour",
      labelEn: "Last deliver hour [24h format]",
      labelMy: "နောက်ဆုံး delivery အချိန် [24h format]",
      value: "12",
      hintEn: "When order is received before 12 o'clock, it will be delivered on that day, otherwise next day. Please use 24h format.",
      hintMy: "12 နာရီမတိုင်မီ အော်ဒါရရှိပါက ထိုနေ့တွင်ပင် delivery ပြုလုပ်မည်၊ မဟုတ်ပါက နောက်နေ့ delivery ပြုလုပ်မည်။",
    },
    {
      key: "returnChargePercentage",
      labelEn: "Return way charges in percentage",
      labelMy: "Return way charges ရာခိုင်နှုန်း",
      value: "0",
      hintEn: "When the way is returned, this percentage of actual delivery charges will be applied to merchant. Default is 100.",
      hintMy: "Way return ဖြစ်ပါက delivery charges အပေါ်မှတ်ချက်ရာခိုင်နှုန်းအား merchant ထံသို့ ကောက်ခံမည်။",
    },
    {
      key: "supportPhone",
      labelEn: "Customer contact phone number",
      labelMy: "Customer ဆက်သွယ်ရန် ဖုန်းနံပါတ်",
      value: "9 400 500 542",
      hintEn: "If there have any problem or inquiry, this number will be shown to merchants and customers.",
      hintMy: "ပြဿနာ သို့မဟုတ် မေးမြန်းမှုရှိပါက merchant နှင့် customer နှစ်ဖက်လုံး မြင်ရမည့် ဖုန်းနံပါတ်ဖြစ်သည်။",
    },
    {
      key: "stationDistance",
      labelEn: "Maximum station distance [meters]",
      labelMy: "Station အကွာအဝေး အများဆုံး [meters]",
      value: "7000",
      hintEn: "When the station distance is within 7000 meters, the system will link each other automatically for transit route. Default is 7000.",
      hintMy: "Station နှစ်ခုအကြား 7000 meters အတွင်းဖြစ်ပါက system မှ transit route အတွက် အလိုအလျောက် ချိတ်ဆက်မည်။",
    },
    {
      key: "sameDayHour",
      labelEn: "Same day plan hour [24h format]",
      labelMy: "Same day plan အချိန် [24h format]",
      value: "12",
      hintEn: "When order is received before 12 o'clock, the order will be delivered on same day. Please use 24h format.",
      hintMy: "12 နာရီမတိုင်မီ အော်ဒါရရှိပါက same day delivery အဖြစ် စီစဉ်မည်။",
    },
  ]);

  const [systemToggles, setSystemToggles] = useState<SystemToggle[]>([
    {
      key: "autoAssignPickupDeliver",
      labelEn: "Automatically assign the deliveryman for pickup and deliver",
      labelMy: "Pickup နှင့် deliver အတွက် deliveryman ကို အလိုအလျောက် assign လုပ်မည်",
      enabled: false,
      hintEn: "When the order is created, the deliveryman will be assigned and scheduled based on rotation plan.",
      hintMy: "အော်ဒါဖန်တီးသည့်အချိန်တွင် rotation plan အလိုက် deliveryman assign လုပ်မည်။",
    },
    {
      key: "autoCreateCustomerAccount",
      labelEn: "Automatically create a customer account",
      labelMy: "Customer account ကို အလိုအလျောက် ဖန်တီးမည်",
      enabled: true,
      hintEn: "When the deliver way is added, the recipient will be created as a user account.",
      hintMy: "Deliver way ထည့်သွင်းသောအခါ recipient ကို user account အဖြစ် ဖန်တီးမည်။",
    },
    {
      key: "saveRecipientAddressBook",
      labelEn: "Automatically add recipient information into the address book list",
      labelMy: "Recipient အချက်အလက်ကို address book ထဲသို့ အလိုအလျောက်ထည့်မည်",
      enabled: true,
      hintEn: "Recipient information will be stored into address book for next time use.",
      hintMy: "နောက်တစ်ကြိမ်အသုံးပြုနိုင်ရန် recipient အချက်အလက်ကို address book ထဲသို့ သိမ်းဆည်းမည်။",
    },
    {
      key: "allowCashAdvance",
      labelEn: "Allow cash advance for all merchants",
      labelMy: "Merchant အားလုံးအတွက် cash advance ခွင့်ပြုမည်",
      enabled: true,
      hintEn: "If enabled, merchants can use cash advance option when creating the order.",
      hintMy: "Enable လုပ်ထားပါက merchant များသည် အော်ဒါဖန်တီးရာတွင် cash advance option သုံးနိုင်မည်။",
    },
    {
      key: "allowMerchantDirectOrder",
      labelEn: "Allow merchant direct order",
      labelMy: "Merchant direct order ခွင့်ပြုမည်",
      enabled: true,
      hintEn: "If enabled, merchants can submit the order themselves.",
      hintMy: "Enable လုပ်ထားပါက merchant များသည် ကိုယ်တိုင် order တင်နိုင်မည်။",
    },
    {
      key: "merchantDirectOrderAutoAssign",
      labelEn: "Allow merchant direct order auto assign",
      labelMy: "Merchant direct order auto assign ခွင့်ပြုမည်",
      enabled: false,
      hintEn: "If merchant submits order for pickup, deliveryman will be auto assigned and scheduled.",
      hintMy: "Merchant က pickup order တင်ပါက deliveryman ကို အလိုအလျောက် assign လုပ်မည်။",
    },
    {
      key: "allowMerchantDirectWayFill",
      labelEn: "Allow merchant direct delivery way fill",
      labelMy: "Merchant direct delivery way fill ခွင့်ပြုမည်",
      enabled: true,
      hintEn: "If enabled, merchants can fill the delivery way information themselves.",
      hintMy: "Enable လုပ်ထားပါက merchant များသည် delivery way အချက်အလက်ကို ကိုယ်တိုင်ဖြည့်နိုင်မည်။",
    },
    {
      key: "merchantDirectWayAutoAssign",
      labelEn: "Allow merchant direct way fill auto assign",
      labelMy: "Merchant direct way fill auto assign ခွင့်ပြုမည်",
      enabled: false,
      hintEn: "When merchant fills the way information, deliveryman will be assigned automatically.",
      hintMy: "Merchant က way information ဖြည့်သည့်အခါ deliveryman ကို အလိုအလျောက် assign လုပ်မည်။",
    },
    {
      key: "remindRefundMoney",
      labelEn: "Remind refund money on next pickup",
      labelMy: "နောက်တစ်ကြိမ် pickup တွင် refund money သတိပေးမည်",
      enabled: true,
      hintEn: "When you create pickup for specific merchant and may need refund, reminder message will be shown.",
      hintMy: "Refund ပေးရန်ရှိနိုင်သော merchant အတွက် pickup ဖန်တီးသည့်အခါ reminder message ပြသမည်။",
    },
  ]);

  const tariffRows = [
    { name: "Yangon to Highway Gate 3000", base: 3000, pickup: "-", updated: "2026-01-08 03:40 pm", plan: "Regular", active: true },
    { name: "Naypyitaw to Yangon", base: 5000, pickup: "-", updated: "2026-01-08 03:02 pm", plan: "Regular", active: true },
    { name: "Yangon to Naypyitaw 5000", base: 5000, pickup: "-", updated: "2026-01-08 02:50 pm", plan: "Regular", active: true },
    { name: "Mandalay to Yangon 5000", base: 5000, pickup: "-", updated: "2026-01-08 11:56 am", plan: "Regular", active: true },
    { name: "Yangon to Mandalay 5000", base: 5000, pickup: "-", updated: "2026-01-08 10:15 am", plan: "Regular", active: true },
    { name: "Yangon to Highway Gate 2000", base: 2000, pickup: "-", updated: "2025-12-23 01:37 pm", plan: "Regular", active: true },
  ];

  const networkRows = [
    { code: "BEX-YGN-HQ", location: "Yangon, Kamayut", entity: "Britium Branch", revenue: "100% (Owned)", status: "active" },
    { code: "3PL-TAUNGGYI-01", location: "Shan State, Taunggyi", entity: "Partner (Royal Express)", revenue: "80% / 20% Split", status: "active" },
  ];

  const highwayGateRows = [
    { name: "Dagon Ayar Highway Terminal", address: "Dagon Ayar Highway Terminal, Yangon-Pathein Street, ရန်ကုန် ADSIT", updated: "2025-12-23" },
    { name: "Bayintnaung Terminal", address: "Bayintnaung Terminal, ဘုရင့်နောင် ADSIT", updated: "2025-12-23" },
    { name: "Bandula (Parami) Terminal", address: "Bandula (Parami) Terminal, Parami Street, ရန်ကုန်မြို့သစ် ADSIT", updated: "2025-12-23" },
    { name: "Aung San Kwin", address: "Aung San Kwin, မင်္ဂလာဒုံ၊ မန္တလေးလမ်း ADSIT", updated: "2025-12-23" },
    { name: "Aung Mingalar Highway Terminal", address: "Aung Mingalar Highway Terminal, မင်္ဂလာဒုံ ADSIT", updated: "2026-01-07" },
  ];

  const postOfficeRows = [
    { name: "Yangon Post Office", address: "Yangon Post Office, ဗိုလ်တထောင်၊ ရန်ကုန်မြို့လယ် ADSIT", updated: "2025-12-23" },
  ];

  const pointsOfInterestRows: Array<{ name: string; address: string; updated: string }> = [];

  const townRows = [
    { town: "မရမ်းကုန်း", state: "ရန်ကုန်တိုင်းဒေသကြီး" },
    { town: "လှိုင်သာယာ", state: "ရန်ကုန်တိုင်းဒေသကြီး" },
    { town: "ဒဂုံမြို့သစ်မြောက်ပိုင်း", state: "ရန်ကုန်တိုင်းဒေသကြီး" },
    { town: "ကမာရွတ်", state: "ရန်ကုန်တိုင်းဒေသကြီး" },
    { town: "မင်္ဂလာဒုံ", state: "ရန်ကုန်တိုင်းဒေသကြီး" },
    { town: "မဟာအောင်မြေ", state: "မန္တလေးတိုင်းဒေသကြီး" },
    { town: "ချမ်းအေးသာစံ", state: "မန္တလေးတိုင်းဒေသကြီး" },
    { town: "Aung San Terminal (Highway)", state: "ရန်ကုန်တိုင်းဒေသကြီး" },
    { town: "လမ်းမတော်", state: "ရန်ကုန်တိုင်းဒေသကြီး" },
    { town: "Post Office", state: "ရန်ကုန်တိုင်းဒေသကြီး" },
  ];

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function updateSystemField(key: string, value: string) {
    setSystemFields((prev) => prev.map((field) => (field.key === key ? { ...field, value } : field)));
  }

  function toggleSystemSwitch(key: string) {
    setSystemToggles((prev) => prev.map((item) => (item.key === key ? { ...item, enabled: !item.enabled } : item)));
  }

  const [store, setStore] = useState(() => loadStore());
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    if (!actorEmail) return;
    setStore((prev) => bootstrapSignedInUser(prev, actorEmail));
  }, [actorEmail]);

  useEffect(() => saveStore(store), [store]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(id);
  }, [toast]);

  const actor = useMemo(() => (actorEmail ? getAccountByEmail(store.accounts, actorEmail) : undefined), [store.accounts, actorEmail]);
  const actorActive = !!actor && actor.status === "ACTIVE";
  const isPriv = roleIsPrivileged(actor?.role);
  const canRead = actorActive && can(store, actor, "USER_READ");
  const canCreate = actorActive && can(store, actor, "USER_CREATE");
  const canApprove = actorActive && can(store, actor, "USER_APPROVE");
  const canReject = actorActive && can(store, actor, "USER_REJECT");
  const canRoleEdit = actorActive && can(store, actor, "USER_ROLE_EDIT");
  const canBlock = actorActive && can(store, actor, "USER_BLOCK");
  const canAuth = actorActive && canRequestAuthorityChange(store, actor);
  const canAudit = actorActive && can(store, actor, "AUDIT_READ");
  const canExport = actorActive && can(store, actor, "CSV_EXPORT");
  const canImport = actorActive && can(store, actor, "CSV_IMPORT");
  const canBulk = actorActive && can(store, actor, "BULK_ACTIONS");

  const [q, setQ] = useState("");
  const [filterStatus, setFilterStatus] = useState<AccountStatus | "ALL">("ALL");
  const [filterRole, setFilterRole] = useState<Role | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const selectedEmails = useMemo(() => Object.keys(selected).filter((k) => selected[k]), [selected]);
  const [modalCreate, setModalCreate] = useState(false);
  const [modalAuthorityEmail, setModalAuthorityEmail] = useState<string | null>(null);
  const [modalProfileEmail, setModalProfileEmail] = useState<string | null>(null);
  const [modalApproveEmail, setModalApproveEmail] = useState<string | null>(null);
  const [modalRejectEmail, setModalRejectEmail] = useState<string | null>(null);
  const [modalImport, setModalImport] = useState(false);
  const [modalBulk, setModalBulk] = useState(false);

  const pendingAuthorityCount = useMemo(
    () => store.authorityRequests.filter((r) => r.status === "PENDING").length,
    [store.authorityRequests],
  );

  function auditPush(action: string, targetEmail?: string, detail?: string) {
    setStore((prev) => pushAudit(prev, { actorEmail: actorEmail || "UNKNOWN", action, targetEmail, detail }));
  }

  const filtered = useMemo(() => {
    const qq = safeLower(q);
    return store.accounts
      .filter((a) => {
        if (filterStatus !== "ALL" && a.status !== filterStatus) return false;
        if (filterRole !== "ALL" && a.role !== filterRole) return false;
        if (!qq) return true;
        return safeLower(a.name).includes(qq) || safeLower(a.email).includes(qq);
      })
      .sort((a, b) => safeLower(a.email).localeCompare(safeLower(b.email)));
  }, [store.accounts, q, filterStatus, filterRole]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = useMemo(() => {
    const p = Math.min(page, totalPages);
    const start = (p - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, totalPages]);

  useEffect(() => setPage(1), [q, filterStatus, filterRole]);

  function upsertAccount(next: Account) {
    setStore((prev) => ({
      ...prev,
      accounts: prev.accounts.map((a) => (safeLower(a.email) === safeLower(next.email) ? next : a)),
    }));
  }

  function addAccount(acc: Account) {
    setStore((prev) => ({ ...prev, accounts: [acc, ...prev.accounts] }));
  }

  function updateAccountProfile(email: string, name: string, employeeId: string, role: Role) {
    if (!actor || !canRoleEdit) {
      setToast({ type: "err", msg: t("Missing permissions to edit roles.", "ရာထူးပြင်ဆင်ခွင့် မရှိပါ။") });
      return;
    }
    const target = getAccountByEmail(store.accounts, email);
    if (!target) return;
    if (!roleIsPrivileged(actor.role) && roleIsPrivileged(target.role)) {
      setToast({ type: "err", msg: t("Cannot modify privileged accounts.", "Privileged account ကို မပြင်နိုင်ပါ။") });
      return;
    }

    const nextAcc: Account = { ...target, name, employeeId, role };
    const nextAccounts = store.accounts.map((a) => (safeLower(a.email) === safeLower(email) ? nextAcc : a));
    if (!ensureAtLeastOneSuperAdminActive(nextAccounts)) {
      setToast({
        type: "err",
        msg: t(
          "Must keep at least one ACTIVE SUPER_ADMIN.",
          "ACTIVE SUPER_ADMIN အနည်းဆုံး တစ်ယောက်ရှိရပါမည်။",
        ),
      });
      return;
    }

    setStore((prev) => ({ ...prev, accounts: nextAccounts }));
    auditPush("PROFILE_UPDATED", email, `Name=${name} Role=${role} ID=${employeeId}`);
    setToast({ type: "ok", msg: t("Profile & role updated.", "ပရိုဖိုင်နှင့် ရာထူး ပြင်ဆင်ပြီးပါပြီ။") });
  }

  function approveAccount(email: string, note?: string, autoGrantDefaults = true) {
    if (!actor || !canApprove) return;
    const target = getAccountByEmail(store.accounts, email);
    if (!target) return;
    if (!roleIsPrivileged(actor.role) && roleIsPrivileged(target.role)) {
      setToast({ type: "err", msg: t("Cannot modify privileged accounts.", "Privileged account ကို မပြင်နိုင်ပါ။") });
      return;
    }

    const nextAcc: Account = {
      ...target,
      status: "ACTIVE",
      approval: {
        requestedAt: target.approval?.requestedAt ?? target.createdAt,
        requestedBy: target.approval?.requestedBy ?? target.createdBy,
        processedAt: nowIso(),
        processedBy: actorEmail,
        decision: "APPROVED",
        note,
      },
    };

    setStore((prev) => {
      let next = {
        ...prev,
        accounts: prev.accounts.map((a) => (safeLower(a.email) === safeLower(email) ? nextAcc : a)),
      };
      next = pushAudit(next, {
        actorEmail,
        action: "REQUEST_APPROVED",
        targetEmail: email,
        detail: note ?? "Approved",
      });
      if (autoGrantDefaults && roleIsPrivileged(actor.role)) {
        const defaults = defaultPortalPermissionsForRole(nextAcc.role);
        for (const perm of defaults) next = grantDirect(next, actorEmail, nextAcc.email, perm);
        next = pushAudit(next, {
          actorEmail,
          action: "ROLE_DEFAULTS_GRANTED",
          targetEmail: nextAcc.email,
          detail: defaults.length ? defaults.join(", ") : "NONE",
        });
      }
      return next;
    });

    setToast({
      type: "ok",
      msg: t("Approved + defaults applied.", "အတည်ပြုပြီး default permissions ပေးပြီးပါပြီ။"),
    });
  }

  function rejectAccount(email: string, note?: string) {
    if (!actor || !canReject) return;
    const target = getAccountByEmail(store.accounts, email);
    if (!target) return;

    const nextAcc: Account = {
      ...target,
      status: "REJECTED",
      approval: {
        requestedAt: target.approval?.requestedAt ?? target.createdAt,
        requestedBy: target.approval?.requestedBy ?? target.createdBy,
        processedAt: nowIso(),
        processedBy: actorEmail,
        decision: "REJECTED",
        note,
      },
    };
    upsertAccount(nextAcc);
    auditPush("REQUEST_REJECTED", email, note ?? "Rejected");
    setToast({ type: "ok", msg: t("Saved.", "သိမ်းပြီးပါပြီ။") });
  }

  function blockToggle(email: string, block: boolean) {
    if (!actor || !canBlock) return;
    const target = getAccountByEmail(store.accounts, email);
    if (!target) return;
    if (!roleIsPrivileged(actor.role) && roleIsPrivileged(target.role)) {
      setToast({ type: "err", msg: t("Cannot modify privileged accounts.", "Privileged account ကို မပြင်နိုင်ပါ။") });
      return;
    }

    const nextAcc: Account = {
      ...target,
      status: block ? "SUSPENDED" : "ACTIVE",
      security: {
        ...(target.security ?? {}),
        blockedAt: block ? nowIso() : undefined,
        blockedBy: block ? actorEmail : undefined,
      },
    };
    upsertAccount(nextAcc);
    auditPush(block ? "ACCOUNT_BLOCKED" : "ACCOUNT_UNBLOCKED", email, `By ${actorEmail}`);
    setToast({ type: "ok", msg: t("Saved.", "သိမ်းပြီးပါပြီ။") });
  }

  function changeRole(email: string, role: Role) {
    if (!actor || !canRoleEdit) return;
    const target = getAccountByEmail(store.accounts, email);
    if (!target) return;
    if (!roleIsPrivileged(actor.role) && roleIsPrivileged(target.role)) {
      setToast({ type: "err", msg: t("Cannot modify privileged accounts.", "Privileged account ကို မပြင်နိုင်ပါ။") });
      return;
    }

    const nextAcc: Account = { ...target, role };
    const nextAccounts = store.accounts.map((a) => (safeLower(a.email) === safeLower(email) ? nextAcc : a));
    if (!ensureAtLeastOneSuperAdminActive(nextAccounts)) {
      setToast({
        type: "err",
        msg: t(
          "Must keep at least one ACTIVE SUPER_ADMIN.",
          "ACTIVE SUPER_ADMIN အနည်းဆုံး တစ်ယောက်ရှိရပါမည်။",
        ),
      });
      return;
    }

    setStore((prev) => ({ ...prev, accounts: nextAccounts }));
    auditPush("ROLE_CHANGED", email, `Role -> ${role}`);
    setToast({ type: "ok", msg: t("Saved.", "သိမ်းပြီးပါပြီ။") });
  }

  function exportAccountsCsv() {
    const header = [
      "name",
      "email",
      "role",
      "status",
      "department",
      "phone",
      "employeeId",
      "createdAt",
      "createdBy",
    ];
    const rows: string[][] = [header];

    for (const a of filtered) {
      rows.push([
        a.name ?? "",
        a.email ?? "",
        a.role ?? "",
        a.status ?? "",
        a.department ?? "",
        a.phone ?? "",
        a.employeeId ?? "",
        a.createdAt ?? "",
        a.createdBy ?? "",
      ]);
    }

    downloadBlob(
      `accounts_${new Date().toISOString().slice(0, 10)}.csv`,
      "text/csv;charset=utf-8",
      csvStringify(rows),
    );
    auditPush("CSV_EXPORT_ACCOUNTS", undefined, `Rows=${filtered.length}`);
  }

  function exportGrantsCsv() {
    const header = ["subjectEmail", "permission", "grantedAt", "grantedBy", "revokedAt", "revokedBy"];
    const rows: string[][] = [header];

    for (const g of store.grants) {
      rows.push([
        g.subjectEmail,
        String(g.permission),
        g.grantedAt,
        g.grantedBy,
        g.revokedAt ?? "",
        g.revokedBy ?? "",
      ]);
    }

    downloadBlob(
      `authorities_${new Date().toISOString().slice(0, 10)}.csv`,
      "text/csv;charset=utf-8",
      csvStringify(rows),
    );
    auditPush("CSV_EXPORT_AUTHORITIES", undefined, `Rows=${store.grants.length}`);
  }

  function selectAllOnPage(checked: boolean) {
    const next = { ...selected };
    for (const a of paged) next[a.email] = checked;
    setSelected(next);
  }

  function clearSelection() {
    setSelected({});
  }

  const CreateModal = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<Role>("STAFF");
    const [department, setDepartment] = useState("");
    const [phone, setPhone] = useState("");
    const [employeeId, setEmployeeId] = useState("");
    const [note, setNote] = useState("");

    function submit() {
      if (!actor || !canCreate) return;
      const em = email.trim();
      if (!name.trim() || !isEmailValid(em)) {
        setToast({ type: "err", msg: t("Please check required fields.", "လိုအပ်သော အချက်အလက်များ စစ်ဆေးပါ။") });
        return;
      }
      if (getAccountByEmail(store.accounts, em)) {
        setToast({ type: "err", msg: t("Email already exists.", "Email ရှိပြီးသားဖြစ်သည်။") });
        return;
      }

      const createdAt = nowIso();
      const acc: Account = {
        id: uuid(),
        name: name.trim(),
        email: em,
        role,
        status: "PENDING",
        department: department.trim() || undefined,
        phone: phone.trim() || undefined,
        employeeId: employeeId.trim() || undefined,
        createdAt,
        createdBy: actorEmail,
        approval: { requestedAt: createdAt, requestedBy: actorEmail, note: note.trim() || undefined },
      };

      addAccount(acc);
      auditPush("REQUEST_CREATED", em, note.trim() || "Created");
      setModalCreate(false);
      setToast({ type: "ok", msg: t("Saved.", "သိမ်းပြီးပါပြီ။") });
    }

    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <div className="font-mono text-[11px] uppercase tracking-widest text-slate-500">
              {t("Full name", "အမည်")}
            </div>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <div className="font-mono text-[11px] uppercase tracking-widest text-slate-500">
              {t("Email", "Email")}
            </div>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1">
            <div className="font-mono text-[11px] uppercase tracking-widest text-slate-500">
              {t("Role", "Role")}
            </div>
            <Select value={role} onChange={(e) => setRole(e.target.value as Role)}>
              {DEFAULT_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
            <div className="mt-1 font-mono text-[10px] text-slate-600">
              Defaults: {defaultPortalPermissionsForRole(role).join(", ") || "NONE"}
            </div>
          </div>
          <div className="space-y-1">
            <div className="font-mono text-[11px] uppercase tracking-widest text-slate-500">
              {t("Department", "ဌာန")}
            </div>
            <Input value={department} onChange={(e) => setDepartment(e.target.value)} />
          </div>
          <div className="space-y-1">
            <div className="font-mono text-[11px] uppercase tracking-widest text-slate-500">
              {t("Phone", "ဖုန်း")}
            </div>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-1">
            <div className="font-mono text-[11px] uppercase tracking-widest text-slate-500">
              {t("Employee ID", "ဝန်ထမ်း ID")}
            </div>
            <Input value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} />
          </div>
        </div>

        <div className="space-y-1">
          <div className="font-mono text-[11px] uppercase tracking-widest text-slate-500">
            {t("Reason / Note", "အကြောင်းရင်း / မှတ်ချက်")}
          </div>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        <Divider />

        <div className="flex justify-end gap-3">
          <Button variant="ghost" className="text-slate-400 hover:text-white" onClick={() => setModalCreate(false)}>
            {t("Cancel", "မလုပ်တော့")}
          </Button>
          <Button
            className="h-11 rounded-xl bg-sky-600 px-6 font-black uppercase text-white hover:bg-sky-500"
            onClick={submit}
          >
            {t("Save", "သိမ်းမည်")}
          </Button>
        </div>
      </div>
    );
  };

  const AuthorityModal = ({ email }: { email: string }) => {
    const subject = getAccountByEmail(store.accounts, email);
    const [note, setNote] = useState("");
    const [editName, setEditName] = useState(subject?.name || "");
    const [editEmployeeId, setEditEmployeeId] = useState(subject?.employeeId || "");
    const [editRole, setEditRole] = useState<Role>(subject?.role || "STAFF");
    if (!subject) return null;

    const subjectPerms = roleIsPrivileged(subject.role)
      ? new Set(PERMISSIONS.map((p) => p.code))
      : new Set(activeGrantsFor(store.grants, subject.email).map((g) => g.permission));
    const direct = canApplyAuthorityDirect(store, actor);

    return (
      <div className="space-y-5 pb-8">
        <div className="space-y-5 rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between">
            <div className="text-sm font-black uppercase tracking-widest text-emerald-400">
              {t("Step 1: User Profile & Role", "၁။ အသုံးပြုသူ ပရိုဖိုင်နှင့် ရာထူး")}
            </div>
            <div className="rounded-lg bg-black/40 px-3 py-1 font-mono text-[11px] text-slate-500">
              {subject.email}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <div className="font-mono text-[11px] uppercase tracking-widest text-slate-500">
                {t("Full Name", "အမည်")}
              </div>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <div className="font-mono text-[11px] uppercase tracking-widest text-slate-500">
                {t("User ID", "အသုံးပြုသူ ID")}
              </div>
              <Input value={editEmployeeId} onChange={(e) => setEditEmployeeId(e.target.value)} />
            </div>
            <div className="space-y-1">
              <div className="font-mono text-[11px] uppercase tracking-widest text-slate-500">
                {t("Role", "ရာထူး")}
              </div>
              <Select value={editRole} onChange={(e) => setEditRole(e.target.value as Role)} disabled={!canRoleEdit}>
                {DEFAULT_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              className="h-10 rounded-xl bg-emerald-600 px-5 text-xs font-bold text-white shadow-lg shadow-emerald-900/20 hover:bg-emerald-500"
              onClick={() => updateAccountProfile(email, editName, editEmployeeId, editRole)}
            >
              <RefreshCw size={14} className="mr-2 inline" />
              {t("Update Profile Info", "ပရိုဖိုင် အချက်အလက် ပြင်ဆင်မည်")}
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="mb-3 text-sm font-black uppercase tracking-widest text-sky-400">
            {t("Step 2: Granular Authorities", "၂။ အသေးစိတ် ခွင့်ပြုချက်များ")}
          </div>

          <div className="mb-6 inline-block rounded-xl border border-sky-500/10 bg-sky-900/10 p-3 text-xs text-slate-400">
            {direct
              ? t(
                  "Direct apply enabled (Super Admin). Checkboxes save instantly.",
                  "Direct apply ပြုလုပ်နိုင်သည် (Super Admin). ပြောင်းလဲမှုများ ချက်ချင်းသက်ရောက်မည်။",
                )
              : t(
                  "Changes create requests (requires Super Admin approval).",
                  "ပြောင်းလဲမှုများသည် Request ဖြစ်ပြီး Super Admin အတည်ပြုရန်လိုသည်။",
                )}
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {PERMISSIONS.map((p) => {
              const enabled = subjectPerms.has(p.code);
              const disabled =
                !actor ||
                !canAuth ||
                (roleIsPrivileged(subject.role) && !roleIsPrivileged(actor.role));

              return (
                <div
                  key={String(p.code)}
                  className={`rounded-xl border p-4 transition-colors ${
                    enabled ? "border-sky-500/30 bg-sky-500/10" : "border-white/5 bg-black/20"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold leading-tight text-white">
                        {language === "my" ? p.mm : p.en}
                      </div>
                      <div className="mt-1.5 font-mono text-[9px] uppercase tracking-widest text-slate-500">
                        {String(p.code)}
                      </div>
                    </div>
                    <label className="cursor-pointer rounded-lg bg-black/40 px-2 py-1.5 text-xs font-bold text-slate-300 transition hover:bg-black/60">
                      <input
                        type="checkbox"
                        checked={enabled}
                        disabled={disabled}
                        onChange={(e) => {
                          if (!actor) return;
                          const want = e.target.checked;
                          const type = want ? "GRANT" : "REVOKE";
                          setStore((prev) => {
                            if (direct) {
                              return want
                                ? grantDirect(prev, actorEmail, subject.email, p.code)
                                : revokeDirect(prev, actorEmail, subject.email, p.code);
                            }
                            return requestAuthorityChange(
                              prev,
                              actorEmail,
                              subject.email,
                              type,
                              p.code,
                              note.trim() || undefined,
                            );
                          });
                          setToast({
                            type: direct ? "ok" : "warn",
                            msg: direct
                              ? t("Applied.", "ပြောင်းလဲပြီးပါပြီ။")
                              : t(
                                  "Request submitted for approval.",
                                  "Request တင်ပြီးပါပြီ (အတည်ပြုရန်လိုသည်)။",
                                ),
                          });
                        }}
                        className="mr-2 h-4 w-4 accent-sky-500"
                      />
                      {enabled ? "ON" : "OFF"}
                    </label>
                  </div>
                </div>
              );
            })}
          </div>

          {!direct ? (
            <div className="mt-8 space-y-2 border-t border-white/10 pt-6">
              <div className="font-mono text-[11px] uppercase tracking-widest text-slate-500">
                {t("Request note", "Request မှတ်ချက်")}
              </div>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t("Optional note for Super Admin...", "Super Admin အတွက် မှတ်ချက်...")}
              />
            </div>
          ) : null}
        </div>

        <div className="flex justify-end pt-2">
          <Button
            variant="ghost"
            className="px-6 text-slate-400 hover:bg-white/10 hover:text-white"
            onClick={() => setModalAuthorityEmail(null)}
          >
            {t("Close Window", "ပိတ်မည်")}
          </Button>
        </div>
      </div>
    );
  };

  const ApproveRejectModal = ({ email, mode }: { email: string; mode: "approve" | "reject" }) => {
    const target = getAccountByEmail(store.accounts, email);
    const [note, setNote] = useState("");
    const [autoDefaults, setAutoDefaults] = useState(true);
    if (!target) return null;

    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-black uppercase italic text-white">{target.name}</div>
              <div className="text-sm text-slate-500">{target.email}</div>
            </div>
            <Pill className={roleBadgeClass(target.role)}>{target.role}</Pill>
          </div>

          {mode === "approve" ? (
            <>
              <div className="mt-3 text-xs text-slate-500">
                {t("Role defaults:", "Role defaults:")}{" "}
                <span className="font-mono text-slate-300">
                  {defaultPortalPermissionsForRole(target.role).join(", ") || "NONE"}
                </span>
              </div>
              <label className="mt-3 flex items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={autoDefaults}
                  onChange={(e) => setAutoDefaults(e.target.checked)}
                  className="h-4 w-4 accent-emerald-500"
                />
                {t(
                  "Auto-grant role default portal access",
                  "Role default portal access ကို အလိုအလျောက်ပေးမည်",
                )}
              </label>
            </>
          ) : null}
        </div>

        <div className="space-y-1">
          <div className="font-mono text-[11px] uppercase tracking-widest text-slate-500">
            {t("Reason / Note", "အကြောင်းရင်း / မှတ်ချက်")}
          </div>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="ghost"
            className="text-slate-400 hover:text-white"
            onClick={() => (mode === "approve" ? setModalApproveEmail(null) : setModalRejectEmail(null))}
          >
            {t("Cancel", "မလုပ်တော့")}
          </Button>
          <Button
            className={`${
              mode === "approve" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-rose-600 hover:bg-rose-500"
            } h-11 rounded-xl px-6 font-black uppercase text-white`}
            onClick={() => {
              if (mode === "approve") approveAccount(email, note.trim() || undefined, autoDefaults);
              else rejectAccount(email, note.trim() || undefined);
              setModalApproveEmail(null);
              setModalRejectEmail(null);
            }}
          >
            {mode === "approve" ? t("Approve", "အတည်ပြု") : t("Reject", "ငြင်းပယ်")}
          </Button>
        </div>
      </div>
    );
  };

  function RequestRow(props: {
    r: AuthorityRequest;
    canProcess: boolean;
    onApprove: (id: string, note?: string) => void;
    onReject: (id: string, note?: string) => void;
  }) {
    const [note, setNote] = useState("");
    const pending = props.r.status === "PENDING";

    return (
      <tr className="transition-all hover:bg-white/5">
        <td className="p-5">
          <Pill className={props.r.type === "GRANT" ? "bg-emerald-500/10 text-emerald-300" : "bg-rose-500/10 text-rose-300"}>
            {props.r.type}
          </Pill>
        </td>
        <td className="p-5">
          <div className="font-bold text-white">{props.r.subjectEmail}</div>
          <div className="font-mono text-[10px] text-slate-600">{props.r.requestedBy}</div>
        </td>
        <td className="p-5">
          <div className="font-mono text-xs text-slate-200">{String(props.r.permission)}</div>
          {props.r.requestNote ? <div className="mt-1 text-[10px] text-slate-600">{props.r.requestNote}</div> : null}
        </td>
        <td className="p-5">
          <Pill
            className={
              props.r.status === "PENDING"
                ? "bg-amber-500/10 text-amber-300"
                : props.r.status === "APPROVED"
                  ? "bg-emerald-500/10 text-emerald-300"
                  : "bg-rose-500/10 text-rose-300"
            }
          >
            {props.r.status}
          </Pill>
          <div className="mt-1 font-mono text-[10px] text-slate-600">
            {new Date(props.r.requestedAt).toLocaleString()}
          </div>
        </td>
        <td className="p-5 text-right">
          {props.canProcess && pending ? (
            <div className="flex items-center justify-end gap-2">
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="note"
                className="h-10 w-40 rounded-xl border border-white/10 bg-[#0B101B] px-3 text-xs text-slate-200"
              />
              <Button
                className="h-10 rounded-xl bg-emerald-600 px-4 font-black uppercase text-white hover:bg-emerald-500"
                onClick={() => props.onApprove(props.r.id, note.trim() || undefined)}
              >
                Approve
              </Button>
              <Button
                className="h-10 rounded-xl bg-rose-600 px-4 font-black uppercase text-white hover:bg-rose-500"
                onClick={() => props.onReject(props.r.id, note.trim() || undefined)}
              >
                Reject
              </Button>
            </div>
          ) : (
            <div className="text-xs text-slate-600">{props.r.processedBy ? `by ${props.r.processedBy}` : "—"}</div>
          )}
        </td>
      </tr>
    );
  }

  const RequestsPanel = () => {
    const [rq, setRq] = useState("");
    const [status, setStatus] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("PENDING");

    const rows = useMemo(() => {
      const qq = safeLower(rq);
      return store.authorityRequests
        .filter((r) => (status === "ALL" ? true : r.status === status))
        .filter((r) => {
          if (!qq) return true;
          const s = `${r.subjectEmail} ${r.permission} ${r.type} ${r.requestedBy}`.toLowerCase();
          return s.includes(qq);
        })
        .slice(0, 200);
    }, [store.authorityRequests, rq, status]);

    const canProcess = actorActive && roleIsPrivileged(actor?.role);

    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex h-11 w-full items-center gap-2 rounded-xl border border-white/10 bg-[#0B101B] px-3 md:w-[520px]">
            <Search className="h-4 w-4 text-slate-500" />
            <input
              value={rq}
              onChange={(e) => setRq(e.target.value)}
              placeholder={t("Search requests...", "Request များရှာရန်...")}
              className="w-full bg-transparent text-sm text-slate-200 outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Select value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-44">
              <option value="PENDING">PENDING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
              <option value="ALL">ALL</option>
            </Select>
          </div>
        </div>

        <Card className="overflow-hidden rounded-[2rem] border-none bg-[#05080F] ring-1 ring-white/5">
          <table className="w-full text-left">
            <thead className="bg-white/5 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
              <tr>
                <th className="p-5">TYPE</th>
                <th className="p-5">SUBJECT</th>
                <th className="p-5">PERMISSION</th>
                <th className="p-5">STATUS</th>
                <th className="p-5 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((r) => (
                <RequestRow
                  key={r.id}
                  r={r}
                  canProcess={canProcess}
                  onApprove={(id, note) => {
                    setStore((prev) => approveAuthorityRequest(prev, actorEmail, id, note));
                    setToast({ type: "ok", msg: t("Approved.", "အတည်ပြုပြီးပါပြီ။") });
                  }}
                  onReject={(id, note) => {
                    setStore((prev) => rejectAuthorityRequest(prev, actorEmail, id, note));
                    setToast({ type: "ok", msg: t("Rejected.", "ငြင်းပယ်ပြီးပါပြီ။") });
                  }}
                />
              ))}
            </tbody>
          </table>
          {!rows.length ? <div className="p-10 text-center text-slate-600">{t("No requests.", "Request မရှိပါ။")}</div> : null}
        </Card>

        {!canProcess ? (
          <div className="text-xs text-slate-600">
            {t(
              "Only Super Admin can approve/reject authority requests.",
              "Super Admin သာ Request များကို အတည်ပြု/ငြင်းပယ်နိုင်သည်။",
            )}
          </div>
        ) : null}
      </div>
    );
  };

  const AuditPanel = () => {
    const events = store.audit.slice(0, 200);
    return (
      <div className="space-y-3">
        <div className="text-sm text-slate-500">{t("Showing latest 200 events.", "နောက်ဆုံး 200 events ကိုပြပါမည်။")}</div>
        <div className="space-y-2">
          {events.map((e) => (
            <div key={e.id} className="rounded-2xl border border-white/10 bg-[#05080F] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="font-bold text-white">{e.action}</div>
                <div className="font-mono text-[10px] text-slate-600">{new Date(e.at).toLocaleString()}</div>
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Actor: <span className="text-slate-300">{e.actorEmail}</span>
                {e.targetEmail ? (
                  <>
                    {" "}• Target: <span className="text-slate-300">{e.targetEmail}</span>
                  </>
                ) : null}
              </div>
              {e.detail ? <div className="mt-1 text-xs text-slate-600">{e.detail}</div> : null}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const ProfileModal = ({ email }: { email: string }) => {
    const target = getAccountByEmail(store.accounts, email);
    if (!target) return null;
    const grants = activeGrantsFor(store.grants, target.email);

    return (
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-black uppercase italic text-white">{target.name}</div>
            <div className="text-sm text-slate-500">{target.email}</div>
          </div>
          <div className="flex items-center gap-2">
            <Pill className={roleBadgeClass(target.role)}>{target.role}</Pill>
            <Pill className="bg-white/5 text-slate-300">{target.department ?? "-"}</Pill>
          </div>
        </div>

        <Divider />

        <div className="space-y-2">
          <div className="font-mono text-[11px] uppercase tracking-widest text-slate-500">Authorities</div>
          <div className="flex flex-wrap gap-2">
            {roleIsPrivileged(target.role) ? (
              <Pill className="bg-sky-500/10 text-sky-400">ALL_PERMISSIONS</Pill>
            ) : grants.length ? (
              grants.map((g) => (
                <Pill key={g.id} className="bg-white/5 text-slate-200">
                  {String(g.permission)}
                </Pill>
              ))
            ) : (
              <div className="text-sm text-slate-600">No delegated permissions.</div>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="ghost" className="text-slate-400 hover:text-white" onClick={() => setModalProfileEmail(null)}>
            {t("Close", "ပိတ်")}
          </Button>
        </div>
      </div>
    );
  };

  const ImportModal = () => {
    const [fileName, setFileName] = useState("");
    const [preview, setPreview] = useState<{
      ok: number;
      skipped: number;
      errors: string[];
      rows: Account[];
    } | null>(null);

    async function onPick(file: File | null) {
      if (!file) return;
      setFileName(file.name);
      const text = await file.text();
      const parsed = csvParse(text);
      const header = parsed[0]?.map((h) => safeLower(h));
      if (!header || header.length < 2) {
        setPreview({ ok: 0, skipped: 0, errors: ["Invalid CSV header."], rows: [] });
        return;
      }

      const idx = (key: string) => header.indexOf(safeLower(key));
      const iName = idx("name");
      const iEmail = idx("email");
      const iRole = idx("role");
      const iDept = idx("department");
      const iPhone = idx("phone");
      const iEmp = idx("employeeId");

      const errors: string[] = [];
      const rows: Account[] = [];
      let skipped = 0;

      for (let r = 1; r < parsed.length; r++) {
        const row = parsed[r];
        const name = (row[iName] ?? "").trim();
        const email = (row[iEmail] ?? "").trim();
        const role = ((row[iRole] ?? "STAFF").trim() as Role) || "STAFF";
        const department = (row[iDept] ?? "").trim();
        const phone = (row[iPhone] ?? "").trim();
        const employeeId = (row[iEmp] ?? "").trim();

        if (!name || !isEmailValid(email)) {
          errors.push(`Row ${r + 1}: invalid name/email`);
          continue;
        }
        if (getAccountByEmail(store.accounts, email)) {
          skipped++;
          continue;
        }

        const createdAt = nowIso();
        rows.push({
          id: uuid(),
          name,
          email,
          role: DEFAULT_ROLES.includes(role) ? role : "STAFF",
          status: "PENDING",
          department: department || undefined,
          phone: phone || undefined,
          employeeId: employeeId || undefined,
          createdAt,
          createdBy: actorEmail || "UNKNOWN",
          approval: { requestedAt: createdAt, requestedBy: actorEmail || "UNKNOWN" },
        });
      }

      setPreview({ ok: rows.length, skipped, errors, rows });
    }

    function doImport() {
      if (!actor || !canImport || !preview) return;
      setStore((prev) => ({ ...prev, accounts: [...preview.rows, ...prev.accounts] }));
      auditPush(
        "CSV_IMPORT_ACCOUNTS",
        undefined,
        `Imported=${preview.ok} Skipped=${preview.skipped} Errors=${preview.errors.length}`,
      );
      setToast({ type: "ok", msg: t("Import completed.", "သွင်းပြီးပါပြီ။") });
      setModalImport(false);
    }

    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-slate-500">
            {t("CSV columns:", "CSV ကော်လံများ:")} name,email,role,department,phone,employeeId
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2">
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => onPick(e.target.files?.[0] ?? null)}
            />
            <Button className="h-10 rounded-xl bg-sky-600 px-4 font-black uppercase text-white hover:bg-sky-500">
              <Upload className="mr-2 h-4 w-4" />
              {fileName ? fileName : t("Pick CSV", "CSV ရွေး")}
            </Button>
          </label>
        </div>

        {preview ? (
          <div className="space-y-2 rounded-2xl border border-white/10 bg-[#0B101B] p-4">
            <div className="text-sm text-slate-300">
              OK: <span className="font-bold text-emerald-300">{preview.ok}</span> • Skipped:{" "}
              <span className="font-bold text-amber-300">{preview.skipped}</span> • Errors:{" "}
              <span className="font-bold text-rose-300">{preview.errors.length}</span>
            </div>
            {preview.errors.length ? (
              <div className="space-y-1 font-mono text-xs text-rose-300">
                {preview.errors.slice(0, 6).map((e) => (
                  <div key={e}>{e}</div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="flex justify-end gap-3">
          <Button variant="ghost" className="text-slate-400 hover:text-white" onClick={() => setModalImport(false)}>
            {t("Cancel", "မလုပ်တော့")}
          </Button>
          <Button
            className="h-11 rounded-xl bg-emerald-600 px-6 font-black uppercase text-white hover:bg-emerald-500 disabled:opacity-40"
            disabled={!preview?.ok}
            onClick={doImport}
          >
            {t("Confirm", "အတည်ပြု")}
          </Button>
        </div>
      </div>
    );
  };

  const BulkModal = () => {
    const [action, setAction] = useState<"APPROVE" | "REJECT" | "BLOCK" | "UNBLOCK" | "SET_ROLE">("APPROVE");
    const [note, setNote] = useState("");
    const [role, setRole] = useState<Role>("STAFF");

    function apply() {
      if (!actor || !canBulk || !selectedEmails.length) return;
      for (const email of selectedEmails) {
        if (action === "APPROVE") approveAccount(email, note.trim() || undefined, true);
        if (action === "REJECT") rejectAccount(email, note.trim() || undefined);
        if (action === "BLOCK") blockToggle(email, true);
        if (action === "UNBLOCK") blockToggle(email, false);
        if (action === "SET_ROLE") changeRole(email, role);
      }
      auditPush("BULK_APPLIED", undefined, `Action=${action} Count=${selectedEmails.length}`);
      clearSelection();
      setModalBulk(false);
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-slate-300">
            {t("Selected", "ရွေးထား")}: <span className="font-black text-white">{selectedEmails.length}</span>
          </div>
          <Button variant="ghost" className="text-slate-400 hover:text-white" onClick={clearSelection}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Clear
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <div className="font-mono text-[11px] uppercase tracking-widest text-slate-500">
              {t("Action", "လုပ်ဆောင်ချက်")}
            </div>
            <Select value={action} onChange={(e) => setAction(e.target.value as any)}>
              <option value="APPROVE">{t("Approve", "အတည်ပြု")}</option>
              <option value="REJECT">{t("Reject", "ငြင်းပယ်")}</option>
              <option value="BLOCK">{t("Block", "ပိတ်")}</option>
              <option value="UNBLOCK">{t("Unblock", "ဖွင့်")}</option>
              <option value="SET_ROLE">{t("Set role", "Role သတ်မှတ်")}</option>
            </Select>
          </div>
          {action === "SET_ROLE" ? (
            <div className="space-y-1">
              <div className="font-mono text-[11px] uppercase tracking-widest text-slate-500">
                {t("Role", "Role")}
              </div>
              <Select value={role} onChange={(e) => setRole(e.target.value as Role)}>
                {DEFAULT_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            </div>
          ) : (
            <div />
          )}
        </div>

        <div className="space-y-1">
          <div className="font-mono text-[11px] uppercase tracking-widest text-slate-500">
            {t("Note (optional)", "မှတ်ချက် (optional)")}
          </div>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="ghost" className="text-slate-400 hover:text-white" onClick={() => setModalBulk(false)}>
            {t("Cancel", "မလုပ်တော့")}
          </Button>
          <Button
            className="h-11 rounded-xl bg-sky-600 px-6 font-black uppercase text-white hover:bg-sky-500 disabled:opacity-40"
            disabled={!selectedEmails.length}
            onClick={apply}
          >
            {t("Apply", "လုပ်ဆောင်")}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f7f9fc] p-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-[#0d2c54]">
            {t(
              "System Settings & Authorization",
              "စနစ်ဆိုင်ရာသတ်မှတ်ချက်များနှင့် ခွင့်ပြုချက်စီမံခန့်ခွဲမှု",
            )}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {t(
              "Master configuration for operations, pricing, routing, geography, content rules, and user authorization workflows.",
              "လုပ်ငန်းလည်ပတ်မှု၊ ဈေးနှုန်း၊ route point၊ မြေပြင်ဒေတာ၊ စည်းမျဉ်းစာသားများနှင့် user authorization workflow များကို တစ်နေရာတည်းတွင် စီမံနိုင်သော master configuration စာမျက်နှာ။",
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <LanguageToggle value={language} onChange={setLanguage} />
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#ffd700] px-6 py-3 font-black uppercase tracking-widest text-[#0d2c54] shadow-lg transition-transform hover:scale-[1.02]"
          >
            {saved ? <CheckCircle2 size={18} /> : <Save size={18} />}
            {saved
              ? t("Configuration Saved", "သတ်မှတ်ချက်များ သိမ်းပြီးပါပြီ")
              : t("Commit Changes", "ပြောင်းလဲမှုများ သိမ်းမည်")}
          </button>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          onClick={() => setActiveTab("system")}
          className={`inline-flex items-center gap-2 rounded-2xl px-5 py-4 text-xs font-black uppercase tracking-widest transition-colors ${
            activeTab === "system"
              ? "bg-[#0d2c54] text-white"
              : "border bg-white text-slate-500 hover:bg-slate-50"
          }`}
        >
          <Settings size={16} />
          {t("System Settings", "စနစ်သတ်မှတ်ချက်များ")}
        </button>
        <button
          onClick={() => setActiveTab("routePoints")}
          className={`inline-flex items-center gap-2 rounded-2xl px-5 py-4 text-xs font-black uppercase tracking-widest transition-colors ${
            activeTab === "routePoints"
              ? "bg-[#0d2c54] text-white"
              : "border bg-white text-slate-500 hover:bg-slate-50"
          }`}
        >
          <MapPin size={16} />
          {t("Route Points", "လမ်းကြောင်းမှတ်တိုင်များ")}
        </button>
        <button
          onClick={() => setActiveTab("towns")}
          className={`inline-flex items-center gap-2 rounded-2xl px-5 py-4 text-xs font-black uppercase tracking-widest transition-colors ${
            activeTab === "towns"
              ? "bg-[#0d2c54] text-white"
              : "border bg-white text-slate-500 hover:bg-slate-50"
          }`}
        >
          <Map size={16} />
          {t("Town List", "မြို့နယ်စာရင်း")}
        </button>
        <button
          onClick={() => setActiveTab("terms")}
          className={`inline-flex items-center gap-2 rounded-2xl px-5 py-4 text-xs font-black uppercase tracking-widest transition-colors ${
            activeTab === "terms"
              ? "bg-[#0d2c54] text-white"
              : "border bg-white text-slate-500 hover:bg-slate-50"
          }`}
        >
          <Save size={16} />
          {t("Terms & Conditions", "စည်းကမ်းနှင့် သတ်မှတ်ချက်များ")}
        </button>
        <button
          onClick={() => setActiveTab("tariff")}
          className={`inline-flex items-center gap-2 rounded-2xl px-5 py-4 text-xs font-black uppercase tracking-widest transition-colors ${
            activeTab === "tariff"
              ? "bg-[#0d2c54] text-white"
              : "border bg-white text-slate-500 hover:bg-slate-50"
          }`}
        >
          <Calculator size={16} />
          {t("Tariff Matrix", "ဈေးနှုန်းသတ်မှတ်ချက်")}
        </button>
        <button
          onClick={() => setActiveTab("network")}
          className={`inline-flex items-center gap-2 rounded-2xl px-5 py-4 text-xs font-black uppercase tracking-widest transition-colors ${
            activeTab === "network"
              ? "bg-[#0d2c54] text-white"
              : "border bg-white text-slate-500 hover:bg-slate-50"
          }`}
        >
          <Network size={16} />
          {t("Network Expansion", "ကွန်ရက်တိုးချဲ့မှု")}
        </button>
        <button
          onClick={() => setActiveTab("geo")}
          className={`inline-flex items-center gap-2 rounded-2xl px-5 py-4 text-xs font-black uppercase tracking-widest transition-colors ${
            activeTab === "geo"
              ? "bg-[#0d2c54] text-white"
              : "border bg-white text-slate-500 hover:bg-slate-50"
          }`}
        >
          <Map size={16} />
          {t("Geography Master", "မြေပြင်ဒေတာစနစ်")}
        </button>
        <button
          onClick={() => setActiveTab("auth")}
          className={`inline-flex items-center gap-2 rounded-2xl px-5 py-4 text-xs font-black uppercase tracking-widest transition-colors ${
            activeTab === "auth"
              ? "bg-[#0d2c54] text-white"
              : "border bg-white text-slate-500 hover:bg-slate-50"
          }`}
        >
          <ShieldCheck size={16} />
          {t("User Authorization", "အသုံးပြုသူ ခွင့်ပြုချက်")}
        </button>
      </div>

      {activeTab === "system" ? (
        <div className="mt-8">
          <Panel
            title={t("Settings", "Settings")}
            subtitle={t(
              "These settings are effected your system operation. Please reset to default value if you think of abnormal conditions.",
              "ဤ settings များသည် system operation အပေါ် သက်ရောက်မှုရှိသည်။ မမှန်ကန်သောအခြေအနေများ ဖြစ်နေသည်ဟု ထင်ပါက default တန်ဖိုးသို့ ပြန်ထားပါ။",
            )}
          >
            <div className="space-y-4">
              {systemFields.map((field) => (
                <div key={field.key} className="space-y-1">
                  <label className="text-[11px] font-black text-slate-500">
                    {bi(language, field.labelEn, field.labelMy)} *
                  </label>
                  <input
                    value={field.value}
                    onChange={(e) => updateSystemField(field.key, e.target.value)}
                    className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none"
                  />
                  <p className="text-[11px] text-slate-400">{bi(language, field.hintEn, field.hintMy)}</p>
                </div>
              ))}

              <div className="space-y-4 pt-3">
                {systemToggles.map((item) => (
                  <div key={item.key} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => toggleSystemSwitch(item.key)}
                        className={`mt-1 inline-flex h-6 w-11 items-center rounded-full transition ${
                          item.enabled ? "bg-[#0d2c54]" : "bg-slate-300"
                        }`}
                      >
                        <span
                          className={`h-5 w-5 rounded-full bg-white shadow transition ${
                            item.enabled ? "translate-x-5" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                      <div>
                        <div className="text-sm font-semibold text-[#0d2c54]">
                          {bi(language, item.labelEn, item.labelMy)}
                        </div>
                        <p className="mt-1 text-[11px] text-slate-400">
                          {bi(language, item.hintEn, item.hintMy)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        </div>
      ) : null}

      {activeTab === "routePoints" ? (
        <div className="mt-8">
          <Panel
            title={t("Places & Route Points", "နေရာများနှင့် လမ်းကြောင်းမှတ်တိုင်များ")}
            subtitle={t(
              "Maintain highway gates, post offices, and points of interest used by operations.",
              "လုပ်ငန်းလည်ပတ်မှုတွင် အသုံးပြုသော highway gates, post offices နှင့် points of interest များကို စီမံနိုင်သည်။",
            )}
          >
            <div className="mb-4 flex flex-wrap gap-4 border-b border-slate-200 pb-3 text-sm font-semibold text-slate-500">
              <button className={`${routePointTab === "highway" ? "text-[#0d2c54] border-b-2 border-[#0d2c54]" : ""} pb-2`} onClick={() => setRoutePointTab("highway")}>
                {t("Highway gates", "Highway gates")}
              </button>
              <button className={`${routePointTab === "postOffice" ? "text-[#0d2c54] border-b-2 border-[#0d2c54]" : ""} pb-2`} onClick={() => setRoutePointTab("postOffice")}>
                {t("Post Office", "Post Office")}
              </button>
              <button className={`${routePointTab === "poi" ? "text-[#0d2c54] border-b-2 border-[#0d2c54]" : ""} pb-2`} onClick={() => setRoutePointTab("poi")}>
                {t("Points of interest", "Points of interest")}
              </button>
            </div>

            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <button className="rounded-xl bg-[#0d2c54] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white w-fit">
                <PlusCircle size={14} className="mr-2 inline" /> {t("Add New", "အသစ်ထည့်မည်")}
              </button>
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none" placeholder={t("Search", "ရှာရန်")} />
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-black">{t("Name", "အမည်")}</th>
                    <th className="px-4 py-3 font-black">{t("Address", "လိပ်စာ")}</th>
                    <th className="px-4 py-3 font-black">{t("Updated on", "ပြင်ဆင်သည့်နေ့")}</th>
                    <th className="px-4 py-3 font-black">{t("Edit", "ပြင်ရန်")}</th>
                    <th className="px-4 py-3 font-black">{t("Delete", "ဖျက်ရန်")}</th>
                  </tr>
                </thead>
                <tbody>
                  {(routePointTab === "highway"
                    ? highwayGateRows
                    : routePointTab === "postOffice"
                      ? postOfficeRows
                      : pointsOfInterestRows
                  ).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                        {t("No records found.", "ဒေတာမရှိပါ။")}
                      </td>
                    </tr>
                  ) : (
                    (routePointTab === "highway"
                      ? highwayGateRows
                      : routePointTab === "postOffice"
                        ? postOfficeRows
                        : pointsOfInterestRows
                    ).map((row) => (
                      <tr key={row.name} className="border-t border-slate-100">
                        <td className="px-4 py-3 font-semibold text-[#0d2c54]">{row.name}</td>
                        <td className="px-4 py-3">{row.address}</td>
                        <td className="px-4 py-3">{row.updated}</td>
                        <td className="px-4 py-3">✎</td>
                        <td className="px-4 py-3">🗑</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      ) : null}

      {activeTab === "towns" ? (
        <div className="mt-8">
          <Panel
            title={t("Town List", "Town List")}
            subtitle={t("Manage operational towns and states.", "လုပ်ငန်းလည်ပတ်ရာတွင် အသုံးပြုမည့် မြို့နယ်များနှင့် တိုင်း/ပြည်နယ်များကို စီမံနိုင်သည်။")}
          >
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <button className="rounded-xl bg-[#0d2c54] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white w-fit">
                <PlusCircle size={14} className="mr-2 inline" /> {t("Add New", "အသစ်ထည့်မည်")}
              </button>
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none" placeholder={t("Search", "ရှာရန်")} />
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-black">{t("Town", "မြို့နယ်")}</th>
                    <th className="px-4 py-3 font-black">{t("State", "တိုင်း/ပြည်နယ်")}</th>
                    <th className="px-4 py-3 font-black">{t("Edit", "ပြင်ရန်")}</th>
                  </tr>
                </thead>
                <tbody>
                  {townRows.map((row) => (
                    <tr key={`${row.town}-${row.state}`} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-semibold text-[#0d2c54]">{row.town}</td>
                      <td className="px-4 py-3">{row.state}</td>
                      <td className="px-4 py-3">✎</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      ) : null}

      {activeTab === "terms" ? (
        <div className="mt-8">
          <Panel
            title={t("T & C", "စည်းကမ်းချက်များ")}
            subtitle={t("Edit the Terms and Conditions.", "Terms and Conditions ကို ပြင်ဆင်နိုင်သည်။")}
          >
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                <span className="rounded bg-white px-2 py-1">B</span>
                <span className="rounded bg-white px-2 py-1">I</span>
                <span className="rounded bg-white px-2 py-1">U</span>
                <span className="rounded bg-white px-2 py-1">•</span>
                <span className="rounded bg-white px-2 py-1">1.</span>
                <span className="rounded bg-white px-2 py-1">Link</span>
                <span className="rounded bg-white px-2 py-1">Image</span>
                <span className="rounded bg-white px-2 py-1">Source</span>
              </div>
              <textarea
                value={termsBody}
                onChange={(e) => setTermsBody(e.target.value)}
                className="min-h-[360px] w-full resize-none border-0 bg-white p-4 text-sm text-slate-700 outline-none"
              />
            </div>
            <div className="mt-4">
              <button className="rounded-xl bg-[#0d2c54] px-5 py-2 text-sm font-black text-white">
                <Save size={14} className="mr-2 inline" /> {t("Save", "သိမ်းမည်")}
              </button>
            </div>
          </Panel>
        </div>
      ) : null}

      {activeTab === "tariff" ? (
        <div className="mt-8 space-y-6">
          <Panel
            title={t("Regular price package", "ပုံမှန်ဈေးနှုန်း package")}
            subtitle={t(
              "These price packages will be effected to all merchants.",
              "ဤဈေးနှုန်း package များကို merchant အားလုံးအတွက် သက်ရောက်စေမည်။",
            )}
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <button className="rounded-xl bg-[#0d2c54] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white">
                <PlusCircle size={14} className="mr-2 inline" /> {t("Add New", "အသစ်ထည့်မည်")}
              </button>
              <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
                <input
                  type="checkbox"
                  checked={activeOnly}
                  onChange={(e) => setActiveOnly(e.target.checked)}
                  className="h-4 w-4 accent-[#0d2c54]"
                />
                {t("Active only", "Active များသာ")}
              </label>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-black">{t("Name", "အမည်")}</th>
                    <th className="px-4 py-3 font-black">{t("Based price", "အခြေခံဈေး")}</th>
                    <th className="px-4 py-3 font-black">{t("Pickup charges", "လာယူခ")}</th>
                    <th className="px-4 py-3 font-black">{t("Last update", "နောက်ဆုံးပြင်ဆင်ချိန်")}</th>
                    <th className="px-4 py-3 font-black">{t("Plan", "အစီအစဉ်")}</th>
                    <th className="px-4 py-3 font-black">{t("Description", "ဖော်ပြချက်")}</th>
                    <th className="px-4 py-3 font-black"></th>
                  </tr>
                </thead>
                <tbody>
                  {tariffRows
                    .filter((row) => (activeOnly ? row.active : true))
                    .map((row) => (
                      <tr key={row.name} className="border-t border-slate-100">
                        <td className="px-4 py-3 font-semibold text-[#0d2c54]">{row.name}</td>
                        <td className="px-4 py-3">{row.base.toLocaleString()} Ks</td>
                        <td className="px-4 py-3">{row.pickup}</td>
                        <td className="px-4 py-3">{row.updated}</td>
                        <td className="px-4 py-3">{row.plan}</td>
                        <td className="px-4 py-3">
                          <StatusPill
                            text={row.active ? t("Active", "အသုံးပြုနေ") : t("Inactive", "မသုံး")}
                            tone={row.active ? "good" : "default"}
                          />
                        </td>
                        <td className="px-4 py-3 text-[#0d2c54]">→</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <Panel
              title={t("Origin & Destination", "စတင်နေရာနှင့် သွားမည့်နေရာ")}
              subtitle={t(
                "Region and township level routing matrix.",
                "တိုင်း/ပြည်နယ် နှင့် မြို့နယ်အလိုက် လမ်းကြောင်းသတ်မှတ်ချက်။",
              )}
            >
              <div className="space-y-6 rounded-3xl border border-slate-100 bg-slate-50 p-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {t("Origin", "ပေးပို့မည့်နေရာ")}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <select className="w-full rounded-xl border bg-white p-4 text-xs font-bold text-[#0d2c54] outline-none">
                      <option>Yangon Region</option>
                      <option>Mandalay Region</option>
                      <option>Shan State</option>
                    </select>
                    <select className="w-full rounded-xl border bg-white p-4 text-xs font-bold text-[#0d2c54] outline-none">
                      <option>All Townships</option>
                      <option>Kamayut Township</option>
                      <option>Bahan Township</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {t("Destination", "လက်ခံမည့်နေရာ")}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <select className="w-full rounded-xl border bg-white p-4 text-xs font-bold text-[#0d2c54] outline-none">
                      <option>Mandalay Region</option>
                      <option>Yangon Region</option>
                      <option>Shan State</option>
                    </select>
                    <select className="w-full rounded-xl border bg-white p-4 text-xs font-bold text-[#0d2c54] outline-none">
                      <option>All Townships</option>
                      <option>Chanmyathazi Township</option>
                    </select>
                  </div>
                </div>
              </div>
            </Panel>

            <Panel
              title={t("Dynamic Pricing Engine", "ဈေးနှုန်းသတ်မှတ်ချက်")}
              subtitle={t(
                "Base delivery fee, extra weight, and insurance settings.",
                "အခြေခံပို့ဆောင်ခ၊ အလေးချိန်ပိုကြေးနှင့် insurance သတ်မှတ်ချက်များ။",
              )}
            >
              <div className="space-y-6 rounded-3xl bg-[#0d2c54] p-6 text-white shadow-xl">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/50">
                    {t("Base Delivery Fee (0-1 KG)", "အခြေခံပို့ဆောင်ခ (0-1 KG)")}
                  </label>
                  <div className="mt-2 flex items-end gap-2 border-b border-white/20 pb-2">
                    <input
                      type="number"
                      defaultValue={3500}
                      className="w-full bg-transparent text-4xl font-black text-[#ffd700] outline-none"
                    />
                    <span className="mb-2 text-xs font-bold">MMK</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/50">
                      {t("Extra KG Charge", "အလေးချိန်ပိုကြေး")}
                    </label>
                    <input
                      type="number"
                      defaultValue={500}
                      className="mt-2 w-full rounded-xl border border-white/10 bg-white/10 p-3 font-bold text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/50">
                      {t("Insurance Rate (%)", "အာမခံနှုန်း (%)")}
                    </label>
                    <input
                      type="number"
                      defaultValue={1.5}
                      className="mt-2 w-full rounded-xl border border-white/10 bg-white/10 p-3 font-bold text-white outline-none"
                    />
                  </div>
                </div>
              </div>
            </Panel>
          </div>
        </div>
      ) : null}

      {activeTab === "network" ? (
        <div className="mt-8">
          <Panel
            title={t("Network Nodes", "ကွန်ရက်တိုးချဲ့မှု")}
            subtitle={t("Branch and partner node configuration.", "Branch နှင့် partner node သတ်မှတ်ချက်များ။")}
          >
            <div className="mb-4 flex items-center justify-between rounded-2xl bg-slate-50 p-4">
              <h3 className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-[#0d2c54]">
                <Network size={18} className="text-emerald-500" />
                {t("Network Expansion", "ကွန်ရက်တိုးချဲ့မှု")}
              </h3>
              <button className="rounded-xl bg-[#0d2c54] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white">
                <PlusCircle size={14} className="mr-2 inline" />
                {t("Add New Node", "Node အသစ်ထည့်မည်")}
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b bg-white text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <tr>
                    <th className="p-6">{t("Node Code", "Node Code")}</th>
                    <th className="p-6">{t("Location", "တည်နေရာ")}</th>
                    <th className="p-6">{t("Entity Type", "အမျိုးအစား")}</th>
                    <th className="p-6">{t("Revenue Share", "ဝင်ငွေခွဲဝေမှု")}</th>
                    <th className="p-6">{t("Status", "အခြေအနေ")}</th>
                  </tr>
                </thead>
                <tbody className="font-bold text-[#0d2c54]">
                  {networkRows.map((row) => (
                    <tr key={row.code} className="border-b hover:bg-slate-50 last:border-b-0">
                      <td className="p-6 font-mono text-blue-600">{row.code}</td>
                      <td className="p-6">{row.location}</td>
                      <td className="p-6">
                        <span
                          className={`inline-flex w-fit items-center gap-2 rounded-lg px-3 py-1 text-[10px] uppercase ${
                            row.entity.includes("Partner")
                              ? "bg-amber-50 text-amber-600"
                              : "bg-emerald-50 text-emerald-600"
                          }`}
                        >
                          {row.entity.includes("Partner") ? <Truck size={14} /> : <Store size={14} />} {row.entity}
                        </span>
                      </td>
                      <td className="p-6">{row.revenue}</td>
                      <td className="p-6">
                        <div className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      ) : null}

      {activeTab === "geo" ? (
        <div className="mt-8">
          <div className="rounded-[40px] border-4 border-dashed border-slate-200 bg-slate-100 p-12 text-center">
            <Map size={64} className="mx-auto mb-4 text-slate-300" />
            <h3 className="text-xl font-black uppercase tracking-widest text-[#0d2c54]">
              {t("Myanmar Geospatial Database", "မြန်မာနိုင်ငံ Geospatial Database")}
            </h3>
            <p className="mt-2 font-bold text-slate-400">
              {t(
                "14 States/Regions and 330 Townships Pre-Loaded.",
                "တိုင်း/ပြည်နယ် 14 ခုနှင့် မြို့နယ် 330 ခု အချက်အလက်ထည့်သွင်းထားပြီးဖြစ်သည်။",
              )}
            </p>
          </div>
        </div>
      ) : null}

      {activeTab === "auth" ? (
        <div className="mt-8 space-y-6 rounded-[32px] bg-[#0B101B] p-6 text-slate-300 shadow-2xl">
          <div className="flex flex-col gap-4 rounded-[2.5rem] border border-white/5 bg-[#05080F] p-6 md:flex-row md:items-center md:justify-between md:p-8">
            <div className="flex items-center gap-6">
              <div className="rounded-2xl bg-sky-500/10 p-4">
                <UserPlus className="h-8 w-8 text-sky-500" />
              </div>
              <div>
                <h2 className="text-3xl font-black uppercase italic text-white">
                  {t("Account Control", "အကောင့်ထိန်းချုပ်မှု")}
                </h2>
                <p className="font-mono text-[10px] uppercase tracking-widest italic text-sky-500">
                  {t("Enterprise Identity Governance", "လုပ်ငန်းသုံး Identity Governance")}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {actorEmail
                    ? `${t("Signed in as", "ဝင်ထားသည်")}: ${actorEmail}`
                    : t("Not signed in", "ဝင်မထားပါ")}
                </p>
                {actor ? (
                  <p className="mt-1 font-mono text-[10px] text-slate-600">
                    ROLE: {actor.role} • STATUS: {actor.status} • MODE: {isPriv ? "DIRECT" : "REQUEST"} • STORE:{" "}
                    {STORAGE_KEY}
                  </p>
                ) : (
                  <p className="mt-1 flex items-center gap-2 text-xs text-amber-300">
                    <AlertTriangle className="h-4 w-4" />
                    {t(
                      "Session user not registered in Account Registry.",
                      "Session user သည် Registry ထဲတွင် မရှိပါ။",
                    )}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                className={`h-12 rounded-xl px-5 font-black uppercase ${
                  authView === "ACCOUNTS"
                    ? "bg-emerald-600 text-white hover:bg-emerald-500"
                    : "bg-white/5 text-white hover:bg-white/10"
                }`}
                onClick={() => setAuthView("ACCOUNTS")}
              >
                <UserCog className="mr-2 h-4 w-4" />
                {t("Accounts", "အကောင့်များ")}
              </Button>
              <Button
                className={`h-12 rounded-xl px-5 font-black uppercase ${
                  authView === "AUTH_REQUESTS"
                    ? "bg-emerald-600 text-white hover:bg-emerald-500"
                    : "bg-white/5 text-white hover:bg-white/10"
                }`}
                onClick={() => setAuthView("AUTH_REQUESTS")}
                disabled={!canAuth && !isPriv}
              >
                <Inbox className="mr-2 h-4 w-4" />
                {t("Authority Requests", "Authority Requests")}
                {pendingAuthorityCount ? (
                  <span className="ml-3 inline-flex items-center rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-black text-amber-300">
                    {pendingAuthorityCount}
                  </span>
                ) : null}
              </Button>
              <Button
                className={`h-12 rounded-xl px-5 font-black uppercase ${
                  authView === "AUDIT"
                    ? "bg-emerald-600 text-white hover:bg-emerald-500"
                    : "bg-white/5 text-white hover:bg-white/10"
                }`}
                onClick={() => setAuthView("AUDIT")}
                disabled={!canAudit}
              >
                <History className="mr-2 h-4 w-4" />
                {t("Audit", "Audit")}
              </Button>
            </div>
          </div>

          {toast ? (
            <div
              className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm ${
                toast.type === "ok"
                  ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-300"
                  : toast.type === "warn"
                    ? "border-amber-500/20 bg-amber-500/5 text-amber-300"
                    : "border-rose-500/20 bg-rose-500/5 text-rose-300"
              }`}
            >
              {toast.type === "ok" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : toast.type === "warn" ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <div>{toast.msg}</div>
            </div>
          ) : null}

          {authView === "AUTH_REQUESTS" ? <RequestsPanel /> : null}
          {authView === "AUDIT" ? <AuditPanel /> : null}

          {authView === "ACCOUNTS" ? (
            <>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    className="h-12 w-full rounded-full border border-white/10 bg-[#05080F] pl-12 pr-6 text-sm text-slate-200"
                    placeholder={t("Search accounts...", "အကောင့်ရှာရန်...")}
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    disabled={!canRead}
                  />
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  {canExport ? (
                    <>
                      <Button
                        className="h-12 rounded-xl bg-white/5 px-5 font-black uppercase text-white hover:bg-white/10"
                        onClick={exportAccountsCsv}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        {t("Export CSV", "CSV ထုတ်ရန်")}
                      </Button>
                      <Button
                        className="h-12 rounded-xl bg-white/5 px-5 font-black uppercase text-white hover:bg-white/10"
                        onClick={exportGrantsCsv}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Authorities CSV
                      </Button>
                    </>
                  ) : null}

                  {canImport ? (
                    <Button
                      className="h-12 rounded-xl bg-white/5 px-5 font-black uppercase text-white hover:bg-white/10"
                      onClick={() => setModalImport(true)}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {t("Import CSV", "CSV သွင်းရန်")}
                    </Button>
                  ) : null}
                  {canBulk ? (
                    <Button
                      className="h-12 rounded-xl bg-white/5 px-5 font-black uppercase text-white hover:bg-white/10"
                      onClick={() => setModalBulk(true)}
                    >
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      {t("Bulk Actions", "အုပ်စုလိုက်")}
                    </Button>
                  ) : null}
                  {canCreate ? (
                    <Button
                      className="h-12 rounded-xl bg-sky-600 px-6 font-black uppercase text-white hover:bg-sky-500"
                      onClick={() => setModalCreate(true)}
                    >
                      {t("Create Account", "အကောင့်အသစ်ဖွင့်မည်")}
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <Pill className="bg-white/5 text-slate-300">{t("Filters", "စစ်ထုတ်မှု")}</Pill>
                  <div className="flex items-center gap-2">
                    <div className="font-mono text-[10px] uppercase tracking-widest text-slate-600">
                      {t("Status", "အခြေအနေ")}
                    </div>
                    <Select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as any)}
                      className="w-44"
                      disabled={!canRead}
                    >
                      <option value="ALL">ALL</option>
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="PENDING">PENDING</option>
                      <option value="SUSPENDED">SUSPENDED</option>
                      <option value="REJECTED">REJECTED</option>
                      <option value="ARCHIVED">ARCHIVED</option>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="font-mono text-[10px] uppercase tracking-widest text-slate-600">
                      {t("Role", "Role")}
                    </div>
                    <Select
                      value={filterRole}
                      onChange={(e) => setFilterRole(e.target.value as any)}
                      className="w-52"
                      disabled={!canRead}
                    >
                      <option value="ALL">ALL</option>
                      {DEFAULT_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <Button
                    variant="ghost"
                    className="h-11 text-slate-400 hover:text-white"
                    onClick={() => {
                      setQ("");
                      setFilterStatus("ALL");
                      setFilterRole("ALL");
                      setToast({ type: "ok", msg: t("Reset.", "ပြန်ချ") });
                    }}
                    disabled={!canRead}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {t("Reset", "ပြန်ချ")}
                  </Button>
                </div>
                <div className="font-mono text-xs text-slate-600">
                  MODE: {isPriv ? "DIRECT" : "REQUEST"} • PENDING_AUTH: {pendingAuthorityCount}
                </div>
              </div>

              {!canRead ? (
                <Card className="rounded-[2rem] border-none bg-[#05080F] p-6 ring-1 ring-white/5">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-300" />
                    <div>
                      <div className="font-black uppercase italic text-white">
                        {t("Access denied", "ဝင်ရောက်ခွင့်မရှိပါ")}
                      </div>
                      <div className="text-sm text-slate-500">
                        {t(
                          "Super Admin must grant you USER_READ.",
                          "Super Admin မှ USER_READ အာဏာပေးရပါမည်။",
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="overflow-hidden rounded-[3rem] border-none bg-[#05080F] ring-1 ring-white/5">
                  <table className="w-full text-left">
                    <thead className="bg-white/5 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
                      <tr>
                        <th className="p-6">
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-sky-500"
                              checked={paged.length > 0 && paged.every((a) => selected[a.email])}
                              onChange={(e) => selectAllOnPage(e.target.checked)}
                              disabled={!canBulk}
                            />
                            {t("Select", "ရွေးချယ်")}
                          </label>
                        </th>
                        <th className="p-6">{t("Personnel Info", "ဝန်ထမ်းအချက်အလက်")}</th>
                        <th className="p-6">{t("Role / Authority", "Role / Authority")}</th>
                        <th className="p-6">{t("Status", "အခြေအနေ")}</th>
                        <th className="p-6 text-right">{t("Actions", "လုပ်ဆောင်မှု")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {paged.map((u) => {
                        const st = formatStatus(u.status);
                        const blocked = u.status === "SUSPENDED";
                        const grantsCount = roleIsPrivileged(u.role)
                          ? "ALL"
                          : activeGrantsFor(store.grants, u.email).length;
                        return (
                          <tr key={u.email} className="transition-all hover:bg-white/5">
                            <td className="p-6">
                              <input
                                type="checkbox"
                                className="h-4 w-4 accent-sky-500"
                                checked={!!selected[u.email]}
                                disabled={!canBulk}
                                onChange={(e) =>
                                  setSelected((prev) => ({ ...prev, [u.email]: e.target.checked }))
                                }
                              />
                            </td>
                            <td className="p-6">
                              <p className="font-bold uppercase italic text-white">{u.name}</p>
                              <p className="text-xs text-slate-500">{u.email}</p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {u.department ? <Pill className="bg-white/5 text-slate-300">{u.department}</Pill> : null}
                                {u.employeeId ? <Pill className="bg-white/5 text-slate-300">{u.employeeId}</Pill> : null}
                                {u.phone ? <Pill className="bg-white/5 text-slate-300">{u.phone}</Pill> : null}
                              </div>
                            </td>
                            <td className="p-6">
                              <Pill className={roleBadgeClass(u.role)}>{u.role}</Pill>
                              <div className="mt-2 text-xs text-slate-600">
                                Authorities: <span className="text-slate-300">{grantsCount}</span>
                              </div>
                              {u.status === "PENDING" ? (
                                <div className="mt-1 font-mono text-[10px] text-slate-600">
                                  Defaults: {defaultPortalPermissionsForRole(u.role).join(", ") || "NONE"}
                                </div>
                              ) : null}
                            </td>
                            <td className="p-6">
                              <span className={`text-[10px] font-bold italic ${st.cls}`}>{st.label}</span>
                            </td>
                            <td className="space-x-1 p-6 text-right md:space-x-2">
                              <Button
                                variant="ghost"
                                className="h-10 text-slate-500 hover:text-white"
                                title="View"
                                onClick={() => setModalProfileEmail(u.email)}
                              >
                                <UserCog size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                className="h-10 text-slate-500 hover:text-white disabled:opacity-40"
                                title="Authority"
                                disabled={!canAuth}
                                onClick={() => setModalAuthorityEmail(u.email)}
                              >
                                <ShieldCheck size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                className={`h-10 ${
                                  blocked
                                    ? "text-emerald-400 hover:bg-emerald-500/10"
                                    : "text-rose-500 hover:bg-rose-500/10"
                                } disabled:opacity-40`}
                                title={blocked ? "Unblock" : "Block"}
                                disabled={!canBlock}
                                onClick={() => blockToggle(u.email, !blocked)}
                              >
                                <Lock size={16} />
                              </Button>
                              {canRoleEdit ? (
                                <select
                                  className="ml-2 h-10 rounded-xl border border-white/10 bg-[#0B101B] px-3 text-xs text-slate-200"
                                  value={u.role}
                                  onChange={(e) => changeRole(u.email, e.target.value as Role)}
                                  title="Role"
                                >
                                  {DEFAULT_ROLES.map((r) => (
                                    <option key={r} value={r}>
                                      {r}
                                    </option>
                                  ))}
                                </select>
                              ) : null}
                              {u.status === "PENDING" ? (
                                <>
                                  <Button
                                    className="ml-2 h-10 rounded-xl bg-emerald-600 px-4 font-black uppercase text-white hover:bg-emerald-500 disabled:opacity-40"
                                    disabled={!canApprove}
                                    onClick={() => setModalApproveEmail(u.email)}
                                  >
                                    {t("Approve", "အတည်ပြု")}
                                  </Button>
                                  <Button
                                    className="h-10 rounded-xl bg-rose-600 px-4 font-black uppercase text-white hover:bg-rose-500 disabled:opacity-40"
                                    disabled={!canReject}
                                    onClick={() => setModalRejectEmail(u.email)}
                                  >
                                    {t("Reject", "ငြင်းပယ်")}
                                  </Button>
                                </>
                              ) : null}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {filtered.length === 0 ? (
                    <div className="p-10 text-center text-slate-600">{t("No accounts found.", "အကောင့်မတွေ့ပါ။")}</div>
                  ) : null}

                  <div className="flex items-center justify-between border-t border-white/5 px-6 py-4">
                    <div className="font-mono text-xs text-slate-600">
                      {filtered.length} total • page {Math.min(page, totalPages)} / {totalPages}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        className="h-10 text-slate-400 hover:text-white disabled:opacity-40"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                      >
                        Prev
                      </Button>
                      <Button
                        variant="ghost"
                        className="h-10 text-slate-400 hover:text-white disabled:opacity-40"
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </>
          ) : null}
        </div>
      ) : null}

      <Modal
        open={modalCreate}
        title={t("Create account request", "အကောင့်တောင်းဆိုမှု ဖန်တီးရန်")}
        onClose={() => setModalCreate(false)}
        widthClass="max-w-3xl"
      >
        <CreateModal />
      </Modal>
      <Modal
        open={!!modalAuthorityEmail}
        title={t("Manage authorities", "အာဏာများ စီမံရန်")}
        onClose={() => setModalAuthorityEmail(null)}
        widthClass="max-w-4xl"
      >
        {modalAuthorityEmail ? <AuthorityModal email={modalAuthorityEmail} /> : null}
      </Modal>
      <Modal
        open={!!modalProfileEmail}
        title={t("Account profile", "အကောင့်အချက်အလက်")}
        onClose={() => setModalProfileEmail(null)}
        widthClass="max-w-3xl"
      >
        {modalProfileEmail ? <ProfileModal email={modalProfileEmail} /> : null}
      </Modal>
      <Modal
        open={!!modalApproveEmail}
        title={t("Approve request", "တောင်းဆိုမှု အတည်ပြုရန်")}
        onClose={() => setModalApproveEmail(null)}
        widthClass="max-w-2xl"
      >
        {modalApproveEmail ? <ApproveRejectModal email={modalApproveEmail} mode="approve" /> : null}
      </Modal>
      <Modal
        open={!!modalRejectEmail}
        title={t("Reject request", "တောင်းဆိုမှု ငြင်းပယ်ရန်")}
        onClose={() => setModalRejectEmail(null)}
        widthClass="max-w-2xl"
      >
        {modalRejectEmail ? <ApproveRejectModal email={modalRejectEmail} mode="reject" /> : null}
      </Modal>
      <Modal
        open={modalImport}
        title={t("Import CSV", "CSV သွင်းရန်")}
        onClose={() => setModalImport(false)}
        widthClass="max-w-3xl"
      >
        <ImportModal />
      </Modal>
      <Modal
        open={modalBulk}
        title={t("Bulk actions", "အုပ်စုလိုက်လုပ်ဆောင်မှု")}
        onClose={() => setModalBulk(false)}
        widthClass="max-w-3xl"
      >
        <BulkModal />
      </Modal>
    </div>
  );
}
