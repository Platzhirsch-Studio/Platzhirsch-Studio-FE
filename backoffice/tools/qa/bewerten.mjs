// backoffice/tools/qa/bewerten.mjs – Bildbewertung der Screenshots durch ein lokales Bildmodell.
//
//   node backoffice/tools/qa/bewerten.mjs <ausgabeordner> [--nur <muster>] [--alle] [--neu] [--modell qwen2.5vl:7b]
//
// Schickt jeden Screenshot aus <ausgabeordner> (verkleinert auf max. 1280 px Breite, bei
// sehr hohen Vollseiten auf die oberen 1800 px beschnitten, PNG → base64) an Ollama
// (`/api/chat` mit `images` und JSON-Schema als `format`) mit einer festen deutschen
// Prüfanweisung und sammelt die Antworten in bewertung.json und bewertung.md.
//
// WICHTIG – Einordnung der Ergebnisse: Das Modell (qwen2.5vl:7b, 8 GB GPU, 4-Bit) liefert
// HINWEISE, keine Urteile. Es übersieht Dinge, erfindet gelegentlich Befunde (etwa
// „abgeschnittener Text“, wo nur der Ausschnitt endet), bewertet Platzhalter-Seiten
// des Mock-Modus wie fertige Seiten und vergibt Noten mit großer Streuung. Jeder
// Befund ist am Screenshot nachzusehen, bevor er ins Polish-Backlog geht.
//
// Robustheit: je Bild bis zu drei Versuche (Timeout 10 min pro Anfrage), bewertung.json
// wird nach jedem Bild geschrieben; ein erneuter Aufruf setzt fort und überspringt bereits
// bewertete Dateien (--neu bewertet alles neu). Ohne --alle werden nur Aufnahmen der
// Kernseiten bewertet (bericht.json: kern=true); generische DocType-Listen teilen sich
// eine Vorlage. Andere geladene Ollama-Modelle werden vorher entladen (nur eines im Speicher).
// Umgebung: OLLAMA_URL (Standard http://localhost:11434), QA_MODELL, QA_OLLAMA_TIMEOUT_MS.

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { alleRouten, slugVon } from "./routen/index.mjs";

const argv = process.argv.slice(2);
const MIT_WERT = new Set(["--nur", "--modell"]);
let ordner;
for (let i = 0; i < argv.length; i++) {
  if (MIT_WERT.has(argv[i])) i++;
  else if (!argv[i].startsWith("--") && !ordner) ordner = argv[i];
}
const opt = (name) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : undefined);
if (!ordner || !fs.existsSync(ordner)) {
  console.error("Aufruf: node backoffice/tools/qa/bewerten.mjs <ausgabeordner> [--nur <muster>] [--alle] [--neu] [--modell <name>]");
  process.exit(1);
}
const OLLAMA = (process.env.OLLAMA_URL || "http://localhost:11434").replace(/\/$/, "");
const MODELL = opt("--modell") || process.env.QA_MODELL || "qwen2.5vl:7b";
const TIMEOUT_MS = Number(process.env.QA_OLLAMA_TIMEOUT_MS) || 600_000;
const MAX_BREITE = 1280;
const MAX_HOEHE = 1800;
const ALLE = argv.includes("--alle");
const NEU = argv.includes("--neu");
const NUR = opt("--nur");

const PRUEFANWEISUNG = `Du bist UI-Reviewer und siehst den Screenshot einer internen Backoffice-Web-Anwendung (deutsch, Möbelstudio). Maßstab für moderne Optik: Linear, Stripe Dashboard, Notion.
Beschreibe nur, was du in DIESEM Bild tatsächlich siehst. Jeder Befund muss einen konkreten Ort nennen (z. B. „Kopfzeile rechts“, „Tabelle, Spalte Status“, „Karte ‚Verlauf‘“, „Formularfeld ‚Nachname‘“) und das konkrete Problem (mit sichtbarem Text, wenn möglich). Allgemeine Sätze wie „einige Felder sind zu klein“ sind wertlos – nenne welche. Ist das Bild in einem Punkt sauber, nenne keinen Befund dazu; eine leere Befundliste ist erlaubt.
Prüfkategorien: Layoutbruch (umbrechende Navigation, verrutschte Spalten, Überlagerung), abgeschnittener oder überlappender Text, zu kleine Schrift, schwacher Kontrast (besonders im dunklen Schema), inkonsistente Abstände/Ausrichtung, leere oder platzhalterhafte Fläche ohne Erklärung, unklare Hierarchie, fehlende oder unklare Primäraktion, unmoderne Optik (schwere Rahmen, Standard-Browser-Elemente, uneinheitliche Icons, altmodische Tabellen).
Hinweise: Vollseiten-Aufnahme – ein Ende am unteren Rand ist kein Abschneiden. Eine feststehende Leiste (Speichern/Seitenleiste) kann in der Mitte des Bildes erscheinen; das ist ein Aufnahme-Effekt, kein Befund. Das orange Band „Testmodus“ oben ist beabsichtigt. Das runde „N“-Zeichen unten links ist ein Entwicklungswerkzeug, kein Teil der Anwendung.
Antworte als JSON gemäß Schema, auf Deutsch, höchstens 6 Befunde, höchstens 3 Stärken. note_1_bis_10: 10 = Niveau Linear/Stripe, 7 = solide mit kleinen Schwächen, 5 = brauchbar mit sichtbaren Schwächen, 1 = unbenutzbar.`;

