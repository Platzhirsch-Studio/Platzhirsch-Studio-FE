// CHF-Kostenschätzung für den Schweiz-Hub (/de/einkaufen-aus-der-schweiz).
// Dünne Schicht über dem Rechenkern der Labs (Besitz R5-portal-labs, hier nur
// Import, keine Änderung): src/components/Labs/Dreilaender/calc.js rechnet,
// diese Datei wählt die Wege A und B aus Bericht 18 (Abschn. 3, 8.1), setzt
// eigene de-CH-Beschriftungen und formatiert für die Anzeige.
//
// Regeln (Masterplan AP6 Nr. 2, Recht 14 F7/F11/F16):
// - Weg C (verzollt / Küche mit Montage) wird NICHT gerechnet und nicht beworben.
// - Keine Texte aus calc.js übernehmen (dort steht z. B. ein Ausfuhr-Badge mit
//   einem Wort, das die Seite nicht verwenden darf) – nur Zahlen.
// - Zuschläge (Transport, Verzollungsgebühr) sind Schätzungen aus Bericht 18
//   und werden als solche gezeigt. Fracht rechnet nur mit, wenn die Kundin
//   oder der Kunde einen Betrag einträgt (kein erfundener Lieferpreis).
// - Ergebnis ist immer eine „unverbindliche Kostenschätzung“.
import { calculate, parseEuro, AT_VAT, CH_VAT, MAX_AMOUNT } from "../../components/Labs/Dreilaender/calc.js";

// Beispiel aus Bericht 18, Abschn. 8.1 (Sofa 25.000 € brutto, EZB 23.10.2026).
export const EXAMPLE = Object.freeze({ grossEur: 25000, rate: 0.9227, date: "2026-10-23", freightEur: 450 });

export const LABEL = "Unverbindliche Kostenschätzung";
export const ROUNDING =
  "Gerechnet mit ungerundeten Zwischenwerten; angezeigt auf den Rappen gerundet. Der Zoll (BAZG) rechnet mit seinem eigenen Devisenkurs des Vortags, kleine Abweichungen sind möglich.";

const r2 = (n) => Math.round(n * 100) / 100;

