import "server-only";
// Lesen für den Bereich Projekte (10-konzept-projekte.md § 16.4). Server-only: läuft nur in Server Components und
// Server Actions mit dem Client der Sitzung. Frappe-Modus: `ph_projekte.api.auftragsmappe` (nur die eigenen Listen,
// E8) + Fremdbelege mit expliziten Bezugsfiltern; Mock: dieselbe Struktur aus Listen gebaut.
// Beträge (`*_cent`) nur für Leitung (permlevel 1) – für alle anderen werden sie entfernt, auch im Mock.

import { cache } from "react";
import { backoffice, backofficeService, ladeMeta } from "@/lib/backoffice/frappe";
import { IS_PRODUCTION } from "@/lib/backoffice/config";
import projekteNachlauf from "@/lib/backoffice/mock/seed/projekte";
import { erzeugeDokument, rng, tage } from "@/lib/backoffice/mock/seed/basis";
import { neuerName } from "@/lib/backoffice/mock/engine";
import { darf } from "@/lib/backoffice/auth/rechte";
import { DEMO_BENUTZER } from "@/lib/backoffice/auth/mockUsers";
import { FREMDBELEGE, bezugStatus, erlaubteFelder, verwirftFremdeKontakte } from "./bezug.js";
import { kalkulationAusMappe } from "./mappe.js";
import { rueckmeldungen } from "./zaehler.js";
import { maengelListe } from "./maengel.js";
import { initialen } from "@/components/Backoffice/Avatar";

/**
 * Client des Bereichs. Im Mock (nur Entwicklung) wird ein vor dem Projekte-Seed gestarteter Speicher einmalig um
 * die Projekte-Beispieldaten ergänzt (Seed-Stand „PH Kostenart: Ware“), ohne den Dev-Server neu zu starten.
 */
export function projekteClient(session) {
  const client = backoffice(session);
  if (client.modus === "mock" && !IS_PRODUCTION) seedNachziehen(client);
  return client;
}

function seedNachziehen(client) {
  const speicher = client.db;
  if (!speicher?.db || speicher.__projekteSeed) return;
  speicher.__projekteSeed = true;
  if (speicher.db.get("PH Kostenart")?.has("Ware")) return;
  const tabelle = (dt) => {
    if (!speicher.db.has(dt)) speicher.db.set(dt, new Map());
    return speicher.db.get(dt);
  };
  const naechste = (prefix) => {
    const n = (speicher.zaehler.get(prefix) || 0) + 1;
    speicher.zaehler.set(prefix, n);
    return n;
  };
  try {
    projekteNachlauf(speicher.db, { rng: rng(4711), tage, index: client.index, tabelle, naechste, erzeugeDokument, neuerName, kontakte: [...(speicher.db.get("PH Kontakt")?.values() || [])] });
  } catch (err) {
    console.error("[projekte] Mock-Seed nachziehen fehlgeschlagen", err?.message || err);
  }
}

/** Leitung des Bereichs (Beträge, Beauftragen, Abschließen, Zurücksetzen, Kalkulation). */
export function istLeitung(session) {
  return darf(session, "projekte", "cancel");
}

/** Heute als ISO-Tag (Server-Zeit, Europe/Vienna). */
export function heuteIso(jetzt = new Date()) {
  const t = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Vienna", year: "numeric", month: "2-digit", day: "2-digit" }).format(jetzt);
  return t.slice(0, 10);
}

const ohneBetraege = (doc, leitung) => {
  if (leitung || !doc || typeof doc !== "object") return doc;
  const out = {};
  for (const [k, v] of Object.entries(doc)) {
    if (/_cent$/.test(k) || k === "kalk_budget" || k.startsWith("kalk_") || k === "notiz_intern") continue;
    out[k] = Array.isArray(v) ? v.map((z) => (z && typeof z === "object" ? ohneBetraege(z, false) : z)) : v;
  }
  return out;
};

async function sicher(fn, ersatz) {
  try {
    return await fn();
  } catch {
    return ersatz;
  }
}

// --------------------------------------------------------------------- Personen --

