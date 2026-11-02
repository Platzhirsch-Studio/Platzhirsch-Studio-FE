// Unit-Tests der teilbaren Wunschliste (Service 10): Kennungen, Datensatz,
// Sichtbarkeit (öffentlich / Ersteller), Reservierung ohne Doppelte,
// Gemeinschafts-Gutschein (Stripe-Mock-Event), lokaler Speicher, Modus,
// Texte in vier Sprachen und Gleichstand mit der Messages-Vorlage.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { isToken, itemKeyOf, matchesHash, newIds, parseAdminToken, randomToken, sealShare, sha256, shortRef, unsealShare } from "../../src/lib/wunschliste/ids.js";
import { safeHref, safeImage, LIMITS } from "../../src/lib/wunschliste/config.js";
import {
  WishlistError,
  addContribution,
  createRecord,
  expiryOf,
  isExpired,
  normalizeItems,
  ownerView,
  ownsRecord,
  publicView,
  releaseItem,
  reserveItem,
  rotateShare,
  shareIdFor,
  syncItems,
} from "../../src/lib/wunschliste/model.js";
import { applyPaidEvent, applyRefundEvent, checkoutMetadata, groupSummary, mockPaidEvent } from "../../src/lib/wunschliste/groupVoucher.js";
import { createLocalStore } from "../../src/lib/wunschliste/localStore.js";
import { contributionChannel, wunschlisteAvailable } from "../../src/lib/wunschliste/mode.js";
import { ContributionBody, CreateBody, ReserveBody } from "../../src/lib/wunschliste/schemas.js";
import { WUNSCHLISTE_TEXT, formatAmount, formatDate, wlText } from "../../src/lib/wunschliste/copy.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const ITEMS = [
  { id: 1, name: "Hamilton Sofa", category: "Minotti", image: "/cmx/files/hamilton.jpg", href: "/produkte/sofas-couches/hamilton", price: 12000 },
  { id: 2, name: "Arco", category: "Flos", image: "/files/arco.jpg", href: "/produkte/lamps/arco" },
  { id: 3, name: "Evil", category: "X", image: "https://evil.example/x.jpg", href: "https://evil.example" },
  { id: 1, name: "Hamilton Sofa", category: "Minotti" }, // doppelt
];

const input = (over = {}) =>
  CreateBody.parse({ locale: "de", occasion: "hochzeit", title: "Anna & Luca", date: "2027-06-12", message: "Wir freuen uns.", items: ITEMS, understood: true, ...over });

test("Kennungen: 32 Zeichen, nicht erratbar, Hash statt Klartext", () => {
  const ids = newIds();
  for (const v of Object.values(ids)) assert.ok(isToken(v), v);
  assert.notEqual(randomToken(), randomToken());
  assert.ok(matchesHash(ids.shareId, sha256(ids.shareId)));
  assert.ok(!matchesHash(randomToken(), sha256(ids.shareId)));
  assert.ok(!matchesHash("kurz", sha256("kurz")));
  assert.deepEqual(parseAdminToken(`${ids.listId}.${ids.adminSecret}`), { listId: ids.listId, secret: ids.adminSecret });
  assert.equal(parseAdminToken("abc.def"), null);
  assert.match(shortRef(), /^WL-[2-9A-Z]{4}-[2-9A-Z]{4}$/);
  assert.equal(itemKeyOf(ITEMS[0]), itemKeyOf(ITEMS[3]));
});

test("Versiegelter Teilen-Link: nur mit dem Verwaltungsschlüssel lesbar", () => {
  const { shareId, adminSecret } = newIds();
  const sealed = sealShare(shareId, adminSecret);
  assert.ok(!sealed.includes(shareId));
  assert.equal(unsealShare(sealed, adminSecret), shareId);
  assert.equal(unsealShare(sealed, randomToken()), null);
  assert.equal(unsealShare("kaputt", adminSecret), null);
});

test("Bilder und Links nur intern", () => {
  assert.equal(safeImage("/cmx/files/a.jpg"), "/cmx/files/a.jpg");
  assert.equal(safeImage("/files/a.jpg"), "/cms/files/a.jpg");
  assert.equal(safeImage("https://evil.example/a.jpg"), null);
  assert.equal(safeImage("/cmx/../etc/passwd"), null);
  assert.equal(safeHref("/produkte/a/b"), "/produkte/a/b");
  assert.equal(safeHref("//evil.example"), null);
  assert.equal(safeHref("javascript:alert(1)"), null);
});

