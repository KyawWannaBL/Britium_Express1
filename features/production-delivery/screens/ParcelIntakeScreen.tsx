import React from "react";
import DeviceQrScanner from "../components/DeviceQrScanner";
import PhotoEvidenceField from "../components/PhotoEvidenceField";

export default function ParcelIntakeScreen() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-black text-[#0d2c54]">Parcel Intake</h1>
        <p className="mt-2 text-sm text-slate-500">QR / barcode intake with manual fallback and photo quality checks.</p>
      </div>
      <DeviceQrScanner onDetected={(value) => alert(`Captured: ${value}`)} />
      <PhotoEvidenceField label="Parcel Label Photo" />
    </div>
  );
}
