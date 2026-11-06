import "server-only";
// Datenschicht des Bereichs Kundenkarte (Konzept §9): lädt über backoffice(session), filtert Felder je Rolle
// (felder.js) **vor** der Rückgabe an Seiten/Client und liefert fertige, serialisierbare Objekte.
// Mock und Frappe laufen über dieselben Aufrufe; ph_kundenkarte-Methoden über methoden.js.
// Simulation (nur Mock außerhalb Produktion): ?sim=leer | ?sim=fehler für Screenshot-Abnahme der Leer-/Fehlerzustände.

import { backoffice } from "@/lib/backoffice/frappe";
import nachsaat, { istGesaet } from "@/lib/backoffice/mock/seed/kundenkarte";
import { tage } from "@/lib/backoffice/mock/seed/basis";
import { BackofficeError, istBackofficeError } from "@/lib/backoffice/frappe/errors";
import { faehigkeiten } from "@/lib/backoffice/faehigkeiten";
import { isoDatum, isoDatumZeit } from "@/lib/backoffice/format";
import { DT, OFFENE_STATUS, EREIGNIS_ART } from "./labels";
import { ANTRAG_LISTENFELDER, KARTEN_LISTENFELDER, KARTEN_LISTENFELDER_BETRAG, filtereAntrag, filtereEinloesung, filtereKarte } from "./felder";
import { KUNDENKARTE } from "./faehigkeiten";
import { M, aufruf, methode } from "./methoden";
import { normalisiereKartennummer, istKartennummer } from "./kartennummer";
import { antragReiter, bezugsTypen, darfBetraege, kontaktTreffer, maskiereName, rolleVon, stufenplanFehler, tageSeit, vorteileFuerStufe, widersprueche } from "./regeln";

export const SEITE_GROESSE = 25;

/** Kontext einer Seite/Action: Client, Rolle, Benutzer, Simulation. */
export function kontext(session, sp = {}) {
  const client = backoffice(session);
  sichereMockSeed(client);
  const sim = client.modus !== "frappe" && process.env.NODE_ENV !== "production" && ["leer", "fehler"].includes(sp?.sim) ? sp.sim : null;
  return { client, session, rolle: rolleVon(session), user: session.user, sim, jetzt: client.jetzt ? client.jetzt() : new Date() };
}

/**
 * Mock: Läuft der Dev-Server schon mit einer Datenbank von vor dem B-KKA-Seed (Prozess-global, kein Neustart
 * erlaubt), wird der Festbestand einmalig nachgesät – nur Kundenkarten-Tabellen (+ Spiegel am Kontakt).
 */
function sichereMockSeed(client) {
  if (client?.modus === "frappe" || !client?.db?.db || istGesaet(client.db.db)) return;
  const db = client.db.db;
  const tabelle = (dt) => {
    if (!db.has(dt)) db.set(dt, new Map());
    return db.get(dt);
  };
  nachsaat(db, { tabelle, naechste: (p) => client.naechsteNummer(p), tage, kontakte: [] });
}

function simuliere(ctx) {
  if (ctx.sim === "fehler") throw new BackofficeError("unavailable", "Daten gerade nicht erreichbar.");
}
const leer = (ctx) => ctx.sim === "leer";

/** Fehler in serialisierbare Form für Seiten (`{code, message}`). */
export function alsFehler(err) {
  if (istBackofficeError(err)) return { code: err.code, message: err.message };
  console.error("[kundenkarte]", err?.name || err);
  return { code: "unavailable", message: "Daten gerade nicht erreichbar." };
}

/** Lädt sicher: { ok, daten } oder { ok:false, fehler }. Für Kacheln mit eigenem Fehlerblock. */
export async function sicher(fn) {
  try {
    return { ok: true, daten: await fn() };
  } catch (err) {
    return { ok: false, fehler: alsFehler(err) };
  }
}

export async function ladeFaehigkeiten(ctx) {
  return faehigkeiten(ctx.session, Object.keys(KUNDENKARTE), { katalog: KUNDENKARTE, client: ctx.client });
}

// ---------------------------------------------------------------- Stamm --

export async function ladeStufen(ctx) {
  const liste = await ctx.client.getList(DT.stufe, { fields: ["name"], orderBy: "reihenfolge asc", limit: 50 });
  const docs = await Promise.all(liste.map((s) => ctx.client.getDoc(DT.stufe, s.name)));
  return docs
    .sort((a, b) => Number(a.reihenfolge) - Number(b.reihenfolge))
    .map((s) => ({
      name: s.name,
      stufenname: s.stufenname || s.name,
      reihenfolge: Number(s.reihenfolge) || 0,
      aktiv: Number(s.aktiv ?? 1),
      ...(darfBetraege(ctx.rolle) ? { schwelle_jahresumsatz_cent: Number(s.schwelle_jahresumsatz_cent) || 0 } : {}),
      farbe: s.farbe || "",
      beschreibung_kunde: s.beschreibung_kunde || "",
      beschreibung_intern: s.beschreibung_intern || "",
      vorteile: (s.vorteile || []).map((z) => ({ vorteil: z.vorteil, hinweis: z.hinweis || "" })),
      modified: s.modified,
    }));
}

export async function ladeVorteile(ctx) {
  return ctx.client.getList(DT.vorteil, { fields: ["name", "titel", "art", "aktiv", "einloesbar_pro_jahr", "gilt_ab_stufe", "reihenfolge", "beschreibung_kunde", "beschreibung_intern", "modified"], orderBy: "reihenfolge asc", limit: 200 });
}

export async function ladeEinstellungen(ctx) {
  try {
    return await ctx.client.getDoc(DT.einstellungen, DT.einstellungen);
  } catch (err) {
    if (istBackofficeError(err) && err.code === "not_found") return {};
    throw err;
  }
}

/** Benutzer für die Berater-Auswahl (nur Name/Anzeige). Ohne Leserecht auf „User“: Mock liest die Demo-Benutzer,
 * Frappe fällt auf die an Karten eingetragenen Berater zurück (Anzeige aus der Adresse). */
