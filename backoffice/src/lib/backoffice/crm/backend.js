import "server-only";
// Anbindung an ph_crm / ph_microsoft mit Mock-Pfad (Bauregel: jede Server Action hat einen Mock-Pfad).
// Frappe-Modus: echte Dokumentmethoden (run_doc_method) und whitelisted API-Methoden, Signaturen exakt wie in
// Backend-Import (ph_crm/doctype/*/…py, api/kontakt.py, api/termin.py, ph_microsoft/api/__init__.py).
// Mock-Modus: bildet die Wirkung der Servermethode in der In-Memory-Datenbank nach (Status ohne Workflow-Prüfung,
// wie es ph_crm über `status_setzen` selbst tut), damit Vorführung und E2E dieselben Abläufe zeigen.

import { BackofficeError } from "../frappe/errors.js";
import { isoDatum, isoDatumZeit } from "../format.js";
import { beispielMails, normalisiereAdresse } from "./mails.js";

export const istMock = (client) => client?.modus !== "frappe";

const G = globalThis;
/** Mock-Zustand der Live-Liste (nichts davon ist ein DocType – ph_microsoft speichert unzugeordnete Mails nie). */
function mailZustand() {
  if (!G.__phBoCrmMails) G.__phBoCrmMails = { erledigt: new Set(), gesperrt: new Set() };
  return G.__phBoCrmMails;
}

/** Mock: Datensatz direkt ändern wie ph_crm `status_setzen` / `db_set` (inkl. Version und Kommentar). */
async function mockSetzen(client, doctype, name, werte, kommentar) {
  const t = client.tabelle(doctype);
  const alt = t.get(name);
  if (!alt) throw new BackofficeError("not_found", "Den Datensatz gibt es nicht mehr.");
  const meta = client.meta(doctype);
  client.pruefe(meta, "write");
  const neu = { ...alt, ...werte };
  if ("status" in werte) neu.workflow_state = `PH ${werte.status}`;
  client.stempel(neu);
  t.set(name, neu);
  client.version(doctype, name, alt, neu);
  if (kommentar) client.kommentar(doctype, name, kommentar, "Info");
  return neu;
}

async function mockAufgabe(client, werte) {
  return client.insert("PH Aufgabe", { status: "Offen", prioritaet: "Normal", quelle: "manuell", zugewiesen_an: client.session.user, ...werte });
}

/** Mock: erste aktive Terminart (PH Termin verlangt eine). */
function ersteTerminart(client) {
  return [...client.tabelle("PH Terminart").values()][0]?.name || "";
}

/** Mock: Kontakt für einen Termin ohne Kontakt anlegen (wie PH Termin.kontakt_anlegen). */
async function mockKontaktFuerTermin(client, doc) {
  if (doc.kontakt) return doc.kontakt;
  const k = await client.insert("PH Kontakt", { kontaktart: "Privat", status: "Interessent", vorname: doc.vorname || "", nachname: doc.nachname || "Unbekannt", email: doc.email || "", telefon: doc.telefon || "", sprache: doc.sprache || "de", quelle: "showroom" });
  await mockSetzen(client, "PH Termin", doc.name, { kontakt: k.name });
  return k.name;
}

const plus = (start, min) => {
  const d = new Date(String(start).replace(" ", "T"));
  return isoDatumZeit(new Date(d.getTime() + Number(min || 60) * 60000));
};

// ------------------------------------------------------------ Mock-Methoden --

