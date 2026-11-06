// Kennzahlen, Zähler und „Zu tun“ des Shops (10-konzept-shop § 4.1, § 7, § 10.2; MASTER Q-B4/Q-B5). Rein.
// Gleiche Filter wie die Listen (ansichten.js); Kennzahlen und Berichte nur live (§ 2.4). „Eingänge“ statt
// „Umsatz“: Zahlungszufluss, Kassa-Zahlungen zählt der Kassa-Bereich (keine Doppelzählung).

import { offen, offeneErstattung } from "./geld.js";
import { istTest, fristMorgen } from "./ansichten.js";
import { risikoOffen, streitOffen } from "./status.js";
import { heute as heuteIso, tageBis, tagVon, plusTage } from "./fristen.js";
import { naechsterSchritt, ruhtSeit } from "./naechsterSchritt.js";

const live = (dt) => (d) => !istTest(dt, d);

/**
 * @param {{bestellungen:object[], zahlungen:object[], gutscheine:object[], widerrufe:object[], ereignisse?:object[], stripe?:object}} daten
 * @param {{heute?:string, jetzt?:Date}} [ctx]
 */
export function shopKennzahlen(daten, ctx = {}) {
  const h = ctx.heute || heuteIso();
  const jetzt = ctx.jetzt || new Date();
  const b = (daten.bestellungen || []).filter(live("PH Bestellung"));
  const z = (daten.zahlungen || []).filter(live("PH Zahlung"));
  const g = (daten.gutscheine || []).filter(live("PH Gutschein"));
  const w = daten.widerrufe || [];
  const ev = daten.ereignisse || [];

  const zuPacken = b.filter((x) => x.status === "bezahlt" && x.lieferart === "versand");
  const abholung = b.filter((x) => x.lieferart === "abholung" && ["reserviert", "bezahlt", "abholbereit"].includes(x.status));
  const unterwegs = b.filter((x) => ["offen", "zahlung_ausstehend"].includes(x.status));
  const aelteste = unterwegs.map((x) => new Date(String(x.angelegt).replace(" ", "T"))).filter((d) => !Number.isNaN(d.getTime())).sort((a, c) => a - c)[0];
  const monat = h.slice(0, 7);
  const eingaenge = z.filter((x) => x.art === "Eingang" && x.status !== "Angekuendigt" && x.status !== "Fehlgeschlagen" && x.status !== "Storniert" && x.quelle !== "kassa" && ["PH Bestellung", "PH Gutschein Bestellung"].includes(x.bezug_doctype));
  const vormonat = plusTage(`${monat}-01`, -1).slice(0, 7);
  const summeMonat = (m) => eingaenge.filter((x) => String(x.zeitpunkt).slice(0, 7) === m).reduce((s, x) => s + Number(x.betrag_cent || 0), 0);
  const rest = g.filter((x) => !["Eingeloest", "Erstattet"].includes(x.status) && !(x.status === "Gesperrt" && x.sperrgrund_art === "Ersetzt"));
  const ohneVerkauf = rest.filter((x) => !x.zahlung && !x.ausgabe_beleg && !x.gutschein_bestellung);
  const vor7 = plusTage(h, -7);
  return {
    zuPacken: zuPacken.length,
    zuPackenSeitGestern: zuPacken.filter((x) => tagVon(x.bezahlt_am) && tagVon(x.bezahlt_am) < h).length,
    abholung: abholung.length,
    abholungFristMorgen: abholung.filter((x) => fristMorgen(x, h)).length,
    pruefen: b.filter((x) => x.status === "pruefen" || (risikoOffen(x) && !["storniert", "abgeschlossen", "erstattet"].includes(x.status))).length,
    widerrufe: w.filter((x) => ["Eingegangen", "Bestaetigt", "Ware erwartet", "Ware erhalten"].includes(x.status)).length,
    freigabe: z.filter((x) => x.status === "Erstattung angefordert").length,
    bestellungenHeute: b.filter((x) => tagVon(x.angelegt) === h && !["checkout_fehler", "abgelaufen"].includes(x.status)).length,
    zahlungUnterwegs: unterwegs.length,
    aeltesteStunden: aelteste ? Math.max(Math.round((jetzt - aelteste) / 3_600_000), 0) : null,
    eingaengeMonat: summeMonat(monat),
    eingaengeVormonat: summeMonat(vormonat),
    gutscheinRest: rest.reduce((s, x) => s + Number(x.rest_cent || 0), 0),
    gutscheinAnzahl: rest.filter((x) => Number(x.rest_cent) > 0).length,
    gutscheinOhneVerkauf: ohneVerkauf.reduce((s, x) => s + Number(x.rest_cent || 0), 0),
    stripe: {
      fehler7: ev.filter((x) => x.status === "fehler" && (tagVon(x.empfangen_am) || "") >= vor7).length,
      letzterAbgleich: daten.stripe?.letzter_abgleich || null,
      ohneAuszahlung: z.filter((x) => String(x.kanal).startsWith("Stripe") && x.art === "Eingang" && x.status === "Bezahlt" && !x.stripe_auszahlung && (tagVon(x.zeitpunkt) || h) < vor7).length,
      streit: z.filter((x) => streitOffen(x)).length,
    },
  };
}

