// tests/unit/stripe-bundle.test.mjs — Kein Stripe-Geheimnis im Client-Bundle.
//   1. Importgraph: Keine Client-Komponente ("use client") erreicht – auch
//      nicht über Umwege – src/lib/payments/** oder das Paket "stripe".
//   2. Das Paket "stripe" wird nur in src/lib/payments/gateway.js importiert,
//      der Einstieg der Routen trägt "server-only".
//   3. STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET werden nur in
//      src/lib/payments/config.js und gateway.js gelesen.
//   4. Gebaute Client-Chunks aus .next/dev/static (Dev-Server, Next 16) und
//      .next/static (Build), nur Dateien neuer als package.json: kein
//      "STRIPE_SECRET_KEY", "whsec_", "sk_live_", "sk_test_" u. a. darin.
//   5. package.json pinnt "stripe" exakt.
// Run: node --test tests/unit/stripe-bundle.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const SRC = path.join(ROOT, "src");
const rel = (p) => path.relative(ROOT, p).replace(/\\/g, "/");

const walk = (dir) => (fs.statSync(dir).isDirectory() ? fs.readdirSync(dir).flatMap((n) => walk(path.join(dir, n))) : [dir]);
const SOURCES = walk(SRC).filter((p) => /\.(js|jsx|mjs)$/.test(p));

const IMPORT_RE = /(?:^|\n)\s*(?:import|export)\s[^'"]*?from\s*["']([^"']+)["']|(?:^|\n)\s*import\s*["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g;

function specifiers(file) {
  const code = fs.readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  const out = [];
  let m;
  while ((m = IMPORT_RE.exec(code))) out.push(m[1] || m[2] || m[3]);
  return out;
}

function resolve(from, spec) {
  let base;
  if (spec.startsWith("@/")) base = path.join(SRC, spec.slice(2));
  else if (spec.startsWith(".")) base = path.resolve(path.dirname(from), spec);
  else return { pkg: spec };
  for (const c of [base, `${base}.js`, `${base}.jsx`, `${base}.mjs`, path.join(base, "index.js")]) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return { file: c };
  }
  return { missing: spec };
}

const isClient = (file) => /^\s*(?:\/\/[^\n]*\n|\s)*["']use client["']/.test(fs.readFileSync(file, "utf8"));

test("Client-Komponenten erreichen weder src/lib/payments noch das Paket stripe", () => {
  const clients = SOURCES.filter(isClient);
  assert.ok(clients.length > 20, "Client-Komponenten gefunden");
  const offenders = [];
  for (const entry of clients) {
    const seen = new Set();
    const stack = [{ file: entry, chain: [rel(entry)] }];
    while (stack.length) {
      const { file, chain } = stack.pop();
      if (seen.has(file)) continue;
      seen.add(file);
      for (const spec of specifiers(file)) {
        const r = resolve(file, spec);
        if (r.pkg) {
          if (r.pkg === "stripe" || r.pkg.startsWith("stripe/")) offenders.push([...chain, "stripe"].join(" → "));
          continue;
        }
        if (!r.file) continue;
        const target = rel(r.file);
        if (target.startsWith("src/lib/payments/")) {
          offenders.push([...chain, target].join(" → "));
          continue;
        }
        stack.push({ file: r.file, chain: [...chain, target] });
      }
    }
  }
  assert.deepEqual(offenders, []);
});

test("Paket stripe nur in gateway.js, Routen-Einstieg mit server-only", () => {
  const users = SOURCES.filter((f) => specifiers(f).some((s) => s === "stripe" || s.startsWith("stripe/"))).map(rel);
  assert.deepEqual(users, ["src/lib/payments/gateway.js"]);
  const server = fs.readFileSync(path.join(SRC, "lib/payments/server.js"), "utf8");
  assert.match(server, /^import "server-only";$/m);
  // Routen und Seiten nutzen den server-only-Einstieg, nicht die Einzeldateien mit Stripe.
  for (const f of SOURCES.filter((p) => /src[\\/]app[\\/]/.test(p))) {
    for (const s of specifiers(f)) {
      if (s.startsWith("@/lib/payments/")) assert.ok(["@/lib/payments/server", "@/lib/payments/config"].includes(s), `${rel(f)} importiert ${s}`);
    }
  }
});

test("Geheimnisse werden nur in config.js/gateway.js gelesen", () => {
  const readers = SOURCES.filter((f) => /\bSTRIPE_(SECRET_KEY|WEBHOOK_SECRET)\b/.test(fs.readFileSync(f, "utf8").replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, ""))).map(rel);
  assert.deepEqual(readers.sort(), ["src/lib/payments/config.js", "src/lib/payments/gateway.js"]);
  // Kein NEXT_PUBLIC_-Präfix für Stripe-Geheimnisse.
  for (const f of SOURCES) assert.doesNotMatch(fs.readFileSync(f, "utf8"), /NEXT_PUBLIC_STRIPE_SECRET|NEXT_PUBLIC_STRIPE_WEBHOOK/, rel(f));
});

// Next 16: der Dev-Server schreibt nach .next/dev/static, ein Produktions-
// Build nach .next/static. Beide prüfen, aber nur Chunks, die neuer als
// package.json sind (alte Builds vor der Stripe-Einführung zählen nicht, QA P2-4).
export const CHUNK_DIRS = [path.join(".next", "dev", "static"), path.join(".next", "static")];
export const NEEDLES = ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "PAYMENTS_ADMIN_SECRET", "PAYMENTS_LINK_SECRET", "whsec_", "sk_live_", "sk_test_", "rk_live_", "api.stripe.com", "dev-only-link-secret"];

