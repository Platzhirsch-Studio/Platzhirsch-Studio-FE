// tests/unit/concierge-launcher-size.test.mjs — KI-Concierge seitenweit: Budget.
// Run: node --test tests/unit/concierge-launcher-size.test.mjs
// Until size-limit is installed (Design-Bibel §13) the launcher source is
// measured: no heavy imports, gzip of launcher + flags + CSS ≤ 5 KB (target
// 3 KB). The panel must only be loaded with import().
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const strip = (s) =>
  s
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(/\n\s+/g, "\n");

test("Launcher: keine schweren Imports, Panel nur per import()", () => {
  const src = read("src/components/Concierge/Launcher.js");
  for (const bad of ["lucide-react", "motion", "next-intl", "framer-motion", "@/context/CartContext"]) {
    assert.ok(!new RegExp(`from ["']${bad}`).test(src), bad);
  }
  assert.doesNotMatch(src, /^import .*\.\/Panel/m);
  assert.match(src, /import\("\.\/Panel"\)/);
  assert.doesNotMatch(read("src/components/Concierge/flags.js"), /^import /m, "flags.js hat keine Imports");
});

test("Launcher: gzip ≤ 5 KB (Quelle ohne Kommentare)", () => {
  const files = ["src/components/Concierge/Launcher.js", "src/components/Concierge/flags.js", "src/components/Concierge/launcher.module.css"];
  const size = zlib.gzipSync(files.map((f) => strip(read(f))).join("\n"), { level: 9 }).length;
  console.log(`launcher source gzip: ${size} B`);
  assert.ok(size <= 5 * 1024, `${size} B`);
});

test("client-layout: Schalter inline, Launcher nach Leerlauf, nicht im Upload-Shell", () => {
  const cl = read("src/app/[locale]/client-layout.js");
  // Integration 28.10.2026 (Inhaber-Entscheidung Nr. 9): standardmäßig AN, nur "0" schaltet ab.
  assert.match(cl, /process\.env\.NEXT_PUBLIC_CONCIERGE_SITEWIDE !== '0'\s*\?/);
  assert.doesNotMatch(cl, /NEXT_PUBLIC_CONCIERGE_SITEWIDE === '1'/);
  assert.match(cl, /dynamic\(\(\) => import\('@\/components\/Concierge\/Launcher'\), \{ ssr: false \}\)/);
  assert.match(cl, /\{consentReady && ConciergeLauncher && <ConciergeLauncher/);
  // The existing pins stay (r6-shell-perf, r4-shell).
  assert.match(cl, /\{consentReady && <CookieComponent \/>\}/);
  assert.match(cl, /const BARE_ROUTES = \['upload'\]/);
});

test("Launcher: Z-Ebene 44 unter der CTA-Leiste, 48 px, ruhig", () => {
  const css = read("src/components/Concierge/launcher.module.css");
  assert.match(css, /z-index: 44;/);
  assert.match(css, /height: 48px;/);
  assert.doesNotMatch(css, /animation:/, "keine Eintritts- oder Puls-Animation");
  assert.doesNotMatch(css, /border-radius/);
});
