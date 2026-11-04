// src/lib/shop/gewaehrleistung.js
// Harmonisierte Mitteilung zum gesetzlichen Gewährleistungsrecht
// (§ 4 Abs 1 Z 12 FAGG idF BGBl. I Nr. 59/2026, Anhang II; Art. 22a RL 2011/83/EU
// idF RL (EU) 2024/825). Sie ist „in hervorgehobener Weise“ vor der Bestellung
// zu zeigen – im Warenkorb unmittelbar über dem Bestellknopf (ShopCart), in den
// Shop-AGB (Punkt 10) und in der Vertragsbestätigung (orderMail.js).
//
// Eigenbau 03.11.2026: Das amtliche Muster liegt im RIS nur als Grafik/PDF vor
// und wird NICHT eingebunden oder kopiert; der Block hier gibt die Pflicht-
// inhalte nach Art. 22a Abs 1 der Richtlinie als Text wieder (Hinweis auf das
// gesetzliche Gewährleistungsrecht, Mindestdauer zwei Jahre ab Übergabe,
// Abhilfen, Unabhängigkeit von Herstellergarantien, kostenlos). Wortlaut-
// Abgleich mit dem amtlichen Muster: Kanzlei (Inhaber-Checkliste
// SHOP-LIVE-2026-11-03.md). Rein, ohne "@/"-Importe (node --test).

export const GEWAEHRLEISTUNG_ID = "gewaehrleistung-mitteilung";
export const GEWAEHRLEISTUNG_TITEL = "Gesetzliche Gewährleistung";
export const GEWAEHRLEISTUNG_STAND = "2026-11-03";

/** Pflichtinhalte als Absätze (Deutsch ist verbindlich; EN/FR/IT zeigen denselben Text mit Hinweis). */
export const GEWAEHRLEISTUNG_ABSAETZE = Object.freeze([
  "Für alle Waren gilt das gesetzliche Gewährleistungsrecht: Der Verkäufer haftet für Mängel, die bei der Übergabe vorliegen, mindestens zwei Jahre ab Übergabe der Ware.",
  "Ist eine Ware mangelhaft, haben Sie Anspruch auf kostenlose Verbesserung (Reparatur) oder Austausch. Unter den gesetzlichen Voraussetzungen können Sie stattdessen eine Preisminderung oder die Auflösung des Vertrags verlangen.",
  "Dieses Recht gilt gegenüber dem Verkäufer, kostet nichts und besteht unabhängig von einer Herstellergarantie; eine Garantie schränkt es nicht ein.",
]);

/** Kurzform für Kopfzeilen und Zusammenfassungen. */
export const GEWAEHRLEISTUNG_KURZ = "Mindestens zwei Jahre gesetzliche Gewährleistung ab Übergabe – kostenlose Verbesserung oder Austausch, unter den gesetzlichen Voraussetzungen Preisminderung oder Vertragsauflösung.";

/** Blocks im Format von legalTexte.js (Überschrift + Absätze). */
export const GEWAEHRLEISTUNG_BLOCKS = Object.freeze([{ h: GEWAEHRLEISTUNG_TITEL }, ...GEWAEHRLEISTUNG_ABSAETZE]);

/** Klartext (Mail). */
export const gewaehrleistungText = () => [GEWAEHRLEISTUNG_TITEL.toUpperCase(), "", ...GEWAEHRLEISTUNG_ABSAETZE].join("\n");
