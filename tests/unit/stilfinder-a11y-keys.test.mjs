// Stil-Finder – WCAG 2.2 SC 2.1.4 (Zeichentasten-Kürzel nur im Quiz) und
// Fragenposition im Namen der fokussierten Überschrift (mobil-code-seo, fix-01).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const { quizOwnsKey, questionLabel } = await import("../../src/components/Labs/Stilfinder/keyScope.js");
const quizSrc = readFileSync(new URL("../../src/components/Labs/Stilfinder/StilfinderQuiz.js", import.meta.url), "utf8");

const doc = { body: { tagName: "BODY" }, documentElement: { tagName: "HTML" } };
const el = (tagName, extra = {}) => ({ tagName, ownerDocument: doc, ...extra });
const inside = new Set();
const root = { contains: (n) => inside.has(n) };

test("2.1.4: Tasten wirken bei Fokus auf body oder im Quiz", () => {
  doc.body.ownerDocument = doc;
  doc.documentElement.ownerDocument = doc;
  assert.equal(quizOwnsKey(doc.body, root), true);
  assert.equal(quizOwnsKey(doc.documentElement, root), true);
  assert.equal(quizOwnsKey(null, root), true);
  const card = el("BUTTON");
  inside.add(card);
  assert.equal(quizOwnsKey(card, root), true);
});

test("2.1.4: Tasten wirken NICHT außerhalb des Quiz (Concierge, Banner, Kopfzeile)", () => {
  assert.equal(quizOwnsKey(el("BUTTON"), root), false);
  assert.equal(quizOwnsKey(el("A"), root), false);
  assert.equal(quizOwnsKey(el("BUTTON"), null), false);
});

test("2.1.4: Textfelder schlucken die Ziffern nie – auch im Quiz", () => {
  for (const tag of ["INPUT", "TEXTAREA", "SELECT"]) {
    const f = el(tag);
    inside.add(f);
    assert.equal(quizOwnsKey(f, root), false, tag);
  }
  const ce = el("DIV", { isContentEditable: true });
  inside.add(ce);
  assert.equal(quizOwnsKey(ce, root), false);
});

test("Quiz nutzt den Tasten-Scope statt eigener Tag-Liste", () => {
  assert.match(quizSrc, /quizOwnsKey\(e\.target, document\.getElementById\("stilfinder"\)\)/);
  assert.doesNotMatch(quizSrc, /tag === "INPUT" \|\| tag === "TEXTAREA"\) return;/);
});

test("Fragen-Überschrift nennt die Position (Zähler ist aria-hidden)", () => {
  assert.equal(questionLabel(1, 7, "Welche Oberfläche möchten Sie berühren?"), "Frage 2 von 7: Welche Oberfläche möchten Sie berühren?");
  assert.equal(questionLabel(1, 7, "Which surface?", "Question {n} of {total}: {title}"), "Question 2 of 7: Which surface?");
  assert.match(quizSrc, /aria-label=\{questionLabel\(index, TOTAL, q\.title, t\.quiz\.questionLabel\)\}/);
});