export async function ladeBerater(ctx) {
  const sauber = (liste) => liste.filter((x) => !/^(Administrator|Guest)$/.test(x.name)).map((x) => ({ wert: x.name, titel: String(x.full_name || x.name).replace(/\s*\(.*\)$/, "") }));
  try {
    const u = await ctx.client.getList("User", { fields: ["name", "full_name"], filters: [["enabled", "=", 1], ["user_type", "=", "System User"]], limit: 100, orderBy: "full_name asc" });
    return sauber(u);
  } catch {
    if (ctx.client.modus !== "frappe" && ctx.client.db?.db?.get("User")) return sauber([...ctx.client.db.db.get("User").values()]).sort((a, b) => a.titel.localeCompare(b.titel));
    const k = await ctx.client.getList(DT.karte, { fields: ["persoenlicher_berater"], filters: [["persoenlicher_berater", "is", "set"]], limit: 2000 }).catch(() => []);
    const werte = [...new Set([ctx.user, ...k.map((x) => x.persoenlicher_berater)].filter(Boolean))];
    return werte.map((w) => ({ wert: w, titel: w === ctx.user ? ctx.session.name || w : String(w).split("@")[0] })).sort((a, b) => a.titel.localeCompare(b.titel));
  }
}

export function beraterName(berater, wert) {
  return berater.find((b) => b.wert === wert)?.titel || (wert ? String(wert).split("@")[0] : "");
}

// --------------------------------------------------------------- Übersicht --

export async function ladeUebersicht(ctx) {
  simuliere(ctx);
  const c = ctx.client;
  const heute = isoDatum(ctx.jetzt);
  const vor30 = new Date(ctx.jetzt);
  vor30.setDate(vor30.getDate() - 30);
  const [aktive, neue30, einl30, storniert30, zuEntscheiden, einlHeute, geburtstage, gesamt] = await Promise.all([
    c.count(DT.karte, { filters: [["status", "=", "Aktiv"]] }),
    c.count(DT.karte, { filters: [["ausgestellt_am", ">=", isoDatum(vor30)]] }),
    aufruf(c, M.einloesungen_30_tage, {}).catch(() => null),
    c.count(DT.einloesung, { filters: [["status", "=", "Storniert"], ["eingeloest_am", ">=", isoDatumZeit(vor30)]] }),
    c.count(DT.antrag, { orFilters: undefined, filters: [["status", "in", ["Neu", "Bestaetigt"]]] }).then(async (n) => n - (await c.count(DT.antrag, { filters: [["status", "=", "Neu"], ["doi_noetig", "=", 1]] }))),
    c.count(DT.einloesung, { filters: [["status", "=", "Eingeloest"], ["eingeloest_am", ">=", `${heute} 00:00:00`]] }),
    c.count(DT.aufgabe, { filters: [["referenz_doctype", "=", DT.karte], ["faellig", "=", heute], ["status", "=", "Offen"], ["titel", "like", "Geburtstag%"]] }).catch(() => 0),
    c.count(DT.karte, {}),
  ]);
  if (leer(ctx)) return { leer: true, heute: { zuEntscheiden: 0, geburtstage: 0, einlHeute: 0 }, kennzahlen: { aktive: 0, neue30: 0, einl30: 0, storniert30: 0 }, jeStufe: [], jeMonat: [] };
  const karten = await c.getList(DT.karte, { fields: ["name", "stufe", "status", "ausgestellt_am", "creation"], limit: 5000 });
  const stufen = await ladeStufen(ctx);
  const jeStufe = stufen.filter((s) => s.aktiv).map((s) => ({ label: s.stufenname, wert: karten.filter((k) => k.stufe === s.name && ["Aktiv", "Gesperrt"].includes(k.status)).length, farbe: s.farbe }));
  const jeMonat = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(ctx.jetzt.getFullYear(), ctx.jetzt.getMonth() - i, 1);
    const key = isoDatum(d).slice(0, 7);
    jeMonat.push({ label: d.toLocaleDateString("de-AT", { month: "short" }).replace(".", ""), wert: karten.filter((k) => String(k.ausgestellt_am || "").startsWith(key)).length });
  }
  return { leer: gesamt === 0, heute: { zuEntscheiden, geburtstage, einlHeute }, kennzahlen: { aktive, neue30, einl30, storniert30 }, jeStufe, jeMonat };
}

/** Zu tun (nur Kundenvorgänge, max. 6) – je Zeile Zahl, Satz, Ziel. */
export async function ladeZuTun(ctx) {
  simuliere(ctx);
  if (leer(ctx)) return [];
  const c = ctx.client;
  const vor2 = new Date(ctx.jetzt);
  vor2.setDate(vor2.getDate() - 2);
  const vor7 = new Date(ctx.jetzt);
  vor7.setDate(vor7.getDate() - 7);
  const vor30 = new Date(ctx.jetzt);
  vor30.setDate(vor30.getDate() - 30);
  const [antraegeAlt, offeneAntraege, ohneBerater, uebergabe, gesperrt] = await Promise.all([
    c.count(DT.antrag, { filters: [["status", "=", "Bestaetigt"], ["eingang", "<", isoDatumZeit(vor2)]] }),
    c.getList(DT.antrag, { fields: ["name", "email", "nachname", "vorname", "plz", "kontakt", "status", "doi_noetig"], filters: [["status", "in", ["Neu", "Bestaetigt"]]], limit: 100 }),
    c.count(DT.karte, { filters: [["status", "=", "Aktiv"], ["persoenlicher_berater", "is", "not set"]] }),
    c.count(DT.karte, { filters: [["status", "=", "Beantragt"], ["creation", "<", isoDatumZeit(vor7)]] }),
    c.count(DT.karte, { filters: [["status", "=", "Gesperrt"], ["gesperrt_am", "<", isoDatumZeit(vor30)]] }),
  ]);
  let andererName = 0;
  for (const a of offeneAntraege.filter((x) => antragReiter(x) === "entscheiden" && !x.kontakt && x.email)) {
    if (kontaktTreffer(a, await aehnlicheKontakte(ctx, a)).andererName) andererName++;
  }
  const zeilen = [
    { id: "antraege", n: antraegeAlt, icon: "Inbox", ton: "cognac", href: "/kundenkarte/antraege?reiter=entscheiden", knopf: "Entscheiden" },
    { id: "andererName", n: andererName, icon: "Users", ton: "eiche", href: "/kundenkarte/antraege?reiter=entscheiden", knopf: "Prüfen" },
    { id: "ohneBerater", n: ohneBerater, icon: "UserPlus", ton: "see", href: "/kundenkarte/karten?reiter=ohneBerater", knopf: "Zuweisen" },
    { id: "uebergabe", n: uebergabe, icon: "Hourglass", ton: "eiche", href: "/kundenkarte/karten?reiter=uebergabe", knopf: "Öffnen" },
  ];
  if (ctx.rolle === "leitung") zeilen.push({ id: "gesperrt", n: gesperrt, icon: "Lock", ton: "ziegel", href: "/kundenkarte/karten?status=Gesperrt", knopf: "Prüfen" });
  return zeilen.filter((z) => z.n > 0).slice(0, 6);
}