const SCHEMA = {
  type: "object",
  properties: {
    note_1_bis_10: { type: "integer", minimum: 1, maximum: 10 },
    befunde: {
      type: "array",
      items: {
        type: "object",
        properties: {
          schwere: { type: "string", enum: ["hoch", "mittel", "niedrig"] },
          ort: { type: "string" },
          problem: { type: "string" },
          vorschlag: { type: "string" },
        },
        required: ["schwere", "ort", "problem", "vorschlag"],
      },
    },
    staerken: { type: "array", items: { type: "string" } },
  },
  required: ["note_1_bis_10", "befunde", "staerken"],
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function ollama(pfad, body, timeoutMs = TIMEOUT_MS) {
  const res = await fetch(`${OLLAMA}${pfad}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`Ollama ${pfad}: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

// Nur ein Modell im Speicher: andere geladene Modelle entladen (keep_alive 0).
async function nurEinModell() {
  try {
    const ps = await (await fetch(`${OLLAMA}/api/ps`, { signal: AbortSignal.timeout(10_000) })).json();
    for (const m of ps.models || []) {
      if (m.name === MODELL || m.model === MODELL) continue;
      console.log(`Entlade ${m.name} …`);
      await ollama("/api/generate", { model: m.name, keep_alive: 0 }, 60_000).catch(() => {});
    }
  } catch (err) {
    throw new Error(`Ollama nicht erreichbar unter ${OLLAMA}: ${err.message}`);
  }
}

async function bildVorbereiten(datei) {
  const img = sharp(datei);
  const meta = await img.metadata();
  const skal = Math.min(1, MAX_BREITE / meta.width);
  let pipe = img.resize({ width: Math.round(meta.width * skal), withoutEnlargement: true });
  const hoeheNeu = Math.round(meta.height * skal);
  let beschnitten = false;
  if (hoeheNeu > MAX_HOEHE) {
    pipe = sharp(await pipe.png().toBuffer()).extract({ left: 0, top: 0, width: Math.round(meta.width * skal), height: MAX_HOEHE });
    beschnitten = true;
  }
  const buf = await pipe.png({ compressionLevel: 6 }).toBuffer();
  return { base64: buf.toString("base64"), breite: Math.round(meta.width * skal), hoehe: Math.min(hoeheNeu, MAX_HOEHE), beschnitten, original: { breite: meta.width, hoehe: meta.height } };
}

async function bewerte(datei, kontext) {
  const bild = await bildVorbereiten(datei);
  const hinweis = `Seite: ${kontext.titel || kontext.route} (${decodeURIComponent(kontext.route || "")}), Viewport ${kontext.viewport} ${kontext.breite || ""}, Farbschema ${kontext.schema}.${bild.beschnitten ? " Nur die oberen 1800 px der Seite sind abgebildet." : ""}`;
  let letzterFehler;
  for (let versuch = 1; versuch <= 3; versuch++) {
    const t0 = Date.now();
    try {
      const antwort = await ollama("/api/chat", {
        model: MODELL,
        stream: false,
        format: SCHEMA,
        keep_alive: "15m",
        options: { temperature: 0.2, num_ctx: 6144, num_predict: 1100 },
        messages: [{ role: "user", content: `${PRUEFANWEISUNG}\n\n${hinweis}`, images: [bild.base64] }],
      });
      const inhalt = JSON.parse(antwort.message?.content || "{}");
      if (typeof inhalt.note_1_bis_10 !== "number") throw new Error("Antwort ohne Note");
      return { ...inhalt, befunde: Array.isArray(inhalt.befunde) ? inhalt.befunde : [], staerken: Array.isArray(inhalt.staerken) ? inhalt.staerken : [], dauerMs: Date.now() - t0, versuch, bild: { breite: bild.breite, hoehe: bild.hoehe, beschnitten: bild.beschnitten } };
    } catch (err) {
      letzterFehler = err;
      console.warn(`  Versuch ${versuch} fehlgeschlagen (${Math.round((Date.now() - t0) / 1000)} s): ${String(err.message || err).slice(0, 160)}`);
      await sleep(5000 * versuch);
    }
  }
  return { fehler: String(letzterFehler?.message || letzterFehler).slice(0, 300) };
}

function schreibeBewertung(b) {
  fs.writeFileSync(path.join(ordner, "bewertung.json"), JSON.stringify(b, null, 2));
  const z = [];
  const ok = b.bilder.filter((x) => !x.fehler && typeof x.note === "number");
  const schnitt = ok.length ? (ok.reduce((s, x) => s + x.note, 0) / ok.length).toFixed(1) : "–";
  z.push(`# Bildbewertung Backoffice – ${b.start}`);
  z.push("");
  z.push(`> **Einordnung:** Die Bewertung stammt vom lokalen Bildmodell \`${b.modell}\` und liefert **Hinweise, keine Urteile**. Das Modell übersieht Befunde, erfindet gelegentlich welche (z. B. „abgeschnitten“ am Bildende) und bewertet Mock-Platzhalter wie fertige Seiten. Jeder Punkt ist am Screenshot gegenzuprüfen.`);
  z.push("");
  z.push(`Modell: ${b.modell} · bewertete Bilder: ${ok.length}/${b.bilder.length} · Fehler: ${b.bilder.filter((x) => x.fehler).length} · Durchschnittsnote: ${schnitt} · Dauer: ${Math.round((b.dauerMs || 0) / 1000)} s`);
  z.push("");
  z.push("## Übersicht Route × Viewport × Schema");
  z.push("");
  z.push("| Route | Viewport | Schema | Note | hoch | mittel | niedrig | Top-Befunde |");
  z.push("|---|---|---|---|---|---|---|---|");
  for (const x of b.bilder) {
    if (x.fehler) {
      z.push(`| \`${decodeURIComponent(x.route || x.datei)}\` | ${x.viewport || ""} | ${x.schema || ""} | – | | | | Fehler: ${x.fehler.replace(/\|/g, "/")} |`);
      continue;
    }
    const n = (s) => x.befunde.filter((f) => f.schwere === s).length;
    const top = x.befunde
      .slice()
      .sort((a, c) => ["hoch", "mittel", "niedrig"].indexOf(a.schwere) - ["hoch", "mittel", "niedrig"].indexOf(c.schwere))
      .slice(0, 3)
      .map((f) => `**${f.schwere}** ${f.ort}: ${f.problem}`.replace(/\|/g, "/"))
      .join("<br>");
    z.push(`| \`${decodeURIComponent(x.route || x.datei)}\` | ${x.viewport} | ${x.schema} | ${x.note} | ${n("hoch")} | ${n("mittel")} | ${n("niedrig")} | ${top || "–"} |`);
  }
  z.push("");
  // Häufigste Probleme über alle Bilder (nach Problemtext grob gebündelt)
  const haeufig = new Map();
  for (const x of ok) for (const f of x.befunde) {
    const k = f.problem.toLowerCase().replace(/[^a-zäöüß ]/g, "").split(" ").slice(0, 6).join(" ");
    const e = haeufig.get(k) || { anzahl: 0, beispiel: f, orte: new Set() };
    e.anzahl++;
    e.orte.add(`${x.viewport}/${x.schema} ${decodeURIComponent(x.route || "")}`);
    haeufig.set(k, e);
  }
  const top = [...haeufig.values()].sort((a, c) => c.anzahl - a.anzahl).slice(0, 20);
  z.push("## Häufigste Befunde (Modellhinweise, gebündelt)");
  z.push("");
  for (const e of top) z.push(`- ${e.anzahl}× [${e.beispiel.schwere}] ${e.beispiel.problem} – Vorschlag: ${e.beispiel.vorschlag} _(z. B. ${[...e.orte].slice(0, 2).join("; ")})_`);
  z.push("");
  z.push("## Alle Befunde je Bild");
  z.push("");
  for (const x of ok) {
    z.push(`### ${decodeURIComponent(x.route || x.datei)} · ${x.viewport} · ${x.schema} – Note ${x.note} (${x.datei})`);
    z.push("");
    for (const f of x.befunde) z.push(`- [${f.schwere}] ${f.ort}: ${f.problem} → ${f.vorschlag}`);
    if (x.staerken.length) z.push(`- Stärken: ${x.staerken.join("; ")}`);
    z.push("");
  }
  fs.writeFileSync(path.join(ordner, "bewertung.md"), z.join("\n"));
}

async function main() {
  const start = Date.now();
  await nurEinModell();

  const berichtPfad = path.join(ordner, "bericht.json");
  const bericht = fs.existsSync(berichtPfad) ? JSON.parse(fs.readFileSync(berichtPfad, "utf8")) : null;
  let kandidaten;
  if (bericht) {
    // Kern-Kennzeichnung aktuell aus routen.mjs (bericht.json kann älter sein).
    const kernJeSlug = new Map(alleRouten().filter((r) => r.pfad).map((r) => [slugVon(r.pfad), !!r.kern]));
    for (const e of bericht.eintraege) if (e.slug && kernJeSlug.has(e.slug)) e.kern = kernJeSlug.get(e.slug);
    kandidaten = bericht.eintraege.filter((e) => e.datei && fs.existsSync(path.join(ordner, e.datei))).map((e) => ({ datei: e.datei, route: e.route, titel: e.titel, viewport: e.viewport, breite: e.innenBreite ? `${e.innenBreite}px` : "", schema: e.schema, kern: e.kern }));
    if (!ALLE) kandidaten = kandidaten.filter((k) => k.kern !== false);
  } else {
    kandidaten = fs.readdirSync(ordner).filter((f) => f.endsWith(".png")).map((f) => {
      const m = f.match(/^(.*)--(desktop|ipad|iphone)--(hell|dunkel)\.png$/);
      return { datei: f, route: m ? "/" + m[1] : f, viewport: m?.[2] || "", schema: m?.[3] || "", kern: true };
    });
  }
  if (NUR) {
    let re = null;
    try { re = new RegExp(NUR, "i"); } catch { re = null; }
    kandidaten = kandidaten.filter((k) => (re ? re.test(`${k.datei} ${decodeURIComponent(k.route || "")} ${k.titel || ""}`) : `${k.datei} ${k.route}`.toLowerCase().includes(NUR.toLowerCase())));
  }

  const bewPfad = path.join(ordner, "bewertung.json");
  const alt = !NEU && fs.existsSync(bewPfad) ? JSON.parse(fs.readFileSync(bewPfad, "utf8")) : null;
  const bewertung = { start: alt?.start || new Date().toISOString(), modell: MODELL, ollama: OLLAMA, bilder: alt?.bilder?.filter((b) => !b.fehler) || [] };
  const fertig = new Set(bewertung.bilder.map((b) => b.datei));
  const offen = kandidaten.filter((k) => !fertig.has(k.datei));
  console.log(`${kandidaten.length} Bilder (${ALLE ? "alle" : "nur Kernseiten"}), ${fertig.size} bereits bewertet, ${offen.length} offen. Modell ${MODELL}.`);

  for (const [i, k] of offen.entries()) {
    const t0 = Date.now();
    const r = await bewerte(path.join(ordner, k.datei), k);
    const eintrag = { ...k, ...(r.fehler ? { fehler: r.fehler } : { note: r.note_1_bis_10, befunde: r.befunde, staerken: r.staerken, dauerMs: r.dauerMs, versuch: r.versuch, bild: r.bild }) };
    delete eintrag.breite;
    bewertung.bilder.push(eintrag);
    bewertung.dauerMs = (alt?.dauerMs || 0) + (Date.now() - start);
    schreibeBewertung(bewertung);
    console.log(`${String(i + 1).padStart(3)}/${offen.length} ${k.datei.padEnd(60)} ${r.fehler ? "FEHLER " + r.fehler.slice(0, 80) : `Note ${r.note_1_bis_10}, ${r.befunde.length} Befunde`} (${Math.round((Date.now() - t0) / 1000)} s)`);
  }
  bewertung.ende = new Date().toISOString();
  schreibeBewertung(bewertung);
  console.log(`Fertig → ${path.join(ordner, "bewertung.md")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
