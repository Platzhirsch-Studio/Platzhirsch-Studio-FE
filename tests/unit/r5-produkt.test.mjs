// R5-produkt: neutral surface instead of an unrelated stock photo (P1),
// backoffice failure ≠ "not found" on the product detail (P2), brand ×
// category crumb via the shared marken rule, lighter gallery (TBT).
// Run: node --test tests/unit/r5-produkt.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { fetchProduktDetail } from "../../src/lib/api/produktDetail.js";
import { BackofficeError, backofficeFetch } from "../../src/lib/api/http.js";
import { NO_PHOTO_TEXT, noPhotoLabel, noPhotoOgPath } from "../../src/lib/shop/noPhoto.js";
import { findClaims } from "../../src/lib/legal/claims.js";

const read = (rel) => fs.readFileSync(new URL(`../../${rel}`, import.meta.url), "utf8");
const URL_ =
  "https://backoffice.example/api/method/platzhirsch_studio.platzhirsch_studio.doctype.produkte_new.api.get_produkt_by_path_field_api?path_field=x&lang=de";
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const quiet = { info() {}, warn() {}, error() {}, log() {} };

// Mocked backofficeFetch: records the options and answers with `answer`.
function mockFetcher(answer) {
  const calls = [];
  const fetcher = async (url, options) => {
    calls.push({ url, options });
    return typeof answer === "function" ? answer() : answer;
  };
  return { fetcher, calls };
}

// ------------------------------------------------------------- P2: detail

test("1 P2 gefunden: Datensatz kommt zurück, Cache-Optionen gehen durch, critical aus", async () => {
  const { fetcher, calls } = mockFetcher(json({ message: { name: "p1", status: "Aktiv" } }));
  const detail = await fetchProduktDetail(URL_, { fetcher, next: { revalidate: 3600, tags: ["products"] }, timeoutMs: 7000 });
  assert.deepEqual(detail, { name: "p1", status: "Aktiv" });
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].options.next, { revalidate: 3600, tags: ["products"] });
  assert.equal(calls[0].options.critical, false);
  assert.equal(calls[0].options.method, "GET");
});

test("2 P2 nicht gefunden: {} (Frappe-Antwort für unbekannten path_field), leere message, 404 → null", async () => {
  for (const answer of [json({}), json({ message: {} }), json({ message: null }), json({ message: "" }), new Response("nope", { status: 404 })]) {
    const { fetcher } = mockFetcher(answer);
    assert.equal(await fetchProduktDetail(URL_, { fetcher }), null);
  }
});

test("3 P2 Fehler: Timeout/Netzfehler werfen BackofficeError (→ error.js, 500), kein null", async () => {
  const timeout = Object.assign(new Error("The operation was aborted due to timeout"), { name: "TimeoutError" });
  const network = new TypeError("fetch failed");
  for (const [err, reason] of [[timeout, "timeout"], [network, "network_error"]]) {
    const { fetcher } = mockFetcher(() => {
      throw err;
    });
    await assert.rejects(fetchProduktDetail(URL_, { fetcher }), (e) => e instanceof BackofficeError && e.reason === reason && e.cause === err);
  }
  // A BackofficeError from below is passed on unchanged.
  const own = new BackofficeError("x", { reason: "timeout" });
  const { fetcher } = mockFetcher(() => {
    throw own;
  });
  await assert.rejects(fetchProduktDetail(URL_, { fetcher }), (e) => e === own);
});

test("4 P2 Fehler: 5xx, andere 4xx, kaputtes JSON und fremde Nutzlast werfen", async () => {
  for (const status of [500, 502, 503, 504, 403, 429]) {
    const { fetcher } = mockFetcher(new Response("x", { status }));
    await assert.rejects(fetchProduktDetail(URL_, { fetcher }), (e) => e instanceof BackofficeError && e.status === status && e.reason === "http_error");
  }
  const broken = mockFetcher(new Response("<html>gateway</html>", { status: 200 }));
  await assert.rejects(fetchProduktDetail(URL_, { fetcher: broken.fetcher }), (e) => e.reason === "invalid_json");
  for (const message of [["a"], "text", 42]) {
    const odd = mockFetcher(json({ message }));
    await assert.rejects(fetchProduktDetail(URL_, { fetcher: odd.fetcher }), (e) => e.reason === "unexpected_payload");
  }
});

