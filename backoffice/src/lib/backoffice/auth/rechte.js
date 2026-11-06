// Rechte-Matrix des Backoffice. Quelle: Backend-Import/CONVENTIONS.md §4/§5 und
// ph_core/fixtures/role.json (29 Rollen). Zwei Ebenen:
//   darf(session, bereich, aktion)      – Navigation/Seiten je Bereich
//   darfDoc(session, meta, aktion)      – je DocType aus meta.permissions (Frappe-
//                                         Rechte), Rückfall auf die Bereichs-Matrix
// Im Frappe-Modus prüft der Server zusätzlich selbst (die Benutzer-Sitzung wird
// durchgereicht); diese Matrix steuert nur, was die Oberfläche anbietet.
// Reines Modul, testbar mit node --test.

import { BEREICH_SLUGS, ROLLEN_NAMEN, ZUSATZ_ROLLEN } from "../bereiche/index.js";
import { ARBEITSPLAETZE } from "../arbeitsplaetze.js";

export const AKTIONEN = ["read", "write", "create", "delete", "submit", "cancel", "amend", "print", "export", "report", "admin"];

const ALLE = new Set(AKTIONEN);
const LESEN = new Set(["read", "print", "report"]);
const LESEN_EXPORT = new Set(["read", "print", "report", "export"]);
const MITARBEITER = new Set(["read", "write", "create", "submit", "print", "report"]);
const LEITUNG = new Set(["read", "write", "create", "delete", "submit", "cancel", "amend", "print", "export", "report"]);
const ADMIN = new Set(["read", "write", "create", "delete", "print", "export", "report", "admin"]);

/** Rolle "PH CRM Leitung" → { bereich: "crm", stufe: "leitung" } (Rollennamen aus dem Bereichs-Register, `rollenName`). */
export function zerlegeRolle(rolle) {
  const m = /^PH (.+) (Mitarbeiter|Leitung)$/.exec(String(rolle || ""));
  if (!m || !ROLLEN_NAMEN[m[1]]) return null;
  return { bereich: ROLLEN_NAMEN[m[1]], stufe: m[2] === "Leitung" ? "leitung" : "mitarbeiter" };
}

/**
 * Erlaubte Aktionen einer Rolle je Bereich.
 * @returns {Map<string, Set<string>>}  Bereich → Aktionen ("*" = alle Bereiche)
 */
export function rechteDerRolle(rolle) {
  const m = new Map();
  switch (rolle) {
    case "Administrator":
    case "System Manager":
      m.set("*", ALLE);
      return m;
    case "PH Backoffice-Admin":
      m.set("*", ADMIN);
      return m;
    case "PH Geschäftsführung":
    case "PH Geschaeftsfuehrung":
      m.set("*", LESEN_EXPORT);
      m.set("zentrale", new Set([...LESEN_EXPORT, "write", "create"]));
      return m;
    case "PH Buchhaltung extern":
      m.set("faktura", LESEN_EXPORT);
      m.set("kassa", LESEN_EXPORT);
      return m;
    case "PH Montage":
      m.set("projekte", new Set(["read", "write", "print"]));
      m.set("logistik", new Set(["read"]));
      return m;
    case "PH Techniker":
      m.set("service", new Set(["read", "write", "create", "print"]));
      m.set("projekte", new Set(["read"]));
      return m;
    case "PH Personal Selbstservice":
      m.set("personal", new Set(["read", "write", "create"]));
      return m;
    case "PH Website Integration":
      return m; // kein Desk, kein Backoffice
    default: {
      const z = zerlegeRolle(rolle);
      if (z) m.set(z.bereich, z.stufe === "leitung" ? LEITUNG : MITARBEITER);
      zusatz(m, rolle);
      return m;
    }
  }
}

/** Weitere Bereiche einer Fachrolle aus `rollen` der Register-Teildateien (z. B. CRM-Mitarbeiter in der Ablage). */
function zusatz(m, rolle) {
  for (const { bereich, stufe } of ZUSATZ_ROLLEN[rolle] || []) {
    if (!m.has(bereich)) m.set(bereich, stufe === "leitung" ? LEITUNG : MITARBEITER);
  }
}

function rollen(session) {
  return Array.isArray(session?.roles) ? session.roles : Array.isArray(session) ? session : [];
}