/** Eingänge je Kalenderwoche (Balken, letzte n Wochen; letzte = laufend). */
export function eingaengeJeWoche(zahlungen, { heute = heuteIso(), wochen = 13 } = {}) {
  const montag = (iso) => {
    const d = new Date(`${iso}T00:00:00Z`);
    const wt = (d.getUTCDay() + 6) % 7;
    d.setUTCDate(d.getUTCDate() - wt);
    return d.toISOString().slice(0, 10);
  };
  const start = montag(plusTage(heute, -7 * (wochen - 1)));
  const punkte = [];
  for (let i = 0; i < wochen; i++) {
    const von = plusTage(start, i * 7);
    const bis = plusTage(von, 6);
    const kw = kalenderwoche(von);
    const wert = zahlungen.filter((x) => !istTest("PH Zahlung", x) && x.art === "Eingang" && x.status !== "Fehlgeschlagen" && x.quelle !== "kassa").filter((x) => {
      const t = tagVon(x.zeitpunkt);
      return t && t >= von && t <= bis;
    }).reduce((s, x) => s + Number(x.betrag_cent || 0), 0);
    punkte.push({ label: `KW ${kw}`, wert });
  }
  return punkte;
}

function kalenderwoche(iso) {
  const d = new Date(`${iso}T00:00:00Z`);
  const tag = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - tag + 3);
  const erster = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  return 1 + Math.round(((d - erster) / 86_400_000 - 3 + ((erster.getUTCDay() + 6) % 7)) / 7);
}

/** Zahlungen nach Kanal (waagrechte Balken absteigend). */
export function zahlungenNachKanal(zahlungen) {
  const m = new Map();
  for (const x of zahlungen) {
    if (istTest("PH Zahlung", x) || x.art !== "Eingang" || x.status === "Fehlgeschlagen") continue;
    const k = x.kanal === "Ueberweisung" ? "Überweisung" : x.kanal;
    m.set(k, (m.get(k) || 0) + Number(x.betrag_cent || 0));
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([label, wert]) => ({ label, wert }));
}

/**
 * „Zu tun“ (§ 4.1): max. 8 Zeilen nach Dringlichkeit, je Zeile genau ein Knopf.
 * @returns {Array<{id:string, rang:number, icon:string, ton:string, titel:string, nr:string, text:string, href:string, aktion:string|null, knopf:string, doctype:string}>}
 */
