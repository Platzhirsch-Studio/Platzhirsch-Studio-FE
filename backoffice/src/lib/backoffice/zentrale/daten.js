// Datenquellen der Zentrale (10-konzept-zentrale § 3.2, § 6). Jede Quelle prüft das Leserecht der beteiligten
// DocTypes vorab, fängt ihren Fehler selbst und liefert { status: "ok"|"leer"|"fehler"|"recht", … } – ein Ausfall
// betrifft nur ihre Kachel (Z-03). Alles über getList/count des Clients (Mock und Frappe gleich), keine Reports.
// Felder exakt aus den DocType-JSONs in Backend-Import (Stand 04.11.2026).

import { darf, darfDoc } from "../auth/rechte.js";
import { ladeMeta } from "../frappe/index.js";
import { doctypeSlug, isoDatum } from "../format.js";
import { aktivitaet } from "../dashboard.js";
import { tagIso, depChip, erstattungChip, jahresbelegChip, ossChip, seeChip, uvaChip } from "./fristen.js";
import { kassaHeute, letzteMonate, monatsName, offenePosten, trendProzent, umsatzJeMonat } from "./umsatz.js";
import { LAUFEND, fortschritt, naechsterSchritt, naechsterTermin, ort, projektBild, stufenName, STUFE_MATERIAL, team } from "./projekte.js";
import { fuehreZusammen, zaehleFaellig } from "./aufgaben.js";
import { mockTodos } from "./mock.js";
import { FRISTEN, KOPFZAHLEN, ZENTRALE } from "./texte.js";

const FEHLER = { status: "fehler" };

/** Link auf ein Objekt: /d/<slug>/<name> (leitet per 307 auf die kanonische Route des Bereichs, Q-B8). */
export function objektHref(doctype, name) {
  if (doctype === "PH Aufgabe") return name ? `/aufgaben/${encodeURIComponent(name)}` : "/aufgaben";
  return name ? `/d/${doctypeSlug(doctype)}/${encodeURIComponent(name)}` : `/d/${doctypeSlug(doctype)}`;
}

/** Darf die Sitzung alle DocTypes lesen? (Meta fehlt → nein) */
export async function darfLesen(client, session, ...doctypes) {
  for (const dt of doctypes) {
    try {
      const meta = await ladeMeta(client, dt);
      if (!darfDoc(session, meta, "read")) return false;
    } catch {
      return false;
    }
  }
  return true;
}

async function sicher(fn, fallback = FEHLER) {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

function tagesgrenzen(heute) {
  return [`${heute} 00:00:00`, `${heute} 23:59:59`];
}

function wochenGrenzen(heute) {
  const d = new Date(`${heute}T12:00:00Z`);
  const mo = new Date(d);
  mo.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  const so = new Date(mo);
  so.setUTCDate(mo.getUTCDate() + 6);
  return [mo.toISOString().slice(0, 10), so.toISOString().slice(0, 10)];
}

function zeitAus(dt) {
  const s = String(dt || "");
  return s.length >= 16 ? s.slice(11, 16) : "";
}

/** Benutzer-Namen (E-Mail → Anzeigename ohne Rollenklammer) für Avatare; ohne Leserecht auf User: E-Mail-Teil. */
export async function namenVon(client, users = []) {
  const eindeutig = [...new Set(users.filter(Boolean))];
  const map = new Map();
  if (!eindeutig.length) return map;
  const zeilen = await sicher(() => client.getList("User", { fields: ["name", "full_name"], filters: [["name", "in", eindeutig]], limit: eindeutig.length }), []);
  for (const z of Array.isArray(zeilen) ? zeilen : []) map.set(z.name, String(z.full_name || z.name).replace(/\s*\(.*\)\s*$/, ""));
  for (const u of eindeutig) if (!map.has(u)) map.set(u, u.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\p{L}/gu, (c) => c.toUpperCase()));
  return map;
}

// ------------------------------------------------------------------------------------------------ Kopfzahlen

/**
 * Bis zu drei leichte Zahlen im Kopf (Lounge § 7.1). Auswahl nach Rolle über Leserecht; „eine Zahl, ein Ort“:
 * die Akzentkacheln zeigen andere Größen (neu seit gestern, Montagen der Woche).
 */
