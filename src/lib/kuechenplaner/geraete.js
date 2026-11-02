// Küchenplaner – Geräte aus dem Herstellerkatalog (src/lib/katalog/) in die
// Gerätemodule einsetzen (Backofen, Kompaktgerät, Kochfeld, Abzug, Kühlen,
// Geschirrspüler, Weinklima, Armatur).
//
// Regeln (Inhaber-Entscheidungen Nr. 24/26/34, schema.js):
//   - NUR Daten, die im Katalog stehen (masse[], name, serie, preis). Nichts
//     schätzen: fehlt ein Maß, heißt das Ergebnis „pruefen“, nie „passt“.
//   - Preis nur über preisAktiv() (Schalter KATALOG_PREISE, PREISE_PAUSIERT,
//     Höchstalter, gültige Quelle) und im Wortlaut der Katalogseiten
//     (katalog.preis.* in src/messages/de.json). Kein Preis fließt in den
//     Richtwert des Planers (pricing.js) – UVP/Herstellerpreis sind andere Größen.
//   - Kein Händlersatz hier. Der kommt nur aus src/lib/legal/claims.js.
//
// Ablage im Plan: je Modul optional `d` = Liste von Produkt-Slugs, Position =
// Gerätesteckplatz (geraeteSlots), "" = frei. Ein Gerät, das nach einer
// Änderung (Breite, Option, Sockel) nicht mehr passt, bleibt gewählt und wird
// als „passt nicht“ gemeldet – der Kunde entscheidet, nichts verschwindet still.
//
// Rein, ohne "@/"-Importe und ohne den großen Katalog-Index: Der Server baut
// mit buildGeraeteIndex() eine schlanke Liste und reicht sie an den Client.

import { opt } from "./options.js";
import { produktPath } from "../katalog/welten.js";
import { preisAktiv, preisBezeichnung, textOf } from "../katalog/schema.js";

/** Katalog-Kategorien, die der Planer anbietet. */
export const GERAETE_KATEGORIEN = Object.freeze([
  "backofen", "dampfgarer", "kompaktgeraet", "mikrowelle", "waermeschublade", "vakuumierschublade",
  "kochfeld", "kochfeld-mit-abzug", "dunstabzug", "kuehlen", "gefrieren", "weinklima",
  "geschirrspueler", "armatur", "armatur-kochendwasser",
]);

// Höhen-/Nischenklassen in cm. Quelle der Klassen: norms.js (NICHES, mit URL);
// Bänder = Gerätehöhen bzw. Nischenmaße, wie sie die Hersteller angeben.
//   dev  = zulässige Gerätehöhe (Außenmaß laut masse.hoehe)
//   nis  = Nischenhöhe, mit der eine Nischenangabe im Katalog überlappen muss
export const KLASSEN = Object.freeze({
  ofen60: { label: "Backofen-Nische 60", dev: [58, 60.5], nis: [58.5, 60] },
  kompakt45: { label: "Kompaktnische 45", dev: [44, 46.5], nis: [45, 45.5] },
  k178: { label: "Kühlnische 178", dev: [176, 178.8], nis: [177.2, 178.8] },
  k122: { label: "Kühlnische 122", dev: [120.5, 122.5], nis: [121.6, 123.6] },
});

