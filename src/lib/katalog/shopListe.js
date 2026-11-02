// src/lib/katalog/shopListe.js
// Shop-Liste der Accessoire-Welt (Inhaber 31.10.2026: „echtes Webshop-Gefühl“):
// Filter (Marke, Kategorie, Preis, Duftfamilie, Material), Sortierung,
// URL-Zustand, Facetten-Zählung, Preiszeile, Grundpreis, „Zuletzt angesehen“.
//
// Arbeitet auf KOMPAKTEN Einträgen (shopIndex.js baut sie auf dem Server):
//   { s: slug, n: name, m: markeSlug, k: kategorie,
//     i: [pfad, w, h] | null     Kachelbild (Freisteller zuerst, unverändert; pfad: bildKurz/bildSrc)
//     j: [pfad, w, h] | null     zweites Bild (Hover; Raumbild bevorzugt)
//     p: Cent | null, x: Cent | null   kleinster/größter anzeigbarer Preis
//     v: Anzahl Ausführungen (≥ 2, sonst 0)
//     o: 1 online bestellbar | 0 nur auf Anfrage | null (Shop aus: kein Badge)
//     a: 1 „Unsere Auswahl“ (AUSGEWAEHLT in index.js) | 0
//     f: { duft?: slug, material?: slug }   Facetten aus den Herstellermerkmalen
//     r: Rang (Standard-Reihenfolge) }
// Nichts wird erfunden: kein „Neu“ (kein Datenfeld), keine Lagerstände,
// keine Bewertungen. Pausierte Preise (PREISE_PAUSIERT) kommen als p = null an.
//
// Client-tauglich: KEINE Importe (weder Katalogdaten noch "@/") – die Insel
// ShopGrid.js lädt dieses Modul, nicht die 1.700 Produkte.

export const SEITE = 48;
export const FACETTEN = Object.freeze(["marke", "kategorie", "preis", "duft", "material"]);
export const SORTIERUNGEN = Object.freeze(["empfohlen", "preis-auf", "preis-ab", "name"]);
/** Preisstufen nach dem kleinsten Preis (Cent, obere Grenze exklusiv). */
export const PREIS_STUFEN = Object.freeze([
  Object.freeze({ id: "bis-50", bis: 5000 }),
  Object.freeze({ id: "50-100", bis: 10000 }),
  Object.freeze({ id: "100-250", bis: 25000 }),
  Object.freeze({ id: "ab-250", bis: Infinity }),
]);
/** Query-Parameter je Facette (deutsch wie die Pfade). */
const PARAM = Object.freeze({ marke: "marke", kategorie: "kategorie", preis: "preis", duft: "duft", material: "material" });
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Bildpfade kurz (Index ≈ −35 %): Ordner der Marke weglassen, Slug-Präfix → "~".
const BILD_ORDNER = "/Images/Wellness/produkte/";
export function bildKurz(src, { slug, marke }) {
  const ordner = `${BILD_ORDNER}${marke}/`;
  if (!String(src).startsWith(ordner)) return src;
  const rest = src.slice(ordner.length);
  return rest.startsWith(slug) ? `~${rest.slice(slug.length)}` : `=${rest}`;
}
/** Kurzpfad eines Eintrags → echter Pfad (unverändert, wenn schon absolut). */
export function bildSrc(e, pfad) {
  if (!pfad) return null;
  if (pfad[0] === "~") return `${BILD_ORDNER}${e.m}/${e.s}${pfad.slice(1)}`;
  if (pfad[0] === "=") return `${BILD_ORDNER}${e.m}/${pfad.slice(1)}`;
  return pfad;
}

export function preisStufe(cent) {
  if (!(cent > 0)) return null;
  return PREIS_STUFEN.find((s) => cent < s.bis).id;
}

/** Wert eines Eintrags für eine Facette (oder null). */
export function wertVon(e, key) {
  if (key === "marke") return e.m || null;
  if (key === "kategorie") return e.k || null;
  if (key === "preis") return preisStufe(e.p);
  return e.f?.[key] || null;
}

export const leereAuswahl = () => Object.fromEntries(FACETTEN.map((k) => [k, []]));

/** true, wenn irgendeine Facette gewählt ist. */
export const hatAuswahl = (sel) => FACETTEN.some((k) => sel?.[k]?.length);

/**
 * URL → { sel, sort }. Unbekannte Werte werden verworfen (nur Slug-Form,
 * höchstens 20 je Facette); erlaubte Werte optional über `erlaubt[key]` (Set/Array).
 */
export function auswahlAusQuery(search = "", erlaubt = null) {
  const q = new URLSearchParams(String(search).replace(/^\?/, ""));
  const sel = leereAuswahl();
  for (const key of FACETTEN) {
    const raw = q.get(PARAM[key]);
    if (!raw) continue;
    const ok = erlaubt?.[key] ? new Set(erlaubt[key]) : null;
    sel[key] = [...new Set(raw.split(",").map((s) => s.trim()).filter((s) => SLUG.test(s) && (!ok || ok.has(s))))].slice(0, 20);
  }
  const s = q.get("sort");
  return { sel, sort: SORTIERUNGEN.includes(s) ? s : "empfohlen" };
}

