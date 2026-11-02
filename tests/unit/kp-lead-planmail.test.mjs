// node --test tests/unit/kp-lead-planmail.test.mjs
// Lead-Übergabe (Küchenplaner-Team, fix-09): „Link an mich mailen“ – mailto
// ohne Empfänger, nur mit Planer-Links dieser Website, nichts wird gesendet.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { MAIL_SUBJECT, planMailHref } from "../../src/lib/kuechenplaner/planMail.js";
import { defaultPlan, encodePlan } from "../../src/components/Labs/Kuechenplaner/planState.js";

const LINK = `https://platzhirsch.studio/de/kuechenplaner?k=${encodePlan(defaultPlan("l"))}`;

test("mailto ohne Empfänger mit Betreff und Plan-Link im Text", () => {
  const href = planMailHref(LINK);
  assert.match(href, /^mailto:\?subject=/);
  const q = new URLSearchParams(href.slice("mailto:?".length));
  assert.equal(q.get("subject"), MAIL_SUBJECT);
  assert.ok(q.get("body").includes(LINK));
  assert.doesNotMatch(href, /\+/, "Leerzeichen als %20, nicht als +");
  // Standard-Planung bleibt deutlich unter typischen mailto-Grenzen (~2000 Zeichen)
  assert.ok(href.length < 2000, `mailto-Länge ${href.length}`);
});

test("Fremde oder kaputte Links ergeben keinen Mail-Link", () => {
  assert.equal(planMailHref("https://example.com/de/kuechenplaner?k=x"), null);
  assert.equal(planMailHref("javascript:alert(1)"), null);
  assert.equal(planMailHref(""), null);
});

test("ResultPanel zeigt den Knopf nur mit gültigem Link", () => {
  const src = readFileSync(new URL("../../src/components/Labs/Kuechenplaner/ResultPanel.js", import.meta.url), "utf8");
  assert.match(src, /const mailHref = shareUrl \? planMailHref\(shareUrl, \{ t: tr \}\) : null;/);
  assert.match(src, /\{mailHref && \(/);
  assert.match(src, /Link an mich mailen/);
});
