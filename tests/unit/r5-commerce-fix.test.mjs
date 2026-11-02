// tests/unit/r5-commerce-fix.test.mjs — R5-commerce Nachbesserung (QA-Feedback):
// P2  Entwurfs-Bedingungen sperren den Gutschein-Schalter (Seiten + API 404)
// P3  Atelier-Fotos nur /atelier/…, Alt-Text-Ersatz = Titel
// Run: node --test tests/unit/r5-commerce-fix.test.mjs
// Kein Netz: fetch ist immer ein Mock.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TERMS_RELEASED, voucherEnabled, voucherMode, voucherModeRequested, voucherTermsReleased } from "../../src/lib/commerce/mode.js";
import { TERMS_STATUS } from "../../src/lib/commerce/voucherTerms.js";
import { voucherHandler } from "../../src/lib/commerce/handlers.js";
import { PHOTO_RE, parseAtelierCsv } from "../../src/lib/commerce/atelierSource.js";
import { createRateLimiter } from "../../src/lib/forms/rateLimit.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");

const VOUCHER = {
  betrag: 100,
  anzahl: 1,
  motiv: "seelicht",
  versand: "pdf",
  name: "Erika Muster",
  email: "erika@example.com",
  einwilligung: true,
  website: "",
  _t: 9000,
};

function mockFetch() {
  const calls = [];
  const fn = async (url, init) => {
    calls.push({ url, init });
    return new Response(JSON.stringify({ message: { name: "KF-1" } }), { status: 200, headers: { "Content-Type": "application/json" } });
  };
  fn.calls = calls;
  return fn;
}

const post = (body) =>
  new Request("http://localhost/api/gutschein_anfrage", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Forwarded-For": "198.51.100.77" },
    body: JSON.stringify(body),
  });

test("P2: Bedingungen sind heute Entwurf, VOUCHER_MODE=anfrage zählt als off", () => {
  assert.notEqual(TERMS_STATUS, TERMS_RELEASED, "Freigabe erst nach Kanzlei, dann diesen Test anpassen");
  assert.equal(voucherTermsReleased(), false);
  assert.equal(voucherMode({ VOUCHER_MODE: "anfrage" }), "off");
  assert.equal(voucherEnabled({ VOUCHER_MODE: "anfrage" }), false);
  assert.equal(voucherMode({ VOUCHER_MODE: "anfrage" }, "entwurf"), "off");
  assert.equal(voucherMode({ VOUCHER_MODE: "anfrage" }, ""), "off");
  // Erst mit Freigabe greift der Schalter.
  assert.equal(voucherMode({ VOUCHER_MODE: "anfrage" }, "freigegeben"), "anfrage");
  assert.equal(voucherMode({}, "freigegeben"), "off");
  // Vorschau zeigt den gesetzten Wert getrennt an.
  assert.equal(voucherModeRequested({ VOUCHER_MODE: "anfrage" }), "anfrage");
});

test("P2: API liefert mit VOUCHER_MODE=anfrage und Entwurfs-Bedingungen 404, ohne Backoffice-Aufruf", async () => {
  const backoffice = mockFetch();
  const POST = voucherHandler({ env: { VOUCHER_MODE: "anfrage" }, fetchImpl: backoffice, limiter: createRateLimiter(), now: () => 1_800_000_000_000 });
  const res = await POST(post(VOUCHER));
  assert.equal(res.status, 404);
  assert.equal(backoffice.calls.length, 0);

  const POST2 = voucherHandler({ env: { VOUCHER_MODE: "anfrage" }, termsStatus: "entwurf", fetchImpl: backoffice, limiter: createRateLimiter(), now: () => 1_800_000_000_000 });
  assert.equal((await POST2(post(VOUCHER))).status, 404);
  assert.equal(backoffice.calls.length, 0);
});

test("P2: Seiten /gutscheine und /gutscheinbedingungen hängen am gekoppelten Schalter", () => {
  for (const f of ["src/app/[locale]/gutscheine/page.js", "src/app/[locale]/gutscheinbedingungen/page.js"]) {
    const src = read(f);
    assert.match(src, /if \(locale !== "de" \|\| !voucherEnabled\(\)\) notFound\(\);/, f);
    assert.doesNotMatch(src, /voucherModeRequested/, `${f} darf den ungekoppelten Wert nicht nutzen`);
  }
  const route = read("src/app/api/gutschein_anfrage/route.js");
  assert.doesNotMatch(route, /voucherModeRequested/);
  // Kopplung sitzt in mode.js, nicht verstreut in den Seiten.
  assert.match(read("src/lib/commerce/mode.js"), /import \{ TERMS_STATUS\b[^}]*\} from "\.\/voucherTerms\.js"/);
});

test("P3: Atelier-Fotos nur unter /atelier/, keine fremden Hosts", () => {
  for (const ok of ["/atelier/sofa.jpg", "/atelier/2026/sofa-1.webp", "/atelier/a.PNG"]) assert.match(ok, PHOTO_RE, ok);
  for (const bad of ["https://example.com/a.jpg", "http://x/a.jpg", "/atelier/../secret.jpg", "/atelier/a.svg", "//cdn.example.com/a.jpg", "/public/a.jpg"]) {
    assert.doesNotMatch(bad, PHOTO_RE, bad);
  }
  const header = "slug,titel,preis_eur,zustand,status,foto_url,foto_alt";
  const csv = `${header}\nsofa-a,Sofa A,1200,Leichte Sitzspuren am Kissen,verfuegbar,https://example.com/a.jpg,Sofa\nsofa-b,Sofa B,1200,Leichte Sitzspuren am Kissen,verfuegbar,/atelier/b.jpg,Sofa B in Grau`;
  const { items, skipped } = parseAtelierCsv(csv, { log: () => {} });
  assert.deepEqual(items.map((i) => i.slug), ["sofa-b"]);
  assert.equal(skipped[0].field, "foto_url");
});

test("P3: Alt-Text-Ersatz ist der Titel, nie leer", () => {
  const src = read("src/components/Atelier/AtelierPhoto.js");
  assert.match(src, /alt=\{item\.fotoAlt \|\| item\.titel \|\| "[^"]+"\}/);
  assert.doesNotMatch(src, /alt=\{item\.fotoAlt \|\| ""\}/);
});
