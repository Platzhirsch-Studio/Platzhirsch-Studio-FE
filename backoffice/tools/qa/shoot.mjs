// backoffice/tools/qa/shoot.mjs – Screenshot-Prüfung des Backoffice.
//
//   node backoffice/tools/qa/shoot.mjs <ausgabeordner> [--nur <pfadmuster>] [--basis http://localhost:3100]
//
// Meldet sich per Playwright (Chromium) als Demo-Admin an (Formular auf /login), fotografiert
// jede Route aus routen.mjs in drei Viewports (Desktop 1440×900, iPad quer 1024×768,
// iPhone 390×844), hell und dunkel (colorScheme), als Vollseite, und sammelt je Aufnahme:
//   - Konsolenfehler und Seitenfehler
//   - Antworten mit Status 4xx/5xx (Dokument und Unterressourcen)
//   - horizontalen Überlauf (scrollWidth > innerWidth)
//   - Elemente mit Text außerhalb des sichtbaren Bereichs (rechts/links)
//   - fehlende Fokus-Ringe (15 Tab-Schritte, Prüfung von :focus-visible + Outline/Box-Shadow)
// Schreibt <ausgabeordner>/<slug>--<viewport>--<schema>.png, bericht.json (nach jeder
// Aufnahme) und bericht.md (Tabelle Route × Viewport × Schema).
//
// Seriell (ein Browser, ein Kontext zur Zeit), großzügige Timeouts: Turbopack kompiliert
// jede Route beim ersten Aufruf. Der Dev-Server :3100 (Mock-Modus) muss laufen.
// Umgebung: QA_EMAIL / QA_PASSWORT (Standard admin@demo.local / demo),
//           QA_ROUTE_TIMEOUT_MS (Standard 240 000), QA_NO_WARMUP=1 (kein Vorab-Abruf).

import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { alleRouten, filterNur, slugVon, VIEWPORTS, SCHEMATA } from "./routen/index.mjs";

const argv = process.argv.slice(2);
const MIT_WERT = new Set(["--nur", "--basis"]);
let ausgabe;
for (let i = 0; i < argv.length; i++) {
  if (MIT_WERT.has(argv[i])) i++;
  else if (!argv[i].startsWith("--") && !ausgabe) ausgabe = argv[i];
}
const opt = (name) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : undefined);
if (!ausgabe) {
  console.error("Aufruf: node backoffice/tools/qa/shoot.mjs <ausgabeordner> [--nur <pfadmuster>] [--basis <url>]");
  process.exit(1);
}
const BASIS = (opt("--basis") || process.env.BASE_URL || "http://localhost:3100").replace(/\/$/, "");
const EMAIL = process.env.QA_EMAIL || "admin@demo.local";
const PASSWORT = process.env.QA_PASSWORT || "demo";
const ROUTE_TIMEOUT_MS = Number(process.env.QA_ROUTE_TIMEOUT_MS) || 240_000;
const TAB_SCHRITTE = 15;

fs.mkdirSync(ausgabe, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------- Anmeldung
async function anmelden(browser) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: "de-AT" });
  const page = await context.newPage();
  await page.goto(`${BASIS}/login`, { waitUntil: "networkidle", timeout: 180_000 });
  await page.fill("#email", EMAIL);
  await page.fill("#passwort", PASSWORT);
  await Promise.all([
    page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 120_000 }),
    page.click('[data-testid="login-senden"]'),
  ]);
  const state = await context.storageState();
  await context.close();
  return state;
}

