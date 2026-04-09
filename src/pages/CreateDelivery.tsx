"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import {
  AlertCircle,
  Banknote,
  Boxes,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Globe2,
  MapPin,
  Package2,
  Printer,
  Save,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Truck,
  User,
  WalletCards,
  XCircle,
} from "lucide-react";

type Language = "en" | "my" | "both";
type DeliveryMode = "pickup_delivery" | "office_to_office";
type ActionType = "draft" | "submit" | "print";

type FormState = {
  service_type: "express" | "same_day" | "next_day" | "scheduled";
  priority: "normal" | "urgent" | "vip";
  booking_reference: string;
  branch_code: string;
  merchant_account_id: string;
  schedule_date: string;

  sender_name: string;
  sender_phone: string;
  sender_alt_phone: string;
  sender_township: string;
  sender_address: string;
  sender_landmark: string;
  sender_lat: string;
  sender_lng: string;
  pickup_time_from: string;
  pickup_time_to: string;

  recipient_name: string;
  recipient_phone: string;
  recipient_alt_phone: string;
  recipient_township: string;
  recipient_address: string;
  recipient_landmark: string;
  recipient_lat: string;
  recipient_lng: string;
  delivery_time_from: string;
  delivery_time_to: string;

  product_name: string;
  product_category: string;
  product_weight: string;
  product_length_cm: string;
  product_width_cm: string;
  product_height_cm: string;
  product_qty: string;
  package_count: string;
  declared_value_mmks: string;
  fragile: boolean;
  special_handling: string;
  rider_remark: string;

  payment_term: "COD" | "PREPAID" | "ACCOUNT";
  payer_type: "sender" | "recipient" | "merchant" | "account";
  delivery_fee_mmks: string;
  extra_weight_charges: string;
  insurance_fee_mmks: string;
  discount_mmks: string;
  cod_amount_mmks: string;

  pod_type: "none" | "photo" | "signature" | "pin" | "barcode" | "id_check";
  contactless_ok: boolean;
  return_if_failed: boolean;
  dispatch_mode: "auto" | "manual";
  preferred_vehicle: "bike" | "car" | "van" | "office_transfer";
  send_tracking_sms: boolean;
  print_label_after_create: boolean;
};

type FormErrors = Partial<Record<keyof FormState | "general", string>>;

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-en",
});

const myanmar = Noto_Sans_Myanmar({
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-my",
});

const emptyForm: FormState = {
  service_type: "same_day",
  priority: "normal",
  booking_reference: "",
  branch_code: "YGN-HQ",
  merchant_account_id: "",
  schedule_date: "",

  sender_name: "",
  sender_phone: "",
  sender_alt_phone: "",
  sender_township: "",
  sender_address: "",
  sender_landmark: "",
  sender_lat: "",
  sender_lng: "",
  pickup_time_from: "",
  pickup_time_to: "",

  recipient_name: "",
  recipient_phone: "",
  recipient_alt_phone: "",
  recipient_township: "",
  recipient_address: "",
  recipient_landmark: "",
  recipient_lat: "",
  recipient_lng: "",
  delivery_time_from: "",
  delivery_time_to: "",

  product_name: "",
  product_category: "General",
  product_weight: "",
  product_length_cm: "",
  product_width_cm: "",
  product_height_cm: "",
  product_qty: "1",
  package_count: "1",
  declared_value_mmks: "0",
  fragile: false,
  special_handling: "",
  rider_remark: "",

  payment_term: "COD",
  payer_type: "recipient",
  delivery_fee_mmks: "",
  extra_weight_charges: "0",
  insurance_fee_mmks: "0",
  discount_mmks: "0",
  cod_amount_mmks: "",

  pod_type: "signature",
  contactless_ok: false,
  return_if_failed: true,
  dispatch_mode: "auto",
  preferred_vehicle: "bike",
  send_tracking_sms: true,
  print_label_after_create: true,
};

function toNumber(value: string | number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function copyFor(language: Language, en: string, my: string) {
  if (language === "en") return en;
  if (language === "my") return my;
  return `${en} / ${my}`;
}

function normalizePhone(phone: string) {
  return phone.replace(/[\s-]/g, "");
}

function isValidMyanmarPhone(phone: string) {
  const normalized = normalizePhone(phone);
  return /^(09\d{7,11}|\+?959\d{7,11})$/.test(normalized);
}

function formatMoney(value: number, locale: string) {
  return value.toLocaleString(locale);
}

const pageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.04,
    },
  },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
  },
};

function LocalizedText({
  language,
  en,
  my,
  englishClassName = "",
  myanmarClassName = "",
  separatorClassName = "text-slate-400",
}: {
  language: Language;
  en: string;
  my: string;
  englishClassName?: string;
  myanmarClassName?: string;
  separatorClassName?: string;
}) {
  if (language === "en") {
    return (
      <span lang="en" className={englishClassName}>
        {en}
      </span>
    );
  }

  if (language === "my") {
    return (
      <span lang="my" className={myanmarClassName}>
        {my}
      </span>
    );
  }

  return (
    <span className="inline-flex flex-wrap items-baseline gap-2">
      <span lang="en" className={englishClassName}>
        {en}
      </span>
      <span className={separatorClassName}>/</span>
      <span lang="my" className={myanmarClassName}>
        {my}
      </span>
    </span>
  );
}

