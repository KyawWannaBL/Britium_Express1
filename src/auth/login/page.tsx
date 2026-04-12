

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Lock, Mail, ChevronRight, Loader2, Sparkles } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Logic for Supabase auth would go here
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <main className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-slate-950">
      {/* 1. Cinematic Background Video Layer */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="h-full w-full object-cover opacity-40 grayscale-[0.5]"
        >
          <source src="/background.mp4" type="video/mp4" />
        </video>
        {/* Overlay Gradient for Readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-transparent to-slate-950/90" />
      </div>

      {/* 2. Glassmorphism Login Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[440px] px-6"
      >
        <div className="premium-card bg-slate-900/40 backdrop-blur-2xl border-white/10 p-8 md:p-12 shadow-2xl shadow-black/50 rounded-[2.5rem]">
          
          {/* Logo Section */}
          <div className="flex flex-col items-center mb-10">
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-6"
            >
              <Image 
                src="/logo.png" 
                alt="Britium Express Logo" 
                width={180} 
                height={60} 
                className="drop-shadow-2xl"
                priority
              />
            </motion.div>
            <div className="kicker border-white/10 bg-white/5 text-sky-400 shadow-none">
              <ShieldCheck size={12} className="mr-1"/> Enterprise Identity
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="field-label text-slate-400 ml-1">Corporate Email</label>
              <div className="field-wrap bg-white/5 border-white/10 focus-within:border-sky-500/50">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  <Mail size={18} />
                </div>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@britium.com" 
                  className="input-premium pl-12 text-white placeholder:text-slate-600"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="field-label text-slate-400">Security Key</label>
                <button type="button" className="text-[10px] font-black uppercase tracking-widest text-sky-500 hover:text-sky-400 transition-colors">Forgot?</button>
              </div>
              <div className="field-wrap bg-white/5 border-white/10 focus-within:border-sky-500/50">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  <Lock size={18} />
                </div>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="input-premium pl-12 text-white placeholder:text-slate-600"
                />
              </div>
            </div>

            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              type="submit"
              className="w-full btn-primary h-14 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-black uppercase tracking-[0.2em] shadow-xl shadow-sky-500/20 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>Access Node <ChevronRight size={18} className="ml-1" /></>
              )}
            </motion.button>
          </form>

          {/* Footer */}
          <div className="mt-12 text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] flex items-center justify-center gap-2">
              <Sparkles size={10} className="text-sky-500"/> Britium Express Protocol v4.2
            </p>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
