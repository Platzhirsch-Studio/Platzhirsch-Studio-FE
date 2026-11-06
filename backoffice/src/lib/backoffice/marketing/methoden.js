// Bereich Marketing – Fachaufrufe mit Frappe- und Mock-Pfad (MASTER § 5.3 Nr. 5 „Jede Server Action hat einen Mock-Pfad“).
// Frappe: die whitelisted Dokumentmethoden und api/backoffice.py von ph_marketing exakt mit ihren Argumenten
// (Signaturen aus Backend-Import, nur gelesen). Mock: dieselbe Wirkung auf die In-Memory-Datenbank, damit jede Kette
// im Testmodus durchläuft (Freigabe, Versand mit Fortschritt, Abmelden, Widerruf, Anmeldung, Check-in, Nachrücken,
// Kennzahlen, Empfehlung). Reines Modul (relative Importe), unit-getestet mit dem MockClient
// (tests/unit/marketing-methoden.test.mjs). Wirft BackofficeError; die Server Actions bilden ab.

import { BackofficeError } from "../frappe/errors.js";
import { isoDatum, isoDatumZeit } from "../format.js";
import { anmeldungPruefen, bereitschaft, blockSichtbar, checkinEntscheiden, emailNormal, kennzahlenAggregat, nachruecker, offeneSlots, personenVon, pruefeReise, versandbereit, empfehlungsCode, stripHtml } from "./regeln.js";
import { newsletterHtml, vorlageFuellen } from "./vorschau.js";
import { EINST } from "../mock/seed/marketing.js";

export { EINST };
const BO = "ph_marketing.api.backoffice";
const G = globalThis;

export const istMock = (client) => client?.modus === "mock";
const klon = (x) => JSON.parse(JSON.stringify(x));
const jetzt = (client) => (client?.jetzt ? client.jetzt() : new Date());

/** Mock: Werte direkt schreiben (auch Status/Workflow), mit Stempel, Version und optionalem Kommentar. */
export function mockSchreibe(client, doctype, name, werte, { kommentar, art = "Info" } = {}) {
  const t = client.tabelle(doctype);
  const alt = t.get(name);
  if (!alt) throw new BackofficeError("not_found", "Datensatz wurde nicht gefunden.");
  const neu = { ...alt, ...klon(werte) };
  if (Array.isArray(werte.anmeldungen) || Array.isArray(werte.bloecke) || Array.isArray(werte.kennzahlen) || Array.isArray(werte.trigger) || Array.isArray(werte.regeln) || Array.isArray(werte.interessen)) {
    const meta = client.meta(doctype);
    client.kinderNormalisieren(meta, neu);
  }
  client.stempel(neu);
  t.set(name, neu);
  client.version(doctype, name, alt, neu);
  if (kommentar) client.kommentar(doctype, name, kommentar, art);
  return klon(neu);
}

/** Einstellungen Marketing (Single), leer bei fehlendem Recht. */
export async function einstellungen(client) {
  try {
    return await client.getDoc(EINST, EINST);
  } catch {
    return {};
  }
}

/** Testmodus aus ph_core (PH Einstellungen.testmodus). */
export async function testmodus(client) {
  try {
    const e = await client.getDoc("PH Einstellungen", "PH Einstellungen");
    return !!Number(e?.testmodus || 0);
  } catch {
    return false;
  }
}

// ------------------------------------------------------------------------------------------------ Freigabe-Aufgaben (ToDo)

function mockTodos() {
  if (!G.__phBoMarketingTodos) G.__phBoMarketingTodos = [];
  return G.__phBoMarketingTodos;
}

/** Offene Freigabe-Aufgaben (ToDo mit reference_type aus ph_marketing). Mock: Prozess-Speicher + Seed-Merker. */
export async function freigabeAufgaben(client, { doctype, name } = {}) {
  if (istMock(client)) {
    const liste = mockTodos().filter((t) => t.status === "Open" && (!doctype || t.reference_type === doctype) && (!name || t.reference_name === name));
    if (!doctype || doctype === "PH Social Beitrag") {
      for (const d of client.tabelle("PH Social Beitrag").values()) {
        if (Number(d._wartet || 0) && d.status === "Entwurf" && (!name || d.name === name) && !liste.some((t) => t.reference_name === d.name)) {
          liste.push({ name: `TODO-SEED-${d.name}`, reference_type: "PH Social Beitrag", reference_name: d.name, status: "Open", owner: d.zustaendig || "marketing@demo.local", description: "Zur Freigabe gegeben", date: isoDatum(jetzt(client)), creation: d.modified });
        }
      }
    }
    return klon(liste);
  }
  const filters = [["status", "=", "Open"], ["reference_type", "in", doctype ? [doctype] : ["PH Newsletter Ausgabe", "PH Social Beitrag", "PH Event", "PH Kundenreise", "PH Empfehlung"]]];
  if (name) filters.push(["reference_name", "=", name]);
  return client.getList("ToDo", { fields: ["name", "reference_type", "reference_name", "status", "owner", "allocated_to", "description", "date", "creation"], filters, limit: 200 });
}

export async function freigabeAufgabeAnlegen(client, { doctype, name, beschreibung, an = [] }) {
  if (istMock(client)) {
    const t = { name: `TODO-MAR-${mockTodos().length + 1}`, reference_type: doctype, reference_name: name, status: "Open", owner: client.session.user, allocated_to: an[0] || "", description: beschreibung, date: isoDatum(jetzt(client)), creation: isoDatumZeit(jetzt(client)) };
    mockTodos().push(t);
    return t;
  }
  const ziel = an.length ? an : [""];
  let letzte = null;
  for (const a of ziel) letzte = await client.insert("ToDo", { reference_type: doctype, reference_name: name, description: beschreibung, allocated_to: a || undefined, status: "Open", date: isoDatum(jetzt(client)), priority: "Medium" });
  return letzte;
}

export async function freigabeAufgabenSchliessen(client, { doctype, name }) {
  if (istMock(client)) {
    for (const t of mockTodos()) if (t.reference_type === doctype && t.reference_name === name && t.status === "Open") t.status = "Closed";
    if (doctype === "PH Social Beitrag" && client.tabelle(doctype).has(name)) mockSchreibe(client, doctype, name, { _wartet: 0 });
    return;
  }
  const offen = await client.getList("ToDo", { fields: ["name"], filters: [["status", "=", "Open"], ["reference_type", "=", doctype], ["reference_name", "=", name]], limit: 50 });
  for (const t of offen) await client.save("ToDo", { name: t.name, status: "Closed" });
}

// ------------------------------------------------------------------------------------------------ Newsletter

const AUSGABE = "PH Newsletter Ausgabe";

function bloeckeNormal(bloecke = []) {
  return bloecke.map((b) => ({
    typ: b.typ, titel: b.titel || "", text: b.text || "", absender: b.absender || "", bild: b.bild || "", bild_alt: b.bild_alt || "",
    bildquelle: b.bild ? "eigen" : b.bildquelle || "", marke: b.marke || "", url: b.url || "", link_label: b.link_label || "", event: b.event || "", quelle: b.quelle || "",
    ...(b.name ? { name: b.name } : {}),
  }));
}

/** Server-Spiegel validate(): sichtbar, versandbereit, offene Teile. */
function ausgabeAbleiten(doc) {
  const bloecke = (doc.bloecke || []).map((b) => ({ ...b, sichtbar: blockSichtbar(b) ? 1 : 0 }));
  return { bloecke, versandbereit: versandbereit(bloecke) ? 1 : 0, offene_slots: offeneSlots(bloecke).join(", ") };
}

