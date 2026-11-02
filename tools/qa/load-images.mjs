// tools/qa/load-images.mjs – Dauerlast auf Bildauslieferung (P6 Runde 2, r2-technik P1-2).
//
//   node tools/qa/load-images.mjs [--base=http://localhost:3100] [--minutes=90] [--json=out.json]
//
// Nur für einen Prod-Server (next start). Fragt in einer Schleife ab:
//   - /de/leistungen (HTML) und alle darin genannten Kartenbilder /bilder/leistungen/*
//   - /_next/image-Varianten der Startseite und von /de/leistungen
//     (w = 256/384/640/1080, q = 50/75, Accept avif und webp) – der Pfad, der
//     unter 16.3.8 nach ~90 min hängen blieb
// Jede Anfrage hat 15 s Zeitlimit. Ergebnis: Anzahl, Fehler, Zeitüberschreitungen,
// langsamste Antworten. Exit 1, wenn eine Anfrage hing (Timeout) oder 5xx kam.
import fs from "node:fs";

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, "").split("=")));
const BASE = args.base || "http://localhost:3100";
const MINUTES = Number(args.minutes || 90);
const TIMEOUT = 15_000;

async function get(url, accept) {
  const t = Date.now();
  try {
    const res = await fetch(url, { headers: accept ? { accept } : {}, signal: AbortSignal.timeout(TIMEOUT) });
    await res.arrayBuffer();
    return { url, accept, status: res.status, ms: Date.now() - t };
  } catch (err) {
    return { url, accept, status: err.name === "TimeoutError" ? "timeout" : "error", ms: Date.now() - t };
  }
}

async function targets() {
  const out = new Set();
  for (const p of ["/de/leistungen", "/de"]) {
    const html = await (await fetch(BASE + p)).text();
    // Runde 5 (P3): Kartenbilder liegen unter /bilder/leistungen/ (vorher /labs/hub/v/).
    for (const m of html.matchAll(/\/(?:bilder\/leistungen|labs\/hub\/v)\/[a-z0-9-]+-\d+\.(?:avif|webp)/g)) out.add(m[0]);
    for (const m of html.matchAll(/\/_next\/image\?url=([^&"\\]+)/g)) {
      for (const w of [256, 384, 640, 1080]) for (const q of [50, 75]) out.add(`/_next/image?url=${m[1]}&w=${w}&q=${q}`);
    }
  }
  return [...out];
}

const list = await targets();
const stats = { base: BASE, minutes: MINUTES, started: new Date().toISOString(), targets: list.length, requests: 0, byStatus: {}, slowest: [], rounds: 0 };
const end = Date.now() + MINUTES * 60_000;
while (Date.now() < end) {
  stats.rounds++;
  const batch = [() => get(BASE + "/de/leistungen")];
  for (const u of list) {
    batch.push(() => get(BASE + u, "image/avif,image/webp,*/*"));
    if (u.startsWith("/_next/image")) batch.push(() => get(BASE + u, "image/webp,*/*"));
  }
  // 6 parallel, like a browser per host; 1 s pause between rounds
  const results = [];
  for (let i = 0; i < batch.length; i += 6) results.push(...(await Promise.all(batch.slice(i, i + 6).map((fn) => fn()))));
  await new Promise((r) => setTimeout(r, 1000));
  for (const r of results) {
    stats.requests++;
    stats.byStatus[r.status] = (stats.byStatus[r.status] || 0) + 1;
    stats.slowest.push(r);
  }
  stats.slowest.sort((a, b) => b.ms - a.ms);
  stats.slowest = stats.slowest.slice(0, 10);
  if (stats.rounds % 20 === 0) console.log(new Date().toISOString(), JSON.stringify(stats.byStatus), "max", stats.slowest[0]?.ms, "ms");
}
stats.finished = new Date().toISOString();
const bad = Object.entries(stats.byStatus).filter(([s]) => s === "timeout" || s === "error" || Number(s) >= 500);
stats.ok = bad.length === 0;
if (args.json) fs.writeFileSync(args.json, JSON.stringify(stats, null, 2));
console.log(JSON.stringify(stats, null, 2));
process.exit(stats.ok ? 0 : 1);
