// backoffice/tools/qa/budget.mjs – Leistungsbudgets je Route (MASTER Q-L2, Hinweise zu Q-L1).
//
//   node tools/qa/budget.mjs [ausgabeordner] [--nur <muster>] [--basis http://localhost:3100]
//                            [--vergleich <alter budget.json>] [--schwelle-kb 10] [--streng]
//
// Warum über das Netzwerk: Im Dev-Modus (Turbopack) gibt es keine Build-Ausgabe in .next, aus
// der sich die Bundle-Größe je Route lesen ließe. Das Werkzeug lädt daher jede Route in einem
// frischen Chromium-Kontext (leerer Cache, Sitzung des Demo-Admins) und zählt, was über die
// Leitung kommt: Bytes je Ressource (gzip, wie übertragen; ohne Komprimierung wird gzip selbst
// gerechnet), getrennt nach JS, CSS, Dokument, RSC/Fetch, Schriften, Bilder.
//
// Budgets (Q-L2): JS gzip ≤ 180 kB je Route, Kassa (/kassa…) ≤ 250 kB, CSS gzip ≤ 60 kB
// (kB = 1000 Byte, wie in der Build-Ausgabe von Next).
//
// Bewertung je Modus (automatisch erkannt):
//   Build (`next start`): Summen gegen Budget → „eingehalten“ / „verletzt“ (Exit 1 bei Verstoß).
//   Dev (`next dev`):     Dev-Werkzeuge (next-devtools, HMR-Client) werden abgezogen. Der Rest ist
//                         nicht minifiziert und enthält React im Development-Build, ist also größer
//                         als im Build. Liegt er trotzdem im Budget → „eingehalten“ (sicher);
//                         sonst „im Build prüfen“ – kein Verstoß, aber kein Nachweis. Zusätzlich
//                         wird der Anteil „App + Bibliotheken“ (ohne Next/React-Laufzeit)
//                         ausgewiesen; er taugt im Dev zum Vergleich zwischen Läufen.
//   --vergleich <budget.json> zeigt je Route die Veränderung gegenüber einem früheren Lauf und
//   markiert Zuwachs über --schwelle-kb (Standard 10 kB, gzip).
//   --streng: im Dev auch „im Build prüfen“ und markierten Zuwachs als Fehler werten (Exit 1).
//
// Zeiten (Q-L1, nur Hinweis): Server-Antwort (TTFB), Antwort-Ende, DOMContentLoaded, load und
// LCP aus der Navigation-Timing-API – nach einem Vorlauf je Route (Turbopack kompiliert beim
// ersten Aufruf). Im Dev nicht abnahmefähig.
//
// Wiederverwendbar in Playwright-Specs:
//   import { messeSeite, bewerte } from "../../tools/qa/budget.mjs";
//   const m = await messeSeite(page, "/kassa");  expect(bewerte(m, "/kassa").js.status).not.toBe("verletzt");
//
// Umgebung: QA_EMAIL / QA_PASSWORT (Standard admin@demo.local / demo), BASE_URL.
// Startet keinen Server; der Dev-Server :3100 (Mock-Modus) muss laufen. Kein Zugriff auf
// andere Systeme als die angegebene Basis.

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath, pathToFileURL } from "node:url";

const KB = 1000;

/** Budgets in Byte (gzip). */
export const BUDGETS = Object.freeze({ js: 180 * KB, jsKassa: 250 * KB, css: 60 * KB });

/** Budget einer Route. Kassa-Kiosk (/kassa, /kassa/…) hat das größere JS-Budget. */
export function budgetFuer(pfad) {
  const p = String(pfad || "").split("?")[0];
  const kassa = /^\/kassa(\/|$)/.test(p);
  return { js: kassa ? BUDGETS.jsKassa : BUDGETS.js, css: BUDGETS.css, kassa };
}

