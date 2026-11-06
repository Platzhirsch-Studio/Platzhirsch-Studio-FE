// Druck-Register und Druck-Logik (G-17, Team P0-5c). Reines Modul – browser- und servertauglich, ohne "@/"-Importe.
//
// Quelle der Formate: die Frappe-Druckformate der ph_*-Apps (Backend-Import/*/fixtures/print_format.json und
// ph_kassa/print_format/*), Namen exakt übernommen – sie sind der Wert für `?format=` bzw. download_pdf.
// Der Unit-Test `backoffice-p05c.test.mjs` gleicht DRUCKFORMATE mit Backend-Import ab (nichts erfunden, nichts vergessen).
//
//   formateFuer("PH Lieferschein")      → [{ name:"PH Lieferschein Standard", titel:"Standard", papier:"a4" }, …]
//   druckHref("PH Rechnung", "RE-2026-00042", "PH Rechnung Anzahlung") → "/druck/ph-rechnung/RE-2026-00042?format=…"
//   pdfHref(…)                           → "/druck/…/pdf?format=…"  (nur Frappe-Modus liefert ein PDF)
//   neuerAuftrag / auftragWeiter         → Warteschlange je Gerät (Zustände wartet · druckt · gedruckt · fehler · pdf)

import { anzeige } from "../labels.js";
import { doctypeSlug } from "../format.js";

/** DocType → Druckformate (Reihenfolge = Reihenfolge in der App, erstes = Standard). */
export const DRUCKFORMATE = Object.freeze({
  "PH Anfrage": ["PH Anfrage Übersicht"],
  "PH Termin": ["PH Termin Bestätigung"],
  "PH Beratungsgespraech": ["PH Beratungsgespraech Protokoll"],
  "PH Kontakt": ["PH Kontakt DSGVO-Auskunft", "PH Kontakt Etikett", "PH Kontoauszug Kunde"],
  "PH Angebot": ["PH Angebot Standard"],
  "PH Auftragsbestaetigung": ["PH Auftragsbestaetigung Standard"],
  "PH Rechnung": ["PH Rechnung Standard", "PH Rechnung Anzahlung"],
  "PH Gutschrift": ["PH Gutschrift Standard"],
  "PH Mahnung": ["PH Mahnung Standard"],
  "PH Export Lauf": ["PH Export Uebergabeprotokoll"],
  "PH Kassenabschluss": ["PH Kassenabschluss Protokoll"],
  "PH Kassenbeleg": ["PH Kassenbeleg A4", "PH Kassenbeleg Bon 80mm"],
  "PH Kundenkarte": ["PH Kundenkarte Karte", "PH Kundenkarte Begruessung"],
  "PH Kundenkarte Stufe": ["PH Kundenkarte Vorteilsuebersicht"],
  "PH Lieferschein": ["PH Lieferschein Standard", "PH Lieferschein Packliste"],
  "PH Sendung": ["PH Sendung Retourenschein"],
  "PH Tour": ["PH Tour Tourenblatt"],
  "PH Inventur": ["PH Inventur Zaehlliste"],
  "PH Lagerbestand": ["PH Lagerbestand Etikett"],
  "PH Speditionsauftrag": ["PH Speditionsauftrag Standard"],
  "PH Lagerort": ["PH Lagerort Platz-Etikett"],
  "PH Warenruecknahme": ["PH Warenruecknahme Protokoll"],
  "PH Inventurbewertung": ["PH Inventurbewertung"],
  "PH Event": ["PH Event Teilnehmerliste", "PH Event Namensschilder", "PH Event Ticket"],
  "PH Einwilligung": ["PH Einwilligung Nachweis"],
  "PH Kampagne": ["PH Kampagnenbericht"],
  "PH Stelle": ["PH Stelle Aushang"],
  "PH Bewerbung": ["PH Bewerbung Deckblatt", "PH Bewerbung Absage", "PH Bewerbung Zusage"],
  "PH Mitarbeiter": ["PH Mitarbeiter Zeitnachweis"],
  "PH Abwesenheit": ["PH Abwesenheit Bestaetigung"],
  "PH Dienstplan": ["PH Dienstplan Woche"],
  "PH Projekt": ["PH Projekt Statusbericht", "PH Auftragsmappe Deckblatt"],
  "PH Montageauftrag": ["PH Montagebericht"],
  "PH Abnahme": ["PH Abnahmeprotokoll"],
  "PH Produktpass": ["PH Produktpass"],
  "PH Referenz": ["PH Referenz Einwilligung"],
  "PH Aufmass": ["PH Aufmass Protokoll"],
  "PH Nachtrag": ["PH Nachtrag Standard"],
  "PH Projekt Nachkalkulation": ["PH Projekt Nachkalkulation"],
  "PH Serviceeinsatz": ["PH Servicebericht"],
  "PH Servicefall": ["PH Servicefall Reklamationsmeldung", "PH Servicefall Abnahmebestätigung"],
  "PH Pflege Abo": ["PH Pflegeprotokoll"],
  "PH Ersatzteilbestellung": ["PH Ersatzteilbestellung"],
  "PH Serviceauftrag": ["PH Serviceauftrag Übernahmeliste"],
  "PH Lieferantenregress": ["PH Lieferantenregress Belastungsanzeige"],
  "PH Bestellung": ["PH Bestellung Bestätigung"],
  "PH Gutschein": ["PH Gutschein"],
  "PH Zahlung": ["PH Zahlungsbeleg"],
  "PH Widerruf": ["PH Widerruf Bestätigung"],
  "PH Retoure": ["PH Retoure Begleitschein"],
  "PH Herstellerbestellung": ["PH Herstellerbestellung Standard", "PH AB Abgleich Protokoll"],
  "PH Wareneingang": ["PH Wareneingang Protokoll"],
  "PH Produkt": ["PH Produkt Datenblatt"],
});