export async function kopfzahlen(client, session, heute) {
  const kandidaten = [
    {
      id: "anfragen",
      text: KOPFZAHLEN.offeneAnfragen,
      dts: ["PH Anfrage"],
      href: "/d/ph-anfrage?status=Neu,Qualifiziert",
      wert: async () => client.count("PH Anfrage", { filters: [["status", "in", ["Neu", "Qualifiziert"]]] }),
    },
    {
      id: "termine",
      text: KOPFZAHLEN.termineHeute,
      dts: ["PH Termin"],
      href: `/d/ph-termin?von=${heute}&bis=${heute}`,
      wert: async () => client.count("PH Termin", { filters: [["start", ">=", tagesgrenzen(heute)[0]], ["start", "<=", tagesgrenzen(heute)[1]], ["status", "in", ["Unbestaetigt", "Bestaetigt"]]] }),
    },
    {
      id: "angebote",
      text: KOPFZAHLEN.offeneAngebote,
      dts: ["PH Angebot"],
      href: "/d/ph-angebot?status=Gesendet",
      einheit: "T€",
      wert: async () => {
        const z = await client.getList("PH Angebot", { fields: ["brutto_cent"], filters: [["status", "=", "Gesendet"]], limit: 2000 });
        return Math.round(z.reduce((s, r) => s + (Number(r.brutto_cent) || 0), 0) / 10000) / 10;
      },
      dez: 1,
    },
    {
      id: "posten",
      text: KOPFZAHLEN.offenePosten,
      dts: ["PH Rechnung"],
      href: "/d/ph-rechnung?status=Gestellt,Teilbezahlt,Ueberfaellig,Gemahnt",
      einheit: "T€",
      dez: 1,
      wert: async () => {
        const z = await client.getList("PH Rechnung", { fields: ["status", "art", "offen_cent", "waehrung", "kurs", "faellig"], filters: [["status", "in", ["Gestellt", "Teilbezahlt", "Ueberfaellig", "Gemahnt"]]], limit: 5000 });
        return Math.round(offenePosten(z, heute).cent / 10000) / 10;
      },
    },
    {
      id: "bestellungen",
      text: KOPFZAHLEN.bestellungen,
      dts: ["PH Bestellung"],
      href: "/d/ph-bestellung",
      wert: async () => client.count("PH Bestellung", { filters: [["status", "in", ["offen", "reserviert", "zahlung_ausstehend", "bezahlt", "versandbereit", "abholbereit", "pruefen"]]] }),
    },
    {
      id: "service",
      text: KOPFZAHLEN.service,
      dts: ["PH Servicefall"],
      href: "/d/ph-servicefall",
      wert: async () => client.count("PH Servicefall", { filters: [["status", "not in", ["Erledigt", "Geschlossen", "Abgelehnt"]]] }),
    },
    {
      id: "aufgaben",
      text: KOPFZAHLEN.aufgaben,
      dts: ["PH Aufgabe"],
      href: "/aufgaben",
      wert: async () => client.count("PH Aufgabe", { filters: [["zugewiesen_an", "=", session.user], ["status", "in", ["Offen", "In Arbeit"]]] }),
    },
  ];
  const out = [];
  for (const k of kandidaten) {
    if (out.length >= 3) break;
    if (!(await darfLesen(client, session, ...k.dts))) continue;
    const wert = await sicher(k.wert, null);
    out.push({ id: k.id, text: k.text, href: k.href, wert, einheit: k.einheit || null, dez: k.dez || 0 });
  }
  return out;
}

// ------------------------------------------------------------------------------------------------ Heute-Spalte

/**
 * Heute: Termine (CRM), sonst Montagen heute (Projekte), sonst eigene heute fällige Aufgaben. Aktiver Termin = der
 * laufende oder nächste; die übrigen als Folgetermine (Lounge § 7.1).
 */
export async function heuteSpalte(client, session, heute, jetzt = new Date()) {
  if (await darfLesen(client, session, "PH Termin")) {
    return sicher(async () => {
      const [von, bis] = tagesgrenzen(heute);
      const zeilen = await client.getList("PH Termin", {
        fields: ["name", "titel", "terminart", "modus", "status", "start", "ende", "berater", "vorname", "nachname", "plz_ort", "anliegen", "kontakt", "anfrage", "thema"],
        filters: [["start", ">=", von], ["start", "<=", bis], ["status", "in", ["Unbestaetigt", "Bestaetigt"]]],
        orderBy: "start asc",
        limit: 20,
      });
      const uhr = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "Europe/Vienna" }).format(jetzt);
      const jetztTxt = `${heute} ${uhr}:00`;
      const offen = zeilen.filter((z) => String(z.ende || z.start) >= jetztTxt);
      const aktiv = offen[0] || null;
      const termine = zeilen.map((z) => ({
        name: z.name,
        kunde: [z.vorname, z.nachname].filter(Boolean).join(" ") || z.titel || z.name,
        art: z.terminart || z.thema || "Termin",
        modus: z.modus || "",
        ort: z.modus === "Showroom" ? "Showroom" : z.modus === "Vor Ort" ? z.plz_ort || "Vor Ort" : z.modus || "",
        von: zeitAus(z.start),
        bis: zeitAus(z.ende),
        status: z.status,
        laeuft: String(z.start) <= jetztTxt && String(z.ende || z.start) >= jetztTxt,
        notiz: z.anliegen ? String(z.anliegen).replace(/<[^>]+>/g, "").slice(0, 120) : "",
        href: objektHref("PH Termin", z.name),
        vorbei: String(z.ende || z.start) < jetztTxt,
      }));
      return { status: termine.length ? "ok" : "leer", art: "termine", aktiv: aktiv ? termine.find((t) => t.name === aktiv.name) : null, folgend: aktiv ? termine.filter((t) => t.name !== aktiv.name && !t.vorbei).slice(0, 4) : termine.slice(-4), vorbei: !aktiv && termine.length > 0, anzahl: termine.length, alleHref: `/d/ph-termin?von=${heute}&bis=${heute}` };
    });
  }
  if (await darfLesen(client, session, "PH Montageauftrag")) {
    return sicher(async () => {
      const [von, bis] = tagesgrenzen(heute);
      const zeilen = await client.getList("PH Montageauftrag", { fields: ["name", "titel", "status", "start"], filters: [["start", ">=", von], ["start", "<=", bis], ["status", "not in", ["Abgebrochen"]]], orderBy: "start asc", limit: 20 });
      const termine = zeilen.map((z) => ({ name: z.name, kunde: z.titel || z.name, art: "Montage", von: zeitAus(z.start), bis: "", status: z.status, href: objektHref("PH Montageauftrag", z.name), notiz: "" }));
      return { status: termine.length ? "ok" : "leer", art: "montagen", aktiv: termine[0] || null, folgend: termine.slice(1, 5), anzahl: termine.length, alleHref: "/d/ph-montageauftrag" };
    });
  }
  return { status: "leer", art: "keine", aktiv: null, folgend: [], anzahl: 0 };
}

// ------------------------------------------------------------------------------------------------ Aufgaben

