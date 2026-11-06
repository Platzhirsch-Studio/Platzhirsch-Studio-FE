// E-Mail-Prüfung im Dialog „Neue Bestellung“ (10-konzept-shop § 4.3): Format, fehlende Endung, häufige Verdreher.
// Nur ein Vorschlag mit „Übernehmen“ – nie automatisch ersetzt. Rein.

const VERDREHER = {
  "gmial.com": "gmail.com", "gmai.com": "gmail.com", "gmal.com": "gmail.com", "gmail.co": "gmail.com", "gamil.com": "gmail.com", "gmail.de": null,
  "gmx.ar": "gmx.at", "gmx.ta": "gmx.at", "gxm.at": "gmx.at", "gmx.con": "gmx.com", "gmx.dee": "gmx.de",
  "hotmial.com": "hotmail.com", "hotmal.com": "hotmail.com", "hotmail.co": "hotmail.com",
  "outlok.com": "outlook.com", "outllok.com": "outlook.com", "yaho.com": "yahoo.com", "yahooo.com": "yahoo.com",
  "icloud.co": "icloud.com", "iclod.com": "icloud.com", "aon.ar": "aon.at", "a1.ner": "a1.net", "web.dee": "web.de",
};

/**
 * @param {string} mail
 * @returns {{gueltig:boolean, fehler?:string, vorschlag?:string}}
 */
export function emailTipp(mail) {
  const m = String(mail || "").trim();
  if (!m) return { gueltig: false, fehler: "leer" };
  const teile = /^([^@\s]+)@([^@\s]+)$/.exec(m);
  if (!teile) return { gueltig: false, fehler: "E-Mail im Format name@domain.at" };
  const domain = teile[2].toLowerCase();
  if (!/\.[a-z]{2,}$/.test(domain)) return { gueltig: false, fehler: "Endung fehlt (z. B. .at, .de, .com)" };
  const ersatz = VERDREHER[domain];
  if (ersatz) return { gueltig: true, vorschlag: `${teile[1]}@${ersatz}` };
  return { gueltig: true };
}