// Ersten Datensatz eines DocTypes über die Liste ermitteln (Link /d/<slug>/<name>).
async function ersterDatensatz(browser, storageState, doctype) {
  const slug = `/d/${encodeURIComponent(doctype)}`;
  const context = await browser.newContext({ storageState, viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  try {
    const res = await fetchMitSitzung(page, `${BASIS}/api/suche?q=${encodeURIComponent(doctype.replace(/^PH /, "").slice(0, 6))}`);
    const treffer = res?.gruppen?.flatMap((g) => g.eintraege || []).find((e) => /^\/d\/ph-anfrage\/(?!neu$)[^/?]+$/i.test(e.href || ""));
    if (treffer) return treffer.href;
    await page.goto(`${BASIS}${slug}`, { waitUntil: "networkidle", timeout: 180_000 });
    const href = await page.evaluate(() => {
      const a = [...document.querySelectorAll('a[href^="/d/"]')].find((el) => /^\/d\/[^/]+\/(?!neu$)[^/?]+$/.test(el.getAttribute("href") || ""));
      return a ? a.getAttribute("href") : null;
    });
    return href;
  } finally {
    await context.close();
  }
}

async function fetchMitSitzung(page, url) {
  try {
    const r = await page.request.get(url, { timeout: 120_000 });
    if (!r.ok()) return null;
    return await r.json();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------- Prüfungen in der Seite
const PRUEFE_LAYOUT = () => {
  const breite = document.documentElement.clientWidth;
  const ueberlauf = document.documentElement.scrollWidth > window.innerWidth + 1;
  const ausserhalb = [];
  const scrollBehaelter = new Set();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
  let el;
  let n = 0;
  while ((el = walker.nextNode()) && n < 4000) {
    n++;
    if (!el.childNodes.length) continue;
    const text = [...el.childNodes].filter((c) => c.nodeType === 3).map((c) => c.textContent.trim()).join(" ");
    if (!text) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none" || cs.opacity === "0") continue;
    if (el.closest('[aria-hidden="true"],[inert],[hidden],dialog:not([open])')) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    // Bewusst ausgeblendete Off-Canvas-Flächen (Seitenleiste am Telefon, transformiert
    // vollständig aus dem Bild) sind kein Befund: Vorfahr mit transform, der ganz außerhalb liegt.
    // Ebenso kein Befund: Inhalt eines horizontal scrollbaren Behälters (Tabelle mit
    // overflow-x:auto) – dort ist seitliches Scrollen vorgesehen; gezählt in `scrollBehaelter`.
    let p = el;
    let offCanvas = false;
    let inScroll = false;
    while (p && p !== document.body) {
      const pcs = getComputedStyle(p);
      if (pcs.transform !== "none" || pcs.translate !== "none") {
        const pr = p.getBoundingClientRect();
        if (pr.right <= 0 || pr.left >= breite) offCanvas = true;
      }
      if (/(auto|scroll)/.test(pcs.overflowX) && p.scrollWidth > p.clientWidth + 1) inScroll = true;
      if (offCanvas || inScroll) break;
      p = p.parentElement;
    }
    if (offCanvas) continue;
    if (inScroll) {
      scrollBehaelter.add(p);
      continue;
    }
    if (r.right > breite + 1 || r.left < -1) {
      ausserhalb.push({ tag: el.tagName.toLowerCase(), klasse: String(el.className || "").slice(0, 60), text: text.slice(0, 50), links: Math.round(r.left), rechts: Math.round(r.right), breite });
      if (ausserhalb.length >= 10) break;
    }
  }
  return { ueberlauf, ausserhalb, scrollBehaelter: scrollBehaelter.size, scrollBreite: document.documentElement.scrollWidth, innenBreite: window.innerWidth, seitenHoehe: document.documentElement.scrollHeight };
};

const PRUEFE_FOKUS = () => {
  const el = document.activeElement;
  if (!el || el === document.body) return { tag: "body" };
  const cs = getComputedStyle(el);
  const ringSichtbar =
    (cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0) || (cs.boxShadow && cs.boxShadow !== "none") || (cs.borderColor && el.dataset.fokusRahmen);
  let focusVisible = false;
  try {
    focusVisible = el.matches(":focus-visible");
  } catch {
    focusVisible = false;
  }
  const text = (el.getAttribute("aria-label") || el.textContent || el.getAttribute("placeholder") || "").trim().slice(0, 40);
  return { tag: el.tagName.toLowerCase(), text, focusVisible, ringSichtbar: !!ringSichtbar, outline: `${cs.outlineStyle} ${cs.outlineWidth}`, boxShadow: cs.boxShadow !== "none" };
};

// ---------------------------------------------------------------- eine Aufnahme
async function aufnahme(browser, storageState, route, vp, schema, eintrag) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
    isMobile: !!vp.mobile,
    hasTouch: !!vp.mobile,
    colorScheme: schema === "dunkel" ? "dark" : "light",
    locale: "de-AT",
    reducedMotion: "reduce",
    storageState: route.ohneSitzung ? undefined : storageState,
  });
  const page = await context.newPage();
  page.on("console", (m) => m.type() === "error" && eintrag.konsolenfehler.push(m.text().slice(0, 300)));
  page.on("pageerror", (e) => eintrag.konsolenfehler.push(`pageerror: ${String(e).slice(0, 300)}`));
  page.on("response", (r) => {
    const s = r.status();
    if (s >= 400) eintrag.fehlantworten.push(`${s} ${r.request().method()} ${r.url().replace(BASIS, "")}`.slice(0, 200));
  });
  page.on("requestfailed", (r) => {
    const t = r.failure()?.errorText || "";
    if (!/ERR_ABORTED/.test(t)) eintrag.fehlantworten.push(`FAIL ${t} ${r.url().replace(BASIS, "")}`.slice(0, 200));
  });
  const url = `${BASIS}${route.pfad}`;
  const t0 = Date.now();
  let res = await page.goto(url, { waitUntil: "networkidle", timeout: 180_000 }).catch((err) => ({ err }));
  if (res?.err || (res && typeof res.status === "function" && res.status() >= 500)) {
    eintrag.wiederholt = true;
    await sleep(3000);
    res = await page.goto(url, { waitUntil: "networkidle", timeout: 180_000 });
  }
  eintrag.status = res && typeof res.status === "function" ? res.status() : null;
  eintrag.endUrl = page.url().replace(BASIS, "");
  await page.waitForTimeout(800);

  const layout = await page.evaluate(PRUEFE_LAYOUT);
  Object.assign(eintrag, { ueberlauf: layout.ueberlauf, scrollBehaelter: layout.scrollBehaelter, scrollBreite: layout.scrollBreite, innenBreite: layout.innenBreite, seitenHoehe: layout.seitenHoehe, textAusserhalb: layout.ausserhalb });

  const datei = path.join(ausgabe, `${eintrag.slug}--${vp.name}--${schema}.png`);
  await page.screenshot({ path: datei, fullPage: true, animations: "disabled", caret: "hide" });
  eintrag.datei = path.basename(datei);

  // Fokus-Durchlauf nach dem Screenshot (verändert sichtbaren Zustand).
  const ohneRing = [];
  const besucht = [];
  let mitRing = 0;
  await page.keyboard.press("Tab").catch(() => {});
  for (let i = 0; i < TAB_SCHRITTE; i++) {
    const f = await page.evaluate(PRUEFE_FOKUS).catch(() => null);
    if (!f || f.tag === "body") break;
    besucht.push(`${f.tag}:${f.text}`);
    if (f.focusVisible && !f.ringSichtbar) ohneRing.push({ schritt: i + 1, tag: f.tag, text: f.text, outline: f.outline });
    else if (f.focusVisible) mitRing++;
    await page.keyboard.press("Tab").catch(() => {});
  }
  eintrag.fokusSchritte = besucht.length;
  eintrag.fokusMitRing = mitRing;
  eintrag.fokusBesucht = besucht.slice(0, TAB_SCHRITTE);
  eintrag.fokusOhneRing = ohneRing;
  eintrag.dauerMs = Date.now() - t0;
  await context.close();
}

// ---------------------------------------------------------------- Bericht
function befundeVon(e) {
  const b = [];
  if (e.fehler) b.push(`Fehler: ${e.fehler}`);
  if (e.status && e.status >= 400) b.push(`HTTP ${e.status}`);
  if (e.endUrl && e.endUrl.startsWith("/login") && !e.ohneSitzung) b.push("Umleitung zu /login");
  if (e.ueberlauf) b.push(`horizontaler Überlauf (${e.scrollBreite} > ${e.innenBreite})`);
  if (e.textAusserhalb?.length) b.push(`${e.textAusserhalb.length}× Text außerhalb (${e.textAusserhalb[0].tag} „${e.textAusserhalb[0].text}“)`);
  if (e.fokusOhneRing?.length) b.push(`${e.fokusOhneRing.length}× Fokus ohne Ring (${e.fokusOhneRing.map((f) => f.tag).slice(0, 3).join(", ")})`);
  if (e.konsolenfehler?.length) b.push(`${e.konsolenfehler.length} Konsolenfehler`);
  if (e.fehlantworten?.length) b.push(`${e.fehlantworten.length}× 4xx/5xx (${e.fehlantworten[0]})`);
  if (e.wiederholt) b.push("wiederholt");
  return b;
}

function schreibeBericht(bericht) {
  fs.writeFileSync(path.join(ausgabe, "bericht.json"), JSON.stringify(bericht, null, 2));
  const z = [];
  const eintraege = bericht.eintraege;
  const mitBefund = eintraege.filter((e) => befundeVon(e).length);
  z.push(`# Screenshot-Prüfung Backoffice – ${bericht.start}`);
  z.push("");
  z.push(`Basis: ${bericht.basis} · Routen: ${bericht.routen.length} · Aufnahmen: ${eintraege.length} · mit Befund: ${mitBefund.length} · Dauer: ${Math.round((bericht.dauerMs || 0) / 1000)} s`);
  z.push("");
  z.push("Befundarten: HTTP-Status ≥ 400, Umleitung zum Login, horizontaler Überlauf, Text außerhalb des Viewports, Fokus ohne sichtbaren Ring (15 Tab-Schritte), Konsolenfehler, 4xx/5xx-Antworten von Unterressourcen.");
  z.push("");
  const summe = (k) => eintraege.filter((e) => (Array.isArray(e[k]) ? e[k].length : e[k])).length;
  z.push("## Zusammenfassung");
  z.push("");
  z.push(`- Aufnahmen mit horizontalem Überlauf: ${summe("ueberlauf")}`);
  z.push(`- Aufnahmen mit Text außerhalb: ${summe("textAusserhalb")}`);
  z.push(`- Aufnahmen mit Fokus ohne Ring: ${summe("fokusOhneRing")}`);
  z.push(`- Aufnahmen mit Konsolenfehlern: ${summe("konsolenfehler")}`);
  z.push(`- Aufnahmen mit 4xx/5xx: ${summe("fehlantworten")}`);
  z.push(`- Aufnahmen mit Fehler/Timeout: ${eintraege.filter((e) => e.fehler).length}`);
  z.push("");
  z.push("## Tabelle Route × Viewport × Schema");
  z.push("");
  z.push("| Route | Viewport | Schema | Status | Höhe | Befunde | Datei |");
  z.push("|---|---|---|---|---|---|---|");
  for (const e of eintraege) {
    const b = befundeVon(e);
    z.push(`| \`${decodeURIComponent(e.route)}\` | ${e.viewport} | ${e.schema} | ${e.status ?? "–"} | ${e.seitenHoehe ?? "–"} | ${b.length ? b.join("; ").replace(/\|/g, "\\|") : "–"} | ${e.datei || "–"} |`);
  }
  z.push("");
  z.push("## Details");
  z.push("");
  for (const e of mitBefund) {
    z.push(`### ${decodeURIComponent(e.route)} · ${e.viewport} · ${e.schema}`);
    z.push("");
    for (const k of e.konsolenfehler || []) z.push(`- Konsole: ${k}`);
    for (const k of e.fehlantworten || []) z.push(`- Antwort: ${k}`);
    for (const t of e.textAusserhalb || []) z.push(`- Text außerhalb: <${t.tag} class="${t.klasse}"> „${t.text}“ links ${t.links} rechts ${t.rechts} (Breite ${t.breite})`);
    for (const f of e.fokusOhneRing || []) z.push(`- Fokus ohne Ring: Schritt ${f.schritt} <${f.tag}> „${f.text}“ (outline ${f.outline})`);
    if (e.fehler) z.push(`- Fehler: ${e.fehler}`);
    z.push("");
  }
  fs.writeFileSync(path.join(ausgabe, "bericht.md"), z.join("\n"));
}

// ---------------------------------------------------------------- Ablauf
async function main() {
  const start = new Date();
  const browser = await chromium.launch();
  console.log(`Anmeldung als ${EMAIL} auf ${BASIS} …`);
  const storageState = await anmelden(browser);

  let routen = alleRouten();
  for (const r of routen) {
    if (!r.pfad && r.ersterDatensatz) {
      r.pfad = await ersterDatensatz(browser, storageState, r.ersterDatensatz).catch(() => null);
      if (!r.pfad) r.pfad = `/d/${encodeURIComponent(r.ersterDatensatz)}/neu`;
      console.log(`Formular-Route: ${r.pfad}`);
    }
  }
  routen = filterNur(routen, opt("--nur"));
  console.log(`${routen.length} Routen × ${VIEWPORTS.length} Viewports × ${SCHEMATA.length} Schemata = ${routen.length * VIEWPORTS.length * SCHEMATA.length} Aufnahmen`);

  // Warm-up: jede Route einmal mit Sitzung abrufen, damit Turbopack kompiliert hat.
  if (!process.env.QA_NO_WARMUP) {
    const ctx = await browser.newContext({ storageState });
    for (const r of routen) {
      try {
        await ctx.request.get(`${BASIS}${r.pfad}`, { timeout: 180_000 });
      } catch {
        /* nächster */
      }
    }
    await ctx.close();
  }

  const bericht = { start: start.toISOString(), basis: BASIS, benutzer: EMAIL, routen: routen.map((r) => ({ pfad: r.pfad, titel: r.titel, kern: !!r.kern })), eintraege: [] };
  for (const route of routen) {
    const slug = slugVon(route.pfad);
    for (const vp of VIEWPORTS) {
      for (const schema of SCHEMATA) {
        const eintrag = { route: route.pfad, titel: route.titel, kern: !!route.kern, slug, viewport: vp.name, schema, ohneSitzung: !!route.ohneSitzung, status: null, konsolenfehler: [], fehlantworten: [], textAusserhalb: [], fokusOhneRing: [] };
        let timer;
        try {
          await Promise.race([
            aufnahme(browser, storageState, route, vp, schema, eintrag),
            new Promise((_, rej) => {
              timer = setTimeout(() => rej(new Error(`timeout nach ${ROUTE_TIMEOUT_MS} ms`)), ROUTE_TIMEOUT_MS);
            }),
          ]);
        } catch (err) {
          eintrag.fehler = String(err?.message || err).slice(0, 300);
          for (const c of browser.contexts()) await c.close().catch(() => {});
        } finally {
          clearTimeout(timer);
        }
        bericht.eintraege.push(eintrag);
        bericht.dauerMs = Date.now() - start.getTime();
        schreibeBericht(bericht);
        const b = befundeVon(eintrag);
        console.log(`${String(eintrag.status ?? "ERR").padEnd(4)} ${vp.name.padEnd(7)} ${schema.padEnd(6)} ${decodeURIComponent(route.pfad)}${b.length ? "  ⚠ " + b.join("; ") : ""}`);
      }
    }
  }
  await browser.close();
  bericht.ende = new Date().toISOString();
  bericht.dauerMs = Date.now() - start.getTime();
  schreibeBericht(bericht);
  console.log(`Fertig: ${bericht.eintraege.length} Aufnahmen in ${Math.round(bericht.dauerMs / 1000)} s → ${path.join(ausgabe, "bericht.md")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
