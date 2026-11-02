// src/lib/forms/beratungContext.js
// Context of a Beratungsanfrage from the URL (Fix-Runde 1, F3 Nr. 1/2;
// r1-ux-conversion P1-2/P1-3). The planners and pages link to
//   /<locale>/beratung?thema=kueche|sofa|ezarri|mosaik|outdoor|yacht|boot|hotel|objekt|architekt|neubau|renovierung|bad|wellness
//                     ?planer=kuechenplaner|sofaplaner|ezarri|3d|stil-finder|yacht|bodensee-licht|dreilaender
//                     ?land=CH|FL|DE|AT&wert=<bucket>      (Dreiländer-Rechner, r8-leads; no personal data)
//                     ?stil=<Stil-Finder profile slug>   (lib/stilfinder/build.js terminUrl)
//                     ?produkt=<free text>                (product pages, 3D, Sofaplaner)
//                     ?rolle=architekt|planer             (Fachweg Architektur/Planung, r7-p1)
//                     ?ort=<city slug>                    (Stadtseiten: Herkunftszeile, r7-p1)
// and the wizard starts with the matching topic (step 1), place (step 2) and
// the first lines of the message. Pure logic, no "@/..." imports
// (tests/unit/f3-beratung-context.test.mjs).
//
// The option ARRAYS live in src/messages/*.json (MultiStepForm.step1Options /
// step2Options, translated labels, sent as free text). The keys below name the
// same positions; the unit test keeps both in step in all four languages.

// r8-leads (ux P1-2, gesamtwerk P1): Yacht-Interieur, Objekt / Hotel and
// Architektur / Planungsbüro are topics of their own, so ?thema=yacht|objekt|
// hotel|architekt preselects step 1 (before only step 2 was set and the
// confirmation showed "Thema: einen Neubau"). The new keys sit before
// "anderes": positions 0/1 and "Anderes" last stay (tests, backoffice).
export const STEP1_KEYS = Object.freeze(["neubau", "renovierung", "kueche", "sofa", "ezarri", "outdoor", "yacht", "objekt", "architektur", "anderes"]);
export const STEP2_KEYS = Object.freeze(["haus", "wohnung", "gewerbe", "hotel", "yacht"]);

// thema / planer value → { step1?, step2?, line? }. `line` = key in
// MultiStepForm.context (first line of the message, page language).
const TOPICS = {
  // r7-p1 (ux P1-1/P2-6): ezarri, objekt/hotel, neubau and yacht also start
  // the message with one context line, so the textarea is never empty.
  neubau: { step1: "neubau", thema: "themaNeubau" },
  renovierung: { step1: "renovierung" },
  kueche: { step1: "kueche" },
  kuechen: { step1: "kueche" },
  kuechenplaner: { step1: "kueche", line: "kuechenplaner" },
  sofa: { step1: "sofa" },
  sofaplaner: { step1: "sofa", line: "sofaplaner" },
  ezarri: { step1: "ezarri", thema: "themaEzarri" },
  mosaik: { step1: "ezarri", thema: "themaEzarri" },
  glasmosaik: { step1: "ezarri", thema: "themaEzarri" },
  "ezarri-konfigurator": { step1: "ezarri", line: "ezarri" },
  konfigurator: { step1: "ezarri", line: "ezarri" },
  outdoor: { step1: "outdoor" },
  garten: { step1: "outdoor" },
  terrasse: { step1: "outdoor" },
  yacht: { step1: "yacht", step2: "yacht", thema: "themaYacht" },
  boot: { step1: "yacht", step2: "yacht", thema: "themaYacht" },
  "yacht-interior": { step1: "yacht", step2: "yacht", line: "yacht" },
  hotel: { step1: "objekt", step2: "hotel", thema: "themaObjekt" },
  objekt: { step1: "objekt", step2: "hotel", thema: "themaObjekt" },
  gastronomie: { step1: "objekt", step2: "hotel", thema: "themaObjekt" },
  // Welle 2 (Hotel & Objekt, Inhaber 29.10.2026): chalets and holiday flats
  // (owned or let) – topic "objekt", own message line.
  chalet: { step1: "objekt", step2: "hotel", thema: "themaChalet" },
  ferienwohnung: { step1: "objekt", step2: "hotel", thema: "themaChalet" },
  architekt: { step1: "architektur", thema: "rolleArchitekt" },
  architektin: { step1: "architektur", thema: "rolleArchitekt" },
  architektur: { step1: "architektur", thema: "rolleArchitekt" },
  planungsbuero: { step1: "architektur", thema: "rolleArchitekt" },
  // Runde 5 (ux P2-6): Interior Design is no Neubau – known value, but no
  // preselection (renovation is the more common case) and no message line.
  interior: {},
  "interior-design": {},
  "bodensee-licht": { line: "bodenseeLicht" },
  dreilaender: { line: "dreilaender" },
  "3d": { line: "3d" },
  "3d-ansicht": { line: "3d" },
  ar: { line: "3d" },
  "stil-finder": { line: "stilfinder" },
  stilfinder: { line: "stilfinder" },
  // Bad & Wellness (Inhaber-Entscheidungen Nr. 19–21, /bad-wellness): own
  // message line each. A bathroom starts as "Renovierung"; wellness has no
  // topic of its own in step 1, so "Anderes" is only the FALLBACK – a second
  // topic decides ("wellness,outdoor" → Outdoor, "wellness,hotel" → Objekt).
  bad: { step1: "renovierung", thema: "themaBad" },
  badezimmer: { step1: "renovierung", thema: "themaBad" },
  wellness: { fallback: "anderes", thema: "themaWellness" },
  spa: { fallback: "anderes", thema: "themaWellness" },
};

