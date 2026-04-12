import ResetClient from "./ResetClient";

export default function MustChangePasswordPage() {
  return (
    <div 
      className="recovery-layout bg-[#0d2c54] min-h-screen grid place-items-center p-4"
      style={{ fontFamily: "'Pyidaungsu', 'Noto Sans Myanmar', sans-serif" }}
    >
      <div className="card shadow-2xl bg-white p-10 max-w-md w-full rounded-2xl border-t-4 border-[#ffd700]">
        <div className="text-center mb-8">
           <h2 className="text-[#0d2c54] font-black text-2xl uppercase tracking-widest">
             Security Protocol
           </h2>
           <h3 className="text-slate-600 font-bold mt-2">လုံခြုံရေး အဆင့်အတန်း</h3>
           <p className="text-sm opacity-70 mt-4 text-slate-500">
             Update your credentials to continue.<br/>
             ဆက်လက်လုပ်ဆောင်ရန် စကားဝှက်ကို ပြောင်းလဲပါ။
           </p>
        </div>
        <ResetClient />
      </div>
    </div>
  );
}
