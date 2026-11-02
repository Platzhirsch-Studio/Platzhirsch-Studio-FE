// src/lib/kundenbetreuung/newsletter/ausgaben.js
// „Post aus Lochau“ – Newsletter mit Inhalt statt Werbung (Inhaber
// 29.10.2026, Punkt 10): neue Stücke in der Ausstellung, Haralds Skizze des
// Monats, Termine. Konzept: Marktresearch/digital/features/kundenbetreuung.md
// Abschn. „Newsletter“.
//
// REGELN (verbindlich):
//   - Jeder Block erscheint nur mit echtem Inhalt. Die beiden Slots
//     `neueStuecke` und `skizze` bleiben leer, bis der Inhaber liefert:
//       neueStuecke.eintraege: [{ name, marke, text, url?, bild: { src, alt, quelle } }]
//         – nur EIGENE Fotos aus dem Showroom (Design-Bibel §7), Marke nur
//           „im Showroom“, Händler-Aussagen nur ClassiCon und Ezarri, keine Preise
//       skizze: { bild: { src, alt }, titelSkizze?, text, projekt? }
//         – nur ein echter Scan/ein echtes Foto einer Handzeichnung von
//           Harald Menghin, mit Einwilligung der Kunden bzw. anonymisiert;
//           keine KI-Skizzen (Kern-USP-Regeln, Inhaber-Entscheidung Nr. 8)
//   - Preheader und die Zeile „In diesem Brief: …“ entstehen aus den
//     sichtbaren Blöcken (newsletter.js inhaltZeile), versprechen also nie
//     einen leeren Slot.
//   - Termine nur, wenn sie feststehen (Datum aus der jeweiligen Quelle).
//   - Eine Ausgabe ist versandbereit erst mit mindestens einem der beiden
//     Slots UND mindestens zwei Inhaltsblöcken (newsletter.js versandbereit).
//   - Ins Archiv (/de/newsletter/archiv) kommt eine Ausgabe erst, wenn
//     `versendetAm` gesetzt ist (nach dem echten Versand).
// Bilder liegen unter /public/newsletter/<slug>/… (eigene Dateien).
// Keine "@/..."-Importe.

/** @typedef {{ typ: string, [k: string]: any }} Block */

