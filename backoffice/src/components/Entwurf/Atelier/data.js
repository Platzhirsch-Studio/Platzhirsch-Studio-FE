// Entwurf „Atelier“ – klar fiktive Beispieldaten (Stand Mi, 4. November 2026, 10:40).
// Personen, Firmen und Projekte sind erfunden; Marken nur als Produkttext.

export const IMG = (n) => `/entwurf/atelier/${n}`;

export const team = {
  LW: { name: "Lena Wachter", rolle: "Einrichtungsplanerin", tone: "t1" },
  JM: { name: "Jonas Mähr", rolle: "Objektberatung", tone: "t2" },
  SF: { name: "Selina Fritsch", rolle: "3D & Rendering", tone: "t3" },
  AG: { name: "Andreas Gmeiner", rolle: "Montageleitung", tone: "t4" },
  DB: { name: "David Böhler", rolle: "Küchenplanung", tone: "t2" },
};

export const bereiche = {
  kueche: { label: "Küche", swatch: "var(--at-mat-1)" },
  wohnen: { label: "Wohnen", swatch: "var(--at-mat-2)" },
  bad: { label: "Bad", swatch: "var(--at-mat-3)" },
  outdoor: { label: "Outdoor", swatch: "var(--at-mat-4)" },
  yacht: { label: "Yacht", swatch: "var(--at-mat-5)" },
  hotel: { label: "Hotel & Objekt", swatch: "var(--at-mat-6)" },
  licht: { label: "Licht", swatch: "var(--at-mat-7)" },
};

export const statusGruppen = [
  { key: "neu", label: "Neu", cls: "s1" },
  { key: "planung", label: "In Beratung", cls: "s2" },
  { key: "angebot", label: "Angebot offen", cls: "s3" },
  { key: "kunde", label: "Wartet auf Kunde", cls: "s4" },
];