/** Anzeige-Namen für User-IDs (E-Mail) → { email: { name, kuerzel } }. Rollen-Zusatz in Klammern entfällt. */
export async function personen(client, users = []) {
  const liste = [...new Set(users.filter(Boolean))];
  const out = {};
  const setze = (email, name) => {
    const n = String(name || email.split("@")[0]).replace(/\s*\(.*\)\s*$/, "").trim();
    out[email] = { name: n, kuerzel: initialen(n), email };
  };
  if (client.modus !== "frappe") {
    for (const e of liste) setze(e, DEMO_BENUTZER.find((u) => u.email === e)?.name);
    return out;
  }
  const zeilen = await sicher(() => client.getList("User", { fields: ["name", "full_name"], filters: [["name", "in", liste]], limit: liste.length }), []);
  for (const e of liste) setze(e, zeilen.find((z) => z.name === e)?.full_name);
  return out;
}

// ---------------------------------------------------------------------- Mappe --

const LISTEN = {
  planungen: ["PH Planung", ["name", "titel", "bezeichnung", "version", "status", "quelle_planung", "datei", "vorschau", "kunde_entscheidung", "kunde_kommentar", "vorgelegt_am", "vorgaenger", "kunde_sichtbar", "modified"], "version desc"],
  renderings: ["PH Rendering", ["name", "titel", "bezeichnung", "planung", "variante", "version", "status", "bild", "ki_generiert", "feedback_offen", "feedback_anzahl", "votes_up", "votes_down", "vorgelegt_am", "freigabe_feedback", "kunde_sichtbar", "modified"], "variante asc"],
  dokumente: ["PH Projekt Dokument", ["name", "titel", "kategorie", "status", "datum", "datei", "dateiname", "mime", "groesse", "kunde_sichtbar", "version"], "datum desc"],
  fotos: ["PH Tagebuch Foto", ["name", "titel", "phase", "von", "autor", "hochgeladen_am", "bild"], "hochgeladen_am desc"],
  aufgaben: ["PH Projekt Aufgabe", ["name", "titel", "status", "faellig", "zugewiesen_an", "prioritaet", "art"], "faellig asc"],
  zeiten: ["PH Projektzeit", ["name", "datum", "user", "taetigkeit", "dauer_min", "status", "abrechenbar", "montageauftrag", "beschreibung"], "datum desc"],
  nachrichten: ["PH Projekt Nachricht", ["name", "richtung", "autor", "text", "gesendet_am", "status"], "gesendet_am desc"],
  aufmasse: ["PH Aufmass", ["name", "titel", "status", "datum", "aufgenommen_von", "plausibilitaet", "geprueft_am"], "datum desc"],
  nachtraege: ["PH Nachtrag", ["name", "titel", "bezeichnung", "status", "datum", "differenz_cent", "vorgelegt_am", "entscheidung_am", "freigabe_frist", "uebernommen", "nummer_im_projekt", "projekt"], "nummer_im_projekt asc"],
  referenzen: ["PH Referenz", ["name", "titel", "status", "eingereicht_am"], "eingereicht_am desc"],
  produktpaesse: ["PH Produktpass", ["name", "titel", "status", "lieferdatum", "garantie_bis", "position"], "creation asc"],
  feedback: ["PH Rendering Feedback", ["name", "titel", "art", "von", "status", "rendering", "erstellt_am", "text", "autor", "projekt"], "erstellt_am desc"],
};
const VOLL = { montagen: "PH Montageauftrag", gewerke: "PH Fremdgewerk", abnahmen: "PH Abnahme" };

/**
 * Auftragsmappe laden. Wirft BackofficeError (not_found/forbidden) – die Seite bildet sie ab.
 * @returns {Promise<object>} { projekt, kontakt, phasen, positionen, raeume, team, budget, planungen, …, fremd, bezug, leitung }
 */
