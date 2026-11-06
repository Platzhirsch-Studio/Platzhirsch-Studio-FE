// Mock-Pfad der Shop-Methoden (MASTER § 5.3 Regel 5): bildet die Wirkung der ph_shop-Methoden (Stand v0.2) auf
// der Mock-Datenbank nach – Statuswechsel, Zahlungen, Gutscheine, Verlauf –, damit jeder Ablauf im Mock-Modus
// sichtbar durchläuft. Regeln wie im Python-Code (ph_bestellung.py, ph_zahlung.py, ph_gutschein.py …), plus die
// Backoffice-Schranken (E4, E7). Läuft nur mit einem MockClient (client.modus === "mock"). Rein (keine "@/"-Importe).

import { BackofficeError } from "../frappe/errors.js";
import { isoDatumZeit } from "../format.js";
import { offen, erstattungRechnen, verteileAufZahlungen, brauchtFreigabe } from "./geld.js";
import { istLeitung, istGF } from "./rechte.js";
import { heute, plusTage } from "./fristen.js";

const WF = {
  offen: "PH Offen", zahlung_ausstehend: "PH Zahlung ausstehend", bezahlt: "PH Bezahlt", versandbereit: "PH Versandbereit", versendet: "PH Versendet", reserviert: "PH Reserviert",
  abholbereit: "PH Abholbereit", abgeholt: "PH Abgeholt", abgeschlossen: "PH Abgeschlossen", fehlgeschlagen: "PH Fehlgeschlagen", abgelaufen: "PH Abgelaufen", storniert: "PH Storniert",
  widerrufen: "PH Widerrufen", erstattet: "PH Erstattet", teilerstattet: "PH Teilerstattet", checkout_fehler: "PH Checkout-Fehler", pruefen: "PH Pruefen",
};
const GS_WF = { Erstellt: "PH Erstellt", Aktiv: "PH Aktiv", "Teilweise eingeloest": "PH Teilweise eingeloest", Eingeloest: "PH Eingeloest", Gesperrt: "PH Gesperrt", Abgelaufen: "PH Abgelaufen", Erstattet: "PH Erstattet" };

const fehler = (code, text) => new BackofficeError(code, text);
const klon = (x) => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));

function tab(client, dt) {
  return client.tabelle(dt);
}
function hole(client, dt, name) {
  const d = tab(client, dt).get(dt === name ? dt : name);
  if (!d) throw fehler("not_found", "Datensatz wurde nicht gefunden.");
  return d;
}
function jetzt(client) {
  return isoDatumZeit(client.jetzt());
}
function wer(client) {
  return client.session?.name || client.session?.user || "";
}

/** Felder setzen ohne Workflow-Sperre (Mock der Server-Methoden), mit Version und Zeitstempel. */
function setze(client, dt, name, werte) {
  const alt = hole(client, dt, name);
  const neu = { ...alt, ...klon(werte) };
  if (werte.status && dt === "PH Bestellung") neu.workflow_state = WF[werte.status] || neu.workflow_state;
  if (werte.status && dt === "PH Gutschein") neu.workflow_state = GS_WF[werte.status] || neu.workflow_state;
  client.stempel(neu);
  tab(client, dt).set(name, neu);
  client.version(dt, name, alt, neu);
  return neu;
}

function verlauf(client, name, status, hinweis) {
  const b = hole(client, "PH Bestellung", name);
  const liste = [...(b.verlauf || []), { doctype: "PH Bestellung Verlauf", idx: (b.verlauf || []).length + 1, name: `v-${(b.verlauf || []).length + 1}`, parentfield: "verlauf", parenttype: "PH Bestellung", zeit: jetzt(client), status, hinweis: hinweis || "", von: wer(client) }];
  return setze(client, "PH Bestellung", name, { verlauf: liste });
}

function statusSetzen(client, name, status, hinweis, extra = {}) {
  setze(client, "PH Bestellung", name, { status, ...extra });
  return verlauf(client, name, status, hinweis);
}

function naechsterName(client, dt, praefix) {
  let max = 0;
  for (const n of tab(client, dt).keys()) {
    const m = new RegExp(`^${praefix.replace(/[.-]/g, (c) => `\\${c}`)}(\\d+)$`).exec(n);
    if (m) max = Math.max(max, Number(m[1]));
  }
  const breite = praefix.startsWith("PH-S-") ? 5 : praefix.startsWith("ANZ") || praefix.startsWith("GB") ? 4 : 5;
  return `${praefix}${String(max + 1).padStart(breite, "0")}`;
}

function neueZahlung(client, o) {
  const jahr = String(client.jetzt().getFullYear());
  const name = naechsterName(client, "PH Zahlung", `PH-ZAH-${jahr}-`);
  const doc = {
    doctype: "PH Zahlung", name, naming_series: "PH-ZAH-.YYYY.-.#####", titel: `${o.art || "Eingang"} ${o.kanal}`, art: o.art || "Eingang", kanal: o.kanal, status: o.status || "Bezahlt",
    betrag_cent: o.betrag, waehrung: "EUR", zeitpunkt: jetzt(client), livemode: o.livemode ?? 1, bezug_doctype: o.bezug_doctype || "PH Bestellung", bezug: o.bezug || "", kontakt: o.kontakt || "",
    ursprung: o.ursprung || "", zahlungsreferenz: o.referenz || "", gutschein: o.gutschein || "", erstattet_cent: 0, erstattungen: [], quelle: "backoffice",
    owner: client.session.user, creation: jetzt(client), modified: jetzt(client), modified_by: client.session.user, docstatus: o.status === "Angekuendigt" ? 0 : 1, idx: 0,
  };
  tab(client, "PH Zahlung").set(name, doc);
  client.version("PH Zahlung", name, null, doc);
  return doc;
}

function gutscheinNachCode(client, code) {
  const c = String(code || "").replace(/[^a-z0-9]/gi, "").toUpperCase();
  if (c.length < 4) return null;
  return [...tab(client, "PH Gutschein").values()].find((g) => c.endsWith(String(g.code_letzte4 || "").toUpperCase())) || null;
}

function leitung(client) {
  if (!istLeitung(client.session)) throw fehler("forbidden", "Das darf nur die Shop-Leitung.");
}

function eingaenge(client, b) {
  return [...tab(client, "PH Zahlung").values()].filter((z) => z.bezug === b.name && z.art !== "Erstattung" && z.docstatus === 1);
}

