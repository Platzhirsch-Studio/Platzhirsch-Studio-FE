// Bereich Marketing – reine Fachregeln, im Client gespiegelt (10-konzept-marketing § 13.3 regeln.js).
// Quellen (nur gelesen, Kopie mit Quellkommentar, keine Laufzeit-Importe):
//   Backend-Import/ph_marketing/ph_marketing/utils/regeln.py   (block_sichtbar, versandbereit, offene_slots, pruefe_reise,
//                                                                werbung_heute_erlaubt, sperrtag)
//   Backend-Import/ph_marketing/ph_marketing/utils/kennzahlen_csv.py (lesen)
//   Backend-Import/ph_marketing/ph_marketing/utils/eventlogik.py  (checkin_entscheiden, nachruecker)
// Der Server gewinnt immer; diese Regeln steuern nur, was die Oberfläche vorab sperrt oder erklärt.
// Reines Modul (keine "@/"-Importe), unit-getestet in tests/unit/marketing-regeln.test.mjs.

import { MONATE, WOCHENTAGE, ZWECK_TEXT, WERBE_ZWECKE, SOCIAL_FORMATE, NEWSLETTER, EMPFEHLUNGEN } from "./texte.js";

const txt = (v) => typeof v === "string" ? v.trim().length > 0 : v != null && String(v).trim().length > 0;
const p2 = (n) => String(n).padStart(2, "0");

// ------------------------------------------------------------------------------------------------- Datum

/** Date → "JJJJ-MM-TT" (lokal). */
export function isoTag(d = new Date()) {
  const x = d instanceof Date ? d : new Date(String(d).replace(" ", "T"));
  return `${x.getFullYear()}-${p2(x.getMonth() + 1)}-${p2(x.getDate())}`;
}

/** "JJJJ-MM-TT[ HH:MM[:SS]]" → Date (lokal) oder null. */
export function alsDatum(wert) {
  if (!wert) return null;
  if (wert instanceof Date) return Number.isNaN(wert.getTime()) ? null : wert;
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(String(wert));
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4] || 0), Number(m[5] || 0), Number(m[6] || 0));
}

export function plusTage(d, n) {
  const x = alsDatum(d) || new Date();
  return new Date(x.getFullYear(), x.getMonth(), x.getDate() + n, x.getHours(), x.getMinutes());
}

export function tageZwischen(von, bis) {
  const a = alsDatum(von);
  const b = alsDatum(bis);
  if (!a || !b) return null;
  const ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((ub - ua) / 86400000);
}

/** „Do 03.12.“ bzw. mit Zeit „Do 03.12. 18:00“. */
export function kurzDatum(wert, { zeit = false, jahr = false } = {}) {
  const d = alsDatum(wert);
  if (!d) return "–";
  const t = `${WOCHENTAGE[d.getDay()].slice(0, 2)} ${p2(d.getDate())}.${p2(d.getMonth() + 1)}.${jahr ? d.getFullYear() : ""}`;
  return zeit ? `${t} ${p2(d.getHours())}:${p2(d.getMinutes())}` : t;
}

/** „Donnerstag, 03.12.2026, 18:00“ (für title-Attribute, Q-A5). */
export function langDatum(wert, { zeit = true } = {}) {
  const d = alsDatum(wert);
  if (!d) return "";
  const t = `${WOCHENTAGE[d.getDay()]}, ${p2(d.getDate())}.${p2(d.getMonth() + 1)}.${d.getFullYear()}`;
  return zeit && (d.getHours() || d.getMinutes()) ? `${t}, ${p2(d.getHours())}:${p2(d.getMinutes())}` : t;
}

/** „TT.MM.“ */
export function tagMonat(wert) {
  const d = alsDatum(wert);
  return d ? `${p2(d.getDate())}.${p2(d.getMonth() + 1)}.` : "–";
}

/** „HH:MM“ aus Zeit („18:00:00“) oder Datum. */
export function uhrzeit(wert) {
  if (!wert) return "";
  const m = /(\d{2}):(\d{2})/.exec(String(wert));
  return m ? `${m[1]}:${m[2]}` : "";
}

/** Countdown ohne Sekunden: „in 2 Tagen 4 Std.“, „in 35 Min.“, „jetzt“. */
export function countdown(ziel, jetzt = new Date()) {
  const d = alsDatum(ziel);
  if (!d) return "";
  const min = Math.round((d.getTime() - jetzt.getTime()) / 60000);
  if (min <= 0) return "jetzt";
  if (min < 60) return `in ${min} Min.`;
  const std = Math.floor(min / 60);
  if (std < 24) return `in ${std} Std.`;
  const tg = Math.floor(std / 24);
  const rest = std % 24;
  return `in ${tg} ${tg === 1 ? "Tag" : "Tagen"}${rest ? ` ${rest} Std.` : ""}`;
}

// ------------------------------------------------------------------------------------------------- Werbefenster

export const SPERRTAGE = Object.freeze(["12-24", "12-25", "12-26", "12-31", "01-01"]);
export const WERBUNG_WOCHENTAGE = Object.freeze([2, 3, 4]); // ISO: Di–Do