/** Titel, die die Umlaut-Regel nicht trifft (österreichische Schreibung). */
const TITEL = Object.freeze({
  "PH Kundenkarte Begruessung": "Begrüßung",
  "PH Kassenbeleg Bon 80mm": "Bon 80 mm",
  "PH Kontakt DSGVO-Auskunft": "Datenschutz-Auskunft",
});

/** Papierart eines Formats: a4 (Standard), bon (80 mm), etikett. */
export function papierFuer(format) {
  const n = String(format || "");
  if (/\bBon\b|80\s?mm/i.test(n)) return "bon";
  if (/Etikett|Namensschild/i.test(n)) return "etikett";
  return "a4";
}

/** Anzeigename eines Formats ohne „PH “ und ohne den DocType-Namen („PH Lieferschein Packliste“ → „Packliste“). */
export function formatTitel(format, doctype) {
  const name = String(format || "");
  if (TITEL[name]) return TITEL[name];
  const ohnePh = name.replace(/^PH\s+/, "");
  const dt = String(doctype || "").replace(/^PH\s+/, "");
  let rest = ohnePh;
  if (dt && ohnePh === dt) rest = "Standard";
  else if (dt && ohnePh.startsWith(`${dt} `)) rest = ohnePh.slice(dt.length + 1);
  return anzeige(rest) || "Standard";
}

/**
 * Formate eines DocTypes für die Auswahl im Druckpanel.
 * @param {string} doctype
 * @param {string[]} [zusatz]  weitere Formate des Bereichs (z. B. aus getList("Print Format") im Frappe-Modus)
 * @returns {{name:string, titel:string, papier:"a4"|"bon"|"etikett", standard:boolean}[]}
 */
export function formateFuer(doctype, zusatz = []) {
  const namen = [...(DRUCKFORMATE[doctype] || [])];
  for (const z of Array.isArray(zusatz) ? zusatz : []) if (typeof z === "string" && z && !namen.includes(z)) namen.push(z);
  if (!namen.length) return [{ name: "Standard", titel: "Standard", papier: "a4", standard: true }];
  return namen.map((name, i) => ({ name, titel: formatTitel(name, doctype), papier: papierFuer(name), standard: i === 0 }));
}

/** Gemerktes Format (je DocType) nur, wenn es noch existiert; sonst das erste. */
export function waehleFormat(formate, gemerkt) {
  if (!Array.isArray(formate) || !formate.length) return "Standard";
  return formate.some((f) => f.name === gemerkt) ? gemerkt : formate[0].name;
}

/** Speicher-Schlüssel für das gemerkte Format je DocType (localStorage, Zentrale § 3.14). */
export function formatSchluessel(doctype) {
  return `ph-bo:druckformat:${doctypeSlug(doctype || "x")}`;
}

function q(format) {
  return format && format !== "Standard" ? `?format=${encodeURIComponent(format)}` : "";
}

/** HTML-Druckansicht (vorhandene Route /druck/[doctype]/[name]). */
export function druckHref(doctype, name, format) {
  return `/druck/${doctypeSlug(doctype)}/${encodeURIComponent(name)}${q(format)}`;
}

/** PDF über Frappe (Route /druck/[doctype]/[name]/pdf, nur Frappe-Modus). */
export function pdfHref(doctype, name, format) {
  return `/druck/${doctypeSlug(doctype)}/${encodeURIComponent(name)}/pdf${q(format)}`;
}

/** Zoom-Stufen der Vorschau (Zentrale § 3.14: „Breite · 100 % · Seite“, Standard Breite). */
export const ZOOM = Object.freeze(["breite", "100", "seite"]);

/**
 * Maßstab der Vorschau. Seite A4 = 794 × 1123 CSS-px (96 dpi).
 * @param {"breite"|"100"|"seite"} zoom
 * @param {{breite:number, hoehe:number}} flaeche  verfügbare Fläche in px
 * @param {"a4"|"bon"|"etikett"} [papier]
 */
export function vorschauMassstab(zoom, flaeche, papier = "a4") {
  const seite = PAPIER[papier] || PAPIER.a4;
  const b = Math.max(1, Number(flaeche?.breite) || 0);
  const h = Math.max(1, Number(flaeche?.hoehe) || 0);
  if (zoom === "100") return 1;
  if (zoom === "seite") return Math.min(1, b / seite.breite, h / seite.hoehe);
  return Math.min(1.5, b / seite.breite);
}