const MOCK = {
  "PH Anfrage": {
    async kontakt_anlegen(client, doc) {
      if (doc.kontakt) return doc.kontakt;
      const [plz, ...ort] = String(doc.plz_ort || "").split(" ");
      const k = await client.insert("PH Kontakt", { kontaktart: doc.firma ? "Geschaeft" : "Privat", status: "Interessent", anrede: doc.anrede, vorname: doc.vorname, nachname: doc.nachname || doc.firma || "Unbekannt", firma: doc.firma, email: doc.email, telefon: doc.telefon, plz: /^\d/.test(plz) ? plz : "", ort: ort.join(" "), sprache: doc.sprache || "de", quelle: doc.quelle || "website" });
      await mockSetzen(client, "PH Anfrage", doc.name, { kontakt: k.name }, `Kontakt ${k.name} verknüpft`);
      return k.name;
    },
    async termin_vorschlagen(client, doc, a) {
      const t = await client.insert("PH Termin", {
        terminart: a.terminart || ersteTerminart(client), anfrage: doc.name, kontakt: doc.kontakt || "", anrede: doc.anrede, vorname: doc.vorname, nachname: doc.nachname, email: doc.email, telefon: doc.telefon, plz_ort: doc.plz_ort, sprache: doc.sprache || "de",
        start: a.start, ende: plus(a.start, a.dauer_min), dauer_min: Number(a.dauer_min || 60), modus: a.modus || "Showroom", quelle: "backoffice", kundenmail: "backoffice", status: "Bestaetigt", email_verifiziert: 1, berater: a.berater || doc.zugewiesen_an || client.session.user, thema: a.thema || "",
        titel: `${a.thema || "Beratung"} ${[doc.vorname, doc.nachname].filter(Boolean).join(" ")} (${a.modus || "Showroom"})`,
      });
      const werte = { folgedokument_doctype: "PH Termin", folgedokument: t.name };
      if (["Neu", "Qualifiziert"].includes(doc.status)) Object.assign(werte, { status: "Termin vereinbart", erstreaktion_am: doc.erstreaktion_am || isoDatumZeit(client.jetzt()) });
      await mockSetzen(client, "PH Anfrage", doc.name, werte, `Termin ${t.name} angelegt${Number(a.mail) && doc.email ? " · Bestätigungsmail (Testdaten, nicht versendet)" : ""}`);
      return t.name;
    },
    async als_verloren(client, doc, a) {
      if (!["Neu", "Qualifiziert", "Termin vereinbart", "Angebot"].includes(doc.status)) throw new BackofficeError("invalid", "Nur offene Anfragen können als verloren markiert werden.");
      if (!a.grund) throw new BackofficeError("invalid", "Bitte einen Verlustgrund wählen.");
      await mockSetzen(client, "PH Anfrage", doc.name, { status: "Verloren", verloren_grund: a.grund, verloren_details: a.details || "", mitbewerber: a.mitbewerber || "", verloren_am: isoDatumZeit(client.jetzt()), wahrscheinlichkeit_prozent: 0, gewichtet_cent: 0 }, `Verloren: ${a.grund}`);
      return "Verloren";
    },
    async als_gewonnen(client, doc, a) {
      const wert = a.wert_cent != null && a.wert_cent !== "" ? Number(a.wert_cent) : Number(doc.wert_cent || 0);
      await mockSetzen(client, "PH Anfrage", doc.name, { status: "Gewonnen", gewonnen_am: isoDatumZeit(client.jetzt()), wert_cent: wert, wahrscheinlichkeit_prozent: 100, gewichtet_cent: wert }, "Gewonnen");
      return "Gewonnen";
    },
    async als_spam(client, doc) {
      await mockSetzen(client, "PH Anfrage", doc.name, { status: "Spam", verloren_grund: "" }, "Als Spam markiert");
      return "Spam";
    },
    async aufgabe_anlegen(client, doc, a) {
      const k = await mockAufgabe(client, { titel: String(a.titel || `Anfrage ${doc.name} nachfassen`).slice(0, 140), faellig: a.faellig || isoDatum(new Date(client.jetzt().getTime() + 2 * 86400000)), zugewiesen_an: doc.zugewiesen_an || client.session.user, referenz_doctype: "PH Anfrage", referenz_name: doc.name, kontakt: doc.kontakt || "" });
      return k.name;
    },
  },
  "PH Termin": {
    async bestaetigen(client, doc, a) {
      if (doc.status !== "Unbestaetigt") throw new BackofficeError("invalid", "Nur unbestätigte Termine können bestätigt werden.");
      await mockSetzen(client, "PH Termin", doc.name, { status: "Bestaetigt", bestaetigt_am: isoDatumZeit(client.jetzt()) }, Number(a.mail ?? 1) && doc.email ? "Bestätigt · Mail (Testdaten, nicht versendet)" : "Bestätigt");
      return "Bestaetigt";
    },
    async absagen(client, doc, a) {
      const status = Number(a.abgelehnt) ? "Abgelehnt" : "Storniert";
      await mockSetzen(client, "PH Termin", doc.name, { status, storno_grund: a.grund || "" }, `${status}: ${a.grund || ""}`.trim());
      return status;
    },
    async umbuchen(client, doc, a) {
      const kollision = [...client.tabelle("PH Termin").values()].find((t) => t.name !== doc.name && ["Unbestaetigt", "Bestaetigt"].includes(t.status) && t.start === a.neuer_start && (t.berater || "") === (a.berater || doc.berater || ""));
      if (kollision) throw new BackofficeError("conflict", "Diese Zeit ist schon belegt.");
      await mockSetzen(client, "PH Termin", doc.name, { start: a.neuer_start, ende: plus(a.neuer_start, doc.dauer_min), berater: a.berater || doc.berater }, `Verschoben auf ${a.neuer_start}`);
      return doc.name;
    },
    async meet_link_erzeugen(client, doc) {
      const url = `https://meet.beispiel.invalid/${doc.name.toLowerCase()}`;
      await mockSetzen(client, "PH Termin", doc.name, { meet_url: url }, "Videoraum erzeugt (Testdaten)");
      return url;
    },
    async erledigt_mit_protokoll(client, doc, a) {
      if (doc.status !== "Bestaetigt") throw new BackofficeError("invalid", "Nur bestätigte Termine können erledigt werden.");
      await mockSetzen(client, "PH Termin", doc.name, { status: "Erledigt", erledigt_am: isoDatumZeit(client.jetzt()) }, "Termin erledigt");
      if (!Number(a.protokoll ?? 1)) return null;
      const kontakt = await mockKontaktFuerTermin(client, doc);
      const bg = await client.insert("PH Beratungsgespraech", { kontakt, termin: doc.name, datum: String(doc.start || "").slice(0, 10) || isoDatum(client.jetzt()), berater: doc.berater || client.session.user, status: "Offen", ort: doc.modus || "Showroom", dauer_min: doc.dauer_min || 60, raeume: [], fragen: [] });
      await mockSetzen(client, "PH Termin", doc.name, { beratungsgespraech: bg.name });
      return bg.name;
    },
    async nicht_erschienen(client, doc, a) {
      if (doc.status !== "Bestaetigt") throw new BackofficeError("invalid", "Nur bestätigte Termine können als „Nicht erschienen“ markiert werden.");
      await mockSetzen(client, "PH Termin", doc.name, { status: "Nicht erschienen", storno_grund: a.grund || "nicht erschienen" }, "Kunde nicht erschienen");
      await mockAufgabe(client, { titel: `Anrufen, neuen Termin anbieten (${[doc.vorname, doc.nachname].filter(Boolean).join(" ")})`, faellig: isoDatum(new Date(client.jetzt().getTime() + 86400000)), zugewiesen_an: doc.berater || client.session.user, referenz_doctype: "PH Termin", referenz_name: doc.name, kontakt: doc.kontakt || "", quelle: "scheduler" });
      return "Nicht erschienen";
    },
    async wieder_bestaetigen(client, doc, a) {
      await mockSetzen(client, "PH Termin", doc.name, { status: "Bestaetigt" }, `Wieder bestätigt${a.grund ? `: ${a.grund}` : ""}`);
      return "Bestaetigt";
    },
  },
  "PH Kontakt": {
    async als_kunde_markieren(client, doc, a) {
      await mockSetzen(client, "PH Kontakt", doc.name, { status: "Kunde", kunde_seit: doc.kunde_seit || isoDatum(client.jetzt()) }, `Als Kunde markiert${a.grund ? `: ${a.grund}` : ""}`);
      return "Kunde";
    },
    async widerspruch_erfassen(client, doc, a) {
      await mockSetzen(client, "PH Kontakt", doc.name, { nicht_kontaktieren: 1, widerspruchshinweis_am: isoDatum(client.jetzt()), widerspruchshinweis_quelle: a.quelle || "" }, `Widerspruch erfasst (${a.quelle || "ohne Quelle"})`);
      return true;
    },
    async mail_senden(client, doc, a) {
      client.kommentar("PH Kontakt", doc.name, `E-Mail an ${a.an || doc.email} „${a.betreff}“ (Testdaten, nicht versendet)`, "Info");
      await mockSetzen(client, "PH Kontakt", doc.name, { letzter_kontakt: isoDatumZeit(client.jetzt()), letzter_kontakt_art: "E-Mail" });
      return { ok: true, testmodus: true };
    },
  },
  "PH Beratungsgespraech": {
    async status_setzen(client, doc, a) {
      if (a.status === "Abgeschlossen" && !(doc.raeume || []).length && !String(doc.zusammenfassung || "").trim()) throw new BackofficeError("invalid", "Bitte eine Zusammenfassung schreiben oder einen Raum anlegen.");
      await mockSetzen(client, "PH Beratungsgespraech", doc.name, { status: a.status, ...(a.status === "Abgeschlossen" ? { abgeschlossen_am: isoDatumZeit(client.jetzt()) } : {}) }, `Status: ${a.status}`);
      return a.status;
    },
    async aufgabe_anlegen(client, doc) {
      if (!doc.naechster_schritt) return null;
      const offen = [...client.tabelle("PH Aufgabe").values()].find((k) => k.referenz_doctype === "PH Beratungsgespraech" && k.referenz_name === doc.name && ["Offen", "In Arbeit"].includes(k.status));
      if (offen) {
        await client.setValue("PH Aufgabe", offen.name, { titel: String(doc.naechster_schritt).slice(0, 140), faellig: doc.naechster_schritt_bis || offen.faellig });
        return offen.name;
      }
      const k = await mockAufgabe(client, { titel: String(doc.naechster_schritt).slice(0, 140), faellig: doc.naechster_schritt_bis || isoDatum(client.jetzt()), zugewiesen_an: doc.berater || client.session.user, referenz_doctype: "PH Beratungsgespraech", referenz_name: doc.name, kontakt: doc.kontakt || "" });
      return k.name;
    },
    async planung_beauftragen(client, doc, a) {
      await mockSetzen(client, "PH Beratungsgespraech", doc.name, { status: "Planung beauftragt" }, `Planung beauftragt${a.planer ? ` · Planer ${a.planer}` : ""}`);
      return null;
    },
    async vorlage_anwenden(client, doc, a) {
      await mockSetzen(client, "PH Beratungsgespraech", doc.name, { vorlage: a.vorlage || "" }, "Vorlage angewendet");
      return 0;
    },
  },
  "PH Datenschutzanfrage": {
    async bearbeiten(client, doc) {
      await mockSetzen(client, "PH Datenschutzanfrage", doc.name, { status: "In Arbeit", zugewiesen_an: doc.zugewiesen_an || client.session.user }, "In Bearbeitung");
      return "In Arbeit";
    },
    async abschliessen(client, doc, a) {
      if (["Loeschung", "Auskunft"].includes(doc.art) && !Number(doc.identitaet_geprueft)) throw new BackofficeError("invalid", "Bitte zuerst die Identität prüfen.");
      await mockSetzen(client, "PH Datenschutzanfrage", doc.name, { status: "Erledigt", ergebnis: a.ergebnis || "", erledigt_am: isoDatumZeit(client.jetzt()), erledigt_von: client.session.user }, "Abgeschlossen");
      return "Erledigt";
    },
    async ablehnen(client, doc, a) {
      if (!a.grund) throw new BackofficeError("invalid", "Bitte einen Grund angeben.");
      await mockSetzen(client, "PH Datenschutzanfrage", doc.name, { status: "Abgelehnt", ergebnis: a.grund }, `Abgelehnt: ${a.grund}`);
      return "Abgelehnt";
    },
  },
};

