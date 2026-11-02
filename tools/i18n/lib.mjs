// tools/i18n/lib.mjs
// Gemeinsame Helfer für die Message-Werkzeuge (R3-i18n).
// Liest/schreibt src/messages/<locale>.json formatgleich (2 Leerzeichen,
// Zeilenende wie in der Datei vorgefunden, abschließender Zeilenumbruch).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const LOCALES = ["de", "en", "fr", "it"];
export const messagesPath = (locale) => path.join(ROOT, "src", "messages", `${locale}.json`);

export function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

/** Liest eine Message-Datei und merkt sich das Zeilenende. */
export function readMessages(locale, file = messagesPath(locale)) {
  const src = fs.readFileSync(file, "utf8");
  const eol = src.includes("\r\n") ? "\r\n" : "\n";
  return { data: JSON.parse(src), eol, file };
}

/** Serialisiert wie die Bestandsdateien: JSON.stringify(…, 2) + Zeilenende. */
export function serialize(data, eol = "\n") {
  const s = JSON.stringify(data, null, 2) + "\n";
  return eol === "\n" ? s : s.replace(/\n/g, eol);
}

// R5-QM P2-3 (Doppellauf, 500 während des Schreibens): nur EIN Schreiblauf
// gleichzeitig (Sperrdatei mit PID, älter als 10 min gilt als verwaist), und
// jede Datei wird atomar ersetzt (temporäre Datei + rename), damit der
// Dev-Server nie ein halb geschriebenes JSON liest.
const LOCK = path.join(ROOT, "src", "messages", ".write.lock");
let lockHeld = false;
function acquireWriteLock() {
  if (lockHeld) return;
  try {
    const st = fs.statSync(LOCK);
    if (Date.now() - st.mtimeMs < 10 * 60 * 1000) {
      throw new Error(`src/messages wird gerade von einem anderen Lauf geschrieben (${fs.readFileSync(LOCK, "utf8").trim()}). Abbruch.`);
    }
    fs.rmSync(LOCK, { force: true });
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }
  fs.writeFileSync(LOCK, `pid ${process.pid} seit ${new Date().toISOString()}`, { flag: "wx" });
  lockHeld = true;
  process.on("exit", () => fs.rmSync(LOCK, { force: true }));
}

export function writeMessages(locale, data, eol, file = messagesPath(locale)) {
  const out = serialize(data, eol);
  JSON.parse(out); // Gültigkeit vor dem Schreiben
  if (path.resolve(file).startsWith(path.join(ROOT, "src", "messages"))) acquireWriteLock();
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, out, "utf8");
  for (let i = 0; ; i++) {
    try {
      fs.renameSync(tmp, file);
      return;
    } catch (e) {
      // Windows: Ziel kurz von einem Leser gesperrt → kurz erneut versuchen.
      if (i >= 20 || !["EPERM", "EACCES", "EBUSY"].includes(e.code)) {
        fs.rmSync(tmp, { force: true });
        throw e;
      }
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50);
    }
  }
}

/**
 * Deep-Merge: fügt fehlende Schlüssel aus `src` in `dst` ein. Bestehende
 * Blätter bleiben (Konflikt wird gemeldet), Typkonflikte ebenso.
 * Schlüssel mit führendem "_" (Redaktionshinweise) werden übersprungen.
 */
export function deepMerge(dst, src, prefix = "", report = { added: [], same: [], conflicts: [] }) {
  for (const [k, v] of Object.entries(src)) {
    if (k.startsWith("_")) continue;
    const p = prefix ? `${prefix}.${k}` : k;
    if (isPlainObject(v)) {
      if (dst[k] === undefined) dst[k] = {};
      if (!isPlainObject(dst[k])) {
        report.conflicts.push({ path: p, kept: dst[k], proposed: v, reason: "Typ" });
        continue;
      }
      deepMerge(dst[k], v, p, report);
    } else if (dst[k] === undefined) {
      dst[k] = v;
      report.added.push(p);
    } else if (JSON.stringify(dst[k]) === JSON.stringify(v)) {
      report.same.push(p);
    } else {
      report.conflicts.push({ path: p, kept: dst[k], proposed: v, reason: "Wert" });
    }
  }
  return report;
}

/**
 * Vorschlagsdateien gibt es in zwei Formen: {de,en,fr,it} je Sprache oder
 * (Feature-Teams, z. B. features/upload-messages-vorschlag.json) nur DE mit
 * dem Namespace auf oberster Ebene. Die DE-only-Form wird zu { de } und
 * `deOnly: true` (EN/FR/IT müssen dann dieselben Pfade wie DE haben).
 * Schlüssel mit führendem "_" (z. B. "_meta") gehören nie zum Inhalt.
 */
export function normalizeProposal(p) {
  if (LOCALES.some((l) => isPlainObject(p[l]))) return { byLocale: p, deOnly: false };
  // Dritte Form (Integration 28.10.2026, features/ezarri-messages-vorschlag.json):
  // flache Punkt-Schlüssel ("ezarri.c.rechner.title") mit je { de, en, fr, it }
  // oder nur einem deutschen String. Wird zu { de, en, fr, it } verschachtelt;
  // reine DE-Strings stehen nur unter de (EN/FR/IT prüft dann die Parität).
  const entries = Object.entries(p).filter(([k]) => !k.startsWith("_"));
  if (entries.length && entries.every(([k, v]) => k.includes(".") && (typeof v === "string" || (isPlainObject(v) && Object.keys(v).every((l) => LOCALES.includes(l)))))) {
    const byLocale = Object.fromEntries(LOCALES.map((l) => [l, {}]));
    for (const [k, v] of entries) {
      if (typeof v === "string") setPath(byLocale.de, k, v);
      else for (const [l, x] of Object.entries(v)) setPath(byLocale[l], k, x);
    }
    return { byLocale, deOnly: false, flat: true };
  }
  const de = Object.fromEntries(Object.entries(p).filter(([k]) => !k.startsWith("_")));
  return { byLocale: { de }, deOnly: true };
}

/** Alle Blätter als [pfad, wert] (Arrays werden mit Index durchlaufen). */
export function leaves(obj, prefix = "", out = []) {
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => leaves(v, prefix ? `${prefix}.${i}` : String(i), out));
  } else if (isPlainObject(obj)) {
    for (const [k, v] of Object.entries(obj)) leaves(v, prefix ? `${prefix}.${k}` : k, out);
  } else {
    out.push([prefix, obj]);
  }
  return out;
}

export function getPath(obj, p) {
  return p.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

export function setPath(obj, p, value) {
  const parts = p.split(".");
  let o = obj;
  for (const k of parts.slice(0, -1)) {
    if (o[k] === undefined) o[k] = /^\d+$/.test(k) ? [] : {};
    o = o[k];
  }
  o[parts.at(-1)] = value;
}

export function deletePath(obj, p) {
  const parts = p.split(".");
  const parent = parts.length > 1 ? getPath(obj, parts.slice(0, -1).join(".")) : obj;
  if (parent && Object.hasOwn(parent, parts.at(-1))) {
    delete parent[parts.at(-1)];
    return true;
  }
  return false;
}