export async function ausgabeAnlegen(client, { slug, art = "struktur", letzte = null }) {
  const vorlageBloecke = letzte?.bloecke?.length ? letzte.bloecke : ["brief", "neueStuecke", "skizze", "termine", "gutZuWissen"].map((typ) => ({ typ }));
  const bloecke = art === "leer" ? [] : art === "kopie" ? bloeckeNormal(vorlageBloecke).map(({ name: _n, ...b }) => b) : vorlageBloecke.map((b) => ({ typ: b.typ, titel: ["termine", "gutZuWissen", "neueStuecke"].includes(b.typ) && b.titel ? b.titel : "", absender: b.typ === "brief" ? b.absender || "Susanne Messmer" : "" }));
  const werte = { naming_series: "PH-NL-.YYYY.-.###", slug, betreff: art === "kopie" && letzte?.betreff ? letzte.betreff : "(ohne Betreff)", zielgruppe: "Alle aktiven Abos", sprache: "de", bloecke };
  if (istMock(client)) Object.assign(werte, ausgabeAbleiten(werte));
  return client.insert(AUSGABE, werte);
}

export async function ausgabeLoeschen(client, name) {
  const d = await client.getDoc(AUSGABE, name);
  if (d.status !== "Entwurf" || Number(d.gesendet || 0)) throw new BackofficeError("invalid", "Nur ein Entwurf ohne Versand kann verworfen werden.");
  return client.delete(AUSGABE, name);
}

/**
 * Speichern mit Konfliktprüfung über `modified`. Ist die Ausgabe in „Freigabe“ oder „Geplant“, setzt die erste
 * Änderung sie zurück auf Entwurf (P-M8) – im Mock wie im Workflow „Zurück auf Entwurf“.
 */
export async function ausgabeSpeichern(client, { name, modified, felder = {}, bloecke }) {
  let doc = await client.getDoc(AUSGABE, name);
  if (["Wird versendet", "Versendet", "Abgebrochen"].includes(doc.status)) throw new BackofficeError("invalid", "Eine versendete Ausgabe wird nicht mehr geändert.");
  if (modified && doc.modified && String(modified) !== String(doc.modified)) throw new BackofficeError("conflict", "Die Ausgabe wurde inzwischen geändert.", { detail: { serverstand: doc } });
  let zurueck = false;
  if (["Freigabe", "Geplant"].includes(doc.status)) {
    doc = await client.workflowAction(AUSGABE, name, "Zurück auf Entwurf");
    zurueck = true;
  }
  const erlaubt = ["betreff", "sprache", "kampagne", "zielgruppe", "zielgruppe_interesse", "segment", "versand_geplant"];
  const werte = { name, modified: doc.modified };
  for (const k of erlaubt) if (k in felder) werte[k] = felder[k];
  if (Array.isArray(bloecke)) werte.bloecke = bloeckeNormal(bloecke);
  const neu = await client.save(AUSGABE, werte, { modified: doc.modified });
  // Mock: validate() leitet sichtbar/versandbereit/offene_slots ab; schreibgeschützte Felder setzt der Mock nur direkt.
  if (istMock(client)) return { doc: mockSchreibe(client, AUSGABE, name, ausgabeAbleiten(neu)), zurueck };
  return { doc: neu, zurueck };
}

export async function ausgabeVorschau(client, name, { dunkel = false } = {}) {
  if (!istMock(client)) return client.runDocMethod(AUSGABE, name, "vorschau", {});
  const doc = await client.getDoc(AUSGABE, name);
  if (doc._vorschau_fehler) throw new BackofficeError("unavailable", "Vorschau konnte nicht erzeugt werden.");
  const events = {};
  for (const b of doc.bloecke || []) {
    if (b.event && client.tabelle("PH Event").has(b.event)) {
      const e = client.tabelle("PH Event").get(b.event);
      events[b.event] = { titel: e.titel, datumText: e.datum };
    }
  }
  const r = newsletterHtml(doc, { dunkel, events });
  return { ...r, empfaenger: await empfaengerAnzahl(client, doc) };
}

/** Empfängerzahl wie newsletter.empfaenger_fuer (nur Aktive mit Bestätigung, kein Altbestand). */
export async function empfaengerAnzahl(client, doc) {
  if (!istMock(client)) {
    try {
      const r = await client.call(`${BO}.list_recipients`, { ausgabe: doc.name, start: 0, limit: 1 });
      return Number(r?.gesamt ?? r?.data?.gesamt ?? doc.empfaenger_anzahl ?? 0);
    } catch {
      return Number(doc.empfaenger_anzahl || 0);
    }
  }
  return (await empfaengerListe(client, doc)).length;
}

export async function empfaengerListe(client, doc, { start = 0, limit = 100 } = {}) {
  if (!istMock(client)) {
    const r = await client.call(`${BO}.list_recipients`, { ausgabe: doc.name, start, limit });
    return r?.zeilen || r?.data?.zeilen || [];
  }
  let abos = [...client.tabelle("PH Newsletter Abo").values()].filter((a) => a.status === "Aktiv" && !Number(a.altbestand_ohne_doi || 0));
  if (doc.zielgruppe === "Sprache") abos = abos.filter((a) => a.sprache === doc.sprache);
  if (doc.zielgruppe === "Interesse") abos = abos.filter((a) => (a.interessen || []).some((i) => i.interesse === doc.zielgruppe_interesse));
  if (doc.zielgruppe === "Testadresse") {
    const e = await einstellungen(client);
    return [{ email: e.test_empfaenger, sprache: "de" }];
  }
  if (doc.zielgruppe === "Segment" && doc.segment) {
    const v = await segmentVorschauBerechnen(client, client.tabelle("PH Segment").get(doc.segment));
    const ok = new Set(v.personen.map((p) => p.email));
    abos = abos.filter((a) => ok.has(a.email));
  }
  return abos.slice(start, start + limit).map((a) => ({ email: a.email, sprache: a.sprache, name: a.anrede_name || a.titel, quelle: a.quelle }));
}

export async function testmail(client, { doctype, name, empfaenger }) {
  if (!istMock(client)) return client.runDocMethod(doctype, name, "testmail", { empfaenger });
  const doc = await client.getDoc(doctype, name);
  if (doc._testmail_fehler) throw new BackofficeError("unavailable", "Mail-Dienst antwortet nicht.");
  client.kommentar(doctype, name, `Testmail an ${empfaenger}`, "Info");
  if (doctype === AUSGABE) mockSchreibe(client, doctype, name, { _letzte_testmail: isoDatumZeit(jetzt(client)), _testmail_an: empfaenger });
  return empfaenger;
}

export async function ausgabeZurFreigabe(client, name) {
  const doc = await client.workflowAction(AUSGABE, name, "Zur Freigabe");
  return doc;
}

/** Freigeben (Leitung): aus Entwurf zwei Übergänge (E9), aus Freigabe einer; Termin zuerst setzen. */
export async function ausgabeFreigeben(client, { name, versand_geplant }) {
  let doc = await client.getDoc(AUSGABE, name);
  if (versand_geplant && doc.versand_geplant !== versand_geplant) doc = await client.setValue(AUSGABE, name, "versand_geplant", versand_geplant);
  if (doc.status === "Entwurf") doc = await client.workflowAction(AUSGABE, name, "Zur Freigabe");
  doc = await client.workflowAction(AUSGABE, name, "Freigeben");
  if (istMock(client)) {
    const anzahl = await empfaengerAnzahl(client, doc);
    doc = mockSchreibe(client, AUSGABE, name, { freigegeben_von: client.session.user, freigegeben_am: isoDatumZeit(jetzt(client)), empfaenger_anzahl: anzahl });
  }
  return doc;
}

