// src/components/Preview/pinterest/data.js — Inhalt der Vorschau „Pinterest-Kanal“
// (Inhaber-Entscheidung Nr. 14, 29.10.2026: zuerst als Vorschau zeigen, nichts
// veröffentlichen). Eine Quelle für drei Verbraucher:
//   - die Vorschau-Seite /de/preview/pinterest (Vorschau.js)
//   - die Pin-Vorlage /de/preview/pinterest/vorlage?pin=… (PinFrame.js)
//   - das Render-Skript Marktresearch/digital/marketing/pinterest/werkzeug/render-pins.mjs
// Rein, ohne React und ohne "@/" (Node importiert die Datei direkt).
//
// BILDRECHTE (verbindlich, Konzept §9): nur Ezarri (Vertragshändler, Nutzung
// erlaubt, Quelle „Ezarri“), eigene Fotos mit geklärten Rechten und Haralds
// echtes Material (kommt am 30.10. → bis dahin markierte Slots). Keine
// Minotti-, Poliform- oder Custom-Line-Bilder, keine KI-Räume.

export const PROFIL = {
  name: "Platzhirsch Home Living",
  handle: "platzhirschlochau",
  ort: "Landstraße 11 · 6911 Lochau am Bodensee",
  bio: "Einrichtungsstudio mit Café in Lochau. Harald Menghin zeichnet Ihre Räume von Hand, baut ein Modell und plant danach in 3D. Wohnen, Küche, Outdoor, Pool & Spa mit Ezarri.",
  website: "platzhirsch.studio",
};

