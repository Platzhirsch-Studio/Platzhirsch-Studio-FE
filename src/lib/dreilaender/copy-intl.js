// src/lib/dreilaender/copy-intl.js – EN-, FR- und IT-Fassung des Dreiländer-Rechners
// (/<locale>/dreilaender-rechner).
//
// Sprachen-Ausbau 01.11.2026 (Gruppe schweiz-service): FR für Romandie und
// Frankreich, IT für Tessin und Italien, EN international. Mastertext ist die
// deutsche Fassung in den Komponenten (src/components/Labs/Dreilaender/*:
// rules.js, calc.js, rate.js, DreilaenderClient.js, PriceCalculator.js,
// DreilaenderMap.js, page.js). Steuer- und Zollaussagen sind WÖRTLICH
// übertragen – keine neue Aussage, keine Vereinfachung, Hinweis „keine Steuer-
// oder Rechtsberatung“ in jeder Sprache.
//
// Nur serverseitig laden (page.js). Die Client-Insel bekommt `client` als
// kleines, serialisierbares Objekt (keine Funktionen; Platzhalter {name}).
// DE liefert null: die Komponenten tragen den deutschen Text selbst.
// Zahlen bleiben im Format de-AT (format.js), wie auf der deutschen Seite.
// Französische Typografie: frenchTypography() (Hotel-Modul) plus geschützte
// Leerzeichen vor % und € (frNumbers).
//
// Reines Modul (keine "@/..."-Importe, kein React): node --test lädt es.
import { frenchTypography } from "../hotel/content-intl.js";
import { PLACES } from "../../components/Labs/Dreilaender/geo.js";

export const PATH = "/dreilaender-rechner";
export const INTL_LOCALES = Object.freeze(["en", "fr", "it"]);

const NBSP = " ";
/** Geschützte Leerzeichen zwischen Zahl und % bzw. € (FR). */
export function frNumbers(value) {
  if (typeof value === "string") return value.replace(/(\d) (%|€)/g, `$1${NBSP}$2`).replace(/(\d) (\d{3})\b/g, `$1${NBSP}$2`);
  if (Array.isArray(value)) return value.map(frNumbers);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, frNumbers(v)]));
  return value;
}

// Ortsnamen: amtliche bzw. übliche Namen der Sprache; sonst wie DE.
const PLACE_NAMES = {
  en: { zuerich: "Zurich", rheintal: { name: "St. Gallen Rhine Valley", short: "Rhine Valley" } },
  fr: { stgallen: "Saint-Gall", zuerich: "Zurich", chur: "Coire", konstanz: "Constance", rheintal: { name: "Rheintal saint-gallois", short: "Rheintal" } },
  it: { stgallen: "San Gallo", zuerich: "Zurigo", chur: "Coira", konstanz: "Costanza", rheintal: { name: "Valle del Reno sangallese", short: "Valle del Reno" } },
};
const TIME = { en: ["approx.", "min", "minutes"], fr: ["env.", "min", "minutes"], it: ["ca.", "min", "minuti"] };

function placesFor(locale) {
  const names = PLACE_NAMES[locale] || {};
  const [pre, unit, long] = TIME[locale];
  return Object.fromEntries(
    PLACES.map((p) => {
      const [a, b] = p.minutes;
      const span = a === b ? `${a}` : `${a}–${b}`;
      const n = names[p.id];
      const override = typeof n === "string" ? { name: n } : n || {};
      return [p.id, { ...override, label: `${pre} ${span} ${unit}`, labelLong: `${pre} ${span} ${long}` }];
    })
  );
}

// ---------------------------------------------------------------------------
// EN

