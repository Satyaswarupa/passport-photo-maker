import { withDpi } from "./dpiMetadata";

export const MM_PER_INCH = 25.4;

export const mmToPx = (mm, dpi) => Math.round((mm / MM_PER_INCH) * dpi);

/** Default transform: image fills the frame, centred. */
export const IDENTITY_TRANSFORM = { zoom: 1, tx: 0, ty: 0 };

/**
 * Spacing between photos, and the smallest edge margin the fit calculation
 * will accept. Whatever slack is left after the grid is laid out is split
 * evenly, so the real margin is usually larger than MARGIN_MM.
 *
 * 2.5 mm is deliberate. On 4R a 35 × 45 mm photo leaves 12.4 mm of horizontal
 * slack to share between 3 gaps and 2 margins — five spaces — so 2.5 mm
 * spreads it almost perfectly evenly (2.5 mm gaps, 2.45 mm margins) and still
 * keeps the 4 × 2 = 8 grid. Going wider costs the outer margin fast: at 3 mm
 * only 1.7 mm is left at the edge, which borderless lab printing can trim
 * into, and past 3.4 mm the grid collapses to 3 × 2 = 6.
 */
export const GAP_MM = 2.5;
export const MARGIN_MM = 1;

/**
 * Load any Blob/File into an ImageBitmap with the EXIF orientation already
 * baked in, so a photo shot on a phone is never drawn sideways.
 */
export async function loadBitmap(blob) {
  return createImageBitmap(blob, { imageOrientation: "from-image" });
}

/**
 * Re-encode an uploaded file to a PNG that is orientation-correct and no
 * larger than `maxSide`. Keeps the AI step fast and every later draw honest.
 */
export async function normalizeUpload(file, maxSide = 2000) {
  const bitmap = await loadBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

/**
 * Draw one photo into a frame of `frameW × frameH` device pixels.
 *
 * The transform is resolution independent: `zoom` multiplies the "cover"
 * scale, and `tx`/`ty` are offsets expressed as a fraction of the frame, so
 * the same numbers drive the small on-screen preview and the 300 DPI export.
 */
export function drawPhoto(ctx, bitmap, frameW, frameH, transform, bgColor) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, frameW, frameH);
  ctx.clip();

  if (bgColor) {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, frameW, frameH);
  } else {
    ctx.clearRect(0, 0, frameW, frameH);
  }

  const cover = Math.max(frameW / bitmap.width, frameH / bitmap.height);
  const scale = cover * transform.zoom;
  const w = bitmap.width * scale;
  const h = bitmap.height * scale;
  const x = (frameW - w) / 2 + transform.tx * frameW;
  const y = (frameH - h) / 2 + transform.ty * frameH;

  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, x, y, w, h);
  ctx.restore();
}

/**
 * How many photos fit on the sheet, and where they go.
 * Both paper orientations are tried and the one holding more photos wins,
 * which is why 35 × 45 mm lands as 4 × 2 = 8 photos on 4R paper.
 */
export function layoutSheet({ paper, photo, gapMm = GAP_MM, marginMm = MARGIN_MM }) {
  const orientations = [
    { w: paper.w, h: paper.h },
    { w: paper.h, h: paper.w },
  ];

  let best = null;
  for (const o of orientations) {
    const cols = Math.floor((o.w - 2 * marginMm + gapMm) / (photo.w + gapMm));
    const rows = Math.floor((o.h - 2 * marginMm + gapMm) / (photo.h + gapMm));
    const capacity = Math.max(0, cols) * Math.max(0, rows);
    if (!best || capacity > best.capacity) {
      best = { ...o, cols: Math.max(0, cols), rows: Math.max(0, rows), capacity };
    }
  }

  const blockW = best.cols * photo.w + Math.max(0, best.cols - 1) * gapMm;
  const blockH = best.rows * photo.h + Math.max(0, best.rows - 1) * gapMm;

  return {
    sheetW: best.w,
    sheetH: best.h,
    cols: best.cols,
    rows: best.rows,
    capacity: best.capacity,
    originX: (best.w - blockW) / 2,
    originY: (best.h - blockH) / 2,
    gapMm,
  };
}

/** Render a single passport photo at its true print size. */
export function renderSinglePhoto({ canvas, bitmap, photo, dpi, transform, bgColor }) {
  const w = mmToPx(photo.w, dpi);
  const h = mmToPx(photo.h, dpi);
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  drawPhoto(ctx, bitmap, w, h, transform, bgColor);
  return canvas;
}

/**
 * Render the full print sheet: the photo grid plus the cutting guides.
 */
export function renderSheet({
  canvas,
  bitmap,
  paper,
  photo,
  dpi,
  transform,
  bgColor,
  copies,
  showCutLines = true,
  gapMm = GAP_MM,
  marginMm = MARGIN_MM,
}) {
  const layout = layoutSheet({ paper, photo, gapMm, marginMm });
  const px = (mm) => (mm / MM_PER_INCH) * dpi;

  canvas.width = mmToPx(layout.sheetW, dpi);
  canvas.height = mmToPx(layout.sheetH, dpi);

  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cellW = px(photo.w);
  const cellH = px(photo.h);
  const total = Math.min(copies ?? layout.capacity, layout.capacity);

  let placed = 0;
  const positions = [];
  for (let row = 0; row < layout.rows && placed < total; row++) {
    for (let col = 0; col < layout.cols && placed < total; col++) {
      const x = px(layout.originX + col * (photo.w + gapMm));
      const y = px(layout.originY + row * (photo.h + gapMm));
      positions.push({ x, y });

      ctx.save();
      ctx.translate(x, y);
      drawPhoto(ctx, bitmap, cellW, cellH, transform, bgColor);
      ctx.restore();
      placed++;
    }
  }

  if (showCutLines && positions.length) {
    drawCutGuides(ctx, {
      positions,
      cellW,
      cellH,
      overhang: px(2),
      lineScale: Math.max(1, dpi / 300),
      sheetW: canvas.width,
      sheetH: canvas.height,
    });
  }

  return { canvas, layout, placed };
}

