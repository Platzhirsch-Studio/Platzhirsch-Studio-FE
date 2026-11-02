// src/lib/katalog/marken/bora.js – BORA (BORA Vertriebs GmbH & Co KG, Niederndorf, Tirol)
// Daten-Team BORA, Stand 31.10.2026 (Inhaber-Entscheidungen Nr. 24 und 26; Konfigurator-Felder 31.10.2026).
//
// Quellen: ausschließlich https://www.bora.com/de-at/ (Produktmenü: Kochfeldabzugssysteme, Dampf- und
// Backsysteme, Reinigungs- und Spülsysteme, Kühl- und Gefriersysteme) und für den Oven Steam der
// offizielle BORA-Shop Österreich https://shop.bora.com/de-AT/. Technische Werte aus den
// „Technischen Daten“ der jeweiligen Produktseite. Zugriff: bora.com zeigt bei curl und Headless-Chromium
// eine Cloudflare-Seite (403); die Seiten wurden als normaler Besuch in einem sichtbaren Standard-Chromium
// (Playwright, kein eigener User-Agent, kein Captcha) nacheinander mit Pausen geöffnet. Bilddateien
// liefert das Bild-CDN von bora.com bzw. des Shops (cf.hydropop.io) bei normalem Abruf direkt.
//
// Umfang (Nr. 24): alle Gerätekategorien mit allen Serien/Hauptmodellen. Ein Eintrag je Modell; Varianten
// mit eigener Herstellerseite (All Black, Rough = matte Glaskeramik, Abluft/Umluft) als `ausfuehrungen`
// mit Herstellercode. Beleuchtung (Horizon, Stars), Zubehör (QVac, Stick, Grillpfanne, Piccolo) und die
// App sind nicht erfasst (keine passende Kategorie im Bereich kueche) – siehe
// qa-screenshots/wellness/produkte/vollstaendigkeit-bora.md.
//
// Preise (Nr. 26): bora.com nennt keine Preise. Einzig der Oven Steam wird im offiziellen BORA-Shop
// Österreich verkauft (€ 3.295,00 „Preis inkl. MwSt. und Versand“, ein Modell) → uvp-ab mit Shop-URL.
//
// Bilder: unverändert (kein Beschnitt). Produktbilder = Thumbnail „4x3-frame-lg“ bzw. „image-media-half“
// (Produkt vollständig, auf Fläche eingepasst), Ambiente = „default-thumbnail“ (nur skaliert), Oven Steam
// = Originaldateien des Shops. Technisch: transparente PNG auf Weiß gesetzt; alle Dateien
// einheitlich ≤ 1600 px lange Kante, WebP q82 (tools/images/optimize-katalog.mjs). Quellen je Bild: docs/bildquellen/QUELLEN.md („Katalog BORA“).
//
// Nicht übernommen: Werbeaussagen („perfekt“, „Beste Marke“, „einzigartig“), Cleanrate-Angaben, Bewertungen;
// der Paketname „Best“ der Kühlgeräte (Wortregel Superlative) – dort „erweitertes Ausstattungspaket“.

const STAND = "2026-10-31";
const T = (de, en, fr, it) => Object.freeze({ de, en, fr, it });
const bild = (file, width, height, alt, quelleUrl, typ) =>
  Object.freeze({ src: `/Images/Wellness/produkte/bora/${file}`, width, height, alt, quelleUrl, abgerufen: STAND, ...(typ ? { typ } : {}) });
const mass = (key, wert) => Object.freeze({ key, wert });
const opt = (id, name, code, bildSrc, standard) =>
  Object.freeze({ id, name, ...(code ? { code } : {}), ...(bildSrc ? { bilder: Object.freeze([bildSrc]) } : {}), ...(standard ? { standard: true } : {}) });

/** @type {import("../schema.js").KatalogMarke} */
export const MARKE = Object.freeze({
  slug: "bora",
  name: "BORA",
  welt: "kuechengeraete",
  herstellerUrl: "https://www.bora.com/de-at/",
  // Händlersatz nur über den Claim-Guard (dealerStatement); hier nur der Schalter.
  dealer: true,
  stand: STAND,
  looks: Object.freeze([
    Object.freeze({
      id: "classic-steinarbeitsplatte",
      titel: T(
        "Classic 2.0 in heller Steinarbeitsplatte",
        "Classic 2.0 in a light stone worktop",
        "Classic 2.0 dans un plan de travail en pierre claire",
        "Classic 2.0 in un piano in pietra chiara"
      ),
      bild: bild("bora-ambiente-classic.webp", 960, 632, T(
        "BORA Classic 2.0 mit Flächeninduktions-Kochfeld und Tepan-Edelstahlgrill in einer Steinarbeitsplatte",
        "BORA Classic 2.0 with full-surface induction hob and Tepan stainless steel grill in a stone worktop",
        "BORA Classic 2.0 avec table à induction pleine surface et gril Tepan en inox dans un plan en pierre",
        "BORA Classic 2.0 con piano a induzione a superficie totale e griglia Tepan in acciaio inox in un piano in pietra"
      ), "https://www.bora.com/de-at/kochfeldabzugssysteme", "ambiente"),
      produkte: Object.freeze(["bora-cka2","bora-ckfi","bora-ckt","bora-cka2fit"]),
    }),
    Object.freeze({
      id: "m-pure-kuecheninsel",
      titel: T(
        "M Pure in dunkler Kücheninsel",
        "M Pure in a dark kitchen island",
        "M Pure dans un îlot sombre",
        "M Pure in un’isola scura"
      ),
      bild: bild("bora-ambiente-mpure.webp", 960, 540, T(
        "BORA M Pure Rough in einer dunklen Kücheninsel mit Holzarbeitsplatte",
        "BORA M Pure Rough in a dark kitchen island with wooden worktop",
        "BORA M Pure Rough dans un îlot de cuisine sombre avec plan de travail en bois",
        "BORA M Pure Rough in un’isola scura con piano in legno"
      ), "https://www.bora.com/de-at/kochfeldabzugssysteme", "ambiente"),
      produkte: Object.freeze(["bora-m-pure"]),
    }),
    Object.freeze({
      id: "s-pure-kuechenzeile",
      titel: T(
        "S Pure in einer Küchenzeile mit grünen Fronten",
        "S Pure in a kitchen run with green fronts",
        "S Pure dans une cuisine aux façades vertes",
        "S Pure in una cucina con ante verdi"
      ),
      bild: bild("bora-ambiente-spure.webp", 960, 539, T(
        "BORA S Pure Rough eingebaut in eine Küchenzeile mit grünen Fronten, Grillpfanne und Espressokanne",
        "BORA S Pure Rough installed in a kitchen run with green fronts, grill pan and espresso pot",
        "BORA S Pure Rough encastré dans une cuisine aux façades vertes, poêle gril et cafetière",
        "BORA S Pure Rough incassato in una cucina con ante verdi, bistecchiera e caffettiera"
      ), "https://www.bora.com/de-at/kochfeldabzugssysteme", "ambiente"),
      produkte: Object.freeze(["bora-s-pure"]),
    }),
  ]),
});

