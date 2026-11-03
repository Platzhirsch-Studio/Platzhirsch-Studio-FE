// src/lib/shop/ust.js
// Umsatzsteuer des Accessoire-Shops – EINZIGE Quelle für Steuersätze,
// Steuerland und die Aufteilung der enthaltenen USt (Warenkorb, Mini-
// Warenkorb, Bestellbestätigung, Stripe-Zeilen, Versand). Rein, ohne
// "@/"-Importe und ohne Node-APIs (läuft auch im Browser und unter node --test).
//
// STATUS: Entwurf, Stand 31.10.2026, Steuerberater-Durchsicht
// empfohlen. Der Freigabepunkt release.js "ust" bleibt offen, bis der
// Steuerberater die Regeln schriftlich bestätigt hat.
//
// Regeln (mit Quelle):
//   1. Preise sind Bruttopreise (inkl. USt). Die enthaltene USt wird aus dem
//      Bruttobetrag herausgerechnet: USt = Brutto − Brutto / (1 + Satz).
//      § 4 Abs 1 und § 10 UStG 1994 (Bemessungsgrundlage = Entgelt ohne USt),
//      https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10004873
//      PrAG § 9 Abs 1 / PAngV § 3: Endpreise inkl. USt angeben.
//   2. Normalsatz AT 20 %: § 10 Abs 1 UStG 1994 (RIS-Link oben).
//   3. Ermäßigter Satz AT 10 % für Bücher/Druckerzeugnisse (Assouline-
//      Bildbände, Kategorie "bildband"): § 10 Abs 2 Z 1 lit a UStG 1994 iVm
//      Anlage 1 Z 33 (Bücher, Broschüren, Zeitungen u. ä. Erzeugnisse des
//      grafischen Gewerbes, Pos. 4901 KN), RIS-Link oben;
//      Übersicht WKO: https://www.wko.at/steuern/umsatzsteuersaetze
//      NICHT ermäßigt: Assouline-Kerzen, -Accessoires (Kategorie zählt, nicht Marke).
//   4. Versandkosten sind eine unselbständige Nebenleistung und teilen das
//      Schicksal der Hauptleistung (EuGH 25.2.1999, C-349/96 „CPP“,
//      https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:61996CJ0349 ;
//      UStR 2000 Rz 347 ff, https://findok.bmf.gv.at). Gewählte Regel:
//        - ein Steuersatz im Warenkorb → Versand voll mit diesem Satz,
//        - gemischter Warenkorb (20 % + 10 %) → Versand im Verhältnis der
//          Bruttowarenwerte je Satz aufgeteilt (Cent genau, Rest auf den
//          größten Anteil). Das ist die in der Praxis anerkannte Aufteilung
//          nach Entgelten; Steuerberater bestätigt.
//      Der Bruttoversandpreis für den Kunden ändert sich dadurch NICHT, nur
//      die darin enthaltene USt.
//   5. Lieferort Abholung im Showroom Lochau: Österreich (§ 3 Abs 7 UStG 1994,
//      Ort der Lieferung = wo die Ware sich bei Verschaffung der Verfügungsmacht
//      befindet) → immer AT-Sätze, auch für Kunden aus DE oder CH.
//   6. Versand nach DE (innergemeinschaftlicher Fernverkauf an Private):
//      Bis zur EU-weiten Schwelle von 10.000 € netto (Summe aller Fernverkäufe
//      in andere EU-Staaten im laufenden UND im vorangegangenen Kalenderjahr)
//      bleibt der Lieferort Österreich → AT-USt.
//      Art. 59c MwStSystRL 2006/112/EG, https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:02006L0112-20250101
//      Art. 3 Abs 3 und 5 Binnenmarktregelung (Anhang zum UStG 1994), RIS-Link oben;
//      WKO „Fernverkauf / One-Stop-Shop“: https://www.wko.at/steuern/one-stop-shop-ab-1-7-2021
//      Wird die Schwelle überschritten (oder freiwillig optiert), gilt die
//      USt des Bestimmungslands und die Erklärung läuft über den OSS
//      (§ 25a Binnenmarktregelung). Dafür der Schalter OSS_AKTIV = true →
//      DE 19 % / 7 % für Bücher (§ 12 Abs 1 und Abs 2 Nr. 1 iVm Anlage 2
//      Nr. 49 UStG-DE, https://www.gesetze-im-internet.de/ustg_1980/__12.html).
//      Bruttopreise bleiben dabei gleich (ein Preis für alle Länder), die
//      enthaltene USt ändert sich.
//   7. CH: kein Versand (nur Abholung → Regel 5). Für eine Lieferung in die
//      Schweiz liefert steuerLand() null; der Shop sperrt sie bereits in
//      shipping/config.js (LAENDER.CH.versand = false).

/**
 * Schalter OSS (Inhaber + Steuerberater). false = Lieferschwelle von
 * 10.000 € netto EU-weit nicht überschritten und keine Option → AT-USt
 * auch bei Versand nach DE. Erst auf true setzen, wenn die OSS-Registrierung
 * beim Finanzamt (FinanzOnline) vorliegt.
 */
