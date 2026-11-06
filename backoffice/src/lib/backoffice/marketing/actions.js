"use server";
// Bereich Marketing – Server Actions (10-konzept-marketing § 13.4, MASTER Q-A2). Jede Action prüft Sitzung,
// DocType-Recht und Rolle erneut, validiert die Eingaben und gibt { ok, … } bzw. { ok:false, code, message, fehler? }
// zurück – sie wirft nie. Rückholbare Außenwirkung wird als verzögerter Commit geplant (planeCommit →
// commit/aktionen/marketing.js); Endgültiges (Abmelden, Widerruf, Einwilligung, Versand, Geld) läuft nach dem
// Bestätigen-Dialog sofort. Mock-Pfad über methoden.js. Rechtsregeln, die das Backend noch nicht erzwingt
// (Testmail nur intern, Sperrtage, Bestätigungsmail-Filter, nie Einwilligung ohne Beleg), prüft diese Datei.

import { revalidatePath } from "next/cache";
import { getSession } from "../auth/dal.js";
import { darfDoc } from "../auth/rechte.js";
import { backoffice, ladeMeta } from "../frappe/index.js";
import { istBackofficeError } from "../frappe/errors.js";
import { planeCommit } from "../commit/server.js";
import { faehigkeit } from "../faehigkeiten.js";
import { mockUeberschreibung } from "../../../components/Backoffice/Faehigkeit.js";
import * as M from "./methoden.js";
import { MARKETING, S } from "./faehigkeiten.js";
import { istLeitung, istMarketing } from "./rollen.js";
import { adresseIntern } from "./intern.js";
import { mockNachzug, fensterAus } from "./daten.js";
import { anmeldungPruefen, emailGueltig, emailNormal, keineWerbungPlan, kennzahlenCsvLesen, loeschenErlaubt, monatAusSlug, naechsteKennung, pruefeVersandtermin, reiseBrauchtNeueFreigabe, segmentSatz, tagMonatSchluessel, versandbereit, bereitschaftPunkte, socialPruefungen, formatErlaubt } from "./regeln.js";
import { ALLG, KEINE_WERBUNG, TESTMAIL, ZWECKE, ZWECKE_MIT_BESTAETIGUNG, KAMPAGNE_KANAL, SOCIAL_KANAELE, EVENT_ART, ZIEL_KENNZAHL, KRITERIEN_LEITUNG } from "./texte.js";
import { euroZuCent } from "../format.js";

function fehler(err) {
  if (istBackofficeError(err)) return { ok: false, code: err.code, message: err.message, detail: err.detail ?? null };
  console.error("[marketing] Aktion fehlgeschlagen", err?.name || err, process.env.NODE_ENV !== "production" ? String(err?.stack || err?.message || "").split("\n").slice(0, 4).join(" | ") : "");
  return { ok: false, code: "unavailable", message: ALLG.unerwartet };
}

/** Sitzung + Recht am DocType; → { session, client, leitung } oder { fehler }. */
async function zugang(doctype, aktion = "write", { nurLeitung = false } = {}) {
  const session = await getSession();
  if (!session) return { fehler: { ok: false, code: "auth", message: "Bitte neu anmelden." } };
  const client = backoffice(session);
  mockNachzug(client);
  try {
    const meta = await ladeMeta(client, doctype);
    if (!darfDoc(session, meta, aktion)) return { fehler: { ok: false, code: "forbidden", message: ALLG.keinRecht } };
  } catch (err) {
    return { fehler: fehler(err) };
  }
  if (nurLeitung && !istLeitung(session)) return { fehler: { ok: false, code: "forbidden", message: ALLG.nurLeitung } };
  return { session, client, leitung: istLeitung(session), team: istMarketing(session) };
}

async function kann(z, id) {
  const s = await faehigkeit(z.session, id, { katalog: MARKETING, client: z.client, ueberschreibung: await mockUeberschreibung() });
  return s.an;
}

const txt = (v, max = 500) => String(v ?? "").trim().slice(0, max);
const ISO_TAG = /^\d{4}-\d{2}-\d{2}$/;
const ISO_ZEIT = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/;
const ganz = (v, min = 0) => (Number.isInteger(Number(v)) && Number(v) >= min ? Number(v) : NaN);
const invalid = (fehlerFelder, message = ALLG.ungueltig) => ({ ok: false, code: "invalid", message, fehler: fehlerFelder });

function plan(session, action, args, objekt, titel, schluessel) {
  return planeCommit(session, { action, args, objekt, titel, schluessel });
}

function pfade(...p) {
  for (const x of p) revalidatePath(x);
}

// ================================================================================================ Newsletter

export async function ausgabeAnlegenAction({ art = "struktur" } = {}) {
  const z = await zugang("PH Newsletter Ausgabe", "create");
  if (z.fehler) return z.fehler;
  if (!["struktur", "leer", "kopie"].includes(art)) return invalid({}, ALLG.ungueltig);
  try {
    const alle = await z.client.getList("PH Newsletter Ausgabe", { fields: ["name", "slug"], orderBy: "slug desc", limit: 500 });
    const slug = naechsteKennung(alle.map((a) => a.slug), new Date());
    const letzteName = alle.find((a) => /^\d{4}-\d{2}$/.test(a.slug))?.name;
    const letzte = letzteName ? await z.client.getDoc("PH Newsletter Ausgabe", letzteName).catch(() => null) : null;
    const doc = await M.ausgabeAnlegen(z.client, { slug, art, letzte });
    pfade("/marketing/newsletter", "/marketing");
    return { ok: true, name: doc.name, slug, monat: monatAusSlug(slug) };
  } catch (err) {
    return fehler(err);
  }
}

