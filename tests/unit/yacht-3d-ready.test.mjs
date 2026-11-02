// Werfthalle 3D, Runde 3: the poster only fades once the 3D stage has
// compiled its shaders and drawn a frame – and onReady fires once.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const s3 = readFileSync(new URL("../../src/components/Yacht/Stage3D.js", import.meta.url), "utf8");

test("onReady after compileAsync + a drawn frame, once, with a time guard", () => {
  assert.doesNotMatch(s3, /useEffect\(\(\) => \{\s*onReady\?\.\(\);\s*\}, \[onReady\]\)/, "no ready-on-mount");
  assert.match(s3, /compileAsync\(root, camera\)/);
  assert.match(s3, /requestAnimationFrame\(\(\) => requestAnimationFrame\(fire\)\)/);
  assert.match(s3, /if \(!alive \|\| fired\) return;/);
  assert.match(s3, /setTimeout\(fire, 4000\)/);
});
