// Stil-Finder – questions, weights and scoring.
// Plain module: the quiz (client) and the result page (server) both run
// `scoreAnswers()`, so a shared link (?a=…) always reproduces the same result.
//
// Answer code: one character per question, "0"–"4" = chosen option index,
// "x" = skipped (only the optional scope question can be skipped).
// Scoring is a transparent weighted sum – no AI, no profiling, nothing stored
// on a server.

import { PROFILE_ORDER, PROFILES } from "./profiles";

// Static imports: width, height and a tiny blurDataURL come for free, so an
// answer card never shows as an empty tile while its photo loads.
import iHomeAboutHome from "../../../../public/Images/Home/aboutHome.jpg";
import iUberunsTomdixon from "../../../../public/Images/UberUns/tomdixon.webp";
import iOutdoorBannerImage5 from "../../../../public/Images/Outdoor/bannerImage5.jpg";
import iLichtBannerImageLicht5 from "../../../../public/Images/Licht/bannerImageLicht5.jpg";
import iWohnenBannerImage2 from "../../../../public/Images/Wohnen/bannerImage2.jpg";
import iUberunsLivingroomView from "../../../../public/Images/UberUns/livingroom-view.jpg";
import iUberunsWhiteSofas from "../../../../public/Images/UberUns/white-sofas.jpg";
import iHomeBannerImage4 from "../../../../public/Images/Home/bannerImage-4.jpg";
import iUberunsGoldVase from "../../../../public/Images/UberUns/gold-vase.jpg";
import iFooter14 from "../../../../public/Images/Footer/14.jpg";
import iHomeOrionMinoti from "../../../../public/Images/Home/orionMinoti.jpg";
import iNotfoundMinottiSofas from "../../../../public/Images/NotFound/minotti-sofas.webp";
import iLichtBannerImageLicht3 from "../../../../public/Images/Licht/bannerImageLicht3.jpg";
import iHomeDownload from "../../../../public/Images/Home/download.jpg";
import iHomeTrecaParisBettSchlafzimmer from "../../../../public/Images/Home/slider/treca-paris-bett-schlafzimmer.webp";
import iTeamDinnerTable from "../../../../public/Images/Team/dinner-table.jpg";
import iOutdoorBannerImage4 from "../../../../public/Images/Outdoor/bannerImage4.jpg";
import iTeamReadingArea from "../../../../public/Images/Team/reading-area.jpg";
import iHomeBannerImage1 from "../../../../public/Images/Home/bannerImage-1.jpg";
import iNewsletterIndoorDinnerSpace from "../../../../public/Images/Newsletter/indoor-dinner-space.jpg";
import iLichtBannerImageLicht4 from "../../../../public/Images/Licht/bannerImageLicht4.jpg";
import iLichtBannerImageLicht2 from "../../../../public/Images/Licht/bannerImageLicht2.jpg";
import iHomeFlosStehleuchteV3 from "../../../../public/Images/Home/slider/flos-stehleuchte-v3.webp";
import iWohnenBannerImage9 from "../../../../public/Images/Wohnen/bannerImage9.jpg";
import iNewsletterMinottiPatio from "../../../../public/Images/Newsletter/minotti-patio.jpg";

