// src/lib/shop/lieferzeit.js
// Lieferzeit-Angabe des Onlineshops (Accessoire-Welt, Inhaber-Entscheidung
// Nr. 29; Owner-Entscheidung 31.10.2026: Agenten entwerfen, Inhaber/Kanzlei
// geben frei). Eine Quelle für die Zeile „Lieferzeit“ in der Zusammenfassung
// vor dem Bestell-Button (ShopCart) und das Badge „Sofort lieferbar“ (KaufBox).
//
// STATUS: ENTWURF – von KI-Agenten vorgeschlagen, Kanzlei-Durchsicht empfohlen.
// Kein Wert ist freigegeben. Die Zahlen sind bewusst KONSERVATIVE Vorschläge
// (Versand ab Lochau mit Paketdienst AT/DE plus Puffer für Verpackung Glas/
// Kerzen), keine Herstellerangaben. Herstellerlieferzeiten für Bestellware
// werden NICHT erfunden → „auf Anfrage“.
//
// Anzeige-Regel:
//   SHOP_MODE test → Vorschläge sichtbar, mit kleinem Marker „Entwurf“.
//   SHOP_MODE live → NUR freigegebene Werte (freigegeben: true + freigabe
//                    {datum, durch}); sonst neutral „Lieferzeit auf Anfrage“.
//   SHOP_MODE off  → nichts (Shop unsichtbar).
//   Gemischter Warenkorb (Lagerware + Bestellware) → Bestellware gilt für alles
//   (die längste Frist bestimmt die Angabe, sonst wäre sie irreführend).
//   Unbekanntes Land (z. B. CH, derzeit nicht lieferbar) → „auf Anfrage“.
//
// Rechtsgrundlagen (Kanzlei prüft Wortlaut und Ort der Angabe):
//   AT  FAGG § 4 Abs 1 Z 7: vor Vertragsabschluss „gegebenenfalls … der
//       Termin, bis zu dem sich der Unternehmer verpflichtet, die Waren zu
//       liefern“; § 8 Abs 1: in der Zusammenfassung unmittelbar vor der
//       Bestellung (wesentliche Informationen klar und hervorgehoben).
//       https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=20008847
//       → „Lieferzeit auf Anfrage“ erfüllt das für Lagerware NICHT; live darf
//         der Shop erst gehen, wenn die Werte freigegeben sind (release.js
//         „versandbedingungen“ + liveBlockers „lieferzeit:*“ in mode.js).
//   AT  KSchG § 7a: ohne Vereinbarung Lieferung ohne unnötigen Aufschub,
//       spätestens 30 Tage nach Vertragsabschluss. KSchG § 6 Abs 1 Z 1:
//       unbestimmte/unangemessen lange Leistungsfristen in AGB unwirksam.
//       https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10002462
//   DE  Art. 246a § 1 Abs 1 S 1 Nr 7 EGBGB (Termin, bis zu dem geliefert wird),
//       § 312j Abs 2 BGB (Zusammenfassung vor dem Button), § 308 Nr 1 BGB
//       (nicht hinreichend bestimmte Leistungsfrist unwirksam).
//       https://www.gesetze-im-internet.de/bgbeg/art_246a__1.html
//       https://www.gesetze-im-internet.de/bgb/__312j.html
//       https://www.gesetze-im-internet.de/bgb/__308.html
//   EU  Richtlinie 2011/83/EU Art. 6 Abs 1 lit g, Art. 8 Abs 2, Art. 18.
//       https://eur-lex.europa.eu/eli/dir/2011/83/oj
//   „Sofort lieferbar“ ist eine Tatsachenbehauptung: falsch = irreführend
//       (AT UWG § 2, DE UWG § 5). Darum nur für die vom Inhaber gepflegte
//       Liste SOFORT_LIEFERBAR, standardmäßig leer.
//       https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10002665
//       https://www.gesetze-im-internet.de/uwg_2004/__5.html
//
// „Werktage“ hier = Montag bis Freitag ohne gesetzliche Feiertage (AT); die
// Definition und der Fristbeginn (Vertragsschluss/Zahlungseingang) gehören in
// die Versandbedingungen (legal.js Slot „versand“, Kanzlei).
//
// Freigeben (Inhaber/Kanzlei): beim Eintrag freigegeben: true setzen UND
// freigabe: { datum: "JJJJ-MM-TT", durch: "Name", beleg: "Mail vom …" }.
// Werte ändern geht jederzeit; dann vorschlag: false.
// Rein, ohne "@/"-Importe (node --test); darf in Client-Inseln importiert werden.