export const OSS_AKTIV = false;

/** Status der Regeln (wie Rechtstext-Slots: nie "freigegeben" ohne Beleg des Steuerberaters). */
export const UST_REGELN = Object.freeze({
  status: "entwurf",
  hinweis: "Entwurf, Stand 31.10.2026 – Prüfung durch Kanzlei/Steuerberater offen",
  stand: "2026-10-31",
});

/**
 * PLATZHALTER – vom Inhaber/Steuerberater auszufüllen (null = unbekannt):
 * Netto-Fernverkäufe an Private in andere EU-Staaten (ALLE Waren, auch
 * Möbel), in Cent. Grundlage für die Entscheidung über OSS_AKTIV.
 */
export const FERNVERKAEUFE_EU_NETTO_CENT = Object.freeze({ vorjahr2025: null, laufend2026: null });
/** PLATZHALTER: OSS-Registrierung (FinanzOnline) – Datum/Beleg, solange null bleibt OSS_AKTIV false. */
export const OSS_REGISTRIERUNG = null;

/** EU-weite Fernverkaufs-Schwelle in Cent (netto), Art. 59c Abs 1 lit b MwStSystRL. */
export const FERNVERKAUF_SCHWELLE_CENT = 1_000_000;

/** Steuersätze in Prozent je Steuerland und Klasse. */
export const UST_SAETZE = Object.freeze({
  AT: Object.freeze({ normal: 20, ermaessigt: 10 }),
  DE: Object.freeze({ normal: 19, ermaessigt: 7 }),
});
export const UST_NORMALSATZ_AT = UST_SAETZE.AT.normal;

/** Katalog-Kategorien mit ermäßigtem Satz (Bücher/Druckerzeugnisse, Regel 3). */
export const ERMAESSIGT_KATEGORIEN = Object.freeze(["bildband"]);

/** "normal" | "ermaessigt" je Katalog-Kategorie. */
export const ustKlasse = (kategorie) => (ERMAESSIGT_KATEGORIEN.includes(kategorie) ? "ermaessigt" : "normal");

/**
 * Steuerland einer Lieferung (Regeln 5–7).
 * @param {{ lieferart?: "versand"|"abholung", land?: string|null, ossAktiv?: boolean }} o
 * @returns {"AT"|"DE"|null} null = Lieferung nicht unterstützt (CH-Versand, unbekanntes Land)
 */
export function steuerLand({ lieferart = "abholung", land = null, ossAktiv = OSS_AKTIV } = {}) {
  if (lieferart !== "versand") return "AT";
  if (land === "AT") return "AT";
  if (land === "DE") return ossAktiv ? "DE" : "AT";
  return null;
}

/** Satz in Prozent für eine Klasse/Kategorie im Steuerland (Standard AT). */
export function ustSatz({ klasse, kategorie, steuerland = "AT" } = {}) {
  const k = klasse || ustKlasse(kategorie);
  const s = UST_SAETZE[steuerland];
  if (!s || !(k in s)) throw new Error(`ust: unbekanntes Steuerland/Klasse ${steuerland}/${k}`);
  return s[k];
}

/**
 * Satz für die Anzeige „inkl. X % USt.“, solange das Lieferziel noch offen
 * ist (Mini-Warenkorb, Artikelliste): bei OSS_AKTIV hängt der Satz vom
 * Lieferland ab → null (Anzeige dann nur „inkl. USt.“).
 */
export function anzeigeSatz({ klasse, kategorie, steuerland = null, ossAktiv = OSS_AKTIV } = {}) {
  if (!steuerland && ossAktiv) return null;
  return ustSatz({ klasse, kategorie, steuerland: steuerland || "AT" });
}

/** Enthaltene USt aus einem Bruttobetrag (Cent, kaufmännisch gerundet). */
export const ustAusBrutto = (bruttoCent, satz) => bruttoCent - Math.round(bruttoCent / (1 + satz / 100));

/** Betrag `gesamt` im Verhältnis `gewichte` aufteilen (Cent genau, Rest an den größten Anteil). */
export function anteilig(gesamt, gewichte) {
  const summe = gewichte.reduce((s, g) => s + g, 0);
  if (!(summe > 0) || !gesamt) return gewichte.map((_, i) => (i === 0 ? gesamt || 0 : 0));
  const teile = gewichte.map((g) => Math.floor((gesamt * g) / summe));
  let rest = gesamt - teile.reduce((s, t) => s + t, 0);
  const order = gewichte.map((g, i) => [(gesamt * g) / summe - teile[i], i]).sort((a, b) => b[0] - a[0] || gewichte[b[1]] - gewichte[a[1]]);
  for (let j = 0; rest > 0; j = (j + 1) % order.length, rest--) teile[order[j][1]] += 1;
  return teile;
}

