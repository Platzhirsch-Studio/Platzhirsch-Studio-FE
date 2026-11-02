// Alt-Text-Entwürfe für Katalogbilder mit lokalem Bildmodell (qwen2.5vl:7b, GPU).
// Nur Szene/Farbe/Form aus dem Bild; Marke + Name kommen aus dem Katalog. Fortsetzbar.
import fs from "node:fs"; import path from "node:path"; import sharp from "sharp";
import { ALLE_PRODUKTE, KATALOG_MARKEN } from "./src/lib/katalog/index.js";
const OUT = process.argv[2]; const done = new Set();
if (fs.existsSync(OUT)) for (const l of fs.readFileSync(OUT, "utf8").split("\n")) if (l) try { done.add(JSON.parse(l).src); } catch {}
const marke = Object.fromEntries(KATALOG_MARKEN.map((m) => [m.slug, m.name]));
const jobs = ALLE_PRODUKTE.flatMap((p) => (p.bilder || []).map((b) => ({ p, b }))).filter(({ b }) => !done.has(b.src));
console.log(`offen: ${jobs.length}, schon fertig: ${done.size}`);
const t0 = Date.now(); let n = 0;
for (const { p, b } of jobs) {
  const file = path.join("public", decodeURIComponent(b.src));
  if (!fs.existsSync(file)) continue;
  const jpg = await sharp(file).resize({ width: 768, height: 768, fit: "inside" }).jpeg({ quality: 80 }).toBuffer();
  const kurz = (p.kurz && (p.kurz.de || p.kurz)) || "";
  const prompt = `Produkt laut Katalog: ${marke[p.marke] || p.marke} ${p.name} (${p.kategorie}). ${String(kurz).slice(0, 300)}\nBeschreibe NUR, was auf dem Bild sichtbar ist, für einen Alt-Text auf Deutsch: Ansicht (Freisteller oder Raumbild), Farben, Form, Oberfläche, Umgebung. Höchstens 20 Wörter, ein Satz, ohne Markennamen, ohne Wertung, ohne Werbung, keine Vermutungen über Material, das nicht klar sichtbar ist.`;
  const r = await fetch("http://localhost:11434/api/generate", { method: "POST", body: JSON.stringify({ model: "qwen2.5vl:7b", prompt, images: [jpg.toString("base64")], stream: false, options: { temperature: 0.2, num_predict: 80 } }) });
  const j = await r.json();
  fs.appendFileSync(OUT, JSON.stringify({ src: b.src, slug: p.slug, marke: p.marke, typ: b.typ || null, vorschlag: (j.response || "").trim(), alt_heute: b.alt || null }) + "\n");
  if (++n % 25 === 0) console.log(`${n}/${jobs.length} · ${((Date.now() - t0) / n / 1000).toFixed(1)} s/Bild`);
}
console.log("fertig", n);
