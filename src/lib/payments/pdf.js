// src/lib/payments/pdf.js
// Gutschein als PDF (A5 quer), ohne Zusatzpaket: kleiner PDF-1.4-Schreiber.
// Druck 02.11.: Gestaltung nach Design-Bibel mit den Hausschriften der
// Website – Bodoni Moda (Titel, Widmung) und Instrument Sans (Text), beide
// SIL OFL 1.1 (src/lib/stilfinder/fonts, Einbettung erlaubt). Die TTF-Dateien
// werden als TrueType mit WinAnsi-Kodierung eingebettet (Umlaute, ß, €, „“, –);
// fehlen sie, fällt der Schreiber auf Helvetica zurück, damit nie ein
// Gutschein ausbleibt. Wortmarke als Vektorpfad (components/Brand/brandPaths),
// Farben = Tailwind-Tokens aus globals.css (paper, bone, ink, brass-700 …).
// Keine Bilder, keine externen Ressourcen. Die finale Vorlage der drei Motive
// liefert das Team (Masterplan AP9); bis dahin zeichnet "seelicht" eine
// Horizontlinie, "geweih" ein schlichtes Zeichen, "schlicht" nichts.
// Testmodus: schmaler roter Streifen am oberen Blattrand, nie über Text.
// Keine "@/..."-Importe (node --test: tests/unit/stripe-payments.test.mjs).
import { readFileSync } from "node:fs";
import path from "node:path";
import { deflateSync } from "node:zlib";
import { FONT_DIR } from "../stilfinder/config.js";
import { ADDRESS } from "../site.js";
import { TAGLINE, WORDMARK } from "../../components/Brand/brandPaths.js";

const W = 595.28;
const H = 419.53;
const MX = 44; // Satzspiegel links/rechts
const FRAME = 16; // Haarlinien-Rahmen

// Tailwind-Tokens (globals.css) als PDF-RGB 0–1
const rgb = (hex) => [1, 3, 5].map((i) => (parseInt(hex.slice(i, i + 2), 16) / 255).toFixed(3)).join(" ");
const C = {
  paper: rgb("#faf8f4"),
  bone: rgb("#f7f5f1"),
  stoneDeep: rgb("#d8d2c8"),
  ink: rgb("#30373e"),
  inkSoft: rgb("#5c636a"),
  brass700: rgb("#7a5f17"),
  brass500: rgb("#9a7a2a"),
  error: rgb("#9b2c2c"),
  white: "1 1 1",
};

// WinAnsi-Sonderzeichen außerhalb von Latin-1 (Code → Zeichen).
const WIN_ANSI = { "€": 0x80, "‚": 0x82, "ƒ": 0x83, "„": 0x84, "…": 0x85, "†": 0x86, "‡": 0x87, "ˆ": 0x88, "‰": 0x89, "Š": 0x8a, "‹": 0x8b, "Œ": 0x8c, "Ž": 0x8e, "‘": 0x91, "’": 0x92, "“": 0x93, "”": 0x94, "•": 0x95, "–": 0x96, "—": 0x97, "˜": 0x98, "™": 0x99, "š": 0x9a, "›": 0x9b, "œ": 0x9c, "ž": 0x9e, "Ÿ": 0x9f };
const WIN_ANSI_UNICODE = Object.fromEntries(Object.entries(WIN_ANSI).map(([ch, code]) => [code, ch.codePointAt(0)]));
/** WinAnsi-Code (32–255) → Unicode-Codepoint. */
const unicodeOf = (code) => (code === 0xa0 ? 0x20 : code === 0xad ? 0x2d : (WIN_ANSI_UNICODE[code] ?? code));
/** Zeichen → WinAnsi-Code (unbekannt → "?"). */
function winAnsiCode(ch) {
  let code = WIN_ANSI[ch] ?? ch.codePointAt(0);
  if (code > 255) code = 0x3f;
  return code;
}