export const LIEFERZEIT_STATUS = Object.freeze({ ENTWURF: "entwurf", FREI: "freigegeben" });

export const LIEFERZEIT_META = Object.freeze({
  status: LIEFERZEIT_STATUS.ENTWURF,
  hinweis: "Entwurf von KI-Agenten, Kanzlei-Durchsicht empfohlen",
  stand: "2026-10-31",
  zustaendig: "Inhaber (Werte) + Kanzlei (Wortlaut, Fristbeginn, Werktag-Definition)",
});

/** Entwurfs-Eintrag: nie freigegeben, bis Inhaber/Kanzlei ihn bestätigen. */
const vorschlag = (key, extra = {}) => Object.freeze({ key, ...extra, vorschlag: true, freigegeben: false, freigabe: null });

/**
 * Lieferzeit je Lieferart, Land und Bestandszustand.
 *   lager       = Artikel steht auf SOFORT_LIEFERBAR (liegt im Showroom Lochau)
 *   bestellware = wird beim Hersteller bestellt (Lieferzeit unbekannt → Anfrage)
 * key = Text in copy.js; min/max = Werktage.
 */
export const LIEFERZEIT = Object.freeze({
  versand: Object.freeze({
    // AT: Paketdienst innerhalb Österreichs i. d. R. 1–2 Werktage + bis 3 Werktage Kommissionierung/Verpackung (Glas, Kerzen).
    // Review 31.10.2026: Bestellware nennt eine Höchstfrist (maxTage). Reines „Lieferzeit auf
    // Anfrage“ ist kein Termin iSd § 4 Abs 1 Z 7 FAGG / Art. 246a § 1 Abs 1 Nr 7 EGBGB (DE:
    // Abmahnrisiko). 30 Tage = gesetzliche Auffangfrist § 7a KSchG
    // (https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10002462).
    // Inhaber bestätigt, ob die 30 Tage bei Herstellerbestellungen haltbar sind.
    AT: Object.freeze({ lager: vorschlag("deliveryWorkdays", { min: 3, max: 5 }), bestellware: vorschlag("deliveryOnRequest", { maxTage: 30 }) }),
    // DE: grenzüberschreitend i. d. R. 2–4 Werktage + gleicher Puffer.
    DE: Object.freeze({ lager: vorschlag("deliveryWorkdays", { min: 4, max: 7 }), bestellware: vorschlag("deliveryOnRequest", { maxTage: 30 }) }),
  }),
  abholung: Object.freeze({ lager: vorschlag("pickupReady"), bestellware: vorschlag("pickupOnRequest", { maxTage: 30 }) }),
});

/**
 * Kuratierte Lagerliste (Produkt-Slugs, die im Showroom vorrätig sind und
 * sofort versendet werden können). PFLEGT DER INHABER. Leer = kein Artikel
 * gilt als Lagerware, kein Badge „Sofort lieferbar“, überall „auf Anfrage“.
 * Beispiel: Object.freeze(["baobab-collection-max-16-…"])
 */
export const SOFORT_LIEFERBAR = Object.freeze([]);

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Eintrag belegt freigegeben? */
export const lieferzeitFreigegeben = (e) => e?.freigegeben === true && DATE_RE.test(e.freigabe?.datum || "") && typeof e.freigabe?.durch === "string" && e.freigabe.durch.trim().length > 0;

