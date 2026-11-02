import { test } from "node:test";
import assert from "node:assert/strict";
import { imageSources } from "../../src/lib/ezarri/images.js";

test("ohne Stufen bleibt das srcset 600w/1600w", () => {
  const s = imageSources({ web: "/ezarri/x/a", breite: 2400, hoehe: 1600 });
  assert.equal(s.webp, "/ezarri/x/a-600.webp 600w, /ezarri/x/a-1600.webp 1600w");
});

test("Zwischenstufen 900/1200 nur unterhalb der größten Datei", () => {
  const s = imageSources({ web: "/ezarri/x/a", breite: 2400, hoehe: 1600 }, [900, 1200]);
  assert.equal(s.avif, "/ezarri/x/a-600.avif 600w, /ezarri/x/a-900.avif 900w, /ezarri/x/a-1200.avif 1200w, /ezarri/x/a-1600.avif 1600w");
  const klein = imageSources({ web: "/ezarri/x/b", breite: 1200, hoehe: 800 }, [900, 1200]);
  assert.equal(klein.webp, "/ezarri/x/b-600.webp 600w, /ezarri/x/b-900.webp 900w, /ezarri/x/b-1600.webp 1600w");
});
