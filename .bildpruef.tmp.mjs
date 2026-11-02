// Bildprüfung: passt jedes Katalogbild zu Produkt, Bildtyp und vorhandenem Alt-Text? (qwen2.5vl:7b, 4 parallel)
import fs from "node:fs"; import path from "node:path"; import sharp from "sharp";
import { ALLE_PRODUKTE, KATALOG_MARKEN } from "./src/lib/katalog/index.js";
const OUT = process.argv[2]; const PAR = Number(process.argv[3] || 4); const done = new Set();
if (fs.existsSync(OUT)) for (const l of fs.readFileSync(OUT, "utf8").split("\n")) if (l) try { done.add(JSON.parse(l).src); } catch {}
const marke = Object.fromEntries(KATALOG_MARKEN.map((m) => [m.slug, m.name]));
const jobs = ALLE_PRODUKTE.flatMap((p) => (p.bilder || []).map((b) => ({ p, b }))).filter(({ b }) => !done.has(b.src));
console.log(`offen ${jobs.length}, fertig ${done.size}`);
const t0 = Date.now(); let n = 0, i = 0;
async function worker() {
  while (i < jobs.length) {
    const { p, b } = jobs[i++];
    const file = path.join("public", decodeURIComponent(b.src));
    if (!fs.existsSync(file)) { fs.appendFileSync(OUT, JSON.stringify({ src: b.src, slug: p.slug, fehlt: true }) + "\n"); continue; }
    const jpg = await sharp(file).resize({ width: 672, height: 672, fit: "inside" }).jpeg({ quality: 80 }).toBuffer();
    const alt = typeof b.alt === "object" ? b.alt?.de : b.alt;
    const prompt = `Katalog sagt: Produkt "${marke[p.marke] || p.marke} ${p.name}", Kategorie "${p.kategorie}", Bildtyp "${b.typ || "unbekannt"}" (freisteller = Produkt allein vor neutralem Hintergrund, ambiente = Raum-/Szenenbild, detail = Nahaufnahme). Alt-Text: "${alt || "-"}".
Prüfe NUR anhand des Bildes. Antworte ausschließlich als JSON: {"produkt_passt": true|false, "bildtyp_ist": "freisteller"|"ambiente"|"detail"|"logo_text"|"anderes", "alt_passt": true|false, "problem": "kurz auf Deutsch oder leer"}`;
    try {
      const r = await fetch("http://localhost:11434/api/generate", { method: "POST", body: JSON.stringify({ model: "qwen2.5vl:7b", prompt, images: [jpg.toString("base64")], stream: false, format: "json", options: { temperature: 0, num_predict: 120 } }) });
      const j = await r.json(); let v = {}; try { v = JSON.parse(j.response); } catch { v = { roh: j.response }; }
      fs.appendFileSync(OUT, JSON.stringify({ src: b.src, slug: p.slug, marke: p.marke, kategorie: p.kategorie, typ: b.typ || null, ...v }) + "\n");
    } catch (e) { fs.appendFileSync(OUT, JSON.stringify({ src: b.src, slug: p.slug, fehler: String(e).slice(0, 120) }) + "\n"); }
    if (++n % 50 === 0) console.log(`${n}/${jobs.length} · ${((Date.now() - t0) / n / 1000).toFixed(2)} s/Bild`);
  }
}
await Promise.all(Array.from({ length: PAR }, worker));
console.log("fertig", n);
