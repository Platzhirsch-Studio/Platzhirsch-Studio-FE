// R7-P4 (Release-Rat R2, neuland P1-3 / Auftrag 8): Solange nur die synthetische
// Testszene im Manifest steht, ist der Showroom-Rundgang in Produktion aus (404),
// nicht in der Sitemap und von keiner Seite aus fest auf die Testszene verlinkt.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { MANIFEST, SHOWROOM_PUBLIC, manifestReady, showroomMode, showroomSitemapPaths } from "../../src/lib/showroom/config.js";

const root = fileURLToPath(new URL("../../", import.meta.url));
function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(js|jsx|mjs)$/.test(f)) out.push(p);
  }
  return out;
}

test("nur Testszene → nicht öffentlich, Produktion 404 (off), keine Sitemap", () => {
  const onlyTest = (MANIFEST.zonen || []).every((z) => String(z.id).startsWith("_"));
  if (!onlyTest) return; // echte Aufnahme liegt vor – dann gilt manifestReady()
  assert.equal(manifestReady().ok, false);
  assert.equal(SHOWROOM_PUBLIC, false);
  assert.equal(showroomMode({ nodeEnv: "production", preview: undefined }), "off");
  assert.deepEqual(showroomSitemapPaths(), []);
});

test("kein Code verlinkt die Testszene direkt (nur das Manifest für die Vorschau)", () => {
  for (const p of [...walk(join(root, "src/app")), ...walk(join(root, "src/components"))]) {
    assert.doesNotMatch(readFileSync(p, "utf8"), /\/showroom\/_testszene/, p);
  }
});

// QM Inhaber-Entscheidung Nr. 7, 02.11.: Showroom-Testszene erst mit echtem Material
// verlinken – EINE Bedingung (showroomSichtbar) für Menü, Startseite/Leistungen,
// Footer und Sitemap; die Seite bleibt in der Vorschau erreichbar (noindex).
test("showroomSichtbar: nur mit echtem Material, nie allein wegen Modus preview", async () => {
  const C = await import("../../src/lib/showroom/config.js");
  assert.equal(C.showroomSichtbar({ mode: "preview", ready: false }), false, "Testszene (dev) nicht verlinken");
  assert.equal(C.showroomSichtbar({ mode: "off", ready: false }), false);
  assert.equal(C.showroomSichtbar({ mode: "off", ready: true }), false, "Schalter aus → kein Link");
  assert.equal(C.showroomSichtbar({ mode: "public", ready: true }), true);
  assert.equal(C.showroomSichtbar({ mode: "preview", ready: true }), true, "echtes Material in der Vorschau → Link");
  const onlyTest = (C.MANIFEST.zonen || []).every((z) => String(z.id).startsWith("_"));
  if (onlyTest) {
    assert.equal(C.showroomSichtbar(), false);
    assert.equal(C.showroomSichtbar({ mode: "preview" }), false, "Dev-Server: Testszene aktiv → keine Links");
    assert.deepEqual(C.showroomSitemapPaths(), []);
  }
});

test("Nr. 7: Menü, Hub, Footer und Sitemap hängen an showroomSichtbar()", async () => {
  const nav = readFileSync(join(root, "src/components/Navbar/shellNav.js"), "utf8");
  assert.match(nav, /showroom = showroomSichtbar\(\)/);
  assert.doesNotMatch(nav, /showroomMode\(\) !== "off"/);
  const feat = readFileSync(join(root, "src/lib/features.js"), "utf8");
  assert.match(feat, /recording = showroomSichtbar\(\)/);
  const footer = readFileSync(join(root, "src/lib/seo/footerLinks.js"), "utf8");
  assert.match(footer, /return showroomSichtbar\(\)/);
  const cfg = readFileSync(join(root, "src/lib/showroom/config.js"), "utf8");
  assert.match(cfg, /showroomSitemapPaths\(isPublic = showroomSichtbar\(\)\)/);
  // Vorschauen verlinken die Seite ebenfalls nur über den Helfer
  for (const p of ["src/app/[locale]/preview/kino-zeichnung/page.js", "src/components/Preview/pinterest/data.js"]) {
    const src = readFileSync(join(root, p), "utf8");
    assert.doesNotMatch(src.replace(/showroomSichtbar\(\) \? "\/de\/showroom"/g, ""), /"\/de\/showroom"/, p);
  }
  // Footer im Zustand "Testszene": /showroom nicht erlaubt
  const { footerLinkAllowed } = await import("../../src/lib/seo/footerLinks.js");
  const C = await import("../../src/lib/showroom/config.js");
  assert.equal(footerLinkAllowed("/de/showroom"), C.showroomSichtbar());
});
