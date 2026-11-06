// Fiktive Beispieldaten für den Entwurf „Showroom“. Alle Personen, Firmen,
// Adressen und Beträge sind erfunden; Markennamen nur als Produkttext.
// Bildregel (Jury Nr. 21): kein Motiv doppelt auf demselben Bildschirm.
export const BILD = (n) => `/entwurf/showroom/${n}`;

/** Zahlen einheitlich mit Punkt-Gruppierung („1.240“), auch vierstellig. */
const NF = new Intl.NumberFormat("de-DE", { useGrouping: "always" });
export const zahl = (n) => NF.format(n);
/** Beträge in Listen: ganzzahlig ohne „,00“. */
export const euro = (n) => `${NF.format(Math.round(n))} €`;
/** Kassa: immer mit Cent. */
const NF2 = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: "always" });
export const kasse = (n) => `${NF2.format(n)} €`;

export const ICH = { name: "Lena Hartmann", vorname: "Lena", kurz: "LH", rolle: "Einrichtungsberaterin", m: "leder" };

export const TEAM = {
  LH: { name: "Lena Hartmann", kurz: "LH", m: "leder" },
  JF: { name: "Jonas Feuerstein", kurz: "JF", m: "see" },
  MO: { name: "Miriam Ostler", kurz: "MO", m: "salbei" },
  DW: { name: "David Wohlgenannt", kurz: "DW", m: "eiche" },
  SA: { name: "Selin Aksoy", kurz: "SA", m: "trav" },
  PB: { name: "Paul Breuss", kurz: "PB", m: "stein" },
};

// Zentrale – Bilder: kueche-eiche, terrasse, beistelltische, arbeiten (Tag) ·
// wohnen-loft, essen-see, kueche-weiss, sofa (Projekte) · vase (Showroom)
export const HEUTE = [
  { zeit: "09:30", dauer: "45 Min.", titel: "Beratung Küche – Familie Brandauer", ort: "Showroom · Küchenwelt", bild: "kueche-eiche.jpg", m: "eiche", art: "Beratung", vorbei: true },
  { zeit: "11:00", dauer: "1 Std.", titel: "Aufmaß Villa Pfänderblick", ort: "Lochau · mit Miriam Ostler", bild: "terrasse.jpg", m: "see", art: "Vor Ort", jetzt: true },
  { zeit: "14:00", dauer: "2 Std.", titel: "Lieferung Hotel Uferlicht", ort: "Lindau · 6 Lounge-Sessel, 3 Tische", bild: "beistelltische.jpg", m: "salbei", art: "Lieferung" },
  { zeit: "16:30", dauer: "1 Std.", titel: "Materialabstimmung Studio Lerchenfeld", ort: "Showroom · Stoffe und Leder", bild: "arbeiten.jpg", m: "leder", art: "Termin" },
];

export const BRAUCHT_DICH = [
  { icon: "FileSignature", m: "leder", t: "Angebot freigeben", d: "Wendlinger · 48.900 €", cta: "Prüfen" },
  { icon: "PhoneCall", m: "see", t: "Rückruf Anna Gmeiner", d: "Wünscht Termin für die Bad-Planung", cta: "Anrufen" },
  { icon: "AlertTriangle", m: "rost", t: "Lieferverzug Outdoor-Tisch", d: "Hersteller meldet KW 48 statt KW 46", cta: "Informieren" },
  { icon: "PenTool", m: "salbei", t: "Rendering zur Abnahme", d: "Miriam · Küche Rhomberg, Variante B", cta: "Ansehen" },
];

// Umsatz je Monat (Tsd. €), aktuelles Jahr / Vorjahr – Dez. bis Nov.
export const UMSATZ = [
  { m: "Dez", v: 212, p: 198 }, { m: "Jan", v: 118, p: 131 }, { m: "Feb", v: 136, p: 122 },
  { m: "Mär", v: 171, p: 149 }, { m: "Apr", v: 194, p: 176 }, { m: "Mai", v: 226, p: 201 },
  { m: "Jun", v: 241, p: 213 }, { m: "Jul", v: 188, p: 194 }, { m: "Aug", v: 152, p: 168 },
  { m: "Sep", v: 233, p: 205 }, { m: "Okt", v: 264, p: 228 }, { m: "Nov", v: 96, p: 87, laufend: true },
];

