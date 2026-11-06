// Bereich Sortiment – Fachaufrufe mit Frappe- und Mock-Pfad (MASTER § 5.3 Nr. 5 „Jede Server Action hat einen
// Mock-Pfad“). Frappe: die whitelisted Methoden von ph_sortiment / ph_logistik exakt mit ihren Argumenten
// (10-konzept-sortiment § 5.6). Mock: dieselbe Wirkung auf die In-Memory-Datenbank, damit jede Kette im Testmodus
// durchläuft (Status, Merker, Abgleich, Übermittlung, Lieferung). Reines Modul (relative Importe), unit-getestet
// mit dem MockClient (tests/unit/sortiment-methoden.test.mjs). Wirft BackofficeError; die Server Actions bilden ab.

import { BackofficeError } from "../frappe/errors.js";
import { isoDatumZeit } from "../format.js";
import { abgleich, bestellSperrgrund, bestellstatusAusMengen, isoTag, KLAERUNG, mengenAbgleich, offeneAbweichungen, produktSlug, sperrgrund, weStatusAus } from "./regeln.js";
import { abMerker, abVollstaendig, AdapterFehler, exportDaten, exportieren as exportDatei, uebermittlungErlaubt, wegFuerBestellweg } from "./uebermittlung.js";

export const EINST = "PH Sortiment Einstellungen";

const istMock = (client) => client?.modus === "mock";

function klon(x) {
  return JSON.parse(JSON.stringify(x));
}

/** Mock: Werte direkt schreiben (auch Status/Workflow), mit Stempel, Version und optionalem Kommentar. */
export function mockSchreibe(client, doctype, name, werte, { kommentar, art = "Info" } = {}) {
  const t = client.tabelle(doctype);
  const alt = t.get(name);
  if (!alt) throw new BackofficeError("not_found", "Datensatz wurde nicht gefunden.");
  const neu = { ...alt, ...klon(werte) };
  client.stempel(neu);
  t.set(name, neu);
  client.version(doctype, name, alt, neu);
  if (kommentar) client.kommentar(doctype, name, kommentar, art);
  return klon(neu);
}

/** Einstellungen Sortiment (Single), leer bei fehlendem Recht. */
export async function einstellungen(client) {
  try {
    return await client.getDoc(EINST, EINST);
  } catch {
    return {};
  }
}

function zeitJetzt(client) {
  return isoDatumZeit(client.jetzt ? client.jetzt() : new Date());
}

function heute(client) {
  return isoTag(client.jetzt ? client.jetzt() : new Date());
}

// ---------------------------------------------------------------- Produkte --

/** Produkt anlegen (Schnellanlage § 3.3). Dublette (gleiche Web-Adresse) wird am Server erneut geprüft. */
export async function produktAnlegen(client, { marke, kategorie, bezeichnung, artikelnr = "", ean = "", collection = "", serie = "", designer = "" }) {
  if (!marke || !kategorie || !String(bezeichnung || "").trim()) throw new BackofficeError("invalid", "Marke, Kategorie und Bezeichnung angeben.");
  const slug = produktSlug({ marke, bezeichnung });
  if (!slug) throw new BackofficeError("invalid", "Bezeichnung angeben.");
  const vorhanden = await client.getList("PH Produkt", { fields: ["name"], filters: [["slug", "=", slug]], limit: 1 });
  if (vorhanden.length) throw new BackofficeError("conflict", "Gibt es schon – gleiche Web-Adresse.", { detail: vorhanden[0].name });
  const bez = String(bezeichnung).trim().slice(0, 140);
  return client.insert("PH Produkt", {
    name_herstellerbezeichnung: bez,
    titel: bez,
    slug,
    marke,
    kategorie,
    status: "Entwurf",
    typ: "Katalog",
    hersteller_artikelnr: String(artikelnr).trim().slice(0, 60),
    ean: String(ean).trim(),
    collection,
    serie,
    designer,
    preisart: "Verkaufspreis",
    website_sichtbar: 1,
    import_quelle: "manuell",
  });
}

/** Produkt-Workflow (Frappe: workflowAction; Mock: gleiche Regeln aus regeln.sperrgrund). */
export async function produktWorkflow(client, name, aktion, { leitung = false } = {}) {
  if (!istMock(client)) return client.workflowAction("PH Produkt", name, aktion);
  const p = await client.getDoc("PH Produkt", name);
  const marke = p.marke ? await client.getDoc("PH Marke", p.marke).catch(() => null) : null;
  const kategorie = p.kategorie ? await client.getDoc("PH Kategorie", p.kategorie).catch(() => null) : null;
  const grund = sperrgrund(p, aktion, { marke, kategorie, leitung });
  if (grund) throw new BackofficeError(grund.startsWith("Nur") ? "forbidden" : "invalid", grund);
  const nach = { "Prüfen": "Geprueft", "Veröffentlichen": "Aktiv", "Zurück auf Entwurf": "Entwurf", Pausieren: "Pausiert", Reaktivieren: "Aktiv", "Auslaufen lassen": "Ausgelaufen" }[aktion];
  const werte = { status: nach, workflow_state: `PH ${nach}` };
  if (aktion === "Prüfen") Object.assign(werte, { geprueft_von: client.session.user, geprueft_am: zeitJetzt(client) });
  if (nach === "Aktiv") werte.veroeffentlicht_am = zeitJetzt(client);
  return mockSchreibe(client, "PH Produkt", name, werte, { kommentar: `Workflow: ${aktion} → ${nach}`, art: "Workflow" });
}

/**
 * Preis hinzufügen (§ 5.6 preis_hinzufuegen). Team: freigegeben=0, Leitung: freigegeben=1.
 * Mock: Zeile anhängen und den aktuellen Preis neu rechnen (wie tasks.preisstand_pruefen für das Dokument).
 */
