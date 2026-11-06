// Register der Baustein-Demos (MASTER § 4): /einstellungen?tab=system&baustein=<name>,
// nur Admin, nur Mock-Modus – für QA-Screenshots und Abnahme der Fundament-Bausteine.
//
// Regeln für Einträge:
// - Je Team genau EINE Zeile in DEMOS: name → { titel, team, laden }.
// - `laden` importiert die Demo-Datei components/Backoffice/Demo/<name>.js (Default-Export,
//   Client- oder Server-Komponente, ohne Props; Texte aus dem eigenen texte.js bzw. TEXTE-Objekt).
// - Name = URL-Wert (klein, a–z, 0–9, Bindestrich).
//
// Einbindung in die Einstellungsseite (Besitzer: Team Zentrale / L0):
//   const demo = demoFuer(sp.baustein, { admin: istAdmin(session), modus: backofficeMode() });
//   if (sp.tab === "system" && demo) { const Demo = (await demo.laden()).default; return <Shell …><Demo /></Shell>; }

export const DEMOS = {
  motion: { titel: "Bewegung", team: "Q2", laden: () => import("@/components/Backoffice/Demo/motion") },
  grundbausteine: { titel: "Grundbausteine im Lounge-Stil (Token, Kachel, Bento, Akzentkachel, Knopf, Rundknopf, Pfeil, Status, Pille, Avatar, Schalter, Kennzahl, Segment, Leer, Fehler, Charts, Dichte)", team: "P0-2", laden: () => import("@/components/Backoffice/Demo/grundbausteine") },
  register: { titel: "Register und Fähigkeiten (Bereiche, Palette, Kürzel, Seed, Arbeitsplätze, Fähigkeit, Codes)", team: "P0-1", laden: () => import("@/components/Backoffice/Demo/register") },
  overlay: { titel: "Overlays im Lounge-Stil (Popover, Menü, Kontextmenü, Tooltip, Dialog, Bestätigen, Sheet mit Griff, Peek, Lightbox)", team: "P0-4", laden: () => import("@/components/Backoffice/Demo/overlay") },
  commit: { titel: "Rückmeldung und Rückgängig (Toast v2, verzögerter Commit, Ausstehend)", team: "P0-3", laden: () => import("@/components/Backoffice/Demo/commit") },
  shell: { titel: "Shell v2 (Freigaben, Glocke, Palette, Hilfe-Panel, Erstbesuch, Kundenmodus, Testband)", team: "P0-7", laden: () => import("@/components/Backoffice/Demo/shell") },
  eingabe: { titel: "Eingabe und Kiosk (Kalender, Slotraster, Plantafel, BetragFeld, ScanTor, KameraScan, Unterschrift, FotoAufnahme, Zahlentastatur, Stepper48, Wischaktion, Positionsgrid, Kundendisplay-Kanal)", team: "P0-6", laden: () => import("@/components/Backoffice/Demo/eingabe") },
  seitenmuster: { titel: "Seitenmuster im Lounge-Stil (Seitenkopf, Unternav, Zu tun, Liste mit Bildern, Kanban, Formular, Speicherleiste, Autosave, Zwei-Klick-Knopf, Berichtsseite)", team: "P0-5b", laden: () => import("@/components/Backoffice/Demo/seitenmuster") },
  "druck-informieren": { titel: "Drucken, Kunden informieren, Leitung bitten, An der Kassa (DruckPanel, DruckMenü, Informieren-Chip und -Sheet, LeitungBitten, AnDieKassa)", team: "P0-5c", laden: () => import("@/components/Backoffice/Demo/druck-informieren") },
  akte: { titel: "Akte-Gerüst (Kopf, Hero mit Glas-Kacheln, Reiter, Band, Slots, rechte Spalte, Bezüge)", team: "P0-5a", laden: () => import("@/components/Backoffice/Demo/akte") },
  vorgangsleiste: { titel: "Vorgangsleiste (Kundenreise, Vorgang, Belegkette, Kurzform)", team: "P0-5a", laden: () => import("@/components/Backoffice/Demo/vorgangsleiste") },
  ergebnis: { titel: "ErgebnisKarte (Kassa, Faktura, Logistik)", team: "P0-5a", laden: () => import("@/components/Backoffice/Demo/ergebnis") },
  person: { titel: "PersonZelle (Größen, Rolle, Abwesenheit, Tabelle)", team: "P0-5a", laden: () => import("@/components/Backoffice/Demo/person") },
};

/** Demos, die selbst eine Seitenüberschrift (h1) setzen; alle anderen bekommen von der Einstellungsseite eine unsichtbare. */
export const DEMOS_MIT_H1 = new Set(["grundbausteine", "eingabe", "commit", "seitenmuster"]);

/** Texte der Einbindung in /einstellungen (L0). */
export const DEMO_TEXTE = Object.freeze({
  bausteine: "Bausteine",
  bausteineUnter: "Vorführseiten der Fundament-Bausteine mit Beispieldaten. Nur für die Administration im Mock-Modus.",
  baustein: "Baustein",
  zurueck: "Alle Bausteine",
  oeffnen: "Öffnen",
  team: "Team",
  keine: "Bausteine stehen nur im Mock-Modus und nur für die Administration bereit.",
});

const NAME = /^[a-z0-9-]{1,40}$/;

/**
 * Demo-Eintrag für eine Anfrage oder null (unbekannt, kein Admin, nicht Mock-Modus).
 * @param {string|undefined} name
 * @param {{admin: boolean, modus: string}} ctx
 */
export function demoFuer(name, { admin, modus } = {}) {
  if (!admin || modus !== "mock") return null;
  if (typeof name !== "string" || !NAME.test(name)) return null;
  const e = Object.prototype.hasOwnProperty.call(DEMOS, name) ? DEMOS[name] : null;
  return e ? { name, ...e } : null;
}

/** Liste für eine Übersicht „Bausteine“ (nur Admin, nur Mock). */
export function demoListe({ admin, modus } = {}) {
  if (!admin || modus !== "mock") return [];
  return Object.entries(DEMOS).map(([name, e]) => ({ name, titel: e.titel, team: e.team, href: `/einstellungen?tab=system&baustein=${name}` }));
}
