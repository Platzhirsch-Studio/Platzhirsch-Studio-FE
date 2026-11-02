// node --test tests/unit/kp-lead-formvertrag.test.mjs
// Lead-Übergabe (Küchenplaner-Team, fix-02): Die Planungsanfrage aus dem
// Ergebnis nutzt denselben Formular-Vertrag wie Beratung und Kontakt –
// Herkunft-Block + lead_ref (postForm), Honeypot `website` und Zeitfalle `_t`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { prepareLead } from "../../src/lib/forms/client.js";
import { HERKUNFT_TITLE, isLeadRef } from "../../src/lib/forms/leadPayload.js";

const src = readFileSync(new URL("../../src/components/Labs/Kuechenplaner/ResultPanel.js", import.meta.url), "utf8");

test("ResultPanel sendet über postForm (kein eigener fetch auf /api/beratung_anfrage)", () => {
  assert.match(src, /import \{ postForm \} from "@\/lib\/forms\/client"/);
  assert.match(src, /postForm\("\/api\/beratung_anfrage", guard\(payload, formEl\)/);
  assert.doesNotMatch(src, /fetchWithTimeout\("\/api\/beratung_anfrage"/);
});

test("Formular trägt Honeypot und Zeitfalle", () => {
  assert.match(src, /<Honeypot id="kp-website" \/>/);
  assert.match(src, /const guard = useFormGuard\(\)/);
  // currentTarget wird vor dem ersten await gemerkt
  assert.match(src, /const formEl = e\.currentTarget;/);
});

test("Beratungs-Payload bekommt Herkunft-Block und lead_ref", () => {
  const payload = { bitte_beschreiben_sie_ihr_vorhaben: "Küchenplanung aus dem 3D-Küchenplaner\nGrundform: L-Form" };
  const { body, leadRef } = prepareLead("/api/beratung_anfrage", payload, {
    attribution: { consentAds: false },
    leadRef: "0b6c1f2e-1a2b-4c3d-8e9f-0123456789ab",
    locale: "de",
    device: "Desktop",
  });
  assert.ok(isLeadRef(leadRef));
  assert.equal(body.lead_ref, leadRef);
  assert.ok(body.bitte_beschreiben_sie_ihr_vorhaben.includes(HERKUNFT_TITLE));
  assert.ok(body.bitte_beschreiben_sie_ihr_vorhaben.startsWith("Küchenplanung aus dem 3D-Küchenplaner"));
});
