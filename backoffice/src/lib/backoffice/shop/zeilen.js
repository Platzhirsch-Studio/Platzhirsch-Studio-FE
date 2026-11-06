// Ansichtsmodelle der Shop-Listen und -Karten (rein, serialisierbar): aus Rohdaten werden Zellen mit Anzeige,
// Ton und Aktion. Keine Rohwerte in der Oberfläche (N13), Beträge über cent(), Zeiten relativ < 24 h (Q-A5).

import { cent, datum, datumZeit, relativ } from "../format.js";
import { statusInfo, zusatzChips, kanalText, mailStatusText, risikoOffen } from "./status.js";
import { offen } from "./geld.js";
import { naechsterSchritt, ruhtSeit } from "./naechsterSchritt.js";
import { ampel, tagVon, zustellung, widerrufsFristen, heute as heuteIso } from "./fristen.js";
import { AKTIONEN } from "./primaer.js";
import { stripeTyp } from "./stripeTypen.js";
import { istTest } from "./ansichten.js";

const kurz = (iso) => {
  const t = tagVon(iso);
  return t ? `${t.slice(8, 10)}.${t.slice(5, 7)}.` : "–";
};

export function zeit(iso, jetzt = new Date()) {
  if (!iso) return "–";
  const d = new Date(String(iso).replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return "–";
  return jetzt - d < 86_400_000 && jetzt - d >= 0 ? relativ(iso, jetzt) : datum(iso);
}

const ZEILEN_AKTION = new Set(["packen", "abholbereit", "uebergeben", "versendet", "abschliessen", "zahlungslink-senden", "an-die-kassa", "geprueft"]);

/** Bestellung → Zeile (Liste, Peek, Kanban). */
export function bestellZeile(b, ctx = {}) {
  const h = ctx.heute || heuteIso();
  const st = statusInfo("PH Bestellung", b.status, b);
  const o = offen(b);
  const schritt = naechsterSchritt(b, { heute: h, lieferscheine: ctx.lieferscheine?.[b.name] || [] });
  const r = ruhtSeit(b, h);
  const aktion = schritt.aktion && ZEILEN_AKTION.has(schritt.aktion) && !(schritt.aktion === "geprueft" && !ctx.leitung) ? { id: schritt.aktion, titel: AKTIONEN[schritt.aktion]?.titel || schritt.titel, icon: AKTIONEN[schritt.aktion]?.icon } : null;
  return {
    name: b.name,
    href: `/shop/bestellungen/${encodeURIComponent(b.name)}`,
    test: b.modus === "test",
    doc: docFuerAktion(b, ctx),
    aktion,
    zellen: {
      objekt: { titel: b.kunde_name || "–", unter: [b.name, b.adresse_ort].filter(Boolean).join(" · "), bilder: (ctx.positionen?.[b.name] || []).slice(0, 2).map((p) => p.bild).filter(Boolean), icon: b.lieferart === "abholung" ? "ShoppingBag" : "Truck" },
      gesamt: { text: cent(b.gesamt_cent) },
      status: { ...st, chips: zusatzChips(b, { zahlungen: ctx.zahlungen?.[b.name] || [] }), unter: o > 0 && ["reserviert", "abholbereit"].includes(b.status) ? `Offen ${cent(o)}` : "", unterTon: "warn" },
      schritt: schritt.id ? { titel: schritt.titel, icon: schritt.icon, ton: schritt.ton, faellig: schritt.faellig ? (schritt.faellig === h ? "heute" : `bis ${kurz(schritt.faellig)}`) : r >= 2 ? `ruht seit ${r} Tagen` : "", lieferart: b.lieferart === "abholung" ? "Abholung" : "Versand" } : { titel: "–", icon: "Minus", ton: null, faellig: "" },
      bestellt: { text: zeit(b.angelegt), titel: datumZeit(b.angelegt) },
      person: b.zugewiesen_an || "",
    },
  };
}

/** Minimale Bestelldaten für Aktionen/Dialoge (serialisierbar). */
export function docFuerAktion(b, ctx = {}) {
  return {
    doctype: "PH Bestellung", name: b.name, status: b.status, statusAnzeige: statusInfo("PH Bestellung", b.status, b).anzeige, lieferart: b.lieferart, bestellart: b.bestellart, modus: b.modus,
    gesamt_cent: Number(b.gesamt_cent) || 0, betrag_bezahlt_cent: Number(b.betrag_bezahlt_cent) || 0, erstattet_cent: Number(b.erstattet_cent) || 0, offen_cent: offen(b), versand_cent: Number(b.versand_cent) || 0,
    kunde_name: b.kunde_name, kunde_email: b.kunde_email, kontakt: b.kontakt || "", abholung_bis: b.abholung_bis || "", awb: b.awb || "", carrier: b.carrier || "", payment_intent: b.payment_intent || "", zahlung_ref: b.zahlung_ref || "",
    waehrung: b.waehrung || "EUR", positionen: (b.positionen || []).map((p) => ({ idx: p.idx, bezeichnung: p.bezeichnung, menge: Number(p.menge) || 0, einzel_cent: Number(p.einzel_cent) || 0, summe_cent: Number(p.summe_cent) || 0, ust_satz_promille: Number(p.ust_satz_promille) || 2000, zurueck_menge: Number(p.zurueck_menge) || 0, erstattet_cent: Number(p.erstattet_cent) || 0, bild: p.bild || "", slug: p.slug || "" })),
    sperre: ctx.sperre || null, vierAugenCent: ctx.vierAugenCent ?? 100000, abholungFristTage: ctx.abholungFristTage || 7, lieferschein: ctx.lieferschein || "",
  };
}

/** Zahlung → Zeile. */
export function zahlungZeile(z) {
  const st = statusInfo("PH Zahlung", z.status);
  const erst = z.art === "Erstattung";
  const bezugHref = z.bezug_doctype === "PH Bestellung" ? `/shop/bestellungen/${encodeURIComponent(z.bezug)}` : z.bezug_doctype === "PH Anzahlung" ? `/shop/anzahlungen/${encodeURIComponent(z.bezug)}` : z.bezug_doctype === "PH Gutschein Bestellung" ? `/shop/gutscheinkaeufe/${encodeURIComponent(z.bezug)}` : null;
  return {
    name: z.name, href: `/shop/zahlungen/${encodeURIComponent(z.name)}`, test: istTest("PH Zahlung", z),
    doc: { doctype: "PH Zahlung", name: z.name, betrag_cent: Number(z.betrag_cent), erstattet_cent: Number(z.erstattet_cent) || 0, kanal: z.kanal, bezug: z.bezug, status: z.status },
    zellen: {
      objekt: { titel: erst ? "Erstattung" : z.art || "Eingang", unter: `${z.name} · ${kanalText(z.kanal)}`, icon: erst ? "Undo2" : z.kanal === "Gutschein" ? "Ticket" : String(z.kanal).startsWith("Stripe") ? "CreditCard" : "Banknote" },
      zeit: { text: zeit(z.zeitpunkt), titel: datumZeit(z.zeitpunkt) },
      bezug: { text: z.bezug ? `${z.bezug_doctype === "PH Bestellung" ? "Bestellung" : z.bezug_doctype === "PH Anzahlung" ? "Anzahlung" : "Gutscheinkauf"} ${z.bezug}` : "–", href: bezugHref, unter: z.ursprung ? `zu ${z.ursprung}` : "" },
      betrag: { text: `${erst || Number(z.betrag_cent) < 0 ? "−" : ""}${cent(Math.abs(Number(z.betrag_cent)))}`, minus: erst || Number(z.betrag_cent) < 0 },
      status: { ...st, gebucht: Number(z.docstatus) === 1, chips: [...(z.dispute_status && !["won", "warning_closed"].includes(z.dispute_status) ? [{ id: "streit", text: "Zahlungsstreit", material: "eiche" }] : []), ...(risikoOffen(z) ? [{ id: "risiko", text: "Risiko prüfen", material: "eiche" }] : []), ...(istTest("PH Zahlung", z) ? [{ id: "test", text: "Test", material: "messing" }] : [])] },
      auszahlung: { text: z.stripe_auszahlung || "–" },
    },
  };
}

/** Gutschein → Zeile. */
export function gutscheinZeile(g) {
  const st = statusInfo("PH Gutschein", g.status, g);
  const anteil = Number(g.wert_cent) > 0 ? Number(g.rest_cent) / Number(g.wert_cent) : 0;
  return {
    name: g.name, href: `/shop/gutscheine/${encodeURIComponent(g.name)}`, test: Number(g.test) === 1,
    doc: { doctype: "PH Gutschein", name: g.name, code_letzte4: g.code_letzte4, rest_cent: Number(g.rest_cent), status: g.status, pdf: g.pdf ? 1 : 0 },
    zellen: {
      objekt: { titel: `····-${g.code_letzte4 || "????"}`, unter: g.name, icon: "Ticket", mono: true },
      wert: { text: cent(g.wert_cent) },
      rest: { text: cent(g.rest_cent), anteil },
      status: { ...st, chips: Number(g.test) === 1 ? [{ id: "test", text: "Test", material: "messing" }] : [] },
      ausgabe: { text: { Online: "Online", Showroom: "Showroom", Ersatz: "Ersatz", Kassa: "Kassa" }[g.kanal_ausgabe] || "–", unter: datum(g.ausgegeben_am) },
      person: { text: [g.kaeufer_name, g.empfaenger].filter(Boolean).join(" → ") || "–" },
      gueltig: { text: g.gueltig_bis ? datum(g.gueltig_bis) : "unbefristet" },
    },
  };
}

/** Gutscheinkauf → Zeile. */
export function kaufZeile(k) {
  const st = statusInfo("PH Gutschein Bestellung", k.status);
  return {
    name: k.name, href: `/shop/gutscheinkaeufe/${encodeURIComponent(k.name)}`, test: Number(k.livemode) === 0,
    doc: { doctype: "PH Gutschein Bestellung", name: k.name, status: k.status },
    zellen: {
      objekt: { titel: k.kaeufer_name || "–", unter: k.name, icon: "Gift" },
      wert: { text: `${k.anzahl} × ${cent(k.betrag_cent)}`, unter: cent(k.summe_cent) },
      status: st,
      zeit: { text: zeit(k.erstellt), titel: datumZeit(k.erstellt) },
      mail: { text: k.mail_gesendet_am ? datum(k.mail_gesendet_am) : "–" },
    },
  };
}

/** Widerruf → Zeile mit Fristen-Ampel. */
export function widerrufZeile(w, ctx = {}) {
  const h = ctx.heute || heuteIso();
  const st = statusInfo("PH Widerruf", w.status);
  const erledigt = ["Erstattet", "Abgelehnt"].includes(w.status);
  const b = ctx.bestellungen?.[w.bestellung];
  const z = b ? zustellung(b, ctx.lieferscheine?.[w.bestellung] || []) : { datum: null, geschaetzt: true };
  const fr = widerrufsFristen(w, z);
  const bis = w.erstattung_bis || fr.rueckzahlungBis;
  const a = ampel(bis, h, { erledigt });
  const prim = w.status === "Eingegangen" ? "widerruf-bestaetigen" : w.status === "Bestaetigt" && w.bestellung && !w.retoure ? "retoure-anlegen" : w.status === "Ware erwartet" && !w.retoure ? "ware-erhalten" : null;
  return {
    name: w.name, href: `/shop/widerrufe/${encodeURIComponent(w.name)}`,
    doc: { doctype: "PH Widerruf", name: w.name, status: w.status },
    aktion: prim ? { id: prim, titel: { "widerruf-bestaetigen": "Bestätigung senden", "retoure-anlegen": "Retoure anlegen", "ware-erhalten": "Ware erhalten" }[prim], icon: "Mail" } : null,
    zellen: {
      objekt: { titel: w.kunde_name || "–", unter: `${w.name} · ${w.kanal}`, icon: "Undo2" },
      zeit: { text: zeit(w.eingegangen_am), titel: datumZeit(w.eingegangen_am) },
      bezug: w.bestellung ? { text: w.bestellung, href: `/shop/bestellungen/${encodeURIComponent(w.bestellung)}` } : w.gutschein_bestellung ? { text: w.gutschein_bestellung, href: `/shop/gutscheinkaeufe/${encodeURIComponent(w.gutschein_bestellung)}` } : { text: "nicht zugeordnet", ton: "gefahr" },
      status: st,
      ampel: { ...a, text: erledigt ? "erledigt" : `Rückzahlung bis ${kurz(bis)} · ${a.text}`, unter: z.datum ? (z.geschaetzt ? "geschätzt ab Versand" : "ab Zustellung lt. Sendungsverfolgung") : "" },
      mail: { text: mailStatusText(w.mail_status) },
      betrag: { text: Number(w.erstattungsbetrag_cent) ? cent(w.erstattungsbetrag_cent) : "–" },
    },
  };
}

/** Retoure → Zeile. */
export function retoureZeile(r) {
  const st = statusInfo("PH Retoure", r.status);
  return {
    name: r.name, href: `/shop/retouren/${encodeURIComponent(r.name)}`,
    doc: { doctype: "PH Retoure", name: r.name, status: r.status },
    aktion: ["Angekuendigt", "Label gesendet", "Unterwegs"].includes(r.status) ? { id: "retoure-eingang", titel: "Ware eingegangen", icon: "PackageCheck" } : null,
    zellen: {
      objekt: { titel: r.bestellung, unter: `${r.name}${r.widerruf ? ` · ${r.widerruf}` : ""}`, icon: "PackageCheck" },
      zeit: { text: zeit(r.angekuendigt_am), titel: datumZeit(r.angekuendigt_am) },
      weg: { text: r.weg === "Showroom" ? "Showroom" : "Rücksendung", unter: r.eingegangen_am ? `Eingang ${datum(r.eingegangen_am)}` : "" },
      status: st,
      betrag: { text: Number(r.erstattungsbetrag_cent) ? cent(r.erstattungsbetrag_cent) : "–", unter: Number(r.wertminderung_cent) ? `Wertminderung ${cent(r.wertminderung_cent)}` : "" },
    },
  };
}

/** Anzahlung → Zeile. */
export function anzahlungZeile(a, h = heuteIso()) {
  const st = statusInfo("PH Anzahlung", a.status);
  const abgelaufen = ["offen", "fehlgeschlagen"].includes(a.status) && a.link_gueltig_bis && tagVon(a.link_gueltig_bis) < h;
  return {
    name: a.name, href: `/shop/anzahlungen/${encodeURIComponent(a.name)}`,
    doc: { doctype: "PH Anzahlung", name: a.name, status: a.status },
    aktion: ["offen", "fehlgeschlagen"].includes(a.status) ? { id: "anzahlung-link", titel: "Zahlungslink senden", icon: "Mail" } : null,
    zellen: {
      objekt: { titel: a.auftrag_referenz, unter: a.name, icon: "Wallet" },
      betrag: { text: cent(a.betrag_cent) },
      status: { ...st, chips: (a.doppelt || []).length ? [{ id: "doppelt", text: `${a.doppelt.length} doppelt`, material: "eiche" }] : [] },
      link: { text: a.link_gueltig_bis ? datum(a.link_gueltig_bis) : "–", unter: abgelaufen ? "abgelaufen" : a.link_gesendet_am ? `gesendet ${datum(a.link_gesendet_am)}` : "", unterTon: abgelaufen ? "warn" : undefined },
      bezahlt: { text: a.bezahlt_am ? datum(a.bezahlt_am) : "–" },
    },
  };
}

/** Stripe-Ereignis → Zeile. */
export function ereignisZeile(e) {
  const st = statusInfo("PH Stripe Ereignis", e.status);
  return {
    name: e.name, href: `/shop/stripe/ereignisse/${encodeURIComponent(e.name)}`,
    doc: { doctype: "PH Stripe Ereignis", name: e.name, status: e.status },
    aktion: ["fehler", "ignoriert"].includes(e.status) ? { id: "ereignis-erneut", titel: "Erneut", icon: "RefreshCw" } : null,
    zellen: {
      objekt: { titel: stripeTyp(e.typ), unter: e.typ, icon: "Inbox", monoUnter: true },
      zeit: { text: zeit(e.empfangen_am), titel: datumZeit(e.empfangen_am) },
      bezug: e.bezug ? { text: e.bezug, href: e.bezug_doctype === "PH Bestellung" ? `/shop/bestellungen/${encodeURIComponent(e.bezug)}` : e.bezug_doctype === "PH Zahlung" ? `/shop/zahlungen/${encodeURIComponent(e.bezug)}` : e.bezug_doctype === "PH Stripe Auszahlung" ? `/shop/stripe/auszahlungen/${encodeURIComponent(e.bezug)}` : null } : { text: "–" },
      status: st,
      versuche: { text: `${Number(e.versuche) || 1} ${Number(e.versuche) === 1 || !e.versuche ? "Versuch" : "Versuche"}`, unter: e.fehler ? String(e.fehler).slice(0, 80) : "", unterTon: e.fehler ? "gefahr" : undefined },
    },
  };
}

/** Auszahlung → Zeile. */
export function auszahlungZeile(p) {
  const st = statusInfo("PH Stripe Auszahlung", p.status);
  const diff = Number(p.differenz_cent) || 0;
  return {
    name: p.name, href: `/shop/stripe/auszahlungen/${encodeURIComponent(p.name)}`,
    doc: { doctype: "PH Stripe Auszahlung", name: p.name, status: p.status },
    aktion: { id: "abgleichen", titel: "Abgleichen", icon: "RefreshCw" },
    zellen: {
      objekt: { titel: `erwartet ${datum(p.datum_erwartet)}`, unter: p.name, icon: "Banknote" },
      betrag: { text: cent(p.betrag_cent) },
      brutto: { text: cent(p.brutto_cent) },
      gebuehren: { text: cent(p.gebuehren_cent) },
      differenz: { text: cent(diff), ton: diff !== 0 ? "gefahr" : undefined },
      status: st,
    },
  };
}
