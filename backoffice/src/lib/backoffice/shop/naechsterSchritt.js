// „Nächster Schritt“ einer Bestellung (10-konzept-shop § 6.1). Rein, unit-getestet.
// Reihenfolge der Regeln ist fachlich (erste passende gewinnt). Fälligkeit als ISO-Datum, Farbe nach § 6.1:
// überfällig rot, heute Sand (cognac), später grau.

import { offen } from "./geld.js";
import { risikoOffen } from "./status.js";
import { abschliessenAb, heute as heuteIso, plusWerktage, tageBis, tagVon } from "./fristen.js";

const VOR_VERSAND = new Set(["offen", "zahlung_ausstehend", "reserviert", "bezahlt", "versandbereit", "abholbereit", "pruefen"]);

/** UID + Lieferung nach DE und noch nicht geklärt (Kommentar/Notiz „Steuerfall geklärt“). */
export function steuerfallOffen(b) {
  return !!b?.rechnung_uid && b?.adresse_land === "DE" && b?.lieferart === "versand" && !/steuerfall geklärt/i.test(String(b?.notiz_intern || ""));
}

/**
 * @param {object} b  PH Bestellung
 * @param {{heute?:string, lieferscheine?:object[], rechnungen?:object[]}} [ctx]
 * @returns {{id:string|null, titel:string, aktion:string|null, faellig:string|null, ton:"rot"|"cognac"|"grau"|null, icon:string, leitung?:boolean, hinweis?:string}}
 */
export function naechsterSchritt(b, ctx = {}) {
  const h = ctx.heute || heuteIso();
  const o = offen(b);
  const s = b?.status;
  const mit = (id, titel, aktion, faellig, icon, extra = {}) => ({ id, titel, aktion, faellig: faellig ? tagVon(faellig) : null, ton: tonFuer(faellig, h, extra.sofort), icon, ...extra });

  if (s === "pruefen") return mit("pruefen", "Prüfen", "geprueft", h, "TriangleAlert", { sofort: true, leitung: true });
  if (risikoOffen(b) && VOR_VERSAND.has(s)) return mit("risiko", "Risiko ansehen", "risiko-geprueft", h, "ShieldAlert", { sofort: true });
  if (s === "zahlung_ausstehend") return { id: "unterwegs", titel: "Stripe-Zahlung unterwegs", aktion: null, faellig: null, ton: null, icon: "Clock" };
  if (s === "offen" && b.bestellart === "Telefon") return mit("link", "Zahlungslink nachfassen", "zahlungslink-senden", b.zahlungslink_gueltig_bis, "Mail");
  if (s === "reserviert" && o > 0) return mit("kassa", "An der Kassa kassieren", "an-die-kassa", b.abholung_bis, "Receipt");
  if (s === "reserviert") return mit("abholbereit", "Abholbereit melden", "abholbereit", b.abholung_bis, "ShoppingBag");
  if (s === "bezahlt" && b.lieferart === "versand" && steuerfallOffen(b)) return mit("steuerfall", "Steuerfall klären", null, h, "TriangleAlert", { sofort: true, leitung: true });
  if (s === "bezahlt" && b.lieferart === "versand") return mit("packen", "Packen", "packen", plusWerktage(b.bezahlt_am, 1), "Package");
  if (s === "bezahlt" && b.lieferart === "abholung") return mit("abholbereit", "Abholbereit melden", "abholbereit", plusWerktage(b.bezahlt_am, 1), "ShoppingBag");
  if (s === "versandbereit") return mit("versendet", "Versendet melden", "versendet", plusWerktage(b.bezahlt_am, 2), "Truck");
  if (s === "abholbereit" && o > 0) return mit("kassa", "An der Kassa kassieren", "an-die-kassa", b.abholung_bis, "Receipt");
  if (s === "abholbereit") return mit("uebergeben", "Übergeben", "uebergeben", b.abholung_bis, "CheckCheck");
  if ((s === "versendet" || s === "abgeholt") && (b.rechnung_uid || Number(b.rechnungswunsch) === 1) && !(ctx.rechnungen || []).length) {
    return mit("rechnung", "Rechnung erstellen", "rechnung", plusTage3(b.versendet_am || b.abgeholt_am), "FileText");
  }
  if (s === "versendet" || s === "abgeholt") return mit("abschliessen", "Abschließen", "abschliessen", abschliessenAb(b, ctx.lieferscheine || []), "Check");
  if (s === "storniert" && Number(b.betrag_bezahlt_cent || 0) > Number(b.erstattet_cent || 0)) return mit("erstatten", "Erstatten", "erstatten", h, "Undo2", { sofort: true, leitung: true });
  return { id: null, titel: "–", aktion: null, faellig: null, ton: null, icon: "Minus" };
}

function plusTage3(iso) {
  const t = tagVon(iso);
  if (!t) return null;
  const d = new Date(`${t}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 3);
  return d.toISOString().slice(0, 10);
}

function tonFuer(faellig, h, sofort) {
  if (sofort) return "rot";
  const t = tagVon(faellig);
  if (!t) return "grau";
  const d = tageBis(h, t);
  if (d < 0) return "rot";
  if (d === 0) return "cognac";
  return "grau";
}

/** „ruht seit n Tagen“ ab 2 Tagen ohne Verlaufseintrag (§ 6.1). */
export function ruhtSeit(b, h = heuteIso()) {
  const zeiten = (b?.verlauf || []).map((v) => tagVon(v.zeit)).filter(Boolean).sort();
  const letzte = zeiten.at(-1) || tagVon(b?.modified) || tagVon(b?.angelegt);
  const d = letzte ? tageBis(letzte, h) : null;
  return d !== null && d >= 2 ? d : 0;
}

/** Sortierschlüssel für Arbeitsansichten: Fälligkeit aufsteigend, ohne Fälligkeit zuletzt. */
export function faelligSchluessel(schritt) {
  if (!schritt?.faellig) return "9999-99-99";
  return schritt.ton === "rot" && !schritt.faellig ? "0000-00-00" : schritt.faellig;
}