// Planner names as a message line: ?planer= says WHERE the visitor came from.
const PLANER_LINES = {
  kueche: "kuechenplaner",
  kuechen: "kuechenplaner",
  kuechenplaner: "kuechenplaner",
  sofa: "sofaplaner",
  sofaplaner: "sofaplaner",
  ezarri: "ezarri",
  konfigurator: "ezarri",
  "ezarri-konfigurator": "ezarri",
  "3d": "3d",
  "3d-ansicht": "3d",
  ar: "3d",
  "stil-finder": "stilfinder",
  stilfinder: "stilfinder",
  yacht: "yacht",
  "yacht-interior": "yacht",
  "bodensee-licht": "bodenseeLicht",
  dreilaender: "dreilaender",
};

// Topic → place it implies (step 2). Used to preset step 2 when the visitor
// picks the topic and to keep the confirmation free of doubled or clashing
// statements ("ein Yacht-Interieur auf einem Boot oder einer Yacht").
export const TOPIC_PLACE = Object.freeze({ yacht: "yacht", objekt: "hotel" });

// Dreiländer-Rechner (?land=, ?wert=): country code and a value BAND, never
// the exact amount or anything personal. Unknown values are ignored.
export const LANDS = Object.freeze(["CH", "FL", "DE", "AT"]);
export const VALUE_BANDS = Object.freeze(["bis-5000", "5000-15000", "15000-50000", "ab-50000"]);

/** Gross amount in € → value band key (null for no/invalid amount). */
export function valueBand(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n < 5000) return "bis-5000";
  if (n < 15000) return "5000-15000";
  if (n < 50000) return "15000-50000";
  return "ab-50000";
}

// ?rolle=: only known roles count (unknown values are ignored).
const ROLES = {
  architekt: "rolleArchitekt",
  architektin: "rolleArchitekt",
  planer: "rolleArchitekt",
  planerin: "rolleArchitekt",
  // Yacht team (31.10.2026): boatyards and marine upholsterers write from
  // /yacht-interior (?thema=yacht&rolle=werft) – own line, topic "Yacht-Interieur".
  werft: "rolleBootsbau",
  bootswerft: "rolleBootsbau",
  bootssattler: "rolleBootsbau",
  sattler: "rolleBootsbau",
};
// Steps a role presets (the role wins over ?thema=, see beratungContext()).
const ROLE_STEPS = { rolleArchitekt: { step1: "architektur" }, rolleBootsbau: { step1: "yacht", step2: "yacht" } };

