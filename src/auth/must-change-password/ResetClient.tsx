"use client"
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { 
  ShieldCheck, Lock, CheckCircle2, 
  Loader2, Globe, ChevronRight, Zap 
} from "lucide-react";

export default function ResetClient() {
  const router = useRouter();
  const supabase = createClient();
  const [lang, setLang] = useState("en");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const t = (en: string, my: string) => (lang === "en" ? en : my);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) return setError(t("Credentials do not match", "စကားဝှက်များ မကိုက်ညီပါ။"));
    if (password.length < 6) return setError(t("Security requires 6+ characters", "စကားဝှက်သည် အနည်းဆုံး ၆ လုံးရှိရပါမည်။"));
    
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    
    if (updateError) {
      setError(updateError.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 2500);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-black p-6 overflow-hidden">
      {/* 🌌 Atmospheric Emerald Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,#064e3b_0%,#000000_100%)] z-0" />
      
      <div className="relative z-10 w-full max-w-lg">
        {/* Language Protocol Toggle */}
        <div className="flex justify-end mb-8">
          <button 
            onClick={() => setLang(lang === "en" ? "my" : "en")}
            className="acrylic-3d rounded-xl px-4 py-2 flex items-center gap-2 border border-white/10 hover:border-emerald-500/40 transition-all group"
          >
            <Globe size={14} className="text-emerald-400 group-hover:rotate-180 transition-transform duration-700" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white">{lang === "en" ? "မြန်မာ" : "English"}</span>
          </button>
        </div>

        <div className="acrylic-3d rounded-[3rem] p-10 relative overflow-hidden border border-white/10 shadow-[0_0_80px_rgba(16,185,129,0.1)]">
          <div className="text-center mb-10">
            <div className="inline-flex p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 mb-6 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
              <ShieldCheck className="h-10 w-10 text-emerald-400" />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-white">
              {t("Security", "လုံခြုံရေး")} <span className="text-emerald-400 font-light italic">{t("Update", "အဆင့်မြှင့်တင်မှု")}</span>
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-slate-500 mt-2">
              {t("Credential Synchronization", "လျှို့ဝှက်ချက် အတည်ပြုခြင်း")}
            </p>
          </div>

          {success ? (
            <div className="text-center space-y-6 animate-in fade-in zoom-in duration-700">
              <div className="h-20 w-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(16,185,129,0.4)]">
                <CheckCircle2 className="h-10 w-10 text-emerald-400" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-black uppercase tracking-widest text-white">{t("Access Granted", "ဝင်ရောက်ခွင့်ပြုပြီး")}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t("Redirecting to Command Center...", "ပင်မစာမျက်နှာသို့ သွားနေသည်...")}</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="space-y-4">
                <div className="group relative">
                  <Lock size={16} className="absolute left-5 top-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                  <input 
                    type="password" required placeholder={t("NEW ENCRYPTION KEY", "စကားဝှက်အသစ်")}
                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-14 py-5 text-sm font-bold tracking-widest uppercase outline-none focus:border-emerald-500 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)]"
                    value={password} onChange={e => setPassword(e.target.value)}
                  />
                </div>
                <div className="group relative">
                  <Lock size={16} className="absolute left-5 top-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                  <input 
                    type="password" required placeholder={t("CONFIRM KEY", "စကားဝှက်ကို အတည်ပြုပါ")}
                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-14 py-5 text-sm font-bold tracking-widest uppercase outline-none focus:border-emerald-500 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)]"
                    value={confirm} onChange={e => setConfirm(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl">
                  <p className="text-rose-400 text-[10px] font-black text-center uppercase tracking-widest">{error}</p>
                </div>
              )}

              <button className="jelly-button relative w-full group overflow-hidden rounded-2xl bg-emerald-600 shadow-[0_10px_40px_rgba(16,185,129,0.3)]">
                <div className="relative py-5 flex items-center justify-center gap-3 font-black text-xs uppercase tracking-[0.4em]">
                  {loading ? <Loader2 className="animate-spin" /> : (
                    <>
                      <span>{t("Synchronize Account", "အကောင့်ကို အဆင့်မြှင့်ပါ")}</span>
                      <ChevronRight size={16} />
                    </>
                  )}
                </div>
              </button>
            </form>
          )}
        </div>

        <div className="mt-12 flex justify-between px-10 items-center opacity-30">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-emerald-400" />
            <span className="text-[10px] font-black uppercase tracking-widest">Protocol v4.0-Secure</span>
          </div>
        </div>
      </div>
    </div>
  );
}
