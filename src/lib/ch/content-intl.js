// src/lib/ch/content-intl.js – EN-, FR- und IT-Fassung des Schweiz-Hubs
// /<locale>/einkaufen-aus-der-schweiz (Sprachen-Ausbau 01.11.2026, Gruppe
// schweiz-service). FR für die Romandie, IT für das Tessin, EN international.
//
// Mastertext: ./content.js (de-CH). Übersetzt werden NUR die Texte; Struktur,
// Quellen (`src`), eigene Aussagen (`own`) und gesperrte Stellen (`pruefen`)
// kommen unverändert aus der deutschen Fassung (localizeContent()). Gesperrte
// Stellen werden in keiner Sprache gerendert, deshalb steht dort `null`.
// Zoll- und Steueraussagen sind WÖRTLICH übertragen – keine neue Aussage.
// Behörden: BAZG = FR OFDF, IT UDSC, EN FOCBS (amtliche Namen), in Klammern
// das deutsche Kürzel, weil die verlinkten Quellen deutsch sind.
// Zahlen bleiben im de-CH-Format der Rechnung (estimate.js: CHF 21’228.82).
// Französische Typografie: frenchTypography() (Hotel-Modul) beim Laden.
//
// Reines Modul (keine "@/..."-Importe, kein React): node --test lädt es.
import { frenchTypography } from "../hotel/content-intl.js";
import { INTL as ARBEITSWEISE_INTL } from "../arbeitsweise/copy-intl.js";
import { dreilaenderCopy, frNumbers } from "../dreilaender/copy-intl.js";
import * as DE from "./content.js";

export const CH_INTL_LOCALES = Object.freeze(["en", "fr", "it"]);
export const HTML_LANG = Object.freeze({ de: "de-CH", en: "en", fr: "fr-CH", it: "it-CH" });

/** Deutsche Struktur + übersetzte Texte (Arrays nach Index, `null` = Eintrag unverändert). */
export function mergeText(base, tr) {
  if (tr === undefined || tr === null) return base;
  if (Array.isArray(base)) return base.map((b, i) => mergeText(b, tr[i]));
  if (base && typeof base === "object") {
    const out = { ...base };
    for (const [k, v] of Object.entries(tr)) out[k] = mergeText(base[k], v);
    return out;
  }
  return tr;
}

// ---------------------------------------------------------------------------
// EN