test("Stücke: bereinigt, ohne Doppelte, ohne Preise, höchstens LIMITS.items", () => {
  const items = normalizeItems(ITEMS);
  assert.equal(items.length, 3);
  assert.equal(items[2].image, null);
  assert.equal(items[2].href, null);
  for (const i of items) assert.deepEqual(Object.keys(i).sort(), ["brand", "href", "image", "key", "name"]);
  const many = Array.from({ length: 100 }, (_, n) => ({ id: n, name: `Stück ${n}` }));
  assert.equal(normalizeItems(many).length, LIMITS.items);
});

test("Schema: Hinweis muss aktiv bestätigt sein, Titel Pflicht, Datum gültig", () => {
  assert.equal(CreateBody.safeParse({ ...input(), understood: false }).success, false);
  assert.equal(CreateBody.safeParse({ occasion: "hochzeit", title: "x", items: ITEMS, understood: true }).success, false);
  assert.equal(CreateBody.safeParse({ occasion: "hochzeit", title: "Titel", date: "2027-13-40", items: ITEMS, understood: true }).success, false);
  assert.equal(CreateBody.safeParse({ occasion: "party", title: "Titel", items: ITEMS, understood: true }).success, false);
  assert.equal(input({ date: "" }).date, "");
  assert.equal(ReserveBody.safeParse({ item: "zz" }).success, false);
  assert.equal(ContributionBody.safeParse({ name: "Eva", email: "eva@example.org", consent: true, amount: "100" }).data.amount, 100);
  assert.equal(ContributionBody.safeParse({ name: "Eva", email: "eva@example.org", consent: true, amount: "-5" }).success, false);
  assert.equal(ContributionBody.safeParse({ name: "Eva", email: "kein", consent: true }).success, false);
  assert.equal(ContributionBody.safeParse({ name: "Eva", email: "eva@example.org", consent: false }).success, true, "Einwilligung ist freiwillig");
});

test("Ablauf: 12 Monate nach dem Anlass bzw. nach dem Erstellen", () => {
  const createdAt = "2026-10-29T10:00:00.000Z";
  assert.equal(expiryOf({ date: "2027-06-12", createdAt }, 12).slice(0, 10), "2028-06-12");
  assert.equal(expiryOf({ date: null, createdAt }, 12).slice(0, 10), "2027-10-29");
  // Datum in der Vergangenheit: ab Erstellung
  assert.equal(expiryOf({ date: "2020-01-01", createdAt }, 12).slice(0, 10), "2027-10-29");
  const { record } = createRecord(input(), { now: new Date(createdAt) });
  assert.ok(!isExpired(record, new Date("2028-01-01")));
  assert.ok(isExpired(record, new Date("2028-06-13")));
});

test("Öffentliche Ansicht: keine Namen, keine Beträge, keine E-Mail, keine Geheimnisse", () => {
  const { record, shareId, adminToken } = createRecord(input());
  const key = record.items[0].key;
  reserveItem(record, key, { name: "Tante Erika", note: "passt" });
  addContribution(record, { amount: 150, name: "Onkel Max", email: "max@example.org", message: "Alles Gute", consent: true });
  const pub = JSON.stringify(publicView(record));
  for (const secret of ["Tante Erika", "Onkel Max", "max@example.org", "150", shareId, adminToken.split(".")[1], record.adminHash, record.shareHash, "12000"]) {
    assert.ok(!pub.includes(secret), `öffentlich sichtbar: ${secret}`);
  }
  assert.equal(publicView(record).items[0].reserved, true);
  const owner = ownerView(record);
  assert.equal(owner.items[0].reservation.name, "Tante Erika");
  assert.equal(owner.contributions[0].name, "Onkel Max");
  assert.ok(!JSON.stringify(owner).includes("max@example.org"), "E-Mail nur fürs Studio");
  assert.ok(!JSON.stringify(owner).includes(record.adminHash));
});

test("Reservieren: keine Doppelte, Storno nur mit Schlüssel oder durch den Ersteller", () => {
  const { record, adminToken } = createRecord(input());
  const key = record.items[1].key;
  const cancel = reserveItem(record, key);
  assert.ok(isToken(cancel));
  assert.throws(() => reserveItem(record, key), (e) => e instanceof WishlistError && e.code === "already_reserved" && e.status === 409);
  assert.throws(() => reserveItem(record, "0000000000000000"), (e) => e.code === "unknown_item");
  assert.throws(() => releaseItem(record, key, { cancel: randomToken() }), (e) => e.code === "forbidden");
  releaseItem(record, key, { cancel });
  assert.equal(record.reservations[key], undefined);
  reserveItem(record, key);
  releaseItem(record, key, { owner: true });
  assert.equal(record.reservations[key], undefined);
  assert.ok(ownsRecord(record, adminToken.split(".")[1]));
  assert.ok(!ownsRecord(record, randomToken()));
});

