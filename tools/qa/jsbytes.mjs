// tools/qa/jsbytes.mjs – JS im Server-HTML je Route (gzip), gegen einen Prod-Server.
//
//   node tools/qa/jsbytes.mjs [--base=http://localhost:3100] [--json=out.json] [--strict] [route …]
//
// Gezählt werden <script src> und <link rel=modulepreload|preload as=script>
// aus dem Server-HTML. Skripte mit `noModule` (core-js-Polyfill von Next)
// laden moderne Browser NICHT – sie stehen getrennt in `noModuleGzKB` und
// zählen nicht in `jsGzKB` (Speed-Recherche T7, N2: die früheren Messungen
// waren dadurch um ≈ 38,6 KB zu hoch).
// Wächter: Ein Chunk des ersten Ladens, der three.js enthält (WebGLRenderer,
// REVISION-Kennung), wird gemeldet; mit --strict endet das Skript dann mit 1.
import zlib from "node:zlib";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const DEFAULT_ROUTES = ["/de", "/de/sofaplaner", "/de/yacht-interior", "/de/produkte", "/de/ezarri", "/de/beratung"];

// three.js-Merkmale, die minifiziert erhalten bleiben (Klassennamen als
// Strings in Fehlermeldungen bzw. die Revisionskonstante).
export const THREE_MARKERS = [/THREE\.WebGLRenderer/, /WebGLRenderer: /, /__THREE__/];

export function scriptRefs(html) {
  const out = [];
  for (const m of html.matchAll(/<script\b[^>]*>/g)) {
    const src = m[0].match(/\ssrc="([^"]+)"/);
    if (!src) continue;
    out.push({ src: src[1].replace(/&amp;/g, "&"), noModule: /\snomodule(?:=|\s|>|$)/i.test(m[0]) });
  }
  for (const m of html.matchAll(/<link\b[^>]*rel="(?:modulepreload|preload)"[^>]*>/g)) {
    if (/\srel="preload"/.test(m[0]) && !/\sas="script"/.test(m[0])) continue;
    const h = m[0].match(/\shref="([^"]+)"/);
    if (h && /\.js(\?|$)/.test(h[1])) out.push({ src: h[1].replace(/&amp;/g, "&"), noModule: false });
  }
  const seen = new Map();
  for (const r of out) if (!seen.has(r.src) || (seen.get(r.src).noModule && !r.noModule)) seen.set(r.src, r);
  return [...seen.values()];
}

export const hasThree = (code) => THREE_MARKERS.some((re) => re.test(code));

const kb = (n) => Math.round(n / 102.4) / 10;

export async function measure({ base = "http://localhost:3100", routes = DEFAULT_ROUTES } = {}) {
  const rows = [];
  for (const r of routes) {
    const html = await (await fetch(base + r)).text();
    let js = 0, raw = 0, nm = 0;
    const files = [];
    const three = [];
    for (const ref of scriptRefs(html)) {
      const u = new URL(ref.src, base);
      if (u.origin !== new URL(base).origin) continue;
      const b = Buffer.from(await (await fetch(u)).arrayBuffer());
      const g = zlib.gzipSync(b, { level: 9 }).length;
      if (ref.noModule) nm += g;
      else {
        js += g;
        raw += b.length;
        if (hasThree(b.toString("utf8"))) three.push(u.pathname.split("/").pop());
      }
      files.push([u.pathname.split("/").pop(), kb(g), ref.noModule ? "noModule" : ""]);
    }
    const htmlGz = zlib.gzipSync(Buffer.from(html), { level: 9 }).length;
    rows.push({ route: r, jsGzKB: kb(js), jsRawKB: kb(raw), noModuleGzKB: kb(nm), htmlGzKB: kb(htmlGz), n: files.length, three, files: files.sort((a, b) => b[1] - a[1]) });
  }
  return rows;
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  const argv = process.argv.slice(2);
  const opt = Object.fromEntries(argv.filter((a) => a.startsWith("--")).map((a) => { const [k, ...v] = a.slice(2).split("="); return [k, v.length ? v.join("=") : true]; }));
  const routes = argv.filter((a) => !a.startsWith("--"));
  const rows = await measure({ base: String(opt.base || "http://localhost:3100").replace(/\/+$/, ""), routes: routes.length ? routes : DEFAULT_ROUTES });
  for (const row of rows) console.log(`${row.route.padEnd(22)} JS ${String(row.jsGzKB).padStart(6)} KB gz (noModule ${row.noModuleGzKB} KB nicht gezählt) · HTML ${row.htmlGzKB} KB gz · ${row.n} Skripte${row.three.length ? ` · THREE IM ERSTEN LADEN: ${row.three.join(", ")}` : ""}`);
  if (opt.json) {
    const out = path.resolve(String(opt.json));
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, JSON.stringify(rows, null, 2));
  }
  if (opt.strict && rows.some((r) => r.three.length)) process.exit(1);
}