export async function preisHinzufuegen(client, produkt, { brutto_cent, stand, preisart = "Verkaufspreis", quelle = "Herstellerliste", quelle_url = "", ab, ausfuehrung = "", freigegeben = 0 }) {
  if (!Number.isInteger(brutto_cent) || brutto_cent <= 0) throw new BackofficeError("invalid", "Betrag im Format 1.234,50");
  const tag = stand || heute(client);
  const args = { brutto_cent, stand: tag, preisart, quelle, quelle_url, ab: ab || tag, ausfuehrung, freigegeben: freigegeben ? 1 : 0 };
  if (!istMock(client)) return client.runDocMethod("PH Produkt", produkt, "preis_hinzufuegen", args);
  const p = await client.getDoc("PH Produkt", produkt);
  if ((p.preise || []).some((z) => z.ab === args.ab && z.preisart === preisart && (z.ausfuehrung || "") === (ausfuehrung || ""))) {
    throw new BackofficeError("conflict", "Für dieses Datum gibt es schon einen Preis dieser Art.");
  }
  const zeile = { ...args, waehrung: "EUR", freigegeben_von: freigegeben ? client.session.user : "", freigegeben_am: freigegeben ? tag : "" };
  const preise = [...(p.preise || []), { ...zeile, doctype: "PH Produkt Preis", parentfield: "preise", parenttype: "PH Produkt", parent: produkt, idx: (p.preise || []).length + 1, name: `preise-${produkt}-${Date.now()}` }];
  const werte = { preise };
  if (freigegeben && args.ab <= heute(client) && !ausfuehrung) Object.assign(werte, { aktueller_preis_cent: brutto_cent, aktueller_preis_stand: tag, preisstand_alt: 0, preisart: preisart === "UVP" ? "UVP" : "Verkaufspreis" });
  return mockSchreibe(client, "PH Produkt", produkt, werte, { kommentar: `Preis ${(brutto_cent / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} € erfasst${freigegeben ? "" : " (Freigabe offen)"}` });
}

/**
 * Freigabe von Bild, Preis oder Lieferzeit (§ 3.9). Ziele: [{ produkt, zeile? (name der Kindzeile) }].
 * Beide Modi über getDoc + save (Kindtabellen), damit Frappe Rechte und Validierung selbst prüft.
 */
export async function freigabeSetzen(client, { art, ziele = [], entscheidung, grund = "" }) {
  if (!["bild", "preis", "lieferzeit"].includes(art)) throw new BackofficeError("invalid", "Unbekannte Freigabe.");
  if (!["freigeben", "ablehnen"].includes(entscheidung)) throw new BackofficeError("invalid", "Unbekannte Entscheidung.");
  if (entscheidung === "ablehnen" && String(grund).trim().length < 5) throw new BackofficeError("invalid", "Grund angeben (mindestens 5 Zeichen).");
  const jeProdukt = new Map();
  for (const z of ziele) {
    if (!z?.produkt) continue;
    if (!jeProdukt.has(z.produkt)) jeProdukt.set(z.produkt, []);
    if (z.zeile) jeProdukt.get(z.produkt).push(z.zeile);
  }
  const ergebnis = [];
  const t = heute(client);
  for (const [produkt, zeilen] of jeProdukt) {
    const p = await client.getDoc("PH Produkt", produkt);
    const werte = { name: produkt };
    if (art === "bild") {
      werte.bilder = (p.bilder || []).map((b) => (zeilen.includes(b.name) ? { ...b, freigabe: entscheidung === "freigeben" ? "erteilt" : "abgelehnt", freigabe_datum: t } : b));
      werte.bild_freigegeben = werte.bilder.some((b) => b.freigabe === "erteilt") ? 1 : 0;
      werte.bilder_offen = werte.bilder.filter((b) => b.freigabe !== "erteilt").length;
    } else if (art === "preis") {
      werte.preise = (p.preise || [])
        .filter((z) => !(entscheidung === "ablehnen" && zeilen.includes(z.name)))
        .map((z) => (zeilen.includes(z.name) ? { ...z, freigegeben: 1, freigegeben_von: client.session.user, freigegeben_am: t } : z));
      const neu = werte.preise.filter((z) => zeilen.includes(z.name) && z.freigegeben && z.ab <= t && !z.ausfuehrung).sort((a, b) => String(b.ab).localeCompare(String(a.ab)))[0];
      if (neu) Object.assign(werte, { aktueller_preis_cent: neu.brutto_cent, aktueller_preis_stand: neu.stand, preisstand_alt: 0 });
    } else {
      Object.assign(werte, entscheidung === "freigeben" ? { lieferzeit_freigegeben: 1, lieferzeit_freigabe_datum: t, lieferzeit_freigabe_durch: client.session.user } : { lieferzeit_freigegeben: 0 });
    }
    // Frappe rechnet bild_freigegeben/aktueller Preis im Controller nach; im Mock schreiben wir die Werte direkt.
    if (istMock(client)) mockSchreibe(client, "PH Produkt", produkt, werte);
    else await client.save("PH Produkt", werte, { modified: p.modified });
    if (entscheidung === "ablehnen") client.kommentar?.("PH Produkt", produkt, `${art === "bild" ? "Bild" : art === "preis" ? "Preis" : "Lieferzeit"} abgelehnt: ${String(grund).slice(0, 200)}`, "Comment");
    ergebnis.push(produkt);
  }
  return { produkte: ergebnis };
}

/** Website jetzt aktualisieren – einmal für alle (§ 5.7). */
export async function websiteAktualisieren(client, produkt) {
  if (!istMock(client)) return client.runDocMethod("PH Produkt", produkt, "website_cache_erneuern", {});
  const g = (globalThis.__phBoSortimentWebsite ||= { zuletzt: 0 });
  const jetzt = Date.now();
  if (jetzt - g.zuletzt < 60_000) return { status: "gedrosselt" };
  g.zuletzt = jetzt;
  return { status: "enqueued" };
}

