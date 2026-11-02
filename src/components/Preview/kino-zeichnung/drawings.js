// Kino-Lab 3 „Die Zeichnung wird lebendig“ – Linienzeichnungen.
//
// WICHTIG: Diese Zeichnungen sind ANIMATION/ILLUSTRATION (von Hand im Code
// gesetzte SVG-Pfade), NICHT Harald Menghins Originalskizzen. Die Seite
// kennzeichnet sie mit „Animation“.
//
// Koordinaten: jede Szene hat ein viewBox, das dem Seitenverhältnis ihres
// Bildes entspricht (Wohnen = aboutHome.jpg 2048×1228 → 1600×960, Küche =
// Bora 960×540, Bad = Agape 1173×1600, Café = Nachtmann 1600×1296). So liegt
// die Linie beim Überblenden ungefähr auf dem Foto.
//
// Strich-Felder:  d = SVG-Pfad · w = Strichgewicht (1 = normal)
//                 g = true → Konstruktionslinie (dünn, schneller, ohne Glut)
// Reihenfolge = Zeichenreihenfolge.
//
// ── Schnittstelle für echte Scans von Harald ─────────────────────────────
// Scan (Papier) → Vektor (z. B. potrace/Illustrator „Bildnachzeichner“,
// nur Konturlinien, keine Flächen) → die `d`-Attribute der <path>-Elemente
// in SCANS[<szene>].strokes eintragen, viewBox des Scans dazu. Ist ein Scan
// gesetzt, nimmt die Seite ihn statt der Animation und ändert den Vermerk
// auf `quelle` (z. B. „Skizze: Harald Menghin“). Hinweis: Das Überblenden
// auf das Foto passt nur, wenn der Scan dieselbe Perspektive zeigt; sonst
// `fit: "contain"` lassen – die Zeichnung steht dann für sich.

/** @typedef {{ d: string, w?: number, g?: boolean }} Strich */
/** @typedef {{ viewBox: [number, number], strokes: Strich[], licht: [number, number], quelle?: string, animation: boolean }} Zeichnung */

const WOHNEN = {
  viewBox: [1600, 960],
  licht: [900, 380], // Fenster zum See: von hier flutet das Licht
  strokes: [
    // Konstruktion: Horizont + Fluchtstrahlen (Fluchtpunkt 1000/440)
    { d: "M 0 440 L 1600 440", g: true },
    { d: "M 1000 440 L 170 0", g: true },
    { d: "M 1000 440 L 0 797", g: true },
    { d: "M 1000 440 L 1371 0", g: true },
    { d: "M 1000 440 L 1600 920", g: true },
    // Raum: Rückwand, Decke, Boden
    { d: "M 664 262 L 1150 262 L 1150 560 L 664 560 Z", w: 1.15 },
    { d: "M 664 262 L 170 0", w: 1.1 },
    { d: "M 664 560 L 0 797", w: 1.1 },
    { d: "M 1150 262 L 1371 0", w: 1.1 },
    { d: "M 1150 560 L 1600 920", w: 1.1 },
    // Fensterfront links (Pfosten in Perspektive)
    { d: "M 563 209 L 563 596", w: 0.8 },
    { d: "M 446 146 L 446 638", w: 0.8 },
    { d: "M 294 66 L 294 692", w: 0.8 },
    { d: "M 177 4 L 177 734", w: 0.8 },
    { d: "M 664 300 L 177 50", w: 0.55 },
    // Fenster in der Rückwand mit Seeblick: Rahmen, Horizont, Berge, Wellen
    { d: "M 712 296 L 1104 296 L 1104 476 L 712 476 Z", w: 0.95 },
    { d: "M 908 296 L 908 476", w: 0.6 },
    { d: "M 712 412 L 1104 412", w: 0.7 },
    { d: "M 712 392 C 760 360 790 352 826 372 C 862 340 900 330 948 366 C 990 346 1030 344 1104 384", w: 0.75 },
    { d: "M 742 436 l 34 0 M 818 450 l 46 0 M 930 432 l 40 0 M 1010 452 l 52 0", w: 0.5 },
    // Deckenschiene mit Spots
    { d: "M 320 52 L 640 214", w: 0.6 },
    { d: "M 400 92 l 0 26 M 480 133 l 0 24 M 560 173 l 0 22", w: 0.9 },
    { d: "M 1250 120 L 1120 230", w: 0.6 },
    // Teppich
    { d: "M 200 960 L 380 700 L 1240 690 L 1500 960", w: 0.55 },
    // Sofa: Rücken, Sitz, Sockel, Armlehne
    { d: "M 560 452 L 960 446", w: 1.2 },
    { d: "M 620 452 q 40 -30 90 -6 M 740 450 q 45 -28 95 -4 M 860 448 q 40 -24 85 -4", w: 0.8 },
    { d: "M 560 500 L 960 494", w: 0.9 },
    { d: "M 520 540 L 975 532", w: 1.1 },
    { d: "M 520 590 L 975 580", w: 1.15 },
    { d: "M 960 446 L 985 470 L 985 580 M 975 532 L 985 532", w: 1 },
    // Sofa: Récamiere nach vorn
    { d: "M 560 452 L 300 585 L 300 690", w: 1.2 },
    { d: "M 330 640 L 640 600 L 640 540", w: 1 },
    { d: "M 300 690 L 645 650 L 645 590", w: 1.1 },
    // Couchtisch
    { d: "M 700 600 L 930 594 L 960 620 L 690 628 Z", w: 0.95 },
    { d: "M 706 628 L 706 668 M 948 620 L 948 660", w: 0.7 },
    // Stehleuchte
    { d: "M 1010 568 L 1070 568", w: 1 },
    { d: "M 1040 568 L 1040 300", w: 1.05 },
    { d: "M 1005 300 L 1075 300 L 1062 250 L 1018 250 Z", w: 1.1 },
    { d: "M 1040 300 L 1000 352 M 1040 300 L 1084 350", g: true },
    // Kamin in der rechten Wand
    { d: "M 1172 428 L 1430 426 L 1430 558 L 1172 470 Z", w: 1 },
    // Sessel im Vordergrund
    { d: "M 490 960 C 480 760 520 680 630 668 C 740 668 790 760 780 960", w: 1.25 },
    { d: "M 520 760 C 560 720 700 720 750 760", w: 0.8 },
    { d: "M 930 960 C 920 760 960 680 1070 668 C 1180 668 1230 760 1220 960", w: 1.25 },
    { d: "M 960 760 C 1000 720 1140 720 1190 760", w: 0.8 },
    // Pflanze links
    { d: "M 60 760 L 240 760 L 220 900 L 80 900 Z", w: 0.9 },
    { d: "M 120 760 Q 60 640 150 560 M 150 760 Q 200 620 300 600 M 100 760 Q 0 700 20 620", w: 0.8 },
  ],
};

