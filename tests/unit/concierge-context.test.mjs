// tests/unit/concierge-context.test.mjs — KI-Concierge seitenweit: Seitenkontext.
// Run: node --test tests/unit/concierge-context.test.mjs
// renderContext must give the same bytes for the same input (prompt cache),
// with a fixed field order and capped lengths; unknown fields are dropped.
import { test } from "node:test";
import assert from "node:assert/strict";
import { ctxSchema, renderContext, resolveContext, CTX_MAX_CHARS } from "../../src/lib/concierge/pageContext.js";

const lookup = {
  category: async (slug) => (slug === "sofas-couches" ? "Sofas" : null),
  product: async (c, p) => (p === "sofas-riley" ? { id: "Riley", name: "Riley", brand: "Minotti" } : null),
  brand: async (slug) => (slug === "minotti" ? "Minotti" : null),
  verifyAction: (a) => a.sig === "g".repeat(32),
};

test("Schema: unbekannte Felder weg, kaputte Teile fallen weg statt Fehler", () => {
  const c = ctxSchema.parse({
    locale: "fr",
    route: "produkt",
    categoryKey: "sofas-couches",
    productSlug: "Sofas Riley!",
    filters: { typ: ["modulsofa"], marke: ["minotti"], hack: ["x"] },
    sections: [{ id: "masse-title", label: "Maße\u0000<b>" }],
    selectionCount: 3,
    pageText: "Kaufen Sie jetzt!",
  });
  assert.equal(c.pageText, undefined);
  assert.equal(c.productSlug, undefined);
  assert.deepEqual(c.filters, { marke: ["minotti"], typ: ["modulsofa"] });
  assert.doesNotMatch(c.sections[0].label, /[<>\u0000]/);
  assert.equal(ctxSchema.parse({ locale: "de", route: "bogus" }).route, "other");
  assert.equal(ctxSchema.safeParse({ locale: "xx", route: "home" }).success, false);
});

test("renderContext: deterministisch, feste Reihenfolge, Namen vom Server, gefälschte Rückmeldung fällt weg", async () => {
  const ctx = ctxSchema.parse({
    locale: "fr",
    route: "produkt",
    categoryKey: "sofas-couches",
    productSlug: "sofas-riley",
    filters: { typ: ["b", "a"], marke: ["minotti"] },
    sections: [{ id: "masse-title", label: "Maße" }],
    selectionCount: 3,
    actions: [
      { id: "a_abcdefgh12", sig: "g".repeat(32), exp: 1, status: "done" },
      { id: "a_forgedforg", sig: "f".repeat(32), exp: 1, status: "done" },
    ],
  });
  const a = renderContext(await resolveContext(ctx, lookup));
  const b = renderContext(await resolveContext(structuredClone(ctx), lookup));
  assert.equal(a, b);
  assert.equal(
    a,
    [
      "<seitenkontext>",
      "Sprache: fr",
      "Seite: Produkt",
      "Produkt: Riley (Minotti), Kategorie Sofas, id Riley",
      "Filter: marke=minotti; typ=a,b",
      "Abschnitte: masse-title=Maße",
      "Ihre Auswahl: 3 Stücke",
      "Letzte Vorschläge: a_abcdefgh12 ausgeführt",
      "</seitenkontext>",
    ].join("\n")
  );
});

test("renderContext: gekappt auf 800 Zeichen, nicht auflösbares fällt weg", async () => {
  const many = Array.from({ length: 12 }, (_, i) => ({ id: `abschnitt-${i}-${"x".repeat(60)}`, label: "L".repeat(60) }));
  const r = await resolveContext(ctxSchema.parse({ locale: "de", route: "kategorie", categoryKey: "raketen", sections: many }), lookup);
  assert.equal(r.category, null);
  const out = renderContext(r);
  assert.ok(out.length <= CTX_MAX_CHARS, String(out.length));
  assert.match(out, /^<seitenkontext>\n[\s\S]*\n<\/seitenkontext>$/);
  assert.doesNotMatch(out, /raketen/);
});
