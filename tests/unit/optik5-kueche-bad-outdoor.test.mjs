// tests/unit/optik5-kueche-bad-outdoor.test.mjs – QM-Abnahme Küche/Bad/Outdoor R2 → Fix R3 (02.11.2026).
// Run: node --test tests/unit/optik5-kueche-bad-outdoor.test.mjs
//
// Prüft die Logik der Fixes: Trennen/Binden in Überschriften nur bei zu schmaler Spalte
// (fitParts, Container „fit“), neue Wortfugen (silben.js), E-Mail-Umbruchstellen,
// Versal-Kürzel („DR“), Raster der Räume (looksLayout.js), volle Reihen in der Übersicht.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const load = (rel) => import(pathToFileURL(path.join(ROOT, rel)).href);
const src = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");
const SHY = "­";
const show = (s) => s.replaceAll(SHY, "-");

test("silben R3: Wortfugen Sommer|abend, Hand|skizze, Boden|see, Fugen-s, mindestens 4 Buchstaben hinten", async () => {
  const { hyphenateWord } = await load("src/components/Landing/silben.js");
  const cases = {
    Sommerabend: "Sommer-abend",
    Handskizze: "Hand-skizze",
    Bodensee: "Boden-see",
    Showroom: "Show-room",
    Fachbetriebe: "Fach-betriebe",
    Leistungsaufnahme: "Leis-tungs-aufnahme",
    Filterstandsanzeige: "Filter-stands-anzeige",
    Fassungsvermögen: "Fassungs-vermögen",
    Musterwohnungen: "Muster-woh-nungen",
    Seegrundstücke: "See-grund-stücke",
  };
  for (const [w, want] of Object.entries(cases)) assert.equal(show(hyphenateWord(w)), want, w);
});

