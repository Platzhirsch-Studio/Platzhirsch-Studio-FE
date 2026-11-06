// Entwurf „Lounge“ – klar fiktive Beispieldaten (keine echten Personen, keine Fachlogik).
// Avatare sind Initialen-Kreise in warmen Materialtönen (m = Materialton).

export const BASIS = "/entwurf/lounge";
export const BILD = (n) => `/entwurf/lounge/${n}`;

export const TEAM = {
  LM: { name: "Lena Moser", rolle: "Einrichtungsberaterin", m: "cognac" },
  JF: { name: "Jonas Feurstein", rolle: "Küchenplaner", m: "eiche" },
  SB: { name: "Sarah Bösch", rolle: "Innenarchitektin", m: "salbei" },
  MG: { name: "Markus Gmeiner", rolle: "Montageleitung", m: "nuss" },
  EK: { name: "Elif Kaya", rolle: "Assistenz & Kassa", m: "messing" },
  DN: { name: "David Natter", rolle: "Logistik", m: "see" },
  TR: { name: "Theresa Ritter", rolle: "Objektgeschäft", m: "travertin" },
};

export const ICH = { kurz: "LM", vorname: "Lena", ...TEAM.LM };

/* ------------------------------------------------------------------ Zentrale */
export const KOPFZAHLEN = [
  { label: "Neue Anfragen", wert: 7, suffix: "" },
  { label: "Termine heute", wert: 5, suffix: "" },
  { label: "Offene Angebote", wert: 186.4, suffix: " T€", dez: 1 },
];

export const HEUTE = {
  datum: "Mittwoch, 4. November",
  aktiv: {
    kunde: "Familie Brändle",
    kurz: "FB", m: "travertin",
    art: "Präsentation 3D-Planung Küche",
    zeit: "10:00 – 11:30",
    ort: "Showroom OG · Küchenwelt",
    notiz: "Muster Eiche geräuchert liegen bereit",
  },
  folgend: [
    { kunde: "Dr. Miriam Köhler", art: "Beratung Wohnen", ton: "cognac", zeit: "12:00" },
    { kunde: "Hotel Seeblick, Lindau", art: "Objekt · Bemusterung", ton: "see", zeit: "14:00" },
    { kunde: "Yacht „Aurelia“", art: "Aufmaß Salon", ton: "eiche", zeit: "15:30" },
    { kunde: "Familie Nägele", art: "Abnahme Bad", ton: "salbei", zeit: "17:15" },
  ],
};

export const WARTET = {
  titel: "Braucht deine Antwort",
  text: "Angebot Outdoor-Lounge für Dr. Köhler liegt seit 6 Tagen offen – sie hat gestern zweimal angerufen.",
  von: "Elif Kaya",
  bereich: "Outdoor",
  personen: ["EK", "SB", "TR"],
  mehr: 2,
};

export const PIPELINE = [
  { stufe: "Anfrage", n: 24, wert: 0 },
  { stufe: "Beratung", n: 11, wert: 318 },
  { stufe: "Planung", n: 8, wert: 412 },
  { stufe: "Angebot", n: 6, wert: 186 },
  { stufe: "Auftrag", n: 4, wert: 264 },
];

export const UMSATZ = [
  { m: "Jun", v: 182 }, { m: "Jul", v: 164 }, { m: "Aug", v: 121 }, { m: "Sep", v: 238 },
  { m: "Okt", v: 276 }, { m: "Nov", v: 94, laufend: true },
];