/** Einrichtungs-Checkliste (nur Leitung). */
export async function ladeEinrichtung(ctx) {
  if (ctx.rolle !== "leitung") return null;
  const [stufen, vorteile, e] = await Promise.all([ladeStufen(ctx), ladeVorteile(ctx), ladeEinstellungen(ctx)]);
  const erledigt = {
    stufen: stufen.length > 0,
    vorteile: vorteile.length > 0,
    bedingungen: Boolean(e.bedingungen_version),
    datenschutz: Boolean(e.text_datenschutz_karte),
    einwilligung: true, // Version kommt bis zum eigenen Feld aus der Konfiguration (texte.js) – vorhanden
    wallet: Boolean(e.wallet_pass_type_id && e.wallet_team_id),
  };
  return erledigt;
}

/** Zuletzt geändert: Karten, Anträge, Einlösungen (lesbar, max. 10). */
export async function ladeZuletzt(ctx) {
  simuliere(ctx);
  if (leer(ctx)) return [];
  const c = ctx.client;
  const [k, a, e] = await Promise.all([
    c.getList(DT.karte, { fields: ["name", "kunde_name", "status", "modified", "modified_by"], orderBy: "modified desc", limit: 6 }),
    c.getList(DT.antrag, { fields: ["name", "vorname", "nachname", "status", "modified", "modified_by"], orderBy: "modified desc", limit: 4 }),
    c.getList(DT.einloesung, { fields: ["name", "kunde_name", "vorteil_titel", "status", "modified", "modified_by", "kundenkarte"], orderBy: "modified desc", limit: 5 }),
  ]);
  return [
    ...k.map((x) => ({ art: "karte", name: x.name, titel: x.kunde_name || x.name, unter: `Karte ${x.name}`, status: x.status, zeit: x.modified, wer: x.modified_by, href: `/kundenkarte/karten/${x.name}` })),
    ...a.map((x) => ({ art: "antrag", name: x.name, titel: `${x.vorname} ${x.nachname}`, unter: `Antrag ${x.name}`, status: x.status, zeit: x.modified, wer: x.modified_by, href: `/kundenkarte/antraege/${x.name}` })),
    ...e.map((x) => ({ art: "einloesung", name: x.name, titel: x.vorteil_titel || x.name, unter: x.kunde_name || x.kundenkarte, status: x.status, zeit: x.modified, wer: x.modified_by, href: `/kundenkarte/einloesungen/${x.name}` })),
  ]
    .sort((x, y) => String(y.zeit).localeCompare(String(x.zeit)))
    .slice(0, 10);
}

// ---------------------------------------------------------------- Anträge --

/**
 * Ähnliche Kontakte über die Antrag-Methode kontakt_suchen (läuft im Backend ohne Kontakt-Leserecht und liefert
 * die E-Mail nur maskiert). Treffer der E-Mail-Suche erkennt man am gleichen Anfangsbuchstaben der Maske.
 */
export async function aehnlicheKontakte(ctx, antrag) {
  const liste = await methode(ctx.client, DT.antrag, antrag.name, "kontakt_suchen", {}).catch(() => []);
  const email = String(antrag.email || "").toLowerCase();
  return (Array.isArray(liste) ? liste : []).map((k) => ({
    name: k.name,
    titel: k.titel,
    nachname: String(k.titel || "").trim().split(/\s+/).slice(-1)[0] || "",
    email: email && String(k.email || "").toLowerCase().startsWith(email[0]) ? email : "",
    plz: k.plz,
    ort: k.ort,
  }));
}