// Boards: Titel und Beschreibung DE (Hauptkonto) + EN (zweite Sprache, Konzept §4).
// cover: Pin-ID oder "slot" (Haralds Material / eigenes Shooting folgt).
export const BOARDS = [
  {
    id: "bodensee",
    titel: "Wohnen am Bodensee",
    titelEn: "Living at Lake Constance",
    beschreibung:
      "Wohnzimmer, Esszimmer und Schlafzimmer am Bodensee: Einrichtungsideen aus unserem Studio in Lochau, zwischen Bregenz und Lindau. Sofas, Licht und Materialien, geplant für Räume mit Seelicht.",
    beschreibungEn:
      "Living rooms, dining and bedrooms at Lake Constance: interior ideas from our studio in Lochau, between Bregenz and Lindau, Austria.",
    cover: "p16",
    ziel: "/de/moebel-bodensee",
  },
  {
    id: "chalet",
    titel: "Chalet Arlberg",
    titelEn: "Alpine Chalet Interiors · Arlberg",
    beschreibung:
      "Chalet einrichten am Arlberg, in Lech, Zürs und St. Anton: Holz, Stein und warme Stoffe, Wellness im Haus, Ideen für Ferienwohnung und Hauptwohnsitz.",
    beschreibungEn:
      "Alpine chalet interior ideas for Lech, Zürs and St. Anton: wood, stone, warm textiles and private spa areas.",
    cover: "p03",
    ziel: "/de/designermoebel-arlberg",
  },
  {
    id: "pool-spa",
    titel: "Pool & Spa mit Ezarri",
    titelEn: "Pool & Spa · Ezarri Glass Mosaic",
    beschreibung:
      "Pool, Hamam, Dampfbad und Bad mit Glasmosaik von Ezarri. Farben, Muster und eigene Mischungen, geplant von Platzhirsch in Lochau am Bodensee, Muster im Showroom.",
    beschreibungEn:
      "Pools, hammams, steam rooms and bathrooms in Ezarri glass mosaic. Colours, patterns and custom blends, planned by Platzhirsch in Lochau at Lake Constance, samples in our showroom.",
    cover: "p01",
    ziel: "/de/ezarri/pool",
  },
  {
    id: "kueche",
    titel: "Küche",
    titelEn: "Kitchen Design",
    beschreibung:
      "Küchenplanung in Vorarlberg und am Bodensee: Kochinsel, Rückwand, Materialien und Licht. Von der Handzeichnung bis zur fertigen Küche.",
    beschreibungEn:
      "Kitchen planning in Vorarlberg and around Lake Constance: islands, splashbacks, materials and lighting, from hand sketch to finished kitchen.",
    cover: "p07",
    ziel: "/de/kuechen-vorarlberg",
  },
  {
    id: "outdoor",
    titel: "Outdoor am See",
    titelEn: "Lakeside Outdoor Living",
    beschreibung:
      "Terrasse, Garten und Lounge am Wasser: Outdoor-Möbel, Schatten und Pool, geplant für das Klima am Bodensee. Winterlager und Pflege auf Anfrage.",
    beschreibungEn:
      "Terraces, gardens and lounges by the water: outdoor furniture, shade and pools planned for the Lake Constance climate.",
    cover: "p11",
    ziel: "/de/outdoor-gartenplanung",
  },
  {
    id: "yacht",
    titel: "Yacht-Interior",
    titelEn: "Yacht Interior",
    beschreibung:
      "Einrichtung für Yacht und Boot: Stoffe, Leuchten und Möbel für wenig Platz und viel Bewegung. Eigene Projekte folgen.",
    beschreibungEn: "Interiors for yachts and boats: textiles, lighting and furniture for small spaces. Own projects to follow.",
    cover: "slot",
    slotHinweis: "Nur eigene Fotos – keine Custom-Line-/Navetta-Bilder (Freigabe gilt nicht für Pinterest)",
    ziel: "/de/yacht-interior",
  },
  {
    id: "hotel",
    titel: "Hotel & Objekt",
    titelEn: "Hotel & Hospitality Interiors",
    beschreibung:
      "Einrichtung für Hotel, Gastronomie, Chalet-Vermietung und Verkaufsräume: Lobby, Spa, Bar und Zimmer, mit Planung, auf Wunsch mit Lieferung und Montage.",
    beschreibungEn: "Interiors for hotels, restaurants, holiday rentals and retail: lobby, spa, bar and rooms.",
    cover: "p14",
    ziel: "/de/hotel-objekt",
  },
  {
    id: "skizze",
    titel: "Von der Skizze zum Raum",
    titelEn: "From Sketch to Room",
    beschreibung:
      "So entsteht ein Raum bei Platzhirsch: Harald Menghin zeichnet von Hand, baut ein Modell, danach folgen 3D-Planung, fotorealistisches Rendering und die Umsetzung.",
    beschreibungEn:
      "How a room comes to life at Platzhirsch: hand sketch by Harald Menghin, a scale model, then 3D planning, photorealistic rendering and the finished room.",
    cover: "slot",
    slotHinweis: "Haralds Handzeichnung – Material kommt am 30.10.2026",
    ziel: "/de/arbeitsweise",
  },
];

const EZ = "Ezarri";
const BEARB_EZ = "Zuschnitt 2:3, KI-gestützte Hochskalierung 2× (Real-ESRGAN, lokal, keine hinzugefügten Motive), Typo-Overlay";

