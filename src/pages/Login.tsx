import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase/client";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Download,
  Globe,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  UserPlus,
} from "lucide-react";

type View =
  | "login"
  | "forgot"
  | "request"
  | "force_change"
  | "mfa"
  | "magic"
  | "otp_verify";

type Language = "en" | "my";

const MFA_REQUIRED_ROLES = new Set([
  "SYS",
  "APP_OWNER",
  "SUPER_ADMIN",
  "SUPER_A",
  "ADM",
  "MGR",
  "ADMIN",
]);

const SUPABASE_CONFIGURED = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
);

function getRememberMe() {
  return localStorage.getItem("britium.remember") === "true";
}

function setRememberMe(value: boolean) {
  localStorage.setItem("britium.remember", value ? "true" : "false");
}

function getRememberedEmail() {
  return localStorage.getItem("britium.remember.email") || "";
}

function setRememberedEmail(value: string) {
  if (value.trim()) {
    localStorage.setItem("britium.remember.email", value.trim());
  } else {
    localStorage.removeItem("britium.remember.email");
  }
}

function normalizeRole(value?: string | null) {
  return (value ?? "GUEST").trim().replace(/[\s-]+/g, "_").toUpperCase();
}

function defaultPortalForRole(role?: string | null) {
  const r = normalizeRole(role);

  if (["CUSTOMER_SERVICE", "CS"].includes(r)) return "/customer-service";
  if (["CUSTOMER"].includes(r)) return "/customer";
  if (["SUPERVISOR", "SUPERVISOR_HUB"].includes(r)) return "/supervisor";
  if (["DATA_ENTRY"].includes(r)) return "/data-entry";
  if (["MERCHANT", "MERCHANT_ADMIN", "MERCHANT_OWNER", "MERCHANT_MANAGER"].includes(r)) {
    return "/merchants";
  }

  return "/";
}

async function loadProfile(userId: string) {
  const trySelect = async (sel: string) =>
    supabase.from("profiles").select(sel).eq("id", userId).maybeSingle();

  let { data, error } = await trySelect(
    "id, role, role_code, app_role, user_role, must_change_password, requires_password_change"
  );

  if (error && (error as any).code === "42703") {
    ({ data, error } = await trySelect("id, role, must_change_password"));
  }

  if (error) {
    return { role: "GUEST", mustChange: false };
  }

  const row: any = data || {};
  const rawRole =
    row.role ?? row.app_role ?? row.user_role ?? row.role_code ?? "GUEST";
  const mustChange =
    Boolean(row.must_change_password) || Boolean(row.requires_password_change);

  return {
    role: normalizeRole(rawRole),
    mustChange,
  };
}

async function hasAal2() {
  try {
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error) return false;
    return data?.currentLevel === "aal2";
  } catch {
    return false;
  }
}

