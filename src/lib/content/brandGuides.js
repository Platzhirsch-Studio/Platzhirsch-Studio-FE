// src/lib/content/brandGuides.js
// Eigene, zitierfähige Sachtexte der Markenseiten (/ueber-uns/marken/<marke>),
// vier Sprachen – SEO-Team A, AP-1 (Minotti) und AP-7 (Markenseiten-Muster),
// GEO W7 (qa-screenshots/seo-sistrix/02-massnahmen.md Gruppe 3,
// qa-screenshots/geo-ki/02-massnahmen-website.md W7), 31.10.2026.
//
// Regeln:
// - Fakten zur Marke (Herkunft, Gründungsjahr, Gründer, Schwerpunkt) wie im
//   Backoffice (grundungsjahr, herkunftsland, grunder) und auf der verlinkten
//   Herstellerseite – eigene Sätze, kein Herstellertext kopiert.
// - Händleraussagen NUR über den Claim-Guard: dealerStatement() aus
//   src/lib/legal/claims.js. Marken ohne Beleg: „Wir führen …“ / „… bei
//   Platzhirsch“, nie „Händler“. Minotti im Studio-Wortlaut des Registers.
// - Keine Fläche des Minotti Studio (ca. 400 m² ist Stand 2019), keine
//   Superlative, keine Preise, keine Lieferzeiten in Wochen, keine Aussage,
//   welches Stück gerade ausgestellt ist.
// - Links nur auf Seiten, die mit 200 antworten (Ratgeber nur freigegebene
//   Artikel, Stand 31.10.2026: Minotti-Sofa, Schweiz, Designerküche).
//
// Reines Modul (nur relative Imports), damit node --test es laden kann
// (tests/unit/brand-guides.test.mjs).
import { dealerStatement, dealerStudio, isVerifiedDealerBrand } from "../legal/claims.js";
import { sourceCopyFor } from "../sofaplaner/consent.js";

export const GUIDE_LOCALES = Object.freeze(["de", "en", "fr", "it"]);

const ADDRESS_LINE = {
  de: "Landstraße 11, 6911 Lochau",
  en: "Landstraße 11, 6911 Lochau, Austria",
  fr: "Landstraße 11, 6911 Lochau (Autriche)",
  it: "Landstraße 11, 6911 Lochau (Austria)",
};

// Pfade je Sprache (wie src/utils/routing.js; FR/IT-Sofaplaner direkt auf das
// Ziel der 308-Weiterleitung, Ratgeber gibt es nur auf Deutsch).
const PATHS = {
  sofaplaner: { de: "/de/sofaplaner", en: "/en/sofaplaner", fr: "/de/sofaplaner?lang=fr", it: "/de/sofaplaner?lang=it" },
  arbeitsweise: { de: "/de/arbeitsweise", en: "/en/arbeitsweise", fr: "/fr/arbeitsweise", it: "/it/arbeitsweise" },
  ratgeberMinotti: "/de/ratgeber/was-kostet-ein-minotti-sofa",
  ratgeberSchweiz: "/de/ratgeber/moebel-aus-oesterreich-in-die-schweiz",
};
const IN_GERMAN = { de: "", en: " (in German)", fr: " (en allemand)", it: " (in tedesco)" };

const T = {
  whatTitle: { de: (b) => `Was ist ${b}?`, en: (b) => `What is ${b}?`, fr: (b) => `Qu’est-ce que ${b} ?`, it: (b) => `Che cos’è ${b}?` },
  hereTitle: {
    de: (b) => `${b} bei Platzhirsch Home Living in Lochau`,
    en: (b) => `${b} at Platzhirsch Home Living in Lochau`,
    fr: (b) => `${b} chez Platzhirsch Home Living à Lochau`,
    it: (b) => `${b} da Platzhirsch Home Living a Lochau`,
  },
  h1: {
    de: (b) => `${b} bei Platzhirsch in Lochau`,
    en: (b) => `${b} at Platzhirsch in Lochau`,
    fr: (b) => `${b} chez Platzhirsch à Lochau`,
    it: (b) => `${b} da Platzhirsch a Lochau`,
  },
  // Gemeinsamer Schluss der Marken ohne eigenen Studio-Text.
  visit: {
    de: (b) => `Welche ${b}-Stücke gerade in der Ausstellung stehen, sagen wir Ihnen bei der Terminanfrage. Geplant wird wie bei allen Projekten: zuerst vor Ort und von Hand, dann in 3D und als Rendering vor der Bestellung.`,
    en: (b) => `When you request an appointment, we tell you which ${b} pieces are currently on display. Planning follows the same steps as every project: on site and by hand first, then in 3D and as a rendering before you order.`,
    fr: (b) => `Lors de la demande de rendez-vous, nous vous indiquons quelles pièces ${b} sont actuellement exposées. La planification suit les mêmes étapes que pour chaque projet : d’abord sur place et à la main, puis en 3D et en rendu avant la commande.`,
    it: (b) => `Quando richiedete un appuntamento vi diciamo quali pezzi ${b} sono esposti in quel momento. La progettazione segue le stesse fasi di ogni progetto: prima sul posto e a mano, poi in 3D e con un rendering prima dell’ordine.`,
  },
  faqWhere: {
    de: (b, dealer) => ({
      q: dealer ? `Wo kann ich ${b} in Vorarlberg kaufen?` : `Wo kann ich ${b} in Vorarlberg ansehen?`,
      a: `${dealer ? `${dealer} ` : ""}Beratung und Planung bieten wir in unserem Showroom in Lochau an, ${ADDRESS_LINE.de}, am Bodensee zwischen Bregenz und Lindau. Mit Termin bereiten wir die Stücke vor, die Sie interessieren.`,
    }),
    en: (b, dealer) => ({
      q: dealer ? `Where can I buy ${b} in Vorarlberg?` : `Where can I see ${b} in Vorarlberg?`,
      a: `${dealer ? `${dealer} ` : ""}We advise and plan at our showroom in Lochau, ${ADDRESS_LINE.en}, on Lake Constance between Bregenz and Lindau. With an appointment we prepare the pieces you are interested in.`,
    }),
    fr: (b, dealer) => ({
      q: dealer ? `Où acheter ${b} dans le Vorarlberg ?` : `Où voir ${b} dans le Vorarlberg ?`,
      a: `${dealer ? `${dealer} ` : ""}Nous conseillons et planifions dans notre showroom de Lochau, ${ADDRESS_LINE.fr}, au bord du lac de Constance entre Bregenz et Lindau. Sur rendez-vous, nous préparons les pièces qui vous intéressent.`,
    }),
    it: (b, dealer) => ({
      q: dealer ? `Dove acquistare ${b} nel Vorarlberg?` : `Dove vedere ${b} nel Vorarlberg?`,
      a: `${dealer ? `${dealer} ` : ""}Offriamo consulenza e progettazione nel nostro showroom di Lochau, ${ADDRESS_LINE.it}, sul Lago di Costanza tra Bregenz e Lindau. Con un appuntamento prepariamo i pezzi che vi interessano.`,
    }),
  },
  faqDelivery: {
    de: (b) => ({ q: `Wie lange ist die Lieferzeit bei ${b}?`, a: `Das hängt von Modell, Maß und Ausführung ab. Wir nennen die Lieferzeit im Angebot; Lieferung und Montage übernehmen wir auf Wunsch.` }),
    en: (b) => ({ q: `How long is the delivery time for ${b}?`, a: `It depends on the model, size and finish. We state the delivery time in our quote; delivery and installation are available on request.` }),
    fr: (b) => ({ q: `Quel est le délai de livraison pour ${b} ?`, a: `Il dépend du modèle, des dimensions et de la finition. Nous indiquons le délai dans notre offre ; livraison et montage sur demande.` }),
    it: (b) => ({ q: `Quali sono i tempi di consegna per ${b}?`, a: `Dipendono da modello, misure e finitura. Indichiamo i tempi nell’offerta; consegna e montaggio su richiesta.` }),
  },
  faqSwiss: {
    de: (b) => ({ q: `Planen Sie ${b} auch für Kunden aus der Schweiz?`, a: `Ja. Auf Anfrage planen und liefern wir auch in die Schweiz und nach Liechtenstein; St. Gallen liegt 30 bis 40 Minuten von Lochau entfernt. Wie die Einfuhr mit Mehrwertsteuer und Zoll abläuft, erklärt unser Ratgeber.` }),
    en: (b) => ({ q: `Do you also plan ${b} for clients from Switzerland?`, a: `Yes. On request we also plan and deliver to Switzerland and Liechtenstein; St. Gallen is 30 to 40 minutes from Lochau. Our guide (in German) explains how import, VAT and customs work.` }),
    fr: (b) => ({ q: `Planifiez-vous ${b} aussi pour des clients de Suisse ?`, a: `Oui. Sur demande, nous planifions et livrons aussi en Suisse et au Liechtenstein ; Saint-Gall est à 30 à 40 minutes de Lochau. Notre guide (en allemand) explique l’importation, la TVA et la douane.` }),
    it: (b) => ({ q: `Progettate ${b} anche per clienti dalla Svizzera?`, a: `Sì. Su richiesta progettiamo e consegniamo anche in Svizzera e nel Liechtenstein; San Gallo dista da 30 a 40 minuti da Lochau. La nostra guida (in tedesco) spiega importazione, IVA e dogana.` }),
  },
  linkArbeitsweise: { de: "So arbeiten wir: Handzeichnung, Modell, 3D", en: "How we work: hand drawing, model, 3D", fr: "Notre méthode : dessin à la main, maquette, 3D", it: "Il nostro metodo: disegno a mano, modello, 3D" },
  linkSchweiz: { de: "Ratgeber: Möbel aus Österreich in die Schweiz", en: "Guide: furniture from Austria to Switzerland", fr: "Guide : meubles d’Autriche vers la Suisse", it: "Guida: mobili dall’Austria alla Svizzera" },
};