// Beispiel-Pins 1000 × 1500 (2:3). quelle = Pfad unter public/ (Original),
// fokus = Ausschnitt (CSS object-position bzw. sharp position), layout:
//   "band" – Bild oben, Papierband mit Text unten (Standard, Text nie auf dem Bild)
//   "voll" – Vollbild, Text auf ink-deep-Verlauf (Bibel §4.5)
//   "slot" – Platzhalter für Haralds Material („Bild folgt“)
export const PINS = [
  {
    id: "p01", board: "pool-spa", layout: "band",
    titel: "Ein Pool, der zum Wasser gehört",
    overline: "Pool & Spa · Ezarri Space",
    beschreibung: "Pool mit Glasmosaik Ezarri Space (Capricorn) am Wasser: Blaugrau, das die Farbe des Sees aufnimmt. Planung und Mosaik-Auswahl bei Platzhirsch in Lochau am Bodensee.",
    quelle: "/ezarri/space/anw-capricorn-space-mosaic-pool-ezarri-1-1600.webp", basis: "p01-see-pool",
    fokus: "50% 50%", credit: EZ, bearbeitung: BEARB_EZ, ziel: "/de/ezarri/pool",
    alt: "Pool mit blaugrauem Glasmosaik an einem Ufer, Häuser und Boote im Hintergrund",
  },
  {
    id: "p02", board: "pool-spa", layout: "voll",
    titel: "Muster an der Wasserlinie",
    overline: "Pool & Spa · Ezarri Patterns",
    beschreibung: "Rautenmuster aus Glasmosaik an Wand und Becken, Ezarri Patterns. Eigene Muster lassen sich bei uns mit dem Ezarri-Konfigurator planen.",
    quelle: "/ezarri/patterns/9-piscina-patron-section-1600.webp", basis: "p02-infinity",
    fokus: "30% 50%", credit: EZ, bearbeitung: BEARB_EZ, ziel: "/de/ezarri/konfigurator",
    alt: "Überlaufpool mit Rautenmuster in Blau, Blick auf das Meer",
  },
  {
    id: "p03", board: "chalet", layout: "band",
    titel: "Wellness im Haus: Holz, Stein, Glas",
    overline: "Chalet Arlberg · Inspiration",
    beschreibung: "Inspiration für den Wellnessbereich im Chalet: Holzdecke, Naturstein und Glasmosaik Ezarri Gea. Planung für Lech, Zürs und St. Anton auf Anfrage.",
    quelle: "/ezarri/gea/anw-cam14-slate25-1600.webp", basis: "p03-indoor-pool-holz",
    fokus: "45% 50%", credit: EZ, bearbeitung: BEARB_EZ, ziel: "/de/ezarri/wellness",
    alt: "Langer Innenpool unter einer Holzdecke, Liegen und Glasfront zum Garten",
  },
  {
    id: "p04", board: "pool-spa", layout: "band",
    titel: "Ein Muster, Pixel für Pixel geplant",
    overline: "Pool & Spa · Ezarri Custom Pixel",
    beschreibung: "Innenpool mit Glasmosaik Ezarri Custom Pixel in Gold und Weiß. Eigene Motive und Verläufe planen wir mit Ihnen, Muster zum Anfassen im Showroom Lochau.",
    quelle: "/ezarri/patterns/13-ezarri-gold-collection-custom-pixel-gold-25-wellness-spa-section-1600.webp", basis: "p04-spa-pool",
    fokus: "55% 50%", credit: EZ, bearbeitung: BEARB_EZ, ziel: "/de/ezarri/custom-mix",
    alt: "Heller Innenpool, Wand mit feinem Punktmuster aus Glasmosaik",
  },
  {
    id: "p05", board: "pool-spa", layout: "voll",
    titel: "Hamam zu Hause",
    overline: "Pool & Spa · Ezarri Gold",
    beschreibung: "Dampfbad mit Sitzbank, ausgekleidet mit Glasmosaik Ezarri Gold und Carrara. Warmes Licht unter der Bank, Planung auf Anfrage.",
    quelle: "/ezarri/gold/anw-alexande-gold-carrara-gold-mosaic-spa-wellness-ezarri-1-1600.webp", basis: "p05-hamam-gold",
    fokus: "50% 50%", credit: EZ, bearbeitung: BEARB_EZ, ziel: "/de/ezarri/wellness",
    alt: "Dampfbad mit dunklem Goldmosaik, weiße Sitzbänke mit Licht darunter",
  },
  {
    id: "p06", board: "chalet", layout: "band",
    titel: "Dampfbad mit Lichtfuge",
    overline: "Chalet Arlberg · Inspiration",
    beschreibung: "Gewölbtes Dampfbad mit Glasmosaik Ezarri Gold und Lichtfuge – eine Idee für den Wellnessbereich im Chalet.",
    quelle: "/ezarri/gold/anw-3-ezarri-gold-collection-washes-gold-25-wellness-spa-1600.webp", basis: "p06-hamam-licht",
    fokus: "40% 50%", credit: EZ, bearbeitung: BEARB_EZ, ziel: "/de/ezarri/wellness",
    alt: "Gewölbtes Dampfbad in hellem Mosaik mit Lichtband an der Bank",
  },
  {
    id: "p07", board: "kueche", layout: "band",
    titel: "Rückwand in Perlmutt",
    overline: "Küche · Ezarri Iridescent Hexa",
    beschreibung: "Küchenrückwand mit sechseckigem Glasmosaik Ezarri Iridescent (Perla). Ein Detail, das im Tageslicht die Farbe wechselt.",
    quelle: "/ezarri/iridescent/anw-perla-hexa-mosaic-iridescent-collection-ezarri-kitchen-1600.webp", basis: "p07-kueche-perla",
    fokus: "55% 50%", credit: EZ, bearbeitung: BEARB_EZ, ziel: "/de/ezarri/kueche",
    alt: "Helle Küche mit Kochinsel, Rückwand aus Perlmutt-Sechseckmosaik",
  },
  {
    id: "p08", board: "kueche", layout: "voll",
    titel: "Glasmosaik hinter der Spüle",
    overline: "Küche · Ezarri Iris Ebano",
    beschreibung: "Dunkles, schimmerndes Glasmosaik Ezarri Iris (Ebano) als Küchenrückwand, dazu Holz und Weiß.",
    quelle: "/ezarri/iridescent/anw-ebano-iris-mosaic-deco-ezarri-1-1600.webp", basis: "p08-kueche-ebano",
    fokus: "45% 50%", credit: EZ, bearbeitung: BEARB_EZ, ziel: "/de/ezarri/kueche",
    alt: "Küchenzeile mit dunkel schimmerndem Mosaik, Spüle und Holzarbeitsplatte",
  },
  {
    id: "p09", board: "pool-spa", layout: "band",
    titel: "Ein Bad in Türkis",
    overline: "Bad · Ezarri Cocktail",
    beschreibung: "Bad mit freistehender Wanne und Glasmosaik-Mischung Ezarri Cocktail (Tomahawk) in Türkis. Eigene Mischungen planen Sie im Ezarri-Konfigurator.",
    quelle: "/ezarri/cocktail/anw-tomahawk-25-cocktail-mosaic-deco-ezarri-1-1600.webp", basis: "p09-bad-tuerkis",
    fokus: "62% 50%", credit: EZ, bearbeitung: BEARB_EZ, ziel: "/de/ezarri/bad",
    alt: "Bad mit türkisem Mosaik an der Wand, freistehende weiße Wanne",
  },
  {
    id: "p10", board: "hotel", layout: "voll",
    titel: "Bar-Nische in Metallic",
    overline: "Hotel & Objekt · Ezarri Metal",
    beschreibung: "Bar und Buffet mit Glasmosaik Ezarri Metal (Lava): Ideen für Hotel, Café und Gastronomie.",
    quelle: "/ezarri/metal/anw-lava-25-metal-collection-ezarri-mosaics-home-interior-design-21-1600.webp", basis: "p10-bar-lava",
    fokus: "50% 40%", credit: EZ, bearbeitung: BEARB_EZ, ziel: "/de/hotel-objekt",
    alt: "Bar mit dunklem Metallic-Mosaik, Regale mit Gläsern und Patisserie",
  },
  {
    id: "p11", board: "outdoor", layout: "band",
    titel: "Draußen wohnen, am Wasser",
    overline: "Outdoor am See · Inspiration",
    beschreibung: "Lounge im Freien mit Pool in Glasmosaik Ezarri Space: Liegeflächen, Schatten und Wasser. Outdoor-Planung für Terrasse und Garten am Bodensee.",
    quelle: "/ezarri/space/anw-capricorn-space-mosaic-pool-ezarri-10-1600.webp", basis: "p11-outdoor-lounge",
    fokus: "40% 50%", credit: EZ, bearbeitung: BEARB_EZ, ziel: "/de/outdoor-gartenplanung",
    alt: "Überdachte Außenlounge mit Kissen auf Stufen und dunklem Pool",
  },
  {
    id: "p12", board: "pool-spa", layout: "band",
    titel: "Wanne vor Perlmutt",
    overline: "Bad · Ezarri Iris Perla",
    beschreibung: "Helles Bad mit Glasmosaik Ezarri Iris (Perla): ruhige Fläche, die Licht reflektiert.",
    quelle: "/ezarri/iridescent/anw-perla-iris-mosaic-deco-ezarri-1-1600.webp", basis: "p12-bad-perla",
    fokus: "50% 50%", credit: EZ, bearbeitung: BEARB_EZ, ziel: "/de/ezarri/bad",
    alt: "Weißes Bad mit Wanne, Wand aus hellem Perlmutt-Mosaik",
  },
  {
    id: "p13", board: "pool-spa", layout: "voll",
    titel: "Blaugrau, matt glänzend",
    overline: "Bad · Ezarri Iris Cuarzo",
    beschreibung: "Badewanne vor Glasmosaik Ezarri Iris (Cuarzo) in Blaugrau. Muster bestellen oder im Showroom Lochau ansehen.",
    quelle: "/ezarri/iridescent/anw-cuarzo-iris-mosaic-deco-ezarri-1-1600.webp", basis: "p13-bad-cuarzo",
    fokus: "50% 50%", credit: EZ, bearbeitung: BEARB_EZ, ziel: "/de/ezarri/bad",
    alt: "Freistehende Wanne vor blaugrauer Mosaikwand mit Bild",
  },
  {
    id: "p14", board: "hotel", layout: "band",
    titel: "Ruheraum im Hotel-Spa",
    overline: "Hotel & Objekt · Ezarri Zen",
    beschreibung: "Ruhezone am Becken mit Glasmosaik Ezarri Zen (Ash): Ideen für Hotel-Spa und Chalet-Vermietung.",
    quelle: "/ezarri/zen/anw-ash-50-zen-mosaic-ezarri-pool-1-1600.webp", basis: "p14-zen-grotte",
    fokus: "45% 50%", credit: EZ, bearbeitung: BEARB_EZ, ziel: "/de/hotel-objekt",
    alt: "Ruhezone mit Sessel an einem Becken vor Felswand",
  },
  {
    id: "p15", board: "hotel", layout: "band",
    titel: "Nischen, die Ware zeigen",
    overline: "Hotel & Objekt · Ezarri Gold",
    beschreibung: "Verkaufsraum mit Regalnischen in Glasmosaik Ezarri Gold: eine Idee für Shop, Spa-Empfang und Hotel-Boutique.",
    quelle: "/ezarri/gold/anw-11-ezarri-gold-collection-tomahawk-gold-25-interior-design-home-1600.webp", basis: "p15-objekt-regal",
    fokus: "50% 50%", credit: EZ, bearbeitung: BEARB_EZ, ziel: "/de/hotel-objekt",
    alt: "Weiße Wand mit drei grünen Mosaiknischen voller Produkte, Theke davor",
  },
  {
    id: "p16", board: "bodensee", layout: "band",
    titel: "Nehmen Sie Platz.",
    overline: "Wohnen am Bodensee · Showroom Lochau",
    beschreibung: "Unser Showroom mit Café in Lochau am Bodensee, Landstraße 11: Sofas probesitzen, Materialien anfassen, mit Harald Menghin planen.",
    quelle: "/Images/Home/aboutHome.jpg", basis: "p16-showroom-lochau",
    fokus: "62% 50%", credit: "Platzhirsch", bearbeitung: "Zuschnitt 2:3, KI-gestützte Hochskalierung 2× (Real-ESRGAN, lokal, keine hinzugefügten Motive), Typo-Overlay",
    ziel: "/de/showroom",
    hinweis: "Gesperrt bis zur Freigabe (Bildregister: offen). Eigenes Foto laut Inhaber-Entscheidung Nr. 11, vor Veröffentlichung bestätigen: Freigabe gilt auch für Pinterest; die gezeigten Möbel sind Teil des eigenen Fotos, keine Herstellerbilder.",
    alt: "Showroom mit hellen Sofas und Sesseln, Leuchten und großer Fensterfront",
  },
  {
    id: "s1", board: "skizze", layout: "slot", schritt: 1,
    titel: "1 · Die Skizze",
    overline: "Von der Skizze zum Raum",
    beschreibung: "Harald Menghin zeichnet Grundriss, Perspektive und Stimmung von Hand – vor dem ersten Klick am Computer.",
    slot: "Scan von Haralds Handzeichnung", credit: "Harald Menghin", ziel: "/de/arbeitsweise",
  },
  {
    id: "s2", board: "skizze", layout: "slot", schritt: 2,
    titel: "2 · Das Modell",
    overline: "Von der Skizze zum Raum",
    beschreibung: "Ein Raummodell im Maßstab, wie es Bauträger bauen: anfassen, umstellen, gemeinsam entscheiden.",
    slot: "Foto des Raummodells", credit: "Harald Menghin", ziel: "/de/arbeitsweise",
  },
  {
    id: "s3", board: "skizze", layout: "slot", schritt: 3,
    titel: "3 · Der Raum",
    overline: "Von der Skizze zum Raum",
    beschreibung: "Erst nach Skizze und Modell folgen 3D-Planung und fotorealistisches Rendering, dann der fertige Raum.",
    slot: "Rendering + Foto des fertigen Raums (selbes Projekt)", credit: "Harald Menghin", ziel: "/de/arbeitsweise",
  },
];