// ------------------------------------------------------------- Bestellungen --

async function bestellung(client, name) {
  return client.getDoc("PH Herstellerbestellung", name);
}

async function lieferantVon(client, b) {
  if (!b?.lieferant) return null;
  return client.getDoc("PH Lieferant", b.lieferant).catch(() => null);
}

/** Herstellerbestellung anlegen (Formular § 3.7). */
export async function bestellungAnlegen(client, { lieferant, kommission = "", wunschtermin = "", lieferadresse = "Lager", notizen_lieferant = "", positionen = [], quelle = "backoffice", bezug_doctype = "", bezug_name = "" }) {
  const zeilen = positionen
    .filter((p) => String(p.bezeichnung || "").trim() && Number(p.menge) > 0)
    .map((p) => ({ produkt: p.produkt || "", bezeichnung: String(p.bezeichnung).slice(0, 140), hersteller_artikelnr: p.hersteller_artikelnr || "", ausfuehrung_text: p.ausfuehrung_text || "", menge: Math.trunc(Number(p.menge)), einheit: "Stk", ek_cent: Number.isInteger(p.ek_cent) ? p.ek_cent : undefined, wunschtermin: p.wunschtermin || wunschtermin || "", kommission: p.kommission || kommission, status: "Offen", ab_merker: "offen" }));
  if (!lieferant) throw new BackofficeError("invalid", "Lieferant wählen.");
  if (!zeilen.length) throw new BackofficeError("invalid", "Mindestens eine Position mit Menge angeben.");
  if (positionen.some((p) => p.menge !== undefined && p.menge !== "" && !Number.isInteger(Number(p.menge)))) throw new BackofficeError("invalid", "Mengen nur ganzzahlig.");
  const lf = lieferant ? await client.getDoc("PH Lieferant", lieferant).catch(() => null) : null;
  return client.insert("PH Herstellerbestellung", {
    naming_series: "HB-.YYYY.-.#####",
    titel: `${lf?.marke || lieferant || "Bestellung"} · ${kommission || "Lager"}`,
    lieferant: lieferant || "",
    marke: lf?.marke || "",
    status: "Entwurf",
    kommission,
    datum: heute(client),
    wunschtermin,
    lieferadresse,
    notizen_lieferant,
    bestellweg: lf?.bestellweg || "",
    waehrung: "EUR",
    positionen: zeilen,
    menge_bestellt: zeilen.reduce((a, p) => a + p.menge, 0),
    quelle,
    bezug_doctype,
    bezug_name,
  });
}

/** Per E-Mail senden (§ 5.2): Frappe per_email_senden setzt den Status selbst. */
export async function perEmailSenden(client, name, { empfaenger = "", nachricht = "" } = {}) {
  const b = await bestellung(client, name);
  const lf = await lieferantVon(client, b);
  const grund = bestellSperrgrund(b, "senden", { lieferant: lf || { bestell_email: empfaenger } });
  if (grund && !(grund.startsWith("Bestell-E-Mail") && empfaenger)) throw new BackofficeError("invalid", grund);
  const an = empfaenger || lf?.bestell_email;
  if (!an) throw new BackofficeError("invalid", "Empfänger fehlt.");
  if (!istMock(client)) return client.runDocMethod("PH Herstellerbestellung", name, "per_email_senden", { empfaenger: an, nachricht });
  const jetzt = zeitJetzt(client);
  return mockSchreibe(
    client,
    "PH Herstellerbestellung",
    name,
    {
      status: "Gesendet",
      workflow_state: "PH Gesendet",
      gesendet_an: an,
      gesendet_am: jetzt,
      gesendet_von: client.session.user,
      uebermittlung_weg: b.uebermittlung_weg || "E-Mail",
      uebermittlung_status: "Uebermittelt",
      uebermittlung_am: jetzt,
      uebermittlungen: [...(b.uebermittlungen || []), { doctype: "PH Herstellerbestellung Uebermittlung", idx: (b.uebermittlungen || []).length + 1, zeitpunkt: jetzt, weg: "E-Mail", status: "Uebermittelt", hinweis: `PDF an ${an}`.slice(0, 140), von: client.session.user }],
    },
    { kommentar: `Bestellung per E-Mail an ${an} gesendet`, art: "Comment" }
  );
}

/** Als gesendet markieren (anderer Weg: Portal, Fax, Telefon, persönlich). */
export async function alsGesendetMarkieren(client, name, { weg = "Lieferantenportal" } = {}) {
  const b = await bestellung(client, name);
  if (b.status !== "Entwurf") throw new BackofficeError("invalid", "Nur Entwürfe können gesendet werden.");
  if (!b.lieferant || !(b.positionen || []).length) throw new BackofficeError("invalid", "Lieferant und Positionen angeben.");
  if (!istMock(client)) {
    await client.workflowAction("PH Herstellerbestellung", name, "Senden");
    await client.kommentar?.("PH Herstellerbestellung", name, `Gesendet über ${weg}`);
    return { name };
  }
  return mockSchreibe(client, "PH Herstellerbestellung", name, { status: "Gesendet", workflow_state: "PH Gesendet", gesendet_am: zeitJetzt(client), gesendet_von: client.session.user, gesendet_an: weg }, { kommentar: `Gesendet über ${weg}`, art: "Comment" });
}

