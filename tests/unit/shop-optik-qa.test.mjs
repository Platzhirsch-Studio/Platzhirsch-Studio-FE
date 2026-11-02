// tests/unit/shop-optik-qa.test.mjs — Optik-QA Shop (01.11.2026): kein Umbruch in „20 %“,
// gleiche Kachel auf Startseite/Suche, Herstellerbilder unbeschnitten im Warenkorb.
// Run: node --test tests/unit/shop-optik-qa.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { keinUmbruch } from "../../src/components/Shop/keinUmbruch.js";

const read = (p) => fs.readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");

test("keinUmbruch: Zahl + Leerzeichen + % → schmales geschütztes Leerzeichen", () => {
  assert.equal(keinUmbruch("inkl. 20 % USt."), "inkl. 20 % USt.");
  assert.equal(keinUmbruch("TVA 5,5 % incluse"), "TVA 5,5 % incluse");
  assert.equal(keinUmbruch("incl. 20% VAT"), "incl. 20% VAT", "ohne Leerzeichen unverändert");
  assert.equal(keinUmbruch("a % b"), "a % b", "nur nach Ziffern");
  assert.equal(keinUmbruch(null), "");
  assert.match(read("src/components/Shop/MiniCart.js"), /keinUmbruch\(fill\(c\.inclVatRate/);
});

test("Warenkorb/Mini-Warenkorb: Bilder object-contain, Fläche am Rahmen (nicht am multiplizierten Bild)", () => {
  for (const f of ["src/components/Shop/ShopCart.js", "src/components/Shop/MiniCart.js"]) {
    const src = read(f);
    assert.doesNotMatch(src, /object-cover/, f);
    assert.doesNotMatch(src, /bg-[\w-]+ object-contain[^"]*mix-blend-multiply/, `${f}: Fläche nicht auf dem <img>`);
  }
  assert.match(read("src/components/Shop/ShopCart.js"), /accent-\(--color-ink\)/, "Radios in Token-Farbe statt Browser-Blau");
});

test("Shop-Kachel: Badges ohne Umbruch, Fußblock mit reservierter Zeile, Fläche je Abschnittston", () => {
  const src = read("src/components/Katalog/ShopKachel.js");
  // Optik-QA r3: Badges stehen nicht mehr als Overline auf dem Bild (kein whitespace-nowrap nötig).
  assert.match(src, /min-h-\[1lh\]/);
  assert.match(src, /auf === "raised" \? "bg-surface" : "bg-surface-raised"/);
  assert.match(read("src/components/Katalog/ShopProduktDetail.js"), /kachel\(x, titelTeile\(x\.name\)\.haupt === titel\.haupt && x\.kategorie !== p\.kategorie \? [^\n]*, "raised"\)/);
});

test("Waagrechte Leisten: sichtbarer Ausblend-Hinweis rechts", () => {
  for (const f of ["src/components/ShopStart/ShopSubHeader.js", "src/components/Katalog/AccessoiresListe.js", "src/components/Katalog/ZuletztAngesehen.js"]) {
    assert.match(read(f), /mask-image:linear-gradient\(to_right/, f);
  }
});