// Serie „Von der Skizze zum Raum“ (Konzept §6): ein Projekt, sieben Schritte,
// ausgespielt als Karussell-Pin (bis 5 Bilder), 15-s-Video (9:16 bzw. 2:3)
// und Einzel-Pins je Schritt.
export const SERIE = [
  { nr: 1, schritt: "Kennenlernen", material: "Foto im Showroom/Café (eigenes Shooting)", format: "Einzel-Pin" },
  { nr: 2, schritt: "Vor Ort", material: "Foto: Licht im Raum, Notizbuch, Maßband (mit Einwilligung)", format: "Einzel-Pin" },
  { nr: 3, schritt: "Handzeichnung", material: "Scan von Haralds Skizze", format: "Karussell Bild 1 · Video 0–4 s" },
  { nr: 4, schritt: "Modell", material: "Foto des Raummodells, Draufsicht + Detail", format: "Karussell Bild 2 · Video 4–8 s" },
  { nr: 5, schritt: "3D-Planung", material: "Screenshot der Planung (Maße sichtbar)", format: "Karussell Bild 3" },
  { nr: 6, schritt: "Rendering", material: "Fotorealistisches Rendering, als „Visualisierung“ beschriftet", format: "Karussell Bild 4 · Video 8–11 s" },
  { nr: 7, schritt: "Fertiger Raum", material: "Foto der Umsetzung, gleiche Perspektive wie Skizze", format: "Karussell Bild 5 · Video 11–15 s" },
];