// --- Minotti (AP-1) ------------------------------------------------------
// Studio-Aussage nur im Register-Wortlaut ({studio} = dealerStudio().statement).
const MINOTTI = {
  sourceUrl: "https://www.minotti.com",
  h1: {
    de: "Minotti Studio by Platzhirsch Home Living in Lochau",
    en: "Minotti Studio by Platzhirsch Home Living in Lochau",
    fr: "Minotti Studio by Platzhirsch Home Living à Lochau",
    it: "Minotti Studio by Platzhirsch Home Living a Lochau",
  },
  description: {
    de: "Das Minotti Studio by Platzhirsch Home Living in Lochau: Sofas, Sessel und Tische von Minotti sehen, probesitzen und mit uns planen.",
    en: "The Minotti Studio by Platzhirsch Home Living in Lochau: see and try Minotti sofas, armchairs and tables and plan them with us.",
    fr: "Le Minotti Studio by Platzhirsch Home Living à Lochau : voir et essayer canapés, fauteuils et tables Minotti, et les planifier avec nous.",
    it: "Il Minotti Studio by Platzhirsch Home Living a Lochau: vedere e provare divani, poltrone e tavoli Minotti e progettarli con noi.",
  },
  sections: {
    de: [
      { title: "Was ist Minotti?", paragraphs: [
        "Minotti ist ein italienischer Möbelhersteller aus Meda in der Brianza, nördlich von Mailand. Alberto Minotti gründete das Unternehmen 1948 als Werkstatt; heute entstehen dort Sofas, Sessel, Ess- und Couchtische, Betten, Stauraummöbel und Teppiche für Wohnräume sowie eigene Kollektionen für den Außenbereich.",
        "Die Sofas sind meist modular aufgebaut: Einzelne Elemente lassen sich zu geraden Formen, Ecklösungen oder Inseln verbinden, Bezüge gibt es in Stoff und Leder. Materialien, Maße und Pflegehinweise veröffentlicht der Hersteller auf minotti.com.",
      ] },
      { title: "Das Minotti Studio by Platzhirsch Home Living", paragraphs: [
        "{studio} Das Studio liegt in unserem Haus an der Landstraße 11 in Lochau, am Bodensee zwischen Bregenz und Lindau.",
        "Minotti-Möbel stehen hier in eingerichteten Raumsituationen. So vergleichen Sie Sitzhöhe, Sitztiefe, Polsterung und Bezüge nicht nur auf Bildern, sondern probieren sie aus. Die Auswahl wechselt mit den Kollektionen – wenn Sie ein bestimmtes Modell sehen möchten, schreiben Sie es in die Terminanfrage.",
      ] },
      { title: "Kollektionen und Kategorien", paragraphs: [
        "Im Katalog weiter unten finden Sie die Minotti-Modelle nach Kategorien: Sofas und Sessel, Ess- und Couchtische, Stühle, Betten, Sideboards, Regale und Teppiche. Jede Kategorie hat eine eigene Übersicht mit den Modellen und den Herstellerbildern; von dort geht es zu den einzelnen Produkten mit Abmessungen.",
      ] },
      { title: "Planung mit Harald Menghin", paragraphs: [
        "Ein Sofa wirkt im eigenen Raum anders als in der Ausstellung. Deshalb beginnt die Planung bei uns mit dem Raum: Harald Menghin nimmt sich Zeit vor Ort, zeichnet Grundriss und Einrichtung von Hand und baut bei Bedarf ein Raummodell. Danach folgen 3D-Planung und ein fotorealistisches Rendering, auf dem Sie Format, Proportionen und Bezug vor der Bestellung sehen.",
      ] },
      { title: "Ein Sofa vorplanen", paragraphs: [
        "Im Sofaplaner stellen Sie ein Sofa aus den Elementen der Minotti-Programme zusammen, mit den Maßen des Herstellers. Mit dem Ergebnis kommen Sie zum Termin; im Studio prüfen wir es gemeinsam am Original und passen Elemente, Tiefe und Bezug an.",
      ] },
      { title: "Preis, Lieferung und Schweiz", paragraphs: [
        "Preise nennen wir auf Anfrage, weil sie von Elementen, Größe, Bezug und Ausführung abhängen; wovon der Preis eines Minotti-Sofas abhängt, erklärt unser Ratgeber. Die Lieferzeit hängt von Modell und Bezug ab und steht im Angebot. Lieferung und Montage übernehmen wir auf Wunsch, auf Anfrage auch nach Deutschland, in die Schweiz und nach Liechtenstein.",
      ] },
      { title: "Termin im Minotti Studio", paragraphs: [
        "Für einen Besuch vereinbaren Sie am besten einen Termin, dann sind die passenden Stücke vorbereitet und jemand aus dem Team hat Zeit für Sie. Von Bregenz und Lindau sind es rund fünf Minuten, von Dornbirn rund 20 Minuten über die A14 und von St. Gallen 30 bis 40 Minuten.",
      ] },
    ],
    en: [
      { title: "What is Minotti?", paragraphs: [
        "Minotti is an Italian furniture maker based in Meda in Brianza, north of Milan. Alberto Minotti founded the company as a workshop in 1948; today it produces sofas, armchairs, dining and coffee tables, beds, storage furniture and rugs for the home, as well as dedicated outdoor collections.",
        "Most sofas are modular: individual elements combine into straight shapes, corner solutions or islands, upholstered in fabric or leather. The manufacturer publishes materials, dimensions and care instructions on minotti.com.",
      ] },
      { title: "The Minotti Studio by Platzhirsch Home Living", paragraphs: [
        "{studio} The studio is in our building at Landstraße 11 in Lochau, on Lake Constance between Bregenz and Lindau.",
        "Minotti furniture is shown here in furnished room settings, so you can compare seat height, seat depth, upholstery and covers in person rather than on screen. The selection changes with the collections – if you would like to see a particular model, mention it in your appointment request.",
      ] },
      { title: "Collections and categories", paragraphs: [
        "The catalogue further down lists the Minotti models by category: sofas and armchairs, dining and coffee tables, chairs, beds, sideboards, shelving and rugs. Each category has its own overview with the models and manufacturer images, with links to the individual products and their dimensions.",
      ] },
      { title: "Planning with Harald Menghin", paragraphs: [
        "A sofa looks different in your own room than in a showroom, so our planning starts with the room: Harald Menghin takes time on site, draws the floor plan and the furnishing by hand and, where needed, builds a scale model. 3D planning and a photorealistic rendering follow, showing format, proportions and cover before you order.",
      ] },
      { title: "Pre-planning a sofa", paragraphs: [
        "In the sofa planner you put together a sofa from the elements of the Minotti ranges, using the manufacturer’s dimensions. Bring the result to your appointment; in the studio we check it together against the original and adjust elements, depth and cover.",
      ] },
      { title: "Price, delivery and Switzerland", paragraphs: [
        "Prices are on request because they depend on elements, size, cover and finish; our guide (in German) explains what the price of a Minotti sofa depends on. The delivery time depends on model and cover and is stated in the quote. Delivery and installation are available on request, also to Germany, Switzerland and Liechtenstein.",
      ] },
      { title: "An appointment at the Minotti Studio", paragraphs: [
        "It is best to book an appointment, so the right pieces are prepared and someone from the team has time for you. Bregenz and Lindau are about five minutes away, Dornbirn about 20 minutes via the A14 and St. Gallen 30 to 40 minutes.",
      ] },
    ],
    fr: [
      { title: "Qu’est-ce que Minotti ?", paragraphs: [
        "Minotti est un fabricant italien de meubles établi à Meda, en Brianza, au nord de Milan. Alberto Minotti a fondé l’entreprise en 1948 comme atelier ; elle produit aujourd’hui canapés, fauteuils, tables à manger et tables basses, lits, meubles de rangement et tapis pour la maison, ainsi que des collections dédiées à l’extérieur.",
        "La plupart des canapés sont modulaires : les éléments se combinent en formes droites, en angle ou en îlot, avec des revêtements en tissu ou en cuir. Le fabricant publie matériaux, dimensions et conseils d’entretien sur minotti.com.",
      ] },
      { title: "Le Minotti Studio by Platzhirsch Home Living", paragraphs: [
        "{studio} Le studio se trouve dans notre maison, Landstraße 11 à Lochau, au bord du lac de Constance entre Bregenz et Lindau.",
        "Les meubles Minotti y sont présentés dans des pièces aménagées : vous comparez hauteur et profondeur d’assise, rembourrage et revêtements en les essayant, pas seulement en photo. La sélection change avec les collections ; si vous souhaitez voir un modèle précis, indiquez-le dans votre demande de rendez-vous.",
      ] },
      { title: "Collections et catégories", paragraphs: [
        "Le catalogue plus bas présente les modèles Minotti par catégorie : canapés et fauteuils, tables à manger et tables basses, chaises, lits, buffets, étagères et tapis. Chaque catégorie a sa propre page avec les modèles et les images du fabricant, puis chaque produit avec ses dimensions.",
      ] },
      { title: "La planification avec Harald Menghin", paragraphs: [
        "Un canapé ne fait pas le même effet chez vous qu’en showroom ; c’est pourquoi notre planification commence par la pièce. Harald Menghin prend le temps de venir sur place, dessine le plan et l’aménagement à la main et construit au besoin une maquette. Suivent la planification 3D et un rendu photoréaliste qui montre format, proportions et revêtement avant la commande.",
      ] },
      { title: "Préparer un canapé", paragraphs: [
        "Dans le planificateur de canapé, vous composez un canapé à partir des éléments des gammes Minotti, aux dimensions du fabricant. Apportez le résultat au rendez-vous : au studio, nous le vérifions ensemble sur l’original et ajustons éléments, profondeur et revêtement.",
      ] },
      { title: "Prix, livraison et Suisse", paragraphs: [
        "Les prix sont communiqués sur demande, car ils dépendent des éléments, de la taille, du revêtement et de la finition ; notre guide (en allemand) explique de quoi dépend le prix d’un canapé Minotti. Le délai de livraison dépend du modèle et du revêtement et figure dans l’offre. Livraison et montage sur demande, également en Allemagne, en Suisse et au Liechtenstein.",
      ] },
      { title: "Rendez-vous au Minotti Studio", paragraphs: [
        "Le plus simple est de prendre rendez-vous : les pièces qui vous intéressent sont alors préparées et une personne de l’équipe est disponible pour vous. Bregenz et Lindau sont à environ cinq minutes, Dornbirn à environ 20 minutes par l’A14 et Saint-Gall à 30 à 40 minutes.",
      ] },
    ],
    it: [
      { title: "Che cos’è Minotti?", paragraphs: [
        "Minotti è un produttore italiano di mobili con sede a Meda, in Brianza, a nord di Milano. Alberto Minotti fondò l’azienda nel 1948 come laboratorio; oggi produce divani, poltrone, tavoli da pranzo e tavolini, letti, contenitori e tappeti per la casa, oltre a collezioni dedicate all’esterno.",
        "La maggior parte dei divani è modulare: i singoli elementi si combinano in forme lineari, angolari o a isola, con rivestimenti in tessuto o pelle. Materiali, misure e indicazioni di cura sono pubblicati dal produttore su minotti.com.",
      ] },
      { title: "Il Minotti Studio by Platzhirsch Home Living", paragraphs: [
        "{studio} Lo studio si trova nella nostra casa in Landstraße 11 a Lochau, sul Lago di Costanza tra Bregenz e Lindau.",
        "I mobili Minotti sono esposti in ambienti arredati: altezza e profondità della seduta, imbottitura e rivestimenti si confrontano provandoli, non solo in foto. La selezione cambia con le collezioni; se desiderate vedere un modello preciso, indicatelo nella richiesta di appuntamento.",
      ] },
      { title: "Collezioni e categorie", paragraphs: [
        "Nel catalogo più in basso trovate i modelli Minotti per categoria: divani e poltrone, tavoli da pranzo e tavolini, sedie, letti, madie, librerie e tappeti. Ogni categoria ha una propria panoramica con i modelli e le immagini del produttore, da cui si passa ai singoli prodotti con le misure.",
      ] },
      { title: "La progettazione con Harald Menghin", paragraphs: [
        "Un divano nel proprio ambiente appare diverso che in showroom, per questo la nostra progettazione parte dalla stanza: Harald Menghin si prende il tempo di venire sul posto, disegna a mano pianta e arredo e, se serve, costruisce un modello in scala. Seguono la progettazione 3D e un rendering fotorealistico che mostra formato, proporzioni e rivestimento prima dell’ordine.",
      ] },
      { title: "Progettare un divano in anticipo", paragraphs: [
        "Nel planner divani componete un divano con gli elementi delle linee Minotti, con le misure del produttore. Portate il risultato all’appuntamento: in studio lo verifichiamo insieme sull’originale e adattiamo elementi, profondità e rivestimento.",
      ] },
      { title: "Prezzo, consegna e Svizzera", paragraphs: [
        "I prezzi sono su richiesta perché dipendono da elementi, dimensioni, rivestimento e finitura; la nostra guida (in tedesco) spiega da cosa dipende il prezzo di un divano Minotti. I tempi di consegna dipendono da modello e rivestimento e sono indicati nell’offerta. Consegna e montaggio su richiesta, anche in Germania, Svizzera e Liechtenstein.",
      ] },
      { title: "Appuntamento al Minotti Studio", paragraphs: [
        "Conviene fissare un appuntamento: così i pezzi giusti sono preparati e una persona del team ha tempo per voi. Bregenz e Lindau distano circa cinque minuti, Dornbirn circa 20 minuti via A14 e San Gallo da 30 a 40 minuti.",
      ] },
    ],
  },
  // QM wm-fix3: the studio sentence of the claim register stands in the guide
  // section and in the showroom block (with its evidence link) – not a third
  // time in the FAQ answer.
  faq: {
    de: [
      { q: "Wo kann ich Minotti in Vorarlberg ansehen?", a: "Im Minotti Studio by Platzhirsch Home Living in Lochau, Landstraße 11, am Bodensee zwischen Bregenz und Lindau. Mit Termin bereiten wir die Modelle vor, die Sie interessieren." },
      { q: "Was ist das Minotti Studio by Platzhirsch Home Living?", a: "Es ist der Bereich unseres Showrooms, in dem Minotti-Möbel in eingerichteten Räumen stehen." },
      { q: "Kann ich ein Minotti-Sofa vorab selbst planen?", a: "Ja. Im Sofaplaner stellen Sie Elemente der Minotti-Programme mit den Maßen des Herstellers zusammen; die endgültige Planung machen wir gemeinsam im Studio oder bei Ihnen vor Ort." },
      { q: "Was kostet ein Minotti-Sofa?", a: "Das hängt von Elementen, Größe und Bezug ab, deshalb nennen wir Preise auf Anfrage. Unser Ratgeber erklärt, wovon der Preis abhängt." },
    ],
    en: [
      { q: "Where can I see Minotti in Vorarlberg?", a: "At the Minotti Studio by Platzhirsch Home Living in Lochau, Landstraße 11, on Lake Constance between Bregenz and Lindau. With an appointment we prepare the models you are interested in." },
      { q: "What is the Minotti Studio by Platzhirsch Home Living?", a: "It is the part of our showroom where Minotti furniture is shown in furnished rooms." },
      { q: "Can I plan a Minotti sofa myself beforehand?", a: "Yes. In the sofa planner you combine elements of the Minotti ranges with the manufacturer’s dimensions; we finalise the planning together in the studio or at your home." },
      { q: "How much does a Minotti sofa cost?", a: "It depends on elements, size and cover, so prices are on request. Our guide (in German) explains what the price depends on." },
    ],
    fr: [
      { q: "Où voir Minotti dans le Vorarlberg ?", a: "Au Minotti Studio by Platzhirsch Home Living à Lochau, Landstraße 11, au bord du lac de Constance entre Bregenz et Lindau. Sur rendez-vous, nous préparons les modèles qui vous intéressent." },
      { q: "Qu’est-ce que le Minotti Studio by Platzhirsch Home Living ?", a: "C’est l’espace de notre showroom où les meubles Minotti sont présentés dans des pièces aménagées." },
      { q: "Puis-je planifier moi-même un canapé Minotti à l’avance ?", a: "Oui. Dans le planificateur de canapé, vous combinez des éléments des gammes Minotti aux dimensions du fabricant ; nous finalisons la planification ensemble au studio ou chez vous." },
      { q: "Combien coûte un canapé Minotti ?", a: "Cela dépend des éléments, de la taille et du revêtement ; les prix sont donc communiqués sur demande. Notre guide (en allemand) explique de quoi dépend le prix." },
    ],
    it: [
      { q: "Dove vedere Minotti nel Vorarlberg?", a: "Al Minotti Studio by Platzhirsch Home Living a Lochau, Landstraße 11, sul Lago di Costanza tra Bregenz e Lindau. Con un appuntamento prepariamo i modelli che vi interessano." },
      { q: "Che cos’è il Minotti Studio by Platzhirsch Home Living?", a: "È l’area del nostro showroom in cui i mobili Minotti sono esposti in ambienti arredati." },
      { q: "Posso progettare da solo un divano Minotti in anticipo?", a: "Sì. Nel planner divani combinate elementi delle linee Minotti con le misure del produttore; la progettazione definitiva la facciamo insieme in studio o da voi." },
      { q: "Quanto costa un divano Minotti?", a: "Dipende da elementi, dimensioni e rivestimento, per questo i prezzi sono su richiesta. La nostra guida (in tedesco) spiega da cosa dipende il prezzo." },
    ],
  },
  links: (l) => [
    { href: PATHS.sofaplaner[l], label: sourceCopyFor(l).seoName },
    { href: PATHS.ratgeberMinotti, label: { de: "Ratgeber: Was kostet ein Minotti-Sofa?", en: "Guide: what does a Minotti sofa cost?", fr: "Guide : combien coûte un canapé Minotti ?", it: "Guida: quanto costa un divano Minotti?" }[l] + IN_GERMAN[l], hrefLang: "de" },
    { href: PATHS.arbeitsweise[l], label: T.linkArbeitsweise[l] },
    { href: PATHS.ratgeberSchweiz, label: T.linkSchweiz[l] + IN_GERMAN[l], hrefLang: "de" },
  ],
};