/** @type {import("../schema.js").KatalogProdukt[]} */
export const PRODUKTE = Object.freeze([
  // ---------------------------------------------------------------- kochfeld-mit-abzug
  Object.freeze({
    slug: "bora-pkas3fi",
    marke: "bora",
    bereich: "kueche",
    kategorie: "kochfeld-mit-abzug",
    name: "Pro Set Flächeninduktion",
    serie: "Professional 3.0",
    kurz: T(
      "Set aus dem BORA Modularsystem Professional 3.0: Kochfeldabzug mit Kochfeldern (Flächeninduktion), zusammen 4 Kochzonen und 852 mm breit, für Abluft oder Umluft.",
      "Set from the BORA Professional 3.0 modular system: cooktop extractor with hobs (full-surface induction), 4 cooking zones in total and 852 mm wide, for ducted extraction or recirculation.",
      "Ensemble du système modulaire BORA Professional 3.0 : aspiration de table avec tables de cuisson (induction pleine surface), 4 zones de cuisson au total, 852 mm de large, en évacuation extérieure ou en recyclage.",
      "Set del sistema modulare BORA Professional 3.0: aspiratore piano con piani cottura (induzione a superficie totale), 4 zone di cottura in totale, largo 852 mm, in versione aspirante o filtrante."
    ),
    merkmale: Object.freeze([
      T(
        "Kochfeldart: Flächeninduktion, 4 Kochzonen",
        "Hob type: full-surface induction, 4 cooking zones",
        "Type de table : induction pleine surface, 4 zones de cuisson",
        "Tipo di piano: induzione a superficie totale, 4 zone di cottura"
      ),
      T(
        "Kochzonen: 230 × 230 mm / 230 × 230 mm / 230 × 230 mm / 230 × 230 mm",
        "Cooking zones: 230 × 230 mm / 230 × 230 mm / 230 × 230 mm / 230 × 230 mm",
        "Zones de cuisson : 230 × 230 mm / 230 × 230 mm / 230 × 230 mm / 230 × 230 mm",
        "Zone di cottura: 230 × 230 mm / 230 × 230 mm / 230 × 230 mm / 230 × 230 mm"
      ),
      T(
        "9 Leistungsstufen des Kochfeldabzugs",
        "9 extractor power levels",
        "9 niveaux de puissance de l’aspiration",
        "9 livelli di potenza dell’aspirazione"
      ),
      T(
        "Kanalanschluss Ecotube",
        "Duct connection Ecotube",
        "Raccordement de gaine Ecotube",
        "Raccordo canale Ecotube"
      ),
      T(
        "Funktionen: Nachlaufautomatik, Filterstandsanzeige (bei Umluft), automatische Abzugssteuerung, Kurzzeitwecker, Reinigungsfunktion, Powerstufe, Topferkennung, Kochzonen-Timer, Ankochautomatik, Brückenfunktion, Pausefunktion, Super Simple Mode, variable Warmhaltefunktion",
        "Functions: automatic run-on, filter status display (recirculation), automatic extractor control, kitchen timer, cleaning function, power level, pan detection, cooking zone timer, automatic boost start, bridge function, pause function, Super Simple Mode, variable keep-warm function",
        "Fonctions : temporisation automatique, indicateur d’état du filtre (recyclage), commande automatique de l’aspiration, minuteur, fonction nettoyage, niveau Power, détection des récipients, minuterie par zone, démarrage automatique de cuisson, fonction pont, fonction pause, Super Simple Mode, maintien au chaud variable",
        "Funzioni: funzionamento residuo automatico, indicatore stato filtro (versione filtrante), controllo automatico dell’aspirazione, contaminuti, funzione di pulizia, livello Power, riconoscimento pentole, timer per zona di cottura, avvio automatico di cottura, funzione ponte, funzione pausa, Super Simple Mode, funzione di mantenimento in caldo variabile"
      ),
      T(
        "Anordnung der Kochfelder laut Hersteller individuell wählbar",
        "Hob layout can be chosen individually according to the manufacturer",
        "Disposition des tables librement choisie selon le fabricant",
        "Disposizione dei piani scelta liberamente secondo il produttore"
      ),
    ]),
    masse: Object.freeze([mass("breite", "852 mm"), mass("hoehe", "199 mm"), mass("tiefe", "540 mm"), mass("gewicht", "25 kg")]),
    bilder: Object.freeze([
      bild("bora-pkas3fi-1.webp", 1152, 864, T(
        "BORA Pro Set Flächeninduktion (PKAS3FI): Produktansicht vor hellem Hintergrund",
        "BORA Pro Set Flächeninduktion (PKAS3FI): product view on a light background",
        "BORA Pro Set Flächeninduktion (PKAS3FI) : vue du produit sur fond clair",
        "BORA Pro Set Flächeninduktion (PKAS3FI): vista del prodotto su fondo chiaro"
      ), "https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0-pkas3fi"),
      bild("bora-pkas3fi-2.webp", 1152, 864, T(
        "BORA Pro Set Flächeninduktion (PKAS3FIR): Produktansicht vor hellem Hintergrund",
        "BORA Pro Set Flächeninduktion (PKAS3FIR): product view on a light background",
        "BORA Pro Set Flächeninduktion (PKAS3FIR) : vue du produit sur fond clair",
        "BORA Pro Set Flächeninduktion (PKAS3FIR): vista del prodotto su fondo chiaro"
      ), "https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0-pkas3fir"),
      bild("bora-pkas3fi-3.webp", 1152, 864, T(
        "BORA Pro Set Flächeninduktion (PKAS3FIAB): Produktansicht vor hellem Hintergrund",
        "BORA Pro Set Flächeninduktion (PKAS3FIAB): product view on a light background",
        "BORA Pro Set Flächeninduktion (PKAS3FIAB) : vue du produit sur fond clair",
        "BORA Pro Set Flächeninduktion (PKAS3FIAB): vista del prodotto su fondo chiaro"
      ), "https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0-pkas3fiab"),
      bild("bora-pkas3fi-4.webp", 1152, 864, T(
        "BORA Pro Set Flächeninduktion (PKAS3FIABR): Produktansicht vor hellem Hintergrund",
        "BORA Pro Set Flächeninduktion (PKAS3FIABR): product view on a light background",
        "BORA Pro Set Flächeninduktion (PKAS3FIABR) : vue du produit sur fond clair",
        "BORA Pro Set Flächeninduktion (PKAS3FIABR): vista del prodotto su fondo chiaro"
      ), "https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0-pkas3fiabr"),
      bild("bora-ambiente-pro.webp", 960, 540, T(
        "BORA Pro Set Flächeninduktion Rough eingebaut, Draufsicht mit Töpfen und Bräter auf heller Arbeitsplatte",
        "BORA Pro Set full-surface induction Rough installed, top view with pots and roaster on a light worktop",
        "BORA Pro Set induction pleine surface Rough encastré, vue de dessus avec casseroles et rôtissoire sur plan clair",
        "BORA Pro Set induzione a superficie totale Rough incassato, vista dall’alto con pentole e rostiera su piano chiaro"
      ), "https://www.bora.com/de-at/kochfeldabzugssysteme", "ambiente"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T(
          "Ausführung",
          "Version",
          "Version",
          "Versione"
        ),
        optionen: Object.freeze([
          opt("pkas3fi", T(
            "Standard, Glaskeramik glänzend",
            "Standard, gloss glass ceramic",
            "Standard, vitrocéramique brillante",
            "Standard, vetroceramica lucida"
          ), "PKAS3FI", "/Images/Wellness/produkte/bora/bora-pkas3fi-1.webp", true),
          opt("pkas3fir", T(
            "Rough, Glaskeramik matt",
            "Rough, matt glass ceramic",
            "Rough, vitrocéramique mate",
            "Rough, vetroceramica opaca"
          ), "PKAS3FIR", "/Images/Wellness/produkte/bora/bora-pkas3fi-2.webp", false),
          opt("pkas3fiab", T(
            "All Black, Glaskeramik glänzend",
            "All Black, gloss glass ceramic",
            "All Black, vitrocéramique brillante",
            "All Black, vetroceramica lucida"
          ), "PKAS3FIAB", "/Images/Wellness/produkte/bora/bora-pkas3fi-3.webp", false),
          opt("pkas3fiabr", T(
            "All Black Rough, Glaskeramik matt",
            "All Black Rough, matt glass ceramic",
            "All Black Rough, vitrocéramique mate",
            "All Black Rough, vetroceramica opaca"
          ), "PKAS3FIABR", "/Images/Wellness/produkte/bora/bora-pkas3fi-4.webp", false),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0-pkas3fi",
    quellen: Object.freeze(["https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0-pkas3fi","https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0-pkas3fir","https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0-pkas3fiab","https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0-pkas3fiabr","https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0","https://www.bora.com/de-at/kochfeldabzugssysteme"]),
    stand: STAND,
    verwandt: Object.freeze(["bora-pkas3","bora-pkfi3"]),
  }),
  Object.freeze({
    slug: "bora-pkas3fit",
    marke: "bora",
    bereich: "kueche",
    kategorie: "kochfeld-mit-abzug",
    name: "Pro Set Flächeninduktion Tepan",
    serie: "Professional 3.0",
    kurz: T(
      "Set aus dem BORA Modularsystem Professional 3.0: Kochfeldabzug mit Kochfeldern (Flächeninduktion und Tepan-Edelstahlgrill), zusammen 4 Kochzonen und 852 mm breit, für Abluft oder Umluft.",
      "Set from the BORA Professional 3.0 modular system: cooktop extractor with hobs (full-surface induction and Tepan stainless steel grill), 4 cooking zones in total and 852 mm wide, for ducted extraction or recirculation.",
      "Ensemble du système modulaire BORA Professional 3.0 : aspiration de table avec tables de cuisson (induction pleine surface et gril Tepan en inox), 4 zones de cuisson au total, 852 mm de large, en évacuation extérieure ou en recyclage.",
      "Set del sistema modulare BORA Professional 3.0: aspiratore piano con piani cottura (induzione a superficie totale e griglia Tepan in acciaio inox), 4 zone di cottura in totale, largo 852 mm, in versione aspirante o filtrante."
    ),
    merkmale: Object.freeze([
      T(
        "Kochfeldart: Flächeninduktion und Tepan-Edelstahlgrill, 4 Kochzonen",
        "Hob type: full-surface induction and Tepan stainless steel grill, 4 cooking zones",
        "Type de table : induction pleine surface et gril Tepan en inox, 4 zones de cuisson",
        "Tipo di piano: induzione a superficie totale e griglia Tepan in acciaio inox, 4 zone di cottura"
      ),
      T(
        "Kochzonen: 230 × 230 mm / 295 × 230 mm / 230 × 230 mm / 295 × 230 mm",
        "Cooking zones: 230 × 230 mm / 295 × 230 mm / 230 × 230 mm / 295 × 230 mm",
        "Zones de cuisson : 230 × 230 mm / 295 × 230 mm / 230 × 230 mm / 295 × 230 mm",
        "Zone di cottura: 230 × 230 mm / 295 × 230 mm / 230 × 230 mm / 295 × 230 mm"
      ),
      T(
        "Temperaturbereich 70 - 250 °C",
        "Temperature range 70 - 250 °C",
        "Plage de température 70 - 250 °C",
        "Intervallo di temperatura 70 - 250 °C"
      ),
      T(
        "Betriebsart: Abluft oder Umluft",
        "Operating mode: ducted extraction or recirculation",
        "Mode de fonctionnement : évacuation extérieure ou recyclage",
        "Modalità: versione aspirante o filtrante"
      ),
      T(
        "9 Leistungsstufen des Kochfeldabzugs",
        "9 extractor power levels",
        "9 niveaux de puissance de l’aspiration",
        "9 livelli di potenza dell’aspirazione"
      ),
      T(
        "Kanalanschluss Ecotube",
        "Duct connection Ecotube",
        "Raccordement de gaine Ecotube",
        "Raccordo canale Ecotube"
      ),
      T(
        "Funktionen: Nachlaufautomatik, Filterstandsanzeige (bei Umluft), Powerstufe, automatische Abzugssteuerung, Brückenfunktion, Kochzonen-Timer, Kurzzeitwecker, Pausefunktion, variable Warmhaltefunktion",
        "Functions: automatic run-on, filter status display (recirculation), power level, automatic extractor control, bridge function, cooking zone timer, kitchen timer, pause function, variable keep-warm function",
        "Fonctions : temporisation automatique, indicateur d’état du filtre (recyclage), niveau Power, commande automatique de l’aspiration, fonction pont, minuterie par zone, minuteur, fonction pause, maintien au chaud variable",
        "Funzioni: funzionamento residuo automatico, indicatore stato filtro (versione filtrante), livello Power, controllo automatico dell’aspirazione, funzione ponte, timer per zona di cottura, contaminuti, funzione pausa, funzione di mantenimento in caldo variabile"
      ),
      T(
        "Anordnung der Kochfelder laut Hersteller individuell wählbar",
        "Hob layout can be chosen individually according to the manufacturer",
        "Disposition des tables librement choisie selon le fabricant",
        "Disposizione dei piani scelta liberamente secondo il produttore"
      ),
    ]),
    masse: Object.freeze([mass("breite", "852 mm"), mass("hoehe", "199 mm"), mass("tiefe", "540 mm"), mass("gewicht", "30 kg")]),
    bilder: Object.freeze([
      bild("bora-pkas3fit-1.webp", 1152, 864, T(
        "BORA Pro Set Flächeninduktion Tepan (PKAS3FIT): Produktansicht vor hellem Hintergrund",
        "BORA Pro Set Flächeninduktion Tepan (PKAS3FIT): product view on a light background",
        "BORA Pro Set Flächeninduktion Tepan (PKAS3FIT) : vue du produit sur fond clair",
        "BORA Pro Set Flächeninduktion Tepan (PKAS3FIT): vista del prodotto su fondo chiaro"
      ), "https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0-pkas3fit"),
      bild("bora-pkas3fit-2.webp", 1152, 864, T(
        "BORA Pro Set Flächeninduktion Tepan (PKAS3FITR): Produktansicht vor hellem Hintergrund",
        "BORA Pro Set Flächeninduktion Tepan (PKAS3FITR): product view on a light background",
        "BORA Pro Set Flächeninduktion Tepan (PKAS3FITR) : vue du produit sur fond clair",
        "BORA Pro Set Flächeninduktion Tepan (PKAS3FITR): vista del prodotto su fondo chiaro"
      ), "https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0-pkas3fitr"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T(
          "Ausführung",
          "Version",
          "Version",
          "Versione"
        ),
        optionen: Object.freeze([
          opt("pkas3fit", T(
            "Standard, Glaskeramik glänzend",
            "Standard, gloss glass ceramic",
            "Standard, vitrocéramique brillante",
            "Standard, vetroceramica lucida"
          ), "PKAS3FIT", "/Images/Wellness/produkte/bora/bora-pkas3fit-1.webp", true),
          opt("pkas3fitr", T(
            "Rough, Glaskeramik matt",
            "Rough, matt glass ceramic",
            "Rough, vitrocéramique mate",
            "Rough, vetroceramica opaca"
          ), "PKAS3FITR", "/Images/Wellness/produkte/bora/bora-pkas3fit-2.webp", false),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0-pkas3fit",
    quellen: Object.freeze(["https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0-pkas3fit","https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0-pkas3fitr","https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0"]),
    stand: STAND,
    verwandt: Object.freeze(["bora-pkas3","bora-pkfi3","bora-pkt3"]),
  }),
  Object.freeze({
    slug: "bora-pkas3hl",
    marke: "bora",
    bereich: "kueche",
    kategorie: "kochfeld-mit-abzug",
    name: "Pro Set HiLight",
    serie: "Professional 3.0",
    kurz: T(
      "Set aus dem BORA Modularsystem Professional 3.0: Kochfeldabzug mit Kochfeldern (Strahlheizkörper), zusammen 4 Kochzonen und 852 mm breit, für Abluft oder Umluft.",
      "Set from the BORA Professional 3.0 modular system: cooktop extractor with hobs (radiant heating), 4 cooking zones in total and 852 mm wide, for ducted extraction or recirculation.",
      "Ensemble du système modulaire BORA Professional 3.0 : aspiration de table avec tables de cuisson (foyers radiants), 4 zones de cuisson au total, 852 mm de large, en évacuation extérieure ou en recyclage.",
      "Set del sistema modulare BORA Professional 3.0: aspiratore piano con piani cottura (elementi radianti), 4 zone di cottura in totale, largo 852 mm, in versione aspirante o filtrante."
    ),
    merkmale: Object.freeze([
      T(
        "Modell PKAS3HL",
        "Model PKAS3HL",
        "Modèle PKAS3HL",
        "Modello PKAS3HL"
      ),
      T(
        "Kochfeldart: Strahlheizkörper, 4 Kochzonen",
        "Hob type: radiant heating, 4 cooking zones",
        "Type de table : foyers radiants, 4 zones de cuisson",
        "Tipo di piano: elementi radianti, 4 zone di cottura"
      ),
      T(
        "Kochzonen: 120/180/235 mm / 120/180/235 mm / 120/200 mm / 165/290x165 mm",
        "Cooking zones: 120/180/235 mm / 120/180/235 mm / 120/200 mm / 165/290x165 mm",
        "Zones de cuisson : 120/180/235 mm / 120/180/235 mm / 120/200 mm / 165/290x165 mm",
        "Zone di cottura: 120/180/235 mm / 120/180/235 mm / 120/200 mm / 165/290x165 mm"
      ),
      T(
        "Betriebsart: Abluft oder Umluft",
        "Operating mode: ducted extraction or recirculation",
        "Mode de fonctionnement : évacuation extérieure ou recyclage",
        "Modalità: versione aspirante o filtrante"
      ),
      T(
        "9 Leistungsstufen des Kochfeldabzugs",
        "9 extractor power levels",
        "9 niveaux de puissance de l’aspiration",
        "9 livelli di potenza dell’aspirazione"
      ),
      T(
        "Kanalanschluss Ecotube",
        "Duct connection Ecotube",
        "Raccordement de gaine Ecotube",
        "Raccordo canale Ecotube"
      ),
      T(
        "Oberfläche: Glaskeramik, glänzend",
        "Surface: glass ceramic, gloss",
        "Surface : vitrocéramique, brillante",
        "Superficie: vetroceramica, lucida"
      ),
      T(
        "Funktionen: Nachlaufautomatik, Filterstandsanzeige (bei Umluft), Powerstufe, automatische Abzugssteuerung, Kochzonen-Timer, Kurzzeitwecker, Pausefunktion, variable Warmhaltefunktion",
        "Functions: automatic run-on, filter status display (recirculation), power level, automatic extractor control, cooking zone timer, kitchen timer, pause function, variable keep-warm function",
        "Fonctions : temporisation automatique, indicateur d’état du filtre (recyclage), niveau Power, commande automatique de l’aspiration, minuterie par zone, minuteur, fonction pause, maintien au chaud variable",
        "Funzioni: funzionamento residuo automatico, indicatore stato filtro (versione filtrante), livello Power, controllo automatico dell’aspirazione, timer per zona di cottura, contaminuti, funzione pausa, funzione di mantenimento in caldo variabile"
      ),
      T(
        "Anordnung der Kochfelder laut Hersteller individuell wählbar",
        "Hob layout can be chosen individually according to the manufacturer",
        "Disposition des tables librement choisie selon le fabricant",
        "Disposizione dei piani scelta liberamente secondo il produttore"
      ),
    ]),
    masse: Object.freeze([mass("breite", "852 mm"), mass("hoehe", "199 mm"), mass("tiefe", "540 mm"), mass("gewicht", "30 kg")]),
    bilder: Object.freeze([
      bild("bora-pkas3hl-1.webp", 1152, 864, T(
        "BORA Pro Set HiLight (PKAS3HL): Produktansicht vor hellem Hintergrund",
        "BORA Pro Set HiLight (PKAS3HL): product view on a light background",
        "BORA Pro Set HiLight (PKAS3HL) : vue du produit sur fond clair",
        "BORA Pro Set HiLight (PKAS3HL): vista del prodotto su fondo chiaro"
      ), "https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0-pkas3hl"),
    ]),
    herstellerUrl: "https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0-pkas3hl",
    quellen: Object.freeze(["https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0-pkas3hl","https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0"]),
    stand: STAND,
    verwandt: Object.freeze(["bora-pkas3","bora-pkc3","bora-pkcb3"]),
  }),
  Object.freeze({
    slug: "bora-cka2fi",
    marke: "bora",
    bereich: "kueche",
    kategorie: "kochfeld-mit-abzug",
    name: "Classic Set Flächeninduktion",
    serie: "Classic 2.0",
    kurz: T(
      "Set aus dem BORA Modularsystem Classic 2.0: Kochfeldabzug mit Kochfeldern (Flächeninduktion), zusammen 4 Kochzonen und 772 mm breit, für Abluft oder Umluft.",
      "Set from the BORA Classic 2.0 modular system: cooktop extractor with hobs (full-surface induction), 4 cooking zones in total and 772 mm wide, for ducted extraction or recirculation.",
      "Ensemble du système modulaire BORA Classic 2.0 : aspiration de table avec tables de cuisson (induction pleine surface), 4 zones de cuisson au total, 772 mm de large, en évacuation extérieure ou en recyclage.",
      "Set del sistema modulare BORA Classic 2.0: aspiratore piano con piani cottura (induzione a superficie totale), 4 zone di cottura in totale, largo 772 mm, in versione aspirante o filtrante."
    ),
    merkmale: Object.freeze([
      T(
        "Kochfeldart: Flächeninduktion, 4 Kochzonen",
        "Hob type: full-surface induction, 4 cooking zones",
        "Type de table : induction pleine surface, 4 zones de cuisson",
        "Tipo di piano: induzione a superficie totale, 4 zone di cottura"
      ),
      T(
        "Kochzonen: 230 × 230 mm / 230 × 230 mm / 230 × 230 mm / 230 × 230 mm",
        "Cooking zones: 230 × 230 mm / 230 × 230 mm / 230 × 230 mm / 230 × 230 mm",
        "Zones de cuisson : 230 × 230 mm / 230 × 230 mm / 230 × 230 mm / 230 × 230 mm",
        "Zone di cottura: 230 × 230 mm / 230 × 230 mm / 230 × 230 mm / 230 × 230 mm"
      ),
      T(
        "Betriebsart: Abluft oder Umluft",
        "Operating mode: ducted extraction or recirculation",
        "Mode de fonctionnement : évacuation extérieure ou recyclage",
        "Modalità: versione aspirante o filtrante"
      ),
      T(
        "5 Leistungsstufen des Kochfeldabzugs",
        "5 extractor power levels",
        "5 niveaux de puissance de l’aspiration",
        "5 livelli di potenza dell’aspirazione"
      ),
      T(
        "Kanalanschluss Ecotube",
        "Duct connection Ecotube",
        "Raccordement de gaine Ecotube",
        "Raccordo canale Ecotube"
      ),
      T(
        "Funktionen: Powerstufe, Topferkennung, Kochzonen-Timer, Kurzzeitwecker, Ankochautomatik, variable Warmhaltefunktion, Brückenfunktion, automatische Abzugssteuerung, Nachlaufautomatik, Filterstandsanzeige (bei Umluft), Pausefunktion, Reinigungssperre",
        "Functions: power level, pan detection, cooking zone timer, kitchen timer, automatic boost start, variable keep-warm function, bridge function, automatic extractor control, automatic run-on, filter status display (recirculation), pause function, cleaning lock",
        "Fonctions : niveau Power, détection des récipients, minuterie par zone, minuteur, démarrage automatique de cuisson, maintien au chaud variable, fonction pont, commande automatique de l’aspiration, temporisation automatique, indicateur d’état du filtre (recyclage), fonction pause, verrouillage pour le nettoyage",
        "Funzioni: livello Power, riconoscimento pentole, timer per zona di cottura, contaminuti, avvio automatico di cottura, funzione di mantenimento in caldo variabile, funzione ponte, controllo automatico dell’aspirazione, funzionamento residuo automatico, indicatore stato filtro (versione filtrante), funzione pausa, blocco per la pulizia"
      ),
      T(
        "Anordnung der Kochfelder laut Hersteller individuell wählbar",
        "Hob layout can be chosen individually according to the manufacturer",
        "Disposition des tables librement choisie selon le fabricant",
        "Disposizione dei piani scelta liberamente secondo il produttore"
      ),
    ]),
    masse: Object.freeze([mass("breite", "772 mm"), mass("hoehe", "190 mm"), mass("tiefe", "515 mm"), mass("gewicht", "33 kg")]),
    bilder: Object.freeze([
      bild("bora-cka2fi-1.webp", 1152, 864, T(
        "BORA Classic Set Flächeninduktion (CKA2FI): Produktansicht vor hellem Hintergrund",
        "BORA Classic Set Flächeninduktion (CKA2FI): product view on a light background",
        "BORA Classic Set Flächeninduktion (CKA2FI) : vue du produit sur fond clair",
        "BORA Classic Set Flächeninduktion (CKA2FI): vista del prodotto su fondo chiaro"
      ), "https://www.bora.com/de-at/kochfeldabzugssysteme/classic-2-0-cka2fi"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T(
          "Ausführung",
          "Version",
          "Version",
          "Versione"
        ),
        optionen: Object.freeze([
          opt("cka2fi", T(
            "Standard (Edelstahl)",
            "Standard (stainless steel)",
            "Standard (inox)",
            "Standard (acciaio inox)"
          ), "CKA2FI", "/Images/Wellness/produkte/bora/bora-cka2fi-1.webp", true),
          opt("cka2fiab", T(
            "All Black",
            "All Black",
            "All Black",
            "All Black"
          ), "CKA2FIAB", "/Images/Wellness/produkte/bora/bora-cka2fi-1.webp", false),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.bora.com/de-at/kochfeldabzugssysteme/classic-2-0-cka2fi",
    quellen: Object.freeze(["https://www.bora.com/de-at/kochfeldabzugssysteme/classic-2-0-cka2fi","https://www.bora.com/de-at/kochfeldabzugssysteme/classic-2-0-cka2fiab","https://www.bora.com/de-at/kochfeldabzugssysteme/classic-2-0"]),
    stand: STAND,
    verwandt: Object.freeze(["bora-cka2","bora-ckfi"]),
  }),
  Object.freeze({
    slug: "bora-cka2fit",
    marke: "bora",
    bereich: "kueche",
    kategorie: "kochfeld-mit-abzug",
    name: "Classic Set Flächeninduktion Tepan",
    serie: "Classic 2.0",
    kurz: T(
      "Set aus dem BORA Modularsystem Classic 2.0: Kochfeldabzug mit Kochfeldern (Flächeninduktion und Tepan-Edelstahlgrill), zusammen 4 Kochzonen und 772 mm breit, für Abluft oder Umluft.",
      "Set from the BORA Classic 2.0 modular system: cooktop extractor with hobs (full-surface induction and Tepan stainless steel grill), 4 cooking zones in total and 772 mm wide, for ducted extraction or recirculation.",
      "Ensemble du système modulaire BORA Classic 2.0 : aspiration de table avec tables de cuisson (induction pleine surface et gril Tepan en inox), 4 zones de cuisson au total, 772 mm de large, en évacuation extérieure ou en recyclage.",
      "Set del sistema modulare BORA Classic 2.0: aspiratore piano con piani cottura (induzione a superficie totale e griglia Tepan in acciaio inox), 4 zone di cottura in totale, largo 772 mm, in versione aspirante o filtrante."
    ),
    merkmale: Object.freeze([
      T(
        "Modell CKA2FIT",
        "Model CKA2FIT",
        "Modèle CKA2FIT",
        "Modello CKA2FIT"
      ),
      T(
        "Kochfeldart: Flächeninduktion und Tepan-Edelstahlgrill, 4 Kochzonen",
        "Hob type: full-surface induction and Tepan stainless steel grill, 4 cooking zones",
        "Type de table : induction pleine surface et gril Tepan en inox, 4 zones de cuisson",
        "Tipo di piano: induzione a superficie totale e griglia Tepan in acciaio inox, 4 zone di cottura"
      ),
      T(
        "Kochzonen: 230 × 230 mm / 250x220 mm / 230 × 230 mm / 250x220 mm",
        "Cooking zones: 230 × 230 mm / 250x220 mm / 230 × 230 mm / 250x220 mm",
        "Zones de cuisson : 230 × 230 mm / 250x220 mm / 230 × 230 mm / 250x220 mm",
        "Zone di cottura: 230 × 230 mm / 250x220 mm / 230 × 230 mm / 250x220 mm"
      ),
      T(
        "Betriebsart: Abluft oder Umluft",
        "Operating mode: ducted extraction or recirculation",
        "Mode de fonctionnement : évacuation extérieure ou recyclage",
        "Modalità: versione aspirante o filtrante"
      ),
      T(
        "5 Leistungsstufen des Kochfeldabzugs",
        "5 extractor power levels",
        "5 niveaux de puissance de l’aspiration",
        "5 livelli di potenza dell’aspirazione"
      ),
      T(
        "Kanalanschluss Ecotube",
        "Duct connection Ecotube",
        "Raccordement de gaine Ecotube",
        "Raccordo canale Ecotube"
      ),
      T(
        "Oberfläche: Glaskeramik, Edelstahl, glänzend, gebürstet",
        "Surface: glass ceramic, stainless steel, gloss, brushed",
        "Surface : vitrocéramique, inox, brillante, brossé",
        "Superficie: vetroceramica, acciaio inox, lucida, spazzolato"
      ),
      T(
        "Funktionen: Powerstufe, Topferkennung, Kochzonen-Timer, Kurzzeitwecker, Ankochautomatik, Brückenfunktion, variable Warmhaltefunktion, Nachlaufautomatik, automatische Abzugssteuerung, Filterstandsanzeige (bei Umluft), Pausefunktion, Reinigungsfunktion, Reinigungssperre",
        "Functions: power level, pan detection, cooking zone timer, kitchen timer, automatic boost start, bridge function, variable keep-warm function, automatic run-on, automatic extractor control, filter status display (recirculation), pause function, cleaning function, cleaning lock",
        "Fonctions : niveau Power, détection des récipients, minuterie par zone, minuteur, démarrage automatique de cuisson, fonction pont, maintien au chaud variable, temporisation automatique, commande automatique de l’aspiration, indicateur d’état du filtre (recyclage), fonction pause, fonction nettoyage, verrouillage pour le nettoyage",
        "Funzioni: livello Power, riconoscimento pentole, timer per zona di cottura, contaminuti, avvio automatico di cottura, funzione ponte, funzione di mantenimento in caldo variabile, funzionamento residuo automatico, controllo automatico dell’aspirazione, indicatore stato filtro (versione filtrante), funzione pausa, funzione di pulizia, blocco per la pulizia"
      ),
      T(
        "Anordnung der Kochfelder laut Hersteller individuell wählbar",
        "Hob layout can be chosen individually according to the manufacturer",
        "Disposition des tables librement choisie selon le fabricant",
        "Disposizione dei piani scelta liberamente secondo il produttore"
      ),
    ]),
    masse: Object.freeze([mass("breite", "772 mm"), mass("hoehe", "190 mm"), mass("tiefe", "515 mm"), mass("gewicht", "38 kg")]),
    bilder: Object.freeze([
      bild("bora-cka2fit-1.webp", 1152, 864, T(
        "BORA Classic Set Flächeninduktion Tepan (CKA2FIT): Produktansicht vor hellem Hintergrund",
        "BORA Classic Set Flächeninduktion Tepan (CKA2FIT): product view on a light background",
        "BORA Classic Set Flächeninduktion Tepan (CKA2FIT) : vue du produit sur fond clair",
        "BORA Classic Set Flächeninduktion Tepan (CKA2FIT): vista del prodotto su fondo chiaro"
      ), "https://www.bora.com/de-at/kochfeldabzugssysteme/classic-2-0-cka2fit"),
      bild("bora-ambiente-classic.webp", 960, 632, T(
        "BORA Classic 2.0 mit Flächeninduktions-Kochfeld und Tepan-Edelstahlgrill in einer Steinarbeitsplatte",
        "BORA Classic 2.0 with full-surface induction hob and Tepan stainless steel grill in a stone worktop",
        "BORA Classic 2.0 avec table à induction pleine surface et gril Tepan en inox dans un plan en pierre",
        "BORA Classic 2.0 con piano a induzione a superficie totale e griglia Tepan in acciaio inox in un piano in pietra"
      ), "https://www.bora.com/de-at/kochfeldabzugssysteme", "ambiente"),
    ]),
    herstellerUrl: "https://www.bora.com/de-at/kochfeldabzugssysteme/classic-2-0-cka2fit",
    quellen: Object.freeze(["https://www.bora.com/de-at/kochfeldabzugssysteme/classic-2-0-cka2fit","https://www.bora.com/de-at/kochfeldabzugssysteme/classic-2-0","https://www.bora.com/de-at/kochfeldabzugssysteme"]),
    stand: STAND,
    verwandt: Object.freeze(["bora-cka2","bora-ckfi","bora-ckt"]),
  }),
  Object.freeze({
    slug: "bora-cka2hb",
    marke: "bora",
    bereich: "kueche",
    kategorie: "kochfeld-mit-abzug",
    name: "Classic Set Hyper Bräter",
    serie: "Classic 2.0",
    kurz: T(
      "Set aus dem BORA Modularsystem Classic 2.0: Kochfeldabzug mit Kochfeldern (Strahlheizkörper), zusammen 4 Kochzonen und 772 mm breit, für Abluft oder Umluft.",
      "Set from the BORA Classic 2.0 modular system: cooktop extractor with hobs (radiant heating), 4 cooking zones in total and 772 mm wide, for ducted extraction or recirculation.",
      "Ensemble du système modulaire BORA Classic 2.0 : aspiration de table avec tables de cuisson (foyers radiants), 4 zones de cuisson au total, 772 mm de large, en évacuation extérieure ou en recyclage.",
      "Set del sistema modulare BORA Classic 2.0: aspiratore piano con piani cottura (elementi radianti), 4 zone di cottura in totale, largo 772 mm, in versione aspirante o filtrante."
    ),
    merkmale: Object.freeze([
      T(
        "Modell CKA2HB",
        "Model CKA2HB",
        "Modèle CKA2HB",
        "Modello CKA2HB"
      ),
      T(
        "Kochfeldart: Strahlheizkörper, 4 Kochzonen",
        "Hob type: radiant heating, 4 cooking zones",
        "Type de table : foyers radiants, 4 zones de cuisson",
        "Tipo di piano: elementi radianti, 4 zone di cottura"
      ),
      T(
        "Kochzonen: 215 mm / 120/180 mm / 120/180 mm",
        "Cooking zones: 215 mm / 120/180 mm / 120/180 mm",
        "Zones de cuisson : 215 mm / 120/180 mm / 120/180 mm",
        "Zone di cottura: 215 mm / 120/180 mm / 120/180 mm"
      ),
      T(
        "Betriebsart: Abluft oder Umluft",
        "Operating mode: ducted extraction or recirculation",
        "Mode de fonctionnement : évacuation extérieure ou recyclage",
        "Modalità: versione aspirante o filtrante"
      ),
      T(
        "5 Leistungsstufen des Kochfeldabzugs",
        "5 extractor power levels",
        "5 niveaux de puissance de l’aspiration",
        "5 livelli di potenza dell’aspirazione"
      ),
      T(
        "Kanalanschluss Ecotube",
        "Duct connection Ecotube",
        "Raccordement de gaine Ecotube",
        "Raccordo canale Ecotube"
      ),
      T(
        "Oberfläche: Glaskeramik, glänzend",
        "Surface: glass ceramic, gloss",
        "Surface : vitrocéramique, brillante",
        "Superficie: vetroceramica, lucida"
      ),
      T(
        "Funktionen: automatische Abzugssteuerung, Nachlaufautomatik, Filterstandsanzeige (bei Umluft), Powerstufe, Reinigungssperre, Kurzzeitwecker, Kochzonen-Timer, Pausefunktion, Ankochautomatik, variable Warmhaltefunktion",
        "Functions: automatic extractor control, automatic run-on, filter status display (recirculation), power level, cleaning lock, kitchen timer, cooking zone timer, pause function, automatic boost start, variable keep-warm function",
        "Fonctions : commande automatique de l’aspiration, temporisation automatique, indicateur d’état du filtre (recyclage), niveau Power, verrouillage pour le nettoyage, minuteur, minuterie par zone, fonction pause, démarrage automatique de cuisson, maintien au chaud variable",
        "Funzioni: controllo automatico dell’aspirazione, funzionamento residuo automatico, indicatore stato filtro (versione filtrante), livello Power, blocco per la pulizia, contaminuti, timer per zona di cottura, funzione pausa, avvio automatico di cottura, funzione di mantenimento in caldo variabile"
      ),
      T(
        "Anordnung der Kochfelder laut Hersteller individuell wählbar",
        "Hob layout can be chosen individually according to the manufacturer",
        "Disposition des tables librement choisie selon le fabricant",
        "Disposizione dei piani scelta liberamente secondo il produttore"
      ),
    ]),
    masse: Object.freeze([mass("breite", "772 mm"), mass("hoehe", "190 mm"), mass("tiefe", "515 mm"), mass("gewicht", "31 kg")]),
    bilder: Object.freeze([
      bild("bora-cka2hb-1.webp", 1152, 864, T(
        "BORA Classic Set Hyper Bräter (CKA2HB): Produktansicht vor hellem Hintergrund",
        "BORA Classic Set Hyper Bräter (CKA2HB): product view on a light background",
        "BORA Classic Set Hyper Bräter (CKA2HB) : vue du produit sur fond clair",
        "BORA Classic Set Hyper Bräter (CKA2HB): vista del prodotto su fondo chiaro"
      ), "https://www.bora.com/de-at/kochfeldabzugssysteme/classic-2-0-cka2hb"),
    ]),
    herstellerUrl: "https://www.bora.com/de-at/kochfeldabzugssysteme/classic-2-0-cka2hb",
    quellen: Object.freeze(["https://www.bora.com/de-at/kochfeldabzugssysteme/classic-2-0-cka2hb","https://www.bora.com/de-at/kochfeldabzugssysteme/classic-2-0"]),
    stand: STAND,
    verwandt: Object.freeze(["bora-cka2","bora-ckch","bora-ckcb"]),
  }),
  Object.freeze({
    slug: "bora-x-pure-max",
    marke: "bora",
    bereich: "kueche",
    kategorie: "kochfeld-mit-abzug",
    name: "BORA X Pure Max",
    serie: "BORA X Pure Max",
    kurz: T(
      "Kompaktsystem von BORA: Kochfeld (Induktion und Flächeninduktion) mit integriertem Kochfeldabzug, 5 Kochzonen, 830 mm breit; als Abluft- oder Umluftvariante, Glaskeramik glänzend oder matt. Laut Hersteller mit optionalen Bedienknebeln.",
      "BORA compact system: hob (induction and full-surface induction) with integrated cooktop extractor, 5 cooking zones, 830 mm wide; available for ducted extraction or recirculation, with gloss or matt glass ceramic. Optional control knobs according to the manufacturer.",
      "Système compact BORA : table de cuisson (induction et induction pleine surface) avec aspiration intégrée, 5 zones de cuisson, 830 mm de large ; en évacuation extérieure ou en recyclage, vitrocéramique brillante ou mate. Boutons de commande en option selon le fabricant.",
      "Sistema compatto BORA: piano cottura (induzione e induzione a superficie totale) con aspiratore integrato, 5 zone di cottura, largo 830 mm; in versione aspirante o filtrante, vetroceramica lucida o opaca. Manopole di comando opzionali secondo il produttore."
    ),
    merkmale: Object.freeze([
      T(
        "Kochfeldart: Induktion und Flächeninduktion, 5 Kochzonen",
        "Hob type: induction and full-surface induction, 5 cooking zones",
        "Type de table : induction et induction pleine surface, 5 zones de cuisson",
        "Tipo di piano: induzione e induzione a superficie totale, 5 zone di cottura"
      ),
      T(
        "Kochzonen: 230 × 230 mm / 230 × 230 mm / 230 × 230 mm / 230 × 230 mm / Ø 140 mm",
        "Cooking zones: 230 × 230 mm / 230 × 230 mm / 230 × 230 mm / 230 × 230 mm / Ø 140 mm",
        "Zones de cuisson : 230 × 230 mm / 230 × 230 mm / 230 × 230 mm / 230 × 230 mm / Ø 140 mm",
        "Zone di cottura: 230 × 230 mm / 230 × 230 mm / 230 × 230 mm / 230 × 230 mm / Ø 140 mm"
      ),
      T(
        "9 Leistungsstufen des Kochfeldabzugs",
        "9 extractor power levels",
        "9 niveaux de puissance de l’aspiration",
        "9 livelli di potenza dell’aspirazione"
      ),
      T(
        "Kanalanschluss Ecotube",
        "Duct connection Ecotube",
        "Raccordement de gaine Ecotube",
        "Raccordo canale Ecotube"
      ),
      T(
        "Leistungsaufnahme max. 7360 W",
        "Max. power consumption 7360 W",
        "Puissance absorbée max. 7360 W",
        "Potenza assorbita max. 7360 W"
      ),
      T(
        "Funktionen: Powerstufe, automatische Abzugssteuerung, Nachlaufautomatik, Topferkennung, Brückenfunktion, Kochzonen-Timer, Kurzzeitwecker, Pausefunktion",
        "Functions: power level, automatic extractor control, automatic run-on, pan detection, bridge function, cooking zone timer, kitchen timer, pause function",
        "Fonctions : niveau Power, commande automatique de l’aspiration, temporisation automatique, détection des récipients, fonction pont, minuterie par zone, minuteur, fonction pause",
        "Funzioni: livello Power, controllo automatico dell’aspirazione, funzionamento residuo automatico, riconoscimento pentole, funzione ponte, timer per zona di cottura, contaminuti, funzione pausa"
      ),
    ]),
    masse: Object.freeze([mass("breite", "830 mm"), mass("hoehe", "199 mm"), mass("tiefe", "515 mm"), mass("gewicht", "17,8 kg")]),
    bilder: Object.freeze([
      bild("bora-x-pure-max-1.webp", 1152, 864, T(
        "BORA BORA X Pure Max (PUXAM): Produktansicht vor hellem Hintergrund",
        "BORA BORA X Pure Max (PUXAM): product view on a light background",
        "BORA BORA X Pure Max (PUXAM) : vue du produit sur fond clair",
        "BORA BORA X Pure Max (PUXAM): vista del prodotto su fondo chiaro"
      ), "https://www.bora.com/de-at/kochfeldabzugssysteme/pure-puxam"),
      bild("bora-x-pure-max-2.webp", 1152, 864, T(
        "BORA BORA X Pure Max (PUXAMR): Produktansicht vor hellem Hintergrund",
        "BORA BORA X Pure Max (PUXAMR): product view on a light background",
        "BORA BORA X Pure Max (PUXAMR) : vue du produit sur fond clair",
        "BORA BORA X Pure Max (PUXAMR): vista del prodotto su fondo chiaro"
      ), "https://www.bora.com/de-at/kochfeldabzugssysteme/pure-puxamr"),
      bild("bora-ambiente-xpuremax.webp", 960, 540, T(
        "BORA X Pure Max eingebaut in eine helle Steinarbeitsplatte, Draufsicht mit Pfannen und Bräter",
        "BORA X Pure Max installed in a light stone worktop, top view with pans and roaster",
        "BORA X Pure Max encastré dans un plan de travail en pierre claire, vue de dessus avec poêles et rôtissoire",
        "BORA X Pure Max incassato in un piano di lavoro in pietra chiara, vista dall’alto con padelle e rostiera"
      ), "https://www.bora.com/de-at/kochfeldabzugssysteme", "ambiente"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T(
          "Ausführung",
          "Version",
          "Version",
          "Versione"
        ),
        optionen: Object.freeze([
          opt("puxam", T(
            "Abluft, Glaskeramik glänzend",
            "Ducted, gloss glass ceramic",
            "Évacuation extérieure, vitrocéramique brillante",
            "Aspirante, vetroceramica lucida"
          ), "PUXAM", "/Images/Wellness/produkte/bora/bora-x-pure-max-1.webp", true),
          opt("puxamr", T(
            "Abluft, Glaskeramik matt (Rough)",
            "Ducted, matt glass ceramic (Rough)",
            "Évacuation extérieure, vitrocéramique mate (Rough)",
            "Aspirante, vetroceramica opaca (Rough)"
          ), "PUXAMR", "/Images/Wellness/produkte/bora/bora-x-pure-max-2.webp", false),
          opt("puxum", T(
            "Umluft, Glaskeramik glänzend",
            "Recirculation, gloss glass ceramic",
            "Recyclage, vitrocéramique brillante",
            "Filtrante, vetroceramica lucida"
          ), "PUXUM", "/Images/Wellness/produkte/bora/bora-x-pure-max-1.webp", false),
          opt("puxumr", T(
            "Umluft, Glaskeramik matt (Rough)",
            "Recirculation, matt glass ceramic (Rough)",
            "Recyclage, vitrocéramique mate (Rough)",
            "Filtrante, vetroceramica opaca (Rough)"
          ), "PUXUMR", "/Images/Wellness/produkte/bora/bora-x-pure-max-2.webp", false),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.bora.com/de-at/kochfeldabzugssysteme/pure-puxam",
    quellen: Object.freeze(["https://www.bora.com/de-at/kochfeldabzugssysteme/pure-puxam","https://www.bora.com/de-at/kochfeldabzugssysteme/pure-puxamr","https://www.bora.com/de-at/kochfeldabzugssysteme/pure-puxum","https://www.bora.com/de-at/kochfeldabzugssysteme/pure-puxumr","https://www.bora.com/de-at/kochfeldabzugssysteme/x-pure-max","https://www.bora.com/de-at/kochfeldabzugssysteme"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "bora-x-pure",
    marke: "bora",
    bereich: "kueche",
    kategorie: "kochfeld-mit-abzug",
    name: "BORA X Pure",
    serie: "BORA X Pure",
    kurz: T(
      "Kompaktsystem von BORA: Kochfeld (Flächeninduktion) mit integriertem Kochfeldabzug, 4 Kochzonen, 830 mm breit; als Abluft- oder Umluftvariante, Glaskeramik glänzend oder matt. Verbindbar mit der App BORA One.",
      "BORA compact system: hob (full-surface induction) with integrated cooktop extractor, 4 cooking zones, 830 mm wide; available for ducted extraction or recirculation, with gloss or matt glass ceramic. Connectable to the BORA One app.",
      "Système compact BORA : table de cuisson (induction pleine surface) avec aspiration intégrée, 4 zones de cuisson, 830 mm de large ; en évacuation extérieure ou en recyclage, vitrocéramique brillante ou mate. Connectable à l’application BORA One.",
      "Sistema compatto BORA: piano cottura (induzione a superficie totale) con aspiratore integrato, 4 zone di cottura, largo 830 mm; in versione aspirante o filtrante, vetroceramica lucida o opaca. Collegabile all’app BORA One."
    ),
    merkmale: Object.freeze([
      T(
        "Kochfeldart: Flächeninduktion, 4 Kochzonen",
        "Hob type: full-surface induction, 4 cooking zones",
        "Type de table : induction pleine surface, 4 zones de cuisson",
        "Tipo di piano: induzione a superficie totale, 4 zone di cottura"
      ),
      T(
        "Kochzonen: 230 × 230 mm / 230 × 230 mm / 230 × 230 mm / 230 × 230 mm",
        "Cooking zones: 230 × 230 mm / 230 × 230 mm / 230 × 230 mm / 230 × 230 mm",
        "Zones de cuisson : 230 × 230 mm / 230 × 230 mm / 230 × 230 mm / 230 × 230 mm",
        "Zone di cottura: 230 × 230 mm / 230 × 230 mm / 230 × 230 mm / 230 × 230 mm"
      ),
      T(
        "9 Leistungsstufen des Kochfeldabzugs",
        "9 extractor power levels",
        "9 niveaux de puissance de l’aspiration",
        "9 livelli di potenza dell’aspirazione"
      ),
      T(
        "Kanalanschluss Ecotube",
        "Duct connection Ecotube",
        "Raccordement de gaine Ecotube",
        "Raccordo canale Ecotube"
      ),
      T(
        "Leistungsaufnahme max. 7600 W",
        "Max. power consumption 7600 W",
        "Puissance absorbée max. 7600 W",
        "Potenza assorbita max. 7600 W"
      ),
      T(
        "Funktionen: BORA Assist, Powerstufe, automatische Abzugssteuerung, Nachlaufautomatik, Topferkennung, variable Warmhaltefunktion, Brückenfunktion, Kochzonen-Timer, Kurzzeitwecker, Pausefunktion",
        "Functions: BORA Assist, power level, automatic extractor control, automatic run-on, pan detection, variable keep-warm function, bridge function, cooking zone timer, kitchen timer, pause function",
        "Fonctions : BORA Assist, niveau Power, commande automatique de l’aspiration, temporisation automatique, détection des récipients, maintien au chaud variable, fonction pont, minuterie par zone, minuteur, fonction pause",
        "Funzioni: BORA Assist, livello Power, controllo automatico dell’aspirazione, funzionamento residuo automatico, riconoscimento pentole, funzione di mantenimento in caldo variabile, funzione ponte, timer per zona di cottura, contaminuti, funzione pausa"
      ),
    ]),
    masse: Object.freeze([mass("breite", "830 mm"), mass("hoehe", "199 mm"), mass("tiefe", "515 mm"), mass("gewicht", "16,9 kg")]),
    bilder: Object.freeze([
      bild("bora-x-pure-1.webp", 1152, 864, T(
        "BORA BORA X Pure (PUXA2): Produktansicht vor hellem Hintergrund",
        "BORA BORA X Pure (PUXA2): product view on a light background",
        "BORA BORA X Pure (PUXA2) : vue du produit sur fond clair",
        "BORA BORA X Pure (PUXA2): vista del prodotto su fondo chiaro"
      ), "https://www.bora.com/de-at/kochfeldabzugssysteme/x-pure-puxa2"),
      bild("bora-x-pure-2.webp", 1152, 864, T(
        "BORA BORA X Pure (PUXA2R): Produktansicht vor hellem Hintergrund",
        "BORA BORA X Pure (PUXA2R): product view on a light background",
        "BORA BORA X Pure (PUXA2R) : vue du produit sur fond clair",
        "BORA BORA X Pure (PUXA2R): vista del prodotto su fondo chiaro"
      ), "https://www.bora.com/de-at/kochfeldabzugssysteme/x-pure-puxa2r"),
      bild("bora-ambiente-xpure.webp", 960, 540, T(
        "BORA X Pure Rough eingebaut in eine helle Arbeitsplatte, Draufsicht mit Grillpfanne und Töpfen",
        "BORA X Pure Rough installed in a light worktop, top view with grill pan and pots",
        "BORA X Pure Rough encastré dans un plan de travail clair, vue de dessus avec poêle gril et casseroles",
        "BORA X Pure Rough incassato in un piano di lavoro chiaro, vista dall’alto con bistecchiera e pentole"
      ), "https://www.bora.com/de-at/kochfeldabzugssysteme", "ambiente"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T(
          "Ausführung",
          "Version",
          "Version",
          "Versione"
        ),
        optionen: Object.freeze([
          opt("puxa2", T(
            "Abluft, Glaskeramik glänzend",
            "Ducted, gloss glass ceramic",
            "Évacuation extérieure, vitrocéramique brillante",
            "Aspirante, vetroceramica lucida"
          ), "PUXA2", "/Images/Wellness/produkte/bora/bora-x-pure-1.webp", true),
          opt("puxa2r", T(
            "Abluft, Glaskeramik matt (Rough)",
            "Ducted, matt glass ceramic (Rough)",
            "Évacuation extérieure, vitrocéramique mate (Rough)",
            "Aspirante, vetroceramica opaca (Rough)"
          ), "PUXA2R", "/Images/Wellness/produkte/bora/bora-x-pure-2.webp", false),
          opt("puxu2", T(
            "Umluft, Glaskeramik glänzend",
            "Recirculation, gloss glass ceramic",
            "Recyclage, vitrocéramique brillante",
            "Filtrante, vetroceramica lucida"
          ), "PUXU2", "/Images/Wellness/produkte/bora/bora-x-pure-1.webp", false),
          opt("puxu2r", T(
            "Umluft, Glaskeramik matt (Rough)",
            "Recirculation, matt glass ceramic (Rough)",
            "Recyclage, vitrocéramique mate (Rough)",
            "Filtrante, vetroceramica opaca (Rough)"
          ), "PUXU2R", "/Images/Wellness/produkte/bora/bora-x-pure-2.webp", false),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.bora.com/de-at/kochfeldabzugssysteme/x-pure-puxa2",
    quellen: Object.freeze(["https://www.bora.com/de-at/kochfeldabzugssysteme/x-pure-puxa2","https://www.bora.com/de-at/kochfeldabzugssysteme/x-pure-puxa2r","https://www.bora.com/de-at/kochfeldabzugssysteme/x-pure-puxu2","https://www.bora.com/de-at/kochfeldabzugssysteme/x-pure-puxu2r","https://www.bora.com/de-at/kochfeldabzugssysteme/x-pure","https://www.bora.com/de-at/kochfeldabzugssysteme"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "bora-m-pure",
    marke: "bora",
    bereich: "kueche",
    kategorie: "kochfeld-mit-abzug",
    name: "BORA M Pure",
    serie: "BORA M Pure",
    kurz: T(
      "Kompaktsystem von BORA: Kochfeld (Induktion und Flächeninduktion) mit integriertem Kochfeldabzug, 4 Kochzonen, 760 mm breit; als Abluft- oder Umluftvariante, Glaskeramik glänzend oder matt.",
      "BORA compact system: hob (induction and full-surface induction) with integrated cooktop extractor, 4 cooking zones, 760 mm wide; available for ducted extraction or recirculation, with gloss or matt glass ceramic.",
      "Système compact BORA : table de cuisson (induction et induction pleine surface) avec aspiration intégrée, 4 zones de cuisson, 760 mm de large ; en évacuation extérieure ou en recyclage, vitrocéramique brillante ou mate.",
      "Sistema compatto BORA: piano cottura (induzione e induzione a superficie totale) con aspiratore integrato, 4 zone di cottura, largo 760 mm; in versione aspirante o filtrante, vetroceramica lucida o opaca."
    ),
    merkmale: Object.freeze([
      T(
        "Kochfeldart: Induktion und Flächeninduktion, 4 Kochzonen",
        "Hob type: induction and full-surface induction, 4 cooking zones",
        "Type de table : induction et induction pleine surface, 4 zones de cuisson",
        "Tipo di piano: induzione e induzione a superficie totale, 4 zone di cottura"
      ),
      T(
        "Kochzonen: Ø 210 mm / 230 × 230 mm / Ø 175 mm / 230 × 230 mm",
        "Cooking zones: Ø 210 mm / 230 × 230 mm / Ø 175 mm / 230 × 230 mm",
        "Zones de cuisson : Ø 210 mm / 230 × 230 mm / Ø 175 mm / 230 × 230 mm",
        "Zone di cottura: Ø 210 mm / 230 × 230 mm / Ø 175 mm / 230 × 230 mm"
      ),
      T(
        "9 Leistungsstufen des Kochfeldabzugs",
        "9 extractor power levels",
        "9 niveaux de puissance de l’aspiration",
        "9 livelli di potenza dell’aspirazione"
      ),
      T(
        "Kanalanschluss Ecotube",
        "Duct connection Ecotube",
        "Raccordement de gaine Ecotube",
        "Raccordo canale Ecotube"
      ),
      T(
        "Leistungsaufnahme max. 7360 W",
        "Max. power consumption 7360 W",
        "Puissance absorbée max. 7360 W",
        "Potenza assorbita max. 7360 W"
      ),
      T(
        "Funktionen: BORA Assist, Powerstufe, automatische Abzugssteuerung, Nachlaufautomatik, Topferkennung, variable Warmhaltefunktion, Brückenfunktion, Kochzonen-Timer, Kurzzeitwecker, Pausefunktion",
        "Functions: BORA Assist, power level, automatic extractor control, automatic run-on, pan detection, variable keep-warm function, bridge function, cooking zone timer, kitchen timer, pause function",
        "Fonctions : BORA Assist, niveau Power, commande automatique de l’aspiration, temporisation automatique, détection des récipients, maintien au chaud variable, fonction pont, minuterie par zone, minuteur, fonction pause",
        "Funzioni: BORA Assist, livello Power, controllo automatico dell’aspirazione, funzionamento residuo automatico, riconoscimento pentole, funzione di mantenimento in caldo variabile, funzione ponte, timer per zona di cottura, contaminuti, funzione pausa"
      ),
    ]),
    masse: Object.freeze([mass("breite", "760 mm"), mass("hoehe", "199 mm"), mass("tiefe", "515 mm"), mass("gewicht", "15,6 kg")]),
    bilder: Object.freeze([
      bild("bora-m-pure-1.webp", 1152, 864, T(
        "BORA BORA M Pure (PURMA2): Produktansicht vor hellem Hintergrund",
        "BORA BORA M Pure (PURMA2): product view on a light background",
        "BORA BORA M Pure (PURMA2) : vue du produit sur fond clair",
        "BORA BORA M Pure (PURMA2): vista del prodotto su fondo chiaro"
      ), "https://www.bora.com/de-at/kochfeldabzugssysteme/m-pure-purma2"),
      bild("bora-m-pure-2.webp", 1152, 864, T(
        "BORA BORA M Pure (PURMA2R): Produktansicht vor hellem Hintergrund",
        "BORA BORA M Pure (PURMA2R): product view on a light background",
        "BORA BORA M Pure (PURMA2R) : vue du produit sur fond clair",
        "BORA BORA M Pure (PURMA2R): vista del prodotto su fondo chiaro"
      ), "https://www.bora.com/de-at/kochfeldabzugssysteme/m-pure-purma2r"),
      bild("bora-ambiente-mpure.webp", 960, 540, T(
        "BORA M Pure Rough in einer dunklen Kücheninsel mit Holzarbeitsplatte",
        "BORA M Pure Rough in a dark kitchen island with wooden worktop",
        "BORA M Pure Rough dans un îlot de cuisine sombre avec plan de travail en bois",
        "BORA M Pure Rough in un’isola scura con piano in legno"
      ), "https://www.bora.com/de-at/kochfeldabzugssysteme", "ambiente"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T(
          "Ausführung",
          "Version",
          "Version",
          "Versione"
        ),
        optionen: Object.freeze([
          opt("purma2", T(
            "Abluft, Glaskeramik glänzend",
            "Ducted, gloss glass ceramic",
            "Évacuation extérieure, vitrocéramique brillante",
            "Aspirante, vetroceramica lucida"
          ), "PURMA2", "/Images/Wellness/produkte/bora/bora-m-pure-1.webp", true),
          opt("purma2r", T(
            "Abluft, Glaskeramik matt (Rough)",
            "Ducted, matt glass ceramic (Rough)",
            "Évacuation extérieure, vitrocéramique mate (Rough)",
            "Aspirante, vetroceramica opaca (Rough)"
          ), "PURMA2R", "/Images/Wellness/produkte/bora/bora-m-pure-2.webp", false),
          opt("purmu2", T(
            "Umluft, Glaskeramik glänzend",
            "Recirculation, gloss glass ceramic",
            "Recyclage, vitrocéramique brillante",
            "Filtrante, vetroceramica lucida"
          ), "PURMU2", "/Images/Wellness/produkte/bora/bora-m-pure-1.webp", false),
          opt("purmu2r", T(
            "Umluft, Glaskeramik matt (Rough)",
            "Recirculation, matt glass ceramic (Rough)",
            "Recyclage, vitrocéramique mate (Rough)",
            "Filtrante, vetroceramica opaca (Rough)"
          ), "PURMU2R", "/Images/Wellness/produkte/bora/bora-m-pure-2.webp", false),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.bora.com/de-at/kochfeldabzugssysteme/m-pure-purma2",
    quellen: Object.freeze(["https://www.bora.com/de-at/kochfeldabzugssysteme/m-pure-purma2","https://www.bora.com/de-at/kochfeldabzugssysteme/m-pure-purma2r","https://www.bora.com/de-at/kochfeldabzugssysteme/m-pure-purmu2","https://www.bora.com/de-at/kochfeldabzugssysteme/m-pure-purmu2r","https://www.bora.com/de-at/kochfeldabzugssysteme/m-pure","https://www.bora.com/de-at/kochfeldabzugssysteme"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "bora-pure",
    marke: "bora",
    bereich: "kueche",
    kategorie: "kochfeld-mit-abzug",
    name: "BORA Pure",
    serie: "BORA Pure",
    kurz: T(
      "Kompaktsystem von BORA: Kochfeld (Induktion) mit integriertem Kochfeldabzug, 4 Kochzonen, 760 mm breit; als Abluft- oder Umluftvariante, Glaskeramik glänzend oder matt.",
      "BORA compact system: hob (induction) with integrated cooktop extractor, 4 cooking zones, 760 mm wide; available for ducted extraction or recirculation, with gloss or matt glass ceramic.",
      "Système compact BORA : table de cuisson (induction) avec aspiration intégrée, 4 zones de cuisson, 760 mm de large ; en évacuation extérieure ou en recyclage, vitrocéramique brillante ou mate.",
      "Sistema compatto BORA: piano cottura (induzione) con aspiratore integrato, 4 zone di cottura, largo 760 mm; in versione aspirante o filtrante, vetroceramica lucida o opaca."
    ),
    merkmale: Object.freeze([
      T(
        "Kochfeldart: Induktion, 4 Kochzonen",
        "Hob type: induction, 4 cooking zones",
        "Type de table : induction, 4 zones de cuisson",
        "Tipo di piano: induzione, 4 zone di cottura"
      ),
      T(
        "Kochzonen: Ø 210 mm / Ø 210 mm / Ø 175 mm / Ø 175 mm",
        "Cooking zones: Ø 210 mm / Ø 210 mm / Ø 175 mm / Ø 175 mm",
        "Zones de cuisson : Ø 210 mm / Ø 210 mm / Ø 175 mm / Ø 175 mm",
        "Zone di cottura: Ø 210 mm / Ø 210 mm / Ø 175 mm / Ø 175 mm"
      ),
      T(
        "9 Leistungsstufen des Kochfeldabzugs",
        "9 extractor power levels",
        "9 niveaux de puissance de l’aspiration",
        "9 livelli di potenza dell’aspirazione"
      ),
      T(
        "Kanalanschluss Ecotube",
        "Duct connection Ecotube",
        "Raccordement de gaine Ecotube",
        "Raccordo canale Ecotube"
      ),
      T(
        "Leistungsaufnahme max. 7360 W",
        "Max. power consumption 7360 W",
        "Puissance absorbée max. 7360 W",
        "Potenza assorbita max. 7360 W"
      ),
      T(
        "Funktionen: BORA Assist, Powerstufe, automatische Abzugssteuerung, Nachlaufautomatik, Topferkennung, Kochzonen-Timer, Kurzzeitwecker, Pausefunktion",
        "Functions: BORA Assist, power level, automatic extractor control, automatic run-on, pan detection, cooking zone timer, kitchen timer, pause function",
        "Fonctions : BORA Assist, niveau Power, commande automatique de l’aspiration, temporisation automatique, détection des récipients, minuterie par zone, minuteur, fonction pause",
        "Funzioni: BORA Assist, livello Power, controllo automatico dell’aspirazione, funzionamento residuo automatico, riconoscimento pentole, timer per zona di cottura, contaminuti, funzione pausa"
      ),
    ]),
    masse: Object.freeze([mass("breite", "760 mm"), mass("hoehe", "199 mm"), mass("tiefe", "515 mm"), mass("gewicht", "15,2 kg")]),
    bilder: Object.freeze([
      bild("bora-pure-1.webp", 1152, 864, T(
        "BORA BORA Pure (PURA2): Produktansicht vor hellem Hintergrund",
        "BORA BORA Pure (PURA2): product view on a light background",
        "BORA BORA Pure (PURA2) : vue du produit sur fond clair",
        "BORA BORA Pure (PURA2): vista del prodotto su fondo chiaro"
      ), "https://www.bora.com/de-at/kochfeldabzugssysteme/pure-pura2"),
      bild("bora-pure-2.webp", 1152, 864, T(
        "BORA BORA Pure (PURA2R): Produktansicht vor hellem Hintergrund",
        "BORA BORA Pure (PURA2R): product view on a light background",
        "BORA BORA Pure (PURA2R) : vue du produit sur fond clair",
        "BORA BORA Pure (PURA2R): vista del prodotto su fondo chiaro"
      ), "https://www.bora.com/de-at/kochfeldabzugssysteme/pure-pura2r"),
      bild("bora-ambiente-pure.webp", 960, 540, T(
        "BORA Pure Rough in einer dunklen Kücheninsel mit Holzarbeitsplatte, perspektivisch",
        "BORA Pure Rough in a dark kitchen island with wooden worktop, perspective view",
        "BORA Pure Rough dans un îlot de cuisine sombre avec plan en bois, vue en perspective",
        "BORA Pure Rough in un’isola scura con piano in legno, vista prospettica"
      ), "https://www.bora.com/de-at/kochfeldabzugssysteme", "ambiente"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T(
          "Ausführung",
          "Version",
          "Version",
          "Versione"
        ),
        optionen: Object.freeze([
          opt("pura2", T(
            "Abluft, Glaskeramik glänzend",
            "Ducted, gloss glass ceramic",
            "Évacuation extérieure, vitrocéramique brillante",
            "Aspirante, vetroceramica lucida"
          ), "PURA2", "/Images/Wellness/produkte/bora/bora-pure-1.webp", true),
          opt("pura2r", T(
            "Abluft, Glaskeramik matt (Rough)",
            "Ducted, matt glass ceramic (Rough)",
            "Évacuation extérieure, vitrocéramique mate (Rough)",
            "Aspirante, vetroceramica opaca (Rough)"
          ), "PURA2R", "/Images/Wellness/produkte/bora/bora-pure-2.webp", false),
          opt("puru2", T(
            "Umluft, Glaskeramik glänzend",
            "Recirculation, gloss glass ceramic",
            "Recyclage, vitrocéramique brillante",
            "Filtrante, vetroceramica lucida"
          ), "PURU2", "/Images/Wellness/produkte/bora/bora-pure-1.webp", false),
          opt("puru2r", T(
            "Umluft, Glaskeramik matt (Rough)",
            "Recirculation, matt glass ceramic (Rough)",
            "Recyclage, vitrocéramique mate (Rough)",
            "Filtrante, vetroceramica opaca (Rough)"
          ), "PURU2R", "/Images/Wellness/produkte/bora/bora-pure-1.webp", false),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.bora.com/de-at/kochfeldabzugssysteme/pure-pura2",
    quellen: Object.freeze(["https://www.bora.com/de-at/kochfeldabzugssysteme/pure-pura2","https://www.bora.com/de-at/kochfeldabzugssysteme/pure-pura2r","https://www.bora.com/de-at/kochfeldabzugssysteme/pure-puru2","https://www.bora.com/de-at/kochfeldabzugssysteme/pure-puru2r","https://www.bora.com/de-at/kochfeldabzugssysteme/pure","https://www.bora.com/de-at/kochfeldabzugssysteme"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "bora-s-pure",
    marke: "bora",
    bereich: "kueche",
    kategorie: "kochfeld-mit-abzug",
    name: "BORA S Pure",
    serie: "BORA S Pure",
    kurz: T(
      "Kompaktsystem von BORA: Kochfeld (Induktion und Flächeninduktion) mit integriertem Kochfeldabzug, 4 Kochzonen, 580 mm breit; als Abluft- oder Umluftvariante, Glaskeramik glänzend oder matt. Für 60 cm Einbaubreite, flächenbündig oder mit Kochfeldrahmen einbaubar.",
      "BORA compact system: hob (induction and full-surface induction) with integrated cooktop extractor, 4 cooking zones, 580 mm wide; available for ducted extraction or recirculation, with gloss or matt glass ceramic. For a 60 cm installation width, flush-mounted or with a hob frame.",
      "Système compact BORA : table de cuisson (induction et induction pleine surface) avec aspiration intégrée, 4 zones de cuisson, 580 mm de large ; en évacuation extérieure ou en recyclage, vitrocéramique brillante ou mate. Pour une largeur d’encastrement de 60 cm, à fleur ou avec cadre.",
      "Sistema compatto BORA: piano cottura (induzione e induzione a superficie totale) con aspiratore integrato, 4 zone di cottura, largo 580 mm; in versione aspirante o filtrante, vetroceramica lucida o opaca. Per una larghezza d’incasso di 60 cm, a filo o con cornice."
    ),
    merkmale: Object.freeze([
      T(
        "Kochfeldart: Induktion und Flächeninduktion, 4 Kochzonen",
        "Hob type: induction and full-surface induction, 4 cooking zones",
        "Type de table : induction et induction pleine surface, 4 zones de cuisson",
        "Tipo di piano: induzione e induzione a superficie totale, 4 zone di cottura"
      ),
      T(
        "Kochzonen: Ø 95 mm / 230 × 230 mm / Ø 140 mm / 230 × 230 mm",
        "Cooking zones: Ø 95 mm / 230 × 230 mm / Ø 140 mm / 230 × 230 mm",
        "Zones de cuisson : Ø 95 mm / 230 × 230 mm / Ø 140 mm / 230 × 230 mm",
        "Zone di cottura: Ø 95 mm / 230 × 230 mm / Ø 140 mm / 230 × 230 mm"
      ),
      T(
        "9 Leistungsstufen des Kochfeldabzugs",
        "9 extractor power levels",
        "9 niveaux de puissance de l’aspiration",
        "9 livelli di potenza dell’aspirazione"
      ),
      T(
        "Kanalanschluss Ecotube",
        "Duct connection Ecotube",
        "Raccordement de gaine Ecotube",
        "Raccordo canale Ecotube"
      ),
      T(
        "Leistungsaufnahme max. 7360 W",
        "Max. power consumption 7360 W",
        "Puissance absorbée max. 7360 W",
        "Potenza assorbita max. 7360 W"
      ),
      T(
        "Funktionen: BORA Assist, Kaffeefunktion, Powerstufe, automatische Abzugssteuerung, Nachlaufautomatik, Topferkennung, Brückenfunktion, Kochzonen-Timer, Kurzzeitwecker, Pausefunktion",
        "Functions: BORA Assist, coffee function, power level, automatic extractor control, automatic run-on, pan detection, bridge function, cooking zone timer, kitchen timer, pause function",
        "Fonctions : BORA Assist, fonction café, niveau Power, commande automatique de l’aspiration, temporisation automatique, détection des récipients, fonction pont, minuterie par zone, minuteur, fonction pause",
        "Funzioni: BORA Assist, funzione caffè, livello Power, controllo automatico dell’aspirazione, funzionamento residuo automatico, riconoscimento pentole, funzione ponte, timer per zona di cottura, contaminuti, funzione pausa"
      ),
    ]),
    masse: Object.freeze([mass("breite", "580 mm"), mass("hoehe", "199 mm"), mass("tiefe", "515 mm"), mass("gewicht", "14,1 kg")]),
    bilder: Object.freeze([
      bild("bora-s-pure-1.webp", 1152, 864, T(
        "BORA BORA S Pure (PURSA2): Produktansicht vor hellem Hintergrund",
        "BORA BORA S Pure (PURSA2): product view on a light background",
        "BORA BORA S Pure (PURSA2) : vue du produit sur fond clair",
        "BORA BORA S Pure (PURSA2): vista del prodotto su fondo chiaro"
      ), "https://www.bora.com/de-at/kochfeldabzugssysteme/s-pure-pursa2"),
      bild("bora-s-pure-2.webp", 1152, 864, T(
        "BORA BORA S Pure (PURSA2R): Produktansicht vor hellem Hintergrund",
        "BORA BORA S Pure (PURSA2R): product view on a light background",
        "BORA BORA S Pure (PURSA2R) : vue du produit sur fond clair",
        "BORA BORA S Pure (PURSA2R): vista del prodotto su fondo chiaro"
      ), "https://www.bora.com/de-at/kochfeldabzugssysteme/s-pure-pursa2r"),
      bild("bora-ambiente-spure.webp", 960, 539, T(
        "BORA S Pure Rough eingebaut in eine Küchenzeile mit grünen Fronten, Grillpfanne und Espressokanne",
        "BORA S Pure Rough installed in a kitchen run with green fronts, grill pan and espresso pot",
        "BORA S Pure Rough encastré dans une cuisine aux façades vertes, poêle gril et cafetière",
        "BORA S Pure Rough incassato in una cucina con ante verdi, bistecchiera e caffettiera"
      ), "https://www.bora.com/de-at/kochfeldabzugssysteme", "ambiente"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T(
          "Ausführung",
          "Version",
          "Version",
          "Versione"
        ),
        optionen: Object.freeze([
          opt("pursa2", T(
            "Abluft, Glaskeramik glänzend",
            "Ducted, gloss glass ceramic",
            "Évacuation extérieure, vitrocéramique brillante",
            "Aspirante, vetroceramica lucida"
          ), "PURSA2", "/Images/Wellness/produkte/bora/bora-s-pure-1.webp", true),
          opt("pursa2r", T(
            "Abluft, Glaskeramik matt (Rough)",
            "Ducted, matt glass ceramic (Rough)",
            "Évacuation extérieure, vitrocéramique mate (Rough)",
            "Aspirante, vetroceramica opaca (Rough)"
          ), "PURSA2R", "/Images/Wellness/produkte/bora/bora-s-pure-2.webp", false),
          opt("pursu2", T(
            "Umluft, Glaskeramik glänzend",
            "Recirculation, gloss glass ceramic",
            "Recyclage, vitrocéramique brillante",
            "Filtrante, vetroceramica lucida"
          ), "PURSU2", "/Images/Wellness/produkte/bora/bora-s-pure-1.webp", false),
          opt("pursu2r", T(
            "Umluft, Glaskeramik matt (Rough)",
            "Recirculation, matt glass ceramic (Rough)",
            "Recyclage, vitrocéramique mate (Rough)",
            "Filtrante, vetroceramica opaca (Rough)"
          ), "PURSU2R", "/Images/Wellness/produkte/bora/bora-s-pure-2.webp", false),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.bora.com/de-at/kochfeldabzugssysteme/s-pure-pursa2",
    quellen: Object.freeze(["https://www.bora.com/de-at/kochfeldabzugssysteme/s-pure-pursa2","https://www.bora.com/de-at/kochfeldabzugssysteme/s-pure-pursa2r","https://www.bora.com/de-at/kochfeldabzugssysteme/s-pure-pursu2","https://www.bora.com/de-at/kochfeldabzugssysteme/s-pure-pursu2r","https://www.bora.com/de-at/kochfeldabzugssysteme/s-pure","https://www.bora.com/de-at/kochfeldabzugssysteme"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "bora-basic",
    marke: "bora",
    bereich: "kueche",
    kategorie: "kochfeld-mit-abzug",
    name: "BORA Basic",
    serie: "BORA Basic",
    kurz: T(
      "Kompaktsystem von BORA: Hyper-Kochfeld mit Strahlheizkörpern und integriertem Kochfeldabzug, 4 Kochzonen, 760 mm breit; als Abluft- oder Umluftvariante.",
      "BORA compact system: Hyper radiant hob with integrated cooktop extractor, 4 cooking zones, 760 mm wide; for ducted extraction or recirculation.",
      "Système compact BORA : table Hyper à foyers radiants avec aspiration intégrée, 4 zones de cuisson, 760 mm de large ; en évacuation extérieure ou en recyclage.",
      "Sistema compatto BORA: piano Hyper con elementi radianti e aspiratore integrato, 4 zone di cottura, largo 760 mm; in versione aspirante o filtrante."
    ),
    merkmale: Object.freeze([
      T(
        "Kochfeldart: Strahlheizkörper, 4 Kochzonen",
        "Hob type: radiant heating, 4 cooking zones",
        "Type de table : foyers radiants, 4 zones de cuisson",
        "Tipo di piano: elementi radianti, 4 zone di cottura"
      ),
      T(
        "Kochzonen: Ø 210 mm / Ø 210 mm / Ø 140 mm / Ø 140 mm",
        "Cooking zones: Ø 210 mm / Ø 210 mm / Ø 140 mm / Ø 140 mm",
        "Zones de cuisson : Ø 210 mm / Ø 210 mm / Ø 140 mm / Ø 140 mm",
        "Zone di cottura: Ø 210 mm / Ø 210 mm / Ø 140 mm / Ø 140 mm"
      ),
      T(
        "2 Leistungsstufen des Kochfeldabzugs",
        "2 extractor power levels",
        "2 niveaux de puissance de l’aspiration",
        "2 livelli di potenza dell’aspirazione"
      ),
      T(
        "Kanalanschluss Ecotube",
        "Duct connection Ecotube",
        "Raccordement de gaine Ecotube",
        "Raccordo canale Ecotube"
      ),
      T(
        "Leistungsaufnahme max. 7000 W",
        "Max. power consumption 7000 W",
        "Puissance absorbée max. 7000 W",
        "Potenza assorbita max. 7000 W"
      ),
    ]),
    masse: Object.freeze([mass("breite", "760 mm"), mass("hoehe", "196 mm"), mass("tiefe", "515 mm"), mass("gewicht", "18,72 kg")]),
    bilder: Object.freeze([
      bild("bora-basic-1.webp", 1152, 864, T(
        "BORA BORA Basic (BHA): Produktansicht vor hellem Hintergrund",
        "BORA BORA Basic (BHA): product view on a light background",
        "BORA BORA Basic (BHA) : vue du produit sur fond clair",
        "BORA BORA Basic (BHA): vista del prodotto su fondo chiaro"
      ), "https://www.bora.com/de-at/kochfeldabzugssysteme/basic-bha"),
      bild("bora-ambiente-basic.webp", 960, 640, T(
        "BORA Basic eingebaut in eine helle Arbeitsplatte mit Töpfen und Pfanne",
        "BORA Basic installed in a light worktop with pots and pan",
        "BORA Basic encastré dans un plan de travail clair avec casseroles et poêle",
        "BORA Basic incassato in un piano di lavoro chiaro con pentole e padella"
      ), "https://www.bora.com/de-at/kochfeldabzugssysteme", "ambiente"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T(
          "Ausführung",
          "Version",
          "Version",
          "Versione"
        ),
        optionen: Object.freeze([
          opt("bha", T(
            "Abluft",
            "Ducted extraction",
            "Évacuation extérieure",
            "Aspirante"
          ), "BHA", "/Images/Wellness/produkte/bora/bora-basic-1.webp", true),
          opt("bhu", T(
            "Umluft",
            "Recirculation",
            "Recyclage",
            "Filtrante"
          ), "BHU", "/Images/Wellness/produkte/bora/bora-basic-1.webp", false),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.bora.com/de-at/kochfeldabzugssysteme/basic-bha",
    quellen: Object.freeze(["https://www.bora.com/de-at/kochfeldabzugssysteme/basic-bha","https://www.bora.com/de-at/kochfeldabzugssysteme/basic-bhu","https://www.bora.com/de-at/kochfeldabzugssysteme/basic","https://www.bora.com/de-at/kochfeldabzugssysteme"]),
    stand: STAND,
  }),
  // ---------------------------------------------------------------- kochfeld
  Object.freeze({
    slug: "bora-pkc3",
    marke: "bora",
    bereich: "kueche",
    kategorie: "kochfeld",
    name: "Pro HiLight-Kochfeld 3-Kreis/2-Kreis",
    serie: "Professional 3.0",
    kurz: T(
      "Kochfeld (Strahlheizkörper) mit 2 Kochzonen aus dem BORA Modularsystem Professional 3.0; wird mit dem Kochfeldabzug der Serie kombiniert, die Anordnung ist laut Hersteller frei wählbar.",
      "Hob (radiant heating) with 2 cooking zones from the BORA Professional 3.0 modular system; combined with the series’ cooktop extractor, the layout can be chosen freely according to the manufacturer.",
      "Table de cuisson (foyers radiants) à 2 zones du système modulaire BORA Professional 3.0 ; elle se combine avec l’aspiration de la gamme, la disposition est libre selon le fabricant.",
      "Piano cottura (elementi radianti) con 2 zone del sistema modulare BORA Professional 3.0; si abbina all’aspiratore della serie, la disposizione è libera secondo il produttore."
    ),
    merkmale: Object.freeze([
      T(
        "Kochfeldart: Strahlheizkörper, 2 Kochzonen",
        "Hob type: radiant heating, 2 cooking zones",
        "Type de table : foyers radiants, 2 zones de cuisson",
        "Tipo di piano: elementi radianti, 2 zone di cottura"
      ),
      T(
        "Kochzonen: 120 / 180 / 235 mm / 120 / 200 mm",
        "Cooking zones: 120 / 180 / 235 mm / 120 / 200 mm",
        "Zones de cuisson : 120 / 180 / 235 mm / 120 / 200 mm",
        "Zone di cottura: 120 / 180 / 235 mm / 120 / 200 mm"
      ),
      T(
        "Leistungsaufnahme max. 4400 W",
        "Max. power consumption 4400 W",
        "Puissance absorbée max. 4400 W",
        "Potenza assorbita max. 4400 W"
      ),
      T(
        "Funktionen: Kochzonen-Timer, Pausefunktion, variable Warmhaltefunktion, Ankochautomatik",
        "Functions: cooking zone timer, pause function, variable keep-warm function, automatic boost start",
        "Fonctions : minuterie par zone, fonction pause, maintien au chaud variable, démarrage automatique de cuisson",
        "Funzioni: timer per zona di cottura, funzione pausa, funzione di mantenimento in caldo variabile, avvio automatico di cottura"
      ),
      T(
        "Anordnung der Kochfelder laut Hersteller individuell wählbar",
        "Hob layout can be chosen individually according to the manufacturer",
        "Disposition des tables librement choisie selon le fabricant",
        "Disposizione dei piani scelta liberamente secondo il produttore"
      ),
    ]),
    masse: Object.freeze([mass("breite", "370 mm"), mass("hoehe", "73 mm"), mass("tiefe", "540 mm"), mass("gewicht", "8,61 kg")]),
    bilder: Object.freeze([
      bild("bora-pkc3-1.webp", 1152, 864, T(
        "BORA Pro HiLight-Kochfeld 3-Kreis/2-Kreis (PKC3): Produktansicht vor hellem Hintergrund",
        "BORA Pro HiLight-Kochfeld 3-Kreis/2-Kreis (PKC3): product view on a light background",
        "BORA Pro HiLight-Kochfeld 3-Kreis/2-Kreis (PKC3) : vue du produit sur fond clair",
        "BORA Pro HiLight-Kochfeld 3-Kreis/2-Kreis (PKC3): vista del prodotto su fondo chiaro"
      ), "https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0-pkc3"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T(
          "Ausführung",
          "Version",
          "Version",
          "Versione"
        ),
        optionen: Object.freeze([
          opt("pkc3", T(
            "Standard (Edelstahl)",
            "Standard (stainless steel)",
            "Standard (inox)",
            "Standard (acciaio inox)"
          ), "PKC3", "/Images/Wellness/produkte/bora/bora-pkc3-1.webp", true),
          opt("pkc3ab", T(
            "All Black",
            "All Black",
            "All Black",
            "All Black"
          ), "PKC3AB", "/Images/Wellness/produkte/bora/bora-pkc3-1.webp", false),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0-pkc3",
    quellen: Object.freeze(["https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0-pkc3","https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0-pkc3ab","https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0"]),
    stand: STAND,
    verwandt: Object.freeze(["bora-pka3","bora-pkas3"]),
  }),
  Object.freeze({
    slug: "bora-pkcb3",
    marke: "bora",
    bereich: "kueche",
    kategorie: "kochfeld",
    name: "Pro HiLight-Kochfeld 3-Kreis/Bräter",
    serie: "Professional 3.0",
    kurz: T(
      "Kochfeld (Strahlheizkörper) mit 2 Kochzonen aus dem BORA Modularsystem Professional 3.0; wird mit dem Kochfeldabzug der Serie kombiniert, die Anordnung ist laut Hersteller frei wählbar.",
      "Hob (radiant heating) with 2 cooking zones from the BORA Professional 3.0 modular system; combined with the series’ cooktop extractor, the layout can be chosen freely according to the manufacturer.",
      "Table de cuisson (foyers radiants) à 2 zones du système modulaire BORA Professional 3.0 ; elle se combine avec l’aspiration de la gamme, la disposition est libre selon le fabricant.",
      "Piano cottura (elementi radianti) con 2 zone del sistema modulare BORA Professional 3.0; si abbina all’aspiratore della serie, la disposizione è libera secondo il produttore."
    ),
    merkmale: Object.freeze([
      T(
        "Kochfeldart: Strahlheizkörper, 2 Kochzonen",
        "Hob type: radiant heating, 2 cooking zones",
        "Type de table : foyers radiants, 2 zones de cuisson",
        "Tipo di piano: elementi radianti, 2 zone di cottura"
      ),
      T(
        "Kochzonen: 120 / 180 / 235 mm / 165 / 290 × 165 mm",
        "Cooking zones: 120 / 180 / 235 mm / 165 / 290 × 165 mm",
        "Zones de cuisson : 120 / 180 / 235 mm / 165 / 290 × 165 mm",
        "Zone di cottura: 120 / 180 / 235 mm / 165 / 290 × 165 mm"
      ),
      T(
        "Leistungsaufnahme max. 5100 W",
        "Max. power consumption 5100 W",
        "Puissance absorbée max. 5100 W",
        "Potenza assorbita max. 5100 W"
      ),
      T(
        "Funktionen: Kochzonen-Timer, Pausefunktion, variable Warmhaltefunktion, Ankochautomatik",
        "Functions: cooking zone timer, pause function, variable keep-warm function, automatic boost start",
        "Fonctions : minuterie par zone, fonction pause, maintien au chaud variable, démarrage automatique de cuisson",
        "Funzioni: timer per zona di cottura, funzione pausa, funzione di mantenimento in caldo variabile, avvio automatico di cottura"
      ),
      T(
        "Anordnung der Kochfelder laut Hersteller individuell wählbar",
        "Hob layout can be chosen individually according to the manufacturer",
        "Disposition des tables librement choisie selon le fabricant",
        "Disposizione dei piani scelta liberamente secondo il produttore"
      ),
    ]),
    masse: Object.freeze([mass("breite", "370 mm"), mass("hoehe", "73 mm"), mass("tiefe", "540 mm"), mass("gewicht", "8,94 kg")]),
    bilder: Object.freeze([
      bild("bora-pkcb3-1.webp", 1152, 864, T(
        "BORA Pro HiLight-Kochfeld 3-Kreis/Bräter (PKCB3): Produktansicht vor hellem Hintergrund",
        "BORA Pro HiLight-Kochfeld 3-Kreis/Bräter (PKCB3): product view on a light background",
        "BORA Pro HiLight-Kochfeld 3-Kreis/Bräter (PKCB3) : vue du produit sur fond clair",
        "BORA Pro HiLight-Kochfeld 3-Kreis/Bräter (PKCB3): vista del prodotto su fondo chiaro"
      ), "https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0-pkcb3"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T(
          "Ausführung",
          "Version",
          "Version",
          "Versione"
        ),
        optionen: Object.freeze([
          opt("pkcb3", T(
            "Standard (Edelstahl)",
            "Standard (stainless steel)",
            "Standard (inox)",
            "Standard (acciaio inox)"
          ), "PKCB3", "/Images/Wellness/produkte/bora/bora-pkcb3-1.webp", true),
          opt("pkcb3ab", T(
            "All Black",
            "All Black",
            "All Black",
            "All Black"
          ), "PKCB3AB", "/Images/Wellness/produkte/bora/bora-pkcb3-1.webp", false),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0-pkcb3",
    quellen: Object.freeze(["https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0-pkcb3","https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0-pkcb3ab","https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0"]),
    stand: STAND,
    verwandt: Object.freeze(["bora-pka3","bora-pkas3"]),
  }),
  Object.freeze({
    slug: "bora-pkch3",
    marke: "bora",
    bereich: "kueche",
    kategorie: "kochfeld",
    name: "Pro Hyper-Kochfeld 1-Kreis/2-Kreis",
    serie: "Professional 3.0",
    kurz: T(
      "Kochfeld (Strahlheizkörper) mit 2 Kochzonen aus dem BORA Modularsystem Professional 3.0; wird mit dem Kochfeldabzug der Serie kombiniert, die Anordnung ist laut Hersteller frei wählbar.",
      "Hob (radiant heating) with 2 cooking zones from the BORA Professional 3.0 modular system; combined with the series’ cooktop extractor, the layout can be chosen freely according to the manufacturer.",
      "Table de cuisson (foyers radiants) à 2 zones du système modulaire BORA Professional 3.0 ; elle se combine avec l’aspiration de la gamme, la disposition est libre selon le fabricant.",
      "Piano cottura (elementi radianti) con 2 zone del sistema modulare BORA Professional 3.0; si abbina all’aspiratore della serie, la disposizione è libera secondo il produttore."
    ),
    merkmale: Object.freeze([
      T(
        "Kochfeldart: Strahlheizkörper, 2 Kochzonen",
        "Hob type: radiant heating, 2 cooking zones",
        "Type de table : foyers radiants, 2 zones de cuisson",
        "Tipo di piano: elementi radianti, 2 zone di cottura"
      ),
      T(
        "Kochzonen: 235 mm / 120 / 200 mm",
        "Cooking zones: 235 mm / 120 / 200 mm",
        "Zones de cuisson : 235 mm / 120 / 200 mm",
        "Zone di cottura: 235 mm / 120 / 200 mm"
      ),
      T(
        "Leistungsaufnahme max. 5100 W",
        "Max. power consumption 5100 W",
        "Puissance absorbée max. 5100 W",
        "Potenza assorbita max. 5100 W"
      ),
      T(
        "Funktionen: Powerstufe, Kochzonen-Timer, Pausefunktion, variable Warmhaltefunktion, Ankochautomatik",
        "Functions: power level, cooking zone timer, pause function, variable keep-warm function, automatic boost start",
        "Fonctions : niveau Power, minuterie par zone, fonction pause, maintien au chaud variable, démarrage automatique de cuisson",
        "Funzioni: livello Power, timer per zona di cottura, funzione pausa, funzione di mantenimento in caldo variabile, avvio automatico di cottura"
      ),
      T(
        "Anordnung der Kochfelder laut Hersteller individuell wählbar",
        "Hob layout can be chosen individually according to the manufacturer",
        "Disposition des tables librement choisie selon le fabricant",
        "Disposizione dei piani scelta liberamente secondo il produttore"
      ),
    ]),
    masse: Object.freeze([mass("breite", "370 mm"), mass("hoehe", "73 mm"), mass("tiefe", "540 mm"), mass("gewicht", "8,53 kg")]),
    bilder: Object.freeze([
      bild("bora-pkch3-1.webp", 1152, 864, T(
        "BORA Pro Hyper-Kochfeld 1-Kreis/2-Kreis (PKCH3): Produktansicht vor hellem Hintergrund",
        "BORA Pro Hyper-Kochfeld 1-Kreis/2-Kreis (PKCH3): product view on a light background",
        "BORA Pro Hyper-Kochfeld 1-Kreis/2-Kreis (PKCH3) : vue du produit sur fond clair",
        "BORA Pro Hyper-Kochfeld 1-Kreis/2-Kreis (PKCH3): vista del prodotto su fondo chiaro"
      ), "https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0-pkch3"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T(
          "Ausführung",
          "Version",
          "Version",
          "Versione"
        ),
        optionen: Object.freeze([
          opt("pkch3", T(
            "Standard (Edelstahl)",
            "Standard (stainless steel)",
            "Standard (inox)",
            "Standard (acciaio inox)"
          ), "PKCH3", "/Images/Wellness/produkte/bora/bora-pkch3-1.webp", true),
          opt("pkch3ab", T(
            "All Black",
            "All Black",
            "All Black",
            "All Black"
          ), "PKCH3AB", "/Images/Wellness/produkte/bora/bora-pkch3-1.webp", false),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0-pkch3",
    quellen: Object.freeze(["https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0-pkch3","https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0-pkch3ab","https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0"]),
    stand: STAND,
    verwandt: Object.freeze(["bora-pka3","bora-pkas3"]),
  }),
  Object.freeze({
    slug: "bora-pkfi3",
    marke: "bora",
    bereich: "kueche",
    kategorie: "kochfeld",
    name: "Pro Flächeninduktions-Kochfeld",
    serie: "Professional 3.0",
    kurz: T(
      "Kochfeld (Flächeninduktion) mit 2 Kochzonen aus dem BORA Modularsystem Professional 3.0; wird mit dem Kochfeldabzug der Serie kombiniert, die Anordnung ist laut Hersteller frei wählbar.",
      "Hob (full-surface induction) with 2 cooking zones from the BORA Professional 3.0 modular system; combined with the series’ cooktop extractor, the layout can be chosen freely according to the manufacturer.",
      "Table de cuisson (induction pleine surface) à 2 zones du système modulaire BORA Professional 3.0 ; elle se combine avec l’aspiration de la gamme, la disposition est libre selon le fabricant.",
      "Piano cottura (induzione a superficie totale) con 2 zone del sistema modulare BORA Professional 3.0; si abbina all’aspiratore della serie, la disposizione è libera secondo il produttore."
    ),
    merkmale: Object.freeze([
      T(
        "Kochfeldart: Flächeninduktion, 2 Kochzonen",
        "Hob type: full-surface induction, 2 cooking zones",
        "Type de table : induction pleine surface, 2 zones de cuisson",
        "Tipo di piano: induzione a superficie totale, 2 zone di cottura"
      ),
      T(
        "Kochzonen: 230 × 230 mm / 230 × 230 mm",
        "Cooking zones: 230 × 230 mm / 230 × 230 mm",
        "Zones de cuisson : 230 × 230 mm / 230 × 230 mm",
        "Zone di cottura: 230 × 230 mm / 230 × 230 mm"
      ),
      T(
        "Leistungsaufnahme max. 3680 W",
        "Max. power consumption 3680 W",
        "Puissance absorbée max. 3680 W",
        "Potenza assorbita max. 3680 W"
      ),
      T(
        "Funktionen: Powerstufe, Kochzonen-Timer, variable Warmhaltefunktion, Brückenfunktion, Pausefunktion, Ankochautomatik, Topferkennung",
        "Functions: power level, cooking zone timer, variable keep-warm function, bridge function, pause function, automatic boost start, pan detection",
        "Fonctions : niveau Power, minuterie par zone, maintien au chaud variable, fonction pont, fonction pause, démarrage automatique de cuisson, détection des récipients",
        "Funzioni: livello Power, timer per zona di cottura, funzione di mantenimento in caldo variabile, funzione ponte, funzione pausa, avvio automatico di cottura, riconoscimento pentole"
      ),
      T(
        "Anordnung der Kochfelder laut Hersteller individuell wählbar",
        "Hob layout can be chosen individually according to the manufacturer",
        "Disposition des tables librement choisie selon le fabricant",
        "Disposizione dei piani scelta liberamente secondo il produttore"
      ),
    ]),
    masse: Object.freeze([mass("breite", "370 mm"), mass("hoehe", "52 mm"), mass("tiefe", "540 mm"), mass("gewicht", "7,85 kg")]),
    bilder: Object.freeze([
      bild("bora-pkfi3-1.webp", 1152, 864, T(
        "BORA Pro Flächeninduktions-Kochfeld (PKFI3): Produktansicht vor hellem Hintergrund",
        "BORA Pro Flächeninduktions-Kochfeld (PKFI3): product view on a light background",
        "BORA Pro Flächeninduktions-Kochfeld (PKFI3) : vue du produit sur fond clair",
        "BORA Pro Flächeninduktions-Kochfeld (PKFI3): vista del prodotto su fondo chiaro"
      ), "https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0-pkfi3"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T(
          "Ausführung",
          "Version",
          "Version",
          "Versione"
        ),
        optionen: Object.freeze([
          opt("pkfi3", T(
            "Standard, Glaskeramik glänzend",
            "Standard, gloss glass ceramic",
            "Standard, vitrocéramique brillante",
            "Standard, vetroceramica lucida"
          ), "PKFI3", "/Images/Wellness/produkte/bora/bora-pkfi3-1.webp", true),
          opt("pkfi3r", T(
            "Rough, Glaskeramik matt",
            "Rough, matt glass ceramic",
            "Rough, vitrocéramique mate",
            "Rough, vetroceramica opaca"
          ), "PKFI3R", "/Images/Wellness/produkte/bora/bora-pkfi3-1.webp", false),
          opt("pkfi3ab", T(
            "All Black, Glaskeramik glänzend",
            "All Black, gloss glass ceramic",
            "All Black, vitrocéramique brillante",
            "All Black, vetroceramica lucida"
          ), "PKFI3AB", "/Images/Wellness/produkte/bora/bora-pkfi3-1.webp", false),
          opt("pkfi3abr", T(
            "All Black Rough, Glaskeramik matt",
            "All Black Rough, matt glass ceramic",
            "All Black Rough, vitrocéramique mate",
            "All Black Rough, vetroceramica opaca"
          ), "PKFI3ABR", "/Images/Wellness/produkte/bora/bora-pkfi3-1.webp", false),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0-pkfi3",
    quellen: Object.freeze(["https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0-pkfi3","https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0-pkfi3r","https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0-pkfi3ab","https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0-pkfi3abr","https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0"]),
    stand: STAND,
    verwandt: Object.freeze(["bora-pka3","bora-pkas3"]),
  }),
  Object.freeze({
    slug: "bora-pkg3",
    marke: "bora",
    bereich: "kueche",
    kategorie: "kochfeld",
    name: "Pro Gas-Kochfeld",
    serie: "Professional 3.0",
    kurz: T(
      "Kochfeld (Gas) mit 2 Kochzonen aus dem BORA Modularsystem Professional 3.0; wird mit dem Kochfeldabzug der Serie kombiniert, die Anordnung ist laut Hersteller frei wählbar.",
      "Hob (gas) with 2 cooking zones from the BORA Professional 3.0 modular system; combined with the series’ cooktop extractor, the layout can be chosen freely according to the manufacturer.",
      "Table de cuisson (gaz) à 2 zones du système modulaire BORA Professional 3.0 ; elle se combine avec l’aspiration de la gamme, la disposition est libre selon le fabricant.",
      "Piano cottura (gas) con 2 zone del sistema modulare BORA Professional 3.0; si abbina all’aspiratore della serie, la disposizione è libera secondo il produttore."
    ),
    merkmale: Object.freeze([
      T(
        "Kochfeldart: Gas, 2 Kochzonen",
        "Hob type: gas, 2 cooking zones",
        "Type de table : gaz, 2 zones de cuisson",
        "Tipo di piano: gas, 2 zone di cottura"
      ),
      T(
        "Kochzonen: 240 mm / 200 mm",
        "Cooking zones: 240 mm / 200 mm",
        "Zones de cuisson : 240 mm / 200 mm",
        "Zone di cottura: 240 mm / 200 mm"
      ),
      T(
        "Leistungsaufnahme max. 5000 W",
        "Max. power consumption 5000 W",
        "Puissance absorbée max. 5000 W",
        "Potenza assorbita max. 5000 W"
      ),
      T(
        "Funktionen: Powerstufe, Kochzonen-Timer, variable Warmhaltefunktion, Pausefunktion, elektronische Regelung",
        "Functions: power level, cooking zone timer, variable keep-warm function, pause function, electronic control",
        "Fonctions : niveau Power, minuterie par zone, maintien au chaud variable, fonction pause, régulation électronique",
        "Funzioni: livello Power, timer per zona di cottura, funzione di mantenimento in caldo variabile, funzione pausa, regolazione elettronica"
      ),
      T(
        "Anordnung der Kochfelder laut Hersteller individuell wählbar",
        "Hob layout can be chosen individually according to the manufacturer",
        "Disposition des tables librement choisie selon le fabricant",
        "Disposizione dei piani scelta liberamente secondo il produttore"
      ),
    ]),
    masse: Object.freeze([mass("breite", "370 mm"), mass("hoehe", "73 mm"), mass("tiefe", "540 mm"), mass("gewicht", "11,85 kg")]),
    bilder: Object.freeze([
      bild("bora-pkg3-1.webp", 1152, 864, T(
        "BORA Pro Gas-Kochfeld (PKG3): Produktansicht vor hellem Hintergrund",
        "BORA Pro Gas-Kochfeld (PKG3): product view on a light background",
        "BORA Pro Gas-Kochfeld (PKG3) : vue du produit sur fond clair",
        "BORA Pro Gas-Kochfeld (PKG3): vista del prodotto su fondo chiaro"
      ), "https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0-pkg3"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T(
          "Ausführung",
          "Version",
          "Version",
          "Versione"
        ),
        optionen: Object.freeze([
          opt("pkg3", T(
            "Standard (Edelstahl)",
            "Standard (stainless steel)",
            "Standard (inox)",
            "Standard (acciaio inox)"
          ), "PKG3", "/Images/Wellness/produkte/bora/bora-pkg3-1.webp", true),
          opt("pkg3ab", T(
            "All Black",
            "All Black",
            "All Black",
            "All Black"
          ), "PKG3AB", "/Images/Wellness/produkte/bora/bora-pkg3-1.webp", false),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0-pkg3",
    quellen: Object.freeze(["https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0-pkg3","https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0-pkg3ab","https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0"]),
    stand: STAND,
    verwandt: Object.freeze(["bora-pka3","bora-pkas3"]),
  }),
  Object.freeze({
    slug: "bora-pki3",
    marke: "bora",
    bereich: "kueche",
    kategorie: "kochfeld",
    name: "Pro Induktions-Kochfeld",
    serie: "Professional 3.0",
    kurz: T(
      "Kochfeld (Induktion) mit 2 Kochzonen aus dem BORA Modularsystem Professional 3.0; wird mit dem Kochfeldabzug der Serie kombiniert, die Anordnung ist laut Hersteller frei wählbar.",
      "Hob (induction) with 2 cooking zones from the BORA Professional 3.0 modular system; combined with the series’ cooktop extractor, the layout can be chosen freely according to the manufacturer.",
      "Table de cuisson (induction) à 2 zones du système modulaire BORA Professional 3.0 ; elle se combine avec l’aspiration de la gamme, la disposition est libre selon le fabricant.",
      "Piano cottura (induzione) con 2 zone del sistema modulare BORA Professional 3.0; si abbina all’aspiratore della serie, la disposizione è libera secondo il produttore."
    ),
    merkmale: Object.freeze([
      T(
        "Kochfeldart: Induktion, 2 Kochzonen",
        "Hob type: induction, 2 cooking zones",
        "Type de table : induction, 2 zones de cuisson",
        "Tipo di piano: induzione, 2 zone di cottura"
      ),
      T(
        "Kochzonen: 230 mm / 165 mm",
        "Cooking zones: 230 mm / 165 mm",
        "Zones de cuisson : 230 mm / 165 mm",
        "Zone di cottura: 230 mm / 165 mm"
      ),
      T(
        "Leistungsaufnahme max. 3680 W",
        "Max. power consumption 3680 W",
        "Puissance absorbée max. 3680 W",
        "Potenza assorbita max. 3680 W"
      ),
      T(
        "Funktionen: Powerstufe, Kochzonen-Timer, Pausefunktion, variable Warmhaltefunktion, Ankochautomatik, Topferkennung",
        "Functions: power level, cooking zone timer, pause function, variable keep-warm function, automatic boost start, pan detection",
        "Fonctions : niveau Power, minuterie par zone, fonction pause, maintien au chaud variable, démarrage automatique de cuisson, détection des récipients",
        "Funzioni: livello Power, timer per zona di cottura, funzione pausa, funzione di mantenimento in caldo variabile, avvio automatico di cottura, riconoscimento pentole"
      ),
      T(
        "Anordnung der Kochfelder laut Hersteller individuell wählbar",
        "Hob layout can be chosen individually according to the manufacturer",
        "Disposition des tables librement choisie selon le fabricant",
        "Disposizione dei piani scelta liberamente secondo il produttore"
      ),
    ]),
    masse: Object.freeze([mass("breite", "370 mm"), mass("hoehe", "52 mm"), mass("tiefe", "540 mm"), mass("gewicht", "7,44 kg")]),
    bilder: Object.freeze([
      bild("bora-pki3-1.webp", 1152, 864, T(
        "BORA Pro Induktions-Kochfeld (PKI3): Produktansicht vor hellem Hintergrund",
        "BORA Pro Induktions-Kochfeld (PKI3): product view on a light background",
        "BORA Pro Induktions-Kochfeld (PKI3) : vue du produit sur fond clair",
        "BORA Pro Induktions-Kochfeld (PKI3): vista del prodotto su fondo chiaro"
      ), "https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0-pki3"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T(
          "Ausführung",
          "Version",
          "Version",
          "Versione"
        ),
        optionen: Object.freeze([
          opt("pki3", T(
            "Standard (Edelstahl)",
            "Standard (stainless steel)",
            "Standard (inox)",
            "Standard (acciaio inox)"
          ), "PKI3", "/Images/Wellness/produkte/bora/bora-pki3-1.webp", true),
          opt("pki3ab", T(
            "All Black",
            "All Black",
            "All Black",
            "All Black"
          ), "PKI3AB", "/Images/Wellness/produkte/bora/bora-pki3-1.webp", false),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0-pki3",
    quellen: Object.freeze(["https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0-pki3","https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0-pki3ab","https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0"]),
    stand: STAND,
    verwandt: Object.freeze(["bora-pka3","bora-pkas3"]),
  }),
  Object.freeze({
    slug: "bora-pkiw3",
    marke: "bora",
    bereich: "kueche",
    kategorie: "kochfeld",
    name: "Pro Induktions-Wok-Kochfeld",
    serie: "Professional 3.0",
    kurz: T(
      "Kochfeld (Induktions-Wok) mit 1 Kochzone aus dem BORA Modularsystem Professional 3.0; wird mit dem Kochfeldabzug der Serie kombiniert, die Anordnung ist laut Hersteller frei wählbar.",
      "Hob (induction wok) with 1 cooking zone from the BORA Professional 3.0 modular system; combined with the series’ cooktop extractor, the layout can be chosen freely according to the manufacturer.",
      "Table de cuisson (wok à induction) à 1 zone du système modulaire BORA Professional 3.0 ; elle se combine avec l’aspiration de la gamme, la disposition est libre selon le fabricant.",
      "Piano cottura (wok a induzione) con 1 zona del sistema modulare BORA Professional 3.0; si abbina all’aspiratore della serie, la disposizione è libera secondo il produttore."
    ),
    merkmale: Object.freeze([
      T(
        "Kochfeldart: Induktions-Wok, 1 Kochzone",
        "Hob type: induction wok, 1 cooking zone",
        "Type de table : wok à induction, 1 zone de cuisson",
        "Tipo di piano: wok a induzione, 1 zona di cottura"
      ),
      T(
        "Kochzonen: 310 mm",
        "Cooking zones: 310 mm",
        "Zones de cuisson : 310 mm",
        "Zone di cottura: 310 mm"
      ),
      T(
        "Leistungsaufnahme max. 3000 W",
        "Max. power consumption 3000 W",
        "Puissance absorbée max. 3000 W",
        "Potenza assorbita max. 3000 W"
      ),
    ]),
    masse: Object.freeze([mass("breite", "370 mm"), mass("hoehe", "128 mm"), mass("tiefe", "540 mm"), mass("gewicht", "9,22 kg")]),
    bilder: Object.freeze([
      bild("bora-pkiw3-1.webp", 1152, 864, T(
        "BORA Pro Induktions-Wok-Kochfeld (PKIW3): Produktansicht vor hellem Hintergrund",
        "BORA Pro Induktions-Wok-Kochfeld (PKIW3): product view on a light background",
        "BORA Pro Induktions-Wok-Kochfeld (PKIW3) : vue du produit sur fond clair",
        "BORA Pro Induktions-Wok-Kochfeld (PKIW3): vista del prodotto su fondo chiaro"
      ), "https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0-pkiw3"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T(
          "Ausführung",
          "Version",
          "Version",
          "Versione"
        ),
        optionen: Object.freeze([
          opt("pkiw3", T(
            "Standard (Edelstahl)",
            "Standard (stainless steel)",
            "Standard (inox)",
            "Standard (acciaio inox)"
          ), "PKIW3", "/Images/Wellness/produkte/bora/bora-pkiw3-1.webp", true),
          opt("pkiw3ab", T(
            "All Black",
            "All Black",
            "All Black",
            "All Black"
          ), "PKIW3AB", "/Images/Wellness/produkte/bora/bora-pkiw3-1.webp", false),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0-pkiw3",
    quellen: Object.freeze(["https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0-pkiw3","https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0-pkiw3ab","https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0"]),
    stand: STAND,
    verwandt: Object.freeze(["bora-pka3","bora-pkas3"]),
  }),
  Object.freeze({
    slug: "bora-pkt3",
    marke: "bora",
    bereich: "kueche",
    kategorie: "kochfeld",
    name: "Pro Tepan-Edelstahlgrill mit 2 Kochzonen",
    serie: "Professional 3.0",
    kurz: T(
      "Kochfeld (Tepan-Edelstahlgrill) mit 2 Kochzonen aus dem BORA Modularsystem Professional 3.0; wird mit dem Kochfeldabzug der Serie kombiniert, die Anordnung ist laut Hersteller frei wählbar.",
      "Hob (Tepan stainless steel grill) with 2 cooking zones from the BORA Professional 3.0 modular system; combined with the series’ cooktop extractor, the layout can be chosen freely according to the manufacturer.",
      "Table de cuisson (gril Tepan en inox) à 2 zones du système modulaire BORA Professional 3.0 ; elle se combine avec l’aspiration de la gamme, la disposition est libre selon le fabricant.",
      "Piano cottura (griglia Tepan in acciaio inox) con 2 zone del sistema modulare BORA Professional 3.0; si abbina all’aspiratore della serie, la disposizione è libera secondo il produttore."
    ),
    merkmale: Object.freeze([
      T(
        "Kochfeldart: Tepan-Edelstahlgrill, 2 Kochzonen",
        "Hob type: Tepan stainless steel grill, 2 cooking zones",
        "Type de table : gril Tepan en inox, 2 zones de cuisson",
        "Tipo di piano: griglia Tepan in acciaio inox, 2 zone di cottura"
      ),
      T(
        "Kochzonen: 295 × 230 mm / 295 × 230 mm",
        "Cooking zones: 295 × 230 mm / 295 × 230 mm",
        "Zones de cuisson : 295 × 230 mm / 295 × 230 mm",
        "Zone di cottura: 295 × 230 mm / 295 × 230 mm"
      ),
      T(
        "Temperaturbereich 70 - 250 °C",
        "Temperature range 70 - 250 °C",
        "Plage de température 70 - 250 °C",
        "Intervallo di temperatura 70 - 250 °C"
      ),
      T(
        "Leistungsaufnahme max. 4800 W",
        "Max. power consumption 4800 W",
        "Puissance absorbée max. 4800 W",
        "Potenza assorbita max. 4800 W"
      ),
      T(
        "Funktionen: Powerstufe, Reinigungsfunktion, Brückenfunktion, Pausefunktion",
        "Functions: power level, cleaning function, bridge function, pause function",
        "Fonctions : niveau Power, fonction nettoyage, fonction pont, fonction pause",
        "Funzioni: livello Power, funzione di pulizia, funzione ponte, funzione pausa"
      ),
      T(
        "Anordnung der Kochfelder laut Hersteller individuell wählbar",
        "Hob layout can be chosen individually according to the manufacturer",
        "Disposition des tables librement choisie selon le fabricant",
        "Disposizione dei piani scelta liberamente secondo il produttore"
      ),
    ]),
    masse: Object.freeze([mass("breite", "370 mm"), mass("hoehe", "73 mm"), mass("tiefe", "540 mm"), mass("gewicht", "15,88 kg")]),
    bilder: Object.freeze([
      bild("bora-pkt3-1.webp", 1152, 864, T(
        "BORA Pro Tepan-Edelstahlgrill mit 2 Kochzonen (PKT3): Produktansicht vor hellem Hintergrund",
        "BORA Pro Tepan-Edelstahlgrill mit 2 Kochzonen (PKT3): product view on a light background",
        "BORA Pro Tepan-Edelstahlgrill mit 2 Kochzonen (PKT3) : vue du produit sur fond clair",
        "BORA Pro Tepan-Edelstahlgrill mit 2 Kochzonen (PKT3): vista del prodotto su fondo chiaro"
      ), "https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0-pkt3"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T(
          "Ausführung",
          "Version",
          "Version",
          "Versione"
        ),
        optionen: Object.freeze([
          opt("pkt3", T(
            "Standard (Edelstahl)",
            "Standard (stainless steel)",
            "Standard (inox)",
            "Standard (acciaio inox)"
          ), "PKT3", "/Images/Wellness/produkte/bora/bora-pkt3-1.webp", true),
          opt("pkt3ab", T(
            "All Black",
            "All Black",
            "All Black",
            "All Black"
          ), "PKT3AB", "/Images/Wellness/produkte/bora/bora-pkt3-1.webp", false),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0-pkt3",
    quellen: Object.freeze(["https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0-pkt3","https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0-pkt3ab","https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0"]),
    stand: STAND,
    verwandt: Object.freeze(["bora-pka3","bora-pkas3"]),
  }),
  Object.freeze({
    slug: "bora-ckcb",
    marke: "bora",
    bereich: "kueche",
    kategorie: "kochfeld",
    name: "Classic HiLight-Kochfeld 1-Kreis/2-Kreis/Bräter",
    serie: "Classic 2.0",
    kurz: T(
      "Kochfeld (Strahlheizkörper) mit 2 Kochzonen aus dem BORA Modularsystem Classic 2.0; wird mit dem Kochfeldabzug der Serie kombiniert, die Anordnung ist laut Hersteller frei wählbar.",
      "Hob (radiant heating) with 2 cooking zones from the BORA Classic 2.0 modular system; combined with the series’ cooktop extractor, the layout can be chosen freely according to the manufacturer.",
      "Table de cuisson (foyers radiants) à 2 zones du système modulaire BORA Classic 2.0 ; elle se combine avec l’aspiration de la gamme, la disposition est libre selon le fabricant.",
      "Piano cottura (elementi radianti) con 2 zone del sistema modulare BORA Classic 2.0; si abbina all’aspiratore della serie, la disposizione è libera secondo il produttore."
    ),
    merkmale: Object.freeze([
      T(
        "Modell CKCB",
        "Model CKCB",
        "Modèle CKCB",
        "Modello CKCB"
      ),
      T(
        "Kochfeldart: Strahlheizkörper, 2 Kochzonen",
        "Hob type: radiant heating, 2 cooking zones",
        "Type de table : foyers radiants, 2 zones de cuisson",
        "Tipo di piano: elementi radianti, 2 zone di cottura"
      ),
      T(
        "Kochzonen: 180 mm / 120 / 180 mm",
        "Cooking zones: 180 mm / 120 / 180 mm",
        "Zones de cuisson : 180 mm / 120 / 180 mm",
        "Zone di cottura: 180 mm / 120 / 180 mm"
      ),
      T(
        "Leistungsaufnahme max. 3680 W",
        "Max. power consumption 3680 W",
        "Puissance absorbée max. 3680 W",
        "Potenza assorbita max. 3680 W"
      ),
      T(
        "Oberfläche: Glaskeramik, glänzend",
        "Surface: glass ceramic, gloss",
        "Surface : vitrocéramique, brillante",
        "Superficie: vetroceramica, lucida"
      ),
      T(
        "Funktionen: Kochzonen-Timer, Ankochautomatik, Brückenfunktion, Pausefunktion, Reinigungssperre, variable Warmhaltefunktion",
        "Functions: cooking zone timer, automatic boost start, bridge function, pause function, cleaning lock, variable keep-warm function",
        "Fonctions : minuterie par zone, démarrage automatique de cuisson, fonction pont, fonction pause, verrouillage pour le nettoyage, maintien au chaud variable",
        "Funzioni: timer per zona di cottura, avvio automatico di cottura, funzione ponte, funzione pausa, blocco per la pulizia, funzione di mantenimento in caldo variabile"
      ),
      T(
        "Anordnung der Kochfelder laut Hersteller individuell wählbar",
        "Hob layout can be chosen individually according to the manufacturer",
        "Disposition des tables librement choisie selon le fabricant",
        "Disposizione dei piani scelta liberamente secondo il produttore"
      ),
    ]),
    masse: Object.freeze([mass("breite", "327 mm"), mass("hoehe", "75 mm"), mass("tiefe", "515 mm"), mass("gewicht", "6,81 kg")]),
    bilder: Object.freeze([
      bild("bora-ckcb-1.webp", 1152, 864, T(
        "BORA Classic HiLight-Kochfeld 1-Kreis/2-Kreis/Bräter (CKCB): Produktansicht vor hellem Hintergrund",
        "BORA Classic HiLight-Kochfeld 1-Kreis/2-Kreis/Bräter (CKCB): product view on a light background",
        "BORA Classic HiLight-Kochfeld 1-Kreis/2-Kreis/Bräter (CKCB) : vue du produit sur fond clair",
        "BORA Classic HiLight-Kochfeld 1-Kreis/2-Kreis/Bräter (CKCB): vista del prodotto su fondo chiaro"
      ), "https://www.bora.com/de-at/kochfeldabzugssysteme/classic-2-0-ckcb"),
    ]),
    herstellerUrl: "https://www.bora.com/de-at/kochfeldabzugssysteme/classic-2-0-ckcb",
    quellen: Object.freeze(["https://www.bora.com/de-at/kochfeldabzugssysteme/classic-2-0-ckcb","https://www.bora.com/de-at/kochfeldabzugssysteme/classic-2-0"]),
    stand: STAND,
    verwandt: Object.freeze(["bora-cka2"]),
  }),
  Object.freeze({
    slug: "bora-ckch",
    marke: "bora",
    bereich: "kueche",
    kategorie: "kochfeld",
    name: "Classic Hyper-Kochfeld 1-Kreis/2-Kreis",
    serie: "Classic 2.0",
    kurz: T(
      "Kochfeld (Strahlheizkörper) mit 2 Kochzonen aus dem BORA Modularsystem Classic 2.0; wird mit dem Kochfeldabzug der Serie kombiniert, die Anordnung ist laut Hersteller frei wählbar.",
      "Hob (radiant heating) with 2 cooking zones from the BORA Classic 2.0 modular system; combined with the series’ cooktop extractor, the layout can be chosen freely according to the manufacturer.",
      "Table de cuisson (foyers radiants) à 2 zones du système modulaire BORA Classic 2.0 ; elle se combine avec l’aspiration de la gamme, la disposition est libre selon le fabricant.",
      "Piano cottura (elementi radianti) con 2 zone del sistema modulare BORA Classic 2.0; si abbina all’aspiratore della serie, la disposizione è libera secondo il produttore."
    ),
    merkmale: Object.freeze([
      T(
        "Modell CKCH",
        "Model CKCH",
        "Modèle CKCH",
        "Modello CKCH"
      ),
      T(
        "Kochfeldart: Strahlheizkörper, 2 Kochzonen",
        "Hob type: radiant heating, 2 cooking zones",
        "Type de table : foyers radiants, 2 zones de cuisson",
        "Tipo di piano: elementi radianti, 2 zone di cottura"
      ),
      T(
        "Kochzonen: 215 mm / 120 / 180 mm",
        "Cooking zones: 215 mm / 120 / 180 mm",
        "Zones de cuisson : 215 mm / 120 / 180 mm",
        "Zone di cottura: 215 mm / 120 / 180 mm"
      ),
      T(
        "Leistungsaufnahme max. 3680 W",
        "Max. power consumption 3680 W",
        "Puissance absorbée max. 3680 W",
        "Potenza assorbita max. 3680 W"
      ),
      T(
        "Oberfläche: Glaskeramik, glänzend",
        "Surface: glass ceramic, gloss",
        "Surface : vitrocéramique, brillante",
        "Superficie: vetroceramica, lucida"
      ),
      T(
        "Funktionen: Powerstufe, Kochzonen-Timer, Kurzzeitwecker, Ankochautomatik, Pausefunktion, Reinigungssperre, variable Warmhaltefunktion",
        "Functions: power level, cooking zone timer, kitchen timer, automatic boost start, pause function, cleaning lock, variable keep-warm function",
        "Fonctions : niveau Power, minuterie par zone, minuteur, démarrage automatique de cuisson, fonction pause, verrouillage pour le nettoyage, maintien au chaud variable",
        "Funzioni: livello Power, timer per zona di cottura, contaminuti, avvio automatico di cottura, funzione pausa, blocco per la pulizia, funzione di mantenimento in caldo variabile"
      ),
      T(
        "Anordnung der Kochfelder laut Hersteller individuell wählbar",
        "Hob layout can be chosen individually according to the manufacturer",
        "Disposition des tables librement choisie selon le fabricant",
        "Disposizione dei piani scelta liberamente secondo il produttore"
      ),
    ]),
    masse: Object.freeze([mass("breite", "327 mm"), mass("hoehe", "75 mm"), mass("tiefe", "515 mm"), mass("gewicht", "6,9 kg")]),
    bilder: Object.freeze([
      bild("bora-ckch-1.webp", 1152, 864, T(
        "BORA Classic Hyper-Kochfeld 1-Kreis/2-Kreis (CKCH): Produktansicht vor hellem Hintergrund",
        "BORA Classic Hyper-Kochfeld 1-Kreis/2-Kreis (CKCH): product view on a light background",
        "BORA Classic Hyper-Kochfeld 1-Kreis/2-Kreis (CKCH) : vue du produit sur fond clair",
        "BORA Classic Hyper-Kochfeld 1-Kreis/2-Kreis (CKCH): vista del prodotto su fondo chiaro"
      ), "https://www.bora.com/de-at/kochfeldabzugssysteme/classic-2-0-ckch"),
    ]),
    herstellerUrl: "https://www.bora.com/de-at/kochfeldabzugssysteme/classic-2-0-ckch",
    quellen: Object.freeze(["https://www.bora.com/de-at/kochfeldabzugssysteme/classic-2-0-ckch","https://www.bora.com/de-at/kochfeldabzugssysteme/classic-2-0"]),
    stand: STAND,
    verwandt: Object.freeze(["bora-cka2"]),
  }),
  Object.freeze({
    slug: "bora-ckfi",
    marke: "bora",
    bereich: "kueche",
    kategorie: "kochfeld",
    name: "Classic Flächeninduktions-Kochfeld",
    serie: "Classic 2.0",
    kurz: T(
      "Kochfeld (Flächeninduktion) mit 2 Kochzonen aus dem BORA Modularsystem Classic 2.0; wird mit dem Kochfeldabzug der Serie kombiniert, die Anordnung ist laut Hersteller frei wählbar.",
      "Hob (full-surface induction) with 2 cooking zones from the BORA Classic 2.0 modular system; combined with the series’ cooktop extractor, the layout can be chosen freely according to the manufacturer.",
      "Table de cuisson (induction pleine surface) à 2 zones du système modulaire BORA Classic 2.0 ; elle se combine avec l’aspiration de la gamme, la disposition est libre selon le fabricant.",
      "Piano cottura (induzione a superficie totale) con 2 zone del sistema modulare BORA Classic 2.0; si abbina all’aspiratore della serie, la disposizione è libera secondo il produttore."
    ),
    merkmale: Object.freeze([
      T(
        "Modell CKFI",
        "Model CKFI",
        "Modèle CKFI",
        "Modello CKFI"
      ),
      T(
        "Kochfeldart: Flächeninduktion, 2 Kochzonen",
        "Hob type: full-surface induction, 2 cooking zones",
        "Type de table : induction pleine surface, 2 zones de cuisson",
        "Tipo di piano: induzione a superficie totale, 2 zone di cottura"
      ),
      T(
        "Kochzonen: 230 × 230 mm / 230 × 230 mm",
        "Cooking zones: 230 × 230 mm / 230 × 230 mm",
        "Zones de cuisson : 230 × 230 mm / 230 × 230 mm",
        "Zone di cottura: 230 × 230 mm / 230 × 230 mm"
      ),
      T(
        "Leistungsaufnahme max. 3680 W",
        "Max. power consumption 3680 W",
        "Puissance absorbée max. 3680 W",
        "Potenza assorbita max. 3680 W"
      ),
      T(
        "Oberfläche: Glaskeramik, glänzend",
        "Surface: glass ceramic, gloss",
        "Surface : vitrocéramique, brillante",
        "Superficie: vetroceramica, lucida"
      ),
      T(
        "Funktionen: Powerstufe, Reinigungssperre, Brückenfunktion, Kochzonen-Timer, Ankochautomatik, Topferkennung, variable Warmhaltefunktion",
        "Functions: power level, cleaning lock, bridge function, cooking zone timer, automatic boost start, pan detection, variable keep-warm function",
        "Fonctions : niveau Power, verrouillage pour le nettoyage, fonction pont, minuterie par zone, démarrage automatique de cuisson, détection des récipients, maintien au chaud variable",
        "Funzioni: livello Power, blocco per la pulizia, funzione ponte, timer per zona di cottura, avvio automatico di cottura, riconoscimento pentole, funzione di mantenimento in caldo variabile"
      ),
      T(
        "Anordnung der Kochfelder laut Hersteller individuell wählbar",
        "Hob layout can be chosen individually according to the manufacturer",
        "Disposition des tables librement choisie selon le fabricant",
        "Disposizione dei piani scelta liberamente secondo il produttore"
      ),
    ]),
    masse: Object.freeze([mass("breite", "327 mm"), mass("hoehe", "58 mm"), mass("tiefe", "515 mm"), mass("gewicht", "7,27 kg")]),
    bilder: Object.freeze([
      bild("bora-ckfi-1.webp", 1152, 864, T(
        "BORA Classic Flächeninduktions-Kochfeld (CKFI): Produktansicht vor hellem Hintergrund",
        "BORA Classic Flächeninduktions-Kochfeld (CKFI): product view on a light background",
        "BORA Classic Flächeninduktions-Kochfeld (CKFI) : vue du produit sur fond clair",
        "BORA Classic Flächeninduktions-Kochfeld (CKFI): vista del prodotto su fondo chiaro"
      ), "https://www.bora.com/de-at/kochfeldabzugssysteme/classic-2-0-ckfi"),
    ]),
    herstellerUrl: "https://www.bora.com/de-at/kochfeldabzugssysteme/classic-2-0-ckfi",
    quellen: Object.freeze(["https://www.bora.com/de-at/kochfeldabzugssysteme/classic-2-0-ckfi","https://www.bora.com/de-at/kochfeldabzugssysteme/classic-2-0"]),
    stand: STAND,
    verwandt: Object.freeze(["bora-cka2"]),
  }),
  Object.freeze({
    slug: "bora-ckg",
    marke: "bora",
    bereich: "kueche",
    kategorie: "kochfeld",
    name: "Classic Gas-Kochfeld",
    serie: "Classic 2.0",
    kurz: T(
      "Kochfeld (Gas) mit 2 Kochzonen aus dem BORA Modularsystem Classic 2.0; wird mit dem Kochfeldabzug der Serie kombiniert, die Anordnung ist laut Hersteller frei wählbar.",
      "Hob (gas) with 2 cooking zones from the BORA Classic 2.0 modular system; combined with the series’ cooktop extractor, the layout can be chosen freely according to the manufacturer.",
      "Table de cuisson (gaz) à 2 zones du système modulaire BORA Classic 2.0 ; elle se combine avec l’aspiration de la gamme, la disposition est libre selon le fabricant.",
      "Piano cottura (gas) con 2 zone del sistema modulare BORA Classic 2.0; si abbina all’aspiratore della serie, la disposizione è libera secondo il produttore."
    ),
    merkmale: Object.freeze([
      T(
        "Modell CKG",
        "Model CKG",
        "Modèle CKG",
        "Modello CKG"
      ),
      T(
        "Kochfeldart: Gas, 2 Kochzonen",
        "Hob type: gas, 2 cooking zones",
        "Type de table : gaz, 2 zones de cuisson",
        "Tipo di piano: gas, 2 zone di cottura"
      ),
      T(
        "Kochzonen: 240 mm / 200 mm",
        "Cooking zones: 240 mm / 200 mm",
        "Zones de cuisson : 240 mm / 200 mm",
        "Zone di cottura: 240 mm / 200 mm"
      ),
      T(
        "Leistungsaufnahme max. 5000 W",
        "Max. power consumption 5000 W",
        "Puissance absorbée max. 5000 W",
        "Potenza assorbita max. 5000 W"
      ),
      T(
        "Oberfläche: Glaskeramik, glänzend",
        "Surface: glass ceramic, gloss",
        "Surface : vitrocéramique, brillante",
        "Superficie: vetroceramica, lucida"
      ),
      T(
        "Funktionen: Powerstufe, Reinigungssperre, Kochzonen-Timer, Pausefunktion, Ankochautomatik, variable Warmhaltefunktion",
        "Functions: power level, cleaning lock, cooking zone timer, pause function, automatic boost start, variable keep-warm function",
        "Fonctions : niveau Power, verrouillage pour le nettoyage, minuterie par zone, fonction pause, démarrage automatique de cuisson, maintien au chaud variable",
        "Funzioni: livello Power, blocco per la pulizia, timer per zona di cottura, funzione pausa, avvio automatico di cottura, funzione di mantenimento in caldo variabile"
      ),
      T(
        "Anordnung der Kochfelder laut Hersteller individuell wählbar",
        "Hob layout can be chosen individually according to the manufacturer",
        "Disposition des tables librement choisie selon le fabricant",
        "Disposizione dei piani scelta liberamente secondo il produttore"
      ),
    ]),
    masse: Object.freeze([mass("breite", "327 mm"), mass("hoehe", "73 mm"), mass("tiefe", "515 mm"), mass("gewicht", "9,8 kg")]),
    bilder: Object.freeze([
      bild("bora-ckg-1.webp", 1152, 864, T(
        "BORA Classic Gas-Kochfeld (CKG): Produktansicht vor hellem Hintergrund",
        "BORA Classic Gas-Kochfeld (CKG): product view on a light background",
        "BORA Classic Gas-Kochfeld (CKG) : vue du produit sur fond clair",
        "BORA Classic Gas-Kochfeld (CKG): vista del prodotto su fondo chiaro"
      ), "https://www.bora.com/de-at/kochfeldabzugssysteme/classic-2-0-ckg"),
    ]),
    herstellerUrl: "https://www.bora.com/de-at/kochfeldabzugssysteme/classic-2-0-ckg",
    quellen: Object.freeze(["https://www.bora.com/de-at/kochfeldabzugssysteme/classic-2-0-ckg","https://www.bora.com/de-at/kochfeldabzugssysteme/classic-2-0"]),
    stand: STAND,
    verwandt: Object.freeze(["bora-cka2"]),
  }),
  Object.freeze({
    slug: "bora-cki",
    marke: "bora",
    bereich: "kueche",
    kategorie: "kochfeld",
    name: "Classic Induktions-Kochfeld",
    serie: "Classic 2.0",
    kurz: T(
      "Kochfeld (Induktion) mit 2 Kochzonen aus dem BORA Modularsystem Classic 2.0; wird mit dem Kochfeldabzug der Serie kombiniert, die Anordnung ist laut Hersteller frei wählbar.",
      "Hob (induction) with 2 cooking zones from the BORA Classic 2.0 modular system; combined with the series’ cooktop extractor, the layout can be chosen freely according to the manufacturer.",
      "Table de cuisson (induction) à 2 zones du système modulaire BORA Classic 2.0 ; elle se combine avec l’aspiration de la gamme, la disposition est libre selon le fabricant.",
      "Piano cottura (induzione) con 2 zone del sistema modulare BORA Classic 2.0; si abbina all’aspiratore della serie, la disposizione è libera secondo il produttore."
    ),
    merkmale: Object.freeze([
      T(
        "Modell CKI",
        "Model CKI",
        "Modèle CKI",
        "Modello CKI"
      ),
      T(
        "Kochfeldart: Induktion, 2 Kochzonen",
        "Hob type: induction, 2 cooking zones",
        "Type de table : induction, 2 zones de cuisson",
        "Tipo di piano: induzione, 2 zone di cottura"
      ),
      T(
        "Kochzonen: 230 mm / 165 mm",
        "Cooking zones: 230 mm / 165 mm",
        "Zones de cuisson : 230 mm / 165 mm",
        "Zone di cottura: 230 mm / 165 mm"
      ),
      T(
        "Leistungsaufnahme max. 3680 W",
        "Max. power consumption 3680 W",
        "Puissance absorbée max. 3680 W",
        "Potenza assorbita max. 3680 W"
      ),
      T(
        "Oberfläche: Glaskeramik, glänzend",
        "Surface: glass ceramic, gloss",
        "Surface : vitrocéramique, brillante",
        "Superficie: vetroceramica, lucida"
      ),
      T(
        "Funktionen: Powerstufe, Reinigungssperre, Kochzonen-Timer, Pausefunktion, Ankochautomatik, Topferkennung, variable Warmhaltefunktion",
        "Functions: power level, cleaning lock, cooking zone timer, pause function, automatic boost start, pan detection, variable keep-warm function",
        "Fonctions : niveau Power, verrouillage pour le nettoyage, minuterie par zone, fonction pause, démarrage automatique de cuisson, détection des récipients, maintien au chaud variable",
        "Funzioni: livello Power, blocco per la pulizia, timer per zona di cottura, funzione pausa, avvio automatico di cottura, riconoscimento pentole, funzione di mantenimento in caldo variabile"
      ),
      T(
        "Anordnung der Kochfelder laut Hersteller individuell wählbar",
        "Hob layout can be chosen individually according to the manufacturer",
        "Disposition des tables librement choisie selon le fabricant",
        "Disposizione dei piani scelta liberamente secondo il produttore"
      ),
    ]),
    masse: Object.freeze([mass("breite", "327 mm"), mass("hoehe", "58 mm"), mass("tiefe", "515 mm"), mass("gewicht", "7 kg")]),
    bilder: Object.freeze([
      bild("bora-cki-1.webp", 1152, 864, T(
        "BORA Classic Induktions-Kochfeld (CKI): Produktansicht vor hellem Hintergrund",
        "BORA Classic Induktions-Kochfeld (CKI): product view on a light background",
        "BORA Classic Induktions-Kochfeld (CKI) : vue du produit sur fond clair",
        "BORA Classic Induktions-Kochfeld (CKI): vista del prodotto su fondo chiaro"
      ), "https://www.bora.com/de-at/kochfeldabzugssysteme/classic-2-0-cki"),
    ]),
    herstellerUrl: "https://www.bora.com/de-at/kochfeldabzugssysteme/classic-2-0-cki",
    quellen: Object.freeze(["https://www.bora.com/de-at/kochfeldabzugssysteme/classic-2-0-cki","https://www.bora.com/de-at/kochfeldabzugssysteme/classic-2-0"]),
    stand: STAND,
    verwandt: Object.freeze(["bora-cka2"]),
  }),
  Object.freeze({
    slug: "bora-ckiw",
    marke: "bora",
    bereich: "kueche",
    kategorie: "kochfeld",
    name: "Classic Induktions-Wok-Kochfeld",
    serie: "Classic 2.0",
    kurz: T(
      "Kochfeld (Induktions-Wok) mit 1 Kochzone aus dem BORA Modularsystem Classic 2.0; wird mit dem Kochfeldabzug der Serie kombiniert, die Anordnung ist laut Hersteller frei wählbar.",
      "Hob (induction wok) with 1 cooking zone from the BORA Classic 2.0 modular system; combined with the series’ cooktop extractor, the layout can be chosen freely according to the manufacturer.",
      "Table de cuisson (wok à induction) à 1 zone du système modulaire BORA Classic 2.0 ; elle se combine avec l’aspiration de la gamme, la disposition est libre selon le fabricant.",
      "Piano cottura (wok a induzione) con 1 zona del sistema modulare BORA Classic 2.0; si abbina all’aspiratore della serie, la disposizione è libera secondo il produttore."
    ),
    merkmale: Object.freeze([
      T(
        "Modell CKIW",
        "Model CKIW",
        "Modèle CKIW",
        "Modello CKIW"
      ),
      T(
        "Kochfeldart: Induktions-Wok, 1 Kochzone",
        "Hob type: induction wok, 1 cooking zone",
        "Type de table : wok à induction, 1 zone de cuisson",
        "Tipo di piano: wok a induzione, 1 zona di cottura"
      ),
      T(
        "Kochzonen: 250 mm",
        "Cooking zones: 250 mm",
        "Zones de cuisson : 250 mm",
        "Zone di cottura: 250 mm"
      ),
      T(
        "Leistungsaufnahme max. 3000 W",
        "Max. power consumption 3000 W",
        "Puissance absorbée max. 3000 W",
        "Potenza assorbita max. 3000 W"
      ),
      T(
        "Oberfläche: Glaskeramik, glänzend",
        "Surface: glass ceramic, gloss",
        "Surface : vitrocéramique, brillante",
        "Superficie: vetroceramica, lucida"
      ),
      T(
        "Funktionen: Powerstufe, Reinigungssperre, Kochzonen-Timer, Ankochautomatik, Topferkennung, variable Warmhaltefunktion",
        "Functions: power level, cleaning lock, cooking zone timer, automatic boost start, pan detection, variable keep-warm function",
        "Fonctions : niveau Power, verrouillage pour le nettoyage, minuterie par zone, démarrage automatique de cuisson, détection des récipients, maintien au chaud variable",
        "Funzioni: livello Power, blocco per la pulizia, timer per zona di cottura, avvio automatico di cottura, riconoscimento pentole, funzione di mantenimento in caldo variabile"
      ),
      T(
        "Anordnung der Kochfelder laut Hersteller individuell wählbar",
        "Hob layout can be chosen individually according to the manufacturer",
        "Disposition des tables librement choisie selon le fabricant",
        "Disposizione dei piani scelta liberamente secondo il produttore"
      ),
    ]),
    masse: Object.freeze([mass("breite", "327 mm"), mass("hoehe", "116 mm"), mass("tiefe", "515 mm"), mass("gewicht", "9,35 kg")]),
    bilder: Object.freeze([
      bild("bora-ckiw-1.webp", 1152, 864, T(
        "BORA Classic Induktions-Wok-Kochfeld (CKIW): Produktansicht vor hellem Hintergrund",
        "BORA Classic Induktions-Wok-Kochfeld (CKIW): product view on a light background",
        "BORA Classic Induktions-Wok-Kochfeld (CKIW) : vue du produit sur fond clair",
        "BORA Classic Induktions-Wok-Kochfeld (CKIW): vista del prodotto su fondo chiaro"
      ), "https://www.bora.com/de-at/kochfeldabzugssysteme/classic-2-0-ckiw"),
    ]),
    herstellerUrl: "https://www.bora.com/de-at/kochfeldabzugssysteme/classic-2-0-ckiw",
    quellen: Object.freeze(["https://www.bora.com/de-at/kochfeldabzugssysteme/classic-2-0-ckiw","https://www.bora.com/de-at/kochfeldabzugssysteme/classic-2-0"]),
    stand: STAND,
    verwandt: Object.freeze(["bora-cka2"]),
  }),
  Object.freeze({
    slug: "bora-ckt",
    marke: "bora",
    bereich: "kueche",
    kategorie: "kochfeld",
    name: "Classic Tepan-Edelstahlgrill mit 2 Kochzonen",
    serie: "Classic 2.0",
    kurz: T(
      "Kochfeld (Tepan-Edelstahlgrill) mit 2 Kochzonen aus dem BORA Modularsystem Classic 2.0; wird mit dem Kochfeldabzug der Serie kombiniert, die Anordnung ist laut Hersteller frei wählbar.",
      "Hob (Tepan stainless steel grill) with 2 cooking zones from the BORA Classic 2.0 modular system; combined with the series’ cooktop extractor, the layout can be chosen freely according to the manufacturer.",
      "Table de cuisson (gril Tepan en inox) à 2 zones du système modulaire BORA Classic 2.0 ; elle se combine avec l’aspiration de la gamme, la disposition est libre selon le fabricant.",
      "Piano cottura (griglia Tepan in acciaio inox) con 2 zone del sistema modulare BORA Classic 2.0; si abbina all’aspiratore della serie, la disposizione è libera secondo il produttore."
    ),
    merkmale: Object.freeze([
      T(
        "Modell CKT",
        "Model CKT",
        "Modèle CKT",
        "Modello CKT"
      ),
      T(
        "Kochfeldart: Tepan-Edelstahlgrill, 2 Kochzonen",
        "Hob type: Tepan stainless steel grill, 2 cooking zones",
        "Type de table : gril Tepan en inox, 2 zones de cuisson",
        "Tipo di piano: griglia Tepan in acciaio inox, 2 zone di cottura"
      ),
      T(
        "Kochzonen: 250 × 220 mm / 250 × 220 mm",
        "Cooking zones: 250 × 220 mm / 250 × 220 mm",
        "Zones de cuisson : 250 × 220 mm / 250 × 220 mm",
        "Zone di cottura: 250 × 220 mm / 250 × 220 mm"
      ),
      T(
        "Temperaturbereich 70 - 250 °C",
        "Temperature range 70 - 250 °C",
        "Plage de température 70 - 250 °C",
        "Intervallo di temperatura 70 - 250 °C"
      ),
      T(
        "Leistungsaufnahme max. 3000 W",
        "Max. power consumption 3000 W",
        "Puissance absorbée max. 3000 W",
        "Potenza assorbita max. 3000 W"
      ),
      T(
        "Oberfläche: Edelstahl gebürstet",
        "Surface: stainless steel gebürstet",
        "Surface : inox gebürstet",
        "Superficie: acciaio inox gebürstet"
      ),
      T(
        "Funktionen: Powerstufe, Kochzonen-Timer, Pausefunktion, Brückenfunktion, Reinigungssperre, Reinigungsfunktion",
        "Functions: power level, cooking zone timer, pause function, bridge function, cleaning lock, cleaning function",
        "Fonctions : niveau Power, minuterie par zone, fonction pause, fonction pont, verrouillage pour le nettoyage, fonction nettoyage",
        "Funzioni: livello Power, timer per zona di cottura, funzione pausa, funzione ponte, blocco per la pulizia, funzione di pulizia"
      ),
      T(
        "Anordnung der Kochfelder laut Hersteller individuell wählbar",
        "Hob layout can be chosen individually according to the manufacturer",
        "Disposition des tables librement choisie selon le fabricant",
        "Disposizione dei piani scelta liberamente secondo il produttore"
      ),
    ]),
    masse: Object.freeze([mass("breite", "327 mm"), mass("hoehe", "73 mm"), mass("tiefe", "515 mm"), mass("gewicht", "13 kg")]),
    bilder: Object.freeze([
      bild("bora-ckt-1.webp", 1152, 864, T(
        "BORA Classic Tepan-Edelstahlgrill mit 2 Kochzonen (CKT): Produktansicht vor hellem Hintergrund",
        "BORA Classic Tepan-Edelstahlgrill mit 2 Kochzonen (CKT): product view on a light background",
        "BORA Classic Tepan-Edelstahlgrill mit 2 Kochzonen (CKT) : vue du produit sur fond clair",
        "BORA Classic Tepan-Edelstahlgrill mit 2 Kochzonen (CKT): vista del prodotto su fondo chiaro"
      ), "https://www.bora.com/de-at/kochfeldabzugssysteme/classic-2-0-ckt"),
    ]),
    herstellerUrl: "https://www.bora.com/de-at/kochfeldabzugssysteme/classic-2-0-ckt",
    quellen: Object.freeze(["https://www.bora.com/de-at/kochfeldabzugssysteme/classic-2-0-ckt","https://www.bora.com/de-at/kochfeldabzugssysteme/classic-2-0"]),
    stand: STAND,
    verwandt: Object.freeze(["bora-cka2"]),
  }),
  // ---------------------------------------------------------------- dunstabzug
  Object.freeze({
    slug: "bora-pka3",
    marke: "bora",
    bereich: "kueche",
    kategorie: "dunstabzug",
    name: "Pro Kochfeldabzug",
    serie: "Professional 3.0",
    kurz: T(
      "Kochfeldabzug des BORA Modularsystems Professional 3.0, kombinierbar mit den Kochfeldern der Serie; laut Hersteller bis 613 m³/h Fördervolumen, für Abluft oder Umluft.",
      "Cooktop extractor of the BORA Professional 3.0 modular system, combinable with the hobs of the series; according to the manufacturer up to 613 m³/h, for ducted extraction or recirculation.",
      "Aspiration de table du système modulaire BORA Professional 3.0, à combiner avec les tables de la gamme ; selon le fabricant jusqu’à 613 m³/h, en évacuation extérieure ou en recyclage.",
      "Aspiratore piano del sistema modulare BORA Professional 3.0, abbinabile ai piani della serie; secondo il produttore fino a 613 m³/h, in versione aspirante o filtrante."
    ),
    merkmale: Object.freeze([
      T(
        "Betriebsart: Abluft oder Umluft",
        "Operating mode: ducted extraction or recirculation",
        "Mode de fonctionnement : évacuation extérieure ou recyclage",
        "Modalità: versione aspirante o filtrante"
      ),
      T(
        "Fördervolumen bis 613 m³/h",
        "Extraction rate up to 613 m³/h",
        "Débit d’air jusqu’à 613 m³/h",
        "Portata fino a 613 m³/h"
      ),
      T(
        "9 Leistungsstufen des Kochfeldabzugs",
        "9 extractor power levels",
        "9 niveaux de puissance de l’aspiration",
        "9 livelli di potenza dell’aspirazione"
      ),
      T(
        "Kanalanschluss Ecotube",
        "Duct connection Ecotube",
        "Raccordement de gaine Ecotube",
        "Raccordo canale Ecotube"
      ),
      T(
        "Leistungsaufnahme max. 550 W",
        "Max. power consumption 550 W",
        "Puissance absorbée max. 550 W",
        "Potenza assorbita max. 550 W"
      ),
      T(
        "Funktionen: automatische Abzugssteuerung, Nachlaufautomatik, Powerstufe, Filterstandsanzeige (bei Umluft), Reinigungsfunktion, Kurzzeitwecker",
        "Functions: automatic extractor control, automatic run-on, power level, filter status display (recirculation), cleaning function, kitchen timer",
        "Fonctions : commande automatique de l’aspiration, temporisation automatique, niveau Power, indicateur d’état du filtre (recyclage), fonction nettoyage, minuteur",
        "Funzioni: controllo automatico dell’aspirazione, funzionamento residuo automatico, livello Power, indicatore stato filtro (versione filtrante), funzione di pulizia, contaminuti"
      ),
      T(
        "Anordnung der Kochfelder laut Hersteller individuell wählbar",
        "Hob layout can be chosen individually according to the manufacturer",
        "Disposition des tables librement choisie selon le fabricant",
        "Disposizione dei piani scelta liberamente secondo il produttore"
      ),
    ]),
    masse: Object.freeze([mass("breite", "482 mm"), mass("hoehe", "176 mm"), mass("tiefe", "540 mm"), mass("gewicht", "8,61 kg")]),
    bilder: Object.freeze([
      bild("bora-pka3-1.webp", 1152, 864, T(
        "BORA Pro Kochfeldabzug (PKA3): Produktansicht vor hellem Hintergrund",
        "BORA Pro Kochfeldabzug (PKA3): product view on a light background",
        "BORA Pro Kochfeldabzug (PKA3) : vue du produit sur fond clair",
        "BORA Pro Kochfeldabzug (PKA3): vista del prodotto su fondo chiaro"
      ), "https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0-pka3"),
      bild("bora-pka3-2.webp", 1152, 864, T(
        "BORA Pro Kochfeldabzug (PKA3AB): Produktansicht vor hellem Hintergrund",
        "BORA Pro Kochfeldabzug (PKA3AB): product view on a light background",
        "BORA Pro Kochfeldabzug (PKA3AB) : vue du produit sur fond clair",
        "BORA Pro Kochfeldabzug (PKA3AB): vista del prodotto su fondo chiaro"
      ), "https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0-pka3ab"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T(
          "Ausführung",
          "Version",
          "Version",
          "Versione"
        ),
        optionen: Object.freeze([
          opt("pka3", T(
            "Standard (Edelstahl)",
            "Standard (stainless steel)",
            "Standard (inox)",
            "Standard (acciaio inox)"
          ), "PKA3", "/Images/Wellness/produkte/bora/bora-pka3-1.webp", true),
          opt("pka3ab", T(
            "All Black",
            "All Black",
            "All Black",
            "All Black"
          ), "PKA3AB", "/Images/Wellness/produkte/bora/bora-pka3-2.webp", false),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0-pka3",
    quellen: Object.freeze(["https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0-pka3","https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0-pka3ab","https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "bora-pkas3",
    marke: "bora",
    bereich: "kueche",
    kategorie: "dunstabzug",
    name: "Pro Kochfeldabzugssystem mit integriertem Lüfter",
    serie: "Professional 3.0",
    kurz: T(
      "Kochfeldabzug des BORA Modularsystems Professional 3.0 mit integriertem Lüfter, kombinierbar mit den Kochfeldern der Serie; laut Hersteller bis 670 m³/h Fördervolumen.",
      "Cooktop extractor of the BORA Professional 3.0 modular system with integrated fan, combinable with the hobs of the series; up to 670 m³/h according to the manufacturer.",
      "Aspiration de table du système modulaire BORA Professional 3.0 avec ventilateur intégré, à combiner avec les tables de la gamme ; jusqu’à 670 m³/h selon le fabricant.",
      "Aspiratore piano del sistema modulare BORA Professional 3.0 con ventola integrata, abbinabile ai piani della serie; fino a 670 m³/h secondo il produttore."
    ),
    merkmale: Object.freeze([
      T(
        "Betriebsart: Abluft oder Umluft",
        "Operating mode: ducted extraction or recirculation",
        "Mode de fonctionnement : évacuation extérieure ou recyclage",
        "Modalità: versione aspirante o filtrante"
      ),
      T(
        "Fördervolumen bis 670 m³/h",
        "Extraction rate up to 670 m³/h",
        "Débit d’air jusqu’à 670 m³/h",
        "Portata fino a 670 m³/h"
      ),
      T(
        "9 Leistungsstufen des Kochfeldabzugs",
        "9 extractor power levels",
        "9 niveaux de puissance de l’aspiration",
        "9 livelli di potenza dell’aspirazione"
      ),
      T(
        "Kanalanschluss Ecotube",
        "Duct connection Ecotube",
        "Raccordement de gaine Ecotube",
        "Raccordo canale Ecotube"
      ),
      T(
        "Leistungsaufnahme max. 550 W",
        "Max. power consumption 550 W",
        "Puissance absorbée max. 550 W",
        "Potenza assorbita max. 550 W"
      ),
      T(
        "Funktionen: automatische Abzugssteuerung, Nachlaufautomatik, Powerstufe, Filterstandsanzeige (bei Umluft), Reinigungsfunktion, Kurzzeitwecker",
        "Functions: automatic extractor control, automatic run-on, power level, filter status display (recirculation), cleaning function, kitchen timer",
        "Fonctions : commande automatique de l’aspiration, temporisation automatique, niveau Power, indicateur d’état du filtre (recyclage), fonction nettoyage, minuteur",
        "Funzioni: controllo automatico dell’aspirazione, funzionamento residuo automatico, livello Power, indicatore stato filtro (versione filtrante), funzione di pulizia, contaminuti"
      ),
      T(
        "Anordnung der Kochfelder laut Hersteller individuell wählbar",
        "Hob layout can be chosen individually according to the manufacturer",
        "Disposition des tables librement choisie selon le fabricant",
        "Disposizione dei piani scelta liberamente secondo il produttore"
      ),
    ]),
    masse: Object.freeze([mass("breite", "468 mm"), mass("hoehe", "199 mm"), mass("tiefe", "540 mm"), mass("gewicht", "12,36 kg")]),
    bilder: Object.freeze([
      bild("bora-pkas3-1.webp", 1152, 864, T(
        "BORA Pro Kochfeldabzugssystem mit integriertem Lüfter (PKAS3): Produktansicht vor hellem Hintergrund",
        "BORA Pro Kochfeldabzugssystem mit integriertem Lüfter (PKAS3): product view on a light background",
        "BORA Pro Kochfeldabzugssystem mit integriertem Lüfter (PKAS3) : vue du produit sur fond clair",
        "BORA Pro Kochfeldabzugssystem mit integriertem Lüfter (PKAS3): vista del prodotto su fondo chiaro"
      ), "https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0-pkas3"),
      bild("bora-pkas3-2.webp", 1152, 864, T(
        "BORA Pro Kochfeldabzugssystem mit integriertem Lüfter (PKAS3AB): Produktansicht vor hellem Hintergrund",
        "BORA Pro Kochfeldabzugssystem mit integriertem Lüfter (PKAS3AB): product view on a light background",
        "BORA Pro Kochfeldabzugssystem mit integriertem Lüfter (PKAS3AB) : vue du produit sur fond clair",
        "BORA Pro Kochfeldabzugssystem mit integriertem Lüfter (PKAS3AB): vista del prodotto su fondo chiaro"
      ), "https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0-pkas3ab"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T(
          "Ausführung",
          "Version",
          "Version",
          "Versione"
        ),
        optionen: Object.freeze([
          opt("pkas3", T(
            "Standard (Edelstahl)",
            "Standard (stainless steel)",
            "Standard (inox)",
            "Standard (acciaio inox)"
          ), "PKAS3", "/Images/Wellness/produkte/bora/bora-pkas3-1.webp", true),
          opt("pkas3ab", T(
            "All Black",
            "All Black",
            "All Black",
            "All Black"
          ), "PKAS3AB", "/Images/Wellness/produkte/bora/bora-pkas3-2.webp", false),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0-pkas3",
    quellen: Object.freeze(["https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0-pkas3","https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0-pkas3ab","https://www.bora.com/de-at/kochfeldabzugssysteme/professional-3-0"]),
    stand: STAND,
    verwandt: Object.freeze(["bora-pka3"]),
  }),
  Object.freeze({
    slug: "bora-cka2",
    marke: "bora",
    bereich: "kueche",
    kategorie: "dunstabzug",
    name: "Classic Kochfeldabzug",
    serie: "Classic 2.0",
    kurz: T(
      "Kochfeldabzug des BORA Modularsystems Classic 2.0, kombinierbar mit den Kochfeldern der Serie; laut Hersteller bis 591 m³/h Fördervolumen, für Abluft oder Umluft.",
      "Cooktop extractor of the BORA Classic 2.0 modular system, combinable with the hobs of the series; according to the manufacturer up to 591 m³/h, for ducted extraction or recirculation.",
      "Aspiration de table du système modulaire BORA Classic 2.0, à combiner avec les tables de la gamme ; selon le fabricant jusqu’à 591 m³/h, en évacuation extérieure ou en recyclage.",
      "Aspiratore piano del sistema modulare BORA Classic 2.0, abbinabile ai piani della serie; secondo il produttore fino a 591 m³/h, in versione aspirante o filtrante."
    ),
    merkmale: Object.freeze([
      T(
        "Betriebsart: Abluft oder Umluft",
        "Operating mode: ducted extraction or recirculation",
        "Mode de fonctionnement : évacuation extérieure ou recyclage",
        "Modalità: versione aspirante o filtrante"
      ),
      T(
        "Fördervolumen bis 591 m³/h",
        "Extraction rate up to 591 m³/h",
        "Débit d’air jusqu’à 591 m³/h",
        "Portata fino a 591 m³/h"
      ),
      T(
        "5 Leistungsstufen des Kochfeldabzugs",
        "5 extractor power levels",
        "5 niveaux de puissance de l’aspiration",
        "5 livelli di potenza dell’aspirazione"
      ),
      T(
        "Kanalanschluss Ecotube",
        "Duct connection Ecotube",
        "Raccordement de gaine Ecotube",
        "Raccordo canale Ecotube"
      ),
      T(
        "Leistungsaufnahme max. 550 W",
        "Max. power consumption 550 W",
        "Puissance absorbée max. 550 W",
        "Potenza assorbita max. 550 W"
      ),
      T(
        "Funktionen: automatische Abzugssteuerung, Nachlaufautomatik, Filterstandsanzeige (bei Umluft), Powerstufe, Kurzzeitwecker, Reinigungssperre",
        "Functions: automatic extractor control, automatic run-on, filter status display (recirculation), power level, kitchen timer, cleaning lock",
        "Fonctions : commande automatique de l’aspiration, temporisation automatique, indicateur d’état du filtre (recyclage), niveau Power, minuteur, verrouillage pour le nettoyage",
        "Funzioni: controllo automatico dell’aspirazione, funzionamento residuo automatico, indicatore stato filtro (versione filtrante), livello Power, contaminuti, blocco per la pulizia"
      ),
      T(
        "Anordnung der Kochfelder laut Hersteller individuell wählbar",
        "Hob layout can be chosen individually according to the manufacturer",
        "Disposition des tables librement choisie selon le fabricant",
        "Disposizione dei piani scelta liberamente secondo il produttore"
      ),
    ]),
    masse: Object.freeze([mass("breite", "439 mm"), mass("hoehe", "190 mm"), mass("tiefe", "515 mm"), mass("gewicht", "4,41 kg")]),
    bilder: Object.freeze([
      bild("bora-cka2-1.webp", 1152, 864, T(
        "BORA Classic Kochfeldabzug (CKA2): Produktansicht vor hellem Hintergrund",
        "BORA Classic Kochfeldabzug (CKA2): product view on a light background",
        "BORA Classic Kochfeldabzug (CKA2) : vue du produit sur fond clair",
        "BORA Classic Kochfeldabzug (CKA2): vista del prodotto su fondo chiaro"
      ), "https://www.bora.com/de-at/kochfeldabzugssysteme/classic-2-0-cka2"),
      bild("bora-cka2-2.webp", 1152, 864, T(
        "BORA Classic Kochfeldabzug (CKA2AB): Produktansicht vor hellem Hintergrund",
        "BORA Classic Kochfeldabzug (CKA2AB): product view on a light background",
        "BORA Classic Kochfeldabzug (CKA2AB) : vue du produit sur fond clair",
        "BORA Classic Kochfeldabzug (CKA2AB): vista del prodotto su fondo chiaro"
      ), "https://www.bora.com/de-at/kochfeldabzugssysteme/classic-2-0-cka2ab"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T(
          "Ausführung",
          "Version",
          "Version",
          "Versione"
        ),
        optionen: Object.freeze([
          opt("cka2", T(
            "Standard (Edelstahl)",
            "Standard (stainless steel)",
            "Standard (inox)",
            "Standard (acciaio inox)"
          ), "CKA2", "/Images/Wellness/produkte/bora/bora-cka2-1.webp", true),
          opt("cka2ab", T(
            "All Black",
            "All Black",
            "All Black",
            "All Black"
          ), "CKA2AB", "/Images/Wellness/produkte/bora/bora-cka2-2.webp", false),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.bora.com/de-at/kochfeldabzugssysteme/classic-2-0-cka2",
    quellen: Object.freeze(["https://www.bora.com/de-at/kochfeldabzugssysteme/classic-2-0-cka2","https://www.bora.com/de-at/kochfeldabzugssysteme/classic-2-0-cka2ab","https://www.bora.com/de-at/kochfeldabzugssysteme/classic-2-0"]),
    stand: STAND,
  }),
  // ---------------------------------------------------------------- backofen
  Object.freeze({
    slug: "bora-x-bo",
    marke: "bora",
    bereich: "kueche",
    kategorie: "backofen",
    name: "BORA X BO",
    serie: "X BO",
    kurz: T(
      "Dampfbackofen von BORA, der Dampfgarer und Backofen in einem Gerät vereint; 53 l Garraum auf drei Ebenen, Bedienung über ein 19-Zoll-Touchdisplay.",
      "BORA steam oven combining steamer and oven in one appliance; 53 l cavity on three levels, operated via a 19-inch touch display.",
      "Four vapeur BORA réunissant cuiseur vapeur et four en un seul appareil ; cavité de 53 l sur trois niveaux, commande par écran tactile de 19 pouces.",
      "Forno a vapore BORA che unisce vaporiera e forno in un solo apparecchio; cavità da 53 l su tre livelli, comando tramite display touch da 19 pollici."
    ),
    merkmale: Object.freeze([
      T(
        "Garraumvolumen 53 l, 3 Einschubebenen",
        "Cavity volume 53 l, 3 shelf levels",
        "Volume de la cavité 53 l, 3 niveaux",
        "Volume della cavità 53 l, 3 livelli"
      ),
      T(
        "Temperaturbereich 30–230 °C, stufenlose Leistungssteuerung",
        "Temperature range 30–230 °C, stepless power control",
        "Plage de température 30–230 °C, réglage de puissance continu",
        "Intervallo di temperatura 30–230 °C, regolazione continua della potenza"
      ),
      T(
        "Festwasseranschluss, Geruchsfilter aus Aktivkohle mit Ionentauscher",
        "Fixed water connection, odour filter of activated carbon with ion exchanger",
        "Raccordement fixe à l’eau, filtre à odeurs au charbon actif avec échangeur d’ions",
        "Allacciamento fisso all’acqua, filtro odori a carboni attivi con scambiatore di ioni"
      ),
      T(
        "Smart Open: Dampf wird vor dem Öffnen der Tür abgesaugt; automatische Reinigung mit Reinigungskartusche",
        "Smart Open: steam is extracted before the door opens; automatic cleaning with a cleaning cartridge",
        "Smart Open : la vapeur est aspirée avant l’ouverture de la porte ; nettoyage automatique avec cartouche",
        "Smart Open: il vapore viene aspirato prima dell’apertura della porta; pulizia automatica con cartuccia"
      ),
      T(
        "WLAN und Bluetooth, Steuerung mit der App BORA One",
        "Wi-Fi and Bluetooth, control via the BORA One app",
        "Wi-Fi et Bluetooth, commande via l’application BORA One",
        "Wi-Fi e Bluetooth, comando tramite l’app BORA One"
      ),
      T(
        "Nischenmaß (B × H × T): 560 × 592 × 564 mm",
        "Niche size (W × H × D): 560 × 592 × 564 mm",
        "Dimensions de la niche (L × H × P) : 560 × 592 × 564 mm",
        "Misure della nicchia (L × A × P): 560 × 592 × 564 mm"
      ),
      T(
        "Leistungsaufnahme max. 6100 W",
        "Max. power consumption 6100 W",
        "Puissance absorbée max. 6100 W",
        "Potenza assorbita max. 6100 W"
      ),
    ]),
    masse: Object.freeze([mass("breite", "598 mm"), mass("hoehe", "599 mm"), mass("tiefe", "580 mm"), mass("gewicht", "46 kg")]),
    bilder: Object.freeze([
      bild("bora-x-bo-1.webp", 1152, 864, T(
        "BORA X BO (XBO): Produktansicht vor hellem Hintergrund",
        "BORA X BO (XBO): product view on a light background",
        "BORA X BO (XBO) : vue du produit sur fond clair",
        "BORA X BO (XBO): vista del prodotto su fondo chiaro"
      ), "https://www.bora.com/de-at/dampf-und-backsysteme/x-bo-xbo"),
    ]),
    zubehoer: Object.freeze([Object.freeze({ slug: "bora-multischublade", hinweis: T(
        "Multischublade, steuerbar über das Display des X BO",
        "Multi-drawer, controllable via the X BO display",
        "Tiroir multifonction, pilotable depuis l’écran du X BO",
        "Cassetto multifunzione, comandabile dal display dell’X BO"
      ) })]),
    herstellerUrl: "https://www.bora.com/de-at/dampf-und-backsysteme/x-bo-xbo",
    quellen: Object.freeze(["https://www.bora.com/de-at/dampf-und-backsysteme/x-bo-xbo","https://www.bora.com/de-at/dampf-und-backsysteme/x-bo"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "bora-oven-steam",
    marke: "bora",
    bereich: "kueche",
    kategorie: "backofen",
    name: "BORA Oven Steam",
    serie: "Oven Steam",
    kurz: T(
      "Dampfbackofen von BORA mit Heißluft und Dampf (BORA xHeat) und 64 l Garraum auf drei Ebenen; der entnehmbare Wassertank macht laut Hersteller keinen Festwasseranschluss nötig.",
      "BORA steam oven combining hot air and steam (BORA xHeat) with a 64 l cavity on three levels; according to the manufacturer the removable water tank means no fixed water connection is needed.",
      "Four vapeur BORA associant chaleur tournante et vapeur (BORA xHeat), cavité de 64 l sur trois niveaux ; selon le fabricant, le réservoir amovible évite un raccordement fixe à l’eau.",
      "Forno a vapore BORA con aria calda e vapore (BORA xHeat) e cavità da 64 l su tre livelli; secondo il produttore il serbatoio estraibile rende superfluo l’allacciamento fisso all’acqua."
    ),
    merkmale: Object.freeze([
      T(
        "Garraumvolumen 64 l, 3 Einschubebenen",
        "Cavity volume 64 l, 3 shelf levels",
        "Volume de la cavité 64 l, 3 niveaux",
        "Volume della cavità 64 l, 3 livelli"
      ),
      T(
        "Temperaturbereich 30–230 °C",
        "Temperature range 30–230 °C",
        "Plage de température 30–230 °C",
        "Intervallo di temperatura 30–230 °C"
      ),
      T(
        "Backen, Dämpfen, Kombigaren, Airfryen und Regenerieren",
        "Baking, steaming, combination cooking, air frying and regenerating",
        "Cuisson au four, à la vapeur, combinée, air fryer et régénération",
        "Cottura al forno, a vapore, combinata, air fryer e rigenerazione"
      ),
      T(
        "Entnehmbarer Wassertank, nachrüstbar ohne Festwasseranschluss",
        "Removable water tank, can be retrofitted without a fixed water connection",
        "Réservoir d’eau amovible, installable sans raccordement fixe à l’eau",
        "Serbatoio dell’acqua estraibile, installabile senza allacciamento fisso"
      ),
      T(
        "Nischenmaß (B × H × T): 560 × 580 × 554 mm",
        "Niche size (W × H × D): 560 × 580 × 554 mm",
        "Dimensions de la niche (L × H × P) : 560 × 580 × 554 mm",
        "Misure della nicchia (L × A × P): 560 × 580 × 554 mm"
      ),
      T(
        "Leistungsaufnahme max. 3200 W, Absicherung 1 × 16 A",
        "Max. power consumption 3200 W, fuse 1 × 16 A",
        "Puissance absorbée max. 3200 W, protection 1 × 16 A",
        "Potenza assorbita max. 3200 W, protezione 1 × 16 A"
      ),
      T(
        "Energieeffizienzklasse A",
        "Energy efficiency class A",
        "Classe d’efficacité énergétique A",
        "Classe di efficienza energetica A"
      ),
      T(
        "Lieferumfang: Back- und Grillrost, Universalblech, Garbehälter gelocht",
        "Supplied with baking and grill rack, universal tray, perforated cooking container",
        "Fournis : grille de cuisson et de gril, plaque universelle, récipient perforé",
        "In dotazione: griglia per cottura e grill, leccarda universale, contenitore forato"
      ),
    ]),
    masse: Object.freeze([mass("breite", "596 mm"), mass("hoehe", "598 mm"), mass("tiefe", "575 mm"), mass("gewicht", "36,4 kg")]),
    bilder: Object.freeze([
      bild("bora-oven-steam-1.webp", 800, 800, T(
        "BORA Oven Steam: Vorderansicht des Dampfbackofens vor weißem Hintergrund",
        "BORA Oven Steam: front view of the steam oven on a white background",
        "BORA Oven Steam : vue de face du four vapeur sur fond blanc",
        "BORA Oven Steam: vista frontale del forno a vapore su fondo bianco"
      ), "https://shop.bora.com/de-AT/oven-steam-ovens"),
      bild("bora-oven-steam-2.webp", 1600, 1200, T(
        "BORA Oven Steam von vorn mit Gebäck auf drei Ebenen vor grauem Hintergrund",
        "BORA Oven Steam from the front with pastries on three levels against a grey background",
        "BORA Oven Steam de face avec viennoiseries sur trois niveaux, fond gris",
        "BORA Oven Steam frontale con dolci su tre livelli, fondo grigio"
      ), "https://shop.bora.com/de-AT/oven-steam-ovens"),
      bild("bora-oven-steam-3.webp", 1600, 1200, T(
        "BORA Oven Steam mit geöffneter Tür und Gebäck auf drei Ebenen",
        "BORA Oven Steam with open door and pastries on three levels",
        "BORA Oven Steam porte ouverte avec viennoiseries sur trois niveaux",
        "BORA Oven Steam con porta aperta e dolci su tre livelli"
      ), "https://shop.bora.com/de-AT/oven-steam-ovens", "detail"),
      bild("bora-oven-steam-4.webp", 1600, 1200, T(
        "BORA Oven Steam: Hand entnimmt den Wassertank oberhalb der Tür",
        "BORA Oven Steam: a hand removes the water tank above the door",
        "BORA Oven Steam : une main retire le réservoir d’eau au-dessus de la porte",
        "BORA Oven Steam: una mano estrae il serbatoio dell’acqua sopra la porta"
      ), "https://shop.bora.com/de-AT/oven-steam-ovens", "detail"),
    ]),
    herstellerUrl: "https://www.bora.com/de-at/dampf-und-backsysteme/oven-steam",
    quellen: Object.freeze(["https://www.bora.com/de-at/dampf-und-backsysteme/oven-steam","https://www.bora.com/de-at/dampf-und-backsysteme/ovens","https://shop.bora.com/de-AT/oven-steam-ovens"]),
    stand: STAND,
    preis: Object.freeze({ art: "uvp-ab", bezeichnung: "herstellerpreis", uvpAb: 3295, stand: STAND, quelle: "https://shop.bora.com/de-AT/oven-steam-ovens" }),
  }),
  // ---------------------------------------------------------------- waermeschublade
  Object.freeze({
    slug: "bora-multischublade",
    marke: "bora",
    bereich: "kueche",
    kategorie: "waermeschublade",
    name: "BORA Multischublade",
    serie: "Multischublade",
    kurz: T(
      "Wärmeschublade von BORA zum Vorwärmen von Geschirr, Regenerieren, Auftauen und Niedertemperaturgaren; Bedienung über Touchscreen oder das Display des BORA X BO.",
      "BORA warming drawer for preheating dishes, regenerating, defrosting and low-temperature cooking; operated via touchscreen or the BORA X BO display.",
      "Tiroir chauffant BORA pour préchauffer la vaisselle, régénérer, décongeler et cuire à basse température ; commande par écran tactile ou depuis l’écran du BORA X BO.",
      "Cassetto scaldavivande BORA per preriscaldare stoviglie, rigenerare, scongelare e cuocere a bassa temperatura; comando tramite touchscreen o il display del BORA X BO."
    ),
    merkmale: Object.freeze([
      T(
        "Zwei Höhen: 140 mm und 290 mm",
        "Two heights: 140 mm and 290 mm",
        "Deux hauteurs : 140 mm et 290 mm",
        "Due altezze: 140 mm e 290 mm"
      ),
      T(
        "Grifflose Front: Möbelfront passend zum Küchenschrank oder BORA Glasfront",
        "Handleless front: furniture front matching the cabinet or BORA glass front",
        "Façade sans poignée : façade de meuble assortie ou façade en verre BORA",
        "Frontale senza maniglia: anta del mobile o frontale in vetro BORA"
      ),
      T(
        "Voreingestellte Programme, Temperatur und Dauer individuell einstellbar",
        "Preset programmes; temperature and duration adjustable",
        "Programmes préréglés ; température et durée réglables",
        "Programmi preimpostati; temperatura e durata regolabili"
      ),
      T(
        "Schwarzer Glasboden",
        "Black glass base",
        "Fond en verre noir",
        "Fondo in vetro nero"
      ),
    ]),
    bilder: Object.freeze([
      bild("bora-multischublade-1.webp", 558, 177, T(
        "BORA Multischublade mit 140 mm Höhe: schwarze Glasfront, Edelstahlkorpus",
        "BORA multi-drawer 140 mm high: black glass front, stainless steel body",
        "BORA tiroir multifonction de 140 mm de haut : façade en verre noir, corps en inox",
        "BORA cassetto multifunzione alto 140 mm: frontale in vetro nero, corpo in acciaio inox"
      ), "https://www.bora.com/de-at/dampf-und-backsysteme/multischublade"),
      bild("bora-multischublade-2.webp", 870, 431, T(
        "BORA Multischublade mit 290 mm Höhe: schwarze Glasfront, Edelstahlkorpus",
        "BORA multi-drawer 290 mm high: black glass front, stainless steel body",
        "BORA tiroir multifonction de 290 mm de haut : façade en verre noir, corps en inox",
        "BORA cassetto multifunzione alto 290 mm: frontale in vetro nero, corpo in acciaio inox"
      ), "https://www.bora.com/de-at/dampf-und-backsysteme/multischublade"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T(
          "Höhe",
          "Height",
          "Hauteur",
          "Altezza"
        ),
        optionen: Object.freeze([
          opt("140-mm", "140 mm", null, "/Images/Wellness/produkte/bora/bora-multischublade-1.webp", true),
          opt("290-mm", "290 mm", null, "/Images/Wellness/produkte/bora/bora-multischublade-2.webp", false),
        ]),
      }),
    ]),
    zubehoer: Object.freeze([Object.freeze({ slug: "bora-x-bo", hinweis: T(
        "Steuerung auch über das Display des X BO",
        "Can also be controlled via the X BO display",
        "Pilotable aussi depuis l’écran du X BO",
        "Comandabile anche dal display dell’X BO"
      ) })]),
    herstellerUrl: "https://www.bora.com/de-at/dampf-und-backsysteme/multischublade",
    quellen: Object.freeze(["https://www.bora.com/de-at/dampf-und-backsysteme/multischublade"]),
    stand: STAND,
  }),
  // ---------------------------------------------------------------- geschirrspueler
  Object.freeze({
    slug: "bora-dish",
    marke: "bora",
    bereich: "kueche",
    kategorie: "geschirrspueler",
    name: "BORA Dish",
    serie: "Dish",
    kurz: T(
      "Vollintegrierter Geschirrspüler von BORA für bis zu 7 Maßgedecke, mit automatischer Dosierung BORA eDose und aktiver Trocknung BORA xDry; laut Hersteller ab März 2027 erhältlich.",
      "Fully integrated BORA dishwasher for up to 7 place settings, with BORA eDose automatic dosing and BORA xDry active drying; available from March 2027 according to the manufacturer.",
      "Lave-vaisselle tout intégrable BORA pour 7 couverts, avec dosage automatique BORA eDose et séchage actif BORA xDry ; disponible à partir de mars 2027 selon le fabricant.",
      "Lavastoviglie a scomparsa totale BORA per 7 coperti, con dosaggio automatico BORA eDose e asciugatura attiva BORA xDry; disponibile da marzo 2027 secondo il produttore."
    ),
    merkmale: Object.freeze([
      T(
        "Programme: Eco, xSpeed, Intensiv, Sanft und Maschinenpflege",
        "Programmes: Eco, xSpeed, Intensive, Gentle and machine care",
        "Programmes : Eco, xSpeed, Intensif, Délicat et entretien",
        "Programmi: Eco, xSpeed, Intensivo, Delicato e cura della macchina"
      ),
      T(
        "Bis zu 7 Maßgedecke",
        "Up to 7 place settings",
        "Jusqu’à 7 couverts",
        "Fino a 7 coperti"
      ),
      T(
        "Nischenmaß 600 × 613 × 555 mm; hochgesetzter Einbau unter der Arbeitsplatte oder im Hochschrank möglich",
        "Niche size 600 × 613 × 555 mm; raised installation under the worktop or in a tall cabinet possible",
        "Niche 600 × 613 × 555 mm ; encastrement surélevé sous le plan de travail ou en colonne possible",
        "Nicchia 600 × 613 × 555 mm; installazione rialzata sotto il piano o in colonna possibile"
      ),
      T(
        "Möbelfront bis 9 kg, Schlepp- oder Festtür",
        "Furniture front up to 9 kg, sliding or fixed door",
        "Façade de meuble jusqu’à 9 kg, porte glissante ou fixe",
        "Anta del mobile fino a 9 kg, porta scorrevole o fissa"
      ),
      T(
        "Steuerung und Status über die App BORA One",
        "Control and status via the BORA One app",
        "Commande et état via l’application BORA One",
        "Comando e stato tramite l’app BORA One"
      ),
      T(
        "Optional: Wechselkorb mit Schienensystem",
        "Optional: exchange basket with rail system",
        "En option : panier de rechange avec système de rails",
        "Opzionale: cestello di ricambio con sistema a binari"
      ),
    ]),
    masse: Object.freeze([mass("breite", "597 mm"), mass("hoehe", "610 mm"), mass("tiefe", "550 mm"), mass("gewicht", "37 kg")]),
    bilder: Object.freeze([
      bild("bora-dish-1.webp", 960, 960, T(
        "BORA Dish: Geschirrspüler mit geöffneter Tür und ausgezogenem Geschirrkorb",
        "BORA Dish: dishwasher with open door and pulled-out basket",
        "BORA Dish : lave-vaisselle porte ouverte, panier sorti",
        "BORA Dish: lavastoviglie con porta aperta e cestello estratto"
      ), "https://www.bora.com/de-at/reinigungs-und-spuelsysteme/dish"),
    ]),
    herstellerUrl: "https://www.bora.com/de-at/reinigungs-und-spuelsysteme/dish",
    quellen: Object.freeze(["https://www.bora.com/de-at/reinigungs-und-spuelsysteme/dish","https://www.bora.com/de-at/reinigungs-und-spuelsysteme/reinigungs-und-spuelsysteme-dish"]),
    stand: STAND,
  }),
  // ---------------------------------------------------------------- kuehlen
  Object.freeze({
    slug: "bora-cool",
    marke: "bora",
    bereich: "kueche",
    kategorie: "kuehlen",
    name: "BORA Cool",
    serie: "Cool",
    kurz: T(
      "Einbau-Kühlgerät von BORA mit Umluftkühlung, wahlweise mit oder ohne Gefrierfach im oberen Teil.",
      "BORA built-in refrigerator with fan-assisted cooling, with or without a freezer compartment at the top.",
      "Réfrigérateur encastrable BORA à froid ventilé, avec ou sans compartiment congélateur en partie haute.",
      "Frigorifero da incasso BORA con raffreddamento ventilato, con o senza vano congelatore nella parte superiore."
    ),
    merkmale: Object.freeze([
      T(
        "Energieeffizienzklasse D, Luftschallemissionsklasse B",
        "Energy efficiency class D, airborne noise class B",
        "Classe d’efficacité énergétique D, classe d’émission de bruit B",
        "Classe di efficienza energetica D, classe di emissione acustica B"
      ),
      T(
        "Umluftkühlung; Sonderfunktionen Power Cool, Eco und Holiday-Mode",
        "Fan-assisted cooling; special functions Power Cool, Eco and Holiday mode",
        "Froid ventilé ; fonctions Power Cool, Eco et mode vacances",
        "Raffreddamento ventilato; funzioni Power Cool, Eco e modalità vacanza"
      ),
      T(
        "Grundausstattung („Good“) im Lieferumfang: 4 Glasplatten, 3 Konservenabsteller, 1 Flaschenabsteller, Multitablett, 3 Fresh-zero-Wannen, Lüfterabdeckung mit Filter und indirekter Beleuchtung; ein erweitertes Ausstattungspaket ist laut Hersteller wählbar",
        "Basic equipment (“Good”) included: 4 glass shelves, 3 door racks, 1 bottle rack, multi-tray, 3 Fresh zero drawers, fan cover with filter and indirect lighting; an extended equipment package can be chosen according to the manufacturer",
        "Équipement de base (« Good ») fourni : 4 clayettes en verre, 3 balconnets, 1 porte-bouteilles, multi-plateau, 3 bacs Fresh zero, cache du ventilateur avec filtre et éclairage indirect ; un pack d’équipement étendu est disponible selon le fabricant",
        "Dotazione di base (“Good”) inclusa: 4 ripiani in vetro, 3 balconcini, 1 portabottiglie, multivassoio, 3 cassetti Fresh zero, copertura ventola con filtro e luce indiretta; secondo il produttore è disponibile un pacchetto di dotazione esteso"
      ),
    ]),
    bilder: Object.freeze([
      bild("bora-cool-1.webp", 473, 1080, T(
        "BORA Cool ohne Gefrierfach mit geöffneter Tür",
        "BORA Cool without freezer compartment, door open",
        "BORA Cool sans compartiment congélateur, porte ouverte",
        "BORA Cool senza vano congelatore, porta aperta"
      ), "https://www.bora.com/de-at/kuehl-gefriersysteme/cool"),
      bild("bora-cool-2.webp", 473, 1080, T(
        "BORA Cool mit Gefrierfach mit geöffneter Tür",
        "BORA Cool with freezer compartment, door open",
        "BORA Cool avec compartiment congélateur, porte ouverte",
        "BORA Cool con vano congelatore, porta aperta"
      ), "https://www.bora.com/de-at/kuehl-gefriersysteme/cool"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T(
          "Variante",
          "Variant",
          "Variante",
          "Variante"
        ),
        optionen: Object.freeze([
          opt("ohne-gefrierfach", T(
            "ohne Gefrierfach",
            "without freezer compartment",
            "sans compartiment congélateur",
            "senza vano congelatore"
          ), null, "/Images/Wellness/produkte/bora/bora-cool-1.webp", true),
          opt("mit-gefrierfach", T(
            "mit Gefrierfach",
            "with freezer compartment",
            "avec compartiment congélateur",
            "con vano congelatore"
          ), null, "/Images/Wellness/produkte/bora/bora-cool-2.webp", false),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.bora.com/de-at/kuehl-gefriersysteme/cool",
    quellen: Object.freeze(["https://www.bora.com/de-at/kuehl-gefriersysteme/cool","https://www.bora.com/de-at/kuehl-gefriersysteme"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "bora-cool-combi",
    marke: "bora",
    bereich: "kueche",
    kategorie: "kuehlen",
    name: "BORA Cool Combi",
    serie: "Cool Combi",
    kurz: T(
      "Einbau-Kühl-Gefrierkombination von BORA mit Umluftkühlung und No Frost im Gefrierteil, wahlweise mit oder ohne Festwasseranschluss.",
      "BORA built-in fridge-freezer with fan-assisted cooling and No Frost freezer, with or without a fixed water connection.",
      "Réfrigérateur-congélateur encastrable BORA à froid ventilé et congélateur No Frost, avec ou sans raccordement fixe à l’eau.",
      "Frigocongelatore da incasso BORA con raffreddamento ventilato e congelatore No Frost, con o senza allacciamento idrico fisso."
    ),
    merkmale: Object.freeze([
      T(
        "Energieeffizienzklasse D, Luftschallemissionsklasse B",
        "Energy efficiency class D, airborne noise class B",
        "Classe d’efficacité énergétique D, classe d’émission de bruit B",
        "Classe di efficienza energetica D, classe di emissione acustica B"
      ),
      T(
        "No Frost; Sonderfunktionen Power Freeze und Party-Funktion",
        "No Frost; special functions Power Freeze and party function",
        "No Frost ; fonctions Power Freeze et fonction fête",
        "No Frost; funzioni Power Freeze e funzione party"
      ),
      T(
        "Grundausstattung („Good“) im Lieferumfang: 3 Glasplatten, 1 Konservenabsteller, 1 Flaschenabsteller, Multitablett, 2 Fresh-zero-Wannen, Lüfterabdeckung mit Filter und indirekter Beleuchtung; ein erweitertes Ausstattungspaket ist laut Hersteller wählbar",
        "Basic equipment (“Good”) included: 3 glass shelves, 1 door rack, 1 bottle rack, multi-tray, 2 Fresh zero drawers, fan cover with filter and indirect lighting; an extended equipment package can be chosen according to the manufacturer",
        "Équipement de base (« Good ») fourni : 3 clayettes en verre, 1 balconnet, 1 porte-bouteilles, multi-plateau, 2 bacs Fresh zero, cache du ventilateur avec filtre et éclairage indirect ; un pack d’équipement étendu est disponible selon le fabricant",
        "Dotazione di base (“Good”) inclusa: 3 ripiani in vetro, 1 balconcino, 1 portabottiglie, multivassoio, 2 cassetti Fresh zero, copertura ventola con filtro e luce indiretta; secondo il produttore è disponibile un pacchetto di dotazione esteso"
      ),
    ]),
    bilder: Object.freeze([
      bild("bora-cool-combi-1.webp", 384, 877, T(
        "BORA Cool Combi ohne Festwasseranschluss mit geöffneten Türen",
        "BORA Cool Combi without fixed water connection, doors open",
        "BORA Cool Combi sans raccordement à l’eau, portes ouvertes",
        "BORA Cool Combi senza allacciamento idrico, porte aperte"
      ), "https://www.bora.com/de-at/kuehl-gefriersysteme/cool-combi"),
      bild("bora-cool-combi-2.webp", 384, 877, T(
        "BORA Cool Combi mit Festwasseranschluss mit geöffneten Türen",
        "BORA Cool Combi with fixed water connection, doors open",
        "BORA Cool Combi avec raccordement à l’eau, portes ouvertes",
        "BORA Cool Combi con allacciamento idrico, porte aperte"
      ), "https://www.bora.com/de-at/kuehl-gefriersysteme/cool-combi"),
    ]),
    ausfuehrungen: Object.freeze([
      Object.freeze({
        gruppe: T(
          "Variante",
          "Variant",
          "Variante",
          "Variante"
        ),
        optionen: Object.freeze([
          opt("ohne-festwasseranschluss", T(
            "ohne Festwasseranschluss",
            "without fixed water connection",
            "sans raccordement fixe à l’eau",
            "senza allacciamento idrico fisso"
          ), null, "/Images/Wellness/produkte/bora/bora-cool-combi-1.webp", true),
          opt("mit-festwasseranschluss", T(
            "mit Festwasseranschluss",
            "with fixed water connection",
            "avec raccordement fixe à l’eau",
            "con allacciamento idrico fisso"
          ), null, "/Images/Wellness/produkte/bora/bora-cool-combi-2.webp", false),
        ]),
      }),
    ]),
    herstellerUrl: "https://www.bora.com/de-at/kuehl-gefriersysteme/cool-combi",
    quellen: Object.freeze(["https://www.bora.com/de-at/kuehl-gefriersysteme/cool-combi","https://www.bora.com/de-at/kuehl-gefriersysteme"]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "bora-cool-combi-xl",
    marke: "bora",
    bereich: "kueche",
    kategorie: "kuehlen",
    name: "BORA Cool Combi XL",
    serie: "Cool Combi XL",
    kurz: T(
      "Einbau-Kühl-Gefrierkombination von BORA mit größerem Kühlraum, Umluftkühlung und No Frost; ohne Festwasseranschluss.",
      "BORA built-in fridge-freezer with a larger fridge section, fan-assisted cooling and No Frost; no fixed water connection required.",
      "Réfrigérateur-congélateur encastrable BORA avec partie réfrigérateur agrandie, froid ventilé et No Frost ; sans raccordement fixe à l’eau.",
      "Frigocongelatore da incasso BORA con vano frigo più ampio, raffreddamento ventilato e No Frost; senza allacciamento idrico fisso."
    ),
    merkmale: Object.freeze([
      T(
        "Energieeffizienzklasse D, Luftschallemissionsklasse B",
        "Energy efficiency class D, airborne noise class B",
        "Classe d’efficacité énergétique D, classe d’émission de bruit B",
        "Classe di efficienza energetica D, classe di emissione acustica B"
      ),
      T(
        "No Frost; Sonderfunktionen Power Freeze und Party-Funktion",
        "No Frost; special functions Power Freeze and party function",
        "No Frost ; fonctions Power Freeze et fonction fête",
        "No Frost; funzioni Power Freeze e funzione party"
      ),
      T(
        "Grundausstattung („Good“) im Lieferumfang: Geruchsfilter, 4 Glasplatten, 2 Konservenabsteller, 1 Flaschenabsteller, Multitablett, 2 Fresh-zero-Wannen, Trennebene mit Flaschenmatte, 3 Gefrierschubladen; ein erweitertes Ausstattungspaket ist laut Hersteller wählbar",
        "Basic equipment (“Good”) included: odour filter, 4 glass shelves, 2 door racks, 1 bottle rack, multi-tray, 2 Fresh zero drawers, divider with bottle mat, 3 freezer drawers; an extended equipment package can be chosen according to the manufacturer",
        "Équipement de base (« Good ») fourni : filtre à odeurs, 4 clayettes en verre, 2 balconnets, 1 porte-bouteilles, multi-plateau, 2 bacs Fresh zero, séparation avec tapis à bouteilles, 3 tiroirs congélateur ; un pack d’équipement étendu est disponible selon le fabricant",
        "Dotazione di base (“Good”) inclusa: filtro odori, 4 ripiani in vetro, 2 balconcini, 1 portabottiglie, multivassoio, 2 cassetti Fresh zero, divisorio con tappetino portabottiglie, 3 cassetti congelatore; secondo il produttore è disponibile un pacchetto di dotazione esteso"
      ),
    ]),
    bilder: Object.freeze([
      bild("bora-cool-combi-xl-1.webp", 384, 877, T(
        "BORA Cool Combi XL mit geöffneten Türen",
        "BORA Cool Combi XL, doors open",
        "BORA Cool Combi XL, portes ouvertes",
        "BORA Cool Combi XL, porte aperte"
      ), "https://www.bora.com/de-at/kuehl-gefriersysteme/cool-combi-xl"),
    ]),
    herstellerUrl: "https://www.bora.com/de-at/kuehl-gefriersysteme/cool-combi-xl",
    quellen: Object.freeze(["https://www.bora.com/de-at/kuehl-gefriersysteme/cool-combi-xl","https://www.bora.com/de-at/kuehl-gefriersysteme"]),
    stand: STAND,
  }),
  // ---------------------------------------------------------------- gefrieren
  Object.freeze({
    slug: "bora-freeze",
    marke: "bora",
    bereich: "kueche",
    kategorie: "gefrieren",
    name: "BORA Freeze",
    serie: "Freeze",
    kurz: T(
      "Einbau-Gefrierschrank von BORA mit No Frost und Ice Maker für den Festwasseranschluss.",
      "BORA built-in freezer with No Frost and ice maker for a fixed water connection.",
      "Congélateur encastrable BORA No Frost avec machine à glaçons sur raccordement fixe à l’eau.",
      "Congelatore da incasso BORA No Frost con ice maker per allacciamento idrico fisso."
    ),
    merkmale: Object.freeze([
      T(
        "Energieeffizienzklasse E, Luftschallemissionsklasse B",
        "Energy efficiency class E, airborne noise class B",
        "Classe d’efficacité énergétique E, classe d’émission de bruit B",
        "Classe di efficienza energetica E, classe di emissione acustica B"
      ),
      T(
        "Power Freeze, MaxIce (bis 1,2 kg Eiswürfel) und Tür-Alarm",
        "Power Freeze, MaxIce (up to 1.2 kg of ice cubes) and door alarm",
        "Power Freeze, MaxIce (jusqu’à 1,2 kg de glaçons) et alarme de porte",
        "Power Freeze, MaxIce (fino a 1,2 kg di cubetti) e allarme porta"
      ),
      T(
        "Grundausstattung („Good“) im Lieferumfang: Eiswürfelbehälter, Eiswürfelzange, Multitablett; ein erweitertes Ausstattungspaket ist laut Hersteller wählbar",
        "Basic equipment (“Good”) included: ice cube container, ice tongs, multi-tray; an extended equipment package can be chosen according to the manufacturer",
        "Équipement de base (« Good ») fourni : bac à glaçons, pince à glaçons, multi-plateau ; un pack d’équipement étendu est disponible selon le fabricant",
        "Dotazione di base (“Good”) inclusa: contenitore per cubetti, pinza per ghiaccio, multivassoio; secondo il produttore è disponibile un pacchetto di dotazione esteso"
      ),
    ]),
    bilder: Object.freeze([
      bild("bora-freeze-1.webp", 1080, 1080, T(
        "BORA Freeze mit geöffneter Tür und Gefrierschubladen",
        "BORA Freeze with open door and freezer drawers",
        "BORA Freeze porte ouverte avec tiroirs de congélation",
        "BORA Freeze con porta aperta e cassetti congelatore"
      ), "https://www.bora.com/de-at/kuehl-gefriersysteme/freeze"),
    ]),
    herstellerUrl: "https://www.bora.com/de-at/kuehl-gefriersysteme/freeze",
    quellen: Object.freeze(["https://www.bora.com/de-at/kuehl-gefriersysteme/freeze","https://www.bora.com/de-at/kuehl-gefriersysteme"]),
    stand: STAND,
  }),
]);
