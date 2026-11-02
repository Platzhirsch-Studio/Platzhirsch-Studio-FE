// Runde 4, Fix-Team P4 „Performance, Shell und Navigation, Build-Robustheit“:
//   technik P1-1 (Bodensee-Licht: Poster, 3D erst bei Interaktion, Worker),
//   technik P1-2 (RSC: Mega-Menü ohne HTML-Prop, kein Prefetch auf /beratung),
//   technik P1-3c (r8-seo-footer live nur mit LIVE_URL), P1-5 (apiBaseUrl),
//   technik P2 (csp-report 413), ux P1-3/P1-5 (Menü: Outdoor, Upload,
//   ?thema= je Raum, Concierge nur mit Schlüssel).
//   node --test tests/unit/r5-perf-shell.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { registerHooks } from "node:module";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const code = (p) => read(p).split("\n").filter((l) => !l.trim().startsWith("//")).join("\n");

registerHooks({
  resolve(specifier, context, nextResolve) {
    let file;
    if (specifier.startsWith("@/")) file = path.join(ROOT, "src", specifier.slice(2));
    else if (specifier.startsWith(".") && context.parentURL?.includes("/src/") && !path.extname(specifier)) {
      file = path.join(path.dirname(fileURLToPath(context.parentURL)), specifier);
    } else return nextResolve(specifier, context);
    const cand = [file, `${file}.js`, path.join(file, "index.js")].find((p) => fs.existsSync(p) && fs.statSync(p).isFile());
    return nextResolve(pathToFileURL(cand || `${file}.js`).href, context);
  },
});

const { buildRooms, navFeatures, NAV_NOINDEX } = await import("../../src/components/Navbar/shellNav.js");
const { desktopRooms, megaPanelHtml } = await import("../../src/components/Navbar/megaPanelHtml.js");
const { POST } = await import("../../src/app/api/csp-report/route.js");
const poster = await import("../../src/lib/licht/poster.js");
const { lichtDaten, datenSchluessel } = await import("../../src/lib/licht/rechner.js");
const { ortVon, parseLicht, sonneVon } = await import("../../src/lib/licht/zustand.js");
const sonne = await import("../../src/lib/licht/sonne.js");

const c = (k) => k;
const PROD = { raw: {}, nodeEnv: "production", ezarri: true, showroom: false };
const links = (rooms, id) => rooms.find((r) => r.id === id).columns.flatMap((col) => col.links);

// ------------------------------------------------------------ Menü

test("Menü: Outdoor-Gartenplanung unter Outdoor, Upload unter Service, Beratung je Raum mit ?thema=", () => {
  const de = buildRooms({ locale: "de", groups: [], c, features: navFeatures(PROD) });
  const outdoor = links(de, "outdoor");
  assert.ok(outdoor.some((l) => l.href === "/outdoor-gartenplanung" && l.label === "Garten & Terrasse planen"));
  assert.ok(outdoor.some((l) => l.href === "/beratung?thema=outdoor"), "Outdoor → Wizard-Thema outdoor");
  assert.ok(links(de, "kitchen").some((l) => l.href === "/beratung?thema=kueche"), "Küche → Wizard-Thema kueche");
  assert.ok(links(de, "services").some((l) => l.href === "/upload"));
  // Themen-Keys aus dem Wizard (STEP1_KEYS).
  const wizard = read("src/lib/forms/beratungContext.js");
  for (const k of ["kueche", "outdoor"]) assert.match(wizard, new RegExp(`"${k}"`));
  assert.deepEqual([...NAV_NOINDEX], ["/showroom"]);
});

test("Menü: Upload nur bei aktivem Upload-Schalter, Outdoor bleibt", () => {
  const off = buildRooms({ locale: "de", groups: [], c, features: navFeatures({ ...PROD, raw: { upload: "0" } }) });
  const all = off.flatMap((r) => r.columns.flatMap((col) => col.links));
  assert.ok(!all.some((l) => l.href === "/upload"));
  assert.ok(all.some((l) => l.href === "/outdoor-gartenplanung"));
});

test("Menü: Concierge nur, wenn navbar.js ihn freigibt (ANTHROPIC_API_KEY)", () => {
  const ohne = buildRooms({ locale: "de", groups: [], c, features: navFeatures(PROD), concierge: false });
  const mit = buildRooms({ locale: "de", groups: [], c, features: navFeatures(PROD), concierge: true });
  assert.ok(!links(ohne, "services").some((l) => l.href === "/concierge"));
  assert.ok(links(mit, "services").some((l) => l.href === "/concierge"));
  const nb = code("src/components/Navbar/navbar.js");
  assert.match(nb, /import \{ getMode, isAvailable \} from "@\/lib\/concierge\/config"/);
  assert.match(nb, /getMode\(\) === "live" && isAvailable\(\)/);
  assert.match(nb, /concierge: conciergeInMenu\(\)/);
});