// Tempo-Runde Shell: page context of the Termin links and cleanText live in
// ./pathContext.js (small, loaded by the shell on every page); re-exported
// here unchanged for the wizard, the forms and the tests.
import { CITY_NAMES, cleanText } from "./pathContext.js";
// Rat 9,5 B2 (T1 Empfang): ?plan= and ?ideenboard= after the T2 contract
// (src/lib/kuechenplaner/planTermin.js) – one check for both receivers.
import { planLink } from "../kuechenplaner/planTermin.js";
export { CITY_NAMES, cleanText, contextForPath, withContext } from "./pathContext.js";

const norm = (v) =>
  String(v ?? "")
    .trim()
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[\s_]+/g, "-")
    .slice(0, 40);

/** "italienische-ruhe" → "Italienische Ruhe" (only [a-z0-9-] slugs, else null). */
export function styleName(slug) {
  const s = String(slug ?? "").trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{0,58}$/.test(s)) return null;
  return s
    .split("-")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

const IDEENBOARD_RE = /^[A-Za-z0-9_-]{32}$/; // = lib/ideenboard/config.js TOKEN_RE

/**
 * Rat 9,5 B2: what a tool hands over besides the topic.
 *   plan        absolute link to a tool page of this site (planLink, T2), or null
 *   ideenboard  share id of an Ideenboard (32 URL-safe characters), or null
 * Anything else (foreign hosts, other paths, free text) is dropped.
 */
export function attachmentsOf(params, { origin } = {}) {
  const get = (name) => {
    if (!params) return null;
    if (typeof params.get === "function") return params.get(name);
    const v = params[name];
    return Array.isArray(v) ? v[0] : v ?? null;
  };
  const plan = planLink(get("plan"), origin ? { origin } : undefined);
  const board = String(get("ideenboard") ?? "").trim();
  return { plan: plan || null, ideenboard: IDEENBOARD_RE.test(board) ? board : null };
}

/** Public link of a shared Ideenboard ("https://platzhirsch.studio/de/ideenboard/<id>"). */
export function ideenboardUrl(id, { locale = "de", origin = "https://platzhirsch.studio" } = {}) {
  return IDEENBOARD_RE.test(String(id || "")) ? `${String(origin).replace(/\/+$/, "")}/${locale}/ideenboard/${id}` : null;
}

/**
 * Lines the receiver appends to the visitor's message ("Plan: <url>",
 * "Ideenboard: <url>"), labels in the page language. German backoffice reads
 * the URL either way.
 */
export function attachmentLines(att, { locale = "de", labels = { plan: "Plan", ideenboard: "Ideenboard" }, origin } = {}) {
  const out = [];
  if (att?.plan) out.push(`${labels.plan}: ${att.plan}`);
  const board = ideenboardUrl(att?.ideenboard, { locale, ...(origin ? { origin } : {}) });
  if (board) out.push(`${labels.ideenboard}: ${board}`);
  return out;
}

/**
 * beratungContext(params) → { step1, step2, lines, produkt, plan?, ideenboard? }
 * params: URLSearchParams | { get(name) } | plain object.
 *   step1 / step2  key of STEP1_KEYS / STEP2_KEYS or null
 *   lines          [{ key, vars? }] → MultiStepForm.context.<key>
 *   produkt        cleaned ?produkt= text or null (forms.productPrefix)
 */
