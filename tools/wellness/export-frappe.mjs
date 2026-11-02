#!/usr/bin/env node
// tools/wellness/export-frappe.mjs
// Erzeugt aus dem statischen Herstellerkatalog (src/lib/katalog) eine
// Importdatei im Format des Frappe-Doctypes „Produkte New“ – NUR erzeugen,
// NICHTS an das Backoffice senden (dort schreiben wir nicht; Import macht das
// Backoffice-Team von Hand, siehe qa-screenshots/wellness/produkte/FRAPPE-IMPORT.md).
//
// Feldnamen abgeleitet aus src/lib/api/fetchAllProdukte.js und den Lesern der
// Detaildaten (src/lib/shop/shopProducts.js, src/lib/shop/dimensions.js,
// src/components/MarkenItems/brandData.js):
//   produkt_name, marken, kategories (englisch wie im CMS), path_field,
//   url_slug, designer, beschreibung / beschreibung_<en|fr|it>,
//   mehr_beschreibung / mehr_beschreibung_<…>, metadata_title_<l>,
//   metadata_description_<l>, additional_information[{dimensions, gewicht}],
//   bild_anhangen[{bild_anhangen}].
// Zusatzfelder mit "_"-Präfix (_quelle_*, _hersteller_url, _stand) sind
// Hinweise für das Backoffice-Team und gehören nicht zum Doctype.
//
// Aufruf: node tools/wellness/export-frappe.mjs [--marke=soleum] [--out=qa-screenshots/wellness/produkte]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ALLE_PRODUKTE, looksMitProdukt, markeBySlug } from "../../src/lib/katalog/index.js";
import { KATALOG_LOCALES, PREISE_PAUSIERT, kategorieKey, preisBezeichnung, textOf } from "../../src/lib/katalog/schema.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SITE = "https://platzhirsch.studio";
const args = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith("--")).map((a) => a.slice(2).split("=")));
const outDir = path.resolve(ROOT, args.out || "qa-screenshots/wellness/produkte");
const msgs = Object.fromEntries(KATALOG_LOCALES.map((l) => [l, JSON.parse(fs.readFileSync(path.join(ROOT, "src/messages", `${l}.json`), "utf8")).katalog]));

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const suffix = (l) => (l === "de" ? "" : `_${l}`);

function record(p) {
  const marke = markeBySlug(p.marke);
  const r = {
    doctype: "Produkte New",
    produkt_name: p.name,
    marken: marke.name,
    // kategories steht im CMS überwiegend englisch (src/lib/seo/productCategories.js).
    kategories: msgs.en.kategorie[kategorieKey(p.kategorie)],
    path_field: p.slug,
    url_slug: p.slug,
    designer: p.designer || "",
  };
  for (const l of KATALOG_LOCALES) {
    const s = suffix(l);
    r[`beschreibung${s}`] = `<p>${esc(textOf(p.kurz, l))}</p>`;
    r[`mehr_beschreibung${s}`] = p.merkmale.length ? `<ul>${p.merkmale.map((m) => `<li>${esc(textOf(m, l))}</li>`).join("")}</ul>` : "";
    r[`metadata_title_${l}`] = `${marke.name} ${p.name} – ${msgs[l].kategorie[kategorieKey(p.kategorie)]}`;
    r[`metadata_description_${l}`] = textOf(p.kurz, l);
  }
  const masse = (p.masse || []).filter((m) => m.key !== "gewicht");
  const gewicht = (p.masse || []).find((m) => m.key === "gewicht");
  r.additional_information = masse.length || gewicht ? [{ dimensions: masse.map((m) => `${msgs.de.mass[m.key]}: ${m.wert}`).join(", "), gewicht: gewicht?.wert || "" }] : [];
  r.bild_anhangen = p.bilder.map((b) => ({ bild_anhangen: `${SITE}${b.src}` }));
  r._hersteller_url = p.herstellerUrl;
  r._quellen = p.quellen;
  r._bild_quellen = p.bilder.map((b) => ({ datei: b.src, quelle: b.quelleUrl, abgerufen: b.abgerufen }));
  // Preis (Nr. 26/27) nur als Hinweis – Feldname im Doctype mit dem Backoffice-Team klären.
  if (p.preis) r._preis = p.preis.art === "uvp-ab" ? { ...p.preis, bezeichnung: preisBezeichnung(p.preis) } : p.preis;
  if (p.preis && Object.hasOwn(PREISE_PAUSIERT, p.marke)) r._preis_pausiert = PREISE_PAUSIERT[p.marke];
  // K12 (31.10.2026): Konfigurator-Ausführungen, Looks, Welt je Produkt, Auswahl – nur Hinweise.
  if (p.ausfuehrungen?.length)
    r._ausfuehrungen = p.ausfuehrungen.map((g) => ({
      gruppe: textOf(g.gruppe, "de"),
      optionen: g.optionen.map((o) => ({ id: o.id, name: textOf(o.name, "de"), ...(o.code ? { code: o.code } : {}), ...(o.farbe ? { farbe: o.farbe } : {}), ...(o.standard ? { standard: true } : {}), ...(o.betrag != null ? { betrag: o.betrag } : {}) })),
    }));
  if (p.zubehoer?.length) r._zubehoer = p.zubehoer.map((z) => z.slug);
  const looks = looksMitProdukt(p.slug);
  if (looks.length) r._looks = looks.map((l) => ({ id: l.id, titel: textOf(l.titel, "de"), bild: `${SITE}${l.bild.src}` }));
  r._welt = p.welt;
  if (p.ausgewaehlt) r._ausgewaehlt = true;
  r._bereich = p.bereich;
  r._stand = p.stand;
  return r;
}

const list = ALLE_PRODUKTE.filter((p) => !args.marke || p.marke === args.marke).map(record);
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "frappe-import.json"), JSON.stringify({ _hinweis: "Nur Import-Vorlage für „Produkte New“. Nicht automatisch senden. Felder mit _ sind Hinweise.", erzeugt: new Date().toISOString().slice(0, 10), anzahl: list.length, produkte: list }, null, 2) + "\n");

// CSV (eine Zeile je Produkt, Kindtabellen zusammengefasst) für den Frappe-Datenimport.
const cols = ["produkt_name", "marken", "kategories", "path_field", "url_slug", "designer", ...KATALOG_LOCALES.flatMap((l) => [`beschreibung${suffix(l)}`, `mehr_beschreibung${suffix(l)}`, `metadata_title_${l}`, `metadata_description_${l}`]), "dimensions", "gewicht", "bild_anhangen", "_hersteller_url"];
const cell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
const rows = list.map((r) =>
  cols
    .map((c) =>
      c === "dimensions" ? r.additional_information[0]?.dimensions : c === "gewicht" ? r.additional_information[0]?.gewicht : c === "bild_anhangen" ? r.bild_anhangen.map((b) => b.bild_anhangen).join(" | ") : r[c]
    )
    .map(cell)
    .join(",")
);
fs.writeFileSync(path.join(outDir, "frappe-import.csv"), "﻿" + [cols.join(","), ...rows].join("\r\n") + "\r\n");
console.log(`${list.length} Produkte → ${path.relative(ROOT, outDir)}/frappe-import.{json,csv}`);