/** Alle Aktionen, die die Sitzung in einem Bereich darf. */
export function aktionenIn(session, bereich) {
  const out = new Set();
  if (!rollen(session).length) return out;
  // Jede angemeldete Person sieht die Zentrale lesend (Dashboard, eigene Aufgaben) –
  // außer reine API-Konten (PH Website Integration: kein Desk, kein Backoffice).
  if (bereich === "zentrale" && rollen(session).some((r) => r !== "PH Website Integration")) out.add("read");
  for (const r of rollen(session)) {
    const map = rechteDerRolle(r);
    for (const a of map.get("*") || []) out.add(a);
    for (const a of map.get(bereich) || []) out.add(a);
  }
  return out;
}

/** Hauptprüfung: darf die Sitzung die Aktion im Bereich? */
export function darf(session, bereich, aktion = "read") {
  return aktionenIn(session, bereich).has(aktion);
}

/** Geräte verwalten (registrieren, sperren) dürfen System Manager, PH Backoffice-Admin und jede „PH … Leitung“ (wie PH Geraet in ph_core). */
export function darfGeraeteVerwalten(session) {
  const rollen = session?.roles || [];
  return rollen.includes("System Manager") || rollen.includes("PH Backoffice-Admin") || rollen.some((r) => /^PH .+ Leitung$/.test(r));
}

export function istAdmin(session) {
  return darf(session, "zentrale", "admin");
}

/** Bereiche, die in der Navigation erscheinen (mindestens lesend). */
export function sichtbareBereiche(session) {
  return BEREICH_SLUGS.filter((b) => darf(session, b, "read"));
}

/**
 * DocType-genau über meta.permissions (Frappe-Rechte im JSON). Fehlt die
 * Rolle in der Matrix der DocType, zählt die Bereichs-Matrix als Rückfall;
 * Admin-/System-Manager-Rechte gelten immer.
 */
export function darfDoc(session, meta, aktion = "read") {
  if (!meta) return false;
  const rs = rollen(session);
  if (!rs.length) return false;
  if (rs.includes("Administrator") || rs.includes("System Manager")) return true;
  const perms = (meta.permissions || []).filter((p) => (p.permlevel || 0) === 0);
  if (perms.length) {
    for (const p of perms) {
      if (!rs.includes(p.role)) continue;
      if (p[aktion]) return true;
    }
    // Rollen mit globalem Leserecht (GF) dürfen lesen, auch wenn ein Agent die Rolle in der JSON vergessen hat.
    if (aktion === "read" || aktion === "report" || aktion === "print") {
      if (rs.some((r) => rechteDerRolle(r).get("*")?.has(aktion))) return true;
    }
    if (rs.some((r) => rechteDerRolle(r).get("*")?.has("admin"))) return aktion !== "submit" && aktion !== "cancel" && aktion !== "amend";
    return false;
  }
  return darf(session, meta.bereich || "zentrale", aktion);
}

/** Darf die Sitzung einen Workflow-Übergang mit `allowed`-Rolle ausführen? */
export function darfUebergang(session, transition) {
  const rs = rollen(session);
  if (rs.includes("Administrator") || rs.includes("System Manager")) return true;
  if (!transition?.allowed) return rs.length > 0;
  if (rs.includes(transition.allowed)) return true;
  // Leitung darf alles, was Mitarbeiter des gleichen Bereichs dürfen.
  const z = zerlegeRolle(transition.allowed);
  if (z && z.stufe === "mitarbeiter") return rs.includes(`PH ${transition.allowed.split(" ")[1]} Leitung`);
  return false;
}

// ------------------------------------------------------------ Arbeitsplätze --
// Entscheidung Nr. 49: ein Login, danach Arbeitsplatz-Auswahl. Kassa und
// Packtisch sind Vollbild-Arbeitsplätze derselben Anwendung (KioskShell).

// Register seit P0-1 in ../arbeitsplaetze.js (Schreibt: Zentrale); hier nur re-exportiert.
export { ARBEITSPLAETZE };

/** Arbeitsplätze, die die Sitzung öffnen darf. Admin/System Manager: alle. */
export function erlaubteArbeitsplaetze(session) {
  const rs = rollen(session);
  if (!rs.length) return [];
  const admin = rs.includes("Administrator") || rs.includes("System Manager") || rs.includes("PH Backoffice-Admin");
  return ARBEITSPLAETZE.filter((a) => {
    if (a.nurWenn && !a.nurWenn(session)) return false;
    if (!a.kiosk) return sichtbareBereiche(session).length > 0 && !nurKiosk(rs);
    if (admin) return true;
    return (a.rollen || []).some((r) => rs.includes(r));
  });
}

/** Rollen, die nur einen Arbeitsplatz (kein volles Backoffice) brauchen – trotzdem bleibt die Zentrale lesbar. */
function nurKiosk() {
  return false;
}

export function arbeitsplatz(slug) {
  return ARBEITSPLAETZE.find((a) => a.slug === slug) || null;
}