export async function ausgabeZurueck(client, { name, kommentar }) {
  const doc = await client.workflowAction(AUSGABE, name, "Zurück auf Entwurf");
  if (kommentar) await kommentieren(client, AUSGABE, name, `Zurückgegeben: ${kommentar}`);
  return doc;
}

export async function ausgabeTermin(client, { name, termin }) {
  return client.setValue(AUSGABE, name, "versand_geplant", termin);
}

export async function ausgabeJetztVersenden(client, name) {
  if (!istMock(client)) return client.runDocMethod(AUSGABE, name, "jetzt_versenden", {});
  const doc = await client.getDoc(AUSGABE, name);
  if (!["Geplant", "Wird versendet"].includes(doc.status)) throw new BackofficeError("invalid", "Nur geplante Ausgaben können versendet werden.");
  const n = (await empfaengerListe(client, doc, { limit: 100000 })).length;
  mockSchreibe(client, AUSGABE, name, { status: "Wird versendet", workflow_state: "PH Wird versendet", versand_begonnen: isoDatumZeit(jetzt(client)), empfaenger_anzahl: n, gesendet: Math.ceil(n / 2), fehler: 0, versandweg: "Frappe Email Queue" }, { kommentar: `Versand ausgelöst: ${Math.ceil(n / 2)} Mails in diesem Lauf` });
  return Math.ceil(n / 2);
}

/** Fortschritt des Versands (Abfrage alle 15 s). Mock: jeder Abruf schließt den nächsten Stapel ab. */
export async function ausgabeVersandStand(client, name) {
  const doc = await client.getDoc(AUSGABE, name);
  if (istMock(client) && doc.status === "Wird versendet") {
    const n = Number(doc.empfaenger_anzahl || 0);
    const g = Math.min(n, Number(doc.gesendet || 0) + Math.max(1, Math.ceil(n / 2)));
    const fertig = g >= n;
    const neu = mockSchreibe(client, AUSGABE, name, fertig ? { gesendet: n - (n > 3 ? 1 : 0), fehler: n > 3 ? 1 : 0, status: "Versendet", workflow_state: "PH Versendet", versendet_am: isoDatumZeit(jetzt(client)) } : { gesendet: g });
    return { status: neu.status, gesendet: neu.gesendet, fehler: neu.fehler, empfaenger: n };
  }
  return { status: doc.status, gesendet: Number(doc.gesendet || 0), fehler: Number(doc.fehler || 0), empfaenger: Number(doc.empfaenger_anzahl || 0) };
}

export async function ausgabeAbbrechen(client, { name, grund }) {
  if (!istMock(client)) return client.runDocMethod(AUSGABE, name, "abbrechen", { grund });
  const doc = await client.getDoc(AUSGABE, name);
  if (doc.status === "Versendet") throw new BackofficeError("invalid", "Bereits versendet.");
  mockSchreibe(client, AUSGABE, name, { status: "Abgebrochen", workflow_state: "PH Abgebrochen", abbruch_grund: String(grund || "").slice(0, 140) }, { kommentar: `Abgebrochen${grund ? `: ${grund}` : ""}` });
  return "Abgebrochen";
}

export async function versandProtokoll(client, name, { status } = {}) {
  const filters = [["ausgabe", "=", name]];
  if (status) filters.push(["status", "=", status]);
  return client.getList("PH Newsletter Versand", { fields: ["name", "email", "status", "gesendet_am", "zugestellt_am", "grund", "bounce_typ"], filters, orderBy: "email asc", limit: 500 });
}

// ------------------------------------------------------------------------------------------------ Empfänger

const ABO = "PH Newsletter Abo";
const EINW = "PH Einwilligung";

export async function bestaetigungErneutSenden(client, emails = []) {
  if (!istMock(client)) {
    try {
      return await client.call(`${BO}.resend_doi_bulk`, { abos: emails });
    } catch (err) {
      if (err?.code !== "not_found") throw err;
      for (const e of emails) await client.runDocMethod(ABO, e, "doi_erneut_senden", {});
      return { gesendet: emails.length, uebersprungen: [] };
    }
  }
  const erg = { gesendet: 0, uebersprungen: [] };
  const t = jetzt(client);
  for (const e of emails) {
    const a = client.tabelle(ABO).get(e);
    if (!a) {
      erg.uebersprungen.push({ abo: e, grund: "nicht_gefunden" });
      continue;
    }
    if (a.status !== "Angemeldet unbestaetigt") {
      erg.uebersprungen.push({ abo: e, grund: a.status });
      continue;
    }
    const letzte = a.doi_erinnert_am || a.doi_gesendet_am;
    if (letzte && t.getTime() - new Date(String(letzte).replace(" ", "T")).getTime() < 3600000) {
      erg.uebersprungen.push({ abo: e, grund: "sperre_60_min" });
      continue;
    }
    mockSchreibe(client, ABO, e, { doi_erinnert_am: isoDatumZeit(t) }, { kommentar: "Bestätigungsmail erneut gesendet" });
    erg.gesendet += 1;
  }
  return erg;
}

export async function aboAbmelden(client, { email, kanal = "backoffice", grund = "" }) {
  if (!istMock(client)) return client.runDocMethod(ABO, email, "abmelden", { grund, kanal });
  const a = client.tabelle(ABO).get(email);
  if (!a) throw new BackofficeError("not_found", "Diese Adresse ist nicht angemeldet.");
  if (["Abgemeldet", "Bounce", "Beschwerde"].includes(a.status)) return a.status;
  const t = isoDatumZeit(jetzt(client));
  mockSchreibe(client, ABO, email, { status: "Abgemeldet", abgemeldet_am: t, abmelde_kanal: kanal === "telefon" || kanal === "showroom" ? "backoffice" : kanal, abmelde_grund: grund }, { kommentar: `Abgemeldet (${kanal})${grund ? `: ${grund}` : ""}` });
  for (const w of client.tabelle(EINW).values()) {
    if (w.email === email && w.zweck === "newsletter" && ["Offen", "Bestaetigt"].includes(w.status)) mockSchreibe(client, EINW, w.name, { status: "Widerrufen", widerrufen_am: t, widerruf_kanal: kanal === "antwort_mail" ? "antwort_mail" : "backoffice", widerruf_grund: grund });
  }
  return "Abgemeldet";
}

export async function einwilligungWiderrufen(client, { name, kanal = "backoffice", grund = "" }) {
  if (!istMock(client)) return client.runDocMethod(EINW, name, "widerrufen", { kanal, grund });
  const w = await client.getDoc(EINW, name);
  const t = isoDatumZeit(jetzt(client));
  const kanalWert = ["link", "antwort_mail", "telefon", "showroom", "backoffice"].includes(kanal) ? kanal : "backoffice";
  for (const x of client.tabelle(EINW).values()) {
    if (x.email === w.email && x.zweck === w.zweck && ["Offen", "Bestaetigt"].includes(x.status)) mockSchreibe(client, EINW, x.name, { status: "Widerrufen", widerrufen_am: t, widerruf_kanal: kanalWert, widerruf_grund: grund }, { kommentar: `Widerrufen (${kanalWert})` });
  }
  if (w.zweck === "newsletter" && client.tabelle(ABO).has(w.email)) await aboAbmelden(client, { email: w.email, kanal: kanalWert, grund });
  return "Widerrufen";
}

export async function einwilligungMitBeleg(client, { name, beleg_hinweis }) {
  if (!istMock(client)) return client.runDocMethod(EINW, name, "bestaetigen_mit_beleg", { beleg_hinweis });
  return mockSchreibe(client, EINW, name, { status: "Bestaetigt", doi_bestaetigt_am: isoDatumZeit(jetzt(client)), doi_bestaetigt_kanal: "beleg" }, { kommentar: `Bestätigt mit Beleg: ${beleg_hinweis}` });
}