const EN = {
  META: {
    title: "Buying from Switzerland",
    description:
      "Furniture from Lochau to Switzerland: two routes across the border, how export and import work and a non-binding cost estimate in Swiss francs.",
  },
  UI: {
    primaryLabel: "Request a visit",
    wegeEyebrow: "Routes A and B",
    fitLabel: "Suitable for: ",
    wayA: "Route A",
    wayB: "Route B",
    stepEyebrow: "Step by step",
    estimates: "Estimates: customs clearance fee {fee} plus 8.1%, own transport {transport}. Forwarders do not publish rates; ask for the fee in advance.",
    asOf: "As of {date}",
    sourcesHeading: "Sources",
    newWindow: " (opens in a new window)",
    draftAria: "Note on the status of this page",
    usp: "For customers from Switzerland too, planning starts with your rooms: Harald Menghin draws your concept by hand, then we plan in 3D, and you see your room photorealistically before anything is ordered.",
    sourcesNote: "Sources in German unless stated otherwise.",
  },
  BANNER: {
    title: "Draft, approval by tax adviser/customs forwarder pending",
    text: "This page summarises publicly available rules and is not tax, customs or legal advice. The information from the FOCBS (BAZG) and the WKO is authoritative.",
  },
  HERO: {
    eyebrow: "For customers from Switzerland",
    title: "Buying from Switzerland",
    lead: "Since 2024, furniture has been duty-free on import into Switzerland; Swiss VAT of 8.1% applies. Austrian VAT of 20% does not apply to delivery to Switzerland or is refunded after the export is confirmed.",
    facts: [
      { label: "Customs duty on furniture", value: "None since 1 January 2024, the customs declaration remains mandatory" },
      { label: "Swiss VAT", value: "8.1% on the goods and transport to your door" },
      { label: "Austrian VAT", value: "20%, does not apply to delivery or is refunded after the export is confirmed" },
    ],
  },
  WEGE: {
    heading: "Two routes across the border",
    text: "Which route suits you depends mainly on the size of the piece. We discuss with you before the purchase how your furniture will cross the border.",
    items: [
      {
        title: "Route A: you collect yourself",
        lead: "You buy in Lochau, load the goods and take them across the border yourself. You get the Austrian VAT back as soon as the export is confirmed.",
        points: [
          { text: "Residence outside the EU, for example in Switzerland, recorded in your passport or identity card. An additional residence in the EU excludes the refund." },
          { text: "Invoice amount over €75 per Austrian shop and day." },
          { text: "The goods leave the EU within three months." },
          { text: "The export certificate confirmed by customs (form U34 or confirmation on the invoice) is back at the shop within six months." },
          { text: "The goods travel in your personal luggage. Shipping by a forwarder is not possible on this route." },
          { text: "In Switzerland you declare the goods and pay the 8.1% VAT, at the counter or in advance in the QuickZoll app." },
          null,
          null,
        ],
        zoll: {
          heading: "Having the export confirmed",
          items: [
            { name: "Lustenau/Au", hours: "Mon–Sun 0–24 h" },
            { name: "Höchst/St. Margrethen (road)", hours: "Mon–Fri 8–16 h" },
            null,
          ],
          note: "According to WKO Vorarlberg, the times may change at short notice. Without confirmation of the export there is no refund.",
        },
        fit: "Lights, accessories, side tables, chairs. A large sofa rarely fits into an estate car.",
      },
      {
        title: "Route B: delivery by forwarder, you are the importer",
        lead: "A forwarder brings the furniture to you. With proof of export, the invoice from Austria contains no Austrian VAT.",
        points: [
          { text: "The forwarder declares the export in Austria and the import in Switzerland." },
          { text: "You pay the 8.1% VAT and the forwarder’s customs clearance fee on receipt or on the forwarder’s invoice." },
          { text: "VAT is calculated on the price plus the costs up to the destination, such as transport and insurance." },
          { text: "Forwarders usually do not publish price lists for customs clearance fees; in 2019 the Price Supervisor criticised the lack of transparency for private customers. Ask for the fee in advance." },
          { text: "Only Swiss Post’s rate for parcels from the EU is public: CHF 13 plus 3% of the value of the goods, at most CHF 70, excluding VAT. A forwarder shipment does not use this rate." },
          null,
        ],
        fit: "Sofas, dining tables, beds, sideboards: everything that is delivered and set up but not built in.",
      },
    ],
  },
  EINBAU: {
    heading: "Kitchens and built-in furniture: different rules",
    paragraphs: [
      { text: "For a kitchen, a built-in wardrobe or a walk-in closet with installation, route B is usually not enough. For tax purposes this can be a supply under a contract for work with the place of supply in Switzerland; the foreign supplier must then register for VAT in Switzerland." },
      { text: "Anyone installing kitchens in Switzerland must register their employees before the assignment. The work may begin at the earliest eight days after registration." },
      { text: "We discuss such projects individually. This page and the calculator apply only to loose furniture and lights." },
    ],
  },
  ABLAUF: {
    heading: "From purchase to import",
    steps: [
      { title: "Before the purchase", a: "We discuss whether you collect yourself.", b: "We discuss delivery, the forwarder and who declares the import." },
      { title: "Invoice", a: "Invoice over €75; the Austrian VAT is refunded after the export is confirmed.", b: "Invoice without Austrian VAT, with the note “plus 8.1% Swiss VAT and customs clearance fee on receipt”." },
      { title: "Export from Austria", a: "Austrian customs confirms the export (U34 or invoice), for example in Lustenau/Au.", b: "The forwarder declares the export." },
      { title: "Import into Switzerland", a: "You declare the goods and pay 8.1% VAT, at the counter or in QuickZoll.", b: "The forwarder declares the import in your name; you pay VAT and the fee." },
      { title: "Completion", a: "The confirmed export certificate is back at the shop within six months.", b: "The goods are with you; the export is documented via the forwarder." },
    ],
  },
  RECHNER: {
    heading: "What does a piece cost in francs?",
    text: "Enter the Austrian price including 20% VAT. The calculator shows both routes with the current ECB rate. The customs clearance fee and own transport are estimates based on public information, not prices from Platzhirsch.",
    example: "A worked example is preset (gross price €25’000), not the price of a specific model.",
    notes: [
      "Not included: route C (duty-paid final price in francs) as well as kitchens and built-in furniture with installation.",
      "How the price compares with a purchase in Switzerland depends on the selling price there. There are no reliable public lists for this, so we do not give a figure.",
    ],
  },
  FAQ: {
    heading: "Questions about buying from Switzerland",
    items: [
      { q: "Do I have to pay customs duty on furniture from Austria?", a: "No. Since 1 January 2024, industrial goods such as furniture have been duty-free on import into Switzerland. You pay Swiss VAT of 8.1%. The goods must still be declared." },
      { q: "Do I get the Austrian VAT back if I have the furniture delivered?", a: "For a delivery to Switzerland it is not charged in the first place if the export is proven. A refund afterwards is only available if you export the goods yourself." },
      { q: "Can I split the purchase between several people to stay below CHF 150?", a: "No. According to the FOCBS (BAZG), a single item over CHF 150 is always subject to VAT, regardless of the number of people." },
      { q: "Which border crossing suits self-collectors?", a: "Lustenau/Au: according to WKO Vorarlberg, Austrian customs confirms the export there around the clock. Höchst/St. Margrethen is staffed Monday to Friday from 8:00 to 16:00." },
      { q: "Which exchange rate does customs use?", a: "Customs converts amounts in euros into francs at the previous day’s foreign exchange rate (selling). Our calculator shows the ECB reference rate, so small differences are possible." },
      { q: "Does this also apply to Liechtenstein?", a: "Liechtenstein belongs to the Swiss customs territory and also has 8.1% VAT. Separate registration procedures apply to fitters there." },
      null,
      null,
    ],
  },
  SHOWROOM: {
    heading: "Clarify things in person before you buy",
    text: "In our showroom in Lochau you see furniture, lights and accessories in the original. We discuss with you before the purchase how your furniture will cross the border.",
  },
  CLOSING: {
    heading: "Appointment for advice",
    text: "If possible, bring dimensions or a floor plan. We clarify questions about export and import before the purchase.",
  },
  SOURCES: {
    bazgZoll: "FOCBS (BAZG): abolition of industrial tariffs (January 2024)",
    mazars: "Forvis Mazars: abolition of industrial tariffs",
    bazgFrei: "FOCBS (BAZG): value exemption limit of 150 francs",
    bazgBemessung: "FOCBS (BAZG): basis of assessment for import tax",
    wkoExport: "WKO: tourist export",
    wkoVlbg: "WKO Vorarlberg: customs offices and tourist export (as of 01.07.2025)",
    ihk: "IHK Hochrhein-Bodensee: VAT leaflet Switzerland (as of 01/2026)",
    weka: "WEKA: supply with installation to Switzerland",
    wkoEntsendung: "WKO: registration requirement under the Swiss Posted Workers Act",
    pue: "Price Supervisor: newsletter 1/2019 (customs clearance costs)",
    post: "Swiss Post: import customs clearance",
    pwc: "PwC: Liechtenstein VAT rates",
    ecb: "ECB: euro reference rate CHF (in English)",
  },
  RECHNER_COPY: {
    label: "Non-binding cost estimate",
    rounding: "Calculated with unrounded intermediate values; shown rounded to the centime. Customs (FOCBS) uses its own exchange rate of the previous day, small differences are possible.",
    amountLabel: "Price in euros (incl. 20% Austrian VAT)",
    amountHint: "For example 25000 or 25’000",
    freightLabel: "Delivery costs in euros, if known (route B)",
    freightHint: "Leave empty if you have no quote yet. VAT on the delivery is then included in the calculation.",
    submit: "Estimate costs",
    pending: "Calculating…",
    errorSummary: "Please check the marked entries.",
    rateLabel: "Rate",
    dateLabel: "Date",
    sourceLabel: "Source",
    inputLine: "Input:",
    compareLabel: "Austrian gross price in CHF:",
    totalLabel: "Your costs, estimated",
    newWindow: " (opens in a new window)",
  },
  EST: {
    wayA: "Route A: you collect yourself",
    wayB: "Route B: delivery by forwarder",
    netA: "Price without Austrian VAT (full refund assumed)",
    netB: "Price without Austrian VAT",
    vat: "Swiss import VAT 8.1%",
    vatFreight: "Swiss import VAT 8.1% on goods and delivery",
    transport: "Own transport, if needed{est}",
    est: " (estimate)",
    refundFee: "Fee for the VAT refund",
    refundFeeText: "to be clarified, not included",
    freightGiven: "Delivery costs as you stated ({amount})",
    freight: "Delivery costs",
    freightNone: "not included",
    fee: "Forwarder’s customs clearance fee incl. 8.1%{est}",
    errors: {
      betragEmpty: "Please enter a price in euros.",
      betragNan: "Please enter an amount in euros, for example 25000.",
      betragMax: "Please enter at most 2’000’000 euros.",
      frachtNan: "Please enter the delivery costs as an amount in euros or leave the field empty.",
      frachtMax: "Please enter at most 100’000 euros of delivery costs.",
    },
  },
  VIEW: {
    ecbLabel: "European Central Bank (ECB), euro reference rate CHF",
    sources: { ezb: "ECB reference rate", zwischenspeicher: "ECB reference rate, last stored", festwert: "ECB reference rate, stored value", keiner: "no rate available" },
  },
};

