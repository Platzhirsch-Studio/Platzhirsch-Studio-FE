// tests/unit/r9-p1-locale-cookie.test.mjs – R5-Fix P1 (recht P1-4, technik P2).
// Contract for the privacy policy (P5): "NEXT_LOCALE und preferredLocale werden
// nur gesetzt, wenn der Besucher aktiv die Sprache wechselt."
//  - next-intl: localeCookie false (middleware and Link/useRouter write nothing)
//  - src/proxy.js: no Set-Cookie at all
//  - LanguageSwitcher: no storage write on render, only rememberLocale() on a
//    click to ANOTHER language.
// The live part (first visit + prefetch without Set-Cookie) is
// tests/e2e/r9-p1-locale-cookie.spec.js.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const code = (p) => read(p).replace(/^\s*\/\/.*$/gm, "");

test("next-intl: localeCookie false, keine Spracherkennung", () => {
  const cfg = code("src/i18n/config.js");
  assert.match(cfg, /localeCookie: false/);
  assert.match(cfg, /localeDetection: false/);
});

test("proxy.js setzt keinen Cookie", () => {
  const src = code("src/proxy.js");
  assert.doesNotMatch(src, /cookies\.set\(/);
  assert.doesNotMatch(src, /Set-Cookie/i);
});

test("Sprachumschalter: kein Speichern beim Rendern, nur beim aktiven Wechsel", () => {
  const src = code("src/components/Navbar/LanguageSwitcher.js");
  const hook = src.slice(src.indexOf("function useLanguageLinks"), src.indexOf("export function rememberLocale"));
  assert.doesNotMatch(hook, /localStorage|document\.cookie|useEffect/, "useLanguageLinks schreibt nichts");
  assert.match(src, /function followWithQuery\(e, lang\) \{\n\s+if \(!lang\.current\) rememberLocale\(lang\.code\);/);
  // localStorage + cookie only inside rememberLocale.
  assert.equal((src.match(/localStorage\.setItem/g) || []).length, 1);
  assert.equal((src.match(/doc\.cookie =/g) || []).length, 1);
});

test("rememberLocale: Name, Laufzeit und Flags wie bisher (Datenschutzerklärung)", async () => {
  // The module is a client component with "@/..." imports – the function is
  // checked on its source and with a tiny re-evaluation of its body.
  const src = read("src/components/Navbar/LanguageSwitcher.js");
  const body = src.slice(src.indexOf("export function rememberLocale"), src.indexOf("function followWithQuery"));
  const fn = new Function("localStorage", `${body.replace("export function", "return function")}`)({ store: {}, setItem(k, v) { this.store[k] = v; } });
  const doc = { location: { protocol: "https:" }, cookie: "" };
  fn("en", doc);
  assert.equal(doc.cookie, "NEXT_LOCALE=en; Path=/; Max-Age=31536000; SameSite=Lax; Secure");
  const http = { location: { protocol: "http:" }, cookie: "" };
  fn("fr", http);
  assert.equal(http.cookie, "NEXT_LOCALE=fr; Path=/; Max-Age=31536000; SameSite=Lax");
});