export const ladeMappe = cache(async (client, name, { leitung = false } = {}) => {
  const projekt = await client.getDoc("PH Projekt", name);
  let listen = {};
  let kontakt = null;
  if (client.modus === "frappe") {
    const am = await client.call("ph_projekte.api.auftragsmappe", { projekt: name });
    // E8: aus dem Aggregat nur die ph_projekte-eigenen Listen; Fremdbelege lädt ladeFremdbelege() selbst.
    listen = Object.fromEntries(Object.keys(LISTEN).map((k) => [k, am[k === "feedback" ? "feedback_offen" : k] || []]));
    kontakt = am.kontakt || null;
  } else {
    const paare = await Promise.all(Object.entries(LISTEN).map(async ([k, [dt, fields, orderBy]]) => [k, await sicher(() => client.getList(dt, { fields, filters: [["projekt", "=", name]], orderBy, limit: 200 }), [])]));
    listen = Object.fromEntries(paare);
    kontakt = await sicher(() => backofficeService().getDoc("PH Kontakt", projekt.kontakt), null);
  }
  const voll = Object.fromEntries(
    await Promise.all(
      Object.entries(VOLL).map(async ([k, dt]) => {
        const namen = await sicher(() => client.getList(dt, { fields: ["name"], filters: [["projekt", "=", name]], orderBy: "modified desc", limit: 30 }), []);
        const docs = await Promise.all(namen.map((n) => sicher(() => client.getDoc(dt, n.name), null)));
        return [k, docs.filter(Boolean).map((d) => ohneBetraege(d, leitung))];
      })
    )
  );
  const k = kontakt
    ? { name: kontakt.name, vorname: kontakt.vorname, nachname: kontakt.nachname, firma: kontakt.firma, email: kontakt.email || "", telefon: kontakt.telefon || kontakt.mobil || "", ort: kontakt.ort, sprache: kontakt.sprache || "de", kommunikation_bevorzugt: kontakt.kommunikation_bevorzugt || "" }
    : null;
  const p = ohneBetraege(projekt, leitung);
  const feedback = (listen.feedback || []).filter((f) => f.von === "kunde" && f.art !== "vote" && f.status === "Offen");
  const m = {
    projekt: p,
    kontakt: k,
    leitung,
    phasen: projekt.phasen_verlauf || [],
    positionen: p.positionen || [],
    raeume: p.raeume || [],
    team: p.team || [],
    budget: leitung ? projekt.kalk_budget || [] : [],
    ...listen,
    nachtraege: (listen.nachtraege || []).map((n) => ohneBetraege(n, leitung)),
    feedback_offen: feedback,
    feedback_alle: listen.feedback || [],
    ...voll,
  };
  const fremd = await ladeFremdbelege(client, { projekt: name, kontakt: projekt.kontakt, leitung });
  return { ...m, ...fremd.listen, bezug: fremd.status, verworfen: fremd.verworfen };
});

/** Fremdbelege mit Bezugsfiltern und Kontaktprüfung (E8). Status je Abschnitt: ok | app-fehlt | nicht-verknuepft | fehler | kein-recht. */
export async function ladeFremdbelege(client, { projekt, kontakt, leitung }) {
  const listen = {};
  const status = {};
  let verworfen = 0;
  await Promise.all(
    Object.entries(FREMDBELEGE).map(async ([key, def]) => {
      const meta = await sicher(() => ladeMeta(client, def.doctype), null);
      const s = bezugStatus(def, meta);
      status[key] = s;
      listen[key] = [];
      if (s !== "ok") return;
      try {
        const zeilen = await client.getList(def.doctype, { fields: erlaubteFelder(def, meta, { leitung }), filters: def.filter(projekt), orderBy: def.sort, limit: 50 });
        const r = verwirftFremdeKontakte(zeilen, { kontakt, kontaktFeld: def.kontaktFeld, leitung });
        listen[key] = r.zeilen;
        verworfen += r.verworfen;
      } catch (err) {
        status[key] = err?.code === "forbidden" ? "kein-recht" : "fehler";
      }
    })
  );
  if (verworfen) console.warn(`[projekte] Fremdbelege: ${verworfen} Zeilen mit fremdem Kontakt verworfen (Projekt ${projekt}).`);
  return { listen, status, verworfen };
}

/** Kontakt des Projekts kurz (E-Mail-Prüfung § 3.5). Frappe: über die Auftragsmappe (Projekte lesen PH Kontakt nicht direkt). */
export async function kontaktKurz(client, projekt, kontaktName) {
  if (client.modus === "frappe") {
    const am = await sicher(() => client.call("ph_projekte.api.auftragsmappe", { projekt }), null);
    return am?.kontakt || null;
  }
  return sicher(() => backofficeService().getDoc("PH Kontakt", kontaktName), null);
}

/** Kommentare/Verlauf des Projekts (docinfo). */
export async function ladeVerlauf(client, name) {
  const r = await sicher(() => client.getDocMitInfo("PH Projekt", name), null);
  return r?.docinfo?.comments || [];
}

// ------------------------------------------------------------------ Nachkalkulation --