/** Alle Dokumentmethoden, die der Mock nachbildet (Unit-Test gleicht mit Backend-Import ab). */
export const MOCK_DOKUMENTMETHODEN = Object.fromEntries(Object.entries(MOCK).map(([dt, m]) => [dt, Object.keys(m)]));

/**
 * Dokumentmethode ausführen (Frappe: run_doc_method; Mock: nachgebildete Wirkung).
 * @returns {Promise<any>} Rückgabewert der Methode
 */
export async function docMethode(client, doctype, name, methode, args = {}) {
  if (!istMock(client)) return client.runDocMethod(doctype, name, methode, args);
  const fn = MOCK[doctype]?.[methode];
  if (!fn) return client.runDocMethod(doctype, name, methode, args);
  const doc = await client.getDoc(doctype, name);
  return fn(client, doc, args || {});
}

/** Dubletten-Prüfung (`ph_crm.api.kontakt.find_duplicates`). Mock: gleiche E-Mail/Telefon/Nachname+PLZ. */
export async function findeDubletten(client, { email, telefon, nachname, plz } = {}) {
  if (!istMock(client)) {
    const r = await client.call("ph_crm.api.kontakt.find_duplicates", { email, telefon, nachname, plz, limit: 5 });
    return (Array.isArray(r) ? r : r?.kandidaten || []).map((k) => ({ name: k.name || k.kontakt, titel: k.titel || k.name, grund: Array.isArray(k.gruende) ? k.gruende.join(", ") : k.grund || "", einstufung: k.einstufung || "" }));
  }
  const e = normalisiereAdresse(email);
  const tel = String(telefon || "").replace(/\D/g, "");
  const treffer = [];
  for (const k of client.tabelle("PH Kontakt").values()) {
    const gruende = [];
    if (e && normalisiereAdresse(k.email) === e) gruende.push("gleiche E-Mail");
    if (tel.length > 5 && String(k.telefon || "").replace(/\D/g, "").endsWith(tel.slice(-7))) gruende.push("gleiche Telefonnummer");
    if (nachname && plz && k.nachname === nachname && String(k.plz || "") === String(plz)) gruende.push("gleicher Name und PLZ");
    if (gruende.length) treffer.push({ name: k.name, titel: k.titel || k.name, grund: gruende.join(", "), einstufung: gruende.length > 1 ? "sicher" : "wahrscheinlich" });
  }
  return treffer.slice(0, 5);
}