/** Meine Aufgaben aus PH Aufgabe + ToDo (Frappe; im Mock aus mock.js), überfällige zuerst. */
export async function meineAufgaben(client, session, heute, { sicht = "meine", limit = 200 } = {}) {
  const darfAufgabe = await darfLesen(client, session, "PH Aufgabe");
  const filter = [["status", "in", ["Offen", "In Arbeit"]]];
  if (sicht === "meine") filter.push(["zugewiesen_an", "=", session.user]);
  const [aufgaben, todos] = await Promise.all([
    darfAufgabe
      ? sicher(() => client.getList("PH Aufgabe", { fields: ["name", "titel", "status", "faellig", "prioritaet", "zugewiesen_an", "referenz_doctype", "referenz_name", "quelle", "modified"], filters: filter, orderBy: "faellig asc", limit }), null)
      : [],
    ladeTodos(client, session, { sicht, offen: true }),
  ]);
  if (aufgaben === null) return { status: "fehler", zeilen: [], darfAnlegen: false };
  const zeilen = fuehreZusammen(aufgaben || [], todos || [], { heute });
  let darfAnlegen = false;
  try {
    darfAnlegen = darfDoc(session, await ladeMeta(client, "PH Aufgabe"), "create");
  } catch {
    darfAnlegen = false;
  }
  return { status: zeilen.length ? "ok" : "leer", zeilen, zaehler: zaehleFaellig(zeilen, heute), darfAufgabe, darfAnlegen };
}

/** ToDo der Fach-Apps (Frappe-Standard). Mock: In-Memory-Liste aus mock.js. Nie werfen. */
export async function ladeTodos(client, session, { sicht = "meine", offen = true } = {}) {
  if (client.modus !== "frappe") return mockTodos(session, { sicht, offen });
  const filters = [];
  if (offen) filters.push(["status", "=", "Open"]);
  if (sicht === "meine") filters.push(["allocated_to", "=", session.user]);
  return sicher(() => client.getList("ToDo", { fields: ["name", "description", "status", "date", "priority", "allocated_to", "reference_type", "reference_name", "modified"], filters, orderBy: "date asc", limit: 200 }), []);
}

// ------------------------------------------------------------------------------------------------ Wartet

/**
 * „Braucht deine Antwort“: die dringendste Sache – offene Freigabe (nicht eigene), sonst das am längsten
 * unbeantwortete gesendete Angebot, sonst die älteste überfällige Aufgabe.
 */
export async function wartet(client, session, heute, { freigaben = [], aufgaben = [] } = {}) {
  const f = freigaben.find((x) => !x.eigen);
  if (f) return { status: "ok", art: "freigabe", freigabe: f, text: ZENTRALE.wartetFreigabe(f.titel, f.antragsteller?.name || "–"), personen: [f.antragsteller?.name].filter(Boolean), href: f.href || "/benachrichtigungen", mehr: Math.max(0, freigaben.filter((x) => !x.eigen).length - 1) };
  if (await darfLesen(client, session, "PH Angebot")) {
    const a = await sicher(() => client.getList("PH Angebot", { fields: ["name", "titel", "kunde_name", "gesendet_am", "zugewiesen_an", "brutto_cent", "datum"], filters: [["status", "=", "Gesendet"]], orderBy: "gesendet_am asc", limit: 5 }), []);
    const erstes = Array.isArray(a) ? a[0] : null;
    if (erstes) {
      const seit = String(erstes.gesendet_am || erstes.datum || heute).slice(0, 10);
      const tage = Math.max(1, Math.round((Date.parse(`${heute}T12:00:00Z`) - Date.parse(`${seit}T12:00:00Z`)) / 86_400_000));
      const namen = await namenVon(client, a.map((x) => x.zugewiesen_an));
      return { status: "ok", art: "angebot", text: ZENTRALE.wartetAngebot(erstes.name, erstes.kunde_name || "–", tage), von: namen.get(erstes.zugewiesen_an) || "", bezug: "Angebot", personen: a.map((x) => namen.get(x.zugewiesen_an)).filter(Boolean), href: objektHref("PH Angebot", erstes.name), mehr: Math.max(0, a.length - 1) };
    }
  }
  const ueber = aufgaben.filter((z) => z.faellig && z.faellig < heute);
  if (ueber.length) {
    const z = ueber[0];
    const tage = Math.round((Date.parse(`${heute}T12:00:00Z`) - Date.parse(`${z.faellig}T12:00:00Z`)) / 86_400_000);
    return { status: "ok", art: "aufgabe", text: ZENTRALE.wartetAufgabe(z.titel, tage), bezug: "Aufgabe", personen: [], href: z.quelle === "aufgabe" ? objektHref("PH Aufgabe", z.name) : z.bezugDoctype ? objektHref(z.bezugDoctype, z.bezugName) : "/aufgaben", mehr: ueber.length - 1 };
  }
  return { status: "leer" };
}

// ------------------------------------------------------------------------------------------------ Akzente

