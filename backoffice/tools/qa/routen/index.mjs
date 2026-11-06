// backoffice/tools/qa/routen/index.mjs – Routenliste der Screenshot-Prüfung (Q-M3, MASTER § 3.5).
//
// Quellen:
//   1. tools/qa/routen/<bereich>.mjs – feste Seiten mit eigenem Layout je Bereich (schreibt der Bereich),
//      tools/qa/routen/fundament.mjs – Baustein-Demos des Fundaments (/einstellungen?tab=system&baustein=…);
//   2. src/lib/backoffice/bereiche/<bereich>.js – Startseite + Navigationseinträge (generische Listen der
//      ersten sechs DocTypes, solange der Bereich keine eigene Navigation hat).
// Reines Datenmodul ohne Browser. Hier nichts eintragen.
//
// `kern: true` kennzeichnet Seiten mit eigenem Layout. Die generischen DocType-Listen und die
// Bereichs-Startseiten aus src/app/[bereich]/page.js (`kern: false`) teilen sich je eine
// Vorlage (DataTable bzw. BereichStart); shoot.mjs fotografiert sie alle,
// bewerten.mjs bewertet ohne `--alle` nur die Kernseiten (Zeit des Bildmodells).

import { BEREICHE, BEREICH_SLUGS, navigationFuer } from "../../../src/lib/backoffice/bereiche/index.js";
import zentrale from "./zentrale.mjs";
import crm from "./crm.mjs";
import projekte from "./projekte.mjs";
import faktura from "./faktura.mjs";
import shop from "./shop.mjs";
import sortiment from "./sortiment.mjs";
import logistik from "./logistik.mjs";
import service from "./service.mjs";
import kundenkarte from "./kundenkarte.mjs";
import marketing from "./marketing.mjs";
import personal from "./personal.mjs";
import kassa from "./kassa.mjs";
import ablage from "./ablage.mjs";
import posteingang from "./posteingang.mjs";
import fundament from "./fundament.mjs";

/** Teildateien je Bereich (Schlüssel = Bereichs-Slug) plus Fundament. */
export const ROUTEN_BEREICHE = { zentrale, crm, projekte, faktura, shop, sortiment, logistik, service, kundenkarte, marketing, personal, kassa, ablage, posteingang, fundament };

/** Feste Kernseiten aller Teildateien, nach `rang` (gleicher Rang: Bereichsreihenfolge, dann Dateireihenfolge). */
export function festeRouten(teile = ROUTEN_BEREICHE) {
  const reihe = [...BEREICH_SLUGS, ...Object.keys(teile).filter((s) => !BEREICH_SLUGS.includes(s))];
  const alle = [];
  reihe.forEach((slug, bi) => {
    (teile[slug] || []).forEach((r, i) => alle.push({ r, slug, sortier: [r.rang ?? 1000, bi, i] }));
  });
  alle.sort((a, b) => a.sortier[0] - b.sortier[0] || a.sortier[1] - b.sortier[1] || a.sortier[2] - b.sortier[2]);
  return alle.map(({ r, slug }) => {
    const { rang, ...rest } = r;
    void rang;
    return { kern: true, ...rest, ...(slug !== "fundament" && !rest.bereich ? { bereich: slug } : {}) };
  });
}

/** Alle Routen: feste Kernseiten, dann je Bereich Startseite und Navigation, ohne Dubletten. */
export function alleRouten() {
  const routen = festeRouten();
  // Dubletten über den Dateistamm erkennen (/d/PH%20Anfrage und /d/ph-anfrage sind dieselbe Seite).
  const gesehen = new Set(routen.map((r) => r.pfad && slugVon(r.pfad)).filter(Boolean));
  for (const b of BEREICHE) {
    const eintraege = [{ titel: `${b.titel} – Start`, href: b.startseite, start: true }, ...navigationFuer(b)];
    for (const n of eintraege) {
      if (!n.href || gesehen.has(slugVon(n.href))) continue;
      gesehen.add(slugVon(n.href));
      // Kern nur, wenn die Startseite eine eigene Seite hat (nicht die generische src/app/[bereich]/page.js).
      const kern = !!n.start && n.href !== `/${b.slug}`;
      routen.push({ pfad: n.href, titel: n.start ? n.titel : `${b.titel} – ${n.titel}`, bereich: b.slug, kern });
    }
  }
  return routen;
}

/**
 * Konsistenz der Routen-Teildateien (Unit-Test): Pfad doppelt (gleicher Dateistamm), Eintrag ohne Titel,
 * Pfad ohne führenden Schrägstrich, null-Pfad ohne ersterDatensatz.
 */
export function pruefeRouten(teile = ROUTEN_BEREICHE) {
  const befunde = [];
  const gesehen = new Map();
  for (const [slug, liste] of Object.entries(teile)) {
    if (!Array.isArray(liste)) {
      befunde.push(`Routen ${slug}: kein Array`);
      continue;
    }
    for (const r of liste) {
      if (!r.titel) befunde.push(`Routen ${slug}: Eintrag ohne Titel (${JSON.stringify(r)})`);
      if (r.pfad === null) {
        if (!r.ersterDatensatz) befunde.push(`Routen ${slug}: pfad null ohne ersterDatensatz`);
        continue;
      }
      if (!String(r.pfad || "").startsWith("/")) befunde.push(`Routen ${slug}: Pfad ohne / (${r.pfad})`);
      const s = slugVon(r.pfad);
      if (gesehen.has(s)) befunde.push(`Route doppelt: ${r.pfad} (${gesehen.get(s)}, ${slug})`);
      gesehen.set(s, slug);
    }
  }
  return befunde;
}

/** Filter `--nur <muster>`: Teilstring oder regulärer Ausdruck auf Pfad oder Titel. */
export function filterNur(routen, muster) {
  if (!muster) return routen;
  let re = null;
  try {
    re = new RegExp(muster, "i");
  } catch {
    re = null;
  }
  const m = muster.toLowerCase();
  return routen.filter((r) => {
    const felder = [r.pfad || "", decodeURIComponent(r.pfad || ""), r.titel || ""];
    return felder.some((f) => (re ? re.test(f) : f.toLowerCase().includes(m)));
  });
}

/** Dateistamm einer Route (Pfad + Query, Dateisystem-tauglich). */
export function slugVon(pfad) {
  const s = decodeURIComponent(pfad)
    .replace(/^\//, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return s || "zentrale";
}

export const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "ipad", width: 1024, height: 768 },
  { name: "iphone", width: 390, height: 844, mobile: true },
];

export const SCHEMATA = ["hell", "dunkel"];
