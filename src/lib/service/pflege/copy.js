// src/lib/service/pflege/copy.js – Texte der Seite /[locale]/pflege-service (DE, EN)
// und des Portalbereichs „Meine Stücke & Pflege“ (nur DE, Portal ist deutsch).
//
// Die Texte stehen bis zur Übernahme hier (wie src/lib/arbeitsweise/copy.js).
// Kurze UI-Schlüssel für src/messages/*.json (Navigation, Portal-Navi,
// Footer) liegen als Vorschlag in
// Marktresearch/digital/features/service-pflege-messages.json.
//
// Stimme (Design-Bibel §1): Sie-Form, kurze Sätze, Fakten statt Adjektive,
// keine Superlative, kein Ausrufezeichen. Keine Preise (Inhaber-Entscheidung
// Nr. 13: „auf Anfrage“), keine Garantie-Versprechen für Herstellergarantien.
// Keine "@/..."-Importe: node --test lädt die Datei direkt.

export const PATH = "/pflege-service";
// FR/IT seit 01.11.2026: Texte in ./copy-intl.js (nur serverseitig, pflegeCopyAll()).
export const LOCALES = Object.freeze(["de", "en", "fr", "it"]);

const DE = {
  locale: "de",
  META: {
    title: "Pflege-Service für Leder, Stoff und Holz",
    description:
      "Pflege für Designmöbel aus Leder, Stoff, Holz und Marmor bei Ihnen zu Hause, nach der Pflegeanleitung des Herstellers, wo es sie gibt. Einmalig oder als Jahres-Abo. Preise auf Anfrage.",
  },
  CRUMBS: [{ label: "Startseite", href: "/" }, { label: "Pflege-Service" }],
  HERO: {
    eyebrow: "Pflege-Service",
    title: "Pflege für Leder, Stoff und Holz.",
    lead: "Wir kommen zu Ihnen und pflegen Ihre Möbel passend zum Material und, wo es sie gibt, nach der Pflegeanleitung des Herstellers. Einmalig oder einmal im Jahr als Abo.",
    primary: "Pflegetermin anfragen",
    secondary: "Pflege-Ratgeber lesen",
  },
  MATERIAL_SECTION: {
    eyebrow: "Was wir pflegen",
    title: "Leistungen je Material",
    intro: "Den genauen Umfang besprechen wir nach Ihren Fotos. Maßgeblich ist immer die Pflegeanleitung des Herstellers.",
    leistungenLabel: "Leistungen",
    grenzenLabel: "Gut zu wissen",
  },
  ABLAUF: {
    eyebrow: "Ablauf",
    title: "So läuft ein Pflegetermin ab",
    steps: [
      { title: "Anfrage mit Fotos", text: "Sie nennen Stücke und Material. Fotos laden Sie nach dem Absenden direkt vom Handy hoch." },
      { title: "Einschätzung und Angebot", text: "Wir prüfen Material und Herstellerangaben und schicken Ihnen ein Angebot. Der Preis steht im Angebot." },
      { title: "Termin bei Ihnen", text: "Wir pflegen die Möbel bei Ihnen zu Hause. Was wir nicht vor Ort lösen können, sagen wir Ihnen vorher." },
      { title: "Protokoll und nächster Termin", text: "Sie erhalten ein kurzes Pflegeprotokoll. Im Abo stimmen wir den nächsten Termin mit Ihnen ab." },
    ],
  },
  ABO: {
    eyebrow: "Abo",
    title: "Einmal im Jahr, fest eingeplant",
    text: "Im Pflege-Abo planen wir jedes Jahr einen Termin mit Ihnen. Den Termin planen wir, Sie sorgen nur für den Zugang zu den Möbeln.",
    punkte: [
      "Ein Pflegetermin im Jahr bei Ihnen zu Hause",
      "Wir stimmen den nächsten Termin rechtzeitig mit Ihnen ab",
      "Pflegeprotokoll und Pflegeanleitung je Stück im Kundenportal",
      "Pflegemittel zum Nachkaufen auf Anfrage",
    ],
    konditionenTitle: "Konditionen",
    konditionenHinweis: "Laufzeit, Kündigung und Preis stehen verbindlich in Ihrem Angebot.",
  },
  KONDITIONEN: {
    aufAnfrage: "auf Anfrage",
    preisTermin: "Pflegetermin",
    preisAbo: "Jahres-Abo",
    anfahrt: "Anfahrt",
    einsatzgebiet: "Einsatzgebiet",
    ausfuehrung: "Ausführung",
    mindestlaufzeit: "Mindestlaufzeit",
    kuendigung: "Kündigung",
  },
  HERSTELLER: {
    eyebrow: "Hersteller und Garantie",
    title: "Nach Herstellervorgabe, mit Rücksicht auf Ihre Garantie",
    absaetze: [
      "Wo der Hersteller eine Pflegeanleitung vorgibt, arbeiten wir danach und bringen die Anleitung zu Ihrem Modell mit. Fremde Mittel, die der Hersteller nicht vorsieht, verwenden wir nicht.",
      "Viele Hersteller schließen Schäden durch falsche Pflege oder Reparaturen durch Dritte ohne Freigabe des Herstellers von der Garantie aus. Poliform schreibt das zum Beispiel in seinen Garantiebedingungen. Deshalb klären wir Ausbesserungen vorher mit Ihnen und, wenn nötig, mit dem Hersteller.",
      "Garantie und Gewährleistung richten sich weiter nach Ihrem Kaufvertrag und den Bedingungen des Herstellers. Unser Pflegetermin ändert daran nichts. Fällt uns bei einem Stück, das Sie bei uns gekauft haben, ein möglicher Mangel auf, sagen wir es Ihnen und besprechen mit Ihnen den weiteren Weg.",
    ],
  },
  PRODUKTE: {
    eyebrow: "Pflegemittel",
    title: "Pflegemittel zum Nachkaufen",
    text: "Pflegemittel, die zu Ihrem Material passen, besorgen wir auf Anfrage. Den Preis nennen wir Ihnen vorher. Wenn Sie es möchten, erinnern wir Sie nach dem Pflegetermin an das passende Mittel.",
    listeTitle: "Derzeit auf Anfrage",
  },
  PORTAL: {
    eyebrow: "Für Kundinnen und Kunden",
    title: "Ihre Stücke im Kundenportal",
    text: "Im Kundenportal sehen Sie unter „Meine Stücke & Pflege“ Ihre gekauften Möbel, den nächsten Pflegetermin und die Pflegeanleitung je Material.",
    link: "Zum Kundenportal",
  },
  FAQ_TITLE: "Häufige Fragen",
  FAQ: [
    {
      q: "Was kostet ein Pflegetermin?",
      a: "Der Preis hängt von Stücken, Material und Aufwand ab. Sie erhalten nach Ihrer Anfrage ein Angebot mit festem Preis. Erst wenn Sie zustimmen, planen wir den Termin.",
    },
    {
      q: "Pflegen Sie auch Möbel, die nicht bei Platzhirsch gekauft wurden?",
      a: "Fragen Sie gerne an. Wir brauchen dafür Fotos und, wenn vorhanden, die Pflegeanleitung des Herstellers. Dann sagen wir Ihnen, ob und wie wir helfen können.",
    },
    {
      q: "Bleibt die Herstellergarantie erhalten?",
      a: "Wo es eine Pflegeanleitung des Herstellers gibt, arbeiten wir danach. Eingriffe über die Pflege hinaus nehmen wir nur nach Rücksprache vor. Ob ein Eingriff die Garantie berührt, klären wir vorher. Ein Versprechen für die Garantie des Herstellers können wir nicht abgeben.",
    },
    {
      q: "Wie funktioniert das Abo?",
      a: "Wir planen einmal im Jahr einen Termin mit Ihnen und erinnern Sie einige Wochen vorher per E-Mail. Laufzeit und Kündigung stehen in Ihrem Angebot. Sie können das Abo auch erst nach einem ersten Termin abschließen.",
    },
    {
      q: "Wie schicke ich Fotos?",
      a: "Nach dem Absenden der Anfrage erhalten Sie einen Link und einen QR-Code. Damit laden Sie Fotos direkt vom Handy hoch.",
    },
  ],
  USP: {
    text: "Sie planen neu? Harald Menghin zeichnet Einrichtungen zuerst von Hand, danach folgen 3D-Planung und Rendering.",
    link: "Unsere Arbeitsweise",
  },
  RATGEBER: {
    title: "Pflege im Alltag",
    text: "Was Leder, Stoff, Holz und Stein zwischen zwei Terminen brauchen, steht in unserem Ratgeber.",
    link: "Ratgeber: Designmöbel richtig pflegen",
  },
  FORM: {
    eyebrow: "Anfrage",
    title: "Pflegetermin anfragen",
    intro: "Nennen Sie uns Ihre Stücke. Wir melden uns mit einer Einschätzung und einem Angebot. Die Anfrage ist unverbindlich.",
    terminText: "Lieber direkt sprechen?",
    terminLink: "Online-Termin wählen",
    materialLegend: "Welche Materialien?",
    materialOptions: { leder: "Leder", stoff: "Stoff", holz: "Holz oder Furnier", stein: "Marmor oder Stein" },
    stueckeLabel: "Welche Möbelstücke?",
    stueckeHint: "Zum Beispiel: Ledersofa Minotti, Esstisch Nussbaum geölt, Couchtisch Marmor.",
    artLegend: "Einmalig oder als Abo?",
    artOptions: { einmalig: "Einmaliger Termin", abo: "Jährlich als Abo" },
    zeitraumLabel: "Wunschzeitraum",
    zeitraumOptions: {
      "": "Bitte wählen",
      bald: "in den nächsten 4 Wochen",
      "1-3m": "in 1 bis 3 Monaten",
      fruehling: "im Frühling",
      sommer: "im Sommer",
      herbst: "im Herbst",
      winter: "im Winter",
      offen: "noch offen",
    },
    ortLabel: "Ort der Möbel",
    ortHint: "Postleitzahl und Ort genügen.",
    nachrichtLabel: "Nachricht",
    vornameLabel: "Vorname",
    nachnameLabel: "Nachname",
    emailLabel: "E-Mail",
    telefonLabel: "Telefon",
    optional: "optional",
    fotosHint: "Fotos laden Sie nach dem Absenden direkt vom Handy hoch.",
    fotosHintNoUpload: "Fotos können Sie als Antwort auf unsere E-Mail schicken.",
    nachkaufLabel: "Bitte erinnern Sie mich nach dem Pflegetermin per E-Mail an passende Pflegemittel.",
    nachkaufHint: "Freiwillig. Sie können das jederzeit abbestellen.",
    submit: "Anfrage senden",
    sending: "Wird gesendet …",
    summaryTitle: "Bitte prüfen Sie diese Angaben:",
    errors: {
      material: "Bitte wählen Sie mindestens ein Material.",
      stuecke: "Bitte nennen Sie mindestens ein Möbelstück.",
      art: "Bitte wählen Sie einmalig oder Abo.",
      zeitraum: "Bitte wählen Sie einen Zeitraum.",
      ort: "Bitte nennen Sie den Ort der Möbel.",
      vorname: "Bitte geben Sie Ihren Vornamen an.",
      nachname: "Bitte geben Sie Ihren Nachnamen an.",
      email: "Bitte geben Sie eine gültige E-Mail-Adresse an, z. B. name@beispiel.at.",
      telefon: "Bitte nur Ziffern, Leerzeichen und + ( ) - verwenden.",
    },
    requestErrors: {
      network: "Keine Verbindung. Bitte prüfen Sie Ihr Netz und versuchen Sie es noch einmal.",
      rate_limited: "Zu viele Anfragen in kurzer Zeit. Bitte warten Sie einige Minuten.",
      timeout: "Das hat zu lange gedauert. Bitte versuchen Sie es noch einmal.",
      default: "Die Anfrage konnte nicht gesendet werden. Bitte rufen Sie uns an oder schreiben Sie eine E-Mail.",
    },
    successTitle: "Danke, Ihre Anfrage ist da.",
    successText: "Wir melden uns persönlich mit einer Einschätzung bei Ihnen.",
    again: "Weitere Anfrage stellen",
    // Klartext für das Backoffice (immer deutsch, das Team liest ihn)
    backoffice: {
      thema: "Pflege-Service",
      context: "Pflege-Service (pflege)",
    },
  },
};