/** Bis zu zwei Akzentkacheln (Cognac, Salbei), je nach Leserecht; andere Größen als die Kopfzahlen. */
export async function akzente(client, session, heute) {
  const gestern = isoDatum(new Date(Date.parse(`${heute}T12:00:00Z`) - 86_400_000));
  const [mo, so] = wochenGrenzen(heute);
  const kandidaten = [
    { ton: "cognac", dts: ["PH Anfrage"], titel: ZENTRALE.neuSeitGestern, text: ZENTRALE.neuSeitGesternText, href: "/d/ph-anfrage?status=Neu", zahl: () => client.count("PH Anfrage", { filters: [["eingang", ">=", `${gestern} 00:00:00`], ["status", "=", "Neu"]] }) },
    { ton: "cognac", dts: ["PH Bestellung"], titel: ZENTRALE.neuSeitGestern, text: ZENTRALE.bestellungenOffen, href: "/d/ph-bestellung", zahl: () => client.count("PH Bestellung", { filters: [["status", "in", ["offen", "zahlung_ausstehend", "bezahlt", "pruefen"]]] }) },
    { ton: "cognac", dts: ["PH Rechnung"], titel: KOPFZAHLEN.ueberfaellig, text: ZENTRALE.postenOffen, href: "/d/ph-rechnung?status=Ueberfaellig,Gemahnt", zahl: () => client.count("PH Rechnung", { filters: [["status", "in", ["Ueberfaellig", "Gemahnt"]]] }) },
    { ton: "salbei", dts: ["PH Montageauftrag"], titel: ZENTRALE.dieseWoche, text: ZENTRALE.montagenWoche, href: `/d/ph-montageauftrag?von=${mo}&bis=${so}`, zahl: () => client.count("PH Montageauftrag", { filters: [["start", ">=", `${mo} 00:00:00`], ["start", "<=", `${so} 23:59:59`], ["status", "not in", ["Abgebrochen"]]] }) },
    { ton: "salbei", dts: ["PH Servicefall"], titel: ZENTRALE.dieseWoche, text: ZENTRALE.servicefaelleOffen, href: "/d/ph-servicefall", zahl: () => client.count("PH Servicefall", { filters: [["status", "not in", ["Erledigt", "Geschlossen", "Abgelehnt"]]] }) },
  ];
  const out = [];
  for (const ton of ["cognac", "salbei"]) {
    for (const k of kandidaten.filter((x) => x.ton === ton)) {
      if (!(await darfLesen(client, session, ...k.dts))) continue;
      const zahl = await sicher(k.zahl, null);
      const eintrag = { ton, titel: k.titel, text: k.text, href: k.href, zahl: typeof zahl === "number" ? zahl : null };
      // Eine Null trägt keine Aussage: nächste Quelle gleicher Farbe versuchen, sonst die Null zeigen.
      if (eintrag.zahl) {
        out.push(eintrag);
        break;
      }
      if (!out.some((o) => o.ton === ton)) out.push({ ...eintrag, ersatz: true });
    }
    const i = out.findIndex((o) => o.ton === ton && o.ersatz);
    if (i >= 0 && out.filter((o) => o.ton === ton).length > 1) out.splice(i, 1);
  }
  return out;
}

// ------------------------------------------------------------------------------------------------ Pipeline

const PIPELINE_STUFEN = [
  { status: "Neu", titel: "Anfrage" },
  { status: "Qualifiziert", titel: "Qualifiziert" },
  { status: "Termin vereinbart", titel: "Beratung" },
  { status: "Angebot", titel: "Angebot" },
  { status: "Gewonnen", titel: "Auftrag" },
];

/** Pipeline aus PH Anfrage: Anzahl und Wert je Stufe, Abschlussquote 90 Tage, Ø Tage bis Auftrag (aus Daten). */
export async function pipeline(client, session, heute) {
  if (!(await darfLesen(client, session, "PH Anfrage"))) return { status: "recht" };
  return sicher(async () => {
    const seit = isoDatum(new Date(Date.parse(`${heute}T12:00:00Z`) - 90 * 86_400_000));
    const zeilen = await client.getList("PH Anfrage", { fields: ["status", "wert_cent", "eingang", "gewonnen_am", "verloren_am"], filters: [["status", "not in", ["Spam"]]], limit: 5000 });
    const stufen = PIPELINE_STUFEN.map((s) => {
      const z = zeilen.filter((r) => r.status === s.status && (s.status !== "Gewonnen" || String(r.gewonnen_am || "") >= seit));
      return { ...s, n: z.length, wertCent: z.reduce((a, r) => a + (Number(r.wert_cent) || 0), 0) };
    });
    const offen = zeilen.filter((r) => ["Neu", "Qualifiziert", "Termin vereinbart", "Angebot"].includes(r.status));
    const gew = zeilen.filter((r) => r.status === "Gewonnen" && String(r.gewonnen_am || "") >= seit);
    const verl = zeilen.filter((r) => r.status === "Verloren" && String(r.verloren_am || "") >= seit);
    const quote = gew.length + verl.length > 0 ? Math.round((gew.length / (gew.length + verl.length)) * 100) : null;
    const dauern = gew.map((r) => (Date.parse(String(r.gewonnen_am).replace(" ", "T")) - Date.parse(String(r.eingang).replace(" ", "T"))) / 86_400_000).filter((d) => Number.isFinite(d) && d >= 0);
    const dauer = dauern.length ? Math.round(dauern.reduce((a, b) => a + b, 0) / dauern.length) : null;
    return { status: offen.length || gew.length ? "ok" : "leer", offen: offen.length, offenWertCent: offen.reduce((a, r) => a + (Number(r.wert_cent) || 0), 0), quote, dauer, stufen };
  });
}

// ------------------------------------------------------------------------------------------------ Umsatz