test("Widerruf und neuer Link: alter Link ungültig, Ersteller sieht den neuen", () => {
  const { record, shareId, adminToken } = createRecord(input());
  const secret = adminToken.split(".")[1];
  assert.equal(shareIdFor(record, secret), shareId);
  const fresh = rotateShare(record, secret);
  assert.notEqual(fresh, shareId);
  assert.equal(record.shareHash, sha256(fresh));
  assert.equal(shareIdFor(record, secret), fresh);
});

test("Abgleich mit der Merkliste: reservierte Stücke bleiben", () => {
  const { record } = createRecord(input());
  const reservedKey = record.items[0].key;
  reserveItem(record, reservedKey);
  const { kept } = syncItems(record, [{ id: 9, name: "Neu", category: "Kartell" }]);
  assert.deepEqual(kept, ["Hamilton Sofa"]);
  assert.deepEqual(record.items.map((i) => i.name), ["Neu", "Hamilton Sofa"]);
  assert.ok(record.reservations[reservedKey]);
});

test("Gemeinschafts-Gutschein: Stripe-Mock-Event bucht einmal, Erstattung nimmt heraus", () => {
  const { record } = createRecord(input());
  const a = addContribution(record, { amount: 100, name: "A", email: "a@example.org" }, { channel: "stripe" });
  const b = addContribution(record, { amount: 50, name: "B", email: "b@example.org" });
  assert.equal(a.status, "offen");
  assert.equal(b.status, "angefragt");
  const meta = checkoutMetadata(record, a);
  assert.deepEqual(Object.keys(meta).sort(), ["beitrag", "kind", "wunschliste", "wunschliste_ref"]);
  assert.ok(!JSON.stringify(meta).includes("a@example.org"));
  // Server-Preis zählt (120), nicht der Vorschlag (100)
  const event = mockPaidEvent(record, a, 120);
  assert.equal(applyPaidEvent(record, event), true);
  assert.equal(applyPaidEvent(record, event), false, "idempotent");
  assert.deepEqual(groupSummary(record), { count: 2, paidCount: 1, paidTotal: 120, requestedCount: 1, pledgedTotal: 50 });
  // fremde Liste / unbezahlt / anderer Typ werden ignoriert
  const other = createRecord(input()).record;
  assert.equal(applyPaidEvent(other, event), false);
  const unpaid = mockPaidEvent(record, b, 50);
  unpaid.data.object.payment_status = "unpaid";
  assert.equal(applyPaidEvent(record, unpaid), false);
  assert.equal(applyRefundEvent(record, { sessionId: event.data.object.id }), true);
  assert.equal(groupSummary(record).paidTotal, 0);
});

test("Lokaler Speicher: Teilen-Link per Hash, Austausch, Löschen", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "wl-"));
  try {
    const store = createLocalStore(dir);
    const { record, shareId, adminToken } = createRecord(input());
    await store.create(record);
    const files = await fs.readdir(path.join(dir, "share"));
    assert.equal(files[0], `${sha256(shareId)}.json`);
    const raw = await fs.readFile(path.join(dir, "lists", `${record.listId}.json`), "utf8");
    assert.ok(!raw.includes(shareId) && !raw.includes(adminToken.split(".")[1]), "keine Klartext-Schlüssel im Speicher");
    assert.equal((await store.getByShare(shareId)).listId, record.listId);
    assert.equal(await store.getByShare(randomToken()), null);
    assert.equal(await store.getByShare("../../etc"), null);

    // gleichzeitige Reservierung desselben Stücks: genau eine gelingt
    const key = record.items[0].key;
    const results = await Promise.allSettled([0, 1, 2].map(() => store.update(record.listId, (r) => reserveItem(r, key))));
    assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);

    let fresh;
    await store.update(record.listId, (r) => {
      fresh = rotateShare(r, adminToken.split(".")[1]);
    });
    assert.equal(await store.getByShare(shareId), null, "alter Link 404");
    assert.equal((await store.getByShare(fresh)).listId, record.listId);
    assert.equal(await store.remove(record.listId), true);
    assert.equal(await store.getByShare(fresh), null);
    assert.deepEqual(await fs.readdir(path.join(dir, "share")), []);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test("Modus: Teilen in Entwicklung an, Produktion nur mit Speicher; Beitragskanal", () => {
  assert.equal(wunschlisteAvailable({ NODE_ENV: "development" }), true);
  assert.equal(wunschlisteAvailable({ NODE_ENV: "development", WUNSCHLISTE_MODE: "off" }), false);
  assert.equal(wunschlisteAvailable({ NODE_ENV: "production" }), false);
  // Produktion erst mit freigegebener DSE-Ergänzung (QA Recht P1-6).
  assert.equal(wunschlisteAvailable({ NODE_ENV: "production", WUNSCHLISTE_LOCAL_DIR: "/srv/wl" }), false);
  assert.equal(wunschlisteAvailable({ NODE_ENV: "production", WUNSCHLISTE_LOCAL_DIR: "/srv/wl" }, "freigegeben"), true);
  assert.equal(contributionChannel("off", { NODE_ENV: "development" }), "anfrage");
  assert.equal(contributionChannel("anfrage", { NODE_ENV: "development" }), "anfrage");
  // Stripe nur mit freigegebenem UND angebundenem Gemeinschafts-Gutschein (QA P1-4/P1-3).
  const ready = { bedingungenStatus: "freigegeben", stripeAngebunden: true };
  assert.equal(contributionChannel("stripe", { NODE_ENV: "production" }, ready), "stripe");
  assert.equal(contributionChannel("stripe", { NODE_ENV: "production" }), "kontakt");
  assert.equal(contributionChannel("stripe", { NODE_ENV: "development" }), "anfrage");
  assert.equal(contributionChannel("stripe", { NODE_ENV: "production" }, { bedingungenStatus: "freigegeben", stripeAngebunden: false }), "kontakt");
  assert.equal(contributionChannel("anfrage", { NODE_ENV: "production", WUNSCHLISTE_LOCAL_DIR: "/srv/wl" }), "kontakt");
  // Gutscheine aus (/de/gutscheine 404) → in Produktion kein Beitrags-Abschnitt (QA Technik P2-5).
  assert.equal(contributionChannel("off", { NODE_ENV: "production", WUNSCHLISTE_LOCAL_DIR: "/srv/wl" }), "aus");
});

