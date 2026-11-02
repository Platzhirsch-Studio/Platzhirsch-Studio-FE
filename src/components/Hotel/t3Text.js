// Neue Texte der Seite Hotel & Objekt aus Rat 9,5 (T3: B7, B10, C7). Die
// Seitentexte liegen in src/lib/hotel/content.js; diese Ergänzungen gelten bis
// zur Übernahme (Vorschlag: Marktresearch/digital/features/rat95-t3-messages.json,
// Namespace `hotelObjekt`). Reines Modul.

export const HOTEL_T3 = Object.freeze({
  de: {
    // B10: Lead auf dem Telefon ≤ 3 Zeilen; der volle Lead bleibt ab sm sichtbar.
    leadShort: "Zimmer, Lobby, Restaurant, Spa und Terrasse: von Hand gezeichnet, dann in 3D geplant.",
    jumpLabel: "Auf dieser Seite",
    jump: [
      { href: "#leistungen", label: "Leistungen" },
      { href: "#chalets", label: "Chalets" },
      { href: "#ablauf", label: "Ablauf" },
      { href: "#musterzimmer", label: "Musterzimmer" },
      { href: "#anfrage", label: "Anfrage" },
      { href: "#faq-title", label: "Fragen" },
    ],
    // C7: Hotel ↔ Arlberg (die Gegenrichtung setzt T6 auf der Arlberg-Seite)
    arlberg: { href: "/designermoebel-arlberg", label: "Einrichten am Arlberg" },
  },
  en: {
    leadShort: "Rooms, lobby, restaurant, spa and terrace: drawn by hand, then planned in 3D.",
    jumpLabel: "On this page",
    jump: [
      { href: "#leistungen", label: "Services" },
      { href: "#chalets", label: "Chalets" },
      { href: "#ablauf", label: "Process" },
      { href: "#musterzimmer", label: "Sample room" },
      { href: "#anfrage", label: "Enquiry" },
      { href: "#faq-title", label: "FAQ" },
    ],
    arlberg: { href: "/designermoebel-arlberg", label: "Furnishing on the Arlberg" },
  },
  // Inhaber 01.11.2026: FR/IT-Fassung der Seite (Texte: src/lib/hotel/content-intl.js).
  // FR-Typografie: geschütztes Leerzeichen ( ) vor dem Doppelpunkt.
  fr: {
    leadShort: "Chambres, lobby, restaurant, spa et terrasse : dessinés à la main, puis planifiés en 3D.",
    jumpLabel: "Sur cette page",
    jump: [
      { href: "#leistungen", label: "Prestations" },
      { href: "#chalets", label: "Chalets" },
      { href: "#ablauf", label: "Déroulement" },
      { href: "#musterzimmer", label: "Chambre témoin" },
      { href: "#anfrage", label: "Demande" },
      { href: "#faq-title", label: "Questions" },
    ],
    arlberg: { href: "/designermoebel-arlberg", label: "Aménager sur l’Arlberg (en allemand)" },
  },
  it: {
    leadShort: "Camere, lobby, ristorante, spa e terrazza: disegnati a mano, poi progettati in 3D.",
    jumpLabel: "In questa pagina",
    jump: [
      { href: "#leistungen", label: "Servizi" },
      { href: "#chalets", label: "Chalet" },
      { href: "#ablauf", label: "Processo" },
      { href: "#musterzimmer", label: "Camera campione" },
      { href: "#anfrage", label: "Richiesta" },
      { href: "#faq-title", label: "Domande" },
    ],
    arlberg: { href: "/designermoebel-arlberg", label: "Arredare sull’Arlberg (in tedesco)" },
  },
});

export const hotelT3 = (locale) => HOTEL_T3[locale] || HOTEL_T3.de;
