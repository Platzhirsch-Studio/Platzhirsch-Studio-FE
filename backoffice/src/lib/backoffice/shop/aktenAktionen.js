// Aktionen der übrigen Shop-Akten (10-konzept-shop § 5.2–5.8): Zahlung, Gutschein, Gutscheinkauf, Anzahlung,
// Widerruf, Retoure, Stripe-Ereignis, Auszahlung. Je Status genau eine Primäraktion; Leitungsaktionen für das Team
// sichtbar, aber gesperrt („Nur Shop-Leitung – anfragen“). Rein, unit-getestet.

import { T } from "./texte.js";
import { streitOffen, risikoOffen } from "./status.js";
import { belehrungNachweisbar } from "./fristen.js";

const A = (id, titel, icon, extra = {}) => ({ id, titel, icon, klasse: extra.klasse || "dialog", ...extra });
const L = (x, leitung) => (leitung ? x : { ...x, deaktiviert: true, grund: T.nurLeitung });
const leer = () => ({ primaer: null, sekundaer: [], menue: [] });

export function zahlungAktionen(z, { leitung = false, gf = false } = {}) {
  const r = leer();
  const kassa = ["Bar", "Karte extern", "Stripe Terminal"].includes(z.kanal);
  const rest = Number(z.betrag_cent) - Number(z.erstattet_cent || 0);
  if (z.art === "Erstattung") return r;
  if (z.status === "Angekuendigt" && Number(z.docstatus) === 0) {
    r.primaer = A("als-bezahlt", "Als bezahlt buchen", "Lock", { klasse: "bestaetigung" });
    r.menue.push(L(A("ankuendigung-stornieren", "Ankündigung stornieren", "CircleSlash", { gefaehrlich: true }), leitung));
  } else if (z.status === "Erstattung angefordert") {
    // Freigabe läuft über das Band (Zwei-Klick, GF)
  } else if (["Bezahlt", "Teilerstattet"].includes(z.status) && rest > 0) {
    r.primaer = kassa ? A("an-die-kassa", T.kassa.auszahlen, "Receipt", { klasse: "kassa", extra: { variante: "erstattung" } }) : L(A("rueckerstatten", z.kanal === "Gutschein" ? "Restwert auf Gutschein zurück" : "Erstatten …", "Undo2", { klasse: "geld" }), leitung);
  }
  if (risikoOffen(z)) r.sekundaer.push(A("risiko-geprueft", "Risiko geprüft", "ShieldAlert", { klasse: "feldwert" }));
  if (z.stripe_payment_intent) r.menue.push(A("stripe-oeffnen", "Im Stripe-Dashboard öffnen", "ArrowUpRight", { klasse: "link" }));
  if (String(z.kanal).startsWith("Stripe") && !z.stripe_auszahlung) r.menue.push(A("auszahlung-zuordnen", "Auszahlung zuordnen", "Banknote"));
  r.menue.push(A("drucken", "Beleg drucken", "Printer", { klasse: "link" }));
  void gf;
  return r;
}

export function zahlungBaender(z, { gf = false, user } = {}) {
  const out = [];
  if (z.status === "Erstattung angefordert") out.push({ id: "freigabe", ton: "warnung", freigabe: true, eigen: z.erstattung_angefordert_von === user, gf });
  if (streitOffen(z) || z.dispute_status === "lost") out.push({ id: "streit", ton: "gefahr" });
  if (risikoOffen(z)) out.push({ id: "risiko", ton: "warnung" });
  if (Number(z.docstatus) === 1) out.push({ id: "gebucht", ton: "neutral" });
  return out;
}

export function gutscheinAktionen(g, { leitung = false } = {}) {
  const r = leer();
  const einloesbar = ["Aktiv", "Teilweise eingeloest", "Erstellt"].includes(g.status) && Number(g.rest_cent) > 0;
  if (einloesbar) r.primaer = A("anrechnen", "Auf Bestellung anrechnen", "Ticket", { klasse: "geld" });
  if (g.pdf) r.sekundaer.push(A("pdf-senden", "PDF senden", "Mail", { klasse: "undo" }), A("drucken", "Drucken", "Printer", { klasse: "link" }));
  if (g.status === "Abgelaufen" && Number(g.rest_cent) > 0) r.sekundaer.push(L(A("gueltigkeit", "Gültigkeit verlängern", "CalendarPlus"), leitung));
  if (["Aktiv", "Teilweise eingeloest"].includes(g.status)) {
    r.menue.push(L(A("gutschein-sperren", "Sperren", "Lock", { gefaehrlich: true }), leitung));
    r.menue.push(L(A("gutschein-ersetzen", "Ersetzen", "RefreshCw", { klasse: "bestaetigung" }), leitung));
  }
  if (g.status === "Gesperrt" && g.sperrgrund_art !== "Ersetzt") r.menue.push(L(A("gutschein-entsperren", "Entsperren", "Lock"), leitung));
  return r;
}

