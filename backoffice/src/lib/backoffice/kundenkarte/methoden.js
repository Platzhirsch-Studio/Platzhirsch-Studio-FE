// Aufrufe der Frappe-App ph_kundenkarte – mit Mock-Pfad (MASTER Q-A3: jede Server Action läuft im Mock).
// Frappe-Modus: Dokumentmethoden über client.runDocMethod, Modulmethoden über client.call – Signaturen exakt
// wie im Backend (Backend-Import/ph_kundenkarte). Mock-Modus: dieselben Regeln gegen die Mock-Datenbank
// (Status, Ereignisse, Limits über die Kartenkette), damit Oberfläche und E2E echtes Verhalten sehen.
// Reines Modul mit relativen Importen (läuft im Commit-Register und unter node --test).

import { BackofficeError } from "../frappe/errors.js";
import { neuerName } from "../mock/engine.js";
import { isoDatum, isoDatumZeit } from "../format.js";
import { kartennummerAus, normalisiereKartennummer } from "./kartennummer.js";
import { DT, OFFENE_STATUS, END_STATUS, SPERRGRUENDE, sperrgrund } from "./labels.js";
import { BEZUG_ERLAUBT, einloesungErlaubt, naechsteStufe, stufeNachUmsatz, stufenplanVorschau, verbleibend, vorteileFuerStufe, zielWaehlen } from "./regeln.js";

/** Modulmethoden (Pfad in der App). */
export const M = Object.freeze({
  wallet_status: "ph_kundenkarte.api.backoffice.wallet_status",
  umsatz_alle: "ph_kundenkarte.api.backoffice.umsatz_alle_neu_berechnen",
  stufenplan_vorschau: "ph_kundenkarte.api.backoffice.stufenplan_vorschau",
  stammdaten_anlegen: "ph_kundenkarte.api.backoffice.stammdaten_anlegen",
  dubletten_finden: "ph_kundenkarte.api.backoffice.dubletten_finden",
  sperrgruende: "ph_kundenkarte.api.backoffice.sperrgruende",
  karten_zusammenfuehren: "ph_kundenkarte.api.backoffice.karten_zusammenfuehren",
  einloesungen_30_tage: "ph_kundenkarte.ph_kundenkarte.kennzahlen.einloesungen_30_tage",
  lookup_card: "ph_kundenkarte.api.lookup_card",
  redeem_benefit: "ph_kundenkarte.api.redeem_benefit",
  cancel_redemption: "ph_kundenkarte.api.cancel_redemption",
  hand_over_card: "ph_kundenkarte.api.hand_over_card",
});

const LEITUNG = ["PH Kundenkarte Leitung", "System Manager", "Administrator", "PH Backoffice-Admin"];

const istMock = (client) => client?.modus !== "frappe";

/** Dokumentmethode ausführen (Frappe oder Mock). */
export async function methode(client, doctype, name, method, args = {}) {
  if (!istMock(client)) {
    const r = await client.runDocMethod(doctype, name, method, args);
    return r && typeof r === "object" && "message" in r ? r.message : r;
  }
  const fn = MOCK_DOC[doctype]?.[method];
  if (!fn) throw new BackofficeError("not_found", "Diese Funktion ist im Testmodus nicht hinterlegt.");
  return fn(client, name, args || {});
}

/** Modulmethode ausführen (Frappe oder Mock). */
export async function aufruf(client, pfad, args = {}) {
  if (!istMock(client)) return client.call(pfad, args);
  const fn = MOCK_MODUL[pfad];
  if (!fn) throw new BackofficeError("not_found", "Diese Funktion ist im Testmodus nicht hinterlegt.");
  return fn(client, args || {});
}

/** Gibt es die Methode im Mock? (Fähigkeiten-Probe) */
export function mockHat(doctype, method) {
  return Boolean(MOCK_DOC[doctype]?.[method]);
}

// ================================================================= Mock-Kern ==

function tab(client, dt) {
  return client.tabelle(dt);
}
function hole(client, dt, name) {
  const d = tab(client, dt).get(name);
  if (!d) throw new BackofficeError("not_found", "Der Datensatz wurde nicht gefunden.");
  return d;
}
function jetzt(client) {
  return client.jetzt ? client.jetzt() : new Date();
}
function benutzer(client) {
  return client.session?.user || "Administrator";
}
function istLeitung(client) {
  return (client.session?.roles || []).some((r) => LEITUNG.includes(r));
}
function pruefeRecht(client, dt, aktion) {
  const meta = client.meta(dt);
  client.pruefe(meta, aktion);
}
function fehler(text, code = "invalid") {
  return new BackofficeError(code, text);
}

/** Wie frappe db_set: Felder direkt setzen (auch read_only/status), mit Zeitstempel und Version. */
function dbSet(client, dt, name, werte) {
  const alt = hole(client, dt, name);
  const neu = { ...alt, ...werte };
  client.stempel(neu);
  tab(client, dt).set(name, neu);
  client.version(dt, name, alt, neu);
  return neu;
}

/** Wie insert(ignore_permissions=True). */
function anlegen(client, dt, werte) {
  const meta = client.meta(dt);
  const doc = { doctype: dt, ...werte };
  const name = doc.name || neuerName(meta, doc, (p) => client.naechsteNummer(p), jetzt(client));
  doc.name = name;
  if (tab(client, dt).has(name)) throw new BackofficeError("conflict", "Der Datensatz existiert bereits.", { excType: "DuplicateEntryError" });
  client.stempel(doc, true);
  tab(client, dt).set(name, doc);
  client.version(dt, name, null, doc);
  return doc;
}

function ereignis(client, karte, art, { alt = "", neu = "", hinweis = "", automatisch = 0, jahresumsatz_cent } = {}) {
  const k = tab(client, DT.karte).get(karte);
  return anlegen(client, DT.ereignis, {
    kundenkarte: karte,
    art,
    zeitpunkt: isoDatumZeit(jetzt(client)),
    von: automatisch ? "" : benutzer(client),
    alt,
    neu,
    hinweis,
    automatisch,
    jahresumsatz_cent: jahresumsatz_cent ?? null,
    titel: `${art} · ${k?.kunde_name || karte}`.slice(0, 140),
  });
}

function stufen(client) {
  return [...tab(client, DT.stufe).values()].filter((s) => Number(s.aktiv ?? 1)).sort((a, b) => Number(a.reihenfolge) - Number(b.reihenfolge));
}
function stufenVorteile(client) {
  return stufen(client).flatMap((s) => (s.vorteile || []).map((z) => ({ stufe: s.name, vorteil: z.vorteil, hinweis: z.hinweis || "" })));
}
function einstellungen(client) {
  return tab(client, DT.einstellungen).get(DT.einstellungen) || {};
}

