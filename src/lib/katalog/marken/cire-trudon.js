// src/lib/katalog/marken/cire-trudon.js – Cire Trudon (Maison Trudon, Paris; Manufaktur in der Normandie)
// Ganzes Sortiment des offiziellen Trudon-Shops (Inhaber-Entscheidung Nr. 28), Stand 31.10.2026.
//
// Shop: Es gibt keinen eigenen Österreich-Shop. Für Österreich (Länderwahl „Austria“) führt
// trudon.com auf den EU-Shop (Sprachen eu_fr, eu_en, eu_de); Preise in EUR inkl. MwSt.
// Quelle der Preise und Fakten: deutschsprachige Ansicht des EU-Shops https://trudon.com/eu_de/
// (Produktseiten; Ersatzteile nur in der englischen Ansicht /eu_en/spare-parts.html).
// Produktliste: alle Kacheln der Shop-Kategorien Düfte für Zuhause (229), Dekoration (94),
// Geschenke (208), Neuheiten (31), Parfums & Duftseifen (45), Ersatzteile (4) –
// Vollständigkeits-Check: qa-screenshots/wellness/produkte/vollstaendigkeit-cire-trudon.md.
//
// Gruppierung: ein Eintrag je Produkt; Größen/Formate, die der Shop über seinen Größen-/
// Format-/Farbwähler verbindet, sind Varianten mit eigenem Preis (preis.varianten).
// Madeleines, Royale und die Stumpenkerzen (Farbvarianten desselben Produkts) sind je
// ein Eintrag. Maße, Gewicht (Wachsgewicht), Inhalt (ml) und Brenndauer stehen je
// Variante in den Merkmalen, bei Einzelprodukten in masse.
// Eaux de Parfum (Inhaber-Entscheidung Nr. 34 „Parfum JA, Körperpflege NEIN“): je Duft ein Eintrag
// (kategorie parfum) mit den Varianten 100 ml / 15 ml, die der Shop im Wähler „Fassungsvermögen“ verbindet;
// reine Parfum-Geschenkboxen (3 × 15 ml) wie alle Trudon-Geschenkboxen unter geschenkset.
// Nicht übernommen: Handseifen, Nachfüllpackungen, Handlotionen, Körperpflege-Sets und gemischte
// Parfum+Seife-Sets (Körperpflege laut Inhaber Nr. 34), Werbeaussagen und Geschichtstexte der
// Produktseiten (Kurztexte und Duftbeschreibungen sind eigene Formulierungen aus den
// belegten Duftnoten).
// Shop-Felder je Variante (preis.varianten): sku = Artikelnummer laut Shop (dataLayer der Produktseite),
// inhaltG = Wachsgewicht laut „Merkmale“/Größenangabe, inhaltMl = Fassungsvermögen; Versandgewicht und
// Versandmaße nennt der Shop nicht (nicht erfasst). zerbrechlich: true nur wo der Hersteller Glas/Keramik
// nennt – Duftkerzen im Glas („Das Glas … in der Toskana handgefertigt“), Raumsprays („große Glasflaschen“),
// Diffuser-Gefäße (Trudon-Glas; Nachfüllflaschen ohne Angabe → nicht gesetzt), La Promeneuse (Glas,
// Keramikschale), Glasglocke, Ersatzglas, Keramikschale. Einzelprodukte haben eine Variante (Größe/Einheit).
// Bilder (Motiv unverändert, Hersteller-CDN; einheitlich ≤ 1600 px lange Kante, WebP q82 (tools/images/optimize-katalog.mjs)): erstes Galeriebild der Produktseite (typ "freisteller"),
// bis zu zwei Stimmungsbilder derselben Seite (typ "ambiente"), Farbbilder je Ausführung; Quelle je Bild in docs/bildquellen/QUELLEN.md (Abschnitt „Katalog Cire Trudon“).

const deepFreeze = (o) => {
  if (o && typeof o === "object") {
    Object.values(o).forEach(deepFreeze);
    Object.freeze(o);
  }
  return o;
};

/** @type {import("../schema.js").KatalogMarke} */
export const MARKE = Object.freeze({
  slug: "cire-trudon",
  name: "Cire Trudon",
  welt: "accessoires",
  herstellerUrl: "https://trudon.com/eu_de/",
  // Händlersatz nur über den Claim-Guard (dealerStatement); hier nur der Schalter.
  dealer: true,
  stand: "2026-10-31",
  // Raumszenen (Ambiente-Bilder der Produktseiten), Produkte im Bild eindeutig zugeordnet
  looks: deepFreeze([
  {
    "id": "royale-auf-dem-tisch",
    "titel": {
      "de": "Royale-Spitzkerzen im fein dekorierten Kerzenständer",
      "en": "Royale taper candles in the finely decorated candlestick",
      "fr": "Chandelles Royale dans le bougeoir finement décoré",
      "it": "Candele Royale nel candeliere finemente decorato"
    },
    "bild": {
      "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-royale-2.webp",
      "width": 1200,
      "height": 1200,
      "alt": {
        "de": "Cire Trudon Royale-Spitzkerzen im fein dekorierten Kerzenständer – Stimmungsbild des Herstellers",
        "en": "Cire Trudon Royale taper candles in the finely decorated candlestick – mood image by the maker",
        "fr": "Chandelles Royale Cire Trudon dans le bougeoir finement décoré – image d’ambiance du fabricant",
        "it": "Candele Royale Cire Trudon nel candeliere finemente decorato – immagine d’ambiente del produttore"
      },
      "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/b/o/bougeoir_cisel_royales_6.jpg",
      "abgerufen": "2026-10-31",
      "typ": "ambiente"
    },
    "produkte": [
      "cire-trudon-royale",
      "cire-trudon-fein-dekorierter-kerzenstander"
    ]
  },
  {
    "id": "madeleines-und-royale",
    "titel": {
      "de": "Tafel mit Madeleines und Royale",
      "en": "A table set with Madeleines and Royale",
      "fr": "Table dressée avec Madeleines et Royale",
      "it": "Tavola con Madeleines e Royale"
    },
    "bild": {
      "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-madeleines-2.webp",
      "width": 1200,
      "height": 1200,
      "alt": {
        "de": "Cire Trudon Madeleines und Royale auf einer gedeckten Tafel – Stimmungsbild des Herstellers",
        "en": "Cire Trudon Madeleines and Royale on a laid table – mood image by the maker",
        "fr": "Madeleines et Royale Cire Trudon sur une table dressée – image d’ambiance du fabricant",
        "it": "Madeleines e Royale Cire Trudon su una tavola apparecchiata – immagine d’ambiente del produttore"
      },
      "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/l/i/lifestyle_mad-roy_31.jpg",
      "abgerufen": "2026-10-31",
      "typ": "ambiente"
    },
    "produkte": [
      "cire-trudon-madeleines",
      "cire-trudon-royale"
    ]
  },
  {
    "id": "la-promeneuse-im-regal",
    "titel": {
      "de": "La Promeneuse im Bücherregal",
      "en": "La Promeneuse on a bookshelf",
      "fr": "La Promeneuse dans la bibliothèque",
      "it": "La Promeneuse nella libreria"
    },
    "bild": {
      "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-la-promeneuse-2.webp",
      "width": 1200,
      "height": 1200,
      "alt": {
        "de": "Cire Trudon La Promeneuse in einem Bücherregal – Stimmungsbild des Herstellers",
        "en": "Cire Trudon La Promeneuse on a bookshelf – mood image by the maker",
        "fr": "La Promeneuse Cire Trudon dans une bibliothèque – image d’ambiance du fabricant",
        "it": "La Promeneuse Cire Trudon in una libreria – immagine d’ambiente del produttore"
      },
      "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_-_380th_anniversary_-_warning_mentionner_photo_retouch_e_9_.jpg",
      "abgerufen": "2026-10-31",
      "typ": "ambiente"
    },
    "produkte": [
      "cire-trudon-la-promeneuse"
    ]
  },
  {
    "id": "kerze-auf-bienen-sockel",
    "titel": {
      "de": "Duftkerze auf dem Bienen-Sockel",
      "en": "Scented candle on the bee stand",
      "fr": "Bougie parfumée sur le socle aux abeilles",
      "it": "Candela profumata sulla base con api"
    },
    "bild": {
      "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-bienen-sockel-2.webp",
      "width": 1200,
      "height": 1200,
      "alt": {
        "de": "Cire Trudon Bienen-Sockel mit Duftkerze – Stimmungsbild des Herstellers",
        "en": "Cire Trudon bee stand with a scented candle – mood image by the maker",
        "fr": "Socle aux abeilles Cire Trudon avec bougie parfumée – image d’ambiance du fabricant",
        "it": "Base con api Cire Trudon con candela profumata – immagine d’ambiente del produttore"
      },
      "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/s/e/serdar-couv6-1600x1600.jpg",
      "abgerufen": "2026-10-31",
      "typ": "ambiente"
    },
    "produkte": [
      "cire-trudon-bienen-sockel"
    ]
  },
  {
    "id": "unter-der-glasglocke",
    "titel": {
      "de": "Kerze unter der Glasglocke",
      "en": "Candle under the glass cloche",
      "fr": "Bougie sous la cloche",
      "it": "Candela sotto la campana di vetro"
    },
    "bild": {
      "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-glas-glocke-2.webp",
      "width": 640,
      "height": 640,
      "alt": {
        "de": "Cire Trudon Glasglocke über einer Kerze – Stimmungsbild des Herstellers",
        "en": "Cire Trudon glass cloche over a candle – mood image by the maker",
        "fr": "Cloche Cire Trudon sur une bougie – image d’ambiance du fabricant",
        "it": "Campana di vetro Cire Trudon su una candela – immagine d’ambiente del produttore"
      },
      "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_ecom_lacloche.jpg",
      "abgerufen": "2026-10-31",
      "typ": "ambiente"
    },
    "produkte": [
      "cire-trudon-glas-glocke"
    ]
  },
  {
    "id": "bueste-louis-xiv",
    "titel": {
      "de": "Büste Ludwigs XIV. im Raum",
      "en": "Bust of Louis XIV in a room",
      "fr": "Buste de Louis XIV dans un intérieur",
      "it": "Busto di Luigi XIV in un interno"
    },
    "bild": {
      "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-louis-xiv-3.webp",
      "width": 1200,
      "height": 1200,
      "alt": {
        "de": "Cire Trudon Büste Louis XIV in einem Wohnraum – Stimmungsbild des Herstellers",
        "en": "Cire Trudon Louis XIV bust in a living space – mood image by the maker",
        "fr": "Buste Louis XIV Cire Trudon dans un intérieur – image d’ambiance du fabricant",
        "it": "Busto Louis XIV Cire Trudon in un interno – immagine d’ambiente del produttore"
      },
      "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/l/o/louis_xiv-in-situ-1600x1600-_1.jpg",
      "abgerufen": "2026-10-31",
      "typ": "ambiente"
    },
    "produkte": [
      "cire-trudon-louis-xiv"
    ]
  }
]),
});

/** @type {import("../schema.js").KatalogProdukt[]} */
export const PRODUKTE = deepFreeze([
  {
    "slug": "cire-trudon-galerie-des-flammes-duftkerze",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "duftkerze",
    "name": "Die klassische Kerze - Galerie des flammes",
    "kurz": {
      "de": "Duftkerze „Galerie des flammes“ im Glas mit Trudon-Emblem, im Shop in 3 Größen geführt. Der Duft beginnt mit Zimt und Zypresse, entwickelt sich über Leder und Weihrauch und klingt mit Zedernholz und Patschuli aus.",
      "en": "Scented candle “Galerie des flammes” in a glass bearing the Trudon emblem, offered in 3 sizes. The scent opens with Cinnamon and Cypress, moves on to Leather and Frankincense and settles on Cedarwood and Patchouli.",
      "fr": "Bougie parfumée « Galerie des flammes » dans un verre orné de l’emblème Trudon, proposée en 3 tailles. Le parfum s’ouvre sur Cannelle et Cyprès, évolue vers Cuir et Encens et se pose sur Bois de cèdre et Patchouli.",
      "it": "Candela profumata “Galerie des flammes” in vetro con l’emblema Trudon, disponibile in 3 misure. Il profumo si apre con Cannella e Cipresso, prosegue con Cuoio e Incenso e si chiude con Legno di cedro e Patchouli."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Zimt, Zypresse, Rauchige Noten",
        "en": "Top notes: Cinnamon, Cypress, Smoky notes",
        "fr": "Notes de tête : Cannelle, Cyprès, Notes fumées",
        "it": "Note di testa: Cannella, Cipresso, Note affumicate"
      },
      {
        "de": "Herznoten: Leder, Weihrauch, Rose",
        "en": "Heart notes: Leather, Frankincense, Rose",
        "fr": "Notes de cœur : Cuir, Encens, Rose",
        "it": "Note di cuore: Cuoio, Incenso, Rosa"
      },
      {
        "de": "Basisnoten: Zedernholz, Patschuli, Sandelholz, Holzig-ambriert",
        "en": "Base notes: Cedarwood, Patchouli, Sandalwood, Ambery woods",
        "fr": "Notes de fond : Bois de cèdre, Patchouli, Bois de santal, Notes boisées ambrées",
        "it": "Note di fondo: Legno di cedro, Patchouli, Legno di sandalo, Note legnose ambrate"
      },
      {
        "de": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Brenndauer ca. 110–120 h",
        "en": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Burn time approx. 110–120 h",
        "fr": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Durée de combustion env. 110–120 h",
        "it": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Durata di combustione circa 110–120 h"
      },
      {
        "de": "Intermezzo 800 g: H 16 cm · Ø 13,5 cm · 800 g · Brenndauer ca. 110–120 h",
        "en": "Intermezzo 800 g: H 16 cm · Ø 13,5 cm · 800 g · Burn time approx. 110–120 h",
        "fr": "Intermezzo 800 g: H 16 cm · Ø 13,5 cm · 800 g · Durée de combustion env. 110–120 h",
        "it": "Intermezzo 800 g: H 16 cm · Ø 13,5 cm · 800 g · Durata di combustione circa 110–120 h"
      },
      {
        "de": "Great 2,8 kg: H 21,5 cm · Ø 18 cm · 2,8 kg · Brenndauer ca. 200 h",
        "en": "Great 2,8 kg: H 21,5 cm · Ø 18 cm · 2,8 kg · Burn time approx. 200 h",
        "fr": "Great 2,8 kg: H 21,5 cm · Ø 18 cm · 2,8 kg · Durée de combustion env. 200 h",
        "it": "Great 2,8 kg: H 21,5 cm · Ø 18 cm · 2,8 kg · Durata di combustione circa 200 h"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-galerie-des-flammes-duftkerze-1-opt.webp",
        "width": 724,
        "height": 905,
        "alt": {
          "de": "Cire Trudon Die klassische Kerze - Galerie des flammes – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Die klassische Kerze - Galerie des flammes – product view on a light background",
          "fr": "Cire Trudon Die klassische Kerze - Galerie des flammes – vue du produit sur fond clair",
          "it": "Cire Trudon Die klassische Kerze - Galerie des flammes – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_-_holiday_collection-270g_galerie_des_flammes-_1200x1200_beige.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-galerie-des-flammes-duftkerze-2.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon Die klassische Kerze - Galerie des flammes – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon Die klassische Kerze - Galerie des flammes – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon Die klassische Kerze - Galerie des flammes – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon Die klassische Kerze - Galerie des flammes – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_lanuitdesglaces_holidaycollection_05_1200x1200_2_2.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/galerie-des-flammes-klassische-kerze-270g.html",
    "quellen": [
      "https://trudon.com/eu_de/galerie-des-flammes-klassische-kerze-270g.html",
      "https://trudon.com/eu_de/galerie-des-flammes-intermezzo-kerze-800g.html",
      "https://trudon.com/eu_de/galerie-des-flammes-grosse-kerze-2800g.html"
    ],
    "stand": "2026-10-31",
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": "Classic 270 g",
          "betrag": 105,
          "sku": "TGDF04027003XS001",
          "inhaltG": 270,
          "zerbrechlich": true
        },
        {
          "name": "Intermezzo 800 g",
          "betrag": 275,
          "sku": "TGDF04080003XS001",
          "inhaltG": 800,
          "zerbrechlich": true
        },
        {
          "name": "Great 2,8 kg",
          "betrag": 590,
          "sku": "TGDF04280003XS001",
          "inhaltG": 2800,
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/galerie-des-flammes-klassische-kerze-270g.html"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Größe",
          "en": "Size",
          "fr": "Taille",
          "it": "Misura"
        },
        "optionen": [
          {
            "id": "classic-270-g",
            "name": "Classic 270 g",
            "code": "TGDF04027003XS001",
            "betrag": 105,
            "standard": true
          },
          {
            "id": "intermezzo-800-g",
            "name": "Intermezzo 800 g",
            "code": "TGDF04080003XS001",
            "betrag": 275
          },
          {
            "id": "great-2-8-kg",
            "name": "Great 2,8 kg",
            "code": "TGDF04280003XS001",
            "betrag": 590
          }
        ]
      }
    ],
    "zubehoer": [
      {
        "slug": "cire-trudon-deckel-classic",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-kerzenverzierung-in-bienenform",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-sockel-classic",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-glas-glocke"
      },
      {
        "slug": "cire-trudon-die-kerzenloscher"
      },
      {
        "slug": "cire-trudon-parfumierte-streichholzer-ernesto-kings-and-queens"
      }
    ]
  },
  {
    "slug": "cire-trudon-cabinet-des-miroirs-duftkerze",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "duftkerze",
    "name": "Die klassische Kerze - Cabinet des miroirs",
    "kurz": {
      "de": "Duftkerze „Cabinet des miroirs“ im Glas mit Trudon-Emblem, im Shop in 3 Größen geführt. Der Duft beginnt mit Zimt und Öllampe, entwickelt sich über Schwertlilien und Lavendel und klingt mit animalischem Akkord und Zedernholz aus.",
      "en": "Scented candle “Cabinet des miroirs” in a glass bearing the Trudon emblem, offered in 3 sizes. The scent opens with Cinnamon and Oil lamp, moves on to Iris and Lavender and settles on Animalic accord and Cedarwood.",
      "fr": "Bougie parfumée « Cabinet des miroirs » dans un verre orné de l’emblème Trudon, proposée en 3 tailles. Le parfum s’ouvre sur Cannelle et Lampe à huile, évolue vers Iris et Lavande et se pose sur Accord animal et Bois de cèdre.",
      "it": "Candela profumata “Cabinet des miroirs” in vetro con l’emblema Trudon, disponibile in 3 misure. Il profumo si apre con Cannella e Lampada a olio, prosegue con Iris e Lavanda e si chiude con Accordo animale e Legno di cedro."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Zimt, Öllampe, Eau de Cologne",
        "en": "Top notes: Cinnamon, Oil lamp, Eau de Cologne",
        "fr": "Notes de tête : Cannelle, Lampe à huile, Eau de Cologne",
        "it": "Note di testa: Cannella, Lampada a olio, Eau de Cologne"
      },
      {
        "de": "Herznoten: Schwertlilien, Lavendel, Violett",
        "en": "Heart notes: Iris, Lavender, Violet",
        "fr": "Notes de cœur : Iris, Lavande, Violette",
        "it": "Note di cuore: Iris, Lavanda, Violetta"
      },
      {
        "de": "Basisnoten: Animalischer Akkord, Zedernholz, Patschuli, Harz",
        "en": "Base notes: Animalic accord, Cedarwood, Patchouli, Resin",
        "fr": "Notes de fond : Accord animal, Bois de cèdre, Patchouli, Résine",
        "it": "Note di fondo: Accordo animale, Legno di cedro, Patchouli, Resina"
      },
      {
        "de": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Brenndauer ca. 50–55 h",
        "en": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Burn time approx. 50–55 h",
        "fr": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Durée de combustion env. 50–55 h",
        "it": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Durata di combustione circa 50–55 h"
      },
      {
        "de": "Intermezzo 800 g: H 16 cm · Ø 13,5 cm · 800 g · Brenndauer ca. 110–120 h",
        "en": "Intermezzo 800 g: H 16 cm · Ø 13,5 cm · 800 g · Burn time approx. 110–120 h",
        "fr": "Intermezzo 800 g: H 16 cm · Ø 13,5 cm · 800 g · Durée de combustion env. 110–120 h",
        "it": "Intermezzo 800 g: H 16 cm · Ø 13,5 cm · 800 g · Durata di combustione circa 110–120 h"
      },
      {
        "de": "Great 2,8 kg: H 21,5 cm · Ø 18 cm · 2,8 kg · Brenndauer ca. 200 h",
        "en": "Great 2,8 kg: H 21,5 cm · Ø 18 cm · 2,8 kg · Burn time approx. 200 h",
        "fr": "Great 2,8 kg: H 21,5 cm · Ø 18 cm · 2,8 kg · Durée de combustion env. 200 h",
        "it": "Great 2,8 kg: H 21,5 cm · Ø 18 cm · 2,8 kg · Durata di combustione circa 200 h"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-cabinet-des-miroirs-duftkerze-1-opt.webp",
        "width": 733,
        "height": 916,
        "alt": {
          "de": "Cire Trudon Die klassische Kerze - Cabinet des miroirs – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Die klassische Kerze - Cabinet des miroirs – product view on a light background",
          "fr": "Cire Trudon Die klassische Kerze - Cabinet des miroirs – vue du produit sur fond clair",
          "it": "Cire Trudon Die klassische Kerze - Cabinet des miroirs – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_-_holiday_collection-270g_cabinet_des_miroirs-_1200x1200_beige.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-cabinet-des-miroirs-duftkerze-2.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon Die klassische Kerze - Cabinet des miroirs – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon Die klassische Kerze - Cabinet des miroirs – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon Die klassische Kerze - Cabinet des miroirs – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon Die klassische Kerze - Cabinet des miroirs – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_lanuitdesglaces_holidaycollection_01_1200x1200.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-cabinet-des-miroirs-duftkerze-3.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon Die klassische Kerze - Cabinet des miroirs – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon Die klassische Kerze - Cabinet des miroirs – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon Die klassische Kerze - Cabinet des miroirs – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon Die klassische Kerze - Cabinet des miroirs – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_lanuitdesglaces_holidaycollection_08_1200x1200.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/cabinet-des-miroirs-klassische-kerze-270g.html",
    "quellen": [
      "https://trudon.com/eu_de/cabinet-des-miroirs-klassische-kerze-270g.html",
      "https://trudon.com/eu_de/cabinet-des-miroirs-intermezzo-kerze-800g.html",
      "https://trudon.com/eu_de/cabinet-des-miroirs-grosse-kerze-2800g.html"
    ],
    "stand": "2026-10-31",
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": "Classic 270 g",
          "betrag": 105,
          "sku": "TCDM04027003XS001",
          "inhaltG": 270,
          "zerbrechlich": true
        },
        {
          "name": "Intermezzo 800 g",
          "betrag": 275,
          "sku": "TCDM04080003XS001",
          "inhaltG": 800,
          "zerbrechlich": true
        },
        {
          "name": "Great 2,8 kg",
          "betrag": 590,
          "sku": "TCDM04280003XS001",
          "inhaltG": 2800,
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/cabinet-des-miroirs-klassische-kerze-270g.html"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Größe",
          "en": "Size",
          "fr": "Taille",
          "it": "Misura"
        },
        "optionen": [
          {
            "id": "classic-270-g",
            "name": "Classic 270 g",
            "code": "TCDM04027003XS001",
            "betrag": 105,
            "standard": true
          },
          {
            "id": "intermezzo-800-g",
            "name": "Intermezzo 800 g",
            "code": "TCDM04080003XS001",
            "betrag": 275
          },
          {
            "id": "great-2-8-kg",
            "name": "Great 2,8 kg",
            "code": "TCDM04280003XS001",
            "betrag": 590
          }
        ]
      }
    ],
    "zubehoer": [
      {
        "slug": "cire-trudon-deckel-classic",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-kerzenverzierung-in-bienenform",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-sockel-classic",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-glas-glocke"
      },
      {
        "slug": "cire-trudon-die-kerzenloscher"
      },
      {
        "slug": "cire-trudon-parfumierte-streichholzer-ernesto-kings-and-queens"
      }
    ]
  },
  {
    "slug": "cire-trudon-nazareth-duftkerze",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "duftkerze",
    "name": "Die klassische Kerze - Nazareth",
    "kurz": {
      "de": "Duftkerze „Nazareth“ im Glas mit Trudon-Emblem, im Shop in 3 Größen geführt. Der Duft beginnt mit Bitterorange und Ceylon-Zimt, entwickelt sich über Zimt und Kardamom und klingt mit Benzoeharz und Zistrose aus.",
      "en": "Scented candle “Nazareth” in a glass bearing the Trudon emblem, offered in 3 sizes. The scent opens with Bitter orange and Ceylon cinnamon, moves on to Cinnamon and Cardamom and settles on Benzoin and Cistus.",
      "fr": "Bougie parfumée « Nazareth » dans un verre orné de l’emblème Trudon, proposée en 3 tailles. Le parfum s’ouvre sur Orange amère et Cannelle de Ceylan, évolue vers Cannelle et Cardamome et se pose sur Benjoin et Ciste.",
      "it": "Candela profumata “Nazareth” in vetro con l’emblema Trudon, disponibile in 3 misure. Il profumo si apre con Arancia amara e Cannella di Ceylon, prosegue con Cannella e Cardamomo e si chiude con Benzoino e Cisto."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Bitterorange, Ceylon-Zimt, Mandarine, Grapefruit",
        "en": "Top notes: Bitter orange, Ceylon cinnamon, Mandarin, Grapefruit",
        "fr": "Notes de tête : Orange amère, Cannelle de Ceylan, Mandarine, Pamplemousse",
        "it": "Note di testa: Arancia amara, Cannella di Ceylon, Mandarino, Pompelmo"
      },
      {
        "de": "Herznoten: Zimt, Kardamom, Gewürznelke, Orange, Chinesische Duftblüten",
        "en": "Heart notes: Cinnamon, Cardamom, Clove, Orange, Chinese scented blossoms",
        "fr": "Notes de cœur : Cannelle, Cardamome, Clou de girofle, Orange, Fleurs parfumées de Chine",
        "it": "Note di cuore: Cannella, Cardamomo, Chiodo di garofano, Arancia, Fiori profumati cinesi"
      },
      {
        "de": "Basisnoten: Benzoeharz, Zistrose, Moschus, Myrrhe, Bourbon-Vanille",
        "en": "Base notes: Benzoin, Cistus, Musk, Myrrh, Bourbon vanilla",
        "fr": "Notes de fond : Benjoin, Ciste, Musc, Myrrhe, Vanille Bourbon",
        "it": "Note di fondo: Benzoino, Cisto, Musk, Mirra, Vaniglia Bourbon"
      },
      {
        "de": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Brenndauer ca. 50–55 h",
        "en": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Burn time approx. 50–55 h",
        "fr": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Durée de combustion env. 50–55 h",
        "it": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Durata di combustione circa 50–55 h"
      },
      {
        "de": "Intermezzo 800 g: H 16 cm · Ø 13,5 cm · 800 g · Brenndauer ca. 110–120 h",
        "en": "Intermezzo 800 g: H 16 cm · Ø 13,5 cm · 800 g · Burn time approx. 110–120 h",
        "fr": "Intermezzo 800 g: H 16 cm · Ø 13,5 cm · 800 g · Durée de combustion env. 110–120 h",
        "it": "Intermezzo 800 g: H 16 cm · Ø 13,5 cm · 800 g · Durata di combustione circa 110–120 h"
      },
      {
        "de": "Great 2,8 kg: H 21,5 cm · Ø 18 cm · 2,8 kg · Brenndauer ca. 200 h",
        "en": "Great 2,8 kg: H 21,5 cm · Ø 18 cm · 2,8 kg · Burn time approx. 200 h",
        "fr": "Great 2,8 kg: H 21,5 cm · Ø 18 cm · 2,8 kg · Durée de combustion env. 200 h",
        "it": "Great 2,8 kg: H 21,5 cm · Ø 18 cm · 2,8 kg · Durata di combustione circa 200 h"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-nazareth-duftkerze-1-opt.webp",
        "width": 736,
        "height": 920,
        "alt": {
          "de": "Cire Trudon Die klassische Kerze - Nazareth – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Die klassische Kerze - Nazareth – product view on a light background",
          "fr": "Cire Trudon Die klassische Kerze - Nazareth – vue du produit sur fond clair",
          "it": "Cire Trudon Die klassische Kerze - Nazareth – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_-_holiday_collection-270g_nazareth-_1200x1200_beige.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-nazareth-duftkerze-2.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon Die klassische Kerze - Nazareth – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon Die klassische Kerze - Nazareth – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon Die klassische Kerze - Nazareth – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon Die klassische Kerze - Nazareth – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_lanuitdesglaces_holidaycollection_09_1200x1200_2.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-nazareth-duftkerze-3.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon Die klassische Kerze - Nazareth – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon Die klassische Kerze - Nazareth – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon Die klassische Kerze - Nazareth – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon Die klassische Kerze - Nazareth – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_lanuitdesglaces_holidaycollection_05_1200x1200_2_1.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/nazareth-kerze-klassische-270g.html",
    "quellen": [
      "https://trudon.com/eu_de/nazareth-kerze-klassische-270g.html",
      "https://trudon.com/eu_de/nazareth-kerze-intermezzo-800g.html",
      "https://trudon.com/eu_de/nazareth-kerze-grosse-2800g.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-nazareth-madeleines"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": "Classic 270 g",
          "betrag": 105,
          "sku": "TNAZ04027003XS002",
          "inhaltG": 270,
          "zerbrechlich": true
        },
        {
          "name": "Intermezzo 800 g",
          "betrag": 275,
          "sku": "TNAZ04080003XS002",
          "inhaltG": 800,
          "zerbrechlich": true
        },
        {
          "name": "Great 2,8 kg",
          "betrag": 590,
          "sku": "TNAZ04280003XS002",
          "inhaltG": 2800,
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/nazareth-kerze-klassische-270g.html"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Größe",
          "en": "Size",
          "fr": "Taille",
          "it": "Misura"
        },
        "optionen": [
          {
            "id": "classic-270-g",
            "name": "Classic 270 g",
            "code": "TNAZ04027003XS002",
            "betrag": 105,
            "standard": true
          },
          {
            "id": "intermezzo-800-g",
            "name": "Intermezzo 800 g",
            "code": "TNAZ04080003XS002",
            "betrag": 275
          },
          {
            "id": "great-2-8-kg",
            "name": "Great 2,8 kg",
            "code": "TNAZ04280003XS002",
            "betrag": 590
          }
        ]
      }
    ],
    "zubehoer": [
      {
        "slug": "cire-trudon-deckel-classic",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-kerzenverzierung-in-bienenform",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-sockel-classic",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-glas-glocke"
      },
      {
        "slug": "cire-trudon-die-kerzenloscher"
      },
      {
        "slug": "cire-trudon-parfumierte-streichholzer-ernesto-kings-and-queens"
      }
    ]
  },
  {
    "slug": "cire-trudon-fir-duftkerze",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "duftkerze",
    "name": "Die klassische Kerze - Fir",
    "kurz": {
      "de": "Duftkerze „Fir“ im Glas mit Trudon-Emblem, im Shop in 3 Größen geführt. Der Duft beginnt mit Leder und sibirischer Kiefer, entwickelt sich über Guajakholz und Chinazeder und klingt mit spanischer Zistrose und absolutem Weihrauch aus.",
      "en": "Scented candle “Fir” in a glass bearing the Trudon emblem, offered in 3 sizes. The scent opens with Leather and Siberian pine, moves on to Guaiac wood and Chinese cedar and settles on Spanish cistus and Frankincense absolute.",
      "fr": "Bougie parfumée « Fir » dans un verre orné de l’emblème Trudon, proposée en 3 tailles. Le parfum s’ouvre sur Cuir et Pin de Sibérie, évolue vers Bois de gaïac et Cèdre de Chine et se pose sur Ciste d’Espagne et Absolu d’encens.",
      "it": "Candela profumata “Fir” in vetro con l’emblema Trudon, disponibile in 3 misure. Il profumo si apre con Cuoio e Pino siberiano, prosegue con Legno di guaiaco e Cedro cinese e si chiude con Cisto spagnolo e Assoluta di incenso."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Leder, sibirische Kiefer, Tanne",
        "en": "Top notes: Leather, Siberian pine, Fir",
        "fr": "Notes de tête : Cuir, Pin de Sibérie, Sapin",
        "it": "Note di testa: Cuoio, Pino siberiano, Abete"
      },
      {
        "de": "Herznoten: Guajakholz, Chinazeder, Myrrhe",
        "en": "Heart notes: Guaiac wood, Chinese cedar, Myrrh",
        "fr": "Notes de cœur : Bois de gaïac, Cèdre de Chine, Myrrhe",
        "it": "Note di cuore: Legno di guaiaco, Cedro cinese, Mirra"
      },
      {
        "de": "Basisnoten: Spanische Zistrose, Absoluter Weihrauch, Patschuli",
        "en": "Base notes: Spanish cistus, Frankincense absolute, Patchouli",
        "fr": "Notes de fond : Ciste d’Espagne, Absolu d’encens, Patchouli",
        "it": "Note di fondo: Cisto spagnolo, Assoluta di incenso, Patchouli"
      },
      {
        "de": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Brenndauer ca. 50–55 h",
        "en": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Burn time approx. 50–55 h",
        "fr": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Durée de combustion env. 50–55 h",
        "it": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Durata di combustione circa 50–55 h"
      },
      {
        "de": "Intermezzo 800 g: H 16 cm · Ø 13,5 cm · 800 g · Brenndauer ca. 110–120 h",
        "en": "Intermezzo 800 g: H 16 cm · Ø 13,5 cm · 800 g · Burn time approx. 110–120 h",
        "fr": "Intermezzo 800 g: H 16 cm · Ø 13,5 cm · 800 g · Durée de combustion env. 110–120 h",
        "it": "Intermezzo 800 g: H 16 cm · Ø 13,5 cm · 800 g · Durata di combustione circa 110–120 h"
      },
      {
        "de": "Great 2,8 kg: H 21,5 cm · Ø 18 cm · 2,8 kg · Brenndauer ca. 200 h",
        "en": "Great 2,8 kg: H 21,5 cm · Ø 18 cm · 2,8 kg · Burn time approx. 200 h",
        "fr": "Great 2,8 kg: H 21,5 cm · Ø 18 cm · 2,8 kg · Durée de combustion env. 200 h",
        "it": "Great 2,8 kg: H 21,5 cm · Ø 18 cm · 2,8 kg · Durata di combustione circa 200 h"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-fir-duftkerze-1-opt.webp",
        "width": 735,
        "height": 919,
        "alt": {
          "de": "Cire Trudon Die klassische Kerze - Fir – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Die klassische Kerze - Fir – product view on a light background",
          "fr": "Cire Trudon Die klassische Kerze - Fir – vue du produit sur fond clair",
          "it": "Cire Trudon Die klassische Kerze - Fir – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_-_holiday_collection-270g_fir-_1200x1200_beige.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-fir-duftkerze-2.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon Die klassische Kerze - Fir – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon Die klassische Kerze - Fir – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon Die klassische Kerze - Fir – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon Die klassische Kerze - Fir – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_lanuitdesglaces_holidaycollection_04_1200x1200_1_2.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-fir-duftkerze-3.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon Die klassische Kerze - Fir – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon Die klassische Kerze - Fir – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon Die klassische Kerze - Fir – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon Die klassische Kerze - Fir – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_lanuitdesglaces_holidaycollection_05_1200x1200_2.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/fir-classic-candle-270g.html",
    "quellen": [
      "https://trudon.com/eu_de/fir-classic-candle-270g.html",
      "https://trudon.com/eu_de/fir-intermezzo-kerze-800g.html",
      "https://trudon.com/eu_de/fir-grosse-kerzen-2800g.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-fir-madeleines",
      "cire-trudon-fir-kameen"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": "Classic 270 g",
          "betrag": 105,
          "sku": "TFIR04027003XS005",
          "inhaltG": 270,
          "zerbrechlich": true
        },
        {
          "name": "Intermezzo 800 g",
          "betrag": 275,
          "sku": "TFIR04080003XS004",
          "inhaltG": 800,
          "zerbrechlich": true
        },
        {
          "name": "Great 2,8 kg",
          "betrag": 590,
          "sku": "TFIR04280003XS004",
          "inhaltG": 2800,
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/fir-classic-candle-270g.html"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Größe",
          "en": "Size",
          "fr": "Taille",
          "it": "Misura"
        },
        "optionen": [
          {
            "id": "classic-270-g",
            "name": "Classic 270 g",
            "code": "TFIR04027003XS005",
            "betrag": 105,
            "standard": true
          },
          {
            "id": "intermezzo-800-g",
            "name": "Intermezzo 800 g",
            "code": "TFIR04080003XS004",
            "betrag": 275
          },
          {
            "id": "great-2-8-kg",
            "name": "Great 2,8 kg",
            "code": "TFIR04280003XS004",
            "betrag": 590
          }
        ]
      }
    ],
    "zubehoer": [
      {
        "slug": "cire-trudon-deckel-classic",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-kerzenverzierung-in-bienenform",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-sockel-classic",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-glas-glocke"
      },
      {
        "slug": "cire-trudon-die-kerzenloscher"
      },
      {
        "slug": "cire-trudon-parfumierte-streichholzer-ernesto-kings-and-queens"
      }
    ]
  },
  {
    "slug": "cire-trudon-la-promeneuse",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "diffuser",
    "name": "La Promeneuse",
    "kurz": {
      "de": "Dekorativer Duftzerstreuer: Eine Wachs-Kamee liegt in einer Keramikschale und schmilzt über einem Teelicht, dabei verteilt sie ihren Duft im Raum.",
      "en": "Decorative scent diffuser: a wax cameo sits in a ceramic dish and melts over a tealight, releasing its scent into the room.",
      "fr": "Diffuseur de parfum décoratif : un camée de cire posé dans une coupelle en céramique fond au-dessus d’une veilleuse et diffuse son parfum.",
      "it": "Diffusore di profumo decorativo: un cammeo di cera in una coppetta di ceramica si scioglie sopra un lumino e diffonde il profumo nell’ambiente."
    },
    "merkmale": [
      {
        "de": "Geriffeltes, handgefertigtes Glas und Messing in Altgold",
        "en": "Fluted handmade glass and antique-gold brass",
        "fr": "Verre cannelé fait main et laiton or vieilli",
        "it": "Vetro scanalato fatto a mano e ottone oro anticato"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "29 cm"
      },
      {
        "key": "durchmesser",
        "wert": "10,5 cm"
      }
    ],
    "designer": "Pauline Deltour",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-la-promeneuse-1.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon La Promeneuse – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon La Promeneuse – product view on a light background",
          "fr": "Cire Trudon La Promeneuse – vue du produit sur fond clair",
          "it": "Cire Trudon La Promeneuse – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/p/r/promeneuse-vert-beige-hd.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-la-promeneuse-2.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon La Promeneuse – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon La Promeneuse – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon La Promeneuse – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon La Promeneuse – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_-_380th_anniversary_-_warning_mentionner_photo_retouch_e_9_.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-la-promeneuse-3.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon La Promeneuse – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon La Promeneuse – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon La Promeneuse – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon La Promeneuse – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/p/r/produit-1600x160002.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/la-promeneuse.html",
    "quellen": [
      "https://trudon.com/eu_de/la-promeneuse.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-das-nachtlicht",
      "cire-trudon-cire-kameen",
      "cire-trudon-ernesto-kameen"
    ],
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/la-promeneuse.html",
      "varianten": [
        {
          "name": {
            "de": "Einheitsgröße",
            "en": "One size",
            "fr": "Taille unique",
            "it": "Taglia unica"
          },
          "betrag": 320,
          "sku": "PROM/COF/15/TRU",
          "zerbrechlich": true
        }
      ]
    },
    "zubehoer": [
      {
        "slug": "cire-trudon-das-nachtlicht"
      },
      {
        "slug": "cire-trudon-la-promeneuse-spare-glass"
      },
      {
        "slug": "cire-trudon-ceramic-top-for-la-promeneuse"
      },
      {
        "slug": "cire-trudon-la-promeneuse-spare-brass-spoon"
      }
    ]
  },
  {
    "slug": "cire-trudon-maison-de-plaisirs-duftkerze",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "duftkerze",
    "name": "Die klassische Kerze Maison de Plaisirs",
    "kurz": {
      "de": "Duftkerze „Maison de Plaisirs“ im Glas mit Trudon-Emblem. Der Duft beginnt mit rosa Pfeffer und ätherischem Öl aus schwarzem Pfeffer, entwickelt sich über Kaschmirholz und Schwertlilien und klingt mit Zedernholz und Guajak-Holz aus.",
      "en": "Scented candle “Maison de Plaisirs” in a glass bearing the Trudon emblem. The scent opens with Pink pepper and Black pepper essential oil, moves on to Cashmere wood and Iris and settles on Cedarwood and Guaiac wood.",
      "fr": "Bougie parfumée « Maison de Plaisirs » dans un verre orné de l’emblème Trudon. Le parfum s’ouvre sur Baies roses et Huile essentielle de poivre noir, évolue vers Bois de cachemire et Iris et se pose sur Bois de cèdre et Bois de gaïac.",
      "it": "Candela profumata “Maison de Plaisirs” in vetro con l’emblema Trudon. Il profumo si apre con Pepe rosa e Olio essenziale di pepe nero, prosegue con Legno di cashmere e Iris e si chiude con Legno di cedro e Legno di guaiaco."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Rosa Pfeffer, Ätherisches Öl aus schwarzem Pfeffer, Ambrette",
        "en": "Top notes: Pink pepper, Black pepper essential oil, Ambrette",
        "fr": "Notes de tête : Baies roses, Huile essentielle de poivre noir, Ambrette",
        "it": "Note di testa: Pepe rosa, Olio essenziale di pepe nero, Ambretta"
      },
      {
        "de": "Herznoten: Kaschmirholz, Schwertlilien, Lederakzente",
        "en": "Heart notes: Cashmere wood, Iris, Leather accents",
        "fr": "Notes de cœur : Bois de cachemire, Iris, Accents cuirés",
        "it": "Note di cuore: Legno di cashmere, Iris, Accenti di cuoio"
      },
      {
        "de": "Basisnoten: Zedernholz, Guajak-Holz, Sublimolid",
        "en": "Base notes: Cedarwood, Guaiac wood, Sublimolide",
        "fr": "Notes de fond : Bois de cèdre, Bois de gaïac, Sublimolide",
        "it": "Note di fondo: Legno di cedro, Legno di guaiaco, Sublimolide"
      },
      {
        "de": "Brenndauer ca. 50–55 h",
        "en": "Burn time approx. 50–55 h",
        "fr": "Durée de combustion env. 50–55 h",
        "it": "Durata di combustione circa 50–55 h"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "10,5 cm"
      },
      {
        "key": "durchmesser",
        "wert": "9 cm"
      },
      {
        "key": "gewicht",
        "wert": "270 g"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-maison-de-plaisirs-duftkerze-1-opt.webp",
        "width": 640,
        "height": 800,
        "alt": {
          "de": "Cire Trudon Die klassische Kerze Maison de Plaisirs – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Die klassische Kerze Maison de Plaisirs – product view on a light background",
          "fr": "Cire Trudon Die klassische Kerze Maison de Plaisirs – vue du produit sur fond clair",
          "it": "Cire Trudon Die klassische Kerze Maison de Plaisirs – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_lap_rouse_classic_candle_1200x1200_beige.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-maison-de-plaisirs-duftkerze-2.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon Die klassische Kerze Maison de Plaisirs – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon Die klassische Kerze Maison de Plaisirs – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon Die klassische Kerze Maison de Plaisirs – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon Die klassische Kerze Maison de Plaisirs – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_x_laperouse_-168_1200x1200.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-maison-de-plaisirs-duftkerze-3.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon Die klassische Kerze Maison de Plaisirs – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon Die klassische Kerze Maison de Plaisirs – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon Die klassische Kerze Maison de Plaisirs – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon Die klassische Kerze Maison de Plaisirs – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_x_laperouse_-219_1200x1200.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/laperouse-maison-de-plaisirs-classic-candle-270g.html",
    "quellen": [
      "https://trudon.com/eu_de/laperouse-maison-de-plaisirs-classic-candle-270g.html"
    ],
    "stand": "2026-10-31",
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/laperouse-maison-de-plaisirs-classic-candle-270g.html",
      "varianten": [
        {
          "name": "270 g",
          "betrag": 120,
          "sku": "TMDP05027003XS001",
          "inhaltG": 270,
          "zerbrechlich": true
        }
      ]
    },
    "zubehoer": [
      {
        "slug": "cire-trudon-deckel-classic",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-kerzenverzierung-in-bienenform",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-sockel-classic",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-glas-glocke"
      },
      {
        "slug": "cire-trudon-die-kerzenloscher"
      },
      {
        "slug": "cire-trudon-parfumierte-streichholzer-ernesto-kings-and-queens"
      }
    ]
  },
  {
    "slug": "cire-trudon-altair-duftkerze",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "duftkerze",
    "name": "The Classic Candle - Altaïr",
    "kurz": {
      "de": "Duftkerze „Altaïr“ im Glas mit Trudon-Emblem, im Shop in 4 Größen geführt. Der Duft beginnt mit Himbeere und Pfingstrosen, entwickelt sich über Agarholz und Sandelholz und klingt mit Zedernholz und Leder aus.",
      "en": "Scented candle “Altaïr” in a glass bearing the Trudon emblem, offered in 4 sizes. The scent opens with Raspberry and Peony, moves on to Agarwood and Sandalwood and settles on Cedarwood and Leather.",
      "fr": "Bougie parfumée « Altaïr » dans un verre orné de l’emblème Trudon, proposée en 4 tailles. Le parfum s’ouvre sur Framboise et Pivoine, évolue vers Bois d’agar et Bois de santal et se pose sur Bois de cèdre et Cuir.",
      "it": "Candela profumata “Altaïr” in vetro con l’emblema Trudon, disponibile in 4 misure. Il profumo si apre con Lampone e Peonia, prosegue con Legno di agar e Legno di sandalo e si chiude con Legno di cedro e Cuoio."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Himbeere, Pfingstrosen",
        "en": "Top notes: Raspberry, Peony",
        "fr": "Notes de tête : Framboise, Pivoine",
        "it": "Note di testa: Lampone, Peonia"
      },
      {
        "de": "Herznoten: Agarholz, Sandelholz, Rose",
        "en": "Heart notes: Agarwood, Sandalwood, Rose",
        "fr": "Notes de cœur : Bois d’agar, Bois de santal, Rose",
        "it": "Note di cuore: Legno di agar, Legno di sandalo, Rosa"
      },
      {
        "de": "Basisnoten: Zedernholz, Leder",
        "en": "Base notes: Cedarwood, Leather",
        "fr": "Notes de fond : Bois de cèdre, Cuir",
        "it": "Note di fondo: Legno di cedro, Cuoio"
      },
      {
        "de": "Small 70 g: H 6,5 cm · Ø 5,5 cm · 70 g · Brenndauer ca. 18–20 h",
        "en": "Small 70 g: H 6,5 cm · Ø 5,5 cm · 70 g · Burn time approx. 18–20 h",
        "fr": "Small 70 g: H 6,5 cm · Ø 5,5 cm · 70 g · Durée de combustion env. 18–20 h",
        "it": "Small 70 g: H 6,5 cm · Ø 5,5 cm · 70 g · Durata di combustione circa 18–20 h"
      },
      {
        "de": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Brenndauer ca. 50–55 h",
        "en": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Burn time approx. 50–55 h",
        "fr": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Durée de combustion env. 50–55 h",
        "it": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Durata di combustione circa 50–55 h"
      },
      {
        "de": "Intermezzo 800 g: H 16 cm · Ø 13,5 cm · 800 g · Brenndauer ca. 110–120 h",
        "en": "Intermezzo 800 g: H 16 cm · Ø 13,5 cm · 800 g · Burn time approx. 110–120 h",
        "fr": "Intermezzo 800 g: H 16 cm · Ø 13,5 cm · 800 g · Durée de combustion env. 110–120 h",
        "it": "Intermezzo 800 g: H 16 cm · Ø 13,5 cm · 800 g · Durata di combustione circa 110–120 h"
      },
      {
        "de": "Great 2,8 kg: H 21,5 cm · Ø 18 cm · 2,8 kg · Brenndauer ca. 200 h",
        "en": "Great 2,8 kg: H 21,5 cm · Ø 18 cm · 2,8 kg · Burn time approx. 200 h",
        "fr": "Great 2,8 kg: H 21,5 cm · Ø 18 cm · 2,8 kg · Durée de combustion env. 200 h",
        "it": "Great 2,8 kg: H 21,5 cm · Ø 18 cm · 2,8 kg · Durata di combustione circa 200 h"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-altair-duftkerze-1-opt.webp",
        "width": 734,
        "height": 918,
        "alt": {
          "de": "Cire Trudon The Classic Candle - Altaïr – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon The Classic Candle - Altaïr – product view on a light background",
          "fr": "Cire Trudon The Classic Candle - Altaïr – vue du produit sur fond clair",
          "it": "Cire Trudon The Classic Candle - Altaïr – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_ocre_classic_candle_1200x1200_beige.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-altair-duftkerze-2.webp",
        "width": 640,
        "height": 640,
        "alt": {
          "de": "Cire Trudon The Classic Candle - Altaïr – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon The Classic Candle - Altaïr – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon The Classic Candle - Altaïr – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon The Classic Candle - Altaïr – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/n/r/nr_trudon_hd_8_640x640_1.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-altair-duftkerze-3.webp",
        "width": 640,
        "height": 640,
        "alt": {
          "de": "Cire Trudon The Classic Candle - Altaïr – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon The Classic Candle - Altaïr – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon The Classic Candle - Altaïr – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon The Classic Candle - Altaïr – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/n/r/nr_trudon_hd_9_640x640_1.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/altair-klassische-kerze-270g.html",
    "quellen": [
      "https://trudon.com/eu_de/altair-kleine-kerze-70g.html",
      "https://trudon.com/eu_de/altair-klassische-kerze-270g.html",
      "https://trudon.com/eu_de/altair-intermezzo-kerze-800g.html",
      "https://trudon.com/eu_de/altair-grosse-kerze-2800g.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-altair-raumspray",
      "cire-trudon-altair-diffuser"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": "Small 70 g",
          "betrag": 40,
          "sku": "TALT00007003XS001",
          "inhaltG": 70,
          "zerbrechlich": true
        },
        {
          "name": "Classic 270 g",
          "betrag": 95,
          "sku": "TALT00027003XS001",
          "inhaltG": 270,
          "zerbrechlich": true
        },
        {
          "name": "Intermezzo 800 g",
          "betrag": 240,
          "sku": "TALT00080003XS001",
          "inhaltG": 800,
          "zerbrechlich": true
        },
        {
          "name": "Great 2,8 kg",
          "betrag": 500,
          "sku": "TALT00280003XS001",
          "inhaltG": 2800,
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/altair-klassische-kerze-270g.html"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Größe",
          "en": "Size",
          "fr": "Taille",
          "it": "Misura"
        },
        "optionen": [
          {
            "id": "small-70-g",
            "name": "Small 70 g",
            "code": "TALT00007003XS001",
            "betrag": 40
          },
          {
            "id": "classic-270-g",
            "name": "Classic 270 g",
            "code": "TALT00027003XS001",
            "betrag": 95,
            "standard": true
          },
          {
            "id": "intermezzo-800-g",
            "name": "Intermezzo 800 g",
            "code": "TALT00080003XS001",
            "betrag": 240
          },
          {
            "id": "great-2-8-kg",
            "name": "Great 2,8 kg",
            "code": "TALT00280003XS001",
            "betrag": 500
          }
        ]
      }
    ],
    "zubehoer": [
      {
        "slug": "cire-trudon-deckel-classic",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-kerzenverzierung-in-bienenform",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-sockel-classic",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-glas-glocke"
      },
      {
        "slug": "cire-trudon-die-kerzenloscher"
      },
      {
        "slug": "cire-trudon-parfumierte-streichholzer-ernesto-kings-and-queens"
      }
    ]
  },
  {
    "slug": "cire-trudon-altair-raumspray",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "raumduft",
    "name": "The Room Spray Altaïr",
    "kurz": {
      "de": "Raumspray „Altaïr“ in einer Glasflasche. Der Duft beginnt mit Himbeere und Pfingstrosen, entwickelt sich über Agarholz und Sandelholz und klingt mit Zedernholz und Leder aus.",
      "en": "Room spray “Altaïr” in a glass bottle. The scent opens with Raspberry and Peony, moves on to Agarwood and Sandalwood and settles on Cedarwood and Leather.",
      "fr": "Spray d’intérieur « Altaïr » en flacon de verre. Le parfum s’ouvre sur Framboise et Pivoine, évolue vers Bois d’agar et Bois de santal et se pose sur Bois de cèdre et Cuir.",
      "it": "Spray per ambienti “Altaïr” in flacone di vetro. Il profumo si apre con Lampone e Peonia, prosegue con Legno di agar e Legno di sandalo e si chiude con Legno di cedro e Cuoio."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Himbeere, Pfingstrosen",
        "en": "Top notes: Raspberry, Peony",
        "fr": "Notes de tête : Framboise, Pivoine",
        "it": "Note di testa: Lampone, Peonia"
      },
      {
        "de": "Herznoten: Agarholz, Sandelholz, Rose",
        "en": "Heart notes: Agarwood, Sandalwood, Rose",
        "fr": "Notes de cœur : Bois d’agar, Bois de santal, Rose",
        "it": "Note di cuore: Legno di agar, Legno di sandalo, Rosa"
      },
      {
        "de": "Basisnoten: Zedernholz, Leder",
        "en": "Base notes: Cedarwood, Leather",
        "fr": "Notes de fond : Bois de cèdre, Cuir",
        "it": "Note di fondo: Legno di cedro, Cuoio"
      },
      {
        "de": "Inhalt 375 ml",
        "en": "Contents 375 ml",
        "fr": "Contenance 375 ml",
        "it": "Contenuto 375 ml"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "18 cm"
      },
      {
        "key": "durchmesser",
        "wert": "7 cm"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-altair-raumspray-1-opt.webp",
        "width": 640,
        "height": 800,
        "alt": {
          "de": "Cire Trudon The Room Spray Altaïr – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon The Room Spray Altaïr – product view on a light background",
          "fr": "Cire Trudon The Room Spray Altaïr – vue du produit sur fond clair",
          "it": "Cire Trudon The Room Spray Altaïr – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_ocre_375ml_roomspray_640x640_grey.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-altair-raumspray-2.webp",
        "width": 640,
        "height": 640,
        "alt": {
          "de": "Cire Trudon The Room Spray Altaïr – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon The Room Spray Altaïr – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon The Room Spray Altaïr – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon The Room Spray Altaïr – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/n/r/nr_trudon_hd_8_640x640_1_3.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-altair-raumspray-3.webp",
        "width": 640,
        "height": 640,
        "alt": {
          "de": "Cire Trudon The Room Spray Altaïr – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon The Room Spray Altaïr – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon The Room Spray Altaïr – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon The Room Spray Altaïr – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/n/r/nr_trudon_hd_3_640x640.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/spray-375-ml-altair.html",
    "quellen": [
      "https://trudon.com/eu_de/spray-375-ml-altair.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-altair-duftkerze",
      "cire-trudon-altair-diffuser"
    ],
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/spray-375-ml-altair.html",
      "varianten": [
        {
          "name": "375 ml",
          "betrag": 195,
          "sku": "TALT00037526XS001",
          "inhaltMl": 375,
          "zerbrechlich": true
        }
      ]
    },
    "zubehoer": [
      {
        "slug": "cire-trudon-raumspray-pumpe",
        "hinweis": {
          "de": "Ersatzpumpe",
          "en": "Replacement pump",
          "fr": "Pompe de rechange",
          "it": "Pompa di ricambio"
        }
      },
      {
        "slug": "cire-trudon-sockel-classic"
      }
    ]
  },
  {
    "slug": "cire-trudon-figuerie-duftkerze",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "duftkerze",
    "name": "The Classic Candle - Figuerie",
    "kurz": {
      "de": "Duftkerze „Figuerie“ im Glas mit Trudon-Emblem, im Shop in 4 Größen geführt. Der Duft beginnt mit Zedernblatt und Feigenblätter, entwickelt sich über Hyazinthe und Kopaivabalsam und klingt mit Sandalwood und Tonkabohnen aus.",
      "en": "Scented candle “Figuerie” in a glass bearing the Trudon emblem, offered in 4 sizes. The scent opens with Cedar leaf and Fig leaves, moves on to Hyacinth and Copaiba balsam and settles on Sandalwood and Tonka bean.",
      "fr": "Bougie parfumée « Figuerie » dans un verre orné de l’emblème Trudon, proposée en 4 tailles. Le parfum s’ouvre sur Feuille de cèdre et Feuilles de figuier, évolue vers Jacinthe et Baume de copahu et se pose sur Bois de santal et Fève tonka.",
      "it": "Candela profumata “Figuerie” in vetro con l’emblema Trudon, disponibile in 4 misure. Il profumo si apre con Foglia di cedro e Foglie di fico, prosegue con Giacinto e Balsamo di copaiba e si chiude con Legno di sandalo e Fava tonka."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Zedernblatt, Feigenblätter, Ätherischer Humus",
        "en": "Top notes: Cedar leaf, Fig leaves, Earthy humus",
        "fr": "Notes de tête : Feuille de cèdre, Feuilles de figuier, Humus",
        "it": "Note di testa: Foglia di cedro, Foglie di fico, Humus"
      },
      {
        "de": "Herznoten: Hyazinthe, Kopaivabalsam, Grünes Bouquet",
        "en": "Heart notes: Hyacinth, Copaiba balsam, Green bouquet",
        "fr": "Notes de cœur : Jacinthe, Baume de copahu, Bouquet vert",
        "it": "Note di cuore: Giacinto, Balsamo di copaiba, Bouquet verde"
      },
      {
        "de": "Basisnoten: Sandalwood, Tonkabohnen, Tasuki Patchouli, Moos-Kristalle",
        "en": "Base notes: Sandalwood, Tonka bean, Tasuki patchouli, Moss crystals",
        "fr": "Notes de fond : Bois de santal, Fève tonka, Patchouli Tasuki, Cristaux de mousse",
        "it": "Note di fondo: Legno di sandalo, Fava tonka, Patchouli Tasuki, Cristalli di muschio"
      },
      {
        "de": "Small 70 g: H 6,5 cm · Ø 5,5 cm · 70 g · Brenndauer ca. 18–20 h",
        "en": "Small 70 g: H 6,5 cm · Ø 5,5 cm · 70 g · Burn time approx. 18–20 h",
        "fr": "Small 70 g: H 6,5 cm · Ø 5,5 cm · 70 g · Durée de combustion env. 18–20 h",
        "it": "Small 70 g: H 6,5 cm · Ø 5,5 cm · 70 g · Durata di combustione circa 18–20 h"
      },
      {
        "de": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Brenndauer ca. 50–55 h",
        "en": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Burn time approx. 50–55 h",
        "fr": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Durée de combustion env. 50–55 h",
        "it": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Durata di combustione circa 50–55 h"
      },
      {
        "de": "Intermezzo 800 g: H 16 cm · Ø 13,5 cm · 800 g · Brenndauer ca. 110–120 h",
        "en": "Intermezzo 800 g: H 16 cm · Ø 13,5 cm · 800 g · Burn time approx. 110–120 h",
        "fr": "Intermezzo 800 g: H 16 cm · Ø 13,5 cm · 800 g · Durée de combustion env. 110–120 h",
        "it": "Intermezzo 800 g: H 16 cm · Ø 13,5 cm · 800 g · Durata di combustione circa 110–120 h"
      },
      {
        "de": "Great 2,8 kg: H 21,5 cm · Ø 18 cm · 2,8 kg · Brenndauer ca. 200 h",
        "en": "Great 2,8 kg: H 21,5 cm · Ø 18 cm · 2,8 kg · Burn time approx. 200 h",
        "fr": "Great 2,8 kg: H 21,5 cm · Ø 18 cm · 2,8 kg · Durée de combustion env. 200 h",
        "it": "Great 2,8 kg: H 21,5 cm · Ø 18 cm · 2,8 kg · Durata di combustione circa 200 h"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-figuerie-duftkerze-1-opt.webp",
        "width": 715,
        "height": 894,
        "alt": {
          "de": "Cire Trudon The Classic Candle - Figuerie – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon The Classic Candle - Figuerie – product view on a light background",
          "fr": "Cire Trudon The Classic Candle - Figuerie – vue du produit sur fond clair",
          "it": "Cire Trudon The Classic Candle - Figuerie – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_celadon_classic_candle_1200x1200_beige.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-figuerie-duftkerze-2.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon The Classic Candle - Figuerie – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon The Classic Candle - Figuerie – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon The Classic Candle - Figuerie – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon The Classic Candle - Figuerie – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_figuerie03_1_1.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/figuerie-klassische-kerze-270g.html",
    "quellen": [
      "https://trudon.com/eu_de/figuerie-kleine-kerze-70g.html",
      "https://trudon.com/eu_de/figuerie-klassische-kerze-270g.html",
      "https://trudon.com/eu_de/figuerie-intermezzo-kerze-800g.html",
      "https://trudon.com/eu_de/figuerie-grosse-kerze-2800g.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-figuerie-diffuser",
      "cire-trudon-figuerie-raumspray"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": "Small 70 g",
          "betrag": 40,
          "sku": "TFIG00007003XS001",
          "inhaltG": 70,
          "zerbrechlich": true
        },
        {
          "name": "Classic 270 g",
          "betrag": 95,
          "sku": "TFIG00027003XS001",
          "inhaltG": 270,
          "zerbrechlich": true
        },
        {
          "name": "Intermezzo 800 g",
          "betrag": 240,
          "sku": "TFIG00080003XS001",
          "inhaltG": 800,
          "zerbrechlich": true
        },
        {
          "name": "Great 2,8 kg",
          "betrag": 500,
          "sku": "TFIG00280003XS001",
          "inhaltG": 2800,
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/figuerie-klassische-kerze-270g.html"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Größe",
          "en": "Size",
          "fr": "Taille",
          "it": "Misura"
        },
        "optionen": [
          {
            "id": "small-70-g",
            "name": "Small 70 g",
            "code": "TFIG00007003XS001",
            "betrag": 40
          },
          {
            "id": "classic-270-g",
            "name": "Classic 270 g",
            "code": "TFIG00027003XS001",
            "betrag": 95,
            "standard": true
          },
          {
            "id": "intermezzo-800-g",
            "name": "Intermezzo 800 g",
            "code": "TFIG00080003XS001",
            "betrag": 240
          },
          {
            "id": "great-2-8-kg",
            "name": "Great 2,8 kg",
            "code": "TFIG00280003XS001",
            "betrag": 500
          }
        ]
      }
    ],
    "zubehoer": [
      {
        "slug": "cire-trudon-deckel-classic",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-kerzenverzierung-in-bienenform",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-sockel-classic",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-glas-glocke"
      },
      {
        "slug": "cire-trudon-die-kerzenloscher"
      },
      {
        "slug": "cire-trudon-parfumierte-streichholzer-ernesto-kings-and-queens"
      }
    ]
  },
  {
    "slug": "cire-trudon-abd-el-kader-duftkerze",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "duftkerze",
    "name": "The Classic Candle - Abd El Kader",
    "kurz": {
      "de": "Duftkerze „Abd El Kader“ im Glas mit Trudon-Emblem, im Shop in 4 Größen geführt. Der Duft beginnt mit Schwarze-Johannisbeere-Knospen und Zitrone, entwickelt sich über Jasmin und klingt mit Vanille aus.",
      "en": "Scented candle “Abd El Kader” in a glass bearing the Trudon emblem, offered in 4 sizes. The scent opens with Blackcurrant buds and Lemon, moves on to Jasmine and settles on Vanilla.",
      "fr": "Bougie parfumée « Abd El Kader » dans un verre orné de l’emblème Trudon, proposée en 4 tailles. Le parfum s’ouvre sur Bourgeons de cassis et Citron, évolue vers Jasmin et se pose sur Vanille.",
      "it": "Candela profumata “Abd El Kader” in vetro con l’emblema Trudon, disponibile in 4 misure. Il profumo si apre con Gemme di ribes nero e Limone, prosegue con Gelsomino e si chiude con Vaniglia."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Schwarze-Johannisbeere-Knospen, Zitrone, Gewürznelke, Ingwer, Minze, Apfel",
        "en": "Top notes: Blackcurrant buds, Lemon, Clove, Ginger, Mint, Apple",
        "fr": "Notes de tête : Bourgeons de cassis, Citron, Clou de girofle, Gingembre, Menthe, Pomme",
        "it": "Note di testa: Gemme di ribes nero, Limone, Chiodo di garofano, Zenzero, Menta, Mela"
      },
      {
        "de": "Herznoten: Jasmin",
        "en": "Heart notes: Jasmine",
        "fr": "Notes de cœur : Jasmin",
        "it": "Note di cuore: Gelsomino"
      },
      {
        "de": "Basisnoten: Vanille",
        "en": "Base notes: Vanilla",
        "fr": "Notes de fond : Vanille",
        "it": "Note di fondo: Vaniglia"
      },
      {
        "de": "Small 70 g: H 6,5 cm · Ø 5,5 cm · 70 g · Brenndauer ca. 18–20 h",
        "en": "Small 70 g: H 6,5 cm · Ø 5,5 cm · 70 g · Burn time approx. 18–20 h",
        "fr": "Small 70 g: H 6,5 cm · Ø 5,5 cm · 70 g · Durée de combustion env. 18–20 h",
        "it": "Small 70 g: H 6,5 cm · Ø 5,5 cm · 70 g · Durata di combustione circa 18–20 h"
      },
      {
        "de": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Brenndauer ca. 55–60 h",
        "en": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Burn time approx. 55–60 h",
        "fr": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Durée de combustion env. 55–60 h",
        "it": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Durata di combustione circa 55–60 h"
      },
      {
        "de": "Intermezzo 800 g: H 16 cm · Ø 13,5 cm · 800 g · Brenndauer ca. 110–120 h",
        "en": "Intermezzo 800 g: H 16 cm · Ø 13,5 cm · 800 g · Burn time approx. 110–120 h",
        "fr": "Intermezzo 800 g: H 16 cm · Ø 13,5 cm · 800 g · Durée de combustion env. 110–120 h",
        "it": "Intermezzo 800 g: H 16 cm · Ø 13,5 cm · 800 g · Durata di combustione circa 110–120 h"
      },
      {
        "de": "Great 2,8 kg: H 21,5 cm · Ø 18 cm · 2,8 kg · Brenndauer ca. 300 h",
        "en": "Great 2,8 kg: H 21,5 cm · Ø 18 cm · 2,8 kg · Burn time approx. 300 h",
        "fr": "Great 2,8 kg: H 21,5 cm · Ø 18 cm · 2,8 kg · Durée de combustion env. 300 h",
        "it": "Great 2,8 kg: H 21,5 cm · Ø 18 cm · 2,8 kg · Durata di combustione circa 300 h"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-abd-el-kader-duftkerze-1-opt.webp",
        "width": 719,
        "height": 899,
        "alt": {
          "de": "Cire Trudon The Classic Candle - Abd El Kader – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon The Classic Candle - Abd El Kader – product view on a light background",
          "fr": "Cire Trudon The Classic Candle - Abd El Kader – vue du produit sur fond clair",
          "it": "Cire Trudon The Classic Candle - Abd El Kader – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_antique_classic_candle_1200x1200_beige_5.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-abd-el-kader-duftkerze-2.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon The Classic Candle - Abd El Kader – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon The Classic Candle - Abd El Kader – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon The Classic Candle - Abd El Kader – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon The Classic Candle - Abd El Kader – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/a/b/abd_el_kader_2.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/abd-el-kader-klassische-kerze-270g.html",
    "quellen": [
      "https://trudon.com/eu_de/abd-el-kader-kleine-kerze-70g.html",
      "https://trudon.com/eu_de/abd-el-kader-klassische-kerze-270g.html",
      "https://trudon.com/eu_de/abd-el-kader-intermezzo-kerze-800g.html",
      "https://trudon.com/eu_de/abd-el-kader-grosse-kerze-2800g.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-abd-el-kader-the-alabasters",
      "cire-trudon-abd-el-kader-diffuser",
      "cire-trudon-abd-el-kader-raumspray",
      "cire-trudon-abd-el-kader-kameen"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": "Small 70 g",
          "betrag": 40,
          "sku": "TRU/070/ABD",
          "inhaltG": 70,
          "zerbrechlich": true
        },
        {
          "name": "Classic 270 g",
          "betrag": 95,
          "sku": "ABD/07/TRU",
          "inhaltG": 270,
          "zerbrechlich": true
        },
        {
          "name": "Intermezzo 800 g",
          "betrag": 240,
          "sku": "800/ABD/14/TRU",
          "inhaltG": 800,
          "zerbrechlich": true
        },
        {
          "name": "Great 2,8 kg",
          "betrag": 500,
          "sku": "LGB/ABD/08/TRU",
          "inhaltG": 2800,
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/abd-el-kader-klassische-kerze-270g.html"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Größe",
          "en": "Size",
          "fr": "Taille",
          "it": "Misura"
        },
        "optionen": [
          {
            "id": "small-70-g",
            "name": "Small 70 g",
            "code": "TRU/070/ABD",
            "betrag": 40
          },
          {
            "id": "classic-270-g",
            "name": "Classic 270 g",
            "code": "ABD/07/TRU",
            "betrag": 95,
            "standard": true
          },
          {
            "id": "intermezzo-800-g",
            "name": "Intermezzo 800 g",
            "code": "800/ABD/14/TRU",
            "betrag": 240
          },
          {
            "id": "great-2-8-kg",
            "name": "Great 2,8 kg",
            "code": "LGB/ABD/08/TRU",
            "betrag": 500
          }
        ]
      }
    ],
    "zubehoer": [
      {
        "slug": "cire-trudon-deckel-classic",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-kerzenverzierung-in-bienenform",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-sockel-classic",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-glas-glocke"
      },
      {
        "slug": "cire-trudon-die-kerzenloscher"
      },
      {
        "slug": "cire-trudon-parfumierte-streichholzer-ernesto-kings-and-queens"
      }
    ]
  },
  {
    "slug": "cire-trudon-ernesto-duftkerze",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "duftkerze",
    "name": "The Classic Candle - Ernesto",
    "kurz": {
      "de": "Duftkerze „Ernesto“ im Glas mit Trudon-Emblem, im Shop in 4 Größen geführt. Der Duft beginnt mit Bergamote und Grapefruit, entwickelt sich über Eiche und Gewürznelke und klingt mit Tabak und Bernstein aus.",
      "en": "Scented candle “Ernesto” in a glass bearing the Trudon emblem, offered in 4 sizes. The scent opens with Bergamot and Grapefruit, moves on to Oak and Clove and settles on Tobacco and Amber.",
      "fr": "Bougie parfumée « Ernesto » dans un verre orné de l’emblème Trudon, proposée en 4 tailles. Le parfum s’ouvre sur Bergamote et Pamplemousse, évolue vers Chêne et Clou de girofle et se pose sur Tabac et Ambre.",
      "it": "Candela profumata “Ernesto” in vetro con l’emblema Trudon, disponibile in 4 misure. Il profumo si apre con Bergamotto e Pompelmo, prosegue con Quercia e Chiodo di garofano e si chiude con Tabacco e Ambra."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Bergamote, Grapefruit, Rum",
        "en": "Top notes: Bergamot, Grapefruit, Rum",
        "fr": "Notes de tête : Bergamote, Pamplemousse, Rhum",
        "it": "Note di testa: Bergamotto, Pompelmo, Rum"
      },
      {
        "de": "Herznoten: Eiche, Gewürznelke, Labdanum, Patschuli",
        "en": "Heart notes: Oak, Clove, Labdanum, Patchouli",
        "fr": "Notes de cœur : Chêne, Clou de girofle, Labdanum, Patchouli",
        "it": "Note di cuore: Quercia, Chiodo di garofano, Labdano, Patchouli"
      },
      {
        "de": "Basisnoten: Tabak, Bernstein, Leder, Moos",
        "en": "Base notes: Tobacco, Amber, Leather, Moss",
        "fr": "Notes de fond : Tabac, Ambre, Cuir, Mousse",
        "it": "Note di fondo: Tabacco, Ambra, Cuoio, Muschio vegetale"
      },
      {
        "de": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Brenndauer ca. 55–60 h",
        "en": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Burn time approx. 55–60 h",
        "fr": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Durée de combustion env. 55–60 h",
        "it": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Durata di combustione circa 55–60 h"
      },
      {
        "de": "Intermezzo 800 g: H 16 cm · Ø 13,5 cm · 800 g · Brenndauer ca. 110–120 h",
        "en": "Intermezzo 800 g: H 16 cm · Ø 13,5 cm · 800 g · Burn time approx. 110–120 h",
        "fr": "Intermezzo 800 g: H 16 cm · Ø 13,5 cm · 800 g · Durée de combustion env. 110–120 h",
        "it": "Intermezzo 800 g: H 16 cm · Ø 13,5 cm · 800 g · Durata di combustione circa 110–120 h"
      },
      {
        "de": "Great 2,8 kg: H 21,5 cm · Ø 18 cm · 2,8 kg · Brenndauer ca. 300 h",
        "en": "Great 2,8 kg: H 21,5 cm · Ø 18 cm · 2,8 kg · Burn time approx. 300 h",
        "fr": "Great 2,8 kg: H 21,5 cm · Ø 18 cm · 2,8 kg · Durée de combustion env. 300 h",
        "it": "Great 2,8 kg: H 21,5 cm · Ø 18 cm · 2,8 kg · Durata di combustione circa 300 h"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-ernesto-duftkerze-1-opt.webp",
        "width": 719,
        "height": 899,
        "alt": {
          "de": "Cire Trudon The Classic Candle - Ernesto – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon The Classic Candle - Ernesto – product view on a light background",
          "fr": "Cire Trudon The Classic Candle - Ernesto – vue du produit sur fond clair",
          "it": "Cire Trudon The Classic Candle - Ernesto – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_antique_classic_candle_1200x1200_beige_2.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-ernesto-duftkerze-2.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon The Classic Candle - Ernesto – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon The Classic Candle - Ernesto – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon The Classic Candle - Ernesto – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon The Classic Candle - Ernesto – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/e/r/ernesto_1_1.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/ernesto-klassische-kerze-270g.html",
    "quellen": [
      "https://trudon.com/eu_de/ernesto-kleine-kerze-70g.html",
      "https://trudon.com/eu_de/ernesto-klassische-kerze-270g.html",
      "https://trudon.com/eu_de/ernesto-intermezzo-kerze-800g.html",
      "https://trudon.com/eu_de/ernesto-grosse-kerze-2800g.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-ernesto-the-alabasters",
      "cire-trudon-ernesto-diffuser",
      "cire-trudon-ernesto-raumspray",
      "cire-trudon-ernesto-kameen"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": "Small 70 g",
          "betrag": 40,
          "sku": "TRU/070/ERN",
          "inhaltG": 70,
          "zerbrechlich": true
        },
        {
          "name": "Classic 270 g",
          "betrag": 95,
          "sku": "ERN/08/TRU",
          "inhaltG": 270,
          "zerbrechlich": true
        },
        {
          "name": "Intermezzo 800 g",
          "betrag": 240,
          "sku": "800/ERN/14/TRU",
          "inhaltG": 800,
          "zerbrechlich": true
        },
        {
          "name": "Great 2,8 kg",
          "betrag": 500,
          "sku": "LGB/ERN/08/TRU",
          "inhaltG": 2800,
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/ernesto-klassische-kerze-270g.html"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Größe",
          "en": "Size",
          "fr": "Taille",
          "it": "Misura"
        },
        "optionen": [
          {
            "id": "small-70-g",
            "name": "Small 70 g",
            "code": "TRU/070/ERN",
            "betrag": 40
          },
          {
            "id": "classic-270-g",
            "name": "Classic 270 g",
            "code": "ERN/08/TRU",
            "betrag": 95,
            "standard": true
          },
          {
            "id": "intermezzo-800-g",
            "name": "Intermezzo 800 g",
            "code": "800/ERN/14/TRU",
            "betrag": 240
          },
          {
            "id": "great-2-8-kg",
            "name": "Great 2,8 kg",
            "code": "LGB/ERN/08/TRU",
            "betrag": 500
          }
        ]
      }
    ],
    "zubehoer": [
      {
        "slug": "cire-trudon-deckel-classic",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-kerzenverzierung-in-bienenform",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-sockel-classic",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-glas-glocke"
      },
      {
        "slug": "cire-trudon-die-kerzenloscher"
      },
      {
        "slug": "cire-trudon-parfumierte-streichholzer-ernesto-kings-and-queens"
      }
    ]
  },
  {
    "slug": "cire-trudon-josephine-duftkerze",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "duftkerze",
    "name": "The Classic Candle - Joséphine",
    "kurz": {
      "de": "Duftkerze „Joséphine“ im Glas mit Trudon-Emblem, im Shop in 4 Größen geführt. Der Duft beginnt mit Bergamote und Kaffernlimette, entwickelt sich über Chinesische Kamelie und Ägyptischer Jasmin und klingt mit Schwertlilien und Weiße Moschusdüfte aus.",
      "en": "Scented candle “Joséphine” in a glass bearing the Trudon emblem, offered in 4 sizes. The scent opens with Bergamot and Kaffir lime, moves on to Chinese camellia and Egyptian jasmine and settles on Iris and White musks.",
      "fr": "Bougie parfumée « Joséphine » dans un verre orné de l’emblème Trudon, proposée en 4 tailles. Le parfum s’ouvre sur Bergamote et Combava, évolue vers Camélia de Chine et Jasmin d’Égypte et se pose sur Iris et Muscs blancs.",
      "it": "Candela profumata “Joséphine” in vetro con l’emblema Trudon, disponibile in 4 misure. Il profumo si apre con Bergamotto e Lime kaffir, prosegue con Camelia cinese e Gelsomino egiziano e si chiude con Iris e Muschi bianchi."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Bergamote, Kaffernlimette, Gewürze",
        "en": "Top notes: Bergamot, Kaffir lime, Spices",
        "fr": "Notes de tête : Bergamote, Combava, Épices",
        "it": "Note di testa: Bergamotto, Lime kaffir, Spezie"
      },
      {
        "de": "Herznoten: Chinesische Kamelie, Ägyptischer Jasmin, Türkische Rose",
        "en": "Heart notes: Chinese camellia, Egyptian jasmine, Turkish rose",
        "fr": "Notes de cœur : Camélia de Chine, Jasmin d’Égypte, Rose de Turquie",
        "it": "Note di cuore: Camelia cinese, Gelsomino egiziano, Rosa turca"
      },
      {
        "de": "Basisnoten: Schwertlilien, Weiße Moschusdüfte, Santal d'Indonésie",
        "en": "Base notes: Iris, White musks, Indonesian sandalwood",
        "fr": "Notes de fond : Iris, Muscs blancs, Santal d’Indonésie",
        "it": "Note di fondo: Iris, Muschi bianchi, Sandalo indonesiano"
      },
      {
        "de": "Small 70 g: H 6,5 cm · Ø 5,5 cm · 70 g · Brenndauer ca. 18–20 h",
        "en": "Small 70 g: H 6,5 cm · Ø 5,5 cm · 70 g · Burn time approx. 18–20 h",
        "fr": "Small 70 g: H 6,5 cm · Ø 5,5 cm · 70 g · Durée de combustion env. 18–20 h",
        "it": "Small 70 g: H 6,5 cm · Ø 5,5 cm · 70 g · Durata di combustione circa 18–20 h"
      },
      {
        "de": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Brenndauer ca. 55–60 h",
        "en": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Burn time approx. 55–60 h",
        "fr": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Durée de combustion env. 55–60 h",
        "it": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Durata di combustione circa 55–60 h"
      },
      {
        "de": "Intermezzo 800 g: H 16 cm · Ø 13,5 cm · 800 g · Brenndauer ca. 110–120 h",
        "en": "Intermezzo 800 g: H 16 cm · Ø 13,5 cm · 800 g · Burn time approx. 110–120 h",
        "fr": "Intermezzo 800 g: H 16 cm · Ø 13,5 cm · 800 g · Durée de combustion env. 110–120 h",
        "it": "Intermezzo 800 g: H 16 cm · Ø 13,5 cm · 800 g · Durata di combustione circa 110–120 h"
      },
      {
        "de": "Great 2,8 kg: H 21,5 cm · Ø 18 cm · 2,8 kg · Brenndauer ca. 300 h",
        "en": "Great 2,8 kg: H 21,5 cm · Ø 18 cm · 2,8 kg · Burn time approx. 300 h",
        "fr": "Great 2,8 kg: H 21,5 cm · Ø 18 cm · 2,8 kg · Durée de combustion env. 300 h",
        "it": "Great 2,8 kg: H 21,5 cm · Ø 18 cm · 2,8 kg · Durata di combustione circa 300 h"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-josephine-duftkerze-1-opt.webp",
        "width": 719,
        "height": 899,
        "alt": {
          "de": "Cire Trudon The Classic Candle - Joséphine – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon The Classic Candle - Joséphine – product view on a light background",
          "fr": "Cire Trudon The Classic Candle - Joséphine – vue du produit sur fond clair",
          "it": "Cire Trudon The Classic Candle - Joséphine – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_antique_classic_candle_1200x1200_beige.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-josephine-duftkerze-2.webp",
        "width": 640,
        "height": 640,
        "alt": {
          "de": "Cire Trudon The Classic Candle - Joséphine – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon The Classic Candle - Joséphine – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon The Classic Candle - Joséphine – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon The Classic Candle - Joséphine – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/j/o/jos_phine_270.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/josephine-klassische-kerze-270g.html",
    "quellen": [
      "https://trudon.com/eu_de/josephine-kleine-kerze-70g.html",
      "https://trudon.com/eu_de/josephine-klassische-kerze-270g.html",
      "https://trudon.com/eu_de/josephine-intermezzo-kerze-800g.html",
      "https://trudon.com/eu_de/josephine-grosse-kerze-2800g.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-josephine-diffuser",
      "cire-trudon-josephine-raumspray",
      "cire-trudon-josephine-kameen"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": "Small 70 g",
          "betrag": 40,
          "sku": "TRU/070/JOS",
          "inhaltG": 70,
          "zerbrechlich": true
        },
        {
          "name": "Classic 270 g",
          "betrag": 95,
          "sku": "JOS/15/TRU",
          "inhaltG": 270,
          "zerbrechlich": true
        },
        {
          "name": "Intermezzo 800 g",
          "betrag": 240,
          "sku": "800/JOS/14/TRU",
          "inhaltG": 800,
          "zerbrechlich": true
        },
        {
          "name": "Great 2,8 kg",
          "betrag": 500,
          "sku": "LGB/JOS/16/TRU",
          "inhaltG": 2800,
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/josephine-klassische-kerze-270g.html"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Größe",
          "en": "Size",
          "fr": "Taille",
          "it": "Misura"
        },
        "optionen": [
          {
            "id": "small-70-g",
            "name": "Small 70 g",
            "code": "TRU/070/JOS",
            "betrag": 40
          },
          {
            "id": "classic-270-g",
            "name": "Classic 270 g",
            "code": "JOS/15/TRU",
            "betrag": 95,
            "standard": true
          },
          {
            "id": "intermezzo-800-g",
            "name": "Intermezzo 800 g",
            "code": "800/JOS/14/TRU",
            "betrag": 240
          },
          {
            "id": "great-2-8-kg",
            "name": "Great 2,8 kg",
            "code": "LGB/JOS/16/TRU",
            "betrag": 500
          }
        ]
      }
    ],
    "zubehoer": [
      {
        "slug": "cire-trudon-deckel-classic",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-kerzenverzierung-in-bienenform",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-sockel-classic",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-glas-glocke"
      },
      {
        "slug": "cire-trudon-die-kerzenloscher"
      },
      {
        "slug": "cire-trudon-parfumierte-streichholzer-ernesto-kings-and-queens"
      }
    ]
  },
  {
    "slug": "cire-trudon-spella-duftkerze",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "duftkerze",
    "name": "The Classic Candle - Spella",
    "kurz": {
      "de": "Duftkerze „Spella“ im Glas mit Trudon-Emblem, im Shop in 2 Größen geführt. Der Duft beginnt mit Bernstein und Zedernholz, entwickelt sich über Guajakholz und Patschuli und klingt mit Bernstein und Labdanum aus.",
      "en": "Scented candle “Spella” in a glass bearing the Trudon emblem, offered in 2 sizes. The scent opens with Amber and Cedarwood, moves on to Guaiac wood and Patchouli and settles on Amber and Labdanum.",
      "fr": "Bougie parfumée « Spella » dans un verre orné de l’emblème Trudon, proposée en 2 tailles. Le parfum s’ouvre sur Ambre et Bois de cèdre, évolue vers Bois de gaïac et Patchouli et se pose sur Ambre et Labdanum.",
      "it": "Candela profumata “Spella” in vetro con l’emblema Trudon, disponibile in 2 misure. Il profumo si apre con Ambra e Legno di cedro, prosegue con Legno di guaiaco e Patchouli e si chiude con Ambra e Labdano."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Bernstein, Zedernholz, Geranie",
        "en": "Top notes: Amber, Cedarwood, Geranium",
        "fr": "Notes de tête : Ambre, Bois de cèdre, Géranium",
        "it": "Note di testa: Ambra, Legno di cedro, Geranio"
      },
      {
        "de": "Herznoten: Guajakholz, Patschuli, Rose, Sandelholz",
        "en": "Heart notes: Guaiac wood, Patchouli, Rose, Sandalwood",
        "fr": "Notes de cœur : Bois de gaïac, Patchouli, Rose, Bois de santal",
        "it": "Note di cuore: Legno di guaiaco, Patchouli, Rosa, Legno di sandalo"
      },
      {
        "de": "Basisnoten: Bernstein, Labdanum, Moschus, Vanille",
        "en": "Base notes: Amber, Labdanum, Musk, Vanilla",
        "fr": "Notes de fond : Ambre, Labdanum, Musc, Vanille",
        "it": "Note di fondo: Ambra, Labdano, Musk, Vaniglia"
      },
      {
        "de": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Brenndauer ca. 55–60 h",
        "en": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Burn time approx. 55–60 h",
        "fr": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Durée de combustion env. 55–60 h",
        "it": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Durata di combustione circa 55–60 h"
      },
      {
        "de": "Great 2,8 kg: H 21,5 cm · Ø 18 cm · 2,8 kg · Brenndauer ca. 300 h",
        "en": "Great 2,8 kg: H 21,5 cm · Ø 18 cm · 2,8 kg · Burn time approx. 300 h",
        "fr": "Great 2,8 kg: H 21,5 cm · Ø 18 cm · 2,8 kg · Durée de combustion env. 300 h",
        "it": "Great 2,8 kg: H 21,5 cm · Ø 18 cm · 2,8 kg · Durata di combustione circa 300 h"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-spella-duftkerze-1-opt.webp",
        "width": 724,
        "height": 905,
        "alt": {
          "de": "Cire Trudon The Classic Candle - Spella – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon The Classic Candle - Spella – product view on a light background",
          "fr": "Cire Trudon The Classic Candle - Spella – vue du produit sur fond clair",
          "it": "Cire Trudon The Classic Candle - Spella – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_exclusives_classic_candle_1200x1200_beige._1.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/les-exclusives-spella-klassische-kerze-270g.html",
    "quellen": [
      "https://trudon.com/eu_de/les-exclusives-spella-klassische-kerze-270g.html",
      "https://trudon.com/eu_de/les-exclusives-spella-grosse-kerze-2800g.html"
    ],
    "stand": "2026-10-31",
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": "Classic 270 g",
          "betrag": 110,
          "sku": "TRU/270/EXC/SPE",
          "inhaltG": 270,
          "zerbrechlich": true
        },
        {
          "name": "Great 2,8 kg",
          "betrag": 600,
          "sku": "TSPE00280003XS001",
          "inhaltG": 2800,
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/les-exclusives-spella-klassische-kerze-270g.html"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Größe",
          "en": "Size",
          "fr": "Taille",
          "it": "Misura"
        },
        "optionen": [
          {
            "id": "classic-270-g",
            "name": "Classic 270 g",
            "code": "TRU/270/EXC/SPE",
            "betrag": 110,
            "standard": true
          },
          {
            "id": "great-2-8-kg",
            "name": "Great 2,8 kg",
            "code": "TSPE00280003XS001",
            "betrag": 600
          }
        ]
      }
    ],
    "zubehoer": [
      {
        "slug": "cire-trudon-deckel-classic",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-kerzenverzierung-in-bienenform",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-sockel-classic",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-glas-glocke"
      },
      {
        "slug": "cire-trudon-die-kerzenloscher"
      },
      {
        "slug": "cire-trudon-parfumierte-streichholzer-ernesto-kings-and-queens"
      }
    ]
  },
  {
    "slug": "cire-trudon-carmelite-duftkerze",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "duftkerze",
    "name": "The Classic Candle - Carmélite",
    "kurz": {
      "de": "Duftkerze „Carmélite“ im Glas mit Trudon-Emblem. Der Duft beginnt mit Artemisia und Geranie, entwickelt sich über Kardamom und Gewürznelke und klingt mit Ambra und Zedernholz aus.",
      "en": "Scented candle “Carmélite” in a glass bearing the Trudon emblem. The scent opens with Artemisia and Geranium, moves on to Cardamom and Clove and settles on Ambergris and Cedarwood.",
      "fr": "Bougie parfumée « Carmélite » dans un verre orné de l’emblème Trudon. Le parfum s’ouvre sur Armoise et Géranium, évolue vers Cardamome et Clou de girofle et se pose sur Ambre gris et Bois de cèdre.",
      "it": "Candela profumata “Carmélite” in vetro con l’emblema Trudon. Il profumo si apre con Artemisia e Geranio, prosegue con Cardamomo e Chiodo di garofano e si chiude con Ambra grigia e Legno di cedro."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Artemisia, Geranie, Orange",
        "en": "Top notes: Artemisia, Geranium, Orange",
        "fr": "Notes de tête : Armoise, Géranium, Orange",
        "it": "Note di testa: Artemisia, Geranio, Arancia"
      },
      {
        "de": "Herznoten: Kardamom, Gewürznelke, Patschuli, Violett",
        "en": "Heart notes: Cardamom, Clove, Patchouli, Violet",
        "fr": "Notes de cœur : Cardamome, Clou de girofle, Patchouli, Violette",
        "it": "Note di cuore: Cardamomo, Chiodo di garofano, Patchouli, Violetta"
      },
      {
        "de": "Basisnoten: Ambra, Zedernholz, Sandelholz",
        "en": "Base notes: Ambergris, Cedarwood, Sandalwood",
        "fr": "Notes de fond : Ambre gris, Bois de cèdre, Bois de santal",
        "it": "Note di fondo: Ambra grigia, Legno di cedro, Legno di sandalo"
      },
      {
        "de": "Brenndauer ca. 55–60 h",
        "en": "Burn time approx. 55–60 h",
        "fr": "Durée de combustion env. 55–60 h",
        "it": "Durata di combustione circa 55–60 h"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "10,5 cm"
      },
      {
        "key": "durchmesser",
        "wert": "9 cm"
      },
      {
        "key": "gewicht",
        "wert": "270 g"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-carmelite-duftkerze-1-opt.webp",
        "width": 724,
        "height": 905,
        "alt": {
          "de": "Cire Trudon The Classic Candle - Carmélite – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon The Classic Candle - Carmélite – product view on a light background",
          "fr": "Cire Trudon The Classic Candle - Carmélite – vue du produit sur fond clair",
          "it": "Cire Trudon The Classic Candle - Carmélite – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_exclusives_classic_candle_1200x1200_beige.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/les-exclusives-carmelite-klassische-kerze-270g.html",
    "quellen": [
      "https://trudon.com/eu_de/les-exclusives-carmelite-klassische-kerze-270g.html"
    ],
    "stand": "2026-10-31",
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/les-exclusives-carmelite-klassische-kerze-270g.html",
      "varianten": [
        {
          "name": "270 g",
          "betrag": 110,
          "sku": "TRU/270/EXC/CAR",
          "inhaltG": 270,
          "zerbrechlich": true
        }
      ]
    },
    "zubehoer": [
      {
        "slug": "cire-trudon-deckel-classic",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-kerzenverzierung-in-bienenform",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-sockel-classic",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-glas-glocke"
      },
      {
        "slug": "cire-trudon-die-kerzenloscher"
      },
      {
        "slug": "cire-trudon-parfumierte-streichholzer-ernesto-kings-and-queens"
      }
    ]
  },
  {
    "slug": "cire-trudon-empire-duftkerze",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "duftkerze",
    "name": "The Classic Candle - Empire",
    "kurz": {
      "de": "Duftkerze „Empire“ im Glas mit Trudon-Emblem. Der Duft beginnt mit Lorbeer und Lavendel, entwickelt sich über Rosmarin und Thymian und klingt mit Cade wood und Heu aus.",
      "en": "Scented candle “Empire” in a glass bearing the Trudon emblem. The scent opens with Bay laurel and Lavender, moves on to Rosemary and Thyme and settles on Cade wood and Hay.",
      "fr": "Bougie parfumée « Empire » dans un verre orné de l’emblème Trudon. Le parfum s’ouvre sur Laurier et Lavande, évolue vers Romarin et Thym et se pose sur Bois de cade et Foin.",
      "it": "Candela profumata “Empire” in vetro con l’emblema Trudon. Il profumo si apre con Alloro e Lavanda, prosegue con Rosmarino e Timo e si chiude con Legno di cade e Fieno."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Lorbeer, Lavendel, Majoran",
        "en": "Top notes: Bay laurel, Lavender, Marjoram",
        "fr": "Notes de tête : Laurier, Lavande, Marjolaine",
        "it": "Note di testa: Alloro, Lavanda, Maggiorana"
      },
      {
        "de": "Herznoten: Rosmarin, Thymian",
        "en": "Heart notes: Rosemary, Thyme",
        "fr": "Notes de cœur : Romarin, Thym",
        "it": "Note di cuore: Rosmarino, Timo"
      },
      {
        "de": "Basisnoten: Cade wood, Heu, Kiefer, Salbei",
        "en": "Base notes: Cade wood, Hay, Pine, Sage",
        "fr": "Notes de fond : Bois de cade, Foin, Pin, Sauge",
        "it": "Note di fondo: Legno di cade, Fieno, Pino, Salvia"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "10,5 cm"
      },
      {
        "key": "durchmesser",
        "wert": "9 cm"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-empire-duftkerze-1-opt.webp",
        "width": 724,
        "height": 905,
        "alt": {
          "de": "Cire Trudon The Classic Candle - Empire – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon The Classic Candle - Empire – product view on a light background",
          "fr": "Cire Trudon The Classic Candle - Empire – vue du produit sur fond clair",
          "it": "Cire Trudon The Classic Candle - Empire – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_exclusives_classic_candle_1200x1200_beige..jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/les-exclusives-empire-klassische-kerze-270g.html",
    "quellen": [
      "https://trudon.com/eu_de/les-exclusives-empire-klassische-kerze-270g.html"
    ],
    "stand": "2026-10-31",
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/les-exclusives-empire-klassische-kerze-270g.html",
      "varianten": [
        {
          "name": {
            "de": "Einheitsgröße",
            "en": "One size",
            "fr": "Taille unique",
            "it": "Taglia unica"
          },
          "betrag": 110,
          "sku": "TRU/270/EXC/EMP",
          "zerbrechlich": true
        }
      ]
    },
    "zubehoer": [
      {
        "slug": "cire-trudon-die-kerzenloscher"
      },
      {
        "slug": "cire-trudon-parfumierte-streichholzer-ernesto-kings-and-queens"
      }
    ]
  },
  {
    "slug": "cire-trudon-trianon-duftkerze",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "duftkerze",
    "name": "The Classic Candle - Trianon",
    "kurz": {
      "de": "Duftkerze „Trianon“ im Glas mit Trudon-Emblem. Der Duft beginnt mit Galbanum und Rose, entwickelt sich über Hyazinthe und Jasmin und klingt mit Moschus aus.",
      "en": "Scented candle “Trianon” in a glass bearing the Trudon emblem. The scent opens with Galbanum and Rose, moves on to Hyacinth and Jasmine and settles on Musk.",
      "fr": "Bougie parfumée « Trianon » dans un verre orné de l’emblème Trudon. Le parfum s’ouvre sur Galbanum et Rose, évolue vers Jacinthe et Jasmin et se pose sur Musc.",
      "it": "Candela profumata “Trianon” in vetro con l’emblema Trudon. Il profumo si apre con Galbano e Rosa, prosegue con Giacinto e Gelsomino e si chiude con Musk."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Galbanum, Rose, Aquatischer Akkord, Rhabarber",
        "en": "Top notes: Galbanum, Rose, Aquatic accord, Rhubarb",
        "fr": "Notes de tête : Galbanum, Rose, Accord aquatique, Rhubarbe",
        "it": "Note di testa: Galbano, Rosa, Accordo acquatico, Rabarbaro"
      },
      {
        "de": "Herznoten: Hyazinthe, Jasmin, Violett",
        "en": "Heart notes: Hyacinth, Jasmine, Violet",
        "fr": "Notes de cœur : Jacinthe, Jasmin, Violette",
        "it": "Note di cuore: Giacinto, Gelsomino, Violetta"
      },
      {
        "de": "Basisnoten: Moschus",
        "en": "Base notes: Musk",
        "fr": "Notes de fond : Musc",
        "it": "Note di fondo: Musk"
      },
      {
        "de": "Brenndauer ca. 55–60 h",
        "en": "Burn time approx. 55–60 h",
        "fr": "Durée de combustion env. 55–60 h",
        "it": "Durata di combustione circa 55–60 h"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "10,5 cm"
      },
      {
        "key": "durchmesser",
        "wert": "9 cm"
      },
      {
        "key": "gewicht",
        "wert": "270 g"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-trianon-duftkerze-1-opt.webp",
        "width": 724,
        "height": 905,
        "alt": {
          "de": "Cire Trudon The Classic Candle - Trianon – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon The Classic Candle - Trianon – product view on a light background",
          "fr": "Cire Trudon The Classic Candle - Trianon – vue du produit sur fond clair",
          "it": "Cire Trudon The Classic Candle - Trianon – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_exclusives_classic_candle_1200x1200_beige._2.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-trianon-duftkerze-2.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon The Classic Candle - Trianon – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon The Classic Candle - Trianon – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon The Classic Candle - Trianon – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon The Classic Candle - Trianon – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_summer_03_1200x1200.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/grosse-kerze-trianon-270g.html",
    "quellen": [
      "https://trudon.com/eu_de/grosse-kerze-trianon-270g.html"
    ],
    "stand": "2026-10-31",
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/grosse-kerze-trianon-270g.html",
      "varianten": [
        {
          "name": "270 g",
          "betrag": 110,
          "sku": "TTRI00027003XS002",
          "inhaltG": 270,
          "zerbrechlich": true
        }
      ]
    },
    "zubehoer": [
      {
        "slug": "cire-trudon-deckel-classic",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-kerzenverzierung-in-bienenform",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-sockel-classic",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-glas-glocke"
      },
      {
        "slug": "cire-trudon-die-kerzenloscher"
      },
      {
        "slug": "cire-trudon-parfumierte-streichholzer-ernesto-kings-and-queens"
      }
    ]
  },
  {
    "slug": "cire-trudon-cire-duftkerze",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "duftkerze",
    "name": "The Classic Candle - Cire",
    "kurz": {
      "de": "Duftkerze „Cire“ im Glas mit Trudon-Emblem, im Shop in 4 Größen geführt. Der Duft beginnt mit Bergamote und Gewachstes Holz, entwickelt sich über Bienenwachs Absolut und Ätherisches Sandelholzöl und klingt mit Tonkabohnen und Ätherisches Patschuliöl aus.",
      "en": "Scented candle “Cire” in a glass bearing the Trudon emblem, offered in 4 sizes. The scent opens with Bergamot and Waxed wood, moves on to Beeswax absolute and Sandalwood essential oil and settles on Tonka bean and Patchouli essential oil.",
      "fr": "Bougie parfumée « Cire » dans un verre orné de l’emblème Trudon, proposée en 4 tailles. Le parfum s’ouvre sur Bergamote et Bois ciré, évolue vers Absolu de cire d’abeille et Huile essentielle de santal et se pose sur Fève tonka et Huile essentielle de patchouli.",
      "it": "Candela profumata “Cire” in vetro con l’emblema Trudon, disponibile in 4 misure. Il profumo si apre con Bergamotto e Legno cerato, prosegue con Assoluta di cera d’api e Olio essenziale di sandalo e si chiude con Fava tonka e Olio essenziale di patchouli."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Bergamote, Gewachstes Holz, Honig",
        "en": "Top notes: Bergamot, Waxed wood, Honey",
        "fr": "Notes de tête : Bergamote, Bois ciré, Miel",
        "it": "Note di testa: Bergamotto, Legno cerato, Miele"
      },
      {
        "de": "Herznoten: Bienenwachs Absolut, Ätherisches Sandelholzöl, Ätherisches Zimtöl",
        "en": "Heart notes: Beeswax absolute, Sandalwood essential oil, Cinnamon essential oil",
        "fr": "Notes de cœur : Absolu de cire d’abeille, Huile essentielle de santal, Huile essentielle de cannelle",
        "it": "Note di cuore: Assoluta di cera d’api, Olio essenziale di sandalo, Olio essenziale di cannella"
      },
      {
        "de": "Basisnoten: Tonkabohnen, Ätherisches Patschuliöl, Moschus, Vanille",
        "en": "Base notes: Tonka bean, Patchouli essential oil, Musk, Vanilla",
        "fr": "Notes de fond : Fève tonka, Huile essentielle de patchouli, Musc, Vanille",
        "it": "Note di fondo: Fava tonka, Olio essenziale di patchouli, Musk, Vaniglia"
      },
      {
        "de": "Small 70 g: H 6,5 cm · Ø 5,5 cm · 70 g · Brenndauer ca. 18–20 h",
        "en": "Small 70 g: H 6,5 cm · Ø 5,5 cm · 70 g · Burn time approx. 18–20 h",
        "fr": "Small 70 g: H 6,5 cm · Ø 5,5 cm · 70 g · Durée de combustion env. 18–20 h",
        "it": "Small 70 g: H 6,5 cm · Ø 5,5 cm · 70 g · Durata di combustione circa 18–20 h"
      },
      {
        "de": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Brenndauer ca. 50–55 h",
        "en": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Burn time approx. 50–55 h",
        "fr": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Durée de combustion env. 50–55 h",
        "it": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Durata di combustione circa 50–55 h"
      },
      {
        "de": "Intermezzo 800 g: Ø 13,5 cm · 800 g",
        "en": "Intermezzo 800 g: Ø 13,5 cm · 800 g",
        "fr": "Intermezzo 800 g: Ø 13,5 cm · 800 g",
        "it": "Intermezzo 800 g: Ø 13,5 cm · 800 g"
      },
      {
        "de": "Great 2,8 kg: H 21,5 cm · Ø 18 cm · 2,8 kg · Brenndauer ca. 300 h",
        "en": "Great 2,8 kg: H 21,5 cm · Ø 18 cm · 2,8 kg · Burn time approx. 300 h",
        "fr": "Great 2,8 kg: H 21,5 cm · Ø 18 cm · 2,8 kg · Durée de combustion env. 300 h",
        "it": "Great 2,8 kg: H 21,5 cm · Ø 18 cm · 2,8 kg · Durata di combustione circa 300 h"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-cire-duftkerze-1-opt.webp",
        "width": 744,
        "height": 930,
        "alt": {
          "de": "Cire Trudon The Classic Candle - Cire – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon The Classic Candle - Cire – product view on a light background",
          "fr": "Cire Trudon The Classic Candle - Cire – vue du produit sur fond clair",
          "it": "Cire Trudon The Classic Candle - Cire – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_ambre_classic_candle_1200x1200_beige.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-cire-duftkerze-2.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon The Classic Candle - Cire – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon The Classic Candle - Cire – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon The Classic Candle - Cire – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon The Classic Candle - Cire – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_sm2026_spring_summer_25_1200x1200.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-cire-duftkerze-3.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon The Classic Candle - Cire – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon The Classic Candle - Cire – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon The Classic Candle - Cire – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon The Classic Candle - Cire – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_sm2026_spring_summer_1200x1200_1.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/cire-klassische-kerze-270g.html",
    "quellen": [
      "https://trudon.com/eu_de/cire-kleine-kerze-70g.html",
      "https://trudon.com/eu_de/cire-klassische-kerze-270g.html",
      "https://trudon.com/eu_de/cire-intermezzo-kerze-800g.html",
      "https://trudon.com/eu_de/cire-grosse-kerze-2800g.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-cire-diffuser",
      "cire-trudon-cire-diffuser-nachfuellung",
      "cire-trudon-cire-raumspray",
      "cire-trudon-cire-kameen"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": "Small 70 g",
          "betrag": 42,
          "sku": "TRU/070/CIR",
          "inhaltG": 70,
          "zerbrechlich": true
        },
        {
          "name": "Classic 270 g",
          "betrag": 98,
          "sku": "CIR/19/TRU",
          "inhaltG": 270,
          "zerbrechlich": true
        },
        {
          "name": "Intermezzo 800 g",
          "betrag": 250,
          "sku": "800/CIR/TRU",
          "inhaltG": 800,
          "zerbrechlich": true
        },
        {
          "name": "Great 2,8 kg",
          "betrag": 520,
          "sku": "LGB/CIR/TRU",
          "inhaltG": 2800,
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/cire-klassische-kerze-270g.html"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Größe",
          "en": "Size",
          "fr": "Taille",
          "it": "Misura"
        },
        "optionen": [
          {
            "id": "small-70-g",
            "name": "Small 70 g",
            "code": "TRU/070/CIR",
            "betrag": 42
          },
          {
            "id": "classic-270-g",
            "name": "Classic 270 g",
            "code": "CIR/19/TRU",
            "betrag": 98,
            "standard": true
          },
          {
            "id": "intermezzo-800-g",
            "name": "Intermezzo 800 g",
            "code": "800/CIR/TRU",
            "betrag": 250
          },
          {
            "id": "great-2-8-kg",
            "name": "Great 2,8 kg",
            "code": "LGB/CIR/TRU",
            "betrag": 520
          }
        ]
      }
    ],
    "zubehoer": [
      {
        "slug": "cire-trudon-deckel-classic",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-kerzenverzierung-in-bienenform",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-sockel-classic",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-glas-glocke"
      },
      {
        "slug": "cire-trudon-die-kerzenloscher"
      },
      {
        "slug": "cire-trudon-parfumierte-streichholzer-ernesto-kings-and-queens"
      }
    ]
  },
  {
    "slug": "cire-trudon-cyrnos-duftkerze",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "duftkerze",
    "name": "The Classic Candle - Cyrnos",
    "kurz": {
      "de": "Duftkerze „Cyrnos“ im Glas mit Trudon-Emblem, im Shop in 4 Größen geführt. Der Duft beginnt mit Zitrone und Myrte, entwickelt sich über Zedernholz und Schwarze Feige und klingt mit Kaschmirholz und Moschus aus.",
      "en": "Scented candle “Cyrnos” in a glass bearing the Trudon emblem, offered in 4 sizes. The scent opens with Lemon and Myrtle, moves on to Cedarwood and Black fig and settles on Cashmere wood and Musk.",
      "fr": "Bougie parfumée « Cyrnos » dans un verre orné de l’emblème Trudon, proposée en 4 tailles. Le parfum s’ouvre sur Citron et Myrte, évolue vers Bois de cèdre et Figue noire et se pose sur Bois de cachemire et Musc.",
      "it": "Candela profumata “Cyrnos” in vetro con l’emblema Trudon, disponibile in 4 misure. Il profumo si apre con Limone e Mirto, prosegue con Legno di cedro e Fico nero e si chiude con Legno di cashmere e Musk."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Zitrone, Myrte, Thymian",
        "en": "Top notes: Lemon, Myrtle, Thyme",
        "fr": "Notes de tête : Citron, Myrte, Thym",
        "it": "Note di testa: Limone, Mirto, Timo"
      },
      {
        "de": "Herznoten: Zedernholz, Schwarze Feige, Lavendel, Kiefer",
        "en": "Heart notes: Cedarwood, Black fig, Lavender, Pine",
        "fr": "Notes de cœur : Bois de cèdre, Figue noire, Lavande, Pin",
        "it": "Note di cuore: Legno di cedro, Fico nero, Lavanda, Pino"
      },
      {
        "de": "Basisnoten: Kaschmirholz, Moschus, Patschuli",
        "en": "Base notes: Cashmere wood, Musk, Patchouli",
        "fr": "Notes de fond : Bois de cachemire, Musc, Patchouli",
        "it": "Note di fondo: Legno di cashmere, Musk, Patchouli"
      },
      {
        "de": "Small 70 g: H 6,5 cm · Ø 5,5 cm · 70 g · Brenndauer ca. 18–20 h",
        "en": "Small 70 g: H 6,5 cm · Ø 5,5 cm · 70 g · Burn time approx. 18–20 h",
        "fr": "Small 70 g: H 6,5 cm · Ø 5,5 cm · 70 g · Durée de combustion env. 18–20 h",
        "it": "Small 70 g: H 6,5 cm · Ø 5,5 cm · 70 g · Durata di combustione circa 18–20 h"
      },
      {
        "de": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Brenndauer ca. 55–60 h",
        "en": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Burn time approx. 55–60 h",
        "fr": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Durée de combustion env. 55–60 h",
        "it": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Durata di combustione circa 55–60 h"
      },
      {
        "de": "Intermezzo 800 g: H 16 cm · Ø 13,5 cm · 800 g · Brenndauer ca. 110–120 h",
        "en": "Intermezzo 800 g: H 16 cm · Ø 13,5 cm · 800 g · Burn time approx. 110–120 h",
        "fr": "Intermezzo 800 g: H 16 cm · Ø 13,5 cm · 800 g · Durée de combustion env. 110–120 h",
        "it": "Intermezzo 800 g: H 16 cm · Ø 13,5 cm · 800 g · Durata di combustione circa 110–120 h"
      },
      {
        "de": "Great 2,8 kg: 2,8 kg · Brenndauer ca. 300 h",
        "en": "Great 2,8 kg: 2,8 kg · Burn time approx. 300 h",
        "fr": "Great 2,8 kg: 2,8 kg · Durée de combustion env. 300 h",
        "it": "Great 2,8 kg: 2,8 kg · Durata di combustione circa 300 h"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-cyrnos-duftkerze-1-opt.webp",
        "width": 978,
        "height": 1222,
        "alt": {
          "de": "Cire Trudon The Classic Candle - Cyrnos – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon The Classic Candle - Cyrnos – product view on a light background",
          "fr": "Cire Trudon The Classic Candle - Cyrnos – vue du produit sur fond clair",
          "it": "Cire Trudon The Classic Candle - Cyrnos – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_antique_pack_classic_candle_1200x1200_beige_1.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-cyrnos-duftkerze-2.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon The Classic Candle - Cyrnos – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon The Classic Candle - Cyrnos – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon The Classic Candle - Cyrnos – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon The Classic Candle - Cyrnos – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/c/y/cyrnos.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/cyrnos-klassische-kerze-270g.html",
    "quellen": [
      "https://trudon.com/eu_de/cyrnos-kleine-kerze-70g.html",
      "https://trudon.com/eu_de/cyrnos-klassische-kerze-270g.html",
      "https://trudon.com/eu_de/cyrnos-intermezzo-kerze-800g.html",
      "https://trudon.com/eu_de/cyrnos-grosse-kerze-2800g.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-cyrnos-the-alabasters",
      "cire-trudon-cyrnos-diffuser",
      "cire-trudon-cyrnos-raumspray",
      "cire-trudon-cyrnos-kameen"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": "Small 70 g",
          "betrag": 40,
          "sku": "TRU/070/CYR",
          "inhaltG": 70,
          "zerbrechlich": true
        },
        {
          "name": "Classic 270 g",
          "betrag": 95,
          "sku": "CYR/17/TRU",
          "inhaltG": 270,
          "zerbrechlich": true
        },
        {
          "name": "Intermezzo 800 g",
          "betrag": 240,
          "sku": "800/CYR/16/TRU",
          "inhaltG": 800,
          "zerbrechlich": true
        },
        {
          "name": "Great 2,8 kg",
          "betrag": 500,
          "sku": "LGB/CYR/TRU",
          "inhaltG": 2800,
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/cyrnos-klassische-kerze-270g.html"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Größe",
          "en": "Size",
          "fr": "Taille",
          "it": "Misura"
        },
        "optionen": [
          {
            "id": "small-70-g",
            "name": "Small 70 g",
            "code": "TRU/070/CYR",
            "betrag": 40
          },
          {
            "id": "classic-270-g",
            "name": "Classic 270 g",
            "code": "CYR/17/TRU",
            "betrag": 95,
            "standard": true
          },
          {
            "id": "intermezzo-800-g",
            "name": "Intermezzo 800 g",
            "code": "800/CYR/16/TRU",
            "betrag": 240
          },
          {
            "id": "great-2-8-kg",
            "name": "Great 2,8 kg",
            "code": "LGB/CYR/TRU",
            "betrag": 500
          }
        ]
      }
    ],
    "zubehoer": [
      {
        "slug": "cire-trudon-deckel-classic",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-kerzenverzierung-in-bienenform",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-sockel-classic",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-glas-glocke"
      },
      {
        "slug": "cire-trudon-die-kerzenloscher"
      },
      {
        "slug": "cire-trudon-parfumierte-streichholzer-ernesto-kings-and-queens"
      }
    ]
  },
  {
    "slug": "cire-trudon-spiritus-sancti-duftkerze",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "duftkerze",
    "name": "The Classic Candle - Spiritus Sancti",
    "kurz": {
      "de": "Duftkerze „Spiritus Sancti“ im Glas mit Trudon-Emblem. Der Duft beginnt mit Aldehyde und Weihrauch, entwickelt sich über Maiglöckchen und klingt mit Benzoeharz und Labdanum aus.",
      "en": "Scented candle “Spiritus Sancti” in a glass bearing the Trudon emblem. The scent opens with Aldehydes and Frankincense, moves on to Lily of the valley and settles on Benzoin and Labdanum.",
      "fr": "Bougie parfumée « Spiritus Sancti » dans un verre orné de l’emblème Trudon. Le parfum s’ouvre sur Aldéhydes et Encens, évolue vers Muguet et se pose sur Benjoin et Labdanum.",
      "it": "Candela profumata “Spiritus Sancti” in vetro con l’emblema Trudon. Il profumo si apre con Aldeidi e Incenso, prosegue con Mughetto e si chiude con Benzoino e Labdano."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Aldehyde, Weihrauch",
        "en": "Top notes: Aldehydes, Frankincense",
        "fr": "Notes de tête : Aldéhydes, Encens",
        "it": "Note di testa: Aldeidi, Incenso"
      },
      {
        "de": "Herznoten: Maiglöckchen",
        "en": "Heart notes: Lily of the valley",
        "fr": "Notes de cœur : Muguet",
        "it": "Note di cuore: Mughetto"
      },
      {
        "de": "Basisnoten: Benzoeharz, Labdanum",
        "en": "Base notes: Benzoin, Labdanum",
        "fr": "Notes de fond : Benjoin, Labdanum",
        "it": "Note di fondo: Benzoino, Labdano"
      },
      {
        "de": "Brenndauer ca. 55–60 h",
        "en": "Burn time approx. 55–60 h",
        "fr": "Durée de combustion env. 55–60 h",
        "it": "Durata di combustione circa 55–60 h"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "10,5 cm"
      },
      {
        "key": "durchmesser",
        "wert": "9 cm"
      },
      {
        "key": "gewicht",
        "wert": "270 g"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-spiritus-sancti-duftkerze-1-opt.webp",
        "width": 719,
        "height": 899,
        "alt": {
          "de": "Cire Trudon The Classic Candle - Spiritus Sancti – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon The Classic Candle - Spiritus Sancti – product view on a light background",
          "fr": "Cire Trudon The Classic Candle - Spiritus Sancti – vue du produit sur fond clair",
          "it": "Cire Trudon The Classic Candle - Spiritus Sancti – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_antique_classic_candle_1200x1200_beige_3.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-spiritus-sancti-duftkerze-2.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon The Classic Candle - Spiritus Sancti – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon The Classic Candle - Spiritus Sancti – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon The Classic Candle - Spiritus Sancti – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon The Classic Candle - Spiritus Sancti – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_-_380th_anniversary_-_warning_mentionner_photo_retouch_e_5__1_6.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/spiritus-sancti-klassische-kerze-270g.html",
    "quellen": [
      "https://trudon.com/eu_de/spiritus-sancti-klassische-kerze-270g.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-spiritus-sancti-diffuser",
      "cire-trudon-spiritus-sancti-kameen"
    ],
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/spiritus-sancti-klassische-kerze-270g.html",
      "varianten": [
        {
          "name": "270 g",
          "betrag": 95,
          "sku": "SPI/08/TRU",
          "inhaltG": 270,
          "zerbrechlich": true
        }
      ]
    },
    "zubehoer": [
      {
        "slug": "cire-trudon-deckel-classic",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-kerzenverzierung-in-bienenform",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-sockel-classic",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-glas-glocke"
      },
      {
        "slug": "cire-trudon-die-kerzenloscher"
      },
      {
        "slug": "cire-trudon-parfumierte-streichholzer-ernesto-kings-and-queens"
      }
    ]
  },
  {
    "slug": "cire-trudon-odalisque-duftkerze",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "duftkerze",
    "name": "The Classic Candle - Odalisque",
    "kurz": {
      "de": "Duftkerze „Odalisque“ im Glas mit Trudon-Emblem, im Shop in 2 Größen geführt. Der Duft beginnt mit Zitrone und Orange, entwickelt sich über Orangenblüte und klingt mit Cade wood und Vanille aus.",
      "en": "Scented candle “Odalisque” in a glass bearing the Trudon emblem, offered in 2 sizes. The scent opens with Lemon and Orange, moves on to Orange blossom and settles on Cade wood and Vanilla.",
      "fr": "Bougie parfumée « Odalisque » dans un verre orné de l’emblème Trudon, proposée en 2 tailles. Le parfum s’ouvre sur Citron et Orange, évolue vers Fleur d’oranger et se pose sur Bois de cade et Vanille.",
      "it": "Candela profumata “Odalisque” in vetro con l’emblema Trudon, disponibile in 2 misure. Il profumo si apre con Limone e Arancia, prosegue con Fiori d’arancio e si chiude con Legno di cade e Vaniglia."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Zitrone, Orange",
        "en": "Top notes: Lemon, Orange",
        "fr": "Notes de tête : Citron, Orange",
        "it": "Note di testa: Limone, Arancia"
      },
      {
        "de": "Herznoten: Orangenblüte",
        "en": "Heart notes: Orange blossom",
        "fr": "Notes de cœur : Fleur d’oranger",
        "it": "Note di cuore: Fiori d’arancio"
      },
      {
        "de": "Basisnoten: Cade wood, Vanille",
        "en": "Base notes: Cade wood, Vanilla",
        "fr": "Notes de fond : Bois de cade, Vanille",
        "it": "Note di fondo: Legno di cade, Vaniglia"
      },
      {
        "de": "Small 70 g: H 6,5 cm · Ø 5,5 cm · 70 g · Brenndauer ca. 18–20 h",
        "en": "Small 70 g: H 6,5 cm · Ø 5,5 cm · 70 g · Burn time approx. 18–20 h",
        "fr": "Small 70 g: H 6,5 cm · Ø 5,5 cm · 70 g · Durée de combustion env. 18–20 h",
        "it": "Small 70 g: H 6,5 cm · Ø 5,5 cm · 70 g · Durata di combustione circa 18–20 h"
      },
      {
        "de": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Brenndauer ca. 55–60 h",
        "en": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Burn time approx. 55–60 h",
        "fr": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Durée de combustion env. 55–60 h",
        "it": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Durata di combustione circa 55–60 h"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-odalisque-duftkerze-1-opt.webp",
        "width": 719,
        "height": 899,
        "alt": {
          "de": "Cire Trudon The Classic Candle - Odalisque – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon The Classic Candle - Odalisque – product view on a light background",
          "fr": "Cire Trudon The Classic Candle - Odalisque – vue du produit sur fond clair",
          "it": "Cire Trudon The Classic Candle - Odalisque – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/2/7/270-classique-1600x1600.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-odalisque-duftkerze-2.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon The Classic Candle - Odalisque – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon The Classic Candle - Odalisque – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon The Classic Candle - Odalisque – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon The Classic Candle - Odalisque – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/n/w/nw_05072_1_f_8.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/odalisque-klassische-kerze-270g.html",
    "quellen": [
      "https://trudon.com/eu_de/odalisque-kleine-kerze-70g.html",
      "https://trudon.com/eu_de/odalisque-klassische-kerze-270g.html"
    ],
    "stand": "2026-10-31",
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": "Small 70 g",
          "betrag": 40,
          "sku": "TRU/070/ODQ",
          "inhaltG": 70,
          "zerbrechlich": true
        },
        {
          "name": "Classic 270 g",
          "betrag": 95,
          "sku": "ODQ/07/TRU",
          "inhaltG": 270,
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/odalisque-klassische-kerze-270g.html"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Größe",
          "en": "Size",
          "fr": "Taille",
          "it": "Misura"
        },
        "optionen": [
          {
            "id": "small-70-g",
            "name": "Small 70 g",
            "code": "TRU/070/ODQ",
            "betrag": 40
          },
          {
            "id": "classic-270-g",
            "name": "Classic 270 g",
            "code": "ODQ/07/TRU",
            "betrag": 95,
            "standard": true
          }
        ]
      }
    ],
    "zubehoer": [
      {
        "slug": "cire-trudon-deckel-classic",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-kerzenverzierung-in-bienenform",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-sockel-classic",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-glas-glocke"
      },
      {
        "slug": "cire-trudon-die-kerzenloscher"
      },
      {
        "slug": "cire-trudon-parfumierte-streichholzer-ernesto-kings-and-queens"
      }
    ]
  },
  {
    "slug": "cire-trudon-reggio-duftkerze",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "duftkerze",
    "name": "The Classic Candle - Reggio",
    "kurz": {
      "de": "Duftkerze „Reggio“ im Glas mit Trudon-Emblem, im Shop in 4 Größen geführt.",
      "en": "Scented candle “Reggio” in a glass bearing the Trudon emblem, offered in 4 sizes.",
      "fr": "Bougie parfumée « Reggio » dans un verre orné de l’emblème Trudon, proposée en 4 tailles.",
      "it": "Candela profumata “Reggio” in vetro con l’emblema Trudon, disponibile in 4 misure."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Grapefruit",
        "en": "Top notes: Grapefruit",
        "fr": "Notes de tête : Pamplemousse",
        "it": "Note di testa: Pompelmo"
      },
      {
        "de": "Herznoten: Ätherisches Mandarinöl",
        "en": "Heart notes: Mandarin essential oil",
        "fr": "Notes de cœur : Huile essentielle de mandarine",
        "it": "Note di cuore: Olio essenziale di mandarino"
      },
      {
        "de": "Small 70 g: H 6,5 cm · Ø 5,5 cm · 70 g · Brenndauer ca. 18–20 h",
        "en": "Small 70 g: H 6,5 cm · Ø 5,5 cm · 70 g · Burn time approx. 18–20 h",
        "fr": "Small 70 g: H 6,5 cm · Ø 5,5 cm · 70 g · Durée de combustion env. 18–20 h",
        "it": "Small 70 g: H 6,5 cm · Ø 5,5 cm · 70 g · Durata di combustione circa 18–20 h"
      },
      {
        "de": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Brenndauer ca. 55–60 h",
        "en": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Burn time approx. 55–60 h",
        "fr": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Durée de combustion env. 55–60 h",
        "it": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Durata di combustione circa 55–60 h"
      },
      {
        "de": "Intermezzo 800 g: Brenndauer ca. 110–120 h",
        "en": "Intermezzo 800 g: Burn time approx. 110–120 h",
        "fr": "Intermezzo 800 g: Durée de combustion env. 110–120 h",
        "it": "Intermezzo 800 g: Durata di combustione circa 110–120 h"
      },
      {
        "de": "Great 2,8 kg: 2,8 kg · Brenndauer ca. 300 h",
        "en": "Great 2,8 kg: 2,8 kg · Burn time approx. 300 h",
        "fr": "Great 2,8 kg: 2,8 kg · Durée de combustion env. 300 h",
        "it": "Great 2,8 kg: 2,8 kg · Durata di combustione circa 300 h"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-reggio-duftkerze-1-opt.webp",
        "width": 729,
        "height": 911,
        "alt": {
          "de": "Cire Trudon The Classic Candle - Reggio – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon The Classic Candle - Reggio – product view on a light background",
          "fr": "Cire Trudon The Classic Candle - Reggio – vue du produit sur fond clair",
          "it": "Cire Trudon The Classic Candle - Reggio – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_bm_classic_candle_1200x1200_beige_1.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-reggio-duftkerze-2.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon The Classic Candle - Reggio – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon The Classic Candle - Reggio – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon The Classic Candle - Reggio – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon The Classic Candle - Reggio – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_-_belles_mati_res_-_reggio_classic_scented_candle_lifestyle_2023.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/reggio-klassische-kerze-270g.html",
    "quellen": [
      "https://trudon.com/eu_de/reggio-kleine-kerze-70g.html",
      "https://trudon.com/eu_de/reggio-klassische-kerze-270g.html",
      "https://trudon.com/eu_de/reggio-intermezzo-kerze-800g.html",
      "https://trudon.com/eu_de/reggio-grosse-kerze-2800g.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-reggio-diffuser",
      "cire-trudon-reggio-raumspray",
      "cire-trudon-reggio-kameen"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": "Small 70 g",
          "betrag": 40,
          "sku": "TRU/070/BM/REG",
          "inhaltG": 70,
          "zerbrechlich": true
        },
        {
          "name": "Classic 270 g",
          "betrag": 95,
          "sku": "REG/BM/TRU",
          "inhaltG": 270,
          "zerbrechlich": true
        },
        {
          "name": "Intermezzo 800 g",
          "betrag": 240,
          "sku": "800/BM/REG",
          "inhaltG": 800,
          "zerbrechlich": true
        },
        {
          "name": "Great 2,8 kg",
          "betrag": 500,
          "sku": "LGB/BM/REG",
          "inhaltG": 2800,
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/reggio-klassische-kerze-270g.html"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Größe",
          "en": "Size",
          "fr": "Taille",
          "it": "Misura"
        },
        "optionen": [
          {
            "id": "small-70-g",
            "name": "Small 70 g",
            "code": "TRU/070/BM/REG",
            "betrag": 40
          },
          {
            "id": "classic-270-g",
            "name": "Classic 270 g",
            "code": "REG/BM/TRU",
            "betrag": 95,
            "standard": true
          },
          {
            "id": "intermezzo-800-g",
            "name": "Intermezzo 800 g",
            "code": "800/BM/REG",
            "betrag": 240
          },
          {
            "id": "great-2-8-kg",
            "name": "Great 2,8 kg",
            "code": "LGB/BM/REG",
            "betrag": 500
          }
        ]
      }
    ],
    "zubehoer": [
      {
        "slug": "cire-trudon-deckel-classic",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-kerzenverzierung-in-bienenform",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-sockel-classic",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-glas-glocke"
      },
      {
        "slug": "cire-trudon-die-kerzenloscher"
      },
      {
        "slug": "cire-trudon-parfumierte-streichholzer-ernesto-kings-and-queens"
      }
    ]
  },
  {
    "slug": "cire-trudon-madurai-duftkerze",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "duftkerze",
    "name": "The Classic Candle - Maduraï",
    "kurz": {
      "de": "Duftkerze „Maduraï“ im Glas mit Trudon-Emblem, im Shop in 4 Größen geführt. Der Duft beginnt mit Ylang-Ylang, entwickelt sich über Reiner Arabischer Jasmin und klingt mit Benzoeharz aus.",
      "en": "Scented candle “Maduraï” in a glass bearing the Trudon emblem, offered in 4 sizes. The scent opens with Ylang-ylang, moves on to Pure Arabian jasmine and settles on Benzoin.",
      "fr": "Bougie parfumée « Maduraï » dans un verre orné de l’emblème Trudon, proposée en 4 tailles. Le parfum s’ouvre sur Ylang-ylang, évolue vers Jasmin sambac pur et se pose sur Benjoin.",
      "it": "Candela profumata “Maduraï” in vetro con l’emblema Trudon, disponibile in 4 misure. Il profumo si apre con Ylang-ylang, prosegue con Gelsomino arabo puro e si chiude con Benzoino."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Ylang-Ylang",
        "en": "Top notes: Ylang-ylang",
        "fr": "Notes de tête : Ylang-ylang",
        "it": "Note di testa: Ylang-ylang"
      },
      {
        "de": "Herznoten: Reiner Arabischer Jasmin",
        "en": "Heart notes: Pure Arabian jasmine",
        "fr": "Notes de cœur : Jasmin sambac pur",
        "it": "Note di cuore: Gelsomino arabo puro"
      },
      {
        "de": "Basisnoten: Benzoeharz",
        "en": "Base notes: Benzoin",
        "fr": "Notes de fond : Benjoin",
        "it": "Note di fondo: Benzoino"
      },
      {
        "de": "Small 70 g: H 6,5 cm · Ø 5,5 cm · 70 g · Brenndauer ca. 18–20 h",
        "en": "Small 70 g: H 6,5 cm · Ø 5,5 cm · 70 g · Burn time approx. 18–20 h",
        "fr": "Small 70 g: H 6,5 cm · Ø 5,5 cm · 70 g · Durée de combustion env. 18–20 h",
        "it": "Small 70 g: H 6,5 cm · Ø 5,5 cm · 70 g · Durata di combustione circa 18–20 h"
      },
      {
        "de": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Brenndauer ca. 55–60 h",
        "en": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Burn time approx. 55–60 h",
        "fr": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Durée de combustion env. 55–60 h",
        "it": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Durata di combustione circa 55–60 h"
      },
      {
        "de": "Intermezzo 800 g: Brenndauer ca. 110–120 h",
        "en": "Intermezzo 800 g: Burn time approx. 110–120 h",
        "fr": "Intermezzo 800 g: Durée de combustion env. 110–120 h",
        "it": "Intermezzo 800 g: Durata di combustione circa 110–120 h"
      },
      {
        "de": "Great 2,8 kg: 2,8 kg · Brenndauer ca. 300 h",
        "en": "Great 2,8 kg: 2,8 kg · Burn time approx. 300 h",
        "fr": "Great 2,8 kg: 2,8 kg · Durée de combustion env. 300 h",
        "it": "Great 2,8 kg: 2,8 kg · Durata di combustione circa 300 h"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-madurai-duftkerze-1-opt.webp",
        "width": 729,
        "height": 911,
        "alt": {
          "de": "Cire Trudon The Classic Candle - Maduraï – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon The Classic Candle - Maduraï – product view on a light background",
          "fr": "Cire Trudon The Classic Candle - Maduraï – vue du produit sur fond clair",
          "it": "Cire Trudon The Classic Candle - Maduraï – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_bm_classic_candle_1200x1200_beige_1_1.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-madurai-duftkerze-2.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon The Classic Candle - Maduraï – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon The Classic Candle - Maduraï – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon The Classic Candle - Maduraï – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon The Classic Candle - Maduraï – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_-_belles_mati_res_-_madura_lifestyle_2023.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/madurai-klassische-kerze-270g.html",
    "quellen": [
      "https://trudon.com/eu_de/madurai-kleine-kerze-70g.html",
      "https://trudon.com/eu_de/madurai-klassische-kerze-270g.html",
      "https://trudon.com/eu_de/madurai-intermezzo-kerze-800g.html",
      "https://trudon.com/eu_de/madurai-grosse-kerze-2800g.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-madurai-diffuser",
      "cire-trudon-madurai-raumspray",
      "cire-trudon-madurai-kameen"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": "Small 70 g",
          "betrag": 40,
          "sku": "TRU/070/BM/MAD",
          "inhaltG": 70,
          "zerbrechlich": true
        },
        {
          "name": "Classic 270 g",
          "betrag": 95,
          "sku": "MAD/BM/TRU",
          "inhaltG": 270,
          "zerbrechlich": true
        },
        {
          "name": "Intermezzo 800 g",
          "betrag": 240,
          "sku": "800/BM/MAD",
          "inhaltG": 800,
          "zerbrechlich": true
        },
        {
          "name": "Great 2,8 kg",
          "betrag": 500,
          "sku": "LGB/BM/MAD",
          "inhaltG": 2800,
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/madurai-klassische-kerze-270g.html"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Größe",
          "en": "Size",
          "fr": "Taille",
          "it": "Misura"
        },
        "optionen": [
          {
            "id": "small-70-g",
            "name": "Small 70 g",
            "code": "TRU/070/BM/MAD",
            "betrag": 40
          },
          {
            "id": "classic-270-g",
            "name": "Classic 270 g",
            "code": "MAD/BM/TRU",
            "betrag": 95,
            "standard": true
          },
          {
            "id": "intermezzo-800-g",
            "name": "Intermezzo 800 g",
            "code": "800/BM/MAD",
            "betrag": 240
          },
          {
            "id": "great-2-8-kg",
            "name": "Great 2,8 kg",
            "code": "LGB/BM/MAD",
            "betrag": 500
          }
        ]
      }
    ],
    "zubehoer": [
      {
        "slug": "cire-trudon-deckel-classic",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-kerzenverzierung-in-bienenform",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-sockel-classic",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-glas-glocke"
      },
      {
        "slug": "cire-trudon-die-kerzenloscher"
      },
      {
        "slug": "cire-trudon-parfumierte-streichholzer-ernesto-kings-and-queens"
      }
    ]
  },
  {
    "slug": "cire-trudon-salta-duftkerze",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "duftkerze",
    "name": "The Classic Candle - Salta",
    "kurz": {
      "de": "Duftkerze „Salta“ im Glas mit Trudon-Emblem, im Shop in 2 Größen geführt. Der Duft beginnt mit Eisenkraut, entwickelt sich über Grapefruit und klingt mit Hyazinthe aus.",
      "en": "Scented candle “Salta” in a glass bearing the Trudon emblem, offered in 2 sizes. The scent opens with Verbena, moves on to Grapefruit and settles on Hyacinth.",
      "fr": "Bougie parfumée « Salta » dans un verre orné de l’emblème Trudon, proposée en 2 tailles. Le parfum s’ouvre sur Verveine, évolue vers Pamplemousse et se pose sur Jacinthe.",
      "it": "Candela profumata “Salta” in vetro con l’emblema Trudon, disponibile in 2 misure. Il profumo si apre con Verbena, prosegue con Pompelmo e si chiude con Giacinto."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Eisenkraut",
        "en": "Top notes: Verbena",
        "fr": "Notes de tête : Verveine",
        "it": "Note di testa: Verbena"
      },
      {
        "de": "Herznoten: Grapefruit",
        "en": "Heart notes: Grapefruit",
        "fr": "Notes de cœur : Pamplemousse",
        "it": "Note di cuore: Pompelmo"
      },
      {
        "de": "Basisnoten: Hyazinthe",
        "en": "Base notes: Hyacinth",
        "fr": "Notes de fond : Jacinthe",
        "it": "Note di fondo: Giacinto"
      },
      {
        "de": "Small 70 g: H 6,5 cm · Ø 5,5 cm · 70 g · Brenndauer ca. 18–20 h",
        "en": "Small 70 g: H 6,5 cm · Ø 5,5 cm · 70 g · Burn time approx. 18–20 h",
        "fr": "Small 70 g: H 6,5 cm · Ø 5,5 cm · 70 g · Durée de combustion env. 18–20 h",
        "it": "Small 70 g: H 6,5 cm · Ø 5,5 cm · 70 g · Durata di combustione circa 18–20 h"
      },
      {
        "de": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Brenndauer ca. 55–60 h",
        "en": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Burn time approx. 55–60 h",
        "fr": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Durée de combustion env. 55–60 h",
        "it": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Durata di combustione circa 55–60 h"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-salta-duftkerze-1-opt.webp",
        "width": 729,
        "height": 911,
        "alt": {
          "de": "Cire Trudon The Classic Candle - Salta – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon The Classic Candle - Salta – product view on a light background",
          "fr": "Cire Trudon The Classic Candle - Salta – vue du produit sur fond clair",
          "it": "Cire Trudon The Classic Candle - Salta – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_bm_classic_candle_1200x1200_beige_1_2.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-salta-duftkerze-2.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon The Classic Candle - Salta – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon The Classic Candle - Salta – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon The Classic Candle - Salta – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon The Classic Candle - Salta – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_-_belles_mati_res_-_salta_classic_candle_-_lifestyle_2023.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/salta-klassische-kerze-270g.html",
    "quellen": [
      "https://trudon.com/eu_de/salta-kleine-kerze-70g.html",
      "https://trudon.com/eu_de/salta-klassische-kerze-270g.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-salta-raumspray"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": "Small 70 g",
          "betrag": 40,
          "sku": "TRU/070/BM/SAL",
          "inhaltG": 70,
          "zerbrechlich": true
        },
        {
          "name": "Classic 270 g",
          "betrag": 95,
          "sku": "SAL/BM/TRU",
          "inhaltG": 270,
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/salta-klassische-kerze-270g.html"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Größe",
          "en": "Size",
          "fr": "Taille",
          "it": "Misura"
        },
        "optionen": [
          {
            "id": "small-70-g",
            "name": "Small 70 g",
            "code": "TRU/070/BM/SAL",
            "betrag": 40
          },
          {
            "id": "classic-270-g",
            "name": "Classic 270 g",
            "code": "SAL/BM/TRU",
            "betrag": 95,
            "standard": true
          }
        ]
      }
    ],
    "zubehoer": [
      {
        "slug": "cire-trudon-deckel-classic",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-kerzenverzierung-in-bienenform",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-sockel-classic",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-glas-glocke"
      },
      {
        "slug": "cire-trudon-die-kerzenloscher"
      },
      {
        "slug": "cire-trudon-parfumierte-streichholzer-ernesto-kings-and-queens"
      }
    ]
  },
  {
    "slug": "cire-trudon-ourika-duftkerze",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "duftkerze",
    "name": "The Classic Candle - Ourika",
    "kurz": {
      "de": "Duftkerze „Ourika“ im Glas mit Trudon-Emblem. Der Duft beginnt mit Gardenie, entwickelt sich über Schwertlilien und klingt mit Benzoeharz aus.",
      "en": "Scented candle “Ourika” in a glass bearing the Trudon emblem. The scent opens with Gardenia, moves on to Iris and settles on Benzoin.",
      "fr": "Bougie parfumée « Ourika » dans un verre orné de l’emblème Trudon. Le parfum s’ouvre sur Gardénia, évolue vers Iris et se pose sur Benjoin.",
      "it": "Candela profumata “Ourika” in vetro con l’emblema Trudon. Il profumo si apre con Gardenia, prosegue con Iris e si chiude con Benzoino."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Gardenie",
        "en": "Top notes: Gardenia",
        "fr": "Notes de tête : Gardénia",
        "it": "Note di testa: Gardenia"
      },
      {
        "de": "Herznoten: Schwertlilien",
        "en": "Heart notes: Iris",
        "fr": "Notes de cœur : Iris",
        "it": "Note di cuore: Iris"
      },
      {
        "de": "Basisnoten: Benzoeharz",
        "en": "Base notes: Benzoin",
        "fr": "Notes de fond : Benjoin",
        "it": "Note di fondo: Benzoino"
      },
      {
        "de": "Brenndauer ca. 55–60 h",
        "en": "Burn time approx. 55–60 h",
        "fr": "Durée de combustion env. 55–60 h",
        "it": "Durata di combustione circa 55–60 h"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "10,5 cm"
      },
      {
        "key": "durchmesser",
        "wert": "9 cm"
      },
      {
        "key": "gewicht",
        "wert": "270 g"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-ourika-duftkerze-1-opt.webp",
        "width": 729,
        "height": 911,
        "alt": {
          "de": "Cire Trudon The Classic Candle - Ourika – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon The Classic Candle - Ourika – product view on a light background",
          "fr": "Cire Trudon The Classic Candle - Ourika – vue du produit sur fond clair",
          "it": "Cire Trudon The Classic Candle - Ourika – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_bm_classic_candle_1200x1200_beige_1_3.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-ourika-duftkerze-2.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon The Classic Candle - Ourika – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon The Classic Candle - Ourika – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon The Classic Candle - Ourika – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon The Classic Candle - Ourika – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_-_belles_mati_res_-_ourika_lifestyle_2023.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/ourika-klassische-kerze-270g.html",
    "quellen": [
      "https://trudon.com/eu_de/ourika-klassische-kerze-270g.html"
    ],
    "stand": "2026-10-31",
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/ourika-klassische-kerze-270g.html",
      "varianten": [
        {
          "name": "270 g",
          "betrag": 95,
          "sku": "OUR/BM/TRU",
          "inhaltG": 270,
          "zerbrechlich": true
        }
      ]
    },
    "zubehoer": [
      {
        "slug": "cire-trudon-deckel-classic",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-kerzenverzierung-in-bienenform",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-sockel-classic",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-glas-glocke"
      },
      {
        "slug": "cire-trudon-die-kerzenloscher"
      },
      {
        "slug": "cire-trudon-parfumierte-streichholzer-ernesto-kings-and-queens"
      }
    ]
  },
  {
    "slug": "cire-trudon-balmoral-duftkerze",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "duftkerze",
    "name": "The Classic Candle - Balmoral",
    "kurz": {
      "de": "Duftkerze „Balmoral“ im Glas mit Trudon-Emblem. Der Duft beginnt mit Laubblätter und Geschnittenes Gras, entwickelt sich über Freesien und Schwertlilien und klingt mit Kiefer und Moschusdüfte aus.",
      "en": "Scented candle “Balmoral” in a glass bearing the Trudon emblem. The scent opens with Leaves and Cut grass, moves on to Freesia and Iris and settles on Pine and Musks.",
      "fr": "Bougie parfumée « Balmoral » dans un verre orné de l’emblème Trudon. Le parfum s’ouvre sur Feuillage et Herbe coupée, évolue vers Freesia et Iris et se pose sur Pin et Muscs.",
      "it": "Candela profumata “Balmoral” in vetro con l’emblema Trudon. Il profumo si apre con Fogliame e Erba tagliata, prosegue con Fresia e Iris e si chiude con Pino e Note muschiate."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Laubblätter, Geschnittenes Gras, Minze",
        "en": "Top notes: Leaves, Cut grass, Mint",
        "fr": "Notes de tête : Feuillage, Herbe coupée, Menthe",
        "it": "Note di testa: Fogliame, Erba tagliata, Menta"
      },
      {
        "de": "Herznoten: Freesien, Schwertlilien, Tee",
        "en": "Heart notes: Freesia, Iris, Tea",
        "fr": "Notes de cœur : Freesia, Iris, Thé",
        "it": "Note di cuore: Fresia, Iris, Tè"
      },
      {
        "de": "Basisnoten: Kiefer, Moschusdüfte, Sap",
        "en": "Base notes: Pine, Musks, Sap",
        "fr": "Notes de fond : Pin, Muscs, Sève",
        "it": "Note di fondo: Pino, Note muschiate, Linfa"
      },
      {
        "de": "Brenndauer ca. 55–60 h",
        "en": "Burn time approx. 55–60 h",
        "fr": "Durée de combustion env. 55–60 h",
        "it": "Durata di combustione circa 55–60 h"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "10,5 cm"
      },
      {
        "key": "durchmesser",
        "wert": "9 cm"
      },
      {
        "key": "gewicht",
        "wert": "270 g"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-balmoral-duftkerze-1-opt.webp",
        "width": 719,
        "height": 899,
        "alt": {
          "de": "Cire Trudon The Classic Candle - Balmoral – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon The Classic Candle - Balmoral – product view on a light background",
          "fr": "Cire Trudon The Classic Candle - Balmoral – vue du produit sur fond clair",
          "it": "Cire Trudon The Classic Candle - Balmoral – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/2/7/270-classique-1600x1600_trudon_2.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-balmoral-duftkerze-2.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon The Classic Candle - Balmoral – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon The Classic Candle - Balmoral – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon The Classic Candle - Balmoral – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon The Classic Candle - Balmoral – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/2/0/2022_01_13_9999_236_1.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/balmoral-klassische-kerze-270g.html",
    "quellen": [
      "https://trudon.com/eu_de/balmoral-klassische-kerze-270g.html"
    ],
    "stand": "2026-10-31",
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/balmoral-klassische-kerze-270g.html",
      "varianten": [
        {
          "name": "270 g",
          "betrag": 95,
          "sku": "BAL/08/TRU",
          "inhaltG": 270,
          "zerbrechlich": true
        }
      ]
    },
    "zubehoer": [
      {
        "slug": "cire-trudon-deckel-classic",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-kerzenverzierung-in-bienenform",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-sockel-classic",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-glas-glocke"
      },
      {
        "slug": "cire-trudon-die-kerzenloscher"
      },
      {
        "slug": "cire-trudon-parfumierte-streichholzer-ernesto-kings-and-queens"
      }
    ]
  },
  {
    "slug": "cire-trudon-tuileries-duftkerze",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "duftkerze",
    "name": "The Classic Candle - Tuileries",
    "kurz": {
      "de": "Duftkerze „Tuileries“ im Glas mit Trudon-Emblem. Der Duft beginnt mit Palisanderholz und Schwarze Johannisbeere, entwickelt sich über Weiße Blumen und Rose und klingt mit Moschus und Patschuli aus.",
      "en": "Scented candle “Tuileries” in a glass bearing the Trudon emblem. The scent opens with Rosewood and Blackcurrant, moves on to White flowers and Rose and settles on Musk and Patchouli.",
      "fr": "Bougie parfumée « Tuileries » dans un verre orné de l’emblème Trudon. Le parfum s’ouvre sur Bois de palissandre et Cassis, évolue vers Fleurs blanches et Rose et se pose sur Musc et Patchouli.",
      "it": "Candela profumata “Tuileries” in vetro con l’emblema Trudon. Il profumo si apre con Legno di palissandro e Ribes nero, prosegue con Fiori bianchi e Rosa e si chiude con Musk e Patchouli."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Palisanderholz, Schwarze Johannisbeere, Mandarine",
        "en": "Top notes: Rosewood, Blackcurrant, Mandarin",
        "fr": "Notes de tête : Bois de palissandre, Cassis, Mandarine",
        "it": "Note di testa: Legno di palissandro, Ribes nero, Mandarino"
      },
      {
        "de": "Herznoten: Weiße Blumen, Rose",
        "en": "Heart notes: White flowers, Rose",
        "fr": "Notes de cœur : Fleurs blanches, Rose",
        "it": "Note di cuore: Fiori bianchi, Rosa"
      },
      {
        "de": "Basisnoten: Moschus, Patschuli, Sandelholz, Vanille",
        "en": "Base notes: Musk, Patchouli, Sandalwood, Vanilla",
        "fr": "Notes de fond : Musc, Patchouli, Bois de santal, Vanille",
        "it": "Note di fondo: Musk, Patchouli, Legno di sandalo, Vaniglia"
      },
      {
        "de": "Brenndauer ca. 55–60 h",
        "en": "Burn time approx. 55–60 h",
        "fr": "Durée de combustion env. 55–60 h",
        "it": "Durata di combustione circa 55–60 h"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "10,5 cm"
      },
      {
        "key": "durchmesser",
        "wert": "9 cm"
      },
      {
        "key": "gewicht",
        "wert": "270 g"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-tuileries-duftkerze-1-opt.webp",
        "width": 640,
        "height": 800,
        "alt": {
          "de": "Cire Trudon The Classic Candle - Tuileries – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon The Classic Candle - Tuileries – product view on a light background",
          "fr": "Cire Trudon The Classic Candle - Tuileries – vue du produit sur fond clair",
          "it": "Cire Trudon The Classic Candle - Tuileries – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/2/7/270-classique-640-640_trudon_1.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-tuileries-duftkerze-2.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon The Classic Candle - Tuileries – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon The Classic Candle - Tuileries – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon The Classic Candle - Tuileries – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon The Classic Candle - Tuileries – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/b/o/bougie_classique_lifestyle_1200x1200_insitu_002_.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/tuileries-klassische-kerze-270g.html",
    "quellen": [
      "https://trudon.com/eu_de/tuileries-klassische-kerze-270g.html"
    ],
    "stand": "2026-10-31",
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/tuileries-klassische-kerze-270g.html",
      "varianten": [
        {
          "name": "270 g",
          "betrag": 95,
          "sku": "TUI/24/TRU",
          "inhaltG": 270,
          "zerbrechlich": true
        }
      ]
    },
    "zubehoer": [
      {
        "slug": "cire-trudon-deckel-classic",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-kerzenverzierung-in-bienenform",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-sockel-classic",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-glas-glocke"
      },
      {
        "slug": "cire-trudon-die-kerzenloscher"
      },
      {
        "slug": "cire-trudon-parfumierte-streichholzer-ernesto-kings-and-queens"
      }
    ]
  },
  {
    "slug": "cire-trudon-madeleine-duftkerze",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "duftkerze",
    "name": "The Classic Candle - Madeleine",
    "kurz": {
      "de": "Duftkerze „Madeleine“ im Glas mit Trudon-Emblem. Der Duft beginnt mit Castoreum und Gewürznelke, entwickelt sich über Schwertlilien und Jasmin und klingt mit Leder und Moos aus.",
      "en": "Scented candle “Madeleine” in a glass bearing the Trudon emblem. The scent opens with Castoreum and Clove, moves on to Iris and Jasmine and settles on Leather and Moss.",
      "fr": "Bougie parfumée « Madeleine » dans un verre orné de l’emblème Trudon. Le parfum s’ouvre sur Castoréum et Clou de girofle, évolue vers Iris et Jasmin et se pose sur Cuir et Mousse.",
      "it": "Candela profumata “Madeleine” in vetro con l’emblema Trudon. Il profumo si apre con Castoreum e Chiodo di garofano, prosegue con Iris e Gelsomino e si chiude con Cuoio e Muschio vegetale."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Castoreum, Gewürznelke, Lavendel",
        "en": "Top notes: Castoreum, Clove, Lavender",
        "fr": "Notes de tête : Castoréum, Clou de girofle, Lavande",
        "it": "Note di testa: Castoreum, Chiodo di garofano, Lavanda"
      },
      {
        "de": "Herznoten: Schwertlilien, Jasmin, Rose, Vetiver",
        "en": "Heart notes: Iris, Jasmine, Rose, Vetiver",
        "fr": "Notes de cœur : Iris, Jasmin, Rose, Vétiver",
        "it": "Note di cuore: Iris, Gelsomino, Rosa, Vetiver"
      },
      {
        "de": "Basisnoten: Leder, Moos, Patschuli, Tabak",
        "en": "Base notes: Leather, Moss, Patchouli, Tobacco",
        "fr": "Notes de fond : Cuir, Mousse, Patchouli, Tabac",
        "it": "Note di fondo: Cuoio, Muschio vegetale, Patchouli, Tabacco"
      },
      {
        "de": "Brenndauer ca. 55–60 h",
        "en": "Burn time approx. 55–60 h",
        "fr": "Durée de combustion env. 55–60 h",
        "it": "Durata di combustione circa 55–60 h"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "10,5 cm"
      },
      {
        "key": "durchmesser",
        "wert": "9 cm"
      },
      {
        "key": "gewicht",
        "wert": "270 g"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-madeleine-duftkerze-1-opt.webp",
        "width": 719,
        "height": 899,
        "alt": {
          "de": "Cire Trudon The Classic Candle - Madeleine – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon The Classic Candle - Madeleine – product view on a light background",
          "fr": "Cire Trudon The Classic Candle - Madeleine – vue du produit sur fond clair",
          "it": "Cire Trudon The Classic Candle - Madeleine – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/2/7/270-classique-1600x1600_trudon_6.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-madeleine-duftkerze-2.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon The Classic Candle - Madeleine – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon The Classic Candle - Madeleine – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon The Classic Candle - Madeleine – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon The Classic Candle - Madeleine – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/n/w/nw_05077_f_5.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/madeleine-klassische-kerze-270g.html",
    "quellen": [
      "https://trudon.com/eu_de/madeleine-klassische-kerze-270g.html"
    ],
    "stand": "2026-10-31",
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/madeleine-klassische-kerze-270g.html",
      "varianten": [
        {
          "name": "270 g",
          "betrag": 95,
          "sku": "MAD/14/TRU",
          "inhaltG": 270,
          "zerbrechlich": true
        }
      ]
    },
    "zubehoer": [
      {
        "slug": "cire-trudon-deckel-classic",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-kerzenverzierung-in-bienenform",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-sockel-classic",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-glas-glocke"
      },
      {
        "slug": "cire-trudon-die-kerzenloscher"
      },
      {
        "slug": "cire-trudon-parfumierte-streichholzer-ernesto-kings-and-queens"
      }
    ]
  },
  {
    "slug": "cire-trudon-dada-duftkerze",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "duftkerze",
    "name": "The Classic Candle - Dada",
    "kurz": {
      "de": "Duftkerze „Dada“ im Glas mit Trudon-Emblem. Der Duft beginnt mit Eukalyptus und Buchu-Blätter, entwickelt sich über Minze und Tee und klingt mit Kamille aus.",
      "en": "Scented candle “Dada” in a glass bearing the Trudon emblem. The scent opens with Eucalyptus and Buchu leaves, moves on to Mint and Tea and settles on Chamomile.",
      "fr": "Bougie parfumée « Dada » dans un verre orné de l’emblème Trudon. Le parfum s’ouvre sur Eucalyptus et Feuilles de buchu, évolue vers Menthe et Thé et se pose sur Camomille.",
      "it": "Candela profumata “Dada” in vetro con l’emblema Trudon. Il profumo si apre con Eucalipto e Foglie di buchu, prosegue con Menta e Tè e si chiude con Camomilla."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Eukalyptus, Buchu-Blätter",
        "en": "Top notes: Eucalyptus, Buchu leaves",
        "fr": "Notes de tête : Eucalyptus, Feuilles de buchu",
        "it": "Note di testa: Eucalipto, Foglie di buchu"
      },
      {
        "de": "Herznoten: Minze, Tee",
        "en": "Heart notes: Mint, Tea",
        "fr": "Notes de cœur : Menthe, Thé",
        "it": "Note di cuore: Menta, Tè"
      },
      {
        "de": "Basisnoten: Kamille",
        "en": "Base notes: Chamomile",
        "fr": "Notes de fond : Camomille",
        "it": "Note di fondo: Camomilla"
      },
      {
        "de": "Brenndauer ca. 55–60 h",
        "en": "Burn time approx. 55–60 h",
        "fr": "Durée de combustion env. 55–60 h",
        "it": "Durata di combustione circa 55–60 h"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "10,5 cm"
      },
      {
        "key": "durchmesser",
        "wert": "9 cm"
      },
      {
        "key": "gewicht",
        "wert": "270 g"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-dada-duftkerze-1-opt.webp",
        "width": 719,
        "height": 899,
        "alt": {
          "de": "Cire Trudon The Classic Candle - Dada – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon The Classic Candle - Dada – product view on a light background",
          "fr": "Cire Trudon The Classic Candle - Dada – vue du produit sur fond clair",
          "it": "Cire Trudon The Classic Candle - Dada – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/2/7/270-classique-1600x1600_2.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-dada-duftkerze-2.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon The Classic Candle - Dada – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon The Classic Candle - Dada – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon The Classic Candle - Dada – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon The Classic Candle - Dada – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/2/0/2022_01_13_9999_236_3.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/dada-klassische-kerze-270g.html",
    "quellen": [
      "https://trudon.com/eu_de/dada-klassische-kerze-270g.html"
    ],
    "stand": "2026-10-31",
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/dada-klassische-kerze-270g.html",
      "varianten": [
        {
          "name": "270 g",
          "betrag": 95,
          "sku": "DA/07/TRU",
          "inhaltG": 270,
          "zerbrechlich": true
        }
      ]
    },
    "zubehoer": [
      {
        "slug": "cire-trudon-deckel-classic",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-kerzenverzierung-in-bienenform",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-sockel-classic",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-glas-glocke"
      },
      {
        "slug": "cire-trudon-die-kerzenloscher"
      },
      {
        "slug": "cire-trudon-parfumierte-streichholzer-ernesto-kings-and-queens"
      }
    ]
  },
  {
    "slug": "cire-trudon-solis-rex-duftkerze",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "duftkerze",
    "name": "The Classic Candle - Solis Rex",
    "kurz": {
      "de": "Duftkerze „Solis Rex“ im Glas mit Trudon-Emblem, im Shop in 3 Größen geführt. Der Duft beginnt mit Eukalyptus und Orange, entwickelt sich über Fichtenrinde und klingt mit Zedernholz und Weihrauch aus.",
      "en": "Scented candle “Solis Rex” in a glass bearing the Trudon emblem, offered in 3 sizes. The scent opens with Eucalyptus and Orange, moves on to Spruce bark and settles on Cedarwood and Frankincense.",
      "fr": "Bougie parfumée « Solis Rex » dans un verre orné de l’emblème Trudon, proposée en 3 tailles. Le parfum s’ouvre sur Eucalyptus et Orange, évolue vers Écorce d’épicéa et se pose sur Bois de cèdre et Encens.",
      "it": "Candela profumata “Solis Rex” in vetro con l’emblema Trudon, disponibile in 3 misure. Il profumo si apre con Eucalipto e Arancia, prosegue con Corteccia di abete rosso e si chiude con Legno di cedro e Incenso."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Eukalyptus, Orange",
        "en": "Top notes: Eucalyptus, Orange",
        "fr": "Notes de tête : Eucalyptus, Orange",
        "it": "Note di testa: Eucalipto, Arancia"
      },
      {
        "de": "Herznoten: Fichtenrinde",
        "en": "Heart notes: Spruce bark",
        "fr": "Notes de cœur : Écorce d’épicéa",
        "it": "Note di cuore: Corteccia di abete rosso"
      },
      {
        "de": "Basisnoten: Zedernholz, Weihrauch",
        "en": "Base notes: Cedarwood, Frankincense",
        "fr": "Notes de fond : Bois de cèdre, Encens",
        "it": "Note di fondo: Legno di cedro, Incenso"
      },
      {
        "de": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Brenndauer ca. 55–60 h",
        "en": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Burn time approx. 55–60 h",
        "fr": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Durée de combustion env. 55–60 h",
        "it": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Durata di combustione circa 55–60 h"
      },
      {
        "de": "Intermezzo 800 g: H 16 cm · Ø 13,5 cm · 800 g · Brenndauer ca. 110–120 h",
        "en": "Intermezzo 800 g: H 16 cm · Ø 13,5 cm · 800 g · Burn time approx. 110–120 h",
        "fr": "Intermezzo 800 g: H 16 cm · Ø 13,5 cm · 800 g · Durée de combustion env. 110–120 h",
        "it": "Intermezzo 800 g: H 16 cm · Ø 13,5 cm · 800 g · Durata di combustione circa 110–120 h"
      },
      {
        "de": "Great 2,8 kg: H 21,5 cm · Ø 18 cm · 2,8 kg · Brenndauer ca. 300 h",
        "en": "Great 2,8 kg: H 21,5 cm · Ø 18 cm · 2,8 kg · Burn time approx. 300 h",
        "fr": "Great 2,8 kg: H 21,5 cm · Ø 18 cm · 2,8 kg · Durée de combustion env. 300 h",
        "it": "Great 2,8 kg: H 21,5 cm · Ø 18 cm · 2,8 kg · Durata di combustione circa 300 h"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-solis-rex-duftkerze-1-opt.webp",
        "width": 719,
        "height": 899,
        "alt": {
          "de": "Cire Trudon The Classic Candle - Solis Rex – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon The Classic Candle - Solis Rex – product view on a light background",
          "fr": "Cire Trudon The Classic Candle - Solis Rex – vue du produit sur fond clair",
          "it": "Cire Trudon The Classic Candle - Solis Rex – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/2/7/270-classique-1600x1600_4.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-solis-rex-duftkerze-2.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon The Classic Candle - Solis Rex – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon The Classic Candle - Solis Rex – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon The Classic Candle - Solis Rex – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon The Classic Candle - Solis Rex – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_-_380th_anniversary_-_warning_mentionner_photo_retouch_e_71__6.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-solis-rex-duftkerze-3.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon The Classic Candle - Solis Rex – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon The Classic Candle - Solis Rex – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon The Classic Candle - Solis Rex – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon The Classic Candle - Solis Rex – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/d/s/dsc00183_1600x1600_1.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/solis-rex-klassische-kerze-270g.html",
    "quellen": [
      "https://trudon.com/eu_de/solis-rex-klassische-kerze-270g.html",
      "https://trudon.com/eu_de/solis-rex-intermezzo-kerze-800g.html",
      "https://trudon.com/eu_de/solis-rex-grosse-kerze-2800g.html"
    ],
    "stand": "2026-10-31",
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": "Classic 270 g",
          "betrag": 95,
          "sku": "ROI/07/TRU",
          "inhaltG": 270,
          "zerbrechlich": true
        },
        {
          "name": "Intermezzo 800 g",
          "betrag": 240,
          "sku": "800/ROI/14/TRU",
          "inhaltG": 800,
          "zerbrechlich": true
        },
        {
          "name": "Great 2,8 kg",
          "betrag": 500,
          "sku": "LGB/ROI/08/TRU",
          "inhaltG": 2800,
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/solis-rex-klassische-kerze-270g.html"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Größe",
          "en": "Size",
          "fr": "Taille",
          "it": "Misura"
        },
        "optionen": [
          {
            "id": "classic-270-g",
            "name": "Classic 270 g",
            "code": "ROI/07/TRU",
            "betrag": 95,
            "standard": true
          },
          {
            "id": "intermezzo-800-g",
            "name": "Intermezzo 800 g",
            "code": "800/ROI/14/TRU",
            "betrag": 240
          },
          {
            "id": "great-2-8-kg",
            "name": "Great 2,8 kg",
            "code": "LGB/ROI/08/TRU",
            "betrag": 500
          }
        ]
      }
    ],
    "zubehoer": [
      {
        "slug": "cire-trudon-deckel-classic",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-kerzenverzierung-in-bienenform",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-sockel-classic",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-glas-glocke"
      },
      {
        "slug": "cire-trudon-die-kerzenloscher"
      },
      {
        "slug": "cire-trudon-parfumierte-streichholzer-ernesto-kings-and-queens"
      }
    ]
  },
  {
    "slug": "cire-trudon-gabriel-duftkerze",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "duftkerze",
    "name": "The Classic Candle - Gabriel",
    "kurz": {
      "de": "Duftkerze „Gabriel“ im Glas mit Trudon-Emblem, im Shop in 4 Größen geführt. Der Duft beginnt mit Birke und Kandierte Maronen, entwickelt sich über Kaschmirholz und Moos und klingt mit Zedernholz und Moschus aus.",
      "en": "Scented candle “Gabriel” in a glass bearing the Trudon emblem, offered in 4 sizes. The scent opens with Birch and Candied chestnuts, moves on to Cashmere wood and Moss and settles on Cedarwood and Musk.",
      "fr": "Bougie parfumée « Gabriel » dans un verre orné de l’emblème Trudon, proposée en 4 tailles. Le parfum s’ouvre sur Bouleau et Marrons glacés, évolue vers Bois de cachemire et Mousse et se pose sur Bois de cèdre et Musc.",
      "it": "Candela profumata “Gabriel” in vetro con l’emblema Trudon, disponibile in 4 misure. Il profumo si apre con Betulla e Marron glacé, prosegue con Legno di cashmere e Muschio vegetale e si chiude con Legno di cedro e Musk."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Birke, Kandierte Maronen",
        "en": "Top notes: Birch, Candied chestnuts",
        "fr": "Notes de tête : Bouleau, Marrons glacés",
        "it": "Note di testa: Betulla, Marron glacé"
      },
      {
        "de": "Herznoten: Kaschmirholz, Moos",
        "en": "Heart notes: Cashmere wood, Moss",
        "fr": "Notes de cœur : Bois de cachemire, Mousse",
        "it": "Note di cuore: Legno di cashmere, Muschio vegetale"
      },
      {
        "de": "Basisnoten: Zedernholz, Moschus, Patschuli",
        "en": "Base notes: Cedarwood, Musk, Patchouli",
        "fr": "Notes de fond : Bois de cèdre, Musc, Patchouli",
        "it": "Note di fondo: Legno di cedro, Musk, Patchouli"
      },
      {
        "de": "Small 70 g: H 6,5 cm · Ø 5,5 cm · 70 g · Brenndauer ca. 18–20 h",
        "en": "Small 70 g: H 6,5 cm · Ø 5,5 cm · 70 g · Burn time approx. 18–20 h",
        "fr": "Small 70 g: H 6,5 cm · Ø 5,5 cm · 70 g · Durée de combustion env. 18–20 h",
        "it": "Small 70 g: H 6,5 cm · Ø 5,5 cm · 70 g · Durata di combustione circa 18–20 h"
      },
      {
        "de": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Brenndauer ca. 55–60 h",
        "en": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Burn time approx. 55–60 h",
        "fr": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Durée de combustion env. 55–60 h",
        "it": "Classic 270 g: H 10,5 cm · Ø 9 cm · 270 g · Durata di combustione circa 55–60 h"
      },
      {
        "de": "Intermezzo 800 g: H 16 cm · Ø 13,5 cm · 800 g · Brenndauer ca. 110–120 h",
        "en": "Intermezzo 800 g: H 16 cm · Ø 13,5 cm · 800 g · Burn time approx. 110–120 h",
        "fr": "Intermezzo 800 g: H 16 cm · Ø 13,5 cm · 800 g · Durée de combustion env. 110–120 h",
        "it": "Intermezzo 800 g: H 16 cm · Ø 13,5 cm · 800 g · Durata di combustione circa 110–120 h"
      },
      {
        "de": "Great 2,8 kg: H 21,5 cm · Ø 18 cm · 2,8 kg · Brenndauer ca. 300 h",
        "en": "Great 2,8 kg: H 21,5 cm · Ø 18 cm · 2,8 kg · Burn time approx. 300 h",
        "fr": "Great 2,8 kg: H 21,5 cm · Ø 18 cm · 2,8 kg · Durée de combustion env. 300 h",
        "it": "Great 2,8 kg: H 21,5 cm · Ø 18 cm · 2,8 kg · Durata di combustione circa 300 h"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-gabriel-duftkerze-1-opt.webp",
        "width": 719,
        "height": 899,
        "alt": {
          "de": "Cire Trudon The Classic Candle - Gabriel – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon The Classic Candle - Gabriel – product view on a light background",
          "fr": "Cire Trudon The Classic Candle - Gabriel – vue du produit sur fond clair",
          "it": "Cire Trudon The Classic Candle - Gabriel – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_antique_classic_candle_1200x1200_beige_4.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-gabriel-duftkerze-2.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon The Classic Candle - Gabriel – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon The Classic Candle - Gabriel – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon The Classic Candle - Gabriel – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon The Classic Candle - Gabriel – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/g/a/gabriel_1_3.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/gabriel-klassische-kerze-270g.html",
    "quellen": [
      "https://trudon.com/eu_de/gabriel-kleine-kerze-70g.html",
      "https://trudon.com/eu_de/gabriel-klassische-kerze-270g.html",
      "https://trudon.com/eu_de/gabriel-intermezzo-kerze-800g.html",
      "https://trudon.com/eu_de/gabriel-grosse-kerze-2800g.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-gabriel-the-alabasters",
      "cire-trudon-gabriel-diffuser",
      "cire-trudon-gabriel-kameen"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": "Small 70 g",
          "betrag": 40,
          "sku": "TRU/070/GAB",
          "inhaltG": 70,
          "zerbrechlich": true
        },
        {
          "name": "Classic 270 g",
          "betrag": 95,
          "sku": "GAB/19/TRU",
          "inhaltG": 270,
          "zerbrechlich": true
        },
        {
          "name": "Intermezzo 800 g",
          "betrag": 240,
          "sku": "800/GAB/14/TRU",
          "inhaltG": 800,
          "zerbrechlich": true
        },
        {
          "name": "Great 2,8 kg",
          "betrag": 500,
          "sku": "LGB/GAB/15/TRU",
          "inhaltG": 2800,
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/gabriel-klassische-kerze-270g.html"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Größe",
          "en": "Size",
          "fr": "Taille",
          "it": "Misura"
        },
        "optionen": [
          {
            "id": "small-70-g",
            "name": "Small 70 g",
            "code": "TRU/070/GAB",
            "betrag": 40
          },
          {
            "id": "classic-270-g",
            "name": "Classic 270 g",
            "code": "GAB/19/TRU",
            "betrag": 95,
            "standard": true
          },
          {
            "id": "intermezzo-800-g",
            "name": "Intermezzo 800 g",
            "code": "800/GAB/14/TRU",
            "betrag": 240
          },
          {
            "id": "great-2-8-kg",
            "name": "Great 2,8 kg",
            "code": "LGB/GAB/15/TRU",
            "betrag": 500
          }
        ]
      }
    ],
    "zubehoer": [
      {
        "slug": "cire-trudon-deckel-classic",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-kerzenverzierung-in-bienenform",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-sockel-classic",
        "hinweis": {
          "de": "Passt zur Größe Classic (270 g)",
          "en": "Fits the Classic size (270 g)",
          "fr": "Pour la taille Classique (270 g)",
          "it": "Per la misura Classic (270 g)"
        }
      },
      {
        "slug": "cire-trudon-glas-glocke"
      },
      {
        "slug": "cire-trudon-die-kerzenloscher"
      },
      {
        "slug": "cire-trudon-parfumierte-streichholzer-ernesto-kings-and-queens"
      }
    ]
  },
  {
    "slug": "cire-trudon-ernesto-the-alabasters",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "duftkerze",
    "name": "The Alabasters - Ernesto",
    "kurz": {
      "de": "Duftkerze „Ernesto“ aus der Reihe The Alabasters: Das Gefäß ist aus Alabaster statt aus Glas; eine passende Nachfüllkerze ist erhältlich. Der Duft beginnt mit Bergamote und Grapefruit, entwickelt sich über Eiche und Gewürznelke und klingt mit Tabak und Bernstein aus.",
      "en": "Scented candle “Ernesto” from The Alabasters line: the vessel is made of alabaster instead of glass; a matching refill candle is available. The scent opens with Bergamot and Grapefruit, moves on to Oak and Clove and settles on Tobacco and Amber.",
      "fr": "Bougie parfumée « Ernesto » de la ligne The Alabasters : le contenant est en albâtre et non en verre ; une recharge assortie existe. Le parfum s’ouvre sur Bergamote et Pamplemousse, évolue vers Chêne et Clou de girofle et se pose sur Tabac et Ambre.",
      "it": "Candela profumata “Ernesto” della linea The Alabasters: il contenitore è in alabastro anziché in vetro; è disponibile una ricarica abbinata. Il profumo si apre con Bergamotto e Pompelmo, prosegue con Quercia e Chiodo di garofano e si chiude con Tabacco e Ambra."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Bergamote, Grapefruit, Rum",
        "en": "Top notes: Bergamot, Grapefruit, Rum",
        "fr": "Notes de tête : Bergamote, Pamplemousse, Rhum",
        "it": "Note di testa: Bergamotto, Pompelmo, Rum"
      },
      {
        "de": "Herznoten: Eiche, Gewürznelke, Labdanum, Patschuli",
        "en": "Heart notes: Oak, Clove, Labdanum, Patchouli",
        "fr": "Notes de cœur : Chêne, Clou de girofle, Labdanum, Patchouli",
        "it": "Note di cuore: Quercia, Chiodo di garofano, Labdano, Patchouli"
      },
      {
        "de": "Basisnoten: Tabak, Bernstein, Leder, Moos",
        "en": "Base notes: Tobacco, Amber, Leather, Moss",
        "fr": "Notes de fond : Tabac, Ambre, Cuir, Mousse",
        "it": "Note di fondo: Tabacco, Ambra, Cuoio, Muschio vegetale"
      },
      {
        "de": "Kerze 270 g: H 10,5 cm · Ø 9 cm · 270 g · Brenndauer ca. 55–60 h",
        "en": "Candle 270 g: H 10,5 cm · Ø 9 cm · 270 g · Burn time approx. 55–60 h",
        "fr": "Bougie 270 g: H 10,5 cm · Ø 9 cm · 270 g · Durée de combustion env. 55–60 h",
        "it": "Candela 270 g: H 10,5 cm · Ø 9 cm · 270 g · Durata di combustione circa 55–60 h"
      },
      {
        "de": "Nachfüllkerze 270 g: H 10,5 cm · Ø 9 cm · 270 g · Brenndauer ca. 55–60 h",
        "en": "Refill 270 g: H 10,5 cm · Ø 9 cm · 270 g · Burn time approx. 55–60 h",
        "fr": "Recharge 270 g: H 10,5 cm · Ø 9 cm · 270 g · Durée de combustion env. 55–60 h",
        "it": "Ricarica 270 g: H 10,5 cm · Ø 9 cm · 270 g · Durata di combustione circa 55–60 h"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-ernesto-the-alabasters-1-opt.webp",
        "width": 780,
        "height": 975,
        "alt": {
          "de": "Cire Trudon The Alabasters - Ernesto – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon The Alabasters - Ernesto – product view on a light background",
          "fr": "Cire Trudon The Alabasters - Ernesto – vue du produit sur fond clair",
          "it": "Cire Trudon The Alabasters - Ernesto – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_alb_tres_classic_candle_1200x1200_beige_1_4.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-ernesto-the-alabasters-2.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon The Alabasters - Ernesto – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon The Alabasters - Ernesto – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon The Alabasters - Ernesto – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon The Alabasters - Ernesto – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_alabaster_in_situ_ecom_1.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/ernesto-alabasterkerze-270g.html",
    "quellen": [
      "https://trudon.com/eu_de/ernesto-alabasterkerze-270g.html",
      "https://trudon.com/eu_de/ernesto-nachfuellung-alabasterkerze-270g.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-ernesto-duftkerze",
      "cire-trudon-ernesto-diffuser",
      "cire-trudon-ernesto-raumspray",
      "cire-trudon-ernesto-kameen"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Kerze 270 g",
            "en": "Candle 270 g",
            "fr": "Bougie 270 g",
            "it": "Candela 270 g"
          },
          "betrag": 165,
          "sku": "ALB/270/25/ERN",
          "inhaltG": 270
        },
        {
          "name": {
            "de": "Nachfüllkerze 270 g",
            "en": "Refill 270 g",
            "fr": "Recharge 270 g",
            "it": "Ricarica 270 g"
          },
          "betrag": 78,
          "sku": "ALB/270/RERN",
          "inhaltG": 270
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/ernesto-alabasterkerze-270g.html"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Format",
          "en": "Format",
          "fr": "Format",
          "it": "Formato"
        },
        "optionen": [
          {
            "id": "kerze-270-g",
            "name": {
              "de": "Kerze 270 g",
              "en": "Candle 270 g",
              "fr": "Bougie 270 g",
              "it": "Candela 270 g"
            },
            "code": "ALB/270/25/ERN",
            "betrag": 165,
            "standard": true
          },
          {
            "id": "nachfullkerze-270-g",
            "name": {
              "de": "Nachfüllkerze 270 g",
              "en": "Refill 270 g",
              "fr": "Recharge 270 g",
              "it": "Ricarica 270 g"
            },
            "code": "ALB/270/RERN",
            "betrag": 78
          }
        ]
      }
    ]
  },
  {
    "slug": "cire-trudon-abd-el-kader-the-alabasters",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "duftkerze",
    "name": "The Alabasters - Abd El Kader",
    "kurz": {
      "de": "Duftkerze „Abd El Kader“ aus der Reihe The Alabasters: Das Gefäß ist aus Alabaster statt aus Glas; eine passende Nachfüllkerze ist erhältlich. Der Duft beginnt mit Schwarze-Johannisbeere-Knospen und Zitrone, entwickelt sich über Jasmin und klingt mit Vanille aus.",
      "en": "Scented candle “Abd El Kader” from The Alabasters line: the vessel is made of alabaster instead of glass; a matching refill candle is available. The scent opens with Blackcurrant buds and Lemon, moves on to Jasmine and settles on Vanilla.",
      "fr": "Bougie parfumée « Abd El Kader » de la ligne The Alabasters : le contenant est en albâtre et non en verre ; une recharge assortie existe. Le parfum s’ouvre sur Bourgeons de cassis et Citron, évolue vers Jasmin et se pose sur Vanille.",
      "it": "Candela profumata “Abd El Kader” della linea The Alabasters: il contenitore è in alabastro anziché in vetro; è disponibile una ricarica abbinata. Il profumo si apre con Gemme di ribes nero e Limone, prosegue con Gelsomino e si chiude con Vaniglia."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Schwarze-Johannisbeere-Knospen, Zitrone, Gewürznelke, Ingwer, Minze, Apfel",
        "en": "Top notes: Blackcurrant buds, Lemon, Clove, Ginger, Mint, Apple",
        "fr": "Notes de tête : Bourgeons de cassis, Citron, Clou de girofle, Gingembre, Menthe, Pomme",
        "it": "Note di testa: Gemme di ribes nero, Limone, Chiodo di garofano, Zenzero, Menta, Mela"
      },
      {
        "de": "Herznoten: Jasmin",
        "en": "Heart notes: Jasmine",
        "fr": "Notes de cœur : Jasmin",
        "it": "Note di cuore: Gelsomino"
      },
      {
        "de": "Basisnoten: Vanille",
        "en": "Base notes: Vanilla",
        "fr": "Notes de fond : Vanille",
        "it": "Note di fondo: Vaniglia"
      },
      {
        "de": "Kerze 270 g: H 10,5 cm · Ø 9 cm · 270 g · Brenndauer ca. 55–60 h",
        "en": "Candle 270 g: H 10,5 cm · Ø 9 cm · 270 g · Burn time approx. 55–60 h",
        "fr": "Bougie 270 g: H 10,5 cm · Ø 9 cm · 270 g · Durée de combustion env. 55–60 h",
        "it": "Candela 270 g: H 10,5 cm · Ø 9 cm · 270 g · Durata di combustione circa 55–60 h"
      },
      {
        "de": "Nachfüllkerze 270 g: H 10,5 cm · Ø 9 cm · 270 g · Brenndauer ca. 55–60 h",
        "en": "Refill 270 g: H 10,5 cm · Ø 9 cm · 270 g · Burn time approx. 55–60 h",
        "fr": "Recharge 270 g: H 10,5 cm · Ø 9 cm · 270 g · Durée de combustion env. 55–60 h",
        "it": "Ricarica 270 g: H 10,5 cm · Ø 9 cm · 270 g · Durata di combustione circa 55–60 h"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-abd-el-kader-the-alabasters-1-opt.webp",
        "width": 780,
        "height": 975,
        "alt": {
          "de": "Cire Trudon The Alabasters - Abd El Kader – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon The Alabasters - Abd El Kader – product view on a light background",
          "fr": "Cire Trudon The Alabasters - Abd El Kader – vue du produit sur fond clair",
          "it": "Cire Trudon The Alabasters - Abd El Kader – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_alb_tres_classic_candle_1200x1200_beige_1.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-abd-el-kader-the-alabasters-2.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon The Alabasters - Abd El Kader – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon The Alabasters - Abd El Kader – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon The Alabasters - Abd El Kader – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon The Alabasters - Abd El Kader – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_alabaster_in_situ_ecom.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/abd-el-kader-alabasterkerze-270g.html",
    "quellen": [
      "https://trudon.com/eu_de/abd-el-kader-alabasterkerze-270g.html",
      "https://trudon.com/eu_de/abd-el-kader-nachfuellungen-alabasterkerze-270g.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-abd-el-kader-duftkerze",
      "cire-trudon-abd-el-kader-diffuser",
      "cire-trudon-abd-el-kader-raumspray",
      "cire-trudon-abd-el-kader-kameen"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Kerze 270 g",
            "en": "Candle 270 g",
            "fr": "Bougie 270 g",
            "it": "Candela 270 g"
          },
          "betrag": 165,
          "sku": "ALB/270/25/ABD",
          "inhaltG": 270
        },
        {
          "name": {
            "de": "Nachfüllkerze 270 g",
            "en": "Refill 270 g",
            "fr": "Recharge 270 g",
            "it": "Ricarica 270 g"
          },
          "betrag": 78,
          "sku": "ALB/270/RABD",
          "inhaltG": 270
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/abd-el-kader-alabasterkerze-270g.html"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Format",
          "en": "Format",
          "fr": "Format",
          "it": "Formato"
        },
        "optionen": [
          {
            "id": "kerze-270-g",
            "name": {
              "de": "Kerze 270 g",
              "en": "Candle 270 g",
              "fr": "Bougie 270 g",
              "it": "Candela 270 g"
            },
            "code": "ALB/270/25/ABD",
            "betrag": 165,
            "standard": true
          },
          {
            "id": "nachfullkerze-270-g",
            "name": {
              "de": "Nachfüllkerze 270 g",
              "en": "Refill 270 g",
              "fr": "Recharge 270 g",
              "it": "Ricarica 270 g"
            },
            "code": "ALB/270/RABD",
            "betrag": 78
          }
        ]
      }
    ]
  },
  {
    "slug": "cire-trudon-cyrnos-the-alabasters",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "duftkerze",
    "name": "The Alabasters - Cyrnos",
    "kurz": {
      "de": "Duftkerze „Cyrnos“ aus der Reihe The Alabasters: Das Gefäß ist aus Alabaster statt aus Glas; eine passende Nachfüllkerze ist erhältlich. Der Duft beginnt mit Zitrone und Myrte, entwickelt sich über Zedernholz und Schwarze Feige und klingt mit Kaschmirholz und Moschus aus.",
      "en": "Scented candle “Cyrnos” from The Alabasters line: the vessel is made of alabaster instead of glass; a matching refill candle is available. The scent opens with Lemon and Myrtle, moves on to Cedarwood and Black fig and settles on Cashmere wood and Musk.",
      "fr": "Bougie parfumée « Cyrnos » de la ligne The Alabasters : le contenant est en albâtre et non en verre ; une recharge assortie existe. Le parfum s’ouvre sur Citron et Myrte, évolue vers Bois de cèdre et Figue noire et se pose sur Bois de cachemire et Musc.",
      "it": "Candela profumata “Cyrnos” della linea The Alabasters: il contenitore è in alabastro anziché in vetro; è disponibile una ricarica abbinata. Il profumo si apre con Limone e Mirto, prosegue con Legno di cedro e Fico nero e si chiude con Legno di cashmere e Musk."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Zitrone, Myrte, Thymian",
        "en": "Top notes: Lemon, Myrtle, Thyme",
        "fr": "Notes de tête : Citron, Myrte, Thym",
        "it": "Note di testa: Limone, Mirto, Timo"
      },
      {
        "de": "Herznoten: Zedernholz, Schwarze Feige, Lavendel, Kiefer",
        "en": "Heart notes: Cedarwood, Black fig, Lavender, Pine",
        "fr": "Notes de cœur : Bois de cèdre, Figue noire, Lavande, Pin",
        "it": "Note di cuore: Legno di cedro, Fico nero, Lavanda, Pino"
      },
      {
        "de": "Basisnoten: Kaschmirholz, Moschus, Patschuli",
        "en": "Base notes: Cashmere wood, Musk, Patchouli",
        "fr": "Notes de fond : Bois de cachemire, Musc, Patchouli",
        "it": "Note di fondo: Legno di cashmere, Musk, Patchouli"
      },
      {
        "de": "Kerze 270 g: H 10,5 cm · Ø 9 cm · 270 g · Brenndauer ca. 55–60 h",
        "en": "Candle 270 g: H 10,5 cm · Ø 9 cm · 270 g · Burn time approx. 55–60 h",
        "fr": "Bougie 270 g: H 10,5 cm · Ø 9 cm · 270 g · Durée de combustion env. 55–60 h",
        "it": "Candela 270 g: H 10,5 cm · Ø 9 cm · 270 g · Durata di combustione circa 55–60 h"
      },
      {
        "de": "Nachfüllkerze 270 g: H 10,5 cm · Ø 9 cm · 270 g · Brenndauer ca. 55–60 h",
        "en": "Refill 270 g: H 10,5 cm · Ø 9 cm · 270 g · Burn time approx. 55–60 h",
        "fr": "Recharge 270 g: H 10,5 cm · Ø 9 cm · 270 g · Durée de combustion env. 55–60 h",
        "it": "Ricarica 270 g: H 10,5 cm · Ø 9 cm · 270 g · Durata di combustione circa 55–60 h"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-cyrnos-the-alabasters-1-opt.webp",
        "width": 780,
        "height": 975,
        "alt": {
          "de": "Cire Trudon The Alabasters - Cyrnos – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon The Alabasters - Cyrnos – product view on a light background",
          "fr": "Cire Trudon The Alabasters - Cyrnos – vue du produit sur fond clair",
          "it": "Cire Trudon The Alabasters - Cyrnos – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_alb_tres_classic_candle_1200x1200_beige_1_3.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-cyrnos-the-alabasters-2.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon The Alabasters - Cyrnos – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon The Alabasters - Cyrnos – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon The Alabasters - Cyrnos – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon The Alabasters - Cyrnos – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_alabaster_in_situ_ecom_2.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/cyrnos-alabasterkerze-270g.html",
    "quellen": [
      "https://trudon.com/eu_de/cyrnos-alabasterkerze-270g.html",
      "https://trudon.com/eu_de/cyrnos-nachfuellungen-alabasterkerze-270g.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-cyrnos-duftkerze",
      "cire-trudon-cyrnos-diffuser",
      "cire-trudon-cyrnos-raumspray",
      "cire-trudon-cyrnos-kameen"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Kerze 270 g",
            "en": "Candle 270 g",
            "fr": "Bougie 270 g",
            "it": "Candela 270 g"
          },
          "betrag": 165,
          "sku": "ALB/270/CYR",
          "inhaltG": 270
        },
        {
          "name": {
            "de": "Nachfüllkerze 270 g",
            "en": "Refill 270 g",
            "fr": "Recharge 270 g",
            "it": "Ricarica 270 g"
          },
          "betrag": 78,
          "sku": "ALB/270/RCYR",
          "inhaltG": 270
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/cyrnos-alabasterkerze-270g.html"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Format",
          "en": "Format",
          "fr": "Format",
          "it": "Formato"
        },
        "optionen": [
          {
            "id": "kerze-270-g",
            "name": {
              "de": "Kerze 270 g",
              "en": "Candle 270 g",
              "fr": "Bougie 270 g",
              "it": "Candela 270 g"
            },
            "code": "ALB/270/CYR",
            "betrag": 165,
            "standard": true
          },
          {
            "id": "nachfullkerze-270-g",
            "name": {
              "de": "Nachfüllkerze 270 g",
              "en": "Refill 270 g",
              "fr": "Recharge 270 g",
              "it": "Ricarica 270 g"
            },
            "code": "ALB/270/RCYR",
            "betrag": 78
          }
        ]
      }
    ]
  },
  {
    "slug": "cire-trudon-gabriel-the-alabasters",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "duftkerze",
    "name": "The Alabasters - Gabriel",
    "kurz": {
      "de": "Duftkerze „Gabriel“ aus der Reihe The Alabasters: Das Gefäß ist aus Alabaster statt aus Glas; eine passende Nachfüllkerze ist erhältlich. Der Duft beginnt mit Birke und Kandierte Maronen, entwickelt sich über Kaschmirholz und Moos und klingt mit Zedernholz und Moschus aus.",
      "en": "Scented candle “Gabriel” from The Alabasters line: the vessel is made of alabaster instead of glass; a matching refill candle is available. The scent opens with Birch and Candied chestnuts, moves on to Cashmere wood and Moss and settles on Cedarwood and Musk.",
      "fr": "Bougie parfumée « Gabriel » de la ligne The Alabasters : le contenant est en albâtre et non en verre ; une recharge assortie existe. Le parfum s’ouvre sur Bouleau et Marrons glacés, évolue vers Bois de cachemire et Mousse et se pose sur Bois de cèdre et Musc.",
      "it": "Candela profumata “Gabriel” della linea The Alabasters: il contenitore è in alabastro anziché in vetro; è disponibile una ricarica abbinata. Il profumo si apre con Betulla e Marron glacé, prosegue con Legno di cashmere e Muschio vegetale e si chiude con Legno di cedro e Musk."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Birke, Kandierte Maronen",
        "en": "Top notes: Birch, Candied chestnuts",
        "fr": "Notes de tête : Bouleau, Marrons glacés",
        "it": "Note di testa: Betulla, Marron glacé"
      },
      {
        "de": "Herznoten: Kaschmirholz, Moos",
        "en": "Heart notes: Cashmere wood, Moss",
        "fr": "Notes de cœur : Bois de cachemire, Mousse",
        "it": "Note di cuore: Legno di cashmere, Muschio vegetale"
      },
      {
        "de": "Basisnoten: Zedernholz, Moschus, Patschuli",
        "en": "Base notes: Cedarwood, Musk, Patchouli",
        "fr": "Notes de fond : Bois de cèdre, Musc, Patchouli",
        "it": "Note di fondo: Legno di cedro, Musk, Patchouli"
      },
      {
        "de": "Kerze 270 g: H 10,5 cm · Ø 9 cm · 270 g · Brenndauer ca. 55–60 h",
        "en": "Candle 270 g: H 10,5 cm · Ø 9 cm · 270 g · Burn time approx. 55–60 h",
        "fr": "Bougie 270 g: H 10,5 cm · Ø 9 cm · 270 g · Durée de combustion env. 55–60 h",
        "it": "Candela 270 g: H 10,5 cm · Ø 9 cm · 270 g · Durata di combustione circa 55–60 h"
      },
      {
        "de": "Nachfüllkerze 270 g: H 10,5 cm · Ø 9 cm · 270 g · Brenndauer ca. 55–60 h",
        "en": "Refill 270 g: H 10,5 cm · Ø 9 cm · 270 g · Burn time approx. 55–60 h",
        "fr": "Recharge 270 g: H 10,5 cm · Ø 9 cm · 270 g · Durée de combustion env. 55–60 h",
        "it": "Ricarica 270 g: H 10,5 cm · Ø 9 cm · 270 g · Durata di combustione circa 55–60 h"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-gabriel-the-alabasters-1-opt.webp",
        "width": 780,
        "height": 975,
        "alt": {
          "de": "Cire Trudon The Alabasters - Gabriel – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon The Alabasters - Gabriel – product view on a light background",
          "fr": "Cire Trudon The Alabasters - Gabriel – vue du produit sur fond clair",
          "it": "Cire Trudon The Alabasters - Gabriel – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_alb_tres_classic_candle_1200x1200_beige_1_1.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-gabriel-the-alabasters-2.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon The Alabasters - Gabriel – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon The Alabasters - Gabriel – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon The Alabasters - Gabriel – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon The Alabasters - Gabriel – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_alabaster_in_situ_ecom_3.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/gabriel-alabasterkerze-270g.html",
    "quellen": [
      "https://trudon.com/eu_de/gabriel-alabasterkerze-270g.html",
      "https://trudon.com/eu_de/gabriel-nachfuellungen-alabasterkerze-270g.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-gabriel-duftkerze",
      "cire-trudon-gabriel-diffuser",
      "cire-trudon-gabriel-kameen"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Kerze 270 g",
            "en": "Candle 270 g",
            "fr": "Bougie 270 g",
            "it": "Candela 270 g"
          },
          "betrag": 165,
          "sku": "ALB/270/GAB",
          "inhaltG": 270
        },
        {
          "name": {
            "de": "Nachfüllkerze 270 g",
            "en": "Refill 270 g",
            "fr": "Recharge 270 g",
            "it": "Ricarica 270 g"
          },
          "betrag": 78,
          "sku": "ALB/270/RGAB",
          "inhaltG": 270
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/gabriel-alabasterkerze-270g.html"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Format",
          "en": "Format",
          "fr": "Format",
          "it": "Formato"
        },
        "optionen": [
          {
            "id": "kerze-270-g",
            "name": {
              "de": "Kerze 270 g",
              "en": "Candle 270 g",
              "fr": "Bougie 270 g",
              "it": "Candela 270 g"
            },
            "code": "ALB/270/GAB",
            "betrag": 165,
            "standard": true
          },
          {
            "id": "nachfullkerze-270-g",
            "name": {
              "de": "Nachfüllkerze 270 g",
              "en": "Refill 270 g",
              "fr": "Recharge 270 g",
              "it": "Ricarica 270 g"
            },
            "code": "ALB/270/RGAB",
            "betrag": 78
          }
        ]
      }
    ]
  },
  {
    "slug": "cire-trudon-figuerie-diffuser",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "diffuser",
    "name": "The Diffuser - Figuerie",
    "kurz": {
      "de": "Duftdiffuser „Figuerie“ für den Raum, im Shop als Diffuser und als Nachfüllflasche in mehreren Formaten geführt. Der Duft beginnt mit Zedernblatt und Feigenblätter, entwickelt sich über Hyazinthe und Kopaivabalsam und klingt mit Sandalwood und Tonkabohnen aus.",
      "en": "Room diffuser “Figuerie”, offered as a diffuser and as a refill bottle in several formats. The scent opens with Cedar leaf and Fig leaves, moves on to Hyacinth and Copaiba balsam and settles on Sandalwood and Tonka bean.",
      "fr": "Diffuseur d’intérieur « Figuerie », proposé en diffuseur et en recharge, en plusieurs formats. Le parfum s’ouvre sur Feuille de cèdre et Feuilles de figuier, évolue vers Jacinthe et Baume de copahu et se pose sur Bois de santal et Fève tonka.",
      "it": "Diffusore per ambienti “Figuerie”, disponibile come diffusore e come ricarica in più formati. Il profumo si apre con Foglia di cedro e Foglie di fico, prosegue con Giacinto e Balsamo di copaiba e si chiude con Legno di sandalo e Fava tonka."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Zedernblatt, Feigenblätter, Ätherischer Humus",
        "en": "Top notes: Cedar leaf, Fig leaves, Earthy humus",
        "fr": "Notes de tête : Feuille de cèdre, Feuilles de figuier, Humus",
        "it": "Note di testa: Foglia di cedro, Foglie di fico, Humus"
      },
      {
        "de": "Herznoten: Hyazinthe, Kopaivabalsam, Grünes Bouquet",
        "en": "Heart notes: Hyacinth, Copaiba balsam, Green bouquet",
        "fr": "Notes de cœur : Jacinthe, Baume de copahu, Bouquet vert",
        "it": "Note di cuore: Giacinto, Balsamo di copaiba, Bouquet verde"
      },
      {
        "de": "Basisnoten: Sandalwood, Tonkabohnen, Tasuki Patchouli, Moos-Kristalle",
        "en": "Base notes: Sandalwood, Tonka bean, Tasuki patchouli, Moss crystals",
        "fr": "Notes de fond : Bois de santal, Fève tonka, Patchouli Tasuki, Cristaux de mousse",
        "it": "Note di fondo: Legno di sandalo, Fava tonka, Patchouli Tasuki, Cristalli di muschio"
      },
      {
        "de": "Diffuser 350 ml: 350 ml",
        "en": "Diffuser 350 ml: 350 ml",
        "fr": "Diffuseur 350 ml: 350 ml",
        "it": "Diffusore 350 ml: 350 ml"
      },
      {
        "de": "Diffuser 1000 ml: 1000 ml",
        "en": "Diffuser 1000 ml: 1000 ml",
        "fr": "Diffuseur 1000 ml: 1000 ml",
        "it": "Diffusore 1000 ml: 1000 ml"
      },
      {
        "de": "Nachfüllflasche 300 ml: 300 ml",
        "en": "Refill bottle 300 ml: 300 ml",
        "fr": "Recharge 300 ml: 300 ml",
        "it": "Ricarica 300 ml: 300 ml"
      },
      {
        "de": "Nachfüllflasche 1000 ml: 1000 ml",
        "en": "Refill bottle 1000 ml: 1000 ml",
        "fr": "Recharge 1000 ml: 1000 ml",
        "it": "Ricarica 1000 ml: 1000 ml"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-figuerie-diffuser-1-opt.webp",
        "width": 853,
        "height": 1066,
        "alt": {
          "de": "Cire Trudon The Diffuser - Figuerie – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon The Diffuser - Figuerie – product view on a light background",
          "fr": "Cire Trudon The Diffuser - Figuerie – vue du produit sur fond clair",
          "it": "Cire Trudon The Diffuser - Figuerie – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/d/i/diffuseur_c_ladon_350_1200x1200.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-figuerie-diffuser-2.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon The Diffuser - Figuerie – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon The Diffuser - Figuerie – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon The Diffuser - Figuerie – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon The Diffuser - Figuerie – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_figuerie08_2.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-figuerie-diffuser-3.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon The Diffuser - Figuerie – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon The Diffuser - Figuerie – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon The Diffuser - Figuerie – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon The Diffuser - Figuerie – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_figuerie07_2.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/figuerie-diffuser-350ml.html",
    "quellen": [
      "https://trudon.com/eu_de/figuerie-diffuser-350ml.html",
      "https://trudon.com/eu_de/figuerie-grosse-diffuser-1000ml.html",
      "https://trudon.com/eu_de/figuerie-diffuser-nachfuellung-300ml.html",
      "https://trudon.com/eu_de/figuerie-nachfue-llung-grosse-diffuser-1000ml.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-figuerie-duftkerze",
      "cire-trudon-figuerie-raumspray"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Diffuser 350 ml",
            "en": "Diffuser 350 ml",
            "fr": "Diffuseur 350 ml",
            "it": "Diffusore 350 ml"
          },
          "betrag": 175,
          "sku": "TFIG00035008XS001",
          "inhaltMl": 350,
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Diffuser 1000 ml",
            "en": "Diffuser 1000 ml",
            "fr": "Diffuseur 1000 ml",
            "it": "Diffusore 1000 ml"
          },
          "betrag": 320,
          "sku": "TFIG00100008XS002",
          "inhaltMl": 1000,
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Nachfüllflasche 300 ml",
            "en": "Refill bottle 300 ml",
            "fr": "Recharge 300 ml",
            "it": "Ricarica 300 ml"
          },
          "betrag": 82,
          "sku": "TFIG00030008RS001",
          "inhaltMl": 300
        },
        {
          "name": {
            "de": "Nachfüllflasche 1000 ml",
            "en": "Refill bottle 1000 ml",
            "fr": "Recharge 1000 ml",
            "it": "Ricarica 1000 ml"
          },
          "betrag": 160,
          "sku": "TFIG00100008RS002",
          "inhaltMl": 1000
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/figuerie-diffuser-350ml.html"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Format",
          "en": "Format",
          "fr": "Format",
          "it": "Formato"
        },
        "optionen": [
          {
            "id": "diffuser-350-ml",
            "name": {
              "de": "Diffuser 350 ml",
              "en": "Diffuser 350 ml",
              "fr": "Diffuseur 350 ml",
              "it": "Diffusore 350 ml"
            },
            "code": "TFIG00035008XS001",
            "betrag": 175,
            "standard": true
          },
          {
            "id": "diffuser-1000-ml",
            "name": {
              "de": "Diffuser 1000 ml",
              "en": "Diffuser 1000 ml",
              "fr": "Diffuseur 1000 ml",
              "it": "Diffusore 1000 ml"
            },
            "code": "TFIG00100008XS002",
            "betrag": 320
          },
          {
            "id": "nachfullflasche-300-ml",
            "name": {
              "de": "Nachfüllflasche 300 ml",
              "en": "Refill bottle 300 ml",
              "fr": "Recharge 300 ml",
              "it": "Ricarica 300 ml"
            },
            "code": "TFIG00030008RS001",
            "betrag": 82
          },
          {
            "id": "nachfullflasche-1000-ml",
            "name": {
              "de": "Nachfüllflasche 1000 ml",
              "en": "Refill bottle 1000 ml",
              "fr": "Recharge 1000 ml",
              "it": "Ricarica 1000 ml"
            },
            "code": "TFIG00100008RS002",
            "betrag": 160
          }
        ]
      }
    ]
  },
  {
    "slug": "cire-trudon-abd-el-kader-diffuser",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "diffuser",
    "name": "The Diffuser - Abd El Kader",
    "kurz": {
      "de": "Duftdiffuser „Abd El Kader“ für den Raum, im Shop als Diffuser und als Nachfüllflasche in mehreren Formaten geführt. Der Duft beginnt mit Schwarze-Johannisbeere-Knospen und Zitrone, entwickelt sich über Jasmin und klingt mit Vanille aus.",
      "en": "Room diffuser “Abd El Kader”, offered as a diffuser and as a refill bottle in several formats. The scent opens with Blackcurrant buds and Lemon, moves on to Jasmine and settles on Vanilla.",
      "fr": "Diffuseur d’intérieur « Abd El Kader », proposé en diffuseur et en recharge, en plusieurs formats. Le parfum s’ouvre sur Bourgeons de cassis et Citron, évolue vers Jasmin et se pose sur Vanille.",
      "it": "Diffusore per ambienti “Abd El Kader”, disponibile come diffusore e come ricarica in più formati. Il profumo si apre con Gemme di ribes nero e Limone, prosegue con Gelsomino e si chiude con Vaniglia."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Schwarze-Johannisbeere-Knospen, Zitrone, Ingwer, Gewürznelke, Grüne Minze, Apfel",
        "en": "Top notes: Blackcurrant buds, Lemon, Ginger, Clove, Spearmint, Apple",
        "fr": "Notes de tête : Bourgeons de cassis, Citron, Gingembre, Clou de girofle, Menthe verte, Pomme",
        "it": "Note di testa: Gemme di ribes nero, Limone, Zenzero, Chiodo di garofano, Menta verde, Mela"
      },
      {
        "de": "Herznoten: Jasmin",
        "en": "Heart notes: Jasmine",
        "fr": "Notes de cœur : Jasmin",
        "it": "Note di cuore: Gelsomino"
      },
      {
        "de": "Basisnoten: Vanille",
        "en": "Base notes: Vanilla",
        "fr": "Notes de fond : Vanille",
        "it": "Note di fondo: Vaniglia"
      },
      {
        "de": "Diffuser 350 ml: 350 ml",
        "en": "Diffuser 350 ml: 350 ml",
        "fr": "Diffuseur 350 ml: 350 ml",
        "it": "Diffusore 350 ml: 350 ml"
      },
      {
        "de": "Nachfüllflasche 300 ml: 300 ml",
        "en": "Refill bottle 300 ml: 300 ml",
        "fr": "Recharge 300 ml: 300 ml",
        "it": "Ricarica 300 ml: 300 ml"
      },
      {
        "de": "Nachfüllflasche 1000 ml: 1000 ml",
        "en": "Refill bottle 1000 ml: 1000 ml",
        "fr": "Recharge 1000 ml: 1000 ml",
        "it": "Ricarica 1000 ml: 1000 ml"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-abd-el-kader-diffuser-1-opt.webp",
        "width": 836,
        "height": 1045,
        "alt": {
          "de": "Cire Trudon The Diffuser - Abd El Kader – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon The Diffuser - Abd El Kader – product view on a light background",
          "fr": "Cire Trudon The Diffuser - Abd El Kader – vue du produit sur fond clair",
          "it": "Cire Trudon The Diffuser - Abd El Kader – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/d/i/diffuseur_antique_350_1200x1200.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-abd-el-kader-diffuser-2.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon The Diffuser - Abd El Kader – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon The Diffuser - Abd El Kader – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon The Diffuser - Abd El Kader – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon The Diffuser - Abd El Kader – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_-_380th_anniversary_-_warning_mentionner_photo_retouch_e_15__3.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/abd-el-kader-diffuser-350ml.html",
    "quellen": [
      "https://trudon.com/eu_de/abd-el-kader-diffuser-350ml.html",
      "https://trudon.com/eu_de/abd-el-kader-grosse-diffuser-1000ml.html",
      "https://trudon.com/eu_de/abd-el-kader-diffuser-nachfuellung-300ml.html",
      "https://trudon.com/eu_de/abd-el-kader-nachfue-llung-grosse-diffuser-1000ml.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-abd-el-kader-duftkerze",
      "cire-trudon-abd-el-kader-the-alabasters",
      "cire-trudon-abd-el-kader-raumspray",
      "cire-trudon-abd-el-kader-kameen"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Diffuser 350 ml",
            "en": "Diffuser 350 ml",
            "fr": "Diffuseur 350 ml",
            "it": "Diffusore 350 ml"
          },
          "betrag": 175,
          "sku": "DIF/350/ABD",
          "inhaltMl": 350,
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Diffuser 1000 ml",
            "en": "Diffuser 1000 ml",
            "fr": "Diffuseur 1000 ml",
            "it": "Diffusore 1000 ml"
          },
          "betrag": 320,
          "sku": "DIF/1000/ABD/KIT",
          "inhaltMl": 1000,
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Nachfüllflasche 300 ml",
            "en": "Refill bottle 300 ml",
            "fr": "Recharge 300 ml",
            "it": "Ricarica 300 ml"
          },
          "betrag": 82,
          "sku": "DIF/350/R/ABD",
          "inhaltMl": 300
        },
        {
          "name": {
            "de": "Nachfüllflasche 1000 ml",
            "en": "Refill bottle 1000 ml",
            "fr": "Recharge 1000 ml",
            "it": "Ricarica 1000 ml"
          },
          "betrag": 160,
          "sku": "DIF/1000/R/ABD/KIT",
          "inhaltMl": 1000
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/abd-el-kader-diffuser-350ml.html"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Format",
          "en": "Format",
          "fr": "Format",
          "it": "Formato"
        },
        "optionen": [
          {
            "id": "diffuser-350-ml",
            "name": {
              "de": "Diffuser 350 ml",
              "en": "Diffuser 350 ml",
              "fr": "Diffuseur 350 ml",
              "it": "Diffusore 350 ml"
            },
            "code": "DIF/350/ABD",
            "betrag": 175,
            "standard": true
          },
          {
            "id": "diffuser-1000-ml",
            "name": {
              "de": "Diffuser 1000 ml",
              "en": "Diffuser 1000 ml",
              "fr": "Diffuseur 1000 ml",
              "it": "Diffusore 1000 ml"
            },
            "code": "DIF/1000/ABD/KIT",
            "betrag": 320
          },
          {
            "id": "nachfullflasche-300-ml",
            "name": {
              "de": "Nachfüllflasche 300 ml",
              "en": "Refill bottle 300 ml",
              "fr": "Recharge 300 ml",
              "it": "Ricarica 300 ml"
            },
            "code": "DIF/350/R/ABD",
            "betrag": 82
          },
          {
            "id": "nachfullflasche-1000-ml",
            "name": {
              "de": "Nachfüllflasche 1000 ml",
              "en": "Refill bottle 1000 ml",
              "fr": "Recharge 1000 ml",
              "it": "Ricarica 1000 ml"
            },
            "code": "DIF/1000/R/ABD/KIT",
            "betrag": 160
          }
        ]
      }
    ]
  },
  {
    "slug": "cire-trudon-ernesto-diffuser",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "diffuser",
    "name": "The Diffuser - Ernesto",
    "kurz": {
      "de": "Duftdiffuser „Ernesto“ für den Raum, im Shop als Diffuser und als Nachfüllflasche in mehreren Formaten geführt. Der Duft beginnt mit Bergamote und Grapefruit, entwickelt sich über Eiche und Gewürznelke und klingt mit Tabak und Bernstein aus.",
      "en": "Room diffuser “Ernesto”, offered as a diffuser and as a refill bottle in several formats. The scent opens with Bergamot and Grapefruit, moves on to Oak and Clove and settles on Tobacco and Amber.",
      "fr": "Diffuseur d’intérieur « Ernesto », proposé en diffuseur et en recharge, en plusieurs formats. Le parfum s’ouvre sur Bergamote et Pamplemousse, évolue vers Chêne et Clou de girofle et se pose sur Tabac et Ambre.",
      "it": "Diffusore per ambienti “Ernesto”, disponibile come diffusore e come ricarica in più formati. Il profumo si apre con Bergamotto e Pompelmo, prosegue con Quercia e Chiodo di garofano e si chiude con Tabacco e Ambra."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Bergamote, Grapefruit, Rum",
        "en": "Top notes: Bergamot, Grapefruit, Rum",
        "fr": "Notes de tête : Bergamote, Pamplemousse, Rhum",
        "it": "Note di testa: Bergamotto, Pompelmo, Rum"
      },
      {
        "de": "Herznoten: Eiche, Gewürznelke, Labdanum, Patschuli",
        "en": "Heart notes: Oak, Clove, Labdanum, Patchouli",
        "fr": "Notes de cœur : Chêne, Clou de girofle, Labdanum, Patchouli",
        "it": "Note di cuore: Quercia, Chiodo di garofano, Labdano, Patchouli"
      },
      {
        "de": "Basisnoten: Tabak, Bernstein, Leder, Moos, Vanille",
        "en": "Base notes: Tobacco, Amber, Leather, Moss, Vanilla",
        "fr": "Notes de fond : Tabac, Ambre, Cuir, Mousse, Vanille",
        "it": "Note di fondo: Tabacco, Ambra, Cuoio, Muschio vegetale, Vaniglia"
      },
      {
        "de": "Diffuser 350 ml: 350 ml",
        "en": "Diffuser 350 ml: 350 ml",
        "fr": "Diffuseur 350 ml: 350 ml",
        "it": "Diffusore 350 ml: 350 ml"
      },
      {
        "de": "Nachfüllflasche 300 ml: 300 ml",
        "en": "Refill bottle 300 ml: 300 ml",
        "fr": "Recharge 300 ml: 300 ml",
        "it": "Ricarica 300 ml: 300 ml"
      },
      {
        "de": "Nachfüllflasche 1000 ml: 1000 ml",
        "en": "Refill bottle 1000 ml: 1000 ml",
        "fr": "Recharge 1000 ml: 1000 ml",
        "it": "Ricarica 1000 ml: 1000 ml"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-ernesto-diffuser-1-opt.webp",
        "width": 836,
        "height": 1045,
        "alt": {
          "de": "Cire Trudon The Diffuser - Ernesto – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon The Diffuser - Ernesto – product view on a light background",
          "fr": "Cire Trudon The Diffuser - Ernesto – vue du produit sur fond clair",
          "it": "Cire Trudon The Diffuser - Ernesto – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/d/i/diffuseur_antique_350_1200x1200_1.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-ernesto-diffuser-2.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon The Diffuser - Ernesto – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon The Diffuser - Ernesto – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon The Diffuser - Ernesto – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon The Diffuser - Ernesto – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_-_380th_anniversary_-_warning_mentionner_photo_retouch_e_61_copie_2.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/ernesto-diffuser-350ml.html",
    "quellen": [
      "https://trudon.com/eu_de/ernesto-diffuser-350ml.html",
      "https://trudon.com/eu_de/ernesto-grosse-diffuser-1000ml.html",
      "https://trudon.com/eu_de/ernesto-diffuser-nachfuellung-300ml.html",
      "https://trudon.com/eu_de/ernesto-nachfue-llung-grosse-diffuser-1000ml.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-ernesto-duftkerze",
      "cire-trudon-ernesto-the-alabasters",
      "cire-trudon-ernesto-raumspray",
      "cire-trudon-ernesto-kameen"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Diffuser 350 ml",
            "en": "Diffuser 350 ml",
            "fr": "Diffuseur 350 ml",
            "it": "Diffusore 350 ml"
          },
          "betrag": 175,
          "sku": "DIF/350/ERN",
          "inhaltMl": 350,
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Diffuser 1000 ml",
            "en": "Diffuser 1000 ml",
            "fr": "Diffuseur 1000 ml",
            "it": "Diffusore 1000 ml"
          },
          "betrag": 320,
          "sku": "DIF/1000/ERN/KIT",
          "inhaltMl": 1000,
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Nachfüllflasche 300 ml",
            "en": "Refill bottle 300 ml",
            "fr": "Recharge 300 ml",
            "it": "Ricarica 300 ml"
          },
          "betrag": 82,
          "sku": "DIF/350/R/ERN",
          "inhaltMl": 300
        },
        {
          "name": {
            "de": "Nachfüllflasche 1000 ml",
            "en": "Refill bottle 1000 ml",
            "fr": "Recharge 1000 ml",
            "it": "Ricarica 1000 ml"
          },
          "betrag": 160,
          "sku": "DIF/1000/R/ERN/KIT",
          "inhaltMl": 1000
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/ernesto-diffuser-350ml.html"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Format",
          "en": "Format",
          "fr": "Format",
          "it": "Formato"
        },
        "optionen": [
          {
            "id": "diffuser-350-ml",
            "name": {
              "de": "Diffuser 350 ml",
              "en": "Diffuser 350 ml",
              "fr": "Diffuseur 350 ml",
              "it": "Diffusore 350 ml"
            },
            "code": "DIF/350/ERN",
            "betrag": 175,
            "standard": true
          },
          {
            "id": "diffuser-1000-ml",
            "name": {
              "de": "Diffuser 1000 ml",
              "en": "Diffuser 1000 ml",
              "fr": "Diffuseur 1000 ml",
              "it": "Diffusore 1000 ml"
            },
            "code": "DIF/1000/ERN/KIT",
            "betrag": 320
          },
          {
            "id": "nachfullflasche-300-ml",
            "name": {
              "de": "Nachfüllflasche 300 ml",
              "en": "Refill bottle 300 ml",
              "fr": "Recharge 300 ml",
              "it": "Ricarica 300 ml"
            },
            "code": "DIF/350/R/ERN",
            "betrag": 82
          },
          {
            "id": "nachfullflasche-1000-ml",
            "name": {
              "de": "Nachfüllflasche 1000 ml",
              "en": "Refill bottle 1000 ml",
              "fr": "Recharge 1000 ml",
              "it": "Ricarica 1000 ml"
            },
            "code": "DIF/1000/R/ERN/KIT",
            "betrag": 160
          }
        ]
      }
    ]
  },
  {
    "slug": "cire-trudon-josephine-diffuser",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "diffuser",
    "name": "The Diffuser - Joséphine",
    "kurz": {
      "de": "Duftdiffuser „Joséphine“ für den Raum, im Shop als Diffuser und als Nachfüllflasche in mehreren Formaten geführt. Der Duft beginnt mit Bergamote und Kaffernlimette, entwickelt sich über Chinesische Kamelie und Ägyptischer Jasmin und klingt mit Schwertlilien und Weiße Moschusdüfte aus.",
      "en": "Room diffuser “Joséphine”, offered as a diffuser and as a refill bottle in several formats. The scent opens with Bergamot and Kaffir lime, moves on to Chinese camellia and Egyptian jasmine and settles on Iris and White musks.",
      "fr": "Diffuseur d’intérieur « Joséphine », proposé en diffuseur et en recharge, en plusieurs formats. Le parfum s’ouvre sur Bergamote et Combava, évolue vers Camélia de Chine et Jasmin d’Égypte et se pose sur Iris et Muscs blancs.",
      "it": "Diffusore per ambienti “Joséphine”, disponibile come diffusore e come ricarica in più formati. Il profumo si apre con Bergamotto e Lime kaffir, prosegue con Camelia cinese e Gelsomino egiziano e si chiude con Iris e Muschi bianchi."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Bergamote, Kaffernlimette, Gewürze",
        "en": "Top notes: Bergamot, Kaffir lime, Spices",
        "fr": "Notes de tête : Bergamote, Combava, Épices",
        "it": "Note di testa: Bergamotto, Lime kaffir, Spezie"
      },
      {
        "de": "Herznoten: Chinesische Kamelie, Ägyptischer Jasmin, Türkische Rose",
        "en": "Heart notes: Chinese camellia, Egyptian jasmine, Turkish rose",
        "fr": "Notes de cœur : Camélia de Chine, Jasmin d’Égypte, Rose de Turquie",
        "it": "Note di cuore: Camelia cinese, Gelsomino egiziano, Rosa turca"
      },
      {
        "de": "Basisnoten: Schwertlilien, Weiße Moschusdüfte, Santal d'Indonésie",
        "en": "Base notes: Iris, White musks, Indonesian sandalwood",
        "fr": "Notes de fond : Iris, Muscs blancs, Santal d’Indonésie",
        "it": "Note di fondo: Iris, Muschi bianchi, Sandalo indonesiano"
      },
      {
        "de": "Diffuser 350 ml: 350 ml",
        "en": "Diffuser 350 ml: 350 ml",
        "fr": "Diffuseur 350 ml: 350 ml",
        "it": "Diffusore 350 ml: 350 ml"
      },
      {
        "de": "Nachfüllflasche 300 ml: 300 ml",
        "en": "Refill bottle 300 ml: 300 ml",
        "fr": "Recharge 300 ml: 300 ml",
        "it": "Ricarica 300 ml: 300 ml"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-josephine-diffuser-1-opt.webp",
        "width": 836,
        "height": 1045,
        "alt": {
          "de": "Cire Trudon The Diffuser - Joséphine – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon The Diffuser - Joséphine – product view on a light background",
          "fr": "Cire Trudon The Diffuser - Joséphine – vue du produit sur fond clair",
          "it": "Cire Trudon The Diffuser - Joséphine – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/d/i/diffuseur_antique_350_1200x1200_2.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-josephine-diffuser-2.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon The Diffuser - Joséphine – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon The Diffuser - Joséphine – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon The Diffuser - Joséphine – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon The Diffuser - Joséphine – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_-_380th_anniversary_-_warning_mentionner_photo_retouch_e_61_copie_2_4.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/josephine-diffuser-350ml.html",
    "quellen": [
      "https://trudon.com/eu_de/josephine-diffuser-350ml.html",
      "https://trudon.com/eu_de/josephine-diffuser-nachfuellung-300ml.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-josephine-duftkerze",
      "cire-trudon-josephine-raumspray",
      "cire-trudon-josephine-kameen"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Diffuser 350 ml",
            "en": "Diffuser 350 ml",
            "fr": "Diffuseur 350 ml",
            "it": "Diffusore 350 ml"
          },
          "betrag": 175,
          "sku": "DIF/350/JOS",
          "inhaltMl": 350,
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Nachfüllflasche 300 ml",
            "en": "Refill bottle 300 ml",
            "fr": "Recharge 300 ml",
            "it": "Ricarica 300 ml"
          },
          "betrag": 82,
          "sku": "DIF/350/R/JOS",
          "inhaltMl": 300
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/josephine-diffuser-350ml.html"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Format",
          "en": "Format",
          "fr": "Format",
          "it": "Formato"
        },
        "optionen": [
          {
            "id": "diffuser-350-ml",
            "name": {
              "de": "Diffuser 350 ml",
              "en": "Diffuser 350 ml",
              "fr": "Diffuseur 350 ml",
              "it": "Diffusore 350 ml"
            },
            "code": "DIF/350/JOS",
            "betrag": 175,
            "standard": true
          },
          {
            "id": "nachfullflasche-300-ml",
            "name": {
              "de": "Nachfüllflasche 300 ml",
              "en": "Refill bottle 300 ml",
              "fr": "Recharge 300 ml",
              "it": "Ricarica 300 ml"
            },
            "code": "DIF/350/R/JOS",
            "betrag": 82
          }
        ]
      }
    ]
  },
  {
    "slug": "cire-trudon-cyrnos-diffuser",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "diffuser",
    "name": "The Diffuser - Cyrnos",
    "kurz": {
      "de": "Duftdiffuser „Cyrnos“ für den Raum, im Shop als Diffuser und als Nachfüllflasche in mehreren Formaten geführt.",
      "en": "Room diffuser “Cyrnos”, offered as a diffuser and as a refill bottle in several formats.",
      "fr": "Diffuseur d’intérieur « Cyrnos », proposé en diffuseur et en recharge, en plusieurs formats.",
      "it": "Diffusore per ambienti “Cyrnos”, disponibile come diffusore e come ricarica in più formati."
    },
    "merkmale": [
      {
        "de": "Diffuser 350 ml: 350 ml",
        "en": "Diffuser 350 ml: 350 ml",
        "fr": "Diffuseur 350 ml: 350 ml",
        "it": "Diffusore 350 ml: 350 ml"
      },
      {
        "de": "Nachfüllflasche 300 ml: 300 ml",
        "en": "Refill bottle 300 ml: 300 ml",
        "fr": "Recharge 300 ml: 300 ml",
        "it": "Ricarica 300 ml: 300 ml"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-cyrnos-diffuser-1-opt.webp",
        "width": 836,
        "height": 1045,
        "alt": {
          "de": "Cire Trudon The Diffuser - Cyrnos – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon The Diffuser - Cyrnos – product view on a light background",
          "fr": "Cire Trudon The Diffuser - Cyrnos – vue du produit sur fond clair",
          "it": "Cire Trudon The Diffuser - Cyrnos – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/d/i/diffuseur_antique_350_1200x1200_3.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-cyrnos-diffuser-2.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon The Diffuser - Cyrnos – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon The Diffuser - Cyrnos – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon The Diffuser - Cyrnos – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon The Diffuser - Cyrnos – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_-_380th_anniversary_-_warning_mentionner_photo_retouch_e_61_copie_2_1.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/cyrnos-diffuser-350ml.html",
    "quellen": [
      "https://trudon.com/eu_de/cyrnos-diffuser-350ml.html",
      "https://trudon.com/eu_de/cyrnos-diffuser-nachfuellung-300ml.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-cyrnos-duftkerze",
      "cire-trudon-cyrnos-the-alabasters",
      "cire-trudon-cyrnos-raumspray",
      "cire-trudon-cyrnos-kameen"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Diffuser 350 ml",
            "en": "Diffuser 350 ml",
            "fr": "Diffuseur 350 ml",
            "it": "Diffusore 350 ml"
          },
          "betrag": 175,
          "sku": "DIF/350/CYR",
          "inhaltMl": 350,
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Nachfüllflasche 300 ml",
            "en": "Refill bottle 300 ml",
            "fr": "Recharge 300 ml",
            "it": "Ricarica 300 ml"
          },
          "betrag": 82,
          "sku": "DIF/350/R/CYR",
          "inhaltMl": 300
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/cyrnos-diffuser-350ml.html"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Format",
          "en": "Format",
          "fr": "Format",
          "it": "Formato"
        },
        "optionen": [
          {
            "id": "diffuser-350-ml",
            "name": {
              "de": "Diffuser 350 ml",
              "en": "Diffuser 350 ml",
              "fr": "Diffuseur 350 ml",
              "it": "Diffusore 350 ml"
            },
            "code": "DIF/350/CYR",
            "betrag": 175,
            "standard": true
          },
          {
            "id": "nachfullflasche-300-ml",
            "name": {
              "de": "Nachfüllflasche 300 ml",
              "en": "Refill bottle 300 ml",
              "fr": "Recharge 300 ml",
              "it": "Ricarica 300 ml"
            },
            "code": "DIF/350/R/CYR",
            "betrag": 82
          }
        ]
      }
    ]
  },
  {
    "slug": "cire-trudon-cire-diffuser",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "diffuser",
    "name": "The Diffuser - Cire",
    "kurz": {
      "de": "Duftdiffuser „Cire“ für den Raum. Der Duft beginnt mit Bergamote und Gewachstes Holz, entwickelt sich über Bienenwachs Absolut und Ätherisches Sandelholzöl und klingt mit Tonkabohnen und Ätherisches Patschuliöl aus.",
      "en": "Room diffuser “Cire”. The scent opens with Bergamot and Waxed wood, moves on to Beeswax absolute and Sandalwood essential oil and settles on Tonka bean and Patchouli essential oil.",
      "fr": "Diffuseur d’intérieur « Cire ». Le parfum s’ouvre sur Bergamote et Bois ciré, évolue vers Absolu de cire d’abeille et Huile essentielle de santal et se pose sur Fève tonka et Huile essentielle de patchouli.",
      "it": "Diffusore per ambienti “Cire”. Il profumo si apre con Bergamotto e Legno cerato, prosegue con Assoluta di cera d’api e Olio essenziale di sandalo e si chiude con Fava tonka e Olio essenziale di patchouli."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Bergamote, Gewachstes Holz, Honig",
        "en": "Top notes: Bergamot, Waxed wood, Honey",
        "fr": "Notes de tête : Bergamote, Bois ciré, Miel",
        "it": "Note di testa: Bergamotto, Legno cerato, Miele"
      },
      {
        "de": "Herznoten: Bienenwachs Absolut, Ätherisches Sandelholzöl, Ätherisches Zimtöl",
        "en": "Heart notes: Beeswax absolute, Sandalwood essential oil, Cinnamon essential oil",
        "fr": "Notes de cœur : Absolu de cire d’abeille, Huile essentielle de santal, Huile essentielle de cannelle",
        "it": "Note di cuore: Assoluta di cera d’api, Olio essenziale di sandalo, Olio essenziale di cannella"
      },
      {
        "de": "Basisnoten: Tonkabohnen, Ätherisches Patschuliöl, Moschus, Vanille",
        "en": "Base notes: Tonka bean, Patchouli essential oil, Musk, Vanilla",
        "fr": "Notes de fond : Fève tonka, Huile essentielle de patchouli, Musc, Vanille",
        "it": "Note di fondo: Fava tonka, Olio essenziale di patchouli, Musk, Vaniglia"
      },
      {
        "de": "Inhalt 350 ml",
        "en": "Contents 350 ml",
        "fr": "Contenance 350 ml",
        "it": "Contenuto 350 ml"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-cire-diffuser-1-opt.webp",
        "width": 866,
        "height": 1082,
        "alt": {
          "de": "Cire Trudon The Diffuser - Cire – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon The Diffuser - Cire – product view on a light background",
          "fr": "Cire Trudon The Diffuser - Cire – vue du produit sur fond clair",
          "it": "Cire Trudon The Diffuser - Cire – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/d/i/diffuseur_cire_350_1200x1200.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-cire-diffuser-2.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon The Diffuser - Cire – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon The Diffuser - Cire – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon The Diffuser - Cire – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon The Diffuser - Cire – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_sm2026_spring_summer_30_1200x1200_2.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-cire-diffuser-3.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon The Diffuser - Cire – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon The Diffuser - Cire – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon The Diffuser - Cire – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon The Diffuser - Cire – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_sm2026_spring_summer_28_1200x1200_1.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/cire-diffuser-350ml.html",
    "quellen": [
      "https://trudon.com/eu_de/cire-diffuser-350ml.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-cire-duftkerze",
      "cire-trudon-cire-diffuser-nachfuellung",
      "cire-trudon-cire-raumspray",
      "cire-trudon-cire-kameen"
    ],
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/cire-diffuser-350ml.html",
      "varianten": [
        {
          "name": "350 ml",
          "betrag": 180,
          "sku": "TCIR00035008XS001",
          "inhaltMl": 350,
          "zerbrechlich": true
        }
      ]
    },
    "zubehoer": [
      {
        "slug": "cire-trudon-cire-diffuser-nachfuellung",
        "hinweis": {
          "de": "Nachfüllflasche im selben Duft",
          "en": "Refill in the same scent",
          "fr": "Recharge du même parfum",
          "it": "Ricarica della stessa fragranza"
        }
      }
    ]
  },
  {
    "slug": "cire-trudon-cire-diffuser-nachfuellung",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "diffuser",
    "name": "The Refill - Cire",
    "kurz": {
      "de": "Nachfüllflasche für den Duftdiffuser „Cire“. Der Duft beginnt mit Bergamote und Gewachstes Holz, entwickelt sich über Bienenwachs Absolut und Ätherisches Sandelholzöl und klingt mit Tonkabohnen und Ätherisches Patschuliöl aus.",
      "en": "Refill bottle for the “Cire” diffuser. The scent opens with Bergamot and Waxed wood, moves on to Beeswax absolute and Sandalwood essential oil and settles on Tonka bean and Patchouli essential oil.",
      "fr": "Recharge pour le diffuseur « Cire ». Le parfum s’ouvre sur Bergamote et Bois ciré, évolue vers Absolu de cire d’abeille et Huile essentielle de santal et se pose sur Fève tonka et Huile essentielle de patchouli.",
      "it": "Ricarica per il diffusore “Cire”. Il profumo si apre con Bergamotto e Legno cerato, prosegue con Assoluta di cera d’api e Olio essenziale di sandalo e si chiude con Fava tonka e Olio essenziale di patchouli."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Bergamote, Gewachstes Holz, Honig",
        "en": "Top notes: Bergamot, Waxed wood, Honey",
        "fr": "Notes de tête : Bergamote, Bois ciré, Miel",
        "it": "Note di testa: Bergamotto, Legno cerato, Miele"
      },
      {
        "de": "Herznoten: Bienenwachs Absolut, Ätherisches Sandelholzöl, Ätherisches Zimtöl",
        "en": "Heart notes: Beeswax absolute, Sandalwood essential oil, Cinnamon essential oil",
        "fr": "Notes de cœur : Absolu de cire d’abeille, Huile essentielle de santal, Huile essentielle de cannelle",
        "it": "Note di cuore: Assoluta di cera d’api, Olio essenziale di sandalo, Olio essenziale di cannella"
      },
      {
        "de": "Basisnoten: Tonkabohnen, Ätherisches Patschuliöl, Vanille",
        "en": "Base notes: Tonka bean, Patchouli essential oil, Vanilla",
        "fr": "Notes de fond : Fève tonka, Huile essentielle de patchouli, Vanille",
        "it": "Note di fondo: Fava tonka, Olio essenziale di patchouli, Vaniglia"
      },
      {
        "de": "Inhalt 300 ml",
        "en": "Contents 300 ml",
        "fr": "Contenance 300 ml",
        "it": "Contenuto 300 ml"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-cire-diffuser-nachfuellung-1-opt.webp",
        "width": 684,
        "height": 855,
        "alt": {
          "de": "Cire Trudon The Refill - Cire – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon The Refill - Cire – product view on a light background",
          "fr": "Cire Trudon The Refill - Cire – vue du produit sur fond clair",
          "it": "Cire Trudon The Refill - Cire – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_g_n_rique2__350ml_diffuser_refill_1200x1200_beige_1.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-cire-diffuser-nachfuellung-2.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon The Refill - Cire – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon The Refill - Cire – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon The Refill - Cire – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon The Refill - Cire – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_sm2026_spring_summer_28_1200x1200.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-cire-diffuser-nachfuellung-3.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon The Refill - Cire – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon The Refill - Cire – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon The Refill - Cire – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon The Refill - Cire – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_sm2026_spring_summer_30_1200x1200.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/cire-diffuser-nachfuellung-300ml.html",
    "quellen": [
      "https://trudon.com/eu_de/cire-diffuser-nachfuellung-300ml.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-cire-duftkerze",
      "cire-trudon-cire-diffuser",
      "cire-trudon-cire-raumspray",
      "cire-trudon-cire-kameen"
    ],
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/cire-diffuser-nachfuellung-300ml.html",
      "varianten": [
        {
          "name": "300 ml",
          "betrag": 85,
          "sku": "TCIR00030008RS001",
          "inhaltMl": 300
        }
      ]
    },
    "zubehoer": [
      {
        "slug": "cire-trudon-cire-diffuser"
      }
    ]
  },
  {
    "slug": "cire-trudon-reggio-diffuser",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "diffuser",
    "name": "The Diffuser - Reggio",
    "kurz": {
      "de": "Duftdiffuser „Reggio“ für den Raum, im Shop als Diffuser und als Nachfüllflasche in mehreren Formaten geführt.",
      "en": "Room diffuser “Reggio”, offered as a diffuser and as a refill bottle in several formats.",
      "fr": "Diffuseur d’intérieur « Reggio », proposé en diffuseur et en recharge, en plusieurs formats.",
      "it": "Diffusore per ambienti “Reggio”, disponibile come diffusore e come ricarica in più formati."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Grapefruit",
        "en": "Top notes: Grapefruit",
        "fr": "Notes de tête : Pamplemousse",
        "it": "Note di testa: Pompelmo"
      },
      {
        "de": "Herznoten: Ätherisches Mandarinöl",
        "en": "Heart notes: Mandarin essential oil",
        "fr": "Notes de cœur : Huile essentielle de mandarine",
        "it": "Note di cuore: Olio essenziale di mandarino"
      },
      {
        "de": "Diffuser 350 ml: 350 ml",
        "en": "Diffuser 350 ml: 350 ml",
        "fr": "Diffuseur 350 ml: 350 ml",
        "it": "Diffusore 350 ml: 350 ml"
      },
      {
        "de": "Nachfüllflasche 300 ml: 300 ml",
        "en": "Refill bottle 300 ml: 300 ml",
        "fr": "Recharge 300 ml: 300 ml",
        "it": "Ricarica 300 ml: 300 ml"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-reggio-diffuser-1-opt.webp",
        "width": 846,
        "height": 1058,
        "alt": {
          "de": "Cire Trudon The Diffuser - Reggio – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon The Diffuser - Reggio – product view on a light background",
          "fr": "Cire Trudon The Diffuser - Reggio – vue du produit sur fond clair",
          "it": "Cire Trudon The Diffuser - Reggio – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/d/i/diffuseur_bm_350_1200x1200_1.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-reggio-diffuser-2.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon The Diffuser - Reggio – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon The Diffuser - Reggio – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon The Diffuser - Reggio – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon The Diffuser - Reggio – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_diffuseur_reggio_lifestyle_2023.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/reggio-diffuser-350ml.html",
    "quellen": [
      "https://trudon.com/eu_de/reggio-diffuser-350ml.html",
      "https://trudon.com/eu_de/reggio-diffuser-nachfuellung-300ml.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-reggio-duftkerze",
      "cire-trudon-reggio-raumspray",
      "cire-trudon-reggio-kameen"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Diffuser 350 ml",
            "en": "Diffuser 350 ml",
            "fr": "Diffuseur 350 ml",
            "it": "Diffusore 350 ml"
          },
          "betrag": 175,
          "sku": "DIF/350/BM/REG",
          "inhaltMl": 350,
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Nachfüllflasche 300 ml",
            "en": "Refill bottle 300 ml",
            "fr": "Recharge 300 ml",
            "it": "Ricarica 300 ml"
          },
          "betrag": 82,
          "sku": "DIF/350/R/BM/REG",
          "inhaltMl": 300
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/reggio-diffuser-350ml.html"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Format",
          "en": "Format",
          "fr": "Format",
          "it": "Formato"
        },
        "optionen": [
          {
            "id": "diffuser-350-ml",
            "name": {
              "de": "Diffuser 350 ml",
              "en": "Diffuser 350 ml",
              "fr": "Diffuseur 350 ml",
              "it": "Diffusore 350 ml"
            },
            "code": "DIF/350/BM/REG",
            "betrag": 175,
            "standard": true
          },
          {
            "id": "nachfullflasche-300-ml",
            "name": {
              "de": "Nachfüllflasche 300 ml",
              "en": "Refill bottle 300 ml",
              "fr": "Recharge 300 ml",
              "it": "Ricarica 300 ml"
            },
            "code": "DIF/350/R/BM/REG",
            "betrag": 82
          }
        ]
      }
    ]
  },
  {
    "slug": "cire-trudon-madurai-diffuser",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "diffuser",
    "name": "The Diffuser - Maduraï",
    "kurz": {
      "de": "Duftdiffuser „Maduraï“ für den Raum, im Shop als Diffuser und als Nachfüllflasche in mehreren Formaten geführt. Der Duft beginnt mit Ylang-Ylang, entwickelt sich über Reiner Arabischer Jasmin und klingt mit Benzoeharz aus.",
      "en": "Room diffuser “Maduraï”, offered as a diffuser and as a refill bottle in several formats. The scent opens with Ylang-ylang, moves on to Pure Arabian jasmine and settles on Benzoin.",
      "fr": "Diffuseur d’intérieur « Maduraï », proposé en diffuseur et en recharge, en plusieurs formats. Le parfum s’ouvre sur Ylang-ylang, évolue vers Jasmin sambac pur et se pose sur Benjoin.",
      "it": "Diffusore per ambienti “Maduraï”, disponibile come diffusore e come ricarica in più formati. Il profumo si apre con Ylang-ylang, prosegue con Gelsomino arabo puro e si chiude con Benzoino."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Ylang-Ylang",
        "en": "Top notes: Ylang-ylang",
        "fr": "Notes de tête : Ylang-ylang",
        "it": "Note di testa: Ylang-ylang"
      },
      {
        "de": "Herznoten: Reiner Arabischer Jasmin",
        "en": "Heart notes: Pure Arabian jasmine",
        "fr": "Notes de cœur : Jasmin sambac pur",
        "it": "Note di cuore: Gelsomino arabo puro"
      },
      {
        "de": "Basisnoten: Benzoeharz",
        "en": "Base notes: Benzoin",
        "fr": "Notes de fond : Benjoin",
        "it": "Note di fondo: Benzoino"
      },
      {
        "de": "Diffuser 350 ml: 350 ml",
        "en": "Diffuser 350 ml: 350 ml",
        "fr": "Diffuseur 350 ml: 350 ml",
        "it": "Diffusore 350 ml: 350 ml"
      },
      {
        "de": "Nachfüllflasche 300 ml: 300 ml",
        "en": "Refill bottle 300 ml: 300 ml",
        "fr": "Recharge 300 ml: 300 ml",
        "it": "Ricarica 300 ml: 300 ml"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-madurai-diffuser-1-opt.webp",
        "width": 846,
        "height": 1058,
        "alt": {
          "de": "Cire Trudon The Diffuser - Maduraï – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon The Diffuser - Maduraï – product view on a light background",
          "fr": "Cire Trudon The Diffuser - Maduraï – vue du produit sur fond clair",
          "it": "Cire Trudon The Diffuser - Maduraï – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/d/i/diffuseur_bm_350_1200x1200.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-madurai-diffuser-2.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon The Diffuser - Maduraï – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon The Diffuser - Maduraï – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon The Diffuser - Maduraï – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon The Diffuser - Maduraï – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_diffuseur_madura_lifestyle_2023.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/madurai-diffuser-350ml.html",
    "quellen": [
      "https://trudon.com/eu_de/madurai-diffuser-350ml.html",
      "https://trudon.com/eu_de/madurai-diffuser-nachfuellung-300ml.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-madurai-duftkerze",
      "cire-trudon-madurai-raumspray",
      "cire-trudon-madurai-kameen"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Diffuser 350 ml",
            "en": "Diffuser 350 ml",
            "fr": "Diffuseur 350 ml",
            "it": "Diffusore 350 ml"
          },
          "betrag": 175,
          "sku": "DIF/350/BM/MAD",
          "inhaltMl": 350,
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Nachfüllflasche 300 ml",
            "en": "Refill bottle 300 ml",
            "fr": "Recharge 300 ml",
            "it": "Ricarica 300 ml"
          },
          "betrag": 82,
          "sku": "DIF/350/R/BM/MAD",
          "inhaltMl": 300
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/madurai-diffuser-350ml.html"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Format",
          "en": "Format",
          "fr": "Format",
          "it": "Formato"
        },
        "optionen": [
          {
            "id": "diffuser-350-ml",
            "name": {
              "de": "Diffuser 350 ml",
              "en": "Diffuser 350 ml",
              "fr": "Diffuseur 350 ml",
              "it": "Diffusore 350 ml"
            },
            "code": "DIF/350/BM/MAD",
            "betrag": 175,
            "standard": true
          },
          {
            "id": "nachfullflasche-300-ml",
            "name": {
              "de": "Nachfüllflasche 300 ml",
              "en": "Refill bottle 300 ml",
              "fr": "Recharge 300 ml",
              "it": "Ricarica 300 ml"
            },
            "code": "DIF/350/R/BM/MAD",
            "betrag": 82
          }
        ]
      }
    ]
  },
  {
    "slug": "cire-trudon-spiritus-sancti-diffuser",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "diffuser",
    "name": "The Diffuser - Spiritus Sancti",
    "kurz": {
      "de": "Duftdiffuser „Spiritus Sancti“ für den Raum, im Shop als Diffuser und als Nachfüllflasche in mehreren Formaten geführt. Der Duft beginnt mit Aldehyde und Weihrauch, entwickelt sich über Maiglöckchen und klingt mit Benzoeharz und Labdanum aus.",
      "en": "Room diffuser “Spiritus Sancti”, offered as a diffuser and as a refill bottle in several formats. The scent opens with Aldehydes and Frankincense, moves on to Lily of the valley and settles on Benzoin and Labdanum.",
      "fr": "Diffuseur d’intérieur « Spiritus Sancti », proposé en diffuseur et en recharge, en plusieurs formats. Le parfum s’ouvre sur Aldéhydes et Encens, évolue vers Muguet et se pose sur Benjoin et Labdanum.",
      "it": "Diffusore per ambienti “Spiritus Sancti”, disponibile come diffusore e come ricarica in più formati. Il profumo si apre con Aldeidi e Incenso, prosegue con Mughetto e si chiude con Benzoino e Labdano."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Aldehyde, Weihrauch",
        "en": "Top notes: Aldehydes, Frankincense",
        "fr": "Notes de tête : Aldéhydes, Encens",
        "it": "Note di testa: Aldeidi, Incenso"
      },
      {
        "de": "Herznoten: Maiglöckchen",
        "en": "Heart notes: Lily of the valley",
        "fr": "Notes de cœur : Muguet",
        "it": "Note di cuore: Mughetto"
      },
      {
        "de": "Basisnoten: Benzoeharz, Labdanum",
        "en": "Base notes: Benzoin, Labdanum",
        "fr": "Notes de fond : Benjoin, Labdanum",
        "it": "Note di fondo: Benzoino, Labdano"
      },
      {
        "de": "Diffuser 350 ml: 350 ml",
        "en": "Diffuser 350 ml: 350 ml",
        "fr": "Diffuseur 350 ml: 350 ml",
        "it": "Diffusore 350 ml: 350 ml"
      },
      {
        "de": "Nachfüllflasche 300 ml: 300 ml",
        "en": "Refill bottle 300 ml: 300 ml",
        "fr": "Recharge 300 ml: 300 ml",
        "it": "Ricarica 300 ml: 300 ml"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-spiritus-sancti-diffuser-1-opt.webp",
        "width": 836,
        "height": 1045,
        "alt": {
          "de": "Cire Trudon The Diffuser - Spiritus Sancti – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon The Diffuser - Spiritus Sancti – product view on a light background",
          "fr": "Cire Trudon The Diffuser - Spiritus Sancti – vue du produit sur fond clair",
          "it": "Cire Trudon The Diffuser - Spiritus Sancti – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/d/i/diffuseur_antique_350_1200x1200_4.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-spiritus-sancti-diffuser-2.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon The Diffuser - Spiritus Sancti – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon The Diffuser - Spiritus Sancti – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon The Diffuser - Spiritus Sancti – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon The Diffuser - Spiritus Sancti – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_-_380th_anniversary_-_warning_mentionner_photo_retouch_e_15__6.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/spiritus-sancti-diffuser-350ml.html",
    "quellen": [
      "https://trudon.com/eu_de/spiritus-sancti-diffuser-350ml.html",
      "https://trudon.com/eu_de/spiritus-sancti-diffuser-nachfuellung-300ml.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-spiritus-sancti-duftkerze",
      "cire-trudon-spiritus-sancti-kameen"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Diffuser 350 ml",
            "en": "Diffuser 350 ml",
            "fr": "Diffuseur 350 ml",
            "it": "Diffusore 350 ml"
          },
          "betrag": 175,
          "sku": "DIF/350/SPI",
          "inhaltMl": 350,
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Nachfüllflasche 300 ml",
            "en": "Refill bottle 300 ml",
            "fr": "Recharge 300 ml",
            "it": "Ricarica 300 ml"
          },
          "betrag": 82,
          "sku": "DIF/350/R/SPI",
          "inhaltMl": 300
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/spiritus-sancti-diffuser-350ml.html"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Format",
          "en": "Format",
          "fr": "Format",
          "it": "Formato"
        },
        "optionen": [
          {
            "id": "diffuser-350-ml",
            "name": {
              "de": "Diffuser 350 ml",
              "en": "Diffuser 350 ml",
              "fr": "Diffuseur 350 ml",
              "it": "Diffusore 350 ml"
            },
            "code": "DIF/350/SPI",
            "betrag": 175,
            "standard": true
          },
          {
            "id": "nachfullflasche-300-ml",
            "name": {
              "de": "Nachfüllflasche 300 ml",
              "en": "Refill bottle 300 ml",
              "fr": "Recharge 300 ml",
              "it": "Ricarica 300 ml"
            },
            "code": "DIF/350/R/SPI",
            "betrag": 82
          }
        ]
      }
    ]
  },
  {
    "slug": "cire-trudon-gabriel-diffuser",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "diffuser",
    "name": "The Diffuser - Gabriel",
    "kurz": {
      "de": "Duftdiffuser „Gabriel“ für den Raum, im Shop als Diffuser und als Nachfüllflasche in mehreren Formaten geführt.",
      "en": "Room diffuser “Gabriel”, offered as a diffuser and as a refill bottle in several formats.",
      "fr": "Diffuseur d’intérieur « Gabriel », proposé en diffuseur et en recharge, en plusieurs formats.",
      "it": "Diffusore per ambienti “Gabriel”, disponibile come diffusore e come ricarica in più formati."
    },
    "merkmale": [
      {
        "de": "Diffuser 350 ml: 350 ml",
        "en": "Diffuser 350 ml: 350 ml",
        "fr": "Diffuseur 350 ml: 350 ml",
        "it": "Diffusore 350 ml: 350 ml"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-gabriel-diffuser-1-opt.webp",
        "width": 836,
        "height": 1045,
        "alt": {
          "de": "Cire Trudon The Diffuser - Gabriel – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon The Diffuser - Gabriel – product view on a light background",
          "fr": "Cire Trudon The Diffuser - Gabriel – vue du produit sur fond clair",
          "it": "Cire Trudon The Diffuser - Gabriel – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/d/i/diffuseur_antique_350_1200x1200_5.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-gabriel-diffuser-2.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon The Diffuser - Gabriel – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon The Diffuser - Gabriel – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon The Diffuser - Gabriel – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon The Diffuser - Gabriel – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/u/n/untitled-3.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/gabriel-diffuser-350ml.html",
    "quellen": [
      "https://trudon.com/eu_de/gabriel-diffuser-350ml.html",
      "https://trudon.com/eu_de/gabriel-diffuser-nachfuellung-300ml.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-gabriel-duftkerze",
      "cire-trudon-gabriel-the-alabasters",
      "cire-trudon-gabriel-kameen"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Diffuser 350 ml",
            "en": "Diffuser 350 ml",
            "fr": "Diffuseur 350 ml",
            "it": "Diffusore 350 ml"
          },
          "betrag": 175,
          "sku": "DIF/350/GAB",
          "inhaltMl": 350,
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Nachfüllflasche 300 ml",
            "en": "Refill bottle 300 ml",
            "fr": "Recharge 300 ml",
            "it": "Ricarica 300 ml"
          },
          "betrag": 82,
          "sku": "DIF/350/R/GAB",
          "inhaltMl": 300
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/gabriel-diffuser-350ml.html"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Format",
          "en": "Format",
          "fr": "Format",
          "it": "Formato"
        },
        "optionen": [
          {
            "id": "diffuser-350-ml",
            "name": {
              "de": "Diffuser 350 ml",
              "en": "Diffuser 350 ml",
              "fr": "Diffuseur 350 ml",
              "it": "Diffusore 350 ml"
            },
            "code": "DIF/350/GAB",
            "betrag": 175,
            "standard": true
          },
          {
            "id": "nachfullflasche-300-ml",
            "name": {
              "de": "Nachfüllflasche 300 ml",
              "en": "Refill bottle 300 ml",
              "fr": "Recharge 300 ml",
              "it": "Ricarica 300 ml"
            },
            "code": "DIF/350/R/GAB",
            "betrag": 82
          }
        ]
      }
    ]
  },
  {
    "slug": "cire-trudon-figuerie-raumspray",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "raumduft",
    "name": "Raumspray - Figuerie",
    "kurz": {
      "de": "Raumspray „Figuerie“ in einer Glasflasche. Der Duft beginnt mit Zedernblatt und Feigenblätter, entwickelt sich über Hyazinthe und Kopaivabalsam und klingt mit Sandalwood und Tonkabohnen aus.",
      "en": "Room spray “Figuerie” in a glass bottle. The scent opens with Cedar leaf and Fig leaves, moves on to Hyacinth and Copaiba balsam and settles on Sandalwood and Tonka bean.",
      "fr": "Spray d’intérieur « Figuerie » en flacon de verre. Le parfum s’ouvre sur Feuille de cèdre et Feuilles de figuier, évolue vers Jacinthe et Baume de copahu et se pose sur Bois de santal et Fève tonka.",
      "it": "Spray per ambienti “Figuerie” in flacone di vetro. Il profumo si apre con Foglia di cedro e Foglie di fico, prosegue con Giacinto e Balsamo di copaiba e si chiude con Legno di sandalo e Fava tonka."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Zedernblatt, Feigenblätter, Ätherischer Humus",
        "en": "Top notes: Cedar leaf, Fig leaves, Earthy humus",
        "fr": "Notes de tête : Feuille de cèdre, Feuilles de figuier, Humus",
        "it": "Note di testa: Foglia di cedro, Foglie di fico, Humus"
      },
      {
        "de": "Herznoten: Hyazinthe, Kopaivabalsam, Grünes Bouquet",
        "en": "Heart notes: Hyacinth, Copaiba balsam, Green bouquet",
        "fr": "Notes de cœur : Jacinthe, Baume de copahu, Bouquet vert",
        "it": "Note di cuore: Giacinto, Balsamo di copaiba, Bouquet verde"
      },
      {
        "de": "Basisnoten: Sandalwood, Tonkabohnen, Tasuki Patchouli, Moos-Kristalle",
        "en": "Base notes: Sandalwood, Tonka bean, Tasuki patchouli, Moss crystals",
        "fr": "Notes de fond : Bois de santal, Fève tonka, Patchouli Tasuki, Cristaux de mousse",
        "it": "Note di fondo: Legno di sandalo, Fava tonka, Patchouli Tasuki, Cristalli di muschio"
      },
      {
        "de": "Inhalt 375 ml",
        "en": "Contents 375 ml",
        "fr": "Contenance 375 ml",
        "it": "Contenuto 375 ml"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "18 cm"
      },
      {
        "key": "durchmesser",
        "wert": "7 cm"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-figuerie-raumspray-1-opt.webp",
        "width": 1191,
        "height": 1489,
        "alt": {
          "de": "Cire Trudon Raumspray - Figuerie – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Raumspray - Figuerie – product view on a light background",
          "fr": "Cire Trudon Raumspray - Figuerie – vue du produit sur fond clair",
          "it": "Cire Trudon Raumspray - Figuerie – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_figuerie_-_vaporisateur_-_pack_-_hd_gris.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-figuerie-raumspray-2.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon Raumspray - Figuerie – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon Raumspray - Figuerie – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon Raumspray - Figuerie – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon Raumspray - Figuerie – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_figuerie06_1.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/figuerie-raumspray-375ml.html",
    "quellen": [
      "https://trudon.com/eu_de/figuerie-raumspray-375ml.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-figuerie-duftkerze",
      "cire-trudon-figuerie-diffuser"
    ],
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/figuerie-raumspray-375ml.html",
      "varianten": [
        {
          "name": "375 ml",
          "betrag": 195,
          "sku": "TFIG00037526XS001",
          "inhaltMl": 375,
          "zerbrechlich": true
        }
      ]
    },
    "zubehoer": [
      {
        "slug": "cire-trudon-raumspray-pumpe",
        "hinweis": {
          "de": "Ersatzpumpe",
          "en": "Replacement pump",
          "fr": "Pompe de rechange",
          "it": "Pompa di ricambio"
        }
      },
      {
        "slug": "cire-trudon-sockel-classic"
      }
    ]
  },
  {
    "slug": "cire-trudon-abd-el-kader-raumspray",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "raumduft",
    "name": "Raumspray - Abd El Kader",
    "kurz": {
      "de": "Raumspray „Abd El Kader“ in einer Glasflasche. Der Duft beginnt mit Schwarze-Johannisbeere-Knospen und Zitrone, entwickelt sich über Jasmin und klingt mit Vanille aus.",
      "en": "Room spray “Abd El Kader” in a glass bottle. The scent opens with Blackcurrant buds and Lemon, moves on to Jasmine and settles on Vanilla.",
      "fr": "Spray d’intérieur « Abd El Kader » en flacon de verre. Le parfum s’ouvre sur Bourgeons de cassis et Citron, évolue vers Jasmin et se pose sur Vanille.",
      "it": "Spray per ambienti “Abd El Kader” in flacone di vetro. Il profumo si apre con Gemme di ribes nero e Limone, prosegue con Gelsomino e si chiude con Vaniglia."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Schwarze-Johannisbeere-Knospen, Zitrone, Ingwer, Gewürznelke, Grüne Minze, Apfel",
        "en": "Top notes: Blackcurrant buds, Lemon, Ginger, Clove, Spearmint, Apple",
        "fr": "Notes de tête : Bourgeons de cassis, Citron, Gingembre, Clou de girofle, Menthe verte, Pomme",
        "it": "Note di testa: Gemme di ribes nero, Limone, Zenzero, Chiodo di garofano, Menta verde, Mela"
      },
      {
        "de": "Herznoten: Jasmin",
        "en": "Heart notes: Jasmine",
        "fr": "Notes de cœur : Jasmin",
        "it": "Note di cuore: Gelsomino"
      },
      {
        "de": "Basisnoten: Vanille",
        "en": "Base notes: Vanilla",
        "fr": "Notes de fond : Vanille",
        "it": "Note di fondo: Vaniglia"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "18 cm"
      },
      {
        "key": "durchmesser",
        "wert": "7 cm"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-abd-el-kader-raumspray-1-opt.webp",
        "width": 870,
        "height": 1088,
        "alt": {
          "de": "Cire Trudon Raumspray - Abd El Kader – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Raumspray - Abd El Kader – product view on a light background",
          "fr": "Cire Trudon Raumspray - Abd El Kader – vue du produit sur fond clair",
          "it": "Cire Trudon Raumspray - Abd El Kader – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/s/p/spray0-1600x1600_12.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-abd-el-kader-raumspray-2.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon Raumspray - Abd El Kader – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon Raumspray - Abd El Kader – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon Raumspray - Abd El Kader – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon Raumspray - Abd El Kader – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_-_380th_anniversary_-_warning_mentionner_photo_retouch_e_69__1.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/abd-el-kader-raumspray-375ml.html",
    "quellen": [
      "https://trudon.com/eu_de/abd-el-kader-raumspray-375ml.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-abd-el-kader-duftkerze",
      "cire-trudon-abd-el-kader-the-alabasters",
      "cire-trudon-abd-el-kader-diffuser",
      "cire-trudon-abd-el-kader-kameen"
    ],
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/abd-el-kader-raumspray-375ml.html",
      "varianten": [
        {
          "name": {
            "de": "Einheitsgröße",
            "en": "One size",
            "fr": "Taille unique",
            "it": "Taglia unica"
          },
          "betrag": 195,
          "sku": "SABD/12/TRU",
          "zerbrechlich": true
        }
      ]
    },
    "zubehoer": [
      {
        "slug": "cire-trudon-raumspray-pumpe",
        "hinweis": {
          "de": "Ersatzpumpe",
          "en": "Replacement pump",
          "fr": "Pompe de rechange",
          "it": "Pompa di ricambio"
        }
      },
      {
        "slug": "cire-trudon-sockel-classic"
      }
    ]
  },
  {
    "slug": "cire-trudon-ernesto-raumspray",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "raumduft",
    "name": "Raumspray - Ernesto",
    "kurz": {
      "de": "Raumspray „Ernesto“ in einer Glasflasche. Der Duft beginnt mit Bergamote und Grapefruit, entwickelt sich über Eiche und Gewürznelke und klingt mit Tabak und Bernstein aus.",
      "en": "Room spray “Ernesto” in a glass bottle. The scent opens with Bergamot and Grapefruit, moves on to Oak and Clove and settles on Tobacco and Amber.",
      "fr": "Spray d’intérieur « Ernesto » en flacon de verre. Le parfum s’ouvre sur Bergamote et Pamplemousse, évolue vers Chêne et Clou de girofle et se pose sur Tabac et Ambre.",
      "it": "Spray per ambienti “Ernesto” in flacone di vetro. Il profumo si apre con Bergamotto e Pompelmo, prosegue con Quercia e Chiodo di garofano e si chiude con Tabacco e Ambra."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Bergamote, Grapefruit, Rum",
        "en": "Top notes: Bergamot, Grapefruit, Rum",
        "fr": "Notes de tête : Bergamote, Pamplemousse, Rhum",
        "it": "Note di testa: Bergamotto, Pompelmo, Rum"
      },
      {
        "de": "Herznoten: Eiche, Gewürznelke, Labdanum, Patschuli",
        "en": "Heart notes: Oak, Clove, Labdanum, Patchouli",
        "fr": "Notes de cœur : Chêne, Clou de girofle, Labdanum, Patchouli",
        "it": "Note di cuore: Quercia, Chiodo di garofano, Labdano, Patchouli"
      },
      {
        "de": "Basisnoten: Tabak, Bernstein, Leder, Moos",
        "en": "Base notes: Tobacco, Amber, Leather, Moss",
        "fr": "Notes de fond : Tabac, Ambre, Cuir, Mousse",
        "it": "Note di fondo: Tabacco, Ambra, Cuoio, Muschio vegetale"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "18 cm"
      },
      {
        "key": "durchmesser",
        "wert": "7 cm"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-ernesto-raumspray-1-opt.webp",
        "width": 870,
        "height": 1088,
        "alt": {
          "de": "Cire Trudon Raumspray - Ernesto – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Raumspray - Ernesto – product view on a light background",
          "fr": "Cire Trudon Raumspray - Ernesto – vue du produit sur fond clair",
          "it": "Cire Trudon Raumspray - Ernesto – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/s/p/spray0-1600x1600_14.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-ernesto-raumspray-2.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon Raumspray - Ernesto – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon Raumspray - Ernesto – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon Raumspray - Ernesto – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon Raumspray - Ernesto – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_-_380th_anniversary_-_warning_mentionner_photo_retouch_e_69__3.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/ernesto-raumspray-375ml.html",
    "quellen": [
      "https://trudon.com/eu_de/ernesto-raumspray-375ml.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-ernesto-duftkerze",
      "cire-trudon-ernesto-the-alabasters",
      "cire-trudon-ernesto-diffuser",
      "cire-trudon-ernesto-kameen"
    ],
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/ernesto-raumspray-375ml.html",
      "varianten": [
        {
          "name": {
            "de": "Einheitsgröße",
            "en": "One size",
            "fr": "Taille unique",
            "it": "Taglia unica"
          },
          "betrag": 195,
          "sku": "SERN/12/TRU",
          "zerbrechlich": true
        }
      ]
    },
    "zubehoer": [
      {
        "slug": "cire-trudon-raumspray-pumpe",
        "hinweis": {
          "de": "Ersatzpumpe",
          "en": "Replacement pump",
          "fr": "Pompe de rechange",
          "it": "Pompa di ricambio"
        }
      },
      {
        "slug": "cire-trudon-sockel-classic"
      }
    ]
  },
  {
    "slug": "cire-trudon-cire-raumspray",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "raumduft",
    "name": "Raumsprays Cire",
    "kurz": {
      "de": "Raumspray „Cire“ in einer Glasflasche. Der Duft beginnt mit Bergamote und Gewachstes Holz, entwickelt sich über Bienenwachs Absolut und Ätherisches Sandelholzöl und klingt mit Tonkabohnen und Ätherisches Patschuliöl aus.",
      "en": "Room spray “Cire” in a glass bottle. The scent opens with Bergamot and Waxed wood, moves on to Beeswax absolute and Sandalwood essential oil and settles on Tonka bean and Patchouli essential oil.",
      "fr": "Spray d’intérieur « Cire » en flacon de verre. Le parfum s’ouvre sur Bergamote et Bois ciré, évolue vers Absolu de cire d’abeille et Huile essentielle de santal et se pose sur Fève tonka et Huile essentielle de patchouli.",
      "it": "Spray per ambienti “Cire” in flacone di vetro. Il profumo si apre con Bergamotto e Legno cerato, prosegue con Assoluta di cera d’api e Olio essenziale di sandalo e si chiude con Fava tonka e Olio essenziale di patchouli."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Bergamote, Gewachstes Holz, Honig",
        "en": "Top notes: Bergamot, Waxed wood, Honey",
        "fr": "Notes de tête : Bergamote, Bois ciré, Miel",
        "it": "Note di testa: Bergamotto, Legno cerato, Miele"
      },
      {
        "de": "Herznoten: Bienenwachs Absolut, Ätherisches Sandelholzöl, Ätherisches Zimtöl",
        "en": "Heart notes: Beeswax absolute, Sandalwood essential oil, Cinnamon essential oil",
        "fr": "Notes de cœur : Absolu de cire d’abeille, Huile essentielle de santal, Huile essentielle de cannelle",
        "it": "Note di cuore: Assoluta di cera d’api, Olio essenziale di sandalo, Olio essenziale di cannella"
      },
      {
        "de": "Basisnoten: Tonkabohnen, Ätherisches Patschuliöl, Moschus, Vanille",
        "en": "Base notes: Tonka bean, Patchouli essential oil, Musk, Vanilla",
        "fr": "Notes de fond : Fève tonka, Huile essentielle de patchouli, Musc, Vanille",
        "it": "Note di fondo: Fava tonka, Olio essenziale di patchouli, Musk, Vaniglia"
      },
      {
        "de": "Inhalt 375 ml",
        "en": "Contents 375 ml",
        "fr": "Contenance 375 ml",
        "it": "Contenuto 375 ml"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-cire-raumspray-1-opt.webp",
        "width": 1242,
        "height": 1553,
        "alt": {
          "de": "Cire Trudon Raumsprays Cire – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Raumsprays Cire – product view on a light background",
          "fr": "Cire Trudon Raumsprays Cire – vue du produit sur fond clair",
          "it": "Cire Trudon Raumsprays Cire – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_roomspray_cire_pack_1200x1200_grey.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-cire-raumspray-2.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon Raumsprays Cire – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon Raumsprays Cire – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon Raumsprays Cire – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon Raumsprays Cire – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_sm2026_spring_summer_30_1200x1200_1.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-cire-raumspray-3.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon Raumsprays Cire – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon Raumsprays Cire – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon Raumsprays Cire – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon Raumsprays Cire – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_sm2026_spring_summer_07_1200x1200.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/cire-raumspray-375ml.html",
    "quellen": [
      "https://trudon.com/eu_de/cire-raumspray-375ml.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-cire-duftkerze",
      "cire-trudon-cire-diffuser",
      "cire-trudon-cire-diffuser-nachfuellung",
      "cire-trudon-cire-kameen"
    ],
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/cire-raumspray-375ml.html",
      "varianten": [
        {
          "name": "375 ml",
          "betrag": 200,
          "sku": "TCIR00037526XS001",
          "inhaltMl": 375,
          "zerbrechlich": true
        }
      ]
    },
    "zubehoer": [
      {
        "slug": "cire-trudon-raumspray-pumpe",
        "hinweis": {
          "de": "Ersatzpumpe",
          "en": "Replacement pump",
          "fr": "Pompe de rechange",
          "it": "Pompa di ricambio"
        }
      },
      {
        "slug": "cire-trudon-sockel-classic"
      }
    ]
  },
  {
    "slug": "cire-trudon-josephine-raumspray",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "raumduft",
    "name": "Raumspray - Joséphine",
    "kurz": {
      "de": "Raumspray „Joséphine“ in einer Glasflasche. Der Duft beginnt mit Bergamote und Kaffernlimette, entwickelt sich über Chinesische Kamelie und Ägyptischer Jasmin und klingt mit Schwertlilien und Weiße Moschusdüfte aus.",
      "en": "Room spray “Joséphine” in a glass bottle. The scent opens with Bergamot and Kaffir lime, moves on to Chinese camellia and Egyptian jasmine and settles on Iris and White musks.",
      "fr": "Spray d’intérieur « Joséphine » en flacon de verre. Le parfum s’ouvre sur Bergamote et Combava, évolue vers Camélia de Chine et Jasmin d’Égypte et se pose sur Iris et Muscs blancs.",
      "it": "Spray per ambienti “Joséphine” in flacone di vetro. Il profumo si apre con Bergamotto e Lime kaffir, prosegue con Camelia cinese e Gelsomino egiziano e si chiude con Iris e Muschi bianchi."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Bergamote, Kaffernlimette, Gewürze",
        "en": "Top notes: Bergamot, Kaffir lime, Spices",
        "fr": "Notes de tête : Bergamote, Combava, Épices",
        "it": "Note di testa: Bergamotto, Lime kaffir, Spezie"
      },
      {
        "de": "Herznoten: Chinesische Kamelie, Ägyptischer Jasmin, Türkische Rose",
        "en": "Heart notes: Chinese camellia, Egyptian jasmine, Turkish rose",
        "fr": "Notes de cœur : Camélia de Chine, Jasmin d’Égypte, Rose de Turquie",
        "it": "Note di cuore: Camelia cinese, Gelsomino egiziano, Rosa turca"
      },
      {
        "de": "Basisnoten: Schwertlilien, Weiße Moschusdüfte, Santal d'Indonésie",
        "en": "Base notes: Iris, White musks, Indonesian sandalwood",
        "fr": "Notes de fond : Iris, Muscs blancs, Santal d’Indonésie",
        "it": "Note di fondo: Iris, Muschi bianchi, Sandalo indonesiano"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "18 cm"
      },
      {
        "key": "durchmesser",
        "wert": "7 cm"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-josephine-raumspray-1-opt.webp",
        "width": 870,
        "height": 1088,
        "alt": {
          "de": "Cire Trudon Raumspray - Joséphine – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Raumspray - Joséphine – product view on a light background",
          "fr": "Cire Trudon Raumspray - Joséphine – vue du produit sur fond clair",
          "it": "Cire Trudon Raumspray - Joséphine – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/s/p/spray0-1600x1600_15.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-josephine-raumspray-2.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon Raumspray - Joséphine – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon Raumspray - Joséphine – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon Raumspray - Joséphine – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon Raumspray - Joséphine – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_-_380th_anniversary_-_warning_mentionner_photo_retouch_e_69__5.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/josephine-raumspray-375ml.html",
    "quellen": [
      "https://trudon.com/eu_de/josephine-raumspray-375ml.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-josephine-duftkerze",
      "cire-trudon-josephine-diffuser",
      "cire-trudon-josephine-kameen"
    ],
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/josephine-raumspray-375ml.html",
      "varianten": [
        {
          "name": {
            "de": "Einheitsgröße",
            "en": "One size",
            "fr": "Taille unique",
            "it": "Taglia unica"
          },
          "betrag": 195,
          "sku": "SJOS/15/TRU",
          "zerbrechlich": true
        }
      ]
    },
    "zubehoer": [
      {
        "slug": "cire-trudon-raumspray-pumpe",
        "hinweis": {
          "de": "Ersatzpumpe",
          "en": "Replacement pump",
          "fr": "Pompe de rechange",
          "it": "Pompa di ricambio"
        }
      },
      {
        "slug": "cire-trudon-sockel-classic"
      }
    ]
  },
  {
    "slug": "cire-trudon-cyrnos-raumspray",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "raumduft",
    "name": "Raumspray - Cyrnos",
    "kurz": {
      "de": "Raumspray „Cyrnos“ in einer Glasflasche. Der Duft beginnt mit Zitrone und Myrte, entwickelt sich über Zedernholz und Schwarze Feige und klingt mit Kaschmirholz und Moschus aus.",
      "en": "Room spray “Cyrnos” in a glass bottle. The scent opens with Lemon and Myrtle, moves on to Cedarwood and Black fig and settles on Cashmere wood and Musk.",
      "fr": "Spray d’intérieur « Cyrnos » en flacon de verre. Le parfum s’ouvre sur Citron et Myrte, évolue vers Bois de cèdre et Figue noire et se pose sur Bois de cachemire et Musc.",
      "it": "Spray per ambienti “Cyrnos” in flacone di vetro. Il profumo si apre con Limone e Mirto, prosegue con Legno di cedro e Fico nero e si chiude con Legno di cashmere e Musk."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Zitrone, Myrte, Thymian",
        "en": "Top notes: Lemon, Myrtle, Thyme",
        "fr": "Notes de tête : Citron, Myrte, Thym",
        "it": "Note di testa: Limone, Mirto, Timo"
      },
      {
        "de": "Herznoten: Zedernholz, Schwarze Feige, Lavendel, Kiefer",
        "en": "Heart notes: Cedarwood, Black fig, Lavender, Pine",
        "fr": "Notes de cœur : Bois de cèdre, Figue noire, Lavande, Pin",
        "it": "Note di cuore: Legno di cedro, Fico nero, Lavanda, Pino"
      },
      {
        "de": "Basisnoten: Kaschmirholz, Moschus, Patschuli",
        "en": "Base notes: Cashmere wood, Musk, Patchouli",
        "fr": "Notes de fond : Bois de cachemire, Musc, Patchouli",
        "it": "Note di fondo: Legno di cashmere, Musk, Patchouli"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "18 cm"
      },
      {
        "key": "durchmesser",
        "wert": "7 cm"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-cyrnos-raumspray-1-opt.webp",
        "width": 870,
        "height": 1088,
        "alt": {
          "de": "Cire Trudon Raumspray - Cyrnos – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Raumspray - Cyrnos – product view on a light background",
          "fr": "Cire Trudon Raumspray - Cyrnos – vue du produit sur fond clair",
          "it": "Cire Trudon Raumspray - Cyrnos – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/s/p/spray0-1600x1600_13.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-cyrnos-raumspray-2.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon Raumspray - Cyrnos – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon Raumspray - Cyrnos – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon Raumspray - Cyrnos – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon Raumspray - Cyrnos – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_-_380th_anniversary_-_warning_mentionner_photo_retouch_e_69_.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/cyrnos-raumspray-375ml.html",
    "quellen": [
      "https://trudon.com/eu_de/cyrnos-raumspray-375ml.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-cyrnos-duftkerze",
      "cire-trudon-cyrnos-the-alabasters",
      "cire-trudon-cyrnos-diffuser",
      "cire-trudon-cyrnos-kameen"
    ],
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/cyrnos-raumspray-375ml.html",
      "varianten": [
        {
          "name": {
            "de": "Einheitsgröße",
            "en": "One size",
            "fr": "Taille unique",
            "it": "Taglia unica"
          },
          "betrag": 195,
          "sku": "SCYR/16/TRU",
          "zerbrechlich": true
        }
      ]
    },
    "zubehoer": [
      {
        "slug": "cire-trudon-raumspray-pumpe",
        "hinweis": {
          "de": "Ersatzpumpe",
          "en": "Replacement pump",
          "fr": "Pompe de rechange",
          "it": "Pompa di ricambio"
        }
      },
      {
        "slug": "cire-trudon-sockel-classic"
      }
    ]
  },
  {
    "slug": "cire-trudon-le-bristol-trudon-raumspray",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "raumduft",
    "name": "Le Bristol & Trudon",
    "kurz": {
      "de": "Raumspray „Le Bristol & Trudon“ in einer Glasflasche. Der Duft beginnt mit Hefe, entwickelt sich über Weizen und Zedernholz Essenz und klingt mit Heu und Vetiver aus.",
      "en": "Room spray “Le Bristol & Trudon” in a glass bottle. The scent opens with Yeast, moves on to Wheat and Cedarwood essence and settles on Hay and Vetiver.",
      "fr": "Spray d’intérieur « Le Bristol & Trudon » en flacon de verre. Le parfum s’ouvre sur Levure, évolue vers Blé et Essence de cèdre et se pose sur Foin et Vétiver.",
      "it": "Spray per ambienti “Le Bristol & Trudon” in flacone di vetro. Il profumo si apre con Lievito, prosegue con Grano e Essenza di cedro e si chiude con Fieno e Vetiver."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Hefe",
        "en": "Top notes: Yeast",
        "fr": "Notes de tête : Levure",
        "it": "Note di testa: Lievito"
      },
      {
        "de": "Herznoten: Weizen, Zedernholz Essenz",
        "en": "Heart notes: Wheat, Cedarwood essence",
        "fr": "Notes de cœur : Blé, Essence de cèdre",
        "it": "Note di cuore: Grano, Essenza di cedro"
      },
      {
        "de": "Basisnoten: Heu, Vetiver, Weizen",
        "en": "Base notes: Hay, Vetiver, Wheat",
        "fr": "Notes de fond : Foin, Vétiver, Blé",
        "it": "Note di fondo: Fieno, Vetiver, Grano"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "18 cm"
      },
      {
        "key": "durchmesser",
        "wert": "7 cm"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-le-bristol-trudon-raumspray-1-opt.webp",
        "width": 870,
        "height": 1088,
        "alt": {
          "de": "Cire Trudon Le Bristol & Trudon – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Le Bristol & Trudon – product view on a light background",
          "fr": "Cire Trudon Le Bristol & Trudon – vue du produit sur fond clair",
          "it": "Cire Trudon Le Bristol & Trudon – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/b/r/bristol_roomspray_640x640_gris_face.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-le-bristol-trudon-raumspray-2.webp",
        "width": 800,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon Le Bristol & Trudon – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon Le Bristol & Trudon – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon Le Bristol & Trudon – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon Le Bristol & Trudon – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/2/5/2501_bristol.bougie_05_laurentfau.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/le-bristol-raumspray-375ml.html",
    "quellen": [
      "https://trudon.com/eu_de/le-bristol-raumspray-375ml.html"
    ],
    "stand": "2026-10-31",
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/le-bristol-raumspray-375ml.html",
      "varianten": [
        {
          "name": {
            "de": "Einheitsgröße",
            "en": "One size",
            "fr": "Taille unique",
            "it": "Taglia unica"
          },
          "betrag": 210,
          "sku": "SBRI/375/TRU",
          "zerbrechlich": true
        }
      ]
    },
    "zubehoer": [
      {
        "slug": "cire-trudon-raumspray-pumpe",
        "hinweis": {
          "de": "Ersatzpumpe",
          "en": "Replacement pump",
          "fr": "Pompe de rechange",
          "it": "Pompa di ricambio"
        }
      },
      {
        "slug": "cire-trudon-sockel-classic"
      }
    ]
  },
  {
    "slug": "cire-trudon-madurai-raumspray",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "raumduft",
    "name": "Raumspray - Maduraï",
    "kurz": {
      "de": "Raumspray „Maduraï“ in einer Glasflasche. Der Duft beginnt mit Ylang-Ylang, entwickelt sich über Reiner Arabischer Jasmin und klingt mit Benzoeharz aus.",
      "en": "Room spray “Maduraï” in a glass bottle. The scent opens with Ylang-ylang, moves on to Pure Arabian jasmine and settles on Benzoin.",
      "fr": "Spray d’intérieur « Maduraï » en flacon de verre. Le parfum s’ouvre sur Ylang-ylang, évolue vers Jasmin sambac pur et se pose sur Benjoin.",
      "it": "Spray per ambienti “Maduraï” in flacone di vetro. Il profumo si apre con Ylang-ylang, prosegue con Gelsomino arabo puro e si chiude con Benzoino."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Ylang-Ylang",
        "en": "Top notes: Ylang-ylang",
        "fr": "Notes de tête : Ylang-ylang",
        "it": "Note di testa: Ylang-ylang"
      },
      {
        "de": "Herznoten: Reiner Arabischer Jasmin",
        "en": "Heart notes: Pure Arabian jasmine",
        "fr": "Notes de cœur : Jasmin sambac pur",
        "it": "Note di cuore: Gelsomino arabo puro"
      },
      {
        "de": "Basisnoten: Benzoeharz",
        "en": "Base notes: Benzoin",
        "fr": "Notes de fond : Benjoin",
        "it": "Note di fondo: Benzoino"
      },
      {
        "de": "Inhalt 375 ml",
        "en": "Contents 375 ml",
        "fr": "Contenance 375 ml",
        "it": "Contenuto 375 ml"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "18 cm"
      },
      {
        "key": "durchmesser",
        "wert": "7 cm"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-madurai-raumspray-1-opt.webp",
        "width": 885,
        "height": 1106,
        "alt": {
          "de": "Cire Trudon Raumspray - Maduraï – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Raumspray - Maduraï – product view on a light background",
          "fr": "Cire Trudon Raumspray - Maduraï – vue du produit sur fond clair",
          "it": "Cire Trudon Raumspray - Maduraï – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_-_belles_mati_res_-_vaporisateur_packshot_fond_gris.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-madurai-raumspray-2.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon Raumspray - Maduraï – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon Raumspray - Maduraï – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon Raumspray - Maduraï – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon Raumspray - Maduraï – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/m/a/madurai_1.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/madurai-raumspray-375ml.html",
    "quellen": [
      "https://trudon.com/eu_de/madurai-raumspray-375ml.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-madurai-duftkerze",
      "cire-trudon-madurai-diffuser",
      "cire-trudon-madurai-kameen"
    ],
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/madurai-raumspray-375ml.html",
      "varianten": [
        {
          "name": "375 ml",
          "betrag": 195,
          "sku": "SMAD/22/TRU",
          "inhaltMl": 375,
          "zerbrechlich": true
        }
      ]
    },
    "zubehoer": [
      {
        "slug": "cire-trudon-raumspray-pumpe",
        "hinweis": {
          "de": "Ersatzpumpe",
          "en": "Replacement pump",
          "fr": "Pompe de rechange",
          "it": "Pompa di ricambio"
        }
      },
      {
        "slug": "cire-trudon-sockel-classic"
      }
    ]
  },
  {
    "slug": "cire-trudon-reggio-raumspray",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "raumduft",
    "name": "Raumspray - Reggio",
    "kurz": {
      "de": "Raumspray „Reggio“ in einer Glasflasche.",
      "en": "Room spray “Reggio” in a glass bottle.",
      "fr": "Spray d’intérieur « Reggio » en flacon de verre.",
      "it": "Spray per ambienti “Reggio” in flacone di vetro."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Grapefruit",
        "en": "Top notes: Grapefruit",
        "fr": "Notes de tête : Pamplemousse",
        "it": "Note di testa: Pompelmo"
      },
      {
        "de": "Herznoten: Ätherisches Mandarinöl",
        "en": "Heart notes: Mandarin essential oil",
        "fr": "Notes de cœur : Huile essentielle de mandarine",
        "it": "Note di cuore: Olio essenziale di mandarino"
      },
      {
        "de": "Inhalt 375 ml",
        "en": "Contents 375 ml",
        "fr": "Contenance 375 ml",
        "it": "Contenuto 375 ml"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "18 cm"
      },
      {
        "key": "durchmesser",
        "wert": "7 cm"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-reggio-raumspray-1-opt.webp",
        "width": 885,
        "height": 1106,
        "alt": {
          "de": "Cire Trudon Raumspray - Reggio – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Raumspray - Reggio – product view on a light background",
          "fr": "Cire Trudon Raumspray - Reggio – vue du produit sur fond clair",
          "it": "Cire Trudon Raumspray - Reggio – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_-_belles_mati_res_-_vaporisateur_packshot_fond_gris_1.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-reggio-raumspray-2.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon Raumspray - Reggio – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon Raumspray - Reggio – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon Raumspray - Reggio – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon Raumspray - Reggio – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/r/e/reggio_1.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/reggio-raumspray-375ml.html",
    "quellen": [
      "https://trudon.com/eu_de/reggio-raumspray-375ml.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-reggio-duftkerze",
      "cire-trudon-reggio-diffuser",
      "cire-trudon-reggio-kameen"
    ],
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/reggio-raumspray-375ml.html",
      "varianten": [
        {
          "name": "375 ml",
          "betrag": 195,
          "sku": "SREG/22/TRU",
          "inhaltMl": 375,
          "zerbrechlich": true
        }
      ]
    },
    "zubehoer": [
      {
        "slug": "cire-trudon-raumspray-pumpe",
        "hinweis": {
          "de": "Ersatzpumpe",
          "en": "Replacement pump",
          "fr": "Pompe de rechange",
          "it": "Pompa di ricambio"
        }
      },
      {
        "slug": "cire-trudon-sockel-classic"
      }
    ]
  },
  {
    "slug": "cire-trudon-salta-raumspray",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "raumduft",
    "name": "Raumspray - Salta",
    "kurz": {
      "de": "Raumspray „Salta“ in einer Glasflasche. Der Duft beginnt mit Eisenkraut, entwickelt sich über Grapefruit und klingt mit Hyazinthe aus.",
      "en": "Room spray “Salta” in a glass bottle. The scent opens with Verbena, moves on to Grapefruit and settles on Hyacinth.",
      "fr": "Spray d’intérieur « Salta » en flacon de verre. Le parfum s’ouvre sur Verveine, évolue vers Pamplemousse et se pose sur Jacinthe.",
      "it": "Spray per ambienti “Salta” in flacone di vetro. Il profumo si apre con Verbena, prosegue con Pompelmo e si chiude con Giacinto."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Eisenkraut",
        "en": "Top notes: Verbena",
        "fr": "Notes de tête : Verveine",
        "it": "Note di testa: Verbena"
      },
      {
        "de": "Herznoten: Grapefruit",
        "en": "Heart notes: Grapefruit",
        "fr": "Notes de cœur : Pamplemousse",
        "it": "Note di cuore: Pompelmo"
      },
      {
        "de": "Basisnoten: Hyazinthe",
        "en": "Base notes: Hyacinth",
        "fr": "Notes de fond : Jacinthe",
        "it": "Note di fondo: Giacinto"
      },
      {
        "de": "Inhalt 375 ml",
        "en": "Contents 375 ml",
        "fr": "Contenance 375 ml",
        "it": "Contenuto 375 ml"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "18 cm"
      },
      {
        "key": "durchmesser",
        "wert": "7 cm"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-salta-raumspray-1-opt.webp",
        "width": 885,
        "height": 1106,
        "alt": {
          "de": "Cire Trudon Raumspray - Salta – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Raumspray - Salta – product view on a light background",
          "fr": "Cire Trudon Raumspray - Salta – vue du produit sur fond clair",
          "it": "Cire Trudon Raumspray - Salta – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_-_belles_mati_res_-_vaporisateur_packshot_fond_gris_2.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-salta-raumspray-2.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon Raumspray - Salta – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon Raumspray - Salta – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon Raumspray - Salta – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon Raumspray - Salta – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/s/a/salta_1.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/salta-raumspray-375ml.html",
    "quellen": [
      "https://trudon.com/eu_de/salta-raumspray-375ml.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-salta-duftkerze"
    ],
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/salta-raumspray-375ml.html",
      "varianten": [
        {
          "name": "375 ml",
          "betrag": 195,
          "sku": "SSAL/22/TRU",
          "inhaltMl": 375,
          "zerbrechlich": true
        }
      ]
    },
    "zubehoer": [
      {
        "slug": "cire-trudon-raumspray-pumpe",
        "hinweis": {
          "de": "Ersatzpumpe",
          "en": "Replacement pump",
          "fr": "Pompe de rechange",
          "it": "Pompa di ricambio"
        }
      },
      {
        "slug": "cire-trudon-sockel-classic"
      }
    ]
  },
  {
    "slug": "cire-trudon-napoleon",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "wohnaccessoire",
    "name": "Napoléon",
    "kurz": {
      "de": "Büste Napoléons in den Farbtönen Noir und Pierre, Höhe 24 cm.",
      "en": "Bust of Napoléon in the shades Noir and Pierre, 24 cm high.",
      "fr": "Buste de Napoléon en teintes Noir et Pierre, 24 cm de haut.",
      "it": "Busto di Napoléon nelle tonalità Noir e Pierre, alto 24 cm."
    },
    "merkmale": [
      {
        "de": "Im Shop unter Dekoration · Büsten geführt",
        "en": "Listed in the shop under Decoration · Busts",
        "fr": "Présenté dans la boutique sous Décoration · Bustes",
        "it": "Presentato nel negozio in Decorazione · Busti"
      },
      {
        "de": "Noir: H 24 cm",
        "en": "Noir: H 24 cm",
        "fr": "Noir: H 24 cm",
        "it": "Noir: H 24 cm"
      },
      {
        "de": "Pierre: H 24 cm",
        "en": "Pierre: H 24 cm",
        "fr": "Pierre: H 24 cm",
        "it": "Pierre: H 24 cm"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-napoleon-1-opt.webp",
        "width": 833,
        "height": 1041,
        "alt": {
          "de": "Cire Trudon Napoléon – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Napoléon – product view on a light background",
          "fr": "Cire Trudon Napoléon – vue du produit sur fond clair",
          "it": "Cire Trudon Napoléon – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_buste_napol_on_noir_1200x1200_beige.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-napoleon-2.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon Napoléon – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon Napoléon – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon Napoléon – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon Napoléon – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/n/a/napoleon_black_lifestyle_square.png",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-napoleon-3.webp",
        "width": 1600,
        "height": 1599,
        "alt": {
          "de": "Cire Trudon Napoléon – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon Napoléon – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon Napoléon – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon Napoléon – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/i/m/img_3657.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/napoleon-schwarz.html",
    "quellen": [
      "https://trudon.com/eu_de/napoleon-schwarz.html",
      "https://trudon.com/eu_de/napoleon-stein.html"
    ],
    "stand": "2026-10-31",
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": "Noir",
          "betrag": 180,
          "sku": "NAP/860/TRU"
        },
        {
          "name": "Pierre",
          "betrag": 180,
          "sku": "NAP/514/TRU"
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/napoleon-schwarz.html"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Farbe",
          "en": "Colour",
          "fr": "Couleur",
          "it": "Colore"
        },
        "optionen": [
          {
            "id": "noir",
            "name": "Noir",
            "code": "NAP/860/TRU",
            "betrag": 180,
            "standard": true,
            "bilder": [
              "/Images/Wellness/produkte/cire-trudon/cire-trudon-napoleon-1-opt.webp"
            ]
          },
          {
            "id": "pierre",
            "name": "Pierre",
            "code": "NAP/514/TRU",
            "betrag": 180,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-napoleon-11-opt.webp",
                "width": 830,
                "height": 1038,
                "alt": {
                  "de": "Cire Trudon Napoléon in Pierre – Produktansicht",
                  "en": "Cire Trudon Napoléon in Pierre – product view",
                  "fr": "Cire Trudon Napoléon en Pierre – vue du produit",
                  "it": "Cire Trudon Napoléon in Pierre – vista del prodotto"
                },
                "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_buste_napol_on_pierre_1200x1200_beige.jpg",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          }
        ]
      }
    ],
    "zubehoer": [
      {
        "slug": "cire-trudon-sockel-classic",
        "hinweis": {
          "de": "Laut Hersteller auch für Büsten geeignet",
          "en": "Also suitable for busts according to the maker",
          "fr": "Convient aussi aux bustes selon le fabricant",
          "it": "Adatta anche ai busti secondo il produttore"
        }
      }
    ]
  },
  {
    "slug": "cire-trudon-marie-antoinette",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "wohnaccessoire",
    "name": "Marie-Antoinette",
    "kurz": {
      "de": "Büste Marie-Antoinettes nach einem idealisierten Porträt, in den Farbtönen Pierre und Rose, Höhe 22 cm.",
      "en": "Bust of Marie-Antoinette after an idealised portrait, in the shades Pierre and Rose, 22 cm high.",
      "fr": "Buste de Marie-Antoinette d’après un portrait idéalisé, en teintes Pierre et Rose, 22 cm de haut.",
      "it": "Busto di Marie-Antoinette da un ritratto idealizzato, nelle tonalità Pierre e Rose, alto 22 cm."
    },
    "merkmale": [
      {
        "de": "Im Shop unter Dekoration · Büsten geführt",
        "en": "Listed in the shop under Decoration · Busts",
        "fr": "Présenté dans la boutique sous Décoration · Bustes",
        "it": "Presentato nel negozio in Decorazione · Busti"
      },
      {
        "de": "Pierre: H 22 cm",
        "en": "Pierre: H 22 cm",
        "fr": "Pierre: H 22 cm",
        "it": "Pierre: H 22 cm"
      },
      {
        "de": "Rose: H 22 cm",
        "en": "Rose: H 22 cm",
        "fr": "Rose: H 22 cm",
        "it": "Rose: H 22 cm"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-marie-antoinette-1-opt.webp",
        "width": 862,
        "height": 1078,
        "alt": {
          "de": "Cire Trudon Marie-Antoinette – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Marie-Antoinette – product view on a light background",
          "fr": "Cire Trudon Marie-Antoinette – vue du produit sur fond clair",
          "it": "Cire Trudon Marie-Antoinette – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_buste_marie-antoinette_pierre_1200x1200_beige.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/marie-antoinette-stein.html",
    "quellen": [
      "https://trudon.com/eu_de/marie-antoinette-stein.html",
      "https://trudon.com/eu_de/marie-antoinette-rosa.html"
    ],
    "stand": "2026-10-31",
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": "Pierre",
          "betrag": 130,
          "sku": "MAR/514/TRU"
        },
        {
          "name": "Rose",
          "betrag": 130,
          "sku": "MAR/826/TRU"
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/marie-antoinette-stein.html"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Farbe",
          "en": "Colour",
          "fr": "Couleur",
          "it": "Colore"
        },
        "optionen": [
          {
            "id": "pierre",
            "name": "Pierre",
            "code": "MAR/514/TRU",
            "betrag": 130,
            "standard": true,
            "bilder": [
              "/Images/Wellness/produkte/cire-trudon/cire-trudon-marie-antoinette-1-opt.webp"
            ]
          },
          {
            "id": "rose",
            "name": "Rose",
            "code": "MAR/826/TRU",
            "betrag": 130,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-marie-antoinette-11-opt.webp",
                "width": 846,
                "height": 1058,
                "alt": {
                  "de": "Cire Trudon Marie-Antoinette in Rose – Produktansicht",
                  "en": "Cire Trudon Marie-Antoinette in Rose – product view",
                  "fr": "Cire Trudon Marie-Antoinette en Rose – vue du produit",
                  "it": "Cire Trudon Marie-Antoinette in Rose – vista del prodotto"
                },
                "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_buste_marie-antoinette_rose_1200x1200_beige.jpg",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          }
        ]
      }
    ],
    "zubehoer": [
      {
        "slug": "cire-trudon-sockel-classic",
        "hinweis": {
          "de": "Laut Hersteller auch für Büsten geeignet",
          "en": "Also suitable for busts according to the maker",
          "fr": "Convient aussi aux bustes selon le fabricant",
          "it": "Adatta anche ai busti secondo il produttore"
        }
      }
    ]
  },
  {
    "slug": "cire-trudon-louis-xiv",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "wohnaccessoire",
    "name": "Louis XIV",
    "kurz": {
      "de": "Büste Ludwigs XIV. in den Farbtönen Bleu Marine und Pierre, Höhe 35 cm.",
      "en": "Bust of Louis XIV in the shades Bleu Marine and Pierre, 35 cm high.",
      "fr": "Buste de Louis XIV en teintes Bleu Marine et Pierre, 35 cm de haut.",
      "it": "Busto di Luigi XIV nelle tonalità Bleu Marine e Pierre, alto 35 cm."
    },
    "merkmale": [
      {
        "de": "Im Shop unter Dekoration · Büsten geführt",
        "en": "Listed in the shop under Decoration · Busts",
        "fr": "Présenté dans la boutique sous Décoration · Bustes",
        "it": "Presentato nel negozio in Decorazione · Busti"
      },
      {
        "de": "Bleu Marine: H 35 cm",
        "en": "Bleu Marine: H 35 cm",
        "fr": "Bleu Marine: H 35 cm",
        "it": "Bleu Marine: H 35 cm"
      },
      {
        "de": "Pierre: H 35 cm",
        "en": "Pierre: H 35 cm",
        "fr": "Pierre: H 35 cm",
        "it": "Pierre: H 35 cm"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-louis-xiv-1-opt.webp",
        "width": 1015,
        "height": 1269,
        "alt": {
          "de": "Cire Trudon Louis XIV – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Louis XIV – product view on a light background",
          "fr": "Cire Trudon Louis XIV – vue du produit sur fond clair",
          "it": "Cire Trudon Louis XIV – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_buste_louis_xiv_bleu_marine_1200x1200_beige.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-louis-xiv-2.webp",
        "width": 1600,
        "height": 1600,
        "alt": {
          "de": "Cire Trudon Louis XIV – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon Louis XIV – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon Louis XIV – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon Louis XIV – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/b/u/buste-1600x1600.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-louis-xiv-3.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon Louis XIV – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon Louis XIV – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon Louis XIV – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon Louis XIV – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/l/o/louis_xiv-in-situ-1600x1600-_1.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/louis-xiv-marineblau.html",
    "quellen": [
      "https://trudon.com/eu_de/louis-xiv-marineblau.html",
      "https://trudon.com/eu_de/louis-xiv-stein.html"
    ],
    "stand": "2026-10-31",
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": "Bleu Marine",
          "betrag": 230,
          "sku": "LOU/795/TRU"
        },
        {
          "name": "Pierre",
          "betrag": 230,
          "sku": "LOU/514/TRU"
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/louis-xiv-marineblau.html"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Farbe",
          "en": "Colour",
          "fr": "Couleur",
          "it": "Colore"
        },
        "optionen": [
          {
            "id": "bleu-marine",
            "name": "Bleu Marine",
            "code": "LOU/795/TRU",
            "betrag": 230,
            "standard": true,
            "bilder": [
              "/Images/Wellness/produkte/cire-trudon/cire-trudon-louis-xiv-1-opt.webp"
            ]
          },
          {
            "id": "pierre",
            "name": "Pierre",
            "code": "LOU/514/TRU",
            "betrag": 230,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-louis-xiv-11-opt.webp",
                "width": 995,
                "height": 1244,
                "alt": {
                  "de": "Cire Trudon Louis XIV in Pierre – Produktansicht",
                  "en": "Cire Trudon Louis XIV in Pierre – product view",
                  "fr": "Cire Trudon Louis XIV en Pierre – vue du produit",
                  "it": "Cire Trudon Louis XIV in Pierre – vista del prodotto"
                },
                "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_buste_louis_xiv_pierre_1200x1200_beige.jpg",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          }
        ]
      }
    ],
    "zubehoer": [
      {
        "slug": "cire-trudon-sockel-classic",
        "hinweis": {
          "de": "Laut Hersteller auch für Büsten geeignet",
          "en": "Also suitable for busts according to the maker",
          "fr": "Convient aussi aux bustes selon le fabricant",
          "it": "Adatta anche ai busti secondo il produttore"
        }
      }
    ]
  },
  {
    "slug": "cire-trudon-ex-voto",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "wohnaccessoire",
    "name": "Ex Voto",
    "kurz": {
      "de": "Wachsskulptur nach einer Votivgabe aus Syrien, deren Original im Louvre steht; mit Docht, laut Hersteller aber zum Sammeln und nicht zum Abbrennen gedacht. Höhe 13 cm.",
      "en": "Wax sculpture after a votive offering from Syria whose original is in the Louvre; it has a wick but is intended by the maker as a collector’s piece rather than for burning. 13 cm high.",
      "fr": "Sculpture en cire d’après un ex-voto syrien dont l’original est au Louvre ; munie d’une mèche, elle est destinée selon le fabricant à la collection et non à être brûlée. 13 cm de haut.",
      "it": "Scultura in cera da un ex voto siriano il cui originale è al Louvre; ha uno stoppino, ma secondo il produttore è un oggetto da collezione e non da accendere. Alta 13 cm."
    },
    "merkmale": [
      {
        "de": "Reproduktion in Zusammenarbeit mit der Réunion des Musées Nationaux; Farbtöne Noir, Pierre, Rose",
        "en": "Reproduction made with the Réunion des Musées Nationaux; shades Noir, Pierre, Rose",
        "fr": "Reproduction réalisée avec la Réunion des Musées Nationaux ; teintes Noir, Pierre, Rose",
        "it": "Riproduzione realizzata con la Réunion des Musées Nationaux; tonalità Noir, Pierre, Rose"
      },
      {
        "de": "Noir: H 13 cm",
        "en": "Noir: H 13 cm",
        "fr": "Noir: H 13 cm",
        "it": "Noir: H 13 cm"
      },
      {
        "de": "Pierre: H 13 cm",
        "en": "Pierre: H 13 cm",
        "fr": "Pierre: H 13 cm",
        "it": "Pierre: H 13 cm"
      },
      {
        "de": "Rose: H 13 cm",
        "en": "Rose: H 13 cm",
        "fr": "Rose: H 13 cm",
        "it": "Rose: H 13 cm"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-ex-voto-1-opt.webp",
        "width": 795,
        "height": 994,
        "alt": {
          "de": "Cire Trudon Ex Voto – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Ex Voto – product view on a light background",
          "fr": "Cire Trudon Ex Voto – vue du produit sur fond clair",
          "it": "Cire Trudon Ex Voto – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_buste_ex_voto_noir_1200x1200_beige.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/ex-voto-schwarze.html",
    "quellen": [
      "https://trudon.com/eu_de/ex-voto-schwarze.html",
      "https://trudon.com/eu_de/ex-voto-stein.html",
      "https://trudon.com/eu_de/ex-voto-rosa.html"
    ],
    "stand": "2026-10-31",
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": "Noir",
          "betrag": 65,
          "sku": "EXV/860/TRU"
        },
        {
          "name": "Pierre",
          "betrag": 65,
          "sku": "EXV/514/TRU"
        },
        {
          "name": "Rose",
          "betrag": 65,
          "sku": "EXV/826/TRU"
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/ex-voto-schwarze.html"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Farbe",
          "en": "Colour",
          "fr": "Couleur",
          "it": "Colore"
        },
        "optionen": [
          {
            "id": "noir",
            "name": "Noir",
            "code": "EXV/860/TRU",
            "betrag": 65,
            "standard": true,
            "bilder": [
              "/Images/Wellness/produkte/cire-trudon/cire-trudon-ex-voto-1-opt.webp"
            ]
          },
          {
            "id": "pierre",
            "name": "Pierre",
            "code": "EXV/514/TRU",
            "betrag": 65,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-ex-voto-11-opt.webp",
                "width": 781,
                "height": 976,
                "alt": {
                  "de": "Cire Trudon Ex Voto in Pierre – Produktansicht",
                  "en": "Cire Trudon Ex Voto in Pierre – product view",
                  "fr": "Cire Trudon Ex Voto en Pierre – vue du produit",
                  "it": "Cire Trudon Ex Voto in Pierre – vista del prodotto"
                },
                "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_buste_ex_voto_pierre_1200x1200_beige.jpg",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "rose",
            "name": "Rose",
            "code": "EXV/826/TRU",
            "betrag": 65,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-ex-voto-12-opt.webp",
                "width": 785,
                "height": 981,
                "alt": {
                  "de": "Cire Trudon Ex Voto in Rose – Produktansicht",
                  "en": "Cire Trudon Ex Voto in Rose – product view",
                  "fr": "Cire Trudon Ex Voto en Rose – vue du produit",
                  "it": "Cire Trudon Ex Voto in Rose – vista del prodotto"
                },
                "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_buste_ex_voto_rose_1200x1200_beige.jpg",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "slug": "cire-trudon-kleine-duftkerzen-set-belles-matieres",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "geschenkset",
    "name": "Kleine Duftkerzen-Set",
    "kurz": {
      "de": "Geschenkbox mit drei kleinen Duftkerzen (je 70 g) aus der Reihe Belles Matières.",
      "en": "Gift box with three small scented candles (70 g each) from the Belles Matières line.",
      "fr": "Coffret de trois petites bougies parfumées (70 g chacune) de la ligne Belles Matières.",
      "it": "Cofanetto con tre piccole candele profumate (70 g ciascuna) della linea Belles Matières."
    },
    "merkmale": [
      {
        "de": "Brenndauer ca. 18–20 h",
        "en": "Burn time approx. 18–20 h",
        "fr": "Durée de combustion env. 18–20 h",
        "it": "Durata di combustione circa 18–20 h"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "6,5 cm"
      },
      {
        "key": "durchmesser",
        "wert": "5,5 cm"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-kleine-duftkerzen-set-belles-matieres-1-opt.webp",
        "width": 1274,
        "height": 1592,
        "alt": {
          "de": "Cire Trudon Kleine Duftkerzen-Set – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Kleine Duftkerzen-Set – product view on a light background",
          "fr": "Cire Trudon Kleine Duftkerzen-Set – vue du produit sur fond clair",
          "it": "Cire Trudon Kleine Duftkerzen-Set – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_coffret_bougies_70g_bm_1200x1200_beige.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-kleine-duftkerzen-set-belles-matieres-2.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon Kleine Duftkerzen-Set – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon Kleine Duftkerzen-Set – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon Kleine Duftkerzen-Set – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon Kleine Duftkerzen-Set – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/c/a/calque_682_3.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-kleine-duftkerzen-set-belles-matieres-3.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon Kleine Duftkerzen-Set – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon Kleine Duftkerzen-Set – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon Kleine Duftkerzen-Set – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon Kleine Duftkerzen-Set – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/c/a/calque_680.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/gift-box-for-3-petites-bougies-belles-matieres.html",
    "quellen": [
      "https://trudon.com/eu_de/gift-box-for-3-petites-bougies-belles-matieres.html"
    ],
    "stand": "2026-10-31",
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/gift-box-for-3-petites-bougies-belles-matieres.html",
      "varianten": [
        {
          "name": {
            "de": "Einheitsgröße",
            "en": "One size",
            "fr": "Taille unique",
            "it": "Taglia unica"
          },
          "betrag": 120,
          "sku": "TRUPLV/SLV070/BM"
        }
      ]
    }
  },
  {
    "slug": "cire-trudon-gabriel-kameen",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "raumduft",
    "name": "Gabriel Kamee",
    "kurz": {
      "de": "Duftende Wachs-Kameen „Gabriel“ für den Duftzerstreuer La Promeneuse; die Kamee schmilzt über einem Teelicht und gibt dabei ihren Duft ab. Der Duft beginnt mit Birke und Kandierte Maronen, entwickelt sich über Kaschmirholz und Moos und klingt mit Zedernholz und Moschus aus.",
      "en": "Scented wax cameos “Gabriel” for the La Promeneuse diffuser; the cameo melts over a tealight and releases its scent. The scent opens with Birch and Candied chestnuts, moves on to Cashmere wood and Moss and settles on Cedarwood and Musk.",
      "fr": "Camées de cire parfumée « Gabriel » pour le diffuseur La Promeneuse ; le camée fond au-dessus d’une veilleuse et libère son parfum. Le parfum s’ouvre sur Bouleau et Marrons glacés, évolue vers Bois de cachemire et Mousse et se pose sur Bois de cèdre et Musc.",
      "it": "Cammei di cera profumata “Gabriel” per il diffusore La Promeneuse; il cammeo si scioglie sopra un lumino e rilascia il profumo. Il profumo si apre con Betulla e Marron glacé, prosegue con Legno di cashmere e Muschio vegetale e si chiude con Legno di cedro e Musk."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Birke, Kandierte Maronen",
        "en": "Top notes: Birch, Candied chestnuts",
        "fr": "Notes de tête : Bouleau, Marrons glacés",
        "it": "Note di testa: Betulla, Marron glacé"
      },
      {
        "de": "Herznoten: Kaschmirholz, Moos",
        "en": "Heart notes: Cashmere wood, Moss",
        "fr": "Notes de cœur : Bois de cachemire, Mousse",
        "it": "Note di cuore: Legno di cashmere, Muschio vegetale"
      },
      {
        "de": "Basisnoten: Zedernholz, Moschus, Patschuli",
        "en": "Base notes: Cedarwood, Musk, Patchouli",
        "fr": "Notes de fond : Bois de cèdre, Musc, Patchouli",
        "it": "Note di fondo: Legno di cedro, Musk, Patchouli"
      },
      {
        "de": "Brenndauer ca. 8 h",
        "en": "Burn time approx. 8 h",
        "fr": "Durée de combustion env. 8 h",
        "it": "Durata di combustione circa 8 h"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-gabriel-kameen-1-opt.webp",
        "width": 640,
        "height": 800,
        "alt": {
          "de": "Cire Trudon Gabriel Kamee – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Gabriel Kamee – product view on a light background",
          "fr": "Cire Trudon Gabriel Kamee – vue du produit sur fond clair",
          "it": "Cire Trudon Gabriel Kamee – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_yellow_cameos_1200x1200_beige_7.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/gabriel-kamee.html",
    "quellen": [
      "https://trudon.com/eu_de/gabriel-kamee.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-gabriel-duftkerze",
      "cire-trudon-gabriel-the-alabasters",
      "cire-trudon-gabriel-diffuser",
      "cire-trudon-la-promeneuse"
    ],
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/gabriel-kamee.html",
      "varianten": [
        {
          "name": {
            "de": "Schachtel mit 4 Kameen",
            "en": "Box of 4 cameos",
            "fr": "Boîte de 4 camées",
            "it": "Scatola da 4 cammei"
          },
          "betrag": 28,
          "sku": "PROM/CAM/4/GAB/TRU"
        }
      ]
    },
    "zubehoer": [
      {
        "slug": "cire-trudon-la-promeneuse"
      },
      {
        "slug": "cire-trudon-das-nachtlicht"
      }
    ]
  },
  {
    "slug": "cire-trudon-reggio-kameen",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "raumduft",
    "name": "Reggio Kamee",
    "kurz": {
      "de": "Duftende Wachs-Kameen „Reggio“ für den Duftzerstreuer La Promeneuse; die Kamee schmilzt über einem Teelicht und gibt dabei ihren Duft ab.",
      "en": "Scented wax cameos “Reggio” for the La Promeneuse diffuser; the cameo melts over a tealight and releases its scent.",
      "fr": "Camées de cire parfumée « Reggio » pour le diffuseur La Promeneuse ; le camée fond au-dessus d’une veilleuse et libère son parfum.",
      "it": "Cammei di cera profumata “Reggio” per il diffusore La Promeneuse; il cammeo si scioglie sopra un lumino e rilascia il profumo."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Grapefruit",
        "en": "Top notes: Grapefruit",
        "fr": "Notes de tête : Pamplemousse",
        "it": "Note di testa: Pompelmo"
      },
      {
        "de": "Herznoten: Ätherisches Mandarinöl",
        "en": "Heart notes: Mandarin essential oil",
        "fr": "Notes de cœur : Huile essentielle de mandarine",
        "it": "Note di cuore: Olio essenziale di mandarino"
      },
      {
        "de": "Brenndauer ca. 8 h",
        "en": "Burn time approx. 8 h",
        "fr": "Durée de combustion env. 8 h",
        "it": "Durata di combustione circa 8 h"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-reggio-kameen-1-opt.webp",
        "width": 640,
        "height": 800,
        "alt": {
          "de": "Cire Trudon Reggio Kamee – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Reggio Kamee – product view on a light background",
          "fr": "Cire Trudon Reggio Kamee – vue du produit sur fond clair",
          "it": "Cire Trudon Reggio Kamee – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_yellow_cameos_1200x1200_beige_6.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/reggio-kamee.html",
    "quellen": [
      "https://trudon.com/eu_de/reggio-kamee.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-reggio-duftkerze",
      "cire-trudon-reggio-diffuser",
      "cire-trudon-reggio-raumspray",
      "cire-trudon-la-promeneuse"
    ],
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/reggio-kamee.html",
      "varianten": [
        {
          "name": {
            "de": "Schachtel mit 4 Kameen",
            "en": "Box of 4 cameos",
            "fr": "Boîte de 4 camées",
            "it": "Scatola da 4 cammei"
          },
          "betrag": 28,
          "sku": "PROM/CAM/4/BM/REG"
        }
      ]
    },
    "zubehoer": [
      {
        "slug": "cire-trudon-la-promeneuse"
      },
      {
        "slug": "cire-trudon-das-nachtlicht"
      }
    ]
  },
  {
    "slug": "cire-trudon-madurai-kameen",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "raumduft",
    "name": "Madurai Kamee",
    "kurz": {
      "de": "Duftende Wachs-Kameen „Madurai“ für den Duftzerstreuer La Promeneuse; die Kamee schmilzt über einem Teelicht und gibt dabei ihren Duft ab. Der Duft beginnt mit Ylang-Ylang, entwickelt sich über Reiner Arabischer Jasmin und klingt mit Benzoeharz aus.",
      "en": "Scented wax cameos “Madurai” for the La Promeneuse diffuser; the cameo melts over a tealight and releases its scent. The scent opens with Ylang-ylang, moves on to Pure Arabian jasmine and settles on Benzoin.",
      "fr": "Camées de cire parfumée « Madurai » pour le diffuseur La Promeneuse ; le camée fond au-dessus d’une veilleuse et libère son parfum. Le parfum s’ouvre sur Ylang-ylang, évolue vers Jasmin sambac pur et se pose sur Benjoin.",
      "it": "Cammei di cera profumata “Madurai” per il diffusore La Promeneuse; il cammeo si scioglie sopra un lumino e rilascia il profumo. Il profumo si apre con Ylang-ylang, prosegue con Gelsomino arabo puro e si chiude con Benzoino."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Ylang-Ylang",
        "en": "Top notes: Ylang-ylang",
        "fr": "Notes de tête : Ylang-ylang",
        "it": "Note di testa: Ylang-ylang"
      },
      {
        "de": "Herznoten: Reiner Arabischer Jasmin",
        "en": "Heart notes: Pure Arabian jasmine",
        "fr": "Notes de cœur : Jasmin sambac pur",
        "it": "Note di cuore: Gelsomino arabo puro"
      },
      {
        "de": "Basisnoten: Benzoeharz",
        "en": "Base notes: Benzoin",
        "fr": "Notes de fond : Benjoin",
        "it": "Note di fondo: Benzoino"
      },
      {
        "de": "Brenndauer ca. 8 h",
        "en": "Burn time approx. 8 h",
        "fr": "Durée de combustion env. 8 h",
        "it": "Durata di combustione circa 8 h"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-madurai-kameen-1-opt.webp",
        "width": 640,
        "height": 800,
        "alt": {
          "de": "Cire Trudon Madurai Kamee – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Madurai Kamee – product view on a light background",
          "fr": "Cire Trudon Madurai Kamee – vue du produit sur fond clair",
          "it": "Cire Trudon Madurai Kamee – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_yellow_cameos_1200x1200_beige_8.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/madurai-kamee.html",
    "quellen": [
      "https://trudon.com/eu_de/madurai-kamee.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-madurai-duftkerze",
      "cire-trudon-madurai-diffuser",
      "cire-trudon-madurai-raumspray",
      "cire-trudon-la-promeneuse"
    ],
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/madurai-kamee.html",
      "varianten": [
        {
          "name": {
            "de": "Schachtel mit 4 Kameen",
            "en": "Box of 4 cameos",
            "fr": "Boîte de 4 camées",
            "it": "Scatola da 4 cammei"
          },
          "betrag": 28,
          "sku": "PROM/CAM/4/BM/MAD"
        }
      ]
    },
    "zubehoer": [
      {
        "slug": "cire-trudon-la-promeneuse"
      },
      {
        "slug": "cire-trudon-das-nachtlicht"
      }
    ]
  },
  {
    "slug": "cire-trudon-cire-kameen",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "raumduft",
    "name": "Cire Kamee",
    "kurz": {
      "de": "Duftende Wachs-Kameen „Cire“ für den Duftzerstreuer La Promeneuse; die Kamee schmilzt über einem Teelicht und gibt dabei ihren Duft ab. Der Duft beginnt mit Bergamote und Gewachstes Holz, entwickelt sich über Bienenwachs Absolut und Ätherisches Sandelholzöl und klingt mit Tonkabohnen und Ätherisches Patschuliöl aus.",
      "en": "Scented wax cameos “Cire” for the La Promeneuse diffuser; the cameo melts over a tealight and releases its scent. The scent opens with Bergamot and Waxed wood, moves on to Beeswax absolute and Sandalwood essential oil and settles on Tonka bean and Patchouli essential oil.",
      "fr": "Camées de cire parfumée « Cire » pour le diffuseur La Promeneuse ; le camée fond au-dessus d’une veilleuse et libère son parfum. Le parfum s’ouvre sur Bergamote et Bois ciré, évolue vers Absolu de cire d’abeille et Huile essentielle de santal et se pose sur Fève tonka et Huile essentielle de patchouli.",
      "it": "Cammei di cera profumata “Cire” per il diffusore La Promeneuse; il cammeo si scioglie sopra un lumino e rilascia il profumo. Il profumo si apre con Bergamotto e Legno cerato, prosegue con Assoluta di cera d’api e Olio essenziale di sandalo e si chiude con Fava tonka e Olio essenziale di patchouli."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Bergamote, Gewachstes Holz, Honig",
        "en": "Top notes: Bergamot, Waxed wood, Honey",
        "fr": "Notes de tête : Bergamote, Bois ciré, Miel",
        "it": "Note di testa: Bergamotto, Legno cerato, Miele"
      },
      {
        "de": "Herznoten: Bienenwachs Absolut, Ätherisches Sandelholzöl, Ätherisches Zimtöl",
        "en": "Heart notes: Beeswax absolute, Sandalwood essential oil, Cinnamon essential oil",
        "fr": "Notes de cœur : Absolu de cire d’abeille, Huile essentielle de santal, Huile essentielle de cannelle",
        "it": "Note di cuore: Assoluta di cera d’api, Olio essenziale di sandalo, Olio essenziale di cannella"
      },
      {
        "de": "Basisnoten: Tonkabohnen, Ätherisches Patschuliöl, Moschus, Vanille",
        "en": "Base notes: Tonka bean, Patchouli essential oil, Musk, Vanilla",
        "fr": "Notes de fond : Fève tonka, Huile essentielle de patchouli, Musc, Vanille",
        "it": "Note di fondo: Fava tonka, Olio essenziale di patchouli, Musk, Vaniglia"
      },
      {
        "de": "Brenndauer ca. 8 h",
        "en": "Burn time approx. 8 h",
        "fr": "Durée de combustion env. 8 h",
        "it": "Durata di combustione circa 8 h"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-cire-kameen-1-opt.webp",
        "width": 640,
        "height": 800,
        "alt": {
          "de": "Cire Trudon Cire Kamee – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Cire Kamee – product view on a light background",
          "fr": "Cire Trudon Cire Kamee – vue du produit sur fond clair",
          "it": "Cire Trudon Cire Kamee – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_yellow_cameos_1200x1200_beige_1.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/cire-kamee.html",
    "quellen": [
      "https://trudon.com/eu_de/cire-kamee.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-cire-duftkerze",
      "cire-trudon-cire-diffuser",
      "cire-trudon-cire-diffuser-nachfuellung",
      "cire-trudon-cire-raumspray"
    ],
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/cire-kamee.html",
      "varianten": [
        {
          "name": {
            "de": "Schachtel mit 4 Kameen",
            "en": "Box of 4 cameos",
            "fr": "Boîte de 4 camées",
            "it": "Scatola da 4 cammei"
          },
          "betrag": 28,
          "sku": "PROM/CAM/4/CIR/TRU"
        }
      ]
    },
    "zubehoer": [
      {
        "slug": "cire-trudon-la-promeneuse"
      },
      {
        "slug": "cire-trudon-das-nachtlicht"
      }
    ]
  },
  {
    "slug": "cire-trudon-cyrnos-kameen",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "raumduft",
    "name": "Cyrnos kamee",
    "kurz": {
      "de": "Duftende Wachs-Kameen „Cyrnos“ für den Duftzerstreuer La Promeneuse; die Kamee schmilzt über einem Teelicht und gibt dabei ihren Duft ab. Der Duft beginnt mit Zitrone und Myrte, entwickelt sich über Zedernholz und Schwarze Feige und klingt mit Kaschmirholz und Moschus aus.",
      "en": "Scented wax cameos “Cyrnos” for the La Promeneuse diffuser; the cameo melts over a tealight and releases its scent. The scent opens with Lemon and Myrtle, moves on to Cedarwood and Black fig and settles on Cashmere wood and Musk.",
      "fr": "Camées de cire parfumée « Cyrnos » pour le diffuseur La Promeneuse ; le camée fond au-dessus d’une veilleuse et libère son parfum. Le parfum s’ouvre sur Citron et Myrte, évolue vers Bois de cèdre et Figue noire et se pose sur Bois de cachemire et Musc.",
      "it": "Cammei di cera profumata “Cyrnos” per il diffusore La Promeneuse; il cammeo si scioglie sopra un lumino e rilascia il profumo. Il profumo si apre con Limone e Mirto, prosegue con Legno di cedro e Fico nero e si chiude con Legno di cashmere e Musk."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Zitrone, Myrte, Thymian",
        "en": "Top notes: Lemon, Myrtle, Thyme",
        "fr": "Notes de tête : Citron, Myrte, Thym",
        "it": "Note di testa: Limone, Mirto, Timo"
      },
      {
        "de": "Herznoten: Zedernholz, Schwarze Feige, Lavendel, Kiefer",
        "en": "Heart notes: Cedarwood, Black fig, Lavender, Pine",
        "fr": "Notes de cœur : Bois de cèdre, Figue noire, Lavande, Pin",
        "it": "Note di cuore: Legno di cedro, Fico nero, Lavanda, Pino"
      },
      {
        "de": "Basisnoten: Kaschmirholz, Moschus, Patschuli",
        "en": "Base notes: Cashmere wood, Musk, Patchouli",
        "fr": "Notes de fond : Bois de cachemire, Musc, Patchouli",
        "it": "Note di fondo: Legno di cashmere, Musk, Patchouli"
      },
      {
        "de": "Brenndauer ca. 8 h",
        "en": "Burn time approx. 8 h",
        "fr": "Durée de combustion env. 8 h",
        "it": "Durata di combustione circa 8 h"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-cyrnos-kameen-1-opt.webp",
        "width": 640,
        "height": 800,
        "alt": {
          "de": "Cire Trudon Cyrnos kamee – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Cyrnos kamee – product view on a light background",
          "fr": "Cire Trudon Cyrnos kamee – vue du produit sur fond clair",
          "it": "Cire Trudon Cyrnos kamee – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_yellow_cameos_1200x1200_beige.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/cyrnos-kamee.html",
    "quellen": [
      "https://trudon.com/eu_de/cyrnos-kamee.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-cyrnos-duftkerze",
      "cire-trudon-cyrnos-the-alabasters",
      "cire-trudon-cyrnos-diffuser",
      "cire-trudon-cyrnos-raumspray"
    ],
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/cyrnos-kamee.html",
      "varianten": [
        {
          "name": {
            "de": "Schachtel mit 4 Kameen",
            "en": "Box of 4 cameos",
            "fr": "Boîte de 4 camées",
            "it": "Scatola da 4 cammei"
          },
          "betrag": 28,
          "sku": "PROM/CAM/4/CYR/TRU"
        }
      ]
    },
    "zubehoer": [
      {
        "slug": "cire-trudon-la-promeneuse"
      },
      {
        "slug": "cire-trudon-das-nachtlicht"
      }
    ]
  },
  {
    "slug": "cire-trudon-spiritus-sancti-kameen",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "raumduft",
    "name": "Spiritus Sancti kamee",
    "kurz": {
      "de": "Duftende Wachs-Kameen „Spiritus Sancti“ für den Duftzerstreuer La Promeneuse; die Kamee schmilzt über einem Teelicht und gibt dabei ihren Duft ab. Der Duft beginnt mit Aldehyde und Weihrauch, entwickelt sich über Maiglöckchen und klingt mit Benzoeharz und Labdanum aus.",
      "en": "Scented wax cameos “Spiritus Sancti” for the La Promeneuse diffuser; the cameo melts over a tealight and releases its scent. The scent opens with Aldehydes and Frankincense, moves on to Lily of the valley and settles on Benzoin and Labdanum.",
      "fr": "Camées de cire parfumée « Spiritus Sancti » pour le diffuseur La Promeneuse ; le camée fond au-dessus d’une veilleuse et libère son parfum. Le parfum s’ouvre sur Aldéhydes et Encens, évolue vers Muguet et se pose sur Benjoin et Labdanum.",
      "it": "Cammei di cera profumata “Spiritus Sancti” per il diffusore La Promeneuse; il cammeo si scioglie sopra un lumino e rilascia il profumo. Il profumo si apre con Aldeidi e Incenso, prosegue con Mughetto e si chiude con Benzoino e Labdano."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Aldehyde, Weihrauch",
        "en": "Top notes: Aldehydes, Frankincense",
        "fr": "Notes de tête : Aldéhydes, Encens",
        "it": "Note di testa: Aldeidi, Incenso"
      },
      {
        "de": "Herznoten: Maiglöckchen",
        "en": "Heart notes: Lily of the valley",
        "fr": "Notes de cœur : Muguet",
        "it": "Note di cuore: Mughetto"
      },
      {
        "de": "Basisnoten: Benzoeharz, Labdanum",
        "en": "Base notes: Benzoin, Labdanum",
        "fr": "Notes de fond : Benjoin, Labdanum",
        "it": "Note di fondo: Benzoino, Labdano"
      },
      {
        "de": "Brenndauer ca. 8 h",
        "en": "Burn time approx. 8 h",
        "fr": "Durée de combustion env. 8 h",
        "it": "Durata di combustione circa 8 h"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-spiritus-sancti-kameen-1-opt.webp",
        "width": 640,
        "height": 800,
        "alt": {
          "de": "Cire Trudon Spiritus Sancti kamee – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Spiritus Sancti kamee – product view on a light background",
          "fr": "Cire Trudon Spiritus Sancti kamee – vue du produit sur fond clair",
          "it": "Cire Trudon Spiritus Sancti kamee – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_yellow_cameos_1200x1200_beige_3.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/spiritus-sancti-kamee.html",
    "quellen": [
      "https://trudon.com/eu_de/spiritus-sancti-kamee.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-spiritus-sancti-duftkerze",
      "cire-trudon-spiritus-sancti-diffuser",
      "cire-trudon-la-promeneuse"
    ],
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/spiritus-sancti-kamee.html",
      "varianten": [
        {
          "name": {
            "de": "Schachtel mit 4 Kameen",
            "en": "Box of 4 cameos",
            "fr": "Boîte de 4 camées",
            "it": "Scatola da 4 cammei"
          },
          "betrag": 28,
          "sku": "PROM/CAM/4/SPI/TRU"
        }
      ]
    },
    "zubehoer": [
      {
        "slug": "cire-trudon-la-promeneuse"
      },
      {
        "slug": "cire-trudon-das-nachtlicht"
      }
    ]
  },
  {
    "slug": "cire-trudon-josephine-kameen",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "raumduft",
    "name": "Joséphine kamee",
    "kurz": {
      "de": "Duftende Wachs-Kameen „Joséphine“ für den Duftzerstreuer La Promeneuse; die Kamee schmilzt über einem Teelicht und gibt dabei ihren Duft ab. Der Duft beginnt mit Bergamote und Kaffernlimette, entwickelt sich über Chinesische Kamelie und Ägyptischer Jasmin und klingt mit Schwertlilien und Weiße Moschusdüfte aus.",
      "en": "Scented wax cameos “Joséphine” for the La Promeneuse diffuser; the cameo melts over a tealight and releases its scent. The scent opens with Bergamot and Kaffir lime, moves on to Chinese camellia and Egyptian jasmine and settles on Iris and White musks.",
      "fr": "Camées de cire parfumée « Joséphine » pour le diffuseur La Promeneuse ; le camée fond au-dessus d’une veilleuse et libère son parfum. Le parfum s’ouvre sur Bergamote et Combava, évolue vers Camélia de Chine et Jasmin d’Égypte et se pose sur Iris et Muscs blancs.",
      "it": "Cammei di cera profumata “Joséphine” per il diffusore La Promeneuse; il cammeo si scioglie sopra un lumino e rilascia il profumo. Il profumo si apre con Bergamotto e Lime kaffir, prosegue con Camelia cinese e Gelsomino egiziano e si chiude con Iris e Muschi bianchi."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Bergamote, Kaffernlimette, Gewürze",
        "en": "Top notes: Bergamot, Kaffir lime, Spices",
        "fr": "Notes de tête : Bergamote, Combava, Épices",
        "it": "Note di testa: Bergamotto, Lime kaffir, Spezie"
      },
      {
        "de": "Herznoten: Chinesische Kamelie, Ägyptischer Jasmin, Türkische Rose",
        "en": "Heart notes: Chinese camellia, Egyptian jasmine, Turkish rose",
        "fr": "Notes de cœur : Camélia de Chine, Jasmin d’Égypte, Rose de Turquie",
        "it": "Note di cuore: Camelia cinese, Gelsomino egiziano, Rosa turca"
      },
      {
        "de": "Basisnoten: Schwertlilien, Weiße Moschusdüfte, Santal d'Indonésie",
        "en": "Base notes: Iris, White musks, Indonesian sandalwood",
        "fr": "Notes de fond : Iris, Muscs blancs, Santal d’Indonésie",
        "it": "Note di fondo: Iris, Muschi bianchi, Sandalo indonesiano"
      },
      {
        "de": "Brenndauer ca. 8 h",
        "en": "Burn time approx. 8 h",
        "fr": "Durée de combustion env. 8 h",
        "it": "Durata di combustione circa 8 h"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-josephine-kameen-1-opt.webp",
        "width": 640,
        "height": 800,
        "alt": {
          "de": "Cire Trudon Joséphine kamee – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Joséphine kamee – product view on a light background",
          "fr": "Cire Trudon Joséphine kamee – vue du produit sur fond clair",
          "it": "Cire Trudon Joséphine kamee – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_yellow_cameos_1200x1200_beige_4.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/josephine-kamee.html",
    "quellen": [
      "https://trudon.com/eu_de/josephine-kamee.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-josephine-duftkerze",
      "cire-trudon-josephine-diffuser",
      "cire-trudon-josephine-raumspray",
      "cire-trudon-la-promeneuse"
    ],
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/josephine-kamee.html",
      "varianten": [
        {
          "name": {
            "de": "Schachtel mit 4 Kameen",
            "en": "Box of 4 cameos",
            "fr": "Boîte de 4 camées",
            "it": "Scatola da 4 cammei"
          },
          "betrag": 28,
          "sku": "PROM/CAM/4/JOS/TRU"
        }
      ]
    },
    "zubehoer": [
      {
        "slug": "cire-trudon-la-promeneuse"
      },
      {
        "slug": "cire-trudon-das-nachtlicht"
      }
    ]
  },
  {
    "slug": "cire-trudon-ernesto-kameen",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "raumduft",
    "name": "Ernesto kamee",
    "kurz": {
      "de": "Duftende Wachs-Kameen „Ernesto“ für den Duftzerstreuer La Promeneuse; die Kamee schmilzt über einem Teelicht und gibt dabei ihren Duft ab. Der Duft beginnt mit Bergamote und Grapefruit, entwickelt sich über Eiche und Gewürznelke und klingt mit Tabak und Bernstein aus.",
      "en": "Scented wax cameos “Ernesto” for the La Promeneuse diffuser; the cameo melts over a tealight and releases its scent. The scent opens with Bergamot and Grapefruit, moves on to Oak and Clove and settles on Tobacco and Amber.",
      "fr": "Camées de cire parfumée « Ernesto » pour le diffuseur La Promeneuse ; le camée fond au-dessus d’une veilleuse et libère son parfum. Le parfum s’ouvre sur Bergamote et Pamplemousse, évolue vers Chêne et Clou de girofle et se pose sur Tabac et Ambre.",
      "it": "Cammei di cera profumata “Ernesto” per il diffusore La Promeneuse; il cammeo si scioglie sopra un lumino e rilascia il profumo. Il profumo si apre con Bergamotto e Pompelmo, prosegue con Quercia e Chiodo di garofano e si chiude con Tabacco e Ambra."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Bergamote, Grapefruit, Rum",
        "en": "Top notes: Bergamot, Grapefruit, Rum",
        "fr": "Notes de tête : Bergamote, Pamplemousse, Rhum",
        "it": "Note di testa: Bergamotto, Pompelmo, Rum"
      },
      {
        "de": "Herznoten: Eiche, Gewürznelke, Labdanum, Patschuli",
        "en": "Heart notes: Oak, Clove, Labdanum, Patchouli",
        "fr": "Notes de cœur : Chêne, Clou de girofle, Labdanum, Patchouli",
        "it": "Note di cuore: Quercia, Chiodo di garofano, Labdano, Patchouli"
      },
      {
        "de": "Basisnoten: Tabak, Bernstein, Leder, Moos",
        "en": "Base notes: Tobacco, Amber, Leather, Moss",
        "fr": "Notes de fond : Tabac, Ambre, Cuir, Mousse",
        "it": "Note di fondo: Tabacco, Ambra, Cuoio, Muschio vegetale"
      },
      {
        "de": "Brenndauer ca. 8 h",
        "en": "Burn time approx. 8 h",
        "fr": "Durée de combustion env. 8 h",
        "it": "Durata di combustione circa 8 h"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-ernesto-kameen-1-opt.webp",
        "width": 640,
        "height": 800,
        "alt": {
          "de": "Cire Trudon Ernesto kamee – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Ernesto kamee – product view on a light background",
          "fr": "Cire Trudon Ernesto kamee – vue du produit sur fond clair",
          "it": "Cire Trudon Ernesto kamee – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_yellow_cameos_1200x1200_beige_2.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/ernesto-kamee.html",
    "quellen": [
      "https://trudon.com/eu_de/ernesto-kamee.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-ernesto-duftkerze",
      "cire-trudon-ernesto-the-alabasters",
      "cire-trudon-ernesto-diffuser",
      "cire-trudon-ernesto-raumspray"
    ],
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/ernesto-kamee.html",
      "varianten": [
        {
          "name": {
            "de": "Schachtel mit 4 Kameen",
            "en": "Box of 4 cameos",
            "fr": "Boîte de 4 camées",
            "it": "Scatola da 4 cammei"
          },
          "betrag": 28,
          "sku": "PROM/CAM/4/ERN/TRU"
        }
      ]
    },
    "zubehoer": [
      {
        "slug": "cire-trudon-la-promeneuse"
      },
      {
        "slug": "cire-trudon-das-nachtlicht"
      }
    ]
  },
  {
    "slug": "cire-trudon-abd-el-kader-kameen",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "raumduft",
    "name": "Abd El Kader kamee",
    "kurz": {
      "de": "Duftende Wachs-Kameen „Abd El Kader“ für den Duftzerstreuer La Promeneuse; die Kamee schmilzt über einem Teelicht und gibt dabei ihren Duft ab. Der Duft beginnt mit Schwarze-Johannisbeere-Knospen und Zitrone, entwickelt sich über Jasmin und klingt mit Vanille aus.",
      "en": "Scented wax cameos “Abd El Kader” for the La Promeneuse diffuser; the cameo melts over a tealight and releases its scent. The scent opens with Blackcurrant buds and Lemon, moves on to Jasmine and settles on Vanilla.",
      "fr": "Camées de cire parfumée « Abd El Kader » pour le diffuseur La Promeneuse ; le camée fond au-dessus d’une veilleuse et libère son parfum. Le parfum s’ouvre sur Bourgeons de cassis et Citron, évolue vers Jasmin et se pose sur Vanille.",
      "it": "Cammei di cera profumata “Abd El Kader” per il diffusore La Promeneuse; il cammeo si scioglie sopra un lumino e rilascia il profumo. Il profumo si apre con Gemme di ribes nero e Limone, prosegue con Gelsomino e si chiude con Vaniglia."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Schwarze-Johannisbeere-Knospen, Zitrone, Ingwer, Gewürznelke, Grüne Minze, Apfel",
        "en": "Top notes: Blackcurrant buds, Lemon, Ginger, Clove, Spearmint, Apple",
        "fr": "Notes de tête : Bourgeons de cassis, Citron, Gingembre, Clou de girofle, Menthe verte, Pomme",
        "it": "Note di testa: Gemme di ribes nero, Limone, Zenzero, Chiodo di garofano, Menta verde, Mela"
      },
      {
        "de": "Herznoten: Jasmin",
        "en": "Heart notes: Jasmine",
        "fr": "Notes de cœur : Jasmin",
        "it": "Note di cuore: Gelsomino"
      },
      {
        "de": "Basisnoten: Vanille",
        "en": "Base notes: Vanilla",
        "fr": "Notes de fond : Vanille",
        "it": "Note di fondo: Vaniglia"
      },
      {
        "de": "Brenndauer ca. 8 h",
        "en": "Burn time approx. 8 h",
        "fr": "Durée de combustion env. 8 h",
        "it": "Durata di combustione circa 8 h"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-abd-el-kader-kameen-1-opt.webp",
        "width": 640,
        "height": 800,
        "alt": {
          "de": "Cire Trudon Abd El Kader kamee – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Abd El Kader kamee – product view on a light background",
          "fr": "Cire Trudon Abd El Kader kamee – vue du produit sur fond clair",
          "it": "Cire Trudon Abd El Kader kamee – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_yellow_cameos_1200x1200_beige_5.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/abd-el-kader-kamee.html",
    "quellen": [
      "https://trudon.com/eu_de/abd-el-kader-kamee.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-abd-el-kader-duftkerze",
      "cire-trudon-abd-el-kader-the-alabasters",
      "cire-trudon-abd-el-kader-diffuser",
      "cire-trudon-abd-el-kader-raumspray"
    ],
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/abd-el-kader-kamee.html",
      "varianten": [
        {
          "name": {
            "de": "Schachtel mit 4 Kameen",
            "en": "Box of 4 cameos",
            "fr": "Boîte de 4 camées",
            "it": "Scatola da 4 cammei"
          },
          "betrag": 28,
          "sku": "PROM/CAM/4/ABD/TRU"
        }
      ]
    },
    "zubehoer": [
      {
        "slug": "cire-trudon-la-promeneuse"
      },
      {
        "slug": "cire-trudon-das-nachtlicht"
      }
    ]
  },
  {
    "slug": "cire-trudon-das-nachtlicht",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "wohnaccessoire",
    "name": "Das Nachtlicht",
    "kurz": {
      "de": "Teelichter für den Sockel von La Promeneuse, vier Stück je Schachtel; die Kamee wird nach etwa zehn Minuten flüssig und beginnt zu duften.",
      "en": "Tealights for the base of La Promeneuse, four per box; the cameo melts after about ten minutes and begins to release its scent.",
      "fr": "Veilleuses pour le socle de La Promeneuse, quatre par boîte ; le camée fond au bout d’environ dix minutes et commence à diffuser.",
      "it": "Lumini per la base di La Promeneuse, quattro per scatola; il cammeo si scioglie dopo circa dieci minuti e inizia a profumare."
    },
    "merkmale": [
      {
        "de": "Brenndauer ca. 8 h",
        "en": "Burn time approx. 8 h",
        "fr": "Durée de combustion env. 8 h",
        "it": "Durata di combustione circa 8 h"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-das-nachtlicht-1-opt.webp",
        "width": 869,
        "height": 1086,
        "alt": {
          "de": "Cire Trudon Das Nachtlicht – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Das Nachtlicht – product view on a light background",
          "fr": "Cire Trudon Das Nachtlicht – vue du produit sur fond clair",
          "it": "Cire Trudon Das Nachtlicht – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_pack_nightlight_1200x1200_beige.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/nachtlight-la-promeneuse.html",
    "quellen": [
      "https://trudon.com/eu_de/nachtlight-la-promeneuse.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-la-promeneuse"
    ],
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/nachtlight-la-promeneuse.html",
      "varianten": [
        {
          "name": {
            "de": "Schachtel mit 4 Teelichtern",
            "en": "Box of 4 tealights",
            "fr": "Boîte de 4 veilleuses",
            "it": "Scatola da 4 lumini"
          },
          "betrag": 18,
          "sku": "PROM/VEIL/TRU"
        }
      ]
    }
  },
  {
    "slug": "cire-trudon-parfumierte-streichholzer-ernesto-viscounts-and-viscountesses",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "wohnaccessoire",
    "name": "Parfümierte Streichhölzer Ernesto Viscounts and Viscountesses",
    "kurz": {
      "de": "Lange, leicht parfümierte Streichhölzer im Duft Ernesto in der illustrierten Schachtel „Viscounts and Viscountesses“ zum Anzünden der Kerze; die geöffnete Schachtel duftet auch in Schublade oder Schrank.",
      "en": "Long, lightly scented matches in the Ernesto fragrance, in the illustrated “Viscounts and Viscountesses” box, for lighting candles; the opened box also scents a drawer or cupboard.",
      "fr": "Longues allumettes légèrement parfumées au parfum Ernesto, dans la boîte illustrée « Viscounts and Viscountesses », pour allumer la bougie ; la boîte entrouverte parfume aussi un tiroir ou une armoire.",
      "it": "Fiammiferi lunghi, leggermente profumati con la fragranza Ernesto, nella scatola illustrata “Viscounts and Viscountesses”, per accendere la candela; la scatola aperta profuma anche cassetti o armadi."
    },
    "merkmale": [],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-parfumierte-streichholzer-ernesto-viscounts-and-viscountesses-1-opt.webp",
        "width": 861,
        "height": 1076,
        "alt": {
          "de": "Cire Trudon Parfümierte Streichhölzer Ernesto Viscounts and Viscountesses – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Parfümierte Streichhölzer Ernesto Viscounts and Viscountesses – product view on a light background",
          "fr": "Cire Trudon Parfümierte Streichhölzer Ernesto Viscounts and Viscountesses – vue du produit sur fond clair",
          "it": "Cire Trudon Parfümierte Streichhölzer Ernesto Viscounts and Viscountesses – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/a/c/accessoires_allumettes_vicomte_1200x1200_gris.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/parfuemierte-streichhoelzer-ernesto-viscounts-and-viscountesses.html",
    "quellen": [
      "https://trudon.com/eu_de/parfuemierte-streichhoelzer-ernesto-viscounts-and-viscountesses.html"
    ],
    "stand": "2026-10-31",
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/parfuemierte-streichhoelzer-ernesto-viscounts-and-viscountesses.html",
      "varianten": [
        {
          "name": {
            "de": "Einheitsgröße",
            "en": "One size",
            "fr": "Taille unique",
            "it": "Taglia unica"
          },
          "betrag": 20,
          "sku": "TRU/ALL/ERN/VIC"
        }
      ]
    }
  },
  {
    "slug": "cire-trudon-parfumierte-streichholzer-ernesto-marquis-und-marchionesses",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "wohnaccessoire",
    "name": "Parfümierte Streichhölzer Ernesto Marquis und Marchionesses",
    "kurz": {
      "de": "Lange, leicht parfümierte Streichhölzer im Duft Ernesto in der illustrierten Schachtel „Marquis und Marchionesses“ zum Anzünden der Kerze; die geöffnete Schachtel duftet auch in Schublade oder Schrank.",
      "en": "Long, lightly scented matches in the Ernesto fragrance, in the illustrated “Marquis und Marchionesses” box, for lighting candles; the opened box also scents a drawer or cupboard.",
      "fr": "Longues allumettes légèrement parfumées au parfum Ernesto, dans la boîte illustrée « Marquis und Marchionesses », pour allumer la bougie ; la boîte entrouverte parfume aussi un tiroir ou une armoire.",
      "it": "Fiammiferi lunghi, leggermente profumati con la fragranza Ernesto, nella scatola illustrata “Marquis und Marchionesses”, per accendere la candela; la scatola aperta profuma anche cassetti o armadi."
    },
    "merkmale": [],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-parfumierte-streichholzer-ernesto-marquis-und-marchionesses-1-opt.webp",
        "width": 859,
        "height": 1074,
        "alt": {
          "de": "Cire Trudon Parfümierte Streichhölzer Ernesto Marquis und Marchionesses – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Parfümierte Streichhölzer Ernesto Marquis und Marchionesses – product view on a light background",
          "fr": "Cire Trudon Parfümierte Streichhölzer Ernesto Marquis und Marchionesses – vue du produit sur fond clair",
          "it": "Cire Trudon Parfümierte Streichhölzer Ernesto Marquis und Marchionesses – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/a/c/accessoires_allumettes_marquise_1200x1200_gris.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/parfuemierte-streichhoelzer-ernesto-marquis-und-marchionesses.html",
    "quellen": [
      "https://trudon.com/eu_de/parfuemierte-streichhoelzer-ernesto-marquis-und-marchionesses.html"
    ],
    "stand": "2026-10-31",
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/parfuemierte-streichhoelzer-ernesto-marquis-und-marchionesses.html",
      "varianten": [
        {
          "name": {
            "de": "Einheitsgröße",
            "en": "One size",
            "fr": "Taille unique",
            "it": "Taglia unica"
          },
          "betrag": 20,
          "sku": "TRU/ALL/ERN/MAR"
        }
      ]
    }
  },
  {
    "slug": "cire-trudon-parfumierte-streichholzer-ernesto-kings-and-queens",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "wohnaccessoire",
    "name": "Parfümierte Streichhölzer Ernesto Kings and Queens",
    "kurz": {
      "de": "Lange, leicht parfümierte Streichhölzer im Duft Ernesto in der illustrierten Schachtel „Kings and Queens“ zum Anzünden der Kerze; die geöffnete Schachtel duftet auch in Schublade oder Schrank.",
      "en": "Long, lightly scented matches in the Ernesto fragrance, in the illustrated “Kings and Queens” box, for lighting candles; the opened box also scents a drawer or cupboard.",
      "fr": "Longues allumettes légèrement parfumées au parfum Ernesto, dans la boîte illustrée « Kings and Queens », pour allumer la bougie ; la boîte entrouverte parfume aussi un tiroir ou une armoire.",
      "it": "Fiammiferi lunghi, leggermente profumati con la fragranza Ernesto, nella scatola illustrata “Kings and Queens”, per accendere la candela; la scatola aperta profuma anche cassetti o armadi."
    },
    "merkmale": [],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-parfumierte-streichholzer-ernesto-kings-and-queens-1-opt.webp",
        "width": 860,
        "height": 1075,
        "alt": {
          "de": "Cire Trudon Parfümierte Streichhölzer Ernesto Kings and Queens – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Parfümierte Streichhölzer Ernesto Kings and Queens – product view on a light background",
          "fr": "Cire Trudon Parfümierte Streichhölzer Ernesto Kings and Queens – vue du produit sur fond clair",
          "it": "Cire Trudon Parfümierte Streichhölzer Ernesto Kings and Queens – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/a/c/accessoires_allumettes_roi_1200x1200_gris.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/parfuemierte-streichhoelzer-ernesto-kings-and-queens.html",
    "quellen": [
      "https://trudon.com/eu_de/parfuemierte-streichhoelzer-ernesto-kings-and-queens.html"
    ],
    "stand": "2026-10-31",
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/parfuemierte-streichhoelzer-ernesto-kings-and-queens.html",
      "varianten": [
        {
          "name": {
            "de": "Einheitsgröße",
            "en": "One size",
            "fr": "Taille unique",
            "it": "Taglia unica"
          },
          "betrag": 20,
          "sku": "TRU/ALL/ERN/KIN"
        }
      ]
    }
  },
  {
    "slug": "cire-trudon-parfumierte-streichholzer-ernesto-dukes-and-duchesses",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "wohnaccessoire",
    "name": "Parfümierte Streichhölzer Ernesto Dukes and Duchesses",
    "kurz": {
      "de": "Lange, leicht parfümierte Streichhölzer im Duft Ernesto in der illustrierten Schachtel „Dukes and Duchesses“ zum Anzünden der Kerze; die geöffnete Schachtel duftet auch in Schublade oder Schrank.",
      "en": "Long, lightly scented matches in the Ernesto fragrance, in the illustrated “Dukes and Duchesses” box, for lighting candles; the opened box also scents a drawer or cupboard.",
      "fr": "Longues allumettes légèrement parfumées au parfum Ernesto, dans la boîte illustrée « Dukes and Duchesses », pour allumer la bougie ; la boîte entrouverte parfume aussi un tiroir ou une armoire.",
      "it": "Fiammiferi lunghi, leggermente profumati con la fragranza Ernesto, nella scatola illustrata “Dukes and Duchesses”, per accendere la candela; la scatola aperta profuma anche cassetti o armadi."
    },
    "merkmale": [],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-parfumierte-streichholzer-ernesto-dukes-and-duchesses-1-opt.webp",
        "width": 861,
        "height": 1076,
        "alt": {
          "de": "Cire Trudon Parfümierte Streichhölzer Ernesto Dukes and Duchesses – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Parfümierte Streichhölzer Ernesto Dukes and Duchesses – product view on a light background",
          "fr": "Cire Trudon Parfümierte Streichhölzer Ernesto Dukes and Duchesses – vue du produit sur fond clair",
          "it": "Cire Trudon Parfümierte Streichhölzer Ernesto Dukes and Duchesses – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/a/c/accessoires_allumettes_duchesse_1200x1200_gris.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/parfuemierte-streichhoelzer-ernesto-dukes-and-duchesses.html",
    "quellen": [
      "https://trudon.com/eu_de/parfuemierte-streichhoelzer-ernesto-dukes-and-duchesses.html"
    ],
    "stand": "2026-10-31",
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/parfuemierte-streichhoelzer-ernesto-dukes-and-duchesses.html",
      "varianten": [
        {
          "name": {
            "de": "Einheitsgröße",
            "en": "One size",
            "fr": "Taille unique",
            "it": "Taglia unica"
          },
          "betrag": 20,
          "sku": "TRU/ALL/ERN/DUC"
        }
      ]
    }
  },
  {
    "slug": "cire-trudon-nazareth-madeleines",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "duftkerze",
    "name": "Madeleines Nazareth",
    "kurz": {
      "de": "Duftende Spitzkerzen „Madeleines Nazareth“, sechs Stück je Schachtel. Der Duft beginnt mit Bitterorange und Ceylon-Zimt, entwickelt sich über Zimt und Kardamom und klingt mit Benzoeharz und Zistrose aus.",
      "en": "Scented taper candles “Madeleines Nazareth”, six per box. The scent opens with Bitter orange and Ceylon cinnamon, moves on to Cinnamon and Cardamom and settles on Benzoin and Cistus.",
      "fr": "Bougies effilées parfumées « Madeleines Nazareth », six par boîte. Le parfum s’ouvre sur Orange amère et Cannelle de Ceylan, évolue vers Cannelle et Cardamome et se pose sur Benjoin et Ciste.",
      "it": "Candele affusolate profumate “Madeleines Nazareth”, sei per scatola. Il profumo si apre con Arancia amara e Cannella di Ceylon, prosegue con Cannella e Cardamomo e si chiude con Benzoino e Cisto."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Bitterorange, Ceylon-Zimt, Mandarine, Grapefruit",
        "en": "Top notes: Bitter orange, Ceylon cinnamon, Mandarin, Grapefruit",
        "fr": "Notes de tête : Orange amère, Cannelle de Ceylan, Mandarine, Pamplemousse",
        "it": "Note di testa: Arancia amara, Cannella di Ceylon, Mandarino, Pompelmo"
      },
      {
        "de": "Herznoten: Zimt, Kardamom, Gewürznelke, Orange, Chinesische Duftblüten",
        "en": "Heart notes: Cinnamon, Cardamom, Clove, Orange, Chinese scented blossoms",
        "fr": "Notes de cœur : Cannelle, Cardamome, Clou de girofle, Orange, Fleurs parfumées de Chine",
        "it": "Note di cuore: Cannella, Cardamomo, Chiodo di garofano, Arancia, Fiori profumati cinesi"
      },
      {
        "de": "Basisnoten: Benzoeharz, Zistrose, Moschus, Myrrhe, Bourbon-Vanille",
        "en": "Base notes: Benzoin, Cistus, Musk, Myrrh, Bourbon vanilla",
        "fr": "Notes de fond : Benjoin, Ciste, Musc, Myrrhe, Vanille Bourbon",
        "it": "Note di fondo: Benzoino, Cisto, Musk, Mirra, Vaniglia Bourbon"
      },
      {
        "de": "Brenndauer ca. 7 h",
        "en": "Burn time approx. 7 h",
        "fr": "Durée de combustion env. 7 h",
        "it": "Durata di combustione circa 7 h"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "200 mm"
      },
      {
        "key": "durchmesser",
        "wert": "22 mm"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-nazareth-madeleines-1-opt.webp",
        "width": 800,
        "height": 1000,
        "alt": {
          "de": "Cire Trudon Madeleines Nazareth – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Madeleines Nazareth – product view on a light background",
          "fr": "Cire Trudon Madeleines Nazareth – vue du produit sur fond clair",
          "it": "Cire Trudon Madeleines Nazareth – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/m/a/madeleine_blanc_1200x1200_beige_2.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/nazareth-scented-madeleines.html",
    "quellen": [
      "https://trudon.com/eu_de/nazareth-scented-madeleines.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-nazareth-duftkerze"
    ],
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/nazareth-scented-madeleines.html",
      "varianten": [
        {
          "name": {
            "de": "Schachtel mit 6 Kerzen",
            "en": "Box of 6 candles",
            "fr": "Boîte de 6 bougies",
            "it": "Scatola da 6 candele"
          },
          "betrag": 38,
          "sku": "TNAZ04002027XS002"
        }
      ]
    },
    "zubehoer": [
      {
        "slug": "cire-trudon-kerzenstander-trio",
        "hinweis": {
          "de": "Für Madeleine-Spitzkerzen",
          "en": "For Madeleine taper candles",
          "fr": "Pour chandelles Madeleine",
          "it": "Per candele affusolate Madeleine"
        }
      },
      {
        "slug": "cire-trudon-armleuchter",
        "hinweis": {
          "de": "Für Madeleine-Spitzkerzen",
          "en": "For Madeleine taper candles",
          "fr": "Pour chandelles Madeleine",
          "it": "Per candele affusolate Madeleine"
        }
      },
      {
        "slug": "cire-trudon-hollandischer-kerzenstander",
        "hinweis": {
          "de": "Für Madeleine-Spitzkerzen",
          "en": "For Madeleine taper candles",
          "fr": "Pour chandelles Madeleine",
          "it": "Per candele affusolate Madeleine"
        }
      },
      {
        "slug": "cire-trudon-blumen-kerzenstander",
        "hinweis": {
          "de": "Für Madeleine-Spitzkerzen",
          "en": "For Madeleine taper candles",
          "fr": "Pour chandelles Madeleine",
          "it": "Per candele affusolate Madeleine"
        }
      },
      {
        "slug": "cire-trudon-die-kegel-kerzenloscher"
      }
    ]
  },
  {
    "slug": "cire-trudon-fir-madeleines",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "duftkerze",
    "name": "Madeleines Fir",
    "kurz": {
      "de": "Duftende Spitzkerzen „Madeleines Fir“, sechs Stück je Schachtel. Der Duft beginnt mit Leder und sibirischer Kiefer, entwickelt sich über Guajakholz und Chinazeder und klingt mit spanischer Zistrose und absolutem Weihrauch aus.",
      "en": "Scented taper candles “Madeleines Fir”, six per box. The scent opens with Leather and Siberian pine, moves on to Guaiac wood and Chinese cedar and settles on Spanish cistus and Frankincense absolute.",
      "fr": "Bougies effilées parfumées « Madeleines Fir », six par boîte. Le parfum s’ouvre sur Cuir et Pin de Sibérie, évolue vers Bois de gaïac et Cèdre de Chine et se pose sur Ciste d’Espagne et Absolu d’encens.",
      "it": "Candele affusolate profumate “Madeleines Fir”, sei per scatola. Il profumo si apre con Cuoio e Pino siberiano, prosegue con Legno di guaiaco e Cedro cinese e si chiude con Cisto spagnolo e Assoluta di incenso."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Leder, sibirische Kiefer, Tanne",
        "en": "Top notes: Leather, Siberian pine, Fir",
        "fr": "Notes de tête : Cuir, Pin de Sibérie, Sapin",
        "it": "Note di testa: Cuoio, Pino siberiano, Abete"
      },
      {
        "de": "Herznoten: Guajakholz, Chinazeder, Myrrhe",
        "en": "Heart notes: Guaiac wood, Chinese cedar, Myrrh",
        "fr": "Notes de cœur : Bois de gaïac, Cèdre de Chine, Myrrhe",
        "it": "Note di cuore: Legno di guaiaco, Cedro cinese, Mirra"
      },
      {
        "de": "Basisnoten: Spanische Zistrose, Absoluter Weihrauch, Patschuli",
        "en": "Base notes: Spanish cistus, Frankincense absolute, Patchouli",
        "fr": "Notes de fond : Ciste d’Espagne, Absolu d’encens, Patchouli",
        "it": "Note di fondo: Cisto spagnolo, Assoluta di incenso, Patchouli"
      },
      {
        "de": "Brenndauer ca. 7 h",
        "en": "Burn time approx. 7 h",
        "fr": "Durée de combustion env. 7 h",
        "it": "Durata di combustione circa 7 h"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "200 mm"
      },
      {
        "key": "durchmesser",
        "wert": "22 mm"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-fir-madeleines-1-opt.webp",
        "width": 800,
        "height": 1000,
        "alt": {
          "de": "Cire Trudon Madeleines Fir – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Madeleines Fir – product view on a light background",
          "fr": "Cire Trudon Madeleines Fir – vue du produit sur fond clair",
          "it": "Cire Trudon Madeleines Fir – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/m/a/madeleine_blanc_1200x1200_beige.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/fir-duftende-madeleines.html",
    "quellen": [
      "https://trudon.com/eu_de/fir-duftende-madeleines.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-fir-duftkerze",
      "cire-trudon-fir-kameen"
    ],
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/fir-duftende-madeleines.html",
      "varianten": [
        {
          "name": {
            "de": "Schachtel mit 6 Kerzen",
            "en": "Box of 6 candles",
            "fr": "Boîte de 6 bougies",
            "it": "Scatola da 6 candele"
          },
          "betrag": 38,
          "sku": "TFIR04002027XS002"
        }
      ]
    },
    "zubehoer": [
      {
        "slug": "cire-trudon-kerzenstander-trio",
        "hinweis": {
          "de": "Für Madeleine-Spitzkerzen",
          "en": "For Madeleine taper candles",
          "fr": "Pour chandelles Madeleine",
          "it": "Per candele affusolate Madeleine"
        }
      },
      {
        "slug": "cire-trudon-armleuchter",
        "hinweis": {
          "de": "Für Madeleine-Spitzkerzen",
          "en": "For Madeleine taper candles",
          "fr": "Pour chandelles Madeleine",
          "it": "Per candele affusolate Madeleine"
        }
      },
      {
        "slug": "cire-trudon-hollandischer-kerzenstander",
        "hinweis": {
          "de": "Für Madeleine-Spitzkerzen",
          "en": "For Madeleine taper candles",
          "fr": "Pour chandelles Madeleine",
          "it": "Per candele affusolate Madeleine"
        }
      },
      {
        "slug": "cire-trudon-blumen-kerzenstander",
        "hinweis": {
          "de": "Für Madeleine-Spitzkerzen",
          "en": "For Madeleine taper candles",
          "fr": "Pour chandelles Madeleine",
          "it": "Per candele affusolate Madeleine"
        }
      },
      {
        "slug": "cire-trudon-die-kegel-kerzenloscher"
      }
    ]
  },
  {
    "slug": "cire-trudon-innenraumduft-set",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "geschenkset",
    "name": "Innenraumduft-Set",
    "kurz": {
      "de": "Geschenkbox mit einer Duftkerze und einem Diffuser, im gleichen Duft oder als Duo aus zwei Düften.",
      "en": "Gift box with a scented candle and a diffuser, in the same scent or as a pairing of two scents.",
      "fr": "Coffret réunissant une bougie parfumée et un diffuseur, dans le même parfum ou en duo de deux parfums.",
      "it": "Cofanetto con una candela profumata e un diffusore, nella stessa fragranza o in coppia di due fragranze."
    },
    "merkmale": [],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-innenraumduft-set-1-opt.webp",
        "width": 1268,
        "height": 1584,
        "alt": {
          "de": "Cire Trudon Innenraumduft-Set – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Innenraumduft-Set – product view on a light background",
          "fr": "Cire Trudon Innenraumduft-Set – vue du produit sur fond clair",
          "it": "Cire Trudon Innenraumduft-Set – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_coffret_diffuseur_bougie_1200x1200_beige.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/innenraumduft-duo-set-diffusor-und-duftkerze.html",
    "quellen": [
      "https://trudon.com/eu_de/innenraumduft-duo-set-diffusor-und-duftkerze.html"
    ],
    "stand": "2026-10-31",
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/innenraumduft-duo-set-diffusor-und-duftkerze.html",
      "varianten": [
        {
          "name": {
            "de": "Einheitsgröße",
            "en": "One size",
            "fr": "Taille unique",
            "it": "Taglia unica"
          },
          "betrag": 270,
          "sku": "TRU/GIFTBOX/BUNDLE3"
        }
      ]
    }
  },
  {
    "slug": "cire-trudon-duftkerzen-set",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "geschenkset",
    "name": "Duftkerzen-Set",
    "kurz": {
      "de": "Geschenkbox mit zwei klassischen Duftkerzen zu je 270 g.",
      "en": "Gift box with two classic scented candles of 270 g each.",
      "fr": "Coffret de deux bougies parfumées classiques de 270 g.",
      "it": "Cofanetto con due candele profumate classiche da 270 g."
    },
    "merkmale": [],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-duftkerzen-set-1-opt.webp",
        "width": 1112,
        "height": 1391,
        "alt": {
          "de": "Cire Trudon Duftkerzen-Set – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Duftkerzen-Set – product view on a light background",
          "fr": "Cire Trudon Duftkerzen-Set – vue du produit sur fond clair",
          "it": "Cire Trudon Duftkerzen-Set – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_coffret_bougies_1200x1200_beige.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/duftkerzen-duo.html",
    "quellen": [
      "https://trudon.com/eu_de/duftkerzen-duo.html"
    ],
    "stand": "2026-10-31",
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/duftkerzen-duo.html",
      "varianten": [
        {
          "name": {
            "de": "Einheitsgröße",
            "en": "One size",
            "fr": "Taille unique",
            "it": "Taglia unica"
          },
          "betrag": 190,
          "sku": "TRU/GIFTBOX/BUNDLE1"
        }
      ]
    }
  },
  {
    "slug": "cire-trudon-fir-kameen",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "raumduft",
    "name": "Fir Kamee",
    "kurz": {
      "de": "Duftende Wachs-Kameen „Fir“ für den Duftzerstreuer La Promeneuse; die Kamee schmilzt über einem Teelicht und gibt dabei ihren Duft ab. Der Duft beginnt mit Leder und sibirischer Kiefer, entwickelt sich über Guajakholz und Chinazeder und klingt mit spanischer Zistrose und absolutem Weihrauch aus.",
      "en": "Scented wax cameos “Fir” for the La Promeneuse diffuser; the cameo melts over a tealight and releases its scent. The scent opens with Leather and Siberian pine, moves on to Guaiac wood and Chinese cedar and settles on Spanish cistus and Frankincense absolute.",
      "fr": "Camées de cire parfumée « Fir » pour le diffuseur La Promeneuse ; le camée fond au-dessus d’une veilleuse et libère son parfum. Le parfum s’ouvre sur Cuir et Pin de Sibérie, évolue vers Bois de gaïac et Cèdre de Chine et se pose sur Ciste d’Espagne et Absolu d’encens.",
      "it": "Cammei di cera profumata “Fir” per il diffusore La Promeneuse; il cammeo si scioglie sopra un lumino e rilascia il profumo. Il profumo si apre con Cuoio e Pino siberiano, prosegue con Legno di guaiaco e Cedro cinese e si chiude con Cisto spagnolo e Assoluta di incenso."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Leder, sibirische Kiefer, Tanne",
        "en": "Top notes: Leather, Siberian pine, Fir",
        "fr": "Notes de tête : Cuir, Pin de Sibérie, Sapin",
        "it": "Note di testa: Cuoio, Pino siberiano, Abete"
      },
      {
        "de": "Herznoten: Guajakholz, Chinazeder, Myrrhe",
        "en": "Heart notes: Guaiac wood, Chinese cedar, Myrrh",
        "fr": "Notes de cœur : Bois de gaïac, Cèdre de Chine, Myrrhe",
        "it": "Note di cuore: Legno di guaiaco, Cedro cinese, Mirra"
      },
      {
        "de": "Basisnoten: Spanische Zistrose, Absoluter Weihrauch, Patschuli",
        "en": "Base notes: Spanish cistus, Frankincense absolute, Patchouli",
        "fr": "Notes de fond : Ciste d’Espagne, Absolu d’encens, Patchouli",
        "it": "Note di fondo: Cisto spagnolo, Assoluta di incenso, Patchouli"
      },
      {
        "de": "Brenndauer ca. 8 h",
        "en": "Burn time approx. 8 h",
        "fr": "Durée de combustion env. 8 h",
        "it": "Durata di combustione circa 8 h"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-fir-kameen-1-opt.webp",
        "width": 640,
        "height": 800,
        "alt": {
          "de": "Cire Trudon Fir Kamee – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Fir Kamee – product view on a light background",
          "fr": "Cire Trudon Fir Kamee – vue du produit sur fond clair",
          "it": "Cire Trudon Fir Kamee – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_blanc_cameos_1200x1200_beige.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/fir-scented-cameos.html",
    "quellen": [
      "https://trudon.com/eu_de/fir-scented-cameos.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-fir-duftkerze",
      "cire-trudon-fir-madeleines",
      "cire-trudon-la-promeneuse"
    ],
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/fir-scented-cameos.html",
      "varianten": [
        {
          "name": {
            "de": "Schachtel mit 4 Kameen",
            "en": "Box of 4 cameos",
            "fr": "Boîte de 4 camées",
            "it": "Scatola da 4 cammei"
          },
          "betrag": 32,
          "sku": "TFIR04001105XS002"
        }
      ]
    },
    "zubehoer": [
      {
        "slug": "cire-trudon-la-promeneuse"
      },
      {
        "slug": "cire-trudon-das-nachtlicht"
      }
    ]
  },
  {
    "slug": "cire-trudon-altair-diffuser",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "diffuser",
    "name": "The Diffuser - Altaïr",
    "kurz": {
      "de": "Duftdiffuser „Altaïr“ für den Raum, im Shop als Diffuser und als Nachfüllflasche in mehreren Formaten geführt. Der Duft beginnt mit Himbeere und Pfingstrosen, entwickelt sich über Agarholz und Sandelholz und klingt mit Zedernholz und Leder aus.",
      "en": "Room diffuser “Altaïr”, offered as a diffuser and as a refill bottle in several formats. The scent opens with Raspberry and Peony, moves on to Agarwood and Sandalwood and settles on Cedarwood and Leather.",
      "fr": "Diffuseur d’intérieur « Altaïr », proposé en diffuseur et en recharge, en plusieurs formats. Le parfum s’ouvre sur Framboise et Pivoine, évolue vers Bois d’agar et Bois de santal et se pose sur Bois de cèdre et Cuir.",
      "it": "Diffusore per ambienti “Altaïr”, disponibile come diffusore e come ricarica in più formati. Il profumo si apre con Lampone e Peonia, prosegue con Legno di agar e Legno di sandalo e si chiude con Legno di cedro e Cuoio."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Himbeere, Pfingstrosen",
        "en": "Top notes: Raspberry, Peony",
        "fr": "Notes de tête : Framboise, Pivoine",
        "it": "Note di testa: Lampone, Peonia"
      },
      {
        "de": "Herznoten: Agarholz, Sandelholz, Rose",
        "en": "Heart notes: Agarwood, Sandalwood, Rose",
        "fr": "Notes de cœur : Bois d’agar, Bois de santal, Rose",
        "it": "Note di cuore: Legno di agar, Legno di sandalo, Rosa"
      },
      {
        "de": "Basisnoten: Zedernholz, Leder",
        "en": "Base notes: Cedarwood, Leather",
        "fr": "Notes de fond : Bois de cèdre, Cuir",
        "it": "Note di fondo: Legno di cedro, Cuoio"
      },
      {
        "de": "Diffuser 350 ml: 350 ml",
        "en": "Diffuser 350 ml: 350 ml",
        "fr": "Diffuseur 350 ml: 350 ml",
        "it": "Diffusore 350 ml: 350 ml"
      },
      {
        "de": "Diffuser 1000 ml: 1000 ml",
        "en": "Diffuser 1000 ml: 1000 ml",
        "fr": "Diffuseur 1000 ml: 1000 ml",
        "it": "Diffusore 1000 ml: 1000 ml"
      },
      {
        "de": "Nachfüllflasche 300 ml: 300 ml",
        "en": "Refill bottle 300 ml: 300 ml",
        "fr": "Recharge 300 ml: 300 ml",
        "it": "Ricarica 300 ml: 300 ml"
      },
      {
        "de": "Nachfüllflasche 1000 ml: 1000 ml",
        "en": "Refill bottle 1000 ml: 1000 ml",
        "fr": "Recharge 1000 ml: 1000 ml",
        "it": "Ricarica 1000 ml: 1000 ml"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-altair-diffuser-1-opt.webp",
        "width": 838,
        "height": 1048,
        "alt": {
          "de": "Cire Trudon The Diffuser - Altaïr – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon The Diffuser - Altaïr – product view on a light background",
          "fr": "Cire Trudon The Diffuser - Altaïr – vue du produit sur fond clair",
          "it": "Cire Trudon The Diffuser - Altaïr – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/d/i/diffuseur_ocre_350_1200x1200jpg.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-altair-diffuser-2.webp",
        "width": 640,
        "height": 640,
        "alt": {
          "de": "Cire Trudon The Diffuser - Altaïr – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon The Diffuser - Altaïr – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon The Diffuser - Altaïr – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon The Diffuser - Altaïr – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/n/r/nr_trudon_hd_8_640x640_1_2.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-altair-diffuser-3.webp",
        "width": 640,
        "height": 640,
        "alt": {
          "de": "Cire Trudon The Diffuser - Altaïr – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon The Diffuser - Altaïr – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon The Diffuser - Altaïr – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon The Diffuser - Altaïr – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/n/r/nr_trudon_hd_11_640x640_4.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/altair-diffuser-350ml.html",
    "quellen": [
      "https://trudon.com/eu_de/altair-diffuser-350ml.html",
      "https://trudon.com/eu_de/altair-grosse-diffuser-1000ml.html",
      "https://trudon.com/eu_de/altair-diffuser-nachfuellung-300ml.html",
      "https://trudon.com/eu_de/altair-grosse-diffuser-nachfuellung-1000ml.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-altair-duftkerze",
      "cire-trudon-altair-raumspray"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Diffuser 350 ml",
            "en": "Diffuser 350 ml",
            "fr": "Diffuseur 350 ml",
            "it": "Diffusore 350 ml"
          },
          "betrag": 175,
          "sku": "TALT00035008XS001",
          "inhaltMl": 350,
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Diffuser 1000 ml",
            "en": "Diffuser 1000 ml",
            "fr": "Diffuseur 1000 ml",
            "it": "Diffusore 1000 ml"
          },
          "betrag": 320,
          "sku": "TALT00100008XS002",
          "inhaltMl": 1000,
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Nachfüllflasche 300 ml",
            "en": "Refill bottle 300 ml",
            "fr": "Recharge 300 ml",
            "it": "Ricarica 300 ml"
          },
          "betrag": 82,
          "sku": "TALT00030008RS001",
          "inhaltMl": 300
        },
        {
          "name": {
            "de": "Nachfüllflasche 1000 ml",
            "en": "Refill bottle 1000 ml",
            "fr": "Recharge 1000 ml",
            "it": "Ricarica 1000 ml"
          },
          "betrag": 160,
          "sku": "TALT00100008RS002",
          "inhaltMl": 1000
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/altair-diffuser-350ml.html"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Format",
          "en": "Format",
          "fr": "Format",
          "it": "Formato"
        },
        "optionen": [
          {
            "id": "diffuser-350-ml",
            "name": {
              "de": "Diffuser 350 ml",
              "en": "Diffuser 350 ml",
              "fr": "Diffuseur 350 ml",
              "it": "Diffusore 350 ml"
            },
            "code": "TALT00035008XS001",
            "betrag": 175,
            "standard": true
          },
          {
            "id": "diffuser-1000-ml",
            "name": {
              "de": "Diffuser 1000 ml",
              "en": "Diffuser 1000 ml",
              "fr": "Diffuseur 1000 ml",
              "it": "Diffusore 1000 ml"
            },
            "code": "TALT00100008XS002",
            "betrag": 320
          },
          {
            "id": "nachfullflasche-300-ml",
            "name": {
              "de": "Nachfüllflasche 300 ml",
              "en": "Refill bottle 300 ml",
              "fr": "Recharge 300 ml",
              "it": "Ricarica 300 ml"
            },
            "code": "TALT00030008RS001",
            "betrag": 82
          },
          {
            "id": "nachfullflasche-1000-ml",
            "name": {
              "de": "Nachfüllflasche 1000 ml",
              "en": "Refill bottle 1000 ml",
              "fr": "Recharge 1000 ml",
              "it": "Ricarica 1000 ml"
            },
            "code": "TALT00100008RS002",
            "betrag": 160
          }
        ]
      }
    ]
  },
  {
    "slug": "cire-trudon-diffuser-set",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "geschenkset",
    "name": "Diffuser-Set",
    "kurz": {
      "de": "Geschenkbox mit einem Diffuser und der passenden Nachfüllflasche.",
      "en": "Gift box with a diffuser and its matching refill bottle.",
      "fr": "Coffret réunissant un diffuseur et sa recharge.",
      "it": "Cofanetto con un diffusore e la relativa ricarica."
    },
    "merkmale": [],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-diffuser-set-1-opt.webp",
        "width": 1265,
        "height": 1581,
        "alt": {
          "de": "Cire Trudon Diffuser-Set – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Diffuser-Set – product view on a light background",
          "fr": "Cire Trudon Diffuser-Set – vue du produit sur fond clair",
          "it": "Cire Trudon Diffuser-Set – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_coffret_diffuseur_recharge_1200x1200_beige.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/diffusor-und-nachfullset.html",
    "quellen": [
      "https://trudon.com/eu_de/diffusor-und-nachfullset.html"
    ],
    "stand": "2026-10-31",
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/diffusor-und-nachfullset.html",
      "varianten": [
        {
          "name": {
            "de": "Einheitsgröße",
            "en": "One size",
            "fr": "Taille unique",
            "it": "Taglia unica"
          },
          "betrag": 257,
          "sku": "TRU/GIFTBOX/BUNDLE2"
        }
      ]
    }
  },
  {
    "slug": "cire-trudon-glas-glocke",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "wohnaccessoire",
    "name": "Glas Glocke",
    "kurz": {
      "de": "Mundgeblasene Glasglocke mit Trudon-Logo auf einem Untersatz aus poliertem Holz, unter der eine Kerze ausgestellt werden kann.",
      "en": "Mouth-blown glass cloche with the Trudon logo on a polished wooden base, for displaying a candle.",
      "fr": "Cloche en verre soufflé bouche ornée du logo Trudon, sur un socle en bois poli, pour présenter une bougie.",
      "it": "Campana in vetro soffiato a bocca con logo Trudon su una base in legno lucidato, per esporre una candela."
    },
    "merkmale": [],
    "masse": [
      {
        "key": "hoehe",
        "wert": "24 cm"
      },
      {
        "key": "durchmesser",
        "wert": "14 cm"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-glas-glocke-1-opt.webp",
        "width": 1043,
        "height": 1304,
        "alt": {
          "de": "Cire Trudon Glas Glocke – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Glas Glocke – product view on a light background",
          "fr": "Cire Trudon Glas Glocke – vue du produit sur fond clair",
          "it": "Cire Trudon Glas Glocke – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/j/a/jar_13_kit_tru_2_1200x1200.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-glas-glocke-2.webp",
        "width": 640,
        "height": 640,
        "alt": {
          "de": "Cire Trudon Glas Glocke – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon Glas Glocke – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon Glas Glocke – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon Glas Glocke – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_ecom_lacloche.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/glas-glocke.html",
    "quellen": [
      "https://trudon.com/eu_de/glas-glocke.html"
    ],
    "stand": "2026-10-31",
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/glas-glocke.html",
      "varianten": [
        {
          "name": {
            "de": "Einheitsgröße",
            "en": "One size",
            "fr": "Taille unique",
            "it": "Taglia unica"
          },
          "betrag": 90,
          "sku": "JAR/13/KIT/TRU",
          "zerbrechlich": true
        }
      ]
    }
  },
  {
    "slug": "cire-trudon-kerzenverzierung-in-bienenform",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "wohnaccessoire",
    "name": "Kerzenverzierung in Bienenform",
    "kurz": {
      "de": "Deckel mit Bienenmotiv für eine Trudon-Kerze: Er hält den Duft im Glas, solange die Kerze nicht brennt.",
      "en": "Lid with a bee motif for a Trudon candle: it keeps the scent in the glass while the candle is not lit.",
      "fr": "Couvercle à motif d’abeille pour bougie Trudon : il garde le parfum dans le verre tant que la bougie n’est pas allumée.",
      "it": "Coperchio con motivo ad ape per candela Trudon: trattiene il profumo nel vetro quando la candela è spenta."
    },
    "merkmale": [
      {
        "de": "Passend für eine Trudon-Classic-Kerze (270 g)",
        "en": "Fits a Trudon Classic candle (270 g)",
        "fr": "Adapté à une bougie Classique Trudon (270 g)",
        "it": "Adatto a una candela Classic Trudon (270 g)"
      }
    ],
    "masse": [
      {
        "key": "durchmesser",
        "wert": "10 cm"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-kerzenverzierung-in-bienenform-1-opt.webp",
        "width": 1029,
        "height": 1286,
        "alt": {
          "de": "Cire Trudon Kerzenverzierung in Bienenform – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Kerzenverzierung in Bienenform – product view on a light background",
          "fr": "Cire Trudon Kerzenverzierung in Bienenform – vue du produit sur fond clair",
          "it": "Cire Trudon Kerzenverzierung in Bienenform – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/x/txxx05027000cs001_1_1200x1200.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-kerzenverzierung-in-bienenform-2.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon Kerzenverzierung in Bienenform – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon Kerzenverzierung in Bienenform – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon Kerzenverzierung in Bienenform – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon Kerzenverzierung in Bienenform – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_sm2026_spring_summer_1200x1200.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-kerzenverzierung-in-bienenform-3.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon Kerzenverzierung in Bienenform – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon Kerzenverzierung in Bienenform – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon Kerzenverzierung in Bienenform – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon Kerzenverzierung in Bienenform – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_sm2026_spring_summer_30_1200x1200_4.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/kerzenverzierung-in-bienenform.html",
    "quellen": [
      "https://trudon.com/eu_de/kerzenverzierung-in-bienenform.html"
    ],
    "stand": "2026-10-31",
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/kerzenverzierung-in-bienenform.html",
      "varianten": [
        {
          "name": {
            "de": "Einheitsgröße",
            "en": "One size",
            "fr": "Taille unique",
            "it": "Taglia unica"
          },
          "betrag": 140,
          "sku": "TXXX05027000CS001"
        }
      ]
    }
  },
  {
    "slug": "cire-trudon-bienen-sockel",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "wohnaccessoire",
    "name": "Bienen Sockel",
    "kurz": {
      "de": "Sockel mit Bienen aus polierter Bronze als dekorativer Untersatz für eine Trudon-Kerze, Durchmesser 10 cm.",
      "en": "Bee stand in polished bronze as a decorative base for a Trudon candle, 10 cm in diameter.",
      "fr": "Socle aux abeilles en bronze poli, socle décoratif pour une bougie Trudon, 10 cm de diamètre.",
      "it": "Base con api in bronzo lucidato, base decorativa per una candela Trudon, diametro 10 cm."
    },
    "merkmale": [
      {
        "de": "Aus der Kollektion von Sockeln und Deckeln, die der Istanbuler Kunsthistoriker und Designer Serdar Gülgün für Trudon entworfen hat; in Werkstätten von Hand gefertigt",
        "en": "From the collection of stands and lids designed for Trudon by Istanbul-based art historian and designer Serdar Gülgün; made by hand in workshops",
        "fr": "Issu de la collection de socles et couvercles dessinée pour Trudon par l’historien de l’art et designer stambouliote Serdar Gülgün ; fabriqué à la main en atelier",
        "it": "Dalla collezione di basi e coperchi disegnata per Trudon dallo storico dell’arte e designer di Istanbul Serdar Gülgün; realizzata a mano in laboratorio"
      },
      {
        "de": "Passend für eine Trudon-Classic-Kerze (270 g)",
        "en": "Fits a Trudon Classic candle (270 g)",
        "fr": "Adapté à une bougie Classique Trudon (270 g)",
        "it": "Adatto a una candela Classic Trudon (270 g)"
      }
    ],
    "masse": [
      {
        "key": "durchmesser",
        "wert": "10 cm"
      }
    ],
    "designer": "Serdar Gülgün",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-bienen-sockel-1-opt.webp",
        "width": 931,
        "height": 1164,
        "alt": {
          "de": "Cire Trudon Bienen Sockel – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Bienen Sockel – product view on a light background",
          "fr": "Cire Trudon Bienen Sockel – vue du produit sur fond clair",
          "it": "Cire Trudon Bienen Sockel – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/s/e/serdar-couv3-1600x1600.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-bienen-sockel-2.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon Bienen Sockel – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon Bienen Sockel – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon Bienen Sockel – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon Bienen Sockel – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/s/e/serdar-couv6-1600x1600.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/bienen-sockel.html",
    "quellen": [
      "https://trudon.com/eu_de/bienen-sockel.html"
    ],
    "stand": "2026-10-31",
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/bienen-sockel.html",
      "varianten": [
        {
          "name": {
            "de": "Einheitsgröße",
            "en": "One size",
            "fr": "Taille unique",
            "it": "Taglia unica"
          },
          "betrag": 175,
          "sku": "BP-SER-012"
        }
      ]
    }
  },
  {
    "slug": "cire-trudon-kleine-duftkerzen-set",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "geschenkset",
    "name": "Kleine Duftkerzen-Set",
    "kurz": {
      "de": "Geschenkbox mit drei kleinen Duftkerzen zu je 70 g; laut Hersteller stellt man die Düfte selbst zusammen (nur im Geschäft).",
      "en": "Gift box with three small scented candles of 70 g each; according to the maker the scents are chosen by the customer (in store only).",
      "fr": "Coffret de trois petites bougies parfumées de 70 g ; selon le fabricant, le client compose lui-même les parfums (en boutique uniquement).",
      "it": "Cofanetto con tre piccole candele profumate da 70 g; secondo il produttore le fragranze si scelgono liberamente (solo in negozio)."
    },
    "merkmale": [
      {
        "de": "Brenndauer ca. 18–20 h",
        "en": "Burn time approx. 18–20 h",
        "fr": "Durée de combustion env. 18–20 h",
        "it": "Durata di combustione circa 18–20 h"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "6,5 cm"
      },
      {
        "key": "durchmesser",
        "wert": "5,5 cm"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-kleine-duftkerzen-set-1.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon Kleine Duftkerzen-Set – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Kleine Duftkerzen-Set – product view on a light background",
          "fr": "Cire Trudon Kleine Duftkerzen-Set – vue du produit sur fond clair",
          "it": "Cire Trudon Kleine Duftkerzen-Set – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_coffret_bougies_70g_1200x1200_beige.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-kleine-duftkerzen-set-2.webp",
        "width": 1600,
        "height": 1600,
        "alt": {
          "de": "Cire Trudon Kleine Duftkerzen-Set – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon Kleine Duftkerzen-Set – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon Kleine Duftkerzen-Set – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon Kleine Duftkerzen-Set – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/l/a/la-petite-bougie-base3_1600x1600_7.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-kleine-duftkerzen-set-3.webp",
        "width": 1600,
        "height": 1600,
        "alt": {
          "de": "Cire Trudon Kleine Duftkerzen-Set – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon Kleine Duftkerzen-Set – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon Kleine Duftkerzen-Set – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon Kleine Duftkerzen-Set – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/l/a/la-petite-bougie-base4_1600x1600_7.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/gift-box-for-3-petites-bougies.html",
    "quellen": [
      "https://trudon.com/eu_de/gift-box-for-3-petites-bougies.html"
    ],
    "stand": "2026-10-31",
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/gift-box-for-3-petites-bougies.html",
      "varianten": [
        {
          "name": {
            "de": "Einheitsgröße",
            "en": "One size",
            "fr": "Taille unique",
            "it": "Taglia unica"
          },
          "betrag": 120,
          "sku": "TRUPLV/SLV070"
        }
      ]
    }
  },
  {
    "slug": "cire-trudon-deckel-solis-rex",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "wohnaccessoire",
    "name": "Deckel Solis Rex",
    "kurz": {
      "de": "Deckel „Solis Rex“ aus poliertem Messing für eine Trudon-Kerze: Er hält den Duft im Glas, solange die Kerze nicht brennt.",
      "en": "“Solis Rex” lid in polished brass for a Trudon candle: it keeps the scent in the glass while the candle is not lit.",
      "fr": "Couvercle « Solis Rex » en laiton poli pour bougie Trudon : il garde le parfum dans le verre tant que la bougie n’est pas allumée.",
      "it": "Coperchio “Solis Rex” in ottone lucidato per candela Trudon: trattiene il profumo nel vetro quando la candela è spenta."
    },
    "merkmale": [
      {
        "de": "Passend für eine Trudon-Classic-Kerze (270 g)",
        "en": "Fits a Trudon Classic candle (270 g)",
        "fr": "Adapté à une bougie Classique Trudon (270 g)",
        "it": "Adatto a una candela Classic Trudon (270 g)"
      },
      {
        "de": "In Handarbeit gefertigt",
        "en": "Made by hand",
        "fr": "Fabriqué à la main",
        "it": "Realizzato a mano"
      }
    ],
    "masse": [
      {
        "key": "durchmesser",
        "wert": "10 cm"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-deckel-solis-rex-1-opt.webp",
        "width": 900,
        "height": 1125,
        "alt": {
          "de": "Cire Trudon Deckel Solis Rex – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Deckel Solis Rex – product view on a light background",
          "fr": "Cire Trudon Deckel Solis Rex – vue du produit sur fond clair",
          "it": "Cire Trudon Deckel Solis Rex – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/b/u/bug-couv-23_1200x1200.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/deckel-solis-rex-fur-kerze-270g.html",
    "quellen": [
      "https://trudon.com/eu_de/deckel-solis-rex-fur-kerze-270g.html"
    ],
    "stand": "2026-10-31",
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/deckel-solis-rex-fur-kerze-270g.html",
      "varianten": [
        {
          "name": {
            "de": "Einheitsgröße",
            "en": "One size",
            "fr": "Taille unique",
            "it": "Taglia unica"
          },
          "betrag": 80,
          "sku": "BUG-COUV-23"
        }
      ]
    }
  },
  {
    "slug": "cire-trudon-delfin-sockel",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "wohnaccessoire",
    "name": "Delfin Sockel",
    "kurz": {
      "de": "Sockel mit Delfinen als dekorativer Untersatz für eine Trudon-Kerze, Durchmesser 10 cm.",
      "en": "Dolphin stand as a decorative base for a Trudon candle, 10 cm in diameter.",
      "fr": "Socle aux dauphins, socle décoratif pour une bougie Trudon, 10 cm de diamètre.",
      "it": "Base con delfini, base decorativa per una candela Trudon, diametro 10 cm."
    },
    "merkmale": [
      {
        "de": "Aus der Kollektion von Sockeln und Deckeln, die der Istanbuler Kunsthistoriker und Designer Serdar Gülgün für Trudon entworfen hat; in Werkstätten von Hand gefertigt",
        "en": "From the collection of stands and lids designed for Trudon by Istanbul-based art historian and designer Serdar Gülgün; made by hand in workshops",
        "fr": "Issu de la collection de socles et couvercles dessinée pour Trudon par l’historien de l’art et designer stambouliote Serdar Gülgün ; fabriqué à la main en atelier",
        "it": "Dalla collezione di basi e coperchi disegnata per Trudon dallo storico dell’arte e designer di Istanbul Serdar Gülgün; realizzata a mano in laboratorio"
      }
    ],
    "masse": [
      {
        "key": "durchmesser",
        "wert": "10 cm"
      }
    ],
    "designer": "Serdar Gülgün",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-delfin-sockel-1-opt.webp",
        "width": 971,
        "height": 1214,
        "alt": {
          "de": "Cire Trudon Delfin Sockel – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Delfin Sockel – product view on a light background",
          "fr": "Cire Trudon Delfin Sockel – vue du produit sur fond clair",
          "it": "Cire Trudon Delfin Sockel – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/b/p/bp-ser-011_1200x1200.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/delfin-sockel.html",
    "quellen": [
      "https://trudon.com/eu_de/delfin-sockel.html"
    ],
    "stand": "2026-10-31",
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/delfin-sockel.html",
      "varianten": [
        {
          "name": {
            "de": "Einheitsgröße",
            "en": "One size",
            "fr": "Taille unique",
            "it": "Taglia unica"
          },
          "betrag": 175,
          "sku": "BP-SER-011"
        }
      ]
    }
  },
  {
    "slug": "cire-trudon-die-imperial-stumpenkerze",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "wohnaccessoire",
    "name": "Die Imperial Stumpenkerze",
    "kurz": {
      "de": "Stumpenkerze nach dem Vorbild der Kerze mit drei Goldstücken, die Napoleon seinem Sohn zur Geburt schenkte; Höhe 25 cm, Durchmesser 10 cm.",
      "en": "Pillar candle modelled on the candle with three gold pieces that Napoleon gave his son at birth; 25 cm high, 10 cm in diameter.",
      "fr": "Cierge inspiré de celui orné de trois pièces d’or que Napoléon offrit à son fils à sa naissance ; 25 cm de haut, 10 cm de diamètre.",
      "it": "Candela a colonna ispirata a quella con tre monete d’oro che Napoleone regalò al figlio alla nascita; alta 25 cm, diametro 10 cm."
    },
    "merkmale": [],
    "masse": [
      {
        "key": "hoehe",
        "wert": "25 cm"
      },
      {
        "key": "durchmesser",
        "wert": "10 cm"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-die-imperial-stumpenkerze-1-opt.webp",
        "width": 1004,
        "height": 1255,
        "alt": {
          "de": "Cire Trudon Die Imperial Stumpenkerze – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Die Imperial Stumpenkerze – product view on a light background",
          "fr": "Cire Trudon Die Imperial Stumpenkerze – vue du produit sur fond clair",
          "it": "Cire Trudon Die Imperial Stumpenkerze – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/c/i/cierges_camees_imperial_1600x1600_gris.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/imperial-stumpenkerze-schwarz.html",
    "quellen": [
      "https://trudon.com/eu_de/imperial-stumpenkerze-schwarz.html"
    ],
    "stand": "2026-10-31",
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/imperial-stumpenkerze-schwarz.html",
      "varianten": [
        {
          "name": {
            "de": "Einheitsgröße",
            "en": "One size",
            "fr": "Taille unique",
            "it": "Taglia unica"
          },
          "betrag": 90,
          "sku": "FU10-25/08/TRU"
        }
      ]
    }
  },
  {
    "slug": "cire-trudon-sockel-classic",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "wohnaccessoire",
    "name": "Sockel Classic",
    "kurz": {
      "de": "Klassischer Sockel für Trudon-Kerzen (Classique), laut Hersteller auch für Raumsprays und Büsten geeignet; Durchmesser 11 cm.",
      "en": "Classic stand for Trudon candles (Classique), also suitable for room sprays and busts according to the maker; 11 cm in diameter.",
      "fr": "Socle classique pour bougies Trudon (Classique), convient aussi selon le fabricant aux sprays d’intérieur et aux bustes ; 11 cm de diamètre.",
      "it": "Base classica per candele Trudon (Classique), adatta secondo il produttore anche a spray per ambienti e busti; diametro 11 cm."
    },
    "merkmale": [
      {
        "de": "In Handarbeit gefertigt",
        "en": "Made by hand",
        "fr": "Fabriqué à la main",
        "it": "Realizzato a mano"
      }
    ],
    "masse": [
      {
        "key": "durchmesser",
        "wert": "11 cm"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-sockel-classic-1-opt.webp",
        "width": 798,
        "height": 997,
        "alt": {
          "de": "Cire Trudon Sockel Classic – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Sockel Classic – product view on a light background",
          "fr": "Cire Trudon Sockel Classic – vue du produit sur fond clair",
          "it": "Cire Trudon Sockel Classic – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/b/u/bug-14055_1200x1200.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/klassische-sockel.html",
    "quellen": [
      "https://trudon.com/eu_de/klassische-sockel.html"
    ],
    "stand": "2026-10-31",
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/klassische-sockel.html",
      "varianten": [
        {
          "name": {
            "de": "Einheitsgröße",
            "en": "One size",
            "fr": "Taille unique",
            "it": "Taglia unica"
          },
          "betrag": 42,
          "sku": "BUG-14055"
        }
      ]
    }
  },
  {
    "slug": "cire-trudon-schildkroten-sockel",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "wohnaccessoire",
    "name": "Schildkröten Sockel",
    "kurz": {
      "de": "Sockel mit Schildkröten als dekorativer Untersatz für eine Trudon-Kerze, Durchmesser 10 cm.",
      "en": "Turtle stand as a decorative base for a Trudon candle, 10 cm in diameter.",
      "fr": "Socle aux tortues, socle décoratif pour une bougie Trudon, 10 cm de diamètre.",
      "it": "Base con tartarughe, base decorativa per una candela Trudon, diametro 10 cm."
    },
    "merkmale": [
      {
        "de": "Aus der Kollektion von Sockeln und Deckeln, die der Istanbuler Kunsthistoriker und Designer Serdar Gülgün für Trudon entworfen hat; in Werkstätten von Hand gefertigt",
        "en": "From the collection of stands and lids designed for Trudon by Istanbul-based art historian and designer Serdar Gülgün; made by hand in workshops",
        "fr": "Issu de la collection de socles et couvercles dessinée pour Trudon par l’historien de l’art et designer stambouliote Serdar Gülgün ; fabriqué à la main en atelier",
        "it": "Dalla collezione di basi e coperchi disegnata per Trudon dallo storico dell’arte e designer di Istanbul Serdar Gülgün; realizzata a mano in laboratorio"
      }
    ],
    "masse": [
      {
        "key": "durchmesser",
        "wert": "10 cm"
      }
    ],
    "designer": "Serdar Gülgün",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-schildkroten-sockel-1-opt.webp",
        "width": 910,
        "height": 1138,
        "alt": {
          "de": "Cire Trudon Schildkröten Sockel – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Schildkröten Sockel – product view on a light background",
          "fr": "Cire Trudon Schildkröten Sockel – vue du produit sur fond clair",
          "it": "Cire Trudon Schildkröten Sockel – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/b/p/bp-ser-008_1200x1200.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/schildkroten-sockel.html",
    "quellen": [
      "https://trudon.com/eu_de/schildkroten-sockel.html"
    ],
    "stand": "2026-10-31",
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/schildkroten-sockel.html",
      "varianten": [
        {
          "name": {
            "de": "Einheitsgröße",
            "en": "One size",
            "fr": "Taille unique",
            "it": "Taglia unica"
          },
          "betrag": 175,
          "sku": "BP-SER-008"
        }
      ]
    }
  },
  {
    "slug": "cire-trudon-franzosischer-quasten-sockel",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "wohnaccessoire",
    "name": "Französischer Quasten-Sockel",
    "kurz": {
      "de": "Sockel mit Quastenmotiv, das an die Gemächer des Petit Trianon in Versailles erinnert, als dekorativer Untersatz für eine Trudon-Kerze.",
      "en": "Stand with a tassel motif recalling the apartments of the Petit Trianon at Versailles, as a decorative base for a Trudon candle.",
      "fr": "Socle à motif de glands évoquant les appartements du Petit Trianon à Versailles, support décoratif pour une bougie Trudon.",
      "it": "Base con motivo a nappe che richiama gli appartamenti del Petit Trianon a Versailles, supporto decorativo per una candela Trudon."
    },
    "merkmale": [
      {
        "de": "Aus der Kollektion von Serdar Gülgün für Trudon; in Istanbul von Hand gefertigt",
        "en": "From Serdar Gülgün’s collection for Trudon; made by hand in Istanbul",
        "fr": "Collection de Serdar Gülgün pour Trudon ; fabriqué à la main à Istanbul",
        "it": "Dalla collezione di Serdar Gülgün per Trudon; realizzato a mano a Istanbul"
      }
    ],
    "designer": "Serdar Gülgün",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-franzosischer-quasten-sockel-1-opt.webp",
        "width": 798,
        "height": 998,
        "alt": {
          "de": "Cire Trudon Französischer Quasten-Sockel – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Französischer Quasten-Sockel – product view on a light background",
          "fr": "Cire Trudon Französischer Quasten-Sockel – vue du produit sur fond clair",
          "it": "Cire Trudon Französischer Quasten-Sockel – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/b/p/bp-ser-020_1200x1200_2.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/franzosischer-quasten-sockel.html",
    "quellen": [
      "https://trudon.com/eu_de/franzosischer-quasten-sockel.html"
    ],
    "stand": "2026-10-31",
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/franzosischer-quasten-sockel.html",
      "varianten": [
        {
          "name": {
            "de": "Einheitsgröße",
            "en": "One size",
            "fr": "Taille unique",
            "it": "Taglia unica"
          },
          "betrag": 280,
          "sku": "BP-SER-020"
        }
      ]
    }
  },
  {
    "slug": "cire-trudon-anemonen-sockel",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "wohnaccessoire",
    "name": "Anemonen Sockel",
    "kurz": {
      "de": "Sockel mit Anemonen als dekorativer Untersatz für eine Trudon-Kerze, Durchmesser 10 cm.",
      "en": "Anemone stand as a decorative base for a Trudon candle, 10 cm in diameter.",
      "fr": "Socle aux anémones, socle décoratif pour une bougie Trudon, 10 cm de diamètre.",
      "it": "Base con anemoni, base decorativa per una candela Trudon, diametro 10 cm."
    },
    "merkmale": [
      {
        "de": "Aus der Kollektion von Sockeln und Deckeln, die der Istanbuler Kunsthistoriker und Designer Serdar Gülgün für Trudon entworfen hat; in Werkstätten von Hand gefertigt",
        "en": "From the collection of stands and lids designed for Trudon by Istanbul-based art historian and designer Serdar Gülgün; made by hand in workshops",
        "fr": "Issu de la collection de socles et couvercles dessinée pour Trudon par l’historien de l’art et designer stambouliote Serdar Gülgün ; fabriqué à la main en atelier",
        "it": "Dalla collezione di basi e coperchi disegnata per Trudon dallo storico dell’arte e designer di Istanbul Serdar Gülgün; realizzata a mano in laboratorio"
      },
      {
        "de": "Passend für eine Trudon-Classic-Kerze (270 g)",
        "en": "Fits a Trudon Classic candle (270 g)",
        "fr": "Adapté à une bougie Classique Trudon (270 g)",
        "it": "Adatto a una candela Classic Trudon (270 g)"
      }
    ],
    "masse": [
      {
        "key": "durchmesser",
        "wert": "10 cm"
      }
    ],
    "designer": "Serdar Gülgün",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-anemonen-sockel-1-opt.webp",
        "width": 915,
        "height": 1144,
        "alt": {
          "de": "Cire Trudon Anemonen Sockel – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Anemonen Sockel – product view on a light background",
          "fr": "Cire Trudon Anemonen Sockel – vue du produit sur fond clair",
          "it": "Cire Trudon Anemonen Sockel – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/b/p/bp-ser-007_1200x1200.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/anemonen-sockel.html",
    "quellen": [
      "https://trudon.com/eu_de/anemonen-sockel.html"
    ],
    "stand": "2026-10-31",
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/anemonen-sockel.html",
      "varianten": [
        {
          "name": {
            "de": "Einheitsgröße",
            "en": "One size",
            "fr": "Taille unique",
            "it": "Taglia unica"
          },
          "betrag": 175,
          "sku": "BP-SER-007"
        }
      ]
    }
  },
  {
    "slug": "cire-trudon-deckel-classic",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "wohnaccessoire",
    "name": "Deckel Classic",
    "kurz": {
      "de": "Klassischer Messingdeckel für eine Trudon-Kerze: Er hält den Duft im Glas, solange die Kerze nicht brennt.",
      "en": "Classic brass lid for a Trudon candle: it keeps the scent in the glass while the candle is not lit.",
      "fr": "Couvercle classique en laiton pour bougie Trudon : il garde le parfum dans le verre tant que la bougie n’est pas allumée.",
      "it": "Coperchio classico in ottone per candela Trudon: trattiene il profumo nel vetro quando la candela è spenta."
    },
    "merkmale": [
      {
        "de": "Passend für eine Trudon-Classic-Kerze (270 g)",
        "en": "Fits a Trudon Classic candle (270 g)",
        "fr": "Adapté à une bougie Classique Trudon (270 g)",
        "it": "Adatto a una candela Classic Trudon (270 g)"
      },
      {
        "de": "In Handarbeit gefertigt",
        "en": "Made by hand",
        "fr": "Fabriqué à la main",
        "it": "Realizzato a mano"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-deckel-classic-1-opt.webp",
        "width": 854,
        "height": 1068,
        "alt": {
          "de": "Cire Trudon Deckel Classic – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Deckel Classic – product view on a light background",
          "fr": "Cire Trudon Deckel Classic – vue du produit sur fond clair",
          "it": "Cire Trudon Deckel Classic – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/b/u/bug-couv-22_1200x1200.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/klassische-deckel.html",
    "quellen": [
      "https://trudon.com/eu_de/klassische-deckel.html"
    ],
    "stand": "2026-10-31",
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/klassische-deckel.html",
      "varianten": [
        {
          "name": {
            "de": "Einheitsgröße",
            "en": "One size",
            "fr": "Taille unique",
            "it": "Taglia unica"
          },
          "betrag": 80,
          "sku": "BUG-COUV-22"
        }
      ]
    }
  },
  {
    "slug": "cire-trudon-ei-abdeckung",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "wohnaccessoire",
    "name": "Ei Abdeckung",
    "kurz": {
      "de": "Deckel „Ei“ aus polierter Bronze für eine Trudon-Kerze: Er hält den Duft im Glas, solange die Kerze nicht brennt.",
      "en": "“Egg” lid in polished bronze for a Trudon candle: it keeps the scent in the glass while the candle is not lit.",
      "fr": "Couvercle « Œuf » en bronze poli pour bougie Trudon : il garde le parfum dans le verre tant que la bougie n’est pas allumée.",
      "it": "Coperchio “Uovo” in bronzo lucidato per candela Trudon: trattiene il profumo nel vetro quando la candela è spenta."
    },
    "merkmale": [
      {
        "de": "Passend für eine Trudon-Classic-Kerze (270 g)",
        "en": "Fits a Trudon Classic candle (270 g)",
        "fr": "Adapté à une bougie Classique Trudon (270 g)",
        "it": "Adatto a una candela Classic Trudon (270 g)"
      },
      {
        "de": "Aus der Kollektion von Sockeln und Deckeln, die der Istanbuler Kunsthistoriker und Designer Serdar Gülgün für Trudon entworfen hat; in Werkstätten von Hand gefertigt",
        "en": "From the collection of stands and lids designed for Trudon by Istanbul-based art historian and designer Serdar Gülgün; made by hand in workshops",
        "fr": "Issu de la collection de socles et couvercles dessinée pour Trudon par l’historien de l’art et designer stambouliote Serdar Gülgün ; fabriqué à la main en atelier",
        "it": "Dalla collezione di basi e coperchi disegnata per Trudon dallo storico dell’arte e designer di Istanbul Serdar Gülgün; realizzata a mano in laboratorio"
      }
    ],
    "masse": [
      {
        "key": "durchmesser",
        "wert": "10 cm"
      }
    ],
    "designer": "Serdar Gülgün",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-ei-abdeckung-1-opt.webp",
        "width": 934,
        "height": 1168,
        "alt": {
          "de": "Cire Trudon Ei Abdeckung – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Ei Abdeckung – product view on a light background",
          "fr": "Cire Trudon Ei Abdeckung – vue du produit sur fond clair",
          "it": "Cire Trudon Ei Abdeckung – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/b/p/bp-ser-005_1200x1200.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/ei-abdeckung.html",
    "quellen": [
      "https://trudon.com/eu_de/ei-abdeckung.html"
    ],
    "stand": "2026-10-31",
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/ei-abdeckung.html",
      "varianten": [
        {
          "name": {
            "de": "Einheitsgröße",
            "en": "One size",
            "fr": "Taille unique",
            "it": "Taglia unica"
          },
          "betrag": 105,
          "sku": "BP-SER-014"
        }
      ]
    }
  },
  {
    "slug": "cire-trudon-deckel-mit-spitze",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "wohnaccessoire",
    "name": "Deckel mit Spitze",
    "kurz": {
      "de": "Deckel mit Spitze für eine Trudon-Kerze: Er hält den Duft im Glas, solange die Kerze nicht brennt.",
      "en": "Pointed lid for a Trudon candle: it keeps the scent in the glass while the candle is not lit.",
      "fr": "Couvercle à pointe pour bougie Trudon : il garde le parfum dans le verre tant que la bougie n’est pas allumée.",
      "it": "Coperchio a punta per candela Trudon: trattiene il profumo nel vetro quando la candela è spenta."
    },
    "merkmale": [
      {
        "de": "Passend für eine Trudon-Classic-Kerze (270 g)",
        "en": "Fits a Trudon Classic candle (270 g)",
        "fr": "Adapté à une bougie Classique Trudon (270 g)",
        "it": "Adatto a una candela Classic Trudon (270 g)"
      },
      {
        "de": "Aus der Kollektion von Sockeln und Deckeln, die der Istanbuler Kunsthistoriker und Designer Serdar Gülgün für Trudon entworfen hat; in Werkstätten von Hand gefertigt",
        "en": "From the collection of stands and lids designed for Trudon by Istanbul-based art historian and designer Serdar Gülgün; made by hand in workshops",
        "fr": "Issu de la collection de socles et couvercles dessinée pour Trudon par l’historien de l’art et designer stambouliote Serdar Gülgün ; fabriqué à la main en atelier",
        "it": "Dalla collezione di basi e coperchi disegnata per Trudon dallo storico dell’arte e designer di Istanbul Serdar Gülgün; realizzata a mano in laboratorio"
      }
    ],
    "masse": [
      {
        "key": "durchmesser",
        "wert": "10 cm"
      }
    ],
    "designer": "Serdar Gülgün",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-deckel-mit-spitze-1-opt.webp",
        "width": 906,
        "height": 1132,
        "alt": {
          "de": "Cire Trudon Deckel mit Spitze – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Deckel mit Spitze – product view on a light background",
          "fr": "Cire Trudon Deckel mit Spitze – vue du produit sur fond clair",
          "it": "Cire Trudon Deckel mit Spitze – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/b/p/bp-ser-006_1200x1200.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/deckel-mit-spitze.html",
    "quellen": [
      "https://trudon.com/eu_de/deckel-mit-spitze.html"
    ],
    "stand": "2026-10-31",
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/deckel-mit-spitze.html",
      "varianten": [
        {
          "name": {
            "de": "Einheitsgröße",
            "en": "One size",
            "fr": "Taille unique",
            "it": "Taglia unica"
          },
          "betrag": 95,
          "sku": "BP-SER-006"
        }
      ]
    }
  },
  {
    "slug": "cire-trudon-messingabdeckung",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "wohnaccessoire",
    "name": "Messingabdeckung",
    "kurz": {
      "de": "Messingdeckel mit eingelegten Steinen für eine Trudon-Kerze: Er hält den Duft im Glas, solange die Kerze nicht brennt.",
      "en": "Brass lid inlaid with stones for a Trudon candle: it keeps the scent in the glass while the candle is not lit.",
      "fr": "Couvercle en laiton incrusté de pierres pour bougie Trudon : il garde le parfum dans le verre tant que la bougie n’est pas allumée.",
      "it": "Coperchio in ottone con pietre incastonate per candela Trudon: trattiene il profumo nel vetro quando la candela è spenta."
    },
    "merkmale": [
      {
        "de": "Passend für eine Trudon-Classic-Kerze (270 g)",
        "en": "Fits a Trudon Classic candle (270 g)",
        "fr": "Adapté à une bougie Classique Trudon (270 g)",
        "it": "Adatto a una candela Classic Trudon (270 g)"
      },
      {
        "de": "Aus der Kollektion von Sockeln und Deckeln, die der Istanbuler Kunsthistoriker und Designer Serdar Gülgün für Trudon entworfen hat; in Werkstätten von Hand gefertigt",
        "en": "From the collection of stands and lids designed for Trudon by Istanbul-based art historian and designer Serdar Gülgün; made by hand in workshops",
        "fr": "Issu de la collection de socles et couvercles dessinée pour Trudon par l’historien de l’art et designer stambouliote Serdar Gülgün ; fabriqué à la main en atelier",
        "it": "Dalla collezione di basi e coperchi disegnata per Trudon dallo storico dell’arte e designer di Istanbul Serdar Gülgün; realizzata a mano in laboratorio"
      }
    ],
    "masse": [
      {
        "key": "durchmesser",
        "wert": "10 cm"
      }
    ],
    "designer": "Serdar Gülgün",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-messingabdeckung-1-opt.webp",
        "width": 669,
        "height": 836,
        "alt": {
          "de": "Cire Trudon Messingabdeckung – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Messingabdeckung – product view on a light background",
          "fr": "Cire Trudon Messingabdeckung – vue du produit sur fond clair",
          "it": "Cire Trudon Messingabdeckung – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/a/c/accessoire_socle_boule_1600x1600_gris.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/messingabdeckung.html",
    "quellen": [
      "https://trudon.com/eu_de/messingabdeckung.html"
    ],
    "stand": "2026-10-31",
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/messingabdeckung.html",
      "varianten": [
        {
          "name": {
            "de": "Einheitsgröße",
            "en": "One size",
            "fr": "Taille unique",
            "it": "Taglia unica"
          },
          "betrag": 95,
          "sku": "BP-SER-005"
        }
      ]
    }
  },
  {
    "slug": "cire-trudon-die-kerzenloscher",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "wohnaccessoire",
    "name": "Die Kerzenlöscher",
    "kurz": {
      "de": "Dochtlöscher mit dünnem Messinghaken: Der Docht wird ins Wachs gedrückt und danach wieder aufgerichtet, sodass er sich erneut anzünden lässt.",
      "en": "Wick dipper with a slim brass hook: the wick is pressed into the wax and then raised again so it can be relit.",
      "fr": "Éteignoir à crochet fin en laiton : la mèche est plongée dans la cire puis redressée pour être rallumée.",
      "it": "Spegnistoppino con sottile gancio in ottone: lo stoppino viene immerso nella cera e poi raddrizzato per riaccenderlo."
    },
    "merkmale": [],
    "designer": "Pauline Deltour",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-die-kerzenloscher-1.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon Die Kerzenlöscher – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Die Kerzenlöscher – product view on a light background",
          "fr": "Cire Trudon Die Kerzenlöscher – vue du produit sur fond clair",
          "it": "Cire Trudon Die Kerzenlöscher – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/tru_etein_cyl_1200x1200.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/kerzenloescher.html",
    "quellen": [
      "https://trudon.com/eu_de/kerzenloescher.html"
    ],
    "stand": "2026-10-31",
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/kerzenloescher.html",
      "varianten": [
        {
          "name": {
            "de": "Einheitsgröße",
            "en": "One size",
            "fr": "Taille unique",
            "it": "Taglia unica"
          },
          "betrag": 40,
          "sku": "TRU/ETEIN/CYL"
        }
      ]
    }
  },
  {
    "slug": "cire-trudon-die-kegel-kerzenloscher",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "wohnaccessoire",
    "name": "Die Kegel Kerzenlöscher",
    "kurz": {
      "de": "Kegelförmiger Kerzenlöscher für Stabkerzen, löscht die Flamme, ohne den Docht einzuklemmen.",
      "en": "Cone-shaped snuffer for taper candles that puts out the flame without pinching the wick.",
      "fr": "Éteignoir conique pour chandelles, qui éteint la flamme sans pincer la mèche.",
      "it": "Spegnicandela a cono per candele affusolate, spegne la fiamma senza schiacciare lo stoppino."
    },
    "merkmale": [
      {
        "de": "In Handarbeit gefertigt",
        "en": "Made by hand",
        "fr": "Fabriqué à la main",
        "it": "Realizzato a mano"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-die-kegel-kerzenloscher-1-opt.webp",
        "width": 1122,
        "height": 1403,
        "alt": {
          "de": "Cire Trudon Die Kegel Kerzenlöscher – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Die Kegel Kerzenlöscher – product view on a light background",
          "fr": "Cire Trudon Die Kegel Kerzenlöscher – vue du produit sur fond clair",
          "it": "Cire Trudon Die Kegel Kerzenlöscher – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/b/u/bug-14384_1200x1200.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/kegel-kerzenloescher.html",
    "quellen": [
      "https://trudon.com/eu_de/kegel-kerzenloescher.html"
    ],
    "stand": "2026-10-31",
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/kegel-kerzenloescher.html",
      "varianten": [
        {
          "name": {
            "de": "Einheitsgröße",
            "en": "One size",
            "fr": "Taille unique",
            "it": "Taglia unica"
          },
          "betrag": 45,
          "sku": "BUG-14384"
        }
      ]
    }
  },
  {
    "slug": "cire-trudon-kerzenstander-trio",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "wohnaccessoire",
    "name": "Kerzenständer Trio",
    "kurz": {
      "de": "Drei Kerzenhalter aus Messing für Madeleine-Kerzen in den Höhen 12, 15 und 18 cm.",
      "en": "Set of three brass candleholders for Madeleine candles, 12, 15 and 18 cm high.",
      "fr": "Trio de bougeoirs en laiton pour chandelles Madeleine, hauteurs 12, 15 et 18 cm.",
      "it": "Tris di portacandele in ottone per candele Madeleine, alti 12, 15 e 18 cm."
    },
    "merkmale": [
      {
        "de": "In Handarbeit gefertigt",
        "en": "Made by hand",
        "fr": "Fabriqué à la main",
        "it": "Realizzato a mano"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-kerzenstander-trio-1-opt.webp",
        "width": 967,
        "height": 1209,
        "alt": {
          "de": "Cire Trudon Kerzenständer Trio – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Kerzenständer Trio – product view on a light background",
          "fr": "Cire Trudon Kerzenständer Trio – vue du produit sur fond clair",
          "it": "Cire Trudon Kerzenständer Trio – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/b/p/bp-bug-1518set_1200x1200.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-kerzenstander-trio-2.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon Kerzenständer Trio – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon Kerzenständer Trio – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon Kerzenständer Trio – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon Kerzenständer Trio – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/b/o/bougeoir_trio.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/kerzenstaender-trio.html",
    "quellen": [
      "https://trudon.com/eu_de/kerzenstaender-trio.html"
    ],
    "stand": "2026-10-31",
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/kerzenstaender-trio.html",
      "varianten": [
        {
          "name": {
            "de": "Einheitsgröße",
            "en": "One size",
            "fr": "Taille unique",
            "it": "Taglia unica"
          },
          "betrag": 90,
          "sku": "BP-BUG-1518SET"
        }
      ]
    }
  },
  {
    "slug": "cire-trudon-armleuchter",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "wohnaccessoire",
    "name": "Armleuchter",
    "kurz": {
      "de": "Armleuchter aus Messing für Madeleine-Spitzkerzen.",
      "en": "Brass candelabra for Madeleine taper candles.",
      "fr": "Candélabre en laiton pour chandelles Madeleine.",
      "it": "Candelabro in ottone per candele affusolate Madeleine."
    },
    "merkmale": [
      {
        "de": "In Handarbeit gefertigt",
        "en": "Made by hand",
        "fr": "Fabriqué à la main",
        "it": "Realizzato a mano"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-armleuchter-1-opt.webp",
        "width": 838,
        "height": 1048,
        "alt": {
          "de": "Cire Trudon Armleuchter – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Armleuchter – product view on a light background",
          "fr": "Cire Trudon Armleuchter – vue du produit sur fond clair",
          "it": "Cire Trudon Armleuchter – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/b/u/bugatti-5-1600x1600_1.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/armleuchter.html",
    "quellen": [
      "https://trudon.com/eu_de/armleuchter.html"
    ],
    "stand": "2026-10-31",
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/armleuchter.html",
      "varianten": [
        {
          "name": {
            "de": "Einheitsgröße",
            "en": "One size",
            "fr": "Taille unique",
            "it": "Taglia unica"
          },
          "betrag": 90,
          "sku": "BUG-14145"
        }
      ]
    }
  },
  {
    "slug": "cire-trudon-fein-dekorierter-kerzenstander",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "wohnaccessoire",
    "name": "Fein dekorierter Kerzenständer",
    "kurz": {
      "de": "Fein dekorierter Kerzenständer für die Royale-Spitzkerzen.",
      "en": "Finely decorated candlestick for Royale taper candles.",
      "fr": "Bougeoir finement décoré pour chandelles Royale.",
      "it": "Candeliere finemente decorato per candele affusolate Royale."
    },
    "merkmale": [
      {
        "de": "In Handarbeit gefertigt",
        "en": "Made by hand",
        "fr": "Fabriqué à la main",
        "it": "Realizzato a mano"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-fein-dekorierter-kerzenstander-1-opt.webp",
        "width": 962,
        "height": 1202,
        "alt": {
          "de": "Cire Trudon Fein dekorierter Kerzenständer – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Fein dekorierter Kerzenständer – product view on a light background",
          "fr": "Cire Trudon Fein dekorierter Kerzenständer – vue du produit sur fond clair",
          "it": "Cire Trudon Fein dekorierter Kerzenständer – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/b/u/bug-14886b_1200x1200.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-fein-dekorierter-kerzenstander-2.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon Fein dekorierter Kerzenständer – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon Fein dekorierter Kerzenständer – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon Fein dekorierter Kerzenständer – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon Fein dekorierter Kerzenständer – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/b/o/bougeoir_cisel_royales.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/fein-dekorierter-kerzenstaender.html",
    "quellen": [
      "https://trudon.com/eu_de/fein-dekorierter-kerzenstaender.html"
    ],
    "stand": "2026-10-31",
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/fein-dekorierter-kerzenstaender.html",
      "varianten": [
        {
          "name": {
            "de": "Einheitsgröße",
            "en": "One size",
            "fr": "Taille unique",
            "it": "Taglia unica"
          },
          "betrag": 60,
          "sku": "BUG-14886B"
        }
      ]
    }
  },
  {
    "slug": "cire-trudon-hollandischer-kerzenstander",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "wohnaccessoire",
    "name": "Holländischer Kerzenständer",
    "kurz": {
      "de": "Vergoldeter Kerzenständer in holländischer Form für Madeleine-Spitzkerzen.",
      "en": "Gilded Dutch-style candlestick for Madeleine taper candles.",
      "fr": "Bougeoir hollandais doré pour chandelles Madeleine.",
      "it": "Candeliere olandese dorato per candele affusolate Madeleine."
    },
    "merkmale": [
      {
        "de": "In Handarbeit gefertigt",
        "en": "Made by hand",
        "fr": "Fabriqué à la main",
        "it": "Realizzato a mano"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-hollandischer-kerzenstander-1-opt.webp",
        "width": 954,
        "height": 1192,
        "alt": {
          "de": "Cire Trudon Holländischer Kerzenständer – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Holländischer Kerzenständer – product view on a light background",
          "fr": "Cire Trudon Holländischer Kerzenständer – vue du produit sur fond clair",
          "it": "Cire Trudon Holländischer Kerzenständer – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/b/u/bug-14175_1200x1200.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-hollandischer-kerzenstander-2.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon Holländischer Kerzenständer – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon Holländischer Kerzenständer – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon Holländischer Kerzenständer – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon Holländischer Kerzenständer – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/b/o/bougeoir_hollandais.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/hollaendischer-kerzenstaender.html",
    "quellen": [
      "https://trudon.com/eu_de/hollaendischer-kerzenstaender.html"
    ],
    "stand": "2026-10-31",
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/hollaendischer-kerzenstaender.html",
      "varianten": [
        {
          "name": {
            "de": "Einheitsgröße",
            "en": "One size",
            "fr": "Taille unique",
            "it": "Taglia unica"
          },
          "betrag": 60,
          "sku": "BUG-14175"
        }
      ]
    }
  },
  {
    "slug": "cire-trudon-blumen-kerzenstander",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "wohnaccessoire",
    "name": "Blumen Kerzenständer",
    "kurz": {
      "de": "Kerzenständer aus Messing in Blumenform für Madeleine-Spitzkerzen.",
      "en": "Flower-shaped brass candlestick for Madeleine taper candles.",
      "fr": "Bougeoir en laiton en forme de fleur pour chandelles Madeleine.",
      "it": "Candeliere in ottone a forma di fiore per candele affusolate Madeleine."
    },
    "merkmale": [
      {
        "de": "In Handarbeit gefertigt",
        "en": "Made by hand",
        "fr": "Fabriqué à la main",
        "it": "Realizzato a mano"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-blumen-kerzenstander-1-opt.webp",
        "width": 965,
        "height": 1206,
        "alt": {
          "de": "Cire Trudon Blumen Kerzenständer – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Blumen Kerzenständer – product view on a light background",
          "fr": "Cire Trudon Blumen Kerzenständer – vue du produit sur fond clair",
          "it": "Cire Trudon Blumen Kerzenständer – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/b/u/bug-14952_1200x1200.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-blumen-kerzenstander-2.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon Blumen Kerzenständer – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon Blumen Kerzenständer – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon Blumen Kerzenständer – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon Blumen Kerzenständer – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/b/o/bougeoir_fleurs.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/blumen-kerzenstaender.html",
    "quellen": [
      "https://trudon.com/eu_de/blumen-kerzenstaender.html"
    ],
    "stand": "2026-10-31",
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/blumen-kerzenstaender.html",
      "varianten": [
        {
          "name": {
            "de": "Einheitsgröße",
            "en": "One size",
            "fr": "Taille unique",
            "it": "Taglia unica"
          },
          "betrag": 60,
          "sku": "BUG-14952"
        }
      ]
    }
  },
  {
    "slug": "cire-trudon-louise",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "wohnaccessoire",
    "name": "Louise",
    "kurz": {
      "de": "Büste „Louise“ nach dem Kinderporträt von Jean-Antoine Houdon (1777), in den Farbtönen Pierre und Rose, Höhe 21 cm.",
      "en": "“Louise” bust after Jean-Antoine Houdon’s child portrait (1777), in the shades Pierre and Rose, 21 cm high.",
      "fr": "Buste « Louise » d’après le portrait d’enfant de Jean-Antoine Houdon (1777), en teintes Pierre et Rose, 21 cm de haut.",
      "it": "Busto “Louise” dal ritratto infantile di Jean-Antoine Houdon (1777), nelle tonalità Pierre e Rose, alto 21 cm."
    },
    "merkmale": [
      {
        "de": "Im Shop unter Dekoration · Büsten geführt",
        "en": "Listed in the shop under Decoration · Busts",
        "fr": "Présenté dans la boutique sous Décoration · Bustes",
        "it": "Presentato nel negozio in Decorazione · Busti"
      },
      {
        "de": "Pierre: H 21 cm",
        "en": "Pierre: H 21 cm",
        "fr": "Pierre: H 21 cm",
        "it": "Pierre: H 21 cm"
      },
      {
        "de": "Rose: H 21 cm",
        "en": "Rose: H 21 cm",
        "fr": "Rose: H 21 cm",
        "it": "Rose: H 21 cm"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-louise-1-opt.webp",
        "width": 838,
        "height": 1048,
        "alt": {
          "de": "Cire Trudon Louise – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Louise – product view on a light background",
          "fr": "Cire Trudon Louise – vue du produit sur fond clair",
          "it": "Cire Trudon Louise – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/b/u/bustes_louise_stone_1600x1600_gris_1.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-louise-2.webp",
        "width": 1600,
        "height": 1600,
        "alt": {
          "de": "Cire Trudon Louise – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon Louise – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon Louise – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon Louise – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/i/m/img_0781.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/louise-stein.html",
    "quellen": [
      "https://trudon.com/eu_de/louise-stein.html",
      "https://trudon.com/eu_de/louise-rosa.html"
    ],
    "stand": "2026-10-31",
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": "Pierre",
          "betrag": 130,
          "sku": "LOS/514/TRU"
        },
        {
          "name": "Rose",
          "betrag": 130,
          "sku": "LOS/826/TRU"
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/louise-stein.html"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Farbe",
          "en": "Colour",
          "fr": "Couleur",
          "it": "Colore"
        },
        "optionen": [
          {
            "id": "pierre",
            "name": "Pierre",
            "code": "LOS/514/TRU",
            "betrag": 130,
            "standard": true,
            "bilder": [
              "/Images/Wellness/produkte/cire-trudon/cire-trudon-louise-1-opt.webp"
            ]
          },
          {
            "id": "rose",
            "name": "Rose",
            "code": "LOS/826/TRU",
            "betrag": 130,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-louise-11-opt.webp",
                "width": 831,
                "height": 1039,
                "alt": {
                  "de": "Cire Trudon Louise in Rose – Produktansicht",
                  "en": "Cire Trudon Louise in Rose – product view",
                  "fr": "Cire Trudon Louise en Rose – vue du produit",
                  "it": "Cire Trudon Louise in Rose – vista del prodotto"
                },
                "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/b/u/bustes_louise_rose_1600x1600_gris.jpg",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          }
        ]
      }
    ],
    "zubehoer": [
      {
        "slug": "cire-trudon-sockel-classic",
        "hinweis": {
          "de": "Laut Hersteller auch für Büsten geeignet",
          "en": "Also suitable for busts according to the maker",
          "fr": "Convient aussi aux bustes selon le fabricant",
          "it": "Adatta anche ai busti secondo il produttore"
        }
      }
    ]
  },
  {
    "slug": "cire-trudon-l-esclave-pierre",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "wohnaccessoire",
    "name": "L'Esclave-Pierre",
    "kurz": {
      "de": "Büste „L’Esclave“ nach der Büstenreihe von Jean-Baptiste Carpeaux (um 1870), im Farbton Pierre, Höhe 35 cm.",
      "en": "“L’Esclave” bust after Jean-Baptiste Carpeaux’s series of busts (around 1870), in the shade Pierre, 35 cm high.",
      "fr": "Buste « L’Esclave » d’après la série de bustes de Jean-Baptiste Carpeaux (vers 1870), teinte Pierre, 35 cm de haut.",
      "it": "Busto “L’Esclave” dalla serie di busti di Jean-Baptiste Carpeaux (intorno al 1870), tonalità Pierre, alto 35 cm."
    },
    "merkmale": [
      {
        "de": "Im Shop unter Dekoration · Büsten geführt",
        "en": "Listed in the shop under Decoration · Busts",
        "fr": "Présenté dans la boutique sous Décoration · Bustes",
        "it": "Presentato nel negozio in Decorazione · Busti"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "35 cm"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-l-esclave-pierre-1-opt.webp",
        "width": 854,
        "height": 1068,
        "alt": {
          "de": "Cire Trudon L'Esclave-Pierre – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon L'Esclave-Pierre – product view on a light background",
          "fr": "Cire Trudon L'Esclave-Pierre – vue du produit sur fond clair",
          "it": "Cire Trudon L'Esclave-Pierre – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/b/u/bustes_esclave_stone_1600x1600_gris_1.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-l-esclave-pierre-2.webp",
        "width": 1600,
        "height": 1600,
        "alt": {
          "de": "Cire Trudon L'Esclave-Pierre – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon L'Esclave-Pierre – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon L'Esclave-Pierre – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon L'Esclave-Pierre – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/i/m/img_3644.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-l-esclave-pierre-3.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon L'Esclave-Pierre – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon L'Esclave-Pierre – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon L'Esclave-Pierre – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon L'Esclave-Pierre – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/l/_/l_esclave-in-situ-1600x1600-5_1.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/l-esclave-stein.html",
    "quellen": [
      "https://trudon.com/eu_de/l-esclave-stein.html"
    ],
    "stand": "2026-10-31",
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/l-esclave-stein.html",
      "varianten": [
        {
          "name": {
            "de": "Einheitsgröße",
            "en": "One size",
            "fr": "Taille unique",
            "it": "Taglia unica"
          },
          "betrag": 230,
          "sku": "ESC/514/TRU"
        }
      ]
    },
    "zubehoer": [
      {
        "slug": "cire-trudon-sockel-classic",
        "hinweis": {
          "de": "Laut Hersteller auch für Büsten geeignet",
          "en": "Also suitable for busts according to the maker",
          "fr": "Convient aussi aux bustes selon le fabricant",
          "it": "Adatta anche ai busti secondo il produttore"
        }
      }
    ]
  },
  {
    "slug": "cire-trudon-essentials-set",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "geschenkset",
    "name": "Essentials Set",
    "kurz": {
      "de": "Geschenkbox mit einer Duftkerze und einem Eau de Parfum (100 ml).",
      "en": "Gift box with a scented candle and an eau de parfum (100 ml).",
      "fr": "Coffret réunissant une bougie parfumée et une eau de parfum (100 ml).",
      "it": "Cofanetto con una candela profumata e un eau de parfum (100 ml)."
    },
    "merkmale": [],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-essentials-set-1-opt.webp",
        "width": 1118,
        "height": 1397,
        "alt": {
          "de": "Cire Trudon Essentials Set – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Essentials Set – product view on a light background",
          "fr": "Cire Trudon Essentials Set – vue du produit sur fond clair",
          "it": "Cire Trudon Essentials Set – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_coffret_bougie_parfum_1200x1200_beige.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/essentials-set-eau-de-parfum-und-duftkerze.html",
    "quellen": [
      "https://trudon.com/eu_de/essentials-set-eau-de-parfum-und-duftkerze.html"
    ],
    "stand": "2026-10-31",
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/essentials-set-eau-de-parfum-und-duftkerze.html",
      "varianten": [
        {
          "name": {
            "de": "Einheitsgröße",
            "en": "One size",
            "fr": "Taille unique",
            "it": "Taglia unica"
          },
          "betrag": 305,
          "sku": "TRU/GIFTBOX/BUNDLE5"
        }
      ]
    }
  },
  {
    "slug": "cire-trudon-la-promeneuse-spare-glass",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "wohnaccessoire",
    "name": "La Promeneuse Spare Glass",
    "kurz": {
      "de": "Ersatzglas für den Duftzerstreuer La Promeneuse, einzeln erhältlich.",
      "en": "Spare glass for the La Promeneuse diffuser, sold on its own.",
      "fr": "Verre de rechange pour le diffuseur La Promeneuse, vendu seul.",
      "it": "Vetro di ricambio per il diffusore La Promeneuse, venduto singolarmente."
    },
    "merkmale": [
      {
        "de": "Ersatzteil",
        "en": "Spare part",
        "fr": "Pièce détachée",
        "it": "Ricambio"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-la-promeneuse-spare-glass-1.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon La Promeneuse Spare Glass – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon La Promeneuse Spare Glass – product view on a light background",
          "fr": "Cire Trudon La Promeneuse Spare Glass – vue du produit sur fond clair",
          "it": "Cire Trudon La Promeneuse Spare Glass – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/p/i/pi_ces_d_tach_es_-_glass_en.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_en/la-promeneuse-spare-glass.html",
    "quellen": [
      "https://trudon.com/eu_en/la-promeneuse-spare-glass.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-la-promeneuse"
    ],
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_en/la-promeneuse-spare-glass.html",
      "varianten": [
        {
          "name": {
            "de": "Einheitsgröße",
            "en": "One size",
            "fr": "Taille unique",
            "it": "Taglia unica"
          },
          "betrag": 60,
          "sku": "PROM/VERRE/TRU",
          "zerbrechlich": true
        }
      ]
    }
  },
  {
    "slug": "cire-trudon-ceramic-top-for-la-promeneuse",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "wohnaccessoire",
    "name": "Ceramic top for La Promeneuse",
    "kurz": {
      "de": "Keramikschale als Ersatzteil für La Promeneuse, einzeln erhältlich.",
      "en": "Ceramic top as a spare part for La Promeneuse, sold on its own.",
      "fr": "Coupelle en céramique de rechange pour La Promeneuse, vendue seule.",
      "it": "Coppetta in ceramica di ricambio per La Promeneuse, venduta singolarmente."
    },
    "merkmale": [
      {
        "de": "Ersatzteil",
        "en": "Spare part",
        "fr": "Pièce détachée",
        "it": "Ricambio"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-ceramic-top-for-la-promeneuse-1.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon Ceramic top for La Promeneuse – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Ceramic top for La Promeneuse – product view on a light background",
          "fr": "Cire Trudon Ceramic top for La Promeneuse – vue du produit sur fond clair",
          "it": "Cire Trudon Ceramic top for La Promeneuse – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/p/i/pi_ces_d_tach_es_-_ceramic_en_1.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_en/ceramic-top-for-la-promeneuse.html",
    "quellen": [
      "https://trudon.com/eu_en/ceramic-top-for-la-promeneuse.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-la-promeneuse"
    ],
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_en/ceramic-top-for-la-promeneuse.html",
      "varianten": [
        {
          "name": {
            "de": "Einheitsgröße",
            "en": "One size",
            "fr": "Taille unique",
            "it": "Taglia unica"
          },
          "betrag": 50,
          "sku": "PROM/CERTOP/TRU",
          "zerbrechlich": true
        }
      ]
    }
  },
  {
    "slug": "cire-trudon-la-promeneuse-spare-brass-spoon",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "wohnaccessoire",
    "name": "La Promeneuse Spare Brass Spoon",
    "kurz": {
      "de": "Messinglöffel als Ersatzteil für La Promeneuse, einzeln erhältlich.",
      "en": "Brass spoon as a spare part for La Promeneuse, sold on its own.",
      "fr": "Cuillère en laiton de rechange pour La Promeneuse, vendue seule.",
      "it": "Cucchiaio in ottone di ricambio per La Promeneuse, venduto singolarmente."
    },
    "merkmale": [
      {
        "de": "Ersatzteil",
        "en": "Spare part",
        "fr": "Pièce détachée",
        "it": "Ricambio"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-la-promeneuse-spare-brass-spoon-1.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon La Promeneuse Spare Brass Spoon – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon La Promeneuse Spare Brass Spoon – product view on a light background",
          "fr": "Cire Trudon La Promeneuse Spare Brass Spoon – vue du produit sur fond clair",
          "it": "Cire Trudon La Promeneuse Spare Brass Spoon – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/p/i/pi_ces_d_tach_es_-_spoon_en.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_en/la-promeneuse-spare-brass-spoon.html",
    "quellen": [
      "https://trudon.com/eu_en/la-promeneuse-spare-brass-spoon.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-la-promeneuse"
    ],
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_en/la-promeneuse-spare-brass-spoon.html",
      "varianten": [
        {
          "name": {
            "de": "Einheitsgröße",
            "en": "One size",
            "fr": "Taille unique",
            "it": "Taglia unica"
          },
          "betrag": 20,
          "sku": "PROM/BRASPO/TRU"
        }
      ]
    }
  },
  {
    "slug": "cire-trudon-raumspray-pumpe",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "wohnaccessoire",
    "name": "Pump",
    "kurz": {
      "de": "Ersatzpumpe für die Trudon-Raumsprays, ohne Flasche.",
      "en": "Replacement pump for Trudon room sprays, without the bottle.",
      "fr": "Pompe de rechange pour les sprays d’intérieur Trudon, sans flacon.",
      "it": "Pompa di ricambio per gli spray per ambienti Trudon, senza flacone."
    },
    "merkmale": [
      {
        "de": "Ersatzteil",
        "en": "Spare part",
        "fr": "Pièce détachée",
        "it": "Ricambio"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-raumspray-pumpe-1-opt.webp",
        "width": 871,
        "height": 1089,
        "alt": {
          "de": "Cire Trudon Pump – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Pump – product view on a light background",
          "fr": "Cire Trudon Pump – vue du produit sur fond clair",
          "it": "Cire Trudon Pump – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/p/i/pi_ces_d_tach_es_en_.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_en/room-spray-pump.html",
    "quellen": [
      "https://trudon.com/eu_en/room-spray-pump.html"
    ],
    "stand": "2026-10-31",
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_en/room-spray-pump.html",
      "varianten": [
        {
          "name": {
            "de": "Einheitsgröße",
            "en": "One size",
            "fr": "Taille unique",
            "it": "Taglia unica"
          },
          "betrag": 15,
          "sku": "PUMP/14/TRU"
        }
      ]
    }
  },
  {
    "slug": "cire-trudon-madeleines",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "wohnaccessoire",
    "name": "Madeleines",
    "kurz": {
      "de": "Spitzkerzen nach dem Vorbild der Kerzen der Pariser Kirche La Madeleine, in der Normandie gefertigt und in vielen Farben erhältlich; sechs Stück je Schachtel.",
      "en": "Taper candles modelled on those of the Paris church of La Madeleine, made in Normandy and available in many colours; six per box.",
      "fr": "Chandelles inspirées de celles de l’église de la Madeleine à Paris, fabriquées en Normandie et proposées en nombreuses couleurs ; six par boîte.",
      "it": "Candele affusolate ispirate a quelle della chiesa parigina della Madeleine, prodotte in Normandia e disponibili in molti colori; sei per scatola."
    },
    "merkmale": [
      {
        "de": "H 200 mm · Ø 22 mm · Brenndauer ca. 7 h",
        "en": "H 200 mm · Ø 22 mm · Burn time approx. 7 h",
        "fr": "H 200 mm · Ø 22 mm · Durée de combustion env. 7 h",
        "it": "H 200 mm · Ø 22 mm · Durata di combustione circa 7 h"
      },
      {
        "de": "Maisgelb: H 200 mm · Ø 22 mm · Brenndauer ca. 7 h",
        "en": "Corn yellow: H 200 mm · Ø 22 mm · Burn time approx. 7 h",
        "fr": "Jaune maïs: H 200 mm · Ø 22 mm · Durée de combustion env. 7 h",
        "it": "Giallo mais: H 200 mm · Ø 22 mm · Durata di combustione circa 7 h"
      },
      {
        "de": "Gelb: H 200 mm · Ø 22 mm · Brenndauer ca. 7 h",
        "en": "Yellow: H 200 mm · Ø 22 mm · Burn time approx. 7 h",
        "fr": "Jaune: H 200 mm · Ø 22 mm · Durée de combustion env. 7 h",
        "it": "Giallo: H 200 mm · Ø 22 mm · Durata di combustione circa 7 h"
      },
      {
        "de": "Königsblau: H 200 mm · Ø 22 mm · Brenndauer ca. 7 h",
        "en": "Royal blue: H 200 mm · Ø 22 mm · Burn time approx. 7 h",
        "fr": "Bleu roi: H 200 mm · Ø 22 mm · Durée de combustion env. 7 h",
        "it": "Blu reale: H 200 mm · Ø 22 mm · Durata di combustione circa 7 h"
      },
      {
        "de": "Aqua: H 200 mm · Ø 22 mm · Brenndauer ca. 7 h",
        "en": "Aqua: H 200 mm · Ø 22 mm · Burn time approx. 7 h",
        "fr": "Aqua: H 200 mm · Ø 22 mm · Durée de combustion env. 7 h",
        "it": "Acqua: H 200 mm · Ø 22 mm · Durata di combustione circa 7 h"
      },
      {
        "de": "Khaki: H 200 mm · Ø 22 mm · Brenndauer ca. 7 h",
        "en": "Khaki: H 200 mm · Ø 22 mm · Burn time approx. 7 h",
        "fr": "Kaki: H 200 mm · Ø 22 mm · Durée de combustion env. 7 h",
        "it": "Cachi: H 200 mm · Ø 22 mm · Durata di combustione circa 7 h"
      },
      {
        "de": "Burgunderrot: H 200 mm · Ø 22 mm · Brenndauer ca. 7 h",
        "en": "Burgundy: H 200 mm · Ø 22 mm · Burn time approx. 7 h",
        "fr": "Bordeaux: H 200 mm · Ø 22 mm · Durée de combustion env. 7 h",
        "it": "Bordeaux: H 200 mm · Ø 22 mm · Durata di combustione circa 7 h"
      },
      {
        "de": "Rosa: H 200 mm · Ø 22 mm · Brenndauer ca. 7 h",
        "en": "Pink: H 200 mm · Ø 22 mm · Burn time approx. 7 h",
        "fr": "Rose: H 200 mm · Ø 22 mm · Durée de combustion env. 7 h",
        "it": "Rosa: H 200 mm · Ø 22 mm · Durata di combustione circa 7 h"
      },
      {
        "de": "Stone: H 200 mm · Ø 22 mm · Brenndauer ca. 7 h",
        "en": "Stone: H 200 mm · Ø 22 mm · Burn time approx. 7 h",
        "fr": "Pierre: H 200 mm · Ø 22 mm · Durée de combustion env. 7 h",
        "it": "Pietra: H 200 mm · Ø 22 mm · Durata di combustione circa 7 h"
      },
      {
        "de": "Elfenbein: H 200 mm · Ø 22 mm · Brenndauer ca. 7 h",
        "en": "Ivory: H 200 mm · Ø 22 mm · Burn time approx. 7 h",
        "fr": "Ivoire: H 200 mm · Ø 22 mm · Durée de combustion env. 7 h",
        "it": "Avorio: H 200 mm · Ø 22 mm · Durata di combustione circa 7 h"
      },
      {
        "de": "Pastellblau: H 200 mm · Ø 22 mm · Brenndauer ca. 7 h",
        "en": "Pastel blue: H 200 mm · Ø 22 mm · Burn time approx. 7 h",
        "fr": "Bleu pastel: H 200 mm · Ø 22 mm · Durée de combustion env. 7 h",
        "it": "Azzurro pastello: H 200 mm · Ø 22 mm · Durata di combustione circa 7 h"
      },
      {
        "de": "Pastellgrün: H 200 mm · Ø 22 mm · Brenndauer ca. 7 h",
        "en": "Pastel green: H 200 mm · Ø 22 mm · Burn time approx. 7 h",
        "fr": "Vert pastel: H 200 mm · Ø 22 mm · Durée de combustion env. 7 h",
        "it": "Verde pastello: H 200 mm · Ø 22 mm · Durata di combustione circa 7 h"
      },
      {
        "de": "Flieder: H 200 mm · Ø 22 mm · Brenndauer ca. 7 h",
        "en": "Lilac: H 200 mm · Ø 22 mm · Burn time approx. 7 h",
        "fr": "Lilas: H 200 mm · Ø 22 mm · Durée de combustion env. 7 h",
        "it": "Lilla: H 200 mm · Ø 22 mm · Durata di combustione circa 7 h"
      },
      {
        "de": "Schwarz: H 200 mm · Ø 22 mm · Brenndauer ca. 7 h",
        "en": "Black: H 200 mm · Ø 22 mm · Burn time approx. 7 h",
        "fr": "Noir: H 200 mm · Ø 22 mm · Durée de combustion env. 7 h",
        "it": "Nero: H 200 mm · Ø 22 mm · Durata di combustione circa 7 h"
      },
      {
        "de": "Grau: H 200 mm · Ø 22 mm · Brenndauer ca. 7 h",
        "en": "Grey: H 200 mm · Ø 22 mm · Burn time approx. 7 h",
        "fr": "Gris: H 200 mm · Ø 22 mm · Durée de combustion env. 7 h",
        "it": "Grigio: H 200 mm · Ø 22 mm · Durata di combustione circa 7 h"
      },
      {
        "de": "Weiß: H 200 mm · Ø 22 mm · Brenndauer ca. 7 h",
        "en": "White: H 200 mm · Ø 22 mm · Burn time approx. 7 h",
        "fr": "Blanc: H 200 mm · Ø 22 mm · Durée de combustion env. 7 h",
        "it": "Bianco: H 200 mm · Ø 22 mm · Durata di combustione circa 7 h"
      },
      {
        "de": "Backsteinrot: H 200 mm · Ø 22 mm · Brenndauer ca. 7 h",
        "en": "Brick red: H 200 mm · Ø 22 mm · Burn time approx. 7 h",
        "fr": "Rouge brique: H 200 mm · Ø 22 mm · Durée de combustion env. 7 h",
        "it": "Rosso mattone: H 200 mm · Ø 22 mm · Durata di combustione circa 7 h"
      },
      {
        "de": "Fuchsia: H 200 mm · Ø 22 mm · Brenndauer ca. 7 h",
        "en": "Fuchsia: H 200 mm · Ø 22 mm · Burn time approx. 7 h",
        "fr": "Fuchsia: H 200 mm · Ø 22 mm · Durée de combustion env. 7 h",
        "it": "Fucsia: H 200 mm · Ø 22 mm · Durata di combustione circa 7 h"
      },
      {
        "de": "Silber: H 200 mm · Ø 22 mm · Brenndauer ca. 7 h",
        "en": "Silver: H 200 mm · Ø 22 mm · Burn time approx. 7 h",
        "fr": "Argent: H 200 mm · Ø 22 mm · Durée de combustion env. 7 h",
        "it": "Argento: H 200 mm · Ø 22 mm · Durata di combustione circa 7 h"
      },
      {
        "de": "Gold: H 200 mm · Ø 22 mm · Brenndauer ca. 7 h",
        "en": "Gold: H 200 mm · Ø 22 mm · Burn time approx. 7 h",
        "fr": "Or: H 200 mm · Ø 22 mm · Durée de combustion env. 7 h",
        "it": "Oro: H 200 mm · Ø 22 mm · Durata di combustione circa 7 h"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-madeleines-1-opt.webp",
        "width": 803,
        "height": 1004,
        "alt": {
          "de": "Cire Trudon Madeleines – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Madeleines – product view on a light background",
          "fr": "Cire Trudon Madeleines – vue du produit sur fond clair",
          "it": "Cire Trudon Madeleines – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/m/a/madeleine_ma_s_1200x1200_1.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-madeleines-2.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon Madeleines – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon Madeleines – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon Madeleines – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon Madeleines – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/l/i/lifestyle_mad-roy_31.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/mimose-madeleine.html",
    "quellen": [
      "https://trudon.com/eu_de/mimose-madeleine.html",
      "https://trudon.com/eu_de/gelb-madeleine.html",
      "https://trudon.com/eu_de/marine-blau-madeleine.html",
      "https://trudon.com/eu_de/aqua-madeleine.html",
      "https://trudon.com/eu_de/khaki-madeleine.html",
      "https://trudon.com/eu_de/burgunderrote-madeleine.html",
      "https://trudon.com/eu_de/rosa-madeleine.html",
      "https://trudon.com/eu_de/stein-madeleine.html",
      "https://trudon.com/eu_de/elfenbeinfarben-madeleine.html",
      "https://trudon.com/eu_de/pastel-blau-madeleine.html",
      "https://trudon.com/eu_de/pastel-gruen-madeleine.html",
      "https://trudon.com/eu_de/lilac-madeleine.html",
      "https://trudon.com/eu_de/scharz-madeleine.html",
      "https://trudon.com/eu_de/grau-madeleine.html",
      "https://trudon.com/eu_de/weiss-madeleine.html",
      "https://trudon.com/eu_de/backsteinrot-madeleine.html",
      "https://trudon.com/eu_de/fuchsia-madeleine.html",
      "https://trudon.com/eu_de/silbenes-madeleine.html",
      "https://trudon.com/eu_de/goldenes-madeleine.html"
    ],
    "stand": "2026-10-31",
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Maisgelb",
            "en": "Corn yellow",
            "fr": "Jaune maïs",
            "it": "Giallo mais"
          },
          "betrag": 24,
          "sku": "MAD20/823/25"
        },
        {
          "name": {
            "de": "Gelb",
            "en": "Yellow",
            "fr": "Jaune",
            "it": "Giallo"
          },
          "betrag": 24,
          "sku": "MAD20/803/25"
        },
        {
          "name": {
            "de": "Königsblau",
            "en": "Royal blue",
            "fr": "Bleu roi",
            "it": "Blu reale"
          },
          "betrag": 24,
          "sku": "MAD20/795/25"
        },
        {
          "name": {
            "de": "Aqua",
            "en": "Aqua",
            "fr": "Aqua",
            "it": "Acqua"
          },
          "betrag": 24,
          "sku": "MAD20/751/25"
        },
        {
          "name": {
            "de": "Khaki",
            "en": "Khaki",
            "fr": "Kaki",
            "it": "Cachi"
          },
          "betrag": 24,
          "sku": "MAD20/700/25"
        },
        {
          "name": {
            "de": "Burgunderrot",
            "en": "Burgundy",
            "fr": "Bordeaux",
            "it": "Bordeaux"
          },
          "betrag": 24,
          "sku": "MAD20/630/25"
        },
        {
          "name": {
            "de": "Rosa",
            "en": "Pink",
            "fr": "Rose",
            "it": "Rosa"
          },
          "betrag": 24,
          "sku": "MAD20/600/25"
        },
        {
          "name": {
            "de": "Stone",
            "en": "Stone",
            "fr": "Pierre",
            "it": "Pietra"
          },
          "betrag": 24,
          "sku": "MAD20/514/25"
        },
        {
          "name": {
            "de": "Elfenbein",
            "en": "Ivory",
            "fr": "Ivoire",
            "it": "Avorio"
          },
          "betrag": 24,
          "sku": "MAD20/512/25"
        },
        {
          "name": {
            "de": "Pastellblau",
            "en": "Pastel blue",
            "fr": "Bleu pastel",
            "it": "Azzurro pastello"
          },
          "betrag": 24,
          "sku": "MAD20/752/25"
        },
        {
          "name": {
            "de": "Pastellgrün",
            "en": "Pastel green",
            "fr": "Vert pastel",
            "it": "Verde pastello"
          },
          "betrag": 24,
          "sku": "MAD20/712/25"
        },
        {
          "name": {
            "de": "Flieder",
            "en": "Lilac",
            "fr": "Lilas",
            "it": "Lilla"
          },
          "betrag": 24,
          "sku": "MAD20/550/25"
        },
        {
          "name": {
            "de": "Schwarz",
            "en": "Black",
            "fr": "Noir",
            "it": "Nero"
          },
          "betrag": 24,
          "sku": "MAD20/860/25"
        },
        {
          "name": {
            "de": "Grau",
            "en": "Grey",
            "fr": "Gris",
            "it": "Grigio"
          },
          "betrag": 24,
          "sku": "MAD20/855/25"
        },
        {
          "name": {
            "de": "Weiß",
            "en": "White",
            "fr": "Blanc",
            "it": "Bianco"
          },
          "betrag": 24,
          "sku": "MAD20/510/25"
        },
        {
          "name": {
            "de": "Backsteinrot",
            "en": "Brick red",
            "fr": "Rouge brique",
            "it": "Rosso mattone"
          },
          "betrag": 24,
          "sku": "MAD20/632/TRU"
        },
        {
          "name": {
            "de": "Fuchsia",
            "en": "Fuchsia",
            "fr": "Fuchsia",
            "it": "Fucsia"
          },
          "betrag": 24,
          "sku": "MAD20/564/TRU"
        },
        {
          "name": {
            "de": "Silber",
            "en": "Silver",
            "fr": "Argent",
            "it": "Argento"
          },
          "betrag": 26,
          "sku": "MAD20/AR/TRU"
        },
        {
          "name": {
            "de": "Gold",
            "en": "Gold",
            "fr": "Or",
            "it": "Oro"
          },
          "betrag": 26,
          "sku": "MAD20/OR/TRU"
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/mimose-madeleine.html"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Farbe",
          "en": "Colour",
          "fr": "Couleur",
          "it": "Colore"
        },
        "optionen": [
          {
            "id": "maisgelb",
            "name": {
              "de": "Maisgelb",
              "en": "Corn yellow",
              "fr": "Jaune maïs",
              "it": "Giallo mais"
            },
            "code": "MAD20/823/25",
            "betrag": 24,
            "standard": true,
            "bilder": [
              "/Images/Wellness/produkte/cire-trudon/cire-trudon-madeleines-1-opt.webp"
            ]
          },
          {
            "id": "gelb",
            "name": {
              "de": "Gelb",
              "en": "Yellow",
              "fr": "Jaune",
              "it": "Giallo"
            },
            "code": "MAD20/803/25",
            "betrag": 24,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-madeleines-11-opt.webp",
                "width": 811,
                "height": 1014,
                "alt": {
                  "de": "Cire Trudon Madeleines in Gelb – Produktansicht",
                  "en": "Cire Trudon Madeleines in Yellow – product view",
                  "fr": "Cire Trudon Madeleines en Jaune – vue du produit",
                  "it": "Cire Trudon Madeleines in Giallo – vista del prodotto"
                },
                "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/m/a/madeleine_jaune_1200x1200.jpg",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "konigsblau",
            "name": {
              "de": "Königsblau",
              "en": "Royal blue",
              "fr": "Bleu roi",
              "it": "Blu reale"
            },
            "code": "MAD20/795/25",
            "betrag": 24,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-madeleines-12-opt.webp",
                "width": 784,
                "height": 980,
                "alt": {
                  "de": "Cire Trudon Madeleines in Königsblau – Produktansicht",
                  "en": "Cire Trudon Madeleines in Royal blue – product view",
                  "fr": "Cire Trudon Madeleines en Bleu roi – vue du produit",
                  "it": "Cire Trudon Madeleines in Blu reale – vista del prodotto"
                },
                "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/m/a/madeleine_bleu_marine_1200x1200.jpg",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "aqua",
            "name": {
              "de": "Aqua",
              "en": "Aqua",
              "fr": "Aqua",
              "it": "Acqua"
            },
            "code": "MAD20/751/25",
            "betrag": 24,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-madeleines-13-opt.webp",
                "width": 801,
                "height": 1001,
                "alt": {
                  "de": "Cire Trudon Madeleines in Aqua – Produktansicht",
                  "en": "Cire Trudon Madeleines in Aqua – product view",
                  "fr": "Cire Trudon Madeleines en Aqua – vue du produit",
                  "it": "Cire Trudon Madeleines in Acqua – vista del prodotto"
                },
                "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/m/a/madeleine_aqua_1200x1200.jpg",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "khaki",
            "name": {
              "de": "Khaki",
              "en": "Khaki",
              "fr": "Kaki",
              "it": "Cachi"
            },
            "code": "MAD20/700/25",
            "betrag": 24,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-madeleines-14.webp",
                "width": 1200,
                "height": 1200,
                "alt": {
                  "de": "Cire Trudon Madeleines in Khaki – Produktansicht",
                  "en": "Cire Trudon Madeleines in Khaki – product view",
                  "fr": "Cire Trudon Madeleines en Kaki – vue du produit",
                  "it": "Cire Trudon Madeleines in Cachi – vista del prodotto"
                },
                "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/m/a/madeleine_kaki_1200x1200.jpg",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "burgunderrot",
            "name": {
              "de": "Burgunderrot",
              "en": "Burgundy",
              "fr": "Bordeaux",
              "it": "Bordeaux"
            },
            "code": "MAD20/630/25",
            "betrag": 24,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-madeleines-15.webp",
                "width": 1200,
                "height": 1200,
                "alt": {
                  "de": "Cire Trudon Madeleines in Burgunderrot – Produktansicht",
                  "en": "Cire Trudon Madeleines in Burgundy – product view",
                  "fr": "Cire Trudon Madeleines en Bordeaux – vue du produit",
                  "it": "Cire Trudon Madeleines in Bordeaux – vista del prodotto"
                },
                "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/m/a/madeleine_burgundy_1200x1200.jpg",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "rosa",
            "name": {
              "de": "Rosa",
              "en": "Pink",
              "fr": "Rose",
              "it": "Rosa"
            },
            "code": "MAD20/600/25",
            "betrag": 24,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-madeleines-16-opt.webp",
                "width": 817,
                "height": 1021,
                "alt": {
                  "de": "Cire Trudon Madeleines in Rosa – Produktansicht",
                  "en": "Cire Trudon Madeleines in Pink – product view",
                  "fr": "Cire Trudon Madeleines en Rose – vue du produit",
                  "it": "Cire Trudon Madeleines in Rosa – vista del prodotto"
                },
                "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/m/a/madeleine_rose_tendresse_1200x1200.jpg",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "stone",
            "name": {
              "de": "Stone",
              "en": "Stone",
              "fr": "Pierre",
              "it": "Pietra"
            },
            "code": "MAD20/514/25",
            "betrag": 24,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-madeleines-17-opt.webp",
                "width": 783,
                "height": 979,
                "alt": {
                  "de": "Cire Trudon Madeleines in Stone – Produktansicht",
                  "en": "Cire Trudon Madeleines in Stone – product view",
                  "fr": "Cire Trudon Madeleines en Pierre – vue du produit",
                  "it": "Cire Trudon Madeleines in Pietra – vista del prodotto"
                },
                "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/m/a/madeleine_pierre_1200x1200.jpg",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "elfenbein",
            "name": {
              "de": "Elfenbein",
              "en": "Ivory",
              "fr": "Ivoire",
              "it": "Avorio"
            },
            "code": "MAD20/512/25",
            "betrag": 24,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-madeleines-18-opt.webp",
                "width": 790,
                "height": 988,
                "alt": {
                  "de": "Cire Trudon Madeleines in Elfenbein – Produktansicht",
                  "en": "Cire Trudon Madeleines in Ivory – product view",
                  "fr": "Cire Trudon Madeleines en Ivoire – vue du produit",
                  "it": "Cire Trudon Madeleines in Avorio – vista del prodotto"
                },
                "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/m/a/madeleine_ivoire_1200x1200.jpg",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "pastellblau",
            "name": {
              "de": "Pastellblau",
              "en": "Pastel blue",
              "fr": "Bleu pastel",
              "it": "Azzurro pastello"
            },
            "code": "MAD20/752/25",
            "betrag": 24,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-madeleines-19-opt.webp",
                "width": 973,
                "height": 1216,
                "alt": {
                  "de": "Cire Trudon Madeleines in Pastellblau – Produktansicht",
                  "en": "Cire Trudon Madeleines in Pastel blue – product view",
                  "fr": "Cire Trudon Madeleines en Bleu pastel – vue du produit",
                  "it": "Cire Trudon Madeleines in Azzurro pastello – vista del prodotto"
                },
                "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/c/h/chandelles_bleu_1200x1200_gris_1.jpg",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "pastellgrun",
            "name": {
              "de": "Pastellgrün",
              "en": "Pastel green",
              "fr": "Vert pastel",
              "it": "Verde pastello"
            },
            "code": "MAD20/712/25",
            "betrag": 24,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-madeleines-20-opt.webp",
                "width": 812,
                "height": 1015,
                "alt": {
                  "de": "Cire Trudon Madeleines in Pastellgrün – Produktansicht",
                  "en": "Cire Trudon Madeleines in Pastel green – product view",
                  "fr": "Cire Trudon Madeleines en Vert pastel – vue du produit",
                  "it": "Cire Trudon Madeleines in Verde pastello – vista del prodotto"
                },
                "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/m/a/madeleine_vert_d_eau_1200x1200.jpg",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "flieder",
            "name": {
              "de": "Flieder",
              "en": "Lilac",
              "fr": "Lilas",
              "it": "Lilla"
            },
            "code": "MAD20/550/25",
            "betrag": 24,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-madeleines-21-opt.webp",
                "width": 817,
                "height": 1021,
                "alt": {
                  "de": "Cire Trudon Madeleines in Flieder – Produktansicht",
                  "en": "Cire Trudon Madeleines in Lilac – product view",
                  "fr": "Cire Trudon Madeleines en Lilas – vue du produit",
                  "it": "Cire Trudon Madeleines in Lilla – vista del prodotto"
                },
                "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/m/a/madeleine_lilas_1200x1200_1.jpg",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "schwarz",
            "name": {
              "de": "Schwarz",
              "en": "Black",
              "fr": "Noir",
              "it": "Nero"
            },
            "code": "MAD20/860/25",
            "betrag": 24,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-madeleines-22-opt.webp",
                "width": 808,
                "height": 1010,
                "alt": {
                  "de": "Cire Trudon Madeleines in Schwarz – Produktansicht",
                  "en": "Cire Trudon Madeleines in Black – product view",
                  "fr": "Cire Trudon Madeleines en Noir – vue du produit",
                  "it": "Cire Trudon Madeleines in Nero – vista del prodotto"
                },
                "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/m/a/madeleine_noir_1200x1200.jpg",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "grau",
            "name": {
              "de": "Grau",
              "en": "Grey",
              "fr": "Gris",
              "it": "Grigio"
            },
            "code": "MAD20/855/25",
            "betrag": 24,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-madeleines-23-opt.webp",
                "width": 811,
                "height": 1014,
                "alt": {
                  "de": "Cire Trudon Madeleines in Grau – Produktansicht",
                  "en": "Cire Trudon Madeleines in Grey – product view",
                  "fr": "Cire Trudon Madeleines en Gris – vue du produit",
                  "it": "Cire Trudon Madeleines in Grigio – vista del prodotto"
                },
                "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/m/a/madeleine_gris_1200x1200.jpg",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "weiss",
            "name": {
              "de": "Weiß",
              "en": "White",
              "fr": "Blanc",
              "it": "Bianco"
            },
            "code": "MAD20/510/25",
            "betrag": 24,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-madeleines-24-opt.webp",
                "width": 833,
                "height": 1041,
                "alt": {
                  "de": "Cire Trudon Madeleines in Weiß – Produktansicht",
                  "en": "Cire Trudon Madeleines in White – product view",
                  "fr": "Cire Trudon Madeleines en Blanc – vue du produit",
                  "it": "Cire Trudon Madeleines in Bianco – vista del prodotto"
                },
                "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/m/a/madeleines-blanche-beige-hd.jpg",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "backsteinrot",
            "name": {
              "de": "Backsteinrot",
              "en": "Brick red",
              "fr": "Rouge brique",
              "it": "Rosso mattone"
            },
            "code": "MAD20/632/TRU",
            "betrag": 24,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-madeleines-25-opt.webp",
                "width": 798,
                "height": 998,
                "alt": {
                  "de": "Cire Trudon Madeleines in Backsteinrot – Produktansicht",
                  "en": "Cire Trudon Madeleines in Brick red – product view",
                  "fr": "Cire Trudon Madeleines en Rouge brique – vue du produit",
                  "it": "Cire Trudon Madeleines in Rosso mattone – vista del prodotto"
                },
                "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/m/a/madeleine_brique_1200x1200.jpg",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "fuchsia",
            "name": {
              "de": "Fuchsia",
              "en": "Fuchsia",
              "fr": "Fuchsia",
              "it": "Fucsia"
            },
            "code": "MAD20/564/TRU",
            "betrag": 24,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-madeleines-26-opt.webp",
                "width": 804,
                "height": 1005,
                "alt": {
                  "de": "Cire Trudon Madeleines in Fuchsia – Produktansicht",
                  "en": "Cire Trudon Madeleines in Fuchsia – product view",
                  "fr": "Cire Trudon Madeleines en Fuchsia – vue du produit",
                  "it": "Cire Trudon Madeleines in Fucsia – vista del prodotto"
                },
                "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/m/a/madeleine_fushia_1200x1200.jpg",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "silber",
            "name": {
              "de": "Silber",
              "en": "Silver",
              "fr": "Argent",
              "it": "Argento"
            },
            "code": "MAD20/AR/TRU",
            "betrag": 26,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-madeleines-27-opt.webp",
                "width": 813,
                "height": 1016,
                "alt": {
                  "de": "Cire Trudon Madeleines in Silber – Produktansicht",
                  "en": "Cire Trudon Madeleines in Silver – product view",
                  "fr": "Cire Trudon Madeleines en Argent – vue du produit",
                  "it": "Cire Trudon Madeleines in Argento – vista del prodotto"
                },
                "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/m/a/madeleine_silver_1200x1200.jpg",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "gold",
            "name": {
              "de": "Gold",
              "en": "Gold",
              "fr": "Or",
              "it": "Oro"
            },
            "code": "MAD20/OR/TRU",
            "betrag": 26,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-madeleines-28-opt.webp",
                "width": 811,
                "height": 1014,
                "alt": {
                  "de": "Cire Trudon Madeleines in Gold – Produktansicht",
                  "en": "Cire Trudon Madeleines in Gold – product view",
                  "fr": "Cire Trudon Madeleines en Or – vue du produit",
                  "it": "Cire Trudon Madeleines in Oro – vista del prodotto"
                },
                "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/m/a/madeleine_gold_1200x1200.jpg",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          }
        ]
      }
    ],
    "zubehoer": [
      {
        "slug": "cire-trudon-kerzenstander-trio",
        "hinweis": {
          "de": "Für Madeleine-Spitzkerzen",
          "en": "For Madeleine taper candles",
          "fr": "Pour chandelles Madeleine",
          "it": "Per candele affusolate Madeleine"
        }
      },
      {
        "slug": "cire-trudon-armleuchter",
        "hinweis": {
          "de": "Für Madeleine-Spitzkerzen",
          "en": "For Madeleine taper candles",
          "fr": "Pour chandelles Madeleine",
          "it": "Per candele affusolate Madeleine"
        }
      },
      {
        "slug": "cire-trudon-hollandischer-kerzenstander",
        "hinweis": {
          "de": "Für Madeleine-Spitzkerzen",
          "en": "For Madeleine taper candles",
          "fr": "Pour chandelles Madeleine",
          "it": "Per candele affusolate Madeleine"
        }
      },
      {
        "slug": "cire-trudon-blumen-kerzenstander",
        "hinweis": {
          "de": "Für Madeleine-Spitzkerzen",
          "en": "For Madeleine taper candles",
          "fr": "Pour chandelles Madeleine",
          "it": "Per candele affusolate Madeleine"
        }
      },
      {
        "slug": "cire-trudon-die-kegel-kerzenloscher"
      }
    ]
  },
  {
    "slug": "cire-trudon-die-stumpenkerze",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "wohnaccessoire",
    "name": "Die Stumpenkerze",
    "kurz": {
      "de": "Stumpenkerzen mit Kamee-Dekor als Hommage an Madame de Pompadour, in der Normandie gefertigt und gefärbt; in drei Größen und vielen Farben.",
      "en": "Pillar candles with cameo decoration as a tribute to Madame de Pompadour, made and dyed in Normandy; in three sizes and many colours.",
      "fr": "Cierges ornés de camées en hommage à Madame de Pompadour, fabriqués et teintés en Normandie ; en trois tailles et de nombreuses couleurs.",
      "it": "Candele a colonna con decoro a cammeo in omaggio a Madame de Pompadour, prodotte e colorate in Normandia; in tre misure e molti colori."
    },
    "merkmale": [
      {
        "de": "Schwarz · 6 × 10 cm: H 10 cm · Ø 6 cm",
        "en": "Black · 6 × 10 cm: H 10 cm · Ø 6 cm",
        "fr": "Noir · 6 × 10 cm: H 10 cm · Ø 6 cm",
        "it": "Nero · 6 × 10 cm: H 10 cm · Ø 6 cm"
      },
      {
        "de": "Weiß · 6 × 10 cm: H 10 cm · Ø 6 cm",
        "en": "White · 6 × 10 cm: H 10 cm · Ø 6 cm",
        "fr": "Blanc · 6 × 10 cm: H 10 cm · Ø 6 cm",
        "it": "Bianco · 6 × 10 cm: H 10 cm · Ø 6 cm"
      },
      {
        "de": "Steinfarben · 6 × 10 cm: H 10 cm · Ø 6 cm",
        "en": "Stone · 6 × 10 cm: H 10 cm · Ø 6 cm",
        "fr": "Pierre · 6 × 10 cm: H 10 cm · Ø 6 cm",
        "it": "Pietra · 6 × 10 cm: H 10 cm · Ø 6 cm"
      },
      {
        "de": "Mimose · 6 × 10 cm: H 10 cm · Ø 6 cm",
        "en": "Mimosa · 6 × 10 cm: H 10 cm · Ø 6 cm",
        "fr": "Mimosa · 6 × 10 cm: H 10 cm · Ø 6 cm",
        "it": "Mimosa · 6 × 10 cm: H 10 cm · Ø 6 cm"
      },
      {
        "de": "Hellrosa · 6 × 10 cm: H 10 cm · Ø 6 cm",
        "en": "Pale pink · 6 × 10 cm: H 10 cm · Ø 6 cm",
        "fr": "Rose pâle · 6 × 10 cm: H 10 cm · Ø 6 cm",
        "it": "Rosa chiaro · 6 × 10 cm: H 10 cm · Ø 6 cm"
      },
      {
        "de": "Burgunderrot · 6 × 10 cm: H 10 cm · Ø 6 cm",
        "en": "Burgundy · 6 × 10 cm: H 10 cm · Ø 6 cm",
        "fr": "Bordeaux · 6 × 10 cm: H 10 cm · Ø 6 cm",
        "it": "Bordeaux · 6 × 10 cm: H 10 cm · Ø 6 cm"
      },
      {
        "de": "Marineblau · 6 × 10 cm: H 10 cm · Ø 6 cm",
        "en": "Navy blue · 6 × 10 cm: H 10 cm · Ø 6 cm",
        "fr": "Bleu marine · 6 × 10 cm: H 10 cm · Ø 6 cm",
        "it": "Blu navy · 6 × 10 cm: H 10 cm · Ø 6 cm"
      },
      {
        "de": "Khaki · 6 × 10 cm: H 10 cm · Ø 6 cm",
        "en": "Khaki · 6 × 10 cm: H 10 cm · Ø 6 cm",
        "fr": "Kaki · 6 × 10 cm: H 10 cm · Ø 6 cm",
        "it": "Cachi · 6 × 10 cm: H 10 cm · Ø 6 cm"
      },
      {
        "de": "Schwarz · 6 × 15 cm: H 15 cm · Ø 6 cm",
        "en": "Black · 6 × 15 cm: H 15 cm · Ø 6 cm",
        "fr": "Noir · 6 × 15 cm: H 15 cm · Ø 6 cm",
        "it": "Nero · 6 × 15 cm: H 15 cm · Ø 6 cm"
      },
      {
        "de": "Weiß · 6 × 15 cm: H 15 cm · Ø 6 cm",
        "en": "White · 6 × 15 cm: H 15 cm · Ø 6 cm",
        "fr": "Blanc · 6 × 15 cm: H 15 cm · Ø 6 cm",
        "it": "Bianco · 6 × 15 cm: H 15 cm · Ø 6 cm"
      },
      {
        "de": "Steinfarben · 6 × 15 cm: H 15 cm · Ø 6 cm",
        "en": "Stone · 6 × 15 cm: H 15 cm · Ø 6 cm",
        "fr": "Pierre · 6 × 15 cm: H 15 cm · Ø 6 cm",
        "it": "Pietra · 6 × 15 cm: H 15 cm · Ø 6 cm"
      },
      {
        "de": "Mimose · 6 × 15 cm: H 15 cm · Ø 6 cm",
        "en": "Mimosa · 6 × 15 cm: H 15 cm · Ø 6 cm",
        "fr": "Mimosa · 6 × 15 cm: H 15 cm · Ø 6 cm",
        "it": "Mimosa · 6 × 15 cm: H 15 cm · Ø 6 cm"
      },
      {
        "de": "Hellrosa · 6 × 15 cm: H 15 cm · Ø 6 cm",
        "en": "Pale pink · 6 × 15 cm: H 15 cm · Ø 6 cm",
        "fr": "Rose pâle · 6 × 15 cm: H 15 cm · Ø 6 cm",
        "it": "Rosa chiaro · 6 × 15 cm: H 15 cm · Ø 6 cm"
      },
      {
        "de": "Burgunderrot · 6 × 15 cm: H 15 cm · Ø 6 cm",
        "en": "Burgundy · 6 × 15 cm: H 15 cm · Ø 6 cm",
        "fr": "Bordeaux · 6 × 15 cm: H 15 cm · Ø 6 cm",
        "it": "Bordeaux · 6 × 15 cm: H 15 cm · Ø 6 cm"
      },
      {
        "de": "Marineblau · 6 × 15 cm: H 15 cm · Ø 6 cm",
        "en": "Navy blue · 6 × 15 cm: H 15 cm · Ø 6 cm",
        "fr": "Bleu marine · 6 × 15 cm: H 15 cm · Ø 6 cm",
        "it": "Blu navy · 6 × 15 cm: H 15 cm · Ø 6 cm"
      },
      {
        "de": "Khaki · 6 × 15 cm: H 15 cm · Ø 6 cm",
        "en": "Khaki · 6 × 15 cm: H 15 cm · Ø 6 cm",
        "fr": "Kaki · 6 × 15 cm: H 15 cm · Ø 6 cm",
        "it": "Cachi · 6 × 15 cm: H 15 cm · Ø 6 cm"
      },
      {
        "de": "Schwarz · 8 × 15 cm: H 15 cm · Ø 8 cm",
        "en": "Black · 8 × 15 cm: H 15 cm · Ø 8 cm",
        "fr": "Noir · 8 × 15 cm: H 15 cm · Ø 8 cm",
        "it": "Nero · 8 × 15 cm: H 15 cm · Ø 8 cm"
      },
      {
        "de": "Weiß · 8 × 15 cm: H 15 cm · Ø 8 cm",
        "en": "White · 8 × 15 cm: H 15 cm · Ø 8 cm",
        "fr": "Blanc · 8 × 15 cm: H 15 cm · Ø 8 cm",
        "it": "Bianco · 8 × 15 cm: H 15 cm · Ø 8 cm"
      },
      {
        "de": "Steinfarben · 8 × 15 cm: H 15 cm · Ø 8 cm",
        "en": "Stone · 8 × 15 cm: H 15 cm · Ø 8 cm",
        "fr": "Pierre · 8 × 15 cm: H 15 cm · Ø 8 cm",
        "it": "Pietra · 8 × 15 cm: H 15 cm · Ø 8 cm"
      },
      {
        "de": "Mimose · 8 × 15 cm: H 15 cm · Ø 8 cm",
        "en": "Mimosa · 8 × 15 cm: H 15 cm · Ø 8 cm",
        "fr": "Mimosa · 8 × 15 cm: H 15 cm · Ø 8 cm",
        "it": "Mimosa · 8 × 15 cm: H 15 cm · Ø 8 cm"
      },
      {
        "de": "Hellrosa · 8 × 15 cm: H 15 cm · Ø 8 cm",
        "en": "Pale pink · 8 × 15 cm: H 15 cm · Ø 8 cm",
        "fr": "Rose pâle · 8 × 15 cm: H 15 cm · Ø 8 cm",
        "it": "Rosa chiaro · 8 × 15 cm: H 15 cm · Ø 8 cm"
      },
      {
        "de": "Burgunderrot · 8 × 15 cm: H 15 cm · Ø 8 cm",
        "en": "Burgundy · 8 × 15 cm: H 15 cm · Ø 8 cm",
        "fr": "Bordeaux · 8 × 15 cm: H 15 cm · Ø 8 cm",
        "it": "Bordeaux · 8 × 15 cm: H 15 cm · Ø 8 cm"
      },
      {
        "de": "Marineblau · 8 × 15 cm: H 15 cm · Ø 8 cm",
        "en": "Navy blue · 8 × 15 cm: H 15 cm · Ø 8 cm",
        "fr": "Bleu marine · 8 × 15 cm: H 15 cm · Ø 8 cm",
        "it": "Blu navy · 8 × 15 cm: H 15 cm · Ø 8 cm"
      },
      {
        "de": "Khaki · 8 × 15 cm: H 15 cm · Ø 8 cm",
        "en": "Khaki · 8 × 15 cm: H 15 cm · Ø 8 cm",
        "fr": "Kaki · 8 × 15 cm: H 15 cm · Ø 8 cm",
        "it": "Cachi · 8 × 15 cm: H 15 cm · Ø 8 cm"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-die-stumpenkerze-1-opt.webp",
        "width": 640,
        "height": 800,
        "alt": {
          "de": "Cire Trudon Die Stumpenkerze – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Die Stumpenkerze – product view on a light background",
          "fr": "Cire Trudon Die Stumpenkerze – vue du produit sur fond clair",
          "it": "Cire Trudon Die Stumpenkerze – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_cierge_6-10_noir_1200x1200_beige_1.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/kleine-stumpenkerze-schwarz.html",
    "quellen": [
      "https://trudon.com/eu_de/kleine-stumpenkerze-schwarz.html",
      "https://trudon.com/eu_de/kleine-stumpenkerze-weiss.html",
      "https://trudon.com/eu_de/small-stone-pillar-candle.html",
      "https://trudon.com/eu_de/kleine-stumpenkerze-mimose.html",
      "https://trudon.com/eu_de/kleine-stumpenkerze-hellrosa.html",
      "https://trudon.com/eu_de/kleine-stumpenkerze-burgunderrot.html",
      "https://trudon.com/eu_de/kleine-stumpenkerze-marineblau.html",
      "https://trudon.com/eu_de/kleine-stumpenkerze-khaki.html",
      "https://trudon.com/eu_de/classic-black-pillar-candle.html",
      "https://trudon.com/eu_de/klassische-stumpenkerze-weiss.html",
      "https://trudon.com/eu_de/klassische-stumpenkerze-schwarz.html",
      "https://trudon.com/eu_de/klassische-stumpenkerze-mimose.html",
      "https://trudon.com/eu_de/klassische-stumpenkerze-hellrosa.html",
      "https://trudon.com/eu_de/klassische-stumpenkerze-burgunderrot.html",
      "https://trudon.com/eu_de/klassische-stumpenkerze-marineblau.html",
      "https://trudon.com/eu_de/klassische-stumpenkerze-khaki.html",
      "https://trudon.com/eu_de/grosse-stumpenkerze-schwarz.html",
      "https://trudon.com/eu_de/grosse-stumpenkerze-weiss.html",
      "https://trudon.com/eu_de/grosse-stumpenkerze-sctein.html",
      "https://trudon.com/eu_de/grosse-stumpenkerze-mimose.html",
      "https://trudon.com/eu_de/grosse-stumpenkerze-hellrosa.html",
      "https://trudon.com/eu_de/grosse-stumpenkerze-burgunderrot.html",
      "https://trudon.com/eu_de/grosse-stumpenkerze-marineblau.html",
      "https://trudon.com/eu_de/grosse-stumpenkerze-khaki.html"
    ],
    "stand": "2026-10-31",
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Schwarz · 6 × 10 cm",
            "en": "Black · 6 × 10 cm",
            "fr": "Noir · 6 × 10 cm",
            "it": "Nero · 6 × 10 cm"
          },
          "betrag": 26,
          "sku": "FU6-10/860/TRU"
        },
        {
          "name": {
            "de": "Weiß · 6 × 10 cm",
            "en": "White · 6 × 10 cm",
            "fr": "Blanc · 6 × 10 cm",
            "it": "Bianco · 6 × 10 cm"
          },
          "betrag": 26,
          "sku": "FU6-10/510/TRU"
        },
        {
          "name": {
            "de": "Steinfarben · 6 × 10 cm",
            "en": "Stone · 6 × 10 cm",
            "fr": "Pierre · 6 × 10 cm",
            "it": "Pietra · 6 × 10 cm"
          },
          "betrag": 26,
          "sku": "FU6-10/514/TRU"
        },
        {
          "name": {
            "de": "Mimose · 6 × 10 cm",
            "en": "Mimosa · 6 × 10 cm",
            "fr": "Mimosa · 6 × 10 cm",
            "it": "Mimosa · 6 × 10 cm"
          },
          "betrag": 26,
          "sku": "FU6-10/823/TRU"
        },
        {
          "name": {
            "de": "Hellrosa · 6 × 10 cm",
            "en": "Pale pink · 6 × 10 cm",
            "fr": "Rose pâle · 6 × 10 cm",
            "it": "Rosa chiaro · 6 × 10 cm"
          },
          "betrag": 26,
          "sku": "FU6-10/600/TRU"
        },
        {
          "name": {
            "de": "Burgunderrot · 6 × 10 cm",
            "en": "Burgundy · 6 × 10 cm",
            "fr": "Bordeaux · 6 × 10 cm",
            "it": "Bordeaux · 6 × 10 cm"
          },
          "betrag": 26,
          "sku": "FU6-10/630/TRU"
        },
        {
          "name": {
            "de": "Marineblau · 6 × 10 cm",
            "en": "Navy blue · 6 × 10 cm",
            "fr": "Bleu marine · 6 × 10 cm",
            "it": "Blu navy · 6 × 10 cm"
          },
          "betrag": 26,
          "sku": "FU6-10/795/TRU"
        },
        {
          "name": {
            "de": "Khaki · 6 × 10 cm",
            "en": "Khaki · 6 × 10 cm",
            "fr": "Kaki · 6 × 10 cm",
            "it": "Cachi · 6 × 10 cm"
          },
          "betrag": 26,
          "sku": "FU6-10/700/TRU"
        },
        {
          "name": {
            "de": "Schwarz · 6 × 15 cm",
            "en": "Black · 6 × 15 cm",
            "fr": "Noir · 6 × 15 cm",
            "it": "Nero · 6 × 15 cm"
          },
          "betrag": 32,
          "sku": "FU6-15/860/TRU"
        },
        {
          "name": {
            "de": "Weiß · 6 × 15 cm",
            "en": "White · 6 × 15 cm",
            "fr": "Blanc · 6 × 15 cm",
            "it": "Bianco · 6 × 15 cm"
          },
          "betrag": 32,
          "sku": "FU6-15/510/TRU"
        },
        {
          "name": {
            "de": "Steinfarben · 6 × 15 cm",
            "en": "Stone · 6 × 15 cm",
            "fr": "Pierre · 6 × 15 cm",
            "it": "Pietra · 6 × 15 cm"
          },
          "betrag": 32,
          "sku": "FU6-15/514/TRU"
        },
        {
          "name": {
            "de": "Mimose · 6 × 15 cm",
            "en": "Mimosa · 6 × 15 cm",
            "fr": "Mimosa · 6 × 15 cm",
            "it": "Mimosa · 6 × 15 cm"
          },
          "betrag": 32,
          "sku": "FU6-15/823/TRU"
        },
        {
          "name": {
            "de": "Hellrosa · 6 × 15 cm",
            "en": "Pale pink · 6 × 15 cm",
            "fr": "Rose pâle · 6 × 15 cm",
            "it": "Rosa chiaro · 6 × 15 cm"
          },
          "betrag": 32,
          "sku": "FU6-15/600/TRU"
        },
        {
          "name": {
            "de": "Burgunderrot · 6 × 15 cm",
            "en": "Burgundy · 6 × 15 cm",
            "fr": "Bordeaux · 6 × 15 cm",
            "it": "Bordeaux · 6 × 15 cm"
          },
          "betrag": 32,
          "sku": "FU6-15/630/TRU"
        },
        {
          "name": {
            "de": "Marineblau · 6 × 15 cm",
            "en": "Navy blue · 6 × 15 cm",
            "fr": "Bleu marine · 6 × 15 cm",
            "it": "Blu navy · 6 × 15 cm"
          },
          "betrag": 32,
          "sku": "FU6-15/795/TRU"
        },
        {
          "name": {
            "de": "Khaki · 6 × 15 cm",
            "en": "Khaki · 6 × 15 cm",
            "fr": "Kaki · 6 × 15 cm",
            "it": "Cachi · 6 × 15 cm"
          },
          "betrag": 32,
          "sku": "FU6-15/700/TRU"
        },
        {
          "name": {
            "de": "Schwarz · 8 × 15 cm",
            "en": "Black · 8 × 15 cm",
            "fr": "Noir · 8 × 15 cm",
            "it": "Nero · 8 × 15 cm"
          },
          "betrag": 58,
          "sku": "FU8-15/860/TRU"
        },
        {
          "name": {
            "de": "Weiß · 8 × 15 cm",
            "en": "White · 8 × 15 cm",
            "fr": "Blanc · 8 × 15 cm",
            "it": "Bianco · 8 × 15 cm"
          },
          "betrag": 58,
          "sku": "FU8-15/510/TRU"
        },
        {
          "name": {
            "de": "Steinfarben · 8 × 15 cm",
            "en": "Stone · 8 × 15 cm",
            "fr": "Pierre · 8 × 15 cm",
            "it": "Pietra · 8 × 15 cm"
          },
          "betrag": 58,
          "sku": "FU8-15/514/TRU"
        },
        {
          "name": {
            "de": "Mimose · 8 × 15 cm",
            "en": "Mimosa · 8 × 15 cm",
            "fr": "Mimosa · 8 × 15 cm",
            "it": "Mimosa · 8 × 15 cm"
          },
          "betrag": 58,
          "sku": "FU8-15/823/TRU"
        },
        {
          "name": {
            "de": "Hellrosa · 8 × 15 cm",
            "en": "Pale pink · 8 × 15 cm",
            "fr": "Rose pâle · 8 × 15 cm",
            "it": "Rosa chiaro · 8 × 15 cm"
          },
          "betrag": 58,
          "sku": "FU8-15/600/TRU"
        },
        {
          "name": {
            "de": "Burgunderrot · 8 × 15 cm",
            "en": "Burgundy · 8 × 15 cm",
            "fr": "Bordeaux · 8 × 15 cm",
            "it": "Bordeaux · 8 × 15 cm"
          },
          "betrag": 58,
          "sku": "FU8-15/630/TRU"
        },
        {
          "name": {
            "de": "Marineblau · 8 × 15 cm",
            "en": "Navy blue · 8 × 15 cm",
            "fr": "Bleu marine · 8 × 15 cm",
            "it": "Blu navy · 8 × 15 cm"
          },
          "betrag": 58,
          "sku": "FU8-15/795/TRU"
        },
        {
          "name": {
            "de": "Khaki · 8 × 15 cm",
            "en": "Khaki · 8 × 15 cm",
            "fr": "Kaki · 8 × 15 cm",
            "it": "Cachi · 8 × 15 cm"
          },
          "betrag": 58,
          "sku": "FU8-15/700/TRU"
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/kleine-stumpenkerze-schwarz.html"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Farbe · Größe",
          "en": "Colour · size",
          "fr": "Couleur · taille",
          "it": "Colore · misura"
        },
        "optionen": [
          {
            "id": "schwarz-6-10-cm",
            "name": {
              "de": "Schwarz · 6 × 10 cm",
              "en": "Black · 6 × 10 cm",
              "fr": "Noir · 6 × 10 cm",
              "it": "Nero · 6 × 10 cm"
            },
            "code": "FU6-10/860/TRU",
            "betrag": 26,
            "standard": true,
            "bilder": [
              "/Images/Wellness/produkte/cire-trudon/cire-trudon-die-stumpenkerze-1-opt.webp"
            ]
          },
          {
            "id": "weiss-6-10-cm",
            "name": {
              "de": "Weiß · 6 × 10 cm",
              "en": "White · 6 × 10 cm",
              "fr": "Blanc · 6 × 10 cm",
              "it": "Bianco · 6 × 10 cm"
            },
            "code": "FU6-10/510/TRU",
            "betrag": 26,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-die-stumpenkerze-11-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Cire Trudon Die Stumpenkerze in Weiß · 6 × 10 cm – Produktansicht",
                  "en": "Cire Trudon Die Stumpenkerze in White · 6 × 10 cm – product view",
                  "fr": "Cire Trudon Die Stumpenkerze en Blanc · 6 × 10 cm – vue du produit",
                  "it": "Cire Trudon Die Stumpenkerze in Bianco · 6 × 10 cm – vista del prodotto"
                },
                "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_cierge_6-10_blanc_1200x1200_beige.jpg",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "steinfarben-6-10-cm",
            "name": {
              "de": "Steinfarben · 6 × 10 cm",
              "en": "Stone · 6 × 10 cm",
              "fr": "Pierre · 6 × 10 cm",
              "it": "Pietra · 6 × 10 cm"
            },
            "code": "FU6-10/514/TRU",
            "betrag": 26,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-die-stumpenkerze-12-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Cire Trudon Die Stumpenkerze in Steinfarben · 6 × 10 cm – Produktansicht",
                  "en": "Cire Trudon Die Stumpenkerze in Stone · 6 × 10 cm – product view",
                  "fr": "Cire Trudon Die Stumpenkerze en Pierre · 6 × 10 cm – vue du produit",
                  "it": "Cire Trudon Die Stumpenkerze in Pietra · 6 × 10 cm – vista del prodotto"
                },
                "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_cierge_6-10_pierre_1200x1200_beige.jpg",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "mimose-6-10-cm",
            "name": {
              "de": "Mimose · 6 × 10 cm",
              "en": "Mimosa · 6 × 10 cm",
              "fr": "Mimosa · 6 × 10 cm",
              "it": "Mimosa · 6 × 10 cm"
            },
            "code": "FU6-10/823/TRU",
            "betrag": 26,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-die-stumpenkerze-13-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Cire Trudon Die Stumpenkerze in Mimose · 6 × 10 cm – Produktansicht",
                  "en": "Cire Trudon Die Stumpenkerze in Mimosa · 6 × 10 cm – product view",
                  "fr": "Cire Trudon Die Stumpenkerze en Mimosa · 6 × 10 cm – vue du produit",
                  "it": "Cire Trudon Die Stumpenkerze in Mimosa · 6 × 10 cm – vista del prodotto"
                },
                "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_cierge_6-10_ma_s_1200x1200_beige.jpg",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "hellrosa-6-10-cm",
            "name": {
              "de": "Hellrosa · 6 × 10 cm",
              "en": "Pale pink · 6 × 10 cm",
              "fr": "Rose pâle · 6 × 10 cm",
              "it": "Rosa chiaro · 6 × 10 cm"
            },
            "code": "FU6-10/600/TRU",
            "betrag": 26,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-die-stumpenkerze-14-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Cire Trudon Die Stumpenkerze in Hellrosa · 6 × 10 cm – Produktansicht",
                  "en": "Cire Trudon Die Stumpenkerze in Pale pink · 6 × 10 cm – product view",
                  "fr": "Cire Trudon Die Stumpenkerze en Rose pâle · 6 × 10 cm – vue du produit",
                  "it": "Cire Trudon Die Stumpenkerze in Rosa chiaro · 6 × 10 cm – vista del prodotto"
                },
                "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_cierge_6-10_rose_tendresse_1200x1200_beige.jpg",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "burgunderrot-6-10-cm",
            "name": {
              "de": "Burgunderrot · 6 × 10 cm",
              "en": "Burgundy · 6 × 10 cm",
              "fr": "Bordeaux · 6 × 10 cm",
              "it": "Bordeaux · 6 × 10 cm"
            },
            "code": "FU6-10/630/TRU",
            "betrag": 26,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-die-stumpenkerze-15-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Cire Trudon Die Stumpenkerze in Burgunderrot · 6 × 10 cm – Produktansicht",
                  "en": "Cire Trudon Die Stumpenkerze in Burgundy · 6 × 10 cm – product view",
                  "fr": "Cire Trudon Die Stumpenkerze en Bordeaux · 6 × 10 cm – vue du produit",
                  "it": "Cire Trudon Die Stumpenkerze in Bordeaux · 6 × 10 cm – vista del prodotto"
                },
                "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_cierge_6-10_bordeaux_1200x1200_beige.jpg",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "marineblau-6-10-cm",
            "name": {
              "de": "Marineblau · 6 × 10 cm",
              "en": "Navy blue · 6 × 10 cm",
              "fr": "Bleu marine · 6 × 10 cm",
              "it": "Blu navy · 6 × 10 cm"
            },
            "code": "FU6-10/795/TRU",
            "betrag": 26,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-die-stumpenkerze-16-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Cire Trudon Die Stumpenkerze in Marineblau · 6 × 10 cm – Produktansicht",
                  "en": "Cire Trudon Die Stumpenkerze in Navy blue · 6 × 10 cm – product view",
                  "fr": "Cire Trudon Die Stumpenkerze en Bleu marine · 6 × 10 cm – vue du produit",
                  "it": "Cire Trudon Die Stumpenkerze in Blu navy · 6 × 10 cm – vista del prodotto"
                },
                "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_cierge_6-10_bleu_marine_1200x1200_beige.jpg",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "khaki-6-10-cm",
            "name": {
              "de": "Khaki · 6 × 10 cm",
              "en": "Khaki · 6 × 10 cm",
              "fr": "Kaki · 6 × 10 cm",
              "it": "Cachi · 6 × 10 cm"
            },
            "code": "FU6-10/700/TRU",
            "betrag": 26,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-die-stumpenkerze-17-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Cire Trudon Die Stumpenkerze in Khaki · 6 × 10 cm – Produktansicht",
                  "en": "Cire Trudon Die Stumpenkerze in Khaki · 6 × 10 cm – product view",
                  "fr": "Cire Trudon Die Stumpenkerze en Kaki · 6 × 10 cm – vue du produit",
                  "it": "Cire Trudon Die Stumpenkerze in Cachi · 6 × 10 cm – vista del prodotto"
                },
                "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_cierge_6-10_kaki_1200x1200_beige.jpg",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "schwarz-6-15-cm",
            "name": {
              "de": "Schwarz · 6 × 15 cm",
              "en": "Black · 6 × 15 cm",
              "fr": "Noir · 6 × 15 cm",
              "it": "Nero · 6 × 15 cm"
            },
            "code": "FU6-15/860/TRU",
            "betrag": 32,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-die-stumpenkerze-18-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Cire Trudon Die Stumpenkerze in Schwarz · 6 × 15 cm – Produktansicht",
                  "en": "Cire Trudon Die Stumpenkerze in Black · 6 × 15 cm – product view",
                  "fr": "Cire Trudon Die Stumpenkerze en Noir · 6 × 15 cm – vue du produit",
                  "it": "Cire Trudon Die Stumpenkerze in Nero · 6 × 15 cm – vista del prodotto"
                },
                "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_cierge_6-15_noir_1200x1200_beige.jpg",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "weiss-6-15-cm",
            "name": {
              "de": "Weiß · 6 × 15 cm",
              "en": "White · 6 × 15 cm",
              "fr": "Blanc · 6 × 15 cm",
              "it": "Bianco · 6 × 15 cm"
            },
            "code": "FU6-15/510/TRU",
            "betrag": 32,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-die-stumpenkerze-19-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Cire Trudon Die Stumpenkerze in Weiß · 6 × 15 cm – Produktansicht",
                  "en": "Cire Trudon Die Stumpenkerze in White · 6 × 15 cm – product view",
                  "fr": "Cire Trudon Die Stumpenkerze en Blanc · 6 × 15 cm – vue du produit",
                  "it": "Cire Trudon Die Stumpenkerze in Bianco · 6 × 15 cm – vista del prodotto"
                },
                "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_cierge_6-15_blanc_1200x1200_beige.jpg",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "steinfarben-6-15-cm",
            "name": {
              "de": "Steinfarben · 6 × 15 cm",
              "en": "Stone · 6 × 15 cm",
              "fr": "Pierre · 6 × 15 cm",
              "it": "Pietra · 6 × 15 cm"
            },
            "code": "FU6-15/514/TRU",
            "betrag": 32,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-die-stumpenkerze-20-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Cire Trudon Die Stumpenkerze in Steinfarben · 6 × 15 cm – Produktansicht",
                  "en": "Cire Trudon Die Stumpenkerze in Stone · 6 × 15 cm – product view",
                  "fr": "Cire Trudon Die Stumpenkerze en Pierre · 6 × 15 cm – vue du produit",
                  "it": "Cire Trudon Die Stumpenkerze in Pietra · 6 × 15 cm – vista del prodotto"
                },
                "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_cierge_6-15_pierre_1200x1200_beige.jpg",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "mimose-6-15-cm",
            "name": {
              "de": "Mimose · 6 × 15 cm",
              "en": "Mimosa · 6 × 15 cm",
              "fr": "Mimosa · 6 × 15 cm",
              "it": "Mimosa · 6 × 15 cm"
            },
            "code": "FU6-15/823/TRU",
            "betrag": 32,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-die-stumpenkerze-21-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Cire Trudon Die Stumpenkerze in Mimose · 6 × 15 cm – Produktansicht",
                  "en": "Cire Trudon Die Stumpenkerze in Mimosa · 6 × 15 cm – product view",
                  "fr": "Cire Trudon Die Stumpenkerze en Mimosa · 6 × 15 cm – vue du produit",
                  "it": "Cire Trudon Die Stumpenkerze in Mimosa · 6 × 15 cm – vista del prodotto"
                },
                "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_cierge_6-15_ma_s_1200x1200_beige.jpg",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "hellrosa-6-15-cm",
            "name": {
              "de": "Hellrosa · 6 × 15 cm",
              "en": "Pale pink · 6 × 15 cm",
              "fr": "Rose pâle · 6 × 15 cm",
              "it": "Rosa chiaro · 6 × 15 cm"
            },
            "code": "FU6-15/600/TRU",
            "betrag": 32,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-die-stumpenkerze-22-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Cire Trudon Die Stumpenkerze in Hellrosa · 6 × 15 cm – Produktansicht",
                  "en": "Cire Trudon Die Stumpenkerze in Pale pink · 6 × 15 cm – product view",
                  "fr": "Cire Trudon Die Stumpenkerze en Rose pâle · 6 × 15 cm – vue du produit",
                  "it": "Cire Trudon Die Stumpenkerze in Rosa chiaro · 6 × 15 cm – vista del prodotto"
                },
                "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_cierge_6-15_rose_tendresse_1200x1200_beige.jpg",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "burgunderrot-6-15-cm",
            "name": {
              "de": "Burgunderrot · 6 × 15 cm",
              "en": "Burgundy · 6 × 15 cm",
              "fr": "Bordeaux · 6 × 15 cm",
              "it": "Bordeaux · 6 × 15 cm"
            },
            "code": "FU6-15/630/TRU",
            "betrag": 32,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-die-stumpenkerze-23.webp",
                "width": 1200,
                "height": 1200,
                "alt": {
                  "de": "Cire Trudon Die Stumpenkerze in Burgunderrot · 6 × 15 cm – Produktansicht",
                  "en": "Cire Trudon Die Stumpenkerze in Burgundy · 6 × 15 cm – product view",
                  "fr": "Cire Trudon Die Stumpenkerze en Bordeaux · 6 × 15 cm – vue du produit",
                  "it": "Cire Trudon Die Stumpenkerze in Bordeaux · 6 × 15 cm – vista del prodotto"
                },
                "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_cierge_6-15_bordeaux_1200x1200_beige.jpg",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "marineblau-6-15-cm",
            "name": {
              "de": "Marineblau · 6 × 15 cm",
              "en": "Navy blue · 6 × 15 cm",
              "fr": "Bleu marine · 6 × 15 cm",
              "it": "Blu navy · 6 × 15 cm"
            },
            "code": "FU6-15/795/TRU",
            "betrag": 32,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-die-stumpenkerze-24.webp",
                "width": 1200,
                "height": 1200,
                "alt": {
                  "de": "Cire Trudon Die Stumpenkerze in Marineblau · 6 × 15 cm – Produktansicht",
                  "en": "Cire Trudon Die Stumpenkerze in Navy blue · 6 × 15 cm – product view",
                  "fr": "Cire Trudon Die Stumpenkerze en Bleu marine · 6 × 15 cm – vue du produit",
                  "it": "Cire Trudon Die Stumpenkerze in Blu navy · 6 × 15 cm – vista del prodotto"
                },
                "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_cierge_6-15_bleu_marine_1200x1200_beige.jpg",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "khaki-6-15-cm",
            "name": {
              "de": "Khaki · 6 × 15 cm",
              "en": "Khaki · 6 × 15 cm",
              "fr": "Kaki · 6 × 15 cm",
              "it": "Cachi · 6 × 15 cm"
            },
            "code": "FU6-15/700/TRU",
            "betrag": 32,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-die-stumpenkerze-25-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Cire Trudon Die Stumpenkerze in Khaki · 6 × 15 cm – Produktansicht",
                  "en": "Cire Trudon Die Stumpenkerze in Khaki · 6 × 15 cm – product view",
                  "fr": "Cire Trudon Die Stumpenkerze en Kaki · 6 × 15 cm – vue du produit",
                  "it": "Cire Trudon Die Stumpenkerze in Cachi · 6 × 15 cm – vista del prodotto"
                },
                "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_cierge_6-15_kaki_1200x1200_beige.jpg",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "schwarz-8-15-cm",
            "name": {
              "de": "Schwarz · 8 × 15 cm",
              "en": "Black · 8 × 15 cm",
              "fr": "Noir · 8 × 15 cm",
              "it": "Nero · 8 × 15 cm"
            },
            "code": "FU8-15/860/TRU",
            "betrag": 58,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-die-stumpenkerze-26.webp",
                "width": 1200,
                "height": 1200,
                "alt": {
                  "de": "Cire Trudon Die Stumpenkerze in Schwarz · 8 × 15 cm – Produktansicht",
                  "en": "Cire Trudon Die Stumpenkerze in Black · 8 × 15 cm – product view",
                  "fr": "Cire Trudon Die Stumpenkerze en Noir · 8 × 15 cm – vue du produit",
                  "it": "Cire Trudon Die Stumpenkerze in Nero · 8 × 15 cm – vista del prodotto"
                },
                "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_cierge_8-15_noir_1200x1200_beige.jpg",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "weiss-8-15-cm",
            "name": {
              "de": "Weiß · 8 × 15 cm",
              "en": "White · 8 × 15 cm",
              "fr": "Blanc · 8 × 15 cm",
              "it": "Bianco · 8 × 15 cm"
            },
            "code": "FU8-15/510/TRU",
            "betrag": 58,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-die-stumpenkerze-27-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Cire Trudon Die Stumpenkerze in Weiß · 8 × 15 cm – Produktansicht",
                  "en": "Cire Trudon Die Stumpenkerze in White · 8 × 15 cm – product view",
                  "fr": "Cire Trudon Die Stumpenkerze en Blanc · 8 × 15 cm – vue du produit",
                  "it": "Cire Trudon Die Stumpenkerze in Bianco · 8 × 15 cm – vista del prodotto"
                },
                "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_cierge_8-15_blanc_1200x1200_beige.jpg",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "steinfarben-8-15-cm",
            "name": {
              "de": "Steinfarben · 8 × 15 cm",
              "en": "Stone · 8 × 15 cm",
              "fr": "Pierre · 8 × 15 cm",
              "it": "Pietra · 8 × 15 cm"
            },
            "code": "FU8-15/514/TRU",
            "betrag": 58,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-die-stumpenkerze-28-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Cire Trudon Die Stumpenkerze in Steinfarben · 8 × 15 cm – Produktansicht",
                  "en": "Cire Trudon Die Stumpenkerze in Stone · 8 × 15 cm – product view",
                  "fr": "Cire Trudon Die Stumpenkerze en Pierre · 8 × 15 cm – vue du produit",
                  "it": "Cire Trudon Die Stumpenkerze in Pietra · 8 × 15 cm – vista del prodotto"
                },
                "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_cierge_8-15_pierre_1200x1200_beige.jpg",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "mimose-8-15-cm",
            "name": {
              "de": "Mimose · 8 × 15 cm",
              "en": "Mimosa · 8 × 15 cm",
              "fr": "Mimosa · 8 × 15 cm",
              "it": "Mimosa · 8 × 15 cm"
            },
            "code": "FU8-15/823/TRU",
            "betrag": 58,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-die-stumpenkerze-29-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Cire Trudon Die Stumpenkerze in Mimose · 8 × 15 cm – Produktansicht",
                  "en": "Cire Trudon Die Stumpenkerze in Mimosa · 8 × 15 cm – product view",
                  "fr": "Cire Trudon Die Stumpenkerze en Mimosa · 8 × 15 cm – vue du produit",
                  "it": "Cire Trudon Die Stumpenkerze in Mimosa · 8 × 15 cm – vista del prodotto"
                },
                "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_cierge_8-15_ma_s_1200x1200_beige.jpg",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "hellrosa-8-15-cm",
            "name": {
              "de": "Hellrosa · 8 × 15 cm",
              "en": "Pale pink · 8 × 15 cm",
              "fr": "Rose pâle · 8 × 15 cm",
              "it": "Rosa chiaro · 8 × 15 cm"
            },
            "code": "FU8-15/600/TRU",
            "betrag": 58,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-die-stumpenkerze-30-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Cire Trudon Die Stumpenkerze in Hellrosa · 8 × 15 cm – Produktansicht",
                  "en": "Cire Trudon Die Stumpenkerze in Pale pink · 8 × 15 cm – product view",
                  "fr": "Cire Trudon Die Stumpenkerze en Rose pâle · 8 × 15 cm – vue du produit",
                  "it": "Cire Trudon Die Stumpenkerze in Rosa chiaro · 8 × 15 cm – vista del prodotto"
                },
                "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_cierge_8-15_rose_tendresse_1200x1200_beige.jpg",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "burgunderrot-8-15-cm",
            "name": {
              "de": "Burgunderrot · 8 × 15 cm",
              "en": "Burgundy · 8 × 15 cm",
              "fr": "Bordeaux · 8 × 15 cm",
              "it": "Bordeaux · 8 × 15 cm"
            },
            "code": "FU8-15/630/TRU",
            "betrag": 58,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-die-stumpenkerze-31-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Cire Trudon Die Stumpenkerze in Burgunderrot · 8 × 15 cm – Produktansicht",
                  "en": "Cire Trudon Die Stumpenkerze in Burgundy · 8 × 15 cm – product view",
                  "fr": "Cire Trudon Die Stumpenkerze en Bordeaux · 8 × 15 cm – vue du produit",
                  "it": "Cire Trudon Die Stumpenkerze in Bordeaux · 8 × 15 cm – vista del prodotto"
                },
                "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_cierge_8-15_bordeaux_1200x1200_beige.jpg",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "marineblau-8-15-cm",
            "name": {
              "de": "Marineblau · 8 × 15 cm",
              "en": "Navy blue · 8 × 15 cm",
              "fr": "Bleu marine · 8 × 15 cm",
              "it": "Blu navy · 8 × 15 cm"
            },
            "code": "FU8-15/795/TRU",
            "betrag": 58,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-die-stumpenkerze-32-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Cire Trudon Die Stumpenkerze in Marineblau · 8 × 15 cm – Produktansicht",
                  "en": "Cire Trudon Die Stumpenkerze in Navy blue · 8 × 15 cm – product view",
                  "fr": "Cire Trudon Die Stumpenkerze en Bleu marine · 8 × 15 cm – vue du produit",
                  "it": "Cire Trudon Die Stumpenkerze in Blu navy · 8 × 15 cm – vista del prodotto"
                },
                "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_cierge_8-15_bleu_marine_1200x1200_beige.jpg",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "khaki-8-15-cm",
            "name": {
              "de": "Khaki · 8 × 15 cm",
              "en": "Khaki · 8 × 15 cm",
              "fr": "Kaki · 8 × 15 cm",
              "it": "Cachi · 8 × 15 cm"
            },
            "code": "FU8-15/700/TRU",
            "betrag": 58,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-die-stumpenkerze-33-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Cire Trudon Die Stumpenkerze in Khaki · 8 × 15 cm – Produktansicht",
                  "en": "Cire Trudon Die Stumpenkerze in Khaki · 8 × 15 cm – product view",
                  "fr": "Cire Trudon Die Stumpenkerze en Kaki · 8 × 15 cm – vue du produit",
                  "it": "Cire Trudon Die Stumpenkerze in Cachi · 8 × 15 cm – vista del prodotto"
                },
                "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_cierge_8-15_kaki_1200x1200_beige.jpg",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "slug": "cire-trudon-royale",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "wohnaccessoire",
    "name": "Royale",
    "kurz": {
      "de": "Große Spitzkerzen „Royale“, in der Normandie von Hand gefertigt und in vielen Farben erhältlich; sechs Stück je Schachtel.",
      "en": "Large “Royale” taper candles, made by hand in Normandy and available in many colours; six per box.",
      "fr": "Grandes chandelles « Royale », fabriquées à la main en Normandie et proposées en nombreuses couleurs ; six par boîte.",
      "it": "Grandi candele affusolate “Royale”, realizzate a mano in Normandia e disponibili in molti colori; sei per scatola."
    },
    "merkmale": [
      {
        "de": "H 280 mm · Ø 25 mm · Brenndauer ca. 14 h",
        "en": "H 280 mm · Ø 25 mm · Burn time approx. 14 h",
        "fr": "H 280 mm · Ø 25 mm · Durée de combustion env. 14 h",
        "it": "H 280 mm · Ø 25 mm · Durata di combustione circa 14 h"
      },
      {
        "de": "Rosa: H 280 mm · Ø 25 mm · Brenndauer ca. 14 h",
        "en": "Pink: H 280 mm · Ø 25 mm · Burn time approx. 14 h",
        "fr": "Rose: H 280 mm · Ø 25 mm · Durée de combustion env. 14 h",
        "it": "Rosa: H 280 mm · Ø 25 mm · Durata di combustione circa 14 h"
      },
      {
        "de": "Fuchsia: H 280 mm · Ø 25 mm · Brenndauer ca. 14 h",
        "en": "Fuchsia: H 280 mm · Ø 25 mm · Burn time approx. 14 h",
        "fr": "Fuchsia: H 280 mm · Ø 25 mm · Durée de combustion env. 14 h",
        "it": "Fucsia: H 280 mm · Ø 25 mm · Durata di combustione circa 14 h"
      },
      {
        "de": "Rot: H 280 mm · Ø 25 mm · Brenndauer ca. 14 h",
        "en": "Red: H 280 mm · Ø 25 mm · Burn time approx. 14 h",
        "fr": "Rouge: H 280 mm · Ø 25 mm · Durée de combustion env. 14 h",
        "it": "Rosso: H 280 mm · Ø 25 mm · Durata di combustione circa 14 h"
      },
      {
        "de": "Tannengrün: H 280 mm · Ø 25 mm · Brenndauer ca. 14 h",
        "en": "Fir green: H 280 mm · Ø 25 mm · Burn time approx. 14 h",
        "fr": "Vert sapin: H 280 mm · Ø 25 mm · Durée de combustion env. 14 h",
        "it": "Verde abete: H 280 mm · Ø 25 mm · Durata di combustione circa 14 h"
      },
      {
        "de": "Mimose: H 280 mm · Ø 25 mm · Brenndauer ca. 14 h",
        "en": "Mimosa: H 280 mm · Ø 25 mm · Burn time approx. 14 h",
        "fr": "Mimosa: H 280 mm · Ø 25 mm · Durée de combustion env. 14 h",
        "it": "Mimosa: H 280 mm · Ø 25 mm · Durata di combustione circa 14 h"
      },
      {
        "de": "Marineblau: H 280 mm · Ø 25 mm · Brenndauer ca. 14 h",
        "en": "Navy blue: H 280 mm · Ø 25 mm · Burn time approx. 14 h",
        "fr": "Bleu marine: H 280 mm · Ø 25 mm · Durée de combustion env. 14 h",
        "it": "Blu navy: H 280 mm · Ø 25 mm · Durata di combustione circa 14 h"
      },
      {
        "de": "Burgunderrot: H 280 mm · Ø 25 mm · Brenndauer ca. 14 h",
        "en": "Burgundy: H 280 mm · Ø 25 mm · Burn time approx. 14 h",
        "fr": "Bordeaux: H 280 mm · Ø 25 mm · Durée de combustion env. 14 h",
        "it": "Bordeaux: H 280 mm · Ø 25 mm · Durata di combustione circa 14 h"
      },
      {
        "de": "Rauch: H 280 mm · Ø 25 mm · Brenndauer ca. 14 h",
        "en": "Smoke: H 280 mm · Ø 25 mm · Burn time approx. 14 h",
        "fr": "Fumée: H 280 mm · Ø 25 mm · Durée de combustion env. 14 h",
        "it": "Fumo: H 280 mm · Ø 25 mm · Durata di combustione circa 14 h"
      },
      {
        "de": "Schnee: H 280 mm · Ø 25 mm · Brenndauer ca. 14 h",
        "en": "Snow: H 280 mm · Ø 25 mm · Burn time approx. 14 h",
        "fr": "Neige: H 280 mm · Ø 25 mm · Durée de combustion env. 14 h",
        "it": "Neve: H 280 mm · Ø 25 mm · Durata di combustione circa 14 h"
      },
      {
        "de": "Stein: H 280 mm · Ø 25 mm · Brenndauer ca. 14 h",
        "en": "Stone: H 280 mm · Ø 25 mm · Burn time approx. 14 h",
        "fr": "Pierre: H 280 mm · Ø 25 mm · Durée de combustion env. 14 h",
        "it": "Pietra: H 280 mm · Ø 25 mm · Durata di combustione circa 14 h"
      },
      {
        "de": "Khaki: H 280 mm · Ø 25 mm · Brenndauer ca. 14 h",
        "en": "Khaki: H 280 mm · Ø 25 mm · Burn time approx. 14 h",
        "fr": "Kaki: H 280 mm · Ø 25 mm · Durée de combustion env. 14 h",
        "it": "Cachi: H 280 mm · Ø 25 mm · Durata di combustione circa 14 h"
      },
      {
        "de": "Schwarz: H 280 mm · Ø 25 mm · Brenndauer ca. 14 h",
        "en": "Black: H 280 mm · Ø 25 mm · Burn time approx. 14 h",
        "fr": "Noir: H 280 mm · Ø 25 mm · Durée de combustion env. 14 h",
        "it": "Nero: H 280 mm · Ø 25 mm · Durata di combustione circa 14 h"
      },
      {
        "de": "Elfenbein: H 280 mm · Ø 25 mm · Brenndauer ca. 14 h",
        "en": "Ivory: H 280 mm · Ø 25 mm · Burn time approx. 14 h",
        "fr": "Ivoire: H 280 mm · Ø 25 mm · Durée de combustion env. 14 h",
        "it": "Avorio: H 280 mm · Ø 25 mm · Durata di combustione circa 14 h"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-royale-1-opt.webp",
        "width": 860,
        "height": 1075,
        "alt": {
          "de": "Cire Trudon Royale – Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Royale – product view on a light background",
          "fr": "Cire Trudon Royale – vue du produit sur fond clair",
          "it": "Cire Trudon Royale – vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/r/o/royale_rose_tendresse_1200x1200.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-royale-2.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon Royale – Stimmungsbild des Herstellers, das Produkt in Szene gesetzt",
          "en": "Cire Trudon Royale – mood image by the maker, the product styled in a scene",
          "fr": "Cire Trudon Royale – image d’ambiance du fabricant, le produit mis en scène",
          "it": "Cire Trudon Royale – immagine d’ambiente del produttore, il prodotto messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/b/o/bougeoir_cisel_royales_6.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/royale-in-rosa.html",
    "quellen": [
      "https://trudon.com/eu_de/royale-in-rosa.html",
      "https://trudon.com/eu_de/royale-in-fuschia.html",
      "https://trudon.com/eu_de/royale-in-bright-red.html",
      "https://trudon.com/eu_de/royale-in-tannengruen.html",
      "https://trudon.com/eu_de/royale-in-mimose.html",
      "https://trudon.com/eu_de/royale-in-marineblau.html",
      "https://trudon.com/eu_de/royale-in-burgunderrot.html",
      "https://trudon.com/eu_de/royale-in-rauch.html",
      "https://trudon.com/eu_de/white-royales.html",
      "https://trudon.com/eu_de/stone-royales.html",
      "https://trudon.com/eu_de/royale-in-khaki.html",
      "https://trudon.com/eu_de/royale-in-schwarz.html",
      "https://trudon.com/eu_de/royale-in-elfenbein.html"
    ],
    "stand": "2026-10-31",
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Rosa",
            "en": "Pink",
            "fr": "Rose",
            "it": "Rosa"
          },
          "betrag": 30,
          "sku": "ROY28/600/TRU"
        },
        {
          "name": {
            "de": "Fuchsia",
            "en": "Fuchsia",
            "fr": "Fuchsia",
            "it": "Fucsia"
          },
          "betrag": 30,
          "sku": "ROY28/564/TRU"
        },
        {
          "name": {
            "de": "Rot",
            "en": "Red",
            "fr": "Rouge",
            "it": "Rosso"
          },
          "betrag": 30,
          "sku": "ROY28/633/TRU"
        },
        {
          "name": {
            "de": "Tannengrün",
            "en": "Fir green",
            "fr": "Vert sapin",
            "it": "Verde abete"
          },
          "betrag": 30,
          "sku": "ROY28/680/TRU"
        },
        {
          "name": {
            "de": "Mimose",
            "en": "Mimosa",
            "fr": "Mimosa",
            "it": "Mimosa"
          },
          "betrag": 30,
          "sku": "ROY28/823/TRU"
        },
        {
          "name": {
            "de": "Marineblau",
            "en": "Navy blue",
            "fr": "Bleu marine",
            "it": "Blu navy"
          },
          "betrag": 30,
          "sku": "ROY28/795/TRU"
        },
        {
          "name": {
            "de": "Burgunderrot",
            "en": "Burgundy",
            "fr": "Bordeaux",
            "it": "Bordeaux"
          },
          "betrag": 30,
          "sku": "ROY28/630/TRU"
        },
        {
          "name": {
            "de": "Rauch",
            "en": "Smoke",
            "fr": "Fumée",
            "it": "Fumo"
          },
          "betrag": 30,
          "sku": "ROY28/855/TRU"
        },
        {
          "name": {
            "de": "Schnee",
            "en": "Snow",
            "fr": "Neige",
            "it": "Neve"
          },
          "betrag": 30,
          "sku": "ROY28/510/TRU"
        },
        {
          "name": {
            "de": "Stein",
            "en": "Stone",
            "fr": "Pierre",
            "it": "Pietra"
          },
          "betrag": 30,
          "sku": "ROY28/514/TRU"
        },
        {
          "name": {
            "de": "Khaki",
            "en": "Khaki",
            "fr": "Kaki",
            "it": "Cachi"
          },
          "betrag": 30,
          "sku": "ROY28/700/TRU"
        },
        {
          "name": {
            "de": "Schwarz",
            "en": "Black",
            "fr": "Noir",
            "it": "Nero"
          },
          "betrag": 30,
          "sku": "ROY28/860/TRU"
        },
        {
          "name": {
            "de": "Elfenbein",
            "en": "Ivory",
            "fr": "Ivoire",
            "it": "Avorio"
          },
          "betrag": 30,
          "sku": "ROY28/512/TRU"
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/royale-in-rosa.html"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Farbe",
          "en": "Colour",
          "fr": "Couleur",
          "it": "Colore"
        },
        "optionen": [
          {
            "id": "rosa",
            "name": {
              "de": "Rosa",
              "en": "Pink",
              "fr": "Rose",
              "it": "Rosa"
            },
            "code": "ROY28/600/TRU",
            "betrag": 30,
            "standard": true,
            "bilder": [
              "/Images/Wellness/produkte/cire-trudon/cire-trudon-royale-1-opt.webp"
            ]
          },
          {
            "id": "fuchsia",
            "name": {
              "de": "Fuchsia",
              "en": "Fuchsia",
              "fr": "Fuchsia",
              "it": "Fucsia"
            },
            "code": "ROY28/564/TRU",
            "betrag": 30,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-royale-11-opt.webp",
                "width": 835,
                "height": 1044,
                "alt": {
                  "de": "Cire Trudon Royale in Fuchsia – Produktansicht",
                  "en": "Cire Trudon Royale in Fuchsia – product view",
                  "fr": "Cire Trudon Royale en Fuchsia – vue du produit",
                  "it": "Cire Trudon Royale in Fucsia – vista del prodotto"
                },
                "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/r/o/royale_fushia_1200x1200.jpg",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "rot",
            "name": {
              "de": "Rot",
              "en": "Red",
              "fr": "Rouge",
              "it": "Rosso"
            },
            "code": "ROY28/633/TRU",
            "betrag": 30,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-royale-12-opt.webp",
                "width": 866,
                "height": 1082,
                "alt": {
                  "de": "Cire Trudon Royale in Rot – Produktansicht",
                  "en": "Cire Trudon Royale in Red – product view",
                  "fr": "Cire Trudon Royale en Rouge – vue du produit",
                  "it": "Cire Trudon Royale in Rosso – vista del prodotto"
                },
                "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/r/o/royale_rouge_vif_1200x1200.jpg",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "tannengrun",
            "name": {
              "de": "Tannengrün",
              "en": "Fir green",
              "fr": "Vert sapin",
              "it": "Verde abete"
            },
            "code": "ROY28/680/TRU",
            "betrag": 30,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-royale-13-opt.webp",
                "width": 867,
                "height": 1084,
                "alt": {
                  "de": "Cire Trudon Royale in Tannengrün – Produktansicht",
                  "en": "Cire Trudon Royale in Fir green – product view",
                  "fr": "Cire Trudon Royale en Vert sapin – vue du produit",
                  "it": "Cire Trudon Royale in Verde abete – vista del prodotto"
                },
                "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/r/o/royale_sapin_1200x1200.jpg",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "mimose",
            "name": {
              "de": "Mimose",
              "en": "Mimosa",
              "fr": "Mimosa",
              "it": "Mimosa"
            },
            "code": "ROY28/823/TRU",
            "betrag": 30,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-royale-14-opt.webp",
                "width": 961,
                "height": 1201,
                "alt": {
                  "de": "Cire Trudon Royale in Mimose – Produktansicht",
                  "en": "Cire Trudon Royale in Mimosa – product view",
                  "fr": "Cire Trudon Royale en Mimosa – vue du produit",
                  "it": "Cire Trudon Royale in Mimosa – vista del prodotto"
                },
                "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_royales_candles_-_823_mimosa_hd_v2_1.jpg",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "marineblau",
            "name": {
              "de": "Marineblau",
              "en": "Navy blue",
              "fr": "Bleu marine",
              "it": "Blu navy"
            },
            "code": "ROY28/795/TRU",
            "betrag": 30,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-royale-15.webp",
                "width": 1200,
                "height": 1200,
                "alt": {
                  "de": "Cire Trudon Royale in Marineblau – Produktansicht",
                  "en": "Cire Trudon Royale in Navy blue – product view",
                  "fr": "Cire Trudon Royale en Bleu marine – vue du produit",
                  "it": "Cire Trudon Royale in Blu navy – vista del prodotto"
                },
                "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/r/o/royale_bleu_marine_1200x1200_1.jpg",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "burgunderrot",
            "name": {
              "de": "Burgunderrot",
              "en": "Burgundy",
              "fr": "Bordeaux",
              "it": "Bordeaux"
            },
            "code": "ROY28/630/TRU",
            "betrag": 30,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-royale-16.webp",
                "width": 1200,
                "height": 1200,
                "alt": {
                  "de": "Cire Trudon Royale in Burgunderrot – Produktansicht",
                  "en": "Cire Trudon Royale in Burgundy – product view",
                  "fr": "Cire Trudon Royale en Bordeaux – vue du produit",
                  "it": "Cire Trudon Royale in Bordeaux – vista del prodotto"
                },
                "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/r/o/royale_burgundy_1200x1200_1.jpg",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "rauch",
            "name": {
              "de": "Rauch",
              "en": "Smoke",
              "fr": "Fumée",
              "it": "Fumo"
            },
            "code": "ROY28/855/TRU",
            "betrag": 30,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-royale-17-opt.webp",
                "width": 835,
                "height": 1044,
                "alt": {
                  "de": "Cire Trudon Royale in Rauch – Produktansicht",
                  "en": "Cire Trudon Royale in Smoke – product view",
                  "fr": "Cire Trudon Royale en Fumée – vue du produit",
                  "it": "Cire Trudon Royale in Fumo – vista del prodotto"
                },
                "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/r/o/royale_gris_1200x1200.jpg",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "schnee",
            "name": {
              "de": "Schnee",
              "en": "Snow",
              "fr": "Neige",
              "it": "Neve"
            },
            "code": "ROY28/510/TRU",
            "betrag": 30,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-royale-18.webp",
                "width": 1200,
                "height": 1200,
                "alt": {
                  "de": "Cire Trudon Royale in Schnee – Produktansicht",
                  "en": "Cire Trudon Royale in Snow – product view",
                  "fr": "Cire Trudon Royale en Neige – vue du produit",
                  "it": "Cire Trudon Royale in Neve – vista del prodotto"
                },
                "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/r/o/royale_blanc_1200x1200.jpg",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "stein",
            "name": {
              "de": "Stein",
              "en": "Stone",
              "fr": "Pierre",
              "it": "Pietra"
            },
            "code": "ROY28/514/TRU",
            "betrag": 30,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-royale-19-opt.webp",
                "width": 874,
                "height": 1092,
                "alt": {
                  "de": "Cire Trudon Royale in Stein – Produktansicht",
                  "en": "Cire Trudon Royale in Stone – product view",
                  "fr": "Cire Trudon Royale en Pierre – vue du produit",
                  "it": "Cire Trudon Royale in Pietra – vista del prodotto"
                },
                "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/r/o/royale-stone-beige-hd.jpg",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "khaki",
            "name": {
              "de": "Khaki",
              "en": "Khaki",
              "fr": "Kaki",
              "it": "Cachi"
            },
            "code": "ROY28/700/TRU",
            "betrag": 30,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-royale-20-opt.webp",
                "width": 862,
                "height": 1078,
                "alt": {
                  "de": "Cire Trudon Royale in Khaki – Produktansicht",
                  "en": "Cire Trudon Royale in Khaki – product view",
                  "fr": "Cire Trudon Royale en Kaki – vue du produit",
                  "it": "Cire Trudon Royale in Cachi – vista del prodotto"
                },
                "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/r/o/royale_kaki_1200x1200.jpg",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "schwarz",
            "name": {
              "de": "Schwarz",
              "en": "Black",
              "fr": "Noir",
              "it": "Nero"
            },
            "code": "ROY28/860/TRU",
            "betrag": 30,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-royale-21-opt.webp",
                "width": 850,
                "height": 1062,
                "alt": {
                  "de": "Cire Trudon Royale in Schwarz – Produktansicht",
                  "en": "Cire Trudon Royale in Black – product view",
                  "fr": "Cire Trudon Royale en Noir – vue du produit",
                  "it": "Cire Trudon Royale in Nero – vista del prodotto"
                },
                "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/r/o/royale_noir_1200x1200.jpg",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "elfenbein",
            "name": {
              "de": "Elfenbein",
              "en": "Ivory",
              "fr": "Ivoire",
              "it": "Avorio"
            },
            "code": "ROY28/512/TRU",
            "betrag": 30,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-royale-22-opt.webp",
                "width": 863,
                "height": 1079,
                "alt": {
                  "de": "Cire Trudon Royale in Elfenbein – Produktansicht",
                  "en": "Cire Trudon Royale in Ivory – product view",
                  "fr": "Cire Trudon Royale en Ivoire – vue du produit",
                  "it": "Cire Trudon Royale in Avorio – vista del prodotto"
                },
                "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/r/o/royale_ivoire_1200x1200.jpg",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          }
        ]
      }
    ],
    "zubehoer": [
      {
        "slug": "cire-trudon-fein-dekorierter-kerzenstander",
        "hinweis": {
          "de": "Für Royale-Spitzkerzen",
          "en": "For Royale taper candles",
          "fr": "Pour chandelles Royale",
          "it": "Per candele affusolate Royale"
        }
      },
      {
        "slug": "cire-trudon-die-kegel-kerzenloscher"
      }
    ]
  },
  // Nr. 34 (31.10.2026): Eaux de Parfum (kategorie parfum) und reine Parfum-Geschenkboxen (geschenkset)
  {
    "slug": "cire-trudon-aphelie-parfum",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "parfum",
    "name": "Aphélie",
    "kurz": {
      "de": "Eau de Parfum „Aphélie“, im Shop mit 100 ml und 15 ml. Der Duft verbindet Rosenessenz, schwarzer Johannisbeerknospe und Sandelholz.",
      "en": "“Aphélie” eau de parfum, offered in 100 ml and 15 ml. The scent combines rose essence, blackcurrant bud and sandalwood.",
      "fr": "Eau de parfum « Aphélie », proposée en 100 ml et 15 ml. Le parfum associe essence de rose, bourgeon de cassis et bois de santal.",
      "it": "Eau de parfum “Aphélie”, disponibile da 100 ml e 15 ml. Il profumo unisce essenza di rosa, gemma di ribes nero e legno di sandalo."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Rosen-Extrakt, Grüner Efeu",
        "en": "Top notes: Rose extract, Green ivy",
        "fr": "Notes de tête : Extrait de rose, Lierre vert",
        "it": "Note di testa: Estratto di rosa, Edera verde"
      },
      {
        "de": "Herznoten: Schwarze Johannisbeerknospe, Moos",
        "en": "Heart notes: Blackcurrant bud, Moss",
        "fr": "Notes de cœur : Bourgeon de cassis, Mousse",
        "it": "Note di cuore: Gemma di ribes nero, Muschio"
      },
      {
        "de": "Basisnoten: Sandelholz, Tonkabohne",
        "en": "Base notes: Sandalwood, Tonka bean",
        "fr": "Notes de fond : Bois de santal, Fève tonka",
        "it": "Note di fondo: Legno di sandalo, Fava tonka"
      },
      {
        "de": "Eau de Parfum · 100 ml · 15 ml",
        "en": "Eau de parfum · 100 ml · 15 ml",
        "fr": "Eau de parfum · 100 ml · 15 ml",
        "it": "Eau de parfum · 100 ml · 15 ml"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-aphelie-parfum-1.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon Aphélie – Flakon 100 ml, Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Aphélie – 100 ml bottle, product view on a light background",
          "fr": "Cire Trudon Aphélie – flacon de 100 ml, vue du produit sur fond clair",
          "it": "Cire Trudon Aphélie – flacone da 100 ml, vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/p/a/parfums_100ml_aph_lie_1200x1200_beige.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-aphelie-parfum-2-opt.webp",
        "width": 640,
        "height": 800,
        "alt": {
          "de": "Cire Trudon Aphélie – Flakon 15 ml mit Etui, Produktansicht",
          "en": "Cire Trudon Aphélie – 15 ml bottle with case, product view",
          "fr": "Cire Trudon Aphélie – flacon de 15 ml avec étui, vue du produit",
          "it": "Cire Trudon Aphélie – flacone da 15 ml con astuccio, vista del prodotto"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/p/a/parfums_15ml_aph_lie_pack_1200x1200_beige.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-aphelie-parfum-3.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon Aphélie – Stimmungsbild des Herstellers, der Flakon in Szene gesetzt",
          "en": "Cire Trudon Aphélie – mood image by the maker, the bottle styled in a scene",
          "fr": "Cire Trudon Aphélie – image d’ambiance du fabricant, le flacon mis en scène",
          "it": "Cire Trudon Aphélie – immagine d’ambiente del produttore, il flacone messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/a/p/aphelie_2_post_1_1.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/aphelie-eau-de-parfum-100ml.html",
    "quellen": [
      "https://trudon.com/eu_de/aphelie-eau-de-parfum-100ml.html",
      "https://trudon.com/eu_de/aphelie-eau-de-parfum-15ml.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-your-trio-of-perfumes",
      "cire-trudon-eaux-de-parfum-gift-set-medie-aphelie-deux"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": "100 ml",
          "betrag": 210,
          "sku": "P/EP/100/APH",
          "inhaltMl": 100,
          "zerbrechlich": true
        },
        {
          "name": "15 ml",
          "betrag": 42,
          "sku": "P/EP/015/APH",
          "inhaltMl": 15,
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/aphelie-eau-de-parfum-100ml.html"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Fassungsvermögen",
          "en": "Capacity",
          "fr": "Contenance",
          "it": "Capacità"
        },
        "optionen": [
          {
            "id": "100-ml",
            "name": "100 ml",
            "code": "P/EP/100/APH",
            "betrag": 210,
            "standard": true,
            "bilder": [
              "/Images/Wellness/produkte/cire-trudon/cire-trudon-aphelie-parfum-1.webp"
            ]
          },
          {
            "id": "15-ml",
            "name": "15 ml",
            "code": "P/EP/015/APH",
            "betrag": 42,
            "bilder": [
              "/Images/Wellness/produkte/cire-trudon/cire-trudon-aphelie-parfum-2-opt.webp"
            ]
          }
        ]
      }
    ]
  },
  {
    "slug": "cire-trudon-bruma-parfum",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "parfum",
    "name": "Bruma",
    "kurz": {
      "de": "Eau de Parfum „Bruma“, im Shop mit 100 ml und 15 ml. Der Duft verbindet Galbanum, Veilchen und Leder.",
      "en": "“Bruma” eau de parfum, offered in 100 ml and 15 ml. The scent combines galbanum, violet and leather.",
      "fr": "Eau de parfum « Bruma », proposée en 100 ml et 15 ml. Le parfum associe galbanum, violette et cuir.",
      "it": "Eau de parfum “Bruma”, disponibile da 100 ml e 15 ml. Il profumo unisce galbano, violetta e cuoio."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Galbanum, Lavendel",
        "en": "Top notes: Galbanum, Lavender",
        "fr": "Notes de tête : Galbanum, Lavande",
        "it": "Note di testa: Galbano, Lavanda"
      },
      {
        "de": "Herznoten: Iris, Veilchen",
        "en": "Heart notes: Iris, Violet",
        "fr": "Notes de cœur : Iris, Violette",
        "it": "Note di cuore: Iris, Violetta"
      },
      {
        "de": "Basisnoten: Leder, Labdanum",
        "en": "Base notes: Leather, Labdanum",
        "fr": "Notes de fond : Cuir, Labdanum",
        "it": "Note di fondo: Cuoio, Labdano"
      },
      {
        "de": "Eau de Parfum · 100 ml · 15 ml",
        "en": "Eau de parfum · 100 ml · 15 ml",
        "fr": "Eau de parfum · 100 ml · 15 ml",
        "it": "Eau de parfum · 100 ml · 15 ml"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-bruma-parfum-1-opt.webp",
        "width": 761,
        "height": 951,
        "alt": {
          "de": "Cire Trudon Bruma – Flakon 100 ml, Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Bruma – 100 ml bottle, product view on a light background",
          "fr": "Cire Trudon Bruma – flacon de 100 ml, vue du produit sur fond clair",
          "it": "Cire Trudon Bruma – flacone da 100 ml, vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/p/a/parfums_100ml_bruma_1200x1200_beige.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-bruma-parfum-2-opt.webp",
        "width": 640,
        "height": 800,
        "alt": {
          "de": "Cire Trudon Bruma – Flakon 15 ml mit Etui, Produktansicht",
          "en": "Cire Trudon Bruma – 15 ml bottle with case, product view",
          "fr": "Cire Trudon Bruma – flacon de 15 ml avec étui, vue du produit",
          "it": "Cire Trudon Bruma – flacone da 15 ml con astuccio, vista del prodotto"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/p/a/parfums_15ml_bruma_pack_1200x1200_beige.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-bruma-parfum-3.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon Bruma – Stimmungsbild des Herstellers, der Flakon in Szene gesetzt",
          "en": "Cire Trudon Bruma – mood image by the maker, the bottle styled in a scene",
          "fr": "Cire Trudon Bruma – image d’ambiance du fabricant, le flacon mis en scène",
          "it": "Cire Trudon Bruma – immagine d’ambiente del produttore, il flacone messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/p/a/parfums_100ml_bruma_1_1200x1200_in-situ.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/bruma-perfume-100ml.html",
    "quellen": [
      "https://trudon.com/eu_de/bruma-perfume-100ml.html",
      "https://trudon.com/eu_de/bruma-eau-de-parfum-15ml.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-your-trio-of-perfumes"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": "100 ml",
          "betrag": 210,
          "sku": "P/EP/100/BRU",
          "inhaltMl": 100,
          "zerbrechlich": true
        },
        {
          "name": "15 ml",
          "betrag": 42,
          "sku": "P/EP/015/BRU",
          "inhaltMl": 15,
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/bruma-perfume-100ml.html"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Fassungsvermögen",
          "en": "Capacity",
          "fr": "Contenance",
          "it": "Capacità"
        },
        "optionen": [
          {
            "id": "100-ml",
            "name": "100 ml",
            "code": "P/EP/100/BRU",
            "betrag": 210,
            "standard": true,
            "bilder": [
              "/Images/Wellness/produkte/cire-trudon/cire-trudon-bruma-parfum-1-opt.webp"
            ]
          },
          {
            "id": "15-ml",
            "name": "15 ml",
            "code": "P/EP/015/BRU",
            "betrag": 42,
            "bilder": [
              "/Images/Wellness/produkte/cire-trudon/cire-trudon-bruma-parfum-2-opt.webp"
            ]
          }
        ]
      }
    ]
  },
  {
    "slug": "cire-trudon-carmen-parfum",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "parfum",
    "name": "Carmen",
    "kurz": {
      "de": "Eau de Parfum „Carmen“, im Shop mit 100 ml und 15 ml. Der Duft verbindet Bergamotte, Tabak und Leder. Laut Hersteller eine Neuinterpretation des Dufts der Kerze Ernesto.",
      "en": "“Carmen” eau de parfum, offered in 100 ml and 15 ml. The scent combines bergamot, tobacco and leather. According to the maker, a reinterpretation of the Ernesto candle scent.",
      "fr": "Eau de parfum « Carmen », proposée en 100 ml et 15 ml. Le parfum associe bergamote, tabac et cuir. Selon le fabricant, une réinterprétation du parfum de la bougie Ernesto.",
      "it": "Eau de parfum “Carmen”, disponibile da 100 ml e 15 ml. Il profumo unisce bergamotto, tabacco e cuoio. Secondo il produttore, una reinterpretazione del profumo della candela Ernesto."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Bergamotte, Grapefruit, Rum",
        "en": "Top notes: Bergamot, Grapefruit, Rum",
        "fr": "Notes de tête : Bergamote, Pamplemousse, Rhum",
        "it": "Note di testa: Bergamotto, Pompelmo, Rum"
      },
      {
        "de": "Herznoten: Eiche, Gewürznelke, Leder, Tabak",
        "en": "Heart notes: Oak, Clove, Leather, Tobacco",
        "fr": "Notes de cœur : Chêne, Clou de girofle, Cuir, Tabac",
        "it": "Note di cuore: Quercia, Chiodo di garofano, Cuoio, Tabacco"
      },
      {
        "de": "Basisnoten: Ambroxan, Labdanum, Moos, Patschuli",
        "en": "Base notes: Ambroxan, Labdanum, Moss, Patchouli",
        "fr": "Notes de fond : Ambroxan, Labdanum, Mousse, Patchouli",
        "it": "Note di fondo: Ambroxan, Labdano, Muschio, Patchouli"
      },
      {
        "de": "Konzentration 15 %",
        "en": "Concentration 15 %",
        "fr": "Concentration 15 %",
        "it": "Concentrazione 15 %"
      },
      {
        "de": "Eau de Parfum · 100 ml · 15 ml",
        "en": "Eau de parfum · 100 ml · 15 ml",
        "fr": "Eau de parfum · 100 ml · 15 ml",
        "it": "Eau de parfum · 100 ml · 15 ml"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-carmen-parfum-1-opt.webp",
        "width": 757,
        "height": 946,
        "alt": {
          "de": "Cire Trudon Carmen – Flakon 100 ml, Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Carmen – 100 ml bottle, product view on a light background",
          "fr": "Cire Trudon Carmen – flacon de 100 ml, vue du produit sur fond clair",
          "it": "Cire Trudon Carmen – flacone da 100 ml, vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/p/a/parfums_100ml_carmen_1200x1200_beige.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-carmen-parfum-2-opt.webp",
        "width": 640,
        "height": 800,
        "alt": {
          "de": "Cire Trudon Carmen – Flakon 15 ml mit Etui, Produktansicht",
          "en": "Cire Trudon Carmen – 15 ml bottle with case, product view",
          "fr": "Cire Trudon Carmen – flacon de 15 ml avec étui, vue du produit",
          "it": "Cire Trudon Carmen – flacone da 15 ml con astuccio, vista del prodotto"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/p/e/perfume_carmen_15ml_pack_1200x1200_grey.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-carmen-parfum-3.webp",
        "width": 927,
        "height": 927,
        "alt": {
          "de": "Cire Trudon Carmen – Stimmungsbild des Herstellers, der Flakon in Szene gesetzt",
          "en": "Cire Trudon Carmen – mood image by the maker, the bottle styled in a scene",
          "fr": "Cire Trudon Carmen – image d’ambiance du fabricant, le flacon mis en scène",
          "it": "Cire Trudon Carmen – immagine d’ambiente del produttore, il flacone messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_sm2026_carmen_04_1x1_-_copie_1.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/carmen-perfume-100ml.html",
    "quellen": [
      "https://trudon.com/eu_de/carmen-perfume-100ml.html",
      "https://trudon.com/eu_de/carmen-perfume-15ml.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-ernesto-duftkerze",
      "cire-trudon-your-trio-of-perfumes"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": "100 ml",
          "betrag": 210,
          "sku": "TCRM00010021XS001",
          "inhaltMl": 100,
          "zerbrechlich": true
        },
        {
          "name": "15 ml",
          "betrag": 42,
          "sku": "TCRM00001521XS001",
          "inhaltMl": 15,
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/carmen-perfume-100ml.html"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Fassungsvermögen",
          "en": "Capacity",
          "fr": "Contenance",
          "it": "Capacità"
        },
        "optionen": [
          {
            "id": "100-ml",
            "name": "100 ml",
            "code": "TCRM00010021XS001",
            "betrag": 210,
            "standard": true,
            "bilder": [
              "/Images/Wellness/produkte/cire-trudon/cire-trudon-carmen-parfum-1-opt.webp"
            ]
          },
          {
            "id": "15-ml",
            "name": "15 ml",
            "code": "TCRM00001521XS001",
            "betrag": 42,
            "bilder": [
              "/Images/Wellness/produkte/cire-trudon/cire-trudon-carmen-parfum-2-opt.webp"
            ]
          }
        ]
      }
    ]
  },
  {
    "slug": "cire-trudon-deux-parfum",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "parfum",
    "name": "Deux",
    "kurz": {
      "de": "Eau de Parfum „Deux“, im Shop mit 100 ml und 15 ml. Der Duft verbindet grünen Blättern, Kiefer und Zedernholz.",
      "en": "“Deux” eau de parfum, offered in 100 ml and 15 ml. The scent combines green leaves, pine and cedarwood.",
      "fr": "Eau de parfum « Deux », proposée en 100 ml et 15 ml. Le parfum associe feuilles vertes, pin et bois de cèdre.",
      "it": "Eau de parfum “Deux”, disponibile da 100 ml e 15 ml. Il profumo unisce foglie verdi, pino e legno di cedro."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Grüne Blätter, Bitterorange",
        "en": "Top notes: Green leaves, Bitter orange",
        "fr": "Notes de tête : Feuilles vertes, Bigarade",
        "it": "Note di testa: Foglie verdi, Arancia amara"
      },
      {
        "de": "Herznoten: Wacholder, Kiefer",
        "en": "Heart notes: Juniper, Pine",
        "fr": "Notes de cœur : Genévrier, Pin",
        "it": "Note di cuore: Ginepro, Pino"
      },
      {
        "de": "Basisnoten: Zedernholz, Weihrauch",
        "en": "Base notes: Cedarwood, Frankincense",
        "fr": "Notes de fond : Bois de cèdre, Encens",
        "it": "Note di fondo: Legno di cedro, Incenso"
      },
      {
        "de": "Eau de Parfum · 100 ml · 15 ml",
        "en": "Eau de parfum · 100 ml · 15 ml",
        "fr": "Eau de parfum · 100 ml · 15 ml",
        "it": "Eau de parfum · 100 ml · 15 ml"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-deux-parfum-1-opt.webp",
        "width": 761,
        "height": 951,
        "alt": {
          "de": "Cire Trudon Deux – Flakon 100 ml, Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Deux – 100 ml bottle, product view on a light background",
          "fr": "Cire Trudon Deux – flacon de 100 ml, vue du produit sur fond clair",
          "it": "Cire Trudon Deux – flacone da 100 ml, vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/p/a/parfums_100ml_deux_1200x1200_beige.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-deux-parfum-2-opt.webp",
        "width": 640,
        "height": 800,
        "alt": {
          "de": "Cire Trudon Deux – Flakon 15 ml mit Etui, Produktansicht",
          "en": "Cire Trudon Deux – 15 ml bottle with case, product view",
          "fr": "Cire Trudon Deux – flacon de 15 ml avec étui, vue du produit",
          "it": "Cire Trudon Deux – flacone da 15 ml con astuccio, vista del prodotto"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/p/a/parfums_15ml_deux_pack_1200x1200_beige.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-deux-parfum-3.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon Deux – Stimmungsbild des Herstellers, der Flakon in Szene gesetzt",
          "en": "Cire Trudon Deux – mood image by the maker, the bottle styled in a scene",
          "fr": "Cire Trudon Deux – image d’ambiance du fabricant, le flacon mis en scène",
          "it": "Cire Trudon Deux – immagine d’ambiente del produttore, il flacone messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/p/a/parfums_100ml_famille_1200x1200_in-situ.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/deux-eau-de-parfum-100ml.html",
    "quellen": [
      "https://trudon.com/eu_de/deux-eau-de-parfum-100ml.html",
      "https://trudon.com/eu_de/deux-eau-de-parfum-15ml.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-your-trio-of-perfumes",
      "cire-trudon-eaux-de-parfum-gift-set-medie-aphelie-deux"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": "100 ml",
          "betrag": 210,
          "sku": "P/EP/100/DEU",
          "inhaltMl": 100,
          "zerbrechlich": true
        },
        {
          "name": "15 ml",
          "betrag": 42,
          "sku": "P/EP/015/DEU",
          "inhaltMl": 15,
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/deux-eau-de-parfum-100ml.html"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Fassungsvermögen",
          "en": "Capacity",
          "fr": "Contenance",
          "it": "Capacità"
        },
        "optionen": [
          {
            "id": "100-ml",
            "name": "100 ml",
            "code": "P/EP/100/DEU",
            "betrag": 210,
            "standard": true,
            "bilder": [
              "/Images/Wellness/produkte/cire-trudon/cire-trudon-deux-parfum-1-opt.webp"
            ]
          },
          {
            "id": "15-ml",
            "name": "15 ml",
            "code": "P/EP/015/DEU",
            "betrag": 42,
            "bilder": [
              "/Images/Wellness/produkte/cire-trudon/cire-trudon-deux-parfum-2-opt.webp"
            ]
          }
        ]
      }
    ]
  },
  {
    "slug": "cire-trudon-absolu-parfum",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "parfum",
    "name": "Absolu",
    "kurz": {
      "de": "Eau de Parfum „Absolu“, im Shop mit 100 ml und 15 ml. Der Duft verbindet Safran, Orangenblüten-Absolue und Tonkabohne.",
      "en": "“Absolu” eau de parfum, offered in 100 ml and 15 ml. The scent combines saffron, orange blossom absolute and tonka bean.",
      "fr": "Eau de parfum « Absolu », proposée en 100 ml et 15 ml. Le parfum associe safran, absolu de fleur d’oranger et fève tonka.",
      "it": "Eau de parfum “Absolu”, disponibile da 100 ml e 15 ml. Il profumo unisce zafferano, assoluta di fiori d’arancio e fava tonka."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Kardamom, Mandarine, Safran",
        "en": "Top notes: Cardamom, Mandarin, Saffron",
        "fr": "Notes de tête : Cardamome, Mandarine, Safran",
        "it": "Note di testa: Cardamomo, Mandarino, Zafferano"
      },
      {
        "de": "Herznoten: Weihrauch, Iris, Orangenblüten-Absolue",
        "en": "Heart notes: Frankincense, Iris, Orange blossom absolute",
        "fr": "Notes de cœur : Encens, Iris, Absolu de fleur d’oranger",
        "it": "Note di cuore: Incenso, Iris, Assoluta di fiori d’arancio"
      },
      {
        "de": "Basisnoten: Guajakholz, Zedernholz, Tonkabohne",
        "en": "Base notes: Guaiac wood, Cedarwood, Tonka bean",
        "fr": "Notes de fond : Bois de gaïac, Bois de cèdre, Fève tonka",
        "it": "Note di fondo: Legno di guaiaco, Legno di cedro, Fava tonka"
      },
      {
        "de": "Eau de Parfum · 100 ml · 15 ml",
        "en": "Eau de parfum · 100 ml · 15 ml",
        "fr": "Eau de parfum · 100 ml · 15 ml",
        "it": "Eau de parfum · 100 ml · 15 ml"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-absolu-parfum-1.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon Absolu – Flakon 100 ml, Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Absolu – 100 ml bottle, product view on a light background",
          "fr": "Cire Trudon Absolu – flacon de 100 ml, vue du produit sur fond clair",
          "it": "Cire Trudon Absolu – flacone da 100 ml, vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/p/a/parfums_100ml_absolu_1200x1200_beige.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-absolu-parfum-2-opt.webp",
        "width": 640,
        "height": 800,
        "alt": {
          "de": "Cire Trudon Absolu – Flakon 15 ml mit Etui, Produktansicht",
          "en": "Cire Trudon Absolu – 15 ml bottle with case, product view",
          "fr": "Cire Trudon Absolu – flacon de 15 ml avec étui, vue du produit",
          "it": "Cire Trudon Absolu – flacone da 15 ml con astuccio, vista del prodotto"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/p/a/parfums_15ml_absolu_pack_1200x1200_beige.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-absolu-parfum-3.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon Absolu – Stimmungsbild des Herstellers, der Flakon in Szene gesetzt",
          "en": "Cire Trudon Absolu – mood image by the maker, the bottle styled in a scene",
          "fr": "Cire Trudon Absolu – image d’ambiance du fabricant, le flacon mis en scène",
          "it": "Cire Trudon Absolu – immagine d’ambiente del produttore, il flacone messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_-_absolu_eau_de_parfum_1.1_1.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/eau-de-parfum-100ml-absolu.html",
    "quellen": [
      "https://trudon.com/eu_de/eau-de-parfum-100ml-absolu.html",
      "https://trudon.com/eu_de/eau-de-parfum-15ml-absolu.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-your-trio-of-perfumes",
      "cire-trudon-eaux-de-parfum-gift-set-medie-vixi-absolu"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": "100 ml",
          "betrag": 210,
          "sku": "P/EP/100/ABS",
          "inhaltMl": 100,
          "zerbrechlich": true
        },
        {
          "name": "15 ml",
          "betrag": 42,
          "sku": "P/EP/015/ABS",
          "inhaltMl": 15,
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/eau-de-parfum-100ml-absolu.html"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Fassungsvermögen",
          "en": "Capacity",
          "fr": "Contenance",
          "it": "Capacità"
        },
        "optionen": [
          {
            "id": "100-ml",
            "name": "100 ml",
            "code": "P/EP/100/ABS",
            "betrag": 210,
            "standard": true,
            "bilder": [
              "/Images/Wellness/produkte/cire-trudon/cire-trudon-absolu-parfum-1.webp"
            ]
          },
          {
            "id": "15-ml",
            "name": "15 ml",
            "code": "P/EP/015/ABS",
            "betrag": 42,
            "bilder": [
              "/Images/Wellness/produkte/cire-trudon/cire-trudon-absolu-parfum-2-opt.webp"
            ]
          }
        ]
      }
    ]
  },
  {
    "slug": "cire-trudon-elae-parfum",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "parfum",
    "name": "Elae",
    "kurz": {
      "de": "Eau de Parfum „Elae“, im Shop mit 100 ml und 15 ml. Der Duft verbindet Neroli, Ylang-Ylang und Sandelholz.",
      "en": "“Elae” eau de parfum, offered in 100 ml and 15 ml. The scent combines neroli, ylang-ylang and sandalwood.",
      "fr": "Eau de parfum « Elae », proposée en 100 ml et 15 ml. Le parfum associe néroli, ylang-ylang et bois de santal.",
      "it": "Eau de parfum “Elae”, disponibile da 100 ml e 15 ml. Il profumo unisce neroli, ylang-ylang e legno di sandalo."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Neroli aus Marokko, Apfel",
        "en": "Top notes: Moroccan neroli, Apple",
        "fr": "Notes de tête : Néroli du Maroc, Pomme",
        "it": "Note di testa: Neroli del Marocco, Mela"
      },
      {
        "de": "Herznoten: Ägyptischer Jasmin, Ylang-Ylang",
        "en": "Heart notes: Egyptian jasmine, Ylang-ylang",
        "fr": "Notes de cœur : Jasmin d’Égypte, Ylang-ylang",
        "it": "Note di cuore: Gelsomino egiziano, Ylang-ylang"
      },
      {
        "de": "Basisnoten: Benzoe aus Laos, Australisches Sandelholz",
        "en": "Base notes: Benzoin from Laos, Australian sandalwood",
        "fr": "Notes de fond : Benjoin du Laos, Bois de santal d’Australie",
        "it": "Note di fondo: Benzoino del Laos, Legno di sandalo australiano"
      },
      {
        "de": "Eau de Parfum · 100 ml · 15 ml",
        "en": "Eau de parfum · 100 ml · 15 ml",
        "fr": "Eau de parfum · 100 ml · 15 ml",
        "it": "Eau de parfum · 100 ml · 15 ml"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-elae-parfum-1-opt.webp",
        "width": 760,
        "height": 950,
        "alt": {
          "de": "Cire Trudon Elae – Flakon 100 ml, Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Elae – 100 ml bottle, product view on a light background",
          "fr": "Cire Trudon Elae – flacon de 100 ml, vue du produit sur fond clair",
          "it": "Cire Trudon Elae – flacone da 100 ml, vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/p/a/parfums_100ml_elae_1200x1200_beige.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-elae-parfum-2-opt.webp",
        "width": 640,
        "height": 800,
        "alt": {
          "de": "Cire Trudon Elae – Flakon 15 ml mit Etui, Produktansicht",
          "en": "Cire Trudon Elae – 15 ml bottle with case, product view",
          "fr": "Cire Trudon Elae – flacon de 15 ml avec étui, vue du produit",
          "it": "Cire Trudon Elae – flacone da 15 ml con astuccio, vista del prodotto"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/p/a/parfums_15ml_elae_pack_1200x1200_beige.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-elae-parfum-3.webp",
        "width": 1600,
        "height": 1600,
        "alt": {
          "de": "Cire Trudon Elae – Stimmungsbild des Herstellers, der Flakon in Szene gesetzt",
          "en": "Cire Trudon Elae – mood image by the maker, the bottle styled in a scene",
          "fr": "Cire Trudon Elae – image d’ambiance du fabricant, le flacon mis en scène",
          "it": "Cire Trudon Elae – immagine d’ambiente del produttore, il flacone messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_-_elae_eau_de_parfum_-1x1_1.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/elae-perfume-100ml.html",
    "quellen": [
      "https://trudon.com/eu_de/elae-perfume-100ml.html",
      "https://trudon.com/eu_de/firkameeprobe-1.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-your-trio-of-perfumes"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": "100 ml",
          "betrag": 210,
          "sku": "P/EP/100/ELA",
          "inhaltMl": 100,
          "zerbrechlich": true
        },
        {
          "name": "15 ml",
          "betrag": 42,
          "sku": "P/EP/015/ELA",
          "inhaltMl": 15,
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/elae-perfume-100ml.html"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Fassungsvermögen",
          "en": "Capacity",
          "fr": "Contenance",
          "it": "Capacità"
        },
        "optionen": [
          {
            "id": "100-ml",
            "name": "100 ml",
            "code": "P/EP/100/ELA",
            "betrag": 210,
            "standard": true,
            "bilder": [
              "/Images/Wellness/produkte/cire-trudon/cire-trudon-elae-parfum-1-opt.webp"
            ]
          },
          {
            "id": "15-ml",
            "name": "15 ml",
            "code": "P/EP/015/ELA",
            "betrag": 42,
            "bilder": [
              "/Images/Wellness/produkte/cire-trudon/cire-trudon-elae-parfum-2-opt.webp"
            ]
          }
        ]
      }
    ]
  },
  {
    "slug": "cire-trudon-medie-parfum",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "parfum",
    "name": "Médie",
    "kurz": {
      "de": "Eau de Parfum „Médie“, im Shop mit 100 ml und 15 ml. Der Duft verbindet Grapefruit, Jasmin Sambac und Zedernholz.",
      "en": "“Médie” eau de parfum, offered in 100 ml and 15 ml. The scent combines grapefruit, jasmine sambac and cedarwood.",
      "fr": "Eau de parfum « Médie », proposée en 100 ml et 15 ml. Le parfum associe pamplemousse, jasmin sambac et bois de cèdre.",
      "it": "Eau de parfum “Médie”, disponibile da 100 ml e 15 ml. Il profumo unisce pompelmo, gelsomino sambac e legno di cedro."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Grapefruit, Mandarinengrün",
        "en": "Top notes: Grapefruit, Green mandarin",
        "fr": "Notes de tête : Pamplemousse, Mandarine verte",
        "it": "Note di testa: Pompelmo, Mandarino verde"
      },
      {
        "de": "Herznoten: Zypresse, Jasmin Sambac",
        "en": "Heart notes: Cypress, Jasmine sambac",
        "fr": "Notes de cœur : Cyprès, Jasmin sambac",
        "it": "Note di cuore: Cipresso, Gelsomino sambac"
      },
      {
        "de": "Basisnoten: Vetiver, Texanisches Zedernholz",
        "en": "Base notes: Vetiver, Texas cedarwood",
        "fr": "Notes de fond : Vétiver, Bois de cèdre du Texas",
        "it": "Note di fondo: Vetiver, Legno di cedro del Texas"
      },
      {
        "de": "Eau de Parfum · 100 ml · 15 ml",
        "en": "Eau de parfum · 100 ml · 15 ml",
        "fr": "Eau de parfum · 100 ml · 15 ml",
        "it": "Eau de parfum · 100 ml · 15 ml"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-medie-parfum-1.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon Médie – Flakon 100 ml, Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Médie – 100 ml bottle, product view on a light background",
          "fr": "Cire Trudon Médie – flacon de 100 ml, vue du produit sur fond clair",
          "it": "Cire Trudon Médie – flacone da 100 ml, vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/p/a/parfums_100ml_m_die_1200x1200_beige.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-medie-parfum-2-opt.webp",
        "width": 640,
        "height": 800,
        "alt": {
          "de": "Cire Trudon Médie – Flakon 15 ml mit Etui, Produktansicht",
          "en": "Cire Trudon Médie – 15 ml bottle with case, product view",
          "fr": "Cire Trudon Médie – flacon de 15 ml avec étui, vue du produit",
          "it": "Cire Trudon Médie – flacone da 15 ml con astuccio, vista del prodotto"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/p/a/parfums_15ml_m_die_pack_1200x1200_beige.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-medie-parfum-3.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon Médie – Stimmungsbild des Herstellers, der Flakon in Szene gesetzt",
          "en": "Cire Trudon Médie – mood image by the maker, the bottle styled in a scene",
          "fr": "Cire Trudon Médie – image d’ambiance du fabricant, le flacon mis en scène",
          "it": "Cire Trudon Médie – immagine d’ambiente del produttore, il flacone messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_-_m_die_eau_de_parfum_1600x1600.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/medie-perfume-100ml.html",
    "quellen": [
      "https://trudon.com/eu_de/medie-perfume-100ml.html",
      "https://trudon.com/eu_de/gloriakameeprobe.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-your-trio-of-perfumes",
      "cire-trudon-eaux-de-parfum-gift-set-medie-vixi-absolu",
      "cire-trudon-eaux-de-parfum-gift-set-medie-aphelie-deux"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": "100 ml",
          "betrag": 210,
          "sku": "P/EP/100/MED",
          "inhaltMl": 100,
          "zerbrechlich": true
        },
        {
          "name": "15 ml",
          "betrag": 42,
          "sku": "P/EP/015/MED",
          "inhaltMl": 15,
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/medie-perfume-100ml.html"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Fassungsvermögen",
          "en": "Capacity",
          "fr": "Contenance",
          "it": "Capacità"
        },
        "optionen": [
          {
            "id": "100-ml",
            "name": "100 ml",
            "code": "P/EP/100/MED",
            "betrag": 210,
            "standard": true,
            "bilder": [
              "/Images/Wellness/produkte/cire-trudon/cire-trudon-medie-parfum-1.webp"
            ]
          },
          {
            "id": "15-ml",
            "name": "15 ml",
            "code": "P/EP/015/MED",
            "betrag": 42,
            "bilder": [
              "/Images/Wellness/produkte/cire-trudon/cire-trudon-medie-parfum-2-opt.webp"
            ]
          }
        ]
      }
    ]
  },
  {
    "slug": "cire-trudon-mortel-parfum",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "parfum",
    "name": "Mortel",
    "kurz": {
      "de": "Eau de Parfum „Mortel“, im Shop mit 100 ml und 15 ml. Der Duft verbindet schwarzem Pfeffer, Weihrauch und Myrrhe.",
      "en": "“Mortel” eau de parfum, offered in 100 ml and 15 ml. The scent combines black pepper, frankincense and myrrh.",
      "fr": "Eau de parfum « Mortel », proposée en 100 ml et 15 ml. Le parfum associe poivre noir, encens et myrrhe.",
      "it": "Eau de parfum “Mortel”, disponibile da 100 ml e 15 ml. Il profumo unisce pepe nero, incenso e mirra."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Piment, Schwarzer Pfeffer",
        "en": "Top notes: Allspice, Black pepper",
        "fr": "Notes de tête : Piment, Poivre noir",
        "it": "Note di testa: Pimento, Pepe nero"
      },
      {
        "de": "Herznoten: Weihrauch",
        "en": "Heart notes: Frankincense",
        "fr": "Notes de cœur : Encens",
        "it": "Note di cuore: Incenso"
      },
      {
        "de": "Basisnoten: Benzoe, Zistrose, Myrrhe",
        "en": "Base notes: Benzoin, Cistus, Myrrh",
        "fr": "Notes de fond : Benjoin, Ciste, Myrrhe",
        "it": "Note di fondo: Benzoino, Cisto, Mirra"
      },
      {
        "de": "Eau de Parfum · 100 ml · 15 ml",
        "en": "Eau de parfum · 100 ml · 15 ml",
        "fr": "Eau de parfum · 100 ml · 15 ml",
        "it": "Eau de parfum · 100 ml · 15 ml"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-mortel-parfum-1.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon Mortel – Flakon 100 ml, Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Mortel – 100 ml bottle, product view on a light background",
          "fr": "Cire Trudon Mortel – flacon de 100 ml, vue du produit sur fond clair",
          "it": "Cire Trudon Mortel – flacone da 100 ml, vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/p/a/parfums_100ml_mortel_1200x1200_beige.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-mortel-parfum-2-opt.webp",
        "width": 640,
        "height": 800,
        "alt": {
          "de": "Cire Trudon Mortel – Flakon 15 ml mit Etui, Produktansicht",
          "en": "Cire Trudon Mortel – 15 ml bottle with case, product view",
          "fr": "Cire Trudon Mortel – flacon de 15 ml avec étui, vue du produit",
          "it": "Cire Trudon Mortel – flacone da 15 ml con astuccio, vista del prodotto"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/p/a/parfums_15ml_mortel_pack_1200x1200_beige.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-mortel-parfum-3.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon Mortel – Stimmungsbild des Herstellers, der Flakon in Szene gesetzt",
          "en": "Cire Trudon Mortel – mood image by the maker, the bottle styled in a scene",
          "fr": "Cire Trudon Mortel – image d’ambiance du fabricant, le flacon mis en scène",
          "it": "Cire Trudon Mortel – immagine d’ambiente del produttore, il flacone messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/p/a/parfums_100ml_mortel_1200x1200_in-situ_002_.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/mortel-parfum-100ml.html",
    "quellen": [
      "https://trudon.com/eu_de/mortel-parfum-100ml.html",
      "https://trudon.com/eu_de/mortel-eau-de-parfum-15ml.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-mortel-noir-parfum",
      "cire-trudon-your-trio-of-perfumes"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": "100 ml",
          "betrag": 210,
          "sku": "P/EP/100/MOR",
          "inhaltMl": 100,
          "zerbrechlich": true
        },
        {
          "name": "15 ml",
          "betrag": 42,
          "sku": "P/EP/015/MOR",
          "inhaltMl": 15,
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/mortel-parfum-100ml.html"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Fassungsvermögen",
          "en": "Capacity",
          "fr": "Contenance",
          "it": "Capacità"
        },
        "optionen": [
          {
            "id": "100-ml",
            "name": "100 ml",
            "code": "P/EP/100/MOR",
            "betrag": 210,
            "standard": true,
            "bilder": [
              "/Images/Wellness/produkte/cire-trudon/cire-trudon-mortel-parfum-1.webp"
            ]
          },
          {
            "id": "15-ml",
            "name": "15 ml",
            "code": "P/EP/015/MOR",
            "betrag": 42,
            "bilder": [
              "/Images/Wellness/produkte/cire-trudon/cire-trudon-mortel-parfum-2-opt.webp"
            ]
          }
        ]
      }
    ]
  },
  {
    "slug": "cire-trudon-mortel-noir-parfum",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "parfum",
    "name": "Mortel Noir",
    "kurz": {
      "de": "Parfum „Mortel Noir“ im Flakon, im Shop mit 100 ml und 15 ml. Der Duft verbindet schwarzem Pfeffer aus Madagaskar, Weihrauch aus Somalia und Benzoe. Laut Hersteller auf Basis von Mortel, mit 27 % Konzentration und im schwarz lackierten Flakon.",
      "en": "“Mortel Noir” parfum in a bottle, offered in 100 ml and 15 ml. The scent combines Madagascan black pepper, Somali frankincense and benzoin. According to the maker, based on Mortel, with a 27 % concentration and in a black lacquered bottle.",
      "fr": "Parfum « Mortel Noir » en flacon, proposé en 100 ml et 15 ml. Le parfum associe poivre noir de Madagascar, encens de Somalie et benjoin. Selon le fabricant, basé sur Mortel, concentré à 27 % et présenté dans un flacon laqué noir.",
      "it": "Profumo “Mortel Noir” in flacone, disponibile da 100 ml e 15 ml. Il profumo unisce pepe nero del Madagascar, incenso somalo e benzoino. Secondo il produttore, basato su Mortel, con una concentrazione del 27 % e in un flacone laccato nero."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Schwarzer Pfeffer aus Madagaskar, Muskatnuss",
        "en": "Top notes: Madagascan black pepper, Nutmeg",
        "fr": "Notes de tête : Poivre noir de Madagascar, Noix de muscade",
        "it": "Note di testa: Pepe nero del Madagascar, Noce moscata"
      },
      {
        "de": "Herznoten: Weihrauch",
        "en": "Heart notes: Frankincense",
        "fr": "Notes de cœur : Encens",
        "it": "Note di cuore: Incenso"
      },
      {
        "de": "Basisnoten: Benzoe, Zistrose, Myrrhe",
        "en": "Base notes: Benzoin, Cistus, Myrrh",
        "fr": "Notes de fond : Benjoin, Ciste, Myrrhe",
        "it": "Note di fondo: Benzoino, Cisto, Mirra"
      },
      {
        "de": "Konzentration 27 %",
        "en": "Concentration 27 %",
        "fr": "Concentration 27 %",
        "it": "Concentrazione 27 %"
      },
      {
        "de": "Parfum · 100 ml · 15 ml",
        "en": "Parfum · 100 ml · 15 ml",
        "fr": "Parfum · 100 ml · 15 ml",
        "it": "Parfum · 100 ml · 15 ml"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-mortel-noir-parfum-1-opt.webp",
        "width": 763,
        "height": 954,
        "alt": {
          "de": "Cire Trudon Mortel Noir – Flakon 100 ml, Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Mortel Noir – 100 ml bottle, product view on a light background",
          "fr": "Cire Trudon Mortel Noir – flacon de 100 ml, vue du produit sur fond clair",
          "it": "Cire Trudon Mortel Noir – flacone da 100 ml, vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/p/a/parfums_100ml_mortel_noir_1200x1200_beige.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-mortel-noir-parfum-2-opt.webp",
        "width": 640,
        "height": 800,
        "alt": {
          "de": "Cire Trudon Mortel Noir – Flakon 15 ml mit Etui, Produktansicht",
          "en": "Cire Trudon Mortel Noir – 15 ml bottle with case, product view",
          "fr": "Cire Trudon Mortel Noir – flacon de 15 ml avec étui, vue du produit",
          "it": "Cire Trudon Mortel Noir – flacone da 15 ml con astuccio, vista del prodotto"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/p/a/parfums_15ml_mortel_noir_pack_1200x1200_beige.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-mortel-noir-parfum-3.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon Mortel Noir – Stimmungsbild des Herstellers, der Flakon in Szene gesetzt",
          "en": "Cire Trudon Mortel Noir – mood image by the maker, the bottle styled in a scene",
          "fr": "Cire Trudon Mortel Noir – image d’ambiance du fabricant, le flacon mis en scène",
          "it": "Cire Trudon Mortel Noir – immagine d’ambiente del produttore, il flacone messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/l/i/lifestyle.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/mortel-noir-parfum-100ml.html",
    "quellen": [
      "https://trudon.com/eu_de/mortel-noir-parfum-100ml.html",
      "https://trudon.com/eu_de/mortel-noir-parfum-15ml.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-mortel-parfum"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": "100 ml",
          "betrag": 250,
          "sku": "P/EP/100/MON",
          "inhaltMl": 100,
          "zerbrechlich": true
        },
        {
          "name": "15 ml",
          "betrag": 50,
          "sku": "P/EP/015/MON",
          "inhaltMl": 15,
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/mortel-noir-parfum-100ml.html"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Fassungsvermögen",
          "en": "Capacity",
          "fr": "Contenance",
          "it": "Capacità"
        },
        "optionen": [
          {
            "id": "100-ml",
            "name": "100 ml",
            "code": "P/EP/100/MON",
            "betrag": 250,
            "standard": true,
            "bilder": [
              "/Images/Wellness/produkte/cire-trudon/cire-trudon-mortel-noir-parfum-1-opt.webp"
            ]
          },
          {
            "id": "15-ml",
            "name": "15 ml",
            "code": "P/EP/015/MON",
            "betrag": 50,
            "bilder": [
              "/Images/Wellness/produkte/cire-trudon/cire-trudon-mortel-noir-parfum-2-opt.webp"
            ]
          }
        ]
      }
    ]
  },
  {
    "slug": "cire-trudon-revolution-parfum",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "parfum",
    "name": "Révolution",
    "kurz": {
      "de": "Eau de Parfum „Révolution“, im Shop mit 100 ml und 15 ml. Der Duft verbindet Elemi, Angelika und Cade.",
      "en": "“Révolution” eau de parfum, offered in 100 ml and 15 ml. The scent combines elemi, angelica and cade.",
      "fr": "Eau de parfum « Révolution », proposée en 100 ml et 15 ml. Le parfum associe élémi, angélique et cade.",
      "it": "Eau de parfum “Révolution”, disponibile da 100 ml e 15 ml. Il profumo unisce elemi, angelica e cade."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Elemi",
        "en": "Top notes: Elemi",
        "fr": "Notes de tête : Élémi",
        "it": "Note di testa: Elemi"
      },
      {
        "de": "Herznoten: Angelika",
        "en": "Heart notes: Angelica",
        "fr": "Notes de cœur : Angélique",
        "it": "Note di cuore: Angelica"
      },
      {
        "de": "Basisnoten: Cade, Zedernholz, Papyrus",
        "en": "Base notes: Cade, Cedarwood, Papyrus",
        "fr": "Notes de fond : Cade, Bois de cèdre, Papyrus",
        "it": "Note di fondo: Cade, Legno di cedro, Papiro"
      },
      {
        "de": "Eau de Parfum · 100 ml · 15 ml",
        "en": "Eau de parfum · 100 ml · 15 ml",
        "fr": "Eau de parfum · 100 ml · 15 ml",
        "it": "Eau de parfum · 100 ml · 15 ml"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-revolution-parfum-1.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon Révolution – Flakon 100 ml, Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Révolution – 100 ml bottle, product view on a light background",
          "fr": "Cire Trudon Révolution – flacon de 100 ml, vue du produit sur fond clair",
          "it": "Cire Trudon Révolution – flacone da 100 ml, vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/p/a/parfums_100ml_r_volution_1200x1200_beige.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-revolution-parfum-2-opt.webp",
        "width": 640,
        "height": 800,
        "alt": {
          "de": "Cire Trudon Révolution – Flakon 15 ml mit Etui, Produktansicht",
          "en": "Cire Trudon Révolution – 15 ml bottle with case, product view",
          "fr": "Cire Trudon Révolution – flacon de 15 ml avec étui, vue du produit",
          "it": "Cire Trudon Révolution – flacone da 15 ml con astuccio, vista del prodotto"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/p/a/parfums_15ml_r_volution_pack_1200x1200_beige.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-revolution-parfum-3.webp",
        "width": 1600,
        "height": 1600,
        "alt": {
          "de": "Cire Trudon Révolution – Stimmungsbild des Herstellers, der Flakon in Szene gesetzt",
          "en": "Cire Trudon Révolution – mood image by the maker, the bottle styled in a scene",
          "fr": "Cire Trudon Révolution – image d’ambiance du fabricant, le flacon mis en scène",
          "it": "Cire Trudon Révolution – immagine d’ambiente del produttore, il flacone messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_-_r_volution_eau_de_parfum_-1x1.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/revolution-eau-de-parfum-100ml.html",
    "quellen": [
      "https://trudon.com/eu_de/revolution-eau-de-parfum-100ml.html",
      "https://trudon.com/eu_de/revolution-eau-de-parfum-15ml.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-your-trio-of-perfumes"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": "100 ml",
          "betrag": 210,
          "sku": "P/EP/100/REV",
          "inhaltMl": 100,
          "zerbrechlich": true
        },
        {
          "name": "15 ml",
          "betrag": 42,
          "sku": "P/EP/015/REV",
          "inhaltMl": 15,
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/revolution-eau-de-parfum-100ml.html"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Fassungsvermögen",
          "en": "Capacity",
          "fr": "Contenance",
          "it": "Capacità"
        },
        "optionen": [
          {
            "id": "100-ml",
            "name": "100 ml",
            "code": "P/EP/100/REV",
            "betrag": 210,
            "standard": true,
            "bilder": [
              "/Images/Wellness/produkte/cire-trudon/cire-trudon-revolution-parfum-1.webp"
            ]
          },
          {
            "id": "15-ml",
            "name": "15 ml",
            "code": "P/EP/015/REV",
            "betrag": 42,
            "bilder": [
              "/Images/Wellness/produkte/cire-trudon/cire-trudon-revolution-parfum-2-opt.webp"
            ]
          }
        ]
      }
    ]
  },
  {
    "slug": "cire-trudon-vixi-parfum",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "parfum",
    "name": "Vixi",
    "kurz": {
      "de": "Eau de Parfum „Vixi“, im Shop mit 100 ml und 15 ml. Der Duft verbindet Petitgrain, Salbei und Bio-Sandelholz.",
      "en": "“Vixi” eau de parfum, offered in 100 ml and 15 ml. The scent combines petitgrain, sage and organic sandalwood.",
      "fr": "Eau de parfum « Vixi », proposée en 100 ml et 15 ml. Le parfum associe petit grain, sauge et bois de santal biologique.",
      "it": "Eau de parfum “Vixi”, disponibile da 100 ml e 15 ml. Il profumo unisce petitgrain, salvia e legno di sandalo biologico."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Petitgrain-Essenz aus Italien, Kardamom-Essenz",
        "en": "Top notes: Italian petitgrain essence, Cardamom essence",
        "fr": "Notes de tête : Essence de petit grain d’Italie, Essence de cardamome",
        "it": "Note di testa: Essenza di petitgrain italiano, Essenza di cardamomo"
      },
      {
        "de": "Herznoten: Balkan-Salbei-Essenz, Bio-Sandelholz aus Nepal",
        "en": "Heart notes: Balkan sage essence, Organic Nepalese sandalwood",
        "fr": "Notes de cœur : Essence de sauge des Balkans, Bois de santal biologique du Népal",
        "it": "Note di cuore: Essenza di salvia dei Balcani, Legno di sandalo biologico del Nepal"
      },
      {
        "de": "Basisnoten: Virginia-Zeder, Indischer Jasmin",
        "en": "Base notes: Virginia cedar, Indian jasmine",
        "fr": "Notes de fond : Cèdre de Virginie, Jasmin d’Inde",
        "it": "Note di fondo: Cedro della Virginia, Gelsomino indiano"
      },
      {
        "de": "Eau de Parfum · 100 ml · 15 ml",
        "en": "Eau de parfum · 100 ml · 15 ml",
        "fr": "Eau de parfum · 100 ml · 15 ml",
        "it": "Eau de parfum · 100 ml · 15 ml"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-vixi-parfum-1.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon Vixi – Flakon 100 ml, Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Vixi – 100 ml bottle, product view on a light background",
          "fr": "Cire Trudon Vixi – flacon de 100 ml, vue du produit sur fond clair",
          "it": "Cire Trudon Vixi – flacone da 100 ml, vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/p/a/parfums_100ml_vixi_1200x1200_beige.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-vixi-parfum-2-opt.webp",
        "width": 640,
        "height": 800,
        "alt": {
          "de": "Cire Trudon Vixi – Flakon 15 ml mit Etui, Produktansicht",
          "en": "Cire Trudon Vixi – 15 ml bottle with case, product view",
          "fr": "Cire Trudon Vixi – flacon de 15 ml avec étui, vue du produit",
          "it": "Cire Trudon Vixi – flacone da 15 ml con astuccio, vista del prodotto"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/v/i/vixi_15-ml_pack_gris_1200x1200.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-vixi-parfum-3.webp",
        "width": 518,
        "height": 648,
        "alt": {
          "de": "Cire Trudon Vixi – Stimmungsbild des Herstellers, der Flakon in Szene gesetzt",
          "en": "Cire Trudon Vixi – mood image by the maker, the bottle styled in a scene",
          "fr": "Cire Trudon Vixi – image d’ambiance du fabricant, le flacon mis en scène",
          "it": "Cire Trudon Vixi – immagine d’ambiente del produttore, il flacone messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_-_vixi_-_clovis_retiff_1.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/vixi-eau-de-parfum-100ml.html",
    "quellen": [
      "https://trudon.com/eu_de/vixi-eau-de-parfum-100ml.html",
      "https://trudon.com/eu_de/vixi-eau-de-parfum-15ml.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-your-trio-of-perfumes",
      "cire-trudon-eaux-de-parfum-gift-set-medie-vixi-absolu"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": "100 ml",
          "betrag": 210,
          "sku": "P/EP/100/VIX",
          "inhaltMl": 100,
          "zerbrechlich": true
        },
        {
          "name": "15 ml",
          "betrag": 42,
          "sku": "P/EP/015/VIX",
          "inhaltMl": 15,
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/vixi-eau-de-parfum-100ml.html"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Fassungsvermögen",
          "en": "Capacity",
          "fr": "Contenance",
          "it": "Capacità"
        },
        "optionen": [
          {
            "id": "100-ml",
            "name": "100 ml",
            "code": "P/EP/100/VIX",
            "betrag": 210,
            "standard": true,
            "bilder": [
              "/Images/Wellness/produkte/cire-trudon/cire-trudon-vixi-parfum-1.webp"
            ]
          },
          {
            "id": "15-ml",
            "name": "15 ml",
            "code": "P/EP/015/VIX",
            "betrag": 42,
            "bilder": [
              "/Images/Wellness/produkte/cire-trudon/cire-trudon-vixi-parfum-2-opt.webp"
            ]
          }
        ]
      }
    ]
  },
  {
    "slug": "cire-trudon-45-degres-parfum",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "parfum",
    "name": "45°",
    "serie": "Nuit Rouge",
    "kurz": {
      "de": "Eau de Parfum „45°“ aus der Kollektion Nuit Rouge, im Shop mit 100 ml und 15 ml. Der Duft verbindet Honigakkord, Vanille-Absolue und Benzoe.",
      "en": "“45°” eau de parfum from the Nuit Rouge collection, offered in 100 ml and 15 ml. The scent combines honey accord, vanilla absolute and benzoin.",
      "fr": "Eau de parfum « 45° » de la collection Nuit Rouge, proposée en 100 ml et 15 ml. Le parfum associe accord miel, absolu de vanille et benjoin.",
      "it": "Eau de parfum “45°” della collezione Nuit Rouge, disponibile da 100 ml e 15 ml. Il profumo unisce accordo di miele, assoluta di vaniglia e benzoino."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Bergamotte, Honigakkord",
        "en": "Top notes: Bergamot, Honey accord",
        "fr": "Notes de tête : Bergamote, Accord miel",
        "it": "Note di testa: Bergamotto, Accordo di miele"
      },
      {
        "de": "Herznoten: Vanille-Absolue, Georgywood, Madagaskar-Vanille CO2",
        "en": "Heart notes: Vanilla absolute, Georgywood, Madagascar vanilla CO2",
        "fr": "Notes de cœur : Absolu de vanille, Georgywood, Vanille de Madagascar CO2",
        "it": "Note di cuore: Assoluta di vaniglia, Georgywood, Vaniglia del Madagascar CO2"
      },
      {
        "de": "Basisnoten: Benzoe, Natürliches Vanillin",
        "en": "Base notes: Benzoin, Natural vanillin",
        "fr": "Notes de fond : Benjoin, Vanilline naturelle",
        "it": "Note di fondo: Benzoino, Vanillina naturale"
      },
      {
        "de": "Eau de Parfum · 100 ml · 15 ml",
        "en": "Eau de parfum · 100 ml · 15 ml",
        "fr": "Eau de parfum · 100 ml · 15 ml",
        "it": "Eau de parfum · 100 ml · 15 ml"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-45-degres-parfum-1-opt.webp",
        "width": 758,
        "height": 948,
        "alt": {
          "de": "Cire Trudon 45° – Flakon 100 ml, Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon 45° – 100 ml bottle, product view on a light background",
          "fr": "Cire Trudon 45° – flacon de 100 ml, vue du produit sur fond clair",
          "it": "Cire Trudon 45° – flacone da 100 ml, vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/p/a/parfums_100ml_45__1200x1200_beige.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-45-degres-parfum-2-opt.webp",
        "width": 640,
        "height": 800,
        "alt": {
          "de": "Cire Trudon 45° – Flakon 15 ml mit Etui, Produktansicht",
          "en": "Cire Trudon 45° – 15 ml bottle with case, product view",
          "fr": "Cire Trudon 45° – flacon de 15 ml avec étui, vue du produit",
          "it": "Cire Trudon 45° – flacone da 15 ml con astuccio, vista del prodotto"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/p/a/parfums_15ml_45__pack_1200x1200_beige.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-45-degres-parfum-3.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon 45° – Stimmungsbild des Herstellers, der Flakon in Szene gesetzt",
          "en": "Cire Trudon 45° – mood image by the maker, the bottle styled in a scene",
          "fr": "Cire Trudon 45° – image d’ambiance du fabricant, le flacon mis en scène",
          "it": "Cire Trudon 45° – immagine d’ambiente del produttore, il flacone messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_sm2026_spring_summer_04_4x5_hd_1.jpg",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/nuit-rouge-45-degres-parfum-100ml.html",
    "quellen": [
      "https://trudon.com/eu_de/nuit-rouge-45-degres-parfum-100ml.html",
      "https://trudon.com/eu_de/nuit-rouge-45-degres-parfum-15ml.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-nuit-rouge-set"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": "100 ml",
          "betrag": 250,
          "sku": "P/EP/100/NR/45D",
          "inhaltMl": 100,
          "zerbrechlich": true
        },
        {
          "name": "15 ml",
          "betrag": 50,
          "sku": "P/EP/015/NR/45D",
          "inhaltMl": 15,
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/nuit-rouge-45-degres-parfum-100ml.html"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Fassungsvermögen",
          "en": "Capacity",
          "fr": "Contenance",
          "it": "Capacità"
        },
        "optionen": [
          {
            "id": "100-ml",
            "name": "100 ml",
            "code": "P/EP/100/NR/45D",
            "betrag": 250,
            "standard": true,
            "bilder": [
              "/Images/Wellness/produkte/cire-trudon/cire-trudon-45-degres-parfum-1-opt.webp"
            ]
          },
          {
            "id": "15-ml",
            "name": "15 ml",
            "code": "P/EP/015/NR/45D",
            "betrag": 50,
            "bilder": [
              "/Images/Wellness/produkte/cire-trudon/cire-trudon-45-degres-parfum-2-opt.webp"
            ]
          }
        ]
      }
    ]
  },
  {
    "slug": "cire-trudon-midnight-omen-parfum",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "parfum",
    "name": "Midnight Omen",
    "serie": "Nuit Rouge",
    "kurz": {
      "de": "Eau de Parfum „Midnight Omen“ aus der Kollektion Nuit Rouge, im Shop mit 100 ml und 15 ml. Der Duft verbindet Mandarine, Veilchen und Amberhölzern.",
      "en": "“Midnight Omen” eau de parfum from the Nuit Rouge collection, offered in 100 ml and 15 ml. The scent combines mandarin, violet and amber woods.",
      "fr": "Eau de parfum « Midnight Omen » de la collection Nuit Rouge, proposée en 100 ml et 15 ml. Le parfum associe mandarine, violette et bois ambrés.",
      "it": "Eau de parfum “Midnight Omen” della collezione Nuit Rouge, disponibile da 100 ml e 15 ml. Il profumo unisce mandarino, violetta e legni ambrati."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Iris, Mandarine, Pfingstrose, Safran",
        "en": "Top notes: Iris, Mandarin, Peony, Saffron",
        "fr": "Notes de tête : Iris, Mandarine, Pivoine, Safran",
        "it": "Note di testa: Iris, Mandarino, Peonia, Zafferano"
      },
      {
        "de": "Herznoten: Leder, Sandelholz, Veilchen, Cashmeran",
        "en": "Heart notes: Leather, Sandalwood, Violet, Cashmeran",
        "fr": "Notes de cœur : Cuir, Bois de santal, Violette, Cashmeran",
        "it": "Note di cuore: Cuoio, Legno di sandalo, Violetta, Cashmeran"
      },
      {
        "de": "Basisnoten: Moos, Moschus, Patschuli",
        "en": "Base notes: Moss, Musk, Patchouli",
        "fr": "Notes de fond : Mousse, Musc, Patchouli",
        "it": "Note di fondo: Muschio, Muschio bianco, Patchouli"
      },
      {
        "de": "Eau de Parfum · 100 ml · 15 ml",
        "en": "Eau de parfum · 100 ml · 15 ml",
        "fr": "Eau de parfum · 100 ml · 15 ml",
        "it": "Eau de parfum · 100 ml · 15 ml"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-midnight-omen-parfum-1-opt.webp",
        "width": 759,
        "height": 949,
        "alt": {
          "de": "Cire Trudon Midnight Omen – Flakon 100 ml, Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Midnight Omen – 100 ml bottle, product view on a light background",
          "fr": "Cire Trudon Midnight Omen – flacon de 100 ml, vue du produit sur fond clair",
          "it": "Cire Trudon Midnight Omen – flacone da 100 ml, vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/p/a/parfums_100ml_midnight_omen_1200x1200_beige.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-midnight-omen-parfum-2-opt.webp",
        "width": 640,
        "height": 800,
        "alt": {
          "de": "Cire Trudon Midnight Omen – Flakon 15 ml mit Etui, Produktansicht",
          "en": "Cire Trudon Midnight Omen – 15 ml bottle with case, product view",
          "fr": "Cire Trudon Midnight Omen – flacon de 15 ml avec étui, vue du produit",
          "it": "Cire Trudon Midnight Omen – flacone da 15 ml con astuccio, vista del prodotto"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/p/a/parfums_15ml_midnight_omen_pack_1200x1200_beige.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-midnight-omen-parfum-3.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon Midnight Omen – Stimmungsbild des Herstellers, der Flakon in Szene gesetzt",
          "en": "Cire Trudon Midnight Omen – mood image by the maker, the bottle styled in a scene",
          "fr": "Cire Trudon Midnight Omen – image d’ambiance du fabricant, le flacon mis en scène",
          "it": "Cire Trudon Midnight Omen – immagine d’ambiente del produttore, il flacone messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_midnightomen_2025_05_13_nic_01_1200x1200.png",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/nuit-rouge-midnight-omen-parfum-100ml.html",
    "quellen": [
      "https://trudon.com/eu_de/nuit-rouge-midnight-omen-parfum-100ml.html",
      "https://trudon.com/eu_de/nuit-rouge-midnight-omen-parfum-15ml.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-nuit-rouge-set"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": "100 ml",
          "betrag": 250,
          "sku": "P/EP/100/NR/MID",
          "inhaltMl": 100,
          "zerbrechlich": true
        },
        {
          "name": "15 ml",
          "betrag": 50,
          "sku": "P/EP/015/NR/MID",
          "inhaltMl": 15,
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/nuit-rouge-midnight-omen-parfum-100ml.html"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Fassungsvermögen",
          "en": "Capacity",
          "fr": "Contenance",
          "it": "Capacità"
        },
        "optionen": [
          {
            "id": "100-ml",
            "name": "100 ml",
            "code": "P/EP/100/NR/MID",
            "betrag": 250,
            "standard": true,
            "bilder": [
              "/Images/Wellness/produkte/cire-trudon/cire-trudon-midnight-omen-parfum-1-opt.webp"
            ]
          },
          {
            "id": "15-ml",
            "name": "15 ml",
            "code": "P/EP/015/NR/MID",
            "betrag": 50,
            "bilder": [
              "/Images/Wellness/produkte/cire-trudon/cire-trudon-midnight-omen-parfum-2-opt.webp"
            ]
          }
        ]
      }
    ]
  },
  {
    "slug": "cire-trudon-mystique-parfum",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "parfum",
    "name": "Mystique",
    "serie": "Nuit Rouge",
    "kurz": {
      "de": "Eau de Parfum „Mystique“ aus der Kollektion Nuit Rouge, im Shop mit 100 ml und 15 ml. Der Duft verbindet Leder, Oud und Papyrus.",
      "en": "“Mystique” eau de parfum from the Nuit Rouge collection, offered in 100 ml and 15 ml. The scent combines leather, oud and papyrus.",
      "fr": "Eau de parfum « Mystique » de la collection Nuit Rouge, proposée en 100 ml et 15 ml. Le parfum associe cuir, oud et papyrus.",
      "it": "Eau de parfum “Mystique” della collezione Nuit Rouge, disponibile da 100 ml e 15 ml. Il profumo unisce cuoio, oud e papiro."
    },
    "merkmale": [
      {
        "de": "Kopfnoten: Zedernholz, Leder, Safran",
        "en": "Top notes: Cedarwood, Leather, Saffron",
        "fr": "Notes de tête : Bois de cèdre, Cuir, Safran",
        "it": "Note di testa: Legno di cedro, Cuoio, Zafferano"
      },
      {
        "de": "Herznoten: Papyrus, Sandelholz, Oud",
        "en": "Heart notes: Papyrus, Sandalwood, Oud",
        "fr": "Notes de cœur : Papyrus, Bois de santal, Oud",
        "it": "Note di cuore: Papiro, Legno di sandalo, Oud"
      },
      {
        "de": "Basisnoten: Amber, Patschuli, Ebenholz",
        "en": "Base notes: Amber, Patchouli, Ebony",
        "fr": "Notes de fond : Ambre, Patchouli, Ébène",
        "it": "Note di fondo: Ambra, Patchouli, Ebano"
      },
      {
        "de": "Eau de Parfum · 100 ml · 15 ml",
        "en": "Eau de parfum · 100 ml · 15 ml",
        "fr": "Eau de parfum · 100 ml · 15 ml",
        "it": "Eau de parfum · 100 ml · 15 ml"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-mystique-parfum-1-opt.webp",
        "width": 760,
        "height": 950,
        "alt": {
          "de": "Cire Trudon Mystique – Flakon 100 ml, Produktansicht auf hellem Hintergrund",
          "en": "Cire Trudon Mystique – 100 ml bottle, product view on a light background",
          "fr": "Cire Trudon Mystique – flacon de 100 ml, vue du produit sur fond clair",
          "it": "Cire Trudon Mystique – flacone da 100 ml, vista del prodotto su sfondo chiaro"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/p/a/parfums_100ml_mystique_1200x1200_beige.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-mystique-parfum-2-opt.webp",
        "width": 640,
        "height": 800,
        "alt": {
          "de": "Cire Trudon Mystique – Flakon 15 ml mit Etui, Produktansicht",
          "en": "Cire Trudon Mystique – 15 ml bottle with case, product view",
          "fr": "Cire Trudon Mystique – flacon de 15 ml avec étui, vue du produit",
          "it": "Cire Trudon Mystique – flacone da 15 ml con astuccio, vista del prodotto"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/p/a/parfums_15ml_mystique_pack_1200x1200_beige.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-mystique-parfum-3.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon Mystique – Stimmungsbild des Herstellers, der Flakon in Szene gesetzt",
          "en": "Cire Trudon Mystique – mood image by the maker, the bottle styled in a scene",
          "fr": "Cire Trudon Mystique – image d’ambiance du fabricant, le flacon mis en scène",
          "it": "Cire Trudon Mystique – immagine d’ambiente del produttore, il flacone messo in scena"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_mystic_2025_05_13_nic_01_1200x1200.png",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/nuit-rouge-mystique-parfum-100ml.html",
    "quellen": [
      "https://trudon.com/eu_de/nuit-rouge-mystique-parfum-100ml.html",
      "https://trudon.com/eu_de/nuit-rouge-mystique-parfum-15ml.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-nuit-rouge-set"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": "100 ml",
          "betrag": 250,
          "sku": "P/EP/100/NR/MYS",
          "inhaltMl": 100,
          "zerbrechlich": true
        },
        {
          "name": "15 ml",
          "betrag": 50,
          "sku": "P/EP/015/NR/MYS",
          "inhaltMl": 15,
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/nuit-rouge-mystique-parfum-100ml.html"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Fassungsvermögen",
          "en": "Capacity",
          "fr": "Contenance",
          "it": "Capacità"
        },
        "optionen": [
          {
            "id": "100-ml",
            "name": "100 ml",
            "code": "P/EP/100/NR/MYS",
            "betrag": 250,
            "standard": true,
            "bilder": [
              "/Images/Wellness/produkte/cire-trudon/cire-trudon-mystique-parfum-1-opt.webp"
            ]
          },
          {
            "id": "15-ml",
            "name": "15 ml",
            "code": "P/EP/015/NR/MYS",
            "betrag": 50,
            "bilder": [
              "/Images/Wellness/produkte/cire-trudon/cire-trudon-mystique-parfum-2-opt.webp"
            ]
          }
        ]
      }
    ]
  },
  {
    "slug": "cire-trudon-your-trio-of-perfumes",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "geschenkset",
    "name": "Your Trio of Perfumes",
    "kurz": {
      "de": "Geschenkbox mit drei Eaux de Parfum zu je 15 ml, frei wählbar aus zehn Düften (Carmen, Aphélie, Bruma, Deux, Elae, Médie, Mortel, Révolution, Vixi, Absolu).",
      "en": "Gift box with three 15 ml eaux de parfum, chosen freely from ten scents (Carmen, Aphélie, Bruma, Deux, Elae, Médie, Mortel, Révolution, Vixi, Absolu).",
      "fr": "Coffret de trois eaux de parfum de 15 ml, à choisir parmi dix parfums (Carmen, Aphélie, Bruma, Deux, Elae, Médie, Mortel, Révolution, Vixi, Absolu).",
      "it": "Cofanetto con tre eau de parfum da 15 ml, a scelta tra dieci profumi (Carmen, Aphélie, Bruma, Deux, Elae, Médie, Mortel, Révolution, Vixi, Absolu)."
    },
    "merkmale": [
      {
        "de": "3 × 15 ml Eau de Parfum",
        "en": "3 × 15 ml eau de parfum",
        "fr": "3 × 15 ml d’eau de parfum",
        "it": "3 × 15 ml di eau de parfum"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-your-trio-of-perfumes-1-opt.webp",
        "width": 1035,
        "height": 1294,
        "alt": {
          "de": "Cire Trudon Your Trio of Perfumes – Geschenkbox mit drei 15-ml-Flakons, Produktansicht",
          "en": "Cire Trudon Your Trio of Perfumes – gift box with three 15 ml bottles, product view",
          "fr": "Cire Trudon Your Trio of Perfumes – coffret avec trois flacons de 15 ml, vue du produit",
          "it": "Cire Trudon Your Trio of Perfumes – cofanetto con tre flaconi da 15 ml, vista del prodotto"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/p/a/parfum_pack_coffretsx3_acomposer-gif640x640.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-your-trio-of-perfumes-2.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon Your Trio of Perfumes – geöffnete Geschenkbox mit drei Etuis, Produktansicht",
          "en": "Cire Trudon Your Trio of Perfumes – open gift box with three cases, product view",
          "fr": "Cire Trudon Your Trio of Perfumes – coffret ouvert avec trois étuis, vue du produit",
          "it": "Cire Trudon Your Trio of Perfumes – cofanetto aperto con tre astucci, vista del prodotto"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/p/a/parfum_pack_coffretsx3_acomposer640x640.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/coffret-edp-3x15ml.html",
    "quellen": [
      "https://trudon.com/eu_de/coffret-edp-3x15ml.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-carmen-parfum",
      "cire-trudon-aphelie-parfum",
      "cire-trudon-bruma-parfum",
      "cire-trudon-deux-parfum",
      "cire-trudon-elae-parfum",
      "cire-trudon-medie-parfum",
      "cire-trudon-mortel-parfum",
      "cire-trudon-revolution-parfum",
      "cire-trudon-vixi-parfum",
      "cire-trudon-absolu-parfum"
    ],
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/coffret-edp-3x15ml.html",
      "varianten": [
        {
          "name": {
            "de": "3 × 15 ml",
            "en": "3 × 15 ml",
            "fr": "3 × 15 ml",
            "it": "3 × 15 ml"
          },
          "betrag": 119,
          "sku": "P/EP/015X3/ASS",
          "inhaltMl": 45,
          "zerbrechlich": true
        }
      ]
    }
  },
  {
    "slug": "cire-trudon-eaux-de-parfum-gift-set-medie-vixi-absolu",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "geschenkset",
    "name": "Eaux de Parfum Gift Set",
    "kurz": {
      "de": "Geschenkbox mit drei Eaux de Parfum zu je 15 ml: Médie, Vixi und Absolu.",
      "en": "Gift box with three 15 ml eaux de parfum: Médie, Vixi and Absolu.",
      "fr": "Coffret de trois eaux de parfum de 15 ml : Médie, Vixi et Absolu.",
      "it": "Cofanetto con tre eau de parfum da 15 ml: Médie, Vixi e Absolu."
    },
    "merkmale": [
      {
        "de": "3 × 15 ml Eau de Parfum",
        "en": "3 × 15 ml eau de parfum",
        "fr": "3 × 15 ml d’eau de parfum",
        "it": "3 × 15 ml di eau de parfum"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-eaux-de-parfum-gift-set-medie-vixi-absolu-1.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon Eaux de Parfum Gift Set – geöffnete Geschenkbox mit drei 15-ml-Flakons, Produktansicht",
          "en": "Cire Trudon Eaux de Parfum Gift Set – open gift box with three 15 ml bottles, product view",
          "fr": "Cire Trudon Eaux de Parfum Gift Set – coffret ouvert avec trois flacons de 15 ml, vue du produit",
          "it": "Cire Trudon Eaux de Parfum Gift Set – cofanetto aperto con tre flaconi da 15 ml, vista del prodotto"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_coffret_15ml_mem_pack_1200x1200_beige.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/geschenkset-eau-de-parfum-medie-vixi-absolu.html",
    "quellen": [
      "https://trudon.com/eu_de/geschenkset-eau-de-parfum-medie-vixi-absolu.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-medie-parfum",
      "cire-trudon-vixi-parfum",
      "cire-trudon-absolu-parfum"
    ],
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/geschenkset-eau-de-parfum-medie-vixi-absolu.html",
      "varianten": [
        {
          "name": {
            "de": "3 × 15 ml",
            "en": "3 × 15 ml",
            "fr": "3 × 15 ml",
            "it": "3 × 15 ml"
          },
          "betrag": 119,
          "sku": "P/EP/015X3/MVA",
          "inhaltMl": 45,
          "zerbrechlich": true
        }
      ]
    }
  },
  {
    "slug": "cire-trudon-eaux-de-parfum-gift-set-medie-aphelie-deux",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "geschenkset",
    "name": "Eaux de Parfum Gift Set",
    "kurz": {
      "de": "Geschenkbox mit drei Eaux de Parfum zu je 15 ml: Médie, Aphélie und Deux.",
      "en": "Gift box with three 15 ml eaux de parfum: Médie, Aphélie and Deux.",
      "fr": "Coffret de trois eaux de parfum de 15 ml : Médie, Aphélie et Deux.",
      "it": "Cofanetto con tre eau de parfum da 15 ml: Médie, Aphélie e Deux."
    },
    "merkmale": [
      {
        "de": "3 × 15 ml Eau de Parfum",
        "en": "3 × 15 ml eau de parfum",
        "fr": "3 × 15 ml d’eau de parfum",
        "it": "3 × 15 ml di eau de parfum"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-eaux-de-parfum-gift-set-medie-aphelie-deux-1-opt.webp",
        "width": 1280,
        "height": 1600,
        "alt": {
          "de": "Cire Trudon Eaux de Parfum Gift Set – geöffnete Geschenkbox mit drei 15-ml-Flakons, Produktansicht",
          "en": "Cire Trudon Eaux de Parfum Gift Set – open gift box with three 15 ml bottles, product view",
          "fr": "Cire Trudon Eaux de Parfum Gift Set – coffret ouvert avec trois flacons de 15 ml, vue du produit",
          "it": "Cire Trudon Eaux de Parfum Gift Set – cofanetto aperto con tre flaconi da 15 ml, vista del prodotto"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_coffret_15ml_mad_pack_1200x1200_beige.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/geschenkset-eau-de-parfum-medie-vixi-deux.html",
    "quellen": [
      "https://trudon.com/eu_de/geschenkset-eau-de-parfum-medie-vixi-deux.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-medie-parfum",
      "cire-trudon-aphelie-parfum",
      "cire-trudon-deux-parfum"
    ],
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/geschenkset-eau-de-parfum-medie-vixi-deux.html",
      "varianten": [
        {
          "name": {
            "de": "3 × 15 ml",
            "en": "3 × 15 ml",
            "fr": "3 × 15 ml",
            "it": "3 × 15 ml"
          },
          "betrag": 119,
          "sku": "P/EP/015X3/MAD",
          "inhaltMl": 45,
          "zerbrechlich": true
        }
      ]
    }
  },
  {
    "slug": "cire-trudon-nuit-rouge-set",
    "marke": "cire-trudon",
    "bereich": "accessoires",
    "kategorie": "geschenkset",
    "name": "Nuit Rouge Set",
    "serie": "Nuit Rouge",
    "kurz": {
      "de": "Geschenkbox der Kollektion Nuit Rouge mit drei Düften zu je 15 ml: 45°, Midnight Omen und Mystique.",
      "en": "Nuit Rouge collection gift box with three 15 ml scents: 45°, Midnight Omen and Mystique.",
      "fr": "Coffret de la collection Nuit Rouge avec trois parfums de 15 ml : 45°, Midnight Omen et Mystique.",
      "it": "Cofanetto della collezione Nuit Rouge con tre profumi da 15 ml: 45°, Midnight Omen e Mystique."
    },
    "merkmale": [
      {
        "de": "3 × 15 ml Eau de Parfum",
        "en": "3 × 15 ml eau de parfum",
        "fr": "3 × 15 ml d’eau de parfum",
        "it": "3 × 15 ml di eau de parfum"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-nuit-rouge-set-1-opt.webp",
        "width": 795,
        "height": 994,
        "alt": {
          "de": "Cire Trudon Nuit Rouge Set – drei rote 15-ml-Flakons, Produktansicht",
          "en": "Cire Trudon Nuit Rouge Set – three red 15 ml bottles, product view",
          "fr": "Cire Trudon Nuit Rouge Set – trois flacons rouges de 15 ml, vue du produit",
          "it": "Cire Trudon Nuit Rouge Set – tre flaconi rossi da 15 ml, vista del prodotto"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_coffret_15ml_rouge_1200x1200_beige.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/cire-trudon/cire-trudon-nuit-rouge-set-2.webp",
        "width": 1200,
        "height": 1200,
        "alt": {
          "de": "Cire Trudon Nuit Rouge Set – rote Geschenkbox, Produktansicht",
          "en": "Cire Trudon Nuit Rouge Set – red gift box, product view",
          "fr": "Cire Trudon Nuit Rouge Set – coffret rouge, vue du produit",
          "it": "Cire Trudon Nuit Rouge Set – cofanetto rosso, vista del prodotto"
        },
        "quelleUrl": "https://trudon-prod.b-cdn.net/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/t/r/trudon_coffret_15ml_rouge_pack_1200x1200_beige.jpg",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      }
    ],
    "herstellerUrl": "https://trudon.com/eu_de/nuit-rouge-parfum-15ml-geschenkset.html",
    "quellen": [
      "https://trudon.com/eu_de/nuit-rouge-parfum-15ml-geschenkset.html"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "cire-trudon-45-degres-parfum",
      "cire-trudon-midnight-omen-parfum",
      "cire-trudon-mystique-parfum"
    ],
    "preis": {
      "art": "verkaufspreis",
      "stand": "2026-10-31",
      "quelle": "https://trudon.com/eu_de/nuit-rouge-parfum-15ml-geschenkset.html",
      "varianten": [
        {
          "name": {
            "de": "3 × 15 ml",
            "en": "3 × 15 ml",
            "fr": "3 × 15 ml",
            "it": "3 × 15 ml"
          },
          "betrag": 140,
          "sku": "P/EP/015X3/NR/M4M",
          "inhaltMl": 45,
          "zerbrechlich": true
        }
      ]
    }
  }
]);