test("Mega-Menü: schlanke Daten im Payload, Markup erst beim Öffnen, eine Kopie für beide Inseln", () => {
  const de = buildRooms({ locale: "de", groups: [], c, features: navFeatures(PROD) });
  const slim = desktopRooms(de);
  for (const r of slim) assert.equal(r.html, undefined, r.id);
  const html = megaPanelHtml(slim.find((r) => r.id === "outdoor"), "de");
  assert.match(html, /href="\/de\/outdoor-gartenplanung" data-nav-path="\/outdoor-gartenplanung"/);
  assert.match(html, /href="\/de\/beratung\?thema=outdoor"/);
  const nb = code("src/components/Navbar/navbar.js");
  assert.match(nb, /<DesktopNav rooms=\{navRooms\}/);
  assert.match(nb, /<MobileMenu rooms=\{navRooms\}/);
  // Payload-Größe der Menüdaten: deutlich unter der alten HTML-Kopie (≈ 38 KB).
  assert.ok(JSON.stringify(slim).length < 12_000, `${JSON.stringify(slim).length} B`);
});

test("Kein Prefetch auf /beratung aus Header, Mobilmenü und Termin-Band", () => {
  const cta = code("src/components/Navbar/HeaderCta.js");
  assert.equal((cta.match(/<Button href=\{contextual\} prefetch=\{false\}/g) || []).length, 2);
  assert.match(code("src/components/Navbar/MobileMenu.js"), /<Button href=\{contextualTermin\} prefetch=\{false\}/);
});