/** Steckplatz-Arten: Beschriftung, Kategorien, Breitenregel, Höhenregel. */
export const SLOT_ARTEN = Object.freeze({
  ofen60: { label: "Backofen", kat: ["backofen"], breite: "aussen", hoehe: "ofen60" },
  dampf45: { label: "Dampfgarer / Kompaktgerät", kat: ["dampfgarer", "kompaktgeraet"], breite: "aussen", hoehe: "kompakt45" },
  mikro45: { label: "Mikrowelle / Kompaktgerät", kat: ["mikrowelle", "kompaktgeraet"], breite: "aussen", hoehe: "kompakt45" },
  schublade: { label: "Wärme- / Vakuumierschublade", kat: ["waermeschublade", "vakuumierschublade"], breite: "aussen", hoehe: null },
  kochfeld: { label: "Kochfeld", kat: ["kochfeld"], breite: "kochfeld", hoehe: null },
  kochfeldAbzug: { label: "Kochfeld mit Abzug", kat: ["kochfeld-mit-abzug"], breite: "kochfeld", hoehe: null },
  abzug: { label: "Dunstabzug", kat: ["dunstabzug"], breite: null, hoehe: null },
  kuehl178: { label: "Kühlgerät", kat: ["kuehlen"], breite: "integriert", hoehe: "k178" },
  gefrier178: { label: "Gefriergerät", kat: ["gefrieren"], breite: "integriert", hoehe: "k178" },
  kuehl122: { label: "Kühlgerät", kat: ["kuehlen"], breite: "integriert", hoehe: "k122" },
  kuehlFrei: { label: "Kühlgerät (freistehend)", kat: ["kuehlen"], breite: "frei", hoehe: null },
  geschirr: { label: "Geschirrspüler", kat: ["geschirrspueler"], breite: "aussen", hoehe: "unterbau" },
  weinUnten: { label: "Weinklimagerät (Unterbau)", kat: ["weinklima"], breite: "aussen", hoehe: "unterbau" },
  weinHoch: { label: "Weinklimagerät", kat: ["weinklima"], breite: "integriert", hoehe: null },
  armatur: { label: "Armatur", kat: ["armatur", "armatur-kochendwasser"], breite: null, hoehe: null },
});

const slot = (art, w) => ({ art, w, ...SLOT_ARTEN[art] });

/**
 * Gerätesteckplätze eines Moduls (Reihenfolge = Position in m.d).
 * @returns {Array<{art, w, label, kat, breite, hoehe}>}
 */
export function geraeteSlots(m) {
  const w = m?.w;
  switch (m?.t) {
    case "backofen": {
      const g = opt(m, "g");
      if (g === "d") return [slot("ofen60", w), slot("dampf45", w)];
      if (g === "m") return [slot("ofen60", w), slot("mikro45", w)];
      if (g === "w") return [slot("ofen60", w), slot("schublade", w)];
      if (g === "2") return [slot("ofen60", w), slot("ofen60", w)];
      return [slot("ofen60", w)];
    }
    case "backofenus":
      return [slot("ofen60", w)];
    case "kochfeld": {
      const a = opt(m, "a");
      if (a === "m") return [slot("kochfeldAbzug", w)];
      if (a === "n") return [slot("kochfeld", w)];
      return [slot("kochfeld", w), slot("abzug", w)];
    }
    case "spuele":
      return [slot("armatur", w)];
    case "geschirrspueler":
      return [slot("geschirr", w)];
    case "kuehlschrank": {
      const k = opt(m, "k");
      if (k === "1") return [slot("kuehl122", w)];
      if (k === "g") return [slot("gefrier178", w)];
      return [slot("kuehl178", w)];
    }
    case "sidebyside":
      return opt(m, "s") === "f" ? [slot("kuehlFrei", w)] : [slot("kuehl178", w / 2), slot("gefrier178", w / 2)];
    case "weinkuehler":
      return [slot("weinUnten", w)];
    case "weinklima":
      return [slot("weinHoch", w)];
    default:
      return [];
  }
}

// ---- Maße aus dem Katalog lesen (nur, was dort steht) -------------------------

const num = (s) => Number(String(s).replace(",", "."));
/** "595 mm" → 59.5, "60 cm" → 60, sonst null. */
export function cmWert(wert) {
  const m = /^\s*(?:ca\.\s*)?(\d+(?:[.,]\d+)?)\s*(mm|cm)\b/.exec(String(wert ?? ""));
  if (!m) return null;
  const v = num(m[1]);
  return m[2] === "mm" ? Math.round(v) / 10 : v;
}

const RANGE = String.raw`(\d+(?:[.,]\d+)?)(?:\s*[–-]\s*(\d+(?:[.,]\d+)?))?`;
const rng = (a, b, f = 1) => [num(a) * f, num(b ?? a) * f].map((v) => Math.round(v * 10) / 10);