/** Karte + alle Vorgänger (Ersatz/Übertragung) – Limits zählen über die Kette. */
export function ketteImMock(client, karte) {
  const out = [];
  const gesehen = new Set();
  let k = karte;
  while (k && !gesehen.has(k) && out.length < 20) {
    out.push(k);
    gesehen.add(k);
    k = tab(client, DT.karte).get(k)?.vorgaenger_karte || null;
  }
  return out;
}

function anzahlImJahr(client, karte, vorteil, jahr) {
  const kette = new Set(ketteImMock(client, karte));
  return [...tab(client, DT.einloesung).values()].filter((e) => kette.has(e.kundenkarte) && e.vorteil === vorteil && e.status === "Eingeloest" && String(e.eingeloest_am || "").startsWith(String(jahr))).length;
}

function pruefung(client, karteName, vorteilName) {
  const karte = tab(client, DT.karte).get(karteName);
  const v = tab(client, DT.vorteil).get(vorteilName);
  if (!karte || !v) return [false, "not_found"];
  const st = stufen(client);
  const rang = Object.fromEntries(st.map((s) => [s.name, Number(s.reihenfolge)]));
  const zugeordnet = new Set(vorteileFuerStufe(stufenVorteile(client), st, karte.stufe).map((z) => z.vorteil));
  return einloesungErlaubt({
    kartenStatus: karte.status,
    vorteilAktiv: Boolean(Number(v.aktiv ?? 1)),
    proJahr: v.einloesbar_pro_jahr,
    imJahr: anzahlImJahr(client, karteName, vorteilName, jetzt(client).getFullYear()),
    stufeRang: rang[karte.stufe] ?? null,
    giltAbRang: v.gilt_ab_stufe ? (rang[v.gilt_ab_stufe] ?? null) : null,
    inStufe: zugeordnet.has(vorteilName),
  });
}

const MELDUNG = {
  card_inactive: "Die Kundenkarte ist nicht aktiv.",
  benefit_inactive: "Der Vorteil ist nicht aktiv.",
  tier_too_low: "Die Stufe der Karte reicht für diesen Vorteil nicht aus.",
  benefit_not_in_tier: "Der Vorteil ist der Stufe dieser Karte nicht zugeordnet.",
  limit_reached: "Das Limit dieses Vorteils für das laufende Kalenderjahr ist erreicht.",
};

function kontaktSpiegeln(client, karte) {
  const k = tab(client, DT.karte).get(karte);
  if (!k?.kontakt) return;
  const kontakt = tab(client, DT.kontakt).get(k.kontakt);
  if (!kontakt) return;
  const offen = OFFENE_STATUS.includes(k.status);
  const neu = { ...kontakt, ph_kundenkarte_karte: offen ? k.name : kontakt.ph_kundenkarte_karte === k.name ? "" : kontakt.ph_kundenkarte_karte, ph_kundenkarte_stufe: offen ? k.stufe : kontakt.ph_kundenkarte_karte === k.name ? "" : kontakt.ph_kundenkarte_stufe };
  tab(client, DT.kontakt).set(k.kontakt, neu);
}

function neueKartennummer(client) {
  const t = tab(client, DT.karte);
  let i = t.size + 101;
  let nr = kartennummerAus(i);
  while (t.has(nr)) nr = kartennummerAus(++i);
  return nr;
}

function karteAnlegen(client, werte) {
  const nr = werte.kartennummer || neueKartennummer(client);
  const kontakt = tab(client, DT.kontakt).get(werte.kontakt);
  const heute = isoDatum(jetzt(client));
  const doc = anlegen(client, DT.karte, {
    name: nr,
    kartennummer: nr,
    status: "Aktiv",
    kanal: "showroom",
    stufe: einstellungen(client).startstufe || stufen(client)[0]?.name || "",
    stufe_seit: heute,
    stufe_manuell: 0,
    jahresumsatz_cent: 0,
    gesamtumsatz_cent: 0,
    ausgestellt_am: heute,
    ausgestellt_durch: benutzer(client),
    einwilligung_auswertung: 0,
    quelle: "backoffice",
    kunde_name: werte.kunde_name || kontakt?.titel || [kontakt?.vorname, kontakt?.nachname].filter(Boolean).join(" ") || "",
    persoenlicher_berater: werte.persoenlicher_berater ?? (einstellungen(client).berater_standard || ""),
    ...werte,
  });
  doc.titel = `${nr} ${doc.kunde_name}`.trim();
  tab(client, DT.karte).set(nr, doc);
  ereignis(client, nr, "Ausgestellt", { neu: doc.status, hinweis: doc.stufe });
  kontaktSpiegeln(client, nr);
  return doc;
}

/** Belege eines Kontakts für die Mock-Einstufung (Konzept §3.5.2 „Zählt“ heute). */
function umsatzImMock(client, karte, monate = 12) {
  const grenze = new Date(jetzt(client));
  grenze.setMonth(grenze.getMonth() - monate);
  const g = isoDatum(grenze);
  let summe = 0;
  let belege = 0;
  let letzter = null;
  const kette = new Set(ketteImMock(client, karte.name));
  const nimm = (datum, cent) => {
    const d = String(datum || "").slice(0, 10);
    if (!d || d < g) return;
    summe += Number(cent) || 0;
    belege++;
    if (!letzter || d > letzter) letzter = d;
  };
  for (const b of tab(client, "PH Kassenbeleg").values()) {
    if ((b.kontakt === karte.kontakt || kette.has(normalisiereKartennummer(b.ph_kundenkarte_kartennummer))) && ["Signiert", "Nachsigniert"].includes(b.status)) nimm(b.datum_uhrzeit, b.gesamt_cent);
  }
  for (const b of tab(client, "PH Bestellung").values()) {
    if ((b.kontakt === karte.kontakt || kette.has(normalisiereKartennummer(b.ph_kundenkarte_kartennummer))) && ["bezahlt", "versandbereit", "versendet", "abholbereit", "abgeschlossen"].includes(b.status)) nimm(b.creation, b.gesamt_cent);
  }
  for (const b of tab(client, "PH Rechnung").values()) {
    if (b.kontakt === karte.kontakt && ["Gestellt", "Teilbezahlt", "Bezahlt", "Ueberfaellig", "Gemahnt"].includes(b.status)) nimm(b.datum || b.creation, b.brutto_cent);
  }
  return { summe, belege, letzter };
}