const EN = {
  locale: "en",
  META: {
    title: "Care service for leather, fabric and wood",
    description:
      "Care for design furniture in leather, fabric, wood and marble at your home, following the maker's care instructions where they exist. One-off or as a yearly plan. Prices on request.",
  },
  CRUMBS: [{ label: "Home", href: "/" }, { label: "Care service" }],
  HERO: {
    eyebrow: "Care service",
    title: "Care for leather, fabric and wood.",
    lead: "We come to you and care for your furniture to suit the material and, where they exist, following the maker's care instructions. One-off or once a year as a plan.",
    primary: "Request a care appointment",
    secondary: "Read the care guide (German)",
  },
  MATERIAL_SECTION: {
    eyebrow: "What we care for",
    title: "Services by material",
    intro: "We agree the exact scope after seeing your photos. The maker's care instructions always apply first.",
    leistungenLabel: "Services",
    grenzenLabel: "Good to know",
  },
  ABLAUF: {
    eyebrow: "How it works",
    title: "How a care appointment works",
    steps: [
      { title: "Request with photos", text: "You name the pieces and materials. After sending, you upload photos from your phone or reply to our e-mail with them." },
      { title: "Assessment and quote", text: "We check the material and the maker's instructions and send you a quote. The price is in the quote." },
      { title: "Appointment at your home", text: "We care for the furniture at your home. If something cannot be solved on site, we tell you beforehand." },
      { title: "Report and next appointment", text: "You receive a short care report. With the plan, we agree the next appointment with you." },
    ],
  },
  ABO: {
    eyebrow: "Plan",
    title: "Once a year, firmly scheduled",
    text: "With the care plan we schedule one appointment with you every year. We plan the date, you only make sure we can reach the furniture.",
    punkte: [
      "One care appointment a year at your home",
      "We agree the next appointment with you in good time",
      "Care report and care instructions for each piece in the customer portal (German)",
      "Care products to reorder on request",
    ],
    konditionenTitle: "Terms",
    konditionenHinweis: "Term, cancellation and price are set out bindingly in your quote.",
  },
  KONDITIONEN: {
    aufAnfrage: "on request",
    preisTermin: "Care appointment",
    preisAbo: "Yearly plan",
    anfahrt: "Travel",
    einsatzgebiet: "Service area",
    ausfuehrung: "Carried out by",
    mindestlaufzeit: "Minimum term",
    kuendigung: "Cancellation",
  },
  HERSTELLER: {
    eyebrow: "Makers and warranty",
    title: "Following the maker's instructions, with your warranty in mind",
    absaetze: [
      "Where the maker provides care instructions, we follow them and bring the instructions for your model. We do not use products the maker does not provide for.",
      "Many makers exclude damage from wrong care or repairs by third parties the maker has not approved from their warranty. Poliform, for example, says so in its warranty terms. That is why we agree any repair with you beforehand and, if needed, with the maker.",
      "The maker's warranty and the statutory warranty continue to follow your purchase contract and the maker's terms. Our care appointment does not change them. If we notice a possible defect in a piece you bought from us, we tell you and discuss the next steps with you.",
    ],
  },
  PRODUKTE: {
    eyebrow: "Care products",
    title: "Care products to reorder",
    text: "We obtain care products that suit your material on request and tell you the price beforehand. If you wish, we remind you of the right product after the care appointment.",
    listeTitle: "Currently on request",
  },
  PORTAL: {
    eyebrow: "For customers",
    title: "Your pieces in the customer portal",
    text: "In the customer portal, under “My pieces & care”, you see the furniture you bought, the next care appointment and the care instructions for each material. The portal is in German.",
    link: "Go to the customer portal",
  },
  FAQ_TITLE: "Frequently asked questions",
  FAQ: [
    {
      q: "What does a care appointment cost?",
      a: "The price depends on the pieces, the material and the effort. After your request you receive a quote with a fixed price. We schedule the appointment only once you agree.",
    },
    {
      q: "Do you also care for furniture not bought at Platzhirsch?",
      a: "You are welcome to ask. We need photos and, if available, the maker's care instructions. Then we tell you whether and how we can help.",
    },
    {
      q: "Does the maker's warranty remain valid?",
      a: "Where the maker provides care instructions, we follow them. We only go beyond care after consultation. We clarify beforehand whether a repair affects the warranty. We cannot make promises on behalf of the maker's warranty.",
    },
    {
      q: "How does the plan work?",
      a: "We schedule one appointment a year with you and remind you by e-mail a few weeks before. Term and cancellation are set out in your quote. You can also take out the plan after a first appointment.",
    },
    {
      q: "How do I send photos?",
      a: "Reply to our e-mail with the photos. On the German page you can also upload them from your phone after sending the request.",
    },
  ],
  USP: {
    text: "Planning something new? Harald Menghin first draws interiors by hand, then come 3D planning and rendering.",
    link: "How we work",
  },
  RATGEBER: {
    title: "Everyday care",
    text: "What leather, fabric, wood and stone need between two appointments is explained in our guide (in German).",
    link: "Guide: caring for design furniture (German)",
  },
  FORM: {
    eyebrow: "Request",
    title: "Request a care appointment",
    intro: "Tell us about your pieces. We get back to you with an assessment and a quote. The request is non-binding.",
    terminText: "Prefer to talk first?",
    terminLink: "Book an online appointment",
    materialLegend: "Which materials?",
    materialOptions: { leder: "Leather", stoff: "Fabric", holz: "Wood or veneer", stein: "Marble or stone" },
    stueckeLabel: "Which pieces of furniture?",
    stueckeHint: "For example: Minotti leather sofa, oiled walnut dining table, marble coffee table.",
    artLegend: "One-off or as a plan?",
    artOptions: { einmalig: "One-off appointment", abo: "Yearly plan" },
    zeitraumLabel: "Preferred time",
    zeitraumOptions: {
      "": "Please choose",
      bald: "within the next 4 weeks",
      "1-3m": "in 1 to 3 months",
      fruehling: "in spring",
      sommer: "in summer",
      herbst: "in autumn",
      winter: "in winter",
      offen: "not decided yet",
    },
    ortLabel: "Location of the furniture",
    ortHint: "Postcode and town are enough.",
    nachrichtLabel: "Message",
    vornameLabel: "First name",
    nachnameLabel: "Last name",
    emailLabel: "E-mail",
    telefonLabel: "Phone",
    optional: "optional",
    fotosHint: "You can upload photos from your phone after sending.",
    fotosHintNoUpload: "You can send photos as a reply to our e-mail.",
    nachkaufLabel: "Please remind me by e-mail of suitable care products after the care appointment.",
    nachkaufHint: "Optional. You can unsubscribe at any time.",
    submit: "Send request",
    sending: "Sending …",
    summaryTitle: "Please check these entries:",
    errors: {
      material: "Please choose at least one material.",
      stuecke: "Please name at least one piece of furniture.",
      art: "Please choose one-off or plan.",
      zeitraum: "Please choose a time.",
      ort: "Please name the location of the furniture.",
      vorname: "Please enter your first name.",
      nachname: "Please enter your last name.",
      email: "Please enter a valid e-mail address, e.g. name@example.com.",
      telefon: "Please use digits, spaces and + ( ) - only.",
    },
    requestErrors: {
      network: "No connection. Please check your network and try again.",
      rate_limited: "Too many requests in a short time. Please wait a few minutes.",
      timeout: "This took too long. Please try again.",
      default: "The request could not be sent. Please call us or send an e-mail.",
    },
    successTitle: "Thank you, we have received your request.",
    successText: "We will get back to you personally with an assessment.",
    again: "Send another request",
    backoffice: {
      thema: "Pflege-Service",
      context: "Pflege-Service (pflege)",
    },
  },
};

