// Labels, Töne und Symbole des Bereichs Kundenkarte (Konzept §4.5, §12.1). Nie Rohwerte in der Oberfläche.
// Reines Modul (browsertauglich, node --test).

export const DT = Object.freeze({
  karte: "PH Kundenkarte",
  antrag: "PH Kundenkarte Antrag",
  einloesung: "PH Kundenkarte Einloesung",
  stufe: "PH Kundenkarte Stufe",
  vorteil: "PH Kundenkarte Vorteil",
  ereignis: "PH Kundenkarte Ereignis",
  einstellungen: "PH Kundenkarte Einstellungen",
  kontakt: "PH Kontakt",
  aufgabe: "PH Aufgabe",
});

/** Status → { label, ton } (Töne der StatusBadge: grau|blau|tuerkis|orange|gruen|rot|lila). */
export const KARTE_STATUS = Object.freeze({
  Beantragt: { label: "Beantragt", ton: "orange" },
  Aktiv: { label: "Aktiv", ton: "gruen" },
  Gesperrt: { label: "Gesperrt", ton: "rot" },
  Gekuendigt: { label: "Gekündigt", ton: "grau" },
  Ersetzt: { label: "Ersetzt", ton: "grau" },
  Uebertragen: { label: "Übertragen", ton: "grau" },
  Zusammengefuehrt: { label: "Zusammengeführt", ton: "grau" },
});
export const OFFENE_STATUS = Object.freeze(["Beantragt", "Aktiv", "Gesperrt"]);
export const END_STATUS = Object.freeze(["Gekuendigt", "Ersetzt", "Uebertragen", "Zusammengefuehrt"]);

export const ANTRAG_STATUS = Object.freeze({
  Neu: { label: "Neu", ton: "blau" },
  Bestaetigt: { label: "Bestätigt", ton: "tuerkis" },
  Angenommen: { label: "Angenommen", ton: "gruen" },
  Abgelehnt: { label: "Abgelehnt", ton: "rot" },
  Doppelt: { label: "Doppelt", ton: "grau" },
});

export const EINLOESUNG_STATUS = Object.freeze({
  Zugesagt: { label: "Zugesagt", ton: "tuerkis" },
  Eingeloest: { label: "Eingelöst", ton: "gruen" },
  Storniert: { label: "Storniert", ton: "grau" },
});

export const QUELLE = Object.freeze({ website: "Website", showroom: "Showroom", kassa: "Kassa", event: "Event", backoffice: "Backoffice", import: "Import" });
export const KANAL = Object.freeze({ showroom: "Showroom", website: "Website", kassa: "Kassa" });
export const ORTE = Object.freeze(["Showroom", "Kassa", "Packtisch", "Service", "Event", "Backoffice"]);

/** Vorteil-Art → Label + Symbol (lucide-Name, §3.5.3). */
export const VORTEIL_ART = Object.freeze({
  Lieferung: { label: "Lieferung", icon: "truck" },
  Montage: { label: "Montage", icon: "wrench" },
  Pflege: { label: "Pflege", icon: "droplets" },
  Event: { label: "Event", icon: "calendar-heart" },
  Service: { label: "Service", icon: "life-buoy" },
  Persoenlich: { label: "Persönlich", icon: "user-round" },
  Sonstiges: { label: "Sonstiges", icon: "circle-dot" },
});

/** Sperrgrund-Katalog wie kartenregeln.SPERRGRUENDE: label, ersatzkarte, entsperrbar, kassa_text. */
export const SPERRGRUENDE = Object.freeze([
  { wert: "Verlust", label: "Verlust", ersatzkarte: true, entsperrbar: true, kassa: "Karte als verloren gemeldet – bitte an die Beratung verweisen." },
  { wert: "Diebstahl", label: "Diebstahl", ersatzkarte: true, entsperrbar: false, kassa: "Karte als gestohlen gemeldet – nicht annehmen, Beratung informieren." },
  { wert: "Beschaedigt", label: "Beschädigt", ersatzkarte: true, entsperrbar: true, kassa: "Karte beschädigt – Ersatzkarte im Backoffice." },
  { wert: "Missbrauch", label: "Missbrauch", ersatzkarte: false, entsperrbar: true, kassa: "Karte gesperrt – bitte an die Leitung verweisen." },
  { wert: "Kundenwunsch", label: "Kundenwunsch", ersatzkarte: false, entsperrbar: true, kassa: "Karte auf Wunsch der Kundin/des Kunden gesperrt." },
  { wert: "Dublette", label: "Dublette", ersatzkarte: false, entsperrbar: false, kassa: "Doppelte Karte – bitte die Hauptkarte verwenden." },
  { wert: "Datenschutz", label: "Datenschutz", ersatzkarte: false, entsperrbar: false, kassa: "Karte nicht mehr gültig." },
  { wert: "Verstorben", label: "Verstorben", ersatzkarte: false, entsperrbar: false, kassa: "Karte nicht mehr gültig." },
  { wert: "Sonstiges", label: "Sonstiges", ersatzkarte: false, entsperrbar: true, kassa: "Karte gesperrt – bitte an die Beratung verweisen." },
]);
export const ERSATZ_GRUENDE = Object.freeze(["Verlust", "Diebstahl", "Beschaedigt"]);
export const UEBERTRAGUNGSGRUENDE = Object.freeze(["Partner/Haushalt", "Erbe", "Firmennachfolge", "Sonstiges"]);
export const ABLEHNUNGSGRUENDE = Object.freeze(["Doppelte Anmeldung", "Angaben unvollständig/nicht prüfbar", "Missbrauch früherer Karte", "Kundenwunsch", "E-Mail nicht bestätigt", "Sonstiges"]);
export const STUFE_GRUENDE = Object.freeze(["Kulanz", "Objekt/Hotel", "Korrektur"]);
export const WIDERRUF_KANAELE = Object.freeze(["Showroom", "Telefon", "Brief", "E-Mail", "Portal"]);
export const EINWILLIGUNG_KANAELE = Object.freeze([
  { wert: "Unterschrift Formular", label: "Unterschrift im Showroom" },
  { wert: "Formular-Scan", label: "Brief" },
  { wert: "Unterschrift Tablet", label: "Tablet (Kundenmodus)" },
]);

