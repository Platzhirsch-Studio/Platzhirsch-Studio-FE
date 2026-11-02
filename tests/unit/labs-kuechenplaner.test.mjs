// node --test tests/unit/labs-kuechenplaner.test.mjs
// Küchenplaner (Labs), Runde 2: Teilen-Link-Rundlauf, Drehgrenze je Grundform (R4),
// Kamera „Ich stehe drin“ (R5), Fronten mit Fugenbild/Griffleiste und Backofenglas (R7),
// deutsche Fehlertexte der Anfrage aus dem API-`code`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { decodePlan, defaultPlan, encodePlan, switchRaster } from "../../src/components/Labs/Kuechenplaner/planState.js";
import { AZIMUTH, AZIMUTH_TALL, WALL_MARGIN, azimuthLimits, buildKitchen, standPose } from "../../src/components/Labs/Kuechenplaner/geometry.js";
import { ERROR_TEXT, PHONE, codeFromStatus, describeRequestError } from "../../src/components/Labs/Kuechenplaner/requestErrors.js";

const SHAPES = ["zeile", "l", "u", "insel"];

for (const raster of [60, 55]) {
  for (const shape of SHAPES) {
    test(`Teilen-Link: Rundlauf ${shape} im ${raster}-cm-Raster`, () => {
      const plan = switchRaster(defaultPlan(shape), raster);
      assert.deepEqual(decodePlan(encodePlan(plan)), plan);
    });
  }
}

test("Teilen-Link: 55er-Breiten 27,5 / 41,25 bleiben unverändert (Inhaber-Frage, nicht ändern)", () => {
  const plan = switchRaster(defaultPlan("l"), 55);
  plan.runs.a = [
    { t: "unterschrank", w: 27.5 },
    { t: "unterschrank", w: 41.25 },
  ];
  assert.deepEqual(decodePlan(encodePlan(plan)).runs.a, plan.runs.a);
});

// ---- R4 Drehgrenze ----------------------------------------------------------

test("R4: L-Form mit Hochschränken an Wand B → links enger, rechts ±60°", () => {
  const plan = defaultPlan("l");
  assert.ok(plan.runs.b.some((m) => ["hochschrank", "backofen", "kuehlschrank"].includes(m.t)), "Vorgabe hat Hochschränke an B");
  const lim = azimuthLimits(plan);
  assert.equal(lim.min, -AZIMUTH_TALL);
  assert.equal(lim.max, AZIMUTH);
});

test("R4: L-Form ohne Hochschränke → volle Drehung", () => {
  const plan = defaultPlan("l");
  plan.runs.b = plan.runs.b.map((m) => ({ ...m, t: "unterschrank" }));
  assert.deepEqual(azimuthLimits(plan), { min: -AZIMUTH, max: AZIMUTH });
});

test("R4: U-Form – Seite mit Hochschränken wird begrenzt, je Wand einzeln", () => {
  const plan = defaultPlan("u");
  plan.runs.b = [{ t: "unterschrank", w: 60 }];
  plan.runs.c = [{ t: "hochschrank", w: 60 }];
  assert.deepEqual(azimuthLimits(plan), { min: -AZIMUTH, max: AZIMUTH_TALL });
  plan.runs.b = [{ t: "kuehlschrank", w: 60 }];
  assert.deepEqual(azimuthLimits(plan), { min: -AZIMUTH_TALL, max: AZIMUTH_TALL });
});

test("R4: Zeile – Hochschrank am Zeilenende begrenzt nur diese Seite", () => {
  const plan = defaultPlan("zeile");
  plan.runs.a = [{ t: "unterschrank", w: 60 }, { t: "hochschrank", w: 60 }];
  assert.deepEqual(azimuthLimits(plan), { min: -AZIMUTH, max: AZIMUTH_TALL });
  plan.runs.a = [{ t: "hochschrank", w: 60 }, { t: "unterschrank", w: 60 }];
  assert.deepEqual(azimuthLimits(plan), { min: -AZIMUTH_TALL, max: AZIMUTH });
});

test("R4: an Seitenwänden bleibt die Kamera im Raum (Grenze aus Abstand und Wandlage)", () => {
  const plan = defaultPlan("l");
  const view = { tx: 2.1, w: 4.2, rh: 6 };
  const lim = azimuthLimits(plan, view);
  assert.ok(Math.abs(lim.min + Math.asin((2.1 - WALL_MARGIN) / 6)) < 1e-9, "links: Wand B");
  assert.equal(lim.max, AZIMUTH, "rechts offen");
  // Kamera-x bei der Grenze liegt genau WALL_MARGIN innerhalb der Wand
  assert.ok(Math.abs(view.tx + view.rh * Math.sin(lim.min) - WALL_MARGIN) < 1e-9);
  // weiter weg → engere Grenze; ganz nah → höchstens die Grundgrenze
  assert.ok(azimuthLimits(plan, { ...view, rh: 12 }).min > lim.min);
  assert.equal(azimuthLimits(plan, { ...view, rh: 1 }).min, -AZIMUTH_TALL);
  const u = azimuthLimits(defaultPlan("u"), view);
  assert.ok(u.max < AZIMUTH_TALL && u.min > -AZIMUTH_TALL, "U: beide Seiten begrenzt");
  assert.deepEqual(azimuthLimits(defaultPlan("zeile"), view), azimuthLimits(defaultPlan("zeile")), "Zeile: keine Seitenwand");
});