/** Text → PDF-String-Literal (nur ASCII, Rest als Oktal-Escape). */
export function pdfString(text) {
  let out = "(";
  for (const ch of String(text ?? "")) {
    const code = winAnsiCode(ch);
    if (code === 0x28 || code === 0x29 || code === 0x5c) out += `\\${ch}`;
    else if (code < 32 || code > 126) out += `\\${code.toString(8).padStart(3, "0")}`;
    else out += ch;
  }
  return `${out})`;
}

// ---------------------------------------------------------------- TrueType
/** Liest aus einer TTF-Datei, was die Einbettung braucht (cmap 3/1, hmtx, head, hhea, OS/2, post). */
export function parseTrueType(buf) {
  const u16 = (o) => buf.readUInt16BE(o);
  const i16 = (o) => buf.readInt16BE(o);
  const u32 = (o) => buf.readUInt32BE(o);
  const numTables = u16(4);
  const tables = {};
  for (let i = 0; i < numTables; i++) {
    const o = 12 + i * 16;
    tables[buf.toString("latin1", o, o + 4)] = { off: u32(o + 8), len: u32(o + 12) };
  }
  const need = ["head", "hhea", "hmtx", "cmap", "maxp"];
  for (const t of need) if (!tables[t]) throw new Error(`TTF ohne Tabelle ${t}`);
  const head = tables.head.off;
  const unitsPerEm = u16(head + 18);
  const bbox = [i16(head + 36), i16(head + 38), i16(head + 40), i16(head + 42)];
  const hhea = tables.hhea.off;
  const ascent = i16(hhea + 4);
  const descent = i16(hhea + 6);
  const numH = u16(hhea + 34);
  const numGlyphs = u16(tables.maxp.off + 4);
  const advance = (gid) => u16(tables.hmtx.off + Math.min(gid, numH - 1) * 4);
  // cmap: Unicode-Untertabelle (3,1) oder (0,x), Format 4
  const cmap = tables.cmap.off;
  let sub = null;
  for (let i = 0, n = u16(cmap + 2); i < n; i++) {
    const pid = u16(cmap + 4 + i * 8);
    const eid = u16(cmap + 6 + i * 8);
    const off = u32(cmap + 8 + i * 8);
    if ((pid === 3 && eid === 1) || (pid === 0 && sub === null)) sub = cmap + off;
  }
  if (sub === null || u16(sub) !== 4) throw new Error("TTF ohne cmap Format 4");
  const segX2 = u16(sub + 6);
  const ends = sub + 14;
  const starts = ends + segX2 + 2;
  const deltas = starts + segX2;
  const rangeOffs = deltas + segX2;
  const glyphOf = (cp) => {
    for (let s = 0; s < segX2 / 2; s++) {
      const end = u16(ends + s * 2);
      if (cp > end) continue;
      const start = u16(starts + s * 2);
      if (cp < start) return 0;
      const delta = u16(deltas + s * 2);
      const ro = u16(rangeOffs + s * 2);
      if (ro === 0) return (cp + delta) & 0xffff;
      const gi = u16(rangeOffs + s * 2 + ro + (cp - start) * 2);
      return gi ? (gi + delta) & 0xffff : 0;
    }
    return 0;
  };
  let capHeight = 0;
  let italicAngle = 0;
  if (tables["OS/2"] && tables["OS/2"].len >= 90) capHeight = i16(tables["OS/2"].off + 88);
  if (tables.post) italicAngle = buf.readInt32BE(tables.post.off + 4) / 65536;
  const scale = 1000 / unitsPerEm;
  const widths = [];
  for (let code = 32; code <= 255; code++) widths.push(Math.round(advance(glyphOf(unicodeOf(code))) * scale));
  const H_GLYPH = glyphOf(0x48);
  if (!capHeight) capHeight = Math.round(bbox[3] * 0.7);
  return {
    widths, // Index 0 = Code 32
    bbox: bbox.map((v) => Math.round(v * scale)),
    ascent: Math.round(ascent * scale),
    descent: Math.round(descent * scale),
    capHeight: Math.round(capHeight * scale),
    italicAngle,
    numGlyphs,
    has: (ch) => glyphOf(ch.codePointAt(0)) > 0 || ch === " ",
    hasH: H_GLYPH > 0,
  };
}

