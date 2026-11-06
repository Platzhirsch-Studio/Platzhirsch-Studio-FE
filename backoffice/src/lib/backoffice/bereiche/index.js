// Bereichs-Register (G-01, MASTER § 3.5): setzt die Teildateien bereiche/<bereich>.js zusammen (zwölf Fachbereiche
// nach Q-B2 plus die Querschnittsbereiche Ablage und E-Mails). Reihenfolge der Seitenleiste nach Q-B2 / M-03, kanonische Routen (ROUTEN) und die 307-Umleitung
// der generischen /d/*-Seiten. Bereiche schreiben NUR in ihre eigene Teildatei, nie hier.
// Reines Datenmodul (keine "@/"-Importe, kein server-only), damit node --test es lädt.

import { doctypeSlug } from "../format.js";
import zentrale from "./zentrale.js";
import crm from "./crm.js";
import projekte from "./projekte.js";
import faktura from "./faktura.js";
import shop from "./shop.js";
import sortiment from "./sortiment.js";
import logistik from "./logistik.js";
import service from "./service.js";
import kundenkarte from "./kundenkarte.js";
import marketing from "./marketing.js";
import personal from "./personal.js";
import kassa from "./kassa.js";
import ablage from "./ablage.js";
import posteingang from "./posteingang.js";

/**
 * @typedef {{titel:string, href:string, icon?:string, doctype?:string, zaehler?:string,
 *   recht?: string | {aktion?:string, bereich?:string}}} NavEintrag
 * `rollenName`: „PH <rollenName> Mitarbeiter|Leitung“ sind die eigenen Rollen des Bereichs (auth/rechte.js).
 * `rollen`: weitere Frappe-Rollen mit Zugriff → Stufe (z. B. Fachrollen in der Ablage, laut DocType-permissions).
 * @typedef {{slug:string, titel:string, icon:string, app:string, module:string[], rollenName:string|null,
 *   rollen?:Record<string,"mitarbeiter"|"leitung">,
 *   startseite:string, doctypes:string[], navigation?:NavEintrag[], kanban?:string[],
 *   routen?:Record<string,(name?:string)=>string>, seiten?:Record<string,string|null>}} BereichDefinition
 */

/**
 * Reihenfolge der Seitenleiste: Q-B2 (Inhaber-Bestätigung M-03) für die zwölf Fachbereiche, danach die
 * Querschnittsbereiche Ablage (ph_ablage) und E-Mails (ph_microsoft, Slug „posteingang“) – Platz offen, 90 Nr. 39.
 */
export const REIHENFOLGE = ["zentrale", "crm", "projekte", "faktura", "shop", "sortiment", "logistik", "service", "kundenkarte", "marketing", "personal", "kassa", "ablage", "posteingang"];

const ROH = [zentrale, crm, projekte, faktura, shop, sortiment, logistik, service, kundenkarte, marketing, personal, kassa, ablage, posteingang];

/** Liste der Bereiche in Navigationsreihenfolge. */
export const BEREICHE = [...ROH].sort((a, b) => rang(a.slug) - rang(b.slug));

function rang(slug) {
  const i = REIHENFOLGE.indexOf(slug);
  return i < 0 ? REIHENFOLGE.length : i;
}

export const BEREICH_SLUGS = BEREICHE.map((b) => b.slug);

/** Frappe-Modulname → Bereichs-Slug (aus `module` der Teildateien). */
export const MODUL_ZU_BEREICH = Object.fromEntries(BEREICHE.flatMap((b) => (b.module || []).map((m) => [m, b.slug])));

export function bereichFuerModul(modul) {
  return MODUL_ZU_BEREICH[modul] || "zentrale";
}

export function bereich(slug) {
  return BEREICHE.find((b) => b.slug === slug) || null;
}

/** „PH CRM Leitung“ → { bereich: "crm", stufe: "leitung" } über `rollenName` (eigene Rollen der Bereiche). */
export const ROLLEN_NAMEN = Object.fromEntries(BEREICHE.filter((b) => b.rollenName).map((b) => [b.rollenName, b.slug]));

/** Zusätzliche Rollen je Bereich: Rolle → [{ bereich, stufe }] (aus `rollen` der Teildateien). */
export const ZUSATZ_ROLLEN = (() => {
  const m = {};
  for (const b of BEREICHE) for (const [rolle, stufe] of Object.entries(b.rollen || {})) (m[rolle] ||= []).push({ bereich: b.slug, stufe });
  return m;
})();

