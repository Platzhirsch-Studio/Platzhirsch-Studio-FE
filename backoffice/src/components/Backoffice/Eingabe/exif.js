// Aufnahmezeit aus JPEG-EXIF lesen (G-30 FotoAufnahme) – reine Logik, ohne Bibliothek.
// Liest DateTimeOriginal (0x9003), sonst DateTime (0x0132). Ergebnis "JJJJ-MM-TT HH:MM" oder null.

const TAG_EXIF_IFD = 0x8769;
const TAG_DATETIME = 0x0132;
const TAG_ORIGINAL = 0x9003;

/**
 * @param {ArrayBuffer|Uint8Array} puffer  mindestens die ersten ~128 KB der Datei
 * @returns {string|null}
 */
export function exifZeit(puffer) {
  try {
    const bytes = puffer instanceof Uint8Array ? puffer : new Uint8Array(puffer);
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    if (dv.getUint16(0) !== 0xffd8) return null;
    let off = 2;
    while (off + 4 < dv.byteLength) {
      const marker = dv.getUint16(off);
      if ((marker & 0xff00) !== 0xff00) return null;
      const laenge = dv.getUint16(off + 2);
      if (marker === 0xffe1 && text(bytes, off + 4, 4) === "Exif") return ausTiff(dv, bytes, off + 10);
      if (marker === 0xffda) return null; // Bilddaten beginnen – kein EXIF
      off += 2 + laenge;
    }
  } catch {
    // beschädigt oder abgeschnitten
  }
  return null;
}

function text(bytes, start, n) {
  let s = "";
  for (let i = 0; i < n && start + i < bytes.length; i++) s += String.fromCharCode(bytes[start + i]);
  return s;
}

function ausTiff(dv, bytes, tiff) {
  const le = dv.getUint16(tiff) === 0x4949;
  const u16 = (o) => dv.getUint16(o, le);
  const u32 = (o) => dv.getUint32(o, le);
  if (u16(tiff + 2) !== 42) return null;
  const lies = (ifd) => {
    const werte = {};
    const n = u16(ifd);
    for (let i = 0; i < n; i++) {
      const e = ifd + 2 + i * 12;
      const tag = u16(e);
      const typ = u16(e + 2);
      const anzahl = u32(e + 4);
      if (tag === TAG_EXIF_IFD) werte.exif = tiff + u32(e + 8);
      if ((tag === TAG_DATETIME || tag === TAG_ORIGINAL) && typ === 2 && anzahl >= 19) werte[tag] = text(bytes, tiff + u32(e + 8), 19);
    }
    return werte;
  };
  const ifd0 = lies(tiff + u32(tiff + 4));
  const exif = ifd0.exif ? lies(ifd0.exif) : {};
  return formatiere(exif[TAG_ORIGINAL] || ifd0[TAG_DATETIME] || "");
}

/** "2026:11:04 14:32:10" → "2026-11-04 14:32" */
export function formatiere(roh) {
  const m = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2})/.exec(roh || "");
  if (!m || m[1] === "0000") return null;
  return `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}`;
}