export async function ladeAntraege(ctx, { reiter = "entscheiden", q = "", quelle = "", seite = 1 } = {}) {
  simuliere(ctx);
  const c = ctx.client;
  const basis = [];
  if (quelle) basis.push(["quelle", "=", quelle]);
  const orFilters = q ? [["vorname", "like", `%${q}%`], ["nachname", "like", `%${q}%`], ["plz", "like", `%${q}%`], ["ort", "like", `%${q}%`], ["name", "like", `%${q}%`]] : undefined;
  const alle = leer(ctx) ? [] : await c.getList(DT.antrag, { fields: [...ANTRAG_LISTENFELDER, "email"], filters: basis, orFilters, orderBy: "eingang desc", limit: 500 });
  const zaehler = { entscheiden: 0, mail: 0, erledigt: 0 };
  for (const a of alle) zaehler[antragReiter(a)]++;
  const passend = alle.filter((a) => antragReiter(a) === reiter);
  const start = (Math.max(1, seite) - 1) * SEITE_GROESSE;
  const zeilen = passend.slice(start, start + SEITE_GROESSE);
  // Hinweise (serverseitig, E-Mail verlässt den Server nicht)
  const karten = await c.getList(DT.karte, { fields: ["name", "kontakt", "status"], filters: [["status", "in", OFFENE_STATUS]], limit: 5000 });
  const karteZuKontakt = new Map(karten.map((k) => [k.kontakt, k.name]));
  const mitHinweis = [];
  for (const a of zeilen) {
    let hinweis = null;
    if (reiter !== "erledigt") {
      if (a.kontakt && karteZuKontakt.has(a.kontakt)) hinweis = { art: "karte", karte: karteZuKontakt.get(a.kontakt) };
      else if (a.email) {
        const t = kontaktTreffer(a, await aehnlicheKontakte(ctx, a));
        if (t.andererName) hinweis = { art: "name", name: maskiereName(t.andererName.titel) };
      }
    }
    mitHinweis.push({ ...filtereAntrag(a, ctx.rolle, { liste: true }), hinweis, wartetTage: tageSeit(a.eingang, ctx.jetzt) });
  }
  const gesamtAlle = alle.length;
  return { zeilen: mitHinweis, gesamt: passend.length, zaehler, gesamtAlle };
}

export async function ladeAntrag(ctx, name) {
  simuliere(ctx);
  const c = ctx.client;
  const { doc, docinfo } = await c.getDocMitInfo(DT.antrag, name);
  let treffer = { treffer: [], vorauswahl: "neu", andererName: null };
  let kontakt = null;
  let karteDesKontakts = null;
  if (doc.kontakt) {
    kontakt = await c.getDoc(DT.kontakt, doc.kontakt).catch(() => null);
    const k = await c.getList(DT.karte, { fields: ["name", "status"], filters: [["kontakt", "=", doc.kontakt], ["status", "in", OFFENE_STATUS]], limit: 1 });
    karteDesKontakts = k[0]?.name || null;
  } else {
    treffer = kontaktTreffer(doc, await aehnlicheKontakte(ctx, doc));
    treffer.treffer = treffer.treffer.slice(0, 6).map((t) => ({ name: t.name, titel: t.titel, plz: t.plz, ort: t.ort, zeichen: t.zeichen, sicher: t.sicher }));
    if (treffer.andererName) treffer.andererName = { name: treffer.andererName.name, anzeige: maskiereName(treffer.andererName.titel) };
  }
  const verlauf = [
    { zeit: doc.eingang, text: `Eingang über ${doc.quelle === "website" ? "die Website" : doc.quelle === "kassa" ? "die Kassa" : doc.quelle === "event" ? "ein Event" : "den Showroom"}` },
    doc.doi_gesendet_am ? { zeit: doc.doi_gesendet_am, text: "E-Mail zur Bestätigung gesendet" } : null,
    doc.bestaetigt_am ? { zeit: doc.bestaetigt_am, text: "E-Mail bestätigt" } : null,
    doc.entschieden_am ? { zeit: doc.entschieden_am, text: doc.status === "Angenommen" ? `Angenommen – Karte ${doc.kundenkarte || ""}` : doc.status === "Abgelehnt" ? "Abgelehnt" : "Als doppelt markiert" } : null,
    ...(docinfo?.comments || []).filter((k) => k.comment_type === "Comment" || k.comment_type === "Info").map((k) => ({ zeit: k.creation, text: String(k.content || "").replace(/<[^>]+>/g, ""), wer: k.owner })),
  ]
    .filter(Boolean)
    .sort((a, b) => String(b.zeit).localeCompare(String(a.zeit)));
  return { doc: filtereAntrag(doc, ctx.rolle), kontakt: kontakt ? { name: kontakt.name, titel: kontakt.titel, plz: kontakt.plz, ort: kontakt.ort } : null, karteDesKontakts, treffer, verlauf };
}

// ----------------------------------------------------------------- Karten --

export const KARTEN_REITER = ["alle", "ohneBerater", "uebergabe", "dubletten", "manuell"];

export async function ladeKarten(ctx, { reiter = "alle", q = "", status = "", stufe = "", berater = "", seite = 1 } = {}) {
  simuliere(ctx);
  const c = ctx.client;
  const filter = [];
  const statusListe = status ? status.split(",").filter(Boolean) : ["Aktiv", "Beantragt", "Gesperrt"];
  filter.push(["status", "in", statusListe]);
  if (stufe) filter.push(["stufe", "=", stufe]);
  if (berater) filter.push(berater === "-" ? ["persoenlicher_berater", "is", "not set"] : ["persoenlicher_berater", "=", berater]);
  if (reiter === "ohneBerater") filter.push(["persoenlicher_berater", "is", "not set"], ["status", "=", "Aktiv"]);
  if (reiter === "uebergabe") filter.push(["status", "=", "Beantragt"]);
  if (reiter === "manuell") filter.push(["stufe_manuell", "=", 1]);
  const nr = normalisiereKartennummer(q);
  const orFilters = q ? [["kunde_name", "like", `%${q}%`], ["name", "like", `%${istKartennummer(q) ? nr : q}%`]] : undefined;
  const felder = darfBetraege(ctx.rolle) ? KARTEN_LISTENFELDER_BETRAG : KARTEN_LISTENFELDER;
  let dubletten = [];
  if (reiter === "dubletten") {
    dubletten = ctx.rolle === "leitung" && !leer(ctx) ? await aufruf(c, M.dubletten_finden, { limit: 50 }) : [];
  }
  const zaehlerP = Promise.all([
    c.count(DT.karte, { filters: [["status", "=", "Aktiv"], ["persoenlicher_berater", "is", "not set"]] }),
    c.count(DT.karte, { filters: [["status", "=", "Beantragt"]] }),
    ctx.rolle === "leitung" ? aufruf(c, M.dubletten_finden, { limit: 50 }).then((d) => d.length).catch(() => 0) : Promise.resolve(0),
  ]);
  let zeilen = [];
  let gesamt = 0;
  if (!leer(ctx)) {
    if (reiter === "dubletten") {
      const namen = dubletten.flatMap((d) => d.karten);
      zeilen = namen.length ? await c.getList(DT.karte, { fields: felder, filters: [["name", "in", namen]], limit: 200 }) : [];
      gesamt = zeilen.length;
    } else {
      [zeilen, gesamt] = await Promise.all([
        c.getList(DT.karte, { fields: felder, filters: filter, orFilters, orderBy: "kunde_name asc", limit: SEITE_GROESSE, start: (Math.max(1, seite) - 1) * SEITE_GROESSE }),
        c.count(DT.karte, { filters: filter, orFilters }),
      ]);
    }
  }
  const [ohneBerater, uebergabe, dubl] = await zaehlerP;
  const gesamtAlle = leer(ctx) ? 0 : await c.count(DT.karte, {});
  return {
    zeilen: zeilen.map((k) => ({ ...filtereKarte(k, ctx.rolle), wartetTage: k.status === "Beantragt" ? tageSeit(k.creation, ctx.jetzt) : null })),
    gesamt,
    gesamtAlle,
    zaehler: { ohneBerater, uebergabe, dubletten: dubl },
    dubletten,
    statusListe,
  };
}