export function freshChunks(root = ROOT) {
  const since = fs.statSync(path.join(root, "package.json")).mtimeMs;
  const out = [];
  for (const d of CHUNK_DIRS) {
    const dir = path.join(root, d);
    if (!fs.existsSync(dir)) continue;
    for (const f of walk(dir)) if (f.endsWith(".js") && fs.statSync(f).mtimeMs > since) out.push(f);
  }
  return out;
}

test("Gebaute Client-Chunks (.next/dev/static und .next/static, neuer als package.json) enthalten keine Geheimnisse", (t) => {
  const files = freshChunks();
  if (!files.length) {
    t.skip("keine aktuellen Client-Chunks (Dev-Server seit der letzten Paketänderung nicht gelaufen)");
    return;
  }
  t.diagnostic(`${files.length} Chunks geprüft, davon ${files.filter((f) => f.includes(`${path.sep}dev${path.sep}`)).length} aus .next/dev/static`);
  const hits = [];
  for (const f of files) {
    const s = fs.readFileSync(f, "utf8");
    for (const needle of NEEDLES) if (s.includes(needle)) hits.push(`${rel(f)}: ${needle}`);
  }
  assert.deepEqual(hits, []);
});

test("Chunk-Suche: beide Ordner, nur Dateien neuer als package.json", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ph-chunks-"));
  fs.writeFileSync(path.join(tmp, "package.json"), "{}");
  const old = Date.now() / 1000 - 3600;
  fs.utimesSync(path.join(tmp, "package.json"), old, old);
  for (const [d, name, age] of [[".next/dev/static/chunks", "neu-dev.js", 0], [".next/static/chunks", "neu-prod.js", 0], [".next/static/chunks", "alt.js", 7200]]) {
    fs.mkdirSync(path.join(tmp, d), { recursive: true });
    const p = path.join(tmp, d, name);
    fs.writeFileSync(p, "x");
    if (age) fs.utimesSync(p, Date.now() / 1000 - age, Date.now() / 1000 - age);
  }
  const names = freshChunks(tmp).map((f) => path.basename(f)).sort();
  assert.deepEqual(names, ["neu-dev.js", "neu-prod.js"]);
});

test("stripe ist exakt gepinnt", () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
  assert.match(pkg.dependencies.stripe, /^\d+\.\d+\.\d+$/);
  const installed = JSON.parse(fs.readFileSync(path.join(ROOT, "node_modules", "stripe", "package.json"), "utf8")).version;
  assert.equal(installed, pkg.dependencies.stripe);
});
