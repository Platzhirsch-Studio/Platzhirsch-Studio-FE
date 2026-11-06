#!/usr/bin/env node
// tools/migration/m6-import.mjs – Migration M6: lokaler Shop-/Gutschein-Speicher der Website → ph_shop.
//
// Quelle (dieselben Pfade wie die Website):
//   Shop      SHOP_DATA_DIR bzw. <Projekt>/.data/shop       (src/lib/shop/orderStore.js shopDataDir)
//               bestellungen.json, widerrufe.json
//   Zahlungen PAYMENTS_DATA_DIR bzw. <Projekt>/.data/payments (src/lib/payments/config.js dataDir)
//               orders.json (Gutschein-Bestellungen), register.json (Gutscheinregister, nur Code-Hash),
//               deposits.json (Anzahlungen), withdrawals.json (Widerrufe Gutschein)
//   Jede Datei ist eine Sammlung { id: eintrag } (payments/store.js createFileStore).
//
// Ziel: ph_shop.api.import_local_store(bestellungen, gutschein_bestellungen, gutscheine, anzahlungen,
//   widerrufe, probelauf) – Backend-Import/ph_shop/ph_shop/api/migration.py. Höchstens 500 Einträge je
//   Aufruf; vorhandene Einträge überspringt das Backend (idempotent über die Website-Kennung), es
//   überschreibt nie. Keine Kundenmails, keine Zahlungsbuchung. Schalter im Backend:
//   PH Shop Einstellungen.import_local_store_aktiv (sonst 403).
//
// Aufruf:
//   node tools/migration/m6-import.mjs                    Trockenlauf (Standard): liest, zählt, stapelt – sendet NICHTS
//   node tools/migration/m6-import.mjs --wirklich --probelauf   sendet mit probelauf=1 (Backend rollt zurück)
//   node tools/migration/m6-import.mjs --wirklich          sendet und legt an
//   Optionen: --data-dir <ordner> (enthält shop/ und payments/), --stapel <n> (≤ 500),
//             --bericht <datei> (Bericht zusätzlich als JSON-Datei)
// Ziel nur aus der Umgebung: BACKEND_PH_URL, BACKEND_PH_TOKEN (+ BACKEND_PH_LIVE/NODE_ENV=production
// für das produktive Backoffice, Prüfung phAccess in src/lib/backend/config.js). Kein X-PH-Client
// (kein Besucher-Request). Bericht als JSON auf stdout; Exit 0 = ok, 1 = Fehler, 2 = Aufruf/Zugang.
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { phAccess, phCall } from "../../src/lib/backend/config.js";
import { shopDataDir } from "../../src/lib/shop/orderStore.js";
import { dataDir as paymentsDataDir } from "../../src/lib/payments/config.js";

export const METHOD = "ph_shop.api.import_local_store";
export const MAX_STAPEL = 500;
/** Reihenfolge wie im Backend: Gutschein-Bestellungen vor dem Register, Bestellungen vor Widerrufen. */
export const ARTEN = Object.freeze(["bestellungen", "gutschein_bestellungen", "gutscheine", "anzahlungen", "widerrufe"]);
export const TIMEOUT_MS = 120_000;

const HASH_RE = /^[a-f0-9]{64}$/;

/** Quelldateien je Art (Pfad relativ zum Shop- bzw. Zahlungsordner). */
export function quellen({ dataDir, env = process.env } = {}) {
  const shop = dataDir ? path.join(dataDir, "shop") : shopDataDir(env);
  const pay = dataDir ? path.join(dataDir, "payments") : paymentsDataDir(env);
  return {
    bestellungen: [path.join(shop, "bestellungen.json")],
    gutschein_bestellungen: [path.join(pay, "orders.json")],
    gutscheine: [path.join(pay, "register.json")],
    anzahlungen: [path.join(pay, "deposits.json")],
    widerrufe: [path.join(shop, "widerrufe.json"), path.join(pay, "withdrawals.json")],
  };
}

