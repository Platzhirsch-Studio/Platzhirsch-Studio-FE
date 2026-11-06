// Beispieldaten der Demos „akte“, „vorgangsleiste“, „ergebnis“, „person“ (Team P0-5a). Nur für die
// Baustein-Demos (nur Admin, nur Mock): erfundene Personen und Vorgänge wie im Entwurf „Lounge“,
// runde Beispielbeträge, keine echten Kunden (Q-A3). Bilder aus public/entwurf/lounge (Sortiment).

export const TEAM = {
  LM: { name: "Lena Moosbrugger", material: "cognac", rolle: "Beratung" },
  JF: { name: "Jonas Feurstein", material: "eiche", rolle: "Planung" },
  SB: { name: "Sarah Bösch", material: "salbei", rolle: "Innenarchitektur" },
  DN: { name: "David Natter", material: "see", rolle: "Einkauf" },
  EK: { name: "Elif Kaya", material: "messing", rolle: "Buchhaltung" },
  MG: { name: "Martin Gmeiner", material: "nuss", rolle: "Montageleitung" },
};

const p = (k) => TEAM[k];

/** Kundenreise einer Auftragsmappe (7 Stufen, wie Entwurf „Lounge“ Kundenakte). */
export const REISE = [
  { id: "anfrage", titel: "Anfrage", objekte: [{ titel: "AN-2026-0418", info: "Website", href: "#AN-2026-0418" }], aufgaben: [
    { titel: "Anfrage über Website", person: p("LM"), datum: "2. Sep", zustand: "erledigt" },
    { titel: "Rückruf & Erstgespräch", person: p("LM"), datum: "3. Sep", zustand: "erledigt" },
  ] },
  { id: "beratung", titel: "Beratung & Aufmaß", aufgaben: [
    { titel: "Beratung im Showroom", person: p("LM"), datum: "9. Sep", zustand: "erledigt" },
    { titel: "Aufmaß vor Ort", person: p("JF"), datum: "16. Sep", zustand: "erledigt" },
    { titel: "Muster mitgegeben", person: p("SB"), datum: "16. Sep", zustand: "erledigt" },
  ] },
  { id: "planung", titel: "Planung", aufgaben: [
    { titel: "Handskizze Wohnraum", person: p("SB"), datum: "24. Sep", zustand: "erledigt" },
    { titel: "3D-Planung Küche", person: p("JF"), datum: "2. Okt", zustand: "erledigt" },
    { titel: "Präsentation 3D", person: p("SB"), datum: "8. Okt", zustand: "erledigt" },
  ] },
  { id: "angebot", titel: "Angebot & Auftrag", objekte: [{ titel: "AG-2026-0112 · Version 3", info: "angenommen", href: "#AG" }, { titel: "AB-2026-0094", info: "bestätigt", href: "#AB" }], aufgaben: [
    { titel: "Angebot V3", person: p("LM"), datum: "12. Okt", zustand: "erledigt" },
    { titel: "Auftrag unterschrieben", person: p("LM"), datum: "19. Okt", zustand: "erledigt" },
    { titel: "Anzahlung 40 %", person: p("EK"), datum: "4. Nov", zustand: "erledigt" },
  ] },
  { id: "bestellung", titel: "Bestellung & Lieferung", aufgaben: [
    { titel: "Sofa bestellt", person: p("DN"), datum: "AB erhalten", zustand: "erledigt" },
    { titel: "Küche · Liefertermin", person: p("DN"), datum: "jetzt", zustand: "aktuell", href: "#liefertermin" },
    { titel: "Leuchten bestellen", datum: "bis 13. Nov", zustand: "offen" },
  ] },
  { id: "montage", titel: "Montage & Abnahme", plan: "KW 50", aufgaben: [
    { titel: "Montage Küche", datum: "KW 50", zustand: "offen" },
    { titel: "Abnahmeprotokoll", zustand: "offen" },
  ] },
  { id: "service", titel: "Service", aufgaben: [{ titel: "Pflege nach 6 Monaten", datum: "Juni 2027", zustand: "offen" }] },
];

