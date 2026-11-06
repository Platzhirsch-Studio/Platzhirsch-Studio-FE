// Kartennummer der Kundenkarte (Konzept §2.3) – eine Funktion für Liste, Palette, Kiosk, Einlöse-Dialog, Kamera.
// Format wie ph_kundenkarte/utils/karte.py: "KK-" + 6 Zeichen aus dem Referenz-Alphabet (ohne 0/O/1/I).
// Reines Modul (browsertauglich, node --test).

export const PRAEFIX = "KK";
export const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
export const LAENGE = 6;
const MUSTER = new RegExp(`^${PRAEFIX}-[${ALPHABET}]{${LAENGE}}$`);

/** 'kk 7k3qx9' / 'KK7K3QX9' / ' kk-7k3qx9 ' → 'KK-7K3QX9'; leer → ''. Ändert nur das Format, rät keine Zeichen. */
export function normalisiereKartennummer(wert) {
  let s = String(wert ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  if (!s) return "";
  if (s.startsWith(PRAEFIX)) s = s.slice(PRAEFIX.length);
  return `${PRAEFIX}-${s}`;
}

/** true, wenn der Wert nach Normalisierung eine gültige Kartennummer ist. */
export function istKartennummer(wert) {
  return MUSTER.test(normalisiereKartennummer(wert));
}

/** Sieht die Eingabe nach einer (evtl. unvollständigen) Kartennummer aus? Für „Karte KK-… öffnen ↵“. */
export function wirktWieKartennummer(wert) {
  const s = String(wert ?? "").trim().toUpperCase().replace(/[\s-]/g, "");
  return /^KK[A-Z0-9]{0,6}$/.test(s) && s.length >= 3;
}

/** Für browsernahe Antworten: 'KK-7K3QX9' → 'KK-••••X9'. */
export function kartennummerMaskiert(wert) {
  const n = normalisiereKartennummer(wert);
  if (n.length < 5) return "";
  return n.slice(0, 3) + "•".repeat(n.length - 5) + n.slice(-2);
}

/** Deterministische Nummer aus einer Zahl (Mock-Seed, Mock-Methoden). */
export function kartennummerAus(zahl) {
  let n = Math.abs(Math.floor(Number(zahl) || 0)) * 2654435761;
  let s = "";
  for (let i = 0; i < LAENGE; i++) {
    s += ALPHABET[n % ALPHABET.length];
    n = Math.floor(n / ALPHABET.length) + (i + 7) * 131;
  }
  return `${PRAEFIX}-${s}`;
}
