// Rechtliche Prüfbausteine Shop (10-konzept-shop § 3.7, E11, B5; §§ 11, 12, 14, 15 FAGG). Rein, unit-getestet.
// Datumswerte als ISO-Text („2026-11-06“ oder „2026-11-06 10:42:00“); „heute“ wird übergeben (testbar).

const TAG_MS = 86_400_000;

/** „2026-11-06 10:42:00“ → „2026-11-06“ (null bei leer). */
export function tagVon(wert) {
  if (!wert) return null;
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(String(wert));
  return m ? m[1] : null;
}

function utc(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/** ISO-Datum + n Tage. */
export function plusTage(iso, tage) {
  const t = tagVon(iso);
  if (!t) return null;
  return new Date(utc(t) + tage * TAG_MS).toISOString().slice(0, 10);
}

/** Ganze Tage von a bis b (b − a). */
export function tageBis(a, b) {
  const x = tagVon(a);
  const y = tagVon(b);
  if (!x || !y) return null;
  return Math.round((utc(y) - utc(x)) / TAG_MS);
}

/** Heute als ISO (lokale Zeit Europe/Vienna genügt für Tagesfristen). */
export function heute(jetzt = new Date()) {
  const z = new Date(jetzt.getTime() - jetzt.getTimezoneOffset() * 60_000);
  return z.toISOString().slice(0, 10);
}

/**
 * Zustellung einer Bestellung: Lieferschein `zugestellt_am` (Sendungsverfolgung) → Abholung → Versand (geschätzt).
 * @param {object} bestellung
 * @param {object[]} [lieferscheine]  PH Lieferschein mit `bestellung`, `zugestellt_am`
 * @returns {{datum:string|null, quelle:"Sendungsverfolgung"|"Abholung"|"geschätzt (Versand)"|null, geschaetzt:boolean}}
 */
export function zustellung(bestellung, lieferscheine = []) {
  const ls = lieferscheine.filter((l) => l && (!l.bestellung || l.bestellung === bestellung?.name) && l.zugestellt_am).sort((a, b) => String(b.zugestellt_am).localeCompare(String(a.zugestellt_am)))[0];
  if (ls) return { datum: tagVon(ls.zugestellt_am), quelle: "Sendungsverfolgung", geschaetzt: false };
  if (bestellung?.abgeholt_am) return { datum: tagVon(bestellung.abgeholt_am), quelle: "Abholung", geschaetzt: false };
  if (bestellung?.versendet_am) return { datum: tagVon(bestellung.versendet_am), quelle: "geschätzt (Versand)", geschaetzt: true };
  return { datum: null, quelle: null, geschaetzt: true };
}

/** Belehrung nachweisbar = Stand gesetzt und Bestätigung zugestellt (§ 12 FAGG). */
export function belehrungNachweisbar(bestellung) {
  return !!bestellung?.widerrufsbelehrung_stand && bestellung?.mail_status === "gesendet";
}

/**
 * Widerrufsfristen (§ 3.7): Widerruf bis Zustellung + 14, Rücksendung bis Eingang + 14, Rückzahlung bis Eingang + 14.
 * @param {object} widerruf  PH Widerruf (`eingegangen_am`)
 * @param {{datum:string|null}} zust
 */
export function widerrufsFristen(widerruf, zust) {
  const eingang = tagVon(widerruf?.eingegangen_am);
  const widerrufBis = zust?.datum ? plusTage(zust.datum, 14) : null;
  return {
    widerrufBis,
    ruecksendungBis: eingang ? plusTage(eingang, 14) : null,
    rueckzahlungBis: eingang ? plusTage(eingang, 14) : null,
    fristgerecht: widerrufBis && eingang ? eingang <= widerrufBis : null,
  };
}

/** Abschließen ab Zustellung + 28 Tage (14 Widerruf + 14 Rücksendung, P19). */
export function abschliessenAb(bestellung, lieferscheine = []) {
  const z = zustellung(bestellung, lieferscheine);
  return z.datum ? plusTage(z.datum, 28) : null;
}

/**
 * Ampel einer Frist (§ 4.7): grün > 7 Tage, orange ≤ 7, rot überschritten – immer mit Text.
 * @returns {{ton:"gruen"|"orange"|"rot"|"grau", tage:number|null, text:string}}
 */
export function ampel(bis, heuteIso, { erledigt = false } = {}) {
  if (erledigt) return { ton: "grau", tage: null, text: "erledigt" };
  if (!bis) return { ton: "grau", tage: null, text: "Frist offen" };
  const t = tageBis(heuteIso, bis);
  if (t < 0) return { ton: "rot", tage: t, text: `überschritten seit ${-t} ${-t === 1 ? "Tag" : "Tagen"}` };
  if (t === 0) return { ton: "orange", tage: 0, text: "heute" };
  return { ton: t <= 7 ? "orange" : "gruen", tage: t, text: `${t} ${t === 1 ? "Tag" : "Tage"}` };
}

/** Darf „Frist überschritten“ als Ablehnungsgrund gewählt werden? (nur bei bekannter Zustellung + Belehrung, E11) */
export function fristAblehnungErlaubt(bestellung, zust) {
  return !!zust?.datum && !zust.geschaetzt && belehrungNachweisbar(bestellung);
}

/** Wertminderung nur bei Widerruf und nachweisbarer Belehrung (§ 15 FAGG). */
export function wertminderungErlaubt(bestellung, { widerruf = true } = {}) {
  return widerruf && belehrungNachweisbar(bestellung);
}

/** Hinsendekosten: voll bei Vollwiderruf, 0 bei Teilwiderruf (§ 14 FAGG). */
export function hinsendekosten(bestellung, auswahl = {}) {
  const pos = bestellung?.positionen || [];
  const voll = pos.length > 0 && pos.every((p) => Number(auswahl[String(p.idx)] || 0) >= Number(p.menge || 0) - Number(p.zurueck_menge || 0));
  return voll ? Number(bestellung?.versand_cent || 0) : 0;
}

/** Abholfrist-Vergleich vor „Abholbereit melden“ (§ 6.2): neue Frist kürzer → Bestätigung. */
export function abholfristVergleich(vereinbart, neuIso) {
  if (!vereinbart || !neuIso) return { art: "gleich" };
  const d = tageBis(vereinbart, neuIso);
  if (d < 0) return { art: "kuerzer", alt: tagVon(vereinbart), neu: neuIso };
  if (d > 0) return { art: "laenger", alt: tagVon(vereinbart), neu: neuIso };
  return { art: "gleich" };
}

/** Werktage (Mo–Fr) addieren – Fälligkeit „Nächster Schritt“. */
export function plusWerktage(iso, n) {
  let t = tagVon(iso);
  if (!t) return null;
  let rest = n;
  while (rest > 0) {
    t = plusTage(t, 1);
    const wt = new Date(utc(t)).getUTCDay();
    if (wt !== 0 && wt !== 6) rest--;
  }
  return t;
}
