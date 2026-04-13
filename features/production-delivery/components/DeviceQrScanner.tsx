import React, { useState } from "react";
import { Camera, Keyboard, QrCode, ScanLine } from "lucide-react";

type Props = {
  onDetected: (value: string) => void;
};

export default function DeviceQrScanner({ onDetected }: Props) {
  const [manualValue, setManualValue] = useState("");

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
        <QrCode className="h-4 w-4" />
        QR / Barcode Intake
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700"
          onClick={() => alert("Camera scan scaffold ready. Connect real scanner library next.")}
        >
          <Camera className="h-4 w-4" />
          Open Camera Scan
        </button>

        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700"
          onClick={() => alert("Hardware scanner scaffold ready.")}
        >
          <ScanLine className="h-4 w-4" />
          Hardware Scanner Mode
        </button>
      </div>

      <div className="mt-4">
        <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
          <Keyboard className="h-4 w-4" />
          Manual Fallback
        </label>
        <div className="flex gap-2">
          <input
            value={manualValue}
            onChange={(e) => setManualValue(e.target.value)}
            placeholder="Scan or type tracking / QR content"
            className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none"
          />
          <button
            type="button"
            className="rounded-xl bg-[#0d2c54] px-4 text-sm font-bold text-white"
            onClick={() => {
              if (!manualValue.trim()) return;
              onDetected(manualValue.trim());
              setManualValue("");
            }}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