/** „2,3,4“ → [2,3,4]; „12-24,12-25“ → ["12-24","12-25"]. */
export function liste(text, standard = []) {
  const t = String(text ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return t.length ? t : [...standard];
}

const isoWochentag = (d) => (d.getDay() === 0 ? 7 : d.getDay());

export function istSperrtag(wert, sperrtage = SPERRTAGE) {
  const d = alsDatum(wert);
  return !!d && sperrtage.includes(`${p2(d.getMonth() + 1)}-${p2(d.getDate())}`);
}

/** Spiegel werbung_heute_erlaubt: nur an Werbetagen (ISO 1–7) und nie an Sperrtagen. */
export function werbungErlaubt(wert, { wochentage = WERBUNG_WOCHENTAGE, sperrtage = SPERRTAGE } = {}) {
  const d = alsDatum(wert);
  if (!d) return false;
  return !istSperrtag(d, sperrtage) && wochentage.map(Number).includes(isoWochentag(d));
}

/** Satz mit Folge: „Werbung heute: Montag – nicht erlaubt. Nächstes Fenster Dienstag.“ */
export function werbefensterSatz(wert, opts = {}) {
  const d = alsDatum(wert) || new Date();
  const tag = WOCHENTAGE[d.getDay()];
  if (istSperrtag(d, opts.sperrtage)) return { ok: false, tag, satz: `Werbung heute nicht möglich: Sperrtag ${tagMonat(d)}. Nächstes Fenster ${WOCHENTAGE[naechstesFenster(d, opts).getDay()]}.` };
  if (werbungErlaubt(d, opts)) return { ok: true, tag, satz: `Werbung heute: ${tag} – erlaubt.` };
  return { ok: false, tag, satz: `Werbung heute nicht möglich: ${tag}. Nächstes Fenster ${WOCHENTAGE[naechstesFenster(d, opts).getDay()]}.` };
}

export function naechstesFenster(wert, opts = {}) {
  let d = plusTage(wert, 1);
  for (let i = 0; i < 21; i++, d = plusTage(d, 1)) if (werbungErlaubt(d, opts)) return d;
  return d;
}

/** Vorschlag Versandtermin: erster Donnerstag des Monats 18:00 (ab heute; ist er vorbei, der nächste Monat). */
export function ersterDonnerstag(ab = new Date(), { monat } = {}) {
  const basis = alsDatum(ab) || new Date();
  const kandidat = (j, m) => {
    const d = new Date(j, m, 1, 18, 0);
    while (d.getDay() !== 4) d.setDate(d.getDate() + 1);
    return d;
  };
  if (monat) {
    const [j, m] = monat.split("-").map(Number);
    const d = kandidat(j, m - 1);
    if (d > basis) return d;
  }
  let d = kandidat(basis.getFullYear(), basis.getMonth());
  if (d <= basis) d = kandidat(basis.getFullYear(), basis.getMonth() + 1);
  return d;
}

/** Prüft einen Versandtermin: Sperrtag → gesperrt; außerhalb Werbefenster → Hinweis (keine Sperre). */
export function pruefeVersandtermin(wert, opts = {}) {
  const d = alsDatum(wert);
  if (!d) return { ok: false, gesperrt: true, grund: "Bitte Datum und Uhrzeit wählen." };
  if (istSperrtag(d, opts.sperrtage)) return { ok: false, gesperrt: true, grund: NEWSLETTER.sperrtag(tagMonat(d)) };
  if (opts.jetzt && d <= opts.jetzt) return { ok: false, gesperrt: true, grund: "Der Termin liegt in der Vergangenheit." };
  if (!werbungErlaubt(d, opts)) return { ok: true, gesperrt: false, hinweis: NEWSLETTER.werbefensterSatz };
  return { ok: true, gesperrt: false };
}

// ------------------------------------------------------------------------------------------------- Newsletter

export const SLOT_TYPEN = Object.freeze(["neueStuecke", "skizze"]);
export const INHALT_TYPEN = Object.freeze(["neueStuecke", "skizze", "termine", "gutZuWissen"]);
export const STANDARD_BLOECKE = Object.freeze(["brief", "neueStuecke", "skizze", "termine", "gutZuWissen"]);

/** Spiegel regeln.block_sichtbar: nur Blöcke mit echtem Inhalt; Bilder in Neue Stücke/Skizze nur „eigen“ mit Beschreibung. */
export function blockSichtbar(b) {
  if (!b) return false;
  switch (b.typ) {
    case "brief":
      return txt(stripHtml(b.text));
    case "neueStuecke":
    case "skizze":
      return txt(stripHtml(b.text)) && txt(b.bild) && b.bildquelle === "eigen" && txt(b.bild_alt);
    case "termine":
      return txt(b.titel) && (txt(b.event) || txt(stripHtml(b.text)));
    case "gutZuWissen":
    case "arbeitsweise":
      return txt(b.titel) && txt(stripHtml(b.text));
    default:
      return false;
  }
}

/** Leer = optional (kein Inhalt angefangen), sonst Grund der Unvollständigkeit. */
export function blockZustand(b) {
  if (blockSichtbar(b)) return { art: "dabei" };
  const angefangen = ["text", "titel", "bild", "bild_alt", "url", "event", "marke"].some((f) => txt(f === "text" ? stripHtml(b?.[f]) : b?.[f]));
  if (!angefangen) return { art: "leer" };
  if (b.typ === "brief") return { art: "unvollstaendig", grund: "Text fehlt" };
  if (SLOT_TYPEN.includes(b.typ)) {
    if (!txt(stripHtml(b.text))) return { art: "unvollstaendig", grund: "Text fehlt" };
    if (!txt(b.bild)) return { art: "unvollstaendig", grund: "Bild fehlt" };
    if (b.bildquelle !== "eigen") return { art: "unvollstaendig", grund: "kein eigenes Foto" };
    if (!txt(b.bild_alt)) return { art: "unvollstaendig", grund: "Bildbeschreibung fehlt" };
  }
  if (b.typ === "termine") return { art: "unvollstaendig", grund: txt(b.titel) ? "Event oder Text fehlt" : "Titel fehlt" };
  return { art: "unvollstaendig", grund: txt(b.titel) ? "Text fehlt" : "Titel fehlt" };
}

export function versandbereit(bloecke = []) {
  const sichtbar = bloecke.filter(blockSichtbar);
  const inhalt = sichtbar.filter((b) => INHALT_TYPEN.includes(b.typ));
  return sichtbar.some((b) => b.typ === "brief") && inhalt.some((b) => SLOT_TYPEN.includes(b.typ)) && inhalt.length >= 2;
}

export function offeneSlots(bloecke = []) {
  return bloecke.filter((b) => SLOT_TYPEN.includes(b.typ) && !blockSichtbar(b)).map((b) => b.typ);
}

/**
 * Bereitschaft als Teile für Kopfzeile und Popover: Brief · Neue Stücke oder Skizze · zweiter Inhaltsblock.
 * → { bereit, ok, gesamt, teile:[{id, titel, ok, blockIndex}], fehlt:string|null }
 */
export function bereitschaft(bloecke = []) {
  const idx = (pred) => bloecke.findIndex(pred);
  const sichtbar = bloecke.map(blockSichtbar);
  const briefI = idx((b, i) => b.typ === "brief" && sichtbar[i]);
  const slotI = idx((b, i) => SLOT_TYPEN.includes(b.typ) && sichtbar[i]);
  const inhalt = bloecke.map((b, i) => (INHALT_TYPEN.includes(b.typ) && sichtbar[i] ? i : -1)).filter((i) => i >= 0);
  const teile = [
    { id: "brief", titel: "Brief", ok: briefI >= 0, blockIndex: briefI >= 0 ? briefI : idx((b) => b.typ === "brief") },
    { id: "slot", titel: "Neue Stücke oder Skizze", ok: slotI >= 0, blockIndex: slotI >= 0 ? slotI : idx((b) => SLOT_TYPEN.includes(b.typ)) },
    { id: "inhalt", titel: "Zwei Inhaltsblöcke", ok: inhalt.length >= 2, blockIndex: inhalt.length >= 2 ? inhalt[1] : idx((b, i) => INHALT_TYPEN.includes(b.typ) && !sichtbar[i]) },
  ];
  const ok = teile.filter((t) => t.ok).length;
  const erst = teile.find((t) => !t.ok);
  return { bereit: ok === teile.length, ok, gesamt: teile.length, teile, fehlt: erst ? NEWSLETTER.fehlt[erst.id] : null, fehltBlock: erst?.blockIndex ?? -1 };
}

/** Kennung „2026-11“ → „November 2026“; sonst Kennung unverändert. */
export function monatAusSlug(slug) {
  const m = /^(\d{4})-(\d{2})$/.exec(String(slug || ""));
  if (!m) return String(slug || "–");
  return `${MONATE[Number(m[2]) - 1] || m[2]} ${m[1]}`;
}

/** Nächste freie Kennung JJJJ-MM ab dem laufenden Monat (der letzte belegte + 1, mindestens aktueller Monat). */
export function naechsteKennung(slugs = [], heute = new Date()) {
  const belegt = new Set(slugs.filter((s) => /^\d{4}-\d{2}$/.test(s)));
  let j = heute.getFullYear();
  let m = heute.getMonth() + 1;
  const neueste = [...belegt].sort().pop();
  if (neueste) {
    const [nj, nm] = neueste.split("-").map(Number);
    if (nj * 12 + nm >= j * 12 + m) {
      j = nj;
      m = nm + 1;
      if (m > 12) {
        m = 1;
        j += 1;
      }
    }
  }
  while (belegt.has(`${j}-${p2(m)}`)) {
    m += 1;
    if (m > 12) {
      m = 1;
      j += 1;
    }
  }
  return `${j}-${p2(m)}`;
}

/** Zeichen ohne HTML (Zähler, Leerprüfung). */
export function stripHtml(t) {
  return String(t ?? "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

// ------------------------------------------------------------------------------------------------- Adressen

const DOMAIN_TIPPFEHLER = Object.freeze({
  "gmx.ar": "gmx.at", "gmx.ta": "gmx.at", "gmx.de.": "gmx.de", "gmail.co": "gmail.com", "gmial.com": "gmail.com", "gmai.com": "gmail.com", "gamil.com": "gmail.com",
  "hotmail.co": "hotmail.com", "hotmial.com": "hotmail.com", "outlok.com": "outlook.com", "outlook.co": "outlook.com", "aon.ta": "aon.at", "a1.ent": "a1.net", "yahoo.co": "yahoo.com", "icloud.co": "icloud.com", "web.ed": "web.de", "bluewin.ck": "bluewin.ch",
});

export function emailGueltig(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e || "").trim());
}

export function emailNormal(e) {
  return String(e || "").trim().toLowerCase();
}

/** Tippfehler-Prüfung: „anna@gmx.ar“ → „anna@gmx.at“ (oder null). */
export function domainVorschlag(email) {
  const e = emailNormal(email);
  const at = e.lastIndexOf("@");
  if (at < 1) return null;
  const domain = e.slice(at + 1);
  const ziel = DOMAIN_TIPPFEHLER[domain];
  return ziel ? `${e.slice(0, at)}@${ziel}` : null;
}

/**
 * Interne Adresse für Testmails (U19): Testadresse, Benutzer-Adressen, Team-Postfach und Domains aus den Einstellungen.
 * @param {string} email
 * @param {{testadresse?:string, benutzer?:string[], domains?:string[]}} kontext
 */
export function istIntern(email, { testadresse = "", benutzer = [], domains = [] } = {}) {
  const e = emailNormal(email);
  if (!emailGueltig(e)) return false;
  if (testadresse && e === emailNormal(testadresse)) return true;
  if (benutzer.map(emailNormal).includes(e)) return true;
  const domain = e.split("@")[1];
  return domains.map((d) => String(d).trim().toLowerCase().replace(/^@/, "")).filter(Boolean).includes(domain);
}

// ------------------------------------------------------------------------------------------------- Empfänger

/** Bestätigungsmail erneut: nur Unbestätigt, frühestens 60 min nach der letzten Mail (R4, Server filtert auch). */
export function bestaetigungErneut(abo, jetzt = new Date()) {
  if (!abo) return { ok: false, grund: "fehlt" };
  if (abo.status === "Abgemeldet") return { ok: false, grund: "abgemeldet" };
  if (abo.status === "Beschwerde") return { ok: false, grund: "spam" };
  if (abo.status === "Bounce") return { ok: false, grund: "unzustellbar" };
  if (abo.status !== "Angemeldet unbestaetigt") return { ok: false, grund: "aktiv" };
  const letzte = alsDatum(abo.doi_erinnert_am || abo.doi_gesendet_am);
  if (letzte) {
    const min = Math.floor((jetzt.getTime() - letzte.getTime()) / 60000);
    if (min < 60) return { ok: false, grund: "kurz", minuten: Math.max(0, min) };
  }
  return { ok: true };
}

/** Stunden seit der Anmeldung (für „seit 52 Std. · Link abgelaufen“). */
export function stundenSeit(wert, jetzt = new Date()) {
  const d = alsDatum(wert);
  return d ? Math.floor((jetzt.getTime() - d.getTime()) / 3600000) : null;
}

/** Vorschau einer Massenaktion: { moeglich:[email], uebersprungen:[{email, grund}], gruende:"4 abgemeldet, 2 …" }. */
export function vorschauBestaetigung(abos, jetzt = new Date()) {
  const moeglich = [];
  const uebersprungen = [];
  for (const a of abos) {
    const r = bestaetigungErneut(a, jetzt);
    if (r.ok) moeglich.push(a.email || a.name);
    else uebersprungen.push({ email: a.email || a.name, grund: r.grund });
  }
  return { moeglich, uebersprungen, gruende: gruendeText(uebersprungen) };
}

export function gruendeText(uebersprungen) {
  const zahl = new Map();
  for (const u of uebersprungen) zahl.set(u.grund, (zahl.get(u.grund) || 0) + 1);
  const T = { abgemeldet: "abgemeldet", kurz: "vor Kurzem gesendet", spam: "als Spam gemeldet", aktiv: "schon bestätigt", unzustellbar: "unzustellbar", fehlt: "nicht gefunden" };
  return [...zahl].map(([g, n]) => `${n} ${T[g] || g}`).join(", ");
}

/**
 * Personen-Zusammenführung (§ 2.4): eine Zeile je E-Mail aus Abo + Einwilligungen + Kontakt.
 * @returns {Array<{email, name, abo, zwecke:string[], quelle, letzteZustellung, kontakt, einwilligungen}>}
 */
export function personenAus({ abos = [], einwilligungen = [], kontakte = [] }) {
  const m = new Map();
  const kontaktNach = new Map(kontakte.map((k) => [emailNormal(k.email), k]));
  const holen = (email) => {
    const e = emailNormal(email);
    if (!m.has(e)) m.set(e, { email: e, abo: null, einwilligungen: [], zwecke: [], kontakt: kontaktNach.get(e) || null });
    return m.get(e);
  };
  for (const a of abos) holen(a.email || a.name).abo = a;
  for (const w of einwilligungen) {
    const p = holen(w.email);
    p.einwilligungen.push(w);
    if (["Bestaetigt", "Offen"].includes(w.status) && !p.zwecke.includes(w.zweck)) p.zwecke.push(w.zweck);
    if (!p.kontakt && w.kontakt) p.kontakt = { name: w.kontakt };
  }
  return [...m.values()].map((p) => ({
    ...p,
    name: p.kontakt?.kunde_name || [p.kontakt?.vorname, p.kontakt?.nachname].filter(Boolean).join(" ") || p.abo?.anrede_name || "",
    quelle: p.abo?.quelle || p.einwilligungen[0]?.kanal || "",
    letzteZustellung: p.abo?.letzte_zustellung || null,
  }));
}

/**
 * „Keine Werbung mehr“ (D4): welche Aufrufe nötig sind – genau einmal abmelden (widerruft die Newsletter-Einwilligung mit),
 * danach je anderem werblichen Zweck mit wirksamem Eintrag ein Widerruf; nie doppelt für „newsletter“.
 */
export function keineWerbungPlan({ abo, einwilligungen = [], umfang = "alle" }) {
  const abmelden = !!abo && !["Abgemeldet", "Beschwerde"].includes(abo.status);
  if (umfang === "newsletter") return { abmelden, widerrufen: [], kontaktsperre: false, zwecke: [] };
  const wirksam = einwilligungen.filter((w) => ["Bestaetigt", "Offen"].includes(w.status) && WERBE_ZWECKE.includes(w.zweck) && w.zweck !== "newsletter");
  const jeZweck = new Map();
  for (const w of wirksam) if (!jeZweck.has(w.zweck)) jeZweck.set(w.zweck, w.name);
  return { abmelden, widerrufen: [...jeZweck.values()], zwecke: [...jeZweck.keys()].map((z) => ZWECK_TEXT[z] || z), kontaktsperre: umfang === "kontakt" };
}

/** Daten löschen nur in zulässigen Status (§ 2.4). */
export function loeschenErlaubt(abo) {
  return !!abo && ["Abgemeldet", "Angemeldet unbestaetigt", "Bounce", "Beschwerde"].includes(abo.status);
}

// ------------------------------------------------------------------------------------------------- Kundenreisen

export const REISE_ZWECKE = Object.freeze(["newsletter", "einladungen", "merkliste_erinnerung", "planer_erinnerung", "rueckmeldung", "pflege_nachkauf", "whatsapp", "foto_referenz"]);
const WERBEWOERTER = ["gutschein", "angebot", "rabatt", "neu im showroom", "einladung"];
const ANREIZWOERTER = ["gutschein", "empfehl", "gewinn", "belohn"];

export function grundlagen(reise) {
  return [["V", "grundlage_v"], ["B", "grundlage_b"], ["E", "grundlage_e"]].filter(([, f]) => Number(reise?.[f] || 0)).map(([k]) => k);
}

/** Spiegel regeln.pruefe_reise (Texte 1:1 wie der Server; Anzeige über texte.regelSatz). */
export function pruefeReise(reise, vorlageHtml = "") {
  const f = [];
  const g = grundlagen(reise);
  const werbung = Number(reise?.werbung || 0);
  const id = reise?.reise_id || "";
  if (!g.length) f.push("keine Rechtsgrundlage");
  if (werbung && g.includes("V")) f.push("Werbung kann nicht auf Vertrag/Service (V) gestützt werden");
  if (!werbung && g.some((k) => k !== "V")) f.push("Service-Mail braucht nur V; B/E nur für Werbung");
  if (g.includes("B") && !txt(reise?.aehnliche_produkte)) f.push("B ohne Begründung eigene, ähnliche Produkte");
  if (g.includes("E") && !REISE_ZWECKE.concat(["kundenkarte_auswertung"]).includes(reise?.zweck || "")) f.push("E ohne gültigen Zweck");
  if (id === "merkliste" && (g.length !== 1 || g[0] !== "E")) f.push("Merkliste/Planer nur mit Einwilligung (E)");
  if (id === "bewertung" && (g.length !== 1 || g[0] !== "E")) f.push("Bewertungsbitte bis zur Klärung durch die Kanzlei nur mit Einwilligung (E)");
  const html = String(vorlageHtml || "").toLowerCase();
  if (html) {
    if (!werbung && WERBEWOERTER.some((w) => html.includes(w))) f.push("Service-Vorlage enthält Werbewörter (Gutschein/Angebot/Rabatt/Neu/Einladung)");
    if (werbung && !html.includes("abmelde_url") && !html.includes("fusszeile_html")) f.push("Werbung ohne Abmeldelink in der Vorlage");
    if (id === "bewertung" && ANREIZWOERTER.some((w) => html.includes(w))) f.push("Bewertungsbitte darf keinen Anreiz und keine Empfehlung enthalten");
  }
  if (!(reise?.trigger || []).length) f.push("kein Auslöser");
  return f;
}

/** Ändert diese Änderung eine aktive Reise so, dass sie neu freigegeben werden muss (U15/K9)? */
export const REISE_FREIGABE_FELDER = Object.freeze(["werbung", "grundlage_v", "grundlage_b", "grundlage_e", "zweck", "vorlage", "trigger", "segment_outdoor", "segment_pflege"]);
export function reiseBrauchtNeueFreigabe(alt, neu) {
  if (!alt || alt.status !== "Aktiv") return false;
  return REISE_FREIGABE_FELDER.some((f) => JSON.stringify(alt[f] ?? null) !== JSON.stringify(neu[f] ?? alt[f] ?? null));
}

/** Auslöser als Satz: „Lieferung + 14 Tage“, „jährlich am 01.12.“, „Event − 21 Tage“. */
export function ausloeserSatz(t = {}, { feldText = {}, eventTitel } = {}) {
  const tage = Number(t.versatz_tage || 0);
  const versatz = tage ? ` ${tage > 0 ? "+" : "−"} ${Math.abs(tage)} ${Math.abs(tage) === 1 ? "Tag" : "Tage"}` : "";
  switch (t.ausloeser_typ) {
    case "datum":
      return `${feldText[t.feld] || "Datum"}${versatz}`;
    case "jahrestag":
      return `Jahrestag ${feldText[t.feld] || "Kauf"}${versatz}`;
    case "jaehrlich": {
      const m = /^(\d{2})-(\d{2})$/.exec(String(t.tag_monat || ""));
      return m ? `jährlich am ${m[2]}.${m[1]}.` : "jährlich";
    }
    case "event":
      return `${eventTitel || "Event"}${versatz}`;
    case "einwilligung":
      return `Einwilligung ${liste(t.zwecke).map((z) => ZWECK_TEXT[z] || z).join(", ")}${versatz}`;
    case "abo_bestaetigt":
      return `Newsletter bestätigt${versatz}`;
    default:
      return "–";
  }
}

/** Tag/Monat-Picker → „MM-TT“ (nie sichtbar). */
export function tagMonatSchluessel(tag, monat) {
  const t = Number(tag);
  const m = Number(monat);
  if (!(m >= 1 && m <= 12 && t >= 1 && t <= 31)) return "";
  return `${p2(m)}-${p2(t)}`;
}

// ------------------------------------------------------------------------------------------------- Zielgruppen

/** Regeln als Satz: „Interesse ist Küche UND Kauf in den letzten 365 Tagen“. */
export function segmentSatz(regeln = [], verknuepfung = "UND", texte = {}) {
  const k = texte.kriterium || {};
  const o = texte.operator || {};
  const teile = regeln
    .filter((r) => !Number(r.deaktiviert || 0))
    .map((r) => {
      const name = (k[r.kriterium] || r.kriterium).replace(" … Tagen", "").replace("… ", "");
      const wert = r.operator === "zwischen" ? `${r.wert || "–"} und ${r.wert_bis || "–"}` : ["vorhanden", "fehlt"].includes(r.operator) ? "" : r.wert || "–";
      const satz = /Tagen/.test(k[r.kriterium] || "") ? `${(k[r.kriterium] || "").replace("…", wert || "–")}` : `${name} ${o[r.operator] || r.operator}${wert ? ` ${wert}` : ""}`;
      return Number(r.negieren || 0) ? `nicht (${satz})` : satz;
    });
  return teile.length ? teile.join(verknuepfung === "ODER" ? " ODER " : " UND ") : "";
}

// ------------------------------------------------------------------------------------------------- Kampagnen

/** Summen über Kampagnen je Währung: { EUR:{budget, ausgaben, anfragen, n}, CHF:{…} }. */
export function kampagnenSummen(kampagnen = []) {
  const s = {};
  for (const k of kampagnen) {
    const w = k.waehrung || "EUR";
    s[w] ||= { budget: 0, ausgaben: 0, anfragen: 0, n: 0 };
    s[w].budget += Number(k.budget_cent || 0);
    s[w].ausgaben += Number(k.ausgaben_cent || 0);
    s[w].anfragen += Number(k.anfragen_gesamt || 0);
    s[w].n += 1;
  }
  return s;
}

export function prozent(teil, ganz) {
  const g = Number(ganz || 0);
  if (!g) return null;
  return Math.round((Number(teil || 0) / g) * 100);
}

export function kostenJeAnfrage(k) {
  const a = Number(k?.anfragen_gesamt || 0);
  return a ? Math.round(Number(k.ausgaben_cent || 0) / a) : null;
}

/** Kennzahlen-Aggregate wie der Server (impressionen/klicks/kosten/anfragen gesamt, Klickrate ‰). */
export function kennzahlenAggregat(kennzahlen = [], anfragenCrm = 0) {
  const sum = (f) => kennzahlen.reduce((a, z) => a + Number(z[f] || 0), 0);
  const impressionen = sum("impressionen");
  const klicks = sum("klicks");
  const kosten = sum("kosten_cent");
  const manuell = sum("anfragen");
  return { impressionen_gesamt: impressionen, klicks_gesamt: klicks, ausgaben_cent: kosten, anfragen_gesamt: anfragenCrm + manuell, anfragen_manuell: manuell, klickrate_promille: impressionen ? Math.round((klicks / impressionen) * 1000) : 0 };
}

/** Zeit-Signal je Kampagne: Zeitraum vorbei (aktiv) oder ruht (keine Kennzahl seit ≥ 14 Tagen). */
export function kampagneSignal(k, heute = new Date()) {
  if (k?.status !== "Aktiv") return null;
  if (k.zeitraum_bis && tageZwischen(k.zeitraum_bis, heute) > 0) return { art: "vorbei" };
  const letzte = (k.kennzahlen || []).map((z) => z.datum).sort().pop() || k.letzte_kennzahl;
  const seit = letzte ? tageZwischen(letzte, heute) : tageZwischen(k.zeitraum_von, heute);
  if (seit != null && seit >= 14) return { art: "ruht", tage: seit };
  return null;
}

/** Kampagnen-Link: Zielseite + Quelle/Medium/Kennung als Parameter. */
export function kampagnenLink({ landingpage, utm_source, utm_medium, utm_campaign }) {
  if (!txt(landingpage)) return "";
  try {
    const u = new URL(landingpage);
    if (txt(utm_source)) u.searchParams.set("utm_source", utm_source);
    if (txt(utm_medium)) u.searchParams.set("utm_medium", utm_medium);
    if (txt(utm_campaign)) u.searchParams.set("utm_campaign", utm_campaign);
    return u.toString();
  } catch {
    return "";
  }
}

/** Kennung aus dem Titel: „Küche Bodensee Herbst“ → „kueche-bodensee-herbst“. */
export function kennungAusTitel(titel) {
  return String(titel || "")
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

// CSV-Spiegel von utils/kennzahlen_csv.lesen (bis ein Import im Backend über die Oberfläche läuft).
const CSV_SPALTEN = {
  datum: ["datum", "date", "day", "tag", "reporting starts", "berichtsbeginn"],
  impressionen: ["impressionen", "impressions", "impr.", "impr"],
  klicks: ["klicks", "clicks", "link clicks", "link-klicks", "outbound clicks"],
  kosten: ["kosten", "cost", "spend", "amount spent (eur)", "ausgegebener betrag (eur)", "betrag", "ausgaben"],
};

function csvZahl(t) {
  let s = String(t ?? "").trim().replace(/€|EUR|\s| /g, "");
  if (!s || s === "-" || s === "--") return 0;
  if (s.includes(",") && s.includes(".")) s = s.lastIndexOf(",") > s.lastIndexOf(".") ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  else if (s.includes(",")) s = s.replace(",", ".");
  const n = Number(s);
  if (Number.isNaN(n)) throw new Error(`Zahl nicht lesbar: „${t}“`);
  return n;
}

function csvGanz(t) {
  const s = String(t ?? "").trim().replace(/\s| /g, "");
  if (/^\d{1,3}([.,]\d{3})+$/.test(s)) return Number(s.replace(/[.,]/g, ""));
  return Math.round(csvZahl(s));
}

function csvDatum(t) {
  const s = String(t ?? "").trim().slice(0, 10);
  let m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = /^(\d{1,2})[./](\d{1,2})[./](\d{4})$/.exec(s);
  if (m) return `${m[3]}-${p2(m[2])}-${p2(m[1])}`;
  throw new Error(`Datum nicht lesbar: „${t}“`);
}

function csvZeilen(text) {
  const kopf = text.split(/\r?\n/).find((z) => z.trim()) || "";
  const trenner = [";", "\t", ","].map((t) => [t, kopf.split(t).length]).sort((a, b) => b[1] - a[1])[0][0];
  const out = [];
  for (const zeile of text.split(/\r?\n/)) {
    const zellen = [];
    let akt = "";
    let q = false;
    for (let i = 0; i < zeile.length; i++) {
      const c = zeile[i];
      if (c === '"') {
        if (q && zeile[i + 1] === '"') {
          akt += '"';
          i++;
        } else q = !q;
      } else if (c === trenner && !q) {
        zellen.push(akt);
        akt = "";
      } else akt += c;
    }
    zellen.push(akt);
    out.push(zellen);
  }
  return out;
}

/** → { zeilen:[{datum, impressionen, klicks, kosten_cent}], fehler:[text] } */
export function kennzahlenCsvLesen(inhalt, { standardDatum } = {}) {
  const text = String(inhalt || "").replace(/^﻿/, "");
  let kopf = null;
  const zeilen = [];
  const fehler = [];
  csvZeilen(text).forEach((row, i) => {
    if (!row.some((c) => c.trim())) return;
    if (!kopf) {
      const norm = row.map((c) => c.trim().toLowerCase());
      kopf = {};
      for (const [ziel, namen] of Object.entries(CSV_SPALTEN)) {
        const j = norm.findIndex((c) => namen.includes(c));
        if (j >= 0) kopf[ziel] = j;
      }
      if (!["kosten", "klicks", "impressionen"].some((k) => k in kopf)) {
        fehler.push("Kopfzeile ohne bekannte Spalten (Impressionen/Klicks/Kosten)");
        kopf = { ungueltig: true };
      }
      return;
    }
    if (kopf.ungueltig) return;
    if (["gesamt", "total", "summe"].includes(String(row[0]).trim().toLowerCase())) return;
    if (zeilen.length >= 2000) return;
    try {
      zeilen.push({
        datum: "datum" in kopf ? csvDatum(row[kopf.datum]) : standardDatum || isoTag(),
        impressionen: "impressionen" in kopf ? csvGanz(row[kopf.impressionen]) : 0,
        klicks: "klicks" in kopf ? csvGanz(row[kopf.klicks]) : 0,
        kosten_cent: "kosten" in kopf ? Math.round(csvZahl(row[kopf.kosten]) * 100) : 0,
      });
    } catch (e) {
      fehler.push(`Zeile ${i + 1}: ${e.message}`);
    }
  });
  return { zeilen: kopf?.ungueltig ? [] : zeilen, fehler };
}

// ------------------------------------------------------------------------------------------------- Events

const zaehlt = (s) => ["angemeldet", "bestaetigt", "erschienen"].includes(s);
export const personenVon = (a) => Math.max(1, Number(a?.personen || 1));

/** Plätze: belegt (Personen angemeldet/bestätigt/da), frei, Warteliste, Anmeldungen. */
export function plaetze(event = {}) {
  const a = event.anmeldungen || [];
  const belegt = a.filter((z) => zaehlt(z.status)).reduce((s, z) => s + personenVon(z), 0);
  const warte = a.filter((z) => z.status === "warteliste");
  const kap = Number(event.kapazitaet || 0);
  return {
    belegt,
    kapazitaet: kap || null,
    frei: kap ? Math.max(0, kap - belegt) : null,
    warteliste: warte.reduce((s, z) => s + personenVon(z), 0),
    wartelisteZeilen: warte.length,
    anmeldungen: a.filter((z) => z.status !== "warteliste" && z.status !== "abgesagt").length,
    abgesagt: a.filter((z) => z.status === "abgesagt").length,
    da: a.filter((z) => z.status === "erschienen").reduce((s, z) => s + personenVon(z), 0),
    anteil: kap ? Math.min(1, belegt / kap) : null,
  };
}

/** Anmeldung vorab prüfen (Server entscheidet): ok | warteliste | ausgebucht | doppelt | nicht_offen | zu_viele. */
export function anmeldungPruefen(event = {}, { email, personen = 1 } = {}) {
  if (!["Offen", "Ausgebucht"].includes(event.status)) return { art: "nicht_offen" };
  const n = Math.max(1, Number(personen || 1));
  const max = Number(event.max_personen_je_anmeldung || 0);
  if (max && n > max) return { art: "zu_viele", max };
  const e = emailNormal(email);
  if (e) {
    const da = (event.anmeldungen || []).find((a) => emailNormal(a.email) === e && a.status !== "abgesagt");
    if (da) return { art: "doppelt", personen: personenVon(da) };
  }
  const p = plaetze(event);
  if (p.kapazitaet && (event.status === "Ausgebucht" || n > p.frei)) return Number(event.warteliste || 0) ? { art: "warteliste" } : { art: "ausgebucht" };
  return { art: "ok" };
}

/** Spiegel eventlogik.nachruecker (FIFO, nur wer in die freien Plätze passt). */
export function nachruecker(event = {}) {
  const warte = (event.anmeldungen || []).filter((a) => a.status === "warteliste").sort((a, b) => String(a.angemeldet_am || "").localeCompare(String(b.angemeldet_am || "")));
  const kap = Number(event.kapazitaet || 0);
  if (!kap) return warte;
  let frei = plaetze(event).frei;
  const raus = [];
  for (const a of warte) {
    if (personenVon(a) <= frei) {
      raus.push(a);
      frei -= personenVon(a);
    }
  }
  return raus;
}

/** Spiegel eventlogik.checkin_entscheiden. */
export function checkinEntscheiden(zeile) {
  if (!zeile) return "ungueltig";
  if (zeile.status === "erschienen" || zeile.erschienen_am) return "bereits";
  if (zeile.status === "abgesagt") return "abgesagt";
  if (zeile.status === "warteliste") return "warteliste";
  return "ok";
}

/** Check-in-Liste: nur erwartete Gäste (angemeldet/bestätigt/da), nicht Erschienene zuerst, dann Name. */
export function checkinListe(anmeldungen = [], { sortiert = true } = {}) {
  const liste = anmeldungen.filter((a) => ["angemeldet", "bestaetigt", "erschienen"].includes(a.status));
  if (!sortiert) return liste;
  return [...liste].sort((a, b) => (a.status === "erschienen") - (b.status === "erschienen") || String(a.name_person || "").localeCompare(String(b.name_person || ""), "de"));
}

/** Suche ab dem ersten Zeichen über Name, E-Mail, Telefon (Ziffern). */
export function checkinSuche(zeilen = [], q = "") {
  const s = String(q || "").trim().toLowerCase();
  if (!s) return zeilen;
  const ziffern = s.replace(/\D/g, "");
  return zeilen.filter((z) => String(z.name_person || "").toLowerCase().includes(s) || String(z.email || "").toLowerCase().includes(s) || (ziffern.length >= 3 && String(z.telefon || "").replace(/\D/g, "").includes(ziffern)));
}

/** Ist das Event heute (Check-in offen)? */
export function eventHeute(event, heute = new Date()) {
  return !!event?.datum && String(event.datum).slice(0, 10) === isoTag(heute);
}

/** Primäraktion der Event-Akte je Status und Tag (§ 2.8). */
export function eventPrimaer(event, heute = new Date()) {
  if (!event) return null;
  const tag = tageZwischen(heute, event.datum);
  if (event.status === "Geplant") return { id: "veroeffentlichen", gesperrt: !txt(event.uhrzeit_von) };
  if (["Offen", "Ausgebucht"].includes(event.status) && tag === 0) return { id: "checkin" };
  if (["Offen", "Ausgebucht"].includes(event.status) && tag > 0) return { id: "anmeldung" };
  if (["Offen", "Ausgebucht", "Durchgefuehrt"].includes(event.status)) return { id: "teilnehmerliste" };
  return null;
}

// ------------------------------------------------------------------------------------------------- Social

export const TEXT_MAX = Object.freeze({ Pinterest: 500, Instagram: 2200, LinkedIn: 3000, Facebook: 63206, YouTube: 5000 });

export function formatErlaubt(kanal, format) {
  return (SOCIAL_FORMATE[kanal] || []).includes(format);
}

/**
 * Dreiteilige Bildrechte-Prüfung (K10, R10, R11) + Pflichtangaben vor „Zur Freigabe“/„Freigeben“.
 * kundenprojekt: null (unbeantwortet) | false | true; einwilligungOk: bool; kennzeichnung: nein|kooperation|bezahlt.
 * → { ok, pruefungen:[{id, ok, text}], gruende:[text] }
 */
export function socialPruefungen(b = {}, { kundenprojekt = false, einwilligungOk = false, kennzeichnung = "nein" } = {}) {
  const text = stripHtml(b.text).toLowerCase();
  const quelleOk = !!b.bildquelle_freigabe && b.bildquelle_freigabe !== "offen";
  const kundeOk = kundenprojekt === false || (kundenprojekt === true && einwilligungOk);
  const kennOk = kennzeichnung === "nein" || /\b(anzeige|werbung)\b/.test(text);
  const bildOk = txt(b.bild);
  const altOk = txt(b.alt_text);
  const pruefungen = [
    { id: "quelle", ok: quelleOk },
    { id: "kundenprojekt", ok: kundeOk },
    { id: "kennzeichnung", ok: kennOk },
  ];
  const gruende = [];
  if (!bildOk) gruende.push("bild");
  if (!altOk) gruende.push("alt");
  if (!quelleOk) gruende.push("quelle");
  if (!kundeOk) gruende.push("kundenprojekt");
  if (!kennOk) gruende.push("kennzeichnung");
  return { ok: gruende.length === 0, pruefungen, gruende, bildOk, altOk };
}

/** Text zum Kopieren: Titel, Text, Hashtags. */
export function socialKopiertext(b = {}) {
  return [b.titel, stripHtml(b.text), b.hashtags].filter(txt).join("\n\n");
}

/** Primäraktion je Social-Status (§ 2.9). */
export function socialPrimaer(status, { leitung = false, wartet = false } = {}) {
  if (status === "Idee") return "ausarbeiten";
  if (status === "Entwurf") return wartet ? (leitung ? "freigeben" : null) : leitung ? "freigeben" : "zurFreigabe";
  if (status === "Freigegeben") return "datumSetzen";
  if (status === "Geplant") return "alsVeroeffentlicht";
  if (status === "Veroeffentlicht") return "kennzahlen";
  if (status === "Verworfen") return leitung ? "wiederherstellen" : null;
  return null;
}

/** Montag der Woche (lokal). */
export function wochenStart(d = new Date()) {
  const x = alsDatum(d) || new Date();
  const tag = x.getDay() === 0 ? 6 : x.getDay() - 1;
  return new Date(x.getFullYear(), x.getMonth(), x.getDate() - tag);
}

export function kalenderwoche(d = new Date()) {
  const x = alsDatum(d) || new Date();
  const t = new Date(Date.UTC(x.getFullYear(), x.getMonth(), x.getDate()));
  const n = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - n);
  const j = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t - j) / 86400000 + 1) / 7);
}