/** Karte per Scan/Eingabe finden → Name oder null. */
export async function findeKarte(ctx, roh) {
  const nr = normalisiereKartennummer(roh);
  if (!istKartennummer(nr)) return null;
  try {
    const d = await ctx.client.getDoc(DT.karte, nr);
    return d.name;
  } catch (err) {
    if (istBackofficeError(err) && (err.code === "not_found" || err.code === "forbidden")) return null;
    throw err;
  }
}

/** Karten-Akte komplett (Kopf + Tab-Daten, ≤ 6 Abfragen im Kern). */
export async function ladeKarte(ctx, nr) {
  simuliere(ctx);
  const c = ctx.client;
  const { doc, docinfo } = await c.getDocMitInfo(DT.karte, nr);
  const [uebersicht, stufen, vorteile, einst] = await Promise.all([methode(c, DT.karte, nr, "portal_daten", {}), ladeStufen(ctx), ladeVorteile(ctx), ladeEinstellungen(ctx)]);
  const karte = filtereKarte(doc, ctx.rolle);
  const stufeInfo = stufen.find((s) => s.name === doc.stufe) || null;
  const hoehere = stufen.filter((s) => s.aktiv && s.reihenfolge > (stufeInfo?.reihenfolge ?? 0)).map((s) => ({ stufe: s.stufenname, vorteile: s.vorteile.map((z) => vorteile.find((v) => v.name === z.vorteil)).filter(Boolean).map((v) => ({ titel: v.titel, art: v.art })) }));
  const u = { ...uebersicht };
  if (!darfBetraege(ctx.rolle)) {
    delete u.jahresumsatz_cent;
    delete u.fehlt_noch_cent;
  }
  return { karte, uebersicht: u, stufen, vorteile, hoehere, einstellungen: { bedingungen_version: einst.bedingungen_version || "", text_datenschutz_karte: einst.text_datenschutz_karte || "", bewertungszeitraum_monate: einst.bewertungszeitraum_monate || 12 }, kommentare: (docinfo?.comments || []).filter((k) => k.comment_type === "Comment").map((k) => ({ name: k.name, zeit: k.creation, text: String(k.content || "").replace(/<[^>]+>/g, ""), wer: k.owner })) };
}

/** Verlauf (Ereignisse + Einlösungen + Kommentare) über die Kartenkette. */
export async function ladeVerlauf(ctx, karte, kommentare = []) {
  const c = ctx.client;
  const kette = [karte.name];
  let v = karte.vorgaenger_karte;
  while (v && kette.length < 10) {
    kette.push(v);
    v = await c.getDoc(DT.karte, v).then((d) => d.vorgaenger_karte || null).catch(() => null);
  }
  const [ereignisse, einl] = await Promise.all([
    c.getList(DT.ereignis, { fields: ["name", "art", "zeitpunkt", "von", "alt", "neu", "hinweis", "automatisch", "jahresumsatz_cent", "kundenkarte"], filters: [["kundenkarte", "in", kette]], orderBy: "zeitpunkt desc", limit: 200 }),
    c.getList(DT.einloesung, { fields: ["name", "vorteil_titel", "eingeloest_am", "eingeloest_durch", "status", "ort", "bezug_doctype", "bezug", "storno_grund", "kundenkarte"], filters: [["kundenkarte", "in", kette]], orderBy: "eingeloest_am desc", limit: 200 }),
  ]);
  const betrag = darfBetraege(ctx.rolle);
  const eintraege = [
    ...ereignisse.filter((e) => e.art !== "Einloesung storniert").map((e) => ({ id: e.name, typ: EREIGNIS_ART[e.art]?.filter || "stufe", art: e.art, zeit: e.zeitpunkt, wer: e.von || "", automatisch: Number(e.automatisch) === 1, alt: e.alt, neu: e.neu, hinweis: e.hinweis, karte: e.kundenkarte, umsatz: betrag ? e.jahresumsatz_cent ?? null : undefined })),
    ...einl.map((e) => ({ id: e.name, typ: "einloesungen", art: "Einloesung", zeit: e.eingeloest_am, wer: e.eingeloest_durch, titel: e.vorteil_titel, status: e.status, beleg: e.bezug, belegTyp: e.bezug_doctype, ort: e.ort, storno: e.storno_grund, karte: e.kundenkarte })),
    ...kommentare.map((k) => ({ id: k.name, typ: "kommentare", art: "Kommentar", zeit: k.zeit, wer: k.wer, hinweis: k.text })),
  ].sort((a, b) => String(b.zeit).localeCompare(String(a.zeit)));
  return eintraege;
}

