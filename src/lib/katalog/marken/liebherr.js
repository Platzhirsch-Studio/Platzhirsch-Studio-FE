// src/lib/katalog/marken/liebherr.js – Liebherr (Hausgeräte: Kühlen, Gefrieren, Weinklima)
// Stand 31.10.2026. Inhaber-Entscheidungen Nr. 24 (Sortiment: alle Gerätekategorien mit
// allen Serien/Hauptmodellen, Varianten per Link zum Hersteller), Nr. 26 (UVP ab), Nr. 28
// (Querverweis Riedel ↔ Weinklima).
//
// Quelle: nur die offizielle österreichische Herstellerseite liebherr.com/de-at (Ziel von
// home.liebherr.com/at), frei abrufbar (normale HTTP-Abrufe, keine Umgehung). Produktliste
// aus den Produktfindern der Einbau-Kategorien (Kühl-Gefrierkombinationen, Kühlschränke
// inkl. Folgeseite ?p=2, Gefrierschränke, 1-/2-/3-Zonen-Einbau-Weinkühlschränke) + Monolith,
// Unterbau-Getränkekühlschränke, Outdoor; Serien laut „Serien Einbaugeräte“ (Pure, Plus,
// Prime, Peak). Vollständigkeits-Check mit jedem Modell:
// qa-screenshots/wellness/produkte/vollstaendigkeit-liebherr.md.
//
// Umfang (Auftrag): Einbau-/Küchengeräte. Ein Eintrag je Gerätetyp × Serie; die einzelnen
// Modelle (Breiten, Nischenhöhen, Ausstattungen) stehen als Merkmal, alle Ausführungen per
// Link (herstellerUrl = Produktfinder der Kategorie). Standgeräte, Gewerbe-/Laborgeräte und
// Humidor sind nicht Teil dieses Küchengeräte-Katalogs (Begründung im Vollständigkeits-Check).
//
// Preise (Nr. 26/34): „Herstellerpreis ab“ = Preis des günstigsten Modells der Serie laut Liebherr-Shop
// Österreich auf der jeweiligen Produktseite („EUR … inkl. MwSt.“, Österreich = 20 %),
// ohne Aktions-Abschlag (Listen- und Aktionspreis waren am 31.10.2026 identisch).
// Monolith und ECBNe: auf der Herstellerseite kein Preis („Vor Ort ansehen/kaufen“) → kein Preis.
//
// Bilder: unverändert von der Produktseite des jeweiligen Modells (Liebherr-Medien-CDN,
// Variante „web“ = von Liebherr bereitgestellte JPG-Fassung der Masterdatei, gleiches
// Seitenverhältnis wie das Original, nicht beschnitten; einheitlich ≤ 1600 px lange Kante, WebP q82 (tools/images/optimize-katalog.mjs)). Ein Bild aus
// public/Images/Kueche/ wiederverwendet (Prime). Quellen je Bild: docs/bildquellen/QUELLEN.md
// (Abschnitt „Katalog Liebherr“).
//
// Nicht übernommen: Werbe-Absolute der Herstellertexte („Extraklasse“, „höchste Ansprüche“,
// „perfekt“), Gesundheitsaussagen („gesund“, „vitaminreich“) und Liefer-/Lageraussagen.

const STAND = "2026-10-31";
const T = (de, en, fr, it) => Object.freeze({ de, en, fr, it });
const bild = (file, width, height, alt, quelleUrl, typ = "freisteller") =>
  Object.freeze({ src: `/Images/Wellness/produkte/liebherr/${file}`, width, height, alt, quelleUrl, abgerufen: STAND, typ });
/** Raum-/Ambientebild (Gerät eingebaut), unverändert von der Produktseite. */
const raum = (file, width, height, alt, quelleUrl) => bild(file, width, height, alt, quelleUrl, "ambiente");
const mass = (key, wert) => Object.freeze({ key, wert });
// Nr. 34 (31.10.2026): Shop-Preis des Herstellers inkl. MwSt., keine UVP → „Herstellerpreis ab“
const uvp = (uvpAb, quelle) => Object.freeze({ art: "uvp-ab", bezeichnung: "herstellerpreis", uvpAb, stand: STAND, quelle });

const BASE = "https://www.liebherr.com/de-at/gefrier-kuehlschraenke/";
const KAT_KGK = `${BASE}einbau-kuehl-gefrierkombinationen-2224632`;
const KAT_KS = `${BASE}einbaukuehlschraenke-2224644`;
const KAT_KS2 = `${BASE}einbaukuehlschraenke-2224644?p=2`;
const KAT_GS = `${BASE}einbau-gefrierschraenke-2224691`;
const SERIEN = `${BASE}serien-einbaugeraete-2224941`;
const MONOLITH = `${BASE}monolith-2224662`;
const WEIN1 = `${BASE}1-zonen-einbau-weinkuehlschrank-2224715`;
const WEIN2 = `${BASE}2-zonen-einbau-weinkuehlschrank-2224723`;
const WEIN3 = `${BASE}3-zonen-einbau-weinkuehlschrank-8992797`;
const GETRAENKE = `${BASE}unterbau-getraenkekuehlschraenke-8708883`;
const OUTDOOR = `${BASE}outdoor-kuehlschrank-8708881`;
const HAUSGERAETE = `${BASE}hausgeraete-2224569`;
const P = (h) => `https://www.liebherr.com/de-at/p/${h}`;

// Gerätetypen für Alt-Texte (4 Sprachen).
const TYP = {
  kgk: ["integrierbare Kühl-Gefrierkombination", "integrated fridge-freezer", "combiné réfrigérateur-congélateur intégrable", "frigocongelatore da incasso"],
  ks: ["integrierbarer Kühlschrank", "integrated refrigerator", "réfrigérateur intégrable", "frigorifero da incasso"],
  uks: ["integrierbarer Unterbaukühlschrank", "integrated under-counter refrigerator", "réfrigérateur sous plan intégrable", "frigorifero sottopiano da incasso"],
  gs: ["integrierbarer Gefrierschrank", "integrated freezer", "congélateur intégrable", "congelatore da incasso"],
  ugs: ["integrierbarer Unterbaugefrierschrank", "integrated under-counter freezer", "congélateur sous plan intégrable", "congelatore sottopiano da incasso"],
  getraenke: ["Unterbau-Getränkekühlschrank mit Glastür", "under-counter beverage cooler with glass door", "réfrigérateur à boissons sous plan avec porte vitrée", "frigorifero per bevande sottopiano con porta in vetro"],
  outdoor: ["integrierbarer Outdoor-Kühlschrank", "integrated outdoor refrigerator", "réfrigérateur d’extérieur intégrable", "frigorifero da esterno da incasso"],
  wein: ["einbaubarer Weintemperierschrank", "built-in wine cabinet", "cave à vin encastrable", "cantina vini da incasso"],
  uw: ["Unterbau-Weinkühlschrank", "under-counter wine cabinet", "cave à vin sous plan", "cantina vini sottopiano"],
  wke: ["einbaubarer Weinklimaschrank", "built-in wine climate cabinet", "cave de vieillissement encastrable", "cantina climatizzata da incasso"],
};
const ANSICHT = {
  offen: ["geöffnet und mit Lebensmitteln bestückt, Frontansicht", "open and stocked with food, front view", "ouvert et garni d’aliments, vue de face", "aperto e rifornito di alimenti, vista frontale"],
  schraeg: ["geöffnet und mit Lebensmitteln bestückt, Schrägansicht", "open and stocked with food, angled view", "ouvert et garni d’aliments, vue de trois quarts", "aperto e rifornito di alimenti, vista di tre quarti"],
  wein: ["geöffnet und mit Weinflaschen bestückt, Frontansicht", "open and stocked with wine bottles, front view", "ouverte et garnie de bouteilles de vin, vue de face", "aperta e rifornita di bottiglie di vino, vista frontale"],
  leer: ["geöffnet und leer, Frontansicht", "open and empty, front view", "ouverte et vide, vue de face", "aperta e vuota, vista frontale"],
};
/** Alt-Text eines Produktbilds: „Liebherr <Modell>: <Typ> <Ansicht>“. */
const altProdukt = (modell, typ, ansicht) => {
  const t = TYP[typ];
  const a = ANSICHT[ansicht];
  return T(`Liebherr ${modell}: ${t[0]}, ${a[0]}`, `Liebherr ${modell}: ${t[1]}, ${a[1]}`, `Liebherr ${modell} : ${t[2]}, ${a[2]}`, `Liebherr ${modell}: ${t[3]}, ${a[3]}`);
};

// Ausführungen je Eintrag (Nr. 24/§10): Modelle laut Produktfinder liebherr.com/de-at, Name = Modell · Nische Höhe × Breite
// bzw. Flaschenzahl, code = Modellbezeichnung; standard = Modell, dessen Produktseite Bild/„UVP ab“ belegt.
const MODELLE = Object.freeze({
  "liebherr-einbau-kuehl-gefrierkombination-pure": [
    ["ICNd 5603", "194–195 × 56–57 cm", true],
    ["ICNc 7603", "194–195 × 71–72 cm"],
    ["ICNd 7603", "194–195 × 71–72 cm"],
  ],
  "liebherr-einbau-kuehl-gefrierkombination-plus": [
    ["ICc 5123", "177,2–178,8 × 56–57 cm", true],
    ["ICNb 5123", "177,2–178,8 × 56–57 cm"],
    ["ICNSd 5123", "177,2–178,8 × 56–57 cm"],
    ["ICNd 5133", "177,2–178,8 × 56–57 cm"],
    ["ICBa 5123", "177,2–178,8 × 56–57 cm"],
    ["ICBbi 5122", "177,2–178,8 × 56–57 cm"],
    ["ICBSd 5122", "177,2–178,8 × 56–57 cm"],
    ["ICBNdi 5123", "177,2–178,8 × 56–57 cm"],
    ["ICBNc 5623", "194–195 × 56–57 cm"],
    ["ICBNSd 5623", "194–195 × 56–57 cm"],
    ["ICBNc 7623", "194–195 × 71–72 cm"],
    ["ICBNSd 7623", "194–195 × 71–72 cm"],
  ],
  "liebherr-einbau-kuehl-gefrierkombination-prime": [
    ["SICNdi 5153", "177,2–178,8 × 56–57 cm", true],
    ["ICBNbi 5153", "177,2–178,8 × 56–57 cm"],
    ["ICBbi 5152", "177,2–178,8 × 56–57 cm"],
    ["ICBNdi 5163", "177,2–178,8 × 56–57 cm"],
    ["ICBNci 5663", "194–195 × 56–57 cm"],
    ["ICBNbi 7663", "194–195 × 71–72 cm"],
  ],
  "liebherr-einbau-kuehl-gefrierkombination-peak": [
    ["ICNbsci 5173", "177,2–178,8 × 56–57 cm", true],
    ["ICBNbsci 5173", "177,2–178,8 × 56–57 cm"],
    ["ICBNci 5183", "177,2–178,8 × 56–57 cm"],
  ],
  "liebherr-ecbne-biofresh-nofrost": [
    ["ECBNe 7870", "203,2–207,2 × 76,2 cm"],
    ["ECBNe 7871", "203,2–207,2 × 76,2 cm"],
    ["ECBNe 8870", "203,2–207,2 × 91,5 cm", true],
    ["ECBNe 8871", "203,2–207,2 × 91,5 cm"],
    ["ECBNe 8872", "203,2–207,2 × 91,5 cm"],
  ],
  "liebherr-monolith-kuehl-gefrierkombination": [
    ["ECBNei 9770", "213,4 × 76,2 cm"],
    ["ECBNei 9771", "213,4 × 76,2 cm"],
    ["ECBNdi 9970", "213,4 × 91,4 cm", true],
    ["ECBNdi 9971", "213,4 × 91,4 cm"],
    ["ECBNei 9972", "213,4 × 91,4 cm"],
  ],
  "liebherr-einbaukuehlschrank-pure": [
    ["IRe 3900", "87,4–89 × 56–57 cm", true],
    ["IRe 3901", "87,4–89 × 56–57 cm"],
    ["IRd 3900", "87,4–89 × 56–57 cm"],
    ["IRd 3901", "87,4–89 × 56–57 cm"],
    ["IRSe 3900", "87,4–89 × 56–57 cm"],
    ["IRSe 3901", "87,4–89 × 56–57 cm"],
    ["IRSe 4100", "121,6–123,6 × 56–57 cm"],
    ["IRSe 4101", "121,6–123,6 × 56–57 cm"],
    ["DRe 3900", "87,4–88 × 56–57 cm"],
    ["DRe 3901", "87,4–88 × 56–57 cm"],
    ["DRe 4101", "122–122,6 × 56–57 cm"],
  ],
  "liebherr-einbaukuehlschrank-plus": [
    ["IRc 3920", "87,4–89 × 56–57 cm", true],
    ["IRc 3921", "87,4–89 × 56–57 cm"],
    ["IRd 4020", "102,4–104 × 56–57 cm"],
    ["IRd 4021", "102,4–104 × 56–57 cm"],
    ["IRBc 4020", "102,4–104 × 56–57 cm"],
    ["IRc 4120", "121,6–123,6 × 56–57 cm"],
    ["IRc 4121", "121,6–123,6 × 56–57 cm"],
    ["IRBc 4120", "121,6–123,6 × 56–57 cm"],
    ["IRBc 4121", "121,6–123,6 × 56–57 cm"],
    ["IRBc 4520", "139,7–141,3 × 56–57 cm"],
    ["IRBc 4521", "139,7–141,3 × 56–57 cm"],
    ["IRBc 5120", "177,2–178,8 × 56–57 cm"],
    ["IRBc 5121", "177,2–178,8 × 56–57 cm"],
    ["IRDdi 5120", "177,2–178,8 × 56–57 cm"],
    ["IRDdi 5121", "177,2–178,8 × 56–57 cm"],
    ["IRCe 5121", "177,2–178,8 × 56–57 cm"],
    ["IRCBe 5121", "177,2–178,8 × 56–57 cm"],
    ["IRBci 5620", "194–195 × 56–57 cm"],
  ],
  "liebherr-einbaukuehlschrank-prime": [
    ["IRci 3950", "87,4–89 × 56–57 cm", true],
    ["IRbi 3951", "87,4–89 × 56–57 cm"],
    ["IRBbi 4050", "102,4–104 × 56–57 cm"],
    ["IRBci 4150", "121,6–123,6 × 56–57 cm"],
    ["IRBci 4151", "121,6–123,6 × 56–57 cm"],
    ["IRBci 4550", "139,7–141,3 × 56–57 cm"],
    ["IRBdi 4851", "157,4–159 × 56–57 cm"],
    ["IRBbi 5150", "177,2–178,8 × 56–57 cm"],
    ["IRBbi 5151", "177,2–178,8 × 56–57 cm"],
    ["IRBbi 5650", "194–195 × 56–57 cm"],
  ],
  "liebherr-einbaukuehlschrank-peak": [
    ["IRBbi 4170", "121,6–123,6 × 56–57 cm", true],
    ["IRBbi 4171", "121,6–123,6 × 56–57 cm"],
    ["IRBbsbi 4170", "121,6–123,6 × 56–57 cm"],
    ["IRBbsbi 4570", "139,7–141,3 × 56–57 cm"],
    ["IRBci 4571", "139,7–141,3 × 56–57 cm"],
    ["IRBci 5170", "177,2–178,8 × 56–57 cm"],
    ["IRBdi 5170", "177,2–178,8 × 56–57 cm"],
    ["IRBPci 5170", "177,2–178,8 × 56–57 cm"],
    ["IRBbsci 5170", "177,2–178,8 × 56–57 cm"],
    ["IRBbsci 5171", "177,2–178,8 × 56–57 cm"],
    ["IRBci 5180", "177,2–178,8 × 56–57 cm"],
    ["IRBAc 5171", "177,7–179,3 × 56–57 cm"],
    ["IRBAc 5190", "177,7–179,3 × 56–57 cm"],
  ],
  "liebherr-monolith-kuehlschrank": [
    ["ERBdi 9670", "213,4 × 61 cm"],
    ["ERBdi 9671", "213,4 × 61 cm"],
    ["ERBdi 9770", "213,4 × 76,2 cm", true],
    ["ERBdi 9771", "213,4 × 76,2 cm"],
    ["ERBdi 9970", "213,4 × 91,4 cm"],
    ["ERBdi 9971", "213,4 × 91,4 cm"],
  ],
  "liebherr-unterbaukuehlschrank-pure": [
    ["URd 3600", "82–88 × 60 cm", true],
    ["URd 3601", "82–88 × 60 cm"],
    ["URc 3700", "86–92 × 60 cm"],
    ["URc 3701", "86–92 × 60 cm"],
    ["DURd 3600", "82–88 × 60 cm"],
    ["DURd 3601", "82–88 × 60 cm"],
  ],
  "liebherr-unterbaukuehlschrank-prime": [
    ["URd 365i", "82–88 × 60 cm", true],
    ["URc 375i", "86–92 × 60 cm"],
    ["URPd 365i", "82–88 × 60 cm"],
    ["URPc 375i", "86–92 × 60 cm"],
    ["URDd 375i", "86–92 × 60 cm"],
    ["SUBa30 375i", "86–92 × 60 cm"],
  ],
  "liebherr-unterbaukuehlschrank-comfort": [
    ["UIK 1510", "82–88 × 60 cm", true],
    ["UIK 1514", "82–88 × 60 cm"],
  ],
  "liebherr-unterbau-getraenkekuehlschrank": [
    ["UBCgb 3731", "86–92 × 60 cm", true],
    ["UBCpr 376i", "86–92 × 60 cm"],
  ],
  "liebherr-outdoor-kuehlschrank": [
    ["UORpr 365i", "82–88 × 60 cm", true],
    ["UORpr 366i", "82–88 × 60 cm"],
  ],
  "liebherr-einbau-gefrierschrank-pure": [
    ["IFd 3904", "87,4–89 × 56–57 cm", true],
    ["IFSd 3904", "87,4–89 × 56–57 cm"],
    ["IFNd 3503", "71,4–73 × 56–57 cm"],
    ["SIFNe 5108", "177,2–178,8 × 56–57 cm"],
  ],
  "liebherr-einbau-gefrierschrank-plus": [
    ["IFNd 3924", "87,4–89 × 56–57 cm", true],
    ["SIFNSe 5128", "177,2–178,8 × 56–57 cm"],
  ],
  "liebherr-einbau-gefrierschrank-prime": [
    ["IFNbi 3553", "71,4–73 × 56–57 cm", true],
    ["IFNci 3954", "87,4–89 × 56–57 cm"],
    ["SIFNdi 4155", "121,6–123,6 × 56–57 cm"],
    ["SIFNdi 4556", "139,7–141,3 × 56–57 cm"],
  ],
  "liebherr-einbau-gefrierschrank-peak": [
    ["SIFNdi 5178", "177,2–178,8 × 56–57 cm", true],
    ["SIFNdi 5188", "177,2–178,8 × 56–57 cm"],
    ["SIFNbsdi 5188", "177,2–178,8 × 56–57 cm"],
    ["SIFNAd 5188", "177,7–179,3 × 56–57 cm"],
  ],
  "liebherr-unterbaugefrierschrank-pure": [
    ["SUFd 3603", "82–88 × 60 cm", true],
    ["SUFc 3703", "86–92 × 60 cm"],
    ["SDUFd 3603", "82–88 × 60 cm"],
  ],
  "liebherr-unterbaugefrierschrank-prime": [
    ["SUFNd 365i", "82–88 × 60 cm", true],
    ["SUFNc 375i", "86–92 × 60 cm"],
    ["SUFNPc 365i", "82–88 × 60 cm"],
  ],
  "liebherr-unterbaugefrierschrank-comfort": [
    ["SUIG 1514", "82–88 × 60 cm", true],
  ],
  "liebherr-monolith-gefrierschrank": [
    ["EFNei 9470", "213,4 × 45,7 cm"],
    ["EFNei 9471", "213,4 × 45,7 cm"],
    ["EFNei 9670", "213,4 × 61 cm", true],
    ["EFNei 9671", "213,4 × 61 cm"],
    ["EFNei 9770", "213,4 × 76,2 cm"],
    ["EFNei 9771", "213,4 × 76,2 cm"],
    ["EFNei 9970", "213,4 × 91,4 cm"],
    ["EFNei 9971", "213,4 × 91,4 cm"],
  ],
  "liebherr-vinidor-einbau-weintemperierschrank": [
    ["EWTdf 1653", "30 × 0,75 l", true],
    ["EWTdf 2353", "48 × 0,75 l"],
    ["EWTdf 3553", "80 × 0,75 l"],
    ["EWTgb 1683", "33 × 0,75 l"],
    ["EWTgb 2383", "51 × 0,75 l"],
    ["EWTgb 3583", "83 × 0,75 l"],
  ],
  "liebherr-vinidor-unterbau-weinkuehlschrank": [
    ["UWgb 3631", "44 × 0,75 l", true],
    ["UWgb 3632", "32 × 0,75 l"],
  ],
  "liebherr-vinidor-selection-unterbau-weinkuehlschrank": [
    ["UWpri 3661", "44 × 0,75 l", true],
    ["UWpri 3761", "44 × 0,75 l"],
    ["UWpri 3662", "32 × 0,75 l"],
    ["UWpri 3762", "38 × 0,75 l"],
    ["UWpri 3782", "38 × 0,75 l"],
    ["UWpri 3672", "32 × 0,75 l"],
    ["UWgbi 3682", "32 × 0,75 l"],
    ["UWgbi 3782", "38 × 0,75 l"],
  ],
  "liebherr-grandcru-einbau-weinklimaschrank": [
    ["WKEes 553", "18 × 0,75 l", true],
    ["WKEgb 582", "18 × 0,75 l"],
  ],
  "liebherr-monolith-weintemperierschrank": [
    ["EWPi 9470", "75 × 0,75 l"],
    ["EWPi 9471", "75 × 0,75 l"],
    ["EWPi 9670", "100 × 0,75 l", true],
    ["EWPi 9671", "100 × 0,75 l"],
  ],
});
const AUSF_MODELL = T("Modell", "Model", "Modèle", "Modello");
const TUERANSCHLAG = Object.freeze({
  gruppe: T("Türanschlag (AutoDoor-Modelle)", "Door hinge (AutoDoor models)", "Charnières (modèles AutoDoor)", "Apertura porta (modelli AutoDoor)"),
  optionen: Object.freeze([
    Object.freeze({ id: "rechts", name: T("Türanschlag rechts", "Hinged on the right", "Charnières à droite", "Apertura a destra"), standard: true }),
    Object.freeze({ id: "links", name: T("Türanschlag links", "Hinged on the left", "Charnières à gauche", "Apertura a sinistra") }),
  ]),
});
/** Ausführungen eines Eintrags: Gruppe „Modell“ (+ optional weitere Gruppen). Keine Preise je Option. */
const ausf = (slug, ...weitere) =>
  Object.freeze([
    Object.freeze({
      gruppe: AUSF_MODELL,
      optionen: Object.freeze(
        MODELLE[slug].map(([code, zusatz, standard]) =>
          Object.freeze({ id: code.toLowerCase().replace(/[^a-z0-9]+/g, "-"), name: zusatz ? `${code} · ${zusatz}` : code, code, ...(standard ? { standard: true } : {}) })
        )
      ),
    }),
    ...weitere,
  ]);

