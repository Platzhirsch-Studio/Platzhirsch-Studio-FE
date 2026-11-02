// src/lib/katalog/marken/soleum.js – Soleum (SOLEUM GmbH, Pregarten, Oberösterreich)
// Vollständiges Beispiel für die Daten-Teams (Stand 31.10.2026).
//
// Quellen: nur die offiziellen Herstellerseiten soleum.at und soleum.de, frei
// abrufbar (normale HTTP-Abrufe, keine Umgehung). Bilder im Motiv unverändert (nicht
// beschnitten; einheitlich ≤ 1600 px lange Kante, WebP q82 (tools/images/optimize-katalog.mjs)), Quelle je Bild in
// docs/bildquellen/QUELLEN.md (Abschnitt „Katalog Soleum“).
//
// Umfang (Inhaber-Vorgabe 31.10.2026): nur FERTIGE Produkte – alle Wärmeliegen,
// Ruheliege SOLONDA, Dampfbad-Kabine ELLIPSE, Meeresklimakabine OMEGA. Bausteine,
// Bausätze, Formteile, Sitze, EPS-Duschen, Technik, Leuchten, Zubehör und
// Salzvernebler bewusst ausgelassen. Vollständigkeits-Check mit Begründung je
// Herstellerseite: qa-screenshots/wellness/produkte/vollstaendigkeit-soleum.md.
// Nicht übernommen werden nur INHALTE, keine Produkte:
//   - Preise und Abverkaufs-Angaben der Shop-Seiten,
//   - Gesundheits-/Wirkaussagen (Durchblutung, Rheuma, Haut, Atemwege,
//     „Thalassotherapie“, Halotherapie als Wirkung),
//   - Werbe-Absolute („Luxusklasse“, „Extraklasse“, „einzigartig“).
// Belegt auf soleum.de (Technische Daten der Liegen): „Temperatur frei
// einstellbar, von ~30–45 °C“ und „anschlussfertig geliefert – Plug & Play“
// (nicht auf soleum.at). Nur dort übernommen, wo die jeweilige Produktseite es nennt.

const STAND = "2026-10-31";
const T = (de, en, fr, it) => Object.freeze({ de, en, fr, it });
const bild = (file, width, height, alt, quelleUrl) =>
  Object.freeze({ src: `/Images/Wellness/produkte/soleum/${file}`, width, height, alt, quelleUrl, abgerufen: STAND });
const mass = (key, wert) => Object.freeze({ key, wert });

const AT_LIEGEN = "https://www.soleum.at/infrarotliegen_und_wellnessliegen_produzent/";
const DE_SPA_LIEGEN = "https://www.soleum.de/hotel-spa-liegen/";

// Gemeinsame, auf den Liegen-Seiten belegte Merkmale.
const M = {
  handarbeit: T(
    "Von Hand in der Manufaktur gefertigt, Farbe und Material nach Wunsch",
    "Handmade in the manufacturer's workshop, colour and material to order",
    "Fabriqué à la main dans l’atelier du fabricant, couleur et matériau sur demande",
    "Realizzato a mano nel laboratorio del produttore, colore e materiale su richiesta"
  ),
  heizung: T(
    "Infrarot-Heizung 459 W, 230 V (110 V auf Bestellung)",
    "Infrared heating 459 W, 230 V (110 V on request)",
    "Chauffage infrarouge 459 W, 230 V (110 V sur commande)",
    "Riscaldamento a infrarossi 459 W, 230 V (110 V su ordinazione)"
  ),
  temperatur: T(
    "Temperatur frei einstellbar, laut Hersteller ca. 30–45 °C",
    "Temperature freely adjustable, approx. 30–45 °C according to the manufacturer",
    "Température réglable librement, env. 30–45 °C selon le fabricant",
    "Temperatura regolabile liberamente, circa 30–45 °C secondo il produttore"
  ),
  anschluss: T(
    "Anschlussfertig geliefert („Plug & Play“)",
    "Delivered ready to connect (“plug & play”)",
    "Livré prêt à brancher (« plug & play »)",
    "Fornito pronto per l’allacciamento (“plug & play”)"
  ),
  led: T(
    "LED-Beleuchtung unter der Liege in Warmweiß",
    "Warm white LED lighting beneath the lounger",
    "Éclairage LED blanc chaud sous la méridienne",
    "Illuminazione LED bianco caldo sotto il lettino"
  ),
  sicis: T(
    "Glasmosaik von SICIS (Colibri Collection), Auswahl aus 192 Designs, Epoxid-Fugenmasse passend zur Fliese",
    "SICIS glass mosaic (Colibri Collection), choice of 192 designs, epoxy grout matched to the tile",
    "Mosaïque de verre SICIS (Colibri Collection), 192 motifs au choix, joint époxy assorti",
    "Mosaico di vetro SICIS (Colibri Collection), 192 decori a scelta, stucco epossidico abbinato"
  ),
  ral: T(
    "Mikrozement in vielen Farbtönen, auch nach RAL",
    "Microcement in many shades, also to RAL colours",
    "Microciment en de nombreuses teintes, aussi selon RAL",
    "Microcemento in molte tonalità, anche su colori RAL"
  ),
  feuerbox: T(
    "Optional mit Feuerbox: 3D-Feuer aus Wasser, Ultraschall und Licht",
    "Optional fire box: a 3D flame effect made from water, ultrasound and light",
    "En option, boîte à feu : effet de flamme 3D à base d’eau, d’ultrasons et de lumière",
    "Opzionale con fire box: effetto fiamma 3D con acqua, ultrasuoni e luce"
  ),
};