export const QUESTIONS = [
  {
    id: "raum",
    kind: "image",
    overline: "Der Raum",
    title: "Wo möchten Sie am liebsten ankommen?",
    options: [
      {
        label: "Weite Lounge",
        image: iHomeAboutHome,
        alt: "Weitläufiger Wohnraum mit hellen Sofas, Sesseln und einem langen Kamin vor einer Fensterfront",
        w: { ruhe: 3, klar: 1 },
      },
      {
        label: "Tafel unter Olivenbäumen",
        image: iUberunsTomdixon,
        alt: "Langer Holztisch mit Holzstühlen vor einer Fensterfront mit Olivenbäumen",
        w: { warm: 3, see: 1 },
      },
      {
        label: "Terrasse über dem Wasser",
        image: iOutdoorBannerImage5,
        alt: "Lounge-Sofa mit gelben Kissen auf einer Terrasse über dem Meer, Pinien im Hintergrund",
        w: { see: 3, ruhe: 1 },
      },
      {
        label: "Salon mit Geschichte",
        image: iLichtBannerImageLicht5,
        alt: "Historischer Raum mit Holzvertäfelung, Schachbrettboden, Kupfer-Pendelleuchten und dunklem Ohrensessel",
        w: { salon: 3 },
      },
      {
        label: "Klare Bühne",
        image: iWohnenBannerImage2,
        alt: "Runder dunkler Esstisch mit Stuhl und einer kreisförmigen Pendelleuchte vor heller Wand",
        w: { klar: 3, ruhe: 1 },
      },
    ],
  },
  {
    id: "material",
    kind: "image",
    overline: "Das Material",
    title: "Welche Oberfläche möchten Sie berühren?",
    options: [
      {
        label: "Bouclé & Leinen",
        image: iUberunsLivingroomView,
        alt: "Heller Wohnraum mit weißen Sofas und rundlichen Sesseln mit weichem Bezug vor bodenlangen Vorhängen",
        w: { ruhe: 3, see: 1 },
      },
      {
        label: "Geflecht & Teak",
        image: iUberunsWhiteSofas,
        alt: "Geflochtener Loungesessel und Daybed vor einer rostbraunen Stahlwand im Garten",
        w: { see: 3, warm: 1 },
      },
      {
        label: "Nussbaum & Leder",
        image: iHomeBannerImage4,
        alt: "Wandsystem aus warmem Holz mit Regalböden, Lederbank und Sessel",
        w: { warm: 3, klar: 1 },
      },
      {
        label: "Messing & Glanz",
        image: iUberunsGoldVase,
        alt: "Goldene, spiegelnde Vase mit Grünpflanze vor einem dunklen Raum",
        w: { salon: 3 },
      },
      {
        label: "Glas & Metall",
        image: iFooter14,
        alt: "Vitrine aus schwarzem Metall und Glas mit wenigen Objekten",
        w: { klar: 3, salon: 1 },
      },
    ],
  },
  {
    id: "farbe",
    kind: "palette",
    overline: "Die Farbe",
    // UX-Benchmark fix-04: neutral – "beruhigt" pre-loaded the calm profile.
    title: "Welche Farbwelt fühlt sich nach Zuhause an?",
    options: [
      { label: "Sand & Leinen", swatches: PROFILES.ruhe.palette.map((c) => c.hex), w: { ruhe: 3 } },
      { label: "Cognac & Oliv", swatches: PROFILES.warm.palette.map((c) => c.hex), w: { warm: 3 } },
      { label: "Seenebel & Kalk", swatches: PROFILES.see.palette.map((c) => c.hex), w: { see: 3 } },
      { label: "Smaragd & Messing", swatches: PROFILES.salon.palette.map((c) => c.hex), w: { salon: 3 } },
      { label: "Graphit & Kreide", swatches: PROFILES.klar.palette.map((c) => c.hex), w: { klar: 3 } },
    ],
  },
  {
    id: "form",
    kind: "image",
    overline: "Die Form",
    title: "Welche Linie zieht Ihren Blick an?",
    options: [
      {
        label: "Tief & lang",
        image: iHomeOrionMinoti,
        alt: "Langes, niedriges Sofa in einem dunklen Wohnraum mit Holzwänden",
        w: { ruhe: 3 },
      },
      {
        label: "Rund & organisch",
        image: iNotfoundMinottiSofas,
        alt: "Runder geflochtener Sessel und runder Couchtisch vor einer Natursteinwand",
        w: { see: 3, warm: 1 },
      },
      {
        label: "Grafisch & schlank",
        image: iLichtBannerImageLicht3,
        alt: "Schwarzer Esstisch mit schlanken schwarzen Stühlen unter Glaskugel-Leuchten",
        w: { klar: 3 },
      },
      {
        label: "Geschwungen & gepolstert",
        image: iHomeDownload,
        alt: "Esstisch aus Holz mit gepolsterten Stühlen mit runder Rückenlehne vor einer Anrichte",
        w: { salon: 2, warm: 2 },
      },
      {
        label: "Muster & Charakter",
        image: iHomeTrecaParisBettSchlafzimmer,
        alt: "Bett mit gemustertem Kopfteil und petrolfarbenem Überwurf in einem hellen Schlafzimmer",
        w: { salon: 3 },
      },
    ],
  },
  {
    id: "leben",
    kind: "image",
    overline: "Das Leben",
    title: "Wie verbringen Sie einen freien Samstag am liebsten?",
    options: [
      {
        label: "Freunde bewirten",
        image: iTeamDinnerTable,
        alt: "Langer Esstisch mit Stühlen vor einer Glasfront mit Blick ins Grüne",
        w: { warm: 3, see: 1 },
      },
      {
        label: "Draußen sein, aufs Wasser schauen",
        image: iOutdoorBannerImage4,
        alt: "Weißer Tisch mit Klappstühlen unter Pinien, dahinter das Meer",
        w: { see: 3 },
      },
      {
        label: "Lesen, ordnen, durchatmen",
        image: iTeamReadingArea,
        alt: "Offenes Regal mit Büchern und Objekten vor einer hellen Betonwand",
        w: { klar: 3, ruhe: 1 },
      },
      {
        label: "Ausschlafen, Rückzug",
        image: iHomeBannerImage1,
        alt: "Schlafzimmer mit gepolstertem Bett, dunkler Wand und Blick ins Grüne",
        w: { ruhe: 3 },
      },
      {
        label: "Ein festliches Dinner",
        image: iNewsletterIndoorDinnerSpace,
        alt: "Esstisch mit Stühlen unter einer Lichtinstallation vor dunkler Holzwand",
        w: { salon: 3, klar: 1 },
      },
    ],
  },
  {
    id: "licht",
    kind: "image",
    overline: "Das Licht",
    title: "Welches Licht wünschen Sie sich am Abend?",
    options: [
      {
        label: "Goldenes Glühen",
        image: iLichtBannerImageLicht4,
        alt: "Gold schimmernde Pendelleuchten über einem Holztisch vor dunkler Wand",
        w: { warm: 3 },
      },
      {
        label: "Skulptur aus Licht",
        image: iLichtBannerImageLicht2,
        alt: "Leuchte mit verzweigten goldenen Armen und farbigen Glaskugeln vor schwarzem Hintergrund",
        w: { salon: 3 },
      },
      {
        label: "Weiche Kuppel",
        image: iHomeFlosStehleuchteV3,
        alt: "Zwei Leuchten mit weißen Kuppelschirmen vor grüner Wand",
        w: { ruhe: 2, warm: 2 },
      },
      {
        label: "Papier & Tageslicht",
        image: iWohnenBannerImage9,
        alt: "Heller Raum mit Stehleuchte und Konsole vor einer Glaswand mit schwarzen Sprossen",
        w: { klar: 3, ruhe: 1 },
      },
      {
        label: "Dämmerung draußen",
        image: iNewsletterMinottiPatio,
        alt: "Terrasse mit Loungemöbeln in der Abenddämmerung über einer Hügellandschaft",
        w: { see: 3 },
      },
    ],
  },
  {
    id: "rahmen",
    kind: "scope",
    optional: true,
    overline: "Der Rahmen · optional",
    title: "Wie groß ist Ihr Vorhaben?",
    hint: "Hilft uns nur bei der Vorbereitung Ihres Termins – beeinflusst Ihr Stilprofil nicht.",
    // Price ranges are deliberately NOT invented: `range` is a configuration
    // value the owner sets (e.g. "ab … €"). While it is null nothing price-
    // related is shown (R2 P3: the old bracket placeholder was visible).
    options: [
      { label: "Ein Lieblingsstück", sub: "Sofa, Sessel, Leuchte", range: null, w: {} },
      { label: "Ein Raum", sub: "Wohnzimmer, Essbereich, Schlafzimmer", range: null, w: {} },
      { label: "Mehrere Räume", sub: "Wohnung oder Haus", range: null, w: {} },
      { label: "Terrasse & Garten", sub: "Outdoor-Wohnraum", range: null, w: {} },
    ],
  },
];