/** Erstattung verteilen (Karte/Überweisung zuerst, Gutschein zuletzt), Vier-Augen-Grenze, Gutschein-Rückbuchung. */
function geldZurueck(client, b, betrag, grund) {
  const st = tab(client, "PH Stripe Einstellungen").get("PH Stripe Einstellungen") || {};
  const { teile } = verteileAufZahlungen(betrag, eingaenge(client, b));
  const out = [];
  for (const t of teile) {
    out.push({ ...rueckerstatten(client, t.name, t.betrag_cent, grund, { grenze: st.vier_augen_ab_cent }), kanal: t.kanal });
  }
  return out;
}

function rueckerstatten(client, zahlungName, betrag, grund, { grenze } = {}) {
  const z = hole(client, "PH Zahlung", zahlungName);
  const rest = Number(z.betrag_cent) - Number(z.erstattet_cent || 0);
  if (betrag <= 0 || betrag > rest) throw fehler("invalid", `Betrag zwischen 0,01 € und ${(rest / 100).toFixed(2).replace(".", ",")} €.`);
  if (["Bar", "Karte extern", "Stripe Terminal"].includes(z.kanal)) throw fehler("invalid", "Erstattung an der Kassa auszahlen.");
  if (brauchtFreigabe(betrag, grenze ?? 100000) && !istGF(client.session)) {
    setze(client, "PH Zahlung", z.name, { status: "Erstattung angefordert", erstattung_angefordert_cent: betrag, erstattung_grund: grund || "", erstattung_angefordert_von: client.session.user, erstattung_angefordert_am: jetzt(client) });
    return { angefordert: true, zahlung: z.name, betrag_cent: betrag };
  }
  const gegen = neueZahlung(client, { art: "Erstattung", kanal: z.kanal, betrag: -betrag, bezug_doctype: z.bezug_doctype, bezug: z.bezug, kontakt: z.kontakt, ursprung: z.name, gutschein: z.gutschein });
  const erstattet = Number(z.erstattet_cent || 0) + betrag;
  const zeilen = [...(z.erstattungen || []), { doctype: "PH Zahlung Erstattung", idx: (z.erstattungen || []).length + 1, name: `er-${(z.erstattungen || []).length + 1}`, zeitpunkt: jetzt(client), betrag_cent: betrag, grund: grund || "", gegenbuchung: gegen.name, von: client.session.user, stripe_refund: String(z.kanal).startsWith("Stripe") ? "simuliert" : "" }];
  setze(client, "PH Zahlung", z.name, { erstattet_cent: erstattet, erstattungen: zeilen, status: erstattet >= Number(z.betrag_cent) ? "Erstattet" : "Teilerstattet", erstattung_angefordert_cent: 0 });
  if (z.kanal === "Gutschein" && z.gutschein) {
    const g = hole(client, "PH Gutschein", z.gutschein);
    const r = Number(g.rest_cent || 0) + betrag;
    setze(client, "PH Gutschein", g.name, { rest_cent: r, status: g.status === "Gesperrt" ? "Gesperrt" : r >= Number(g.wert_cent) ? "Aktiv" : "Teilweise eingeloest" });
  }
  if (z.bezug_doctype === "PH Bestellung" && z.bezug && tab(client, "PH Bestellung").has(z.bezug)) {
    const b = hole(client, "PH Bestellung", z.bezug);
    setze(client, "PH Bestellung", b.name, { erstattet_cent: Number(b.erstattet_cent || 0) + betrag });
  }
  return { gegenbuchung: gegen.name, zahlung: z.name, betrag_cent: betrag, simuliert: String(z.kanal).startsWith("Stripe") };
}

/**
 * Dokumentmethode im Mock ausführen.
 * @returns {Promise<any>} Rückgabewert wie die Python-Methode
 */
