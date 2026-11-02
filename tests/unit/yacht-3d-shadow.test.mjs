// Werfthalle 3D, Runde 3: the contact shadow is baked, not redrawn per orbit frame.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (f) => readFileSync(new URL(`../../${f}`, import.meta.url), "utf8");

test("ContactShadows frames={1}; drei resets its frame counter on every render", () => {
  assert.match(read("src/components/Yacht/Stage3D.js"), /<ContactShadows frames=\{1\}/);
  // guard for a drei update: the counter must live in the render body
  const drei = read("node_modules/@react-three/drei/core/ContactShadows.js");
  assert.match(drei, /let count = 0;/);
  assert.match(drei, /frames === Infinity \|\| count < frames/);
});