export const PIPELINE = [
  { name: "Wohnen", wert: 486, m: "leder" },
  { name: "Küche", wert: 362, m: "eiche" },
  { name: "Outdoor", wert: 214, m: "salbei" },
  { name: "Hotel & Yacht", wert: 178, m: "see" },
];

export const BESUCHE = [22, 28, 25, 31, 27, 36, 33, 41];

export const PROJEKTE = [
  { name: "Villa Pfänderblick", kunde: "K. & M. Wendlinger · Lochau", phase: "Lieferung Do.", stufe: 4, bild: "wohnen-loft.jpg", summe: 148320, team: ["LH", "MO", "PB"] },
  { name: "Hotel Uferlicht, Seeterrasse", kunde: "Uferlicht GmbH · Lindau", phase: "Montage heute", stufe: 4, bild: "essen-see.jpg", summe: 86450, team: ["DW", "PB"] },
  { name: "Küche Rhomberg", kunde: "Tobias Rhomberg · Dornbirn", phase: "Planung", stufe: 2, bild: "kueche-weiss.jpg", summe: 62800, team: ["JF", "MO"] },
  { name: "Motoryacht „Seraina“", kunde: "Werft Halder · Fußach", phase: "Auftrag", stufe: 3, bild: "sofa.jpg", summe: 214000, team: ["LH", "DW", "MO"] },
];

export const AKTIVITAET = [
  { tag: "Heute", items: [
    { wer: "MO", txt: <><b>Miriam Ostler</b> hat 3 Renderings zu <b>Küche Rhomberg</b> hochgeladen</>, zeit: "08:52" },
    { wer: "SA", txt: <><b>Selin Aksoy</b> hat an der Kassa <b>2.480 €</b> verbucht · Kundenkarte Eiche</>, zeit: "08:41" },
    { wer: "JF", txt: <><b>Jonas Feuerstein</b> hat die Anfrage von <b>Clara Fink</b> übernommen</>, zeit: "08:17", zitat: "„Wir planen einen offenen Wohn-Essbereich, gern mit Massivholztisch für 10 Personen.“" },
  ] },
  { tag: "Gestern", items: [
    { wer: "DW", txt: <><b>David Wohlgenannt</b> hat <b>Hotel Uferlicht</b> auf „Lieferbereit“ gesetzt</>, zeit: "17:30" },
    { wer: "LH", txt: <><b>Du</b> hast ein Angebot an <b>Hollenstein Architekten</b> gesendet · 31.240 €</>, zeit: "15:05" },
  ] },
];

// Anfragen – je Anfrage ein eigenes Motiv
export const STATUS = {
  neu: { label: "Neu", m: "leder" },
  qualifiziert: { label: "Qualifiziert", m: "eiche" },
  termin: { label: "Termin", m: "see" },
  angebot: { label: "Angebot", m: "trav" },
  gewonnen: { label: "Gewonnen", m: "salbei" },
  verloren: { label: "Verloren", m: "stein" },
};