/** `ph_crm.api.kontakt.create_kontakt(...)` → {name} oder {bestehend:[…]}. */
export async function kontaktAnlegen(client, w) {
  if (!istMock(client)) return client.call("ph_crm.api.kontakt.create_kontakt", { ...w, quelle: w.quelle || "showroom" });
  if (!Number(w.trotzdem)) {
    const d = await findeDubletten(client, { email: w.email, telefon: w.telefon, nachname: w.nachname, plz: w.plz });
    if (d.length) return { bestehend: d };
  }
  const k = await client.insert("PH Kontakt", { kontaktart: w.kontaktart || (w.firma ? "Geschaeft" : "Privat"), status: "Interessent", anrede: w.anrede || "", vorname: w.vorname || "", nachname: w.nachname, firma: w.firma || "", email: w.email || "", telefon: w.telefon || "", strasse: w.strasse || "", plz: w.plz || "", ort: w.ort || "", sprache: w.sprache || "de", quelle: w.quelle || "showroom", berater: w.berater || client.session.user });
  return { name: k.name };
}

/** Freie Zeiten (`ph_crm.api.termin.get_freie_slots`). Mock: Raster 9–17 Uhr, belegt = aktive Termine. */
export async function freieSlots(client, { terminart, modus, von, bis, berater, ausser } = {}) {
  if (!istMock(client)) {
    const r = await client.call("ph_crm.api.termin.get_freie_slots", { terminart, modus, von, bis, berater, ausser });
    return Array.isArray(r) ? r : r?.slots || [];
  }
  const belegt = new Set([...client.tabelle("PH Termin").values()].filter((t) => t.name !== ausser && ["Unbestaetigt", "Bestaetigt"].includes(t.status) && (!berater || t.berater === berater)).map((t) => String(t.start).slice(0, 16)));
  const out = [];
  const start = new Date(`${von}T00:00:00`);
  const ende = new Date(`${bis}T00:00:00`);
  for (let d = new Date(start); d <= ende; d.setDate(d.getDate() + 1)) {
    if (d.getDay() === 0) continue;
    const zeiten = d.getDay() === 6 ? [9, 10.5, 12] : [9, 10.5, 13, 14.5, 16];
    for (const z of zeiten) {
      const s = new Date(d);
      s.setHours(Math.floor(z), (z % 1) * 60, 0, 0);
      const iso = isoDatumZeit(s);
      if (belegt.has(iso.slice(0, 16))) continue;
      out.push({ start: iso, berater: berater || "" });
    }
  }
  return out;
}