/**
 * Cutting grid: one continuous line along every photo edge, running the full
 * width and height of the block and overhanging into the margin.
 *
 * Because the grid is regular, every photo in a column shares the same two
 * vertical edges and every photo in a row shares the same two horizontal
 * ones, so these lines only ever travel along a photo edge or through the
 * gap between photos — never across an image. That means a ruler or guillotine
 * can be lined up once and drawn straight across the whole sheet, which is far
 * easier than following separate marks around each photo.
 *
 * Each pair of neighbours gets two lines with the gap between them: cut both
 * and discard the thin offcut, and every photo keeps its full size.
 */
function drawCutGuides(ctx, { positions, cellW, cellH, overhang, lineScale, sheetW, sheetH }) {
  const uniq = (values) => [...new Set(values.map((v) => Math.round(v)))].sort((a, b) => a - b);
  const lefts = uniq(positions.map((p) => p.x));
  const tops = uniq(positions.map((p) => p.y));

  // Half-pixel offset keeps a 1px line crisp instead of smeared over two.
  const snap = (v) => Math.round(v) + 0.5;
  const clampX = (v) => Math.max(0, Math.min(sheetW, v));
  const clampY = (v) => Math.max(0, Math.min(sheetH, v));

  const spanTop = clampY(tops[0] - overhang);
  const spanBottom = clampY(tops[tops.length - 1] + cellH + overhang);
  const spanLeft = clampX(lefts[0] - overhang);
  const spanRight = clampX(lefts[lefts.length - 1] + cellW + overhang);

  ctx.save();
  ctx.strokeStyle = "rgba(145,145,145,0.75)";
  ctx.lineWidth = lineScale;
  ctx.setLineDash([]);

  for (const left of lefts) {
    for (const x of [left, left + cellW]) {
      ctx.beginPath();
      ctx.moveTo(snap(x), spanTop);
      ctx.lineTo(snap(x), spanBottom);
      ctx.stroke();
    }
  }

  for (const top of tops) {
    for (const y of [top, top + cellH]) {
      ctx.beginPath();
      ctx.moveTo(spanLeft, snap(y));
      ctx.lineTo(spanRight, snap(y));
      ctx.stroke();
    }
  }

  ctx.restore();
}

/**
 * Encode a canvas, then write the real DPI into the file so anything that
 * prints it knows the intended physical size instead of assuming 72 DPI.
 */
export async function canvasToBlob(canvas, { type = "image/jpeg", quality = 0.95, dpi } = {}) {
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, type, quality));
  return dpi ? withDpi(blob, dpi) : blob;
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Open the sheet in a print window sized to the exact paper dimensions.
 *
 * `@page size` only sets the *preferred* paper; the browser's own "Fit to
 * page" scaling still silently shrinks the output by a few percent, which is
 * enough to make a 45 mm photo come out at 43 mm. Nothing in CSS can override
 * that, so the checklist is shown on screen (and hidden from the print) and
 * the user presses Print themselves rather than the dialog auto-opening
 * over the top of the warning.
 *
 * Returns false if the popup was blocked so the caller can say so.
 */
export function printSheet(imageUrl, widthMm, heightMm, photoLabel) {
  const win = window.open("", "_blank");
  if (!win) return false;

  win.document.write(`<!doctype html><html><head><meta charset="utf-8">
    <title>Print sheet — ${widthMm} × ${heightMm} mm</title>
    <style>
      @page { size: ${widthMm}mm ${heightMm}mm; margin: 0; }
      html, body { margin: 0; padding: 0; background: #f4f4f5;
        font-family: system-ui, -apple-system, Segoe UI, sans-serif; }
      .hint { max-width: 34rem; margin: 0 auto; padding: 1.5rem 1.25rem 0.5rem; color: #27272a; }
      .hint h1 { font-size: 1rem; margin: 0 0 .5rem; }
      .hint ol { margin: 0; padding-left: 1.2rem; font-size: .875rem; line-height: 1.7; }
      .hint b { color: #b91c1c; }
      button { margin: 1rem 0 1.5rem; padding: .6rem 1.4rem; font-size: .9rem; font-weight: 600;
        color: #fff; background: #2563eb; border: 0; border-radius: .5rem; cursor: pointer; }
      .sheet { display: block; margin: 0 auto 3rem; background: #fff; box-shadow: 0 2px 12px rgba(0,0,0,.18); }
      img { width: ${widthMm}mm; height: ${heightMm}mm; display: block; }
      @media print {
        html, body { background: #fff; }
        .hint, button { display: none !important; }
        .sheet { margin: 0; box-shadow: none; }
        img { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    </style></head>
    <body>
      <div class="hint">
        <h1>Before you print</h1>
        <ol>
          <li>Set <b>Scale</b> to <b>100%</b> — not “Fit to page”, or the photos come out undersized.</li>
          <li>Choose the <b>${widthMm} × ${heightMm} mm</b> paper size in the printer settings.</li>
          <li>Turn <b>off</b> any “fit to printable area” or auto-rotate option.</li>
          <li>After printing, measure one photo: it should be exactly ${photoLabel}.</li>
        </ol>
        <button onclick="window.print()">Print now</button>
      </div>
      <div class="sheet"><img src="${imageUrl}" alt="Passport photo sheet"></div>
    </body></html>`);
  win.document.close();
  win.focus();
  return true;
}
