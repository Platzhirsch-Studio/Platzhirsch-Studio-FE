// src/lib/katalog/marken/v-zug.js – V-ZUG (V-ZUG AG, Zug, Schweiz)
// Daten-Team V-ZUG, Stand 31.10.2026 (Inhaber-Entscheidungen Nr. 24 und 26).
//
// Quelle: ausschließlich die offizielle Herstellerseite www.vzug.com/at/de (Österreich).
// Produktliste aus der Produkt-Sitemap de_AT der Herstellerseite (Küche: alle
// Kategorien, je Modell ein Eintrag; Varianten – Design, Türanschlag, Abluft/Umluft,
// AutoDoor u. a. – als Merkmal + Link). Vollständigkeits-Check:
// qa-screenshots/wellness/produkte/vollstaendigkeit-v-zug.md.
// Die Seiten laden ihre Inhalte per Skript: geöffnet wie ein normaler Besucher in
// Playwright (Standard-Chromium, kein gefälschter User-Agent), Text und Bild-URLs
// aus dem gerenderten DOM. Technische Werte aus dem Datenblatt („Ausstattung“,
// „Technische Daten“) genau der verlinkten Ausführung (Art.-Nr. im Merkmal).
// Kurztexte eigen; Werbeaussagen der Herstellerseite nicht übernommen.
//
// Bilder: Produktfreisteller aus der Produktmedien-Ablage von vzug.com
// (/medias/sys_master/products/…, Fassung „square1200“ aus dem srcset der
// Produktseite), Motiv unverändert (Original PNG; einheitlich ≤ 1600 px lange Kante, WebP q82 (tools/images/optimize-katalog.mjs)). Das Gerät
// ist vollständig mit Rand abgebildet – kein Beschnitt des Motivs. Die
// Moodbilder des CDN assets.vzug.com (nur feste Seitenverhältnisse) werden NICHT
// verwendet. Quellen je Bild: docs/bildquellen/QUELLEN.md („Katalog V-ZUG“).
// bilder[].typ: Produktfotos "freisteller"; Korbsystem-Ansichten der Geschirrspüler
// "detail". Ambiente-/Raumbilder und MARKE.looks: keine – die Raumbilder gibt es
// nur als feste Seitenverhältnis-Fassungen (16x9, 1x1, 9x16 …) ohne belegbare
// Originalfassung, Zuschnitt also nicht ausschließbar.
// ausfuehrungen: Design laut „Verfügbare Designs“ der Produktseite; Betriebsart
// (Abluft/Umluft) aus den Varianten-URLs der Herstellerseite, Art.-Nr. als code.
// Farbwerte (Hex) nennt der Hersteller nicht → kein farbe.
// zubehoer: nur Kombinationen, die die Herstellerseite ausdrücklich nennt.
//
// Preise (Nr. 26): vzug.com/at nennt keine Preise/UVP → kein Feld preis.

const STAND = "2026-10-31";
const T = (de, en, fr, it) => Object.freeze({ de, en, fr, it });
const bild = (file, width, height, alt, quelleUrl, typ = "freisteller") =>
  Object.freeze({ src: `/Images/Wellness/produkte/v-zug/${file}`, width, height, alt, quelleUrl, abgerufen: STAND, typ });
const mass = (key, wert) => Object.freeze({ key, wert });

/** @type {import("../schema.js").KatalogMarke} */
export const MARKE = Object.freeze({
  slug: "v-zug",
  name: "V-ZUG",
  welt: "kuechengeraete",
  herstellerUrl: "https://www.vzug.com/at/de/",
  // Händlersatz nur über den Claim-Guard (dealerStatement); hier nur der Schalter.
  dealer: true,
  stand: STAND,
});