export const ANFRAGEN = [
  { id: "A-2611-041", name: "Clara Fink", ort: "Bregenz", kontakt: "Privat", m: "leder", neu: true, status: "neu", bereich: "Wohnen", icon: "Sofa", thema: "Wohn-Essbereich, Massivholztisch", budget: "40–60", quelle: "Website", berater: "JF", eingang: "38 Min.", eingangLang: "vor 38 Minuten", bild: "essgruppe.jpg", nachricht: "Guten Tag, wir haben ein Haus in Bregenz gekauft und planen einen offenen Wohn-Essbereich. Gern ein Massivholztisch für 10 Personen und ein großzügiges Sofa. Wann könnten wir in den Showroom kommen?", tel: "+43 664 218 30 77", adresse: "Bregenz-Vorkloster" },
  { id: "A-2611-040", name: "Hotel Uferlicht", ort: "Lindau", kontakt: "Ingrid Sauter, Direktion", m: "see", neu: true, status: "neu", bereich: "Hotel", icon: "BedDouble", thema: "12 Suiten, Lounge-Möblierung", budget: "120–150", quelle: "Bestandskunde", berater: "DW", eingang: "2 Std.", eingangLang: "vor 2 Stunden", bild: "wohnen-loft.jpg", nachricht: "Nach der gelungenen Seeterrasse möchten wir im Frühjahr unsere 12 Suiten neu einrichten. Bitte um ein erstes Gespräch inklusive Musterstoffen.", tel: "+49 8382 94 11 20", adresse: "Lindau (Bodensee)" },
  { id: "A-2611-039", name: "Tobias & Eva Rhomberg", ort: "Dornbirn", kontakt: "Privat", m: "eiche", status: "termin", bereich: "Küche", icon: "ChefHat", thema: "Küche mit Insel in Eiche", budget: "55–70", quelle: "Showroom", berater: "JF", eingang: "Gestern", eingangLang: "gestern, 17:12", bild: "kueche-weiss.jpg", nachricht: "Wir waren am Samstag bei Ihnen und haben uns in die Eichenfronten verliebt. Die Insel sollte mindestens 3 Meter lang sein.", tel: "+43 676 551 02 94", adresse: "Dornbirn" },
  { id: "A-2611-038", name: "Studio Lerchenfeld", ort: "Feldkirch", kontakt: "Architektur · Mag. Paula Lerch", m: "salbei", status: "angebot", bereich: "Büro", icon: "Briefcase", thema: "Kanzlei mit 14 Arbeitsplätzen", budget: "90", quelle: "Architekt", berater: "LH", eingang: "Gestern", eingangLang: "gestern, 09:40", bild: "arbeiten.jpg", nachricht: "Für unseren Bauherrn, eine Kanzlei in Bregenz, suchen wir einen Partner für Möblierung und Akustik. Planunterlagen anbei.", tel: "+43 5522 73 420", adresse: "Feldkirch" },
  { id: "A-2611-037", name: "Anna Gmeiner", ort: "Hard", kontakt: "Privat", m: "rost", status: "qualifiziert", bereich: "Bad", icon: "Bath", thema: "Bad mit freistehender Wanne", budget: "35", quelle: "Instagram", berater: "LH", eingang: "Montag", eingangLang: "Montag, 3. Nov.", bild: "bad.webp", nachricht: "Ich habe Ihr Bad-Projekt auf Instagram gesehen. Unser Bad im Obergeschoss soll komplett neu werden, mit freistehender Wanne.", tel: "+43 650 908 11 46", adresse: "Hard" },
  { id: "A-2611-036", name: "Werft Halder", ort: "Fußach", kontakt: "Matthias Halder, Inhaber", m: "see", status: "gewonnen", bereich: "Yacht", icon: "Ship", thema: "Salon der Motoryacht „Seraina“", budget: "214", quelle: "Empfehlung", berater: "LH", eingang: "02.11.", eingangLang: "2. November", bild: "sofa.jpg", nachricht: "Wie besprochen anbei die Decksaufteilung der Seraina. Wir freuen uns auf die Zusammenarbeit.", tel: "+43 5578 220 14", adresse: "Fußach" },
  { id: "A-2611-035", name: "Familie Natter", ort: "Lustenau", kontakt: "Privat", m: "salbei", status: "qualifiziert", bereich: "Outdoor", icon: "TreePine", thema: "Terrasse und Pool-Lounge", budget: "28–35", quelle: "Website", berater: "DW", eingang: "01.11.", eingangLang: "1. November", bild: "terrasse.jpg", nachricht: "Für unsere neue Terrasse mit Pool suchen wir eine Lounge-Gruppe, zwei Liegen und einen großen Schirm.", tel: "+43 664 330 52 81", adresse: "Lustenau" },
  { id: "A-2611-034", name: "Dr. Jakob Moosbrugger", ort: "Bregenz", kontakt: "Praxis für Innere Medizin", m: "eiche", status: "termin", bereich: "Wohnen", icon: "Lamp", thema: "Wartebereich mit Lichtkonzept", budget: "18", quelle: "Telefon", berater: "MO", eingang: "31.10.", eingangLang: "31. Oktober", bild: "beistelltische.jpg", nachricht: "Der Wartebereich unserer Praxis soll wohnlicher werden. Bitte mit Lichtkonzept.", tel: "+43 5574 42 880", adresse: "Bregenz" },
  { id: "A-2611-033", name: "Sophie Kalb", ort: "Lindau", kontakt: "Privat", m: "trav", status: "angebot", bereich: "Wohnen", icon: "Sofa", thema: "Sofa in Cognac, 20 cm länger", budget: "24", quelle: "Showroom", berater: "SA", eingang: "29.10.", eingangLang: "29. Oktober", bild: "vase.jpg", nachricht: "Das Sofa aus dem Schaufenster in Cognac-Leder: Gibt es das auch 20 cm länger? Dazu suche ich zwei Vasen in Travertin.", tel: "+49 8382 51 09 3", adresse: "Lindau (Bodensee)" },
  { id: "A-2611-032", name: "Valentina Ess", ort: "Wolfurt", kontakt: "Privat", m: "leder", status: "verloren", bereich: "Küche", icon: "ChefHat", thema: "Kompakte Küchenzeile, 3,20 m", budget: "15", quelle: "Website", berater: "JF", eingang: "27.10.", eingangLang: "27. Oktober", bild: "kueche-eiche.jpg", nachricht: "Wir suchen eine kleine Küche für unsere Wohnung, ca. 3,20 m Zeile.", tel: "+43 680 11 74 552", adresse: "Wolfurt" },
];

