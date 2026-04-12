"use client"
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { 
  Loader2, KeyRound, ArrowLeft, Mail, Send, CheckCircle2 
} from "lucide-react";

export default function RecoveryClient() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/must-change-password`,
    });

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
    } else {
      setSent(true);
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-6 bg-black overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,#1e1b4b_0%,#000000_100%)] z-0" />
      
      <div className="relative z-10 w-full max-w-lg">
        <div className="acrylic-3d rounded-[3rem] p-10 relative overflow-hidden border border-white/10">
          <div className="text-center mb-8">
            <div className="inline-flex p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 mb-4">
              <KeyRound className="h-8 w-8 text-rose-400" />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-white">
              Recovery <span className="text-rose-400">Protocol</span>
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-2">
              Encrypted Credential Reset
            </p>
          </div>

          {sent ? (
            <div className="text-center space-y-6 animate-in fade-in zoom-in duration-500">
              <CheckCircle2 className="h-16 w-16 text-emerald-400 mx-auto" />
              <p className="text-sm font-bold text-slate-300 uppercase tracking-widest leading-relaxed">
                Transmission Successful. <br/> Check your secure inbox for the reset link.
              </p>
              <button 
                onClick={() => router.push('/auth/sign-in')}
                className="jelly-button w-full py-4 rounded-2xl bg-white/5 border border-white/10 font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all"
              >
                Return to Gateway
              </button>
            </div>
          ) : (
            <form onSubmit={handleRecovery} className="space-y-8">
              <div className="relative group">
                <Mail size={18} className="absolute left-4 top-5 text-slate-500 group-focus-within:text-rose-400 transition-colors" />
                <input 
                  type="email" 
                  required 
                  placeholder="REGISTERED EMAIL ADDRESS" 
                  className="w-full bg-black/40 border border-white/5 rounded-2xl px-12 py-5 text-sm font-bold tracking-widest uppercase outline-none focus:border-rose-500 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)]"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {error && <p className="text-rose-400 text-[10px] font-black text-center uppercase tracking-widest">{error}</p>}

              <button 
                className="jelly-button relative w-full group overflow-hidden rounded-2xl bg-rose-600 shadow-[0_10px_30px_rgba(225,29,72,0.3)]"
                disabled={loading}
              >
                <div className="relative py-5 flex items-center justify-center gap-3 font-black text-xs uppercase tracking-[0.4em]">
                  {loading ? <Loader2 className="animate-spin" /> : (
                    <>
                      <Send size={16} />
                      <span>Transmit Link</span>
                    </>
                  )}
                </div>
              </button>

              <button 
                type="button"
                onClick={() => router.push('/auth/sign-in')}
                className="w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
              >
                <ArrowLeft size={14} /> Abort Protocol
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