// Helvetica-Breiten (AFM, WinAnsi 32–255) als Rückfall, grob: 0,52 em.
const HELVETICA_FALLBACK = { widths: Array.from({ length: 224 }, () => 520) };

const FONT_FILES = {
  sans: "instrument-sans-latin-400-normal.ttf",
  sansMedium: "instrument-sans-latin-500-normal.ttf",
  sansSemi: "instrument-sans-latin-600-normal.ttf",
  serif: "bodoni-moda-latin-400-normal.ttf",
  serifItalic: "bodoni-moda-latin-400-italic.ttf",
};
const PS_NAMES = { sans: "InstrumentSans-Regular", sansMedium: "InstrumentSans-Medium", sansSemi: "InstrumentSans-SemiBold", serif: "BodoniModa-Regular", serifItalic: "BodoniModa-Italic" };
const STD_FALLBACK = { sans: "Helvetica", sansMedium: "Helvetica-Bold", sansSemi: "Helvetica-Bold", serif: "Times-Roman", serifItalic: "Times-Italic" };

let fontCache = null;
/** Lädt die Hausschriften einmal je Prozess; fehlt eine Datei, Standardschrift. */
export function loadVoucherFonts(dir = FONT_DIR) {
  if (fontCache) return fontCache;
  const fonts = {};
  for (const [key, file] of Object.entries(FONT_FILES)) {
    try {
      const data = readFileSync(path.join(/*turbopackIgnore: true*/ dir, file));
      fonts[key] = { key, embedded: true, data, metrics: parseTrueType(data), name: PS_NAMES[key] };
    } catch {
      fonts[key] = { key, embedded: false, metrics: HELVETICA_FALLBACK, name: STD_FALLBACK[key] };
    }
  }
  fontCache = fonts;
  return fonts;
}
/** Nur für Tests: Cache leeren. */
export const resetVoucherFonts = () => {
  fontCache = null;
};

/** Textbreite in pt (WinAnsi-Breiten der Schrift + Laufweite). */
export function textWidth(font, text, size, tracking = 0) {
  const s = String(text ?? "");
  let w = 0;
  let n = 0;
  for (const ch of s) {
    const code = winAnsiCode(ch);
    w += (font.metrics.widths[Math.max(0, code - 32)] ?? 520) * size / 1000;
    n++;
  }
  return w + tracking * Math.max(0, n - 1);
}

/** Zeilenumbruch nach gemessener Breite; letzte Zeile mit „…“ gekürzt. */
export function wrapText(font, text, size, maxWidth, maxLines = 5) {
  const words = String(text ?? "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const lines = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (textWidth(font, next, size) > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = next;
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const cut = lines.slice(0, maxLines);
    let last = cut[maxLines - 1];
    while (last.length > 1 && textWidth(font, `${last}…`, size) > maxWidth) last = last.slice(0, -1).trimEnd();
    cut[maxLines - 1] = `${last}…`;
    return cut;
  }
  return lines;
}

/** Einfacher Zeilenumbruch nach geschätzter Zeichenbreite (Helvetica ≈ 0,52 em) – weiter exportiert. */
export function wrap(text, size, maxWidth, maxLines = 5) {
  return wrapText({ metrics: HELVETICA_FALLBACK }, text, size, maxWidth, maxLines);
}

// ---------------------------------------------------------------- Zeichnen
const F = { sans: "F1", sansMedium: "F2", sansSemi: "F3", serif: "F4", serifItalic: "F5" };
const num = (v) => (Math.round(v * 100) / 100).toString();
const text = (font, size, x, y, value, color = C.ink, tracking = 0) =>
  `BT ${color} rg /${F[font]} ${num(size)} Tf ${num(tracking)} Tc ${num(x)} ${num(y)} Td ${pdfString(value)} Tj ET`;
const line = (x1, y1, x2, y2, width = 0.6, color = C.stoneDeep) => `${color} RG ${num(width)} w ${num(x1)} ${num(y1)} m ${num(x2)} ${num(y2)} l S`;
const rect = (x, y, w, h, color) => `${color} rg ${num(x)} ${num(y)} ${num(w)} ${num(h)} re f`;

