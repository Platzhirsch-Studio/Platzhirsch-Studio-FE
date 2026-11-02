// Stellentexte Deutsch (Inhaber-Auftrag 31.10.2026, 8 Stellen).
// Struktur je Stelle: title, bereich, beschreibung, aufgaben[], profil[].
// Regeln (GlBG § 9, tests/unit/karriere-stellen.test.mjs): Titel mit Paarform
// und „(m/w/d)“, keine Alters-, Herkunfts- oder Geschlechtsangaben, keine
// Superlative, keine Benefits, die der Inhaber nicht bestätigt hat.
// „bieten“ = nur belegbare, neutrale Punkte (Arbeitsort, Marken laut Website,
// Teamaufbau). Weitere Leistungen ergänzt der Inhaber.
// Rein: keine Pakete, keine "@/"-Aliase.

export const BIETEN = [
  "Arbeitsort im Einrichtungsstudio in Lochau, Landstraße 11, am Bodensee",
  "Arbeit mit den internationalen Designmarken unserer Ausstellung",
  "Zusammenarbeit in einem Team aus Interior Design, Planung, Beratung und Montage – Projekte aus einer Hand",
];

export const STELLEN = {
  "cad-planer": {
    title: "CAD-Planer/in (m/w/d)",
    bereich: "Planung",
    beschreibung:
      "Sie setzen Einrichtungs-, Küchen- und Badkonzepte in genaue Pläne um – vom Aufmaß bis zur Werk- und Montageplanung. Dabei arbeiten Sie eng mit Interior Design, Verkauf und Montage zusammen.",
    aufgaben: [
      "Grundrisse, Ansichten und Detailpläne für Küchen, Bäder und Möbel erstellen",
      "Entwürfe aus Handskizze und Modell in CAD-Pläne und 3D-Ansichten übertragen",
      "Aufmaß bei Kundinnen und Kunden vor Ort und Prüfung der Einbausituation",
      "Werk- und Montagepläne für Montage und beteiligte Gewerke ausarbeiten",
      "Abstimmung mit Herstellern, Lieferanten und dem Montageteam",
    ],
    profil: [
      "Abgeschlossene Ausbildung oder abgeschlossenes Studium in Bautechnik, Innenausbau, Tischlerei oder Innenarchitektur bzw. eine vergleichbare Qualifikation",
      "Kenntnisse in Archicad und/oder AutoCAD",
      "Räumliches Vorstellungsvermögen und genaue Arbeitsweise",
      "Verständnis für Materialien, Konstruktionen und Einbausituationen",
      "Freude an der Zusammenarbeit mit Planung, Verkauf und Montage",
    ],
  },
  innenarchitekt: {
    title: "Innenarchitekt/in (m/w/d)",
    bereich: "Interior Design",
    beschreibung:
      "Sie entwickeln mit unseren Kundinnen und Kunden Konzepte für Wohnräume, Küchen und Bäder und begleiten die Projekte von der ersten Idee bis zur Übergabe.",
    aufgaben: [
      "Beratung zu Raum, Material, Licht und Möbeln",
      "Einrichtungskonzepte mit Skizze, Modell und 3D-Visualisierung entwerfen",
      "Möbel, Materialien und Oberflächen aus dem Sortiment unserer Marken auswählen",
      "Präsentationen, Pläne und Angebote gemeinsam mit dem Verkauf erstellen",
      "Koordination mit CAD-Planung, Montage und beteiligten Gewerken",
    ],
    profil: [
      "Abgeschlossenes Studium oder abgeschlossene Ausbildung in Innenarchitektur oder Interior Design bzw. eine vergleichbare Qualifikation",
      "Erfahrung in der Planung von Wohnräumen, Küchen oder Bädern",
      "Gespür für Proportion, Material und Farbe",
      "Sicherer Umgang mit CAD- und Visualisierungsprogrammen",
      "Freude an der Beratung und am Kontakt mit Kundinnen und Kunden",
    ],
  },
  verkaeufer: {
    title: "Verkäufer/in Einrichtungsberatung (m/w/d)",
    bereich: "Verkauf und Beratung",
    beschreibung:
      "Sie beraten Besucherinnen und Besucher in unserer Ausstellung in Lochau und begleiten sie von der ersten Frage bis zum Auftrag.",
    aufgaben: [
      "Empfang und Beratung von Kundinnen und Kunden in der Ausstellung",
      "Möbel, Leuchten und Accessoires unserer Designmarken vorstellen",
      "Angebote und Auftragsbestätigungen erstellen",
      "Abstimmung mit Interior Design, Planung und Montage zu Lieferung und Aufbau",
      "Pflege der Ausstellung und Betreuung von Kundinnen und Kunden nach dem Kauf",
    ],
    profil: [
      "Abgeschlossene kaufmännische Ausbildung oder Erfahrung im Verkauf, gern im Möbel- oder Einrichtungsbereich",
      "Interesse an Design, Materialien und Wohnen",
      "Freundliches Auftreten und Freude am Kundenkontakt",
      "Strukturierte und zuverlässige Arbeitsweise",
      "Sicherer Umgang mit gängigen Office-Programmen",
    ],
  },
  "monteur-tischler": {
    title: "Monteur/in mit Tischlerlehre (m/w/d)",
    bereich: "Montage",
    beschreibung:
      "Sie montieren Küchen, Einbaumöbel und Designmöbel bei unseren Kundinnen und Kunden und sorgen mit Ihrer Tischlerausbildung für eine saubere, passgenaue Ausführung.",
    aufgaben: [
      "Montage von Küchen, Einbau- und Designmöbeln bei Kundinnen und Kunden",
      "Anpassungsarbeiten an Möbeln und Einbauteilen vor Ort",
      "Montage- und Werkpläne lesen und umsetzen",
      "Lieferungen prüfen und die Montage dokumentieren",
      "Abstimmung mit Planung und weiteren Gewerken auf der Baustelle",
    ],
    profil: [
      "Abgeschlossene Lehre als Tischler/in",
      "Erfahrung in der Möbel- oder Küchenmontage",
      "Sorgfältige Arbeitsweise und Verständnis für Werkpläne",
      "Freundlicher Umgang mit Kundinnen und Kunden vor Ort",
      "Teamfähigkeit und Zuverlässigkeit",
      "Führerschein B (Voraussetzung), Führerschein C von Vorteil",
    ],
  },
  monteur: {
    title: "Monteur/in (m/w/d)",
    bereich: "Montage",
    beschreibung:
      "Sie liefern und montieren Möbel, Leuchten und Küchenelemente bei unseren Kundinnen und Kunden und arbeiten dabei im Montageteam.",
    aufgaben: [
      "Lieferung und Aufbau von Möbeln, Leuchten und Küchenelementen",
      "Mitarbeit bei der Montage von Küchen und Einbaumöbeln",
      "Schutz der Räume bei Kundinnen und Kunden und Entsorgung der Verpackung",
      "Ware prüfen und Schäden oder fehlende Teile melden",
      "Zusammenarbeit mit Tischlerinnen und Tischlern, Planung und Verkauf",
    ],
    profil: [
      "Handwerkliches Geschick und Erfahrung in der Montage; eine handwerkliche Ausbildung ist von Vorteil",
      "Sorgfältiger Umgang mit Möbeln und empfindlichen Oberflächen",
      "Freundliches Auftreten bei Kundinnen und Kunden",
      "Teamfähigkeit und Zuverlässigkeit",
      "Führerschein B (Voraussetzung), Führerschein C von Vorteil",
    ],
  },
  fliesenleger: {
    title: "Fliesenleger/in (m/w/d)",
    bereich: "Bad und Wellness",
    beschreibung:
      "Sie verlegen in unserem Montageteam Fliesen und Platten in Bädern, Küchen und Wellnessbereichen, die wir gemeinsam mit unseren Kundinnen und Kunden planen.",
    aufgaben: [
      "Wand- und Bodenfliesen, Platten und Mosaike verlegen",
      "Untergründe vorbereiten, abdichten und verfugen",
      "Verlegepläne in Bad, Küche und Wellnessbereich umsetzen",
      "Abstimmung mit Planung, Installation und Montage auf der Baustelle",
      "Anschlüsse und Details sorgfältig ausführen",
    ],
    profil: [
      "Abgeschlossene Lehre als Platten- und Fliesenleger/in oder eine vergleichbare Qualifikation",
      "Erfahrung im Verlegen von Fliesen und Platten",
      "Genaue Arbeitsweise und Sinn für saubere Details",
      "Teamfähigkeit und Zuverlässigkeit",
    ],
  },
  installateur: {
    title: "Installateur/in Sanitär/Heizung (m/w/d)",
    bereich: "Haustechnik",
    beschreibung:
      "Sie installieren in unserem Montageteam Sanitär- und Heizungstechnik in den Bädern, Küchen und Wellnessbereichen, die wir planen und umsetzen.",
    aufgaben: [
      "Sanitärobjekte, Armaturen und Leitungen installieren",
      "Heizungskomponenten montieren und anschließen",
      "Küchengeräte an Wasser und Abwasser anschließen",
      "Installationspläne in Abstimmung mit Planung und Fliesenlegerinnen und Fliesenlegern umsetzen",
      "Inbetriebnahme, Funktionsprüfung und Dokumentation",
    ],
    profil: [
      "Abgeschlossene Lehre in Installations- und Gebäudetechnik (Sanitär- und Heizungstechnik) oder eine vergleichbare Qualifikation",
      "Erfahrung in der Sanitär- und Heizungsinstallation",
      "Sorgfältige und selbstständige Arbeitsweise",
      "Teamfähigkeit und freundlicher Umgang mit Kundinnen und Kunden",
    ],
  },
  elektroplaner: {
    title: "Elektroplaner/in (m/w/d)",
    bereich: "Planung",
    beschreibung:
      "Sie planen in unserem Planungsteam die Elektro- und Lichtinstallation für Küchen, Bäder und Wohnräume und stimmen sie mit Interior Design und Montage ab.",
    aufgaben: [
      "Elektroinstallationen, Anschlüsse und Lichtlösungen für Küche, Bad und Wohnraum planen",
      "Elektro- und Beleuchtungspläne erstellen",
      "Abstimmung mit Interior Design, CAD-Planung und unserem Montageteam",
      "Geräteanschlüsse und technische Vorgaben der Hersteller prüfen",
      "Die Umsetzung auf der Baustelle begleiten",
    ],
    profil: [
      "Abgeschlossene Ausbildung in Elektrotechnik (z. B. HTL oder Lehre mit Weiterbildung) oder eine vergleichbare Qualifikation",
      "Erfahrung in der Elektroplanung im Wohnbau oder Innenausbau",
      "Kenntnis der einschlägigen Normen und Vorschriften (ÖVE/ÖNORM)",
      "Kenntnisse in Archicad und/oder AutoCAD",
      "Genaue Arbeitsweise und Freude an der Zusammenarbeit im Team",
    ],
  },
};