test("R4: Grenze bleibt deutlich unter ±60° (≈ ±41°)", () => {
  assert.ok(AZIMUTH_TALL < AZIMUTH && AZIMUTH_TALL > 0.6);
});

// ---- R5 Kamera „Ich stehe drin“ -----------------------------------------------

test("R5: Kamera 30–40 cm weiter zurück als in Runde 1, weiteres Sichtfeld", () => {
  for (const shape of ["zeile", "l", "u"]) {
    const plan = defaultPlan(shape);
    const { room } = buildKitchen(plan);
    const old = Math.max(1.2, Math.min(room.d - 0.2, Math.max(2.2, room.d * 0.78)));
    const pose = standPose(plan, room);
    const back = pose.pos[2] - old;
    assert.ok(back >= 0.29 && back <= 0.41, `${shape}: ${back.toFixed(2)} m zurück`);
    assert.ok(pose.pos[2] <= room.d + 0.1 + 1e-9, "höchstens 10 cm vor der offenen Raumkante");
    assert.equal(pose.pos[1], 1.6, "Augenhöhe 1,60 m");
    assert.ok(pose.fov > 62);
  }
});

test("R5: Insel – Standpunkt hinter der Insel auf der Sitzseite", () => {
  const plan = defaultPlan("insel");
  const { room } = buildKitchen(plan);
  const islandBack = (60 + plan.island.aisle + plan.island.depth) / 100;
  const z = standPose(plan, room).pos[2];
  assert.ok(z > islandBack + 0.5 && z <= room.d + 0.1);
});

// ---- R7 Fronten ---------------------------------------------------------------

const partsOf = (plan, re) => buildKitchen(plan).parts.filter((p) => re.test(p.id));

test("R7: Hochschrank hat Fugenbild (4 Fronten statt 2)", () => {
  const plan = defaultPlan("zeile");
  plan.runs.a = [{ t: "hochschrank", w: 60 }];
  assert.equal(partsOf(plan, /^a-0-f\d$/).length, 4);
});

test("R7: grifflos → senkrechte Griffleiste an Hochschrank und Kühlschrank", () => {
  const plan = defaultPlan("zeile");
  plan.grip = "grifflos";
  plan.runs.a = [{ t: "hochschrank", w: 60 }, { t: "kuehlschrank", w: 60 }];
  for (const i of [0, 1]) {
    const [g] = partsOf(plan, new RegExp(`^a-${i}-gv$`));
    assert.ok(g, `Griffleiste Modul ${i}`);
    assert.ok(g.size[1] > 1.8, "über die ganze Höhe");
    assert.ok(g.size[0] < 0.05, "schmal");
  }
});

test("R7: Griffleiste → senkrechte Leiste an den Türen der Hochschränke", () => {
  const plan = defaultPlan("zeile");
  plan.grip = "leiste";
  plan.runs.a = [{ t: "kuehlschrank", w: 60 }];
  const handles = partsOf(plan, /^a-0-h\d$/);
  assert.ok(handles.length >= 1);
  assert.ok(handles.every((h) => h.size[1] > h.size[0]), "senkrecht");
});

test("R7: Backofenscheibe nutzt helleres Glas (ovenGlass)", () => {
  const plan = defaultPlan("zeile");
  plan.runs.a = [{ t: "backofen", w: 60 }];
  const [oven] = partsOf(plan, /^a-0-oven$/);
  assert.equal(oven.mat, "ovenGlass");
});

// ---- Fehlertexte der Anfrage ------------------------------------------------

test("Fehlertexte: jeder code der Formular-Routen hat einen deutschen Text", () => {
  for (const code of ["rate_limited", "too_large", "invalid", "timeout", "upstream", "internal"]) {
    const { message } = describeRequestError({ status: 500, body: { success: false, code, error: "Failed to submit form" } });
    assert.ok(message.startsWith(ERROR_TEXT[code]), code);
    assert.doesNotMatch(message, /Failed|Invalid|Too many|Payload/i, "kein englischer error-Text");
  }
});

test("Fehlertexte: ohne code entscheidet der HTTP-Status", () => {
  assert.equal(codeFromStatus(429), "rate_limited");
  assert.equal(codeFromStatus(413), "too_large");
  assert.equal(codeFromStatus(400), "invalid");
  assert.equal(codeFromStatus(504), "timeout");
  assert.equal(codeFromStatus(502), "upstream");
  assert.equal(describeRequestError({ status: 502, body: {} }).code, "upstream");
  assert.equal(describeRequestError({ status: 418, body: { code: "teapot" } }).code, "unknown");
});

test("Fehlertexte: Netzwerkfehler, Telefonnummer, Feld-Zuordnung", () => {
  const net = describeRequestError({ network: true });
  assert.equal(net.code, "network");
  assert.ok(net.message.includes(PHONE));
  const inv = describeRequestError({ status: 400, body: { code: "invalid", field: "email" } });
  assert.equal(inv.field, "email");
  assert.equal(describeRequestError({ status: 400, body: { code: "invalid", field: "foo" } }).field, null);
  assert.equal(describeRequestError({ status: 429, body: { code: "rate_limited", field: "email" } }).field, null);
});