export function zuErledigen(daten, ctx = {}) {
  const h = ctx.heute || heuteIso();
  const fmt = ctx.cent || ((c) => `${(Number(c || 0) / 100).toFixed(2)} €`);
  const b = (daten.bestellungen || []).filter((x) => !istTest("PH Bestellung", x));
  const z = daten.zahlungen || [];
  const w = daten.widerrufe || [];
  const rows = [];
  const akte = (n) => `/shop/bestellungen/${encodeURIComponent(n)}`;
  for (const x of b) {
    if (x.status === "pruefen") rows.push({ id: `pruefen:${x.name}`, rang: 1, icon: "TriangleAlert", ton: "ziegel", titel: "Prüfen", nr: x.name, text: `Soll ${fmt(x.gesamt_cent)} · Ist ${fmt(x.betrag_bezahlt_cent)}`, href: akte(x.name), aktion: ctx.leitung ? "geprueft" : null, knopf: "Prüfen", doctype: "PH Bestellung" });
    else if (risikoOffen(x) && !["storniert", "abgeschlossen", "erstattet", "versendet", "abgeholt"].includes(x.status)) rows.push({ id: `risiko:${x.name}`, rang: 2, icon: "ShieldAlert", ton: "eiche", titel: "Risiko", nr: x.name, text: "Stripe-Prüfung erhöht", href: akte(x.name), aktion: null, knopf: "Ansehen", doctype: "PH Bestellung" });
  }
  for (const s of z.filter((y) => streitOffen(y) && ctx.leitung)) rows.push({ id: `streit:${s.name}`, rang: 3, icon: "ShieldAlert", ton: "ziegel", titel: "Zahlungsstreit", nr: s.name, text: `${fmt(s.dispute_betrag_cent || s.betrag_cent)} · Antwort bis ${kurz(s.dispute_frist)}`, href: `/shop/zahlungen/${encodeURIComponent(s.name)}`, aktion: null, knopf: "Ansehen", doctype: "PH Zahlung" });
  for (const x of b.filter((y) => y.status === "abholbereit" && fristMorgen(y, h))) rows.push({ id: `abholung:${x.name}`, rang: 4, icon: "ShoppingBag", ton: "see", titel: "Abholbereit", nr: x.name, text: `${x.kunde_name} · bis ${tageBis(h, x.abholung_bis) <= 0 ? "heute" : "morgen"}`, href: akte(x.name), aktion: offen(x) === 0 ? "uebergeben" : null, knopf: offen(x) === 0 ? "Übergeben" : "Öffnen", doctype: "PH Bestellung" });
  for (const x of b.filter((y) => y.status === "bezahlt")) {
    const r = ruhtSeit(x, h);
    const schritt = naechsterSchritt(x, { heute: h });
    rows.push({ id: `bezahlt:${x.name}`, rang: 5 - Math.min(r, 9) / 100, icon: x.lieferart === "versand" ? "Package" : "ShoppingBag", ton: r >= 2 ? "eiche" : "stein", titel: "Bezahlt", nr: x.name, text: `${x.kunde_name}${r >= 2 ? ` · ruht seit ${r} Tagen` : ""}`, href: akte(x.name), aktion: schritt.aktion === "packen" || schritt.aktion === "abholbereit" ? schritt.aktion : null, knopf: schritt.aktion === "packen" ? "Packen" : schritt.aktion === "abholbereit" ? "Abholbereit melden" : "Öffnen", doctype: "PH Bestellung", ruht: r });
  }
  for (const x of w.filter((y) => ["Bestaetigt", "Ware erwartet", "Ware erhalten", "Eingegangen"].includes(y.status) && y.erstattung_bis && tageBis(h, y.erstattung_bis) <= 3)) rows.push({ id: `widerruf:${x.name}`, rang: 6, icon: "Undo2", ton: "ziegel", titel: "Widerruf", nr: x.name, text: `Rückzahlung bis ${kurz(x.erstattung_bis)}`, href: `/shop/widerrufe/${encodeURIComponent(x.name)}`, aktion: null, knopf: "Öffnen", doctype: "PH Widerruf" });
  if (ctx.leitung) for (const x of b.filter((y) => y.status === "abgelaufen" && offeneErstattung(y) > 0)) rows.push({ id: `abgelaufen:${x.name}`, rang: 7, icon: "Clock", ton: "eiche", titel: "Abgelaufen mit Zahlung", nr: x.name, text: `${fmt(offeneErstattung(x))} bezahlt – erstatten oder verlängern`, href: akte(x.name), aktion: null, knopf: "Öffnen", doctype: "PH Bestellung" });
  return rows.sort((a, c) => a.rang - c.rang).slice(0, 8);
}

function kurz(iso) {
  const t = tagVon(iso);
  return t ? `${t.slice(8, 10)}.${t.slice(5, 7)}.` : "–";
}

/** EU-Versand (Fernverkäufe) im Kalenderjahr gegen die Schwelle 10.000 € netto (§ 4.11, Art. 59c MwStSystRL). */
export const EU_SCHWELLE_CENT = 1_000_000;
export function euVersand(bestellungen, { jahr }) {
  const st = new Set(["bezahlt", "versandbereit", "versendet", "abgeschlossen", "abgeholt"]);
  const zeilen = bestellungen.filter((b) => !istTest("PH Bestellung", b) && b.lieferart === "versand" && b.adresse_land && b.adresse_land !== "AT" && st.has(b.status) && String(b.angelegt).startsWith(String(jahr)));
  const netto = zeilen.reduce((s, b) => s + Number(b.gesamt_cent || 0) - Number(b.ust_cent || 0), 0);
  return { zeilen, netto, anteil: netto / EU_SCHWELLE_CENT, warnung: netto >= EU_SCHWELLE_CENT * 0.8 };
}
