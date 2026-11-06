// Entwurf „Lounge“ – Packtisch: zwei fiktive Aufträge (Paket über LetMeShip, Sperrgut über Spedition/Tour).
export const AUFTRAEGE = {
  paket: {
    nr: "A-2611-0213",
    quelle: "Online-Shop · #S-24117",
    kunde: "Johanna Reiter",
    adresse: ["Johanna Reiter", "Kirchstraße 12", "6900 Bregenz", "Österreich"],
    versand: "LetMeShip · DPD Home",
    versandKurz: "DPD Home",
    bezahlt: "bezahlt · Kreditkarte",
    hinweise: [
      { ton: "eiche", icon: "Wine", text: "Glas und Keramik: einzeln in Seidenpapier, Polster rundum, Aufkleber „Zerbrechlich“." },
      { ton: "cognac", icon: "Gift", text: "Geschenk – Rechnung nicht beilegen, Grußkarte „Alles Gute, Mama!“" },
    ],
    positionen: [
      { id: 1, name: "Bell Portable", marke: "Tom Dixon", ean: "5056394707181", bild: "p-bell-leuchte.webp", soll: 1, ist: 1 },
      { id: 2, name: "Altaïr Duftkerze 270 g", marke: "Trudon", ean: "3700773700159", bild: "p-trudon-kerze.webp", soll: 2, ist: 2 },
      { id: 3, name: "Curve Kerzenhalter", marke: "Lyngby", ean: "5711507216039", bild: "p-lyngby-halter.webp", soll: 2, ist: 2 },
      { id: 4, name: "Astro Löwe", marke: "Kähler", ean: "5703779186552", bild: "p-kaehler-loewe.webp", soll: 1, ist: 1 },
      { id: 5, name: "Bordeaux Glas", marke: "Zalto", ean: "9008564001019", bild: "p-zalto-bordeaux.webp", soll: 6, ist: 4, aktiv: true },
      { id: 6, name: "Plaid Alpaka, Sand", marke: "Weberei Saurer", ean: null, bild: null, soll: 1, ist: 0, manuell: true },
    ],
    pakete: [
      { nr: 1, art: "Karton L", mass: "60 × 40 × 40 cm", gewicht: "6,8", erwartet: "6,3 – 7,1 kg", ok: true, inhalt: "11 Artikel", status: "In Arbeit" },
    ],
    packmittel: ["Karton M", "Karton L", "Versandtüte"],
    packmittelWahl: "Karton L",
  },
  sperrgut: {
    nr: "A-2611-0198",
    quelle: "Projekt PH-0418 · Kommission",
    kunde: "Familie Brändle",
    adresse: ["Familie Brändle", "Seestraße 4", "6911 Lochau", "Österreich"],
    versand: "Eigene Tour 3 · Do, 12. Nov",
    versandKurz: "Tour 3",
    bezahlt: "Anzahlung 40 % · Rest bei Lieferung",
    hinweise: [
      { ton: "see", icon: "Truck", text: "Zufahrt über die Seestraße, Lift vorhanden. Montage durch Team Gmeiner direkt nach Anlieferung." },
    ],
    positionen: [
      { id: 11, name: "Outdoor-Lounge, Sofa 3-Sitzer", marke: "Kommission PH-0418", ean: "PH-K-0418-01", bild: "r-terrasse-see.jpg", soll: 1, ist: 1 },
      { id: 12, name: "Outdoor-Lounge, Sessel", marke: "Kommission PH-0418", ean: "PH-K-0418-02", bild: "r-garten-lounge.jpg", soll: 2, ist: 2 },
      { id: 13, name: "Esstisch Eiche, 300 cm", marke: "Tischlerei · Maßanfertigung", ean: null, bild: "r-essen-licht.jpg", soll: 1, ist: 0, manuell: true, aktiv: true },
      { id: 14, name: "Stone Portable", marke: "Tom Dixon", ean: "5056394700885", bild: "p-stone-leuchte.webp", soll: 2, ist: 0 },
    ],
    pakete: [
      { nr: 1, art: "Palette 120 × 80", mass: "120 × 80 × 95 cm", gewicht: "84", erwartet: "78 – 92 kg", ok: true, inhalt: "Sofa, 2 Sessel", status: "Fertig" },
      { nr: 2, art: "Sperrgut", mass: "310 × 110 × 18 cm", gewicht: "", erwartet: "ca. 96 kg", ok: false, inhalt: "Tischplatte + Gestell", status: "In Arbeit" },
    ],
    packmittel: ["Palette", "Sperrgut", "Karton L"],
    packmittelWahl: "Sperrgut",
  },
};