// ------------------------------------------------------------- Dokumente --

const MOCK_DOC = {
  [DT.karte]: {
    vorteil_einloesen(client, name, { vorteil, bezug_doctype, bezug, kommentar, ort }) {
      pruefeRecht(client, DT.karte, "write");
      return einloesungAnlegen(client, name, { vorteil, bezug_doctype, bezug, kommentar, ort: ort || "Backoffice", quelle: "backoffice" });
    },
    umsatz_neu_berechnen(client, name) {
      pruefeRecht(client, DT.karte, "write");
      return neuBerechnen(client, name, false);
    },
    wallet_pass_erneuern(client, name) {
      pruefeRecht(client, DT.karte, "write");
      const k = hole(client, DT.karte, name);
      const t = isoDatumZeit(jetzt(client));
      dbSet(client, DT.karte, name, { wallet_pass_aktualisiert: t, wallet_pass_seriennummer: k.wallet_pass_seriennummer || `PH-${name}` });
      ereignis(client, name, "Pass aktualisiert", { hinweis: "manuell ausgelöst" });
      return t;
    },
    sperren(client, name, { grund, sperrgrund_art }) {
      pruefeRecht(client, DT.karte, "write");
      const k = hole(client, DT.karte, name);
      if (!["Aktiv", "Beantragt"].includes(k.status)) throw fehler("Nur aktive oder beantragte Karten können gesperrt werden.");
      const art = sperrgrund_art || "Sonstiges";
      if (!sperrgrund(art)) throw fehler("Bitte einen Sperrgrund aus dem Katalog wählen.");
      if (art === "Sonstiges" && !String(grund || "").trim()) throw fehler("Bei „Sonstiges“ ist eine Beschreibung Pflicht.");
      dbSet(client, DT.karte, name, { status: "Gesperrt", gesperrt_am: isoDatumZeit(jetzt(client)), sperrgrund_art: art, sperrgrund: String(grund || "").slice(0, 140) || null });
      ereignis(client, name, "Sperrung", { alt: k.status, neu: "Gesperrt", hinweis: `${sperrgrund(art).label}${grund ? ` – ${grund}` : ""}` });
      kontaktSpiegeln(client, name);
      return "Gesperrt";
    },
    entsperren(client, name) {
      pruefeRecht(client, DT.karte, "write");
      if (!istLeitung(client)) throw fehler("Entsperren darf nur die Leitung.", "forbidden");
      const k = hole(client, DT.karte, name);
      if (k.status !== "Gesperrt") throw fehler("Karte ist nicht gesperrt.");
      if (sperrgrund(k.sperrgrund_art) && !sperrgrund(k.sperrgrund_art).entsperrbar) throw fehler(`Sperrgrund „${sperrgrund(k.sperrgrund_art).label}“ ist endgültig – bitte Ersatzkarte ausstellen oder kündigen.`);
      dbSet(client, DT.karte, name, { status: "Aktiv", gesperrt_am: null, sperrgrund: null, sperrgrund_art: null });
      ereignis(client, name, "Entsperrung", { alt: "Gesperrt", neu: "Aktiv" });
      kontaktSpiegeln(client, name);
      return "Aktiv";
    },
    kuendigen(client, name, { grund }) {
      pruefeRecht(client, DT.karte, "write");
      const k = hole(client, DT.karte, name);
      if (k.status === "Gekuendigt") return k.status;
      if (END_STATUS.includes(k.status)) throw fehler("Karte ist bereits beendet.");
      dbSet(client, DT.karte, name, { status: "Gekuendigt", gekuendigt_am: isoDatum(jetzt(client)) });
      ereignis(client, name, "Kuendigung", { alt: k.status, neu: "Gekuendigt", hinweis: grund || "" });
      kontaktSpiegeln(client, name);
      return "Gekuendigt";
    },
    aktivieren(client, name) {
      return MOCK_DOC[DT.karte].karte_uebergeben(client, name, { ort: "Showroom" });
    },
    karte_uebergeben(client, name, { ort }) {
      pruefeRecht(client, DT.karte, "read");
      const k = hole(client, DT.karte, name);
      if (k.status !== "Beantragt") throw fehler("Nur beantragte Karten können übergeben werden.");
      const t = jetzt(client);
      dbSet(client, DT.karte, name, { status: "Aktiv", uebergeben_am: isoDatumZeit(t), ausgestellt_am: isoDatum(t), ausgestellt_durch: benutzer(client) });
      ereignis(client, name, "Uebergabe", { alt: "Beantragt", neu: "Aktiv", hinweis: ort || "Showroom" });
      kontaktSpiegeln(client, name);
      return "Aktiv";
    },
    ersatzkarte_ausstellen(client, name, { sperrgrund_art = "Verlust", grund }) {
      pruefeRecht(client, DT.karte, "write");
      const k = hole(client, DT.karte, name);
      const sg = sperrgrund(sperrgrund_art);
      if (!sg?.ersatzkarte) throw fehler("Ersatzkarte nur bei Verlust, Diebstahl oder Beschädigung.");
      const ok = k.status === "Aktiv" || (k.status === "Gesperrt" && sperrgrund(k.sperrgrund_art)?.ersatzkarte);
      if (!ok) throw fehler("Ersatzkarte nur für aktive Karten oder nach Sperre wegen Verlust, Diebstahl oder Beschädigung.");
      const neu = karteAnlegen(client, {
        kontakt: k.kontakt,
        kunde_name: k.kunde_name,
        status: "Aktiv",
        kanal: k.kanal,
        stufe: k.stufe,
        stufe_seit: k.stufe_seit,
        stufe_manuell: k.stufe_manuell,
        persoenlicher_berater: k.persoenlicher_berater,
        geburtstag_tag_monat: k.geburtstag_tag_monat,
        einwilligung_auswertung: k.einwilligung_auswertung,
        einwilligung_am: k.einwilligung_am,
        einwilligung_textversion: k.einwilligung_textversion,
        jahresumsatz_cent: k.jahresumsatz_cent,
        gesamtumsatz_cent: k.gesamtumsatz_cent,
        letzter_einkauf: k.letzter_einkauf,
        umsatz_berechnet_am: k.umsatz_berechnet_am,
        antrag: k.antrag,
        vorgaenger_karte: name,
      });
      dbSet(client, DT.karte, name, { status: "Ersetzt", nachfolger_karte: neu.name, beendet_am: isoDatumZeit(jetzt(client)), sperrgrund_art: k.sperrgrund_art || sperrgrund_art, sperrgrund: k.sperrgrund || grund || null });
      ereignis(client, name, "Ersatzkarte", { alt: k.status, neu: "Ersetzt", hinweis: `${sg.label} – neue Karte ${neu.name}` });
      ereignis(client, neu.name, "Ersatzkarte", { hinweis: `Ersatz für ${name}` });
      kontaktSpiegeln(client, neu.name);
      return neu.name;
    },
    uebertragen(client, name, { ziel_kontakt, grund_art, grund, einwilligung_auswertung = 0, einwilligung_textversion }) {
      pruefeRecht(client, DT.karte, "write");
      if (!istLeitung(client)) throw fehler("Übertragen darf nur die Leitung.", "forbidden");
      const k = hole(client, DT.karte, name);
      if (!["Partner/Haushalt", "Erbe", "Firmennachfolge", "Sonstiges"].includes(grund_art)) throw fehler("Bitte einen Übertragungsgrund wählen.");
      if (grund_art === "Sonstiges" && !String(grund || "").trim()) throw fehler("Bei „Sonstiges“ ist eine Beschreibung Pflicht.");
      if (!["Aktiv", "Gesperrt"].includes(k.status)) throw fehler("Nur aktive oder gesperrte Karten können übertragen werden.");
      if (!ziel_kontakt || ziel_kontakt === k.kontakt) throw fehler("Bitte einen anderen Kontakt als Empfänger wählen.");
      const hat = [...tab(client, DT.karte).values()].some((x) => x.kontakt === ziel_kontakt && OFFENE_STATUS.includes(x.status));
      if (hat) throw fehler("Der Empfänger hat bereits eine Kundenkarte – stattdessen zusammenführen oder kündigen.");
      const neu = karteAnlegen(client, { kontakt: ziel_kontakt, status: "Aktiv", stufe: k.stufe, stufe_seit: k.stufe_seit, persoenlicher_berater: k.persoenlicher_berater, einwilligung_auswertung: Number(einwilligung_auswertung) ? 1 : 0, einwilligung_textversion: einwilligung_textversion || "", einwilligung_am: Number(einwilligung_auswertung) ? isoDatumZeit(jetzt(client)) : null, vorgaenger_karte: name });
      dbSet(client, DT.karte, name, { status: "Uebertragen", nachfolger_karte: neu.name, uebertragung_grund: grund_art, beendet_am: isoDatumZeit(jetzt(client)) });
      ereignis(client, name, "Uebertragung", { alt: k.status, neu: "Uebertragen", hinweis: `${grund_art}${grund ? ` – ${grund}` : ""} → ${neu.name}` });
      kontaktSpiegeln(client, name);
      return neu.name;
    },
    zusammenfuehren_mit(client, name, { andere_karte, nur_plan = 0, trotz_verschiedener_kontakte = 0 }) {
      pruefeRecht(client, DT.karte, "write");
      const andere = normalisiereKartennummer(andere_karte);
      const a = hole(client, DT.karte, name);
      const b = tab(client, DT.karte).get(andere);
      if (!b || andere === name) throw fehler("Bitte eine andere, vorhandene Karte angeben.");
      if (a.kontakt !== b.kontakt && !Number(trotz_verschiedener_kontakte)) throw fehler("Die Karten gehören zu verschiedenen Kontakten. Bitte zuerst die Kontakte im CRM zusammenführen.");
      return zusammenfuehren(client, [name, andere], Boolean(Number(nur_plan)));
    },
    portal_daten(client, name) {
      pruefeRecht(client, DT.karte, "read");
      return kartenUebersicht(client, name);
    },
  },

  [DT.antrag]: {
    kontakt_suchen(client, name) {
      pruefeRecht(client, DT.antrag, "read");
      const a = hole(client, DT.antrag, name);
      const email = String(a.email || "").toLowerCase();
      let treffer = [...tab(client, DT.kontakt).values()].filter((k) => email && String(k.email || "").toLowerCase() === email);
      if (!treffer.length) treffer = [...tab(client, DT.kontakt).values()].filter((k) => k.nachname === a.nachname && (!a.vorname || k.vorname === a.vorname));
      return treffer.slice(0, 10).map((t) => ({ name: t.name, titel: t.titel, email: t.email ? `${t.email[0]}***` : "", plz: t.plz, ort: t.ort }));
    },
    annehmen(client, name, { kontakt, stufe, aktiv = false, sofort_aktiv = null }) {
      pruefeRecht(client, DT.antrag, "write");
      const a = hole(client, DT.antrag, name);
      if (!["Neu", "Bestaetigt"].includes(a.status)) throw fehler("Antrag ist bereits entschieden.");
      if (a.status === "Neu" && Number(a.doi_noetig) && !istLeitung(client)) throw fehler("Ohne bestätigte E-Mail darf nur die Leitung annehmen.", "forbidden");
      let k = kontakt || a.kontakt;
      if (!k) k = kontaktAnlegen(client, a).name;
      const vorhanden = [...tab(client, DT.karte).values()].find((x) => x.kontakt === k && OFFENE_STATUS.includes(x.status));
      if (vorhanden) {
        MOCK_DOC[DT.antrag].als_doppelt(client, name, { karte: vorhanden.name, kontakt: k });
        return "Doppelt";
      }
      // exakt wie annehmen(): sofort_aktiv=0 → Beantragt; sonst Aktiv bei aktiv=True oder Quelle ≠ website.
      const ausdruecklichSpaeter = sofort_aktiv !== null && sofort_aktiv !== undefined && !Number(sofort_aktiv) && !aktiv;
      const beantragt = ausdruecklichSpaeter || !(aktiv || a.quelle !== "website");
      const karte = karteAnlegen(client, {
        kontakt: k,
        status: beantragt ? "Beantragt" : "Aktiv",
        stufe: stufe || a.startstufe || einstellungen(client).startstufe || stufen(client)[0]?.name,
        kanal: ["website", "showroom", "kassa"].includes(a.quelle) ? a.quelle : "showroom",
        antrag: name,
        geburtstag_tag_monat: a.geburtstag_tag_monat || "",
        einwilligung_auswertung: Number(a.einwilligung_auswertung) ? 1 : 0,
        einwilligung_am: Number(a.einwilligung_auswertung) ? a.einwilligung_zeitpunkt || isoDatumZeit(jetzt(client)) : null,
        einwilligung_textversion: a.einwilligung_textversion || "",
        quelle: a.quelle === "website" ? "website" : "backoffice",
      });
      dbSet(client, DT.antrag, name, { status: "Angenommen", kontakt: k, kundenkarte: karte.name, entschieden_am: isoDatumZeit(jetzt(client)), entschieden_durch: benutzer(client), titel: `${a.vorname} ${a.nachname} · Angenommen` });
      client.kommentar(DT.antrag, name, `Angenommen – Karte ${karte.name}`, "Info");
      return karte.name;
    },
    ablehnen(client, name, { grund }) {
      pruefeRecht(client, DT.antrag, "write");
      const a = hole(client, DT.antrag, name);
      if (!["Neu", "Bestaetigt"].includes(a.status)) throw fehler("Antrag ist bereits entschieden.");
      if (!String(grund || "").trim()) throw fehler("Bitte eine Begründung angeben.");
      dbSet(client, DT.antrag, name, { status: "Abgelehnt", entscheidung_grund: String(grund).slice(0, 500), entschieden_am: isoDatumZeit(jetzt(client)), entschieden_durch: benutzer(client), titel: `${a.vorname} ${a.nachname} · Abgelehnt` });
      return "Abgelehnt";
    },
    als_doppelt(client, name, { karte, kontakt }) {
      pruefeRecht(client, DT.antrag, "write");
      const a = hole(client, DT.antrag, name);
      if (!["Neu", "Bestaetigt"].includes(a.status)) throw fehler("Antrag ist bereits entschieden.");
      const k = kontakt || a.kontakt || [...tab(client, DT.kontakt).values()].find((x) => x.email && x.email === a.email)?.name || null;
      const kk = karte || (k ? [...tab(client, DT.karte).values()].find((x) => x.kontakt === k && OFFENE_STATUS.includes(x.status))?.name : null) || null;
      dbSet(client, DT.antrag, name, { status: "Doppelt", doppelt_zu: kk, kontakt: k, entscheidung_grund: `Karte bereits vorhanden: ${kk || "–"}`, entschieden_am: isoDatumZeit(jetzt(client)), entschieden_durch: benutzer(client), titel: `${a.vorname} ${a.nachname} · Doppelt` });
      return "Doppelt";
    },
  },

  [DT.einloesung]: {
    stornieren(client, name, { grund }) {
      pruefeRecht(client, DT.einloesung, "write");
      const e = hole(client, DT.einloesung, name);
      if (e.status === "Storniert") return "Storniert";
      const heute = isoDatum(jetzt(client));
      const eigen = e.eingeloest_durch === benutzer(client) && String(e.eingeloest_am || "").startsWith(heute);
      if (!istLeitung(client) && !eigen) throw fehler("Stornieren darf die Leitung oder die einlösende Person am selben Tag.", "forbidden");
      if (!String(grund || "").trim()) throw fehler("Bitte einen Grund angeben.");
      dbSet(client, DT.einloesung, name, { status: "Storniert", storniert_am: isoDatumZeit(jetzt(client)), storniert_durch: benutzer(client), storno_grund: String(grund).slice(0, 140) });
      ereignis(client, e.kundenkarte, "Einloesung storniert", { hinweis: `${e.vorteil_titel || e.vorteil} – ${grund}` });
      return "Storniert";
    },
  },
};