/** Art einer Ressource aus Playwright-resourceType, Content-Type und URL. */
export function artVon(url, typ = "", contentType = "") {
  const u = String(url).split("?")[0];
  if (typ === "document") return "dokument";
  if (typ === "script" || /\.m?js$/.test(u)) return "js";
  if (typ === "stylesheet" || /\.css$/.test(u)) return "css";
  if (typ === "font" || /\.(woff2?|ttf|otf)$/.test(u)) return "schrift";
  if (typ === "image" || /\.(png|jpe?g|webp|avif|gif|svg|ico)$/.test(u)) return "bild";
  if (typ === "fetch" || typ === "xhr" || /text\/x-component/.test(contentType)) return "rsc";
  return "andere";
}

/**
 * Herkunft eines JS-Chunks (nur im Dev aussagekräftig, dort tragen Turbopack-Chunks
 * sprechende Namen; im Build sind es Hashes → „unbekannt“).
 *   dev-werkzeug  nur im Dev geladen (next-devtools, HMR-Client, React-Refresh)
 *   framework     Next.js-Client, React/React-DOM, Turbopack-Laufzeit, swc-Helfer
 *   app           Code aus backoffice/src
 *   bibliothek    sonstige node_modules (lucide-react, zod, …)
 */
export function herkunftVon(url) {
  let u = String(url).split("?")[0];
  try {
    u = decodeURIComponent(u);
  } catch {
    /* roh lassen */
  }
  const datei = u.slice(u.lastIndexOf("/") + 1);
  if (/next-devtools|hmr-client|react-refresh|__nextjs|_dev_overlay|dev-overlay/i.test(datei)) return "dev-werkzeug";
  if (/^\[turbopack\]|^turbopack-/.test(datei)) return "framework";
  if (/node_modules_next_|_next_dist_|react-dom|react-server-dom|node_modules_react_|@swc_helpers|scheduler/.test(datei)) return "framework";
  if (/^backoffice_/.test(datei)) return "app";
  if (/node_modules_/.test(datei)) return "bibliothek";
  return "unbekannt";
}

/** Dev-Modus erkannt, wenn Dev-Werkzeuge geladen wurden. */
export function istDev(eintraege) {
  return eintraege.some((e) => e.herkunft === "dev-werkzeug");
}

function summe(eintraege, filter) {
  return eintraege.filter(filter).reduce((s, e) => s + (e.gzip || 0), 0);
}

/** Summen einer Messung (Byte gzip bzw. übertragen). */
export function summen(eintraege) {
  const ohneDev = (e) => e.herkunft !== "dev-werkzeug";
  return {
    anfragen: eintraege.length,
    uebertragen: eintraege.reduce((s, e) => s + (e.uebertragen || 0), 0),
    js: summe(eintraege, (e) => e.art === "js" && ohneDev(e)),
    jsDevWerkzeug: summe(eintraege, (e) => e.art === "js" && !ohneDev(e)),
    jsAppBibliothek: summe(eintraege, (e) => e.art === "js" && (e.herkunft === "app" || e.herkunft === "bibliothek")),
    css: summe(eintraege, (e) => e.art === "css" && ohneDev(e)),
    dokument: summe(eintraege, (e) => e.art === "dokument"),
    rsc: summe(eintraege, (e) => e.art === "rsc"),
    schrift: summe(eintraege, (e) => e.art === "schrift"),
    bild: summe(eintraege, (e) => e.art === "bild"),
  };
}

/**
 * Bewertung einer Messung gegen das Budget der Route.
 * Status: „eingehalten“ | „verletzt“ (nur Build) | „im Build prüfen“ (nur Dev, über Budget).
 */
export function bewerte(messung, pfad) {
  const dev = istDev(messung.eintraege);
  const s = summen(messung.eintraege);
  const b = budgetFuer(pfad);
  const urteil = (wert, grenze) => (wert <= grenze ? "eingehalten" : dev ? "im Build prüfen" : "verletzt");
  return {
    modus: dev ? "dev" : "build",
    summen: s,
    js: { bytes: s.js, budget: b.js, status: urteil(s.js, b.js) },
    css: { bytes: s.css, budget: b.css, status: urteil(s.css, b.css) },
  };
}

