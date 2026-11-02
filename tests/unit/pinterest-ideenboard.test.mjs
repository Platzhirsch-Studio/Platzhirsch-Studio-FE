// „Merken auf Pinterest“ (Link ohne Skript, Bildrechte-Allowlist), Rich-Pin-
// Verifizierung und Ideenboard (Karten, Sortieren, Teilen, Export).
// Inhaber-Entscheidung Nr. 14 (29.10.2026). node --test, ohne Netzwerk.
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, readdirSync, existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { pinRights, canPin, imagePath } from "../../src/lib/pinterest/rights.js";
import { pinterestHref, pinDescription, absoluteUrl, PIN_BASE } from "../../src/lib/pinterest/url.js";
import { pinterestDomainVerify, pinterestVerificationMetadata, pinterestSaveEnabled } from "../../src/lib/pinterest/config.js";
import { fmt } from "../../src/lib/pinterest/copy.js";
import { safeHref, safeImage, LIMITS } from "../../src/lib/ideenboard/config.js";
import {
  addCard,
  boardAsText,
  cardKey,
  cardSource,
  cardsFromMerkliste,
  encodeUrlPath,
  createRecord,
  isExpired,
  moveCard,
  pinnable,
  pinterestCsv,
  publicView,
  removeCard,
  sanitizeBoard,
  sanitizeCard,
  setNote,
  syncRecord,
  withLocale,
} from "../../src/lib/ideenboard/model.js";
import { matchesHash, newIds, parseAdminToken, sha256, isToken } from "../../src/lib/ideenboard/ids.js";
import { createLocalStore } from "../../src/lib/ideenboard/localStore.js";
import { ideenboardShareAvailable, ideenboardTerminConnected } from "../../src/lib/ideenboard/mode.js";

const ROOT = path.resolve(import.meta.dirname, "../..");
const read = (p) => readFileSync(path.join(ROOT, p), "utf8");
const COPY_LOCALES = ["de", "en", "fr", "it"];
// Texte stehen seit dem Nachbessern nur in src/messages (pinterest.*, ideenboard.*)
const MESSAGES = Object.fromEntries(COPY_LOCALES.map((l) => [l, JSON.parse(read(`src/messages/${l}.json`))]));
const PINTEREST_COPY = Object.fromEntries(COPY_LOCALES.map((l) => [l, { pinterest: MESSAGES[l].pinterest, ideenboard: MESSAGES[l].ideenboard }]));