// ------------------------------------------------------------------------------------------------- Empfehlungen

/**
 * Prüfampeln Storno · Lieferung · Zahlung · Frist aus AB und Lieferscheinen (R8, bis P0-8 in der Akte selbst).
 * ab: { status, offen_cent, storniert_am } | null; lieferscheine: [{ status, zugestellt_am }]
 */
export function empfehlungAmpeln({ ab, lieferscheine = [], heute = new Date(), ruecktrittTage = 14, cent = (c) => String(c) } = {}) {
  const T = EMPFEHLUNGEN.ampelText;
  if (!ab) {
    return {
      storno: { ok: null, text: T.lieferung.offen },
      lieferung: { ok: null, text: T.lieferung.offen },
      zahlung: { ok: null, text: T.lieferung.offen },
      frist: { ok: null, text: T.lieferung.offen },
      alleGruen: false,
      storniert: false,
      sperrgrund: T.lieferung.offen,
    };
  }
  const storniert = ab.status === "Storniert" || !!ab.storniert_am;
  const geliefert = ab.status === "Geliefert" || (lieferscheine.length > 0 && lieferscheine.every((l) => l.zugestellt_am || l.status === "Zugestellt"));
  const letzte = lieferscheine.map((l) => l.zugestellt_am).filter(Boolean).sort().pop() || null;
  const offen = Number(ab.offen_cent || 0);
  const fristEnde = letzte ? plusTage(letzte, Number(ruecktrittTage || 0)) : null;
  const fristOk = !!fristEnde && tageZwischen(fristEnde, heute) > 0;
  const r = {
    storno: { ok: !storniert, text: storniert ? T.storno.nein : T.storno.ok },
    lieferung: { ok: geliefert, text: geliefert ? T.lieferung.ok : T.lieferung.nein },
    zahlung: { ok: offen <= 0, text: offen <= 0 ? T.zahlung.ok : T.zahlung.nein(cent(offen)) },
    frist: { ok: fristOk, text: fristOk ? T.frist.ok : fristEnde ? T.frist.nein(tagMonat(fristEnde)) : T.lieferung.nein },
    letzteZustellung: letzte,
    storniert,
  };
  r.alleGruen = r.storno.ok && r.lieferung.ok && r.zahlung.ok && r.frist.ok;
  r.sperrgrund = !r.storno.ok ? T.storno.nein : !r.lieferung.ok ? T.lieferung.nein : !r.zahlung.ok ? r.zahlung.text : !r.frist.ok ? r.frist.text : null;
  return r;
}