/** Neue Einwilligung auf Papier mit Beleg (R2: nie doi_noetig = 0 ohne Beleg). */
export async function einwilligungPapier(client, { email, kontakt, zweck, textversion, beleg, bezug }) {
  if (!beleg) throw new BackofficeError("invalid", "Ohne Formular kein Nachweis", { detail: { feld: "datei" } });
  return client.insert(EINW, {
    email: emailNormal(email), kontakt: kontakt || "", zweck, status: "Bestaetigt", zeitpunkt: isoDatumZeit(jetzt(client)), kanal: "papier", textversion, sprache: "de", doi_noetig: 0, erteilung_beleg: beleg,
    quelle: "backoffice:papier", ...(bezug?.doctype ? { referenz_doctype: bezug.doctype, referenz_name: bezug.name } : {}),
  });
}

/** Anmeldung im Showroom/am Telefon (L1): Abo unbestätigt + Bestätigungsmail; nie sofort aktiv. */
export async function newsletterAnmelden(client, { email, anrede_name, sprache = "de", interessen = [], quelle = "showroom" }) {
  if (!istMock(client)) return client.call(`${BO}.create_subscription`, { email, anrede_name, sprache, interessen, quelle, hinweis_bestaetigt: 1 });
  const e = emailNormal(email);
  const vorhanden = client.tabelle(ABO).get(e);
  if (vorhanden && ["Aktiv", "Angemeldet unbestaetigt"].includes(vorhanden.status)) throw new BackofficeError("conflict", "Diese Adresse ist schon angemeldet.");
  const t = isoDatumZeit(jetzt(client));
  const werte = { email: e, titel: anrede_name || e, status: "Angemeldet unbestaetigt", sprache, quelle: ["showroom", "event", "backoffice"].includes(quelle) ? quelle : "backoffice", quelle_detail: `backoffice:${client.session.user}`, anrede_name, angemeldet_am: t, doi_gesendet_am: t, textversion: "nl-2026-10-29", interessen: interessen.map((i) => ({ interesse: i })) };
  if (vorhanden) mockSchreibe(client, ABO, e, werte, { kommentar: "Erneut angemeldet – Bestätigungsmail gesendet" });
  else await client.insert(ABO, { name: e, ...werte });
  await client.insert(EINW, { email: e, zweck: "newsletter", status: "Offen", zeitpunkt: t, kanal: "backoffice", textversion: "nl-2026-10-29", sprache, doi_noetig: 1, doi_gesendet_am: t, quelle: `backoffice:${quelle}` });
  return { success: true, doi: true, abo: e };
}

export async function aboFelder(client, { email, felder }) {
  const erlaubt = {};
  for (const k of ["anrede_name", "sprache"]) if (k in felder) erlaubt[k] = felder[k];
  if (Array.isArray(felder.interessen)) erlaubt.interessen = felder.interessen.map((i) => ({ interesse: i }));
  if (istMock(client)) return mockSchreibe(client, ABO, email, erlaubt);
  return client.save(ABO, { name: email, ...erlaubt });
}

export async function auskunft(client, email) {
  if (!istMock(client)) return client.runDocMethod(ABO, email, "auskunft", {});
  const abo = client.tabelle(ABO).get(email) || null;
  const einw = [...client.tabelle(EINW).values()].filter((w) => w.email === email);
  const versand = [...client.tabelle("PH Newsletter Versand").values()].filter((v) => v.email === email);
  const events = [];
  for (const e of client.tabelle("PH Event").values()) for (const a of e.anmeldungen || []) if (emailNormal(a.email) === email) events.push({ event: e.titel, datum: e.datum, status: a.status, personen: a.personen });
  return klon({ abo, einwilligungen: einw, zustellungen: versand, events });
}

export async function datenLoeschen(client, email) {
  if (!istMock(client)) return client.runDocMethod(ABO, email, "loeschen_dsgvo", {});
  const a = client.tabelle(ABO).get(email);
  if (!a) throw new BackofficeError("not_found", "Diese Adresse gibt es nicht mehr.");
  client.tabelle(ABO).delete(email);
  return "geloescht";
}

/** Kontaktsperre „jede Kontaktaufnahme“ (D4 Umfang kontakt): mit CRM-Schreibrecht direkt, sonst Aufgabe an CRM. */
export async function kontaktSperren(client, { kontakt, email, darfCrm }) {
  if (kontakt && darfCrm) {
    if (istMock(client) && client.tabelle("PH Kontakt").has(kontakt)) return mockSchreibe(client, "PH Kontakt", kontakt, { nicht_kontaktieren: 1 }, { kommentar: "Kontaktsperre aus Marketing („Keine Werbung mehr“)" });
    return client.setValue("PH Kontakt", kontakt, "nicht_kontaktieren", 1);
  }
  return freigabeAufgabeAnlegen(client, { doctype: kontakt ? "PH Kontakt" : ABO, name: kontakt || email, beschreibung: `Kontaktsperre setzen: ${email} will keine Kontaktaufnahme außer Vertrag/Service.` });
}

// ------------------------------------------------------------------------------------------------ Zielgruppen

export async function segmentVorschauBerechnen(client, seg) {
  const abos = [...client.tabelle(ABO).values()];
  const einw = [...client.tabelle(EINW).values()];
  const kontakte = client.tabelle("PH Kontakt");
  const regeln = (seg?.regeln || []).filter((r) => !Number(r.deaktiviert || 0));
  const passt = (abo) => {
    const ergebnisse = regeln.map((r) => {
      let ok = true;
      const wert = String(r.wert || "").toLowerCase();
      if (r.kriterium === "interesse") ok = (abo.interessen || []).some((i) => String(i.interesse).toLowerCase() === wert);
      else if (r.kriterium === "sprache") ok = String(abo.sprache || "").toLowerCase() === wert;
      else if (r.kriterium === "abo_quelle") ok = String(abo.quelle || "").toLowerCase() === wert;
      else if (r.kriterium === "plz") ok = String(kontakte.get(abo.kontakt)?.plz_ort || kontakte.get(abo.kontakt)?.plz || "").startsWith(r.wert || "");
      else ok = true; // Käufe/Umsatz/Event: im Mock ohne Auftragsdaten → zählt
      if (r.operator === "ist nicht") ok = !ok;
      return Number(r.negieren || 0) ? !ok : ok;
    });
    if (!ergebnisse.length) return true;
    return seg?.verknuepfung === "ODER" ? ergebnisse.some(Boolean) : ergebnisse.every(Boolean);
  };
  const treffer = abos.filter(passt);
  const ausgeschlossen = {};
  const personen = [];
  for (const a of treffer) {
    const wirksam = einw.some((w) => w.email === a.email && w.zweck === (seg?.zweck || "newsletter") && w.status === "Bestaetigt");
    const sperre = Number(kontakte.get(a.kontakt)?.nicht_kontaktieren || 0);
    if (sperre) ausgeschlossen.nicht_kontaktieren = (ausgeschlossen.nicht_kontaktieren || 0) + 1;
    else if (!wirksam) ausgeschlossen.ohne_einwilligung = (ausgeschlossen.ohne_einwilligung || 0) + 1;
    else personen.push({ email: a.email, name: a.anrede_name || a.titel || "", sprache: a.sprache });
  }
  return { treffer: treffer.length, empfaenger: personen.length, ausgeschlossen, personen: personen.slice(0, 20), alle: personen.length };
}