// ---------------------------------------------------------------------------
test("Bildrechte: nur Ezarri, Harald, Projekte, Stil-Palette; Tagebuch und aboutHome gesperrt", () => {
  assert.equal(pinRights("/ezarri/gea/anw-cam4-basalt50-1600.webp").quelle, "Ezarri");
  // QA Recht P1-3: Register „offen“ → bis zur Freigabe kein Merken-Link
  assert.equal(canPin("/Images/Home/aboutHome.jpg"), false);
  // QA Recht P0: Tagebuch-Einwilligung gilt nur für die Website
  assert.equal(canPin("/api/portal/tagebuch/referenz/abc/foto.webp"), false);
  assert.doesNotMatch(read("src/lib/pinterest/rights.js"), /^\s*\{ match: "\/api\/portal\/tagebuch/m);
  assert.ok(canPin("/arbeitsweise/handzeichnung-wohnraum.avif"));
  assert.ok(canPin("/projekte/haus-am-see/totale.avif"));
  assert.ok(canPin("/stil-palette/italienische-ruhe.png"));
  assert.ok(canPin("https://platzhirsch.studio/ezarri/x/y-600.webp"));
  // Standard = gesperrt
  assert.equal(pinRights("/Images/Wohnen/bannerImage10.jpg").grund, "nicht-freigegeben");
  assert.equal(canPin("/cmx/files/sofa.webp"), false);
  assert.equal(canPin("/Images/Home/slider/poliform-kueche-kochinsel.webp"), false);
  assert.equal(pinRights("/ezarri/minotti-pool.webp").grund, "hersteller");
  assert.equal(pinRights("/Images/Yacht/custom-line-navetta-42.jpg").grund, "hersteller");
  assert.equal(canPin("/arbeitsweise/x.avif", { kiStufe: "generiert" }), false);
  assert.ok(canPin("/arbeitsweise/x.avif", { kiStufe: "retusche" }));
  assert.equal(canPin("https://evil.example/ezarri/a.webp"), false);
  assert.equal(canPin("http://platzhirsch.studio/ezarri/a.webp"), false);
  assert.equal(canPin("//platzhirsch.studio/ezarri/a.webp"), false);
  assert.equal(canPin("/ezarri/../Images/x.jpg"), false);
  assert.equal(imagePath(42), null);
});

test("Merken-Link: Pinterest-URL mit url, media, description; ohne Recht null", () => {
  const href = pinterestHref({ url: "/de/ezarri/galerie", media: "/ezarri/gea/a-1600.webp", title: "Becken mit Ezarri Washes 25", brand: "Ezarri", room: "Pool" });
  assert.ok(href.startsWith(PIN_BASE + "?"));
  const q = new URL(href).searchParams;
  assert.equal(q.get("url"), "https://platzhirsch.studio/de/ezarri/galerie");
  assert.equal(q.get("media"), "https://platzhirsch.studio/ezarri/gea/a-1600.webp");
  assert.match(q.get("description"), /Ezarri/);
  assert.match(q.get("description"), /Pool/);
  assert.match(q.get("description"), /Platzhirsch Lochau · Bild: Ezarri$/);
  assert.equal(pinterestHref({ url: "/de/x", media: "/Images/Wohnen/bannerImage10.jpg", title: "x" }), null);
  assert.equal(pinterestHref({ url: "https://evil.example/", media: "/ezarri/a.webp", title: "x" }), null);
  assert.equal(absoluteUrl("javascript:alert(1)"), null);
});

test("Beschreibung: keine Dubletten, Quelle Ezarri, Länge begrenzt", () => {
  assert.equal(pinDescription({ title: "Ezarri Washes 25", brand: "Ezarri", room: "Bad" }), "Ezarri Washes 25 · Bad – Platzhirsch Lochau");
  assert.equal(pinDescription({ title: "Pool", quelle: "Ezarri" }), "Pool – Platzhirsch Lochau · Bild: Ezarri");
  // QA Technik P1-2: Quelle Ezarri IMMER, auch wenn „Ezarri“ schon im Titel steht
  assert.equal(pinDescription({ title: "Ezarri Washes 25, Anwendungsbild", brand: "Ezarri", room: "Pool", quelle: "Ezarri" }), "Ezarri Washes 25, Anwendungsbild · Pool – Platzhirsch Lochau · Bild: Ezarri");
  assert.match(pinDescription({ title: "x".repeat(900), quelle: "Ezarri" }), /… · Bild: Ezarri$/);
  assert.equal(pinDescription({ title: "Mein Wohnstil", quelle: "Platzhirsch Stil-Finder" }), "Mein Wohnstil – Platzhirsch Lochau");
  assert.doesNotMatch(read("src/components/Ezarri/Katalog/GalleryGrid.js"), /const title = altText\.anwendung/);
  assert.ok(pinDescription({ title: "x".repeat(900) }).length <= 480);
  assert.doesNotMatch(pinDescription({ title: "<script>" }), /</);
});

test("Kein Pinterest-Skript im Code (nur Link)", () => {
  const files = [];
  const walk = (d) => {
    for (const e of readdirSync(path.join(ROOT, d), { withFileTypes: true })) {
      const p = `${d}/${e.name}`;
      if (e.isDirectory()) walk(p);
      else if (/\.(m?js|jsx)$/.test(e.name)) files.push(p);
    }
  };
  walk("src");
  for (const f of files) {
    const s = read(f);
    // ein eingebundenes Pinterest-Skript (Kommentare mit „pinit.js“ sind erlaubt)
    assert.doesNotMatch(s, /assets\.pinterest\.com|data-pin-do|["'`]https?:\/\/[^"'`]*pinit/, f);
  }
  const comp = read("src/components/Pinterest/PinterestSave.js");
  assert.match(comp, /rel="noopener noreferrer"/);
  assert.match(comp, /target="_blank"/);
});

test("Rich Pins: Verifizierungs-Meta nur mit PINTEREST_DOMAIN_VERIFY", () => {
  assert.equal(pinterestDomainVerify({}), null);
  assert.equal(pinterestDomainVerify({ PINTEREST_DOMAIN_VERIFY: "  " }), null);
  assert.equal(pinterestDomainVerify({ PINTEREST_DOMAIN_VERIFY: '"><script>' }), null);
  assert.equal(pinterestDomainVerify({ PINTEREST_DOMAIN_VERIFY: "0123456789abcdef0123456789abcdef" }), "0123456789abcdef0123456789abcdef");
  assert.deepEqual(pinterestVerificationMetadata({}), {});
  assert.deepEqual(pinterestVerificationMetadata({ PINTEREST_DOMAIN_VERIFY: "abcdef0123456789" }), { verification: { other: { "p:domain_verify": "abcdef0123456789" } } });
  assert.match(read("src/app/[locale]/layout.js"), /pinterestVerificationMetadata\(\)/);
  assert.equal(pinterestSaveEnabled({}), true);
  assert.equal(pinterestSaveEnabled({ NEXT_PUBLIC_PINTEREST_SAVE: "off" }), false);
});

// ---------------------------------------------------------------------------
test("Karte: Bereinigung, nur interne Links/Bilder, Typen", () => {
  const c = sanitizeCard({ type: "ezarri", title: "  Washes <b>25</b> ", href: "/de/ezarri/mosaike/washes-25", image: "/ezarri/w/a-600.webp", quelle: "Ezarri" });
  assert.equal(c.title, "Washes b25/b");
  assert.equal(c.href, "/de/ezarri/mosaike/washes-25");
  assert.equal(c.image, "/ezarri/w/a-600.webp");
  assert.equal(c.id, cardKey(c));
  assert.equal(sanitizeCard({ type: "hack", title: "x" }), null);
  assert.equal(sanitizeCard({ type: "moebel", title: "" }), null);
  assert.equal(sanitizeCard({ type: "moebel", title: "x", href: "https://evil.example" }).href, null);
  assert.equal(sanitizeCard({ type: "moebel", title: "x", href: "//evil.example" }).href, null);
  assert.equal(sanitizeCard({ type: "moebel", title: "x", image: "javascript:1" }).image, null);
  assert.equal(safeImage("/files/a.webp"), "/cms/files/a.webp");
  assert.equal(safeHref("/de/ezarri/konfigurator?k=eyJ2IjoxfQ"), "/de/ezarri/konfigurator?k=eyJ2IjoxfQ");
  const n = sanitizeCard({ type: "notiz", note: "Wohnzimmer 5 × 6 m", href: "/de/x", image: "/ezarri/a.webp" });
  assert.equal(n.title, "Wohnzimmer 5 × 6 m");
  assert.equal(n.href, null);
  assert.equal(n.image, null);
  assert.equal(sanitizeCard({ type: "moebel", title: "x", note: "y".repeat(900) }).note.length, LIMITS.note);
});

test("Board: hinzufügen, Dubletten, Grenze, entfernen, sortieren, Notiz", () => {
  let b = { cards: [] };
  const a = { type: "raumbild", title: "A", image: "/ezarri/a.webp" };
  b = addCard(b, a).board;
  assert.equal(addCard(b, a).reason, "exists");
  b = addCard(b, { type: "stil", title: "B", href: "/de/stil-finder/ergebnis/italienische-ruhe" }).board;
  b = addCard(b, { type: "notiz", note: "C" }).board;
  assert.deepEqual(b.cards.map((c) => c.title), ["A", "B", "C"]);
  b = moveCard(b, 2, 0);
  assert.deepEqual(b.cards.map((c) => c.title), ["C", "A", "B"]);
  assert.deepEqual(moveCard(b, 0, 99).cards.map((c) => c.title), ["A", "B", "C"]);
  assert.deepEqual(moveCard(b, 5, 0).cards.map((c) => c.title), ["C", "A", "B"]);
  const id = b.cards[1].id;
  b = setNote(b, id, "Gefällt mir");
  assert.equal(b.cards[1].note, "Gefällt mir");
  b = removeCard(b, id);
  assert.equal(b.cards.length, 2);
  let full = { cards: [] };
  for (let i = 0; i < LIMITS.cards + 5; i++) full = addCard(full, { type: "notiz", note: `n${i}` }).board;
  assert.equal(full.cards.length, LIMITS.cards);
  assert.equal(addCard(full, { type: "notiz", note: "neu" }).reason, "full");
  assert.equal(sanitizeBoard({ cards: "x" }).cards.length, 0);
});

test("Merkliste → Möbel-Karten mit Sprache im Link", () => {
  const cards = cardsFromMerkliste(
    [
      { id: "1", name: "Andersen Sofa", category: "Minotti", href: "/produkte/sofas-couches/andersen", image: "/cmx/files/a.webp" },
      { id: "2", name: "Becken-Entwurf", category: "Ezarri-Konfigurator", kategories: "ezarri", href: "/de/ezarri/konfigurator?k=abc" },
      { name: "" },
    ],
    "en"
  );
  assert.equal(cards.length, 2);
  assert.equal(cards[0].type, "moebel");
  assert.equal(cards[0].href, "/en/produkte/sofas-couches/andersen");
  assert.equal(cards[0].subtitle, "Minotti");
  assert.equal(pinnable(cards[0]), false, "Minotti-Bild nie auf Pinterest");
  assert.equal(cards[1].type, "ezarriMix");
  assert.equal(cards[1].href, "/de/ezarri/konfigurator?k=abc");
  assert.equal(withLocale("/", "fr"), "/fr");
  assert.equal(withLocale("//x", "de"), null);
});

test("Pinterest-Export: CSV nur freigegebene Bilder, keine Formeln; Textliste mit allen Karten", () => {
  let b = { cards: [] };
  b = addCard(b, { type: "ezarri", title: "=Washes 25", image: "/ezarri/w/a-1600.webp", href: "/de/ezarri/mosaike/washes-25", room: "Pool" }).board;
  b = addCard(b, { type: "moebel", title: "Andersen", subtitle: "Minotti", image: "/cmx/files/a.webp", href: "/de/produkte/x" }).board;
  b = addCard(b, { type: "notiz", note: "Fenster nach Westen" }).board;
  const csv = pinterestCsv(b, { boardName: "Ideen, Bad", site: "https://platzhirsch.studio", describe: (c) => pinDescription({ title: c.title, room: c.room }) });
  const lines = csv.split("\r\n");
  assert.equal(lines[0], "Title,Media URL,Pinterest board,Thumbnail,Description,Link,Publish date,Keywords");
  assert.equal(lines.length, 2, "nur die Ezarri-Karte");
  assert.match(lines[1], /^'=Washes 25,https:\/\/platzhirsch\.studio\/ezarri\/w\/a-1600\.webp,"Ideen, Bad"/);
  assert.doesNotMatch(csv, /Andersen|cmx/);
  // QA Technik P2-4: URLs kodiert, ohne doppelte Kodierung
  assert.equal(encodeUrlPath("/ezarri/a b (1).webp"), "/ezarri/a%20b%20(1).webp");
  assert.equal(encodeUrlPath("/ezarri/a%20b.webp"), "/ezarri/a%20b.webp");
  let b2 = addCard({ cards: [] }, { type: "ezarri", title: "x", image: "/ezarri/a b.webp", href: "/de/ezarri/galerie" }).board;
  assert.match(pinterestCsv(b2, { boardName: "B", site: "https://platzhirsch.studio", describe: () => "d" }), /platzhirsch\.studio\/ezarri\/a%20b\.webp/);
  // Projekt ohne Einwilligung „pinterest“: nopin, nie im Export
  b2 = addCard(b2, { type: "projekt", title: "P", image: "/projekte/x/a.avif", href: "/de/projekte/x", nopin: true }).board;
  assert.equal(pinnable(b2.cards[1]), false);
  assert.equal(pinnable({ ...b2.cards[1], nopin: false }), true);
  // Quellenangabe auch bei Herstellerbildern (QA Recht P2-5)
  assert.equal(cardSource({ type: "moebel", title: "A", subtitle: "Minotti", image: "/cmx/files/a.webp" }), "Minotti");
  assert.equal(cardSource({ type: "ezarri", title: "A", image: "/ezarri/a.webp" }), "Ezarri");
  assert.equal(cardSource({ type: "notiz", title: "A" }), null);
  const text = boardAsText(b, { site: "https://platzhirsch.studio", labels: PINTEREST_COPY.de.ideenboard.seite.types });
  assert.match(text, /2\. Möbel: Andersen/);
  assert.match(text, /„Fenster nach Westen“/);
});

// ---------------------------------------------------------------------------
test("Teilen: Kennungen, Hash-Vergleich, Datensatz ohne Klartext-Schlüssel", () => {
  const ids = newIds();
  assert.ok(isToken(ids.shareId) && isToken(ids.boardId) && isToken(ids.adminSecret));
  assert.ok(matchesHash(ids.adminSecret, sha256(ids.adminSecret)));
  assert.equal(matchesHash("x", sha256("x")), false);
  assert.deepEqual(parseAdminToken(`${ids.boardId}.${ids.adminSecret}`), { boardId: ids.boardId, secret: ids.adminSecret });
  assert.equal(parseAdminToken("a.b"), null);
  const now = new Date("2026-10-29T10:00:00Z");
  const r = createRecord({ board: { cards: [{ type: "notiz", note: "x" }] }, ids, hashes: { share: sha256(ids.shareId), admin: sha256(ids.adminSecret) }, now });
  const json = JSON.stringify(r);
  assert.ok(!json.includes(ids.shareId) && !json.includes(ids.adminSecret));
  assert.equal(r.expiresAt, "2027-10-29T10:00:00.000Z");
  assert.equal(isExpired(r, Date.parse("2027-10-30T00:00:00Z")), true);
  const pv = publicView(r);
  assert.deepEqual(Object.keys(pv).sort(), ["cards", "updatedAt"]);
  assert.ok(!("addedAt" in pv.cards[0]));
  assert.throws(() => createRecord({ board: { cards: [] }, ids, hashes: { share: "a", admin: "b" } }), /empty/);
  syncRecord(r, { cards: [{ type: "notiz", note: "y" }] }, new Date("2026-11-01T00:00:00Z"));
  assert.equal(r.cards[0].note, "y");
  assert.equal(r.expiresAt, "2027-11-01T00:00:00.000Z");
});

test("Speicher: anlegen, per Link lesen, Link tauschen (alter 404), löschen", async () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "ideenboard-"));
  const store = createLocalStore(dir);
  const ids = newIds();
  const rec = createRecord({ board: { cards: [{ type: "notiz", note: "x" }] }, ids, hashes: { share: sha256(ids.shareId), admin: sha256(ids.adminSecret) } });
  await store.create(rec);
  assert.equal((await store.getByShare(ids.shareId)).boardId, ids.boardId);
  assert.equal(await store.getByShare("A".repeat(32)), null);
  assert.equal(await store.getByShare("../../etc"), null);
  const next = newIds().shareId;
  await store.update(ids.boardId, (r) => {
    r.shareHash = sha256(next);
  });
  assert.equal(await store.getByShare(ids.shareId), null);
  assert.equal((await store.getByShare(next)).boardId, ids.boardId);
  // aktive Löschung abgelaufener Boards (QA Technik P1-3)
  const old = newIds();
  const oldRec = createRecord({ board: { cards: [{ type: "notiz", note: "alt" }] }, ids: old, hashes: { share: sha256(old.shareId), admin: sha256(old.adminSecret) }, now: new Date("2020-01-01T00:00:00Z") });
  await store.create(oldRec);
  const swept = await store.sweep((r) => isExpired(r));
  assert.equal(swept.removed, 1);
  assert.equal(await store.getByShare(old.shareId), null);
  assert.equal(existsSync(path.join(dir, "boards", `${old.boardId}.json`)), false);
  assert.ok(await store.get(ids.boardId), "aktives Board bleibt");
  assert.equal(await store.remove(ids.boardId), true);
  assert.equal(await store.getByShare(next), null);
  assert.equal(existsSync(path.join(dir, "boards", `${ids.boardId}.json`)), false);
});

test("Modus: Entwicklung an, Produktion nur mit Volume, Schalter off", () => {
  assert.equal(ideenboardShareAvailable({ NODE_ENV: "development" }), true);
  assert.equal(ideenboardShareAvailable({ NODE_ENV: "production" }), false);
  // Erwartung bewusst ergänzt (Rat 9,5 B3, QA Recht −0,3): Produktion zusätzlich nur mit
  // freigegebenem DSE-Abschnitt #ideenboard (src/lib/legal/dseSections.js, heute Entwurf).
  assert.equal(ideenboardShareAvailable({ NODE_ENV: "production", IDEENBOARD_LOCAL_DIR: "/srv/ib" }), false);
  const DSE_OK = { ideenboard: { anchor: "ideenboard", status: "freigegeben" } };
  assert.equal(ideenboardShareAvailable({ NODE_ENV: "production", IDEENBOARD_LOCAL_DIR: "/srv/ib" }, DSE_OK), true);
  assert.equal(ideenboardShareAvailable({ NODE_ENV: "production" }, DSE_OK), false, "freigegeben, aber ohne Volume");
  assert.equal(ideenboardShareAvailable({ NODE_ENV: "development", IDEENBOARD_MODE: "off" }), false);
  // QA Technik P0 → Rat 9,5 B2 (bewusst geändert): die Buchung liest ?ideenboard=
  // jetzt; der Knopf hängt am Teilen (DSE-Sperre, Volume), abschaltbar mit off.
  assert.equal(ideenboardTerminConnected({ NODE_ENV: "development" }), true);
  assert.equal(ideenboardTerminConnected({ NODE_ENV: "development", IDEENBOARD_TERMIN: "off" }), false);
  assert.equal(ideenboardTerminConnected({ NODE_ENV: "production", IDEENBOARD_LOCAL_DIR: "/srv/ib" }), false, "ohne DSE-Freigabe kein Knopf");
  assert.equal(ideenboardTerminConnected({ NODE_ENV: "production", IDEENBOARD_LOCAL_DIR: "/srv/ib" }, DSE_OK), true);
  const pageSrc = read("src/components/Pinterest/IdeenboardPage.js");
  assert.match(pageSrc, /terminConnected \? \(/);
  assert.match(read("src/app/[locale]/ideenboard/page.js"), /terminConnected=\{ideenboardTerminConnected\(\)\}/);
});

// ---------------------------------------------------------------------------
test("Texte: nur in src/messages, vier Sprachen mit gleichen Schlüsseln, Vorschlag identisch, Stimme", () => {
  // eine Quelle: copy.js enthält keine Texte mehr
  assert.doesNotMatch(read("src/lib/pinterest/copy.js"), /Auf Pinterest merken|const de = /);
  assert.ok(!/"OK"/.test(read("src/components/Pinterest/IdeenboardPage.js")), "aria-label übersetzt");
  const keys = (o, p = "") => Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" ? keys(v, `${p}${k}.`) : [`${p}${k}`])).sort();
  const de = keys(PINTEREST_COPY.de);
  for (const l of COPY_LOCALES) assert.deepEqual(keys(PINTEREST_COPY[l]), de, l);
  const file = JSON.parse(read("Marktresearch/digital/features/pinterest-messages.json"));
  for (const l of COPY_LOCALES) assert.deepEqual(file[l], PINTEREST_COPY[l], `pinterest-messages.json ${l}`);
  const all = JSON.stringify(PINTEREST_COPY);
  assert.doesNotMatch(all, /!/);
  assert.doesNotMatch(all, /\b(Luxus|exklusiv|Traum|beste[nrs]?|größte[nrs]?)\b/i);
  assert.equal(fmt("„{title}“ x", { title: "A" }), "„A“ x");
});

test("Seiten: noindex, Teilen-Seite ohne Referrer; Merken-Knöpfe an den Quellen", () => {
  const page = read("src/app/[locale]/ideenboard/page.js");
  assert.match(page, /robots: \{ index: false, follow: false \}/);
  const shared = read("src/app/[locale]/ideenboard/[shareId]/page.js");
  assert.match(shared, /index: false/);
  assert.match(shared, /referrer: "no-referrer"/);
  assert.match(read("src/components/Ezarri/Katalog/GalleryGrid.js"), /SaveActions/);
  assert.match(read("src/components/Arbeitsweise/ImageSlot.js"), /SaveActions/);
  assert.match(read("src/components/Labs/Stilfinder/StilResult.js"), /SaveActions/);
  assert.match(read("src/components/Projects/ProjektArtikel.js"), /SaveActions/);
  assert.match(read("src/components/Ezarri/Konfigurator/Konfigurator.js"), /IdeenboardAdd/);
});

test("Nachbessern: Projekt-Einwilligung, nopin, robots, Fokus, Griff, Links zum Board", () => {
  assert.match(read("src/lib/content/projekte.js"), /"name", "pinterest"\]/);
  assert.match(read("src/components/Projects/ProjektArtikel.js"), /pinterest=\{pinterestErlaubt\(projekt\)\}/);
  assert.match(read("src/components/Pinterest/BoardCardMedia.js"), /data-pin-nopin/);
  assert.match(read("src/components/ShopCatalog/tileImage.js"), /data-pin-nopin="true"/);
  const robots = read("src/app/robots.js");
  assert.match(robots, /userAgent: "Pinterestbot"/);
  assert.match(robots, /"\/\*\?k=", "\/\*\?a="/);
  assert.match(robots, /"\/preview\/"/);
  assert.match(read(".gitignore"), /^\/public\/preview\/pinterest\/$/m);
  const page = read("src/components/Pinterest/IdeenboardPage.js");
  assert.doesNotMatch(page, /<li[^>]*\n\s*draggable/, "nicht die ganze Karte ziehbar");
  assert.match(page, /data-drag-handle/);
  assert.match(page, /atEdge \? other : dir/);
  assert.match(page, /\[data-ideenboard-undo\]/);
  assert.doesNotMatch(page, /\/ideenboard`\}/, "kein Pin auf das leere Board");
  assert.match(read("src/components/Navbar/navbar.js"), /IdeenboardNavLink/);
  assert.match(read("src/components/Navbar/MobileMenu.js"), /IdeenboardNavLink/);
  // Rat 9,5 B9 (bewusst geändert): Die Merkliste verlinkt das Board jetzt über den
  // Reiter „Ideen“ von „Ihre Auswahl“ (SelectionTabs, gleiches data-ideenboard-nav).
  assert.match(read("src/components/CartPage/CartPage.js"), /<SelectionTabs /);
  const tabs = read("src/components/CartPage/SelectionTabs.js");
  assert.match(tabs, /href: "\/ideenboard"/);
  assert.match(tabs, /data-ideenboard-nav=\{tab\.key === "ideen"/);
  assert.match(read("src/components/Ezarri/Konfigurator/Konfigurator.js"), /-1600\.webp/);
});

test("Client-Payload: Seitentexte ideenboard.seite nur auf dem Server, Insel-Texte klein", async () => {
  const { pickClientMessages, SERVER_ONLY_SUBKEYS } = await import("../../src/components/Reusable/clientMessages.js");
  assert.ok(SERVER_ONLY_SUBKEYS.some(([ns, sub]) => ns === "ideenboard" && sub === "seite"));
  for (const l of COPY_LOCALES) {
    const c = pickClientMessages(MESSAGES[l]);
    assert.equal(c.ideenboard.seite, undefined, l);
    assert.deepEqual(Object.keys(c.ideenboard).sort(), ["add", "addAria", "added", "nav", "removedStatus", "view"], l);
    assert.ok(Buffer.byteLength(JSON.stringify({ p: c.pinterest, i: c.ideenboard })) < 560, l);
  }
  // Inseln lesen keine Seitentexte aus useMessages
  for (const f of ["src/components/Pinterest/IdeenboardPage.js", "src/components/Pinterest/CopyToMine.js"]) assert.doesNotMatch(read(f), /usePinCopy/, f);
});