test("fitParts: lange Wörter mit Breiten-Klasse, gebundene Gruppen nowrap nur bei Platz", async () => {
  const { fitParts, estimateEm, fitHeading } = await load("src/components/Landing/typoLanding.js");
  const p = fitParts("Hotels einrichten am Bodensee und in den Alpen");
  const gruppe = p.find((x) => x.group);
  assert.ok(gruppe, "„Bodensee und“ ist eine Gruppe");
  assert.match(gruppe.cls, /^whitespace-nowrap @max-\[\d+(\.5)?em\]\/fit:whitespace-normal$/);
  const wort = gruppe.group.find((x) => x.word);
  assert.equal(show(wort.word), "Boden-see");
  assert.match(wort.cls, /^hyphens-none @max-\[\d+(\.5)?em\]\/fit:hyphens-manual$/);
  // Text bleibt Wort für Wort gleich (ohne weiche Trennstellen)
  const flat = (parts) => parts.map((x) => x.text ?? x.word ?? flat(x.group)).join("");
  assert.equal(flat(p).replaceAll(SHY, ""), "Hotels einrichten am Bodensee und in den Alpen");
  // Schwelle wächst mit der Wortlänge
  assert.ok(estimateEm("Ausstattungslinien") > estimateEm("Bodensee"));
  assert.equal(fitParts(undefined), undefined);
  assert.equal(fitHeading(undefined), undefined);
  // Klassen stehen als Literale im Quelltext (Tailwind-Scanner)
  const t = src("src/components/Landing/typoLanding.js");
  assert.match(t, /"hyphens-none @max-\[5em\]\/fit:hyphens-manual"/);
  assert.match(t, /"whitespace-nowrap @max-\[7em\]\/fit:whitespace-normal"/);
  assert.match(t, /createElement\("span", \{ className: "block @container\/fit" \}/);
});

test("mailText: Umbruchstellen nach @ und vor der Endung", async () => {
  const { mailText } = await load("src/components/Landing/typoLanding.js");
  const out = mailText("info@platzhirsch.studio");
  const text = out.map((x) => (typeof x === "string" ? x : "|")).join("");
  assert.equal(text, "info@|platzhirsch|.studio");
  assert.equal(mailText("kein-mail"), "kein-mail");
});

test("anzeigeName R3: Kürzel ohne Vokal bleiben, Versalwörter in gemischten Namen", async () => {
  const { anzeigeName } = await load("src/components/Katalog/produktTitel.js");
  assert.equal(anzeigeName("DR", { name: "Agape", slug: "agape" }), "DR");
  assert.equal(anzeigeName("ROSE RED", { slug: "soleum" }), "Rose Red");
  assert.equal(anzeigeName("SQUARE Hammam Day Bed", { slug: "naggura" }), "Square Hammam Day Bed");
  assert.equal(anzeigeName("Ikon Acoustic Square (SET OF 4)", { slug: "naggura" }), "Ikon Acoustic Square (Set of 4)");
  assert.equal(anzeigeName("Ikon Shelf LED", { slug: "naggura" }), "Ikon Shelf LED");
  assert.equal(anzeigeName("BORA X Pure", { name: "BORA", slug: "bora" }), "X Pure");
});

test("looksLayout: Querformat über zwei Spalten, Hochformat 4:5; Namen mit Kategorie gegen das Sortiment", async () => {
  const { lookRaster, lookName } = await load("src/components/Katalog/looksLayout.js");
  const r = lookRaster([{ width: 1000, height: 1500 }, { width: 1600, height: 1000 }, { width: 900, height: 1400 }]);
  assert.equal(r.hoch, true);
  // QM R4: Rahmen im Fotoformat am Handy, ab sm 2:3 bzw. 4:3 über zwei Spalten
  assert.equal(r.zellen[0].rahmen, "aspect-(--look-ar) sm:aspect-2/3");
  assert.deepEqual(r.zellen[0].style, { "--look-ar": "1000 / 1500" });
  assert.equal(r.zellen[0].bild, "object-cover");
  assert.equal(r.zellen[1].li, "sm:col-span-2");
  assert.match(r.zellen[1].rahmen, /sm:aspect-4\/3/);
  // 1600 × 1000 = 1,6 weicht > 15 % von 4:3 ab → ab sm ganz sichtbar (contain)
  assert.equal(r.zellen[1].bild, "object-cover sm:object-contain");
  // 900 × 1400 = 0,643 liegt nahe 2:3 → füllt
  assert.equal(r.zellen[2].bild, "object-cover");
  assert.match(r.ul, /grid-flow-dense/);
  const quer = lookRaster([{ width: 1600, height: 1000 }]);
  assert.equal(quer.hoch, false);
  assert.equal(quer.zellen[0].einzelFigur, "lg:col-span-7");
  const sortiment = [{ slug: "a", name: "Memory" }, { slug: "b", name: "Memory" }];
  const kat = (k) => ({ spiegel: "Spiegel" })[k];
  assert.equal(lookName({ slug: "a", name: "Memory", marke: "agape", kategorie: "spiegel" }, { markeName: "Agape", markenName: "Agape", sortiment, kategorie: kat }), "Memory (Spiegel)");
  assert.equal(lookName({ slug: "c", name: "Cenote", marke: "agape" }, { markeName: "Agape", markenName: "Agape", sortiment, kategorie: kat }), "Cenote");
});

test("Übersicht: je Kategorie nur volle Reihen (lg 3, darunter 4 bzw. 2)", async () => {
  const { uebersichtSichtbar: s } = await load("src/components/Katalog/uebersichtRaster.js");
  assert.equal(s(0, 6), "");
  assert.equal(s(3, 6), "lg:hidden");
  assert.equal(s(4, 6), "max-lg:hidden lg:hidden");
  assert.equal(s(2, 3), "max-lg:hidden");
  assert.equal(s(1, 2), "");
  assert.equal(s(0, 1), "");
});

test("Quelltext R3: Seiten-Container, Raster in rem, Ortsseiten-Block vor dem CTA", () => {
  const typo = src("src/components/Landing/typoLanding.js");
  assert.match(typo, /export const PAGE_HY = "@container\/page md:wrap-break-word"/);
  assert.match(typo, /export const ARROW_INLINE = "block! min-h-0! py-2\.5/);
  assert.match(src("src/components/Landing/landingPage.js"), /@min-\[40rem\]\/page:grid-cols-2 @5xl\/page:grid-cols-4/);
  assert.match(src("src/components/Landing/Outdoor/OutdoorLanding.js"), /@5xl\/page:grid-cols-5/);
  assert.match(src("src/components/Landing/landingPage.js"), /\{beforeClosing\}\n\n      <LandingClosing/);
  for (const c of ["bregenz", "dornbirn", "friedrichshafen", "lindau", "st-gallen"]) {
    assert.match(src(`src/app/[locale]/designermoebel-${c}/page.js`), /beforeClosing=\{<OrtsMarken path=\{PATH\} \/>\}/, c);
  }
  assert.match(src("src/components/Hotel/HotelPage.js"), /snap-x scroll-px-gutter/);
  assert.match(src("src/components/Katalog/ProduktDetail.js"), /<BildZoom /);
  // Gruppenname ohne Klammerzusatz vor dem Wert („Ausführung: …“)
  assert.ok(src("src/components/Katalog/Konfigurator.js").includes('{z.name.replace(/\\s*\\(.*\\)$/u, "")}:</dt>'));
});

test("R4: Wellness-Marken 3 + 2 füllen die Reihe; Gedankenstrich in der Grundschrift", async () => {
  const { reihenSpan } = await load("src/components/BadWellness/brandFrame.js");
  assert.deepEqual([0, 1, 2, 3, 4].map((i) => reihenSpan(i, 5)), ["@5xl/page:col-span-2", "@5xl/page:col-span-2", "@5xl/page:col-span-2", "@5xl/page:col-span-3", "@5xl/page:col-span-3"]);
  assert.equal(reihenSpan(3, 4), "@5xl/page:col-span-2");
  assert.equal(reihenSpan(2, 3), "@5xl/page:col-span-2");
  const { fitHeading, DASH_CLASS } = await load("src/components/Landing/typoLanding.js");
  const el = fitHeading("Bad – das tägliche Ritual");
  const alle = (n) => (Array.isArray(n) ? n.flatMap(alle) : n && typeof n === "object" ? [n, ...alle(n.props?.children)] : []);
  const strich = alle(el).find((k) => k.props?.children === "–");
  assert.ok(strich, "Strich als eigenes span");
  assert.equal(strich.props.className, DASH_CLASS);
});

test("R4: Kachelbild TARA Küche = Freisteller auf Weiß (Bild 1), sonst Dornbracht Bild 2", async () => {
  const { kachelBild } = await load("src/components/Katalog/kachelBild.js");
  const b = (n) => ({ src: `/x-${n}.webp`, width: 1600, height: 1600 });
  assert.equal(kachelBild({ slug: "dornbracht-tara-kueche", marke: "dornbracht", bilder: [b(1), b(2), b(3)] }).src, "/x-1.webp");
  assert.equal(kachelBild({ slug: "dornbracht-vaia", marke: "dornbracht", bilder: [b(1), b(2), b(3)] }).src, "/x-2.webp");
});
