// Fiktive Beispieldaten für den Entwurf „Präzision“. Alle Personen, Firmen und
// Hotels sind erfunden; Marken- und Produktnamen nur als Text.

export const ICH = { name: "Lena Hofer", kurz: "LH", rolle: "Einrichtungsberatung", ton: 3 };

export const TEAM = {
  LH: { name: "Lena Hofer", kurz: "LH", ton: 3 },
  MS: { name: "Marco Sutter", kurz: "MS", ton: 5 },
  IW: { name: "Ines Walch", kurz: "IW", ton: 1 },
  TK: { name: "Tobias Kranz", kurz: "TK", ton: 4 },
  SA: { name: "Sophie Amann", kurz: "SA", ton: 2 },
  JR: { name: "Jakob Rinderer", kurz: "JR", ton: 6 },
};

export const KENNZAHLEN = [
  { id: "umsatz", label: "Umsatz November", wert: "186.420 €", delta: "+12,4 %", trend: "auf", kontext: "vs. Okt. zum selben Tag", reihe: [42, 48, 45, 51, 58, 55, 63, 61, 70, 74, 72, 81] },
  { id: "anfragen", label: "Neue Anfragen", wert: "23", delta: "+5", trend: "auf", kontext: "letzte 7 Tage", reihe: [12, 15, 14, 18, 16, 19, 17, 21, 18, 20, 18, 23] },
  { id: "quote", label: "Angebotsquote", wert: "38 %", delta: "−2 Pp.", trend: "ab", kontext: "Angebot → Auftrag, 90 Tage", reihe: [41, 42, 40, 43, 41, 40, 39, 41, 40, 39, 40, 38] },
  { id: "liefer", label: "Termintreue Lieferung", wert: "96 %", delta: "+3 Pp.", trend: "auf", kontext: "zugesagte KW gehalten", reihe: [88, 90, 89, 91, 92, 90, 93, 94, 93, 95, 94, 96] },
];

// Umsatz je Monat in Tsd. € (Dez. 2025 – Nov. 2026); November = Prognose.
export const MONATE = ["Dez", "Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov"];
export const UMSATZ_VORJAHR = [168, 112, 124, 171, 198, 214, 187, 142, 118, 196, 228, 211];
export const UMSATZ_JETZT = [181, 126, 139, 192, 221, 236, 208, 151, 133, 219, 247, 252];

export const HEUTE = [
  { zeit: "09:30", dauer: "60 Min", titel: "Beratung Wohnbereich", wer: "Familie Ostermann", ort: "Showroom EG · Minotti-Welt", art: "Beratung", team: ["LH"], status: "vorbei" },
  { zeit: "11:00", dauer: "90 Min", titel: "Aufmaß 12 Suiten", wer: "Hotel Lindwurm am See", ort: "Vor Ort · Hard", art: "Aufmaß", team: ["LH", "MS"], status: "jetzt" },
  { zeit: "14:00", dauer: "45 Min", titel: "Planungsabnahme Küche V3", wer: "Dr. Matthias Riedl", ort: "Planungsraum 2 · 3D-Rendering", art: "Planung", team: ["MS"], status: "später" },
  { zeit: "16:30", dauer: "30 Min", titel: "Rückruf Bezugsstoffe Lawson", wer: "Atelier Vogelsang Architektur", ort: "Telefon", art: "Rückruf", team: ["LH"], status: "später" },
];

export const AUFGABEN = [
  { titel: "Angebot freigeben", ref: "ANG-0412", wer: "Atelier Vogelsang", betrag: "48.200 €", faellig: "Heute", dringend: true },
  { titel: "Liefertermin bestätigen – Connery Sofa", ref: "AB-0388", wer: "Dr. Matthias Riedl", faellig: "Heute", dringend: true },
  { titel: "Reklamation prüfen: Naht Bezugsstoff", ref: "SV-0071", wer: "Valerie Brunner", faellig: "Morgen" },
  { titel: "Handzeichnung Lobby scannen und anhängen", ref: "PL-0129", wer: "Hotel Lindwurm am See", faellig: "Fr., 6. Nov." },
];

export const PIPELINE = [
  { stufe: "Anfrage", anzahl: 18, wert: 214 },
  { stufe: "Planung", anzahl: 11, wert: 386 },
  { stufe: "Angebot", anzahl: 7, wert: 292 },
  { stufe: "Auftrag", anzahl: 5, wert: 241 },
];