/** Seitenmaße in CSS-px (A4 794×1123, Bon 80 mm ≈ 302 breit, Etikett 62 × 29 mm ≈ 234×110). */
export const PAPIER = Object.freeze({
  a4: { breite: 794, hoehe: 1123 },
  bon: { breite: 302, hoehe: 900 },
  etikett: { breite: 234, hoehe: 110 },
});

// ------------------------------------------------------------------ Warteschlange (je Gerät) --

export const AUFTRAG_ZUSTAENDE = Object.freeze(["wartet", "druckt", "gedruckt", "fehler", "pdf"]);
const UEBERGANG = Object.freeze({
  wartet: ["druckt", "fehler", "pdf"],
  druckt: ["gedruckt", "fehler", "pdf"],
  fehler: ["wartet", "pdf"],
  gedruckt: ["wartet"],
  pdf: ["wartet"],
});

let zaehler = 0;

/**
 * Neuer Druckauftrag (Client-Warteschlange, IndexedDB ph_bo_druck).
 * @param {{doctype:string, name:string, titel?:string, format:string, kopien?:number, gruppe?:string}} a
 * @param {number} [jetzt]
 */
export function neuerAuftrag(a, jetzt = Date.now()) {
  if (!a?.doctype || !a?.name) throw new TypeError("Druckauftrag ohne Objekt");
  zaehler = (zaehler + 1) % 1e6;
  const kopien = Math.min(20, Math.max(1, Math.trunc(Number(a.kopien) || 1)));
  return {
    id: `d-${jetzt.toString(36)}-${zaehler.toString(36)}`,
    doctype: a.doctype,
    name: String(a.name),
    titel: a.titel ? String(a.titel) : String(a.name),
    format: a.format || "Standard",
    papier: papierFuer(a.format),
    kopien,
    gruppe: a.gruppe || null,
    zustand: "wartet",
    fehler: null,
    zeit: jetzt,
    geaendert: jetzt,
  };
}

/** Zustand wechseln; unerlaubte Übergänge liefern den Auftrag unverändert. */
export function auftragWeiter(auftrag, zustand, { fehler = null, jetzt = Date.now() } = {}) {
  if (!auftrag || !UEBERGANG[auftrag.zustand]?.includes(zustand)) return auftrag;
  return { ...auftrag, zustand, fehler: zustand === "fehler" ? String(fehler || "Drucker nicht erreichbar") : null, geaendert: jetzt };
}

/**
 * Sammeldruck: mehrere Formate für ein Objekt (oder ein Format für mehrere Objekte) als Aufträge einer Gruppe.
 * @param {{doctype:string, name:string, titel?:string}[]} objekte
 * @param {string[]} formate
 */
export function sammelAuftraege(objekte, formate, jetzt = Date.now()) {
  const gruppe = `g-${jetzt.toString(36)}`;
  const aus = [];
  for (const o of objekte || []) for (const f of formate || []) aus.push(neuerAuftrag({ ...o, format: f, gruppe }, jetzt));
  return aus;
}

/** Fortschritt einer Gruppe „n von m“ (gedruckt oder als PDF erledigt). */
export function gruppenStand(auftraege, gruppe) {
  const g = (auftraege || []).filter((a) => a.gruppe === gruppe);
  const fertig = g.filter((a) => a.zustand === "gedruckt" || a.zustand === "pdf").length;
  return { fertig, gesamt: g.length, fehler: g.filter((a) => a.zustand === "fehler").length };
}

/** Warteschlange kürzen: gedruckte/PDF älter als `tage` entfernen, höchstens `max` Einträge (neueste zuerst). */
export function raeumeAuf(auftraege, { tage = 7, max = 200, jetzt = Date.now() } = {}) {
  const grenze = jetzt - tage * 86_400_000;
  return (auftraege || [])
    .filter((a) => !((a.zustand === "gedruckt" || a.zustand === "pdf") && a.geaendert < grenze))
    .sort((x, y) => y.zeit - x.zeit)
    .slice(0, max);
}

// ------------------------------------------------------------------ Kiosk-Druckmenü --

/**
 * Standard-Einträge des Kiosk-Druckmenüs (G-17: Lieferschein, Packliste, Etikett, Bon). Der Arbeitsplatz
 * reicht nur die Einträge durch, die zu seinem Objekt passen; `etikett` kommt vom Versanddienst (kein Frappe-Format).
 */
export const KIOSK_DRUCK = Object.freeze([
  { id: "lieferschein", titel: "Lieferschein", icon: "FileText", doctype: "PH Lieferschein", format: "PH Lieferschein Standard" },
  { id: "packliste", titel: "Packliste", icon: "Rows3", doctype: "PH Lieferschein", format: "PH Lieferschein Packliste" },
  { id: "etikett", titel: "Versandetikett", icon: "Tag", doctype: "PH Sendung", format: null },
  { id: "bon", titel: "Bon", icon: "Receipt", doctype: "PH Kassenbeleg", format: "PH Kassenbeleg Bon 80mm" },
]);
