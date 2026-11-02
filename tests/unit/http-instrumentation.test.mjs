// node --test tests/unit/http-instrumentation.test.mjs
// Redaction in src/instrumentation.js (onRequestError log line).
import { test } from "node:test";
import assert from "node:assert/strict";
import { sanitizePath, buildErrorLogEntry } from "../../src/instrumentation.js";

test("routePath placeholders redact secret segments, whatever they look like", () => {
  // all-lowercase base64url and lowercase hex: the old heuristic let these through
  assert.equal(sanitizePath("/de/upload/abcdefghijklmnopqrstu", "/[locale]/upload/[token]"), "/de/upload/[token]");
  assert.equal(sanitizePath("/de/upload/short", "/[locale]/upload/[token]"), "/de/upload/[token]");
  assert.equal(sanitizePath("/api/upload/tok/files/42", "/api/upload/[token]/files/[fileId]"), "/api/upload/[token]/files/[fileId]");
  assert.equal(sanitizePath("/en/portal/pass/7", "/[locale]/portal/pass/[id]"), "/en/portal/pass/[id]");
  assert.equal(sanitizePath("/api/portal/dokumente/123?x=1", "/api/portal/dokumente/[id]"), "/api/portal/dokumente/[id]");
});

test("readable placeholders and slugs stay readable", () => {
  assert.equal(sanitizePath("/de/ueber-uns/marken/minotti", "/[locale]/ueber-uns/marken/[title]"), "/de/ueber-uns/marken/minotti");
  assert.equal(sanitizePath("/en/about-us/brands/minotti", "/[locale]/ueber-uns/marken/[title]"), "/en/about-us/brands/minotti");
  assert.equal(sanitizePath("/de/produkte/beds/sofas-twiggy-bed", "/[locale]/produkte/[category]/[slug]"), "/de/produkte/beds/sofas-twiggy-bed");
});

test("route groups, parallel slots and secret catch-alls", () => {
  assert.equal(sanitizePath("/de/upload/abc", "/[locale]/(flow)/@modal/upload/[token]"), "/de/upload/[token]");
  assert.equal(sanitizePath("/x/a/b/c", "/x/[...token]"), "/x/[token]/[token]/[token]");
  assert.equal(sanitizePath("/de/a/b", "/[locale]/[...rest]"), "/de/a/b");
});

test("fallback heuristic when routePath is missing or does not line up", () => {
  assert.equal(sanitizePath("/de/upload/Ab3dEf6hIj9kLmN0pQ"), "/de/upload/[redacted]");
  assert.equal(sanitizePath("/de/x/0123456789abcdef0123456789abcdef"), "/de/x/[redacted]");
  assert.equal(sanitizePath("/de/x/550e8400-e29b-41d4-a716-446655440000"), "/de/x/[redacted]");
  assert.equal(sanitizePath("/de/kontakt/max%40example.com", "/[locale]/a/b/c"), "/de/kontakt/[email]");
  assert.equal(sanitizePath("/de/moebel-bodensee"), "/de/moebel-bodensee");
});

test("log entry uses routePath and never carries query or headers", () => {
  const err = Object.assign(new Error("boom for max@example.com at /x?token=abc"), { digest: "123" });
  const entry = buildErrorLogEntry(
    err,
    { method: "GET", path: "/de/upload/lowercasetokenvalue?mail=a@b.at", headers: { cookie: "s=1" } },
    { routePath: "/[locale]/upload/[token]", routeType: "render", routerKind: "App Router" }
  );
  assert.equal(entry.path, "/de/upload/[token]");
  assert.equal(entry.digest, "123");
  const text = JSON.stringify(entry);
  for (const secret of ["lowercasetokenvalue", "max@example.com", "token=abc", "cookie", "a@b.at"]) {
    assert.equal(text.includes(secret), false, secret);
  }
});
