// node --test tests/unit/planer-tools-r2.test.mjs
// QM planer-tools r2: Fokus-Nachscrollen nur bei Tastaturfokus (iOS-Sprung),
// Zahl+Einheit/Trennpunkt im Küchenplaner, Moodboard-Produktnamen ohne
// Maßangaben, Plätze der Modellkarten-Silhouette aus der Startform.
import { test } from "node:test";
import assert from "node:assert/strict";
import { isKeyboardFocusTarget } from "../../src/lib/kuechenplaner/focusGuard.js";
import { keepTogether } from "../../src/lib/kuechenplaner/typo.js";
import { splitProductName } from "../../src/lib/stilfinder/displayName.js";
import { silhouetteSeats } from "../../src/lib/sofaplaner/geometry.js";

const NB = " ";
const el = (tag, { tabindex = null, focusVisible = true, throws = false } = {}) => ({
  tagName: tag,
  getAttribute: (n) => (n === "tabindex" ? tabindex : null),
  matches: (sel) => {
    if (throws) throw new SyntaxError("unsupported");
    return sel === ":focus-visible" ? focusVisible : false;
  },
});

test("focusGuard: main/body/tabIndex=-1 lösen kein Nachscrollen aus (iOS-Tipp)", () => {
  assert.equal(isKeyboardFocusTarget(el("MAIN", { tabindex: "-1" })), false);
  assert.equal(isKeyboardFocusTarget(el("BODY")), false);
  assert.equal(isKeyboardFocusTarget(el("DIV", { tabindex: "-1" })), false);
  assert.equal(isKeyboardFocusTarget(null), false);
});

test("focusGuard: nur echter Tastaturfokus (:focus-visible)", () => {
  assert.equal(isKeyboardFocusTarget(el("BUTTON", { focusVisible: true })), true);
  assert.equal(isKeyboardFocusTarget(el("BUTTON", { focusVisible: false })), false);
  // ohne :focus-visible-Unterstützung nur Formularfelder
  assert.equal(isKeyboardFocusTarget(el("BUTTON", { throws: true })), false);
  assert.equal(isKeyboardFocusTarget(el("INPUT", { throws: true })), true);
});

test("keepTogether: Zahl und Einheit, Pos., Wand, Trennpunkt", () => {
  // r3: Bezeichnung und Zahl bleiben ebenfalls zusammen („Spülenschrank / 60,“ in der Druckansicht)
  assert.equal(keepTogether("Spüle–Kochfeld 127 cm"), `Spüle–Kochfeld${NB}127${NB}cm`);
  assert.equal(keepTogether("(Wand A, Pos. 2)"), `(Wand${NB}A, Pos.${NB}2)`);
  assert.equal(keepTogether("Lack matt, Kaschmir · Grifflos"), `Lack matt, Kaschmir${NB}· Grifflos`);
  assert.equal(keepTogether("120 × 93 × 60"), `120${NB}×${NB}93${NB}×${NB}60`);
  assert.equal(keepTogether("Körpergröße 170 cm"), `Körpergröße${NB}170${NB}cm`);
  assert.equal(keepTogether("Laufwege (100 cm für eine"), `Laufwege (100${NB}cm für eine`);
  assert.equal(keepTogether("Quarz 20 mm, Kante"), `Quarz${NB}20${NB}mm, Kante`);
  // keine Einheit: unverändert
  assert.equal(keepTogether("2 links"), "2 links");
  assert.equal(keepTogether(""), "");
  assert.equal(keepTogether(undefined), undefined);
});

test("splitProductName: Maßangaben aus Katalogtiteln, Ausführung bleibt", () => {
  assert.deepEqual(splitProductName("Arc Dining Table, L250 - H35mm - Coffee Black Oak"), { name: "Arc Dining Table", finish: "Coffee Black Oak" });
  assert.deepEqual(splitProductName("Munich Lounge Chair"), { name: "Munich Lounge Chair", finish: "" });
  // Komma ohne Maße gehört zum Namen
  assert.deepEqual(splitProductName("Tisch, rund"), { name: "Tisch, rund", finish: "" });
  assert.deepEqual(splitProductName("Regal, 120 x 40 cm"), { name: "Regal", finish: "" });
});

test("silhouetteSeats: aus der Breite der Startform, 1–4", () => {
  const row = (w) => [{ x: w / 2, y: 50, w, d: 100, rot: 0 }];
  assert.equal(silhouetteSeats(row(190), 95), 2);
  assert.equal(silhouetteSeats(row(300), 95), 3);
  assert.equal(silhouetteSeats(row(420), 95), 4);
  assert.equal(silhouetteSeats(row(90), 95), 1);
  assert.equal(silhouetteSeats([], 95), 3);
  // gedrehtes Element: Tiefe und Breite getauscht
  assert.equal(silhouetteSeats([{ x: 0, y: 0, w: 300, d: 100, rot: 90 }], 95), 3);
});