function kontaktAnlegen(client, a) {
  // wie _kontakt_anlegen_oder_finden – Zielmodell P1: nur bei gleicher E-Mail **und** gleichem Nachnamen verknüpfen
  const email = String(a.email || "").toLowerCase();
  const gleich = email && [...tab(client, DT.kontakt).values()].find((k) => String(k.email || "").toLowerCase() === email && String(k.nachname || String(k.titel || "").split(" ").slice(-1)[0]).toLowerCase() === String(a.nachname || "").toLowerCase());
  if (gleich) return gleich;
  const titel = [a.vorname, a.nachname].filter(Boolean).join(" ");
  const k = anlegen(client, DT.kontakt, { naming_series: "PH-KON-.#####", titel, vorname: a.vorname, nachname: a.nachname, email: a.email || "", telefon: a.telefon || "", plz: a.plz || "", ort: a.ort || "", kontaktart: "Privat", status: "Interessent", quelle: a.quelle === "website" ? "website" : "showroom" });
  return k;
}

function einloesungAnlegen(client, karteName, { vorteil, bezug_doctype, bezug, kommentar, ort, quelle }) {
  const karte = hole(client, DT.karte, karteName);
  if (bezug_doctype && !BEZUG_ERLAUBT.includes(bezug_doctype)) throw fehler(`Bezug muss einer der folgenden Typen sein: ${BEZUG_ERLAUBT.join(", ")}`);
  if (bezug_doctype && bezug && !tab(client, bezug_doctype).has(bezug)) throw fehler(`Beleg ${bezug} existiert nicht.`);
  const [ok, code] = pruefung(client, karteName, vorteil);
  if (!ok) throw new BackofficeError(code === "limit_reached" ? "conflict" : "invalid", MELDUNG[code] || `Einlösung nicht möglich (${code}).`, { detail: { code } });
  const v = hole(client, DT.vorteil, vorteil);
  const t = jetzt(client);
  const e = anlegen(client, DT.einloesung, {
    naming_series: "PH-KKE-.YYYY.-.#####",
    status: "Eingeloest",
    kundenkarte: karteName,
    kontakt: karte.kontakt,
    kunde_name: karte.kunde_name,
    vorteil,
    vorteil_titel: v.titel,
    stufe: karte.stufe,
    eingeloest_am: isoDatumZeit(t),
    eingeloest_durch: benutzer(client),
    ort: ort || "Backoffice",
    bezug_doctype: bezug_doctype || null,
    bezug: bezug || null,
    kommentar: kommentar || "",
    quelle: quelle || "backoffice",
  });
  e.titel = `${v.titel} · ${karte.kunde_name || karteName} · ${isoDatum(t)}`;
  return e.name;
}

