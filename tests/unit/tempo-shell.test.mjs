// tests/unit/tempo-shell.test.mjs – Tempo-Runde Shell (30.10.2026,
// qa-screenshots/tempo/shell.md): less JavaScript and RSC payload on EVERY page.
//
// 1. Shell icons (ui/icons.js) render the same markup as lucide-react.
// 2. The statically loaded shell islands reach no lucide-react, no ui barrel
//    (→ Breadcrumbs → menuTrail → features → showroom/claims), no brandPaths,
//    no WhatsApp copy table / notice and no wizard logic (beratungContext).
// 3. pathContext.js is the same code beratungContext.js re-exports.
// 4. WhatsApp trigger texts come from the server, complete in four languages;
//    the notice is a lazy chunk.
// 5. Client messages: Shell.nav/menu/ctaBar and error404 stay on the server,
//    the keys of the one client reader (BareShell) stay in the client copy.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as lucide from "lucide-react";
import * as icons from "../../src/components/ui/icons.js";
import * as pathContext from "../../src/lib/forms/pathContext.js";
import * as beratung from "../../src/lib/forms/beratungContext.js";
import { pickClientMessages } from "../../src/components/Reusable/clientMessages.js";
import { whatsappCopy } from "../../src/lib/whatsapp/copy.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SRC = path.join(ROOT, "src");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const code = (p) => read(p).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

test("1 Shell-Icons: gleiches Markup wie lucide-react", () => {
  const names = Object.keys(icons);
  assert.ok(names.length >= 11, names.join());
  const variants = [
    { "aria-hidden": "true", className: "size-5", strokeWidth: 1.5 },
    { className: "ph-arrow size-4 shrink-0", strokeWidth: 1.5 },
    {},
  ];
  for (const name of names) {
    assert.ok(lucide[name], `lucide-react kennt ${name}`);
    for (const props of variants) {
      assert.equal(
        renderToStaticMarkup(createElement(icons[name], props)),
        renderToStaticMarkup(createElement(lucide[name], props)),
        `${name} ${JSON.stringify(props)}`
      );
    }
  }
});