export const anfragen = [
  {
    id: "ANF-2611", name: "Seehotel Lindenhof", org: "Lindau (DE) · über Kessler Raum & Architektur", bereich: "hotel", status: "neu",
    titel: "24 Zimmer und Lobby, Renovierung bis Saison 2027", budget: "380–450 T€", budgetN: 415000, quelle: "Architekt", wer: "JM", eingang: "vor 40 Min.",
    nachricht: "Wir modernisieren im Winter alle 24 Seezimmer und die Lobby – ruhig, hochwertig, mit Bezug zum Wasser. Grundrisse und Bestandsfotos anbei.",
    kontakt: "Dr. Annette Vögele, Geschäftsführung", tel: "+49 8382 94 11 20", wunsch: "Ortstermin KW 46", anh: [{"img":"wohnraum.jpg","t":"Lobby Bestand","m":"Foto · Okt. 2026"},{"img":"sofa-lounge.jpg","t":"Zimmer 214 Bestand","m":"Foto · Okt. 2026"},{"t":"Grundrisse OG 1–3","m":"PDF · 3 Seiten"}],
  },
  {
    id: "ANF-2610", name: "Theresa Bachmann", org: "Wangen im Allgäu · Privat", bereich: "kueche", status: "neu",
    titel: "Küche mit Kochinsel, Eiche geräuchert, ca. 28 m²", budget: "60–80 T€", budgetN: 70000, quelle: "Küchenplaner Website", wer: "DB", eingang: "vor 2 Std.",
    nachricht: "Wir bauen um und wünschen uns eine Kochinsel zum Raum hin, viel Holz, aber nicht rustikal. Dampfgarer und Weinklima sind gesetzt. Die Skizze aus Ihrem Küchenplaner hängt an.",
    kontakt: "Theresa Bachmann", tel: "+49 7522 30 48 17", wunsch: "Beratung am Samstag", anh: [{"img":"kueche-eiche.jpg","t":"Referenz Kochinsel","m":"aus dem Küchenplaner"},{"t":"Skizze Küchenplaner","m":"PDF · 1 Seite"}],
  },
  {
    id: "ANF-2609", name: "Dr. Florian Wehinger", org: "Dornbirn · Zahnarztpraxis", bereich: "hotel", status: "neu",
    titel: "Wartebereich und Empfang, Designklassiker", budget: "25–35 T€", budgetN: 30000, quelle: "Empfehlung", wer: "LW", eingang: "gestern, 17:42",
    nachricht: "Unser Wartebereich soll eher wie eine Hotellobby wirken. Wir denken an Vitra und ClassiCon. Bitte um Rückruf vor 12 Uhr.",
    kontakt: "Dr. Florian Wehinger", tel: "+43 5572 21 08 44", wunsch: "Rückruf heute", anh: [{"img":"leuchten.jpg","t":"Wartebereich heute","m":"Foto · 3. Nov."},{"t":"Grundriss Praxis EG","m":"PDF · 1 Seite"}],
  },
  {
    id: "ANF-2607", name: "Miriam Oberhauser", org: "Lindau (DE) · Privat", bereich: "bad", status: "neu",
    titel: "Masterbad, freistehende Wanne, Naturstein", budget: "30–40 T€", budgetN: 35000, quelle: "Showroom", wer: "LW", eingang: "gestern, 11:05",
    nachricht: "Die Agape-Wanne aus Ihrem Showroom geht mir nicht aus dem Kopf. Passt sie in 3,1 × 2,4 m mit Dachschräge?",
    kontakt: "Miriam Oberhauser", tel: "+49 8382 77 30 12", wunsch: "Aufmaß vor Ort", anh: [{"t":"Grundriss Bad mit Schräge","m":"PDF · 2 Seiten"}],
  },
  {
    id: "ANF-2603", name: "Familie Nesensohn", org: "Feldkirch · Privat", bereich: "wohnen", status: "planung",
    titel: "Wohnraum neu, Sofa-Landschaft und Leuchtenkonzept", budget: "70–90 T€", budgetN: 82000, quelle: "Showroom", wer: "LW", eingang: "28. Okt.",
    nachricht: "Nach dem Termin im Showroom: Bitte zwei Varianten mit Minotti und eine ruhigere Alternative.", kontakt: "Petra Nesensohn", tel: "+43 5522 73 19 05", wunsch: "Präsentation Fr 10:00", anh: [{"img":"sofa-lounge.jpg","t":"Wohnraum Bestand","m":"Foto · 28. Okt."},{"t":"Aufmaß Wohnraum","m":"PDF · 2 Seiten"}],
  },
  {
    id: "ANF-2598", name: "Yacht „Aurelia“", org: "Kressbronn · Eignervertretung", bereich: "yacht", status: "planung",
    titel: "Salon und Eignerkabine, 24-m-Motoryacht", budget: "120–160 T€", budgetN: 140000, quelle: "Messe", wer: "JM", eingang: "21. Okt.",
    nachricht: "Leichte, salzwasserfeste Materialien, maßgefertigte Polster, Leuchten mit Schiffszulassung.", kontakt: "Kapitän Ralf Strobel", tel: "+49 7543 60 22 91", wunsch: "Werftbesuch KW 46", anh: [{"t":"Generalplan „Aurelia“","m":"PDF · 6 Seiten"}],
  },
  {
    id: "ANF-2595", name: "Clara Moosmann", org: "Hohenems · Privat", bereich: "wohnen", status: "planung",
    titel: "Ankleide mit Glasfronten, Rimadesio", budget: "18–24 T€", budgetN: 22000, quelle: "Website", wer: "SF", eingang: "19. Okt.",
    nachricht: "Ankleide im Dachgeschoss, Glas rauchgrau, Beleuchtung integriert.", kontakt: "Clara Moosmann", tel: "+43 5576 42 90 33", wunsch: "Rendering", anh: [{"t":"Dachgeschoss Aufmaß","m":"PDF · 1 Seite"}],
  },
  {
    id: "ANF-2590", name: "Chalet Silvretta", org: "Gaschurn · Betreibergesellschaft", bereich: "hotel", status: "planung",
    titel: "Sechs Chalets, Möblierung und Textilien", budget: "≈ 600 T€", budgetN: 600000, quelle: "Architekt", wer: "JM", eingang: "14. Okt.",
    nachricht: "Alpine Ruhe, Loden, Eiche, warme Leuchten. Fertigstellung Dezember 2027.", kontakt: "Martin Juen", tel: "+43 5558 81 40 00", wunsch: "Musterzimmer", anh: [{"t":"Raumbuch Chalets","m":"PDF · 14 Seiten"}],
  },
  {
    id: "ANF-2588", name: "Weingut Hagenauer", org: "Meersburg (DE)", bereich: "hotel", status: "angebot",
    titel: "Verkostungsraum mit Bar und Lounge", budget: "92.480 €", budgetN: 92480, quelle: "Empfehlung", wer: "JM", eingang: "9. Okt.",
    nachricht: "Angebot wartet auf Freigabe durch Lena.", kontakt: "Katrin Hagenauer", tel: "+49 7532 41 18 70", wunsch: "Freigabe", anh: [{"img":"esszimmer-see.jpg","t":"Verkostungsraum Entwurf","m":"Rendering v2"},{"t":"Angebot AN-0912","m":"PDF · 4 Seiten"}],
  },
  {
    id: "ANF-2581", name: "Restaurant Uferlos", org: "Bregenz · Gastronomie", bereich: "outdoor", status: "angebot",
    titel: "Seeterrasse, 40 Plätze, Teak und Sonnenschutz", budget: "54.120 €", budgetN: 54120, quelle: "Website", wer: "LW", eingang: "2. Okt.",
    nachricht: "Angebot heute dreimal geöffnet.", kontakt: "Tobias Ender", tel: "+43 5574 44 01 28", wunsch: "Rabatt 8 %", anh: [{"t":"Angebot AN-0907","m":"PDF · 3 Seiten"}],
  },
  {
    id: "ANF-2574", name: "Atelier Rauch Architekten", org: "Bregenz · Penthouse Seestraße", bereich: "wohnen", status: "angebot",
    titel: "Penthouse, komplette Ausstattung", budget: "186.000 €", budgetN: 186000, quelle: "Architekt", wer: "LW", eingang: "24. Sep.",
    nachricht: "Materialfreigabe im Videocall heute 16:30.", kontakt: "Mag. arch. Johanna Rauch", tel: "+43 5574 62 91 10", wunsch: "Materialfreigabe", anh: [{"img":"wohnraum.jpg","t":"Penthouse Wohnraum","m":"Rendering v3"},{"t":"Angebot AN-0889","m":"PDF · 9 Seiten"}],
  },
  {
    id: "ANF-2569", name: "Markus und Ines Thaler", org: "Kressbronn (DE) · Privat", bereich: "outdoor", status: "angebot",
    titel: "Poolterrasse und Outdoor-Küche", budget: "48.300 €", budgetN: 48300, quelle: "Showroom", wer: "DB", eingang: "18. Sep.",
    nachricht: "Rückfrage zur Lieferzeit der Outdoor-Küche.", kontakt: "Ines Thaler", tel: "+49 7543 50 77 21", wunsch: "Lieferzeit", anh: [{"t":"Angebot AN-0871","m":"PDF · 3 Seiten"}],
  },
  {
    id: "ANF-2561", name: "Sophie Kaufmann", org: "St. Gallen (CH) · Privat", bereich: "licht", status: "kunde",
    titel: "Leuchtenkonzept Altbauwohnung, Flos und Occhio", budget: "12–15 T€", budgetN: 13500, quelle: "Website", wer: "SF", eingang: "11. Sep.",
    nachricht: "Kundin klärt Zollabwicklung mit ihrem Steuerberater.", kontakt: "Sophie Kaufmann", tel: "+41 71 222 18 40", wunsch: "Rückmeldung", anh: [{"img":"leuchten.jpg","t":"Lichtstimmung Essplatz","m":"Referenz"},{"t":"Lichtplan v2","m":"PDF · 2 Seiten"}],
  },
  {
    id: "ANF-2552", name: "Jonas Fink", org: "Lustenau · Privat", bereich: "wohnen", status: "kunde",
    titel: "Lounge Chair, Nussbaum, Leder Nero", budget: "8.900 €", budgetN: 8900, quelle: "Showroom", wer: "LW", eingang: "3. Sep.",
    nachricht: "Wartet auf Lederprobe.", kontakt: "Jonas Fink", tel: "+43 5577 81 23 09", wunsch: "Lederprobe", anh: [{"t":"Lederkarte Nero","m":"PDF · 1 Seite"}],
  },
  {
    id: "ANF-2547", name: "Praxis am Kornmarkt", org: "Bregenz · Physiotherapie", bereich: "hotel", status: "kunde",
    titel: "Empfang, Wartezone, Akustikpaneele", budget: "21–26 T€", budgetN: 23500, quelle: "Empfehlung", wer: "JM", eingang: "29. Aug.",
    nachricht: "Entscheidung nach Bankgespräch Mitte November.", kontakt: "Eva Hämmerle", tel: "+43 5574 23 55 81", wunsch: "Rückmeldung", anh: [{"t":"Variante B Empfang","m":"PDF · 2 Seiten"}],
  },
];