/**
 * Nischenangabe des Katalogs lesen. Zwei Schreibweisen kommen vor:
 *   „B 560–568 mm · H 594–600 mm · T ≥ 560 mm“ (Miele, V-ZUG)
 *   „87,4–89 / 121,6–123,6 × 56–57 × 55 cm“ (Liebherr: Höhen × Breite × Tiefe, Varianten mit „ · “)
 * → { b: [[min,max]…], h: [[min,max]…] } in cm oder null; „Gesamthöhe ≥ …“ (Quooker) → null.
 */
export function parseNische(wert) {
  const s = String(wert ?? "");
  const out = { b: [], h: [] };
  const bh = (key, re) => {
    const m = re.exec(s);
    if (m) out[key].push(rng(m[1], m[2], /mm/.test(m[3]) ? 0.1 : 1));
  };
  if (/\bB\s*\d/.test(s) || /\bH\s*\d/.test(s)) {
    bh("b", new RegExp(String.raw`\bB\s*${RANGE}\s*(mm|cm)`));
    bh("h", new RegExp(String.raw`\bH\s*${RANGE}\s*(mm|cm)`));
  } else if (/×/.test(s) && /cm\s*$/.test(s.trim())) {
    for (const teil of s.split(/\s+·\s+/)) {
      const [hs, bs] = teil.replace(/cm\s*$/, "").split("×").map((x) => x.trim());
      if (!hs || !bs) continue;
      for (const h of hs.split("/")) {
        const m = new RegExp(`^${RANGE}$`).exec(h.trim());
        if (m) out.h.push(rng(m[1], m[2]));
      }
      for (const b of bs.split("/")) {
        const m = new RegExp(`^${RANGE}$`).exec(b.trim());
        if (m) out.b.push(rng(m[1], m[2]));
      }
    }
  }
  return out.b.length || out.h.length ? out : null;
}

// Gaggenau führt „abmessung“ (z. B. „60 x 60 cm“, „177.5 x 56 cm“): bei Kälte-
// und Weinklimageräten Höhe × Breite, sonst Breite × Höhe – so lauten die
// Produktnamen des Herstellers („Kühlgerät 177.5 x 56 cm“, „Backofen 90 x 48 cm“).
const HOEHE_ZUERST = new Set(["kuehlen", "gefrieren", "weinklima"]);

/** Gerätemaße eines Katalogprodukts in cm: { b, h, t, nb, nh, nx } (null = nicht angegeben). */
export function geraetMasse(p) {
  const get = (k) => (p?.masse || []).find((m) => m.key === k)?.wert;
  let b = cmWert(get("breite"));
  let h = cmWert(get("hoehe"));
  const t = cmWert(get("tiefe"));
  const ab = /^\s*(\d+(?:[.,]\d+)?)\s*x\s*(\d+(?:[.,]\d+)?)\s*cm\s*$/i.exec(get("abmessung") || "");
  if (ab) {
    const [x, y] = [num(ab[1]), num(ab[2])];
    const [bb, hh] = HOEHE_ZUERST.has(p.kategorie) ? [y, x] : [x, y];
    if (b == null) b = bb;
    if (h == null) h = hh;
  }
  const nx = get("nische") || null;
  const n = parseNische(nx);
  return { b, h, t, nb: n?.b || [], nh: n?.h || [], nx };
}

// ---- Passt das Gerät in den Steckplatz? ---------------------------------------

const overlap = (r, [lo, hi]) => r[0] <= hi + 1e-6 && r[1] >= lo - 1e-6;
const fmt = (n) => new Intl.NumberFormat("de-AT", { maximumFractionDigits: 1 }).format(n);

/** Nischenhöhe unter der Arbeitsplatte (Sockel + Korpus, cm) – Planannahme. */
export const unterbauHoehe = (plan) => (plan?.ergo?.plinth ?? 15) + (plan?.ergo?.carcass ?? 78);