export async function mockMethode(client, doctype, name, methode, args = {}) {
  const meta = client.meta(doctype);
  client.pruefe(meta, ["erstattung_vorschau", "pruefen", "erstattung_freigeben", "erstattung_ablehnen"].includes(methode) ? "read" : "write");
  const h = heute(client.jetzt());
  if (doctype === "PH Bestellung") {
    const b = hole(client, doctype, name);
    const o = offen(b);
    switch (methode) {
      case "packen":
        if (b.status !== "bezahlt" || b.lieferart !== "versand") throw fehler("invalid", "Packen nur für bezahlte Versandbestellungen.");
        statusSetzen(client, name, "versandbereit", "Lieferschein angelegt (Mock)");
        return "versandbereit";
      case "versendet_melden":
        if (!["versandbereit", "bezahlt"].includes(b.status)) throw fehler("invalid", "Versendet nur aus versandbereit/bezahlt.");
        statusSetzen(client, name, "versendet", args.awb || "", { versendet_am: jetzt(client), awb: args.awb || b.awb || "", carrier: args.carrier || b.carrier || "" });
        return "versendet";
      case "abholbereit_melden": {
        if (b.lieferart !== "abholung") throw fehler("invalid", "Nur bei Abholung.");
        if (!["bezahlt", "reserviert"].includes(b.status)) throw fehler("invalid", "Abholbereit nur aus bezahlt oder reserviert.");
        const einst = tab(client, "PH Shop Einstellungen").get("PH Shop Einstellungen") || {};
        const code = b.abholcode || abholcode(client);
        const bis = plusTage(h, Number(einst.abholung_frist_tage) || 7);
        statusSetzen(client, name, "abholbereit", `Abholcode ${code}, bis ${bis}`, { abholcode: code, abholung_bis: bis, abholbereit_am: jetzt(client) });
        return code;
      }
      case "abgeholt_melden":
        if (b.status !== "abholbereit") throw fehler("invalid", "Nur aus „abholbereit“.");
        if (o > 0) throw fehler("invalid", "Zuerst die Zahlung an der Kassa erfassen.");
        statusSetzen(client, name, "abgeholt", args.hinweis || "", { abgeholt_am: jetzt(client) });
        return "abgeholt";
      case "abschliessen":
        if (!["versendet", "abgeholt"].includes(b.status)) throw fehler("invalid", "Abschließen nur aus versendet/abgeholt.");
        statusSetzen(client, name, "abgeschlossen");
        return "abgeschlossen";
      case "bestaetigung_senden":
        setze(client, doctype, name, { mail_status: "gesendet", mail_gesendet_am: jetzt(client) });
        verlauf(client, name, b.status, "Bestellbestätigung gesendet");
        return "gesendet";
      case "zahlungslink_erstellen": {
        const url = `https://checkout.stripe.com/c/pay/cs_test_sim_${name.slice(-5)}`;
        setze(client, doctype, name, { zahlungslink_url: url, zahlungslink_erstellt_am: jetzt(client), zahlungslink_gueltig_bis: isoDatumZeit(new Date(client.jetzt().getTime() + 24 * 3_600_000)), zahlungslink_simuliert: 1 });
        if (Number(args.senden)) return mockMethode(client, doctype, name, "zahlungslink_senden", {});
        verlauf(client, name, b.status, "Zahlungslink erstellt (simuliert)");
        return url;
      }
      case "zahlungslink_senden":
        if (!hole(client, doctype, name).zahlungslink_url) await mockMethode(client, doctype, name, "zahlungslink_erstellen", {});
        setze(client, doctype, name, { zahlungslink_gesendet_am: jetzt(client) });
        verlauf(client, name, b.status, "Zahlungslink gesendet");
        return "gesendet";
      case "abholcode_erneut_senden":
        if (b.status !== "abholbereit") throw fehler("invalid", "Nur bei abholbereiten Bestellungen.");
        verlauf(client, name, b.status, `Abholcode ${b.abholcode} erneut gesendet`);
        return b.abholcode;
      case "radar_geprueft":
        setze(client, doctype, name, { radar_geprueft_am: jetzt(client), radar_geprueft_von: client.session.user, radar_review: "geschlossen" });
        verlauf(client, name, b.status, `Risiko geprüft${args.notiz ? `: ${args.notiz}` : ""}`);
        return "geprueft";
      case "zahlung_erfassen": {
        if (o <= 0) throw fehler("invalid", "Nichts offen.");
        const betrag = Number(args.betrag_cent) || o;
        if (betrag > o) throw fehler("invalid", "Betrag übersteigt den offenen Betrag.");
        if (["Bar", "Karte extern", "Stripe Terminal", "Verrechnung"].includes(args.kanal)) throw fehler("invalid", "Bar und Karte nur an der Kassa.");
        const z = neueZahlung(client, { kanal: args.kanal || "Ueberweisung", betrag, bezug: name, kontakt: b.kontakt, referenz: args.referenz || "" });
        const bezahlt = Number(b.betrag_bezahlt_cent || 0) + betrag;
        const extra = { betrag_bezahlt_cent: bezahlt, offen_cent: Math.max(Number(b.gesamt_cent) - bezahlt, 0), zahlung_ref: b.zahlung_ref || z.name };
        if (bezahlt >= Number(b.gesamt_cent)) statusSetzen(client, name, b.status === "abholbereit" ? "abholbereit" : "bezahlt", "Überweisung erfasst", { ...extra, bezahlt_am: jetzt(client) });
        else {
          setze(client, doctype, name, extra);
          verlauf(client, name, b.status, `Teilzahlung ${betrag} Cent (Überweisung), offen ${extra.offen_cent} Cent`);
        }
        return z.name;
      }
      case "gutschein_einloesen": {
        const g = gutscheinNachCode(client, args.code);
        if (!g) throw fehler("invalid", "Gutschein nicht gefunden.");
        const betrag = Math.min(Number(args.betrag_cent) || o, Number(g.rest_cent), o);
        if (betrag <= 0) throw fehler("invalid", "Nichts offen oder Gutschein ohne Restwert.");
        const rest = Number(g.rest_cent) - betrag;
        const z = neueZahlung(client, { kanal: "Gutschein", betrag, bezug: name, kontakt: b.kontakt, gutschein: g.name });
        setze(client, "PH Gutschein", g.name, { rest_cent: rest, status: rest === 0 ? "Eingeloest" : "Teilweise eingeloest", einloesungen: [...(g.einloesungen || []), { doctype: "PH Gutschein Einloesung", idx: (g.einloesungen || []).length + 1, name: `e-${(g.einloesungen || []).length + 1}`, datum: jetzt(client), betrag_cent: betrag, rest_danach_cent: rest, kanal: "Online", beleg_doctype: doctype, beleg: name, mitarbeiter: client.session.user, zahlung: z.name }] });
        const bezahlt = Number(b.betrag_bezahlt_cent || 0) + betrag;
        const extra = { betrag_bezahlt_cent: bezahlt, offen_cent: Math.max(Number(b.gesamt_cent) - bezahlt, 0), zahlung_ref: b.zahlung_ref || z.name };
        if (bezahlt >= Number(b.gesamt_cent)) statusSetzen(client, name, b.status === "abholbereit" ? "abholbereit" : "bezahlt", `Gutschein ${g.name} eingelöst`, { ...extra, bezahlt_am: jetzt(client) });
        else {
          setze(client, doctype, name, extra);
          verlauf(client, name, b.status, `Gutschein ${g.name}: ${betrag} Cent angerechnet`);
        }
        return { gutschein: g.name, betrag_cent: betrag, rest_cent: rest, offen_cent: extra.offen_cent };
      }
      case "stornieren": {
        leitung(client);
        if (["storniert", "erstattet", "abgeschlossen", "versendet", "abgeholt", "widerrufen"].includes(b.status)) throw fehler("invalid", `Stornieren ist im Status „${b.status}“ nicht möglich.`);
        let r = [];
        if (Number(args.erstatten ?? 1) && Number(b.betrag_bezahlt_cent) > 0) {
          const off = eingaenge(client, b).reduce((s, z) => s + Number(z.betrag_cent) - Number(z.erstattet_cent || 0), 0);
          const betrag = Math.min(Number(args.betrag_cent) || off, off);
          if (betrag > 0) r = geldZurueck(client, b, betrag, args.grund || "Storno");
        }
        statusSetzen(client, name, "storniert", args.grund || "");
        return { status: "storniert", zahlungen: r };
      }
      case "erstattung_vorschau": {
        const nur = offen(b) > 0 && Number(b.betrag_bezahlt_cent || 0) === 0;
        const r = erstattungRechnen(b.positionen || [], args.zeilen || {}, { versand_cent: args.versand_cent, kulanz_cent: args.kulanz_cent });
        if (r.fehler) throw fehler("invalid", r.fehler);
        return { ...r, verteilung: nur ? [] : verteileAufZahlungen(r.betrag_cent, eingaenge(client, b)).teile, nur_forderung: nur };
      }
      case "teilerstatten": {
        leitung(client);
        if (!String(args.grund || "").trim()) throw fehler("invalid", "Bitte einen Grund angeben.");
        const r = erstattungRechnen(b.positionen || [], args.zeilen || {}, { versand_cent: args.versand_cent, kulanz_cent: args.kulanz_cent });
        if (r.fehler) throw fehler("invalid", r.fehler);
        const maxi = Number(b.betrag_bezahlt_cent || 0) - Number(b.erstattet_cent || 0);
        if (r.betrag_cent <= 0 || r.betrag_cent > maxi) throw fehler("invalid", "Nie mehr als bezahlt minus bereits erstattet.");
        const zs = geldZurueck(client, b, r.betrag_cent, args.grund);
        const pos = (hole(client, doctype, name).positionen || []).map((p) => {
          const z = r.zeilen.find((x) => x.key === String(p.idx));
          return z ? { ...p, zurueck_menge: Number(p.zurueck_menge || 0) + z.menge, erstattet_cent: Number(p.erstattet_cent || 0) + z.betrag_cent } : p;
        });
        const angefordert = zs.some((x) => x.angefordert);
        const art = args.art || (r.zeilen.length ? "Teilerstattung" : Number(args.kulanz_cent) ? "Kulanz" : "Versand");
        const er = [...(b.erstattungen || []), { doctype: "PH Bestellung Erstattung", idx: (b.erstattungen || []).length + 1, name: `be-${(b.erstattungen || []).length + 1}`, datum: jetzt(client), art, status: angefordert ? "angefordert" : "erstattet", betrag_cent: r.betrag_cent, ust_cent: r.ust_cent, netto_cent: r.betrag_cent - r.ust_cent, grund: args.grund, zahlungen: zs.map((x) => x.gegenbuchung || x.zahlung).join(", "), von: client.session.user }];
        setze(client, doctype, name, { positionen: pos, erstattungen: er });
        verlauf(client, name, b.status, `${art}: ${r.betrag_cent} Cent erstattet (${args.grund})`);
        return { betrag_cent: r.betrag_cent, ust_cent: r.ust_cent, posten: r.posten, zahlungen: zs, angefordert };
      }
      case "positionen_stornieren": {
        if (["storniert", "abgeschlossen", "erstattet", "versendet", "abgeholt", "widerrufen"].includes(b.status)) throw fehler("invalid", "Teilstorno ist in diesem Status nicht möglich.");
        if (!String(args.grund || "").trim()) throw fehler("invalid", "Bitte einen Grund angeben.");
        if (Number(b.betrag_bezahlt_cent || 0) > 0) return mockMethode(client, doctype, name, "teilerstatten", { ...args, art: "Teilstorno" });
        const r = erstattungRechnen(b.positionen || [], args.zeilen || {});
        if (r.fehler) throw fehler("invalid", r.fehler);
        const pos = (b.positionen || []).map((p) => {
          const z = r.zeilen.find((x) => x.key === String(p.idx));
          return z ? { ...p, menge: p.menge - z.menge, summe_cent: p.summe_cent - z.betrag_cent, storniert_menge: Number(p.storniert_menge || 0) + z.menge } : p;
        }).filter((p) => p.menge > 0);
        if (!pos.length) throw fehler("invalid", "Alle Positionen storniert – bitte die ganze Bestellung stornieren.");
        const gesamt = Number(b.gesamt_cent) - r.betrag_cent;
        setze(client, doctype, name, { positionen: pos, gesamt_cent: gesamt, offen_cent: gesamt, storniert_cent: Number(b.storniert_cent || 0) + r.betrag_cent, zahlungslink_url: "" });
        verlauf(client, name, b.status, `Teilstorno ${r.betrag_cent} Cent (${args.grund})`);
        return { betrag_cent: r.betrag_cent, gesamt_cent: gesamt, neuerLink: !!b.zahlungslink_url };
      }
      case "ersatzlieferung_anlegen": {
        if (!String(args.grund || "").trim()) throw fehler("invalid", "Bitte einen Grund angeben.");
        const neu = naechsterName(client, doctype, `PH-S-${h.slice(2, 4)}${h.slice(5, 7)}${h.slice(8, 10)}-`);
        const auswahl = args.zeilen || Object.fromEntries((b.positionen || []).map((p) => [String(p.idx), p.menge]));
        const pos = (b.positionen || []).filter((p) => Number(auswahl[String(p.idx)] || 0) > 0).map((p, i) => ({ ...p, idx: i + 1, name: `pos-${i + 1}`, menge: Number(auswahl[String(p.idx)]), einzel_cent: 0, summe_cent: 0, zurueck_menge: 0, erstattet_cent: 0 }));
        const doc = { ...klon(b), name: neu, bestellnummer: neu, bestellart: "Ersatz", ersatz_fuer: name, ersatz_grund: String(args.grund).slice(0, 140), lieferart: args.lieferart || b.lieferart, positionen: pos, waren_cent: 0, versand_cent: 0, gesamt_cent: 0, offen_cent: 0, betrag_bezahlt_cent: 0, erstattet_cent: 0, status: "bezahlt", workflow_state: WF.bezahlt, angelegt: jetzt(client), bezahlt_am: jetzt(client), verlauf: [], erstattungen: [], zahlung_ref: "", payment_intent: "", awb: "", versendet_am: "", abholcode: "", abgeholt_am: "", widerruf: "", retoure: "", quelle: "backoffice", radar_markiert: 0, creation: jetzt(client), modified: jetzt(client) };
        tab(client, doctype).set(neu, doc);
        client.version(doctype, neu, null, doc);
        verlauf(client, neu, "bezahlt", `Ersatzlieferung 0 € zu ${name}`);
        verlauf(client, name, b.status, `Ersatzlieferung ${neu} angelegt (${args.grund})`);
        return neu;
      }
      case "widerruf_anlegen": {
        const jahr = h.slice(0, 4);
        const wn = naechsterName(client, "PH Widerruf", `PH-WID-${jahr}-`);
        const doc = { doctype: "PH Widerruf", name: wn, naming_series: "PH-WID-.YYYY.-.#####", eingangsnummer: wn.slice(-5), titel: `Widerruf ${b.kunde_name}`, status: "Eingegangen", kanal: args.kanal || "E-Mail", eingegangen_am: jetzt(client), zugeordnet: 1, bestellung: name, kunde_name: b.kunde_name, kunde_email: b.kunde_email, bestellt_am: String(b.angelegt).slice(0, 10), erhalten_am: String(b.versendet_am || b.abgeholt_am || "").slice(0, 10), nachricht: args.text || "", positionen: [], frist_ende: plusTage(String(b.versendet_am || b.abgeholt_am || h).slice(0, 10), 14), fristgerecht: 1, rueckgabe_bis: plusTage(h, 14), erstattung_bis: plusTage(h, 14), mail_status: "gesendet", bestaetigung_gesendet_am: jetzt(client), quelle: "backoffice", owner: client.session.user, creation: jetzt(client), modified: jetzt(client), docstatus: 0, idx: 0 };
        tab(client, "PH Widerruf").set(wn, doc);
        client.version("PH Widerruf", wn, null, doc);
        setze(client, doctype, name, { widerruf: wn });
        verlauf(client, name, b.status, `Widerruf ${wn} erfasst (${args.kanal || "E-Mail"})`);
        return wn;
      }
      case "abholung_zuruecknehmen":
        leitung(client);
        if (b.status !== "abgeholt") throw fehler("invalid", "Nur aus „abgeholt“.");
        statusSetzen(client, name, "abholbereit", `Übergabe zurückgenommen: ${args.grund || ""}`, { abgeholt_am: "" });
        return "abholbereit";
      case "rechnung_erstellen":
        throw fehler("unavailable", "Noch nicht verfügbar – Rechnung in Faktura erstellen.");
      default:
        throw fehler("not_found", `Methode ${methode} ist im Mock nicht hinterlegt.`);
    }
  }

  if (doctype === "PH Zahlung") {
    const z = hole(client, doctype, name);
    const st = tab(client, "PH Stripe Einstellungen").get("PH Stripe Einstellungen") || {};
    switch (methode) {
      case "rueckerstatten":
        leitung(client);
        return rueckerstatten(client, name, Number(args.betrag_cent), args.grund, { grenze: st.vier_augen_ab_cent });
      case "erstattung_freigeben": {
        if (!istGF(client.session)) throw fehler("forbidden", "Nur die Geschäftsführung gibt frei.");
        if (z.status !== "Erstattung angefordert") throw fehler("conflict", "Keine Erstattung angefordert.");
        if (z.erstattung_angefordert_von === client.session.user) throw fehler("forbidden", "Eigener Antrag – zweite Person nötig.");
        const betrag = Number(z.erstattung_angefordert_cent);
        setze(client, doctype, name, { status: Number(z.erstattet_cent || 0) > 0 ? "Teilerstattet" : "Bezahlt" });
        return rueckerstatten(client, name, betrag, `${z.erstattung_grund || "Erstattung"} (freigegeben)`, { grenze: Number.MAX_SAFE_INTEGER });
      }
      case "erstattung_ablehnen":
        if (!istGF(client.session)) throw fehler("forbidden", "Nur die Geschäftsführung entscheidet.");
        setze(client, doctype, name, { status: Number(z.erstattet_cent || 0) > 0 ? "Teilerstattet" : "Bezahlt", erstattung_angefordert_cent: 0, notiz: `Erstattung abgelehnt: ${args.grund || ""}` });
        return "abgelehnt";
      case "ankuendigung_stornieren":
        leitung(client);
        if (z.status !== "Angekuendigt") throw fehler("invalid", "Nur angekündigte Zahlungen.");
        setze(client, doctype, name, { status: "Storniert", notiz: args.grund || "" });
        return "storniert";
      case "radar_geprueft":
        setze(client, doctype, name, { radar_geprueft_am: jetzt(client), radar_geprueft_von: client.session.user, radar_review: "geschlossen" });
        return "geprueft";
      case "auszahlung_zuordnen":
        setze(client, doctype, name, { stripe_auszahlung: args.auszahlung || "" });
        return "zugeordnet";
      default:
        throw fehler("not_found", `Methode ${methode} ist im Mock nicht hinterlegt.`);
    }
  }

  if (doctype === "PH Gutschein") {
    const g = hole(client, doctype, name);
    switch (methode) {
      case "sperren":
        leitung(client);
        setze(client, doctype, name, { status: "Gesperrt", gesperrt_am: jetzt(client), sperrgrund: args.grund || "gesperrt", sperrgrund_art: args.sperrgrund_art || "Sonstiges" });
        return "gesperrt";
      case "entsperren":
        leitung(client);
        setze(client, doctype, name, { status: Number(g.rest_cent) < Number(g.wert_cent) ? "Teilweise eingeloest" : "Aktiv", gesperrt_am: "", sperrgrund: "", sperrgrund_art: "", hinweis: `Entsperrt: ${args.grund || ""}` });
        return "aktiv";
      case "ersetzen": {
        leitung(client);
        const code = neuerCode(client);
        const jahr = h.slice(0, 4);
        const neu = naechsterName(client, doctype, `PH-GS-${jahr}-`);
        const doc = { ...klon(g), name: neu, titel: `Gutschein ····-${code.slice(-4)}`, status: "Aktiv", workflow_state: GS_WF.Aktiv, wert_cent: g.rest_cent, rest_cent: g.rest_cent, code_letzte4: code.slice(-4), ausgegeben_am: jetzt(client), kanal_ausgabe: "Ersatz", einloesungen: [], gesperrt_am: "", sperrgrund: "", sperrgrund_art: "", ersetzt_durch: "", hinweis: `Ersatz für ${name}`, pdf: "", creation: jetzt(client), modified: jetzt(client) };
        tab(client, doctype).set(neu, doc);
        client.version(doctype, neu, null, doc);
        setze(client, doctype, name, { status: "Gesperrt", gesperrt_am: jetzt(client), sperrgrund: "Ersetzt", sperrgrund_art: "Ersetzt", ersetzt_durch: neu });
        return { gutschein: neu, code, rest_cent: g.rest_cent };
      }
      case "pdf_senden":
        if (!g.pdf) throw fehler("invalid", "Code liegt nicht mehr im Klartext vor – „Ersetzen“ erzeugt einen neuen.");
        setze(client, doctype, name, { mail_gesendet_am: jetzt(client) });
        return "gesendet";
      default:
        throw fehler("not_found", `Methode ${methode} ist im Mock nicht hinterlegt.`);
    }
  }

  if (doctype === "PH Gutschein Bestellung") {
    const k = hole(client, doctype, name);
    if (methode === "codes_erneut_senden") {
      setze(client, doctype, name, { mail_gesendet_am: jetzt(client) });
      return "gesendet";
    }
    if (methode === "erstatten") {
      leitung(client);
      const ungenutzt = (k.gutscheine || []).map((c) => tab(client, "PH Gutschein").get(c.gutschein)).filter((g) => g && Number(g.rest_cent) === Number(g.wert_cent));
      const max = ungenutzt.reduce((s, g) => s + Number(g.rest_cent), 0);
      const betrag = Math.min(Number(args.betrag_cent) || max, max);
      if (betrag <= 0) throw fehler("invalid", "Eingelöste Anteile sind nicht erstattbar.");
      for (const g of ungenutzt) setze(client, "PH Gutschein", g.name, { status: "Erstattet", rest_cent: 0 });
      if (k.zahlung) rueckerstatten(client, k.zahlung, betrag, args.grund || "Erstattung Gutscheinkauf", { grenze: Number.MAX_SAFE_INTEGER });
      setze(client, doctype, name, { status: betrag >= Number(k.summe_cent) ? "erstattet" : "teilerstattet", erstattet_cent: betrag });
      return { betrag_cent: betrag };
    }
  }

  if (doctype === "PH Anzahlung") {
    const a = hole(client, doctype, name);
    if (methode === "link_senden") {
      setze(client, doctype, name, { link_gesendet_am: jetzt(client), link_gueltig_bis: isoDatumZeit(new Date(client.jetzt().getTime() + 7 * 86_400_000)), status: a.status === "fehlgeschlagen" ? "offen" : a.status });
      return "gesendet";
    }
    if (methode === "doppelte_erstatten") {
      leitung(client);
      const d = (a.doppelt || []).map((x) => ({ ...x, erstattet_cent: x.betrag_cent, erstattet_am: jetzt(client) }));
      setze(client, doctype, name, { doppelt: d, status: "bezahlt" });
      return { betrag_cent: d.reduce((s, x) => s + Number(x.betrag_cent || 0), 0) };
    }
  }

  if (doctype === "PH Widerruf") {
    const w = hole(client, doctype, name);
    switch (methode) {
      case "bestaetigung_senden":
        setze(client, doctype, name, { status: w.status === "Eingegangen" ? "Bestaetigt" : w.status, mail_status: "gesendet", bestaetigung_gesendet_am: jetzt(client) });
        return "gesendet";
      case "retoure_anlegen": {
        if (!w.bestellung) throw fehler("invalid", "Erst einer Bestellung zuordnen.");
        const rn = naechsterName(client, "PH Retoure", `PH-RET-${h.slice(0, 4)}-`);
        const doc = { doctype: "PH Retoure", name: rn, naming_series: "PH-RET-.YYYY.-.#####", titel: `Retoure ${w.bestellung}`, status: "Angekuendigt", bestellung: w.bestellung, widerruf: name, angekuendigt_am: jetzt(client), weg: "Ruecksendung", positionen: (w.positionen || []).map((p, i) => ({ doctype: "PH Retoure Position", idx: i + 1, name: `rp-${i + 1}`, slug: p.slug, bezeichnung: p.bezeichnung, menge: p.menge, zustand: "neu", wiedereinlagern: 1, wertminderung_cent: 0 })), wertminderung_cent: 0, erstattungsbetrag_cent: w.erstattungsbetrag_cent || 0, quelle: "backoffice", owner: client.session.user, creation: jetzt(client), modified: jetzt(client), docstatus: 0, idx: 0 };
        tab(client, "PH Retoure").set(rn, doc);
        client.version("PH Retoure", rn, null, doc);
        setze(client, doctype, name, { retoure: rn, status: "Ware erwartet" });
        return rn;
      }
      case "ware_erhalten":
        setze(client, doctype, name, { status: "Ware erhalten" });
        return "erhalten";
      case "erstatten": {
        leitung(client);
        const b = w.bestellung ? hole(client, "PH Bestellung", w.bestellung) : null;
        if (!b) throw fehler("invalid", "Nicht zugeordnet.");
        const betrag = Number(args.betrag_cent) || Number(w.erstattungsbetrag_cent);
        const r = geldZurueck(client, b, betrag, args.grund || `Widerruf ${name}`);
        setze(client, doctype, name, { status: "Erstattet", erstattungsbetrag_cent: betrag, erstattung: r[0]?.gegenbuchung || "" });
        statusSetzen(client, b.name, "widerrufen", `Widerruf ${name}`);
        return { betrag_cent: betrag, zahlungen: r };
      }
      case "ablehnen":
        leitung(client);
        if (!String(args.grund || "").trim()) throw fehler("invalid", "Bitte einen Grund angeben.");
        setze(client, doctype, name, { status: "Abgelehnt", ablehnungsgrund: args.grund });
        return "abgelehnt";
      default:
        throw fehler("not_found", `Methode ${methode} ist im Mock nicht hinterlegt.`);
    }
  }

  if (doctype === "PH Retoure") {
    const r = hole(client, doctype, name);
    switch (methode) {
      case "eingegangen":
        if (!["Angekuendigt", "Label gesendet", "Unterwegs"].includes(r.status)) throw fehler("invalid", "Eingang schon gebucht.");
        setze(client, doctype, name, { status: "Eingegangen", eingegangen_am: jetzt(client) });
        if (r.widerruf && tab(client, "PH Widerruf").has(r.widerruf)) setze(client, "PH Widerruf", r.widerruf, { status: "Ware erhalten" });
        return "eingegangen";
      case "pruefung_abschliessen":
        if (r.status !== "Eingegangen") throw fehler("invalid", "Erst den Eingang buchen.");
        setze(client, doctype, name, { status: "Geprueft", geprueft_am: jetzt(client), geprueft_von: client.session.user });
        return "geprueft";
      case "erstatten": {
        leitung(client);
        const b = hole(client, "PH Bestellung", r.bestellung);
        const zs = geldZurueck(client, b, Number(r.erstattungsbetrag_cent), args.grund || `Retoure ${name}`);
        setze(client, doctype, name, { status: "Erstattet", erstattung: zs[0]?.gegenbuchung || "" });
        return { betrag_cent: r.erstattungsbetrag_cent, zahlungen: zs };
      }
      case "ablehnen":
        leitung(client);
        setze(client, doctype, name, { status: "Abgelehnt", hinweis: args.grund || "" });
        return "abgelehnt";
      default:
        throw fehler("not_found", `Methode ${methode} ist im Mock nicht hinterlegt.`);
    }
  }

  if (doctype === "PH Stripe Ereignis" && methode === "erneut_verarbeiten") {
    leitung(client);
    const e = hole(client, doctype, name);
    setze(client, doctype, name, { status: "verarbeitet", versuche: Number(e.versuche || 0) + 1, verarbeitet_am: jetzt(client), ergebnis: "erneut verarbeitet – keine doppelte Buchung", fehler: "" });
    return "verarbeitet";
  }
  if (doctype === "PH Stripe Auszahlung" && methode === "abgleichen") {
    leitung(client);
    const p = hole(client, doctype, name);
    const summe = (p.zahlungen || []).reduce((s, z) => s + Number(z.netto_cent || 0), 0);
    const diff = (p.zahlungen || []).length ? Number(p.betrag_cent) - summe : 0;
    setze(client, doctype, name, { differenz_cent: diff, status: diff === 0 && ["bezahlt", "abgeglichen"].includes(p.status) ? "abgeglichen" : p.status, abgeglichen_am: jetzt(client) });
    const st = tab(client, "PH Stripe Einstellungen").get("PH Stripe Einstellungen");
    if (st) st.letzter_abgleich = jetzt(client);
    return { differenz_cent: diff };
  }
  if (doctype === "PH Stripe Einstellungen" && methode === "pruefen") {
    const s = hole(client, doctype, doctype);
    return { schluessel: !!Number(s.schluessel_vorhanden), webhook: !!Number(s.webhook_secret_vorhanden), simulation: !!Number(s.simulation), modus: Number(s.testmodus) ? "test" : "live" };
  }
  throw fehler("not_found", `Methode ${methode} ist im Mock nicht hinterlegt.`);
}