async function leseSammlung(datei) {
  let text;
  try {
    text = await readFile(datei, "utf8");
  } catch (err) {
    if (err.code === "ENOENT") return { eintraege: [], fehlt: true };
    throw err;
  }
  const daten = JSON.parse(text);
  const eintraege = Array.isArray(daten) ? daten : Object.values(daten || {});
  return { eintraege: eintraege.filter((e) => e && typeof e === "object"), fehlt: false };
}

/** Kennung eines Eintrags für Bericht und Vorprüfung (wie migration.py). */
export function kennung(art, e) {
  if (art === "gutscheine") return e.ende ? `…${String(e.ende).slice(-4)}` : null;
  return e.id || e.bestellnummer || e.anzahlung_id || null;
}

/** Vorprüfung ohne Backend: offensichtliche Fehler, die das Backend ablehnen würde. */
export function vorpruefen(art, e) {
  if (art === "gutscheine") {
    if (!HASH_RE.test(String(e.hash || "").toLowerCase())) return "hash fehlt oder ist kein sha256";
    const wert = Number(e.wert_cent);
    const rest = Number(e.rest_cent);
    if (!(wert > 0) || !(rest >= 0) || rest > wert) return "wert_cent/rest_cent ungültig";
    return null;
  }
  if (!kennung(art, e)) return "id fehlt";
  if (art === "widerrufe" && !(e.name && e.email)) return "name/email fehlen";
  return null;
}

/** Liest alle Sammlungen → { daten{art: []}, dateien[{art, datei, anzahl, fehlt}] }. */
export async function ladeDaten(opts = {}) {
  const q = quellen(opts);
  const daten = {};
  const dateien = [];
  for (const art of ARTEN) {
    daten[art] = [];
    for (const datei of q[art]) {
      const { eintraege, fehlt } = await leseSammlung(datei);
      dateien.push({ art, datei, anzahl: eintraege.length, fehlt });
      daten[art].push(...eintraege);
    }
  }
  return { daten, dateien };
}

/**
 * Teilt die Einträge in Stapel mit höchstens `groesse` Einträgen gesamt.
 * Die Arten bleiben in der Backend-Reihenfolge; ein Stapel kann am Übergang zwei Arten enthalten.
 */
export function stapeln(daten, groesse = MAX_STAPEL) {
  const n = Math.max(1, Math.min(MAX_STAPEL, Math.floor(Number(groesse)) || MAX_STAPEL));
  const stapel = [];
  let aktuell = null;
  let fuellung = 0;
  for (const art of ARTEN) {
    for (const e of daten[art] || []) {
      if (!aktuell || fuellung >= n) {
        aktuell = {};
        fuellung = 0;
        stapel.push(aktuell);
      }
      (aktuell[art] ||= []).push(e);
      fuellung += 1;
    }
  }
  return stapel;
}

const anzahlJeArt = (s) => Object.fromEntries(ARTEN.map((a) => [a, (s[a] || []).length]));

/** Deterministischer Schlüssel je Stapel (Wiederholung = gleiche Antwort aus ph_api). */
export function stapelSchluessel(s, probelauf) {
  const h = createHash("sha256").update(JSON.stringify({ probelauf: probelauf ? 1 : 0, s })).digest("hex");
  return `m6:${probelauf ? "p" : "w"}:${h.slice(0, 48)}`;
}

/** Argumente → Optionen. Unbekanntes → Fehler. */
export function parseArgs(argv) {
  const o = { wirklich: false, probelauf: false, dataDir: null, stapel: MAX_STAPEL, bericht: null };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--wirklich") o.wirklich = true;
    else if (a === "--probelauf") o.probelauf = true;
    else if (a === "--data-dir") o.dataDir = path.resolve(argv[(i += 1)] ?? "");
    else if (a === "--stapel") o.stapel = Number(argv[(i += 1)]);
    else if (a === "--bericht") o.bericht = path.resolve(argv[(i += 1)] ?? "");
    else throw new Error(`Unbekannte Option: ${a}`);
  }
  if (!(o.stapel >= 1 && o.stapel <= MAX_STAPEL)) throw new Error(`--stapel muss zwischen 1 und ${MAX_STAPEL} liegen.`);
  return o;
}

const leer = () => Object.fromEntries(ARTEN.map((a) => [a, 0]));

