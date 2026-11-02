// src/lib/ezarri/konfigurator/copy.js – deutsche Texte des Konfigurators (Team B).
//
// Eigene Texte. Stimme laut Design-Bibel: Sie-Form, Fakten statt Adjektive,
// keine Superlative, keine Preise. Herstellerangaben stehen als „laut Ezarri“.
// en/fr/it-Vorschläge: Marktresearch/digital/features/ezarri-messages-vorschlag.json
// (Schlüssel ezarri.b.*). Keine Händler-Aussage in diesem Modul.
//
// Rein: keine Imports. Server, Client und node --test.

export const SEITE = Object.freeze({
  crumb: "Konfigurator",
  eyebrow: "Ezarri · Konfigurator",
  title: "Becken gestalten",
  lead: "Wählen Sie Mosaik, Mischung, Fuge und Beckenform und sehen Sie das Wasser dazu – in 3D, im Browser, ohne Anmeldung.",
  metaTitle: "Pool-Mosaik-Konfigurator für Ezarri-Glasmosaik | Platzhirsch",
  metaDescription: "Becken in 3D gestalten: eigenes Maß und Form, jedes Ezarri-Mosaik, Mischungen, Fugen, Wasser und Licht. Mit Mengen, Druckblatt und Musteranfrage in Lochau.",
  hinweisFarbe: "Bildschirmfarben sind eine Annäherung. Glas wirkt im Tageslicht und unter Wasser anders – sehen Sie sich die Muster an, bevor Sie entscheiden.",
  hinweisMessung: "Steinfarben gemessen aus den Ezarri-Produktbildern; Glanz und Reflexion laut Ezarri-Konfigurator.",
  hinweisDaten: "Mengen sind eine Schätzung (Ezarri-Faktoren, 10 % Reserve). Die verbindliche Menge ermittelt Ihr Fliesenleger am Aufmaß.",
  hinweisVerlegung: "Die Verlegung übernimmt ein Fliesenleger-Fachbetrieb.",
  linkUngueltig: "Der Link enthielt keinen gültigen Entwurf. Wir zeigen den Startentwurf.",
});

export const TABS = Object.freeze([
  { id: "mosaik", label: "Mosaik" },
  { id: "becken", label: "Becken" },
  { id: "wasser", label: "Wasser & Licht" },
  { id: "mengen", label: "Mengen" },
]);

export const MODI_LABEL = Object.freeze({
  mosaik: { label: "Ein Mosaik", sub: "eine Ezarri-Referenz" },
  mix: { label: "Eigene Mischung", sub: "bis zu 4 Mosaike mit Anteilen" },
  rezept: { label: "Ezarri-Mischung", sub: "fertige Rezepte, veränderbar" },
  pattern: { label: "Motiv-Raster", sub: "20 Ezarri-Patterns, 2⁠–⁠3 Farben" },
});

export const SZENEN_LABEL = Object.freeze({
  pool: "Pool",
  whirlpool: "Whirlpool",
  bad: "Dusche & Bad",
  kueche: "Küchenrückwand",
});

export const FORM_LABEL = Object.freeze({
  rechteck: "Rechteck",
  radius: "Runde Ecken",
  rund: "Runde Enden",
  l: "L-Form",
  kreis: "Rund",
  quadrat: "Quadratisch",
  nische: "Duschnische",
  rueckwand: "Wandfläche",
});

export const TREPPE_LABEL = Object.freeze({
  roemisch: "Römische Treppe",
  eck: "Ecktreppe",
  voll: "Über die ganze Breite",
  keine: "Keine Treppe",
});

export const RAND_LABEL = Object.freeze({
  skimmer: { label: "Skimmer", sub: "Wasser ca. 15 cm unter dem Rand" },
  ueberlauf: { label: "Überlaufrinne", sub: "Wasser bis zum Rand, Rinne umlaufend" },
  infinity: { label: "Infinity-Kante", sub: "Wasser fließt an der tiefen Seite über" },
});

export const FORMAT_LABEL = Object.freeze({ 25: "25 mm", 50: "50 mm", hexa: "Hexa" });