export const heute = [
  { t: "08:30", d: "30 Min.", was: "Wochenstart im Studio", wo: "Showroom Lochau", wer: ["LW", "JM", "SF", "AG"], past: true },
  { t: "09:30", d: "90 Min.", was: "Beratung Küche · Theresa Bachmann", wo: "Showroom Lochau · Kochinsel, Eiche geräuchert", wer: ["DB", "LW"], kunde: true, past: true },
  { now: "10:40" },
  { t: "11:30", d: "2 Std.", was: "Aufmaß Seehotel Lindenhof", wo: "Lindau · Seezimmer 201–224", wer: ["JM", "SF"], kunde: true },
  { t: "14:00", d: "3 Std.", was: "Lieferung und Montage · Familie Kerber", wo: "Bregenz · Minotti „Andersen“, Esstisch Eiche", wer: ["AG"] },
  { t: "16:30", d: "45 Min.", was: "Materialfreigabe · Atelier Rauch Architekten", wo: "Videocall · Penthouse Seestraße", wer: ["LW"], kunde: true },
];

export const aufgaben = [
  { was: "Angebot freigeben", wen: "Weingut Hagenauer · Verkostungsraum", meta: "erstellt von Jonas Mähr · seit 2 Tagen", amt: "92.480 €" },
  { was: "Rabatt bestätigen", wen: "Restaurant Uferlos · 8 % auf Seeterrasse", meta: "Angebot heute 3× geöffnet", amt: "54.120 €", sub: "−4.330 €" },
  { was: "Reklamation sichten", wen: "Familie Steurer · Kratzer an Tischplatte", meta: "Foto im Anhang · Lieferant informieren" },
  { was: "Rückruf vor 12 Uhr", wen: "Dr. Florian Wehinger · Wartebereich Praxis", meta: "+43 5572 21 08 44" },
];

