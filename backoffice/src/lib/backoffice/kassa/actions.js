"use server";
// Kassa – Server Actions (Team B-KAS, Konzept §16.3). Jede Action prüft Sitzung + Bereichsrecht erneut,
// validiert die Eingaben und liefert { ok, code?, message?, daten? } – sie wirft nie. Mock und Frappe über
// rufe() (frappe.js); der Client sendet nie `trainings`. Freigaben „am Ende“: die Leitung gibt im selben
// Dialog mit PIN frei ({email, pin}), der Server prüft (ph_kassa `freigabe`); ohne Freigabe meldet die Action
// code "freigabe" mit den nötigen Gründen. Alle Exporte sind async (Next „use server“).

import { revalidatePath } from "next/cache";
import { getGeraetToken, getSession } from "../auth/dal.js";
import { darf } from "../auth/rechte.js";
import { backoffice } from "../frappe/index.js";
import { istBackofficeError } from "../frappe/errors.js";
import { IS_PRODUCTION } from "../config.js";
import { rufe } from "./frappe.js";
import { grundText, pruefeBuchung } from "./bargeld.js";
import { zaehlprotokollAus } from "./abschluss.js";
import { erkennen } from "./codes.js";
import { fehlerText } from "./texte.js";

const NAME = /^[A-Za-z0-9][A-Za-z0-9 ._:/-]{0,79}$/;
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;

function antwort(err) {
  if (istBackofficeError(err)) {
    const freigabe = err.detail?.freigabe || (/Freigabe der Leitung nötig/.test(err.message) ? err.message.replace(/^.*nötig:\s*/, "").split(/,\s*/) : null);
    if (freigabe && err.code === "forbidden") return { ok: false, code: "freigabe", message: fehlerText("freigabe"), daten: { gruende: freigabe } };
    return { ok: false, code: err.code, message: fehlerText(err.code, err.message) };
  }
  return { ok: false, code: "unavailable", message: fehlerText("unavailable") };
}

/**
 * Rahmen jeder Action: Sitzung, Recht, Client, Fehlerbild.
 * @param {"read"|"write"|"cancel"|"admin"} aktion
 * @param {(ctx:{session:object, client:any}) => Promise<any>} fn
 */
async function mit(aktion, fn) {
  const session = await getSession();
  if (!session) return { ok: false, code: "auth", message: fehlerText("auth") };
  if (!darf(session, "kassa", aktion)) return { ok: false, code: "forbidden", message: fehlerText("forbidden") };
  try {
    const daten = await fn({ session, client: backoffice(session) });
    if (daten && daten.ok === false) return daten;
    return { ok: true, daten };
  } catch (err) {
    return antwort(err);
  }
}

const ungueltig = (message) => ({ ok: false, code: "invalid", message });
const kasseOk = (k) => typeof k === "string" && NAME.test(k);
const cent = (v) => (Number.isFinite(Number(v)) ? Math.round(Number(v)) : NaN);

async function freigabeArg(freigabe) {
  if (!freigabe?.email || !freigabe?.pin) return null;
  if (!EMAIL.test(freigabe.email) || !/^\d{4,6}$/.test(String(freigabe.pin))) return null;
  return { email: String(freigabe.email).toLowerCase(), pin: String(freigabe.pin), geraet_token: (await getGeraetToken()) || undefined };
}

// -------------------------------------------------------------------- Lesen --

export async function kontextAction({ kasse } = {}) {
  return mit("read", ({ client }) => rufe(client, "kontext", { kasse: kasseOk(kasse) ? kasse : undefined }));
}

/** Gruppierte Suche: Artikel · Kunden (§2.4: ab 2 Zeichen, reine Ziffern ab 4). */
export async function sucheAction({ q } = {}) {
  const t = String(q || "").trim().slice(0, 80);
  if (t.length < 2 || (/^\d+$/.test(t) && t.length < 4)) return { ok: true, daten: { artikel: [], kunden: [] } };
  return mit("read", async ({ client }) => {
    const [artikel, kunden] = await Promise.all([rufe(client, "suche_produkt", { q: t }).catch(() => []), rufe(client, "suche_kunde", { q: t }).catch(() => [])]);
    return { artikel: (artikel || []).slice(0, 8), kunden: (kunden || []).slice(0, 6) };
  });
}

/** Scan auswerten: Server-Erkennung (code_erkennen), im Fehlerfall der Client-Port (codes.js). */
export async function codeAction({ code } = {}) {
  const c = String(code || "").trim().slice(0, 512);
  if (!c) return ungueltig("Kein Code.");
  return mit("read", async ({ client }) => {
    try {
      return await rufe(client, "code_erkennen", { code: c });
    } catch {
      return { ...erkennen(c), treffer: null };
    }
  });
}