// ---------------------------------------------------------------- Routen --

/** Kanonische Route je DocType: doctype → { bereich, route(name?) }. Erster Eintrag gewinnt; Dubletten meldet pruefeBereiche(). */
export const ROUTEN = (() => {
  const m = new Map();
  for (const b of BEREICHE) {
    for (const [dt, route] of Object.entries(b.routen || {})) {
      if (typeof route === "function" && !m.has(dt)) m.set(dt, { bereich: b.slug, route });
    }
  }
  return m;
})();

/**
 * Kanonische Adresse eines DocTypes (ohne name: Liste) oder null, solange der Bereich keine eigene Seite registriert hat.
 * @param {string} doctype
 * @param {string} [name]
 */
export function kanonischeRoute(doctype, name) {
  const r = ROUTEN.get(doctype);
  if (!r) return null;
  try {
    const href = name === undefined || name === null || name === "" ? r.route() : r.route(String(name));
    return typeof href === "string" && href.startsWith("/") && !href.startsWith("/d/") ? href : null;
  } catch {
    return null;
  }
}

/**
 * Ziel der 307-Umleitung für /d/<slug> und /d/<slug>/<name> (Q-B8). null = generische Seite bleibt.
 * `neu` leitet nicht um (Neu-Dialoge der Bereiche haben eigene Wege). Admins behalten mit `?generisch=1`
 * die generische Seite als Rückfall.
 * @param {{doctype:string, name?:string|null, query?:Record<string,string>, admin?:boolean}} p
 */
export function umleitungFuerD({ doctype, name = null, query = {}, admin = false }) {
  if (admin && query.generisch === "1") return null;
  if (name === "neu") return null;
  const ziel = kanonischeRoute(doctype, name || undefined);
  if (!ziel) return null;
  const rest = new URLSearchParams(Object.entries(query).filter(([k, v]) => k !== "generisch" && v !== undefined && v !== null && v !== ""));
  const qs = rest.toString();
  return qs ? `${ziel}${ziel.includes("?") ? "&" : "?"}${qs}` : ziel;
}

// ------------------------------------------------------------ Navigation --

/**
 * Navigationseinträge eines Bereichs: eigene oder – als Rückfall – die Listen der ersten sechs DocTypes
 * (kanonische Route, sonst /d/<slug>). Mit `erlaubt` fallen Einträge mit `recht` weg, die die Sitzung nicht hat.
 * @param {BereichDefinition} b
 * @param {{erlaubt?:(recht:{aktion:string, bereich:string}) => boolean}} [opts]
 * @returns {NavEintrag[]}
 */
export function navigationFuer(b, { erlaubt } = {}) {
  if (b.navigation) {
    if (!erlaubt) return b.navigation;
    return b.navigation.filter((n) => !n.recht || erlaubt(rechtVon(n.recht, b.slug)));
  }
  if (!b.doctypes?.length) return [];
  const eintraege = [{ titel: "Übersicht", href: b.startseite, icon: b.icon }];
  for (const dt of b.doctypes.slice(0, 6)) {
    eintraege.push({ titel: dt.replace(/^PH /, ""), href: kanonischeRoute(dt) || `/d/${doctypeSlug(dt)}`, doctype: dt });
  }
  return eintraege;
}

/** `recht` eines Navigationseintrags → { aktion, bereich } (Text = Aktion im eigenen Bereich). */
export function rechtVon(recht, standardBereich) {
  if (typeof recht === "string") return { aktion: recht, bereich: standardBereich };
  return { aktion: recht?.aktion || "read", bereich: recht?.bereich || standardBereich };
}

/** Erster Bereich, zu dem ein DocType gehört (Registrierung zuerst, dann Modul). */
export function bereichFuerDoctype(doctype, modul) {
  const registriert = BEREICHE.find((b) => b.slug !== "zentrale" && b.doctypes.includes(doctype));
  if (registriert) return registriert.slug;
  if (modul) return bereichFuerModul(modul);
  return "zentrale";
}

/** Feste Seite der Zentrale (Ziele der Gehe-zu-Kürzel) oder null, solange es sie nicht gibt. */
export function zentraleSeite(schluessel) {
  return bereich("zentrale")?.seiten?.[schluessel] || null;
}

// ----------------------------------------------------------- Prüfung --