export function kaufAktionen(k, { leitung = false } = {}) {
  const r = leer();
  if (k.status === "bezahlt") {
    r.primaer = A("gutschein-mail", "Gutschein-Mail erneut senden", "Mail", { klasse: "undo" });
    r.menue.push(L(A("kauf-erstatten", "Erstatten …", "Undo2", { klasse: "geld" }), leitung));
  }
  return r;
}

export function anzahlungAktionen(a, { leitung = false } = {}) {
  const r = leer();
  if (["offen", "fehlgeschlagen"].includes(a.status)) r.primaer = A("anzahlung-link", "Zahlungslink senden", "Mail", { klasse: "undo" });
  if ((a.doppelt || []).some((d) => Number(d.erstattet_cent || 0) < Number(d.betrag_cent || 0))) r.sekundaer.push(L(A("doppelte-erstatten", "Doppelte erstatten", "Undo2", { klasse: "geld" }), leitung));
  return r;
}

/**
 * @param {object} w Widerruf
 * @param {{leitung?:boolean, bestellung?:object, zust?:{datum,geschaetzt}, nachweis?:boolean}} ctx
 */
export function widerrufAktionen(w, ctx = {}) {
  const r = leer();
  const leitung = !!ctx.leitung;
  const nicht = !w.bestellung && !w.gutschein_bestellung;
  if (w.status === "Eingegangen") r.primaer = A("widerruf-bestaetigen", "Eingangsbestätigung senden", "Mail", { klasse: "undo" });
  else if (w.status === "Bestaetigt") r.primaer = w.bestellung ? A("retoure-anlegen", "Retoure anlegen", "PackageCheck", { klasse: "undo" }) : w.gutschein_bestellung ? L(A("widerruf-erstatten", "Erstatten …", "Undo2", { klasse: "geld" }), leitung) : null;
  else if (w.status === "Ware erwartet") r.primaer = w.retoure ? A("retoure-oeffnen", "Zur Retoure (Eingang buchen)", "ArrowRight", { klasse: "link", href: `/shop/retouren/${encodeURIComponent(w.retoure)}` }) : A("ware-erhalten", "Ware erhalten", "PackageCheck", { klasse: "undo" });
  else if (w.status === "Ware erhalten") r.primaer = L(A("widerruf-erstatten", "Erstatten …", "Undo2", { klasse: "geld" }), leitung);
  if (["Bestaetigt", "Ware erwartet"].includes(w.status) && w.bestellung) {
    const x = A("widerruf-erstatten", "Erstatten …", "Undo2", { klasse: "geld" });
    r.sekundaer.push(ctx.nachweis ? L({ ...x, extra: { nachweis: true } }, leitung) : { ...x, deaktiviert: true, grund: "Ware noch nicht da – Absendenachweis hochladen oder Eingang buchen" });
  }
  if (nicht) r.sekundaer.push(A("widerruf-zuordnen", "Zuordnen", "Search"));
  if (!["Erstattet", "Abgelehnt"].includes(w.status)) r.menue.push(L(A("widerruf-ablehnen", "Ablehnen", "CircleX", { gefaehrlich: true, extra: { fristErlaubt: !!(ctx.bestellung && ctx.zust?.datum && !ctx.zust.geschaetzt && belehrungNachweisbar(ctx.bestellung)) } }), leitung));
  r.menue.push(A("drucken", "Bestätigung drucken", "Printer", { klasse: "link" }));
  return r;
}

export function retoureAktionen(rt, { leitung = false } = {}) {
  const r = leer();
  if (["Angekuendigt", "Label gesendet", "Unterwegs"].includes(rt.status)) r.primaer = A("retoure-eingang", "Ware eingegangen", "PackageCheck", { klasse: "undo" });
  else if (rt.status === "Eingegangen") r.primaer = A("pruefung-abschliessen", "Prüfung abschließen", "BadgeCheck", { klasse: "bestaetigung" });
  else if (rt.status === "Geprueft") r.primaer = L(A("retoure-erstatten", "Erstatten …", "Undo2", { klasse: "geld" }), leitung);
  r.sekundaer.push(A("retourenlabel", "Retourenlabel", "Tag", { deaktiviert: true, grund: "Noch nicht verfügbar – Label in Logistik erstellen", ersatzHref: "/logistik" }));
  if (!["Erstattet", "Abgelehnt"].includes(rt.status)) r.menue.push(L(A("retoure-ablehnen", "Ablehnen", "CircleX", { gefaehrlich: true }), leitung));
  r.menue.push(A("drucken", "Begleitschein drucken", "Printer", { klasse: "link" }));
  return r;
}

export function ereignisAktionen(e, { leitung = false } = {}) {
  const r = leer();
  const x = A("ereignis-erneut", "Erneut verarbeiten", "RefreshCw", { klasse: "sofort" });
  r.primaer = ["fehler", "ignoriert"].includes(e.status) ? L(x, leitung) : null;
  return r;
}

export function auszahlungAktionen(p, { leitung = false } = {}) {
  return { primaer: L(A("abgleichen", "Abgleichen", "RefreshCw", { klasse: "sofort" }), leitung), sekundaer: [], menue: [] };
}