export const AKTIVITAET = [
  { wer: "MS", text: "hat Planung V3 hochgeladen", bezug: "Küche Riedl", zeit: "vor 12 Min", art: "datei" },
  { wer: "IW", text: "hat Bon 2026-11-0418 kassiert", bezug: "1.890,00 €", zeit: "vor 26 Min", art: "kassa" },
  { wer: "SA", text: "hat Anfrage zugewiesen an Lena Hofer", bezug: "Yachtwerft Oberholzer", zeit: "vor 41 Min", art: "anfrage" },
  { wer: "TK", text: "hat Montage abgeschlossen", bezug: "Penthouse Ostermann · Teil 2/3", zeit: "vor 1 Std", art: "montage" },
  { wer: "LH", text: "hat Angebot versendet", bezug: "ANG-0415 · 22.760 €", zeit: "vor 2 Std", art: "angebot" },
  { wer: "JR", text: "hat Wareneingang gebucht", bezug: "Poliform · 14 Kolli", zeit: "vor 3 Std", art: "lager" },
];

export const LIEFERUNGEN = [
  { tag: "Do", datum: "5.", titel: "Tréca Paris Bett + Matratzen", wer: "Valerie Brunner", ort: "Lindau", status: "Bereit" },
  { tag: "Fr", datum: "6.", titel: "Rimadesio Modulor Wandsystem", wer: "Atelier Vogelsang", ort: "Dornbirn", status: "Unterwegs" },
  { tag: "Mo", datum: "9.", titel: "Poliform Phoenix Küche · Montage", wer: "Familie Ostermann", ort: "Bregenz", status: "Geplant" },
];

export const STATUS = {
  neu: { label: "Neu", ton: "blau" },
  qualifiziert: { label: "Qualifiziert", ton: "violett" },
  termin: { label: "Termin vereinbart", ton: "petrol" },
  angebot: { label: "Angebot", ton: "orange" },
  gewonnen: { label: "Gewonnen", ton: "gruen" },
};

export const QUELLEN = { web: "Website", tel: "Telefon", showroom: "Showroom", empfehlung: "Empfehlung", mail: "E-Mail", instagram: "Instagram" };