export const PROJEKTE = [
  { id: "PH-0418", titel: "Haus am See", kunde: "Familie Brändle · Lochau", bild: "r-hero-essraum.jpg", stufe: "Bestellung", ton: "eiche", team: ["LM", "JF", "SB", "DN"], wert: "148.600 €", naechst: "Liefertermin Küche bestätigen", fort: 62 },
  { id: "PH-0431", titel: "Penthouse Wohnen", kunde: "Dr. Miriam Köhler · Bregenz", bild: "r-wohnen-sofa.jpg", stufe: "Angebot", ton: "cognac", team: ["LM", "SB"], wert: "86.900 €", naechst: "Angebot nachfassen", fort: 44 },
  { id: "PH-0402", titel: "Suiten & Lobby", kunde: "Hotel Seeblick · Lindau", bild: "r-terrasse-hotel.jpg", stufe: "Planung", ton: "see", team: ["TR", "SB", "MG", "JF", "DN"], wert: "412.000 €", naechst: "Bemusterung 14:00", fort: 30 },
  { id: "PH-0389", titel: "Masterbad", kunde: "Familie Nägele · Hard", bild: "r-bad.webp", stufe: "Montage", ton: "salbei", team: ["MG", "LM"], wert: "38.400 €", naechst: "Abnahme heute 17:15", fort: 88 },
];

export const AKTIVITAET = [
  { wer: "DN", was: "hat die Auftragsbestätigung von Minotti abgelegt", wo: "Haus am See", wann: "vor 12 Min." },
  { wer: "SB", was: "hat 3 Handskizzen hochgeladen", wo: "Suiten & Lobby", wann: "vor 40 Min." },
  { wer: "EK", was: "hat eine Anzahlung über 59.440 € verbucht", wo: "Haus am See", wann: "9:12" },
  { wer: "JF", was: "hat die 3D-Planung freigegeben", wo: "Penthouse Wohnen", wann: "gestern" },
  { wer: "MG", was: "hat die Montage Masterbad abgeschlossen", wo: "Masterbad", wann: "gestern" },
  { wer: "TR", was: "hat 12 Stoffmuster an das Hotel geschickt", wo: "Suiten & Lobby", wann: "Mo" },
];

/* ------------------------------------------------------------------ Anfragen */
export const ANFRAGEN = [
  { id: "A-1187", name: "Katharina & Paul Stadler", ort: "Lindau", kurz: "KS", m: "eiche", bereich: "Küche", bild: "r-kueche-eiche.jpg", kanal: "Website", budget: "60–80 T€", eingang: "heute, 8:41", status: "Neu", ton: "cognac", berater: "LM",
    wunsch: "Offene Küche mit Kochinsel in Eiche, gerne mit Blick zum Garten. Einzug geplant Frühjahr 2027.", flaeche: "42 m²", zeitraum: "März 2027", quelle: "Newsletter Herbst" },
  { id: "A-1186", name: "Yacht „Aurelia“", ort: "Hafen Lindau", kurz: "YA", m: "see", bereich: "Yacht", bild: "r-garten-lounge.jpg", kanal: "Telefon", budget: "auf Anfrage", eingang: "heute, 7:55", status: "Neu", ton: "cognac", berater: "TR",
    wunsch: "Salon und Achterdeck neu einrichten, wetterfeste Stoffe, Abstimmung mit der Werft.", flaeche: "Salon 28 m²", zeitraum: "vor Saison 2027", quelle: "Empfehlung" },
  { id: "A-1183", name: "Dr. Miriam Köhler", ort: "Bregenz", kurz: "MK", m: "cognac", bereich: "Wohnen", bild: "r-wohnen-sofa.jpg", kanal: "Showroom", budget: "80–100 T€", eingang: "gestern", status: "Beratung", ton: "eiche", berater: "LM",
    wunsch: "Wohnraum mit Sofalandschaft, Teppich und Leuchten – ruhig, warm, nichts Glänzendes.", flaeche: "64 m²", zeitraum: "Dezember", quelle: "Laufkundschaft" },
  { id: "A-1179", name: "Hotel Seeblick", ort: "Lindau", kurz: "HS", m: "travertin", bereich: "Objekt", bild: "r-terrasse-hotel.jpg", kanal: "E-Mail", budget: "400+ T€", eingang: "Mo, 2. Nov", status: "Planung", ton: "see", berater: "TR",
    wunsch: "12 Suiten und Lobby, Bemusterung Stoffe und Leuchten, Umsetzung in der Zwischensaison.", flaeche: "12 Suiten", zeitraum: "Jan–März 2027", quelle: "Messe" },
  { id: "A-1176", name: "Familie Nägele", ort: "Hard", kurz: "FN", m: "salbei", bereich: "Bad", bild: "r-bad.webp", kanal: "Website", budget: "30–40 T€", eingang: "Fr, 30. Okt", status: "Angebot", ton: "messing", berater: "MG",
    wunsch: "Masterbad mit freistehender Wanne und Naturstein, bodengleiche Dusche.", flaeche: "18 m²", zeitraum: "sofort", quelle: "Google" },
  { id: "A-1171", name: "Andreas Wohlgenannt", ort: "Dornbirn", kurz: "AW", m: "nuss", bereich: "Schlafen", bild: "r-schlafen.webp", kanal: "Instagram", budget: "20–30 T€", eingang: "Do, 29. Okt", status: "Beratung", ton: "eiche", berater: "SB",
    wunsch: "Schlafzimmer mit Polsterbett, begehbarer Schrank, Vorhänge.", flaeche: "26 m²", zeitraum: "Februar", quelle: "Instagram" },
  { id: "A-1168", name: "Weingut am Pfänder", ort: "Lochau", kurz: "WP", m: "messing", bereich: "Outdoor", bild: "r-terrasse-see.jpg", kanal: "Telefon", budget: "50–70 T€", eingang: "Di, 27. Okt", status: "Angebot", ton: "messing", berater: "LM",
    wunsch: "Terrasse für Verkostungen, 40 Plätze, Schirme und Lounge-Ecke mit Seeblick.", flaeche: "120 m²", zeitraum: "April 2027", quelle: "Bestandskunde" },
  { id: "A-1160", name: "Johanna Fink", ort: "Wasserburg", kurz: "JF", m: "see", bereich: "Essen", bild: "r-essen-licht.jpg", kanal: "Showroom", budget: "15–20 T€", eingang: "Mi, 21. Okt", status: "Ruhend", ton: "stein", berater: "SB",
    wunsch: "Esstisch für 10 Personen und Pendelleuchten.", flaeche: "30 m²", zeitraum: "offen", quelle: "Event" },
];

