

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link } from "react-router-dom";
import { ShieldCheck, Download, KeyRound, UserPlus } from "lucide-react";
import { supabase } from "@/lib/supabase/client"; // IMPORT THE SINGLETON

export default function SignInClient() {
  const router = useRouter();
  const supabase = createClient(); // INITIALIZE SECURELY INSIDE COMPONENT
  
  const [lang, setLang] = useState<"en" | "mm">("en");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const dict = {
    en: {
      title: "ENTERPRISE CONSOLE",
      email: "Identity Email or Smart ID",
      password: "Access Key",
      btnReady: "Initialize Authorization",
      btnLoading: "Verifying Credentials...",
      errorGeneric: "Authentication failed. Please check your credentials.",
      register: "Registration Node",
      recovery: "Recovery Protocol",
      download: "Download Mobile Core (APK)"
    },
    mm: {
      title: "လုပ်ငန်းသုံးစနစ်",
      email: "အီးမေးလ် သို့မဟုတ် အသုံးပြုသူအမည်",
      password: "စကားဝှက်",
      btnReady: "စနစ်သို့ ဝင်ရောက်မည်",
      btnLoading: "စစ်ဆေးနေပါသည်...",
      errorGeneric: "ဝင်ရောက်ခြင်း မအောင်မြင်ပါ။",
      register: "အကောင့်အသစ်ဖွင့်ရန်",
      recovery: "စကားဝှက်မေ့နေပါသလား",
      download: "မိုဘိုင်းဆော့ဖ်ဝဲ ဒေါင်းလုဒ်"
    }
  };

  const t = dict[lang];

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .single();

      const role = profileData?.role || "GUEST";
      localStorage.setItem("britium_authority", role);

      if (role === "SYS" || role === "FIN") router.push("/financial-reports");
      else if (role === "MER") router.push("/create-delivery");
      else router.push("/dashboard");
      
      router.refresh();

    } catch (err: any) {
      setError(err.message || t.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0A192F] p-4 font-sans relative overflow-hidden w-full">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#ffd700]/10 rounded-full blur-[100px]" />

      <div className="absolute top-6 right-6 flex gap-2 bg-white/5 p-1 rounded-lg backdrop-blur-md border border-white/10 z-10">
        <button onClick={() => setLang("en")} className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${lang === "en" ? "bg-[#ffd700] text-[#0A192F]" : "text-white/60 hover:text-white"}`}>EN</button>
        <button onClick={() => setLang("mm")} className={`px-3 py-1 rounded-md text-xs transition-all ${lang === "mm" ? "bg-[#ffd700] text-[#0A192F]" : "text-white/60 hover:text-white"}`} style={{ fontFamily: "'Pyidaungsu', 'Noto Sans Myanmar', sans-serif" }}>မြန်မာ</button>
      </div>

      <div className="w-full max-w-[420px] z-10 flex flex-col items-center">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0d2c54] to-blue-900 border border-white/10 flex items-center justify-center shadow-2xl mb-6 relative group">
             <div className="absolute inset-0 rounded-2xl border-2 border-[#ffd700]/30 group-hover:border-[#ffd700] transition-colors" />
             <ShieldCheck className="text-[#ffd700] w-8 h-8" />
          </div>
          <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase">Britium <span className="font-light text-blue-400">Express</span></h1>
          <p className="text-[10px] font-bold tracking-[0.4em] text-slate-400 mt-2 uppercase" style={{ fontFamily: lang === 'mm' ? "'Pyidaungsu', sans-serif" : "inherit" }}>{t.title}</p>
        </div>

        <div className="bg-[#112240] w-full p-8 rounded-3xl shadow-2xl border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#ffd700] to-yellow-500" />
          
          <form onSubmit={handleSignIn} className="space-y-6">
            <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.email} className="w-full bg-[#0A192F] text-white px-5 py-4 rounded-xl border border-white/10 focus:border-[#ffd700] focus:ring-1 focus:ring-[#ffd700] outline-none transition-all text-sm placeholder:text-slate-500 placeholder:uppercase placeholder:text-xs placeholder:tracking-wider" required />
            <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t.password} className="w-full bg-[#0A192F] text-white px-5 py-4 rounded-xl border border-white/10 focus:border-[#ffd700] focus:ring-1 focus:ring-[#ffd700] outline-none transition-all text-sm placeholder:text-slate-500 placeholder:uppercase placeholder:text-xs placeholder:tracking-wider" required />
            {error && <div className="p-3 bg-red-500/10 text-red-400 text-sm rounded-lg border border-red-500/20 text-center" style={{ fontFamily: lang === 'mm' ? "'Pyidaungsu', sans-serif" : "inherit" }}>{error}</div>}
            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] transition-all disabled:opacity-50 uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-2" style={{ fontFamily: lang === 'mm' ? "'Pyidaungsu', sans-serif" : "inherit" }}>{loading ? t.btnLoading : t.btnReady}</button>
          </form>

          <div className="mt-8 flex justify-between items-center text-[10px] uppercase tracking-widest font-bold text-slate-500">
             <Link href="/auth/register" className="hover:text-white transition-colors flex items-center gap-1.5"><UserPlus size={12} /> <span style={{ fontFamily: lang === 'mm' ? "'Pyidaungsu', sans-serif" : "inherit" }}>{t.register}</span></Link>
             <Link href="/auth/recovery" className="hover:text-white transition-colors flex items-center gap-1.5"><KeyRound size={12} /> <span style={{ fontFamily: lang === 'mm' ? "'Pyidaungsu', sans-serif" : "inherit" }}>{t.recovery}</span></Link>
          </div>
        </div>

        <Link href="/download/apk" className="mt-8 flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-colors text-[10px] font-black uppercase tracking-[0.2em]">
          <Download size={14} /> <span style={{ fontFamily: lang === 'mm' ? "'Pyidaungsu', sans-serif" : "inherit" }}>{t.download}</span>
        </Link>
      </div>
    </div>
  );
}