/** Nachkalkulation (nur Leitung). Frappe: projekt_kalkulation_v2; Mock: aus der Mappe gerechnet. */
export async function ladeKalkulation(client, m, { heute }) {
  if (client.modus === "frappe") return client.call("ph_projekte.api.projekt_kalkulation_v2", { projekt: m.projekt.name });
  const [einst, kostenarten] = await Promise.all([
    sicher(() => client.getDoc("PH Projekte Einstellungen", "PH Projekte Einstellungen"), {}),
    sicher(() => client.getList("PH Kostenart", { fields: ["name", "bezeichnung", "db_stufe", "reihenfolge"], limit: 50 }), []),
  ]);
  return kalkulationAusMappe(m, { einstellungen: einst, kostenarten, stichtag: heute });
}

// ------------------------------------------------------------------ Bereich --

export const PROJEKT_FELDER = ["name", "titel", "projektart", "status", "prioritaet", "kunde_name", "kontakt", "berater", "planer", "montageleiter", "objekt_ort", "objekt_land", "liefertermin_geplant", "montage_von", "montage_bis", "uebergabe_am", "eingang", "modified", "portal_sichtbar"];

/** Alle Projekte (für Listen, Kanban, Zeitplan) – Bereich hat wenige hundert Projekte. */
export const ladeProjekte = cache(async (client, { filters = [], limit = 500 } = {}) => client.getList("PH Projekt", { fields: PROJEKT_FELDER, filters, orderBy: "eingang desc", limit }));

/** Montagen mit Kindtabellen (Team, Leistungen, Mängel) im Zeitraum (Start ISO-Tage). */
export const ladeMontagen = cache(async (client, { von, bis, filters = [] } = {}) => {
  const f = [...filters];
  if (von) f.push(["start", ">=", `${von} 00:00:00`]);
  if (bis) f.push(["start", "<=", `${bis} 23:59:59`]);
  const namen = await client.getList("PH Montageauftrag", { fields: ["name"], filters: f, orderBy: "start asc", limit: 200 });
  const docs = await Promise.all(namen.map((n) => sicher(() => client.getDoc("PH Montageauftrag", n.name), null)));
  return docs.filter(Boolean);
});

/** Offene Rückmeldungen (eine Formel für Pill, Kennzahl, Inbox, Glocke – § 3.6). */
export const ladeRueckmeldungen = cache(async (client, { heute, projekt = null, nurProjekte = null } = {}) => {
  const pf = projekt ? [["projekt", "=", projekt]] : [];
  const [feedback, nachrichten, nachtraege, planungen, einst] = await Promise.all([
    sicher(() => client.getList("PH Rendering Feedback", { fields: ["name", "titel", "art", "von", "status", "rendering", "erstellt_am", "text", "autor", "projekt", "punkt_x", "punkt_y", "audio_dauer_s", "creation"], filters: [...pf, ["status", "=", "Offen"]], orderBy: "erstellt_am asc", limit: 300 }), []),
    sicher(() => client.getList("PH Projekt Nachricht", { fields: ["name", "richtung", "status", "text", "autor", "projekt", "gesendet_am", "creation"], filters: [...pf, ["status", "=", "Ungelesen"]], orderBy: "gesendet_am asc", limit: 300 }), []),
    sicher(() => client.getList("PH Nachtrag", { fields: ["name", "titel", "bezeichnung", "status", "uebernommen", "entscheidung_am", "projekt"], filters: [...pf, ["status", "in", ["Freigegeben", "Abgelehnt"]]], limit: 300 }), []),
    sicher(() => client.getList("PH Planung", { fields: ["name", "titel", "status", "kunde_entscheidung", "kunde_kommentar", "projekt", "vorgelegt_am", "modified"], filters: [...pf, ["status", "=", "Kunde vorgelegt"]], limit: 300 }), []),
    sicher(() => client.getDoc("PH Projekte Einstellungen", "PH Projekte Einstellungen"), {}),
  ]);
  return rueckmeldungen({ feedback, nachrichten, nachtraege, planungen }, { heute, nurProjekte, erinnerungTage: Number(einst.feedback_erinnerung_tage) || 3 });
});