/** Workflow-Übergänge der Bestellung (ohne „Lieferung buchen“, E8). */
export async function bestellWorkflow(client, name, aktion, { leitung = false, grund = "" } = {}) {
  const erlaubt = { Stornieren: "stornieren", "AB freigeben": "abBestaetigen", "Abschließen": "abschliessen" };
  if (!erlaubt[aktion]) throw new BackofficeError("invalid", "Diese Aktion bietet die Oberfläche nicht an.");
  const b = await bestellung(client, name);
  const sperre = bestellSperrgrund(b, erlaubt[aktion], { leitung });
  if (sperre) throw new BackofficeError(sperre.includes("Leitung") ? "forbidden" : "invalid", sperre);
  if (aktion === "Stornieren" && b.status !== "Entwurf" && String(grund).trim().length < 5) throw new BackofficeError("invalid", "Grund angeben (mindestens 5 Zeichen).");
  if (!istMock(client)) {
    const r = await client.workflowAction("PH Herstellerbestellung", name, aktion);
    if (grund) await client.kommentar?.("PH Herstellerbestellung", name, `${aktion}: ${grund}`);
    return r;
  }
  const nach = { Stornieren: "Storniert", "AB freigeben": "AB geprueft", "Abschließen": "Abgeschlossen" }[aktion];
  const werte = { status: nach, workflow_state: `PH ${nach}` };
  if (nach === "AB geprueft") Object.assign(werte, { ab_geprueft_von: client.session.user, ab_geprueft_am: zeitJetzt(client) });
  return mockSchreibe(client, "PH Herstellerbestellung", name, werte, { kommentar: `Workflow: ${aktion} → ${nach}${grund ? ` (${grund})` : ""}`, art: "Workflow" });
}

/** Abgleich + Merker neu rechnen (Mock; Frappe macht das in ab_abgleich_erzeugen/abweichung_*). */
function abgleichNeu(doc, toleranz, behalten = []) {
  const { protokoll, kennzeichen, spaetester } = abgleich(doc.positionen || [], toleranz);
  // Bewertungen gleicher Werte bleiben (wie ab_abgleich_erzeugen)
  const zeilen = protokoll.map((z, i) => {
    const alt = behalten.find((x) => Number(x.position) === z.position && x.feld === z.feld && x.bestaetigt === z.bestaetigt);
    return { ...z, ...(alt ? { bewertung: alt.bewertung, kommentar: alt.kommentar, klaerung: alt.klaerung, geklaert_am: alt.geklaert_am, geprueft_von: alt.geprueft_von, geprueft_am: alt.geprueft_am } : {}), doctype: "PH AB Abgleich", parentfield: "ab_abgleich", parenttype: "PH Herstellerbestellung", parent: doc.name, idx: i + 1, name: `ab_abgleich-${doc.name}-${i + 1}` };
  });
  const positionen = (doc.positionen || []).map((p, i) => {
    const idx = i + 1;
    const merker = abMerker(!!doc.ab_nummer, zeilen.filter((z) => z.position === idx));
    return { ...p, abweichung: kennzeichen[idx] || "keine", ab_merker: merker, ab_merker_am: p.ab_merker === merker ? p.ab_merker_am : doc.ab_datum, status: p.status === "Offen" && doc.ab_nummer ? "Bestaetigt" : p.status };
  });
  return {
    positionen,
    ab_abgleich: zeilen,
    abweichungen_anzahl: zeilen.length,
    abweichungen_offen: offeneAbweichungen(zeilen),
    ab_vollstaendig: abVollstaendig(positionen.filter((p) => p.status !== "Storniert").map((p) => p.ab_merker)) ? 1 : 0,
    bestaetigter_termin: spaetester || doc.bestaetigter_termin || "",
  };
}

async function toleranzen(client) {
  const e = await einstellungen(client);
  return { toleranzPreis: Number(e.ab_toleranz_preis_prozent) || 0, toleranzTermin: Number(e.ab_toleranz_termin_tage) || 0 };
}

/**
 * AB einlesen (A10): positionen = [{ idx, ab_menge?, ab_ek_cent?, bestaetigter_termin?, ab_artikelnr?, ab_ausfuehrung_text? }].
 * Leere Werte = nicht bestätigt (werden nicht verglichen). → { abweichungen, offen }
 */
export async function abEinlesen(client, name, { ab_nummer, ab_datum, positionen = [], ab_datei = "" }) {
  if (!String(ab_nummer || "").trim()) throw new BackofficeError("invalid", "AB-Nummer angeben");
  const b = await bestellung(client, name);
  const sperre = bestellSperrgrund(b, "abEinlesen");
  if (sperre) throw new BackofficeError("invalid", sperre);
  if (!istMock(client)) return client.runDocMethod("PH Herstellerbestellung", name, "ab_einlesen", { ab_nummer, ab_datum, positionen, ab_datei });
  const neuPos = (b.positionen || []).map((p, i) => {
    const w = positionen.find((x) => Number(x.idx) === (p.idx || i + 1)) || {};
    const z = { ...p };
    for (const f of ["ab_menge", "ab_ek_cent", "bestaetigter_termin", "ab_artikelnr", "ab_ausfuehrung_text"]) if (w[f] !== undefined && w[f] !== "" && w[f] !== null) z[f] = w[f];
    return z;
  });
  const doc = { ...b, positionen: neuPos, ab_nummer: String(ab_nummer).trim(), ab_datum: ab_datum || heute(client) };
  const neu = abgleichNeu(doc, await toleranzen(client), b.ab_abgleich || []);
  const r = mockSchreibe(client, "PH Herstellerbestellung", name, { ...neu, ab_nummer: doc.ab_nummer, ab_datum: doc.ab_datum, ab_eingang: zeitJetzt(client), ab_datei: ab_datei || b.ab_datei || "", status: "AB erhalten", workflow_state: "PH AB erhalten" }, { kommentar: `AB ${doc.ab_nummer} erfasst: ${neu.abweichungen_anzahl} Abweichungen`, art: "Comment" });
  return { abweichungen: r.abweichungen_anzahl, offen: r.abweichungen_offen, doc: r };
}