/** Undo von „Neue Ausgabe“ (sofort + Gegenaktion, weil nichts nach außen geht). */
export async function ausgabeVerwerfenAction({ name }) {
  const z = await zugang("PH Newsletter Ausgabe", "delete");
  if (z.fehler) return z.fehler;
  try {
    await M.ausgabeLoeschen(z.client, txt(name, 140));
    pfade("/marketing/newsletter");
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

export async function ausgabeSpeichernAction({ name, modified, felder = {}, bloecke }) {
  const z = await zugang("PH Newsletter Ausgabe", "write");
  if (z.fehler) return z.fehler;
  if (felder.versand_geplant && !ISO_ZEIT.test(felder.versand_geplant)) return invalid({ versand_geplant: "Datum und Uhrzeit wählen" });
  if (felder.versand_geplant) {
    const e = await M.einstellungen(z.client);
    const p = pruefeVersandtermin(felder.versand_geplant, fensterAus(e));
    if (p.gesperrt) return invalid({ versand_geplant: p.grund }, p.grund);
  }
  if (felder.zielgruppe === "Segment" && !felder.segment) return invalid({ segment: "Zielgruppe wählen" });
  if (Array.isArray(bloecke) && bloecke.length > 30) return invalid({}, "Höchstens 30 Blöcke.");
  try {
    const { doc, zurueck } = await M.ausgabeSpeichern(z.client, { name: txt(name, 140), modified, felder, bloecke });
    revalidatePath("/marketing/newsletter");
    return { ok: true, modified: doc.modified, versandbereit: !!Number(doc.versandbereit), offene_slots: doc.offene_slots || "", status: doc.status, zurueck, bloecke: doc.bloecke };
  } catch (err) {
    const r = fehler(err);
    if (r.code === "conflict") {
      const serverstand = await z.client.getDoc("PH Newsletter Ausgabe", txt(name, 140)).catch(() => null);
      return { ...r, serverstand };
    }
    return r;
  }
}

export async function ausgabeVorschauAction({ name, dunkel = false }) {
  const z = await zugang("PH Newsletter Ausgabe", "read");
  if (z.fehler) return z.fehler;
  try {
    const r = await M.ausgabeVorschau(z.client, txt(name, 140), { dunkel: !!dunkel });
    return { ok: true, betreff: r.betreff, html: r.html, empfaenger: r.empfaenger ?? null, zeit: new Date().toISOString() };
  } catch (err) {
    return fehler(err);
  }
}

/** Testmail (D7) – nur interne Adressen (U19/P0-11; die Action prüft, bis der Server es tut). */
export async function testmailAction({ doctype, name, empfaenger }) {
  const erlaubt = ["PH Newsletter Ausgabe", "PH Kundenreise", "PH Mail Vorlage"];
  if (!erlaubt.includes(doctype)) return invalid({}, ALLG.ungueltig);
  const z = await zugang(doctype, "write");
  if (z.fehler) return z.fehler;
  const e = emailNormal(empfaenger);
  if (!emailGueltig(e)) return invalid({ empfaenger: "E-Mail-Adresse prüfen" });
  const einst = await M.einstellungen(z.client);
  if (!adresseIntern(e, einst, { benutzer: [z.session.user] })) return invalid({ empfaenger: TESTMAIL.nurIntern }, TESTMAIL.nurIntern);
  try {
    await M.testmail(z.client, { doctype, name: txt(name, 140), empfaenger: e });
    return { ok: true, empfaenger: e, zeit: new Date().toISOString() };
  } catch (err) {
    const r = fehler(err);
    return r.code === "unavailable" ? { ...r, message: TESTMAIL.fehler } : r;
  }
}

/** „Zur Freigabe“ (Mitarbeiter) – verzögerter Commit; nur wenn bereit. */
export async function ausgabeZurFreigabeAction({ name }) {
  const z = await zugang("PH Newsletter Ausgabe", "write");
  if (z.fehler) return z.fehler;
  try {
    const d = await z.client.getDoc("PH Newsletter Ausgabe", txt(name, 140));
    if (d.status !== "Entwurf") return invalid({}, "Nur ein Entwurf kann zur Freigabe gegeben werden.");
    if (!versandbereit(d.bloecke || [])) return invalid({}, "Noch nicht bereit.");
    const r = await plan(z.session, "marketing.ausgabe-zur-freigabe", { name: d.name }, { doctype: "PH Newsletter Ausgabe", name: d.name, titel: monatAusSlug(d.slug) }, `Zur Freigabe ${monatAusSlug(d.slug)}`, `nl-freigabe:${d.name}`);
    return { ok: true, ...r, monat: monatAusSlug(d.slug) };
  } catch (err) {
    return fehler(err);
  }
}

/** „Freigeben“ bzw. „Freigeben und planen“ (Leitung, D1) – Sperrtag gesperrt, Vorschau Pflicht; verzögerter Commit. */
export async function ausgabeFreigebenAction({ name, versand_geplant, vorschauOk = true }) {
  const z = await zugang("PH Newsletter Ausgabe", "write", { nurLeitung: true });
  if (z.fehler) return z.fehler;
  if (!vorschauOk) return invalid({}, "Ohne Vorschau keine Freigabe");
  if (!ISO_ZEIT.test(versand_geplant || "")) return invalid({ versand_geplant: "Datum und Uhrzeit wählen" });
  try {
    const e = await M.einstellungen(z.client);
    const p = pruefeVersandtermin(versand_geplant, { ...fensterAus(e), jetzt: new Date() });
    if (p.gesperrt) return invalid({ versand_geplant: p.grund }, p.grund);
    const d = await z.client.getDoc("PH Newsletter Ausgabe", txt(name, 140));
    if (!["Entwurf", "Freigabe"].includes(d.status)) return invalid({}, "Diese Ausgabe ist schon freigegeben.");
    if (!versandbereit(d.bloecke || [])) return invalid({}, "Noch nicht bereit.");
    const r = await plan(z.session, "marketing.ausgabe-freigeben", { name: d.name, versand_geplant: versand_geplant.length === 16 ? `${versand_geplant}:00` : versand_geplant }, { doctype: "PH Newsletter Ausgabe", name: d.name, titel: monatAusSlug(d.slug) }, `Freigeben ${monatAusSlug(d.slug)}`, `nl-freigeben:${d.name}`);
    return { ok: true, ...r, monat: monatAusSlug(d.slug) };
  } catch (err) {
    return fehler(err);
  }
}

export async function zurueckgebenAction({ doctype, name, kommentar }) {
  if (!["PH Newsletter Ausgabe", "PH Social Beitrag"].includes(doctype)) return invalid({}, ALLG.ungueltig);
  const z = await zugang(doctype, "write");
  if (z.fehler) return z.fehler;
  const k = txt(kommentar, 500);
  if (k.length < 3) return invalid({ kommentar: "Bitte kurz sagen, was geändert werden soll." });
  try {
    if (doctype === "PH Newsletter Ausgabe") {
      const d = await z.client.getDoc(doctype, txt(name, 140));
      if (d.status === "Geplant" && !z.leitung) return { ok: false, code: "forbidden", message: ALLG.nurLeitung };
      await M.ausgabeZurueck(z.client, { name: d.name, kommentar: k });
      await M.freigabeAufgabenSchliessen(z.client, { doctype, name: d.name });
      await M.freigabeAufgabeAnlegen(z.client, { doctype, name: d.name, beschreibung: `Ausgabe ${monatAusSlug(d.slug)} zurückgegeben: ${k}`, an: [d.owner].filter(Boolean) });
    } else {
      if (!z.leitung) return { ok: false, code: "forbidden", message: ALLG.nurLeitung };
      await M.socialZurueckgeben(z.client, { name: txt(name, 140), kommentar: k });
    }
    pfade("/marketing", doctype === "PH Social Beitrag" ? "/marketing/social" : "/marketing/newsletter");
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

export async function ausgabeZurueckAufEntwurfAction({ name }) {
  const z = await zugang("PH Newsletter Ausgabe", "write");
  if (z.fehler) return z.fehler;
  try {
    const d = await z.client.getDoc("PH Newsletter Ausgabe", txt(name, 140));
    if (d.status === "Geplant" && !z.leitung) return { ok: false, code: "forbidden", message: ALLG.nurLeitung };
    await M.ausgabeZurueck(z.client, { name: d.name });
    await M.freigabeAufgabenSchliessen(z.client, { doctype: "PH Newsletter Ausgabe", name: d.name });
    pfade("/marketing/newsletter");
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

export async function ausgabeJetztVersendenAction({ name }) {
  const z = await zugang("PH Newsletter Ausgabe", "write", { nurLeitung: true });
  if (z.fehler) return z.fehler;
  try {
    const n = await M.ausgabeJetztVersenden(z.client, txt(name, 140));
    pfade("/marketing/newsletter");
    return { ok: true, gesendet: n };
  } catch (err) {
    return fehler(err);
  }
}

export async function ausgabeVersandStandAction({ name }) {
  const z = await zugang("PH Newsletter Ausgabe", "read");
  if (z.fehler) return z.fehler;
  try {
    return { ok: true, ...(await M.ausgabeVersandStand(z.client, txt(name, 140))) };
  } catch (err) {
    return fehler(err);
  }
}

export async function ausgabeAbbrechenAction({ name, grund }) {
  const z = await zugang("PH Newsletter Ausgabe", "write", { nurLeitung: true });
  if (z.fehler) return z.fehler;
  if (txt(grund).length < 3) return invalid({ grund: ALLG.pflicht });
  try {
    await M.ausgabeAbbrechen(z.client, { name: txt(name, 140), grund: txt(grund, 140) });
    pfade("/marketing/newsletter");
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

export async function ausgabeTerminAction({ name, termin }) {
  const z = await zugang("PH Newsletter Ausgabe", "write", { nurLeitung: true });
  if (z.fehler) return z.fehler;
  if (!ISO_ZEIT.test(termin || "")) return invalid({ termin: "Datum und Uhrzeit wählen" });
  try {
    const e = await M.einstellungen(z.client);
    const p = pruefeVersandtermin(termin, { ...fensterAus(e), jetzt: new Date() });
    if (p.gesperrt) return invalid({ termin: p.grund }, p.grund);
    const t = termin.length === 16 ? `${termin}:00` : termin;
    const r = await plan(z.session, "marketing.ausgabe-termin", { name: txt(name, 140), termin: t }, { doctype: "PH Newsletter Ausgabe", name: txt(name, 140) }, "Versandtermin", `nl-termin:${name}`);
    return { ok: true, ...r };
  } catch (err) {
    return fehler(err);
  }
}

export async function ausgabeDuplizierenAction({ name }) {
  const z = await zugang("PH Newsletter Ausgabe", "create");
  if (z.fehler) return z.fehler;
  try {
    const quelle = await z.client.getDoc("PH Newsletter Ausgabe", txt(name, 140));
    const alle = await z.client.getList("PH Newsletter Ausgabe", { fields: ["slug"], limit: 500 });
    const slug = naechsteKennung(alle.map((a) => a.slug), new Date());
    const doc = await M.ausgabeAnlegen(z.client, { slug, art: "kopie", letzte: quelle });
    pfade("/marketing/newsletter");
    return { ok: true, name: doc.name, monat: monatAusSlug(slug) };
  } catch (err) {
    return fehler(err);
  }
}

export async function empfaengerListeAction({ name }) {
  const z = await zugang("PH Newsletter Ausgabe", "read");
  if (z.fehler) return z.fehler;
  try {
    const d = await z.client.getDoc("PH Newsletter Ausgabe", txt(name, 140));
    const zeilen = await M.empfaengerListe(z.client, d, { limit: 200 });
    return { ok: true, zeilen };
  } catch (err) {
    return fehler(err);
  }
}

// ================================================================================================ Empfänger

export async function newsletterAnmeldenAction({ email, anrede_name, sprache = "de", interessen = [], quelle = "showroom" }) {
  const z = await zugang("PH Newsletter Abo", "create");
  if (z.fehler) return z.fehler;
  if (!(await kann(z, S.anmeldung))) return { ok: false, code: "forbidden", message: "Kommt mit dem nächsten Backend-Stand." };
  const e = emailNormal(email);
  if (!emailGueltig(e)) return invalid({ email: "E-Mail-Adresse prüfen" });
  try {
    await M.newsletterAnmelden(z.client, { email: e, anrede_name: txt(anrede_name, 140), sprache: ["de", "en", "fr", "it"].includes(sprache) ? sprache : "de", interessen: (interessen || []).slice(0, 10).map((i) => txt(i, 60)), quelle: ["showroom", "telefon", "backoffice", "event"].includes(quelle) ? (quelle === "telefon" ? "backoffice" : quelle) : "backoffice" });
    pfade("/marketing/empfaenger", "/marketing");
    return { ok: true, email: e };
  } catch (err) {
    const r = fehler(err);
    return r.code === "conflict" ? { ...r, fehler: { email: r.message } } : r;
  }
}

/** Bestätigungsmail erneut (einzeln oder Auswahl) – nur Unbestätigt > 60 min (R4, Server filtert auch). */
export async function bestaetigungErneutAction({ emails = [] }) {
  const z = await zugang("PH Newsletter Abo", "write");
  if (z.fehler) return z.fehler;
  const liste = [...new Set((emails || []).map(emailNormal).filter(emailGueltig))].slice(0, 200);
  if (!liste.length) return invalid({}, "Keine Adresse ausgewählt.");
  try {
    const r = await M.bestaetigungErneutSenden(z.client, liste);
    pfade("/marketing/empfaenger");
    return { ok: true, gesendet: Number(r.gesendet || 0), uebersprungen: r.uebersprungen || [] };
  } catch (err) {
    return fehler(err);
  }
}

export async function abmeldenAction({ emails = [], kanal = "backoffice", grund = "" }) {
  const z = await zugang("PH Newsletter Abo", "write");
  if (z.fehler) return z.fehler;
  const liste = [...new Set((emails || []).map(emailNormal).filter(emailGueltig))].slice(0, 200);
  if (!liste.length) return invalid({}, "Keine Adresse ausgewählt.");
  const k = ["backoffice", "antwort_mail", "telefon", "showroom"].includes(kanal) ? kanal : "backoffice";
  let n = 0;
  const uebersprungen = [];
  for (const e of liste) {
    try {
      const st = await M.aboAbmelden(z.client, { email: e, kanal: k, grund: txt(grund, 140) });
      if (st === "Abgemeldet") n += 1;
      else uebersprungen.push({ email: e, grund: st });
    } catch (err) {
      uebersprungen.push({ email: e, grund: err?.message || "nicht möglich" });
    }
  }
  pfade("/marketing/empfaenger", "/marketing");
  return { ok: true, abgemeldet: n, uebersprungen };
}

/** „Keine Werbung mehr“ (D4): genau ein Abmelden, je anderem werblichen Zweck ein Widerruf, optional Kontaktsperre. */
export async function keineWerbungAction({ email, umfang = "alle", kanal = "backoffice", grund = "" }) {
  const z = await zugang("PH Einwilligung", "write");
  if (z.fehler) return z.fehler;
  const e = emailNormal(email);
  if (!emailGueltig(e) || !["alle", "kontakt", "newsletter"].includes(umfang)) return invalid({}, ALLG.ungueltig);
  try {
    const abo = await z.client.getDoc("PH Newsletter Abo", e).catch(() => null);
    const einw = await z.client.getList("PH Einwilligung", { fields: ["name", "zweck", "status", "kontakt"], filters: [["email", "=", e]], limit: 100 });
    const p = keineWerbungPlan({ abo, einwilligungen: einw, umfang });
    const k = ["antwort_mail", "telefon", "showroom", "backoffice"].includes(kanal) ? kanal : "backoffice";
    const protokoll = { abmelden: 0, widerrufen: 0, kontaktsperre: null };
    if (p.abmelden) {
      await M.aboAbmelden(z.client, { email: e, kanal: k, grund: txt(grund, 140) });
      protokoll.abmelden = 1;
    }
    for (const n of p.widerrufen) {
      await M.einwilligungWiderrufen(z.client, { name: n, kanal: k, grund: txt(grund, 140) || "Keine Werbung mehr" });
      protokoll.widerrufen += 1;
    }
    if (p.kontaktsperre) {
      const kontakt = abo?.kontakt || einw.find((w) => w.kontakt)?.kontakt || "";
      let darfCrm = false;
      try {
        darfCrm = darfDoc(z.session, await ladeMeta(z.client, "PH Kontakt"), "write");
      } catch {
        darfCrm = false;
      }
      await M.kontaktSperren(z.client, { kontakt, email: e, darfCrm });
      protokoll.kontaktsperre = darfCrm && kontakt ? "gesetzt" : "aufgabe";
    }
    pfade("/marketing/empfaenger", `/marketing/empfaenger/${encodeURIComponent(e)}`);
    return { ok: true, ...protokoll, hinweis: protokoll.kontaktsperre === "aufgabe" ? KEINE_WERBUNG.crmAufgabe : null };
  } catch (err) {
    return fehler(err);
  }
}

export async function widerrufAction({ namen = [], kanal = "backoffice", grund = "" }) {
  const z = await zugang("PH Einwilligung", "write");
  if (z.fehler) return z.fehler;
  const liste = (namen || []).map((n) => txt(n, 140)).filter(Boolean).slice(0, 200);
  if (!liste.length) return invalid({}, "Keine Einwilligung ausgewählt.");
  let n = 0;
  const uebersprungen = [];
  const gesehen = new Set();
  for (const name of liste) {
    try {
      const w = await z.client.getDoc("PH Einwilligung", name);
      if (!["Offen", "Bestaetigt"].includes(w.status)) {
        uebersprungen.push({ name, grund: "nicht wirksam" });
        continue;
      }
      const schluessel = `${w.email}:${w.zweck}`;
      if (gesehen.has(schluessel)) continue;
      gesehen.add(schluessel);
      await M.einwilligungWiderrufen(z.client, { name, kanal, grund: txt(grund, 140) });
      n += 1;
    } catch (err) {
      uebersprungen.push({ name, grund: err?.message || "nicht möglich" });
    }
  }
  pfade("/marketing/empfaenger");
  return { ok: true, widerrufen: n, uebersprungen };
}

export async function bestaetigenMitBelegAction({ name, beleg_hinweis }) {
  const z = await zugang("PH Einwilligung", "write", { nurLeitung: true });
  if (z.fehler) return z.fehler;
  if (txt(beleg_hinweis).length < 3) return invalid({ beleg_hinweis: ALLG.pflicht });
  try {
    await M.einwilligungMitBeleg(z.client, { name: txt(name, 140), beleg_hinweis: txt(beleg_hinweis, 200) });
    pfade("/marketing/empfaenger");
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

/**
 * Einwilligung erfassen (D3). Papier → Datei Pflicht, sofort wirksam mit Beleg. Andere Kanäle brauchen die
 * Bestätigungsmail-Methode (Fähigkeit S2) – bis dahin gesperrt. Nie doi_noetig = 0 ohne Beleg (R2).
 */
export async function einwilligungErfassenAction(formData) {
  const z = await zugang("PH Einwilligung", "create");
  if (z.fehler) return z.fehler;
  const email = emailNormal(formData.get("email"));
  const zweck = txt(formData.get("zweck"), 40);
  const kanal = txt(formData.get("kanal"), 20);
  const textversion = txt(formData.get("textversion"), 80);
  const datei = formData.get("datei");
  const f = {};
  if (!emailGueltig(email)) f.email = "E-Mail-Adresse prüfen";
  if (!ZWECKE.includes(zweck)) f.zweck = ALLG.pflicht;
  if (!textversion) f.textversion = ALLG.pflicht;
  if (!["telefon", "showroom", "email", "papier"].includes(kanal)) f.kanal = ALLG.pflicht;
  if (kanal === "papier" && !(datei && typeof datei === "object" && datei.size > 0)) f.datei = "Ohne Formular kein Nachweis";
  if (datei && typeof datei === "object" && datei.size > 25 * 1024 * 1024) f.datei = `Datei ist ${Math.round(datei.size / 1024 / 1024)} MB groß – höchstens 25 MB.`;
  if (Object.keys(f).length) return invalid(f);
  if (kanal !== "papier") {
    if (!ZWECKE_MIT_BESTAETIGUNG.includes(zweck) || !(await kann(z, S.kanaele))) return { ok: false, code: "forbidden", message: "Kommt mit dem nächsten Backend-Stand – bis dahin: Formular unterschreiben lassen", fehler: { kanal: "Bis dahin: Formular unterschreiben lassen" } };
  }
  try {
    if (kanal === "papier") {
      const inhalt = new Uint8Array(await datei.arrayBuffer());
      const vorab = await M.einwilligungPapier(z.client, { email, kontakt: txt(formData.get("kontakt"), 140), zweck, textversion, beleg: "(wird hochgeladen)" });
      let up;
      try {
        up = await z.client.uploadFile({ doctype: "PH Einwilligung", name: vorab.name, dateiname: txt(datei.name, 140) || "einwilligung.pdf", inhalt, privat: true, typ: datei.type || "application/pdf" });
      } catch (err) {
        // Ohne Datei kein Nachweis: den vorläufigen Eintrag wieder entfernen (R2).
        await z.client.delete("PH Einwilligung", vorab.name).catch(() => null);
        throw err;
      }
      if (z.client.modus === "mock") M.mockSchreibe(z.client, "PH Einwilligung", vorab.name, { erteilung_beleg: up.file_url });
      else await z.client.setValue("PH Einwilligung", vorab.name, "erteilung_beleg", up.file_url);
      pfade("/marketing/empfaenger", `/marketing/empfaenger/${encodeURIComponent(email)}`);
      return { ok: true, name: vorab.name };
    }
    await z.client.call("ph_marketing.api.backoffice.record_consent", { email, zweck, kanal, textversion });
    pfade("/marketing/empfaenger");
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

export async function aboFelderAction({ email, felder = {} }) {
  const z = await zugang("PH Newsletter Abo", "write");
  if (z.fehler) return z.fehler;
  try {
    const neu = await M.aboFelder(z.client, { email: emailNormal(email), felder: { ...(felder.anrede_name != null ? { anrede_name: txt(felder.anrede_name, 140) } : {}), ...(felder.sprache ? { sprache: ["de", "en", "fr", "it"].includes(felder.sprache) ? felder.sprache : "de" } : {}), ...(Array.isArray(felder.interessen) ? { interessen: felder.interessen.slice(0, 12).map((i) => txt(i, 60)) } : {}) } });
    return { ok: true, modified: neu.modified };
  } catch (err) {
    return fehler(err);
  }
}

export async function auskunftAction({ email }) {
  const z = await zugang("PH Newsletter Abo", "read");
  if (z.fehler) return z.fehler;
  try {
    return { ok: true, daten: await M.auskunft(z.client, emailNormal(email)) };
  } catch (err) {
    return fehler(err);
  }
}

export async function datenLoeschenAction({ email, bestaetigung }) {
  const z = await zugang("PH Newsletter Abo", "delete", { nurLeitung: true });
  if (z.fehler) return z.fehler;
  if (String(bestaetigung || "").trim().toLowerCase() !== "löschen") return invalid({ bestaetigung: "Zum Bestätigen „löschen“ eintippen" });
  try {
    const abo = await z.client.getDoc("PH Newsletter Abo", emailNormal(email));
    if (!loeschenErlaubt(abo)) return invalid({}, "Nur bei Abgemeldet, Unbestätigt, Unzustellbar oder Als Spam gemeldet");
    await M.datenLoeschen(z.client, abo.name);
    pfade("/marketing/empfaenger");
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

// ================================================================================================ Zielgruppen

function regelnSauber(regeln, leitung) {
  return (regeln || []).slice(0, 20).map((r) => ({ kriterium: txt(r.kriterium, 40), operator: txt(r.operator, 20), wert: txt(r.wert, 140), wert_bis: txt(r.wert_bis, 140), negieren: r.negieren ? 1 : 0, deaktiviert: r.deaktiviert ? 1 : 0 })).filter((r) => r.kriterium && (leitung || !KRITERIEN_LEITUNG.includes(r.kriterium)));
}

export async function segmentVorschauAction({ name, regeln, verknuepfung, zweck }) {
  const z = await zugang("PH Segment", "read");
  if (z.fehler) return z.fehler;
  try {
    const v = await M.segmentVorschau(z.client, { name: txt(name, 140) || null, regeln: regelnSauber(regeln, z.leitung), verknuepfung: verknuepfung === "ODER" ? "ODER" : "UND", zweck: txt(zweck, 40) || "newsletter", speichern: 0 });
    return { ok: true, ...v, zeit: new Date().toISOString() };
  } catch (err) {
    return fehler(err);
  }
}

export async function segmentSpeichernAction({ name, titel, zweck, verknuepfung, regeln, beschreibung, standSpeichern = false }) {
  const z = await zugang("PH Segment", name ? "write" : "create");
  if (z.fehler) return z.fehler;
  if (txt(titel).length < 2) return invalid({ titel: ALLG.pflicht });
  if (!["newsletter", "einladungen", "merkliste_erinnerung", "planer_erinnerung", "rueckmeldung", "pflege_nachkauf"].includes(zweck)) return invalid({ zweck: ALLG.pflicht });
  try {
    const id = txt(name, 140) || txt(titel, 60).toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const werte = { titel: txt(titel, 140), zweck, verknuepfung: verknuepfung === "ODER" ? "ODER" : "UND", regeln: regelnSauber(regeln, z.leitung), beschreibung: txt(beschreibung, 500), ...(name ? {} : { segment_id: id, status: "Aktiv", zustaendig: z.session.user }) };
    const doc = await M.segmentSpeichern(z.client, { name: name ? id : null, werte });
    if (standSpeichern) await M.segmentVorschau(z.client, { name: doc.name, speichern: 1 });
    pfade("/marketing/zielgruppen");
    return { ok: true, name: doc.name, satz: segmentSatz(werte.regeln, werte.verknuepfung) };
  } catch (err) {
    return fehler(err);
  }
}

export async function segmentStatusAction({ name, status }) {
  const z = await zugang("PH Segment", "write");
  if (z.fehler) return z.fehler;
  if (!["Aktiv", "Archiviert"].includes(status)) return invalid({});
  try {
    await z.client.setValue("PH Segment", txt(name, 140), "status", status);
    pfade("/marketing/zielgruppen");
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

// ================================================================================================ Kundenreisen

export async function reiseSpeichernAction({ name, werte = {} }) {
  const z = await zugang("PH Kundenreise", "write", { nurLeitung: true });
  if (z.fehler) return z.fehler;
  try {
    const alt = await z.client.getDoc("PH Kundenreise", txt(name, 140));
    const neu = {};
    for (const k of ["titel", "ziel", "vorlage", "absender", "zweck", "aehnliche_produkte"]) if (k in werte) neu[k] = txt(werte[k], 500);
    for (const k of ["werbung", "grundlage_v", "grundlage_e", "segment_outdoor", "segment_pflege", "einmalig"]) if (k in werte) neu[k] = werte[k] ? 1 : 0;
    if ("grundlage_b" in werte) {
      if (werte.grundlage_b && !(await kann(z, S.bestandskunde))) return invalid({ grundlage_b: "Nicht verfügbar: Der Hinweis auf das Werberecht beim Kauf wird noch nicht dokumentiert (Kundenakte)." });
      neu.grundlage_b = werte.grundlage_b ? 1 : 0;
    }
    if ("max_je_kontakt" in werte) neu.max_je_kontakt = Math.max(0, ganz(werte.max_je_kontakt) || 0);
    if (Array.isArray(werte.trigger)) {
      neu.trigger = werte.trigger.slice(0, 10).map((t) => ({ ausloeser_typ: txt(t.ausloeser_typ, 20), feld: txt(t.feld, 60), versatz_tage: Number(t.versatz_tage || 0) || 0, tag_monat: t.tag && t.monat ? tagMonatSchluessel(t.tag, t.monat) : txt(t.tag_monat, 5), event: txt(t.event, 140), zwecke: txt(t.zwecke, 200) }));
      const bad = neu.trigger.find((t) => (t.ausloeser_typ === "jaehrlich" && !t.tag_monat) || (t.ausloeser_typ === "event" && !t.event) || (t.ausloeser_typ === "einwilligung" && !t.zwecke));
      if (bad) return invalid({ trigger: "Auslöser unvollständig" }, "Auslöser unvollständig");
    }
    const neueFreigabe = reiseBrauchtNeueFreigabe(alt, { ...alt, ...neu });
    const doc = await M.reiseSpeichern(z.client, { name: alt.name, werte: neu, neueFreigabe });
    pfade("/marketing/kundenreisen", `/marketing/kundenreisen/${alt.name}`);
    return { ok: true, modified: doc.modified, neueFreigabe };
  } catch (err) {
    return fehler(err);
  }
}

export async function reiseAktionAction({ name, aktion }) {
  const leitungNoetig = ["aktivieren", "heute"].includes(aktion);
  const z = await zugang("PH Kundenreise", aktion === "vorschau" || aktion === "pruefen" || aktion === "trockenlauf" ? "read" : "write", { nurLeitung: leitungNoetig });
  if (z.fehler) return z.fehler;
  const n = txt(name, 140);
  try {
    if (aktion === "pruefen") return { ok: true, fehler: await M.reisePruefen(z.client, n) };
    if (aktion === "vorschau") return { ok: true, ...(await M.reiseVorschau(z.client, n)) };
    if (aktion === "trockenlauf") {
      if (!(await kann(z, S.trockenlauf))) return { ok: false, code: "forbidden", message: "Kommt mit dem nächsten Backend-Stand" };
      return { ok: true, ...(await M.reiseTrockenlauf(z.client, n)) };
    }
    if (aktion === "aktivieren") {
      await M.reiseAktivieren(z.client, n);
      pfade("/marketing/kundenreisen", `/marketing/kundenreisen/${n}`);
      return { ok: true };
    }
    if (aktion === "fortsetzen") {
      await M.reiseAktivieren(z.client, n);
      pfade("/marketing/kundenreisen", `/marketing/kundenreisen/${n}`);
      return { ok: true };
    }
    if (aktion === "heute") return { ok: true, anzahl: await M.reiseHeutePlanen(z.client, n) };
    return invalid({});
  } catch (err) {
    return fehler(err);
  }
}

export async function reisePausierenAction({ namen = [] }) {
  const z = await zugang("PH Kundenreise", "write", { nurLeitung: true });
  if (z.fehler) return z.fehler;
  const liste = (namen || []).map((n) => txt(n, 140)).filter(Boolean).slice(0, 50);
  if (!liste.length) return invalid({});
  try {
    const r = await plan(z.session, "marketing.reise-pausieren", { namen: liste }, liste.length === 1 ? { doctype: "PH Kundenreise", name: liste[0] } : null, "Pausieren", `reise-pause:${liste.join(",")}`);
    return { ok: true, ...r };
  } catch (err) {
    return fehler(err);
  }
}

export async function reiseDuplizierenAction({ quelle, titel }) {
  const z = await zugang("PH Kundenreise", "create", { nurLeitung: true });
  if (z.fehler) return z.fehler;
  if (txt(titel).length < 3) return invalid({ titel: ALLG.pflicht });
  try {
    const doc = await M.reiseDuplizieren(z.client, { quelle: txt(quelle, 140), titel: txt(titel, 140) });
    pfade("/marketing/kundenreisen");
    return { ok: true, name: doc.name };
  } catch (err) {
    return fehler(err);
  }
}

export async function reiseNeuAction({ titel, ziel, zweck, werbung, grundlage, vorlage, trigger }) {
  const z = await zugang("PH Kundenreise", "create", { nurLeitung: true });
  if (z.fehler) return z.fehler;
  const f = {};
  if (txt(titel).length < 3) f.titel = ALLG.pflicht;
  if (!txt(vorlage)) f.vorlage = ALLG.pflicht;
  if (!Array.isArray(trigger) || !trigger.length) f.trigger = "Mindestens ein Auslöser";
  if (Object.keys(f).length) return invalid(f);
  try {
    const g = String(grundlage || (werbung ? "E" : "V"));
    if (g === "B" && !(await kann(z, S.bestandskunde))) return invalid({ grundlage: "Grundlage Bestandskunde ist noch gesperrt." });
    const doc = await M.reiseNeu(z.client, { titel: txt(titel, 140), ziel: txt(ziel, 500), zweck: g === "E" ? txt(zweck, 40) : "", werbung: werbung ? 1 : 0, grundlage_v: g === "V" ? 1 : 0, grundlage_b: g === "B" ? 1 : 0, grundlage_e: g === "E" ? 1 : 0, vorlage: txt(vorlage, 140), absender: "gastgeberin", trigger: trigger.slice(0, 5).map((t) => ({ ausloeser_typ: txt(t.ausloeser_typ, 20), feld: txt(t.feld, 60), versatz_tage: Number(t.versatz_tage || 0) || 0, tag_monat: txt(t.tag_monat, 5), event: txt(t.event, 140), zwecke: txt(t.zwecke, 200) })) });
    pfade("/marketing/kundenreisen");
    return { ok: true, name: doc.name };
  } catch (err) {
    return fehler(err);
  }
}

// ================================================================================================ Kampagnen

export async function kampagneAnlegenAction(werte = {}) {
  const z = await zugang("PH Kampagne", "create");
  if (z.fehler) return z.fehler;
  const f = {};
  if (txt(werte.titel).length < 3) f.titel = ALLG.pflicht;
  if (!KAMPAGNE_KANAL.includes(werte.kanal)) f.kanal = ALLG.pflicht;
  if (!ISO_TAG.test(werte.zeitraum_von || "")) f.zeitraum_von = ALLG.pflicht;
  if (werte.zeitraum_bis && (!ISO_TAG.test(werte.zeitraum_bis) || werte.zeitraum_bis < werte.zeitraum_von)) f.zeitraum_bis = "Ende vor Beginn";
  const budget = werte.budget ? euroZuCent(werte.budget) : 0;
  if (Number.isNaN(budget)) f.budget = "Betrag im Format 1.234,50";
  if (werte.ziel_kennzahl && !ZIEL_KENNZAHL.includes(werte.ziel_kennzahl)) f.ziel_kennzahl = ALLG.ungueltig;
  if (Object.keys(f).length) return invalid(f);
  try {
    const kennung = txt(werte.utm_campaign, 80) || txt(werte.titel, 60).toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const doc = await M.kampagneAnlegen(z.client, { titel: txt(werte.titel, 140), kanal: werte.kanal, zeitraum_von: werte.zeitraum_von, zeitraum_bis: werte.zeitraum_bis || "", budget_cent: budget || 0, ausgaben_cent: 0, ziel_kennzahl: werte.ziel_kennzahl || "", ziel_wert: ganz(werte.ziel_wert) || 0, zustaendig: txt(werte.zustaendig, 140) || z.session.user, utm_campaign: kennung, landingpage: txt(werte.landingpage, 300), utm_source: txt(werte.utm_source, 60) || String(werte.kanal || "").toLowerCase(), utm_medium: txt(werte.utm_medium, 60) });
    pfade("/marketing/kampagnen");
    return { ok: true, name: doc.name };
  } catch (err) {
    return fehler(err);
  }
}

export async function kampagneSpeichernAction({ name, werte = {} }) {
  const z = await zugang("PH Kampagne", "write");
  if (z.fehler) return z.fehler;
  try {
    const neu = {};
    for (const k of ["titel", "landingpage", "utm_source", "utm_medium", "utm_campaign", "beschreibung", "auswertung_notiz", "ziel"]) if (k in werte) neu[k] = txt(werte[k], 2000);
    if ("budget" in werte) {
      const b = euroZuCent(werte.budget);
      if (Number.isNaN(b)) return invalid({ budget: "Betrag im Format 1.234,50" });
      neu.budget_cent = b || 0;
    }
    if (z.client.modus === "mock") M.mockSchreibe(z.client, "PH Kampagne", txt(name, 140), neu);
    else await z.client.save("PH Kampagne", { name: txt(name, 140), ...neu });
    revalidatePath(`/marketing/kampagnen/${txt(name, 140)}`);
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

/** Pausieren/Fortsetzen (verzögert) · Aktivieren (Leitung, sofort mit Undo über Gegenaktion nicht nötig: verzögert) · Beenden/Wieder (Bestätigung, sofort). */
export async function kampagneWorkflowAction({ namen = [], aktion }) {
  const leitung = ["Aktivieren", "Beenden", "Wieder"].includes(aktion);
  const z = await zugang("PH Kampagne", "write", { nurLeitung: leitung });
  if (z.fehler) return z.fehler;
  const liste = (namen || []).map((n) => txt(n, 140)).filter(Boolean).slice(0, 200);
  if (!liste.length) return invalid({});
  try {
    if (aktion === "Beenden" || aktion === "Wieder") {
      for (const n of liste) await z.client.workflowAction("PH Kampagne", n, aktion === "Beenden" ? "Beenden" : "Fortsetzen");
      pfade("/marketing/kampagnen", ...liste.map((n) => `/marketing/kampagnen/${n}`));
      return { ok: true, sofort: true };
    }
    if (!["Pausieren", "Fortsetzen", "Aktivieren"].includes(aktion)) return invalid({});
    if (aktion === "Aktivieren") {
      const d = await z.client.getDoc("PH Kampagne", liste[0]);
      if (!d.zeitraum_von) return invalid({}, "Zuerst Beginn des Zeitraums eintragen");
    }
    const r = await plan(z.session, "marketing.kampagne-workflow", { namen: liste, aktion }, liste.length === 1 ? { doctype: "PH Kampagne", name: liste[0] } : null, aktion, `kam-${aktion}:${liste.join(",")}`);
    return { ok: true, ...r };
  } catch (err) {
    return fehler(err);
  }
}

/** Kennzahl (Dialog, Shift+K): Euro mit Komma → Cent; Aggregate sofort. */
export async function kennzahlErfassenAction({ name, datum, impressionen, klicks, kosten, anfragen, notiz }) {
  const z = await zugang("PH Kampagne", "write");
  if (z.fehler) return z.fehler;
  const f = {};
  if (!ISO_TAG.test(datum || "")) f.datum = "Datum wählen";
  const kc = kosten === "" || kosten == null ? 0 : euroZuCent(kosten);
  if (Number.isNaN(kc) || kc < 0) f.kosten = "Betrag im Format 1.234,50";
  for (const [k, v] of Object.entries({ impressionen, klicks, anfragen })) if (v !== "" && v != null && Number.isNaN(ganz(v))) f[k] = "Ganze Zahl";
  if (Object.keys(f).length) return invalid(f);
  try {
    const k = await z.client.getDoc("PH Kampagne", txt(name, 140));
    if (k.waehrung && k.waehrung !== "EUR" && !(await kann(z, S.kostenBelegt))) {
      // Fremdwährung: Kurs fehlt (P1-8) – Erfassung erlaubt, Summe bleibt je Währung getrennt.
    }
    const doc = await M.kennzahlErfassen(z.client, { name: k.name, zeile: { datum, impressionen: ganz(impressionen) || 0, klicks: ganz(klicks) || 0, kosten_cent: kc || 0, anfragen: ganz(anfragen) || 0, notiz: txt(notiz, 140) } });
    revalidatePath(`/marketing/kampagnen/${k.name}`);
    revalidatePath("/marketing/kampagnen");
    return { ok: true, aggregat: { ausgaben_cent: doc?.ausgaben_cent, anfragen_gesamt: doc?.anfragen_gesamt, klicks_gesamt: doc?.klicks_gesamt, impressionen_gesamt: doc?.impressionen_gesamt }, ueberBudget: doc?.budget_cent ? doc.ausgaben_cent > doc.budget_cent : false };
  } catch (err) {
    return fehler(err);
  }
}

export async function kennzahlenCsvAction({ name, csv, uebernehmen = false }) {
  const z = await zugang("PH Kampagne", "write");
  if (z.fehler) return z.fehler;
  const text = String(csv || "").slice(0, 2_000_000);
  const { zeilen, fehler: lesefehler } = kennzahlenCsvLesen(text);
  if (!uebernehmen) return { ok: true, zeilen: zeilen.slice(0, 200), anzahl: zeilen.length, fehler: lesefehler.slice(0, 20) };
  if (!zeilen.length) return invalid({}, "Keine lesbare Zeile gefunden.");
  try {
    const r = await M.kennzahlenImport(z.client, { name: txt(name, 140), zeilen });
    revalidatePath(`/marketing/kampagnen/${txt(name, 140)}`);
    return { ok: true, uebernommen: r?.uebernommen ?? zeilen.length };
  } catch (err) {
    return fehler(err);
  }
}

// ================================================================================================ Events

export async function eventAnlegenAction(werte = {}) {
  const z = await zugang("PH Event", "create", { nurLeitung: true });
  if (z.fehler) return z.fehler;
  const f = {};
  if (txt(werte.titel).length < 3) f.titel = ALLG.pflicht;
  if (!ISO_TAG.test(werte.datum || "")) f.datum = ALLG.pflicht;
  if (werte.art && !EVENT_ART.includes(werte.art)) f.art = ALLG.ungueltig;
  if (werte.kapazitaet && Number.isNaN(ganz(werte.kapazitaet, 1))) f.kapazitaet = "Ganze Zahl ab 1";
  if (Object.keys(f).length) return invalid(f);
  try {
    const doc = await M.eventAnlegen(z.client, { titel: txt(werte.titel, 140), art: werte.art || "Abend im Showroom", datum: werte.datum, uhrzeit_von: /^\d{2}:\d{2}$/.test(werte.uhrzeit_von || "") ? `${werte.uhrzeit_von}:00` : "", uhrzeit_bis: /^\d{2}:\d{2}$/.test(werte.uhrzeit_bis || "") ? `${werte.uhrzeit_bis}:00` : "", ort: txt(werte.ort, 200) || "Showroom und Café, Landstraße 11, 6911 Lochau", kapazitaet: werte.kapazitaet ? ganz(werte.kapazitaet) : 0, warteliste: werte.warteliste ? 1 : 0, max_personen_je_anmeldung: ganz(werte.max_personen_je_anmeldung, 1) || 10, nachruecken_automatisch: werte.nachruecken_automatisch ? 1 : 0, erinnerung_tage_vorher: ganz(werte.erinnerung_tage_vorher) || 2, bestaetigung_vorlage: "event_bestaetigung", erinnerung_vorlage: "event_erinnerung", nachrueck_vorlage: "event_nachgerueckt", absage_vorlage: "event_absage", einwilligung_textversion: txt(werte.einwilligung_textversion, 60) || "event-2026-10", loeschfrist_monate: ganz(werte.loeschfrist_monate, 1) || 3, fotos_hinweis: txt(werte.fotos_hinweis, 300) });
    pfade("/marketing/events", "/marketing");
    return { ok: true, name: doc.name };
  } catch (err) {
    return fehler(err);
  }
}

export async function eventSpeichernAction({ name, werte = {} }) {
  const z = await zugang("PH Event", "write");
  if (z.fehler) return z.fehler;
  try {
    const neu = {};
    for (const k of ["titel", "ort", "url", "programm", "beschreibung", "fotos_hinweis", "einwilligung_textversion", "kampagne", "art"]) if (k in werte) neu[k] = txt(werte[k], 4000);
    for (const k of ["uhrzeit_von", "uhrzeit_bis"]) if (k in werte) neu[k] = /^\d{2}:\d{2}$/.test(werte[k] || "") ? `${werte[k]}:00` : "";
    for (const k of ["kapazitaet", "max_personen_je_anmeldung", "erinnerung_tage_vorher", "loeschfrist_monate"]) if (k in werte) neu[k] = werte[k] === "" ? 0 : Math.max(0, ganz(werte[k]) || 0);
    for (const k of ["warteliste", "nachruecken_automatisch"]) if (k in werte) neu[k] = werte[k] ? 1 : 0;
    if ("datum" in werte && ISO_TAG.test(werte.datum)) neu.datum = werte.datum;
    if (z.client.modus === "mock") M.mockSchreibe(z.client, "PH Event", txt(name, 140), neu);
    else await z.client.save("PH Event", { name: txt(name, 140), ...neu });
    pfade(`/marketing/events/${txt(name, 140)}`, "/marketing/events", "/marketing");
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

/** Veröffentlichen (Leitung, Bestätigung, sofort), Als ausgebucht (verzögert), Wieder öffnen (Leitung, sofort). */
export async function eventWorkflowAction({ name, aktion }) {
  const z = await zugang("PH Event", "write", { nurLeitung: aktion !== "Als ausgebucht markieren" });
  if (z.fehler) return z.fehler;
  const n = txt(name, 140);
  try {
    if (aktion === "Als ausgebucht markieren") {
      const r = await plan(z.session, "marketing.event-workflow", { name: n, aktion }, { doctype: "PH Event", name: n }, "Als ausgebucht", `ev-ausgebucht:${n}`);
      return { ok: true, ...r };
    }
    if (aktion === "Veröffentlichen") {
      const d = await z.client.getDoc("PH Event", n);
      if (!d.uhrzeit_von) return invalid({}, "Zuerst Uhrzeit eintragen");
    }
    if (!["Veröffentlichen", "Wieder öffnen"].includes(aktion)) return invalid({});
    await z.client.workflowAction("PH Event", n, aktion);
    pfade(`/marketing/events/${n}`, "/marketing/events", "/marketing");
    return { ok: true, sofort: true };
  } catch (err) {
    return fehler(err);
  }
}

/** Event-Anmeldung (D5) – speichert keine Werbe-Einwilligung (R1); Einladungs-Schalter erst mit S3. */
export async function eventAnmeldungAction({ event, name_person, email, telefon, personen = 1, quelle = "telefon", nachricht = "", einladungenOk = false }) {
  const z = await zugang("PH Event", "write");
  if (z.fehler) return z.fehler;
  const e = emailNormal(email);
  const f = {};
  if (txt(name_person).length < 2) f.name_person = ALLG.pflicht;
  const ohneEmail = !e && txt(telefon) && (await kann(z, S.ohneEmail));
  if (!ohneEmail && !emailGueltig(e)) f.email = e ? "E-Mail-Adresse prüfen" : "Ohne E-Mail: bitte Gast am Abend über „+ Gast ohne Anmeldung“ zählen.";
  const p = ganz(personen, 1);
  if (Number.isNaN(p)) f.personen = "Mindestens 1";
  if (Object.keys(f).length) return invalid(f);
  if (einladungenOk && !(await kann(z, S.einladungen))) return invalid({ einladungenOk: "Noch nicht verfügbar" });
  try {
    const ev = await z.client.getDoc("PH Event", txt(event, 140));
    const vor = anmeldungPruefen(ev, { email: e, personen: p });
    if (vor.art === "doppelt") return { ok: false, code: "conflict", message: `Diese Adresse ist schon angemeldet (${vor.personen} ${vor.personen === 1 ? "Person" : "Personen"}).`, fehler: { email: "schon angemeldet" } };
    if (vor.art === "ausgebucht") return invalid({ personen: "Das Event ist ausgebucht" }, "Das Event ist ausgebucht");
    if (vor.art === "nicht_offen") return invalid({}, "Anmeldungen sind erst nach dem Veröffentlichen möglich.");
    if (vor.art === "zu_viele") return invalid({ personen: `Höchstens ${vor.max} Personen je Anmeldung.` });
    const r = await M.anmeldungHinzufuegen(z.client, { event: ev.name, name_person: txt(name_person, 140), email: e, personen: p, telefon: txt(telefon, 40), quelle: ["telefon", "showroom", "email", "backoffice"].includes(quelle) ? quelle : "telefon", nachricht: txt(nachricht, 500) });
    pfade(`/marketing/events/${ev.name}`, "/marketing/events", "/marketing");
    return { ok: true, status: r?.status || "angemeldet", email: e };
  } catch (err) {
    return fehler(err);
  }
}

export async function teilnehmerStatusAction({ event, zeilen = [], status }) {
  const z = await zugang("PH Event", "write");
  if (z.fehler) return z.fehler;
  if (!["angemeldet", "bestaetigt", "abgesagt", "erschienen", "nicht erschienen"].includes(status)) return invalid({});
  const liste = (zeilen || []).map((x) => txt(x, 140)).filter(Boolean).slice(0, 200);
  try {
    for (const zeile of liste) await M.teilnehmerStatus(z.client, { event: txt(event, 140), zeile, status });
    pfade(`/marketing/events/${txt(event, 140)}`);
    return { ok: true, anzahl: liste.length };
  } catch (err) {
    return fehler(err);
  }
}

export async function nachrueckenAction({ event }) {
  const z = await zugang("PH Event", "write");
  if (z.fehler) return z.fehler;
  try {
    if (!(await kann(z, S.nachruecken))) return { ok: false, code: "forbidden", message: "Bis dahin Status in der Zeile auf „angemeldet“ setzen" };
    const n = await M.nachruecken(z.client, { event: txt(event, 140) });
    pfade(`/marketing/events/${txt(event, 140)}`);
    return { ok: true, anzahl: Number(n) || 0 };
  } catch (err) {
    return fehler(err);
  }
}

export async function erinnerungAction({ event, alle = false }) {
  const z = await zugang("PH Event", "write");
  if (z.fehler) return z.fehler;
  try {
    const n = await M.erinnerungSenden(z.client, { event: txt(event, 140), alle: alle ? 1 : 0 });
    pfade(`/marketing/events/${txt(event, 140)}`);
    return { ok: true, anzahl: Number(n) || 0 };
  } catch (err) {
    return fehler(err);
  }
}

export async function eventAbsagenAction({ event, grund }) {
  const z = await zugang("PH Event", "write", { nurLeitung: true });
  if (z.fehler) return z.fehler;
  if (txt(grund).length < 3) return invalid({ grund: ALLG.pflicht });
  try {
    const mail = await kann(z, S.absage);
    const r = await M.eventAbsagen(z.client, { event: txt(event, 140), grund: txt(grund, 300), mail });
    pfade(`/marketing/events/${txt(event, 140)}`, "/marketing/events", "/marketing");
    return { ok: true, mails: Number(r?.mails || 0), mitMail: mail };
  } catch (err) {
    return fehler(err);
  }
}

/** Check-in im Kiosk – verzögerter Commit (Kiosk 6 s). Doppel-Check-in wird vorab geprüft. */
export async function eincheckenAction({ event, zeile, personen }) {
  const z = await zugang("PH Event", "write");
  if (z.fehler) return z.fehler;
  try {
    const ev = await z.client.getDoc("PH Event", txt(event, 140));
    const a = (ev.anmeldungen || []).find((x) => x.name === txt(zeile, 140));
    if (!a) return { ok: false, code: "not_found", message: "Diese Anmeldung gibt es nicht mehr." };
    if (a.status === "erschienen") return { ok: false, code: "conflict", message: `Schon da seit ${String(a.erschienen_am || "").slice(11, 16)} (anderes Gerät)`, erschienen_am: a.erschienen_am };
    const wrapper = await kann(z, S.checkin);
    const r = await planeCommit(z.session, { action: "marketing.einchecken", args: { event: ev.name, zeile: a.name, personen: personen ? ganz(personen, 1) || undefined : undefined, wrapper }, objekt: { doctype: "PH Event", name: `${ev.name}:${a.name}` }, titel: `Check-in ${a.name_person}`, schluessel: `checkin:${ev.name}:${a.name}`, ms: 6000 });
    return { ok: true, ...r };
  } catch (err) {
    return fehler(err);
  }
}

/** Code-Scan am Eingang (Fähigkeit S4) – sofort, weil die Bestätigung in der Zeile steht. */
export async function codeEincheckenAction({ event, code }) {
  const z = await zugang("PH Event", "write");
  if (z.fehler) return z.fehler;
  try {
    const wrapper = await kann(z, S.checkin);
    const r = await M.einchecken(z.client, { event: txt(event, 140), code: txt(code, 200), mitWrapper: wrapper });
    if (r.status === "ok") revalidatePath(`/marketing/events/${txt(event, 140)}`);
    return { ok: r.status === "ok" || r.status === "bereits", ...r };
  } catch (err) {
    return fehler(err);
  }
}

export async function checkinFertigAction({ event, nichtErschienen = [], ohneAnmeldung = 0 }) {
  const z = await zugang("PH Event", "write");
  if (z.fehler) return z.fehler;
  try {
    for (const zeile of (nichtErschienen || []).slice(0, 500)) await M.teilnehmerStatus(z.client, { event: txt(event, 140), zeile: txt(zeile, 140), status: "nicht erschienen" });
    const g = ganz(ohneAnmeldung) || 0;
    if (g > 0) await M.kommentieren(z.client, "PH Event", txt(event, 140), `${g} ${g === 1 ? "Gast" : "Gäste"} ohne Anmeldung`);
    pfade(`/marketing/events/${txt(event, 140)}`);
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

export async function checkinStandAction({ event }) {
  const z = await zugang("PH Event", "read");
  if (z.fehler) return z.fehler;
  try {
    const ev = await z.client.getDoc("PH Event", txt(event, 140));
    return { ok: true, anmeldungen: (ev.anmeldungen || []).map((a) => ({ name: a.name, status: a.status, erschienen_am: a.erschienen_am || "", personen: a.personen })) };
  } catch (err) {
    return fehler(err);
  }
}

// ================================================================================================ Social

export async function socialAnlegenAction({ titel, datum, kanal = "Instagram", format }) {
  const z = await zugang("PH Social Beitrag", "create");
  if (z.fehler) return z.fehler;
  const f = {};
  if (txt(titel).length < 2) f.titel = ALLG.pflicht;
  if (!ISO_TAG.test(datum || "")) f.datum = "Datum wählen";
  if (!SOCIAL_KANAELE.includes(kanal)) f.kanal = ALLG.ungueltig;
  const fmt = format || (kanal === "Pinterest" ? "Pin" : "Post");
  if (!formatErlaubt(kanal, fmt)) f.format = "Format passt nicht zum Kanal";
  if (Object.keys(f).length) return invalid(f);
  try {
    const doc = await M.socialAnlegen(z.client, { titel: txt(titel, 140), datum, kanal, format: fmt });
    pfade("/marketing/social", "/marketing");
    return { ok: true, name: doc.name };
  } catch (err) {
    return fehler(err);
  }
}

export async function socialSpeichernAction({ name, modified, felder = {} }) {
  const z = await zugang("PH Social Beitrag", "write");
  if (z.fehler) return z.fehler;
  try {
    const d = await z.client.getDoc("PH Social Beitrag", txt(name, 140));
    if (["Veroeffentlicht", "Verworfen"].includes(d.status) && !Object.keys(felder).every((k) => k === "notiz")) return invalid({}, "Ein veröffentlichter Beitrag wird nicht mehr geändert.");
    if (modified && d.modified && String(modified) !== String(d.modified)) return { ok: false, code: "conflict", message: "Der Beitrag wurde inzwischen geändert.", serverstand: d };
    const neu = {};
    for (const k of ["titel", "overline", "text", "hashtags", "link", "sprache", "alt_text", "board", "kampagne", "zustaendig", "produkt_slug", "marke_name", "bild_credit", "bild_bearbeitung", "bild_layout", "notiz", "bild"]) if (k in felder) neu[k] = txt(felder[k], 5000);
    if ("kanal" in felder || "format" in felder) {
      const kanal = felder.kanal || d.kanal;
      const format = felder.format || d.format;
      if (!formatErlaubt(kanal, format)) return invalid({ format: "Format passt nicht zum Kanal" });
      neu.kanal = kanal;
      neu.format = format;
    }
    if ("bildquelle_freigabe" in felder) {
      if (!["offen", "eigen", "Hersteller freigegeben"].includes(felder.bildquelle_freigabe)) return invalid({ bildquelle_freigabe: ALLG.ungueltig });
      neu.bildquelle_freigabe = felder.bildquelle_freigabe;
      if (felder.bildquelle_freigabe === "eigen") neu.bild_credit = "Platzhirsch Home Living";
    }
    if ("uhrzeit_geplant" in felder) neu.uhrzeit_geplant = /^\d{2}:\d{2}$/.test(felder.uhrzeit_geplant || "") ? `${felder.uhrzeit_geplant}:00` : "";
    // Änderung nach der Freigabe → zurück auf Entwurf (Freigabe gilt für den gesehenen Stand).
    let zurueck = false;
    const inhalt = ["titel", "text", "bild", "alt_text", "bildquelle_freigabe", "kanal", "format", "hashtags"].some((k) => k in neu && String(neu[k] ?? "") !== String(d[k] ?? ""));
    if (inhalt && ["Freigegeben", "Geplant"].includes(d.status)) {
      await z.client.workflowAction("PH Social Beitrag", d.name, "Zurück auf Entwurf").catch(() => null);
      zurueck = true;
    }
    const doc = z.client.modus === "mock" ? M.mockSchreibe(z.client, "PH Social Beitrag", d.name, neu) : await z.client.save("PH Social Beitrag", { name: d.name, ...neu });
    revalidatePath(`/marketing/social/${d.name}`);
    return { ok: true, modified: doc.modified, zurueck };
  } catch (err) {
    return fehler(err);
  }
}

export async function socialBildAction(formData) {
  const z = await zugang("PH Social Beitrag", "write");
  if (z.fehler) return z.fehler;
  const name = txt(formData.get("name"), 140);
  const datei = formData.get("datei");
  if (!(datei && typeof datei === "object" && datei.size > 0)) return invalid({ datei: "Bitte ein Bild wählen" });
  if (datei.size > 25 * 1024 * 1024) return invalid({ datei: `Bild ist ${Math.round(datei.size / 1024 / 1024)} MB groß – höchstens 25 MB. Tipp: als JPG exportieren.` });
  if (/heic|heif/i.test(datei.type || datei.name)) return invalid({ datei: "Format HEIC wird nicht angenommen – bitte JPG oder PNG." });
  if (!/^image\/(jpeg|png|webp)$/.test(datei.type || "")) return invalid({ datei: "Bitte JPG, PNG oder WebP." });
  try {
    const up = await z.client.uploadFile({ doctype: "PH Social Beitrag", name, dateiname: txt(datei.name, 140), inhalt: new Uint8Array(await datei.arrayBuffer()), privat: false, typ: datei.type });
    const url = z.client.modus === "mock" ? `data:${datei.type};base64,${Buffer.from(await datei.arrayBuffer()).toString("base64")}` : up.file_url;
    if (z.client.modus === "mock") M.mockSchreibe(z.client, "PH Social Beitrag", name, { bild: datei.size < 3 * 1024 * 1024 ? url : up.file_url });
    else await z.client.setValue("PH Social Beitrag", name, "bild", up.file_url);
    revalidatePath(`/marketing/social/${name}`);
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

/** Datum setzen (Ziehen oder Dialog) – für jeden Status, verzögerter Commit; Freigegeben → Planen danach. */
export async function socialDatumAction({ ziele = [] }) {
  const z = await zugang("PH Social Beitrag", "write");
  if (z.fehler) return z.fehler;
  const liste = (ziele || []).filter((x) => x?.name && ISO_TAG.test(x?.datum || "")).slice(0, 200).map((x) => ({ name: txt(x.name, 140), datum: x.datum }));
  if (!liste.length) return invalid({}, "Datum wählen");
  try {
    const r = await plan(z.session, "marketing.social-datum", { ziele: liste }, liste.length === 1 ? { doctype: "PH Social Beitrag", name: liste[0].name } : null, "Datum setzen", `soc-datum:${liste.map((x) => `${x.name}@${x.datum}`).join(",")}`);
    return { ok: true, ...r };
  } catch (err) {
    return fehler(err);
  }
}

export async function socialWorkflowAction({ namen = [], aktion }) {
  const z = await zugang("PH Social Beitrag", "write", { nurLeitung: aktion === "Zurück auf Entwurf" });
  if (z.fehler) return z.fehler;
  const liste = (namen || []).map((n) => txt(n, 140)).filter(Boolean).slice(0, 200);
  if (!liste.length) return invalid({});
  try {
    if (aktion === "Ausarbeiten" || aktion === "Zurück auf Entwurf") {
      for (const n of liste) await z.client.workflowAction("PH Social Beitrag", n, aktion);
      pfade("/marketing/social", ...liste.map((n) => `/marketing/social/${n}`));
      return { ok: true, sofort: true };
    }
    if (aktion !== "Verwerfen") return invalid({});
    const r = await plan(z.session, "marketing.social-workflow", { namen: liste, aktion }, liste.length === 1 ? { doctype: "PH Social Beitrag", name: liste[0] } : null, "Verwerfen", `soc-verwerfen:${liste.join(",")}`);
    return { ok: true, ...r };
  } catch (err) {
    return fehler(err);
  }
}

/** „Zur Freigabe“ (Mitarbeiter) – nur mit Bild, Bildbeschreibung und grünen Prüfungen; verzögerter Commit, danach Aufgabe. */
export async function socialZurFreigabeAction({ name, kundenprojekt = false, einwilligungOk = false, kennzeichnung = "nein" }) {
  const z = await zugang("PH Social Beitrag", "write");
  if (z.fehler) return z.fehler;
  try {
    const d = await z.client.getDoc("PH Social Beitrag", txt(name, 140));
    if (d.status !== "Entwurf") return invalid({}, "Nur ein Entwurf kann zur Freigabe gegeben werden.");
    const p = socialPruefungen(d, { kundenprojekt, einwilligungOk, kennzeichnung });
    if (!p.ok) return invalid({ pruefung: p.gruende.join(",") }, "Bild, Bildbeschreibung und Bildrechte zuerst klären.");
    if (kundenprojekt || kennzeichnung !== "nein") await M.kommentieren(z.client, "PH Social Beitrag", d.name, `Bildrechte: Kundenprojekt ${kundenprojekt ? "ja, Einwilligung liegt vor" : "nein"} · Kennzeichnung ${kennzeichnung}`);
    const r = await plan(z.session, "marketing.social-zur-freigabe", { name: d.name, leitung: [] }, { doctype: "PH Social Beitrag", name: d.name, titel: d.titel }, `Zur Freigabe ${d.titel}`, `soc-freigabe:${d.name}`);
    return { ok: true, ...r, titel: d.titel };
  } catch (err) {
    return fehler(err);
  }
}

/** „Freigeben“ (Leitung, D2) – sofort nach dem Dialog (die Freigabe ist der bewusste Schritt), Prüfungen Pflicht. */
export async function socialFreigebenAction({ name, kundenprojekt = false, einwilligungOk = false, kennzeichnung = "nein" }) {
  const z = await zugang("PH Social Beitrag", "write", { nurLeitung: true });
  if (z.fehler) return z.fehler;
  try {
    const d = await z.client.getDoc("PH Social Beitrag", txt(name, 140));
    if (d.status !== "Entwurf") return invalid({}, "Nur ein Entwurf kann freigegeben werden.");
    const p = socialPruefungen(d, { kundenprojekt, einwilligungOk, kennzeichnung });
    if (!p.ok) return invalid({ pruefung: p.gruende.join(",") }, "Prüfung nicht bestanden.");
    await M.socialFreigeben(z.client, { name: d.name, pruefungen: { kundenprojekt, kennzeichnung } });
    pfade("/marketing/social", `/marketing/social/${d.name}`, "/marketing");
    return { ok: true, titel: d.titel };
  } catch (err) {
    return fehler(err);
  }
}

export async function socialVeroeffentlichtAction({ name, url }) {
  const z = await zugang("PH Social Beitrag", "write");
  if (z.fehler) return z.fehler;
  const u = txt(url, 500);
  if (!/^https?:\/\/\S+\.\S+/.test(u)) return invalid({ url: "Ohne Adresse kein Nachweis der Veröffentlichung" });
  try {
    await M.socialVeroeffentlicht(z.client, { name: txt(name, 140), url: u });
    pfade("/marketing/social", `/marketing/social/${txt(name, 140)}`);
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

export async function socialKennzahlenAction({ name, werte = {} }) {
  const z = await zugang("PH Social Beitrag", "write");
  if (z.fehler) return z.fehler;
  const f = {};
  for (const k of ["reichweite", "likes", "saves", "klicks", "kommentare"]) if (werte[k] !== "" && werte[k] != null && Number.isNaN(ganz(werte[k]))) f[k] = "Ganze Zahl";
  if (Object.keys(f).length) return invalid(f);
  try {
    await M.socialKennzahlen(z.client, { name: txt(name, 140), werte });
    revalidatePath(`/marketing/social/${txt(name, 140)}`);
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

export async function bildFreigabePruefenAction({ name }) {
  const z = await zugang("PH Social Beitrag", "write");
  if (z.fehler) return z.fehler;
  try {
    const status = await M.bildFreigabePruefen(z.client, txt(name, 140));
    revalidatePath(`/marketing/social/${txt(name, 140)}`);
    return { ok: true, status };
  } catch (err) {
    return { ok: true, status: "Markenverwaltung nicht erreichbar", fehler: fehler(err).message };
  }
}

// ================================================================================================ Empfehlungen

export async function empfehlungAnlegenAction({ empfehler_name, empfehler_email, empfehler_auftrag }) {
  const z = await zugang("PH Empfehlung", "create");
  if (z.fehler) return z.fehler;
  const f = {};
  if (txt(empfehler_name).length < 2) f.empfehler_name = ALLG.pflicht;
  if (!emailGueltig(empfehler_email)) f.empfehler_email = "E-Mail-Adresse prüfen";
  if (!txt(empfehler_auftrag)) f.empfehler_auftrag = "Eigener Auftrag ist Pflicht";
  if (Object.keys(f).length) return invalid(f);
  try {
    const doc = await M.empfehlungAnlegen(z.client, { empfehler_name: txt(empfehler_name, 140), empfehler_email, empfehler_auftrag: txt(empfehler_auftrag, 40) });
    const r = await plan(z.session, "marketing.code-senden", { codes: [doc.name] }, { doctype: "PH Empfehlung", name: doc.name }, `Code senden ${doc.name}`, `code:${doc.name}`);
    pfade("/marketing/empfehlungen");
    return { ok: true, name: doc.name, ...r };
  } catch (err) {
    return fehler(err);
  }
}

export async function codeSendenAction({ codes = [] }) {
  const z = await zugang("PH Empfehlung", "write");
  if (z.fehler) return z.fehler;
  const liste = (codes || []).map((c) => txt(c, 40)).filter(Boolean).slice(0, 100);
  if (!liste.length) return invalid({});
  try {
    const docs = await Promise.all(liste.map((c) => z.client.getDoc("PH Empfehlung", c).catch(() => null)));
    const moeglich = docs.filter((d) => d && !d.code_gesendet_am && !["Abgelehnt", "Verfallen"].includes(d.status)).map((d) => d.name);
    if (!moeglich.length) return invalid({}, "Alle gewählten Codes sind schon gesendet.");
    const r = await plan(z.session, "marketing.code-senden", { codes: moeglich }, moeglich.length === 1 ? { doctype: "PH Empfehlung", name: moeglich[0] } : null, "Code senden", `code:${moeglich.join(",")}`);
    return { ok: true, ...r, anzahl: moeglich.length, uebersprungen: liste.length - moeglich.length };
  } catch (err) {
    return fehler(err);
  }
}

export async function empfehlungAblehnenAction({ codes = [], grund }) {
  const z = await zugang("PH Empfehlung", "write");
  if (z.fehler) return z.fehler;
  if (txt(grund).length < 3) return invalid({ grund: ALLG.pflicht });
  try {
    for (const c of (codes || []).slice(0, 100)) await M.empfehlungAblehnen(z.client, { code: txt(c, 40), grund: txt(grund, 300) });
    pfade("/marketing/empfehlungen");
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

export async function auftragZuordnenAction({ code, auftrag }) {
  const z = await zugang("PH Empfehlung", "write");
  if (z.fehler) return z.fehler;
  if (!txt(auftrag)) return invalid({ auftrag: ALLG.pflicht });
  try {
    await M.auftragZuordnen(z.client, { code: txt(code, 40), auftrag: txt(auftrag, 40) });
    revalidatePath(`/marketing/empfehlungen/${txt(code, 40)}`);
    return { ok: true };
  } catch (err) {
    const r = fehler(err);
    return r.detail?.feld ? { ...r, fehler: { [r.detail.feld]: r.message } } : r;
  }
}

/** Gutschein (D6) – geldwirksam, nur mit S7 und grünen Ampeln (Server prüft vor dem Senden erneut). */
export async function gutscheinSendenAction({ code }) {
  const z = await zugang("PH Empfehlung", "write", { nurLeitung: true });
  if (z.fehler) return z.fehler;
  if (!(await kann(z, S.gutschein))) return { ok: false, code: "forbidden", message: "Gutschein-Art „Aktion“ fehlt im Shop – Ausgabe nach Abstimmung mit dem Steuerberater" };
  try {
    const e = await z.client.getDoc("PH Empfehlung", txt(code, 40));
    if (e.status !== "Gutschein faellig") return invalid({}, "Der Gutschein ist nicht fällig.");
    const einst = await M.einstellungen(z.client);
    const wert = Number(einst.empfehlung_gutschein_cent || 0);
    if (!wert) return invalid({}, "Gutscheinwert fehlt in den Einstellungen.");
    await M.gutscheinSenden(z.client, { code: e.name, wert_cent: wert });
    pfade("/marketing/empfehlungen", `/marketing/empfehlungen/${e.name}`);
    return { ok: true, wert };
  } catch (err) {
    return fehler(err);
  }
}

// ================================================================================================ Vorlagen, Einstellungen

export async function vorlageSpeichernAction({ name, modified, werte = {} }) {
  const z = await zugang("PH Mail Vorlage", "write", { nurLeitung: true });
  if (z.fehler) return z.fehler;
  if ("betreff" in werte && txt(werte.betreff).length < 2) return invalid({ betreff: ALLG.pflicht });
  if (["A", "B", "je Empfänger"].includes(werte.fusszeile) && "html" in werte && !/abmelde_url|fusszeile_html/.test(String(werte.html))) return invalid({ html: "Werbliche Fußzeilen brauchen einen Abmeldelink." });
  try {
    const doc = await M.vorlageSpeichern(z.client, { name: txt(name, 140), modified, werte: Object.fromEntries(Object.entries(werte).map(([k, v]) => [k, String(v ?? "").slice(0, 100000)])) });
    revalidatePath("/marketing/vorlagen");
    return { ok: true, modified: doc.modified };
  } catch (err) {
    return fehler(err);
  }
}

export async function vorlageAktionAction({ name, aktion }) {
  const z = await zugang("PH Mail Vorlage", aktion === "vorschau" ? "read" : "create", { nurLeitung: true });
  if (z.fehler) return z.fehler;
  try {
    if (aktion === "vorschau") return { ok: true, ...(await M.vorlageVorschau(z.client, txt(name, 140))) };
    if (aktion === "duplizieren") {
      const doc = await M.vorlageDuplizieren(z.client, txt(name, 140));
      revalidatePath("/marketing/vorlagen");
      return { ok: true, name: doc.name };
    }
    return invalid({});
  } catch (err) {
    return fehler(err);
  }
}

const EINST_FELDER = ["test_empfaenger", "absender_name", "absender_gastgeberin_name", "absender_gastgeberin", "antwort_an", "doi_gueltig_stunden", "doi_erinnerung_nach_stunden", "unbestaetigt_loeschen_tage", "ip_hash_speichern", "einwilligung_textversion", "website_url", "bestaetigen_pfad", "abmelden_pfad", "werbung_pro_30_tage", "werbung_wochentage", "sperrtage", "versand_stapel", "auftrags_doctype", "feld_email", "feld_name", "feld_anrede", "feld_lieferdatum", "feld_berater", "feld_produkt", "feld_storniert", "wert_storniert", "positionen_tabelle", "feld_pflegekategorie", "feld_outdoor", "feld_kontakt", "empfehlung_gutschein_cent", "empfehlung_ruecktritt_tage", "empfehlung_bedingungen_url", "event_erinnerung_tage", "event_loeschfrist_monate", "resend_webhook_aktiv", "soft_bounce_grenze", "mail_ereignis_aufbewahren_tage", "attribution_modell", "attribution_fenster_tage", "kampagne_nachlauf_tage", "ecg_abgleich_gueltig_bis", "versandweg"];
const EINST_ZAHL = new Set(["doi_gueltig_stunden", "doi_erinnerung_nach_stunden", "unbestaetigt_loeschen_tage", "werbung_pro_30_tage", "versand_stapel", "empfehlung_ruecktritt_tage", "event_erinnerung_tage", "event_loeschfrist_monate", "soft_bounce_grenze", "mail_ereignis_aufbewahren_tage", "attribution_fenster_tage", "kampagne_nachlauf_tage"]);
const EINST_CHECK = new Set(["ip_hash_speichern", "resend_webhook_aktiv"]);
const EINST_MAIL = new Set(["test_empfaenger", "absender_gastgeberin", "antwort_an"]);

export async function einstellungenSpeichernAction({ werte = {}, modified }) {
  const z = await zugang(M.EINST, "write", { nurLeitung: true });
  if (z.fehler) return z.fehler;
  const neu = {};
  const f = {};
  for (const [k, v] of Object.entries(werte)) {
    if (!EINST_FELDER.includes(k)) continue;
    if (EINST_ZAHL.has(k)) {
      const n = ganz(v);
      if (Number.isNaN(n)) f[k] = "Ganze Zahl";
      else neu[k] = n;
    } else if (EINST_CHECK.has(k)) neu[k] = v ? 1 : 0;
    else if (k === "empfehlung_gutschein_cent") {
      const c = euroZuCent(v);
      if (Number.isNaN(c)) f[k] = "Betrag im Format 1.234,50";
      else neu[k] = c || 0;
    } else if (EINST_MAIL.has(k) && v && !emailGueltig(v)) f[k] = "E-Mail-Adresse prüfen";
    else if (k === "werbung_wochentage" && v && !/^[1-7](,[1-7])*$/.test(String(v))) f[k] = "Wochentage als Ziffern 1–7";
    else if (k === "sperrtage" && v && !/^\d{2}-\d{2}(,\d{2}-\d{2})*$/.test(String(v))) f[k] = "Sperrtage als MM-TT";
    else if (k === "ecg_abgleich_gueltig_bis" && v && !ISO_TAG.test(v)) f[k] = "Datum wählen";
    else if (k === "versandweg" && v === "Resend") f[k] = "Versand über Mail-Dienst erst mit Versanddienst-Vertrag und Transfergrundlage.";
    else neu[k] = txt(v, 300);
  }
  if (Object.keys(f).length) return invalid(f);
  try {
    const doc = await M.einstellungenSpeichern(z.client, { werte: neu, modified });
    revalidatePath("/marketing/einstellungen");
    return { ok: true, modified: doc.modified };
  } catch (err) {
    return fehler(err);
  }
}

/** Schalter mit Außenwirkung (Automatik, Kanzlei) – sofort gespeichert nach Bestätigung, Zeitleisten-Eintrag mit Person. */
export async function schalterSetzenAction({ feld, wert }) {
  const z = await zugang(M.EINST, "write", { nurLeitung: true });
  if (z.fehler) return z.fehler;
  const TEXT = { automatik_aktiv: "Kundenreisen-Automatik", kanzlei_fusszeilen_freigegeben: "Kanzlei-Freigabe Fußzeilen", kanzlei_b_einladung_bestaetigt: "Kanzlei-Bestätigung Bestandskunden-Einladung" };
  if (!TEXT[feld]) return invalid({});
  try {
    if (feld === "automatik_aktiv" && wert) {
      const { marketingFaehigkeiten, kurzform } = await import("./faehigkeiten.js");
      const st = kurzform(await marketingFaehigkeiten(z.session, { client: z.client, ueberschreibung: await mockUeberschreibung() }));
      const einst = await M.einstellungen(z.client);
      const b = bereitschaftPunkte({ faehig: { einladungen: st.einladungen, einwilligungKanaele: st.kanaele, bestandskunde: st.bestandskunde, stoppRegeln: st.stoppRegeln, bestaetigungStapel: st.bestaetigungStapel, widerspruch: st.widerspruch, empfehlungAuftrag: st.gutschein, gutschein: st.gutschein, abmeldeToken: st.abmeldeToken, testmailIntern: st.testmailIntern }, einst });
      if (b.p0Offen) return { ok: false, code: "forbidden", message: `Gesperrt: ${b.p0Offen} Punkte vor Livebetrieb offen` };
    }
    await M.schalterSetzen(z.client, { feld, wert: !!wert, text: `${TEXT[feld]} ${wert ? "eingeschaltet" : "ausgeschaltet"} von ${z.session.name || z.session.user}` });
    pfade("/marketing/einstellungen", "/marketing", "/marketing/kundenreisen");
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

export async function auftragsquelleAction() {
  const z = await zugang(M.EINST, "read", { nurLeitung: true });
  if (z.fehler) return z.fehler;
  try {
    return { ok: true, ...(await M.auftragsquellePruefen(z.client)) };
  } catch (err) {
    return fehler(err);
  }
}

/** CSV-Export (nur Leitung, protokolliert als Kommentar am Bezug bzw. im Server-Log). */
export async function csvExportAction({ liste, zeilen = [] }) {
  const session = await getSession();
  if (!session) return { ok: false, code: "auth", message: "Bitte neu anmelden." };
  if (!istLeitung(session)) return { ok: false, code: "forbidden", message: ALLG.nurLeitung };
  const kopf = Object.keys(zeilen[0] || {});
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [kopf.map(esc).join(";"), ...zeilen.slice(0, 10000).map((z) => kopf.map((k) => esc(z[k])).join(";"))].join("\n");
  console.info(`[marketing] CSV exportiert: ${txt(liste, 60)} · ${zeilen.length} Zeilen · ${session.user}`);
  return { ok: true, csv, dateiname: `${txt(liste, 40) || "marketing"}-${new Date().toISOString().slice(0, 10)}.csv` };
}

/** Bild für einen Newsletter-Block (Dropzone): nur eigene Fotos; Fehler je Datei als Satz (P13, Upload-Fehler). */
export async function ausgabeBildAction(formData) {
  const z = await zugang("PH Newsletter Ausgabe", "write");
  if (z.fehler) return z.fehler;
  const name = txt(formData.get("name"), 140);
  const datei = formData.get("datei");
  if (!(datei && typeof datei === "object" && datei.size > 0)) return invalid({ datei: "Bitte ein Bild wählen" });
  if (datei.size > 25 * 1024 * 1024) return invalid({ datei: `Bild ist ${Math.round(datei.size / 1024 / 1024)} MB groß – höchstens 25 MB. Tipp: als JPG exportieren.` }, `Bild ist ${Math.round(datei.size / 1024 / 1024)} MB groß – höchstens 25 MB.`);
  if (/heic|heif/i.test(datei.type || datei.name)) return invalid({ datei: "Format HEIC wird nicht angenommen – bitte JPG oder PNG." }, "Format HEIC wird nicht angenommen – bitte JPG oder PNG.");
  if (!/^image\/(jpeg|png|webp)$/.test(datei.type || "")) return invalid({ datei: "Bitte JPG, PNG oder WebP." }, "Bitte JPG, PNG oder WebP.");
  try {
    const inhalt = new Uint8Array(await datei.arrayBuffer());
    const up = await z.client.uploadFile({ doctype: "PH Newsletter Ausgabe", name, dateiname: txt(datei.name, 140), inhalt, privat: false, typ: datei.type });
    // Mock: kleine Bilder als data-URL, damit Vorschau und Editor sie zeigen (die Mock-Dateien haben keine Auslieferung).
    const url = z.client.modus === "mock" && datei.size < 3 * 1024 * 1024 ? `data:${datei.type};base64,${Buffer.from(inhalt).toString("base64")}` : up.file_url;
    return { ok: true, url };
  } catch (err) {
    return fehler(err);
  }
}
