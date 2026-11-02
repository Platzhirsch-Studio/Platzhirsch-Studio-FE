// node --test tests/unit/stilfinder-profil-scoring.test.mjs
// Stil-Finder, Profil-Kuratierung (31.10.2026): Bewertungsmodell.
//   - Gewichte ausbalanciert: jedes Profil hat dieselbe Punktsumme, Höchstwert 17–18
//   - Über ALLE 5^6 Antwortkombinationen gewinnt jedes Profil 17–23 % (vorher 13,5–27,4 %)
//   - Gleichstand wird nach klaren Stimmen, Farbe, Material entschieden – nicht nach PROFILE_ORDER
//   - confidence/margin/tie, Zweitprofil erst ab SECONDARY_MIN_PCT, explainAnswers()
//   - leadingProfile() (Prefetch) = primary von scoreAnswers()
// Deterministisch, offline, ohne Bilder (Loader ersetzt Bild-Importe).
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register(
  "data:text/javascript," +
    encodeURIComponent(`
export async function resolve(spec, ctx, next) {
  try { return await next(spec, ctx); }
  catch (e) { if (spec.startsWith(".") && !spec.split("/").pop().includes(".")) return next(spec + ".js", ctx); throw e; }
}
export async function load(url, ctx, next) {
  if ([".jpg", ".jpeg", ".png", ".webp", ".avif"].some((x) => url.toLowerCase().endsWith(x)))
    return { format: "module", shortCircuit: true, source: "export default { src: '/x.jpg', width: 10, height: 10, blurDataURL: '' };" };
  return next(url, ctx);
}`)
);

const { QUESTIONS, BALANCED_TOTAL, SECONDARY_MIN_PCT, scoreAnswers, leadingProfile, explainAnswers } = await import("../../src/components/Labs/Stilfinder/questions.js");
const { PROFILE_ORDER } = await import("../../src/components/Labs/Stilfinder/profiles.js");

const STYLE_Q = QUESTIONS.filter((q) => q.kind !== "scope");
const SCOPE_I = QUESTIONS.findIndex((q) => q.kind === "scope");

/** All answer combinations of the style questions (scope skipped). */
function* allCodes() {
  const sizes = STYLE_Q.map((q) => q.options.length);
  const total = sizes.reduce((a, b) => a * b, 1);
  for (let n = 0; n < total; n++) {
    let r = n;
    const digits = sizes.map((s) => {
      const d = r % s;
      r = Math.floor(r / s);
      return String(d);
    });
    const code = [];
    let j = 0;
    QUESTIONS.forEach((q, i) => code.push(i === SCOPE_I ? "x" : digits[j++]));
    yield code.join("");
  }
}

test("Gewichte: jedes Profil hat dieselbe Punktsumme und fast denselben Höchstwert", () => {
  const sum = Object.fromEntries(PROFILE_ORDER.map((k) => [k, 0]));
  const max = { ...sum };
  for (const q of STYLE_Q) {
    for (const o of q.options) for (const [k, v] of Object.entries(o.w)) sum[k] += v;
    for (const k of PROFILE_ORDER) max[k] += Math.max(...q.options.map((o) => o.w[k] || 0));
  }
  for (const k of PROFILE_ORDER) assert.equal(sum[k], BALANCED_TOTAL, `${k}: Summe ${sum[k]}`);
  const m = Object.values(max);
  assert.ok(Math.max(...m) - Math.min(...m) <= 1, JSON.stringify(max));
  // the palette question is the pure style statement: one option per profile
  const farbe = QUESTIONS.find((q) => q.id === "farbe");
  assert.deepEqual(farbe.options.map((o) => Object.keys(o.w)).flat().sort(), [...PROFILE_ORDER].sort());
});

test("Jede Frage hat für jedes Profil höchstens eine klare Stimme (≥ 3 Punkte)", () => {
  for (const q of STYLE_Q) {
    for (const k of PROFILE_ORDER) {
      const strong = q.options.filter((o) => (o.w[k] || 0) >= 3).length;
      assert.ok(strong <= 1, `${q.id}/${k}: ${strong} klare Stimmen`);
    }
  }
});

test("Fairness: über alle Antwortkombinationen gewinnt jedes Profil 17–23 %", () => {
  const wins = Object.fromEntries(PROFILE_ORDER.map((k) => [k, 0]));
  let n = 0;
  for (const code of allCodes()) {
    wins[scoreAnswers(code).primary]++;
    n++;
  }
  for (const k of PROFILE_ORDER) {
    const share = wins[k] / n;
    assert.ok(share >= 0.17 && share <= 0.23, `${k}: ${(share * 100).toFixed(1)} % (${JSON.stringify(wins)})`);
  }
});