/** Mängel aus drei Quellen (alle offenen). */
export const ladeMaengel = cache(async (client, { heute, projekt = null, nurOffen = true } = {}) => {
  const pf = projekt ? [["projekt", "=", projekt]] : [];
  const voll = async (dt, filter) => {
    const namen = await sicher(() => client.getList(dt, { fields: ["name"], filters: [...pf, ...filter], limit: 300 }), []);
    return (await Promise.all(namen.map((n) => sicher(() => client.getDoc(dt, n.name), null)))).filter(Boolean);
  };
  const [montagen, abnahmen, gewerke] = await Promise.all([voll("PH Montageauftrag", [["status", "!=", "Abgebrochen"]]), voll("PH Abnahme", []), voll("PH Fremdgewerk", [["status", "!=", "Abgesagt"]])]);
  return maengelListe({ montagen, abnahmen, gewerke }, { heute, nurOffen });
});

/** Einstellungen des Bereichs (Single). */
export const ladeEinstellungen = cache(async (client) => sicher(() => client.getDoc("PH Projekte Einstellungen", "PH Projekte Einstellungen"), {}));

/** Projekte der Sitzung („Nur meine“): Berater, Planer, Montageleiter oder im Team. */
export function istMeinProjekt(p, user, teamVon = null) {
  if (!user) return false;
  if ([p.berater, p.planer, p.montageleiter].includes(user)) return true;
  return !!teamVon?.(p)?.some((t) => t.user === user);
}

// ------------------------------------------------------------------ Zeilen für Listen (Übersicht, Liste) --

/**
 * Projekte mit Bild, nächstem Termin, Zählern und (optional) Empfohlen – für Übersicht und Liste.
 * @returns {Promise<Array<object>>}
 */
export async function ladeProjektZeilen(client, session, { heute, filters = [], mitEmpfohlen = false, limit = 500, nurMeine = false } = {}) {
  const { empfehlungen, primaerEmpfehlung } = await import("./empfohlen.js");
  const { naechsterTermin } = await import("./mappe.js");
  const [projekte, fotos, montagen, rueck, maengel] = await Promise.all([
    ladeProjekte(client, { filters, limit }),
    sicher(() => client.getList("PH Tagebuch Foto", { fields: ["projekt", "bild", "hochgeladen_am"], orderBy: "hochgeladen_am desc", limit: 1000 }), []),
    sicher(() => client.getList("PH Montageauftrag", { fields: ["name", "projekt", "start", "ende", "status"], filters: [["status", "!=", "Abgebrochen"]], orderBy: "start asc", limit: 1000 }), []),
    ladeRueckmeldungen(client, { heute }),
    ladeMaengel(client, { heute }),
  ]);
  const zeilen = projekte.filter((p) => !nurMeine || istMeinProjekt(p, session.user));
  const bild = new Map();
  for (const f of fotos) if (f.bild && !bild.has(f.projekt)) bild.set(f.projekt, f.bild);
  const leute = await personen(client, zeilen.flatMap((p) => [p.berater, p.planer, p.montageleiter]));
  const out = [];
  for (const p of zeilen) {
    const mon = montagen.filter((m) => m.projekt === p.name);
    const naechste = mon.find((m) => String(m.ende || m.start).slice(0, 10) >= heute);
    const termin = naechste ? { titel: `Montage ${naechste.status === "In Arbeit" ? "läuft" : ""}`.trim(), start: naechste.start } : p.liefertermin_geplant && p.liefertermin_geplant >= heute ? { titel: "Lieferung", start: p.liefertermin_geplant } : null;
    let empfohlen = null;
    if (mitEmpfohlen) {
      try {
        const m = await ladeMappe(client, p.name, { leitung: istLeitung(session) });
        const liste = empfehlungen(m, { heute, leitung: istLeitung(session) });
        empfohlen = primaerEmpfehlung(liste) || liste[0] || null;
        const t = naechsterTermin(m, heute);
        if (t) out.push({ ...basis(), termin: { titel: t.titel, start: t.start }, empfohlen });
        else out.push({ ...basis(), termin, empfohlen });
        continue;
      } catch {
        empfohlen = null;
      }
    }
    out.push({ ...basis(), termin, empfohlen });
    function basis() {
      return {
        ...p,
        bild: bild.get(p.name) || "",
        team: [p.berater, p.planer, p.montageleiter].filter(Boolean).map((u) => leute[u]).filter(Boolean),
        rueckmeldungen: rueck.filter((r) => r.projekt === p.name).length,
        maengel: maengel.filter((x) => x.projekt === p.name).length,
      };
    }
  }
  return out;
}

