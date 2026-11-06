// Reine Regeln der Ablage (Konzept §4) – Spiegel von Backend-Import/ph_ablage/ph_ablage/utils/regeln.py,
// damit Oberfläche und Mock dieselben Entscheidungen treffen wie der Server. Unit-Tests: tests/unit/ablage-regeln.test.mjs.
// Reines Modul (Browser, Server, node --test) – keine "@/"-Importe.

import {
  ALLGEMEINE_LEITUNG, AUDIO_ENDUNGEN, LOESCH_ROLLEN, AUFBEWAHRUNG, BEZUG_LEITUNG, BILD_ENDUNGEN, CAD_ENDUNGEN, MIME_EXTRA, NUR_LESEN,
  OFFICE_ENDUNGEN, PERSONAL_LEITUNG, SORT_SCHLUESSEL, STANDARD_GESPERRT, TEXT_ENDUNGEN, VIDEO_ENDUNGEN,
} from "./labels.js";

const UNERLAUBT = /[\x00-\x1f\x7f<>:"/\\|?*]/g;
const RESERVIERT = new Set(["con", "prn", "aux", "nul", ...Array.from({ length: 9 }, (_, i) => `com${i + 1}`), ...Array.from({ length: 9 }, (_, i) => `lpt${i + 1}`)]);
export const MAX_DATEINAME = 180;
export const MAX_TAGS = 20;

// ------------------------------------------------------------------ Namen --

/** Kleingeschriebene Endung ohne Punkt; "" ohne Endung. „Plan.final.DWG“ → „dwg“. */
export function endung(dateiname) {
  const base = String(dateiname || "").replace(/\\/g, "/").split("/").pop() || "";
  const ohne = base.replace(/^\.+|\.+$/g, "");
  if (!ohne.includes(".")) return "";
  const e = base.slice(base.lastIndexOf(".") + 1).trim().toLowerCase();
  return /^[a-z0-9]{1,10}$/.test(e) ? e : "";
}

/** Pfadanteile, Steuer-/Sonderzeichen entfernen, Länge begrenzen (Endung bleibt). Leer → null. */
export function dateinameBereinigen(dateiname) {
  let s = String(dateiname || "").replace(/\\/g, "/").split("/").pop() || "";
  s = s.replace(UNERLAUBT, "_").replace(/\s+/g, " ").trim().replace(/^\.+|\.+$/g, "").trim();
  if (!s) return null;
  const punkt = s.lastIndexOf(".");
  let stamm = punkt > 0 ? s.slice(0, punkt) : s;
  const end = punkt > 0 ? s.slice(punkt + 1) : "";
  if (RESERVIERT.has(stamm.toLowerCase())) stamm = `_${stamm}`;
  if (s.length > MAX_DATEINAME) {
    const rest = MAX_DATEINAME - (end ? end.length + 1 : 0);
    stamm = stamm.slice(0, Math.max(rest, 1)).trimEnd();
  }
  return end ? `${stamm}.${end}` : stamm;
}

/** Name ohne Endung (für Umbenennen: Endung bleibt fest). */
export function stamm(dateiname) {
  const e = endung(dateiname);
  return e ? String(dateiname).slice(0, -(e.length + 1)) : String(dateiname || "");
}

/** Neuer Name beim Umbenennen: Endung der Datei bleibt (Server erzwingt dasselbe). */
export function neuerDateiname(eingabe, alteEndung) {
  const b = dateinameBereinigen(eingabe);
  if (!b) return null;
  if (!alteEndung) return b;
  return endung(b) === alteEndung ? b : `${b}.${alteEndung}`;
}

/** „pdf, .DOCX\n dwg“ → Set. */
export function endungenListe(text) {
  return new Set(
    String(text || "")
      .split(/[\s,;]+/)
      .map((t) => t.trim())
      .filter((t) => /^\.?[A-Za-z0-9]{1,10}$/.test(t))
      .map((t) => t.replace(/^\./, "").toLowerCase())
  );
}

/** { ok, grund } – erlaubt leer = alle außer gesperrt; gesperrt null = Standard-Sperrliste. */
export function endungErlaubt(end, erlaubt = null, gesperrt = null) {
  const e = String(end || "").toLowerCase();
  const sperre = new Set(gesperrt == null ? STANDARD_GESPERRT : gesperrt);
  if (sperre.has(e)) return { ok: false, grund: "gesperrt" };
  const liste = erlaubt ? [...erlaubt] : [];
  if (liste.length && !liste.includes(e)) return { ok: false, grund: "nicht_erlaubt" };
  return { ok: true, grund: null };
}

export function mimeFuer(dateiname, angegeben) {
  const e = endung(dateiname);
  if (e && MIME_EXTRA[e]) return MIME_EXTRA[e];
  const a = String(angegeben || "").split(";")[0].trim().toLowerCase();
  return /^[a-z0-9.+-]+\/[a-z0-9.+-]+$/.test(a) ? a : "application/octet-stream";
}

export function vorschauArt(end) {
  const e = String(end || "").toLowerCase();
  if (BILD_ENDUNGEN.includes(e)) return "bild";
  if (e === "pdf") return "pdf";
  if (OFFICE_ENDUNGEN.includes(e)) return "office";
  if (CAD_ENDUNGEN.includes(e)) return "cad";
  if (VIDEO_ENDUNGEN.includes(e)) return "video";
  if (AUDIO_ENDUNGEN.includes(e)) return "audio";
  if (TEXT_ENDUNGEN.includes(e)) return "text";
  return "keine";
}

/** Größe wie der Server (1024er-Stufen, eine Nachkommastelle, Komma). */
export function groesseText(n) {
  const z = Math.max(0, Math.trunc(Number(n) || 0));
  for (const [einheit, f] of [["GB", 1024 ** 3], ["MB", 1024 ** 2], ["KB", 1024]]) {
    if (z >= f) return `${(z / f).toFixed(1).replace(".", ",")} ${einheit}`;
  }
  return `${z} B`;
}

/** Kürzel für die Endungs-Kachel („PDF“, „DWG“, „XLSX“ …), höchstens 4 Zeichen. */
export function typKuerzel(end) {
  const e = String(end || "").toUpperCase();
  return e ? e.slice(0, 4) : "";
}

/** Darstellung einer Vorschau in der Oberfläche: bild | pdf | video | audio | text | kachel. */
export function darstellung(datei, { officeVorschau = false } = {}) {
  const art = datei?.vorschau_art || vorschauArt(datei?.endung);
  if (art === "bild") return "bild";
  if (art === "pdf") return "pdf";
  if (art === "video") return "video";
  if (art === "audio") return "audio";
  if (art === "text") return "text";
  if (art === "office" && officeVorschau && datei?.vorschau_status === "Fertig") return "pdf";
  return "kachel";
}

// ------------------------------------------------------------------ Tags --

export function tagsNormalisieren(tags) {
  const liste = typeof tags === "string" ? tags.split(/[,;\n]+/) : Array.isArray(tags) ? tags : [];
  const out = [];
  const gesehen = new Set();
  for (const t of liste) {
    const x = String(t || "").replace(/,/g, " ").replace(/\s+/g, " ").trim().replace(/^#+/, "").slice(0, 40);
    if (x && !gesehen.has(x.toLowerCase())) {
      gesehen.add(x.toLowerCase());
      out.push(x);
    }
    if (out.length >= MAX_TAGS) break;
  }
  return out;
}

export const tagsText = (tags) => tagsNormalisieren(tags).join(", ");

export function suchbegriffe(q, max = 6) {
  return String(q || "")
    .trim()
    .split(/\s+/)
    .filter((t) => t.length >= 2)
    .slice(0, max)
    .map((t) => t.slice(0, 60));
}

export function sortGueltig(sort) {
  return SORT_SCHLUESSEL.includes(String(sort || "")) ? String(sort) : "name";
}

// ---------------------------------------------------------------- Zeiten --

function datum(d) {
  if (!d) return null;
  if (d instanceof Date) return d;
  const s = String(d).replace(" ", "T");
  const x = new Date(s.length === 10 ? `${s}T00:00:00` : s);
  return Number.isNaN(x.getTime()) ? null : x;
}

/** 31.12. des Jahres (Belegjahr + Frist) als ISO; null ohne Frist/Datum. */
export function aufbewahrenBis(klasse, belegdatum) {
  const r = AUFBEWAHRUNG[klasse || "Allgemein"] || AUFBEWAHRUNG.Allgemein;
  const d = datum(belegdatum);
  if (!r.jahre || !d) return null;
  return `${d.getFullYear() + r.jahre}-12-31`;
}

/** { ok, grund: null | "aufbewahrung" | "nur_leitung" } wie loeschen_erlaubt. */
export function loeschenErlaubt(klasse, bis, heute, istLeitung = false) {
  const r = AUFBEWAHRUNG[klasse || "Allgemein"] || AUFBEWAHRUNG.Allgemein;
  const b = datum(bis);
  const h = datum(heute) || new Date();
  if (r.sperre && b && tagIso(h) <= tagIso(b)) return { ok: false, grund: "aufbewahrung" };
  if (r.nurLeitung && !istLeitung) return { ok: false, grund: "nur_leitung" };
  return { ok: true, grund: null };
}

function tagIso(d) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function plusTage(d, n) {
  const x = new Date((datum(d) || new Date()).getTime());
  x.setDate(x.getDate() + Number(n || 0));
  return x;
}

export function papierkorbBis(geloeschtAm, tage = 30) {
  const d = datum(geloeschtAm);
  return d ? tagIso(plusTage(d, Math.max(Number(tage) || 30, 1))) : null;
}

/** Ganze Tage bis zum endgültigen Löschen (0 = heute fällig). */
export function resttage(bis, jetzt = new Date()) {
  const b = datum(bis);
  if (!b) return null;
  const a = new Date(datum(jetzt).getFullYear(), datum(jetzt).getMonth(), datum(jetzt).getDate());
  const z = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.max(0, Math.round((z - a) / 86_400_000));
}

/** „ok“ | „widerrufen“ | „abgelaufen“ | „aufgebraucht“ (freigabe_zustand). */
export function freigabeZustand(status, ablauf, jetzt = new Date(), zaehler = 0, maximum = 0) {
  if (status === "Widerrufen") return "widerrufen";
  const a = datum(ablauf);
  if (a && datum(jetzt) >= a) return "abgelaufen";
  if (maximum && Number(zaehler || 0) >= Number(maximum)) return "aufgebraucht";
  return "ok";
}

/** Anzeige-Status eines Links (Server-Status + Zustand jetzt). */
export function freigabeStatus(link, jetzt = new Date()) {
  const z = freigabeZustand(link?.status, link?.ablauf, jetzt, link?.downloads ?? link?.download_zaehler, link?.max_downloads);
  if (z === "widerrufen") return "Widerrufen";
  if (z === "abgelaufen") return "Abgelaufen";
  if (z === "aufgebraucht") return "Aufgebraucht";
  return link?.status === "Aktiv" || !link?.status ? "Aktiv" : link.status;
}

// ------------------------------------------------------------------ Sperre --

export function sperreAktiv(d, jetzt = new Date()) {
  const bis = datum(d?.gesperrt_bis);
  return Boolean(d?.gesperrt_von && bis && bis > datum(jetzt));
}

/** null | "eigen" | "fremd" */
export function sperreArt(d, user, jetzt = new Date()) {
  if (!sperreAktiv(d, jetzt)) return null;
  return d.gesperrt_von === user ? "eigen" : "fremd";
}

// ------------------------------------------------------------------ Rechte --

const hat = (rollen, liste) => (rollen || []).some((r) => liste.includes(r));

/** Leitung für einen Bezug (ist_leitung in rechte.py/regeln.py). Personal ersetzt die allgemeinen Leitungen. */
export function istLeitung(rollen, bezugDoctype = null) {
  if (bezugDoctype === "PH Mitarbeiter") return hat(rollen, PERSONAL_LEITUNG);
  if (hat(rollen, ALLGEMEINE_LEITUNG)) return true;
  return Boolean(bezugDoctype && hat(rollen, BEZUG_LEITUNG[bezugDoctype] || []));
}

/** Irgendeine Ablage-Leitung (Bericht, Einstellungen, Papierkorb endgültig ohne Bezug). */
export function istAblageLeitung(rollen) {
  return hat(rollen, ALLGEMEINE_LEITUNG);
}

/** Nur-lesende Rollen (Geschäftsführung) ohne weitere Rolle mit Schreibrecht. */
export function nurLesend(rollen, schreibRollen = []) {
  const r = rollen || [];
  return r.some((x) => NUR_LESEN.includes(x)) && !r.some((x) => schreibRollen.includes(x));
}

/**
 * Darf die Person den Ordner sehen? (darf_zugreifen: intern → Bezug lesbar; team → Team/Mitglied/Leitung;
 * leitung → nur Leitung). Im Backoffice-Mock gilt „team“ für alle mit Bereichsrecht (Teamfelder liegen im Bezug).
 */
export function darfOrdner(modus, rollen, bezugDoctype, { istTeam = true } = {}) {
  const leitung = istLeitung(rollen, bezugDoctype);
  if (bezugDoctype === "PH Mitarbeiter") return leitung;
  if (modus === "leitung") return leitung;
  if (modus === "team") return leitung || istTeam;
  return true;
}

/** Strengster Modus einer Kette (effektiver_modus). */
export function effektiverModus(kette) {
  const strenge = { intern: 0, team: 1, leitung: 2 };
  let best = "intern";
  for (const m of kette || []) if (m && strenge[m] > strenge[best]) best = m;
  return best;
}

/**
 * Aktionen an einer Datei für die Oberfläche: je Aktion { an, grund? }.
 * Gesperrte Aktionen tragen ihren Grund (Q-I5); unmögliche fehlen (an=false ohne Grund = ausblenden).
 */
export function dateiAktionen(d, { user, rollen = [], jetzt = new Date(), schreiben = true, portal = false } = {}) {
  const leitung = istLeitung(rollen, d?.bezug_doctype);
  const sperre = sperreArt(d, user, jetzt);
  const papierkorb = d?.status === "Papierkorb";
  const fremd = sperre === "fremd";
  const gesperrtGrund = fremd ? "Ausgecheckt von einer anderen Person" : null;
  const loe = loeschenErlaubt(d?.aufbewahrungsklasse, d?.aufbewahren_bis, jetzt, leitung);
  const loeGrund = !loe.ok ? (loe.grund === "aufbewahrung" ? `Aufbewahrungspflicht bis ${deutsch(d?.aufbewahren_bis)}` : "Nur Leitung") : null;
  const a = (an, grund = null) => ({ an: Boolean(an), grund: an ? null : grund });
  if (!schreiben) {
    return { herunterladen: a(!papierkorb), teilen: a(false), umbenennen: a(false), verschieben: a(false), neueVersion: a(false), auschecken: a(false), einchecken: a(false), aufheben: a(false), tags: a(false), aufbewahrung: a(false), papierkorb: a(false), wiederherstellen: a(false), endgueltig: a(false), portal: a(false), versionWiederherstellen: a(false) };
  }
  return {
    herunterladen: a(!papierkorb),
    teilen: a(!papierkorb, "Im Papierkorb"),
    umbenennen: a(!papierkorb && !fremd, gesperrtGrund),
    verschieben: a(!papierkorb && !fremd, gesperrtGrund),
    neueVersion: a(!papierkorb && !fremd, gesperrtGrund),
    auschecken: a(!papierkorb && !sperre, null),
    einchecken: a(sperre === "eigen"),
    aufheben: a(fremd && leitung, fremd ? "Nur Leitung" : null),
    tags: a(!papierkorb),
    aufbewahrung: a(!papierkorb && (leitung || d?.aufbewahrungsklasse !== "Beleg"), "Nur Leitung"),
    papierkorb: a(!papierkorb && !fremd && loe.ok, gesperrtGrund || loeGrund),
    wiederherstellen: a(papierkorb),
    endgueltig: a(papierkorb && hat(rollen, LOESCH_ROLLEN) && loe.ok, papierkorb ? loeGrund || "Nur Ablage-Leitung" : null),
    portal: a(!papierkorb && portal && d?.bezug_doctype === "PH Projekt", !portal ? "Kundenportal nicht eingerichtet" : "Nur bei Projektdateien"),
    versionWiederherstellen: a(!papierkorb && !fremd, gesperrtGrund),
  };
}

function deutsch(iso) {
  const d = datum(iso);
  if (!d) return "–";
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
}

// ------------------------------------------------------------------ Upload --

/**
 * Teile für den Upload (fortlaufend, offset = bereits erhalten).
 * @returns {{offset:number, laenge:number}[]}
 */
export function teilePlan(groesse, chunkBytes) {
  const g = Math.max(0, Number(groesse) || 0);
  const c = Math.max(1, Number(chunkBytes) || 8 * 1024 * 1024);
  const teile = [];
  for (let o = 0; o < g; o += c) teile.push({ offset: o, laenge: Math.min(c, g - o) });
  return teile;
}

/** (ok, code) wie chunk_pruefen. */
export function chunkPruefen(offset, laenge, erhalten, gesamt, maxChunk) {
  if (Number(laenge) <= 0) return { ok: false, code: "leer" };
  if (Number(laenge) > Number(maxChunk)) return { ok: false, code: "zu_gross" };
  if (Number(offset) !== Number(erhalten)) return { ok: false, code: "offset" };
  if (Number(erhalten) + Number(laenge) > Number(gesamt)) return { ok: false, code: "ueber_groesse" };
  return { ok: true, code: null };
}

/** Vorprüfung einer gewählten Datei gegen einstellungen_info → null oder Satz. */
export function uploadVorpruefung(datei, info = {}, texte = {}) {
  const e = endung(datei?.name);
  const r = endungErlaubt(e, info.erlaubte_endungen?.length ? info.erlaubte_endungen : null, info.gesperrte_endungen?.length ? info.gesperrte_endungen : null);
  if (!r.ok) return (texte.endungGesperrt || ((x) => `.${x} ist nicht erlaubt`))(e || "ohne Endung");
  if (info.max_bytes && datei.size > info.max_bytes) return (texte.zuGross || ((x) => `größer als ${x}`))(groesseText(info.max_bytes));
  if (!dateinameBereinigen(datei?.name)) return texte.nameLeer || "Dateiname fehlt";
  return null;
}

/** Wiederholungs-Wartezeiten bei Netzfehlern (1/2/4 s). */
export const WIEDERHOLUNG_MS = Object.freeze([1000, 2000, 4000]);

/** Anteil 0..1 eines Uploads aus Prüfsumme (20 %) und Teilen (80 %). */
export function uploadAnteil({ pruefung = 0, gesendet = 0, groesse = 0 } = {}) {
  const t = groesse > 0 ? gesendet / groesse : 1;
  return Math.max(0, Math.min(1, 0.2 * pruefung + 0.8 * t));
}

// ------------------------------------------------------------------- Baum --

/** Anzeigename eines Ordners: Stammordner zeigen den Titel des Bezugs („Küche am See“), sonst den Ordnertitel. */
export function ordnerName(o) {
  if (!o) return "";
  return Number(o.ist_bezugswurzel) && o.bezug_titel ? o.bezug_titel : o.titel;
}

/** Flache Liste aus dem verschachtelten Baum (für Suche/Pfad). */
export function baumFlach(wurzeln, tiefe = 0, eltern = null, out = []) {
  for (const k of wurzeln || []) {
    out.push({ ...k, tiefe, elternId: eltern });
    baumFlach(k.kinder, tiefe + 1, k.ordner, out);
  }
  return out;
}

/** Kette von der Wurzel bis zum Ordner aus einer Ordner-Map {ordner → {eltern}}. */
export function kette(ordnerId, karte) {
  const out = [];
  const gesehen = new Set();
  let o = karte instanceof Map ? karte.get(ordnerId) : karte?.[ordnerId];
  while (o && !gesehen.has(o.ordner)) {
    gesehen.add(o.ordner);
    out.unshift(o);
    o = o.eltern ? (karte instanceof Map ? karte.get(o.eltern) : karte?.[o.eltern]) : null;
  }
  return out;
}

/** Gruppen „Heute · Gestern · Diese Woche · Älter“ für „Zuletzt“. */
export function zeitGruppe(iso, jetzt = new Date()) {
  const d = datum(iso);
  if (!d) return "aelter";
  const j = datum(jetzt);
  const tag = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((tag(j) - tag(d)) / 86_400_000);
  if (diff <= 0) return "heute";
  if (diff === 1) return "gestern";
  if (diff < 7) return "woche";
  return "aelter";
}

/** Upload-Token / Freigabe-Token (URL-sicher). */
export function neuesToken(n = 24) {
  const z = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  const b = new Uint8Array(n);
  globalThis.crypto.getRandomValues(b);
  return Array.from(b, (x) => z[x % 64]).join("");
}

/** Token der öffentlichen Freigabeseite: nur URL-sichere Zeichen, 8–128. */
export function tokenGueltig(t) {
  return typeof t === "string" && /^[A-Za-z0-9_-]{8,128}$/.test(t);
}