export function beratungContext(params) {
  const get = (name) => {
    if (!params) return null;
    if (typeof params.get === "function") return params.get(name);
    return params[name] ?? null;
  };
  let step1 = null;
  let step2 = null;
  const lines = [];
  const addLine = (key, vars) => {
    if (key && !lines.some((l) => l.key === key)) lines.push(vars ? { key, vars } : { key });
  };

  let fallback = null;
  const apply = (topic) => {
    if (!topic) return;
    if (topic.step1 && !step1) step1 = topic.step1;
    if (topic.step2 && !step2) step2 = topic.step2;
    if (topic.fallback && !fallback) fallback = topic.fallback;
  };

  // ?rolle=architekt: "Ich plane als Architektin …" and step 1 "Architektur /
  // Planungsbüro". Runde 5 (ux P1-3): the role WINS over ?thema= – an
  // architect is never filed as "Objekt oder Hotel" and step 2 stays open
  // (before, ?thema=objekt&rolle=architekt preselected Objekt + Hotel).
  const role = ROLES[norm(get("rolle"))];
  if (role) {
    step1 = ROLE_STEPS[role].step1;
    if (ROLE_STEPS[role].step2) step2 = ROLE_STEPS[role].step2;
  }

  // ?thema= (may be "kueche,outdoor"): topics; ezarri, objekt, neubau and
  // yacht also add their context line (r7-p1). With a role only the lines.
  for (const part of String(get("thema") ?? "").split(",").map(norm).filter(Boolean).slice(0, 3)) {
    if (!role) apply(TOPICS[part]);
    if (TOPICS[part]?.thema && TOPICS[part].thema !== role) addLine(TOPICS[part].thema);
  }
  addLine(role);

  // ?planer=: topic + "Aus dem Küchenplaner" etc.
  const planer = norm(get("planer"));
  if (planer) {
    apply(TOPICS[planer]);
    addLine(PLANER_LINES[planer]);
  }
  // Bad & Wellness: "Anderes" only when no other topic chose step 1.
  if (!step1 && fallback) step1 = fallback;

  // ?stil=: "Stil-Finder-Ergebnis: Italienische Ruhe".
  const stil = styleName(get("stil"));
  if (stil) addLine("stil", { stil });

  // ?land=&wert= (Dreiländer-Rechner): "Aus dem Dreiländer-Rechner: Schweiz,
  // Warenwert 5.000 bis 15.000 €" – known codes only, the line text resolves
  // the names in the page language (MultiStepForm.context.lands/values).
  const land = String(get("land") ?? "").trim().toUpperCase();
  const wert = norm(get("wert"));
  if (LANDS.includes(land)) {
    const i = lines.findIndex((l) => l.key === "dreilaender");
    const band = VALUE_BANDS.includes(wert);
    const key = band ? "dreilaenderResult" : "dreilaenderLand";
    const vars = band ? { land, wert } : { land };
    if (i >= 0) lines[i] = { key, vars };
    else addLine(key, vars);
  }

  // ?ort=<city slug>: "Gesehen auf der Seite für St. Gallen." (known cities only).
  const ort = CITY_NAMES[norm(get("ort"))];
  if (ort) addLine("ort", { ort });

  const produktRaw = cleanText(get("produkt"));
  // Rat 9,5 B2: attachments only when present (the plain result stays as before).
  const att = attachmentsOf(params);
  return {
    step1,
    step2,
    lines,
    produkt: produktRaw || null,
    ...(att.plan ? { plan: att.plan } : {}),
    ...(att.ideenboard ? { ideenboard: att.ideenboard } : {}),
  };
}

/**
 * Message start from the context: product line first (unchanged behaviour of
 * ?produkt=), then the context lines, then an empty line for the visitor.
 * `format(key, vars)` → text of MultiStepForm.context.<key>;
 * `productLine(product)` → forms.productPrefix.
 */
export function prefillMessage(ctx, { format, productLine }) {
  const out = [];
  if (ctx?.produkt && productLine) out.push(productLine(ctx.produkt));
  for (const l of ctx?.lines || []) {
    const text = format ? format(l.key, l.vars) : "";
    if (text) out.push(text);
  }
  return out.length ? `${out.join("\n")}\n` : "";
}

/**
 * Runde 5 (ux P2-4): page context as its OWN line of the Herkunft block
 * (leadPayload.js), not only as text in the visitor's message:
 *   "Stadtseite: Bregenz · Fachweg: Architektur/Planung · Seite: Yacht-Interieur". German (backoffice).
 * Built from the cleaned context lines only – no free text from the URL.
 */
export function herkunftContext(ctx) {
  const parts = [];
  const ort = contextCity(ctx);
  if (ort) parts.push(`Stadtseite: ${ort}`);
  if ((ctx?.lines || []).some((l) => l.key === "rolleArchitekt")) parts.push("Fachweg: Architektur/Planung");
  if ((ctx?.lines || []).some((l) => l.key === "rolleBootsbau")) parts.push("Fachweg: Werft/Bootssattler");
  // Rat 9,5 A12 (UX9, R6 P2-4): yacht and hotel/objekt pages name their origin too.
  const keys = new Set((ctx?.lines || []).map((l) => l.key));
  if (keys.has("themaYacht") || keys.has("yacht")) parts.push("Seite: Yacht-Interieur");
  if (keys.has("themaObjekt") || keys.has("themaChalet")) parts.push("Seite: Hotel & Objekt");
  if (ctx?.plan) parts.push("Plan angehängt");
  if (ctx?.ideenboard) parts.push("Ideenboard angehängt");
  return parts.join(" · ");
}