export const aktivitaet = [
  { wer: "SF", text: ["Selina Fritsch hat Rendering v2 für ", ["b", "Seehotel Lindenhof"], " hochgeladen"], zeit: "vor 18 Min.", bilder: ["wohnraum.jpg", "sofa-lounge.jpg", "leuchten.jpg"] },
  { wer: "RU", sys: "auge", text: [["b", "Restaurant Uferlos"], " hat das Angebot AN-0907 zum dritten Mal geöffnet"], zeit: "vor 42 Min." },
  { wer: "AG", text: ["Andreas Gmeiner hat die Montage bei ", ["b", "Familie Kerber"], " vorbereitet, Lieferschein unterschrieben"], zeit: "vor 1 Std." },
  { wer: "€", sys: "euro", text: ["Zahlung über ", ["b", "18.240 €"], " von Atelier Rauch Architekten verbucht"], zeit: "08:52" },
  { wer: "TB", sys: "post", text: ["Neue Anfrage über den Küchenplaner von ", ["b", "Theresa Bachmann"]], zeit: "gestern, 21:14" },
];

export const kennzahlen = [
  { lbl: "Umsatz November", val: "64.380", unit: "€", delta: "+8 %", up: true, ctx: "ggü. 4. Nov. 2025 · Ziel 210 T€", spark: [0, 6, 9, 14, 21, 21, 28, 33, 41, 47, 52, 58, 64], kind: "line" },
  { lbl: "Auftragseingang 2026", val: "2,14", unit: "Mio. €", delta: "+12 %", up: true, ctx: "ggü. Vorjahr, gleicher Stichtag", spark: [142, 310, 541, 739, 983, 1259, 1448, 1569, 1831, 2078, 2142], kind: "line" },
  { lbl: "Offene Angebote", val: "412.900", unit: "€", delta: "3 älter als 14 Tage", warn: true, ctx: "9 Angebote · Ø 45.900 €", spark: [5, 7, 6, 8, 9, 8, 10, 9, 9], kind: "line" },
  { lbl: "Neue Anfragen", val: "11", unit: "diese Woche", delta: "+4", up: true, ctx: "Ø 7 pro Woche · 64 % über Website", spark: [6, 8, 5, 7, 9, 6, 7, 9, 5, 8, 11], kind: "bars" },
];