export const CODE_PATTERN = new RegExp(`^[0-4x]{${QUESTIONS.length}}$`);

export function isValidCode(code) {
  if (typeof code !== "string" || !CODE_PATTERN.test(code)) return false;
  return QUESTIONS.every((q, i) => {
    const c = code[i];
    if (c === "x") return !!q.optional;
    return Number(c) < q.options.length;
  });
}

// Profil-Kuratierung (31.10.2026): the weights are balanced – every profile
// collects exactly BALANCED_TOTAL points over all options and can reach
// 17–18 points – so no profile wins more often only because it appears on
// more cards (before: Warme Moderne 27 %, Klare Linie 14 % of all answer
// combinations; now each profile 19–21 %). Tested in
// tests/unit/stilfinder-profil-scoring.test.mjs.
export const BALANCED_TOTAL = 21;
// An option with at least this many points for a profile is a clear vote.
const STRONG = 3;
// Below this share a profile is not named as the "Hauch von …".
export const SECONDARY_MIN_PCT = 12;

const zero = () => Object.fromEntries(PROFILE_ORDER.map((k) => [k, 0]));
const optionAt = (q, a) => (a === null || a === undefined || a === "x" ? null : q.options[Number(a)] || null);

/** Points and clear votes per profile for answers (array of index | "x" | null). */
function tally(answers) {
  const totals = zero();
  const strong = zero();
  QUESTIONS.forEach((q, i) => {
    const opt = optionAt(q, answers?.[i]);
    if (!opt) return;
    for (const [k, v] of Object.entries(opt.w)) {
      totals[k] += v;
      if (v >= STRONG) strong[k] += 1;
    }
  });
  return { totals, strong };
}