/**
 * { sel, sort } → Query-String ("" ohne Auswahl). Fremde Parameter aus `basis`
 * (z. B. utm_*) bleiben erhalten, eigene werden ersetzt.
 */
export function queryAus(sel, sort = "empfohlen", basis = "") {
  const q = new URLSearchParams(String(basis).replace(/^\?/, ""));
  for (const key of FACETTEN) q.delete(PARAM[key]);
  q.delete("sort");
  q.delete("seite");
  for (const key of FACETTEN) if (sel?.[key]?.length) q.set(PARAM[key], [...sel[key]].sort().join(","));
  if (sort && sort !== "empfohlen" && SORTIERUNGEN.includes(sort)) q.set("sort", sort);
  const s = q.toString().replace(/%2C/g, ",");
  return s ? `?${s}` : "";
}

/** Einträge, die zur Auswahl passen (ODER innerhalb einer Facette, UND zwischen Facetten). `ohne`: diese Facette ignorieren. */
export function filtern(list, sel, ohne = null) {
  const aktiv = FACETTEN.filter((k) => k !== ohne && sel?.[k]?.length);
  if (!aktiv.length) return list;
  return list.filter((e) => aktiv.every((k) => sel[k].includes(wertVon(e, k))));
}

/**
 * Facetten mit Zählung (disjunktiv: die Zahl einer Option gilt bei allen
 * ANDEREN gewählten Facetten). Gewählte Optionen bleiben sichtbar, auch mit 0.
 * → { [key]: [{ value, count }] } in Reihenfolge `reihenfolge[key]` bzw. Häufigkeit.
 */
export function facetten(list, sel = leereAuswahl(), reihenfolge = {}) {
  const out = {};
  for (const key of FACETTEN) {
    const counts = new Map();
    for (const e of filtern(list, sel, key)) {
      const v = wertVon(e, key);
      if (v) counts.set(v, (counts.get(v) || 0) + 1);
    }
    for (const v of sel?.[key] || []) if (!counts.has(v)) counts.set(v, 0);
    const order = key === "preis" ? PREIS_STUFEN.map((s) => s.id) : reihenfolge[key];
    const rows = [...counts].map(([value, count]) => ({ value, count }));
    if (order?.length) rows.sort((a, b) => idx(order, a.value) - idx(order, b.value));
    else rows.sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
    out[key] = rows;
  }
  return out;
}
const idx = (arr, v) => {
  const i = arr.indexOf(v);
  return i < 0 ? arr.length : i;
};

/** Sortierung; Einträge ohne Preis stehen bei Preis-Sortierung am Ende. Stabil über r. */
export function sortieren(list, sort = "empfohlen", locale = "de") {
  const out = [...list];
  const rang = (a, b) => (a.r ?? 0) - (b.r ?? 0);
  if (sort === "preis-auf" || sort === "preis-ab") {
    const dir = sort === "preis-auf" ? 1 : -1;
    out.sort((a, b) => (a.p == null) - (b.p == null) || (a.p != null && b.p != null ? dir * (a.p - b.p) : 0) || rang(a, b));
  } else if (sort === "name") {
    const coll = new Intl.Collator(locale, { sensitivity: "base", numeric: true });
    out.sort((a, b) => coll.compare(a.n, b.n) || rang(a, b));
  } else out.sort(rang);
  return out;
}

/**
 * Standard-Reihenfolge einer Liste (deterministisch, für Server und Client gleich):
 * „Unsere Auswahl“ zuerst, dann reihum je Gruppe (`gruppe`: "m" Marke oder "k" Kategorie),
 * damit die erste Seite die Breite des Sortiments zeigt statt 120 Kerzen am Stück;
 * innerhalb einer Gruppe bleibt die Katalogreihenfolge. Einträge ohne Bild zuletzt.
 * Schreibt r = Position (neue Objekte).
 */
export function mischen(list, gruppe = "m") {
  const mitBild = list.filter((e) => e.i);
  const ohneBild = list.filter((e) => !e.i);
  const auswahl = mitBild.filter((e) => e.a);
  const rest = mitBild.filter((e) => !e.a);
  const queues = new Map();
  for (const e of rest) {
    const g = e[gruppe] || "";
    if (!queues.has(g)) queues.set(g, []);
    queues.get(g).push(e);
  }
  const reihum = [];
  const qs = [...queues.values()];
  for (let i = 0; reihum.length < rest.length; i++) for (const q of qs) if (q[i]) reihum.push(q[i]);
  return [...auswahl, ...reihum, ...ohneBild].map((e, r) => ({ ...e, r }));
}

// ------------------------------------------------------------------ Preise
const NUM = { de: "de-AT", en: "en-GB", fr: "fr-FR", it: "it-IT" };