export const monate = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
export const eingang2026 = [142, 168, 231, 198, 244, 276, 189, 121, 262, 247, 64, null];
export const eingang2025 = [128, 151, 205, 214, 198, 231, 176, 109, 224, 219, 236, 198];

export const pipeline = [
  { k: "Anfrage", n: 15, v: 1470, s: "1,47 Mio. € Budget" },
  { k: "Beratung", n: 12, v: 1120, s: "1,12 Mio. € geschätzt" },
  { k: "Angebot", n: 9, v: 413, s: "412.900 €" },
  { k: "Auftrag", n: 14, v: 1380, s: "1,38 Mio. € laufend" },
  { k: "Lieferung", n: 7, v: 486, s: "486.000 € bis KW 46" },
];

// ---------------------------------------------------------------- Kundenakte
export const kunde = {
  name: "Valerie und Konstantin Haldner",
  kurz: "VH",
  nr: "K-10482",
  seit: "Kundin seit 2021",
  ort: "Pfänderhang 12, 6911 Lochau",
  tel: "+43 5574 48 21 60",
  mail: "v.haldner@example.at",
  karte: "Kundenkarte Gold",
  punkte: "4.860",
  projekt: "Haus am Pfänderhang",
};

export const vorgang = [
  { k: "Anfrage", d: "12. März", x: "über Atelier Rauch", st: "done" },
  { k: "Planung", d: "April – Juni", x: "3 Entwürfe · Rendering v3", st: "done" },
  { k: "Auftrag", d: "9. Juli", x: "AB-0418 · 186.400 €", st: "done" },
  { k: "Lieferung", d: "seit 28. Okt.", x: "nächste: Küche, KW 47", st: "now" },
  { k: "Service", d: "ab Jänner 2027", x: "Pflegevertrag angeboten", st: "next" },
];

export const zeitleiste = [
  { tag: "Heute" },
  { t: "09:12", h: "Lieferavis Küche bestätigt", p: "Teillieferung 3 · bulthaup b3 mit Gaggenau-Geräten, Anlieferung Di 17. Nov., 7:30 Uhr.", wer: "DB", k: true },
  { tag: "Diese Woche" },
  { t: "2. Nov.", h: "Auftragsbestätigung Minotti", p: "Sofa „Connery“, Leder Pelle Soft Tabacco – ab Werk KW 49.", doc: ["AB Minotti 26-11873", "PDF · 2 Seiten"] },
  { tag: "Oktober" },
  { t: "28. Okt.", h: "Teillieferung 2 montiert", p: "Esstisch Eiche geräuchert 320 × 110 und ClassiCon „Bell Table“. Protokoll ohne Mängel unterschrieben.", doc: ["Montageprotokoll MP-2231", "unterschrieben von K. Haldner"], wer: "AG" },
  { tag: "Juni – Juli" },
  { t: "14. Jul.", h: "Anzahlung eingegangen", p: "55.920 € (30 %) per Überweisung." },
  { t: "9. Jul.", h: "Auftrag erteilt", p: "Auftragsbestätigung AB-2026-0418 über 186.400 € gegengezeichnet.", k: true },
  { t: "18. Jun.", h: "Handzeichnungen und Rendering v3 übergeben", p: "Wohnraum, Küche und Esszimmer – Variante „Seeblick“ freigegeben.", bilder: ["wohnraum.jpg", "kueche-eiche.jpg", "esszimmer-see.jpg"], wer: "SF" },
];