const EN = {
  meta: {
    title: "Three-country calculator for CH, FL and DE",
    description:
      "Map of the three-country region with driving times from Lochau and an estimate calculator for customers from Switzerland, Liechtenstein and Germany.",
    ogTitle: "Three-country calculator: buying from CH, FL and DE",
    name: "Three-country calculator",
    crumb: "Three-country calculator",
    appFeatures: ["Map with driving times from Lochau", "Estimate in CHF or EUR by route across the border", "ECB reference rate"],
  },
  page: {
    badge: "Three-country calculator",
    title: "One showroom, four countries.",
    lead: "How far is it to Lochau, and what will a piece of furniture cost in the end at your home – in Switzerland, Liechtenstein or Germany? The map and the calculator answer this in seconds.",
    vatCh: "CH/FL VAT",
    vatChValue: "8.1%",
    vatAt: "AT VAT",
    vatAtValue: "20%",
    rate: "€1 in CHF",
    rateFrom: "{label} of {date}",
    rateFallback: " (current rate not available)",
    rateNone: "Rate currently not available",
    nav: "On this page",
    toMap: "To the map",
    toCalc: "Straight to the calculator",
    howTitle: "How we calculate",
    how: [
      "The starting point is the Austrian gross price including 20% VAT. When exported to Switzerland or Liechtenstein, Austrian VAT does not apply.",
      "On import, 8.1% Swiss VAT is added – on delivery, on the goods plus transport.",
      "Customs clearance fees and delivery costs are example values. Forwarders do not publish prices.",
      "The rate is the ECB reference rate, cached for 12 hours. Swiss customs uses its own daily rate.",
    ],
    sourcesTitle: "Public sources",
    sources: {
      "https://www.wko.at/aussenwirtschaft/exporthandbuch/touristenexport": "WKO – tourist export (in German)",
      "https://www.wko.at/vlbg/handel/oeffnungszeiten-zollstellen.pdf": "WKO Vorarlberg – customs offices (in German)",
      "https://www.wko.at/oe/faq-eu-oss-fuer-den-handel": "WKO – EU OSS FAQ (in German)",
      "https://www.seco.admin.ch/de/entsendung-kosten-und-sanktionen": "SECO – posting of workers (in German)",
      "https://www.llv.li/de/landesverwaltung/auslaender-und-passamt/dienstleistungserbringung-gdl-/unternehmen-mit-sitz-in-eu-ewr/bis-90-tage": "LLV – services in Liechtenstein (in German)",
      "https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html": "ECB – reference rates",
    },
    hand: {
      aria: "From hand drawing to rendering",
      text: "Our process applies here too: we look at the place, Harald Menghin draws the concept by hand, then come 3D planning and rendering.",
      link: "How we work",
    },
    disclaimer:
      "An estimate, not tax or legal advice. Your entries stay in your browser and are not stored or transmitted. The map is our own graphic and does not load any map services.",
  },
  client: {
    ui: {
      mapStep: "1 · Map",
      mapTitle: "Lochau is right in the middle",
      mapLead: "Tap a place: driving time, delivery, installation and tax for each country at a glance.",
      live: "{place}, {country}, {time} from Lochau",
      figcaption: "Schematic map. Driving times by car from Lochau: estimates without traffic or waiting time at the border.",
      details: "Details",
      chips: "Choose a place (arrow keys change the place)",
      fromLochau: "from Lochau",
      estimate: "(estimate)",
      steuer: "Tax",
      lieferung: "Delivery",
      montage: "Installation",
      cta: "Calculate the price {forName}",
      calcStep: "2 · Price calculator",
      calcTitle: "What will the furniture cost me at home?",
      calcLead: "Enter the Austrian gross price. We show what it becomes in Switzerland, Liechtenstein or Germany – depending on the route across the border.",
    },
    calcUi: {
      estimateBadge: "Estimate – example value",
      savings: "≈ {min}–{max}% below the AT gross price",
      notCheaper: "not cheaper than the AT gross price",
      condition: "Condition",
      yourPrice: "Your price",
      atGross: "AT gross",
      showCalc: "Show calculation",
      hideCalc: "Hide calculation",
      sum: "Total",
      conversion: "Converted at €1 = {rate} CHF; customs uses its own daily rate. Mean ≈ {mid}.",
      errEmpty: "Please enter a gross price in euros.",
      errNan: "Please enter numbers only, e.g. 25.000 or 1890,50.",
      errZero: "Please enter an amount above €0.",
      errMax: "Please enter at most €2.000.000.",
      errCalc: "We cannot calculate this entry.",
      legend: "Where is the furniture going?",
      amountLabel: "Austrian gross price (incl. 20% VAT)",
      amountHelp: "For example the price on the price tag in the showroom.",
      priceIn: "Your price {inName}",
      shortAbholung: "Collection",
      shortLieferung: "Delivery",
      detailsLink: "Details and calculation",
      includeDelivery: "Include delivery costs",
      includeDeliveryNote: "(estimate, binding only in the quote)",
      net: "net",
      noRate: "Without a valid rate we do not show amounts in francs. We are happy to clarify the price personally.",
      empty: "Enter an amount on the left.",
      disclaimerTitle: "An estimate, not tax advice.",
      disclaimerText:
        "The calculation shows typical routes as things stand today. Forwarders’ fees and delivery costs are example values, customs uses its own daily rate. You receive your binding quote personally.",
      termin: "Request a visit",
      kontakt: "Contact",
    },
    map: {
      title: "Map of the three-country region with Lochau at the centre",
      desc: "Schematic map of Lake Constance and the Rhine Valley. Places in Austria, Germany, Switzerland and Liechtenstein can be selected and show driving time and notes on delivery, installation and tax. Use the arrow keys to change the place.",
      // Kartenbeschriftung: Ortsname Bodensee (übersetzter Name ist länger und überlappt Lindau, QA 01.11.2026).
      lake: "Bodensee",
      inset: "Detail 5×",
      countries: { DE: "GERMANY", AT: "AUSTRIA", CH: "SWITZERLAND", FL: "FL" },
    },
    countries: {
      CH: {
        name: "Switzerland",
        inName: "in Switzerland",
        forName: "for Switzerland",
        headline: "8.1% Swiss VAT instead of 20% Austrian VAT",
        steuer: [
          "Furniture has been duty-free since 1 January 2024. A customs declaration is still required.",
          "On import, 8.1% Swiss VAT is due. Austrian VAT does not apply on export.",
          "Compared with the Austrian gross price, the tax is arithmetically about 9.9% lower (1.081 ÷ 1.20).",
        ],
        lieferung: [
          "Self-collection with an export certificate: only if you export the goods yourself – in your own car, a hired van or a trailer. It does not work with a forwarder.",
          "The Lustenau/Au customs office confirms export around the clock, Höchst/St. Margrethen Mon–Fri 8:00–16:00.",
          "Delivery without installation: you are the importer. The forwarder declares the import; you pay VAT and the customs clearance fee on receipt.",
        ],
        montage: [
          "Pure delivery without installation does not require fitters to register.",
          "For kitchens and built-in wardrobes, Switzerland requires registration from the first day with 8 days’ notice.",
          "Kitchen or built-in furniture with installation: we clarify this personally.",
        ],
      },
      FL: {
        name: "Liechtenstein",
        inName: "in Liechtenstein",
        forName: "for Liechtenstein",
        headline: "Swiss customs and VAT territory: 8.1% VAT",
        steuer: [
          "Liechtenstein belongs to the Swiss customs and VAT territory: 8.1% VAT, the same routes as in Switzerland.",
          "With residence in Liechtenstein, the export from Austria counts as tax-free (residence outside the EU).",
        ],
        lieferung: [
          "Self-collection with an export certificate as in Switzerland – only if you transport the goods yourself.",
          "Tisis/Schaanwald customs office: Mon–Fri 7:30–16:30. Lustenau/Au is staffed around the clock.",
        ],
        montage: [
          "Liechtenstein is an EEA member: fitters follow a separate registration procedure, without the 8-day waiting period.",
          "Dates and process of the installation: we clarify this personally.",
        ],
      },
      DE: {
        name: "Germany",
        inName: "in Germany",
        forName: "for Germany",
        headline: "Collection with 20% AT VAT. On delivery, 19% German VAT applies only if invoiced via the EU OSS – see the note below.",
        steuer: [
          "Collection in Lochau: Austrian VAT of 20% applies.",
          "Delivery of loose furniture to Germany: 19% German VAT only if Platzhirsch invoices via the EU OSS (EU-wide threshold of €10,000 net exceeded), otherwise 20% Austrian VAT. Which case applies is stated bindingly in the quote.",
        ],
        lieferung: ["Delivery costs to Germany: we clarify this personally."],
        montage: [
          "Kitchens and built-in furniture with installation in Germany are not handled via the OSS.",
          "Kitchen or built-in furniture with installation: we clarify this personally.",
        ],
      },
      AT: {
        name: "Austria",
        inName: "in Austria",
        forName: "for Austria",
        headline: "Domestic price with 20% VAT",
        steuer: ["In Austria the stated gross price including 20% VAT applies."],
        lieferung: ["Delivery within Austria: we clarify this personally."],
        montage: ["Installation: we clarify this personally."],
      },
    },
    calc: {
      personal: "We clarify this personally.",
      sources: {
        "Richtwert, verbindlich erst im Angebot": "Estimate, binding only in the quote",
        "Richtwert – die genauen Kosten nennen wir auf Anfrage.": "Estimate – we tell you the exact costs on request.",
        "wie Schweiz angenommen – Richtwert – die genauen Kosten nennen wir auf Anfrage.": "assumed as for Switzerland – estimate – we tell you the exact costs on request.",
      },
      chPickupTitle: "Self-collection with export certificate",
      chPickupSubtitle: "You collect in Lochau and export the goods yourself.",
      chPickupBadge: "no Swiss VAT registration needed",
      chNet: "Invoice net (without AT VAT)",
      chDeposit: "AT VAT 20% as a deposit – refunded after the export certificate (U34)",
      chImportVat: "Swiss import VAT 8.1% (at the border, e.g. QuickZoll)",
      chTransport: "Own transport (van/trailer)",
      chPickupReq: [
        "Residence outside the EU (Switzerland or Liechtenstein), no additional residence in the EU",
        "Invoice over €75, export within 3 months",
        "Transport by yourself – not with a forwarder",
      ],
      chPickupReqCh: "Confirm export: Lustenau/Au 0–24 h, Höchst/St. Margrethen Mon–Fri 8:00–16:00",
      chPickupReqFl: "Confirm export: Lustenau/Au 0–24 h or Tisis/Schaanwald Mon–Fri 7:30–16:30",
      chPickupHint: "Suitable above all for lighting, accessories and smaller furniture.",
      chDeliveryTitle: "Delivery – you are the importer",
      chDeliverySubtitle: "Net export, the forwarder clears customs, you pay VAT and the fee on receipt.",
      chDeliveryBadge: "tax-free export delivery",
      chDelivery: "Delivery to your door",
      chDeliveryImportVat: "Swiss import VAT 8.1% (on goods + transport)",
      chFee: "Forwarder’s customs clearance fee incl. 8.1%",
      chDeliveryReq: [
        "Delivery without installation (sofa, table, chairs)",
        "Net invoice with the note “plus 8.1% Swiss VAT and customs clearance fee on receipt”",
        "The forwarder handles the export and import declarations",
      ],
      noDelivery: "Delivery costs not included.",
      ddpTitle: "Duty-paid all-in price or kitchen with installation",
      ddpSubtitle: "One final price in CHF incl. VAT, delivery and installation.",
      ddpNote: "This requires a Swiss VAT registration, and with installation also registrations for the fitters.",
      compareChf: "AT gross price converted",
      compareEur: "AT gross price",
      dePickupTitle: "Collection in Lochau",
      dePickupSubtitle: "You collect in the showroom – Austrian VAT.",
      netPrice: "Net price",
      atVat: "Austrian VAT 20%",
      reqSelf: "Transport by yourself",
      deDeliveryTitle: "Delivery of loose furniture to Germany",
      deSubOss: "Distance sale with German VAT (EU OSS).",
      deSubNoOss: "With Austrian VAT 20%.",
      deBadgeOss: "19% German VAT (condition see below)",
      deVat: "German VAT 19%",
      delivery: "Delivery",
      condLabel: "Condition",
      noteLabel: "Note",
      condOss: "19% German VAT because Platzhirsch invoices via the EU OSS. Estimate, binding only in the quote.",
      condNoOss:
        "If Platzhirsch invoices via the EU OSS with German VAT, 19% applies instead of 20% – the tax share would then be arithmetically {diff} lower. Estimate, binding only in the quote.",
      reqOss: "EU-wide distance-selling threshold of €10,000 net exceeded, invoicing via the EU OSS",
      reqNoOss: "Calculated with 20% AT VAT (estimate, binding only in the quote)",
      reqLoose: "Loose furniture without installation",
      deMontageTitle: "Kitchen or built-in furniture with installation",
      deMontageSubtitle: "Installed delivery with place of supply in Germany.",
      deMontageNote: "Not handled via the OSS and needs its own process.",
      atPickupSubtitle: "Gross price including 20% VAT.",
      atVatShort: "VAT 20%",
      atDeliveryTitle: "Delivery within Austria",
      atDeliverySubtitle: "Gross price plus delivery.",
      atGross: "Gross price incl. 20% VAT",
      atMontage: "Installation",
    },
    rate: {
      noneLabel: "No rate",
      noneText: "The EUR/CHF rate is not available right now. We therefore do not calculate amounts in francs – please try again later or ask us personally.",
      okLabel: "ECB reference rate",
      okText: "ECB reference rate of {date}: €1 = {rate} CHF",
      lastLabel: "Last ECB rate",
      day: "day",
      days: "days",
      ago: " ({n} {unit} ago)",
      staleText: "Attention: the last available ECB rate is from {date}{ago}: €1 = {rate} CHF. A current rate could not be retrieved, so the amounts in francs may differ from today’s rate.",
      fallbackText: "Last available ECB rate of {date}: €1 = {rate} CHF – the current rate could not be retrieved just now.",
    },
  },
};

