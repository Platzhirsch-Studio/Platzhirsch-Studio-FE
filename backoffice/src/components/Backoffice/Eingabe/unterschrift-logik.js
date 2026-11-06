// Reine Logik der Unterschrift (G-23): Striche als Vektoren (relativ 0…1, damit Drehen/Größenänderung
// nichts verzerrt), Mindestlänge, Prüfwert (SHA-256 über die PNG-Bytes), Alternativen.

/** Gesamtlänge aller Striche in Pixeln bei gegebener Fläche. */
export function strichLaenge(striche, breite, hoehe) {
  let summe = 0;
  for (const s of striche) {
    for (let i = 1; i < s.length; i++) summe += Math.hypot((s[i].x - s[i - 1].x) * breite, (s[i].y - s[i - 1].y) * hoehe);
  }
  return summe;
}

/**
 * Reicht die Unterschrift? Mindestens ein Strich und insgesamt ≥ `minPx` Weg (Standard 60 px) –
 * ein Punkt oder Strich-Fehler gilt nicht als Unterschrift.
 */
export function unterschriftGenug(striche, breite, hoehe, minPx = 60) {
  return striche.some((s) => s.length > 1) && strichLaenge(striche, breite, hoehe) >= minPx;
}

/**
 * Punkt glätten (exponentiell), Abstand < 1,5 px verwerfen.
 * @returns {{x:number,y:number,p:number}|null} neuer Punkt oder null (zu nah)
 */
export function glaette(letzter, roh, breite, hoehe, faktor = 0.55) {
  if (!letzter) return roh;
  const dx = (roh.x - letzter.x) * breite;
  const dy = (roh.y - letzter.y) * hoehe;
  if (Math.hypot(dx, dy) < 1.5) return null;
  return { x: letzter.x + (roh.x - letzter.x) * faktor, y: letzter.y + (roh.y - letzter.y) * faktor, p: roh.p };
}

/** Strichbreite aus Druck (Stift) bzw. Standard für Finger/Maus. */
export function strichBreite(p, basis = 2.4) {
  if (!(p > 0) || p === 0.5) return basis;
  return Math.max(1.2, Math.min(4.2, basis * (0.55 + p)));
}

/** SHA-256 (hex) über Bytes – Browser und Node (globalThis.crypto.subtle). */
export async function pruefwert(bytes) {
  const daten = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const hash = await globalThis.crypto.subtle.digest("SHA-256", daten);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** "data:image/png;base64,…" → Uint8Array (null, wenn kein PNG). */
export function pngAusDataUrl(url) {
  const m = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(String(url || ""));
  if (!m) return null;
  if (typeof atob === "function") {
    const bin = atob(m[1]);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  return new Uint8Array(Buffer.from(m[1], "base64"));
}

/**
 * Prüft eine Alternative (statt Unterschrift). alt: { wert, titel, feld?: {label}, fotoPflicht? }
 * @returns {string} Fehlertext oder ""
 */
export function alternativeFehler(alt, { text = "", fotos = 0 } = {}, T) {
  if (!alt) return "";
  if (alt.feld && !String(text).trim()) return T.nameFehlt;
  if (alt.fotoPflicht && fotos < 1) return T.fotoFehlt;
  return "";
}