test("5 P2 mit echtem backofficeFetch: Timeout nach Retry wirft, 503×2 wirft, 200 {} ist null", async () => {
  const base = { dedupe: false, logger: quiet, retryDelayMs: 1, minAttemptMs: 1 };
  let n = 0;
  const hang = (url, init) =>
    new Promise((_, reject) => {
      n += 1;
      init.signal.addEventListener("abort", () => reject(init.signal.reason));
    });
  await assert.rejects(
    fetchProduktDetail(URL_, { ...base, fetchImpl: hang, timeoutMs: 30, budgetMs: 500 }),
    (e) => e instanceof BackofficeError && e.reason === "timeout"
  );
  assert.equal(n, 2, "ein Retry innerhalb des Budgets");

  let m = 0;
  const down = async () => {
    m += 1;
    return new Response("x", { status: 503 });
  };
  await assert.rejects(fetchProduktDetail(URL_, { ...base, fetchImpl: down }), (e) => e.status === 503);
  assert.equal(m, 2);

  const empty = async () => json({});
  assert.equal(await fetchProduktDetail(URL_, { ...base, fetchImpl: empty }), null);
  assert.equal(typeof backofficeFetch, "function");
});

test("6 P2 Verdrahtung: nur das Detail ist streng, Katalog/Sitemap/Suche behalten ihren Fallback", () => {
  const src = read("src/lib/api/fetchAllProdukte.js");
  const detail = src.slice(src.indexOf("export async function fetchProduktNewByPathField"));
  assert.match(detail.slice(0, 600), /return fetchProduktDetail\(/);
  assert.match(detail.slice(0, 600), /next: \{ revalidate: 3600, tags: \["products"\] \}/);
  // Catalogue, sitemap, search and related keep the soft fallback ([]).
  for (const fn of ["fetchProdukteByKategorie", "fetchProduktePaths", "fetchProdukteNewByMarke", "searchProdukte", "fetchKategorienWithCounts", "fetchRelatedProdukteNew"]) {
    const body = src.slice(src.indexOf(`export async function ${fn}`)).slice(0, 700);
    assert.match(body, /getMessage\(/, fn);
    assert.match(body, /fallback: \[\]/, fn);
  }
  // Home strip keeps its own soft catch; the product page lets errors through.
  assert.match(read("src/components/ProuductSectionHome/ProuductSectionHome.js"), /fetchProduktNewByPathField\(c\.slug, "de"\)\.catch\(\(\) => null\)/);
  const page = read("src/app/[locale]/produkte/[category]/[product]/page.js");
  assert.doesNotMatch(page, /fetchProduktNewByPathField\([^)]*\)\.catch/);
  assert.match(page, /if \(!detail \|\| detail\.status !== "Aktiv"\) \{\s*await redirectLegacyProductUrl/);
});

// ------------------------------------------------------------- P1: no photo

test("7 P1 Texte: 4 Sprachen, identisch mit messages-r5-produkt.json, ohne Claim-Funde", () => {
  const msgs = JSON.parse(read("Marktresearch/digital/teamleiter/messages-r5-produkt.json"));
  for (const l of ["de", "en", "fr", "it"]) {
    assert.equal(msgs[l].shop.atelier.noPhoto, NO_PHOTO_TEXT[l], l);
    assert.equal(noPhotoLabel(l), NO_PHOTO_TEXT[l]);
    assert.deepEqual(findClaims(NO_PHOTO_TEXT[l]), []);
  }
  assert.equal(NO_PHOTO_TEXT.de, "Für dieses Stück liegt noch kein Foto vor");
  assert.equal(noPhotoLabel("xx"), NO_PHOTO_TEXT.de);
  assert.doesNotMatch(NO_PHOTO_TEXT.it, /\b(Lei|Suo|tu|tuo|voi)\b/);
});

test("8 P1 t.has-Fallback: Messages gewinnen, sonst Modultext; Fehler im t() fallen zurück", () => {
  const t = Object.assign((k) => `msg:${k}`, { has: (k) => k === "atelier.noPhoto" });
  assert.equal(noPhotoLabel("de", t), "msg:atelier.noPhoto");
  const without = Object.assign(() => "nie", { has: () => false });
  assert.equal(noPhotoLabel("fr", without), NO_PHOTO_TEXT.fr);
  const throwing = Object.assign(() => "nie", { has: () => { throw new Error("x"); } });
  assert.equal(noPhotoLabel("it", throwing), NO_PHOTO_TEXT.it);
  assert.equal(noPhotoLabel("en", undefined), NO_PHOTO_TEXT.en);
});

test("9 P1 kein Fremdfoto: Produktseite, Kachel, OG und JSON-LD", () => {
  const page = read("src/app/[locale]/produkte/[category]/[product]/page.js");
  const tile = read("src/components/ShopCatalog/catalogTile.js");
  for (const [name, src] of [["page", page], ["tile", tile]]) {
    assert.doesNotMatch(src, /fallback-banner|fallback-og|aboutHome/, name);
  }
  assert.match(page, /<NoPhoto\s+label=\{noPhotoLabel\(locale, t\)\}/);
  assert.match(page, /className="aspect-\[3\/2\] w-full max-sm:max-h-\[28svh\] max-sm:\[@media\(max-height:600px\)\]:max-h-\[18svh\]"/);
  // iPhone SE (568 px): smaller stage + no trail on short phones, same in the gallery.
  assert.match(page, /lg:pt-\[var\(--ph-page-top-lg,3rem\)\] max-sm:\[@media\(max-height:600px\)\]:hidden"/);
  assert.match(read("src/components/ShopCatalog/productGallery.js"), /max-sm:max-h-\[28svh\] max-sm:\[@media\(max-height:600px\)\]:max-h-\[18svh\]/);
  assert.match(page, /image: product\.images\[0\] \|\| noPhotoOgPath\(locale\)/);
  assert.match(tile, /<NoPhoto label=\{noPhotoText \|\| noPhotoLabel\(locale\)\} className="absolute inset-0" \/>/);
  assert.match(read("src/components/ShopCatalog/shopCatalog.js"), /noPhotoText=\{noPhotoText\}/);
  // No manufacturer image URL as stand-in.
  assert.doesNotMatch(read("src/components/ShopCatalog/noPhoto.js"), /https?:\/\//);
  // JSON-LD: productSchema drops `image` when there is none (no stand-in).
  const sd = read("src/lib/seo/structuredData.js");
  assert.match(sd, /\.\.\.\(images\.length \? \{ image: images \} : \{\}\)/);
  // The client catalogue never pulls the 13 KB wordmark path.
  assert.doesNotMatch(read("src/components/ShopCatalog/noPhoto.js"), /^import/m);
});

test("10 P1 OG-Bild: statische Route je Sprache, Pfad am Proxy vorbei", () => {
  assert.equal(noPhotoOgPath("it"), "/it/produkte/kein-foto.png");
  assert.equal(noPhotoOgPath("xx"), "/de/produkte/kein-foto.png");
  const route = read("src/app/[locale]/produkte/kein-foto.png/route.js");
  assert.match(route, /export const dynamic = "force-static";/);
  assert.match(route, /export const dynamicParams = false;/);
  assert.match(route, /LOCALES = \["de", "en", "fr", "it"\]/);
  assert.match(route, /NO_PHOTO_TEXT\[locale\]/);
  assert.doesNotMatch(route, /<img|https?:\/\/(?!.*w3)/);
  // The proxy matcher skips dotted paths, so /it/produkte/… is not rewritten.
  assert.match(read("src/proxy.js"), /\.\*\\\\\.\.\*/);
});

// ------------------------------------------------------------- crumb, gallery

test("11 Brotkrume nur über getIndexableBrandCategoryHref (Import aus src/lib/marken)", () => {
  const page = read("src/app/[locale]/produkte/[category]/[product]/page.js");
  assert.match(page, /import \{ getIndexableBrandCategoryHref \} from "@\/lib\/marken\/brandCategoryLoader";/);
  assert.match(page, /getIndexableBrandCategoryHref\(detail\.marken, product\.categoryKey, locale\)\.catch\(\(\) => null\)/);
  assert.doesNotMatch(page, /buildBrandCategories|withoutNonProducts|function brandCategoryCrumb/);
  assert.match(page, /brandCategory \? \{ label: brandCategoryLabel, href: brandCategory \} : null/);
  assert.match(page, /brandCategory \? \{ name: brandCategoryLabel, url: localeUrl\(locale, brandCategory\) \} : null/);
});

test("12 Galerie-TBT: kein Embla auf der Bühne, Lightbox als eigener Chunk, Thumbnails nach idle", () => {
  const gallery = read("src/components/ShopCatalog/productGallery.js");
  assert.doesNotMatch(gallery, /from "embla-carousel-react"|useEmblaCarousel/);
  assert.match(gallery, /const ProductLightbox = dynamic\(loadLightbox, \{ ssr: false \}\);/);
  assert.match(gallery, /\{lightbox && \(\s*<ProductLightbox/);
  assert.match(gallery, /requestIdleCallback/);
  // QM wm-r4: Thumbnails 5 rem (Freisteller waren in 64 px kaum erkennbar).
  assert.match(gallery, /aria-hidden="true" className="mt-3 hidden h-\[calc\(5rem\+4px\)\] sm:block"/);
  assert.match(gallery, /preload=\{i === 0 \? true : undefined\}/);
  assert.match(gallery, /const STAGE_QUALITY = 75;/);
  const lightbox = read("src/components/ShopCatalog/productLightbox.js");
  assert.match(lightbox, /dialog\.showModal\(\)/);
  assert.match(lightbox, /ZoomIn/);
  assert.doesNotMatch(gallery, /ZoomIn|ZoomOut/);
});

test("13 Keine Preise, kein offers", () => {
  const page = read("src/app/[locale]/produkte/[category]/[product]/page.js");
  assert.doesNotMatch(page, /"offers"|offers:|priceCurrency|"price":/);
});