/**
 * Prüft ein (schlankes) Gerät gegen einen Steckplatz.
 * @returns {{ status: "passt"|"pruefen"|"passtNicht", gruende: string[] }}
 *   passt      alle Regeln mit Katalogmaßen erfüllt
 *   pruefen    Kategorie stimmt, aber ein nötiges Maß steht nicht im Katalog
 *   passtNicht falsche Kategorie oder ein Maß widerspricht der Nische
 */
export function pruefeGeraet(s, g, plan) {
  const gruende = [];
  let unklar = false;
  if (!s || !g) return { status: "passtNicht", gruende: ["Gerät nicht im Katalog"] };
  if (!s.kat.includes(g.k)) return { status: "passtNicht", gruende: [`Gerät gehört nicht in „${s.label}“`] };
  const w = s.w;
  // Breite
  if (s.breite) {
    const dev = s.breite === "integriert" ? [w - 7, w - 3] : s.breite === "kochfeld" ? [w - 20, w + 5] : s.breite === "frei" ? [w - 15, w] : [w - 1.5, w];
    if (g.b != null) {
      if (g.b < dev[0] - 1e-6 || g.b > dev[1] + 1e-6) gruende.push(`Gerätebreite ${fmt(g.b)} cm passt nicht zur Modulbreite ${fmt(w)} cm`);
    } else if (g.nb?.length && s.breite !== "kochfeld" && s.breite !== "frei") {
      if (!g.nb.some((r) => overlap(r, [w - 4.5, w]))) gruende.push(`Nischenbreite laut Katalog passt nicht zur Modulbreite ${fmt(w)} cm`);
    } else unklar = true;
  }
  // Höhe
  if (s.hoehe === "unterbau") {
    const nh = unterbauHoehe(plan);
    if (g.nh?.length) {
      if (!g.nh.some((r) => overlap(r, [nh, nh]))) gruende.push(`Nischenhöhe laut Katalog ${g.nh.map((r) => `${fmt(r[0])}–${fmt(r[1])}`).join(" / ")} cm, geplant ${fmt(nh)} cm (Sockel + Korpus)`);
    } else if (g.h != null) {
      if (g.h > nh + 1e-6) gruende.push(`Gerätehöhe ${fmt(g.h)} cm größer als die Nische ${fmt(nh)} cm (Sockel + Korpus)`);
      else if (s.art === "weinUnten" && g.h < nh - 12) gruende.push(`Gerätehöhe ${fmt(g.h)} cm ist kein Unterbaugerät`);
    } else unklar = true;
  } else if (s.hoehe) {
    const k = KLASSEN[s.hoehe];
    if (g.nh?.length) {
      if (!g.nh.some((r) => overlap(r, k.nis))) gruende.push(`Nischenhöhe laut Katalog passt nicht zur ${k.label}`);
    } else if (g.h != null) {
      if (g.h < k.dev[0] || g.h > k.dev[1]) gruende.push(`Gerätehöhe ${fmt(g.h)} cm passt nicht zur ${k.label}`);
    } else unklar = true;
  }
  if (gruende.length) return { status: "passtNicht", gruende };
  // Ohne Nischenregel (Abzug, Armatur): kein „passt“-Versprechen, nur ein sachlicher Hinweis.
  if (!s.breite && !s.hoehe) return { status: "frei", gruende: [s.art === "abzug" ? "Abzugsart, Breite und Abluft/Umluft stimmen wir im Gespräch ab" : "Anschluss und Unterschrank prüfen wir im Gespräch"] };
  return { status: unklar ? "pruefen" : "passt", gruende: unklar ? ["Einbaumaß steht nicht im Katalog – prüfen wir im Gespräch"] : [] };
}

// ---- Schlanker Index für den Client --------------------------------------------

// Wortlaut wie die Katalogseiten (src/messages/de.json → katalog.preis; Test prüft Gleichheit).
export const PREIS_TEXT_DE = Object.freeze({
  kurz: "UVP ab {preis}",
  herstellerKurz: "Herstellerpreis ab {preis}",
  uvpAb: "UVP ab {preis} inkl. 20 % MwSt. · Stand {datum} · Ihr Preis mit Lieferung, Einbau und Montage auf Anfrage",
  herstellerAb: "Herstellerpreis ab {preis} inkl. 20 % MwSt. · Stand {datum} · Ihr Preis mit Lieferung, Einbau und Montage auf Anfrage",
});
const fill = (tpl, vars) => tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
const euro = (n) => new Intl.NumberFormat("de-AT", { style: "currency", currency: "EUR", minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: Number.isInteger(n) ? 0 : 2 }).format(n);
const datum = (iso) => new Intl.DateTimeFormat("de-AT", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));