// ------------------------------------------------------------- E-Mails --

/** Live-Liste nicht zugeordneter Mails (`ph_microsoft.api.mails_unzugeordnet`). */
export async function mailsUnzugeordnet(client, { postfach, tage = 14 } = {}) {
  if (!istMock(client)) return client.call("ph_microsoft.api.mails_unzugeordnet", { postfach, tage });
  const z = mailZustand();
  const kontakte = [...client.tabelle("PH Kontakt").values()].slice(0, 8);
  const postfaecher = [...client.tabelle("PH Postfach").values()].map((p) => p.adresse || p.name).filter(Boolean);
  return beispielMails({ kontakte, postfaecher: postfaecher.length ? postfaecher : undefined, jetzt: client.jetzt() })
    .filter((m) => !z.erledigt.has(m.message_id) && !z.gesperrt.has(normalisiereAdresse(m.gegenadresse)))
    .filter((m) => !postfach || m.postfach === postfach);
}

/** `mail_zuordnen(message_id, postfach, bezug_doctype, bezug_name, adresse_merken)`. */
export async function mailZuordnen(client, { message_id, postfach, bezug_doctype, bezug_name, adresse_merken = 0, adresse, betreff }) {
  if (!istMock(client)) return client.call("ph_microsoft.api.mail_zuordnen", { message_id, postfach, bezug_doctype, bezug_name, adresse_merken: Number(adresse_merken) ? 1 : 0 });
  await client.getDoc(bezug_doctype, bezug_name);
  mailZustand().erledigt.add(message_id);
  client.kommentar(bezug_doctype, bezug_name, `E-Mail „${betreff || "ohne Betreff"}“ zugeordnet (Testdaten)`, "Info");
  let gemerkt = false;
  if (Number(adresse_merken) && adresse && bezug_doctype === "PH Kontakt") {
    await client.insert("PH Mail Adresse", { adresse: normalisiereAdresse(adresse), art: "Zuordnung", kontakt_doctype: "PH Kontakt", kontakt_name: bezug_name, notiz: "Aus manueller Zuordnung" }).then(() => (gemerkt = true), () => (gemerkt = false));
  }
  return { communication: `mock-comm-${message_id}`, bezug_doctype, bezug_name, adresse_gemerkt: gemerkt };
}

