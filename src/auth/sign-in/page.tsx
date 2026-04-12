import { Suspense } from "react";
import SignInClient from "./SignInClient";

export default function SignInPage() {
  return (
    <main 
      className="auth-container" 
      style={{ fontFamily: "'Pyidaungsu', 'Noto Sans Myanmar', sans-serif" }}
    >
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen text-navy">
          <div className="text-center">
            <p className="font-bold text-lg">Initializing Authorization...</p>
            <p className="text-sm opacity-70 mt-2 text-slate-500">လုပ်ငန်းစနစ် ပြင်ဆင်နေသည်...</p>
          </div>
        </div>
      }>
        <SignInClient />
      </Suspense>
    </main>
  );
}