/** „€ 119“ / „€ 49,90“ (Cent nur, wenn vorhanden) – gleiche Regel wie Katalog/preis.js formatEuro. */
export function euroAusCent(cent, locale = "de") {
  const betrag = cent / 100;
  const ganz = Number.isInteger(betrag);
  return new Intl.NumberFormat(NUM[locale] || "de-AT", { style: "currency", currency: "EUR", minimumFractionDigits: ganz ? 0 : 2, maximumFractionDigits: ganz ? 0 : 2 }).format(betrag);
}

/** Preiszeile der Kachel: „€ 49,90“ bzw. „ab € 119“ (copy.ab = "ab {preis}"), sonst null. */
export function kachelPreis(e, locale, copy) {
  if (e?.p == null) return null;
  const p = euroAusCent(e.p, locale);
  return e.x != null && e.x !== e.p ? copy.ab.replace("{preis}", p) : p;
}

/**
 * Kategorien, in denen der Grundpreis gezeigt wird (Ware nach Volumen: PrAG § 10a,
 * PAngV § 4). Bewusst NICHT „glas“/„geschirr“/„karaffe“: dort ist inhaltMl das
 * Fassungsvermögen, kein verkaufter Inhalt; Duftkerzen sind Stückware.
 * EINE Liste für Anzeige UND Kasse: lib/shop/catalog.js GRUNDPREIS_KATEGORIEN ist
 * genau diese Konstante (Raumduft, Diffuser, Parfum – Ideen-Team fix-01).
 */
export const GRUNDPREIS_ANZEIGE = Object.freeze(["raumduft", "diffuser", "parfum"]);

/** Inhalt einer Preis-Variante aus den Herstellerdaten (inhaltMl/inhaltG) → { menge, einheit } | null. */
export const inhaltDerVariante = (v) => (v?.inhaltMl > 0 ? { menge: v.inhaltMl, einheit: "ml" } : v?.inhaltG > 0 ? { menge: v.inhaltG, einheit: "g" } : null);

/** Inhalt auf Artikelebene (p.inhalt), nur mit gültiger Menge und Einheit → { menge, einheit } | null. */
export const inhaltDesArtikels = (p) => (p?.inhalt && Number(p.inhalt.menge) > 0 && ["ml", "l", "g", "kg"].includes(p.inhalt.einheit) ? p.inhalt : null);

/**
 * Grundpreis (PrAG § 10a, PAngV 2022 § 4/§ 5: Mengeneinheit 1 l bzw. 1 kg) – die
 * EINZIGE Rechnung (lib/shop/catalog.js re-exportiert sie für Warenkorb/Kasse).
 * Ob für kleine Füllmengen 100 ml/100 g zulässig sind, prüft die Kanzlei;
 * bis dahin einheitlich je 1 l / 1 kg.
 * @param {number} cent
 * @param {{menge: number, einheit: "ml"|"l"|"g"|"kg"}|null} inhalt
 * → { cent, je: "1 l" | "1 kg" } | null
 */
export function grundpreis(cent, inhalt) {
  if (!inhalt || !(cent > 0)) return null;
  const base = inhalt.einheit === "l" || inhalt.einheit === "kg" ? inhalt.menge * 1000 : inhalt.menge;
  const vol = inhalt.einheit === "ml" || inhalt.einheit === "l";
  if (!(base > 0)) return null;
  return { cent: Math.round((cent / base) * 1000), je: vol ? "1 l" : "1 kg" };
}

/** Grundpreis aus Varianten-Feldern ({inhaltMl}|{inhaltG}) – dieselbe Rechnung wie grundpreis(). */
export const grundpreisVariante = (cent, v) => grundpreis(cent, inhaltDerVariante(v));

// ------------------------------------------------------------------ Zuletzt angesehen
export const ANGESEHEN_KEY = "ph-katalog-angesehen";
export const ANGESEHEN_MAX = 12;
const PFAD = /^\/[a-z0-9-]+\/produkte\/[a-z0-9-]+$/;
const BILD = /^\/Images\/[A-Za-z0-9/._-]+$/;

/** Gespeicherte Liste prüfen (nur erwartete Felder, nur interne Pfade/Bilder). */
export function angesehenLesen(raw) {
  try {
    const list = JSON.parse(raw || "[]");
    if (!Array.isArray(list)) return [];
    return list
      .filter((x) => x && SLUG.test(x.s) && typeof x.n === "string" && PFAD.test(x.h) && (x.b == null || typeof x.b === "string") && (x.i == null || BILD.test(x.i)))
      .map((x) => ({ s: x.s, n: x.n.slice(0, 120), b: x.b ? x.b.slice(0, 60) : null, h: x.h, i: x.i || null }))
      .slice(0, ANGESEHEN_MAX);
  } catch {
    return [];
  }
}

/** Eintrag vorne einfügen (ohne Doppelte), höchstens ANGESEHEN_MAX. */
export function angesehenMerken(list, item) {
  const ok = angesehenLesen(JSON.stringify([item]));
  if (!ok.length) return list;
  return [ok[0], ...list.filter((x) => x.s !== ok[0].s)].slice(0, ANGESEHEN_MAX);
}
