// Akte-Slots (G-14, Team P0-5a) – Schnittstelle, über die Bereiche Abschnitte in die Kundenakte
// (`/kunden/[kontakt]`, Besitzer CRM) und die Auftragsmappe (`/projekte/[projekt]`, Besitzer Projekte)
// liefern, ohne Dateien unter fremden Routen anzulegen (MASTER R-01).
//
// ── SLOT-API v1 · EINGEFROREN am 04.11.2026 ─────────────────────────────────────────────────────────
// Änderungen nur additiv (neue optionale Felder); Brüche nur mit neuer Version und Eintrag im
// Übergabeprotokoll. Dokumentation: components/Backoffice/README.md „Akte und Vorgang (Team P0-5a)“.
//
// Datei je Bereich: src/lib/backoffice/akte/slots/<bereich>.js
//   export default [ {
//     id: "faktura.belege",            // eindeutig, Präfix = Bereich
//     bereich: "faktura",              // Slug aus bereiche/index.js
//     akte: "kunde" | "projekt",       // in welcher Akte
//     tab: "projekte-belege",          // Reiter-Id aus AKTE_TABS[akte]
//     reihenfolge: 20,                 // kleiner = weiter oben (Schritte von 10)
//     titel: "Belege",                 // Abschnittstitel (Satzschreibung)
//     recht: (session) => boolean,     // optional; fehlt → sichtbar; wirft → unsichtbar
//     lade: async (session, id, ctx) => daten,   // ctx = { client, akte, tab }; darf werfen (nur dieser Abschnitt zeigt dann den Fehler)
//     Komponente,                      // ({ daten, id, akte, tab }) => ReactNode – Server- oder Client-Komponente;
//                                      // bekommt nie die Sitzung (sie darf nicht in den Browser), nur `daten`
//     breite: "voll" | "halb",         // optional, Standard "voll" (halb = 6 von 12 Spalten ab 1024 px)
//     leer: (daten) => boolean,        // optional; true → ruhiger Leer-Satz `leerText` statt Komponente
//     leerText: "Noch keine Belege.",  // optional
//     zeitlimitMs: 4000,               // optional, Standard 4000 (danach Fehlerblock „nicht geladen“)
//   } ]
// und eine Zeile in akte/slots/index.js. Die Akte rendert die Slots ihres Reiters mit <AkteSlots> bzw.
// <AkteSlotListe> (components/Backoffice/Akte/Slots.js).
// ─────────────────────────────────────────────────────────────────────────────────────────────────

export const SLOT_API_VERSION = 1;

export const AKTEN = Object.freeze(["kunde", "projekt"]);

/** Reiter der beiden Akten (CRM § 4.3 und Projekte E1 – je genau 6). Slots dürfen nur hierhin. */
export const AKTE_TABS = Object.freeze({
  kunde: Object.freeze([
    { id: "uebersicht", titel: "Übersicht" },
    { id: "aktivitaet", titel: "Aktivität" },
    { id: "vorgaenge", titel: "Vorgänge" },
    { id: "projekte-belege", titel: "Projekte & Belege" },
    { id: "service", titel: "Service" },
    { id: "mehr", titel: "Mehr" },
  ]),
  projekt: Object.freeze([
    { id: "uebersicht", titel: "Übersicht" },
    { id: "positionen", titel: "Positionen" },
    { id: "planung", titel: "Planung" },
    { id: "belege-lieferung", titel: "Belege & Lieferung" },
    { id: "montage", titel: "Montage" },
    { id: "dateien", titel: "Dateien" },
  ]),
});

export const SLOT_ZEITLIMIT_MS = 4000;

const ID = /^[a-z][a-z0-9-]*\.[a-z0-9-]+$/;

/**
 * Befunde zu einem Slot (leer = gültig). Für Unit-Tests der Bereiche und die Registerprüfung.
 * @param {object} slot
 * @returns {string[]}
 */
