// node --test tests/unit/sofaplaner-merkliste-link.test.mjs
// Team katalog-modell-code (31.10.2026), fix-05:
// - Merkliste: broken or old entries in localStorage no longer crash step 6.
// - Teilen-Link: a link made before the last change is neither shown nor put
//   into the enquiry text / handoff (it would open the old plan).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseList } from "../../src/components/Labs/Sofaplaner/storage.js";

const ok = { id: "k1", savedAt: "2026-10-31T10:00:00.000Z", plan: { v: 2, family: "connery", items: [] } };

test("parseList: gültige Einträge bleiben, kaputte fallen weg", () => {
  const raw = JSON.stringify([ok, null, 3, "x", { id: 5, savedAt: ok.savedAt, plan: ok.plan }, { id: "k2", savedAt: "kein Datum", plan: ok.plan }, { id: "k3", savedAt: ok.savedAt }, { id: "k4", savedAt: ok.savedAt, plan: { items: "nein" } }]);
  assert.deepEqual(parseList(raw), [ok]);
});

test("parseList: kein Array, kaputtes JSON oder leer → leere Liste", () => {
  for (const raw of [null, "", "{", "{}", '{"items":[]}', "42", "null"]) assert.deepEqual(parseList(raw), [], String(raw));
});

test("ResultPanel: Merkliste über parseList, Teilen-Link nur für den Stand, für den er erstellt wurde", () => {
  const src = readFileSync(new URL("../../src/components/Labs/Sofaplaner/ResultPanel.js", import.meta.url), "utf8");
  assert.match(src, /useMemo\(\(\) => parseList\(listRaw\), \[listRaw\]\)/);
  assert.match(src, /const shareUrl = share\.state === "done" && share\.key === planKey \? share\.url : "";/);
  assert.match(src, /planText\(plan, family, shareUrl\)/);
  assert.match(src, /setShare\(\{ state: "done", url: data\.url, error: "", key \}\)/);
  // the box, the copy button and the handoff use only the current link
  assert.doesNotMatch(src, /value=\{share\.url\}|copy\(share\.url|planText\(plan, family, share\.url\)/);
  assert.match(src, /const link = shareUrl \|\| \(await makeShare\(\{ quiet: true \}\)\);/);
});
