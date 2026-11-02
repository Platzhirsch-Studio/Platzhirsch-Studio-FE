#!/usr/bin/env node
// tools/einblicke/tagesabschluss.mjs – Tagesabschluss der Besucher-Einblicke lokal
// (gleiche Logik wie POST /api/einblicke/tagesabschluss, src/lib/einblicke/abschluss.server.js).
//
//   node tools/einblicke/tagesabschluss.mjs              Vortag + alle offenen Tage
//   node tools/einblicke/tagesabschluss.mjs 2026-10-28   genau dieser Tag, solange seine
//                                                        Rohdaten da sind (≤ 14 Tage); ein Tag
//                                                        ohne Rohdaten wird übersprungen, sein
//                                                        Aggregat bleibt unverändert
//   node tools/einblicke/tagesabschluss.mjs --heute      auch den laufenden Tag (nur zum Testen)
//   node tools/einblicke/tagesabschluss.mjs --nur-loeschen   nur Rohdaten + Pool > 14 Tage löschen
//   node tools/einblicke/tagesabschluss.mjs --pruefen    Inbetriebnahme: löschen, dann Exit 1,
//                                                        wenn noch Rohdaten > 14 Tage liegen
//
// Schreibt .data/einblicke/tag/<tag>.json, löscht Rohdaten > 14 Tage und
// überträgt an Frappe NUR mit EINBLICKE_FRAPPE_URL/_KEY/_SECRET – sonst
// Dry-Run nach .data/einblicke/outbox/. Das produktive Backoffice ist außerhalb
// von NODE_ENV=production + EINBLICKE_FRAPPE_LIVE=1 gesperrt.
import process from "node:process";
import { runTagesabschluss } from "../../src/lib/einblicke/abschluss.server.js";
import { oldestRaw, purgeRaw, viennaDay } from "../../src/lib/einblicke/store.server.js";
import { SERVER, rawDays } from "../../src/lib/einblicke/config.js";

const args = process.argv.slice(2);

if (args.includes("--nur-loeschen") || args.includes("--pruefen")) {
  const removed = await purgeRaw();
  if (removed.length) console.log(`Rohdaten gelöscht: ${removed.join(", ")}`);
  const oldest = await oldestRaw();
  const limit = Math.min(rawDays(), SERVER.rawMaxDays);
  console.log(oldest ? `Ältester Rohdaten-Tag: ${oldest.tag} (${oldest.alter} Tage, Grenze < ${limit})` : "Keine Rohdaten.");
  if (args.includes("--pruefen") && oldest && oldest.alter >= limit) {
    console.error("FEHLER: Rohdaten älter als die Grenze liegen noch auf der Platte.");
    process.exitCode = 1;
  }
  if (args.includes("--pruefen") && String(process.env.NEXT_PUBLIC_EINBLICKE || "") === "1" && String(process.env.EINBLICKE_CRON_SECRET || "").length < 24) {
    console.error("WARNUNG: NEXT_PUBLIC_EINBLICKE=1, aber EINBLICKE_CRON_SECRET fehlt (mind. 24 Zeichen) – kein Tagesabschluss.");
  }
} else {
  const days = args.filter((a) => /^\d{4}-\d{2}-\d{2}$/.test(a));
  if (args.includes("--heute")) days.push(viennaDay());

  const result = await runTagesabschluss({ days: days.length ? days : undefined });
  for (const t of result.tage) {
    console.log(`${t.datum}: ${t.sitzungen} Sitzungen, ${t.seitenaufrufe} Seitenaufrufe → Frappe: ${t.push.mode}${t.push.teile ? ` (${t.push.teile} Teil/e)` : ""}${t.push.fehler ? ` – ${t.push.fehler}` : ""}`);
  }
  if (result.uebersprungen.length) console.log(`Übersprungen (keine Rohdaten, Aggregat unverändert): ${result.uebersprungen.join(", ")}`);
  if (!result.tage.length && !result.uebersprungen.length) console.log("Kein offener Tag.");
  if (result.geloescht.length) console.log(`Rohdaten gelöscht: ${result.geloescht.join(", ")}`);
  if (result.tage.some((t) => t.push.mode === "fehler")) process.exitCode = 1;
}