const BELEGARTEN = [
  { dt: "PH Kassenbeleg", datum: "datum_uhrzeit", betrag: "gesamt_cent", icon: "Receipt", titel: "Kassenbeleg" },
  { dt: "PH Bestellung", datum: "creation", betrag: "gesamt_cent", icon: "ShoppingBag", titel: "Shop-Bestellung", karte: true },
  { dt: "PH Rechnung", datum: "datum", betrag: "brutto_cent", icon: "FileText", titel: "Rechnung" },
  { dt: "PH Auftragsbestaetigung", datum: "datum", betrag: "brutto_cent", icon: "ScrollText", titel: "Auftragsbestätigung" },
];

/** Einkäufe: Belege des Kontakts und – per Kartennummer – der Kartenkette (§3.5.3). */
export async function ladeEinkaeufe(ctx, karte) {
  const c = ctx.client;
  const betrag = darfBetraege(ctx.rolle) && Number(karte.einwilligung_auswertung) === 1;
  const out = [];
  for (const b of BELEGARTEN) {
    const felder = ["name", "status", b.datum, "kontakt", ...(betrag ? [b.betrag] : [])];
    const jeKontakt = await c.getList(b.dt, { fields: felder, filters: [["kontakt", "=", karte.kontakt]], orderBy: `${b.datum} desc`, limit: 20 }).catch(() => []);
    let jeKarte = [];
    if (b.dt === "PH Kassenbeleg" || b.dt === "PH Bestellung") jeKarte = await c.getList(b.dt, { fields: felder, filters: [["ph_kundenkarte_kartennummer", "=", karte.name]], limit: 20 }).catch(() => []);
    const gesehen = new Set();
    for (const [liste, ueber] of [[jeKontakt, "kontakt"], [jeKarte, "karte"]]) {
      for (const x of liste) {
        if (gesehen.has(x.name)) continue;
        gesehen.add(x.name);
        out.push({ doctype: b.dt, art: b.titel, icon: b.icon, name: x.name, datum: x[b.datum], status: x.status, ueber, zaehlt: zaehlt(b.dt, x.status, ueber), betrag: betrag ? x[b.betrag] ?? null : undefined });
      }
    }
  }
  return out.sort((a, b) => String(b.datum).localeCompare(String(a.datum)));
}

function zaehlt(dt, status, ueber) {
  const s = String(status || "");
  if (/storn/i.test(s)) return { ja: false, text: "storniert" };
  if (ueber === "karte") return { ja: false, text: "ueberKarte" };
  if (dt === "PH Auftragsbestaetigung") return { ja: false, text: "auftrag" };
  if (dt === "PH Kassenbeleg") return { ja: ["Signiert", "Nachsigniert"].includes(s), text: ["Signiert", "Nachsigniert"].includes(s) ? "ja" : "offen" };
  if (dt === "PH Bestellung") return { ja: ["bezahlt", "versandbereit", "versendet", "abholbereit", "abgeschlossen"].includes(s), text: ["bezahlt", "versandbereit", "versendet", "abholbereit", "abgeschlossen"].includes(s) ? "ja" : "offen" };
  if (dt === "PH Rechnung") return { ja: s !== "Entwurf", text: s === "Entwurf" ? "offen" : "ja" };
  return { ja: false, text: "nein" };
}

/** Bezüge der rechten Spalte (Zähler je Art, Links). */
export async function ladeBezuege(ctx, karte) {
  const c = ctx.client;
  const z = async (dt, filters) => c.count(dt, { filters }).catch(() => null);
  const [auftraege, kasse, service, pflege, aufgabenOffen, aufgabenErledigt] = await Promise.all([
    z("PH Auftragsbestaetigung", [["kontakt", "=", karte.kontakt]]),
    z("PH Kassenbeleg", [["kontakt", "=", karte.kontakt]]),
    z("PH Serviceauftrag", [["kontakt", "=", karte.kontakt]]),
    z("PH Pflege Abo", [["kontakt", "=", karte.kontakt]]),
    z(DT.aufgabe, [["referenz_doctype", "=", DT.karte], ["referenz_name", "=", karte.name], ["status", "in", ["Offen", "In Arbeit"]]]),
    z(DT.aufgabe, [["referenz_doctype", "=", DT.karte], ["referenz_name", "=", karte.name], ["status", "=", "Erledigt"]]),
  ]);
  return { auftraege, kasse, service: (service || 0) + (pflege || 0), aufgabenOffen, aufgabenErledigt };
}

/** Offene Belege des Kontakts für die Einlöse-Liste (§3.5.7, bis 5), Typen nach Vorteil-Art. */
export async function offeneBelege(ctx, karte, art, { zielmodell = false } = {}) {
  const typen = bezugsTypen(art, { zielmodell });
  const c = ctx.client;
  const out = [];
  const conf = {
    "PH Bestellung": { datum: "creation", info: "status" },
    "PH Kassenbeleg": { datum: "datum_uhrzeit", info: "status" },
    "PH Rechnung": { datum: "datum", info: "status" },
    "PH Serviceauftrag": { datum: "creation", info: "titel" },
    "PH Pflege Abo": { datum: "startdatum", info: "titel" },
    "PH Event": { datum: "datum", info: "titel" },
    "PH Auftragsbestaetigung": { datum: "datum", info: "titel" },
    "PH Lieferschein": { datum: "datum", info: "status" },
  };
  for (const dt of typen) {
    const k = conf[dt] || { datum: "creation", info: "status" };
    const filters = dt === "PH Event" ? [["status", "in", ["Geplant", "Offen", "Durchgefuehrt"]]] : [["kontakt", "=", karte.kontakt]];
    const liste = await c.getList(dt, { fields: ["name", k.datum, k.info, "status"], filters, orderBy: `${k.datum} desc`, limit: 5 }).catch(() => null);
    if (liste === null) continue;
    for (const x of liste) if (!/storn|Abgesagt|Entwurf/i.test(String(x.status || ""))) out.push({ doctype: dt, name: x.name, datum: x[k.datum], info: dt === "PH Event" ? x.titel : x[k.info] });
  }
  return out.sort((a, b) => String(b.datum).localeCompare(String(a.datum))).slice(0, 5);
}