/** Bewertung einer Abweichung (OK · Rückfrage · Ablehnen); Ablehnen und Preis-OK nur Leitung. */
export async function abweichungBewerten(client, name, { zeile, bewertung, kommentar = "" }, { leitung = false } = {}) {
  const b = await bestellung(client, name);
  const z = (b.ab_abgleich || []).find((x) => x.idx === Number(zeile) || x.name === zeile);
  if (!z) throw new BackofficeError("not_found", "Abweichung nicht gefunden.");
  if (bewertung === "abgelehnt" && !leitung) throw new BackofficeError("forbidden", "Ablehnen: Leitung");
  if (bewertung === "ok" && z.feld === "Preis" && !leitung) throw new BackofficeError("forbidden", "Preis akzeptieren: Leitung");
  if (!["offen", "ok", "pruefen", "abgelehnt"].includes(bewertung)) throw new BackofficeError("invalid", "Unbekannte Bewertung.");
  if (!istMock(client)) return client.runDocMethod("PH Herstellerbestellung", name, "abweichung_bewerten", { zeile: z.idx, bewertung, kommentar });
  const zeilen = (b.ab_abgleich || []).map((x) => (x === z || x.idx === z.idx ? { ...x, bewertung, kommentar: kommentar || x.kommentar || "", geprueft_von: client.session.user, geprueft_am: zeitJetzt(client) } : x));
  return merkerSchreiben(client, b, zeilen);
}

/** Klärung (§ 5.2, E3): akzeptieren (Preis: Leitung) · lieferant_reklamieren (Mail) · kunde_rueckfragen (Aufgabe). */
export async function abweichungKlaeren(client, name, { zeile, aktion, text = "" }, { leitung = false } = {}) {
  if (!KLAERUNG[aktion]) throw new BackofficeError("invalid", "Unbekannte Klärung.");
  const b = await bestellung(client, name);
  const z = (b.ab_abgleich || []).find((x) => x.idx === Number(zeile) || x.name === zeile);
  if (!z) throw new BackofficeError("not_found", "Abweichung nicht gefunden.");
  if (aktion === "akzeptieren" && z.feld === "Preis" && !leitung) throw new BackofficeError("forbidden", "Preis akzeptieren: Leitung");
  if (!istMock(client)) return client.runDocMethod("PH Herstellerbestellung", name, "abweichung_klaeren", { zeile: z.idx, aktion, text });
  const [bewertung, vermerk] = KLAERUNG[aktion];
  const zeilen = (b.ab_abgleich || []).map((x) => (x.idx === z.idx ? { ...x, bewertung, klaerung: vermerk, geklaert_am: zeitJetzt(client), kommentar: text || x.kommentar || "" } : x));
  return merkerSchreiben(client, b, zeilen, aktion === "lieferant_reklamieren" ? "Rückfrage an den Hersteller gesendet" : aktion === "kunde_rueckfragen" ? "Rückfrage an den Verkauf als Aufgabe angelegt" : "Abweichung akzeptiert");
}

function merkerSchreiben(client, b, zeilen, kommentar) {
  const positionen = (b.positionen || []).map((p, i) => {
    const idx = p.idx || i + 1;
    return { ...p, ab_merker: abMerker(!!b.ab_nummer, zeilen.filter((z) => Number(z.position) === idx)) };
  });
  const r = mockSchreibe(client, "PH Herstellerbestellung", b.name, { ab_abgleich: zeilen, positionen, abweichungen_offen: offeneAbweichungen(zeilen), ab_vollstaendig: abVollstaendig(positionen.filter((p) => p.status !== "Storniert").map((p) => p.ab_merker)) ? 1 : 0 }, kommentar ? { kommentar, art: "Comment" } : {});
  return { offen: r.abweichungen_offen, vollstaendig: !!r.ab_vollstaendig, doc: r };
}

/** AB nachfragen (nur Status Gesendet). */
export async function abNachfragen(client, name, { nachricht = "" } = {}) {
  const b = await bestellung(client, name);
  if (b.status !== "Gesendet") throw new BackofficeError("invalid", "Nachfragen nur bei gesendeten Bestellungen.");
  if (!istMock(client)) return client.runDocMethod("PH Herstellerbestellung", name, "ab_nachfragen", { nachricht });
  const lf = await lieferantVon(client, b);
  client.kommentar("PH Herstellerbestellung", name, `AB nachgefragt bei ${lf?.bestell_email || b.lieferant}`, "Comment");
  return { name };
}

/** Termin ändern (Grund Pflicht). */
export async function terminAendern(client, name, { termin, grund, quelle = "Lieferant" }) {
  if (!termin) throw new BackofficeError("invalid", "Neuen Termin angeben.");
  if (String(grund || "").trim().length < 3) throw new BackofficeError("invalid", "Grund angeben.");
  if (!istMock(client)) return client.runDocMethod("PH Herstellerbestellung", name, "termin_aendern", { termin, grund, quelle });
  const b = await bestellung(client, name);
  const zeile = { doctype: "PH Herstellerbestellung Terminaenderung", idx: (b.terminaenderungen || []).length + 1, datum: zeitJetzt(client), termin_alt: b.bestaetigter_termin || b.wunschtermin || "", termin_neu: termin, grund, quelle };
  return mockSchreibe(client, "PH Herstellerbestellung", name, { bestaetigter_termin: termin, liefertermin_geaendert_am: zeitJetzt(client), terminaenderungen: [...(b.terminaenderungen || []), zeile] }, { kommentar: `Termin geändert auf ${termin.split("-").reverse().join(".")}: ${grund}`, art: "Comment" });
}

/**
 * Exportdatei erzeugen (IWOfurn/EDI/CSV, § „exportieren“). → { datei, weg, verifiziert, hinweis, inhalt? }
 * Frappe legt die Datei als privaten Anhang ab; der Mock erzeugt dieselbe Datei über uebermittlung.js.
 */