/** Umsatz netto je Monat (6 Monate) aus Rechnungen − Gutschriften; Bezugsmonat = letzter abgeschlossener Monat. */
export async function umsatz(client, session, heute) {
  if (!(await darfLesen(client, session, "PH Rechnung"))) return { status: "recht" };
  return sicher(async () => {
    const monate = letzteMonate(heute, 6);
    const ab = `${monate[0]}-01`;
    const [rechnungen, gutschriften] = await Promise.all([
      client.getList("PH Rechnung", { fields: ["name", "docstatus", "status", "art", "netto_cent", "waehrung", "kurs", "leistungsdatum", "datum"], filters: [["docstatus", "=", 1]], limit: 10000 }),
      (await darfLesen(client, session, "PH Gutschrift")) ? client.getList("PH Gutschrift", { fields: ["name", "docstatus", "netto_cent", "waehrung", "datum"], filters: [["docstatus", "=", 1], ["datum", ">=", ab]], limit: 10000 }) : [],
    ]);
    const reihe = umsatzJeMonat(monate, rechnungen, gutschriften);
    const summe = reihe.reduce((a, r) => a + r.cent, 0);
    const bezug = reihe[reihe.length - 2];
    const vor = reihe[reihe.length - 3];
    const hatWerte = reihe.some((r) => r.cent !== 0);
    return {
      status: hatWerte ? "ok" : "leer",
      punkte: reihe.map((r, i) => ({ monat: r.monat, label: monatsName(r.monat), cent: r.cent, laufend: i === reihe.length - 1, bezug: i === reihe.length - 2 })),
      summeCent: summe,
      seit: monatsName(monate[0], true),
      trend: trendProzent(bezug?.cent, vor?.cent),
      chf: reihe.some((r) => r.chf),
    };
  });
}

// ------------------------------------------------------------------------------------------------ Projekte

/** Laufende Projekte mit Bild, Stufe, Team, nächstem Schritt, Fortschritt, Wert. */
export async function projekte(client, session, heute, { limit = 5 } = {}) {
  if (!(await darfLesen(client, session, "PH Projekt"))) return { status: "recht" };
  return sicher(async () => {
    const zeilen = await client.getList("PH Projekt", {
      fields: ["name", "titel", "projektart", "status", "kunde_name", "objekt_ort", "berater", "planer", "montageleiter", "liefertermin_geplant", "montage_von", "uebergabe_am", "auftragswert_cent", "budget_cent"],
      filters: [["status", "in", LAUFEND]],
      limit: 500,
    });
    const [mo, so] = wochenGrenzen(heute);
    const mitTermin = zeilen.filter((p) => {
      const t = naechsterTermin(p, heute);
      return t && t >= mo && t <= so;
    }).length;
    const sortiert = zeilen
      .map((p) => ({ p, t: naechsterTermin(p, heute) || "9999" }))
      .sort((a, b) => a.t.localeCompare(b.t) || String(a.p.titel).localeCompare(String(b.p.titel), "de"))
      .slice(0, limit)
      .map((x) => x.p);
    let bilder = new Map();
    if (await darfLesen(client, session, "PH Rendering")) {
      const r = await sicher(() => client.getList("PH Rendering", { fields: ["projekt", "bild", "status"], filters: [["projekt", "in", sortiert.map((p) => p.name)], ["status", "=", "Freigegeben"]], limit: 100 }), []);
      bilder = new Map((Array.isArray(r) ? r : []).filter((x) => x.bild).map((x) => [x.projekt, x.bild]));
    }
    const namen = await namenVon(client, sortiert.flatMap(team));
    return {
      status: zeilen.length ? "ok" : "leer",
      gesamt: zeilen.length,
      mitTermin,
      zeilen: sortiert.map((p) => ({
        name: p.name,
        titel: String(p.titel || p.name).replace(/\s*[–-]\s*[^–-]+$/, "") || p.name,
        kunde: [p.kunde_name, ort(p)].filter(Boolean).join(" · "),
        stufe: stufenName(p.status),
        material: STUFE_MATERIAL[p.status] || "stein",
        team: team(p).map((u) => namen.get(u) || u),
        naechster: naechsterSchritt(p),
        fortschritt: fortschritt(p.status),
        wertCent: Number(p.auftragswert_cent) || Number(p.budget_cent) || null,
        bild: projektBild(p, bilder.get(p.name)),
        href: objektHref("PH Projekt", p.name),
      })),
    };
  });
}

// ------------------------------------------------------------------------------------------------ Aktivität

/** Aktivität (recent_activity) für die Kachel – Person, Satz, Objekt, Zeit. Nur Rollen mit Schreibrecht. */
export async function aktivitaetKachel(client, session, { limit = 6, nurIch = false } = {}) {
  const schreibt = session.bereiche?.some?.((b) => darf(session, b, "write")) ?? true;
  if (!schreibt) return { status: "recht" };
  return sicher(async () => {
    const zeilen = await aktivitaet(client, session, nurIch ? 60 : limit);
    const gefiltert = nurIch ? zeilen.filter((z) => z.von === session.user).slice(0, limit) : zeilen;
    return { status: gefiltert.length ? "ok" : "leer", zeilen: gefiltert.map((z) => ({ ...z, vonName: String(z.vonName || z.von || "").replace(/\s*\(.*\)\s*$/, ""), vorname: String(z.vonName || z.von || "").replace(/\s*\(.*\)\s*$/, "").split(" ")[0] })) };
  });
}

// ------------------------------------------------------------------------------------------------ Heute-Leiste

