import "server-only";

// Minimal single-page PDF writer (Helvetica, WinAnsi) for the DEMO placeholder
// documents of the mock adapter. Real documents come from ERPNext later
// (frappe.utils.print_format.download_pdf) and are streamed unchanged.

const WINANSI_EXTRA = { "€": 0x80, "–": 0x96, "—": 0x97, "„": 0x84, "“": 0x93, "”": 0x94, "‚": 0x82, "‘": 0x91, "’": 0x92, "•": 0x95, "…": 0x85 };

function encode(text) {
  let out = "";
  for (const ch of String(text)) {
    const code = WINANSI_EXTRA[ch] ?? ch.codePointAt(0);
    const c = code > 255 ? 0x3f : code; // "?" for anything outside WinAnsi
    if (c === 0x28 || c === 0x29 || c === 0x5c) out += "\\" + String.fromCharCode(c);
    else if (c < 32 || c > 126) out += "\\" + c.toString(8).padStart(3, "0");
    else out += String.fromCharCode(c);
  }
  return out;
}

/** Word-wrap by an approximate Helvetica width (avg 0.5em). */
function wrap(text, size, maxWidth) {
  const maxChars = Math.floor(maxWidth / (size * 0.5));
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > maxChars && line) {
      lines.push(line);
      line = w;
    } else line = (line + " " + w).trim();
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * @param {{title:string, lines:{text:string, size?:number, bold?:boolean, gap?:number, color?:number[]}[], footer?: string[]}} doc
 *   footer – Druck 02.11.: Fußzeilen (Aussteller, Adresse) unten auf der Seite,
 *   über einer Haarlinie; gleiche Kopf-/Fußgestaltung wie der Gutschein.
 * @returns {Buffer}
 */
export function renderSimplePdf({ title, lines, footer = [] }) {
  const W = 595.28;
  const H = 841.89;
  const left = 64;
  let y = H - 80;
  const ops = [];
  if (footer.length) {
    ops.push(`0.85 0.82 0.78 RG 0.5 w ${left} 78 m ${W - left} 78 l S`);
    footer.forEach((t, i) => ops.push(`BT /F1 8 Tf 0.36 0.39 0.42 rg ${left} ${(64 - i * 11).toFixed(2)} Td (${encode(t)}) Tj ET`));
  }
  for (const l of lines) {
    const size = l.size || 11;
    y -= l.gap ?? 6;
    const [r, g, b] = l.color || [0.19, 0.22, 0.24];
    for (const part of wrap(l.text, size, W - left * 2)) {
      y -= size * 1.35;
      ops.push(`BT /${l.bold ? "F2" : "F1"} ${size} Tf ${r} ${g} ${b} rg ${left} ${y.toFixed(2)} Td (${encode(part)}) Tj ET`);
    }
  }
  // thin gold rule under the header
  ops.unshift(`0.48 0.37 0.09 RG 0.6 w ${left} ${H - 118} m ${W - left} ${H - 118} l S`);
  const stream = ops.join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
    `<< /Length ${Buffer.byteLength(stream, "latin1")} >>\nstream\n${stream}\nendstream`,
    `<< /Title (${encode(title)}) /Producer (Mein Platzhirsch – Demo) >>`,
  ];

  let pdf = "%PDF-1.4\n%\xe2\xe3\xcf\xd3\n";
  const offsets = [];
  objects.forEach((body, i) => {
    offsets.push(Buffer.byteLength(pdf, "latin1"));
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info ${objects.length} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, "latin1");
}