export const FILTER = [
  { id: "alle", label: "Alle", n: 24 },
  { id: "Neu", label: "Neu", n: 7 },
  { id: "Beratung", label: "Beratung", n: 9 },
  { id: "Angebot", label: "Angebot", n: 5 },
  { id: "Ruhend", label: "Ruhend", n: 3 },
];

/* ------------------------------------------------------------------ Kundenakte */
export const AKTE = {
  kunde: "Familie Brändle",
  projekt: "Haus am See",
  nr: "PH-2026-0418",
  ort: "Seestraße, Lochau",
  bereiche: "Küche · Wohnen · Essen · Terrasse",
  team: ["LM", "JF", "SB", "DN", "MG"],
  betraege: [
    { label: "Auftragswert", wert: "148.600 €" },
    { label: "Bezahlt", wert: "59.440 €", zusatz: "40 %" },
  ],
  termin: { label: "Nächster Termin", wann: "Do, 12. Nov · 9:00", was: "Feinaufmaß Küche vor Ort", wer: "JF" },
  lieferung: { label: "Lieferung Küche", wann: "KW 49" },
};

export const REISE = [
  { id: "anfrage", titel: "Anfrage", steps: [
    { p: "LM", t: "Anfrage über Website", d: "2. Sep", s: "fertig" },
    { p: "LM", t: "Rückruf & Erstgespräch", d: "3. Sep", s: "fertig" },
  ] },
  { id: "beratung", titel: "Beratung & Aufmaß", steps: [
    { p: "LM", t: "Beratung im Showroom", d: "9. Sep", s: "fertig" },
    { p: "JF", t: "Aufmaß vor Ort", d: "16. Sep", s: "fertig" },
    { p: "SB", t: "Muster mitgegeben", d: "16. Sep", s: "fertig" },
  ] },
  { id: "planung", titel: "Planung", steps: [
    { p: "SB", t: "Handskizze Wohnraum", d: "24. Sep", s: "fertig" },
    { p: "JF", t: "3D-Planung Küche", d: "2. Okt", s: "fertig" },
    { p: "SB", t: "Präsentation 3D", d: "8. Okt", s: "fertig" },
  ] },
  { id: "angebot", titel: "Angebot & Auftrag", steps: [
    { p: "LM", t: "Angebot V3", d: "12. Okt", s: "fertig" },
    { p: "LM", t: "Auftrag unterschrieben", d: "19. Okt", s: "fertig" },
    { p: "EK", t: "Anzahlung 40 %", d: "4. Nov", s: "fertig" },
  ] },
  { id: "bestellung", titel: "Bestellung & Lieferung", aktiv: true, steps: [
    { p: "DN", t: "Minotti bestellt", d: "AB erhalten", s: "fertig" },
    { p: "DN", t: "Küche · Liefertermin", d: "jetzt", s: "aktiv" },
    { p: null, t: "Leuchten bestellen", d: "bis 13. Nov", s: "offen" },
  ] },
  { id: "montage", titel: "Montage & Abnahme", steps: [
    { p: null, t: "Montage Küche", d: "KW 50", s: "offen" },
    { p: null, t: "Abnahmeprotokoll", d: "", s: "offen" },
  ] },
  { id: "service", titel: "Service", steps: [
    { p: null, t: "Pflege nach 6 Monaten", d: "Juni 2027", s: "offen" },
  ] },
];