/** CRM-Vorgang (Anfrage → Termin → Gespräch → Angebot → Auftrag) ohne Aufgaben. */
export const CRM_VORGANG = [
  { id: "anfrage", titel: "Anfrage", zustand: "erledigt", datum: "01.11.", objekte: [{ titel: "AN-2026-0431", href: "#AN" }] },
  { id: "termin", titel: "Termin", zustand: "erledigt", datum: "Di 04.11. 14:00", objekte: [{ titel: "Termin Showroom", info: "bestätigt", href: "#T" }] },
  { id: "gespraech", titel: "Gespräch", zustand: "aktuell", datum: "04.11.", objekte: [{ titel: "Gesprächsprotokoll", info: "Entwurf", href: "#G" }] },
  { id: "angebot", titel: "Angebot", zustand: "offen" },
  { id: "auftrag", titel: "Auftrag", zustand: "offen" },
];

/** Faktura-Belegkette mit Korrektur. */
export const BELEGKETTE = [
  { id: "angebot", titel: "Angebot", zustand: "erledigt", datum: "12.10.", objekte: [{ titel: "AG-2026-0112", href: "#AG" }] },
  { id: "auftrag", titel: "Auftrag", zustand: "erledigt", datum: "19.10.", objekte: [{ titel: "AB-2026-0094", href: "#AB" }] },
  { id: "anzahlung", titel: "Anzahlung", zustand: "erledigt", datum: "04.11.", objekte: [{ titel: "RE-2026-0204", info: "Anzahlung 40 %", href: "#RE1" }] },
  { id: "rechnung", titel: "Schlussrechnung", zustand: "teilweise", objekte: [{ titel: "RE-2026-0242", info: "storniert", href: "#RE2" }, { titel: "GU-2026-0007", info: "Gutschrift", href: "#GU" }, { titel: "RE-2026-0251", info: "offen", href: "#RE3" }] },
  { id: "zahlung", titel: "Zahlung", zustand: "offen", plan: "fällig 18.11." },
];

/** Service-Phasen mit übersprungener Stufe. */
export const SERVICE = [
  { id: "meldung", titel: "Meldung", zustand: "erledigt", datum: "28.10." },
  { id: "pruefung", titel: "Prüfung", zustand: "erledigt", datum: "29.10." },
  { id: "kulanz", titel: "Kulanz", zustand: "uebersprungen" },
  { id: "einsatz", titel: "Einsatz", zustand: "aktuell", plan: "Do 06.11." },
  { id: "abschluss", titel: "Abschluss", zustand: "offen" },
  { id: "rechnung", titel: "Rechnung", zustand: "offen" },
];

export const BILD = { src: "/entwurf/lounge/r-hero-essraum.jpg", alt: "Planung Essraum mit Gartenblick, Variante B", position: "50% 62%" };

/** Bezüge in der Form von ladeBezuege() (Beispielwerte, keine Abfrage). */
export const BEZUEGE = {
  gleichzeitig: [
    { id: "kontakt", titel: "Familie Brändle", info: "Kundin seit 2019 · Lochau", icon: "Contact", href: "#kontakt" },
  ],
  vorher: [
    { id: "anfrage", titel: "Anfrage", info: "AN-2026-0418 · Website", icon: "Inbox", href: "#anfrage" },
    { id: "angebot", titel: "Angebot", info: "AG-2026-0112 · Version 3", icon: "FileText", href: "#angebot" },
  ],
  nachher: [
    { id: "planung", titel: "Planung", gruppe: "Planung", anzahl: 14, icon: "Ruler", href: "#planung", anlegenHref: "#planung-neu" },
    { id: "montage", titel: "Montageauftrag", gruppe: "Umsetzung", anzahl: 0, icon: "Hammer", href: "#montage", anlegenHref: "#montage-neu" },
    { id: "rechnung", titel: "Rechnung", gruppe: "Belege", anzahl: 2, icon: "Receipt", href: "#rechnung" },
    { id: "lieferschein", titel: "Lieferschein", zaehlerFehlt: true, icon: "Truck", href: "#lieferschein" },
    { id: "kassa", titel: "Kassenbeleg", nichtVerknuepft: true, icon: "Banknote" },
  ],
};