export async function exportieren(client, name, weg) {
  const b = await bestellung(client, name);
  const lf = await lieferantVon(client, b);
  const w = weg || b.uebermittlung_weg || wegFuerBestellweg(lf?.bestellweg || b.bestellweg);
  const wegDatei = w === "E-Mail" ? "CSV" : w;
  if (!istMock(client)) return client.runDocMethod("PH Herstellerbestellung", name, "exportieren", { weg: wegDatei });
  const einst = await einstellungen(client);
  const d = exportDaten(b, { lieferant: lf || {}, einst });
  let e;
  try {
    e = exportDatei(wegDatei, d.bestellung, d.absender, d.lieferant, { jetzt: client.jetzt ? client.jetzt() : new Date() });
  } catch (err) {
    if (err instanceof AdapterFehler) throw new BackofficeError("invalid", `Export nicht möglich: ${err.message}`);
    throw err;
  }
  const datei = await client.uploadFile({ doctype: "PH Herstellerbestellung", name, dateiname: e.dateiname, inhalt: e.inhalt });
  const jetzt = zeitJetzt(client);
  mockSchreibe(client, "PH Herstellerbestellung", name, {
    export_am: jetzt,
    uebermittlung_weg: b.uebermittlung_weg || wegDatei,
    uebermittlung_status: "Exportiert",
    uebermittlung_am: jetzt,
    uebermittlung_datei: datei.file_url,
    uebermittlungen: [...(b.uebermittlungen || []), { doctype: "PH Herstellerbestellung Uebermittlung", idx: (b.uebermittlungen || []).length + 1, zeitpunkt: jetzt, weg: wegDatei, status: "Exportiert", datei: datei.file_url, hinweis: (e.hinweis || "").slice(0, 140), von: client.session.user }],
  });
  return { datei: datei.file_url, weg: wegDatei, verifiziert: e.verifiziert, hinweis: e.hinweis, inhalt: e.inhalt, dateiname: e.dateiname };
}

/** Übermittlung setzen: Uebermittelt · Bestaetigt · Fehler (Uebermittelt aus Entwurf → Gesendet). */
export async function uebermittlungSetzen(client, name, { status, hinweis = "" }) {
  if (!["Vorbereitet", "Uebermittelt", "Bestaetigt", "Fehler"].includes(status)) throw new BackofficeError("invalid", "Status ungültig.");
  const b = await bestellung(client, name);
  if (!uebermittlungErlaubt(b.uebermittlung_status, status)) throw new BackofficeError("invalid", "Dieser Übermittlungsschritt ist jetzt nicht möglich.");
  if (!istMock(client)) return client.runDocMethod("PH Herstellerbestellung", name, "uebermittlung_setzen", { status, hinweis });
  const jetzt = zeitJetzt(client);
  const werte = {
    uebermittlung_status: status,
    uebermittlung_am: jetzt,
    uebermittlungen: [...(b.uebermittlungen || []), { doctype: "PH Herstellerbestellung Uebermittlung", idx: (b.uebermittlungen || []).length + 1, zeitpunkt: jetzt, weg: b.uebermittlung_weg || "Manuell", status, hinweis: String(hinweis).slice(0, 140), von: client.session.user }],
  };
  if (status === "Uebermittelt" && b.status === "Entwurf") Object.assign(werte, { status: "Gesendet", workflow_state: "PH Gesendet", gesendet_am: jetzt, gesendet_von: client.session.user, gesendet_an: b.uebermittlung_weg || "Portal" });
  return mockSchreibe(client, "PH Herstellerbestellung", name, werte, { kommentar: `Übermittlung: ${status}${hinweis ? ` – ${hinweis}` : ""}`, art: "Comment" });
}

// -------------------------------------------------------------- Wareneingang --

/**
 * Wareneingang buchen (S3): Restmengen am Server neu gerechnet, Doppelbuchung über Lieferschein-Nr.
 * positionen = [{ idx, menge_erhalten, zustand, hinweis, seriennummer }]. Mock verbucht wie lieferung_verbuchen.
 */