export const ANFRAGEN = [
  { id: "ANF-2026-0481", bild: "minotti-navetta42-heck.jpg", anhang: "Generalplan der Werft", name: "Yachtwerft Oberholzer", person: "Clemens Oberholzer", firma: true, kurz: "YO", ton: 6, anliegen: "Salon & Eignerkabine, Neubau 24 m", bereich: "Yacht", quelle: "empfehlung", status: "neu", wert: 120000, zust: "LH", eingang: "vor 41 Min", eingangLang: "Heute, 08:52", ort: "Fußach", nachricht: "Wir bauen einen 24-m-Motorsegler für einen Eigner aus Zürich. Gesucht wird ein ruhiges, warmes Interieur für Salon und Eignerkabine – gern mit Minotti, wenn es die Gewichtsvorgaben zulassen. Können wir uns nächste Woche in der Werft treffen?", wuensche: ["Budget ab 100 Tsd. €", "Gewichtsvorgaben", "Übergabe Mai 2027"], mail: "c.oberholzer@werft-oberholzer.example", tel: "+43 5578 41 22 0" },
  { id: "ANF-2026-0480", name: "Nora Kessler", person: "Nora Kessler", kurz: "NK", ton: 2, anliegen: "Esstisch + 8 Stühle, Altbau", bereich: "Wohnen", quelle: "web", status: "neu", wert: 14500, zust: "LH", eingang: "vor 2 Std", eingangLang: "Heute, 07:31", ort: "Lindau", nachricht: "Wir haben im Showroom den Tisch mit der Keramikplatte gesehen und suchen dazu passende Stühle für acht Personen. Raum ca. 5 × 4 m, Fischgrätparkett in Eiche.", wuensche: ["8 Personen", "Keramikplatte", "Eiche-Parkett"], mail: "nora.kessler@mail.example", tel: "+49 8382 55 19 7" },
  { id: "ANF-2026-0479", bild: "minotti-patio.jpg", anhang: "Referenz Seeterrasse", name: "Hotel Lindwurm am See", person: "Miriam Fässler, Direktion", firma: true, kurz: "HL", ton: 4, anliegen: "Renovierung 12 Suiten + Lobby", bereich: "Hotel", quelle: "tel", status: "termin", wert: 680000, zust: "LH", eingang: "gestern", eingangLang: "3. Nov., 16:10", ort: "Hard", nachricht: "Nach der Saison renovieren wir zwölf Suiten und die Lobby. Wir wünschen ein Gesamtkonzept inkl. Leuchten und Outdoor für die Seeterrasse.", wuensche: ["Fertig bis April", "Outdoor-Terrasse", "Gesamtkonzept"], mail: "f.direktion@lindwurm-hotel.example", tel: "+43 5574 7 31 00" },
  { id: "ANF-2026-0478", bild: "poliform-kueche-kochinsel.webp", anhang: "Grundriss + Inspiration", name: "Paul & Theresa Märk", person: "Theresa Märk", kurz: "PM", ton: 1, anliegen: "Küche mit Kochinsel, Neubau", bereich: "Küche", quelle: "showroom", status: "qualifiziert", wert: 62000, zust: "MS", eingang: "gestern", eingangLang: "3. Nov., 11:45", ort: "Wolfurt", nachricht: "Grundriss im Anhang. Wir möchten eine Insel mit Quooker und Gaggenau-Geräten, Fronten matt, gern dunkle Eiche.", wuensche: ["Gaggenau 400", "Quooker", "Grundriss liegt vor"], mail: "maerk.familie@mail.example", tel: "+43 664 218 44 09" },
  { id: "ANF-2026-0477", name: "Studio Felber Architekten", person: "Arch. DI Simon Felber", firma: true, kurz: "SF", ton: 5, anliegen: "Objektbemusterung Büro, 40 AP", bereich: "Objekt", quelle: "mail", status: "angebot", wert: 96000, zust: "SA", eingang: "2. Nov.", eingangLang: "2. Nov., 09:20", ort: "Feldkirch", nachricht: "Für einen Bürobau mit 40 Arbeitsplätzen suchen wir Lounge- und Besprechungsmöbel. Bitte Bemusterung von ClassiCon und Minotti.", wuensche: ["40 Arbeitsplätze", "Bemusterung", "Architektenkonditionen"], mail: "office@felber-arch.example", tel: "+43 5522 31 70 2" },
  { id: "ANF-2026-0476", bild: "flos-stehleuchte-v3.webp", anhang: "Screenshot aus der Story", name: "Valerie Brunner", person: "Valerie Brunner", kurz: "VB", ton: 3, anliegen: "Leuchten Wohnzimmer + Flur", bereich: "Licht", quelle: "instagram", status: "qualifiziert", wert: 7800, zust: "IW", eingang: "2. Nov.", eingangLang: "2. Nov., 18:03", ort: "Lindau", nachricht: "Ich hätte gern eine Lichtplanung für Wohnzimmer und Flur, gesehen habe ich die Flos-Stehleuchte in eurer Story.", wuensche: ["Flos", "Lichtplanung", "Bestandskundin"], mail: "v.brunner@mail.example", tel: "+49 8382 9 44 61" },
  { id: "ANF-2026-0475", name: "Dr. Matthias Riedl", person: "Dr. Matthias Riedl", kurz: "MR", ton: 6, anliegen: "Bad & Wellness, Dachgeschoss", bereich: "Bad", quelle: "empfehlung", status: "termin", wert: 38500, zust: "MS", eingang: "31. Okt.", eingangLang: "31. Okt., 10:15", ort: "Bregenz", nachricht: "Empfehlung von Familie Ostermann. Bad im Dachgeschoss mit freistehender Wanne und Sauna, Fliesen gern Ezarri.", wuensche: ["Sauna", "Freistehende Wanne", "Ezarri-Mosaik"], mail: "m.riedl@praxis-riedl.example", tel: "+43 5574 4 20 18" },
  { id: "ANF-2026-0474", name: "Chalet Gamsgrat", person: "Hannes Wachter", firma: true, kurz: "CG", ton: 1, anliegen: "Outdoor-Lounge Sonnenterrasse", bereich: "Outdoor", quelle: "web", status: "angebot", wert: 54000, zust: "LH", eingang: "30. Okt.", eingangLang: "30. Okt., 14:40", ort: "Lech", nachricht: "Für die Sonnenterrasse brauchen wir eine wetterfeste Lounge für 30 Gäste plus Schirme mit Heizung.", wuensche: ["30 Gäste", "Sonnenschirme", "Lieferung Mai"], mail: "info@chalet-gamsgrat.example", tel: "+43 5583 2 11 90" },
  { id: "ANF-2026-0473", bild: "minotti-sofa-wohnzimmer.webp", anhang: "Ausstellungsstück", name: "Elif Yıldız", person: "Elif Yıldız", kurz: "EY", ton: 2, anliegen: "Kundenkarte & Sofa-Reservierung", bereich: "Wohnen", quelle: "showroom", status: "gewonnen", wert: 21900, zust: "IW", eingang: "29. Okt.", eingangLang: "29. Okt., 12:05", ort: "Bregenz", nachricht: "Reservierung des Ausstellungsstücks Lawson in Leinen sand.", wuensche: ["Ausstellungsstück", "Abholung"], mail: "elif.yildiz@mail.example", tel: "+43 676 33 18 202" },
  { id: "ANF-2026-0472", bild: "rimadesio-wandsystem-wohnraum.webp", anhang: "Inspiration Kundin", name: "Bernhard Zängerle", person: "Bernhard Zängerle", kurz: "BZ", ton: 4, anliegen: "Garderobe & Ankleide nach Maß", bereich: "Wohnen", quelle: "tel", status: "qualifiziert", wert: 18700, zust: "MS", eingang: "28. Okt.", eingangLang: "28. Okt., 08:55", ort: "Lustenau", nachricht: "Begehbare Ankleide im OG, ca. 9 m², Rimadesio oder Poliform.", wuensche: ["9 m²", "Rimadesio", "Beleuchtung integriert"], mail: "b.zaengerle@mail.example", tel: "+43 5577 8 31 44" },
];