// Redaktionsplan 12 Wochen, Start nach Freigabe (Annahme: Mo 16.11.2026).
// Je Woche 3–5 Pins; „Slot“ = wartet auf Haralds Material bzw. eigenes Shooting.
export const PLAN = [
  { kw: 47, start: "16.11.", fokus: "Start: Profil, 8 Boards, Ezarri Pool & Spa", pins: ["p01", "p04", "p05", "p16"], formate: "4 × Standard 2:3", status: "bereit" },
  { kw: 48, start: "23.11.", fokus: "Küche + erste Skizze", pins: ["p07", "p08", "s1"], formate: "2 × Standard, 1 × Skizze (Slot)", status: "teilweise Slot" },
  { kw: 49, start: "30.11.", fokus: "Chalet Arlberg zum Saisonstart", pins: ["p03", "p06", "s2", "Chalet-Foto"], formate: "3 × Standard, 1 × Karussell", status: "teilweise Slot" },
  { kw: 50, start: "07.12.", fokus: "Serie Skizze → Raum, Folge 1", pins: ["Video 15 s", "s1", "s2", "s3"], formate: "1 × Video 2:3, 3 × Standard", status: "Slot (Harald)" },
  { kw: 51, start: "14.12.", fokus: "Bad & Hamam für die Winterplanung", pins: ["p09", "p12", "p13"], formate: "3 × Standard", status: "bereit" },
  { kw: 1, start: "04.01.", fokus: "Hotel & Objekt, Bar und Spa", pins: ["p10", "p14", "p15"], formate: "3 × Standard", status: "bereit" },
  { kw: 2, start: "11.01.", fokus: "Wohnen am Bodensee, Winterlicht", pins: ["Showroom-Foto", "Café-Foto", "Material-Detail", "p16"], formate: "3 × Standard, 1 × Video", status: "Slot (Shooting)" },
  { kw: 3, start: "18.01.", fokus: "Serie Skizze → Raum, Folge 2", pins: ["Karussell 5 Bilder", "Skizze", "Modell", "Raum"], formate: "1 × Karussell, 3 × Standard", status: "Slot (Harald)" },
  { kw: 4, start: "25.01.", fokus: "Küche, Planung im Showroom", pins: ["Küchen-Skizze", "p07", "Küchen-Foto"], formate: "3 × Standard", status: "teilweise Slot" },
  { kw: 5, start: "01.02.", fokus: "Pool-Planung für den Sommer", pins: ["p02", "p01", "p11", "Konfigurator-Mischung"], formate: "4 × Standard", status: "bereit" },
  { kw: 6, start: "08.02.", fokus: "Outdoor am See, Vorschau Frühling", pins: ["p11", "Terrassen-Foto", "Outdoor-Skizze"], formate: "3 × Standard", status: "teilweise Slot" },
  { kw: 7, start: "15.02.", fokus: "Serie Skizze → Raum, Folge 3 + Rückblick", pins: ["Video 15 s", "Skizze", "Raum", "Board-Rückblick"], formate: "1 × Video, 3 × Standard", status: "Slot (Harald)" },
];

