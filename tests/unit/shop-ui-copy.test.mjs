// tests/unit/shop-ui-copy.test.mjs — neue Shop-Texte (Header-Symbol,
// Mini-Warenkorb, Stepper, Schritte, Bestätigung): vollständig in 4 Sprachen,
// gleiche Platzhalter, keine Lieferzeit-/Preis-/Händler-Versprechen.
// Run: node --test tests/unit/shop-ui-copy.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { SHOP_COPY, fillCopy } from "../../src/lib/shop/copy.js";
import { hasCountryPromise, hasUnprovenClaim } from "../../src/lib/legal/claims.js";

const KEYS = ["cartLink", "cartLinkCount", "close", "drawerTitle", "drawerAdded", "continueShopping", "toCheckout", "subtotal", "subtotalNote", "cartFull", "qtyMax", "loadingPrices", "pricesError", "retry", "lineRemoved", "undo", "qtyMore", "qtyLess", "qtyChanged", "lineTotal", "stepsLabel", "steps", "guest", "paymentInfo", "payStripe", "payStripeTest", "payOnSiteInfo", "whyDisabled", "shippingAuto", "stickyTotal", "toSummary", "emptyLead", "suggestions", "confirmNext", "confirmShip", "confirmPickup", "confirmPending", "confirmKeep"];
const vars = (s) => [...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join();

test("jede Sprache hat jeden neuen Schlüssel, gleiche Platzhalter wie DE", () => {
  for (const [loc, c] of Object.entries(SHOP_COPY)) {
    for (const k of KEYS) {
      assert.ok(c[k] && (typeof c[k] === "string" || c[k].length === 4), `${loc}.${k}`);
      if (typeof c[k] === "string") assert.equal(vars(c[k]), vars(SHOP_COPY.de[k]), `${loc}.${k}`);
    }
    if (loc !== "de") assert.notEqual(c.continueShopping, SHOP_COPY.de.continueShopping, loc);
  }
});

test("bestehende Pflicht-Wortlaute bleiben (Button-Lösung)", () => {
  assert.equal(SHOP_COPY.de.buy, "Zahlungspflichtig bestellen");
  assert.equal(SHOP_COPY.de.cartTitle, "Warenkorb");
});

test("keine erfundenen Lieferzeiten, Preise oder Versprechen", () => {
  for (const c of Object.values(SHOP_COPY)) {
    for (const k of KEYS) {
      const s = [].concat(c[k]).join(" ");
      assert.doesNotMatch(s, /\d+\s*(Werktag|Tag|working day|day|jour|giorn)/i, k);
      assert.doesNotMatch(s, /€|EUR|\d+[,.]\d{2}/, k);
      assert.equal(hasUnprovenClaim(s), false, `${k}: ${s}`);
      assert.equal(hasCountryPromise(s), false, `${k}: ${s}`);
    }
  }
});

test("fillCopy füllt Platzhalter, lässt unbekannte stehen", () => {
  assert.equal(fillCopy("{name}: Menge {n}", { name: "Glas", n: 2 }), "Glas: Menge 2");
  assert.equal(fillCopy("{x}", {}), "{x}");
});
