// Sofaplaner – normalises the Minotti research files (src/lib/sofaplaner/minotti/*.json)
// into ONE planner format. Pure functions, no I/O: used by the server catalogue
// (catalog.server.js) and by the unit tests.
//
// The research files were written by different teams and differ in field
// names (ausrichtung / seitenvarianten / seiten / ausfuehrung_seite …) and in the
// shape of the option lists. Nothing here invents a value: a missing measure
// stays `null` and is listed in `missing`; everything that is derived (role,
// side, open sides) is marked as derived in the UI and the docs.

// --- small helpers ---------------------------------------------------------
const isNum = (v) => typeof v === "number" && Number.isFinite(v);
const num = (v) => (isNum(v) && v > 0 ? v : null);
const str = (v) => (typeof v === "string" && v.trim() ? v.trim() : null);
const arr = (v) => (Array.isArray(v) ? v : v == null ? [] : [v]);
const isUrl = (v) => typeof v === "string" && /^https?:\/\//.test(v.trim());

export function slugify(s) {
  return String(s)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

const KEY_LABEL = {
  hoehe_cm: "Höhe",
  gesamthoehe_cm: "Gesamthöhe",
  strukturhoehe_cm: "Strukturhöhe",
  breite_cm: "Breite",
  breiten_cm: "Breiten",
  tiefe_cm: "Tiefe",
  laenge_cm: "Länge",
  querschnitt_cm: "Querschnitt",
  masse_cm: "Maße",
  masse: "Maße",
  fusshoehe_cm: "Fußhöhe",
  fuss_hoehe_cm: "Fußhöhe",
  sockelhoehe_cm: "Sockelhöhe",
  basis_hoehe_cm: "Basishöhe",
  hoehen_cm: "Höhen",
  hoehe_optionen_cm: "Höhen",
  material: "Material",
  materialien: "Material",
  finish: "Oberfläche",
  finishes: "Oberflächen",
  rahmen_finish: "Rahmen",
  gestell_finish: "Gestell",
  finish_art: "Oberfläche",
  gleiter: "Gleiter",
  fuellung: "Füllung",
  polsterung: "Polsterung",
  elemente: "Für",
  farben: "Farben",
  details: "Details",
  detail: "Details",
  hinweis: "Hinweis",
  funktion: "Funktion",
  optionen: "Optionen",
  rollen: "Rollen",
  sockelverkleidung: "Sockelverkleidung",
  art: "Art",
};

const humanKey = (k) => KEY_LABEL[k] || k.replace(/_cm$/, "").replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

function fmtValue(k, v) {
  if (v == null || v === "") return null;
  if (isUrl(v)) return null; // sources are collected separately
  if (Array.isArray(v)) {
    const parts = v.map((x) => fmtValue(k, x)).filter(Boolean);
    return parts.length ? parts.join(", ") : null;
  }
  if (typeof v === "object") {
    const parts = Object.entries(v)
      .map(([kk, vv]) => {
        const f = fmtValue(kk, vv);
        return f ? `${humanKey(kk)}: ${f}` : null;
      })
      .filter(Boolean);
    return parts.length ? parts.join("; ") : null;
  }
  if (typeof v === "boolean") return v ? "ja" : "nein";
  if (isNum(v) && /_cm$/.test(k)) return `${String(v).replace(".", ",")} cm`;
  return String(v);
}

function urlsIn(v, out = []) {
  if (isUrl(v)) out.push(v.trim().split(/\s/)[0]);
  else if (Array.isArray(v)) v.forEach((x) => urlsIn(x, out));
  else if (v && typeof v === "object") Object.values(v).forEach((x) => urlsIn(x, out));
  else if (typeof v === "string") {
    const m = v.match(/https?:\/\/\S+/g);
    if (m) out.push(...m.map((u) => u.replace(/[),;]+$/, "")));
  }
  return out;
}

const LABEL_KEYS = ["name_de", "name", "teil", "beschreibung", "art", "material", "code"];