export async function segmentVorschau(client, { name, regeln, verknuepfung, zweck, speichern = 0 }) {
  if (!istMock(client)) {
    if (speichern) return client.call(`${BO}.preview_segment`, { segment: name });
    return client.runDocMethod("PH Segment", name, "vorschau", { speichern: 0 });
  }
  const seg = name && client.tabelle("PH Segment").has(name) ? { ...client.tabelle("PH Segment").get(name) } : {};
  if (regeln) seg.regeln = regeln;
  if (verknuepfung) seg.verknuepfung = verknuepfung;
  if (zweck) seg.zweck = zweck;
  const v = await segmentVorschauBerechnen(client, seg);
  if (speichern && name) mockSchreibe(client, "PH Segment", name, { vorschau_treffer: v.treffer, vorschau_empfaenger: v.empfaenger, vorschau_ausgeschlossen: Object.entries(v.ausgeschlossen).map(([k, n]) => `${k}: ${n}`).join(", "), vorschau_am: isoDatumZeit(jetzt(client)) });
  return v;
}

export async function segmentSpeichern(client, { name, werte }) {
  const doc = { ...werte, regeln: (werte.regeln || []).map((r) => ({ kriterium: r.kriterium, operator: r.operator, wert: r.wert || "", wert_bis: r.wert_bis || "", negieren: Number(r.negieren || 0), deaktiviert: Number(r.deaktiviert || 0) })) };
  if (!name) return client.insert("PH Segment", { ...doc, segment_id: doc.segment_id, name: doc.segment_id });
  if (istMock(client)) return mockSchreibe(client, "PH Segment", name, doc);
  return client.save("PH Segment", { name, ...doc });
}

// ------------------------------------------------------------------------------------------------ Kundenreisen

const REISE = "PH Kundenreise";

export async function reisePruefen(client, name) {
  if (!istMock(client)) return client.runDocMethod(REISE, name, "pruefen", {});
  const r = await client.getDoc(REISE, name);
  const v = client.tabelle("PH Mail Vorlage").get(r.vorlage);
  return pruefeReise(r, v?.html || "");
}

export async function reiseAktivieren(client, name) {
  if (!istMock(client)) return client.runDocMethod(REISE, name, "aktivieren", {});
  const r = await client.getDoc(REISE, name);
  const fehler = pruefeReise(r, client.tabelle("PH Mail Vorlage").get(r.vorlage)?.html || "");
  if (fehler.length) throw new BackofficeError("invalid", fehler.join(" · "), { detail: { fehler } });
  const e = await einstellungen(client);
  if (Number(r.werbung) && !Number(e.kanzlei_fusszeilen_freigegeben || 0)) throw new BackofficeError("invalid", "Werbliche Reise: zuerst Kanzlei-Freigabe der Fußzeilen in den Einstellungen setzen.");
  mockSchreibe(client, REISE, name, { aktiv: 1, status: "Aktiv" }, { kommentar: "Aktiviert" });
  return "Aktiv";
}

export async function reisePausieren(client, name) {
  if (!istMock(client)) return client.runDocMethod(REISE, name, "pausieren", {});
  mockSchreibe(client, REISE, name, { aktiv: 0, status: "Pausiert" }, { kommentar: "Pausiert" });
  return "Pausiert";
}

export async function reiseVorschau(client, name) {
  if (!istMock(client)) return client.runDocMethod(REISE, name, "vorschau", {});
  const r = await client.getDoc(REISE, name);
  const v = client.tabelle("PH Mail Vorlage").get(r.vorlage);
  if (!v) throw new BackofficeError("not_found", "Vorlage fehlt.");
  return { ...vorlageFuellen(v), grundlage: !Number(r.werbung) ? "V" : Number(r.grundlage_e) ? "E" : "B" };
}

export async function reiseHeutePlanen(client, name) {
  if (!istMock(client)) return client.runDocMethod(REISE, name, "heute_planen", {});
  client.kommentar(REISE, name, "Fällige heute geplant: 0 (im Testmodus ohne Auftragsdaten)", "Info");
  return 0;
}

export async function reiseTrockenlauf(client, name) {
  if (!istMock(client)) return client.call(`${BO}.journey_dry_run`, { reise: name });
  const r = await client.getDoc(REISE, name);
  const n = Number(r.werbung) ? 3 : 2;
  return { faellig: n, beispiele: [], gesperrt: Number(r.werbung) ? { frequenzgrenze: 1, ohne_einwilligung: 2 } : {} };
}

/** Speichern; ändert die Leitung bei einer aktiven Reise eine Freigabe-Regel → zurück auf Entwurf (U15/K9, bis P1-3). */
export async function reiseSpeichern(client, { name, werte, neueFreigabe = false }) {
  const doc = { ...werte };
  if (Array.isArray(werte.trigger)) doc.trigger = werte.trigger.map((t) => ({ ausloeser_typ: t.ausloeser_typ, feld: t.feld || "", versatz_tage: Number(t.versatz_tage || 0), tag_monat: t.tag_monat || "", event: t.event || "", zwecke: t.zwecke || "" }));
  if (neueFreigabe) Object.assign(doc, { aktiv: 0, status: "Entwurf" });
  const neu = istMock(client) ? mockSchreibe(client, REISE, name, doc) : await client.save(REISE, { name, ...doc });
  if (neueFreigabe) await kommentieren(client, REISE, name, "Regel geändert – Reise ist wieder Entwurf und braucht eine neue Freigabe.");
  return neu;
}

export async function reiseDuplizieren(client, { quelle, titel }) {
  const r = await client.getDoc(REISE, quelle);
  const { name: _n, creation: _c, modified: _m, owner: _o, gesendet_gesamt: _g, uebersprungen_gesamt: _u, letzter_versand: _l, ...rest } = r;
  const id = String(titel || "").toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 40) || `${quelle}_kopie`;
  return client.insert(REISE, { ...rest, name: id, reise_id: id, titel, status: "Entwurf", aktiv: 0, trigger: (r.trigger || []).map(({ name: _x, parent: _p, ...t }) => t) });
}

export async function reiseNeu(client, werte) {
  const id = String(werte.titel || "").toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 40);
  return client.insert(REISE, { name: id, reise_id: id, status: "Entwurf", aktiv: 0, ...werte });
}

export async function reiseProtokoll(client, name) {
  return client.getList("PH Reise Versand", { fields: ["name", "empfaenger", "status", "grundlage", "grund", "geplant_am", "gesendet_am", "referenz_doctype", "referenz_name"], filters: [["reise", "=", name]], orderBy: "geplant_am desc", limit: 200 });
}

// ------------------------------------------------------------------------------------------------ Kampagnen

const KAMPAGNE = "PH Kampagne";

export async function kennzahlErfassen(client, { name, zeile }) {
  const args = { datum: zeile.datum, impressionen: Number(zeile.impressionen || 0), klicks: Number(zeile.klicks || 0), kosten_cent: Number(zeile.kosten_cent || 0), anfragen: Number(zeile.anfragen || 0), notiz: zeile.notiz || null };
  if (!istMock(client)) return client.runDocMethod(KAMPAGNE, name, "kennzahl_erfassen", args);
  const k = await client.getDoc(KAMPAGNE, name);
  const kennzahlen = [...(k.kennzahlen || []).map(({ name: _n, ...z }) => z), { ...args, notiz: args.notiz || "" }].sort((a, b) => String(a.datum).localeCompare(String(b.datum)));
  const crm = await anfragenCrm(client, name);
  const agg = kennzahlenAggregat(kennzahlen, crm);
  return mockSchreibe(client, KAMPAGNE, name, { kennzahlen, ...agg, kosten_je_anfrage_cent: agg.anfragen_gesamt ? Math.round(agg.ausgaben_cent / agg.anfragen_gesamt) : 0, kosten_je_klick_cent: agg.klicks_gesamt ? Math.round(agg.ausgaben_cent / agg.klicks_gesamt) : 0 });
}

