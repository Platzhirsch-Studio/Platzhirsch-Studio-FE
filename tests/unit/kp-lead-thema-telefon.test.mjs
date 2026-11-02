// node --test tests/unit/kp-lead-thema-telefon.test.mjs
// Lead-Übergabe (Küchenplaner-Team, fix-03): Planer-Anfragen kommen im
// Backoffice als „eine Küche“ an (gleiches Label wie die Beratungsseite),
// Neubau/Renovierung steht als „Projekt: …“ im Text, Telefon ist freiwillig
// wie in beratungSchema (Datenminimierung).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { STEP1_KEYS } from "../../src/lib/forms/beratungContext.js";
import { beratungSchema } from "../../src/lib/forms/schemas.js";

const src = readFileSync(new URL("../../src/components/Labs/Kuechenplaner/ResultPanel.js", import.meta.url), "utf8");
const de = JSON.parse(readFileSync(new URL("../../src/messages/de.json", import.meta.url), "utf8"));

test("Thema = Label „Küche“ der Beratungsseite", () => {
  const label = de.MultiStepForm.step1Options[STEP1_KEYS.indexOf("kueche")];
  assert.equal(label, "eine Küche");
  assert.match(src, /const TOPIC_KUECHE = "eine Küche";/);
  assert.match(src, /bei_meiner_anfrage_geht_es_um: TOPIC_KUECHE,/);
  assert.match(src, /`Projekt: \$\{PROJEKT_LABEL\[d\.step1\] \|\| d\.step1\}`/);
});

test("Telefon freiwillig im Formular und in der Route", () => {
  assert.match(src, /field\("telefon", tr\("Telefon \(optional\)"\), \{ type: "tel", autoComplete: "tel" \}\)/);
  assert.doesNotMatch(src, /field\("telefon"[^\n]*required: true/);
  const ok = beratungSchema.safeParse({
    bei_meiner_anfrage_geht_es_um: "eine Küche",
    das_projekt_soll_verwirklicht_werden: "in einer Wohnung",
    bitte_beschreiben_sie_ihr_vorhaben: "Küchenplanung aus dem 3D-Küchenplaner",
    vorname: "Test",
    nachname: "Person",
    email: "test@example.com",
    telefon: "",
  });
  assert.equal(ok.success, true);
});