export const RAEUME = [
  { titel: "Küche", info: "Poliform · Eiche geräuchert", bild: "r-kueche-eiche.jpg", stand: "Bestellt" },
  { titel: "Wohnen", info: "Minotti · Sofalandschaft", bild: "r-wohnen-sofa.jpg", stand: "AB erhalten" },
  { titel: "Terrasse", info: "Outdoor-Lounge mit Seeblick", bild: "r-terrasse-see.jpg", stand: "In Planung" },
];

export const ZAHLUNGEN = [
  { titel: "Anzahlung 40 %", wann: "4. Nov", betrag: "59.440 €", status: "Bezahlt", ton: "salbei" },
  { titel: "Vor Lieferung 50 %", wann: "KW 48", betrag: "74.300 €", status: "Offen", ton: "eiche" },
  { titel: "Nach Abnahme 10 %", wann: "nach Montage", betrag: "14.860 €", status: "Geplant", ton: "stein" },
];

export const POSITIONEN = [
  { titel: "Küche mit Kochinsel 3,2 m", info: "Poliform · Eiche geräuchert", betrag: "64.800 €", bild: "r-kueche-eiche.jpg" },
  { titel: "Sofalandschaft", info: "Minotti · Leder Cognac", betrag: "38.420 €", bild: "r-wohnen-sofa.jpg" },
  { titel: "Outdoor-Lounge, 7-teilig", info: "Terrasse Süd · Seeblick", betrag: "21.540 €", bild: "r-terrasse-see.jpg" },
  { titel: "Esstisch Eiche, 300 cm", info: "Maßanfertigung · Tischlerei", betrag: "14.860 €", bild: "r-essen-licht.jpg" },
];

export const ZEITLEISTE = [
  { tag: "Heute", eintraege: [
    { icon: "Wallet", ton: "salbei", titel: "Anzahlung eingegangen", text: "59.440 € (40 %) per Überweisung · Rechnung R-2611-0204", zeit: "9:12", wer: "EK", beleg: { name: "Anzahlungsrechnung R-2611-0204.pdf", info: "PDF · 186 KB" } },
  ] },
  { tag: "Montag, 2. November", eintraege: [
    { icon: "Mail", ton: "eiche", titel: "E-Mail von Katharina Brändle", zitat: "„Die Muster sind angekommen – wir nehmen die geräucherte Eiche und den Leder-Ton Cognac.“", zeit: "19:24" },
    { icon: "Truck", ton: "see", titel: "Auftragsbestätigung Minotti", text: "Liefertermin KW 49 · Spedition Natter", zeit: "11:05", wer: "DN" },
  ] },
  { tag: "Donnerstag, 8. Oktober", eintraege: [
    { icon: "PenTool", ton: "cognac", titel: "Planung Wohnen & Küche präsentiert", text: "Handskizze und 3D-Planung von Sarah Bösch, Variante B freigegeben. Moodboard fürs Obergeschoss gleich mitgenommen.", zeit: "15:40", wer: "SB", bilder: ["r-garten-lounge.jpg", "r-schlafen.webp", "r-bad.webp"] },
  ] },
];