const KUECHE = {
  viewBox: [960, 540],
  licht: [120, 120],
  strokes: [
    { d: "M 600 0 L 960 320", g: true },
    // Fenster
    { d: "M 105 0 L 105 250 M 205 0 L 205 222 M 300 0 L 300 200", w: 0.6 },
    { d: "M 0 100 L 300 80", w: 0.5 },
    { d: "M 0 290 L 118 262", w: 0.6 },
    // Stühle hinter der Insel
    { d: "M 140 125 C 150 95 200 90 270 100 M 335 70 C 345 50 400 45 450 55 M 498 25 C 510 12 560 10 600 18", w: 0.8 },
    // Kochinsel: Platte, Kanten, Bogen im Sockel
    { d: "M 118 160 L 905 8", w: 1.15 },
    { d: "M 118 160 L 935 492", w: 1.2 },
    { d: "M 118 160 L 118 505 L 180 520", w: 1.1 },
    { d: "M 175 515 C 210 400 280 330 420 345 C 520 360 600 470 700 540", w: 0.9 },
    // Kochfeld
    { d: "M 338 245 L 545 198 L 715 270 L 500 330 Z", w: 1 },
    // Topf mit Dampf
    { d: "M 455 170 a 55 18 0 1 0 110 0 a 55 18 0 1 0 -110 0", w: 0.95 },
    { d: "M 458 172 L 462 225 Q 510 240 558 225 L 562 172", w: 0.95 },
    { d: "M 520 185 C 512 212 532 226 518 250", g: true },
    // Pfanne
    { d: "M 500 290 a 55 22 0 1 0 110 0 a 55 22 0 1 0 -110 0 M 562 312 L 580 340", w: 0.9 },
    // Brett, Zitronen, Vase
    { d: "M 230 180 L 330 170 L 365 190 L 262 210 Z", w: 0.7 },
    { d: "M 300 172 a 10 10 0 1 0 20 0 a 10 10 0 1 0 -20 0 M 318 168 a 9 9 0 1 0 18 0 a 9 9 0 1 0 -18 0", w: 0.6 },
    { d: "M 755 60 L 755 145 Q 770 155 788 145 L 788 60", w: 0.8 },
  ],
};