// Keywords (Konzept §3): Hypothesen aus Recherche, vor dem Start in
// trends.pinterest.com (Region Deutschland/Österreich, nach Login) prüfen.
export const KEYWORDS = [
  { board: "Wohnen am Bodensee", de: "Wohnzimmer Ideen modern, Einrichtung Bodensee, Sofa hell, Wohnzimmer gemütlich", en: "living room ideas, lake house interior" },
  { board: "Chalet Arlberg", de: "Chalet Einrichtung, Chalet Stil modern, Alpenchic, Wellness zuhause", en: "alpine chalet interior, modern chalet" },
  { board: "Pool & Spa mit Ezarri", de: "Pool Mosaik, Glasmosaik Pool, Hamam zuhause, Dampfbad, Bad Mosaik", en: "pool mosaic tiles, home spa, steam room design" },
  { board: "Küche", de: "Küche mit Kochinsel, Küchenrückwand Ideen, Küche modern grifflos", en: "kitchen island, kitchen backsplash ideas" },
  { board: "Outdoor am See", de: "Terrasse gestalten, Outdoor Lounge, Garten mit Pool", en: "outdoor lounge, lakeside terrace" },
  { board: "Yacht-Interior", de: "Yacht Interior, Boot Einrichtung", en: "yacht interior design" },
  { board: "Hotel & Objekt", de: "Hotel Interior, Hotel Spa, Ferienwohnung einrichten, Bar Design", en: "hotel interior design, boutique hotel spa" },
  { board: "Von der Skizze zum Raum", de: "Raumplanung Skizze, Einrichtungsplanung, Interior Design Prozess, Handzeichnung Interior", en: "interior design sketch, interior design process" },
];

