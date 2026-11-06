// Kassa – Kundendisplay: Ruhebilder und Musternachrichten für die Abnahme (Team B-KAS, Lounge §10).
// Bilder: Raumaufnahmen aus public/entwurf/lounge (Kopien aus public/Images, unverändert). Musterwerte sind
// Beispiele, keine Geschäftszahlen. Reines Modul.

import { bereinige } from "../kanal/protokoll.js";

export const DISPLAY_BILDER = Object.freeze(["/entwurf/lounge/r-wohnen-sofa.jpg", "/entwurf/lounge/r-kueche-eiche.jpg", "/entwurf/lounge/r-terrasse-see.jpg"]);

const POS = [
  { titel: "Stone Portable", unter: "Tom Dixon", menge: 1, einzel_cent: 39500, betrag_cent: 39500, bild: "/entwurf/lounge/p-stone-leuchte.webp" },
  { titel: "Altaïr Duftkerze", unter: "Trudon", menge: 2, einzel_cent: 12500, betrag_cent: 25000, bild: "/entwurf/lounge/p-trudon-kerze.webp" },
  { titel: "Bordeaux Glas", unter: "Zalto", menge: 6, einzel_cent: 6900, betrag_cent: 41400, bild: "/entwurf/lounge/p-zalto-bordeaux.webp" },
  { titel: "Astro Löwe", unter: "Kähler", menge: 1, einzel_cent: 5900, betrag_cent: 5900, bild: "/entwurf/lounge/p-kaehler-loewe.webp" },
  { titel: "Curve Kerzenhalter", unter: "Lyngby", menge: 2, einzel_cent: 4900, betrag_cent: 9800, bild: "/entwurf/lounge/p-lyngby-halter.webp", neu: true },
];
const KK = { stufe: "Platzhirsch Plus", vorteile: [{ titel: "Lieferung frei", eingeloest: true }, { titel: "Pflege-Service", eingeloest: false }] };
const ZWISCHEN = POS.reduce((a, p) => a + p.betrag_cent, 0);
const GUTSCHEIN = 5000;
const GESAMT = ZWISCHEN - GUTSCHEIN;
const UST = Math.round(GESAMT - (GESAMT * 10000) / 12000);

/** Musternachrichten je Zustand (für ?vorschau=…). */
export const DISPLAY_VORSCHAU = Object.freeze({
  ruhe: () => bereinige({ zustand: "ruhe", positionen: [] }, { seq: 1 }),
  einkauf: () => bereinige({ zustand: "einkauf", positionen: POS, anzahl: POS.length, zwischensumme_cent: ZWISCHEN, gutschein_cent: GUTSCHEIN, ust_cent: UST, gesamt_cent: GESAMT, kundenkarte: KK }, { seq: 1 }),
  bezahlen: (bar) => bereinige({ zustand: "bezahlen", positionen: [], gesamt_cent: GESAMT, zahlart: bar ? "bar" : "karte", gegeben_cent: bar ? 120000 : null, rueckgeld_cent: bar ? 120000 - GESAMT : null }, { seq: 1 }),
  danke: (bar) => bereinige({ zustand: "danke", positionen: [], gesamt_cent: GESAMT, zahlart: bar ? "bar" : "karte", rueckgeld_cent: bar ? 120000 - GESAMT : null, kundenkarte: { stufe: KK.stufe, vorteile: [KK.vorteile[0]] }, qr: "beleg:KASSE-LOCHAU-01-000001" }, { seq: 1 }),
});