export default function Login() {
  const nav = useNavigate();
  const loc = useLocation() as any;

  const [language, setLanguage] = useState<Language>("en");
  const t = (en: string, my: string) => (language === "en" ? en : my);

  const [view, setView] = useState<View>("login");
  const [loading, setLoading] = useState(false);
  const [configMissing, setConfigMissing] = useState(false);

  const [email, setEmail] = useState(getRememberedEmail());
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState<boolean>(getRememberMe());

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [otpToken, setOtpToken] = useState("");
  const [otpHint, setOtpHint] = useState("");

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [targetPath, setTargetPath] = useState<string>("/");

  const [mfaStage, setMfaStage] = useState<"idle" | "enroll" | "verify">("idle");
  const [mfaFactorId, setMfaFactorId] = useState("");
  const [mfaChallengeId, setMfaChallengeId] = useState("");
  const [mfaQrSvg, setMfaQrSvg] = useState("");
  const [mfaSecret, setMfaSecret] = useState("");

  const [videoFailed, setVideoFailed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  const brand = useMemo(
    () => ({
      title: "BRITIUM",
      subtitleEn: "Welcome to Britium Portal",
      subtitleMy: "Britium Portal သို့ ကြိုဆိုပါသည်",
    }),
    []
  );

  const pageTitle = useMemo(() => {
    if (view === "forgot") return t("Secure Password Recovery", "စကားဝှက် ပြန်လည်ရယူခြင်း");
    if (view === "request") return t("Request Access", "ဝင်ရောက်ခွင့် တောင်းမည်");
    if (view === "force_change") return t("Security Update Required", "လုံခြုံရေး အပ်ဒိတ် လိုအပ်");
    if (view === "mfa") return t("Multi-Factor Verification", "အဆင့်မြင့် အတည်ပြုခြင်း (MFA)");
    return t("Sign in", "အကောင့်ဝင်မည်");
  }, [view, language]);

  const wizardViews: View[] = ["login", "magic", "forgot", "request"];
  const wizardIndex = wizardViews.indexOf(view);
  const showWizardNav = wizardIndex >= 1;
  const prevTarget: View = wizardIndex > 0 ? wizardViews[wizardIndex - 1] : "login";
  const nextTarget: View =
    wizardIndex >= 0 && wizardIndex < wizardViews.length - 1
      ? wizardViews[wizardIndex + 1]
      : view;

  function clearMessages() {
    setErrorMsg("");
    setSuccessMsg("");
  }

  function toggleLanguage() {
    setLanguage((prev) => (prev === "en" ? "my" : "en"));
  }

  async function goAfterAuth(role?: string) {
    const from = loc?.state?.from?.pathname;
    const dst =
      typeof from === "string" && from.startsWith("/")
        ? from
        : defaultPortalForRole(role);

    setTargetPath(dst);
    nav(dst, { replace: true });
  }

  async function prepareMfa() {
    setMfaStage("idle");
    setOtpToken("");
    setMfaQrSvg("");
    setMfaSecret("");
    setMfaFactorId("");
    setMfaChallengeId("");

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;

      const totpFactors = (data?.totp || data?.all || []) as any[];
      const verified =
        totpFactors.find((f) => (f?.status || "").toLowerCase() === "verified") ||
        totpFactors[0];

      if (verified?.id) {
        const { data: challenge, error: challengeError } =
          await supabase.auth.mfa.challenge({
            factorId: verified.id,
          });

        if (challengeError) throw challengeError;

        setMfaFactorId(verified.id);
        setMfaChallengeId(challenge?.id || "");
        setMfaStage("verify");
        setSuccessMsg(
          t(
            "Enter your 6-digit authenticator code.",
            "Authenticator code (၆ လုံး) ကို ထည့်ပါ။"
          )
        );
        return;
      }

      const { data: enroll, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
      });

      if (enrollError) throw enrollError;

      setMfaFactorId(enroll?.id || "");
      setMfaQrSvg(enroll?.totp?.qr_code || "");
      setMfaSecret(enroll?.totp?.secret || "");

      const { data: challenge2, error: challenge2Error } =
        await supabase.auth.mfa.challenge({
          factorId: enroll.id,
        });

      if (challenge2Error) throw challenge2Error;

      setMfaChallengeId(challenge2?.id || "");
      setMfaStage("enroll");
      setSuccessMsg(
        t(
          "Scan the QR code with your authenticator app, then enter the code.",
          "Authenticator နဲ့ QR စကန်ပြီး code ထည့်ပါ။"
        )
      );
    } catch (e: any) {
      setErrorMsg(e?.message || t("MFA setup failed.", "MFA စတင်မရပါ။"));
      setMfaStage("idle");
    } finally {
      setLoading(false);
    }
  }

  async function ensureMfa(role?: string) {
    const normalized = normalizeRole(role);
    if (!MFA_REQUIRED_ROLES.has(normalized)) return true;

    const ok = await hasAal2();
    if (ok) return true;

    setView("mfa");
    await prepareMfa();
    return false;
  }

  async function verifyMfa(e: React.FormEvent) {
    e.preventDefault();
    clearMessages();

    if (!otpToken || otpToken.trim().length < 6) {
      setErrorMsg(t("Enter the 6-digit code.", "Code ၆ လုံး ထည့်ပါ။"));
      return;
    }

    setLoading(true);
    try {
      const code = otpToken.trim().replace(/\s+/g, "");

      const { error } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: mfaChallengeId,
        code,
      });

      if (error) throw error;

      const ok = await hasAal2();
      if (!ok) throw new Error("MFA verification incomplete.");

      setSuccessMsg(t("MFA verified. Redirecting…", "MFA အောင်မြင်ပါပြီ။ ဆက်သွားနေသည်…"));
      setTimeout(() => nav(targetPath || "/", { replace: true }), 400);
    } catch (e: any) {
      setErrorMsg(e?.message || t("Invalid code.", "Code မမှန်ပါ။"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setConfigMissing(!SUPABASE_CONFIGURED);

    if (!SUPABASE_CONFIGURED) return;

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const userId = data?.session?.user?.id;
        if (!userId) return;

        const profile = await loadProfile(userId);
        const from = loc?.state?.from?.pathname;
        const dst =
          typeof from === "string" && from.startsWith("/")
            ? from
            : defaultPortalForRole(profile.role);

        setTargetPath(dst);

        if (profile.mustChange) {
          setView("force_change");
          return;
        }

        const needMfa = MFA_REQUIRED_ROLES.has(normalizeRole(profile.role));
        if (needMfa) {
          const ok = await hasAal2();
          if (!ok) {
            setView("mfa");
            await prepareMfa();
            return;
          }
        }

        nav(dst, { replace: true });
      } catch {
      }
    })();
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    clearMessages();

    if (!SUPABASE_CONFIGURED) {
      setConfigMissing(true);
      setErrorMsg(t("System configuration is missing.", "System config မပြည့်စုံပါ။"));
      return;
    }

    setLoading(true);
    try {
      setRememberMe(remember);
      if (remember) {
        setRememberedEmail(email);
      } else {
        setRememberedEmail("");
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const profile = await loadProfile(data.user.id);
      const dst = defaultPortalForRole(profile.role);
      setTargetPath(dst);

      const isDefault =
        password === "P@ssw0rd1" || password.startsWith("Britium@");

      if (profile.mustChange || isDefault) {
        setView("force_change");
        return;
      }

      const passed = await ensureMfa(profile.role);
      if (!passed) return;

      await goAfterAuth(profile.role);
    } catch {
      setErrorMsg(
        t(
          "Access Denied: Invalid credentials.",
          "ဝင်ရောက်ခွင့် ငြင်းပယ်ခံရသည်: အချက်အလက်မှားနေသည်။"
        )
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicSend(e: React.FormEvent) {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    try {
      const emailRedirectTo = `${window.location.origin}/login`;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo },
      });

      if (error) throw error;

      setSuccessMsg(
        t("Secure link sent. Check your email.", "လုံခြုံသော link ပို့ပြီးပါပြီ။ Email စစ်ပါ။")
      );
      setOtpHint(
        t(
          "If your email contains a 6-digit code, enter it below.",
          "Email ထဲတွင် ကုဒ် ၆ လုံးပါပါက အောက်တွင်ထည့်ပါ။"
        )
      );
      setView("otp_verify");
    } catch (e: any) {
      setErrorMsg(e?.message || t("Failed to send link.", "Link ပို့မရပါ။"));
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpVerify(e: React.FormEvent) {
    e.preventDefault();
    clearMessages();

    if (!otpToken.trim()) {
      setErrorMsg(
        t("Enter the code to continue.", "ဆက်လက်လုပ်ဆောင်ရန် ကုဒ်ထည့်ပါ။")
      );
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otpToken.trim(),
        type: "email",
      });

      if (error) throw error;

      const { data } = await supabase.auth.getSession();
      if (!data?.session?.user?.id) throw new Error("No session.");

      const profile = await loadProfile(data.session.user.id);
      const passed = await ensureMfa(profile.role);
      if (!passed) return;

      await goAfterAuth(profile.role);
    } catch (e: any) {
      setErrorMsg(e?.message || t("OTP invalid.", "OTP ကုဒ် မှားယွင်းနေသည်။"));
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    clearMessages();

    if (!SUPABASE_CONFIGURED) {
      setConfigMissing(true);
      setErrorMsg(t("System config missing.", "System config မပြည့်စုံပါ။"));
      return;
    }

    setLoading(true);
    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) throw error;

      setSuccessMsg(
        t(
          "Recovery link sent. Please check your email.",
          "Recovery link ကို ပို့ပြီးပါပြီ။ အီးမေးလ်ကို စစ်ပါ။"
        )
      );
    } catch (e: any) {
      setErrorMsg(
        e?.message ||
          t("Unable to send recovery email.", "Recovery email ပို့မရပါ။")
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestAccess(e: React.FormEvent) {
    e.preventDefault();
    clearMessages();

    if (!SUPABASE_CONFIGURED) {
      setConfigMissing(true);
      setErrorMsg(t("System config missing.", "System config မပြည့်စုံပါ။"));
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      setSuccessMsg(
        t(
          "Request submitted. Please verify your email if prompted.",
          "Request တင်ပြီးပါပြီ။ လိုအပ်ပါက အီးမေးလ်အတည်ပြုပါ။"
        )
      );

      setTimeout(() => setView("login"), 900);
    } catch (e: any) {
      setErrorMsg(e?.message || t("Request failed.", "Request မအောင်မြင်ပါ။"));
    } finally {
      setLoading(false);
    }
  }

  async function handleForceChange(e: React.FormEvent) {
    e.preventDefault();
    clearMessages();

    if (newPassword !== confirmPassword) {
      setErrorMsg(t("Passwords do not match.", "စကားဝှက်များ မကိုက်ညီပါ။"));
      return;
    }

    if (newPassword.length < 8) {
      setErrorMsg(
        t(
          "Password must be at least 8 characters.",
          "စကားဝှက်သည် အနည်းဆုံး ၈ လုံး ဖြစ်ရမည်။"
        )
      );
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      try {
        await supabase
          .from("profiles")
          .update({
            must_change_password: false,
            requires_password_change: false,
          })
          .eq("id", data.user.id);
      } catch {
      }

      const profile = await loadProfile(data.user.id);
      const passed = await ensureMfa(profile.role);
      if (!passed) return;

      setSuccessMsg(
        t(
          "Password updated. Redirecting…",
          "စကားဝှက် ပြောင်းပြီးပါပြီ။ ဆက်သွားနေသည်…"
        )
      );
      setTimeout(() => goAfterAuth(profile.role), 450);
    } catch (e: any) {
      setErrorMsg(
        e?.message ||
          t("Password update failed.", "စကားဝှက်ပြောင်းမရပါ။")
      );
    } finally {
      setLoading(false);
    }
  }

  const canPrev = showWizardNav && !loading;
  const canNext = showWizardNav && wizardIndex < wizardViews.length - 1 && !loading;

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#05080F] p-4 text-slate-100">
      {!videoFailed ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          onError={() => setVideoFailed(true)}
          className="absolute inset-0 h-full w-full object-cover opacity-20 pointer-events-none grayscale"
        >
          <source src="/background.mp4" type="video/mp4" />
        </video>
      ) : null}

      <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_20%,rgba(16,185,129,0.16),transparent_60%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,8,15,0.65),rgba(5,8,15,0.95))]" />

      <div className="absolute top-6 right-6 z-20">
        <button
          type="button"
          onClick={toggleLanguage}
          className="inline-flex items-center rounded-full border border-white/10 bg-black/40 px-4 py-2 text-slate-200 hover:bg-white/5"
        >
          <Globe className="mr-2 h-4 w-4" />
          <span className="text-xs font-black tracking-widest uppercase">
            {language === "en" ? "MY" : "EN"}
          </span>
        </button>
      </div>

      <div className="relative z-10 w-full max-w-md space-y-6 py-12">
        <div className="text-center space-y-2">
          <div className="mx-auto grid h-28 w-28 place-items-center overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-2xl">
            {!logoFailed ? (
              <img
                src="/logo.png"
                alt="Britium"
                className="h-20 w-20 object-contain"
                onError={() => setLogoFailed(true)}
              />
            ) : (
              <div className="grid h-20 w-20 place-items-center rounded-2xl bg-emerald-500/10 text-3xl font-black text-emerald-300">
                B
              </div>
            )}
          </div>

          <h1 className="text-4xl font-black tracking-tight text-white">
            {brand.title}
          </h1>
          <p className="text-sm text-slate-300">
            {t(brand.subtitleEn, brand.subtitleMy)}
          </p>
        </div>

        {configMissing ? (
          <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0B101B]/85 shadow-2xl backdrop-blur-xl">
            <div className="p-6">
              <div className="flex items-center gap-2 text-rose-400">
                <AlertCircle className="h-5 w-5" />
                <h2 className="font-bold">
                  {t("System Configuration Required", "System Config လိုအပ်သည်")}
                </h2>
              </div>
              <div className="mt-4 text-sm text-slate-300">
                {t(
                  "Supabase environment variables are missing.",
                  "Supabase env var မရှိသေးပါ။"
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#0B101B]/85 shadow-2xl backdrop-blur-xl">
              <div className="h-1.5 w-full bg-gradient-to-r from-emerald-600 to-teal-400" />
              <div className="space-y-5 p-7 md:p-8">
                {errorMsg ? (
                  <div className="flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-rose-300">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                    <p className="text-xs font-bold leading-relaxed">{errorMsg}</p>
                  </div>
                ) : null}

                {successMsg ? (
                  <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-300">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                    <p className="text-xs font-bold leading-relaxed">{successMsg}</p>
                  </div>
                ) : null}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-emerald-400" />
                    <div className="text-sm font-extrabold uppercase tracking-widest">
                      {pageTitle}
                    </div>
                  </div>
                </div>

                {(view === "login" || view === "magic" || view === "otp_verify") ? (
                  <div className="flex gap-2 rounded-2xl border border-white/5 bg-black/40 p-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        clearMessages();
                        setView("login");
                      }}
                      className={`flex-1 rounded-xl px-4 py-2 text-sm font-bold ${
                        view === "login"
                          ? "bg-emerald-600 text-white shadow-lg"
                          : "text-slate-400"
                      }`}
                    >
                      {t("Password", "စကားဝှက်")}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        clearMessages();
                        setView("magic");
                      }}
                      className={`flex-1 rounded-xl px-4 py-2 text-sm font-bold ${
                        view !== "login"
                          ? "bg-[#D4AF37] text-black shadow-lg"
                          : "text-slate-400"
                      }`}
                    >
                      {t("Email Link", "အီးမေးလ်")}
                    </button>
                  </div>
                ) : null}

                {view === "login" ? (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="relative">
                      <Mail className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
                      <input
                        type="email"
                        required
                        autoComplete="username"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-12 w-full rounded-xl border border-white/10 bg-black/40 pl-12 pr-4 text-white outline-none focus:border-emerald-500/40"
                        placeholder={t("Corporate Email", "အီးမေးလ်")}
                      />
                    </div>

                    <div className="relative">
                      <Lock className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
                      <input
                        type="password"
                        required
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-12 w-full rounded-xl border border-white/10 bg-black/40 pl-12 pr-4 text-white outline-none focus:border-emerald-500/40"
                        placeholder={t("Password", "စကားဝှက်")}
                      />
                    </div>

                    <div className="flex items-center justify-between px-1">
                      <label className="flex cursor-pointer items-center gap-2 text-[11px] font-bold text-slate-300">
                        <input
                          type="checkbox"
                          checked={remember}
                          onChange={(e) => setRemember(e.target.checked)}
                          className="h-4 w-4 accent-emerald-500"
                        />
                        {t("Remember me", "မှတ်ထားမည်")}
                      </label>

                      <div className="flex items-center gap-4 text-[11px] font-black">
                        <button
                          type="button"
                          onClick={() => {
                            clearMessages();
                            setView("forgot");
                          }}
                          className="uppercase tracking-widest text-slate-400 hover:text-emerald-300"
                        >
                          {t("Forgot?", "စကားဝှက်မေ့သွားလား")}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            clearMessages();
                            setView("request");
                          }}
                          className="flex items-center gap-1 uppercase tracking-widest text-[#D4AF37] hover:text-[#b5952f]"
                        >
                          <UserPlus className="h-3 w-3" />
                          {t("Sign Up", "အကောင့်လုပ်မည်")}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="mt-2 flex h-12 w-full items-center justify-center rounded-xl bg-emerald-600 font-black uppercase tracking-widest text-white hover:bg-emerald-500 disabled:opacity-70"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {t("Authenticating…", "စစ်ဆေးနေသည်…")}
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          {t("Login", "အကောင့်ဝင်မည်")}
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      )}
                    </button>
                  </form>
                ) : null}

                {view === "magic" ? (
                  <form onSubmit={handleMagicSend} className="space-y-5">
                    <div className="px-2 text-[11px] italic leading-relaxed text-slate-400">
                      {t(
                        "System will dispatch a one-time secure link to your work inbox.",
                        "စနစ်မှ တစ်ခါသုံး လုံခြုံရေး link ကို သင့်အီးမေးလ်သို့ ပို့ပေးပါမည်။"
                      )}
                    </div>

                    <div className="relative">
                      <Mail className="absolute left-4 top-4 h-5 w-5 text-slate-500" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-14 w-full rounded-2xl border border-white/10 bg-black/40 pl-12 pr-4 text-white outline-none"
                        placeholder={t("Corporate Email", "အီးမေးလ်")}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="flex h-14 w-full items-center justify-center rounded-2xl bg-[#D4AF37] font-black uppercase tracking-widest text-black shadow-xl transition-all hover:bg-[#b5952f] disabled:opacity-70"
                    >
                      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : t("Send Link", "Link ပို့မည်")}
                    </button>
                  </form>
                ) : null}

                {view === "otp_verify" ? (
                  <form onSubmit={handleOtpVerify} className="space-y-5">
                    <div className="px-2 text-xs font-bold text-emerald-400">
                      {otpHint}
                    </div>

                    <div className="relative">
                      <ShieldCheck className="absolute left-4 top-4 h-5 w-5 text-slate-500" />
                      <input
                        required
                        value={otpToken}
                        onChange={(e) => setOtpToken(e.target.value)}
                        maxLength={6}
                        className="h-14 w-full rounded-2xl border border-white/10 bg-black/40 pl-12 pr-4 text-center font-mono tracking-[0.5em] text-white outline-none"
                        placeholder="000000"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="flex h-14 w-full items-center justify-center rounded-2xl bg-emerald-600 font-black uppercase tracking-widest text-white hover:bg-emerald-500 disabled:opacity-70"
                    >
                      {loading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        t("Verify & Login", "အတည်ပြုပြီး ဝင်မည်")
                      )}
                    </button>
                  </form>
                ) : null}

                {view === "forgot" ? (
                  <form onSubmit={handleForgot} className="space-y-4">
                    <div className="text-sm text-slate-300">
                      {t(
                        "Enter your email to receive a secure recovery link.",
                        "Recovery link ရယူရန် အီးမေးလ်ထည့်ပါ။"
                      )}
                    </div>

                    <div className="relative">
                      <Mail className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-12 w-full rounded-xl border border-white/10 bg-black/40 pl-12 pr-4 text-white outline-none"
                        placeholder={t("Corporate Email", "အီးမေးလ်")}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="flex h-12 w-full items-center justify-center rounded-xl bg-slate-700 font-black uppercase tracking-widest text-white hover:bg-slate-600 disabled:opacity-70"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {t("Sending…", "ပို့နေသည်…")}
                        </span>
                      ) : (
                        t("Send Recovery Link", "Recovery Link ပို့မည်")
                      )}
                    </button>
                  </form>
                ) : null}

                {view === "request" ? (
                  <form onSubmit={handleRequestAccess} className="space-y-4">
                    <div className="text-sm text-slate-300">
                      {t(
                        "This platform is for authorized personnel. Submit a request to create an account.",
                        "ဤစနစ်သည် ခွင့်ပြုထားသူများအတွက် ဖြစ်သည်။ အကောင့်ဖန်တီးရန် request တင်ပါ။"
                      )}
                    </div>

                    <div className="relative">
                      <Mail className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-12 w-full rounded-xl border border-white/10 bg-black/40 pl-12 pr-4 text-white outline-none"
                        placeholder={t("Work Email", "အလုပ်အီးမေးလ်")}
                      />
                    </div>

                    <div className="relative">
                      <Lock className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-12 w-full rounded-xl border border-white/10 bg-black/40 pl-12 pr-4 text-white outline-none"
                        placeholder={t("New Password", "စကားဝှက်အသစ်")}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="flex h-12 w-full items-center justify-center rounded-xl bg-[#D4AF37] font-black uppercase tracking-widest text-black hover:bg-[#b5952f] disabled:opacity-70"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {t("Submitting…", "တင်နေသည်…")}
                        </span>
                      ) : (
                        t("Submit Request", "Request တင်မည်")
                      )}
                    </button>
                  </form>
                ) : null}

                {view === "force_change" ? (
                  <form onSubmit={handleForceChange} className="space-y-4">
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
                      {t(
                        "A password update is required before access is granted.",
                        "ဝင်ရောက်ခွင့်မပြုမီ စကားဝှက်အသစ်ပြောင်းရန် လိုအပ်ပါသည်။"
                      )}
                    </div>

                    <div className="relative">
                      <Lock className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="h-12 w-full rounded-xl border border-amber-500/30 bg-black/40 pl-12 pr-4 text-white outline-none"
                        placeholder={t("New Password", "စကားဝှက်အသစ်")}
                      />
                    </div>

                    <div className="relative">
                      <CheckCircle2 className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-12 w-full rounded-xl border border-amber-500/30 bg-black/40 pl-12 pr-4 text-white outline-none"
                        placeholder={t("Confirm Password", "စကားဝှက် အတည်ပြုပါ")}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="flex h-12 w-full items-center justify-center rounded-xl bg-amber-600 font-black uppercase tracking-widest text-white hover:bg-amber-500 disabled:opacity-70"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {t("Updating…", "ပြောင်းနေသည်…")}
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          {t("Update & Continue", "ပြောင်းပြီး ဆက်သွားမည်")}
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      )}
                    </button>
                  </form>
                ) : null}

                {view === "mfa" ? (
                  <form onSubmit={verifyMfa} className="space-y-4">
                    {mfaStage === "enroll" && mfaQrSvg ? (
                      <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                        <div className="mb-3 text-sm font-bold text-white">
                          {t("Scan QR Code", "QR Code စကန်ပါ")}
                        </div>
                        <div
                          className="mx-auto flex justify-center rounded-xl bg-white p-3"
                          dangerouslySetInnerHTML={{ __html: mfaQrSvg }}
                        />
                        {mfaSecret ? (
                          <div className="mt-3 break-all text-xs text-slate-300">
                            {t("Secret", "Secret")}: {mfaSecret}
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="relative">
                      <ShieldCheck className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
                      <input
                        required
                        value={otpToken}
                        onChange={(e) => setOtpToken(e.target.value)}
                        maxLength={6}
                        className="h-12 w-full rounded-xl border border-white/10 bg-black/40 pl-12 pr-4 text-white outline-none"
                        placeholder={t("6-digit code", "၆ လုံးကုဒ်")}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="flex h-12 w-full items-center justify-center rounded-xl bg-emerald-600 font-black uppercase tracking-widest text-white hover:bg-emerald-500 disabled:opacity-70"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        t("Verify MFA", "MFA အတည်ပြုမည်")
                      )}
                    </button>
                  </form>
                ) : null}

                {showWizardNav ? (
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      disabled={!canPrev}
                      onClick={() => {
                        clearMessages();
                        setView(prevTarget);
                      }}
                      className="inline-flex h-11 items-center rounded-xl px-4 text-slate-300 hover:text-white disabled:opacity-40"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      {t("Previous", "နောက်ပြန်")}
                    </button>

                    <button
                      type="button"
                      disabled={!canNext}
                      onClick={() => {
                        if (!canNext) return;
                        clearMessages();
                        setView(nextTarget);
                      }}
                      className="inline-flex h-11 items-center rounded-xl bg-white/5 px-4 font-black uppercase tracking-widest text-white hover:bg-white/10 disabled:opacity-40"
                    >
                      {t("Next", "ရှေ့သို့")}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </button>
                  </div>
                ) : null}

                <div className="h-px bg-white/10" />

                <a
                  href="/android.apk"
                  download="android.apk"
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 text-[11px] font-black uppercase tracking-widest text-white transition-colors hover:bg-white/10"
                >
                  <Download className="h-4 w-4 text-emerald-400" />
                  {t("Download Android App (APK)", "Android App (APK) ဒေါင်းလုပ်")}
                </a>
              </div>
            </div>

            <div className="mt-4 text-center text-[10px] font-bold text-slate-500 opacity-60">
              © {new Date().getFullYear()} Britium Enterprise •{" "}
              {t("All rights reserved.", "မူပိုင်ခွင့် ရယူထားသည်။")}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
