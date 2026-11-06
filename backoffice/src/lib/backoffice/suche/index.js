// Suche der Befehlspalette: Bereiche, Aktionen, Datensätze (Nummer/Name) und
// Kontakte. Datensätze kommen in EINEM Aufruf aus ph_core.api.suche.global_search
// (Frappe; Mock: mock/core.js mit gleichem Ergebnisformat) – Rechte prüft der Server.
// Rückfall (ph_core nicht erreichbar/alt): getList mit `like` je DocType, nur in
// DocTypes, die die Sitzung lesen darf. Reines Modul (Client wird übergeben).
//
// Register (G-01, MASTER § 3.5): Schnellaktionen, Nummernmuster und Hilfe-Artikel liefern die
// Bereiche in suche/<bereich>.js – hier wird nur zusammengesetzt, nichts eingetragen.

import { BEREICHE, BEREICH_SLUGS, navigationFuer } from "../bereiche/index.js";
import { darf, darfDoc } from "../auth/rechte.js";
import { doctypeSlug, kurz } from "../format.js";
import { ladeMeta } from "../frappe/index.js";
import { phCore } from "../frappe/core.js";
import { HILFE, NUMMERNMUSTER, SCHNELLAKTIONEN, SUCHE_BEREICHE, nummerErkennen } from "./register.js";
import { normalisiereMuster } from "./muster.js";

export { HILFE, NUMMERNMUSTER, SCHNELLAKTIONEN, SUCHE_BEREICHE, nummerErkennen };

/** DocTypes des getList-Rückfalls (Nummer, Titel, Suchfelder). Die Kernsuche nutzt ph_core SUCH_DOCTYPES. */
export const SUCH_DOCTYPES = ["PH Anfrage", "PH Kontakt", "PH Termin", "PH Projekt", "PH Bestellung", "PH Rechnung", "PH Angebot", "PH Lieferschein", "PH Produkt", "PH Servicefall", "PH Bewerbung", "PH Aufgabe", "PH Zahlung"];

/** ph_core-Treffer → Paletteneintrag {titel, hinweis, href, doctype, bereich}. */
export function trefferZuEintrag(t) {
  const dt = String(t.doctype || "");
  return {
    titel: t.titel || t.name,
    hinweis: `${dt.replace(/^PH /, "")} · ${t.name}${t.status ? ` · ${t.status}` : ""}`,
    // href_hinweis = "/d/<slug>/<name>" (Name unkodiert) → hier mit kodiertem Namen neu bauen
    href: `/d/${doctypeSlug(dt)}/${encodeURIComponent(t.name)}`,
    doctype: dt,
    bereich: t.bereich || null,
  };
}

/** Kernsuche über ph_core (ein Aufruf). null → Rückfall auf getList. */
export async function kernSuche(client, session, q, limit = 12) {
  try {
    const liste = await phCore(client.modus).globalSearch({ q, limit }, { client, session });
    return liste.map(trefferZuEintrag);
  } catch {
    return null;
  }
}

/** Rückfall: getList mit `like` über SUCH_DOCTYPES (n Aufrufe). */
export async function getListSuche(client, session, q) {
  const treffer = [];
  const sieht = [];
  for (const dt of SUCH_DOCTYPES) {
    try {
      const meta = await ladeMeta(client, dt);
      if (!darfDoc(session, meta, "read")) continue;
      sieht.push(meta);
    } catch {
      // DocType in diesem Modus nicht vorhanden
    }
  }
  await Promise.all(
    sieht.map(async (meta) => {
      const felder = [...new Set(["name", meta.title_field, ...(meta.search_fields || [])].filter(Boolean))];
      try {
        const zeilen = await client.getList(meta.name, {
          fields: [...new Set(["name", meta.title_field, "status"].filter(Boolean))],
          orFilters: felder.map((f) => [f, "like", `%${q}%`]),
          orderBy: "modified desc",
          limit: 4,
        });
        for (const z of zeilen) {
          treffer.push({ titel: z[meta.title_field] || z.name, hinweis: `${meta.name.replace(/^PH /, "")} · ${z.name}${z.status ? ` · ${z.status}` : ""}`, href: `/d/${doctypeSlug(meta.name)}/${encodeURIComponent(z.name)}` });
        }
      } catch {
        // ein fehlender DocType darf die Suche nicht stoppen
      }
    })
  );
  return treffer;
}

