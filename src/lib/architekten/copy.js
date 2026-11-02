// src/lib/architekten/copy.js – Texte der Seite /[locale]/architekten (DE, EN).
// Welle 2, Team Architekten. Eigene Content-Datei (nicht src/messages).
// Regeln: keine Preise, keine Referenzen/Projekte/Kunden, keine Superlative,
// Händler-Aussage nur ClassiCon/Ezarri und NUR über dealerStatement()
// (src/lib/legal/claims.js) plus ezarriDealerClaimVisible() in der Seite –
// nie als fester Text (QA Welle 2 P1-2). CAD/BIM-Daten kommen vom
// Hersteller, soweit er sie bereitstellt – kein eigenes Versprechen.
// Haralds Skizze: nur Text, kein Bild, bis echtes Material da ist (Nr. 8).
// Einzige Content-Datei der Seite (content.js ist mit QA Welle 2 entfallen).
// Pure module (node --test): tests/unit/architekten.test.mjs.

// FR und IT seit 01.11.2026 in ./copy-intl.js (Gruppe schweiz-service).
import { ARCHITEKTEN_INTL } from "./copy-intl.js";

export const LOCALES = Object.freeze(["de", "en", "fr", "it"]);
export const PATH = "/architekten";
export const isArchitektenLocale = (locale) => LOCALES.includes(locale);

/**
 * Inhaber-Slot: feste Ansprechperson { name, role: {de,en}, email? }.
 * null = die Seite nennt nur die Rolle, keinen Namen (nichts erfunden).
 */
export const ANSPRECHPERSON = null;