function neuBerechnen(client, name, automatisch) {
  const k = hole(client, DT.karte, name);
  if (!Number(k.einwilligung_auswertung)) return { berechnet: false, grund: "keine Einwilligung", belege: 0 };
  const monate = Number(einstellungen(client).bewertungszeitraum_monate) || 12;
  const u = umsatzImMock(client, k, monate);
  const werte = { jahresumsatz_cent: u.summe, gesamtumsatz_cent: Math.max(Number(k.gesamtumsatz_cent) || 0, u.summe), letzter_einkauf: u.letzter || k.letzter_einkauf || null, umsatz_berechnet_am: isoDatumZeit(jetzt(client)) };
  let wechsel = null;
  if (!Number(k.stufe_manuell)) {
    const st = stufen(client);
    const ziel = stufeNachUmsatz(st, u.summe);
    const rang = Object.fromEntries(st.map((s) => [s.name, Number(s.reihenfolge)]));
    const herab = Number(einstellungen(client).herabstufung_erlaubt);
    if (ziel && ziel !== k.stufe && (rang[ziel] > rang[k.stufe] || herab)) {
      werte.stufe = ziel;
      werte.stufe_seit = isoDatum(jetzt(client));
      wechsel = { alt: k.stufe, neu: ziel };
    }
  }
  dbSet(client, DT.karte, name, werte);
  ereignis(client, name, "Umsatz berechnet", { hinweis: `${u.belege} Einkäufe berücksichtigt`, automatisch: automatisch ? 1 : 0, jahresumsatz_cent: u.summe });
  if (wechsel) {
    ereignis(client, name, "Stufenwechsel", { alt: wechsel.alt, neu: wechsel.neu, automatisch: 1, jahresumsatz_cent: u.summe });
    kontaktSpiegeln(client, name);
  }
  return { berechnet: true, belege: u.belege, jahresumsatz_cent: u.summe, stufe: werte.stufe || k.stufe, wechsel };
}