export async function karteAction({ kartennummer } = {}) {
  const k = String(kartennummer || "").trim().slice(0, 40);
  if (!k) return ungueltig("Kartennummer fehlt.");
  return mit("read", ({ client }) => rufe(client, "karte_pruefen", { kartennummer: k }));
}

export async function gutscheinPruefenAction({ code } = {}) {
  const c = String(code || "").trim().toUpperCase().slice(0, 40);
  if (!c) return ungueltig("Code fehlt.");
  return mit("read", ({ client }) => rufe(client, "gutschein_pruefen", { code: c }));
}

export async function belegeHeuteAction({ kasse } = {}) {
  if (!kasseOk(kasse)) return ungueltig("Kasse fehlt.");
  return mit("read", ({ client }) => rufe(client, "belege_heute", { kasse, limit: 60 }));
}

export async function belegDatenAction({ name } = {}) {
  if (!NAME.test(String(name || ""))) return ungueltig("Beleg fehlt.");
  return mit("read", ({ client }) => rufe(client, "beleg_daten", { name }));
}

// ----------------------------------------------------------------- Kassieren --

/**
 * Beleg buchen. `entwurf`: {kasse, positionen[], zahlarten[], kontakt?, auftrag?, rechnung?, zahlungsplan_position?,
 * kundenkarte?, vorteile?[], email?, empfaenger?, identitaet?, retoure_original?}. `idempotencyKey` bleibt bei
 * „Erneut buchen“ gleich (§3.3.6). `simuliere` nur im Mock außerhalb der Produktion („netz“).
 */
export async function kassierenAction({ entwurf, idempotencyKey, freigabe, simuliere } = {}) {
  if (!entwurf || !kasseOk(entwurf.kasse)) return ungueltig("Kasse fehlt.");
  if (!Array.isArray(entwurf.positionen) || !entwurf.positionen.length || entwurf.positionen.length > 200) return ungueltig("Beleg ohne Positionen.");
  if (!Array.isArray(entwurf.zahlarten) || entwurf.zahlarten.length > 6) return ungueltig("Zahlart fehlt.");
  if (typeof idempotencyKey !== "string" || !/^[A-Za-z0-9:_.-]{8,140}$/.test(idempotencyKey)) return ungueltig("Schlüssel fehlt.");
  if (entwurf.email && !EMAIL.test(entwurf.email)) return ungueltig("E-Mail-Adresse ist ungültig.");
  for (const p of entwurf.positionen) {
    if (!p || typeof p.bezeichnung !== "string" || !Number.isFinite(cent(p.einzel_brutto_cent)) || !(Number(p.menge) > 0)) return ungueltig("Position unvollständig.");
  }
  return mit("write", async ({ client }) => {
    const r = await rufe(client, "beleg_buchen", {
      kasse: entwurf.kasse,
      positionen: entwurf.positionen,
      zahlarten: entwurf.zahlarten,
      kontakt: entwurf.kontakt || undefined,
      auftrag: entwurf.auftrag || undefined,
      rechnung: entwurf.rechnung || undefined,
      zahlungsplan_position: entwurf.zahlungsplan_position || undefined,
      kundenbeleg_email: entwurf.email || undefined,
      kundenkarte: entwurf.kundenkarte || undefined,
      kundenkarte_vorteile: entwurf.vorteile?.length ? entwurf.vorteile : undefined,
      empfaenger: entwurf.empfaenger || undefined,
      identitaet: entwurf.identitaet || undefined,
      retoure_original: entwurf.retoure_original || undefined,
      idempotency_key: idempotencyKey,
      freigabe: (await freigabeArg(freigabe)) || undefined,
      ...(client.modus !== "frappe" && !IS_PRODUCTION && simuliere === "netz" ? { _simuliere: "netz" } : {}),
    });
    revalidatePath("/kassa/verwaltung");
    return r;
  });
}

export async function belegMailenAction({ beleg, email } = {}) {
  if (!NAME.test(String(beleg || ""))) return ungueltig("Beleg fehlt.");
  if (!EMAIL.test(String(email || "").trim())) return ungueltig("E-Mail-Adresse ist ungültig.");
  return mit("write", ({ client }) => rufe(client, "beleg_mailen", { beleg, email: String(email).trim().toLowerCase() }));
}

