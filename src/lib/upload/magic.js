// src/lib/upload/magic.js — file type by magic bytes (never trust the
// browser's MIME type or the file name). Needs the first 16 bytes.
// Works on a Node Buffer (server, the binding check) and on a plain
// Uint8Array (browser pre-check in components/Upload/UploadClient.js, QA fix1
// P2-3: a renamed .exe is refused before any byte is uploaded). Same rules for
// both; the server check stays the binding one.

const VIDEO_BRANDS = new Set([
  "isom", "iso2", "iso4", "iso5", "iso6", "mp41", "mp42", "avc1", "M4V ", "M4VH", "M4VP",
  "qt  ", "3gp4", "3gp5", "3gp6", "3g2a", "dash", "MSNV", "f4v ", "mmp4",
]);
const HEIF_BRANDS = new Set(["heic", "heix", "hevc", "hevx", "heim", "heis", "mif1", "msf1"]);
const AVIF_BRANDS = new Set(["avif", "avis"]);

const ascii = (buf, start, end) => String.fromCharCode(...buf.subarray(start, end));
const u32 = (buf, at) => ((buf[at] << 24) | (buf[at + 1] << 16) | (buf[at + 2] << 8) | buf[at + 3]) >>> 0;

/** @returns {{ mime: string, ext: string, family: "image"|"video"|"pdf" } | null} */
export function detectType(buf) {
  if (!buf || buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { mime: "image/jpeg", ext: "jpg", family: "image" };
  if (u32(buf, 0) === 0x89504e47 && u32(buf, 4) === 0x0d0a1a0a) return { mime: "image/png", ext: "png", family: "image" };
  if (ascii(buf, 0, 4) === "RIFF" && ascii(buf, 8, 12) === "WEBP") return { mime: "image/webp", ext: "webp", family: "image" };
  if (ascii(buf, 0, 5) === "%PDF-") return { mime: "application/pdf", ext: "pdf", family: "pdf" };
  if (u32(buf, 0) === 0x1a45dfa3) return { mime: "video/webm", ext: "webm", family: "video" };
  if (ascii(buf, 4, 8) === "ftyp") {
    const brand = ascii(buf, 8, 12);
    if (HEIF_BRANDS.has(brand)) return { mime: "image/heic", ext: "heic", family: "image" };
    if (AVIF_BRANDS.has(brand)) return { mime: "image/avif", ext: "avif", family: "image" };
    if (brand === "qt  ") return { mime: "video/quicktime", ext: "mov", family: "video" };
    if (brand.startsWith("3g")) return { mime: "video/3gpp", ext: "3gp", family: "video" };
    if (VIDEO_BRANDS.has(brand)) return { mime: "video/mp4", ext: "mp4", family: "video" };
    return null;
  }
  // Old QuickTime files without an ftyp box start straight with an atom.
  if (["moov", "mdat", "wide", "free"].includes(ascii(buf, 4, 8))) return { mime: "video/quicktime", ext: "mov", family: "video" };
  return null;
}