function SegmentedControl<T extends string>({
  value,
  onChange,
  items,
  className = "",
}: {
  value: T;
  onChange: (value: T) => void;
  items: Array<{ value: T; label: ReactNode }>;
  className?: string;
}) {
  return (
    <div
      className={[
        "inline-flex flex-wrap items-center gap-1 rounded-2xl border border-white/70 bg-white/70 p-1.5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl",
        className,
      ].join(" ")}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className="relative rounded-[14px] px-3.5 py-2 text-sm font-semibold text-slate-600 transition-colors"
          >
            {active && (
              <motion.span
                layoutId={`segmented-${className}`}
                className="absolute inset-0 rounded-[14px] bg-[#0d2c54] shadow-[0_10px_20px_rgba(13,44,84,0.22)]"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <span className={active ? "relative z-10 text-white" : "relative z-10"}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function SurfaceCard({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.section
      variants={sectionVariants}
      transition={{ delay }}
      whileHover={{ y: -2 }}
      className={[
        "rounded-[28px] border border-white/70 bg-white/78 p-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)] backdrop-blur-xl",
        className,
      ].join(" ")}
    >
      {children}
    </motion.section>
  );
}

function DarkSurface({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.section
      variants={sectionVariants}
      className={[
        "relative overflow-hidden rounded-[30px] border border-[#17375f] bg-[linear-gradient(180deg,#0d2c54_0%,#0a2343_100%)] p-6 text-white shadow-[0_24px_64px_rgba(13,44,84,0.38)]",
        className,
      ].join(" ")}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      <div className="absolute -right-14 -top-14 h-44 w-44 rounded-full bg-[#ffd700]/10 blur-3xl" />
      <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-sky-400/10 blur-3xl" />
      <div className="relative z-10">{children}</div>
    </motion.section>
  );
}

function SectionTitle({
  icon,
  eyebrow,
  title,
  description,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4 border-b border-slate-200/80 pb-5">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-[#0d2c54] shadow-inner">
            {icon}
          </span>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">{eyebrow}</p>
            <h2 className="mt-1 text-xl font-black tracking-tight text-[#0d2c54]">{title}</h2>
          </div>
        </div>
        {description ? <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-500">{description}</p> : null}
      </div>
    </div>
  );
}

function Label({
  children,
  hint,
  error,
  tone = "default",
}: {
  children: ReactNode;
  hint?: ReactNode;
  error?: string;
  tone?: "default" | "light";
}) {
  return (
    <div className="mb-2 flex items-start justify-between gap-3">
      <label className={tone === "light" ? "text-[11px] font-black uppercase tracking-[0.2em] text-white/60" : "text-[11px] font-black uppercase tracking-[0.2em] text-slate-500"}>
        {children}
      </label>
      {error ? (
        <span className="text-xs font-bold text-rose-500">{error}</span>
      ) : hint ? (
        <span className={tone === "light" ? "text-xs font-medium text-white/45" : "text-xs font-medium text-slate-400"}>{hint}</span>
      ) : null}
    </div>
  );
}

function InputShell({
  children,
  icon,
  invalid,
  dark = false,
}: {
  children: ReactNode;
  icon?: ReactNode;
  invalid?: boolean;
  dark?: boolean;
}) {
  return (
    <div
      className={[
        "group relative rounded-2xl border transition-all duration-200",
        dark
          ? invalid
            ? "border-rose-400/70 bg-white/10 shadow-[0_0_0_4px_rgba(244,63,94,0.08)]"
            : "border-white/12 bg-white/8 hover:border-white/22 focus-within:border-[#ffd700]/70 focus-within:bg-white/10 focus-within:shadow-[0_0_0_4px_rgba(255,215,0,0.08)]"
          : invalid
            ? "border-rose-300 bg-rose-50/60 shadow-[0_0_0_4px_rgba(244,63,94,0.08)]"
            : "border-slate-200/90 bg-white/95 shadow-[0_8px_24px_rgba(15,23,42,0.04)] hover:border-slate-300 hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)] focus-within:border-[#0d2c54]/35 focus-within:shadow-[0_0_0_4px_rgba(13,44,84,0.08)]",
      ].join(" ")}
    >
      {icon ? (
        <div className={dark ? "pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/45" : "pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"}>{icon}</div>
      ) : null}
      {children}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
  icon,
  invalid,
  dark = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  icon?: ReactNode;
  invalid?: boolean;
  dark?: boolean;
}) {
  return (
    <InputShell icon={icon} invalid={invalid} dark={dark}>
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={[
          "w-full rounded-2xl bg-transparent px-4 py-3.5 text-sm font-semibold outline-none placeholder:font-medium",
          icon ? "pl-11" : "",
          dark ? "text-white placeholder:text-white/32" : "text-[#0d2c54] placeholder:text-slate-300",
        ].join(" ")}
      />
    </InputShell>
  );
}

function TextAreaInput({
  value,
  onChange,
  placeholder,
  rows = 3,
  invalid,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  invalid?: boolean;
}) {
  return (
    <InputShell invalid={invalid}>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full resize-none rounded-2xl bg-transparent px-4 py-3.5 text-sm font-semibold text-[#0d2c54] outline-none placeholder:font-medium placeholder:text-slate-300"
      />
    </InputShell>
  );
}

function SelectInput({
  value,
  onChange,
  options,
  invalid,
  dark = false,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  invalid?: boolean;
  dark?: boolean;
}) {
  return (
    <InputShell invalid={invalid} dark={dark}>
      <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
        <ChevronRight className={dark ? "rotate-90 text-white/35" : "rotate-90 text-slate-400"} size={16} />
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={[
          "w-full appearance-none rounded-2xl bg-transparent px-4 py-3.5 pr-10 text-sm font-semibold outline-none",
          dark ? "text-white" : "text-[#0d2c54]",
        ].join(" ")}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="text-slate-900">
            {option.label}
          </option>
        ))}
      </select>
    </InputShell>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  accent = "default",
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  accent?: "default" | "light";
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={[
        "flex w-full items-center justify-between gap-4 rounded-2xl border px-4 py-4 text-left transition",
        accent === "light"
          ? checked
            ? "border-white/22 bg-white/12"
            : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
          : checked
            ? "border-[#0d2c54]/15 bg-[#0d2c54]/[0.03]"
            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80",
      ].join(" ")}
    >
      <div>
        <p className={accent === "light" ? "text-sm font-bold text-white" : "text-sm font-bold text-[#0d2c54]"}>{label}</p>
        <p className={accent === "light" ? "mt-1 text-xs font-medium text-white/55" : "mt-1 text-xs font-medium text-slate-500"}>{description}</p>
      </div>
      <motion.span
        animate={{ backgroundColor: checked ? "#ffd700" : accent === "light" ? "rgba(255,255,255,0.16)" : "#e2e8f0" }}
        className="relative flex h-7 w-12 items-center rounded-full p-1"
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 700, damping: 34 }}
          className="h-5 w-5 rounded-full bg-white shadow-sm"
          style={{ marginLeft: checked ? 20 : 0 }}
        />
      </motion.span>
    </button>
  );
}

function MetricTile({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "gold";
}) {
  return (
    <div className={tone === "gold" ? "rounded-2xl border border-white/10 bg-[#081735] p-4 shadow-inner" : "rounded-2xl border border-slate-200/90 bg-white/90 p-4 shadow-[0_10px_20px_rgba(15,23,42,0.05)]"}>
      <p className={tone === "gold" ? "text-[11px] font-black uppercase tracking-[0.18em] text-white/45" : "text-[11px] font-black uppercase tracking-[0.18em] text-slate-400"}>{label}</p>
      <p className={tone === "gold" ? "mt-2 text-2xl font-black text-[#ffd700]" : "mt-2 text-2xl font-black text-[#0d2c54]"}>{value}</p>
    </div>
  );
}

function MotionButton({
  children,
  onClick,
  disabled,
  tone = "primary",
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: "primary" | "secondary";
}) {
  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onClick}
      whileHover={disabled ? undefined : { y: -1, scale: 1.01 }}
      whileTap={disabled ? undefined : { scale: 0.985 }}
      transition={{ type: "spring", stiffness: 420, damping: 26 }}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-4 text-xs font-black uppercase tracking-[0.18em] outline-none disabled:cursor-not-allowed disabled:opacity-50",
        tone === "primary"
          ? "bg-[#ffd700] text-[#0d2c54] shadow-[0_18px_40px_rgba(255,215,0,0.26)] ring-1 ring-[#ffe45a]/50"
          : "border border-slate-200 bg-white text-slate-700 shadow-[0_12px_24px_rgba(15,23,42,0.05)]",
      ].join(" ")}
    >
      {children}
    </motion.button>
  );
}

