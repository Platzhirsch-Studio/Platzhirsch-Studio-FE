// Zentrale je Rolle (10-konzept-zentrale § 3.2.5, Lounge § 7.1): welche Kacheln in welcher Reihenfolge und Breite.
// Reines Modul (keine "@/"-Importe), unit-getestet (tests/unit/zentrale-layout.test.mjs).
//
// Raster: 12 Spalten (Bento, Lounge § 4). Die Heute-Spalte steht links über zwei Reihen (3 Spalten), daneben
// füllen die übrigen Kacheln je Reihe 9 Spalten; ab Reihe 3 wieder volle 12. `reihen()` liefert die Breiten,
// der Test prüft, dass jede Reihe aufgeht (kein Loch, kein Umbruch mitten in der Reihe).

import { GRUSS } from "./texte.js";

export const VARIANTEN = ["mitarbeiter", "leitung", "gf", "admin", "extern", "selbst", "kiosk"];

const KIOSK_ROLLEN = new Set(["PH Kassa Mitarbeiter", "PH Logistik Mitarbeiter", "PH Montage", "PH Techniker"]);

/** Rollen einer Sitzung (Array oder session.roles). */
function rollen(s) {
  return Array.isArray(s) ? s : Array.isArray(s?.roles) ? s.roles : [];
}

/**
 * Rollenvariante der Zentrale: admin > gf > leitung > extern > selbst > kiosk > mitarbeiter.
 * @returns {"mitarbeiter"|"leitung"|"gf"|"admin"|"extern"|"selbst"|"kiosk"}
 */
export function variante(session) {
  const rs = rollen(session).filter((r) => r !== "PH Website Integration");
  if (!rs.length) return "mitarbeiter";
  if (rs.includes("PH Backoffice-Admin") || rs.includes("System Manager") || rs.includes("Administrator")) return "admin";
  if (rs.includes("PH Geschäftsführung") || rs.includes("PH Geschaeftsfuehrung")) return "gf";
  if (rs.some((r) => /^PH .+ Leitung$/.test(r))) return "leitung";
  if (rs.every((r) => r === "PH Buchhaltung extern")) return "extern";
  if (rs.every((r) => r === "PH Personal Selbstservice")) return "selbst";
  if (rs.every((r) => KIOSK_ROLLEN.has(r) || r === "PH Personal Selbstservice")) return "kiosk";
  return "mitarbeiter";
}

/** Begrüßung nach Wiener Uhrzeit: bis 11 Uhr Morgen, bis 18 Uhr Tag, danach Abend. */
export function gruss(jetzt = new Date()) {
  const teil = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hourCycle: "h23", timeZone: "Europe/Vienna" }).formatToParts(jetzt).find((x) => x.type === "hour");
  const h = Number(teil?.value ?? 12);
  if (h >= 4 && h < 11) return GRUSS.morgen;
  if (h >= 11 && h < 18) return GRUSS.tag;
  return GRUSS.abend;
}

/** Vorname aus dem Anzeigenamen („Erika Beispiel (Admin)“ → „Erika“). */
export function vorname(name = "") {
  const ohne = String(name).replace(/\s*\(.*\)\s*$/, "").trim();
  const teile = ohne.split(/\s+/).filter((t) => !/^(dr|mag|ing|di|prof)\.?$/i.test(t));
  return teile[0] || ohne || "";
}

/** Profilname ohne „PH “ (Konzept § 3.2.4, Zeile 2 des Kopfs). */
export function profilName(session) {
  const rs = rollen(session).filter((r) => r !== "System Manager" && r !== "PH Website Integration");
  const erste = rs.find((r) => /Leitung|Geschäftsführung|Admin/.test(r)) || rs[0] || "";
  return erste.replace(/^PH /, "").replace("Backoffice-Admin", "Administration").replace("Buchhaltung extern", "Kanzlei");
}

/**
 * Feste Primäraktion je Rolle (Konzept § 0.1/§ 3.2.4): Verkauf „Neue Anfrage“, Faktura „Neue Rechnung“, sonst
 * „Neue Aufgabe“. Die Seite prüft das Recht und fällt auf die nächste erlaubte zurück (`erlaubt(eintrag)`).
 * href wird über kanonische Routen der Bereiche aufgelöst (Seite).
 */
export const PRIMAER_JE_PROFIL = [
  { wenn: (rs) => rs.some((r) => /^PH CRM /.test(r)), titel: "Neue Anfrage", doctype: "PH Anfrage", bereich: "crm" },
  { wenn: (rs) => rs.some((r) => /^PH Faktura /.test(r)), titel: "Neue Rechnung", doctype: "PH Rechnung", bereich: "faktura" },
  { wenn: (rs) => rs.some((r) => /^PH Projekte /.test(r)), titel: "Neues Projekt", doctype: "PH Projekt", bereich: "projekte" },
  { wenn: (rs) => rs.some((r) => /^PH Service /.test(r)), titel: "Neuer Servicefall", doctype: "PH Servicefall", bereich: "service" },
  { wenn: () => true, titel: "Neue Aufgabe", doctype: "PH Aufgabe", bereich: "zentrale", href: "/aufgaben?neu=1" },
];

