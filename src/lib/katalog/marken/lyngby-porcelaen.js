// src/lib/katalog/marken/lyngby-porcelaen.js – Lyngby Porcelæn (Marke der Rosendahl Design Group, Dänemark)
// Inhaber-Entscheidung Nr. 32 (31.10.2026): Sortiment des offiziellen Lyngby-Porcelæn-Shops.
// lyngbyporcelaen.com leitet (301) auf den Markenbereich von rosendahl.com weiter; ein Abruf von
// https://www.rosendahl.com/ aus Österreich führt in den Shop „International“ (en/intl, EUR, Lieferland
// Österreich mit 20 % MwSt.; „All prices on Rosendahl.com are stated in EUR and include VAT“ laut
// https://www.rosendahl.com/en/intl/information/shipping-and-delivery). Einen eigenen AT-Shop gibt es nicht
// (/de/at → /de/de, der DE-Shop liefert nur nach Deutschland).
// Welt "accessoires", bereich "accessoires". Kategorien: vase, geschirr, wohnaccessoire.
//
// Quelle der Produktliste: Commerce-Sitemap des Shops (robots.txt → /en/intl/sitemapindex.xml →
// commerce-sitemap.xml): 286 Artikel-URLs (eine URL je Artikelnummer); DE-Sitemap mit denselben 286 Nummern.
// Erfasst: alle 207 Artikel mit Status „Released“ in den eingebetteten Produktdaten der Seiten, zusammengefasst
// zu 68 Produkten (Serie + Produkttyp; Farben/Größen = Varianten; Glas und Porzellan der Lyngby-Vase
// bzw. des Lyngby-Teelichthalters getrennt, Chapeau Bonbonniere in Glas/Porzellan als Varianten derselben Form).
// 79 Artikel mit Status „Discontinued“ (ausgelaufen, nicht lieferbar bzw. Restposten) sind keine Einträge.
// Vollständigkeits-Check: qa-screenshots/wellness/produkte/vollstaendigkeit-lyngby-porcelaen.md.
//
// Preise: preis.art "verkaufspreis" (Nr. 32) = regulärer Endpreis des Shops (en/intl, EUR, inkl. MwSt.) je
// Artikelnummer, Stand 31.10.2026, quelle = Produktseite der Standard-Variante (alle Variantenseiten in quellen).
// 207 Preis-Varianten. Befristete Outlet-Aktionspreise („Last chance to buy“, gültig bis 31.12.2026) sind
// NICHT übernommen, weil sie vor Ablauf der Preisgültigkeit (3 Monate) enden; betroffen sind 74 Varianten.
// Optionale Variantenfelder: sku = Artikelnummer, inhaltMl = „Volume“ der Produktinformation (nur Tassen, Becher,
// Kannen, Saucieren), zerbrechlich = true (Porzellan, Glas, Fayence). Gewicht/Versandmaße nennt der Shop nicht.
// Farbcodes (farbe) bewusst nicht gesetzt: der Shop liefert nur Farbfamilien-Codes (z. B. Türkis = Blau).
// Designer nur, wenn alle Varianten denselben Designer nennen; „Lyngby“ (Hausentwurf) ist kein Designer.
//
// Bilder: je Produkt Packshot (+ zweite Ansicht als "detail") und ein Stimmungsbild ("ambiente") der Produktseite,
// je Farb-Variante deren Packshot. Gespeichert unverändert die WebP-Fassung, die die Seite selbst im srcset lädt
// (imagebank.rosendahl.com …webp?d=22397/22398/22399 = 750/1080/1920 px), kein Beschnitt, kein Filter; einheitlich ≤ 1600 px lange Kante, WebP q82 (tools/images/optimize-katalog.mjs).
// Datei ist generiert (Skript im Scratchpad des Daten-Teams), Texte sind eigene Sätze aus den Fakten der Seiten.
// Anleitung: qa-screenshots/wellness/produkte/ANLEITUNG-MARKEN.md
// Prüfen:    node --test tests/unit/wellness-produkte.test.mjs

/** Rekursiv einfrieren (Daten unveränderlich). */
const deepFreeze = (o) => {
  if (o && typeof o === "object" && !Object.isFrozen(o)) {
    Object.freeze(o);
    Object.values(o).forEach(deepFreeze);
  }
  return o;
};

/** @type {import("../schema.js").KatalogMarke} */
export const MARKE = deepFreeze({
  slug: "lyngby-porcelaen",
  name: "Lyngby Porcelæn",
  welt: "accessoires",
  herstellerUrl: "https://www.rosendahl.com/en/intl/lyngby-porcelaen",
  // Händlersatz nur über den Claim-Guard (dealerStatement); hier nur der Schalter.
  dealer: true,
  stand: "2026-10-31",
  looks: [
    {
      "id": "lyngby-vase-im-raum",
      "titel": {
        "de": "Lyngby Vase im Wohnraum",
        "en": "Lyngby Vase in the living room",
        "fr": "Vase Lyngby dans le séjour",
        "it": "Vaso Lyngby nel soggiorno"
      },
      "bild": {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-vase-2.webp",
        "width": 1600,
        "height": 1067,
        "alt": {
          "de": "Lyngby Porcelæn Lyngby Vase – Stimmungsbild des Herstellers mit dem Produkt im Raum",
          "en": "Lyngby Porcelæn Lyngby Vase – manufacturer’s lifestyle photo showing the product in a room",
          "fr": "Lyngby Porcelæn Lyngby Vase – photo d’ambiance du fabricant montrant le produit dans une pièce",
          "it": "Lyngby Porcelæn Lyngby Vase – foto d’ambiente del produttore con il prodotto nella stanza"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZdNnh/Lyngby-Porcelaen-Lyngby-Vase-Purple-200734-xZdNnh.webp?d=22399",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      },
      "produkte": [
        "lyngby-porcelaen-lyngby-vase"
      ]
    },
    {
      "id": "lyngby-tura-auf-dem-tisch",
      "titel": {
        "de": "Lyngby Tura auf dem Tisch",
        "en": "Lyngby Tura on the table",
        "fr": "Lyngby Tura sur la table",
        "it": "Lyngby Tura sulla tavola"
      },
      "bild": {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-tura-oval-serving-dish-3.webp",
        "width": 1080,
        "height": 1080,
        "alt": {
          "de": "Lyngby Porcelæn Lyngby Tura Oval serving dish – Stimmungsbild des Herstellers, vom Hersteller als KI-Bild gekennzeichnet: Schalen an der Wand und auf einer Ablage",
          "en": "Lyngby Porcelæn Lyngby Tura Oval serving dish – manufacturer’s lifestyle image, labelled by the manufacturer as AI-generated: dishes on the wall and on a ledge",
          "fr": "Lyngby Porcelæn Lyngby Tura Oval serving dish – image d’ambiance du fabricant, signalée par le fabricant comme générée par IA : plats au mur et sur une tablette",
          "it": "Lyngby Porcelæn Lyngby Tura Oval serving dish – immagine d’ambiente del produttore, indicata dal produttore come generata con IA: piatti alla parete e su una mensola"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/NqimBpTHyZbe/Lyngby-Porcelaen-Lyngby-Tura-Oval-serving-dish-White-201468-NqimBpTHyZbe.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      },
      "produkte": [
        "lyngby-porcelaen-lyngby-tura-oval-serving-dish"
      ]
    },
    {
      "id": "rhombe-earth-gedeckter-tisch",
      "titel": {
        "de": "Rhombe Earth am gedeckten Tisch",
        "en": "Rhombe Earth on a laid table",
        "fr": "Rhombe Earth sur une table dressée",
        "it": "Rhombe Earth su una tavola apparecchiata"
      },
      "bild": {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-earth-dinner-plate-3.webp",
        "width": 1600,
        "height": 1067,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Earth Dinner plate – Stimmungsbild des Herstellers mit dem Produkt im Raum",
          "en": "Lyngby Porcelæn Rhombe Earth Dinner plate – manufacturer’s lifestyle photo showing the product in a room",
          "fr": "Lyngby Porcelæn Rhombe Earth Dinner plate – photo d’ambiance du fabricant montrant le produit dans une pièce",
          "it": "Lyngby Porcelæn Rhombe Earth Dinner plate – foto d’ambiente del produttore con il prodotto nella stanza"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZgMGs/Lyngby-Porcelaen-Rhombe-Earth-Dinner-plate-Marble-201805-xZgMGs.webp?d=22399",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      },
      "produkte": [
        "lyngby-porcelaen-rhombe-earth-dinner-plate"
      ]
    },
    {
      "id": "flower-vasen",
      "titel": {
        "de": "Flower Vase mit Blumen",
        "en": "Flower vase with flowers",
        "fr": "Vase Flower avec des fleurs",
        "it": "Vaso Flower con fiori"
      },
      "bild": {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-flower-daisy-vase-3.webp",
        "width": 1600,
        "height": 1067,
        "alt": {
          "de": "Lyngby Porcelæn Flower Daisy Vase – Stimmungsbild des Herstellers mit dem Produkt im Raum",
          "en": "Lyngby Porcelæn Flower Daisy Vase – manufacturer’s lifestyle photo showing the product in a room",
          "fr": "Lyngby Porcelæn Flower Daisy Vase – photo d’ambiance du fabricant montrant le produit dans une pièce",
          "it": "Lyngby Porcelæn Flower Daisy Vase – foto d’ambiente del produttore con il prodotto nella stanza"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/KaJYhCqdFhNm/Lyngby-Porcelaen-Flower-Vase-White-202021-KaJYhCqdFhNm.webp?d=22399",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      },
      "produkte": [
        "lyngby-porcelaen-flower-daisy-vase"
      ]
    }
  ],
});

/** @type {import("../schema.js").KatalogProdukt[]} */
export const PRODUKTE = deepFreeze([
  {
    "slug": "lyngby-porcelaen-lyngby-vase-glas",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "vase",
    "name": "Lyngby Vase",
    "serie": "Lyngby",
    "kurz": {
      "de": "Vase der Serie Lyngby aus mundgeblasenem Glas. Im Shop des Herstellers in 8 Farben und 6 Größen erhältlich.",
      "en": "Vase from the Lyngby series made of mouth-blown glass. Available in the manufacturer’s shop in 8 colours and 6 sizes.",
      "fr": "Vase de la série Lyngby en verre soufflé à la bouche. Disponible dans la boutique du fabricant en 8 couleurs et 6 tailles.",
      "it": "Vaso della serie Lyngby in vetro soffiato a bocca. Disponibile nel negozio del produttore in 8 colori e 6 misure."
    },
    "merkmale": [
      {
        "de": "Mundgeblasenes Glas",
        "en": "Mouth-blown glass",
        "fr": "Verre soufflé à la bouche",
        "it": "Vetro soffiato a bocca"
      },
      {
        "de": "Serie: Lyngby",
        "en": "Series: Lyngby",
        "fr": "Série : Lyngby",
        "it": "Serie: Lyngby"
      },
      {
        "de": "Farben: Bernstein, Burgunderrot, Klar, Copenhagen Green, Mitternachtsblau, Olivgrün, Rauchglas, Swirl Weiß",
        "en": "Colours: Amber, Burgundy, Clear, Copenhagen green, Midnight blue, Olive green, Smoke, Swirl white",
        "fr": "Couleurs : Ambre, Bordeaux, Transparent, Copenhagen green, Bleu nuit, Vert olive, Fumé, Swirl blanc",
        "it": "Colori: Ambra, Bordeaux, Trasparente, Copenhagen green, Blu notte, Verde oliva, Fumé, Swirl bianco"
      },
      {
        "de": "Größen: H 15,5 cm, H 38 cm, H 20,5 cm, H 25 cm, H 31 cm, H 12,5 cm",
        "en": "Sizes: H 15.5 cm, H 38 cm, H 20.5 cm, H 25 cm, H 31 cm, H 12.5 cm",
        "fr": "Tailles : H 15,5 cm, H 38 cm, H 20,5 cm, H 25 cm, H 31 cm, H 12,5 cm",
        "it": "Misure: H 15,5 cm, H 38 cm, H 20,5 cm, H 25 cm, H 31 cm, H 12,5 cm"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-vase-glas-1-opt.webp",
        "width": 846,
        "height": 1058,
        "alt": {
          "de": "Lyngby Porcelæn Lyngby Vase (Swirl Weiß · H 15,5 cm) – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Lyngby Vase (Swirl white · H 15.5 cm) – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Lyngby Vase (Swirl blanc · H 15,5 cm) – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Lyngby Vase (Swirl bianco · H 15,5 cm) – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZhd3Q/Lyngby-Porcelaen-Lyngby-Vase-Swirl-white-200370-xZhd3Q.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-vase-glas-2.webp",
        "width": 1080,
        "height": 1527,
        "alt": {
          "de": "Lyngby Porcelæn Lyngby Vase (Swirl Weiß · H 15,5 cm) – weitere Ansicht des Herstellers",
          "en": "Lyngby Porcelæn Lyngby Vase (Swirl white · H 15.5 cm) – further view by the manufacturer",
          "fr": "Lyngby Porcelæn Lyngby Vase (Swirl blanc · H 15,5 cm) – autre vue du fabricant",
          "it": "Lyngby Porcelæn Lyngby Vase (Swirl bianco · H 15,5 cm) – altra vista del produttore"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZhd3R/Lyngby-Porcelaen-Lyngby-Vase-Swirl-white-200370-xZhd3R.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "detail"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-vase-glas-3.webp",
        "width": 1600,
        "height": 1067,
        "alt": {
          "de": "Lyngby Porcelæn Lyngby Vase – Stimmungsbild des Herstellers mit dem Produkt im Raum",
          "en": "Lyngby Porcelæn Lyngby Vase – manufacturer’s lifestyle photo showing the product in a room",
          "fr": "Lyngby Porcelæn Lyngby Vase – photo d’ambiance du fabricant montrant le produit dans une pièce",
          "it": "Lyngby Porcelæn Lyngby Vase – foto d’ambiente del produttore con il prodotto nella stanza"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/5FPGwtM/Lyngby-Porcelaen-Lyngby-Vase-Swirl-white-200370-5FPGwtM.webp?d=22399",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-vase-swirl-white-h155-cm-200370",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-vase-swirl-white-h155-cm-200370",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-vase-amber-h155-cm-200561",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-vase-amber-h38-cm-200565",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-vase-burgundy-h155-cm-201065",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-vase-burgundy-h205-cm-201067",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-vase-burgundy-h25-cm-201069",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-vase-burgundy-h31-cm-201070",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-vase-burgundy-h38-cm-201071",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-vase-clear-h125-cm-201085",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-vase-clear-h155-cm-201087",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-vase-clear-h205-cm-201089",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-vase-clear-h25-cm-201091",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-vase-clear-h31-cm-201093",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-vase-clear-h38-cm-201095",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-vase-copenhagen-green-h205-cm-201041",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-vase-copenhagen-green-h25-cm-201049",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-vase-copenhagen-green-h31-cm-201050",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-vase-copenhagen-green-h38-cm-201051",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-vase-midnight-blue-h155-cm-201119",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-vase-midnight-blue-h31-cm-201125",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-vase-midnight-blue-h38-cm-201127",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-vase-olive-green-h155-cm-200570",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-vase-olive-green-h25-cm-200572",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-vase-olive-green-h31-cm-200573",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-vase-olive-green-h38-cm-200574",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-vase-smoke-h205-cm-201105",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-vase-smoke-h25-cm-201107",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-vase-smoke-h31-cm-201109",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-vase-smoke-h38-cm-201111",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-vase-swirl-white-h205-cm-200372",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-vase-swirl-white-h25-cm-200371",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-lyngby-tealight-holder",
      "lyngby-porcelaen-lyngby-tealight-holder-glas",
      "lyngby-porcelaen-lyngby-vase"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Bernstein · H 15,5 cm",
            "en": "Amber · H 15.5 cm",
            "fr": "Ambre · H 15,5 cm",
            "it": "Ambra · H 15,5 cm"
          },
          "betrag": 54.95,
          "sku": "200561",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Bernstein · H 38 cm",
            "en": "Amber · H 38 cm",
            "fr": "Ambre · H 38 cm",
            "it": "Ambra · H 38 cm"
          },
          "betrag": 219.95,
          "sku": "200565",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Burgunderrot · H 15,5 cm",
            "en": "Burgundy · H 15.5 cm",
            "fr": "Bordeaux · H 15,5 cm",
            "it": "Bordeaux · H 15,5 cm"
          },
          "betrag": 44.95,
          "sku": "201065",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Burgunderrot · H 20,5 cm",
            "en": "Burgundy · H 20.5 cm",
            "fr": "Bordeaux · H 20,5 cm",
            "it": "Bordeaux · H 20,5 cm"
          },
          "betrag": 69.95,
          "sku": "201067",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Burgunderrot · H 25 cm",
            "en": "Burgundy · H 25 cm",
            "fr": "Bordeaux · H 25 cm",
            "it": "Bordeaux · H 25 cm"
          },
          "betrag": 109.95,
          "sku": "201069",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Burgunderrot · H 31 cm",
            "en": "Burgundy · H 31 cm",
            "fr": "Bordeaux · H 31 cm",
            "it": "Bordeaux · H 31 cm"
          },
          "betrag": 179.95,
          "sku": "201070",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Burgunderrot · H 38 cm",
            "en": "Burgundy · H 38 cm",
            "fr": "Bordeaux · H 38 cm",
            "it": "Bordeaux · H 38 cm"
          },
          "betrag": 219.95,
          "sku": "201071",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Klar · H 12,5 cm",
            "en": "Clear · H 12.5 cm",
            "fr": "Transparent · H 12,5 cm",
            "it": "Trasparente · H 12,5 cm"
          },
          "betrag": 32.95,
          "sku": "201085",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Klar · H 15,5 cm",
            "en": "Clear · H 15.5 cm",
            "fr": "Transparent · H 15,5 cm",
            "it": "Trasparente · H 15,5 cm"
          },
          "betrag": 49.95,
          "sku": "201087",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Klar · H 20,5 cm",
            "en": "Clear · H 20.5 cm",
            "fr": "Transparent · H 20,5 cm",
            "it": "Trasparente · H 20,5 cm"
          },
          "betrag": 64.95,
          "sku": "201089",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Klar · H 25 cm",
            "en": "Clear · H 25 cm",
            "fr": "Transparent · H 25 cm",
            "it": "Trasparente · H 25 cm"
          },
          "betrag": 99.95,
          "sku": "201091",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Klar · H 31 cm",
            "en": "Clear · H 31 cm",
            "fr": "Transparent · H 31 cm",
            "it": "Trasparente · H 31 cm"
          },
          "betrag": 149.95,
          "sku": "201093",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Klar · H 38 cm",
            "en": "Clear · H 38 cm",
            "fr": "Transparent · H 38 cm",
            "it": "Trasparente · H 38 cm"
          },
          "betrag": 199.95,
          "sku": "201095",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Copenhagen Green · H 20,5 cm",
            "en": "Copenhagen green · H 20.5 cm",
            "fr": "Copenhagen green · H 20,5 cm",
            "it": "Copenhagen green · H 20,5 cm"
          },
          "betrag": 69.95,
          "sku": "201041",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Copenhagen Green · H 25 cm",
            "en": "Copenhagen green · H 25 cm",
            "fr": "Copenhagen green · H 25 cm",
            "it": "Copenhagen green · H 25 cm"
          },
          "betrag": 109.95,
          "sku": "201049",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Copenhagen Green · H 31 cm",
            "en": "Copenhagen green · H 31 cm",
            "fr": "Copenhagen green · H 31 cm",
            "it": "Copenhagen green · H 31 cm"
          },
          "betrag": 179.95,
          "sku": "201050",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Copenhagen Green · H 38 cm",
            "en": "Copenhagen green · H 38 cm",
            "fr": "Copenhagen green · H 38 cm",
            "it": "Copenhagen green · H 38 cm"
          },
          "betrag": 219.95,
          "sku": "201051",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Mitternachtsblau · H 15,5 cm",
            "en": "Midnight blue · H 15.5 cm",
            "fr": "Bleu nuit · H 15,5 cm",
            "it": "Blu notte · H 15,5 cm"
          },
          "betrag": 54.95,
          "sku": "201119",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Mitternachtsblau · H 31 cm",
            "en": "Midnight blue · H 31 cm",
            "fr": "Bleu nuit · H 31 cm",
            "it": "Blu notte · H 31 cm"
          },
          "betrag": 179.95,
          "sku": "201125",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Mitternachtsblau · H 38 cm",
            "en": "Midnight blue · H 38 cm",
            "fr": "Bleu nuit · H 38 cm",
            "it": "Blu notte · H 38 cm"
          },
          "betrag": 219.95,
          "sku": "201127",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Olivgrün · H 15,5 cm",
            "en": "Olive green · H 15.5 cm",
            "fr": "Vert olive · H 15,5 cm",
            "it": "Verde oliva · H 15,5 cm"
          },
          "betrag": 54.95,
          "sku": "200570",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Olivgrün · H 25 cm",
            "en": "Olive green · H 25 cm",
            "fr": "Vert olive · H 25 cm",
            "it": "Verde oliva · H 25 cm"
          },
          "betrag": 109.95,
          "sku": "200572",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Olivgrün · H 31 cm",
            "en": "Olive green · H 31 cm",
            "fr": "Vert olive · H 31 cm",
            "it": "Verde oliva · H 31 cm"
          },
          "betrag": 179.95,
          "sku": "200573",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Olivgrün · H 38 cm",
            "en": "Olive green · H 38 cm",
            "fr": "Vert olive · H 38 cm",
            "it": "Verde oliva · H 38 cm"
          },
          "betrag": 219.95,
          "sku": "200574",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Rauchglas · H 20,5 cm",
            "en": "Smoke · H 20.5 cm",
            "fr": "Fumé · H 20,5 cm",
            "it": "Fumé · H 20,5 cm"
          },
          "betrag": 69.95,
          "sku": "201105",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Rauchglas · H 25 cm",
            "en": "Smoke · H 25 cm",
            "fr": "Fumé · H 25 cm",
            "it": "Fumé · H 25 cm"
          },
          "betrag": 109.95,
          "sku": "201107",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Rauchglas · H 31 cm",
            "en": "Smoke · H 31 cm",
            "fr": "Fumé · H 31 cm",
            "it": "Fumé · H 31 cm"
          },
          "betrag": 179.95,
          "sku": "201109",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Rauchglas · H 38 cm",
            "en": "Smoke · H 38 cm",
            "fr": "Fumé · H 38 cm",
            "it": "Fumé · H 38 cm"
          },
          "betrag": 219.95,
          "sku": "201111",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Swirl Weiß · H 15,5 cm",
            "en": "Swirl white · H 15.5 cm",
            "fr": "Swirl blanc · H 15,5 cm",
            "it": "Swirl bianco · H 15,5 cm"
          },
          "betrag": 84.95,
          "sku": "200370",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Swirl Weiß · H 20,5 cm",
            "en": "Swirl white · H 20.5 cm",
            "fr": "Swirl blanc · H 20,5 cm",
            "it": "Swirl bianco · H 20,5 cm"
          },
          "betrag": 127.95,
          "sku": "200372",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Swirl Weiß · H 25 cm",
            "en": "Swirl white · H 25 cm",
            "fr": "Swirl blanc · H 25 cm",
            "it": "Swirl bianco · H 25 cm"
          },
          "betrag": 184.95,
          "sku": "200371",
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-vase-swirl-white-h155-cm-200370"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Ausführung",
          "en": "Version",
          "fr": "Version",
          "it": "Versione"
        },
        "optionen": [
          {
            "id": "amber-h-15-5-cm",
            "name": {
              "de": "Bernstein · H 15,5 cm",
              "en": "Amber · H 15.5 cm",
              "fr": "Ambre · H 15,5 cm",
              "it": "Ambra · H 15,5 cm"
            },
            "code": "200561",
            "betrag": 54.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-vase-glas-v200561-opt.webp",
                "width": 659,
                "height": 823,
                "alt": {
                  "de": "Lyngby Porcelæn Lyngby Vase (Bernstein · H 15,5 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Lyngby Vase (Amber · H 15.5 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Lyngby Vase (Ambre · H 15,5 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Lyngby Vase (Ambra · H 15,5 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZb9NT/Lyngby-Porcelaen-Lyngby-Vase-Amber-200561-xZb9NT.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "amber-h-38-cm",
            "name": {
              "de": "Bernstein · H 38 cm",
              "en": "Amber · H 38 cm",
              "fr": "Ambre · H 38 cm",
              "it": "Ambra · H 38 cm"
            },
            "code": "200565",
            "betrag": 219.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-vase-glas-v200565-opt.webp",
                "width": 751,
                "height": 939,
                "alt": {
                  "de": "Lyngby Porcelæn Lyngby Vase (Bernstein · H 38 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Lyngby Vase (Amber · H 38 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Lyngby Vase (Ambre · H 38 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Lyngby Vase (Ambra · H 38 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZb9w4/Lyngby-Porcelaen-Lyngby-Vase-Amber-200565-xZb9w4.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "burgundy-h-15-5-cm",
            "name": {
              "de": "Burgunderrot · H 15,5 cm",
              "en": "Burgundy · H 15.5 cm",
              "fr": "Bordeaux · H 15,5 cm",
              "it": "Bordeaux · H 15,5 cm"
            },
            "code": "201065",
            "betrag": 44.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-vase-glas-v201065-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Lyngby Vase (Burgunderrot · H 15,5 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Lyngby Vase (Burgundy · H 15.5 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Lyngby Vase (Bordeaux · H 15,5 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Lyngby Vase (Bordeaux · H 15,5 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbqsZ/Lyngby-Porcelaen-Lyngby-Vase-Burgundy-201065.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "burgundy-h-20-5-cm",
            "name": {
              "de": "Burgunderrot · H 20,5 cm",
              "en": "Burgundy · H 20.5 cm",
              "fr": "Bordeaux · H 20,5 cm",
              "it": "Bordeaux · H 20,5 cm"
            },
            "code": "201067",
            "betrag": 69.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-vase-glas-v201067-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Lyngby Vase (Burgunderrot · H 20,5 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Lyngby Vase (Burgundy · H 20.5 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Lyngby Vase (Bordeaux · H 20,5 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Lyngby Vase (Bordeaux · H 20,5 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZ9BkJ/Lyngby-Porcelaen-Lyngby-Vase-Burgundy-201067-xZ9BkJ.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "burgundy-h-25-cm",
            "name": {
              "de": "Burgunderrot · H 25 cm",
              "en": "Burgundy · H 25 cm",
              "fr": "Bordeaux · H 25 cm",
              "it": "Bordeaux · H 25 cm"
            },
            "code": "201069",
            "betrag": 109.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-vase-glas-v201069-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Lyngby Vase (Burgunderrot · H 25 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Lyngby Vase (Burgundy · H 25 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Lyngby Vase (Bordeaux · H 25 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Lyngby Vase (Bordeaux · H 25 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZ9BkN/Lyngby-Porcelaen-Lyngby-Vase-Burgundy-201069-xZ9BkN.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "burgundy-h-31-cm",
            "name": {
              "de": "Burgunderrot · H 31 cm",
              "en": "Burgundy · H 31 cm",
              "fr": "Bordeaux · H 31 cm",
              "it": "Bordeaux · H 31 cm"
            },
            "code": "201070",
            "betrag": 179.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-vase-glas-v201070-opt.webp",
                "width": 751,
                "height": 939,
                "alt": {
                  "de": "Lyngby Porcelæn Lyngby Vase (Burgunderrot · H 31 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Lyngby Vase (Burgundy · H 31 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Lyngby Vase (Bordeaux · H 31 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Lyngby Vase (Bordeaux · H 31 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZb9vX/Lyngby-Porcelaen-Lyngby-Vase-Burgundy-201070-xZb9vX.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "burgundy-h-38-cm",
            "name": {
              "de": "Burgunderrot · H 38 cm",
              "en": "Burgundy · H 38 cm",
              "fr": "Bordeaux · H 38 cm",
              "it": "Bordeaux · H 38 cm"
            },
            "code": "201071",
            "betrag": 219.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-vase-glas-v201071-opt.webp",
                "width": 771,
                "height": 964,
                "alt": {
                  "de": "Lyngby Porcelæn Lyngby Vase (Burgunderrot · H 38 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Lyngby Vase (Burgundy · H 38 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Lyngby Vase (Bordeaux · H 38 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Lyngby Vase (Bordeaux · H 38 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZb9vZ/Lyngby-Porcelaen-Lyngby-Vase-Burgundy-201071-xZb9vZ.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "clear-h-12-5-cm",
            "name": {
              "de": "Klar · H 12,5 cm",
              "en": "Clear · H 12.5 cm",
              "fr": "Transparent · H 12,5 cm",
              "it": "Trasparente · H 12,5 cm"
            },
            "code": "201085",
            "betrag": 32.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-vase-glas-v201085-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Lyngby Vase (Klar · H 12,5 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Lyngby Vase (Clear · H 12.5 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Lyngby Vase (Transparent · H 12,5 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Lyngby Vase (Trasparente · H 12,5 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbqt0/Lyngby-Porcelaen-Lyngby-Vase-Clear-201085.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "clear-h-15-5-cm",
            "name": {
              "de": "Klar · H 15,5 cm",
              "en": "Clear · H 15.5 cm",
              "fr": "Transparent · H 15,5 cm",
              "it": "Trasparente · H 15,5 cm"
            },
            "code": "201087",
            "betrag": 49.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-vase-glas-v201087-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Lyngby Vase (Klar · H 15,5 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Lyngby Vase (Clear · H 15.5 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Lyngby Vase (Transparent · H 15,5 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Lyngby Vase (Trasparente · H 15,5 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbqt1/Lyngby-Porcelaen-Lyngby-Vase-Clear-201087.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "clear-h-20-5-cm",
            "name": {
              "de": "Klar · H 20,5 cm",
              "en": "Clear · H 20.5 cm",
              "fr": "Transparent · H 20,5 cm",
              "it": "Trasparente · H 20,5 cm"
            },
            "code": "201089",
            "betrag": 64.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-vase-glas-v201089-opt.webp",
                "width": 701,
                "height": 876,
                "alt": {
                  "de": "Lyngby Porcelæn Lyngby Vase (Klar · H 20,5 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Lyngby Vase (Clear · H 20.5 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Lyngby Vase (Transparent · H 20,5 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Lyngby Vase (Trasparente · H 20,5 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZ9vPD/Lyngby-Porcelaen-Lyngby-Vase-Clear-201089-xZ9vPD.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "clear-h-25-cm",
            "name": {
              "de": "Klar · H 25 cm",
              "en": "Clear · H 25 cm",
              "fr": "Transparent · H 25 cm",
              "it": "Trasparente · H 25 cm"
            },
            "code": "201091",
            "betrag": 99.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-vase-glas-v201091-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Lyngby Vase (Klar · H 25 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Lyngby Vase (Clear · H 25 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Lyngby Vase (Transparent · H 25 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Lyngby Vase (Trasparente · H 25 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbqt3/Lyngby-Porcelaen-Lyngby-Vase-Clear-201091.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "clear-h-31-cm",
            "name": {
              "de": "Klar · H 31 cm",
              "en": "Clear · H 31 cm",
              "fr": "Transparent · H 31 cm",
              "it": "Trasparente · H 31 cm"
            },
            "code": "201093",
            "betrag": 149.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-vase-glas-v201093-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Lyngby Vase (Klar · H 31 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Lyngby Vase (Clear · H 31 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Lyngby Vase (Transparent · H 31 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Lyngby Vase (Trasparente · H 31 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbr2x/Lyngby-Porcelaen-Lyngby-Vase-Clear-201093.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "clear-h-38-cm",
            "name": {
              "de": "Klar · H 38 cm",
              "en": "Clear · H 38 cm",
              "fr": "Transparent · H 38 cm",
              "it": "Trasparente · H 38 cm"
            },
            "code": "201095",
            "betrag": 199.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-vase-glas-v201095-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Lyngby Vase (Klar · H 38 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Lyngby Vase (Clear · H 38 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Lyngby Vase (Transparent · H 38 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Lyngby Vase (Trasparente · H 38 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbqt4/Lyngby-Porcelaen-Lyngby-Vase-Clear-201095.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "copenhagen-green-h-20-5-cm",
            "name": {
              "de": "Copenhagen Green · H 20,5 cm",
              "en": "Copenhagen green · H 20.5 cm",
              "fr": "Copenhagen green · H 20,5 cm",
              "it": "Copenhagen green · H 20,5 cm"
            },
            "code": "201041",
            "betrag": 69.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-vase-glas-v201041-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Lyngby Vase (Copenhagen Green · H 20,5 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Lyngby Vase (Copenhagen green · H 20.5 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Lyngby Vase (Copenhagen green · H 20,5 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Lyngby Vase (Copenhagen green · H 20,5 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbqsW/Lyngby-Porcelaen-Lyngby-Vase-Copenhagen-green-201041-xZbqsW.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "copenhagen-green-h-25-cm",
            "name": {
              "de": "Copenhagen Green · H 25 cm",
              "en": "Copenhagen green · H 25 cm",
              "fr": "Copenhagen green · H 25 cm",
              "it": "Copenhagen green · H 25 cm"
            },
            "code": "201049",
            "betrag": 109.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-vase-glas-v201049-opt.webp",
                "width": 651,
                "height": 814,
                "alt": {
                  "de": "Lyngby Porcelæn Lyngby Vase (Copenhagen Green · H 25 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Lyngby Vase (Copenhagen green · H 25 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Lyngby Vase (Copenhagen green · H 25 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Lyngby Vase (Copenhagen green · H 25 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbqsX/Lyngby-Porcelaen-Lyngby-Vase-Copenhagen-green-201049-xZbqsX.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "copenhagen-green-h-31-cm",
            "name": {
              "de": "Copenhagen Green · H 31 cm",
              "en": "Copenhagen green · H 31 cm",
              "fr": "Copenhagen green · H 31 cm",
              "it": "Copenhagen green · H 31 cm"
            },
            "code": "201050",
            "betrag": 179.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-vase-glas-v201050-opt.webp",
                "width": 751,
                "height": 939,
                "alt": {
                  "de": "Lyngby Porcelæn Lyngby Vase (Copenhagen Green · H 31 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Lyngby Vase (Copenhagen green · H 31 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Lyngby Vase (Copenhagen green · H 31 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Lyngby Vase (Copenhagen green · H 31 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZb9vW/Lyngby-Porcelaen-Lyngby-Vase-Copenhagen-green-201050-xZb9vW.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "copenhagen-green-h-38-cm",
            "name": {
              "de": "Copenhagen Green · H 38 cm",
              "en": "Copenhagen green · H 38 cm",
              "fr": "Copenhagen green · H 38 cm",
              "it": "Copenhagen green · H 38 cm"
            },
            "code": "201051",
            "betrag": 219.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-vase-glas-v201051-opt.webp",
                "width": 788,
                "height": 984,
                "alt": {
                  "de": "Lyngby Porcelæn Lyngby Vase (Copenhagen Green · H 38 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Lyngby Vase (Copenhagen green · H 38 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Lyngby Vase (Copenhagen green · H 38 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Lyngby Vase (Copenhagen green · H 38 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZb9l6/Lyngby-Porcelaen-Lyngby-Vase-Copenhagen-green-201051-xZb9l6.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "midnight-blue-h-15-5-cm",
            "name": {
              "de": "Mitternachtsblau · H 15,5 cm",
              "en": "Midnight blue · H 15.5 cm",
              "fr": "Bleu nuit · H 15,5 cm",
              "it": "Blu notte · H 15,5 cm"
            },
            "code": "201119",
            "betrag": 54.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-vase-glas-v201119-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Lyngby Vase (Mitternachtsblau · H 15,5 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Lyngby Vase (Midnight blue · H 15.5 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Lyngby Vase (Bleu nuit · H 15,5 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Lyngby Vase (Blu notte · H 15,5 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZ9Bl2/Lyngby-Porcelaen-Lyngby-Vase-Midnight-blue-201119-xZ9Bl2.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "midnight-blue-h-31-cm",
            "name": {
              "de": "Mitternachtsblau · H 31 cm",
              "en": "Midnight blue · H 31 cm",
              "fr": "Bleu nuit · H 31 cm",
              "it": "Blu notte · H 31 cm"
            },
            "code": "201125",
            "betrag": 179.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-vase-glas-v201125-opt.webp",
                "width": 752,
                "height": 941,
                "alt": {
                  "de": "Lyngby Porcelæn Lyngby Vase (Mitternachtsblau · H 31 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Lyngby Vase (Midnight blue · H 31 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Lyngby Vase (Bleu nuit · H 31 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Lyngby Vase (Blu notte · H 31 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZb9w0/Lyngby-Porcelaen-Lyngby-Vase-Midnight-blue-201125-xZb9w0.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "midnight-blue-h-38-cm",
            "name": {
              "de": "Mitternachtsblau · H 38 cm",
              "en": "Midnight blue · H 38 cm",
              "fr": "Bleu nuit · H 38 cm",
              "it": "Blu notte · H 38 cm"
            },
            "code": "201127",
            "betrag": 219.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-vase-glas-v201127-opt.webp",
                "width": 756,
                "height": 945,
                "alt": {
                  "de": "Lyngby Porcelæn Lyngby Vase (Mitternachtsblau · H 38 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Lyngby Vase (Midnight blue · H 38 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Lyngby Vase (Bleu nuit · H 38 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Lyngby Vase (Blu notte · H 38 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZb9w1/Lyngby-Porcelaen-Lyngby-Vase-Midnight-blue-201127-xZb9w1.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "olive-green-h-15-5-cm",
            "name": {
              "de": "Olivgrün · H 15,5 cm",
              "en": "Olive green · H 15.5 cm",
              "fr": "Vert olive · H 15,5 cm",
              "it": "Verde oliva · H 15,5 cm"
            },
            "code": "200570",
            "betrag": 54.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-vase-glas-v200570-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Lyngby Vase (Olivgrün · H 15,5 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Lyngby Vase (Olive green · H 15.5 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Lyngby Vase (Vert olive · H 15,5 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Lyngby Vase (Verde oliva · H 15,5 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZcCSl/Lyngby-Porcelaen-Lyngby-Vase-Olive-green-200570-xZcCSl.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "olive-green-h-25-cm",
            "name": {
              "de": "Olivgrün · H 25 cm",
              "en": "Olive green · H 25 cm",
              "fr": "Vert olive · H 25 cm",
              "it": "Verde oliva · H 25 cm"
            },
            "code": "200572",
            "betrag": 109.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-vase-glas-v200572-opt.webp",
                "width": 722,
                "height": 902,
                "alt": {
                  "de": "Lyngby Porcelæn Lyngby Vase (Olivgrün · H 25 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Lyngby Vase (Olive green · H 25 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Lyngby Vase (Vert olive · H 25 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Lyngby Vase (Verde oliva · H 25 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZcCSn/Lyngby-Porcelaen-Lyngby-Vase-Olive-green-200572-xZcCSn.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "olive-green-h-31-cm",
            "name": {
              "de": "Olivgrün · H 31 cm",
              "en": "Olive green · H 31 cm",
              "fr": "Vert olive · H 31 cm",
              "it": "Verde oliva · H 31 cm"
            },
            "code": "200573",
            "betrag": 179.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-vase-glas-v200573-opt.webp",
                "width": 796,
                "height": 995,
                "alt": {
                  "de": "Lyngby Porcelæn Lyngby Vase (Olivgrün · H 31 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Lyngby Vase (Olive green · H 31 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Lyngby Vase (Vert olive · H 31 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Lyngby Vase (Verde oliva · H 31 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZcCSp/Lyngby-Porcelaen-Lyngby-Vase-Olive-green-200573-xZcCSp.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "olive-green-h-38-cm",
            "name": {
              "de": "Olivgrün · H 38 cm",
              "en": "Olive green · H 38 cm",
              "fr": "Vert olive · H 38 cm",
              "it": "Verde oliva · H 38 cm"
            },
            "code": "200574",
            "betrag": 219.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-vase-glas-v200574-opt.webp",
                "width": 879,
                "height": 1099,
                "alt": {
                  "de": "Lyngby Porcelæn Lyngby Vase (Olivgrün · H 38 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Lyngby Vase (Olive green · H 38 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Lyngby Vase (Vert olive · H 38 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Lyngby Vase (Verde oliva · H 38 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZcCSq/Lyngby-Porcelaen-Lyngby-Vase-Olive-green-200574-xZcCSq.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "smoke-h-20-5-cm",
            "name": {
              "de": "Rauchglas · H 20,5 cm",
              "en": "Smoke · H 20.5 cm",
              "fr": "Fumé · H 20,5 cm",
              "it": "Fumé · H 20,5 cm"
            },
            "code": "201105",
            "betrag": 69.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-vase-glas-v201105-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Lyngby Vase (Rauchglas · H 20,5 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Lyngby Vase (Smoke · H 20.5 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Lyngby Vase (Fumé · H 20,5 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Lyngby Vase (Fumé · H 20,5 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbqCL/Lyngby-Porcelaen-Lyngby-Vase-Smoke-201105.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "smoke-h-25-cm",
            "name": {
              "de": "Rauchglas · H 25 cm",
              "en": "Smoke · H 25 cm",
              "fr": "Fumé · H 25 cm",
              "it": "Fumé · H 25 cm"
            },
            "code": "201107",
            "betrag": 109.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-vase-glas-v201107-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Lyngby Vase (Rauchglas · H 25 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Lyngby Vase (Smoke · H 25 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Lyngby Vase (Fumé · H 25 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Lyngby Vase (Fumé · H 25 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbqt5/Lyngby-Porcelaen-Lyngby-Vase-Smoke-201107.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "smoke-h-31-cm",
            "name": {
              "de": "Rauchglas · H 31 cm",
              "en": "Smoke · H 31 cm",
              "fr": "Fumé · H 31 cm",
              "it": "Fumé · H 31 cm"
            },
            "code": "201109",
            "betrag": 179.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-vase-glas-v201109-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Lyngby Vase (Rauchglas · H 31 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Lyngby Vase (Smoke · H 31 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Lyngby Vase (Fumé · H 31 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Lyngby Vase (Fumé · H 31 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZ9BkS/Lyngby-Porcelaen-Lyngby-Vase-Smoke-201109-xZ9BkS.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "smoke-h-38-cm",
            "name": {
              "de": "Rauchglas · H 38 cm",
              "en": "Smoke · H 38 cm",
              "fr": "Fumé · H 38 cm",
              "it": "Fumé · H 38 cm"
            },
            "code": "201111",
            "betrag": 219.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-vase-glas-v201111-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Lyngby Vase (Rauchglas · H 38 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Lyngby Vase (Smoke · H 38 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Lyngby Vase (Fumé · H 38 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Lyngby Vase (Fumé · H 38 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbqt6/Lyngby-Porcelaen-Lyngby-Vase-Smoke-201111.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "swirl-white-h-15-5-cm",
            "name": {
              "de": "Swirl Weiß · H 15,5 cm",
              "en": "Swirl white · H 15.5 cm",
              "fr": "Swirl blanc · H 15,5 cm",
              "it": "Swirl bianco · H 15,5 cm"
            },
            "code": "200370",
            "betrag": 84.95,
            "bilder": [
              "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-vase-glas-1-opt.webp"
            ],
            "standard": true
          },
          {
            "id": "swirl-white-h-20-5-cm",
            "name": {
              "de": "Swirl Weiß · H 20,5 cm",
              "en": "Swirl white · H 20.5 cm",
              "fr": "Swirl blanc · H 20,5 cm",
              "it": "Swirl bianco · H 20,5 cm"
            },
            "code": "200372",
            "betrag": 127.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-vase-glas-v200372-opt.webp",
                "width": 675,
                "height": 844,
                "alt": {
                  "de": "Lyngby Porcelæn Lyngby Vase (Swirl Weiß · H 20,5 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Lyngby Vase (Swirl white · H 20.5 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Lyngby Vase (Swirl blanc · H 20,5 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Lyngby Vase (Swirl bianco · H 20,5 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZhd40/Lyngby-Porcelaen-Lyngby-Vase-Swirl-white-200372-xZhd40.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "swirl-white-h-25-cm",
            "name": {
              "de": "Swirl Weiß · H 25 cm",
              "en": "Swirl white · H 25 cm",
              "fr": "Swirl blanc · H 25 cm",
              "it": "Swirl bianco · H 25 cm"
            },
            "code": "200371",
            "betrag": 184.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-vase-glas-v200371-opt.webp",
                "width": 692,
                "height": 865,
                "alt": {
                  "de": "Lyngby Porcelæn Lyngby Vase (Swirl Weiß · H 25 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Lyngby Vase (Swirl white · H 25 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Lyngby Vase (Swirl blanc · H 25 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Lyngby Vase (Swirl bianco · H 25 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZhd3V/Lyngby-Porcelaen-Lyngby-Vase-Swirl-white-200371-xZhd3V.webp?d=22397",
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
    "slug": "lyngby-porcelaen-lyngby-tealight-holder",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "wohnaccessoire",
    "name": "Lyngby Tealight holder",
    "serie": "Lyngby",
    "kurz": {
      "de": "Teelichthalter der Serie Lyngby aus Porzellan, entworfen von Karakter Copenhagen. Mit den für Lyngby Porcelæn typischen Rillen.",
      "en": "Tealight holder from the Lyngby series made of porcelain, designed by Karakter Copenhagen. Features the grooves typical of Lyngby Porcelæn.",
      "fr": "Photophore de la série Lyngby en porcelaine, dessinée par Karakter Copenhagen. Avec les cannelures caractéristiques de Lyngby Porcelæn.",
      "it": "Portacandela tealight della serie Lyngby in porcellana, design di Karakter Copenhagen. Con le scanalature tipiche di Lyngby Porcelæn."
    },
    "merkmale": [
      {
        "de": "Porzellan",
        "en": "Porcelain",
        "fr": "Porcelaine",
        "it": "Porcellana"
      },
      {
        "de": "Design: Karakter Copenhagen",
        "en": "Design: Karakter Copenhagen",
        "fr": "Design : Karakter Copenhagen",
        "it": "Design: Karakter Copenhagen"
      },
      {
        "de": "Serie: Lyngby",
        "en": "Series: Lyngby",
        "fr": "Série : Lyngby",
        "it": "Serie: Lyngby"
      },
      {
        "de": "2 Stück je Packung",
        "en": "2 pieces per pack",
        "fr": "2 pièces par lot",
        "it": "2 pezzi per confezione"
      },
      {
        "de": "Mit den für Lyngby Porcelæn typischen Rillen.",
        "en": "Features the grooves typical of Lyngby Porcelæn.",
        "fr": "Avec les cannelures caractéristiques de Lyngby Porcelæn.",
        "it": "Con le scanalature tipiche di Lyngby Porcelæn."
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "3 cm"
      },
      {
        "key": "durchmesser",
        "wert": "6,5 cm"
      }
    ],
    "designer": "Karakter Copenhagen",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-tealight-holder-1-opt.webp",
        "width": 640,
        "height": 800,
        "alt": {
          "de": "Lyngby Porcelæn Lyngby Tealight holder – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Lyngby Tealight holder – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Lyngby Tealight holder – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Lyngby Tealight holder – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZ97pX/Lyngby-Porcelaen-Lyngby-Tealight-holder-White-200532.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-tealight-holder-2.webp",
        "width": 1067,
        "height": 1600,
        "alt": {
          "de": "Lyngby Porcelæn Lyngby Tealight holder – Stimmungsbild des Herstellers mit dem Produkt im Raum",
          "en": "Lyngby Porcelæn Lyngby Tealight holder – manufacturer’s lifestyle photo showing the product in a room",
          "fr": "Lyngby Porcelæn Lyngby Tealight holder – photo d’ambiance du fabricant montrant le produit dans une pièce",
          "it": "Lyngby Porcelæn Lyngby Tealight holder – foto d’ambiente del produttore con il prodotto nella stanza"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/2SNVJT/Lyngby-Porcelaen-Lyngby-Tealight-holder-White-200532.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-tealight-holder-white-oe65-cm-200532",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-tealight-holder-white-oe65-cm-200532",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-lyngby-vase-glas",
      "lyngby-porcelaen-lyngby-tealight-holder-glas",
      "lyngby-porcelaen-lyngby-vase"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Weiß",
            "en": "White",
            "fr": "Blanc",
            "it": "Bianco"
          },
          "betrag": 36.95,
          "sku": "200532",
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-tealight-holder-white-oe65-cm-200532"
    }
  },
  {
    "slug": "lyngby-porcelaen-curve-vase",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "vase",
    "name": "Curve Vase",
    "serie": "Curve",
    "kurz": {
      "de": "Vase der Serie Curve aus Porzellan.",
      "en": "Vase from the Curve series made of porcelain.",
      "fr": "Vase de la série Curve en porcelaine.",
      "it": "Vaso della serie Curve in porcellana."
    },
    "merkmale": [
      {
        "de": "Porzellan",
        "en": "Porcelain",
        "fr": "Porcelaine",
        "it": "Porcellana"
      },
      {
        "de": "Serie: Curve",
        "en": "Series: Curve",
        "fr": "Série : Curve",
        "it": "Serie: Curve"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "12,5 cm"
      },
      {
        "key": "durchmesser",
        "wert": "9,5 cm"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-curve-vase-1-opt.webp",
        "width": 640,
        "height": 800,
        "alt": {
          "de": "Lyngby Porcelæn Curve Vase – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Curve Vase – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Curve Vase – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Curve Vase – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZ97pZ/Lyngby-Porcelaen-Curve-Vase-White-200540.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-curve-vase-2.webp",
        "width": 1600,
        "height": 1067,
        "alt": {
          "de": "Lyngby Porcelæn Curve Vase – Stimmungsbild des Herstellers mit dem Produkt im Raum",
          "en": "Lyngby Porcelæn Curve Vase – manufacturer’s lifestyle photo showing the product in a room",
          "fr": "Lyngby Porcelæn Curve Vase – photo d’ambiance du fabricant montrant le produit dans une pièce",
          "it": "Lyngby Porcelæn Curve Vase – foto d’ambiente del produttore con il prodotto nella stanza"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/2SP80q/Lyngby-Porcelaen-Curve-Vase-White-200540-2SP80q.webp?d=22399",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-curve-vase-white-h125-cm-200540",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-curve-vase-white-h125-cm-200540",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-curve-candle-holder"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Weiß",
            "en": "White",
            "fr": "Blanc",
            "it": "Bianco"
          },
          "betrag": 49.95,
          "sku": "200540",
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-curve-vase-white-h125-cm-200540"
    }
  },
  {
    "slug": "lyngby-porcelaen-curve-candle-holder",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "wohnaccessoire",
    "name": "Curve Candle holder",
    "serie": "Curve",
    "kurz": {
      "de": "Kerzenhalter der Serie Curve aus Porzellan.",
      "en": "Candle holder from the Curve series made of porcelain.",
      "fr": "Bougeoir de la série Curve en porcelaine.",
      "it": "Portacandele della serie Curve in porcellana."
    },
    "merkmale": [
      {
        "de": "Porzellan",
        "en": "Porcelain",
        "fr": "Porcelaine",
        "it": "Porcellana"
      },
      {
        "de": "Serie: Curve",
        "en": "Series: Curve",
        "fr": "Série : Curve",
        "it": "Serie: Curve"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "7 cm"
      },
      {
        "key": "durchmesser",
        "wert": "6,5 cm"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-curve-candle-holder-1-opt.webp",
        "width": 854,
        "height": 1067,
        "alt": {
          "de": "Lyngby Porcelæn Curve Candle holder – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Curve Candle holder – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Curve Candle holder – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Curve Candle holder – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZcCRV/Lyngby-Porcelaen-Curve-Candle-holder-White-200545-xZcCRV.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-curve-candle-holder-2.webp",
        "width": 1080,
        "height": 1527,
        "alt": {
          "de": "Lyngby Porcelæn Curve Candle holder – weitere Ansicht des Herstellers",
          "en": "Lyngby Porcelæn Curve Candle holder – further view by the manufacturer",
          "fr": "Lyngby Porcelæn Curve Candle holder – autre vue du fabricant",
          "it": "Lyngby Porcelæn Curve Candle holder – altra vista del produttore"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZb9GB/Lyngby-Porcelaen-Curve-Candle-holder-White-200545-xZb9GB.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "detail"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-curve-candle-holder-white-h7-cm-200545",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-curve-candle-holder-white-h7-cm-200545",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-curve-vase"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Weiß",
            "en": "White",
            "fr": "Blanc",
            "it": "Bianco"
          },
          "betrag": 17.95,
          "sku": "200545",
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-curve-candle-holder-white-h7-cm-200545"
    }
  },
  {
    "slug": "lyngby-porcelaen-lyngby-tealight-holder-glas",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "wohnaccessoire",
    "name": "Lyngby Tealight holder",
    "serie": "Lyngby",
    "kurz": {
      "de": "Teelichthalter der Serie Lyngby aus mundgeblasenem Glas. Im Shop des Herstellers in 6 Farben erhältlich.",
      "en": "Tealight holder from the Lyngby series made of mouth-blown glass. Available in the manufacturer’s shop in 6 colours.",
      "fr": "Photophore de la série Lyngby en verre soufflé à la bouche. Disponible dans la boutique du fabricant en 6 couleurs.",
      "it": "Portacandela tealight della serie Lyngby in vetro soffiato a bocca. Disponibile nel negozio del produttore in 6 colori."
    },
    "merkmale": [
      {
        "de": "Mundgeblasenes Glas",
        "en": "Mouth-blown glass",
        "fr": "Verre soufflé à la bouche",
        "it": "Vetro soffiato a bocca"
      },
      {
        "de": "Serie: Lyngby",
        "en": "Series: Lyngby",
        "fr": "Série : Lyngby",
        "it": "Serie: Lyngby"
      },
      {
        "de": "Farben: Bernstein, Burgunderrot, Klar, Copenhagen Green, Mitternachtsblau, Rauchglas",
        "en": "Colours: Amber, Burgundy, Clear, Copenhagen green, Midnight blue, Smoke",
        "fr": "Couleurs : Ambre, Bordeaux, Transparent, Copenhagen green, Bleu nuit, Fumé",
        "it": "Colori: Ambra, Bordeaux, Trasparente, Copenhagen green, Blu notte, Fumé"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "5,5 cm"
      },
      {
        "key": "durchmesser",
        "wert": "6,7 cm"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-tealight-holder-glas-1-opt.webp",
        "width": 640,
        "height": 800,
        "alt": {
          "de": "Lyngby Porcelæn Lyngby Tealight holder (Bernstein) – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Lyngby Tealight holder (Amber) – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Lyngby Tealight holder (Ambre) – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Lyngby Tealight holder (Ambra) – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZ97qb/Lyngby-Porcelaen-Lyngby-Tealight-holder-Amber-200560-xZ97qb.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-tealight-holder-glas-2.webp",
        "width": 1080,
        "height": 1527,
        "alt": {
          "de": "Lyngby Porcelæn Lyngby Tealight holder (Bernstein) – weitere Ansicht des Herstellers",
          "en": "Lyngby Porcelæn Lyngby Tealight holder (Amber) – further view by the manufacturer",
          "fr": "Lyngby Porcelæn Lyngby Tealight holder (Ambre) – autre vue du fabricant",
          "it": "Lyngby Porcelæn Lyngby Tealight holder (Ambra) – altra vista del produttore"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZ97qc/Lyngby-Porcelaen-Lyngby-Tealight-holder-Amber-200560-xZ97qc.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "detail"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-tealight-holder-glas-3.webp",
        "width": 1080,
        "height": 1575,
        "alt": {
          "de": "Lyngby Porcelæn Lyngby Tealight holder – Stimmungsbild des Herstellers mit dem Produkt im Raum",
          "en": "Lyngby Porcelæn Lyngby Tealight holder – manufacturer’s lifestyle photo showing the product in a room",
          "fr": "Lyngby Porcelæn Lyngby Tealight holder – photo d’ambiance du fabricant montrant le produit dans une pièce",
          "it": "Lyngby Porcelæn Lyngby Tealight holder – foto d’ambiente del produttore con il prodotto nella stanza"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/2SPfzL/Lyngby-Porcelaen-Lyngby-Tealight-holder-Burgundy-201291.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-tealight-holder-amber-oe67-cm-200560",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-tealight-holder-amber-oe67-cm-200560",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-tealight-holder-burgundy-oe67-cm-201291",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-tealight-holder-clear-oe67-cm-201293",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-tealight-holder-copenhagen-green-oe67-cm-201282",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-tealight-holder-midnight-blue-oe67-cm-201301",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-tealight-holder-smoke-oe67-cm-201297",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-lyngby-vase-glas",
      "lyngby-porcelaen-lyngby-tealight-holder",
      "lyngby-porcelaen-lyngby-vase"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Bernstein",
            "en": "Amber",
            "fr": "Ambre",
            "it": "Ambra"
          },
          "betrag": 21.95,
          "sku": "200560",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Burgunderrot",
            "en": "Burgundy",
            "fr": "Bordeaux",
            "it": "Bordeaux"
          },
          "betrag": 21.95,
          "sku": "201291",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Klar",
            "en": "Clear",
            "fr": "Transparent",
            "it": "Trasparente"
          },
          "betrag": 21.95,
          "sku": "201293",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Copenhagen Green",
            "en": "Copenhagen green",
            "fr": "Copenhagen green",
            "it": "Copenhagen green"
          },
          "betrag": 21.95,
          "sku": "201282",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Mitternachtsblau",
            "en": "Midnight blue",
            "fr": "Bleu nuit",
            "it": "Blu notte"
          },
          "betrag": 21.95,
          "sku": "201301",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Rauchglas",
            "en": "Smoke",
            "fr": "Fumé",
            "it": "Fumé"
          },
          "betrag": 21.95,
          "sku": "201297",
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-tealight-holder-amber-oe67-cm-200560"
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
            "id": "amber",
            "name": {
              "de": "Bernstein",
              "en": "Amber",
              "fr": "Ambre",
              "it": "Ambra"
            },
            "code": "200560",
            "betrag": 21.95,
            "bilder": [
              "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-tealight-holder-glas-1-opt.webp"
            ],
            "standard": true
          },
          {
            "id": "burgundy",
            "name": {
              "de": "Burgunderrot",
              "en": "Burgundy",
              "fr": "Bordeaux",
              "it": "Bordeaux"
            },
            "code": "201291",
            "betrag": 21.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-tealight-holder-glas-v201291-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Lyngby Tealight holder (Burgunderrot) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Lyngby Tealight holder (Burgundy) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Lyngby Tealight holder (Bordeaux) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Lyngby Tealight holder (Bordeaux) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbqtn/Lyngby-Porcelaen-Lyngby-Tealight-holder-Burgundy-201291.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "clear",
            "name": {
              "de": "Klar",
              "en": "Clear",
              "fr": "Transparent",
              "it": "Trasparente"
            },
            "code": "201293",
            "betrag": 21.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-tealight-holder-glas-v201293-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Lyngby Tealight holder (Klar) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Lyngby Tealight holder (Clear) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Lyngby Tealight holder (Transparent) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Lyngby Tealight holder (Trasparente) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZ9885/Lyngby-Porcelaen-Lyngby-Tealight-holder-Clear-201293.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "copenhagen-green",
            "name": {
              "de": "Copenhagen Green",
              "en": "Copenhagen green",
              "fr": "Copenhagen green",
              "it": "Copenhagen green"
            },
            "code": "201282",
            "betrag": 21.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-tealight-holder-glas-v201282-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Lyngby Tealight holder (Copenhagen Green) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Lyngby Tealight holder (Copenhagen green) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Lyngby Tealight holder (Copenhagen green) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Lyngby Tealight holder (Copenhagen green) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbqtm/Lyngby-Porcelaen-Lyngby-Tealight-holder-Copenhagen-green-201282.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "midnight-blue",
            "name": {
              "de": "Mitternachtsblau",
              "en": "Midnight blue",
              "fr": "Bleu nuit",
              "it": "Blu notte"
            },
            "code": "201301",
            "betrag": 21.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-tealight-holder-glas-v201301-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Lyngby Tealight holder (Mitternachtsblau) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Lyngby Tealight holder (Midnight blue) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Lyngby Tealight holder (Bleu nuit) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Lyngby Tealight holder (Blu notte) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbqtq/Lyngby-Porcelaen-Lyngby-Tealight-holder-Midnight-blue-201301.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "smoke",
            "name": {
              "de": "Rauchglas",
              "en": "Smoke",
              "fr": "Fumé",
              "it": "Fumé"
            },
            "code": "201297",
            "betrag": 21.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-tealight-holder-glas-v201297-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Lyngby Tealight holder (Rauchglas) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Lyngby Tealight holder (Smoke) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Lyngby Tealight holder (Fumé) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Lyngby Tealight holder (Fumé) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbqtp/Lyngby-Porcelaen-Lyngby-Tealight-holder-Smoke-201297.webp?d=22397",
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
    "slug": "lyngby-porcelaen-lyngby-vase",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "vase",
    "name": "Lyngby Vase",
    "serie": "Lyngby",
    "kurz": {
      "de": "Vase der Serie Lyngby aus Porzellan, entworfen von Karakter Copenhagen. Im Shop des Herstellers in 8 Farben und 8 Größen erhältlich.",
      "en": "Vase from the Lyngby series made of porcelain, designed by Karakter Copenhagen. Available in the manufacturer’s shop in 8 colours and 8 sizes.",
      "fr": "Vase de la série Lyngby en porcelaine, dessinée par Karakter Copenhagen. Disponible dans la boutique du fabricant en 8 couleurs et 8 tailles.",
      "it": "Vaso della serie Lyngby in porcellana, design di Karakter Copenhagen. Disponibile nel negozio del produttore in 8 colori e 8 misure."
    },
    "merkmale": [
      {
        "de": "Porzellan",
        "en": "Porcelain",
        "fr": "Porcelaine",
        "it": "Porcellana"
      },
      {
        "de": "Design: Karakter Copenhagen",
        "en": "Design: Karakter Copenhagen",
        "fr": "Design : Karakter Copenhagen",
        "it": "Design: Karakter Copenhagen"
      },
      {
        "de": "Serie: Lyngby",
        "en": "Series: Lyngby",
        "fr": "Série : Lyngby",
        "it": "Serie: Lyngby"
      },
      {
        "de": "Farben: Schwarz, Copenhagen Green, Dunkelgrün, Hellgrau, Mattweiß, Violett, Rot, Weiß",
        "en": "Colours: Black, Copenhagen green, Dark green, Light grey, Matte white, Purple, Red, White",
        "fr": "Couleurs : Noir, Copenhagen green, Vert foncé, Gris clair, Blanc mat, Violet, Rouge, Blanc",
        "it": "Colori: Nero, Copenhagen green, Verde scuro, Grigio chiaro, Bianco opaco, Viola, Rosso, Bianco"
      },
      {
        "de": "Größen: H 12,5 cm, H 15,5 cm, H 31 cm, H 20,5 cm, H 25 cm, H 8,5 cm, H 10,5 cm, H 38 cm",
        "en": "Sizes: H 12.5 cm, H 15.5 cm, H 31 cm, H 20.5 cm, H 25 cm, H 8.5 cm, H 10.5 cm, H 38 cm",
        "fr": "Tailles : H 12,5 cm, H 15,5 cm, H 31 cm, H 20,5 cm, H 25 cm, H 8,5 cm, H 10,5 cm, H 38 cm",
        "it": "Misure: H 12,5 cm, H 15,5 cm, H 31 cm, H 20,5 cm, H 25 cm, H 8,5 cm, H 10,5 cm, H 38 cm"
      },
      {
        "de": "Mit den für Lyngby Porcelæn typischen Rillen.",
        "en": "Features the grooves typical of Lyngby Porcelæn.",
        "fr": "Avec les cannelures caractéristiques de Lyngby Porcelæn.",
        "it": "Con le scanalature tipiche di Lyngby Porcelæn."
      }
    ],
    "designer": "Karakter Copenhagen",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-vase-1-opt.webp",
        "width": 640,
        "height": 800,
        "alt": {
          "de": "Lyngby Porcelæn Lyngby Vase (Weiß · H 15,5 cm) – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Lyngby Vase (White · H 15.5 cm) – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Lyngby Vase (Blanc · H 15,5 cm) – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Lyngby Vase (Bianco · H 15,5 cm) – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbqsG/Lyngby-Porcelaen-Lyngby-Vase-White-200775.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-vase-2.webp",
        "width": 1600,
        "height": 1067,
        "alt": {
          "de": "Lyngby Porcelæn Lyngby Vase – Stimmungsbild des Herstellers mit dem Produkt im Raum",
          "en": "Lyngby Porcelæn Lyngby Vase – manufacturer’s lifestyle photo showing the product in a room",
          "fr": "Lyngby Porcelæn Lyngby Vase – photo d’ambiance du fabricant montrant le produit dans une pièce",
          "it": "Lyngby Porcelæn Lyngby Vase – foto d’ambiente del produttore con il prodotto nella stanza"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZdNnh/Lyngby-Porcelaen-Lyngby-Vase-Purple-200734-xZdNnh.webp?d=22399",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-vase-white-h155-cm-200775",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-vase-white-h155-cm-200775",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-vase-black-h125-cm-200800",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-vase-black-h155-cm-200802",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-vase-copenhagen-green-h125-cm-201588",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-vase-dark-green-h31-cm-200633",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-vase-light-grey-h155-cm-200818",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-vase-light-grey-h205-cm-200820",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-vase-light-grey-h25-cm-200822",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-vase-matte-white-h155-cm-200834",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-vase-matte-white-h205-cm-200836",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-vase-matte-white-h25-cm-200838",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-vase-purple-h205-cm-200734",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-vase-red-h155-cm-200733",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-vase-white-h85-cm-200766",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-vase-white-h105-cm-200768",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-vase-white-h125-cm-200770",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-vase-white-h205-cm-200783",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-vase-white-h25-cm-200785",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-vase-white-h31-cm-200792",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-vase-white-h38-cm-200794",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-lyngby-vase-glas",
      "lyngby-porcelaen-lyngby-tealight-holder",
      "lyngby-porcelaen-lyngby-tealight-holder-glas"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Schwarz · H 12,5 cm",
            "en": "Black · H 12.5 cm",
            "fr": "Noir · H 12,5 cm",
            "it": "Nero · H 12,5 cm"
          },
          "betrag": 54.95,
          "sku": "200800",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Schwarz · H 15,5 cm",
            "en": "Black · H 15.5 cm",
            "fr": "Noir · H 15,5 cm",
            "it": "Nero · H 15,5 cm"
          },
          "betrag": 74.95,
          "sku": "200802",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Copenhagen Green · H 12,5 cm",
            "en": "Copenhagen green · H 12.5 cm",
            "fr": "Copenhagen green · H 12,5 cm",
            "it": "Copenhagen green · H 12,5 cm"
          },
          "betrag": 54.95,
          "sku": "201588",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Dunkelgrün · H 31 cm",
            "en": "Dark green · H 31 cm",
            "fr": "Vert foncé · H 31 cm",
            "it": "Verde scuro · H 31 cm"
          },
          "betrag": 179.95,
          "sku": "200633",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Hellgrau · H 15,5 cm",
            "en": "Light grey · H 15.5 cm",
            "fr": "Gris clair · H 15,5 cm",
            "it": "Grigio chiaro · H 15,5 cm"
          },
          "betrag": 59.95,
          "sku": "200818",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Hellgrau · H 20,5 cm",
            "en": "Light grey · H 20.5 cm",
            "fr": "Gris clair · H 20,5 cm",
            "it": "Grigio chiaro · H 20,5 cm"
          },
          "betrag": 99.95,
          "sku": "200820",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Hellgrau · H 25 cm",
            "en": "Light grey · H 25 cm",
            "fr": "Gris clair · H 25 cm",
            "it": "Grigio chiaro · H 25 cm"
          },
          "betrag": 139.95,
          "sku": "200822",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Mattweiß · H 15,5 cm",
            "en": "Matte white · H 15.5 cm",
            "fr": "Blanc mat · H 15,5 cm",
            "it": "Bianco opaco · H 15,5 cm"
          },
          "betrag": 59.95,
          "sku": "200834",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Mattweiß · H 20,5 cm",
            "en": "Matte white · H 20.5 cm",
            "fr": "Blanc mat · H 20,5 cm",
            "it": "Bianco opaco · H 20,5 cm"
          },
          "betrag": 99.95,
          "sku": "200836",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Mattweiß · H 25 cm",
            "en": "Matte white · H 25 cm",
            "fr": "Blanc mat · H 25 cm",
            "it": "Bianco opaco · H 25 cm"
          },
          "betrag": 139.95,
          "sku": "200838",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Violett · H 20,5 cm",
            "en": "Purple · H 20.5 cm",
            "fr": "Violet · H 20,5 cm",
            "it": "Viola · H 20,5 cm"
          },
          "betrag": 99.95,
          "sku": "200734",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Rot · H 15,5 cm",
            "en": "Red · H 15.5 cm",
            "fr": "Rouge · H 15,5 cm",
            "it": "Rosso · H 15,5 cm"
          },
          "betrag": 74.95,
          "sku": "200733",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Weiß · H 8,5 cm",
            "en": "White · H 8.5 cm",
            "fr": "Blanc · H 8,5 cm",
            "it": "Bianco · H 8,5 cm"
          },
          "betrag": 26.95,
          "sku": "200766",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Weiß · H 10,5 cm",
            "en": "White · H 10.5 cm",
            "fr": "Blanc · H 10,5 cm",
            "it": "Bianco · H 10,5 cm"
          },
          "betrag": 32.95,
          "sku": "200768",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Weiß · H 12,5 cm",
            "en": "White · H 12.5 cm",
            "fr": "Blanc · H 12,5 cm",
            "it": "Bianco · H 12,5 cm"
          },
          "betrag": 44.95,
          "sku": "200770",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Weiß · H 15,5 cm",
            "en": "White · H 15.5 cm",
            "fr": "Blanc · H 15,5 cm",
            "it": "Bianco · H 15,5 cm"
          },
          "betrag": 54.95,
          "sku": "200775",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Weiß · H 20,5 cm",
            "en": "White · H 20.5 cm",
            "fr": "Blanc · H 20,5 cm",
            "it": "Bianco · H 20,5 cm"
          },
          "betrag": 64.95,
          "sku": "200783",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Weiß · H 25 cm",
            "en": "White · H 25 cm",
            "fr": "Blanc · H 25 cm",
            "it": "Bianco · H 25 cm"
          },
          "betrag": 99.95,
          "sku": "200785",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Weiß · H 31 cm",
            "en": "White · H 31 cm",
            "fr": "Blanc · H 31 cm",
            "it": "Bianco · H 31 cm"
          },
          "betrag": 149.95,
          "sku": "200792",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Weiß · H 38 cm",
            "en": "White · H 38 cm",
            "fr": "Blanc · H 38 cm",
            "it": "Bianco · H 38 cm"
          },
          "betrag": 219.95,
          "sku": "200794",
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-vase-white-h155-cm-200775"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Ausführung",
          "en": "Version",
          "fr": "Version",
          "it": "Versione"
        },
        "optionen": [
          {
            "id": "black-h-12-5-cm",
            "name": {
              "de": "Schwarz · H 12,5 cm",
              "en": "Black · H 12.5 cm",
              "fr": "Noir · H 12,5 cm",
              "it": "Nero · H 12,5 cm"
            },
            "code": "200800",
            "betrag": 54.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-vase-v200800-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Lyngby Vase (Schwarz · H 12,5 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Lyngby Vase (Black · H 12.5 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Lyngby Vase (Noir · H 12,5 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Lyngby Vase (Nero · H 12,5 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbqsM/Lyngby-Porcelaen-Lyngby-Vase-Black-200800.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "black-h-15-5-cm",
            "name": {
              "de": "Schwarz · H 15,5 cm",
              "en": "Black · H 15.5 cm",
              "fr": "Noir · H 15,5 cm",
              "it": "Nero · H 15,5 cm"
            },
            "code": "200802",
            "betrag": 74.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-vase-v200802-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Lyngby Vase (Schwarz · H 15,5 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Lyngby Vase (Black · H 15.5 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Lyngby Vase (Noir · H 15,5 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Lyngby Vase (Nero · H 15,5 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbqsN/Lyngby-Porcelaen-Lyngby-Vase-Black-200802.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "copenhagen-green-h-12-5-cm",
            "name": {
              "de": "Copenhagen Green · H 12,5 cm",
              "en": "Copenhagen green · H 12.5 cm",
              "fr": "Copenhagen green · H 12,5 cm",
              "it": "Copenhagen green · H 12,5 cm"
            },
            "code": "201588",
            "betrag": 54.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-vase-v201588-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Lyngby Vase (Copenhagen Green · H 12,5 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Lyngby Vase (Copenhagen green · H 12.5 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Lyngby Vase (Copenhagen green · H 12,5 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Lyngby Vase (Copenhagen green · H 12,5 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbqwk/Lyngby-Porcelaen-Lyngby-Vase-Copenhagen-green-201588.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "dark-green-h-31-cm",
            "name": {
              "de": "Dunkelgrün · H 31 cm",
              "en": "Dark green · H 31 cm",
              "fr": "Vert foncé · H 31 cm",
              "it": "Verde scuro · H 31 cm"
            },
            "code": "200633",
            "betrag": 179.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-vase-v200633-opt.webp",
                "width": 891,
                "height": 1114,
                "alt": {
                  "de": "Lyngby Porcelæn Lyngby Vase (Dunkelgrün · H 31 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Lyngby Vase (Dark green · H 31 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Lyngby Vase (Vert foncé · H 31 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Lyngby Vase (Verde scuro · H 31 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZcVZh/Lyngby-Porcelaen-Lyngby-Vase-Dark-green-200633-xZcVZh.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "light-grey-h-15-5-cm",
            "name": {
              "de": "Hellgrau · H 15,5 cm",
              "en": "Light grey · H 15.5 cm",
              "fr": "Gris clair · H 15,5 cm",
              "it": "Grigio chiaro · H 15,5 cm"
            },
            "code": "200818",
            "betrag": 59.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-vase-v200818-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Lyngby Vase (Hellgrau · H 15,5 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Lyngby Vase (Light grey · H 15.5 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Lyngby Vase (Gris clair · H 15,5 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Lyngby Vase (Grigio chiaro · H 15,5 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbqCD/Lyngby-Porcelaen-Lyngby-Vase-Light-grey-200818.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "light-grey-h-20-5-cm",
            "name": {
              "de": "Hellgrau · H 20,5 cm",
              "en": "Light grey · H 20.5 cm",
              "fr": "Gris clair · H 20,5 cm",
              "it": "Grigio chiaro · H 20,5 cm"
            },
            "code": "200820",
            "betrag": 99.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-vase-v200820-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Lyngby Vase (Hellgrau · H 20,5 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Lyngby Vase (Light grey · H 20.5 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Lyngby Vase (Gris clair · H 20,5 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Lyngby Vase (Grigio chiaro · H 20,5 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbqCF/Lyngby-Porcelaen-Lyngby-Vase-Light-grey-200820.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "light-grey-h-25-cm",
            "name": {
              "de": "Hellgrau · H 25 cm",
              "en": "Light grey · H 25 cm",
              "fr": "Gris clair · H 25 cm",
              "it": "Grigio chiaro · H 25 cm"
            },
            "code": "200822",
            "betrag": 139.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-vase-v200822-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Lyngby Vase (Hellgrau · H 25 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Lyngby Vase (Light grey · H 25 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Lyngby Vase (Gris clair · H 25 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Lyngby Vase (Grigio chiaro · H 25 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbqCG/Lyngby-Porcelaen-Lyngby-Vase-Light-grey-200822.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "matte-white-h-15-5-cm",
            "name": {
              "de": "Mattweiß · H 15,5 cm",
              "en": "Matte white · H 15.5 cm",
              "fr": "Blanc mat · H 15,5 cm",
              "it": "Bianco opaco · H 15,5 cm"
            },
            "code": "200834",
            "betrag": 59.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-vase-v200834-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Lyngby Vase (Mattweiß · H 15,5 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Lyngby Vase (Matte white · H 15.5 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Lyngby Vase (Blanc mat · H 15,5 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Lyngby Vase (Bianco opaco · H 15,5 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbqCH/Lyngby-Porcelaen-Lyngby-Vase-Matte-white-200834.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "matte-white-h-20-5-cm",
            "name": {
              "de": "Mattweiß · H 20,5 cm",
              "en": "Matte white · H 20.5 cm",
              "fr": "Blanc mat · H 20,5 cm",
              "it": "Bianco opaco · H 20,5 cm"
            },
            "code": "200836",
            "betrag": 99.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-vase-v200836-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Lyngby Vase (Mattweiß · H 20,5 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Lyngby Vase (Matte white · H 20.5 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Lyngby Vase (Blanc mat · H 20,5 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Lyngby Vase (Bianco opaco · H 20,5 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbqCJ/Lyngby-Porcelaen-Lyngby-Vase-Matte-white-200836.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "matte-white-h-25-cm",
            "name": {
              "de": "Mattweiß · H 25 cm",
              "en": "Matte white · H 25 cm",
              "fr": "Blanc mat · H 25 cm",
              "it": "Bianco opaco · H 25 cm"
            },
            "code": "200838",
            "betrag": 139.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-vase-v200838-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Lyngby Vase (Mattweiß · H 25 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Lyngby Vase (Matte white · H 25 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Lyngby Vase (Blanc mat · H 25 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Lyngby Vase (Bianco opaco · H 25 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbqCK/Lyngby-Porcelaen-Lyngby-Vase-Matte-white-200838.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "purple-h-20-5-cm",
            "name": {
              "de": "Violett · H 20,5 cm",
              "en": "Purple · H 20.5 cm",
              "fr": "Violet · H 20,5 cm",
              "it": "Viola · H 20,5 cm"
            },
            "code": "200734",
            "betrag": 99.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-vase-v200734-opt.webp",
                "width": 732,
                "height": 916,
                "alt": {
                  "de": "Lyngby Porcelæn Lyngby Vase (Violett · H 20,5 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Lyngby Vase (Purple · H 20.5 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Lyngby Vase (Violet · H 20,5 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Lyngby Vase (Viola · H 20,5 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZcD00/Lyngby-Porcelaen-Lyngby-Vase-Purple-200734-xZcD00.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "red-h-15-5-cm",
            "name": {
              "de": "Rot · H 15,5 cm",
              "en": "Red · H 15.5 cm",
              "fr": "Rouge · H 15,5 cm",
              "it": "Rosso · H 15,5 cm"
            },
            "code": "200733",
            "betrag": 74.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-vase-v200733-opt.webp",
                "width": 731,
                "height": 914,
                "alt": {
                  "de": "Lyngby Porcelæn Lyngby Vase (Rot · H 15,5 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Lyngby Vase (Red · H 15.5 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Lyngby Vase (Rouge · H 15,5 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Lyngby Vase (Rosso · H 15,5 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZcCZZ/Lyngby-Porcelaen-Lyngby-Vase-Red-200733-xZcCZZ.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "white-h-8-5-cm",
            "name": {
              "de": "Weiß · H 8,5 cm",
              "en": "White · H 8.5 cm",
              "fr": "Blanc · H 8,5 cm",
              "it": "Bianco · H 8,5 cm"
            },
            "code": "200766",
            "betrag": 26.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-vase-v200766-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Lyngby Vase (Weiß · H 8,5 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Lyngby Vase (White · H 8.5 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Lyngby Vase (Blanc · H 8,5 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Lyngby Vase (Bianco · H 8,5 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbqsC/Lyngby-Porcelaen-Lyngby-Vase-White-200766.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "white-h-10-5-cm",
            "name": {
              "de": "Weiß · H 10,5 cm",
              "en": "White · H 10.5 cm",
              "fr": "Blanc · H 10,5 cm",
              "it": "Bianco · H 10,5 cm"
            },
            "code": "200768",
            "betrag": 32.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-vase-v200768-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Lyngby Vase (Weiß · H 10,5 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Lyngby Vase (White · H 10.5 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Lyngby Vase (Blanc · H 10,5 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Lyngby Vase (Bianco · H 10,5 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbqsD/Lyngby-Porcelaen-Lyngby-Vase-White-200768.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "white-h-12-5-cm",
            "name": {
              "de": "Weiß · H 12,5 cm",
              "en": "White · H 12.5 cm",
              "fr": "Blanc · H 12,5 cm",
              "it": "Bianco · H 12,5 cm"
            },
            "code": "200770",
            "betrag": 44.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-vase-v200770-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Lyngby Vase (Weiß · H 12,5 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Lyngby Vase (White · H 12.5 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Lyngby Vase (Blanc · H 12,5 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Lyngby Vase (Bianco · H 12,5 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbqsF/Lyngby-Porcelaen-Lyngby-Vase-White-200770.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "white-h-15-5-cm",
            "name": {
              "de": "Weiß · H 15,5 cm",
              "en": "White · H 15.5 cm",
              "fr": "Blanc · H 15,5 cm",
              "it": "Bianco · H 15,5 cm"
            },
            "code": "200775",
            "betrag": 54.95,
            "bilder": [
              "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-vase-1-opt.webp"
            ],
            "standard": true
          },
          {
            "id": "white-h-20-5-cm",
            "name": {
              "de": "Weiß · H 20,5 cm",
              "en": "White · H 20.5 cm",
              "fr": "Blanc · H 20,5 cm",
              "it": "Bianco · H 20,5 cm"
            },
            "code": "200783",
            "betrag": 64.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-vase-v200783-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Lyngby Vase (Weiß · H 20,5 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Lyngby Vase (White · H 20.5 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Lyngby Vase (Blanc · H 20,5 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Lyngby Vase (Bianco · H 20,5 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbqsH/Lyngby-Porcelaen-Lyngby-Vase-White-200783.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "white-h-25-cm",
            "name": {
              "de": "Weiß · H 25 cm",
              "en": "White · H 25 cm",
              "fr": "Blanc · H 25 cm",
              "it": "Bianco · H 25 cm"
            },
            "code": "200785",
            "betrag": 99.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-vase-v200785-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Lyngby Vase (Weiß · H 25 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Lyngby Vase (White · H 25 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Lyngby Vase (Blanc · H 25 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Lyngby Vase (Bianco · H 25 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbqsJ/Lyngby-Porcelaen-Lyngby-Vase-White-200785.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "white-h-31-cm",
            "name": {
              "de": "Weiß · H 31 cm",
              "en": "White · H 31 cm",
              "fr": "Blanc · H 31 cm",
              "it": "Bianco · H 31 cm"
            },
            "code": "200792",
            "betrag": 149.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-vase-v200792-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Lyngby Vase (Weiß · H 31 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Lyngby Vase (White · H 31 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Lyngby Vase (Blanc · H 31 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Lyngby Vase (Bianco · H 31 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbqsK/Lyngby-Porcelaen-Lyngby-Vase-White-200792.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "white-h-38-cm",
            "name": {
              "de": "Weiß · H 38 cm",
              "en": "White · H 38 cm",
              "fr": "Blanc · H 38 cm",
              "it": "Bianco · H 38 cm"
            },
            "code": "200794",
            "betrag": 219.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-vase-v200794-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Lyngby Vase (Weiß · H 38 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Lyngby Vase (White · H 38 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Lyngby Vase (Blanc · H 38 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Lyngby Vase (Bianco · H 38 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbqsL/Lyngby-Porcelaen-Lyngby-Vase-White-200794.webp?d=22397",
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
    "slug": "lyngby-porcelaen-lyngby-radiance-vase",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "vase",
    "name": "Lyngby Radiance Vase",
    "serie": "Lyngby",
    "kurz": {
      "de": "Vase der Serie Lyngby aus Fayence.",
      "en": "Vase from the Lyngby series made of faience.",
      "fr": "Vase de la série Lyngby en faïence.",
      "it": "Vaso della serie Lyngby in maiolica."
    },
    "merkmale": [
      {
        "de": "Fayence",
        "en": "Faience",
        "fr": "Faïence",
        "it": "Maiolica"
      },
      {
        "de": "Serie: Lyngby",
        "en": "Series: Lyngby",
        "fr": "Série : Lyngby",
        "it": "Serie: Lyngby"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "15 cm"
      },
      {
        "key": "durchmesser",
        "wert": "8,5 cm"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-radiance-vase-1-opt.webp",
        "width": 862,
        "height": 1078,
        "alt": {
          "de": "Lyngby Porcelæn Lyngby Radiance Vase – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Lyngby Radiance Vase – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Lyngby Radiance Vase – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Lyngby Radiance Vase – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbqsA/Lyngby-Porcelaen-Lyngby-Radiance-Vase-Grey-200725.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-radiance-vase-2.webp",
        "width": 1600,
        "height": 1069,
        "alt": {
          "de": "Lyngby Porcelæn Lyngby Radiance Vase – Stimmungsbild des Herstellers mit dem Produkt im Raum",
          "en": "Lyngby Porcelæn Lyngby Radiance Vase – manufacturer’s lifestyle photo showing the product in a room",
          "fr": "Lyngby Porcelæn Lyngby Radiance Vase – photo d’ambiance du fabricant montrant le produit dans une pièce",
          "it": "Lyngby Porcelæn Lyngby Radiance Vase – foto d’ambiente del produttore con il prodotto nella stanza"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/2SPfzq/Lyngby-Porcelaen-Lyngby-Radiance-Vase-Grey-200725.webp?d=22399",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-radiance-vase-grey-h15-cm-200725",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-radiance-vase-grey-h15-cm-200725",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-lyngby-vase-glas",
      "lyngby-porcelaen-lyngby-tealight-holder",
      "lyngby-porcelaen-lyngby-tealight-holder-glas"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Grau",
            "en": "Grey",
            "fr": "Gris",
            "it": "Grigio"
          },
          "betrag": 54.95,
          "sku": "200725",
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-radiance-vase-grey-h15-cm-200725"
    }
  },
  {
    "slug": "lyngby-porcelaen-chapeau-bonbonniere",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "wohnaccessoire",
    "name": "Chapeau Bonbonniere",
    "serie": "Chapeau",
    "kurz": {
      "de": "Bonbonniere der Serie Chapeau aus mundgeblasenem Glas und Porzellan, entworfen von Milia Seyppel. Im Shop des Herstellers in 7 Farben und 2 Größen erhältlich.",
      "en": "Bonbonniere from the Chapeau series made of mouth-blown glass and porcelain, designed by Milia Seyppel. Available in the manufacturer’s shop in 7 colours and 2 sizes.",
      "fr": "Bonbonnière de la série Chapeau en verre soufflé à la bouche et porcelaine, dessinée par Milia Seyppel. Disponible dans la boutique du fabricant en 7 couleurs et 2 tailles.",
      "it": "Bonbonniera della serie Chapeau in vetro soffiato a bocca e porcellana, design di Milia Seyppel. Disponibile nel negozio del produttore in 7 colori e 2 misure."
    },
    "merkmale": [
      {
        "de": "Mundgeblasenes Glas / Porzellan",
        "en": "Mouth-blown glass / Porcelain",
        "fr": "Verre soufflé à la bouche / Porcelaine",
        "it": "Vetro soffiato a bocca / Porcellana"
      },
      {
        "de": "Design: Milia Seyppel",
        "en": "Design: Milia Seyppel",
        "fr": "Design : Milia Seyppel",
        "it": "Design: Milia Seyppel"
      },
      {
        "de": "Serie: Chapeau",
        "en": "Series: Chapeau",
        "fr": "Série : Chapeau",
        "it": "Serie: Chapeau"
      },
      {
        "de": "Farben: Schwarz, Camel, Klar, Copenhagen Green, Hellgrau, Mitternachtsblau, Weiß",
        "en": "Colours: Black, Camel, Clear, Copenhagen green, Light grey, Midnight blue, White",
        "fr": "Couleurs : Noir, Camel, Transparent, Copenhagen green, Gris clair, Bleu nuit, Blanc",
        "it": "Colori: Nero, Cammello, Trasparente, Copenhagen green, Grigio chiaro, Blu notte, Bianco"
      },
      {
        "de": "Größen: Ø 16 cm, Ø 12,5 cm",
        "en": "Sizes: Ø 16 cm, Ø 12.5 cm",
        "fr": "Tailles : Ø 16 cm, Ø 12,5 cm",
        "it": "Misure: Ø 16 cm, Ø 12,5 cm"
      }
    ],
    "designer": "Milia Seyppel",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-chapeau-bonbonniere-1-opt.webp",
        "width": 640,
        "height": 800,
        "alt": {
          "de": "Lyngby Porcelæn Chapeau Bonbonniere (Porzellan · Weiß · Ø 12,5 cm) – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Chapeau Bonbonniere (Porcelain · White · Ø 12.5 cm) – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Chapeau Bonbonniere (Porcelaine · Blanc · Ø 12,5 cm) – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Chapeau Bonbonniere (Porcellana · Bianco · Ø 12,5 cm) – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbqAN/Lyngby-Porcelaen-Chapeau-Bonbonniere-White-200922.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-chapeau-bonbonniere-white-oe125-cm-200922",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-chapeau-bonbonniere-white-oe125-cm-200922",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-chapeau-bonbonniere-black-oe16-cm-200910",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-chapeau-bonbonniere-camel-oe125-cm-200926",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-chapeau-bonbonniere-camel-oe16-cm-200920",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-chapeau-bonbonniere-clear-oe125-cm-200932",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-chapeau-bonbonniere-clear-oe16-cm-200928",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-chapeau-bonbonniere-copenhagen-green-oe16-cm-200908",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-chapeau-bonbonniere-light-grey-oe125-cm-200924",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-chapeau-bonbonniere-light-grey-oe16-cm-200918",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-chapeau-bonbonniere-midnight-blue-oe125-cm-200934",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-chapeau-bonbonniere-midnight-blue-oe16-cm-200930",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Glas · Schwarz · Ø 16 cm",
            "en": "Glass · Black · Ø 16 cm",
            "fr": "Verre · Noir · Ø 16 cm",
            "it": "Vetro · Nero · Ø 16 cm"
          },
          "betrag": 69,
          "sku": "200910",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Porzellan · Camel · Ø 12,5 cm",
            "en": "Porcelain · Camel · Ø 12.5 cm",
            "fr": "Porcelaine · Camel · Ø 12,5 cm",
            "it": "Porcellana · Cammello · Ø 12,5 cm"
          },
          "betrag": 55,
          "sku": "200926",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Porzellan · Camel · Ø 16 cm",
            "en": "Porcelain · Camel · Ø 16 cm",
            "fr": "Porcelaine · Camel · Ø 16 cm",
            "it": "Porcellana · Cammello · Ø 16 cm"
          },
          "betrag": 69,
          "sku": "200920",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Glas · Klar · Ø 12,5 cm",
            "en": "Glass · Clear · Ø 12.5 cm",
            "fr": "Verre · Transparent · Ø 12,5 cm",
            "it": "Vetro · Trasparente · Ø 12,5 cm"
          },
          "betrag": 55,
          "sku": "200932",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Glas · Klar · Ø 16 cm",
            "en": "Glass · Clear · Ø 16 cm",
            "fr": "Verre · Transparent · Ø 16 cm",
            "it": "Vetro · Trasparente · Ø 16 cm"
          },
          "betrag": 69,
          "sku": "200928",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Glas · Copenhagen Green · Ø 16 cm",
            "en": "Glass · Copenhagen green · Ø 16 cm",
            "fr": "Verre · Copenhagen green · Ø 16 cm",
            "it": "Vetro · Copenhagen green · Ø 16 cm"
          },
          "betrag": 69,
          "sku": "200908",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Porzellan · Hellgrau · Ø 12,5 cm",
            "en": "Porcelain · Light grey · Ø 12.5 cm",
            "fr": "Porcelaine · Gris clair · Ø 12,5 cm",
            "it": "Porcellana · Grigio chiaro · Ø 12,5 cm"
          },
          "betrag": 55,
          "sku": "200924",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Porzellan · Hellgrau · Ø 16 cm",
            "en": "Porcelain · Light grey · Ø 16 cm",
            "fr": "Porcelaine · Gris clair · Ø 16 cm",
            "it": "Porcellana · Grigio chiaro · Ø 16 cm"
          },
          "betrag": 69,
          "sku": "200918",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Glas · Mitternachtsblau · Ø 12,5 cm",
            "en": "Glass · Midnight blue · Ø 12.5 cm",
            "fr": "Verre · Bleu nuit · Ø 12,5 cm",
            "it": "Vetro · Blu notte · Ø 12,5 cm"
          },
          "betrag": 55,
          "sku": "200934",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Glas · Mitternachtsblau · Ø 16 cm",
            "en": "Glass · Midnight blue · Ø 16 cm",
            "fr": "Verre · Bleu nuit · Ø 16 cm",
            "it": "Vetro · Blu notte · Ø 16 cm"
          },
          "betrag": 69,
          "sku": "200930",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Porzellan · Weiß · Ø 12,5 cm",
            "en": "Porcelain · White · Ø 12.5 cm",
            "fr": "Porcelaine · Blanc · Ø 12,5 cm",
            "it": "Porcellana · Bianco · Ø 12,5 cm"
          },
          "betrag": 55,
          "sku": "200922",
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-chapeau-bonbonniere-white-oe125-cm-200922"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Ausführung",
          "en": "Version",
          "fr": "Version",
          "it": "Versione"
        },
        "optionen": [
          {
            "id": "glas-black-16-cm",
            "name": {
              "de": "Glas · Schwarz · Ø 16 cm",
              "en": "Glass · Black · Ø 16 cm",
              "fr": "Verre · Noir · Ø 16 cm",
              "it": "Vetro · Nero · Ø 16 cm"
            },
            "code": "200910",
            "betrag": 69,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-chapeau-bonbonniere-v200910-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Chapeau Bonbonniere (Glas · Schwarz · Ø 16 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Chapeau Bonbonniere (Glass · Black · Ø 16 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Chapeau Bonbonniere (Verre · Noir · Ø 16 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Chapeau Bonbonniere (Vetro · Nero · Ø 16 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbqAJ/Lyngby-Porcelaen-Chapeau-Bonbonniere-Black-200910.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "porzellan-camel-12-5-cm",
            "name": {
              "de": "Porzellan · Camel · Ø 12,5 cm",
              "en": "Porcelain · Camel · Ø 12.5 cm",
              "fr": "Porcelaine · Camel · Ø 12,5 cm",
              "it": "Porcellana · Cammello · Ø 12,5 cm"
            },
            "code": "200926",
            "betrag": 55,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-chapeau-bonbonniere-v200926-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Chapeau Bonbonniere (Porzellan · Camel · Ø 12,5 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Chapeau Bonbonniere (Porcelain · Camel · Ø 12.5 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Chapeau Bonbonniere (Porcelaine · Camel · Ø 12,5 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Chapeau Bonbonniere (Porcellana · Cammello · Ø 12,5 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbqAQ/Lyngby-Porcelaen-Chapeau-Bonbonniere-Camel-200926.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "porzellan-camel-16-cm",
            "name": {
              "de": "Porzellan · Camel · Ø 16 cm",
              "en": "Porcelain · Camel · Ø 16 cm",
              "fr": "Porcelaine · Camel · Ø 16 cm",
              "it": "Porcellana · Cammello · Ø 16 cm"
            },
            "code": "200920",
            "betrag": 69,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-chapeau-bonbonniere-v200920-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Chapeau Bonbonniere (Porzellan · Camel · Ø 16 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Chapeau Bonbonniere (Porcelain · Camel · Ø 16 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Chapeau Bonbonniere (Porcelaine · Camel · Ø 16 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Chapeau Bonbonniere (Porcellana · Cammello · Ø 16 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbqAM/Lyngby-Porcelaen-Chapeau-Bonbonniere-Camel-200920.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "glas-clear-12-5-cm",
            "name": {
              "de": "Glas · Klar · Ø 12,5 cm",
              "en": "Glass · Clear · Ø 12.5 cm",
              "fr": "Verre · Transparent · Ø 12,5 cm",
              "it": "Vetro · Trasparente · Ø 12,5 cm"
            },
            "code": "200932",
            "betrag": 55,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-chapeau-bonbonniere-v200932-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Chapeau Bonbonniere (Glas · Klar · Ø 12,5 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Chapeau Bonbonniere (Glass · Clear · Ø 12.5 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Chapeau Bonbonniere (Verre · Transparent · Ø 12,5 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Chapeau Bonbonniere (Vetro · Trasparente · Ø 12,5 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbqAT/Lyngby-Porcelaen-Chapeau-Bonbonniere-Clear-200932.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "glas-clear-16-cm",
            "name": {
              "de": "Glas · Klar · Ø 16 cm",
              "en": "Glass · Clear · Ø 16 cm",
              "fr": "Verre · Transparent · Ø 16 cm",
              "it": "Vetro · Trasparente · Ø 16 cm"
            },
            "code": "200928",
            "betrag": 69,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-chapeau-bonbonniere-v200928-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Chapeau Bonbonniere (Glas · Klar · Ø 16 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Chapeau Bonbonniere (Glass · Clear · Ø 16 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Chapeau Bonbonniere (Verre · Transparent · Ø 16 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Chapeau Bonbonniere (Vetro · Trasparente · Ø 16 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbqAR/Lyngby-Porcelaen-Chapeau-Bonbonniere-Clear-200928.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "glas-copenhagen-green-16-cm",
            "name": {
              "de": "Glas · Copenhagen Green · Ø 16 cm",
              "en": "Glass · Copenhagen green · Ø 16 cm",
              "fr": "Verre · Copenhagen green · Ø 16 cm",
              "it": "Vetro · Copenhagen green · Ø 16 cm"
            },
            "code": "200908",
            "betrag": 69,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-chapeau-bonbonniere-v200908-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Chapeau Bonbonniere (Glas · Copenhagen Green · Ø 16 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Chapeau Bonbonniere (Glass · Copenhagen green · Ø 16 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Chapeau Bonbonniere (Verre · Copenhagen green · Ø 16 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Chapeau Bonbonniere (Vetro · Copenhagen green · Ø 16 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbqAH/Lyngby-Porcelaen-Chapeau-Bonbonniere-Copenhagen-green-200908.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "porzellan-light-grey-12-5-cm",
            "name": {
              "de": "Porzellan · Hellgrau · Ø 12,5 cm",
              "en": "Porcelain · Light grey · Ø 12.5 cm",
              "fr": "Porcelaine · Gris clair · Ø 12,5 cm",
              "it": "Porcellana · Grigio chiaro · Ø 12,5 cm"
            },
            "code": "200924",
            "betrag": 55,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-chapeau-bonbonniere-v200924-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Chapeau Bonbonniere (Porzellan · Hellgrau · Ø 12,5 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Chapeau Bonbonniere (Porcelain · Light grey · Ø 12.5 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Chapeau Bonbonniere (Porcelaine · Gris clair · Ø 12,5 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Chapeau Bonbonniere (Porcellana · Grigio chiaro · Ø 12,5 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbqAP/Lyngby-Porcelaen-Chapeau-Bonbonniere-Light-grey-200924.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "porzellan-light-grey-16-cm",
            "name": {
              "de": "Porzellan · Hellgrau · Ø 16 cm",
              "en": "Porcelain · Light grey · Ø 16 cm",
              "fr": "Porcelaine · Gris clair · Ø 16 cm",
              "it": "Porcellana · Grigio chiaro · Ø 16 cm"
            },
            "code": "200918",
            "betrag": 69,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-chapeau-bonbonniere-v200918-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Chapeau Bonbonniere (Porzellan · Hellgrau · Ø 16 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Chapeau Bonbonniere (Porcelain · Light grey · Ø 16 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Chapeau Bonbonniere (Porcelaine · Gris clair · Ø 16 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Chapeau Bonbonniere (Porcellana · Grigio chiaro · Ø 16 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbqAL/Lyngby-Porcelaen-Chapeau-Bonbonniere-Light-grey-200918.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "glas-midnight-blue-12-5-cm",
            "name": {
              "de": "Glas · Mitternachtsblau · Ø 12,5 cm",
              "en": "Glass · Midnight blue · Ø 12.5 cm",
              "fr": "Verre · Bleu nuit · Ø 12,5 cm",
              "it": "Vetro · Blu notte · Ø 12,5 cm"
            },
            "code": "200934",
            "betrag": 55,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-chapeau-bonbonniere-v200934-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Chapeau Bonbonniere (Glas · Mitternachtsblau · Ø 12,5 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Chapeau Bonbonniere (Glass · Midnight blue · Ø 12.5 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Chapeau Bonbonniere (Verre · Bleu nuit · Ø 12,5 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Chapeau Bonbonniere (Vetro · Blu notte · Ø 12,5 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbqAV/Lyngby-Porcelaen-Chapeau-Bonbonniere-Midnight-blue-200934.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "glas-midnight-blue-16-cm",
            "name": {
              "de": "Glas · Mitternachtsblau · Ø 16 cm",
              "en": "Glass · Midnight blue · Ø 16 cm",
              "fr": "Verre · Bleu nuit · Ø 16 cm",
              "it": "Vetro · Blu notte · Ø 16 cm"
            },
            "code": "200930",
            "betrag": 69,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-chapeau-bonbonniere-v200930-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Chapeau Bonbonniere (Glas · Mitternachtsblau · Ø 16 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Chapeau Bonbonniere (Glass · Midnight blue · Ø 16 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Chapeau Bonbonniere (Verre · Bleu nuit · Ø 16 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Chapeau Bonbonniere (Vetro · Blu notte · Ø 16 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbqAS/Lyngby-Porcelaen-Chapeau-Bonbonniere-Midnight-blue-200930.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "porzellan-white-12-5-cm",
            "name": {
              "de": "Porzellan · Weiß · Ø 12,5 cm",
              "en": "Porcelain · White · Ø 12.5 cm",
              "fr": "Porcelaine · Blanc · Ø 12,5 cm",
              "it": "Porcellana · Bianco · Ø 12,5 cm"
            },
            "code": "200922",
            "betrag": 55,
            "bilder": [
              "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-chapeau-bonbonniere-1-opt.webp"
            ],
            "standard": true
          }
        ]
      }
    ]
  },
  {
    "slug": "lyngby-porcelaen-twist-vase",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "vase",
    "name": "Twist Vase",
    "serie": "Twist",
    "kurz": {
      "de": "Vase der Serie Twist aus Porzellan. Im Shop des Herstellers in 3 Größen erhältlich.",
      "en": "Vase from the Twist series made of porcelain. Available in the manufacturer’s shop in 3 sizes.",
      "fr": "Vase de la série Twist en porcelaine. Disponible dans la boutique du fabricant en 3 tailles.",
      "it": "Vaso della serie Twist in porcellana. Disponibile nel negozio del produttore in 3 misure."
    },
    "merkmale": [
      {
        "de": "Porzellan",
        "en": "Porcelain",
        "fr": "Porcelaine",
        "it": "Porcellana"
      },
      {
        "de": "Serie: Twist",
        "en": "Series: Twist",
        "fr": "Série : Twist",
        "it": "Serie: Twist"
      },
      {
        "de": "Größen: H 18 cm, H 25 cm, H 31 cm",
        "en": "Sizes: H 18 cm, H 25 cm, H 31 cm",
        "fr": "Tailles : H 18 cm, H 25 cm, H 31 cm",
        "it": "Misure: H 18 cm, H 25 cm, H 31 cm"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-twist-vase-1-opt.webp",
        "width": 847,
        "height": 1059,
        "alt": {
          "de": "Lyngby Porcelæn Twist Vase (H 18 cm) – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Twist Vase (H 18 cm) – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Twist Vase (H 18 cm) – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Twist Vase (H 18 cm) – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/5FPFQ6S/Lyngby-Porcelaen-Twist-Vase-White-201020-5FPFQ6S.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-twist-vase-2.webp",
        "width": 1080,
        "height": 1527,
        "alt": {
          "de": "Lyngby Porcelæn Twist Vase (H 18 cm) – weitere Ansicht des Herstellers",
          "en": "Lyngby Porcelæn Twist Vase (H 18 cm) – further view by the manufacturer",
          "fr": "Lyngby Porcelæn Twist Vase (H 18 cm) – autre vue du fabricant",
          "it": "Lyngby Porcelæn Twist Vase (H 18 cm) – altra vista del produttore"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/5FPG3G3/Lyngby-Porcelaen-Twist-Vase-White-201020-5FPG3G3.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "detail"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-twist-vase-3.webp",
        "width": 1067,
        "height": 1600,
        "alt": {
          "de": "Lyngby Porcelæn Twist Vase – Stimmungsbild des Herstellers mit dem Produkt im Raum",
          "en": "Lyngby Porcelæn Twist Vase – manufacturer’s lifestyle photo showing the product in a room",
          "fr": "Lyngby Porcelæn Twist Vase – photo d’ambiance du fabricant montrant le produit dans une pièce",
          "it": "Lyngby Porcelæn Twist Vase – foto d’ambiente del produttore con il prodotto nella stanza"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/OGPxKDgTkybn/Lyngby-Porcelaen-Twist-Vase-White-201020-OGPxKDgTkybn.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-twist-vase-white-h18-cm-201020",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-twist-vase-white-h18-cm-201020",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-twist-vase-white-h25-cm-201021",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-twist-vase-white-h31-cm-201022",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "H 18 cm",
            "en": "H 18 cm",
            "fr": "H 18 cm",
            "it": "H 18 cm"
          },
          "betrag": 69.95,
          "sku": "201020",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "H 25 cm",
            "en": "H 25 cm",
            "fr": "H 25 cm",
            "it": "H 25 cm"
          },
          "betrag": 99.95,
          "sku": "201021",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "H 31 cm",
            "en": "H 31 cm",
            "fr": "H 31 cm",
            "it": "H 31 cm"
          },
          "betrag": 169.95,
          "sku": "201022",
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-twist-vase-white-h18-cm-201020"
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
            "id": "h-18-cm",
            "name": {
              "de": "H 18 cm",
              "en": "H 18 cm",
              "fr": "H 18 cm",
              "it": "H 18 cm"
            },
            "code": "201020",
            "betrag": 69.95,
            "bilder": [
              "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-twist-vase-1-opt.webp"
            ],
            "standard": true
          },
          {
            "id": "h-25-cm",
            "name": {
              "de": "H 25 cm",
              "en": "H 25 cm",
              "fr": "H 25 cm",
              "it": "H 25 cm"
            },
            "code": "201021",
            "betrag": 99.95
          },
          {
            "id": "h-31-cm",
            "name": {
              "de": "H 31 cm",
              "en": "H 31 cm",
              "fr": "H 31 cm",
              "it": "H 31 cm"
            },
            "code": "201022",
            "betrag": 169.95
          }
        ]
      }
    ]
  },
  {
    "slug": "lyngby-porcelaen-rhombe-tea-cup-with-saucer",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "geschirr",
    "name": "Rhombe Tea cup with saucer",
    "serie": "Rhombe",
    "kurz": {
      "de": "Teetasse mit Untertasse der Serie Rhombe aus Porzellan. Im Shop des Herstellers in 2 Größen erhältlich.",
      "en": "Tea cup with saucer from the Rhombe series made of porcelain. Available in the manufacturer’s shop in 2 sizes.",
      "fr": "Tasse à thé avec soucoupe de la série Rhombe en porcelaine. Disponible dans la boutique du fabricant en 2 tailles.",
      "it": "Tazza da tè con piattino della serie Rhombe in porcellana. Disponibile nel negozio del produttore in 2 misure."
    },
    "merkmale": [
      {
        "de": "Porzellan",
        "en": "Porcelain",
        "fr": "Porcelaine",
        "it": "Porcellana"
      },
      {
        "de": "Serie: Rhombe",
        "en": "Series: Rhombe",
        "fr": "Série : Rhombe",
        "it": "Serie: Rhombe"
      },
      {
        "de": "Größen: 24 cl, 39 cl",
        "en": "Sizes: 24 cl, 39 cl",
        "fr": "Tailles : 24 cl, 39 cl",
        "it": "Misure: 24 cl, 39 cl"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-tea-cup-with-saucer-1-opt.webp",
        "width": 640,
        "height": 800,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Tea cup with saucer (24 cl) – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Rhombe Tea cup with saucer (24 cl) – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Rhombe Tea cup with saucer (24 cl) – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Rhombe Tea cup with saucer (24 cl) – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZ97qt/Lyngby-Porcelaen-Rhombe-Tea-cup-with-saucer-White-201207.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-tea-cup-with-saucer-white-24-cl-201207",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-tea-cup-with-saucer-white-24-cl-201207",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-tea-cup-with-saucer-white-39-cl-201202",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-rhombe-teapot",
      "lyngby-porcelaen-rhombe-serving-bowl",
      "lyngby-porcelaen-rhombe-oval-serving-dish"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "24 cl",
            "en": "24 cl",
            "fr": "24 cl",
            "it": "24 cl"
          },
          "betrag": 34.95,
          "sku": "201207",
          "inhaltMl": 240,
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "39 cl",
            "en": "39 cl",
            "fr": "39 cl",
            "it": "39 cl"
          },
          "betrag": 44.95,
          "sku": "201202",
          "inhaltMl": 390,
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-tea-cup-with-saucer-white-24-cl-201207"
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
            "id": "24-cl",
            "name": {
              "de": "24 cl",
              "en": "24 cl",
              "fr": "24 cl",
              "it": "24 cl"
            },
            "code": "201207",
            "betrag": 34.95,
            "bilder": [
              "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-tea-cup-with-saucer-1-opt.webp"
            ],
            "standard": true
          },
          {
            "id": "39-cl",
            "name": {
              "de": "39 cl",
              "en": "39 cl",
              "fr": "39 cl",
              "it": "39 cl"
            },
            "code": "201202",
            "betrag": 44.95
          }
        ]
      }
    ]
  },
  {
    "slug": "lyngby-porcelaen-rhombe-teapot",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "geschirr",
    "name": "Rhombe Teapot",
    "serie": "Rhombe",
    "kurz": {
      "de": "Teekanne der Serie Rhombe aus Porzellan, entworfen von Stilleben v/Reckweg & Nordentoft. Das Rautenmuster stammt laut Hersteller aus dem Designarchiv von Lyngby Porcelæn und erschien erstmals 1961 auf der Serie Dan-Ild.",
      "en": "Teapot from the Rhombe series made of porcelain, designed by Stilleben v/Reckweg & Nordentoft. According to the manufacturer, the rhombus pattern comes from the Lyngby Porcelæn design archive and first appeared on the Dan-Ild range in 1961.",
      "fr": "Théière de la série Rhombe en porcelaine, dessinée par Stilleben v/Reckweg & Nordentoft. Selon le fabricant, le motif en losange provient des archives de Lyngby Porcelæn et est apparu pour la première fois en 1961 sur la série Dan-Ild.",
      "it": "Teiera della serie Rhombe in porcellana, design di Stilleben v/Reckweg & Nordentoft. Secondo il produttore, il motivo a rombi proviene dall’archivio di Lyngby Porcelæn ed è apparso per la prima volta nel 1961 sulla serie Dan-Ild."
    },
    "merkmale": [
      {
        "de": "Porzellan",
        "en": "Porcelain",
        "fr": "Porcelaine",
        "it": "Porcellana"
      },
      {
        "de": "Design: Stilleben v/Reckweg & Nordentoft",
        "en": "Design: Stilleben v/Reckweg & Nordentoft",
        "fr": "Design : Stilleben v/Reckweg & Nordentoft",
        "it": "Design: Stilleben v/Reckweg & Nordentoft"
      },
      {
        "de": "Serie: Rhombe",
        "en": "Series: Rhombe",
        "fr": "Série : Rhombe",
        "it": "Serie: Rhombe"
      },
      {
        "de": "Volumen 1,9 l",
        "en": "Volume 1.9 l",
        "fr": "Contenance 1,9 l",
        "it": "Capacità 1,9 l"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "18,5 cm"
      },
      {
        "key": "breite",
        "wert": "26,5 cm"
      },
      {
        "key": "durchmesser",
        "wert": "26,5 cm"
      }
    ],
    "designer": "Stilleben v/Reckweg & Nordentoft",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-teapot-1-opt.webp",
        "width": 950,
        "height": 1188,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Teapot – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Rhombe Teapot – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Rhombe Teapot – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Rhombe Teapot – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbksL/Lyngby-Porcelaen-Rhombe-Teapot-White-201203.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-teapot-white-19-l-201203",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-teapot-white-19-l-201203",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-rhombe-tea-cup-with-saucer",
      "lyngby-porcelaen-rhombe-serving-bowl",
      "lyngby-porcelaen-rhombe-oval-serving-dish"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Weiß",
            "en": "White",
            "fr": "Blanc",
            "it": "Bianco"
          },
          "betrag": 139.95,
          "sku": "201203",
          "inhaltMl": 1900,
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-teapot-white-19-l-201203"
    }
  },
  {
    "slug": "lyngby-porcelaen-rhombe-serving-bowl",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "geschirr",
    "name": "Rhombe Serving bowl",
    "serie": "Rhombe",
    "kurz": {
      "de": "Servierschale der Serie Rhombe aus Porzellan. Im Shop des Herstellers in 3 Größen erhältlich.",
      "en": "Serving bowl from the Rhombe series made of porcelain. Available in the manufacturer’s shop in 3 sizes.",
      "fr": "Saladier de service de la série Rhombe en porcelaine. Disponible dans la boutique du fabricant en 3 tailles.",
      "it": "Ciotola da portata della serie Rhombe in porcellana. Disponibile nel negozio del produttore in 3 misure."
    },
    "merkmale": [
      {
        "de": "Porzellan",
        "en": "Porcelain",
        "fr": "Porcelaine",
        "it": "Porcellana"
      },
      {
        "de": "Serie: Rhombe",
        "en": "Series: Rhombe",
        "fr": "Série : Rhombe",
        "it": "Serie: Rhombe"
      },
      {
        "de": "Größen: Ø 17,5 cm, Ø 22 cm, Ø 28,5 cm",
        "en": "Sizes: Ø 17.5 cm, Ø 22 cm, Ø 28.5 cm",
        "fr": "Tailles : Ø 17,5 cm, Ø 22 cm, Ø 28,5 cm",
        "it": "Misure: Ø 17,5 cm, Ø 22 cm, Ø 28,5 cm"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-serving-bowl-1-opt.webp",
        "width": 988,
        "height": 1234,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Serving bowl (Ø 28,5 cm) – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Rhombe Serving bowl (Ø 28.5 cm) – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Rhombe Serving bowl (Ø 28,5 cm) – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Rhombe Serving bowl (Ø 28,5 cm) – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZd39L/Lyngby-Porcelaen-Rhombe-Serving-bowl-White-201204-xZd39L.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-serving-bowl-2.webp",
        "width": 1080,
        "height": 1527,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Serving bowl (Ø 28,5 cm) – weitere Ansicht des Herstellers",
          "en": "Lyngby Porcelæn Rhombe Serving bowl (Ø 28.5 cm) – further view by the manufacturer",
          "fr": "Lyngby Porcelæn Rhombe Serving bowl (Ø 28,5 cm) – autre vue du fabricant",
          "it": "Lyngby Porcelæn Rhombe Serving bowl (Ø 28,5 cm) – altra vista del produttore"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZd39M/Lyngby-Porcelaen-Rhombe-Serving-bowl-White-201204-xZd39M.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "detail"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-serving-bowl-3.webp",
        "width": 1600,
        "height": 1105,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Serving bowl – Stimmungsbild des Herstellers mit dem Produkt im Raum",
          "en": "Lyngby Porcelæn Rhombe Serving bowl – manufacturer’s lifestyle photo showing the product in a room",
          "fr": "Lyngby Porcelæn Rhombe Serving bowl – photo d’ambiance du fabricant montrant le produit dans une pièce",
          "it": "Lyngby Porcelæn Rhombe Serving bowl – foto d’ambiente del produttore con il prodotto nella stanza"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/2SPfzA/Lyngby-Porcelaen-Rhombe-Serving-bowl-White-201208.webp?d=22399",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-serving-bowl-white-oe28-cm-201204",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-serving-bowl-white-oe28-cm-201204",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-serving-bowl-white-oe175-cm-201208",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-serving-bowl-white-oe22-cm-201210",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-rhombe-tea-cup-with-saucer",
      "lyngby-porcelaen-rhombe-teapot",
      "lyngby-porcelaen-rhombe-oval-serving-dish"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Ø 17,5 cm",
            "en": "Ø 17.5 cm",
            "fr": "Ø 17,5 cm",
            "it": "Ø 17,5 cm"
          },
          "betrag": 49.95,
          "sku": "201208",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Ø 22 cm",
            "en": "Ø 22 cm",
            "fr": "Ø 22 cm",
            "it": "Ø 22 cm"
          },
          "betrag": 64.95,
          "sku": "201210",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Ø 28,5 cm",
            "en": "Ø 28.5 cm",
            "fr": "Ø 28,5 cm",
            "it": "Ø 28,5 cm"
          },
          "betrag": 84.95,
          "sku": "201204",
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-serving-bowl-white-oe28-cm-201204"
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
            "id": "17-5-cm",
            "name": {
              "de": "Ø 17,5 cm",
              "en": "Ø 17.5 cm",
              "fr": "Ø 17,5 cm",
              "it": "Ø 17,5 cm"
            },
            "code": "201208",
            "betrag": 49.95
          },
          {
            "id": "22-cm",
            "name": {
              "de": "Ø 22 cm",
              "en": "Ø 22 cm",
              "fr": "Ø 22 cm",
              "it": "Ø 22 cm"
            },
            "code": "201210",
            "betrag": 64.95
          },
          {
            "id": "28-5-cm",
            "name": {
              "de": "Ø 28,5 cm",
              "en": "Ø 28.5 cm",
              "fr": "Ø 28,5 cm",
              "it": "Ø 28,5 cm"
            },
            "code": "201204",
            "betrag": 84.95,
            "bilder": [
              "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-serving-bowl-1-opt.webp"
            ],
            "standard": true
          }
        ]
      }
    ]
  },
  {
    "slug": "lyngby-porcelaen-rhombe-oval-serving-dish",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "geschirr",
    "name": "Rhombe Oval serving dish",
    "serie": "Rhombe",
    "kurz": {
      "de": "Ovale Servierplatte der Serie Rhombe aus Porzellan, entworfen von Karakter Copenhagen. Im Shop des Herstellers in 2 Größen erhältlich.",
      "en": "Oval serving dish from the Rhombe series made of porcelain, designed by Karakter Copenhagen. Available in the manufacturer’s shop in 2 sizes.",
      "fr": "Plat de service ovale de la série Rhombe en porcelaine, dessinée par Karakter Copenhagen. Disponible dans la boutique du fabricant en 2 tailles.",
      "it": "Piatto da portata ovale della serie Rhombe in porcellana, design di Karakter Copenhagen. Disponibile nel negozio del produttore in 2 misure."
    },
    "merkmale": [
      {
        "de": "Porzellan",
        "en": "Porcelain",
        "fr": "Porcelaine",
        "it": "Porcellana"
      },
      {
        "de": "Design: Karakter Copenhagen",
        "en": "Design: Karakter Copenhagen",
        "fr": "Design : Karakter Copenhagen",
        "it": "Design: Karakter Copenhagen"
      },
      {
        "de": "Serie: Rhombe",
        "en": "Series: Rhombe",
        "fr": "Série : Rhombe",
        "it": "Serie: Rhombe"
      },
      {
        "de": "Größen: 35x26,5 cm, 42x32 cm",
        "en": "Sizes: 35x26.5 cm, 42x32 cm",
        "fr": "Tailles : 35x26,5 cm, 42x32 cm",
        "it": "Misure: 35x26,5 cm, 42x32 cm"
      }
    ],
    "designer": "Karakter Copenhagen",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-oval-serving-dish-1-opt.webp",
        "width": 1036,
        "height": 1295,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Oval serving dish (42x32 cm) – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Rhombe Oval serving dish (42x32 cm) – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Rhombe Oval serving dish (42x32 cm) – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Rhombe Oval serving dish (42x32 cm) – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZb9Pm/Lyngby-Porcelaen-Rhombe-Oval-serving-dish-White-201955-xZb9Pm.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-oval-serving-dish-2.webp",
        "width": 1080,
        "height": 1543,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Oval serving dish (42x32 cm) – weitere Ansicht des Herstellers",
          "en": "Lyngby Porcelæn Rhombe Oval serving dish (42x32 cm) – further view by the manufacturer",
          "fr": "Lyngby Porcelæn Rhombe Oval serving dish (42x32 cm) – autre vue du fabricant",
          "it": "Lyngby Porcelæn Rhombe Oval serving dish (42x32 cm) – altra vista del produttore"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZb9Pn/Lyngby-Porcelaen-Rhombe-Oval-serving-dish-White-201955-xZb9Pn.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "detail"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-oval-serving-dish-3.webp",
        "width": 1067,
        "height": 1600,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Oval serving dish – Stimmungsbild des Herstellers mit dem Produkt im Raum",
          "en": "Lyngby Porcelæn Rhombe Oval serving dish – manufacturer’s lifestyle photo showing the product in a room",
          "fr": "Lyngby Porcelæn Rhombe Oval serving dish – photo d’ambiance du fabricant montrant le produit dans une pièce",
          "it": "Lyngby Porcelæn Rhombe Oval serving dish – foto d’ambiente del produttore con il prodotto nella stanza"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/2SPfzz/Lyngby-Porcelaen-Rhombe-Oval-serving-dish-White-201205.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-oval-serving-dish-white-42x32-cm-201955",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-oval-serving-dish-white-42x32-cm-201955",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-oval-serving-dish-white-35x265-cm-201205",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-rhombe-tea-cup-with-saucer",
      "lyngby-porcelaen-rhombe-teapot",
      "lyngby-porcelaen-rhombe-serving-bowl"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "35x26,5 cm",
            "en": "35x26.5 cm",
            "fr": "35x26,5 cm",
            "it": "35x26,5 cm"
          },
          "betrag": 62.95,
          "sku": "201205",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "42x32 cm",
            "en": "42x32 cm",
            "fr": "42x32 cm",
            "it": "42x32 cm"
          },
          "betrag": 89.95,
          "sku": "201955",
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-oval-serving-dish-white-42x32-cm-201955"
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
            "id": "35x26-5-cm",
            "name": {
              "de": "35x26,5 cm",
              "en": "35x26.5 cm",
              "fr": "35x26,5 cm",
              "it": "35x26,5 cm"
            },
            "code": "201205",
            "betrag": 62.95
          },
          {
            "id": "42x32-cm",
            "name": {
              "de": "42x32 cm",
              "en": "42x32 cm",
              "fr": "42x32 cm",
              "it": "42x32 cm"
            },
            "code": "201955",
            "betrag": 89.95,
            "bilder": [
              "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-oval-serving-dish-1-opt.webp"
            ],
            "standard": true
          }
        ]
      }
    ]
  },
  {
    "slug": "lyngby-porcelaen-rhombe-etagere",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "geschirr",
    "name": "Rhombe Etagere",
    "serie": "Rhombe",
    "kurz": {
      "de": "Etagere der Serie Rhombe aus Porzellan, entworfen von Karakter Copenhagen. Das Rautenmuster stammt laut Hersteller aus dem Designarchiv von Lyngby Porcelæn und erschien erstmals 1961 auf der Serie Dan-Ild.",
      "en": "Etagere from the Rhombe series made of porcelain, designed by Karakter Copenhagen. According to the manufacturer, the rhombus pattern comes from the Lyngby Porcelæn design archive and first appeared on the Dan-Ild range in 1961.",
      "fr": "Présentoir à étages de la série Rhombe en porcelaine, dessinée par Karakter Copenhagen. Selon le fabricant, le motif en losange provient des archives de Lyngby Porcelæn et est apparu pour la première fois en 1961 sur la série Dan-Ild.",
      "it": "Alzata della serie Rhombe in porcellana, design di Karakter Copenhagen. Secondo il produttore, il motivo a rombi proviene dall’archivio di Lyngby Porcelæn ed è apparso per la prima volta nel 1961 sulla serie Dan-Ild."
    },
    "merkmale": [
      {
        "de": "Porzellan",
        "en": "Porcelain",
        "fr": "Porcelaine",
        "it": "Porcellana"
      },
      {
        "de": "Design: Karakter Copenhagen",
        "en": "Design: Karakter Copenhagen",
        "fr": "Design : Karakter Copenhagen",
        "it": "Design: Karakter Copenhagen"
      },
      {
        "de": "Serie: Rhombe",
        "en": "Series: Rhombe",
        "fr": "Série : Rhombe",
        "it": "Serie: Rhombe"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "27 cm"
      },
      {
        "key": "durchmesser",
        "wert": "27 cm"
      }
    ],
    "designer": "Karakter Copenhagen",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-etagere-1-opt.webp",
        "width": 1034,
        "height": 1292,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Etagere – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Rhombe Etagere – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Rhombe Etagere – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Rhombe Etagere – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZ97qs/Lyngby-Porcelaen-Rhombe-Etagere-White-201206.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-etagere-2.webp",
        "width": 1600,
        "height": 1067,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Etagere – Stimmungsbild des Herstellers mit dem Produkt im Raum",
          "en": "Lyngby Porcelæn Rhombe Etagere – manufacturer’s lifestyle photo showing the product in a room",
          "fr": "Lyngby Porcelæn Rhombe Etagere – photo d’ambiance du fabricant montrant le produit dans une pièce",
          "it": "Lyngby Porcelæn Rhombe Etagere – foto d’ambiente del produttore con il prodotto nella stanza"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/2SP8xV/Lyngby-Porcelaen-Rhombe-Etagere-White-201206.webp?d=22399",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-etagere-white-oe27-cm-201206",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-etagere-white-oe27-cm-201206",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-rhombe-tea-cup-with-saucer",
      "lyngby-porcelaen-rhombe-teapot",
      "lyngby-porcelaen-rhombe-serving-bowl"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Weiß",
            "en": "White",
            "fr": "Blanc",
            "it": "Bianco"
          },
          "betrag": 76.95,
          "sku": "201206",
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-etagere-white-oe27-cm-201206"
    }
  },
  {
    "slug": "lyngby-porcelaen-rhombe-bowl",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "geschirr",
    "name": "Rhombe Bowl",
    "serie": "Rhombe",
    "kurz": {
      "de": "Schale der Serie Rhombe aus Porzellan. Im Shop des Herstellers in 3 Größen erhältlich.",
      "en": "Bowl from the Rhombe series made of porcelain. Available in the manufacturer’s shop in 3 sizes.",
      "fr": "Bol de la série Rhombe en porcelaine. Disponible dans la boutique du fabricant en 3 tailles.",
      "it": "Ciotola della serie Rhombe in porcellana. Disponibile nel negozio del produttore in 3 misure."
    },
    "merkmale": [
      {
        "de": "Porzellan",
        "en": "Porcelain",
        "fr": "Porcelaine",
        "it": "Porcellana"
      },
      {
        "de": "Serie: Rhombe",
        "en": "Series: Rhombe",
        "fr": "Série : Rhombe",
        "it": "Serie: Rhombe"
      },
      {
        "de": "Größen: Ø 11 cm, Ø 13 cm, Ø 15,5 cm",
        "en": "Sizes: Ø 11 cm, Ø 13 cm, Ø 15.5 cm",
        "fr": "Tailles : Ø 11 cm, Ø 13 cm, Ø 15,5 cm",
        "it": "Misure: Ø 11 cm, Ø 13 cm, Ø 15,5 cm"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-bowl-1-opt.webp",
        "width": 895,
        "height": 1119,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Bowl (Ø 15,5 cm) – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Rhombe Bowl (Ø 15.5 cm) – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Rhombe Bowl (Ø 15,5 cm) – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Rhombe Bowl (Ø 15,5 cm) – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZcCSt/Lyngby-Porcelaen-Rhombe-Bowl-White-201227-xZcCSt.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-bowl-2.webp",
        "width": 1080,
        "height": 1527,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Bowl (Ø 15,5 cm) – weitere Ansicht des Herstellers",
          "en": "Lyngby Porcelæn Rhombe Bowl (Ø 15.5 cm) – further view by the manufacturer",
          "fr": "Lyngby Porcelæn Rhombe Bowl (Ø 15,5 cm) – autre vue du fabricant",
          "it": "Lyngby Porcelæn Rhombe Bowl (Ø 15,5 cm) – altra vista del produttore"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbJwP/Lyngby-Porcelaen-Rhombe-Bowl-White-201227-xZbJwP.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "detail"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-bowl-3.webp",
        "width": 1600,
        "height": 1073,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Bowl – Stimmungsbild des Herstellers mit dem Produkt im Raum",
          "en": "Lyngby Porcelæn Rhombe Bowl – manufacturer’s lifestyle photo showing the product in a room",
          "fr": "Lyngby Porcelæn Rhombe Bowl – photo d’ambiance du fabricant montrant le produit dans une pièce",
          "it": "Lyngby Porcelæn Rhombe Bowl – foto d’ambiente del produttore con il prodotto nella stanza"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbjH1/Lyngby-Porcelaen-Rhombe-Bowl-White-201227.webp?d=22399",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-bowl-white-oe155-cm-201227",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-bowl-white-oe155-cm-201227",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-bowl-white-oe11-cm-201209",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-bowl-white-oe13-cm-201232",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-rhombe-tea-cup-with-saucer",
      "lyngby-porcelaen-rhombe-teapot",
      "lyngby-porcelaen-rhombe-serving-bowl"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Ø 11 cm",
            "en": "Ø 11 cm",
            "fr": "Ø 11 cm",
            "it": "Ø 11 cm"
          },
          "betrag": 24.95,
          "sku": "201209",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Ø 13 cm",
            "en": "Ø 13 cm",
            "fr": "Ø 13 cm",
            "it": "Ø 13 cm"
          },
          "betrag": 27.95,
          "sku": "201232",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Ø 15,5 cm",
            "en": "Ø 15.5 cm",
            "fr": "Ø 15,5 cm",
            "it": "Ø 15,5 cm"
          },
          "betrag": 29.95,
          "sku": "201227",
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-bowl-white-oe155-cm-201227"
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
            "id": "11-cm",
            "name": {
              "de": "Ø 11 cm",
              "en": "Ø 11 cm",
              "fr": "Ø 11 cm",
              "it": "Ø 11 cm"
            },
            "code": "201209",
            "betrag": 24.95
          },
          {
            "id": "13-cm",
            "name": {
              "de": "Ø 13 cm",
              "en": "Ø 13 cm",
              "fr": "Ø 13 cm",
              "it": "Ø 13 cm"
            },
            "code": "201232",
            "betrag": 27.95
          },
          {
            "id": "15-5-cm",
            "name": {
              "de": "Ø 15,5 cm",
              "en": "Ø 15.5 cm",
              "fr": "Ø 15,5 cm",
              "it": "Ø 15,5 cm"
            },
            "code": "201227",
            "betrag": 29.95,
            "bilder": [
              "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-bowl-1-opt.webp"
            ],
            "standard": true
          }
        ]
      }
    ]
  },
  {
    "slug": "lyngby-porcelaen-rhombe-sauce-boat",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "geschirr",
    "name": "Rhombe Sauce boat",
    "serie": "Rhombe",
    "kurz": {
      "de": "Sauciere der Serie Rhombe aus Porzellan, entworfen von Karakter Copenhagen. Das Rautenmuster stammt laut Hersteller aus dem Designarchiv von Lyngby Porcelæn und erschien erstmals 1961 auf der Serie Dan-Ild.",
      "en": "Sauce boat from the Rhombe series made of porcelain, designed by Karakter Copenhagen. According to the manufacturer, the rhombus pattern comes from the Lyngby Porcelæn design archive and first appeared on the Dan-Ild range in 1961.",
      "fr": "Saucière de la série Rhombe en porcelaine, dessinée par Karakter Copenhagen. Selon le fabricant, le motif en losange provient des archives de Lyngby Porcelæn et est apparu pour la première fois en 1961 sur la série Dan-Ild.",
      "it": "Salsiera della serie Rhombe in porcellana, design di Karakter Copenhagen. Secondo il produttore, il motivo a rombi proviene dall’archivio di Lyngby Porcelæn ed è apparso per la prima volta nel 1961 sulla serie Dan-Ild."
    },
    "merkmale": [
      {
        "de": "Porzellan",
        "en": "Porcelain",
        "fr": "Porcelaine",
        "it": "Porcellana"
      },
      {
        "de": "Design: Karakter Copenhagen",
        "en": "Design: Karakter Copenhagen",
        "fr": "Design : Karakter Copenhagen",
        "it": "Design: Karakter Copenhagen"
      },
      {
        "de": "Serie: Rhombe",
        "en": "Series: Rhombe",
        "fr": "Série : Rhombe",
        "it": "Serie: Rhombe"
      },
      {
        "de": "Volumen 0,67 l",
        "en": "Volume 0.67 l",
        "fr": "Contenance 0,67 l",
        "it": "Capacità 0,67 l"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "12 cm"
      },
      {
        "key": "breite",
        "wert": "16,5 cm"
      },
      {
        "key": "durchmesser",
        "wert": "13,5 cm"
      }
    ],
    "designer": "Karakter Copenhagen",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-sauce-boat-1-opt.webp",
        "width": 1129,
        "height": 1411,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Sauce boat – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Rhombe Sauce boat – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Rhombe Sauce boat – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Rhombe Sauce boat – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZb9NZ/Lyngby-Porcelaen-Rhombe-Sauce-boat-White-201212-xZb9NZ.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-sauce-boat-2.webp",
        "width": 1080,
        "height": 1527,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Sauce boat – weitere Ansicht des Herstellers",
          "en": "Lyngby Porcelæn Rhombe Sauce boat – further view by the manufacturer",
          "fr": "Lyngby Porcelæn Rhombe Sauce boat – autre vue du fabricant",
          "it": "Lyngby Porcelæn Rhombe Sauce boat – altra vista del produttore"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZb9P0/Lyngby-Porcelaen-Rhombe-Sauce-boat-White-201212-xZb9P0.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "detail"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-sauce-boat-3.webp",
        "width": 1067,
        "height": 1600,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Sauce boat – Stimmungsbild des Herstellers mit dem Produkt im Raum",
          "en": "Lyngby Porcelæn Rhombe Sauce boat – manufacturer’s lifestyle photo showing the product in a room",
          "fr": "Lyngby Porcelæn Rhombe Sauce boat – photo d’ambiance du fabricant montrant le produit dans une pièce",
          "it": "Lyngby Porcelæn Rhombe Sauce boat – foto d’ambiente del produttore con il prodotto nella stanza"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/2SPfzC/Lyngby-Porcelaen-Rhombe-Sauce-boat-White-201212.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-sauce-boat-white-67-cl-201212",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-sauce-boat-white-67-cl-201212",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-rhombe-tea-cup-with-saucer",
      "lyngby-porcelaen-rhombe-teapot",
      "lyngby-porcelaen-rhombe-serving-bowl"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Weiß",
            "en": "White",
            "fr": "Blanc",
            "it": "Bianco"
          },
          "betrag": 79.95,
          "sku": "201212",
          "inhaltMl": 670,
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-sauce-boat-white-67-cl-201212"
    }
  },
  {
    "slug": "lyngby-porcelaen-rhombe-vase",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "vase",
    "name": "Rhombe Vase",
    "serie": "Rhombe",
    "kurz": {
      "de": "Vase der Serie Rhombe aus Porzellan, entworfen von Karakter Copenhagen. Das Rautenmuster stammt laut Hersteller aus dem Designarchiv von Lyngby Porcelæn und erschien erstmals 1961 auf der Serie Dan-Ild.",
      "en": "Vase from the Rhombe series made of porcelain, designed by Karakter Copenhagen. According to the manufacturer, the rhombus pattern comes from the Lyngby Porcelæn design archive and first appeared on the Dan-Ild range in 1961.",
      "fr": "Vase de la série Rhombe en porcelaine, dessinée par Karakter Copenhagen. Selon le fabricant, le motif en losange provient des archives de Lyngby Porcelæn et est apparu pour la première fois en 1961 sur la série Dan-Ild.",
      "it": "Vaso della serie Rhombe in porcellana, design di Karakter Copenhagen. Secondo il produttore, il motivo a rombi proviene dall’archivio di Lyngby Porcelæn ed è apparso per la prima volta nel 1961 sulla serie Dan-Ild."
    },
    "merkmale": [
      {
        "de": "Porzellan",
        "en": "Porcelain",
        "fr": "Porcelaine",
        "it": "Porcellana"
      },
      {
        "de": "Design: Karakter Copenhagen",
        "en": "Design: Karakter Copenhagen",
        "fr": "Design : Karakter Copenhagen",
        "it": "Design: Karakter Copenhagen"
      },
      {
        "de": "Serie: Rhombe",
        "en": "Series: Rhombe",
        "fr": "Série : Rhombe",
        "it": "Serie: Rhombe"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "25 cm"
      },
      {
        "key": "durchmesser",
        "wert": "21,5 cm"
      }
    ],
    "designer": "Karakter Copenhagen",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-vase-1-opt.webp",
        "width": 685,
        "height": 856,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Vase – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Rhombe Vase – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Rhombe Vase – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Rhombe Vase – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbr2A/Lyngby-Porcelaen-Rhombe-Vase-White-201213.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-vase-2.webp",
        "width": 1067,
        "height": 1600,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Vase – Stimmungsbild des Herstellers mit dem Produkt im Raum",
          "en": "Lyngby Porcelæn Rhombe Vase – manufacturer’s lifestyle photo showing the product in a room",
          "fr": "Lyngby Porcelæn Rhombe Vase – photo d’ambiance du fabricant montrant le produit dans une pièce",
          "it": "Lyngby Porcelæn Rhombe Vase – foto d’ambiente del produttore con il prodotto nella stanza"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZc1w0/Lyngby-Porcelaen-Rhombe-Vase-White-201213.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-vase-white-h25-cm-201213",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-vase-white-h25-cm-201213",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-rhombe-tea-cup-with-saucer",
      "lyngby-porcelaen-rhombe-teapot",
      "lyngby-porcelaen-rhombe-serving-bowl"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Weiß",
            "en": "White",
            "fr": "Blanc",
            "it": "Bianco"
          },
          "betrag": 139.95,
          "sku": "201213",
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-vase-white-h25-cm-201213"
    }
  },
  {
    "slug": "lyngby-porcelaen-rhombe-egg-cup",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "geschirr",
    "name": "Rhombe Egg cup",
    "serie": "Rhombe",
    "kurz": {
      "de": "Eierbecher der Serie Rhombe aus Porzellan, entworfen von Karakter Copenhagen. Das Rautenmuster stammt laut Hersteller aus dem Designarchiv von Lyngby Porcelæn und erschien erstmals 1961 auf der Serie Dan-Ild.",
      "en": "Egg cup from the Rhombe series made of porcelain, designed by Karakter Copenhagen. According to the manufacturer, the rhombus pattern comes from the Lyngby Porcelæn design archive and first appeared on the Dan-Ild range in 1961.",
      "fr": "Coquetier de la série Rhombe en porcelaine, dessinée par Karakter Copenhagen. Selon le fabricant, le motif en losange provient des archives de Lyngby Porcelæn et est apparu pour la première fois en 1961 sur la série Dan-Ild.",
      "it": "Portauovo della serie Rhombe in porcellana, design di Karakter Copenhagen. Secondo il produttore, il motivo a rombi proviene dall’archivio di Lyngby Porcelæn ed è apparso per la prima volta nel 1961 sulla serie Dan-Ild."
    },
    "merkmale": [
      {
        "de": "Porzellan",
        "en": "Porcelain",
        "fr": "Porcelaine",
        "it": "Porcellana"
      },
      {
        "de": "Design: Karakter Copenhagen",
        "en": "Design: Karakter Copenhagen",
        "fr": "Design : Karakter Copenhagen",
        "it": "Design: Karakter Copenhagen"
      },
      {
        "de": "Serie: Rhombe",
        "en": "Series: Rhombe",
        "fr": "Série : Rhombe",
        "it": "Serie: Rhombe"
      },
      {
        "de": "2 Stück je Packung",
        "en": "2 pieces per pack",
        "fr": "2 pièces par lot",
        "it": "2 pezzi per confezione"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "4,5 cm"
      },
      {
        "key": "durchmesser",
        "wert": "5 cm"
      }
    ],
    "designer": "Karakter Copenhagen",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-egg-cup-1-opt.webp",
        "width": 640,
        "height": 800,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Egg cup – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Rhombe Egg cup – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Rhombe Egg cup – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Rhombe Egg cup – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZ97qz/Lyngby-Porcelaen-Rhombe-Egg-cup-White-201215.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-egg-cup-2.webp",
        "width": 1067,
        "height": 1600,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Egg cup – Stimmungsbild des Herstellers mit dem Produkt im Raum",
          "en": "Lyngby Porcelæn Rhombe Egg cup – manufacturer’s lifestyle photo showing the product in a room",
          "fr": "Lyngby Porcelæn Rhombe Egg cup – photo d’ambiance du fabricant montrant le produit dans une pièce",
          "it": "Lyngby Porcelæn Rhombe Egg cup – foto d’ambiente del produttore con il prodotto nella stanza"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZ8Ffc/Lyngby-Porcelaen-Rhombe-Egg-cup-White-201215.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-egg-cup-white-oe5-cm-201215",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-egg-cup-white-oe5-cm-201215",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-rhombe-tea-cup-with-saucer",
      "lyngby-porcelaen-rhombe-teapot",
      "lyngby-porcelaen-rhombe-serving-bowl"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Weiß",
            "en": "White",
            "fr": "Blanc",
            "it": "Bianco"
          },
          "betrag": 27.95,
          "sku": "201215",
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-egg-cup-white-oe5-cm-201215"
    }
  },
  {
    "slug": "lyngby-porcelaen-rhombe-tealight-holder",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "wohnaccessoire",
    "name": "Rhombe Tealight holder",
    "serie": "Rhombe",
    "kurz": {
      "de": "Teelichthalter der Serie Rhombe aus Porzellan, entworfen von Karakter Copenhagen. Das Rautenmuster stammt laut Hersteller aus dem Designarchiv von Lyngby Porcelæn und erschien erstmals 1961 auf der Serie Dan-Ild.",
      "en": "Tealight holder from the Rhombe series made of porcelain, designed by Karakter Copenhagen. According to the manufacturer, the rhombus pattern comes from the Lyngby Porcelæn design archive and first appeared on the Dan-Ild range in 1961.",
      "fr": "Photophore de la série Rhombe en porcelaine, dessinée par Karakter Copenhagen. Selon le fabricant, le motif en losange provient des archives de Lyngby Porcelæn et est apparu pour la première fois en 1961 sur la série Dan-Ild.",
      "it": "Portacandela tealight della serie Rhombe in porcellana, design di Karakter Copenhagen. Secondo il produttore, il motivo a rombi proviene dall’archivio di Lyngby Porcelæn ed è apparso per la prima volta nel 1961 sulla serie Dan-Ild."
    },
    "merkmale": [
      {
        "de": "Porzellan",
        "en": "Porcelain",
        "fr": "Porcelaine",
        "it": "Porcellana"
      },
      {
        "de": "Design: Karakter Copenhagen",
        "en": "Design: Karakter Copenhagen",
        "fr": "Design : Karakter Copenhagen",
        "it": "Design: Karakter Copenhagen"
      },
      {
        "de": "Serie: Rhombe",
        "en": "Series: Rhombe",
        "fr": "Série : Rhombe",
        "it": "Serie: Rhombe"
      },
      {
        "de": "2 Stück je Packung",
        "en": "2 pieces per pack",
        "fr": "2 pièces par lot",
        "it": "2 pezzi per confezione"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "7,5 cm"
      },
      {
        "key": "durchmesser",
        "wert": "7 cm"
      }
    ],
    "designer": "Karakter Copenhagen",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-tealight-holder-1.webp",
        "width": 1080,
        "height": 1283,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Tealight holder – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Rhombe Tealight holder – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Rhombe Tealight holder – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Rhombe Tealight holder – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbqt8/Lyngby-Porcelaen-Rhombe-Tealight-holder-White-201220-xZbqt8.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-tealight-holder-2.webp",
        "width": 1080,
        "height": 1024,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Tealight holder – weitere Ansicht des Herstellers",
          "en": "Lyngby Porcelæn Rhombe Tealight holder – further view by the manufacturer",
          "fr": "Lyngby Porcelæn Rhombe Tealight holder – autre vue du fabricant",
          "it": "Lyngby Porcelæn Rhombe Tealight holder – altra vista del produttore"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbqt9/Lyngby-Porcelaen-Rhombe-Tealight-holder-White-201220-xZbqt9.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "detail"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-tealight-holder-white-oe65-cm-201220",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-tealight-holder-white-oe65-cm-201220",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-rhombe-tea-cup-with-saucer",
      "lyngby-porcelaen-rhombe-teapot",
      "lyngby-porcelaen-rhombe-serving-bowl"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Weiß",
            "en": "White",
            "fr": "Blanc",
            "it": "Bianco"
          },
          "betrag": 39.95,
          "sku": "201220",
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-tealight-holder-white-oe65-cm-201220"
    }
  },
  {
    "slug": "lyngby-porcelaen-rhombe-dinner-plate",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "geschirr",
    "name": "Rhombe Dinner plate",
    "serie": "Rhombe",
    "kurz": {
      "de": "Speiseteller der Serie Rhombe aus Porzellan, entworfen von Karakter Copenhagen. Das Rautenmuster stammt laut Hersteller aus dem Designarchiv von Lyngby Porcelæn und erschien erstmals 1961 auf der Serie Dan-Ild.",
      "en": "Dinner plate from the Rhombe series made of porcelain, designed by Karakter Copenhagen. According to the manufacturer, the rhombus pattern comes from the Lyngby Porcelæn design archive and first appeared on the Dan-Ild range in 1961.",
      "fr": "Assiette plate de la série Rhombe en porcelaine, dessinée par Karakter Copenhagen. Selon le fabricant, le motif en losange provient des archives de Lyngby Porcelæn et est apparu pour la première fois en 1961 sur la série Dan-Ild.",
      "it": "Piatto piano della serie Rhombe in porcellana, design di Karakter Copenhagen. Secondo il produttore, il motivo a rombi proviene dall’archivio di Lyngby Porcelæn ed è apparso per la prima volta nel 1961 sulla serie Dan-Ild."
    },
    "merkmale": [
      {
        "de": "Porzellan",
        "en": "Porcelain",
        "fr": "Porcelaine",
        "it": "Porcellana"
      },
      {
        "de": "Design: Karakter Copenhagen",
        "en": "Design: Karakter Copenhagen",
        "fr": "Design : Karakter Copenhagen",
        "it": "Design: Karakter Copenhagen"
      },
      {
        "de": "Serie: Rhombe",
        "en": "Series: Rhombe",
        "fr": "Série : Rhombe",
        "it": "Serie: Rhombe"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "2,5 cm"
      },
      {
        "key": "durchmesser",
        "wert": "27 cm"
      }
    ],
    "designer": "Karakter Copenhagen",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-dinner-plate-1.webp",
        "width": 1080,
        "height": 1176,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Dinner plate – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Rhombe Dinner plate – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Rhombe Dinner plate – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Rhombe Dinner plate – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbqtb/Lyngby-Porcelaen-Rhombe-Dinner-plate-White-201222-xZbqtb.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-dinner-plate-2.webp",
        "width": 1080,
        "height": 1527,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Dinner plate – weitere Ansicht des Herstellers",
          "en": "Lyngby Porcelæn Rhombe Dinner plate – further view by the manufacturer",
          "fr": "Lyngby Porcelæn Rhombe Dinner plate – autre vue du fabricant",
          "it": "Lyngby Porcelæn Rhombe Dinner plate – altra vista del produttore"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZ9vPH/Lyngby-Porcelaen-Rhombe-Dinner-plate-White-201222-xZ9vPH.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "detail"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-dinner-plate-3.webp",
        "width": 1080,
        "height": 1495,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Dinner plate – Stimmungsbild des Herstellers mit dem Produkt im Raum",
          "en": "Lyngby Porcelæn Rhombe Dinner plate – manufacturer’s lifestyle photo showing the product in a room",
          "fr": "Lyngby Porcelæn Rhombe Dinner plate – photo d’ambiance du fabricant montrant le produit dans une pièce",
          "it": "Lyngby Porcelæn Rhombe Dinner plate – foto d’ambiente del produttore con il prodotto nella stanza"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZ8DLh/Lyngby-Porcelaen-Rhombe-Dinner-plate-White-201222.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-dinner-plate-white-oe27-cm-201222",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-dinner-plate-white-oe27-cm-201222",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-rhombe-tea-cup-with-saucer",
      "lyngby-porcelaen-rhombe-teapot",
      "lyngby-porcelaen-rhombe-serving-bowl"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Weiß",
            "en": "White",
            "fr": "Blanc",
            "it": "Bianco"
          },
          "betrag": 36.95,
          "sku": "201222",
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-dinner-plate-white-oe27-cm-201222"
    }
  },
  {
    "slug": "lyngby-porcelaen-rhombe-plate",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "geschirr",
    "name": "Rhombe Plate",
    "serie": "Rhombe",
    "kurz": {
      "de": "Teller der Serie Rhombe aus Porzellan, entworfen von Karakter Copenhagen. Im Shop des Herstellers in 2 Größen erhältlich.",
      "en": "Plate from the Rhombe series made of porcelain, designed by Karakter Copenhagen. Available in the manufacturer’s shop in 2 sizes.",
      "fr": "Assiette de la série Rhombe en porcelaine, dessinée par Karakter Copenhagen. Disponible dans la boutique du fabricant en 2 tailles.",
      "it": "Piatto della serie Rhombe in porcellana, design di Karakter Copenhagen. Disponibile nel negozio del produttore in 2 misure."
    },
    "merkmale": [
      {
        "de": "Porzellan",
        "en": "Porcelain",
        "fr": "Porcelaine",
        "it": "Porcellana"
      },
      {
        "de": "Design: Karakter Copenhagen",
        "en": "Design: Karakter Copenhagen",
        "fr": "Design : Karakter Copenhagen",
        "it": "Design: Karakter Copenhagen"
      },
      {
        "de": "Serie: Rhombe",
        "en": "Series: Rhombe",
        "fr": "Série : Rhombe",
        "it": "Serie: Rhombe"
      },
      {
        "de": "Größen: Ø 21 cm, Ø 23 cm",
        "en": "Sizes: Ø 21 cm, Ø 23 cm",
        "fr": "Tailles : Ø 21 cm, Ø 23 cm",
        "it": "Misure: Ø 21 cm, Ø 23 cm"
      }
    ],
    "designer": "Karakter Copenhagen",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-plate-1-opt.webp",
        "width": 640,
        "height": 800,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Plate (Ø 21 cm) – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Rhombe Plate (Ø 21 cm) – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Rhombe Plate (Ø 21 cm) – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Rhombe Plate (Ø 21 cm) – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbqtc/Lyngby-Porcelaen-Rhombe-Plate-White-201224.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-plate-2.webp",
        "width": 1067,
        "height": 1600,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Plate – Stimmungsbild des Herstellers mit dem Produkt im Raum",
          "en": "Lyngby Porcelæn Rhombe Plate – manufacturer’s lifestyle photo showing the product in a room",
          "fr": "Lyngby Porcelæn Rhombe Plate – photo d’ambiance du fabricant montrant le produit dans une pièce",
          "it": "Lyngby Porcelæn Rhombe Plate – foto d’ambiente del produttore con il prodotto nella stanza"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/2SPfdK/Lyngby-Porcelaen-Rhombe-Plate-White-201224.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-plate-white-oe21-cm-201224",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-plate-white-oe21-cm-201224",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-plate-white-oe23-cm-201223",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-rhombe-tea-cup-with-saucer",
      "lyngby-porcelaen-rhombe-teapot",
      "lyngby-porcelaen-rhombe-serving-bowl"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Ø 21 cm",
            "en": "Ø 21 cm",
            "fr": "Ø 21 cm",
            "it": "Ø 21 cm"
          },
          "betrag": 27.95,
          "sku": "201224",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Ø 23 cm",
            "en": "Ø 23 cm",
            "fr": "Ø 23 cm",
            "it": "Ø 23 cm"
          },
          "betrag": 30.95,
          "sku": "201223",
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-plate-white-oe21-cm-201224"
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
            "id": "21-cm",
            "name": {
              "de": "Ø 21 cm",
              "en": "Ø 21 cm",
              "fr": "Ø 21 cm",
              "it": "Ø 21 cm"
            },
            "code": "201224",
            "betrag": 27.95,
            "bilder": [
              "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-plate-1-opt.webp"
            ],
            "standard": true
          },
          {
            "id": "23-cm",
            "name": {
              "de": "Ø 23 cm",
              "en": "Ø 23 cm",
              "fr": "Ø 23 cm",
              "it": "Ø 23 cm"
            },
            "code": "201223",
            "betrag": 30.95
          }
        ]
      }
    ]
  },
  {
    "slug": "lyngby-porcelaen-rhombe-coupe-plate",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "geschirr",
    "name": "Rhombe Coupe plate",
    "serie": "Rhombe",
    "kurz": {
      "de": "Coupeteller der Serie Rhombe aus Porzellan, entworfen von Karakter Copenhagen. Das Rautenmuster stammt laut Hersteller aus dem Designarchiv von Lyngby Porcelæn und erschien erstmals 1961 auf der Serie Dan-Ild.",
      "en": "Coupe plate from the Rhombe series made of porcelain, designed by Karakter Copenhagen. According to the manufacturer, the rhombus pattern comes from the Lyngby Porcelæn design archive and first appeared on the Dan-Ild range in 1961.",
      "fr": "Assiette coupe de la série Rhombe en porcelaine, dessinée par Karakter Copenhagen. Selon le fabricant, le motif en losange provient des archives de Lyngby Porcelæn et est apparu pour la première fois en 1961 sur la série Dan-Ild.",
      "it": "Piatto coupe della serie Rhombe in porcellana, design di Karakter Copenhagen. Secondo il produttore, il motivo a rombi proviene dall’archivio di Lyngby Porcelæn ed è apparso per la prima volta nel 1961 sulla serie Dan-Ild."
    },
    "merkmale": [
      {
        "de": "Porzellan",
        "en": "Porcelain",
        "fr": "Porcelaine",
        "it": "Porcellana"
      },
      {
        "de": "Design: Karakter Copenhagen",
        "en": "Design: Karakter Copenhagen",
        "fr": "Design : Karakter Copenhagen",
        "it": "Design: Karakter Copenhagen"
      },
      {
        "de": "Serie: Rhombe",
        "en": "Series: Rhombe",
        "fr": "Série : Rhombe",
        "it": "Serie: Rhombe"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "4 cm"
      },
      {
        "key": "durchmesser",
        "wert": "20 cm"
      }
    ],
    "designer": "Karakter Copenhagen",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-coupe-plate-1.webp",
        "width": 1080,
        "height": 1489,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Coupe plate – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Rhombe Coupe plate – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Rhombe Coupe plate – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Rhombe Coupe plate – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbqtd/Lyngby-Porcelaen-Rhombe-Coupe-Plate-White-201226.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-coupe-plate-white-oe20-cm-201226",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-coupe-plate-white-oe20-cm-201226",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-rhombe-tea-cup-with-saucer",
      "lyngby-porcelaen-rhombe-teapot",
      "lyngby-porcelaen-rhombe-serving-bowl"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Weiß",
            "en": "White",
            "fr": "Blanc",
            "it": "Bianco"
          },
          "betrag": 27.95,
          "sku": "201226",
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-coupe-plate-white-oe20-cm-201226"
    }
  },
  {
    "slug": "lyngby-porcelaen-rhombe-soup-plate",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "geschirr",
    "name": "Rhombe Soup plate",
    "serie": "Rhombe",
    "kurz": {
      "de": "Suppenteller der Serie Rhombe aus Porzellan, entworfen von Karakter Copenhagen. Im Shop des Herstellers in 2 Größen erhältlich.",
      "en": "Soup plate from the Rhombe series made of porcelain, designed by Karakter Copenhagen. Available in the manufacturer’s shop in 2 sizes.",
      "fr": "Assiette creuse de la série Rhombe en porcelaine, dessinée par Karakter Copenhagen. Disponible dans la boutique du fabricant en 2 tailles.",
      "it": "Piatto fondo della serie Rhombe in porcellana, design di Karakter Copenhagen. Disponibile nel negozio del produttore in 2 misure."
    },
    "merkmale": [
      {
        "de": "Porzellan",
        "en": "Porcelain",
        "fr": "Porcelaine",
        "it": "Porcellana"
      },
      {
        "de": "Design: Karakter Copenhagen",
        "en": "Design: Karakter Copenhagen",
        "fr": "Design : Karakter Copenhagen",
        "it": "Design: Karakter Copenhagen"
      },
      {
        "de": "Serie: Rhombe",
        "en": "Series: Rhombe",
        "fr": "Série : Rhombe",
        "it": "Serie: Rhombe"
      },
      {
        "de": "Größen: Ø 23 cm, Ø 24,5 cm",
        "en": "Sizes: Ø 23 cm, Ø 24.5 cm",
        "fr": "Tailles : Ø 23 cm, Ø 24,5 cm",
        "it": "Misure: Ø 23 cm, Ø 24,5 cm"
      }
    ],
    "designer": "Karakter Copenhagen",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-soup-plate-1-opt.webp",
        "width": 804,
        "height": 1005,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Soup plate (Ø 24,5 cm) – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Rhombe Soup plate (Ø 24.5 cm) – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Rhombe Soup plate (Ø 24,5 cm) – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Rhombe Soup plate (Ø 24,5 cm) – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZb9P2/Lyngby-Porcelaen-Rhombe-Soup-plate-White-201229.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-soup-plate-2.webp",
        "width": 1067,
        "height": 1600,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Soup plate – Stimmungsbild des Herstellers mit dem Produkt im Raum",
          "en": "Lyngby Porcelæn Rhombe Soup plate – manufacturer’s lifestyle photo showing the product in a room",
          "fr": "Lyngby Porcelæn Rhombe Soup plate – photo d’ambiance du fabricant montrant le produit dans une pièce",
          "it": "Lyngby Porcelæn Rhombe Soup plate – foto d’ambiente del produttore con il prodotto nella stanza"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/2SP97K/Lyngby-Porcelaen-Rhombe-Soup-plate-White-201229.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-soup-plate-white-oe245-cm-201229",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-soup-plate-white-oe245-cm-201229",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-soup-plate-white-oe23-cm-201228",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-rhombe-tea-cup-with-saucer",
      "lyngby-porcelaen-rhombe-teapot",
      "lyngby-porcelaen-rhombe-serving-bowl"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Ø 23 cm",
            "en": "Ø 23 cm",
            "fr": "Ø 23 cm",
            "it": "Ø 23 cm"
          },
          "betrag": 32.95,
          "sku": "201228",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Ø 24,5 cm",
            "en": "Ø 24.5 cm",
            "fr": "Ø 24,5 cm",
            "it": "Ø 24,5 cm"
          },
          "betrag": 34.95,
          "sku": "201229",
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-soup-plate-white-oe245-cm-201229"
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
            "id": "23-cm",
            "name": {
              "de": "Ø 23 cm",
              "en": "Ø 23 cm",
              "fr": "Ø 23 cm",
              "it": "Ø 23 cm"
            },
            "code": "201228",
            "betrag": 32.95
          },
          {
            "id": "24-5-cm",
            "name": {
              "de": "Ø 24,5 cm",
              "en": "Ø 24.5 cm",
              "fr": "Ø 24,5 cm",
              "it": "Ø 24,5 cm"
            },
            "code": "201229",
            "betrag": 34.95,
            "bilder": [
              "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-soup-plate-1-opt.webp"
            ],
            "standard": true
          }
        ]
      }
    ]
  },
  {
    "slug": "lyngby-porcelaen-rhombe-mug-with-handle",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "geschirr",
    "name": "Rhombe Mug with handle",
    "serie": "Rhombe",
    "kurz": {
      "de": "Becher mit Henkel der Serie Rhombe aus Porzellan, entworfen von Karakter Copenhagen. Das Rautenmuster stammt laut Hersteller aus dem Designarchiv von Lyngby Porcelæn und erschien erstmals 1961 auf der Serie Dan-Ild.",
      "en": "Mug with handle from the Rhombe series made of porcelain, designed by Karakter Copenhagen. According to the manufacturer, the rhombus pattern comes from the Lyngby Porcelæn design archive and first appeared on the Dan-Ild range in 1961.",
      "fr": "Mug avec anse de la série Rhombe en porcelaine, dessinée par Karakter Copenhagen. Selon le fabricant, le motif en losange provient des archives de Lyngby Porcelæn et est apparu pour la première fois en 1961 sur la série Dan-Ild.",
      "it": "Tazza con manico della serie Rhombe in porcellana, design di Karakter Copenhagen. Secondo il produttore, il motivo a rombi proviene dall’archivio di Lyngby Porcelæn ed è apparso per la prima volta nel 1961 sulla serie Dan-Ild."
    },
    "merkmale": [
      {
        "de": "Porzellan",
        "en": "Porcelain",
        "fr": "Porcelaine",
        "it": "Porcellana"
      },
      {
        "de": "Design: Karakter Copenhagen",
        "en": "Design: Karakter Copenhagen",
        "fr": "Design : Karakter Copenhagen",
        "it": "Design: Karakter Copenhagen"
      },
      {
        "de": "Serie: Rhombe",
        "en": "Series: Rhombe",
        "fr": "Série : Rhombe",
        "it": "Serie: Rhombe"
      },
      {
        "de": "2 Stück je Packung",
        "en": "2 pieces per pack",
        "fr": "2 pièces par lot",
        "it": "2 pezzi per confezione"
      },
      {
        "de": "Volumen 0,33 l",
        "en": "Volume 0.33 l",
        "fr": "Contenance 0,33 l",
        "it": "Capacità 0,33 l"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "10,5 cm"
      },
      {
        "key": "breite",
        "wert": "11 cm"
      },
      {
        "key": "durchmesser",
        "wert": "8,5 cm"
      }
    ],
    "designer": "Karakter Copenhagen",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-mug-with-handle-1-opt.webp",
        "width": 836,
        "height": 1045,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Mug with handle – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Rhombe Mug with handle – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Rhombe Mug with handle – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Rhombe Mug with handle – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/2SNW6b/Lyngby-Porcelaen-Rhombe-Mug-with-handle-White-201230-2SNW6b.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-mug-with-handle-2.webp",
        "width": 1080,
        "height": 1283,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Mug with handle – weitere Ansicht des Herstellers",
          "en": "Lyngby Porcelæn Rhombe Mug with handle – further view by the manufacturer",
          "fr": "Lyngby Porcelæn Rhombe Mug with handle – autre vue du fabricant",
          "it": "Lyngby Porcelæn Rhombe Mug with handle – altra vista del produttore"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/2SNVzF/Lyngby-Porcelaen-Rhombe-Mug-with-handle-White-201230-2SNVzF.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "detail"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-mug-with-handle-white-33-cl-201230",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-mug-with-handle-white-33-cl-201230",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-rhombe-tea-cup-with-saucer",
      "lyngby-porcelaen-rhombe-teapot",
      "lyngby-porcelaen-rhombe-serving-bowl"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Weiß",
            "en": "White",
            "fr": "Blanc",
            "it": "Bianco"
          },
          "betrag": 53.95,
          "sku": "201230",
          "inhaltMl": 330,
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-mug-with-handle-white-33-cl-201230"
    }
  },
  {
    "slug": "lyngby-porcelaen-rhombe-mug",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "geschirr",
    "name": "Rhombe Mug",
    "serie": "Rhombe",
    "kurz": {
      "de": "Becher der Serie Rhombe aus Porzellan, entworfen von Karakter Copenhagen. Das Rautenmuster stammt laut Hersteller aus dem Designarchiv von Lyngby Porcelæn und erschien erstmals 1961 auf der Serie Dan-Ild.",
      "en": "Mug from the Rhombe series made of porcelain, designed by Karakter Copenhagen. According to the manufacturer, the rhombus pattern comes from the Lyngby Porcelæn design archive and first appeared on the Dan-Ild range in 1961.",
      "fr": "Gobelet de la série Rhombe en porcelaine, dessinée par Karakter Copenhagen. Selon le fabricant, le motif en losange provient des archives de Lyngby Porcelæn et est apparu pour la première fois en 1961 sur la série Dan-Ild.",
      "it": "Bicchiere della serie Rhombe in porcellana, design di Karakter Copenhagen. Secondo il produttore, il motivo a rombi proviene dall’archivio di Lyngby Porcelæn ed è apparso per la prima volta nel 1961 sulla serie Dan-Ild."
    },
    "merkmale": [
      {
        "de": "Porzellan",
        "en": "Porcelain",
        "fr": "Porcelaine",
        "it": "Porcellana"
      },
      {
        "de": "Design: Karakter Copenhagen",
        "en": "Design: Karakter Copenhagen",
        "fr": "Design : Karakter Copenhagen",
        "it": "Design: Karakter Copenhagen"
      },
      {
        "de": "Serie: Rhombe",
        "en": "Series: Rhombe",
        "fr": "Série : Rhombe",
        "it": "Serie: Rhombe"
      },
      {
        "de": "Volumen 0,33 l",
        "en": "Volume 0.33 l",
        "fr": "Contenance 0,33 l",
        "it": "Capacità 0,33 l"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "10,5 cm"
      },
      {
        "key": "durchmesser",
        "wert": "8,5 cm"
      }
    ],
    "designer": "Karakter Copenhagen",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-mug-1-opt.webp",
        "width": 640,
        "height": 800,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Mug – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Rhombe Mug – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Rhombe Mug – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Rhombe Mug – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbksP/Lyngby-Porcelaen-Rhombe-Mug-White-201235.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-mug-white-33-cl-201235",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-mug-white-33-cl-201235",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-rhombe-tea-cup-with-saucer",
      "lyngby-porcelaen-rhombe-teapot",
      "lyngby-porcelaen-rhombe-serving-bowl"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Weiß",
            "en": "White",
            "fr": "Blanc",
            "it": "Bianco"
          },
          "betrag": 25.95,
          "sku": "201235",
          "inhaltMl": 330,
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-mug-white-33-cl-201235"
    }
  },
  {
    "slug": "lyngby-porcelaen-rhombe-color-milk-jug",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "geschirr",
    "name": "Rhombe Color Milk jug",
    "serie": "Rhombe Color",
    "kurz": {
      "de": "Milchkännchen der Serie Rhombe Color aus Porzellan, entworfen von Stilleben v/Reckweg & Nordentoft. Das Rautenmuster stammt laut Hersteller aus dem Designarchiv von Lyngby Porcelæn und erschien erstmals 1961 auf der Serie Dan-Ild.",
      "en": "Milk jug from the Rhombe Color series made of porcelain, designed by Stilleben v/Reckweg & Nordentoft. According to the manufacturer, the rhombus pattern comes from the Lyngby Porcelæn design archive and first appeared on the Dan-Ild range in 1961.",
      "fr": "Pot à lait de la série Rhombe Color en porcelaine, dessinée par Stilleben v/Reckweg & Nordentoft. Selon le fabricant, le motif en losange provient des archives de Lyngby Porcelæn et est apparu pour la première fois en 1961 sur la série Dan-Ild.",
      "it": "Lattiera della serie Rhombe Color in porcellana, design di Stilleben v/Reckweg & Nordentoft. Secondo il produttore, il motivo a rombi proviene dall’archivio di Lyngby Porcelæn ed è apparso per la prima volta nel 1961 sulla serie Dan-Ild."
    },
    "merkmale": [
      {
        "de": "Porzellan",
        "en": "Porcelain",
        "fr": "Porcelaine",
        "it": "Porcellana"
      },
      {
        "de": "Design: Stilleben v/Reckweg & Nordentoft",
        "en": "Design: Stilleben v/Reckweg & Nordentoft",
        "fr": "Design : Stilleben v/Reckweg & Nordentoft",
        "it": "Design: Stilleben v/Reckweg & Nordentoft"
      },
      {
        "de": "Serie: Rhombe Color",
        "en": "Series: Rhombe Color",
        "fr": "Série : Rhombe Color",
        "it": "Serie: Rhombe Color"
      },
      {
        "de": "Volumen 0,39 l",
        "en": "Volume 0.39 l",
        "fr": "Contenance 0,39 l",
        "it": "Capacità 0,39 l"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "11 cm"
      },
      {
        "key": "breite",
        "wert": "9,5 cm"
      },
      {
        "key": "tiefe",
        "wert": "10,5 cm"
      },
      {
        "key": "durchmesser",
        "wert": "9,5 cm"
      }
    ],
    "designer": "Stilleben v/Reckweg & Nordentoft",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-milk-jug-1-opt.webp",
        "width": 640,
        "height": 800,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Color Milk jug – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Rhombe Color Milk jug – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Rhombe Color Milk jug – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Rhombe Color Milk jug – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZcCCm/Lyngby-Porcelaen-Rhombe-Color-Milk-jug-Blue-201346.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-milk-jug-2.webp",
        "width": 1600,
        "height": 1200,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Color Milk jug – Stimmungsbild des Herstellers mit dem Produkt im Raum",
          "en": "Lyngby Porcelæn Rhombe Color Milk jug – manufacturer’s lifestyle photo showing the product in a room",
          "fr": "Lyngby Porcelæn Rhombe Color Milk jug – photo d’ambiance du fabricant montrant le produit dans une pièce",
          "it": "Lyngby Porcelæn Rhombe Color Milk jug – foto d’ambiente del produttore con il prodotto nella stanza"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZ9fct/Lyngby-Porcelaen-Rhombe-Color-Milk-jug-Blue-201346.webp?d=22399",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-milk-jug-blue-39-cl-201346",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-milk-jug-blue-39-cl-201346",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-rhombe-color-sauce-boat",
      "lyngby-porcelaen-rhombe-color-bowl",
      "lyngby-porcelaen-rhombe-color-serving-bowl"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Blau",
            "en": "Blue",
            "fr": "Bleu",
            "it": "Blu"
          },
          "betrag": 39.95,
          "sku": "201346",
          "inhaltMl": 390,
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-milk-jug-blue-39-cl-201346"
    }
  },
  {
    "slug": "lyngby-porcelaen-rhombe-color-sauce-boat",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "geschirr",
    "name": "Rhombe Color Sauce boat",
    "serie": "Rhombe Color",
    "kurz": {
      "de": "Sauciere der Serie Rhombe Color aus Porzellan, entworfen von Stilleben v/Reckweg & Nordentoft. Das Rautenmuster stammt laut Hersteller aus dem Designarchiv von Lyngby Porcelæn und erschien erstmals 1961 auf der Serie Dan-Ild.",
      "en": "Sauce boat from the Rhombe Color series made of porcelain, designed by Stilleben v/Reckweg & Nordentoft. According to the manufacturer, the rhombus pattern comes from the Lyngby Porcelæn design archive and first appeared on the Dan-Ild range in 1961.",
      "fr": "Saucière de la série Rhombe Color en porcelaine, dessinée par Stilleben v/Reckweg & Nordentoft. Selon le fabricant, le motif en losange provient des archives de Lyngby Porcelæn et est apparu pour la première fois en 1961 sur la série Dan-Ild.",
      "it": "Salsiera della serie Rhombe Color in porcellana, design di Stilleben v/Reckweg & Nordentoft. Secondo il produttore, il motivo a rombi proviene dall’archivio di Lyngby Porcelæn ed è apparso per la prima volta nel 1961 sulla serie Dan-Ild."
    },
    "merkmale": [
      {
        "de": "Porzellan",
        "en": "Porcelain",
        "fr": "Porcelaine",
        "it": "Porcellana"
      },
      {
        "de": "Design: Stilleben v/Reckweg & Nordentoft",
        "en": "Design: Stilleben v/Reckweg & Nordentoft",
        "fr": "Design : Stilleben v/Reckweg & Nordentoft",
        "it": "Design: Stilleben v/Reckweg & Nordentoft"
      },
      {
        "de": "Serie: Rhombe Color",
        "en": "Series: Rhombe Color",
        "fr": "Série : Rhombe Color",
        "it": "Serie: Rhombe Color"
      },
      {
        "de": "Volumen 0,67 l",
        "en": "Volume 0.67 l",
        "fr": "Contenance 0,67 l",
        "it": "Capacità 0,67 l"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "12 cm"
      },
      {
        "key": "breite",
        "wert": "16,5 cm"
      },
      {
        "key": "durchmesser",
        "wert": "13,5 cm"
      }
    ],
    "designer": "Stilleben v/Reckweg & Nordentoft",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-sauce-boat-1-opt.webp",
        "width": 845,
        "height": 1056,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Color Sauce boat – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Rhombe Color Sauce boat – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Rhombe Color Sauce boat – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Rhombe Color Sauce boat – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZcCS1/Lyngby-Porcelaen-Rhombe-Color-Sauce-boat-Blue-201348-xZcCS1.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-sauce-boat-2.webp",
        "width": 1080,
        "height": 1527,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Color Sauce boat – weitere Ansicht des Herstellers",
          "en": "Lyngby Porcelæn Rhombe Color Sauce boat – further view by the manufacturer",
          "fr": "Lyngby Porcelæn Rhombe Color Sauce boat – autre vue du fabricant",
          "it": "Lyngby Porcelæn Rhombe Color Sauce boat – altra vista del produttore"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbkBr/Lyngby-Porcelaen-Rhombe-Color-Sauce-boat-Blue-201348-xZbkBr.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "detail"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-sauce-boat-3.webp",
        "width": 1600,
        "height": 1200,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Color Sauce boat – Stimmungsbild des Herstellers mit dem Produkt im Raum",
          "en": "Lyngby Porcelæn Rhombe Color Sauce boat – manufacturer’s lifestyle photo showing the product in a room",
          "fr": "Lyngby Porcelæn Rhombe Color Sauce boat – photo d’ambiance du fabricant montrant le produit dans une pièce",
          "it": "Lyngby Porcelæn Rhombe Color Sauce boat – foto d’ambiente del produttore con il prodotto nella stanza"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZ8DZQ/Lyngby-Porcelaen-Rhombe-Color-Sauce-boat-Blue-201348.webp?d=22399",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-sauce-boat-blue-67-cl-201348",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-sauce-boat-blue-67-cl-201348",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-rhombe-color-milk-jug",
      "lyngby-porcelaen-rhombe-color-bowl",
      "lyngby-porcelaen-rhombe-color-serving-bowl"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Blau",
            "en": "Blue",
            "fr": "Bleu",
            "it": "Blu"
          },
          "betrag": 99.95,
          "sku": "201348",
          "inhaltMl": 670,
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-sauce-boat-blue-67-cl-201348"
    }
  },
  {
    "slug": "lyngby-porcelaen-lyngby-fitting-01",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "wohnaccessoire",
    "name": "Lyngby Fitting #01",
    "serie": "Lyngby",
    "kurz": {
      "de": "Pendelleuchte (Fassung) der Serie Lyngby aus Porzellan, entworfen von Philip Bro Ludvigsen. Laut Hersteller handgefertigt und mit 3 m weißem Kabel geliefert; Leuchtmittel nicht enthalten.",
      "en": "Pendant fitting from the Lyngby series made of porcelain, designed by Philip Bro Ludvigsen. Handmade according to the manufacturer and supplied with a 3 m white cable; bulb not included.",
      "fr": "Suspension (douille) de la série Lyngby en porcelaine, dessinée par Philip Bro Ludvigsen. Fabriquée à la main selon le fabricant et livrée avec un câble blanc de 3 m ; ampoule non fournie.",
      "it": "Lampada a sospensione (portalampada) della serie Lyngby in porcellana, design di Philip Bro Ludvigsen. Realizzata a mano secondo il produttore e fornita con cavo bianco da 3 m; lampadina non inclusa."
    },
    "merkmale": [
      {
        "de": "Porzellan",
        "en": "Porcelain",
        "fr": "Porcelaine",
        "it": "Porcellana"
      },
      {
        "de": "Design: Philip Bro Ludvigsen",
        "en": "Design: Philip Bro Ludvigsen",
        "fr": "Design : Philip Bro Ludvigsen",
        "it": "Design: Philip Bro Ludvigsen"
      },
      {
        "de": "Serie: Lyngby",
        "en": "Series: Lyngby",
        "fr": "Série : Lyngby",
        "it": "Serie: Lyngby"
      },
      {
        "de": "Laut Hersteller handgefertigt und mit 3 m weißem Kabel geliefert; Leuchtmittel nicht enthalten.",
        "en": "Handmade according to the manufacturer and supplied with a 3 m white cable; bulb not included.",
        "fr": "Fabriquée à la main selon le fabricant et livrée avec un câble blanc de 3 m ; ampoule non fournie.",
        "it": "Realizzata a mano secondo il produttore e fornita con cavo bianco da 3 m; lampadina non inclusa."
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "8,7 cm"
      },
      {
        "key": "durchmesser",
        "wert": "4,7 cm"
      }
    ],
    "designer": "Philip Bro Ludvigsen",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-fitting-01-1.webp",
        "width": 1080,
        "height": 1527,
        "alt": {
          "de": "Lyngby Porcelæn Lyngby Fitting #01 – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Lyngby Fitting #01 – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Lyngby Fitting #01 – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Lyngby Fitting #01 – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbqts/Lyngby-Porcelaen-Lyngby-Fitting-01-White-201388.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-fitting-01-2.webp",
        "width": 1600,
        "height": 1249,
        "alt": {
          "de": "Lyngby Porcelæn Lyngby Fitting #01 – Stimmungsbild des Herstellers mit dem Produkt im Raum",
          "en": "Lyngby Porcelæn Lyngby Fitting #01 – manufacturer’s lifestyle photo showing the product in a room",
          "fr": "Lyngby Porcelæn Lyngby Fitting #01 – photo d’ambiance du fabricant montrant le produit dans une pièce",
          "it": "Lyngby Porcelæn Lyngby Fitting #01 – foto d’ambiente del produttore con il prodotto nella stanza"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/2SP8C4/Lyngby-Porcelaen-Lyngby-Fitting-01-White-201388-2SP8C4.webp?d=22399",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-fitting-01-white-h87-cm-201388",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-fitting-01-white-h87-cm-201388",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-lyngby-vase-glas",
      "lyngby-porcelaen-lyngby-tealight-holder",
      "lyngby-porcelaen-lyngby-tealight-holder-glas"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Weiß",
            "en": "White",
            "fr": "Blanc",
            "it": "Bianco"
          },
          "betrag": 66.95,
          "sku": "201388",
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-fitting-01-white-h87-cm-201388"
    }
  },
  {
    "slug": "lyngby-porcelaen-lyngby-flowerpot",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "vase",
    "name": "Lyngby Flowerpot",
    "serie": "Lyngby",
    "kurz": {
      "de": "Blumentopf der Serie Lyngby aus Porzellan, entworfen von Karakter Copenhagen. Im Shop des Herstellers in 3 Größen erhältlich.",
      "en": "Flowerpot from the Lyngby series made of porcelain, designed by Karakter Copenhagen. Available in the manufacturer’s shop in 3 sizes.",
      "fr": "Pot de fleurs de la série Lyngby en porcelaine, dessinée par Karakter Copenhagen. Disponible dans la boutique du fabricant en 3 tailles.",
      "it": "Vaso per piante della serie Lyngby in porcellana, design di Karakter Copenhagen. Disponibile nel negozio del produttore in 3 misure."
    },
    "merkmale": [
      {
        "de": "Porzellan",
        "en": "Porcelain",
        "fr": "Porcelaine",
        "it": "Porcellana"
      },
      {
        "de": "Design: Karakter Copenhagen",
        "en": "Design: Karakter Copenhagen",
        "fr": "Design : Karakter Copenhagen",
        "it": "Design: Karakter Copenhagen"
      },
      {
        "de": "Serie: Lyngby",
        "en": "Series: Lyngby",
        "fr": "Série : Lyngby",
        "it": "Serie: Lyngby"
      },
      {
        "de": "Größen: klein, mittel, groß",
        "en": "Sizes: small, medium, large",
        "fr": "Tailles : petit, moyen, grand",
        "it": "Misure: piccolo, medio, grande"
      },
      {
        "de": "Laut Hersteller handgefertigt; die Form greift Bonbonniere und Lyngby-Vase aus dem Archiv auf.",
        "en": "Handmade according to the manufacturer; the shape draws on the Bonbonniere and the Lyngby vase from the archive.",
        "fr": "Fabriqué à la main selon le fabricant ; la forme s’inspire de la bonbonnière et du vase Lyngby des archives.",
        "it": "Realizzato a mano secondo il produttore; la forma riprende la bonbonniera e il vaso Lyngby dell’archivio."
      }
    ],
    "designer": "Karakter Copenhagen",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-flowerpot-1-opt.webp",
        "width": 640,
        "height": 800,
        "alt": {
          "de": "Lyngby Porcelæn Lyngby Flowerpot (klein) – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Lyngby Flowerpot (small) – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Lyngby Flowerpot (petit) – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Lyngby Flowerpot (piccolo) – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbqtv/Lyngby-Porcelaen-Lyngby-Flowerpot-White-small-201392.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-flowerpot-2.webp",
        "width": 1600,
        "height": 1067,
        "alt": {
          "de": "Lyngby Porcelæn Lyngby Flowerpot – Stimmungsbild des Herstellers mit dem Produkt im Raum",
          "en": "Lyngby Porcelæn Lyngby Flowerpot – manufacturer’s lifestyle photo showing the product in a room",
          "fr": "Lyngby Porcelæn Lyngby Flowerpot – photo d’ambiance du fabricant montrant le produit dans une pièce",
          "it": "Lyngby Porcelæn Lyngby Flowerpot – foto d’ambiente del produttore con il prodotto nella stanza"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZcqgA/Lyngby-Porcelaen-Lyngby-Flowerpot-White-small-201392.webp?d=22399",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-flowerpot-white-lille-201392",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-flowerpot-white-lille-201392",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-flowerpot-white-mellem-201394",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-flowerpot-white-stor-201396",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-lyngby-vase-glas",
      "lyngby-porcelaen-lyngby-tealight-holder",
      "lyngby-porcelaen-lyngby-tealight-holder-glas"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "klein",
            "en": "small",
            "fr": "petit",
            "it": "piccolo"
          },
          "betrag": 49.95,
          "sku": "201392",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "mittel",
            "en": "medium",
            "fr": "moyen",
            "it": "medio"
          },
          "betrag": 59.95,
          "sku": "201394",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "groß",
            "en": "large",
            "fr": "grand",
            "it": "grande"
          },
          "betrag": 78.95,
          "sku": "201396",
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-flowerpot-white-lille-201392"
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
            "id": "small",
            "name": {
              "de": "klein",
              "en": "small",
              "fr": "petit",
              "it": "piccolo"
            },
            "code": "201392",
            "betrag": 49.95,
            "bilder": [
              "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-flowerpot-1-opt.webp"
            ],
            "standard": true
          },
          {
            "id": "medium",
            "name": {
              "de": "mittel",
              "en": "medium",
              "fr": "moyen",
              "it": "medio"
            },
            "code": "201394",
            "betrag": 59.95
          },
          {
            "id": "large",
            "name": {
              "de": "groß",
              "en": "large",
              "fr": "grand",
              "it": "grande"
            },
            "code": "201396",
            "betrag": 78.95
          }
        ]
      }
    ]
  },
  {
    "slug": "lyngby-porcelaen-lyngby-tura-jug-vase",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "vase",
    "name": "Lyngby Tura Jug Vase",
    "serie": "Lyngby Tura",
    "kurz": {
      "de": "Krugvase der Serie Lyngby Tura aus Porzellan, entworfen von Philip Bro Ludvigsen.",
      "en": "Jug vase from the Lyngby Tura series made of porcelain, designed by Philip Bro Ludvigsen.",
      "fr": "Vase cruche de la série Lyngby Tura en porcelaine, dessinée par Philip Bro Ludvigsen.",
      "it": "Vaso a brocca della serie Lyngby Tura in porcellana, design di Philip Bro Ludvigsen."
    },
    "merkmale": [
      {
        "de": "Porzellan",
        "en": "Porcelain",
        "fr": "Porcelaine",
        "it": "Porcellana"
      },
      {
        "de": "Design: Philip Bro Ludvigsen",
        "en": "Design: Philip Bro Ludvigsen",
        "fr": "Design : Philip Bro Ludvigsen",
        "it": "Design: Philip Bro Ludvigsen"
      },
      {
        "de": "Serie: Lyngby Tura",
        "en": "Series: Lyngby Tura",
        "fr": "Série : Lyngby Tura",
        "it": "Serie: Lyngby Tura"
      },
      {
        "de": "Volumen 4 l",
        "en": "Volume 4 l",
        "fr": "Contenance 4 l",
        "it": "Capacità 4 l"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "27,5 cm"
      },
      {
        "key": "breite",
        "wert": "21,5 cm"
      },
      {
        "key": "durchmesser",
        "wert": "19,5 cm"
      }
    ],
    "designer": "Philip Bro Ludvigsen",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-tura-jug-vase-1-opt.webp",
        "width": 1124,
        "height": 1405,
        "alt": {
          "de": "Lyngby Porcelæn Lyngby Tura Jug Vase – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Lyngby Tura Jug Vase – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Lyngby Tura Jug Vase – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Lyngby Tura Jug Vase – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZ9vPL/Lyngby-Porcelaen-Lyngby-Tura-Jug-Vase-White-201460-xZ9vPL.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-tura-jug-vase-2.webp",
        "width": 1080,
        "height": 1527,
        "alt": {
          "de": "Lyngby Porcelæn Lyngby Tura Jug Vase – weitere Ansicht des Herstellers",
          "en": "Lyngby Porcelæn Lyngby Tura Jug Vase – further view by the manufacturer",
          "fr": "Lyngby Porcelæn Lyngby Tura Jug Vase – autre vue du fabricant",
          "it": "Lyngby Porcelæn Lyngby Tura Jug Vase – altra vista del produttore"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZ9vPM/Lyngby-Porcelaen-Lyngby-Tura-Jug-Vase-White-201460-xZ9vPM.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "detail"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-tura-jug-vase-3.webp",
        "width": 1067,
        "height": 1600,
        "alt": {
          "de": "Lyngby Porcelæn Lyngby Tura Jug Vase – Stimmungsbild des Herstellers mit dem Produkt im Raum",
          "en": "Lyngby Porcelæn Lyngby Tura Jug Vase – manufacturer’s lifestyle photo showing the product in a room",
          "fr": "Lyngby Porcelæn Lyngby Tura Jug Vase – photo d’ambiance du fabricant montrant le produit dans une pièce",
          "it": "Lyngby Porcelæn Lyngby Tura Jug Vase – foto d’ambiente del produttore con il prodotto nella stanza"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZ8DLj/Lyngby-Porcelaen-Lyngby-Tura-Jug-Vase-White-201460-xZ8DLj.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-tura-jug-vase-white-h275-cm-201460",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-tura-jug-vase-white-h275-cm-201460",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-lyngby-tura-vase",
      "lyngby-porcelaen-lyngby-tura-tealight-holder",
      "lyngby-porcelaen-lyngby-tura-candle-holder"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Weiß",
            "en": "White",
            "fr": "Blanc",
            "it": "Bianco"
          },
          "betrag": 239.95,
          "sku": "201460",
          "inhaltMl": 4000,
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-tura-jug-vase-white-h275-cm-201460"
    }
  },
  {
    "slug": "lyngby-porcelaen-lyngby-tura-vase",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "vase",
    "name": "Lyngby Tura Vase",
    "serie": "Lyngby Tura",
    "kurz": {
      "de": "Vase der Serie Lyngby Tura aus Porzellan, entworfen von Philip Bro Ludvigsen. Im Shop des Herstellers in 3 Größen erhältlich.",
      "en": "Vase from the Lyngby Tura series made of porcelain, designed by Philip Bro Ludvigsen. Available in the manufacturer’s shop in 3 sizes.",
      "fr": "Vase de la série Lyngby Tura en porcelaine, dessinée par Philip Bro Ludvigsen. Disponible dans la boutique du fabricant en 3 tailles.",
      "it": "Vaso della serie Lyngby Tura in porcellana, design di Philip Bro Ludvigsen. Disponibile nel negozio del produttore in 3 misure."
    },
    "merkmale": [
      {
        "de": "Porzellan",
        "en": "Porcelain",
        "fr": "Porcelaine",
        "it": "Porcellana"
      },
      {
        "de": "Design: Philip Bro Ludvigsen",
        "en": "Design: Philip Bro Ludvigsen",
        "fr": "Design : Philip Bro Ludvigsen",
        "it": "Design: Philip Bro Ludvigsen"
      },
      {
        "de": "Serie: Lyngby Tura",
        "en": "Series: Lyngby Tura",
        "fr": "Série : Lyngby Tura",
        "it": "Serie: Lyngby Tura"
      },
      {
        "de": "Größen: H 18 cm, H 14,5 cm, H 34 cm",
        "en": "Sizes: H 18 cm, H 14.5 cm, H 34 cm",
        "fr": "Tailles : H 18 cm, H 14,5 cm, H 34 cm",
        "it": "Misure: H 18 cm, H 14,5 cm, H 34 cm"
      }
    ],
    "designer": "Philip Bro Ludvigsen",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-tura-vase-1-opt.webp",
        "width": 662,
        "height": 828,
        "alt": {
          "de": "Lyngby Porcelæn Lyngby Tura Vase (H 18 cm) – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Lyngby Tura Vase (H 18 cm) – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Lyngby Tura Vase (H 18 cm) – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Lyngby Tura Vase (H 18 cm) – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZcCJt/Lyngby-Porcelaen-Lyngby-Tura-Vase-White-201555-xZcCJt.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-tura-vase-2.webp",
        "width": 1080,
        "height": 1527,
        "alt": {
          "de": "Lyngby Porcelæn Lyngby Tura Vase (H 18 cm) – weitere Ansicht des Herstellers",
          "en": "Lyngby Porcelæn Lyngby Tura Vase (H 18 cm) – further view by the manufacturer",
          "fr": "Lyngby Porcelæn Lyngby Tura Vase (H 18 cm) – autre vue du fabricant",
          "it": "Lyngby Porcelæn Lyngby Tura Vase (H 18 cm) – altra vista del produttore"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZ9vZh/Lyngby-Porcelaen-Lyngby-Tura-Vase-White-201555-xZ9vZh.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "detail"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-tura-vase-3.webp",
        "width": 1600,
        "height": 1067,
        "alt": {
          "de": "Lyngby Porcelæn Lyngby Tura Vase – Stimmungsbild des Herstellers mit dem Produkt im Raum",
          "en": "Lyngby Porcelæn Lyngby Tura Vase – manufacturer’s lifestyle photo showing the product in a room",
          "fr": "Lyngby Porcelæn Lyngby Tura Vase – photo d’ambiance du fabricant montrant le produit dans une pièce",
          "it": "Lyngby Porcelæn Lyngby Tura Vase – foto d’ambiente del produttore con il prodotto nella stanza"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZ8DNx/Lyngby-Porcelaen-Lyngby-Tura-Vase-White-201555-xZ8DNx.webp?d=22399",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-tura-vase-white-h18-cm-201555",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-tura-vase-white-h18-cm-201555",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-tura-vase-white-h145-cm-201556",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-tura-vase-white-h34-cm-201461",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-lyngby-tura-jug-vase",
      "lyngby-porcelaen-lyngby-tura-tealight-holder",
      "lyngby-porcelaen-lyngby-tura-candle-holder"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "H 18 cm",
            "en": "H 18 cm",
            "fr": "H 18 cm",
            "it": "H 18 cm"
          },
          "betrag": 69.95,
          "sku": "201555",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "H 14,5 cm",
            "en": "H 14.5 cm",
            "fr": "H 14,5 cm",
            "it": "H 14,5 cm"
          },
          "betrag": 69.95,
          "sku": "201556",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "H 34 cm",
            "en": "H 34 cm",
            "fr": "H 34 cm",
            "it": "H 34 cm"
          },
          "betrag": 279.95,
          "sku": "201461",
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-tura-vase-white-h18-cm-201555"
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
            "id": "h-18-cm",
            "name": {
              "de": "H 18 cm",
              "en": "H 18 cm",
              "fr": "H 18 cm",
              "it": "H 18 cm"
            },
            "code": "201555",
            "betrag": 69.95,
            "bilder": [
              "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-tura-vase-1-opt.webp"
            ],
            "standard": true
          },
          {
            "id": "h-14-5-cm",
            "name": {
              "de": "H 14,5 cm",
              "en": "H 14.5 cm",
              "fr": "H 14,5 cm",
              "it": "H 14,5 cm"
            },
            "code": "201556",
            "betrag": 69.95
          },
          {
            "id": "h-34-cm",
            "name": {
              "de": "H 34 cm",
              "en": "H 34 cm",
              "fr": "H 34 cm",
              "it": "H 34 cm"
            },
            "code": "201461",
            "betrag": 279.95
          }
        ]
      }
    ]
  },
  {
    "slug": "lyngby-porcelaen-lyngby-tura-tealight-holder",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "wohnaccessoire",
    "name": "Lyngby Tura Tealight holder",
    "serie": "Lyngby Tura",
    "kurz": {
      "de": "Teelichthalter der Serie Lyngby Tura aus Porzellan, entworfen von Philip Bro Ludvigsen.",
      "en": "Tealight holder from the Lyngby Tura series made of porcelain, designed by Philip Bro Ludvigsen.",
      "fr": "Photophore de la série Lyngby Tura en porcelaine, dessinée par Philip Bro Ludvigsen.",
      "it": "Portacandela tealight della serie Lyngby Tura in porcellana, design di Philip Bro Ludvigsen."
    },
    "merkmale": [
      {
        "de": "Porzellan",
        "en": "Porcelain",
        "fr": "Porcelaine",
        "it": "Porcellana"
      },
      {
        "de": "Design: Philip Bro Ludvigsen",
        "en": "Design: Philip Bro Ludvigsen",
        "fr": "Design : Philip Bro Ludvigsen",
        "it": "Design: Philip Bro Ludvigsen"
      },
      {
        "de": "Serie: Lyngby Tura",
        "en": "Series: Lyngby Tura",
        "fr": "Série : Lyngby Tura",
        "it": "Serie: Lyngby Tura"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "6,5 cm"
      },
      {
        "key": "durchmesser",
        "wert": "8 cm"
      }
    ],
    "designer": "Philip Bro Ludvigsen",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-tura-tealight-holder-1-opt.webp",
        "width": 640,
        "height": 800,
        "alt": {
          "de": "Lyngby Porcelæn Lyngby Tura Tealight holder – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Lyngby Tura Tealight holder – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Lyngby Tura Tealight holder – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Lyngby Tura Tealight holder – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZcCSw/Lyngby-Porcelaen-Lyngby-Tura-Tealight-holder-White-201464-xZcCSw.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-tura-tealight-holder-2.webp",
        "width": 1080,
        "height": 1527,
        "alt": {
          "de": "Lyngby Porcelæn Lyngby Tura Tealight holder – weitere Ansicht des Herstellers",
          "en": "Lyngby Porcelæn Lyngby Tura Tealight holder – further view by the manufacturer",
          "fr": "Lyngby Porcelæn Lyngby Tura Tealight holder – autre vue du fabricant",
          "it": "Lyngby Porcelæn Lyngby Tura Tealight holder – altra vista del produttore"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbJwS/Lyngby-Porcelaen-Lyngby-Tura-Tealight-holder-White-201464-xZbJwS.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "detail"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-tura-tealight-holder-3.webp",
        "width": 1600,
        "height": 1074,
        "alt": {
          "de": "Lyngby Porcelæn Lyngby Tura Tealight holder – Stimmungsbild des Herstellers mit dem Produkt im Raum",
          "en": "Lyngby Porcelæn Lyngby Tura Tealight holder – manufacturer’s lifestyle photo showing the product in a room",
          "fr": "Lyngby Porcelæn Lyngby Tura Tealight holder – photo d’ambiance du fabricant montrant le produit dans une pièce",
          "it": "Lyngby Porcelæn Lyngby Tura Tealight holder – foto d’ambiente del produttore con il prodotto nella stanza"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZblAq/Lyngby-Porcelaen-Lyngby-Tura-Tealight-holder-White-201464-xZblAq.webp?d=22399",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-tura-tealight-holder-white-oe8-cm-201464",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-tura-tealight-holder-white-oe8-cm-201464",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-lyngby-tura-jug-vase",
      "lyngby-porcelaen-lyngby-tura-vase",
      "lyngby-porcelaen-lyngby-tura-candle-holder"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Weiß",
            "en": "White",
            "fr": "Blanc",
            "it": "Bianco"
          },
          "betrag": 37.95,
          "sku": "201464",
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-tura-tealight-holder-white-oe8-cm-201464"
    }
  },
  {
    "slug": "lyngby-porcelaen-lyngby-tura-candle-holder",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "wohnaccessoire",
    "name": "Lyngby Tura Candle holder",
    "serie": "Lyngby Tura",
    "kurz": {
      "de": "Kerzenhalter der Serie Lyngby Tura aus Porzellan, entworfen von Philip Bro Ludvigsen.",
      "en": "Candle holder from the Lyngby Tura series made of porcelain, designed by Philip Bro Ludvigsen.",
      "fr": "Bougeoir de la série Lyngby Tura en porcelaine, dessinée par Philip Bro Ludvigsen.",
      "it": "Portacandele della serie Lyngby Tura in porcellana, design di Philip Bro Ludvigsen."
    },
    "merkmale": [
      {
        "de": "Porzellan",
        "en": "Porcelain",
        "fr": "Porcelaine",
        "it": "Porcellana"
      },
      {
        "de": "Design: Philip Bro Ludvigsen",
        "en": "Design: Philip Bro Ludvigsen",
        "fr": "Design : Philip Bro Ludvigsen",
        "it": "Design: Philip Bro Ludvigsen"
      },
      {
        "de": "Serie: Lyngby Tura",
        "en": "Series: Lyngby Tura",
        "fr": "Série : Lyngby Tura",
        "it": "Serie: Lyngby Tura"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "12,5 cm"
      },
      {
        "key": "durchmesser",
        "wert": "7,5 cm"
      }
    ],
    "designer": "Philip Bro Ludvigsen",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-tura-candle-holder-1-opt.webp",
        "width": 640,
        "height": 800,
        "alt": {
          "de": "Lyngby Porcelæn Lyngby Tura Candle holder – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Lyngby Tura Candle holder – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Lyngby Tura Candle holder – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Lyngby Tura Candle holder – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZcCSx/Lyngby-Porcelaen-Lyngby-Tura-Candle-holder-White-201465-xZcCSx.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-tura-candle-holder-2.webp",
        "width": 1080,
        "height": 1527,
        "alt": {
          "de": "Lyngby Porcelæn Lyngby Tura Candle holder – weitere Ansicht des Herstellers",
          "en": "Lyngby Porcelæn Lyngby Tura Candle holder – further view by the manufacturer",
          "fr": "Lyngby Porcelæn Lyngby Tura Candle holder – autre vue du fabricant",
          "it": "Lyngby Porcelæn Lyngby Tura Candle holder – altra vista del produttore"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbJwX/Lyngby-Porcelaen-Lyngby-Tura-Candle-holder-White-201465-xZbJwX.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "detail"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-tura-candle-holder-3.webp",
        "width": 1600,
        "height": 1074,
        "alt": {
          "de": "Lyngby Porcelæn Lyngby Tura Candle holder – Stimmungsbild des Herstellers mit dem Produkt im Raum",
          "en": "Lyngby Porcelæn Lyngby Tura Candle holder – manufacturer’s lifestyle photo showing the product in a room",
          "fr": "Lyngby Porcelæn Lyngby Tura Candle holder – photo d’ambiance du fabricant montrant le produit dans une pièce",
          "it": "Lyngby Porcelæn Lyngby Tura Candle holder – foto d’ambiente del produttore con il prodotto nella stanza"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZblAq/Lyngby-Porcelaen-Lyngby-Tura-Candle-holder-White-201465-xZblAq.webp?d=22399",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-tura-candle-holder-white-h14-201465",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-tura-candle-holder-white-h14-201465",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-lyngby-tura-jug-vase",
      "lyngby-porcelaen-lyngby-tura-vase",
      "lyngby-porcelaen-lyngby-tura-tealight-holder"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Weiß",
            "en": "White",
            "fr": "Blanc",
            "it": "Bianco"
          },
          "betrag": 44.95,
          "sku": "201465",
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-tura-candle-holder-white-h14-201465"
    }
  },
  {
    "slug": "lyngby-porcelaen-lyngby-tura-block-candle-holder",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "wohnaccessoire",
    "name": "Lyngby Tura Block candle holder",
    "serie": "Lyngby Tura",
    "kurz": {
      "de": "Kerzenhalter für Stumpenkerzen der Serie Lyngby Tura aus Porzellan, entworfen von Philip Bro Ludvigsen.",
      "en": "Block candle holder from the Lyngby Tura series made of porcelain, designed by Philip Bro Ludvigsen.",
      "fr": "Bougeoir pour bougie pilier de la série Lyngby Tura en porcelaine, dessinée par Philip Bro Ludvigsen.",
      "it": "Portacandele per candela a colonna della serie Lyngby Tura in porcellana, design di Philip Bro Ludvigsen."
    },
    "merkmale": [
      {
        "de": "Porzellan",
        "en": "Porcelain",
        "fr": "Porcelaine",
        "it": "Porcellana"
      },
      {
        "de": "Design: Philip Bro Ludvigsen",
        "en": "Design: Philip Bro Ludvigsen",
        "fr": "Design : Philip Bro Ludvigsen",
        "it": "Design: Philip Bro Ludvigsen"
      },
      {
        "de": "Serie: Lyngby Tura",
        "en": "Series: Lyngby Tura",
        "fr": "Série : Lyngby Tura",
        "it": "Serie: Lyngby Tura"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "10 cm"
      },
      {
        "key": "durchmesser",
        "wert": "11,5 cm"
      }
    ],
    "designer": "Philip Bro Ludvigsen",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-tura-block-candle-holder-1-opt.webp",
        "width": 640,
        "height": 800,
        "alt": {
          "de": "Lyngby Porcelæn Lyngby Tura Block candle holder – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Lyngby Tura Block candle holder – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Lyngby Tura Block candle holder – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Lyngby Tura Block candle holder – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZcCSz/Lyngby-Porcelaen-Lyngby-Tura-Block-candle-holder-White-201466-xZcCSz.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-tura-block-candle-holder-2.webp",
        "width": 1080,
        "height": 1527,
        "alt": {
          "de": "Lyngby Porcelæn Lyngby Tura Block candle holder – weitere Ansicht des Herstellers",
          "en": "Lyngby Porcelæn Lyngby Tura Block candle holder – further view by the manufacturer",
          "fr": "Lyngby Porcelæn Lyngby Tura Block candle holder – autre vue du fabricant",
          "it": "Lyngby Porcelæn Lyngby Tura Block candle holder – altra vista del produttore"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbJx2/Lyngby-Porcelaen-Lyngby-Tura-Block-candle-holder-White-201466-xZbJx2.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "detail"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-tura-block-candle-holder-3.webp",
        "width": 1600,
        "height": 1074,
        "alt": {
          "de": "Lyngby Porcelæn Lyngby Tura Block candle holder – Stimmungsbild des Herstellers mit dem Produkt im Raum",
          "en": "Lyngby Porcelæn Lyngby Tura Block candle holder – manufacturer’s lifestyle photo showing the product in a room",
          "fr": "Lyngby Porcelæn Lyngby Tura Block candle holder – photo d’ambiance du fabricant montrant le produit dans une pièce",
          "it": "Lyngby Porcelæn Lyngby Tura Block candle holder – foto d’ambiente del produttore con il prodotto nella stanza"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZblAq/Lyngby-Porcelaen-Lyngby-Tura-Block-candle-holder-White-201466-xZblAq.webp?d=22399",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-tura-block-candle-holder-white-oe115-cm-201466",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-tura-block-candle-holder-white-oe115-cm-201466",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-lyngby-tura-jug-vase",
      "lyngby-porcelaen-lyngby-tura-vase",
      "lyngby-porcelaen-lyngby-tura-tealight-holder"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Weiß",
            "en": "White",
            "fr": "Blanc",
            "it": "Bianco"
          },
          "betrag": 52.95,
          "sku": "201466",
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-tura-block-candle-holder-white-oe115-cm-201466"
    }
  },
  {
    "slug": "lyngby-porcelaen-lyngby-tura-oval-serving-dish",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "geschirr",
    "name": "Lyngby Tura Oval serving dish",
    "serie": "Lyngby Tura",
    "kurz": {
      "de": "Ovale Servierplatte der Serie Lyngby Tura aus Porzellan, entworfen von Philip Bro Ludvigsen. Im Shop des Herstellers in 2 Größen erhältlich.",
      "en": "Oval serving dish from the Lyngby Tura series made of porcelain, designed by Philip Bro Ludvigsen. Available in the manufacturer’s shop in 2 sizes.",
      "fr": "Plat de service ovale de la série Lyngby Tura en porcelaine, dessinée par Philip Bro Ludvigsen. Disponible dans la boutique du fabricant en 2 tailles.",
      "it": "Piatto da portata ovale della serie Lyngby Tura in porcellana, design di Philip Bro Ludvigsen. Disponibile nel negozio del produttore in 2 misure."
    },
    "merkmale": [
      {
        "de": "Porzellan",
        "en": "Porcelain",
        "fr": "Porcelaine",
        "it": "Porcellana"
      },
      {
        "de": "Design: Philip Bro Ludvigsen",
        "en": "Design: Philip Bro Ludvigsen",
        "fr": "Design : Philip Bro Ludvigsen",
        "it": "Design: Philip Bro Ludvigsen"
      },
      {
        "de": "Serie: Lyngby Tura",
        "en": "Series: Lyngby Tura",
        "fr": "Série : Lyngby Tura",
        "it": "Serie: Lyngby Tura"
      },
      {
        "de": "Größen: 34x14,5 cm, 48x20 cm",
        "en": "Sizes: 34x14.5 cm, 48x20 cm",
        "fr": "Tailles : 34x14,5 cm, 48x20 cm",
        "it": "Misure: 34x14,5 cm, 48x20 cm"
      }
    ],
    "designer": "Philip Bro Ludvigsen",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-tura-oval-serving-dish-1-opt.webp",
        "width": 1191,
        "height": 1489,
        "alt": {
          "de": "Lyngby Porcelæn Lyngby Tura Oval serving dish (48x20 cm) – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Lyngby Tura Oval serving dish (48x20 cm) – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Lyngby Tura Oval serving dish (48x20 cm) – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Lyngby Tura Oval serving dish (48x20 cm) – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/GPcJC5Qdfoao/Lyngby-Porcelaen-Lyngby-Tura-Oval-serving-dish-White-201468-GPcJC5Qdfoao.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-tura-oval-serving-dish-2.webp",
        "width": 1080,
        "height": 1527,
        "alt": {
          "de": "Lyngby Porcelæn Lyngby Tura Oval serving dish (48x20 cm) – weitere Ansicht des Herstellers",
          "en": "Lyngby Porcelæn Lyngby Tura Oval serving dish (48x20 cm) – further view by the manufacturer",
          "fr": "Lyngby Porcelæn Lyngby Tura Oval serving dish (48x20 cm) – autre vue du fabricant",
          "it": "Lyngby Porcelæn Lyngby Tura Oval serving dish (48x20 cm) – altra vista del produttore"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/ziFvVd1dpQVS/Lyngby-Porcelaen-Lyngby-Tura-Oval-serving-dish-White-201468-ziFvVd1dpQVS.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "detail"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-tura-oval-serving-dish-3.webp",
        "width": 1080,
        "height": 1080,
        "alt": {
          "de": "Lyngby Porcelæn Lyngby Tura Oval serving dish – Stimmungsbild des Herstellers, vom Hersteller als KI-Bild gekennzeichnet: Schalen an der Wand und auf einer Ablage",
          "en": "Lyngby Porcelæn Lyngby Tura Oval serving dish – manufacturer’s lifestyle image, labelled by the manufacturer as AI-generated: dishes on the wall and on a ledge",
          "fr": "Lyngby Porcelæn Lyngby Tura Oval serving dish – image d’ambiance du fabricant, signalée par le fabricant comme générée par IA : plats au mur et sur une tablette",
          "it": "Lyngby Porcelæn Lyngby Tura Oval serving dish – immagine d’ambiente del produttore, indicata dal produttore come generata con IA: piatti alla parete e su una mensola"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/NqimBpTHyZbe/Lyngby-Porcelaen-Lyngby-Tura-Oval-serving-dish-White-201468-NqimBpTHyZbe.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-tura-oval-serving-dish-white-48x20-cm-201468",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-tura-oval-serving-dish-white-48x20-cm-201468",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-tura-oval-serving-dish-white-34x145-cm-201469",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-lyngby-tura-jug-vase",
      "lyngby-porcelaen-lyngby-tura-vase",
      "lyngby-porcelaen-lyngby-tura-tealight-holder"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "34x14,5 cm",
            "en": "34x14.5 cm",
            "fr": "34x14,5 cm",
            "it": "34x14,5 cm"
          },
          "betrag": 69.95,
          "sku": "201469",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "48x20 cm",
            "en": "48x20 cm",
            "fr": "48x20 cm",
            "it": "48x20 cm"
          },
          "betrag": 114.95,
          "sku": "201468",
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-tura-oval-serving-dish-white-48x20-cm-201468"
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
            "id": "34x14-5-cm",
            "name": {
              "de": "34x14,5 cm",
              "en": "34x14.5 cm",
              "fr": "34x14,5 cm",
              "it": "34x14,5 cm"
            },
            "code": "201469",
            "betrag": 69.95
          },
          {
            "id": "48x20-cm",
            "name": {
              "de": "48x20 cm",
              "en": "48x20 cm",
              "fr": "48x20 cm",
              "it": "48x20 cm"
            },
            "code": "201468",
            "betrag": 114.95,
            "bilder": [
              "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-tura-oval-serving-dish-1-opt.webp"
            ],
            "standard": true
          }
        ]
      }
    ]
  },
  {
    "slug": "lyngby-porcelaen-rhombe-cutlery-set",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "geschirr",
    "name": "Rhombe Cutlery set",
    "serie": "Rhombe",
    "kurz": {
      "de": "Besteckset der Serie Rhombe aus recyceltem Stahl. Im Set zu 16 Stück.",
      "en": "Cutlery set from the Rhombe series made of recycled steel. Set of 16.",
      "fr": "Ménagère de la série Rhombe en acier recyclé. Lot de 16 pièces.",
      "it": "Set di posate della serie Rhombe in acciaio riciclato. Set da 16 pezzi."
    },
    "merkmale": [
      {
        "de": "Recycelter Stahl",
        "en": "Recycled steel",
        "fr": "Acier recyclé",
        "it": "Acciaio riciclato"
      },
      {
        "de": "Serie: Rhombe",
        "en": "Series: Rhombe",
        "fr": "Série : Rhombe",
        "it": "Serie: Rhombe"
      },
      {
        "de": "16 Stück je Packung",
        "en": "16 pieces per pack",
        "fr": "16 pièces par lot",
        "it": "16 pezzi per confezione"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-cutlery-set-1-opt.webp",
        "width": 930,
        "height": 1162,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Cutlery set – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Rhombe Cutlery set – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Rhombe Cutlery set – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Rhombe Cutlery set – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZhgpf/Lyngby-Porcelaen-Rhombe-Cutlery-set-Steel-201500-xZhgpf.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-cutlery-set-2.webp",
        "width": 1080,
        "height": 1083,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Cutlery set – weitere Ansicht des Herstellers",
          "en": "Lyngby Porcelæn Rhombe Cutlery set – further view by the manufacturer",
          "fr": "Lyngby Porcelæn Rhombe Cutlery set – autre vue du fabricant",
          "it": "Lyngby Porcelæn Rhombe Cutlery set – altra vista del produttore"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZhgpg/Lyngby-Porcelaen-Rhombe-Cutlery-set-Steel-201500-xZhgpg.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "detail"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-cutlery-set-3.webp",
        "width": 1600,
        "height": 1067,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Cutlery set – Stimmungsbild des Herstellers mit dem Produkt im Raum",
          "en": "Lyngby Porcelæn Rhombe Cutlery set – manufacturer’s lifestyle photo showing the product in a room",
          "fr": "Lyngby Porcelæn Rhombe Cutlery set – photo d’ambiance du fabricant montrant le produit dans une pièce",
          "it": "Lyngby Porcelæn Rhombe Cutlery set – foto d’ambiente del produttore con il prodotto nella stanza"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/5FPHCC9/Lyngby-Porcelaen-Rhombe-Cutlery-set-Steel-201500-5FPHCC9.webp?d=22399",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-cutlery-set-steel-201500",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-cutlery-set-steel-201500",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-rhombe-tea-cup-with-saucer",
      "lyngby-porcelaen-rhombe-teapot",
      "lyngby-porcelaen-rhombe-serving-bowl"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Stahl",
            "en": "Steel",
            "fr": "Acier",
            "it": "Acciaio"
          },
          "betrag": 169.95,
          "sku": "201500"
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-cutlery-set-steel-201500"
    }
  },
  {
    "slug": "lyngby-porcelaen-rhombe-salt-and-pepper-set",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "geschirr",
    "name": "Rhombe Salt and pepper set",
    "serie": "Rhombe",
    "kurz": {
      "de": "Salz- und Pfefferstreuer der Serie Rhombe aus Porzellan und poliertem Edelstahl, entworfen von Stilleben v/Reckweg & Nordentoft.",
      "en": "Salt and pepper set from the Rhombe series made of porcelain and polished stainless steel, designed by Stilleben v/Reckweg & Nordentoft.",
      "fr": "Salière et poivrière de la série Rhombe en porcelaine et acier inoxydable poli, dessinée par Stilleben v/Reckweg & Nordentoft.",
      "it": "Set sale e pepe della serie Rhombe in porcellana e acciaio inox lucidato, design di Stilleben v/Reckweg & Nordentoft."
    },
    "merkmale": [
      {
        "de": "Porzellan / polierter Edelstahl",
        "en": "Porcelain / polished stainless steel",
        "fr": "Porcelaine / acier inoxydable poli",
        "it": "Porcellana / acciaio inox lucidato"
      },
      {
        "de": "Design: Stilleben v/Reckweg & Nordentoft",
        "en": "Design: Stilleben v/Reckweg & Nordentoft",
        "fr": "Design : Stilleben v/Reckweg & Nordentoft",
        "it": "Design: Stilleben v/Reckweg & Nordentoft"
      },
      {
        "de": "Serie: Rhombe",
        "en": "Series: Rhombe",
        "fr": "Série : Rhombe",
        "it": "Serie: Rhombe"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "13 cm"
      },
      {
        "key": "durchmesser",
        "wert": "6,5 cm"
      }
    ],
    "designer": "Stilleben v/Reckweg & Nordentoft",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-salt-and-pepper-set-1-opt.webp",
        "width": 640,
        "height": 800,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Salt and pepper set – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Rhombe Salt and pepper set – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Rhombe Salt and pepper set – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Rhombe Salt and pepper set – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/KrZWx1KrUSsR/Lyngby-Porcelaen-Rhombe-Salt-and-pepper-set-WhiteSlate-201520-KrZWx1KrUSsR.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-salt-and-pepper-set-2.webp",
        "width": 1080,
        "height": 1527,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Salt and pepper set – weitere Ansicht des Herstellers",
          "en": "Lyngby Porcelæn Rhombe Salt and pepper set – further view by the manufacturer",
          "fr": "Lyngby Porcelæn Rhombe Salt and pepper set – autre vue du fabricant",
          "it": "Lyngby Porcelæn Rhombe Salt and pepper set – altra vista del produttore"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/cGgqUCJB0Lke/Lyngby-Porcelaen-Rhombe-Salt-and-pepper-set-WhiteSlate-201520-cGgqUCJB0Lke.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "detail"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-salt-and-pepper-set-3.webp",
        "width": 1067,
        "height": 1600,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Salt and pepper set – Stimmungsbild des Herstellers mit dem Produkt im Raum",
          "en": "Lyngby Porcelæn Rhombe Salt and pepper set – manufacturer’s lifestyle photo showing the product in a room",
          "fr": "Lyngby Porcelæn Rhombe Salt and pepper set – photo d’ambiance du fabricant montrant le produit dans une pièce",
          "it": "Lyngby Porcelæn Rhombe Salt and pepper set – foto d’ambiente del produttore con il prodotto nella stanza"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/WsfQbHhVyNnd/Lyngby-Porcelaen-Rhombe-Salt-and-pepper-set-WhiteSlate-201520-WsfQbHhVyNnd.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-salt-and-pepper-set-whiteslate-h13-cm-201520",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-salt-and-pepper-set-whiteslate-h13-cm-201520",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-rhombe-tea-cup-with-saucer",
      "lyngby-porcelaen-rhombe-teapot",
      "lyngby-porcelaen-rhombe-serving-bowl"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Weiß/Slate",
            "en": "White/Slate",
            "fr": "Blanc/Slate",
            "it": "Bianco/Slate"
          },
          "betrag": 99.95,
          "sku": "201520",
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-salt-and-pepper-set-whiteslate-h13-cm-201520"
    }
  },
  {
    "slug": "lyngby-porcelaen-lyngby-candle-holder",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "wohnaccessoire",
    "name": "Lyngby Candle holder",
    "serie": "Lyngby",
    "kurz": {
      "de": "Kerzenhalter der Serie Lyngby aus Porzellan, entworfen von Formgiverne / Cecilie Toklum. Im Shop des Herstellers in 2 Größen erhältlich.",
      "en": "Candle holder from the Lyngby series made of porcelain, designed by Formgiverne / Cecilie Toklum. Available in the manufacturer’s shop in 2 sizes.",
      "fr": "Bougeoir de la série Lyngby en porcelaine, dessinée par Formgiverne / Cecilie Toklum. Disponible dans la boutique du fabricant en 2 tailles.",
      "it": "Portacandele della serie Lyngby in porcellana, design di Formgiverne / Cecilie Toklum. Disponibile nel negozio del produttore in 2 misure."
    },
    "merkmale": [
      {
        "de": "Porzellan",
        "en": "Porcelain",
        "fr": "Porcelaine",
        "it": "Porcellana"
      },
      {
        "de": "Design: Formgiverne / Cecilie Toklum",
        "en": "Design: Formgiverne / Cecilie Toklum",
        "fr": "Design : Formgiverne / Cecilie Toklum",
        "it": "Design: Formgiverne / Cecilie Toklum"
      },
      {
        "de": "Serie: Lyngby",
        "en": "Series: Lyngby",
        "fr": "Série : Lyngby",
        "it": "Serie: Lyngby"
      },
      {
        "de": "Größen: H 7 cm, H 11 cm",
        "en": "Sizes: H 7 cm, H 11 cm",
        "fr": "Tailles : H 7 cm, H 11 cm",
        "it": "Misure: H 7 cm, H 11 cm"
      }
    ],
    "designer": "Formgiverne / Cecilie Toklum",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-candle-holder-1-opt.webp",
        "width": 640,
        "height": 800,
        "alt": {
          "de": "Lyngby Porcelæn Lyngby Candle holder (H 11 cm) – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Lyngby Candle holder (H 11 cm) – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Lyngby Candle holder (H 11 cm) – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Lyngby Candle holder (H 11 cm) – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZ97wn/Lyngby-Porcelaen-Lyngby-Candle-holder-White-201571.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-candle-holder-2.webp",
        "width": 1067,
        "height": 1600,
        "alt": {
          "de": "Lyngby Porcelæn Lyngby Candle holder – Stimmungsbild des Herstellers mit dem Produkt im Raum",
          "en": "Lyngby Porcelæn Lyngby Candle holder – manufacturer’s lifestyle photo showing the product in a room",
          "fr": "Lyngby Porcelæn Lyngby Candle holder – photo d’ambiance du fabricant montrant le produit dans une pièce",
          "it": "Lyngby Porcelæn Lyngby Candle holder – foto d’ambiente del produttore con il prodotto nella stanza"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/2SP98D/Lyngby-Porcelaen-Lyngby-Candle-holder-White-201571.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-candle-holder-white-h11-cm-201571",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-candle-holder-white-h11-cm-201571",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-candle-holder-white-h7-cm-201570",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-lyngby-vase-glas",
      "lyngby-porcelaen-lyngby-tealight-holder",
      "lyngby-porcelaen-lyngby-tealight-holder-glas"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "H 7 cm",
            "en": "H 7 cm",
            "fr": "H 7 cm",
            "it": "H 7 cm"
          },
          "betrag": 19.95,
          "sku": "201570",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "H 11 cm",
            "en": "H 11 cm",
            "fr": "H 11 cm",
            "it": "H 11 cm"
          },
          "betrag": 21.95,
          "sku": "201571",
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-candle-holder-white-h11-cm-201571"
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
            "id": "h-7-cm",
            "name": {
              "de": "H 7 cm",
              "en": "H 7 cm",
              "fr": "H 7 cm",
              "it": "H 7 cm"
            },
            "code": "201570",
            "betrag": 19.95
          },
          {
            "id": "h-11-cm",
            "name": {
              "de": "H 11 cm",
              "en": "H 11 cm",
              "fr": "H 11 cm",
              "it": "H 11 cm"
            },
            "code": "201571",
            "betrag": 21.95,
            "bilder": [
              "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-candle-holder-1-opt.webp"
            ],
            "standard": true
          }
        ]
      }
    ]
  },
  {
    "slug": "lyngby-porcelaen-lyngby-fitting-03",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "wohnaccessoire",
    "name": "Lyngby Fitting #03",
    "serie": "Lyngby",
    "kurz": {
      "de": "Tischleuchte (Fassung) der Serie Lyngby aus Porzellan, entworfen von Philip Bro Ludvigsen. Mit 2 m weißem Kabel geliefert; Leuchtmittel nicht enthalten.",
      "en": "Table lamp fitting from the Lyngby series made of porcelain, designed by Philip Bro Ludvigsen. Supplied with a 2 m white cable; bulb not included.",
      "fr": "Lampe de table (douille) de la série Lyngby en porcelaine, dessinée par Philip Bro Ludvigsen. Livrée avec un câble blanc de 2 m ; ampoule non fournie.",
      "it": "Lampada da tavolo (portalampada) della serie Lyngby in porcellana, design di Philip Bro Ludvigsen. Fornita con cavo bianco da 2 m; lampadina non inclusa."
    },
    "merkmale": [
      {
        "de": "Porzellan",
        "en": "Porcelain",
        "fr": "Porcelaine",
        "it": "Porcellana"
      },
      {
        "de": "Design: Philip Bro Ludvigsen",
        "en": "Design: Philip Bro Ludvigsen",
        "fr": "Design : Philip Bro Ludvigsen",
        "it": "Design: Philip Bro Ludvigsen"
      },
      {
        "de": "Serie: Lyngby",
        "en": "Series: Lyngby",
        "fr": "Série : Lyngby",
        "it": "Serie: Lyngby"
      },
      {
        "de": "Mit 2 m weißem Kabel geliefert; Leuchtmittel nicht enthalten.",
        "en": "Supplied with a 2 m white cable; bulb not included.",
        "fr": "Livrée avec un câble blanc de 2 m ; ampoule non fournie.",
        "it": "Fornita con cavo bianco da 2 m; lampadina non inclusa."
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "10,7 cm"
      },
      {
        "key": "durchmesser",
        "wert": "8 cm"
      }
    ],
    "designer": "Philip Bro Ludvigsen",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-fitting-03-1.webp",
        "width": 1068,
        "height": 1600,
        "alt": {
          "de": "Lyngby Porcelæn Lyngby Fitting #03 – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Lyngby Fitting #03 – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Lyngby Fitting #03 – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Lyngby Fitting #03 – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbqB2/Lyngby-Porcelaen-Lyngby-Fitting-03-White-201641.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-fitting-03-2.webp",
        "width": 1067,
        "height": 1600,
        "alt": {
          "de": "Lyngby Porcelæn Lyngby Fitting #03 – Stimmungsbild des Herstellers mit dem Produkt im Raum",
          "en": "Lyngby Porcelæn Lyngby Fitting #03 – manufacturer’s lifestyle photo showing the product in a room",
          "fr": "Lyngby Porcelæn Lyngby Fitting #03 – photo d’ambiance du fabricant montrant le produit dans une pièce",
          "it": "Lyngby Porcelæn Lyngby Fitting #03 – foto d’ambiente del produttore con il prodotto nella stanza"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/2SP8Vh/Lyngby-Porcelaen-Lyngby-Fitting-03-White-201641-2SP8Vh.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-fitting-03-white-h107-cm-201641",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-fitting-03-white-h107-cm-201641",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-lyngby-vase-glas",
      "lyngby-porcelaen-lyngby-tealight-holder",
      "lyngby-porcelaen-lyngby-tealight-holder-glas"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Weiß",
            "en": "White",
            "fr": "Blanc",
            "it": "Bianco"
          },
          "betrag": 109.95,
          "sku": "201641",
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-fitting-03-white-h107-cm-201641"
    }
  },
  {
    "slug": "lyngby-porcelaen-rhombe-candle-holder",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "wohnaccessoire",
    "name": "Rhombe Candle holder",
    "serie": "Rhombe",
    "kurz": {
      "de": "Kerzenhalter der Serie Rhombe aus Porzellan. Das Rautenmuster stammt laut Hersteller aus dem Designarchiv von Lyngby Porcelæn und erschien erstmals 1961 auf der Serie Dan-Ild.",
      "en": "Candle holder from the Rhombe series made of porcelain. According to the manufacturer, the rhombus pattern comes from the Lyngby Porcelæn design archive and first appeared on the Dan-Ild range in 1961.",
      "fr": "Bougeoir de la série Rhombe en porcelaine. Selon le fabricant, le motif en losange provient des archives de Lyngby Porcelæn et est apparu pour la première fois en 1961 sur la série Dan-Ild.",
      "it": "Portacandele della serie Rhombe in porcellana. Secondo il produttore, il motivo a rombi proviene dall’archivio di Lyngby Porcelæn ed è apparso per la prima volta nel 1961 sulla serie Dan-Ild."
    },
    "merkmale": [
      {
        "de": "Porzellan",
        "en": "Porcelain",
        "fr": "Porcelaine",
        "it": "Porcellana"
      },
      {
        "de": "Serie: Rhombe",
        "en": "Series: Rhombe",
        "fr": "Série : Rhombe",
        "it": "Serie: Rhombe"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "3 cm"
      },
      {
        "key": "durchmesser",
        "wert": "10,5 cm"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-candle-holder-1.webp",
        "width": 1080,
        "height": 689,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Candle holder – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Rhombe Candle holder – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Rhombe Candle holder – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Rhombe Candle holder – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZ97wq/Lyngby-Porcelaen-Rhombe-Candle-holder-White-201702.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-candle-holder-2.webp",
        "width": 1600,
        "height": 1021,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Candle holder – Stimmungsbild des Herstellers mit dem Produkt im Raum",
          "en": "Lyngby Porcelæn Rhombe Candle holder – manufacturer’s lifestyle photo showing the product in a room",
          "fr": "Lyngby Porcelæn Rhombe Candle holder – photo d’ambiance du fabricant montrant le produit dans une pièce",
          "it": "Lyngby Porcelæn Rhombe Candle holder – foto d’ambiente del produttore con il prodotto nella stanza"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/2SNVJS/Lyngby-Porcelaen-Rhombe-Candle-holder-White-201702.webp?d=22399",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-candle-holder-white-oe105-cm-201702",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-candle-holder-white-oe105-cm-201702",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-rhombe-tea-cup-with-saucer",
      "lyngby-porcelaen-rhombe-teapot",
      "lyngby-porcelaen-rhombe-serving-bowl"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Weiß",
            "en": "White",
            "fr": "Blanc",
            "it": "Bianco"
          },
          "betrag": 22.95,
          "sku": "201702",
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-candle-holder-white-oe105-cm-201702"
    }
  },
  {
    "slug": "lyngby-porcelaen-rhombe-block-candle-holder",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "wohnaccessoire",
    "name": "Rhombe Block candle holder",
    "serie": "Rhombe",
    "kurz": {
      "de": "Kerzenhalter für Stumpenkerzen der Serie Rhombe aus Porzellan, entworfen von Karakter Copenhagen. Das Rautenmuster stammt laut Hersteller aus dem Designarchiv von Lyngby Porcelæn und erschien erstmals 1961 auf der Serie Dan-Ild.",
      "en": "Block candle holder from the Rhombe series made of porcelain, designed by Karakter Copenhagen. According to the manufacturer, the rhombus pattern comes from the Lyngby Porcelæn design archive and first appeared on the Dan-Ild range in 1961.",
      "fr": "Bougeoir pour bougie pilier de la série Rhombe en porcelaine, dessinée par Karakter Copenhagen. Selon le fabricant, le motif en losange provient des archives de Lyngby Porcelæn et est apparu pour la première fois en 1961 sur la série Dan-Ild.",
      "it": "Portacandele per candela a colonna della serie Rhombe in porcellana, design di Karakter Copenhagen. Secondo il produttore, il motivo a rombi proviene dall’archivio di Lyngby Porcelæn ed è apparso per la prima volta nel 1961 sulla serie Dan-Ild."
    },
    "merkmale": [
      {
        "de": "Porzellan",
        "en": "Porcelain",
        "fr": "Porcelaine",
        "it": "Porcellana"
      },
      {
        "de": "Design: Karakter Copenhagen",
        "en": "Design: Karakter Copenhagen",
        "fr": "Design : Karakter Copenhagen",
        "it": "Design: Karakter Copenhagen"
      },
      {
        "de": "Serie: Rhombe",
        "en": "Series: Rhombe",
        "fr": "Série : Rhombe",
        "it": "Serie: Rhombe"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "3 cm"
      },
      {
        "key": "durchmesser",
        "wert": "14,5 cm"
      }
    ],
    "designer": "Karakter Copenhagen",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-block-candle-holder-1-opt.webp",
        "width": 640,
        "height": 800,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Block candle holder – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Rhombe Block candle holder – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Rhombe Block candle holder – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Rhombe Block candle holder – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbqA5/Lyngby-Porcelaen-Rhombe-Block-candle-holder-White-201731.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-block-candle-holder-white-oe145-cm-201731",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-block-candle-holder-white-oe145-cm-201731",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-rhombe-tea-cup-with-saucer",
      "lyngby-porcelaen-rhombe-teapot",
      "lyngby-porcelaen-rhombe-serving-bowl"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Weiß",
            "en": "White",
            "fr": "Blanc",
            "it": "Bianco"
          },
          "betrag": 31.95,
          "sku": "201731",
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-block-candle-holder-white-oe145-cm-201731"
    }
  },
  {
    "slug": "lyngby-porcelaen-rhombe-earth-dinner-plate",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "geschirr",
    "name": "Rhombe Earth Dinner plate",
    "serie": "Rhombe Earth",
    "kurz": {
      "de": "Speiseteller der Serie Rhombe Earth aus Porzellan, entworfen von Stilleben v/Reckweg & Nordentoft. Im Shop des Herstellers in 3 Farben erhältlich.",
      "en": "Dinner plate from the Rhombe Earth series made of porcelain, designed by Stilleben v/Reckweg & Nordentoft. Available in the manufacturer’s shop in 3 colours.",
      "fr": "Assiette plate de la série Rhombe Earth en porcelaine, dessinée par Stilleben v/Reckweg & Nordentoft. Disponible dans la boutique du fabricant en 3 couleurs.",
      "it": "Piatto piano della serie Rhombe Earth in porcellana, design di Stilleben v/Reckweg & Nordentoft. Disponibile nel negozio del produttore in 3 colori."
    },
    "merkmale": [
      {
        "de": "Porzellan",
        "en": "Porcelain",
        "fr": "Porcelaine",
        "it": "Porcellana"
      },
      {
        "de": "Design: Stilleben v/Reckweg & Nordentoft",
        "en": "Design: Stilleben v/Reckweg & Nordentoft",
        "fr": "Design : Stilleben v/Reckweg & Nordentoft",
        "it": "Design: Stilleben v/Reckweg & Nordentoft"
      },
      {
        "de": "Serie: Rhombe Earth",
        "en": "Series: Rhombe Earth",
        "fr": "Série : Rhombe Earth",
        "it": "Serie: Rhombe Earth"
      },
      {
        "de": "Farben: Clay, Marble, Moss",
        "en": "Colours: Clay, Marble, Moss",
        "fr": "Couleurs : Clay, Marble, Moss",
        "it": "Colori: Clay, Marble, Moss"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "2,5 cm"
      },
      {
        "key": "durchmesser",
        "wert": "27 cm"
      }
    ],
    "designer": "Stilleben v/Reckweg & Nordentoft",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-earth-dinner-plate-1-opt.webp",
        "width": 1069,
        "height": 1336,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Earth Dinner plate (Marble) – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Rhombe Earth Dinner plate (Marble) – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Rhombe Earth Dinner plate (Marble) – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Rhombe Earth Dinner plate (Marble) – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZgLkV/Lyngby-Porcelaen-Rhombe-Earth-Dinner-plate-Marble-201805-xZgLkV.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-earth-dinner-plate-2.webp",
        "width": 1080,
        "height": 1527,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Earth Dinner plate (Marble) – weitere Ansicht des Herstellers",
          "en": "Lyngby Porcelæn Rhombe Earth Dinner plate (Marble) – further view by the manufacturer",
          "fr": "Lyngby Porcelæn Rhombe Earth Dinner plate (Marble) – autre vue du fabricant",
          "it": "Lyngby Porcelæn Rhombe Earth Dinner plate (Marble) – altra vista del produttore"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZgLkW/Lyngby-Porcelaen-Rhombe-Earth-Dinner-plate-Marble-201805-xZgLkW.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "detail"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-earth-dinner-plate-3.webp",
        "width": 1600,
        "height": 1067,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Earth Dinner plate – Stimmungsbild des Herstellers mit dem Produkt im Raum",
          "en": "Lyngby Porcelæn Rhombe Earth Dinner plate – manufacturer’s lifestyle photo showing the product in a room",
          "fr": "Lyngby Porcelæn Rhombe Earth Dinner plate – photo d’ambiance du fabricant montrant le produit dans une pièce",
          "it": "Lyngby Porcelæn Rhombe Earth Dinner plate – foto d’ambiente del produttore con il prodotto nella stanza"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZgMGs/Lyngby-Porcelaen-Rhombe-Earth-Dinner-plate-Marble-201805-xZgMGs.webp?d=22399",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-earth-dinner-plate-marble-oe27-cm-201805",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-earth-dinner-plate-marble-oe27-cm-201805",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-earth-dinner-plate-clay-oe27-cm-201807",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-earth-dinner-plate-moss-oe27-cm-201808",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-rhombe-earth-lunch-plate",
      "lyngby-porcelaen-rhombe-earth-bowl",
      "lyngby-porcelaen-rhombe-earth-serving-bowl"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Clay",
            "en": "Clay",
            "fr": "Clay",
            "it": "Clay"
          },
          "betrag": 41.95,
          "sku": "201807",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Marble",
            "en": "Marble",
            "fr": "Marble",
            "it": "Marble"
          },
          "betrag": 41.95,
          "sku": "201805",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Moss",
            "en": "Moss",
            "fr": "Moss",
            "it": "Moss"
          },
          "betrag": 41.95,
          "sku": "201808",
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-earth-dinner-plate-marble-oe27-cm-201805"
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
            "id": "clay",
            "name": {
              "de": "Clay",
              "en": "Clay",
              "fr": "Clay",
              "it": "Clay"
            },
            "code": "201807",
            "betrag": 41.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-earth-dinner-plate-v201807-opt.webp",
                "width": 760,
                "height": 950,
                "alt": {
                  "de": "Lyngby Porcelæn Rhombe Earth Dinner plate (Clay) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Rhombe Earth Dinner plate (Clay) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Rhombe Earth Dinner plate (Clay) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Rhombe Earth Dinner plate (Clay) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/5FPHVFb/Lyngby-Porcelaen-Rhombe-Earth-Dinner-plate-Clay-201807-5FPHVFb.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "marble",
            "name": {
              "de": "Marble",
              "en": "Marble",
              "fr": "Marble",
              "it": "Marble"
            },
            "code": "201805",
            "betrag": 41.95,
            "bilder": [
              "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-earth-dinner-plate-1-opt.webp"
            ],
            "standard": true
          },
          {
            "id": "moss",
            "name": {
              "de": "Moss",
              "en": "Moss",
              "fr": "Moss",
              "it": "Moss"
            },
            "code": "201808",
            "betrag": 41.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-earth-dinner-plate-v201808-opt.webp",
                "width": 760,
                "height": 950,
                "alt": {
                  "de": "Lyngby Porcelæn Rhombe Earth Dinner plate (Moss) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Rhombe Earth Dinner plate (Moss) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Rhombe Earth Dinner plate (Moss) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Rhombe Earth Dinner plate (Moss) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/oQmdqviZApDo/Lyngby-Porcelaen-Rhombe-Earth-Dinner-plate-Moss-201808-oQmdqviZApDo.webp?d=22397",
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
    "slug": "lyngby-porcelaen-rhombe-earth-lunch-plate",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "geschirr",
    "name": "Rhombe Earth Lunch plate",
    "serie": "Rhombe Earth",
    "kurz": {
      "de": "Frühstücksteller der Serie Rhombe Earth aus Porzellan, entworfen von Stilleben v/Reckweg & Nordentoft. Im Shop des Herstellers in 2 Farben und 2 Größen erhältlich.",
      "en": "Lunch plate from the Rhombe Earth series made of porcelain, designed by Stilleben v/Reckweg & Nordentoft. Available in the manufacturer’s shop in 2 colours and 2 sizes.",
      "fr": "Assiette à déjeuner de la série Rhombe Earth en porcelaine, dessinée par Stilleben v/Reckweg & Nordentoft. Disponible dans la boutique du fabricant en 2 couleurs et 2 tailles.",
      "it": "Piatto da colazione della serie Rhombe Earth in porcellana, design di Stilleben v/Reckweg & Nordentoft. Disponibile nel negozio del produttore in 2 colori e 2 misure."
    },
    "merkmale": [
      {
        "de": "Porzellan",
        "en": "Porcelain",
        "fr": "Porcelaine",
        "it": "Porcellana"
      },
      {
        "de": "Design: Stilleben v/Reckweg & Nordentoft",
        "en": "Design: Stilleben v/Reckweg & Nordentoft",
        "fr": "Design : Stilleben v/Reckweg & Nordentoft",
        "it": "Design: Stilleben v/Reckweg & Nordentoft"
      },
      {
        "de": "Serie: Rhombe Earth",
        "en": "Series: Rhombe Earth",
        "fr": "Série : Rhombe Earth",
        "it": "Serie: Rhombe Earth"
      },
      {
        "de": "Farben: Clay, Moss",
        "en": "Colours: Clay, Moss",
        "fr": "Couleurs : Clay, Moss",
        "it": "Colori: Clay, Moss"
      },
      {
        "de": "Größen: Ø 23 cm, Ø 21 cm",
        "en": "Sizes: Ø 23 cm, Ø 21 cm",
        "fr": "Tailles : Ø 23 cm, Ø 21 cm",
        "it": "Misure: Ø 23 cm, Ø 21 cm"
      }
    ],
    "designer": "Stilleben v/Reckweg & Nordentoft",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-earth-lunch-plate-1-opt.webp",
        "width": 710,
        "height": 888,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Earth Lunch plate (Moss · Ø 21 cm) – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Rhombe Earth Lunch plate (Moss · Ø 21 cm) – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Rhombe Earth Lunch plate (Moss · Ø 21 cm) – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Rhombe Earth Lunch plate (Moss · Ø 21 cm) – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZgrst/Lyngby-Porcelaen-Rhombe-Earth-Lunch-plate-Moss-201815-xZgrst.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-earth-lunch-plate-2.webp",
        "width": 1080,
        "height": 1527,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Earth Lunch plate (Moss · Ø 21 cm) – weitere Ansicht des Herstellers",
          "en": "Lyngby Porcelæn Rhombe Earth Lunch plate (Moss · Ø 21 cm) – further view by the manufacturer",
          "fr": "Lyngby Porcelæn Rhombe Earth Lunch plate (Moss · Ø 21 cm) – autre vue du fabricant",
          "it": "Lyngby Porcelæn Rhombe Earth Lunch plate (Moss · Ø 21 cm) – altra vista del produttore"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZgrsv/Lyngby-Porcelaen-Rhombe-Earth-Lunch-plate-Moss-201815-xZgrsv.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "detail"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-earth-lunch-plate-3.webp",
        "width": 1600,
        "height": 1067,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Earth Lunch plate – Stimmungsbild des Herstellers mit dem Produkt im Raum",
          "en": "Lyngby Porcelæn Rhombe Earth Lunch plate – manufacturer’s lifestyle photo showing the product in a room",
          "fr": "Lyngby Porcelæn Rhombe Earth Lunch plate – photo d’ambiance du fabricant montrant le produit dans une pièce",
          "it": "Lyngby Porcelæn Rhombe Earth Lunch plate – foto d’ambiente del produttore con il prodotto nella stanza"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZgMGx/Lyngby-Porcelaen-Rhombe-Earth-Lunch-plate-Moss-201815-xZgMGx.webp?d=22399",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-earth-lunch-plate-moss-oe21-cm-201815",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-earth-lunch-plate-moss-oe21-cm-201815",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-earth-lunch-plate-clay-oe23-cm-201810",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-rhombe-earth-dinner-plate",
      "lyngby-porcelaen-rhombe-earth-bowl",
      "lyngby-porcelaen-rhombe-earth-serving-bowl"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Clay · Ø 23 cm",
            "en": "Clay · Ø 23 cm",
            "fr": "Clay · Ø 23 cm",
            "it": "Clay · Ø 23 cm"
          },
          "betrag": 36.95,
          "sku": "201810",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Moss · Ø 21 cm",
            "en": "Moss · Ø 21 cm",
            "fr": "Moss · Ø 21 cm",
            "it": "Moss · Ø 21 cm"
          },
          "betrag": 33.95,
          "sku": "201815",
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-earth-lunch-plate-moss-oe21-cm-201815"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Ausführung",
          "en": "Version",
          "fr": "Version",
          "it": "Versione"
        },
        "optionen": [
          {
            "id": "clay-23-cm",
            "name": {
              "de": "Clay · Ø 23 cm",
              "en": "Clay · Ø 23 cm",
              "fr": "Clay · Ø 23 cm",
              "it": "Clay · Ø 23 cm"
            },
            "code": "201810",
            "betrag": 36.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-earth-lunch-plate-v201810-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Rhombe Earth Lunch plate (Clay · Ø 23 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Rhombe Earth Lunch plate (Clay · Ø 23 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Rhombe Earth Lunch plate (Clay · Ø 23 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Rhombe Earth Lunch plate (Clay · Ø 23 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZgrsq/Lyngby-Porcelaen-Rhombe-Earth-Lunch-plate-Clay-201810-xZgrsq.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "moss-21-cm",
            "name": {
              "de": "Moss · Ø 21 cm",
              "en": "Moss · Ø 21 cm",
              "fr": "Moss · Ø 21 cm",
              "it": "Moss · Ø 21 cm"
            },
            "code": "201815",
            "betrag": 33.95,
            "bilder": [
              "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-earth-lunch-plate-1-opt.webp"
            ],
            "standard": true
          }
        ]
      }
    ]
  },
  {
    "slug": "lyngby-porcelaen-rhombe-earth-bowl",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "geschirr",
    "name": "Rhombe Earth Bowl",
    "serie": "Rhombe Earth",
    "kurz": {
      "de": "Schale der Serie Rhombe Earth aus Porzellan, entworfen von Stilleben v/Reckweg & Nordentoft. Im Shop des Herstellers in 4 Farben und 3 Größen erhältlich.",
      "en": "Bowl from the Rhombe Earth series made of porcelain, designed by Stilleben v/Reckweg & Nordentoft. Available in the manufacturer’s shop in 4 colours and 3 sizes.",
      "fr": "Bol de la série Rhombe Earth en porcelaine, dessinée par Stilleben v/Reckweg & Nordentoft. Disponible dans la boutique du fabricant en 4 couleurs et 3 tailles.",
      "it": "Ciotola della serie Rhombe Earth in porcellana, design di Stilleben v/Reckweg & Nordentoft. Disponibile nel negozio del produttore in 4 colori e 3 misure."
    },
    "merkmale": [
      {
        "de": "Porzellan",
        "en": "Porcelain",
        "fr": "Porcelaine",
        "it": "Porcellana"
      },
      {
        "de": "Design: Stilleben v/Reckweg & Nordentoft",
        "en": "Design: Stilleben v/Reckweg & Nordentoft",
        "fr": "Design : Stilleben v/Reckweg & Nordentoft",
        "it": "Design: Stilleben v/Reckweg & Nordentoft"
      },
      {
        "de": "Serie: Rhombe Earth",
        "en": "Series: Rhombe Earth",
        "fr": "Série : Rhombe Earth",
        "it": "Serie: Rhombe Earth"
      },
      {
        "de": "Farben: Clay, Marble, Moss, Slate",
        "en": "Colours: Clay, Marble, Moss, Slate",
        "fr": "Couleurs : Clay, Marble, Moss, Slate",
        "it": "Colori: Clay, Marble, Moss, Slate"
      },
      {
        "de": "Größen: Ø 13 cm, Ø 15,5 cm, Ø 11 cm",
        "en": "Sizes: Ø 13 cm, Ø 15.5 cm, Ø 11 cm",
        "fr": "Tailles : Ø 13 cm, Ø 15,5 cm, Ø 11 cm",
        "it": "Misure: Ø 13 cm, Ø 15,5 cm, Ø 11 cm"
      }
    ],
    "designer": "Stilleben v/Reckweg & Nordentoft",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-earth-bowl-1-opt.webp",
        "width": 901,
        "height": 1127,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Earth Bowl (Clay · Ø 13 cm) – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Rhombe Earth Bowl (Clay · Ø 13 cm) – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Rhombe Earth Bowl (Clay · Ø 13 cm) – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Rhombe Earth Bowl (Clay · Ø 13 cm) – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/FNE2asQbudkW/Lyngby-Porcelaen-Rhombe-Earth-Bowl-Clay-201819-FNE2asQbudkW.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-earth-bowl-2.webp",
        "width": 1080,
        "height": 1527,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Earth Bowl (Clay · Ø 13 cm) – weitere Ansicht des Herstellers",
          "en": "Lyngby Porcelæn Rhombe Earth Bowl (Clay · Ø 13 cm) – further view by the manufacturer",
          "fr": "Lyngby Porcelæn Rhombe Earth Bowl (Clay · Ø 13 cm) – autre vue du fabricant",
          "it": "Lyngby Porcelæn Rhombe Earth Bowl (Clay · Ø 13 cm) – altra vista del produttore"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/MiPyhV6st5aT/Lyngby-Porcelaen-Rhombe-Earth-Bowl-Clay-201819-MiPyhV6st5aT.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "detail"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-earth-bowl-3.webp",
        "width": 1600,
        "height": 1067,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Earth Bowl – Stimmungsbild des Herstellers mit dem Produkt im Raum",
          "en": "Lyngby Porcelæn Rhombe Earth Bowl – manufacturer’s lifestyle photo showing the product in a room",
          "fr": "Lyngby Porcelæn Rhombe Earth Bowl – photo d’ambiance du fabricant montrant le produit dans une pièce",
          "it": "Lyngby Porcelæn Rhombe Earth Bowl – foto d’ambiente del produttore con il prodotto nella stanza"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZgMGt/Lyngby-Porcelaen-Rhombe-Earth-Bowl-Clay-201820-xZgMGt.webp?d=22399",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-earth-bowl-clay-oe13-cm-201819",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-earth-bowl-clay-oe13-cm-201819",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-earth-bowl-clay-oe155-cm-201820",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-earth-bowl-marble-oe13-cm-201822",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-earth-bowl-marble-oe155-cm-201823",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-earth-bowl-moss-oe13-cm-201825",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-earth-bowl-slate-oe11-cm-201830",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-rhombe-earth-dinner-plate",
      "lyngby-porcelaen-rhombe-earth-lunch-plate",
      "lyngby-porcelaen-rhombe-earth-serving-bowl"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Clay · Ø 13 cm",
            "en": "Clay · Ø 13 cm",
            "fr": "Clay · Ø 13 cm",
            "it": "Clay · Ø 13 cm"
          },
          "betrag": 36.95,
          "sku": "201819",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Clay · Ø 15,5 cm",
            "en": "Clay · Ø 15.5 cm",
            "fr": "Clay · Ø 15,5 cm",
            "it": "Clay · Ø 15,5 cm"
          },
          "betrag": 44.95,
          "sku": "201820",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Marble · Ø 13 cm",
            "en": "Marble · Ø 13 cm",
            "fr": "Marble · Ø 13 cm",
            "it": "Marble · Ø 13 cm"
          },
          "betrag": 36.95,
          "sku": "201822",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Marble · Ø 15,5 cm",
            "en": "Marble · Ø 15.5 cm",
            "fr": "Marble · Ø 15,5 cm",
            "it": "Marble · Ø 15,5 cm"
          },
          "betrag": 44.95,
          "sku": "201823",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Moss · Ø 13 cm",
            "en": "Moss · Ø 13 cm",
            "fr": "Moss · Ø 13 cm",
            "it": "Moss · Ø 13 cm"
          },
          "betrag": 36.95,
          "sku": "201825",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Slate · Ø 11 cm",
            "en": "Slate · Ø 11 cm",
            "fr": "Slate · Ø 11 cm",
            "it": "Slate · Ø 11 cm"
          },
          "betrag": 27.95,
          "sku": "201830",
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-earth-bowl-clay-oe13-cm-201819"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Ausführung",
          "en": "Version",
          "fr": "Version",
          "it": "Versione"
        },
        "optionen": [
          {
            "id": "clay-13-cm",
            "name": {
              "de": "Clay · Ø 13 cm",
              "en": "Clay · Ø 13 cm",
              "fr": "Clay · Ø 13 cm",
              "it": "Clay · Ø 13 cm"
            },
            "code": "201819",
            "betrag": 36.95,
            "bilder": [
              "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-earth-bowl-1-opt.webp"
            ],
            "standard": true
          },
          {
            "id": "clay-15-5-cm",
            "name": {
              "de": "Clay · Ø 15,5 cm",
              "en": "Clay · Ø 15.5 cm",
              "fr": "Clay · Ø 15,5 cm",
              "it": "Clay · Ø 15,5 cm"
            },
            "code": "201820",
            "betrag": 44.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-earth-bowl-v201820-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Rhombe Earth Bowl (Clay · Ø 15,5 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Rhombe Earth Bowl (Clay · Ø 15.5 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Rhombe Earth Bowl (Clay · Ø 15,5 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Rhombe Earth Bowl (Clay · Ø 15,5 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZgrsx/Lyngby-Porcelaen-Rhombe-Earth-Bowl-Clay-201820-xZgrsx.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "marble-13-cm",
            "name": {
              "de": "Marble · Ø 13 cm",
              "en": "Marble · Ø 13 cm",
              "fr": "Marble · Ø 13 cm",
              "it": "Marble · Ø 13 cm"
            },
            "code": "201822",
            "betrag": 36.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-earth-bowl-v201822-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Rhombe Earth Bowl (Marble · Ø 13 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Rhombe Earth Bowl (Marble · Ø 13 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Rhombe Earth Bowl (Marble · Ø 13 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Rhombe Earth Bowl (Marble · Ø 13 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZgLkZ/Lyngby-Porcelaen-Rhombe-Earth-Bowl-Marble-201822-xZgLkZ.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "marble-15-5-cm",
            "name": {
              "de": "Marble · Ø 15,5 cm",
              "en": "Marble · Ø 15.5 cm",
              "fr": "Marble · Ø 15,5 cm",
              "it": "Marble · Ø 15,5 cm"
            },
            "code": "201823",
            "betrag": 44.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-earth-bowl-v201823-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Rhombe Earth Bowl (Marble · Ø 15,5 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Rhombe Earth Bowl (Marble · Ø 15.5 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Rhombe Earth Bowl (Marble · Ø 15,5 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Rhombe Earth Bowl (Marble · Ø 15,5 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/5FPHVF9/Lyngby-Porcelaen-Rhombe-Earth-Bowl-Marble-201823-5FPHVF9.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "moss-13-cm",
            "name": {
              "de": "Moss · Ø 13 cm",
              "en": "Moss · Ø 13 cm",
              "fr": "Moss · Ø 13 cm",
              "it": "Moss · Ø 13 cm"
            },
            "code": "201825",
            "betrag": 36.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-earth-bowl-v201825-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Rhombe Earth Bowl (Moss · Ø 13 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Rhombe Earth Bowl (Moss · Ø 13 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Rhombe Earth Bowl (Moss · Ø 13 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Rhombe Earth Bowl (Moss · Ø 13 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZgrsH/Lyngby-Porcelaen-Rhombe-Earth-Bowl-Moss-201825-xZgrsH.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "slate-11-cm",
            "name": {
              "de": "Slate · Ø 11 cm",
              "en": "Slate · Ø 11 cm",
              "fr": "Slate · Ø 11 cm",
              "it": "Slate · Ø 11 cm"
            },
            "code": "201830",
            "betrag": 27.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-earth-bowl-v201830-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Rhombe Earth Bowl (Slate · Ø 11 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Rhombe Earth Bowl (Slate · Ø 11 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Rhombe Earth Bowl (Slate · Ø 11 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Rhombe Earth Bowl (Slate · Ø 11 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZgLl3/Lyngby-Porcelaen-Rhombe-Earth-Bowl-Slate-201830-xZgLl3.webp?d=22397",
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
    "slug": "lyngby-porcelaen-rhombe-earth-serving-bowl",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "geschirr",
    "name": "Rhombe Earth Serving bowl",
    "serie": "Rhombe Earth",
    "kurz": {
      "de": "Servierschale der Serie Rhombe Earth aus Porzellan, entworfen von Stilleben v/Reckweg & Nordentoft. Im Shop des Herstellers in 2 Farben und 2 Größen erhältlich.",
      "en": "Serving bowl from the Rhombe Earth series made of porcelain, designed by Stilleben v/Reckweg & Nordentoft. Available in the manufacturer’s shop in 2 colours and 2 sizes.",
      "fr": "Saladier de service de la série Rhombe Earth en porcelaine, dessinée par Stilleben v/Reckweg & Nordentoft. Disponible dans la boutique du fabricant en 2 couleurs et 2 tailles.",
      "it": "Ciotola da portata della serie Rhombe Earth in porcellana, design di Stilleben v/Reckweg & Nordentoft. Disponibile nel negozio del produttore in 2 colori e 2 misure."
    },
    "merkmale": [
      {
        "de": "Porzellan",
        "en": "Porcelain",
        "fr": "Porcelaine",
        "it": "Porcellana"
      },
      {
        "de": "Design: Stilleben v/Reckweg & Nordentoft",
        "en": "Design: Stilleben v/Reckweg & Nordentoft",
        "fr": "Design : Stilleben v/Reckweg & Nordentoft",
        "it": "Design: Stilleben v/Reckweg & Nordentoft"
      },
      {
        "de": "Serie: Rhombe Earth",
        "en": "Series: Rhombe Earth",
        "fr": "Série : Rhombe Earth",
        "it": "Serie: Rhombe Earth"
      },
      {
        "de": "Farben: Clay, Marble",
        "en": "Colours: Clay, Marble",
        "fr": "Couleurs : Clay, Marble",
        "it": "Colori: Clay, Marble"
      },
      {
        "de": "Größen: Ø 17,5 cm, Ø 22 cm",
        "en": "Sizes: Ø 17.5 cm, Ø 22 cm",
        "fr": "Tailles : Ø 17,5 cm, Ø 22 cm",
        "it": "Misure: Ø 17,5 cm, Ø 22 cm"
      }
    ],
    "designer": "Stilleben v/Reckweg & Nordentoft",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-earth-serving-bowl-1-opt.webp",
        "width": 1198,
        "height": 1497,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Earth Serving bowl (Marble · Ø 22 cm) – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Rhombe Earth Serving bowl (Marble · Ø 22 cm) – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Rhombe Earth Serving bowl (Marble · Ø 22 cm) – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Rhombe Earth Serving bowl (Marble · Ø 22 cm) – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZgPJj/Lyngby-Porcelaen-Rhombe-Earth-Serving-bowl-Marble-201821-xZgPJj.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-earth-serving-bowl-2.webp",
        "width": 1080,
        "height": 1527,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Earth Serving bowl (Marble · Ø 22 cm) – weitere Ansicht des Herstellers",
          "en": "Lyngby Porcelæn Rhombe Earth Serving bowl (Marble · Ø 22 cm) – further view by the manufacturer",
          "fr": "Lyngby Porcelæn Rhombe Earth Serving bowl (Marble · Ø 22 cm) – autre vue du fabricant",
          "it": "Lyngby Porcelæn Rhombe Earth Serving bowl (Marble · Ø 22 cm) – altra vista del produttore"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZgNkd/Lyngby-Porcelaen-Rhombe-Earth-Serving-bowl-Marble-201821-xZgNkd.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "detail"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-earth-serving-bowl-3.webp",
        "width": 1600,
        "height": 1067,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Earth Serving bowl – Stimmungsbild des Herstellers mit dem Produkt im Raum",
          "en": "Lyngby Porcelæn Rhombe Earth Serving bowl – manufacturer’s lifestyle photo showing the product in a room",
          "fr": "Lyngby Porcelæn Rhombe Earth Serving bowl – photo d’ambiance du fabricant montrant le produit dans une pièce",
          "it": "Lyngby Porcelæn Rhombe Earth Serving bowl – foto d’ambiente del produttore con il prodotto nella stanza"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/5FPGwt0/Lyngby-Porcelaen-Rhombe-Earth-Serving-bowl-Marble-201821-5FPGwt0.webp?d=22399",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-earth-serving-bowl-marble-oe22-cm-201821",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-earth-serving-bowl-marble-oe22-cm-201821",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-earth-serving-bowl-clay-oe175-cm-201850",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-rhombe-earth-dinner-plate",
      "lyngby-porcelaen-rhombe-earth-lunch-plate",
      "lyngby-porcelaen-rhombe-earth-bowl"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Clay · Ø 17,5 cm",
            "en": "Clay · Ø 17.5 cm",
            "fr": "Clay · Ø 17,5 cm",
            "it": "Clay · Ø 17,5 cm"
          },
          "betrag": 67.95,
          "sku": "201850",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Marble · Ø 22 cm",
            "en": "Marble · Ø 22 cm",
            "fr": "Marble · Ø 22 cm",
            "it": "Marble · Ø 22 cm"
          },
          "betrag": 84.95,
          "sku": "201821",
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-earth-serving-bowl-marble-oe22-cm-201821"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Ausführung",
          "en": "Version",
          "fr": "Version",
          "it": "Versione"
        },
        "optionen": [
          {
            "id": "clay-17-5-cm",
            "name": {
              "de": "Clay · Ø 17,5 cm",
              "en": "Clay · Ø 17.5 cm",
              "fr": "Clay · Ø 17,5 cm",
              "it": "Clay · Ø 17,5 cm"
            },
            "code": "201850",
            "betrag": 67.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-earth-serving-bowl-v201850-opt.webp",
                "width": 730,
                "height": 912,
                "alt": {
                  "de": "Lyngby Porcelæn Rhombe Earth Serving bowl (Clay · Ø 17,5 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Rhombe Earth Serving bowl (Clay · Ø 17.5 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Rhombe Earth Serving bowl (Clay · Ø 17,5 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Rhombe Earth Serving bowl (Clay · Ø 17,5 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/5FPFDs7/Lyngby-Porcelaen-Rhombe-Earth-Serving-bowl-Clay-201850-5FPFDs7.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "marble-22-cm",
            "name": {
              "de": "Marble · Ø 22 cm",
              "en": "Marble · Ø 22 cm",
              "fr": "Marble · Ø 22 cm",
              "it": "Marble · Ø 22 cm"
            },
            "code": "201821",
            "betrag": 84.95,
            "bilder": [
              "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-earth-serving-bowl-1-opt.webp"
            ],
            "standard": true
          }
        ]
      }
    ]
  },
  {
    "slug": "lyngby-porcelaen-rhombe-earth-mug-with-handle",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "geschirr",
    "name": "Rhombe Earth Mug with handle",
    "serie": "Rhombe Earth",
    "kurz": {
      "de": "Becher mit Henkel der Serie Rhombe Earth aus Porzellan, entworfen von Stilleben v/Reckweg & Nordentoft. Im Shop des Herstellers in 4 Farben erhältlich.",
      "en": "Mug with handle from the Rhombe Earth series made of porcelain, designed by Stilleben v/Reckweg & Nordentoft. Available in the manufacturer’s shop in 4 colours.",
      "fr": "Mug avec anse de la série Rhombe Earth en porcelaine, dessinée par Stilleben v/Reckweg & Nordentoft. Disponible dans la boutique du fabricant en 4 couleurs.",
      "it": "Tazza con manico della serie Rhombe Earth in porcellana, design di Stilleben v/Reckweg & Nordentoft. Disponibile nel negozio del produttore in 4 colori."
    },
    "merkmale": [
      {
        "de": "Porzellan",
        "en": "Porcelain",
        "fr": "Porcelaine",
        "it": "Porcellana"
      },
      {
        "de": "Design: Stilleben v/Reckweg & Nordentoft",
        "en": "Design: Stilleben v/Reckweg & Nordentoft",
        "fr": "Design : Stilleben v/Reckweg & Nordentoft",
        "it": "Design: Stilleben v/Reckweg & Nordentoft"
      },
      {
        "de": "Serie: Rhombe Earth",
        "en": "Series: Rhombe Earth",
        "fr": "Série : Rhombe Earth",
        "it": "Serie: Rhombe Earth"
      },
      {
        "de": "Farben: Clay, Marble, Moss, Slate",
        "en": "Colours: Clay, Marble, Moss, Slate",
        "fr": "Couleurs : Clay, Marble, Moss, Slate",
        "it": "Colori: Clay, Marble, Moss, Slate"
      },
      {
        "de": "Volumen 0,39 l",
        "en": "Volume 0.39 l",
        "fr": "Contenance 0,39 l",
        "it": "Capacità 0,39 l"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "9 cm"
      },
      {
        "key": "breite",
        "wert": "12,5 cm"
      },
      {
        "key": "tiefe",
        "wert": "9,5 cm"
      },
      {
        "key": "durchmesser",
        "wert": "9,5 cm"
      }
    ],
    "designer": "Stilleben v/Reckweg & Nordentoft",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-earth-mug-with-handle-1-opt.webp",
        "width": 726,
        "height": 908,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Earth Mug with handle (Moss) – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Rhombe Earth Mug with handle (Moss) – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Rhombe Earth Mug with handle (Moss) – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Rhombe Earth Mug with handle (Moss) – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZgrsQ/Lyngby-Porcelaen-Rhombe-Earth-Mug-with-handle-Moss-201840-xZgrsQ.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-earth-mug-with-handle-2.webp",
        "width": 1080,
        "height": 1527,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Earth Mug with handle (Moss) – weitere Ansicht des Herstellers",
          "en": "Lyngby Porcelæn Rhombe Earth Mug with handle (Moss) – further view by the manufacturer",
          "fr": "Lyngby Porcelæn Rhombe Earth Mug with handle (Moss) – autre vue du fabricant",
          "it": "Lyngby Porcelæn Rhombe Earth Mug with handle (Moss) – altra vista del produttore"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZdqlL/Lyngby-Porcelaen-Rhombe-Earth-Mug-with-handle-Moss-201840-xZdqlL.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "detail"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-earth-mug-with-handle-3.webp",
        "width": 1600,
        "height": 1067,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Earth Mug with handle – Stimmungsbild des Herstellers mit dem Produkt im Raum",
          "en": "Lyngby Porcelæn Rhombe Earth Mug with handle – manufacturer’s lifestyle photo showing the product in a room",
          "fr": "Lyngby Porcelæn Rhombe Earth Mug with handle – photo d’ambiance du fabricant montrant le produit dans une pièce",
          "it": "Lyngby Porcelæn Rhombe Earth Mug with handle – foto d’ambiente del produttore con il prodotto nella stanza"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZgMGM/Lyngby-Porcelaen-Rhombe-Earth-Mug-with-handle-Clay-201843-xZgMGM.webp?d=22399",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-earth-mug-with-handle-moss-39-cl-201840",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-earth-mug-with-handle-moss-39-cl-201840",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-earth-mug-with-handle-clay-39-cl-201843",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-earth-mug-with-handle-marble-39-cl-201842",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-earth-mug-with-handle-slate-39-cl-201841",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-rhombe-earth-dinner-plate",
      "lyngby-porcelaen-rhombe-earth-lunch-plate",
      "lyngby-porcelaen-rhombe-earth-bowl"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Clay",
            "en": "Clay",
            "fr": "Clay",
            "it": "Clay"
          },
          "betrag": 29.95,
          "sku": "201843",
          "inhaltMl": 390,
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Marble",
            "en": "Marble",
            "fr": "Marble",
            "it": "Marble"
          },
          "betrag": 29.95,
          "sku": "201842",
          "inhaltMl": 390,
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Moss",
            "en": "Moss",
            "fr": "Moss",
            "it": "Moss"
          },
          "betrag": 29.95,
          "sku": "201840",
          "inhaltMl": 390,
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Slate",
            "en": "Slate",
            "fr": "Slate",
            "it": "Slate"
          },
          "betrag": 29.95,
          "sku": "201841",
          "inhaltMl": 390,
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-earth-mug-with-handle-moss-39-cl-201840"
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
            "id": "clay",
            "name": {
              "de": "Clay",
              "en": "Clay",
              "fr": "Clay",
              "it": "Clay"
            },
            "code": "201843",
            "betrag": 29.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-earth-mug-with-handle-v201843-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Rhombe Earth Mug with handle (Clay) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Rhombe Earth Mug with handle (Clay) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Rhombe Earth Mug with handle (Clay) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Rhombe Earth Mug with handle (Clay) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZgrsT/Lyngby-Porcelaen-Rhombe-Earth-Mug-with-handle-Clay-201843-xZgrsT.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "marble",
            "name": {
              "de": "Marble",
              "en": "Marble",
              "fr": "Marble",
              "it": "Marble"
            },
            "code": "201842",
            "betrag": 29.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-earth-mug-with-handle-v201842-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Rhombe Earth Mug with handle (Marble) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Rhombe Earth Mug with handle (Marble) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Rhombe Earth Mug with handle (Marble) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Rhombe Earth Mug with handle (Marble) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZgrsS/Lyngby-Porcelaen-Rhombe-Earth-Mug-with-handle-Marble-201842-xZgrsS.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "moss",
            "name": {
              "de": "Moss",
              "en": "Moss",
              "fr": "Moss",
              "it": "Moss"
            },
            "code": "201840",
            "betrag": 29.95,
            "bilder": [
              "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-earth-mug-with-handle-1-opt.webp"
            ],
            "standard": true
          },
          {
            "id": "slate",
            "name": {
              "de": "Slate",
              "en": "Slate",
              "fr": "Slate",
              "it": "Slate"
            },
            "code": "201841",
            "betrag": 29.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-earth-mug-with-handle-v201841-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Rhombe Earth Mug with handle (Slate) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Rhombe Earth Mug with handle (Slate) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Rhombe Earth Mug with handle (Slate) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Rhombe Earth Mug with handle (Slate) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZgrsR/Lyngby-Porcelaen-Rhombe-Earth-Mug-with-handle-Slate-201841-xZgrsR.webp?d=22397",
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
    "slug": "lyngby-porcelaen-rhombe-earth-soup-plate",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "geschirr",
    "name": "Rhombe Earth Soup plate",
    "serie": "Rhombe Earth",
    "kurz": {
      "de": "Suppenteller der Serie Rhombe Earth aus Porzellan, entworfen von Stilleben v/Reckweg & Nordentoft. Das Rautenmuster stammt laut Hersteller aus dem Designarchiv von Lyngby Porcelæn und erschien erstmals 1961 auf der Serie Dan-Ild.",
      "en": "Soup plate from the Rhombe Earth series made of porcelain, designed by Stilleben v/Reckweg & Nordentoft. According to the manufacturer, the rhombus pattern comes from the Lyngby Porcelæn design archive and first appeared on the Dan-Ild range in 1961.",
      "fr": "Assiette creuse de la série Rhombe Earth en porcelaine, dessinée par Stilleben v/Reckweg & Nordentoft. Selon le fabricant, le motif en losange provient des archives de Lyngby Porcelæn et est apparu pour la première fois en 1961 sur la série Dan-Ild.",
      "it": "Piatto fondo della serie Rhombe Earth in porcellana, design di Stilleben v/Reckweg & Nordentoft. Secondo il produttore, il motivo a rombi proviene dall’archivio di Lyngby Porcelæn ed è apparso per la prima volta nel 1961 sulla serie Dan-Ild."
    },
    "merkmale": [
      {
        "de": "Porzellan",
        "en": "Porcelain",
        "fr": "Porcelaine",
        "it": "Porcellana"
      },
      {
        "de": "Design: Stilleben v/Reckweg & Nordentoft",
        "en": "Design: Stilleben v/Reckweg & Nordentoft",
        "fr": "Design : Stilleben v/Reckweg & Nordentoft",
        "it": "Design: Stilleben v/Reckweg & Nordentoft"
      },
      {
        "de": "Serie: Rhombe Earth",
        "en": "Series: Rhombe Earth",
        "fr": "Série : Rhombe Earth",
        "it": "Serie: Rhombe Earth"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "6 cm"
      },
      {
        "key": "durchmesser",
        "wert": "24,5 cm"
      }
    ],
    "designer": "Stilleben v/Reckweg & Nordentoft",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-earth-soup-plate-1-opt.webp",
        "width": 1095,
        "height": 1369,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Earth Soup plate – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Rhombe Earth Soup plate – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Rhombe Earth Soup plate – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Rhombe Earth Soup plate – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZgLl6/Lyngby-Porcelaen-Rhombe-Earth-Soup-plate-Slate-201860-xZgLl6.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-earth-soup-plate-2.webp",
        "width": 1080,
        "height": 1527,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Earth Soup plate – weitere Ansicht des Herstellers",
          "en": "Lyngby Porcelæn Rhombe Earth Soup plate – further view by the manufacturer",
          "fr": "Lyngby Porcelæn Rhombe Earth Soup plate – autre vue du fabricant",
          "it": "Lyngby Porcelæn Rhombe Earth Soup plate – altra vista del produttore"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZgLl7/Lyngby-Porcelaen-Rhombe-Earth-Soup-plate-Slate-201860-xZgLl7.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "detail"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-earth-soup-plate-3.webp",
        "width": 1600,
        "height": 1067,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Earth Soup plate – Stimmungsbild des Herstellers mit dem Produkt im Raum",
          "en": "Lyngby Porcelæn Rhombe Earth Soup plate – manufacturer’s lifestyle photo showing the product in a room",
          "fr": "Lyngby Porcelæn Rhombe Earth Soup plate – photo d’ambiance du fabricant montrant le produit dans une pièce",
          "it": "Lyngby Porcelæn Rhombe Earth Soup plate – foto d’ambiente del produttore con il prodotto nella stanza"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZgMGt/Lyngby-Porcelaen-Rhombe-Earth-Soup-plate-Slate-201860-xZgMGt.webp?d=22399",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-earth-soup-plate-slate-oe245-cm-201860",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-earth-soup-plate-slate-oe245-cm-201860",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-rhombe-earth-dinner-plate",
      "lyngby-porcelaen-rhombe-earth-lunch-plate",
      "lyngby-porcelaen-rhombe-earth-bowl"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Slate",
            "en": "Slate",
            "fr": "Slate",
            "it": "Slate"
          },
          "betrag": 39.95,
          "sku": "201860",
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-earth-soup-plate-slate-oe245-cm-201860"
    }
  },
  {
    "slug": "lyngby-porcelaen-rhombe-earth-oval-serving-dish",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "geschirr",
    "name": "Rhombe Earth Oval serving dish",
    "serie": "Rhombe Earth",
    "kurz": {
      "de": "Ovale Servierplatte der Serie Rhombe Earth aus Porzellan, entworfen von Stilleben v/Reckweg & Nordentoft. Im Shop des Herstellers in 2 Farben und 2 Größen erhältlich.",
      "en": "Oval serving dish from the Rhombe Earth series made of porcelain, designed by Stilleben v/Reckweg & Nordentoft. Available in the manufacturer’s shop in 2 colours and 2 sizes.",
      "fr": "Plat de service ovale de la série Rhombe Earth en porcelaine, dessinée par Stilleben v/Reckweg & Nordentoft. Disponible dans la boutique du fabricant en 2 couleurs et 2 tailles.",
      "it": "Piatto da portata ovale della serie Rhombe Earth in porcellana, design di Stilleben v/Reckweg & Nordentoft. Disponibile nel negozio del produttore in 2 colori e 2 misure."
    },
    "merkmale": [
      {
        "de": "Porzellan",
        "en": "Porcelain",
        "fr": "Porcelaine",
        "it": "Porcellana"
      },
      {
        "de": "Design: Stilleben v/Reckweg & Nordentoft",
        "en": "Design: Stilleben v/Reckweg & Nordentoft",
        "fr": "Design : Stilleben v/Reckweg & Nordentoft",
        "it": "Design: Stilleben v/Reckweg & Nordentoft"
      },
      {
        "de": "Serie: Rhombe Earth",
        "en": "Series: Rhombe Earth",
        "fr": "Série : Rhombe Earth",
        "it": "Serie: Rhombe Earth"
      },
      {
        "de": "Farben: Marble, Moss",
        "en": "Colours: Marble, Moss",
        "fr": "Couleurs : Marble, Moss",
        "it": "Colori: Marble, Moss"
      },
      {
        "de": "Größen: 35x26,5 cm, 28,5x21,5 cm",
        "en": "Sizes: 35x26.5 cm, 28.5x21.5 cm",
        "fr": "Tailles : 35x26,5 cm, 28,5x21,5 cm",
        "it": "Misure: 35x26,5 cm, 28,5x21,5 cm"
      }
    ],
    "designer": "Stilleben v/Reckweg & Nordentoft",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-earth-oval-serving-dish-1-opt.webp",
        "width": 1151,
        "height": 1439,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Earth Oval serving dish (Moss · 28,5x21,5 cm) – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Rhombe Earth Oval serving dish (Moss · 28.5x21.5 cm) – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Rhombe Earth Oval serving dish (Moss · 28,5x21,5 cm) – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Rhombe Earth Oval serving dish (Moss · 28,5x21,5 cm) – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/5FPFMMW/Lyngby-Porcelaen-Rhombe-Earth-Oval-serving-dish-Moss-201870-5FPFMMW.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-earth-oval-serving-dish-2.webp",
        "width": 1080,
        "height": 1527,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Earth Oval serving dish (Moss · 28,5x21,5 cm) – weitere Ansicht des Herstellers",
          "en": "Lyngby Porcelæn Rhombe Earth Oval serving dish (Moss · 28.5x21.5 cm) – further view by the manufacturer",
          "fr": "Lyngby Porcelæn Rhombe Earth Oval serving dish (Moss · 28,5x21,5 cm) – autre vue du fabricant",
          "it": "Lyngby Porcelæn Rhombe Earth Oval serving dish (Moss · 28,5x21,5 cm) – altra vista del produttore"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/5FPG3G9/Lyngby-Porcelaen-Rhombe-Earth-Oval-serving-dish-Moss-201870-5FPG3G9.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "detail"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-earth-oval-serving-dish-3.webp",
        "width": 1600,
        "height": 1067,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Earth Oval serving dish – Stimmungsbild des Herstellers mit dem Produkt im Raum",
          "en": "Lyngby Porcelæn Rhombe Earth Oval serving dish – manufacturer’s lifestyle photo showing the product in a room",
          "fr": "Lyngby Porcelæn Rhombe Earth Oval serving dish – photo d’ambiance du fabricant montrant le produit dans une pièce",
          "it": "Lyngby Porcelæn Rhombe Earth Oval serving dish – foto d’ambiente del produttore con il prodotto nella stanza"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/PgozaHVKvs1D/Lyngby-Porcelaen-Rhombe-Earth-Oval-serving-dish-Moss-201870-PgozaHVKvs1D.webp?d=22399",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-earth-oval-serving-dish-moss-285x215-cm-201870",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-earth-oval-serving-dish-moss-285x215-cm-201870",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-earth-oval-serving-dish-marble-35x265-cm-201871",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-rhombe-earth-dinner-plate",
      "lyngby-porcelaen-rhombe-earth-lunch-plate",
      "lyngby-porcelaen-rhombe-earth-bowl"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Marble · 35x26,5 cm",
            "en": "Marble · 35x26.5 cm",
            "fr": "Marble · 35x26,5 cm",
            "it": "Marble · 35x26,5 cm"
          },
          "betrag": 89.95,
          "sku": "201871",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Moss · 28,5x21,5 cm",
            "en": "Moss · 28.5x21.5 cm",
            "fr": "Moss · 28,5x21,5 cm",
            "it": "Moss · 28,5x21,5 cm"
          },
          "betrag": 79.95,
          "sku": "201870",
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-earth-oval-serving-dish-moss-285x215-cm-201870"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Ausführung",
          "en": "Version",
          "fr": "Version",
          "it": "Versione"
        },
        "optionen": [
          {
            "id": "marble-35x26-5-cm",
            "name": {
              "de": "Marble · 35x26,5 cm",
              "en": "Marble · 35x26.5 cm",
              "fr": "Marble · 35x26,5 cm",
              "it": "Marble · 35x26,5 cm"
            },
            "code": "201871",
            "betrag": 89.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-earth-oval-serving-dish-v201871-opt.webp",
                "width": 740,
                "height": 925,
                "alt": {
                  "de": "Lyngby Porcelæn Rhombe Earth Oval serving dish (Marble · 35x26,5 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Rhombe Earth Oval serving dish (Marble · 35x26.5 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Rhombe Earth Oval serving dish (Marble · 35x26,5 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Rhombe Earth Oval serving dish (Marble · 35x26,5 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/Y3oPJ3IBUOO0/Lyngby-Porcelaen-Rhombe-Earth-Oval-serving-dish-Marble-201871-Y3oPJ3IBUOO0.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "moss-28-5x21-5-cm",
            "name": {
              "de": "Moss · 28,5x21,5 cm",
              "en": "Moss · 28.5x21.5 cm",
              "fr": "Moss · 28,5x21,5 cm",
              "it": "Moss · 28,5x21,5 cm"
            },
            "code": "201870",
            "betrag": 79.95,
            "bilder": [
              "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-earth-oval-serving-dish-1-opt.webp"
            ],
            "standard": true
          }
        ]
      }
    ]
  },
  {
    "slug": "lyngby-porcelaen-rhombe-cake-slicer",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "geschirr",
    "name": "Rhombe Cake slicer",
    "serie": "Rhombe",
    "kurz": {
      "de": "Tortenheber der Serie Rhombe aus recyceltem Stahl.",
      "en": "Cake slicer from the Rhombe series made of recycled steel.",
      "fr": "Pelle à tarte de la série Rhombe en acier recyclé.",
      "it": "Paletta per torte della serie Rhombe in acciaio riciclato."
    },
    "merkmale": [
      {
        "de": "Recycelter Stahl",
        "en": "Recycled steel",
        "fr": "Acier recyclé",
        "it": "Acciaio riciclato"
      },
      {
        "de": "Serie: Rhombe",
        "en": "Series: Rhombe",
        "fr": "Série : Rhombe",
        "it": "Serie: Rhombe"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "3 cm"
      },
      {
        "key": "breite",
        "wert": "25,5 cm"
      },
      {
        "key": "tiefe",
        "wert": "6 cm"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-cake-slicer-1-opt.webp",
        "width": 1162,
        "height": 1452,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Cake slicer – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Rhombe Cake slicer – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Rhombe Cake slicer – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Rhombe Cake slicer – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/ntEFWLLHAyfl/Lyngby-Porcelaen-Rhombe-Cake-slicer-Steel-201888-ntEFWLLHAyfl.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-cake-slicer-2.webp",
        "width": 1080,
        "height": 1527,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Cake slicer – weitere Ansicht des Herstellers",
          "en": "Lyngby Porcelæn Rhombe Cake slicer – further view by the manufacturer",
          "fr": "Lyngby Porcelæn Rhombe Cake slicer – autre vue du fabricant",
          "it": "Lyngby Porcelæn Rhombe Cake slicer – altra vista del produttore"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/qQ3NlfI52G6s/Lyngby-Porcelaen-Rhombe-Cake-slicer-Steel-201888-qQ3NlfI52G6s.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "detail"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-cake-slicer-3.webp",
        "width": 1067,
        "height": 1600,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Cake slicer – Stimmungsbild des Herstellers mit dem Produkt im Raum",
          "en": "Lyngby Porcelæn Rhombe Cake slicer – manufacturer’s lifestyle photo showing the product in a room",
          "fr": "Lyngby Porcelæn Rhombe Cake slicer – photo d’ambiance du fabricant montrant le produit dans une pièce",
          "it": "Lyngby Porcelæn Rhombe Cake slicer – foto d’ambiente del produttore con il prodotto nella stanza"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/kb5GsGrs6Rvb/Lyngby-Porcelaen-Rhombe-Cake-slicer-Steel-201888-kb5GsGrs6Rvb.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-cake-slicer-steel-255-cm-201888",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-cake-slicer-steel-255-cm-201888",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-rhombe-tea-cup-with-saucer",
      "lyngby-porcelaen-rhombe-teapot",
      "lyngby-porcelaen-rhombe-serving-bowl"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Stahl",
            "en": "Steel",
            "fr": "Acier",
            "it": "Acciaio"
          },
          "betrag": 27.95,
          "sku": "201888"
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-cake-slicer-steel-255-cm-201888"
    }
  },
  {
    "slug": "lyngby-porcelaen-rhombe-cake-fork",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "geschirr",
    "name": "Rhombe Cake fork",
    "serie": "Rhombe",
    "kurz": {
      "de": "Kuchengabel der Serie Rhombe aus recyceltem Stahl. Im Set zu 4 Stück.",
      "en": "Cake fork from the Rhombe series made of recycled steel. Set of 4.",
      "fr": "Fourchette à gâteau de la série Rhombe en acier recyclé. Lot de 4 pièces.",
      "it": "Forchetta da dolce della serie Rhombe in acciaio riciclato. Set da 4 pezzi."
    },
    "merkmale": [
      {
        "de": "Recycelter Stahl",
        "en": "Recycled steel",
        "fr": "Acier recyclé",
        "it": "Acciaio riciclato"
      },
      {
        "de": "Serie: Rhombe",
        "en": "Series: Rhombe",
        "fr": "Série : Rhombe",
        "it": "Serie: Rhombe"
      },
      {
        "de": "4 Stück je Packung",
        "en": "4 pieces per pack",
        "fr": "4 pièces par lot",
        "it": "4 pezzi per confezione"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "2 cm"
      },
      {
        "key": "breite",
        "wert": "17 cm"
      },
      {
        "key": "tiefe",
        "wert": "2,5 cm"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-cake-fork-1-opt.webp",
        "width": 781,
        "height": 977,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Cake fork – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Rhombe Cake fork – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Rhombe Cake fork – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Rhombe Cake fork – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/mQ87M1r4Neg6/Lyngby-Porcelaen-Rhombe-Cake-fork-Steel-201889-mQ87M1r4Neg6.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-cake-fork-2.webp",
        "width": 1080,
        "height": 1527,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Cake fork – weitere Ansicht des Herstellers",
          "en": "Lyngby Porcelæn Rhombe Cake fork – further view by the manufacturer",
          "fr": "Lyngby Porcelæn Rhombe Cake fork – autre vue du fabricant",
          "it": "Lyngby Porcelæn Rhombe Cake fork – altra vista del produttore"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/dOmGcxTNV3rx/Lyngby-Porcelaen-Rhombe-Cake-fork-Steel-201889-dOmGcxTNV3rx.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "detail"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-cake-fork-3.webp",
        "width": 1067,
        "height": 1600,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Cake fork – Stimmungsbild des Herstellers mit dem Produkt im Raum",
          "en": "Lyngby Porcelæn Rhombe Cake fork – manufacturer’s lifestyle photo showing the product in a room",
          "fr": "Lyngby Porcelæn Rhombe Cake fork – photo d’ambiance du fabricant montrant le produit dans une pièce",
          "it": "Lyngby Porcelæn Rhombe Cake fork – foto d’ambiente del produttore con il prodotto nella stanza"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/0V6nhYwjw17s/Lyngby-Porcelaen-Rhombe-Cake-fork-Steel-201889-0V6nhYwjw17s.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-cake-fork-steel-17-cm-201889",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-cake-fork-steel-17-cm-201889",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-rhombe-tea-cup-with-saucer",
      "lyngby-porcelaen-rhombe-teapot",
      "lyngby-porcelaen-rhombe-serving-bowl"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Stahl",
            "en": "Steel",
            "fr": "Acier",
            "it": "Acciaio"
          },
          "betrag": 44.95,
          "sku": "201889"
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-cake-fork-steel-17-cm-201889"
    }
  },
  {
    "slug": "lyngby-porcelaen-rhombe-color-bowl",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "geschirr",
    "name": "Rhombe Color Bowl",
    "serie": "Rhombe Color",
    "kurz": {
      "de": "Schale der Serie Rhombe Color aus Porzellan, entworfen von Stilleben v/Reckweg & Nordentoft. Im Shop des Herstellers in 9 Farben und 3 Größen erhältlich.",
      "en": "Bowl from the Rhombe Color series made of porcelain, designed by Stilleben v/Reckweg & Nordentoft. Available in the manufacturer’s shop in 9 colours and 3 sizes.",
      "fr": "Bol de la série Rhombe Color en porcelaine, dessinée par Stilleben v/Reckweg & Nordentoft. Disponible dans la boutique du fabricant en 9 couleurs et 3 tailles.",
      "it": "Ciotola della serie Rhombe Color in porcellana, design di Stilleben v/Reckweg & Nordentoft. Disponibile nel negozio del produttore in 9 colori e 3 misure."
    },
    "merkmale": [
      {
        "de": "Porzellan",
        "en": "Porcelain",
        "fr": "Porcelaine",
        "it": "Porcellana"
      },
      {
        "de": "Design: Stilleben v/Reckweg & Nordentoft",
        "en": "Design: Stilleben v/Reckweg & Nordentoft",
        "fr": "Design : Stilleben v/Reckweg & Nordentoft",
        "it": "Design: Stilleben v/Reckweg & Nordentoft"
      },
      {
        "de": "Serie: Rhombe Color",
        "en": "Series: Rhombe Color",
        "fr": "Série : Rhombe Color",
        "it": "Serie: Rhombe Color"
      },
      {
        "de": "Farben: Aqua, Blau, Dunkelblau, Grün, Violett, Rosa, Sand, Türkis, Gelb",
        "en": "Colours: Aqua, Blue, Dark blue, Green, Purple, Rose, Sand, Turquoise, Yellow",
        "fr": "Couleurs : Aqua, Bleu, Bleu foncé, Vert, Violet, Rose, Sable, Turquoise, Jaune",
        "it": "Colori: Acqua, Blu, Blu scuro, Verde, Viola, Rosa, Sabbia, Turchese, Giallo"
      },
      {
        "de": "Größen: Ø 13 cm, Ø 15,5 cm, Ø 11 cm",
        "en": "Sizes: Ø 13 cm, Ø 15.5 cm, Ø 11 cm",
        "fr": "Tailles : Ø 13 cm, Ø 15,5 cm, Ø 11 cm",
        "it": "Misure: Ø 13 cm, Ø 15,5 cm, Ø 11 cm"
      }
    ],
    "designer": "Stilleben v/Reckweg & Nordentoft",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-bowl-1-opt.webp",
        "width": 875,
        "height": 1094,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Color Bowl (Violett · Ø 15,5 cm) – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Rhombe Color Bowl (Purple · Ø 15.5 cm) – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Rhombe Color Bowl (Violet · Ø 15,5 cm) – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Rhombe Color Bowl (Viola · Ø 15,5 cm) – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZcCM0/Lyngby-Porcelaen-Rhombe-Color-Bowl-Purple-201912-xZcCM0.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-bowl-2.webp",
        "width": 1080,
        "height": 1527,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Color Bowl (Violett · Ø 15,5 cm) – weitere Ansicht des Herstellers",
          "en": "Lyngby Porcelæn Rhombe Color Bowl (Purple · Ø 15.5 cm) – further view by the manufacturer",
          "fr": "Lyngby Porcelæn Rhombe Color Bowl (Violet · Ø 15,5 cm) – autre vue du fabricant",
          "it": "Lyngby Porcelæn Rhombe Color Bowl (Viola · Ø 15,5 cm) – altra vista del produttore"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbJw2/Lyngby-Porcelaen-Rhombe-Color-Bowl-Purple-201912-xZbJw2.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "detail"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-bowl-3.webp",
        "width": 1600,
        "height": 1067,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Color Bowl – Stimmungsbild des Herstellers mit dem Produkt im Raum",
          "en": "Lyngby Porcelæn Rhombe Color Bowl – manufacturer’s lifestyle photo showing the product in a room",
          "fr": "Lyngby Porcelæn Rhombe Color Bowl – photo d’ambiance du fabricant montrant le produit dans une pièce",
          "it": "Lyngby Porcelæn Rhombe Color Bowl – foto d’ambiente del produttore con il prodotto nella stanza"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZcpm9/Lyngby-Porcelaen-Rhombe-Color-Bowl-Rose-201901.webp?d=22399",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-bowl-purple-oe155-cm-201912",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-bowl-purple-oe155-cm-201912",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-bowl-aqua-oe13-cm-201905",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-bowl-blue-oe13-cm-201906",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-bowl-blue-oe155-cm-201911",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-bowl-dark-blue-oe13-cm-201907",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-bowl-dark-blue-oe155-cm-201913",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-bowl-green-oe11-cm-201902",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-bowl-rose-oe11-cm-201901",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-bowl-sand-oe13-cm-201908",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-bowl-sand-oe155-cm-201914",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-bowl-turquoise-oe11-cm-201900",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-bowl-yellow-oe11-cm-201903",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-rhombe-color-milk-jug",
      "lyngby-porcelaen-rhombe-color-sauce-boat",
      "lyngby-porcelaen-rhombe-color-serving-bowl"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Aqua · Ø 13 cm",
            "en": "Aqua · Ø 13 cm",
            "fr": "Aqua · Ø 13 cm",
            "it": "Acqua · Ø 13 cm"
          },
          "betrag": 36.95,
          "sku": "201905",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Blau · Ø 13 cm",
            "en": "Blue · Ø 13 cm",
            "fr": "Bleu · Ø 13 cm",
            "it": "Blu · Ø 13 cm"
          },
          "betrag": 36.95,
          "sku": "201906",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Blau · Ø 15,5 cm",
            "en": "Blue · Ø 15.5 cm",
            "fr": "Bleu · Ø 15,5 cm",
            "it": "Blu · Ø 15,5 cm"
          },
          "betrag": 44.95,
          "sku": "201911",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Dunkelblau · Ø 13 cm",
            "en": "Dark blue · Ø 13 cm",
            "fr": "Bleu foncé · Ø 13 cm",
            "it": "Blu scuro · Ø 13 cm"
          },
          "betrag": 36.95,
          "sku": "201907",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Dunkelblau · Ø 15,5 cm",
            "en": "Dark blue · Ø 15.5 cm",
            "fr": "Bleu foncé · Ø 15,5 cm",
            "it": "Blu scuro · Ø 15,5 cm"
          },
          "betrag": 44.95,
          "sku": "201913",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Grün · Ø 11 cm",
            "en": "Green · Ø 11 cm",
            "fr": "Vert · Ø 11 cm",
            "it": "Verde · Ø 11 cm"
          },
          "betrag": 27.95,
          "sku": "201902",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Violett · Ø 15,5 cm",
            "en": "Purple · Ø 15.5 cm",
            "fr": "Violet · Ø 15,5 cm",
            "it": "Viola · Ø 15,5 cm"
          },
          "betrag": 44.95,
          "sku": "201912",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Rosa · Ø 11 cm",
            "en": "Rose · Ø 11 cm",
            "fr": "Rose · Ø 11 cm",
            "it": "Rosa · Ø 11 cm"
          },
          "betrag": 27.95,
          "sku": "201901",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Sand · Ø 13 cm",
            "en": "Sand · Ø 13 cm",
            "fr": "Sable · Ø 13 cm",
            "it": "Sabbia · Ø 13 cm"
          },
          "betrag": 36.95,
          "sku": "201908",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Sand · Ø 15,5 cm",
            "en": "Sand · Ø 15.5 cm",
            "fr": "Sable · Ø 15,5 cm",
            "it": "Sabbia · Ø 15,5 cm"
          },
          "betrag": 44.95,
          "sku": "201914",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Türkis · Ø 11 cm",
            "en": "Turquoise · Ø 11 cm",
            "fr": "Turquoise · Ø 11 cm",
            "it": "Turchese · Ø 11 cm"
          },
          "betrag": 27.95,
          "sku": "201900",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Gelb · Ø 11 cm",
            "en": "Yellow · Ø 11 cm",
            "fr": "Jaune · Ø 11 cm",
            "it": "Giallo · Ø 11 cm"
          },
          "betrag": 27.95,
          "sku": "201903",
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-bowl-purple-oe155-cm-201912"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Ausführung",
          "en": "Version",
          "fr": "Version",
          "it": "Versione"
        },
        "optionen": [
          {
            "id": "aqua-13-cm",
            "name": {
              "de": "Aqua · Ø 13 cm",
              "en": "Aqua · Ø 13 cm",
              "fr": "Aqua · Ø 13 cm",
              "it": "Acqua · Ø 13 cm"
            },
            "code": "201905",
            "betrag": 36.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-bowl-v201905-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Rhombe Color Bowl (Aqua · Ø 13 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Rhombe Color Bowl (Aqua · Ø 13 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Rhombe Color Bowl (Aqua · Ø 13 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Rhombe Color Bowl (Acqua · Ø 13 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZb9wd/Lyngby-Porcelaen-Rhombe-Color-Bowl-Aqua-201905.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "blue-13-cm",
            "name": {
              "de": "Blau · Ø 13 cm",
              "en": "Blue · Ø 13 cm",
              "fr": "Bleu · Ø 13 cm",
              "it": "Blu · Ø 13 cm"
            },
            "code": "201906",
            "betrag": 36.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-bowl-v201906-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Rhombe Color Bowl (Blau · Ø 13 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Rhombe Color Bowl (Blue · Ø 13 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Rhombe Color Bowl (Bleu · Ø 13 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Rhombe Color Bowl (Blu · Ø 13 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZcCDX/Lyngby-Porcelaen-Rhombe-Color-Bowl-Blue-201906.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "blue-15-5-cm",
            "name": {
              "de": "Blau · Ø 15,5 cm",
              "en": "Blue · Ø 15.5 cm",
              "fr": "Bleu · Ø 15,5 cm",
              "it": "Blu · Ø 15,5 cm"
            },
            "code": "201911",
            "betrag": 44.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-bowl-v201911-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Rhombe Color Bowl (Blau · Ø 15,5 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Rhombe Color Bowl (Blue · Ø 15.5 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Rhombe Color Bowl (Bleu · Ø 15,5 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Rhombe Color Bowl (Blu · Ø 15,5 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZcCS4/Lyngby-Porcelaen-Rhombe-Color-Bowl-Blue-201911-xZcCS4.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "dark-blue-13-cm",
            "name": {
              "de": "Dunkelblau · Ø 13 cm",
              "en": "Dark blue · Ø 13 cm",
              "fr": "Bleu foncé · Ø 13 cm",
              "it": "Blu scuro · Ø 13 cm"
            },
            "code": "201907",
            "betrag": 36.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-bowl-v201907-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Rhombe Color Bowl (Dunkelblau · Ø 13 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Rhombe Color Bowl (Dark blue · Ø 13 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Rhombe Color Bowl (Bleu foncé · Ø 13 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Rhombe Color Bowl (Blu scuro · Ø 13 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZcCDZ/Lyngby-Porcelaen-Rhombe-Color-Bowl-Dark-blue-201907.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "dark-blue-15-5-cm",
            "name": {
              "de": "Dunkelblau · Ø 15,5 cm",
              "en": "Dark blue · Ø 15.5 cm",
              "fr": "Bleu foncé · Ø 15,5 cm",
              "it": "Blu scuro · Ø 15,5 cm"
            },
            "code": "201913",
            "betrag": 44.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-bowl-v201913-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Rhombe Color Bowl (Dunkelblau · Ø 15,5 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Rhombe Color Bowl (Dark blue · Ø 15.5 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Rhombe Color Bowl (Bleu foncé · Ø 15,5 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Rhombe Color Bowl (Blu scuro · Ø 15,5 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZcCS5/Lyngby-Porcelaen-Rhombe-Color-Bowl-Dark-blue-201913-xZcCS5.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "green-11-cm",
            "name": {
              "de": "Grün · Ø 11 cm",
              "en": "Green · Ø 11 cm",
              "fr": "Vert · Ø 11 cm",
              "it": "Verde · Ø 11 cm"
            },
            "code": "201902",
            "betrag": 27.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-bowl-v201902-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Rhombe Color Bowl (Grün · Ø 11 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Rhombe Color Bowl (Green · Ø 11 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Rhombe Color Bowl (Vert · Ø 11 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Rhombe Color Bowl (Verde · Ø 11 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZcCDV/Lyngby-Porcelaen-Rhombe-Color-Bowl-Green-201902.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "purple-15-5-cm",
            "name": {
              "de": "Violett · Ø 15,5 cm",
              "en": "Purple · Ø 15.5 cm",
              "fr": "Violet · Ø 15,5 cm",
              "it": "Viola · Ø 15,5 cm"
            },
            "code": "201912",
            "betrag": 44.95,
            "bilder": [
              "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-bowl-1-opt.webp"
            ],
            "standard": true
          },
          {
            "id": "rose-11-cm",
            "name": {
              "de": "Rosa · Ø 11 cm",
              "en": "Rose · Ø 11 cm",
              "fr": "Rose · Ø 11 cm",
              "it": "Rosa · Ø 11 cm"
            },
            "code": "201901",
            "betrag": 27.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-bowl-v201901-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Rhombe Color Bowl (Rosa · Ø 11 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Rhombe Color Bowl (Rose · Ø 11 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Rhombe Color Bowl (Rose · Ø 11 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Rhombe Color Bowl (Rosa · Ø 11 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZcCDT/Lyngby-Porcelaen-Rhombe-Color-Bowl-Rose-201901.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "sand-13-cm",
            "name": {
              "de": "Sand · Ø 13 cm",
              "en": "Sand · Ø 13 cm",
              "fr": "Sable · Ø 13 cm",
              "it": "Sabbia · Ø 13 cm"
            },
            "code": "201908",
            "betrag": 36.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-bowl-v201908-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Rhombe Color Bowl (Sand · Ø 13 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Rhombe Color Bowl (Sand · Ø 13 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Rhombe Color Bowl (Sable · Ø 13 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Rhombe Color Bowl (Sabbia · Ø 13 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZcCF0/Lyngby-Porcelaen-Rhombe-Color-Bowl-Sand-201908.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "sand-15-5-cm",
            "name": {
              "de": "Sand · Ø 15,5 cm",
              "en": "Sand · Ø 15.5 cm",
              "fr": "Sable · Ø 15,5 cm",
              "it": "Sabbia · Ø 15,5 cm"
            },
            "code": "201914",
            "betrag": 44.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-bowl-v201914-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Rhombe Color Bowl (Sand · Ø 15,5 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Rhombe Color Bowl (Sand · Ø 15.5 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Rhombe Color Bowl (Sable · Ø 15,5 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Rhombe Color Bowl (Sabbia · Ø 15,5 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZcCM1/Lyngby-Porcelaen-Rhombe-Color-Bowl-Sand-201914-xZcCM1.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "turquoise-11-cm",
            "name": {
              "de": "Türkis · Ø 11 cm",
              "en": "Turquoise · Ø 11 cm",
              "fr": "Turquoise · Ø 11 cm",
              "it": "Turchese · Ø 11 cm"
            },
            "code": "201900",
            "betrag": 27.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-bowl-v201900-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Rhombe Color Bowl (Türkis · Ø 11 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Rhombe Color Bowl (Turquoise · Ø 11 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Rhombe Color Bowl (Turquoise · Ø 11 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Rhombe Color Bowl (Turchese · Ø 11 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZb9wc/Lyngby-Porcelaen-Rhombe-Color-Bowl-Turquoise-201900.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "yellow-11-cm",
            "name": {
              "de": "Gelb · Ø 11 cm",
              "en": "Yellow · Ø 11 cm",
              "fr": "Jaune · Ø 11 cm",
              "it": "Giallo · Ø 11 cm"
            },
            "code": "201903",
            "betrag": 27.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-bowl-v201903-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Rhombe Color Bowl (Gelb · Ø 11 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Rhombe Color Bowl (Yellow · Ø 11 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Rhombe Color Bowl (Jaune · Ø 11 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Rhombe Color Bowl (Giallo · Ø 11 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZcCDW/Lyngby-Porcelaen-Rhombe-Color-Bowl-Yellow-201903.webp?d=22397",
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
    "slug": "lyngby-porcelaen-rhombe-color-serving-bowl",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "geschirr",
    "name": "Rhombe Color Serving bowl",
    "serie": "Rhombe Color",
    "kurz": {
      "de": "Servierschale der Serie Rhombe Color aus Porzellan, entworfen von Stilleben v/Reckweg & Nordentoft. Im Shop des Herstellers in 3 Farben und 3 Größen erhältlich.",
      "en": "Serving bowl from the Rhombe Color series made of porcelain, designed by Stilleben v/Reckweg & Nordentoft. Available in the manufacturer’s shop in 3 colours and 3 sizes.",
      "fr": "Saladier de service de la série Rhombe Color en porcelaine, dessinée par Stilleben v/Reckweg & Nordentoft. Disponible dans la boutique du fabricant en 3 couleurs et 3 tailles.",
      "it": "Ciotola da portata della serie Rhombe Color in porcellana, design di Stilleben v/Reckweg & Nordentoft. Disponibile nel negozio del produttore in 3 colori e 3 misure."
    },
    "merkmale": [
      {
        "de": "Porzellan",
        "en": "Porcelain",
        "fr": "Porcelaine",
        "it": "Porcellana"
      },
      {
        "de": "Design: Stilleben v/Reckweg & Nordentoft",
        "en": "Design: Stilleben v/Reckweg & Nordentoft",
        "fr": "Design : Stilleben v/Reckweg & Nordentoft",
        "it": "Design: Stilleben v/Reckweg & Nordentoft"
      },
      {
        "de": "Serie: Rhombe Color",
        "en": "Series: Rhombe Color",
        "fr": "Série : Rhombe Color",
        "it": "Serie: Rhombe Color"
      },
      {
        "de": "Farben: Blau, Dunkelblau, Grün",
        "en": "Colours: Blue, Dark blue, Green",
        "fr": "Couleurs : Bleu, Bleu foncé, Vert",
        "it": "Colori: Blu, Blu scuro, Verde"
      },
      {
        "de": "Größen: Ø 17,5 cm, Ø 22 cm, Ø 28,5 cm",
        "en": "Sizes: Ø 17.5 cm, Ø 22 cm, Ø 28.5 cm",
        "fr": "Tailles : Ø 17,5 cm, Ø 22 cm, Ø 28,5 cm",
        "it": "Misure: Ø 17,5 cm, Ø 22 cm, Ø 28,5 cm"
      }
    ],
    "designer": "Stilleben v/Reckweg & Nordentoft",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-serving-bowl-1-opt.webp",
        "width": 988,
        "height": 1234,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Color Serving bowl (Grün · Ø 28,5 cm) – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Rhombe Color Serving bowl (Green · Ø 28.5 cm) – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Rhombe Color Serving bowl (Vert · Ø 28,5 cm) – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Rhombe Color Serving bowl (Verde · Ø 28,5 cm) – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZcD05/Lyngby-Porcelaen-Rhombe-Color-Serving-bowl-Green-201919-xZcD05.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-serving-bowl-2.webp",
        "width": 1080,
        "height": 1527,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Color Serving bowl (Grün · Ø 28,5 cm) – weitere Ansicht des Herstellers",
          "en": "Lyngby Porcelæn Rhombe Color Serving bowl (Green · Ø 28.5 cm) – further view by the manufacturer",
          "fr": "Lyngby Porcelæn Rhombe Color Serving bowl (Vert · Ø 28,5 cm) – autre vue du fabricant",
          "it": "Lyngby Porcelæn Rhombe Color Serving bowl (Verde · Ø 28,5 cm) – altra vista del produttore"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZccQk/Lyngby-Porcelaen-Rhombe-Color-Serving-bowl-Green-201919-xZccQk.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "detail"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-serving-bowl-3.webp",
        "width": 1080,
        "height": 1512,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Color Serving bowl – Stimmungsbild des Herstellers mit dem Produkt im Raum",
          "en": "Lyngby Porcelæn Rhombe Color Serving bowl – manufacturer’s lifestyle photo showing the product in a room",
          "fr": "Lyngby Porcelæn Rhombe Color Serving bowl – photo d’ambiance du fabricant montrant le produit dans une pièce",
          "it": "Lyngby Porcelæn Rhombe Color Serving bowl – foto d’ambiente del produttore con il prodotto nella stanza"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZf73X/Lyngby-Porcelaen-Rhombe-Color-Serving-bowl-Green-201919.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-serving-bowl-green-oe28-cm-201919",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-serving-bowl-green-oe28-cm-201919",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-serving-bowl-blue-oe175-cm-201910",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-serving-bowl-dark-blue-oe22-cm-201915",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-rhombe-color-milk-jug",
      "lyngby-porcelaen-rhombe-color-sauce-boat",
      "lyngby-porcelaen-rhombe-color-bowl"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Blau · Ø 17,5 cm",
            "en": "Blue · Ø 17.5 cm",
            "fr": "Bleu · Ø 17,5 cm",
            "it": "Blu · Ø 17,5 cm"
          },
          "betrag": 67.95,
          "sku": "201910",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Dunkelblau · Ø 22 cm",
            "en": "Dark blue · Ø 22 cm",
            "fr": "Bleu foncé · Ø 22 cm",
            "it": "Blu scuro · Ø 22 cm"
          },
          "betrag": 84.95,
          "sku": "201915",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Grün · Ø 28,5 cm",
            "en": "Green · Ø 28.5 cm",
            "fr": "Vert · Ø 28,5 cm",
            "it": "Verde · Ø 28,5 cm"
          },
          "betrag": 89.95,
          "sku": "201919",
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-serving-bowl-green-oe28-cm-201919"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Ausführung",
          "en": "Version",
          "fr": "Version",
          "it": "Versione"
        },
        "optionen": [
          {
            "id": "blue-17-5-cm",
            "name": {
              "de": "Blau · Ø 17,5 cm",
              "en": "Blue · Ø 17.5 cm",
              "fr": "Bleu · Ø 17,5 cm",
              "it": "Blu · Ø 17,5 cm"
            },
            "code": "201910",
            "betrag": 67.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-serving-bowl-v201910-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Rhombe Color Serving bowl (Blau · Ø 17,5 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Rhombe Color Serving bowl (Blue · Ø 17.5 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Rhombe Color Serving bowl (Bleu · Ø 17,5 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Rhombe Color Serving bowl (Blu · Ø 17,5 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZb9wf/Lyngby-Porcelaen-Rhombe-Color-Serving-bowl-Blue-201910.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "dark-blue-22-cm",
            "name": {
              "de": "Dunkelblau · Ø 22 cm",
              "en": "Dark blue · Ø 22 cm",
              "fr": "Bleu foncé · Ø 22 cm",
              "it": "Blu scuro · Ø 22 cm"
            },
            "code": "201915",
            "betrag": 84.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-serving-bowl-v201915-opt.webp",
                "width": 762,
                "height": 953,
                "alt": {
                  "de": "Lyngby Porcelæn Rhombe Color Serving bowl (Dunkelblau · Ø 22 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Rhombe Color Serving bowl (Dark blue · Ø 22 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Rhombe Color Serving bowl (Bleu foncé · Ø 22 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Rhombe Color Serving bowl (Blu scuro · Ø 22 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZb9wg/Lyngby-Porcelaen-Rhombe-Color-Serving-bowl-Dark-blue-201915-xZb9wg.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "green-28-5-cm",
            "name": {
              "de": "Grün · Ø 28,5 cm",
              "en": "Green · Ø 28.5 cm",
              "fr": "Vert · Ø 28,5 cm",
              "it": "Verde · Ø 28,5 cm"
            },
            "code": "201919",
            "betrag": 89.95,
            "bilder": [
              "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-serving-bowl-1-opt.webp"
            ],
            "standard": true
          }
        ]
      }
    ]
  },
  {
    "slug": "lyngby-porcelaen-rhombe-color-vase",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "vase",
    "name": "Rhombe Color Vase",
    "serie": "Rhombe Color",
    "kurz": {
      "de": "Vase der Serie Rhombe Color aus Porzellan, entworfen von Stilleben v/Reckweg & Nordentoft. Im Shop des Herstellers in 4 Farben und 2 Größen erhältlich.",
      "en": "Vase from the Rhombe Color series made of porcelain, designed by Stilleben v/Reckweg & Nordentoft. Available in the manufacturer’s shop in 4 colours and 2 sizes.",
      "fr": "Vase de la série Rhombe Color en porcelaine, dessinée par Stilleben v/Reckweg & Nordentoft. Disponible dans la boutique du fabricant en 4 couleurs et 2 tailles.",
      "it": "Vaso della serie Rhombe Color in porcellana, design di Stilleben v/Reckweg & Nordentoft. Disponibile nel negozio del produttore in 4 colori e 2 misure."
    },
    "merkmale": [
      {
        "de": "Porzellan",
        "en": "Porcelain",
        "fr": "Porcelaine",
        "it": "Porcellana"
      },
      {
        "de": "Design: Stilleben v/Reckweg & Nordentoft",
        "en": "Design: Stilleben v/Reckweg & Nordentoft",
        "fr": "Design : Stilleben v/Reckweg & Nordentoft",
        "it": "Design: Stilleben v/Reckweg & Nordentoft"
      },
      {
        "de": "Serie: Rhombe Color",
        "en": "Series: Rhombe Color",
        "fr": "Série : Rhombe Color",
        "it": "Serie: Rhombe Color"
      },
      {
        "de": "Farben: Aqua, Blau, Rosa, Gelb",
        "en": "Colours: Aqua, Blue, Rose, Yellow",
        "fr": "Couleurs : Aqua, Bleu, Rose, Jaune",
        "it": "Colori: Acqua, Blu, Rosa, Giallo"
      },
      {
        "de": "Größen: H 15 cm, H 20 cm",
        "en": "Sizes: H 15 cm, H 20 cm",
        "fr": "Tailles : H 15 cm, H 20 cm",
        "it": "Misure: H 15 cm, H 20 cm"
      }
    ],
    "designer": "Stilleben v/Reckweg & Nordentoft",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-vase-1-opt.webp",
        "width": 1160,
        "height": 1450,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Color Vase (Gelb · H 20 cm) – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Rhombe Color Vase (Yellow · H 20 cm) – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Rhombe Color Vase (Jaune · H 20 cm) – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Rhombe Color Vase (Giallo · H 20 cm) – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZcCJx/Lyngby-Porcelaen-Rhombe-Color-Vase-Yellow-201922-xZcCJx.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-vase-2.webp",
        "width": 1080,
        "height": 1527,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Color Vase (Gelb · H 20 cm) – weitere Ansicht des Herstellers",
          "en": "Lyngby Porcelæn Rhombe Color Vase (Yellow · H 20 cm) – further view by the manufacturer",
          "fr": "Lyngby Porcelæn Rhombe Color Vase (Jaune · H 20 cm) – autre vue du fabricant",
          "it": "Lyngby Porcelæn Rhombe Color Vase (Giallo · H 20 cm) – altra vista del produttore"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZ9vZk/Lyngby-Porcelaen-Rhombe-Color-Vase-Yellow-201922-xZ9vZk.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "detail"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-vase-3.webp",
        "width": 1600,
        "height": 1067,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Color Vase – Stimmungsbild des Herstellers mit dem Produkt im Raum",
          "en": "Lyngby Porcelæn Rhombe Color Vase – manufacturer’s lifestyle photo showing the product in a room",
          "fr": "Lyngby Porcelæn Rhombe Color Vase – photo d’ambiance du fabricant montrant le produit dans une pièce",
          "it": "Lyngby Porcelæn Rhombe Color Vase – foto d’ambiente del produttore con il prodotto nella stanza"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/2SP4pC/Lyngby-Porcelaen-Rhombe-Color-Vase-Yellow-201922-2SP4pC.webp?d=22399",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-vase-yellow-h20-cm-201922",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-vase-yellow-h20-cm-201922",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-vase-aqua-h15-cm-201923",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-vase-blue-h20-cm-201924",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-vase-rose-h20-cm-201921",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-rhombe-color-milk-jug",
      "lyngby-porcelaen-rhombe-color-sauce-boat",
      "lyngby-porcelaen-rhombe-color-bowl"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Aqua · H 15 cm",
            "en": "Aqua · H 15 cm",
            "fr": "Aqua · H 15 cm",
            "it": "Acqua · H 15 cm"
          },
          "betrag": 69.95,
          "sku": "201923",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Blau · H 20 cm",
            "en": "Blue · H 20 cm",
            "fr": "Bleu · H 20 cm",
            "it": "Blu · H 20 cm"
          },
          "betrag": 99.95,
          "sku": "201924",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Rosa · H 20 cm",
            "en": "Rose · H 20 cm",
            "fr": "Rose · H 20 cm",
            "it": "Rosa · H 20 cm"
          },
          "betrag": 99.95,
          "sku": "201921",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Gelb · H 20 cm",
            "en": "Yellow · H 20 cm",
            "fr": "Jaune · H 20 cm",
            "it": "Giallo · H 20 cm"
          },
          "betrag": 99.95,
          "sku": "201922",
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-vase-yellow-h20-cm-201922"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Ausführung",
          "en": "Version",
          "fr": "Version",
          "it": "Versione"
        },
        "optionen": [
          {
            "id": "aqua-h-15-cm",
            "name": {
              "de": "Aqua · H 15 cm",
              "en": "Aqua · H 15 cm",
              "fr": "Aqua · H 15 cm",
              "it": "Acqua · H 15 cm"
            },
            "code": "201923",
            "betrag": 69.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-vase-v201923-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Rhombe Color Vase (Aqua · H 15 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Rhombe Color Vase (Aqua · H 15 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Rhombe Color Vase (Aqua · H 15 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Rhombe Color Vase (Acqua · H 15 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZcCM2/Lyngby-Porcelaen-Rhombe-Color-Vase-Aqua-201923-xZcCM2.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "blue-h-20-cm",
            "name": {
              "de": "Blau · H 20 cm",
              "en": "Blue · H 20 cm",
              "fr": "Bleu · H 20 cm",
              "it": "Blu · H 20 cm"
            },
            "code": "201924",
            "betrag": 99.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-vase-v201924-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Rhombe Color Vase (Blau · H 20 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Rhombe Color Vase (Blue · H 20 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Rhombe Color Vase (Bleu · H 20 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Rhombe Color Vase (Blu · H 20 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZcCM3/Lyngby-Porcelaen-Rhombe-Color-Vase-Blue-201924-xZcCM3.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "rose-h-20-cm",
            "name": {
              "de": "Rosa · H 20 cm",
              "en": "Rose · H 20 cm",
              "fr": "Rose · H 20 cm",
              "it": "Rosa · H 20 cm"
            },
            "code": "201921",
            "betrag": 99.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-vase-v201921-opt.webp",
                "width": 801,
                "height": 1001,
                "alt": {
                  "de": "Lyngby Porcelæn Rhombe Color Vase (Rosa · H 20 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Rhombe Color Vase (Rose · H 20 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Rhombe Color Vase (Rose · H 20 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Rhombe Color Vase (Rosa · H 20 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZcCJw/Lyngby-Porcelaen-Rhombe-Color-Vase-Rose-201921.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "yellow-h-20-cm",
            "name": {
              "de": "Gelb · H 20 cm",
              "en": "Yellow · H 20 cm",
              "fr": "Jaune · H 20 cm",
              "it": "Giallo · H 20 cm"
            },
            "code": "201922",
            "betrag": 99.95,
            "bilder": [
              "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-vase-1-opt.webp"
            ],
            "standard": true
          }
        ]
      }
    ]
  },
  {
    "slug": "lyngby-porcelaen-rhombe-color-candle-holder",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "wohnaccessoire",
    "name": "Rhombe Color Candle holder",
    "serie": "Rhombe Color",
    "kurz": {
      "de": "Kerzenhalter der Serie Rhombe Color aus Porzellan, entworfen von Stilleben v/Reckweg & Nordentoft. Im Shop des Herstellers in 4 Farben erhältlich.",
      "en": "Candle holder from the Rhombe Color series made of porcelain, designed by Stilleben v/Reckweg & Nordentoft. Available in the manufacturer’s shop in 4 colours.",
      "fr": "Bougeoir de la série Rhombe Color en porcelaine, dessinée par Stilleben v/Reckweg & Nordentoft. Disponible dans la boutique du fabricant en 4 couleurs.",
      "it": "Portacandele della serie Rhombe Color in porcellana, design di Stilleben v/Reckweg & Nordentoft. Disponibile nel negozio del produttore in 4 colori."
    },
    "merkmale": [
      {
        "de": "Porzellan",
        "en": "Porcelain",
        "fr": "Porcelaine",
        "it": "Porcellana"
      },
      {
        "de": "Design: Stilleben v/Reckweg & Nordentoft",
        "en": "Design: Stilleben v/Reckweg & Nordentoft",
        "fr": "Design : Stilleben v/Reckweg & Nordentoft",
        "it": "Design: Stilleben v/Reckweg & Nordentoft"
      },
      {
        "de": "Serie: Rhombe Color",
        "en": "Series: Rhombe Color",
        "fr": "Série : Rhombe Color",
        "it": "Serie: Rhombe Color"
      },
      {
        "de": "Farben: Blau, Dunkelblau, Grün, Rosa",
        "en": "Colours: Blue, Dark blue, Green, Rose",
        "fr": "Couleurs : Bleu, Bleu foncé, Vert, Rose",
        "it": "Colori: Blu, Blu scuro, Verde, Rosa"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "3 cm"
      },
      {
        "key": "durchmesser",
        "wert": "10,5 cm"
      }
    ],
    "designer": "Stilleben v/Reckweg & Nordentoft",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-candle-holder-1-opt.webp",
        "width": 649,
        "height": 811,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Color Candle holder (Rosa) – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Rhombe Color Candle holder (Rose) – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Rhombe Color Candle holder (Rose) – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Rhombe Color Candle holder (Rosa) – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZcCM4/Lyngby-Porcelaen-Rhombe-Color-Candle-holder-Rose-201926-xZcCM4.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-candle-holder-2.webp",
        "width": 1080,
        "height": 1527,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Color Candle holder (Rosa) – weitere Ansicht des Herstellers",
          "en": "Lyngby Porcelæn Rhombe Color Candle holder (Rose) – further view by the manufacturer",
          "fr": "Lyngby Porcelæn Rhombe Color Candle holder (Rose) – autre vue du fabricant",
          "it": "Lyngby Porcelæn Rhombe Color Candle holder (Rosa) – altra vista del produttore"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbJwb/Lyngby-Porcelaen-Rhombe-Color-Candle-holder-Rose-201926-xZbJwb.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "detail"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-candle-holder-rose-oe105-cm-201926",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-candle-holder-rose-oe105-cm-201926",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-candle-holder-blue-h3-cm-201939",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-candle-holder-dark-blue-h3-cm-201938",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-candle-holder-green-oe105-cm-201927",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-rhombe-color-milk-jug",
      "lyngby-porcelaen-rhombe-color-sauce-boat",
      "lyngby-porcelaen-rhombe-color-bowl"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Blau",
            "en": "Blue",
            "fr": "Bleu",
            "it": "Blu"
          },
          "betrag": 27.95,
          "sku": "201939",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Dunkelblau",
            "en": "Dark blue",
            "fr": "Bleu foncé",
            "it": "Blu scuro"
          },
          "betrag": 27.95,
          "sku": "201938",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Grün",
            "en": "Green",
            "fr": "Vert",
            "it": "Verde"
          },
          "betrag": 27.95,
          "sku": "201927",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Rosa",
            "en": "Rose",
            "fr": "Rose",
            "it": "Rosa"
          },
          "betrag": 27.95,
          "sku": "201926",
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-candle-holder-rose-oe105-cm-201926"
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
            "id": "blue",
            "name": {
              "de": "Blau",
              "en": "Blue",
              "fr": "Bleu",
              "it": "Blu"
            },
            "code": "201939",
            "betrag": 27.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-candle-holder-v201939-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Rhombe Color Candle holder (Blau) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Rhombe Color Candle holder (Blue) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Rhombe Color Candle holder (Bleu) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Rhombe Color Candle holder (Blu) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZcCSD/Lyngby-Porcelaen-Rhombe-Color-Candle-holder-Blue-201939-xZcCSD.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "dark-blue",
            "name": {
              "de": "Dunkelblau",
              "en": "Dark blue",
              "fr": "Bleu foncé",
              "it": "Blu scuro"
            },
            "code": "201938",
            "betrag": 27.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-candle-holder-v201938-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Rhombe Color Candle holder (Dunkelblau) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Rhombe Color Candle holder (Dark blue) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Rhombe Color Candle holder (Bleu foncé) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Rhombe Color Candle holder (Blu scuro) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZcCSC/Lyngby-Porcelaen-Rhombe-Color-Candle-holder-Dark-blue-201938-xZcCSC.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "green",
            "name": {
              "de": "Grün",
              "en": "Green",
              "fr": "Vert",
              "it": "Verde"
            },
            "code": "201927",
            "betrag": 27.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-candle-holder-v201927-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Rhombe Color Candle holder (Grün) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Rhombe Color Candle holder (Green) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Rhombe Color Candle holder (Vert) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Rhombe Color Candle holder (Verde) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZcCM5/Lyngby-Porcelaen-Rhombe-Color-Candle-holder-Green-201927-xZcCM5.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "rose",
            "name": {
              "de": "Rosa",
              "en": "Rose",
              "fr": "Rose",
              "it": "Rosa"
            },
            "code": "201926",
            "betrag": 27.95,
            "bilder": [
              "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-candle-holder-1-opt.webp"
            ],
            "standard": true
          }
        ]
      }
    ]
  },
  {
    "slug": "lyngby-porcelaen-rhombe-color-lunch-plate",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "geschirr",
    "name": "Rhombe Color Lunch plate",
    "serie": "Rhombe Color",
    "kurz": {
      "de": "Frühstücksteller der Serie Rhombe Color aus Porzellan, entworfen von Stilleben v/Reckweg & Nordentoft. Im Shop des Herstellers in 4 Farben und 2 Größen erhältlich.",
      "en": "Lunch plate from the Rhombe Color series made of porcelain, designed by Stilleben v/Reckweg & Nordentoft. Available in the manufacturer’s shop in 4 colours and 2 sizes.",
      "fr": "Assiette à déjeuner de la série Rhombe Color en porcelaine, dessinée par Stilleben v/Reckweg & Nordentoft. Disponible dans la boutique du fabricant en 4 couleurs et 2 tailles.",
      "it": "Piatto da colazione della serie Rhombe Color in porcellana, design di Stilleben v/Reckweg & Nordentoft. Disponibile nel negozio del produttore in 4 colori e 2 misure."
    },
    "merkmale": [
      {
        "de": "Porzellan",
        "en": "Porcelain",
        "fr": "Porcelaine",
        "it": "Porcellana"
      },
      {
        "de": "Design: Stilleben v/Reckweg & Nordentoft",
        "en": "Design: Stilleben v/Reckweg & Nordentoft",
        "fr": "Design : Stilleben v/Reckweg & Nordentoft",
        "it": "Design: Stilleben v/Reckweg & Nordentoft"
      },
      {
        "de": "Serie: Rhombe Color",
        "en": "Series: Rhombe Color",
        "fr": "Série : Rhombe Color",
        "it": "Serie: Rhombe Color"
      },
      {
        "de": "Farben: Aqua, Dunkelblau, Rosa, Terrakotta",
        "en": "Colours: Aqua, Dark blue, Rose, Terracotta",
        "fr": "Couleurs : Aqua, Bleu foncé, Rose, Terracotta",
        "it": "Colori: Acqua, Blu scuro, Rosa, Terracotta"
      },
      {
        "de": "Größen: Ø 21 cm, Ø 23 cm",
        "en": "Sizes: Ø 21 cm, Ø 23 cm",
        "fr": "Tailles : Ø 21 cm, Ø 23 cm",
        "it": "Misure: Ø 21 cm, Ø 23 cm"
      }
    ],
    "designer": "Stilleben v/Reckweg & Nordentoft",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-lunch-plate-1-opt.webp",
        "width": 666,
        "height": 833,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Color Lunch plate (Rosa · Ø 21 cm) – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Rhombe Color Lunch plate (Rose · Ø 21 cm) – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Rhombe Color Lunch plate (Rose · Ø 21 cm) – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Rhombe Color Lunch plate (Rosa · Ø 21 cm) – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZb9P3/Lyngby-Porcelaen-Rhombe-Color-Lunch-plate-Rose-201930-xZb9P3.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-lunch-plate-2.webp",
        "width": 1080,
        "height": 1085,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Color Lunch plate (Rosa · Ø 21 cm) – weitere Ansicht des Herstellers",
          "en": "Lyngby Porcelæn Rhombe Color Lunch plate (Rose · Ø 21 cm) – further view by the manufacturer",
          "fr": "Lyngby Porcelæn Rhombe Color Lunch plate (Rose · Ø 21 cm) – autre vue du fabricant",
          "it": "Lyngby Porcelæn Rhombe Color Lunch plate (Rosa · Ø 21 cm) – altra vista del produttore"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZb9P4/Lyngby-Porcelaen-Rhombe-Color-Lunch-plate-Rose-201930-xZb9P4.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "detail"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-lunch-plate-rose-oe21-cm-201930",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-lunch-plate-rose-oe21-cm-201930",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-lunch-plate-aqua-oe21-cm-201990",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-lunch-plate-dark-blue-oe23-cm-201936",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-lunch-plate-terracotta-oe23-cm-201935",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-rhombe-color-milk-jug",
      "lyngby-porcelaen-rhombe-color-sauce-boat",
      "lyngby-porcelaen-rhombe-color-bowl"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Aqua · Ø 21 cm",
            "en": "Aqua · Ø 21 cm",
            "fr": "Aqua · Ø 21 cm",
            "it": "Acqua · Ø 21 cm"
          },
          "betrag": 33.95,
          "sku": "201990",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Dunkelblau · Ø 23 cm",
            "en": "Dark blue · Ø 23 cm",
            "fr": "Bleu foncé · Ø 23 cm",
            "it": "Blu scuro · Ø 23 cm"
          },
          "betrag": 36.95,
          "sku": "201936",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Rosa · Ø 21 cm",
            "en": "Rose · Ø 21 cm",
            "fr": "Rose · Ø 21 cm",
            "it": "Rosa · Ø 21 cm"
          },
          "betrag": 33.95,
          "sku": "201930",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Terrakotta · Ø 23 cm",
            "en": "Terracotta · Ø 23 cm",
            "fr": "Terracotta · Ø 23 cm",
            "it": "Terracotta · Ø 23 cm"
          },
          "betrag": 36.95,
          "sku": "201935",
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-lunch-plate-rose-oe21-cm-201930"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Ausführung",
          "en": "Version",
          "fr": "Version",
          "it": "Versione"
        },
        "optionen": [
          {
            "id": "aqua-21-cm",
            "name": {
              "de": "Aqua · Ø 21 cm",
              "en": "Aqua · Ø 21 cm",
              "fr": "Aqua · Ø 21 cm",
              "it": "Acqua · Ø 21 cm"
            },
            "code": "201990",
            "betrag": 33.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-lunch-plate-v201990-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Rhombe Color Lunch plate (Aqua · Ø 21 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Rhombe Color Lunch plate (Aqua · Ø 21 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Rhombe Color Lunch plate (Aqua · Ø 21 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Rhombe Color Lunch plate (Acqua · Ø 21 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZcCJF/Lyngby-Porcelaen-Rhombe-Color-Lunch-plate-Aqua-201990-xZcCJF.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "dark-blue-23-cm",
            "name": {
              "de": "Dunkelblau · Ø 23 cm",
              "en": "Dark blue · Ø 23 cm",
              "fr": "Bleu foncé · Ø 23 cm",
              "it": "Blu scuro · Ø 23 cm"
            },
            "code": "201936",
            "betrag": 36.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-lunch-plate-v201936-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Rhombe Color Lunch plate (Dunkelblau · Ø 23 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Rhombe Color Lunch plate (Dark blue · Ø 23 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Rhombe Color Lunch plate (Bleu foncé · Ø 23 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Rhombe Color Lunch plate (Blu scuro · Ø 23 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZcCJz/Lyngby-Porcelaen-Rhombe-Color-Lunch-plate-Dark-blue-201936-xZcCJz.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "rose-21-cm",
            "name": {
              "de": "Rosa · Ø 21 cm",
              "en": "Rose · Ø 21 cm",
              "fr": "Rose · Ø 21 cm",
              "it": "Rosa · Ø 21 cm"
            },
            "code": "201930",
            "betrag": 33.95,
            "bilder": [
              "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-lunch-plate-1-opt.webp"
            ],
            "standard": true
          },
          {
            "id": "terracotta-23-cm",
            "name": {
              "de": "Terrakotta · Ø 23 cm",
              "en": "Terracotta · Ø 23 cm",
              "fr": "Terracotta · Ø 23 cm",
              "it": "Terracotta · Ø 23 cm"
            },
            "code": "201935",
            "betrag": 36.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-lunch-plate-v201935-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Rhombe Color Lunch plate (Terrakotta · Ø 23 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Rhombe Color Lunch plate (Terracotta · Ø 23 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Rhombe Color Lunch plate (Terracotta · Ø 23 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Rhombe Color Lunch plate (Terracotta · Ø 23 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZb9P7/Lyngby-Porcelaen-Rhombe-Color-Lunch-plate-Terracotta-201935-xZb9P7.webp?d=22397",
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
    "slug": "lyngby-porcelaen-rhombe-dessert-plate",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "geschirr",
    "name": "Rhombe Dessert plate",
    "serie": "Rhombe",
    "kurz": {
      "de": "Dessertteller der Serie Rhombe aus Porzellan, entworfen von Karakter Copenhagen. Das Rautenmuster stammt laut Hersteller aus dem Designarchiv von Lyngby Porcelæn und erschien erstmals 1961 auf der Serie Dan-Ild.",
      "en": "Dessert plate from the Rhombe series made of porcelain, designed by Karakter Copenhagen. According to the manufacturer, the rhombus pattern comes from the Lyngby Porcelæn design archive and first appeared on the Dan-Ild range in 1961.",
      "fr": "Assiette à dessert de la série Rhombe en porcelaine, dessinée par Karakter Copenhagen. Selon le fabricant, le motif en losange provient des archives de Lyngby Porcelæn et est apparu pour la première fois en 1961 sur la série Dan-Ild.",
      "it": "Piatto da dessert della serie Rhombe in porcellana, design di Karakter Copenhagen. Secondo il produttore, il motivo a rombi proviene dall’archivio di Lyngby Porcelæn ed è apparso per la prima volta nel 1961 sulla serie Dan-Ild."
    },
    "merkmale": [
      {
        "de": "Porzellan",
        "en": "Porcelain",
        "fr": "Porcelaine",
        "it": "Porcellana"
      },
      {
        "de": "Design: Karakter Copenhagen",
        "en": "Design: Karakter Copenhagen",
        "fr": "Design : Karakter Copenhagen",
        "it": "Design: Karakter Copenhagen"
      },
      {
        "de": "Serie: Rhombe",
        "en": "Series: Rhombe",
        "fr": "Série : Rhombe",
        "it": "Serie: Rhombe"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "3,5 cm"
      },
      {
        "key": "durchmesser",
        "wert": "16 cm"
      }
    ],
    "designer": "Karakter Copenhagen",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-dessert-plate-1.webp",
        "width": 1080,
        "height": 1527,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Dessert plate – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Rhombe Dessert plate – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Rhombe Dessert plate – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Rhombe Dessert plate – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZcCP5/Lyngby-Porcelaen-Rhombe-Dessert-plate-White-201932-xZcCP5.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-dessert-plate-2.webp",
        "width": 1080,
        "height": 1527,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Dessert plate – weitere Ansicht des Herstellers",
          "en": "Lyngby Porcelæn Rhombe Dessert plate – further view by the manufacturer",
          "fr": "Lyngby Porcelæn Rhombe Dessert plate – autre vue du fabricant",
          "it": "Lyngby Porcelæn Rhombe Dessert plate – altra vista del produttore"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZbJwq/Lyngby-Porcelaen-Rhombe-Dessert-plate-White-201932-xZbJwq.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "detail"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-dessert-plate-3.webp",
        "width": 1600,
        "height": 1212,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Dessert plate – Stimmungsbild des Herstellers mit dem Produkt im Raum",
          "en": "Lyngby Porcelæn Rhombe Dessert plate – manufacturer’s lifestyle photo showing the product in a room",
          "fr": "Lyngby Porcelæn Rhombe Dessert plate – photo d’ambiance du fabricant montrant le produit dans une pièce",
          "it": "Lyngby Porcelæn Rhombe Dessert plate – foto d’ambiente del produttore con il prodotto nella stanza"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZ9dHk/Lyngby-Porcelaen-Rhombe-Dessert-plate-White-201932.webp?d=22399",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-dessert-plate-white-oe16-cm-201932",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-dessert-plate-white-oe16-cm-201932",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-rhombe-tea-cup-with-saucer",
      "lyngby-porcelaen-rhombe-teapot",
      "lyngby-porcelaen-rhombe-serving-bowl"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Weiß",
            "en": "White",
            "fr": "Blanc",
            "it": "Bianco"
          },
          "betrag": 23.95,
          "sku": "201932",
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-dessert-plate-white-oe16-cm-201932"
    }
  },
  {
    "slug": "lyngby-porcelaen-rhombe-color-soup-plate",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "geschirr",
    "name": "Rhombe Color Soup plate",
    "serie": "Rhombe Color",
    "kurz": {
      "de": "Suppenteller der Serie Rhombe Color aus Porzellan, entworfen von Stilleben v/Reckweg & Nordentoft. Im Shop des Herstellers in 2 Farben erhältlich.",
      "en": "Soup plate from the Rhombe Color series made of porcelain, designed by Stilleben v/Reckweg & Nordentoft. Available in the manufacturer’s shop in 2 colours.",
      "fr": "Assiette creuse de la série Rhombe Color en porcelaine, dessinée par Stilleben v/Reckweg & Nordentoft. Disponible dans la boutique du fabricant en 2 couleurs.",
      "it": "Piatto fondo della serie Rhombe Color in porcellana, design di Stilleben v/Reckweg & Nordentoft. Disponibile nel negozio del produttore in 2 colori."
    },
    "merkmale": [
      {
        "de": "Porzellan",
        "en": "Porcelain",
        "fr": "Porcelaine",
        "it": "Porcellana"
      },
      {
        "de": "Design: Stilleben v/Reckweg & Nordentoft",
        "en": "Design: Stilleben v/Reckweg & Nordentoft",
        "fr": "Design : Stilleben v/Reckweg & Nordentoft",
        "it": "Design: Stilleben v/Reckweg & Nordentoft"
      },
      {
        "de": "Serie: Rhombe Color",
        "en": "Series: Rhombe Color",
        "fr": "Série : Rhombe Color",
        "it": "Serie: Rhombe Color"
      },
      {
        "de": "Farben: Grün, Türkis",
        "en": "Colours: Green, Turquoise",
        "fr": "Couleurs : Vert, Turquoise",
        "it": "Colori: Verde, Turchese"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "6 cm"
      },
      {
        "key": "durchmesser",
        "wert": "24,5 cm"
      }
    ],
    "designer": "Stilleben v/Reckweg & Nordentoft",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-soup-plate-1-opt.webp",
        "width": 769,
        "height": 961,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Color Soup plate (Grün) – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Rhombe Color Soup plate (Green) – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Rhombe Color Soup plate (Vert) – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Rhombe Color Soup plate (Verde) – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZb9P9/Lyngby-Porcelaen-Rhombe-Color-Soup-plate-Green-201940-xZb9P9.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-soup-plate-2.webp",
        "width": 1080,
        "height": 1085,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Color Soup plate (Grün) – weitere Ansicht des Herstellers",
          "en": "Lyngby Porcelæn Rhombe Color Soup plate (Green) – further view by the manufacturer",
          "fr": "Lyngby Porcelæn Rhombe Color Soup plate (Vert) – autre vue du fabricant",
          "it": "Lyngby Porcelæn Rhombe Color Soup plate (Verde) – altra vista del produttore"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZb9Pb/Lyngby-Porcelaen-Rhombe-Color-Soup-plate-Green-201940-xZb9Pb.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "detail"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-soup-plate-green-oe245-cm-201940",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-soup-plate-green-oe245-cm-201940",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-soup-plate-turquoise-oe5-cm-201982",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-rhombe-color-milk-jug",
      "lyngby-porcelaen-rhombe-color-sauce-boat",
      "lyngby-porcelaen-rhombe-color-bowl"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Grün",
            "en": "Green",
            "fr": "Vert",
            "it": "Verde"
          },
          "betrag": 39.95,
          "sku": "201940",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Türkis",
            "en": "Turquoise",
            "fr": "Turquoise",
            "it": "Turchese"
          },
          "betrag": 39.95,
          "sku": "201982",
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-soup-plate-green-oe245-cm-201940"
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
            "id": "green",
            "name": {
              "de": "Grün",
              "en": "Green",
              "fr": "Vert",
              "it": "Verde"
            },
            "code": "201940",
            "betrag": 39.95,
            "bilder": [
              "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-soup-plate-1-opt.webp"
            ],
            "standard": true
          },
          {
            "id": "turquoise",
            "name": {
              "de": "Türkis",
              "en": "Turquoise",
              "fr": "Turquoise",
              "it": "Turchese"
            },
            "code": "201982",
            "betrag": 39.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-soup-plate-v201982-opt.webp",
                "width": 641,
                "height": 802,
                "alt": {
                  "de": "Lyngby Porcelæn Rhombe Color Soup plate (Türkis) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Rhombe Color Soup plate (Turquoise) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Rhombe Color Soup plate (Turquoise) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Rhombe Color Soup plate (Turchese) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZcCJC/Lyngby-Porcelaen-Rhombe-Color-Soup-plate-Turquoise-201982-xZcCJC.webp?d=22397",
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
    "slug": "lyngby-porcelaen-rhombe-color-dinner-plate",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "geschirr",
    "name": "Rhombe Color Dinner plate",
    "serie": "Rhombe Color",
    "kurz": {
      "de": "Speiseteller der Serie Rhombe Color aus Porzellan, entworfen von Stilleben v/Reckweg & Nordentoft. Im Shop des Herstellers in 2 Farben erhältlich.",
      "en": "Dinner plate from the Rhombe Color series made of porcelain, designed by Stilleben v/Reckweg & Nordentoft. Available in the manufacturer’s shop in 2 colours.",
      "fr": "Assiette plate de la série Rhombe Color en porcelaine, dessinée par Stilleben v/Reckweg & Nordentoft. Disponible dans la boutique du fabricant en 2 couleurs.",
      "it": "Piatto piano della serie Rhombe Color in porcellana, design di Stilleben v/Reckweg & Nordentoft. Disponibile nel negozio del produttore in 2 colori."
    },
    "merkmale": [
      {
        "de": "Porzellan",
        "en": "Porcelain",
        "fr": "Porcelaine",
        "it": "Porcellana"
      },
      {
        "de": "Design: Stilleben v/Reckweg & Nordentoft",
        "en": "Design: Stilleben v/Reckweg & Nordentoft",
        "fr": "Design : Stilleben v/Reckweg & Nordentoft",
        "it": "Design: Stilleben v/Reckweg & Nordentoft"
      },
      {
        "de": "Serie: Rhombe Color",
        "en": "Series: Rhombe Color",
        "fr": "Série : Rhombe Color",
        "it": "Serie: Rhombe Color"
      },
      {
        "de": "Farben: Blau, Sand",
        "en": "Colours: Blue, Sand",
        "fr": "Couleurs : Bleu, Sable",
        "it": "Colori: Blu, Sabbia"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "2,5 cm"
      },
      {
        "key": "durchmesser",
        "wert": "27 cm"
      }
    ],
    "designer": "Stilleben v/Reckweg & Nordentoft",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-dinner-plate-1-opt.webp",
        "width": 1012,
        "height": 1266,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Color Dinner plate (Blau) – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Rhombe Color Dinner plate (Blue) – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Rhombe Color Dinner plate (Bleu) – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Rhombe Color Dinner plate (Blu) – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZcCJA/Lyngby-Porcelaen-Rhombe-Color-Dinner-plate-Blue-201946-xZcCJA.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-dinner-plate-2.webp",
        "width": 1080,
        "height": 1527,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Color Dinner plate (Blau) – weitere Ansicht des Herstellers",
          "en": "Lyngby Porcelæn Rhombe Color Dinner plate (Blue) – further view by the manufacturer",
          "fr": "Lyngby Porcelæn Rhombe Color Dinner plate (Bleu) – autre vue du fabricant",
          "it": "Lyngby Porcelæn Rhombe Color Dinner plate (Blu) – altra vista del produttore"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZ9vds/Lyngby-Porcelaen-Rhombe-Color-Dinner-plate-Blue-201946-xZ9vds.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "detail"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-dinner-plate-3.webp",
        "width": 1600,
        "height": 1067,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Color Dinner plate – Stimmungsbild des Herstellers mit dem Produkt im Raum",
          "en": "Lyngby Porcelæn Rhombe Color Dinner plate – manufacturer’s lifestyle photo showing the product in a room",
          "fr": "Lyngby Porcelæn Rhombe Color Dinner plate – photo d’ambiance du fabricant montrant le produit dans une pièce",
          "it": "Lyngby Porcelæn Rhombe Color Dinner plate – foto d’ambiente del produttore con il prodotto nella stanza"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/2SP8WX/Lyngby-Porcelaen-Rhombe-Color-Dinner-plate-Blue-201946-2SP8WX.webp?d=22399",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-dinner-plate-blue-oe27-cm-201946",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-dinner-plate-blue-oe27-cm-201946",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-dinner-plate-sand-oe27-cm-201945",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-rhombe-color-milk-jug",
      "lyngby-porcelaen-rhombe-color-sauce-boat",
      "lyngby-porcelaen-rhombe-color-bowl"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Blau",
            "en": "Blue",
            "fr": "Bleu",
            "it": "Blu"
          },
          "betrag": 41.95,
          "sku": "201946",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Sand",
            "en": "Sand",
            "fr": "Sable",
            "it": "Sabbia"
          },
          "betrag": 41.95,
          "sku": "201945",
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-dinner-plate-blue-oe27-cm-201946"
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
            "id": "blue",
            "name": {
              "de": "Blau",
              "en": "Blue",
              "fr": "Bleu",
              "it": "Blu"
            },
            "code": "201946",
            "betrag": 41.95,
            "bilder": [
              "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-dinner-plate-1-opt.webp"
            ],
            "standard": true
          },
          {
            "id": "sand",
            "name": {
              "de": "Sand",
              "en": "Sand",
              "fr": "Sable",
              "it": "Sabbia"
            },
            "code": "201945",
            "betrag": 41.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-dinner-plate-v201945-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Rhombe Color Dinner plate (Sand) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Rhombe Color Dinner plate (Sand) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Rhombe Color Dinner plate (Sable) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Rhombe Color Dinner plate (Sabbia) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZb9Pf/Lyngby-Porcelaen-Rhombe-Color-Dinner-plate-Sand-201945-xZb9Pf.webp?d=22397",
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
    "slug": "lyngby-porcelaen-rhombe-color-oval-serving-dish",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "geschirr",
    "name": "Rhombe Color Oval serving dish",
    "serie": "Rhombe Color",
    "kurz": {
      "de": "Ovale Servierplatte der Serie Rhombe Color aus Porzellan, entworfen von Stilleben v/Reckweg & Nordentoft. Im Shop des Herstellers in 4 Farben und 2 Größen erhältlich.",
      "en": "Oval serving dish from the Rhombe Color series made of porcelain, designed by Stilleben v/Reckweg & Nordentoft. Available in the manufacturer’s shop in 4 colours and 2 sizes.",
      "fr": "Plat de service ovale de la série Rhombe Color en porcelaine, dessinée par Stilleben v/Reckweg & Nordentoft. Disponible dans la boutique du fabricant en 4 couleurs et 2 tailles.",
      "it": "Piatto da portata ovale della serie Rhombe Color in porcellana, design di Stilleben v/Reckweg & Nordentoft. Disponibile nel negozio del produttore in 4 colori e 2 misure."
    },
    "merkmale": [
      {
        "de": "Porzellan",
        "en": "Porcelain",
        "fr": "Porcelaine",
        "it": "Porcellana"
      },
      {
        "de": "Design: Stilleben v/Reckweg & Nordentoft",
        "en": "Design: Stilleben v/Reckweg & Nordentoft",
        "fr": "Design : Stilleben v/Reckweg & Nordentoft",
        "it": "Design: Stilleben v/Reckweg & Nordentoft"
      },
      {
        "de": "Serie: Rhombe Color",
        "en": "Series: Rhombe Color",
        "fr": "Série : Rhombe Color",
        "it": "Serie: Rhombe Color"
      },
      {
        "de": "Farben: Blau, Dunkelblau, Violett, Rosa",
        "en": "Colours: Blue, Dark blue, Purple, Rose",
        "fr": "Couleurs : Bleu, Bleu foncé, Violet, Rose",
        "it": "Colori: Blu, Blu scuro, Viola, Rosa"
      },
      {
        "de": "Größen: 28,5x21,5 cm, 35x26,5 cm",
        "en": "Sizes: 28.5x21.5 cm, 35x26.5 cm",
        "fr": "Tailles : 28,5x21,5 cm, 35x26,5 cm",
        "it": "Misure: 28,5x21,5 cm, 35x26,5 cm"
      }
    ],
    "designer": "Stilleben v/Reckweg & Nordentoft",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-oval-serving-dish-1-opt.webp",
        "width": 1150,
        "height": 1438,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Color Oval serving dish (Blau · 28,5x21,5 cm) – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Rhombe Color Oval serving dish (Blue · 28.5x21.5 cm) – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Rhombe Color Oval serving dish (Bleu · 28,5x21,5 cm) – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Rhombe Color Oval serving dish (Blu · 28,5x21,5 cm) – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZcCM8/Lyngby-Porcelaen-Rhombe-Color-Oval-serving-dish-Blue-201954-xZcCM8.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-oval-serving-dish-2.webp",
        "width": 1080,
        "height": 1527,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Color Oval serving dish (Blau · 28,5x21,5 cm) – weitere Ansicht des Herstellers",
          "en": "Lyngby Porcelæn Rhombe Color Oval serving dish (Blue · 28.5x21.5 cm) – further view by the manufacturer",
          "fr": "Lyngby Porcelæn Rhombe Color Oval serving dish (Bleu · 28,5x21,5 cm) – autre vue du fabricant",
          "it": "Lyngby Porcelæn Rhombe Color Oval serving dish (Blu · 28,5x21,5 cm) – altra vista del produttore"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZ9vtL/Lyngby-Porcelaen-Rhombe-Color-Oval-serving-dish-Blue-201954-xZ9vtL.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "detail"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-oval-serving-dish-blue-165x25-cm-201954",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-oval-serving-dish-blue-165x25-cm-201954",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-oval-serving-dish-dark-blue-35x265-cm-201953",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-oval-serving-dish-purple-35x265-cm-201950",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-oval-serving-dish-rose-165x25-cm-201957",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-rhombe-color-milk-jug",
      "lyngby-porcelaen-rhombe-color-sauce-boat",
      "lyngby-porcelaen-rhombe-color-bowl"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Blau · 28,5x21,5 cm",
            "en": "Blue · 28.5x21.5 cm",
            "fr": "Bleu · 28,5x21,5 cm",
            "it": "Blu · 28,5x21,5 cm"
          },
          "betrag": 79.95,
          "sku": "201954",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Dunkelblau · 35x26,5 cm",
            "en": "Dark blue · 35x26.5 cm",
            "fr": "Bleu foncé · 35x26,5 cm",
            "it": "Blu scuro · 35x26,5 cm"
          },
          "betrag": 89.95,
          "sku": "201953",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Violett · 35x26,5 cm",
            "en": "Purple · 35x26.5 cm",
            "fr": "Violet · 35x26,5 cm",
            "it": "Viola · 35x26,5 cm"
          },
          "betrag": 89.95,
          "sku": "201950",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Rosa · 28,5x21,5 cm",
            "en": "Rose · 28.5x21.5 cm",
            "fr": "Rose · 28,5x21,5 cm",
            "it": "Rosa · 28,5x21,5 cm"
          },
          "betrag": 79.95,
          "sku": "201957",
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-oval-serving-dish-blue-165x25-cm-201954"
    },
    "ausfuehrungen": [
      {
        "gruppe": {
          "de": "Ausführung",
          "en": "Version",
          "fr": "Version",
          "it": "Versione"
        },
        "optionen": [
          {
            "id": "blue-28-5x21-5-cm",
            "name": {
              "de": "Blau · 28,5x21,5 cm",
              "en": "Blue · 28.5x21.5 cm",
              "fr": "Bleu · 28,5x21,5 cm",
              "it": "Blu · 28,5x21,5 cm"
            },
            "code": "201954",
            "betrag": 79.95,
            "bilder": [
              "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-oval-serving-dish-1-opt.webp"
            ],
            "standard": true
          },
          {
            "id": "dark-blue-35x26-5-cm",
            "name": {
              "de": "Dunkelblau · 35x26,5 cm",
              "en": "Dark blue · 35x26.5 cm",
              "fr": "Bleu foncé · 35x26,5 cm",
              "it": "Blu scuro · 35x26,5 cm"
            },
            "code": "201953",
            "betrag": 89.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-oval-serving-dish-v201953-opt.webp",
                "width": 864,
                "height": 1080,
                "alt": {
                  "de": "Lyngby Porcelæn Rhombe Color Oval serving dish (Dunkelblau · 35x26,5 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Rhombe Color Oval serving dish (Dark blue · 35x26.5 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Rhombe Color Oval serving dish (Bleu foncé · 35x26,5 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Rhombe Color Oval serving dish (Blu scuro · 35x26,5 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZcCM7/Lyngby-Porcelaen-Rhombe-Color-Oval-serving-dish-Dark-blue-201953-xZcCM7.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "purple-35x26-5-cm",
            "name": {
              "de": "Violett · 35x26,5 cm",
              "en": "Purple · 35x26.5 cm",
              "fr": "Violet · 35x26,5 cm",
              "it": "Viola · 35x26,5 cm"
            },
            "code": "201950",
            "betrag": 89.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-oval-serving-dish-v201950-opt.webp",
                "width": 748,
                "height": 934,
                "alt": {
                  "de": "Lyngby Porcelæn Rhombe Color Oval serving dish (Violett · 35x26,5 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Rhombe Color Oval serving dish (Purple · 35x26.5 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Rhombe Color Oval serving dish (Violet · 35x26,5 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Rhombe Color Oval serving dish (Viola · 35x26,5 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZb9Ph/Lyngby-Porcelaen-Rhombe-Color-Oval-serving-dish-Purple-201950-xZb9Ph.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "rose-28-5x21-5-cm",
            "name": {
              "de": "Rosa · 28,5x21,5 cm",
              "en": "Rose · 28.5x21.5 cm",
              "fr": "Rose · 28,5x21,5 cm",
              "it": "Rosa · 28,5x21,5 cm"
            },
            "code": "201957",
            "betrag": 79.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-oval-serving-dish-v201957-opt.webp",
                "width": 801,
                "height": 1002,
                "alt": {
                  "de": "Lyngby Porcelæn Rhombe Color Oval serving dish (Rosa · 28,5x21,5 cm) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Rhombe Color Oval serving dish (Rose · 28.5x21.5 cm) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Rhombe Color Oval serving dish (Rose · 28,5x21,5 cm) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Rhombe Color Oval serving dish (Rosa · 28,5x21,5 cm) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZcCJB/Lyngby-Porcelaen-Rhombe-Color-Oval-serving-dish-Rose-201957-xZcCJB.webp?d=22397",
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
    "slug": "lyngby-porcelaen-rhombe-color-mug",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "geschirr",
    "name": "Rhombe Color Mug",
    "serie": "Rhombe Color",
    "kurz": {
      "de": "Becher der Serie Rhombe Color aus Porzellan, entworfen von Stilleben v/Reckweg & Nordentoft. Im Shop des Herstellers in 9 Farben erhältlich.",
      "en": "Mug from the Rhombe Color series made of porcelain, designed by Stilleben v/Reckweg & Nordentoft. Available in the manufacturer’s shop in 9 colours.",
      "fr": "Gobelet de la série Rhombe Color en porcelaine, dessinée par Stilleben v/Reckweg & Nordentoft. Disponible dans la boutique du fabricant en 9 couleurs.",
      "it": "Bicchiere della serie Rhombe Color in porcellana, design di Stilleben v/Reckweg & Nordentoft. Disponibile nel negozio del produttore in 9 colori."
    },
    "merkmale": [
      {
        "de": "Porzellan",
        "en": "Porcelain",
        "fr": "Porcelaine",
        "it": "Porcellana"
      },
      {
        "de": "Design: Stilleben v/Reckweg & Nordentoft",
        "en": "Design: Stilleben v/Reckweg & Nordentoft",
        "fr": "Design : Stilleben v/Reckweg & Nordentoft",
        "it": "Design: Stilleben v/Reckweg & Nordentoft"
      },
      {
        "de": "Serie: Rhombe Color",
        "en": "Series: Rhombe Color",
        "fr": "Série : Rhombe Color",
        "it": "Serie: Rhombe Color"
      },
      {
        "de": "Farben: Blau, Koralle, Dunkelblau, Grün, Rosa, Sand, Terrakotta, Türkis, Gelb",
        "en": "Colours: Blue, Coral, Dark blue, Green, Rose, Sand, Terracotta, Turquoise, Yellow",
        "fr": "Couleurs : Bleu, Corail, Bleu foncé, Vert, Rose, Sable, Terracotta, Turquoise, Jaune",
        "it": "Colori: Blu, Corallo, Blu scuro, Verde, Rosa, Sabbia, Terracotta, Turchese, Giallo"
      },
      {
        "de": "Volumen 0,33 l",
        "en": "Volume 0.33 l",
        "fr": "Contenance 0,33 l",
        "it": "Capacità 0,33 l"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "10,5 cm"
      },
      {
        "key": "durchmesser",
        "wert": "8,5 cm"
      }
    ],
    "designer": "Stilleben v/Reckweg & Nordentoft",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-mug-1-opt.webp",
        "width": 640,
        "height": 800,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Color Mug (Türkis) – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Rhombe Color Mug (Turquoise) – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Rhombe Color Mug (Turquoise) – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Rhombe Color Mug (Turchese) – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZcCF2/Lyngby-Porcelaen-Rhombe-Color-Mug-Turquoise-201967.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-mug-2.webp",
        "width": 1600,
        "height": 1067,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Color Mug – Stimmungsbild des Herstellers mit dem Produkt im Raum",
          "en": "Lyngby Porcelæn Rhombe Color Mug – manufacturer’s lifestyle photo showing the product in a room",
          "fr": "Lyngby Porcelæn Rhombe Color Mug – photo d’ambiance du fabricant montrant le produit dans une pièce",
          "it": "Lyngby Porcelæn Rhombe Color Mug – foto d’ambiente del produttore con il prodotto nella stanza"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/2SP8Vg/Lyngby-Porcelaen-Rhombe-Color-Mug-Turquoise-201967.webp?d=22399",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-mug-turquoise-33-cl-201967",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-mug-turquoise-33-cl-201967",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-mug-blue-33-cl-201962",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-mug-coral-oe5-cm-201981",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-mug-dark-blue-33-cl-201966",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-mug-green-33-cl-201964",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-mug-rose-33-cl-201960",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-mug-sand-33-cl-201961",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-mug-terracotta-33-cl-201963",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-mug-yellow-33-cl-201965",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-rhombe-color-milk-jug",
      "lyngby-porcelaen-rhombe-color-sauce-boat",
      "lyngby-porcelaen-rhombe-color-bowl"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Blau",
            "en": "Blue",
            "fr": "Bleu",
            "it": "Blu"
          },
          "betrag": 26.95,
          "sku": "201962",
          "inhaltMl": 330,
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Koralle",
            "en": "Coral",
            "fr": "Corail",
            "it": "Corallo"
          },
          "betrag": 26.95,
          "sku": "201981",
          "inhaltMl": 330,
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Dunkelblau",
            "en": "Dark blue",
            "fr": "Bleu foncé",
            "it": "Blu scuro"
          },
          "betrag": 26.95,
          "sku": "201966",
          "inhaltMl": 330,
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Grün",
            "en": "Green",
            "fr": "Vert",
            "it": "Verde"
          },
          "betrag": 26.95,
          "sku": "201964",
          "inhaltMl": 330,
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Rosa",
            "en": "Rose",
            "fr": "Rose",
            "it": "Rosa"
          },
          "betrag": 26.95,
          "sku": "201960",
          "inhaltMl": 330,
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Sand",
            "en": "Sand",
            "fr": "Sable",
            "it": "Sabbia"
          },
          "betrag": 26.95,
          "sku": "201961",
          "inhaltMl": 330,
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Terrakotta",
            "en": "Terracotta",
            "fr": "Terracotta",
            "it": "Terracotta"
          },
          "betrag": 26.95,
          "sku": "201963",
          "inhaltMl": 330,
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Türkis",
            "en": "Turquoise",
            "fr": "Turquoise",
            "it": "Turchese"
          },
          "betrag": 26.95,
          "sku": "201967",
          "inhaltMl": 330,
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Gelb",
            "en": "Yellow",
            "fr": "Jaune",
            "it": "Giallo"
          },
          "betrag": 26.95,
          "sku": "201965",
          "inhaltMl": 330,
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-mug-turquoise-33-cl-201967"
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
            "id": "blue",
            "name": {
              "de": "Blau",
              "en": "Blue",
              "fr": "Bleu",
              "it": "Blu"
            },
            "code": "201962",
            "betrag": 26.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-mug-v201962-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Rhombe Color Mug (Blau) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Rhombe Color Mug (Blue) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Rhombe Color Mug (Bleu) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Rhombe Color Mug (Blu) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZb9Pt/Lyngby-Porcelaen-Rhombe-Color-Mug-Blue-201962.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "coral",
            "name": {
              "de": "Koralle",
              "en": "Coral",
              "fr": "Corail",
              "it": "Corallo"
            },
            "code": "201981",
            "betrag": 26.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-mug-v201981-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Rhombe Color Mug (Koralle) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Rhombe Color Mug (Coral) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Rhombe Color Mug (Corail) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Rhombe Color Mug (Corallo) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZcCSH/Lyngby-Porcelaen-Rhombe-Color-Mug-Coral-201981-xZcCSH.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "dark-blue",
            "name": {
              "de": "Dunkelblau",
              "en": "Dark blue",
              "fr": "Bleu foncé",
              "it": "Blu scuro"
            },
            "code": "201966",
            "betrag": 26.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-mug-v201966-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Rhombe Color Mug (Dunkelblau) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Rhombe Color Mug (Dark blue) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Rhombe Color Mug (Bleu foncé) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Rhombe Color Mug (Blu scuro) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZcCF1/Lyngby-Porcelaen-Rhombe-Color-Mug-Dark-blue-201966.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "green",
            "name": {
              "de": "Grün",
              "en": "Green",
              "fr": "Vert",
              "it": "Verde"
            },
            "code": "201964",
            "betrag": 26.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-mug-v201964-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Rhombe Color Mug (Grün) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Rhombe Color Mug (Green) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Rhombe Color Mug (Vert) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Rhombe Color Mug (Verde) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZb9Pw/Lyngby-Porcelaen-Rhombe-Color-Mug-Green-201964.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "rose",
            "name": {
              "de": "Rosa",
              "en": "Rose",
              "fr": "Rose",
              "it": "Rosa"
            },
            "code": "201960",
            "betrag": 26.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-mug-v201960-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Rhombe Color Mug (Rosa) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Rhombe Color Mug (Rose) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Rhombe Color Mug (Rose) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Rhombe Color Mug (Rosa) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZb9Pr/Lyngby-Porcelaen-Rhombe-Color-Mug-Rose-201960.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "sand",
            "name": {
              "de": "Sand",
              "en": "Sand",
              "fr": "Sable",
              "it": "Sabbia"
            },
            "code": "201961",
            "betrag": 26.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-mug-v201961-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Rhombe Color Mug (Sand) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Rhombe Color Mug (Sand) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Rhombe Color Mug (Sable) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Rhombe Color Mug (Sabbia) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZb9Ps/Lyngby-Porcelaen-Rhombe-Color-Mug-Sand-201961.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "terracotta",
            "name": {
              "de": "Terrakotta",
              "en": "Terracotta",
              "fr": "Terracotta",
              "it": "Terracotta"
            },
            "code": "201963",
            "betrag": 26.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-mug-v201963-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Rhombe Color Mug (Terrakotta) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Rhombe Color Mug (Terracotta) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Rhombe Color Mug (Terracotta) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Rhombe Color Mug (Terracotta) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZb9Pv/Lyngby-Porcelaen-Rhombe-Color-Mug-Terracotta-201963.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "turquoise",
            "name": {
              "de": "Türkis",
              "en": "Turquoise",
              "fr": "Turquoise",
              "it": "Turchese"
            },
            "code": "201967",
            "betrag": 26.95,
            "bilder": [
              "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-mug-1-opt.webp"
            ],
            "standard": true
          },
          {
            "id": "yellow",
            "name": {
              "de": "Gelb",
              "en": "Yellow",
              "fr": "Jaune",
              "it": "Giallo"
            },
            "code": "201965",
            "betrag": 26.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-mug-v201965-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Rhombe Color Mug (Gelb) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Rhombe Color Mug (Yellow) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Rhombe Color Mug (Jaune) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Rhombe Color Mug (Giallo) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZb9Px/Lyngby-Porcelaen-Rhombe-Color-Mug-Yellow-201965.webp?d=22397",
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
    "slug": "lyngby-porcelaen-rhombe-color-mug-with-handle",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "geschirr",
    "name": "Rhombe Color Mug with handle",
    "serie": "Rhombe Color",
    "kurz": {
      "de": "Becher mit Henkel der Serie Rhombe Color aus Porzellan, entworfen von Stilleben v/Reckweg & Nordentoft. Im Shop des Herstellers in 5 Farben erhältlich.",
      "en": "Mug with handle from the Rhombe Color series made of porcelain, designed by Stilleben v/Reckweg & Nordentoft. Available in the manufacturer’s shop in 5 colours.",
      "fr": "Mug avec anse de la série Rhombe Color en porcelaine, dessinée par Stilleben v/Reckweg & Nordentoft. Disponible dans la boutique du fabricant en 5 couleurs.",
      "it": "Tazza con manico della serie Rhombe Color in porcellana, design di Stilleben v/Reckweg & Nordentoft. Disponibile nel negozio del produttore in 5 colori."
    },
    "merkmale": [
      {
        "de": "Porzellan",
        "en": "Porcelain",
        "fr": "Porcelaine",
        "it": "Porcellana"
      },
      {
        "de": "Design: Stilleben v/Reckweg & Nordentoft",
        "en": "Design: Stilleben v/Reckweg & Nordentoft",
        "fr": "Design : Stilleben v/Reckweg & Nordentoft",
        "it": "Design: Stilleben v/Reckweg & Nordentoft"
      },
      {
        "de": "Serie: Rhombe Color",
        "en": "Series: Rhombe Color",
        "fr": "Série : Rhombe Color",
        "it": "Serie: Rhombe Color"
      },
      {
        "de": "Farben: Blau, Dunkelblau, Grün, Rosa, Gelb",
        "en": "Colours: Blue, Dark blue, Green, Rose, Yellow",
        "fr": "Couleurs : Bleu, Bleu foncé, Vert, Rose, Jaune",
        "it": "Colori: Blu, Blu scuro, Verde, Rosa, Giallo"
      },
      {
        "de": "Volumen 0,33 l",
        "en": "Volume 0.33 l",
        "fr": "Contenance 0,33 l",
        "it": "Capacità 0,33 l"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "10,5 cm"
      },
      {
        "key": "breite",
        "wert": "11 cm"
      },
      {
        "key": "durchmesser",
        "wert": "8,5 cm"
      }
    ],
    "designer": "Stilleben v/Reckweg & Nordentoft",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-mug-with-handle-1-opt.webp",
        "width": 675,
        "height": 844,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Color Mug with handle (Dunkelblau) – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Rhombe Color Mug with handle (Dark blue) – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Rhombe Color Mug with handle (Bleu foncé) – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Rhombe Color Mug with handle (Blu scuro) – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZcCF3/Lyngby-Porcelaen-Rhombe-Color-Mug-with-handle-Dark-blue-201968.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-mug-with-handle-dark-blue-33-cl-201968",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-mug-with-handle-dark-blue-33-cl-201968",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-mug-with-handle-blue-33-cl-201973",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-mug-with-handle-green-33-cl-201972",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-mug-with-handle-rose-33-cl-201974",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-mug-with-handle-yellow-33-cl-201971",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-rhombe-color-milk-jug",
      "lyngby-porcelaen-rhombe-color-sauce-boat",
      "lyngby-porcelaen-rhombe-color-bowl"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Blau",
            "en": "Blue",
            "fr": "Bleu",
            "it": "Blu"
          },
          "betrag": 29.95,
          "sku": "201973",
          "inhaltMl": 330,
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Dunkelblau",
            "en": "Dark blue",
            "fr": "Bleu foncé",
            "it": "Blu scuro"
          },
          "betrag": 29.95,
          "sku": "201968",
          "inhaltMl": 330,
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Grün",
            "en": "Green",
            "fr": "Vert",
            "it": "Verde"
          },
          "betrag": 29.95,
          "sku": "201972",
          "inhaltMl": 330,
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Rosa",
            "en": "Rose",
            "fr": "Rose",
            "it": "Rosa"
          },
          "betrag": 29.95,
          "sku": "201974",
          "inhaltMl": 330,
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Gelb",
            "en": "Yellow",
            "fr": "Jaune",
            "it": "Giallo"
          },
          "betrag": 29.95,
          "sku": "201971",
          "inhaltMl": 330,
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-mug-with-handle-dark-blue-33-cl-201968"
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
            "id": "blue",
            "name": {
              "de": "Blau",
              "en": "Blue",
              "fr": "Bleu",
              "it": "Blu"
            },
            "code": "201973",
            "betrag": 29.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-mug-with-handle-v201973-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Rhombe Color Mug with handle (Blau) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Rhombe Color Mug with handle (Blue) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Rhombe Color Mug with handle (Bleu) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Rhombe Color Mug with handle (Blu) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZcCF6/Lyngby-Porcelaen-Rhombe-Color-Mug-with-handle-Blue-201973.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "dark-blue",
            "name": {
              "de": "Dunkelblau",
              "en": "Dark blue",
              "fr": "Bleu foncé",
              "it": "Blu scuro"
            },
            "code": "201968",
            "betrag": 29.95,
            "bilder": [
              "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-mug-with-handle-1-opt.webp"
            ],
            "standard": true
          },
          {
            "id": "green",
            "name": {
              "de": "Grün",
              "en": "Green",
              "fr": "Vert",
              "it": "Verde"
            },
            "code": "201972",
            "betrag": 29.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-mug-with-handle-v201972-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Rhombe Color Mug with handle (Grün) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Rhombe Color Mug with handle (Green) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Rhombe Color Mug with handle (Vert) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Rhombe Color Mug with handle (Verde) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZcCF5/Lyngby-Porcelaen-Rhombe-Color-Mug-with-handle-Green-201972.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "rose",
            "name": {
              "de": "Rosa",
              "en": "Rose",
              "fr": "Rose",
              "it": "Rosa"
            },
            "code": "201974",
            "betrag": 29.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-mug-with-handle-v201974-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Rhombe Color Mug with handle (Rosa) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Rhombe Color Mug with handle (Rose) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Rhombe Color Mug with handle (Rose) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Rhombe Color Mug with handle (Rosa) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZcCF7/Lyngby-Porcelaen-Rhombe-Color-Mug-with-handle-Rose-201974.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "yellow",
            "name": {
              "de": "Gelb",
              "en": "Yellow",
              "fr": "Jaune",
              "it": "Giallo"
            },
            "code": "201971",
            "betrag": 29.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-mug-with-handle-v201971-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Rhombe Color Mug with handle (Gelb) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Rhombe Color Mug with handle (Yellow) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Rhombe Color Mug with handle (Jaune) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Rhombe Color Mug with handle (Giallo) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZcCF4/Lyngby-Porcelaen-Rhombe-Color-Mug-with-handle-Yellow-201971.webp?d=22397",
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
    "slug": "lyngby-porcelaen-rhombe-color-egg-cup",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "geschirr",
    "name": "Rhombe Color Egg cup",
    "serie": "Rhombe Color",
    "kurz": {
      "de": "Eierbecher der Serie Rhombe Color aus Porzellan, entworfen von Stilleben v/Reckweg & Nordentoft. Im Shop des Herstellers in 4 Farben erhältlich.",
      "en": "Egg cup from the Rhombe Color series made of porcelain, designed by Stilleben v/Reckweg & Nordentoft. Available in the manufacturer’s shop in 4 colours.",
      "fr": "Coquetier de la série Rhombe Color en porcelaine, dessinée par Stilleben v/Reckweg & Nordentoft. Disponible dans la boutique du fabricant en 4 couleurs.",
      "it": "Portauovo della serie Rhombe Color in porcellana, design di Stilleben v/Reckweg & Nordentoft. Disponibile nel negozio del produttore in 4 colori."
    },
    "merkmale": [
      {
        "de": "Porzellan",
        "en": "Porcelain",
        "fr": "Porcelaine",
        "it": "Porcellana"
      },
      {
        "de": "Design: Stilleben v/Reckweg & Nordentoft",
        "en": "Design: Stilleben v/Reckweg & Nordentoft",
        "fr": "Design : Stilleben v/Reckweg & Nordentoft",
        "it": "Design: Stilleben v/Reckweg & Nordentoft"
      },
      {
        "de": "Serie: Rhombe Color",
        "en": "Series: Rhombe Color",
        "fr": "Série : Rhombe Color",
        "it": "Serie: Rhombe Color"
      },
      {
        "de": "Farben: Dunkelblau, Grün, Rosa, Gelb",
        "en": "Colours: Dark blue, Green, Rose, Yellow",
        "fr": "Couleurs : Bleu foncé, Vert, Rose, Jaune",
        "it": "Colori: Blu scuro, Verde, Rosa, Giallo"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "4,5 cm"
      },
      {
        "key": "durchmesser",
        "wert": "5 cm"
      }
    ],
    "designer": "Stilleben v/Reckweg & Nordentoft",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-egg-cup-1-opt.webp",
        "width": 640,
        "height": 800,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Color Egg cup (Rosa) – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Rhombe Color Egg cup (Rose) – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Rhombe Color Egg cup (Rose) – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Rhombe Color Egg cup (Rosa) – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZcCF8/Lyngby-Porcelaen-Rhombe-Color-Egg-cup-Rose-201980-xZcCF8.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-egg-cup-2.webp",
        "width": 1080,
        "height": 1527,
        "alt": {
          "de": "Lyngby Porcelæn Rhombe Color Egg cup (Rosa) – weitere Ansicht des Herstellers",
          "en": "Lyngby Porcelæn Rhombe Color Egg cup (Rose) – further view by the manufacturer",
          "fr": "Lyngby Porcelæn Rhombe Color Egg cup (Rose) – autre vue du fabricant",
          "it": "Lyngby Porcelæn Rhombe Color Egg cup (Rosa) – altra vista del produttore"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZcnd1/Lyngby-Porcelaen-Rhombe-Color-Egg-cup-Rose-201980-xZcnd1.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "detail"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-egg-cup-rose-oe5-cm-201980",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-egg-cup-rose-oe5-cm-201980",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-egg-cup-dark-blue-oe5-cm-201986",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-egg-cup-green-oe5-cm-201984",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-egg-cup-yellow-oe5-cm-201985",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-rhombe-color-milk-jug",
      "lyngby-porcelaen-rhombe-color-sauce-boat",
      "lyngby-porcelaen-rhombe-color-bowl"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Dunkelblau",
            "en": "Dark blue",
            "fr": "Bleu foncé",
            "it": "Blu scuro"
          },
          "betrag": 13.95,
          "sku": "201986",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Grün",
            "en": "Green",
            "fr": "Vert",
            "it": "Verde"
          },
          "betrag": 13.95,
          "sku": "201984",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Rosa",
            "en": "Rose",
            "fr": "Rose",
            "it": "Rosa"
          },
          "betrag": 13.95,
          "sku": "201980",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "Gelb",
            "en": "Yellow",
            "fr": "Jaune",
            "it": "Giallo"
          },
          "betrag": 13.95,
          "sku": "201985",
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-rhombe-color-egg-cup-rose-oe5-cm-201980"
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
            "id": "dark-blue",
            "name": {
              "de": "Dunkelblau",
              "en": "Dark blue",
              "fr": "Bleu foncé",
              "it": "Blu scuro"
            },
            "code": "201986",
            "betrag": 13.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-egg-cup-v201986-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Rhombe Color Egg cup (Dunkelblau) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Rhombe Color Egg cup (Dark blue) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Rhombe Color Egg cup (Bleu foncé) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Rhombe Color Egg cup (Blu scuro) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZcCFc/Lyngby-Porcelaen-Rhombe-Color-Egg-cup-Dark-blue-201986-xZcCFc.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "green",
            "name": {
              "de": "Grün",
              "en": "Green",
              "fr": "Vert",
              "it": "Verde"
            },
            "code": "201984",
            "betrag": 13.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-egg-cup-v201984-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Rhombe Color Egg cup (Grün) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Rhombe Color Egg cup (Green) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Rhombe Color Egg cup (Vert) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Rhombe Color Egg cup (Verde) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZcCF9/Lyngby-Porcelaen-Rhombe-Color-Egg-cup-Green-201984-xZcCF9.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "rose",
            "name": {
              "de": "Rosa",
              "en": "Rose",
              "fr": "Rose",
              "it": "Rosa"
            },
            "code": "201980",
            "betrag": 13.95,
            "bilder": [
              "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-egg-cup-1-opt.webp"
            ],
            "standard": true
          },
          {
            "id": "yellow",
            "name": {
              "de": "Gelb",
              "en": "Yellow",
              "fr": "Jaune",
              "it": "Giallo"
            },
            "code": "201985",
            "betrag": 13.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-rhombe-color-egg-cup-v201985-opt.webp",
                "width": 640,
                "height": 800,
                "alt": {
                  "de": "Lyngby Porcelæn Rhombe Color Egg cup (Gelb) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Rhombe Color Egg cup (Yellow) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Rhombe Color Egg cup (Jaune) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Rhombe Color Egg cup (Giallo) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZcCFb/Lyngby-Porcelaen-Rhombe-Color-Egg-cup-Yellow-201985-xZcCFb.webp?d=22397",
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
    "slug": "lyngby-porcelaen-flower-daisy-vase",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "vase",
    "name": "Flower Daisy Vase",
    "serie": "Flower",
    "kurz": {
      "de": "Vase der Serie Flower aus Porzellan, entworfen von Marianne Nielsen.",
      "en": "Vase from the Flower series made of porcelain, designed by Marianne Nielsen.",
      "fr": "Vase de la série Flower en porcelaine, dessinée par Marianne Nielsen.",
      "it": "Vaso della serie Flower in porcellana, design di Marianne Nielsen."
    },
    "merkmale": [
      {
        "de": "Porzellan",
        "en": "Porcelain",
        "fr": "Porcelaine",
        "it": "Porcellana"
      },
      {
        "de": "Design: Marianne Nielsen",
        "en": "Design: Marianne Nielsen",
        "fr": "Design : Marianne Nielsen",
        "it": "Design: Marianne Nielsen"
      },
      {
        "de": "Serie: Flower",
        "en": "Series: Flower",
        "fr": "Série : Flower",
        "it": "Serie: Flower"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "21 cm"
      },
      {
        "key": "breite",
        "wert": "21 cm"
      },
      {
        "key": "tiefe",
        "wert": "9 cm"
      }
    ],
    "designer": "Marianne Nielsen",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-flower-daisy-vase-1-opt.webp",
        "width": 1082,
        "height": 1353,
        "alt": {
          "de": "Lyngby Porcelæn Flower Daisy Vase – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Flower Daisy Vase – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Flower Daisy Vase – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Flower Daisy Vase – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/S12tY8gVOq6H/Lyngby-Porcelaen-Flower-Vase-White-202021-S12tY8gVOq6H.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-flower-daisy-vase-2.webp",
        "width": 1080,
        "height": 1527,
        "alt": {
          "de": "Lyngby Porcelæn Flower Daisy Vase – weitere Ansicht des Herstellers",
          "en": "Lyngby Porcelæn Flower Daisy Vase – further view by the manufacturer",
          "fr": "Lyngby Porcelæn Flower Daisy Vase – autre vue du fabricant",
          "it": "Lyngby Porcelæn Flower Daisy Vase – altra vista del produttore"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/ljwjtg8J0gHm/Lyngby-Porcelaen-Flower-Vase-White-202021-ljwjtg8J0gHm.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "detail"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-flower-daisy-vase-3.webp",
        "width": 1600,
        "height": 1067,
        "alt": {
          "de": "Lyngby Porcelæn Flower Daisy Vase – Stimmungsbild des Herstellers mit dem Produkt im Raum",
          "en": "Lyngby Porcelæn Flower Daisy Vase – manufacturer’s lifestyle photo showing the product in a room",
          "fr": "Lyngby Porcelæn Flower Daisy Vase – photo d’ambiance du fabricant montrant le produit dans une pièce",
          "it": "Lyngby Porcelæn Flower Daisy Vase – foto d’ambiente del produttore con il prodotto nella stanza"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/KaJYhCqdFhNm/Lyngby-Porcelaen-Flower-Vase-White-202021-KaJYhCqdFhNm.webp?d=22399",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-flower-vase-white-h21-cm-202021",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-flower-vase-white-h21-cm-202021",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-flower-pansy-vase",
      "lyngby-porcelaen-flower-morning-glory-vase",
      "lyngby-porcelaen-flower-buttercup-vase"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Weiß",
            "en": "White",
            "fr": "Blanc",
            "it": "Bianco"
          },
          "betrag": 56.95,
          "sku": "202021",
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-flower-vase-white-h21-cm-202021"
    }
  },
  {
    "slug": "lyngby-porcelaen-flower-pansy-vase",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "vase",
    "name": "Flower Pansy Vase",
    "serie": "Flower",
    "kurz": {
      "de": "Vase der Serie Flower aus Porzellan, entworfen von Marianne Nielsen.",
      "en": "Vase from the Flower series made of porcelain, designed by Marianne Nielsen.",
      "fr": "Vase de la série Flower en porcelaine, dessinée par Marianne Nielsen.",
      "it": "Vaso della serie Flower in porcellana, design di Marianne Nielsen."
    },
    "merkmale": [
      {
        "de": "Porzellan",
        "en": "Porcelain",
        "fr": "Porcelaine",
        "it": "Porcellana"
      },
      {
        "de": "Design: Marianne Nielsen",
        "en": "Design: Marianne Nielsen",
        "fr": "Design : Marianne Nielsen",
        "it": "Design: Marianne Nielsen"
      },
      {
        "de": "Serie: Flower",
        "en": "Series: Flower",
        "fr": "Série : Flower",
        "it": "Serie: Flower"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "17 cm"
      },
      {
        "key": "breite",
        "wert": "17,5 cm"
      },
      {
        "key": "tiefe",
        "wert": "7 cm"
      }
    ],
    "designer": "Marianne Nielsen",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-flower-pansy-vase-1-opt.webp",
        "width": 874,
        "height": 1092,
        "alt": {
          "de": "Lyngby Porcelæn Flower Pansy Vase – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Flower Pansy Vase – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Flower Pansy Vase – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Flower Pansy Vase – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/bGsdC8UmQ2tS/Lyngby-Porcelaen-Flower-Vase-Blue-202022-bGsdC8UmQ2tS.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-flower-pansy-vase-2.webp",
        "width": 1080,
        "height": 1527,
        "alt": {
          "de": "Lyngby Porcelæn Flower Pansy Vase – weitere Ansicht des Herstellers",
          "en": "Lyngby Porcelæn Flower Pansy Vase – further view by the manufacturer",
          "fr": "Lyngby Porcelæn Flower Pansy Vase – autre vue du fabricant",
          "it": "Lyngby Porcelæn Flower Pansy Vase – altra vista del produttore"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/KgYi7qNyDzax/Lyngby-Porcelaen-Flower-Vase-Blue-202022-KgYi7qNyDzax.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "detail"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-flower-pansy-vase-3.webp",
        "width": 1600,
        "height": 1067,
        "alt": {
          "de": "Lyngby Porcelæn Flower Pansy Vase – Stimmungsbild des Herstellers mit dem Produkt im Raum",
          "en": "Lyngby Porcelæn Flower Pansy Vase – manufacturer’s lifestyle photo showing the product in a room",
          "fr": "Lyngby Porcelæn Flower Pansy Vase – photo d’ambiance du fabricant montrant le produit dans une pièce",
          "it": "Lyngby Porcelæn Flower Pansy Vase – foto d’ambiente del produttore con il prodotto nella stanza"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/KaJYhCqdFhNm/Lyngby-Porcelaen-Flower-Vase-Blue-202022-KaJYhCqdFhNm.webp?d=22399",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-flower-vase-blue-h17-cm-202022",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-flower-vase-blue-h17-cm-202022",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-flower-daisy-vase",
      "lyngby-porcelaen-flower-morning-glory-vase",
      "lyngby-porcelaen-flower-buttercup-vase"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Blau",
            "en": "Blue",
            "fr": "Bleu",
            "it": "Blu"
          },
          "betrag": 44.95,
          "sku": "202022",
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-flower-vase-blue-h17-cm-202022"
    }
  },
  {
    "slug": "lyngby-porcelaen-flower-morning-glory-vase",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "vase",
    "name": "Flower Morning glory Vase",
    "serie": "Flower",
    "kurz": {
      "de": "Vase der Serie Flower aus Porzellan, entworfen von Marianne Nielsen.",
      "en": "Vase from the Flower series made of porcelain, designed by Marianne Nielsen.",
      "fr": "Vase de la série Flower en porcelaine, dessinée par Marianne Nielsen.",
      "it": "Vaso della serie Flower in porcellana, design di Marianne Nielsen."
    },
    "merkmale": [
      {
        "de": "Porzellan",
        "en": "Porcelain",
        "fr": "Porcelaine",
        "it": "Porcellana"
      },
      {
        "de": "Design: Marianne Nielsen",
        "en": "Design: Marianne Nielsen",
        "fr": "Design : Marianne Nielsen",
        "it": "Design: Marianne Nielsen"
      },
      {
        "de": "Serie: Flower",
        "en": "Series: Flower",
        "fr": "Série : Flower",
        "it": "Serie: Flower"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "14 cm"
      },
      {
        "key": "breite",
        "wert": "14 cm"
      },
      {
        "key": "tiefe",
        "wert": "6 cm"
      }
    ],
    "designer": "Marianne Nielsen",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-flower-morning-glory-vase-1-opt.webp",
        "width": 715,
        "height": 894,
        "alt": {
          "de": "Lyngby Porcelæn Flower Morning glory Vase – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Flower Morning glory Vase – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Flower Morning glory Vase – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Flower Morning glory Vase – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/bytgzUW0tpbR/Lyngby-Porcelaen-Flower-Vase-Green-202023-bytgzUW0tpbR.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-flower-morning-glory-vase-2.webp",
        "width": 1080,
        "height": 1527,
        "alt": {
          "de": "Lyngby Porcelæn Flower Morning glory Vase – weitere Ansicht des Herstellers",
          "en": "Lyngby Porcelæn Flower Morning glory Vase – further view by the manufacturer",
          "fr": "Lyngby Porcelæn Flower Morning glory Vase – autre vue du fabricant",
          "it": "Lyngby Porcelæn Flower Morning glory Vase – altra vista del produttore"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/MxxylM6PQRNx/Lyngby-Porcelaen-Flower-Vase-Green-202023-MxxylM6PQRNx.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "detail"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-flower-morning-glory-vase-3.webp",
        "width": 1067,
        "height": 1600,
        "alt": {
          "de": "Lyngby Porcelæn Flower Morning glory Vase – Stimmungsbild des Herstellers mit dem Produkt im Raum",
          "en": "Lyngby Porcelæn Flower Morning glory Vase – manufacturer’s lifestyle photo showing the product in a room",
          "fr": "Lyngby Porcelæn Flower Morning glory Vase – photo d’ambiance du fabricant montrant le produit dans une pièce",
          "it": "Lyngby Porcelæn Flower Morning glory Vase – foto d’ambiente del produttore con il prodotto nella stanza"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/ye6eJw9A0kDZ/Lyngby-Porcelaen-Flower-Vase-Green-202023-ye6eJw9A0kDZ.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-flower-vase-green-h14-cm-202023",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-flower-vase-green-h14-cm-202023",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-flower-daisy-vase",
      "lyngby-porcelaen-flower-pansy-vase",
      "lyngby-porcelaen-flower-buttercup-vase"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Grün",
            "en": "Green",
            "fr": "Vert",
            "it": "Verde"
          },
          "betrag": 34.95,
          "sku": "202023",
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-flower-vase-green-h14-cm-202023"
    }
  },
  {
    "slug": "lyngby-porcelaen-flower-buttercup-vase",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "vase",
    "name": "Flower Buttercup Vase",
    "serie": "Flower",
    "kurz": {
      "de": "Vase der Serie Flower aus Porzellan, entworfen von Marianne Nielsen.",
      "en": "Vase from the Flower series made of porcelain, designed by Marianne Nielsen.",
      "fr": "Vase de la série Flower en porcelaine, dessinée par Marianne Nielsen.",
      "it": "Vaso della serie Flower in porcellana, design di Marianne Nielsen."
    },
    "merkmale": [
      {
        "de": "Porzellan",
        "en": "Porcelain",
        "fr": "Porcelaine",
        "it": "Porcellana"
      },
      {
        "de": "Design: Marianne Nielsen",
        "en": "Design: Marianne Nielsen",
        "fr": "Design : Marianne Nielsen",
        "it": "Design: Marianne Nielsen"
      },
      {
        "de": "Serie: Flower",
        "en": "Series: Flower",
        "fr": "Série : Flower",
        "it": "Serie: Flower"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "11,5 cm"
      },
      {
        "key": "breite",
        "wert": "11 cm"
      },
      {
        "key": "tiefe",
        "wert": "6 cm"
      }
    ],
    "designer": "Marianne Nielsen",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-flower-buttercup-vase-1-opt.webp",
        "width": 640,
        "height": 800,
        "alt": {
          "de": "Lyngby Porcelæn Flower Buttercup Vase – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Flower Buttercup Vase – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Flower Buttercup Vase – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Flower Buttercup Vase – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/diOLHhuoF3tN/Lyngby-Porcelaen-Flower-Vase-Sand-202024-diOLHhuoF3tN.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-flower-buttercup-vase-2.webp",
        "width": 1080,
        "height": 1527,
        "alt": {
          "de": "Lyngby Porcelæn Flower Buttercup Vase – weitere Ansicht des Herstellers",
          "en": "Lyngby Porcelæn Flower Buttercup Vase – further view by the manufacturer",
          "fr": "Lyngby Porcelæn Flower Buttercup Vase – autre vue du fabricant",
          "it": "Lyngby Porcelæn Flower Buttercup Vase – altra vista del produttore"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/uRqEjVR85giA/Lyngby-Porcelaen-Flower-Vase-Sand-202024-uRqEjVR85giA.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "detail"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-flower-buttercup-vase-3.webp",
        "width": 1067,
        "height": 1600,
        "alt": {
          "de": "Lyngby Porcelæn Flower Buttercup Vase – Stimmungsbild des Herstellers mit dem Produkt im Raum",
          "en": "Lyngby Porcelæn Flower Buttercup Vase – manufacturer’s lifestyle photo showing the product in a room",
          "fr": "Lyngby Porcelæn Flower Buttercup Vase – photo d’ambiance du fabricant montrant le produit dans une pièce",
          "it": "Lyngby Porcelæn Flower Buttercup Vase – foto d’ambiente del produttore con il prodotto nella stanza"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/vF0H3IrQ6nuY/Lyngby-Porcelaen-Flower-Vase-Sand-202024-vF0H3IrQ6nuY.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-flower-vase-sand-h115-cm-202024",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-flower-vase-sand-h115-cm-202024",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "verwandt": [
      "lyngby-porcelaen-flower-daisy-vase",
      "lyngby-porcelaen-flower-pansy-vase",
      "lyngby-porcelaen-flower-morning-glory-vase"
    ],
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Sand",
            "en": "Sand",
            "fr": "Sable",
            "it": "Sabbia"
          },
          "betrag": 25.95,
          "sku": "202024",
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-flower-vase-sand-h115-cm-202024"
    }
  },
  {
    "slug": "lyngby-porcelaen-lyngby-1936-vase",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "vase",
    "name": "Lyngby 1936 Vase",
    "serie": "Lyngby 1936",
    "kurz": {
      "de": "Vase der Serie Lyngby 1936 aus Edelstahl, entworfen von Karakter Copenhagen. Im Shop des Herstellers in 2 Größen erhältlich.",
      "en": "Vase from the Lyngby 1936 series made of stainless steel, designed by Karakter Copenhagen. Available in the manufacturer’s shop in 2 sizes.",
      "fr": "Vase de la série Lyngby 1936 en acier inoxydable, dessinée par Karakter Copenhagen. Disponible dans la boutique du fabricant en 2 tailles.",
      "it": "Vaso della serie Lyngby 1936 in acciaio inox, design di Karakter Copenhagen. Disponibile nel negozio del produttore in 2 misure."
    },
    "merkmale": [
      {
        "de": "Edelstahl",
        "en": "Stainless steel",
        "fr": "Acier inoxydable",
        "it": "Acciaio inox"
      },
      {
        "de": "Design: Karakter Copenhagen",
        "en": "Design: Karakter Copenhagen",
        "fr": "Design : Karakter Copenhagen",
        "it": "Design: Karakter Copenhagen"
      },
      {
        "de": "Serie: Lyngby 1936",
        "en": "Series: Lyngby 1936",
        "fr": "Série : Lyngby 1936",
        "it": "Serie: Lyngby 1936"
      },
      {
        "de": "Größen: H 15,5 cm, H 20,5 cm",
        "en": "Sizes: H 15.5 cm, H 20.5 cm",
        "fr": "Tailles : H 15,5 cm, H 20,5 cm",
        "it": "Misure: H 15,5 cm, H 20,5 cm"
      }
    ],
    "designer": "Karakter Copenhagen",
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-1936-vase-1-opt.webp",
        "width": 979,
        "height": 1224,
        "alt": {
          "de": "Lyngby Porcelæn Lyngby 1936 Vase (H 20,5 cm) – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Lyngby 1936 Vase (H 20.5 cm) – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Lyngby 1936 Vase (H 20,5 cm) – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Lyngby 1936 Vase (H 20,5 cm) – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/7QfCaEvbpi29/Lyngby-Porcelaen-Lyngby-1936-Vase-Steel-202300-7QfCaEvbpi29.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-1936-vase-2.webp",
        "width": 1080,
        "height": 1527,
        "alt": {
          "de": "Lyngby Porcelæn Lyngby 1936 Vase (H 20,5 cm) – weitere Ansicht des Herstellers",
          "en": "Lyngby Porcelæn Lyngby 1936 Vase (H 20.5 cm) – further view by the manufacturer",
          "fr": "Lyngby Porcelæn Lyngby 1936 Vase (H 20,5 cm) – autre vue du fabricant",
          "it": "Lyngby Porcelæn Lyngby 1936 Vase (H 20,5 cm) – altra vista del produttore"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/TEaMxMmhHS3D/Lyngby-Porcelaen-Lyngby-1936-Vase-Steel-202300-TEaMxMmhHS3D.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "detail"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-1936-vase-3.webp",
        "width": 1067,
        "height": 1600,
        "alt": {
          "de": "Lyngby Porcelæn Lyngby 1936 Vase – Stimmungsbild des Herstellers mit dem Produkt im Raum",
          "en": "Lyngby Porcelæn Lyngby 1936 Vase – manufacturer’s lifestyle photo showing the product in a room",
          "fr": "Lyngby Porcelæn Lyngby 1936 Vase – photo d’ambiance du fabricant montrant le produit dans une pièce",
          "it": "Lyngby Porcelæn Lyngby 1936 Vase – foto d’ambiente del produttore con il prodotto nella stanza"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/as1PW3079SGF/Lyngby-Porcelaen-Lyngby-1936-Vase-Steel-202300-as1PW3079SGF.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-1936-vase-steel-h205-cm-202300",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-1936-vase-steel-h205-cm-202300",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-1936-vase-steel-h155-cm-202301",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "H 15,5 cm",
            "en": "H 15.5 cm",
            "fr": "H 15,5 cm",
            "it": "H 15,5 cm"
          },
          "betrag": 64.95,
          "sku": "202301",
          "zerbrechlich": true
        },
        {
          "name": {
            "de": "H 20,5 cm",
            "en": "H 20.5 cm",
            "fr": "H 20,5 cm",
            "it": "H 20,5 cm"
          },
          "betrag": 84.95,
          "sku": "202300",
          "zerbrechlich": true
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-lyngby-1936-vase-steel-h205-cm-202300"
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
            "id": "h-15-5-cm",
            "name": {
              "de": "H 15,5 cm",
              "en": "H 15.5 cm",
              "fr": "H 15,5 cm",
              "it": "H 15,5 cm"
            },
            "code": "202301",
            "betrag": 64.95
          },
          {
            "id": "h-20-5-cm",
            "name": {
              "de": "H 20,5 cm",
              "en": "H 20.5 cm",
              "fr": "H 20,5 cm",
              "it": "H 20,5 cm"
            },
            "code": "202300",
            "betrag": 84.95,
            "bilder": [
              "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-lyngby-1936-vase-1-opt.webp"
            ],
            "standard": true
          }
        ]
      }
    ]
  },
  {
    "slug": "lyngby-porcelaen-herringbone-place-mat",
    "marke": "lyngby-porcelaen",
    "bereich": "accessoires",
    "kategorie": "wohnaccessoire",
    "name": "Herringbone Place mat",
    "serie": "Herringbone",
    "kurz": {
      "de": "Tischset der Serie Herringbone aus 82 % GRS-zertifizierter recycelter Baumwolle und 18 % GRS-zertifiziertem recyceltem Polyester. Im Shop des Herstellers in 4 Farben erhältlich.",
      "en": "Place mat from the Herringbone series made of 82% GRS-certified recycled cotton and 18% GRS-certified recycled polyester. Available in the manufacturer’s shop in 4 colours.",
      "fr": "Set de table de la série Herringbone en 82 % de coton recyclé certifié GRS et 18 % de polyester recyclé certifié GRS. Disponible dans la boutique du fabricant en 4 couleurs.",
      "it": "Tovaglietta della serie Herringbone in 82% cotone riciclato certificato GRS e 18% poliestere riciclato certificato GRS. Disponibile nel negozio del produttore in 4 colori."
    },
    "merkmale": [
      {
        "de": "82 % recycelte Baumwolle, 18 % recyceltes Polyester (GRS-zertifiziert)",
        "en": "82% recycled cotton, 18% recycled polyester (GRS-certified)",
        "fr": "82 % coton recyclé, 18 % polyester recyclé (certifiés GRS)",
        "it": "82% cotone riciclato, 18% poliestere riciclato (certificati GRS)"
      },
      {
        "de": "Serie: Herringbone",
        "en": "Series: Herringbone",
        "fr": "Série : Herringbone",
        "it": "Serie: Herringbone"
      },
      {
        "de": "Farben: Braun, Rosa, Türkis, Gelb",
        "en": "Colours: Brown, Rose, Turquoise, Yellow",
        "fr": "Couleurs : Marron, Rose, Turquoise, Jaune",
        "it": "Colori: Marrone, Rosa, Turchese, Giallo"
      }
    ],
    "masse": [
      {
        "key": "hoehe",
        "wert": "30 cm"
      },
      {
        "key": "breite",
        "wert": "43 cm"
      }
    ],
    "bilder": [
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-herringbone-place-mat-1-opt.webp",
        "width": 1084,
        "height": 1355,
        "alt": {
          "de": "Lyngby Porcelæn Herringbone Place mat (Braun) – Produktfoto des Herstellers vor hellem Hintergrund",
          "en": "Lyngby Porcelæn Herringbone Place mat (Brown) – manufacturer’s product photo on a light background",
          "fr": "Lyngby Porcelæn Herringbone Place mat (Marron) – photo produit du fabricant sur fond clair",
          "it": "Lyngby Porcelæn Herringbone Place mat (Marrone) – foto prodotto del produttore su sfondo chiaro"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZcCDK/Lyngby-Porcelaen-Herringbone-Place-mat-Brown-607194.webp?d=22398",
        "abgerufen": "2026-10-31",
        "typ": "freisteller"
      },
      {
        "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-herringbone-place-mat-2.webp",
        "width": 1600,
        "height": 1067,
        "alt": {
          "de": "Lyngby Porcelæn Herringbone Place mat – Stimmungsbild des Herstellers mit dem Produkt im Raum",
          "en": "Lyngby Porcelæn Herringbone Place mat – manufacturer’s lifestyle photo showing the product in a room",
          "fr": "Lyngby Porcelæn Herringbone Place mat – photo d’ambiance du fabricant montrant le produit dans une pièce",
          "it": "Lyngby Porcelæn Herringbone Place mat – foto d’ambiente del produttore con il prodotto nella stanza"
        },
        "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZdpWP/Lyngby-Porcelaen-Herringbone-Place-mat-Turquoise-637140-xZdpWP.webp?d=22399",
        "abgerufen": "2026-10-31",
        "typ": "ambiente"
      }
    ],
    "herstellerUrl": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-herringbone-place-mat-brown-43x30-cm-607194",
    "quellen": [
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-herringbone-place-mat-brown-43x30-cm-607194",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-herringbone-place-mat-rose-43x30-cm-607438",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-herringbone-place-mat-turquoise-43x30-cm-637140",
      "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-herringbone-place-mat-yellow-43x30-cm-607198",
      "https://www.rosendahl.com/en/intl/information/shipping-and-delivery"
    ],
    "stand": "2026-10-31",
    "preis": {
      "art": "verkaufspreis",
      "varianten": [
        {
          "name": {
            "de": "Braun",
            "en": "Brown",
            "fr": "Marron",
            "it": "Marrone"
          },
          "betrag": 7.95,
          "sku": "607194"
        },
        {
          "name": {
            "de": "Rosa",
            "en": "Rose",
            "fr": "Rose",
            "it": "Rosa"
          },
          "betrag": 7.95,
          "sku": "607438"
        },
        {
          "name": {
            "de": "Türkis",
            "en": "Turquoise",
            "fr": "Turquoise",
            "it": "Turchese"
          },
          "betrag": 7.95,
          "sku": "637140"
        },
        {
          "name": {
            "de": "Gelb",
            "en": "Yellow",
            "fr": "Jaune",
            "it": "Giallo"
          },
          "betrag": 7.95,
          "sku": "607198"
        }
      ],
      "stand": "2026-10-31",
      "quelle": "https://www.rosendahl.com/en/intl/lyngby-porcelaen/products/lyp-herringbone-place-mat-brown-43x30-cm-607194"
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
            "id": "brown",
            "name": {
              "de": "Braun",
              "en": "Brown",
              "fr": "Marron",
              "it": "Marrone"
            },
            "code": "607194",
            "betrag": 7.95,
            "bilder": [
              "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-herringbone-place-mat-1-opt.webp"
            ],
            "standard": true
          },
          {
            "id": "rose",
            "name": {
              "de": "Rosa",
              "en": "Rose",
              "fr": "Rose",
              "it": "Rosa"
            },
            "code": "607438",
            "betrag": 7.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-herringbone-place-mat-v607438-opt.webp",
                "width": 776,
                "height": 970,
                "alt": {
                  "de": "Lyngby Porcelæn Herringbone Place mat (Rosa) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Herringbone Place mat (Rose) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Herringbone Place mat (Rose) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Herringbone Place mat (Rosa) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZcCDQ/Lyngby-Porcelaen-Herringbone-Place-mat-Rose-607438.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "turquoise",
            "name": {
              "de": "Türkis",
              "en": "Turquoise",
              "fr": "Turquoise",
              "it": "Turchese"
            },
            "code": "637140",
            "betrag": 7.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-herringbone-place-mat-v637140-opt.webp",
                "width": 769,
                "height": 961,
                "alt": {
                  "de": "Lyngby Porcelæn Herringbone Place mat (Türkis) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Herringbone Place mat (Turquoise) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Herringbone Place mat (Turquoise) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Herringbone Place mat (Turchese) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZd5sL/Lyngby-Porcelaen-Herringbone-Place-mat-Turquoise-637140.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          },
          {
            "id": "yellow",
            "name": {
              "de": "Gelb",
              "en": "Yellow",
              "fr": "Jaune",
              "it": "Giallo"
            },
            "code": "607198",
            "betrag": 7.95,
            "bilder": [
              {
                "src": "/Images/Wellness/produkte/lyngby-porcelaen/lyngby-porcelaen-herringbone-place-mat-v607198-opt.webp",
                "width": 771,
                "height": 964,
                "alt": {
                  "de": "Lyngby Porcelæn Herringbone Place mat (Gelb) – Produktfoto des Herstellers",
                  "en": "Lyngby Porcelæn Herringbone Place mat (Yellow) – manufacturer’s product photo",
                  "fr": "Lyngby Porcelæn Herringbone Place mat (Jaune) – photo produit du fabricant",
                  "it": "Lyngby Porcelæn Herringbone Place mat (Giallo) – foto prodotto del produttore"
                },
                "quelleUrl": "https://imagebank.rosendahl.com/cdn/xZcCDM/Lyngby-Porcelaen-Herringbone-Place-mat-Yellow-607198.webp?d=22397",
                "abgerufen": "2026-10-31",
                "typ": "freisteller"
              }
            ]
          }
        ]
      }
    ]
  }
]);