// --- Markenseiten-Muster (AP-7) ------------------------------------------
// what = „Was ist …?“ (Herkunft, Jahr, Gründer, Schwerpunkt; Backoffice +
// Herstellerseite), here = was wir mit der Marke tun (ohne Händlerwort; der
// Händlersatz belegter Marken kommt davor aus dem Claim-Guard).
const PATTERN = {
  rimadesio: {
    sourceUrl: "https://www.rimadesio.it",
    title: { de: "Rimadesio in Vorarlberg – Türen & Schränke | Platzhirsch", en: "Rimadesio in Vorarlberg – doors & wardrobes | Platzhirsch", fr: "Rimadesio au Vorarlberg – portes et dressings | Platzhirsch", it: "Rimadesio in Vorarlberg – porte e armadi | Platzhirsch" },
    description: {
      de: "Rimadesio bei Platzhirsch in Lochau: Schiebetüren, Raumteiler und Ankleiden aus Glas und Aluminium, vor Ort aufgemessen und mit uns geplant.",
      en: "Rimadesio at Platzhirsch in Lochau: sliding doors, room dividers and walk-in wardrobes in glass and aluminium, measured on site and planned with us.",
      fr: "Rimadesio chez Platzhirsch à Lochau : portes coulissantes, cloisons et dressings en verre et aluminium, mesurés sur place et planifiés avec nous.",
      it: "Rimadesio da Platzhirsch a Lochau: porte scorrevoli, divisori e cabine armadio in vetro e alluminio, misurati sul posto e progettati con noi.",
    },
    what: {
      de: "Rimadesio ist ein italienischer Hersteller aus Desio bei Mailand, 1956 von Francesco Malberti und Luigi Riboldi gegründet. Das Unternehmen arbeitet vor allem mit Glas und Aluminium: Schiebe- und Drehtüren, Raumteiler, begehbare Kleiderschränke, Regal- und Wohnsysteme sowie Tische. Viele Entwürfe stammen vom Architekten Giuseppe Bavuso.",
      en: "Rimadesio is an Italian manufacturer from Desio near Milan, founded in 1956 by Francesco Malberti and Luigi Riboldi. The company works mainly with glass and aluminium: sliding and hinged doors, room dividers, walk-in wardrobes, shelving and living systems as well as tables. Many designs are by the architect Giuseppe Bavuso.",
      fr: "Rimadesio est un fabricant italien de Desio, près de Milan, fondé en 1956 par Francesco Malberti et Luigi Riboldi. L’entreprise travaille surtout le verre et l’aluminium : portes coulissantes et battantes, cloisons, dressings, systèmes d’étagères et de séjour ainsi que des tables. De nombreux modèles sont signés par l’architecte Giuseppe Bavuso.",
      it: "Rimadesio è un produttore italiano di Desio, vicino a Milano, fondato nel 1956 da Francesco Malberti e Luigi Riboldi. L’azienda lavora soprattutto vetro e alluminio: porte scorrevoli e a battente, divisori, cabine armadio, sistemi di librerie e soggiorno e tavoli. Molti progetti sono dell’architetto Giuseppe Bavuso.",
    },
    here: {
      de: "Wir führen Rimadesio und planen Schiebetüren, Raumteiler und Ankleiden zusammen mit der übrigen Einrichtung, damit Glas, Profile und Möbel zueinander passen. Für Rimadesio-Systeme messen wir vor Ort auf.",
      en: "We carry Rimadesio and plan sliding doors, room dividers and walk-in wardrobes together with the rest of the interior, so that glass, profiles and furniture match. For Rimadesio systems we measure on site.",
      fr: "Nous proposons Rimadesio et planifions portes coulissantes, cloisons et dressings avec le reste de l’aménagement, pour que verre, profilés et meubles s’accordent. Pour les systèmes Rimadesio, nous prenons les mesures sur place.",
      it: "Proponiamo Rimadesio e progettiamo porte scorrevoli, divisori e cabine armadio insieme al resto dell’arredo, perché vetro, profili e mobili si accordino. Per i sistemi Rimadesio prendiamo le misure sul posto.",
    },
  },
  treca: {
    sourceUrl: "https://www.treca-paris.com",
    title: { de: "Tréca Betten & Matratzen in Vorarlberg | Platzhirsch", en: "Tréca beds & mattresses in Vorarlberg | Platzhirsch", fr: "Lits et matelas Tréca au Vorarlberg | Platzhirsch", it: "Letti e materassi Tréca in Vorarlberg | Platzhirsch" },
    description: {
      de: "Tréca bei Platzhirsch in Lochau: Matratzen und Boxspringbetten aus Frankreich, beraten nach Härtegrad und Maß und als Teil des Schlafzimmers geplant.",
      en: "Tréca at Platzhirsch in Lochau: mattresses and box-spring beds from France, advised by firmness and size and planned as part of the bedroom.",
      fr: "Tréca chez Platzhirsch à Lochau : matelas et sommiers français, conseillés selon fermeté et dimensions et planifiés avec la chambre.",
      it: "Tréca da Platzhirsch a Lochau: materassi e letti boxspring dalla Francia, consigliati per rigidità e misura e progettati con la camera.",
    },
    what: {
      de: "Tréca ist ein französischer Hersteller von Matratzen, Boxspringbetten und Bettwaren, 1935 von der Familie Moritz in Reichshoffen im Elsass gegründet. Der Name geht auf „Tréfilerie-Câblerie“ zurück, die Draht- und Kabelherstellung, aus der die Federkerne kommen. Gefertigt wird in Frankreich, mit Taschenfederkernen und Naturmaterialien wie Wolle und Baumwolle.",
      en: "Tréca is a French maker of mattresses, box-spring beds and bedding, founded in 1935 by the Moritz family in Reichshoffen, Alsace. The name goes back to “Tréfilerie-Câblerie”, the wire and cable production from which the spring units come. Production is in France, with pocket springs and natural materials such as wool and cotton.",
      fr: "Tréca est un fabricant français de matelas, sommiers et literie, fondé en 1935 par la famille Moritz à Reichshoffen, en Alsace. Le nom vient de « Tréfilerie-Câblerie », la fabrication de fils et câbles d’où proviennent les ressorts. La fabrication a lieu en France, avec des ressorts ensachés et des matières naturelles comme la laine et le coton.",
      it: "Tréca è un produttore francese di materassi, letti boxspring e biancheria da letto, fondato nel 1935 dalla famiglia Moritz a Reichshoffen, in Alsazia. Il nome deriva da «Tréfilerie-Câblerie», la produzione di fili e cavi da cui nascono le molle. La produzione è in Francia, con molle insacchettate e materiali naturali come lana e cotone.",
    },
    here: {
      de: "Ein Bett wählt man nicht nach dem Bild. Wir führen Tréca und beraten zu Härtegrad, Aufbau und Maßen; das Bett planen wir mit Kopfteil, Nachttischen und Licht als Teil des Schlafzimmers.",
      en: "A bed is not chosen from a picture. We carry Tréca and advise on firmness, construction and sizes; we plan the bed with headboard, bedside tables and lighting as part of the bedroom.",
      fr: "On ne choisit pas un lit sur photo. Nous proposons Tréca et conseillons sur la fermeté, la construction et les dimensions ; nous planifions le lit avec tête de lit, chevets et éclairage, comme partie de la chambre.",
      it: "Un letto non si sceglie da una foto. Proponiamo Tréca e consigliamo su rigidità, struttura e misure; progettiamo il letto con testiera, comodini e luce come parte della camera.",
    },
  },
  classicon: {
    sourceUrl: "https://www.classicon.com",
    description: {
      de: "ClassiCon bei Platzhirsch in Lochau: Möbel und Leuchten aus München, Klassiker der Moderne und neue Entwürfe – Beratung und Planung am Bodensee.",
      en: "ClassiCon at Platzhirsch in Lochau: furniture and lights from Munich, modern classics and new designs – advice and planning on Lake Constance.",
      fr: "ClassiCon chez Platzhirsch à Lochau : meubles et luminaires de Munich, classiques modernes et créations récentes – conseil au lac de Constance.",
      it: "ClassiCon da Platzhirsch a Lochau: mobili e lampade da Monaco, classici moderni e nuovi progetti – consulenza sul Lago di Costanza.",
    },
    what: {
      de: "ClassiCon ist ein Münchner Hersteller von Möbeln und Leuchten. Das Unternehmen entstand 1990 aus den Vereinigten Werkstätten München. Zur Kollektion gehören lizenzierte Neuauflagen von Entwürfen der klassischen Moderne, etwa von Eileen Gray und Eckart Muthesius, und zeitgenössische Entwürfe, zum Beispiel von Sebastian Herkner.",
      en: "ClassiCon is a Munich manufacturer of furniture and lighting. The company emerged in 1990 from the Vereinigte Werkstätten München. The collection includes licensed re-editions of classic modern designs, for example by Eileen Gray and Eckart Muthesius, and contemporary designs, for example by Sebastian Herkner.",
      fr: "ClassiCon est un fabricant munichois de meubles et de luminaires, issu en 1990 des Vereinigte Werkstätten München. La collection comprend des rééditions sous licence de modèles du modernisme, par exemple d’Eileen Gray et d’Eckart Muthesius, et des créations contemporaines, par exemple de Sebastian Herkner.",
      it: "ClassiCon è un produttore di Monaco di Baviera di mobili e lampade, nato nel 1990 dalle Vereinigte Werkstätten München. La collezione comprende riedizioni su licenza di progetti del modernismo, ad esempio di Eileen Gray ed Eckart Muthesius, e progetti contemporanei, ad esempio di Sebastian Herkner.",
    },
    here: {
      de: "ClassiCon-Stücke planen wir oft als Akzent in einer ruhigen Einrichtung – ein Beistelltisch, eine Leuchte, ein Sessel. Wir beraten zu Ausführungen und Materialien.",
      en: "We often plan ClassiCon pieces as an accent in a calm interior – a side table, a light, an armchair. We advise on versions and materials.",
      fr: "Nous planifions souvent les pièces ClassiCon comme accent dans un intérieur calme – une table d’appoint, un luminaire, un fauteuil. Nous conseillons sur les versions et les matériaux.",
      it: "Spesso progettiamo i pezzi ClassiCon come accento in un arredo tranquillo – un tavolino, una lampada, una poltrona. Consigliamo su versioni e materiali.",
    },
  },
  poliform: {
    sourceUrl: "https://www.poliform.it",
    title: { de: "Poliform in Vorarlberg – Sofas & Schränke | Platzhirsch", en: "Poliform in Vorarlberg – sofas & wardrobes | Platzhirsch", fr: "Poliform au Vorarlberg – canapés et dressings | Platzhirsch", it: "Poliform in Vorarlberg – divani e armadi | Platzhirsch" },
    description: {
      de: "Poliform bei Platzhirsch in Lochau: Sofas, Sessel, Schranksysteme und Ankleiden aus der Brianza – vor Ort aufgemessen und mit uns geplant.",
      en: "Poliform at Platzhirsch in Lochau: sofas, armchairs, wardrobe systems and walk-in closets from Brianza – measured on site and planned with us.",
      fr: "Poliform chez Platzhirsch à Lochau : canapés, fauteuils, rangements et dressings de Brianza – mesurés sur place et planifiés avec nous.",
      it: "Poliform da Platzhirsch a Lochau: divani, poltrone, sistemi armadio e cabine dalla Brianza – misurati sul posto e progettati con noi.",
    },
    what: {
      de: "Poliform ist ein italienischer Möbelhersteller aus der Brianza, 1970 von Alberto Spinelli, Aldo Spinelli und Giovanni Anzani gegründet. Das Sortiment reicht von Schranksystemen und Ankleiden über Küchen bis zu Sofas, Betten und Tischen.",
      en: "Poliform is an Italian furniture maker from Brianza, founded in 1970 by Alberto Spinelli, Aldo Spinelli and Giovanni Anzani. The range covers wardrobe systems and walk-in closets, kitchens, sofas, beds and tables.",
      fr: "Poliform est un fabricant italien de meubles de Brianza, fondé en 1970 par Alberto Spinelli, Aldo Spinelli et Giovanni Anzani. La gamme va des rangements et dressings aux cuisines, canapés, lits et tables.",
      it: "Poliform è un produttore italiano di mobili della Brianza, fondato nel 1970 da Alberto Spinelli, Aldo Spinelli e Giovanni Anzani. La gamma va dai sistemi armadio e cabine alle cucine, ai divani, letti e tavoli.",
    },
    here: {
      de: "Wir führen Poliform und planen Sofas und Sessel zusammen mit Schränken und Ankleiden nach Maß – so entsteht ein Raum aus einem Guss. Aufgemessen wird vor Ort.",
      en: "We carry Poliform and plan sofas and armchairs together with made-to-measure wardrobes and walk-in closets – so the room works as one. Measurements are taken on site.",
      fr: "Nous proposons Poliform et planifions canapés et fauteuils avec des rangements et dressings sur mesure – pour une pièce cohérente. Les mesures sont prises sur place.",
      it: "Proponiamo Poliform e progettiamo divani e poltrone insieme ad armadi e cabine su misura – per un ambiente coerente. Le misure si prendono sul posto.",
    },
  },
  flos: {
    sourceUrl: "https://flos.com",
    description: {
      de: "Flos bei Platzhirsch in Lochau: Leuchten aus Italien, von Klassikern der Castiglioni bis zu neuen Entwürfen – Lichtplanung als Teil der Einrichtung.",
      en: "Flos at Platzhirsch in Lochau: lights from Italy, from Castiglioni classics to new designs – lighting planned as part of the interior.",
      fr: "Flos chez Platzhirsch à Lochau : luminaires italiens, des classiques des Castiglioni aux créations récentes – l’éclairage planifié avec l’intérieur.",
      it: "Flos da Platzhirsch a Lochau: lampade italiane, dai classici dei Castiglioni ai nuovi progetti – la luce progettata con l’arredo.",
    },
    what: {
      de: "Flos ist ein italienischer Leuchtenhersteller, 1962 von Dino Gavina und Cesare Cassina gegründet. Bekannt wurde Flos mit der Cocoon-Technik, bei der Kunstharz auf ein Metallgerüst gesprüht wird. Zur Kollektion gehören Entwürfe von Achille und Pier Giacomo Castiglioni ebenso wie Leuchten aktueller Designerinnen und Designer.",
      en: "Flos is an Italian lighting manufacturer founded in 1962 by Dino Gavina and Cesare Cassina. Flos became known for the Cocoon technique, in which resin is sprayed onto a metal frame. The collection includes designs by Achille and Pier Giacomo Castiglioni as well as lights by contemporary designers.",
      fr: "Flos est un fabricant italien de luminaires fondé en 1962 par Dino Gavina et Cesare Cassina. Flos s’est fait connaître avec la technique Cocoon, une résine pulvérisée sur une structure métallique. La collection réunit des modèles d’Achille et Pier Giacomo Castiglioni et des luminaires de designers actuels.",
      it: "Flos è un produttore italiano di lampade fondato nel 1962 da Dino Gavina e Cesare Cassina. Flos si è fatta conoscere con la tecnica Cocoon, una resina spruzzata su una struttura metallica. La collezione comprende progetti di Achille e Pier Giacomo Castiglioni e lampade di designer contemporanei.",
    },
    here: {
      de: "Licht planen wir als Teil der Einrichtung: Wir legen fest, wo Pendel-, Steh- und Wandleuchten wirken sollen, und wählen die Flos-Modelle passend zu Raumhöhe, Tisch und Sofa.",
      en: "We plan light as part of the interior: we decide where pendant, floor and wall lights should work and choose the Flos models to suit ceiling height, table and sofa.",
      fr: "Nous planifions la lumière avec l’aménagement : nous définissons où suspensions, lampadaires et appliques doivent agir et choisissons les modèles Flos selon la hauteur sous plafond, la table et le canapé.",
      it: "Progettiamo la luce come parte dell’arredo: stabiliamo dove devono agire sospensioni, lampade da terra e applique e scegliamo i modelli Flos in base ad altezza del soffitto, tavolo e divano.",
    },
  },
  "tom-dixon": {
    sourceUrl: "https://www.tomdixon.net",
    description: {
      de: "Tom Dixon bei Platzhirsch in Lochau: Leuchten, Möbel und Accessoires aus Messing, Kupfer und Eisen – Beratung und Planung am Bodensee.",
      en: "Tom Dixon at Platzhirsch in Lochau: lights, furniture and accessories in brass, copper and iron – advice and planning on Lake Constance.",
      fr: "Tom Dixon chez Platzhirsch à Lochau : luminaires, meubles et accessoires en laiton, cuivre et fer – conseil au bord du lac de Constance.",
      it: "Tom Dixon da Platzhirsch a Lochau: lampade, mobili e accessori in ottone, rame e ferro – consulenza sul Lago di Costanza.",
    },
    what: {
      de: "Tom Dixon ist eine britische Designmarke für Leuchten, Möbel und Wohnaccessoires, 2002 vom gleichnamigen Designer gegründet. Typisch sind Metalle wie Messing, Kupfer und Eisen sowie Holz und Stein.",
      en: "Tom Dixon is a British design brand for lighting, furniture and home accessories, founded in 2002 by the designer of the same name. Typical materials are metals such as brass, copper and iron as well as wood and stone.",
      fr: "Tom Dixon est une marque de design britannique de luminaires, meubles et accessoires, fondée en 2002 par le designer du même nom. Les métaux comme le laiton, le cuivre et le fer, ainsi que le bois et la pierre, sont typiques.",
      it: "Tom Dixon è un marchio di design britannico di lampade, mobili e accessori, fondato nel 2002 dall’omonimo designer. Tipici sono metalli come ottone, rame e ferro, oltre a legno e pietra.",
    },
    here: {
      de: "Tom-Dixon-Leuchten setzen wir gern als Gruppe über dem Esstisch oder als Akzent im Wohnraum ein; Höhe, Abstand und Lichtfarbe planen wir mit.",
      en: "We like to use Tom Dixon lights as a group above the dining table or as an accent in the living room; we plan height, spacing and light colour as well.",
      fr: "Nous utilisons volontiers les luminaires Tom Dixon en groupe au-dessus de la table ou comme accent dans le séjour ; hauteur, espacement et couleur de lumière sont planifiés aussi.",
      it: "Usiamo volentieri le lampade Tom Dixon in gruppo sopra il tavolo da pranzo o come accento nel soggiorno; progettiamo anche altezza, distanza e colore della luce.",
    },
  },
  "paola-lenti": {
    sourceUrl: "https://www.paolalenti.it",
    title: { de: "Paola Lenti in Vorarlberg – Outdoor-Möbel | Platzhirsch", en: "Paola Lenti in Vorarlberg – outdoor furniture | Platzhirsch", fr: "Paola Lenti au Vorarlberg – mobilier outdoor | Platzhirsch", it: "Paola Lenti in Vorarlberg – arredi outdoor | Platzhirsch" },
    description: {
      de: "Paola Lenti bei Platzhirsch in Lochau: Sitzmöbel, Teppiche und Polster aus wetterfesten Garnen für Garten und Terrasse am Bodensee.",
      en: "Paola Lenti at Platzhirsch in Lochau: seating, rugs and cushions made from weather-resistant yarns for gardens and terraces on Lake Constance.",
      fr: "Paola Lenti chez Platzhirsch à Lochau : assises, tapis et coussins en fils résistants aux intempéries pour jardin et terrasse.",
      it: "Paola Lenti da Platzhirsch a Lochau: sedute, tappeti e cuscini in filati resistenti alle intemperie per giardino e terrazza.",
    },
    what: {
      de: "Paola Lenti ist eine italienische Marke, 1994 von der Designerin Paola Lenti gegründet. Im Mittelpunkt stehen eigene Garne wie Rope, ein rundes, wasserfestes Garn, aus dem Sitzmöbel, Teppiche und Polster für drinnen und draußen entstehen.",
      en: "Paola Lenti is an Italian brand founded in 1994 by the designer Paola Lenti. At its core are its own yarns such as Rope, a round, water-resistant yarn used for seating, rugs and cushions for indoors and outdoors.",
      fr: "Paola Lenti est une marque italienne fondée en 1994 par la designer Paola Lenti. Au cœur de la marque : ses propres fils, comme Rope, un fil rond et résistant à l’eau dont naissent assises, tapis et coussins pour l’intérieur et l’extérieur.",
      it: "Paola Lenti è un marchio italiano fondato nel 1994 dalla designer Paola Lenti. Al centro ci sono filati propri come Rope, un filato tondo e resistente all’acqua con cui nascono sedute, tappeti e cuscini per interni ed esterni.",
    },
    here: {
      de: "Wir führen Paola Lenti und planen Terrassen und Gärten am See mit Sitzgruppen, Teppichen und Schatten – mit Blick auf Sonne, Wind und den Platz im Winter.",
      en: "We carry Paola Lenti and plan terraces and gardens by the lake with seating groups, rugs and shade – with sun, wind and winter storage in mind.",
      fr: "Nous proposons Paola Lenti et planifions terrasses et jardins au bord du lac avec salons, tapis et ombrage – en tenant compte du soleil, du vent et du rangement en hiver.",
      it: "Proponiamo Paola Lenti e progettiamo terrazze e giardini sul lago con salotti, tappeti e ombra – pensando a sole, vento e rimessaggio invernale.",
    },
  },
};

