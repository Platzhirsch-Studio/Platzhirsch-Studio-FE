// Texts of the new homepage (Paket "Startseite", Neuauftritt).
//
// All texts live in the "HomePage" namespace of src/messages/{de,en,fr,it}.json.
// Round 3 (R3-startseite) removed the full HOME_COPY fallback; round 4
// (R4-i18n) merged the last round-3 keys (scroll.*, seo.*, proposal
// Marktresearch/digital/teamleiter/messages-r3-startseite.json); round 5
// (R5-i18n) deleted the data copy of those keys (pendingCopy.js).
// tests/unit/r3-startseite.test.mjs keeps every key
// the homepage reads covered in all four locales. A missing key renders as the
// key itself (next-intl default), so a gap is visible in QA.
//
// Voice (Design-Bibel §1): Sie-Form, short sentences, facts instead of
// adjectives, no exclamation marks, no superlatives. Brands are "gezeigt" or
// "geplant", never "geführt"/"offiziell". No unconfirmed promises (duration
// or cost of the appointment, café hours, travel times, deposit protection).
import { getTranslations } from "next-intl/server";
import { sourceCopyFor } from "../../lib/sofaplaner/consent.js";

/** Translator for the "HomePage" namespace. Server only. */
export async function getHomeT(locale) {
  const t = await getTranslations({ locale, namespace: "HomePage" });
  return (key, values) => t(key, values);
}

// Fix-Runde 1 (F1-usp-startseite-wow): texts of the new homepage parts that
// are not (yet) in src/messages/*.json – those files belong to the i18n team
// (F3) this round. Same voice rules as above. Move into HomePage.* when the
// messages are next merged; tests/unit/f1-startseite.test.mjs keeps all four
// locales complete.
//  - lineCaption (R5-USP, gesamtwerk P0-1 / neuland P1-1, bewusst geändert):
//    the SAME string as the Wow credit (src/lib/wow/messages.js caption.phaseA)
//    and /arbeitsweise (HERO.lineCaption) – "Zeichen des Studios", no
//    negation at a "Von Hand gezeichnet" headline, never Harald's hand.
//    Used by LineStudy (today only on /de/arbeitsweise: the USP chapter of
//    the homepage is typographic while media.js has no real material).
//  - lineNote: the honest note on what the hero line is, ONCE, small, in the
//    footer of the USP chapter (not at the H1).
//  - processType: the typographic composition of the USP chapter instead of
//    a picture (no real sketch yet, WOW_PHASE "A").
//  - house.*: the typographic composition in the dark chapter (no photo: the
//    rights of the showroom photos are still open in Marktresearch/recht/bildrechte.csv).
const F1 = {
  de: {
    lineCaption: "Showroom Lochau · Linie: Zeichen des Studios",
    lineNote: "Die Linie im Einstiegsbild ist eine digitale Grafik des Studios nach dem Foto des Showrooms.",
    processType: { a: "Papier.", b: "Modell.", c: "Raum.", line: "Designs, die leben." },
    lineLabel: "Abstrahierte Liniengrafik des Showrooms in Lochau: Raum, Kamin und zwei Sessel",
    house: { a: "Café", b: "Ausstellung", line: "Ein Haus · Landstraße 11 · Lochau am Bodensee" },
  },
  en: {
    lineCaption: "Showroom Lochau · Line: the studio’s mark",
    lineNote: "The line in the opening image is a digital graphic by the studio, after the photo of the showroom.",
    processType: { a: "Paper.", b: "Model.", c: "Room.", line: "Designs that live." },
    lineLabel: "Abstracted line graphic of the showroom in Lochau: room, fireplace and two armchairs",
    house: { a: "Café", b: "Showroom", line: "One house · Landstraße 11 · Lochau on Lake Constance" },
  },
  fr: {
    lineCaption: "Showroom de Lochau · Ligne : signe du studio",
    lineNote: "La ligne de l’image d’ouverture est un graphisme numérique du studio, d’après la photo du showroom.",
    processType: { a: "Papier.", b: "Maquette.", c: "Espace.", line: "Des intérieurs qui vivent." },
    lineLabel: "Graphique linéaire abstrait du showroom de Lochau : pièce, cheminée et deux fauteuils",
    house: { a: "Café", b: "Showroom", line: "Une maison · Landstraße 11 · Lochau au bord du lac de Constance" },
  },
  it: {
    lineCaption: "Showroom di Lochau · Linea: segno dello studio",
    lineNote: "La linea dell’immagine d’apertura è una grafica digitale dello studio, dalla foto dello showroom.",
    processType: { a: "Carta.", b: "Plastico.", c: "Spazio.", line: "Progetti che vivono." },
    lineLabel: "Grafica lineare astratta dello showroom di Lochau: ambiente, camino e due poltrone",
    house: { a: "Caffè", b: "Showroom", line: "Una casa · Landstraße 11 · Lochau sul Lago di Costanza" },
  },
};

