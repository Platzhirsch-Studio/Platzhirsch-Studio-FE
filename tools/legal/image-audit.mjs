#!/usr/bin/env node
// tools/legal/image-audit.mjs — Bildregister (Masterplan AP2 Nr. 5, R4-recht-consent).
//
// Lists every image the site can show, with host, path, suspected origin and
// the open rights clearance, as Marktresearch/recht/bildrechte.csv:
//   1. files in public/ (images, plus the 3D models of the AR viewer)
//   2. image URLs and local image paths in src/lib/data/** (static catalogue)
//   3. the hosts allowed in next.config.js images.remotePatterns
//   4. a backoffice sample: image URLs (/cmx/files/…, next/image sources) in
//      the HTML of a few pages of the RUNNING site (default
//      http://localhost:3000). Only GET requests to our own server; nothing
//      goes to the backoffice directly, nothing is written anywhere else.
//
// Every row has "freigabe" = "offen" unless the owner documented a written
// clearance (CLEARED below): the clearance (rights holder, scope
// web/ads/feed/editing/AI) is decided by the owner, not by this tool.
//
// Usage:
//   node tools/legal/image-audit.mjs [--base=http://localhost:3000] [--no-sample] [--out=path.csv]
// CSV: UTF-8 with BOM, separator ";" (opens directly in a German Excel).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, "").split("=");
    return [k, v.length ? v.join("=") : true];
  })
);
const BASE = String(args.base || "http://localhost:3000").replace(/\/+$/, "");
const OUT = path.resolve(ROOT, String(args.out || "Marktresearch/recht/bildrechte.csv"));
const SAMPLE_PAGES = [
  "/de",
  "/de/produkte",
  "/de/produkte/lamps",
  "/de/produkte/lamps/lamps-2097-18",
  "/de/ueber-uns/marken",
  "/de/ueber-uns/marken/minotti",
  "/de/ueber-uns/marken/classicon",
  "/de/ueber-uns/marken/brand-van-egmond",
  "/de/ueber-uns/team",
  "/de/news",
  "/de/kuechen-vorarlberg",
  "/de/yacht-interior",
  "/de/outdoor-gartenplanung",
];

const IMAGE_EXT = /\.(jpe?g|png|webp|avif|gif|svg)$/i;
const MODEL_EXT = /\.(glb|gltf|usdz|hdr)$/i;
const rel = (p) => path.relative(ROOT, p).split(path.sep).join("/");

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

/** Suspected origin of a local file, from its folder and name (a guess, marked as such). */
function guessLocal(webPath) {
  const p = webPath.toLowerCase();
  if (p.includes("/labs/ar-viewer/")) return "Poly Haven, CC0 (laut src/components/Labs/ArViewer/data/catalog.js) – vermutet";
  if (p.includes("/flags/")) return "Flaggen-Grafik, Quelle unbekannt (gemeinfrei möglich) – vermutet";
  if (/\/(file|globe|next|vercel|window)\.svg$/.test(p)) return "Vorlage von create-next-app (MIT), vermutlich ungenutzt";
  if (p.includes("logo") || p.endsWith(".svg")) return "eigenes Logo/Grafik – vermutet";
  if (p.includes("/team/") || p.includes("team")) return "Teamfoto, eigener Auftrag – vermutet (Einwilligung der Abgebildeten prüfen)";
  if (p.includes("/home/") || p.includes("/kontakt/") || p.includes("/footer/")) return "eigene Aufnahme oder Herstellerbild – unbekannt";
  return "Herstellerbild oder eigene Aufnahme – unbekannt";
}

function guessRemote(host) {
  const h = host.toLowerCase();
  if (h === "backoffice.platzhirsch.studio" || h === "(eigener server /cmx)") return "Upload im Backoffice: Herstellerbild (Pressebereich) oder eigene Aufnahme – je Datei zu klären";
  if (h.includes("unsplash")) return "Unsplash-Lizenz – vermutet";
  if (h.includes("next125")) return "Hersteller next125 (Schüller), Hotlink/Optimierer – Freigabe des Herstellers nötig";
  if (h.includes("treca")) return "Hersteller Tréca Paris, Hotlink/Optimierer – Freigabe des Herstellers nötig";
  if (h.includes("brandvanegmond")) return "Hersteller Brand van Egmond – Freigabe des Herstellers nötig";
  return "unbekannt";
}

