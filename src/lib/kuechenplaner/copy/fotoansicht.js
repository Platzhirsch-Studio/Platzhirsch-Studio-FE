// src/lib/kuechenplaner/copy/fotoansicht.js – Texte der „Fotoansicht“ (Fotoansicht.js):
// Bildunterschrift, Blickwinkel, Abweichungen, Hinweise. Zeile = [Deutsch (Mastertext,
// Schlüssel), Englisch, Französisch, Italienisch] wie in ui.js.
//
// Die Bilder sind Renderings (Blender), keine Fotos und keine KI-Bilder – die
// Bildunterschrift „Visualisierung (Rendering)“ ist Pflicht und steht direkt am Bild.
// Ehrlich formulieren: Farben/Materialien nur annähernd, nächstliegende von 66 Varianten.
// Platzhalter: {v…} wörtlich (bereits übersetzte Bezeichnungen aus dem Katalog), {n} Zahl.

export const FOTO_ROWS = [
  ["Fotoansicht", "Photo view", "Vue photo", "Vista foto"],
  ["Visualisierung (Rendering)", "Visualisation (rendering)", "Visualisation (rendu 3D)", "Visualizzazione (rendering)"],
  ["Blickwinkel", "Viewpoint", "Angle de vue", "Punto di vista"],
  ["Dreiviertel", "Three-quarter", "Trois quarts", "Tre quarti"],
  ["Augenhöhe", "Eye level", "Hauteur des yeux", "Altezza occhi"],
  [
    "Farben und Materialien sind nur annähernd dargestellt. Gezeigt wird die nächstliegende von 66 vorgerenderten Varianten – nicht zwingend genau Ihre Kombination.",
    "Colours and materials are shown only approximately. You see the closest of 66 pre-rendered variants – not necessarily your exact combination.",
    "Les couleurs et matériaux ne sont représentés qu’approximativement. Vous voyez la plus proche de 66 variantes pré-calculées – pas forcément votre combinaison exacte.",
    "Colori e materiali sono rappresentati solo in modo approssimativo. Vedete la più vicina di 66 varianti pre-renderizzate – non necessariamente la vostra combinazione esatta.",
  ],
  ["Bild zeigt: {vList}", "Image shows: {vList}", "L’image montre : {vList}", "L’immagine mostra: {vList}"],
  ["{vWas} {vBild} statt {vPlan}", "{vWas} {vBild} instead of {vPlan}", "{vWas} {vBild} au lieu de {vPlan}", "{vWas} {vBild} invece di {vPlan}"],
  ["und {n} weitere", "and {n} more", "et {n} autres", "e altre {n}"],
  ["Farbe", "Colour", "Couleur", "Colore"],
  ["Für diese Grundform gibt es noch keine Fotoansicht.", "There is no photo view for this layout yet.", "Il n’y a pas encore de vue photo pour cette forme.", "Per questa forma non c’è ancora una vista foto."],
  ["Fotoansicht wird geladen …", "Loading photo view …", "Chargement de la vue photo …", "Caricamento della vista foto …"],
  ["Fotoansicht: {vShape}", "Photo view: {vShape}", "Vue photo : {vShape}", "Vista foto: {vShape}"],
  // Alt-Text: Grundform, Front, Farbe, Platte (Bezeichnungen bereits übersetzt)
  ["{vShape}, Front {vFront} {vColor}, Arbeitsplatte {vTop}, Visualisierung (Rendering)", "{vShape}, {vFront} {vColor} front, {vTop} worktop, visualisation (rendering)", "{vShape}, façade {vFront} {vColor}, plan de travail {vTop}, visualisation (rendu 3D)", "{vShape}, frontale {vFront} {vColor}, piano di lavoro {vTop}, visualizzazione (rendering)"],
];
