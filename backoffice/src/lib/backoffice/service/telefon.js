// Telefonnummern normalisieren (Suche „in jeder Schreibweise“, 10-konzept-service §2.2): „+43 664 123 45 67“,
// „0043 664/1234567“ und „0664 1234567“ ergeben dieselbe Ziffernfolge ohne Länder- und Verkehrsausscheidungsziffer.
// Reines Modul.

/**
 * @param {string} text
 * @param {{land?:string}} [opts] Landesvorwahl ohne „+“ (Standard 43 = Österreich)
 * @returns {string} nationale Ziffernfolge ohne führende 0 (z. B. „6641234567“) oder "" ohne Ziffern
 */
export function normalisiereTelefon(text, { land = "43" } = {}) {
  let s = String(text ?? "").trim();
  if (!s) return "";
  s = s.replace(/\(0\)/g, "");
  const plus = s.startsWith("+");
  let ziffern = s.replace(/\D/g, "");
  if (!ziffern) return "";
  if (plus) return ohneLand(ziffern);
  if (ziffern.startsWith("00")) return ohneLand(ziffern.slice(2));
  if (ziffern.startsWith("0")) return ziffern.slice(1);
  if (ziffern.startsWith(land) && ziffern.length > 9) return ziffern.slice(land.length);
  return ziffern;
}

const LAENDER = ["43", "49", "41", "423", "39"];

function ohneLand(ziffern) {
  const l = [...LAENDER].sort((a, b) => b.length - a.length).find((x) => ziffern.startsWith(x));
  return l ? ziffern.slice(l.length) : ziffern;
}

/** Sieht die Eingabe wie eine Telefonnummer aus (mind. 6 Ziffern, nur Telefonzeichen)? */
export function istTelefon(text) {
  const s = String(text ?? "").trim();
  return /^[+\d][\d\s/().-]{5,}$/.test(s) && s.replace(/\D/g, "").length >= 6;
}

/** Passt eine gespeicherte Nummer zur Suche (Teilfolge der normalisierten Ziffern)? */
export function telefonPasst(gespeichert, suche) {
  const a = normalisiereTelefon(gespeichert);
  const b = normalisiereTelefon(suche);
  return !!a && !!b && b.length >= 4 && a.includes(b);
}
