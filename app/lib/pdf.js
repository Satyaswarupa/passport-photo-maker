/**
 * Minimal PDF writer that embeds the sheet JPEG at an exact physical size.
 *
 * Why this exists: a raster file can only *suggest* its size through DPI
 * metadata, and print dialogs routinely ignore it — Windows Photos defaults to
 * "Full page photo", browsers default to "Fit to page" — which rescales the
 * sheet and ruins the millimetres. A PDF page has absolute geometry, so
 * printing it at "Actual size" reproduces 35 × 45 mm exactly.
 *
 * The JPEG is embedded with /DCTDecode, meaning the existing compressed bytes
 * are stored verbatim: no recompression, no quality loss, small file.
 */

const PT_PER_MM = 72 / 25.4;
const encoder = new TextEncoder();

/** PDF strings escape backslash and both parens. */
const escapeText = (value) => value.replace(/([\\()])/g, "\\$1");

export function buildPdf({ jpeg, widthPx, heightPx, widthMm, heightMm, title = "Passport photo sheet" }) {
  const pageW = (widthMm * PT_PER_MM).toFixed(4);
  const pageH = (heightMm * PT_PER_MM).toFixed(4);

  const chunks = [];
  let length = 0;
  const offsets = [];

  const push = (bytes) => {
    chunks.push(bytes);
    length += bytes.length;
  };
  const text = (value) => push(encoder.encode(value));
  /** Record where this object starts — the xref table must point exactly here. */
  const beginObject = (id) => {
    offsets[id] = length;
    text(`${id} 0 obj\n`);
  };

  text("%PDF-1.4\n");
  // Binary marker so tools treat the file as binary rather than text.
  push(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));

  beginObject(1);
  text("<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

  beginObject(2);
  text("<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");

  beginObject(3);
  text(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] ` +
      `/Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`
  );

  // The image occupies the whole page: scale the unit square to the page box.
  const content = `q\n${pageW} 0 0 ${pageH} 0 0 cm\n/Im0 Do\nQ\n`;
  const contentBytes = encoder.encode(content);

  beginObject(4);
  text(
    `<< /Type /XObject /Subtype /Image /Width ${widthPx} /Height ${heightPx} ` +
      `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode ` +
      `/Length ${jpeg.length} >>\nstream\n`
  );
  push(jpeg);
  text("\nendstream\nendobj\n");

  beginObject(5);
  text(`<< /Length ${contentBytes.length} >>\nstream\n`);
  push(contentBytes);
  text("\nendstream\nendobj\n");

  beginObject(6);
  text(
    `<< /Title (${escapeText(title)}) /Producer (Passport Photo Studio) ` +
      `/Creator (Passport Photo Studio) >>\nendobj\n`
  );

  const objectCount = 7; // objects 1-6 plus the free entry at index 0
  const xrefStart = length;
  text(`xref\n0 ${objectCount}\n`);
  text("0000000000 65535 f \n");
  for (let id = 1; id < objectCount; id++) {
    // Each entry must be exactly 20 bytes.
    text(`${String(offsets[id]).padStart(10, "0")} 00000 n \n`);
  }

  text(
    `trailer\n<< /Size ${objectCount} /Root 1 0 R /Info 6 0 R >>\n` +
      `startxref\n${xrefStart}\n%%EOF\n`
  );

  const out = new Uint8Array(length);
  let cursor = 0;
  for (const chunk of chunks) {
    out.set(chunk, cursor);
    cursor += chunk.length;
  }
  return out;
}

/** Wrap a canvas JPEG blob into a print-exact PDF of the given physical size. */
export async function jpegBlobToPdf(blob, { widthPx, heightPx, widthMm, heightMm, title }) {
  const jpeg = new Uint8Array(await blob.arrayBuffer());
  const pdf = buildPdf({ jpeg, widthPx, heightPx, widthMm, heightMm, title });
  return new Blob([pdf], { type: "application/pdf" });
}