export const KUNDE = {
  name: "Johanna & Felix Ostermann",
  kurz: "JO",
  art: "Privatkunde",
  ort: "Bregenz, Seestraße",
  seit: "2019",
  karte: "Kundenkarte Gold",
  punkte: "4.820",
  berater: "LH",
  architekt: "Atelier Vogelsang Architektur",
  mail: "ostermann@mail.example",
  tel: "+43 664 512 08 77",
  adresse: ["Seestraße 14, Penthouse", "6900 Bregenz", "Österreich"],
  projektBild: "poliform-kueche-kochinsel.webp",
  umsatzGesamt: "214.380 €",
  offen: "18.400 €",
  vorgang: {
    titel: "Penthouse Seestraße · Wohnen & Küche",
    nummer: "AB-0412",
    schritte: [
      { name: "Anfrage", datum: "12. März", info: "Empfehlung", stand: "fertig" },
      { name: "Planung", datum: "28. Mai", info: "V3 freigegeben", stand: "fertig" },
      { name: "Auftrag", datum: "14. Juni", info: "142.600 €", stand: "fertig" },
      { name: "Lieferung", datum: "KW 46", info: "2 von 3 Teilen", stand: "aktiv", fortschritt: 0.66 },
      { name: "Service", datum: "ab Dez.", info: "Pflege-Abo", stand: "offen" },
    ],
  },
  positionen: [
    { bild: "minotti-sofa-wohnzimmer.webp", marke: "Minotti", name: "Connery Sofa, Leder Pelle Soft", menge: "1", betrag: "32.480,00 €", status: "Montiert", ton: "gruen" },
    { bild: "poliform-kueche-kochinsel.webp", marke: "Poliform", name: "Phoenix Küche mit Kochinsel", menge: "1", betrag: "68.900,00 €", status: "Montage KW 46", ton: "petrol" },
    { bild: "gaggenau-backofen-marmorwand.webp", marke: "Gaggenau", name: "Backofen Serie 400, Edelstahl", menge: "2", betrag: "19.640,00 €", status: "Im Lager", ton: "blau" },
    { bild: "flos-stehleuchte-v3.webp", marke: "Flos", name: "Stehleuchte, Messing gebürstet", menge: "2", betrag: "6.180,00 €", status: "Montiert", ton: "gruen" },
    { bild: "classicon-bell-beistelltische.webp", marke: "ClassiCon", name: "Bell Side Table, Kupfer", menge: "3", betrag: "4.170,00 €", status: "Montiert", ton: "gruen" },
  ],
  zeitleiste: [
    { art: "montage", wer: "TK", titel: "Montage Teil 2/3 abgeschlossen", text: "Wohnbereich vollständig. Abnahmeprotokoll unterschrieben, ein Kratzer an Beistelltisch notiert – Ersatz bestellt.", zeit: "Heute, 10:42" },
    { art: "zahlung", wer: "SA", titel: "Zahlung eingegangen", text: "Teilrechnung RE-2026-1187 · 57.040,00 €", zeit: "2. Nov." },
    { art: "mail", wer: "LH", titel: "E-Mail an Johanna Ostermann", text: "„Liebe Frau Ostermann, die Küchenmontage ist für Montag, 9. Nov. ab 7:30 Uhr eingeplant …“", zeit: "30. Okt." },
    { art: "datei", wer: "MS", titel: "Planung V3 · Rendering Küche", text: "3 Renderings, 1 Handzeichnung (Ansicht Kochinsel)", zeit: "28. Mai", bild: "poliform-kueche-kochinsel.webp" },
    { art: "anruf", wer: "LH", titel: "Telefonat · 18 Min", text: "Wunsch: Insel 30 cm länger, Barhocker für vier. In V3 übernommen.", zeit: "21. Mai" },
  ],
  vorgaenge: [
    { titel: "Penthouse Seestraße", nummer: "AB-0412", betrag: "142.600 €", stand: "Lieferung" },
    { titel: "Bad Gästebereich", nummer: "ANG-0398", betrag: "24.900 €", stand: "Angebot" },
    { titel: "Ferienhaus Schröcken", nummer: "AB-0201", betrag: "46.880 €", stand: "Abgeschlossen" },
  ],
  zahlungen: { auftrag: 142600, bezahlt: 124200, offen: 18400 },
};