/** Primäraktion: erste passende Zeile, deren Recht `erlaubt(eintrag)` bestätigt; sonst null. */
export function primaerAktion(session, erlaubt = () => true) {
  const rs = rollen(session);
  for (const p of PRIMAER_JE_PROFIL) if (p.wenn(rs) && erlaubt(p)) return p;
  return null;
}

/**
 * Kachelplan je Variante als Reihen (Bento, 12 Spalten). Jede Reihe geht auf 12 auf; die Heute-Spalte (`hoch`)
 * belegt in Reihe 1 und 2 je 3 Spalten, die zweite Reihe trägt dann nur 9. Fehlt ein Leserecht, rückt eine
 * Ersatz-Kachel gleicher Breite nach – nie ein Loch im Raster.
 * @param {object} session
 * @param {{sicht?:(bereich:string)=>boolean, akzente?:number, kennzahlen?:number}} [opt]
 *   sicht = darf lesen; akzente = Zahl verfügbarer Akzentkacheln (0–2); kennzahlen = Zahl übriger Kennzahlen
 * @returns {Array<Array<{id:string, breite:number, hoch?:boolean}>>}
 */
export function plan(session, { sicht = () => true, akzente = 2, kennzahlen = 4 } = {}) {
  const v = variante(session);
  const k = (id, breite, hoch = false) => ({ id, breite, ...(hoch ? { hoch: true } : {}) });
  const a = Math.max(0, Math.min(2, akzente));
  // Reihe 1: Heute · Braucht deine Antwort · bis zu zwei Akzentkacheln (Wartet wird breiter, wenn Akzente fehlen).
  const reihe1 = (links) => [k("heute", 3, true), k(links, 9 - 2 * a), ...(a >= 1 ? [k("akzent1", 2)] : []), ...(a >= 2 ? [k("akzent2", 2)] : [])];
  if (v === "extern") return [[k("extern-export", 4), k("extern-posten", 4), k("extern-kassa", 4)]];
  if (v === "selbst") return [[k("heute", 3, true), k("stempel", 5), k("urlaub", 4)], [k("aufgaben", 9)]];
  if (v === "kiosk") return [reihe1("arbeitsplatz"), [k("aufgaben", 9)]];
  const crm = sicht("crm");
  const faktura = sicht("faktura");
  const projekte = sicht("projekte");
  if (v === "admin") {
    // Je Platz die erste freie Kachel aus der Kandidatenliste (nie doppelt); ohne Kandidat wird die Nachbarkachel breiter.
    const frei = new Set(["umsatz", "pipeline", "kennzahlen", "zuletzt"].filter((id) => (id === "umsatz" ? faktura : id === "pipeline" ? crm : id === "kennzahlen" ? kennzahlen > 0 : true)));
    const nimm = () => {
      const id = [...frei][0];
      frei.delete(id);
      return id;
    };
    const a = nimm();
    const b = nimm();
    const r3 = [a && k(a, 4), b && k(b, 4), k("integration", 4)].filter(Boolean);
    if (r3.length < 3) r3[r3.length - 1] = k("integration", 12 - 4 * (r3.length - 1));
    return [reihe1("wartet"), [k("aufgaben", 5), k("betrieb", 4)], r3, projekte ? [k("projekte", 8), k("aktivitaet", 4)] : [k("aktivitaet", 12)]];
  }
  const rechts2 = faktura ? "umsatz" : crm ? "pipeline" : kennzahlen > 0 ? "kennzahlen" : "zuletzt";
  const reihen = [reihe1("wartet"), [k("aufgaben", 5), k(rechts2, 4)]];
  const r3links = projekte ? "projekte" : rechts2 !== "kennzahlen" && kennzahlen > 0 ? "kennzahlen-breit" : "zuletzt";
  reihen.push(r3links === rechts2 ? [k("aktivitaet", 12)] : [k(r3links, 8), k("aktivitaet", 4)]);
  const benutzt = new Set(reihen.flat().map((x) => x.id.replace(/-breit$/, "")));
  if (crm && !benutzt.has("pipeline")) reihen.push(kennzahlen > 0 && !benutzt.has("kennzahlen") ? [k("pipeline", 6), k("kennzahlen", 6)] : [k("pipeline", 12)]);
  else if (kennzahlen > 0 && !benutzt.has("kennzahlen")) reihen.push([k("kennzahlen", 12)]);
  return reihen;
}

/** Flache Liste der Kacheln (Lesereihenfolge, auch am Telefon). */
export function kacheln(session, opt) {
  return plan(session, opt).flat();
}

/** Belegte Spalten je Reihe (die Heute-Spalte zählt in Reihe 2 mit). Für den Unit-Test „jede Reihe = 12“. */
export function spaltenJeReihe(reihen) {
  return reihen.map((r, i) => r.reduce((s, x) => s + x.breite, 0) + (i === 1 && reihen[0].some((x) => x.hoch) ? 3 : 0));
}
