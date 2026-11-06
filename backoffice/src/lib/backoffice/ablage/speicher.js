// Mock-Speicher der Ablage: Bytes hochgeladener Dateien und laufende Upload-Teile im Prozessspeicher
// (nur Mock-Modus; im Frappe-Modus liegen die Bytes im Speicher-Adapter von ph_ablage und kommen nie hierher).
// Begrenzung, damit der Dev-Server nicht volläuft: 256 MB gesamt, älteste fallen heraus.
// Reines Modul (node --test).

const GRENZE = 256 * 1024 * 1024;

function ablage() {
  if (!globalThis.__phAblageSpeicher) globalThis.__phAblageSpeicher = { objekte: new Map(), uploads: new Map(), summe: 0 };
  return globalThis.__phAblageSpeicher;
}

export const schluessel = (datei, version) => `${datei}:${Number(version) || 1}`;

/** @param {string} k @param {Uint8Array} bytes @param {string} mime */
export function legeAb(k, bytes, mime) {
  const s = ablage();
  const alt = s.objekte.get(k);
  if (alt) s.summe -= alt.bytes.byteLength;
  s.objekte.set(k, { bytes, mime, zeit: Date.now() });
  s.summe += bytes.byteLength;
  for (const [key, o] of s.objekte) {
    if (s.summe <= GRENZE) break;
    if (key === k) continue;
    s.objekte.delete(key);
    s.summe -= o.bytes.byteLength;
  }
}

export function hole(k) {
  return ablage().objekte.get(k) || null;
}

export function entferne(praefix) {
  const s = ablage();
  for (const [key, o] of s.objekte) {
    if (key === praefix || key.startsWith(`${praefix}:`)) {
      s.objekte.delete(key);
      s.summe -= o.bytes.byteLength;
    }
  }
}

// ---------------------------------------------------------------- Uploads --

export function uploadSetzen(token, zustand) {
  ablage().uploads.set(token, { ...zustand, teile: [], erhalten: 0 });
}
export function uploadHolen(token) {
  return ablage().uploads.get(token) || null;
}
export function uploadTeil(token, bytes) {
  const u = ablage().uploads.get(token);
  if (!u) return null;
  u.teile.push(bytes);
  u.erhalten += bytes.byteLength;
  return u;
}
export function uploadBytes(token) {
  const u = ablage().uploads.get(token);
  if (!u) return null;
  const out = new Uint8Array(u.erhalten);
  let o = 0;
  for (const t of u.teile) {
    out.set(t, o);
    o += t.byteLength;
  }
  return out;
}
export function uploadEntfernen(token) {
  ablage().uploads.delete(token);
}

// ------------------------------------------------------- Beispielinhalte --

/** Minimales gültiges PDF mit einer Zeile Text (Beispieldateien im Testmodus). */
export function beispielPdf(titel) {
  const text = String(titel || "Beispiel").replace(/[()\\]/g, "").replace(/[^\x20-\x7e]/g, "?").slice(0, 80);
  const objekte = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    null,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  const inhalt = `BT /F1 20 Tf 72 760 Td (${text}) Tj 0 -28 Td /F1 11 Tf (Beispieldatei aus dem Testmodus der Ablage.) Tj ET`;
  objekte[3] = `<< /Length ${inhalt.length} >>\nstream\n${inhalt}\nendstream`;
  let pdf = "%PDF-1.4\n";
  const xref = [];
  objekte.forEach((o, i) => {
    xref.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const start = pdf.length;
  pdf += `xref\n0 ${objekte.length + 1}\n0000000000 65535 f \n${xref.map((x) => `${String(x).padStart(10, "0")} 00000 n \n`).join("")}`;
  pdf += `trailer\n<< /Size ${objekte.length + 1} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF\n`;
  return new TextEncoder().encode(pdf);
}

export function beispielText(titel) {
  return new TextEncoder().encode(`${titel}\n\nBeispieldatei aus dem Testmodus der Ablage – ohne echten Inhalt.\n`);
}