// Static import graph (no import()) from the shell's client islands.
const SHELL_ISLANDS = [
  "app/[locale]/LoaderWrapper.js",
  "app/[locale]/client-layout.js",
  "components/Navbar/HeaderFrame.js",
  "components/Navbar/DesktopNav.js",
  "components/Navbar/SearchDialog.js",
  "components/Navbar/SelectionLink.js",
  "components/Navbar/CartLink.js", // Warenkorb-Symbol (nur bei shopActive(), Shop-Team 31.10.2026)
  "components/Navbar/LanguageSwitcher.js",
  "components/Navbar/MobileMenu.js",
  "components/Navbar/HeaderCta.js",
  "components/Pinterest/IdeenboardNavLink.js",
  "components/Reusable/LinkDelegate.js",
  "components/Reusable/MobileCtaBar.js",
  "components/Reusable/FooterIslands.js",
  "components/Forms/TerminContextLink.js",
  "components/WhatsApp/WhatsAppEntry.js",
];
const STATIC_IMPORT = /(?:^|\n)\s*(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|(?:^|\n)\s*import\s*['"]([^'"]+)['"]/g;
function resolve(from, spec) {
  let base;
  if (spec.startsWith("@/")) base = path.join(SRC, spec.slice(2));
  else if (spec.startsWith(".")) base = path.resolve(path.dirname(from), spec);
  else return { pkg: spec };
  for (const e of ["", ".js", ".mjs", "/index.js"]) {
    const p = base + e;
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return { file: p };
  }
  return {};
}
function shellGraph() {
  const files = new Set();
  const pkgs = new Set();
  const stack = SHELL_ISLANDS.map((f) => path.join(SRC, f));
  while (stack.length) {
    const f = stack.pop();
    if (files.has(f) || /\.(css|json)$/.test(f)) continue;
    files.add(f);
    for (const m of fs.readFileSync(f, "utf8").matchAll(STATIC_IMPORT)) {
      const r = resolve(f, m[1] || m[2]);
      if (r.file) stack.push(r.file);
      if (r.pkg) pkgs.add(r.pkg);
    }
  }
  return { files: [...files].map((f) => path.relative(SRC, f).replaceAll("\\", "/")), pkgs: [...pkgs] };
}

test("2 Shell-Inseln: kein lucide-react, kein ui-Barrel, keine Wortmarken-Pfade, keine WhatsApp-Tabelle", () => {
  for (const f of SHELL_ISLANDS) assert.ok(fs.existsSync(path.join(SRC, f)), f);
  const { files, pkgs } = shellGraph();
  assert.ok(files.length > 25, `graph too small (${files.length})`);
  assert.ok(!pkgs.some((p) => p.startsWith("lucide-react")), pkgs.join());
  for (const bad of [
    "components/ui/index.js",
    "components/ui/Breadcrumbs.js",
    "components/ui/menuTrail.js",
    "lib/features.js",
    "lib/showroom/config.js",
    "lib/legal/claims.js",
    "components/Brand/brandPaths.js",
    "components/Brand/index.js",
    "lib/whatsapp/copy.js",
    "lib/whatsapp/link.js",
    "components/WhatsApp/WhatsAppHint.js",
    "lib/forms/beratungContext.js",
  ]) {
    assert.ok(!files.includes(bad), `${bad} im sofort geladenen Shell-Graph`);
  }
  // still there: the small modules they need
  for (const ok of ["lib/forms/pathContext.js", "components/ui/icons.js", "components/ui/Button.js"]) assert.ok(files.includes(ok), ok);
  // ui primitives on every page draw the arrow without lucide-react too
  for (const f of ["src/components/ui/Button.js", "src/components/ui/LinkArrow.js"]) {
    assert.match(read(f), /import \{ ArrowRight \} from "\.\/icons";/, f);
  }
});

test("2b Mobile-Menü: Wortmarke als Server-Slot (Sprite), nicht aus Brand im Client", () => {
  assert.match(code("src/components/Navbar/navbar.js"), /<MobileMenu rooms=\{navRooms\}[^>]*wordmark=\{<Wordmark className="[^"]*" decorative sprite \/>\}/);
  const menu = code("src/components/Navbar/MobileMenu.js");
  assert.doesNotMatch(menu, /@\/components\/Brand/);
  // QM shell-home r3: der Slot steht in einer Hülle mit der Breite der Kopfzeilen-Wortmarke.
  assert.match(menu, /\{ready && <span className="block w-full max-w-\(--ph-logo-w,213px\)">\{wordmark\}<\/span>\}/);
});

test("3 pathContext.js = die Funktionen, die beratungContext.js weiterreicht", () => {
  for (const k of ["contextForPath", "withContext", "cleanText", "CITY_NAMES"]) {
    assert.ok(pathContext[k], k);
    assert.equal(beratung[k], pathContext[k], k);
  }
  assert.doesNotMatch(read("src/lib/forms/pathContext.js"), /from "@\//);
  assert.deepEqual(pathContext.contextForPath("/sofaplaner"), { thema: "sofa", planer: "sofaplaner" });
  assert.equal(pathContext.withContext("/beratung", pathContext.contextForPath("/designermoebel-st-gallen")), "/beratung?ort=st-gallen");
});

test("4 WhatsApp: Auslöser-Texte vom Server (4 Sprachen), Hinweis als eigener Chunk", async () => {
  // index.js is JSX (Server Component) – read the key list from the source.
  const index = read("src/components/WhatsApp/index.js");
  const keys = [...index.match(/ENTRY_LABEL_KEYS = Object\.freeze\(\[([\s\S]*?)\]\)/)[1].matchAll(/"(\w+)"/g)].map((m) => m[1]);
  const used = new Set([
    ...[...read("src/components/WhatsApp/WhatsAppEntry.js").matchAll(/\bt\.(\w+)/g)].map((m) => m[1]),
    ...[...read("src/components/Reusable/MobileCtaBar.js").matchAll(/\bwa\.(\w+)/g)].map((m) => m[1]).filter((k) => k !== "me"),
  ]);
  for (const k of used) assert.ok(keys.includes(k), `Label ${k} fehlt in ENTRY_LABEL_KEYS`);
  for (const l of ["de", "en", "fr", "it"]) {
    for (const k of keys) assert.ok(typeof whatsappCopy(l)[k] === "string" && whatsappCopy(l)[k].length > 0, `${l}.${k}`);
  }
  assert.match(index, /labels: whatsappLabels\(locale\)/);
  for (const f of ["src/components/WhatsApp/WhatsAppEntry.js", "src/components/Reusable/MobileCtaBar.js"]) {
    const src = code(f);
    assert.doesNotMatch(src, /whatsappCopy|from "@\/lib\/whatsapp\/copy"/, f);
    assert.doesNotMatch(src, /^import WhatsAppHint/m, f);
    assert.match(src, /const WhatsAppHint = dynamic\(loadHint, \{ ssr: false \}\);/, f);
    assert.match(src, /onFocus=\{preloadHint\}/, f);
  }
  // the notice still focuses its title on mount (keyboard flow of whatsapp.spec.js)
  assert.match(read("src/components/WhatsApp/WhatsAppHint.js"), /title\.current\?\.focus\(/);
  await import(pathToFileURL(path.join(SRC, "lib/whatsapp/copy.js")).href);
});

test("5 Client-Messages: Shell nur mit den Schlüsseln der Upload-Shell, error404 nur am Server", () => {
  const bare = read("src/components/Reusable/BareShell.js");
  const bareKeys = [...bare.matchAll(/\bc\("([\w.]+)"/g)].map((m) => m[1]);
  assert.ok(bareKeys.length >= 3, bareKeys.join());
  for (const locale of ["de", "en", "fr", "it"]) {
    const messages = JSON.parse(read(`src/messages/${locale}.json`));
    const client = pickClientMessages(messages);
    for (const k of bareKeys) {
      const v = k.split(".").reduce((o, p) => o?.[p], client.Shell);
      assert.equal(typeof v, "string", `${locale}: Shell.${k}`);
    }
    for (const sub of ["nav", "menu", "ctaBar"]) assert.equal(client.Shell[sub], undefined, `${locale}: Shell.${sub}`);
    assert.equal(client.error404, undefined, `${locale}: error404`);
  }
  // <Breadcrumbs> (Shell.nav) is rendered only by Server Components
  const walk = (dir, out = []) => {
    for (const f of fs.readdirSync(dir)) {
      const p = path.join(dir, f);
      if (fs.statSync(p).isDirectory()) walk(p, out);
      else if (/\.(js|jsx|mjs)$/.test(f)) out.push(p);
    }
    return out;
  };
  const isClient = (s) => /^\s*(?:\/\/[^\n]*\n|\/\*[\s\S]*?\*\/\s*)*['"]use client['"]/.test(s);
  const hits = walk(SRC).filter((f) => {
    const s = fs.readFileSync(f, "utf8");
    return isClient(s) && /<Breadcrumbs\b/.test(s);
  });
  assert.deepEqual(hits.map((f) => path.relative(SRC, f)), []);
});