/** Beleg per Nummer finden (Präfix erkannt), nur erlaubte Typen der Art. */
export async function sucheBeleg(ctx, karte, art, q) {
  const s = String(q || "").trim();
  if (s.length < 3) return [];
  const typen = bezugsTypen(art);
  const out = [];
  for (const dt of typen) {
    const liste = await ctx.client.getList(dt, { fields: ["name", "status", "kontakt"], filters: [["name", "like", `%${s}%`]], limit: 5 }).catch(() => []);
    for (const x of liste) out.push({ doctype: dt, name: x.name, info: x.status, eigen: x.kontakt === karte.kontakt });
  }
  return out.slice(0, 8);
}

// ------------------------------------------------------------ Einlösungen --

export async function ladeEinloesungen(ctx, { reiter = "eingeloest", q = "", vorteil = "", ort = "", zeitraum = "30", seite = 1 } = {}) {
  simuliere(ctx);
  const c = ctx.client;
  const filter = [["status", "=", reiter === "storniert" ? "Storniert" : reiter === "zugesagt" ? "Zugesagt" : "Eingeloest"]];
  if (vorteil) filter.push(["vorteil", "=", vorteil]);
  if (ort) filter.push(["ort", "=", ort]);
  if (zeitraum !== "alle") {
    const d = new Date(ctx.jetzt);
    d.setDate(d.getDate() - (Number(zeitraum) || 30));
    filter.push(["eingeloest_am", ">=", isoDatumZeit(d)]);
  }
  const orFilters = q ? [["kunde_name", "like", `%${q}%`], ["vorteil_titel", "like", `%${q}%`], ["kundenkarte", "like", `%${q}%`]] : undefined;
  const felder = ["name", "status", "kundenkarte", "kunde_name", "vorteil", "vorteil_titel", "eingeloest_am", "eingeloest_durch", "ort", "bezug_doctype", "bezug", "storno_grund", "kommentar"];
  if (leer(ctx)) return { zeilen: [], gesamt: 0, gesamtAlle: 0 };
  const [zeilen, gesamt, gesamtAlle] = await Promise.all([
    c.getList(DT.einloesung, { fields: felder, filters: filter, orFilters, orderBy: "eingeloest_am desc", limit: SEITE_GROESSE, start: (Math.max(1, seite) - 1) * SEITE_GROESSE }),
    c.count(DT.einloesung, { filters: filter, orFilters }),
    c.count(DT.einloesung, {}),
  ]);
  return { zeilen: zeilen.map(filtereEinloesung), gesamt, gesamtAlle };
}

export async function ladeEinloesung(ctx, name) {
  simuliere(ctx);
  const doc = await ctx.client.getDoc(DT.einloesung, name);
  return filtereEinloesung(doc);
}

// ----------------------------------------------------------------- Stufen --

export async function ladeStufenplan(ctx) {
  simuliere(ctx);
  const [stufen, vorteile, karten] = await Promise.all([
    leer(ctx) ? [] : ladeStufen(ctx),
    leer(ctx) ? [] : ladeVorteile(ctx),
    ctx.client.getList(DT.karte, { fields: ["name", "stufe", "status"], filters: [["status", "in", OFFENE_STATUS]], limit: 5000 }),
  ]);
  const jahr = new Date(ctx.jetzt);
  jahr.setFullYear(jahr.getFullYear() - 1);
  const einl = await ctx.client.getList(DT.einloesung, { fields: ["vorteil"], filters: [["status", "=", "Eingeloest"], ["eingeloest_am", ">=", isoDatumZeit(jahr)]], limit: 10000 });
  const nutzung = {};
  for (const e of einl) nutzung[e.vorteil] = (nutzung[e.vorteil] || 0) + 1;
  const kartenJeStufe = {};
  for (const k of karten) kartenJeStufe[k.stufe] = (kartenJeStufe[k.stufe] || 0) + 1;
  return { stufen, vorteile, kartenJeStufe, nutzung, fehler: stufenplanFehler(stufen), widersprueche: widersprueche(stufen, vorteile) };
}

// --------------------------------------------------------------- Berichte --

export const BERICHTE = Object.freeze([
  { id: "kundenwert", report: "PH Kundenwert", nurLeitung: true },
  { id: "stufenwechsel", report: "PH Stufenwechsel" },
  { id: "vorteile", report: "PH Vorteile Nutzung" },
  { id: "ohne-einkauf", report: "PH Karten ohne Einkauf 12 Monate", nurLeitung: true },
  { id: "manuell", report: null, nurLeitung: true },
]);

export function erlaubteBerichte(rolle) {
  return BERICHTE.filter((b) => !b.nurLeitung || darfBetraege(rolle));
}