// ---------------------------------------------------------------------------
// FR (Romandie + France). Steuerbegriffe wie in der Schweiz: TVA, déclaration
// en douane, transitaire; Österreich: TVA autrichienne.

const FR = {
  meta: {
    title: "Calculateur trois pays pour CH, FL et DE",
    description:
      "Carte de la région des trois pays avec temps de trajet depuis Lochau et calculateur indicatif pour la Suisse, le Liechtenstein et l’Allemagne.",
    ogTitle: "Calculateur trois pays : achat depuis CH, FL et DE",
    name: "Calculateur trois pays",
    crumb: "Calculateur trois pays",
    appFeatures: ["Carte avec temps de trajet depuis Lochau", "Estimation en CHF ou en EUR selon la voie de passage de la frontière", "Taux de référence de la BCE"],
  },
  page: {
    badge: "Calculateur trois pays",
    title: "Un showroom, quatre pays.",
    lead: "À quelle distance se trouve Lochau, et combien coûte finalement un meuble chez vous – en Suisse, au Liechtenstein ou en Allemagne ? La carte et le calculateur vous répondent en quelques secondes.",
    vatCh: "TVA CH/FL",
    vatChValue: "8,1 %",
    vatAt: "TVA AT",
    vatAtValue: "20 %",
    rate: "1 € en CHF",
    rateFrom: "{label} du {date}",
    rateFallback: " (taux actuel non disponible)",
    rateNone: "Taux actuellement non disponible",
    nav: "Sur cette page",
    toMap: "Vers la carte",
    toCalc: "Directement au calculateur",
    howTitle: "Notre méthode de calcul",
    how: [
      "Le point de départ est le prix brut autrichien avec 20 % de TVA. En cas d’exportation vers la Suisse ou le Liechtenstein, la TVA autrichienne ne s’applique pas.",
      "À l’importation s’ajoutent 8,1 % de TVA suisse – en cas de livraison, sur la marchandise et le transport.",
      "Les frais de dédouanement et de livraison sont des valeurs d’exemple. Les transitaires ne publient pas de prix.",
      "Le taux est le taux de référence de la BCE, mis en cache pendant 12 heures. La douane suisse calcule avec son propre taux du jour.",
    ],
    sourcesTitle: "Sources publiques",
    sources: {
      "https://www.wko.at/aussenwirtschaft/exporthandbuch/touristenexport": "WKO – exportation par des touristes (en allemand)",
      "https://www.wko.at/vlbg/handel/oeffnungszeiten-zollstellen.pdf": "WKO Vorarlberg – bureaux de douane (en allemand)",
      "https://www.wko.at/oe/faq-eu-oss-fuer-den-handel": "WKO – FAQ guichet OSS de l’UE (en allemand)",
      "https://www.seco.admin.ch/de/entsendung-kosten-und-sanktionen": "SECO – détachement de travailleurs (en allemand)",
      "https://www.llv.li/de/landesverwaltung/auslaender-und-passamt/dienstleistungserbringung-gdl-/unternehmen-mit-sitz-in-eu-ewr/bis-90-tage": "LLV – prestations de services au Liechtenstein (en allemand)",
      "https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html": "BCE – taux de référence (en anglais)",
    },
    hand: {
      aria: "Du dessin à la main au rendu",
      text: "Ici aussi, notre méthode s’applique : nous découvrons le lieu, Harald Menghin dessine le concept à la main, puis suivent la planification 3D et le rendu.",
      link: "Notre méthode de travail",
    },
    disclaimer:
      "Valeur indicative, qui ne constitue pas un conseil fiscal ou juridique. Vos saisies restent dans votre navigateur et ne sont ni enregistrées ni transmises. La carte est une illustration de notre création et ne charge aucun service de cartographie.",
  },
  client: {
    ui: {
      mapStep: "1 · Carte",
      mapTitle: "Lochau, au cœur de la région",
      mapLead: "Touchez un lieu : temps de trajet, livraison, montage et fiscalité de chaque pays en un coup d’œil.",
      live: "{place}, {country}, {time} depuis Lochau",
      figcaption: "Carte schématique. Temps de trajet en voiture depuis Lochau : valeurs indicatives sans trafic ni attente à la frontière.",
      details: "Détails",
      chips: "Choisir un lieu (les touches fléchées changent de lieu)",
      fromLochau: "depuis Lochau",
      estimate: "(valeur indicative)",
      steuer: "Fiscalité",
      lieferung: "Livraison",
      montage: "Montage",
      cta: "Calculer le prix {forName}",
      calcStep: "2 · Calculateur de prix",
      calcTitle: "Combien me coûte le meuble chez moi ?",
      calcLead: "Saisissez le prix brut autrichien. Nous vous montrons ce qu’il représente en Suisse, au Liechtenstein ou en Allemagne – selon la voie de passage de la frontière.",
    },
    calcUi: {
      estimateBadge: "Valeur indicative – exemple",
      savings: "≈ {min}–{max} % sous le prix brut AT",
      notCheaper: "pas moins cher que le prix brut AT",
      condition: "Condition",
      yourPrice: "Votre prix",
      atGross: "Brut AT",
      showCalc: "Afficher le calcul",
      hideCalc: "Masquer le calcul",
      sum: "Total",
      conversion: "Conversion à 1 € = {rate} CHF ; la douane calcule avec son propre taux du jour. Valeur moyenne ≈ {mid}.",
      errEmpty: "Veuillez saisir un prix brut en euros.",
      errNan: "Veuillez saisir uniquement des chiffres, p. ex. 25.000 ou 1890,50.",
      errZero: "Veuillez saisir un montant supérieur à 0 €.",
      errMax: "Veuillez saisir au maximum 2.000.000 €.",
      errCalc: "Nous ne pouvons pas calculer cette saisie.",
      legend: "Où va le meuble ?",
      amountLabel: "Prix brut autrichien (TVA de 20 % incluse)",
      amountHelp: "Par exemple le prix indiqué sur l’étiquette au showroom.",
      priceIn: "Votre prix {inName}",
      shortAbholung: "Retrait",
      shortLieferung: "Livraison",
      detailsLink: "Détails et calcul",
      includeDelivery: "Inclure les frais de livraison",
      includeDeliveryNote: "(valeur indicative, seule l’offre fait foi)",
      net: "net",
      noRate: "Sans taux valable, nous n’affichons pas de montants en francs. Nous vous indiquons volontiers le prix personnellement.",
      empty: "Saisissez un montant à gauche.",
      disclaimerTitle: "Valeur indicative, pas de conseil fiscal.",
      disclaimerText:
        "Le calcul montre les voies habituelles en l’état actuel. Les frais des transitaires et les frais de livraison sont des valeurs d’exemple, la douane calcule avec son propre taux du jour. Vous recevez personnellement votre offre ferme.",
      termin: "Demander un rendez-vous",
      kontakt: "Contact",
    },
    map: {
      title: "Carte de la région des trois pays avec Lochau au centre",
      desc: "Carte schématique du lac de Constance et de la vallée du Rhin. Les lieux en Autriche, en Allemagne, en Suisse et au Liechtenstein peuvent être sélectionnés et indiquent le temps de trajet ainsi que des informations sur la livraison, le montage et la fiscalité. Les flèches du clavier changent de lieu.",
      // Kartenbeschriftung: Ortsname Bodensee (übersetzter Name ist länger und überlappt Lindau, QA 01.11.2026).
      lake: "Bodensee",
      inset: "Détail ×5",
      countries: { DE: "ALLEMAGNE", AT: "AUTRICHE", CH: "SUISSE", FL: "FL" },
    },
    countries: {
      CH: {
        name: "Suisse",
        inName: "en Suisse",
        forName: "pour la Suisse",
        headline: "8,1 % de TVA suisse au lieu de 20 % de TVA autrichienne",
        steuer: [
          "Les meubles sont exonérés de droits de douane depuis le 01.01.2024. Une déclaration en douane reste toutefois obligatoire.",
          "À l’importation, 8,1 % de TVA suisse sont dus. La TVA autrichienne ne s’applique pas à l’exportation.",
          "Par rapport au prix brut autrichien, la taxe est mathématiquement inférieure d’environ 9,9 % (1,081 ÷ 1,20).",
        ],
        lieferung: [
          "Retrait avec justificatif d’exportation : uniquement si vous exportez vous-même la marchandise – dans votre propre voiture, un fourgon de location ou une remorque. Ce n’est pas possible avec un transitaire.",
          "Le bureau de douane de Lustenau/Au confirme l’exportation 24 h sur 24, celui de Höchst/St. Margrethen du lundi au vendredi de 8 h à 16 h.",
          "Livraison sans montage : vous êtes l’importateur. Le transitaire déclare l’importation, vous payez la TVA et les frais de dédouanement à la réception.",
        ],
        montage: [
          "Une simple livraison sans montage n’entraîne pas d’obligation d’annonce pour les monteurs.",
          "Pour les cuisines et les armoires encastrées, la Suisse impose une obligation d’annonce dès le premier jour, avec 8 jours de préavis.",
          "Cuisine ou agencement avec montage : nous en parlons personnellement.",
        ],
      },
      FL: {
        name: "Liechtenstein",
        inName: "au Liechtenstein",
        forName: "pour le Liechtenstein",
        headline: "Territoire douanier et de TVA suisse : 8,1 % de TVA",
        steuer: [
          "Le Liechtenstein fait partie du territoire douanier et de TVA suisse : 8,1 % de TVA, les mêmes voies qu’en Suisse.",
          "Avec un domicile au Liechtenstein, l’exportation depuis l’Autriche est considérée comme exonérée (domicile hors de l’UE).",
        ],
        lieferung: [
          "Retrait avec justificatif d’exportation comme en Suisse – uniquement si vous assurez vous-même le transport.",
          "Bureau de douane de Tisis/Schaanwald : du lundi au vendredi de 7 h 30 à 16 h 30. Lustenau/Au est ouvert 24 h sur 24.",
        ],
        montage: [
          "Le Liechtenstein est membre de l’EEE : une procédure d’annonce spécifique s’applique aux monteurs, sans délai d’attente de 8 jours.",
          "Dates et déroulement du montage : nous en parlons personnellement.",
        ],
      },
      DE: {
        name: "Allemagne",
        inName: "en Allemagne",
        forName: "pour l’Allemagne",
        headline: "Retrait avec 20 % de TVA AT. En cas de livraison, 19 % de TVA allemande seulement en cas de facturation via le guichet OSS de l’UE – voir la remarque ci-dessous.",
        steuer: [
          "Retrait à Lochau : la TVA autrichienne de 20 % s’applique.",
          "Livraison de meubles non encastrés vers l’Allemagne : 19 % de TVA allemande uniquement si Platzhirsch facture via le guichet OSS de l’UE (seuil européen de 10 000 € nets dépassé), sinon 20 % de TVA autrichienne. Le cas applicable figure de manière ferme dans l’offre.",
        ],
        lieferung: ["Frais de livraison vers l’Allemagne : nous en parlons personnellement."],
        montage: [
          "Les cuisines et agencements avec montage en Allemagne ne passent pas par le guichet OSS.",
          "Cuisine ou agencement avec montage : nous en parlons personnellement.",
        ],
      },
      AT: {
        name: "Autriche",
        inName: "en Autriche",
        forName: "pour l’Autriche",
        headline: "Prix national avec 20 % de TVA",
        steuer: ["En Autriche, le prix brut indiqué, TVA de 20 % incluse, s’applique."],
        lieferung: ["Livraison en Autriche : nous en parlons personnellement."],
        montage: ["Montage : nous en parlons personnellement."],
      },
    },
    calc: {
      personal: "Nous en parlons personnellement.",
      sources: {
        "Richtwert, verbindlich erst im Angebot": "Valeur indicative, seule l’offre fait foi",
        "Richtwert – die genauen Kosten nennen wir auf Anfrage.": "Valeur indicative – nous indiquons les coûts exacts sur demande.",
        "wie Schweiz angenommen – Richtwert – die genauen Kosten nennen wir auf Anfrage.": "supposé comme pour la Suisse – valeur indicative – nous indiquons les coûts exacts sur demande.",
      },
      chPickupTitle: "Retrait avec justificatif d’exportation",
      chPickupSubtitle: "Vous retirez à Lochau et exportez vous-même la marchandise.",
      chPickupBadge: "aucune immatriculation à la TVA suisse nécessaire",
      chNet: "Facture nette (sans TVA AT)",
      chDeposit: "TVA AT 20 % en caution – remboursée après justificatif d’exportation (U34)",
      chImportVat: "TVA suisse à l’importation 8,1 % (à la frontière, p. ex. QuickZoll)",
      chTransport: "Transport par vos soins (fourgon/remorque)",
      chPickupReq: [
        "Domicile hors de l’UE (Suisse ou Liechtenstein), pas de domicile supplémentaire dans l’UE",
        "Facture de plus de 75 €, exportation dans les 3 mois",
        "Transport par vous-même – pas par un transitaire",
      ],
      chPickupReqCh: "Faire confirmer l’exportation : Lustenau/Au 24 h sur 24, Höchst/St. Margrethen lun.–ven. 8 h–16 h",
      chPickupReqFl: "Faire confirmer l’exportation : Lustenau/Au 24 h sur 24 ou Tisis/Schaanwald lun.–ven. 7 h 30–16 h 30",
      chPickupHint: "Adapté surtout aux luminaires, accessoires et petits meubles.",
      chDeliveryTitle: "Livraison – vous êtes l’importateur",
      chDeliverySubtitle: "Exportation hors taxe, le transitaire dédouane, vous payez la TVA et les frais à la réception.",
      chDeliveryBadge: "livraison à l’exportation exonérée",
      chDelivery: "Livraison jusque chez vous",
      chDeliveryImportVat: "TVA suisse à l’importation 8,1 % (sur marchandise + transport)",
      chFee: "Frais de dédouanement du transitaire, TVA de 8,1 % incluse",
      chDeliveryReq: [
        "Livraison sans montage (canapé, table, chaises)",
        "Facture nette avec la mention « plus 8,1 % de TVA suisse et frais de dédouanement à la réception »",
        "Le transitaire se charge des déclarations d’exportation et d’importation",
      ],
      noDelivery: "Frais de livraison non inclus.",
      ddpTitle: "Prix tout compris dédouané ou cuisine avec montage",
      ddpSubtitle: "Un prix final en CHF, TVA, livraison et montage compris.",
      ddpNote: "Cela nécessite une immatriculation à la TVA suisse et, en cas de montage, des annonces pour les monteurs.",
      compareChf: "Prix brut AT converti",
      compareEur: "Prix brut AT",
      dePickupTitle: "Retrait à Lochau",
      dePickupSubtitle: "Vous retirez au showroom – TVA autrichienne.",
      netPrice: "Prix net",
      atVat: "TVA autrichienne 20 %",
      reqSelf: "Transport par vous-même",
      deDeliveryTitle: "Livraison de meubles non encastrés vers l’Allemagne",
      deSubOss: "Vente à distance avec TVA allemande (guichet OSS de l’UE).",
      deSubNoOss: "Avec TVA autrichienne de 20 %.",
      deBadgeOss: "19 % de TVA allemande (condition ci-dessous)",
      deVat: "TVA allemande 19 %",
      delivery: "Livraison",
      condLabel: "Condition",
      noteLabel: "Remarque",
      condOss: "19 % de TVA allemande, car Platzhirsch facture via le guichet OSS de l’UE. Valeur indicative, seule l’offre fait foi.",
      condNoOss:
        "Si Platzhirsch facture via le guichet OSS de l’UE avec TVA allemande, 19 % s’appliquent au lieu de 20 % – la part de taxe serait alors mathématiquement inférieure de {diff}. Valeur indicative, seule l’offre fait foi.",
      reqOss: "Seuil européen de vente à distance de 10 000 € nets dépassé, facturation via le guichet OSS de l’UE",
      reqNoOss: "Calculé avec 20 % de TVA AT (valeur indicative, seule l’offre fait foi)",
      reqLoose: "Meubles non encastrés, sans montage",
      deMontageTitle: "Cuisine ou agencement avec montage",
      deMontageSubtitle: "Livraison avec montage, lieu de la prestation en Allemagne.",
      deMontageNote: "Ne passe pas par le guichet OSS et nécessite une procédure distincte.",
      atPickupSubtitle: "Prix brut, TVA de 20 % incluse.",
      atVatShort: "TVA 20 %",
      atDeliveryTitle: "Livraison en Autriche",
      atDeliverySubtitle: "Prix brut plus livraison.",
      atGross: "Prix brut, TVA de 20 % incluse",
      atMontage: "Montage",
    },
    rate: {
      noneLabel: "Pas de taux",
      noneText: "Le taux EUR/CHF n’est pas disponible pour le moment. Nous ne calculons donc pas de montants en francs – veuillez réessayer plus tard ou nous contacter personnellement.",
      okLabel: "Taux de référence de la BCE",
      okText: "Taux de référence de la BCE du {date} : 1 € = {rate} CHF",
      lastLabel: "Dernier taux de la BCE",
      day: "jour",
      days: "jours",
      ago: " (il y a {n} {unit})",
      staleText: "Attention : le dernier taux disponible de la BCE date du {date}{ago} : 1 € = {rate} CHF. Aucun taux actuel n’a pu être obtenu, les montants en francs peuvent donc différer du taux du jour.",
      fallbackText: "Dernier taux disponible de la BCE du {date} : 1 € = {rate} CHF – le taux actuel n’a pas pu être obtenu pour le moment.",
    },
  },
};