export const positionen = [
  { n: "bulthaup b3 · Kochinsel", s: "Eiche geräuchert, Gaggenau-Geräte", v: "98.600 €" },
  { n: "Minotti „Connery“ Sofa", s: "4-Sitzer, Leder Pelle Soft", v: "28.940 €" },
  { n: "Esstisch Platzhirsch Werkstatt", s: "Eiche geräuchert, 320 × 110", v: "14.800 €" },
  { n: "Minotti „Torii“ Sessel × 2", s: "Bouclé Sand", v: "11.480 €" },
  { n: "Agape „Vieques“ Wanne", s: "Cristalplant, freistehend", v: "9.870 €" },
  { n: "ClassiCon „Bell Table“", s: "Messing", v: "3.390 €" },
  { n: "Planung, Lieferung, Montage", s: "pauschal", v: "19.320 €" },
];

// ---------------------------------------------------------------- Kassa
export const kategorien = ["Alle", "Leuchten", "Wohnaccessoires", "Glas & Tisch", "Duft", "Textil", "Pflege", "Gutscheine"];

// img = freigestelltes Herstellerfoto (Kopie, unverändert). Ohne Foto: typografische
// Kachel mit Materialpunkt – die Punktfarbe entspricht dem Material im Text.
export const produkte = [
  { id: "p1", n: "Bellhop Unplugged", t: "Flos · Waldgrün", b: "Flos · Akku-Tischleuchte, Waldgrün", p: 329, img: "p-flos-bellhop.webp", kat: "Leuchten" },
  { id: "p2", n: "Hammershøi Vase", t: "Kähler · 20 cm", b: "Kähler · Steingut weiß, 20 cm", p: 69, img: "p-kaehler-vase.webp", kat: "Wohnaccessoires" },
  { id: "p3", n: "Abd el Kader", t: "Cire Trudon · Duftkerze", b: "Cire Trudon · Duftkerze, 270 g", p: 125, img: "p-trudon-kerze.webp", kat: "Duft" },
  { id: "p4", n: "Melt Portable", t: "Tom Dixon · Silber", b: "Tom Dixon · Silber, kabellos", p: 395, img: "p-tomdixon-melt.webp", kat: "Leuchten" },
  { id: "p5", n: "Bordeaux Glas", t: "Zalto · Denk’Art", b: "Zalto Denk’Art · mundgeblasen", p: 72, img: "p-zalto-bordeaux.webp", kat: "Glas & Tisch" },
  { id: "p6", n: "Plaid Fischgrat", t: "Platzhirsch · Merino", b: "Platzhirsch Edition · Merino, Sand", p: 249, dot: "#cbbfae", kat: "Textil" },
  { id: "p7", n: "Stone Portable", t: "Tom Dixon · Marmor", b: "Tom Dixon · Marmor, Messing", p: 445, img: "p-tomdixon-stone.webp", kat: "Leuchten" },
  { id: "p8", n: "Dekanter Axium", t: "Zalto · 1,3 l", b: "Zalto · mundgeblasen, 1,3 l", p: 159, img: "p-zalto-dekanter.webp", kat: "Glas & Tisch" },
  { id: "p9", n: "Eames House Bird", t: "Vitra · Erle schwarz", b: "Vitra · Erle schwarz", p: 299, dot: "#2a2622", kat: "Wohnaccessoires" },
  { id: "p10", n: "Kissen Leinen", t: "Minotti · 60 × 60", b: "Minotti · 60 × 60, Sabbia", p: 320, dot: "#b7ab98", kat: "Textil" },
  { id: "p11", n: "Lederpflege-Set", t: "Platzhirsch Werkstatt", b: "Platzhirsch Werkstatt · Anilinleder", p: 39, dot: "#8a5d3d", kat: "Pflege" },
  { id: "p12", n: "Geschenkgutschein", t: "Platzhirsch · ab 50 €", b: "Platzhirsch · frei wählbar ab 50 €", p: 500, dot: "#b2965a", kat: "Gutscheine" },
];