export function pruefeSlot(slot) {
  const f = [];
  if (!slot || typeof slot !== "object") return ["Slot ist kein Objekt"];
  const wer = slot.id || "(ohne id)";
  if (typeof slot.id !== "string" || !ID.test(slot.id)) f.push(`${wer}: id muss „bereich.name“ sein`);
  else if (slot.bereich && !slot.id.startsWith(`${slot.bereich}.`)) f.push(`${wer}: id beginnt nicht mit dem Bereich „${slot.bereich}“`);
  if (typeof slot.bereich !== "string" || !slot.bereich) f.push(`${wer}: bereich fehlt`);
  if (!AKTEN.includes(slot.akte)) f.push(`${wer}: akte muss „kunde“ oder „projekt“ sein`);
  else if (!AKTE_TABS[slot.akte].some((t) => t.id === slot.tab)) f.push(`${wer}: Reiter „${slot.tab}“ gibt es in der Akte „${slot.akte}“ nicht`);
  if (typeof slot.titel !== "string" || !slot.titel.trim()) f.push(`${wer}: titel fehlt`);
  if (typeof slot.lade !== "function") f.push(`${wer}: lade(session, id, ctx) fehlt`);
  if (typeof slot.Komponente !== "function" && typeof slot.Komponente !== "object") f.push(`${wer}: Komponente fehlt`);
  if (slot.recht !== undefined && typeof slot.recht !== "function") f.push(`${wer}: recht muss eine Funktion sein`);
  if (slot.reihenfolge !== undefined && !Number.isFinite(slot.reihenfolge)) f.push(`${wer}: reihenfolge muss eine Zahl sein`);
  if (slot.breite !== undefined && !["voll", "halb"].includes(slot.breite)) f.push(`${wer}: breite muss „voll“ oder „halb“ sein`);
  if (slot.leer !== undefined && typeof slot.leer !== "function") f.push(`${wer}: leer muss eine Funktion sein`);
  return f;
}

/** Befunde für ein ganzes Register (doppelte Ids + Einzelprüfung). */
export function pruefeSlots(liste = []) {
  const f = [];
  const ids = new Set();
  for (const s of liste) {
    f.push(...pruefeSlot(s));
    if (s?.id) {
      if (ids.has(s.id)) f.push(`${s.id}: doppelt`);
      ids.add(s.id);
    }
  }
  return f;
}

/**
 * Sichtbare Slots einer Akte und eines Reiters, sortiert. Ungültige Slots und Slots, deren
 * Rechteprüfung false liefert oder wirft, fallen still heraus (fehlendes Recht = ausgeblendet, Q-B11).
 * @param {{akte:string, tab:string, session?:object, register:Array<object>}} p
 */
export function slotsFuer({ akte, tab, session, register = [] }) {
  return register
    .filter((s) => pruefeSlot(s).length === 0 && s.akte === akte && s.tab === tab)
    .filter((s) => {
      if (!s.recht) return true;
      try {
        return s.recht(session) === true;
      } catch {
        return false;
      }
    })
    .sort((a, b) => (a.reihenfolge ?? 100) - (b.reihenfolge ?? 100) || a.id.localeCompare(b.id));
}

/** Zähler je Reiter (Anzahl sichtbarer Slots) – für Reiter ohne eigenen Inhalt. */
export function slotZaehler({ akte, session, register = [] }) {
  const z = {};
  for (const t of AKTE_TABS[akte] || []) z[t.id] = slotsFuer({ akte, tab: t.id, session, register }).length;
  return z;
}

function mitZeitlimit(promise, ms) {
  let t;
  return Promise.race([
    promise.finally(() => clearTimeout(t)),
    new Promise((_, nein) => {
      t = setTimeout(() => nein(Object.assign(new Error("zeitlimit"), { code: "unavailable" })), ms);
    }),
  ]);
}

/**
 * Einen Slot laden – wirft nie. Ergebnis `{ ok:true, daten, leer }` oder `{ ok:false, code, message }`.
 * Technische Meldungen gehen nicht an die Oberfläche (Q-E4); `message` ist nur für das Protokoll.
 */
export async function ladeSlot(slot, session, id, ctx = {}) {
  try {
    const daten = await mitZeitlimit(Promise.resolve().then(() => slot.lade(session, id, ctx)), slot.zeitlimitMs ?? SLOT_ZEITLIMIT_MS);
    let leer = false;
    if (slot.leer) {
      try {
        leer = slot.leer(daten) === true;
      } catch {
        leer = false;
      }
    }
    return { ok: true, daten, leer };
  } catch (e) {
    return { ok: false, code: e?.code || "unavailable", message: String(e?.message || e) };
  }
}

/**
 * Alle sichtbaren Slots eines Reiters parallel laden (ein Fehler betrifft nur seinen Abschnitt).
 * @returns {Promise<Array<{slot:object, ergebnis:object}>>}
 */
export async function ladeSlotsFuer({ akte, tab, session, id, register = [], ctx = {} }) {
  const slots = slotsFuer({ akte, tab, session, register });
  const ergebnisse = await Promise.all(slots.map((s) => ladeSlot(s, session, id, { ...ctx, akte, tab })));
  return slots.map((slot, i) => ({ slot, ergebnis: ergebnisse[i] }));
}