/**
 * Preistexte eines Indexeintrags (g.p = { v: Betrag, st: Stand, h: 1 = Herstellerpreis }), sonst null.
 * g.p steht nur dort, wo preisAktiv() beim Bau des Index einen Preis zuließ.
 */
export function preisTexteDe(p) {
  if (!p || !(p.v > 0) || !p.st) return null;
  const vars = { preis: euro(p.v), datum: datum(p.st) };
  return { kurz: fill(p.h ? PREIS_TEXT_DE.herstellerKurz : PREIS_TEXT_DE.kurz, vars), lang: fill(p.h ? PREIS_TEXT_DE.herstellerAb : PREIS_TEXT_DE.uvpAb, vars) };
}

/** Produktseite eines Geräts (alle Planer-Geräte liegen in der Welt kuechengeraete). */
export const geraetHref = (slug, locale = "de") => `/${locale}${produktPath("kuechengeraete", slug)}`;

/**
 * Schlanke Liste für den Planer (Server, Datum = heute; Route /api/labs/kuechenplaner/geraete).
 * @param {object[]} produkte  produkteByWelt("kuechengeraete")
 * @param {{ heute: string, an: boolean, marken?: Record<string,string> }} opts  marken: Slug → Anzeigename
 * @returns {Array<{s,m,mn,n,se,k,b,h,t,nb?,nh?,nx?,p?}>}
 */
export function buildGeraeteIndex(produkte, { heute, an, marken = {} }) {
  return (produkte || [])
    .filter((p) => GERAETE_KATEGORIEN.includes(p.kategorie) && (p.welt || "kuechengeraete") === "kuechengeraete")
    .map((p) => {
      const d = geraetMasse(p);
      const pr = preisAktiv(p, { heute, an });
      const g = { s: p.slug, m: p.marke, mn: marken[p.marke] || p.marke, n: p.name, se: p.serie ? textOf(p.serie, "de") : "", k: p.kategorie, b: d.b, h: d.h, t: d.t };
      if (d.nb.length) g.nb = d.nb;
      if (d.nh.length) g.nh = d.nh;
      if (d.nx) g.nx = d.nx;
      if (pr?.art === "uvp-ab") g.p = { v: pr.uvpAb, st: pr.stand, ...(preisBezeichnung(pr) === "herstellerpreis" ? { h: 1 } : {}) };
      return g;
    });
}

export const indexMap = (index) => new Map((index || []).map((g) => [g.s, g]));

/**
 * Kandidaten für einen Steckplatz: { passt, pruefen, frei } – „passt nicht“ wird nicht angeboten.
 * Sortierung: Marke, dann Name (keine Reihung nach Preis oder „Empfehlung“);
 * `bevorzugt` (Marken-Slug, z. B. aus ?geraet=miele) steht vorne.
 */
export function kandidaten(s, index, plan, bevorzugt = null) {
  const out = { passt: [], pruefen: [], frei: [] };
  for (const g of index || []) {
    if (!s.kat.includes(g.k)) continue;
    const r = pruefeGeraet(s, g, plan);
    if (out[r.status]) out[r.status].push(g);
  }
  const by = (a, b) => (a.m === bevorzugt ? 0 : 1) - (b.m === bevorzugt ? 0 : 1) || a.mn.localeCompare(b.mn, "de") || a.n.localeCompare(b.n, "de");
  for (const k of Object.keys(out)) out[k].sort(by);
  return out;
}