/** `adresse_sperren(adresse, notiz)`. */
export async function adresseSperren(client, { adresse, notiz }) {
  if (!istMock(client)) return client.call("ph_microsoft.api.adresse_sperren", { adresse, notiz });
  const a = normalisiereAdresse(adresse);
  mailZustand().gesperrt.add(a);
  await client.insert("PH Mail Adresse", { adresse: a, art: "Sperre", notiz: notiz || "" }).catch(() => null);
  return { ok: true, adresse: a };
}

/** `kontakt_aus_mail(message_id, postfach)` → {kontakt, communication}; 409 mit Vorschlägen, wenn bekannt. */
export async function kontaktAusMail(client, { message_id, postfach, adresse, name }) {
  if (!istMock(client)) return client.call("ph_microsoft.api.kontakt_aus_mail", { message_id, postfach });
  const a = normalisiereAdresse(adresse);
  const bekannt = [...client.tabelle("PH Kontakt").values()].filter((k) => normalisiereAdresse(k.email) === a);
  if (bekannt.length) throw new BackofficeError("conflict", "Diese Adresse ist schon bekannt.", { detail: { vorschlaege: bekannt.map((k) => ({ doctype: "PH Kontakt", name: k.name, titel: k.titel })) } });
  const teile = String(name || "").trim().split(/\s+/);
  const nachname = teile.length > 1 ? teile.pop() : teile[0] || a.split("@")[0];
  const k = await client.insert("PH Kontakt", { kontaktart: "Privat", status: "Interessent", vorname: teile.join(" "), nachname, email: a, quelle: "email", sprache: "de" });
  mailZustand().erledigt.add(message_id);
  client.kommentar("PH Kontakt", k.name, "Aus E-Mail angelegt, Mail zugeordnet (Testdaten)", "Info");
  return { kontakt: k.name, communication: `mock-comm-${message_id}` };
}

/** `mail_senden(an, betreff, html, bezug_doctype, bezug_name)` aus dem eigenen Postfach. */
export async function mailSenden(client, { an, betreff, html, bezug_doctype, bezug_name }) {
  if (!istMock(client)) return client.call("ph_microsoft.api.mail_senden", { an, betreff, html, bezug_doctype, bezug_name });
  if (bezug_doctype && bezug_name) client.kommentar(bezug_doctype, bezug_name, `E-Mail an ${an} „${betreff}“ (Testdaten, nicht versendet)`, "Info");
  if (bezug_doctype === "PH Kontakt") await mockSetzen(client, "PH Kontakt", bezug_name, { letzter_kontakt: isoDatumZeit(client.jetzt()), letzter_kontakt_art: "E-Mail" }).catch(() => null);
  return { ok: true, communication: null, testmodus: true };
}

/** Testhilfe: Mock-Zustand der Mails zurücksetzen. */
export function mailZustandZuruecksetzen() {
  G.__phBoCrmMails = { erledigt: new Set(), gesperrt: new Set() };
}