export async function belegDruckenAction({ beleg } = {}) {
  if (!NAME.test(String(beleg || ""))) return ungueltig("Beleg fehlt.");
  return mit("write", ({ client }) => rufe(client, "beleg_drucken", { beleg }));
}

// ------------------------------------------------------------------ Terminal --

export async function terminalStartAction({ kasse, terminal, betragCent } = {}) {
  if (!kasseOk(kasse) || !NAME.test(String(terminal || ""))) return ungueltig("Terminal fehlt.");
  if (!(cent(betragCent) > 0)) return ungueltig("Betrag fehlt.");
  return mit("write", ({ client }) => rufe(client, "terminal_start", { kasse, terminal, betrag_cent: cent(betragCent) }));
}

export async function terminalStatusAction({ paymentIntent, terminal } = {}) {
  if (!/^[A-Za-z0-9_]{6,80}$/.test(String(paymentIntent || ""))) return ungueltig("Zahlung fehlt.");
  return mit("read", ({ client }) => rufe(client, "terminal_status", { payment_intent: paymentIntent, terminal }));
}

export async function terminalAbbruchAction({ paymentIntent, terminal } = {}) {
  if (!/^[A-Za-z0-9_]{6,80}$/.test(String(paymentIntent || ""))) return ungueltig("Zahlung fehlt.");
  return mit("write", ({ client }) => rufe(client, "terminal_abbruch", { payment_intent: paymentIntent, terminal }));
}

/** Nur Test-Terminal: Zahlung am Gerät bestätigen/ablehnen (Server prüft terminal_testmodus). */
export async function terminalSimulierenAction({ terminal, erfolgreich = true } = {}) {
  if (!NAME.test(String(terminal || ""))) return ungueltig("Terminal fehlt.");
  return mit("write", ({ client }) => rufe(client, "terminal_simulieren", { terminal, erfolgreich: erfolgreich ? 1 : 0 }));
}

// ------------------------------------------------------------- Storno/Retoure --

export async function stornoAction({ beleg, grund, freigabe } = {}) {
  if (!NAME.test(String(beleg || ""))) return ungueltig("Beleg fehlt.");
  const g = String(grund || "").trim().slice(0, 140);
  if (g.length < 3) return ungueltig("Bitte einen Stornogrund angeben.");
  return mit("write", async ({ client }) => {
    const r = await rufe(client, "storno", { beleg, grund: g, freigabe: (await freigabeArg(freigabe)) || undefined });
    revalidatePath("/kassa/verwaltung");
    return r;
  });
}

export async function retoureLadenAction({ beleg, auswahl, grund } = {}) {
  if (!NAME.test(String(beleg || ""))) return ungueltig("Beleg fehlt.");
  return mit("write", ({ client }) => rufe(client, "retoure_vorbereiten", { beleg, auswahl: auswahl || undefined, grund: grund || undefined }));
}

export async function freigabePruefenAction({ email, pin } = {}) {
  const f = await freigabeArg({ email, pin });
  if (!f) return ungueltig("PIN mit 4 bis 6 Ziffern eingeben.");
  return mit("read", ({ client }) => rufe(client, "leitung_freigabe_pruefen", f));
}

// ------------------------------------------------------------------- Bargeld --

/** Einlegen/Entnehmen mit Zweck (§3.7.2). Zweck/Projekt stehen bis `kassenbuch_zweck`/`kassenbuch_projekt` im Grund. */
export async function bargeldAction({ kasse, art, betragCent, zweckId, grund = "", projekt = "" } = {}) {
  if (!kasseOk(kasse)) return ungueltig("Kasse fehlt.");
  const p = pruefeBuchung({ art, betragCent: cent(betragCent), zweckId, grund });
  if (p.fehler) return ungueltig({ art: "Art fehlt.", betrag: "Betrag größer 0 eingeben.", zweck: "Zweck wählen.", grund: "Wofür war die Ausgabe?" }[p.fehler] || "Eingabe prüfen.");
  if (projekt && !/^[A-Z0-9][A-Z0-9-]{3,40}$/.test(projekt)) return ungueltig("Projektnummer ungültig.");
  return mit("write", async ({ client }) => {
    const r = await rufe(client, "kassenbuch_buchen", { kasse, art, betrag_cent: cent(betragCent), grund: grundText({ zweckId, grund: String(grund).slice(0, 200), projekt }) });
    revalidatePath("/kassa/verwaltung");
    return r;
  });
}

export async function ladeOeffnenAction({ kasse, grund = "Wechselgeld" } = {}) {
  if (!kasseOk(kasse)) return ungueltig("Kasse fehlt.");
  return mit("write", ({ client }) => rufe(client, "lade_oeffnen", { kasse, grund: String(grund).slice(0, 120) }));
}

