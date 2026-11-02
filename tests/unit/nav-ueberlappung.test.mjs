// Nav-Fix 30.10.2026: ab 1536 px überlappten Logo, Menü und Suche, weil die
// Kopfzeile (max-w-page = 1440 px) dort zusätzlich Textlabels für „Ihre Auswahl“
// und „Ideenboard“ sowie breiteres Menü-Padding bekam. Ab 1440 px bleibt die
// Kopfzeile jetzt gleich.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");

test("Kopfzeile zeigt keine Textlabels für Auswahl/Ideenboard", () => {
  const nav = read("src/components/Navbar/navbar.js");
  assert.doesNotMatch(nav, /<SelectionLink[^>]*\bshowLabel\b/);
  assert.doesNotMatch(nav, /<IdeenboardNavLink[^>]*\bshowLabel\b/);
});

test("Menüpunkte werden ab 1536 px nicht breiter", () => {
  assert.doesNotMatch(read("src/components/Navbar/DesktopNav.js"), /2xl:px-/);
});
