// Geld- und Kassenregeln Shop (10-konzept-shop § 3.3, E1, E4, E8, E9, E19). Rein, unit-getestet.
// Server Actions prüfen dieselben Regeln erneut – nie nur der Client.

/** Kanäle, deren Geld nur über die Kassa fließt (RKSV, § 131b BAO). */
export const KASSEN_KANAELE = Object.freeze(["Bar", "Karte extern", "Stripe Terminal"]);

/** Kanäle, die das Backoffice nie anbietet (E1, QA 3). */
export const VERBOTENE_BACKOFFICE_KANAELE = Object.freeze(["Bar", "Karte extern", "Stripe Terminal", "Verrechnung"]);

const n = (x) => (Number.isFinite(Number(x)) ? Math.trunc(Number(x)) : 0);

/** Offener Betrag (Cent): offen_cent, sonst gesamt − bezahlt; nie negativ. */
export function offen(doc) {
  if (!doc) return 0;
  if (doc.offen_cent !== undefined && doc.offen_cent !== null && doc.offen_cent !== "") return Math.max(n(doc.offen_cent), 0);
  return Math.max(n(doc.gesamt_cent) - n(doc.betrag_bezahlt_cent), 0);
}

/** Voll bezahlt: nichts offen und (Betrag > 0 oder Ersatzlieferung 0 €). Geldprüfung statt Statusprüfung (E4). */
export function vollBezahlt(doc) {
  return offen(doc) === 0 && (n(doc?.gesamt_cent) > 0 || doc?.bestellart === "Ersatz");
}

/** Eine der Zahlungen kam bar/Karte/Terminal (Kassa) → Erstattung im Backoffice gesperrt (E8). */
export function barEingang(zahlungen = []) {
  return zahlungen.some((z) => z && z.art !== "Erstattung" && KASSEN_KANAELE.includes(z.kanal));
}

/** Zu dieser Bestellung existiert eine Rechnung (E9). */
export function rechnungVorhanden(rechnungen = []) {
  return Array.isArray(rechnungen) && rechnungen.some((r) => r && r.docstatus !== 2 && r.status !== "Storniert");
}

/** Fremdwährung sperrt Geld-Dialoge (E19). */
export function fremdwaehrung(doc) {
  return !!doc?.waehrung && doc.waehrung !== "EUR";
}

/** Noch erstattbar an einer Zahlung. */
export function erstattbar(zahlung) {
  return Math.max(n(zahlung?.betrag_cent) - n(zahlung?.erstattet_cent), 0);
}

/** Bezahlter, noch nicht erstatteter Betrag einer Bestellung (offene Erstattung nach Storno). */
export function offeneErstattung(doc) {
  return Math.max(n(doc?.betrag_bezahlt_cent) - n(doc?.erstattet_cent), 0);
}

/**
 * Sperrgrund für Geldbewegungen im Backoffice (E8, E9, E19) – null = frei.
 * @param {object} doc
 * @param {{zahlungen?:object[], rechnungen?:object[], gutschriftHook?:boolean}} ctx
 * @returns {null|{code:"bar"|"rechnung"|"fremd", text:string}}
 */
export function erstattungGesperrt(doc, { zahlungen = [], rechnungen = [], gutschriftHook = false } = {}) {
  if (fremdwaehrung(doc)) return { code: "fremd", text: "Fremdwährung – Leitung prüfen" };
  if (barEingang(zahlungen)) return { code: "bar", text: "Erstattung an der Kassa auszahlen – danach hier stornieren (ohne Erstattung)" };
  if (rechnungVorhanden(rechnungen) && !gutschriftHook) return { code: "rechnung", text: "Erst Gutschrift in Faktura anlegen" };
  return null;
}

/** Live-Satz S1 „Bucht 39,00 € · offen danach 50,00 € · Status bleibt …“ als Werte. */
export function zahlungVorschau(doc, betragCent) {
  const o = offen(doc);
  const b = Math.max(Math.min(n(betragCent), o), 0);
  const danach = o - b;
  return { betrag: b, offenDanach: danach, vollDanach: danach === 0, gueltig: n(betragCent) > 0 && n(betragCent) <= o };
}

/** S2: Einlösebetrag = min(Rest, offen) bzw. gewünschter Betrag, gedeckelt. */
export function einloesBetrag({ rest, offenCent, wunsch }) {
  const max = Math.max(Math.min(n(rest), n(offenCent)), 0);
  if (wunsch === undefined || wunsch === null || wunsch === "") return max;
  return Math.max(Math.min(n(wunsch), max), 0);
}

/** Vier-Augen: Betrag über der Grenze → Freigabe der Geschäftsführung. Grenze 0 = immer (K-34 bis M-09). */
export function brauchtFreigabe(betragCent, grenzeCent) {
  const g = n(grenzeCent);
  return g <= 0 ? n(betragCent) > 0 : n(betragCent) > g;
}

