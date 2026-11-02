// src/lib/einblicke/abschluss.server.js – Tagesabschluss (Konzept §4.2).
// Auslöser: POST /api/einblicke/tagesabschluss (Bearer EINBLICKE_CRON_SECRET,
// Cron 03:30, tools/einblicke/cron.sh) oder lokal
// `node tools/einblicke/tagesabschluss.mjs [datum]`.
// Bearbeitet den Vortag und alle offenen Tage, idempotent:
//   aggregieren → dünne Heatmaps (< k Besuche) in den Pool statt nach Frappe
//   → .data/einblicke/tag/<tag>.json → Rohdaten + Pool > 14 T. löschen
//   → Push an Frappe (oder Dry-Run in outbox) → Vermerk <tag>.gesendet
// Ein Tag ohne Rohdaten (leer, schon gelöscht, Tippfehler im Datum) wird
// übersprungen: nichts wird überschrieben, nichts gesendet – sonst würde
// Frappe mit ersetzen=1 alle Dokumente des Tages löschen (QA Technik P2-1).
import { SERVER } from "./config.js";
import { aggregateDay, poolHeatmaps } from "./aggregate.js";
import { pushDay } from "./frappe.server.js";
import { localeOf } from "./routes.js";
import { markSent, openDays, purgeRaw, readAggregate, readPool, readRaw, writeAggregate, writePool } from "./store.server.js";

/**
 * runTagesabschluss({ days?, now?, env?, fetchImpl? })
 * → { tage:[{ datum, sitzungen, seitenaufrufe, push }], uebersprungen:[…], geloescht:[…] }
 */
export async function runTagesabschluss({ days, now = new Date(), env = process.env, fetchImpl } = {}) {
  // Zuerst löschen: ein Tag älter als 14 Tage wird so nie neu aggregiert.
  const geloescht = await purgeRaw({ now, env });
  const todo = days && days.length ? days : await openDays({ now, env });
  const tage = [];
  const uebersprungen = [];
  for (const datum of todo) {
    const records = await readRaw(datum, env);
    if (!records.length) {
      uebersprungen.push(datum);
      continue;
    }
    const agg = aggregateDay(records, { datum, k: SERVER.k, now });
    const pooled = poolHeatmaps(agg.heatmaps, await readPool(env), { datum, k: SERVER.k });
    // Erneuter Abschluss: zusammengefasste Heatmaps aus dem ersten Lauf
    // bleiben (ihre früheren Tage stehen nicht mehr im Pool).
    const before = await readAggregate(datum, env);
    const names = new Set(pooled.heatmaps.map((h) => h.name));
    for (const h of before?.heatmaps || []) {
      if (h.zusammengefasst?.length > 1 && !names.has(h.name)) {
        pooled.heatmaps.push(h);
        const key = `${h.seite}|${h.geraet}`;
        if (pooled.pool.eintraege[key]) delete pooled.pool.eintraege[key][datum];
        if (pooled.pool.eintraege[key] && !Object.keys(pooled.pool.eintraege[key]).length) delete pooled.pool.eintraege[key];
      }
    }
    agg.heatmaps = pooled.heatmaps;
    agg.meta.heatmaps_zurueckgehalten = pooled.zurueckgehalten;
    // Seiten nur, soweit sie in einer gesendeten Liste vorkommen (Heatmap,
    // Signal) oder als bekannte Seite/Vorlage – nie eine Einzelseite, die nur
    // in einer zurückgehaltenen Heatmap steckt.
    const used = new Set([...agg.heatmaps.map((h) => h.seite), ...agg.signale.map((s) => s.seite)]);
    agg.seiten = agg.seiten.filter((s) => used.has(s.route) || s.route === s.vorlage);
    for (const h of agg.heatmaps) {
      if (!agg.seiten.some((s) => s.route === h.seite)) agg.seiten.push({ route: h.seite, vorlage: h.vorlage, sprache: localeOf(h.seite) });
    }
    await writePool(pooled.pool, env);
    await writeAggregate(datum, agg, env);
    let push;
    try {
      push = await pushDay(agg, { env, fetchImpl });
      if (push.mode === "live") await markSent(datum, { teile: push.teile }, env);
    } catch (err) {
      push = { mode: "fehler", fehler: String(err?.message || err).slice(0, 200) };
    }
    tage.push({ datum, sitzungen: agg.meta.sitzungen, seitenaufrufe: agg.meta.seitenaufrufe, push: { mode: push.mode, teile: push.teile, fehler: push.fehler } });
  }
  return { tage, uebersprungen, geloescht };
}
