// Rat 9,5 · T5 Recht B5: kein indexierbares Bild mit freigabe=offen auf den
// Seiten, die T5 berührt hat (Presse, Partner, Karriere, Datenschutz,
// Barrierefreiheit). Quelle der Freigaben: Marktresearch/recht/bildrechte.csv.
// Geprüft wird jeder Bildpfad im Quelltext (Komponenten und page.js inkl.
// OG-Bilder); ein Pfad, der in der Liste fehlt, gilt ebenfalls als ungeklärt.
//   node --test tests/unit/rat95-recht-bilder.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
// Quelltext ohne Kommentare (Kommentare dürfen entfernte Dateien nennen).
const code = (f) =>
  read(f)
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");

const T5_PAGES = [
  "src/components/Presse/presse.js",
  "src/components/Presse/pressearticle.js",
  "src/app/[locale]/ueber-uns/presse/page.js",
  "src/components/Partner/partner.js",
  "src/app/[locale]/ueber-uns/partner/page.js",
  "src/components/Karriere/karriere.js",
  "src/components/Karriere/karriereposition.js",
  "src/components/Karriere/JobDetail.js",
  "src/app/[locale]/ueber-uns/karriere/page.js",
  "src/app/[locale]/ueber-uns/karriere/[slug]/page.js",
  "src/components/Datenschutz/datenbanner.js",
  "src/components/Datenschutz/datenschutz.js",
  "src/components/LegalDrafts/dseErgaenzungen.js",
  "src/components/Datenschutz/kurzfassung.js",
  "src/app/[locale]/datenschutz/page.js",
  "src/app/[locale]/barrierefreiheit/page.js",
];

function rights() {
  const rows = read("Marktresearch/recht/bildrechte.csv").replace(/^﻿/, "").split(/\r?\n/).slice(1).filter(Boolean);
  const map = new Map();
  for (const row of rows) {
    const c = row.split(";");
    if (c[2]?.startsWith("/")) map.set(c[2], c[7]);
  }
  return map;
}

const IMAGE_PATH = /["'`](\/(?:Images|labs|images|cms|files)\/[^"'`\s]+\.(?:jpe?g|png|webp|avif|gif|svg))["'`]/gi;

test("berührte Seiten: kein Bild mit freigabe=offen oder ohne Eintrag", () => {
  const map = rights();
  const bad = [];
  for (const f of T5_PAGES) {
    for (const m of read(f).matchAll(IMAGE_PATH)) {
      const status = map.get(m[1]);
      if (!status || /^offen/.test(status)) bad.push(`${f}: ${m[1]} (${status || "nicht in bildrechte.csv"})`);
    }
  }
  assert.deepEqual(bad, []);
});

test("Presse ohne Scans und ohne fremdes Kopfbild; CMS-Bilder nicht mehr als Kopf- oder OG-Bild", () => {
  const presse = code("src/components/Presse/presse.js");
  const liste = read("src/components/Presse/pressearticle.js");
  const page = read("src/app/[locale]/ueber-uns/presse/page.js");
  assert.doesNotMatch(presse, /image=\{|<Media|cool-living-room|black-chair/);
  assert.doesNotMatch(liste, /<Media|<img|src:/);
  assert.match(liste, /data-press-list=""/);
  assert.doesNotMatch(page, /getPressOGImage|heroImage=/);
  // Medium/Ausgabe nur, wo sie auf dem Scan lesbar sind – nichts geschätzt (Stichprobe)
  assert.match(liste, /title: "New Collections", medium: "Vorarlbergerin", issue: "März\/April 2023"/);
  const partner = code("src/components/Partner/partner.js");
  assert.doesNotMatch(partner, /next\/image|logo: "|dinner-area/);
  assert.doesNotMatch(read("src/app/[locale]/ueber-uns/partner/page.js"), /getPartnersOGImage/);
  assert.doesNotMatch(code("src/components/Karriere/karriere.js"), /<Media|heroImage|livingroom-view|unique-workplace/);
});

test("bildrechte.csv: entfernte Bilder als „entfernt“ vermerkt, keine Freigabe eingetragen", () => {
  const map = rights();
  for (const p of ["/Images/Presse/cool-living-room.jpg", "/Images/Presse/mag1.jpg", "/Images/Partner/partner2.png", "/Images/Partner/dinner-area.jpg"]) {
    assert.ok(map.has(p), p);
    assert.match(map.get(p), /^offen/, `${p}: T5 trägt keine Freigabe ein`);
  }
  const csv = read("Marktresearch/recht/bildrechte.csv");
  const row = csv.split(/\r?\n/).find((r) => r.includes(";/Images/Presse/mag1.jpg;"));
  assert.match(row, /entfernt/, "Hinweis-Spalte nennt die Entfernung (Rat 9,5 T5)");
});
