// node --test tests/unit/ar-viewer-fix2.test.mjs
// AR-Viewer, Nachbesserung nach QA R2 (feedback-2.md):
//   P1-1 Sortiment je Marke mit Wiederholung, Snapshot-Rückfall, nie still unvollständig
//   P1-2 USDZ mit MaterialBindingAPI + extent, QR-Origin aus Tunnel/Vorschau, In-App-Hinweis
//   P2-1 Größen je modularer Familie (eigene GLB/USDZ), Profil nur mit Datenblatt-Quelle
//   P2-2 verzögerte Tipp-Suche überschreibt keine spätere Navigation
//   P2-3 Kartenbild mit Ersatz, P2-5 Standbild bis „load“, P2-6 QR vorladen + Skeleton
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, statSync } from "node:fs";
import { loadSortimentRows, slimRow, joinNames, RETRY_MS } from "../../src/lib/arviewer/sortiment-load.js";

const root = new URL("../../", import.meta.url);
const src = (p) => readFileSync(new URL(p, root), "utf8");
const json = (p) => JSON.parse(src(p));
const noSleep = async () => {};
const row = (id, marke) => ({ status: "Aktiv", path_field: id, kategories: "sofas", produkt_name: id, marken: marke, bild_anhangen: [{ bild_anhangen: `/files/${id}.jpg`, alt_text: null }, { bild_anhangen: "/x.jpg" }], extra: "weg" });

test("P1-1: eine Wiederholung je Marke mit 800 ms Pause, dann live", async () => {
  const calls = {};
  const waits = [];
  const out = await loadSortimentRows({
    marken: [{ name: "Minotti" }, { name: "Flos" }],
    fetchRows: async (n) => {
      calls[n] = (calls[n] || 0) + 1;
      if (n === "Minotti" && calls[n] === 1) throw new Error("timeout");
      return [row(`${n}-a`, n)];
    },
    sleep: async (ms) => waits.push(ms),
  });
  assert.equal(RETRY_MS, 800);
  assert.deepEqual(waits, [800]);
  assert.equal(calls.Minotti, 2);
  assert.equal(calls.Flos, 1);
  assert.equal(out.complete, true);
  assert.deepEqual(out.failed, []);
  assert.ok(out.snapshotCandidate, "vollständiger Live-Lauf ergibt einen Snapshot");
  // Snapshot ist schlank: nur das erste Bild, keine Zusatzfelder
  const slim = out.snapshotCandidate.rows.Minotti[0];
  assert.equal(slim.extra, undefined);
  assert.equal(slim.bild_anhangen.length, 1);
});

test("P1-1: scheitert eine Marke zweimal, kommt sie aus dem letzten vollständigen Stand", async () => {
  const snapshot = { stand: "2026-10-27T20:00:00.000Z", marken: ["Minotti", "Flos"], rows: { Minotti: [slimRow(row("m1", "Minotti")), slimRow(row("m2", "Minotti"))] } };
  const out = await loadSortimentRows({
    marken: [{ name: "Minotti" }, { name: "Flos" }],
    snapshot,
    sleep: noSleep,
    fetchRows: async (n) => {
      if (n === "Minotti") throw new Error("503");
      return [row("f1", "Flos")];
    },
  });
  const m = out.results.find((r) => r.name === "Minotti");
  assert.equal(m.quelle, "stand");
  assert.equal(m.rows.length, 2);
  assert.equal(m.versuche, 2);
  assert.deepEqual(out.stale, ["Minotti"]);
  assert.deepEqual(out.failed, []);
  assert.equal(out.complete, true, "aus dem Stand ergänzt = Zahlen vollständig");
  assert.equal(out.standVon, snapshot.stand, "Stand wird genannt");
  assert.equal(out.snapshotCandidate, null, "ein ergänzter Lauf ersetzt den Snapshot nie");
});

test("P1-1: ohne Stand fehlt die Marke sichtbar – nie als vollständig gemeldet", async () => {
  const out = await loadSortimentRows({
    marken: [{ name: "Minotti" }, { name: "Flos" }],
    sleep: noSleep,
    fetchRows: async (n) => {
      if (n === "Minotti") throw new Error("abgebrochen");
      return [row("f1", "Flos")];
    },
  });
  assert.deepEqual(out.failed, ["Minotti"]);
  assert.equal(out.complete, false);
  assert.equal(out.snapshotCandidate, null);
  assert.match(out.results.find((r) => r.name === "Minotti").fehler, /abgebrochen/);
});

