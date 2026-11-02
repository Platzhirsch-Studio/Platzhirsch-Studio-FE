// Rechenkern des Dreiländer-Preisrechners (rein, Server und Client).
// Rechenwege aus Marktresearch/18, Abschn. 3, 5 und 8:
//   CH/FL (A) Selbstabholung mit Ausfuhrbeleg: Netto → CHF, + 8,1 % Einfuhr-MWST, + eigener Transport
//   CH/FL (B) Lieferung, Kunde ist Importeur:  (Netto + Fracht) → CHF, + 8,1 % (Bemessung inkl. Transport),
//             + Verzollungsgebühr Spediteur zzgl. 8,1 %
//   CH/FL (C) verzollter Komplettpreis / Küche mit Montage → klären wir persönlich (CH-MWST-Registrierung nötig)
//   DE: Abholung 20 % AT-USt · Lieferung loser Möbel 20 % AT-USt, 19 % DE-USt nur mit config.ossActive · Montage → persönlich
// Kontrollrechnung: 25.000 € brutto, Kurs 0,9227 → (A) CHF 20.929,97–21.029,97, (B) CHF 21.315,30–21.390,97
// (identisch mit Bericht 18, Tabelle 8.1).
import * as z from "../zod.js"; // benannte Re-Exporte statt ganzem zod-Namensraum (Bundle, R4)
import { PERSONAL } from "./rules";
import { PLACEHOLDER, ESTIMATE } from "./pricing";

// Kundentexte der Rechenwege. DE ist der Mastertext; EN/FR/IT kommen als
// gleich gebautes Objekt vom Server (src/lib/dreilaender/copy-intl.js, client.calc).
export const CALC_TEXT_DE = Object.freeze({
  personal: PERSONAL,
  sources: {},
  chPickupTitle: "Selbstabholung mit Ausfuhrbeleg",
  chPickupSubtitle: "Sie holen in Lochau ab und führen die Ware selbst aus.",
  chPickupBadge: "kein Schweizer MWST-Eintrag nötig",
  chNet: "Rechnung netto (ohne AT-USt)",
  chDeposit: "AT-USt 20 % als Kaution – zurück nach Ausfuhrbeleg (U34)",
  chImportVat: "Schweizer Einfuhr-MWST 8,1 % (an der Grenze, z. B. QuickZoll)",
  chTransport: "Eigener Transport (Transporter/Anhänger)",
  chPickupReq: [
    "Wohnsitz außerhalb der EU (Schweiz oder Liechtenstein), kein zusätzlicher Wohnsitz in der EU",
    "Rechnung über 75 €, Ausfuhr innerhalb von 3 Monaten",
    "Transport durch Sie selbst – nicht mit Spediteur",
  ],
  chPickupReqCh: "Ausfuhr bestätigen: Lustenau/Au 0–24 Uhr, Höchst/St. Margrethen Mo–Fr 8–16 Uhr",
  chPickupReqFl: "Ausfuhr bestätigen: Lustenau/Au 0–24 Uhr oder Tisis/Schaanwald Mo–Fr 7.30–16.30 Uhr",
  chPickupHint: "Geeignet vor allem für Leuchten, Accessoires und kleinere Möbel.",
  chDeliveryTitle: "Lieferung – Sie sind Importeur",
  chDeliverySubtitle: "Netto-Ausfuhr, Spediteur verzollt, Sie zahlen MWST und Gebühr beim Empfang.",
  chDeliveryBadge: "steuerfreie Ausfuhrlieferung",
  chDelivery: "Lieferung bis zu Ihnen",
  chDeliveryImportVat: "Schweizer Einfuhr-MWST 8,1 % (auf Ware + Transport)",
  chFee: "Verzollungsgebühr Spediteur inkl. 8,1 %",
  chDeliveryReq: [
    "Lieferung ohne Einbau (Sofa, Tisch, Stühle)",
    "Rechnung netto mit Hinweis „zzgl. 8,1 % CH-MWST und Verzollungsgebühr beim Empfang“",
    "Ausfuhr- und Einfuhranmeldung übernimmt der Spediteur",
  ],
  noDelivery: "Lieferkosten nicht eingerechnet.",
  ddpTitle: "Verzollter Komplettpreis oder Küche mit Montage",
  ddpSubtitle: "Ein Endpreis in CHF inkl. MWST, Lieferung und Montage.",
  ddpNote: "Dafür braucht es eine Schweizer MWST-Registrierung, bei Montage zusätzlich Meldungen für die Monteure.",
  compareChf: "AT-Bruttopreis umgerechnet",
  compareEur: "AT-Bruttopreis",
  dePickupTitle: "Abholung in Lochau",
  dePickupSubtitle: "Sie holen im Showroom ab – österreichische USt.",
  netPrice: "Nettopreis",
  atVat: "Österreichische USt 20 %",
  reqSelf: "Transport durch Sie selbst",
  deDeliveryTitle: "Lieferung loser Möbel nach Deutschland",
  deSubOss: "Fernverkauf mit deutscher USt (EU-OSS).",
  deSubNoOss: "Mit österreichischer USt 20 %.",
  deBadgeOss: "19 % DE-USt (Bedingung siehe unten)",
  deVat: "Deutsche USt 19 %",
  delivery: "Lieferung",
  condLabel: "Bedingung",
  noteLabel: "Hinweis",
  condOss: "19 % deutsche USt, weil Platzhirsch über die EU-OSS abrechnet. Richtwert, verbindlich erst im Angebot.",
  condNoOss:
    "Rechnet Platzhirsch über die EU-OSS mit deutscher USt ab, gelten 19 % statt 20 % – der Steueranteil wäre dann rechnerisch {diff} niedriger. Richtwert, verbindlich erst im Angebot.",
  reqOss: "EU-weite Fernverkaufsschwelle von 10.000 € netto überschritten, Abrechnung über die EU-OSS",
  reqNoOss: "Gerechnet mit 20 % AT-USt (Richtwert, verbindlich erst im Angebot)",
  reqLoose: "Lose Möbel ohne Einbau",
  deMontageTitle: "Küche oder Einbau mit Montage",
  deMontageSubtitle: "Montagelieferung mit Leistungsort in Deutschland.",
  deMontageNote: "Läuft nicht über die OSS und braucht eine eigene Abwicklung.",
  atPickupSubtitle: "Bruttopreis inklusive 20 % USt.",
  atVatShort: "USt 20 %",
  atDeliveryTitle: "Lieferung in Österreich",
  atDeliverySubtitle: "Bruttopreis plus Lieferung.",
  atGross: "Bruttopreis inkl. 20 % USt",
  atMontage: "Montage",
});
// Bekannte Quellenzeilen aus pricing.js (Schlüssel der Übersetzungstabelle `sources`).
export const CALC_SOURCE_KEYS = Object.freeze([ESTIMATE, PLACEHOLDER, `wie Schweiz angenommen – ${PLACEHOLDER}`]);