function abholcode(client) {
  const zeichen = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const n = tab(client, "PH Bestellung").size + Number(String(client.jetzt().getTime()).slice(-4));
  let c = "";
  for (let i = 0, x = n * 7919; i < 6; i++, x = Math.floor(x / 32) + i * 131) c += zeichen[x % 32];
  return c;
}

function neuerCode(client) {
  const zeichen = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let x = client.jetzt().getTime();
  const teile = [];
  for (let t = 0; t < 4; t++) {
    let s = "";
    for (let i = 0; i < 4; i++) {
      s += zeichen[x % 32];
      x = Math.floor(x / 7) + 977 * (i + t + 1);
    }
    teile.push(s);
  }
  return `PH-${teile.join("-")}`;
}

/**
 * Whitelisted API-Methoden im Mock (api.backoffice.*, api.get_pickup_status).
 */
export async function mockCall(client, method, args = {}) {
  const h = heute(client.jetzt());
  switch (method) {
    case "ph_shop.api.backoffice.check_voucher": {
      const g = gutscheinNachCode(client, args.code);
      if (!g) return { ok: false, fehler: "nicht gefunden" };
      if (g.status === "Gesperrt") return { ok: false, fehler: "gesperrt", name: g.name };
      if (g.status === "Abgelaufen" || (g.gueltig_bis && g.gueltig_bis < h)) return { ok: false, fehler: `abgelaufen am ${String(g.gueltig_bis).split("-").reverse().join(".")}`, name: g.name };
      if (["Eingeloest", "Erstattet"].includes(g.status) || Number(g.rest_cent) <= 0) return { ok: false, fehler: "ohne Restwert", name: g.name };
      return { ok: true, name: g.name, rest_cent: Number(g.rest_cent), wert_cent: Number(g.wert_cent), art: g.art, gueltig_bis: g.gueltig_bis || null, test: Number(g.test) === 1, code_letzte4: g.code_letzte4 };
    }
    case "ph_shop.api.backoffice.issue_voucher": {
      if (!istLeitung(client.session)) throw fehler("forbidden", "Nur die Shop-Leitung stellt Gutscheine ohne Verkauf aus.");
      const einst = tab(client, "PH Shop Einstellungen").get("PH Shop Einstellungen") || {};
      const w = Number(args.wert_cent);
      if (w < Number(einst.gutschein_min_cent || 0) || (Number(einst.gutschein_max_cent) && w > Number(einst.gutschein_max_cent))) throw fehler("invalid", `Wert zwischen ${(Number(einst.gutschein_min_cent) / 100).toFixed(2)} € und ${(Number(einst.gutschein_max_cent) / 100).toFixed(2)} €.`);
      const code = neuerCode(client);
      const name = naechsterName(client, "PH Gutschein", `PH-GS-${h.slice(0, 4)}-`);
      const doc = { doctype: "PH Gutschein", name, naming_series: "PH-GS-.YYYY.-.#####", titel: `Gutschein ····-${code.slice(-4)}`, status: "Aktiv", workflow_state: GS_WF.Aktiv, art: "Mehrzweck", test: Number(args.test) ? 1 : 0, wert_cent: w, rest_cent: w, waehrung: "EUR", code_hash: "sha256:verborgen", code_letzte4: code.slice(-4), ausgegeben_am: jetzt(client), kanal_ausgabe: "Showroom", gueltig_bis: Number(einst.gutschein_gueltig_jahre) ? plusTage(h, 365 * Number(einst.gutschein_gueltig_jahre)) : "", motiv: args.motiv || "schlicht", empfaenger: args.empfaenger || "", grusstext: args.grusstext || "", einloesungen: [], kaeufer_name: args.kaeufer_name || "", kaeufer_email: args.kaeufer_email || "", kaeufer_kontakt: args.kontakt || "", hinweis: `Ohne Verkauf: ${args.grund || ""}`, pdf: `/private/files/gutschein-${code.slice(-4)}.pdf`, livemode: Number(args.test) ? 0 : 1, quelle: "backoffice", owner: client.session.user, creation: jetzt(client), modified: jetzt(client), docstatus: 0, idx: 0 };
      tab(client, "PH Gutschein").set(name, doc);
      client.version("PH Gutschein", name, null, doc);
      client.kommentar("PH Gutschein", name, `Ausgabe ohne Verkauf – Grund: ${args.grund || ""}`, "Comment");
      return { gutschein: name, code, wert_cent: w };
    }
    case "ph_shop.api.backoffice.cancel_voucher_redemption": {
      leitung(client);
      const g = hole(client, "PH Gutschein", args.gutschein);
      const e = (g.einloesungen || []).find((x) => x.beleg === args.beleg);
      if (!e) throw fehler("not_found", "Einlösung nicht gefunden.");
      const rest = Number(g.rest_cent) + Number(e.betrag_cent);
      setze(client, "PH Gutschein", g.name, { rest_cent: rest, status: rest >= Number(g.wert_cent) ? "Aktiv" : "Teilweise eingeloest", einloesungen: (g.einloesungen || []).filter((x) => x !== e), hinweis: `Einlösung ${args.beleg} zurückgenommen: ${args.grund || ""}` });
      if (e.zahlung && tab(client, "PH Zahlung").has(e.zahlung)) {
        const z = hole(client, "PH Zahlung", e.zahlung);
        setze(client, "PH Zahlung", z.name, { status: "Storniert" });
        if (args.beleg_doctype === "PH Bestellung" && tab(client, "PH Bestellung").has(args.beleg)) {
          const b = hole(client, "PH Bestellung", args.beleg);
          const bezahlt = Math.max(Number(b.betrag_bezahlt_cent || 0) - Number(e.betrag_cent), 0);
          setze(client, "PH Bestellung", b.name, { betrag_bezahlt_cent: bezahlt, offen_cent: Math.max(Number(b.gesamt_cent) - bezahlt, 0) });
          verlauf(client, b.name, b.status, `Gutschein-Einlösung zurückgenommen (${args.grund || ""})`);
        }
      }
      return { rest_cent: rest };
    }
    case "ph_shop.api.backoffice.credit_voucher": {
      leitung(client);
      const g = hole(client, "PH Gutschein", args.gutschein);
      const rest = Number(g.rest_cent) + Number(args.betrag_cent);
      setze(client, "PH Gutschein", g.name, { rest_cent: rest, status: g.status === "Abgelaufen" ? "Abgelaufen" : "Teilweise eingeloest" });
      return { rest_cent: rest };
    }
    case "ph_shop.api.backoffice.create_phone_order": {
      const pos = (Array.isArray(args.positionen) ? args.positionen : JSON.parse(args.positionen || "[]")).map((p, i) => ({ doctype: "PH Bestellung Position", idx: i + 1, name: `pos-${i + 1}`, parentfield: "positionen", parenttype: "PH Bestellung", produkt: p.produkt || "", slug: p.slug || "", bezeichnung: p.bezeichnung, marke: p.marke || "", menge: Number(p.menge) || 1, einzel_cent: Number(p.einzel_cent), summe_cent: Number(p.einzel_cent) * (Number(p.menge) || 1), ust_klasse: "normal", ust_satz_promille: 2000, zurueck_menge: 0, erstattet_cent: 0, storniert_menge: 0, bild: p.bild || "" }));
      if (!pos.length) throw fehler("invalid", "Mindestens eine Position.");
      const kunde = typeof args.kunde === "string" ? JSON.parse(args.kunde) : args.kunde || {};
      if (!kunde.email) throw fehler("invalid", "Für eine Bestellung braucht es eine E-Mail-Adresse.");
      const showroom = args.bestellart === "Showroom";
      const lieferart = showroom ? "abholung" : args.lieferart || "versand";
      const adr = typeof args.adresse === "string" ? JSON.parse(args.adresse || "{}") : args.adresse || {};
      if (lieferart === "versand" && adr.land === "CH") throw fehler("invalid", "Versand in die Schweiz wird nicht angeboten – Abholung möglich.");
      if (args.idempotency_key) {
        const doppelt = [...tab(client, "PH Bestellung").values()].find((x) => x.idempotency_key === args.idempotency_key);
        if (doppelt) return { name: doppelt.name, doppelt: true };
      }
      const waren = pos.reduce((s, p) => s + p.summe_cent, 0);
      const versand = lieferart === "versand" ? Number(args.versand_cent || 0) : 0;
      const gesamt = waren + versand;
      const name = naechsterName(client, "PH Bestellung", `PH-S-${h.slice(2, 4)}${h.slice(5, 7)}${h.slice(8, 10)}-`);
      const einst = tab(client, "PH Shop Einstellungen").get("PH Shop Einstellungen") || {};
      const doc = {
        doctype: "PH Bestellung", name, naming_series: "PH-S-.YY.MM.DD.-.#####", bestellnummer: name, titel: `Bestellung ${kunde.name}`, status: showroom ? "reserviert" : "offen", workflow_state: showroom ? WF.reserviert : WF.offen,
        modus: einst.shop_modus === "live" ? "live" : "test", angelegt: jetzt(client), lieferart, zahlung: showroom ? "vorort" : "online", bestellart: showroom ? "Showroom" : "Telefon", sprache: args.sprache || "de",
        zugewiesen_an: client.session.user, bestaetigung_unterdruecken: 1, positionen: pos, waren_cent: waren, versand_cent: versand, gesamt_cent: gesamt, offen_cent: gesamt, waehrung: "EUR", ust_cent: Math.round((gesamt * 0.2) / 1.2),
        kontakt: args.kontakt || "", kunde_name: kunde.name, kunde_email: kunde.email, kunde_telefon: kunde.telefon || "", adresse_land: adr.land || "AT", adresse_plz: adr.plz || "", adresse_ort: adr.ort || "", adresse_strasse: adr.strasse || "", adresse_hausnr: adr.hausnr || "",
        betrag_bezahlt_cent: 0, erstattet_cent: 0, abholung_bis: showroom ? plusTage(h, Number(einst.reservierung_frist_tage) || 14) : "", verlauf: [], erstattungen: [], mail_status: "ausstehend", notiz_kunde: args.notiz_kunde || "", notiz_intern: "",
        quelle: "backoffice", idempotency_key: args.idempotency_key || "", owner: client.session.user, creation: jetzt(client), modified: jetzt(client), modified_by: client.session.user, docstatus: 0, idx: 0,
      };
      tab(client, "PH Bestellung").set(name, doc);
      client.version("PH Bestellung", name, null, doc);
      verlauf(client, name, doc.status, showroom ? "Showroom-Reservierung" : "Telefonbestellung");
      if (!showroom && Number(args.zahlungslink ?? 1)) await mockMethode(client, "PH Bestellung", name, "zahlungslink_erstellen", { senden: 0 });
      return { name };
    }
    case "ph_shop.api.get_pickup_status": {
      const c = String(args.code || "").replace(/[^a-z0-9]/gi, "").toUpperCase();
      const b = [...tab(client, "PH Bestellung").values()].find((x) => String(x.abholcode || "").toUpperCase() === c && ["abholbereit", "abgeholt"].includes(x.status));
      if (!b) return { gefunden: false };
      return { gefunden: true, name: b.name, status: b.status, kunde_name: b.kunde_name, offen_cent: offen(b), positionen: (b.positionen || []).map((p) => ({ bezeichnung: p.bezeichnung, menge: p.menge, bild: p.bild })), abholung_bis: b.abholung_bis };
    }
    default:
      throw fehler("not_found", `Methode ${method} ist im Mock nicht hinterlegt.`);
  }
}