function zusammenfuehren(client, namen, nurPlan) {
  const karten = namen.map((n) => hole(client, DT.karte, n));
  const offen = karten.filter((k) => OFFENE_STATUS.includes(k.status));
  if (offen.length < 2) throw fehler("Es gibt nichts zusammenzuführen – höchstens eine offene Karte.");
  const rang = Object.fromEntries(stufen(client).map((s) => [s.name, Number(s.reihenfolge)]));
  const ziel = zielWaehlen(offen, rang);
  const quellen = offen.filter((k) => k.name !== ziel);
  const zielKarte = offen.find((k) => k.name === ziel);
  const hoechste = offen.reduce((a, k) => ((rang[k.stufe] || 0) > (rang[a.stufe] || 0) ? k : a), zielKarte);
  const werte = {};
  if (hoechste.stufe !== zielKarte.stufe) werte.stufe = hoechste.stufe;
  for (const f of ["persoenlicher_berater", "geburtstag_tag_monat"]) if (!zielKarte[f]) {
    const w = quellen.find((q) => q[f])?.[f];
    if (w) werte[f] = w;
  }
  const warnungen = quellen.filter((q) => q.status === "Gesperrt" && ["Missbrauch", "Diebstahl"].includes(q.sperrgrund_art)).map((q) => `${q.name} war wegen ${q.sperrgrund_art} gesperrt – Zielkarte ${ziel} prüfen.`);
  const einl = [...tab(client, DT.einloesung).values()].filter((e) => quellen.some((q) => q.name === e.kundenkarte)).length;
  const plan = { ziel, quellen: quellen.map((q) => q.name), werte, warnungen, einloesungen: einl, verschiedene_kontakte: new Set(offen.map((k) => k.kontakt)).size > 1 };
  if (nurPlan) return plan;
  if (!istLeitung(client)) throw fehler("Zusammenführen darf nur die Leitung.", "forbidden");
  if (Object.keys(werte).length) dbSet(client, DT.karte, ziel, werte);
  for (const q of quellen) {
    for (const e of [...tab(client, DT.einloesung).values()].filter((x) => x.kundenkarte === q.name)) dbSet(client, DT.einloesung, e.name, { kundenkarte: ziel, umgehaengt_von: q.name });
    dbSet(client, DT.karte, q.name, { status: "Zusammengefuehrt", zusammengefuehrt_in: ziel, beendet_am: isoDatumZeit(jetzt(client)), sperrgrund_art: "Dublette" });
    ereignis(client, q.name, "Zusammenfuehrung", { alt: q.status, neu: "Zusammengefuehrt", hinweis: `in ${ziel}` });
  }
  ereignis(client, ziel, "Zusammenfuehrung", { hinweis: `aus ${quellen.map((q) => q.name).join(", ")}` });
  kontaktSpiegeln(client, ziel);
  return plan;
}

/** Wie umsatz.karten_uebersicht (portal_daten). */
export function kartenUebersicht(client, name) {
  const k = hole(client, DT.karte, name);
  const st = stufen(client);
  const jahr = jetzt(client).getFullYear();
  const zu = vorteileFuerStufe(stufenVorteile(client), st, k.stufe);
  const vorteile = zu
    .map((z) => ({ ...z, v: tab(client, DT.vorteil).get(z.vorteil) }))
    .filter((z) => z.v)
    .sort((a, b) => (Number(a.v.reihenfolge) || 0) - (Number(b.v.reihenfolge) || 0) || String(a.v.titel).localeCompare(String(b.v.titel)))
    .map(({ vorteil, hinweis, v }) => {
      const genutzt = anzahlImJahr(client, name, vorteil, jahr);
      const rest = verbleibend(v.einloesbar_pro_jahr, genutzt);
      return { vorteil, titel: v.titel, art: v.art, beschreibung: v.beschreibung_kunde || "", hinweis: hinweis || "", einloesbar_pro_jahr: Number(v.einloesbar_pro_jahr) || 0, genutzt_im_jahr: genutzt, verbleibend: rest, verfuegbar: k.status === "Aktiv" && Number(v.aktiv ?? 1) === 1 && (rest === null || rest > 0), aktiv: Number(v.aktiv ?? 1) === 1 };
    });
  const naechste = naechsteStufe(st, k.stufe);
  const info = st.find((s) => s.name === k.stufe);
  const einl = [...tab(client, DT.einloesung).values()].filter((e) => e.kundenkarte === name).sort((a, b) => String(b.eingeloest_am).localeCompare(String(a.eingeloest_am))).slice(0, 50);
  return {
    kartennummer: k.kartennummer || k.name,
    status: k.status,
    name_auf_karte: k.kunde_name,
    stufe: k.stufe,
    stufe_farbe: info?.farbe || null,
    stufe_text: info?.beschreibung_kunde || "",
    stufe_seit: k.stufe_seit || null,
    ausgestellt_am: k.ausgestellt_am || null,
    einwilligung_auswertung: Boolean(Number(k.einwilligung_auswertung)),
    bewertungszeitraum_monate: Number(einstellungen(client).bewertungszeitraum_monate) || 12,
    jahresumsatz_cent: Number(k.einwilligung_auswertung) ? Number(k.jahresumsatz_cent) || 0 : null,
    naechste_stufe: naechste?.name || null,
    fehlt_noch_cent: naechste && Number(k.einwilligung_auswertung) ? Math.max(0, Number(naechste.schwelle_jahresumsatz_cent) - (Number(k.jahresumsatz_cent) || 0)) : null,
    vorteile,
    einloesungen: einl.map((e) => ({ referenz: e.name, vorteil: e.vorteil, titel: e.vorteil_titel, am: e.eingeloest_am, status: e.status, ort: e.ort, bezug_doctype: e.bezug_doctype, bezug: e.bezug })),
    wallet_pass_aktualisiert: k.wallet_pass_aktualisiert || null,
  };
}

