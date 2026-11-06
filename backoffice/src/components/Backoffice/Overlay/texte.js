// Texte der Overlay-Bausteine (Team P0-4, G-06 · G-07 · G-08). Du-Form, Knöpfe = Verb,
// keine Superlative, keine Ausrufezeichen (Q-K1/Q-K2). Bereiche übergeben eigene Texte als Props.

export const TEXTE = {
  schliessen: "Schließen",
  abbrechen: "Abbrechen",
  bestaetigen: "Ausführen",
  bitteWarten: "Bitte warten …",
  griff: "Zum Schließen nach unten ziehen",

  sheet: {
    vollseite: "Als ganze Seite öffnen",
    vorschau: "Vorschau",
    vorschauAnsage: (titel) => `Vorschau: ${titel}`,
    blaettern: "J/K oder ↑/↓ blättert · Esc schließt",
    position: (i, n) => `${i} von ${n}`,
    vorige: "Voriger Eintrag",
    naechste: "Nächster Eintrag",
  },

  ungespeichert: {
    titel: "Ungespeicherte Änderungen verwerfen?",
    text: "Deine Eingaben in diesem Bereich gehen verloren.",
    weiter: "Weiter bearbeiten",
    verwerfen: "Verwerfen",
  },

  lightbox: {
    titel: "Bilder und Dokumente",
    position: (i, n) => `${i} von ${n}`,
    vorige: "Voriges Bild",
    naechste: "Nächstes Bild",
    zoom: "Vergrößerung",
    zoom1: "1×",
    zoom2: "2×",
    herunterladen: "Herunterladen",
    quelle: "Quelle",
    keineQuelle: "Quelle nicht angegeben",
    freigabe: "Freigabe",
    pdfLaedt: "Dokument wird geladen …",
    pdfFehler: "Das Dokument lässt sich hier nicht anzeigen.",
    pdfOeffnen: "In neuem Tab öffnen",
    bildFehler: "Das Bild lässt sich nicht laden.",
    leer: "Keine Bilder oder Dokumente vorhanden.",
    tasten: "← → blättert · + − vergrößert · Esc schließt",
    miniaturen: "Übersicht",
  },
};