/** Slugs (generateSlug(name1)) with an own guide text. */
export const GUIDE_BRANDS = Object.freeze(["minotti", ...Object.keys(PATTERN)]);

const pick = (o, l) => (o ? o[l] || o.de : "");

/**
 * Localised guide of a brand page, or null.
 * @returns {null | { h1, title, description, sourceUrl, sections: {title, paragraphs[]}[], faq: {q,a}[], links: {href,label,hrefLang?}[] }}
 *   title is null where the claim-driven title (brandTitle.js) stays.
 */
export function brandGuide(slug, locale = "de", brandName = "") {
  const l = GUIDE_LOCALES.includes(locale) ? locale : "de";
  if (slug === "minotti") {
    const studio = dealerStudio("minotti", l)?.statement || "";
    const fill = (s) => s.replace("{studio}", studio).replace(/\s{2,}/g, " ").trim();
    return {
      h1: pick(MINOTTI.h1, l),
      title: null,
      description: pick(MINOTTI.description, l),
      sourceUrl: MINOTTI.sourceUrl,
      sections: MINOTTI.sections[l].map((s) => ({ title: s.title, paragraphs: s.paragraphs.map(fill) })),
      faq: MINOTTI.faq[l].map((f) => ({ q: f.q, a: fill(f.a) })),
      links: MINOTTI.links(l),
    };
  }
  const g = PATTERN[slug];
  if (!g) return null;
  const brand = String(brandName || slug).trim();
  // Händlersatz nur aus dem Claim-Guard; unbelegte Marken bekommen keinen.
  const dealer = isVerifiedDealerBrand(slug) ? dealerStatement(slug, l) : "";
  return {
    h1: T.h1[l](brand),
    title: g.title && !isVerifiedDealerBrand(slug) ? pick(g.title, l) : null,
    description: pick(g.description, l),
    sourceUrl: g.sourceUrl,
    sections: [
      { title: T.whatTitle[l](brand), paragraphs: [pick(g.what, l)] },
      { title: T.hereTitle[l](brand), paragraphs: [[dealer, pick(g.here, l)].filter(Boolean).join(" "), T.visit[l](brand)] },
    ],
    faq: [T.faqWhere[l](brand, dealer), T.faqDelivery[l](brand), T.faqSwiss[l](brand)],
    links: [
      { href: PATHS.arbeitsweise[l], label: T.linkArbeitsweise[l] },
      { href: PATHS.ratgeberSchweiz, label: T.linkSchweiz[l] + IN_GERMAN[l], hrefLang: "de" },
    ],
  };
}

/** Word count of a guide's visible prose (sections + FAQ), for tests and the report. */
export function guideWordCount(guide) {
  if (!guide) return 0;
  const text = [...guide.sections.flatMap((s) => [s.title, ...s.paragraphs]), ...guide.faq.flatMap((f) => [f.q, f.a])].join(" ");
  return text.split(/\s+/).filter(Boolean).length;
}
