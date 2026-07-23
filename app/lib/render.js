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