/** Tagesstart (§3.7.1): öffnet den Abschluss des Tages und vermerkt die Bestätigung an der Kasse. */
export async function tagesstartAction({ kasse, wertCent } = {}) {
  if (!kasseOk(kasse) || !(cent(wertCent) >= 0)) return ungueltig("Betrag fehlt.");
  return mit("write", async ({ client, session }) => {
    const r = await rufe(client, "abschluss_laden", { kasse });
    await client.kommentar?.("PH Kasse", kasse, `Tagesstart: Wechselgeld ${(cent(wertCent) / 100).toFixed(2).replace(".", ",")} € bestätigt von ${session.name || session.user}`, "Comment");
    return r;
  });
}

// ----------------------------------------------------------------- Abschluss --

export async function abschlussLadenAction({ kasse, datum } = {}) {
  if (!kasseOk(kasse)) return ungueltig("Kasse fehlt.");
  if (datum && !/^\d{4}-\d{2}-\d{2}$/.test(datum)) return ungueltig("Datum ungültig.");
  return mit("read", ({ client }) => rufe(client, "abschluss_laden", { kasse, datum: datum || undefined }));
}

/** Zählung übergeben (Mitarbeiter) – `anzahlen` = {stueckelung_cent: anzahl}. */
export async function zaehlenAction({ kasse, datum, anzahlen, unterschriftName } = {}) {
  if (!kasseOk(kasse)) return ungueltig("Kasse fehlt.");
  const zeilen = zaehlprotokollAus(anzahlen || {});
  if (zeilen.some((z) => z.anzahl > 100000)) return ungueltig("Anzahl zu groß.");
  return mit("write", async ({ client }) => {
    const r = await rufe(client, "abschluss_zaehlen", { kasse, datum: datum || undefined, zaehlprotokoll: zeilen.filter((z) => z.anzahl > 0), unterschrift_name: String(unterschriftName || "").slice(0, 80) || undefined });
    revalidatePath("/kassa/verwaltung");
    return r;
  });
}

export async function abschliessenAction({ kasse, datum, differenzGrund, unterschriftName, tresorCent } = {}) {
  if (!kasseOk(kasse)) return ungueltig("Kasse fehlt.");
  return mit("cancel", async ({ client }) => {
    const r = await rufe(client, "abschluss_abschliessen", { kasse, datum: datum || undefined, differenz_grund: String(differenzGrund || "").slice(0, 200) || undefined, unterschrift_name: String(unterschriftName || "").slice(0, 80) || undefined, tresor_entnahme_cent: cent(tresorCent) > 0 ? cent(tresorCent) : undefined });
    revalidatePath("/kassa/verwaltung");
    return r;
  });
}

// ---------------------------------------------------------------- Leitung --

export async function trainingAction({ kasse, an } = {}) {
  if (!kasseOk(kasse)) return ungueltig("Kasse fehlt.");
  return mit("cancel", async ({ client }) => {
    const r = await rufe(client, "trainingsmodus", { kasse, an: an ? 1 : 0 });
    revalidatePath("/kassa/verwaltung");
    return r;
  });
}

export async function nullbelegAction({ kasse } = {}) {
  if (!kasseOk(kasse)) return ungueltig("Kasse fehlt.");
  return mit("cancel", async ({ client }) => {
    const r = await rufe(client, "nullbeleg", { kasse });
    revalidatePath("/kassa/verwaltung");
    return r;
  });
}

/** Dokumentmethoden der Verwaltung – nur aus der Whitelist (Konzept §16.3). */
const DOC_METHODEN = Object.freeze({
  "PH Kasse": ["startbeleg_geprueft", "jahresbeleg_geprueft", "see_ausfall_melden", "see_ausfall_beenden", "kette_pruefen", "dep_exportieren"],
  "PH Kassenbeleg": ["pruefen"],
  "PH Kassenbuch": ["stornieren"],
  "PH Kassenabschluss": ["neu_berechnen", "oeffnen"],
  "PH DEP Export": ["pruefsumme_pruefen"],
  "PH Kassa Ereignis": ["als_gemeldet_markieren"],
  "PH Terminal": ["status_abfragen"],
  "PH Signatureinheit": ["verbindung_pruefen"],
});