/** Schrittleiste der Empfehlung (6 Schritte inkl. „Geliefert und bezahlt“, K6). */
export function empfehlungSchritt(e, { ampeln } = {}) {
  const s = e?.status;
  if (s === "Gutschein ausgegeben") return 5;
  if (s === "Gutschein faellig") return ampeln && !(ampeln.lieferung?.ok && ampeln.zahlung?.ok) ? 3 : 4;
  if (s === "Auftrag erteilt") return ampeln?.lieferung?.ok && ampeln?.zahlung?.ok ? 3 : 2;
  if (s === "Anfrage eingegangen") return 1;
  return 0;
}

/** Empfehlungscode wie der Server (EMP-XXXXXX, ohne verwechselbare Zeichen). */
export function empfehlungsCode(zufall = Math.random) {
  const z = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let c = "EMP-";
  for (let i = 0; i < 6; i++) c += z[Math.floor(zufall() * z.length)];
  return c;
}

// ------------------------------------------------------------------------------------------------- Bereitschaft

/** Offene Punkte vor dem Livebetrieb (K11) aus Fähigkeiten und Einstellungen. */
export function bereitschaftPunkte({ faehig = {}, einst = {}, heute = new Date() } = {}) {
  const robinsonOk = !!einst.ecg_abgleich_gueltig_bis && tageZwischen(heute, einst.ecg_abgleich_gueltig_bis) >= 0;
  const punkte = [
    { id: "P0-1", ok: !!faehig.einladungen },
    { id: "P0-2", ok: !!faehig.einladungen },
    { id: "P0-3", ok: !!faehig.einwilligungKanaele },
    { id: "P0-4", ok: !!faehig.bestandskunde },
    { id: "P0-5", ok: !!faehig.stoppRegeln },
    { id: "P0-6", ok: !!faehig.bestaetigungStapel },
    { id: "P0-7", ok: !!faehig.widerspruch },
    { id: "P0-8", ok: !!faehig.empfehlungAuftrag },
    { id: "P0-9", ok: !!faehig.gutschein },
    { id: "P0-10", ok: !!faehig.abmeldeToken },
    { id: "P0-11", ok: !!faehig.testmailIntern },
    { id: "kanzleiFusszeilen", ok: !!Number(einst.kanzlei_fusszeilen_freigegeben || 0) },
    { id: "kanzleiEinladung", ok: !!Number(einst.kanzlei_b_einladung_bestaetigt || 0) },
    { id: "robinson", ok: robinsonOk },
  ];
  return { punkte, offen: punkte.filter((p) => !p.ok).length, p0Offen: punkte.filter((p) => p.id.startsWith("P0") && !p.ok).length };
}
