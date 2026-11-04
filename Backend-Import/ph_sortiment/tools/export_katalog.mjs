#!/usr/bin/env node
// Backend-Import/ph_sortiment/tools/export_katalog.mjs
// Liest den statischen Herstellerkatalog der Website (src/lib/katalog/index.js, unverändert, nur lesend)
// und schreibt ihn vollständig als JSON für den Python-Importer ph_sortiment.importer.katalog
// (alle vier Sprachen, Bilder mit Quelle/Abrufdatum, Maße, Ausführungen, Preise mit Stand, Zubehör,
// Marken mit dealer-Flag). Zusätzlich eine flache CSV als Data-Import-Vorlage für „PH Produkt“.
//
// Aufruf aus dem Website-Repo (Node ≥ 18):
//   node Backend-Import/ph_sortiment/tools/export_katalog.mjs [--out=/pfad/ph-katalog.json] [--marke=soleum] [--website=<repo>]
// Nichts wird gesendet; die Datei wird anschließend auf der Staging-Bench importiert (README).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const args = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith("--")).map((a) => a.slice(2).split("=")));
const HIER = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(args.website || path.join(HIER, "../../.."));
const out = path.resolve(args.out || path.join(HIER, "../import_vorlagen/ph-katalog.json"));

const katalogUrl = pathToFileURL(path.join(REPO, "src/lib/katalog/index.js")).href;
const schemaUrl = pathToFileURL(path.join(REPO, "src/lib/katalog/schema.js")).href;
const { ALLE_PRODUKTE, KATALOG_MARKEN } = await import(katalogUrl);
const { KATEGORIEN, textOf } = await import(schemaUrl);

const marken = KATALOG_MARKEN.filter((m) => !args.marke || m.slug === args.marke).map((m) => ({
  slug: m.slug,
  name: m.name,
  welt: m.welt,
  herstellerUrl: m.herstellerUrl,
  dealer: m.dealer === true,
  stand: m.stand || null,
  querverweise: m.querverweise || [],
  looks: (m.looks || []).map((l) => ({ id: l.id, titel: l.titel, bild: l.bild, produkte: l.produkte })),
}));

// Produkte 1:1 (eingefrorene Objekte → einfache Kopien), Minotti ist nicht Teil des statischen Katalogs.
const produkte = ALLE_PRODUKTE.filter((p) => !args.marke || p.marke === args.marke).map((p) => JSON.parse(JSON.stringify(p)));

const daten = {
  _hinweis: "Export des statischen Herstellerkatalogs für ph_sortiment.importer.katalog. Nur Staging. Felder wie src/lib/katalog/schema.js.",
  erzeugt: new Date().toISOString().slice(0, 10),
  quelle: "src/lib/katalog/marken/*.js",
  kategorien: KATEGORIEN,
  marken,
  produkte,
};
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(daten, null, 1) + "\n");

// Flache CSV (Data-Import-Vorlage PH Produkt; Kindtabellen werden vom JSON-Importer übernommen).
const cols = ["slug", "name_herstellerbezeichnung", "marke", "kategorie", "welt", "bereich", "serie", "designer", "hersteller_url", "stand", "kurz_de", "kurz_en", "kurz_fr", "kurz_it", "preisart", "aktueller_preis_eur", "preis_stand", "preis_quelle", "bild_1", "bild_1_quelle"];
const welt = { "bad-wellness": "Bad-Wellness", kuechengeraete: "Kueche", accessoires: "Accessoires" };
const cell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
const preisAb = (pr) => (!pr ? "" : pr.art === "uvp-ab" ? pr.uvpAb : pr.betrag != null ? pr.betrag : Math.min(...(pr.varianten || []).map((v) => v.betrag)));
const rows = produkte.map((p) =>
  [
    p.slug, p.name, marken.find((m) => m.slug === p.marke)?.name || p.marke, p.kategorie, welt[p.welt] || "", p.bereich, p.serie || "", p.designer || "", p.herstellerUrl, p.stand,
    textOf(p.kurz, "de"), textOf(p.kurz, "en"), textOf(p.kurz, "fr"), textOf(p.kurz, "it"),
    p.preis ? (p.preis.art === "verkaufspreis" ? "Verkaufspreis" : "UVP") : "Auf Anfrage", preisAb(p.preis), p.preis?.stand || "", p.preis?.quelle || "",
    p.bilder?.[0]?.src || "", p.bilder?.[0]?.quelleUrl || "",
  ].map(cell).join(";")
);
const csv = out.replace(/\.json$/, ".csv");
fs.writeFileSync(csv, "﻿" + [cols.join(";"), ...rows].join("\r\n") + "\r\n");
console.log(`${marken.length} Marken, ${produkte.length} Produkte → ${out} (+ ${path.basename(csv)})`);