export const AT_VAT = 0.2;
export const CH_VAT = 0.081;
export const DE_VAT = 0.19;
export const MAX_AMOUNT = 2_000_000;

export const inputSchema = z.object({
  grossAt: z.number().positive("Bitte einen Betrag über 0 € eingeben.").max(MAX_AMOUNT, "Bitte maximal 2.000.000 € eingeben."),
  country: z.enum(["CH", "FL", "DE", "AT"]),
  rate: z.number().min(0.5).max(2),
  includeDelivery: z.boolean(),
});

// "25.000", "25 000", "25000,50", "25’000" → Zahl. Punkt = Tausender, wenn genau 3 Ziffern folgen.
export function parseEuro(raw) {
  if (typeof raw !== "string") return NaN;
  let s = raw.replace(/[\s'’€]/g, "");
  if (!s) return NaN;
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
  if (!/^\d+(\.\d+)?$/.test(s)) return NaN;
  return Number(s);
}

const r2 = (n) => Math.round(n * 100) / 100;

function line(label, min, max = min, extra = {}) {
  // Ungerundet speichern, erst Summe und Anzeige runden (sonst Cent-Abweichungen).
  return { label, min, max, ...extra };
}

function sum(lines) {
  return lines.reduce((a, l) => ({ min: a.min + (l.add === false ? 0 : l.min), max: a.max + (l.add === false ? 0 : l.max) }), { min: 0, max: 0 });
}

function finish(opt, compare) {
  const t = sum(opt.lines);
  const total = { min: r2(t.min), max: r2(t.max) };
  const savings = compare
    ? { min: (1 - total.max / compare) * 100, max: (1 - total.min / compare) * 100 }
    : null;
  return { ...opt, total, savings };
}

export function calculate(input, config, text = CALC_TEXT_DE) {
  const t = text || CALC_TEXT_DE;
  const src = (v) => (v == null ? v : t.sources?.[v] ?? v);
  const { grossAt, country, rate, includeDelivery } = inputSchema.parse(input);
  const net = grossAt / (1 + AT_VAT);
  const atVat = grossAt - net;

  if (country === "CH" || country === "FL") {
    const currency = "CHF";
    const compare = grossAt * rate; // AT-Bruttopreis in CHF
    const netChf = net * rate;
    const st = config.selfTransportChf;
    const fee = config.customsFeeChf;
    const del = config.deliveryEur[country];

    const pickup = finish(
      {
        id: "abholung",
        title: t.chPickupTitle,
        subtitle: t.chPickupSubtitle,
        available: true,
        badge: t.chPickupBadge,
        lines: [
          line(t.chNet, netChf, netChf, { eur: r2(net), kind: "base" }),
          line(t.chDeposit, atVat * rate, atVat * rate, { kind: "info", add: false, eur: r2(atVat) }),
          line(t.chImportVat, netChf * CH_VAT, netChf * CH_VAT, { kind: "tax" }),
          line(t.chTransport, st.min, st.max, { kind: "fee", estimate: !st.approved, source: src(st.source) }),
        ],
        requirements: [...t.chPickupReq, country === "FL" ? t.chPickupReqFl : t.chPickupReqCh],
        hint: t.chPickupHint,
      },
      compare
    );

    const freight = includeDelivery ? del : { min: 0, max: 0, approved: true };
    const importMin = (net + freight.min) * rate;
    const importMax = (net + freight.max) * rate;
    const delivery = finish(
      {
        id: "lieferung",
        title: t.chDeliveryTitle,
        subtitle: t.chDeliverySubtitle,
        available: true,
        badge: t.chDeliveryBadge,
        lines: [
          line(t.chNet, netChf, netChf, { eur: r2(net), kind: "base" }),
          ...(includeDelivery
            ? [line(t.chDelivery, del.min * rate, del.max * rate, { eur: del.min === del.max ? r2(del.min) : null, kind: "fee", estimate: !del.approved, source: src(del.source) })]
            : []),
          line(t.chDeliveryImportVat, importMin * CH_VAT, importMax * CH_VAT, { kind: "tax" }),
          line(t.chFee, fee.min * (1 + CH_VAT), fee.max * (1 + CH_VAT), { kind: "fee", estimate: !fee.approved, source: src(fee.source) }),
        ],
        requirements: [...t.chDeliveryReq],
        hint: includeDelivery ? null : t.noDelivery,
      },
      compare
    );

    const ddp = {
      id: "verzollt",
      title: t.ddpTitle,
      subtitle: t.ddpSubtitle,
      available: false,
      note: `${t.ddpNote} ${t.personal}`,
    };

    return { country, currency, net: r2(net), atVat: r2(atVat), compare: r2(compare), compareLabel: t.compareChf, rate, options: [pickup, delivery, ddp] };
  }

  if (country === "DE") {
    const del = config.deliveryEur.DE;
    const pickup = finish(
      {
        id: "abholung",
        title: t.dePickupTitle,
        subtitle: t.dePickupSubtitle,
        available: true,
        lines: [
          line(t.netPrice, net, net, { kind: "base" }),
          line(t.atVat, atVat, atVat, { kind: "tax" }),
        ],
        requirements: [t.reqSelf],
      },
      null
    );
    const deVat = net * DE_VAT;
    const diff = new Intl.NumberFormat("de-AT", { style: "currency", currency: "EUR" }).format(atVat - deVat);
    // ossActive=false (Standard): Lieferung mit 20 % AT-USt, 19 % nur als Hinweis.
    const oss = Boolean(config.ossActive);
    const delivery = finish(
      {
        id: "lieferung",
        title: t.deDeliveryTitle,
        subtitle: oss ? t.deSubOss : t.deSubNoOss,
        available: true,
        badge: oss ? t.deBadgeOss : null,
        lines: [
          line(t.netPrice, net, net, { kind: "base" }),
          oss ? line(t.deVat, deVat, deVat, { kind: "tax" }) : line(t.atVat, atVat, atVat, { kind: "tax" }),
          ...(includeDelivery
            ? [line(t.delivery, del.min, del.max, { kind: "fee", estimate: !del.approved, source: src(del.source) })]
            : []),
        ],
        conditionLabel: oss ? t.condLabel : t.noteLabel,
        condition: oss ? t.condOss : t.condNoOss.replace("{diff}", diff),
        requirements: [oss ? t.reqOss : t.reqNoOss, t.reqLoose],
        hint: includeDelivery ? null : t.noDelivery,
      },
      null
    );
    const montage = {
      id: "montage",
      title: t.deMontageTitle,
      subtitle: t.deMontageSubtitle,
      available: false,
      note: `${t.deMontageNote} ${t.personal}`,
    };
    return { country, currency: "EUR", net: r2(net), atVat: r2(atVat), compare: r2(grossAt), compareLabel: t.compareEur, rate, options: [pickup, delivery, montage] };
  }

  // AT
  const del = config.deliveryEur.AT;
  const pickup = finish(
    {
      id: "abholung",
      title: t.dePickupTitle,
      subtitle: t.atPickupSubtitle,
      available: true,
      lines: [line(t.netPrice, net, net, { kind: "base" }), line(t.atVatShort, atVat, atVat, { kind: "tax" })],
      requirements: [],
    },
    null
  );
  const delivery = finish(
    {
      id: "lieferung",
      title: t.atDeliveryTitle,
      subtitle: t.atDeliverySubtitle,
      available: true,
      lines: [
        line(t.atGross, grossAt, grossAt, { kind: "base" }),
        ...(includeDelivery ? [line(t.delivery, del.min, del.max, { kind: "fee", estimate: !del.approved, source: src(del.source) })] : []),
      ],
      requirements: [],
      hint: includeDelivery ? null : t.noDelivery,
    },
    null
  );
  return { country, currency: "EUR", net: r2(net), atVat: r2(atVat), compare: r2(grossAt), compareLabel: t.compareEur, rate, options: [pickup, delivery, { id: "montage", title: t.atMontage, available: false, note: t.personal }] };
}
