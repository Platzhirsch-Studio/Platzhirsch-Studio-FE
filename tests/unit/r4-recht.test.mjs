// tests/unit/r4-recht.test.mjs — R4-recht-consent: Dienste-Register
// (src/lib/legal/services.js) as the one source of banner and privacy-policy
// preview, gtag loading plan, ReviewNotice texts, image register, law-firm folder.
// Run: node --test tests/unit/r4-recht.test.mjs
import { test, before } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SRC = path.join(ROOT, "src");

// Next.js-style imports ("server-only", "@/…", extensionless) for plain Node.
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
    let spec = specifier;
    if (spec.startsWith("@/")) spec = pathToFileURL(path.join(SRC, spec.slice(2))).href;
    const fromSrc = spec.startsWith("file:") || ((spec.startsWith("./") || spec.startsWith("../")) && context.parentURL?.includes("/src/"));
    if (fromSrc && !/\.[cm]?js$/.test(spec)) {
      const url = new URL(spec, context.parentURL);
      for (const ext of [".js", "/index.js"]) {
        const candidate = fileURLToPath(url) + ext;
        if (fs.existsSync(candidate)) return { url: pathToFileURL(candidate).href, shortCircuit: true };
      }
    }
    return next(spec, context);
  },
});

const imp = (p) => import(pathToFileURL(path.join(SRC, p)).href);
let S, G, L, claims, concierge, portal, upload, site;
before(async () => {
  S = await imp("lib/legal/services.js");
  G = await imp("components/Cookies/googleTag.js");
  L = await imp("components/LegalDrafts/index.js");
  claims = await imp("lib/legal/claims.js");
  concierge = await imp("lib/concierge/config.js");
  portal = await imp("lib/portal/privacy.js");
  upload = await imp("lib/upload/config.js");
  site = await imp("lib/site.js");
});

const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const LOCALES = ["de", "en", "fr", "it"];

