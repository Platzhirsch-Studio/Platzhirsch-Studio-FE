// src/lib/upload/exif.js — removes GPS data from JPEG photos without an
// extra package. Works IN PLACE (same byte length): the GPS IFD of the Exif
// block and its out-of-line values are zeroed, and an XMP packet that
// mentions GPS is blanked with spaces. Image data, orientation and other Exif
// tags stay untouched. HEIC/PNG/WebP are NOT rewritten (see feature doc).

const TYPE_SIZE = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8, 11: 4, 12: 8 };
const XMP_HEADER = "http://ns.adobe.com/xap/1.0/\0";

function wipeExifGps(buf, tiff, segEnd) {
  const order = buf.toString("latin1", tiff, tiff + 2);
  if (order !== "II" && order !== "MM") return false;
  const le = order === "II";
  const r16 = (o) => (le ? buf.readUInt16LE(o) : buf.readUInt16BE(o));
  const r32 = (o) => (le ? buf.readUInt32LE(o) : buf.readUInt32BE(o));
  const inside = (o, len) => o >= tiff && o + len <= segEnd;

  const ifd0 = tiff + r32(tiff + 4);
  if (!inside(ifd0, 2)) return false;
  const count = r16(ifd0);
  for (let i = 0; i < count; i++) {
    const entry = ifd0 + 2 + i * 12;
    if (!inside(entry, 12)) return false;
    if (r16(entry) !== 0x8825) continue;
    const gps = tiff + r32(entry + 8);
    if (!inside(gps, 2)) return false;
    const n = r16(gps);
    for (let j = 0; j < n; j++) {
      const e = gps + 2 + j * 12;
      if (!inside(e, 12)) break;
      const size = (TYPE_SIZE[r16(e + 2)] || 1) * r32(e + 4);
      if (size > 4) {
        const data = tiff + r32(e + 8);
        if (inside(data, size)) buf.fill(0, data, data + size);
      }
      buf.fill(0, e, e + 12);
    }
    // Empty GPS IFD (count 0; the zeroed bytes after it read as "no next IFD").
    buf.fill(0, gps, gps + 2);
    return true;
  }
  return false;
}

/** @returns {{ hadGps: boolean }} — mutates `buf`. */
export function stripJpegGps(buf) {
  let hadGps = false;
  if (!(buf[0] === 0xff && buf[1] === 0xd8)) return { hadGps };
  let o = 2;
  while (o + 4 <= buf.length) {
    if (buf[o] !== 0xff) break;
    const marker = buf[o + 1];
    if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) { o += 2; continue; }
    if (marker === 0xda || marker === 0xd9) break; // image data starts: no more metadata
    const len = buf.readUInt16BE(o + 2);
    const start = o + 4;
    const end = o + 2 + len;
    if (len < 2 || end > buf.length) break;
    if (marker === 0xe1) {
      if (buf.toString("latin1", start, start + 6) === "Exif\0\0") {
        if (wipeExifGps(buf, start + 6, end)) hadGps = true;
      } else if (buf.toString("latin1", start, start + XMP_HEADER.length) === XMP_HEADER) {
        const xmp = buf.toString("latin1", start + XMP_HEADER.length, end);
        if (/GPS(Latitude|Longitude|Altitude)/i.test(xmp)) {
          buf.fill(0x20, start + XMP_HEADER.length, end);
          hadGps = true;
        }
      }
    }
    o = end;
  }
  return { hadGps };
}