test("Gleichstand: entschieden nach klaren Stimmen, Farbe, Material – PROFILE_ORDER entscheidet selten", () => {
  let ties = 0;
  let byOrder = 0;
  const tieWins = Object.fromEntries(PROFILE_ORDER.map((k) => [k, 0]));
  for (const code of allCodes()) {
    const r = scoreAnswers(code);
    if (!r.tie) continue;
    ties++;
    tieWins[r.primary]++;
    const farbe = QUESTIONS.find((q) => q.id === "farbe");
    const fi = QUESTIONS.indexOf(farbe);
    const fav = Object.keys(farbe.options[Number(code[fi])].w)[0];
    // if the palette answer is one of the tied leaders and they have the same
    // number of clear votes, the palette must have decided
    if (r.shares[0].key !== fav && r.shares[1].key === fav) {
      const strong = (k) => STYLE_Q.reduce((s, q) => s + ((q.options[Number(code[QUESTIONS.indexOf(q)])].w[k] || 0) >= 3 ? 1 : 0), 0);
      assert.ok(strong(r.primary) > strong(fav), `${code}: Farbwahl ${fav} hätte gewinnen müssen`);
    }
    if (PROFILE_ORDER.indexOf(r.primary) < PROFILE_ORDER.indexOf(r.shares[1].key)) byOrder++;
  }
  assert.ok(ties > 0);
  // every profile wins some ties (before: Pariser Salon 125, Klare Linie 0 of 1 975)
  for (const k of PROFILE_ORDER) assert.ok(tieWins[k] / ties >= 0.1, `${k} gewinnt nur ${tieWins[k]} von ${ties} Gleichständen`);
  assert.ok(byOrder / ties < 0.75, `PROFILE_ORDER bevorzugt: ${byOrder}/${ties}`);
});

test("Ergebnisobjekt: confidence, margin, tie, Zweitprofil-Schwelle, Summe 100 %", () => {
  const seen = new Set();
  for (const code of allCodes()) {
    const r = scoreAnswers(code);
    assert.equal(r.shares.reduce((a, s) => a + s.pct, 0), 100, code);
    assert.equal(r.margin, r.shares[0].pct - r.shares[1].pct);
    assert.ok(r.margin >= 0, code);
    assert.ok(["eindeutig", "ausgepraegt", "mischung"].includes(r.confidence));
    seen.add(r.confidence);
    if (r.secondary) {
      assert.equal(r.secondary, r.shares[1].key);
      assert.ok(r.shares[1].pct >= SECONDARY_MIN_PCT, code);
    } else assert.ok(r.shares[1].pct < SECONDARY_MIN_PCT, code);
    if (r.tie) assert.notEqual(r.confidence, "eindeutig", code);
  }
  assert.deepEqual([...seen].sort(), ["ausgepraegt", "eindeutig", "mischung"]);
});

test("Eindeutige Antwortreihen ergeben das erwartete Profil (je Profil die passenden Karten)", () => {
  // option index per style question whose clear vote is the profile
  for (const k of PROFILE_ORDER) {
    const code = QUESTIONS.map((q) => (q.kind === "scope" ? "x" : String(q.options.findIndex((o) => (o.w[k] || 0) >= 3) >= 0 ? q.options.findIndex((o) => (o.w[k] || 0) >= 3) : 0))).join("");
    const r = scoreAnswers(code);
    assert.equal(r.primary, k, `${k}: ${code}`);
    assert.equal(r.confidence, "eindeutig", `${k}: ${code}`);
  }
  // the QA link of the e2e tests stays Italienische Ruhe
  assert.equal(scoreAnswers("0000000").primary, "ruhe");
});

test("Rahmen-Frage beeinflusst das Profil nicht", () => {
  for (const code of ["0000000", "1234012", "4321043"]) {
    const base = scoreAnswers(code.slice(0, SCOPE_I) + "x" + code.slice(SCOPE_I + 1));
    for (let o = 0; o < QUESTIONS[SCOPE_I].options.length; o++) {
      const r = scoreAnswers(code.slice(0, SCOPE_I) + o + code.slice(SCOPE_I + 1));
      assert.deepEqual(r.shares, base.shares);
      assert.equal(r.scope.label, QUESTIONS[SCOPE_I].options[o].label);
    }
  }
});

test("leadingProfile (Prefetch) trifft immer das spätere Ergebnis", () => {
  let n = 0;
  for (const code of allCodes()) {
    if (n++ % 7) continue; // every 7th code is enough here
    const answers = [...code].map((c) => (c === "x" ? "x" : Number(c)));
    assert.equal(leadingProfile(answers), scoreAnswers(code).primary, code);
  }
  assert.equal(leadingProfile(Array(QUESTIONS.length).fill(null)), null);
});

test("explainAnswers: nennt die tragenden Antworten, stärkste zuerst, deterministisch", () => {
  const r = scoreAnswers("0000000");
  const why = explainAnswers("0000000", r.primary);
  assert.ok(why.length >= 1 && why.length <= 3);
  for (let i = 1; i < why.length; i++) assert.ok(why[i - 1].points >= why[i].points);
  for (const w of why) {
    assert.equal(typeof w.question, "string");
    assert.equal(typeof w.label, "string");
    assert.ok(w.points > 0);
  }
  assert.deepEqual(explainAnswers("0000000", r.primary), why);
  assert.deepEqual(explainAnswers("bad", "ruhe"), []);
  assert.deepEqual(explainAnswers("0000000", "nope"), []);
});