// Kundenakte – Bilder: wohnen-loft (Kopf) · essen-see, plaid, vase (Renderings) ·
// sofa, essgruppe, terrasse, beistelltische (Positionen)
export const ZEITLEISTE = [
  { tag: "Heute", items: [
    { icon: "Truck", m: "see", t: "Lieferung avisiert", d: "Donnerstag, 6. Nov., 8–10 Uhr · Tour 2 mit Paul Breuss. Zufahrt über den Hintereingang, Lift vorhanden.", zeit: "08:10" },
  ] },
  { tag: "Montag, 3. November", items: [
    { icon: "Mail", t: "E-Mail von Katharina Wendlinger", d: "„Die Stoffmuster sind angekommen. Wir nehmen den Bouclé in Sand für die Sessel. Danke für die Geduld!“", zeit: "19:24", zitat: true },
    { icon: "Receipt", m: "salbei", t: "Anzahlung eingegangen", d: "44.496 € (30 %) per Überweisung · Rechnung R-2611-0187", zeit: "10:02", datei: { name: "Anzahlungsrechnung R-2611-0187.pdf", gr: "182 KB" } },
  ] },
  { tag: "Freitag, 24. Oktober", items: [
    { icon: "PenTool", m: "leder", t: "Planung Wohnbereich freigegeben", d: "Variante B mit Ecksofa und Kamin-Lounge. Handzeichnung und 3D-Rendering von Miriam Ostler.", zeit: "15:40", bilder: [["essen-see.jpg", "Essbereich mit Seeblick"], ["plaid.jpg", "Terrasse, Lounge-Sessel"], ["vase.jpg", "Detail Kamin-Nische"]] },
    { icon: "Calendar", t: "Beratung im Showroom", d: "1 Std. 50 Min. mit Lena Hartmann · Stoffe, Leder, Terrasse", zeit: "10:00" },
  ] },
];