export async function docMethodeAction({ doctype, name, methode, args = {} } = {}) {
  if (!DOC_METHODEN[doctype]?.includes(methode)) return { ok: false, code: "forbidden", message: fehlerText("forbidden") };
  if (!NAME.test(String(name || ""))) return ungueltig("Datensatz fehlt.");
  const sauber = Object.fromEntries(Object.entries(args || {}).filter(([k, v]) => /^[a-z_]{1,40}$/.test(k) && ["string", "number"].includes(typeof v)).map(([k, v]) => [k, typeof v === "string" ? v.slice(0, 200) : v]));
  const aktion = doctype === "PH Kassenbeleg" ? "read" : "cancel";
  return mit(aktion, async ({ client }) => {
    const r = await client.runDocMethod(doctype, name, methode, sauber);
    revalidatePath("/kassa/verwaltung");
    return r;
  });
}

const EINSTELLUNG_FELDER = Object.freeze({
  barverkauf_rechnung_ab_cent: "int", differenz_toleranz_cent: "int", differenz_warnung_cent: "int", storno_mitarbeiter_bis_cent: "int", rabatt_freigabe_ab_promille: "int",
  automatisch_drucken: "check", kundendisplay_aktiv: "check", abschluss_unterschrift_pflicht: "check", retoure_bar_nur_leitung: "check", karte_automatisch_buchen: "check", kundendisplay_anrede: "check",
  kundendisplay_text: "text", bon_kopfzeile: "text", bon_fusstext: "text", beleg_email_betreff: "text", retoure_standard: "select", gutschein_art: "select",
});

export async function einstellungAction({ feld, wert } = {}) {
  const typ = EINSTELLUNG_FELDER[feld];
  if (!typ) return ungueltig("Feld nicht änderbar.");
  let w = wert;
  if (typ === "int") w = Math.max(0, cent(wert));
  if (typ === "check") w = wert ? 1 : 0;
  if (typ === "text") w = String(wert || "").slice(0, 280);
  if (typ === "select" && !["Gutschein", "Original-Zahlart", "Bar", "Mehrzweck", "Einzweck"].includes(String(wert))) return ungueltig("Wert ungültig.");
  if (Number.isNaN(w)) return ungueltig("Zahl eingeben.");
  return mit("cancel", async ({ client }) => {
    const r = await client.setValue("PH Kassa Einstellungen", "PH Kassa Einstellungen", feld, w);
    revalidatePath("/kassa/verwaltung/einstellungen");
    return r;
  });
}

// -------------------------------------------------------------- Kundendisplay --

/** QR-Code des Belegs als SVG (Frappe: PH Kassenbeleg.qr_svg; Mock: erkennbares Muster). Nur sauberes SVG. */
export async function qrSvgAction({ beleg } = {}) {
  if (!NAME.test(String(beleg || ""))) return ungueltig("Beleg fehlt.");
  return mit("read", async ({ client }) => {
    let svg = "";
    if (client.modus === "frappe") {
      const r = await client.runDocMethod("PH Kassenbeleg", beleg, "qr_svg", {});
      svg = typeof r === "string" ? r : r?.message || "";
    } else svg = musterQr(beleg);
    if (!/^\s*(<\?xml[^>]*>\s*)?<svg[\s>][\s\S]*<\/svg>\s*$/i.test(svg) || /<script|\son\w+\s*=|javascript:/i.test(svg)) return { svg: "" };
    return { svg };
  });
}

/** Mock: deterministisches QR-ähnliches Muster (kein lesbarer Code – im Mock gibt es keine Signatur). */
function musterQr(text) {
  const n = 25;
  let x = [...String(text)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 1337);
  const rnd = () => ((x = (x * 1103515245 + 12345) % 2147483648) / 2147483648);
  const finder = (r, c) => [[0, 0], [0, n - 7], [n - 7, 0]].some(([fr, fc]) => r >= fr && r < fr + 7 && c >= fc && c < fc + 7);
  let zellen = "";
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (!finder(r, c) && rnd() > 0.52) zellen += `<rect x="${c}" y="${r}" width="1" height="1"/>`;
  const f = (r, c) => `<rect x="${c + 0.5}" y="${r + 0.5}" width="6" height="6" rx="1.4" fill="none" stroke="#1d2125" stroke-width="1"/><rect x="${c + 2}" y="${r + 2}" width="3" height="3" rx="0.8"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-1 -1 ${n + 2} ${n + 2}" width="100%" height="100%"><rect x="-1" y="-1" width="${n + 2}" height="${n + 2}" rx="2.5" fill="#fff"/><g fill="#1d2125">${zellen}${f(0, 0)}${f(0, n - 7)}${f(n - 7, 0)}</g></svg>`;
}
