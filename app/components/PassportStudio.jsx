"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Dropzone from "./Dropzone";
import PhotoAdjuster from "./PhotoAdjuster";
import SheetPreview from "./SheetPreview";
import { removePhotoBackground } from "../lib/backgroundRemoval";
import { jpegBlobToPdf } from "../lib/pdf";
import {
  BG_PRESETS,
  DPI_OPTIONS,
  PAPER_SIZES,
  PHOTO_SIZES,
  getPaperSize,
  getPhotoSize,
} from "../lib/photoSizes";
import {
  IDENTITY_TRANSFORM,
  canvasToBlob,
  downloadBlob,
  layoutSheet,
  loadBitmap,
  mmToPx,
  normalizeUpload,
  renderSinglePhoto,
} from "../lib/render";

export default function PassportStudio() {
  const [sourceBitmap, setSourceBitmap] = useState(null);
  const [cutoutBitmap, setCutoutBitmap] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | working | ready | error
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const [bgMode, setBgMode] = useState("solid"); // solid | original
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [sizeId, setSizeId] = useState("35x45");
  const [paperId, setPaperId] = useState("4r");
  const [dpi, setDpi] = useState(300);
  const [copies, setCopies] = useState(null);
  const [showCutLines, setShowCutLines] = useState(true);
  const [showGuides, setShowGuides] = useState(true);
  const [transform, setTransform] = useState(IDENTITY_TRANSFORM);

  const sheetCanvasRef = useRef(null);

  const photo = getPhotoSize(sizeId);
  const paper = getPaperSize(paperId);

  const layout = useMemo(() => layoutSheet({ paper, photo }), [paper, photo]);
  const effectiveCopies = Math.min(copies ?? layout.capacity, layout.capacity);

  const activeBitmap = bgMode === "original" ? sourceBitmap : (cutoutBitmap ?? sourceBitmap);
  const activeBg = bgMode === "original" ? null : bgColor;
  const hasPhoto = Boolean(activeBitmap);

  const handleFile = useCallback(async (file) => {
    setError(null);
    setNotice(null);
    setStatus("working");
    setProgress({ stage: "Preparing photo", ratio: 0 });
    setCutoutBitmap(null);
    setTransform(IDENTITY_TRANSFORM);

    try {
      const normalized = await normalizeUpload(file);
      const bitmap = await loadBitmap(normalized);
      setSourceBitmap(bitmap);

      setProgress({ stage: "Removing background", ratio: 0 });
      const cutout = await removePhotoBackground(normalized, setProgress);
      setCutoutBitmap(await loadBitmap(cutout));
      setStatus("ready");
    } catch (e) {
      console.error(e);
      setError(
        "Background removal failed. You can still use the photo with its original background."
      );
      setBgMode("original");
      setStatus("error");
    } finally {
      setProgress(null);
    }
  }, []);

  const reset = () => {
    setSourceBitmap(null);
    setCutoutBitmap(null);
    setStatus("idle");
    setError(null);
    setNotice(null);
    setTransform(IDENTITY_TRANSFORM);
    setBgMode("solid");
  };

  const downloadSheet = async (type) => {
    const canvas = sheetCanvasRef.current;
    if (!canvas) return;
    const blob = await canvasToBlob(canvas, { type, dpi });
    const ext = type === "image/png" ? "png" : "jpg";
    downloadBlob(blob, `passport-${photo.id}-${paper.id}-sheet.${ext}`);
  };

  /**
   * The reliable print path. A PDF page carries absolute physical dimensions,
   * so printing it at "Actual size" reproduces the millimetres exactly —
   * unlike a JPEG, whose DPI tag print dialogs routinely override.
   */
  const sheetPdfBlob = async () => {
    const canvas = sheetCanvasRef.current;
    if (!canvas) return null;
    const jpegBlob = await canvasToBlob(canvas, { type: "image/jpeg", dpi });
    return jpegBlobToPdf(jpegBlob, {
      widthPx: canvas.width,
      heightPx: canvas.height,
      widthMm: layout.sheetW,
      heightMm: layout.sheetH,
      title: `${effectiveCopies} passport photos ${photo.w}x${photo.h}mm on ${paper.label}`,
    });
  };

  const downloadPdf = async () => {
    const blob = await sheetPdfBlob();
    if (blob) downloadBlob(blob, `passport-${photo.id}-${paper.id}-sheet.pdf`);
  };

  const downloadSingle = async () => {
    if (!activeBitmap) return;
    const canvas = document.createElement("canvas");
    renderSinglePhoto({ canvas, bitmap: activeBitmap, photo, dpi, transform, bgColor: activeBg });
    const blob = await canvasToBlob(canvas, { type: "image/png", dpi });
    downloadBlob(blob, `passport-${photo.id}.png`);
  };

  /**
   * Open the PDF in a new tab and let the built-in viewer print it. The PDF
   * carries the page size, so the only thing the user has to get right is
   * choosing "Actual size" instead of "Fit to page".
   */
  const print = async () => {
    setNotice(null);
    const blob = await sheetPdfBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const opened = window.open(url, "_blank");
    if (!opened) {
      URL.revokeObjectURL(url);
      setNotice(
        "Your browser blocked the new tab. Allow popups for this site, or use “Download PDF” and print that file."
      );
      return;
    }
    setNotice(
      "The PDF opened in a new tab. When you print it, set Scale to “Actual size” (not “Fit to page”)."
    );
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  /* ------------------------------- empty state ------------------------------ */

  if (!hasPhoto) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="nm-raised-lg rounded-3xl p-6 sm:p-8">
          <Dropzone onFile={handleFile} disabled={status === "working"} />
          {status === "working" && <ProgressBar progress={progress} />}
          {error && <Alert tone="danger">{error}</Alert>}
        </div>
      </div>
    );
  }

  /* -------------------------------- editor --------------------------------- */

  return (
    <div className="flex flex-col gap-6">
      <div className="nm-raised flex flex-wrap items-center justify-between gap-4 rounded-2xl px-5 py-4">
        <p className="text-sm text-nm-muted">
          <span className="font-semibold text-nm-text">{effectiveCopies} photos</span> ·{" "}
          {photo.w} × {photo.h} mm · {paper.label} · {dpi} DPI
        </p>
        <button onClick={reset} className="nm-btn rounded-xl px-4 py-2 text-sm font-semibold">
          Start over
        </button>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        {/* ------------------------------ controls ----------------------------- */}
        <div className="flex flex-col gap-6">
          <Panel title="Your photo">
            <PhotoAdjuster
              bitmap={activeBitmap}
              photo={photo}
              bgColor={activeBg}
              transform={transform}
              onChange={setTransform}
              showGuides={showGuides}
            />
            <CheckRow
              checked={showGuides}
              onChange={setShowGuides}
              label="Show face position guides"
            />
            {status === "working" && <ProgressBar progress={progress} />}
            {error && <Alert tone="danger">{error}</Alert>}
          </Panel>

          <Panel title="Background">
            <div className="mb-4 grid grid-cols-2 gap-3">
              <button
                onClick={() => setBgMode("solid")}
                disabled={!cutoutBitmap}
                className={`nm-btn rounded-xl px-3 py-2.5 text-sm font-semibold ${
                  bgMode === "solid" ? "nm-btn-active" : ""
                }`}
              >
                Solid colour
              </button>
              <button
                onClick={() => setBgMode("original")}
                className={`nm-btn rounded-xl px-3 py-2.5 text-sm font-semibold ${
                  bgMode === "original" ? "nm-btn-active" : ""
                }`}
              >
                Original
              </button>
            </div>

            {bgMode === "solid" && (
              <>
                <div className="grid grid-cols-4 gap-3">
                  {BG_PRESETS.map((preset) => {
                    const selected = bgColor.toUpperCase() === preset.color;
                    return (
                      <button
                        key={preset.id}
                        title={preset.label}
                        aria-label={preset.label}
                        aria-pressed={selected}
                        onClick={() => setBgColor(preset.color)}
                        // outline, not ring: ring composes into box-shadow,
                        // which the neumorphic classes already own.
                        className={`nm-raised-sm aspect-square rounded-xl transition ${
                          selected
                            ? "scale-95 outline-2 outline-offset-2 outline-nm-accent"
                            : "hover:scale-105"
                        }`}
                        style={{ background: preset.color }}
                      />
                    );
                  })}
                </div>

                <div className="nm-inset mt-4 flex items-center gap-3 rounded-xl px-4 py-3">
                  <span className="text-sm text-nm-muted">Custom</span>
                  <input
                    type="color"
                    value={bgColor}
                    aria-label="Custom background colour"
                    onChange={(e) => setBgColor(e.target.value.toUpperCase())}
                    className="h-8 w-12 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                  />
                  <span className="ml-auto font-mono text-xs text-nm-muted">{bgColor}</span>
                </div>
              </>
            )}

            {!cutoutBitmap && status !== "working" && (
              <p className="mt-3 text-xs text-nm-muted">
                The background was not removed, so only the original is available.
              </p>
            )}
          </Panel>

          <Panel title="Photo size">
            <Select value={sizeId} onChange={setSizeId} label="Passport photo size">
              {PHOTO_SIZES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label} — {s.note}
                </option>
              ))}
            </Select>
          </Panel>

          <Panel title="Photo paper">
            <Select value={paperId} onChange={setPaperId} label="Paper size">
              {PAPER_SIZES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label} — {p.note}
                </option>
              ))}
            </Select>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <Field label="Copies">
                <Select
                  value={String(effectiveCopies)}
                  onChange={(v) => setCopies(Number(v))}
                  disabled={layout.capacity === 0}
                  label="Number of copies"
                >
                  {Array.from({ length: layout.capacity }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Resolution">
                <Select value={String(dpi)} onChange={(v) => setDpi(Number(v))} label="Print resolution">
                  {DPI_OPTIONS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <CheckRow checked={showCutLines} onChange={setShowCutLines} label="Show cutting guides" />
          </Panel>
        </div>

        {/* ------------------------------ preview ------------------------------ */}
        <div className="flex flex-col gap-6">
          <Panel
            title="Print sheet preview"
            aside={`${layout.cols} × ${layout.rows} grid · ${effectiveCopies} photos`}
          >
            {layout.capacity === 0 ? (
              <Alert tone="warn">
                {photo.label} does not fit on {paper.label}. Pick a larger paper size.
              </Alert>
            ) : (
              <SheetPreview
                canvasRef={sheetCanvasRef}
                bitmap={activeBitmap}
                paper={paper}
                photo={photo}
                dpi={dpi}
                transform={transform}
                bgColor={activeBg}
                copies={effectiveCopies}
                showCutLines={showCutLines}
              />
            )}
          </Panel>

          <Panel title="Download">
            <div className="mb-4 flex flex-wrap gap-3">
              <button
                onClick={downloadPdf}
                disabled={layout.capacity === 0}
                className="nm-btn nm-btn-accent rounded-xl px-5 py-3 text-sm font-bold"
              >
                Download PDF — print this
              </button>
              <button
                onClick={print}
                disabled={layout.capacity === 0}
                className="nm-btn rounded-xl px-5 py-3 text-sm font-semibold"
              >
                Open &amp; print
              </button>
            </div>

            <p className="mb-4 text-xs text-nm-muted">
              For a photo lab, send an image file instead:
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => downloadSheet("image/jpeg")}
                disabled={layout.capacity === 0}
                className="nm-btn rounded-xl px-4 py-2.5 text-sm font-semibold"
              >
                JPG
              </button>
              <button
                onClick={() => downloadSheet("image/png")}
                disabled={layout.capacity === 0}
                className="nm-btn rounded-xl px-4 py-2.5 text-sm font-semibold"
              >
                PNG
              </button>
              <button
                onClick={downloadSingle}
                className="nm-btn rounded-xl px-4 py-2.5 text-sm font-semibold"
              >
                Single photo
              </button>
            </div>

            {notice && <Alert tone="warn">{notice}</Alert>}

            <div className="nm-inset mt-5 rounded-xl p-4 text-xs leading-relaxed text-nm-muted">
              <p className="mb-1.5 font-bold text-nm-text">Printing at the right size</p>
              <p className="mb-2">
                <strong className="text-nm-text">Use the PDF.</strong> Its page is exactly{" "}
                {layout.sheetW} × {layout.sheetH} mm, so any PDF reader prints it at the correct
                size. In the print dialog choose{" "}
                <strong className="text-nm-text">Actual size</strong> (or “100%”, or “Scale: None”)
                — never “Fit to page” or “Full page photo”.
              </p>
              <p>
                The JPG and PNG are {mmToPx(layout.sheetW, dpi)} × {mmToPx(layout.sheetH, dpi)} px
                tagged at {dpi} DPI, which is what a photo lab wants for a {paper.label} print. They
                are less reliable for home printing, because image viewers often rescale them to
                fill the paper. Measure one photo after printing: it should be exactly {photo.w} ×{" "}
                {photo.h} mm.
              </p>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- building blocks ---------------------------- */

function Panel({ title, aside, children }) {
  return (
    <section className="nm-raised rounded-2xl p-5">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-nm-muted">{title}</h3>
        {aside && <span className="text-xs text-nm-muted">{aside}</span>}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-nm-muted">{label}</span>
      {children}
    </label>
  );
}

function Select({ value, onChange, children, disabled, label }) {
  return (
    <select
      value={value}
      disabled={disabled}
      aria-label={label}
      onChange={(e) => onChange(e.target.value)}
      className="nm-select w-full cursor-pointer rounded-xl px-4 py-3 pr-10 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-45"
    >
      {children}
    </select>
  );
}

function CheckRow({ checked, onChange, label }) {
  return (
    <label className="mt-4 flex cursor-pointer items-center gap-3 text-sm text-nm-muted">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="nm-check"
      />
      {label}
    </label>
  );
}

function Alert({ tone = "danger", children }) {
  const styles =
    tone === "warn"
      ? { background: "var(--nm-warn-bg)", color: "var(--nm-warn-text)" }
      : { color: "var(--nm-danger)" };
  return (
    <p className="nm-inset mt-4 rounded-xl px-4 py-3 text-sm" style={styles}>
      {children}
    </p>
  );
}

function ProgressBar({ progress }) {
  const pct = Math.round((progress?.ratio ?? 0) * 100);
  return (
    <div className="mt-5">
      <div className="mb-2 flex justify-between text-xs font-medium text-nm-muted">
        <span>{progress?.stage ?? "Working"}…</span>
        <span>{pct}%</span>
      </div>
      <div className="nm-inset h-3 overflow-hidden rounded-full p-0.5">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${Math.max(4, pct)}%`, background: "var(--nm-accent)" }}
        />
      </div>
      <p className="mt-2.5 text-xs text-nm-muted">
        The AI model downloads once on first use, then runs offline in your browser.
      </p>
    </div>
  );
}