// Zubehör = Kombinationen, die der Hersteller nennt (Einbau-Side-by-Side-Seite, Monolith-Seite).
const SBS = T(
  "Side-by-Side: Liebherr-Einbaugeräte lassen sich laut Hersteller nebeneinander zu einer Kombination aufbauen",
  "Side-by-side: according to the manufacturer, Liebherr built-in appliances can be combined next to each other",
  "Side-by-side : selon le fabricant, les appareils encastrables Liebherr se combinent côte à côte",
  "Side-by-side: secondo il produttore gli apparecchi da incasso Liebherr si possono combinare affiancati"
);
const MONO_KOMBI = T(
  "Monolith-Geräte lassen sich laut Hersteller zu Kombinationen aus zwei oder drei Geräten aufbauen (z. B. 137,16 bis 243,84 cm Gesamtbreite)",
  "According to the manufacturer, Monolith appliances can be combined in groups of two or three (e.g. 137.16 to 243.84 cm overall width)",
  "Selon le fabricant, les appareils Monolith se combinent par deux ou trois (p. ex. 137,16 à 243,84 cm de largeur totale)",
  "Secondo il produttore gli apparecchi Monolith si combinano a due o tre (ad es. da 137,16 a 243,84 cm di larghezza totale)"
);
const z = (hinweis, ...slugs) => Object.freeze(slugs.map((slug) => Object.freeze({ slug, hinweis })));

// Wiederkehrende, auf den Herstellerseiten belegte Merkmale.
const M = {
  nische: T(
    "Nischenmaße jeweils Höhe × Breite × Tiefe laut Hersteller",
    "Niche dimensions given as height × width × depth according to the manufacturer",
    "Dimensions de niche : hauteur × largeur × profondeur selon le fabricant",
    "Misure della nicchia: altezza × larghezza × profondità secondo il produttore"
  ),
  varianten: T(
    "Alle Modelle und Ausführungen mit technischen Daten beim Hersteller",
    "All models and versions with technical data on the manufacturer’s website",
    "Tous les modèles et versions avec données techniques sur le site du fabricant",
    "Tutti i modelli e le versioni con dati tecnici sul sito del produttore"
  ),
  pure: T(
    "Serie Pure laut Hersteller: EasyFresh-Safe, Touch-Display, über SmartDeviceBox vernetzbar (modellabhängig)",
    "Pure series according to the manufacturer: EasyFresh safe, touch display, connectable via SmartDeviceBox (depending on model)",
    "Série Pure selon le fabricant : compartiment EasyFresh, écran tactile, connectable via SmartDeviceBox (selon modèle)",
    "Serie Pure secondo il produttore: cassetto EasyFresh, display touch, collegabile tramite SmartDeviceBox (a seconda del modello)"
  ),
  plus: T(
    "Serie Plus laut Hersteller: BioFresh, SoftSystem-Schließdämpfung, IceMaker mit bis zu 130 Eiswürfeln täglich (modellabhängig)",
    "Plus series according to the manufacturer: BioFresh, SoftSystem soft-close, IceMaker with up to 130 ice cubes a day (depending on model)",
    "Série Plus selon le fabricant : BioFresh, fermeture amortie SoftSystem, IceMaker jusqu’à 130 glaçons par jour (selon modèle)",
    "Serie Plus secondo il produttore: BioFresh, chiusura ammortizzata SoftSystem, IceMaker fino a 130 cubetti al giorno (a seconda del modello)"
  ),
  prime: T(
    "Serie Prime laut Hersteller: LightTower-Beleuchtung, Touch & Swipe-Display, Rückwand in SmartSteel (modellabhängig)",
    "Prime series according to the manufacturer: LightTower lighting, Touch & Swipe display, SmartSteel rear wall (depending on model)",
    "Série Prime selon le fabricant : éclairage LightTower, écran Touch & Swipe, paroi arrière SmartSteel (selon modèle)",
    "Serie Prime secondo il produttore: illuminazione LightTower, display Touch & Swipe, parete posteriore in SmartSteel (a seconda del modello)"
  ),
  peak: T(
    "Serie Peak laut Hersteller: BioFresh mit HydroBreeze, Wasserspender InfinitySpring, OpenStage-Schubladen (modellabhängig)",
    "Peak series according to the manufacturer: BioFresh with HydroBreeze, InfinitySpring water dispenser, OpenStage drawers (depending on model)",
    "Série Peak selon le fabricant : BioFresh avec HydroBreeze, fontaine à eau InfinitySpring, tiroirs OpenStage (selon modèle)",
    "Serie Peak secondo il produttore: BioFresh con HydroBreeze, erogatore d’acqua InfinitySpring, cassetti OpenStage (a seconda del modello)"
  ),
  monolith: T(
    "Monolith laut Hersteller: Bedienung über InfinitySwipe, Innenlicht InfinityLight, SmartDevice-Steuerung per App",
    "Monolith according to the manufacturer: InfinitySwipe controls, InfinityLight interior lighting, SmartDevice app control",
    "Monolith selon le fabricant : commande InfinitySwipe, éclairage intérieur InfinityLight, pilotage par l’app SmartDevice",
    "Monolith secondo il produttore: comandi InfinitySwipe, illuminazione interna InfinityLight, controllo tramite app SmartDevice"
  ),
  kein_preis: T(
    "Beim Hersteller ohne Online-Angebot (Beratung und Kauf vor Ort)",
    "Not sold online by the manufacturer (advice and purchase on site)",
    "Pas de vente en ligne chez le fabricant (conseil et achat sur place)",
    "Non venduto online dal produttore (consulenza e acquisto in loco)"
  ),
};
const volumen = (v) => T(`Gesamtvolumen ${v} l`, `Total capacity ${v} l`, `Volume total ${v} l`, `Volume totale ${v} l`);
const flaschen = (n) => T(`Bis zu ${n} Bordeauxflaschen (0,75 l)`, `Up to ${n} Bordeaux bottles (0.75 l)`, `Jusqu’à ${n} bouteilles bordelaises (0,75 l)`, `Fino a ${n} bottiglie bordolesi (0,75 l)`);
const beispiel = (modell, de, en, fr, it) =>
  T(`Ausstattung am Beispiel ${modell}: ${de}`, `Features of the ${modell}, for example: ${en}`, `Équipement, p. ex. du ${modell} : ${fr}`, `Dotazione, ad es. del ${modell}: ${it}`);

/** @type {import("../schema.js").KatalogMarke} */
export const MARKE = Object.freeze({
  slug: "liebherr",
  name: "Liebherr",
  welt: "kuechengeraete",
  herstellerUrl: "https://home.liebherr.com/",
  // Händlersatz nur über den Claim-Guard (dealerStatement); hier nur der Schalter.
  dealer: true,
  stand: STAND,
  // Nr. 28: Querverweis zu Gläsern (Riedel, Welt Accessoires) für die Weinklima-Geräte;
  // der Link erscheint automatisch, sobald accessoires/glas Produkte hat (querverweiseVon).
  querverweise: Object.freeze([Object.freeze({ welt: "accessoires", kategorie: "glas" })]),
  // Raumszenen (unveränderte Raumbilder der Produktseiten); verlinkt nur das Gerät der jeweiligen Produktseite.
  looks: Object.freeze([
    Object.freeze({
      id: "aussenkueche",
      titel: T("Außenküche auf der Dachterrasse", "Outdoor kitchen on a roof terrace", "Cuisine extérieure sur un toit-terrasse", "Cucina all’aperto su una terrazza"),
      bild: raum("liebherr-outdoor-kuehlschrank-2.webp", 1200, 677, T("Liebherr UORpr 365i Prime: geöffneter Outdoor-Kühlschrank in einer Außenküche aus Holz auf einer Dachterrasse", "Liebherr UORpr 365i Prime: open outdoor refrigerator in a wooden outdoor kitchen on a roof terrace", "Liebherr UORpr 365i Prime : réfrigérateur d’extérieur ouvert dans une cuisine extérieure en bois sur un toit-terrasse", "Liebherr UORpr 365i Prime: frigorifero da esterno aperto in una cucina all’aperto in legno su una terrazza"), P("uorpr-365i-2224647")),
      produkte: Object.freeze(["liebherr-outdoor-kuehlschrank"]),
    }),
    Object.freeze({
      id: "monolith-wohnkueche",
      titel: T("Monolith in der Wohnküche", "Monolith in an open-plan kitchen", "Monolith dans une cuisine ouverte", "Monolith in una cucina abitabile"),
      bild: raum("liebherr-monolith-kuehlschrank-3.webp", 1200, 750, T("Liebherr Monolith ERBdi 9770: geöffneter Kühlschrank in einer dunklen Schrankwand neben Kamin und Essplatz", "Liebherr Monolith ERBdi 9770: open refrigerator in a dark wall of units next to a fireplace and dining area", "Liebherr Monolith ERBdi 9770 : réfrigérateur ouvert dans un mur d’armoires sombre, près d’une cheminée et d’un coin repas", "Liebherr Monolith ERBdi 9770: frigorifero aperto in una parete scura accanto a camino e zona pranzo"), P("erbdi-9770-2224647")),
      produkte: Object.freeze(["liebherr-monolith-kuehlschrank"]),
    }),
  ]),
});