/** SVG-Pfad (M/L/Q/Z, absolut) → PDF-Pfadoperatoren, skaliert und an (x, yTop) gesetzt (SVG-y nach unten). */
export function svgPathToPdf(d, { x, yTop, scale }) {
  const toks = d.match(/[MLQZ]|-?\d*\.?\d+/g) || [];
  const ops = [];
  let i = 0;
  let cx = 0;
  let cy = 0;
  const px = (v) => num(x + v * scale);
  const py = (v) => num(yTop - v * scale);
  while (i < toks.length) {
    const t = toks[i++];
    if (t === "M") {
      cx = Number(toks[i++]);
      cy = Number(toks[i++]);
      ops.push(`${px(cx)} ${py(cy)} m`);
    } else if (t === "L") {
      cx = Number(toks[i++]);
      cy = Number(toks[i++]);
      ops.push(`${px(cx)} ${py(cy)} l`);
    } else if (t === "Q") {
      const qx = Number(toks[i++]);
      const qy = Number(toks[i++]);
      const ex = Number(toks[i++]);
      const ey = Number(toks[i++]);
      // quadratisch → kubisch
      const c1x = cx + (2 / 3) * (qx - cx);
      const c1y = cy + (2 / 3) * (qy - cy);
      const c2x = ex + (2 / 3) * (qx - ex);
      const c2y = ey + (2 / 3) * (qy - ey);
      ops.push(`${px(c1x)} ${py(c1y)} ${px(c2x)} ${py(c2y)} ${px(ex)} ${py(ey)} c`);
      cx = ex;
      cy = ey;
    } else if (t === "Z") ops.push("h");
  }
  return ops.join("\n");
}
const wordmark = (x, yTop, width, color = C.ink) => `${color} rg\n${svgPathToPdf(WORDMARK.d, { x, yTop, scale: width / WORDMARK.width })}\nf`;
const tagline = (x, yTop, width, color = C.inkSoft) => `${color} rg\n${svgPathToPdf(TAGLINE.d, { x, yTop, scale: width / TAGLINE.width })}\nf`;

function motifDrawing(motif, box) {
  // box = Kartenfläche rechts { x, y, w, h }
  if (motif === "seelicht") return [line(box.x + 18, box.y + box.h - 34, box.x + box.w - 18, box.y + box.h - 34, 0.6, C.brass500)];
  if (motif === "geweih") {
    // Schlichtes Geweih-Zeichen oben rechts in der Karte.
    const x = box.x + box.w - 34;
    const y = box.y + box.h - 40;
    return [
      line(x, y - 16, x, y + 14, 1.1, C.brass500),
      line(x, y + 2, x - 12, y + 16, 1.1, C.brass500),
      line(x, y + 2, x + 12, y + 16, 1.1, C.brass500),
      line(x - 6, y + 9, x - 14, y + 7, 1.1, C.brass500),
      line(x + 6, y + 9, x + 14, y + 7, 1.1, C.brass500),
    ];
  }
  return [];
}

/** „Für …“ nur voranstellen, wenn der Kunde es nicht schon geschrieben hat (sonst „Für Für Anna“). */
export function recipientLine(recipient) {
  const r = String(recipient ?? "").trim();
  if (!r) return "";
  return /^(für|fuer|for)\b/i.test(r) ? r : `Für ${r}`;
}

/**
 * @param {{ code: string, amountText: string, recipient?: string, greeting?: string,
 *   motif?: string, orderId: string, issuedAt: string (TT.MM.JJJJ), validity: string,
 *   issuer: string, termsUrl: string, test?: boolean }} v
 * @returns {Buffer}
 */