/** Chips der Heute-Leiste (§ 6.3): Aufgaben, Termine, Anfragen neu, Montage, Freigaben, Abschluss, Fristen. */
export async function heuteChips(client, session, heute, { aufgabenZaehler, freigaben = [], termine } = {}) {
  const chips = [];
  const leitung = session.roles.some((r) => /Leitung|Geschäftsführung|Backoffice-Admin|System Manager/.test(r));
  if (aufgabenZaehler?.ueberfaellig) chips.push({ id: "aufgaben.ueberfaellig", text: FRISTEN.ueberfaellig(aufgabenZaehler.ueberfaellig), anzahl: aufgabenZaehler.ueberfaellig, ton: "rot", href: "/aufgaben?frist=ueberfaellig" });
  if (aufgabenZaehler?.heute) chips.push({ id: "aufgaben.heute", text: FRISTEN.heuteFaellig(aufgabenZaehler.heute), anzahl: aufgabenZaehler.heute, ton: "sand", href: "/aufgaben?frist=heute" });
  const fremd = freigaben.filter((f) => !f.eigen).length;
  if (leitung && fremd) chips.push({ id: "freigaben", text: FRISTEN.freigaben(fremd), anzahl: fremd, ton: "rot", href: "/benachrichtigungen" });
  if (termine?.anzahl && termine.art === "termine") chips.push({ id: "crm.termine", text: FRISTEN.termine(termine.anzahl, termine.aktiv?.von || ""), anzahl: termine.anzahl, ton: "sand", href: termine.alleHref });
  if (await darfLesen(client, session, "PH Anfrage")) {
    const neu = await sicher(() => client.getList("PH Anfrage", { fields: ["eingang"], filters: [["status", "=", "Neu"]], limit: 500 }), []);
    if (Array.isArray(neu) && neu.length) {
      const grenze = new Date(Date.now() - 86_400_000).toISOString().slice(0, 19).replace("T", " ");
      chips.push({ id: "crm.anfragen-neu", text: FRISTEN.anfragenNeu(neu.length), anzahl: neu.length, ton: neu.some((a) => String(a.eingang) < grenze) ? "rot" : "sand", href: "/d/ph-anfrage?status=Neu" });
    }
  }
  if (darf(session, "kassa", "cancel") && (await darfLesen(client, session, "PH Kassenabschluss"))) {
    const gestern = isoDatum(new Date(Date.parse(`${heute}T12:00:00Z`) - 86_400_000));
    const n = await sicher(() => client.count("PH Kassenabschluss", { filters: [["datum", "=", gestern], ["status", "in", ["Offen", "Gezaehlt"]]] }), 0);
    if (n) chips.push({ id: "kassa.abschluss", text: FRISTEN.abschlussOffen, anzahl: n, ton: "rot", href: "/d/ph-kassenabschluss?status=Offen,Gezaehlt" });
  }
  chips.push(...(await fristenChips(client, session, heute)));
  return chips;
}

/** Fristen-Chips (UVA, OSS, Jahresbeleg, SEE, DEP, Erstattung) – nur für Faktura-/Kassa-/Shop-Leitung, GF, Kanzlei. */
export async function fristenChips(client, session, heute) {
  const out = [];
  const rs = session.roles || [];
  const steuer = rs.some((r) => ["PH Faktura Leitung", "PH Geschäftsführung", "PH Buchhaltung extern", "PH Backoffice-Admin", "System Manager"].includes(r));
  const kassa = rs.some((r) => ["PH Kassa Leitung", "PH Geschäftsführung", "PH Backoffice-Admin", "System Manager"].includes(r));
  const shop = rs.some((r) => ["PH Shop Leitung", "PH Geschäftsführung", "System Manager"].includes(r));
  if (steuer && (await darfLesen(client, session, "PH Export Lauf"))) {
    const laeufe = await sicher(() => client.getList("PH Export Lauf", { fields: ["zeitraum_bis", "status"], filters: [["status", "in", ["Uebergeben", "Bestaetigt"]]], limit: 200 }), []);
    const uva = uvaChip(heute, Array.isArray(laeufe) ? laeufe : []);
    if (uva) out.push({ ...uva, href: "/d/ph-export-lauf" });
    if (await darfLesen(client, session, "PH Rechnung")) {
      let oss = null;
      const kandidat = ossChip(heute, () => true);
      if (kandidat) {
        const [, q] = /q(\d)$/.exec(kandidat.id) || [];
        const j = Number(kandidat.id.split("-")[1]);
        const vonM = (Number(q) - 1) * 3 + 1;
        const von = `${j}-${String(vonM).padStart(2, "0")}-01`;
        const bis = `${j}-${String(vonM + 2).padStart(2, "0")}-31`;
        const n = await sicher(() => client.count("PH Rechnung", { filters: [["ust_fall", "=", "OSS"], ["datum", ">=", von], ["datum", "<=", bis], ["docstatus", "=", 1]] }), 0);
        oss = n ? kandidat : null;
      }
      if (oss) out.push({ ...oss, href: "/d/ph-rechnung?ust_fall=OSS" });
    }
  }
  if (kassa && (await darfLesen(client, session, "PH Kassa Ereignis"))) {
    const see = await sicher(() => client.count("PH Kassa Ereignis", { filters: [["meldung_finanzonline_noetig", "=", 1], ["gemeldet_am", "is", "not set"]] }), 0);
    const s = seeChip(see);
    if (s) out.push({ ...s, href: "/d/ph-kassa-ereignis" });
    const jahr = heute.slice(0, 4);
    const erledigt = await sicher(() => client.count("PH Kassa Ereignis", { filters: [["art", "=", "Jahresbeleg Pruefung"], ["status", "=", "Erledigt"], ["zeitpunkt", ">=", `${jahr}-01-01 00:00:00`]] }), 0);
    const jb = jahresbelegChip(heute, erledigt > 0);
    if (jb) out.push({ ...jb, href: "/d/ph-kassa-ereignis" });
  }
  if (kassa && (await darfLesen(client, session, "PH DEP Export"))) {
    const letzte = await sicher(() => client.getList("PH DEP Export", { fields: ["erstellt_am"], orderBy: "erstellt_am desc", limit: 1 }), []);
    const d = depChip(heute, Array.isArray(letzte) && letzte[0] ? letzte[0].erstellt_am : null);
    if (d) out.push({ ...d, href: "/d/ph-dep-export" });
  }
  if (shop && (await darfLesen(client, session, "PH Widerruf"))) {
    const w = await sicher(() => client.getList("PH Widerruf", { fields: ["erstattung_bis", "status"], filters: [["status", "not in", ["Erstattet", "Abgelehnt"]]], limit: 500 }), []);
    const e = erstattungChip(heute, Array.isArray(w) ? w : []);
    if (e) out.push({ ...e, href: "/d/ph-widerruf" });
  }
  return out;
}