export const ARTIKEL = [
  { id: 1, bild: "classicon-bell-beistelltische.webp", marke: "ClassiCon", name: "Bell Side Table", var: "Kupfer", preis: 1390, bestand: 3, kat: "wohnen" },
  { id: 2, bild: "flos-stehleuchte-v3.webp", marke: "Flos", name: "Stehleuchte", var: "Messing gebürstet", preis: 3090, bestand: 2, kat: "licht" },
  { id: 3, bild: "quooker-fusion-round-edelstahl.webp", marke: "Quooker", name: "Fusion Round", var: "Edelstahl", preis: 1890, bestand: 6, kat: "kueche" },
  { id: 4, bild: "minotti-sofa-wohnzimmer.webp", marke: "Minotti", name: "Kissen 50 × 50", var: "Leinen sand", preis: 420, bestand: 14, kat: "wohnen" },
  { id: 5, bild: "rimadesio-wandsystem-wohnraum.webp", marke: "Rimadesio", name: "Modulor Box", var: "Glas bronze", preis: 1260, bestand: 1, kat: "wohnen" },
  { id: 6, bild: "treca-paris-bett-schlafzimmer.webp", marke: "Tréca Paris", name: "Kopfkissen Duvet", var: "Daune 65 × 65", preis: 290, bestand: 9, kat: "schlafen" },
  { id: 7, bild: "poliform-schlafzimmer-bett.webp", marke: "Poliform", name: "Plaid Merino", var: "Taupe", preis: 540, bestand: 4, kat: "schlafen" },
  { id: 8, bild: "gaggenau-backofen-marmorwand.webp", marke: "Gaggenau", name: "Pizzastein-Set", var: "Serie 400", preis: 380, bestand: 5, kat: "kueche" },
];

export const WARENKORB = [
  { id: 2, menge: 1 },
  { id: 1, menge: 2 },
  { id: 4, menge: 4 },
];

export const KATEGORIEN = [
  { id: "alle", label: "Alle" },
  { id: "wohnen", label: "Wohnen" },
  { id: "licht", label: "Licht" },
  { id: "kueche", label: "Küche" },
  { id: "schlafen", label: "Schlafen" },
  { id: "gutschein", label: "Gutscheine" },
];

export const euro = (n, nk = 0) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", minimumFractionDigits: nk, maximumFractionDigits: nk }).format(n);
