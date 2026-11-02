// src/lib/payments/pdf.js
// Gutschein als PDF (A5 quer), ohne Zusatzpaket: kleiner PDF-1.4-Schreiber
// mit den Standardschriften Helvetica/Courier (WinAnsi, Umlaute und €).
// Keine Bilder, keine externen Ressourcen. Gestaltung nach Design-Bibel
// (ruhig, viel Weißraum, Tinte #30373e, Akzent #7a5e17). Die finale Vorlage
// der drei Motive liefert das Team (Masterplan AP9); bis dahin zeichnet
// "seelicht" eine Horizontlinie, "geweih" ein schlichtes Zeichen, "schlicht" nichts.
// Keine "@/..."-Importe.

const W = 595.28;
const H = 419.53;
const INK = "0.188 0.216 0.243";
const ACCENT = "0.478 0.369 0.090";
const SOFT = "0.290 0.318 0.345";
const LINE = "0.820 0.800 0.760";

// WinAnsi-Sonderzeichen außerhalb von Latin-1.
const WIN_ANSI = { "€": 0x80, "‚": 0x82, "„": 0x84, "…": 0x85, "‘": 0x91, "’": 0x92, "“": 0x93, "”": 0x94, "•": 0x95, "–": 0x96, "—": 0x97 };

/** Text → PDF-String-Literal (nur ASCII, Rest als Oktal-Escape). */
export function pdfString(text) {
  let out = "(";
  for (const ch of String(text ?? "")) {
    let code = WIN_ANSI[ch] ?? ch.codePointAt(0);
    if (code > 255) code = 0x3f; // "?"
    if (code === 0x28 || code === 0x29 || code === 0x5c) out += `\\${ch}`;
    else if (code < 32 || code > 126) out += `\\${code.toString(8).padStart(3, "0")}`;
    else out += ch;
  }
  return `${out})`;
}

/** Einfacher Zeilenumbruch nach geschätzter Zeichenbreite (Helvetica ≈ 0,52 em). */
export function wrap(text, size, maxWidth, maxLines = 5) {
  const perLine = Math.max(10, Math.floor(maxWidth / (size * 0.52)));
  const words = String(text ?? "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const lines = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (next.length > perLine && line) {
      lines.push(line);
      line = w;
    } else line = next;
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const cut = lines.slice(0, maxLines);
    cut[maxLines - 1] = `${cut[maxLines - 1].slice(0, perLine - 1)}…`;
    return cut;
  }
  return lines;
}

const text = (font, size, x, y, value, color = INK) => `BT ${color} rg /${font} ${size} Tf ${x.toFixed(2)} ${y.toFixed(2)} Td ${pdfString(value)} Tj ET`;
const line = (x1, y1, x2, y2, width = 0.75, color = LINE) => `${color} RG ${width} w ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`;

function motifDrawing(motif) {
  if (motif === "seelicht") return [line(40, 262, W - 40, 262, 0.6, ACCENT)];
  if (motif === "geweih") {
    // Schlichtes Geweih-Zeichen oben rechts aus Linien.
    const x = W - 70;
    const y = H - 70;
    return [
      line(x, y - 24, x, y + 6, 1.1, ACCENT),
      line(x, y - 4, x - 14, y + 12, 1.1, ACCENT),
      line(x, y - 4, x + 14, y + 12, 1.1, ACCENT),
      line(x - 7, y + 4, x - 16, y + 2, 1.1, ACCENT),
      line(x + 7, y + 4, x + 16, y + 2, 1.1, ACCENT),
    ];
  }
  return [];
}

/**
 * @param {{ code: string, amountText: string, recipient?: string, greeting?: string,
 *   motif?: string, orderId: string, issuedAt: string (TT.MM.JJJJ), validity: string,
 *   issuer: string, termsUrl: string, test?: boolean }} v
 * @returns {Buffer}
 */
export function voucherPdf(v) {
  const ops = [];
  ops.push(`1 1 1 rg 0 0 ${W} ${H} re f`);
  ops.push(`${LINE} RG 0.75 w 20 20 ${W - 40} ${H - 40} re S`);
  ops.push(...motifDrawing(v.motif));
  ops.push(text("F2", 9, 40, H - 52, "PLATZHIRSCH HOME LIVING", ACCENT));
  ops.push(text("F2", 30, 40, H - 92, "Gutschein"));
  ops.push(text("F2", 26, 40, H - 130, v.amountText));
  let y = H - 170;
  if (v.recipient) {
    ops.push(text("F1", 12, 40, y, `Für ${v.recipient}`));
    y -= 22;
  }
  if (v.greeting) {
    for (const l of wrap(v.greeting, 11, W - 80, 4)) {
      ops.push(text("F1", 11, 40, y, l, SOFT));
      y -= 15;
    }
  }
  // Code-Feld
  ops.push(`${LINE} RG 0.75 w 40 92 ${W - 80} 52 re S`);
  ops.push(text("F1", 8, 52, 130, "GUTSCHEINCODE", SOFT));
  ops.push(text("F3", 16, 52, 104, v.code));
  ops.push(text("F1", 9, W - 230, 130, v.validity, INK));
  ops.push(text("F1", 9, W - 230, 104, `Bestellnummer ${v.orderId}`, SOFT));
  ops.push(text("F1", 8, 40, 70, `Einlösbar im Showroom, Landstraße 11, 6911 Lochau · Ausgestellt am ${v.issuedAt}`, SOFT));
  ops.push(text("F1", 8, 40, 56, `Aussteller: ${v.issuer} · Bedingungen: ${v.termsUrl}`, SOFT));
  if (v.test) {
    ops.push(`0.80 0.10 0.10 rg 40 ${H / 2 - 6} ${W - 80} 26 re f`);
    ops.push(text("F2", 14, 52, H / 2 + 2, "TESTGUTSCHEIN – NICHT EINLÖSBAR (Stripe-Testmodus)", "1 1 1"));
  }
  const content = ops.join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R /F3 7 0 R >> >> >>`,
    `<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold /Encoding /WinAnsiEncoding >>",
    `<< /Title ${pdfString(`Gutschein ${v.orderId}`)} /Author ${pdfString("Platzhirsch Home Living")} /Producer ${pdfString("platzhirsch.studio")} >>`,
  ];
  let body = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  const offsets = [];
  objects.forEach((obj, i) => {
    offsets.push(Buffer.byteLength(body, "latin1"));
    body += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xref = Buffer.byteLength(body, "latin1");
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) body += `${String(off).padStart(10, "0")} 00000 n \n`;
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info ${objects.length} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(body, "latin1");
}