/** City name of the ?ort= context ("St. Gallen") or null. */
export function contextCity(ctx) {
  return (ctx?.lines || []).find((l) => l.key === "ort")?.vars?.ort || null;
}

/** Key of a step option label (inverse of optionLabel; null if unknown). */
export function optionKey(keys, labels, label) {
  const i = Array.isArray(labels) && label ? labels.indexOf(label) : -1;
  return i >= 0 && i < keys.length ? keys[i] : null;
}

/**
 * One coherent "Thema" line for the confirmation (r8-leads, ux P1-2): topic
 * and place together ("eine Küche in einer Wohnung"); a place the topic
 * already implies is not repeated ("ein Yacht-Interieur", not "… auf einem
 * Boot oder einer Yacht"). Labels that are not part of a sentence
 * ("Ezarri-Glasmosaik", "Anderes") are joined with " · ".
 */
export function topicSummary({ topic, place, topicKey, placeKey }) {
  const a = String(topic || "").trim();
  const b = String(place || "").trim();
  if (!b || (topicKey && TOPIC_PLACE[topicKey] && TOPIC_PLACE[topicKey] === placeKey)) return a;
  if (!a) return b;
  const sentence = /^\p{Ll}/u.test(a);
  return sentence ? `${a} ${b}` : `${a} · ${b}`;
}

/**
 * Context of the /beratung page head (heading and picture): the topic of
 * step 1, else the place of step 2. null = the general page head.
 */
export function headerTopic(ctx) {
  const byTopic = { yacht: "yacht", objekt: "objekt", architektur: "architekt", kueche: "kueche", sofa: "sofa", ezarri: "ezarri", outdoor: "outdoor" };
  if (ctx?.step1 && byTopic[ctx.step1]) return byTopic[ctx.step1];
  if (ctx?.step2 === "yacht") return "yacht";
  if (ctx?.step2 === "hotel") return "objekt";
  return null;
}

/** Option label of a step key in the visitor's language (null if unknown). */
export function optionLabel(keys, labels, key) {
  const i = key ? keys.indexOf(key) : -1;
  return i >= 0 && Array.isArray(labels) && typeof labels[i] === "string" ? labels[i] : null;
}

// ── Wunschtermin (optional, no booking, no promise) ─────────────────────────

export const WISH_SLOTS = Object.freeze(["vormittags", "nachmittags", "egal"]);

/** "2026-11-12" in the visitor's time zone (Europe/Vienna by default). */
export function todayIso(now = new Date(), timeZone = "Europe/Vienna") {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  } catch {
    return now.toISOString().slice(0, 10);
  }
}

/** null = fine, "past" = before today, "format" = not YYYY-MM-DD. Empty = fine (optional). */
export function wishDateError(value, today) {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}T12:00:00Z`))) return "format";
  return value < today ? "past" : null;
}

/** Weekday 0–6 (0 = Sunday) of an ISO date, independent of the device time zone. */
export function weekdayOf(iso) {
  return new Date(`${iso}T12:00:00Z`).getUTCDay();
}

/**
 * Text line for the message (free text, no new API field):
 *   "Wunschtermin (unverbindlich): Donnerstag, 12. November 2026, vormittags"
 * `label` = MultiStepForm.wish.line prefix, `slotLabel` = translated slot.
 */
export function wishLine({ date, slot, label, slotLabel, locale = "de" }) {
  if (!date && (!slot || slot === "egal")) return "";
  const parts = [];
  if (date) {
    try {
      parts.push(
        new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
          new Date(`${date}T12:00:00Z`)
        )
      );
    } catch {
      parts.push(date);
    }
  }
  if (slot && slot !== "egal" && slotLabel) parts.push(slotLabel);
  return parts.length ? `${label}: ${parts.join(", ")}` : "";
}