// ---- Auswahl im Plan ----------------------------------------------------------

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Setzt (slug) oder leert ("" / null) den Steckplatz i eines Moduls. */
export function withGeraet(m, i, slug) {
  const n = geraeteSlots(m).length;
  if (i < 0 || i >= n) return m;
  const d = Array.from({ length: n }, (_, k) => (m.d?.[k] && SLUG_RE.test(m.d[k]) ? m.d[k] : ""));
  d[i] = slug && SLUG_RE.test(slug) ? slug : "";
  const next = { ...m };
  if (d.some(Boolean)) next.d = d.slice(0, d.findLastIndex(Boolean) + 1);
  else delete next.d;
  return next;
}

/**
 * Alle gewählten Geräte eines Plans:
 * [{ wall, i, t, slot, slug, g (Indexeintrag|null), status, gruende }]
 */
export function gewaehlteGeraete(plan, index) {
  const map = index instanceof Map ? index : indexMap(index);
  const out = [];
  for (const [wall, run] of Object.entries(plan?.runs || {})) {
    (run || []).forEach((m, i) => {
      if (!m?.d?.length) return;
      geraeteSlots(m).forEach((s, k) => {
        const slug = m.d[k];
        if (!slug) return;
        const g = map.get(slug) || null;
        const r = g ? pruefeGeraet(s, g, plan) : { status: "passtNicht", gruende: ["Gerät nicht mehr im Katalog"] };
        out.push({ wall, i, t: m.t, slot: s, slug, g, ...r });
      });
    });
  }
  return out;
}

/** Klartext einer Auswahl (Zusammenfassung, Übergabe): „Backofen: Miele H 7860 BP“. */
export function geraetText(sel) {
  const name = sel.g ? `${sel.g.mn} ${sel.g.n}` : sel.slug;
  const warn = sel.status === "passtNicht" ? ` (passt nicht: ${sel.gruende[0]})` : sel.status === "pruefen" ? " (Einbaumaß prüfen)" : "";
  return `${sel.slot.label}: ${name}${warn}`;
}

// ---- Einstieg von der Katalogseite (?geraet=<produkt-slug | marken-slug>) ------

/**
 * Prüft ?geraet= gegen den Index (Server). Produkt-Slug → { typ: "produkt", g },
 * Marken-Slug (Kacheln auf /kuechengeraete) → { typ: "marke", m, mn }, sonst null.
 */
export function geraetParam(value, index) {
  const v = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (!v || v.length > 80 || !SLUG_RE.test(v)) return null;
  const g = (index || []).find((x) => x.s === v);
  if (g) return { typ: "produkt", g };
  const m = (index || []).find((x) => x.m === v);
  return m ? { typ: "marke", m: m.m, mn: m.mn } : null;
}

/**
 * Setzt ein Gerät in den ersten freien Steckplatz, in den es laut Katalog passt
 * (sonst: „Einbaumaß prüfen“). Passt es nirgends, bleibt der Plan unverändert.
 * @returns {{ plan, ort: { wall, i, slot } | null, text: string }}
 */
export function geraetVorwahl(plan, g) {
  if (!g?.s || !SLUG_RE.test(g.s)) return { plan, ort: null, text: "" };
  const name = `${g.mn} ${g.n}`;
  for (const ziel of ["passt", "pruefen", "frei"]) {
    for (const [wall, run] of Object.entries(plan?.runs || {})) {
      for (let i = 0; i < (run || []).length; i++) {
        const m = run[i];
        const slots = geraeteSlots(m);
        for (let k = 0; k < slots.length; k++) {
          if (m.d?.[k]) continue;
          if (pruefeGeraet(slots[k], g, plan).status !== ziel) continue;
          const next = { ...plan, runs: { ...plan.runs, [wall]: run.map((x, j) => (j === i ? withGeraet(x, k, g.s) : x)) } };
          return { plan: next, ort: { wall, i, slot: slots[k] }, text: `${name} ist als ${slots[k].label} eingeplant${ziel === "pruefen" ? " – das Einbaumaß prüfen wir im Gespräch" : ""}.` };
        }
      }
    }
  }
  return { plan, ort: null, text: `${name} passt in keine Nische dieser Planung. Ändern Sie das Gerätemodul oder sprechen Sie uns an.` };
}