/**
 * Aufteilung der enthaltenen USt einer Bestellung.
 * @param {{ zeilen: Array<{ summeCent: number, kategorie?: string, ustKlasse?: string }>, versandCent?: number, lieferart?: string, land?: string|null, ossAktiv?: boolean }} o
 * @returns {{ steuerland: "AT"|"DE"|null, posten: Array<{ satz: number, bruttoCent: number, warenCent: number, versandCent: number, ustCent: number, nettoCent: number }>, ustCent: number, zeilenSaetze: number[] }}
 *   posten absteigend nach Satz; steuerland null → keine Aufteilung (Lieferung nicht unterstützt).
 */
export function ustAufteilung({ zeilen = [], versandCent = 0, lieferart = "abholung", land = null, ossAktiv = OSS_AKTIV } = {}) {
  const steuerland = steuerLand({ lieferart, land, ossAktiv });
  if (!steuerland) return { steuerland: null, posten: [], ustCent: 0, zeilenSaetze: zeilen.map(() => null) };
  const zeilenSaetze = zeilen.map((z) => ustSatz({ klasse: z.ustKlasse, kategorie: z.kategorie, steuerland }));
  const proSatz = new Map();
  zeilen.forEach((z, i) => proSatz.set(zeilenSaetze[i], (proSatz.get(zeilenSaetze[i]) || 0) + (z.summeCent || 0)));
  // Leerer Warenkorb mit Versand (sollte nicht vorkommen): Versand zum Normalsatz.
  if (!proSatz.size && versandCent) proSatz.set(UST_SAETZE[steuerland].normal, 0);
  const saetze = [...proSatz.keys()].sort((a, b) => b - a);
  const waren = saetze.map((s) => proSatz.get(s));
  // Regel 4: Versand folgt der Ware; gemischt → im Verhältnis der Warenwerte.
  const versand = anteilig(versandCent || 0, waren.every((w) => w === 0) ? waren.map((_, i) => (i === 0 ? 1 : 0)) : waren);
  const posten = saetze.map((satz, i) => {
    const bruttoCent = waren[i] + versand[i];
    const ustCent = ustAusBrutto(bruttoCent, satz);
    return { satz, bruttoCent, warenCent: waren[i], versandCent: versand[i], ustCent, nettoCent: bruttoCent - ustCent };
  });
  return { steuerland, posten, ustCent: posten.reduce((s, p) => s + p.ustCent, 0), zeilenSaetze };
}

/**
 * Hilfe für den Schalter OSS_AKTIV (Regel 6): Ist die EU-weite Schwelle
 * erreicht? Beträge = Netto-Fernverkäufe in andere EU-Staaten (alle Waren,
 * auch Möbel-Lieferungen, nicht nur der Shop). Ab dem Umsatz, mit dem die
 * Schwelle im laufenden Jahr überschritten wird, gilt das Bestimmungsland.
 */
export const fernverkaufSchwelleErreicht = ({ vorjahrNettoCent = 0, laufendNettoCent = 0 } = {}) => vorjahrNettoCent > FERNVERKAUF_SCHWELLE_CENT || laufendNettoCent > FERNVERKAUF_SCHWELLE_CENT;

/** Kurztext der Sätze einer Aufteilung, z. B. "20 %" oder "20 % / 10 %". */
export const saetzeText = (posten) => posten.map((p) => `${p.satz} %`).join(" / ");

/**
 * Offene USt-Punkte für liveBlockers (mode.js, Sperrgrund "ust:…"). Review 31.10.2026:
 * Die Freigabe-Checkliste release.js "ust" ist ein Häkchen mit Beleg; zusätzlich darf
 * der Shop nicht live gehen, solange die Zahlen fehlen, auf denen OSS_AKTIV beruht.
 *   regeln            – UST_REGELN nicht vom Steuerberater freigegeben
 *   fernverkaeufe     – Netto-Fernverkäufe Vorjahr/laufend unbekannt (Art. 59c MwStSystRL;
 *                       Art. 3 Abs 5 Binnenmarktregelung UStG 1994). Achtung: zählt ALLE
 *                       Lieferungen an Private in andere EU-Staaten, auch Möbel nach DE.
 *   oss-pflicht       – Schwelle überschritten, aber OSS_AKTIV false (falsches Steuerland)
 *   oss-registrierung – OSS_AKTIV true ohne Registrierungsbeleg (§ 25a Binnenmarktregelung)
 */
export function ustOffen({ regeln = UST_REGELN, fernverkaeufe = FERNVERKAEUFE_EU_NETTO_CENT, ossAktiv = OSS_AKTIV, registrierung = OSS_REGISTRIERUNG } = {}) {
  const out = [];
  if (regeln?.status !== "freigegeben") out.push("regeln");
  const v = fernverkaeufe?.vorjahr2025;
  const l = fernverkaeufe?.laufend2026;
  if (!Number.isFinite(v) || !Number.isFinite(l)) out.push("fernverkaeufe");
  else if (fernverkaufSchwelleErreicht({ vorjahrNettoCent: v, laufendNettoCent: l }) && !ossAktiv) out.push("oss-pflicht");
  if (ossAktiv && !registrierung) out.push("oss-registrierung");
  return out;
}