/**
 * Konsistenz des Registers (Unit-Test backoffice-register.test.mjs): doppelte Slugs, doppelte Startseiten,
 * DocType in zwei `routen`, zwei DocTypes auf derselben Listenroute, generische Ziele, fremde DocTypes,
 * unvollständige Navigationseinträge.
 * @param {BereichDefinition[]} [liste]
 * @returns {string[]} Befunde (leer = in Ordnung)
 */
export function pruefeBereiche(liste = BEREICHE) {
  const befunde = [];
  const slugs = new Map();
  const starts = new Map();
  const routenBesitzer = new Map();
  const listenRouten = new Map();
  const rollenNamen = new Map();
  const doctypeBesitzer = new Map();
  for (const b of liste) {
    if (!/^[a-z]+$/.test(b.slug || "")) befunde.push(`Bereich mit ungültigem Slug: ${JSON.stringify(b.slug)}`);
    if (slugs.has(b.slug)) befunde.push(`Slug doppelt: ${b.slug}`);
    slugs.set(b.slug, true);
    if (!b.titel || !b.icon) befunde.push(`${b.slug}: titel oder icon fehlt`);
    if (!String(b.startseite || "").startsWith("/")) befunde.push(`${b.slug}: startseite fehlt`);
    if (starts.has(b.startseite)) befunde.push(`Startseite doppelt: ${b.startseite} (${starts.get(b.startseite)}, ${b.slug})`);
    starts.set(b.startseite, b.slug);
    if (b.rollenName) {
      if (rollenNamen.has(b.rollenName)) befunde.push(`Rollenname doppelt: ${b.rollenName} (${rollenNamen.get(b.rollenName)}, ${b.slug})`);
      rollenNamen.set(b.rollenName, b.slug);
    }
    for (const [rolle, stufe] of Object.entries(b.rollen || {})) {
      if (stufe !== "mitarbeiter" && stufe !== "leitung") befunde.push(`${b.slug}: Stufe für ${rolle} ungültig (${stufe})`);
      if (b.rollenName && (rolle === `PH ${b.rollenName} Mitarbeiter` || rolle === `PH ${b.rollenName} Leitung`)) befunde.push(`${b.slug}: eigene Rolle ${rolle} gehört nicht in rollen`);
    }
    for (const dt of b.doctypes || []) {
      if (b.slug !== "zentrale" && doctypeBesitzer.has(dt) && doctypeBesitzer.get(dt) !== "zentrale") befunde.push(`DocType doppelt: ${dt} (${doctypeBesitzer.get(dt)}, ${b.slug})`);
      if (!doctypeBesitzer.has(dt) || doctypeBesitzer.get(dt) === "zentrale") doctypeBesitzer.set(dt, b.slug);
    }
    for (const n of b.navigation || []) {
      if (!n.titel || !String(n.href || "").startsWith("/")) befunde.push(`${b.slug}: Navigationseintrag unvollständig (${JSON.stringify(n)})`);
    }
    const hrefs = (b.navigation || []).map((n) => n.href);
    for (const h of new Set(hrefs.filter((h, i) => hrefs.indexOf(h) !== i))) befunde.push(`${b.slug}: Navigation doppelt: ${h}`);
    for (const [dt, route] of Object.entries(b.routen || {})) {
      if (typeof route !== "function") {
        befunde.push(`${b.slug}: Route für ${dt} ist keine Funktion`);
        continue;
      }
      if (routenBesitzer.has(dt)) befunde.push(`Route doppelt: ${dt} (${routenBesitzer.get(dt)}, ${b.slug})`);
      routenBesitzer.set(dt, b.slug);
      if (!b.doctypes.includes(dt)) befunde.push(`${b.slug}: Route für fremden DocType ${dt}`);
      let liste1 = null;
      let akte = null;
      try {
        liste1 = route();
        akte = route("MUSTER-1");
      } catch (err) {
        befunde.push(`${b.slug}: Route für ${dt} wirft (${err.message})`);
        continue;
      }
      for (const href of [liste1, akte]) {
        if (typeof href !== "string" || !href.startsWith("/") || href.startsWith("/d/")) befunde.push(`${b.slug}: Route für ${dt} liefert kein eigenes Ziel (${href})`);
      }
      const ohneQuery = String(liste1).split("?")[0];
      if (listenRouten.has(ohneQuery) && String(liste1) === listenRouten.get(ohneQuery).href) befunde.push(`Listenroute doppelt: ${liste1} (${listenRouten.get(ohneQuery).dt}, ${dt})`);
      listenRouten.set(ohneQuery, { dt, href: String(liste1) });
    }
  }
  return befunde;
}
