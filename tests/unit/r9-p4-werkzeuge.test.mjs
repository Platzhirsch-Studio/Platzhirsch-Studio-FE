// Runde 5, Fix-Team P4 (Werkzeuge): Küchenplaner-Poster als LCP-Bild, Yacht-Seitengewicht
// (Konzept-Reiter 2–6 nachgeladen, keine Produkt-Wiederholung), Bodensee-Licht-Poster
// als AVIF + WebP mit Kennzeichnung, 3D-Ansicht ohne Draht-Quader, Sofaplaner-Satz-H1
// und Draufsicht, Ezarri-Hub mit Markenname und nur indexierbaren Mosaik-Links.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { POSTER_BREITEN, POSTER_SZENEN, POSTER_STUNDEN, POSTER_TAGE, posterDatei, posterFuer } from "../../src/lib/licht/poster.js";
import { SOURCE_COPY } from "../../src/lib/sofaplaner/consent.js";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const exists = (p) => fs.existsSync(path.join(ROOT, p));

test("Küchenplaner: Poster zeigt ein echtes Bild (AVIF/WebP, fetchPriority high), Dateien vorhanden und klein", () => {
  const poster = read("src/components/Labs/Kuechenplaner/KuechenplanerPoster.js");
  assert.match(poster, /fetchPriority="high"/);
  assert.match(poster, /type="image\/avif"/);
  assert.doesNotMatch(poster, /^"use client"/m);
  for (const w of [480, 800, 1200]) {
    for (const ext of ["avif", "webp"]) {
      const f = `public/labs/kuechenplaner/poster/kueche-3d-${w}.${ext}`;
      assert.ok(exists(f), f);
      assert.ok(fs.statSync(path.join(ROOT, f)).size < 60_000, `${f} < 60 KB`);
    }
  }
  // 3D bleibt hinter der Interaktion
  assert.match(read("src/components/Labs/Kuechenplaner/Viewer.js"), /dynamic\(\(\) => import\("\.\/Scene3D"\), \{ ssr: false/);
});

test("Yacht: nur das erste Konzept im Server-HTML, die übrigen per import(); keine Produktreihen in den Konzepten", () => {
  const gallery = read("src/components/Yacht/ConceptGallery.js");
  assert.match(gallery, /<Concept c=\{concepts\[0\]\} \/>/);
  assert.doesNotMatch(gallery, /ProductTile|ZoneProducts/);
  const tabs = read("src/components/Yacht/ConceptTabs.js");
  assert.match(tabs, /import\("@\/lib\/yacht\/conceptPanels"\)/);
  assert.match(tabs, /aria-busy=/);
  const panels = read("src/lib/yacht/conceptPanels.js");
  assert.doesNotMatch(panels, /server-only|catalog/);
  assert.match(panels, /superyacht/);
  // Navetta-/Custom-Line-Bilder nur mit Freigabe – liegt seit Inhaber-Entscheidung Nr. 11 (29.10.2026) vor
  assert.match(read("src/lib/yacht/navetta.js"), /NAVETTA_RELEASED = true/);
});

test("Bodensee-Licht: Poster-Sequenz vollständig als AVIF und WebP, <picture> mit Kennzeichnung", () => {
  let n = 0;
  for (const s of POSTER_SZENEN) for (const t of POSTER_TAGE) for (const h of POSTER_STUNDEN) for (const b of POSTER_BREITEN) {
    for (const fmt of ["webp", "avif"]) {
      const f = path.join("public", posterDatei(s, t.id, h, b, fmt));
      assert.ok(exists(f), f);
      n++;
    }
  }
  assert.equal(n, 2 * 3 * 16 * 3 * 2);
  const p = posterFuer({ szene: "kueche", ort: "lochau", fenster: 225, datum: "2026-06-21", minuten: 600 });
  assert.match(p.avifSrcSet, /kueche-juni-10-1280\.avif 1280w/);
  assert.match(p.text, /^Berechnete Darstellung, kein Foto/);
  const seite = read("src/components/Licht/LichtSeite.js");
  assert.match(seite, /<source type="image\/avif" srcSet=\{poster\.avifSrcSet\}/);
  assert.match(seite, /Visualisierung · berechnet/);
  const szene = read("src/components/Licht/LichtSzene.js");
  assert.match(szene, /function Seeblick/);
  assert.match(szene, /putzTextur\(\)/);
  assert.match(szene, /leinenTextur\(\)/);
});

test("3D-Ansicht: Einstieg ist der Raumbedarf im Grundriss, kein Draht-Quader, kein „echtes Modell“", () => {
  const page = read("src/app/[locale]/3d-ansicht/page.js");
  assert.match(page, /lota-raumbedarf-grundriss\.svg/);
  assert.doesNotMatch(page, /src=\{item\.poster\}/);
  assert.ok(exists("public/labs/ar-viewer/raum/lota-raumbedarf-grundriss.svg"));
  const beispiel = page.slice(page.indexOf("function Beispiel"), page.indexOf("const FOCUS"));
  assert.doesNotMatch(beispiel, /echte[sn]? 3D-Modell/);
  assert.match(beispiel, /Raumbedarf in Originalgröße/);
});

test("Sofaplaner: H1 als Satz ohne Minotti-Werbung, Draufsicht in der rechten Spalte", () => {
  assert.equal(SOURCE_COPY.h1Satz, "Ihr Sofa, Modul für Modul geplant.");
  assert.doesNotMatch(SOURCE_COPY.h1Satz, /Minotti/);
  const page = read("src/app/[locale]/sofaplaner/page.js");
  assert.match(page, /<h1 className=\{s\.h1\}>\{SOURCE_COPY\.h1Satz\}<\/h1>/);
  assert.match(page, /<Draufsicht /);
  assert.doesNotMatch(read("src/components/Labs/Sofaplaner/Draufsicht.js"), /Minotti|<img/);
});

test("Ezarri: Hub-H1 mit Markenname, hervorgehobene Mosaike bevorzugt indexierbar, noindex-Mosaike ohne Link", () => {
  assert.match(read("src/lib/ezarri/copy.js"), /title: "Ezarri-Glasmosaik für Pool, Bad und Wellness"/);
  const data = read("src/lib/ezarri/data.js");
  assert.match(data, /isIndexableMosaik\(c\.id\) \? 1000 : 0/);
  assert.match(data, /indexierbar: isIndexableMosaik\(c\.id\)/);
  assert.match(read("src/components/Ezarri/Welt/Sections.js"), /m\.indexierbar === false \?/);
});