/** F1 texts for a locale (falls back to German). */
export function f1Copy(locale) {
  return F1[locale] || F1.de;
}

export const F1_COPY = F1;


// Runde 2, Fix-Team P2 (ux P1-2/P1-7/P2-5, gesamtwerk P1-5, seo P1-1):
// texts of the homepage parts that src/messages/*.json (i18n team, P1) does
// not carry yet. Same voice rules as above; no dealer claims, no prices, no
// references. tests/unit/r7-p2-links.test.mjs keeps all four locales complete.
//  (The hero USP sentence itself is HomePage.hero.lead in the messages.)
//  - objekt: fifth service card "Hotel, Gastronomie & Objekt".
//  - serviceLink: link texts outside DE, where the cards lead to the catalogue
//    or the consultation page in the visitor's language (landingTarget).
//  - tools: "Try it first" outside DE – the planners exist in German only and
//    are marked as such (gesamtwerk P1-5).
//  - regionsTeaser: DE teaser lines of the indexed region pages.
const R7 = {
  de: {
    objekt: {
      title: "Hotel, Gastronomie & Objekt",
      text: "Zimmer, Lobby, Restaurant und Büro. Von Hand gezeichnet, ein Musterzimmer als Modell, danach in 3D für die ganze Serie geplant.",
      link: "Hotel- oder Objektprojekt anfragen",
    },
    serviceLink: {},
    tools: {
      eyebrow: "Online planen",
      title: "Vorab ausprobieren",
      lead: "Küche planen, Sofa zusammenstellen, Möbel in 3D ansehen. Danach zeichnet Harald Menghin Ihr Konzept von Hand.",
      german: "auf Deutsch",
      items: {
        kuechenplaner: { title: "Küchenplaner", text: "Grundriss, Zeilen und Fronten Ihrer Küche skizzieren." },
        sofaplaner: { title: "Sofaplaner", text: "Ein Sofa aus Modulen im eigenen Raum planen." }, // r7Copy() setzt SOURCE_COPY_I18N ein
        arviewer: { title: "Möbel in 3D", text: "Ausgewählte Stücke in 3D drehen und im Raum ansehen." },
        stilfinder: { title: "Stil-Finder", text: "In wenigen Fragen zu Ihrem Einrichtungsstil." },
      },
    },
    regionsHeading: "Designermöbel und Beratung in Ihrer Region",
    regionsTeaser: {
      "/designermoebel-liechtenstein": "Vaduz, Schaan und das Unterland, mit Infos zu Zoll und MWST.",
      "/designermoebel-rheintal": "Widnau, Heerbrugg und Altstätten, rund 30 Minuten entfernt.",
      "/designermoebel-arlberg": "Chalet, Ferienwohnung und Hotel in Lech, Zürs und St. Anton.",
      "/designermoebel-konstanz": "Konstanz und der westliche Bodensee.",
      "/designermoebel-feldkirch": "Feldkirch, Rankweil, Götzis und das Oberland.",
      "/designermoebel-appenzell": "Das Appenzellerland, mit Infos zur Einfuhr.",
    },
  },
  en: {
    objekt: {
      title: "Hotel, hospitality & contract",
      text: "Guest rooms, lobby, restaurant and office. Drawn by hand, a sample room as a model, then planned in 3D for the whole series.",
      link: "Request a hotel or contract project",
    },
    serviceLink: {
      kitchen: "Kitchens in the catalogue",
      interior: "Request an interior design project",
      outdoor: "Outdoor furniture in the catalogue",
      yacht: "Request a yacht interior project",
    },
    tools: {
      eyebrow: "Plan online",
      title: "Try it first",
      lead: "Plan a kitchen, put together a sofa, view furniture in 3D. Afterwards Harald Menghin draws your concept by hand. The 3D view is in German for now.",
      german: "in German",
      items: {
        kuechenplaner: { title: "Kitchen planner", text: "Sketch the layout, runs and fronts of your kitchen." },
        sofaplaner: { title: "Sofa planner", text: "Plan a sofa from modules in your own room." }, // r7Copy() setzt SOURCE_COPY_I18N ein
        arviewer: { title: "Furniture in 3D", text: "Turn selected pieces in 3D and view them in your room." },
        stilfinder: { title: "Style finder", text: "A few questions to your interior style." },
      },
    },
    regionsHeading: "Designer furniture and advice in your region",
    regionsTeaser: {},
  },
  fr: {
    objekt: {
      title: "Hôtellerie, restauration & projets",
      text: "Chambres, lobby, restaurant et bureaux. Dessinés à la main, une chambre témoin en maquette, puis planifiés en 3D pour toute la série.",
      link: "Demander un projet hôtelier",
    },
    serviceLink: {
      kitchen: "Les cuisines du catalogue",
      interior: "Demander un projet d’aménagement",
      outdoor: "Le mobilier d’extérieur du catalogue",
      yacht: "Demander un projet de yacht",
    },
    tools: {
      eyebrow: "Planifier en ligne",
      title: "Essayer d’abord",
      lead: "Planifier une cuisine, composer un canapé, voir des meubles en 3D. Ensuite, Harald Menghin dessine votre concept à la main. La vue 3D est pour l’instant en allemand.",
      german: "en allemand",
      items: {
        kuechenplaner: { title: "Planificateur de cuisine", text: "Esquisser le plan, les linéaires et les façades de votre cuisine." },
        sofaplaner: { title: "Planificateur de canapé", text: "Planifier un canapé à partir de modules dans votre pièce." }, // r7Copy() setzt SOURCE_COPY_I18N ein
        arviewer: { title: "Meubles en 3D", text: "Faire tourner des pièces choisies en 3D et les voir chez vous." },
        stilfinder: { title: "Test de style", text: "Quelques questions pour trouver votre style." },
      },
    },
    regionsHeading: "Mobilier design et conseil dans votre région",
    regionsTeaser: {},
  },
  it: {
    objekt: {
      title: "Hotel, ristorazione & contract",
      text: "Camere, lobby, ristorante e uffici. Disegnati a mano, una camera campione come plastico, poi progettati in 3D per tutta la serie.",
      link: "Richiedete un progetto hotel o contract",
    },
    serviceLink: {
      kitchen: "Le cucine nel catalogo",
      interior: "Richiedete un progetto d’interni",
      outdoor: "Arredi outdoor nel catalogo",
      yacht: "Richiedete un progetto per yacht",
    },
    tools: {
      eyebrow: "Progettare online",
      title: "Provate prima",
      lead: "Progettate una cucina, componete un divano, guardate i mobili in 3D. Poi Harald Menghin disegna a mano il vostro progetto. Per ora la vista 3D è in tedesco.",
      german: "in tedesco",
      items: {
        kuechenplaner: { title: "Planner cucina", text: "Abbozzate pianta, composizioni e frontali della vostra cucina." },
        sofaplaner: { title: "Planner divano", text: "Progettate un divano a moduli nel vostro ambiente." }, // r7Copy() setzt SOURCE_COPY_I18N ein
        arviewer: { title: "Mobili in 3D", text: "Ruotate in 3D pezzi scelti e guardateli nel vostro ambiente." },
        stilfinder: { title: "Test di stile", text: "Poche domande per trovare il vostro stile." },
      },
    },
    regionsHeading: "Mobili di design e consulenza nella vostra regione",
    regionsTeaser: {},
  },
};

/**
 * Runde-2 texts (Fix-Team P2) for a locale (falls back to German).
 * R8 (recht P0-1, ux P1-4): the sofa planner card always takes its name and
 * text from SOURCE_COPY_I18N (src/lib/sofaplaner/consent.js) – without the
 * Minotti consent no brand and no "real elements". R7 itself stays plain data
 * (tests/unit/r7-p2-links.test.mjs reads it as such).
 */
export function r7Copy(locale) {
  const base = R7[locale] || R7.de;
  const sofa = sourceCopyFor(locale);
  return {
    ...base,
    tools: { ...base.tools, items: { ...base.tools.items, sofaplaner: { title: sofa.seoName, text: sofa.leadShort } } },
  };
}

export const R7_COPY = R7;

// Rat 9,5 (B18): driving-time and map-source texts are HomePage.region.* in
// src/messages (übernommen 30.10.2026; the local table B18 is gone).