export default function CreateDeliveryClient() {
  // Removed local client;

  const [loadingAction, setLoadingAction] = useState<ActionType | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [language, setLanguage] = useState<Language>("both");
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("pickup_delivery");
  const [form, setForm] = useState<FormState>(emptyForm);

  const loading = loadingAction !== null;
  const currencyLocale = language === "my" ? "my-MM" : "en-US";

  useEffect(() => {
    if (form.payment_term !== "COD" && form.cod_amount_mmks !== "") {
      setForm((prev) => ({ ...prev, cod_amount_mmks: "" }));
    }
  }, [form.payment_term, form.cod_amount_mmks]);

  useEffect(() => {
    if (deliveryMode === "office_to_office" && form.preferred_vehicle === "bike") {
      setForm((prev) => ({ ...prev, preferred_vehicle: "office_transfer" }));
    }
  }, [deliveryMode, form.preferred_vehicle]);

  const senderAddressLabel =
    deliveryMode === "pickup_delivery"
      ? { en: "Pickup Address", my: "လာယူမည့်လိပ်စာ" }
      : { en: "Sending Office", my: "ပို့မည့်ရုံး" };

  const recipientAddressLabel =
    deliveryMode === "pickup_delivery"
      ? { en: "Delivery Address", my: "ပို့ဆောင်မည့်လိပ်စာ" }
      : { en: "Receiving Office", my: "လက်ခံမည့်ရုံး" };

  const volWeight = useMemo(() => {
    const l = toNumber(form.product_length_cm);
    const w = toNumber(form.product_width_cm);
    const h = toNumber(form.product_height_cm);
    if (!l || !w || !h) return 0;
    return (l * w * h) / 5000;
  }, [form.product_length_cm, form.product_width_cm, form.product_height_cm]);

  const chargeSubtotal = useMemo(() => {
    const fee = toNumber(form.delivery_fee_mmks);
    const extra = toNumber(form.extra_weight_charges);
    const insurance = toNumber(form.insurance_fee_mmks);
    const discount = toNumber(form.discount_mmks);
    return Math.max(0, fee + extra + insurance - discount);
  }, [form.delivery_fee_mmks, form.extra_weight_charges, form.insurance_fee_mmks, form.discount_mmks]);

  const totalToCollect = useMemo(() => {
    const cod = form.payment_term === "COD" ? toNumber(form.cod_amount_mmks) : 0;
    const deliveryChargeCollectable = form.payer_type === "recipient" ? chargeSubtotal : 0;
    return Math.max(0, cod + deliveryChargeCollectable);
  }, [form.payment_term, form.cod_amount_mmks, form.payer_type, chargeSubtotal]);

  const chargeableWeight = useMemo(() => {
    return Math.max(toNumber(form.product_weight), volWeight);
  }, [form.product_weight, volWeight]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      if (!prev[key] && !prev.general) return prev;
      const next = { ...prev };
      delete next[key];
      delete next.general;
      return next;
    });
  };

  const resetForm = () => {
    setForm((prev) => ({
      ...emptyForm,
      branch_code: prev.branch_code || emptyForm.branch_code,
      merchant_account_id: prev.merchant_account_id,
    }));
    setFieldErrors({});
  };

  const validateForSubmit = (): FormErrors => {
    const errors: FormErrors = {};
    const setError = (key: keyof FormErrors, message: string) => {
      if (!errors[key]) errors[key] = message;
    };

    if (!form.service_type) setError("service_type", "Required");
    if (!form.priority) setError("priority", "Required");
    if (!form.branch_code.trim()) setError("branch_code", "Required");
    if (form.service_type === "scheduled" && !form.schedule_date) setError("schedule_date", "Required");

    if (!form.sender_name.trim()) setError("sender_name", "Required");
    if (!form.sender_township.trim()) setError("sender_township", "Required");
    if (!form.sender_address.trim()) setError("sender_address", "Required");
    if (!isValidMyanmarPhone(form.sender_phone)) setError("sender_phone", "Invalid");
    if (form.sender_alt_phone.trim() && !isValidMyanmarPhone(form.sender_alt_phone)) setError("sender_alt_phone", "Invalid");
    if (form.pickup_time_from && form.pickup_time_to && form.pickup_time_from > form.pickup_time_to) setError("pickup_time_to", "Invalid range");

    if (form.sender_lat.trim()) {
      const lat = Number(form.sender_lat);
      if (!Number.isFinite(lat) || lat < -90 || lat > 90) setError("sender_lat", "Invalid");
    }
    if (form.sender_lng.trim()) {
      const lng = Number(form.sender_lng);
      if (!Number.isFinite(lng) || lng < -180 || lng > 180) setError("sender_lng", "Invalid");
    }

    if (!form.recipient_name.trim()) setError("recipient_name", "Required");
    if (!form.recipient_township.trim()) setError("recipient_township", "Required");
    if (!form.recipient_address.trim()) setError("recipient_address", "Required");
    if (!isValidMyanmarPhone(form.recipient_phone)) setError("recipient_phone", "Invalid");
    if (form.recipient_alt_phone.trim() && !isValidMyanmarPhone(form.recipient_alt_phone)) setError("recipient_alt_phone", "Invalid");
    if (form.delivery_time_from && form.delivery_time_to && form.delivery_time_from > form.delivery_time_to) setError("delivery_time_to", "Invalid range");

    if (form.recipient_lat.trim()) {
      const lat = Number(form.recipient_lat);
      if (!Number.isFinite(lat) || lat < -90 || lat > 90) setError("recipient_lat", "Invalid");
    }
    if (form.recipient_lng.trim()) {
      const lng = Number(form.recipient_lng);
      if (!Number.isFinite(lng) || lng < -180 || lng > 180) setError("recipient_lng", "Invalid");
    }

    if (!form.product_name.trim()) setError("product_name", "Required");
    if (!form.product_category.trim()) setError("product_category", "Required");
    if (toNumber(form.product_qty) < 1) setError("product_qty", ">= 1");
    if (toNumber(form.package_count) < 1) setError("package_count", ">= 1");
    if (toNumber(form.product_weight) < 0) setError("product_weight", "Invalid");
    if (toNumber(form.declared_value_mmks) < 0) setError("declared_value_mmks", "Invalid");
    if (form.product_length_cm.trim() && toNumber(form.product_length_cm) < 0) setError("product_length_cm", "Invalid");
    if (form.product_width_cm.trim() && toNumber(form.product_width_cm) < 0) setError("product_width_cm", "Invalid");
    if (form.product_height_cm.trim() && toNumber(form.product_height_cm) < 0) setError("product_height_cm", "Invalid");

    if (!form.payment_term) setError("payment_term", "Required");
    if (!form.payer_type) setError("payer_type", "Required");
    if (toNumber(form.delivery_fee_mmks) < 0) setError("delivery_fee_mmks", "Invalid");
    if (toNumber(form.extra_weight_charges) < 0) setError("extra_weight_charges", "Invalid");
    if (toNumber(form.insurance_fee_mmks) < 0) setError("insurance_fee_mmks", "Invalid");
    if (toNumber(form.discount_mmks) < 0) setError("discount_mmks", "Invalid");
    if (form.payment_term === "COD" && toNumber(form.cod_amount_mmks) <= 0) setError("cod_amount_mmks", "Required");
    if (form.payment_term !== "COD" && toNumber(form.cod_amount_mmks) !== 0) setError("cod_amount_mmks", "Must be 0");
    if (form.payment_term === "ACCOUNT" && !form.merchant_account_id.trim()) setError("merchant_account_id", "Required");

    if (!form.pod_type) setError("pod_type", "Required");
    if (!form.dispatch_mode) setError("dispatch_mode", "Required");
    if (!form.preferred_vehicle) setError("preferred_vehicle", "Required");

    if (
      deliveryMode === "office_to_office" &&
      !["office_transfer", "car", "van"].includes(form.preferred_vehicle)
    ) {
      setError("preferred_vehicle", "Invalid mode");
    }

    if (
      form.sender_phone.trim() &&
      form.recipient_phone.trim() &&
      normalizePhone(form.sender_phone) === normalizePhone(form.recipient_phone)
    ) {
      setError("general", "Sender and recipient phone numbers should not be identical.");
    }

    return errors;
  };

  const handleAction = async (actionType: ActionType) => {
    setLoadingAction(actionType);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      if (actionType !== "draft") {
        const errors = validateForSubmit();
        if (Object.keys(errors).length > 0) {
          setFieldErrors(errors);
          const preview = Object.values(errors).slice(0, 1)[0] ?? "Please review the form.";
          setErrorMsg(
            copyFor(
              language,
              `Please review the highlighted fields. ${preview}`,
              `မီးပြထားသော field များကို ပြန်လည်စစ်ဆေးပါ။ ${preview}`,
            ),
          );
          return;
        }
      }

      const trackingNo = `BEX-${Date.now().toString().slice(-8)}`;

      const payload = {
        tracking_number: trackingNo,
        status: actionType === "draft" ? "draft" : "pending_pickup",

        service_type: form.service_type,
        priority: form.priority,
        delivery_mode: deliveryMode,
        booking_reference: form.booking_reference.trim() || null,
        branch_code: form.branch_code.trim() || null,
        merchant_account_id: form.merchant_account_id.trim() || null,
        schedule_date:
          form.service_type === "scheduled" && form.schedule_date ? form.schedule_date : null,

        sender_name: form.sender_name.trim(),
        sender_phone: normalizePhone(form.sender_phone),
        sender_alt_phone: form.sender_alt_phone.trim()
          ? normalizePhone(form.sender_alt_phone)
          : null,
        sender_township: form.sender_township.trim() || null,
        sender_address: form.sender_address.trim(),
        sender_landmark: form.sender_landmark.trim() || null,
        sender_lat: form.sender_lat ? toNumber(form.sender_lat) : null,
        sender_lng: form.sender_lng ? toNumber(form.sender_lng) : null,
        pickup_time_from: form.pickup_time_from || null,
        pickup_time_to: form.pickup_time_to || null,

        recipient_name: form.recipient_name.trim(),
        recipient_phone: normalizePhone(form.recipient_phone),
        recipient_alt_phone: form.recipient_alt_phone.trim()
          ? normalizePhone(form.recipient_alt_phone)
          : null,
        recipient_township: form.recipient_township.trim() || null,
        recipient_address: form.recipient_address.trim(),
        recipient_landmark: form.recipient_landmark.trim() || null,
        recipient_lat: form.recipient_lat ? toNumber(form.recipient_lat) : null,
        recipient_lng: form.recipient_lng ? toNumber(form.recipient_lng) : null,
        delivery_time_from: form.delivery_time_from || null,
        delivery_time_to: form.delivery_time_to || null,

        product_name: form.product_name.trim(),
        product_category: form.product_category || null,
        product_weight: toNumber(form.product_weight),
        product_length_cm: form.product_length_cm ? toNumber(form.product_length_cm) : null,
        product_width_cm: form.product_width_cm ? toNumber(form.product_width_cm) : null,
        product_height_cm: form.product_height_cm ? toNumber(form.product_height_cm) : null,
        product_qty: toNumber(form.product_qty),
        package_count: toNumber(form.package_count),
        declared_value_mmks: toNumber(form.declared_value_mmks),
        fragile: form.fragile,
        special_handling: form.special_handling.trim() || null,
        volumetric_weight: volWeight ? Number(volWeight.toFixed(3)) : 0,
        chargeable_weight: Number(chargeableWeight.toFixed(3)),

        payment_term: form.payment_term,
        payer_type: form.payer_type,
        delivery_fee_mmks: toNumber(form.delivery_fee_mmks),
        extra_weight_charges: toNumber(form.extra_weight_charges),
        insurance_fee_mmks: toNumber(form.insurance_fee_mmks),
        discount_mmks: toNumber(form.discount_mmks),
        cod_amount_mmks: form.payment_term === "COD" ? toNumber(form.cod_amount_mmks) : 0,
        charge_subtotal_mmks: chargeSubtotal,
        total_collectable_amount: totalToCollect,

        pod_type: form.pod_type,
        contactless_ok: form.contactless_ok,
        return_if_failed: form.return_if_failed,
        dispatch_mode: form.dispatch_mode,
        preferred_vehicle: form.preferred_vehicle,
        send_tracking_sms: form.send_tracking_sms,
        print_label_after_create: form.print_label_after_create,

        rider_remark: form.rider_remark.trim() || null,
        enterprise_payload: {
          ui_language: language,
          created_from: "intake_console",
          action_type: actionType,
          app_version: 2,
        },
      };

      const { error } = await supabase.from("shipments").insert([payload]);

      if (error) {
        setErrorMsg(
          copyFor(
            language,
            `Unable to save shipment: ${error.message}`,
            `Shipment ကို သိမ်းဆည်းမရပါ - ${error.message}`,
          ),
        );
        return;
      }

      setSuccessMsg(
        copyFor(
          language,
          `Success: ${trackingNo} created successfully.`,
          `အောင်မြင်ပါသည် - ${trackingNo} ဖန်တီးပြီးပါပြီ။`,
        ),
      );

      if (actionType === "print") {
        const afterPrint = () => {
          window.onafterprint = null;
          resetForm();
          setLoadingAction(null);
        };

        window.onafterprint = afterPrint;
        window.print();
        return;
      }

      resetForm();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error occurred";
      setErrorMsg(
        copyFor(language, `Unexpected error: ${message}`, `မမျှော်လင့်ထားသောအမှား - ${message}`),
      );
    } finally {
      if (actionType !== "print") {
        setLoadingAction(null);
      }
    }
  };

  const headerMetrics = [
    {
      label: copyFor(language, "Service Type", "ဝန်ဆောင်မှုအမျိုးအစား"),
      value: form.service_type.replaceAll("_", " "),
    },
    {
      label: copyFor(language, "Chargeable Weight", "တွက်ချက်အလေးချိန်"),
      value: `${chargeableWeight.toFixed(2)} kg`,
    },
    {
      label: copyFor(language, "Total Collectable", "စုစုပေါင်းကောက်ခံရန်"),
      value: `${formatMoney(totalToCollect, currencyLocale)} Ks`,
    },
  ];

  return (
    <div
      className={`${inter.variable} ${myanmar.variable} min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(13,44,84,0.12),transparent_26%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_24%),linear-gradient(180deg,#f8fbff_0%,#eef4fb_54%,#f8fafc_100%)]`}
      style={{
        fontFamily:
          'var(--font-en), var(--font-my), "Noto Sans Myanmar", "Myanmar Text", system-ui, sans-serif',
      }}
    >
      <motion.div
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-[1600px] px-4 pb-16 pt-6 sm:px-6 lg:px-8"
      >
        <motion.header variants={sectionVariants} className="relative overflow-hidden rounded-[32px] border border-white/70 bg-white/70 p-6 shadow-[0_24px_56px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-7">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/70 to-transparent" />
          <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-sky-500/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-[#ffd700]/10 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white/90 px-3 py-1.5 shadow-sm">
                <Sparkles size={14} className="text-[#0d2c54]" />
                <span className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">
                  Enterprise Operations Console
                </span>
              </div>

              <h1 className="mt-4 text-3xl font-black tracking-tight text-[#0d2c54] md:text-5xl">
                <LocalizedText
                  language={language}
                  en="Premium Shipment Intake"
                  my="အရည်အသွေးမြင့် ကုန်စည်လက်ခံရေးစနစ်"
                  englishClassName="tracking-tight"
                  myanmarClassName="tracking-normal normal-case"
                />
              </h1>

              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-500 md:text-[15px]">
                <LocalizedText
                  language={language}
                  en="A refined, dispatch-ready intake experience for enterprise logistics teams, built to feel fast, trustworthy, and operationally precise."
                  my="Enterprise logistics အဖွဲ့များအတွက် မြန်ဆန်၊ ယုံကြည်စိတ်ချရပြီး လုပ်ငန်းစဉ်တိကျသည့် dispatch-ready intake experience"
                  englishClassName=""
                  myanmarClassName="tracking-normal"
                />
              </p>
            </div>

            <div className="flex flex-col gap-3 xl:items-end">
              <SegmentedControl
                value={language}
                onChange={setLanguage}
                className="language"
                items={[
                  { value: "en", label: "EN" },
                  { value: "my", label: "မြန်မာ" },
                  { value: "both", label: "EN + မြန်မာ" },
                ]}
              />
              <SegmentedControl
                value={deliveryMode}
                onChange={setDeliveryMode}
                className="mode"
                items={[
                  {
                    value: "pickup_delivery",
                    label: copyFor(language, "Pickup & Delivery", "လာယူပို့ဆောင်ခြင်း"),
                  },
                  {
                    value: "office_to_office",
                    label: copyFor(language, "Office to Office", "ရုံးမှရုံးသို့"),
                  },
                ]}
              />
            </div>
          </div>

          <div className="relative z-10 mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            {headerMetrics.map((metric) => (
              <MetricTile key={metric.label} label={metric.label} value={metric.value} />
            ))}
          </div>
        </motion.header>

        <AnimatePresence mode="popLayout">
          {successMsg ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-300/60 bg-emerald-50/90 p-4 shadow-sm backdrop-blur"
            >
              <CheckCircle2 size={20} className="mt-0.5 text-emerald-600" />
              <div>
                <p className="text-sm font-black text-emerald-700">Shipment saved</p>
                <p className="mt-1 text-sm font-semibold text-emerald-700/90">{successMsg}</p>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence mode="popLayout">
          {errorMsg ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-6 flex items-start gap-3 rounded-2xl border border-rose-300/60 bg-rose-50/90 p-4 shadow-sm backdrop-blur"
            >
              <XCircle size={20} className="mt-0.5 text-rose-600" />
              <div>
                <p className="text-sm font-black text-rose-700">Action needed</p>
                <p className="mt-1 text-sm font-semibold text-rose-700/90">{errorMsg}</p>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="space-y-6 xl:col-span-8">
            <SurfaceCard>
              <SectionTitle
                icon={<ClipboardList size={18} />}
                eyebrow="A. Booking"
                title={copyFor(language, "Booking setup", "မှတ်တမ်းအချက်အလက်")}
                description={copyFor(
                  language,
                  "Set the operational context so routing, billing, and downstream dispatch behave correctly from the start.",
                  "Routing၊ billing နှင့် dispatch လုပ်ငန်းစဉ်များ မှန်ကန်စွာ ဆက်လက်လုပ်ဆောင်နိုင်ရန် booking context ကို သတ်မှတ်ပါ။",
                )}
              />

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <Label error={fieldErrors.service_type}>{copyFor(language, "Service Type", "ဝန်ဆောင်မှုအမျိုးအစား")}</Label>
                  <SelectInput
                    value={form.service_type}
                    onChange={(value) => setField("service_type", value as FormState["service_type"])}
                    invalid={!!fieldErrors.service_type}
                    options={[
                      { value: "express", label: copyFor(language, "Express", "အမြန်ပို့") },
                      { value: "same_day", label: copyFor(language, "Same-Day", "နေ့ချင်းပြီး") },
                      { value: "next_day", label: copyFor(language, "Next-Day", "နောက်နေ့ပို့") },
                      { value: "scheduled", label: copyFor(language, "Scheduled", "အချိန်သတ်မှတ်") },
                    ]}
                  />
                </div>

                <div>
                  <Label error={fieldErrors.priority}>{copyFor(language, "Priority", "ဦးစားပေးအဆင့်")}</Label>
                  <SelectInput
                    value={form.priority}
                    onChange={(value) => setField("priority", value as FormState["priority"])}
                    invalid={!!fieldErrors.priority}
                    options={[
                      { value: "normal", label: copyFor(language, "Normal", "ပုံမှန်") },
                      { value: "urgent", label: copyFor(language, "Urgent", "အရေးပေါ်") },
                      { value: "vip", label: copyFor(language, "VIP", "အထူး") },
                    ]}
                  />
                </div>

                <div>
                  <Label>{copyFor(language, "Reference No", "ရည်ညွှန်းနံပါတ်")}</Label>
                  <TextInput
                    value={form.booking_reference}
                    onChange={(value) => setField("booking_reference", value)}
                    placeholder="INV-2026-0001"
                    icon={<ClipboardList size={15} />}
                  />
                </div>

                <div>
                  <Label error={fieldErrors.branch_code}>{copyFor(language, "Branch Code", "ရုံးခွဲကုဒ်")}</Label>
                  <TextInput
                    value={form.branch_code}
                    onChange={(value) => setField("branch_code", value)}
                    placeholder="YGN-HQ"
                    icon={<Building2 size={15} />}
                    invalid={!!fieldErrors.branch_code}
                  />
                </div>

                <div className="md:col-span-2 xl:col-span-3">
                  <Label error={fieldErrors.merchant_account_id} hint={form.payment_term === "ACCOUNT" ? copyFor(language, "Required for account billing", "Account billing အတွက် လိုအပ်သည်") : copyFor(language, "Optional", "မဖြစ်မနေမဟုတ်")}>{copyFor(language, "Merchant Account", "Merchant အကောင့်")}</Label>
                  <TextInput
                    value={form.merchant_account_id}
                    onChange={(value) => setField("merchant_account_id", value)}
                    placeholder={copyFor(language, "Optional merchant / B2B ID", "ရွေးချယ်ထည့်နိုင်သော merchant ID")}
                    icon={<User size={15} />}
                    invalid={!!fieldErrors.merchant_account_id}
                  />
                </div>

                <AnimatePresence initial={false}>
                  {form.service_type === "scheduled" ? (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                    >
                      <Label error={fieldErrors.schedule_date}>{copyFor(language, "Scheduled Date", "သတ်မှတ်ရက်")}</Label>
                      <TextInput
                        type="date"
                        value={form.schedule_date}
                        onChange={(value) => setField("schedule_date", value)}
                        icon={<CalendarClock size={15} />}
                        invalid={!!fieldErrors.schedule_date}
                      />
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </SurfaceCard>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <SurfaceCard className="bg-[linear-gradient(180deg,rgba(255,255,255,0.82)_0%,rgba(248,250,252,0.92)_100%)]">
                <SectionTitle
                  icon={<MapPin size={18} />}
                  eyebrow="B. Sender"
                  title={copyFor(language, "Sender & pickup", "ပေးပို့သူ နှင့် လာယူမည့်နေရာ")}
                  description={copyFor(
                    language,
                    "Capture the pickup contact, location, and timing with clean operational detail.",
                    "လာယူရန်ဆက်သွယ်ရန်အချက်အလက်၊ နေရာနှင့် အချိန်ကို တိကျစွာဖြည့်သွင်းပါ။",
                  )}
                />

                <div className="space-y-5">
                  <div>
                    <Label error={fieldErrors.sender_name}>{copyFor(language, "Name / Company", "အမည် / ကုမ္ပဏီ")}</Label>
                    <TextInput
                      value={form.sender_name}
                      onChange={(value) => setField("sender_name", value)}
                      placeholder={copyFor(language, "Sender name", "ပေးပို့သူအမည်")}
                      icon={<User size={15} />}
                      invalid={!!fieldErrors.sender_name}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <Label error={fieldErrors.sender_phone}>{copyFor(language, "Primary Phone", "ဖုန်းနံပါတ် (၁)")}</Label>
                      <TextInput
                        value={form.sender_phone}
                        onChange={(value) => setField("sender_phone", value)}
                        placeholder="09..."
                        icon={<Smartphone size={15} />}
                        inputMode="tel"
                        invalid={!!fieldErrors.sender_phone}
                      />
                    </div>
                    <div>
                      <Label error={fieldErrors.sender_alt_phone}>{copyFor(language, "Alt Phone", "ဖုန်းနံပါတ် (၂)")}</Label>
                      <TextInput
                        value={form.sender_alt_phone}
                        onChange={(value) => setField("sender_alt_phone", value)}
                        placeholder={copyFor(language, "Optional", "မဖြစ်မနေမဟုတ်")}
                        inputMode="tel"
                        invalid={!!fieldErrors.sender_alt_phone}
                      />
                    </div>
                  </div>

                  <div>
                    <Label error={fieldErrors.sender_township}>{copyFor(language, "Township", "မြို့နယ်")}</Label>
                    <TextInput
                      value={form.sender_township}
                      onChange={(value) => setField("sender_township", value)}
                      placeholder={copyFor(language, "Township", "မြို့နယ်")}
                      invalid={!!fieldErrors.sender_township}
                    />
                  </div>

                  <div>
                    <Label error={fieldErrors.sender_address}>{copyFor(language, senderAddressLabel.en, senderAddressLabel.my)}</Label>
                    <TextAreaInput
                      value={form.sender_address}
                      onChange={(value) => setField("sender_address", value)}
                      placeholder={copyFor(language, senderAddressLabel.en, senderAddressLabel.my)}
                      invalid={!!fieldErrors.sender_address}
                    />
                  </div>

                  <div>
                    <Label>{copyFor(language, "Landmark / Notes", "အနီးအနားမှတ်တိုင် / မှတ်ချက်")}</Label>
                    <TextInput
                      value={form.sender_landmark}
                      onChange={(value) => setField("sender_landmark", value)}
                      placeholder={copyFor(language, "Landmark, gate, floor", "မှတ်တိုင်၊ ဂိတ်၊ အထပ်")}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <Label error={fieldErrors.sender_lat}>{copyFor(language, "Latitude", "လတ္တီတွဒ်")}</Label>
                      <TextInput
                        value={form.sender_lat}
                        onChange={(value) => setField("sender_lat", value)}
                        placeholder="16.8661"
                        invalid={!!fieldErrors.sender_lat}
                      />
                    </div>
                    <div>
                      <Label error={fieldErrors.sender_lng}>{copyFor(language, "Longitude", "လောင်ဂျီတွဒ်")}</Label>
                      <TextInput
                        value={form.sender_lng}
                        onChange={(value) => setField("sender_lng", value)}
                        placeholder="96.1951"
                        invalid={!!fieldErrors.sender_lng}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <Label>{copyFor(language, "Pickup Time (From)", "လာယူချိန် (မှ)")}</Label>
                      <TextInput
                        type="time"
                        value={form.pickup_time_from}
                        onChange={(value) => setField("pickup_time_from", value)}
                      />
                    </div>
                    <div>
                      <Label error={fieldErrors.pickup_time_to}>{copyFor(language, "Pickup Time (To)", "လာယူချိန် (ထိ)")}</Label>
                      <TextInput
                        type="time"
                        value={form.pickup_time_to}
                        onChange={(value) => setField("pickup_time_to", value)}
                        invalid={!!fieldErrors.pickup_time_to}
                      />
                    </div>
                  </div>
                </div>
              </SurfaceCard>

              <SurfaceCard className="border-sky-100 bg-[linear-gradient(180deg,rgba(240,249,255,0.88)_0%,rgba(255,255,255,0.86)_100%)]">
                <SectionTitle
                  icon={<MapPin size={18} />}
                  eyebrow="C. Recipient"
                  title={copyFor(language, "Recipient & drop-off", "လက်ခံသူ နှင့် ပို့မည့်နေရာ")}
                  description={copyFor(
                    language,
                    "Design a reliable handoff with destination detail, contact clarity, and delivery timing.",
                    "ပို့ဆောင်ရမည့်နေရာ၊ ဆက်သွယ်ရန်အချက်အလက်နှင့် အချိန်ကို တိကျစွာဖြည့်သွင်းပါ။",
                  )}
                />

                <div className="space-y-5">
                  <div>
                    <Label error={fieldErrors.recipient_name}>{copyFor(language, "Name / Company", "အမည် / ကုမ္ပဏီ")}</Label>
                    <TextInput
                      value={form.recipient_name}
                      onChange={(value) => setField("recipient_name", value)}
                      placeholder={copyFor(language, "Recipient name", "လက်ခံသူအမည်")}
                      icon={<User size={15} />}
                      invalid={!!fieldErrors.recipient_name}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <Label error={fieldErrors.recipient_phone}>{copyFor(language, "Primary Phone", "ဖုန်းနံပါတ် (၁)")}</Label>
                      <TextInput
                        value={form.recipient_phone}
                        onChange={(value) => setField("recipient_phone", value)}
                        placeholder="09..."
                        icon={<Smartphone size={15} />}
                        inputMode="tel"
                        invalid={!!fieldErrors.recipient_phone}
                      />
                    </div>
                    <div>
                      <Label error={fieldErrors.recipient_alt_phone}>{copyFor(language, "Alt Phone", "ဖုန်းနံပါတ် (၂)")}</Label>
                      <TextInput
                        value={form.recipient_alt_phone}
                        onChange={(value) => setField("recipient_alt_phone", value)}
                        placeholder={copyFor(language, "Optional", "မဖြစ်မနေမဟုတ်")}
                        inputMode="tel"
                        invalid={!!fieldErrors.recipient_alt_phone}
                      />
                    </div>
                  </div>

                  <div>
                    <Label error={fieldErrors.recipient_township}>{copyFor(language, "Township", "မြို့နယ်")}</Label>
                    <TextInput
                      value={form.recipient_township}
                      onChange={(value) => setField("recipient_township", value)}
                      placeholder={copyFor(language, "Township", "မြို့နယ်")}
                      invalid={!!fieldErrors.recipient_township}
                    />
                  </div>

                  <div>
                    <Label error={fieldErrors.recipient_address}>{copyFor(language, recipientAddressLabel.en, recipientAddressLabel.my)}</Label>
                    <TextAreaInput
                      value={form.recipient_address}
                      onChange={(value) => setField("recipient_address", value)}
                      placeholder={copyFor(language, recipientAddressLabel.en, recipientAddressLabel.my)}
                      invalid={!!fieldErrors.recipient_address}
                    />
                  </div>

                  <div>
                    <Label>{copyFor(language, "Landmark / Notes", "အနီးအနားမှတ်တိုင် / မှတ်ချက်")}</Label>
                    <TextInput
                      value={form.recipient_landmark}
                      onChange={(value) => setField("recipient_landmark", value)}
                      placeholder={copyFor(language, "Landmark, gate, floor", "မှတ်တိုင်၊ ဂိတ်၊ အထပ်")}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <Label error={fieldErrors.recipient_lat}>{copyFor(language, "Latitude", "လတ္တီတွဒ်")}</Label>
                      <TextInput
                        value={form.recipient_lat}
                        onChange={(value) => setField("recipient_lat", value)}
                        placeholder="16.8661"
                        invalid={!!fieldErrors.recipient_lat}
                      />
                    </div>
                    <div>
                      <Label error={fieldErrors.recipient_lng}>{copyFor(language, "Longitude", "လောင်ဂျီတွဒ်")}</Label>
                      <TextInput
                        value={form.recipient_lng}
                        onChange={(value) => setField("recipient_lng", value)}
                        placeholder="96.1951"
                        invalid={!!fieldErrors.recipient_lng}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <Label>{copyFor(language, "Delivery Time (From)", "ပို့ချိန် (မှ)")}</Label>
                      <TextInput
                        type="time"
                        value={form.delivery_time_from}
                        onChange={(value) => setField("delivery_time_from", value)}
                      />
                    </div>
                    <div>
                      <Label error={fieldErrors.delivery_time_to}>{copyFor(language, "Delivery Time (To)", "ပို့ချိန် (ထိ)")}</Label>
                      <TextInput
                        type="time"
                        value={form.delivery_time_to}
                        onChange={(value) => setField("delivery_time_to", value)}
                        invalid={!!fieldErrors.delivery_time_to}
                      />
                    </div>
                  </div>
                </div>
              </SurfaceCard>
            </div>

            <SurfaceCard>
              <SectionTitle
                icon={<Package2 size={18} />}
                eyebrow="D. Parcel"
                title={copyFor(language, "Shipment details", "ကုန်ပစ္စည်းအချက်အလက်")}
                description={copyFor(
                  language,
                  "Capture item, weight, dimensions, declared value, and handling rules in a way that feels precise and comfortable.",
                  "ပစ္စည်းအမျိုးအမည်၊ အလေးချိန်၊ အတိုင်းအတာ၊ တန်ဖိုးနှင့် ကိုင်တွယ်မှုစည်းကမ်းများကို တိကျစွာ ဖြည့်သွင်းပါ။",
                )}
              />

              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                <div className="md:col-span-2">
                  <Label error={fieldErrors.product_name}>{copyFor(language, "Item Description", "ပစ္စည်းအမည်")}</Label>
                  <TextInput
                    value={form.product_name}
                    onChange={(value) => setField("product_name", value)}
                    placeholder={copyFor(language, "E.g. clothing, cosmetics", "ဥပမာ - အဝတ်အထည်၊ အလှကုန်")}
                    icon={<Boxes size={15} />}
                    invalid={!!fieldErrors.product_name}
                  />
                </div>

                <div>
                  <Label error={fieldErrors.product_category}>{copyFor(language, "Category", "အမျိုးအစား")}</Label>
                  <SelectInput
                    value={form.product_category}
                    onChange={(value) => setField("product_category", value)}
                    invalid={!!fieldErrors.product_category}
                    options={[
                      { value: "General", label: "General" },
                      { value: "Document", label: "Document" },
                      { value: "Electronics", label: "Electronics" },
                      { value: "Fashion", label: "Fashion" },
                      { value: "Food / Perishable", label: "Food / Perishable" },
                      { value: "Healthcare", label: "Healthcare" },
                    ]}
                  />
                </div>

                <div>
                  <Label error={fieldErrors.product_weight}>{copyFor(language, "Actual Weight (kg)", "အမှန်တကယ်အလေးချိန် (kg)")}</Label>
                  <TextInput
                    type="number"
                    value={form.product_weight}
                    onChange={(value) => setField("product_weight", value)}
                    placeholder="0.0"
                    invalid={!!fieldErrors.product_weight}
                  />
                </div>

                <div>
                  <Label error={fieldErrors.product_qty}>{copyFor(language, "Units", "အရေအတွက်")}</Label>
                  <TextInput
                    type="number"
                    value={form.product_qty}
                    onChange={(value) => setField("product_qty", value)}
                    placeholder="1"
                    invalid={!!fieldErrors.product_qty}
                  />
                </div>

                <div>
                  <Label error={fieldErrors.package_count}>{copyFor(language, "Packages / Pieces", "အထုပ်အရေအတွက်")}</Label>
                  <TextInput
                    type="number"
                    value={form.package_count}
                    onChange={(value) => setField("package_count", value)}
                    placeholder="1"
                    invalid={!!fieldErrors.package_count}
                  />
                </div>

                <div>
                  <Label error={fieldErrors.declared_value_mmks}>{copyFor(language, "Declared Value (MMK)", "ပစ္စည်းတန်ဖိုး (MMK)")}</Label>
                  <TextInput
                    type="number"
                    value={form.declared_value_mmks}
                    onChange={(value) => setField("declared_value_mmks", value)}
                    placeholder="0"
                    invalid={!!fieldErrors.declared_value_mmks}
                  />
                </div>
              </div>

              <div className="mt-5 rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#fbfdff_0%,#f7fafc_100%)] p-5 shadow-inner">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                      {copyFor(language, "Dimensions & Weight Logic", "အတိုင်းအတာနှင့် အလေးချိန်တွက်ချက်မှု")}
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                      {copyFor(language, "Volumetric weight is auto-calculated and the higher value becomes chargeable.", "Volumetric weight ကို auto တွက်ချက်ပြီး အများဆုံးတန်ဖိုးကို chargeable weight အဖြစ်ယူသည်။")}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
                  <div>
                    <Label error={fieldErrors.product_length_cm}>{copyFor(language, "Length", "အလျား")}</Label>
                    <TextInput
                      type="number"
                      value={form.product_length_cm}
                      onChange={(value) => setField("product_length_cm", value)}
                      placeholder="L"
                      invalid={!!fieldErrors.product_length_cm}
                    />
                  </div>
                  <div>
                    <Label error={fieldErrors.product_width_cm}>{copyFor(language, "Width", "အနံ")}</Label>
                    <TextInput
                      type="number"
                      value={form.product_width_cm}
                      onChange={(value) => setField("product_width_cm", value)}
                      placeholder="W"
                      invalid={!!fieldErrors.product_width_cm}
                    />
                  </div>
                  <div>
                    <Label error={fieldErrors.product_height_cm}>{copyFor(language, "Height", "အမြင့်")}</Label>
                    <TextInput
                      type="number"
                      value={form.product_height_cm}
                      onChange={(value) => setField("product_height_cm", value)}
                      placeholder="H"
                      invalid={!!fieldErrors.product_height_cm}
                    />
                  </div>

                  <MetricTile
                    label={copyFor(language, "Volumetric", "ထုထည်အလေးချိန်")}
                    value={`${volWeight.toFixed(2)} kg`}
                  />
                  <MetricTile
                    label={copyFor(language, "Chargeable", "တွက်ချက်အလေးချိန်")}
                    value={`${chargeableWeight.toFixed(2)} kg`}
                  />
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                <ToggleRow
                  label={copyFor(language, "Fragile shipment", "ကွဲလွယ်သောပစ္စည်း")}
                  description={copyFor(language, "Mark this shipment for careful handling and rider awareness.", "ဂရုတစိုက်ကိုင်တွယ်ရန်အတွက် shipment ကို မှတ်သားပါ။")}
                  checked={form.fragile}
                  onChange={(next) => setField("fragile", next)}
                />

                <div>
                  <Label>{copyFor(language, "Special Handling", "အထူးကိုင်တွယ်ရန်")}</Label>
                  <TextInput
                    value={form.special_handling}
                    onChange={(value) => setField("special_handling", value)}
                    placeholder={copyFor(language, "Keep upright / cold chain / etc.", "တည့်တည့်ထား / အအေးထိန်း / စသည်")}
                  />
                </div>
              </div>

              <div className="mt-5">
                <Label>{copyFor(language, "Internal Remarks", "အတွင်းရေးမှတ်ချက်")}</Label>
                <TextAreaInput
                  value={form.rider_remark}
                  onChange={(value) => setField("rider_remark", value)}
                  rows={4}
                  placeholder={copyFor(language, "Operations, pickup or delivery notes", "လုပ်ငန်းဆိုင်ရာ မှတ်ချက်များ")}
                />
              </div>
            </SurfaceCard>
          </div>

          <div className="space-y-6 xl:col-span-4 xl:sticky xl:top-6 xl:self-start">
            <DarkSurface>
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/45">
                    E. Billing
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
                    {copyFor(language, "Settlement & collection", "ငွေတောင်းခံမှု နှင့် စာရင်းရှင်းလင်းမှု")}
                  </h2>
                  <p className="mt-2 text-sm font-medium leading-6 text-white/55">
                    {copyFor(language, "Elegant financial controls with instantly readable collection totals.", "ကောက်ခံရမည့်ငွေကို ချက်ချင်းမြင်နိုင်သော enterprise-grade billing controls")}
                  </p>
                </div>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-[#ffd700]">
                  <Banknote size={20} />
                </span>
              </div>

              <div className="mt-5 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label tone="light" error={fieldErrors.payment_term}>{copyFor(language, "Payment Term", "ငွေချေစနစ်")}</Label>
                    <SelectInput
                      value={form.payment_term}
                      onChange={(value) => setField("payment_term", value as FormState["payment_term"])}
                      invalid={!!fieldErrors.payment_term}
                      dark
                      options={[
                        { value: "COD", label: "COD" },
                        { value: "PREPAID", label: "Prepaid" },
                        { value: "ACCOUNT", label: "Account" },
                      ]}
                    />
                  </div>
                  <div>
                    <Label tone="light" error={fieldErrors.payer_type}>{copyFor(language, "Payer", "ပို့ခပေးမည့်သူ")}</Label>
                    <SelectInput
                      value={form.payer_type}
                      onChange={(value) => setField("payer_type", value as FormState["payer_type"])}
                      invalid={!!fieldErrors.payer_type}
                      dark
                      options={[
                        { value: "recipient", label: "Recipient" },
                        { value: "sender", label: "Sender" },
                        { value: "merchant", label: "Merchant" },
                        { value: "account", label: "Account" },
                      ]}
                    />
                  </div>
                </div>

                <div className="space-y-4 rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                  <div>
                    <Label tone="light" error={fieldErrors.delivery_fee_mmks}>{copyFor(language, "Delivery Fee", "ပို့ဆောင်ခ")}</Label>
                    <TextInput
                      type="number"
                      value={form.delivery_fee_mmks}
                      onChange={(value) => setField("delivery_fee_mmks", value)}
                      placeholder="0"
                      invalid={!!fieldErrors.delivery_fee_mmks}
                      dark
                    />
                  </div>

                  <div>
                    <Label tone="light" error={fieldErrors.extra_weight_charges}>{copyFor(language, "Weight Surcharge", "အလေးချိန်ပိုကြေး")}</Label>
                    <TextInput
                      type="number"
                      value={form.extra_weight_charges}
                      onChange={(value) => setField("extra_weight_charges", value)}
                      placeholder="0"
                      invalid={!!fieldErrors.extra_weight_charges}
                      dark
                    />
                  </div>

                  <div>
                    <Label tone="light" error={fieldErrors.insurance_fee_mmks}>{copyFor(language, "Insurance", "အာမခံ")}</Label>
                    <TextInput
                      type="number"
                      value={form.insurance_fee_mmks}
                      onChange={(value) => setField("insurance_fee_mmks", value)}
                      placeholder="0"
                      invalid={!!fieldErrors.insurance_fee_mmks}
                      dark
                    />
                  </div>

                  <div>
                    <Label tone="light" error={fieldErrors.discount_mmks}>{copyFor(language, "Discount", "လျှော့ပေးငွေ")}</Label>
                    <TextInput
                      type="number"
                      value={form.discount_mmks}
                      onChange={(value) => setField("discount_mmks", value)}
                      placeholder="0"
                      invalid={!!fieldErrors.discount_mmks}
                      dark
                    />
                  </div>

                  <div>
                    <Label tone="light" error={fieldErrors.cod_amount_mmks}>{copyFor(language, "COD Amount", "COD ငွေပမာဏ")}</Label>
                    <TextInput
                      type="number"
                      value={form.cod_amount_mmks}
                      onChange={(value) => setField("cod_amount_mmks", value)}
                      placeholder="0"
                      invalid={!!fieldErrors.cod_amount_mmks}
                      dark
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <MetricTile label={copyFor(language, "Charge Subtotal", "စုစုပေါင်းပို့ခ")} value={`${formatMoney(chargeSubtotal, currencyLocale)} Ks`} tone="gold" />
                  <MetricTile label={copyFor(language, "Total to Collect", "စုစုပေါင်းကောက်ခံရန်")} value={`${formatMoney(totalToCollect, currencyLocale)} Ks`} tone="gold" />
                </div>
              </div>
            </DarkSurface>

            <SurfaceCard>
              <SectionTitle
                icon={<ShieldCheck size={18} />}
                eyebrow="F. Dispatch"
                title={copyFor(language, "Proof & dispatch controls", "ပို့ဆောင်မှုထိန်းချုပ်မှု")}
                description={copyFor(
                  language,
                  "Set delivery proof, fallback behavior, and execution settings in one elegant control surface.",
                  "ပို့ဆောင်ပြီးကြောင်း သက်သေ၊ ပြန်လည်လုပ်ဆောင်ရမည့်လုပ်ငန်းစဉ်နှင့် execution settings များကို တစ်နေရာတည်းတွင် သတ်မှတ်ပါ။",
                )}
              />

              <div className="space-y-5">
                <div>
                  <Label error={fieldErrors.pod_type}>{copyFor(language, "Proof of Delivery", "ပို့ဆောင်ပြီးကြောင်း သက်သေ")}</Label>
                  <SelectInput
                    value={form.pod_type}
                    onChange={(value) => setField("pod_type", value as FormState["pod_type"])}
                    invalid={!!fieldErrors.pod_type}
                    options={[
                      { value: "signature", label: "Signature Required" },
                      { value: "photo", label: "Photo Proof" },
                      { value: "pin", label: "OTP / PIN" },
                      { value: "barcode", label: "Barcode Scan" },
                      { value: "id_check", label: "ID Check" },
                      { value: "none", label: "No Proof" },
                    ]}
                  />
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <Label error={fieldErrors.preferred_vehicle}>{copyFor(language, "Vehicle", "ယာဉ်အမျိုးအစား")}</Label>
                    <SelectInput
                      value={form.preferred_vehicle}
                      onChange={(value) => setField("preferred_vehicle", value as FormState["preferred_vehicle"])}
                      invalid={!!fieldErrors.preferred_vehicle}
                      options={[
                        { value: "bike", label: "Motorbike" },
                        { value: "car", label: "Car" },
                        { value: "van", label: "Van" },
                        ...(deliveryMode === "office_to_office"
                          ? [{ value: "office_transfer", label: "Office Transfer" }]
                          : []),
                      ]}
                    />
                  </div>
                  <div>
                    <Label error={fieldErrors.dispatch_mode}>{copyFor(language, "Dispatch", "ချထားပေးမှု")}</Label>
                    <SelectInput
                      value={form.dispatch_mode}
                      onChange={(value) => setField("dispatch_mode", value as FormState["dispatch_mode"])}
                      invalid={!!fieldErrors.dispatch_mode}
                      options={[
                        { value: "auto", label: "Auto-Assign" },
                        { value: "manual", label: "Manual Select" },
                      ]}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <ToggleRow
                    label={copyFor(language, "Contactless drop-off", "လူမတွေ့ဘဲ ချထားနိုင်သည်")}
                    description={copyFor(language, "Allow handoff without face-to-face interaction when appropriate.", "လိုအပ်သည့်အခါ လူမတွေ့ဘဲ ပို့ဆောင်ခွင့်ပြုပါ။")}
                    checked={form.contactless_ok}
                    onChange={(next) => setField("contactless_ok", next)}
                  />
                  <ToggleRow
                    label={copyFor(language, "Return if delivery fails", "မအောင်မြင်လျှင် ပြန်ပို့မည်")}
                    description={copyFor(language, "Automatically instruct the rider to return the shipment when delivery cannot be completed.", "ပို့ဆောင်မှုမအောင်မြင်ပါက rider ကို ပြန်ပို့ရန်ညွှန်ကြားပါ။")}
                    checked={form.return_if_failed}
                    onChange={(next) => setField("return_if_failed", next)}
                  />
                  <ToggleRow
                    label={copyFor(language, "Send tracking SMS", "Tracking SMS ပို့မည်")}
                    description={copyFor(language, "Notify recipient and sender with tracking updates.", "ပို့ဆောင်မှုအခြေအနေကို sender နှင့် recipient ထံသို့ SMS ဖြင့်ပို့ပါ။")}
                    checked={form.send_tracking_sms}
                    onChange={(next) => setField("send_tracking_sms", next)}
                  />
                  <ToggleRow
                    label={copyFor(language, "Print label after save", "သိမ်းပြီး Label ထုတ်မည်")}
                    description={copyFor(language, "Open print flow immediately after a successful create action.", "Create လုပ်ပြီးနောက် print flow ကို ချက်ချင်းဖွင့်ပါ။")}
                    checked={form.print_label_after_create}
                    onChange={(next) => setField("print_label_after_create", next)}
                  />
                </div>
              </div>
            </SurfaceCard>

            <SurfaceCard className="border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.9)_0%,rgba(248,250,252,0.95)_100%)]">
              <div className="flex items-start justify-between gap-3 border-b border-slate-200/80 pb-5">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
                    Review
                  </p>
                  <h3 className="mt-2 text-xl font-black text-[#0d2c54]">
                    {copyFor(language, "Ready to save", "သိမ်းဆည်းရန်အဆင်သင့်")}
                  </h3>
                  <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                    {copyFor(language, "Final actions with tactile motion, premium affordance, and clear visual priority.", "Smooth motion နှင့် premium interaction အတွေ့အကြုံဖြင့် နောက်ဆုံးလုပ်ဆောင်ချက်များကို ပြသထားသည်။")}
                  </p>
                </div>
                <span className="rounded-2xl border border-slate-200 bg-white p-3 text-[#0d2c54] shadow-sm">
                  <WalletCards size={18} />
                </span>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <MotionButton disabled={loading} onClick={() => handleAction("draft")} tone="secondary">
                  <Save size={16} />
                  {loadingAction === "draft" ? "Saving..." : copyFor(language, "Save draft", "Draft သိမ်းမည်")}
                </MotionButton>

                <MotionButton
                  disabled={loading}
                  onClick={() => handleAction(form.print_label_after_create ? "print" : "submit")}
                  tone="primary"
                >
                  {form.print_label_after_create ? <Printer size={16} /> : <Truck size={16} />}
                  {loadingAction === "print"
                    ? copyFor(language, "Creating...", "ဖန်တီးနေသည်...")
                    : loadingAction === "submit"
                      ? copyFor(language, "Creating...", "ဖန်တီးနေသည်...")
                      : form.print_label_after_create
                        ? copyFor(language, "Create & print", "ဖန်တီးပြီး ထုတ်မည်")
                        : copyFor(language, "Create order", "Order ဖန်တီးမည်")}
                </MotionButton>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <AlertCircle size={18} className="mt-0.5 text-slate-400" />
                  <div>
                    <p className="text-sm font-bold text-[#0d2c54]">
                      {copyFor(language, "Operator guidance", "အသုံးပြုသူညွှန်ကြားချက်")}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      {copyFor(language, "Use draft save for incomplete data. Production create requires sender, recipient, address, phone, parcel, billing, and dispatch rules to be valid.", "အချက်အလက်မပြည့်စုံသေးပါက draft သိမ်းဆည်းပါ။ Production create အတွက် sender၊ recipient၊ address၊ phone၊ parcel၊ billing နှင့် dispatch rules များ မှန်ကန်ရမည်။")}
                    </p>
                  </div>
                </div>
              </div>
            </SurfaceCard>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