function gzipLaenge(buf) {
  try {
    return zlib.gzipSync(buf).length;
  } catch {
    return buf.length;
  }
}

/**
 * Lädt `url` in `page` und misst alle Antworten bis zur Netzwerkruhe.
 * Die Seite sollte aus einem frischen Kontext stammen (leerer Cache), sonst fehlen Ressourcen.
 */
export async function messeSeite(page, url, { ruheMs = 10_000, timeout = 180_000 } = {}) {
  const eintraege = [];
  const offen = [];
  const beiFertig = (req) => {
    offen.push(
      (async () => {
        const res = await req.response().catch(() => null);
        if (!res) return;
        const sizes = await req.sizes().catch(() => null);
        const kopf = res.headers();
        const ct = kopf["content-type"] || "";
        const enc = (kopf["content-encoding"] || "").toLowerCase();
        const art = artVon(req.url(), req.resourceType(), ct);
        const uebertragen = sizes ? sizes.responseBodySize + sizes.responseHeadersSize : 0;
        let roh = null;
        let gzip = sizes ? sizes.responseBodySize : 0;
        if (art === "js" || art === "css" || art === "dokument" || art === "rsc") {
          const body = await res.body().catch(() => null);
          if (body) {
            roh = body.length;
            // gzip/br/zstd: übertragene Größe zählt. Unkomprimiert: gzip-Äquivalent rechnen.
            if (!enc || enc === "identity") gzip = gzipLaenge(body);
          }
        }
        eintraege.push({
          url: req.url(),
          art,
          herkunft: art === "js" ? herkunftVon(req.url()) : "-",
          status: res.status(),
          kodierung: enc || "-",
          gzip,
          roh,
          uebertragen,
        });
      })(),
    );
  };
  page.on("requestfinished", beiFertig);
  const antwort = await page.goto(url, { waitUntil: "load", timeout });
  await page.waitForLoadState("networkidle", { timeout: ruheMs }).catch(() => {});
  await page.waitForTimeout(300);
  page.off("requestfinished", beiFertig);
  await Promise.all(offen);
  const zeiten = await page
    .evaluate(
      () =>
        new Promise((fertig) => {
          const n = performance.getEntriesByType("navigation")[0];
          const basis = n
            ? { ttfb: n.responseStart, antwortEnde: n.responseEnd, dcl: n.domContentLoadedEventEnd, load: n.loadEventEnd }
            : {};
          let lcp = null;
          try {
            new PerformanceObserver((l) => {
              const e = l.getEntries();
              if (e.length) lcp = e[e.length - 1].startTime;
            }).observe({ type: "largest-contentful-paint", buffered: true });
          } catch {
            /* nicht unterstützt */
          }
          setTimeout(() => {
            const r = {};
            for (const [k, v] of Object.entries({ ...basis, lcp })) r[k] = v == null ? null : Math.round(v);
            fertig(r);
          }, 50);
        }),
    )
    .catch(() => ({}));
  return { url, status: antwort?.status() ?? null, endUrl: new URL(page.url()).pathname, eintraege, zeiten };
}

// ---------------------------------------------------------------- Bericht

const kb = (b) => (b == null ? "–" : (b / KB).toLocaleString("de-AT", { minimumFractionDigits: 1, maximumFractionDigits: 1 }));
const ms = (v) => (v == null ? "–" : `${v} ms`);
const delta = (b) => (b == null ? "–" : `${b >= 0 ? "+" : "−"}${kb(Math.abs(b))}`);