// de-CH-Beschriftungen (Mastertext); EN/FR/IT gleich gebaut in src/lib/ch/content-intl.js (EST).
export const EST_DE = Object.freeze({
  wayA: "Weg A: Sie holen selbst ab",
  wayB: "Weg B: Lieferung per Spedition",
  netA: "Preis ohne österreichische USt (volle Erstattung angenommen)",
  netB: "Preis ohne österreichische USt",
  vat: "Schweizer Einfuhr-MWST 8,1 %",
  vatFreight: "Schweizer Einfuhr-MWST 8,1 % auf Ware und Lieferung",
  transport: "Eigener Transport, falls nötig{est}",
  est: " (Schätzung)",
  refundFee: "Gebühr für die Erstattung der USt",
  refundFeeText: "offen, nicht eingerechnet",
  freightGiven: "Lieferkosten laut Ihrer Angabe ({amount})",
  freight: "Lieferkosten",
  freightNone: "nicht eingerechnet",
  fee: "Verzollungsgebühr der Spedition inkl. 8,1 %{est}",
  errors: {
    betragEmpty: "Bitte einen Preis in Euro eingeben.",
    betragNan: "Bitte einen Betrag in Euro eingeben, zum Beispiel 25000.",
    betragMax: "Bitte höchstens 2’000’000 Euro eingeben.",
    frachtNan: "Bitte die Lieferkosten als Betrag in Euro eingeben oder das Feld leer lassen.",
    frachtMax: "Bitte höchstens 100’000 Euro Lieferkosten eingeben.",
  },
});
const chfFmt = new Intl.NumberFormat("de-CH", { style: "currency", currency: "CHF", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const eurFmt = new Intl.NumberFormat("de-CH", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pctFmt = new Intl.NumberFormat("de-AT", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const rateFmt = new Intl.NumberFormat("de-CH", { minimumFractionDigits: 4, maximumFractionDigits: 4 });

// Einheitlich typografischer Tausender-Apostroph (’) wie in Texten und Hinweisen;
// Intl de-CH liefert je nach Laufzeit ' oder ’.
const ch = (s) => s.replace(/'/g, "’");
export const chf = (n) => ch(chfFmt.format(n));
export const eur = (n) => ch(eurFmt.format(n));
export const fmtRate = (n) => ch(rateFmt.format(n));
export function chfRange(min, max) {
  return Math.abs(max - min) < 0.005 ? chf(min) : `${chf(min)} – ${chf(max).replace(/^CHF\s*/, "")}`;
}
export function isoToCh(d) {
  const [y, m, day] = String(d ?? "").split("-");
  return y && m && day ? `${day}.${m}.${y}` : String(d ?? "");
}

/** "25’000", "25 000", "25000.50" (de-CH) oder "25.000,50" (de-AT) → Zahl, sonst NaN. */
export function parseAmount(raw) {
  if (typeof raw !== "string") return NaN;
  const s = raw.trim();
  // de-CH: Punkt als Dezimaltrenner mit 1–2 Nachkommastellen ("25000.50", "25’000.5").
  if (/^[\d\s'’]+\.\d{1,2}$/.test(s)) return Number(s.replace(/[\s'’]/g, ""));
  return parseEuro(s);
}

// Fracht nur, wenn sie angegeben ist: als bestätigte Zahl der Kundin/des Kunden.
function configWith(config, freightEur) {
  const f = Number.isFinite(freightEur) && freightEur > 0 ? freightEur : 0;
  return {
    config: { ...config, deliveryEur: { ...config.deliveryEur, CH: { min: f, max: f, approved: true, source: "Ihre Angabe" } } },
    includeDelivery: f > 0,
    freightEur: f,
  };
}

const range = (min, max) => ({ min: r2(min), max: r2(max), text: chfRange(min, max) });

/**
 * @param {{ grossEur:number, freightEur?:number, rate:number, config:object }} input
 * config: Preis-Konfiguration der Labs (customsFeeChf, selfTransportChf, deliveryEur …)
 * @returns Wege A und B mit Zeilen (Zahl + Text), Vergleich, Abstand in %.
 */
// `text` (optional): EN/FR/IT-Beschriftungen aus src/lib/ch/content-intl.js (EST); ohne = de-CH.
export function estimateChf({ grossEur, freightEur = 0, rate, config, text = null }) {
  const T = text || EST_DE;
  const c = configWith(config, freightEur);
  const res = calculate({ grossAt: grossEur, country: "CH", rate, includeDelivery: c.includeDelivery }, c.config);
  const [pickup, delivery] = res.options;
  const pick = (opt, kind) => opt.lines.find((l) => l.kind === kind);
  const est = (r) => (r.approved ? "" : T.est);
  const tpl = (s, est) => s.replace("{est}", est);

  const a = pickup.lines;
  const wegA = {
    id: "a",
    title: T.wayA,
    lines: [
      { label: T.netA, ...range(a[0].min, a[0].max) },
      { label: T.vat, ...range(pick(pickup, "tax").min, pick(pickup, "tax").max) },
      { label: tpl(T.transport, est(config.selfTransportChf)), ...range(pick(pickup, "fee").min, pick(pickup, "fee").max), estimate: !config.selfTransportChf.approved },
      // Abwicklung der Erstattung (selbst oder Dienstleister mit Gebühr) ist offen
      // (content.js, [prüfen]) – deshalb sichtbar als offene Zeile, nicht eingerechnet.
      { label: T.refundFee, min: 0, max: 0, text: T.refundFeeText, open: true },
    ],
    total: range(pickup.total.min, pickup.total.max),
  };

  const fee = delivery.lines.find((l) => l.kind === "fee" && l.label.startsWith("Verzoll"));
  const freight = c.includeDelivery ? delivery.lines.find((l) => l.kind === "fee" && l.label.startsWith("Lieferung")) : null;
  const wegB = {
    id: "b",
    title: T.wayB,
    lines: [
      { label: T.netB, ...range(delivery.lines[0].min, delivery.lines[0].max) },
      freight
        ? { label: T.freightGiven.replace("{amount}", eur(c.freightEur)), ...range(freight.min, freight.max) }
        : { label: T.freight, min: 0, max: 0, text: T.freightNone, open: true },
      { label: freight ? T.vatFreight : T.vat, ...range(pick(delivery, "tax").min, pick(delivery, "tax").max) },
      { label: tpl(T.fee, est(config.customsFeeChf)), ...range(fee.min, fee.max), estimate: !config.customsFeeChf.approved },
    ],
    total: range(delivery.total.min, delivery.total.max),
    freightIncluded: c.includeDelivery,
  };

  const compare = r2(res.compare);
  const diff = (opt) => ({ min: (1 - opt.total.max / compare) * 100, max: (1 - opt.total.min / compare) * 100 });
  const da = diff(pickup);
  const db = diff(delivery);
  const pct = (d) => (Math.abs(d.max - d.min) < 0.05 ? `${pctFmt.format(d.min)} %` : `${pctFmt.format(d.min)}–${pctFmt.format(d.max)} %`);
  wegA.belowGross = pct(da);
  wegB.belowGross = pct(db);

  return {
    grossEur,
    grossText: eur(grossEur),
    netEur: res.net,
    netText: eur(res.net),
    rate,
    rateText: fmtRate(rate),
    compare,
    compareText: chf(compare),
    taxFactor: (1 + CH_VAT) / (1 + AT_VAT),
    wege: [wegA, wegB],
  };
}

/**
 * Formular → Eingaben. Fehlertexte de-CH, am Feld angezeigt.
 * @returns {{ ok:true, grossEur:number, freightEur:number } | { ok:false, errors:Record<string,string>, values }}
 */
export function readForm(formData, text = null) {
  const E = text?.errors || EST_DE.errors;
  const rawGross = String(formData?.get?.("betrag") ?? "").slice(0, 40);
  const rawFreight = String(formData?.get?.("fracht") ?? "").slice(0, 40);
  const errors = {};
  const grossEur = parseAmount(rawGross);
  if (!rawGross.trim()) errors.betrag = E.betragEmpty;
  else if (!Number.isFinite(grossEur) || grossEur <= 0) errors.betrag = E.betragNan;
  else if (grossEur > MAX_AMOUNT) errors.betrag = E.betragMax;
  let freightEur = 0;
  if (rawFreight.trim()) {
    freightEur = parseAmount(rawFreight);
    if (!Number.isFinite(freightEur) || freightEur < 0) errors.fracht = E.frachtNan;
    else if (freightEur > 100000) errors.fracht = E.frachtMax;
  }
  const values = { betrag: rawGross, fracht: rawFreight };
  return Object.keys(errors).length ? { ok: false, errors, values } : { ok: true, grossEur, freightEur, values };
}
