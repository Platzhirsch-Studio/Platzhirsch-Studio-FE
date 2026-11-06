// Reine Logik der Seitenmuster (Team P0-5b) – ohne JSX und ohne "@/"-Importe, damit node --test sie
// direkt laden kann: Unternav (G-10), Zwei-Klick-Knopf (G-29), Zu-tun-Zeilen (G-11).

export const UNTERNAV_MAX = 7;

/** Sichtbare und überzählige Unternav-Einträge; der aktive bleibt immer sichtbar. `recht: false` fällt weg. */
export function teileUnternav(eintraege = [], aktiv, max = UNTERNAV_MAX) {
  const liste = (eintraege || []).filter((e) => e && e.recht !== false);
  if (liste.length <= max) return { sichtbar: liste, mehr: [] };
  let sichtbar = liste.slice(0, max - 1);
  const aktivEintrag = liste.find((e) => e.href === aktiv);
  if (aktivEintrag && !sichtbar.includes(aktivEintrag)) sichtbar = [...sichtbar.slice(0, max - 2), aktivEintrag];
  return { sichtbar, mehr: liste.filter((e) => !sichtbar.includes(e)) };
}

/** Aktiver Eintrag zum Pfad: exakter Treffer (mit/ohne Query) vor dem längsten Präfix. */
export function aktiverEintrag(eintraege = [], pfad = "") {
  const ohneQuery = (h) => String(h || "").split("?")[0];
  const exakt = eintraege.find((e) => e.href === pfad) || eintraege.find((e) => ohneQuery(e.href) === pfad);
  if (exakt) return exakt.href;
  const treffer = eintraege
    .filter((e) => pfad.startsWith(`${ohneQuery(e.href)}/`))
    .sort((a, b) => ohneQuery(b.href).length - ohneQuery(a.href).length);
  return treffer[0]?.href ?? null;
}

/** Zwei-Klick-Knopf (G-29): Fenster für den zweiten Klick. */
export const ZWEI_KLICK_MS = 3000;

/**
 * Zustandsübergang des Zwei-Klick-Knopfs.
 * @param {{scharf:boolean, seit:number|null}} zustand
 * @param {"klick"|"ablauf"|"abbruch"} ereignis
 * @param {number} jetzt  ms
 * @returns {{zustand:{scharf:boolean, seit:number|null}, ausfuehren:boolean}}
 */
export function zweiKlick(zustand, ereignis, jetzt, fenster = ZWEI_KLICK_MS) {
  const z = zustand || { scharf: false, seit: null };
  if (ereignis === "abbruch" || ereignis === "ablauf") return { zustand: { scharf: false, seit: null }, ausfuehren: false };
  if (ereignis !== "klick") return { zustand: z, ausfuehren: false };
  if (z.scharf && z.seit !== null && jetzt - z.seit <= fenster) return { zustand: { scharf: false, seit: null }, ausfuehren: true };
  return { zustand: { scharf: true, seit: jetzt }, ausfuehren: false };
}

/** Höchstens so viele Zu-tun-Zeilen sind sichtbar, der Rest steht hinter „Alle anzeigen“. */
export const ZUTUN_MAX = 5;