// Checkliste für den Inhaber (vor dem ersten Pin).
export const CHECKLISTE = [
  { titel: "Unternehmenskonto anlegen", text: "Kostenloses Pinterest-Unternehmenskonto mit Firmen-Mail (nicht privat). Name „Platzhirsch Home Living“, Profilbild = Monogramm, Standort Lochau." },
  { titel: "Domain bestätigen", text: "In Pinterest: Einstellungen → Konto beanspruchen → Website → HTML-Tag. Den Code als Umgebungsvariable PINTEREST_DOMAIN_VERIFY im Deploy setzen; die Seite gibt dann <meta name=\"p:domain_verify\"> aus. Leer = kein Tag." },
  { titel: "Rich Pins prüfen", text: "Nach der Bestätigung eine Produkt- und eine Ratgeber-URL im Rich-Pins-Validator testen. Open Graph und Produkt-Strukturdaten sind auf der Website vorhanden." },
  { titel: "Bildrechte freigeben", text: "Für Pinterest nur: eigene Fotos, Haralds Material, Ezarri-Bilder (Quelle „Ezarri“). Keine Minotti-, Poliform- oder Custom-Line-Bilder. Freigabe aboutHome.jpg für Pinterest bestätigen (Umfang inkl. Pinterest, keine Herstellerstücke als Hauptmotiv; danach Bildregister auf „frei“). Bis dahin ist p16 gesperrt." },
  { titel: "Ezarri: Pinterest schriftlich bestätigen", text: "Per Mail bei Ezarri bestätigen lassen, dass die Nutzungserlaubnis (Entscheidung Nr. 7) auch Social Media und Pinterest umfasst, und wie die Quelle genannt werden soll (nur „Ezarri“ oder auch Fotograf). Mail in den Firmenakten ablegen, Bildregister ergänzen. Vorher keine Ezarri-Pins hochladen." },
  { titel: "Impressum und Offenlegung im Profil", text: "Im Pinterest-Profil (Info-Text bzw. Website-Feld) einen leicht erreichbaren Link „Impressum: platzhirsch.studio/de/impressum“ setzen (§ 5 ECG, § 14 UGB, Offenlegung nach § 25 MedienG). Vor dem ersten Pin." },
  { titel: "Haralds Material liefern", text: "Skizzen, Modellfotos, Porträt und 2–3 Projektketten (Skizze → Modell → Rendering → Raum), mit Kunden-Einwilligung oder anonymisiert." },
  { titel: "Pinterest-Tag erst später", text: "Das Mess-Skript (Pinterest-Tag) kommt nur mit Marketing-Einwilligung im Cookie-Banner und nach Ergänzung der Datenschutzerklärung durch die Kanzlei. Für den Start nicht nötig." },
  { titel: "Zuständigkeit festlegen", text: "Wer pinnt (3–5 Pins pro Woche, etwa 1 Std.), wer gibt Bilder frei, wer antwortet auf Kommentare und Nachrichten." },
];

