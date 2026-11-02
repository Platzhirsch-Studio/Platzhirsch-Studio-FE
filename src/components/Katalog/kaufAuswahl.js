// src/components/Katalog/kaufAuswahl.js
// Reine Hilfen der Kaufbox (Optik-QA r1). Ohne "@/"-Importe (node --test).

/**
 * Vorauswahl der Kaufbox. Verpackungseinheiten (Zalto „1er“/„2er“/„6er“): immer die kleinste –
 * der Hersteller-Shop wählt den 6er-Karton vor (€ 317,40 statt des Einzelglases); das soll hier
 * niemand übersehen. Sonst die Standard-Ausführung des Herstellers.
 * @param {Array<{id: string}>} varianten
 * @param {string|null|undefined} standard
 * @returns {string|null}
 */
export function startVariante(varianten, standard) {
  const liste = Array.isArray(varianten) ? varianten : [];
  const packs = liste.map((v) => ({ id: v?.id, n: packGroesse(v?.id) })).filter((x) => x.n != null);
  if (packs.length >= 2 && packs.length === liste.length) return packs.sort((a, b) => a.n - b.n)[0].id;
  return standard ?? null;
}

/**
 * Stückzahl einer Verpackungseinheit aus der Varianten-ID oder null. IDs entstehen als Slug des
 * Namens (lib/shop/catalog.js variantenOf): „einzeln-im-geschenkkarton“, „2er-karton“, „6er-karton“;
 * Konfigurator-IDs „1er“/„2er“/„6er“ ebenfalls.
 * @param {unknown} id
 * @returns {number|null}
 */
export function packGroesse(id) {
  const s = String(id ?? "");
  if (/^einzeln(-|$)/.test(s)) return 1;
  const m = /^(\d+)er(-karton)?$/.exec(s);
  return m ? Number(m[1]) : null;
}

/**
 * Ausführungsname in Name und Maßangabe teilen („CLASSIQUE · 10 cm · 500 g“ → CLASSIQUE | 10 cm · 500 g),
 * damit kein „·“ am Zeilenende hängt. Ohne „ · “ bleibt der Name ganz.
 * @param {string|null|undefined} name
 * @returns {{ name: string, mass: string|null }}
 */
export function varianteTeile(name) {
  const s = String(name ?? "");
  const i = s.indexOf(" · ");
  return i > 0 ? { name: s.slice(0, i), mass: s.slice(i + 3) } : { name: s, mass: null };
}

/**
 * Maßangabe einer Ausführung mit Kommas statt Mittelpunkt („10 cm · 500 g“ → „10 cm, 500 g“):
 * Optik-QA r2 – bei 200 % Textzoom und im Mini-Warenkorb hing sonst „10 cm ·“ am Zeilenende.
 * Ein Komma am Zeilenende ist normale Typografie; Werte und Reihenfolge bleiben.
 * @param {string|null|undefined} mass
 * @returns {string|null}
 */
export function massText(mass) {
  if (mass == null || mass === "") return null;
  return String(mass).replace(/[\s ]+·\s+/g, ", ");
}

/**
 * Ausführung als eine Zeile für Warenkorb/Mini-Warenkorb: „Classique, 10 cm, 500 g“.
 * @param {string|null|undefined} name
 * @returns {string}
 */
export function varianteZeile(name) {
  const t = varianteTeile(name);
  return t.mass ? `${t.name}, ${massText(t.mass)}` : t.name;
}