const DE = {
  META: {
    title: "Für Architekten und Bauträger | Platzhirsch Home Living",
    description:
      "Planungsdaten beim Hersteller anfragen, Materialmuster bestellen, Musterwohnung und Home-Staging: Platzhirsch in Lochau arbeitet mit Architekturbüros, Bauträgern und Maklern.",
  },
  CRUMBS: [{ label: "Startseite", href: "/" }, { label: "Architekten und Bauträger" }],
  HERO: {
    overline: "Für Planungsbüros, Bauträger und Makler",
    title: "Ihr Entwurf. Unsere Einrichtung.",
    lead: "Wir planen Möbel, Küche, Licht und Outdoor für Ihre Projekte, besorgen die Planungsdaten der Hersteller und schicken Muster. Eine Ansprechperson aus unserem Team begleitet Ihr Projekt vom ersten Plan bis zur Montage.",
    cta: "Projekt anfragen",
    ctaNote: "Projektpreise auf Anfrage",
    staging: "Zu Home-Staging und Musterwohnung",
  },
  ANGEBOT: {
    overline: "Was Sie von uns bekommen",
    title: "Vier Dinge, die Ihre Planung leichter machen",
    items: [
      {
        id: "daten",
        title: "Planungsdaten über den Hersteller",
        text: "Wir fragen CAD-Zeichnungen, BIM-Objekte, Datenblätter und Pflegehinweise beim Hersteller an, soweit er sie bereitstellt, und schicken sie Ihnen gesammelt.",
      },
      {
        id: "muster",
        title: "Materialmuster und Ezarri-Muster",
        text: "Stoff, Leder, Holz, Stein und Oberflächen als Muster für Ihre Bemusterung, dazu Glasmosaik-Muster von Ezarri.",
        dealerBrand: "ezarri",
      },
      {
        id: "preise",
        title: "Projektpreise auf Anfrage",
        text: "Für Projekte mit mehreren Einheiten rechnen wir ein eigenes Angebot. Preise nennen wir erst, wenn Mengen und Ausführung feststehen.",
      },
      {
        id: "person",
        title: "Eine Ansprechperson für Ihr Projekt",
        text: "Eine Person aus unserem Team kennt Ihr Projekt und ist für Rückfragen, Termine und Muster erreichbar.",
      },
    ],
    contactRole: "Ansprechperson für Planungsbüros und Bauträger",
    contactFallback: "Wer Ihr Projekt betreut, erfahren Sie mit unserer ersten Antwort.",
    contactMail: "E-Mail an {name}",
  },
  ABLAUF: {
    overline: "Zusammenarbeit",
    title: "Von der Handskizze zur Ausschreibung",
    lead: "Harald Menghin zeichnet Einrichtungen und Konzepte von Hand. Die Skizze ist die gemeinsame Sprache zwischen Ihrem Büro, der Bauherrschaft und uns. Erst danach planen wir in 3D.",
    steps: [
      { title: "Gespräch und Pläne", text: "Sie schicken Grundrisse, Schnitte und Ihre Idee. Wir sprechen im Showroom in Lochau, per Video oder auf der Baustelle." },
      { title: "Handskizze", text: "Harald skizziert Möblierung, Blickachsen und Stimmungen von Hand, auf Ihren Plänen. So lässt sich früh und schnell abstimmen." },
      { title: "Modell", text: "Wenn das Projekt es braucht, baut er ein Raummodell im Maßstab, das man anfassen und gemeinsam umstellen kann." },
      { title: "3D-Planung und Rendering", text: "Wir planen mit exakten Maßen, Produkten und Materialien und rendern fotorealistisch, für Ihre Präsentation oder den Verkauf." },
      { title: "Ausschreibung", text: "Wir liefern Produktlisten mit Maßen, Materialien und Herstellerangaben als Grundlage für Ihr Leistungsverzeichnis." },
      { title: "Lieferung und Montage", text: "Lieferung, Montage auf Wunsch und Abstimmung mit den anderen Gewerken auf der Baustelle. Die Bauleitung bleibt bei Ihnen." },
    ],
    processLink: "Unsere Arbeitsweise im Detail",
  },
  BAUTRAEGER: {
    overline: "Für Bauträger",
    title: "Musterwohnung und Ausstattungslinien",
    lead: "Eine eingerichtete Wohnung zeigt Käufern, wie sich der Grundriss bewohnen lässt. Für die Käufer selbst planen wir Ausstattungslinien, aus denen sie wählen können.",
    items: [
      { title: "Musterwohnung", text: "Wir planen und richten eine Musterwohnung ein, abgestimmt auf Zielgruppe, Grundriss und Licht des Projekts." },
      { title: "Ausstattungslinien", text: "Zwei oder drei abgestimmte Linien für Küche, Wohnen und Schlafen, die Käufer mit ihrer Wohnung bestellen können." },
      { title: "Erstbezug-Beratung", text: "Käufer bekommen einen Termin im Showroom und eine Planung für ihre Wohnung, auf Wunsch mit Küche und Outdoor." },
    ],
  },
  STAGING: {
    overline: "Für Bauträger und Makler",
    title: "Home-Staging und Musterwohnungen",
    lead: "Wir richten eine Musterwohnung oder ein Verkaufsobjekt auf Zeit ein und räumen es nach der Verkaufsphase wieder aus.",
    steps: [
      { title: "Planung mit Skizze", text: "Harald skizziert die Einrichtung für Grundriss, Licht und Käufergruppe. Sie sehen den Vorschlag, bevor etwas geliefert wird." },
      { title: "Lieferung und Aufbau", text: "Wir liefern, bauen auf und richten die Räume bis zur Fotografie und Besichtigung fertig ein." },
      { title: "Verkaufsphase", text: "Die Einrichtung bleibt für die vereinbarte Zeit. Wir sind erreichbar, wenn etwas nachgestellt werden soll." },
      { title: "Abbau", text: "Nach der Verkaufsphase bauen wir ab und holen die Möbel wieder ab." },
    ],
    buyer: {
      title: "Für die Käufer",
      text: "Käufer können die Möbel übernehmen oder die Wohnung mit uns neu planen. Beides sprechen wir mit Ihnen ab, bevor wir es den Käufern anbieten.",
    },
    note: "Dauer, Umfang und Kosten vereinbaren wir je Objekt.",
    cta: "Home-Staging anfragen",
  },
  MUSTER: {
    overline: "Musteranfrage",
    title: "Muster zusammenstellen",
    lead: "Wählen Sie, welche Muster Sie brauchen. Die Liste geht mit Ihrer Anfrage an uns. Ohne Preise, ohne Kundenkonto.",
    groups: [
      { id: "stoff", label: "Stoffmuster für Polster" },
      { id: "leder", label: "Ledermuster" },
      { id: "holz", label: "Holz und Furnier" },
      { id: "stein", label: "Stein und Keramik für Arbeitsplatten" },
      { id: "oberflaeche", label: "Metall und lackierte Oberflächen" },
      { id: "outdoor", label: "Outdoor-Stoffe und -Materialien" },
      { id: "ezarri", label: "Ezarri-Glasmosaik" },
    ],
    ezarriLink: "Ezarri-Muster mit Farbwahl",
    merkliste: "Stücke aus meiner Merkliste mitschicken ({count})",
    count: "{count} Muster gewählt",
    none: "Noch keine Muster gewählt",
    clear: "Liste leeren",
  },
  FORM: {
    overline: "Anfrage",
    title: "Erzählen Sie uns von Ihrem Projekt",
    lead: "Je mehr wir über Phase und Bedarf wissen, desto genauer wird unsere erste Antwort.",
    anliegen: {
      legend: "Worum geht es?",
      options: {
        architekt: "Planung für ein Projekt meines Büros",
        bautraeger: "Musterwohnung oder Ausstattungslinie",
        staging: "Home-Staging auf Zeit",
        muster: "Nur Muster oder Planungsdaten",
      },
    },
    buero: "Büro oder Firma",
    projektart: { label: "Projektart", options: ["Einfamilienhaus", "Wohnanlage", "Hotel oder Gastronomie", "Büro oder Praxis", "Chalet oder Ferienwohnung", "Anderes"] },
    phase: { label: "Projektphase", options: ["Vorentwurf", "Entwurf und Einreichung", "Ausführungsplanung", "Ausschreibung", "Bau läuft", "Fertigstellung und Verkauf"] },
    bedarf: { label: "Was brauchen Sie?", hint: "Zum Beispiel Möblierung für 12 Wohnungen, Küchen, Planungsdaten für bestimmte Produkte, Termin." },
    choose: "Bitte wählen",
    vorname: "Vorname",
    nachname: "Nachname",
    email: "E-Mail",
    telefon: "Telefon",
    optional: "optional",
    submit: "Anfrage senden",
    sending: "Wird gesendet …",
    errors: {
      required: "Bitte füllen Sie dieses Feld aus.",
      choose: "Bitte wählen Sie eine Option.",
      email: "Bitte geben Sie eine gültige E-Mail-Adresse an.",
      phone: "Bitte prüfen Sie die Telefonnummer.",
      bedarf: "Bitte beschreiben Sie Ihren Bedarf in mindestens 10 Zeichen.",
      summary: "Bitte prüfen Sie {count} Angaben.",
    },
    success: {
      title: "Danke, Ihre Anfrage ist da.",
      text: "Wir melden uns mit Ihrer Ansprechperson und den nächsten Schritten.",
    },
    // Erste Zeilen des Anfragetexts (Backoffice, Sprache der Seite).
    lines: {
      kontext: "Anfrage über die Seite für Architekten und Bauträger",
      buero: "Büro",
      phase: "Projektphase",
      muster: "Musterwunsch",
      merkliste: "Aus der Merkliste",
      bedarf: "Bedarf",
    },
  },
  FAQ: {
    overline: "Fragen",
    title: "Häufige Fragen aus Planungsbüros",
    items: [
      { q: "Bekommen wir CAD- und BIM-Daten?", a: "Wir fragen die Daten beim Hersteller an. Was es gibt, hängt vom Hersteller und vom Produkt ab. Wir sagen Ihnen offen, wenn es zu einem Produkt keine Daten gibt." },
      { q: "Was kosten Muster?", a: "Das hängt von Hersteller und Menge ab. Wir sagen es Ihnen vor dem Versand. Ezarri-Muster bestellen Sie über unsere Ezarri-Musteranfrage." },
      { q: "Wer rechnet ab, wer leitet die Baustelle?", a: "Wir rechnen unsere Lieferungen und Leistungen ab. Die Bauleitung und die Leistungen anderer Gewerke bleiben bei Ihnen oder der Bauherrschaft." },
      { q: "Arbeiten Sie auch in der Schweiz, in Deutschland und in Liechtenstein?", a: "Ja, wir planen von Lochau aus für Projekte in Vorarlberg und den Nachbarländern. Lieferung und Montage vereinbaren wir je Projekt." },
    ],
  },
  NOTICE_LANG: null,
};

