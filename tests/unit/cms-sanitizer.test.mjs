// tests/unit/cms-sanitizer.test.mjs – Expertenrat security P0: sanitizeCmsHtml
// must not let an unclosed tag through (Stored XSS via SSR `</div>`), and
// `/\host` links must not become external links.
// Run: node --test tests/unit/cms-sanitizer.test.mjs
import { test, before } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../src");

// "@/x" → src/x(.js|/index.js), like the Next.js path alias.
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
    if (specifier.startsWith("@/")) {
      const base = path.join(SRC, specifier.slice(2));
      const file = [base, `${base}.js`, path.join(base, "index.js")].find((f) => fs.existsSync(f) && fs.statSync(f).isFile());
      if (file) return { url: pathToFileURL(file).href, shortCircuit: true };
    }
    return next(specifier, context);
  },
});

let sanitize;
before(async () => {
  ({ sanitizeCmsHtml: sanitize } = await import(pathToFileURL(path.join(SRC, "lib/shop/shopProducts.js")).href));
});

test("unclosed tag from the probe is escaped, not left as markup", () => {
  const out = sanitize("Schoenes Sofa <img src=x onerror=alert(document.domain)//");
  assert.equal(out.includes("<img"), false);
  assert.match(out, /&lt;img src=x onerror=/);
  // Even when React appends a closing tag, no element can form.
  assert.equal(/<[a-z]/i.test(out.replace(/<\/?(p|br|strong|b|em|i|u|ul|ol|li|a|span|h3|h4)\b[^>]*>/g, "")), false);
});

test("allowed tags survive, attributes and blocked blocks are dropped", () => {
  assert.equal(sanitize("<p class=x>Text <strong onclick=y>fett</strong></p><script>alert(1)</script>"), "<p>Text <strong>fett</strong></p>");
  assert.equal(sanitize("<div onmouseover=alert(1)>t</div>"), "t");
  assert.equal(sanitize("<svg><g onload=alert(1)></g></svg>x"), "x");
});

test("plain angle brackets in text are escaped", () => {
  assert.equal(sanitize("a < b && c > d"), "a &lt; b && c &gt; d");
});

test("links: relative and https kept, javascript: and /\\host rejected", () => {
  assert.equal(sanitize('<a href="/de/kontakt" onclick="x">ok</a>'), '<a href="/de/kontakt" rel="noopener">ok</a>');
  assert.equal(sanitize('<a href="https://www.minotti.com">m</a>'), '<a href="https://www.minotti.com" rel="noopener">m</a>');
  assert.equal(sanitize('<a href="javascript:alert(1)">j</a>'), "<a>j</a>");
  assert.equal(sanitize('<a href="/\\evil.com">x</a>'), "<a>x</a>");
  assert.equal(sanitize('<a href="//evil.com">x</a>'), "<a>x</a>");
});

test("NUL characters in the input cannot forge placeholders", () => {
  assert.equal(sanitize("\u00000\u0000<p>x</p>"), "0<p>x</p>");
});