// Freigaben, die der Inhaber belegt hat (Inhaber-Entscheidung Nr. 11, Mails
// vom 28.10.2026). Nur hier eintragen, was schriftlich vorliegt; alles andere
// bleibt „offen“. Schlüssel: Pfad-Präfix.
const CLEARED = [
  {
    prefix: "/labs/yacht/minotti-navetta42/",
    herkunft: "Herstellerbild Minotti (Referenz Custom Line Navetta 42) – Foto Courtesy of Custom Line",
    rechteinhaber: "Minotti S.p.A. / Custom Line (Ferretti Group)",
    freigabe: "erteilt – Mail 28.10.2026 (Inhaber-Entscheidung Nr. 11)",
    umfang: "Web: Yacht-Seite, unverändert (kein Zuschnitt, kein Filter), mit Bildnachweis – Ads / Feed / Pinterest / Bearbeitung / KI: nicht freigegeben",
    hinweis: "Mail beim Inhaber abgelegt – Ablageort und Wortlaut des Umfangs in diese Zeile übernehmen. Bildnachweis „Foto: Courtesy of Custom Line“ Pflicht",
  },
  {
    prefix: "/Images/Home/aboutHome.jpg",
    herkunft: "Rechte laut Mail an den Inhaber",
    rechteinhaber: "laut Mail 28.10.2026 – Name des Fotografen offen (§ 74 UrhG prüfen)",
    freigabe: "erteilt – Mail 28.10.2026 (Inhaber-Entscheidung Nr. 11)",
    umfang: "Web laut Mail, offen: ob Zuschnitte (Startseite, Stil-Finder) / Ads / Feed / KI gedeckt sind: prüfen",
    hinweis: "Mail beim Inhaber abgelegt – Ablageort eintragen, Fotografennennung klären",
  },
];
const clearanceFor = (pfad) => CLEARED.find((c) => String(pfad || "").startsWith(c.prefix));

const rows = [];
const add = (r) => {
  const c = clearanceFor(r.pfad);
  rows.push({
    quelle: r.quelle,
    host: r.host,
    pfad: r.pfad,
    anzahl: r.anzahl ?? 1,
    fundstelle: r.fundstelle || "",
    herkunft_vermutet: c?.herkunft || r.herkunft || "unbekannt",
    rechteinhaber: c?.rechteinhaber || "offen",
    freigabe: c?.freigabe || "offen",
    umfang: c?.umfang || "offen (Web / Ads / Feed / Bearbeitung / KI)",
    in_remotePatterns: r.inRemote ?? "",
    hinweis: c?.hinweis || r.hinweis || "",
  });
};

// 3. remotePatterns (read first: rows 1/2/4 say whether their host is allowed)
const nextConfig = fs.readFileSync(path.join(ROOT, "next.config.js"), "utf8");
const remoteBlock = nextConfig.slice(nextConfig.indexOf("remotePatterns"), nextConfig.indexOf("dangerouslyAllowSVG") > 0 ? nextConfig.indexOf("dangerouslyAllowSVG") : undefined);
const REMOTE_HOSTS = [...remoteBlock.matchAll(/hostname:\s*["']([^"']+)["']/g)].map((m) => m[1]);
const inRemote = (host) => (REMOTE_HOSTS.includes(host) ? "ja" : "nein");

// 1. public/
const publicFiles = walk(path.join(ROOT, "public")).filter((f) => IMAGE_EXT.test(f) || MODEL_EXT.test(f));
const srcText = walk(path.join(ROOT, "src"))
  .filter((f) => /\.(m?js|jsx|css|json)$/.test(f))
  .map((f) => ({ f, t: fs.readFileSync(f, "utf8") }));