async function anfragenCrm(client, name) {
  try {
    return await client.count("PH Anfrage", { filters: [["ph_marketing_kampagne", "=", name]] });
  } catch {
    return 0;
  }
}

export async function anfragenZaehlen(client, name) {
  if (!istMock(client)) return client.runDocMethod(KAMPAGNE, name, "anfragen_zaehlen", {});
  const k = await client.getDoc(KAMPAGNE, name);
  const crm = await anfragenCrm(client, name);
  const manuell = (k.kennzahlen || []).reduce((a, z) => a + Number(z.anfragen || 0), 0);
  return { anfragen_crm: crm, anfragen_manuell: manuell, anfragen_gesamt: crm + manuell };
}

export async function kampagneAuswertung(client, name) {
  if (!istMock(client)) return client.runDocMethod(KAMPAGNE, name, "auswertung", {});
  const k = await client.getDoc(KAMPAGNE, name);
  const z = await anfragenZaehlen(client, name);
  const agg = kennzahlenAggregat(k.kennzahlen || [], z.anfragen_crm);
  let gewonnen = 0;
  try {
    gewonnen = await client.count("PH Anfrage", { filters: [["ph_marketing_kampagne", "=", name], ["status", "=", "Gewonnen"]] });
  } catch {
    gewonnen = 0;
  }
  return { ...agg, ...z, gewonnen, kosten_gemeldet_cent: agg.ausgaben_cent, kosten_belegt_cent: null, umsatz_netto_cent: null };
}

export async function kennzahlenImport(client, { name, csv, zeilen }) {
  if (!istMock(client) && csv) return client.runDocMethod(KAMPAGNE, name, "kennzahlen_import", { csv_text: csv, vorschau: 0 });
  let n = 0;
  for (const z of zeilen || []) {
    await kennzahlErfassen(client, { name, zeile: z });
    n += 1;
  }
  return { uebernommen: n };
}

export async function kampagneAnlegen(client, werte) {
  return client.insert(KAMPAGNE, { naming_series: "PH-KAM-.YYYY.-.####", waehrung: "EUR", ...werte });
}

// ------------------------------------------------------------------------------------------------ Events

const EVENT = "PH Event";

export async function eventAnlegen(client, werte) {
  const id = String(werte.event_id || `${werte.titel}-${String(werte.datum).slice(0, 4)}`).toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  return client.insert(EVENT, { ...werte, name: id, event_id: id, kostenlos: 1, status: "Geplant" });
}

/** Anmeldung (D5) – Frappe: anmeldung_hinzufuegen(name_person, email, personen, telefon, quelle, nachricht). */
export async function anmeldungHinzufuegen(client, { event, name_person, email, personen = 1, telefon = "", quelle = "telefon", nachricht = "" }) {
  if (!istMock(client)) return client.runDocMethod(EVENT, event, "anmeldung_hinzufuegen", { name_person, email, personen, telefon, quelle, nachricht });
  const ev = await client.getDoc(EVENT, event);
  const p = anmeldungPruefen(ev, { email, personen });
  if (p.art === "nicht_offen") throw new BackofficeError("invalid", "Anmeldungen sind erst nach dem Veröffentlichen möglich.");
  if (p.art === "doppelt") throw new BackofficeError("conflict", "Diese Adresse ist schon angemeldet.", { detail: { personen: p.personen } });
  if (p.art === "zu_viele") throw new BackofficeError("invalid", `Höchstens ${p.max} Personen je Anmeldung.`, { detail: { feld: "personen" } });
  if (p.art === "ausgebucht") throw new BackofficeError("invalid", "Das Event ist ausgebucht", { detail: { feld: "personen" } });
  const t = isoDatumZeit(jetzt(client));
  const zeile = { name_person, email: emailNormal(email), telefon, personen: Number(personen), status: p.art === "warteliste" ? "warteliste" : "angemeldet", quelle, angemeldet_am: t, nachricht, bestaetigung_gesendet_am: email && p.art !== "warteliste" ? t : "", textversion: ev.einwilligung_textversion };
  const anmeldungen = [...(ev.anmeldungen || []).map((a) => ({ ...a })), zeile];
  const neu = mockSchreibe(client, EVENT, event, { anmeldungen, ...belegung(ev, anmeldungen) }, { kommentar: `Anmeldung ${name_person} (${personen} ${Number(personen) === 1 ? "Person" : "Personen"}, ${quelle})` });
  return { status: zeile.status, zeile: neu.anmeldungen[neu.anmeldungen.length - 1].name };
}

function belegung(ev, anmeldungen) {
  const belegt = anmeldungen.filter((a) => ["angemeldet", "bestaetigt", "erschienen"].includes(a.status)).reduce((s, a) => s + personenVon(a), 0);
  return { plaetze_belegt: belegt, plaetze_frei: ev.kapazitaet ? Math.max(0, Number(ev.kapazitaet) - belegt) : 0 };
}

export async function teilnehmerStatus(client, { event, zeile, status, personen }) {
  if (!istMock(client)) return client.runDocMethod(EVENT, event, "teilnehmer_status", { zeile, status });
  const ev = await client.getDoc(EVENT, event);
  const t = isoDatumZeit(jetzt(client));
  const anmeldungen = (ev.anmeldungen || []).map((a) => (a.name === zeile ? { ...a, status, ...(status === "erschienen" ? { erschienen_am: a.erschienen_am || t, checkin_durch: client.session.user } : {}), ...(status !== "erschienen" ? { erschienen_am: "" } : {}), ...(personen ? { personen: Number(personen) } : {}) } : a));
  if (!anmeldungen.some((a) => a.name === zeile)) throw new BackofficeError("not_found", "Diese Anmeldung gibt es nicht mehr.");
  mockSchreibe(client, EVENT, event, { anmeldungen, ...belegung(ev, anmeldungen) });
  return status;
}

/** Check-in: Zielweg Wrapper event_check_in (A1), sonst teilnehmer_status mit vorherigem Neuladen (Doppel-Erkennung). */
export async function einchecken(client, { event, zeile, code, personen, mitWrapper = true }) {
  if (!istMock(client) && mitWrapper) return client.call(`${BO}.event_check_in`, { code, event, zeile, personen });
  const ev = await client.getDoc(EVENT, event);
  let z = (ev.anmeldungen || []).find((a) => a.name === zeile);
  if (code && !z) {
    const m = /^PHE1\.([^.]+)\.([^.]+)\./.exec(String(code));
    if (m && m[1] === event) z = (ev.anmeldungen || []).find((a) => a.name === m[2]);
    if (!z) return { status: "ungueltig" };
  }
  const entscheid = checkinEntscheiden(z);
  if (entscheid !== "ok") return { status: entscheid, zeile: z?.name, name: z?.name_person, erschienen_am: z?.erschienen_am || "" };
  if (!istMock(client)) {
    await client.runDocMethod(EVENT, event, "teilnehmer_status", { zeile: z.name, status: "erschienen" });
    return { status: "ok", zeile: z.name, name: z.name_person, erschienen_am: isoDatumZeit(jetzt(client)), personen: personen || z.personen };
  }
  await teilnehmerStatus(client, { event, zeile: z.name, status: "erschienen", personen });
  return { status: "ok", zeile: z.name, name: z.name_person, erschienen_am: isoDatumZeit(jetzt(client)), personen: personen || z.personen };
}