/** Ist der Artikel kuratierte Lagerware? */
export const istSofortLieferbar = (slug, lager = SOFORT_LIEFERBAR) => typeof slug === "string" && lager.includes(slug);

/** Ungültige Einträge der Lagerliste (Format, Doppelte). */
export function lagerListeFehler(lager = SOFORT_LIEFERBAR) {
  const seen = new Set();
  const out = [];
  for (const s of lager) {
    if (typeof s !== "string" || !SLUG_RE.test(s)) out.push(`format:${s}`);
    else if (seen.has(s)) out.push(`doppelt:${s}`);
    seen.add(s);
  }
  return out;
}

/** Bestandszustand eines Warenkorbs: "lager" nur, wenn ALLE Artikel Lagerware sind. */
export const bestandOf = (slugs, lager = SOFORT_LIEFERBAR) => (Array.isArray(slugs) && slugs.length > 0 && slugs.every((s) => istSofortLieferbar(s, lager)) ? "lager" : "bestellware");

/**
 * Hat ein Versand-Eintrag einen Termin (min/max Werktage oder Höchstfrist maxTage)?
 * FAGG § 4 Abs 1 Z 7 / Art. 246a § 1 Abs 1 Nr 7 EGBGB verlangen den Termin, bis zu dem
 * geliefert wird – reines „auf Anfrage“ genügt auch freigegeben nicht.
 */
export const lieferzeitMitTermin = (e) => (Number.isInteger(e?.min) && Number.isInteger(e?.max)) || (Number.isInteger(e?.maxTage) && e.maxTage > 0);

/** Nicht freigegebene Einträge als Ids (für liveBlockers); Versand ohne Termin bleibt offen. */
export function lieferzeitOffen(config = LIEFERZEIT) {
  const out = [];
  for (const [land, z] of Object.entries(config.versand || {})) for (const [b, e] of Object.entries(z)) if (!lieferzeitFreigegeben(e) || !lieferzeitMitTermin(e)) out.push(`versand.${land}.${b}`);
  for (const [b, e] of Object.entries(config.abholung || {})) if (!lieferzeitFreigegeben(e)) out.push(`abholung.${b}`);
  return out;
}

/**
 * Was zeigt die Zeile „Lieferzeit“?
 * @param {{ lieferart?: "versand"|"abholung", land?: string, slugs?: string[], mode?: "off"|"test"|"live", config?: object, lager?: string[] }} o
 * @returns {null | { key: string, vars: object, entwurf: boolean, bestand: "lager"|"bestellware" }}
 *   key = Text in copy.js (fillCopy mit vars), entwurf = Marker „Entwurf“ zeigen
 */
export function lieferzeitFuer({ lieferart = "versand", land = "AT", slugs = [], mode = "test", config = LIEFERZEIT, lager = SOFORT_LIEFERBAR } = {}) {
  if (mode !== "test" && mode !== "live") return null;
  const abholung = lieferart === "abholung";
  const bestand = bestandOf(slugs, lager);
  const e = abholung ? config.abholung?.[bestand] : config.versand?.[land]?.[bestand];
  const frei = lieferzeitFreigegeben(e);
  const zeigen = e && (frei || (mode === "test" && e.vorschlag === true));
  if (!zeigen) return { key: abholung ? "pickupOnRequestPlain" : "deliveryOnRequestPlain", vars: {}, entwurf: false, bestand };
  const vars = { ...(Number.isInteger(e.min) && Number.isInteger(e.max) ? { min: e.min, max: e.max } : {}), ...(Number.isInteger(e.maxTage) ? { maxTage: e.maxTage } : {}) };
  return { key: e.key, vars, entwurf: !frei, bestand };
}

/** Fertiger Text aus copy (Schlüssel aus lieferzeitFuer). */
export const lieferzeitText = (r, copy) => (r ? String(copy?.[r.key] ?? "").replace(/\{(\w+)\}/g, (m, k) => (r.vars?.[k] != null ? String(r.vars[k]) : m)) : "");