const EN = {
  META: {
    title: "For architects and developers | Platzhirsch Home Living",
    description:
      "Request planning data from manufacturers, order material samples, show flats and home staging: Platzhirsch in Lochau works with architecture offices, developers and estate agents.",
  },
  CRUMBS: [{ label: "Home", href: "/" }, { label: "Architects and developers" }],
  HERO: {
    overline: "For planning offices, developers and agents",
    title: "Your design. Our interiors.",
    lead: "We plan furniture, kitchens, lighting and outdoor areas for your projects, obtain the manufacturers’ planning data and send samples. One contact on our team stays with your project from the first plan to installation.",
    cta: "Enquire about a project",
    ctaNote: "Project prices on request",
    staging: "Home staging and show flats",
  },
  ANGEBOT: {
    overline: "What you get from us",
    title: "Four things that make your planning easier",
    items: [
      { id: "daten", title: "Planning data from the manufacturer", text: "We request CAD drawings, BIM objects, data sheets and care instructions from the manufacturer, where available, and send them to you in one package." },
      { id: "muster", title: "Material samples and Ezarri samples", text: "Fabric, leather, wood, stone and finishes as samples for your selection, plus glass mosaic samples from Ezarri.", dealerBrand: "ezarri" },
      { id: "preise", title: "Project prices on request", text: "For projects with several units we prepare a separate offer. We quote prices once quantities and specifications are fixed." },
      { id: "person", title: "One contact for your project", text: "One person on our team knows your project and is available for questions, appointments and samples." },
    ],
    contactRole: "Contact for planning offices and developers",
    contactFallback: "Our first reply tells you who will look after your project.",
    contactMail: "Email {name}",
  },
  ABLAUF: {
    overline: "Working together",
    title: "From hand sketch to tender",
    lead: "Harald Menghin draws interiors and concepts by hand. The sketch is the shared language between your office, the client and us. Only then do we plan in 3D.",
    steps: [
      { title: "Meeting and plans", text: "You send floor plans, sections and your idea. We meet in the showroom in Lochau, by video or on site." },
      { title: "Hand sketch", text: "Harald sketches furnishing, sight lines and moods by hand, on your plans. This makes early decisions quick and easy." },
      { title: "Model", text: "If the project needs it, he builds a scale model of the room that you can touch and rearrange together." },
      { title: "3D planning and rendering", text: "We plan with exact dimensions, products and materials and render photorealistically, for your presentation or for sales." },
      { title: "Tender", text: "We provide product lists with dimensions, materials and manufacturer details as a basis for your bill of quantities." },
      { title: "Delivery and installation", text: "Delivery, installation on request and coordination with the other trades on site. Site management stays with you." },
    ],
    processLink: "How we work in detail",
  },
  BAUTRAEGER: {
    overline: "For developers",
    title: "Show flats and fit-out lines",
    lead: "A furnished flat shows buyers how the floor plan can be lived in. For the buyers themselves we plan fit-out lines they can choose from.",
    items: [
      { title: "Show flat", text: "We plan and furnish a show flat, matched to the target group, floor plan and light of the project." },
      { title: "Fit-out lines", text: "Two or three coordinated lines for kitchen, living and sleeping that buyers can order with their flat." },
      { title: "Advice for first occupants", text: "Buyers get an appointment in the showroom and a plan for their flat, with kitchen and outdoor on request." },
    ],
  },
  STAGING: {
    overline: "For developers and estate agents",
    title: "Home staging and show flats",
    lead: "We furnish a show flat or a property for sale for a set period and clear it again after the sales phase.",
    steps: [
      { title: "Planning with a sketch", text: "Harald sketches the furnishing for floor plan, light and buyer group. You see the proposal before anything is delivered." },
      { title: "Delivery and set-up", text: "We deliver, set up and finish the rooms ready for photography and viewings." },
      { title: "Sales phase", text: "The furnishing stays for the agreed period. We are available if anything needs adjusting." },
      { title: "Removal", text: "After the sales phase we dismantle everything and collect the furniture." },
    ],
    buyer: { title: "For buyers", text: "Buyers can take over the furniture or plan the flat anew with us. We agree both with you before offering them to buyers." },
    note: "Duration, scope and costs are agreed per property.",
    cta: "Enquire about home staging",
  },
  MUSTER: {
    overline: "Sample request",
    title: "Put your samples together",
    lead: "Choose the samples you need. The list is sent with your enquiry. No prices, no customer account.",
    groups: [
      { id: "stoff", label: "Upholstery fabric samples" },
      { id: "leder", label: "Leather samples" },
      { id: "holz", label: "Wood and veneer" },
      { id: "stein", label: "Stone and ceramics for worktops" },
      { id: "oberflaeche", label: "Metal and lacquered finishes" },
      { id: "outdoor", label: "Outdoor fabrics and materials" },
      { id: "ezarri", label: "Ezarri glass mosaic" },
    ],
    ezarriLink: "Ezarri samples with colour choice (in German)",
    merkliste: "Include pieces from my saved list ({count})",
    count: "{count} samples selected",
    none: "No samples selected yet",
    clear: "Clear list",
  },
  FORM: {
    overline: "Enquiry",
    title: "Tell us about your project",
    lead: "The more we know about phase and requirements, the more precise our first reply will be.",
    anliegen: {
      legend: "What is it about?",
      options: {
        architekt: "Planning for a project of my office",
        bautraeger: "Show flat or fit-out line",
        staging: "Temporary home staging",
        muster: "Samples or planning data only",
      },
    },
    buero: "Office or company",
    projektart: { label: "Type of project", options: ["Single-family house", "Residential complex", "Hotel or restaurant", "Office or practice", "Chalet or holiday flat", "Other"] },
    phase: { label: "Project phase", options: ["Preliminary design", "Design and permit", "Detailed design", "Tender", "Under construction", "Completion and sales"] },
    bedarf: { label: "What do you need?", hint: "For example furnishing for 12 flats, kitchens, planning data for specific products, an appointment." },
    choose: "Please choose",
    vorname: "First name",
    nachname: "Last name",
    email: "Email",
    telefon: "Phone",
    optional: "optional",
    submit: "Send enquiry",
    sending: "Sending …",
    errors: {
      required: "Please fill in this field.",
      choose: "Please choose an option.",
      email: "Please enter a valid email address.",
      phone: "Please check the phone number.",
      bedarf: "Please describe your requirements in at least 10 characters.",
      summary: "Please check {count} entries.",
    },
    success: { title: "Thank you, we have your enquiry.", text: "We will get back to you with your contact and the next steps." },
    lines: {
      kontext: "Enquiry from the page for architects and developers",
      buero: "Office",
      phase: "Project phase",
      muster: "Samples requested",
      merkliste: "From the saved list",
      bedarf: "Requirements",
    },
  },
  FAQ: {
    overline: "Questions",
    title: "Frequent questions from planning offices",
    items: [
      { q: "Do we get CAD and BIM data?", a: "We request the data from the manufacturer. What is available depends on the manufacturer and the product. We tell you openly if there is no data for a product." },
      { q: "What do samples cost?", a: "That depends on the manufacturer and the quantity. We tell you before shipping. Ezarri samples are ordered through our Ezarri sample request." },
      { q: "Who invoices, who manages the site?", a: "We invoice our own deliveries and services. Site management and the work of other trades stay with you or the client." },
      { q: "Do you also work in Switzerland, Germany and Liechtenstein?", a: "Yes, we plan from Lochau for projects in Vorarlberg and the neighbouring countries. Delivery and installation are agreed per project." },
    ],
  },
};

const COPY = { de: DE, en: EN, fr: ARCHITEKTEN_INTL.fr, it: ARCHITEKTEN_INTL.it };

/** Texts of the page in `locale` (de fallback). */
export function architektenCopy(locale) {
  return COPY[locale] || DE;
}
