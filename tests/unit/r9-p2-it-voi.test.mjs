// R5-fix P2 (recht P1-1): Italian in the voi form on the homepage SEO block and
// FAQ (homeSeo.js), the Wow hero (src/lib/wow/messages.js) and the new IT
// version of /arbeitsweise (copy-intl.js). The documented voi patch
// (tests/unit/r5-i18n-voi.lib.mjs) is the reference: its voi values must pass
// the same check, so the check matches the house rule.
//   node --test tests/unit/r9-p2-it-voi.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { VOI, TU_BEFORE } from "./r5-i18n-voi.lib.mjs";
import { HOME_SEO } from "../../src/lib/content/homeSeo.js";
import MESSAGES from "../../src/lib/wow/messages.js";
import { INTL } from "../../src/lib/arbeitsweise/copy-intl.js";
import { arbeitsweiseCopy } from "../../src/lib/arbeitsweise/copy.js";

const TU = /(?<![\p{L}'’])(?:tu|tuo|tua|tuoi|tue|ti|te|Tu|Tuo|Tua|Tuoi|Tue|Ti|Te)(?![\p{L}])/u;
const TU_VERB = /(?<![\p{L}])(?:puoi|vuoi|hai|devi|vedi|descrivi|Puoi|Vuoi|Hai|Devi|Mostra|Scopri|Richiedi|Scegli|Contattaci|Scrivici|Raccontaci|Prova)(?![\p{L}])/u;
const LEI = /(?<![\p{L}])(?:Lei|il Suo|la Sua|le Sue|i Suoi|casa Sua)(?![\p{L}])/u;

/** All string leaves (questions of a customer – "trovate", "mio" – are fine). */
function strings(value, out = []) {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => strings(v, out));
  else if (value && typeof value === "object") Object.values(value).forEach((v) => strings(v, out));
  return out;
}
const offenders = (list) => list.filter((s) => TU.test(s) || TU_VERB.test(s) || LEI.test(s));

test("Referenz: die dokumentierten voi-Werte bestehen die Prüfung, die tu-Werte nicht alle", () => {
  const voi = Object.values(VOI).filter((v) => typeof v === "string");
  assert.ok(voi.length > 50);
  assert.deepEqual(offenders(voi), []);
  assert.ok(offenders(Object.values(TU_BEFORE).filter((v) => typeof v === "string")).length > 10, "Prüfung erkennt tu-Formen");
});

test("homeSeo.js IT: SEO-Block und FAQ durchgehend voi", () => {
  assert.deepEqual(offenders(strings(HOME_SEO.it)), []);
  const all = strings(HOME_SEO.it).join(" ");
  assert.match(all, /vi diciamo volentieri/);
  assert.match(all, /Ci descrivete il vostro progetto/);
  assert.match(all, /vedete un rendering/);
});

test("Wow IT: Knopf im voi-Imperativ, Texte voi", () => {
  assert.equal(MESSAGES.it.show.open, "Mostrate la linea");
  assert.deepEqual(offenders(strings(MESSAGES.it)), []);
});

test("Arbeitsweise IT: voi, FR vouvoiement (kein tu/te/ton/ta/tes)", () => {
  assert.deepEqual(offenders(strings(INTL.it)), []);
  assert.deepEqual(offenders(strings(arbeitsweiseCopy("it"))), []);
  const FR_TU = /(?<![\p{L}'’])(?:tu|te|toi|ton|ta|tes|t’|t')(?![\p{L}])/iu;
  assert.deepEqual(strings(INTL.fr).filter((s) => FR_TU.test(s)), []);
});
