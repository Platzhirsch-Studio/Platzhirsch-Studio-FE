// Tempo-Runde 30.10.2026, Team Yacht & Ezarri (qa-screenshots/tempo/yacht-ezarri.md):
// nichts, was erst nach dem LCP gebraucht wird, im ersten Bundle; Hero-Szene
// bewegt sich nur über transform/opacity auf HTML-Ebenen.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (f) => readFileSync(new URL(`../../${f}`, import.meta.url), "utf8");

test("Ezarri: LocalNav (Client) importiert keine Text-Module, die NAV kommt vom Server-Layout", () => {
  const nav = read("src/components/Ezarri/Welt/LocalNav.js");
  assert.match(nav, /^"use client";/);
  assert.doesNotMatch(nav, /^import .*["']@\/lib\/ezarri\/(copy|lang)/m);
  assert.match(nav, /export default function LocalNav\(\{ nav: NAV \}\)/);
  const layout = read("src/app/[locale]/ezarri/layout.js");
  // 01.11.2026 (fr/it): NAV aus ezCopy(locale) auf dem Server, Werkzeug-Links mit linkProps.
  assert.match(layout, /const \{ NAV \} = ezCopy\(locale\);/);
  assert.match(layout, /<LocalNav nav=\{nav\} \/>/);
});

test("Yacht: SVG-Aufriss (hull.js) und Embla laden als eigene Chunks, nicht vor dem LCP", () => {
  const hall = read("src/components/Yacht/Werfthalle.js");
  assert.match(hall, /dynamic\(\(\) => import\("\.\/PosterSvg"\), \{ ssr: false/);
  assert.doesNotMatch(hall, /^import PosterSvg/m);
  const carousel = read("src/components/Yacht/NavettaCarousel.js");
  assert.doesNotMatch(carousel, /from "embla-carousel/);
  assert.match(carousel, /dynamic\(\(\) => import\("\.\/EmblaBinder"\), \{ ssr: false/);
});

test("Yacht-Hero: bewegte Teile sind HTML-Ebenen, Keyframes nur transform/opacity (außer Linienzeichnung)", () => {
  const hero = read("src/components/Yacht/YachtHero.js");
  for (const cls of ["glide", "drift", "glow", "reflect", "windows", "horizon"]) {
    assert.match(hero, new RegExp(`<(div|Layer) className=\\{?[^>]*styles\\.${cls}\\b`), cls);
    assert.doesNotMatch(hero, new RegExp(`<g className=\\{styles\\.${cls}\\}`), `${cls} nicht auf einem SVG-<g>`);
  }
  const css = read("src/components/Yacht/yacht.module.css");
  for (const name of ["glide", "drift", "reveal", "glow", "lights"]) {
    const body = css.match(new RegExp(`@keyframes ${name} \\{([\\s\\S]*?)\\n\\}`))?.[1] ?? "";
    assert.ok(body, name);
    const props = [...body.matchAll(/^\s*([a-z-]+):/gm)].map((m) => m[1]);
    assert.ok(props.every((p) => p === "transform" || p === "opacity"), `${name}: ${props}`);
  }
  assert.match(css, /\.scene \{\s*container-type: size;/);
});