export const WASSER_LABEL = Object.freeze({
  bewegt: "Bewegt",
  ruhig: "Ruhig",
  leer: "Leer",
});

export const WASSERTON_LABEL = Object.freeze({
  klar: { label: "Klar", sub: "Chlor- oder Salzanlage, gut gefiltert" },
  naturpool: { label: "Naturpool", sub: "biologisch gefiltert, grünlicher" },
  salz: { label: "Meerwasser", sub: "etwas kühler im Ton" },
});

export const ZEIT_LABEL = Object.freeze({ morgen: "Morgen", mittag: "Mittag", abend: "Abend", nacht: "Nacht" });

export const LED_LABEL = Object.freeze({ aus: "Aus", weiss: "Weiß", warm: "Warmweiß", blau: "Blau", tuerkis: "Türkis" });

export const LAGE_LABEL = Object.freeze({
  bahnen: "Bahnmarkierung am Boden",
  wasserlinie: "Band an der Wasserlinie",
  stufen: "Stufenkanten",
});

export const KAMERA_LABEL = Object.freeze({
  uebersicht: "Übersicht",
  treppe: "Treppe",
  wasserlinie: "Wasserlinie",
  unterwasser: "Unter Wasser",
  vogel: "Von oben",
  nah: "Nah",
});

export const MASSE_LABEL = Object.freeze({
  pool: { l: "Länge", b: "Breite", tFlach: "Tiefe flach", tTief: "Tiefe tief" },
  whirlpool: { l: "Durchmesser bzw. Seite", b: "Breite", tTief: "Wassertiefe" },
  bad: { l: "Breite der Rückwand", b: "Tiefe der Nische", tTief: "Fliesenhöhe" },
  kueche: { l: "Breite", tTief: "Höhe zwischen Arbeitsplatte und Oberschrank" },
});

export const KANAL_NAMEN = Object.freeze(["Grund", "Motiv", "Akzent"]);

export const HINWEIS_MIX = Object.freeze({
  allein: "Dieses Mosaik ist laut Ezarri nicht mischbar. Es steht jetzt allein.",
  voll: "Eine Mischung hat höchstens 4 Mosaike.",
  vorhanden: "Dieses Mosaik ist schon in der Mischung.",
  nichtMischbar: "laut Ezarri nicht mischbar – nur allein",
});

export const AKTIONEN = Object.freeze({
  muster: "Muster anfragen",
  musterSub: "für Ihren Termin in Lochau",
  angebot: "Angebot anfragen",
  rechner: "Genau berechnen",
  teilen: "Link teilen",
  kopiert: "Link kopiert",
  drucken: "Blatt drucken oder als PDF",
  merken: "In der Merkliste speichern",
  gemerkt: "In der Merkliste gespeichert",
  neu: "Neu beginnen",
  neuFrage: "Alle Einstellungen zurücksetzen?",
  rueck: "Rückgängig",
  vor: "Wiederholen",
  vorher: "Vorher festhalten",
  vergleich: "Vorher / Nachher",
  vergleichEnde: "Vergleich beenden",
  drei: "In 3D ansehen",
  zwei: "2D-Draufsicht",
  ar: "Im eigenen Garten ansehen (AR)",
});

/** Sätze für die Live-Zusammenfassung (aria-live). */
export function zusammenfassung({ szene, becken, mixText, fugeName, formatLabel }) {
  const m = (v) => String(v).replace(".", ",");
  const ort =
    szene === "pool"
      ? `Pool ${m(becken.l)} × ${m(becken.b)} m, Tiefe ${m(becken.tFlach)} bis ${m(becken.tTief)} m`
      : szene === "whirlpool"
        ? `Whirlpool ${m(becken.l)} m`
        : szene === "bad"
          ? `Duschnische ${m(becken.l)} × ${m(becken.b)} m, ${m(becken.tTief)} m hoch`
          : `Küchenrückwand ${m(becken.l)} × ${m(becken.tTief)} m`;
  return `${ort}. ${mixText}. Format ${formatLabel}, Fuge ${fugeName}.`;
}