for (const f of publicFiles.sort()) {
  const web = "/" + rel(f).replace(/^public\//, "");
  const refs = srcText.filter(({ t }) => t.includes(web) || t.includes(encodeURI(web)));
  add({
    quelle: MODEL_EXT.test(f) ? "public/ (3D-Modell)" : "public/",
    host: "lokal",
    pfad: web,
    anzahl: refs.length,
    fundstelle: refs.slice(0, 3).map(({ f: x }) => rel(x)).join(" | ") + (refs.length > 3 ? ` | +${refs.length - 3}` : ""),
    herkunft: guessLocal(web),
    inRemote: "–",
    hinweis: refs.length ? "" : "im Code nicht referenziert (evtl. aus Backoffice-Daten oder ungenutzt)",
  });
}

// 2. src/lib/data/**
const dataFiles = walk(path.join(ROOT, "src/lib/data")).filter((f) => /\.m?js$/.test(f));
const remoteCount = new Map(); // host -> count over the data
const seen = new Map(); // key -> row data
for (const f of dataFiles) {
  const t = fs.readFileSync(f, "utf8");
  for (const m of t.matchAll(/["'](https?:\/\/[^"'\s]+?\.(?:jpe?g|png|webp|avif|gif|svg))(?:\?[^"']*)?["']/gi)) {
    const u = new URL(m[1]);
    remoteCount.set(u.host, (remoteCount.get(u.host) || 0) + 1);
    const key = `${u.host}${u.pathname}`;
    const s = seen.get(key) || { host: u.host, pfad: u.pathname, anzahl: 0, files: new Set() };
    s.anzahl++;
    s.files.add(rel(f));
    seen.set(key, s);
  }
  for (const m of t.matchAll(/["'](\/(?:Images|images|labs)\/[^"'\s]+?\.(?:jpe?g|png|webp|avif|gif|svg))["']/g)) {
    const key = `lokal${m[1]}`;
    const s = seen.get(key) || { host: "lokal", pfad: m[1], anzahl: 0, files: new Set() };
    s.anzahl++;
    s.files.add(rel(f));
    seen.set(key, s);
  }
}
for (const s of [...seen.values()].sort((a, b) => (a.host + a.pfad).localeCompare(b.host + b.pfad))) {
  const local = s.host === "lokal";
  add({
    quelle: "src/lib/data",
    host: s.host,
    pfad: s.pfad,
    anzahl: s.anzahl,
    fundstelle: [...s.files].join(" | "),
    herkunft: local ? guessLocal(s.pfad) + " (Platzhalterbild im statischen Katalog)" : guessRemote(s.host),
    inRemote: local ? "–" : inRemote(s.host),
    hinweis: local
      ? fs.existsSync(path.join(ROOT, "public", s.pfad))
        ? ""
        : "Datei fehlt in public/"
      : REMOTE_HOSTS.includes(s.host)
        ? "über den Bildoptimierer (next/image) von unserem Server geladen"
        : "Host NICHT in remotePatterns: next/image lehnt ab – prüfen, ob/wie das Bild ausgeliefert wird",
  });
}

// remotePatterns rows (one per host, with usage)
for (const host of REMOTE_HOSTS) {
  const n = remoteCount.get(host) || 0;
  add({
    quelle: "next.config.js remotePatterns",
    host,
    pfad: "/**",
    anzahl: n,
    fundstelle: "next.config.js",
    herkunft: guessRemote(host),
    inRemote: "ja",
    hinweis:
      host === "backoffice.platzhirsch.studio"
        ? "Bilder des Backoffice; Stichprobe siehe Zeilen „Backoffice-Stichprobe“"
        : n
          ? `${n} Bild-URLs in src/lib/data`
          : "in src/lib/data nicht verwendet – Kandidat zum Streichen (Masterplan INT 7)",
  });
}

// 4. backoffice sample (own running server)
let sampleNote = "";
if (!args["no-sample"]) {
  const found = new Map();
  let ok = 0;
  for (const page of SAMPLE_PAGES) {
    try {
      const res = await fetch(BASE + page, { signal: AbortSignal.timeout(90_000) });
      if (!res.ok) continue;
      ok++;
      const html = await res.text();
      const urls = new Set();
      for (const m of html.matchAll(/\/cmx\/files\/[^"'\s\\?&)]+/g)) urls.add(decodeURIComponent(m[0]));
      for (const m of html.matchAll(/\/_next\/image\?url=([^"'\s\\&]+)/g)) {
        const u = decodeURIComponent(m[1]);
        if (u.startsWith("/cmx/files/") || /^https?:/.test(u)) urls.add(u);
      }
      for (const u of urls) {
        const s = found.get(u) || { pages: new Set() };
        s.pages.add(page);
        found.set(u, s);
      }
    } catch {
      /* page unreachable: noted below */
    }
  }
  sampleNote = `${ok}/${SAMPLE_PAGES.length} Seiten von ${BASE}`;
  for (const [u, s] of [...found.entries()].sort()) {
    const remote = /^https?:/.test(u);
    const host = remote ? new URL(u).host : "backoffice.platzhirsch.studio";
    add({
      quelle: "Backoffice-Stichprobe",
      host,
      pfad: remote ? new URL(u).pathname : u.replace(/^\/cmx/, ""),
      anzahl: s.pages.size,
      fundstelle: [...s.pages].slice(0, 3).join(" | ") + (s.pages.size > 3 ? ` | +${s.pages.size - 3}` : ""),
      herkunft: guessRemote(host),
      inRemote: inRemote(host),
      hinweis: remote ? "" : "über /cmx (eigener Server) aus dem Backoffice",
    });
  }
}

const COLS = ["quelle", "host", "pfad", "anzahl", "fundstelle", "herkunft_vermutet", "rechteinhaber", "freigabe", "umfang", "in_remotePatterns", "hinweis"];
const cell = (v) => {
  const s = String(v ?? "");
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const csv = "﻿" + [COLS.join(";"), ...rows.map((r) => COLS.map((c) => cell(r[c])).join(";"))].join("\r\n") + "\r\n";
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, csv);

const by = rows.reduce((m, r) => ((m[r.quelle] = (m[r.quelle] || 0) + 1), m), {});
const hosts = [...new Set(rows.map((r) => r.host))];
console.log(`Bildregister: ${rows.length} Zeilen -> ${rel(OUT)}`);
for (const [k, v] of Object.entries(by)) console.log(`  ${k}: ${v}`);
console.log(`  Hosts: ${hosts.join(", ")}`);
console.log(`  remotePatterns: ${REMOTE_HOSTS.join(", ")}`);
if (sampleNote) console.log(`  Stichprobe: ${sampleNote}`);
