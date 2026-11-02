// tests/unit/shop-header-warenkorb.test.mjs — Warenkorb-Symbol im Header:
// nur bei aktivem Shop, Zähler nach Hydration, kleine Insel ohne schwere Importe.
// Run: node --test tests/unit/shop-header-warenkorb.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as lucide from "lucide-react";
import { Minus, Plus, ShoppingBag } from "../../src/components/ui/icons.js";

const read = (p) => fs.readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");

test("navbar rendert CartLink nur hinter shopActive()", () => {
  const nav = read("src/components/Navbar/navbar.js");
  assert.match(nav, /const shop = shopActive\(\);/);
  assert.match(nav, /\{shop && <CartLink labels=\{\{ label: shopText\.cartLink, count: shopText\.cartLinkCount \}\} \/>\}/);
  assert.doesNotMatch(nav, /^"use client"/);
});

test("CartLink: Client-Insel, Zahl im aria-label, keine Server-/Shop-Logik im Client", () => {
  const src = read("src/components/Navbar/CartLink.js");
  assert.match(src, /^"use client";/);
  assert.match(src, /aria-label=\{label\}/);
  assert.match(src, /prefetch=\{false\}/);
  const imports = [...src.matchAll(/from "([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(imports.sort(), ["./Navbar.module.css", "@/components/Shop/cartStore", "@/i18n/navigation", "@/components/ui/icons"].sort());
  for (const bad of ["@/lib/shop/mode", "@/lib/shop/copy", "lucide-react", "@/components/ui\""]) assert.ok(!src.includes(bad), bad);
});

test("neue Shell-Icons = lucide-Markup", () => {
  for (const [name, Icon] of Object.entries({ Minus, Plus, ShoppingBag })) {
    const props = { "aria-hidden": "true", className: "size-5", strokeWidth: 1.5 };
    assert.equal(renderToStaticMarkup(createElement(Icon, props)), renderToStaticMarkup(createElement(lucide[name], props)), name);
  }
});