// ---------------------------------------------------------------------------
// FR (Romandie). Termes suisses : TVA, déclaration en douane, transitaire,
// OFDF (Office fédéral de la douane et de la sécurité des frontières).

const FR = {
  META: {
    title: "Acheter depuis la Suisse",
    description:
      "Meubles de Lochau vers la Suisse : deux voies pour passer la frontière, export et import expliqués, estimation des coûts sans engagement en francs.",
  },
  UI: {
    primaryLabel: "Demander un rendez-vous",
    wegeEyebrow: "Voies A et B",
    fitLabel: "Convient pour : ",
    wayA: "Voie A",
    wayB: "Voie B",
    stepEyebrow: "Étape par étape",
    estimates: "Valeurs estimées : frais de dédouanement {fee} plus 8,1 %, transport par vos soins {transport}. Les transitaires ne publient pas de tarifs ; faites-vous indiquer les frais à l’avance.",
    asOf: "État au {date}",
    sourcesHeading: "Sources",
    newWindow: " (s’ouvre dans une nouvelle fenêtre)",
    draftAria: "Remarque sur l’état de cette page",
    usp: "Pour notre clientèle de Suisse aussi, la planification commence par vos pièces : Harald Menghin dessine votre concept à la main, puis nous planifions en 3D, et vous voyez votre pièce en rendu photoréaliste avant toute commande.",
    sourcesNote: "Sources en allemand, sauf indication contraire.",
  },
  BANNER: {
    title: "Projet en attente de validation par le conseiller fiscal et le transitaire en douane",
    text: "Cette page résume des règles accessibles au public et ne constitue pas un conseil fiscal, douanier ou juridique. Font foi les indications de l’OFDF (BAZG) et de la WKO.",
  },
  HERO: {
    eyebrow: "Pour notre clientèle de Suisse",
    title: "Acheter depuis la Suisse",
    lead: "Depuis 2024, les meubles sont exonérés de droits de douane à l’importation en Suisse ; la TVA suisse de 8,1 % s’applique. La TVA autrichienne de 20 % ne s’applique pas en cas de livraison en Suisse ou est remboursée une fois l’exportation confirmée.",
    facts: [
      { label: "Droits de douane sur les meubles", value: "Aucun depuis le 01.01.2024, la déclaration en douane reste obligatoire" },
      { label: "TVA suisse", value: "8,1 % sur la marchandise et le transport jusque chez vous" },
      { label: "TVA autrichienne", value: "20 %, ne s’applique pas en cas de livraison ou est remboursée une fois l’exportation confirmée" },
    ],
  },
  WEGE: {
    heading: "Deux voies pour passer la frontière",
    text: "La voie qui vous convient dépend surtout de la taille du meuble. Avant votre commande, nous voyons avec vous comment vos achats passeront la frontière.",
    items: [
      {
        title: "Voie A : retrait par vos soins",
        lead: "Vous achetez à Lochau, chargez la marchandise et lui faites passer la frontière par vos propres moyens. La TVA autrichienne vous est remboursée dès que l’exportation est confirmée.",
        points: [
          { text: "Domicile hors de l’UE, par exemple en Suisse, inscrit dans le passeport ou la carte d’identité. Un domicile supplémentaire dans l’UE exclut le remboursement." },
          { text: "Montant de la facture supérieur à 75 € par commerce autrichien et par jour." },
          { text: "La marchandise quitte l’UE dans un délai de trois mois." },
          { text: "Le certificat d’exportation confirmé par la douane (formulaire U34 ou confirmation sur la facture) est retourné au commerce dans un délai de six mois." },
          { text: "La marchandise voyage dans vos bagages personnels. Un envoi par un transitaire n’est pas possible sur cette voie." },
          { text: "En Suisse, vous déclarez la marchandise et payez la TVA de 8,1 %, au guichet ou à l’avance dans l’application QuickZoll." },
          null,
          null,
        ],
        zoll: {
          heading: "Faire confirmer l’exportation",
          items: [
            { name: "Lustenau/Au", hours: "lun.–dim. 0 h–24 h" },
            { name: "Höchst/St. Margrethen (trafic routier)", hours: "lun.–ven. 8 h–16 h" },
            null,
          ],
          note: "Selon la WKO Vorarlberg, les horaires peuvent changer à court terme. Sans confirmation de l’exportation, pas de remboursement.",
        },
        fit: "Luminaires, accessoires, tables d’appoint, chaises. Un grand canapé entre rarement dans un break.",
      },
      {
        title: "Voie B : livraison par transitaire, vous êtes l’importateur",
        lead: "Un transitaire vous livre les meubles. Si l’exportation est prouvée, la facture autrichienne ne contient pas de TVA autrichienne.",
        points: [
          { text: "Le transitaire déclare l’exportation en Autriche et l’importation en Suisse." },
          { text: "Vous payez la TVA de 8,1 % et les frais de dédouanement du transitaire à la réception ou sur sa facture." },
          { text: "La TVA est calculée sur le prix plus les frais jusqu’au lieu de destination, comme le transport et l’assurance." },
          { text: "Les transitaires ne publient en général pas de listes de prix pour les frais de dédouanement ; en 2019, le Surveillant des prix a critiqué le manque de transparence pour les particuliers. Faites-vous indiquer les frais à l’avance." },
          { text: "Seul le tarif de la Poste pour les colis en provenance de l’UE est public : CHF 13 plus 3 % de la valeur de la marchandise, au maximum CHF 70, hors TVA. Un envoi par transitaire ne relève pas de ce tarif." },
          null,
        ],
        fit: "Canapés, tables à manger, lits, buffets : tout ce qui est livré et installé, mais pas encastré.",
      },
    ],
  },
  EINBAU: {
    heading: "Cuisines et agencements : d’autres règles",
    paragraphs: [
      { text: "Pour une cuisine, une armoire encastrée ou un dressing avec montage, la voie B ne suffit en général pas. Sur le plan fiscal, il peut s’agir d’une livraison relevant d’un contrat d’entreprise, avec lieu de la prestation en Suisse ; le fournisseur étranger doit alors s’immatriculer à la TVA en Suisse." },
      { text: "Quiconque installe des cuisines en Suisse doit annoncer ses collaborateurs avant l’intervention. Les travaux peuvent commencer au plus tôt huit jours après l’annonce." },
      { text: "Nous discutons de ces projets au cas par cas. Cette page et le calculateur ne concernent que les meubles non encastrés et les luminaires." },
    ],
  },
  ABLAUF: {
    heading: "De l’achat à l’importation",
    steps: [
      { title: "Avant l’achat", a: "Nous voyons avec vous si vous retirez vous-même la marchandise.", b: "Nous discutons de la livraison, du transitaire et de qui déclare l’importation." },
      { title: "Facture", a: "Facture supérieure à 75 € ; la TVA autrichienne est remboursée une fois l’exportation confirmée.", b: "Facture sans TVA autrichienne, avec la mention « plus 8,1 % de TVA suisse et frais de dédouanement à la réception »." },
      { title: "Exportation depuis l’Autriche", a: "La douane autrichienne confirme l’exportation (U34 ou facture), par exemple à Lustenau/Au.", b: "Le transitaire déclare l’exportation." },
      { title: "Importation en Suisse", a: "Vous déclarez la marchandise et payez 8,1 % de TVA, au guichet ou dans QuickZoll.", b: "Le transitaire déclare l’importation à votre nom ; vous payez la TVA et les frais." },
      { title: "Clôture", a: "Le certificat d’exportation confirmé est retourné au commerce dans un délai de six mois.", b: "La marchandise est chez vous ; l’exportation est prouvée par le transitaire." },
    ],
  },
  RECHNER: {
    heading: "Combien coûte un meuble en francs ?",
    text: "Saisissez le prix autrichien, TVA de 20 % incluse. Le calculateur montre les deux voies avec le taux actuel de la BCE. Les frais de dédouanement et le transport par vos soins sont des estimations tirées d’informations publiques, pas des prix de Platzhirsch.",
    example: "Un exemple de calcul est préréglé (prix brut de 25’000 €), pas le prix d’un modèle précis.",
    notes: [
      "Non compris : la voie C (prix final dédouané en francs) ainsi que les cuisines et agencements avec montage.",
      "La différence par rapport à un achat en Suisse dépend du prix de vente pratiqué là-bas. Il n’existe pas de listes publiques fiables à ce sujet, c’est pourquoi nous n’indiquons pas de chiffre.",
    ],
  },
  FAQ: {
    heading: "Questions sur l’achat depuis la Suisse",
    items: [
      { q: "Dois-je payer des droits de douane sur des meubles venant d’Autriche ?", a: "Non. Depuis le 1er janvier 2024, les produits industriels comme les meubles sont exonérés de droits de douane à l’importation en Suisse. Vous payez la TVA suisse de 8,1 %. La marchandise doit malgré tout être déclarée." },
      { q: "La TVA autrichienne m’est-elle remboursée si je me fais livrer ?", a: "En cas de livraison en Suisse, elle n’est même pas facturée si l’exportation est prouvée. Un remboursement après coup n’existe que si vous exportez vous-même la marchandise." },
      { q: "Puis-je répartir l’achat entre plusieurs personnes pour rester sous CHF 150 ?", a: "Non. Selon l’OFDF (BAZG), un objet isolé de plus de CHF 150 est toujours soumis à la TVA, quel que soit le nombre de personnes." },
      { q: "Quel poste-frontière choisir si je retire moi-même la marchandise ?", a: "Lustenau/Au : selon la WKO Vorarlberg, la douane autrichienne y confirme l’exportation 24 h sur 24. Höchst/St. Margrethen est ouvert du lundi au vendredi de 8 h à 16 h." },
      { q: "Quel taux de change la douane applique-t-elle ?", a: "La douane convertit les montants en euros en francs au cours des devises (vente) de la veille. Notre calculateur affiche le taux de référence de la BCE, de petits écarts sont donc possibles." },
      { q: "Cela vaut-il aussi pour le Liechtenstein ?", a: "Le Liechtenstein fait partie du territoire douanier suisse et applique également 8,1 % de TVA. Les monteurs y sont soumis à des procédures d’annonce spécifiques." },
      null,
      null,
    ],
  },
  SHOWROOM: {
    heading: "Tout clarifier en personne avant l’achat",
    text: "Dans notre showroom de Lochau, vous découvrez meubles, luminaires et accessoires sur place. Avant votre commande, nous voyons avec vous comment vos achats passeront la frontière.",
  },
  CLOSING: {
    heading: "Rendez-vous de conseil",
    text: "Si possible, apportez vos mesures ou un plan. Nous clarifions les questions d’exportation et d’importation avant l’achat.",
  },
  SOURCES: {
    bazgZoll: "OFDF (BAZG) : suppression des droits de douane sur les produits industriels (janvier 2024)",
    mazars: "Forvis Mazars : suppression des droits de douane sur les produits industriels",
    bazgFrei: "OFDF (BAZG) : franchise-valeur de 150 francs",
    bazgBemessung: "OFDF (BAZG) : base de calcul de l’impôt sur les importations",
    wkoExport: "WKO : exportation par des touristes",
    wkoVlbg: "WKO Vorarlberg : bureaux de douane et exportation par des touristes (état au 01.07.2025)",
    ihk: "IHK Hochrhein-Bodensee : fiche TVA Suisse (état 01/2026)",
    weka: "WEKA : livraison avec montage en Suisse",
    wkoEntsendung: "WKO : obligation d’annonce selon la loi suisse sur les travailleurs détachés",
    pue: "Surveillant des prix : newsletter 1/2019 (frais de dédouanement)",
    post: "La Poste : dédouanement à l’importation",
    pwc: "PwC : taux de TVA du Liechtenstein",
    ecb: "BCE : taux de référence de l’euro en CHF (en anglais)",
  },
  RECHNER_COPY: {
    label: "Estimation des coûts sans engagement",
    rounding: "Calculé avec des valeurs intermédiaires non arrondies ; affiché arrondi au centime. La douane (OFDF) calcule avec son propre cours des devises de la veille, de petits écarts sont possibles.",
    amountLabel: "Prix en euros (TVA autrichienne de 20 % incluse)",
    amountHint: "Par exemple 25000 ou 25’000",
    freightLabel: "Frais de livraison en euros, s’ils sont connus (voie B)",
    freightHint: "Laissez vide si vous n’avez pas encore d’offre. La TVA sur la livraison est alors incluse dans le calcul.",
    submit: "Estimer les coûts",
    pending: "Calcul en cours…",
    errorSummary: "Veuillez vérifier les champs signalés.",
    rateLabel: "Taux",
    dateLabel: "Date",
    sourceLabel: "Source",
    inputLine: "Saisie :",
    compareLabel: "prix brut autrichien en CHF :",
    totalLabel: "Vos coûts, estimés",
    newWindow: " (s’ouvre dans une nouvelle fenêtre)",
  },
  EST: {
    wayA: "Voie A : retrait par vos soins",
    wayB: "Voie B : livraison par transitaire",
    netA: "Prix sans TVA autrichienne (remboursement complet supposé)",
    netB: "Prix sans TVA autrichienne",
    vat: "TVA suisse à l’importation 8,1 %",
    vatFreight: "TVA suisse à l’importation 8,1 % sur marchandise et livraison",
    transport: "Transport par vos soins, si nécessaire{est}",
    est: " (estimation)",
    refundFee: "Frais pour le remboursement de la TVA",
    refundFeeText: "à préciser, non inclus",
    freightGiven: "Frais de livraison selon votre indication ({amount})",
    freight: "Frais de livraison",
    freightNone: "non inclus",
    fee: "Frais de dédouanement du transitaire, TVA de 8,1 % incluse{est}",
    errors: {
      betragEmpty: "Veuillez saisir un prix en euros.",
      betragNan: "Veuillez saisir un montant en euros, par exemple 25000.",
      betragMax: "Veuillez saisir au maximum 2’000’000 euros.",
      frachtNan: "Veuillez saisir les frais de livraison sous forme de montant en euros ou laisser le champ vide.",
      frachtMax: "Veuillez saisir au maximum 100’000 euros de frais de livraison.",
    },
  },
  VIEW: {
    ecbLabel: "Banque centrale européenne (BCE), taux de référence de l’euro en CHF",
    sources: { ezb: "Taux de référence de la BCE", zwischenspeicher: "Taux de référence de la BCE, dernier enregistré", festwert: "Taux de référence de la BCE, valeur enregistrée", keiner: "aucun taux disponible" },
  },
};