test("P1-1: Markenliste nicht erreichbar → Marken aus dem Stand; leere Antwort ≠ Fehler", async () => {
  const snapshot = { stand: "2026-10-27T20:00:00.000Z", marken: ["A", "B"], rows: { A: [slimRow(row("a1", "A"))], B: [slimRow(row("b1", "B"))] } };
  const out = await loadSortimentRows({ marken: [], snapshot, sleep: noSleep, fetchRows: async () => Promise.reject(new Error("weg")) });
  assert.equal(out.markenLive, false);
  assert.equal(out.results.length, 2);
  assert.ok(out.results.every((r) => r.quelle === "stand"));
  assert.equal(out.standVon, snapshot.stand);
  // Eine Marke mit 0 Produkten ist live und vollständig
  const leer = await loadSortimentRows({ marken: [{ name: "A" }], sleep: noSleep, fetchRows: async () => [] });
  assert.equal(leer.results[0].quelle, "live");
  assert.equal(leer.complete, true);
  // Kaputte Antwort (keine Liste) zählt als Fehler
  const kaputt = await loadSortimentRows({ marken: [{ name: "A" }], sleep: noSleep, fetchRows: async () => ({}) });
  assert.deepEqual(kaputt.failed, ["A"]);
});

test("P1-1: Hinweistext nennt die Marken", () => {
  assert.equal(joinNames(["Minotti"]), "Minotti");
  assert.equal(joinNames(["Minotti", "Flos"]), "Minotti und Flos");
  assert.equal(joinNames(["A", "B", "C", "D", "E", "F"]), "A, B, C und 3 weitere Marken");
});