// ------------------------------------------------------------------------------------------------ Kennzahlen (Ersatzkachel)

/** Übrige Kennzahlen als 2×2 (Ersatz, wenn Pipeline/Umsatz/Projekte fehlen) – nie doppelt zu den Kopfzahlen. */
export async function weitereKennzahlen(client, session, heute, ausschliessen = new Set()) {
  const defs = [
    { id: "bestellungen", text: KOPFZAHLEN.bestellungen, dts: ["PH Bestellung"], href: "/d/ph-bestellung", wert: () => client.count("PH Bestellung", { filters: [["status", "in", ["offen", "reserviert", "zahlung_ausstehend", "bezahlt", "versandbereit", "abholbereit", "pruefen"]]] }) },
    { id: "service", text: KOPFZAHLEN.service, dts: ["PH Servicefall"], href: "/d/ph-servicefall", wert: () => client.count("PH Servicefall", { filters: [["status", "not in", ["Erledigt", "Geschlossen", "Abgelehnt"]]] }) },
    { id: "montagen", text: KOPFZAHLEN.montagen, dts: ["PH Montageauftrag"], href: "/d/ph-montageauftrag", wert: () => { const [mo, so] = wochenGrenzen(heute); return client.count("PH Montageauftrag", { filters: [["start", ">=", `${mo} 00:00:00`], ["start", "<=", `${so} 23:59:59`]] }); } },
    { id: "kassa", text: KOPFZAHLEN.kassaHeute, dts: ["PH Kassenbeleg"], href: "/kassa/verwaltung", format: "cent", wert: async () => kassaHeute(await client.getList("PH Kassenbeleg", { fields: ["belegart", "status", "trainings", "gesamt_cent", "datum_uhrzeit"], filters: [["datum_uhrzeit", ">=", `${heute} 00:00:00`]], limit: 5000 }), heute).cent },
    { id: "posten", text: KOPFZAHLEN.offenePosten, dts: ["PH Rechnung"], href: "/d/ph-rechnung", format: "cent", wert: async () => offenePosten(await client.getList("PH Rechnung", { fields: ["status", "art", "offen_cent", "waehrung", "kurs", "faellig"], filters: [["status", "in", ["Gestellt", "Teilbezahlt", "Ueberfaellig", "Gemahnt"]]], limit: 5000 }), heute).cent },
    { id: "aufgaben", text: KOPFZAHLEN.aufgaben, dts: ["PH Aufgabe"], href: "/aufgaben", wert: () => client.count("PH Aufgabe", { filters: [["zugewiesen_an", "=", session.user], ["status", "in", ["Offen", "In Arbeit"]]] }) },
  ];
  const out = [];
  for (const d of defs) {
    if (out.length >= 4) break;
    if (ausschliessen.has(d.id)) continue;
    if (!(await darfLesen(client, session, ...d.dts))) continue;
    out.push({ id: d.id, titel: d.text, href: d.href, format: d.format || "zahl", wert: await sicher(d.wert, null) });
  }
  return out;
}

// ------------------------------------------------------------------------------------------------ Admin

/** Integration (API 24 h) + Geräte lange nicht gesehen. */
export async function integration(client, session, jetzt = new Date()) {
  if (!(await darfLesen(client, session, "PH API Protokoll"))) return { status: "recht" };
  return sicher(async () => {
    const seit = new Date(jetzt.getTime() - 86_400_000);
    const s = `${tagIso(seit)} ${new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23", timeZone: "Europe/Vienna" }).format(seit)}`;
    const [gesamt, fehler, rate] = await Promise.all([
      client.count("PH API Protokoll", { filters: [["zeitpunkt", ">=", s]] }),
      client.count("PH API Protokoll", { filters: [["zeitpunkt", ">=", s], ["status", "=", "Fehler"]] }),
      client.count("PH API Protokoll", { filters: [["zeitpunkt", ">=", s], ["status", "=", "Rate-Limit"]] }),
    ]);
    return { status: "ok", gesamt, fehler, rate };
  });
}

