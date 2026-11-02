// node --test tests/unit/kuechenplaner-a11y-fix02.test.mjs
// Mobil-A11y fix-02: Grundriss-Editor – Pfeiltasten wirken nach Auswahl per Zeiger,
// Fokus fällt nach Entfernen/Wandwechsel nicht auf <body>, Ansagen für jede Aktion.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
const K = "src/components/Labs/Kuechenplaner/";

const src = read(`${K}PlanEditor.js`);

test("fix-02: Tastatur-Handler umfasst die Leiste des ausgewählten Moduls", () => {
  assert.match(src, /flex h-full min-h-0 flex-col \$\{className\}`\} onKeyDown=\{onKey\}>/);
  assert.doesNotMatch(src, /py-1" onKeyDown=\{onKey\}/);
  assert.match(src, /closest\?\.\("select, input, textarea"\)\) return;/);
  assert.match(src, /e\.key === "Escape"\) \{\s*e\.preventDefault\(\);\s*onSelect\?\.\(null\);/);
});

test("fix-02: Plan per Skript fokussierbar, Fokus nach Auswahl, Entfernen und Wandwechsel", () => {
  assert.match(src, /setAttribute\("tabindex", "-1"\)/);
  assert.match(src, /onSelect\?\.\(m\.id\);\s*svg\.focus\?\.\(\{ preventScroll: true \}\);/);
  assert.ok((src.match(/focusPlan\(\);/g) || []).length >= 3);
  assert.match(src, /onClick=\{remove\}\s*aria-label=\{tr\("Modul entfernen"\)\}/);
});

test("fix-02: Ansagen für Verschieben, Entfernen, Wandwechsel; Wiederholung wird erneut gelesen", () => {
  assert.match(src, /\{name\} \{n\} cm nach links\.[\s\S]*\{name\} \{n\} cm nach rechts\./);
  assert.match(src, /entfernt\. Rückgängig mit Strg\+Z\./);
  assert.match(src, /ans Ende von/);
  assert.match(src, /s === msg \? `\$\{msg\}\u00a0` : msg/);
});
