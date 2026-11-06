// Register der Arbeitsplätze (G-01, R-11, Entscheidung Nr. 49): ein Login, danach Arbeitsplatz-Auswahl.
// Kassa, Packtisch, Montage und Technik sind Vollbild-Arbeitsplätze derselben Anwendung (KioskShell).
// Schreibt: nur Zentrale (MASTER § 3.5). Reines Datenmodul; die Rechte-Logik (erlaubteArbeitsplaetze)
// liegt in auth/rechte.js und liest dieses Register.
//
// Felder: slug, titel, beschreibung, icon (lucide-Name), href/route (Ziel nach der Wahl), kiosk,
// rollen[] (Kiosk: wer darf; Admin/System Manager immer), ziffer (Taste 1–5 auf /arbeitsplatz und im
// Benutzermenü, später 6), nurWenn?(session) (zusätzliche Bedingung, z. B. Event-Check-in nur am Eventtag).

/**
 * @typedef {{slug:string, titel:string, beschreibung:string, href:string, route:string, icon:string, kiosk:boolean,
 *   rollen?:string[], ziffer:number, nurWenn?:(session:object) => boolean}} Arbeitsplatz
 */

/** @type {Arbeitsplatz[]} */
export const ARBEITSPLAETZE = [
  { slug: "backoffice", titel: "Backoffice", beschreibung: "Listen, Formulare, Dashboard", href: "/", route: "/", icon: "LayoutDashboard", kiosk: false, ziffer: 1 },
  { slug: "kassa", titel: "Kassa", beschreibung: "Belege, Tagesabschluss (RKSV)", href: "/kassa", route: "/kassa", icon: "Wallet", kiosk: true, rollen: ["PH Kassa Mitarbeiter", "PH Kassa Leitung"], ziffer: 2 },
  { slug: "packtisch", titel: "Packtisch", beschreibung: "Lieferscheine packen, Etiketten", href: "/packtisch", route: "/packtisch", icon: "PackageCheck", kiosk: true, rollen: ["PH Logistik Mitarbeiter", "PH Logistik Leitung"], ziffer: 3 },
  { slug: "montage", titel: "Montage (mobil)", beschreibung: "Aufträge, Fotos, Abnahme", href: "/montage", route: "/montage", icon: "Hammer", kiosk: true, rollen: ["PH Montage", "PH Projekte Mitarbeiter", "PH Projekte Leitung"], ziffer: 4 },
  { slug: "technik", titel: "Technikereinsatz (mobil)", beschreibung: "Serviceeinsätze, Ersatzteile", href: "/technik", route: "/technik", icon: "Wrench", kiosk: true, rollen: ["PH Techniker", "PH Service Mitarbeiter", "PH Service Leitung"], ziffer: 5 },
];

export function arbeitsplatzDaten(slug) {
  return ARBEITSPLAETZE.find((a) => a.slug === slug) || null;
}

/** Konsistenz (Unit-Test): Slug, Ziffer oder Route doppelt, Ziffer außerhalb 1–9, Kiosk ohne Rollen. */
export function pruefeArbeitsplaetze(liste = ARBEITSPLAETZE) {
  const befunde = [];
  for (const feld of ["slug", "ziffer", "route"]) {
    const werte = liste.map((a) => a[feld]);
    for (const w of new Set(werte.filter((w, i) => werte.indexOf(w) !== i))) befunde.push(`Arbeitsplatz: ${feld} doppelt (${w})`);
  }
  for (const a of liste) {
    if (!Number.isInteger(a.ziffer) || a.ziffer < 1 || a.ziffer > 9) befunde.push(`Arbeitsplatz ${a.slug}: Ziffer ${a.ziffer} außerhalb 1–9`);
    if (a.href !== a.route) befunde.push(`Arbeitsplatz ${a.slug}: href und route verschieden`);
    if (a.kiosk && !(a.rollen || []).length) befunde.push(`Arbeitsplatz ${a.slug}: Kiosk ohne Rollen`);
    if (a.nurWenn !== undefined && typeof a.nurWenn !== "function") befunde.push(`Arbeitsplatz ${a.slug}: nurWenn ist keine Funktion`);
  }
  return befunde;
}