export function berichtMarkdown(bericht) {
  const z = [];
  const dev = bericht.modus === "dev";
  z.push(`# Budget-Prüfung Backoffice`, "");
  z.push(`- Lauf: ${bericht.start} · Basis: ${bericht.basis} · Benutzer: ${bericht.benutzer}`);
  z.push(`- Modus: **${dev ? "Dev (Turbopack, nicht minifiziert)" : "Build"}** · Routen: ${bericht.routen.length} · Dauer: ${Math.round((bericht.dauerMs || 0) / 1000)} s`);
  z.push(`- Budgets (gzip): JS ${kb(BUDGETS.js)} kB je Route, Kassa ${kb(BUDGETS.jsKassa)} kB, CSS ${kb(BUDGETS.css)} kB (MASTER Q-L2)`);
  if (dev) {
    z.push(
      `- Dev-Hinweis: JS ohne Dev-Werkzeuge, aber mit React-Development-Build und ohne Minifizierung – größer als im Build. „eingehalten“ ist damit sicher, „im Build prüfen“ ist kein Verstoß. Abnahmewert nur gegen \`next build\` + \`next start\`.`,
    );
  }
  if (bericht.vergleich) z.push(`- Vergleich mit: ${bericht.vergleich} · markiert ab +${kb(bericht.schwelle)} kB`);
  const n = (s) => bericht.routen.filter((r) => r.bewertung && (r.bewertung.js.status === s || r.bewertung.css.status === s)).length;
  z.push(`- Ergebnis: ${n("verletzt")} verletzt · ${n("im Build prüfen")} im Build prüfen · ${bericht.routen.filter((r) => r.fehler).length} Messfehler`, "");

  z.push(`| Route | JS gzip kB | Budget | JS-Status | App + Bibl. kB | CSS kB | CSS-Status | Dokument kB | Anfragen | übertragen kB | TTFB | DCL | LCP${bericht.vergleich ? " | Δ JS | Δ App" : ""} |`);
  z.push(`|---|--:|--:|---|--:|--:|---|--:|--:|--:|--:|--:|--:${bericht.vergleich ? "|--:|--:" : ""}|`);
  for (const r of bericht.routen) {
    if (r.fehler) {
      z.push(`| ${r.pfad} | Messfehler: ${String(r.fehler).replace(/\|/g, "/").slice(0, 120)} |${" |".repeat(bericht.vergleich ? 14 : 12)}`);
      continue;
    }
    const b = r.bewertung;
    const s = b.summen;
    const vergl = bericht.vergleich ? ` | ${delta(r.deltaJs)}${r.zuwachs ? " ↑" : ""} | ${delta(r.deltaApp)}` : "";
    z.push(
      `| ${r.pfad} | ${kb(s.js)} | ${kb(b.js.budget)} | ${b.js.status} | ${kb(s.jsAppBibliothek)} | ${kb(s.css)} | ${b.css.status} | ${kb(s.dokument)} | ${s.anfragen} | ${kb(s.uebertragen)} | ${ms(r.zeiten.ttfb)} | ${ms(r.zeiten.dcl)} | ${ms(r.zeiten.lcp)}${vergl} |`,
    );
  }
  z.push("", "## Größte JS-Ressourcen je Route (ohne Dev-Werkzeuge, Top 5)", "");
  for (const r of bericht.routen.filter((x) => !x.fehler)) {
    const top = r.eintraege
      .filter((e) => e.art === "js" && e.herkunft !== "dev-werkzeug")
      .sort((a, b) => b.gzip - a.gzip)
      .slice(0, 5);
    z.push(`- **${r.pfad}**: ${top.map((e) => `${decodeURIComponent(e.url.split("/").pop().split("?")[0]).slice(0, 70)} (${e.herkunft}, ${kb(e.gzip)} kB)`).join(" · ") || "–"}`);
  }
  z.push("");
  return z.join("\n");
}

// ---------------------------------------------------------------- Programm