/** Workflow-Übergänge im Mock (Als geprüft übernehmen, Zurück auf Offen). */
export async function mockWorkflow(client, doctype, name, aktion) {
  if (doctype !== "PH Bestellung") return client.workflowAction(doctype, name, aktion);
  leitung(client);
  const b = hole(client, doctype, name);
  if (aktion === "Als geprüft übernehmen") {
    if (b.status !== "pruefen") throw fehler("invalid", "Nur aus „Prüfen“.");
    return statusSetzen(client, name, "bezahlt", "Als geprüft übernommen", { offen_cent: 0, betrag_bezahlt_cent: Math.max(Number(b.betrag_bezahlt_cent || 0), 0) });
  }
  if (aktion === "Zurück auf Offen") {
    if (!["fehlgeschlagen", "checkout_fehler", "abgelaufen"].includes(b.status)) throw fehler("invalid", "Nur aus fehlgeschlagen, Bezahlvorgang fehlerhaft oder abgelaufen.");
    return statusSetzen(client, name, "offen", "Zurück auf Offen");
  }
  throw fehler("invalid", "Unbekannte Aktion.");
}

/** „Steuerfall geklärt“ – Vermerk in der internen Notiz (Feldwert; Packen frei). */
export function steuerfallVermerk(alt, wer) {
  return `${alt ? `${alt}\n` : ""}Steuerfall geklärt (${wer})`;
}