export async function checkinStand(client, event) {
  if (!istMock(client)) {
    try {
      return await client.runDocMethod(EVENT, event, "checkin_stand", {});
    } catch {
      /* Rückfall unten */
    }
  }
  const ev = await client.getDoc(EVENT, event);
  const a = ev.anmeldungen || [];
  return { erwartet: a.filter((z) => ["angemeldet", "bestaetigt", "erschienen"].includes(z.status)).reduce((s, z) => s + personenVon(z), 0), da: a.filter((z) => z.status === "erschienen").reduce((s, z) => s + personenVon(z), 0) };
}

export async function nachruecken(client, { event }) {
  if (!istMock(client)) return client.runDocMethod(EVENT, event, "nachruecken_jetzt", {});
  const ev = await client.getDoc(EVENT, event);
  const raus = new Set(nachruecker(ev).map((a) => a.name));
  if (!raus.size) throw new BackofficeError("invalid", "Es sind keine passenden Plätze frei.");
  const t = isoDatumZeit(jetzt(client));
  const anmeldungen = ev.anmeldungen.map((a) => (raus.has(a.name) ? { ...a, status: "angemeldet", nachgerueckt_am: t } : a));
  mockSchreibe(client, EVENT, event, { anmeldungen, ...belegung(ev, anmeldungen), ...(ev.status === "Ausgebucht" ? {} : {}) }, { kommentar: `Nachgerückt: ${raus.size}` });
  return raus.size;
}

export async function erinnerungSenden(client, { event, alle = 0 }) {
  if (!istMock(client)) return client.runDocMethod(EVENT, event, "erinnerung_senden", { alle });
  const ev = await client.getDoc(EVENT, event);
  const t = isoDatumZeit(jetzt(client));
  let n = 0;
  const anmeldungen = ev.anmeldungen.map((a) => {
    if (!["angemeldet", "bestaetigt"].includes(a.status) || !a.email) return a;
    if (a.erinnerung_gesendet_am && !Number(alle)) return a;
    n += 1;
    return { ...a, erinnerung_gesendet_am: t };
  });
  mockSchreibe(client, EVENT, event, { anmeldungen, erinnerung_gesendet_am: t }, { kommentar: `Erinnerung an ${n} Personen gesendet` });
  return n;
}

export async function eventAbsagen(client, { event, grund, mail = true }) {
  await client.workflowAction(EVENT, event, "Absagen");
  await kommentieren(client, EVENT, event, `Abgesagt: ${grund}`);
  if (!mail) return { mails: 0 };
  if (!istMock(client)) return client.runDocMethod(EVENT, event, "absage_senden", { hinweis: grund });
  const ev = await client.getDoc(EVENT, event);
  const t = isoDatumZeit(jetzt(client));
  let n = 0;
  const anmeldungen = ev.anmeldungen.map((a) => {
    if (["abgesagt"].includes(a.status) || !a.email) return a;
    n += 1;
    return { ...a, absage_mail_am: t };
  });
  mockSchreibe(client, EVENT, event, { anmeldungen });
  return { mails: n };
}

export async function teilnehmerliste(client, event) {
  if (!istMock(client)) return client.runDocMethod(EVENT, event, "teilnehmerliste", {});
  const ev = await client.getDoc(EVENT, event);
  return (ev.anmeldungen || []).filter((a) => a.status !== "abgesagt").sort((a, b) => String(a.name_person).localeCompare(String(b.name_person), "de"));
}

// ------------------------------------------------------------------------------------------------ Social

const SOCIAL = "PH Social Beitrag";

export async function socialAnlegen(client, { titel, datum, kanal = "Instagram", format = "Post", zustaendig }) {
  return client.insert(SOCIAL, { naming_series: "PH-SOC-.YYYY.-.####", titel, kanal, format, datum_geplant: datum, status: "Idee", bildquelle_freigabe: "offen", sprache: "de", zustaendig: zustaendig || client.session.user });
}

export async function socialDatumSetzen(client, { name, datum }) {
  let doc = await client.setValue(SOCIAL, name, "datum_geplant", datum);
  if (doc.status === "Freigegeben" && datum) doc = await client.workflowAction(SOCIAL, name, "Planen");
  return doc;
}

export async function socialZurFreigabe(client, { name, leitung = [] }) {
  await kommentieren(client, SOCIAL, name, "Zur Freigabe gegeben");
  if (istMock(client)) mockSchreibe(client, SOCIAL, name, { _wartet: 1 });
  const d = await client.getDoc(SOCIAL, name);
  return freigabeAufgabeAnlegen(client, { doctype: SOCIAL, name, beschreibung: `Beitrag „${d.titel}“ wartet auf Freigabe`, an: leitung });
}

export async function socialFreigeben(client, { name, pruefungen = {} }) {
  const notiz = [pruefungen.kundenprojekt === true ? "Kundenprojekt: Einwilligung Foto-Referenz liegt vor" : pruefungen.kundenprojekt === false ? "Kundenprojekt: nein" : "", pruefungen.kennzeichnung ? `Kennzeichnung: ${pruefungen.kennzeichnung}` : ""].filter(Boolean).join(" · ");
  if (notiz) await kommentieren(client, SOCIAL, name, `Bildrechte geprüft – ${notiz}`);
  let doc;
  if (!istMock(client)) await client.runDocMethod(SOCIAL, name, "freigeben", {});
  else {
    doc = await client.workflowAction(SOCIAL, name, "Freigeben");
    mockSchreibe(client, SOCIAL, name, { freigegeben_von: client.session.user, freigegeben_am: isoDatumZeit(jetzt(client)) });
  }
  await freigabeAufgabenSchliessen(client, { doctype: SOCIAL, name });
  doc = await client.getDoc(SOCIAL, name);
  if (doc.status === "Freigegeben" && doc.datum_geplant) doc = await client.workflowAction(SOCIAL, name, "Planen");
  return doc;
}

export async function socialZurueckgeben(client, { name, kommentar }) {
  const d = await client.getDoc(SOCIAL, name);
  if (["Freigegeben", "Geplant"].includes(d.status)) await client.workflowAction(SOCIAL, name, "Zurück auf Entwurf");
  await kommentieren(client, SOCIAL, name, `Zurückgegeben: ${kommentar}`);
  await freigabeAufgabenSchliessen(client, { doctype: SOCIAL, name });
  return freigabeAufgabeAnlegen(client, { doctype: SOCIAL, name, beschreibung: `Beitrag „${d.titel}“ zurückgegeben: ${kommentar}`, an: [d.zustaendig || d.owner].filter(Boolean) });
}

export async function socialVeroeffentlicht(client, { name, url }) {
  if (!istMock(client)) return client.runDocMethod(SOCIAL, name, "als_veroeffentlicht", { url });
  await client.workflowAction(SOCIAL, name, "Veröffentlichen");
  return mockSchreibe(client, SOCIAL, name, { veroeffentlicht_url: url, veroeffentlicht_am: isoDatumZeit(jetzt(client)) });
}

export async function socialKennzahlen(client, { name, werte }) {
  const args = { reichweite: Number(werte.reichweite || 0), likes: Number(werte.likes || 0), saves: Number(werte.saves || 0), klicks: Number(werte.klicks || 0), kommentare: Number(werte.kommentare || 0) };
  if (!istMock(client)) return client.runDocMethod(SOCIAL, name, "kennzahlen_erfassen", args);
  return mockSchreibe(client, SOCIAL, name, { ...args, kennzahlen_stand: isoDatum(jetzt(client)) });
}