// ---------------------------------------------------------------------------
// IT (Ticino). Termini svizzeri: IVA, dichiarazione doganale, spedizioniere,
// UDSC (Ufficio federale della dogana e della sicurezza dei confini).

const IT = {
  META: {
    title: "Acquistare dalla Svizzera",
    description:
      "Mobili da Lochau in Svizzera: due vie per passare il confine, esportazione e importazione spiegate e una stima dei costi non vincolante in franchi.",
  },
  UI: {
    primaryLabel: "Richiedete un appuntamento",
    wegeEyebrow: "Vie A e B",
    fitLabel: "Adatta a: ",
    wayA: "Via A",
    wayB: "Via B",
    stepEyebrow: "Passo dopo passo",
    estimates: "Valori stimati: spese di sdoganamento {fee} più 8,1%, trasporto proprio {transport}. Gli spedizionieri non pubblicano tariffe; fatevi indicare le spese in anticipo.",
    asOf: "Aggiornato al {date}",
    sourcesHeading: "Fonti",
    newWindow: " (si apre in una nuova finestra)",
    draftAria: "Nota sullo stato di questa pagina",
    usp: "Anche per la clientela dalla Svizzera la progettazione parte dai vostri ambienti: Harald Menghin disegna il vostro concept a mano, poi progettiamo in 3D e vedete il vostro ambiente in un rendering fotorealistico prima di ordinare qualsiasi cosa.",
    sourcesNote: "Fonti in tedesco, salvo diversa indicazione.",
  },
  BANNER: {
    title: "Bozza in attesa di approvazione da parte di consulente fiscale e spedizioniere doganale",
    text: "Questa pagina riassume regole accessibili al pubblico e non costituisce consulenza fiscale, doganale o legale. Fanno fede le indicazioni dell’UDSC (BAZG) e della WKO.",
  },
  HERO: {
    eyebrow: "Per la clientela dalla Svizzera",
    title: "Acquistare dalla Svizzera",
    lead: "Dal 2024 i mobili sono esenti da dazio all’importazione in Svizzera; si applica l’IVA svizzera dell’8,1%. L’IVA austriaca del 20% non si applica in caso di consegna in Svizzera o viene rimborsata dopo la conferma dell’esportazione.",
    facts: [
      { label: "Dazio sui mobili", value: "Nessuno dal 01.01.2024, la dichiarazione doganale resta obbligatoria" },
      { label: "IVA svizzera", value: "8,1% sulla merce e sul trasporto fino a casa vostra" },
      { label: "IVA austriaca", value: "20%, non si applica in caso di consegna o viene rimborsata dopo la conferma dell’esportazione" },
    ],
  },
  WEGE: {
    heading: "Due vie per passare il confine",
    text: "Quale via fa per voi dipende soprattutto dalle dimensioni del mobile. Prima dell’ordine definiamo con voi come i vostri acquisti passeranno il confine.",
    items: [
      {
        title: "Via A: ritiro di persona",
        lead: "Acquistate a Lochau, caricate e portate voi stessi la merce oltre il confine. L’IVA austriaca vi viene restituita non appena l’esportazione è confermata.",
        points: [
          { text: "Domicilio fuori dall’UE, per esempio in Svizzera, registrato nel passaporto o nella carta d’identità. Un domicilio aggiuntivo nell’UE esclude il rimborso." },
          { text: "Importo della fattura superiore a 75 € per negozio austriaco e per giorno." },
          { text: "La merce lascia l’UE entro tre mesi." },
          { text: "Il certificato di esportazione confermato dalla dogana (modulo U34 o conferma sulla fattura) torna al negozio entro sei mesi." },
          { text: "La merce viaggia nel vostro bagaglio personale. Una spedizione tramite spedizioniere non è possibile su questa via." },
          { text: "In Svizzera dichiarate la merce e pagate l’IVA dell’8,1%, allo sportello o in anticipo nell’app QuickZoll." },
          null,
          null,
        ],
        zoll: {
          heading: "Far confermare l’esportazione",
          items: [
            { name: "Lustenau/Au", hours: "lun–dom 0–24" },
            { name: "Höchst/St. Margrethen (strada)", hours: "lun–ven 8–16" },
            null,
          ],
          note: "Secondo la WKO Vorarlberg gli orari possono cambiare con breve preavviso. Senza conferma dell’esportazione non c’è rimborso.",
        },
        fit: "Lampade, accessori, tavolini, sedie. Un grande divano entra di rado in una station wagon.",
      },
      {
        title: "Via B: consegna tramite spedizioniere, l’importatore siete voi",
        lead: "Uno spedizioniere vi porta i mobili. Con esportazione comprovata, la fattura dall’Austria non contiene l’IVA austriaca.",
        points: [
          { text: "Lo spedizioniere dichiara l’esportazione in Austria e l’importazione in Svizzera." },
          { text: "L’IVA dell’8,1% e le spese di sdoganamento dello spedizioniere le pagate al ricevimento o sulla sua fattura." },
          { text: "L’IVA viene calcolata sul prezzo più i costi fino al luogo di destinazione, come trasporto e assicurazione." },
          { text: "Per le spese di sdoganamento gli spedizionieri di regola non pubblicano listini; nel 2019 il Sorvegliante dei prezzi ha criticato la mancanza di trasparenza per i privati. Fatevi indicare le spese in anticipo." },
          { text: "È pubblica solo la tariffa della Posta per i pacchi dall’UE: CHF 13 più il 3% del valore della merce, al massimo CHF 70, IVA esclusa. Una spedizione tramite spedizioniere non rientra in questa tariffa." },
          null,
        ],
        fit: "Divani, tavoli da pranzo, letti, credenze: tutto ciò che viene consegnato e posizionato, ma non montato a incasso.",
      },
    ],
  },
  EINBAU: {
    heading: "Cucine e arredi a incasso: altre regole",
    paragraphs: [
      { text: "Per una cucina, un armadio a incasso o una cabina armadio con montaggio, di regola la via B non basta. Dal punto di vista fiscale può trattarsi di una fornitura in base a un contratto d’appalto, con luogo della prestazione in Svizzera; il fornitore estero deve allora iscriversi all’IVA in Svizzera." },
      { text: "Chi monta cucine in Svizzera deve notificare i propri collaboratori prima dell’intervento. Il lavoro può iniziare al più presto otto giorni dopo la notifica." },
      { text: "Progetti di questo tipo li discutiamo singolarmente. Questa pagina e il calcolatore valgono solo per mobili non a incasso e lampade." },
    ],
  },
  ABLAUF: {
    heading: "Dall’acquisto all’importazione",
    steps: [
      { title: "Prima dell’acquisto", a: "Valutiamo con voi se ritirare la merce di persona.", b: "Discutiamo consegna, spedizioniere e chi dichiara l’importazione." },
      { title: "Fattura", a: "Fattura superiore a 75 €; l’IVA austriaca viene rimborsata dopo la conferma dell’esportazione.", b: "Fattura senza IVA austriaca, con la dicitura «più 8,1% di IVA svizzera e spese di sdoganamento al ricevimento»." },
      { title: "Esportazione dall’Austria", a: "La dogana austriaca conferma l’esportazione (U34 o fattura), per esempio a Lustenau/Au.", b: "Lo spedizioniere dichiara l’esportazione." },
      { title: "Importazione in Svizzera", a: "Dichiarate la merce e pagate l’8,1% di IVA, allo sportello o in QuickZoll.", b: "Lo spedizioniere dichiara l’importazione a vostro nome; pagate IVA e spese." },
      { title: "Conclusione", a: "Il certificato di esportazione confermato torna al negozio entro sei mesi.", b: "La merce è a casa vostra; l’esportazione è comprovata tramite lo spedizioniere." },
    ],
  },
  RECHNER: {
    heading: "Quanto costa un mobile in franchi?",
    text: "Inserite il prezzo austriaco, IVA del 20% inclusa. Il calcolatore mostra entrambe le vie con il tasso BCE attuale. Spese di sdoganamento e trasporto proprio sono stime da informazioni pubbliche, non prezzi di Platzhirsch.",
    example: "È preimpostato un esempio di calcolo (prezzo lordo di 25’000 €), non il prezzo di un modello specifico.",
    notes: [
      "Non inclusi: la via C (prezzo finale sdoganato in franchi) e cucine e arredi a incasso con montaggio.",
      "La differenza rispetto a un acquisto in Svizzera dipende dal prezzo di vendita locale. Non esistono elenchi pubblici affidabili, per questo non indichiamo alcuna cifra.",
    ],
  },
  FAQ: {
    heading: "Domande sull’acquisto dalla Svizzera",
    items: [
      { q: "Devo pagare il dazio sui mobili dall’Austria?", a: "No. Dal 1° gennaio 2024 i prodotti industriali come i mobili sono esenti da dazio all’importazione in Svizzera. Pagate l’IVA svizzera dell’8,1%. La merce deve comunque essere dichiarata." },
      { q: "Mi viene restituita l’IVA austriaca se mi faccio consegnare la merce?", a: "In caso di consegna in Svizzera, con esportazione comprovata non viene nemmeno addebitata. Un rimborso successivo esiste solo se esportate voi stessi la merce." },
      { q: "Posso suddividere l’acquisto tra più persone per restare sotto i CHF 150?", a: "No. Secondo l’UDSC (BAZG), un singolo oggetto di valore superiore a CHF 150 è sempre soggetto all’IVA, indipendentemente dal numero di persone." },
      { q: "Quale valico è adatto a chi ritira di persona?", a: "Lustenau/Au: secondo la WKO Vorarlberg, lì la dogana austriaca conferma l’esportazione 24 ore su 24. Höchst/St. Margrethen è aperto dal lunedì al venerdì dalle 8 alle 16." },
      { q: "Con quale tasso di cambio calcola la dogana?", a: "La dogana converte gli importi in euro in franchi al corso delle divise (vendita) del giorno precedente. Il nostro calcolatore mostra il tasso di riferimento BCE, per questo sono possibili piccole differenze." },
      { q: "Vale anche per il Liechtenstein?", a: "Il Liechtenstein fa parte del territorio doganale svizzero e ha anch’esso l’8,1% di IVA. Lì per i montatori valgono procedure di notifica specifiche." },
      null,
      null,
    ],
  },
  SHOWROOM: {
    heading: "Chiarire tutto di persona prima dell’acquisto",
    text: "Nel nostro showroom di Lochau vedete mobili, lampade e accessori dal vero. Prima dell’ordine definiamo con voi come i vostri acquisti passeranno il confine.",
  },
  CLOSING: {
    heading: "Appuntamento di consulenza",
    text: "Se possibile, portate misure o una pianta. Le domande su esportazione e importazione le chiariamo prima dell’acquisto.",
  },
  SOURCES: {
    bazgZoll: "UDSC (BAZG): soppressione dei dazi industriali (gennaio 2024)",
    mazars: "Forvis Mazars: soppressione dei dazi industriali",
    bazgFrei: "UDSC (BAZG): franchigia di valore di 150 franchi",
    bazgBemessung: "UDSC (BAZG): base di calcolo dell’imposta sull’importazione",
    wkoExport: "WKO: esportazione turistica",
    wkoVlbg: "WKO Vorarlberg: uffici doganali ed esportazione turistica (aggiornato al 01.07.2025)",
    ihk: "IHK Hochrhein-Bodensee: promemoria IVA Svizzera (aggiornato al 01/2026)",
    weka: "WEKA: fornitura con montaggio in Svizzera",
    wkoEntsendung: "WKO: obbligo di notifica secondo la legge svizzera sui lavoratori distaccati",
    pue: "Sorvegliante dei prezzi: newsletter 1/2019 (costi di sdoganamento)",
    post: "La Posta: sdoganamento all’importazione",
    pwc: "PwC: aliquote IVA del Liechtenstein",
    ecb: "BCE: tasso di riferimento dell’euro in CHF (in inglese)",
  },
  RECHNER_COPY: {
    label: "Stima dei costi non vincolante",
    rounding: "Calcolato con valori intermedi non arrotondati; visualizzato arrotondato al centesimo. La dogana (UDSC) calcola con il proprio corso delle divise del giorno precedente, sono possibili piccole differenze.",
    amountLabel: "Prezzo in euro (IVA austriaca del 20% inclusa)",
    amountHint: "Per esempio 25000 o 25’000",
    freightLabel: "Spese di consegna in euro, se note (via B)",
    freightHint: "Lasciate vuoto se non avete ancora un’offerta. L’IVA sulla consegna viene allora inclusa nel calcolo.",
    submit: "Calcolate la stima",
    pending: "Calcolo in corso…",
    errorSummary: "Controllate i campi evidenziati.",
    rateLabel: "Tasso",
    dateLabel: "Data",
    sourceLabel: "Fonte",
    inputLine: "Dati inseriti:",
    compareLabel: "prezzo lordo austriaco in CHF:",
    totalLabel: "I vostri costi, stimati",
    newWindow: " (si apre in una nuova finestra)",
  },
  EST: {
    wayA: "Via A: ritiro di persona",
    wayB: "Via B: consegna tramite spedizioniere",
    netA: "Prezzo senza IVA austriaca (rimborso completo ipotizzato)",
    netB: "Prezzo senza IVA austriaca",
    vat: "IVA svizzera all’importazione 8,1%",
    vatFreight: "IVA svizzera all’importazione 8,1% su merce e consegna",
    transport: "Trasporto proprio, se necessario{est}",
    est: " (stima)",
    refundFee: "Spese per il rimborso dell’IVA",
    refundFeeText: "da definire, non incluso",
    freightGiven: "Spese di consegna secondo la vostra indicazione ({amount})",
    freight: "Spese di consegna",
    freightNone: "non incluse",
    fee: "Spese di sdoganamento dello spedizioniere, IVA 8,1% inclusa{est}",
    errors: {
      betragEmpty: "Inserite un prezzo in euro.",
      betragNan: "Inserite un importo in euro, per esempio 25000.",
      betragMax: "Inserite al massimo 2’000’000 euro.",
      frachtNan: "Inserite le spese di consegna come importo in euro o lasciate vuoto il campo.",
      frachtMax: "Inserite al massimo 100’000 euro di spese di consegna.",
    },
  },
  VIEW: {
    ecbLabel: "Banca centrale europea (BCE), tasso di riferimento dell’euro in CHF",
    sources: { ezb: "Tasso di riferimento BCE", zwischenspeicher: "Tasso di riferimento BCE, ultimo salvato", festwert: "Tasso di riferimento BCE, valore memorizzato", keiner: "nessun tasso disponibile" },
  },
};