export async function wareneingangBuchen(client, { bestellung: hb, datum, lieferschein_nr_lieferant = "", spediteur = "", packstuecke = 1, positionen = [] }) {
  const b = await bestellung(client, hb);
  const sperre = bestellSperrgrund(b, "eingang");
  if (sperre) throw new BackofficeError("invalid", sperre);
  if (lieferschein_nr_lieferant) {
    const doppelt = await client.getList("PH Wareneingang", { fields: ["name"], filters: [["herstellerbestellung", "=", hb], ["lieferschein_nr_lieferant", "=", lieferschein_nr_lieferant]], limit: 1 });
    if (doppelt.length) throw new BackofficeError("conflict", `Schon gebucht als ${doppelt[0].name}`, { detail: doppelt[0].name });
  }
  const zeilen = [];
  for (const [i, p] of (b.positionen || []).entries()) {
    const idx = p.idx || i + 1;
    if (p.status === "Storniert") continue;
    const w = positionen.find((x) => Number(x.idx) === idx);
    if (!w) continue;
    const menge = Number(w.menge_erhalten);
    if (!Number.isInteger(menge) || menge < 0) throw new BackofficeError("invalid", `Position ${idx}: Menge ganzzahlig angeben.`);
    const zustand = w.zustand || "ok";
    if (["beschaedigt", "Transportschaden", "falsch"].includes(zustand) && !String(w.hinweis || "").trim() && !w.foto) throw new BackofficeError("invalid", `Position ${idx}: Foto oder Hinweis angeben.`);
    const soll = Number(p.ab_menge) > 0 ? Number(p.ab_menge) : Number(p.menge) || 0;
    const rest = Math.max(0, soll - (Number(p.menge_erhalten) || 0));
    if (menge === 0 && zustand !== "fehlt") continue;
    const m = mengenAbgleich(rest, menge);
    zeilen.push({ position: idx, produkt: p.produkt || "", bezeichnung: p.bezeichnung, menge_erwartet: rest, menge_erhalten: menge, differenz: m.differenz, mengen_abweichung: m.abweichung, zustand, hinweis: String(w.hinweis || "").slice(0, 140), seriennummer: w.seriennummer || "", foto: w.foto || "" });
  }
  if (!zeilen.some((z) => z.menge_erhalten > 0 || z.zustand === "fehlt")) throw new BackofficeError("invalid", "Keine Menge erfasst.");
  const status = weStatusAus(zeilen);
  const we = await client.insert("PH Wareneingang", {
    naming_series: "WE-.YYYY.-.#####",
    titel: `${b.lieferant} · ${b.name}`,
    herstellerbestellung: hb,
    lieferant: b.lieferant,
    kommission: b.kommission,
    status,
    datum: datum || heute(client),
    lieferschein_nr_lieferant,
    spediteur,
    packstuecke: Math.max(1, Math.trunc(Number(packstuecke) || 1)),
    erfasst_von: client.session.user,
    positionen: zeilen,
    reklamation: status === "Reklamiert" ? 1 : 0,
    unterlieferung: zeilen.filter((z) => z.mengen_abweichung === "Unterlieferung").length,
    ueberlieferung: zeilen.filter((z) => z.mengen_abweichung === "Ueberlieferung").length,
  });
  if (istMock(client)) {
    const pos = (b.positionen || []).map((p, i) => {
      const idx = p.idx || i + 1;
      const z = zeilen.find((x) => x.position === idx);
      if (!z) return p;
      const erhalten = (Number(p.menge_erhalten) || 0) + z.menge_erhalten;
      const soll = Number(p.ab_menge) > 0 ? Number(p.ab_menge) : Number(p.menge) || 0;
      return { ...p, menge_erhalten: erhalten, status: erhalten >= soll ? "Geliefert" : erhalten > 0 ? "Teilgeliefert" : p.status };
    });
    const neuStatus = bestellstatusAusMengen(pos) || b.status;
    mockSchreibe(client, "PH Herstellerbestellung", hb, { positionen: pos, menge_erhalten: pos.reduce((a, p) => a + (Number(p.menge_erhalten) || 0), 0), status: neuStatus, workflow_state: `PH ${neuStatus}`, geliefert_am: neuStatus === "Geliefert" ? heute(client) : b.geliefert_am || "", liefertermin_ist: heute(client) }, { kommentar: `Wareneingang ${we.name} gebucht`, art: "Comment" });
  }
  return we;
}

/** Schaden melden (Reklamation): Servicefall/Regress über ph_sortiment.schaden_melden. */
export async function schadenMelden(client, name, { beschreibung, regress = 0 }) {
  if (String(beschreibung || "").trim().length < 5) throw new BackofficeError("invalid", "Beschreibung angeben (mindestens 5 Zeichen).");
  if (!istMock(client)) return client.runDocMethod("PH Wareneingang", name, "schaden_melden", { beschreibung, regress: regress ? 1 : 0 });
  return mockSchreibe(client, "PH Wareneingang", name, { servicefall_hinweis: "Servicefall angelegt (Testmodus)", reklamation_text: beschreibung }, { kommentar: `Schaden gemeldet: ${beschreibung}`, art: "Comment" });
}

// --------------------------------------------------------------- Preislisten --

/** Preisliste abgleichen (pruefen) bzw. übernehmen (uebernehmen, nur Leitung) bzw. verwerfen. */
export async function preislisteMethode(client, name, methode, { leitung = false } = {}) {
  if (!["pruefen", "uebernehmen", "verwerfen"].includes(methode)) throw new BackofficeError("invalid", "Unbekannte Methode.");
  const l = await client.getDoc("PH Preisliste Import", name);
  if (methode === "uebernehmen") {
    if (!leitung) throw new BackofficeError("forbidden", "Übernehmen: Leitung");
    if (l.status !== "Geprueft") throw new BackofficeError("invalid", "Erst abgleichen.");
  }
  if (!istMock(client)) {
    if (methode === "verwerfen") return client.workflowAction("PH Preisliste Import", name, "Verwerfen");
    return client.runDocMethod("PH Preisliste Import", name, methode, methode === "pruefen" ? { speichern: 1 } : {});
  }
  if (methode === "verwerfen") return mockSchreibe(client, "PH Preisliste Import", name, { status: "Verworfen", workflow_state: "PH Verworfen" }, { kommentar: "Preisliste verworfen", art: "Workflow" });
  if (methode === "pruefen") {
    if (!(l.zeilen || []).length) throw new BackofficeError("invalid", "Die Datei enthält keine lesbaren Zeilen.");
    return mockSchreibe(client, "PH Preisliste Import", name, { status: "Geprueft", workflow_state: "PH Geprueft", geprueft_von: client.session.user, geprueft_am: zeitJetzt(client) }, { kommentar: "Preisliste abgeglichen", art: "Workflow" });
  }
  let n = 0;
  for (const z of l.zeilen || []) {
    if (!z.uebernehmen || !z.produkt || !(z.neu_cent > 0)) continue;
    try {
      await preisHinzufuegen(client, z.produkt, { brutto_cent: z.neu_cent, stand: l.stand, preisart: l.preisart === "Herstellerpreis" ? "Herstellerpreis" : l.preisart === "UVP" ? "UVP" : "Verkaufspreis", quelle: "Herstellerliste", quelle_url: "", ab: l.stand, freigegeben: 1 });
      n++;
    } catch {
      /* doppelte Zeile wird übersprungen */
    }
  }
  mockSchreibe(client, "PH Preisliste Import", name, { status: "Uebernommen", workflow_state: "PH Uebernommen", uebernommen_von: client.session.user, uebernommen_am: zeitJetzt(client), protokoll: `${n} Preise übernommen` }, { kommentar: `${n} Preise übernommen`, art: "Workflow" });
  return { uebernommen: n };
}