/** USt aus Brutto, Satz als Int ×100 (2000 = 20 %) wie ph_shop/ust.py, kaufmännisch gerundet. */
export function ustAusBrutto(bruttoCent, satz) {
  const s = n(satz);
  if (!s) return 0;
  const p = s / 10000;
  return Math.round((n(bruttoCent) * p) / (1 + p));
}

/** Satz-Anzeige „20 %“ aus 2000. */
export function satzText(satz) {
  const s = n(satz) / 100;
  return `${Number.isInteger(s) ? s : s.toLocaleString("de-AT")} %`;
}

/**
 * Erstattungsvorschau ohne Server (Mock-Pfad, Live-Vorschau vor der Antwort von erstattung_vorschau):
 * je Zeile anteilig, letzte offene Menge = Rest (teilerstattung.py Regel 1).
 * @param {Array<{idx:number, menge:number, summe_cent:number, ust_satz_promille:number, zurueck_menge?:number, erstattet_cent?:number}>} positionen
 * @param {Record<string, number>} auswahl  {idx: menge}
 * @param {{versand_cent?:number, kulanz_cent?:number}} [extra]
 */
export function erstattungRechnen(positionen, auswahl = {}, { versand_cent = 0, kulanz_cent = 0 } = {}) {
  const proSatz = new Map();
  const zeilen = [];
  for (const p of positionen) {
    const m = n(auswahl[String(p.idx)]);
    if (m <= 0) continue;
    const offenMenge = n(p.menge) - n(p.zurueck_menge);
    if (m > offenMenge) return { fehler: `Menge ${m} übersteigt die offene Menge ${offenMenge}.` };
    const offenBetrag = n(p.summe_cent) - n(p.erstattet_cent);
    const b = m === offenMenge ? Math.max(offenBetrag, 0) : Math.max(Math.min(Math.round((n(p.summe_cent) * m) / Math.max(n(p.menge), 1)), offenBetrag), 0);
    const satz = n(p.ust_satz_promille);
    zeilen.push({ key: String(p.idx), menge: m, betrag_cent: b, satz_promille: satz });
    proSatz.set(satz, (proSatz.get(satz) || 0) + b);
  }
  const hauptSatz = positionen[0] ? n(positionen[0].ust_satz_promille) : 2000;
  if (n(versand_cent) > 0) proSatz.set(hauptSatz, (proSatz.get(hauptSatz) || 0) + n(versand_cent));
  if (n(kulanz_cent) > 0) proSatz.set(hauptSatz, (proSatz.get(hauptSatz) || 0) + n(kulanz_cent));
  const posten = [...proSatz.entries()].sort((a, b) => b[0] - a[0]).filter(([, br]) => br > 0).map(([satz, brutto]) => {
    const u = ustAusBrutto(brutto, satz);
    return { satz_promille: satz, brutto_cent: brutto, ust_cent: u, netto_cent: brutto - u };
  });
  const betrag = posten.reduce((s, p) => s + p.brutto_cent, 0);
  return { betrag_cent: betrag, ust_cent: posten.reduce((s, p) => s + p.ust_cent, 0), posten, zeilen };
}

/**
 * Verteilung einer Erstattung auf die Eingänge (Karte/Überweisung zuerst, Gutschein zuletzt) – wie
 * teilerstattung.verteile_auf_zahlungen; dient der Vorschau im Mock.
 */
export function verteileAufZahlungen(betragCent, zahlungen = []) {
  let rest = n(betragCent);
  const sortiert = [...zahlungen].filter((z) => z.art !== "Erstattung").sort((a, b) => (a.kanal === "Gutschein") - (b.kanal === "Gutschein"));
  const out = [];
  for (const z of sortiert) {
    if (rest <= 0) break;
    const o = erstattbar(z);
    if (o <= 0) continue;
    const t = Math.min(o, rest);
    out.push({ name: z.name, kanal: z.kanal, betrag_cent: t, gutschein: z.gutschein || null });
    rest -= t;
  }
  return { teile: out, rest };
}

/** Weg-Satz je Kanal (S3/S4). */
export function wegSatz(kanal) {
  if (String(kanal).startsWith("Stripe")) return "zurück auf die Zahlungsart des Kunden (2–5 Werktage)";
  if (kanal === "Gutschein") return "Restwert zurück auf den Gutschein";
  if (kanal === "Ueberweisung") return "Gegenbuchung – Rücküberweisung im Bankprogramm ausführen";
  if (KASSEN_KANAELE.includes(kanal)) return "an der Kassa auszahlen";
  return "Gegenbuchung";
}