export const AUSGABEN = Object.freeze([
  {
    nr: 1,
    slug: "2026-11",
    monat: "November 2026",
    versandGeplant: "2026-11-05",
    versendetAm: null,
    betreff: "Post aus Lochau · November",
    bloecke: [
      {
        typ: "brief",
        titel: "Wenn es draußen früher dunkel wird",
        absaetze: [
          "im November rückt das Wohnen nach innen. Im Showroom brennen die Leuchten schon am Nachmittag, und im Café wird es ruhiger. Für uns ist das die schönste Zeit, um in Ruhe über Räume zu sprechen.",
        ],
        absender: "Susanne Messmer",
      },
      { typ: "neueStuecke", titel: "Neu in der Ausstellung", eintraege: [] },
      { typ: "skizze", titel: "Haralds Skizze des Monats", bild: null, text: null, projekt: null },
      {
        typ: "termine",
        titel: "Termine",
        eintraege: [
          {
            datum: "2026-11-26",
            datumLabel: "Donnerstag, 26. November 2026",
            titel: "Adventsabend im Showroom",
            text: "Showroom und Café im Advent. Nehmen Sie Platz, mit Anmeldung.",
            url: "/de/adventsabend",
            quelle: "src/app/[locale]/adventsabend/event.js",
          },
        ],
      },
      {
        typ: "gutZuWissen",
        titel: "Gut zu wissen: Outdoor-Möbel vor dem Winter",
        text: "Vor dem ersten Frost reinigen und ganz trocken einlagern. Kissen nach Regen trocknen lassen, Schutzhüllen nur über trockene Möbel ziehen, damit sich kein Schimmel bildet. Maßgeblich ist die Pflegeanleitung des Herstellers.",
        quelle: "marketing/email-flows.md 3.2 Modul Outdoor",
      },
      {
        typ: "arbeitsweise",
        titel: "Von Hand gezeichnet. Digital perfektioniert.",
        text: "Harald Menghin zeichnet Einrichtungen zuerst von Hand und baut Modelle der Räume. Erst danach planen wir in 3D und zeigen ein fotorealistisches Bild, bevor etwas bestellt wird.",
        url: "/de/arbeitsweise",
        linkLabel: "Unsere Arbeitsweise",
      },
    ],
  },
  {
    nr: 2,
    slug: "2026-12",
    monat: "Dezember 2026",
    versandGeplant: "2026-12-03",
    versendetAm: null,
    betreff: "Post aus Lochau · Dezember",
    bloecke: [
      {
        typ: "brief",
        titel: "Advent in Lochau",
        absaetze: [
          "im Dezember wird es bei uns im Café ruhiger und wärmer zugleich. Viele Gespräche drehen sich jetzt um das kommende Jahr: ein Raum, der endlich fertig werden soll, eine Küche, die schon lange auf der Liste steht.",
          "Wenn Sie zwischen den Terminen eine Pause brauchen: Der Kaffee bei uns ist eine gute Gelegenheit, ein Sofa in Ruhe Probe zu sitzen.",
        ],
        absender: "Susanne Messmer",
      },
      { typ: "neueStuecke", titel: "Neu in der Ausstellung", eintraege: [] },
      { typ: "skizze", titel: "Haralds Skizze des Monats", bild: null, text: null, projekt: null },
      // Termine (z. B. Öffnungszeiten an den Feiertagen) erst eintragen, wenn sie feststehen.
      { typ: "termine", titel: "Termine", eintraege: [] },
      {
        typ: "gutZuWissen",
        titel: "Gut zu wissen: Heizungsluft",
        text: "Heizungsluft ist trocken. Leder und Holz danken es, wenn sie nicht direkt neben dem Heizkörper oder dem Kamin stehen. Holz mit einem leicht feuchten, gut ausgewrungenen Tuch abwischen und gleich trocknen, Leder nur mit Mitteln pflegen, die der Hersteller empfiehlt.",
        quelle: "marketing/email-flows.md 3.2 Module Leder, Holz; Abschn. 4",
      },
      {
        typ: "arbeitsweise",
        titel: "Von Hand gezeichnet. Digital perfektioniert.",
        text: "Jede Planung beginnt bei uns mit einem Gespräch und einer Handzeichnung. Wenn Ihr Projekt es braucht, kommen wir auch ein, zwei Tage zu Ihnen, um Licht, Räume und Gewohnheiten kennenzulernen.",
        url: "/de/arbeitsweise",
        linkLabel: "Unsere Arbeitsweise",
      },
    ],
  },
  {
    nr: 3,
    slug: "2027-01",
    monat: "Jänner 2027",
    versandGeplant: "2027-01-07",
    versendetAm: null,
    betreff: "Post aus Lochau · Jänner",
    bloecke: [
      {
        typ: "brief",
        titel: "Ein Raum nach dem anderen",
        absaetze: [
          "der Jänner ist bei uns Planungszeit. Die Tage sind kurz, die Gedanken sind beim Zuhause, und Lieferzeiten für das Frühjahr lassen sich jetzt noch in Ruhe einplanen.",
        ],
        absender: "Susanne Messmer",
      },
      { typ: "neueStuecke", titel: "Neu in der Ausstellung", eintraege: [] },
      { typ: "skizze", titel: "Haralds Skizze des Monats", bild: null, text: null, projekt: null },
      { typ: "termine", titel: "Termine", eintraege: [] },
      {
        typ: "gutZuWissen",
        titel: "Gut zu wissen: das erste Gespräch",
        text: "Hilfreich sind ein Grundriss oder ein paar Maße, Fotos der Räume bei Tageslicht und eine Vorstellung davon, wie Sie dort leben möchten. Fotos und Pläne können Sie uns vorab auch vom Handy schicken.",
        url: "/de/upload",
        linkLabel: "Fotos und Pläne hochladen",
        quelle: "features/usp-handzeichnung-designprozess.md Schritt 1–2; Seite /de/upload",
      },
      {
        typ: "arbeitsweise",
        titel: "Von Hand gezeichnet. Digital perfektioniert.",
        text: "Kennenlernen, vor Ort, Handzeichnung, Modell, 3D-Planung, fotorealistisches Rendering, Umsetzung: So entsteht bei uns ein Raum.",
        url: "/de/arbeitsweise",
        linkLabel: "Die sieben Schritte",
      },
    ],
  },
]);