async function ladeRouten() {
  for (const kandidat of ["./routen/index.mjs", "./routen.mjs"]) {
    const ziel = new URL(kandidat, import.meta.url);
    if (!fs.existsSync(ziel)) continue;
    const mod = await import(ziel.href);
    if (typeof mod.alleRouten === "function") return { alleRouten: mod.alleRouten, filterNur: mod.filterNur };
  }
  throw new Error("Keine Routenliste gefunden (tools/qa/routen/index.mjs oder tools/qa/routen.mjs).");
}

function filterEinfach(routen, muster) {
  if (!muster) return routen;
  let re = null;
  try {
    re = new RegExp(muster, "i");
  } catch {
    re = null;
  }
  return routen.filter((r) => [r.pfad || "", decodeURIComponent(r.pfad || ""), r.titel || ""].some((f) => (re ? re.test(f) : f.toLowerCase().includes(muster.toLowerCase()))));
}

async function main() {
  const argv = process.argv.slice(2);
  const MIT_WERT = new Set(["--nur", "--basis", "--vergleich", "--schwelle-kb"]);
  let ausgabe;
  for (let i = 0; i < argv.length; i++) {
    if (MIT_WERT.has(argv[i])) i++;
    else if (!argv[i].startsWith("--") && !ausgabe) ausgabe = argv[i];
  }
  const opt = (name) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : undefined);
  const heute = new Date().toISOString().slice(0, 10);
  ausgabe = ausgabe || path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "qa-screenshots", `budget-${heute}`);
  const BASIS = (opt("--basis") || process.env.BASE_URL || "http://localhost:3100").replace(/\/$/, "");
  const EMAIL = process.env.QA_EMAIL || "admin@demo.local";
  const PASSWORT = process.env.QA_PASSWORT || "demo";
  const STRENG = argv.includes("--streng");
  const SCHWELLE = (Number(opt("--schwelle-kb")) || 10) * KB;
  const vergleichDatei = opt("--vergleich");
  let alt = null;
  if (vergleichDatei) {
    try {
      alt = JSON.parse(fs.readFileSync(vergleichDatei, "utf8"));
    } catch (err) {
      console.error(`Vergleichsdatei nicht lesbar: ${vergleichDatei} (${err.message})`);
      process.exit(2);
    }
  }
  fs.mkdirSync(ausgabe, { recursive: true });

  const { chromium } = await import("@playwright/test");
  const { alleRouten, filterNur } = await ladeRouten();
  const start = new Date();
  const browser = await chromium.launch();
  const VP = { viewport: { width: 1440, height: 900 }, locale: "de-AT" };

  console.log(`Anmeldung als ${EMAIL} auf ${BASIS} …`);
  const login = await browser.newContext(VP);
  const lp = await login.newPage();
  await lp.goto(`${BASIS}/login`, { waitUntil: "networkidle", timeout: 180_000 });
  await lp.fill("#email", EMAIL);
  await lp.fill("#passwort", PASSWORT);
  await Promise.all([lp.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 120_000 }), lp.click('[data-testid="login-senden"]')]);
  const storageState = await login.storageState();
  await login.close();

  let routen = alleRouten();
  for (const r of routen) {
    if (r.pfad || !r.ersterDatensatz) continue;
    const ctx = await browser.newContext({ ...VP, storageState });
    const p = await ctx.newPage();
    try {
      await p.goto(`${BASIS}/d/${encodeURIComponent(r.ersterDatensatz)}`, { waitUntil: "networkidle", timeout: 180_000 });
      r.pfad = await p.evaluate(() => {
        const a = [...document.querySelectorAll('a[href^="/d/"]')].find((el) => /^\/d\/[^/]+\/(?!neu$)[^/?]+$/.test(el.getAttribute("href") || ""));
        return a ? a.getAttribute("href") : null;
      });
    } catch {
      r.pfad = null;
    } finally {
      await ctx.close();
    }
    if (!r.pfad) r.pfad = `/d/${encodeURIComponent(r.ersterDatensatz)}/neu`;
  }
  routen = (filterNur || filterEinfach)(routen, opt("--nur"));
  console.log(`${routen.length} Routen; Ausgabe: ${ausgabe}`);

  const bericht = { start: start.toISOString(), basis: BASIS, benutzer: EMAIL, modus: null, vergleich: vergleichDatei || null, schwelle: SCHWELLE, routen: [] };
  const altJe = new Map((alt?.routen || []).filter((r) => r.bewertung).map((r) => [r.pfad, r.bewertung.summen]));

  for (const route of routen) {
    const eintrag = { pfad: route.pfad, titel: route.titel, ohneSitzung: !!route.ohneSitzung };
    const kontextOpt = route.ohneSitzung ? VP : { ...VP, storageState };
    try {
      // Vorlauf: einmal vollständig laden, damit Turbopack Server und Client kompiliert hat.
      if (!process.env.QA_NO_WARMUP) {
        const w = await browser.newContext(kontextOpt);
        const wp = await w.newPage();
        await wp.goto(`${BASIS}${route.pfad}`, { waitUntil: "load", timeout: 240_000 }).catch(() => {});
        await wp.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
        await w.close();
      }
      const ctx = await browser.newContext(kontextOpt);
      const page = await ctx.newPage();
      const m = await messeSeite(page, `${BASIS}${route.pfad}`);
      await ctx.close();
      Object.assign(eintrag, { status: m.status, endUrl: m.endUrl, zeiten: m.zeiten, eintraege: m.eintraege, bewertung: bewerte(m, route.pfad) });
      if (!route.ohneSitzung && m.endUrl.startsWith("/login")) eintrag.hinweis = "Umleitung zu /login";
      const vorher = altJe.get(route.pfad);
      if (vorher) {
        eintrag.deltaJs = eintrag.bewertung.summen.js - vorher.js;
        eintrag.deltaApp = eintrag.bewertung.summen.jsAppBibliothek - vorher.jsAppBibliothek;
        eintrag.zuwachs = eintrag.deltaJs > SCHWELLE || eintrag.deltaApp > SCHWELLE;
      }
      bericht.modus = bericht.modus || eintrag.bewertung.modus;
      const b = eintrag.bewertung;
      console.log(`${String(m.status).padEnd(4)} JS ${kb(b.js.bytes).padStart(7)} kB (${b.js.status}) · App ${kb(b.summen.jsAppBibliothek).padStart(6)} kB · CSS ${kb(b.css.bytes).padStart(5)} kB · TTFB ${ms(m.zeiten.ttfb)}  ${decodeURIComponent(route.pfad)}${eintrag.zuwachs ? "  ↑ Zuwachs" : ""}`);
    } catch (err) {
      eintrag.fehler = String(err?.message || err).slice(0, 300);
      console.log(`ERR  ${decodeURIComponent(route.pfad)}  ${eintrag.fehler}`);
      for (const c of browser.contexts()) await c.close().catch(() => {});
    }
    bericht.routen.push(eintrag);
    bericht.dauerMs = Date.now() - start.getTime();
    fs.writeFileSync(path.join(ausgabe, "budget.json"), JSON.stringify(bericht, null, 2));
  }
  await browser.close();
  bericht.modus = bericht.modus || "dev";
  fs.writeFileSync(path.join(ausgabe, "budget.json"), JSON.stringify(bericht, null, 2));
  fs.writeFileSync(path.join(ausgabe, "budget.md"), berichtMarkdown(bericht));

  const status = (s) => bericht.routen.some((r) => r.bewertung && (r.bewertung.js.status === s || r.bewertung.css.status === s));
  const fehler = bericht.routen.some((r) => r.fehler);
  const zuwachs = bericht.routen.some((r) => r.zuwachs);
  console.log(`Bericht: ${path.join(ausgabe, "budget.md")}`);
  if (status("verletzt") || fehler || (STRENG && (status("im Build prüfen") || zuwachs))) process.exit(1);
}

const direkt = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (direkt) {
  main().catch((err) => {
    console.error(err);
    process.exit(2);
  });
}
