import React, { useMemo, useState } from "react";
import { Camera, ImagePlus } from "lucide-react";

type Props = {
  label?: string;
  onChange?: (file: File | null, metrics?: { brightness: number; contrast: number; blurRisk: number }) => void;
};

export default function PhotoEvidenceField({ label = "Photo Evidence", onChange }: Props) {
  const [preview, setPreview] = useState<string>("");
  const [metrics, setMetrics] = useState({ brightness: 0, contrast: 0, blurRisk: 0 });

  async function analyze(file: File) {
    const imageUrl = URL.createObjectURL(file);
    const img = new Image();
    img.src = imageUrl;

    await new Promise((resolve) => {
      img.onload = resolve;
      img.onerror = resolve;
    });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx || !img.width || !img.height) {
      setPreview(imageUrl);
      onChange?.(file);
      return;
    }

    canvas.width = Math.min(img.width, 300);
    canvas.height = Math.min(img.height, 200);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let total = 0;
    let contrastSeed = 0;

    for (let i = 0; i < data.length; i += 4) {
      const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
      total += lum;
    }

    const avg = total / (data.length / 4);

    for (let i = 0; i < data.length; i += 4) {
      const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
      contrastSeed += Math.pow(lum - avg, 2);
    }

    const contrast = Math.sqrt(contrastSeed / (data.length / 4));
    const blurRisk = Math.max(0, 100 - contrast);

    const next = {
      brightness: Math.round(avg),
      contrast: Math.round(contrast),
      blurRisk: Math.round(blurRisk),
    };

    setPreview(imageUrl);
    setMetrics(next);
    onChange?.(file, next);
  }

  const guidance = useMemo(() => {
    const items: string[] = [];
    if (metrics.brightness < 70) items.push("Too dark");
    if (metrics.brightness > 210) items.push("Too bright");
    if (metrics.contrast < 35) items.push("Low contrast");
    if (metrics.blurRisk > 55) items.push("Possible blur");
    return items.length ? items.join(" / ") : "Quality looks acceptable";
  }, [metrics]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
        <Camera className="h-4 w-4" />
        {label}
      </div>

      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm font-semibold text-slate-600">
        <ImagePlus className="h-4 w-4" />
        Upload / Capture Image
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0] || null;
            if (!file) return;
            void analyze(file);
          }}
        />
      </label>

      {preview ? (
        <div className="mt-4 grid gap-4 md:grid-cols-[180px_minmax(0,1fr)]">
          <img src={preview} alt="evidence" className="h-40 w-full rounded-xl object-cover" />
          <div className="space-y-2 text-sm text-slate-600">
            <div>Brightness: <span className="font-semibold">{metrics.brightness}</span></div>
            <div>Contrast: <span className="font-semibold">{metrics.contrast}</span></div>
            <div>Blur risk: <span className="font-semibold">{metrics.blurRisk}</span></div>
            <div className="rounded-xl bg-slate-50 px-3 py-2 font-semibold">{guidance}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
