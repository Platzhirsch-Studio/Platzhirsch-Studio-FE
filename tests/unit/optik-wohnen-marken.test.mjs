// tests/unit/optik-wohnen-marken.test.mjs — Optik-Runde Wohnen & Marken (01.11.2026)
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { glueDash } from "../../src/components/ShopCatalog/copy.js";

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");

test("glueDash binds a spaced dash to the word before, text unchanged otherwise", () => {
  assert.equal(glueDash("In Lochau ansehen – Termin anfragen"), "In Lochau ansehen – Termin anfragen");
  assert.equal(glueDash("a — b – c"), "a — b – c");
  assert.equal(glueDash("10–14 Uhr"), "10–14 Uhr");
  assert.equal(glueDash("Ohne Strich"), "Ohne Strich");
  assert.equal(glueDash(undefined), undefined);
  assert.equal(glueDash("In Lochau ansehen – Termin anfragen").replace(/ /g, " "), "In Lochau ansehen – Termin anfragen");
});

test("closing CTA bands of the area: Leitsatz as H2, no second display line", () => {
  for (const f of [
    "src/components/MarkenClient/Marken.js",
    "src/components/MarkenItems/markenitems.js",
    "src/components/MarkenItems/collectionDetail.js",
    "src/components/Team/teammember.js",
    "src/components/Partner/partner.js",
    "src/components/UberUns/uberuns.js",
  ]) {
    const src = read(f);
    const band = src.slice(src.indexOf("<CTABand"), src.indexOf("/>", src.indexOf("primary={")));
    assert.ok(band.includes("<Leitsatz"), `${f}: Leitsatz as title`);
    assert.ok(!/\n\s*leitsatz\n/.test(band), `${f}: no leitsatz prop (would stack two display lines)`);
    assert.ok(band.includes('tone="raised"'), `${f}: raised tone, separated from the footer`);
  }
});

test("product page: no doubled section padding before the trust block", () => {
  const src = read("src/app/[locale]/produkte/[category]/[product]/page.js");
  assert.match(src, /related\.length > 0 \|\| collectionItems\.length > 0 \|\| brandInfo \|\| designerInfo \? "pb-section" : "py-section"/);
});
