// R4-shell-perf: contracts of the lighter shell.
//   node --test tests/unit/r4-shell.test.mjs
// 1. Client messages: no namespace on the server-only deny-list is read by a
//    module that runs in the browser (walks every import reachable from a
//    "use client" file). Fails as soon as someone starts using one of them
//    client-side – then take it off SERVER_ONLY_NAMESPACES.
// 2. Header/footer are Server Components, islands get their texts as props
//    (no shellCopy/shellNav in the eagerly loaded client graph).
// 3. Kern building block; PageHeader LCP props;
//    footer accordions; skip links; one-hop proxy redirect.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SERVER_ONLY_NAMESPACES, SERVER_ONLY_SUBKEYS, pickClientMessages } from "../../src/components/Reusable/clientMessages.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SRC = path.join(root, "src");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

function walk(dir, out = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(js|jsx|mjs)$/.test(f)) out.push(p);
  }
  return out;
}
const EXTS = ["", ".js", ".jsx", ".mjs", "/index.js"];
function resolveImport(from, spec) {
  let base;
  if (spec.startsWith("@/")) base = path.join(SRC, spec.slice(2));
  else if (spec.startsWith(".")) base = path.resolve(path.dirname(from), spec);
  else return null;
  for (const e of EXTS) {
    const p = base + e;
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
  }
  return null;
}
const STATIC_IMPORT = /(?:^|\n)\s*(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|(?:^|\n)\s*import\s*['"]([^'"]+)['"]/g;
const DYNAMIC_IMPORT = /import\(\s*['"]([^'"]+)['"]\s*\)/g;
const isClient = (src) => /^\s*(?:\/\/[^\n]*\n|\/\*[\s\S]*?\*\/\s*)*['"]use client['"]/.test(src);

/** Modules reachable from "use client" files (dynamic imports optional). */
function clientGraph({ dynamic, skipRoots = [] }) {
  const files = walk(SRC);
  const seen = new Set();
  const skip = skipRoots.map((r) => path.join(SRC, r));
  const stack = files.filter((f) => !skip.includes(f) && isClient(fs.readFileSync(f, "utf8")));
  while (stack.length) {
    const f = stack.pop();
    if (seen.has(f)) continue;
    seen.add(f);
    const s = fs.readFileSync(f, "utf8");
    const specs = [...s.matchAll(STATIC_IMPORT)].map((m) => m[1] || m[2]);
    if (dynamic) specs.push(...[...s.matchAll(DYNAMIC_IMPORT)].map((m) => m[1]));
    for (const spec of specs) {
      const r = resolveImport(f, spec);
      if (r && !r.includes(`${path.sep}messages${path.sep}`)) stack.push(r);
    }
  }
  return seen;
}

// F5 (Runde 1): precise read check. The former test flagged ANY quoted word
// equal to a namespace ("Home" as a breadcrumb label, "ezarri" as a route id),
// so big namespaces read only on the server (Upload, ezarri, Arbeitsweise …)
// could not leave the client copy. A namespace counts as read in the browser
// when a client module names it as a namespace (useTranslations /
// getTranslations / useInhalt / namespace:) or reads a key below it
// ("NS.key", messages.NS, messages["NS"]) – the ways src/ reads messages.
function readsNamespace(src, ns) {
  const q = "['\"`]";
  const patterns = [
    `(?:useTranslations|getTranslations|useInhalt)\\(\\s*${q}${ns}['"\`.]`,
    `namespace:\\s*${q}${ns}['"\`.]`,
    `${q}${ns}\\.[A-Za-z]`,
    `messages\\.${ns}\\b`,
    `messages\\[${q}${ns}${q}\\]`,
  ];
  return new RegExp(patterns.join("|")).test(src);
}

test("Client-Messages: kein Server-only-Namespace in Browser-Modulen", () => {
  const graph = clientGraph({ dynamic: true });
  assert.ok(graph.size > 50, `client graph too small (${graph.size})`);
  const hits = [];
  for (const f of graph) {
    const s = fs.readFileSync(f, "utf8");
    for (const ns of SERVER_ONLY_NAMESPACES) {
      if (readsNamespace(s, ns)) hits.push(`${path.relative(SRC, f)} → ${ns}`);
    }
  }
  assert.deepEqual(hits, [], "Diese Namespaces werden im Browser gelesen – aus SERVER_ONLY_NAMESPACES nehmen");
});

test("Client-Messages: Deny-list greift in allen Sprachen, Rest bleibt vollständig", () => {
  for (const locale of ["de", "en", "fr", "it"]) {
    const messages = JSON.parse(read(`src/messages/${locale}.json`));
    const client = pickClientMessages(messages);
    for (const ns of SERVER_ONLY_NAMESPACES) assert.equal(client[ns], undefined, `${locale}: ${ns}`);
    // Integration 29.10.2026: SERVER_ONLY_SUBKEYS drop keys below a namespace.
    // Konsolidierung 29.10.2026: several subkeys per namespace (Footer:
    // openingHours + tagline). The old Map kept only the LAST sub per
    // namespace, so a second entry made the check fail although
    // pickClientMessages drops both. Same strictness: every listed sub is
    // gone, everything else is identical.
    const dropped = new Map();
    for (const [ns, sub] of SERVER_ONLY_SUBKEYS) dropped.set(ns, [...(dropped.get(ns) || []), sub]);
    for (const key of Object.keys(messages)) {
      if (SERVER_ONLY_NAMESPACES.includes(key)) continue;
      const subs = (dropped.get(key) || []).filter((sub) => messages[key]?.[sub] !== undefined);
      if (subs.length) {
        const rest = { ...messages[key] };
        for (const sub of subs) {
          assert.equal(client[key][sub], undefined, `${locale}: ${key}.${sub}`);
          delete rest[sub];
        }
        assert.deepEqual(client[key], rest, `${locale}: ${key}`);
      } else assert.deepEqual(client[key], messages[key], `${locale}: ${key}`);
    }
    for (const ns of ["Shell", "Cookies", "forms", "Navbar", "cart"]) {
      if (messages[ns]) assert.ok(client[ns], `${locale}: ${ns} fehlt im Client`);
    }
  }
});

test("Shell: Navbar und Footer sind Server Components aus layout.js", () => {
  const layout = read("src/app/[locale]/layout.js");
  assert.match(layout, /header=\{<Navbar /);
  assert.match(layout, /footer=\{<Footer /);
  assert.match(layout, /messages=\{pickClientMessages\(messages\)\}/);
  assert.doesNotMatch(layout, /data-fade-in/, "noscript-Override für das alte FadeInView ist entfallen");
  const client = read("src/app/[locale]/client-layout.js");
  assert.doesNotMatch(client, /from ['"]@\/components\/Navbar\/navbar['"]/);
  assert.doesNotMatch(client, /from ['"]@\/components\/Reusable\/Footer['"]/);
  for (const f of ["src/components/Navbar/navbar.js", "src/components/Reusable/Footer.js"]) {
    assert.ok(!isClient(read(f)), `${f} darf kein "use client" haben`);
  }
});

test("Shell: shellCopy/shellNav nicht im sofort geladenen Client-Graph", () => {
  // BareShell is a client root, but client-layout loads it only via
  // next/dynamic on /<locale>/upload/**.
  const graph = [...clientGraph({ dynamic: false, skipRoots: ["components/Reusable/BareShell.js"] })].map((f) => path.relative(SRC, f).replaceAll("\\", "/"));
  for (const mod of ["components/Navbar/shellCopy.js", "components/Navbar/shellNav.js", "components/Navbar/shellLabels.js"]) {
    assert.ok(!graph.includes(mod), `${mod} wird im Browser geladen`);
  }
  assert.match(read("src/app/[locale]/client-layout.js"), /import\('@\/components\/Cookies\/cookiecomponent'\), \{ ssr: false \}/);
  assert.match(read("src/components/Navbar/SearchDialog.js"), /dynamic\(loadSheet, \{ ssr: false \}\)/);
});

// R6-shell-perf: the FadeInView case is gone with the file (0 readers);
// the reveal CSS it checked is pinned in tests/unit/r6-shell-perf.test.mjs.

test("Kern: Baustein in components/ui, Re-Export am alten Ort", () => {
  assert.match(read("src/components/ui/Kern.js"), /export function kernDisplay/);
  assert.match(read("src/components/ui/index.js"), /Kern, kernDisplay/);
  assert.match(read("src/components/Home/kern.js"), /export \{ kernDisplay \} from "@\/components\/ui\/Kern"/);
});

test("PageHeader: echtes sizes, quality 50, fetchPriority high; Kontakt nutzt das verkleinerte Bild", () => {
  const src = read("src/components/UberUns/PageHeader.js");
  // QM wm-r4: Porträt-Karte (caption) mit q 75, Raumfotos weiter q 50.
  assert.match(src, /quality=\{caption \? 75 : \(image\.quality \?\? 50\)\}/);
  assert.match(src, /fetchPriority="high"/);
  assert.match(src, /calc\(100vw - 40px\)/);
  // Rat 9,5 B5 (bewusst geändert): room-1600.jpg und das Backoffice-Kopfbild
  // haben keine Bildfreigabe (bildrechte.csv freigabe=offen). Kontakt zeigt das
  // freigegebene Hausfoto aboutHome.jpg (Inhaber-Entscheidung Nr. 11);
  // next/image liefert es in der Layoutbreite (sizes/quality oben geprüft).
  const kontakt = read("src/app/[locale]/kontakt/page.js");
  assert.match(kontakt, /\/Images\/Home\/aboutHome\.jpg/);
  assert.doesNotMatch(kontakt, /room-1600\.jpg|getContactOGImage/);
});

test("singlePageSlider: serverfähig, kein Gold-Text, kein priority", () => {
  const src = read("src/components/Reusable/singlePageSlider.js");
  assert.ok(!isClient(src));
  assert.doesNotMatch(src, /className="[^"]*text-gold\b|\spriority\s*$|\spriority\n/m);
  assert.match(src, /<PageHeader/);
});

test("Footer: Linkgruppen als <details>, Links bleiben im HTML, ab 768 px offen", () => {
  const src = read("src/components/Reusable/Footer.js");
  assert.match(src, /<details data-footer-group/);
  assert.match(src, /<summary/);
  assert.match(read("src/app/globals.css"), /details\[data-footer-group\]::details-content/);
  assert.match(read("src/components/Reusable/FooterIslands.js"), /export function FooterGroupsOpen/);
});

test("Skip-Link: volle und schlanke Hülle", () => {
  assert.match(read("src/components/Navbar/navbar.js"), /href="#main"/);
  assert.match(read("src/components/Reusable/BareShell.js"), /href="#main"/);
});

test("Proxy: falschsprachige Unterseiten mit einem Sprung (Probe mit Rückfall)", () => {
  const src = read("src/proxy.js");
  assert.match(src, /async function finalTarget/);
  assert.match(src, /redirect: "manual"/);
  assert.match(src, /x-ph-redirect-probe/);
  assert.match(src, /catch \{\s*return location;/);
  const re = new RegExp(src.match(/const DYNAMIC_TRANSLATED =\s*\/(.+)\/;/)[1]);
  for (const p of ["/en/ueber-uns/marken/minotti/sofas", "/de/about-us/brands/minotti/sofas", "/it/ueber-uns/marken/poliform/letti", "/en/produkte/lamps", "/en/produkte/lamps/lamps-2097-18"]) assert.ok(re.test(p), p);
  // P2-2: pages that never redirect again get no probe (no wait).
  for (const p of ["/fr/ueber-uns/marken/minotti", "/en/ueber-uns/karriere/verkauf", "/en/ueber-uns/marken"]) assert.ok(!re.test(p), p);
  const timeout = Number(src.match(/const PROBE_TIMEOUT_MS = (\d+);/)[1]);
  assert.ok(timeout > 0 && timeout <= 1000, `PROBE_TIMEOUT_MS ${timeout}`);
  for (const p of ["/en/beratung", "/en/ueber-uns/team", "/en/produkte"]) assert.ok(!re.test(p), p);
});
