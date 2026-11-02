// Beispiel-Katalog für den 3D/AR-Viewer (Labs).
//
// ALLE Modelle hier sind CC0-Beispielmodelle von Poly Haven (polyhaven.com),
// KEINE Produkte aus dem Sortiment und KEINE Herstellerdaten. Lizenz und
// Quellen: public/labs/ar-viewer/README.md.
//
// Hotspot-Positionen (Meter, Modellkoordinaten) und Normalen wurden von
// tools/build-models.mjs aus der Geometrie berechnet (nächster Oberflächenpunkt).
// Varianten-Namen (`variant`) müssen exakt den KHR_materials_variants-Namen
// in der GLB entsprechen.
//
// Später kommt dieser Datensatz aus dem Backoffice (siehe data/source.js und
// Marktresearch/digital/features/ar-viewer.md, Abschnitt „Anbindung Frappe“).

export const SAMPLE_NOTICE =
  "Beispielmodell (CC0, Poly Haven) – kein Produkt aus unserem Sortiment, Maße und Materialien dienen nur der Demonstration.";

export const AR_MODELS = [
  {
    id: "sofa_02",
    name: "Sofa mit Capitonné-Rücken",
    category: "Sofa",
    src: "/labs/ar-viewer/models/sofa_02.glb",
    iosSrc: null, // null → model-viewer erzeugt das USDZ für Quick Look im Browser
    poster: "/labs/ar-viewer/posters/sofa_02.webp",
    posterAlt: "Beispielmodell: dunkles Ledersofa mit gesteppter Rückenlehne und Holzgestell",
    // Breite × Tiefe × Höhe in cm (aus dem Modell gemessen, wird nach dem Laden live geprüft)
    dimensionsCm: { w: 181, d: 82, h: 71 },
    arPlacement: "floor",
    cameraOrbit: "-25deg 75deg auto",
    credit: { author: "Kirill Sannikov", url: "https://polyhaven.com/a/sofa_02" },
    variants: [
      { variant: "anthrazit", label: "Anthrazit", swatch: "#3b3c3d", note: "Glattleder, dunkel (Original des Modells)" },
      // QA Runde 1: Cognac war zu hell/gesättigt und wirkte fleckig → gedämpft,
      // Salbei/Sand ersetzt durch ein dezentes Taupe (siehe tools/build-models.mjs).
      { variant: "cognac", label: "Cognac", swatch: "#5f3c27", note: "Beispielfarbe, digital umgefärbt" },
      { variant: "taupe", label: "Taupe", swatch: "#786c60", note: "Beispielfarbe, digital umgefärbt" },
    ],
    hotspots: [
      {
        id: "sitz",
        title: "Sitzkissen",
        text: "Durchgehendes Sitzkissen mit Keder. Im Beispiel als Glattleder modelliert – im Showroom zeigen wir echte Stoff- und Ledermuster.",
        position: "0.0021 0.4067 0.1882",
        // Normale bewusst nach vorne-oben gekippt (gemessen: 0 0.998 0.06): sonst
        // gilt das Kissen auch von hinten als „sichtbar“, obwohl die Lehne es verdeckt.
        normal: "0 0.5 0.866",
      },
      {
        id: "ruecken",
        title: "Rücken in Capitonné",
        text: "Rautenförmig gesteppte Rückenlehne mit Knöpfen. Die Steppung bleibt bei jedem Farbwechsel erhalten.",
        position: "0.0003 0.6197 -0.2456",
        normal: "0 0.269 0.9632",
      },
      {
        id: "gestell",
        title: "Gestell aus Holz",
        text: "Geschwungenes Holzgestell, im Beispiel rötlich gebeizt. Bei den Farbvarianten bleibt das Holz unverändert.",
        position: "-0.7886 0.074 0.3293",
        normal: "-0.0961 0.0191 0.9952",
      },
    ],
  },
  {
    id: "mid_century_lounge_chair",
    name: "Lounge-Sessel im Mid-Century-Stil",
    category: "Sessel",
    src: "/labs/ar-viewer/models/mid_century_lounge_chair.glb",
    iosSrc: null,
    poster: "/labs/ar-viewer/posters/mid_century_lounge_chair.webp",
    posterAlt: "Beispielmodell: Lounge-Sessel mit Lederpolster, Holzschale und Sternfuß",
    dimensionsCm: { w: 101, d: 119, h: 117 },
    arPlacement: "floor",
    cameraOrbit: "-30deg 78deg auto",
    credit: { author: "Kuutti Siitonen", url: "https://polyhaven.com/a/mid_century_lounge_chair" },
    variants: [], // eine gemeinsame Textur für Leder und Holz → keine sauberen Varianten möglich
    hotspots: [
      {
        id: "leder",
        title: "Polster in Leder",
        text: "Weiches, gewalktes Leder mit sichtbaren Nähten. Patina und Falten gehören bei Anilinleder zum Charakter.",
        position: "-0.0031 0.4495 0.1855",
        normal: "-0.038 0.9589 -0.2811",
      },
      {
        id: "schale",
        title: "Schale aus Formholz",
        text: "Die Sitzschale ist als Formholz mit Furnier modelliert – leicht, stabil und mit durchgehender Maserung.",
        position: "0.4503 0.6943 0.1785",
        normal: "-0.0989 0.9931 -0.0628",
      },
      {
        id: "fuss",
        title: "Sternfuß aus Metall",
        text: "Vierarmiger Drehfuß aus dunklem Metall. Im echten Produkt: auf Bodenschutz (Filz/Kunststoff) achten.",
        position: "0.2467 0.0422 0.3165",
        normal: "0.085 0.9895 0.1169",
      },
    ],
  },
  {
    id: "modern_ceiling_lamp_01",
    name: "Pendelleuchte mit Glaskugel",
    category: "Leuchte",
    src: "/labs/ar-viewer/models/modern_ceiling_lamp_01.glb",
    iosSrc: null,
    poster: "/labs/ar-viewer/posters/modern_ceiling_lamp_01.webp",
    posterAlt: "Beispielmodell: Pendelleuchte mit opaler Glaskugel und Metallkappe",
    dimensionsCm: { w: 43, d: 43, h: 95 },
    // model-viewer kennt nur floor/wall. Eine Pendelleuchte erscheint in AR am
    // Boden – für den Größenvergleich (Kugeldurchmesser) reicht das.
    arPlacement: "floor",
    cameraOrbit: "0deg 80deg auto",
    shadowIntensity: 0, // hängt – kein Bodenschatten in der 3D-Ansicht
    arNote:
      "Hinweis: In AR steht die Leuchte zur Größeneinschätzung am Boden; Deckenmontage ist in AR noch nicht möglich.",
    credit: { author: "James Ray Cock", url: "https://polyhaven.com/a/modern_ceiling_lamp_01" },
    variants: [
      { variant: "nickel", label: "Nickel", swatch: "#8d8c88", note: "Metall gebürstet (Original des Modells)" },
      { variant: "messing", label: "Messing", swatch: "#b8954f", note: "Beispieloberfläche, digital eingefärbt" },
      { variant: "schwarz", label: "Schwarz", swatch: "#262626", note: "Beispieloberfläche, digital eingefärbt" },
    ],
    hotspots: [
      {
        id: "glas",
        title: "Opalglas-Kugel",
        text: "Mundgeblasen wirkendes Opalglas streut das Licht weich und blendfrei – ideal über Esstisch oder Couchtisch.",
        position: "0.2056 0.3153 0.037",
        normal: "0.9521 -0.2578 0.1645",
      },
      {
        id: "kappe",
        title: "Metallkappe",
        text: "Die Kappe trägt die Oberfläche der gewählten Variante (Nickel, Messing oder Schwarz).",
        position: "0.1039 0.5283 0.0921",
        normal: "0 1 0",
      },
      {
        id: "baldachin",
        title: "Baldachin & Abhängung",
        text: "Die Pendellänge ist im echten Produkt meist kürzbar. Faustregel über dem Esstisch: ca. 60–70 cm Abstand zur Tischplatte.",
        position: "0.0006 1.1726 0.0003",
        normal: "0 1 0",
      },
    ],
  },
];