/** Portal-Texte (nur DE, das Kundenportal ist deutsch). */
export const PORTAL_COPY = Object.freeze({
  navLabel: "Pflege",
  overline: "Ihre Stücke",
  title: "Meine Stücke & Pflege",
  intro: "Ihre gekauften Möbel, der nächste Pflegetermin und die Pflegeanleitung je Material. Maßgeblich ist immer die Anleitung des Herstellers.",
  empty: "Sobald ein Stück bestellt ist, erscheint es hier mit seiner Pflegeanleitung.",
  aboAktiv: "Pflege-Abo aktiv",
  aboKeins: "Kein Pflege-Abo",
  naechsterTermin: "Nächster Pflegetermin",
  terminGeplant: "geplant für {date}",
  terminFaellig: "fällig um {date}",
  terminAbLieferung: "Pflege ab Lieferung möglich",
  terminOffen: "noch nicht geplant",
  material: "Material",
  materialUnbekannt: "Material folgt mit den Herstellerunterlagen",
  herstellerHinweise: "Hinweise des Herstellers",
  anleitung: "Pflegeanleitung",
  passLink: "Produktpass öffnen",
  anfragen: "Pflegetermin anfragen",
  aboAnfragen: "Pflege-Abo anfragen",
  serviceLink: "Mehr zum Pflege-Service",
  hinweis:
    "Die Pflegeanleitung ist eine Kurzfassung allgemeiner Regeln. Für Ihr Modell gilt die Anleitung des Herstellers. Garantie und Gewährleistung richten sich nach Auftragsbestätigung und Herstellerbedingungen.",
  status: { bestellt: "bestellt", geliefert: "geliefert", montiert: "montiert", geplant: "geplant", angeboten: "angeboten" },
});

const COPY = { de: DE, en: EN };

/** Seitentexte in `locale` (de|en), sonst DE. FR/IT: pflegeCopyAll() in ./copy-intl.js. */
export function pflegeCopy(locale = "de") {
  return COPY[locale] || DE;
}