/** @type {import("../schema.js").KatalogProdukt[]} */
export const PRODUKTE = Object.freeze([
  // ---------------------------------------------------------------- backofen
  Object.freeze({
    slug: "v-zug-combair-v2000-45",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "backofen",
    name: "Combair V2000 45",
    serie: "V2000",
    kurz: T("Einbau-Backofen Combair V2000 45 für eine Nische mit Normbreite 60 cm und Normhöhe 45 cm. Erhältlich in 2 Designs; Ausführungen und Datenblatt beim Hersteller.", "Built-in oven Combair V2000 45 for a niche with a standard width of 60 cm and height of 45 cm. Available in 2 finishes; versions and data sheet on the manufacturer’s website.", "Four encastrable Combair V2000 45 pour une niche de largeur normalisée 60 cm et de hauteur 45 cm. Disponible en 2 finitions ; versions et fiche technique sur le site du fabricant.", "Forno da incasso Combair V2000 45 per una nicchia di larghezza standard 60 cm e altezza 45 cm. Disponibile in 2 finiture; versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: Spiegelglas Schwarz · Spiegelglas Platinum", "Finishes: Spiegelglas Schwarz · Spiegelglas Platinum", "Finitions: Spiegelglas Schwarz · Spiegelglas Platinum", "Finiture: Spiegelglas Schwarz · Spiegelglas Platinum"),
      T("Garraum 43 l", "Cavity volume 43 l", "Volume de la cavité 43 l", "Volume del vano 43 l"),
      T("Ober-/Unterhitze bis 280 °C", "Top/bottom heat up to 280 °C", "Voûte/sole jusqu’à 280 °C", "Riscaldamento sopra/sotto fino a 280 °C"),
      T("Heißluft bis 280 °C", "Hot air up to 280 °C", "Air chaud jusqu’à 280 °C", "Aria calda fino a 280 °C"),
      T("Einschubebenen 3", "Shelf levels 3", "Niveaux d’enfournement 3", "Livelli di inserimento 3"),
      T("Nennleistung 3,0 kW", "Rated power 3.0 kW", "Puissance nominale 3,0 kW", "Potenza nominale 3,0 kW"),
      T("Energieeffizienzklasse A", "Energy efficiency class A", "Classe d’efficacité énergétique A", "Classe di efficienza energetica A"),
      T("Garantie laut Hersteller: 2 + 8 Jahre", "Warranty according to the manufacturer: 2 + 8 years", "Garantie selon le fabricant : 2 + 8 ans", "Garanzia secondo il produttore: 2 + 8 anni"),
      T("Daten für Art.-Nr. 2104800007; 2 Ausführungen auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 2104800007; 2 versions on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 2104800007 ; 2 versions sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 2104800007; 2 versioni su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "597 mm"), mass("hoehe", "454 mm"), mass("tiefe", "569 mm"), mass("nische", "B 560–568 mm · H 450 mm · T ≥ 560 mm")]),
    bilder: Object.freeze([
      bild("v-zug-combair-v2000-45-1.webp", 1200, 1200, T("V-ZUG Combair V2000 45: Gerät freigestellt von vorn, Design Spiegelglas Schwarz", "V-ZUG Combair V2000 45: cut-out front view of the appliance, Spiegelglas Schwarz finish", "V-ZUG Combair V2000 45 : appareil détouré vu de face, finition Spiegelglas Schwarz", "V-ZUG Combair V2000 45: apparecchio scontornato visto di fronte, finitura Spiegelglas Schwarz"), "https://www.vzug.com/at/de/produkte/kueche/backoefen/backoefen/combair-v2000-45--p2104800007"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "spiegelglas-schwarz", name: "Spiegelglas Schwarz" }),
          Object.freeze({ id: "spiegelglas-platinum", name: "Spiegelglas Platinum" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/backoefen/backoefen/combair-v2000-45--p2104800007",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/backoefen/backoefen/combair-v2000-45--p2104800007"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "v-zug-combair-v2000-60",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "backofen",
    name: "Combair V2000 60",
    serie: "V2000",
    kurz: T("Einbau-Backofen Combair V2000 60 für eine Nische mit Normbreite 60 cm und Normhöhe 60 cm. Erhältlich in 2 Designs; Ausführungen und Datenblatt beim Hersteller.", "Built-in oven Combair V2000 60 for a niche with a standard width of 60 cm and height of 60 cm. Available in 2 finishes; versions and data sheet on the manufacturer’s website.", "Four encastrable Combair V2000 60 pour une niche de largeur normalisée 60 cm et de hauteur 60 cm. Disponible en 2 finitions ; versions et fiche technique sur le site du fabricant.", "Forno da incasso Combair V2000 60 per una nicchia di larghezza standard 60 cm e altezza 60 cm. Disponibile in 2 finiture; versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: Spiegelglas Schwarz · Spiegelglas Platinum", "Finishes: Spiegelglas Schwarz · Spiegelglas Platinum", "Finitions: Spiegelglas Schwarz · Spiegelglas Platinum", "Finiture: Spiegelglas Schwarz · Spiegelglas Platinum"),
      T("Garraum 69 l", "Cavity volume 69 l", "Volume de la cavité 69 l", "Volume del vano 69 l"),
      T("Ober-/Unterhitze bis 280 °C", "Top/bottom heat up to 280 °C", "Voûte/sole jusqu’à 280 °C", "Riscaldamento sopra/sotto fino a 280 °C"),
      T("Heißluft bis 280 °C", "Hot air up to 280 °C", "Air chaud jusqu’à 280 °C", "Aria calda fino a 280 °C"),
      T("Einschubebenen 4", "Shelf levels 4", "Niveaux d’enfournement 4", "Livelli di inserimento 4"),
      T("Nennleistung 3,4 kW", "Rated power 3.4 kW", "Puissance nominale 3,4 kW", "Potenza nominale 3,4 kW"),
      T("Energieeffizienzklasse A", "Energy efficiency class A", "Classe d’efficacité énergétique A", "Classe di efficienza energetica A"),
      T("Garantie laut Hersteller: 2 + 8 Jahre", "Warranty according to the manufacturer: 2 + 8 years", "Garantie selon le fabricant : 2 + 8 ans", "Garanzia secondo il produttore: 2 + 8 anni"),
      T("Daten für Art.-Nr. 2104300014; 2 Ausführungen auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 2104300014; 2 versions on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 2104300014 ; 2 versions sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 2104300014; 2 versioni su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "597 mm"), mass("hoehe", "598 mm"), mass("tiefe", "569 mm"), mass("nische", "B 560–568 mm · H 594–600 mm · T ≥ 560 mm")]),
    bilder: Object.freeze([
      bild("v-zug-combair-v2000-60-1.webp", 1200, 1200, T("V-ZUG Combair V2000 60: Gerät freigestellt von vorn, Design Spiegelglas Schwarz", "V-ZUG Combair V2000 60: cut-out front view of the appliance, Spiegelglas Schwarz finish", "V-ZUG Combair V2000 60 : appareil détouré vu de face, finition Spiegelglas Schwarz", "V-ZUG Combair V2000 60: apparecchio scontornato visto di fronte, finitura Spiegelglas Schwarz"), "https://www.vzug.com/at/de/produkte/kueche/backoefen/backoefen/combair-v2000-60--p2104300014"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "spiegelglas-schwarz", name: "Spiegelglas Schwarz" }),
          Object.freeze({ id: "spiegelglas-platinum", name: "Spiegelglas Platinum" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/backoefen/backoefen/combair-v2000-60--p2104300014",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/backoefen/backoefen/combair-v2000-60--p2104300014"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "v-zug-combair-v4000-45",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "backofen",
    name: "Combair V4000 45",
    serie: "V4000",
    kurz: T("Einbau-Backofen Combair V4000 45 für eine Nische mit Normbreite 60 cm und Normhöhe 45 cm. Erhältlich in 2 Designs; Ausführungen und Datenblatt beim Hersteller.", "Built-in oven Combair V4000 45 for a niche with a standard width of 60 cm and height of 45 cm. Available in 2 finishes; versions and data sheet on the manufacturer’s website.", "Four encastrable Combair V4000 45 pour une niche de largeur normalisée 60 cm et de hauteur 45 cm. Disponible en 2 finitions ; versions et fiche technique sur le site du fabricant.", "Forno da incasso Combair V4000 45 per una nicchia di larghezza standard 60 cm e altezza 45 cm. Disponibile in 2 finiture; versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: Spiegelglas Schwarz · Spiegelglas Platinum", "Finishes: Spiegelglas Schwarz · Spiegelglas Platinum", "Finitions: Spiegelglas Schwarz · Spiegelglas Platinum", "Finiture: Spiegelglas Schwarz · Spiegelglas Platinum"),
      T("Garraum 43 l", "Cavity volume 43 l", "Volume de la cavité 43 l", "Volume del vano 43 l"),
      T("Ober-/Unterhitze bis 280 °C", "Top/bottom heat up to 280 °C", "Voûte/sole jusqu’à 280 °C", "Riscaldamento sopra/sotto fino a 280 °C"),
      T("Heißluft bis 280 °C", "Hot air up to 280 °C", "Air chaud jusqu’à 280 °C", "Aria calda fino a 280 °C"),
      T("Einschubebenen 3", "Shelf levels 3", "Niveaux d’enfournement 3", "Livelli di inserimento 3"),
      T("Nennleistung 3,0 kW", "Rated power 3.0 kW", "Puissance nominale 3,0 kW", "Potenza nominale 3,0 kW"),
      T("Energieeffizienzklasse A", "Energy efficiency class A", "Classe d’efficacité énergétique A", "Classe di efficienza energetica A"),
      T("Garantie laut Hersteller: 2 + 8 Jahre", "Warranty according to the manufacturer: 2 + 8 years", "Garantie selon le fabricant : 2 + 8 ans", "Garanzia secondo il produttore: 2 + 8 anni"),
      T("Daten für Art.-Nr. 2104900006; 2 Ausführungen auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 2104900006; 2 versions on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 2104900006 ; 2 versions sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 2104900006; 2 versioni su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "597 mm"), mass("hoehe", "454 mm"), mass("tiefe", "569 mm"), mass("nische", "B 560–568 mm · H 450 mm · T ≥ 560 mm")]),
    bilder: Object.freeze([
      bild("v-zug-combair-v4000-45-1.webp", 1200, 1200, T("V-ZUG Combair V4000 45: Gerät freigestellt von vorn, Design Spiegelglas Schwarz", "V-ZUG Combair V4000 45: cut-out front view of the appliance, Spiegelglas Schwarz finish", "V-ZUG Combair V4000 45 : appareil détouré vu de face, finition Spiegelglas Schwarz", "V-ZUG Combair V4000 45: apparecchio scontornato visto di fronte, finitura Spiegelglas Schwarz"), "https://www.vzug.com/at/de/produkte/kueche/backoefen/backoefen/combair-v4000-45--p2104900006"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "spiegelglas-schwarz", name: "Spiegelglas Schwarz" }),
          Object.freeze({ id: "spiegelglas-platinum", name: "Spiegelglas Platinum" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/backoefen/backoefen/combair-v4000-45--p2104900006",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/backoefen/backoefen/combair-v4000-45--p2104900006"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "v-zug-combair-v4000-45p",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "backofen",
    name: "Combair V4000 45P",
    serie: "V4000",
    kurz: T("Einbau-Backofen Combair V4000 45P für eine Nische mit Normbreite 60 cm und Normhöhe 45 cm. Erhältlich in 2 Designs; Ausführungen und Datenblatt beim Hersteller.", "Built-in oven Combair V4000 45P for a niche with a standard width of 60 cm and height of 45 cm. Available in 2 finishes; versions and data sheet on the manufacturer’s website.", "Four encastrable Combair V4000 45P pour une niche de largeur normalisée 60 cm et de hauteur 45 cm. Disponible en 2 finitions ; versions et fiche technique sur le site du fabricant.", "Forno da incasso Combair V4000 45P per una nicchia di larghezza standard 60 cm e altezza 45 cm. Disponibile in 2 finiture; versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: Spiegelglas Schwarz · Spiegelglas Platinum", "Finishes: Spiegelglas Schwarz · Spiegelglas Platinum", "Finitions: Spiegelglas Schwarz · Spiegelglas Platinum", "Finiture: Spiegelglas Schwarz · Spiegelglas Platinum"),
      T("Garraum 43 l", "Cavity volume 43 l", "Volume de la cavité 43 l", "Volume del vano 43 l"),
      T("Ober-/Unterhitze bis 300 °C", "Top/bottom heat up to 300 °C", "Voûte/sole jusqu’à 300 °C", "Riscaldamento sopra/sotto fino a 300 °C"),
      T("Heißluft bis 300 °C", "Hot air up to 300 °C", "Air chaud jusqu’à 300 °C", "Aria calda fino a 300 °C"),
      T("Einschubebenen 3", "Shelf levels 3", "Niveaux d’enfournement 3", "Livelli di inserimento 3"),
      T("Nennleistung 3,0 kW", "Rated power 3.0 kW", "Puissance nominale 3,0 kW", "Potenza nominale 3,0 kW"),
      T("Energieeffizienzklasse A", "Energy efficiency class A", "Classe d’efficacité énergétique A", "Classe di efficienza energetica A"),
      T("Garantie laut Hersteller: 2 + 8 Jahre", "Warranty according to the manufacturer: 2 + 8 years", "Garantie selon le fabricant : 2 + 8 ans", "Garanzia secondo il produttore: 2 + 8 anni"),
      T("Daten für Art.-Nr. 2105800006; 2 Ausführungen auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 2105800006; 2 versions on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 2105800006 ; 2 versions sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 2105800006; 2 versioni su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "597 mm"), mass("hoehe", "454 mm"), mass("tiefe", "569 mm"), mass("nische", "B 560–568 mm · H 450 mm · T ≥ 560 mm")]),
    bilder: Object.freeze([
      bild("v-zug-combair-v4000-45p-1.webp", 1200, 1200, T("V-ZUG Combair V4000 45P: Gerät freigestellt von vorn, Design Spiegelglas Schwarz", "V-ZUG Combair V4000 45P: cut-out front view of the appliance, Spiegelglas Schwarz finish", "V-ZUG Combair V4000 45P : appareil détouré vu de face, finition Spiegelglas Schwarz", "V-ZUG Combair V4000 45P: apparecchio scontornato visto di fronte, finitura Spiegelglas Schwarz"), "https://www.vzug.com/at/de/produkte/kueche/backoefen/backoefen/combair-v4000-45p--p2105800006"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "spiegelglas-schwarz", name: "Spiegelglas Schwarz" }),
          Object.freeze({ id: "spiegelglas-platinum", name: "Spiegelglas Platinum" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/backoefen/backoefen/combair-v4000-45p--p2105800006",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/backoefen/backoefen/combair-v4000-45p--p2105800006"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "v-zug-combair-v4000-60",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "backofen",
    name: "Combair V4000 60",
    serie: "V4000",
    kurz: T("Einbau-Backofen Combair V4000 60 für eine Nische mit Normbreite 60 cm und Normhöhe 60 cm. Erhältlich in 2 Designs; Ausführungen und Datenblatt beim Hersteller.", "Built-in oven Combair V4000 60 for a niche with a standard width of 60 cm and height of 60 cm. Available in 2 finishes; versions and data sheet on the manufacturer’s website.", "Four encastrable Combair V4000 60 pour une niche de largeur normalisée 60 cm et de hauteur 60 cm. Disponible en 2 finitions ; versions et fiche technique sur le site du fabricant.", "Forno da incasso Combair V4000 60 per una nicchia di larghezza standard 60 cm e altezza 60 cm. Disponibile in 2 finiture; versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: Spiegelglas Schwarz · Spiegelglas Platinum", "Finishes: Spiegelglas Schwarz · Spiegelglas Platinum", "Finitions: Spiegelglas Schwarz · Spiegelglas Platinum", "Finiture: Spiegelglas Schwarz · Spiegelglas Platinum"),
      T("Garraum 69 l", "Cavity volume 69 l", "Volume de la cavité 69 l", "Volume del vano 69 l"),
      T("Ober-/Unterhitze bis 280 °C", "Top/bottom heat up to 280 °C", "Voûte/sole jusqu’à 280 °C", "Riscaldamento sopra/sotto fino a 280 °C"),
      T("Heißluft bis 280 °C", "Hot air up to 280 °C", "Air chaud jusqu’à 280 °C", "Aria calda fino a 280 °C"),
      T("Einschubebenen 4", "Shelf levels 4", "Niveaux d’enfournement 4", "Livelli di inserimento 4"),
      T("Nennleistung 3,4 kW", "Rated power 3.4 kW", "Puissance nominale 3,4 kW", "Potenza nominale 3,4 kW"),
      T("Energieeffizienzklasse A", "Energy efficiency class A", "Classe d’efficacité énergétique A", "Classe di efficienza energetica A"),
      T("Garantie laut Hersteller: 2 + 8 Jahre", "Warranty according to the manufacturer: 2 + 8 years", "Garantie selon le fabricant : 2 + 8 ans", "Garanzia secondo il produttore: 2 + 8 anni"),
      T("Daten für Art.-Nr. 2104500009; 2 Ausführungen auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 2104500009; 2 versions on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 2104500009 ; 2 versions sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 2104500009; 2 versioni su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "597 mm"), mass("hoehe", "598 mm"), mass("tiefe", "569 mm"), mass("nische", "B 560–568 mm · H 594–600 mm · T ≥ 560 mm")]),
    bilder: Object.freeze([
      bild("v-zug-combair-v4000-60-1.webp", 1200, 1200, T("V-ZUG Combair V4000 60: Gerät freigestellt von vorn, Design Spiegelglas Schwarz", "V-ZUG Combair V4000 60: cut-out front view of the appliance, Spiegelglas Schwarz finish", "V-ZUG Combair V4000 60 : appareil détouré vu de face, finition Spiegelglas Schwarz", "V-ZUG Combair V4000 60: apparecchio scontornato visto di fronte, finitura Spiegelglas Schwarz"), "https://www.vzug.com/at/de/produkte/kueche/backoefen/backoefen/combair-v4000-60--p2104500009"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "spiegelglas-schwarz", name: "Spiegelglas Schwarz" }),
          Object.freeze({ id: "spiegelglas-platinum", name: "Spiegelglas Platinum" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/backoefen/backoefen/combair-v4000-60--p2104500009",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/backoefen/backoefen/combair-v4000-60--p2104500009"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "v-zug-combair-v4000-60p",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "backofen",
    name: "Combair V4000 60P",
    serie: "V4000",
    kurz: T("Einbau-Backofen Combair V4000 60P für eine Nische mit Normbreite 60 cm und Normhöhe 60 cm. Erhältlich in 2 Designs; Ausführungen und Datenblatt beim Hersteller.", "Built-in oven Combair V4000 60P for a niche with a standard width of 60 cm and height of 60 cm. Available in 2 finishes; versions and data sheet on the manufacturer’s website.", "Four encastrable Combair V4000 60P pour une niche de largeur normalisée 60 cm et de hauteur 60 cm. Disponible en 2 finitions ; versions et fiche technique sur le site du fabricant.", "Forno da incasso Combair V4000 60P per una nicchia di larghezza standard 60 cm e altezza 60 cm. Disponibile in 2 finiture; versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: Spiegelglas Schwarz · Spiegelglas Platinum", "Finishes: Spiegelglas Schwarz · Spiegelglas Platinum", "Finitions: Spiegelglas Schwarz · Spiegelglas Platinum", "Finiture: Spiegelglas Schwarz · Spiegelglas Platinum"),
      T("Garraum 69 l", "Cavity volume 69 l", "Volume de la cavité 69 l", "Volume del vano 69 l"),
      T("Ober-/Unterhitze bis 300 °C", "Top/bottom heat up to 300 °C", "Voûte/sole jusqu’à 300 °C", "Riscaldamento sopra/sotto fino a 300 °C"),
      T("Heißluft bis 300 °C", "Hot air up to 300 °C", "Air chaud jusqu’à 300 °C", "Aria calda fino a 300 °C"),
      T("Einschubebenen 4", "Shelf levels 4", "Niveaux d’enfournement 4", "Livelli di inserimento 4"),
      T("Nennleistung 3,4 kW", "Rated power 3.4 kW", "Puissance nominale 3,4 kW", "Potenza nominale 3,4 kW"),
      T("Energieeffizienzklasse A", "Energy efficiency class A", "Classe d’efficacité énergétique A", "Classe di efficienza energetica A"),
      T("Garantie laut Hersteller: 2 + 8 Jahre", "Warranty according to the manufacturer: 2 + 8 years", "Garantie selon le fabricant : 2 + 8 ans", "Garanzia secondo il produttore: 2 + 8 anni"),
      T("Daten für Art.-Nr. 2105500009; 2 Ausführungen auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 2105500009; 2 versions on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 2105500009 ; 2 versions sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 2105500009; 2 versioni su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "597 mm"), mass("hoehe", "598 mm"), mass("tiefe", "569 mm"), mass("nische", "B 560–568 mm · H 594–600 mm · T ≥ 560 mm")]),
    bilder: Object.freeze([
      bild("v-zug-combair-v4000-60p-1.webp", 1200, 1200, T("V-ZUG Combair V4000 60P: Gerät freigestellt von vorn, Design Spiegelglas Schwarz", "V-ZUG Combair V4000 60P: cut-out front view of the appliance, Spiegelglas Schwarz finish", "V-ZUG Combair V4000 60P : appareil détouré vu de face, finition Spiegelglas Schwarz", "V-ZUG Combair V4000 60P: apparecchio scontornato visto di fronte, finitura Spiegelglas Schwarz"), "https://www.vzug.com/at/de/produkte/kueche/backoefen/backoefen/combair-v4000-60p--p2105500009"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "spiegelglas-schwarz", name: "Spiegelglas Schwarz" }),
          Object.freeze({ id: "spiegelglas-platinum", name: "Spiegelglas Platinum" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/backoefen/backoefen/combair-v4000-60p--p2105500009",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/backoefen/backoefen/combair-v4000-60p--p2105500009"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "v-zug-combair-v6000-45",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "backofen",
    name: "Combair V6000 45",
    serie: "V6000",
    kurz: T("Einbau-Backofen Combair V6000 45 für eine Nische mit Normbreite 60 cm und Normhöhe 45 cm. Erhältlich in 3 Designs; Ausführungen und Datenblatt beim Hersteller.", "Built-in oven Combair V6000 45 for a niche with a standard width of 60 cm and height of 45 cm. Available in 3 finishes; versions and data sheet on the manufacturer’s website.", "Four encastrable Combair V6000 45 pour une niche de largeur normalisée 60 cm et de hauteur 45 cm. Disponible en 3 finitions ; versions et fiche technique sur le site du fabricant.", "Forno da incasso Combair V6000 45 per una nicchia di larghezza standard 60 cm e altezza 45 cm. Disponibile in 3 finiture; versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum", "Finishes: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum", "Finitions: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum", "Finiture: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum"),
      T("Garraum 43 l", "Cavity volume 43 l", "Volume de la cavité 43 l", "Volume del vano 43 l"),
      T("Ober-/Unterhitze bis 280 °C", "Top/bottom heat up to 280 °C", "Voûte/sole jusqu’à 280 °C", "Riscaldamento sopra/sotto fino a 280 °C"),
      T("Heißluft bis 280 °C", "Hot air up to 280 °C", "Air chaud jusqu’à 280 °C", "Aria calda fino a 280 °C"),
      T("Einschubebenen 3", "Shelf levels 3", "Niveaux d’enfournement 3", "Livelli di inserimento 3"),
      T("Nennleistung 3,0 kW", "Rated power 3.0 kW", "Puissance nominale 3,0 kW", "Potenza nominale 3,0 kW"),
      T("Energieeffizienzklasse A+", "Energy efficiency class A+", "Classe d’efficacité énergétique A+", "Classe di efficienza energetica A+"),
      T("Garantie laut Hersteller: 2 + 8 Jahre", "Warranty according to the manufacturer: 2 + 8 years", "Garantie selon le fabricant : 2 + 8 ans", "Garanzia secondo il produttore: 2 + 8 anni"),
      T("Daten für Art.-Nr. 2105000006; 4 Ausführungen auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 2105000006; 4 versions on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 2105000006 ; 4 versions sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 2105000006; 4 versioni su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "597 mm"), mass("hoehe", "454 mm"), mass("tiefe", "569 mm"), mass("nische", "B 560–568 mm · H 450 mm · T ≥ 560 mm")]),
    bilder: Object.freeze([
      bild("v-zug-combair-v6000-45-1.webp", 1200, 1200, T("V-ZUG Combair V6000 45: Gerät freigestellt von vorn, Design Spiegelglas Schwarz", "V-ZUG Combair V6000 45: cut-out front view of the appliance, Spiegelglas Schwarz finish", "V-ZUG Combair V6000 45 : appareil détouré vu de face, finition Spiegelglas Schwarz", "V-ZUG Combair V6000 45: apparecchio scontornato visto di fronte, finitura Spiegelglas Schwarz"), "https://www.vzug.com/at/de/produkte/kueche/backoefen/backoefen/combair-v6000-45--p2105000006"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "spiegelglas-pearl", name: "Spiegelglas Pearl" }),
          Object.freeze({ id: "spiegelglas-schwarz", name: "Spiegelglas Schwarz" }),
          Object.freeze({ id: "spiegelglas-platinum", name: "Spiegelglas Platinum" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/backoefen/backoefen/combair-v6000-45--p2105000006",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/backoefen/backoefen/combair-v6000-45--p2105000006"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "v-zug-combair-v6000-45p",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "backofen",
    name: "Combair V6000 45P",
    serie: "V6000",
    kurz: T("Einbau-Backofen Combair V6000 45P für eine Nische mit Normbreite 60 cm und Normhöhe 45 cm. Erhältlich in 3 Designs; Ausführungen und Datenblatt beim Hersteller.", "Built-in oven Combair V6000 45P for a niche with a standard width of 60 cm and height of 45 cm. Available in 3 finishes; versions and data sheet on the manufacturer’s website.", "Four encastrable Combair V6000 45P pour une niche de largeur normalisée 60 cm et de hauteur 45 cm. Disponible en 3 finitions ; versions et fiche technique sur le site du fabricant.", "Forno da incasso Combair V6000 45P per una nicchia di larghezza standard 60 cm e altezza 45 cm. Disponibile in 3 finiture; versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum", "Finishes: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum", "Finitions: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum", "Finiture: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum"),
      T("Garraum 43 l", "Cavity volume 43 l", "Volume de la cavité 43 l", "Volume del vano 43 l"),
      T("Ober-/Unterhitze bis 300 °C", "Top/bottom heat up to 300 °C", "Voûte/sole jusqu’à 300 °C", "Riscaldamento sopra/sotto fino a 300 °C"),
      T("Heißluft bis 300 °C", "Hot air up to 300 °C", "Air chaud jusqu’à 300 °C", "Aria calda fino a 300 °C"),
      T("Einschubebenen 3", "Shelf levels 3", "Niveaux d’enfournement 3", "Livelli di inserimento 3"),
      T("Nennleistung 3,0 kW", "Rated power 3.0 kW", "Puissance nominale 3,0 kW", "Potenza nominale 3,0 kW"),
      T("Energieeffizienzklasse A+", "Energy efficiency class A+", "Classe d’efficacité énergétique A+", "Classe di efficienza energetica A+"),
      T("Garantie laut Hersteller: 2 + 8 Jahre", "Warranty according to the manufacturer: 2 + 8 years", "Garantie selon le fabricant : 2 + 8 ans", "Garanzia secondo il produttore: 2 + 8 anni"),
      T("Daten für Art.-Nr. 2105900006; 6 Ausführungen auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 2105900006; 6 versions on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 2105900006 ; 6 versions sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 2105900006; 6 versioni su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "597 mm"), mass("hoehe", "454 mm"), mass("tiefe", "569 mm"), mass("nische", "B 560–568 mm · H 450 mm · T ≥ 560 mm")]),
    bilder: Object.freeze([
      bild("v-zug-combair-v6000-45p-1.webp", 1200, 1200, T("V-ZUG Combair V6000 45P: Gerät freigestellt von vorn, Design Spiegelglas Schwarz", "V-ZUG Combair V6000 45P: cut-out front view of the appliance, Spiegelglas Schwarz finish", "V-ZUG Combair V6000 45P : appareil détouré vu de face, finition Spiegelglas Schwarz", "V-ZUG Combair V6000 45P: apparecchio scontornato visto di fronte, finitura Spiegelglas Schwarz"), "https://www.vzug.com/at/de/produkte/kueche/backoefen/backoefen/combair-v6000-45p--p2105900006"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "spiegelglas-pearl", name: "Spiegelglas Pearl" }),
          Object.freeze({ id: "spiegelglas-schwarz", name: "Spiegelglas Schwarz" }),
          Object.freeze({ id: "spiegelglas-platinum", name: "Spiegelglas Platinum" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/backoefen/backoefen/combair-v6000-45p--p2105900006",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/backoefen/backoefen/combair-v6000-45p--p2105900006"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "v-zug-combair-v6000-60",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "backofen",
    name: "Combair V6000 60",
    serie: "V6000",
    kurz: T("Einbau-Backofen Combair V6000 60 für eine Nische mit Normbreite 60 cm und Normhöhe 60 cm. Erhältlich in 3 Designs; Ausführungen und Datenblatt beim Hersteller.", "Built-in oven Combair V6000 60 for a niche with a standard width of 60 cm and height of 60 cm. Available in 3 finishes; versions and data sheet on the manufacturer’s website.", "Four encastrable Combair V6000 60 pour une niche de largeur normalisée 60 cm et de hauteur 60 cm. Disponible en 3 finitions ; versions et fiche technique sur le site du fabricant.", "Forno da incasso Combair V6000 60 per una nicchia di larghezza standard 60 cm e altezza 60 cm. Disponibile in 3 finiture; versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum", "Finishes: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum", "Finitions: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum", "Finiture: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum"),
      T("Garraum 69 l", "Cavity volume 69 l", "Volume de la cavité 69 l", "Volume del vano 69 l"),
      T("Ober-/Unterhitze bis 280 °C", "Top/bottom heat up to 280 °C", "Voûte/sole jusqu’à 280 °C", "Riscaldamento sopra/sotto fino a 280 °C"),
      T("Heißluft bis 280 °C", "Hot air up to 280 °C", "Air chaud jusqu’à 280 °C", "Aria calda fino a 280 °C"),
      T("Einschubebenen 4", "Shelf levels 4", "Niveaux d’enfournement 4", "Livelli di inserimento 4"),
      T("Nennleistung 3,4 kW", "Rated power 3.4 kW", "Puissance nominale 3,4 kW", "Potenza nominale 3,4 kW"),
      T("Energieeffizienzklasse A+", "Energy efficiency class A+", "Classe d’efficacité énergétique A+", "Classe di efficienza energetica A+"),
      T("Garantie laut Hersteller: 2 + 8 Jahre", "Warranty according to the manufacturer: 2 + 8 years", "Garantie selon le fabricant : 2 + 8 ans", "Garanzia secondo il produttore: 2 + 8 anni"),
      T("Daten für Art.-Nr. 2104700007; 4 Ausführungen auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 2104700007; 4 versions on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 2104700007 ; 4 versions sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 2104700007; 4 versioni su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "597 mm"), mass("hoehe", "598 mm"), mass("tiefe", "569 mm"), mass("nische", "B 560–568 mm · H 594–600 mm · T ≥ 560 mm")]),
    bilder: Object.freeze([
      bild("v-zug-combair-v6000-60-1.webp", 1200, 1200, T("V-ZUG Combair V6000 60: Gerät freigestellt von vorn, Design Spiegelglas Schwarz", "V-ZUG Combair V6000 60: cut-out front view of the appliance, Spiegelglas Schwarz finish", "V-ZUG Combair V6000 60 : appareil détouré vu de face, finition Spiegelglas Schwarz", "V-ZUG Combair V6000 60: apparecchio scontornato visto di fronte, finitura Spiegelglas Schwarz"), "https://www.vzug.com/at/de/produkte/kueche/backoefen/backoefen/combair-v6000-60--p2104700007"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "spiegelglas-pearl", name: "Spiegelglas Pearl" }),
          Object.freeze({ id: "spiegelglas-schwarz", name: "Spiegelglas Schwarz" }),
          Object.freeze({ id: "spiegelglas-platinum", name: "Spiegelglas Platinum" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/backoefen/backoefen/combair-v6000-60--p2104700007",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/backoefen/backoefen/combair-v6000-60--p2104700007"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "v-zug-combair-v6000-60p",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "backofen",
    name: "Combair V6000 60P",
    serie: "V6000",
    kurz: T("Einbau-Backofen Combair V6000 60P für eine Nische mit Normbreite 60 cm und Normhöhe 60 cm. Erhältlich in 3 Designs; Ausführungen und Datenblatt beim Hersteller.", "Built-in oven Combair V6000 60P for a niche with a standard width of 60 cm and height of 60 cm. Available in 3 finishes; versions and data sheet on the manufacturer’s website.", "Four encastrable Combair V6000 60P pour une niche de largeur normalisée 60 cm et de hauteur 60 cm. Disponible en 3 finitions ; versions et fiche technique sur le site du fabricant.", "Forno da incasso Combair V6000 60P per una nicchia di larghezza standard 60 cm e altezza 60 cm. Disponibile in 3 finiture; versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum", "Finishes: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum", "Finitions: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum", "Finiture: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum"),
      T("Garraum 69 l", "Cavity volume 69 l", "Volume de la cavité 69 l", "Volume del vano 69 l"),
      T("Ober-/Unterhitze bis 300 °C", "Top/bottom heat up to 300 °C", "Voûte/sole jusqu’à 300 °C", "Riscaldamento sopra/sotto fino a 300 °C"),
      T("Heißluft bis 300 °C", "Hot air up to 300 °C", "Air chaud jusqu’à 300 °C", "Aria calda fino a 300 °C"),
      T("Einschubebenen 4", "Shelf levels 4", "Niveaux d’enfournement 4", "Livelli di inserimento 4"),
      T("Nennleistung 3,4 kW", "Rated power 3.4 kW", "Puissance nominale 3,4 kW", "Potenza nominale 3,4 kW"),
      T("Energieeffizienzklasse A+", "Energy efficiency class A+", "Classe d’efficacité énergétique A+", "Classe di efficienza energetica A+"),
      T("Garantie laut Hersteller: 2 + 8 Jahre", "Warranty according to the manufacturer: 2 + 8 years", "Garantie selon le fabricant : 2 + 8 ans", "Garanzia secondo il produttore: 2 + 8 anni"),
      T("Daten für Art.-Nr. 2105700009; 6 Ausführungen auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 2105700009; 6 versions on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 2105700009 ; 6 versions sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 2105700009; 6 versioni su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "597 mm"), mass("hoehe", "598 mm"), mass("tiefe", "569 mm"), mass("nische", "B 560–568 mm · H 594–600 mm · T ≥ 560 mm")]),
    bilder: Object.freeze([
      bild("v-zug-combair-v6000-60p-1.webp", 1200, 1200, T("V-ZUG Combair V6000 60P: Gerät freigestellt von vorn, Design Spiegelglas Schwarz", "V-ZUG Combair V6000 60P: cut-out front view of the appliance, Spiegelglas Schwarz finish", "V-ZUG Combair V6000 60P : appareil détouré vu de face, finition Spiegelglas Schwarz", "V-ZUG Combair V6000 60P: apparecchio scontornato visto di fronte, finitura Spiegelglas Schwarz"), "https://www.vzug.com/at/de/produkte/kueche/backoefen/backoefen/combair-v6000-60p--p2105700009"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "spiegelglas-pearl", name: "Spiegelglas Pearl" }),
          Object.freeze({ id: "spiegelglas-schwarz", name: "Spiegelglas Schwarz" }),
          Object.freeze({ id: "spiegelglas-platinum", name: "Spiegelglas Platinum" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/backoefen/backoefen/combair-v6000-60p--p2105700009",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/backoefen/backoefen/combair-v6000-60p--p2105700009"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "v-zug-combairsteamer-v2000-60",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "backofen",
    name: "CombairSteamer V2000 60",
    serie: "V2000",
    kurz: T("Einbau-Backofen mit Dampffunktionen CombairSteamer V2000 60 für eine Nische mit Normbreite 60 cm und Normhöhe 60 cm. Erhältlich in 2 Designs; Ausführungen und Datenblatt beim Hersteller.", "Built-in oven with steam functions CombairSteamer V2000 60 for a niche with a standard width of 60 cm and height of 60 cm. Available in 2 finishes; versions and data sheet on the manufacturer’s website.", "Four encastrable avec fonctions vapeur CombairSteamer V2000 60 pour une niche de largeur normalisée 60 cm et de hauteur 60 cm. Disponible en 2 finitions ; versions et fiche technique sur le site du fabricant.", "Forno da incasso con funzioni vapore CombairSteamer V2000 60 per una nicchia di larghezza standard 60 cm e altezza 60 cm. Disponibile in 2 finiture; versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: Spiegelglas Schwarz · Spiegelglas Platinum", "Finishes: Spiegelglas Schwarz · Spiegelglas Platinum", "Finitions: Spiegelglas Schwarz · Spiegelglas Platinum", "Finiture: Spiegelglas Schwarz · Spiegelglas Platinum"),
      T("Garraum 69 l", "Cavity volume 69 l", "Volume de la cavité 69 l", "Volume del vano 69 l"),
      T("Ober-/Unterhitze bis 230 °C", "Top/bottom heat up to 230 °C", "Voûte/sole jusqu’à 230 °C", "Riscaldamento sopra/sotto fino a 230 °C"),
      T("Heißluft bis 230 °C", "Hot air up to 230 °C", "Air chaud jusqu’à 230 °C", "Aria calda fino a 230 °C"),
      T("Dampfbetrieb bis 100 °C", "Steam mode up to 100 °C", "Mode vapeur jusqu’à 100 °C", "Modalità vapore fino a 100 °C"),
      T("Einschubebenen 4", "Shelf levels 4", "Niveaux d’enfournement 4", "Livelli di inserimento 4"),
      T("Nennleistung 3,7 kW", "Rated power 3.7 kW", "Puissance nominale 3,7 kW", "Potenza nominale 3,7 kW"),
      T("Energieeffizienzklasse A+", "Energy efficiency class A+", "Classe d’efficacité énergétique A+", "Classe di efficienza energetica A+"),
      T("Garantie laut Hersteller: 2 + 8 Jahre", "Warranty according to the manufacturer: 2 + 8 years", "Garantie selon le fabricant : 2 + 8 ans", "Garanzia secondo il produttore: 2 + 8 anni"),
      T("Daten für Art.-Nr. 2303600007; 2 Ausführungen auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 2303600007; 2 versions on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 2303600007 ; 2 versions sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 2303600007; 2 versioni su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "597 mm"), mass("hoehe", "598 mm"), mass("tiefe", "569 mm"), mass("nische", "B 560–568 mm · H 594–600 mm · T ≥ 560 mm")]),
    bilder: Object.freeze([
      bild("v-zug-combairsteamer-v2000-60-1.webp", 1200, 1200, T("V-ZUG CombairSteamer V2000 60: Gerät freigestellt von vorn, Design Spiegelglas Schwarz", "V-ZUG CombairSteamer V2000 60: cut-out front view of the appliance, Spiegelglas Schwarz finish", "V-ZUG CombairSteamer V2000 60 : appareil détouré vu de face, finition Spiegelglas Schwarz", "V-ZUG CombairSteamer V2000 60: apparecchio scontornato visto di fronte, finitura Spiegelglas Schwarz"), "https://www.vzug.com/at/de/produkte/kueche/backoefen/backoefen-mit-dampffunktionen/combairsteamer-v2000-60--p2303600007"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "spiegelglas-schwarz", name: "Spiegelglas Schwarz" }),
          Object.freeze({ id: "spiegelglas-platinum", name: "Spiegelglas Platinum" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/backoefen/backoefen-mit-dampffunktionen/combairsteamer-v2000-60--p2303600007",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/backoefen/backoefen-mit-dampffunktionen/combairsteamer-v2000-60--p2303600007"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "v-zug-combairsteamer-v6000-60",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "backofen",
    name: "CombairSteamer V6000 60",
    serie: "V6000",
    kurz: T("Einbau-Backofen mit Dampffunktionen CombairSteamer V6000 60 für eine Nische mit Normbreite 60 cm und Normhöhe 60 cm. Erhältlich in 3 Designs; Ausführungen und Datenblatt beim Hersteller.", "Built-in oven with steam functions CombairSteamer V6000 60 for a niche with a standard width of 60 cm and height of 60 cm. Available in 3 finishes; versions and data sheet on the manufacturer’s website.", "Four encastrable avec fonctions vapeur CombairSteamer V6000 60 pour une niche de largeur normalisée 60 cm et de hauteur 60 cm. Disponible en 3 finitions ; versions et fiche technique sur le site du fabricant.", "Forno da incasso con funzioni vapore CombairSteamer V6000 60 per una nicchia di larghezza standard 60 cm e altezza 60 cm. Disponibile in 3 finiture; versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum", "Finishes: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum", "Finitions: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum", "Finiture: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum"),
      T("Garraum 69 l", "Cavity volume 69 l", "Volume de la cavité 69 l", "Volume del vano 69 l"),
      T("Ober-/Unterhitze bis 230 °C", "Top/bottom heat up to 230 °C", "Voûte/sole jusqu’à 230 °C", "Riscaldamento sopra/sotto fino a 230 °C"),
      T("Heißluft bis 230 °C", "Hot air up to 230 °C", "Air chaud jusqu’à 230 °C", "Aria calda fino a 230 °C"),
      T("Dampfbetrieb bis 100 °C", "Steam mode up to 100 °C", "Mode vapeur jusqu’à 100 °C", "Modalità vapore fino a 100 °C"),
      T("Einschubebenen 4", "Shelf levels 4", "Niveaux d’enfournement 4", "Livelli di inserimento 4"),
      T("Nennleistung 3,7 kW", "Rated power 3.7 kW", "Puissance nominale 3,7 kW", "Potenza nominale 3,7 kW"),
      T("Energieeffizienzklasse A+", "Energy efficiency class A+", "Classe d’efficacité énergétique A+", "Classe di efficienza energetica A+"),
      T("Garantie laut Hersteller: 2 + 8 Jahre", "Warranty according to the manufacturer: 2 + 8 years", "Garantie selon le fabricant : 2 + 8 ans", "Garanzia secondo il produttore: 2 + 8 anni"),
      T("Daten für Art.-Nr. 2303800020; 6 Ausführungen auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 2303800020; 6 versions on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 2303800020 ; 6 versions sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 2303800020; 6 versioni su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "597 mm"), mass("hoehe", "598 mm"), mass("tiefe", "569 mm"), mass("nische", "B 560–568 mm · H 600 mm · T ≥ 560 mm")]),
    bilder: Object.freeze([
      bild("v-zug-combairsteamer-v6000-60-1.webp", 1200, 1200, T("V-ZUG CombairSteamer V6000 60: Gerät freigestellt von vorn, Design Spiegelglas Pearl", "V-ZUG CombairSteamer V6000 60: cut-out front view of the appliance, Spiegelglas Pearl finish", "V-ZUG CombairSteamer V6000 60 : appareil détouré vu de face, finition Spiegelglas Pearl", "V-ZUG CombairSteamer V6000 60: apparecchio scontornato visto di fronte, finitura Spiegelglas Pearl"), "https://www.vzug.com/at/de/produkte/kueche/backoefen/backoefen-mit-dampffunktionen/combairsteamer-v6000--p2303800020"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "spiegelglas-pearl", name: "Spiegelglas Pearl" }),
          Object.freeze({ id: "spiegelglas-schwarz", name: "Spiegelglas Schwarz" }),
          Object.freeze({ id: "spiegelglas-platinum", name: "Spiegelglas Platinum" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/backoefen/backoefen-mit-dampffunktionen/combairsteamer-v6000--p2303800020",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/backoefen/backoefen-mit-dampffunktionen/combairsteamer-v6000--p2303800020"]),
    stand: STAND,
  }),
  // ---------------------------------------------------------------- dampfgarer
  Object.freeze({
    slug: "v-zug-combisteamer-v4000-45",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "dampfgarer",
    name: "CombiSteamer V4000 45",
    serie: "V4000",
    kurz: T("Dampfgarer mit Heißluft CombiSteamer V4000 45 für eine Nische mit Normbreite 60 cm und Normhöhe 45 cm. Erhältlich in 2 Designs; Ausführungen und Datenblatt beim Hersteller.", "Steam oven with hot air CombiSteamer V4000 45 for a niche with a standard width of 60 cm and height of 45 cm. Available in 2 finishes; versions and data sheet on the manufacturer’s website.", "Four vapeur à air chaud CombiSteamer V4000 45 pour une niche de largeur normalisée 60 cm et de hauteur 45 cm. Disponible en 2 finitions ; versions et fiche technique sur le site du fabricant.", "Forno a vapore con aria calda CombiSteamer V4000 45 per una nicchia di larghezza standard 60 cm e altezza 45 cm. Disponibile in 2 finiture; versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: Spiegelglas Schwarz · Spiegelglas Platinum", "Finishes: Spiegelglas Schwarz · Spiegelglas Platinum", "Finitions: Spiegelglas Schwarz · Spiegelglas Platinum", "Finiture: Spiegelglas Schwarz · Spiegelglas Platinum"),
      T("Garraum 48 l", "Cavity volume 48 l", "Volume de la cavité 48 l", "Volume del vano 48 l"),
      T("Heißluft bis 230 °C", "Hot air up to 230 °C", "Air chaud jusqu’à 230 °C", "Aria calda fino a 230 °C"),
      T("Dampfbetrieb bis 100 °C", "Steam mode up to 100 °C", "Mode vapeur jusqu’à 100 °C", "Modalità vapore fino a 100 °C"),
      T("Einschubebenen 4", "Shelf levels 4", "Niveaux d’enfournement 4", "Livelli di inserimento 4"),
      T("Nennleistung 3,7 kW", "Rated power 3.7 kW", "Puissance nominale 3,7 kW", "Potenza nominale 3,7 kW"),
      T("Energieeffizienzklasse A++", "Energy efficiency class A++", "Classe d’efficacité énergétique A++", "Classe di efficienza energetica A++"),
      T("Garantie laut Hersteller: 2 + 8 Jahre", "Warranty according to the manufacturer: 2 + 8 years", "Garantie selon le fabricant : 2 + 8 ans", "Garanzia secondo il produttore: 2 + 8 anni"),
      T("Daten für Art.-Nr. 2303100004; 2 Ausführungen auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 2303100004; 2 versions on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 2303100004 ; 2 versions sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 2303100004; 2 versioni su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "597 mm"), mass("hoehe", "454 mm"), mass("tiefe", "569 mm"), mass("nische", "B 560–568 mm · H 450 mm · T ≥ 560 mm")]),
    bilder: Object.freeze([
      bild("v-zug-combisteamer-v4000-45-1.webp", 1200, 1200, T("V-ZUG CombiSteamer V4000 45: Gerät freigestellt von vorn, Design Spiegelglas Schwarz", "V-ZUG CombiSteamer V4000 45: cut-out front view of the appliance, Spiegelglas Schwarz finish", "V-ZUG CombiSteamer V4000 45 : appareil détouré vu de face, finition Spiegelglas Schwarz", "V-ZUG CombiSteamer V4000 45: apparecchio scontornato visto di fronte, finitura Spiegelglas Schwarz"), "https://www.vzug.com/at/de/produkte/kueche/steamer/combi-steamer/combisteamer-v4000-45--p2303100004"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "spiegelglas-schwarz", name: "Spiegelglas Schwarz" }),
          Object.freeze({ id: "spiegelglas-platinum", name: "Spiegelglas Platinum" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/steamer/combi-steamer/combisteamer-v4000-45--p2303100004",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/steamer/combi-steamer/combisteamer-v4000-45--p2303100004"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "v-zug-combisteamer-v6000-45",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "dampfgarer",
    name: "CombiSteamer V6000 45",
    serie: "V6000",
    kurz: T("Dampfgarer mit Heißluft CombiSteamer V6000 45 für eine Nische mit Normbreite 60 cm und Normhöhe 45 cm. Erhältlich in 3 Designs; Ausführungen und Datenblatt beim Hersteller.", "Steam oven with hot air CombiSteamer V6000 45 for a niche with a standard width of 60 cm and height of 45 cm. Available in 3 finishes; versions and data sheet on the manufacturer’s website.", "Four vapeur à air chaud CombiSteamer V6000 45 pour une niche de largeur normalisée 60 cm et de hauteur 45 cm. Disponible en 3 finitions ; versions et fiche technique sur le site du fabricant.", "Forno a vapore con aria calda CombiSteamer V6000 45 per una nicchia di larghezza standard 60 cm e altezza 45 cm. Disponibile in 3 finiture; versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum", "Finishes: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum", "Finitions: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum", "Finiture: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum"),
      T("Garraum 48 l", "Cavity volume 48 l", "Volume de la cavité 48 l", "Volume del vano 48 l"),
      T("Heißluft bis 230 °C", "Hot air up to 230 °C", "Air chaud jusqu’à 230 °C", "Aria calda fino a 230 °C"),
      T("Dampfbetrieb bis 100 °C", "Steam mode up to 100 °C", "Mode vapeur jusqu’à 100 °C", "Modalità vapore fino a 100 °C"),
      T("Einschubebenen 4", "Shelf levels 4", "Niveaux d’enfournement 4", "Livelli di inserimento 4"),
      T("Nennleistung 3,7 kW", "Rated power 3.7 kW", "Puissance nominale 3,7 kW", "Potenza nominale 3,7 kW"),
      T("Energieeffizienzklasse A++", "Energy efficiency class A++", "Classe d’efficacité énergétique A++", "Classe di efficienza energetica A++"),
      T("Garantie laut Hersteller: 2 + 8 Jahre", "Warranty according to the manufacturer: 2 + 8 years", "Garantie selon le fabricant : 2 + 8 ans", "Garanzia secondo il produttore: 2 + 8 anni"),
      T("Daten für Art.-Nr. 2303200006; 6 Ausführungen auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 2303200006; 6 versions on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 2303200006 ; 6 versions sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 2303200006; 6 versioni su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "597 mm"), mass("hoehe", "454 mm"), mass("tiefe", "569 mm"), mass("nische", "B 560–568 mm · H 450 mm · T ≥ 560 mm")]),
    bilder: Object.freeze([
      bild("v-zug-combisteamer-v6000-45-1.webp", 1200, 1200, T("V-ZUG CombiSteamer V6000 45: Gerät freigestellt von vorn, Design Spiegelglas Schwarz", "V-ZUG CombiSteamer V6000 45: cut-out front view of the appliance, Spiegelglas Schwarz finish", "V-ZUG CombiSteamer V6000 45 : appareil détouré vu de face, finition Spiegelglas Schwarz", "V-ZUG CombiSteamer V6000 45: apparecchio scontornato visto di fronte, finitura Spiegelglas Schwarz"), "https://www.vzug.com/at/de/produkte/kueche/steamer/combi-steamer/combisteamer-v6000-45--p2303200006"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "spiegelglas-pearl", name: "Spiegelglas Pearl" }),
          Object.freeze({ id: "spiegelglas-schwarz", name: "Spiegelglas Schwarz" }),
          Object.freeze({ id: "spiegelglas-platinum", name: "Spiegelglas Platinum" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/steamer/combi-steamer/combisteamer-v6000-45--p2303200006",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/steamer/combi-steamer/combisteamer-v6000-45--p2303200006"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "v-zug-combisteamer-v6000-45f",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "dampfgarer",
    name: "CombiSteamer V6000 45F",
    serie: "V6000",
    kurz: T("Dampfgarer mit Heißluft CombiSteamer V6000 45F für eine Nische mit Normbreite 60 cm und Normhöhe 45 cm. Erhältlich in 3 Designs; Ausführungen und Datenblatt beim Hersteller.", "Steam oven with hot air CombiSteamer V6000 45F for a niche with a standard width of 60 cm and height of 45 cm. Available in 3 finishes; versions and data sheet on the manufacturer’s website.", "Four vapeur à air chaud CombiSteamer V6000 45F pour une niche de largeur normalisée 60 cm et de hauteur 45 cm. Disponible en 3 finitions ; versions et fiche technique sur le site du fabricant.", "Forno a vapore con aria calda CombiSteamer V6000 45F per una nicchia di larghezza standard 60 cm e altezza 45 cm. Disponibile in 3 finiture; versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum", "Finishes: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum", "Finitions: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum", "Finiture: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum"),
      T("Garraum 48 l", "Cavity volume 48 l", "Volume de la cavité 48 l", "Volume del vano 48 l"),
      T("Heißluft bis 230 °C", "Hot air up to 230 °C", "Air chaud jusqu’à 230 °C", "Aria calda fino a 230 °C"),
      T("Dampfbetrieb bis 100 °C", "Steam mode up to 100 °C", "Mode vapeur jusqu’à 100 °C", "Modalità vapore fino a 100 °C"),
      T("Einschubebenen 4", "Shelf levels 4", "Niveaux d’enfournement 4", "Livelli di inserimento 4"),
      T("Nennleistung 3,7 kW", "Rated power 3.7 kW", "Puissance nominale 3,7 kW", "Potenza nominale 3,7 kW"),
      T("Energieeffizienzklasse A++", "Energy efficiency class A++", "Classe d’efficacité énergétique A++", "Classe di efficienza energetica A++"),
      T("Garantie laut Hersteller: 2 + 8 Jahre", "Warranty according to the manufacturer: 2 + 8 years", "Garantie selon le fabricant : 2 + 8 ans", "Garanzia secondo il produttore: 2 + 8 anni"),
      T("Daten für Art.-Nr. 2303300004; 6 Ausführungen auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 2303300004; 6 versions on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 2303300004 ; 6 versions sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 2303300004; 6 versioni su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "597 mm"), mass("hoehe", "454 mm"), mass("tiefe", "569 mm"), mass("nische", "B 560–568 mm · H 450 mm · T ≥ 560 mm")]),
    bilder: Object.freeze([
      bild("v-zug-combisteamer-v6000-45f-1.webp", 1200, 1200, T("V-ZUG CombiSteamer V6000 45F: Gerät freigestellt von vorn, Design Spiegelglas Schwarz", "V-ZUG CombiSteamer V6000 45F: cut-out front view of the appliance, Spiegelglas Schwarz finish", "V-ZUG CombiSteamer V6000 45F : appareil détouré vu de face, finition Spiegelglas Schwarz", "V-ZUG CombiSteamer V6000 45F: apparecchio scontornato visto di fronte, finitura Spiegelglas Schwarz"), "https://www.vzug.com/at/de/produkte/kueche/steamer/combi-steamer/combisteamer-v6000-45f--p2303300004"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "spiegelglas-pearl", name: "Spiegelglas Pearl" }),
          Object.freeze({ id: "spiegelglas-schwarz", name: "Spiegelglas Schwarz" }),
          Object.freeze({ id: "spiegelglas-platinum", name: "Spiegelglas Platinum" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/steamer/combi-steamer/combisteamer-v6000-45f--p2303300004",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/steamer/combi-steamer/combisteamer-v6000-45f--p2303300004"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "v-zug-combisteamer-v6000-45l-grand",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "dampfgarer",
    name: "CombiSteamer V6000 45L Grand",
    serie: "V6000",
    kurz: T("Dampfgarer mit Heißluft CombiSteamer V6000 45L Grand für eine Nische mit Normbreite 90 cm und Normhöhe 45 cm. Erhältlich in 3 Designs; Ausführungen und Datenblatt beim Hersteller.", "Steam oven with hot air CombiSteamer V6000 45L Grand for a niche with a standard width of 90 cm and height of 45 cm. Available in 3 finishes; versions and data sheet on the manufacturer’s website.", "Four vapeur à air chaud CombiSteamer V6000 45L Grand pour une niche de largeur normalisée 90 cm et de hauteur 45 cm. Disponible en 3 finitions ; versions et fiche technique sur le site du fabricant.", "Forno a vapore con aria calda CombiSteamer V6000 45L Grand per una nicchia di larghezza standard 90 cm e altezza 45 cm. Disponibile in 3 finiture; versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum", "Finishes: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum", "Finitions: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum", "Finiture: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum"),
      T("Garraum 68 l", "Cavity volume 68 l", "Volume de la cavité 68 l", "Volume del vano 68 l"),
      T("Heißluft bis 230 °C", "Hot air up to 230 °C", "Air chaud jusqu’à 230 °C", "Aria calda fino a 230 °C"),
      T("Dampfbetrieb bis 100 °C", "Steam mode up to 100 °C", "Mode vapeur jusqu’à 100 °C", "Modalità vapore fino a 100 °C"),
      T("Einschubebenen 4", "Shelf levels 4", "Niveaux d’enfournement 4", "Livelli di inserimento 4"),
      T("Nennleistung 3,7 kW", "Rated power 3.7 kW", "Puissance nominale 3,7 kW", "Potenza nominale 3,7 kW"),
      T("Energieeffizienzklasse A", "Energy efficiency class A", "Classe d’efficacité énergétique A", "Classe di efficienza energetica A"),
      T("Garantie laut Hersteller: 2 + 8 Jahre", "Warranty according to the manufacturer: 2 + 8 years", "Garantie selon le fabricant : 2 + 8 ans", "Garanzia secondo il produttore: 2 + 8 anni"),
      T("Daten für Art.-Nr. 2303400007; 6 Ausführungen auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 2303400007; 6 versions on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 2303400007 ; 6 versions sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 2303400007; 6 versioni su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "897 mm"), mass("hoehe", "454 mm"), mass("tiefe", "570 mm"), mass("nische", "B 724–726 mm · H 450 mm · T ≥ 575 mm")]),
    bilder: Object.freeze([
      bild("v-zug-combisteamer-v6000-45l-grand-1.webp", 1200, 1200, T("V-ZUG CombiSteamer V6000 45L Grand: Gerät freigestellt von vorn", "V-ZUG CombiSteamer V6000 45L Grand: cut-out front view of the appliance", "V-ZUG CombiSteamer V6000 45L Grand : appareil détouré vu de face", "V-ZUG CombiSteamer V6000 45L Grand: apparecchio scontornato visto di fronte"), "https://www.vzug.com/at/de/produkte/kueche/steamer/combi-steamer/combisteamer-v6000-45l-grand--p2303400007"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "spiegelglas-pearl", name: "Spiegelglas Pearl" }),
          Object.freeze({ id: "spiegelglas-schwarz", name: "Spiegelglas Schwarz" }),
          Object.freeze({ id: "spiegelglas-platinum", name: "Spiegelglas Platinum" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/steamer/combi-steamer/combisteamer-v6000-45l-grand--p2303400007",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/steamer/combi-steamer/combisteamer-v6000-45l-grand--p2303400007"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "v-zug-combisteamer-v6000-45m-powersteam",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "dampfgarer",
    name: "CombiSteamer V6000 45M PowerSteam",
    serie: "V6000",
    kurz: T("Dampfgarer mit Heißluft CombiSteamer V6000 45M PowerSteam für eine Nische mit Normbreite 60 cm und Normhöhe 45 cm. Erhältlich in 3 Designs; Ausführungen und Datenblatt beim Hersteller.", "Steam oven with hot air CombiSteamer V6000 45M PowerSteam for a niche with a standard width of 60 cm and height of 45 cm. Available in 3 finishes; versions and data sheet on the manufacturer’s website.", "Four vapeur à air chaud CombiSteamer V6000 45M PowerSteam pour une niche de largeur normalisée 60 cm et de hauteur 45 cm. Disponible en 3 finitions ; versions et fiche technique sur le site du fabricant.", "Forno a vapore con aria calda CombiSteamer V6000 45M PowerSteam per una nicchia di larghezza standard 60 cm e altezza 45 cm. Disponibile in 3 finiture; versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum", "Finishes: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum", "Finitions: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum", "Finiture: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum"),
      T("Garraum 41 l", "Cavity volume 41 l", "Volume de la cavité 41 l", "Volume del vano 41 l"),
      T("Heißluft bis 230 °C", "Hot air up to 230 °C", "Air chaud jusqu’à 230 °C", "Aria calda fino a 230 °C"),
      T("Dampfbetrieb bis 100 °C", "Steam mode up to 100 °C", "Mode vapeur jusqu’à 100 °C", "Modalità vapore fino a 100 °C"),
      T("Einschubebenen 3", "Shelf levels 3", "Niveaux d’enfournement 3", "Livelli di inserimento 3"),
      T("Nennleistung 5,1 kW", "Rated power 5.1 kW", "Puissance nominale 5,1 kW", "Potenza nominale 5,1 kW"),
      T("Garantie laut Hersteller: 2 + 8 Jahre", "Warranty according to the manufacturer: 2 + 8 years", "Garantie selon le fabricant : 2 + 8 ans", "Garanzia secondo il produttore: 2 + 8 anni"),
      T("Daten für Art.-Nr. 2304100007; 6 Ausführungen auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 2304100007; 6 versions on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 2304100007 ; 6 versions sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 2304100007; 6 versioni su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "597 mm"), mass("hoehe", "454 mm"), mass("tiefe", "569 mm"), mass("nische", "B 560–580 mm · H 450 mm · T ≥ 560 mm")]),
    bilder: Object.freeze([
      bild("v-zug-combisteamer-v6000-45m-powersteam-1.webp", 1200, 1200, T("V-ZUG CombiSteamer V6000 45M PowerSteam: Gerät freigestellt von vorn, Design Spiegelglas Schwarz", "V-ZUG CombiSteamer V6000 45M PowerSteam: cut-out front view of the appliance, Spiegelglas Schwarz finish", "V-ZUG CombiSteamer V6000 45M PowerSteam : appareil détouré vu de face, finition Spiegelglas Schwarz", "V-ZUG CombiSteamer V6000 45M PowerSteam: apparecchio scontornato visto di fronte, finitura Spiegelglas Schwarz"), "https://www.vzug.com/at/de/produkte/kueche/steamer/combi-steamer/combisteamer-v6000-45m-powersteam--p2304100007"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "spiegelglas-pearl", name: "Spiegelglas Pearl" }),
          Object.freeze({ id: "spiegelglas-schwarz", name: "Spiegelglas Schwarz" }),
          Object.freeze({ id: "spiegelglas-platinum", name: "Spiegelglas Platinum" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/steamer/combi-steamer/combisteamer-v6000-45m-powersteam--p2304100007",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/steamer/combi-steamer/combisteamer-v6000-45m-powersteam--p2304100007"]),
    stand: STAND,
  }),
  // ---------------------------------------------------------------- mikrowelle
  Object.freeze({
    slug: "v-zug-combimiwell-v4000",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "mikrowelle",
    name: "CombiMiwell V4000",
    serie: "V4000",
    kurz: T("Einbau-Mikrowelle mit Grill und Umluft CombiMiwell V4000 für eine Nische mit Normbreite 60 cm und Normhöhe 45 cm. Erhältlich in 2 Designs; Ausführungen und Datenblatt beim Hersteller.", "Built-in microwave with grill and convection CombiMiwell V4000 for a niche with a standard width of 60 cm and height of 45 cm. Available in 2 finishes; versions and data sheet on the manufacturer’s website.", "Micro-ondes encastrable avec gril et chaleur tournante CombiMiwell V4000 pour une niche de largeur normalisée 60 cm et de hauteur 45 cm. Disponible en 2 finitions ; versions et fiche technique sur le site du fabricant.", "Microonde da incasso con grill e aria ventilata CombiMiwell V4000 per una nicchia di larghezza standard 60 cm e altezza 45 cm. Disponibile in 2 finiture; versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: Spiegelglas Schwarz · Spiegelglas Platinum", "Finishes: Spiegelglas Schwarz · Spiegelglas Platinum", "Finitions: Spiegelglas Schwarz · Spiegelglas Platinum", "Finiture: Spiegelglas Schwarz · Spiegelglas Platinum"),
      T("Garraum 44 l", "Cavity volume 44 l", "Volume de la cavité 44 l", "Volume del vano 44 l"),
      T("Nennleistung 3,6 kW", "Rated power 3.6 kW", "Puissance nominale 3,6 kW", "Potenza nominale 3,6 kW"),
      T("Garantie laut Hersteller: 2 + 8 Jahre", "Warranty according to the manufacturer: 2 + 8 years", "Garantie selon le fabricant : 2 + 8 ans", "Garanzia secondo il produttore: 2 + 8 anni"),
      T("Daten für Art.-Nr. 2402500008; 2 Ausführungen auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 2402500008; 2 versions on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 2402500008 ; 2 versions sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 2402500008; 2 versioni su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "597 mm"), mass("hoehe", "454 mm"), mass("tiefe", "566 mm"), mass("nische", "B 560–568 mm · H 450 mm · T ≥ 550 mm")]),
    bilder: Object.freeze([
      bild("v-zug-combimiwell-v4000-1.webp", 1200, 1200, T("V-ZUG CombiMiwell V4000: Gerät freigestellt von vorn, Design Spiegelglas Schwarz", "V-ZUG CombiMiwell V4000: cut-out front view of the appliance, Spiegelglas Schwarz finish", "V-ZUG CombiMiwell V4000 : appareil détouré vu de face, finition Spiegelglas Schwarz", "V-ZUG CombiMiwell V4000: apparecchio scontornato visto di fronte, finitura Spiegelglas Schwarz"), "https://www.vzug.com/at/de/produkte/kueche/mikrowellen/mikrowellen/combimiwell-v4000-45--p2402500008"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "spiegelglas-schwarz", name: "Spiegelglas Schwarz" }),
          Object.freeze({ id: "spiegelglas-platinum", name: "Spiegelglas Platinum" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/mikrowellen/mikrowellen/combimiwell-v4000-45--p2402500008",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/mikrowellen/mikrowellen/combimiwell-v4000-45--p2402500008"]),
    stand: STAND,
  }),
  // ---------------------------------------------------------------- kochfeld
  Object.freeze({
    slug: "v-zug-cooktop-teppan-yaki-i40",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "kochfeld",
    name: "CookTop Teppan Yaki I40",
    kurz: T("Modulares Kochfeld CookTop Teppan Yaki I40 mit Normbreite 40 cm. Ausführungen und Datenblatt beim Hersteller.", "Modular hob CookTop Teppan Yaki I40 with a standard width of 40 cm. Versions and data sheet on the manufacturer’s website.", "Table de cuisson modulaire CookTop Teppan Yaki I40 de largeur normalisée 40 cm. Versions et fiche technique sur le site du fabricant.", "Piano cottura modulare CookTop Teppan Yaki I40 di larghezza standard 40 cm. Versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: BlackDesign", "Finishes: BlackDesign", "Finitions: BlackDesign", "Finiture: BlackDesign"),
      T("Nennleistung 2,8 kW", "Rated power 2.8 kW", "Puissance nominale 2,8 kW", "Potenza nominale 2,8 kW"),
      T("Garantie laut Hersteller: 2 + 8 Jahre", "Warranty according to the manufacturer: 2 + 8 years", "Garantie selon le fabricant : 2 + 8 ans", "Garanzia secondo il produttore: 2 + 8 anni"),
      T("Daten für Art.-Nr. 3114000001; 1 Ausführung auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 3114000001; 1 version on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 3114000001 ; 1 version sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 3114000001; 1 versione su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "384 mm"), mass("hoehe", "64 mm"), mass("tiefe", "501 mm")]),
    bilder: Object.freeze([
      bild("v-zug-cooktop-teppan-yaki-i40-1.webp", 1200, 1200, T("V-ZUG CookTop Teppan Yaki I40: Gerät freigestellt von vorn, Design BlackDesign", "V-ZUG CookTop Teppan Yaki I40: cut-out front view of the appliance, BlackDesign finish", "V-ZUG CookTop Teppan Yaki I40 : appareil détouré vu de face, finition BlackDesign", "V-ZUG CookTop Teppan Yaki I40: apparecchio scontornato visto di fronte, finitura BlackDesign"), "https://www.vzug.com/at/de/produkte/kueche/kochfelder/modulare-kochfeldloesungen/cooktop-teppan-yaki-i40--p3114000001"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "blackdesign", name: "BlackDesign" }),
        ]),
      }),
    ]),
    zubehoer: Object.freeze([
      Object.freeze({ slug: "v-zug-cooktop-v4000-i302", hinweis: T("Laut Hersteller mit den anderen modularen Kochfeldern von V-ZUG kombinierbar", "According to the manufacturer, can be combined with the other V-ZUG modular hobs", "Selon le fabricant, combinable avec les autres tables de cuisson modulaires V-ZUG", "Secondo il produttore, combinabile con gli altri piani cottura modulari V-ZUG") }),
      Object.freeze({ slug: "v-zug-cooktop-v4000-i402", hinweis: T("Laut Hersteller mit den anderen modularen Kochfeldern von V-ZUG kombinierbar", "According to the manufacturer, can be combined with the other V-ZUG modular hobs", "Selon le fabricant, combinable avec les autres tables de cuisson modulaires V-ZUG", "Secondo il produttore, combinabile con gli altri piani cottura modulari V-ZUG") }),
      Object.freeze({ slug: "v-zug-gas411gsaz", hinweis: T("Laut Hersteller mit den anderen modularen Kochfeldern von V-ZUG kombinierbar", "According to the manufacturer, can be combined with the other V-ZUG modular hobs", "Selon le fabricant, combinable avec les autres tables de cuisson modulaires V-ZUG", "Secondo il produttore, combinabile con gli altri piani cottura modulari V-ZUG") }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/kochfelder/modulare-kochfeldloesungen/cooktop-teppan-yaki-i40--p3114000001",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/kochfelder/modulare-kochfeldloesungen/cooktop-teppan-yaki-i40--p3114000001"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "v-zug-cooktop-v2000-i604",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "kochfeld",
    name: "CookTop V2000 I604",
    serie: "V2000",
    kurz: T("Induktionskochfeld CookTop V2000 I604 mit Normbreite 60 cm. Erhältlich in 2 Designs; Ausführungen und Datenblatt beim Hersteller.", "Induction hob CookTop V2000 I604 with a standard width of 60 cm. Available in 2 finishes; versions and data sheet on the manufacturer’s website.", "Table de cuisson à induction CookTop V2000 I604 de largeur normalisée 60 cm. Disponible en 2 finitions ; versions et fiche technique sur le site du fabricant.", "Piano cottura a induzione CookTop V2000 I604 di larghezza standard 60 cm. Disponibile in 2 finiture; versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: BlackDesign · BlackDesignMatte", "Finishes: BlackDesign · BlackDesignMatte", "Finitions: BlackDesign · BlackDesignMatte", "Finiture: BlackDesign · BlackDesignMatte"),
      T("Nennleistung 7,4 kW", "Rated power 7.4 kW", "Puissance nominale 7,4 kW", "Potenza nominale 7,4 kW"),
      T("Garantie laut Hersteller: 2 + 8 Jahre", "Warranty according to the manufacturer: 2 + 8 years", "Garantie selon le fabricant : 2 + 8 ans", "Garanzia secondo il produttore: 2 + 8 anni"),
      T("Daten für Art.-Nr. 3118000002; 2 Ausführungen auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 3118000002; 2 versions on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 3118000002 ; 2 versions sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 3118000002; 2 versioni su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "571 mm"), mass("hoehe", "53 mm"), mass("tiefe", "501 mm")]),
    bilder: Object.freeze([
      bild("v-zug-cooktop-v2000-i604-1.webp", 1200, 1200, T("V-ZUG CookTop V2000 I604: Gerät freigestellt von vorn, Design BlackDesign", "V-ZUG CookTop V2000 I604: cut-out front view of the appliance, BlackDesign finish", "V-ZUG CookTop V2000 I604 : appareil détouré vu de face, finition BlackDesign", "V-ZUG CookTop V2000 I604: apparecchio scontornato visto di fronte, finitura BlackDesign"), "https://www.vzug.com/at/de/produkte/kueche/kochfelder/induktionskochfelder/cooktop-v2000-i604--p3118000002"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "blackdesign", name: "BlackDesign" }),
          Object.freeze({ id: "blackdesignmatte", name: "BlackDesignMatte" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/kochfelder/induktionskochfelder/cooktop-v2000-i604--p3118000002",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/kochfelder/induktionskochfelder/cooktop-v2000-i604--p3118000002"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "v-zug-cooktop-v2000-i804",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "kochfeld",
    name: "CookTop V2000 I804",
    serie: "V2000",
    kurz: T("Induktionskochfeld CookTop V2000 I804 mit Normbreite 80 cm. Ausführungen und Datenblatt beim Hersteller.", "Induction hob CookTop V2000 I804 with a standard width of 80 cm. Versions and data sheet on the manufacturer’s website.", "Table de cuisson à induction CookTop V2000 I804 de largeur normalisée 80 cm. Versions et fiche technique sur le site du fabricant.", "Piano cottura a induzione CookTop V2000 I804 di larghezza standard 80 cm. Versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: BlackDesignMatte", "Finishes: BlackDesignMatte", "Finitions: BlackDesignMatte", "Finiture: BlackDesignMatte"),
      T("Nennleistung 7,4 kW", "Rated power 7.4 kW", "Puissance nominale 7,4 kW", "Potenza nominale 7,4 kW"),
      T("Garantie laut Hersteller: 2 + 8 Jahre", "Warranty according to the manufacturer: 2 + 8 years", "Garantie selon le fabricant : 2 + 8 ans", "Garanzia secondo il produttore: 2 + 8 anni"),
      T("Daten für Art.-Nr. 3118200005; 1 Ausführung auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 3118200005; 1 version on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 3118200005 ; 1 version sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 3118200005; 1 versione su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "761 mm"), mass("hoehe", "53 mm"), mass("tiefe", "501 mm")]),
    bilder: Object.freeze([
      bild("v-zug-cooktop-v2000-i804-1.webp", 1200, 1200, T("V-ZUG CookTop V2000 I804: Gerät freigestellt von vorn, Design BlackDesignMatte", "V-ZUG CookTop V2000 I804: cut-out front view of the appliance, BlackDesignMatte finish", "V-ZUG CookTop V2000 I804 : appareil détouré vu de face, finition BlackDesignMatte", "V-ZUG CookTop V2000 I804: apparecchio scontornato visto di fronte, finitura BlackDesignMatte"), "https://www.vzug.com/at/de/produkte/kueche/kochfelder/induktionskochfelder/cooktop-v2000-i804--p3118200005"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "blackdesignmatte", name: "BlackDesignMatte" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/kochfelder/induktionskochfelder/cooktop-v2000-i804--p3118200005",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/kochfelder/induktionskochfelder/cooktop-v2000-i804--p3118200005"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "v-zug-cooktop-v4000-i302",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "kochfeld",
    name: "CookTop V4000 I302",
    serie: "V4000",
    kurz: T("Modulares Kochfeld CookTop V4000 I302 mit Normbreite 30 cm. Ausführungen und Datenblatt beim Hersteller.", "Modular hob CookTop V4000 I302 with a standard width of 30 cm. Versions and data sheet on the manufacturer’s website.", "Table de cuisson modulaire CookTop V4000 I302 de largeur normalisée 30 cm. Versions et fiche technique sur le site du fabricant.", "Piano cottura modulare CookTop V4000 I302 di larghezza standard 30 cm. Versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: BlackDesign", "Finishes: BlackDesign", "Finitions: BlackDesign", "Finiture: BlackDesign"),
      T("Nennleistung 3,7 kW", "Rated power 3.7 kW", "Puissance nominale 3,7 kW", "Potenza nominale 3,7 kW"),
      T("Garantie laut Hersteller: 2 + 8 Jahre", "Warranty according to the manufacturer: 2 + 8 years", "Garantie selon le fabricant : 2 + 8 ans", "Garanzia secondo il produttore: 2 + 8 anni"),
      T("Daten für Art.-Nr. 3114300001; 1 Ausführung auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 3114300001; 1 version on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 3114300001 ; 1 version sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 3114300001; 1 versione su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "281 mm"), mass("hoehe", "51.7 mm"), mass("tiefe", "501 mm")]),
    bilder: Object.freeze([
      bild("v-zug-cooktop-v4000-i302-1.webp", 1200, 1200, T("V-ZUG CookTop V4000 I302: Gerät freigestellt von vorn, Design BlackDesign", "V-ZUG CookTop V4000 I302: cut-out front view of the appliance, BlackDesign finish", "V-ZUG CookTop V4000 I302 : appareil détouré vu de face, finition BlackDesign", "V-ZUG CookTop V4000 I302: apparecchio scontornato visto di fronte, finitura BlackDesign"), "https://www.vzug.com/at/de/produkte/kueche/kochfelder/modulare-kochfeldloesungen/cooktop-v4000-i302--p3114300001"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "blackdesign", name: "BlackDesign" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/kochfelder/modulare-kochfeldloesungen/cooktop-v4000-i302--p3114300001",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/kochfelder/modulare-kochfeldloesungen/cooktop-v4000-i302--p3114300001"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "v-zug-cooktop-v4000-i402",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "kochfeld",
    name: "CookTop V4000 I402",
    serie: "V4000",
    kurz: T("Modulares Kochfeld CookTop V4000 I402 mit Normbreite 40 cm. Ausführungen und Datenblatt beim Hersteller.", "Modular hob CookTop V4000 I402 with a standard width of 40 cm. Versions and data sheet on the manufacturer’s website.", "Table de cuisson modulaire CookTop V4000 I402 de largeur normalisée 40 cm. Versions et fiche technique sur le site du fabricant.", "Piano cottura modulare CookTop V4000 I402 di larghezza standard 40 cm. Versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: BlackDesign", "Finishes: BlackDesign", "Finitions: BlackDesign", "Finiture: BlackDesign"),
      T("Nennleistung 3,7 kW", "Rated power 3.7 kW", "Puissance nominale 3,7 kW", "Potenza nominale 3,7 kW"),
      T("Garantie laut Hersteller: 2 + 8 Jahre", "Warranty according to the manufacturer: 2 + 8 years", "Garantie selon le fabricant : 2 + 8 ans", "Garanzia secondo il produttore: 2 + 8 anni"),
      T("Daten für Art.-Nr. 3114400001; 1 Ausführung auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 3114400001; 1 version on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 3114400001 ; 1 version sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 3114400001; 1 versione su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "384 mm"), mass("hoehe", "51.7 mm"), mass("tiefe", "501 mm")]),
    bilder: Object.freeze([
      bild("v-zug-cooktop-v4000-i402-1.webp", 1200, 1200, T("V-ZUG CookTop V4000 I402: Gerät freigestellt von vorn, Design BlackDesign", "V-ZUG CookTop V4000 I402: cut-out front view of the appliance, BlackDesign finish", "V-ZUG CookTop V4000 I402 : appareil détouré vu de face, finition BlackDesign", "V-ZUG CookTop V4000 I402: apparecchio scontornato visto di fronte, finitura BlackDesign"), "https://www.vzug.com/at/de/produkte/kueche/kochfelder/modulare-kochfeldloesungen/cooktop-v4000-i402--p3114400001"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "blackdesign", name: "BlackDesign" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/kochfelder/modulare-kochfeldloesungen/cooktop-v4000-i402--p3114400001",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/kochfelder/modulare-kochfeldloesungen/cooktop-v4000-i402--p3114400001"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "v-zug-cooktop-v4000-i604",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "kochfeld",
    name: "CookTop V4000 I604",
    serie: "V4000",
    kurz: T("Induktionskochfeld CookTop V4000 I604 mit Normbreite 60 cm. Ausführungen und Datenblatt beim Hersteller.", "Induction hob CookTop V4000 I604 with a standard width of 60 cm. Versions and data sheet on the manufacturer’s website.", "Table de cuisson à induction CookTop V4000 I604 de largeur normalisée 60 cm. Versions et fiche technique sur le site du fabricant.", "Piano cottura a induzione CookTop V4000 I604 di larghezza standard 60 cm. Versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: BlackDesign", "Finishes: BlackDesign", "Finitions: BlackDesign", "Finiture: BlackDesign"),
      T("Nennleistung 7,4 kW", "Rated power 7.4 kW", "Puissance nominale 7,4 kW", "Potenza nominale 7,4 kW"),
      T("Garantie laut Hersteller: 2 + 8 Jahre", "Warranty according to the manufacturer: 2 + 8 years", "Garantie selon le fabricant : 2 + 8 ans", "Garanzia secondo il produttore: 2 + 8 anni"),
      T("Daten für Art.-Nr. 3111500010; 2 Ausführungen auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 3111500010; 2 versions on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 3111500010 ; 2 versions sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 3111500010; 2 versioni su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "571 mm"), mass("hoehe", "51.7 mm"), mass("tiefe", "501 mm")]),
    bilder: Object.freeze([
      bild("v-zug-cooktop-v4000-i604-1.webp", 1200, 1200, T("V-ZUG CookTop V4000 I604: Gerät freigestellt von vorn, Design BlackDesign", "V-ZUG CookTop V4000 I604: cut-out front view of the appliance, BlackDesign finish", "V-ZUG CookTop V4000 I604 : appareil détouré vu de face, finition BlackDesign", "V-ZUG CookTop V4000 I604: apparecchio scontornato visto di fronte, finitura BlackDesign"), "https://www.vzug.com/at/de/produkte/kueche/kochfelder/induktionskochfelder/cooktop-v4000-i604--p3111500010"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "blackdesign", name: "BlackDesign" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/kochfelder/induktionskochfelder/cooktop-v4000-i604--p3111500010",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/kochfelder/induktionskochfelder/cooktop-v4000-i604--p3111500010"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "v-zug-cooktop-v4000-i804",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "kochfeld",
    name: "CookTop V4000 I804",
    serie: "V4000",
    kurz: T("Induktionskochfeld CookTop V4000 I804 mit Normbreite 80 cm. Ausführungen und Datenblatt beim Hersteller.", "Induction hob CookTop V4000 I804 with a standard width of 80 cm. Versions and data sheet on the manufacturer’s website.", "Table de cuisson à induction CookTop V4000 I804 de largeur normalisée 80 cm. Versions et fiche technique sur le site du fabricant.", "Piano cottura a induzione CookTop V4000 I804 di larghezza standard 80 cm. Versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: BlackDesign", "Finishes: BlackDesign", "Finitions: BlackDesign", "Finiture: BlackDesign"),
      T("Nennleistung 7,4 kW", "Rated power 7.4 kW", "Puissance nominale 7,4 kW", "Potenza nominale 7,4 kW"),
      T("Garantie laut Hersteller: 2 + 8 Jahre", "Warranty according to the manufacturer: 2 + 8 years", "Garantie selon le fabricant : 2 + 8 ans", "Garanzia secondo il produttore: 2 + 8 anni"),
      T("Daten für Art.-Nr. 3115800001; 1 Ausführung auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 3115800001; 1 version on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 3115800001 ; 1 version sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 3115800001; 1 versione su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "761 mm"), mass("hoehe", "52 mm"), mass("tiefe", "501 mm")]),
    bilder: Object.freeze([
      bild("v-zug-cooktop-v4000-i804-1.webp", 1200, 1200, T("V-ZUG CookTop V4000 I804: Gerät freigestellt von vorn, Design BlackDesign", "V-ZUG CookTop V4000 I804: cut-out front view of the appliance, BlackDesign finish", "V-ZUG CookTop V4000 I804 : appareil détouré vu de face, finition BlackDesign", "V-ZUG CookTop V4000 I804: apparecchio scontornato visto di fronte, finitura BlackDesign"), "https://www.vzug.com/at/de/produkte/kueche/kochfelder/induktionskochfelder/cooktop-v4000-i804--p3115800001"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "blackdesign", name: "BlackDesign" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/kochfelder/induktionskochfelder/cooktop-v4000-i804--p3115800001",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/kochfelder/induktionskochfelder/cooktop-v4000-i804--p3115800001"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "v-zug-cooktop-v4000-i904",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "kochfeld",
    name: "CookTop V4000 I904",
    serie: "V4000",
    kurz: T("Induktionskochfeld CookTop V4000 I904 mit Normbreite 90 cm. Ausführungen und Datenblatt beim Hersteller.", "Induction hob CookTop V4000 I904 with a standard width of 90 cm. Versions and data sheet on the manufacturer’s website.", "Table de cuisson à induction CookTop V4000 I904 de largeur normalisée 90 cm. Versions et fiche technique sur le site du fabricant.", "Piano cottura a induzione CookTop V4000 I904 di larghezza standard 90 cm. Versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: BlackDesign", "Finishes: BlackDesign", "Finitions: BlackDesign", "Finiture: BlackDesign"),
      T("Nennleistung 7,4 kW", "Rated power 7.4 kW", "Puissance nominale 7,4 kW", "Potenza nominale 7,4 kW"),
      T("Garantie laut Hersteller: 2 + 8 Jahre", "Warranty according to the manufacturer: 2 + 8 years", "Garantie selon le fabricant : 2 + 8 ans", "Garanzia secondo il produttore: 2 + 8 anni"),
      T("Daten für Art.-Nr. 3114200001; 1 Ausführung auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 3114200001; 1 version on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 3114200001 ; 1 version sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 3114200001; 1 versione su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "880 mm"), mass("hoehe", "51 mm"), mass("tiefe", "380 mm")]),
    bilder: Object.freeze([
      bild("v-zug-cooktop-v4000-i904-1.webp", 1200, 1200, T("V-ZUG CookTop V4000 I904: Gerät freigestellt von vorn, Design BlackDesign", "V-ZUG CookTop V4000 I904: cut-out front view of the appliance, BlackDesign finish", "V-ZUG CookTop V4000 I904 : appareil détouré vu de face, finition BlackDesign", "V-ZUG CookTop V4000 I904: apparecchio scontornato visto di fronte, finitura BlackDesign"), "https://www.vzug.com/at/de/produkte/kueche/kochfelder/induktionskochfelder/cooktop-v4000-i904--p3114200001"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "blackdesign", name: "BlackDesign" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/kochfelder/induktionskochfelder/cooktop-v4000-i904--p3114200001",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/kochfelder/induktionskochfelder/cooktop-v4000-i904--p3114200001"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "v-zug-cooktop-v6000-i705-fullflex",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "kochfeld",
    name: "CookTop V6000 I705 FullFlex",
    serie: "V6000",
    kurz: T("Induktionskochfeld CookTop V6000 I705 FullFlex mit Normbreite 70 cm. Erhältlich in 3 Designs; Ausführungen und Datenblatt beim Hersteller.", "Induction hob CookTop V6000 I705 FullFlex with a standard width of 70 cm. Available in 3 finishes; versions and data sheet on the manufacturer’s website.", "Table de cuisson à induction CookTop V6000 I705 FullFlex de largeur normalisée 70 cm. Disponible en 3 finitions ; versions et fiche technique sur le site du fabricant.", "Piano cottura a induzione CookTop V6000 I705 FullFlex di larghezza standard 70 cm. Disponibile in 3 finiture; versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: Pearl · Platinum · Schwarz", "Finishes: Pearl · Platinum · Schwarz", "Finitions: Pearl · Platinum · Schwarz", "Finiture: Pearl · Platinum · Schwarz"),
      T("Nennleistung 7,4 kW", "Rated power 7.4 kW", "Puissance nominale 7,4 kW", "Potenza nominale 7,4 kW"),
      T("Garantie laut Hersteller: 2 + 8 Jahre", "Warranty according to the manufacturer: 2 + 8 years", "Garantie selon le fabricant : 2 + 8 ans", "Garanzia secondo il produttore: 2 + 8 anni"),
      T("Daten für Art.-Nr. 3113200008; 3 Ausführungen auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 3113200008; 3 versions on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 3113200008 ; 3 versions sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 3113200008; 3 versioni su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "691 mm"), mass("hoehe", "76 mm"), mass("tiefe", "501 mm")]),
    bilder: Object.freeze([
      bild("v-zug-cooktop-v6000-i705-fullflex-1.webp", 1200, 1200, T("V-ZUG CookTop V6000 I705 FullFlex: Gerät freigestellt von vorn, Design Schwarz", "V-ZUG CookTop V6000 I705 FullFlex: cut-out front view of the appliance, Schwarz finish", "V-ZUG CookTop V6000 I705 FullFlex : appareil détouré vu de face, finition Schwarz", "V-ZUG CookTop V6000 I705 FullFlex: apparecchio scontornato visto di fronte, finitura Schwarz"), "https://www.vzug.com/at/de/produkte/kueche/kochfelder/induktionskochfelder/cooktop-v6000-i705-fullflex--p3113200008"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "pearl", name: "Pearl" }),
          Object.freeze({ id: "platinum", name: "Platinum" }),
          Object.freeze({ id: "schwarz", name: "Schwarz" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/kochfelder/induktionskochfelder/cooktop-v6000-i705-fullflex--p3113200008",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/kochfelder/induktionskochfelder/cooktop-v6000-i705-fullflex--p3113200008"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "v-zug-cooktop-v6000-i905",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "kochfeld",
    name: "CookTop V6000 I905",
    serie: "V6000",
    kurz: T("Induktionskochfeld CookTop V6000 I905 mit Normbreite 90 cm. Ausführungen und Datenblatt beim Hersteller.", "Induction hob CookTop V6000 I905 with a standard width of 90 cm. Versions and data sheet on the manufacturer’s website.", "Table de cuisson à induction CookTop V6000 I905 de largeur normalisée 90 cm. Versions et fiche technique sur le site du fabricant.", "Piano cottura a induzione CookTop V6000 I905 di larghezza standard 90 cm. Versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: BlackDesign", "Finishes: BlackDesign", "Finitions: BlackDesign", "Finiture: BlackDesign"),
      T("Nennleistung 11,1 kW", "Rated power 11.1 kW", "Puissance nominale 11,1 kW", "Potenza nominale 11,1 kW"),
      T("Garantie laut Hersteller: 2 + 8 Jahre", "Warranty according to the manufacturer: 2 + 8 years", "Garantie selon le fabricant : 2 + 8 ans", "Garanzia secondo il produttore: 2 + 8 anni"),
      T("Daten für Art.-Nr. 3111400008; 1 Ausführung auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 3111400008; 1 version on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 3111400008 ; 1 version sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 3111400008; 1 versione su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "897 mm"), mass("hoehe", "53.3 mm"), mass("tiefe", "501 mm")]),
    bilder: Object.freeze([
      bild("v-zug-cooktop-v6000-i905-1.webp", 1200, 1200, T("V-ZUG CookTop V6000 I905: Gerät freigestellt von vorn, Design BlackDesign", "V-ZUG CookTop V6000 I905: cut-out front view of the appliance, BlackDesign finish", "V-ZUG CookTop V6000 I905 : appareil détouré vu de face, finition BlackDesign", "V-ZUG CookTop V6000 I905: apparecchio scontornato visto di fronte, finitura BlackDesign"), "https://www.vzug.com/at/de/produkte/kueche/kochfelder/induktionskochfelder/cooktopinduktion-v6000--p3111400008"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "blackdesign", name: "BlackDesign" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/kochfelder/induktionskochfelder/cooktopinduktion-v6000--p3111400008",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/kochfelder/induktionskochfelder/cooktopinduktion-v6000--p3111400008"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "v-zug-cooktop-v6000-i906-fullflex",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "kochfeld",
    name: "CookTop V6000 I906 FullFlex",
    serie: "V6000",
    kurz: T("Induktionskochfeld CookTop V6000 I906 FullFlex mit Normbreite 90 cm. Erhältlich in 3 Designs; Ausführungen und Datenblatt beim Hersteller.", "Induction hob CookTop V6000 I906 FullFlex with a standard width of 90 cm. Available in 3 finishes; versions and data sheet on the manufacturer’s website.", "Table de cuisson à induction CookTop V6000 I906 FullFlex de largeur normalisée 90 cm. Disponible en 3 finitions ; versions et fiche technique sur le site du fabricant.", "Piano cottura a induzione CookTop V6000 I906 FullFlex di larghezza standard 90 cm. Disponibile in 3 finiture; versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: Pearl · Platinum · Schwarz", "Finishes: Pearl · Platinum · Schwarz", "Finitions: Pearl · Platinum · Schwarz", "Finiture: Pearl · Platinum · Schwarz"),
      T("Nennleistung 11,1 kW", "Rated power 11.1 kW", "Puissance nominale 11,1 kW", "Potenza nominale 11,1 kW"),
      T("Garantie laut Hersteller: 2 + 8 Jahre", "Warranty according to the manufacturer: 2 + 8 years", "Garantie selon le fabricant : 2 + 8 ans", "Garanzia secondo il produttore: 2 + 8 anni"),
      T("Daten für Art.-Nr. 3113400009; 3 Ausführungen auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 3113400009; 3 versions on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 3113400009 ; 3 versions sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 3113400009; 3 versioni su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "897 mm"), mass("hoehe", "76 mm"), mass("tiefe", "501 mm")]),
    bilder: Object.freeze([
      bild("v-zug-cooktop-v6000-i906-fullflex-1.webp", 1200, 1200, T("V-ZUG CookTop V6000 I906 FullFlex: Gerät freigestellt von vorn, Design Schwarz", "V-ZUG CookTop V6000 I906 FullFlex: cut-out front view of the appliance, Schwarz finish", "V-ZUG CookTop V6000 I906 FullFlex : appareil détouré vu de face, finition Schwarz", "V-ZUG CookTop V6000 I906 FullFlex: apparecchio scontornato visto di fronte, finitura Schwarz"), "https://www.vzug.com/at/de/produkte/kueche/kochfelder/induktionskochfelder/cooktop-v6000-i906-fullflex--p3113400009"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "pearl", name: "Pearl" }),
          Object.freeze({ id: "platinum", name: "Platinum" }),
          Object.freeze({ id: "schwarz", name: "Schwarz" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/kochfelder/induktionskochfelder/cooktop-v6000-i906-fullflex--p3113400009",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/kochfelder/induktionskochfelder/cooktop-v6000-i906-fullflex--p3113400009"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "v-zug-gas411gsaz",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "kochfeld",
    name: "GAS411GSAZ",
    kurz: T("Modulares Kochfeld GAS411GSAZ mit Normbreite 40 cm. Ausführungen und Datenblatt beim Hersteller.", "Modular hob GAS411GSAZ with a standard width of 40 cm. Versions and data sheet on the manufacturer’s website.", "Table de cuisson modulaire GAS411GSAZ de largeur normalisée 40 cm. Versions et fiche technique sur le site du fabricant.", "Piano cottura modulare GAS411GSAZ di larghezza standard 40 cm. Versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: BlackDesign", "Finishes: BlackDesign", "Finitions: BlackDesign", "Finiture: BlackDesign"),
      T("Daten für Art.-Nr. 3106360115; 1 Ausführung auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 3106360115; 1 version on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 3106360115 ; 1 version sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 3106360115; 1 versione su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "384 mm"), mass("hoehe", "171 mm"), mass("tiefe", "501 mm")]),
    bilder: Object.freeze([
      bild("v-zug-gas411gsaz-1.webp", 1200, 1200, T("V-ZUG GAS411GSAZ: Gerät freigestellt von vorn, Design BlackDesign", "V-ZUG GAS411GSAZ: cut-out front view of the appliance, BlackDesign finish", "V-ZUG GAS411GSAZ : appareil détouré vu de face, finition BlackDesign", "V-ZUG GAS411GSAZ: apparecchio scontornato visto di fronte, finitura BlackDesign"), "https://www.vzug.com/at/de/produkte/kueche/kochfelder/modulare-kochfeldloesungen/gas411gsaz--p3106360115"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "blackdesign", name: "BlackDesign" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/kochfelder/modulare-kochfeldloesungen/gas411gsaz--p3106360115",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/kochfelder/modulare-kochfeldloesungen/gas411gsaz--p3106360115"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "v-zug-gas421gsaz",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "kochfeld",
    name: "GAS421GSAZ",
    kurz: T("Gaskochfeld GAS421GSAZ mit Normbreite 40 cm. Ausführungen und Datenblatt beim Hersteller.", "Gas hob GAS421GSAZ with a standard width of 40 cm. Versions and data sheet on the manufacturer’s website.", "Table de cuisson au gaz GAS421GSAZ de largeur normalisée 40 cm. Versions et fiche technique sur le site du fabricant.", "Piano cottura a gas GAS421GSAZ di larghezza standard 40 cm. Versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: BlackDesign", "Finishes: BlackDesign", "Finitions: BlackDesign", "Finiture: BlackDesign"),
      T("Daten für Art.-Nr. 3106460215; 1 Ausführung auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 3106460215; 1 version on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 3106460215 ; 1 version sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 3106460215; 1 versione su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "384 mm"), mass("hoehe", "145 mm"), mass("tiefe", "501 mm")]),
    bilder: Object.freeze([
      bild("v-zug-gas421gsaz-1.webp", 1200, 1200, T("V-ZUG GAS421GSAZ: Gerät freigestellt von vorn, Design BlackDesign", "V-ZUG GAS421GSAZ: cut-out front view of the appliance, BlackDesign finish", "V-ZUG GAS421GSAZ : appareil détouré vu de face, finition BlackDesign", "V-ZUG GAS421GSAZ: apparecchio scontornato visto di fronte, finitura BlackDesign"), "https://www.vzug.com/at/de/produkte/kueche/kochfelder/gaskochfelder/gas421gsaz--p3106460215"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "blackdesign", name: "BlackDesign" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/kochfelder/gaskochfelder/gas421gsaz--p3106460215",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/kochfelder/gaskochfelder/gas421gsaz--p3106460215"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "v-zug-gas641gsaz",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "kochfeld",
    name: "GAS641GSAZ",
    kurz: T("Gaskochfeld GAS641GSAZ mit Normbreite 60 cm. Ausführungen und Datenblatt beim Hersteller.", "Gas hob GAS641GSAZ with a standard width of 60 cm. Versions and data sheet on the manufacturer’s website.", "Table de cuisson au gaz GAS641GSAZ de largeur normalisée 60 cm. Versions et fiche technique sur le site du fabricant.", "Piano cottura a gas GAS641GSAZ di larghezza standard 60 cm. Versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: BlackDesign", "Finishes: BlackDesign", "Finitions: BlackDesign", "Finiture: BlackDesign"),
      T("Daten für Art.-Nr. 3107160415; 1 Ausführung auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 3107160415; 1 version on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 3107160415 ; 1 version sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 3107160415; 1 versione su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "571 mm"), mass("hoehe", "145 mm"), mass("tiefe", "501 mm")]),
    bilder: Object.freeze([
      bild("v-zug-gas641gsaz-1.webp", 1200, 1200, T("V-ZUG GAS641GSAZ: Gerät freigestellt von vorn, Design BlackDesign", "V-ZUG GAS641GSAZ: cut-out front view of the appliance, BlackDesign finish", "V-ZUG GAS641GSAZ : appareil détouré vu de face, finition BlackDesign", "V-ZUG GAS641GSAZ: apparecchio scontornato visto di fronte, finitura BlackDesign"), "https://www.vzug.com/at/de/produkte/kueche/kochfelder/gaskochfelder/gas641gsaz--p3107160415"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "blackdesign", name: "BlackDesign" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/kochfelder/gaskochfelder/gas641gsaz--p3107160415",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/kochfelder/gaskochfelder/gas641gsaz--p3107160415"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "v-zug-gas951gsaz",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "kochfeld",
    name: "GAS951GSAZ",
    kurz: T("Gaskochfeld GAS951GSAZ mit Normbreite 90 cm. Ausführungen und Datenblatt beim Hersteller.", "Gas hob GAS951GSAZ with a standard width of 90 cm. Versions and data sheet on the manufacturer’s website.", "Table de cuisson au gaz GAS951GSAZ de largeur normalisée 90 cm. Versions et fiche technique sur le site du fabricant.", "Piano cottura a gas GAS951GSAZ di larghezza standard 90 cm. Versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: BlackDesign", "Finishes: BlackDesign", "Finitions: BlackDesign", "Finiture: BlackDesign"),
      T("Daten für Art.-Nr. 3107260515; 1 Ausführung auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 3107260515; 1 version on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 3107260515 ; 1 version sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 3107260515; 1 versione su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "897 mm"), mass("hoehe", "171 mm"), mass("tiefe", "501 mm")]),
    bilder: Object.freeze([
      bild("v-zug-gas951gsaz-1.webp", 1200, 1200, T("V-ZUG GAS951GSAZ: Gerät freigestellt von vorn, Design BlackDesign", "V-ZUG GAS951GSAZ: cut-out front view of the appliance, BlackDesign finish", "V-ZUG GAS951GSAZ : appareil détouré vu de face, finition BlackDesign", "V-ZUG GAS951GSAZ: apparecchio scontornato visto di fronte, finitura BlackDesign"), "https://www.vzug.com/at/de/produkte/kueche/kochfelder/gaskochfelder/gas951gsaz--p3107260515"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "blackdesign", name: "BlackDesign" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/kochfelder/gaskochfelder/gas951gsaz--p3107260515",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/kochfelder/gaskochfelder/gas951gsaz--p3107260515"]),
    stand: STAND,
  }),
  // ---------------------------------------------------------------- kochfeld-mit-abzug
  Object.freeze({
    slug: "v-zug-combicooktop-v2000-i604",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "kochfeld-mit-abzug",
    name: "CombiCookTop V2000 I604",
    serie: "V2000",
    kurz: T("Induktionskochfeld mit integriertem Dunstabzug CombiCookTop V2000 I604 mit Normbreite 60 cm. Erhältlich in 2 Designs; Ausführungen und Datenblatt beim Hersteller.", "Induction hob with integrated extractor CombiCookTop V2000 I604 with a standard width of 60 cm. Available in 2 finishes; versions and data sheet on the manufacturer’s website.", "Table à induction avec hotte intégrée CombiCookTop V2000 I604 de largeur normalisée 60 cm. Disponible en 2 finitions ; versions et fiche technique sur le site du fabricant.", "Piano a induzione con aspirazione integrata CombiCookTop V2000 I604 di larghezza standard 60 cm. Disponibile in 2 finiture; versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: BlackDesign · BlackDesignMatte", "Finishes: BlackDesign · BlackDesignMatte", "Finitions: BlackDesign · BlackDesignMatte", "Finiture: BlackDesign · BlackDesignMatte"),
      T("Nennleistung 7,4 kW", "Rated power 7.4 kW", "Puissance nominale 7,4 kW", "Potenza nominale 7,4 kW"),
      T("Energieeffizienzklasse B", "Energy efficiency class B", "Classe d’efficacité énergétique B", "Classe di efficienza energetica B"),
      T("Garantie laut Hersteller: 2 + 8 Jahre", "Warranty according to the manufacturer: 2 + 8 years", "Garantie selon le fabricant : 2 + 8 ans", "Garanzia secondo il produttore: 2 + 8 anni"),
      T("Daten für Art.-Nr. 3117500001; 6 Ausführungen auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 3117500001; 6 versions on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 3117500001 ; 6 versions sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 3117500001; 6 versioni su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "571 mm"), mass("hoehe", "242 mm"), mass("tiefe", "501 mm")]),
    bilder: Object.freeze([
      bild("v-zug-combicooktop-v2000-i604-1.webp", 1200, 1200, T("V-ZUG CombiCookTop V2000 I604: Gerät freigestellt von vorn", "V-ZUG CombiCookTop V2000 I604: cut-out front view of the appliance", "V-ZUG CombiCookTop V2000 I604 : appareil détouré vu de face", "V-ZUG CombiCookTop V2000 I604: apparecchio scontornato visto di fronte"), "https://www.vzug.com/at/de/produkte/kueche/kochfelder/induktionskochfelder-mit-integriertem-dunstabzug/combicooktop-v2000-i604--pV3117500001_Abluft"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "blackdesign", name: "BlackDesign" }),
          Object.freeze({ id: "blackdesignmatte", name: "BlackDesignMatte" }),
        ]),
      }),
      Object.freeze({
        gruppe: T("Betriebsart", "Operating mode", "Mode de fonctionnement", "Modalità di funzionamento"),
        optionen: Object.freeze([
          Object.freeze({ id: "abluft", name: T("Abluft", "Extraction", "Évacuation", "Aspirazione"), code: "V3117500001 / V3117500005" }),
          Object.freeze({ id: "umluft-longlife", name: T("Umluft · Longlife", "Recirculation · Longlife", "Recyclage · Longlife", "Ricircolo · Longlife"), code: "V3117500001 / V3117500005" }),
          Object.freeze({ id: "umluft-standard", name: T("Umluft · Standard", "Recirculation · Standard", "Recyclage · Standard", "Ricircolo · Standard"), code: "V3117500001 / V3117500005" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/kochfelder/induktionskochfelder-mit-integriertem-dunstabzug/combicooktop-v2000-i604--pV3117500001_Abluft",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/kochfelder/induktionskochfelder-mit-integriertem-dunstabzug/combicooktop-v2000-i604--pV3117500001_Abluft"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "v-zug-combicooktop-v2000-i804",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "kochfeld-mit-abzug",
    name: "CombiCookTop V2000 I804",
    serie: "V2000",
    kurz: T("Induktionskochfeld mit integriertem Dunstabzug CombiCookTop V2000 I804 mit Normbreite 80 cm. Ausführungen und Datenblatt beim Hersteller.", "Induction hob with integrated extractor CombiCookTop V2000 I804 with a standard width of 80 cm. Versions and data sheet on the manufacturer’s website.", "Table à induction avec hotte intégrée CombiCookTop V2000 I804 de largeur normalisée 80 cm. Versions et fiche technique sur le site du fabricant.", "Piano a induzione con aspirazione integrata CombiCookTop V2000 I804 di larghezza standard 80 cm. Versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: BlackDesign", "Finishes: BlackDesign", "Finitions: BlackDesign", "Finiture: BlackDesign"),
      T("Nennleistung 7,4 kW", "Rated power 7.4 kW", "Puissance nominale 7,4 kW", "Potenza nominale 7,4 kW"),
      T("Energieeffizienzklasse A", "Energy efficiency class A", "Classe d’efficacité énergétique A", "Classe di efficienza energetica A"),
      T("Garantie laut Hersteller: 2 + 8 Jahre", "Warranty according to the manufacturer: 2 + 8 years", "Garantie selon le fabricant : 2 + 8 ans", "Garanzia secondo il produttore: 2 + 8 anni"),
      T("Daten für Art.-Nr. 3109500001; 1 Ausführung auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 3109500001; 1 version on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 3109500001 ; 1 version sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 3109500001; 1 versione su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "761 mm"), mass("hoehe", "206 mm"), mass("tiefe", "501 mm")]),
    bilder: Object.freeze([
      bild("v-zug-combicooktop-v2000-i804-1.webp", 1200, 1200, T("V-ZUG CombiCookTop V2000 I804: Gerät freigestellt von vorn, Design BlackDesign", "V-ZUG CombiCookTop V2000 I804: cut-out front view of the appliance, BlackDesign finish", "V-ZUG CombiCookTop V2000 I804 : appareil détouré vu de face, finition BlackDesign", "V-ZUG CombiCookTop V2000 I804: apparecchio scontornato visto di fronte, finitura BlackDesign"), "https://www.vzug.com/at/de/produkte/kueche/kochfelder/induktionskochfelder-mit-integriertem-dunstabzug/combicooktop-v2000-i804--p3109500001"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "blackdesign", name: "BlackDesign" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/kochfelder/induktionskochfelder-mit-integriertem-dunstabzug/combicooktop-v2000-i804--p3109500001",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/kochfelder/induktionskochfelder-mit-integriertem-dunstabzug/combicooktop-v2000-i804--p3109500001"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "v-zug-combicooktop-v4000-i804",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "kochfeld-mit-abzug",
    name: "CombiCookTop V4000 I804",
    serie: "V4000",
    kurz: T("Induktionskochfeld mit integriertem Dunstabzug CombiCookTop V4000 I804 mit Normbreite 80 cm. Ausführungen und Datenblatt beim Hersteller.", "Induction hob with integrated extractor CombiCookTop V4000 I804 with a standard width of 80 cm. Versions and data sheet on the manufacturer’s website.", "Table à induction avec hotte intégrée CombiCookTop V4000 I804 de largeur normalisée 80 cm. Versions et fiche technique sur le site du fabricant.", "Piano a induzione con aspirazione integrata CombiCookTop V4000 I804 di larghezza standard 80 cm. Versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: BlackDesign", "Finishes: BlackDesign", "Finitions: BlackDesign", "Finiture: BlackDesign"),
      T("Nennleistung 7,4 kW", "Rated power 7.4 kW", "Puissance nominale 7,4 kW", "Potenza nominale 7,4 kW"),
      T("Energieeffizienzklasse A", "Energy efficiency class A", "Classe d’efficacité énergétique A", "Classe di efficienza energetica A"),
      T("Garantie laut Hersteller: 2 + 8 Jahre", "Warranty according to the manufacturer: 2 + 8 years", "Garantie selon le fabricant : 2 + 8 ans", "Garanzia secondo il produttore: 2 + 8 anni"),
      T("Daten für Art.-Nr. 3109600001; 1 Ausführung auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 3109600001; 1 version on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 3109600001 ; 1 version sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 3109600001; 1 versione su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "761 mm"), mass("hoehe", "206 mm"), mass("tiefe", "501 mm")]),
    bilder: Object.freeze([
      bild("v-zug-combicooktop-v4000-i804-1.webp", 1200, 1200, T("V-ZUG CombiCookTop V4000 I804: Gerät freigestellt von vorn, Design BlackDesign", "V-ZUG CombiCookTop V4000 I804: cut-out front view of the appliance, BlackDesign finish", "V-ZUG CombiCookTop V4000 I804 : appareil détouré vu de face, finition BlackDesign", "V-ZUG CombiCookTop V4000 I804: apparecchio scontornato visto di fronte, finitura BlackDesign"), "https://www.vzug.com/at/de/produkte/kueche/kochfelder/induktionskochfelder-mit-integriertem-dunstabzug/combicooktop-v4000-i804--p3109600001"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "blackdesign", name: "BlackDesign" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/kochfelder/induktionskochfelder-mit-integriertem-dunstabzug/combicooktop-v4000-i804--p3109600001",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/kochfelder/induktionskochfelder-mit-integriertem-dunstabzug/combicooktop-v4000-i804--p3109600001"]),
    stand: STAND,
  }),
  // ---------------------------------------------------------------- dunstabzug
  Object.freeze({
    slug: "v-zug-airocleareinbau-v4000",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "dunstabzug",
    name: "AiroClearEinbau V4000",
    serie: "V4000",
    kurz: T("Integrierte Dunstabzugshaube AiroClearEinbau V4000 mit Normbreite 60 cm. Ausführungen und Datenblatt beim Hersteller.", "Integrated cooker hood AiroClearEinbau V4000 with a standard width of 60 cm. Versions and data sheet on the manufacturer’s website.", "Hotte intégrée AiroClearEinbau V4000 de largeur normalisée 60 cm. Versions et fiche technique sur le site du fabricant.", "Cappa integrata AiroClearEinbau V4000 di larghezza standard 60 cm. Versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: ChromeClass", "Finishes: ChromeClass", "Finitions: ChromeClass", "Finiture: ChromeClass"),
      T("Nennleistung 0,269 kW", "Rated power 0.269 kW", "Puissance nominale 0,269 kW", "Potenza nominale 0,269 kW"),
      T("Energieeffizienzklasse A", "Energy efficiency class A", "Classe d’efficacité énergétique A", "Classe di efficienza energetica A"),
      T("Daten für Art.-Nr. 6400900001; 4 Ausführungen auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 6400900001; 4 versions on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 6400900001 ; 4 versions sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 6400900001; 4 versioni su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "560 mm"), mass("hoehe", "485 mm"), mass("tiefe", "320 mm")]),
    bilder: Object.freeze([
      bild("v-zug-airocleareinbau-v4000-1.webp", 1200, 1200, T("V-ZUG AiroClearEinbau V4000: Gerät freigestellt von vorn, Design ChromeClass", "V-ZUG AiroClearEinbau V4000: cut-out front view of the appliance, ChromeClass finish", "V-ZUG AiroClearEinbau V4000 : appareil détouré vu de face, finition ChromeClass", "V-ZUG AiroClearEinbau V4000: apparecchio scontornato visto di fronte, finitura ChromeClass"), "https://www.vzug.com/at/de/produkte/kueche/dunstabzuege/integrierte-dunstabzugshauben/airocleareinbau-v4000--pV6400900001_Abluft"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "chromeclass", name: "ChromeClass" }),
        ]),
      }),
      Object.freeze({
        gruppe: T("Betriebsart", "Operating mode", "Mode de fonctionnement", "Modalità di funzionamento"),
        optionen: Object.freeze([
          Object.freeze({ id: "abluft", name: T("Abluft", "Extraction", "Évacuation", "Aspirazione"), code: "V6400900001 / V6401000001" }),
          Object.freeze({ id: "umluft-longlife", name: T("Umluft · Longlife", "Recirculation · Longlife", "Recyclage · Longlife", "Ricircolo · Longlife"), code: "V6400900001 / V6401000001" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/dunstabzuege/integrierte-dunstabzugshauben/airocleareinbau-v4000--pV6400900001_Abluft",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/dunstabzuege/integrierte-dunstabzugshauben/airocleareinbau-v4000--pV6400900001_Abluft"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "v-zug-airocleareinbau-v6000",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "dunstabzug",
    name: "AiroClearEinbau V6000",
    serie: "V6000",
    kurz: T("Integrierte Dunstabzugshaube AiroClearEinbau V6000 mit Normbreite 60 cm. Ausführungen und Datenblatt beim Hersteller.", "Integrated cooker hood AiroClearEinbau V6000 with a standard width of 60 cm. Versions and data sheet on the manufacturer’s website.", "Hotte intégrée AiroClearEinbau V6000 de largeur normalisée 60 cm. Versions et fiche technique sur le site du fabricant.", "Cappa integrata AiroClearEinbau V6000 di larghezza standard 60 cm. Versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: Spiegelglas", "Finishes: Spiegelglas", "Finitions: Spiegelglas", "Finiture: Spiegelglas"),
      T("Nennleistung 0,134 kW", "Rated power 0.134 kW", "Puissance nominale 0,134 kW", "Potenza nominale 0,134 kW"),
      T("Energieeffizienzklasse A+", "Energy efficiency class A+", "Classe d’efficacité énergétique A+", "Classe di efficienza energetica A+"),
      T("Garantie laut Hersteller: 2 + 8 Jahre", "Warranty according to the manufacturer: 2 + 8 years", "Garantie selon le fabricant : 2 + 8 ans", "Garanzia secondo il produttore: 2 + 8 anni"),
      T("Daten für Art.-Nr. 6105800006; 4 Ausführungen auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 6105800006; 4 versions on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 6105800006 ; 4 versions sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 6105800006; 4 versioni su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "598 mm"), mass("hoehe", "470 mm"), mass("tiefe", "303 mm"), mass("nische", "B 600 mm · T ≥ 330 mm")]),
    bilder: Object.freeze([
      bild("v-zug-airocleareinbau-v6000-1.webp", 1200, 1200, T("V-ZUG AiroClearEinbau V6000: Gerät freigestellt von vorn, Design Spiegelglas", "V-ZUG AiroClearEinbau V6000: cut-out front view of the appliance, Spiegelglas finish", "V-ZUG AiroClearEinbau V6000 : appareil détouré vu de face, finition Spiegelglas", "V-ZUG AiroClearEinbau V6000: apparecchio scontornato visto di fronte, finitura Spiegelglas"), "https://www.vzug.com/at/de/produkte/kueche/dunstabzuege/integrierte-dunstabzugshauben/airocleareinbau-v6000--pV6105800006_Abluft"),
      bild("v-zug-airocleareinbau-v6000-2.webp", 1200, 1200, T("V-ZUG AiroClearEinbau V6000: Gerät freigestellt, zweite Ansicht von vorn unten", "V-ZUG AiroClearEinbau V6000: cut-out appliance, second view from the front below", "V-ZUG AiroClearEinbau V6000 : appareil détouré, seconde vue de face par-dessous", "V-ZUG AiroClearEinbau V6000: apparecchio scontornato, seconda vista frontale dal basso"), "https://www.vzug.com/at/de/produkte/kueche/dunstabzuege/integrierte-dunstabzugshauben/airocleareinbau-v6000--pV6105800006_Abluft", "freisteller"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "spiegelglas", name: "Spiegelglas" }),
        ]),
      }),
      Object.freeze({
        gruppe: T("Betriebsart", "Operating mode", "Mode de fonctionnement", "Modalità di funzionamento"),
        optionen: Object.freeze([
          Object.freeze({ id: "abluft", name: T("Abluft", "Extraction", "Évacuation", "Aspirazione"), code: "V6105800006 / V6106000006" }),
          Object.freeze({ id: "umluft-longlife", name: T("Umluft · Longlife", "Recirculation · Longlife", "Recyclage · Longlife", "Ricircolo · Longlife"), code: "V6105800006 / V6106000006" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/dunstabzuege/integrierte-dunstabzugshauben/airocleareinbau-v6000--pV6105800006_Abluft",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/dunstabzuege/integrierte-dunstabzugshauben/airocleareinbau-v6000--pV6105800006_Abluft"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "v-zug-airoclearinsel-v6000",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "dunstabzug",
    name: "AiroClearInsel V6000",
    serie: "V6000",
    kurz: T("Design-Dunstabzugshaube AiroClearInsel V6000 mit Normbreite 120 cm. Ausführungen und Datenblatt beim Hersteller.", "Designer cooker hood AiroClearInsel V6000 with a standard width of 120 cm. Versions and data sheet on the manufacturer’s website.", "Hotte design AiroClearInsel V6000 de largeur normalisée 120 cm. Versions et fiche technique sur le site du fabricant.", "Cappa design AiroClearInsel V6000 di larghezza standard 120 cm. Versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: Spiegelglas", "Finishes: Spiegelglas", "Finitions: Spiegelglas", "Finiture: Spiegelglas"),
      T("Nennleistung 0,138 kW", "Rated power 0.138 kW", "Puissance nominale 0,138 kW", "Potenza nominale 0,138 kW"),
      T("Energieeffizienzklasse A+", "Energy efficiency class A+", "Classe d’efficacité énergétique A+", "Classe di efficienza energetica A+"),
      T("Garantie laut Hersteller: 2 + 8 Jahre", "Warranty according to the manufacturer: 2 + 8 years", "Garantie selon le fabricant : 2 + 8 ans", "Garanzia secondo il produttore: 2 + 8 anni"),
      T("Daten für Art.-Nr. 6302000006; 4 Ausführungen auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 6302000006; 4 versions on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 6302000006 ; 4 versions sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 6302000006; 4 versioni su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "1200 mm"), mass("tiefe", "700 mm")]),
    bilder: Object.freeze([
      bild("v-zug-airoclearinsel-v6000-1.webp", 1200, 1200, T("V-ZUG AiroClearInsel V6000: Gerät freigestellt von vorn, Design Spiegelglas", "V-ZUG AiroClearInsel V6000: cut-out front view of the appliance, Spiegelglas finish", "V-ZUG AiroClearInsel V6000 : appareil détouré vu de face, finition Spiegelglas", "V-ZUG AiroClearInsel V6000: apparecchio scontornato visto di fronte, finitura Spiegelglas"), "https://www.vzug.com/at/de/produkte/kueche/dunstabzuege/design-dunstabzugshauben/airoclearinsel-v6000--pV6302000006_Abluft"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "spiegelglas", name: "Spiegelglas" }),
        ]),
      }),
      Object.freeze({
        gruppe: T("Betriebsart", "Operating mode", "Mode de fonctionnement", "Modalità di funzionamento"),
        optionen: Object.freeze([
          Object.freeze({ id: "abluft", name: T("Abluft", "Extraction", "Évacuation", "Aspirazione"), code: "V6302000006 / V6302000007" }),
          Object.freeze({ id: "umluft-longlife", name: T("Umluft · Longlife", "Recirculation · Longlife", "Recyclage · Longlife", "Ricircolo · Longlife"), code: "V6302000006 / V6302000007" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/dunstabzuege/design-dunstabzugshauben/airoclearinsel-v6000--pV6302000006_Abluft",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/dunstabzuege/design-dunstabzugshauben/airoclearinsel-v6000--pV6302000006_Abluft"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "v-zug-airoclearwand-v6000",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "dunstabzug",
    name: "AiroClearWand V6000",
    serie: "V6000",
    kurz: T("Design-Dunstabzugshaube AiroClearWand V6000 mit Normbreite 90 cm. Ausführungen und Datenblatt beim Hersteller.", "Designer cooker hood AiroClearWand V6000 with a standard width of 90 cm. Versions and data sheet on the manufacturer’s website.", "Hotte design AiroClearWand V6000 de largeur normalisée 90 cm. Versions et fiche technique sur le site du fabricant.", "Cappa design AiroClearWand V6000 di larghezza standard 90 cm. Versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: Spiegelglas", "Finishes: Spiegelglas", "Finitions: Spiegelglas", "Finiture: Spiegelglas"),
      T("Nennleistung 0,134 kW", "Rated power 0.134 kW", "Puissance nominale 0,134 kW", "Potenza nominale 0,134 kW"),
      T("Energieeffizienzklasse A+", "Energy efficiency class A+", "Classe d’efficacité énergétique A+", "Classe di efficienza energetica A+"),
      T("Garantie laut Hersteller: 2 + 8 Jahre", "Warranty according to the manufacturer: 2 + 8 years", "Garantie selon le fabricant : 2 + 8 ans", "Garanzia secondo il produttore: 2 + 8 anni"),
      T("Daten für Art.-Nr. 6202800006; 7 Ausführungen auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 6202800006; 7 versions on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 6202800006 ; 7 versions sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 6202800006; 7 versioni su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "898 mm"), mass("tiefe", "550 mm")]),
    bilder: Object.freeze([
      bild("v-zug-airoclearwand-v6000-1.webp", 1200, 1200, T("V-ZUG AiroClearWand V6000: Gerät freigestellt von vorn, Design Spiegelglas", "V-ZUG AiroClearWand V6000: cut-out front view of the appliance, Spiegelglas finish", "V-ZUG AiroClearWand V6000 : appareil détouré vu de face, finition Spiegelglas", "V-ZUG AiroClearWand V6000: apparecchio scontornato visto di fronte, finitura Spiegelglas"), "https://www.vzug.com/at/de/produkte/kueche/dunstabzuege/design-dunstabzugshauben/airoclearwand-v6000--pV6202800006_Abluft"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "spiegelglas", name: "Spiegelglas" }),
        ]),
      }),
      Object.freeze({
        gruppe: T("Betriebsart", "Operating mode", "Mode de fonctionnement", "Modalità di funzionamento"),
        optionen: Object.freeze([
          Object.freeze({ id: "abluft", name: T("Abluft", "Extraction", "Évacuation", "Aspirazione"), code: "V6202800006 / V6202800007 / V6202900007" }),
          Object.freeze({ id: "umluft-longlife", name: T("Umluft · Longlife", "Recirculation · Longlife", "Recyclage · Longlife", "Ricircolo · Longlife"), code: "V6202800006 / V6202800007 / V6202900006 / V6202900007" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/dunstabzuege/design-dunstabzugshauben/airoclearwand-v6000--pV6202800006_Abluft",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/dunstabzuege/design-dunstabzugshauben/airoclearwand-v6000--pV6202800006_Abluft"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "v-zug-df-sg-5-6",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "dunstabzug",
    name: "DF-SG 5/6",
    kurz: T("Integrierte Dunstabzugshaube DF-SG 5/6 mit Normbreite 60 cm. Ausführungen und Datenblatt beim Hersteller.", "Integrated cooker hood DF-SG 5/6 with a standard width of 60 cm. Versions and data sheet on the manufacturer’s website.", "Hotte intégrée DF-SG 5/6 de largeur normalisée 60 cm. Versions et fiche technique sur le site du fabricant.", "Cappa integrata DF-SG 5/6 di larghezza standard 60 cm. Versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: ChromeClass", "Finishes: ChromeClass", "Finitions: ChromeClass", "Finiture: ChromeClass"),
      T("Nennleistung 0,207 kW", "Rated power 0.207 kW", "Puissance nominale 0,207 kW", "Potenza nominale 0,207 kW"),
      T("Energieeffizienzklasse A", "Energy efficiency class A", "Classe d’efficacité énergétique A", "Classe di efficienza energetica A"),
      T("Garantie laut Hersteller: 2 + 8 Jahre", "Warranty according to the manufacturer: 2 + 8 years", "Garantie selon le fabricant : 2 + 8 ans", "Garanzia secondo il produttore: 2 + 8 anni"),
      T("Daten für Art.-Nr. 6103160003; 3 Ausführungen auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 6103160003; 3 versions on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 6103160003 ; 3 versions sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 6103160003; 3 versioni su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "598 mm"), mass("hoehe", "400 mm"), mass("tiefe", "280 mm"), mass("nische", "B 550 mm · T ≥ 280 mm")]),
    bilder: Object.freeze([
      bild("v-zug-df-sg-5-6-1.webp", 1200, 1200, T("V-ZUG DF-SG 5/6: Gerät freigestellt von vorn, Design ChromeClass", "V-ZUG DF-SG 5/6: cut-out front view of the appliance, ChromeClass finish", "V-ZUG DF-SG 5/6 : appareil détouré vu de face, finition ChromeClass", "V-ZUG DF-SG 5/6: apparecchio scontornato visto di fronte, finitura ChromeClass"), "https://www.vzug.com/at/de/produkte/kueche/dunstabzuege/integrierte-dunstabzugshauben/df-sg-5-6---pV6103160003_Abluft"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "chromeclass", name: "ChromeClass" }),
        ]),
      }),
      Object.freeze({
        gruppe: T("Betriebsart", "Operating mode", "Mode de fonctionnement", "Modalità di funzionamento"),
        optionen: Object.freeze([
          Object.freeze({ id: "abluft", name: T("Abluft", "Extraction", "Évacuation", "Aspirazione"), code: "V6103160003" }),
          Object.freeze({ id: "umluft-longlife", name: T("Umluft · Longlife", "Recirculation · Longlife", "Recyclage · Longlife", "Ricircolo · Longlife"), code: "V6103160003" }),
          Object.freeze({ id: "umluft-longlifeplus", name: T("Umluft · LonglifePlus", "Recirculation · LonglifePlus", "Recyclage · LonglifePlus", "Ricircolo · LonglifePlus"), code: "V6103160003" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/dunstabzuege/integrierte-dunstabzugshauben/df-sg-5-6---pV6103160003_Abluft",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/dunstabzuege/integrierte-dunstabzugshauben/df-sg-5-6---pV6103160003_Abluft"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "v-zug-df-sg-8-9",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "dunstabzug",
    name: "DF-SG 8/9",
    kurz: T("Integrierte Dunstabzugshaube DF-SG 8/9 mit Normbreite 90 cm. Ausführungen und Datenblatt beim Hersteller.", "Integrated cooker hood DF-SG 8/9 with a standard width of 90 cm. Versions and data sheet on the manufacturer’s website.", "Hotte intégrée DF-SG 8/9 de largeur normalisée 90 cm. Versions et fiche technique sur le site du fabricant.", "Cappa integrata DF-SG 8/9 di larghezza standard 90 cm. Versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: ChromeClass", "Finishes: ChromeClass", "Finitions: ChromeClass", "Finiture: ChromeClass"),
      T("Nennleistung 0,207 kW", "Rated power 0.207 kW", "Puissance nominale 0,207 kW", "Potenza nominale 0,207 kW"),
      T("Energieeffizienzklasse A", "Energy efficiency class A", "Classe d’efficacité énergétique A", "Classe di efficienza energetica A"),
      T("Garantie laut Hersteller: 2 + 8 Jahre", "Warranty according to the manufacturer: 2 + 8 years", "Garantie selon le fabricant : 2 + 8 ans", "Garanzia secondo il produttore: 2 + 8 anni"),
      T("Daten für Art.-Nr. 6103360003; 3 Ausführungen auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 6103360003; 3 versions on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 6103360003 ; 3 versions sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 6103360003; 3 versioni su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "898 mm"), mass("hoehe", "400 mm"), mass("tiefe", "280 mm"), mass("nische", "B 900 mm · T ≥ 280 mm")]),
    bilder: Object.freeze([
      bild("v-zug-df-sg-8-9-1.webp", 1200, 1200, T("V-ZUG DF-SG 8/9: Gerät freigestellt von vorn, Design ChromeClass", "V-ZUG DF-SG 8/9: cut-out front view of the appliance, ChromeClass finish", "V-ZUG DF-SG 8/9 : appareil détouré vu de face, finition ChromeClass", "V-ZUG DF-SG 8/9: apparecchio scontornato visto di fronte, finitura ChromeClass"), "https://www.vzug.com/at/de/produkte/kueche/dunstabzuege/integrierte-dunstabzugshauben/df-sg-8-9--pV6103360003_Abluft"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "chromeclass", name: "ChromeClass" }),
        ]),
      }),
      Object.freeze({
        gruppe: T("Betriebsart", "Operating mode", "Mode de fonctionnement", "Modalità di funzionamento"),
        optionen: Object.freeze([
          Object.freeze({ id: "abluft", name: T("Abluft", "Extraction", "Évacuation", "Aspirazione"), code: "V6103360003" }),
          Object.freeze({ id: "umluft-longlife", name: T("Umluft · Longlife", "Recirculation · Longlife", "Recyclage · Longlife", "Ricircolo · Longlife"), code: "V6103360003" }),
          Object.freeze({ id: "umluft-longlifeplus", name: T("Umluft · LonglifePlus", "Recirculation · LonglifePlus", "Recyclage · LonglifePlus", "Ricircolo · LonglifePlus"), code: "V6103360003" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/dunstabzuege/integrierte-dunstabzugshauben/df-sg-8-9--pV6103360003_Abluft",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/dunstabzuege/integrierte-dunstabzugshauben/df-sg-8-9--pV6103360003_Abluft"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "v-zug-dsms",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "dunstabzug",
    name: "DSMS",
    kurz: T("Tischlüfter DSMS. Ausführungen und Datenblatt beim Hersteller.", "Downdraft extractor DSMS. Versions and data sheet on the manufacturer’s website.", "Hotte plan de travail DSMS. Versions et fiche technique sur le site du fabricant.", "Aspiratore da piano DSMS. Versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: Glas", "Finishes: Glas", "Finitions: Glas", "Finiture: Glas"),
      T("Nennleistung 0,145 kW", "Rated power 0.145 kW", "Puissance nominale 0,145 kW", "Potenza nominale 0,145 kW"),
      T("Energieeffizienzklasse A", "Energy efficiency class A", "Classe d’efficacité énergétique A", "Classe di efficienza energetica A"),
      T("Daten für Art.-Nr. 6400560005; 2 Ausführungen auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 6400560005; 2 versions on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 6400560005 ; 2 versions sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 6400560005; 2 versioni su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "110 mm"), mass("hoehe", "900 mm"), mass("tiefe", "501 mm")]),
    bilder: Object.freeze([
      bild("v-zug-dsms-1.webp", 1200, 1200, T("V-ZUG DSMS: Gerät freigestellt von vorn, Design Glas", "V-ZUG DSMS: cut-out front view of the appliance, Glas finish", "V-ZUG DSMS : appareil détouré vu de face, finition Glas", "V-ZUG DSMS: apparecchio scontornato visto di fronte, finitura Glas"), "https://www.vzug.com/at/de/produkte/kueche/dunstabzuege/tischluefter/dsms--pV6400560005_Abluft"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "glas", name: "Glas" }),
        ]),
      }),
      Object.freeze({
        gruppe: T("Betriebsart", "Operating mode", "Mode de fonctionnement", "Modalità di funzionamento"),
        optionen: Object.freeze([
          Object.freeze({ id: "abluft", name: T("Abluft", "Extraction", "Évacuation", "Aspirazione"), code: "V6400560005" }),
          Object.freeze({ id: "umluft-standard", name: T("Umluft · Standard", "Recirculation · Standard", "Recyclage · Standard", "Ricircolo · Standard"), code: "V6400560005" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/dunstabzuege/tischluefter/dsms--pV6400560005_Abluft",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/dunstabzuege/tischluefter/dsms--pV6400560005_Abluft"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "v-zug-dsts9g",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "dunstabzug",
    name: "DSTS9g",
    kurz: T("Tischlüfter DSTS9g mit Normbreite 90 cm. Ausführungen und Datenblatt beim Hersteller.", "Downdraft extractor DSTS9g with a standard width of 90 cm. Versions and data sheet on the manufacturer’s website.", "Hotte plan de travail DSTS9g de largeur normalisée 90 cm. Versions et fiche technique sur le site du fabricant.", "Aspiratore da piano DSTS9g di larghezza standard 90 cm. Versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: Glas Nero", "Finishes: Glas Nero", "Finitions: Glas Nero", "Finiture: Glas Nero"),
      T("Nennleistung 0,276 kW", "Rated power 0.276 kW", "Puissance nominale 0,276 kW", "Potenza nominale 0,276 kW"),
      T("Energieeffizienzklasse A", "Energy efficiency class A", "Classe d’efficacité énergétique A", "Classe di efficienza energetica A"),
      T("Daten für Art.-Nr. 6401500001; 3 Ausführungen auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 6401500001; 3 versions on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 6401500001 ; 3 versions sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 6401500001; 3 versioni su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "880 mm"), mass("hoehe", "650 mm"), mass("tiefe", "120 mm")]),
    bilder: Object.freeze([
      bild("v-zug-dsts9g-1.webp", 1200, 1200, T("V-ZUG DSTS9g: Gerät freigestellt von vorn", "V-ZUG DSTS9g: cut-out front view of the appliance", "V-ZUG DSTS9g : appareil détouré vu de face", "V-ZUG DSTS9g: apparecchio scontornato visto di fronte"), "https://www.vzug.com/at/de/produkte/kueche/dunstabzuege/tischluefter/dsts9g--pV6401500001_Abluft"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "glas-nero", name: "Glas Nero" }),
        ]),
      }),
      Object.freeze({
        gruppe: T("Betriebsart", "Operating mode", "Mode de fonctionnement", "Modalità di funzionamento"),
        optionen: Object.freeze([
          Object.freeze({ id: "abluft", name: T("Abluft", "Extraction", "Évacuation", "Aspirazione"), code: "V6401500001" }),
          Object.freeze({ id: "umluft-longlife", name: T("Umluft · Longlife", "Recirculation · Longlife", "Recyclage · Longlife", "Ricircolo · Longlife"), code: "V6401500001" }),
          Object.freeze({ id: "umluft-standard", name: T("Umluft · Standard", "Recirculation · Standard", "Recyclage · Standard", "Ricircolo · Standard"), code: "V6401500001" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/dunstabzuege/tischluefter/dsts9g--pV6401500001_Abluft",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/dunstabzuege/tischluefter/dsts9g--pV6401500001_Abluft"]),
    stand: STAND,
  }),
  // ---------------------------------------------------------------- kuehlen
  Object.freeze({
    slug: "v-zug-combicooler-v4000-178kni",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "kuehlen",
    name: "CombiCooler V4000 178KNI",
    serie: "V4000",
    kurz: T("Einbau-Kühl-Gefrierkombination CombiCooler V4000 178KNI für eine Nische mit Normbreite 60 cm und Normhöhe 177,8 cm. Ausführungen und Datenblatt beim Hersteller.", "Built-in fridge-freezer CombiCooler V4000 178KNI for a niche with a standard width of 60 cm and height of 177.8 cm. Versions and data sheet on the manufacturer’s website.", "Réfrigérateur-congélateur encastrable CombiCooler V4000 178KNI pour une niche de largeur normalisée 60 cm et de hauteur 177,8 cm. Versions et fiche technique sur le site du fabricant.", "Frigo-congelatore da incasso CombiCooler V4000 178KNI per una nicchia di larghezza standard 60 cm e altezza 177,8 cm. Versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: Vollintegrierbar", "Finishes: Vollintegrierbar", "Finitions: Vollintegrierbar", "Finiture: Vollintegrierbar"),
      T("Nutzinhalt gesamt 268 l", "Total net capacity 268 l", "Volume utile total 268 l", "Capacità utile totale 268 l"),
      T("Max. Fachhöhe innen 226 mm", "Max. compartment height inside 226 mm", "Hauteur max. de compartiment 226 mm", "Altezza max. del ripiano interno 226 mm"),
      T("Luftschallemissionsklasse B", "Airborne noise emission class B", "Classe d’émission de bruit aérien B", "Classe di emissione di rumore aereo B"),
      T("Nennleistung 70,0 W", "Rated power 70.0 W", "Puissance nominale 70,0 W", "Potenza nominale 70,0 W"),
      T("Energieeffizienzklasse C", "Energy efficiency class C", "Classe d’efficacité énergétique C", "Classe di efficienza energetica C"),
      T("Garantie laut Hersteller: 2 + 8 Jahre", "Warranty according to the manufacturer: 2 + 8 years", "Garantie selon le fabricant : 2 + 8 ans", "Garanzia secondo il produttore: 2 + 8 anni"),
      T("Daten für Art.-Nr. 5111400002; 1 Ausführung auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 5111400002; 1 version on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 5111400002 ; 1 version sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 5111400002; 1 versione su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "548 mm"), mass("hoehe", "1777 mm"), mass("tiefe", "545 mm"), mass("nische", "B 550–568 mm · H 1778–1780 mm · T ≥ 550 mm")]),
    bilder: Object.freeze([
      bild("v-zug-combicooler-v4000-178kni-1.webp", 1200, 1200, T("V-ZUG CombiCooler V4000 178KNI: Gerät freigestellt von vorn, Design Vollintegrierbar", "V-ZUG CombiCooler V4000 178KNI: cut-out front view of the appliance, Vollintegrierbar finish", "V-ZUG CombiCooler V4000 178KNI : appareil détouré vu de face, finition Vollintegrierbar", "V-ZUG CombiCooler V4000 178KNI: apparecchio scontornato visto di fronte, finitura Vollintegrierbar"), "https://www.vzug.com/at/de/produkte/kueche/kuehlschraenke/kombinierte-kuehl-und-gefriergeraete/combicooler-v4000-178kni--p5111400002"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "vollintegrierbar", name: "Vollintegrierbar" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/kuehlschraenke/kombinierte-kuehl-und-gefriergeraete/combicooler-v4000-178kni--p5111400002",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/kuehlschraenke/kombinierte-kuehl-und-gefriergeraete/combicooler-v4000-178kni--p5111400002"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "v-zug-combicooler-v4000-178ni",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "kuehlen",
    name: "CombiCooler V4000 178NI",
    serie: "V4000",
    kurz: T("Einbau-Kühl-Gefrierkombination CombiCooler V4000 178NI für eine Nische mit Normbreite 60 cm und Normhöhe 177,8 cm. Ausführungen und Datenblatt beim Hersteller.", "Built-in fridge-freezer CombiCooler V4000 178NI for a niche with a standard width of 60 cm and height of 177.8 cm. Versions and data sheet on the manufacturer’s website.", "Réfrigérateur-congélateur encastrable CombiCooler V4000 178NI pour une niche de largeur normalisée 60 cm et de hauteur 177,8 cm. Versions et fiche technique sur le site du fabricant.", "Frigo-congelatore da incasso CombiCooler V4000 178NI per una nicchia di larghezza standard 60 cm e altezza 177,8 cm. Versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: Vollintegrierbar", "Finishes: Vollintegrierbar", "Finitions: Vollintegrierbar", "Finiture: Vollintegrierbar"),
      T("Nutzinhalt gesamt 282 l", "Total net capacity 282 l", "Volume utile total 282 l", "Capacità utile totale 282 l"),
      T("Max. Fachhöhe innen 226 mm", "Max. compartment height inside 226 mm", "Hauteur max. de compartiment 226 mm", "Altezza max. del ripiano interno 226 mm"),
      T("Luftschallemissionsklasse B", "Airborne noise emission class B", "Classe d’émission de bruit aérien B", "Classe di emissione di rumore aereo B"),
      T("Nennleistung 70,0 W", "Rated power 70.0 W", "Puissance nominale 70,0 W", "Potenza nominale 70,0 W"),
      T("Energieeffizienzklasse C", "Energy efficiency class C", "Classe d’efficacité énergétique C", "Classe di efficienza energetica C"),
      T("Garantie laut Hersteller: 2 + 8 Jahre", "Warranty according to the manufacturer: 2 + 8 years", "Garantie selon le fabricant : 2 + 8 ans", "Garanzia secondo il produttore: 2 + 8 anni"),
      T("Daten für Art.-Nr. 5110800002; 1 Ausführung auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 5110800002; 1 version on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 5110800002 ; 1 version sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 5110800002; 1 versione su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "548 mm"), mass("hoehe", "1777 mm"), mass("tiefe", "545 mm"), mass("nische", "B 550–568 mm · H 1778–1780 mm · T ≥ 550 mm")]),
    bilder: Object.freeze([
      bild("v-zug-combicooler-v4000-178ni-1.webp", 1200, 1200, T("V-ZUG CombiCooler V4000 178NI: Gerät freigestellt von vorn, Design Vollintegrierbar", "V-ZUG CombiCooler V4000 178NI: cut-out front view of the appliance, Vollintegrierbar finish", "V-ZUG CombiCooler V4000 178NI : appareil détouré vu de face, finition Vollintegrierbar", "V-ZUG CombiCooler V4000 178NI: apparecchio scontornato visto di fronte, finitura Vollintegrierbar"), "https://www.vzug.com/at/de/produkte/kueche/kuehlschraenke/kombinierte-kuehl-und-gefriergeraete/combicooler-v4000-178ni--p5110800002"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "vollintegrierbar", name: "Vollintegrierbar" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/kuehlschraenke/kombinierte-kuehl-und-gefriergeraete/combicooler-v4000-178ni--p5110800002",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/kuehlschraenke/kombinierte-kuehl-und-gefriergeraete/combicooler-v4000-178ni--p5110800002"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "v-zug-combicooler-v6000-75-supreme",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "kuehlen",
    name: "CombiCooler V6000 75 Supreme",
    serie: "V6000 Supreme Line",
    kurz: T("Kühlgerät der Supreme Line CombiCooler V6000 75 Supreme für eine Nische mit Normbreite 75 cm und Normhöhe 205 cm. Ausführungen und Datenblatt beim Hersteller.", "Supreme Line cooling appliance CombiCooler V6000 75 Supreme for a niche with a standard width of 75 cm and height of 205 cm. Versions and data sheet on the manufacturer’s website.", "Appareil de froid Supreme Line CombiCooler V6000 75 Supreme pour une niche de largeur normalisée 75 cm et de hauteur 205 cm. Versions et fiche technique sur le site du fabricant.", "Apparecchio di refrigerazione Supreme Line CombiCooler V6000 75 Supreme per una nicchia di larghezza standard 75 cm e altezza 205 cm. Versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: Vollintegrierbar", "Finishes: Vollintegrierbar", "Finitions: Vollintegrierbar", "Finiture: Vollintegrierbar"),
      T("Nutzinhalt gesamt 440 l", "Total net capacity 440 l", "Volume utile total 440 l", "Capacità utile totale 440 l"),
      T("Max. Fachhöhe innen 250 mm", "Max. compartment height inside 250 mm", "Hauteur max. de compartiment 250 mm", "Altezza max. del ripiano interno 250 mm"),
      T("Luftschallemissionsklasse D", "Airborne noise emission class D", "Classe d’émission de bruit aérien D", "Classe di emissione di rumore aereo D"),
      T("Nennleistung 440,0 W", "Rated power 440.0 W", "Puissance nominale 440,0 W", "Potenza nominale 440,0 W"),
      T("Garantie laut Hersteller: 2 + 8 Jahre", "Warranty according to the manufacturer: 2 + 8 years", "Garantie selon le fabricant : 2 + 8 ans", "Garanzia secondo il produttore: 2 + 8 anni"),
      T("Daten für Art.-Nr. 5111500010; 2 Ausführungen auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 5111500010; 2 versions on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 5111500010 ; 2 versions sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 5111500010; 2 versioni su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "737 mm"), mass("hoehe", "2050 mm"), mass("tiefe", "610 mm"), mass("nische", "B 750 mm · H 2064–2089 mm · T ≥ 650 mm")]),
    bilder: Object.freeze([
      bild("v-zug-combicooler-v6000-75-supreme-1.webp", 1200, 1200, T("V-ZUG CombiCooler V6000 75 Supreme: Gerät freigestellt von vorn, Design Vollintegrierbar", "V-ZUG CombiCooler V6000 75 Supreme: cut-out front view of the appliance, Vollintegrierbar finish", "V-ZUG CombiCooler V6000 75 Supreme : appareil détouré vu de face, finition Vollintegrierbar", "V-ZUG CombiCooler V6000 75 Supreme: apparecchio scontornato visto di fronte, finitura Vollintegrierbar"), "https://www.vzug.com/at/de/produkte/kueche/kuehlschraenke/supreme-line/combicooler-v6000-75-supreme--p5111500010"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "vollintegrierbar", name: "Vollintegrierbar" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/kuehlschraenke/supreme-line/combicooler-v6000-75-supreme--p5111500010",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/kuehlschraenke/supreme-line/combicooler-v6000-75-supreme--p5111500010"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "v-zug-combicooler-v6000-90-supreme",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "kuehlen",
    name: "CombiCooler V6000 90 Supreme",
    serie: "V6000 Supreme Line",
    kurz: T("Kühlgerät der Supreme Line CombiCooler V6000 90 Supreme für eine Nische mit Normbreite 90 cm und Normhöhe 205 cm. Ausführungen und Datenblatt beim Hersteller.", "Supreme Line cooling appliance CombiCooler V6000 90 Supreme for a niche with a standard width of 90 cm and height of 205 cm. Versions and data sheet on the manufacturer’s website.", "Appareil de froid Supreme Line CombiCooler V6000 90 Supreme pour une niche de largeur normalisée 90 cm et de hauteur 205 cm. Versions et fiche technique sur le site du fabricant.", "Apparecchio di refrigerazione Supreme Line CombiCooler V6000 90 Supreme per una nicchia di larghezza standard 90 cm e altezza 205 cm. Versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: Vollintegrierbar", "Finishes: Vollintegrierbar", "Finitions: Vollintegrierbar", "Finiture: Vollintegrierbar"),
      T("Nutzinhalt gesamt 556 l", "Total net capacity 556 l", "Volume utile total 556 l", "Capacità utile totale 556 l"),
      T("Max. Fachhöhe innen 250 mm", "Max. compartment height inside 250 mm", "Hauteur max. de compartiment 250 mm", "Altezza max. del ripiano interno 250 mm"),
      T("Luftschallemissionsklasse C", "Airborne noise emission class C", "Classe d’émission de bruit aérien C", "Classe di emissione di rumore aereo C"),
      T("Nennleistung 440,0 W", "Rated power 440.0 W", "Puissance nominale 440,0 W", "Potenza nominale 440,0 W"),
      T("Garantie laut Hersteller: 2 + 8 Jahre", "Warranty according to the manufacturer: 2 + 8 years", "Garantie selon le fabricant : 2 + 8 ans", "Garanzia secondo il produttore: 2 + 8 anni"),
      T("Daten für Art.-Nr. 5113300002; 2 Ausführungen auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 5113300002; 2 versions on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 5113300002 ; 2 versions sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 5113300002; 2 versioni su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "887 mm"), mass("hoehe", "2050 mm"), mass("tiefe", "610 mm"), mass("nische", "B 900 mm · H 2064–2089 mm · T ≥ 650 mm")]),
    bilder: Object.freeze([
      bild("v-zug-combicooler-v6000-90-supreme-1.webp", 1200, 1200, T("V-ZUG CombiCooler V6000 90 Supreme: Gerät freigestellt von vorn, Design Vollintegrierbar", "V-ZUG CombiCooler V6000 90 Supreme: cut-out front view of the appliance, Vollintegrierbar finish", "V-ZUG CombiCooler V6000 90 Supreme : appareil détouré vu de face, finition Vollintegrierbar", "V-ZUG CombiCooler V6000 90 Supreme: apparecchio scontornato visto di fronte, finitura Vollintegrierbar"), "https://www.vzug.com/at/de/produkte/kueche/kuehlschraenke/supreme-line/combicooler-v6000-90-supreme--p5113300002"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "vollintegrierbar", name: "Vollintegrierbar" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/kuehlschraenke/supreme-line/combicooler-v6000-90-supreme--p5113300002",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/kuehlschraenke/supreme-line/combicooler-v6000-90-supreme--p5113300002"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "v-zug-combicooler-v6000-178ni",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "kuehlen",
    name: "CombiCooler V6000 178NI",
    serie: "V6000",
    kurz: T("Einbau-Kühl-Gefrierkombination CombiCooler V6000 178NI für eine Nische mit Normbreite 55 cm und Normhöhe 177,8 cm. Ausführungen und Datenblatt beim Hersteller.", "Built-in fridge-freezer CombiCooler V6000 178NI for a niche with a standard width of 55 cm and height of 177.8 cm. Versions and data sheet on the manufacturer’s website.", "Réfrigérateur-congélateur encastrable CombiCooler V6000 178NI pour une niche de largeur normalisée 55 cm et de hauteur 177,8 cm. Versions et fiche technique sur le site du fabricant.", "Frigo-congelatore da incasso CombiCooler V6000 178NI per una nicchia di larghezza standard 55 cm e altezza 177,8 cm. Versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: Vollintegrierbar", "Finishes: Vollintegrierbar", "Finitions: Vollintegrierbar", "Finiture: Vollintegrierbar"),
      T("Max. Fachhöhe innen 226 mm", "Max. compartment height inside 226 mm", "Hauteur max. de compartiment 226 mm", "Altezza max. del ripiano interno 226 mm"),
      T("Luftschallemissionsklasse B", "Airborne noise emission class B", "Classe d’émission de bruit aérien B", "Classe di emissione di rumore aereo B"),
      T("Nennleistung 70,0 W", "Rated power 70.0 W", "Puissance nominale 70,0 W", "Potenza nominale 70,0 W"),
      T("Energieeffizienzklasse C", "Energy efficiency class C", "Classe d’efficacité énergétique C", "Classe di efficienza energetica C"),
      T("Daten für Art.-Nr. 5114800002; 2 Ausführungen auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 5114800002; 2 versions on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 5114800002 ; 2 versions sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 5114800002; 2 versioni su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "548 mm"), mass("hoehe", "1777 mm"), mass("tiefe", "545 mm"), mass("nische", "B 550–568 mm · H 1778–1780 mm · T ≥ 550 mm")]),
    bilder: Object.freeze([
      bild("v-zug-combicooler-v6000-178ni-1.webp", 1200, 1200, T("V-ZUG CombiCooler V6000 178NI: Gerät freigestellt von vorn, Design Vollintegrierbar", "V-ZUG CombiCooler V6000 178NI: cut-out front view of the appliance, Vollintegrierbar finish", "V-ZUG CombiCooler V6000 178NI : appareil détouré vu de face, finition Vollintegrierbar", "V-ZUG CombiCooler V6000 178NI: apparecchio scontornato visto di fronte, finitura Vollintegrierbar"), "https://www.vzug.com/at/de/produkte/kueche/kuehlschraenke/kombinierte-kuehl-und-gefriergeraete/combicooler-v6000-178ni--p5114800002"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "vollintegrierbar", name: "Vollintegrierbar" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/kuehlschraenke/kombinierte-kuehl-und-gefriergeraete/combicooler-v6000-178ni--p5114800002",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/kuehlschraenke/kombinierte-kuehl-und-gefriergeraete/combicooler-v6000-178ni--p5114800002"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "v-zug-cooler-v4000-178k",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "kuehlen",
    name: "Cooler V4000 178K",
    serie: "V4000",
    kurz: T("Einbau-Kühlschrank Cooler V4000 178K für eine Nische mit Normbreite 60 cm und Normhöhe 177,8 cm. Ausführungen und Datenblatt beim Hersteller.", "Built-in refrigerator Cooler V4000 178K for a niche with a standard width of 60 cm and height of 177.8 cm. Versions and data sheet on the manufacturer’s website.", "Réfrigérateur encastrable Cooler V4000 178K pour une niche de largeur normalisée 60 cm et de hauteur 177,8 cm. Versions et fiche technique sur le site du fabricant.", "Frigorifero da incasso Cooler V4000 178K per una nicchia di larghezza standard 60 cm e altezza 177,8 cm. Versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: Vollintegrierbar", "Finishes: Vollintegrierbar", "Finitions: Vollintegrierbar", "Finiture: Vollintegrierbar"),
      T("Nutzinhalt gesamt 296 l", "Total net capacity 296 l", "Volume utile total 296 l", "Capacità utile totale 296 l"),
      T("Luftschallemissionsklasse B", "Airborne noise emission class B", "Classe d’émission de bruit aérien B", "Classe di emissione di rumore aereo B"),
      T("Nennleistung 264,0 W", "Rated power 264.0 W", "Puissance nominale 264,0 W", "Potenza nominale 264,0 W"),
      T("Garantie laut Hersteller: 2 + 8 Jahre", "Warranty according to the manufacturer: 2 + 8 years", "Garantie selon le fabricant : 2 + 8 ans", "Garanzia secondo il produttore: 2 + 8 anni"),
      T("Daten für Art.-Nr. 5113900002; 1 Ausführung auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 5113900002; 1 version on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 5113900002 ; 1 version sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 5113900002; 1 versione su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "559 mm"), mass("hoehe", "1770 mm"), mass("tiefe", "546 mm"), mass("nische", "B 560–570 mm · H 1772–1788 mm · T ≥ 550 mm")]),
    bilder: Object.freeze([
      bild("v-zug-cooler-v4000-178k-1.webp", 1200, 1200, T("V-ZUG Cooler V4000 178K: Gerät freigestellt von vorn, Design Vollintegrierbar", "V-ZUG Cooler V4000 178K: cut-out front view of the appliance, Vollintegrierbar finish", "V-ZUG Cooler V4000 178K : appareil détouré vu de face, finition Vollintegrierbar", "V-ZUG Cooler V4000 178K: apparecchio scontornato visto di fronte, finitura Vollintegrierbar"), "https://www.vzug.com/at/de/produkte/kueche/kuehlschraenke/kuehlschraenke/cooler-v4000-178k--p5113900002"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "vollintegrierbar", name: "Vollintegrierbar" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/kuehlschraenke/kuehlschraenke/cooler-v4000-178k--p5113900002",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/kuehlschraenke/kuehlschraenke/cooler-v4000-178k--p5113900002"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "v-zug-cooler-v4000-178kg",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "kuehlen",
    name: "Cooler V4000 178KG",
    serie: "V4000",
    kurz: T("Einbau-Kühlschrank Cooler V4000 178KG für eine Nische mit Normbreite 60 cm und Normhöhe 177,8 cm. Ausführungen und Datenblatt beim Hersteller.", "Built-in refrigerator Cooler V4000 178KG for a niche with a standard width of 60 cm and height of 177.8 cm. Versions and data sheet on the manufacturer’s website.", "Réfrigérateur encastrable Cooler V4000 178KG pour une niche de largeur normalisée 60 cm et de hauteur 177,8 cm. Versions et fiche technique sur le site du fabricant.", "Frigorifero da incasso Cooler V4000 178KG per una nicchia di larghezza standard 60 cm e altezza 177,8 cm. Versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: Vollintegrierbar", "Finishes: Vollintegrierbar", "Finitions: Vollintegrierbar", "Finiture: Vollintegrierbar"),
      T("Nutzinhalt gesamt 276 l", "Total net capacity 276 l", "Volume utile total 276 l", "Capacità utile totale 276 l"),
      T("Luftschallemissionsklasse B", "Airborne noise emission class B", "Classe d’émission de bruit aérien B", "Classe di emissione di rumore aereo B"),
      T("Nennleistung 264,0 W", "Rated power 264.0 W", "Puissance nominale 264,0 W", "Potenza nominale 264,0 W"),
      T("Garantie laut Hersteller: 2 + 8 Jahre", "Warranty according to the manufacturer: 2 + 8 years", "Garantie selon le fabricant : 2 + 8 ans", "Garanzia secondo il produttore: 2 + 8 anni"),
      T("Daten für Art.-Nr. 5114300002; 1 Ausführung auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 5114300002; 1 version on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 5114300002 ; 1 version sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 5114300002; 1 versione su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "559 mm"), mass("hoehe", "1770 mm"), mass("tiefe", "546 mm"), mass("nische", "B 560–570 mm · H 1772–1788 mm · T ≥ 550 mm")]),
    bilder: Object.freeze([
      bild("v-zug-cooler-v4000-178kg-1.webp", 1200, 1200, T("V-ZUG Cooler V4000 178KG: Gerät freigestellt von vorn, Design Vollintegrierbar", "V-ZUG Cooler V4000 178KG: cut-out front view of the appliance, Vollintegrierbar finish", "V-ZUG Cooler V4000 178KG : appareil détouré vu de face, finition Vollintegrierbar", "V-ZUG Cooler V4000 178KG: apparecchio scontornato visto di fronte, finitura Vollintegrierbar"), "https://www.vzug.com/at/de/produkte/kueche/kuehlschraenke/kuehlschraenke/cooler-v4000-178kg--p5114300002"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "vollintegrierbar", name: "Vollintegrierbar" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/kuehlschraenke/kuehlschraenke/cooler-v4000-178kg--p5114300002",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/kuehlschraenke/kuehlschraenke/cooler-v4000-178kg--p5114300002"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "v-zug-cooler-v6000-75-supreme",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "kuehlen",
    name: "Cooler V6000 75 Supreme",
    serie: "V6000 Supreme Line",
    kurz: T("Kühlgerät der Supreme Line Cooler V6000 75 Supreme für eine Nische mit Normbreite 75 cm und Normhöhe 205 cm. Ausführungen und Datenblatt beim Hersteller.", "Supreme Line cooling appliance Cooler V6000 75 Supreme for a niche with a standard width of 75 cm and height of 205 cm. Versions and data sheet on the manufacturer’s website.", "Appareil de froid Supreme Line Cooler V6000 75 Supreme pour une niche de largeur normalisée 75 cm et de hauteur 205 cm. Versions et fiche technique sur le site du fabricant.", "Apparecchio di refrigerazione Supreme Line Cooler V6000 75 Supreme per una nicchia di larghezza standard 75 cm e altezza 205 cm. Versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: Vollintegrierbar", "Finishes: Vollintegrierbar", "Finitions: Vollintegrierbar", "Finiture: Vollintegrierbar"),
      T("Nutzinhalt gesamt 479 l", "Total net capacity 479 l", "Volume utile total 479 l", "Capacità utile totale 479 l"),
      T("Max. Fachhöhe innen 250 mm", "Max. compartment height inside 250 mm", "Hauteur max. de compartiment 250 mm", "Altezza max. del ripiano interno 250 mm"),
      T("Luftschallemissionsklasse C", "Airborne noise emission class C", "Classe d’émission de bruit aérien C", "Classe di emissione di rumore aereo C"),
      T("Nennleistung 330,0 W", "Rated power 330.0 W", "Puissance nominale 330,0 W", "Potenza nominale 330,0 W"),
      T("Garantie laut Hersteller: 2 + 8 Jahre", "Warranty according to the manufacturer: 2 + 8 years", "Garantie selon le fabricant : 2 + 8 ans", "Garanzia secondo il produttore: 2 + 8 anni"),
      T("Daten für Art.-Nr. 5111600010; 2 Ausführungen auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 5111600010; 2 versions on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 5111600010 ; 2 versions sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 5111600010; 2 versioni su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "737 mm"), mass("hoehe", "2050 mm"), mass("tiefe", "610 mm"), mass("nische", "B 750 mm · H 2064–2089 mm · T ≥ 650 mm")]),
    bilder: Object.freeze([
      bild("v-zug-cooler-v6000-75-supreme-1.webp", 1200, 1200, T("V-ZUG Cooler V6000 75 Supreme: Gerät freigestellt von vorn, Design Vollintegrierbar", "V-ZUG Cooler V6000 75 Supreme: cut-out front view of the appliance, Vollintegrierbar finish", "V-ZUG Cooler V6000 75 Supreme : appareil détouré vu de face, finition Vollintegrierbar", "V-ZUG Cooler V6000 75 Supreme: apparecchio scontornato visto di fronte, finitura Vollintegrierbar"), "https://www.vzug.com/at/de/produkte/kueche/kuehlschraenke/supreme-line/cooler-v6000-75-supreme--p5111600010"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "vollintegrierbar", name: "Vollintegrierbar" }),
        ]),
      }),
    ]),
    zubehoer: Object.freeze([
      Object.freeze({ slug: "v-zug-freezer-v6000-60-supreme", hinweis: T("Laut Hersteller lassen sich Kühl- und Gefrierschränke der Supreme Line zu einer Side-by-Side-Lösung kombinieren", "According to the manufacturer, Supreme Line refrigerators and freezers can be combined side by side", "Selon le fabricant, réfrigérateurs et congélateurs Supreme Line se combinent en side-by-side", "Secondo il produttore, frigoriferi e congelatori Supreme Line si combinano in side-by-side") }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/kuehlschraenke/supreme-line/cooler-v6000-75-supreme--p5111600010",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/kuehlschraenke/supreme-line/cooler-v6000-75-supreme--p5111600010", "https://www.vzug.com/at/de/produkte/kueche/kuehlschraenke/supreme-line/freezer-v6000-60-supreme--p5300600000"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "v-zug-cooler-v6000-90-supreme",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "kuehlen",
    name: "Cooler V6000 90 Supreme",
    serie: "V6000 Supreme Line",
    kurz: T("Kühlgerät der Supreme Line Cooler V6000 90 Supreme für eine Nische mit Normbreite 90 cm und Normhöhe 205 cm. Ausführungen und Datenblatt beim Hersteller.", "Supreme Line cooling appliance Cooler V6000 90 Supreme for a niche with a standard width of 90 cm and height of 205 cm. Versions and data sheet on the manufacturer’s website.", "Appareil de froid Supreme Line Cooler V6000 90 Supreme pour une niche de largeur normalisée 90 cm et de hauteur 205 cm. Versions et fiche technique sur le site du fabricant.", "Apparecchio di refrigerazione Supreme Line Cooler V6000 90 Supreme per una nicchia di larghezza standard 90 cm e altezza 205 cm. Versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: Vollintegrierbar", "Finishes: Vollintegrierbar", "Finitions: Vollintegrierbar", "Finiture: Vollintegrierbar"),
      T("Nutzinhalt gesamt 619 l", "Total net capacity 619 l", "Volume utile total 619 l", "Capacità utile totale 619 l"),
      T("Max. Fachhöhe innen 250 mm", "Max. compartment height inside 250 mm", "Hauteur max. de compartiment 250 mm", "Altezza max. del ripiano interno 250 mm"),
      T("Luftschallemissionsklasse C", "Airborne noise emission class C", "Classe d’émission de bruit aérien C", "Classe di emissione di rumore aereo C"),
      T("Nennleistung 330,0 W", "Rated power 330.0 W", "Puissance nominale 330,0 W", "Potenza nominale 330,0 W"),
      T("Garantie laut Hersteller: 2 + 8 Jahre", "Warranty according to the manufacturer: 2 + 8 years", "Garantie selon le fabricant : 2 + 8 ans", "Garanzia secondo il produttore: 2 + 8 anni"),
      T("Daten für Art.-Nr. 5113400000; 2 Ausführungen auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 5113400000; 2 versions on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 5113400000 ; 2 versions sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 5113400000; 2 versioni su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "887 mm"), mass("hoehe", "2050 mm"), mass("tiefe", "610 mm"), mass("nische", "B 900 mm · H 2064–2089 mm · T ≥ 650 mm")]),
    bilder: Object.freeze([
      bild("v-zug-cooler-v6000-90-supreme-1.webp", 1200, 1200, T("V-ZUG Cooler V6000 90 Supreme: Gerät freigestellt von vorn, Design Vollintegrierbar", "V-ZUG Cooler V6000 90 Supreme: cut-out front view of the appliance, Vollintegrierbar finish", "V-ZUG Cooler V6000 90 Supreme : appareil détouré vu de face, finition Vollintegrierbar", "V-ZUG Cooler V6000 90 Supreme: apparecchio scontornato visto di fronte, finitura Vollintegrierbar"), "https://www.vzug.com/at/de/produkte/kueche/kuehlschraenke/supreme-line/cooler-v6000-90-supreme--p5113400000"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "vollintegrierbar", name: "Vollintegrierbar" }),
        ]),
      }),
    ]),
    zubehoer: Object.freeze([
      Object.freeze({ slug: "v-zug-freezer-v6000-60-supreme", hinweis: T("Laut Hersteller lassen sich Kühl- und Gefrierschränke der Supreme Line zu einer Side-by-Side-Lösung kombinieren", "According to the manufacturer, Supreme Line refrigerators and freezers can be combined side by side", "Selon le fabricant, réfrigérateurs et congélateurs Supreme Line se combinent en side-by-side", "Secondo il produttore, frigoriferi e congelatori Supreme Line si combinano in side-by-side") }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/kuehlschraenke/supreme-line/cooler-v6000-90-supreme--p5113400000",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/kuehlschraenke/supreme-line/cooler-v6000-90-supreme--p5113400000", "https://www.vzug.com/at/de/produkte/kueche/kuehlschraenke/supreme-line/freezer-v6000-60-supreme--p5300600000"]),
    stand: STAND,
  }),
  // ---------------------------------------------------------------- gefrieren
  Object.freeze({
    slug: "v-zug-freezer-v4000-178n",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "gefrieren",
    name: "Freezer V4000 178N",
    serie: "V4000",
    kurz: T("Einbau-Gefrierschrank Freezer V4000 178N für eine Nische mit Normbreite 60 cm und Normhöhe 177,8 cm. Ausführungen und Datenblatt beim Hersteller.", "Built-in freezer Freezer V4000 178N for a niche with a standard width of 60 cm and height of 177.8 cm. Versions and data sheet on the manufacturer’s website.", "Congélateur encastrable Freezer V4000 178N pour une niche de largeur normalisée 60 cm et de hauteur 177,8 cm. Versions et fiche technique sur le site du fabricant.", "Congelatore da incasso Freezer V4000 178N per una nicchia di larghezza standard 60 cm e altezza 177,8 cm. Versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: Vollintegrierbar", "Finishes: Vollintegrierbar", "Finitions: Vollintegrierbar", "Finiture: Vollintegrierbar"),
      T("Nutzinhalt gesamt 213 l", "Total net capacity 213 l", "Volume utile total 213 l", "Capacità utile totale 213 l"),
      T("Luftschallemissionsklasse B", "Airborne noise emission class B", "Classe d’émission de bruit aérien B", "Classe di emissione di rumore aereo B"),
      T("Nennleistung 286,0 W", "Rated power 286.0 W", "Puissance nominale 286,0 W", "Potenza nominale 286,0 W"),
      T("Garantie laut Hersteller: 2 + 8 Jahre", "Warranty according to the manufacturer: 2 + 8 years", "Garantie selon le fabricant : 2 + 8 ans", "Garanzia secondo il produttore: 2 + 8 anni"),
      T("Daten für Art.-Nr. 5300800002; 1 Ausführung auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 5300800002; 1 version on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 5300800002 ; 1 version sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 5300800002; 1 versione su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "559 mm"), mass("hoehe", "1770 mm"), mass("tiefe", "546 mm"), mass("nische", "B 560–570 mm · H 1772–1788 mm · T ≥ 550 mm")]),
    bilder: Object.freeze([
      bild("v-zug-freezer-v4000-178n-1.webp", 1200, 1200, T("V-ZUG Freezer V4000 178N: Gerät freigestellt von vorn", "V-ZUG Freezer V4000 178N: cut-out front view of the appliance", "V-ZUG Freezer V4000 178N : appareil détouré vu de face", "V-ZUG Freezer V4000 178N: apparecchio scontornato visto di fronte"), "https://www.vzug.com/at/de/produkte/kueche/kuehlschraenke/gefrierschraenke/freezer-v4000-178n--p5300800002"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "vollintegrierbar", name: "Vollintegrierbar" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/kuehlschraenke/gefrierschraenke/freezer-v4000-178n--p5300800002",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/kuehlschraenke/gefrierschraenke/freezer-v4000-178n--p5300800002"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "v-zug-freezer-v6000-60-supreme",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "gefrieren",
    name: "Freezer V6000 60 Supreme",
    serie: "V6000 Supreme Line",
    kurz: T("Einbau-Gefrierschrank der Supreme Line Freezer V6000 60 Supreme für eine Nische mit Normbreite 60 cm und Normhöhe 205 cm. Ausführungen und Datenblatt beim Hersteller.", "Supreme Line built-in freezer Freezer V6000 60 Supreme for a niche with a standard width of 60 cm and height of 205 cm. Versions and data sheet on the manufacturer’s website.", "Congélateur encastrable Supreme Line Freezer V6000 60 Supreme pour une niche de largeur normalisée 60 cm et de hauteur 205 cm. Versions et fiche technique sur le site du fabricant.", "Congelatore da incasso Supreme Line Freezer V6000 60 Supreme per una nicchia di larghezza standard 60 cm e altezza 205 cm. Versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: Vollintegrierbar", "Finishes: Vollintegrierbar", "Finitions: Vollintegrierbar", "Finiture: Vollintegrierbar"),
      T("Nutzinhalt gesamt 348 l", "Total net capacity 348 l", "Volume utile total 348 l", "Capacità utile totale 348 l"),
      T("Garantie laut Hersteller: 2 + 8 Jahre", "Warranty according to the manufacturer: 2 + 8 years", "Garantie selon le fabricant : 2 + 8 ans", "Garanzia secondo il produttore: 2 + 8 anni"),
      T("Daten für Art.-Nr. 5300600000; 2 Ausführungen auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 5300600000; 2 versions on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 5300600000 ; 2 versions sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 5300600000; 2 versioni su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    bilder: Object.freeze([
      bild("v-zug-freezer-v6000-60-supreme-1.webp", 1200, 1200, T("V-ZUG Freezer V6000 60 Supreme: Gerät freigestellt von vorn, Design Vollintegrierbar", "V-ZUG Freezer V6000 60 Supreme: cut-out front view of the appliance, Vollintegrierbar finish", "V-ZUG Freezer V6000 60 Supreme : appareil détouré vu de face, finition Vollintegrierbar", "V-ZUG Freezer V6000 60 Supreme: apparecchio scontornato visto di fronte, finitura Vollintegrierbar"), "https://www.vzug.com/at/de/produkte/kueche/kuehlschraenke/supreme-line/freezer-v6000-60-supreme--p5300600000"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "vollintegrierbar", name: "Vollintegrierbar" }),
        ]),
      }),
    ]),
    zubehoer: Object.freeze([
      Object.freeze({ slug: "v-zug-cooler-v6000-75-supreme", hinweis: T("Laut Hersteller lassen sich Kühl- und Gefrierschränke der Supreme Line zu einer Side-by-Side-Lösung kombinieren", "According to the manufacturer, Supreme Line refrigerators and freezers can be combined side by side", "Selon le fabricant, réfrigérateurs et congélateurs Supreme Line se combinent en side-by-side", "Secondo il produttore, frigoriferi e congelatori Supreme Line si combinano in side-by-side") }),
      Object.freeze({ slug: "v-zug-cooler-v6000-90-supreme", hinweis: T("Laut Hersteller lassen sich Kühl- und Gefrierschränke der Supreme Line zu einer Side-by-Side-Lösung kombinieren", "According to the manufacturer, Supreme Line refrigerators and freezers can be combined side by side", "Selon le fabricant, réfrigérateurs et congélateurs Supreme Line se combinent en side-by-side", "Secondo il produttore, frigoriferi e congelatori Supreme Line si combinano in side-by-side") }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/kuehlschraenke/supreme-line/freezer-v6000-60-supreme--p5300600000",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/kuehlschraenke/supreme-line/freezer-v6000-60-supreme--p5300600000"]),
    stand: STAND,
  }),
  // ---------------------------------------------------------------- weinklima
  Object.freeze({
    slug: "v-zug-winecooler-v4000-8u",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "weinklima",
    name: "WineCooler V4000 8U",
    serie: "V4000",
    kurz: T("Weinschrank WineCooler V4000 8U für eine Nische mit Normbreite 60 cm und Normhöhe 82 cm. Ausführungen und Datenblatt beim Hersteller.", "Wine cabinet WineCooler V4000 8U for a niche with a standard width of 60 cm and height of 82 cm. Versions and data sheet on the manufacturer’s website.", "Cave à vin WineCooler V4000 8U pour une niche de largeur normalisée 60 cm et de hauteur 82 cm. Versions et fiche technique sur le site du fabricant.", "Cantinetta per vini WineCooler V4000 8U per una nicchia di larghezza standard 60 cm e altezza 82 cm. Versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: Spiegelglas Schwarz", "Finishes: Spiegelglas Schwarz", "Finitions: Spiegelglas Schwarz", "Finiture: Spiegelglas Schwarz"),
      T("Nutzinhalt gesamt 95 l", "Total net capacity 95 l", "Volume utile total 95 l", "Capacità utile totale 95 l"),
      T("Luftschallemissionsklasse B", "Airborne noise emission class B", "Classe d’émission de bruit aérien B", "Classe di emissione di rumore aereo B"),
      T("Nennleistung 330,0 W", "Rated power 330.0 W", "Puissance nominale 330,0 W", "Potenza nominale 330,0 W"),
      T("Garantie laut Hersteller: 2 + 8 Jahre", "Warranty according to the manufacturer: 2 + 8 years", "Garantie selon le fabricant : 2 + 8 ans", "Garanzia secondo il produttore: 2 + 8 anni"),
      T("Daten für Art.-Nr. 5115800002; 1 Ausführung auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 5115800002; 1 version on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 5115800002 ; 1 version sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 5115800002; 1 versione su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "597 mm"), mass("hoehe", "819 mm"), mass("tiefe", "580 mm"), mass("nische", "B 600 mm · H 820–880 mm · T ≥ 565 mm")]),
    bilder: Object.freeze([
      bild("v-zug-winecooler-v4000-8u-1.webp", 1200, 1200, T("V-ZUG WineCooler V4000 8U: Gerät freigestellt von vorn, Design Spiegelglas Schwarz", "V-ZUG WineCooler V4000 8U: cut-out front view of the appliance, Spiegelglas Schwarz finish", "V-ZUG WineCooler V4000 8U : appareil détouré vu de face, finition Spiegelglas Schwarz", "V-ZUG WineCooler V4000 8U: apparecchio scontornato visto di fronte, finitura Spiegelglas Schwarz"), "https://www.vzug.com/at/de/produkte/kueche/weinschraenke/weinschraenke/winecooler-v4000-8u--p5115800002"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "spiegelglas-schwarz", name: "Spiegelglas Schwarz" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/weinschraenke/weinschraenke/winecooler-v4000-8u--p5115800002",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/weinschraenke/weinschraenke/winecooler-v4000-8u--p5115800002"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "v-zug-winecooler-v4000-45",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "weinklima",
    name: "WineCooler V4000 45",
    serie: "V4000",
    kurz: T("Weinschrank WineCooler V4000 45 für eine Nische mit Normbreite 60 cm und Normhöhe 45 cm. Erhältlich in 3 Designs; Ausführungen und Datenblatt beim Hersteller.", "Wine cabinet WineCooler V4000 45 for a niche with a standard width of 60 cm and height of 45 cm. Available in 3 finishes; versions and data sheet on the manufacturer’s website.", "Cave à vin WineCooler V4000 45 pour une niche de largeur normalisée 60 cm et de hauteur 45 cm. Disponible en 3 finitions ; versions et fiche technique sur le site du fabricant.", "Cantinetta per vini WineCooler V4000 45 per una nicchia di larghezza standard 60 cm e altezza 45 cm. Disponibile in 3 finiture; versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum", "Finishes: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum", "Finitions: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum", "Finiture: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum"),
      T("Nutzinhalt gesamt 47 l", "Total net capacity 47 l", "Volume utile total 47 l", "Capacità utile totale 47 l"),
      T("Max. Fachhöhe innen 134 mm", "Max. compartment height inside 134 mm", "Hauteur max. de compartiment 134 mm", "Altezza max. del ripiano interno 134 mm"),
      T("Luftschallemissionsklasse B", "Airborne noise emission class B", "Classe d’émission de bruit aérien B", "Classe di emissione di rumore aereo B"),
      T("Nennleistung 40,0 W", "Rated power 40.0 W", "Puissance nominale 40,0 W", "Potenza nominale 40,0 W"),
      T("Energieeffizienzklasse D", "Energy efficiency class D", "Classe d’efficacité énergétique D", "Classe di efficienza energetica D"),
      T("Garantie laut Hersteller: 2 + 8 Jahre", "Warranty according to the manufacturer: 2 + 8 years", "Garantie selon le fabricant : 2 + 8 ans", "Garanzia secondo il produttore: 2 + 8 anni"),
      T("Daten für Art.-Nr. 5111300006; 6 Ausführungen auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 5111300006; 6 versions on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 5111300006 ; 6 versions sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 5111300006; 6 versioni su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "596 mm"), mass("hoehe", "454 mm"), mass("tiefe", "566 mm"), mass("nische", "B 560–568 mm · H 450–452 mm · T ≥ 550 mm")]),
    bilder: Object.freeze([
      bild("v-zug-winecooler-v4000-45-1.webp", 1200, 1200, T("V-ZUG WineCooler V4000 45: Gerät freigestellt von vorn, Design Spiegelglas Schwarz", "V-ZUG WineCooler V4000 45: cut-out front view of the appliance, Spiegelglas Schwarz finish", "V-ZUG WineCooler V4000 45 : appareil détouré vu de face, finition Spiegelglas Schwarz", "V-ZUG WineCooler V4000 45: apparecchio scontornato visto di fronte, finitura Spiegelglas Schwarz"), "https://www.vzug.com/at/de/produkte/kueche/weinschraenke/weinschraenke/winecooler-v4000-45--p5111300006"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "spiegelglas-pearl", name: "Spiegelglas Pearl" }),
          Object.freeze({ id: "spiegelglas-schwarz", name: "Spiegelglas Schwarz" }),
          Object.freeze({ id: "spiegelglas-platinum", name: "Spiegelglas Platinum" }),
        ]),
      }),
    ]),
    zubehoer: Object.freeze([
      Object.freeze({ slug: "v-zug-combair-v2000-45", hinweis: T("Laut Hersteller mit 45 cm Höhe mit V-ZUG Backöfen und Steamern kombinierbar", "According to the manufacturer, its 45 cm height combines with V-ZUG ovens and steamers", "Selon le fabricant, sa hauteur de 45 cm se combine avec les fours et steamers V-ZUG", "Secondo il produttore, l’altezza di 45 cm si abbina a forni e steamer V-ZUG") }),
      Object.freeze({ slug: "v-zug-combair-v4000-45", hinweis: T("Laut Hersteller mit 45 cm Höhe mit V-ZUG Backöfen und Steamern kombinierbar", "According to the manufacturer, its 45 cm height combines with V-ZUG ovens and steamers", "Selon le fabricant, sa hauteur de 45 cm se combine avec les fours et steamers V-ZUG", "Secondo il produttore, l’altezza di 45 cm si abbina a forni e steamer V-ZUG") }),
      Object.freeze({ slug: "v-zug-combair-v4000-45p", hinweis: T("Laut Hersteller mit 45 cm Höhe mit V-ZUG Backöfen und Steamern kombinierbar", "According to the manufacturer, its 45 cm height combines with V-ZUG ovens and steamers", "Selon le fabricant, sa hauteur de 45 cm se combine avec les fours et steamers V-ZUG", "Secondo il produttore, l’altezza di 45 cm si abbina a forni e steamer V-ZUG") }),
      Object.freeze({ slug: "v-zug-combair-v6000-45", hinweis: T("Laut Hersteller mit 45 cm Höhe mit V-ZUG Backöfen und Steamern kombinierbar", "According to the manufacturer, its 45 cm height combines with V-ZUG ovens and steamers", "Selon le fabricant, sa hauteur de 45 cm se combine avec les fours et steamers V-ZUG", "Secondo il produttore, l’altezza di 45 cm si abbina a forni e steamer V-ZUG") }),
      Object.freeze({ slug: "v-zug-combair-v6000-45p", hinweis: T("Laut Hersteller mit 45 cm Höhe mit V-ZUG Backöfen und Steamern kombinierbar", "According to the manufacturer, its 45 cm height combines with V-ZUG ovens and steamers", "Selon le fabricant, sa hauteur de 45 cm se combine avec les fours et steamers V-ZUG", "Secondo il produttore, l’altezza di 45 cm si abbina a forni e steamer V-ZUG") }),
      Object.freeze({ slug: "v-zug-combisteamer-v4000-45", hinweis: T("Laut Hersteller mit 45 cm Höhe mit V-ZUG Backöfen und Steamern kombinierbar", "According to the manufacturer, its 45 cm height combines with V-ZUG ovens and steamers", "Selon le fabricant, sa hauteur de 45 cm se combine avec les fours et steamers V-ZUG", "Secondo il produttore, l’altezza di 45 cm si abbina a forni e steamer V-ZUG") }),
      Object.freeze({ slug: "v-zug-combisteamer-v6000-45", hinweis: T("Laut Hersteller mit 45 cm Höhe mit V-ZUG Backöfen und Steamern kombinierbar", "According to the manufacturer, its 45 cm height combines with V-ZUG ovens and steamers", "Selon le fabricant, sa hauteur de 45 cm se combine avec les fours et steamers V-ZUG", "Secondo il produttore, l’altezza di 45 cm si abbina a forni e steamer V-ZUG") }),
      Object.freeze({ slug: "v-zug-combisteamer-v6000-45f", hinweis: T("Laut Hersteller mit 45 cm Höhe mit V-ZUG Backöfen und Steamern kombinierbar", "According to the manufacturer, its 45 cm height combines with V-ZUG ovens and steamers", "Selon le fabricant, sa hauteur de 45 cm se combine avec les fours et steamers V-ZUG", "Secondo il produttore, l’altezza di 45 cm si abbina a forni e steamer V-ZUG") }),
      Object.freeze({ slug: "v-zug-combisteamer-v6000-45l-grand", hinweis: T("Laut Hersteller mit 45 cm Höhe mit V-ZUG Backöfen und Steamern kombinierbar", "According to the manufacturer, its 45 cm height combines with V-ZUG ovens and steamers", "Selon le fabricant, sa hauteur de 45 cm se combine avec les fours et steamers V-ZUG", "Secondo il produttore, l’altezza di 45 cm si abbina a forni e steamer V-ZUG") }),
      Object.freeze({ slug: "v-zug-combisteamer-v6000-45m-powersteam", hinweis: T("Laut Hersteller mit 45 cm Höhe mit V-ZUG Backöfen und Steamern kombinierbar", "According to the manufacturer, its 45 cm height combines with V-ZUG ovens and steamers", "Selon le fabricant, sa hauteur de 45 cm se combine avec les fours et steamers V-ZUG", "Secondo il produttore, l’altezza di 45 cm si abbina a forni e steamer V-ZUG") }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/weinschraenke/weinschraenke/winecooler-v4000-45--p5111300006",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/weinschraenke/weinschraenke/winecooler-v4000-45--p5111300006"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "v-zug-winecooler-v4000-90",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "weinklima",
    name: "WineCooler V4000 90",
    serie: "V4000",
    kurz: T("Weinschrank WineCooler V4000 90 für eine Nische mit Normbreite 60 cm und Normhöhe 90,6 cm. Erhältlich in 3 Designs; Ausführungen und Datenblatt beim Hersteller.", "Wine cabinet WineCooler V4000 90 for a niche with a standard width of 60 cm and height of 90.6 cm. Available in 3 finishes; versions and data sheet on the manufacturer’s website.", "Cave à vin WineCooler V4000 90 pour une niche de largeur normalisée 60 cm et de hauteur 90,6 cm. Disponible en 3 finitions ; versions et fiche technique sur le site du fabricant.", "Cantinetta per vini WineCooler V4000 90 per una nicchia di larghezza standard 60 cm e altezza 90,6 cm. Disponibile in 3 finiture; versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum", "Finishes: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum", "Finitions: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum", "Finiture: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum"),
      T("Nutzinhalt gesamt 131 l", "Total net capacity 131 l", "Volume utile total 131 l", "Capacità utile totale 131 l"),
      T("Max. Fachhöhe innen 204 mm", "Max. compartment height inside 204 mm", "Hauteur max. de compartiment 204 mm", "Altezza max. del ripiano interno 204 mm"),
      T("Luftschallemissionsklasse B", "Airborne noise emission class B", "Classe d’émission de bruit aérien B", "Classe di emissione di rumore aereo B"),
      T("Nennleistung 50,0 W", "Rated power 50.0 W", "Puissance nominale 50,0 W", "Potenza nominale 50,0 W"),
      T("Energieeffizienzklasse D", "Energy efficiency class D", "Classe d’efficacité énergétique D", "Classe di efficienza energetica D"),
      T("Garantie laut Hersteller: 2 + 8 Jahre", "Warranty according to the manufacturer: 2 + 8 years", "Garantie selon le fabricant : 2 + 8 ans", "Garanzia secondo il produttore: 2 + 8 anni"),
      T("Daten für Art.-Nr. 5110200023; 6 Ausführungen auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 5110200023; 6 versions on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 5110200023 ; 6 versions sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 5110200023; 6 versioni su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "596 mm"), mass("hoehe", "910 mm"), mass("tiefe", "566 mm"), mass("nische", "B 560–568 mm · H 906–908 mm · T ≥ 550 mm")]),
    bilder: Object.freeze([
      bild("v-zug-winecooler-v4000-90-1.webp", 1200, 1200, T("V-ZUG WineCooler V4000 90: Gerät freigestellt von vorn, Design Spiegelglas Schwarz", "V-ZUG WineCooler V4000 90: cut-out front view of the appliance, Spiegelglas Schwarz finish", "V-ZUG WineCooler V4000 90 : appareil détouré vu de face, finition Spiegelglas Schwarz", "V-ZUG WineCooler V4000 90: apparecchio scontornato visto di fronte, finitura Spiegelglas Schwarz"), "https://www.vzug.com/at/de/produkte/kueche/weinschraenke/weinschraenke/winecooler-v4000-90--p5110200023"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "spiegelglas-pearl", name: "Spiegelglas Pearl" }),
          Object.freeze({ id: "spiegelglas-schwarz", name: "Spiegelglas Schwarz" }),
          Object.freeze({ id: "spiegelglas-platinum", name: "Spiegelglas Platinum" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/weinschraenke/weinschraenke/winecooler-v4000-90--p5110200023",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/weinschraenke/weinschraenke/winecooler-v4000-90--p5110200023"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "v-zug-winecooler-v6000-60-supreme",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "weinklima",
    name: "WineCooler V6000 60 Supreme",
    serie: "V6000 Supreme Line",
    kurz: T("Weinschrank der Supreme Line WineCooler V6000 60 Supreme für eine Nische mit Normbreite 60 cm und Normhöhe 205 cm. Ausführungen und Datenblatt beim Hersteller.", "Supreme Line wine cabinet WineCooler V6000 60 Supreme for a niche with a standard width of 60 cm and height of 205 cm. Versions and data sheet on the manufacturer’s website.", "Cave à vin Supreme Line WineCooler V6000 60 Supreme pour une niche de largeur normalisée 60 cm et de hauteur 205 cm. Versions et fiche technique sur le site du fabricant.", "Cantinetta per vini Supreme Line WineCooler V6000 60 Supreme per una nicchia di larghezza standard 60 cm e altezza 205 cm. Versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: Vollintegrierbar", "Finishes: Vollintegrierbar", "Finitions: Vollintegrierbar", "Finiture: Vollintegrierbar"),
      T("Nutzinhalt gesamt 352 l", "Total net capacity 352 l", "Volume utile total 352 l", "Capacità utile totale 352 l"),
      T("Luftschallemissionsklasse C", "Airborne noise emission class C", "Classe d’émission de bruit aérien C", "Classe di emissione di rumore aereo C"),
      T("Nennleistung 330,0 W", "Rated power 330.0 W", "Puissance nominale 330,0 W", "Potenza nominale 330,0 W"),
      T("Garantie laut Hersteller: 2 + 8 Jahre", "Warranty according to the manufacturer: 2 + 8 years", "Garantie selon le fabricant : 2 + 8 ans", "Garanzia secondo il produttore: 2 + 8 anni"),
      T("Daten für Art.-Nr. 5115400004; 2 Ausführungen auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 5115400004; 2 versions on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 5115400004 ; 2 versions sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 5115400004; 2 versioni su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "587 mm"), mass("hoehe", "2050 mm"), mass("tiefe", "610 mm"), mass("nische", "B 600 mm · H 2064–2089 mm · T ≥ 650 mm")]),
    bilder: Object.freeze([
      bild("v-zug-winecooler-v6000-60-supreme-1.webp", 1200, 1200, T("V-ZUG WineCooler V6000 60 Supreme: Gerät freigestellt von vorn, Design Vollintegrierbar", "V-ZUG WineCooler V6000 60 Supreme: cut-out front view of the appliance, Vollintegrierbar finish", "V-ZUG WineCooler V6000 60 Supreme : appareil détouré vu de face, finition Vollintegrierbar", "V-ZUG WineCooler V6000 60 Supreme: apparecchio scontornato visto di fronte, finitura Vollintegrierbar"), "https://www.vzug.com/at/de/produkte/kueche/weinschraenke/supreme-line/winecooler-v6000-60-supreme--p5115400004"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "vollintegrierbar", name: "Vollintegrierbar" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/weinschraenke/supreme-line/winecooler-v6000-60-supreme--p5115400004",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/weinschraenke/supreme-line/winecooler-v6000-60-supreme--p5115400004"]),
    stand: STAND,
  }),
  // ---------------------------------------------------------------- geschirrspueler
  Object.freeze({
    slug: "v-zug-adoraspuelen-v4000-v",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "geschirrspueler",
    name: "AdoraSpülen V4000 V",
    serie: "V4000",
    kurz: T("Geschirrspüler AdoraSpülen V4000 V mit Normbreite 60 cm. Ausführungen und Datenblatt beim Hersteller.", "Dishwasher AdoraSpülen V4000 V with a standard width of 60 cm. Versions and data sheet on the manufacturer’s website.", "Lave-vaisselle AdoraSpülen V4000 V de largeur normalisée 60 cm. Versions et fiche technique sur le site du fabricant.", "Lavastoviglie AdoraSpülen V4000 V di larghezza standard 60 cm. Versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: Vollintegrierbar", "Finishes: Vollintegrierbar", "Finitions: Vollintegrierbar", "Finiture: Vollintegrierbar"),
      T("Wasserverbrauch pro Standardzyklus 9,8 l", "Water consumption per standard cycle 9.8 l", "Consommation d’eau par cycle standard 9,8 l", "Consumo d’acqua per ciclo standard 9,8 l"),
      T("Luftschallemissionsklasse B", "Airborne noise emission class B", "Classe d’émission de bruit aérien B", "Classe di emissione di rumore aereo B"),
      T("Nennleistung 2,2 kW", "Rated power 2.2 kW", "Puissance nominale 2,2 kW", "Potenza nominale 2,2 kW"),
      T("Daten für Art.-Nr. 4116600008; 1 Ausführung auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 4116600008; 1 version on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 4116600008 ; 1 version sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 4116600008; 1 versione su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "596 mm"), mass("hoehe", "780 mm"), mass("tiefe", "550 mm"), mass("nische", "B 600 mm · H 786–902 mm · T ≥ 580 mm")]),
    bilder: Object.freeze([
      bild("v-zug-adoraspuelen-v4000-v-1.webp", 1200, 1200, T("V-ZUG AdoraSpülen V4000 V: Gerät freigestellt von vorn, Design Vollintegrierbar", "V-ZUG AdoraSpülen V4000 V: cut-out front view of the appliance, Vollintegrierbar finish", "V-ZUG AdoraSpülen V4000 V : appareil détouré vu de face, finition Vollintegrierbar", "V-ZUG AdoraSpülen V4000 V: apparecchio scontornato visto di fronte, finitura Vollintegrierbar"), "https://www.vzug.com/at/de/produkte/kueche/geschirrspueler/allrounder/adoraspuelen-v4000-v--p4116600008"),
      bild("v-zug-adoraspuelen-v4000-v-2.webp", 1200, 1200, T("V-ZUG AdoraSpülen V4000 V: Korbsystem freigestellt, ohne Gerätegehäuse", "V-ZUG AdoraSpülen V4000 V: cut-out view of the basket system without the appliance body", "V-ZUG AdoraSpülen V4000 V : paniers détourés, sans la carrosserie de l’appareil", "V-ZUG AdoraSpülen V4000 V: sistema di cestelli scontornato, senza scocca"), "https://www.vzug.com/at/de/produkte/kueche/geschirrspueler/allrounder/adoraspuelen-v4000-v--p4116600008", "detail"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "vollintegrierbar", name: "Vollintegrierbar" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/geschirrspueler/allrounder/adoraspuelen-v4000-v--p4116600008",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/geschirrspueler/allrounder/adoraspuelen-v4000-v--p4116600008"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "v-zug-adoraspuelen-v4000-vgb",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "geschirrspueler",
    name: "AdoraSpülen V4000 VGB",
    serie: "V4000",
    kurz: T("Geschirrspüler AdoraSpülen V4000 VGB mit Normbreite 60 cm. Ausführungen und Datenblatt beim Hersteller.", "Dishwasher AdoraSpülen V4000 VGB with a standard width of 60 cm. Versions and data sheet on the manufacturer’s website.", "Lave-vaisselle AdoraSpülen V4000 VGB de largeur normalisée 60 cm. Versions et fiche technique sur le site du fabricant.", "Lavastoviglie AdoraSpülen V4000 VGB di larghezza standard 60 cm. Versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: Vollintegrierbar", "Finishes: Vollintegrierbar", "Finitions: Vollintegrierbar", "Finiture: Vollintegrierbar"),
      T("Wasserverbrauch pro Standardzyklus 9,3 l", "Water consumption per standard cycle 9.3 l", "Consommation d’eau par cycle standard 9,3 l", "Consumo d’acqua per ciclo standard 9,3 l"),
      T("Luftschallemissionsklasse A", "Airborne noise emission class A", "Classe d’émission de bruit aérien A", "Classe di emissione di rumore aereo A"),
      T("Nennleistung 3,2 kW", "Rated power 3.2 kW", "Puissance nominale 3,2 kW", "Potenza nominale 3,2 kW"),
      T("Daten für Art.-Nr. 4116800006; 1 Ausführung auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 4116800006; 1 version on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 4116800006 ; 1 version sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 4116800006; 1 versione su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "596 mm"), mass("hoehe", "845 mm"), mass("tiefe", "550 mm"), mass("nische", "B 600 mm · H 851–967 mm · T ≥ 580 mm")]),
    bilder: Object.freeze([
      bild("v-zug-adoraspuelen-v4000-vgb-1.webp", 1200, 1200, T("V-ZUG AdoraSpülen V4000 VGB: Gerät freigestellt von vorn, Design Vollintegrierbar", "V-ZUG AdoraSpülen V4000 VGB: cut-out front view of the appliance, Vollintegrierbar finish", "V-ZUG AdoraSpülen V4000 VGB : appareil détouré vu de face, finition Vollintegrierbar", "V-ZUG AdoraSpülen V4000 VGB: apparecchio scontornato visto di fronte, finitura Vollintegrierbar"), "https://www.vzug.com/at/de/produkte/kueche/geschirrspueler/allrounder/adoraspuelen-v4000-vgb--p4116800006"),
      bild("v-zug-adoraspuelen-v4000-vgb-2.webp", 1200, 1200, T("V-ZUG AdoraSpülen V4000 VGB: Korbsystem freigestellt, ohne Gerätegehäuse", "V-ZUG AdoraSpülen V4000 VGB: cut-out view of the basket system without the appliance body", "V-ZUG AdoraSpülen V4000 VGB : paniers détourés, sans la carrosserie de l’appareil", "V-ZUG AdoraSpülen V4000 VGB: sistema di cestelli scontornato, senza scocca"), "https://www.vzug.com/at/de/produkte/kueche/geschirrspueler/allrounder/adoraspuelen-v4000-vgb--p4116800006", "detail"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "vollintegrierbar", name: "Vollintegrierbar" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/geschirrspueler/allrounder/adoraspuelen-v4000-vgb--p4116800006",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/geschirrspueler/allrounder/adoraspuelen-v4000-vgb--p4116800006"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "v-zug-adoraspuelen-v6000-v",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "geschirrspueler",
    name: "AdoraSpülen V6000 V",
    serie: "V6000",
    kurz: T("Geschirrspüler AdoraSpülen V6000 V mit Normbreite 60 cm. Ausführungen und Datenblatt beim Hersteller.", "Dishwasher AdoraSpülen V6000 V with a standard width of 60 cm. Versions and data sheet on the manufacturer’s website.", "Lave-vaisselle AdoraSpülen V6000 V de largeur normalisée 60 cm. Versions et fiche technique sur le site du fabricant.", "Lavastoviglie AdoraSpülen V6000 V di larghezza standard 60 cm. Versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: Vollintegrierbar", "Finishes: Vollintegrierbar", "Finitions: Vollintegrierbar", "Finiture: Vollintegrierbar"),
      T("Wasserverbrauch pro Standardzyklus 6,5 l", "Water consumption per standard cycle 6.5 l", "Consommation d’eau par cycle standard 6,5 l", "Consumo d’acqua per ciclo standard 6,5 l"),
      T("Luftschallemissionsklasse A", "Airborne noise emission class A", "Classe d’émission de bruit aérien A", "Classe di emissione di rumore aereo A"),
      T("Nennleistung 3,2 kW", "Rated power 3.2 kW", "Puissance nominale 3,2 kW", "Potenza nominale 3,2 kW"),
      T("Daten für Art.-Nr. 4117100009; 1 Ausführung auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 4117100009; 1 version on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 4117100009 ; 1 version sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 4117100009; 1 versione su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "596 mm"), mass("hoehe", "780 mm"), mass("tiefe", "550 mm"), mass("nische", "B 600 mm · H 786–902 mm · T ≥ 580 mm")]),
    bilder: Object.freeze([
      bild("v-zug-adoraspuelen-v6000-v-1.webp", 1200, 1200, T("V-ZUG AdoraSpülen V6000 V: Gerät freigestellt von vorn, Design Vollintegrierbar", "V-ZUG AdoraSpülen V6000 V: cut-out front view of the appliance, Vollintegrierbar finish", "V-ZUG AdoraSpülen V6000 V : appareil détouré vu de face, finition Vollintegrierbar", "V-ZUG AdoraSpülen V6000 V: apparecchio scontornato visto di fronte, finitura Vollintegrierbar"), "https://www.vzug.com/at/de/produkte/kueche/geschirrspueler/hocheffizient/adoraspuelen-v6000-v--p4117100009"),
      bild("v-zug-adoraspuelen-v6000-v-2.webp", 1200, 1200, T("V-ZUG AdoraSpülen V6000 V: Korbsystem freigestellt, ohne Gerätegehäuse", "V-ZUG AdoraSpülen V6000 V: cut-out view of the basket system without the appliance body", "V-ZUG AdoraSpülen V6000 V : paniers détourés, sans la carrosserie de l’appareil", "V-ZUG AdoraSpülen V6000 V: sistema di cestelli scontornato, senza scocca"), "https://www.vzug.com/at/de/produkte/kueche/geschirrspueler/hocheffizient/adoraspuelen-v6000-v--p4117100009", "detail"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "vollintegrierbar", name: "Vollintegrierbar" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/geschirrspueler/hocheffizient/adoraspuelen-v6000-v--p4117100009",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/geschirrspueler/hocheffizient/adoraspuelen-v6000-v--p4117100009"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "v-zug-adoraspuelen-v6000-vg",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "geschirrspueler",
    name: "AdoraSpülen V6000 VG",
    serie: "V6000",
    kurz: T("Geschirrspüler AdoraSpülen V6000 VG mit Normbreite 60 cm. Ausführungen und Datenblatt beim Hersteller.", "Dishwasher AdoraSpülen V6000 VG with a standard width of 60 cm. Versions and data sheet on the manufacturer’s website.", "Lave-vaisselle AdoraSpülen V6000 VG de largeur normalisée 60 cm. Versions et fiche technique sur le site du fabricant.", "Lavastoviglie AdoraSpülen V6000 VG di larghezza standard 60 cm. Versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: Vollintegrierbar", "Finishes: Vollintegrierbar", "Finitions: Vollintegrierbar", "Finiture: Vollintegrierbar"),
      T("Wasserverbrauch pro Standardzyklus 6,5 l", "Water consumption per standard cycle 6.5 l", "Consommation d’eau par cycle standard 6,5 l", "Consumo d’acqua per ciclo standard 6,5 l"),
      T("Luftschallemissionsklasse A", "Airborne noise emission class A", "Classe d’émission de bruit aérien A", "Classe di emissione di rumore aereo A"),
      T("Nennleistung 3,2 kW", "Rated power 3.2 kW", "Puissance nominale 3,2 kW", "Potenza nominale 3,2 kW"),
      T("Daten für Art.-Nr. 4117200006; 1 Ausführung auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 4117200006; 1 version on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 4117200006 ; 1 version sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 4117200006; 1 versione su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "596 mm"), mass("hoehe", "845 mm"), mass("tiefe", "550 mm"), mass("nische", "B 600 mm · H 851–967 mm · T ≥ 580 mm")]),
    bilder: Object.freeze([
      bild("v-zug-adoraspuelen-v6000-vg-1.webp", 1200, 1200, T("V-ZUG AdoraSpülen V6000 VG: Gerät freigestellt von vorn, Design Vollintegrierbar", "V-ZUG AdoraSpülen V6000 VG: cut-out front view of the appliance, Vollintegrierbar finish", "V-ZUG AdoraSpülen V6000 VG : appareil détouré vu de face, finition Vollintegrierbar", "V-ZUG AdoraSpülen V6000 VG: apparecchio scontornato visto di fronte, finitura Vollintegrierbar"), "https://www.vzug.com/at/de/produkte/kueche/geschirrspueler/hocheffizient/adoraspuelen-v6000-vg--p4117200006"),
      bild("v-zug-adoraspuelen-v6000-vg-2.webp", 1200, 1200, T("V-ZUG AdoraSpülen V6000 VG: Korbsystem freigestellt, ohne Gerätegehäuse", "V-ZUG AdoraSpülen V6000 VG: cut-out view of the basket system without the appliance body", "V-ZUG AdoraSpülen V6000 VG : paniers détourés, sans la carrosserie de l’appareil", "V-ZUG AdoraSpülen V6000 VG: sistema di cestelli scontornato, senza scocca"), "https://www.vzug.com/at/de/produkte/kueche/geschirrspueler/hocheffizient/adoraspuelen-v6000-vg--p4117200006", "detail"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "vollintegrierbar", name: "Vollintegrierbar" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/geschirrspueler/hocheffizient/adoraspuelen-v6000-vg--p4117200006",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/geschirrspueler/hocheffizient/adoraspuelen-v6000-vg--p4117200006"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "v-zug-adoraspuelen-v6000-vgb",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "geschirrspueler",
    name: "AdoraSpülen V6000 VGB",
    serie: "V6000",
    kurz: T("Geschirrspüler AdoraSpülen V6000 VGB mit Normbreite 60 cm. Ausführungen und Datenblatt beim Hersteller.", "Dishwasher AdoraSpülen V6000 VGB with a standard width of 60 cm. Versions and data sheet on the manufacturer’s website.", "Lave-vaisselle AdoraSpülen V6000 VGB de largeur normalisée 60 cm. Versions et fiche technique sur le site du fabricant.", "Lavastoviglie AdoraSpülen V6000 VGB di larghezza standard 60 cm. Versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: Vollintegrierbar", "Finishes: Vollintegrierbar", "Finitions: Vollintegrierbar", "Finiture: Vollintegrierbar"),
      T("Wasserverbrauch pro Standardzyklus 6,7 l", "Water consumption per standard cycle 6.7 l", "Consommation d’eau par cycle standard 6,7 l", "Consumo d’acqua per ciclo standard 6,7 l"),
      T("Luftschallemissionsklasse A", "Airborne noise emission class A", "Classe d’émission de bruit aérien A", "Classe di emissione di rumore aereo A"),
      T("Nennleistung 3,2 kW", "Rated power 3.2 kW", "Puissance nominale 3,2 kW", "Potenza nominale 3,2 kW"),
      T("Daten für Art.-Nr. 4114700008; 1 Ausführung auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 4114700008; 1 version on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 4114700008 ; 1 version sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 4114700008; 1 versione su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "596 mm"), mass("hoehe", "845 mm"), mass("tiefe", "550 mm"), mass("nische", "B 600 mm · H 851–967 mm · T ≥ 580 mm")]),
    bilder: Object.freeze([
      bild("v-zug-adoraspuelen-v6000-vgb-1.webp", 1200, 1200, T("V-ZUG AdoraSpülen V6000 VGB: Gerät freigestellt von vorn, Design Vollintegrierbar", "V-ZUG AdoraSpülen V6000 VGB: cut-out front view of the appliance, Vollintegrierbar finish", "V-ZUG AdoraSpülen V6000 VGB : appareil détouré vu de face, finition Vollintegrierbar", "V-ZUG AdoraSpülen V6000 VGB: apparecchio scontornato visto di fronte, finitura Vollintegrierbar"), "https://www.vzug.com/at/de/produkte/kueche/geschirrspueler/hocheffizient/adoraspuelen-v6000-vgb--p4114700008"),
      bild("v-zug-adoraspuelen-v6000-vgb-2.webp", 1200, 1200, T("V-ZUG AdoraSpülen V6000 VGB: Korbsystem freigestellt, ohne Gerätegehäuse", "V-ZUG AdoraSpülen V6000 VGB: cut-out view of the basket system without the appliance body", "V-ZUG AdoraSpülen V6000 VGB : paniers détourés, sans la carrosserie de l’appareil", "V-ZUG AdoraSpülen V6000 VGB: sistema di cestelli scontornato, senza scocca"), "https://www.vzug.com/at/de/produkte/kueche/geschirrspueler/hocheffizient/adoraspuelen-v6000-vgb--p4114700008", "detail"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "vollintegrierbar", name: "Vollintegrierbar" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/geschirrspueler/hocheffizient/adoraspuelen-v6000-vgb--p4114700008",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/geschirrspueler/hocheffizient/adoraspuelen-v6000-vgb--p4114700008"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "v-zug-adoraspuelen-v6000-vgbo",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "geschirrspueler",
    name: "AdoraSpülen V6000 VGBO",
    serie: "V6000",
    kurz: T("Geschirrspüler AdoraSpülen V6000 VGBO mit Normbreite 60 cm. Ausführungen und Datenblatt beim Hersteller.", "Dishwasher AdoraSpülen V6000 VGBO with a standard width of 60 cm. Versions and data sheet on the manufacturer’s website.", "Lave-vaisselle AdoraSpülen V6000 VGBO de largeur normalisée 60 cm. Versions et fiche technique sur le site du fabricant.", "Lavastoviglie AdoraSpülen V6000 VGBO di larghezza standard 60 cm. Versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: Vollintegrierbar", "Finishes: Vollintegrierbar", "Finitions: Vollintegrierbar", "Finiture: Vollintegrierbar"),
      T("Wasserverbrauch pro Standardzyklus 6,7 l", "Water consumption per standard cycle 6.7 l", "Consommation d’eau par cycle standard 6,7 l", "Consumo d’acqua per ciclo standard 6,7 l"),
      T("Luftschallemissionsklasse A", "Airborne noise emission class A", "Classe d’émission de bruit aérien A", "Classe di emissione di rumore aereo A"),
      T("Nennleistung 3,2 kW", "Rated power 3.2 kW", "Puissance nominale 3,2 kW", "Potenza nominale 3,2 kW"),
      T("Daten für Art.-Nr. 4117700006; 1 Ausführung auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 4117700006; 1 version on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 4117700006 ; 1 version sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 4117700006; 1 versione su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "596 mm"), mass("hoehe", "845 mm"), mass("tiefe", "550 mm"), mass("nische", "B 600 mm · H 851–967 mm · T ≥ 580 mm")]),
    bilder: Object.freeze([
      bild("v-zug-adoraspuelen-v6000-vgbo-1.webp", 1200, 1200, T("V-ZUG AdoraSpülen V6000 VGBO: Gerät freigestellt von vorn, Design Vollintegrierbar", "V-ZUG AdoraSpülen V6000 VGBO: cut-out front view of the appliance, Vollintegrierbar finish", "V-ZUG AdoraSpülen V6000 VGBO : appareil détouré vu de face, finition Vollintegrierbar", "V-ZUG AdoraSpülen V6000 VGBO: apparecchio scontornato visto di fronte, finitura Vollintegrierbar"), "https://www.vzug.com/at/de/produkte/kueche/geschirrspueler/hocheffizient/adoraspuelen-v6000-vgbo--p4117700006"),
      bild("v-zug-adoraspuelen-v6000-vgbo-2.webp", 1200, 1200, T("V-ZUG AdoraSpülen V6000 VGBO: Korbsystem freigestellt, ohne Gerätegehäuse", "V-ZUG AdoraSpülen V6000 VGBO: cut-out view of the basket system without the appliance body", "V-ZUG AdoraSpülen V6000 VGBO : paniers détourés, sans la carrosserie de l’appareil", "V-ZUG AdoraSpülen V6000 VGBO: sistema di cestelli scontornato, senza scocca"), "https://www.vzug.com/at/de/produkte/kueche/geschirrspueler/hocheffizient/adoraspuelen-v6000-vgbo--p4117700006", "detail"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "vollintegrierbar", name: "Vollintegrierbar" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/geschirrspueler/hocheffizient/adoraspuelen-v6000-vgbo--p4117700006",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/geschirrspueler/hocheffizient/adoraspuelen-v6000-vgbo--p4117700006"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "v-zug-adoraspuelen-v6000-vw",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "geschirrspueler",
    name: "AdoraSpülen V6000 VW",
    serie: "V6000",
    kurz: T("Geschirrspüler AdoraSpülen V6000 VW mit Normbreite 60 cm. Ausführungen und Datenblatt beim Hersteller.", "Dishwasher AdoraSpülen V6000 VW with a standard width of 60 cm. Versions and data sheet on the manufacturer’s website.", "Lave-vaisselle AdoraSpülen V6000 VW de largeur normalisée 60 cm. Versions et fiche technique sur le site du fabricant.", "Lavastoviglie AdoraSpülen V6000 VW di larghezza standard 60 cm. Versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: Vollintegrierbar", "Finishes: Vollintegrierbar", "Finitions: Vollintegrierbar", "Finiture: Vollintegrierbar"),
      T("Wasserverbrauch pro Standardzyklus 8,6 l", "Water consumption per standard cycle 8.6 l", "Consommation d’eau par cycle standard 8,6 l", "Consumo d’acqua per ciclo standard 8,6 l"),
      T("Luftschallemissionsklasse B", "Airborne noise emission class B", "Classe d’émission de bruit aérien B", "Classe di emissione di rumore aereo B"),
      T("Nennleistung 3,2 kW", "Rated power 3.2 kW", "Puissance nominale 3,2 kW", "Potenza nominale 3,2 kW"),
      T("Daten für Art.-Nr. 4117300005; 1 Ausführung auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 4117300005; 1 version on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 4117300005 ; 1 version sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 4117300005; 1 versione su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "596 mm"), mass("hoehe", "867 mm"), mass("tiefe", "550 mm"), mass("nische", "B 600 mm · H 870–910 mm · T ≥ 580 mm")]),
    bilder: Object.freeze([
      bild("v-zug-adoraspuelen-v6000-vw-1.webp", 1200, 1200, T("V-ZUG AdoraSpülen V6000 VW: Gerät freigestellt von vorn, Design Vollintegrierbar", "V-ZUG AdoraSpülen V6000 VW: cut-out front view of the appliance, Vollintegrierbar finish", "V-ZUG AdoraSpülen V6000 VW : appareil détouré vu de face, finition Vollintegrierbar", "V-ZUG AdoraSpülen V6000 VW: apparecchio scontornato visto di fronte, finitura Vollintegrierbar"), "https://www.vzug.com/at/de/produkte/kueche/geschirrspueler/hocheffizient/adoraspuelen-v6000-vw--p4117300005"),
      bild("v-zug-adoraspuelen-v6000-vw-2.webp", 1200, 1200, T("V-ZUG AdoraSpülen V6000 VW: Korbsystem freigestellt, ohne Gerätegehäuse", "V-ZUG AdoraSpülen V6000 VW: cut-out view of the basket system without the appliance body", "V-ZUG AdoraSpülen V6000 VW : paniers détourés, sans la carrosserie de l’appareil", "V-ZUG AdoraSpülen V6000 VW: sistema di cestelli scontornato, senza scocca"), "https://www.vzug.com/at/de/produkte/kueche/geschirrspueler/hocheffizient/adoraspuelen-v6000-vw--p4117300005", "detail"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "vollintegrierbar", name: "Vollintegrierbar" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/geschirrspueler/hocheffizient/adoraspuelen-v6000-vw--p4117300005",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/geschirrspueler/hocheffizient/adoraspuelen-v6000-vw--p4117300005"]),
    stand: STAND,
  }),
  // ---------------------------------------------------------------- waermeschublade
  Object.freeze({
    slug: "v-zug-warmingdrawer-v4000-14",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "waermeschublade",
    name: "WarmingDrawer V4000 14",
    serie: "V4000",
    kurz: T("Wärmeschublade WarmingDrawer V4000 14 für eine Nische mit Normbreite 60 cm und Normhöhe 14,4 cm. Erhältlich in 4 Designs; Ausführungen und Datenblatt beim Hersteller.", "Warming drawer WarmingDrawer V4000 14 for a niche with a standard width of 60 cm and height of 14.4 cm. Available in 4 finishes; versions and data sheet on the manufacturer’s website.", "Tiroir chauffant WarmingDrawer V4000 14 pour une niche de largeur normalisée 60 cm et de hauteur 14,4 cm. Disponible en 4 finitions ; versions et fiche technique sur le site du fabricant.", "Cassetto scaldavivande WarmingDrawer V4000 14 per una nicchia di larghezza standard 60 cm e altezza 14,4 cm. Disponibile in 4 finiture; versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum · Vollintegrierbar", "Finishes: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum · Vollintegrierbar", "Finitions: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum · Vollintegrierbar", "Finiture: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum · Vollintegrierbar"),
      T("Volumen 20 l", "Volume 20 l", "Volume 20 l", "Volume 20 l"),
      T("Fassungsvermögen Teller: 14", "Capacity, plates: 14", "Capacité en assiettes : 14", "Capacità piatti: 14"),
      T("Fassungsvermögen Menügeschirr: 6", "Capacity, menu sets: 6", "Capacité en services : 6", "Capacità servizi: 6"),
      T("Nennleistung 0,81 kW", "Rated power 0.81 kW", "Puissance nominale 0,81 kW", "Potenza nominale 0,81 kW"),
      T("Garantie laut Hersteller: 2 + 8 Jahre", "Warranty according to the manufacturer: 2 + 8 years", "Garantie selon le fabricant : 2 + 8 ans", "Garanzia secondo il produttore: 2 + 8 anni"),
      T("Daten für Art.-Nr. 3402600003; 4 Ausführungen auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 3402600003; 4 versions on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 3402600003 ; 4 versions sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 3402600003; 4 versioni su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "596 mm"), mass("hoehe", "142 mm"), mass("tiefe", "547 mm"), mass("nische", "B 600 mm · H 144 mm · T ≥ 550 mm")]),
    bilder: Object.freeze([
      bild("v-zug-warmingdrawer-v4000-14-1.webp", 1200, 1200, T("V-ZUG WarmingDrawer V4000 14: Gerät freigestellt von vorn, Design Spiegelglas Schwarz", "V-ZUG WarmingDrawer V4000 14: cut-out front view of the appliance, Spiegelglas Schwarz finish", "V-ZUG WarmingDrawer V4000 14 : appareil détouré vu de face, finition Spiegelglas Schwarz", "V-ZUG WarmingDrawer V4000 14: apparecchio scontornato visto di fronte, finitura Spiegelglas Schwarz"), "https://www.vzug.com/at/de/produkte/kueche/schubladen/waermeschubladen/warmingdrawer-v4000-14--p3402600003"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "spiegelglas-pearl", name: "Spiegelglas Pearl" }),
          Object.freeze({ id: "spiegelglas-schwarz", name: "Spiegelglas Schwarz" }),
          Object.freeze({ id: "spiegelglas-platinum", name: "Spiegelglas Platinum" }),
          Object.freeze({ id: "vollintegrierbar", name: "Vollintegrierbar" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/schubladen/waermeschubladen/warmingdrawer-v4000-14--p3402600003",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/schubladen/waermeschubladen/warmingdrawer-v4000-14--p3402600003"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "v-zug-warmingdrawer-v4000-22",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "waermeschublade",
    name: "WarmingDrawer V4000 22",
    serie: "V4000",
    kurz: T("Wärmeschublade WarmingDrawer V4000 22 für eine Nische mit Normbreite 60 cm und Normhöhe 22 cm. Erhältlich in 4 Designs; Ausführungen und Datenblatt beim Hersteller.", "Warming drawer WarmingDrawer V4000 22 for a niche with a standard width of 60 cm and height of 22 cm. Available in 4 finishes; versions and data sheet on the manufacturer’s website.", "Tiroir chauffant WarmingDrawer V4000 22 pour une niche de largeur normalisée 60 cm et de hauteur 22 cm. Disponible en 4 finitions ; versions et fiche technique sur le site du fabricant.", "Cassetto scaldavivande WarmingDrawer V4000 22 per una nicchia di larghezza standard 60 cm e altezza 22 cm. Disponibile in 4 finiture; versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum · Vollintegrierbar", "Finishes: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum · Vollintegrierbar", "Finitions: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum · Vollintegrierbar", "Finiture: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum · Vollintegrierbar"),
      T("Volumen 36,4 l", "Volume 36.4 l", "Volume 36,4 l", "Volume 36,4 l"),
      T("Fassungsvermögen Teller: 30", "Capacity, plates: 30", "Capacité en assiettes : 30", "Capacità piatti: 30"),
      T("Fassungsvermögen Menügeschirr: 15", "Capacity, menu sets: 15", "Capacité en services : 15", "Capacità servizi: 15"),
      T("Nennleistung 0,81 kW", "Rated power 0.81 kW", "Puissance nominale 0,81 kW", "Potenza nominale 0,81 kW"),
      T("Garantie laut Hersteller: 2 + 8 Jahre", "Warranty according to the manufacturer: 2 + 8 years", "Garantie selon le fabricant : 2 + 8 ans", "Garanzia secondo il produttore: 2 + 8 anni"),
      T("Daten für Art.-Nr. 3402900002; 2 Ausführungen auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 3402900002; 2 versions on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 3402900002 ; 2 versions sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 3402900002; 2 versioni su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "596 mm"), mass("hoehe", "218 mm"), mass("tiefe", "547 mm"), mass("nische", "B 600 mm · H 220 mm · T ≥ 550 mm")]),
    bilder: Object.freeze([
      bild("v-zug-warmingdrawer-v4000-22-1.webp", 1200, 1200, T("V-ZUG WarmingDrawer V4000 22: Gerät freigestellt von vorn, Design Spiegelglas Schwarz", "V-ZUG WarmingDrawer V4000 22: cut-out front view of the appliance, Spiegelglas Schwarz finish", "V-ZUG WarmingDrawer V4000 22 : appareil détouré vu de face, finition Spiegelglas Schwarz", "V-ZUG WarmingDrawer V4000 22: apparecchio scontornato visto di fronte, finitura Spiegelglas Schwarz"), "https://www.vzug.com/at/de/produkte/kueche/schubladen/waermeschubladen/warmingdrawer-v4000-22--p3402900002"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "spiegelglas-pearl", name: "Spiegelglas Pearl" }),
          Object.freeze({ id: "spiegelglas-schwarz", name: "Spiegelglas Schwarz" }),
          Object.freeze({ id: "spiegelglas-platinum", name: "Spiegelglas Platinum" }),
          Object.freeze({ id: "vollintegrierbar", name: "Vollintegrierbar" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/schubladen/waermeschubladen/warmingdrawer-v4000-22--p3402900002",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/schubladen/waermeschubladen/warmingdrawer-v4000-22--p3402900002"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "v-zug-warmingdrawer-v4000-28",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "waermeschublade",
    name: "WarmingDrawer V4000 28",
    serie: "V4000",
    kurz: T("Wärmeschublade WarmingDrawer V4000 28 für eine Nische mit Normbreite 60 cm und Normhöhe 28,3 cm. Erhältlich in 4 Designs; Ausführungen und Datenblatt beim Hersteller.", "Warming drawer WarmingDrawer V4000 28 for a niche with a standard width of 60 cm and height of 28.3 cm. Available in 4 finishes; versions and data sheet on the manufacturer’s website.", "Tiroir chauffant WarmingDrawer V4000 28 pour une niche de largeur normalisée 60 cm et de hauteur 28,3 cm. Disponible en 4 finitions ; versions et fiche technique sur le site du fabricant.", "Cassetto scaldavivande WarmingDrawer V4000 28 per una nicchia di larghezza standard 60 cm e altezza 28,3 cm. Disponibile in 4 finiture; versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum · Vollintegrierbar", "Finishes: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum · Vollintegrierbar", "Finitions: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum · Vollintegrierbar", "Finiture: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum · Vollintegrierbar"),
      T("Volumen 49,4 l", "Volume 49.4 l", "Volume 49,4 l", "Volume 49,4 l"),
      T("Fassungsvermögen Teller: 40", "Capacity, plates: 40", "Capacité en assiettes : 40", "Capacità piatti: 40"),
      T("Fassungsvermögen Menügeschirr: 20", "Capacity, menu sets: 20", "Capacité en services : 20", "Capacità servizi: 20"),
      T("Nennleistung 0,81 kW", "Rated power 0.81 kW", "Puissance nominale 0,81 kW", "Potenza nominale 0,81 kW"),
      T("Garantie laut Hersteller: 2 + 8 Jahre", "Warranty according to the manufacturer: 2 + 8 years", "Garantie selon le fabricant : 2 + 8 ans", "Garanzia secondo il produttore: 2 + 8 anni"),
      T("Daten für Art.-Nr. 3403000002; 2 Ausführungen auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 3403000002; 2 versions on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 3403000002 ; 2 versions sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 3403000002; 2 versioni su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "596 mm"), mass("hoehe", "281 mm"), mass("tiefe", "547 mm"), mass("nische", "B 600 mm · H 283 mm · T ≥ 550 mm")]),
    bilder: Object.freeze([
      bild("v-zug-warmingdrawer-v4000-28-1.webp", 1200, 1200, T("V-ZUG WarmingDrawer V4000 28: Gerät freigestellt von vorn, Design Spiegelglas Schwarz", "V-ZUG WarmingDrawer V4000 28: cut-out front view of the appliance, Spiegelglas Schwarz finish", "V-ZUG WarmingDrawer V4000 28 : appareil détouré vu de face, finition Spiegelglas Schwarz", "V-ZUG WarmingDrawer V4000 28: apparecchio scontornato visto di fronte, finitura Spiegelglas Schwarz"), "https://www.vzug.com/at/de/produkte/kueche/schubladen/waermeschubladen/warmingdrawer-v4000-28--p3403000002"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "spiegelglas-pearl", name: "Spiegelglas Pearl" }),
          Object.freeze({ id: "spiegelglas-schwarz", name: "Spiegelglas Schwarz" }),
          Object.freeze({ id: "spiegelglas-platinum", name: "Spiegelglas Platinum" }),
          Object.freeze({ id: "vollintegrierbar", name: "Vollintegrierbar" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/schubladen/waermeschubladen/warmingdrawer-v4000-28--p3403000002",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/schubladen/waermeschubladen/warmingdrawer-v4000-28--p3403000002"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "v-zug-warmingdrawer-v4000-31",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "waermeschublade",
    name: "WarmingDrawer V4000 31",
    serie: "V4000",
    kurz: T("Wärmeschublade WarmingDrawer V4000 31 für eine Nische mit Normbreite 60 cm und Normhöhe 31,2 cm. Erhältlich in 4 Designs; Ausführungen und Datenblatt beim Hersteller.", "Warming drawer WarmingDrawer V4000 31 for a niche with a standard width of 60 cm and height of 31.2 cm. Available in 4 finishes; versions and data sheet on the manufacturer’s website.", "Tiroir chauffant WarmingDrawer V4000 31 pour une niche de largeur normalisée 60 cm et de hauteur 31,2 cm. Disponible en 4 finitions ; versions et fiche technique sur le site du fabricant.", "Cassetto scaldavivande WarmingDrawer V4000 31 per una nicchia di larghezza standard 60 cm e altezza 31,2 cm. Disponibile in 4 finiture; versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum · Vollintegrierbar", "Finishes: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum · Vollintegrierbar", "Finitions: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum · Vollintegrierbar", "Finiture: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum · Vollintegrierbar"),
      T("Volumen 49,4 l", "Volume 49.4 l", "Volume 49,4 l", "Volume 49,4 l"),
      T("Fassungsvermögen Teller: 40", "Capacity, plates: 40", "Capacité en assiettes : 40", "Capacità piatti: 40"),
      T("Fassungsvermögen Menügeschirr: 20", "Capacity, menu sets: 20", "Capacité en services : 20", "Capacità servizi: 20"),
      T("Nennleistung 0,81 kW", "Rated power 0.81 kW", "Puissance nominale 0,81 kW", "Potenza nominale 0,81 kW"),
      T("Garantie laut Hersteller: 2 + 8 Jahre", "Warranty according to the manufacturer: 2 + 8 years", "Garantie selon le fabricant : 2 + 8 ans", "Garanzia secondo il produttore: 2 + 8 anni"),
      T("Daten für Art.-Nr. 3403100002; 2 Ausführungen auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 3403100002; 2 versions on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 3403100002 ; 2 versions sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 3403100002; 2 versioni su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "596 mm"), mass("hoehe", "310 mm"), mass("tiefe", "547 mm"), mass("nische", "B 600 mm · H 312 mm · T ≥ 550 mm")]),
    bilder: Object.freeze([
      bild("v-zug-warmingdrawer-v4000-31-1.webp", 1200, 1200, T("V-ZUG WarmingDrawer V4000 31: Gerät freigestellt von vorn, Design Spiegelglas Schwarz", "V-ZUG WarmingDrawer V4000 31: cut-out front view of the appliance, Spiegelglas Schwarz finish", "V-ZUG WarmingDrawer V4000 31 : appareil détouré vu de face, finition Spiegelglas Schwarz", "V-ZUG WarmingDrawer V4000 31: apparecchio scontornato visto di fronte, finitura Spiegelglas Schwarz"), "https://www.vzug.com/at/de/produkte/kueche/schubladen/waermeschubladen/warmingdrawer-v4000-31--p3403100002"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "spiegelglas-pearl", name: "Spiegelglas Pearl" }),
          Object.freeze({ id: "spiegelglas-schwarz", name: "Spiegelglas Schwarz" }),
          Object.freeze({ id: "spiegelglas-platinum", name: "Spiegelglas Platinum" }),
          Object.freeze({ id: "vollintegrierbar", name: "Vollintegrierbar" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/schubladen/waermeschubladen/warmingdrawer-v4000-31--p3403100002",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/schubladen/waermeschubladen/warmingdrawer-v4000-31--p3403100002"]),
    stand: STAND,
  }),
  // ---------------------------------------------------------------- vakuumierschublade
  Object.freeze({
    slug: "v-zug-vacudrawer-v6000-14",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "vakuumierschublade",
    name: "VacuDrawer V6000 14",
    serie: "V6000",
    kurz: T("Vakuumierschublade VacuDrawer V6000 14 für eine Nische mit Normbreite 60 cm und Normhöhe 14,4 cm. Erhältlich in 4 Designs; Ausführungen und Datenblatt beim Hersteller.", "Vacuum sealing drawer VacuDrawer V6000 14 for a niche with a standard width of 60 cm and height of 14.4 cm. Available in 4 finishes; versions and data sheet on the manufacturer’s website.", "Tiroir de mise sous vide VacuDrawer V6000 14 pour une niche de largeur normalisée 60 cm et de hauteur 14,4 cm. Disponible en 4 finitions ; versions et fiche technique sur le site du fabricant.", "Cassetto sottovuoto VacuDrawer V6000 14 per una nicchia di larghezza standard 60 cm e altezza 14,4 cm. Disponibile in 4 finiture; versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum · Vollintegrierbar", "Finishes: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum · Vollintegrierbar", "Finitions: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum · Vollintegrierbar", "Finiture: Spiegelglas Pearl · Spiegelglas Schwarz · Spiegelglas Platinum · Vollintegrierbar"),
      T("Volumen 7,8 l", "Volume 7.8 l", "Volume 7,8 l", "Volume 7,8 l"),
      T("Nennleistung 0,32 kW", "Rated power 0.32 kW", "Puissance nominale 0,32 kW", "Potenza nominale 0,32 kW"),
      T("Garantie laut Hersteller: 2 + 8 Jahre", "Warranty according to the manufacturer: 2 + 8 years", "Garantie selon le fabricant : 2 + 8 ans", "Garanzia secondo il produttore: 2 + 8 anni"),
      T("Daten für Art.-Nr. 3600400003; 4 Ausführungen auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 3600400003; 4 versions on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 3600400003 ; 4 versions sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 3600400003; 4 versioni su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "596 mm"), mass("hoehe", "142 mm"), mass("tiefe", "547 mm"), mass("nische", "B 600 mm · H 144 mm · T ≥ 550 mm")]),
    bilder: Object.freeze([
      bild("v-zug-vacudrawer-v6000-14-1.webp", 1200, 1200, T("V-ZUG VacuDrawer V6000 14: Gerät freigestellt von vorn, Design Spiegelglas Schwarz", "V-ZUG VacuDrawer V6000 14: cut-out front view of the appliance, Spiegelglas Schwarz finish", "V-ZUG VacuDrawer V6000 14 : appareil détouré vu de face, finition Spiegelglas Schwarz", "V-ZUG VacuDrawer V6000 14: apparecchio scontornato visto di fronte, finitura Spiegelglas Schwarz"), "https://www.vzug.com/at/de/produkte/kueche/schubladen/vakuumierschubladen/vacudrawer-v6000-14--p3600400003"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "spiegelglas-pearl", name: "Spiegelglas Pearl" }),
          Object.freeze({ id: "spiegelglas-schwarz", name: "Spiegelglas Schwarz" }),
          Object.freeze({ id: "spiegelglas-platinum", name: "Spiegelglas Platinum" }),
          Object.freeze({ id: "vollintegrierbar", name: "Vollintegrierbar" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/schubladen/vakuumierschubladen/vacudrawer-v6000-14--p3600400003",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/schubladen/vakuumierschubladen/vacudrawer-v6000-14--p3600400003"]),
    stand: STAND,
  }),
  // ---------------------------------------------------------------- kaffeevollautomat
  Object.freeze({
    slug: "v-zug-coffeecenter-v6000-45",
    marke: "v-zug",
    bereich: "kueche",
    kategorie: "kaffeevollautomat",
    name: "CoffeeCenter V6000 45",
    serie: "V6000",
    kurz: T("Einbau-Kaffeevollautomat CoffeeCenter V6000 45 für eine Nische mit Normbreite 60 cm und Normhöhe 45 cm. Erhältlich in 2 Designs; Ausführungen und Datenblatt beim Hersteller.", "Built-in fully automatic coffee machine CoffeeCenter V6000 45 for a niche with a standard width of 60 cm and height of 45 cm. Available in 2 finishes; versions and data sheet on the manufacturer’s website.", "Machine à café automatique encastrable CoffeeCenter V6000 45 pour une niche de largeur normalisée 60 cm et de hauteur 45 cm. Disponible en 2 finitions ; versions et fiche technique sur le site du fabricant.", "Macchina da caffè automatica da incasso CoffeeCenter V6000 45 per una nicchia di larghezza standard 60 cm e altezza 45 cm. Disponibile in 2 finiture; versioni e scheda tecnica sul sito del produttore."),
    merkmale: Object.freeze([
      T("Designs: Spiegelglas Schwarz · Spiegelglas Platinum", "Finishes: Spiegelglas Schwarz · Spiegelglas Platinum", "Finitions: Spiegelglas Schwarz · Spiegelglas Platinum", "Finiture: Spiegelglas Schwarz · Spiegelglas Platinum"),
      T("Nennleistung 1,35 kW", "Rated power 1.35 kW", "Puissance nominale 1,35 kW", "Potenza nominale 1,35 kW"),
      T("Energieeffizienzklasse A", "Energy efficiency class A", "Classe d’efficacité énergétique A", "Classe di efficienza energetica A"),
      T("Garantie laut Hersteller: 2 + 8 Jahre", "Warranty according to the manufacturer: 2 + 8 years", "Garantie selon le fabricant : 2 + 8 ans", "Garanzia secondo il produttore: 2 + 8 anni"),
      T("Daten für Art.-Nr. 2500500003; 3 Ausführungen auf vzug.com (Design, Ausstattung, Abluft/Umluft u. a.)", "Data for item no. 2500500003; 3 versions on vzug.com (finish, equipment, extraction/recirculation etc.)", "Données pour la réf. 2500500003 ; 3 versions sur vzug.com (finition, équipement, évacuation/recyclage, etc.)", "Dati per l’art. n. 2500500003; 3 versioni su vzug.com (finitura, dotazione, aspirazione/ricircolo ecc.)"),
    ]),
    masse: Object.freeze([mass("breite", "596 mm"), mass("hoehe", "454 mm"), mass("tiefe", "480 mm"), mass("nische", "B 600 mm · H 450 mm · T ≥ 550 mm")]),
    bilder: Object.freeze([
      bild("v-zug-coffeecenter-v6000-45-1.webp", 1200, 1200, T("V-ZUG CoffeeCenter V6000 45: Gerät freigestellt von vorn, Design Spiegelglas Schwarz", "V-ZUG CoffeeCenter V6000 45: cut-out front view of the appliance, Spiegelglas Schwarz finish", "V-ZUG CoffeeCenter V6000 45 : appareil détouré vu de face, finition Spiegelglas Schwarz", "V-ZUG CoffeeCenter V6000 45: apparecchio scontornato visto di fronte, finitura Spiegelglas Schwarz"), "https://www.vzug.com/at/de/produkte/kueche/kaffeevollautomaten/coffeecenter-v6000-45--p2500500003"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T("Design", "Finish", "Finition", "Finitura"),
        optionen: Object.freeze([
          Object.freeze({ id: "spiegelglas-schwarz", name: "Spiegelglas Schwarz" }),
          Object.freeze({ id: "spiegelglas-platinum", name: "Spiegelglas Platinum" }),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.vzug.com/at/de/produkte/kueche/kaffeevollautomaten/coffeecenter-v6000-45--p2500500003",
    quellen: Object.freeze(["https://www.vzug.com/at/de/produkte/kueche/kaffeevollautomaten/coffeecenter-v6000-45--p2500500003"]),
    stand: STAND,
  }),
]);
