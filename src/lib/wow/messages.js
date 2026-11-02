// Texts of the "Pause" hero (namespace "Wow"), until they move into
// src/messages/*.json. DE is the proposal of wow-spezifikation §7; EN/FR/IT
// are drafts for review. Same content as
// Marktresearch/digital/features/wow-messages-vorschlag.json.
// Push r4 (luxus-cd #3, awwwards #2): the toolbar "Linie · Licht · Raum" and
// "Noch einmal" are gone. At rest the photo stands alone; ONE quiet button
// "Die Linie zeigen" lays the drawing back over half of it, and the slider
// handle carries the visible label "Linie ↔ Raum" (grip).
// No superlatives, no exclamation marks; "Harald Menghin" only in phase B.
// Fix-Runde 1 (F1, Release-Rat recht P1-4 / neuland P2-3 / gesamtwerk P1-6):
// phase A caption – not "Studie", nothing that suggests Harald's hand.
// R8 (gesamtwerk P0-1 Code-Anteil, neuland P1-2, seo P1-5): "abstrahierte
// Grafik" stood right above "Von Hand gezeichnet" and read like a hedge; it
// now says plainly what the line is: "Linie: Grafik, keine Skizze" (shorter
// than before, the chip on the phone photo stays one line). Same wording
// proposed to P1 for Home/copy.js lineCaption. The closing link leads to the
// process page (codaTarget below, Runde 2 P2); outside DE it is marked German.
// R5-USP (gesamtwerk P0-1, neuland P1-1, bewusst geändert): a caption that
// says "keine Skizze" right at the H1 "Von Hand gezeichnet" refuted the page.
// ONE wording for the hero credit, Home/copy.js lineCaption and
// arbeitsweise/copy.js HERO.lineCaption (identical strings, e2e test
// r5-usp-startseite.spec.js): the line is named "Zeichen des Studios" – no claim that it is
// Harald's hand, no negation. What the line technically is (a digital graphic
// after the showroom photo) is said once, quietly, in the footer of the USP
// chapter (Home/copy.js lineNote) and in the overview of /arbeitsweise.
// Phase B keeps its own credit (Harald's real strokes, with consent).
// Italian: voi throughout (recht P1-1, R5-fix P2) – buttons in the voi
// imperative ("Mostrate la linea", like "Scoprite"), pure controls in the
// infinitive ("Trascinare …"), prose in voi.

const MESSAGES = {
  de: {
    stage: {
      label: "Von der Linie zum Raum",
      description:
        "Hilfslinien und eine Tuschelinie zeichnen unseren Showroom in Lochau. Abendlicht fällt vom Fenster herein und gibt das Foto des Raums frei. Danach lässt sich die Zeichnung mit einer Schaltfläche wieder einblenden und mit einem Regler über das Foto ziehen.",
    },
    show: { open: "Die Linie zeigen", close: "Nur das Foto" },
    slider: { label: "Zeichnung über das Foto ziehen", value: "{n} % Zeichnung", grip: "Linie ↔ Raum" },
    caption: {
      phaseA: "Showroom Lochau · Linie: Zeichen des Studios",
      phaseB: "Foto: Showroom Lochau · Linie: Harald Menghin, von Hand gezeichnet",
    },
    coda: { text: "Erst die Linie. Dann Ihr Raum.", link: "Unsere Arbeitsweise" },
  },
  en: {
    stage: {
      label: "From line to room",
      description:
        "Construction lines and an ink line draw our showroom in Lochau. Evening light falls in from the window and reveals the photograph of the room. Afterwards a button shows the drawing again and a slider pulls it across the photo.",
    },
    show: { open: "Show the line", close: "Photo only" },
    slider: { label: "Pull the drawing across the photo", value: "{n} % drawing", grip: "Line ↔ Room" },
    caption: {
      phaseA: "Showroom Lochau · Line: the studio’s mark",
      phaseB: "Photo: Showroom Lochau · Line: Harald Menghin, drawn by hand",
    },
    coda: { text: "First the line. Then your room.", link: "How we work" },
  },
  fr: {
    stage: {
      label: "De la ligne à l’espace",
      description:
        "Des lignes de construction et un trait d’encre dessinent notre showroom à Lochau. La lumière du soir entre par la fenêtre et révèle la photo de l’espace. Ensuite, un bouton réaffiche le dessin et un curseur le fait glisser sur la photo.",
    },
    show: { open: "Montrer la ligne", close: "Photo seule" },
    slider: { label: "Faire glisser le dessin sur la photo", value: "{n} % de dessin", grip: "Ligne ↔ Espace" },
    caption: {
      phaseA: "Showroom de Lochau · Ligne : signe du studio",
      phaseB: "Photo : showroom de Lochau · Ligne : Harald Menghin, dessinée à la main",
    },
    coda: { text: "D’abord la ligne. Puis votre espace.", link: "Notre méthode" },
  },
  it: {
    stage: {
      label: "Dalla linea allo spazio",
      description:
        "Linee di costruzione e un tratto d’inchiostro disegnano il nostro showroom a Lochau. La luce della sera entra dalla finestra e svela la foto dello spazio. Poi un pulsante mostra di nuovo il disegno e un cursore lo fa scorrere sulla foto.",
    },
    show: { open: "Mostrate la linea", close: "Solo la foto" },
    slider: { label: "Trascinare il disegno sulla foto", value: "{n} % di disegno", grip: "Linea ↔ Spazio" },
    caption: {
      phaseA: "Showroom di Lochau · Linea: segno dello studio",
      phaseB: "Foto: showroom di Lochau · Linea: Harald Menghin, disegnata a mano",
    },
    coda: { text: "Prima la linea. Poi il vostro spazio.", link: "Il nostro metodo" },
  },
};

// Where the coda link leads (Runde 2, Fix-Team P2, ux P1-7 / seo P1-6):
// the process page /arbeitsweise (Kern-USP, Inhaber-Entscheidung Nr. 8) in
// every locale. R5-fix P2 (gesamtwerk P1-2, bewusst geändert): the page now
// exists in DE/EN/FR/IT, so every locale links to its own /<locale>/arbeitsweise
// without a language note (before: /de/arbeitsweise, hreflang="de",
// "How we work (in German)").
// The consultation page stays the hero's primary action (Button → /beratung
// in the visitor's language). Earlier rounds sent DE to the interior design
// page until /arbeitsweise was indexable and EN/FR/IT to the consultation page.

/** @returns {{href: string, locale: string, germanOnly: boolean}} target of the coda link */
export function codaTarget(locale) {
  const own = ["de", "en", "fr", "it"].includes(locale) ? locale : "de";
  return { href: "/arbeitsweise", locale: own, germanOnly: false };
}

// Language note for links to German-only pages (kept outside MESSAGES: the
// Wow namespace in src/messages/*.json mirrors MESSAGES key by key).
const GERMAN_NOTE = { en: "in German", fr: "en allemand", it: "in tedesco" };

/** Visible link text of the coda: "How we work (in German)" outside DE. */
export function codaLabel(locale) {
  const t = wowMessages(locale);
  return codaTarget(locale).germanOnly ? `${t.coda.link} (${GERMAN_NOTE[locale] || "Deutsch"})` : t.coda.link;
}

export function wowMessages(locale) {
  return MESSAGES[locale] || MESSAGES.de;
}

export default MESSAGES;