// ---------------------------------------------------------------- Module --

function leitungPruefen(client) {
  if (!istLeitung(client)) throw fehler("Das darf nur die Leitung.", "forbidden");
}

function kassaBewertung(k) {
  if (k.status === "Aktiv") return ["ok", null, ""];
  if (k.status === "Beantragt") return ["card_pending", null, "Noch nicht aktiv – Übergabe bestätigen (Karte übergeben)."];
  if (k.status === "Gesperrt") return ["card_blocked", null, sperrgrund(k.sperrgrund_art)?.kassa || "Karte gesperrt – bitte an die Beratung verweisen."];
  if (k.status === "Ersetzt") return ["card_replaced", null, "Diese Karte wurde durch eine Ersatzkarte ersetzt – bitte die neue Karte verwenden."];
  if (k.status === "Uebertragen") return ["card_transferred", null, "Diese Karte wurde auf eine andere Person übertragen und ist nicht mehr gültig."];
  if (k.status === "Zusammengefuehrt") return ["card_merged", k.zusammengefuehrt_in, "Doppelte Karte – die Hauptkarte wird verwendet."];
  return ["card_cancelled", null, "Karte nicht mehr gültig."];
}

/** Kassa/Packtisch: nur Name, Stufe, Vorteile – nie Kontaktdaten oder Umsatz (K13). */
export function lookupImMock(client, kartennummer) {
  const nr = normalisiereKartennummer(kartennummer);
  let k = tab(client, DT.karte).get(nr);
  if (!k) return { ok: false, code: "not_found", text: "Keine Karte mit dieser Nummer." };
  const [code, weiter, text] = kassaBewertung(k);
  let weitergeleitet_von = null;
  if (code === "card_merged" && weiter && tab(client, DT.karte).get(weiter)) {
    weitergeleitet_von = k.name;
    k = tab(client, DT.karte).get(weiter);
  } else if (code !== "ok" && code !== "card_pending") {
    return { ok: false, code, text, kartennummer: k.name, name: k.kunde_name, stufe: k.stufe, vorteile: [] };
  }
  const u = kartenUebersicht(client, k.name);
  return { ok: true, code: k.status === "Aktiv" ? "ok" : "card_pending", text: k.status === "Aktiv" ? "" : text, kartennummer: k.name, name: k.kunde_name, stufe: k.stufe, stufe_farbe: u.stufe_farbe, stufe_seit: k.stufe_seit, weitergeleitet_von, vorteile: u.vorteile.map((v) => ({ vorteil: v.vorteil, titel: v.titel, art: v.art, verbleibend: v.verbleibend, verfuegbar: v.verfuegbar, einloesbar_pro_jahr: v.einloesbar_pro_jahr })) };
}

const MOCK_MODUL = {
  [M.wallet_status](client) {
    leitungPruefen(client);
    const e = einstellungen(client);
    return { apple: { konfiguriert: Boolean(e.wallet_pass_type_id && e.wallet_team_id), fehlt: e.wallet_pass_type_id ? null : "wallet_pass_type_id" }, google: { konfiguriert: false, fehlt: "Zertifikat" } };
  },
  [M.umsatz_alle](client) {
    leitungPruefen(client);
    const karten = [...tab(client, DT.karte).values()].filter((k) => ["Aktiv", "Gesperrt"].includes(k.status) && Number(k.einwilligung_auswertung));
    for (const k of karten) neuBerechnen(client, k.name, true);
    return { eingereiht: true, karten: karten.length };
  },
  [M.stufenplan_vorschau](client, { stufen: plan }) {
    leitungPruefen(client);
    const st = typeof plan === "string" ? JSON.parse(plan || "null") : plan;
    const karten = [...tab(client, DT.karte).values()].filter((k) => ["Aktiv", "Gesperrt"].includes(k.status));
    return stufenplanVorschau(karten, st || stufen(client));
  },
  [M.stammdaten_anlegen](client) {
    leitungPruefen(client);
    standardStammdaten(client);
    return { stufen: tab(client, DT.stufe).size, vorteile: tab(client, DT.vorteil).size };
  },
  [M.dubletten_finden](client, { limit = 50 }) {
    leitungPruefen(client);
    const je = new Map();
    for (const k of [...tab(client, DT.karte).values()].filter((x) => OFFENE_STATUS.includes(x.status))) {
      je.set(k.kontakt, [...(je.get(k.kontakt) || []), k.name]);
    }
    return [...je.entries()].filter(([, v]) => v.length > 1).map(([kontakt, karten]) => ({ kontakt, anzahl: karten.length, karten })).slice(0, Number(limit) || 50);
  },
  [M.sperrgruende]() {
    return SPERRGRUENDE.map((s) => ({ wert: s.wert, label: s.label, ersatzkarte: s.ersatzkarte, entsperrbar: s.entsperrbar, kassa_text: s.kassa }));
  },
  [M.karten_zusammenfuehren](client, { karten, nur_plan = 0 }) {
    const liste = typeof karten === "string" ? JSON.parse(karten) : karten;
    return zusammenfuehren(client, liste, Boolean(Number(nur_plan)));
  },
  [M.einloesungen_30_tage](client) {
    const g = new Date(jetzt(client));
    g.setDate(g.getDate() - 30);
    const grenze = isoDatumZeit(g);
    return [...tab(client, DT.einloesung).values()].filter((e) => e.status === "Eingeloest" && String(e.eingeloest_am) >= grenze).length;
  },
  [M.lookup_card](client, { kartennummer }) {
    return lookupImMock(client, kartennummer);
  },
  [M.redeem_benefit](client, { kartennummer, vorteil, bezug_doctype, bezug, kommentar, ort = "Kassa" }) {
    const nr = normalisiereKartennummer(kartennummer);
    return { referenz: einloesungAnlegen(client, nr, { vorteil, bezug_doctype, bezug, kommentar, ort, quelle: "kassa" }) };
  },
  [M.cancel_redemption](client, { referenz, grund }) {
    return MOCK_DOC[DT.einloesung].stornieren(client, referenz, { grund: grund || "an der Kassa zurückgenommen" });
  },
  [M.hand_over_card](client, { kartennummer, ort = "Kassa" }) {
    return MOCK_DOC[DT.karte].karte_uebergeben(client, normalisiereKartennummer(kartennummer), { ort });
  },
};

