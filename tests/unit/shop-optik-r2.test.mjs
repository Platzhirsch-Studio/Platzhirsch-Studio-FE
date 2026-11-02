// tests/unit/shop-optik-r2.test.mjs — Shop, Optik-QA Runde 1 → Fixes (01.11.2026):
// Kaufbox-Vorauswahl, Ausführungs-Kacheln, Breadcrumb auf Telefonen, ruhiges Raster,
// Filter-Sheet-Zahl, Shop-Unternavigation, Warenkorb-Auswahl, USt.-Begriff, Mini-Warenkorb.
// node --test tests/unit/shop-optik-r2.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (p) => fs.readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");

test("startVariante: bei Verpackungseinheiten die kleinste, sonst Standard", async () => {
  const { startVariante } = await import("../../src/components/Katalog/kaufAuswahl.js");
  assert.equal(startVariante([{ id: "1er" }, { id: "2er" }, { id: "6er" }], "6er"), "1er");
  assert.equal(startVariante([{ id: "6er" }, { id: "2er" }], "6er"), "2er");
  assert.equal(startVariante([{ id: "grau" }, { id: "klar" }], "grau"), "grau");
  assert.equal(startVariante([{ id: "1er" }, { id: "geschenk" }], "geschenk"), "geschenk", "gemischt: Standard bleibt");
  assert.equal(startVariante([], undefined), null);
  // Optik-QA r2: echte IDs sind Slugs der Namen (variantenOf) – vorher blieb der 6er-Karton vorausgewählt.
  assert.equal(startVariante([{ id: "einzeln-im-geschenkkarton" }, { id: "2er-karton" }, { id: "6er-karton" }], "6er-karton"), "einzeln-im-geschenkkarton");
  assert.equal(startVariante([{ id: "6er-karton" }, { id: "2er-karton" }], "6er-karton"), "2er-karton");
  const { packGroesse } = await import("../../src/components/Katalog/kaufAuswahl.js");
  assert.equal(packGroesse("einzeln-im-geschenkkarton"), 1);
  assert.equal(packGroesse("12er-karton"), 12);
  assert.equal(packGroesse("grau"), null);
  assert.match(read("src/components/Katalog/ReservierenSlot.js"), /start=\{startVariante\(anzeige,/);
});

test("varianteTeile: Name und Maße getrennt (kein hängendes „·“)", async () => {
  const { varianteTeile } = await import("../../src/components/Katalog/kaufAuswahl.js");
  assert.deepEqual(varianteTeile("MONUMENT · 35 cm · 6,5 kg"), { name: "MONUMENT", mass: "35 cm · 6,5 kg" });
  assert.deepEqual(varianteTeile("SIGNATURE"), { name: "SIGNATURE", mass: null });
  assert.deepEqual(varianteTeile(null), { name: "", mass: null });
  const kb = read("src/components/Katalog/KaufBox.js");
  // Optik-QA r3: eine Zeile je Ausführung (keine über die Breite spannende letzte Kachel, Haken im Fluss).
  assert.ok(kb.includes('<div className="flex flex-col gap-2">'), "eine Zeile je Ausführung");
  assert.doesNotMatch(kb, /absolute top-2 right-2/, "Haken überdeckt nichts");
  const { massText, varianteZeile } = await import("../../src/components/Katalog/kaufAuswahl.js");
  assert.equal(massText("10 cm · 500 g"), "10 cm, 500 g");
  assert.equal(massText(null), null);
  assert.equal(varianteZeile("CLASSIQUE · 10 cm · 500 g"), "CLASSIQUE, 10 cm, 500 g");
  assert.equal(varianteZeile("2er-Karton"), "2er-Karton");
  assert.ok(kb.includes('<p className="mt-2 text-small text-text-soft">{hinweis}</p>'), "Abstand unter „Warenkorb →“");
});

test("Breadcrumb: Shop-Seiten nutzen SHOP_CRUMBS (Telefon: nur „← übergeordnet“)", async () => {
  const { SHOP_CRUMBS } = await import("../../src/components/Katalog/shopCrumbs.js");
  assert.ok(SHOP_CRUMBS.includes("max-sm:[&_li]:hidden") && SHOP_CRUMBS.includes("max-sm:[&_li:nth-last-child(2)]:flex"));
  assert.ok(SHOP_CRUMBS.includes("[&_a]:min-h-11"), "Zielgröße bleibt");
  for (const p of ["src/components/Katalog/ShopProduktDetail.js", "src/components/Katalog/AccessoiresListe.js", "src/app/[locale]/accessoires/suche/page.js"])
    assert.match(read(p), /className=\{SHOP_CRUMBS\}/, p);
  assert.match(read("src/components/Katalog/ShopProduktDetail.js"), /\{ label: shopTitel\(p\.name\) \}/);
});

test("Raster: Liste/Suche ohne Scroll-Reveal, Startseite/Produktseite ohne Treppe", () => {
  assert.doesNotMatch(read("src/components/Katalog/ShopGrid.js"), /reveal-group/);
  assert.doesNotMatch(read("src/app/[locale]/accessoires/suche/page.js"), /"reveal-group/);
  for (const p of ["src/components/ShopStart/ShopStartseite.js", "src/components/Katalog/ShopProduktDetail.js"])
    assert.ok(read(p).includes("reveal-group [&>*]:[--reveal-start:0%] [&>*]:[--reveal-end:40%]"), p);
});

test("Filterleiste: Sheet-Knopf zeigt die bekannte Zahl, nicht klebend bei ≤ 500 px Höhe", () => {
  const g = read("src/components/Katalog/ShopGrid.js");
  assert.ok(g.includes('{status === "laden" && aktiv ? copy.laden : fill(copy.anzeigen,'));
  assert.ok(g.includes("sticky top-header z-(--z-sticky) [@media(max-height:500px)]:static"));
});

test("Shop-Unternavigation: „Alle Produkte“ in der Kopfzeile, Abteilungen ab lg ohne Maske", () => {
  const s = read("src/components/ShopStart/ShopSubHeader.js");
  const kopf = s.indexOf("{c.subHome}");
  const alle = s.indexOf("{c.navAlleProdukte}");
  const liste = s.indexOf("data-shop-abteilungen");
  assert.ok(kopf > 0 && alle > kopf && alle < liste, "Alle Produkte vor der Abteilungszeile");
  // Optik-QA r3: Abteilungen auf allen Breiten eine wischbare Zeile (bei Textzoom sonst drei Zeilen),
  // Telefon: „Alle Produkte“ als erster Chip, Lupe statt Suchfeld; auf der Suchseite kein Kopf-Suchfeld.
  assert.ok(!s.includes("lg:flex-wrap") && !s.includes("lg:[mask-image:none]"));
  assert.ok(s.includes("[body:has([data-shop-suche-seite])_&]:hidden"));
  assert.ok(s.includes("data-shop-suche-link"));
});

test("Warenkorb: Ausführungs-Auswahl in eigener Zeile, Namen wie im Shop; USt. einheitlich", () => {
  const c = read("src/components/Shop/ShopCart.js");
  assert.ok(c.includes("{optionText(v.name, euro(v.cent, locale), v.id === z.variante)}"), "gewählte Ausführung ohne Preis im Feld (WebKit kürzt sonst)");
  // Optik-QA r3: Maße mit Kommas (varianteZeile), Auswahl in eigener Rasterzeile.
  assert.ok(c.includes("(gewaehlt ? shopTitel(varianteZeile(name)) : `${shopTitel(varianteZeile(name))} – ${preis}`)"));
  assert.ok(c.includes('className="flex flex-col gap-1 text-small text-text-soft"'));
  assert.match(read("src/lib/katalog/shopListeCopy.js"), /inklMwst: "inkl\. \{satz\} % USt\., zzgl\. Versand"/);
  assert.doesNotMatch(read("src/lib/shop/copy.js"), /subtotalNote: "inkl\. MwSt\./);
});

test("Mini-Warenkorb: Zeile sofort aus den Seitendaten, USt. in eigener Zeile", () => {
  const m = read("src/components/Shop/MiniCart.js");
  assert.ok(m.includes("data-shop-minicart-vorschau"));
  assert.ok(m.includes("!ready && cart.length > 0 && !added.vorschau"));
  assert.ok(m.includes('<span className="block">'));
  const kb = read("src/components/Katalog/KaufBox.js");
  assert.ok(kb.includes("vorschau && v && result.added > 0"));
  assert.match(read("src/components/Katalog/ReservierenSlot.js"), /vorschau=\{\{ name: p\.name, marke: marke\.name, bild \}\}/);
});

test("Markenseite im Shop: eigener Lead ohne „Lieferung und Montage“", async () => {
  const { shopListeCopy } = await import("../../src/lib/katalog/shopListeCopy.js");
  for (const l of ["de", "en", "fr", "it"]) {
    const t = shopListeCopy(l).markeLead;
    assert.ok(t.includes("{marke}"), l);
    assert.doesNotMatch(t, /Montage|install|montage|montaggio/i, l);
  }
  assert.ok(read("src/components/Katalog/AccessoiresListe.js").includes('copy.markeLead.replace("{marke}", marke.name)'));
});

test("Produktseite: Zalto-Bühne 5:4, nie breiter als die Bildpixel", () => {
  const d = read("src/components/Katalog/ShopProduktDetail.js");
  assert.ok(d.includes('studioFassung(b.src, p.marke, "5x4")'));
  assert.ok(d.includes("const buehneMax = erstes ? Math.round(Math.max(erstes.width, erstes.height * buehne)) : null;"));
});

// Optik-QA r2 → Fixes (01.11.2026, zweite Runde)
test("Kachel: Studiomarken (Zalto) ohne Hover-Bild – kein schmales 2:3-Foto beim Überfahren", () => {
  const k = read("src/components/Katalog/ShopKachel.js");
  assert.ok(k.includes("const hover = STUDIO_FOND.has(e.m) ? null : bildSrc(e, e.j?.[0]);"));
});

test("Produktseite: Bühne auf Telefonen 36svh, auf 2x-Tablets höchstens halbe Bildbreite, Galerie klebt", () => {
  const d = read("src/components/Katalog/ShopProduktDetail.js");
  assert.ok(d.includes("max-sm:[&_.snap-center]:max-h-[36svh]"));
  assert.ok(d.includes("lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:col-span-7 lg:self-start"), "Galerie klebt (Optik-QA r3)");
  assert.ok(d.includes("md:[@media(min-resolution:2dppx)]:max-w-(--buehne-max-2x)"));
  assert.ok(d.includes('"--buehne-max-2x": `${Math.round(buehneMax / 2)}px`'));
});

test("Shop-Startseite: Marken ohne Händlersatz bekommen nur einen Quellenhinweis", async () => {
  const { startCopy } = await import("../../src/lib/shop/startCopy.js");
  for (const l of ["de", "en", "fr", "it"]) {
    const t = startCopy(l).markenOhneHaendler("Spiegelau und Nachtmann");
    assert.ok(t.startsWith("Spiegelau und Nachtmann"), l);
    assert.doesNotMatch(t, /Händler|dealer|revendeur|rivenditore|offiziell|official/i, l);
  }
  const s = read("src/components/ShopStart/ShopStartseite.js");
  assert.ok(s.includes("marken.filter((m) => !m.dealer).map((m) => m.name)"));
  assert.ok(s.includes("data-shop-ohne-haendler"));
});