// Bewusst geändert (QM shell-home 01.11.2026): keine Kompaktform mehr – ab 768 px ein
// senkrechter Rand-Reiter (40 px, im Seitenrand) mit immer derselben Beschriftung.
test("Concierge-Knopf: gleiche Beschriftung überall, Rand-Reiter ab 768 px", () => {
  const launcher = read("src/components/Concierge/Launcher.js");
  assert.match(launcher, /data-concierge-launcher=""/);
  assert.doesNotMatch(launcher, /data-compact/);
  const css = read("src/components/Concierge/launcher.module.css");
  assert.doesNotMatch(css, /data-compact/);
  assert.match(css, /@media \(min-width: 768px\) \{\s*\.btn \{\s*right: env\(safe-area-inset-right, 0px\);\s*writing-mode: vertical-rl;\s*width: 40px;/);
});

// ------------------------------------------------------------ csp-report

const req = (body, headers = {}) => new Request("http://localhost/api/csp-report", { method: "POST", body, headers, duplex: "half" });

test("csp-report: > 16 KB → 413 (Header und Stream), gültige Meldung → 204", async () => {
  const big = "a".repeat(20 * 1024);
  assert.equal((await POST(req(big, { "content-length": String(big.length) }))).status, 413);
  // Ohne Content-Length (chunked): der Stream wird nach 16 KB abgebrochen.
  const stream = new ReadableStream({
    start(ctrl) {
      for (let i = 0; i < 40; i++) ctrl.enqueue(new TextEncoder().encode("x".repeat(1024)));
      ctrl.close();
    },
  });
  assert.equal((await POST(req(stream))).status, 413);
  const ok = JSON.stringify({ "csp-report": { "effective-directive": "img-src", "blocked-uri": "https://x.example/a", "document-uri": "https://platzhirsch.studio/de" } });
  const warn = console.warn;
  console.warn = () => {};
  try {
    const res = await POST(req(ok, { "content-type": "application/csp-report" }));
    assert.equal(res.status, 204);
    assert.equal(res.headers.get("cache-control"), "no-store");
    assert.equal((await POST(req("kein json"))).status, 204);
  } finally {
    console.warn = warn;
  }
});

// ------------------------------------------------------------ apiBaseUrl

test("apiBaseUrl: ohne SERVER dokumentierter Standard statt interner Dev-IP", async () => {
  const src = read("src/lib/apiBaseUrl.js");
  assert.doesNotMatch(code("src/lib/apiBaseUrl.js"), /10\.30\.70\.201/);
  assert.match(src, /DEFAULT_BACKOFFICE = "https:\/\/backoffice\.platzhirsch\.studio"/);
  const saved = process.env.SERVER;
  delete process.env.SERVER;
  try {
    const m = await import(`../../src/lib/apiBaseUrl.js?ohne=${Date.now()}`);
    assert.equal(m.NEW_API_SERVER, "https://backoffice.platzhirsch.studio");
    assert.equal(m.NEW_API_BASE_URL, "https://backoffice.platzhirsch.studio/api/method/");
    process.env.SERVER = "https://dev.example/";
    const m2 = await import(`../../src/lib/apiBaseUrl.js?mit=${Date.now()}`);
    assert.equal(m2.NEW_API_SERVER, "https://dev.example");
  } finally {
    if (saved === undefined) delete process.env.SERVER;
    else process.env.SERVER = saved;
  }
});

// ------------------------------------------------------------ Bodensee-Licht

test("Licht: Poster für jeden Zustand vorhanden, Text kennzeichnet die Berechnung", () => {
  const dir = path.join(ROOT, "public/licht/poster");
  for (const s of poster.POSTER_SZENEN)
    for (const t of poster.POSTER_TAGE)
      for (const h of poster.POSTER_STUNDEN)
        for (const b of poster.POSTER_BREITEN) {
          const f = path.join(ROOT, "public", poster.posterDatei(s, t.id, h, b));
          assert.ok(fs.existsSync(f), f);
          assert.ok(fs.statSync(f).size < 160_000, `${f}: ${fs.statSync(f).size} B`);
        }
  assert.ok(fs.existsSync(dir));
  const p = poster.posterFuer(parseLicht({ ort: "lochau", fenster: "225", datum: "2026-06-21", zeit: "10:00" }));
  assert.equal(p.genau, true);
  assert.equal(p.src, "/licht/poster/kueche-juni-10-640.webp");
  assert.match(p.text, /^Berechnete Darstellung, kein Foto: Lochau/);
  const w = poster.posterFuer(parseLicht({ ort: "ulm", datum: "2026-12-10", zeit: "23:30", szene: "pool" }));
  assert.equal(w.genau, false);
  assert.equal(w.src, "/licht/poster/pool-dezember-21-640.webp");
  assert.equal(poster.posterTag("2026-09-23").id, "maerz");
  assert.equal(poster.posterStunde(5 * 60), 6);
});

test("Licht: Worker-Rechnung = direkte Rechnung, Server liefert das erste Ergebnis", () => {
  const z = parseLicht({ ort: "chur", fenster: "135", datum: "2026-12-21", zeit: "08:30" });
  const d = lichtDaten(z);
  assert.deepEqual(d.sonne, sonneVon(z));
  assert.deepEqual(d.bahn, sonne.sonnenBahn(ortVon(z), z.datum, 10));
  assert.deepEqual(d.fensterZeiten, sonne.sonnenZeitenFenster(ortVon(z), z.datum, z.fenster));
  assert.equal(d.schluessel, datenSchluessel(z));
  assert.deepEqual(structuredClone(d), d, "strukturiert kopierbar (postMessage)");
  const w = read("src/lib/licht/rechner.worker.js");
  assert.match(w, /self\.postMessage\(\{ id, daten: lichtDaten\(z\) \}\)/);
  const hook = read("src/components/Licht/useLichtDaten.js");
  assert.match(hook, /new Worker\(new URL\("\.\.\/\.\.\/lib\/licht\/rechner\.worker\.js", import\.meta\.url\), \{ type: "module" \}\)/);
  const page = read("src/app/[locale]/bodensee-licht/page.js");
  assert.match(page, /startDaten = lichtDaten\(start\)/);
  assert.match(page, /preload\(poster\.src, \{ as: "image", fetchPriority: "high"/);
});

test("Licht: three.js erst nach Interaktion bzw. Desktop sichtbar + Leerlauf, Poster im Server-HTML", () => {
  const s = code("src/components/Licht/LichtSeite.js");
  assert.match(s, /const zeigeSzene = gl === "an" && aktiv;/);
  assert.match(s, /new IntersectionObserver/);
  assert.match(s, /requestIdleCallback/);
  assert.match(s, /\(min-width: 1024px\) and \(pointer: fine\)/);
  assert.match(s, /data-licht-poster=""/);
  assert.match(s, /fetchPriority="high"/);
  assert.match(s, /data-licht-bildtext=""/);
  assert.doesNotMatch(s, /sonnenBahn\(|sonnenZeitenFenster\(/, "keine Bahnrechnung im Hauptthread");
  assert.match(s, /const ladeSzene = \(\) => import\("\.\/LichtSzene"\);/);
  assert.doesNotMatch(s, /next\/dynamic/, "kein vorab geladener Chunk");
});

// ------------------------------------------------------------ Tests

test("r8-seo-footer: Live-Teil nur mit LIVE_URL, 30 s je Abruf, 3 min je Test", () => {
  const s = read("tests/unit/r8-seo-footer.test.mjs");
  assert.match(s, /const LIVE = process\.env\.LIVE_URL \|\| process\.env\.SITEMAP_BASE \|\| "";/);
  assert.match(s, /const FETCH_MS = 30_000;/);
  assert.match(s, /const TEST_MS = 180_000;/);
  assert.doesNotMatch(s, /1800000|300000|AbortSignal\.timeout\(180000\)/);
});