// ------------------------------------------------------------- Stammdaten --

/** Standardstufen und -vorteile wie install.py (Texte Sie-Form, Leistungen statt Rabatte). Farben im Lounge-Material. */
export const STANDARD_STUFEN = Object.freeze([
  { stufenname: "Platzhirsch", reihenfolge: 1, schwelle_jahresumsatz_cent: 0, farbe: "#5b626a", beschreibung_kunde: "Ihre Kundenkarte: persönliche Beratung, Einladungen zu Abenden im Showroom und ein Gruß zum Geburtstag.", beschreibung_intern: "Startstufe für alle Karten." },
  { stufenname: "Platzhirsch Plus", reihenfolge: 2, schwelle_jahresumsatz_cent: 1_000_000, farbe: "#b08850", beschreibung_kunde: "Zusätzlich zur Kundenkarte: Lieferung im Liefergebiet und verlängerte Umtauschfrist für Lagerware.", beschreibung_intern: "Schwelle 10.000 € im Bewertungszeitraum – Platzhalter, Inhaber-Entscheidung offen." },
  { stufenname: "Platzhirsch Privé", reihenfolge: 3, schwelle_jahresumsatz_cent: 5_000_000, farbe: "#8f5230", beschreibung_kunde: "Zusätzlich zu Platzhirsch Plus: Montage durch unser Team und ein Pflegetermin im Jahr.", beschreibung_intern: "Schwelle 50.000 € im Bewertungszeitraum – Platzhalter, Inhaber-Entscheidung offen." },
]);
export const STANDARD_VORTEILE = Object.freeze([
  { schluessel: "beratung", titel: "Persönliche Beratung", art: "Persoenlich", einloesbar_pro_jahr: 0, stufe: "Platzhirsch", beschreibung_kunde: "Eine feste Ansprechperson begleitet Sie bei Planung, Auswahl und Service.", reihenfolge: 10 },
  { schluessel: "events", titel: "Vorab-Zugang zu Abenden im Showroom", art: "Event", einloesbar_pro_jahr: 0, stufe: "Platzhirsch", beschreibung_kunde: "Sie erhalten Einladungen zu Veranstaltungen vor der allgemeinen Ankündigung – sofern Sie Einladungen zugestimmt haben.", reihenfolge: 20 },
  { schluessel: "geburtstag", titel: "Gruß zum Geburtstag", art: "Persoenlich", einloesbar_pro_jahr: 1, stufe: "Platzhirsch", beschreibung_kunde: "Zu Ihrem Geburtstag melden wir uns persönlich – wenn Sie uns das Datum freiwillig nennen.", reihenfolge: 30 },
  { schluessel: "lieferung", titel: "Lieferung im Liefergebiet", art: "Lieferung", einloesbar_pro_jahr: 0, stufe: "Platzhirsch Plus", beschreibung_kunde: "Wir liefern Ihre Bestellung im Liefergebiet des Studios ohne gesonderte Lieferpauschale.", reihenfolge: 40 },
  { schluessel: "umtausch", titel: "Verlängerte Umtauschfrist", art: "Service", einloesbar_pro_jahr: 0, stufe: "Platzhirsch Plus", beschreibung_kunde: "Für Lagerware verlängert sich die Frist für einen Umtausch.", reihenfolge: 50 },
  { schluessel: "montage", titel: "Montage durch unser Team", art: "Montage", einloesbar_pro_jahr: 0, stufe: "Platzhirsch Privé", beschreibung_kunde: "Aufbau und Einrichtung durch unser Montageteam sind Teil Ihrer Lieferung.", reihenfolge: 60 },
  { schluessel: "pflege", titel: "Pflegetermin im Jahr", art: "Pflege", einloesbar_pro_jahr: 1, stufe: "Platzhirsch Privé", beschreibung_kunde: "Einmal im Jahr pflegen wir Leder, Stoff, Holz oder Stein bei Ihnen zu Hause.", reihenfolge: 70 },
]);

/** Standardstufen/-vorteile anlegen, falls leer (idempotent). Auch vom Seed genutzt. */
export function standardStammdaten(client) {
  const tS = tab(client, DT.stufe);
  const tV = tab(client, DT.vorteil);
  for (const s of STANDARD_STUFEN) if (!tS.has(s.stufenname)) anlegen(client, DT.stufe, { name: s.stufenname, ...s, aktiv: 1, vorteile: [] });
  const jeTitel = new Map([...tV.values()].map((v) => [v.titel, v.name]));
  for (const v of STANDARD_VORTEILE) {
    if (jeTitel.has(v.titel)) continue;
    const d = anlegen(client, DT.vorteil, { naming_series: "PH-KKV-.YYYY.-.#####", titel: v.titel, art: v.art, aktiv: 1, einloesbar_pro_jahr: v.einloesbar_pro_jahr, gilt_ab_stufe: v.stufe, reihenfolge: v.reihenfolge, beschreibung_kunde: v.beschreibung_kunde, beschreibung_intern: "", quelle: "install" });
    jeTitel.set(v.titel, d.name);
  }
  for (const s of STANDARD_STUFEN) {
    const doc = tS.get(s.stufenname);
    const vorhanden = new Set((doc.vorteile || []).map((z) => z.vorteil));
    const neu = STANDARD_VORTEILE.filter((v) => v.stufe === s.stufenname).map((v) => jeTitel.get(v.titel)).filter((n) => n && !vorhanden.has(n));
    if (neu.length) tS.set(s.stufenname, { ...doc, vorteile: [...(doc.vorteile || []), ...neu.map((v, i) => ({ name: `${s.stufenname}-v-${(doc.vorteile || []).length + i + 1}`, vorteil: v, titel: tV.get(v)?.titel, art: tV.get(v)?.art, hinweis: "", idx: (doc.vorteile || []).length + i + 1, doctype: "PH Kundenkarte Stufe Vorteil", parent: s.stufenname, parentfield: "vorteile", parenttype: DT.stufe }))] });
  }
  const e = einstellungen(client);
  if (!e.startstufe) tab(client, DT.einstellungen).set(DT.einstellungen, { ...e, name: DT.einstellungen, doctype: DT.einstellungen, startstufe: "Platzhirsch" });
}