export async function bildFreigabePruefen(client, name) {
  if (!istMock(client)) return client.runDocMethod(SOCIAL, name, "bild_freigabe_pruefen", {});
  const d = await client.getDoc(SOCIAL, name);
  const status = d.marke_name ? "schriftlich erteilt" : "keine Marke verknüpft";
  mockSchreibe(client, SOCIAL, name, { bildfreigabe_status: status, bildfreigabe_geprueft_am: isoDatumZeit(jetzt(client)) });
  return status;
}

// ------------------------------------------------------------------------------------------------ Empfehlungen

const EMPF = "PH Empfehlung";

export async function empfehlungAnlegen(client, { empfehler_name, empfehler_email, empfehler_kontakt, empfehler_auftrag }) {
  const code = empfehlungsCode();
  return client.insert(EMPF, { name: code, code, titel: `${empfehler_name} · ${code}`, status: "Code ausgegeben", empfehler_name, empfehler_email: emailNormal(empfehler_email), empfehler_kontakt: empfehler_kontakt || "", empfehler_auftrag });
}

export async function codeSenden(client, code) {
  if (!istMock(client)) return client.runDocMethod(EMPF, code, "code_senden", {});
  return mockSchreibe(client, EMPF, code, { code_gesendet_am: isoDatumZeit(jetzt(client)) }, { kommentar: "Code gesendet" });
}

export async function empfehlungAblehnen(client, { code, grund }) {
  if (!istMock(client)) return client.runDocMethod(EMPF, code, "ablehnen", { grund });
  return mockSchreibe(client, EMPF, code, { status: "Abgelehnt", notiz: grund }, { kommentar: `Abgelehnt: ${grund}` });
}

export async function auftragZuordnen(client, { code, auftrag }) {
  const e = await client.getDoc(EMPF, code);
  if (!Number(e.einwilligung_empfohlen || 0)) throw new BackofficeError("invalid", "Ohne Zustimmung der empfohlenen Person keine Zuordnung", { detail: { feld: "auftrag" } });
  let datum = "";
  try {
    datum = (await client.getDoc("PH Auftragsbestaetigung", auftrag)).datum || "";
  } catch {
    datum = "";
  }
  const werte = { auftrag, auftrag_datum: datum, ...(e.status === "Anfrage eingegangen" || e.status === "Code ausgegeben" ? { status: "Auftrag erteilt" } : {}) };
  if (istMock(client)) return mockSchreibe(client, EMPF, code, werte, { kommentar: `Auftrag ${auftrag} zugeordnet` });
  return client.save(EMPF, { name: code, auftrag, auftrag_datum: datum });
}

/** Gutschein (D6) – nur mit Fähigkeit S7 (A8); im Mock mit Schalter durchspielbar. Code wird nie abgetippt. */
export async function gutscheinSenden(client, { code, wert_cent }) {
  if (!istMock(client)) return client.call("ph_shop.api.gutschein_aktion_anlegen", { empfehlung: code, wert_cent });
  const letzte4 = Math.random().toString(36).slice(-4).toUpperCase();
  return mockSchreibe(client, EMPF, code, { status: "Gutschein ausgegeben", gutschein_code_letzte4: letzte4, gutschein_ausgegeben_am: isoDatum(jetzt(client)) }, { kommentar: `Gutschein über ${(Number(wert_cent) / 100).toFixed(2).replace(".", ",")} € gesendet (…${letzte4})` });
}

/** AB und Lieferscheine zur Empfehlung (Prüfampeln). */
export async function auftragFakten(client, auftrag) {
  if (!auftrag) return { ab: null, lieferscheine: [] };
  let ab = null;
  try {
    ab = await client.getDoc("PH Auftragsbestaetigung", auftrag);
  } catch {
    ab = null;
  }
  let lieferscheine = [];
  try {
    lieferscheine = await client.getList("PH Lieferschein", { fields: ["name", "status", "zugestellt_am"], filters: [["auftrag", "=", auftrag]], limit: 20 });
  } catch {
    lieferscheine = [];
  }
  return { ab: ab ? { name: ab.name, status: ab.status, offen_cent: ab.offen_cent, storniert_am: ab.storniert_am, vertragsort: ab.vertragsort, kunde_name: ab.kunde_name, netto_cent: ab.netto_cent } : null, lieferscheine };
}

// ------------------------------------------------------------------------------------------------ Vorlagen, Einstellungen

export async function vorlageVorschau(client, name) {
  if (!istMock(client)) return client.runDocMethod("PH Mail Vorlage", name, "vorschau", {});
  const v = await client.getDoc("PH Mail Vorlage", name);
  return vorlageFuellen(v);
}

export async function vorlageSpeichern(client, { name, werte, modified }) {
  const erlaubt = {};
  for (const k of ["betreff", "preheader", "art", "sprache", "fusszeile", "html", "rechtsgrundlage"]) if (k in werte) erlaubt[k] = werte[k];
  return client.save("PH Mail Vorlage", { name, ...erlaubt }, { modified });
}

export async function vorlageDuplizieren(client, name) {
  const v = await client.getDoc("PH Mail Vorlage", name);
  let id = `${v.vorlage_id}_kopie`;
  for (let i = 2; client.tabelle?.("PH Mail Vorlage")?.has(id); i++) id = `${v.vorlage_id}_kopie_${i}`;
  const { name: _n, creation: _c, modified: _m, owner: _o, ...rest } = v;
  return client.insert("PH Mail Vorlage", { ...rest, name: id, vorlage_id: id, betreff: v.betreff });
}

export async function einstellungenSpeichern(client, { werte, modified }) {
  const e = await einstellungen(client);
  if (modified && e.modified && String(modified) !== String(e.modified)) throw new BackofficeError("conflict", "Die Einstellungen wurden inzwischen geändert.");
  if (istMock(client)) return mockSchreibe(client, EINST, EINST, werte);
  return client.save(EINST, { name: EINST, ...werte }, { modified: e.modified });
}

export async function schalterSetzen(client, { feld, wert, text }) {
  const neu = istMock(client) ? mockSchreibe(client, EINST, EINST, { [feld]: wert ? 1 : 0 }) : await client.setValue(EINST, EINST, feld, wert ? 1 : 0);
  await kommentieren(client, EINST, EINST, text);
  return neu;
}

export async function auftragsquellePruefen(client) {
  if (!istMock(client)) return client.call(`${BO}.check_order_source`, {});
  const e = await einstellungen(client);
  const dt = e.auftrags_doctype;
  const meta = client.index?.doctypes?.get(dt);
  if (!meta) return { ok: false, doctype: dt, felder: [], hinweis: `${dt} ist nicht installiert.` };
  const felder = Object.entries(e)
    .filter(([k, v]) => /^feld_|^positionen_tabelle$/.test(k) && v)
    .map(([k, v]) => ({ einstellung: k, feld: v, vorhanden: meta.fields.some((f) => f.fieldname === v) || ["name", "owner", "creation", "modified"].includes(v) }));
  return { ok: felder.every((f) => f.vorhanden), doctype: dt, felder };
}

// ------------------------------------------------------------------------------------------------ Allgemein

export async function kommentieren(client, doctype, name, text) {
  try {
    if (istMock(client)) return client.kommentar(doctype, name, text, "Comment");
    return await client.kommentar(doctype, name, text);
  } catch {
    return null;
  }
}

/** Social-Status für die Anzeige (Entwurf mit offener Freigabe-Aufgabe = „Wartet“). */
export async function wartendeSocial(client) {
  const todos = await freigabeAufgaben(client, { doctype: SOCIAL });
  return new Set(todos.filter((t) => !/zurückgegeben/i.test(stripHtml(t.description))).map((t) => t.reference_name));
}

export { bereitschaft };