export const BEZUEGE = [
  { icon: "Building2", titel: "Studio Hollenstein Architektur", info: "Architektin · Mag. Eva Hollenstein" },
  { icon: "Ruler", titel: "Aufmaß vom 16. September", info: "Jonas Feurstein · 5 Räume" },
  { icon: "Palette", titel: "Muster & Stoffe", info: "Eiche geräuchert, Leder Cognac, Bouclé Sand" },
];

export const TABS =["Reise", "Planung", "Angebote", "Bestellungen", "Dokumente", "Notizen"];

/* ------------------------------------------------------------------ Kassa */
export const KATEGORIEN = [
  { id: "alle", label: "Alle", icon: "LayoutGrid" },
  { id: "licht", label: "Leuchten", icon: "Lamp" },
  { id: "duft", label: "Kerzen & Duft", icon: "Flame" },
  { id: "glas", label: "Glas", icon: "Wine" },
  { id: "objekt", label: "Objekte", icon: "Gem" },
  { id: "textil", label: "Textil", icon: "Layers" },
  { id: "gutschein", label: "Gutschein", icon: "Gift" },
];

export const PRODUKTE = [
  { id: 1, kat: "licht", name: "Bell Portable", marke: "Tom Dixon", preis: 245, bild: "p-bell-leuchte.webp", info: "Burgund · akkubetrieben" },
  { id: 2, kat: "licht", name: "Bellhop Unplugged", marke: "Flos", preis: 189, bild: "p-flos-bellhop.webp", info: "Salbeigrün" },
  { id: 3, kat: "licht", name: "Stone Portable", marke: "Tom Dixon", preis: 395, bild: "p-stone-leuchte.webp", info: "Marmor · Messing" },
  { id: 4, kat: "duft", name: "Altaïr Duftkerze", marke: "Trudon", preis: 125, bild: "p-trudon-kerze.webp", info: "270 g · Bernstein" },
  { id: 5, kat: "glas", name: "Bordeaux Glas", marke: "Zalto", preis: 69, bild: "p-zalto-bordeaux.webp", info: "mundgeblasen" },
  { id: 6, kat: "objekt", name: "Astro Löwe", marke: "Kähler", preis: 59, bild: "p-kaehler-loewe.webp", info: "Keramik · 18 cm" },
  { id: 7, kat: "objekt", name: "Curve Kerzenhalter", marke: "Lyngby", preis: 49, bild: "p-lyngby-halter.webp", info: "Porzellan · weiß" },
  { id: 8, kat: "gutschein", name: "Geschenkgutschein", marke: "Platzhirsch", preis: 250, gutschein: true, info: "frei wählbar" },
];

export const LAGER = { 1: 3, 2: 5, 3: 2, 4: 12, 5: 24, 6: 4, 7: 9 };

export const KUNDE_KASSA = {
  name: "Dr. Miriam Köhler",
  kurz: "MK", m: "cognac",
  stufe: "Platzhirsch Plus",
  seit: "Kundin seit 2019",
  vorteile: [
    { id: "lieferung", label: "Lieferung frei", kurz: "Lieferung frei", icon: "Truck" },
    { id: "pflege", label: "Pflege-Service", kurz: "Pflege", icon: "Sparkles" },
    { id: "event", label: "Vorab-Zugang Event", kurz: "Event vorab", icon: "Ticket" },
  ],
};

export const WARENKORB_START = [
  { id: 3, n: 1 },
  { id: 4, n: 2 },
  { id: 5, n: 6 },
];
