import React from "react";

export default function OcrWorkbenchScreen() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-3xl font-black text-[#0d2c54]">OCR Workbench</h1>
      <p className="mt-2 text-sm text-slate-500">
        OCR extraction pipeline scaffold that will convert label text into structured cargo rows.
      </p>
    </div>
  );
}
