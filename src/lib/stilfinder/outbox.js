// src/lib/stilfinder/outbox.js
// Dev outbox of the Moodboard mail: .data/stilfinder/outbox/<id>/
//   moodboard.pdf   the generated PDF
//   mail.html       the mail as it would be sent
//   mail.txt        plain-text part
//   meta.json       recipient, profile, optional fields, newsletter wish, timings
// .data/ is gitignored and outside public/. Retention: entries older than
// OUTBOX_RETENTION_MS (7 days) and everything beyond OUTBOX_MAX_ENTRIES are
// deleted on every write and every preview read (pruneOutbox). No "@/..." imports.
// R3 technik P2-1: Laufzeitpfade (.data/stilfinder, public/) mit turbopackIgnore,
// sonst traced Turbopack das ganze Projekt (10 Build-Warnungen, 7 GB .next).
import fs from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { OUTBOX_DIR, OUTBOX_MAX_ENTRIES, OUTBOX_RETENTION_MS } from "./config.js";

export const OUTBOX_ID = /^[A-Za-z0-9_-]{20,40}$/;

function newId(now) {
  // time prefix keeps directory order = age; random part makes it unguessable
  return `${now.toString(36)}-${randomBytes(12).toString("base64url")}`;
}

export async function writeOutbox({ dir = OUTBOX_DIR, pdf, mail, meta, now = Date.now() }) {
  const id = newId(now);
  const target = path.join(/*turbopackIgnore: true*/ dir, id);
  await fs.mkdir(target, { recursive: true });
  await Promise.all([
    fs.writeFile(path.join(/*turbopackIgnore: true*/ target, "moodboard.pdf"), pdf),
    fs.writeFile(path.join(/*turbopackIgnore: true*/ target, "mail.html"), mail.html, "utf8"),
    fs.writeFile(path.join(/*turbopackIgnore: true*/ target, "mail.txt"), `Betreff: ${mail.subject}\n\n${mail.text}`, "utf8"),
    fs.writeFile(path.join(/*turbopackIgnore: true*/ target, "meta.json"), JSON.stringify({ ...meta, id, createdAt: new Date(now).toISOString(), expiresAt: new Date(now + OUTBOX_RETENTION_MS).toISOString() }, null, 2), "utf8"),
  ]);
  await pruneOutbox({ dir, now });
  return { id, dir: target };
}

/** Deletes expired entries and the oldest beyond the cap. Returns the number removed. */
export async function pruneOutbox({ dir = OUTBOX_DIR, now = Date.now(), maxEntries = OUTBOX_MAX_ENTRIES } = {}) {
  let names;
  try {
    names = (await fs.readdir(/*turbopackIgnore: true*/ dir, { withFileTypes: true })).filter((d) => d.isDirectory() && OUTBOX_ID.test(d.name)).map((d) => d.name);
  } catch {
    return 0;
  }
  const entries = await Promise.all(
    names.map(async (name) => {
      try {
        const meta = JSON.parse(await fs.readFile(path.join(/*turbopackIgnore: true*/ dir, name, "meta.json"), "utf8"));
        return { name, created: Date.parse(meta.createdAt) || 0 };
      } catch {
        return { name, created: 0 };
      }
    })
  );
  entries.sort((a, b) => b.created - a.created);
  const remove = entries.filter((e, i) => now - e.created > OUTBOX_RETENTION_MS || i >= maxEntries);
  await Promise.all(remove.map((e) => fs.rm(path.join(/*turbopackIgnore: true*/ dir, e.name), { recursive: true, force: true })));
  return remove.length;
}

/** PDF of one entry (dev preview route). null when unknown or expired. */
export async function readOutboxPdf(id, { dir = OUTBOX_DIR, now = Date.now() } = {}) {
  // pdf-lead fix-06: delete expired entries on every read as well – before,
  // only a new write pruned, so test addresses stayed on disk past 7 days
  // whenever nobody ordered a new moodboard
  await pruneOutbox({ dir, now }).catch(() => 0);
  if (!OUTBOX_ID.test(String(id))) return null;
  try {
    const meta = JSON.parse(await fs.readFile(path.join(/*turbopackIgnore: true*/ dir, id, "meta.json"), "utf8"));
    if (now > Date.parse(meta.expiresAt)) return null;
    return { pdf: await fs.readFile(path.join(/*turbopackIgnore: true*/ dir, id, "moodboard.pdf")), meta };
  } catch {
    return null;
  }
}
