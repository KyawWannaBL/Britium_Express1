import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  ImagePlus,
  PackagePlus,
  QrCode,
  RefreshCw,
  Save,
  ScanLine,
  Search,
  Trash2,
  Upload,
} from "lucide-react";

type IntakeRow = {
  id: string;
  trackingNo: string;
  senderName: string;
  receiverName: string;
  phone: string;
  township: string;
  address: string;
  itemName: string;
  qty: number;
  weightKg: number;
  collectable: number;
  note: string;
};

type PhotoCheck = {
  brightness: number;
  contrast: number;
  sharpness: number;
  brightnessStatus: "good" | "warn";
  contrastStatus: "good" | "warn";
  sharpnessStatus: "good" | "warn";
};

const DRAFT_KEY = "britium-data-entry-draft";

function makeRow(): IntakeRow {
  return {
    id: crypto.randomUUID(),
    trackingNo: "",
    senderName: "",
    receiverName: "",
    phone: "",
    township: "",
    address: "",
    itemName: "",
    qty: 1,
    weightKg: 0,
    collectable: 0,
    note: "",
  };
}

function toCsv(rows: IntakeRow[]) {
  const header = [
    "tracking_no",
    "sender_name",
    "receiver_name",
    "phone",
    "township",
    "address",
    "item_name",
    "qty",
    "weight_kg",
    "collectable",
    "note",
  ];

  const body = rows.map((r) => [
    r.trackingNo,
    r.senderName,
    r.receiverName,
    r.phone,
    r.township,
    r.address,
    r.itemName,
    String(r.qty),
    String(r.weightKg),
    String(r.collectable),
    r.note,
  ]);

  return [header, ...body]
    .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

function downloadText(filename: string, content: string, mime = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function parseCsv(text: string): IntakeRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length <= 1) return [];

  const rows: IntakeRow[] = [];

  for (const line of lines.slice(1)) {
    const cells = line
      .match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)
      ?.map((cell) => cell.replace(/^"|"$/g, "").replace(/""/g, '"').trim()) ?? [];

    rows.push({
      id: crypto.randomUUID(),
      trackingNo: cells[0] ?? "",
      senderName: cells[1] ?? "",
      receiverName: cells[2] ?? "",
      phone: cells[3] ?? "",
      township: cells[4] ?? "",
      address: cells[5] ?? "",
      itemName: cells[6] ?? "",
      qty: Number(cells[7] ?? 1) || 1,
      weightKg: Number(cells[8] ?? 0) || 0,
      collectable: Number(cells[9] ?? 0) || 0,
      note: cells[10] ?? "",
    });
  }

  return rows;
}

async function analyzePhoto(file: File): Promise<PhotoCheck> {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.src = url;

  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    URL.revokeObjectURL(url);
    throw new Error("Canvas is not supported");
  }

  const maxWidth = 600;
  const scale = Math.min(1, maxWidth / img.width);
  canvas.width = Math.max(1, Math.floor(img.width * scale));
  canvas.height = Math.max(1, Math.floor(img.height * scale));
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(url);

  let sum = 0;
  const gray: number[] = [];

  for (let i = 0; i < data.length; i += 4) {
    const v = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    gray.push(v);
    sum += v;
  }

  const mean = sum / gray.length;

  let variance = 0;
  for (const v of gray) variance += (v - mean) ** 2;
  variance /= gray.length;
  const contrast = Math.sqrt(variance);

  let sharpnessScore = 0;
  const width = canvas.width;
  const height = canvas.height;

  for (let y = 1; y < height - 1; y += 2) {
    for (let x = 1; x < width - 1; x += 2) {
      const idx = y * width + x;
      const center = gray[idx];
      const lap =
        4 * center -
        gray[idx - 1] -
        gray[idx + 1] -
        gray[idx - width] -
        gray[idx + width];
      sharpnessScore += Math.abs(lap);
    }
  }

  const sampledPixels = Math.max(1, ((height - 2) / 2) * ((width - 2) / 2));
  const sharpness = sharpnessScore / sampledPixels;

  return {
    brightness: Number(mean.toFixed(1)),
    contrast: Number(contrast.toFixed(1)),
    sharpness: Number(sharpness.toFixed(1)),
    brightnessStatus: mean >= 85 && mean <= 190 ? "good" : "warn",
    contrastStatus: contrast >= 35 ? "good" : "warn",
    sharpnessStatus: sharpness >= 18 ? "good" : "warn",
  };
}

