// Hilfe-Lader (G-26, K-24, MASTER § 3.5): liest die Artikel aus backoffice/hilfe/<bereich>/<seite>.md
// (Inhalt schreibt Team Q5, ≤ 200 Wörter, Bilder als Beschreibung). Der Lader ordnet einer Route den
// passendsten Artikel zu, zerlegt Markdown in sichere Blöcke (kein HTML aus der Datei) und liefert
// „Was kann ich hier tun?“ (Navigation + Schnellaktionen des Bereichs nach Rechten) sowie die Kürzel der Seite.
// Kein "server-only": die reinen Funktionen laufen auch unter node --test; Dateizugriff nur in lade*().

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { BEREICHE, BEREICH_SLUGS, navigationFuer } from "./bereiche/index.js";
import { SCHNELLAKTIONEN } from "./suche/register.js";
import { anzeigeText, eintraegeFuer } from "./kuerzel/index.js";

/** Ordner der Artikel (Dev und Betrieb: Arbeitsverzeichnis = backoffice/). */
export function hilfeOrdner() {
  return path.join(process.cwd(), "hilfe");
}

const SEGMENT = /^[a-z0-9][a-z0-9-]{0,60}$/;

/** Route ohne Query/Hash, ohne abschließenden Schrägstrich; „/“ bleibt „/“. */
export function normalisierePfad(pfad = "/") {
  const p = String(pfad || "/").split(/[?#]/)[0].replace(/\/{2,}/g, "/");
  const ohne = p.length > 1 ? p.replace(/\/+$/, "") : p;
  return ohne.startsWith("/") ? ohne : `/${ohne}`;
}

/**
 * Artikel-Kandidaten einer Route, spezifischster zuerst. Schlüssel = „<bereich>/<seite>“.
 *   /                      → zentrale/start
 *   /crm                   → crm/start
 *   /crm/anfragen          → crm/anfragen, crm/start
 *   /crm/anfragen/A-1187   → crm/anfragen-akte, crm/anfragen, crm/start
 *   /d/ph-anfrage          → d/ph-anfrage, allgemein/liste
 *   /d/ph-anfrage/PH-…     → d/ph-anfrage-akte, d/ph-anfrage, allgemein/formular
 * Unbekannte erste Segmente (einstellungen, benutzer …) gehören zur Zentrale.
 */
export function hilfeKandidaten(pfad) {
  const teile = normalisierePfad(pfad).split("/").filter(Boolean).map((t) => decodeURIComponent(t).toLowerCase());
  if (!teile.length) return ["zentrale/start"];
  if (teile[0] === "d") {
    const slug = teile[1];
    if (!slug || !SEGMENT.test(slug)) return ["allgemein/liste"];
    return teile.length > 2 ? [`d/${slug}-akte`, `d/${slug}`, "allgemein/formular"] : [`d/${slug}`, "allgemein/liste"];
  }
  const bereich = BEREICH_SLUGS.includes(teile[0]) ? teile[0] : "zentrale";
  const rest = bereich === teile[0] ? teile.slice(1) : teile;
  const k = [];
  const seite = rest[0] && SEGMENT.test(rest[0]) ? rest[0] : null;
  if (seite && rest.length > 1) k.push(`${bereich}/${seite}-akte`);
  if (seite) k.push(`${bereich}/${seite}`);
  k.push(`${bereich}/start`);
  return k;
}

/** Bereichs-Slug einer Route (für „Was kann ich hier tun?“). */
export function bereichFuerPfad(pfad) {
  const p = normalisierePfad(pfad);
  if (p === "/") return "zentrale";
  const erstes = p.split("/")[1];
  if (BEREICH_SLUGS.includes(erstes)) return erstes;
  for (const b of BEREICHE) {
    if (b.slug === "zentrale") continue;
    if ((b.navigation || []).some((n) => n.href !== "/" && (p === n.href || p.startsWith(`${n.href}/`)))) return b.slug;
  }
  return "zentrale";
}

/** Sicherer Dateipfad eines Schlüssels „bereich/seite“ unterhalb des Hilfe-Ordners, sonst null. */
export function artikelDatei(schluessel, ordner = hilfeOrdner()) {
  const [b, s, ...rest] = String(schluessel || "").split("/");
  if (rest.length || !SEGMENT.test(b || "") || !SEGMENT.test(s || "")) return null;
  const datei = path.join(ordner, b, `${s}.md`);
  return datei.startsWith(path.join(ordner, path.sep)) ? datei : null;
}

/**
 * Markdown → sichere Blöcke. Unterstützt: optionales Front-Matter (---), „# Titel“, „## Abschnitt“,
 * Absätze, Listen (- / * / 1.), **fett** (als Teil-Liste). Kein HTML, keine Links mit Skript.
 * @returns {{titel:string|null, bloecke:Array<{art:"h"|"p"|"liste", text?:Array<{t:string,fett?:boolean}>, eintraege?:Array<Array<{t:string,fett?:boolean}>>}>}}
 */
export function zerlegeMarkdown(roh = "") {
  let text = String(roh).replace(/\r\n?/g, "\n");
  if (text.startsWith("---\n")) {
    const ende = text.indexOf("\n---", 4);
    if (ende > 0) text = text.slice(ende + 4);
  }
  const zeilen = text.split("\n");
  let titel = null;
  const bloecke = [];
  let absatz = [];
  let liste = null;
  const schliesse = () => {
    if (absatz.length) bloecke.push({ art: "p", text: inline(absatz.join(" ")) });
    absatz = [];
    if (liste) bloecke.push({ art: "liste", eintraege: liste });
    liste = null;
  };
  for (const z of zeilen) {
    const t = z.trim();
    if (!t) {
      schliesse();
      continue;
    }
    if (/^#\s+/.test(t) && titel === null && !bloecke.length) {
      titel = t.replace(/^#\s+/, "").trim();
      continue;
    }
    if (/^#{1,6}\s+/.test(t)) {
      schliesse();
      bloecke.push({ art: "h", text: inline(t.replace(/^#{1,6}\s+/, "")) });
      continue;
    }
    const li = t.match(/^(?:[-*]|\d+[.)])\s+(.*)$/);
    if (li) {
      if (absatz.length) {
        bloecke.push({ art: "p", text: inline(absatz.join(" ")) });
        absatz = [];
      }
      (liste ||= []).push(inline(li[1]));
      continue;
    }
    if (liste) {
      bloecke.push({ art: "liste", eintraege: liste });
      liste = null;
    }
    absatz.push(t);
  }
  schliesse();
  return { titel, bloecke };
}

/** **fett** und `code` (als normaler Text) → Teile; Markdown-Links [x](y) → nur Text x. */
function inline(s) {
  const sauber = String(s).replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/`([^`]+)`/g, "$1").replace(/<[^>]*>/g, "");
  const teile = [];
  const re = /\*\*([^*]+)\*\*/g;
  let i = 0;
  let m;
  while ((m = re.exec(sauber))) {
    if (m.index > i) teile.push({ t: sauber.slice(i, m.index) });
    teile.push({ t: m[1], fett: true });
    i = m.index + m[0].length;
  }
  if (i < sauber.length) teile.push({ t: sauber.slice(i) });
  return teile.length ? teile : [{ t: "" }];
}

/**
 * Artikel einer Route laden (erster vorhandener Kandidat) oder null.
 * @returns {Promise<{schluessel:string, titel:string, bloecke:Array, href:string}|null>}
 */
export async function ladeHilfe(pfad, { ordner = hilfeOrdner(), lesen = readFile } = {}) {
  for (const k of hilfeKandidaten(pfad)) {
    const datei = artikelDatei(k, ordner);
    if (!datei) continue;
    try {
      const roh = await lesen(datei, "utf8");
      const { titel, bloecke } = zerlegeMarkdown(roh);
      return { schluessel: k, titel: titel || k, bloecke, href: `/hilfe/${k}` };
    } catch {
      // nächster Kandidat
    }
  }
  return null;
}

/** Ein Artikel direkt über seinen Schlüssel (Seite /hilfe/<bereich>/<seite>). */
export async function ladeArtikel(schluessel, { ordner = hilfeOrdner(), lesen = readFile } = {}) {
  const datei = artikelDatei(schluessel, ordner);
  if (!datei) return null;
  try {
    const { titel, bloecke } = zerlegeMarkdown(await lesen(datei, "utf8"));
    return { schluessel, titel: titel || schluessel, bloecke, href: `/hilfe/${schluessel}` };
  } catch {
    return null;
  }
}

/** Alle Artikel (Übersicht /hilfe), gruppiert nach Bereich in Navigationsreihenfolge. */
export async function alleHilfeArtikel({ ordner = hilfeOrdner() } = {}) {
  let ordnerListe = [];
  try {
    ordnerListe = await readdir(ordner, { withFileTypes: true });
  } catch {
    return [];
  }
  const gruppen = [];
  for (const d of ordnerListe) {
    if (!d.isDirectory() || !SEGMENT.test(d.name)) continue;
    let dateien = [];
    try {
      dateien = await readdir(path.join(ordner, d.name));
    } catch {
      continue;
    }
    const artikel = [];
    for (const f of dateien.filter((f) => f.endsWith(".md")).sort()) {
      const k = `${d.name}/${f.slice(0, -3)}`;
      const a = await ladeArtikel(k, { ordner });
      if (a) artikel.push({ schluessel: k, titel: a.titel, href: a.href });
    }
    if (artikel.length) {
      const b = BEREICHE.find((x) => x.slug === d.name);
      gruppen.push({ bereich: d.name, titel: b?.titel || (d.name === "allgemein" ? "Allgemein" : d.name === "d" ? "Listen und Formulare" : d.name), artikel });
    }
  }
  const rang = (s) => (BEREICH_SLUGS.indexOf(s) < 0 ? 99 : BEREICH_SLUGS.indexOf(s));
  return gruppen.sort((a, b) => rang(a.bereich) - rang(b.bereich));
}

/**
 * „Was kann ich hier tun?“: Unterbereiche und Schnellaktionen des Bereichs der Route, nach Rechten.
 * @param {string} pfad
 * @param {(bereich:string, aktion:string) => boolean} darf
 * @returns {{bereich:string, titel:string, seiten:Array<{titel:string,href:string}>, aktionen:Array<{titel:string,href:string}>}}
 */
export function wasKannIch(pfad, darf) {
  const slug = bereichFuerPfad(pfad);
  const b = BEREICHE.find((x) => x.slug === slug);
  if (!b || !darf(slug, "read")) return { bereich: slug, titel: b?.titel || "", seiten: [], aktionen: [] };
  const p = normalisierePfad(pfad);
  const seiten = navigationFuer(b, { erlaubt: (r) => darf(r.bereich, r.aktion) })
    .filter((n) => n.href !== p)
    .slice(0, 6)
    .map((n) => ({ titel: n.titel, href: n.href }));
  const aktionen = SCHNELLAKTIONEN.filter((a) => a.bereich === slug && darf(a.bereich, a.aktion))
    .slice(0, 4)
    .map((a) => ({ titel: a.titel, href: a.href }));
  return { bereich: slug, titel: b.titel, seiten, aktionen };
}

/** Kontexte der Kürzel einer Route, seitenspezifisch zuerst: liste (Listen) bzw. akte (Datensatz), dann global. */
export function kuerzelKontexte(pfad) {
  const teile = normalisierePfad(pfad).split("/").filter(Boolean);
  const k = [];
  if (teile[0] === "d") k.push(teile.length > 2 ? "akte" : "liste");
  if (teile.length === 0) k.push("zentrale");
  k.push("global");
  return k;
}

/** Kürzel der Seite (ohne Gehe-zu-Folge, die zeigt der Kürzel-Dialog), Anzeige Windows. */
export function kuerzelFuerSeite(pfad, { max = 12 } = {}) {
  const out = [];
  const gesehen = new Set();
  for (const kontext of kuerzelKontexte(pfad)) {
    for (const e of eintraegeFuer(kontext)) {
      if (e.gruppe || gesehen.has(e.titel)) continue;
      gesehen.add(e.titel);
      out.push({ taste: anzeigeText(e.taste), titel: e.titel });
    }
  }
  return out.slice(0, max);
}