export const POSITIONEN = [
  { t: "Ecksofa „Connery“", s: "Minotti · Leder Cognac", a: 38420, bild: "sofa.jpg" },
  { t: "Outdoor-Lounge", s: "7-teilig · Terrasse Süd", a: 29540, bild: "terrasse.jpg" },
  { t: "Esstisch Eiche, 300 cm", s: "Maßanfertigung · Tischlerei", a: 14860, bild: "essgruppe.jpg" },
  { t: "Beistelltische „Bell“", s: "ClassiCon · 3 Stück", a: 6930, bild: "beistelltische.jpg" },
];

// Kassa
export const KATEGORIEN = [
  { id: "alle", label: "Beliebt", icon: "Sparkles" },
  { id: "wohnaccessoires", label: "Wohnaccessoires", icon: "Flower2" },
  { id: "textil", label: "Textilien", icon: "Layers" },
  { id: "moebel", label: "Kleinmöbel", icon: "Armchair" },
  { id: "licht", label: "Licht", icon: "Lamp" },
  { id: "duft", label: "Duft und Pflege", icon: "Droplets" },
  { id: "gutschein", label: "Gutscheine", icon: "Gift" },
];

// beliebt: erscheint in „Beliebt“ (2 Reihen × 4, ohne Scrollen auf dem iPad)
export const ARTIKEL = [
  { id: 1, kat: "moebel", beliebt: true, marke: "ClassiCon", t: "Bell Side Table, Messing", p: 1290, bild: "beistelltische.jpg", lager: "3 im Lager" },
  { id: 2, kat: "wohnaccessoires", beliebt: true, marke: "Platzhirsch Edition", t: "Vase Travertin, groß", p: 389, bild: "vase.jpg", lager: "5 im Lager" },
  { id: 3, kat: "textil", beliebt: true, marke: "Weberei Saurer", t: "Plaid Alpaka, Sand", p: 245, bild: "plaid.jpg", lager: "8 im Lager" },
  { id: 4, kat: "moebel", beliebt: true, marke: "Outdoor-Kollektion", t: "Lounge-Sessel Geflecht", p: 2140, bild: "terrasse.jpg", lager: "Ausstellung" },
  { id: 7, kat: "moebel", beliebt: true, marke: "Minotti", t: "Hocker Lido, Bouclé", p: 1680, bild: "sofa.jpg", lager: "1 im Lager" },
  { id: 8, kat: "wohnaccessoires", beliebt: true, marke: "Handwerk Bregenzerwald", t: "Schale Eiche, gedrechselt", p: 145, bild: "essgruppe.jpg", lager: "6 im Lager" },
  { id: 6, kat: "duft", beliebt: true, marke: "Platzhirsch Edition", t: "Raumduft Zirbe & Leder", p: 68, lager: "24 im Lager", icon: "Droplets", material: "Zirbenholz, Leder · 200 ml" },
  { id: 10, kat: "gutschein", beliebt: true, marke: "Platzhirsch", t: "Gutschein 250 €", p: 250, lager: "Digital" },
  { id: 5, kat: "licht", marke: "Flos", t: "Tischleuchte Bellhop, Ziegel", p: 199, lager: "12 im Lager", icon: "Lamp", material: "Aluminium, Ziegelrot · 21 cm" },
  { id: 12, kat: "licht", marke: "Louis Poulsen", t: "Panthella Mini, Opal", p: 595, lager: "2 im Lager", icon: "Lamp", material: "Acryl opal, Stahl · 33 cm" },
  { id: 9, kat: "textil", marke: "Weberei Saurer", t: "Kissen Leinen, 50 × 50", p: 89, lager: "16 im Lager", icon: "Layers", material: "Leinen gewaschen, Sand" },
  { id: 11, kat: "duft", marke: "Pflege", t: "Lederpflege-Set", p: 49, lager: "9 im Lager", icon: "Droplets", material: "Bienenwachs, Lanolin · 2 × 100 ml" },
];

export const KUNDE_KASSA = { name: "Sophie Kalb", kurz: "SK", m: "trav", ort: "Lindau", seit: "2021", stufe: "eiche", stufeName: "Eiche", punkte: 1240, naechste: "Nussbaum", fehlt: 760 };