test("Beitrag: Einwilligung freiwillig, ohne Häkchen ohne Name und Gruß (Art. 7 Abs. 4)", () => {
  const base = { name: "Anna", email: "a@example.org", message: "Alles Gute" };
  assert.equal(ContributionBody.safeParse(base).success, true);
  assert.equal(ContributionBody.parse(base).consent, false);
  assert.equal(ContributionBody.parse({ ...base, consent: true }).consent, true);
  const { record } = createRecord(input());
  addContribution(record, ContributionBody.parse(base));
  addContribution(record, ContributionBody.parse({ ...base, name: "Ben", consent: true }));
  const view = ownerView(record).contributions;
  assert.deepEqual([view[0].name, view[0].message, view[0].anonymous], ["", "", true]);
  assert.deepEqual([view[1].name, view[1].anonymous], ["Ben", false]);
  assert.ok(record.contributions[1].consentAt && record.contributions[0].consentAt === null);
  assert.ok(!JSON.stringify(view).includes("a@example.org"), "keine E-Mail in der Ansicht");
});

function leaves(obj, prefix = "") {
  return Object.entries(obj).flatMap(([k, v]) => (v && typeof v === "object" ? leaves(v, `${prefix}${k}.`) : [`${prefix}${k}`]));
}

test("Texte: vier Sprachen mit denselben Schlüsseln, Platzhalter gleich, keine Superlative/Ausrufezeichen", () => {
  const de = leaves(WUNSCHLISTE_TEXT.de).sort();
  for (const locale of ["en", "fr", "it"]) {
    assert.deepEqual(leaves(WUNSCHLISTE_TEXT[locale]).sort(), de, locale);
    for (const key of de) {
      const vars = (s) => (s.match(/\{\w+\}/g) || []).sort().join();
      assert.equal(vars(wlText(locale, key)), vars(wlText("de", key)), `${locale} ${key}`);
    }
  }
  const all = JSON.stringify(WUNSCHLISTE_TEXT);
  assert.ok(!all.includes("!"), "keine Ausrufezeichen");
  assert.ok(!/(größte|beste|exklusiv|Luxus|Traum|largest|best |exclusive)/i.test(all));
  assert.ok(!/€\s?\d|\d\s?€/.test(all), "keine Preise im Text");
  assert.equal(wlText("de", "public.count", { count: 3 }), "3 Stücke");
  assert.equal(wlText("xx", "public.reserve"), "Reservieren");
  assert.equal(formatDate("2027-06-12", "de"), "12. Juni 2027");
  assert.match(formatAmount(150, "de"), /150/);
});

test("Messages-Vorlage entspricht der Tabelle", async () => {
  const file = path.join(ROOT, "Marktresearch/digital/features/service-wunschliste-messages.json");
  const json = JSON.parse(await fs.readFile(file, "utf8"));
  for (const locale of ["de", "en", "fr", "it"]) assert.deepEqual(json[locale].wunschliste, WUNSCHLISTE_TEXT[locale], locale);
});