// ---------------------------------------------------------------------------
// IT (Ticino + Italia). Begriffe wie in der Schweiz: IVA, dichiarazione
// doganale, spedizioniere; Höflichkeitsform „voi“ wie auf den übrigen IT-Seiten.

const IT = {
  meta: {
    title: "Calcolatore tre Paesi: acquisto da CH, FL e DE",
    description:
      "Mappa della regione dei tre Paesi con tempi di viaggio da Lochau e calcolatore indicativo per clienti da Svizzera, Liechtenstein e Germania.",
    ogTitle: "Calcolatore tre Paesi: acquisto da CH, FL e DE",
    name: "Calcolatore tre Paesi",
    crumb: "Calcolatore tre Paesi",
    appFeatures: ["Mappa con tempi di viaggio da Lochau", "Stima in CHF o EUR secondo la via di passaggio del confine", "Tasso di riferimento BCE"],
  },
  page: {
    badge: "Calcolatore tre Paesi",
    title: "Uno showroom, quattro Paesi.",
    lead: "Quanto dista Lochau e quanto costa alla fine un mobile a casa vostra – in Svizzera, nel Liechtenstein o in Germania? Mappa e calcolatore rispondono in pochi secondi.",
    vatCh: "IVA CH/FL",
    vatChValue: "8,1%",
    vatAt: "IVA AT",
    vatAtValue: "20%",
    rate: "1 € in CHF",
    rateFrom: "{label} del {date}",
    rateFallback: " (tasso attuale non disponibile)",
    rateNone: "Tasso al momento non disponibile",
    nav: "In questa pagina",
    toMap: "Alla mappa",
    toCalc: "Direttamente al calcolatore",
    howTitle: "Come calcoliamo",
    how: [
      "Il punto di partenza è il prezzo lordo austriaco con il 20% di IVA. Con l’esportazione in Svizzera o nel Liechtenstein l’IVA austriaca non si applica.",
      "All’importazione si aggiunge l’8,1% di IVA svizzera – in caso di consegna, sulla merce più il trasporto.",
      "Le spese di sdoganamento e di consegna sono valori di esempio. Gli spedizionieri non pubblicano prezzi.",
      "Il tasso è il tasso di riferimento della BCE, memorizzato per 12 ore. La dogana svizzera calcola con un proprio tasso giornaliero.",
    ],
    sourcesTitle: "Fonti pubbliche",
    sources: {
      "https://www.wko.at/aussenwirtschaft/exporthandbuch/touristenexport": "WKO – esportazione turistica (in tedesco)",
      "https://www.wko.at/vlbg/handel/oeffnungszeiten-zollstellen.pdf": "WKO Vorarlberg – uffici doganali (in tedesco)",
      "https://www.wko.at/oe/faq-eu-oss-fuer-den-handel": "WKO – FAQ OSS dell’UE (in tedesco)",
      "https://www.seco.admin.ch/de/entsendung-kosten-und-sanktionen": "SECO – distacco di lavoratori (in tedesco)",
      "https://www.llv.li/de/landesverwaltung/auslaender-und-passamt/dienstleistungserbringung-gdl-/unternehmen-mit-sitz-in-eu-ewr/bis-90-tage": "LLV – prestazioni di servizi nel Liechtenstein (in tedesco)",
      "https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html": "BCE – tassi di riferimento (in inglese)",
    },
    hand: {
      aria: "Dal disegno a mano al rendering",
      text: "Anche qui vale il nostro metodo: vediamo il luogo, Harald Menghin disegna il concept a mano, poi seguono progetto 3D e rendering.",
      link: "Il nostro modo di lavorare",
    },
    disclaimer:
      "Valore indicativo, nessuna consulenza fiscale o legale. I vostri dati restano nel vostro browser e non vengono salvati né trasmessi. La mappa è una nostra grafica e non carica alcun servizio cartografico.",
  },
  client: {
    ui: {
      mapStep: "1 · Mappa",
      mapTitle: "Lochau è proprio al centro",
      mapLead: "Toccate un luogo: tempo di viaggio, consegna, montaggio e imposte del Paese a colpo d’occhio.",
      live: "{place}, {country}, {time} da Lochau",
      figcaption: "Mappa schematica. Tempi di viaggio in auto da Lochau: valori indicativi senza traffico né attesa al confine.",
      details: "Dettagli",
      chips: "Scegliete un luogo (i tasti freccia cambiano luogo)",
      fromLochau: "da Lochau",
      estimate: "(valore indicativo)",
      steuer: "Imposte",
      lieferung: "Consegna",
      montage: "Montaggio",
      cta: "Calcolate il prezzo {forName}",
      calcStep: "2 · Calcolatore di prezzo",
      calcTitle: "Quanto mi costa il mobile a casa mia?",
      calcLead: "Inserite il prezzo lordo austriaco. Vi mostriamo a quanto corrisponde in Svizzera, nel Liechtenstein o in Germania – a seconda della via di passaggio del confine.",
    },
    calcUi: {
      estimateBadge: "Valore indicativo – esempio",
      savings: "≈ {min}–{max}% sotto il prezzo lordo AT",
      notCheaper: "non più conveniente del prezzo lordo AT",
      condition: "Condizione",
      yourPrice: "Il vostro prezzo",
      atGross: "Lordo AT",
      showCalc: "Mostra il calcolo",
      hideCalc: "Nascondi il calcolo",
      sum: "Totale",
      conversion: "Conversione con 1 € = {rate} CHF; la dogana calcola con un proprio tasso giornaliero. Valore medio ≈ {mid}.",
      errEmpty: "Inserite un prezzo lordo in euro.",
      errNan: "Inserite solo numeri, p. es. 25.000 o 1890,50.",
      errZero: "Inserite un importo superiore a 0 €.",
      errMax: "Inserite al massimo 2.000.000 €.",
      errCalc: "Non possiamo calcolare questo dato.",
      legend: "Dove va il mobile?",
      amountLabel: "Prezzo lordo austriaco (IVA 20% inclusa)",
      amountHelp: "Per esempio il prezzo sul cartellino nello showroom.",
      priceIn: "Il vostro prezzo {inName}",
      shortAbholung: "Ritiro",
      shortLieferung: "Consegna",
      detailsLink: "Dettagli e calcolo",
      includeDelivery: "Includere le spese di consegna",
      includeDeliveryNote: "(valore indicativo, vincolante solo nell’offerta)",
      net: "netto",
      noRate: "Senza un tasso valido non mostriamo importi in franchi. Chiariamo volentieri il prezzo di persona.",
      empty: "Inserite un importo a sinistra.",
      disclaimerTitle: "Valore indicativo, nessuna consulenza fiscale.",
      disclaimerText:
        "Il calcolo mostra le vie tipiche allo stato attuale. Le tariffe degli spedizionieri e le spese di consegna sono valori di esempio, la dogana calcola con un proprio tasso giornaliero. L’offerta vincolante la ricevete di persona.",
      termin: "Richiedete un appuntamento",
      kontakt: "Contatto",
    },
    map: {
      title: "Mappa della regione dei tre Paesi con Lochau al centro",
      desc: "Mappa schematica del Lago di Costanza e della Valle del Reno. I luoghi in Austria, Germania, Svizzera e Liechtenstein sono selezionabili e mostrano il tempo di viaggio e indicazioni su consegna, montaggio e imposte. Con i tasti freccia cambiate luogo.",
      // Kartenbeschriftung: Ortsname Bodensee (übersetzter Name ist länger und überlappt Lindau, QA 01.11.2026).
      lake: "Bodensee",
      inset: "Dettaglio ×5",
      countries: { DE: "GERMANIA", AT: "AUSTRIA", CH: "SVIZZERA", FL: "FL" },
    },
    countries: {
      CH: {
        name: "Svizzera",
        inName: "in Svizzera",
        forName: "per la Svizzera",
        headline: "8,1% di IVA svizzera invece del 20% di IVA austriaca",
        steuer: [
          "Dal 01.01.2024 i mobili sono esenti da dazio. La dichiarazione doganale resta comunque obbligatoria.",
          "All’importazione è dovuta l’IVA svizzera dell’8,1%. L’IVA austriaca non si applica all’esportazione.",
          "Rispetto al prezzo lordo austriaco, l’imposta è aritmeticamente inferiore di circa il 9,9% (1,081 ÷ 1,20).",
        ],
        lieferung: [
          "Ritiro con documento di esportazione: solo se esportate voi stessi la merce – con la vostra auto, un furgone a noleggio o un rimorchio. Con uno spedizioniere non è possibile.",
          "L’ufficio doganale di Lustenau/Au conferma l’esportazione 24 ore su 24, Höchst/St. Margrethen lun–ven 8–16.",
          "Consegna senza montaggio: l’importatore siete voi. Lo spedizioniere dichiara l’importazione, IVA e spese di sdoganamento le pagate al ricevimento.",
        ],
        montage: [
          "La sola consegna senza montaggio non comporta obbligo di notifica per i montatori.",
          "Per cucine e armadi a incasso in Svizzera vige un obbligo di notifica dal primo giorno, con 8 giorni di anticipo.",
          "Cucina o arredo a incasso con montaggio: ne parliamo di persona.",
        ],
      },
      FL: {
        name: "Liechtenstein",
        inName: "nel Liechtenstein",
        forName: "per il Liechtenstein",
        headline: "Territorio doganale e IVA svizzero: 8,1% di IVA",
        steuer: [
          "Il Liechtenstein fa parte del territorio doganale e IVA svizzero: 8,1% di IVA, le stesse vie che in Svizzera.",
          "Con domicilio nel Liechtenstein, l’esportazione dall’Austria è considerata esente (domicilio fuori dall’UE).",
        ],
        lieferung: [
          "Ritiro con documento di esportazione come in Svizzera – solo con trasporto a vostra cura.",
          "Ufficio doganale di Tisis/Schaanwald: lun–ven 7.30–16.30. Lustenau/Au è aperto 24 ore su 24.",
        ],
        montage: [
          "Il Liechtenstein è membro del SEE: per i montatori vale una procedura di notifica specifica, senza il periodo di attesa di 8 giorni.",
          "Date e svolgimento del montaggio: ne parliamo di persona.",
        ],
      },
      DE: {
        name: "Germania",
        inName: "in Germania",
        forName: "per la Germania",
        headline: "Ritiro con il 20% di IVA AT. In caso di consegna, il 19% di IVA tedesca vale solo con fatturazione tramite l’OSS dell’UE – vedi nota sotto.",
        steuer: [
          "Ritiro a Lochau: si applica l’IVA austriaca del 20%.",
          "Consegna di mobili non a incasso in Germania: 19% di IVA tedesca solo se Platzhirsch fattura tramite l’OSS dell’UE (soglia UE di 10.000 € netti superata), altrimenti 20% di IVA austriaca. Quale caso si applica è indicato in modo vincolante nell’offerta.",
        ],
        lieferung: ["Spese di consegna in Germania: ne parliamo di persona."],
        montage: [
          "Cucine e arredi a incasso con montaggio in Germania non rientrano nell’OSS.",
          "Cucina o arredo a incasso con montaggio: ne parliamo di persona.",
        ],
      },
      AT: {
        name: "Austria",
        inName: "in Austria",
        forName: "per l’Austria",
        headline: "Prezzo nazionale con il 20% di IVA",
        steuer: ["In Austria vale il prezzo lordo indicato, IVA del 20% inclusa."],
        lieferung: ["Consegna in Austria: ne parliamo di persona."],
        montage: ["Montaggio: ne parliamo di persona."],
      },
    },
    calc: {
      personal: "Ne parliamo di persona.",
      sources: {
        "Richtwert, verbindlich erst im Angebot": "Valore indicativo, vincolante solo nell’offerta",
        "Richtwert – die genauen Kosten nennen wir auf Anfrage.": "Valore indicativo – i costi esatti li indichiamo su richiesta.",
        "wie Schweiz angenommen – Richtwert – die genauen Kosten nennen wir auf Anfrage.": "ipotizzato come per la Svizzera – valore indicativo – i costi esatti li indichiamo su richiesta.",
      },
      chPickupTitle: "Ritiro con documento di esportazione",
      chPickupSubtitle: "Ritirate a Lochau ed esportate voi stessi la merce.",
      chPickupBadge: "nessuna iscrizione all’IVA svizzera necessaria",
      chNet: "Fattura netta (senza IVA AT)",
      chDeposit: "IVA AT 20% come cauzione – restituita dopo il documento di esportazione (U34)",
      chImportVat: "IVA svizzera all’importazione 8,1% (al confine, p. es. QuickZoll)",
      chTransport: "Trasporto proprio (furgone/rimorchio)",
      chPickupReq: [
        "Domicilio fuori dall’UE (Svizzera o Liechtenstein), nessun domicilio aggiuntivo nell’UE",
        "Fattura superiore a 75 €, esportazione entro 3 mesi",
        "Trasporto a vostra cura – non con uno spedizioniere",
      ],
      chPickupReqCh: "Far confermare l’esportazione: Lustenau/Au 0–24, Höchst/St. Margrethen lun–ven 8–16",
      chPickupReqFl: "Far confermare l’esportazione: Lustenau/Au 0–24 o Tisis/Schaanwald lun–ven 7.30–16.30",
      chPickupHint: "Adatto soprattutto a lampade, accessori e mobili più piccoli.",
      chDeliveryTitle: "Consegna – l’importatore siete voi",
      chDeliverySubtitle: "Esportazione al netto dell’IVA, lo spedizioniere sdogana, voi pagate IVA e spese al ricevimento.",
      chDeliveryBadge: "consegna all’esportazione esente",
      chDelivery: "Consegna a domicilio",
      chDeliveryImportVat: "IVA svizzera all’importazione 8,1% (su merce + trasporto)",
      chFee: "Spese di sdoganamento dello spedizioniere, IVA 8,1% inclusa",
      chDeliveryReq: [
        "Consegna senza montaggio (divano, tavolo, sedie)",
        "Fattura netta con la dicitura «più 8,1% di IVA svizzera e spese di sdoganamento al ricevimento»",
        "Le dichiarazioni di esportazione e importazione le cura lo spedizioniere",
      ],
      noDelivery: "Spese di consegna non incluse.",
      ddpTitle: "Prezzo completo sdoganato o cucina con montaggio",
      ddpSubtitle: "Un prezzo finale in CHF, IVA, consegna e montaggio inclusi.",
      ddpNote: "Serve un’iscrizione all’IVA svizzera e, con il montaggio, anche le notifiche per i montatori.",
      compareChf: "Prezzo lordo AT convertito",
      compareEur: "Prezzo lordo AT",
      dePickupTitle: "Ritiro a Lochau",
      dePickupSubtitle: "Ritirate nello showroom – IVA austriaca.",
      netPrice: "Prezzo netto",
      atVat: "IVA austriaca 20%",
      reqSelf: "Trasporto a vostra cura",
      deDeliveryTitle: "Consegna di mobili non a incasso in Germania",
      deSubOss: "Vendita a distanza con IVA tedesca (OSS dell’UE).",
      deSubNoOss: "Con IVA austriaca del 20%.",
      deBadgeOss: "19% di IVA tedesca (condizione sotto)",
      deVat: "IVA tedesca 19%",
      delivery: "Consegna",
      condLabel: "Condizione",
      noteLabel: "Nota",
      condOss: "19% di IVA tedesca, perché Platzhirsch fattura tramite l’OSS dell’UE. Valore indicativo, vincolante solo nell’offerta.",
      condNoOss:
        "Se Platzhirsch fattura tramite l’OSS dell’UE con IVA tedesca, vale il 19% invece del 20% – la quota d’imposta sarebbe allora aritmeticamente inferiore di {diff}. Valore indicativo, vincolante solo nell’offerta.",
      reqOss: "Soglia UE per le vendite a distanza di 10.000 € netti superata, fatturazione tramite l’OSS dell’UE",
      reqNoOss: "Calcolato con il 20% di IVA AT (valore indicativo, vincolante solo nell’offerta)",
      reqLoose: "Mobili non a incasso, senza montaggio",
      deMontageTitle: "Cucina o arredo a incasso con montaggio",
      deMontageSubtitle: "Fornitura con montaggio, luogo della prestazione in Germania.",
      deMontageNote: "Non rientra nell’OSS e richiede una procedura a sé.",
      atPickupSubtitle: "Prezzo lordo, IVA del 20% inclusa.",
      atVatShort: "IVA 20%",
      atDeliveryTitle: "Consegna in Austria",
      atDeliverySubtitle: "Prezzo lordo più consegna.",
      atGross: "Prezzo lordo, IVA 20% inclusa",
      atMontage: "Montaggio",
    },
    rate: {
      noneLabel: "Nessun tasso",
      noneText: "Il tasso EUR/CHF al momento non è disponibile. Per questo non calcoliamo importi in franchi – riprovate più tardi o chiedeteci di persona.",
      okLabel: "Tasso di riferimento BCE",
      okText: "Tasso di riferimento BCE del {date}: 1 € = {rate} CHF",
      lastLabel: "Ultimo tasso BCE",
      day: "giorno",
      days: "giorni",
      ago: " ({n} {unit} fa)",
      staleText: "Attenzione: l’ultimo tasso BCE disponibile è del {date}{ago}: 1 € = {rate} CHF. Non è stato possibile ottenere un tasso attuale, gli importi in franchi possono quindi differire dal tasso di oggi.",
      fallbackText: "Ultimo tasso BCE disponibile del {date}: 1 € = {rate} CHF – al momento non è stato possibile ottenere il tasso attuale.",
    },
  },
};

const RAW = { en: EN, fr: FR, it: IT };

function build(locale) {
  const raw = RAW[locale];
  if (!raw) return null;
  const copy = { ...raw, client: { ...raw.client, places: placesFor(locale) } };
  return locale === "fr" ? frNumbers(frenchTypography(copy)) : copy;
}

const BUILT = Object.freeze(Object.fromEntries(INTL_LOCALES.map((l) => [l, build(l)])));

/** EN/FR/IT-Texte der Seite; DE → null (die Komponenten tragen den deutschen Text). */
export function dreilaenderCopy(locale) {
  return BUILT[locale] || null;
}