export function voucherPdf(v) {
  const fonts = loadVoucherFonts();
  const ops = [];
  ops.push(rect(0, 0, W, H, C.paper));
  ops.push(`${C.stoneDeep} RG 0.5 w ${FRAME} ${FRAME} ${num(W - 2 * FRAME)} ${num(H - 2 * FRAME)} re S`);

  // Kopf: Wortmarke + Tagline links, Überzeile rechts
  const wmW = 150;
  ops.push(wordmark(MX, H - 48, wmW));
  ops.push(tagline(MX, H - 48 - (wmW * 24) / WORDMARK.width - 7, wmW * 0.78));
  const over = "WERTGUTSCHEIN";
  ops.push(text("sansMedium", 7.5, W - MX - textWidth(fonts.sansMedium, over, 7.5, 1.3), H - 58, over, C.brass700, 1.3));

  // Linke Spalte: Titel, Betrag, Widmung
  const colW = 290;
  let y = H - 150;
  ops.push(text("serif", 40, MX - 1, y, "Gutschein"));
  y -= 42;
  ops.push(text("serif", 26, MX, y, v.amountText));
  y -= 20;
  ops.push(line(MX, y, MX + 56, y, 0.8, C.brass500));
  y -= 24;
  const rec = recipientLine(v.recipient);
  if (rec) {
    for (const l of wrapText(fonts.sansMedium, rec, 11.5, colW, 2)) {
      ops.push(text("sansMedium", 11.5, MX, y, l));
      y -= 16;
    }
    y -= 2;
  }
  if (v.greeting) {
    for (const l of wrapText(fonts.serifItalic, v.greeting, 12.5, colW, rec ? 5 : 6)) {
      ops.push(text("serifItalic", 12.5, MX, y, l, C.inkSoft));
      y -= 17;
    }
  }

  // Rechte Karte: Code, Gültigkeit, Bestellnummer, Ausstellung
  const card = { x: 362, y: 100, w: W - MX - 362, h: H - 100 - 112 };
  ops.push(rect(card.x, card.y, card.w, card.h, C.bone));
  ops.push(`${C.stoneDeep} RG 0.5 w ${num(card.x)} ${num(card.y)} ${num(card.w)} ${num(card.h)} re S`);
  ops.push(...motifDrawing(v.motif, card));
  const cx = card.x + 18;
  let cy = card.y + card.h - 62;
  ops.push(text("sansMedium", 7, cx, cy, "GUTSCHEINCODE", C.brass700, 1.2));
  cy -= 19;
  // Code in einem Stück (lesbar, kopierbar); Schriftgrad an die Kartenbreite angepasst
  let codeSize = 13;
  while (codeSize > 8 && textWidth(fonts.sansSemi, v.code, codeSize, 0.8) > card.w - 36) codeSize -= 0.5;
  ops.push(text("sansSemi", codeSize, cx, cy, v.code, C.ink, 0.8));
  cy -= 13;
  ops.push(line(cx, cy, card.x + card.w - 18, cy, 0.5, C.stoneDeep));
  cy -= 17;
  const row = (label, value) => {
    ops.push(text("sans", 7, cx, cy, label, C.inkSoft, 0.6));
    cy -= 11.5;
    for (const l of wrapText(fonts.sans, value, 9, card.w - 36, 2)) {
      ops.push(text("sans", 9, cx, cy, l));
      cy -= 11.5;
    }
    cy -= 5;
  };
  row("GÜLTIGKEIT", v.validity);
  row("BESTELLNUMMER", v.orderId);
  row("AUSGESTELLT AM", v.issuedAt);

  // Fuß: Einlösung, Aussteller, Bedingungen (gemessen umbrochen, bleibt im Rahmen)
  const fy = 82;
  ops.push(line(MX, fy, W - MX, fy, 0.5, C.stoneDeep));
  let ly = fy - 15;
  for (const l of [
    `Einlösbar im Showroom Platzhirsch Home Living, ${ADDRESS.street}, ${ADDRESS.postalCode} ${ADDRESS.city}. Bitte den Code wie Bargeld behandeln.`,
    `Aussteller: ${v.issuer}, ${ADDRESS.street}, ${ADDRESS.postalCode} ${ADDRESS.city}, ${ADDRESS.country} · Bedingungen: ${v.termsUrl}`,
  ].flatMap((t) => wrapText(fonts.sans, t, 8, W - 2 * MX, 2))) {
    ops.push(text("sans", 8, MX, ly, l, C.inkSoft));
    ly -= 12;
  }

  if (v.test) {
    // Testmodus: Streifen am oberen Blattrand, außerhalb des Rahmens, nie über Text.
    ops.push(rect(0, H - 13, W, 13, C.error));
    const t = "TESTGUTSCHEIN – NICHT EINLÖSBAR (Stripe-Testmodus)";
    ops.push(text("sansMedium", 7.5, (W - textWidth(fonts.sansMedium, t, 7.5, 0.4)) / 2, H - 9.4, t, C.white, 0.4));
  }
  const content = ops.join("\n");

  // ---------- Objekte ----------
  const objects = []; // Buffer | string
  const add = (obj) => {
    objects.push(obj);
    return objects.length; // 1-basierte Objektnummer
  };
  const catalog = add(null);
  const pages = add(null);
  const page = add(null);
  const contents = add(`<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}\nendstream`);
  const fontRefs = {};
  for (const key of Object.keys(F)) {
    const f = fonts[key];
    if (!f.embedded) {
      fontRefs[key] = add(`<< /Type /Font /Subtype /Type1 /BaseFont /${f.name} /Encoding /WinAnsiEncoding >>`);
      continue;
    }
    const m = f.metrics;
    const deflated = deflateSync(f.data);
    const file = add(Buffer.concat([Buffer.from(`<< /Length ${deflated.length} /Length1 ${f.data.length} /Filter /FlateDecode >>\nstream\n`, "latin1"), deflated, Buffer.from("\nendstream", "latin1")]));
    const flags = 32 | (m.italicAngle ? 64 : 0);
    const desc = add(
      `<< /Type /FontDescriptor /FontName /${f.name} /Flags ${flags} /FontBBox [${m.bbox.join(" ")}] /ItalicAngle ${num(m.italicAngle)} /Ascent ${m.ascent} /Descent ${m.descent} /CapHeight ${m.capHeight} /StemV 80 /FontFile2 ${file} 0 R >>`
    );
    fontRefs[key] = add(`<< /Type /Font /Subtype /TrueType /BaseFont /${f.name} /FirstChar 32 /LastChar 255 /Widths [${m.widths.join(" ")}] /Encoding /WinAnsiEncoding /FontDescriptor ${desc} 0 R >>`);
  }
  const info = add(`<< /Title ${pdfString(`Gutschein ${v.orderId}`)} /Author ${pdfString("Platzhirsch Home Living")} /Producer ${pdfString("platzhirsch.studio")} >>`);
  objects[catalog - 1] = `<< /Type /Catalog /Pages ${pages} 0 R >>`;
  objects[pages - 1] = `<< /Type /Pages /Kids [${page} 0 R] /Count 1 >>`;
  objects[page - 1] = `<< /Type /Page /Parent ${pages} 0 R /MediaBox [0 0 ${W} ${H}] /Contents ${contents} 0 R /Resources << /Font << ${Object.entries(F)
    .map(([key, name]) => `/${name} ${fontRefs[key]} 0 R`)
    .join(" ")} >> >> >>`;

  // ---------- Datei ----------
  const chunks = [Buffer.from("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n", "latin1")];
  let pos = chunks[0].length;
  const offsets = [];
  objects.forEach((obj, i) => {
    offsets.push(pos);
    const head = Buffer.from(`${i + 1} 0 obj\n`, "latin1");
    const body = Buffer.isBuffer(obj) ? obj : Buffer.from(obj, "latin1");
    const tail = Buffer.from("\nendobj\n", "latin1");
    chunks.push(head, body, tail);
    pos += head.length + body.length + tail.length;
  });
  const xref = pos;
  let trailer = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) trailer += `${String(off).padStart(10, "0")} 00000 n \n`;
  trailer += `trailer\n<< /Size ${objects.length + 1} /Root ${catalog} 0 R /Info ${info} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  chunks.push(Buffer.from(trailer, "latin1"));
  return Buffer.concat(chunks);
}