function ScorePill({
  label,
  value,
  ok,
}: {
  label: string;
  value: number;
  ok: boolean;
}) {
  return (
    <div
      className={`rounded-2xl px-3 py-2 text-xs font-bold ${
        ok ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
      }`}
    >
      {label}: {value}
    </div>
  );
}

export default function DataEntryPortal() {
  const [rows, setRows] = useState<IntakeRow[]>([makeRow()]);
  const [query, setQuery] = useState("");
  const [manualScanValue, setManualScanValue] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState("Ready");
  const [photoFileName, setPhotoFileName] = useState("");
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoCheck, setPhotoCheck] = useState<PhotoCheck | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const bulkInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as IntakeRow[];
        if (Array.isArray(parsed) && parsed.length) setRows(parsed);
      } catch {}
    }

    return () => {
      if (scanTimerRef.current) window.clearInterval(scanTimerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [
        r.trackingNo,
        r.senderName,
        r.receiverName,
        r.phone,
        r.township,
        r.address,
        r.itemName,
        r.note,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [rows, query]);

  function patchRow(id: string, key: keyof IntakeRow, value: string | number) {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [key]: value } : row)),
    );
  }

  function addRow(prefill?: Partial<IntakeRow>) {
    setRows((prev) => [...prev, { ...makeRow(), ...prefill }]);
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((row) => row.id !== id));
  }

  function saveDraft() {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(rows));
    alert("Draft saved in this browser.");
  }

  function loadDraft() {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (!saved) return alert("No saved draft found.");
    try {
      const parsed = JSON.parse(saved) as IntakeRow[];
      if (Array.isArray(parsed)) setRows(parsed);
    } catch {
      alert("Draft is invalid.");
    }
  }

  function clearDraft() {
    localStorage.removeItem(DRAFT_KEY);
    setRows([makeRow()]);
    setPhotoPreview("");
    setPhotoFileName("");
    setPhotoCheck(null);
  }

  function downloadTemplate() {
    const template = toCsv([
      {
        id: "template",
        trackingNo: "BRT-000001",
        senderName: "Sender Name",
        receiverName: "Receiver Name",
        phone: "09xxxxxxxxx",
        township: "Yangon",
        address: "Full delivery address",
        itemName: "Shoes / Bag / Document",
        qty: 1,
        weightKg: 0.5,
        collectable: 0,
        note: "Handle with care",
      },
    ]);
    downloadText("data-entry-template.csv", template);
  }

  function exportRows() {
    downloadText("data-entry-export.csv", toCsv(rows));
  }

  async function handleBulkUpload(file: File) {
    const text = await file.text();
    const parsed = parseCsv(text);
    if (!parsed.length) {
      alert("No usable rows found in CSV.");
      return;
    }
    setRows(parsed);
  }

  async function startScanner() {
    try {
      if (!("BarcodeDetector" in window)) {
        setScanMessage("BarcodeDetector is not supported in this browser. Use manual entry.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setScanning(true);
      setScanMessage("Scanning...");

      const Detector = (window as any).BarcodeDetector;
      const detector = new Detector({
        formats: ["qr_code", "code_128", "code_39", "ean_13", "upc_a"],
      });

      scanTimerRef.current = window.setInterval(async () => {
        if (!videoRef.current) return;
        try {
          const detections = await detector.detect(videoRef.current);
          const value = detections?.[0]?.rawValue;
          if (value) {
            setManualScanValue(value);
            addRow({ trackingNo: value });
            stopScanner();
            setScanMessage(`Scanned: ${value}`);
          }
        } catch {}
      }, 900);
    } catch {
      setScanMessage("Unable to access camera.");
    }
  }

  function stopScanner() {
    if (scanTimerRef.current) {
      window.clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  }

  function applyManualTracking() {
    const value = manualScanValue.trim();
    if (!value) return;
    addRow({ trackingNo: value });
    setManualScanValue("");
    setScanMessage(`Added manually: ${value}`);
  }

  async function handlePhotoUpload(file: File) {
    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);
    setPhotoFileName(file.name);
    const result = await analyzePhoto(file);
    setPhotoCheck(result);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur-md">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">
              Data Entry & Parcel Intake
            </div>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-900">
              Data Entry Portal
            </h1>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">
              Bulk load shipments, download intake forms, scan QR or barcode labels,
              validate parcel photos, and prepare dispatch-ready intake rows in one screen.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/production/parcel-intake"
              className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-slate-600"
            >
              Open Parcel Intake
            </Link>
            <Link
              to="/production/ocr-workbench"
              className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-slate-600"
            >
              OCR Workbench
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white/65 p-6 shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-5 w-5 text-sky-700" />
            <h2 className="text-lg font-black text-slate-900">Bulk Load & Form Downloads</h2>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={downloadTemplate}
              className="inline-flex items-center gap-2 rounded-2xl bg-sky-700 px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-white"
            >
              <Download className="h-4 w-4" />
              Download CSV Template
            </button>

            <button
              type="button"
              onClick={() => bulkInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-slate-700"
            >
              <Upload className="h-4 w-4" />
              Bulk Upload CSV
            </button>

            <button
              type="button"
              onClick={exportRows}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-slate-700"
            >
              <Download className="h-4 w-4" />
              Export Current Rows
            </button>

            <input
              ref={bulkInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleBulkUpload(file);
              }}
            />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                Rows
              </div>
              <div className="mt-2 text-3xl font-black text-slate-900">{rows.length}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                Visible
              </div>
              <div className="mt-2 text-3xl font-black text-slate-900">{filteredRows.length}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                Draft
              </div>
              <div className="mt-2 text-sm font-bold text-slate-700">Browser local draft ready</div>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white/65 p-6 shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-3">
            <QrCode className="h-5 w-5 text-sky-700" />
            <h2 className="text-lg font-black text-slate-900">QR / Barcode Scanning</h2>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {!scanning ? (
              <button
                type="button"
                onClick={() => void startScanner()}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-white"
              >
                <Camera className="h-4 w-4" />
                Start Camera Scan
              </button>
            ) : (
              <button
                type="button"
                onClick={stopScanner}
                className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-white"
              >
                <RefreshCw className="h-4 w-4" />
                Stop Scan
              </button>
            )}

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-600">
              {scanMessage}
            </div>
          </div>

          <video
            ref={videoRef}
            className={`mt-4 h-52 w-full rounded-2xl bg-slate-950 object-cover ${
              scanning ? "block" : "hidden"
            }`}
            muted
            playsInline
          />

          <div className="mt-4 flex flex-col gap-3 md:flex-row">
            <input
              value={manualScanValue}
              onChange={(e) => setManualScanValue(e.target.value)}
              placeholder="Manual tracking / QR text fallback"
              className="h-12 flex-1 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none"
            />
            <button
              type="button"
              onClick={applyManualTracking}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-slate-700"
            >
              <ScanLine className="h-4 w-4" />
              Add Manual Code
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white/65 p-6 shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-3">
            <ImagePlus className="h-5 w-5 text-sky-700" />
            <h2 className="text-lg font-black text-slate-900">Parcel Product Photo Checker</h2>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-slate-900"
            >
              <ImagePlus className="h-4 w-4" />
              Upload Parcel Photo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handlePhotoUpload(file);
              }}
            />
          </div>

          {photoFileName ? (
            <div className="mt-4 text-sm font-semibold text-slate-700">{photoFileName}</div>
          ) : null}

          {photoPreview ? (
            <img
              src={photoPreview}
              alt="Parcel preview"
              className="mt-4 h-64 w-full rounded-2xl border border-slate-200 object-cover"
            />
          ) : (
            <div className="mt-4 grid h-64 place-items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
              Upload a parcel or product image for quality validation.
            </div>
          )}

          {photoCheck ? (
            <div className="mt-4 flex flex-wrap gap-3">
              <ScorePill
                label="Brightness"
                value={photoCheck.brightness}
                ok={photoCheck.brightnessStatus === "good"}
              />
              <ScorePill
                label="Contrast"
                value={photoCheck.contrast}
                ok={photoCheck.contrastStatus === "good"}
              />
              <ScorePill
                label="Sharpness"
                value={photoCheck.sharpness}
                ok={photoCheck.sharpnessStatus === "good"}
              />
            </div>
          ) : null}

          {photoCheck ? (
            <div className="mt-4 space-y-2 text-sm">
              {photoCheck.brightnessStatus === "warn" ? (
                <div className="flex items-center gap-2 text-amber-700">
                  <AlertTriangle className="h-4 w-4" />
                  Lighting is weak or overexposed. Retake in balanced light.
                </div>
              ) : (
                <div className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Brightness looks acceptable.
                </div>
              )}

              {photoCheck.contrastStatus === "warn" ? (
                <div className="flex items-center gap-2 text-amber-700">
                  <AlertTriangle className="h-4 w-4" />
                  Contrast is low. Increase separation between parcel and background.
                </div>
              ) : (
                <div className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Contrast looks acceptable.
                </div>
              )}

              {photoCheck.sharpnessStatus === "warn" ? (
                <div className="flex items-center gap-2 text-amber-700">
                  <AlertTriangle className="h-4 w-4" />
                  Image may be blurry. Hold camera steady and retake.
                </div>
              ) : (
                <div className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Sharpness looks acceptable.
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white/65 p-6 shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-3">
            <PackagePlus className="h-5 w-5 text-sky-700" />
            <h2 className="text-lg font-black text-slate-900">Manual Intake Controls</h2>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => addRow()}
              className="inline-flex items-center gap-2 rounded-2xl bg-sky-700 px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-white"
            >
              <PackagePlus className="h-4 w-4" />
              Add Empty Row
            </button>

            <button
              type="button"
              onClick={saveDraft}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-slate-700"
            >
              <Save className="h-4 w-4" />
              Save Draft
            </button>

            <button
              type="button"
              onClick={loadDraft}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-slate-700"
            >
              <RefreshCw className="h-4 w-4" />
              Load Draft
            </button>

            <button
              type="button"
              onClick={clearDraft}
              className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-rose-700"
            >
              <Trash2 className="h-4 w-4" />
              Clear Draft
            </button>
          </div>

          <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-600">
            This Vite-safe portal now keeps your operational functions in place instead of removing them.
            The next step is connecting “Save All” to your final Supabase intake table once the exact table and
            column names are confirmed.
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white/65 p-6 shadow-sm backdrop-blur-md">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900">Intake Rows</h2>
            <p className="mt-1 text-sm text-slate-500">
              Search, edit, and prepare parcel intake rows for dispatch and OCR follow-up.
            </p>
          </div>

          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tracking no, sender, receiver, township, item"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 pl-11 text-sm outline-none"
            />
          </div>
        </div>

        <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200 bg-white/70">
          <table className="min-w-[1320px] w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-3 py-3 font-black">Tracking</th>
                <th className="px-3 py-3 font-black">Sender</th>
                <th className="px-3 py-3 font-black">Receiver</th>
                <th className="px-3 py-3 font-black">Phone</th>
                <th className="px-3 py-3 font-black">Township</th>
                <th className="px-3 py-3 font-black">Address</th>
                <th className="px-3 py-3 font-black">Item</th>
                <th className="px-3 py-3 font-black">Qty</th>
                <th className="px-3 py-3 font-black">Weight</th>
                <th className="px-3 py-3 font-black">Collectable</th>
                <th className="px-3 py-3 font-black">Note</th>
                <th className="px-3 py-3 font-black">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-2 py-2">
                    <input
                      value={row.trackingNo}
                      onChange={(e) => patchRow(row.id, "trackingNo", e.target.value)}
                      className="h-10 w-40 rounded-xl border border-slate-200 px-3"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      value={row.senderName}
                      onChange={(e) => patchRow(row.id, "senderName", e.target.value)}
                      className="h-10 w-36 rounded-xl border border-slate-200 px-3"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      value={row.receiverName}
                      onChange={(e) => patchRow(row.id, "receiverName", e.target.value)}
                      className="h-10 w-36 rounded-xl border border-slate-200 px-3"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      value={row.phone}
                      onChange={(e) => patchRow(row.id, "phone", e.target.value)}
                      className="h-10 w-32 rounded-xl border border-slate-200 px-3"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      value={row.township}
                      onChange={(e) => patchRow(row.id, "township", e.target.value)}
                      className="h-10 w-32 rounded-xl border border-slate-200 px-3"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      value={row.address}
                      onChange={(e) => patchRow(row.id, "address", e.target.value)}
                      className="h-10 w-52 rounded-xl border border-slate-200 px-3"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      value={row.itemName}
                      onChange={(e) => patchRow(row.id, "itemName", e.target.value)}
                      className="h-10 w-32 rounded-xl border border-slate-200 px-3"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      value={row.qty}
                      onChange={(e) => patchRow(row.id, "qty", Number(e.target.value) || 0)}
                      className="h-10 w-20 rounded-xl border border-slate-200 px-3"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      step="0.01"
                      value={row.weightKg}
                      onChange={(e) =>
                        patchRow(row.id, "weightKg", Number(e.target.value) || 0)
                      }
                      className="h-10 w-24 rounded-xl border border-slate-200 px-3"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      value={row.collectable}
                      onChange={(e) =>
                        patchRow(row.id, "collectable", Number(e.target.value) || 0)
                      }
                      className="h-10 w-24 rounded-xl border border-slate-200 px-3"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      value={row.note}
                      onChange={(e) => patchRow(row.id, "note", e.target.value)}
                      className="h-10 w-36 rounded-xl border border-slate-200 px-3"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      className="inline-flex h-10 items-center justify-center rounded-xl border border-rose-200 px-3 text-rose-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}