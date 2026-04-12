
import { Mail, ArrowLeft, KeyRound } from "lucide-react";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  return (
    <div className="min-h-screen bg-[#0d2c54] flex items-center justify-center p-4 relative overflow-hidden" style={{ fontFamily: "'Pyidaungsu', sans-serif" }}>
      <div className="w-full max-w-md bg-white rounded-[40px] p-10 shadow-2xl z-10">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 text-blue-600">
            <KeyRound size={32} />
          </div>
          <h1 className="text-2xl font-black text-[#0d2c54] uppercase tracking-tighter italic">Reset <span className="text-blue-500 not-italic font-light">Access</span></h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">လျှို့ဝှက်နံပါတ် အသစ်ရယူရန်</p>
        </div>
        <div className="space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Network ID (Email)</label>
            <div className="relative">
              <Mail className="absolute left-4 top-4 text-slate-400" size={20} />
              <input type="email" placeholder="agent@britium.com" className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl border-none font-bold text-[#0d2c54] outline-none focus:ring-2 focus:ring-[#ffd700]" />
            </div>
          </div>
          <button className="w-full bg-[#ffd700] text-[#0d2c54] py-5 rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] transition-transform">Send Reset Link</button>
        </div>
        <div className="mt-8 text-center border-t border-slate-100 pt-6">
           <Link href="/auth/login" className="text-[10px] font-black text-slate-400 hover:text-[#0d2c54] uppercase tracking-widest flex items-center justify-center gap-2">
              <ArrowLeft size={14}/> Return to Login
           </Link>
        </div>
      </div>
    </div>
  );
}
