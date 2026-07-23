/**
 * `canvas.toBlob()` produces files with no physical-size metadata: a JPEG gets
 * a JFIF header with "aspect ratio only" density, and a PNG gets no pHYs chunk
 * at all. Anything that prints the file then assumes 72 DPI and scales it to
 * roughly four times the intended size.
 *
 * These helpers patch the real DPI into the encoded bytes, so the sheet prints
 * at its true physical size in photo labs, Windows Photos, Word, Preview, etc.
 */

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const INCH_PER_METRE = 39.3701;

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

const isPng = (b) => PNG_SIGNATURE.every((byte, i) => b[i] === byte);
const isJpeg = (b) => b[0] === 0xff && b[1] === 0xd8;

/** JFIF stores density directly in DPI when the unit byte is 1. */
export function setJpegDpi(bytes, dpi) {
  if (!isJpeg(bytes)) return bytes;

  const hasJfifApp0 =
    bytes[2] === 0xff &&
    bytes[3] === 0xe0 &&
    bytes[6] === 0x4a && // J
    bytes[7] === 0x46 && // F
    bytes[8] === 0x49 && // I
    bytes[9] === 0x46 && // F
    bytes[10] === 0x00;

  if (hasJfifApp0) {
    const out = bytes.slice();
    out[13] = 1; // density units: pixels per inch
    out[14] = (dpi >> 8) & 0xff;
    out[15] = dpi & 0xff;
    out[16] = (dpi >> 8) & 0xff;
    out[17] = dpi & 0xff;
    return out;
  }

  // No JFIF header — splice a complete APP0 segment in right after the SOI.
  const app0 = new Uint8Array([
    0xff, 0xe0,
    0x00, 0x10, // segment length (16)
    0x4a, 0x46, 0x49, 0x46, 0x00, // "JFIF\0"
    0x01, 0x02, // version 1.2
    0x01, // units: pixels per inch
    (dpi >> 8) & 0xff, dpi & 0xff,
    (dpi >> 8) & 0xff, dpi & 0xff,
    0x00, 0x00, // no thumbnail
  ]);

  const out = new Uint8Array(bytes.length + app0.length);
  out.set(bytes.subarray(0, 2), 0);
  out.set(app0, 2);
  out.set(bytes.subarray(2), 2 + app0.length);
  return out;
}

/** PNG stores resolution as pixels per metre in a pHYs chunk. */
export function setPngDpi(bytes, dpi) {
  if (!isPng(bytes)) return bytes;

  const ppu = Math.round(dpi * INCH_PER_METRE);
  const chunk = new Uint8Array(21);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, 9); // data length
  chunk.set([0x70, 0x48, 0x59, 0x73], 4); // "pHYs"
  view.setUint32(8, ppu);
  view.setUint32(12, ppu);
  chunk[16] = 1; // unit: metre
  view.setUint32(17, crc32(chunk.subarray(4, 17)));

  // Walk the chunk list looking for an existing pHYs to replace.
  const source = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 8;
  let replaceAt = -1;
  while (offset + 8 <= bytes.length) {
    const length = source.getUint32(offset);
    const type = String.fromCharCode(
      bytes[offset + 4], bytes[offset + 5], bytes[offset + 6], bytes[offset + 7]
    );
    if (type === "pHYs") {
      replaceAt = offset;
      break;
    }
    if (type === "IDAT" || type === "IEND") break;
    offset += 12 + length;
  }

  if (replaceAt >= 0) {
    const out = bytes.slice();
    out.set(chunk, replaceAt);
    return out;
  }

  // Otherwise insert directly after IHDR, which is always the first chunk.
  const insertAt = 8 + 12 + 13;
  const out = new Uint8Array(bytes.length + chunk.length);
  out.set(bytes.subarray(0, insertAt), 0);
  out.set(chunk, insertAt);
  out.set(bytes.subarray(insertAt), insertAt + chunk.length);
  return out;
}

export function setDpi(bytes, dpi) {
  if (isPng(bytes)) return setPngDpi(bytes, dpi);
  if (isJpeg(bytes)) return setJpegDpi(bytes, dpi);
  return bytes;
}

/** Re-wrap a canvas blob with correct DPI metadata baked into the bytes. */
export async function withDpi(blob, dpi) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const patched = setDpi(bytes, dpi);
  return new Blob([patched], { type: blob.type });
}