/**
 * Profiles ranked by points. Equal points (≈ 19 % of all answer combinations)
 * used to fall to PROFILE_ORDER – Italienische Ruhe and Warme Moderne won
 * every tie. Now a tie is decided by what the visitor said most directly:
 * more clear votes, then the palette answer, then the material answer, and
 * only then PROFILE_ORDER (stable, so one code gives one result).
 */
function rank({ totals, strong }, answers) {
  const w = (id) => optionAt(QUESTIONS.find((q) => q.id === id), answers?.[QUESTIONS.findIndex((q) => q.id === id)])?.w || {};
  const farbe = w("farbe");
  const material = w("material");
  return [...PROFILE_ORDER].sort(
    (a, b) =>
      totals[b] - totals[a] ||
      strong[b] - strong[a] ||
      (farbe[b] || 0) - (farbe[a] || 0) ||
      (material[b] || 0) - (material[a] || 0) ||
      PROFILE_ORDER.indexOf(a) - PROFILE_ORDER.indexOf(b),
  );
}

const codeAnswers = (code) => [...code].map((c) => (c === "x" ? "x" : Number(c)));

/**
 * Returns { primary, secondary, shares: [{key, pct}], scope, tie, margin,
 * confidence } or null.
 *   tie         the two leading profiles have the same points (decided by rank())
 *   margin      lead of the primary over the second profile, percentage points
 *   confidence  "eindeutig" (≥ 20 pts lead), "ausgepraegt" (≥ 8) or "mischung"
 */
export function scoreAnswers(code) {
  if (!isValidCode(code)) return null;
  const answers = codeAnswers(code);
  const t = tally(answers);
  const { totals } = t;
  const scopeIdx = QUESTIONS.findIndex((q) => q.kind === "scope");
  const scope = scopeIdx < 0 ? null : optionAt(QUESTIONS[scopeIdx], answers[scopeIdx]);
  const sum = Object.values(totals).reduce((a, b) => a + b, 0) || 1;
  const ranked = rank(t, answers).map((k) => ({ key: k, score: totals[k] }));
  // Largest-remainder rounding: the visible shares always add up to exactly
  // 100 % (R2 P3: plain Math.round gave 101 %).
  const raw = ranked.map((r) => (r.score / sum) * 100);
  const pcts = raw.map(Math.floor);
  let rest = Object.values(totals).some((v) => v > 0) ? 100 - pcts.reduce((a, b) => a + b, 0) : 0;
  raw
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i)
    .forEach(({ i }) => {
      if (rest > 0 && raw[i] > 0) {
        pcts[i] += 1;
        rest -= 1;
      }
    });
  const shares = ranked.map((r, i) => ({ key: r.key, pct: pcts[i] }));
  const margin = shares[0].pct - shares[1].pct;
  return {
    primary: ranked[0].key,
    secondary: ranked[1].score > 0 && shares[1].pct >= SECONDARY_MIN_PCT ? ranked[1].key : null,
    shares,
    scope,
    tie: ranked[0].score === ranked[1].score,
    margin,
    confidence: margin >= 20 ? "eindeutig" : margin >= 8 ? "ausgepraegt" : "mischung",
  };
}

/**
 * The answers that carried a profile – "Woran wir das festmachen" instead of
 * a horoscope sentence: [{ question, label, points }], strongest first, max n.
 */
export function explainAnswers(code, profileKey, n = 3) {
  if (!isValidCode(code) || !PROFILE_ORDER.includes(profileKey)) return [];
  const answers = codeAnswers(code);
  return QUESTIONS.map((q, i) => ({ q, i, opt: optionAt(q, answers[i]) }))
    .filter(({ opt }) => (opt?.w?.[profileKey] || 0) > 0)
    .map(({ q, i, opt }) => ({ question: q.overline, label: opt.label, points: opt.w[profileKey], i }))
    .sort((a, b) => b.points - a.points || a.i - b.i)
    .slice(0, n)
    .map(({ i: _i, ...rest }) => rest);
}

// Profile ahead after a partial run (answers: array of index | "x" | null).
// Only used to prefetch the likely result route before the last question –
// same ranking as scoreAnswers(), so the prefetch hits the real result.
export function leadingProfile(answers) {
  const t = tally(answers);
  const best = rank(t, answers)[0];
  return t.totals[best] > 0 ? best : null;
}

// Small deterministic seed from the answer code, so the moodboard varies
// between people but is identical for everyone opening the same link.
export function seedFromCode(code) {
  let h = 2166136261;
  for (const ch of String(code || "")) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
