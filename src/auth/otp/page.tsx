
import { ShieldAlert } from "lucide-react";

export default function OTPVerification() {
  return (
    <div className="min-h-screen bg-[#0d2c54] flex items-center justify-center p-4 relative" style={{ fontFamily: "'Pyidaungsu', sans-serif" }}>
      <div className="w-full max-w-md bg-white rounded-[40px] p-10 shadow-2xl z-10 text-center">
        <ShieldAlert size={48} className="mx-auto text-[#ffd700] mb-6" />
        <h1 className="text-2xl font-black text-[#0d2c54] uppercase tracking-tighter italic">Security <span className="text-blue-500 not-italic font-light">Checkpoint</span></h1>
        <p className="text-slate-400 font-bold text-xs mt-2 mb-8">Enter the 6-digit code sent to your registered device.</p>
        
        <div className="flex gap-2 justify-center mb-8">
          {[1,2,3,4,5,6].map(i => (
             <input key={i} maxLength={1} className="w-12 h-14 bg-slate-50 border-2 border-slate-200 rounded-xl text-center text-2xl font-black text-[#0d2c54] focus:border-[#ffd700] outline-none" />
          ))}
        </div>
        
        <button className="w-full bg-[#0d2c54] text-[#ffd700] py-5 rounded-2xl font-black uppercase tracking-widest shadow-lg">Verify Identity</button>
      </div>
    </div>
  );
}