/** @type {import("../schema.js").KatalogProdukt[]} */
export const PRODUKTE = Object.freeze([
  // ------------------------------------------------- Einbau-Kühl-Gefrierkombinationen
  Object.freeze({
    slug: "liebherr-einbau-kuehl-gefrierkombination-pure",
    marke: "liebherr",
    bereich: "kueche",
    kategorie: "kuehlen",
    name: "Einbau-Kühl-Gefrierkombination Pure",
    serie: "Pure",
    kurz: T(
      "Integrierbare Kühl-Gefrierkombinationen der Basis-Serie Pure mit EasyFresh-Safe und NoFrost, für Nischen mit 56 oder 71 cm Breite.",
      "Integrated fridge-freezers from the entry-level Pure series with EasyFresh safe and NoFrost, for 56 or 71 cm wide niches.",
      "Combinés réfrigérateur-congélateur intégrables de la série de base Pure, avec compartiment EasyFresh et NoFrost, pour niches de 56 ou 71 cm de large.",
      "Frigocongelatori da incasso della serie base Pure con cassetto EasyFresh e NoFrost, per nicchie larghe 56 o 71 cm."
    ),
    merkmale: Object.freeze([
      "ICNd 5603 · ICNc 7603 · ICNd 7603",
      M.pure,
      beispiel("ICNd 5603", "EasyFresh, NoFrost, DuoCooling, Touch-Display, SmartDeviceBox nachrüstbar", "EasyFresh, NoFrost, DuoCooling, touch display, SmartDeviceBox can be retrofitted", "EasyFresh, NoFrost, DuoCooling, écran tactile, SmartDeviceBox en option", "EasyFresh, NoFrost, DuoCooling, display touch, SmartDeviceBox installabile in seguito"),
      volumen("284–359"),
      M.nische,
      M.varianten,
    ]),
    masse: Object.freeze([mass("nische", "194–195 × 56–57 × 55 cm · 194–195 × 71–72 × 56 cm")]),
    bilder: Object.freeze([
      bild("liebherr-einbau-kuehl-gefrierkombination-pure-1.webp", 578, 1200, altProdukt("ICNd 5603 Pure NoFrost", "kgk", "offen"), P("icnd-5603-2224633")),
      raum("liebherr-einbau-kuehl-gefrierkombination-pure-2.webp", 1200, 849, T("Liebherr ICNd 5603 Pure: Holzküche mit Kochinsel und Dachfenstern, das Gerät hinter Möbelfronten integriert", "Liebherr ICNd 5603 Pure: wooden kitchen with island and skylights, the appliance integrated behind furniture fronts", "Liebherr ICNd 5603 Pure : cuisine en bois avec îlot et fenêtres de toit, appareil intégré derrière les façades", "Liebherr ICNd 5603 Pure: cucina in legno con isola e lucernari, apparecchio integrato dietro le ante"), P("icnd-5603-2224633")),
      raum("liebherr-einbau-kuehl-gefrierkombination-pure-3.webp", 1200, 1028, T("Liebherr ICNd 5603 Pure: geöffnete Kühl-Gefrierkombination in einer Holzküche mit Kochinsel", "Liebherr ICNd 5603 Pure: open fridge-freezer in a wooden kitchen with an island", "Liebherr ICNd 5603 Pure : combiné ouvert dans une cuisine en bois avec îlot", "Liebherr ICNd 5603 Pure: frigocongelatore aperto in una cucina in legno con isola"), P("icnd-5603-2224633")),
      raum("liebherr-einbau-kuehl-gefrierkombination-pure-4.webp", 1200, 849, T("Liebherr ICNd 5603 Pure: Holzküche mit geöffneter Kühl-Gefrierkombination, Kochinsel und Blick in den Garten", "Liebherr ICNd 5603 Pure: wooden kitchen with open fridge-freezer, island and a view of the garden", "Liebherr ICNd 5603 Pure : cuisine en bois avec combiné ouvert, îlot et vue sur le jardin", "Liebherr ICNd 5603 Pure: cucina in legno con frigocongelatore aperto, isola e vista sul giardino"), P("icnd-5603-2224633")),
    ]),
    ausfuehrungen: ausf("liebherr-einbau-kuehl-gefrierkombination-pure"),
    herstellerUrl: KAT_KGK,
    quellen: Object.freeze([KAT_KGK, SERIEN, P("icnd-5603-2224633")]),
    stand: STAND,
    preis: uvp(1709, P("icnd-5603-2224633")),
  }),
  Object.freeze({
    slug: "liebherr-einbau-kuehl-gefrierkombination-plus",
    marke: "liebherr",
    bereich: "kueche",
    kategorie: "kuehlen",
    name: "Einbau-Kühl-Gefrierkombination Plus",
    serie: "Plus",
    kurz: T(
      "Integrierbare Kühl-Gefrierkombinationen der Serie Plus, wahlweise mit EasyFresh oder BioFresh und mit SmartFrost oder NoFrost. Für Nischenhöhen von 177 und 194 cm.",
      "Integrated fridge-freezers from the Plus series, with EasyFresh or BioFresh and SmartFrost or NoFrost. For niche heights of 177 and 194 cm.",
      "Combinés réfrigérateur-congélateur intégrables de la série Plus, avec EasyFresh ou BioFresh et SmartFrost ou NoFrost. Pour des niches de 177 et 194 cm de haut.",
      "Frigocongelatori da incasso della serie Plus, con EasyFresh o BioFresh e SmartFrost o NoFrost. Per nicchie alte 177 e 194 cm."
    ),
    merkmale: Object.freeze([
      "ICc 5123 · ICNb 5123 · ICNSd 5123 · ICNd 5133 · ICBa 5123 · ICBbi 5122 · ICBSd 5122 · ICBNdi 5123 · ICBNc 5623 · ICBNSd 5623 · ICBNc 7623 · ICBNSd 7623",
      M.plus,
      beispiel("ICc 5123", "EasyFresh, SmartFrost, DuoCooling, Touch-Display, SoftSystem", "EasyFresh, SmartFrost, DuoCooling, touch display, SoftSystem", "EasyFresh, SmartFrost, DuoCooling, écran tactile, SoftSystem", "EasyFresh, SmartFrost, DuoCooling, display touch, SoftSystem"),
      volumen("244–347"),
      M.nische,
      M.varianten,
    ]),
    masse: Object.freeze([mass("nische", "177,2–178,8 × 56–57 × 55 cm · 194–195 × 56–57 × 55 cm · 194–195 × 71–72 × 56 cm")]),
    bilder: Object.freeze([
      bild("liebherr-einbau-kuehl-gefrierkombination-plus-1.webp", 629, 1200, altProdukt("ICc 5123 Plus", "kgk", "offen"), P("icc-5123-2224633")),
    ]),
    ausfuehrungen: ausf("liebherr-einbau-kuehl-gefrierkombination-plus"),
    herstellerUrl: KAT_KGK,
    quellen: Object.freeze([KAT_KGK, SERIEN, P("icc-5123-2224633")]),
    stand: STAND,
    preis: uvp(1589, P("icc-5123-2224633")),
  }),
  Object.freeze({
    slug: "liebherr-einbau-kuehl-gefrierkombination-prime",
    marke: "liebherr",
    bereich: "kueche",
    kategorie: "kuehlen",
    name: "Einbau-Kühl-Gefrierkombination Prime",
    serie: "Prime",
    kurz: T(
      "Integrierbare Kühl-Gefrierkombinationen der Serie Prime, deren Innenraum laut Hersteller vor allem Echtmaterialien wie Edelstahl verwendet. Mit EasyFresh oder BioFresh, für Nischen von 56 und 71 cm Breite.",
      "Integrated fridge-freezers from the Prime series, whose interiors, according to the manufacturer, mainly use genuine materials such as stainless steel. With EasyFresh or BioFresh, for 56 and 71 cm wide niches.",
      "Combinés réfrigérateur-congélateur intégrables de la série Prime, dont l’intérieur utilise surtout, selon le fabricant, des matériaux authentiques comme l’inox. Avec EasyFresh ou BioFresh, pour niches de 56 et 71 cm.",
      "Frigocongelatori da incasso della serie Prime, il cui interno secondo il produttore utilizza soprattutto materiali autentici come l’acciaio inox. Con EasyFresh o BioFresh, per nicchie larghe 56 e 71 cm."
    ),
    merkmale: Object.freeze([
      "SICNdi 5153 · ICBNbi 5153 · ICBbi 5152 · ICBNdi 5163 · ICBNci 5663 · ICBNbi 7663",
      M.prime,
      beispiel("SICNdi 5153", "EasyFresh, NoFrost, DuoCooling, VarioTemp, LightTower, SmartDeviceBox integriert", "EasyFresh, NoFrost, DuoCooling, VarioTemp, LightTower, integrated SmartDeviceBox", "EasyFresh, NoFrost, DuoCooling, VarioTemp, LightTower, SmartDeviceBox intégrée", "EasyFresh, NoFrost, DuoCooling, VarioTemp, LightTower, SmartDeviceBox integrata"),
      volumen("245–349"),
      M.nische,
      M.varianten,
    ]),
    masse: Object.freeze([mass("nische", "177,2–178,8 × 56–57 × 55 cm · 194–195 × 56–57 × 55 cm · 194–195 × 71–72 × 56 cm")]),
    bilder: Object.freeze([
      bild("liebherr-einbau-kuehl-gefrierkombination-prime-1.webp", 629, 1200, altProdukt("SICNdi 5153 Prime NoFrost", "kgk", "offen"), P("sicndi-5153-2224633")),
      raum("liebherr-einbau-kuehl-gefrierkombination-prime-2.webp", 1200, 849, T("Liebherr SICNdi 5153 Prime: geöffnetes Gerät in einer dunklen Küche hinter einer Glastrennwand zum Wohnraum", "Liebherr SICNdi 5153 Prime: open appliance in a dark kitchen behind a glass partition to the living area", "Liebherr SICNdi 5153 Prime : appareil ouvert dans une cuisine sombre, derrière une cloison vitrée donnant sur le séjour", "Liebherr SICNdi 5153 Prime: apparecchio aperto in una cucina scura dietro una parete in vetro verso il soggiorno"), P("sicndi-5153-2224633")),
      raum("liebherr-einbau-kuehl-gefrierkombination-prime-3.webp", 1600, 900, T("Liebherr Prime: drei Einbau-Kühl-Gefrierkombinationen (ICBNbi 7663, ICBNci 5663, ICBNdi 5163) mit geöffneten Türen in einer Schrankwand", "Liebherr Prime: three integrated fridge-freezers (ICBNbi 7663, ICBNci 5663, ICBNdi 5163) with open doors in a run of cabinets", "Liebherr Prime : trois combinés intégrables (ICBNbi 7663, ICBNci 5663, ICBNdi 5163), portes ouvertes, dans un mur d’armoires", "Liebherr Prime: tre frigocongelatori da incasso (ICBNbi 7663, ICBNci 5663, ICBNdi 5163) con porte aperte in una parete attrezzata"), HAUSGERAETE),
    ]),
    ausfuehrungen: ausf("liebherr-einbau-kuehl-gefrierkombination-prime"),
    herstellerUrl: KAT_KGK,
    quellen: Object.freeze([KAT_KGK, SERIEN, P("sicndi-5153-2224633")]),
    stand: STAND,
    preis: uvp(2219, P("sicndi-5153-2224633")),
  }),
  Object.freeze({
    slug: "liebherr-einbau-kuehl-gefrierkombination-peak",
    marke: "liebherr",
    bereich: "kueche",
    kategorie: "kuehlen",
    name: "Einbau-Kühl-Gefrierkombination Peak",
    serie: "Peak",
    kurz: T(
      "Integrierbare Kühl-Gefrierkombinationen der obersten Liebherr-Serie Peak für 177-cm-Nischen, mit EasyFresh oder BioFresh Professional und NoFrost.",
      "Integrated fridge-freezers from Liebherr’s top Peak series for 177 cm niches, with EasyFresh or BioFresh Professional and NoFrost.",
      "Combinés réfrigérateur-congélateur intégrables de la série Peak, la plus haute de la gamme Liebherr, pour niches de 177 cm, avec EasyFresh ou BioFresh Professional et NoFrost.",
      "Frigocongelatori da incasso della serie Peak, la più alta della gamma Liebherr, per nicchie da 177 cm, con EasyFresh o BioFresh Professional e NoFrost."
    ),
    merkmale: Object.freeze([
      "ICNbsci 5173 · ICBNbsci 5173 · ICBNci 5183",
      M.peak,
      beispiel("ICNbsci 5173", "EasyFresh, NoFrost, DuoCooling, VarioTemp, Ambiente-Beleuchtung, SmartDeviceBox integriert", "EasyFresh, NoFrost, DuoCooling, VarioTemp, ambient lighting, integrated SmartDeviceBox", "EasyFresh, NoFrost, DuoCooling, VarioTemp, éclairage d’ambiance, SmartDeviceBox intégrée", "EasyFresh, NoFrost, DuoCooling, VarioTemp, illuminazione d’atmosfera, SmartDeviceBox integrata"),
      volumen("246–255"),
      M.nische,
      M.varianten,
    ]),
    masse: Object.freeze([mass("nische", "177,2–178,8 × 56–57 × 55 cm")]),
    bilder: Object.freeze([
      bild("liebherr-einbau-kuehl-gefrierkombination-peak-1.webp", 629, 1200, altProdukt("ICNbsci 5173 Peak NoFrost", "kgk", "offen"), P("icncx-5173-2224633")),
    ]),
    ausfuehrungen: ausf("liebherr-einbau-kuehl-gefrierkombination-peak"),
    herstellerUrl: KAT_KGK,
    quellen: Object.freeze([KAT_KGK, SERIEN, P("icncx-5173-2224633")]),
    stand: STAND,
    preis: uvp(3179, P("icncx-5173-2224633")),
  }),
  Object.freeze({
    slug: "liebherr-ecbne-biofresh-nofrost",
    marke: "liebherr",
    bereich: "kueche",
    kategorie: "kuehlen",
    name: "ECBNe BioFresh NoFrost",
    kurz: T(
      "Integrierbare Kühl-Gefrierkombinationen in 76 und 91 cm Breite für Nischen von 203 bis 207 cm Höhe, mit BioFresh, NoFrost und IceMaker mit Festwasseranschluss.",
      "Integrated fridge-freezers 76 and 91 cm wide for niches 203 to 207 cm high, with BioFresh, NoFrost and a plumbed-in IceMaker.",
      "Combinés réfrigérateur-congélateur intégrables de 76 et 91 cm de large pour niches de 203 à 207 cm de haut, avec BioFresh, NoFrost et IceMaker raccordé à l’eau.",
      "Frigocongelatori da incasso larghi 76 e 91 cm per nicchie alte da 203 a 207 cm, con BioFresh, NoFrost e IceMaker con allacciamento idrico."
    ),
    merkmale: Object.freeze([
      "ECBNe 7870 · ECBNe 7871 · ECBNe 8870 · ECBNe 8871 · ECBNe 8872",
      beispiel("ECBNe 8870", "BioFresh, DuoCooling, NoFrost, SuperCool, SuperFrost, IceMaker mit Festwasseranschluss (mit MaxIce bis zu 1,5 kg Eiswürfel täglich)", "BioFresh, DuoCooling, NoFrost, SuperCool, SuperFrost, plumbed-in IceMaker (up to 1.5 kg of ice cubes a day with MaxIce)", "BioFresh, DuoCooling, NoFrost, SuperCool, SuperFrost, IceMaker raccordé à l’eau (jusqu’à 1,5 kg de glaçons par jour avec MaxIce)", "BioFresh, DuoCooling, NoFrost, SuperCool, SuperFrost, IceMaker con allacciamento idrico (fino a 1,5 kg di cubetti al giorno con MaxIce)"),
      volumen("402–522"),
      M.kein_preis,
      M.nische,
      M.varianten,
    ]),
    masse: Object.freeze([mass("nische", "203,2–207,2 × 76,2 × 63,5 cm · 203,2–207,2 × 91,5 × 63,5 cm")]),
    bilder: Object.freeze([
      bild("liebherr-ecbne-biofresh-nofrost-1.webp", 915, 1200, altProdukt("ECBNe 8870 BioFresh NoFrost", "kgk", "offen"), P("ecbne-8870-2224633")),
      raum("liebherr-ecbne-biofresh-nofrost-2.webp", 1200, 777, T("Liebherr ECBNe 8870: geöffnete Kühl-Gefrierkombination in einer Küche mit schwarzen Fronten und hellen Holzrahmen", "Liebherr ECBNe 8870: open fridge-freezer in a kitchen with black fronts and light wooden frames", "Liebherr ECBNe 8870 : combiné ouvert dans une cuisine aux façades noires encadrées de bois clair", "Liebherr ECBNe 8870: frigocongelatore aperto in una cucina con ante nere e cornici in legno chiaro"), P("ecbne-8870-2224633")),
    ]),
    ausfuehrungen: ausf("liebherr-ecbne-biofresh-nofrost"),
    herstellerUrl: KAT_KGK,
    quellen: Object.freeze([KAT_KGK, P("ecbne-8870-2224633")]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "liebherr-monolith-kuehl-gefrierkombination",
    marke: "liebherr",
    bereich: "kueche",
    kategorie: "kuehlen",
    name: "Monolith Kühl-Gefrierkombination",
    serie: "Monolith",
    kurz: T(
      "Integrierbare Monolith-Kühl-Gefrierkombinationen mit Gefrierteil unten, als Einzeltür in 76,2 und 91,44 cm sowie als French Door in 91,44 cm Breite. Mit BioFresh-Plus und NoFrost.",
      "Integrated Monolith fridge-freezers with the freezer at the bottom, as single-door models 76.2 and 91.44 cm wide and as a French door model 91.44 cm wide. With BioFresh-Plus and NoFrost.",
      "Combinés intégrables Monolith avec congélateur en bas, en porte simple de 76,2 et 91,44 cm et en French Door de 91,44 cm de large. Avec BioFresh-Plus et NoFrost.",
      "Frigocongelatori da incasso Monolith con congelatore in basso, a porta singola da 76,2 e 91,44 cm e French Door da 91,44 cm di larghezza. Con BioFresh-Plus e NoFrost."
    ),
    merkmale: Object.freeze([
      "ECBNei 9770 · ECBNei 9771 · ECBNdi 9970 · ECBNdi 9971 · ECBNei 9972",
      M.monolith,
      T(
        "BioFresh-Plus: drei Schubladen mit eigener Klimaregelung, eine davon bis −2 °C",
        "BioFresh-Plus: three drawers with separate climate control, one of them down to −2 °C",
        "BioFresh-Plus : trois tiroirs à climat réglable séparément, dont un jusqu’à −2 °C",
        "BioFresh-Plus: tre cassetti con clima regolabile separatamente, uno fino a −2 °C"
      ),
      beispiel("ECBNdi 9970", "BioFresh-Plus, NoFrost, DuoCooling, SmartDevice, InfinitySwipe", "BioFresh-Plus, NoFrost, DuoCooling, SmartDevice, InfinitySwipe", "BioFresh-Plus, NoFrost, DuoCooling, SmartDevice, InfinitySwipe", "BioFresh-Plus, NoFrost, DuoCooling, SmartDevice, InfinitySwipe"),
      volumen("412–514"),
      M.kein_preis,
      M.nische,
      M.varianten,
    ]),
    masse: Object.freeze([mass("nische", "213,4 × 76,2 × 63,5 cm · 213,4 × 91,4 × 63,5 cm")]),
    bilder: Object.freeze([
      bild("liebherr-monolith-kuehl-gefrierkombination-1.webp", 1200, 1200, altProdukt("ECBNdi 9970 BioFresh NoFrost", "kgk", "offen"), P("ecbndi-9970-2224633")),
      raum("liebherr-monolith-kuehl-gefrierkombination-2.webp", 1200, 750, T("Liebherr Monolith ECBNdi 9970: geöffnetes Gerät mit Edelstahltüren in einer dunklen Wohnküche mit Kamin", "Liebherr Monolith ECBNdi 9970: open appliance with stainless steel doors in a dark open-plan kitchen with a fireplace", "Liebherr Monolith ECBNdi 9970 : appareil ouvert aux portes inox dans une cuisine ouverte sombre avec cheminée", "Liebherr Monolith ECBNdi 9970: apparecchio aperto con porte in acciaio inox in una cucina abitabile scura con camino"), P("ecbndi-9970-2224633")),
    ]),
    ausfuehrungen: ausf("liebherr-monolith-kuehl-gefrierkombination"),
    herstellerUrl: MONOLITH,
    quellen: Object.freeze([MONOLITH, KAT_KGK, P("ecbndi-9970-2224633")]),
    stand: STAND,
  }),

  // ------------------------------------------------- Einbaukühlschränke
  Object.freeze({
    slug: "liebherr-einbaukuehlschrank-pure",
    marke: "liebherr",
    bereich: "kueche",
    kategorie: "kuehlen",
    name: "Einbaukühlschrank Pure",
    serie: "Pure",
    kurz: T(
      "Integrierbare Kühlschränke der Basis-Serie Pure mit EasyFresh-Safe für Nischen von 88 und 122 cm Höhe, auch als dekorfähige Ausführung.",
      "Integrated refrigerators from the entry-level Pure series with EasyFresh safe for niches 88 and 122 cm high, also as a decor-panel version.",
      "Réfrigérateurs intégrables de la série de base Pure avec compartiment EasyFresh pour niches de 88 et 122 cm de haut, aussi en version à décor.",
      "Frigoriferi da incasso della serie base Pure con cassetto EasyFresh per nicchie alte 88 e 122 cm, anche in versione con pannello decorativo."
    ),
    merkmale: Object.freeze([
      "IRe 3900 · IRe 3901 · IRd 3900 · IRd 3901 · IRSe 3900 · IRSe 3901 · IRSe 4100 · IRSe 4101 · DRe 3900 · DRe 3901 · DRe 4101",
      M.pure,
      beispiel("IRe 3900", "EasyFresh, Touch-Display, SuperSilent, LED-Deckenbeleuchtung, höhenverstellbare Glasplatten", "EasyFresh, touch display, SuperSilent, LED ceiling light, height-adjustable glass shelves", "EasyFresh, écran tactile, SuperSilent, éclairage LED au plafond, clayettes en verre réglables", "EasyFresh, display touch, SuperSilent, illuminazione LED a soffitto, ripiani in vetro regolabili"),
      volumen("117–201"),
      M.nische,
      M.varianten,
    ]),
    masse: Object.freeze([mass("nische", "87,4–89 × 56–57 × 55 cm · 121,6–123,6 × 56–57 × 55 cm")]),
    bilder: Object.freeze([
      bild("liebherr-einbaukuehlschrank-pure-1.webp", 1082, 1200, altProdukt("IRe 3900 Pure", "ks", "offen"), P("ire-3900-2224647")),
    ]),
    ausfuehrungen: ausf("liebherr-einbaukuehlschrank-pure"),
    zubehoer: z(SBS, "liebherr-einbau-gefrierschrank-pure"),
    herstellerUrl: KAT_KS,
    quellen: Object.freeze([KAT_KS, KAT_KS2, SERIEN, P("ire-3900-2224647")]),
    stand: STAND,
    preis: uvp(579, P("ire-3900-2224647")),
  }),
  Object.freeze({
    slug: "liebherr-einbaukuehlschrank-plus",
    marke: "liebherr",
    bereich: "kueche",
    kategorie: "kuehlen",
    name: "Einbaukühlschrank Plus",
    serie: "Plus",
    kurz: T(
      "Integrierbare Kühlschränke der Serie Plus mit EasyFresh oder BioFresh, teils mit Kellerfach oder Flaschenkorb, für Nischenhöhen von 88 bis 195 cm.",
      "Integrated refrigerators from the Plus series with EasyFresh or BioFresh, some with a cellar compartment or bottle basket, for niche heights from 88 to 195 cm.",
      "Réfrigérateurs intégrables de la série Plus avec EasyFresh ou BioFresh, certains avec compartiment cave ou panier à bouteilles, pour niches de 88 à 195 cm de haut.",
      "Frigoriferi da incasso della serie Plus con EasyFresh o BioFresh, alcuni con vano cantina o cestello portabottiglie, per nicchie alte da 88 a 195 cm."
    ),
    merkmale: Object.freeze([
      "IRc 3920 · IRc 3921 · IRd 4020 · IRd 4021 · IRBc 4020 · IRc 4120 · IRc 4121 · IRBc 4120 · IRBc 4121 · IRBc 4520 · IRBc 4521 · IRBc 5120 · IRBc 5121 · IRDdi 5120 · IRDdi 5121 · IRCe 5121 · IRCBe 5121 · IRBci 5620",
      M.plus,
      beispiel("IRc 3920", "EasyFresh, Touch-Display, SoftSystem, UltraSilent, LED-Deckenbeleuchtung", "EasyFresh, touch display, SoftSystem, UltraSilent, LED ceiling light", "EasyFresh, écran tactile, SoftSystem, UltraSilent, éclairage LED au plafond", "EasyFresh, display touch, SoftSystem, UltraSilent, illuminazione LED a soffitto"),
      volumen("117–323"),
      M.nische,
      M.varianten,
    ]),
    masse: Object.freeze([mass("nische", "87,4–89 / 102,4–104 / 121,6–123,6 / 139,7–141,3 / 177,2–178,8 / 194–195 × 56–57 × 55 cm")]),
    bilder: Object.freeze([
      bild("liebherr-einbaukuehlschrank-plus-1.webp", 1082, 1200, altProdukt("IRc 3920 Plus", "ks", "offen"), P("irc-3920-2224647")),
    ]),
    ausfuehrungen: ausf("liebherr-einbaukuehlschrank-plus"),
    zubehoer: z(SBS, "liebherr-einbau-gefrierschrank-plus"),
    herstellerUrl: KAT_KS,
    quellen: Object.freeze([KAT_KS, KAT_KS2, SERIEN, P("irc-3920-2224647")]),
    stand: STAND,
    preis: uvp(769, P("irc-3920-2224647")),
  }),
  Object.freeze({
    slug: "liebherr-einbaukuehlschrank-prime",
    marke: "liebherr",
    bereich: "kueche",
    kategorie: "kuehlen",
    name: "Einbaukühlschrank Prime",
    serie: "Prime",
    kurz: T(
      "Integrierbare Kühlschränke der Serie Prime mit EasyFresh oder BioFresh und Touch & Swipe-Display, in sieben Nischenhöhen von 88 bis 195 cm.",
      "Integrated refrigerators from the Prime series with EasyFresh or BioFresh and Touch & Swipe display, in seven niche heights from 88 to 195 cm.",
      "Réfrigérateurs intégrables de la série Prime avec EasyFresh ou BioFresh et écran Touch & Swipe, en sept hauteurs de niche de 88 à 195 cm.",
      "Frigoriferi da incasso della serie Prime con EasyFresh o BioFresh e display Touch & Swipe, in sette altezze di nicchia da 88 a 195 cm."
    ),
    merkmale: Object.freeze([
      "IRci 3950 · IRbi 3951 · IRBbi 4050 · IRBci 4150 · IRBci 4151 · IRBci 4550 · IRBdi 4851 · IRBbi 5150 · IRBbi 5151 · IRBbi 5650",
      M.prime,
      beispiel("IRci 3950", "EasyFresh, Touch & Swipe-Display, SoftSystem, UltraSilent, SmartDeviceBox integriert", "EasyFresh, Touch & Swipe display, SoftSystem, UltraSilent, integrated SmartDeviceBox", "EasyFresh, écran Touch & Swipe, SoftSystem, UltraSilent, SmartDeviceBox intégrée", "EasyFresh, display Touch & Swipe, SoftSystem, UltraSilent, SmartDeviceBox integrata"),
      volumen("117–325"),
      M.nische,
      M.varianten,
    ]),
    masse: Object.freeze([mass("nische", "87,4–89 / 102,4–104 / 121,6–123,6 / 139,7–141,3 / 157,4–159 / 177,2–178,8 / 194–195 × 56–57 × 55 cm")]),
    bilder: Object.freeze([
      bild("liebherr-einbaukuehlschrank-prime-1.webp", 1082, 1200, altProdukt("IRci 3950 Prime", "ks", "offen"), P("irci-3950-2224647")),
    ]),
    ausfuehrungen: ausf("liebherr-einbaukuehlschrank-prime"),
    zubehoer: z(SBS, "liebherr-einbau-gefrierschrank-prime"),
    herstellerUrl: KAT_KS,
    quellen: Object.freeze([KAT_KS, KAT_KS2, SERIEN, P("irci-3950-2224647")]),
    stand: STAND,
    preis: uvp(1079, P("irci-3950-2224647")),
  }),
  Object.freeze({
    slug: "liebherr-einbaukuehlschrank-peak",
    marke: "liebherr",
    bereich: "kueche",
    kategorie: "kuehlen",
    name: "Einbaukühlschrank Peak",
    serie: "Peak",
    kurz: T(
      "Integrierbare Kühlschränke der Serie Peak, überwiegend mit BioFresh Professional und HydroBreeze; einzelne Modelle öffnen mit AutoDoor selbsttätig. Für Nischenhöhen von 122 bis 179 cm.",
      "Integrated refrigerators from the Peak series, mostly with BioFresh Professional and HydroBreeze; some models open automatically with AutoDoor. For niche heights from 122 to 179 cm.",
      "Réfrigérateurs intégrables de la série Peak, pour la plupart avec BioFresh Professional et HydroBreeze ; certains modèles s’ouvrent seuls grâce à AutoDoor. Pour niches de 122 à 179 cm de haut.",
      "Frigoriferi da incasso della serie Peak, per lo più con BioFresh Professional e HydroBreeze; alcuni modelli si aprono da soli con AutoDoor. Per nicchie alte da 122 a 179 cm."
    ),
    merkmale: Object.freeze([
      "IRBbi 4170 · IRBbi 4171 · IRBbsbi 4170 · IRBbsbi 4570 · IRBci 4571 · IRBci 5170 · IRBdi 5170 · IRBPci 5170 · IRBbsci 5170 · IRBbsci 5171 · IRBci 5180 · IRBAc 5171 · IRBAc 5190",
      M.peak,
      beispiel("IRBbi 4170", "BioFresh Professional mit HydroBreeze, Fruit & Vegetable-Safe, LightTower, Ambiente-Beleuchtung, SmartDeviceBox integriert", "BioFresh Professional with HydroBreeze, Fruit & Vegetable safe, LightTower, ambient lighting, integrated SmartDeviceBox", "BioFresh Professional avec HydroBreeze, compartiment Fruit & Vegetable, LightTower, éclairage d’ambiance, SmartDeviceBox intégrée", "BioFresh Professional con HydroBreeze, cassetto Fruit & Vegetable, LightTower, illuminazione d’atmosfera, SmartDeviceBox integrata"),
      T("AutoDoor (IRBAc 5171, IRBAc 5190) mit Türanschlag rechts oder links", "AutoDoor (IRBAc 5171, IRBAc 5190) with right or left door hinge", "AutoDoor (IRBAc 5171, IRBAc 5190) avec charnières à droite ou à gauche", "AutoDoor (IRBAc 5171, IRBAc 5190) con apertura a destra o a sinistra"),
      volumen("174–297"),
      M.nische,
      M.varianten,
    ]),
    masse: Object.freeze([mass("nische", "121,6–123,6 / 139,7–141,3 / 177,2–178,8 / 177,7–179,3 × 56–57 × 55 cm")]),
    bilder: Object.freeze([
      bild("liebherr-einbaukuehlschrank-peak-1.webp", 846, 1200, altProdukt("IRBbi 4170 Peak BioFresh", "ks", "offen"), P("irbbi-4170-2224647")),
      raum("liebherr-einbaukuehlschrank-peak-2.webp", 1200, 849, T("Liebherr IRBbi 4170 Peak: geöffneter Kühlschrank in einer dunkelgrünen Küchenzeile mit Blick in den Wohnbereich", "Liebherr IRBbi 4170 Peak: open refrigerator in a dark green kitchen run looking onto the living area", "Liebherr IRBbi 4170 Peak : réfrigérateur ouvert dans une cuisine vert foncé avec vue sur le séjour", "Liebherr IRBbi 4170 Peak: frigorifero aperto in una cucina verde scuro con vista sulla zona giorno"), P("irbbi-4170-2224647")),
    ]),
    ausfuehrungen: ausf("liebherr-einbaukuehlschrank-peak", TUERANSCHLAG),
    zubehoer: z(SBS, "liebherr-einbau-gefrierschrank-peak"),
    herstellerUrl: KAT_KS,
    quellen: Object.freeze([KAT_KS, KAT_KS2, SERIEN, P("irbbi-4170-2224647")]),
    stand: STAND,
    preis: uvp(2289, P("irbbi-4170-2224647")),
  }),
  Object.freeze({
    slug: "liebherr-monolith-kuehlschrank",
    marke: "liebherr",
    bereich: "kueche",
    kategorie: "kuehlen",
    name: "Monolith Kühlschrank",
    serie: "Monolith",
    kurz: T(
      "Integrierbare Monolith-Kühlschränke mit BioFresh-Plus in 61, 76,2 und 91,4 cm Breite für 213,4 cm hohe Nischen. Kombinierbar mit Monolith-Gefrier- und -Weinschränken.",
      "Integrated Monolith refrigerators with BioFresh-Plus, 61, 76.2 and 91.4 cm wide, for 213.4 cm high niches. Can be combined with Monolith freezers and wine cabinets.",
      "Réfrigérateurs intégrables Monolith avec BioFresh-Plus, en 61, 76,2 et 91,4 cm de large, pour niches de 213,4 cm de haut. Combinables avec congélateurs et caves à vin Monolith.",
      "Frigoriferi da incasso Monolith con BioFresh-Plus, larghi 61, 76,2 e 91,4 cm, per nicchie alte 213,4 cm. Abbinabili a congelatori e cantine Monolith."
    ),
    merkmale: Object.freeze([
      "ERBdi 9670 · ERBdi 9671 · ERBdi 9770 · ERBdi 9771 · ERBdi 9970 · ERBdi 9971",
      M.monolith,
      T(
        "Laut Monolith-Seite: PowerCooling, FlexSystem, InfinityBeam-Licht in den BioFresh-Safes, Wasserspender InfinitySpring mit Filter",
        "According to the Monolith page: PowerCooling, FlexSystem, InfinityBeam lighting in the BioFresh safes, InfinitySpring water dispenser with filter",
        "Selon la page Monolith : PowerCooling, FlexSystem, éclairage InfinityBeam des compartiments BioFresh, fontaine à eau InfinitySpring avec filtre",
        "Secondo la pagina Monolith: PowerCooling, FlexSystem, luce InfinityBeam nei cassetti BioFresh, erogatore d’acqua InfinitySpring con filtro"
      ),
      beispiel("ERBdi 9770", "BioFresh-Plus, SuperSilent, SmartDevice, InfinitySwipe, InfinityLight", "BioFresh-Plus, SuperSilent, SmartDevice, InfinitySwipe, InfinityLight", "BioFresh-Plus, SuperSilent, SmartDevice, InfinitySwipe, InfinityLight", "BioFresh-Plus, SuperSilent, SmartDevice, InfinitySwipe, InfinityLight"),
      volumen("335–542"),
      M.kein_preis,
      M.nische,
      M.varianten,
    ]),
    masse: Object.freeze([mass("nische", "213,4 × 61 / 76,2 / 91,4 × 63,5 cm")]),
    bilder: Object.freeze([
      bild("liebherr-monolith-kuehlschrank-1.webp", 1200, 1200, altProdukt("ERBdi 9770 BioFresh", "ks", "schraeg"), P("erbdi-9770-2224647")),
      raum("liebherr-monolith-kuehlschrank-2.webp", 1200, 565, T("Liebherr Monolith: Edelstahl-Geräte in einer offenen Küche mit Kochinsel und großen Fenstern", "Liebherr Monolith: stainless steel appliances in an open kitchen with island and large windows", "Liebherr Monolith : appareils inox dans une cuisine ouverte avec îlot et grandes baies", "Liebherr Monolith: apparecchi in acciaio inox in una cucina aperta con isola e grandi finestre"), P("erbdi-9770-2224647")),
      raum("liebherr-monolith-kuehlschrank-3.webp", 1200, 750, T("Liebherr Monolith ERBdi 9770: geöffneter Kühlschrank in einer dunklen Schrankwand neben Kamin und Essplatz", "Liebherr Monolith ERBdi 9770: open refrigerator in a dark wall of units next to a fireplace and dining area", "Liebherr Monolith ERBdi 9770 : réfrigérateur ouvert dans un mur d’armoires sombre, près d’une cheminée et d’un coin repas", "Liebherr Monolith ERBdi 9770: frigorifero aperto in una parete scura accanto a camino e zona pranzo"), P("erbdi-9770-2224647")),
    ]),
    ausfuehrungen: ausf("liebherr-monolith-kuehlschrank"),
    zubehoer: z(MONO_KOMBI, "liebherr-monolith-gefrierschrank", "liebherr-monolith-weintemperierschrank"),
    herstellerUrl: MONOLITH,
    quellen: Object.freeze([MONOLITH, KAT_KS, P("erbdi-9770-2224647")]),
    stand: STAND,
  }),

  // ------------------------------------------------- Unterbau
  Object.freeze({
    slug: "liebherr-unterbaukuehlschrank-pure",
    marke: "liebherr",
    bereich: "kueche",
    kategorie: "kuehlen",
    name: "Unterbaukühlschrank Pure",
    serie: "Pure",
    kurz: T(
      "Integrierbare Unterbaukühlschränke der Serie Pure für 60 cm breite Nischen unter der Arbeitsplatte, auch dekorfähig.",
      "Integrated under-counter refrigerators from the Pure series for 60 cm wide niches below the worktop, also with decor panel.",
      "Réfrigérateurs sous plan intégrables de la série Pure pour niches de 60 cm sous le plan de travail, aussi en version à décor.",
      "Frigoriferi sottopiano da incasso della serie Pure per nicchie larghe 60 cm sotto il piano di lavoro, anche con pannello decorativo."
    ),
    merkmale: Object.freeze([
      "URd 3600 · URd 3601 · URc 3700 · URc 3701 · DURd 3600 · DURd 3601",
      beispiel("URd 3600", "Obst- und Gemüsebox, TouchControl, LED-Innenbeleuchtung, GlassLine-Abstellflächen", "fruit and vegetable box, TouchControl, LED interior light, GlassLine shelves", "bac à fruits et légumes, TouchControl, éclairage intérieur LED, clayettes GlassLine", "cassetto frutta e verdura, TouchControl, illuminazione interna LED, ripiani GlassLine"),
      volumen("106–134"),
      M.nische,
      M.varianten,
    ]),
    masse: Object.freeze([mass("nische", "82–88 × 60 × 56 cm · 86–92 × 60 × 56 cm")]),
    bilder: Object.freeze([
      bild("liebherr-unterbaukuehlschrank-pure-1.webp", 1200, 913, altProdukt("URd 3600 Pure", "uks", "offen"), P("urd-3600-2224647")),
      raum("liebherr-unterbaukuehlschrank-pure-2.webp", 1200, 849, T("Liebherr Unterbaugeräte: mehrere geöffnete Geräte in einer dunklen Kücheninsel", "Liebherr under-counter appliances: several open units in a dark kitchen island", "Appareils sous plan Liebherr : plusieurs appareils ouverts dans un îlot sombre", "Apparecchi sottopiano Liebherr: diversi apparecchi aperti in un’isola scura"), P("urd-3600-2224647")),
    ]),
    ausfuehrungen: ausf("liebherr-unterbaukuehlschrank-pure"),
    herstellerUrl: KAT_KS,
    quellen: Object.freeze([KAT_KS, P("urd-3600-2224647")]),
    stand: STAND,
    preis: uvp(839, P("urd-3600-2224647")),
  }),
  Object.freeze({
    slug: "liebherr-unterbaukuehlschrank-prime",
    marke: "liebherr",
    bereich: "kueche",
    kategorie: "kuehlen",
    name: "Unterbaukühlschrank Prime",
    serie: "Prime",
    kurz: T(
      "Integrierbare Unterbaukühlschränke der Serie Prime: mit Tür, mit Auszugswagen, mit zwei Schubladen oder als Vollraum-BioFresh-Gerät.",
      "Integrated under-counter refrigerators from the Prime series: with a door, a pull-out trolley, two drawers or as a full-space BioFresh unit.",
      "Réfrigérateurs sous plan intégrables de la série Prime : à porte, à chariot coulissant, à deux tiroirs ou entièrement BioFresh.",
      "Frigoriferi sottopiano da incasso della serie Prime: con porta, con carrello estraibile, con due cassetti o interamente BioFresh."
    ),
    merkmale: Object.freeze([
      "URd 365i · URc 375i · URPd 365i · URPc 375i · URDd 375i · SUBa30 375i",
      beispiel("URd 365i", "EasyFresh-Safe, Touch & Swipe-Display, SmartDeviceBox integriert, GlassLine-Abstellflächen", "EasyFresh safe, Touch & Swipe display, integrated SmartDeviceBox, GlassLine shelves", "compartiment EasyFresh, écran Touch & Swipe, SmartDeviceBox intégrée, clayettes GlassLine", "cassetto EasyFresh, display Touch & Swipe, SmartDeviceBox integrata, ripiani GlassLine"),
      volumen("80–134"),
      M.nische,
      M.varianten,
    ]),
    masse: Object.freeze([mass("nische", "82–88 × 60 × 56 cm · 86–92 × 60 × 56 cm")]),
    bilder: Object.freeze([
      bild("liebherr-unterbaukuehlschrank-prime-1.webp", 1200, 913, altProdukt("URd 365i Prime", "uks", "offen"), P("urd-365i-2224647")),
      raum("liebherr-unterbaukuehlschrank-prime-2.webp", 1200, 677, T("Liebherr URd 365i Prime: geöffneter Unterbaukühlschrank in einer Kücheninsel vor großen Fenstern", "Liebherr URd 365i Prime: open under-counter refrigerator in a kitchen island in front of large windows", "Liebherr URd 365i Prime : réfrigérateur sous plan ouvert dans un îlot devant de grandes baies", "Liebherr URd 365i Prime: frigorifero sottopiano aperto in un’isola davanti a grandi finestre"), P("urd-365i-2224647")),
      raum("liebherr-unterbaukuehlschrank-prime-3.webp", 1200, 849, T("Liebherr URd 365i Prime: geöffneter Unterbaukühlschrank in einer dunklen Kücheninsel mit Barhockern", "Liebherr URd 365i Prime: open under-counter refrigerator in a dark kitchen island with bar stools", "Liebherr URd 365i Prime : réfrigérateur sous plan ouvert dans un îlot sombre avec tabourets de bar", "Liebherr URd 365i Prime: frigorifero sottopiano aperto in un’isola scura con sgabelli"), P("urd-365i-2224647")),
      raum("liebherr-unterbaukuehlschrank-prime-4.webp", 1200, 849, T("Liebherr URd 365i Prime: Kücheninsel mit geöffnetem Unterbaukühlschrank vor großen Fenstern", "Liebherr URd 365i Prime: kitchen island with open under-counter refrigerator in front of large windows", "Liebherr URd 365i Prime : îlot avec réfrigérateur sous plan ouvert devant de grandes baies", "Liebherr URd 365i Prime: isola con frigorifero sottopiano aperto davanti a grandi finestre"), P("urd-365i-2224647")),
    ]),
    ausfuehrungen: ausf("liebherr-unterbaukuehlschrank-prime"),
    herstellerUrl: KAT_KS,
    quellen: Object.freeze([KAT_KS, P("urd-365i-2224647")]),
    stand: STAND,
    preis: uvp(1199, P("urd-365i-2224647")),
  }),
  Object.freeze({
    slug: "liebherr-unterbaukuehlschrank-comfort",
    marke: "liebherr",
    bereich: "kueche",
    kategorie: "kuehlen",
    name: "Unterbau-Kühlschrank Comfort",
    serie: "Comfort",
    kurz: T(
      "Integrierbare Unterbau-Kühlschränke der Serie Comfort für 60 cm breite Nischen, mit Festtürmontage und wechselbarem Türanschlag.",
      "Integrated under-counter refrigerators from the Comfort series for 60 cm wide niches, with fixed-door mounting and reversible door hinge.",
      "Réfrigérateurs sous plan intégrables de la série Comfort pour niches de 60 cm, montage porte fixe et charnières réversibles.",
      "Frigoriferi sottopiano da incasso della serie Comfort per nicchie larghe 60 cm, montaggio a porta fissa e apertura reversibile."
    ),
    merkmale: Object.freeze([
      "UIK 1510 · UIK 1514",
      beispiel("UIK 1510", "SuperCool, Türalarm, transparente Gemüsefächer, VarioSockel", "SuperCool, door alarm, transparent vegetable drawers, VarioSockel plinth", "SuperCool, alarme de porte, bacs à légumes transparents, socle VarioSockel", "SuperCool, allarme porta, cassetti verdura trasparenti, zoccolo VarioSockel"),
      volumen("119–136"),
      M.nische,
      M.varianten,
    ]),
    masse: Object.freeze([mass("nische", "82–88 × 60 × 55 cm")]),
    bilder: Object.freeze([
      bild("liebherr-unterbaukuehlschrank-comfort-1.webp", 1200, 1154, altProdukt("UIK 1510 Comfort", "uks", "offen"), P("uik-1510-2224647")),
      raum("liebherr-unterbaukuehlschrank-comfort-2.webp", 924, 1200, T("Liebherr UIK 1510 Comfort: geöffneter Unterbau-Kühlschrank mit Lebensmitteln in einer weißen Küche", "Liebherr UIK 1510 Comfort: open under-counter refrigerator with food in a white kitchen", "Liebherr UIK 1510 Comfort : réfrigérateur sous plan ouvert, garni d’aliments, dans une cuisine blanche", "Liebherr UIK 1510 Comfort: frigorifero sottopiano aperto con alimenti in una cucina bianca"), P("uik-1510-2224647")),
      raum("liebherr-unterbaukuehlschrank-comfort-3.webp", 1200, 852, T("Liebherr UIK 1510 Comfort: geöffneter Unterbau-Kühlschrank mit Lebensmitteln unter einer dunklen Arbeitsplatte in einer weißen Küche", "Liebherr UIK 1510 Comfort: open under-counter refrigerator with food below a dark worktop in a white kitchen", "Liebherr UIK 1510 Comfort : réfrigérateur sous plan ouvert, garni, sous un plan de travail sombre dans une cuisine blanche", "Liebherr UIK 1510 Comfort: frigorifero sottopiano aperto con alimenti sotto un piano scuro in una cucina bianca"), P("uik-1510-2224647")),
    ]),
    ausfuehrungen: ausf("liebherr-unterbaukuehlschrank-comfort"),
    herstellerUrl: KAT_KS2,
    quellen: Object.freeze([KAT_KS2, P("uik-1510-2224647")]),
    stand: STAND,
    preis: uvp(869, P("uik-1510-2224647")),
  }),
  Object.freeze({
    slug: "liebherr-unterbau-getraenkekuehlschrank",
    marke: "liebherr",
    bereich: "kueche",
    kategorie: "kuehlen",
    name: "Unterbau-Getränkekühlschrank",
    kurz: T(
      "Unterbau-Getränkekühlschränke für 60 cm breite Nischen: UBCgb 3731 (Serie Plus) mit Glastür und Griffmulde, UBCpr 376i (Serie Prime) möbelfrontfähig mit Glasausschnitt.",
      "Under-counter beverage coolers for 60 cm wide niches: UBCgb 3731 (Plus series) with glass door and recessed grip, UBCpr 376i (Prime series) for a furniture front with glass cut-out.",
      "Réfrigérateurs à boissons sous plan pour niches de 60 cm : UBCgb 3731 (série Plus) avec porte vitrée et poignée encastrée, UBCpr 376i (série Prime) habillable avec découpe vitrée.",
      "Frigoriferi per bevande sottopiano per nicchie larghe 60 cm: UBCgb 3731 (serie Plus) con porta in vetro e maniglia incassata, UBCpr 376i (serie Prime) con anta mobile e finestra in vetro."
    ),
    merkmale: Object.freeze([
      "UBCgb 3731 · UBCpr 376i",
      beispiel("UBCgb 3731", "GlassLine-Abstellflächen, höhenverstellbare Glasplatten, FreshAir-Aktivkohlefilter, Displaysperre", "GlassLine shelves, height-adjustable glass shelves, FreshAir activated carbon filter, display lock", "clayettes GlassLine réglables en hauteur, filtre à charbon actif FreshAir, verrouillage de l’écran", "ripiani GlassLine regolabili in altezza, filtro a carbone attivo FreshAir, blocco display"),
      M.nische,
      M.varianten,
    ]),
    masse: Object.freeze([mass("nische", "86–92 × 60 × 56,5 cm")]),
    bilder: Object.freeze([
      bild("liebherr-unterbau-getraenkekuehlschrank-1.webp", 1200, 1182, T("Liebherr UBCgb 3731 Plus: Unterbau-Getränkekühlschrank mit Glastür, geöffnet und mit Getränken bestückt, Frontansicht", "Liebherr UBCgb 3731 Plus: under-counter beverage cooler with glass door, open and stocked with drinks, front view", "Liebherr UBCgb 3731 Plus : réfrigérateur à boissons sous plan à porte vitrée, ouvert et garni de boissons, vue de face", "Liebherr UBCgb 3731 Plus: frigorifero per bevande sottopiano con porta in vetro, aperto e rifornito di bevande, vista frontale"), P("ubcgb-3731-2224647")),
      raum("liebherr-unterbau-getraenkekuehlschrank-2.webp", 1200, 676, T("Liebherr UBCgb 3731 Plus: beleuchteter Getränkekühlschrank in einem Wohnzimmerregal aus dunklem Holz", "Liebherr UBCgb 3731 Plus: illuminated beverage cooler in a dark wood living-room shelving unit", "Liebherr UBCgb 3731 Plus : réfrigérateur à boissons éclairé dans une bibliothèque de salon en bois foncé", "Liebherr UBCgb 3731 Plus: frigorifero per bevande illuminato in una libreria da soggiorno in legno scuro"), P("ubcgb-3731-2224647")),
      raum("liebherr-unterbau-getraenkekuehlschrank-3.webp", 1200, 676, T("Liebherr UBCgb 3731 Plus: Getränkekühlschrank mit Glastür in einem Holzregal im Wohnzimmer, Ledersessel davor", "Liebherr UBCgb 3731 Plus: beverage cooler with glass door in a wooden living-room shelving unit, leather armchair in front", "Liebherr UBCgb 3731 Plus : réfrigérateur à boissons à porte vitrée dans une bibliothèque en bois du salon, fauteuil en cuir devant", "Liebherr UBCgb 3731 Plus: frigorifero per bevande con porta in vetro in una libreria in legno del soggiorno, poltrona in pelle davanti"), P("ubcgb-3731-2224647")),
      raum("liebherr-unterbau-getraenkekuehlschrank-4.webp", 1200, 849, T("Liebherr UBCgb 3731 Plus: Wohnzimmer mit Regalwand, eingebautem Getränkekühlschrank und Fensterfront zur Stadt", "Liebherr UBCgb 3731 Plus: living room with shelving wall, built-in beverage cooler and windows overlooking the city", "Liebherr UBCgb 3731 Plus : salon avec mur de rangement, réfrigérateur à boissons encastré et baies sur la ville", "Liebherr UBCgb 3731 Plus: soggiorno con parete attrezzata, frigorifero per bevande incassato e vetrate sulla città"), P("ubcgb-3731-2224647")),
    ]),
    ausfuehrungen: ausf("liebherr-unterbau-getraenkekuehlschrank"),
    herstellerUrl: GETRAENKE,
    quellen: Object.freeze([GETRAENKE, KAT_KS, P("ubcgb-3731-2224647")]),
    stand: STAND,
    preis: uvp(1709, P("ubcgb-3731-2224647")),
  }),
  Object.freeze({
    slug: "liebherr-outdoor-kuehlschrank",
    marke: "liebherr",
    bereich: "kueche",
    kategorie: "kuehlen",
    name: "Outdoor-Kühlschrank",
    serie: "Prime",
    kurz: T(
      "Integrierbare Outdoor-Kühlschränke der Serie Prime für die Außenküche, mit Volltür (UORpr 365i) oder möbelfrontfähig mit Glasausschnitt (UORpr 366i).",
      "Integrated outdoor refrigerators from the Prime series for outdoor kitchens, with a solid door (UORpr 365i) or for a furniture front with glass cut-out (UORpr 366i).",
      "Réfrigérateurs d’extérieur intégrables de la série Prime pour cuisine extérieure, à porte pleine (UORpr 365i) ou habillables avec découpe vitrée (UORpr 366i).",
      "Frigoriferi da esterno da incasso della serie Prime per cucine all’aperto, con porta piena (UORpr 365i) o con anta mobile e finestra in vetro (UORpr 366i)."
    ),
    merkmale: Object.freeze([
      "UORpr 365i · UORpr 366i",
      beispiel("UORpr 365i", "Touch & Swipe-Display, SmartDeviceBox integriert, GlassLine-Abstellflächen, FreshAir-Aktivkohlefilter, SoftSystem", "Touch & Swipe display, integrated SmartDeviceBox, GlassLine shelves, FreshAir activated carbon filter, SoftSystem", "écran Touch & Swipe, SmartDeviceBox intégrée, clayettes GlassLine, filtre à charbon actif FreshAir, SoftSystem", "display Touch & Swipe, SmartDeviceBox integrata, ripiani GlassLine, filtro a carbone attivo FreshAir, SoftSystem"),
      volumen("84"),
      M.nische,
      M.varianten,
    ]),
    masse: Object.freeze([mass("nische", "82–88 × 60 × 56,5 cm")]),
    bilder: Object.freeze([
      bild("liebherr-outdoor-kuehlschrank-1.webp", 1200, 1049, altProdukt("UORpr 365i Prime", "outdoor", "offen"), P("uorpr-365i-2224647")),
      raum("liebherr-outdoor-kuehlschrank-2.webp", 1200, 677, T("Liebherr UORpr 365i Prime: geöffneter Outdoor-Kühlschrank in einer Außenküche aus Holz auf einer Dachterrasse", "Liebherr UORpr 365i Prime: open outdoor refrigerator in a wooden outdoor kitchen on a roof terrace", "Liebherr UORpr 365i Prime : réfrigérateur d’extérieur ouvert dans une cuisine extérieure en bois sur un toit-terrasse", "Liebherr UORpr 365i Prime: frigorifero da esterno aperto in una cucina all’aperto in legno su una terrazza"), P("uorpr-365i-2224647")),
    ]),
    ausfuehrungen: ausf("liebherr-outdoor-kuehlschrank"),
    herstellerUrl: OUTDOOR,
    quellen: Object.freeze([OUTDOOR, KAT_KS, P("uorpr-365i-2224647")]),
    stand: STAND,
    preis: uvp(2089, P("uorpr-365i-2224647")),
  }),

  // ------------------------------------------------- Einbau-Gefrierschränke
  Object.freeze({
    slug: "liebherr-einbau-gefrierschrank-pure",
    marke: "liebherr",
    bereich: "kueche",
    kategorie: "gefrieren",
    name: "Einbau-Gefrierschrank Pure",
    serie: "Pure",
    kurz: T(
      "Integrierbare Gefrierschränke der Serie Pure mit SmartFrost oder NoFrost, für Nischen von 72, 88 und 178 cm Höhe.",
      "Integrated freezers from the Pure series with SmartFrost or NoFrost, for niches 72, 88 and 178 cm high.",
      "Congélateurs intégrables de la série Pure avec SmartFrost ou NoFrost, pour niches de 72, 88 et 178 cm de haut.",
      "Congelatori da incasso della serie Pure con SmartFrost o NoFrost, per nicchie alte 72, 88 e 178 cm."
    ),
    merkmale: Object.freeze([
      "IFd 3904 · IFSd 3904 · IFNd 3503 · SIFNe 5108",
      beispiel("IFd 3904", "SmartFrost, Touch-Display, VarioSpace, SuperSilent, SmartDeviceBox nachrüstbar", "SmartFrost, touch display, VarioSpace, SuperSilent, SmartDeviceBox can be retrofitted", "SmartFrost, écran tactile, VarioSpace, SuperSilent, SmartDeviceBox en option", "SmartFrost, display touch, VarioSpace, SuperSilent, SmartDeviceBox installabile in seguito"),
      volumen("65–213"),
      M.nische,
      M.varianten,
    ]),
    masse: Object.freeze([mass("nische", "71,4–73 / 87,4–89 / 177,2–178,8 × 56–57 × 55 cm")]),
    bilder: Object.freeze([
      bild("liebherr-einbau-gefrierschrank-pure-1.webp", 929, 1200, altProdukt("IFd 3904 Pure", "gs", "offen"), P("ifd-3904-2224692")),
    ]),
    ausfuehrungen: ausf("liebherr-einbau-gefrierschrank-pure"),
    zubehoer: z(SBS, "liebherr-einbaukuehlschrank-pure"),
    herstellerUrl: KAT_GS,
    quellen: Object.freeze([KAT_GS, P("ifd-3904-2224692")]),
    stand: STAND,
    preis: uvp(949, P("ifd-3904-2224692")),
  }),
  Object.freeze({
    slug: "liebherr-einbau-gefrierschrank-plus",
    marke: "liebherr",
    bereich: "kueche",
    kategorie: "gefrieren",
    name: "Einbau-Gefrierschrank Plus",
    serie: "Plus",
    kurz: T(
      "Integrierbare Gefrierschränke der Serie Plus mit NoFrost und SoftSystem, für Nischen von 88 und 178 cm Höhe.",
      "Integrated freezers from the Plus series with NoFrost and SoftSystem, for niches 88 and 178 cm high.",
      "Congélateurs intégrables de la série Plus avec NoFrost et SoftSystem, pour niches de 88 et 178 cm de haut.",
      "Congelatori da incasso della serie Plus con NoFrost e SoftSystem, per nicchie alte 88 e 178 cm."
    ),
    merkmale: Object.freeze([
      "IFNd 3924 · SIFNSe 5128",
      beispiel("IFNd 3924", "NoFrost, Touch-Display, SoftSystem, VarioSpace, SuperSilent", "NoFrost, touch display, SoftSystem, VarioSpace, SuperSilent", "NoFrost, écran tactile, SoftSystem, VarioSpace, SuperSilent", "NoFrost, display touch, SoftSystem, VarioSpace, SuperSilent"),
      volumen("87–213"),
      M.nische,
      M.varianten,
    ]),
    masse: Object.freeze([mass("nische", "87,4–89 / 177,2–178,8 × 56–57 × 55 cm")]),
    bilder: Object.freeze([
      bild("liebherr-einbau-gefrierschrank-plus-1.webp", 928, 1200, altProdukt("IFNd 3924 Plus NoFrost", "gs", "offen"), P("ifnd-3924-2224692")),
    ]),
    ausfuehrungen: ausf("liebherr-einbau-gefrierschrank-plus"),
    zubehoer: z(SBS, "liebherr-einbaukuehlschrank-plus"),
    herstellerUrl: KAT_GS,
    quellen: Object.freeze([KAT_GS, P("ifnd-3924-2224692")]),
    stand: STAND,
    preis: uvp(1079, P("ifnd-3924-2224692")),
  }),
  Object.freeze({
    slug: "liebherr-einbau-gefrierschrank-prime",
    marke: "liebherr",
    bereich: "kueche",
    kategorie: "gefrieren",
    name: "Einbau-Gefrierschrank Prime",
    serie: "Prime",
    kurz: T(
      "Integrierbare Gefrierschränke der Serie Prime mit NoFrost und Touch & Swipe-Display, für Nischen von 72 bis 141 cm Höhe.",
      "Integrated freezers from the Prime series with NoFrost and Touch & Swipe display, for niches 72 to 141 cm high.",
      "Congélateurs intégrables de la série Prime avec NoFrost et écran Touch & Swipe, pour niches de 72 à 141 cm de haut.",
      "Congelatori da incasso della serie Prime con NoFrost e display Touch & Swipe, per nicchie alte da 72 a 141 cm."
    ),
    merkmale: Object.freeze([
      "IFNbi 3553 · IFNci 3954 · SIFNdi 4155 · SIFNdi 4556",
      beispiel("IFNbi 3553", "NoFrost, Touch & Swipe-Display, SoftSystem, VarioSpace, SuperSilent, SmartDeviceBox integriert", "NoFrost, Touch & Swipe display, SoftSystem, VarioSpace, SuperSilent, integrated SmartDeviceBox", "NoFrost, écran Touch & Swipe, SoftSystem, VarioSpace, SuperSilent, SmartDeviceBox intégrée", "NoFrost, display Touch & Swipe, SoftSystem, VarioSpace, SuperSilent, SmartDeviceBox integrata"),
      volumen("65–156"),
      M.nische,
      M.varianten,
    ]),
    masse: Object.freeze([mass("nische", "71,4–73 / 87,4–89 / 121,6–123,6 / 139,7–141,3 × 56–57 × 55 cm")]),
    bilder: Object.freeze([
      bild("liebherr-einbau-gefrierschrank-prime-1.webp", 1071, 1200, altProdukt("IFNbi 3553 Prime NoFrost", "gs", "offen"), P("ifnbi-3553-2224692")),
      raum("liebherr-einbau-gefrierschrank-prime-2.webp", 1200, 860, T("Liebherr IFNbi 3553 Prime: geöffneter Gefrierschrank in einer dunkelblauen Küche unter einer Dachschräge", "Liebherr IFNbi 3553 Prime: open freezer in a dark blue kitchen under a sloping roof", "Liebherr IFNbi 3553 Prime : congélateur ouvert dans une cuisine bleu foncé sous les combles", "Liebherr IFNbi 3553 Prime: congelatore aperto in una cucina blu scuro sotto il tetto spiovente"), P("ifnbi-3553-2224692")),
    ]),
    ausfuehrungen: ausf("liebherr-einbau-gefrierschrank-prime"),
    zubehoer: z(SBS, "liebherr-einbaukuehlschrank-prime"),
    herstellerUrl: KAT_GS,
    quellen: Object.freeze([KAT_GS, P("ifnbi-3553-2224692")]),
    stand: STAND,
    preis: uvp(1269, P("ifnbi-3553-2224692")),
  }),
  Object.freeze({
    slug: "liebherr-einbau-gefrierschrank-peak",
    marke: "liebherr",
    bereich: "kueche",
    kategorie: "gefrieren",
    name: "Einbau-Gefrierschrank Peak",
    serie: "Peak",
    kurz: T(
      "Integrierbare Gefrierschränke der Serie Peak mit NoFrost für 178-cm-Nischen, teils mit IceTower und AutoDoor.",
      "Integrated freezers from the Peak series with NoFrost for 178 cm niches, some with IceTower and AutoDoor.",
      "Congélateurs intégrables de la série Peak avec NoFrost pour niches de 178 cm, certains avec IceTower et AutoDoor.",
      "Congelatori da incasso della serie Peak con NoFrost per nicchie da 178 cm, alcuni con IceTower e AutoDoor."
    ),
    merkmale: Object.freeze([
      "SIFNdi 5178 · SIFNdi 5188 · SIFNbsdi 5188 · SIFNAd 5188",
      beispiel("SIFNdi 5178", "NoFrost, Touch & Swipe-Display, SoftSystem, VarioSpace, SuperSilent, SmartDeviceBox integriert", "NoFrost, Touch & Swipe display, SoftSystem, VarioSpace, SuperSilent, integrated SmartDeviceBox", "NoFrost, écran Touch & Swipe, SoftSystem, VarioSpace, SuperSilent, SmartDeviceBox intégrée", "NoFrost, display Touch & Swipe, SoftSystem, VarioSpace, SuperSilent, SmartDeviceBox integrata"),
      T("IceTower (SIFNdi 5188, SIFNbsdi 5188, SIFNAd 5188); AutoDoor beim SIFNAd 5188, Türanschlag rechts oder links", "IceTower (SIFNdi 5188, SIFNbsdi 5188, SIFNAd 5188); AutoDoor on the SIFNAd 5188, right or left door hinge", "IceTower (SIFNdi 5188, SIFNbsdi 5188, SIFNAd 5188) ; AutoDoor sur le SIFNAd 5188, charnières à droite ou à gauche", "IceTower (SIFNdi 5188, SIFNbsdi 5188, SIFNAd 5188); AutoDoor sul SIFNAd 5188, apertura a destra o a sinistra"),
      volumen("213"),
      M.nische,
      M.varianten,
    ]),
    masse: Object.freeze([mass("nische", "177,2–178,8 × 56–57 × 55 cm · 177,7–179,3 × 56–57 × 55 cm")]),
    bilder: Object.freeze([
      bild("liebherr-einbau-gefrierschrank-peak-1.webp", 537, 1200, altProdukt("SIFNdi 5178 Peak NoFrost", "gs", "offen"), P("sifndi-5178-2224692")),
    ]),
    ausfuehrungen: ausf("liebherr-einbau-gefrierschrank-peak", TUERANSCHLAG),
    zubehoer: z(SBS, "liebherr-einbaukuehlschrank-peak"),
    herstellerUrl: KAT_GS,
    quellen: Object.freeze([KAT_GS, P("sifndi-5178-2224692")]),
    stand: STAND,
    preis: uvp(2979, P("sifndi-5178-2224692")),
  }),
  Object.freeze({
    slug: "liebherr-unterbaugefrierschrank-pure",
    marke: "liebherr",
    bereich: "kueche",
    kategorie: "gefrieren",
    name: "Unterbaugefrierschrank Pure",
    serie: "Pure",
    kurz: T(
      "Integrierbare Unterbaugefrierschränke der Serie Pure mit SmartFrost für 60 cm breite Nischen, auch dekorfähig.",
      "Integrated under-counter freezers from the Pure series with SmartFrost for 60 cm wide niches, also with decor panel.",
      "Congélateurs sous plan intégrables de la série Pure avec SmartFrost pour niches de 60 cm, aussi en version à décor.",
      "Congelatori sottopiano da incasso della serie Pure con SmartFrost per nicchie larghe 60 cm, anche con pannello decorativo."
    ),
    merkmale: Object.freeze([
      "SUFd 3603 · SUFc 3703 · SDUFd 3603",
      beispiel("SUFd 3603", "SmartFrost, TouchControl, VarioSpace, höhenverstellbare Füße, spülmaschinengeeignete Ausstattung", "SmartFrost, TouchControl, VarioSpace, height-adjustable feet, dishwasher-safe fittings", "SmartFrost, TouchControl, VarioSpace, pieds réglables, accessoires lavables au lave-vaisselle", "SmartFrost, TouchControl, VarioSpace, piedini regolabili, accessori lavabili in lavastoviglie"),
      volumen("87–94"),
      M.nische,
      M.varianten,
    ]),
    masse: Object.freeze([mass("nische", "82–88 × 60 × 56 cm · 86–92 × 60 × 56 cm")]),
    bilder: Object.freeze([
      bild("liebherr-unterbaugefrierschrank-pure-1.webp", 1200, 913, altProdukt("SUFd 3603 Pure", "ugs", "offen"), P("sufd-3603-2224692")),
      raum("liebherr-unterbaugefrierschrank-pure-2.webp", 1200, 677, T("Liebherr SUFd 3603 Pure: zwei geöffnete Unterbaugeräte in einer dunklen Kücheninsel", "Liebherr SUFd 3603 Pure: two open under-counter appliances in a dark kitchen island", "Liebherr SUFd 3603 Pure : deux appareils sous plan ouverts dans un îlot sombre", "Liebherr SUFd 3603 Pure: due apparecchi sottopiano aperti in un’isola scura"), P("sufd-3603-2224692")),
    ]),
    ausfuehrungen: ausf("liebherr-unterbaugefrierschrank-pure"),
    herstellerUrl: KAT_GS,
    quellen: Object.freeze([KAT_GS, P("sufd-3603-2224692")]),
    stand: STAND,
    preis: uvp(1199, P("sufd-3603-2224692")),
  }),
  Object.freeze({
    slug: "liebherr-unterbaugefrierschrank-prime",
    marke: "liebherr",
    bereich: "kueche",
    kategorie: "gefrieren",
    name: "Unterbaugefrierschrank Prime",
    serie: "Prime",
    kurz: T(
      "Integrierbare Unterbaugefrierschränke der Serie Prime mit NoFrost, mit Tür oder mit zwei Schubladen.",
      "Integrated under-counter freezers from the Prime series with NoFrost, with a door or two drawers.",
      "Congélateurs sous plan intégrables de la série Prime avec NoFrost, à porte ou à deux tiroirs.",
      "Congelatori sottopiano da incasso della serie Prime con NoFrost, con porta o con due cassetti."
    ),
    merkmale: Object.freeze([
      "SUFNd 365i · SUFNc 375i · SUFNPc 365i",
      beispiel("SUFNd 365i", "NoFrost, Touch & Swipe-Display, SmartDeviceBox integriert, LED-Gefrierteilbeleuchtung, VarioSpace", "NoFrost, Touch & Swipe display, integrated SmartDeviceBox, LED freezer lighting, VarioSpace", "NoFrost, écran Touch & Swipe, SmartDeviceBox intégrée, éclairage LED du congélateur, VarioSpace", "NoFrost, display Touch & Swipe, SmartDeviceBox integrata, illuminazione LED del congelatore, VarioSpace"),
      volumen("74–80"),
      M.nische,
      M.varianten,
    ]),
    masse: Object.freeze([mass("nische", "82–88 × 60 × 56 cm · 86–92 × 60 × 56 cm")]),
    bilder: Object.freeze([
      bild("liebherr-unterbaugefrierschrank-prime-1.webp", 1200, 913, altProdukt("SUFNd 365i Prime NoFrost", "ugs", "offen"), P("sufnd-365i-2224692")),
      raum("liebherr-unterbaugefrierschrank-prime-2.webp", 1200, 849, T("Liebherr SUFNd 365i Prime: Kücheninsel mit Unterbaugeräten und Weinkühlschrank vor großen Fenstern", "Liebherr SUFNd 365i Prime: kitchen island with under-counter appliances and a wine cabinet in front of large windows", "Liebherr SUFNd 365i Prime : îlot avec appareils sous plan et cave à vin devant de grandes baies", "Liebherr SUFNd 365i Prime: isola con apparecchi sottopiano e cantina vini davanti a grandi finestre"), P("sufnd-365i-2224692")),
      raum("liebherr-unterbaugefrierschrank-prime-3.webp", 1200, 677, T("Liebherr SUFNd 365i Prime: Kücheninsel mit Weinkühlschrank und geöffneten Unterbaugeräten", "Liebherr SUFNd 365i Prime: kitchen island with wine cabinet and open under-counter appliances", "Liebherr SUFNd 365i Prime : îlot avec cave à vin et appareils sous plan ouverts", "Liebherr SUFNd 365i Prime: isola con cantina vini e apparecchi sottopiano aperti"), P("sufnd-365i-2224692")),
    ]),
    ausfuehrungen: ausf("liebherr-unterbaugefrierschrank-prime"),
    herstellerUrl: KAT_GS,
    quellen: Object.freeze([KAT_GS, P("sufnd-365i-2224692")]),
    stand: STAND,
    preis: uvp(1459, P("sufnd-365i-2224692")),
  }),
  Object.freeze({
    slug: "liebherr-unterbaugefrierschrank-comfort",
    marke: "liebherr",
    bereich: "kueche",
    kategorie: "gefrieren",
    name: "Unterbau-Gefrierschrank Comfort",
    serie: "Comfort",
    kurz: T(
      "Integrierbarer Unterbau-Gefrierschrank der Serie Comfort mit SmartFrost und FrostSafe-Schubladen für 60 cm breite Nischen.",
      "Integrated under-counter freezer from the Comfort series with SmartFrost and FrostSafe drawers for 60 cm wide niches.",
      "Congélateur sous plan intégrable de la série Comfort avec SmartFrost et tiroirs FrostSafe pour niches de 60 cm.",
      "Congelatore sottopiano da incasso della serie Comfort con SmartFrost e cassetti FrostSafe per nicchie larghe 60 cm."
    ),
    merkmale: Object.freeze([
      "SUIG 1514",
      T("SmartFrost, SuperFrost-Automatik, Türalarm, FrostSafe, VarioSpace, wechselbarer Türanschlag", "SmartFrost, automatic SuperFrost, door alarm, FrostSafe, VarioSpace, reversible door hinge", "SmartFrost, SuperFrost automatique, alarme de porte, FrostSafe, VarioSpace, charnières réversibles", "SmartFrost, SuperFrost automatico, allarme porta, FrostSafe, VarioSpace, apertura reversibile"),
      volumen("95"),
      M.nische,
    ]),
    masse: Object.freeze([mass("nische", "82–88 × 60 × 55 cm")]),
    bilder: Object.freeze([
      bild("liebherr-unterbaugefrierschrank-comfort-1.webp", 1200, 1153, altProdukt("SUIG 1514 Comfort", "ugs", "offen"), P("suig-1514-2224692")),
      raum("liebherr-unterbaugefrierschrank-comfort-2.webp", 928, 1200, T("Liebherr SUIG 1514 Comfort: geöffneter Unterbau-Gefrierschrank in einer weißen Küche", "Liebherr SUIG 1514 Comfort: open under-counter freezer in a white kitchen", "Liebherr SUIG 1514 Comfort : congélateur sous plan ouvert dans une cuisine blanche", "Liebherr SUIG 1514 Comfort: congelatore sottopiano aperto in una cucina bianca"), P("suig-1514-2224692")),
      raum("liebherr-unterbaugefrierschrank-comfort-3.webp", 1200, 864, T("Liebherr SUIG 1514 Comfort: geöffneter Unterbau-Gefrierschrank mit Gefriergut in einer weißen Küche", "Liebherr SUIG 1514 Comfort: open under-counter freezer with frozen food in a white kitchen", "Liebherr SUIG 1514 Comfort : congélateur sous plan ouvert, garni, dans une cuisine blanche", "Liebherr SUIG 1514 Comfort: congelatore sottopiano aperto con surgelati in una cucina bianca"), P("suig-1514-2224692")),
      raum("liebherr-unterbaugefrierschrank-comfort-4.webp", 1200, 864, T("Liebherr SUIG 1514 Comfort: Unterbau-Gefrierschrank und Unterbau-Kühlschrank nebeneinander, beide geöffnet, in einer weißen Küche", "Liebherr SUIG 1514 Comfort: under-counter freezer and under-counter refrigerator side by side, both open, in a white kitchen", "Liebherr SUIG 1514 Comfort : congélateur et réfrigérateur sous plan côte à côte, ouverts, dans une cuisine blanche", "Liebherr SUIG 1514 Comfort: congelatore e frigorifero sottopiano affiancati, entrambi aperti, in una cucina bianca"), P("suig-1514-2224692")),
    ]),
    ausfuehrungen: ausf("liebherr-unterbaugefrierschrank-comfort"),
    herstellerUrl: P("suig-1514-2224692"),
    quellen: Object.freeze([KAT_GS, P("suig-1514-2224692")]),
    stand: STAND,
    preis: uvp(1179, P("suig-1514-2224692")),
  }),
  Object.freeze({
    slug: "liebherr-monolith-gefrierschrank",
    marke: "liebherr",
    bereich: "kueche",
    kategorie: "gefrieren",
    name: "Monolith Gefrierschrank",
    serie: "Monolith",
    kurz: T(
      "Integrierbare Monolith-Gefrierschränke mit NoFrost in vier Breiten von 45,7 bis 91,4 cm für 213,4 cm hohe Nischen, mit FrostSafe-Gefrierschubfächern.",
      "Integrated Monolith freezers with NoFrost in four widths from 45.7 to 91.4 cm for 213.4 cm high niches, with FrostSafe freezer drawers.",
      "Congélateurs intégrables Monolith avec NoFrost, en quatre largeurs de 45,7 à 91,4 cm, pour niches de 213,4 cm de haut, avec tiroirs FrostSafe.",
      "Congelatori da incasso Monolith con NoFrost in quattro larghezze da 45,7 a 91,4 cm per nicchie alte 213,4 cm, con cassetti FrostSafe."
    ),
    merkmale: Object.freeze([
      "EFNei 9470 · EFNei 9471 · EFNei 9670 · EFNei 9671 · EFNei 9770 · EFNei 9771 · EFNei 9970 · EFNei 9971",
      M.monolith,
      beispiel("EFNei 9670", "NoFrost, SuperFrost, SmartDevice, InfinitySwipe, InfinityLight", "NoFrost, SuperFrost, SmartDevice, InfinitySwipe, InfinityLight", "NoFrost, SuperFrost, SmartDevice, InfinitySwipe, InfinityLight", "NoFrost, SuperFrost, SmartDevice, InfinitySwipe, InfinityLight"),
      volumen("245–564"),
      M.kein_preis,
      M.nische,
      M.varianten,
    ]),
    masse: Object.freeze([mass("nische", "213,4 × 45,7 / 61 / 76,2 / 91,4 × 63,5 cm")]),
    bilder: Object.freeze([
      bild("liebherr-monolith-gefrierschrank-1.webp", 565, 1200, altProdukt("EFNei 9670 NoFrost", "gs", "schraeg"), P("efnei-9670-2224692")),
    ]),
    ausfuehrungen: ausf("liebherr-monolith-gefrierschrank"),
    zubehoer: z(MONO_KOMBI, "liebherr-monolith-kuehlschrank", "liebherr-monolith-weintemperierschrank"),
    herstellerUrl: MONOLITH,
    quellen: Object.freeze([MONOLITH, KAT_GS, P("efnei-9670-2224692")]),
    stand: STAND,
  }),

  // ------------------------------------------------- Weinklima
  Object.freeze({
    slug: "liebherr-vinidor-einbau-weintemperierschrank",
    marke: "liebherr",
    bereich: "kueche",
    kategorie: "weinklima",
    name: "Vinidor Einbau-Weintemperierschrank",
    serie: "Vinidor",
    kurz: T(
      "Einbaubare Weintemperierschränke der Serie Vinidor mit zwei getrennt regelbaren Zonen, für 30 bis 83 Bordeauxflaschen; mit Festtür (EWTdf) oder flächenbündiger Glastür (EWTgb).",
      "Built-in wine cabinets from the Vinidor series with two separately controlled zones for 30 to 83 Bordeaux bottles; with a fixed door (EWTdf) or flush glass door (EWTgb).",
      "Caves à vin encastrables de la série Vinidor à deux zones réglables séparément, pour 30 à 83 bouteilles bordelaises ; porte fixe (EWTdf) ou porte vitrée affleurante (EWTgb).",
      "Cantine vini da incasso della serie Vinidor con due zone regolabili separatamente, per 30–83 bottiglie bordolesi; con porta fissa (EWTdf) o porta in vetro a filo (EWTgb)."
    ),
    merkmale: Object.freeze([
      "EWTdf 1653 · EWTdf 2353 · EWTdf 3553 · EWTgb 1683 · EWTgb 2383 · EWTgb 3583",
      beispiel("EWTdf 1653", "2 Zonen, TempProtect Plus, HumiditySelect, VibrateSafe, Türalarm, SuperSilent", "2 zones, TempProtect Plus, HumiditySelect, VibrateSafe, door alarm, SuperSilent", "2 zones, TempProtect Plus, HumiditySelect, VibrateSafe, alarme de porte, SuperSilent", "2 zone, TempProtect Plus, HumiditySelect, VibrateSafe, allarme porta, SuperSilent"),
      flaschen("30–83"),
      T("Nutzinhalt 97–271 l", "Usable capacity 97–271 l", "Volume utile 97–271 l", "Capacità utile 97–271 l"),
      M.varianten,
    ]),
    bilder: Object.freeze([
      bild("liebherr-vinidor-einbau-weintemperierschrank-1.webp", 1121, 1200, altProdukt("EWTdf 1653 Vinidor", "wein", "wein"), P("ewtdf-1653-2224724")),
      raum("liebherr-vinidor-einbau-weintemperierschrank-2.webp", 977, 1200, T("Liebherr Vinidor: Edelstahl-Gerätekombination mit Weintemperierschrank in einer Küche", "Liebherr Vinidor: stainless steel appliance combination with wine cabinet in a kitchen", "Liebherr Vinidor : combinaison d’appareils inox avec cave à vin dans une cuisine", "Liebherr Vinidor: combinazione di apparecchi in acciaio inox con cantina vini in una cucina"), P("ewtdf-1653-2224724")),
      raum("liebherr-vinidor-einbau-weintemperierschrank-3.webp", 1200, 655, T("Liebherr Vinidor: Schrankwand aus Holz mit mehreren geöffneten Einbaugeräten, darunter zwei Weintemperierschränke", "Liebherr Vinidor: wooden wall of units with several open built-in appliances, including two wine cabinets", "Liebherr Vinidor : mur d’armoires en bois avec plusieurs appareils encastrés ouverts, dont deux caves à vin", "Liebherr Vinidor: parete in legno con diversi apparecchi da incasso aperti, tra cui due cantine vini"), P("ewtdf-1653-2224724")),
      raum("liebherr-vinidor-einbau-weintemperierschrank-4.webp", 1200, 913, T("Liebherr Vinidor: Weintemperierschrank mit Glastür in einer dunklen Hochschrankwand neben weiteren Gerätetüren", "Liebherr Vinidor: wine cabinet with glass door in a dark tall-unit wall next to further appliance doors", "Liebherr Vinidor : cave à vin à porte vitrée dans un mur de colonnes sombre, à côté d’autres portes d’appareils", "Liebherr Vinidor: cantina vini con porta in vetro in una parete di colonne scura accanto ad altre ante"), P("ewtdf-1653-2224724")),
      raum("liebherr-vinidor-einbau-weintemperierschrank-5.webp", 1200, 853, T("Liebherr Vinidor: geöffnete Kombination aus Kühlgeräten und Weintemperierschrank in einer Küche mit Blick in den Wohnbereich", "Liebherr Vinidor: open combination of refrigeration appliances and wine cabinet in a kitchen looking onto the living area", "Liebherr Vinidor : combinaison ouverte d’appareils de froid et d’une cave à vin, cuisine ouverte sur le séjour", "Liebherr Vinidor: combinazione aperta di apparecchi per il freddo e cantina vini in una cucina aperta sul soggiorno"), P("ewtdf-1653-2224724")),
      raum("liebherr-vinidor-einbau-weintemperierschrank-6.webp", 977, 1200, T("Liebherr Vinidor: geschlossene Gerätekombination mit Edelstahlfronten und Weintemperierschrank in einer hellen Küche", "Liebherr Vinidor: closed appliance combination with stainless steel fronts and wine cabinet in a light kitchen", "Liebherr Vinidor : combinaison fermée à façades inox avec cave à vin dans une cuisine claire", "Liebherr Vinidor: combinazione chiusa con frontali in acciaio inox e cantina vini in una cucina chiara"), P("ewtdf-1653-2224724")),
      raum("liebherr-vinidor-einbau-weintemperierschrank-7.webp", 1200, 853, T("Liebherr Vinidor: Gerätekombination mit Edelstahlfronten und Weintemperierschrank am Abend, daneben der Wohnbereich", "Liebherr Vinidor: appliance combination with stainless steel fronts and wine cabinet in the evening, living area alongside", "Liebherr Vinidor : combinaison à façades inox avec cave à vin le soir, séjour à côté", "Liebherr Vinidor: combinazione con frontali in acciaio inox e cantina vini di sera, accanto la zona giorno"), P("ewtdf-1653-2224724")),
    ]),
    ausfuehrungen: ausf("liebherr-vinidor-einbau-weintemperierschrank"),
    herstellerUrl: WEIN2,
    quellen: Object.freeze([WEIN2, P("ewtdf-1653-2224724")]),
    stand: STAND,
    preis: uvp(2799, P("ewtdf-1653-2224724")),
  }),
  Object.freeze({
    slug: "liebherr-vinidor-unterbau-weinkuehlschrank",
    marke: "liebherr",
    bereich: "kueche",
    kategorie: "weinklima",
    name: "Vinidor Unterbau-Weinkühlschrank",
    serie: "Vinidor",
    kurz: T(
      "Unterbau-Weinkühlschränke der Serie Vinidor mit Glastür und Griffmulde, mit einer Zone (UWgb 3631, 44 Flaschen) oder zwei Zonen (UWgb 3632, 32 Flaschen).",
      "Under-counter wine cabinets from the Vinidor series with glass door and recessed grip, with one zone (UWgb 3631, 44 bottles) or two zones (UWgb 3632, 32 bottles).",
      "Caves à vin sous plan de la série Vinidor avec porte vitrée et poignée encastrée, à une zone (UWgb 3631, 44 bouteilles) ou deux zones (UWgb 3632, 32 bouteilles).",
      "Cantine vini sottopiano della serie Vinidor con porta in vetro e maniglia incassata, a una zona (UWgb 3631, 44 bottiglie) o due zone (UWgb 3632, 32 bottiglie)."
    ),
    merkmale: Object.freeze([
      "UWgb 3631 · UWgb 3632",
      beispiel("UWgb 3631", "TempProtect Plus, HumiditySelect, UVProtect, VibrateSafe, Touch-Display", "TempProtect Plus, HumiditySelect, UVProtect, VibrateSafe, touch display", "TempProtect Plus, HumiditySelect, UVProtect, VibrateSafe, écran tactile", "TempProtect Plus, HumiditySelect, UVProtect, VibrateSafe, display touch"),
      T("Nutzinhalt 98–111 l", "Usable capacity 98–111 l", "Volume utile 98–111 l", "Capacità utile 98–111 l"),
      M.varianten,
    ]),
    bilder: Object.freeze([
      bild("liebherr-vinidor-unterbau-weinkuehlschrank-1.webp", 1200, 1120, altProdukt("UWgb 3631 Vinidor", "uw", "wein"), P("uwgb-3631-2224716")),
    ]),
    ausfuehrungen: ausf("liebherr-vinidor-unterbau-weinkuehlschrank"),
    herstellerUrl: WEIN1,
    quellen: Object.freeze([WEIN1, WEIN2, P("uwgb-3631-2224716")]),
    stand: STAND,
    preis: uvp(1899, P("uwgb-3631-2224716")),
  }),
  Object.freeze({
    slug: "liebherr-vinidor-selection-unterbau-weinkuehlschrank",
    marke: "liebherr",
    bereich: "kueche",
    kategorie: "weinklima",
    name: "Vinidor Selection Unterbau-Weinkühlschrank",
    serie: "Vinidor Selection",
    kurz: T(
      "Unterbau-Weinkühlschränke der Serie Vinidor Selection mit einer oder zwei Zonen für 32 bis 44 Flaschen: möbelfrontfähig mit Glasausschnitt, mit Volltür oder mit Glastür.",
      "Under-counter wine cabinets from the Vinidor Selection series with one or two zones for 32 to 44 bottles: for a furniture front with glass cut-out, with a solid door or with a glass door.",
      "Caves à vin sous plan de la série Vinidor Selection à une ou deux zones pour 32 à 44 bouteilles : habillables avec découpe vitrée, à porte pleine ou à porte vitrée.",
      "Cantine vini sottopiano della serie Vinidor Selection a una o due zone per 32–44 bottiglie: con anta mobile e finestra in vetro, con porta piena o con porta in vetro."
    ),
    merkmale: Object.freeze([
      "UWpri 3661 · UWpri 3761 · UWpri 3662 · UWpri 3762 · UWpri 3782 · UWpri 3672 · UWgbi 3682 · UWgbi 3782",
      beispiel("UWpri 3661", "TempProtect Plus, HumiditySelect, UVProtect, VibrateSafe, Touch & Swipe-Display", "TempProtect Plus, HumiditySelect, UVProtect, VibrateSafe, Touch & Swipe display", "TempProtect Plus, HumiditySelect, UVProtect, VibrateSafe, écran Touch & Swipe", "TempProtect Plus, HumiditySelect, UVProtect, VibrateSafe, display Touch & Swipe"),
      T("Nutzinhalt 93–114 l", "Usable capacity 93–114 l", "Volume utile 93–114 l", "Capacità utile 93–114 l"),
      M.varianten,
    ]),
    bilder: Object.freeze([
      bild("liebherr-vinidor-selection-unterbau-weinkuehlschrank-1.webp", 1200, 900, altProdukt("UWpri 3661 Vinidor Selection", "uw", "wein"), P("uwpri-3661-2224716")),
    ]),
    ausfuehrungen: ausf("liebherr-vinidor-selection-unterbau-weinkuehlschrank"),
    herstellerUrl: WEIN2,
    quellen: Object.freeze([WEIN1, WEIN2, P("uwpri-3661-2224716")]),
    stand: STAND,
    preis: uvp(2409, P("uwpri-3661-2224716")),
  }),
  Object.freeze({
    slug: "liebherr-grandcru-einbau-weinklimaschrank",
    marke: "liebherr",
    bereich: "kueche",
    kategorie: "weinklima",
    name: "GrandCru Einbau-Weinklimaschrank",
    serie: "GrandCru",
    kurz: T(
      "Einbaubare Weinklimaschränke der Serie GrandCru für 18 Bordeauxflaschen, mit einer Zone und flächenbündiger Türmontage.",
      "Built-in wine climate cabinets from the GrandCru series for 18 Bordeaux bottles, with one zone and flush door mounting.",
      "Caves de vieillissement encastrables de la série GrandCru pour 18 bouteilles bordelaises, à une zone et porte affleurante.",
      "Cantine climatizzate da incasso della serie GrandCru per 18 bottiglie bordolesi, a una zona e con porta a filo."
    ),
    merkmale: Object.freeze([
      "WKEes 553 · WKEgb 582",
      T("Vibrationsarme Lagerung, Luftfeuchtigkeit für Weinlagerung ausgelegt", "Low-vibration storage, humidity designed for wine storage", "Stockage à faibles vibrations, humidité adaptée à la conservation du vin", "Conservazione a basse vibrazioni, umidità studiata per la conservazione del vino"),
      flaschen("18"),
      T("Nutzinhalt 46 l", "Usable capacity 46 l", "Volume utile 46 l", "Capacità utile 46 l"),
      M.varianten,
    ]),
    bilder: Object.freeze([
      bild("liebherr-grandcru-einbau-weinklimaschrank-1.webp", 1200, 1059, altProdukt("WKEes 553 GrandCru", "wke", "wein"), P("wkees-553-2224716")),
      raum("liebherr-grandcru-einbau-weinklimaschrank-2.webp", 840, 1200, T("Liebherr WKEes 553 GrandCru: Weinklimaschrank in einer weißen Hochschrankwand, davor Rotweinglas und Käse", "Liebherr WKEes 553 GrandCru: wine climate cabinet in a white tall-unit wall, with a glass of red wine and cheese in front", "Liebherr WKEes 553 GrandCru : cave encastrée dans un mur de colonnes blanches, devant un verre de vin rouge et du fromage", "Liebherr WKEes 553 GrandCru: cantina climatizzata in una parete di colonne bianche, davanti un calice di vino rosso e formaggio"), P("wkees-553-2224716")),
      raum("liebherr-grandcru-einbau-weinklimaschrank-3.webp", 1200, 840, T("Liebherr GrandCru: zwei Weinklimaschränke mit Weinflaschen in einer Küchenzeile mit rotbraunen Holzfronten", "Liebherr GrandCru: two wine climate cabinets with wine bottles in a kitchen run with reddish-brown wooden fronts", "Liebherr GrandCru : deux caves garnies de bouteilles dans une cuisine aux façades en bois brun-rouge", "Liebherr GrandCru: due cantine climatizzate con bottiglie in una cucina con ante in legno bruno-rossiccio"), P("wkees-553-2224716")),
      raum("liebherr-grandcru-einbau-weinklimaschrank-4.webp", 1200, 898, T("Liebherr GrandCru: zwei eingebaute Weinklimaschränke an einer weißen Ziegelwand über einem Esstisch", "Liebherr GrandCru: two built-in wine climate cabinets in a white brick wall above a dining table", "Liebherr GrandCru : deux caves encastrées dans un mur de briques blanches au-dessus d’une table", "Liebherr GrandCru: due cantine climatizzate incassate in una parete di mattoni bianchi sopra un tavolo da pranzo"), P("wkees-553-2224716")),
    ]),
    ausfuehrungen: ausf("liebherr-grandcru-einbau-weinklimaschrank"),
    herstellerUrl: WEIN1,
    quellen: Object.freeze([WEIN1, P("wkees-553-2224716")]),
    stand: STAND,
    preis: uvp(2099, P("wkees-553-2224716")),
  }),
  Object.freeze({
    slug: "liebherr-monolith-weintemperierschrank",
    marke: "liebherr",
    bereich: "kueche",
    kategorie: "weinklima",
    name: "Monolith Weintemperierschrank",
    serie: "Monolith",
    kurz: T(
      "Einbaubare Monolith-Weintemperierschränke in 45,72 und 60,96 cm Breite für 75 bzw. 100 Bordeauxflaschen, kombinierbar mit Monolith-Kühl- und -Gefrierschränken.",
      "Built-in Monolith wine cabinets 45.72 and 60.96 cm wide for 75 or 100 Bordeaux bottles, can be combined with Monolith refrigerators and freezers.",
      "Caves à vin encastrables Monolith de 45,72 et 60,96 cm de large pour 75 ou 100 bouteilles bordelaises, combinables avec réfrigérateurs et congélateurs Monolith.",
      "Cantine vini da incasso Monolith larghe 45,72 e 60,96 cm per 75 o 100 bottiglie bordolesi, abbinabili a frigoriferi e congelatori Monolith."
    ),
    merkmale: Object.freeze([
      "EWPi 9470 · EWPi 9471 · EWPi 9670 · EWPi 9671",
      M.monolith,
      beispiel("EWPi 9670", "SmartDevice, InfinitySwipe, InfinityLight, SoftSystem, PowerCooling", "SmartDevice, InfinitySwipe, InfinityLight, SoftSystem, PowerCooling", "SmartDevice, InfinitySwipe, InfinityLight, SoftSystem, PowerCooling", "SmartDevice, InfinitySwipe, InfinityLight, SoftSystem, PowerCooling"),
      T(
        "EWPi 9470/9471 bis 75, EWPi 9670/9671 bis 100 Bordeauxflaschen (0,75 l)",
        "EWPi 9470/9471 up to 75, EWPi 9670/9671 up to 100 Bordeaux bottles (0.75 l)",
        "EWPi 9470/9471 jusqu’à 75, EWPi 9670/9671 jusqu’à 100 bouteilles bordelaises (0,75 l)",
        "EWPi 9470/9471 fino a 75, EWPi 9670/9671 fino a 100 bottiglie bordolesi (0,75 l)"
      ),
      M.kein_preis,
      M.varianten,
    ]),
    bilder: Object.freeze([
      bild("liebherr-monolith-weintemperierschrank-1.webp", 541, 1200, altProdukt("EWPi 9670", "wein", "leer"), P("ewpi-9670-8992796")),
    ]),
    ausfuehrungen: ausf("liebherr-monolith-weintemperierschrank"),
    zubehoer: z(MONO_KOMBI, "liebherr-monolith-kuehlschrank", "liebherr-monolith-gefrierschrank"),
    herstellerUrl: MONOLITH,
    quellen: Object.freeze([MONOLITH, WEIN1, WEIN3, P("ewpi-9670-8992796")]),
    stand: STAND,
  }),
]);
