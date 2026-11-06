// Kürzel des Fundaments (G-02): global (Q-F2), Liste (Q-F3), Akte (Q-F4), Kanban, Palette, Glocke,
// Arbeitsplatz und die gemeinsamen Kiosk-Tasten (Q-F7). Schreibt: Fundament (P0-1, Nachträge über L0).
// Bereiche tragen nur in kuerzel/<bereich>.js ein (Umschalt+Buchstabe in liste/akte, F-Tasten im Kiosk).
// `inEingabe: false` = wirkt nicht, solange ein Eingabefeld den Fokus hat (z. B. Strg+Z bleibt dort Text-Undo).

const e = (kontext, taste, id, titel, extra = {}) => ({ kontext, taste, id, titel, ...extra });

/**
 * Gehe-zu-Ziele (K-10). `ziel`: { bereich } = Startseite des Bereichs, { seite } = feste Zentrale-Seite
 * (bereiche/zentrale.js → seiten). Ohne Seite/Recht wird das Kürzel nicht angeboten.
 */
export const G_ZIELE = [
  { buchstabe: "z", titel: "Zentrale", ziel: { bereich: "zentrale" } },
  { buchstabe: "a", titel: "Aufgaben", ziel: { seite: "aufgaben" } },
  { buchstabe: "b", titel: "Benachrichtigungen", ziel: { seite: "benachrichtigungen" } },
  { buchstabe: "c", titel: "CRM", ziel: { bereich: "crm" } },
  { buchstabe: "p", titel: "Projekte", ziel: { bereich: "projekte" } },
  { buchstabe: "f", titel: "Faktura", ziel: { bereich: "faktura" } },
  { buchstabe: "s", titel: "Shop", ziel: { bereich: "shop" } },
  { buchstabe: "o", titel: "Sortiment", ziel: { bereich: "sortiment" } },
  { buchstabe: "l", titel: "Logistik", ziel: { bereich: "logistik" } },
  { buchstabe: "v", titel: "Service", ziel: { bereich: "service" } },
  { buchstabe: "h", titel: "Kundenkarte", ziel: { bereich: "kundenkarte" } },
  { buchstabe: "m", titel: "Marketing", ziel: { bereich: "marketing" } },
  { buchstabe: "t", titel: "Personal", ziel: { bereich: "personal" } },
  { buchstabe: "k", titel: "Kassa-Verwaltung", ziel: { bereich: "kassa" } },
  { buchstabe: "e", titel: "Einstellungen", ziel: { seite: "einstellungen" } },
  { buchstabe: "d", titel: "Druck", ziel: { seite: "druck" } },
  { buchstabe: "w", titel: "Verwaltung", ziel: { seite: "verwaltung" } },
];