/** Zeile einer Preisliste umschalten (übernehmen ja/nein). */
export async function preislisteZeile(client, name, { zeile, uebernehmen }) {
  const l = await client.getDoc("PH Preisliste Import", name);
  if (l.status !== "Geprueft" && l.status !== "Hochgeladen") throw new BackofficeError("invalid", "Diese Preisliste ist abgeschlossen.");
  const zeilen = (l.zeilen || []).map((z) => (z.name === zeile || z.idx === Number(zeile) ? { ...z, uebernehmen: uebernehmen ? 1 : 0 } : z));
  return client.save("PH Preisliste Import", { name, zeilen }, { modified: l.modified });
}

/** Preisliste anlegen (A11 Schritt 1). Datei-Einlesen übernimmt der Server (datei_einlesen). */
export async function preislisteAnlegen(client, { marke, preisart, stand, lieferant = "", quelle = "", schwelle_prozent = 15 }) {
  if (!marke || !preisart || !stand) throw new BackofficeError("invalid", "Marke, Preisart und Stand angeben.");
  const l = await client.insert("PH Preisliste Import", { naming_series: "PH-PLI-.YYYY.-.####", titel: `${marke} · ${preisart}`, marke, preisart, stand, lieferant, quelle, schwelle_prozent, status: "Hochgeladen", waehrung: "EUR", format: "Auto", zeilen: [] });
  return l;
}

// ---------------------------------------------------------- Bestellvorschläge --

/**
 * Bestellvorschläge → Bestellentwürfe je Lieferant (ph_logistik.nachbestellung.bestellungen_aus_vorschlaegen,
 * Leitung/Admin). → { angelegt: [HB…], ohne_lieferant: [...] }
 */
export async function vorschlaegeBestellen(client, namen = [], { idempotency_key = "" } = {}) {
  if (!namen.length) throw new BackofficeError("invalid", "Keine Vorschläge gewählt.");
  if (!istMock(client)) return client.call("ph_logistik.ph_logistik.nachbestellung.bestellungen_aus_vorschlaegen", { namen: JSON.stringify(namen), idempotency_key });
  const vorschlaege = [];
  for (const n of namen) {
    const v = await client.getDoc("PH Bestellvorschlag", n);
    if (v.status !== "Offen") continue;
    vorschlaege.push(v);
  }
  const jeLieferant = new Map();
  const ohne = [];
  for (const v of vorschlaege) {
    if (!v.lieferant) {
      ohne.push(v.name);
      continue;
    }
    if (!jeLieferant.has(v.lieferant)) jeLieferant.set(v.lieferant, []);
    jeLieferant.get(v.lieferant).push(v);
  }
  const angelegt = [];
  for (const [lieferant, liste] of jeLieferant) {
    const hb = await bestellungAnlegen(client, {
      lieferant,
      quelle: "logistik",
      lieferadresse: "Lager",
      positionen: await Promise.all(
        liste.map(async (v) => {
          const p = v.produkt ? await client.getDoc("PH Produkt", v.produkt).catch(() => null) : null;
          return { produkt: v.produkt, bezeichnung: v.produkt_name || p?.titel || v.produkt, hersteller_artikelnr: p?.hersteller_artikelnr || "", menge: v.vorschlag_menge, ek_cent: v.ek_cent || undefined };
        })
      ),
    });
    angelegt.push(hb.name);
    for (const v of liste) mockSchreibe(client, "PH Bestellvorschlag", v.name, { status: "Bestellt", herstellerbestellung: hb.name, bestellt_am: zeitJetzt(client), bestellt_von: client.session.user }, { kommentar: `Bestellentwurf ${hb.name}`, art: "Comment" });
  }
  return { angelegt, ohne_lieferant: ohne };
}

/** Vorschlag verwerfen (Grund optional). */
export async function vorschlagVerwerfen(client, name, { grund = "" } = {}) {
  if (!istMock(client)) return client.runDocMethod("PH Bestellvorschlag", name, "verwerfen", { grund });
  const v = await client.getDoc("PH Bestellvorschlag", name);
  if (v.status !== "Offen") throw new BackofficeError("invalid", "Nur offene Vorschläge.");
  return mockSchreibe(client, "PH Bestellvorschlag", name, { status: "Verworfen", bemerkung: grund }, { kommentar: `Verworfen${grund ? `: ${grund}` : ""}` });
}

// ---------------------------------------------------------------- Marken --

/** Bildfreigabe beim Hersteller anfordern (Mail). */
export async function bildfreigabeAnfordern(client, marke, { empfaenger = "", nachricht = "" } = {}) {
  if (!istMock(client)) return client.runDocMethod("PH Marke", marke, "bildfreigabe_anfordern", { empfaenger, nachricht });
  client.kommentar("PH Marke", marke, `Bildfreigabe angefordert${empfaenger ? ` bei ${empfaenger}` : ""}`, "Comment");
  return { name: marke };
}

/** Einstellungen speichern (Leitung). */
export async function einstellungenSpeichern(client, werte) {
  const erlaubt = ["website_revalidate_aktiv", "revalidate_drossel_sekunden", "preis_max_monate_verkaufspreis", "preis_max_monate_uvp", "preisliste_schwelle_prozent", "ab_toleranz_preis_prozent", "ab_toleranz_termin_tage", "eigene_gln", "standard_lieferadresse", "claim_guard_aktiv"];
  const sauber = Object.fromEntries(Object.entries(werte || {}).filter(([k]) => erlaubt.includes(k)));
  return client.save(EINST, { name: EINST, ...sauber });
}
