import React, { useMemo, useState } from "react";
import {
  Bell,
  Globe2,
  KeyRound,
  Laptop,
  LogOut,
  Palette,
  Save,
  Settings2,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useEnhancedAuth } from "@/hooks/useEnhancedAuth";

type TabKey = "general" | "security" | "access" | "branding" | "system";

function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm ${className}`}>
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
      <div className="text-[11px] font-black uppercase tracking-[0.26em] text-slate-400">
        {eyebrow}
      </div>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">{title}</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">{subtitle}</p>
    </div>
  );
}

function ReadRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</div>
      <div className="mt-2 text-sm font-semibold text-slate-800">{value}</div>
    </div>
  );
}

export default function Settings() {
  const { user, roleCode, authorityLevel, dataScopes, isSuperAdmin } = useEnhancedAuth();

  const [activeTab, setActiveTab] = useState<TabKey>("general");
  const [language, setLanguage] = useState("EN + မြန်မာ");
  const [theme, setTheme] = useState("Enterprise Dark");
  const [notifications, setNotifications] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");

  const tabs = useMemo(
    () => [
      { id: "general" as const, label: "General", icon: <Settings2 className="h-4 w-4" /> },
      { id: "security" as const, label: "Security", icon: <ShieldCheck className="h-4 w-4" /> },
      { id: "access" as const, label: "Access", icon: <UserCog className="h-4 w-4" /> },
      { id: "branding" as const, label: "Branding", icon: <Palette className="h-4 w-4" /> },
      { id: "system" as const, label: "System", icon: <Laptop className="h-4 w-4" /> },
    ],
    []
  );

  const email = user?.email ?? "Unknown";
  const displayName =
    (user?.user_metadata as any)?.full_name ||
    (user?.user_metadata as any)?.display_name ||
    email;

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/login?force=1";
  }

  async function sendPasswordReset() {
    if (!user?.email) {
      setStatusMessage("No email found for this account.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/login`,
    });

    setStatusMessage(
      error ? error.message : `Password reset email sent to ${user.email}`
    );
  }

  function savePreferences() {
    setStatusMessage("Preferences saved locally for this workspace.");
  }

  return (
    <div className="space-y-6">
      <Panel className="overflow-hidden bg-[linear-gradient(135deg,#061120_0%,#0d2340_60%,#16345d_100%)] text-white shadow-[0_24px_70px_rgba(2,6,23,0.22)]">
        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.85fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-white/80">
              <Settings2 size={14} />
              Settings Portal
            </div>
            <h1 className="mt-4 text-4xl font-black tracking-tight">
              Britium Express Settings & Access Control
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/75">
              Configure workspace preferences, review current access authority,
              and manage security actions from one enterprise settings console.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[24px] border border-white/10 bg-white/10 p-5">
              <div className="text-xs font-black uppercase tracking-[0.25em] text-white/60">
                Signed In
              </div>
              <div className="mt-3 text-lg font-black">{displayName}</div>
              <div className="mt-2 text-sm text-white/75">{email}</div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/10 p-5">
              <div className="text-xs font-black uppercase tracking-[0.25em] text-white/60">
                Role / Level
              </div>
              <div className="mt-3 text-lg font-black">{roleCode || "INT"}</div>
              <div className="mt-2 text-sm text-white/75">{authorityLevel || "L0"}</div>
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <Panel className="h-fit">
          <div className="mb-4 text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
            Settings Sections
          </div>
          <div className="space-y-2">
            {tabs.map((tab) => {
              const active = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
                    active
                      ? "bg-[#0d2c54] text-white shadow"
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {tab.icon}
                  <span className="text-sm font-bold">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </Panel>

        <div className="space-y-6">
          {activeTab === "general" ? (
            <Panel>
              <SectionTitle
                eyebrow="General"
                title="Workspace preferences"
                subtitle="Adjust basic operating preferences for the current Britium Express workspace."
              />

              <div className="grid gap-4 md:grid-cols-2">
                <label className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                    Language
                  </div>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800"
                  >
                    <option>EN</option>
                    <option>မြန်မာ</option>
                    <option>EN + မြန်မာ</option>
                  </select>
                </label>

                <label className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                    Theme
                  </div>
                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800"
                  >
                    <option>Enterprise Dark</option>
                    <option>Classic Light</option>
                    <option>Blue Command</option>
                  </select>
                </label>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={savePreferences}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#0d2c54] px-5 py-3 text-sm font-black text-white"
                >
                  <Save className="h-4 w-4" />
                  Save Preferences
                </button>
              </div>
            </Panel>
          ) : null}

          {activeTab === "security" ? (
            <Panel>
              <SectionTitle
                eyebrow="Security"
                title="Account security controls"
                subtitle="Run essential security actions for your current account."
              />

              <div className="grid gap-4 md:grid-cols-2">
                <ReadRow label="Account Email" value={email} />
                <ReadRow label="Super Admin Override" value={isSuperAdmin ? "Enabled" : "No"} />
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={sendPasswordReset}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white"
                >
                  <KeyRound className="h-4 w-4" />
                  Send Password Reset
                </button>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </Panel>
          ) : null}

          {activeTab === "access" ? (
            <Panel>
              <SectionTitle
                eyebrow="Access"
                title="Role and scope visibility"
                subtitle="Review current authority level, role code, and data scopes resolved by the Supabase RBAC layer."
              />

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <ReadRow label="Role Code" value={roleCode || "INT"} />
                <ReadRow label="Authority Level" value={authorityLevel || "L0"} />
                <ReadRow label="Data Scopes" value={dataScopes.length ? dataScopes.join(", ") : "S1"} />
                <ReadRow label="Super Admin" value={isSuperAdmin ? "Yes" : "No"} />
              </div>
            </Panel>
          ) : null}

          {activeTab === "branding" ? (
            <Panel>
              <SectionTitle
                eyebrow="Branding"
                title="Branding and notifications"
                subtitle="Manage brand-adjacent preferences for the current operational console."
              />

              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    <Bell className="h-4 w-4 text-slate-600" />
                    <div>
                      <div className="text-sm font-bold text-slate-800">Notifications</div>
                      <div className="text-xs text-slate-500">Enable operational alerts</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications}
                    onChange={(e) => setNotifications(e.target.checked)}
                  />
                </label>

                <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    <Globe2 className="h-4 w-4 text-slate-600" />
                    <div>
                      <div className="text-sm font-bold text-slate-800">Sound Alerts</div>
                      <div className="text-xs text-slate-500">Play alert sound for critical events</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={soundAlerts}
                    onChange={(e) => setSoundAlerts(e.target.checked)}
                  />
                </label>
              </div>
            </Panel>
          ) : null}

          {activeTab === "system" ? (
            <Panel>
              <SectionTitle
                eyebrow="System"
                title="Runtime behavior"
                subtitle="Local runtime preferences for the current browser session."
              />

              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    <Laptop className="h-4 w-4 text-slate-600" />
                    <div>
                      <div className="text-sm font-bold text-slate-800">Auto Refresh</div>
                      <div className="text-xs text-slate-500">Refresh portal panels automatically</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                  />
                </label>
              </div>
            </Panel>
          ) : null}

          {statusMessage ? (
            <Panel className="border-cyan-200 bg-cyan-50">
              <div className="text-sm font-semibold text-cyan-800">{statusMessage}</div>
            </Panel>
          ) : null}
        </div>
      </div>
    </div>
  );
}