const eintraege = [
  // ---- global (Q-F2)
  e("global", "mod+k", "global.palette", "Befehlspalette öffnen"),
  e("global", "/", "global.kontextsuche", "Suche dieser Seite"),
  e("global", "?", "global.hilfe", "Hilfe öffnen"),
  e("global", "mod+/", "global.kuerzel", "Tastenkürzel anzeigen"),
  e("global", "n", "global.neu", "Neu …"),
  e("global", "mod+z", "global.rueckgaengig", "Rückgängig", { inEingabe: false }),
  e("global", "z", "global.rueckgaengig-z", "Rückgängig"),
  e("global", "f8", "global.toast", "Zur Meldung springen"),
  e("global", "mod+b", "global.seitenleiste", "Seitenleiste ein-/ausklappen"),
  e("global", "[", "global.seitenleiste-zu", "Seitenleiste einklappen"),
  e("global", "]", "global.seitenleiste-auf", "Seitenleiste ausklappen"),
  e("global", "escape", "global.schliessen", "Oberste Ebene schließen"),
  ...G_ZIELE.map((g) => e("global", `g ${g.buchstabe}`, `global.gehe-${g.buchstabe}`, `Gehe zu ${g.titel}`, { gruppe: "Gehe zu" })),

  // ---- Liste (Q-F3)
  e("liste", "arrowdown", "liste.naechste", "Nächste Zeile"),
  e("liste", "arrowup", "liste.vorige", "Vorige Zeile"),
  e("liste", "j", "liste.naechste-j", "Nächste Zeile"),
  e("liste", "k", "liste.vorige-k", "Vorige Zeile"),
  e("liste", "enter", "liste.oeffnen", "Öffnen"),
  e("liste", "space", "liste.vorschau", "Vorschau"),
  e("liste", "x", "liste.auswaehlen", "Auswählen"),
  e("liste", "a", "liste.zuweisen", "Zuweisen"),
  e("liste", "s", "liste.status", "Status ändern"),
  e("liste", "d", "liste.faellig", "Fälligkeit setzen"),
  e("liste", "c", "liste.kommentar", "Kommentar"),
  e("liste", "shift+enter", "liste.primaer", "Hauptaktion der Zeile"),
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map((z) => e("liste", String(z), `liste.reiter-${z}`, `Statusfilter ${z}`, { gruppe: "Statusfilter 1–9" })),

  // ---- Kanban
  e("karten", "arrowleft", "karten.links", "Karte nach links verschieben"),
  e("karten", "arrowright", "karten.rechts", "Karte nach rechts verschieben"),
  e("karten", "m", "karten.verschieben", "Verschieben nach …"),
  e("karten", "enter", "karten.oeffnen", "Karte öffnen"),

  // ---- Akte (Q-F4)
  e("akte", "e", "akte.bearbeiten", "Bearbeiten"),
  ...[1, 2, 3, 4, 5, 6].map((z) => e("akte", `alt+${z}`, `akte.tab-${z}`, `Reiter ${z}`, { gruppe: "Reiter 1–6" })),
  e("akte", "alt+arrowup", "akte.vorige", "Voriger Datensatz der Liste"),
  e("akte", "alt+arrowdown", "akte.naechste", "Nächster Datensatz der Liste"),
  e("akte", "mod+p", "akte.drucken", "Drucken …"),
  e("akte", "mod+s", "akte.speichern", "Speichern"),
  e("akte", "mod+enter", "akte.primaer", "Hauptaktion"),
  e("akte", "shift+p", "akte.zum-projekt", "Zum Projekt"),
  e("akte", "shift+k", "akte.zum-kunden", "Zur Kundenakte"),

  // ---- Arbeitsplatz wählen (Ziffern 1–5)
  ...[1, 2, 3, 4, 5].map((z) => e("arbeitsplatz", String(z), `arbeitsplatz.${z}`, `Arbeitsplatz ${z}`, { gruppe: "Arbeitsplatz 1–5" })),

  // ---- Befehlspalette (modal)
  e("palette", "arrowdown", "palette.naechste", "Nächster Treffer"),
  e("palette", "arrowup", "palette.vorige", "Voriger Treffer"),
  e("palette", "enter", "palette.oeffnen", "Treffer öffnen"),
  e("palette", "escape", "palette.schliessen", "Palette schließen"),

  // ---- Benachrichtigungen (modal, G-15)
  e("glocke", "arrowdown", "glocke.naechste", "Nächster Eintrag"),
  e("glocke", "arrowup", "glocke.vorige", "Voriger Eintrag"),
  e("glocke", "enter", "glocke.oeffnen", "Eintrag öffnen"),
  e("glocke", "arrowleft", "glocke.tab-links", "Voriger Reiter"),
  e("glocke", "arrowright", "glocke.tab-rechts", "Nächster Reiter"),
  e("glocke", "r", "glocke.gelesen", "Als gelesen markieren"),
  e("glocke", "shift+r", "glocke.alle-gelesen", "Alle als gelesen markieren"),
  e("glocke", "f", "glocke.freigeben", "Freigabe öffnen"),
  e("glocke", "escape", "glocke.schliessen", "Schließen"),

  // ---- Kiosk, gemeinsam (Q-F7)
  e("kiosk", "f1", "kiosk.hilfe", "Hilfe"),
  e("kiosk", "shift+f2", "kiosk.bediener", "Bedienerwechsel / Sperren"),
  e("kiosk", "f12", "kiosk.primaer", "Hauptaktion der Ansicht"),
  e("kiosk", "mod+enter", "kiosk.primaer-enter", "Hauptaktion der Ansicht"),
  e("kiosk", "mod+p", "kiosk.drucken", "Druckmenü"),
  e("kiosk", "mod+z", "kiosk.rueckgaengig", "Rückgängig", { inEingabe: false }),
  e("kiosk", "escape", "kiosk.schliessen", "Oberste Ebene schließen"),
  e("kiosk", "f11", "kiosk.vollbild", "Vollbild"),
];

export default eintraege;