/** Ereignis-Art (Backend) → Menschensprache + Symbol. */
export const EREIGNIS_ART = Object.freeze({
  Ausgestellt: { label: "Karte ausgestellt", icon: "CreditCard", filter: "stufe" },
  Stufenwechsel: { label: "Stufe geändert", icon: "ArrowUp", filter: "stufe" },
  Sperrung: { label: "Gesperrt", icon: "Lock", filter: "stufe" },
  Entsperrung: { label: "Entsperrt", icon: "Lock", filter: "stufe" },
  Kuendigung: { label: "Gekündigt", icon: "X", filter: "stufe" },
  "Pass aktualisiert": { label: "Wallet-Pass erneuert", icon: "Wallet", filter: "stufe" },
  "Umsatz berechnet": { label: "Einstufung geprüft", icon: "RefreshCw", filter: "stufe" },
  Einwilligung: { label: "Einwilligung zur Auswertung erfasst", icon: "Shield", filter: "einwilligung" },
  Widerruf: { label: "Auswertung beendet", icon: "Shield", filter: "einwilligung" },
  Ersatzkarte: { label: "Ersatzkarte ausgestellt", icon: "CreditCard", filter: "stufe" },
  Uebertragung: { label: "Karte übertragen", icon: "Users", filter: "stufe" },
  Zusammenfuehrung: { label: "Karten zusammengeführt", icon: "Layers", filter: "stufe" },
  Uebergabe: { label: "Karte übergeben", icon: "CheckCheck", filter: "stufe" },
  "Einloesung storniert": { label: "Einlösung storniert", icon: "Undo2", filter: "einloesungen" },
  Anonymisierung: { label: "Anonymisiert", icon: "Shield", filter: "einwilligung" },
  Hinweis: { label: "Hinweis", icon: "Info", filter: "stufe" },
});

export function statusLabel(tabelle, wert) {
  return tabelle[wert]?.label || String(wert ?? "–");
}
export function statusTon(tabelle, wert) {
  return tabelle[wert]?.ton || "grau";
}
export function sperrgrund(wert) {
  return SPERRGRUENDE.find((s) => s.wert === wert) || null;
}
export function sperrgrundLabel(wert) {
  return sperrgrund(wert)?.label || (wert ? String(wert) : "");
}
export function artLabel(art) {
  return VORTEIL_ART[art]?.label || "Sonstiges";
}
export function artIcon(art) {
  return VORTEIL_ART[art]?.icon || "circle-dot";
}

/** Kürzel des Monogramms einer Stufe für den Bodoni-Kreis: „Platzhirsch“ → P, „… Plus“ → P+, „… Privé“ → PP. */
export function stufeMonogramm(name) {
  const w = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!w.length) return "–";
  const erst = w[0][0].toUpperCase();
  if (w.length === 1) return erst;
  const zweit = w[w.length - 1];
  if (/^plus$/i.test(zweit)) return `${erst}+`;
  return `${erst}${zweit[0].toUpperCase()}`;
}

/** Relative Leuchtdichte eines Hex-Werts (WCAG). */
export function leuchtdichte(hex) {
  const m = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i.exec(String(hex || "").trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function kontrast(a, b) {
  const la = leuchtdichte(a);
  const lb = leuchtdichte(b);
  if (la === null || lb === null) return null;
  const [h, d] = la > lb ? [la, lb] : [lb, la];
  return (h + 0.05) / (d + 0.05);
}

/** Schriftfarbe auf einer Stufenfarbe: hell oder dunkel, je nachdem was mehr Kontrast hat (≥ 4,5 angestrebt). */
export function schriftAuf(hex) {
  const hell = "#fbf7f2";
  const dunkel = "#22272c";
  const k1 = kontrast(hex, hell) ?? 0;
  const k2 = kontrast(hex, dunkel) ?? 0;
  return k1 >= k2 ? hell : dunkel;
}

/** Braucht die Stufenfarbe einen Ring gegen die Kachelfläche (< 3:1, §3.7)? */
export function brauchtRing(hex, flaeche = "#fbfaf8") {
  const k = kontrast(hex, flaeche);
  return k === null || k < 3;
}

/** Status-Töne der Lounge, die nicht als Stufenfarbe gewählt werden sollen (Warnung im Stufen-Sheet). */
export const STATUS_FARBEN = Object.freeze(["#6f8a6a", "#b08850", "#a24a3a", "#4f6b68", "#8f5230"]);
export const STUFEN_VORSCHLAEGE = Object.freeze(["#5b626a", "#30373e", "#b8975a", "#6b4a33", "#cdbfa8", "#8a7a66", "#3f4a52", "#7d5a44"]);