// Option names that the research files kept in English (QM Sofaplaner R1 P2-2).
// Order matters: the longest phrases first. The manufacturer term stays in
// `labelEn` and is shown only in expert mode.
const OPTION_GLOSSARY = [
  [/\bplus optional backrest cushion\b/gi, "Plus: optionales Rückenkissen"],
  [/\boptional (?:backrest|back) cushion with band\b/gi, "Optionales Rückenkissen mit Band"],
  [/\boptional (?:backrest|back) cushion\b/gi, "Optionales Rückenkissen"],
  [/\boptional bench[- ]cushion\b/gi, "Optionales Bankkissen"],
  [/\boptional cushion for armchair\b/gi, "Optionales Kissen für Sessel"],
  [/\boptional cushion with band\b/gi, "Optionales Kissen mit Band"],
  [/\boptional angular removable cushion\b/gi, "Optionales abnehmbares Winkelkissen"],
  [/\boptional lumbar cushion\b/gi, "Optionales Lendenkissen"],
  [/\boptional rain cover\b/gi, "Optionale Regenschutzhülle"],
  [/\boptional headrest\b/gi, "Optionale Kopfstütze"],
  [/\boptional roll\b/gi, "Optionale Nackenrolle"],
  [/\boptional tray\b/gi, "Optionales Tablett"],
  [/\boptional ([„“"][^„“"”]+[“”"]) cushion\b/gi, "Optionales Kissen $1"],
  [/^([„“"]?[A-Z][\w-]*[“”"]?) optional cushion\b/g, "Optionales Kissen $1"],
  [/\bdecor optional cushion\b/gi, "Optionales Kissen „Decor“"],
  [/\boptional cushion\b/gi, "Optionales Kissen"],
  [/\bheadrest\/lumbar cushion\b/gi, "Kopfstütze/Lendenkissen"],
  [/\bback cushion\b/gi, "Rückenkissen"],
  [/\blumbar cushion\b/gi, "Lendenkissen"],
  [/^cushion\b/gi, "Kissen"],
  [/^optional$/gi, "Optionales Zubehör"],
];
const GERMAN_ALREADY = /kissen|rücken|ruecken|kopfstütze|regenschutz|lehne|sockel|füße|fuesse/i;

/** German customer label for an option name (manufacturer term kept separately). */
export function germanOptionLabel(name) {
  let t = String(name || "").trim();
  if (!t || GERMAN_ALREADY.test(t.replace(/\([^)]*\)/g, ""))) return t;
  if (!/\b(optional|cushion|headrest|tray|rain cover|roll|backrest)\b/i.test(t)) return t;
  if (t === t.toUpperCase()) t = t.toLowerCase().replace(/^./, (c) => c.toUpperCase());
  for (const [re, de] of OPTION_GLOSSARY) t = t.replace(re, de);
  t = t
    .replace(/\bcm\s*(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)/gi, "$1 × $2 cm")
    .replace(/(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*cm/gi, "$1 × $2 cm");
  return normalizeQuotes(t.replace(/\s{2,}/g, " ").replace(/^./, (c) => c.toUpperCase()));
}

/** P3-2: all quotation marks in names as German „…“. */
export function normalizeQuotes(s) {
  return String(s).replace(/["„“”]([^"„“”]+)["„“”]/g, "„$1“");
}

const MASS_KEYS = ["masse", "masse_cm", "mass"];

/** Any option list (string, array of strings/objects or a key→value map) → [{id,label,detail}]. */
export function toOptions(v) {
  const out = [];
  const push = (label, detail, src, mass = null) => {
    if (!label) return;
    const id = `${slugify(label) || "opt"}-${out.length + 1}`;
    let de = germanOptionLabel(label);
    if (mass && !/\d/.test(de)) de = `${de} ${String(mass).replace(/(\d)\s*[x×]\s*(\d)/g, "$1 × $2")}`;
    out.push({ id, label: de, labelEn: de !== String(label) ? String(label) : null, detail: detail || null, sources: [...new Set(urlsIn(src))] });
  };
  if (v == null) return out;
  if (typeof v === "string") {
    push(v, null, null);
    return out;
  }
  if (Array.isArray(v)) {
    for (const item of v) {
      if (item == null) continue;
      if (typeof item !== "object") {
        push(String(item), null, null);
        continue;
      }
      const key = LABEL_KEYS.find((k) => str(item[k]));
      const massKey = key && !/\d/.test(item[key]) ? MASS_KEYS.find((k) => typeof item[k] === "string" && /\d/.test(item[k])) : undefined;
      const rest = Object.entries(item).filter(([k]) => k !== key && k !== massKey && k !== "name" && k !== "name_de" && !/quelle|bild/.test(k));
      const detail = rest
        .map(([k, val]) => {
          const f = fmtValue(k, val);
          return f ? `${humanKey(k)}: ${f}` : null;
        })
        .filter(Boolean)
        .join(" · ");
      push(key ? item[key] : fmtValue("", item), detail, item, massKey ? item[massKey] : null);
    }
    return out;
  }
  if (typeof v === "object") {
    for (const [k, val] of Object.entries(v)) {
      if (/quelle/.test(k)) continue;
      const f = fmtValue(k, val);
      if (f) push(humanKey(k), f, val);
    }
  }
  return out;
}

const toStrings = (v) =>
  arr(v)
    .map((x) => (typeof x === "string" ? x : x && typeof x === "object" ? fmtValue("", x) : null))
    .filter(Boolean);

// --- element classification -----------------------------------------------
// role: how an element joins others in the planner
//   free   – freestanding piece, closed on both sides (sofa, armchair, daybed)
//   end    – one closed side (armrest / termination), one joining side
//   mid    – joins on both sides
//   corner – 90° corner, joins on two sides
//   loose  – placed freely, no joining logic (ottoman, bench, island, table)
//   acc    – accessory, not placed in the floor plan (cushion, headrest …)
// kind: the group shown to customers.
export const KINDS = {
  ecke: { label: "Ecken", one: "Ecke" },
  ende: { label: "Endelemente (Anbau links/rechts)", one: "Endelement" },
  mitte: { label: "Mittelelemente", one: "Mittelelement" },
  chaise: { label: "Chaiselongues", one: "Chaiselongue" },
  peninsula: { label: "Peninsula / offenes Ende", one: "Peninsula" },
  daybed: { label: "Daybeds & Liegen", one: "Daybed" },
  sofa: { label: "Sofas (feste Größe)", one: "Sofa" },
  sessel: { label: "Sessel & Stühle", one: "Sessel" },
  hocker: { label: "Hocker & Bänke", one: "Hocker" },
  insel: { label: "Inseln", one: "Insel" },
  tisch: { label: "Tische & Ablagen", one: "Tisch" },
  zubehoer: { label: "Kissen & Zubehör", one: "Zubehör" },
};
export const KIND_ORDER = ["ecke", "ende", "mitte", "chaise", "peninsula", "daybed", "sofa", "sessel", "hocker", "insel", "tisch", "zubehoer"];

export function classify(art, name = "") {
  const a = String(art || "").toLowerCase();
  const n = String(name || "").toLowerCase();
  if (/kissen|kopfst|zubehoer|^armlehne$|^r(ü|ue)cken$|rueckenteil/.test(a)) return { role: "acc", kind: "zubehoer" };
  if (a === "verbindungstisch") return { role: "mid", kind: "tisch" };
  if (/tisch/.test(a) && !/^bank/.test(a)) return { role: "loose", kind: "tisch" };
  if (/^hocker|barhocker|^bank/.test(a)) return { role: "loose", kind: "hocker" };
  if (/insel/.test(a)) return { role: "loose", kind: "insel" };
  if (/^ecke/.test(a)) return { role: "corner", kind: "ecke" };
  if (/^mittel|^element$|sessel-mittel|sessel-modul/.test(a)) return { role: "mid", kind: "mitte" };
  if (/back-to-back/.test(a)) return { role: "mid", kind: "mitte", b2b: true };
  if (/peninsula/.test(a)) return { role: "end", kind: "peninsula" };
  if (/^chaise/.test(a)) return { role: "end", kind: "chaise" };
  if (/daybed-element|endelement-daybed/.test(a)) return { role: "end", kind: "daybed" };
  if (/^endelement|^anbau|sessel-endelement/.test(a)) return { role: "end", kind: "ende" };
  if (/sessel|stuhl|armlehnstuhl/.test(a) || /armchair|chair|bergère|bergere/.test(n)) return { role: "free", kind: "sessel" };
  if (/daybed|liege|dormeuse|couch/.test(a)) return { role: "free", kind: "daybed" };
  return { role: "free", kind: "sofa" };
}

export function shapeOf(e, art) {
  const t = `${art || ""} ${e.name || ""} ${e.name_de || ""} ${e.geometrie || ""}`.toLowerCase();
  if (/gebogen|curved|bend|wave|rainbow|halbrund|semi-round|semi round|round|rund|circle|drop/.test(t)) return "curved";
  if (/geneigt|schr(ä|ae)g|inclined|angled|trapez/.test(t)) return "angled";
  return "rect";
}

function sideToken(v) {
  const s = String(v || "").toUpperCase();
  if (/^SX|SINISTR|LINKS|\bLEFT\b/.test(s)) return "SX";
  if (/^DX|DESTR|RECHTS|\bRIGHT\b/.test(s)) return "DX";
  return null;
}

/** Sides an element exists in. `derived` = not stated per element in the source. */
export function sidesOf(e, cls) {
  const fields = [e.ausrichtung, e.seitenvarianten, e.seiten, e.ausfuehrung_seite];
  if (Array.isArray(e.ausfuehrungen)) fields.push(e.ausfuehrungen.map((x) => x && x.code));
  for (const f of fields) {
    if (f == null) continue;
    if (Array.isArray(f)) {
      const set = [...new Set(f.map(sideToken).filter(Boolean))];
      if (set.length) return { sides: set, derived: false };
      continue;
    }
    if (typeof f === "string") {
      if (/SX\s*\/\s*DX|sx\s*\/\s*dx/i.test(f)) return { sides: ["SX", "DX"], derived: false };
      const t = sideToken(f);
      if (t) return { sides: [t], derived: false };
    }
  }
  const a = String(e.art || "").toLowerCase();
  if (/-links$/.test(a)) return { sides: ["SX"], derived: false };
  if (/-rechts$/.test(a)) return { sides: ["DX"], derived: false };
  const m = String(e.code || "").match(/[-_ ](SX|DX)$/i) || String(e.name || "").match(/\b(SX|DX)\b/);
  if (m) return { sides: [m[1].toUpperCase()], derived: false };
  // one-sided pieces without a stated side exist in both versions in every
  // Minotti system – offered as SX and DX, marked "Seite abgeleitet".
  if (cls.role === "end") return { sides: ["SX", "DX"], derived: true };
  return { sides: [null], derived: false };
}

const stripSide = (s) =>
  String(s || "")
    .replace(/[-_ ]?\(?(SX|DX)\)?$/i, "")
    .replace(/\s*\b(SX|DX)\b\s*/g, " ")
    .replace(/,?\s*(Armlehne\s+)?(links|rechts)\s*$/i, "")
    .replace(/\s+(left|right)\s*$/i, "")
    .trim();

function sitztiefe(v) {
  if (isNum(v)) return { value: v, text: null };
  if (typeof v === "string" && v.trim()) return { value: null, text: v.trim() };
  return { value: null, text: null };
}

const MEASURES = [
  ["w", "Breite"],
  ["d", "Tiefe"],
  ["h", "Höhe"],
  ["sh", "Sitzhöhe"],
  ["sd", "Sitztiefe"],
];
export const MEASURE_LABEL = Object.fromEntries(MEASURES);

// Customer-facing German label for elements that only have the English
// manufacturer name (the original stays in labelEn for the order details).
const GLOSSARY = [
  [/\bcorner (sofa|element|seat)\b/gi, "Eckelement"],
  [/\b(element|module) with (one|1) armrest\b/gi, "Endelement mit Armlehne"],
  [/\b(element|module) with (two|2) armrests\b/gi, "Element mit zwei Armlehnen"],
  [/\b(open[- ]end|peninsula|penisola) (element|module)\b/gi, "Peninsula-Element"],
  [/\b(central|centre|center) (element|module)\b/gi, "Mittelelement"],
  [/\bchaise[- ]longue\b/gi, "Chaiselongue"],
  [/\bdouble couch\b/gi, "Doppel-Couch"],
  [/\b(footstool|pouf|ottoman)\b/gi, "Hocker"],
  [/\barmchair\b/gi, "Sessel"],
  [/\bbench\b/gi, "Bank"],
  [/\bisland\b/gi, "Insel"],
  [/\bseat cushion\b/gi, "Sitzkissen"],
  [/\bbackrest cushion\b/gi, "Rückenkissen"],
  [/\bsingle backrest\b/gi, "einfacher Rücken"],
  [/\bbackrest\b/gi, "Rücken"],
  [/\barmrests?\b/gi, "Armlehne"],
  [/\bseating module\b/gi, "Sitzmodul"],
  [/\basymmetrical\b/gi, "asymmetrisch"],
  [/\bwithout\b/gi, "ohne"],
  [/\bwith\b/gi, "mit"],
  [/\bleft\b/gi, "links"],
  [/\bright\b/gi, "rechts"],
  [/\bsmall\b/gi, "klein"],
  [/\blarge\b/gi, "groß"],
  [/\bcurved\b/gi, "gebogen"],
  [/\bround\b/gi, "rund"],
  [/\belement\b/gi, "Element"],
  [/\bsofa\b/gi, "Sofa"],
  [/\bcouch\b/gi, "Couch"],
  [/\bdaybed\b/gi, "Daybed"],
];
export function germanLabel(name) {
  let t = String(name || "").trim();
  if (!t) return t;
  // ALL CAPS → capitalised words (short codes like "TOP B", "SX" stay upper case)
  if (t === t.toUpperCase()) {
    t = t
      .toLowerCase()
      .replace(/(^|[\s(\-–/])([a-zà-ÿ])/g, (m, a, b) => a + b.toUpperCase())
      .replace(/\b(Sx|Dx|Top [a-h])\b/g, (m) => m.toUpperCase());
  }
  for (const [re, de] of GLOSSARY) t = t.replace(re, de);
  // "cm 206" / "cm 140x158" → "206 cm" / "140 × 158 cm"
  t = t
    .replace(/\bcm\s*(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)/gi, "$1 × $2 cm")
    .replace(/\bcm\s*(\d+(?:[.,]\d+)?)/gi, "$1 cm")
    .replace(/(\d)\s*CM\b/g, "$1 cm");
  return t.replace(/\s{2,}/g, " ").replace(/^./, (c) => c.toUpperCase());
}

/** One research element → 1..2 planner elements (SX/DX expanded). */
export function normalizeElement(e, familySources = []) {
  const cls = classify(e.art, e.name);
  const shape = shapeOf(e, e.art);
  const { sides, derived } = sidesOf(e, cls);
  const dia = num(e.durchmesser_cm);
  const w = num(e.breite_cm) ?? dia;
  const d = num(e.tiefe_cm) ?? dia;
  const sd = sitztiefe(e.sitztiefe_cm);
  const ah = num(e.armlehnenhoehe_cm) ?? num(e.ruecken_armlehnenhoehe_cm);
  const label = str(e.name_de) || germanLabel(str(e.name) || String(e.code));
  const notes = [e.hinweis, ...arr(e.hinweise), e.mass_hinweis, e.sitztiefe_quelle && `Sitztiefe: ${e.sitztiefe_quelle}`, e.hoehe_quelle && `Höhe: ${e.hoehe_quelle}`]
    .map((x) => (typeof x === "string" ? x.trim() : null))
    .filter((x) => x && !isUrl(x));
  const sources = [...new Set([...urlsIn(e.quelle), ...urlsIn(e.mass_quelle), ...urlsIn(e.quelle_produktseite), ...urlsIn(e.quelle_seite)])];
  const official = str(e.code_offiziell) || (e.minotti_element_nr != null ? String(e.minotti_element_nr) : null);
  const base = {
    group: `${slugify(e.art || "x")}|${slugify(stripSide(e.code))}`,
    srcCode: String(e.code),
    official,
    label: stripSide(label) || label,
    labelEn: str(e.name_hersteller) || str(e.name),
    art: String(e.art || ""),
    role: cls.role,
    kind: cls.kind,
    b2b: Boolean(cls.b2b),
    shape,
    line: str(e.linie) || null,
    module: num(e.sitzmodul_cm),
    w,
    d,
    h: num(e.hoehe_cm),
    sh: num(e.sitzhoehe_cm),
    sd: sd.value,
    sdText: sd.text,
    ah,
    joins: typeof e.anschluesse === "string" ? e.anschluesse : null,
    notes,
    sources: sources.length ? sources : familySources.slice(0, 2),
    sideDerived: derived,
  };
  const missing = MEASURES.filter(([k]) => {
    if (k === "sd" && (cls.role === "loose" || cls.role === "acc" || base.sdText)) return false;
    if ((k === "sh" || k === "sd") && cls.role === "acc") return false;
    return base[k] == null;
  }).map(([k]) => k);
  return sides.map((side) => {
    const code = sides.length > 1 ? `${String(e.code)}-${side}` : String(e.code);
    return { ...base, code, side, missing };
  });
}

function familySourceList(q) {
  return arr(q)
    .map((x) => (typeof x === "string" ? x : x && x.url))
    .filter(isUrl)
    .map((u) => u.trim());
}

function compositions(j) {
  const raw = j.beispiel_kompositionen || j.beispielkompositionen || j.kompositionen_beispiele || [];
  return arr(raw)
    .filter((c) => c && typeof c === "object")
    .map((c) => {
      const w = c.gesamtbreite_cm ?? c.breite_cm;
      const dd = c.gesamttiefe_cm ?? c.tiefe_cm;
      const dims =
        fmtValue("x", c.aussenmasse_cm ?? c.gesamtmasse_cm ?? c.gesamtmasse_laut_plan_cm) ||
        (w ? `${w}${dd ? ` × ${dd}` : ""} cm` : null);
      const elements = toStrings(c.elemente || c.elemente_original);
      return { name: String(c.name || "Komposition"), dims, elements, source: c.pdf || c.quelle || null };
    });
}

function linesOf(j) {
  const l = j.linien;
  if (!l) return [];
  if (Array.isArray(l))
    return l.map((x) =>
      typeof x === "string" ? { label: x, detail: null } : { label: String(x.name || x.id), detail: fmtValue("", { ...x, name: undefined, id: undefined }) }
    );
  return Object.entries(l).map(([k, v]) => ({ label: k, detail: fmtValue("", v) }));
}

// Named Minotti cover collections (QM Sofaplaner R1 P2-7). Only names that the
// research file of THIS family quotes from its Minotti product page or data
// sheet are listed (source = that file's URL); no colours, no images.
const COVER_NAMES = [
  // categories as Minotti states them (e.g. minotti.com/en/tape: "Aspen leather
  // or Nabuk Lodge leather – Natural leather category")
  [/\bAspen\b/, "Aspen", "Leder", "Kategorie Nature"],
  [/\bNabuk(?: Lodge)?\b/, "Nabuk", "Leder", "Kategorie Nature"],
  [/\bPelle Nature\b|\bNature Leather\b|\bLeder (?:Kat\.\s*)?Natur(?:e|al)\b|\bKategorie Nature\b/, "Pelle Nature", "Leder", "Kategorie Nature"],
  [/\bPelle Extra\b|\bLeder (?:Kat\.\s*)?Extra\b/, "Pelle Extra", "Leder", "Kategorie Extra"],
  [/\bSaddle[- ]Hide\b|\bSattelleder\b/, "Saddle-Hide", "Leder", "Sattelleder"],
  [/\bCoccodrillo\b/, "Coccodrillo", "Leder", "Leder mit Prägung"],
  [/\bPony (?:Look|Cenere)\b/, "Pony Look", "Fell-Optik", "Hocker-Bezug"],
  [/\bZebra Look\b/, "Zebra Look", "Fell-Optik", "Hocker-Bezug"],
  [/\bArt Lifescape\b/, "Art Lifescape", "Outdoor-Stoff", "wasserabweisend"],
];
function coverCollections(b, familySources) {
  if (!b || typeof b !== "object") return [];
  const text = JSON.stringify(b);
  const src = urlsIn(b.quelle)[0] || familySources[0] || null;
  return COVER_NAMES.filter(([re]) => re.test(text)).map(([, name, material, category]) => ({ name, material, category, source: src }));
}

function coverOf(b) {
  if (!b || typeof b !== "object") return { categories: [], types: [], variants: [], notes: [] };
  const categories = toStrings(b.kategorien || b.materialien);
  const types = toStrings(b.bezugsarten || b.bezugsart);
  const variants = toStrings(b.varianten || b.kombinationen || b.ausfuehrungen);
  const skip = new Set(["kategorien", "materialien", "bezugsarten", "bezugsart", "varianten", "kombinationen", "ausfuehrungen", "preisgruppen", "preis_kategorien", "preiskategorien", "quelle"]);
  const notes = Object.entries(b)
    .filter(([k, v]) => !skip.has(k) && v != null)
    .map(([k, v]) => {
      const f = fmtValue(k, v);
      return f ? `${humanKey(k)}: ${f}` : null;
    })
    .filter(Boolean);
  return { categories, types, variants, notes };
}

/** Percentage of filled measures (w, d, h, sh, sd) over all placeable elements. */
export function completeness(elements) {
  let total = 0,
    filled = 0;
  for (const e of elements) {
    if (e.role === "acc") continue;
    for (const [k] of MEASURES) {
      if (k === "sd" && (e.role === "loose" || e.sdText)) continue;
      total += 1;
      if (e[k] != null) filled += 1;
    }
  }
  return total ? Math.round((filled / total) * 100) : 0;
}

/** Whole research file → planner family. */
export function normalizeFamily(j) {
  const sources = familySourceList(j.quellen);
  const elements = [];
  const seen = new Map();
  for (let raw of arr(j.elemente)) {
    if (!raw || typeof raw !== "object" || (raw.code == null && raw.id == null)) continue;
    if (raw.code == null) raw = { ...raw, code: raw.id };
    for (const el of normalizeElement(raw, sources)) {
      // codes are unique per file in the research data; guard anyway
      let code = el.code;
      const n = seen.get(code) || 0;
      seen.set(code, n + 1);
      if (n) code = `${code}~${n + 1}`;
      elements.push({ ...el, code });
    }
  }
  const roles = new Set(elements.map((e) => e.role));
  const modular = roles.has("end") || roles.has("mid") || roles.has("corner");
  const outdoor = j.outdoor === true || /outdoor/.test(String(j.slug || ""));
  const text = elements.map((e) => `${e.art} ${e.label} ${e.labelEn || ""}`).join(" ").toLowerCase();
  const sofabed = /schlafsofa|sofa bed|sofabett|schlaffunktion(?! keine)/.test(text) && !/keine schlaffunktion/.test(text);
  const typ = str(j.typ) || "";
  const character = typ.split(/(?<=[a-zà-ÿ)])[;:–] /)[0].slice(0, 160);
  return {
    slug: String(j.slug || slugify(j.name)),
    name: normalizeQuotes(String(j.name)),
    designer: str(j.designer),
    year: isNum(j.jahr) ? j.jahr : null,
    character: character.replace(/^./, (c) => c.toUpperCase()),
    typ,
    outdoor,
    modular,
    sofabed,
    sources,
    retrieved: str(j.abrufdatum),
    measureNote: str(j.masse_hinweis) || str(j.mass_hinweis) || str(j.hinweis_masse),
    rights: str(j.rechte) || str(j.rechte_hinweis) || str(j.hinweis_rechte),
    missingInfo: toStrings(j.fehlend),
    rules: [...toStrings(j.kombinationsregeln), ...toStrings(j.kompositionsregeln), ...toStrings(j.kombinierbarkeit)],
    lines: linesOf(j),
    compositions: compositions(j),
    options: {
      back: toOptions(j.rueckenoptionen),
      arm: toOptions(j.armlehnenoptionen),
      base: toOptions(j.fuesse_sockel),
      cover: { ...coverOf(j.bezuege), collections: coverCollections(j.bezuege, sources) },
      cushions: toOptions(j.kissenoptionen),
      padding: toOptions(j.polsterung),
    },
    elements,
    completeness: completeness(elements),
  };
}

/** Short summary for the model picker (small enough for the initial HTML). */
export function familySummary(f) {
  const placeable = f.elements.filter((e) => e.role !== "acc");
  return {
    slug: f.slug,
    name: f.name,
    designer: f.designer,
    year: f.year,
    character: f.character,
    outdoor: f.outdoor,
    modular: f.modular,
    sofabed: f.sofabed,
    count: placeable.length,
    completeness: f.completeness,
    kinds: [...new Set(placeable.map((e) => e.kind))],
    ...typicalDims(placeable),
    line: lineOf(f.name),
  };
}

const median = (list) => {
  const v = list.filter((x) => x != null).sort((a, b) => a - b);
  return v.length ? v[Math.floor((v.length - 1) / 2)] : null;
};
/** Typical seat depth, height and width range of a family (manufacturer values only, null if not published). */
export function typicalDims(placeable) {
  const seats = placeable.filter((e) => ["end", "mid", "corner", "free"].includes(e.role) && e.kind !== "sessel");
  const base = seats.length ? seats : placeable;
  const ws = base.map((e) => e.w).filter((x) => x != null);
  return {
    depth: median(base.map((e) => e.d)),
    height: median(base.map((e) => e.h)),
    wMin: ws.length ? Math.min(...ws) : null,
    wMax: ws.length ? Math.max(...ws) : null,
  };
}
/** Product line for grouping variants in the model picker ("Andersen Slim 90" → "Andersen"). */
export function lineOf(name) {
  return String(name).replace(/[„“"”]/g, "").trim().split(/\s+/)[0];
}