function passt(text, q) {
  return String(text || "").toLowerCase().includes(q);
}

/**
 * @returns {Promise<{gruppen: Array<{titel:string, eintraege:Array<{titel:string, hinweis?:string, href:string}>}>}>}
 */
export async function suche(client, session, roh) {
  const q = String(roh || "").trim().toLowerCase().slice(0, 60);
  const gruppen = [];

  const bereiche = [];
  for (const b of BEREICHE) {
    if (!darf(session, b.slug, "read")) continue;
    for (const n of navigationFuer(b, { erlaubt: (r) => darf(session, r.bereich, r.aktion) })) {
      if (!q || passt(n.titel, q) || passt(b.titel, q)) bereiche.push({ titel: n.titel, hinweis: b.titel, href: n.href });
    }
  }
  if (bereiche.length) gruppen.push({ titel: "Bereiche", eintraege: bereiche.slice(0, q ? 6 : 8) });

  const aktionen = SCHNELLAKTIONEN.filter((a) => darf(session, a.bereich, a.aktion) && (!q || passt(a.titel, q)));
  if (aktionen.length) gruppen.push({ titel: "Aktionen", eintraege: aktionen.slice(0, 6).map((a) => ({ titel: a.titel, href: a.href })) });

  if (q.length >= 2) {
    let treffer = await kernSuche(client, session, q);
    if (treffer === null) treffer = await getListSuche(client, session, q);
    if (treffer.length) gruppen.push({ titel: "Datensätze", eintraege: treffer.slice(0, 12).map((t) => ({ ...t, titel: kurz(t.titel, 60) })) });
  }

  return { gruppen };
}

/**
 * Konsistenz des Paletten-Registers (Unit-Test): doppelte Aktions-IDs, Aktionen ohne gültigen Bereich/Ziel,
 * ungültige Muster, Nummernmuster, die sich überschneiden.
 * @param {Record<string, SucheBereich>} [teile]
 * @param {(serie:string)=>string} [beispiel] erzeugt einen Beispielnamen je Serie (Überschneidungsprüfung)
 */
export function pruefeSuche(teile = SUCHE_BEREICHE, beispiel = null) {
  const befunde = [];
  const ids = new Map();
  const muster = [];
  for (const [slug, t] of Object.entries(teile)) {
    if (!BEREICH_SLUGS.includes(slug)) befunde.push(`Suche: unbekannter Bereich ${slug}`);
    for (const a of t.schnellaktionen || []) {
      if (!a.id || !a.titel || !String(a.href || "").startsWith("/")) befunde.push(`Suche ${slug}: Schnellaktion unvollständig (${JSON.stringify(a)})`);
      if (ids.has(a.id)) befunde.push(`Suche: Aktions-ID doppelt: ${a.id} (${ids.get(a.id)}, ${slug})`);
      ids.set(a.id, slug);
      if (!a.id?.startsWith(`${slug}.`)) befunde.push(`Suche ${slug}: Aktions-ID ${a.id} ohne Präfix „${slug}.“`);
    }
    for (const m of t.nummernmuster || []) {
      try {
        muster.push({ ...normalisiereMuster(m), bereich: slug });
      } catch (err) {
        befunde.push(`Suche ${slug}: ${err.message}`);
      }
    }
  }
  if (beispiel) {
    for (const m of muster) {
      if (!m.serie) continue;
      const name = beispiel(m.serie);
      const treffer = muster.filter((x) => x.regex.test(name)).map((x) => x.doctype);
      if (!treffer.includes(m.doctype)) befunde.push(`Suche: Muster für ${m.doctype} erkennt eigenen Namen ${name} nicht`);
      if (new Set(treffer).size > 1) befunde.push(`Suche: Nummer ${name} passt auf mehrere DocTypes (${[...new Set(treffer)].join(", ")})`);
    }
  }
  return befunde;
}
