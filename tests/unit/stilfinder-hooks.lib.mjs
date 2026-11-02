// Gemeinsamer Lade-Hook der Stil-Finder-Unit-Tests (mobil-code-seo, fix-04).
// Vorher stand derselbe register(...)-Block wörtlich in sieben Testdateien.
//  - resolve: Next-Importe ohne Endung ("./profiles") → "./profiles.js"
//  - load: Bildimporte (jpg/png/webp/avif) → kleines Stub-Objekt wie next/image
// Kein *.test.mjs – der Glob tests/unit/**/*.test.mjs führt die Datei nicht aus.
import { register } from "node:module";

let done = false;

/** Einmal je Prozess; vor dem ersten dynamischen import() der App-Module aufrufen. */
export function registerStilfinderHooks({ blurDataURL = "" } = {}) {
  if (done) return;
  done = true;
  const stub = JSON.stringify({ src: "/x.jpg", width: 10, height: 10, blurDataURL });
  register(
    "data:text/javascript," +
      encodeURIComponent(`
export async function resolve(spec, ctx, next) {
  try { return await next(spec, ctx); }
  catch (e) { if (spec.startsWith(".") && !spec.split("/").pop().includes(".")) return next(spec + ".js", ctx); throw e; }
}
export async function load(url, ctx, next) {
  if ([".jpg", ".jpeg", ".png", ".webp", ".avif"].some((x) => url.toLowerCase().endsWith(x)))
    return { format: "module", shortCircuit: true, source: "export default " + ${JSON.stringify(stub)} + ";" };
  return next(url, ctx);
}`)
  );
}