const liegeMasse204 = (gewicht = "~70 kg") =>
  Object.freeze([mass("laenge", "204 cm"), mass("breite", "76 cm"), mass("hoehe", "83 cm"), mass("sitzhoehe", "~40 cm"), mass("gewicht", gewicht)]);

/** @type {import("../schema.js").KatalogMarke} */
export const MARKE = Object.freeze({
  slug: "soleum",
  name: "Soleum",
  welt: "bad-wellness",
  herstellerUrl: "https://www.soleum.at/",
  dealer: true,
  stand: STAND,
});

/** @type {import("../schema.js").KatalogProdukt[]} */
export const PRODUKTE = Object.freeze([
  // ---------------------------------------------------------------- Wärmeliegen
  Object.freeze({
    slug: "soleum-flying-carpet",
    marke: "soleum",
    bereich: "wellness",
    kategorie: "waermeliege",
    name: "Flying Carpet",
    kurz: T(
      "Geflieste Wärmeliege mit sanft geschwungener Form und Glasmosaik von SICIS. Laut Hersteller passt sie in Wellness- und Saunabereiche ebenso wie in Wohnräume, Lofts oder Foyers.",
      "Tiled heated lounger with a gently curved shape and SICIS glass mosaic. According to the manufacturer it suits spa and sauna areas as well as living rooms, lofts or foyers.",
      "Méridienne chauffante carrelée aux courbes douces, en mosaïque de verre SICIS. Selon le fabricant, elle trouve sa place dans un espace bien-être ou sauna comme dans un salon, un loft ou un hall.",
      "Lettino riscaldato piastrellato dalla forma dolcemente curva, in mosaico di vetro SICIS. Secondo il produttore si adatta ad aree wellness e sauna come a soggiorni, loft o foyer."
    ),
    merkmale: Object.freeze([
      M.sicis,
      T(
        "Seitenflächen standardmäßig in weißem Mikrozement, auf Wunsch eingefärbt; optional goldene Echtmetall-Beschichtung und Overlays",
        "Sides in white microcement as standard, tinted on request; optional gold real-metal coating and overlays",
        "Côtés en microciment blanc en standard, teintés sur demande ; en option revêtement en métal véritable doré et overlays",
        "Fianchi in microcemento bianco di serie, colorati su richiesta; opzionali rivestimento in metallo vero dorato e overlay"
      ),
      M.led,
      M.heizung,
      M.temperatur,
      M.anschluss,
    ]),
    masse: liegeMasse204(),
    bilder: Object.freeze([
      bild("soleum-flying-carpet-1.webp", 1600, 715, T("Soleum Flying Carpet: geflieste Wärmeliege mit goldfarbenem Glasmosaik und geschwungener Form, seitlich", "Soleum Flying Carpet: tiled heated lounger with gold-coloured glass mosaic and curved shape, side view", "Soleum Flying Carpet : méridienne chauffante carrelée en mosaïque de verre dorée, aux formes courbes, vue de côté", "Soleum Flying Carpet: lettino riscaldato piastrellato in mosaico di vetro dorato dalla forma curva, vista laterale"), AT_LIEGEN),
      bild("soleum-flying-carpet-2.webp", 600, 515, T("Soleum Flying Carpet mit Feuerbox am Kopfende, beleuchteter Sockel", "Soleum Flying Carpet with fire box at the head end, illuminated base", "Soleum Flying Carpet avec boîte à feu en tête, socle éclairé", "Soleum Flying Carpet con fire box alla testata, base illuminata"), "https://www.soleum.de/featured_item/luxus-wellnessliege/"),
      bild("soleum-flying-carpet-3.webp", 1600, 715, T("Soleum Flying Carpet von der Seite mit warmweißer LED-Beleuchtung unter der Liegefläche", "Soleum Flying Carpet from the side with warm white LED lighting beneath the surface", "Soleum Flying Carpet de côté, avec éclairage LED blanc chaud sous l’assise", "Soleum Flying Carpet di lato con illuminazione LED bianco caldo sotto la seduta"), "https://www.soleum.de/featured_item/luxus-wellnessliege/"),
    ]),
    herstellerUrl: "https://www.soleum.de/featured_item/luxus-wellnessliege/",
    quellen: Object.freeze(["https://www.soleum.de/featured_item/luxus-wellnessliege/", AT_LIEGEN]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "soleum-rose-red",
    marke: "soleum",
    bereich: "wellness",
    kategorie: "waermeliege",
    name: "ROSE RED",
    kurz: T(
      "Geflieste Wärmeliege mit rotem Glasmosaik von SICIS und Seitenflächen aus weißem Mikrozement. Laut Hersteller für private Wohnräume wie für Hotel-Spas gedacht.",
      "Tiled heated lounger with red SICIS glass mosaic and sides in white microcement. According to the manufacturer intended for private homes and hotel spas alike.",
      "Méridienne chauffante carrelée en mosaïque de verre SICIS rouge, côtés en microciment blanc. Selon le fabricant, pensée pour l’habitat privé comme pour le spa d’hôtel.",
      "Lettino riscaldato piastrellato in mosaico di vetro SICIS rosso, con fianchi in microcemento bianco. Secondo il produttore pensato per la casa come per la spa d’hotel."
    ),
    merkmale: Object.freeze([
      M.sicis,
      T("Seitenflächen in weißem Mikrozement, andere Farben möglich", "Sides in white microcement, other colours possible", "Côtés en microciment blanc, autres couleurs possibles", "Fianchi in microcemento bianco, altri colori possibili"),
      M.led,
      M.heizung,
      M.temperatur,
      M.anschluss,
      M.handarbeit,
    ]),
    masse: liegeMasse204(),
    bilder: Object.freeze([
      bild("soleum-rose-red-1.webp", 1500, 900, T("Soleum ROSE RED: Wärmeliege mit rotem Glasmosaik und weißen Seitenflächen, zwei Ansichten", "Soleum ROSE RED: heated lounger with red glass mosaic and white sides, two views", "Soleum ROSE RED : méridienne chauffante en mosaïque de verre rouge, côtés blancs, deux vues", "Soleum ROSE RED: lettino riscaldato in mosaico di vetro rosso e fianchi bianchi, due viste"), "https://www.soleum.de/featured_item/geflieste-waermeliege/"),
      bild("soleum-rose-red-2.webp", 1200, 720, T("Soleum ROSE RED von der Seite vor dunklem Hintergrund", "Soleum ROSE RED from the side against a dark background", "Soleum ROSE RED de côté sur fond sombre", "Soleum ROSE RED di lato su sfondo scuro"), AT_LIEGEN),
    ]),
    herstellerUrl: "https://www.soleum.de/featured_item/geflieste-waermeliege/",
    quellen: Object.freeze(["https://www.soleum.de/featured_item/geflieste-waermeliege/", AT_LIEGEN]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "soleum-lagoon",
    marke: "soleum",
    bereich: "wellness",
    kategorie: "waermeliege",
    name: "LAGOON",
    kurz: T(
      "Geflieste Wärmeliege mit Glasmosaik von SICIS und von Hand aufgetragenem Mikrozement an den Seiten. Für Hotel-Spas und private Wellnessbereiche.",
      "Tiled heated lounger with SICIS glass mosaic and hand-applied microcement on the sides. For hotel spas and private wellness areas.",
      "Méridienne chauffante carrelée en mosaïque de verre SICIS, côtés en microciment appliqué à la main. Pour spas d’hôtel et espaces bien-être privés.",
      "Lettino riscaldato piastrellato in mosaico di vetro SICIS, con fianchi in microcemento applicato a mano. Per spa d’hotel e aree wellness private."
    ),
    merkmale: Object.freeze([
      M.sicis,
      T("Mikrozement-Beschichtung von Hand, Farbe wählbar; Overlays (z. B. ein Logo) möglich", "Hand-applied microcement coating, colour of choice; overlays (e.g. a logo) possible", "Revêtement en microciment appliqué à la main, couleur au choix ; overlays (p. ex. un logo) possibles", "Rivestimento in microcemento a mano, colore a scelta; overlay (ad es. un logo) possibili"),
      T("LED-Beleuchtung rund um den Sockel", "LED lighting around the base", "Éclairage LED autour du socle", "Illuminazione LED intorno alla base"),
      T("Heizung 459 W, 230 V, Temperatur frei einstellbar", "Heating 459 W, 230 V, temperature freely adjustable", "Chauffage 459 W, 230 V, température réglable librement", "Riscaldamento 459 W, 230 V, temperatura regolabile liberamente"),
    ]),
    masse: Object.freeze([mass("laenge", "159 cm"), mass("breite", "81 cm"), mass("hoehe", "106 cm"), mass("gewicht", "~80 kg")]),
    bilder: Object.freeze([
      bild("soleum-lagoon-1.webp", 1200, 720, T("Soleum LAGOON: Wärmeliege mit blauem Glasmosaik und grauen Mikrozement-Seiten mit Ornament", "Soleum LAGOON: heated lounger with blue glass mosaic and grey microcement sides with ornament", "Soleum LAGOON : méridienne chauffante en mosaïque de verre bleue, côtés en microciment gris ornés", "Soleum LAGOON: lettino riscaldato in mosaico di vetro blu con fianchi in microcemento grigio decorati"), AT_LIEGEN),
      bild("soleum-lagoon-2.webp", 765, 379, T("Soleum LAGOON schräg von vorn vor grauem Hintergrund", "Soleum LAGOON at an angle from the front against a grey background", "Soleum LAGOON de trois quarts sur fond gris", "Soleum LAGOON di tre quarti su sfondo grigio"), "https://www.soleum.de/shop/spa_waermeliegen_wellnessliegen/spa-waermeliege-fuer-hotels-und-privat/"),
    ]),
    herstellerUrl: "https://www.soleum.de/featured_item/luxus-spa-waermeliege-fuer-hotels-wellnessbereiche-und-private-saunalandschaften/",
    quellen: Object.freeze(["https://www.soleum.de/featured_item/luxus-spa-waermeliege-fuer-hotels-wellnessbereiche-und-private-saunalandschaften/", DE_SPA_LIEGEN, AT_LIEGEN]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "soleum-mythos",
    marke: "soleum",
    bereich: "wellness",
    kategorie: "waermeliege",
    name: "MYTHOS",
    kurz: T(
      "Wärmeliege in anthrazitfarbener Betonoptik aus von Hand aufgetragenem Mikrozement. Für private Spa-Bereiche und Hotels.",
      "Heated lounger in an anthracite concrete look made from hand-applied microcement. For private spa areas and hotels.",
      "Méridienne chauffante aspect béton anthracite, en microciment appliqué à la main. Pour spas privés et hôtels.",
      "Lettino riscaldato effetto cemento antracite in microcemento applicato a mano. Per spa private e hotel."
    ),
    merkmale: Object.freeze([M.ral, M.led, M.heizung, M.temperatur, M.anschluss, M.feuerbox]),
    masse: liegeMasse204(),
    bilder: Object.freeze([
      bild("soleum-mythos-1.webp", 765, 379, T("Soleum MYTHOS: Wärmeliege in dunkler Betonoptik mit Feuerbox und beleuchtetem Sockel", "Soleum MYTHOS: heated lounger in dark concrete look with fire box and illuminated base", "Soleum MYTHOS : méridienne chauffante aspect béton foncé avec boîte à feu et socle éclairé", "Soleum MYTHOS: lettino riscaldato effetto cemento scuro con fire box e base illuminata"), "https://www.soleum.de/featured_item/beheizte-liege-in-betonoptik/"),
      bild("soleum-mythos-2.webp", 1200, 720, T("Soleum MYTHOS von der Seite mit Feuerbox am Kopfende", "Soleum MYTHOS from the side with fire box at the head end", "Soleum MYTHOS de côté avec boîte à feu en tête", "Soleum MYTHOS di lato con fire box alla testata"), AT_LIEGEN),
    ]),
    herstellerUrl: "https://www.soleum.de/featured_item/beheizte-liege-in-betonoptik/",
    quellen: Object.freeze(["https://www.soleum.de/featured_item/beheizte-liege-in-betonoptik/", AT_LIEGEN]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "soleum-snow-white",
    marke: "soleum",
    bereich: "wellness",
    kategorie: "waermeliege",
    name: "SNOW WHITE",
    kurz: T(
      "Wärmeliege in weißer Betonoptik aus Mikrozement, puristisch in der Form. Temperatur selbst einstellbar.",
      "Heated lounger in a white concrete look made from microcement, with a pared-back shape. Temperature adjustable by the user.",
      "Méridienne chauffante aspect béton blanc en microciment, aux lignes épurées. Température réglable par l’utilisateur.",
      "Lettino riscaldato effetto cemento bianco in microcemento, dalla forma essenziale. Temperatura regolabile dall’utente."
    ),
    merkmale: Object.freeze([M.ral, M.led, M.heizung, M.temperatur, M.anschluss]),
    masse: liegeMasse204(),
    bilder: Object.freeze([
      bild("soleum-snow-white-1.webp", 765, 379, T("Soleum SNOW WHITE: weiße Wärmeliege in Betonoptik mit Lichtschein unter der Liegefläche", "Soleum SNOW WHITE: white heated lounger in concrete look with light beneath the surface", "Soleum SNOW WHITE : méridienne chauffante blanche aspect béton, lumière sous l’assise", "Soleum SNOW WHITE: lettino riscaldato bianco effetto cemento con luce sotto la seduta"), "https://www.soleum.de/featured_item/infrarot-betonliege-snow-white/"),
      bild("soleum-snow-white-2.webp", 1200, 720, T("Soleum SNOW WHITE mit feinem Ornament auf der Liegefläche", "Soleum SNOW WHITE with a fine ornament on the surface", "Soleum SNOW WHITE avec un fin motif sur l’assise", "Soleum SNOW WHITE con un sottile decoro sulla seduta"), AT_LIEGEN),
    ]),
    herstellerUrl: "https://www.soleum.de/featured_item/infrarot-betonliege-snow-white/",
    quellen: Object.freeze(["https://www.soleum.de/featured_item/infrarot-betonliege-snow-white/", AT_LIEGEN]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "soleum-lovt",
    marke: "soleum",
    bereich: "wellness",
    kategorie: "waermeliege",
    name: "LOVT",
    kurz: T(
      "Wärmeliege in Betonoptik, deren Mikrozement von Hand aufgetragen wird – dadurch hat jede Liege ihre eigene Struktur. Gedacht als Ergänzung zu zeitgenössischer Architektur.",
      "Heated lounger in a concrete look; the microcement is applied by hand, so each lounger has its own texture. Intended to complement contemporary architecture.",
      "Méridienne chauffante aspect béton ; le microciment est appliqué à la main, chaque pièce a donc sa propre texture. Pensée pour l’architecture contemporaine.",
      "Lettino riscaldato effetto cemento; il microcemento è applicato a mano, perciò ogni lettino ha una propria texture. Pensato per l’architettura contemporanea."
    ),
    merkmale: Object.freeze([
      T("Mikrozement von Hand, Struktur je nach Verarbeitung und Muster individuell", "Hand-applied microcement, texture varies with application and pattern", "Microciment appliqué à la main, texture propre à chaque application", "Microcemento a mano, texture diversa a seconda della lavorazione"),
      M.feuerbox,
      M.handarbeit,
    ]),
    bilder: Object.freeze([
      bild("soleum-lovt-1.webp", 1200, 720, T("Soleum LOVT: zwei Wärmeliegen in grauer Betonoptik mit Feuerboxen am Kopfende", "Soleum LOVT: two heated loungers in grey concrete look with fire boxes at the head end", "Soleum LOVT : deux méridiennes chauffantes aspect béton gris avec boîtes à feu", "Soleum LOVT: due lettini riscaldati effetto cemento grigio con fire box alla testata"), AT_LIEGEN),
    ]),
    herstellerUrl: AT_LIEGEN,
    quellen: Object.freeze([AT_LIEGEN]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "soleum-woodon",
    marke: "soleum",
    bereich: "wellness",
    kategorie: "waermeliege",
    name: "WOODON",
    kurz: T(
      "Wärmeliege im Landhausstil: ein Sockel in Eichenoptik, kombiniert mit einer 3 mm dünnen Mikrozement-Schicht. Laut Hersteller für Chalets und Wellnessbereiche im alpinen Stil gedacht.",
      "Heated lounger in a country-house style: an oak-look base combined with a 3 mm microcement layer. According to the manufacturer intended for chalets and alpine-style spas.",
      "Méridienne chauffante de style chalet : socle aspect chêne et couche de microciment de 3 mm. Selon le fabricant, pensée pour les chalets et les spas de style alpin.",
      "Lettino riscaldato in stile country: base effetto rovere e strato di microcemento di 3 mm. Secondo il produttore pensato per chalet e spa in stile alpino."
    ),
    merkmale: Object.freeze([
      T("Kombination aus Eichenoptik und Mikrozement (3 mm), Mikrozement-Farbe nach Wunsch, auch nach RAL", "Oak look combined with microcement (3 mm), microcement colour to order, also RAL", "Aspect chêne et microciment (3 mm), teinte du microciment sur demande, aussi RAL", "Effetto rovere e microcemento (3 mm), colore del microcemento su richiesta, anche RAL"),
      M.led,
      M.heizung,
      M.temperatur,
      M.anschluss,
    ]),
    masse: Object.freeze([mass("laenge", "156 cm"), mass("breite", "81 cm"), mass("hoehe", "106 cm"), mass("sitzhoehe", "~45 cm"), mass("gewicht", "~80 kg")]),
    bilder: Object.freeze([
      bild("soleum-woodon-1.webp", 765, 379, T("Soleum WOODON: Wärmeliege mit Sockel in Eichenoptik und heller Mikrozement-Liegefläche auf einem Fell", "Soleum WOODON: heated lounger with oak-look base and light microcement surface on a hide rug", "Soleum WOODON : méridienne chauffante, socle aspect chêne et assise en microciment clair, sur une peau", "Soleum WOODON: lettino riscaldato con base effetto rovere e seduta in microcemento chiaro su una pelle"), "https://www.soleum.de/featured_item/beheizte-saunaliege-woodon/"),
      bild("soleum-woodon-2.webp", 765, 379, T("Soleum WOODON: Detail der Liegefläche aus Mikrozement über Altholz", "Soleum WOODON: detail of the microcement surface above aged wood", "Soleum WOODON : détail de l’assise en microciment sur bois ancien", "Soleum WOODON: dettaglio della seduta in microcemento sopra legno antico"), "https://www.soleum.de/featured_item/beheizte-saunaliege-woodon/"),
    ]),
    herstellerUrl: "https://www.soleum.de/featured_item/beheizte-saunaliege-woodon/",
    quellen: Object.freeze(["https://www.soleum.de/featured_item/beheizte-saunaliege-woodon/", DE_SPA_LIEGEN]),
    stand: STAND,
  }),
  // ---------------------------------------------------------------- Ruheliege
  Object.freeze({
    slug: "soleum-solonda",
    marke: "soleum",
    bereich: "wellness",
    kategorie: "ruheliege",
    name: "SOLONDA",
    kurz: T(
      "Ruheliege für innen und außen mit abnehmbarem Lederbezug, von Hand genäht. Größe, Farbe und ein gesticktes Logo lassen sich anpassen.",
      "Relaxation lounger for indoors and outdoors with a removable leather cover, hand-sewn. Size, colour and an embroidered logo can be customised.",
      "Méridienne de repos pour l’intérieur et l’extérieur, housse en cuir amovible cousue main. Taille, couleur et logo brodé personnalisables.",
      "Lettino relax per interni ed esterni con rivestimento in pelle sfoderabile, cucito a mano. Dimensioni, colore e logo ricamato personalizzabili."
    ),
    merkmale: Object.freeze([
      T("Bezug aus feuerfestem, umweltfreundlichem Leder, abnehmbar und austauschbar", "Cover made of fire-resistant, eco-friendly leather, removable and replaceable", "Housse en cuir ignifuge et écologique, amovible et remplaçable", "Rivestimento in pelle ignifuga ed ecologica, sfoderabile e sostituibile"),
      T("Hochdichter Schaumstoff auf einer Sperrholzplatte", "High-density foam on a plywood board", "Mousse haute densité sur panneau de contreplaqué", "Espanso ad alta densità su pannello di compensato"),
      T("Für Innen- und Außenräume", "For indoor and outdoor use", "Pour l’intérieur et l’extérieur", "Per interni ed esterni"),
    ]),
    masse: Object.freeze([mass("laenge", "188 cm"), mass("breite", "70 cm"), mass("hoehe", "67 cm"), mass("gewicht", "28 kg")]),
    bilder: Object.freeze([
      bild("soleum-solonda-1.webp", 600, 400, T("Soleum SOLONDA: Reihe heller Ruheliegen in einem Ruheraum mit Holzwand", "Soleum SOLONDA: row of light-coloured loungers in a relaxation room with a wooden wall", "Soleum SOLONDA : rangée de méridiennes claires dans une salle de repos à paroi en bois", "Soleum SOLONDA: fila di lettini chiari in una sala relax con parete in legno"), "https://www.soleum.de/shop/wellnessliegen_spa_liegen/solonda-wellnessliege/"),
    ]),
    herstellerUrl: "https://www.soleum.de/shop/wellnessliegen_spa_liegen/solonda-wellnessliege/",
    quellen: Object.freeze(["https://www.soleum.de/shop/wellnessliegen_spa_liegen/solonda-wellnessliege/"]),
    stand: STAND,
  }),
  // ---------------------------------------------------------------- Dampfbad
  Object.freeze({
    slug: "soleum-ellipse",
    marke: "soleum",
    bereich: "wellness",
    kategorie: "dampfbad",
    name: "ELLIPSE",
    kurz: T(
      "Dampfbad für den Außenbereich in Ellipsenform, für Garten, Terrasse oder neben dem Pool. Es wird komplett anschlussfertig mit Glas geliefert und bietet Platz für vier Personen.",
      "Outdoor steam room in an elliptical shape for the garden, terrace or poolside. It is delivered fully ready to connect, glazing included, and seats four.",
      "Hammam d’extérieur de forme elliptique, pour le jardin, la terrasse ou le bord de piscine. Livré prêt à raccorder avec son vitrage, il accueille quatre personnes.",
      "Bagno turco da esterno a forma ellittica, per giardino, terrazza o bordo piscina. Viene fornito pronto per l’allacciamento, vetrata inclusa, e ospita quattro persone."
    ),
    merkmale: Object.freeze([
      T("Alle Flächen elektrisch beheizt", "All surfaces electrically heated", "Toutes les surfaces chauffées électriquement", "Tutte le superfici riscaldate elettricamente"),
      T("Integrierte Handbrause (Warm- und Kaltwasser)", "Integrated hand shower (hot and cold water)", "Douchette intégrée (eau chaude et froide)", "Doccetta integrata (acqua calda e fredda)"),
      T("Edelstahltaster innen für Dampfgenerator, Solevernebelung, Duftstoffpumpe und Farbprogramme", "Stainless steel buttons inside for steam generator, brine misting, fragrance pump and colour programmes", "Boutons en inox à l’intérieur pour générateur de vapeur, brumisation saline, pompe à parfum et programmes de couleur", "Pulsanti interni in acciaio inox per generatore di vapore, nebulizzazione salina, pompa essenze e programmi colore"),
      T("Gezeigtes Beispiel: Glasmosaik von SICIS in Türkis mit Anthrazit", "Example shown: SICIS glass mosaic in turquoise with anthracite", "Exemple présenté : mosaïque de verre SICIS turquoise et anthracite", "Esempio mostrato: mosaico di vetro SICIS turchese e antracite"),
    ]),
    bilder: Object.freeze([
      bild("soleum-ellipse-1.webp", 980, 653, T("Soleum ELLIPSE: elliptisches Außen-Dampfbad mit Glasfront, innen türkisfarbenes Mosaik und Liegen", "Soleum ELLIPSE: elliptical outdoor steam room with glass front, turquoise mosaic and loungers inside", "Soleum ELLIPSE : hammam d’extérieur elliptique à façade vitrée, mosaïque turquoise et banquettes", "Soleum ELLIPSE: bagno turco da esterno ellittico con fronte in vetro, mosaico turchese e sedute"), "https://www.soleum.de/featured_item/aussen-dampfbad-fuer-das-garten-spa/"),
      bild("soleum-ellipse-2.webp", 588, 441, T("Soleum ELLIPSE bei Nacht mit rotem Farblicht", "Soleum ELLIPSE at night with red coloured light", "Soleum ELLIPSE la nuit avec éclairage rouge", "Soleum ELLIPSE di notte con luce rossa"), "https://www.soleum.de/featured_item/aussen-dampfbad-fuer-das-garten-spa/"),
    ]),
    herstellerUrl: "https://www.soleum.de/featured_item/aussen-dampfbad-fuer-das-garten-spa/",
    quellen: Object.freeze(["https://www.soleum.de/featured_item/aussen-dampfbad-fuer-das-garten-spa/", "https://www.soleum.de/aussensauna-soleum-die-dampfsauna-fuer-den-aussenbereich/"]),
    stand: STAND,
  }),
  // ---------------------------------------------------------------- Kabinen
  Object.freeze({
    slug: "soleum-omega",
    marke: "soleum",
    bereich: "wellness",
    kategorie: "spa-kabine",
    name: "Meeresklimakabine OMEGA",
    kurz: T(
      "Runde, fugenlose Spa-Kabine für innen und außen, für private und gewerbliche Spa-Bereiche. Sie verbindet Infrarot-Wärme, Sole- und Teevernebelung, Farblicht und Musik.",
      "Round, seamless spa cabin for indoors and outdoors, for private and commercial spas. It combines infrared warmth, brine and tea misting, coloured light and music.",
      "Cabine spa ronde et sans joints pour l’intérieur et l’extérieur, pour spas privés et professionnels. Elle associe chaleur infrarouge, brumisation saline ou de tisane, lumière colorée et musique.",
      "Cabina spa rotonda e senza fughe per interni ed esterni, per spa private e professionali. Unisce calore a infrarossi, nebulizzazione salina o di tisane, luce colorata e musica."
    ),
    merkmale: Object.freeze([
      T("Steuerung per Smartphone oder Web (Smart Control)", "Controlled via smartphone or web (Smart Control)", "Commande par smartphone ou web (Smart Control)", "Comando da smartphone o web (Smart Control)"),
      T("Optional: Dampfbetrieb, Trockensalz-Vernebelung, Duftstoff über den Dampf, Brausearmatur", "Options: steam mode, dry salt misting, fragrance via the steam, shower fitting", "Options : mode vapeur, brumisation de sel sec, parfum par la vapeur, robinetterie de douche", "Opzioni: funzione vapore, nebulizzazione di sale secco, essenze nel vapore, rubinetteria doccia"),
    ]),
    bilder: Object.freeze([
      bild("soleum-omega-2.webp", 500, 311, T("Soleum Meeresklimakabine OMEGA: runde weiße Kabine mit grün beleuchtetem Innenraum", "Soleum OMEGA cabin: round white cabin with green-lit interior", "Cabine Soleum OMEGA : cabine ronde blanche à l’intérieur éclairé en vert", "Cabina Soleum OMEGA: cabina rotonda bianca con interno illuminato di verde"), "https://www.soleum.de/soleum-meeresklimakabine-omega/"),
      bild("soleum-omega-1.webp", 697, 464, T("Soleum OMEGA mit blauem Licht in einem Gewölberaum", "Soleum OMEGA with blue light in a vaulted room", "Soleum OMEGA avec lumière bleue dans une salle voûtée", "Soleum OMEGA con luce blu in una sala a volta"), "https://www.soleum.de/soleum-meeresklimakabine-omega/"),
    ]),
    herstellerUrl: "https://www.soleum.de/soleum-meeresklimakabine-omega/",
    quellen: Object.freeze(["https://www.soleum.de/soleum-meeresklimakabine-omega/"]),
    stand: STAND,
  }),
]);