const BAD = {
  viewBox: [1173, 1600],
  licht: [160, 820],
  strokes: [
    { d: "M 0 1110 L 180 1100 M 1000 1100 L 1173 1110", g: true },
    { d: "M 0 900 L 420 1010", g: true },
    // Wanne: Rand, Öffnung, Band, Körper
    { d: "M 230 790 L 950 790 Q 1000 790 1000 830 Q 1000 870 950 870 L 230 870 Q 180 870 180 830 Q 180 790 230 790 Z", w: 1.2 },
    { d: "M 222 796 Q 600 778 978 796", w: 0.8 },
    { d: "M 180 860 L 200 905 L 998 905 L 1000 860", w: 0.9 },
    { d: "M 200 905 L 200 1080 Q 205 1112 250 1112 L 950 1112 Q 995 1112 998 1080 L 998 905", w: 1.2 },
    // Armatur
    { d: "M 585 790 L 585 722 Q 585 706 600 706", w: 1 },
    // Spiegelung am Boden
    { d: "M 260 1190 Q 600 1210 940 1190", w: 0.5 },
  ],
};

const CAFE = {
  viewBox: [1600, 1296],
  licht: [1300, 300],
  strokes: [
    // Theke
    { d: "M 0 965 L 1600 965", w: 1.1 },
    { d: "M 0 1170 L 1600 1170", g: true },
    // Espressomaschine
    { d: "M 310 950 L 310 300 Q 310 280 330 280 L 1030 280 Q 1045 280 1045 300 L 1045 950", w: 1.15 },
    { d: "M 330 280 L 330 250 L 1020 250 L 1020 280", w: 0.7 },
    { d: "M 460 465 a 60 60 0 1 0 120 0 a 60 60 0 1 0 -120 0 M 765 465 a 60 60 0 1 0 120 0 a 60 60 0 1 0 -120 0", w: 0.95 },
    { d: "M 640 520 L 720 520 L 720 600 L 640 600 Z M 590 640 L 770 640", w: 0.9 },
    { d: "M 420 470 L 420 690 M 935 470 L 935 680", w: 0.8 },
    { d: "M 425 730 L 585 730 L 585 770 L 425 770 Z", w: 0.6 },
    // Kaffeesack
    { d: "M 1058 485 L 1355 485 L 1355 955 L 1058 955", w: 0.8 },
    { d: "M 1185 410 L 1230 410 L 1225 530 L 1190 530 Z", w: 0.6 },
    // Gläser mit Espresso
    { d: "M 635 760 L 650 1000 Q 772 1035 895 1000 L 910 760", w: 1.2 },
    { d: "M 635 760 Q 772 790 910 760", w: 1 },
    { d: "M 655 870 Q 772 900 890 870 M 652 920 Q 772 945 893 920", w: 0.7 },
    { d: "M 930 735 L 945 985 Q 1065 1025 1185 985 L 1200 735", w: 1.2 },
    { d: "M 930 735 Q 1065 765 1200 735", w: 1 },
    { d: "M 980 770 L 990 960 M 1065 775 L 1065 975 M 1150 770 L 1140 960", g: true },
    // Dampf
    { d: "M 772 740 C 750 700 800 680 780 640", g: true },
    // Bohnen
    { d: "M 130 1080 Q 260 860 420 900 Q 560 920 660 1060", w: 0.8 },
    { d: "M 520 1080 q 15 -10 30 0 q -15 10 -30 0 M 880 1055 q 15 -10 30 0 q -15 10 -30 0 M 1000 1060 q 15 -10 30 0 q -15 10 -30 0", w: 0.6 },
  ],
};

const ANIMATION = { wohnen: WOHNEN, kueche: KUECHE, bad: BAD, cafe: CAFE };

/**
 * Echte Scans von Harald Menghin (leer, bis Scans freigegeben sind).
 * Beispiel:
 *   wohnen: { viewBox: [2400, 1600], licht: [1200, 500],
 *             quelle: "Skizze: Harald Menghin", strokes: [{ d: "M …" }, …] }
 * @type {Record<string, Omit<Zeichnung, "animation">>}
 */
export const SCANS = {};

/**
 * Zeichnung einer Szene: Scan, falls vorhanden, sonst die Animation.
 * @param {"wohnen"|"kueche"|"bad"|"cafe"} id
 * @returns {Zeichnung}
 */
export function zeichnungFuer(id) {
  const scan = SCANS[id];
  if (scan?.strokes?.length) return { ...scan, animation: false, quelle: scan.quelle || "Skizze: Harald Menghin" };
  return { ...ANIMATION[id], animation: true };
}