const RAW = { en: EN, fr: FR, it: IT };

function processNote(locale) {
  const aw = ARBEITSWEISE_INTL[locale] || {};
  const P = {
    en: { eyebrow: "How we work", heading: "Drawn by hand, then planned in 3D.", vorOrt: "If your project needs it, we also stay on site for a day or two.", stepsLabel: "The seven steps", link: "How we work: from hand drawing to rendering" },
    fr: { eyebrow: "Notre méthode", heading: "Dessiné à la main, puis planifié en 3D.", vorOrt: "Si votre projet le demande, nous restons aussi un ou deux jours sur place.", stepsLabel: "Les sept étapes", link: "Notre méthode : du dessin à la main au rendu" },
    it: { eyebrow: "Il nostro metodo", heading: "Disegnato a mano, poi progettato in 3D.", vorOrt: "Se il vostro progetto lo richiede, restiamo anche uno o due giorni sul posto.", stepsLabel: "I sette passi", link: "Il nostro metodo: dal disegno a mano al rendering" },
  }[locale];
  return { eyebrow: P.eyebrow, heading: P.heading, vorOrt: P.vorOrt, stepsLabel: P.stepsLabel, steps: aw.STEPS, link: { href: "/arbeitsweise", label: P.link } };
}

function build(locale) {
  const t = RAW[locale];
  const content = {
    BANNER: mergeText(DE.BANNER, t.BANNER),
    HERO: mergeText(DE.HERO, t.HERO),
    WEGE: mergeText(DE.WEGE, t.WEGE),
    EINBAU: mergeText(DE.EINBAU, t.EINBAU),
    ABLAUF: mergeText(DE.ABLAUF, t.ABLAUF),
    RECHNER: mergeText(DE.RECHNER, t.RECHNER),
    FAQ: mergeText(DE.FAQ, t.FAQ),
    SHOWROOM: mergeText(DE.SHOWROOM, t.SHOWROOM),
    CLOSING: mergeText(DE.CLOSING, t.CLOSING),
    SOURCES: Object.fromEntries(Object.entries(DE.SOURCES).map(([k, s]) => [k, { ...s, label: t.SOURCES[k] }])),
  };
  const copy = {
    locale,
    lang: HTML_LANG[locale],
    META: t.META,
    UI: t.UI,
    PROCESS: processNote(locale),
    ...content,
    RECHNER_COPY: t.RECHNER_COPY,
    EST: t.EST,
    VIEW: { ...t.VIEW, rate: dreilaenderCopy(locale).client.rate },
  };
  // FR: Typografie auf alles außer den Quell-URLs (frenchSpacing ändert URLs nicht – keine " :" darin),
  // dazu geschützte Leerzeichen vor % und € (frNumbers, Lektorat 01.11.2026).
  return locale === "fr" ? frNumbers(frenchTypography(copy)) : copy;
}

const BUILT = Object.freeze(Object.fromEntries(CH_INTL_LOCALES.map((l) => [l, build(l)])));

/** EN/FR/IT-Fassung des Schweiz-Hubs; DE → null (content.js gilt). */
export function chCopy(locale) {
  return BUILT[locale] || null;
}