test("banner data is unchanged by the move into the register (snapshot of R3)", () => {
  // sha256 of JSON.stringify(cookieServices) as it was hard-coded in
  // cookiecomponent.js before R4 (same keys, order, cookies, countries).
  // Einblicke 29.10.2026 (QA Recht P1-1): the own heatmap "einblicke" is a new,
  // appended service; the Google entries stay byte-identical to R3.
  const google = S.BANNER_SERVICES.filter((s) => s.key !== "einblicke");
  const hash = crypto.createHash("sha256").update(JSON.stringify(S.buildCookieServices(google))).digest("hex");
  assert.equal(hash, "9c0b321b5a9d81b1ec47049bbae9d04cb34c6b75c7d58fb7680a87b17702d55a");
  assert.deepEqual(S.servicesByCategory(), {
    functional: ["googleMaps", "googleTagManager"],
    statistics: ["googleAnalytics", "einblicke"],
    marketing: ["googleAds"],
  });
  // cookie format: the banner's consent keys come from the same list (new key appended)
  assert.deepEqual(S.BANNER_SERVICES.map((s) => s.key), ["googleMaps", "googleTagManager", "googleAnalytics", "googleAds", "einblicke"]);
  const banner = read("src/components/Cookies/cookiecomponent.js");
  assert.match(banner, /buildCookieServices\(\)/);
  assert.match(banner, /servicesByCategory\(\)/);
  assert.doesNotMatch(banner, /googleMaps:\s*\{\s*id:/, "no second hard-coded service list in the banner");
});

test("banner and privacy-policy preview carry the same key set", () => {
  const ds = L.DOCS.datenschutz;
  const section = ds.sections.find((s) => s.id === "dienste");
  assert.ok(section, "appendix 'dienste' in the DSE preview");
  assert.deepEqual(section.serviceKeys, S.SERVICE_KEYS, "every register entry is in the preview");
  const bannerKeys = Object.values(S.buildCookieServices()).flatMap((c) => Object.keys(c)).sort();
  const previewBannerKeys = section.serviceKeys.filter((k) => S.getService(k).banner && S.getService(k).status === "aktiv").sort();
  assert.deepEqual(bannerKeys, previewBannerKeys);
  // every service is rendered by name, and the overview table has one row each
  const texts = section.blocks.flatMap(L.blockTexts).join("\n");
  for (const s of S.SERVICES) assert.ok(texts.includes(s.name), s.key);
  assert.equal(section.blocks[1].table.rows.length, S.SERVICES.length);
  // links of the overview go to existing sections
  const ids = new Set(ds.sections.flatMap((s) => [s.id, ...(s.sub || []).map((x) => x.id)]));
  for (const s of S.SERVICES) if (s.dseSection) assert.ok(ids.has(s.dseSection), `${s.key} → #${s.dseSection}`);
});

test("every banner service has its texts in all four languages", () => {
  for (const l of LOCALES) {
    const m = JSON.parse(read(`src/messages/${l}.json`)).Cookies;
    for (const s of S.BANNER_SERVICES) {
      // Besucher-Einblicke: own block Cookies.einblicke (not in the client copy, clientMessages.js)
      const texts = s.key === "einblicke" ? m.einblicke : m.services[s.key];
      assert.ok(texts?.description && texts?.purpose, `${l}: Cookies.services.${s.key}`);
    }
  }
});

test("register entries are complete and honest", () => {
  const STATUS = new Set(["aktiv", "labs", "nicht eingesetzt"]);
  assert.equal(new Set(S.SERVICE_KEYS).size, S.SERVICE_KEYS.length, "unique keys");
  for (const s of S.SERVICES) {
    assert.ok(STATUS.has(s.status), `${s.key}: status`);
    for (const f of ["name", "purpose", "legalBasis", "recipients", "thirdCountry", "retention"]) {
      assert.ok(typeof s[f] === "string" && s[f].trim(), `${s.key}.${f}`);
    }
    assert.ok(s.provider, `${s.key}.provider`);
    for (const c of s.code) {
      assert.ok(fs.existsSync(path.join(ROOT, c)), `${s.key}: code path ${c} exists`);
    }
    const all = [s.name, s.purpose, s.legalBasis, s.recipients, s.thirdCountry, s.retention].join(" ");
    assert.doesNotMatch(all, /abgesichert|Privacy Shield|TKG 2003/i, s.key);
    assert.deepEqual(claims.findClaims(all), [], s.key);
  }
  // the inventory covers what the code really uses
  for (const k of ["googleAnalytics", "googleAds", "googleMaps", "backoffice", "hosting", "concierge", "upload", "portal", "fonts", "youtube"]) {
    assert.ok(S.getService(k), `inventory: ${k}`);
  }
  assert.equal(S.getService("youtube").status, "nicht eingesetzt");
  assert.doesNotMatch(read("src/app/[locale]/layout.js"), /fonts\.googleapis|fonts\.gstatic/, "fonts are self-hosted");
  // open points use the drafts' bracket notation
  assert.ok(S.SERVICES.some((s) => /\[anwaltlich prüfen/.test(s.legalBasis + s.thirdCountry + s.retention + s.purpose + s.recipients)));
});

test("values quoted from server-only feature code match that code", () => {
  assert.equal(S.getService("concierge").quoted.conciergeRetentionDays, concierge.RETENTION_DAYS);
  assert.match(S.getService("concierge").retention, new RegExp(`${concierge.RETENTION_DAYS} Tage`));
  assert.equal(S.getService("portal").quoted.portalSessionDays, portal.SESSION_DAYS);
  assert.match(S.getService("portal").retention, new RegExp(`${portal.SESSION_DAYS} Tage`));
  assert.equal(S.getService("upload").quoted.uploadRetentionDays, upload.UPLOAD_CONFIG.retentionDays);
  // consent cookie: 12 months = the banner's maxAge of 365 days
  assert.match(read("src/components/Cookies/cookiecomponent.js"), /maxAge: 60 \* 60 \* 24 \* 365/);
  assert.match(S.getService("consentCookie").retention, /12 Monate/);
});

test("gtag plan: loads only with a config – GA4 with Statistik, Ads with Marketing + Ads ID", () => {
  const ids = { ga4: "G-TEST", ads: "AW-TEST" };
  const none = G.googleTagPlan({}, ids);
  assert.deepEqual(none, { load: false, src: null, configs: [] });
  assert.equal(G.googleTagPlan({ googleMaps: true, googleTagManager: true, functional: true }, ids).load, false, "functional alone loads nothing");

  const adsOnly = G.googleTagPlan({ googleAds: true }, ids);
  assert.equal(adsOnly.load, true);
  assert.deepEqual(adsOnly.configs, ["AW-TEST"]);
  assert.match(adsOnly.src, /gtag\/js\?id=AW-TEST$/);

  const adsNoId = G.googleTagPlan({ googleAds: true }, { ga4: "G-TEST", ads: "" });
  assert.deepEqual(adsNoId, { load: false, src: null, configs: [] }, "Ads only without an Ads ID: no load (QA r4 P2-1)");
  assert.equal(G.googleTagPlan({ googleAnalytics: true }, { ga4: "", ads: "" }).load, false, "no IDs: no load");
  // QA r4 P2-2: the GTM switch controls nothing – "Funktional" follows Maps
  // alone, and the DSE row states the real loading rule.
  for (const f of ["src/components/Cookies/cookiecomponent.js", "src/components/Cookies/ConsentEmbed.js"]) {
    assert.doesNotMatch(read(f), /googleMaps && (consent|next)\.googleTagManager/, f);
  }
  const gtmRow = S.dseServiceRows().find((r) => r.key === "googleTagManager");
  assert.match(gtmRow.category, /Statistik oder Marketing/);
  assert.match(gtmRow.banner, /Schalter ohne Wirkung/);

  const stats = G.googleTagPlan({ googleAnalytics: true }, ids);
  assert.deepEqual(stats.configs, ["G-TEST"]);
  assert.deepEqual(G.googleTagPlan({ googleAnalytics: true, googleAds: true }, ids).configs, ["G-TEST", "AW-TEST"]);
  // default IDs of the site
  assert.equal(S.GOOGLE_TAG_IDS.ga4, "G-1YCM6K57YG");
});

test("ReviewNotice: texts in 4 languages, same in component fallback and messages-r4-recht.json", () => {
  const msgs = JSON.parse(read("Marktresearch/digital/teamleiter/messages-r4-recht.json"));
  const component = read("src/components/Legal/ReviewNotice.js");
  for (const l of LOCALES) {
    const rn = msgs[l].ReviewNotice;
    for (const k of ["label", "summary", "link"]) {
      assert.ok(rn[k], `${l}.${k}`);
      assert.ok(component.includes(JSON.stringify(rn[k]).slice(1, -1)), `${l}.${k} in fallback`);
      assert.deepEqual(claims.findClaims(rn[k]), []);
    }
  }
  assert.match(msgs.de.ReviewNotice.summary, /Wir zeigen Google-Bewertungen\. Google prüft nicht, ob ein Kauf stattfand\./);
  assert.ok(!("Cookies" in msgs.de), "consent legal text is NOT in the messages file (law firm first)");
  const page = read("src/app/[locale]/bewerten/page.js");
  assert.match(page, /<ReviewNotice variant="link"/);
  assert.match(page, /GBP\.reviewUrl/);
  assert.match(site.GBP.reviewUrl, /^https:\/\/(maps\.google\.com\/\?cid=|search\.google\.com\/local\/writereview\?placeid=)/);
});

test("image register: CSV with open clearance for every row (except documented owner clearances)", () => {
  const csv = read("Marktresearch/recht/bildrechte.csv").replace(/^﻿/, "");
  const [head, ...rows] = csv.trim().split(/\r?\n/);
  const cols = head.split(";");
  assert.deepEqual(cols, ["quelle", "host", "pfad", "anzahl", "fundstelle", "herkunft_vermutet", "rechteinhaber", "freigabe", "umfang", "in_remotePatterns", "hinweis"]);
  assert.ok(rows.length > 100, `${rows.length} rows`);
  const sources = new Set(rows.map((r) => r.split(";")[0]));
  for (const s of ["public/", "src/lib/data", "next.config.js remotePatterns"]) assert.ok(sources.has(s), s);
  // freigabe column: naive split is fine, earlier cells never contain ';' unquoted before it
  // Inhaber-Entscheidung Nr. 11 (Mails 28.10.2026): Navetta-Bilder und
  // aboutHome.jpg sind freigegeben. Nur diese Pfade dürfen von „offen“ abweichen,
  // und nur mit Rechteinhaber, Mail-Datum und eingeschränktem Umfang.
  const cleared = (r) => /;\/labs\/yacht\/minotti-navetta42\/|;\/Images\/Home\/aboutHome\.jpg;/.test(r);
  for (const r of rows) {
    if (cleared(r)) {
      const c = r.split(";");
      assert.notEqual(c[6], "offen", `Rechteinhaber: ${c[2]}`);
      assert.match(c[7], /^erteilt – Mail 28\.10\.2026/, `freigabe: ${c[2]}`);
      assert.match(c[8], /nicht freigegeben|prüfen/, `Umfang eingeschränkt: ${c[2]}`);
    } else assert.ok(/;offen;offen;offen \(Web/.test(r), `open clearance: ${r.slice(0, 80)}`);
  }
  assert.equal(rows.filter(cleared).length, 6, "5 Navetta-Fotos + aboutHome.jpg");
});

test("law-firm folder: section 6 up to date, with DPF/SCC texts and the service list", () => {
  execFileSync(process.execPath, [path.join(ROOT, "tools/legal/services-md.mjs"), "--check"], { stdio: "pipe" });
  const md = read("Marktresearch/recht/anwalt-vorschau.md");
  const shell = JSON.parse(read("Marktresearch/digital/teamleiter/messages-r3-shell.json"));
  for (const l of LOCALES) assert.ok(md.includes(shell[l].Cookies.thirdCountryNotice), `${l}: thirdCountryNotice`);
  assert.match(md, /Data Privacy Framework/);
  for (const s of S.SERVICES) assert.ok(md.includes(s.name), s.key);
});