/** Betriebsbereitschaft (§ 3.18): sechs Prüfpunkte, je { id, ok, text, href }. */
export async function betriebsbereitschaft(client, session, { geraete = [], integrationFehler = null } = {}) {
  const punkte = [];
  const e = await sicher(() => client.getDoc("PH Einstellungen", "PH Einstellungen"), null);
  punkte.push({ id: "testmodus", titel: "Testmodus", ok: e ? !Number(e.testmodus) : null, text: e ? (Number(e.testmodus) ? "Testmodus ist an." : "Aus – Echtbetrieb.") : "Nicht geladen", href: "/einstellungen?tab=allgemein" });
  punkte.push({ id: "api", titel: "Website-API", ok: e ? !!Number(e.api_aktiv) : null, text: e ? (Number(e.api_aktiv) ? "Eingeschaltet." : "Website-API ist aus.") : "Nicht geladen", href: "/einstellungen?tab=website" });
  const firmen = await sicher(() => client.getList("PH Firma", { fields: ["name", "firmenname", "standard", "rechtsform", "strasse", "plz", "ort", "uid", "firmenbuchnummer", "firmenbuchgericht"], limit: 20 }), []);
  const std = Array.isArray(firmen) ? firmen.find((f) => Number(f.standard)) || null : null;
  const fehlt = std ? firmaFehlt(std) : ["Standardfirma"];
  punkte.push({ id: "firma", titel: "Standardfirma vollständig", ok: fehlt.length === 0, text: fehlt.length ? `Für Rechnungen fehlt: ${fehlt.join(", ")}.` : "Pflichtangaben vollständig.", href: "/einstellungen?tab=firma" });
  punkte.push({ id: "schluessel", titel: "Zugangsschlüssel", ok: null, text: "Nicht prüfbar – Status der Schlüssel kommt mit der Server-Schnittstelle.", href: "/einstellungen?tab=system" });
  const kassen = geraete.filter((g) => g.typ === "Kassa");
  const ohneKasse = kassen.filter((g) => !g.kasse);
  punkte.push({ id: "kassa", titel: "Kassa-Geräte mit Kasse", ok: ohneKasse.length === 0, text: ohneKasse.length ? `${ohneKasse.map((g) => g.geraetename).join(", ")} ohne Kasse.` : kassen.length ? "Alle Kassa-Geräte haben eine Kasse." : "Noch kein Kassa-Gerät registriert.", href: "/geraete" });
  punkte.push({ id: "integration", titel: "Integrationsfehler 24 h", ok: integrationFehler === null ? null : integrationFehler === 0, text: integrationFehler === null ? "Nicht geladen" : integrationFehler ? `${integrationFehler} ${integrationFehler === 1 ? "Fehler" : "Fehler"} in 24 h.` : "Keine Fehler.", href: "/protokoll?tab=api" });
  return { status: "ok", punkte };
}

/** Pflichtangaben einer Firma für Rechnungen (UStG § 11, UGB § 14) – fehlende Feldnamen als Anzeige. */
export function firmaFehlt(f) {
  const PFLICHT = [
    ["firmenname", "Firmenname"],
    ["rechtsform", "Rechtsform"],
    ["strasse", "Anschrift"],
    ["plz", "PLZ"],
    ["ort", "Ort"],
    ["uid", "UID"],
    ["firmenbuchnummer", "Firmenbuchnummer"],
    ["firmenbuchgericht", "Firmenbuchgericht"],
  ];
  return PFLICHT.filter(([k]) => !String(f?.[k] ?? "").trim()).map(([, t]) => t);
}

// ------------------------------------------------------------------------------------------------ Kanzlei

/** Drei Kacheln der Kanzlei: Export-Läufe, Offene Posten, Kassenbuch (nur Zahlen, die die Rolle lesen darf). */
export async function externKacheln(client, session, heute) {
  const [laeufe, posten, abschluesse] = await Promise.all([
    (await darfLesen(client, session, "PH Export Lauf")) ? sicher(() => client.getList("PH Export Lauf", { fields: ["name", "titel", "status", "zeitraum_von", "zeitraum_bis", "uebergeben_am"], orderBy: "zeitraum_bis desc", limit: 5 }), null) : null,
    (await darfLesen(client, session, "PH Rechnung")) ? sicher(async () => offenePosten(await client.getList("PH Rechnung", { fields: ["status", "art", "offen_cent", "waehrung", "kurs", "faellig"], filters: [["status", "in", ["Gestellt", "Teilbezahlt", "Ueberfaellig", "Gemahnt"]]], limit: 5000 }), heute), null) : null,
    (await darfLesen(client, session, "PH Kassenabschluss")) ? sicher(() => client.getList("PH Kassenabschluss", { fields: ["name", "datum", "status", "umsatz_cent", "kasse"], orderBy: "datum desc", limit: 5 }), null) : null,
  ]);
  return { laeufe, posten, abschluesse };
}

export { tagIso };

// ------------------------------------------------------------------------------------------------ Aufgabenliste (/aufgaben)

/** Leitung, GF, Admin sehen Team und Alle (Konzept § 3.6.2). */
export function darfTeamSicht(session) {
  return (session?.roles || []).some((r) => /Leitung$|Geschäftsführung|Backoffice-Admin|System Manager/.test(r));
}

/**
 * Alle Aufgaben einer Sicht aus beiden Quellen (Status-Filter wirkt nach dem Zusammenführen, damit ToDo-Status
 * gleich gemappt ist). Team = Benutzer mit gemeinsamer Bereichsrolle (bis Has Role lesbar: alle zugewiesenen).
 */
export async function aufgabenListe(client, session, heute, { sicht = "meine" } = {}) {
  const darfAufgabe = await darfLesen(client, session, "PH Aufgabe");
  const filters = [];
  if (sicht === "meine") filters.push(["zugewiesen_an", "=", session.user]);
  else if (sicht === "team") filters.push(["zugewiesen_an", "!=", session.user]);
  const [aufgaben, todos] = await Promise.all([
    darfAufgabe ? sicher(() => client.getList("PH Aufgabe", { fields: ["name", "titel", "status", "faellig", "prioritaet", "zugewiesen_an", "referenz_doctype", "referenz_name", "quelle", "beschreibung", "modified"], filters, orderBy: "faellig asc", limit: 1000 }), null) : [],
    ladeTodos(client, session, { sicht: sicht === "meine" ? "meine" : "alle", offen: false }),
  ]);
  if (aufgaben === null) return { status: "fehler", zeilen: [] };
  let tds = todos || [];
  if (sicht === "team") tds = tds.filter((t) => t.allocated_to !== session.user);
  const zeilen = fuehreZusammen(aufgaben, tds, { heute });
  let darfAnlegen = false;
  try {
    darfAnlegen = darfDoc(session, await ladeMeta(client, "PH Aufgabe"), "create");
  } catch {
    darfAnlegen = false;
  }
  return { status: zeilen.length ? "ok" : "leer", zeilen, darfAnlegen, darfAufgabe };
}