/**
 * Ein Lauf. Wirft nicht bei Backend-Fehlern (stehen im Bericht).
 * @returns {Promise<{ bericht: object, exitCode: number }>}
 */
export async function run({ wirklich = false, probelauf = false, dataDir = null, stapel: groesse = MAX_STAPEL, env = process.env, fetchImpl = globalThis.fetch, now = () => new Date() } = {}) {
  const modus = !wirklich ? "trockenlauf" : probelauf ? "probelauf" : "wirklich";
  const { daten, dateien } = await ladeDaten({ dataDir, env });
  const vorpruefung = [];
  for (const art of ARTEN) for (const e of daten[art]) {
    const grund = vorpruefen(art, e);
    if (grund) vorpruefung.push({ art, id: kennung(art, e), grund });
  }
  const stapel = stapeln(daten, groesse);
  const bericht = {
    modus,
    zeit: now().toISOString(),
    methode: METHOD,
    quellen: dateien,
    gelesen: anzahlJeArt(daten),
    gesamt: ARTEN.reduce((n, a) => n + daten[a].length, 0),
    stapelGroesse: Math.min(MAX_STAPEL, groesse),
    stapel: stapel.map((s, i) => ({ nr: i + 1, eintraege: anzahlJeArt(s) })),
    vorpruefung,
    ziel: null,
    gesendet: 0,
    angelegt: leer(),
    uebersprungen: leer(),
    fehler: [],
    abgebrochen: null,
  };

  if (!wirklich) {
    bericht.hinweis = "Trockenlauf: nichts gesendet. Senden mit --wirklich (zuerst mit --probelauf).";
    return { bericht, exitCode: 0 };
  }

  const access = phAccess(env);
  if (!access.ok) {
    bericht.abgebrochen = { grund: "zugang", detail: access.reason };
    return { bericht, exitCode: 2 };
  }
  bericht.ziel = access.url;
  const cfg = { url: access.url, key: access.key, secret: access.secret };

  for (let i = 0; i < stapel.length; i += 1) {
    const s = stapel[i];
    const params = { ...s, probelauf: probelauf ? 1 : 0, idempotency_key: stapelSchluessel(s, probelauf) };
    const r = await phCall(cfg, METHOD, { params, fetchImpl, timeoutMs: TIMEOUT_MS, client: false, env });
    const eintrag = bericht.stapel[i];
    bericht.gesendet += 1;
    if (!r.ok) {
      eintrag.ergebnis = { ok: false, status: r.status, code: r.code, ...(r.detail ? { detail: r.detail } : {}) };
      // Abbruch beim ersten Fehler des Aufrufs: ein neuer Lauf ist gefahrlos (idempotent).
      bericht.abgebrochen = { grund: "aufruf", stapel: i + 1, code: r.code, status: r.status };
      break;
    }
    const m = r.message || {};
    eintrag.ergebnis = { ok: true, probelauf: Boolean(m.probelauf), angelegt: m.angelegt || {}, uebersprungen: m.uebersprungen || {}, fehler: (m.fehler || []).length };
    for (const a of ARTEN) {
      bericht.angelegt[a] += Number(m.angelegt?.[a] || 0);
      bericht.uebersprungen[a] += Number(m.uebersprungen?.[a] || 0);
    }
    for (const f of m.fehler || []) bericht.fehler.push({ stapel: i + 1, ...f });
  }
  const exitCode = bericht.abgebrochen || bericht.fehler.length ? 1 : 0;
  return { bericht, exitCode };
}

async function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (err) {
    process.stderr.write(`${err.message}\n`);
    process.exit(2);
  }
  if (opts.probelauf && !opts.wirklich) process.stderr.write("Hinweis: --probelauf wirkt nur mit --wirklich; es läuft ein Trockenlauf.\n");
  const { bericht, exitCode } = await run(opts);
  const json = JSON.stringify(bericht, null, 2);
  process.stdout.write(`${json}\n`);
  if (opts.bericht) await writeFile(opts.bericht, `${json}\n`, "utf8");
  process.exitCode = exitCode;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((err) => {
    process.stderr.write(`[m6-import] ${err?.stack || err}\n`);
    process.exit(1);
  });
}