// Kennzahlen (Konzept §8) – Zielwerte nach 12 Wochen sind Startannahmen.
export const KENNZAHLEN = [
  { kennzahl: "Ausgehende Klicks auf platzhirsch.studio", warum: "zeigt echtes Interesse, Hauptziel" },
  { kennzahl: "Saves (Merken)", warum: "Pinterest-Signal für Reichweite und Relevanz" },
  { kennzahl: "Termin-/Beratungsanfragen mit Quelle Pinterest", warum: "Geschäftsziel; Abfrage „Wie haben Sie uns gefunden?“, kein Tracking nötig" },
  { kennzahl: "Ideenboards mit Pinterest-Bezug", warum: "Brücke Inspiration → Termin (Website-Ideenboard)" },
  { kennzahl: "Impressionen je Board", warum: "welche Themen tragen; Planung der nächsten 12 Wochen" },
];

export const boardById = (id) => BOARDS.find((b) => b.id === id);
export const pinById = (id) => PINS.find((p) => p.id === id);
/** Öffentlicher Pfad des fertigen Pins (1000 × 1500) bzw. der Vorschau (600 × 900). */
export const pinBild = (id, klein = false) => `/preview/pinterest/${id}${klein ? "-600" : ""}.webp`;
/** Zugeschnittene Basis (ohne Typo), Eingang der Vorlage. */
export const pinBasis = (pin) => `/preview/pinterest/basis/${pin.basis}.webp`;