/** Bericht laden: Frappe getReport, im Mock aus der Datenbank berechnet (gleiche Spalten wie die Reports). */
export async function ladeBericht(ctx, id, { meine = false } = {}) {
  simuliere(ctx);
  const b = BERICHTE.find((x) => x.id === id);
  if (!b || (b.nurLeitung && !darfBetraege(ctx.rolle))) throw new BackofficeError("not_found", "Bericht nicht gefunden.");
  const c = ctx.client;
  if (leer(ctx)) return { zeilen: [] };
  const betrag = darfBetraege(ctx.rolle);
  if (c.modus === "frappe" && b.report) {
    const r = await c.getReport(b.report, {});
    let zeilen = r.result || [];
    if (!betrag) zeilen = zeilen.map(({ jahresumsatz, gesamtumsatz, ...rest }) => (void jahresumsatz, void gesamtumsatz, rest));
    return { zeilen };
  }
  const karten = await c.getList(DT.karte, { fields: ["name", "kunde_name", "kontakt", "stufe", "stufe_seit", "stufe_manuell", "jahresumsatz_cent", "gesamtumsatz_cent", "letzter_einkauf", "einwilligung_auswertung", "persoenlicher_berater", "ausgestellt_am", "status"], filters: [["status", "in", ["Aktiv", "Gesperrt"]]], limit: 5000 });
  if (id === "kundenwert") {
    return { zeilen: karten.map((k) => ({ karte: k.name, kunde_name: k.kunde_name, stufe: k.stufe, stufe_seit: k.stufe_seit, jahresumsatz: Number(k.einwilligung_auswertung) ? k.jahresumsatz_cent : null, gesamtumsatz: Number(k.einwilligung_auswertung) ? k.gesamtumsatz_cent : null, letzter_einkauf: Number(k.einwilligung_auswertung) ? k.letzter_einkauf : null, einwilligung: Number(k.einwilligung_auswertung) ? "ja" : "nein", berater: k.persoenlicher_berater })) };
  }
  if (id === "manuell") {
    const m = karten.filter((k) => Number(k.stufe_manuell));
    const ev = m.length ? await c.getList(DT.ereignis, { fields: ["kundenkarte", "hinweis", "zeitpunkt"], filters: [["kundenkarte", "in", m.map((k) => k.name)], ["art", "=", "Stufenwechsel"], ["automatisch", "=", 0]], orderBy: "zeitpunkt desc", limit: 500 }) : [];
    return { zeilen: m.map((k) => ({ karte: k.name, kunde_name: k.kunde_name, stufe: k.stufe, stufe_seit: k.stufe_seit, grund: String(ev.find((e) => e.kundenkarte === k.name)?.hinweis || "").replace(/^Stufe festgelegt – Grund:\s*/, "") || "–" })) };
  }
  if (id === "stufenwechsel") {
    const ev = await c.getList(DT.ereignis, { fields: ["zeitpunkt", "kundenkarte", "alt", "neu", "automatisch", "von", "jahresumsatz_cent", "hinweis"], filters: [["art", "=", "Stufenwechsel"]], orderBy: "zeitpunkt desc", limit: 500 });
    const stufen = await ladeStufen(ctx);
    const rang = Object.fromEntries(stufen.map((s) => [s.name, s.reihenfolge]));
    const namen = Object.fromEntries((await c.getList(DT.karte, { fields: ["name", "kunde_name"], limit: 5000 })).map((k) => [k.name, k.kunde_name]));
    return { zeilen: ev.map((e) => ({ zeitpunkt: e.zeitpunkt, karte: e.kundenkarte, kunde_name: namen[e.kundenkarte] || "", alt: e.alt, neu: e.neu, richtung: (rang[e.neu] ?? 0) >= (rang[e.alt] ?? 0) ? "auf" : "ab", art: Number(e.automatisch) ? "automatisch" : "von Hand", hinweis: e.hinweis, ...(betrag ? { jahresumsatz: e.jahresumsatz_cent } : {}) })) };
  }
  if (id === "vorteile") {
    const [vorteile, einl, stufen] = await Promise.all([ladeVorteile(ctx), c.getList(DT.einloesung, { fields: ["vorteil", "status", "kundenkarte", "ort"], limit: 10000 }), ladeStufen(ctx)]);
    const sv = stufen.flatMap((s) => s.vorteile.map((z) => ({ stufe: s.name, vorteil: z.vorteil })));
    return {
      zeilen: vorteile.map((v) => {
        const e = einl.filter((x) => x.vorteil === v.name);
        const berechtigt = karten.filter((k) => vorteileFuerStufe(sv, stufen, k.stufe).some((z) => z.vorteil === v.name)).length;
        const genutzt = new Set(e.filter((x) => x.status === "Eingeloest").map((x) => x.kundenkarte)).size;
        return { vorteil: v.name, titel: v.titel, art: v.art, aktiv: Number(v.aktiv) ? "ja" : "nein", limit: Number(v.einloesbar_pro_jahr) || 0, einloesungen: e.filter((x) => x.status === "Eingeloest").length, stornos: e.filter((x) => x.status === "Storniert").length, karten: genutzt, berechtigt, orte: [...new Set(e.map((x) => x.ort))].join(", ") };
      }),
    };
  }
  if (id === "ohne-einkauf") {
    const grenze = new Date(ctx.jetzt);
    grenze.setFullYear(grenze.getFullYear() - 1);
    const g = isoDatum(grenze);
    const kontakte = Object.fromEntries((await c.getList(DT.kontakt, { fields: ["name", "nicht_kontaktieren"], limit: 5000 }).catch(() => [])).map((k) => [k.name, k]));
    const zeilen = [];
    for (const k of karten.filter((x) => x.status === "Aktiv")) {
      if (meine && k.persoenlicher_berater !== ctx.user) continue;
      const kontakt = kontakte[k.kontakt] || {};
      if (!Number(k.einwilligung_auswertung)) {
        zeilen.push({ karte: k.name, kunde_name: k.kunde_name, stufe: k.stufe, letzter_einkauf: null, tage: null, berater: k.persoenlicher_berater, hinweis: "nicht beurteilbar", nichtBeurteilbar: true, nicht_kontaktieren: Number(kontakt.nicht_kontaktieren) || 0 });
        continue;
      }
      if (k.letzter_einkauf && k.letzter_einkauf >= g) continue;
      zeilen.push({ karte: k.name, kunde_name: k.kunde_name, stufe: k.stufe, letzter_einkauf: k.letzter_einkauf, tage: k.letzter_einkauf ? tageSeit(k.letzter_einkauf, ctx.jetzt) : null, berater: k.persoenlicher_berater, hinweis: k.letzter_einkauf ? "" : "nie eingekauft", nicht_kontaktieren: Number(kontakt.nicht_kontaktieren) || 0 });
    }
    return { zeilen };
  }
  return { zeilen: [] };
}