test("P1-1: Seite zeigt Hinweis mit role=status, „mind.“ und Intro nur aus derselben Quelle", () => {
  const page = src("src/app/[locale]/3d-ansicht/page.js");
  assert.match(page, /role="status" data-testid="arv-teilkatalog"/);
  assert.match(page, /Neu laden/);
  assert.match(page, /mind\. /);
  assert.match(page, /\{!sortiment\.error && \(\s*<p[^>]*arv-intro-zahlen/);
  assert.doesNotMatch(page, /inv\.produkte/, "Intro-Zeile nie aus der Inventur (1 760 … 0 davon)");
  const cat = src("src/lib/arviewer/catalog.js");
  assert.match(cat, /sortiment-snapshot\.json/);
  assert.match(cat, /process\.env\.NODE_ENV === "production"\) return null/, "Simulations-Header nur außerhalb von Produktion");
  assert.match(src(".gitignore"), /^\/\.data\//m, "Snapshot bleibt lokal");
});

test("P1-2: jede USDZ hat MaterialBindingAPI und extent, usdchecker-Beleg ohne Befund", () => {
  const lib = src("scripts/arviewer/lib/glb-usdz.mjs");
  assert.match(lib, /prepend apiSchemas = \["MaterialBindingAPI"\]/);
  assert.match(lib, /float3\[\] extent/);
  // Beleg liegt in qa-screenshots/ (gitignored) – nur prüfen, wo er vorhanden ist
  const belegUrl = new URL("qa-screenshots/labs-ausbau/ar-viewer/geraete/usdchecker.txt", root);
  if (existsSync(belegUrl)) {
    const beleg = readFileSync(belegUrl, "utf8");
    assert.match(beleg, /--arkit/);
    const summe = /Summe: (\d+) Dateien · (\d+) ohne Befund · 0 Fehler · 0 Regelverstöße · 0 Warnungen/.exec(beleg);
    assert.ok(summe, "Summenzeile ohne Befund");
    assert.equal(summe[1], summe[2]);
  }
  // Stichprobe im Paket selbst (USDZ = unkomprimiertes ZIP, model.usda als Klartext)
  const usdz = readFileSync(new URL("public/labs/ar-viewer/raum/sofas-daniels.usdz", root)).toString("latin1");
  assert.match(usdz, /MaterialBindingAPI/);
  assert.match(usdz, /extent = \[/);
});

test("P1-2: QR-Origin aus NEXT_PUBLIC_ARVIEWER_ORIGIN bzw. Tunnel, nie localhost; Vorschau-Hinweis; In-App-Hinweis", () => {
  const launch = src("src/components/Labs/ArViewer/ArLaunch.js");
  assert.match(launch, /NEXT_PUBLIC_ARVIEWER_ORIGIN/);
  assert.match(launch, /localhost\|127/);
  assert.match(launch, /inapp-ios/);
  assert.match(launch, /Link kopieren/);
  const ho = src("src/components/Labs/ArViewer/PhoneHandoff.js");
  assert.match(ho, /arv-qr-vorschau/);
  assert.match(ho, /NODE_ENV !== "production"/);
});

test("P2-1: Größen je Familie mit eigenem GLB/USDZ, Profil nur mit Datenblatt-Quelle", () => {
  const RAUM = json("src/lib/arviewer/raumbedarf.json").produkte;
  const DIMS = json("src/lib/arviewer/dims.json").produkte;
  let groessen = 0;
  for (const [id, r] of Object.entries(RAUM)) {
    if (r.profil) {
      assert.match(r.profil.quelle || DIMS[id]?.quelle || "", /^https:\/\//, `${id}: Profil ohne Quelle`);
      assert.ok(["stufen", "linien"].includes(r.profil.art), `${id}: Profil-Art`);
      for (const [k, max] of [["sitzhoehe", r.h], ["armlehnenhoehe", r.h], ["sitztiefe", r.d]]) {
        const v = r.profil[k];
        if (v != null) assert.ok(v > 0 && v <= max, `${id}: ${k} ${v} außerhalb 0…${max}`);
      }
    }
    for (const g of r.groessen || []) {
      groessen++;
      assert.ok(g.w > 0 && g.d > 0 && g.h > 0, `${id}: Größe ohne Maße`);
      for (const f of [g.glb, g.usdz]) {
        const p = new URL(`public${f}`, root);
        assert.ok(existsSync(p), `${id}: fehlt ${f}`);
        assert.ok(statSync(p).size < 200_000, `${id}: ${f} zu groß`);
      }
    }
  }
  assert.ok(groessen > 0);
  assert.equal(RAUM["sofas-daniels"].groessen.length >= 1, true, "Daniels hat weitere Größen");
  const launch = src("src/components/Labs/ArViewer/ArLaunch.js");
  assert.match(launch, /aria-pressed=\{active === i\}/);
  assert.match(launch, /GroessenWahl/);
});

test("P2-2: Tipp-Suche wird bei Unmount, Link-Klick und popstate abgebrochen, URL-Prüfung vor replace", () => {
  const f = src("src/components/Labs/ArViewer/Sortiment/SortimentFilters.js");
  assert.match(f, /closest\("a\[href\]"\)/);
  assert.match(f, /addEventListener\("popstate", cancel\)/);
  assert.match(f, /return \(\) => \{\s*cancel\(\);/);
  assert.match(f, /if \(now !== at && now !== ownUrl\.current\) return;/);
  assert.doesNotMatch(f, /disabled=\{pending\}/, "Suchfeld bleibt während pending bedienbar");
});

test("P2-3/P2-5/P2-6: Kartenbild-Ersatz, Standbild bis load, QR vorladen + Skeleton", () => {
  const card = src("src/components/Labs/ArViewer/Sortiment/CardImage.js");
  assert.match(card, /onError=/);
  assert.match(card, /arv-bild-ersatz/);
  assert.match(src("src/components/Labs/ArViewer/Sortiment/RaumCarousel.js"), /fallback=\{p\.posterRaum\}/);
  assert.match(src("src/components/Labs/ArViewer/Sortiment/SortimentGrid.js"), /fallback=\{p\.posterRaum\}/);
  assert.match(src("src/app/[locale]/3d-ansicht/page.js"), /image: i\.posterRaum/, "Reihe zeigt bei 2b die eigene Axonometrie");
  const pv = src("src/components/Labs/ArViewer/ProductViewer.js");
  assert.match(pv, /P2-5/);
  const stage = src("src/components/Labs/ArViewer/ModelStage.js");
  assert.match(stage, /totalProgress/);
  assert.match(stage, /alt=\{/);
  const ho = src("src/components/Labs/ArViewer/PhoneHandoff.js");
  assert.match(ho, /export function preloadQr/);
  assert.match(ho, /arv-qr-skeleton/);
  assert.match(ho, /motion-safe:animate-pulse/);
  assert.match(src("src/components/Labs/ArViewer/ArLaunch.js"), /onPointerEnter=\{preloadQr\}|onPointerEnter=\{\(\) => preloadQr/);
});

test("Übergabe-Endpunkt speichert nur ein Token, noindex, ohne Produkt/IP", () => {
  const r = src("src/app/[locale]/3d-ansicht/uebergabe/route.js");
  assert.match(r, /x-robots-tag": "noindex"/);
  assert.match(r, /TTL_MS = 15 \* 60 \* 1000/);
  assert.doesNotMatch(r, /store\.set\(t, \{[^}]*(ip|produkt|path)/i);
});
