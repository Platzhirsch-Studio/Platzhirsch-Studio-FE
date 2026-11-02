// tests/unit/r6-leads-fix.test.mjs — R6-leads, fix round (Teamleiter feedback):
//   P2-1  The upload card (Upload/UploadHandoff.js, German-only copy) is shown
//         only on DE pages (Forms/lazyHandoff.js HANDOFF_LOCALES); all three
//         lead forms pass their locale to handoffAfterSend and prefetchHandoff.
//   P2-2  Static zod scan for the browser CSP: every module that imports zod and
//         can end up in a client bundle ("use client" itself, or imported by a
//         "use client" module) must run zod jitless. Server-only modules (API
//         routes, "server-only", "use server", server pages) are not affected
//         by the page CSP and are listed for the R6-release probe only.
// No network. Run: node --test tests/unit/r6-leads-fix.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");

test("P2-1: lazyHandoff gates the card to DE", () => {
  const src = read("src/components/Forms/lazyHandoff.js");
  assert.match(src, /HANDOFF_LOCALES = new Set\(\["de"\]\)/);
  assert.match(src, /export function prefetchHandoff\(locale\) \{\s*if \(!handoffAllowed\(locale\)\) return;/);
  assert.match(src, /if \(!handoffAllowed\(locale\)\) return Promise\.resolve\(null\);/);
  // locale is not passed on to the Upload package's handoffFrom()
  assert.match(src, /handoffFrom\(kind, rest\)/);
});

test("P2-1: the three lead forms pass their locale", () => {
  for (const [file, kind] of [
    ["src/components/Kontakt/KontaktForm.js", "kontakt"],
    ["src/components/BeratungClient/BeratungClient.js", "beratung"],
    ["src/components/AnfrageFormProduct/AnfrageFormProduct.js", "produkt"],
  ]) {
    const src = read(file);
    assert.match(src, /const \{[^}]*\blocale\b[^}]*\} = useFormText\(\)/, `${file}: locale from useFormText`);
    assert.match(src, new RegExp(`handoffAfterSend\\("${kind}", \\{[^}]*\\blocale \\}\\)`), `${file}: handoffAfterSend with locale`);
    assert.match(src, /onFocus=\{\(\) => prefetchHandoff\(locale\)\}/, `${file}: prefetch with locale`);
    assert.doesNotMatch(src, /onFocus=\{prefetchHandoff\}/, `${file}: no ungated prefetch`);
  }
});

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(m?js|jsx)$/.test(e.name)) out.push(p);
  }
  return out;
}

// Resolves "@/x", "./x", "../x" to a file in src (with .js / index.js).
function resolveImport(from, spec) {
  let base;
  if (spec.startsWith("@/")) base = path.join(ROOT, "src", spec.slice(2));
  else if (spec.startsWith(".")) base = path.resolve(path.dirname(from), spec);
  else return null;
  for (const c of [base, base + ".js", base + ".jsx", base + ".mjs", path.join(base, "index.js")]) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  }
  return null;
}

test("P2-2: zod in client bundles runs jitless", () => {
  const files = walk(path.join(ROOT, "src"));
  const text = new Map(files.map((f) => [f, fs.readFileSync(f, "utf8")]));
  const isClient = (src) => /^(?:\s|\/\/[^\n]*\n|\/\*[\s\S]*?\*\/)*["']use client["']/.test(src);
  const isServer = (src) =>
    /^(?:\s|\/\/[^\n]*\n|\/\*[\s\S]*?\*\/)*["']use server["']/.test(src) || /import\s+["']server-only["']/.test(src);
  const jitless = (src) => /config\(\s*\{\s*jitless:\s*true\s*\}\s*\)/.test(src);
  const imports = (f) =>
    [...text.get(f).matchAll(/(?:import|export)\s[^"';]*?from\s+["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g)]
      .map((m) => resolveImport(f, m[1] || m[2]))
      .filter(Boolean);
  // Everything reachable from a "use client" module ends up in a browser bundle.
  const client = new Set();
  const stack = files.filter((f) => isClient(text.get(f)));
  while (stack.length) {
    const f = stack.pop();
    if (client.has(f) || !text.has(f)) continue;
    // "use server" modules reach the client only as RPC stubs, "server-only" never.
    if (isServer(text.get(f))) continue;
    client.add(f);
    stack.push(...imports(f));
  }
  const rel = (f) => path.relative(ROOT, f).replace(/\\/g, "/");
  const zodUsers = files.filter((f) => /from\s+["']zod["']/.test(text.get(f)));
  const inClient = zodUsers.filter((f) => client.has(f));
  const problems = inClient.filter((f) => !jitless(text.get(f))).map(rel);
  assert.ok(inClient.length > 0, "scan sanity: Labs zod re-export is client-reachable");
  assert.deepEqual(problems, [], `client-reachable zod modules without jitless: ${problems.join(", ")}`);
  process.stdout.write(`# client zod modules: ${inClient.map(rel).join(", ")}\n# server-only zod modules: ${zodUsers.filter((f) => !client.has(f)).map(rel).join(", ")}\n`);
});
