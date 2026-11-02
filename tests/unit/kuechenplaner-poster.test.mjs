// R3 (P4-technik): Küchenplaner-CLS (technik P0-1, neuland P1-1), Testszene außerhalb
// von public/ (technik P2-3), globale 404 mehrsprachig (technik P2-4), Stil-Finder-CTA
// und Turbopack-Trace-Warnungen (technik P2-1). Prüft nur Dateien.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Pfade über path, nicht URL: der Ordner %5Ftestszene würde als URL dekodiert.
const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const exists = (p) => fs.existsSync(path.join(ROOT, p));

test("Küchenplaner: Suspense-fallback ist die statische Vorschau, nicht null", () => {
  const gate = read("src/components/Labs/Kuechenplaner/KuechenplanerGate.js");
  assert.match(gate, /<Suspense fallback=\{<KuechenplanerPoster \/>\}>/);
  assert.doesNotMatch(gate, /fallback=\{null\}/);
  const poster = read("src/components/Labs/Kuechenplaner/KuechenplanerPoster.js");
  assert.doesNotMatch(poster, /^"use client"/m);
  assert.match(poster, /aria-busy="true"/);
  // gleiche Höhenklassen wie die Ansicht im Planer
  const app = read("src/components/Labs/Kuechenplaner/KuechenplanerApp.js");
  for (const h of ["h-[calc(clamp(220px,38svh,340px)+68px)] sm:h-[calc(clamp(300px,42svh,460px)+68px)]", "lg:h-[calc(100svh-var(--kp-top)-136px)] lg:min-h-[460px] lg:max-h-[760px]"]) {
    assert.ok(app.includes(h), `Ansicht im Planer: ${h}`);
    assert.ok(poster.includes(h), `Ansicht in der Vorschau: ${h}`);
  }
  assert.ok(app.includes("grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_460px] lg:gap-8"));
  assert.ok(poster.includes("grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_460px] lg:gap-8"));
});

test("Testszene nicht mehr in public/, Route nur im Vorschau-Modus", () => {
  assert.equal(exists("public/showroom/_testszene"), false);
  const route = read("src/app/showroom/%5Ftestszene/[...path]/route.js");
  assert.match(route, /if \(showroomMode\(\) !== "preview"\) return notFound\(\);/);
  assert.match(route, /"Cache-Control": "no-store"/);
  assert.match(route, /\.data", "showroom", "_testszene"/);
});

test("globale 404: Inhalt in allen vier Sprachen mit lang, Boot-Skript setzt html[lang]", () => {
  const nf = read("src/app/not-found.js");
  assert.match(nf, /<html lang="de"/);
  assert.match(nf, /NF_BOOT_SCRIPT/);
  assert.doesNotMatch(nf, /from "next\/headers"/);
  const loc = read("src/components/NotFound/NotFoundLocales.js");
  assert.match(loc, /lang=\{locale\} data-nf-block=\{locale\}/);
  assert.match(read("src/components/NotFound/boot.js"), /h\.lang=l/);
  const css = read("src/app/globals.css");
  for (const l of ["de", "en", "fr", "it"]) assert.ok(css.includes(`html[data-nf="${l}"] [data-nf-block="${l}"]`), l);
});

test("Stil-Finder: CTA „Termin anfragen“; Laufzeitpfade mit turbopackIgnore", () => {
  const r = read("src/components/Labs/Stilfinder/StilResult.js");
  assert.match(r, /Termin anfragen/);
  assert.doesNotMatch(r, /Termin vereinbaren/);
  for (const f of ["src/lib/stilfinder/images.js", "src/lib/stilfinder/outbox.js"]) {
    const s = read(f);
    assert.doesNotMatch(s, /path\.join\((dir|target),/, f);
    assert.doesNotMatch(s, /fs\.readdir\(dir/, f);
  }
});
