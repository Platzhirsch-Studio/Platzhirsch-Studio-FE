import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { adapterName, DATA_DIR } from "@/lib/portal/config";
import { readJson, updateJson } from "@/lib/portal/store";
import { entryIdSchema, feedbackEntrySchema } from "../schemas";
import { demoThread } from "./planungSeed";

// Feature adapter of "Projekte & Planung": structured feedback (pins on
// renderings, votes, approvals, voice notes) that the portal core contract
// (addFeedback = plain text message) cannot hold yet.
//
// Local development: /.data/portal/planung.json + audio files in
// /.data/portal/feedback/ (gitignored, never in /public).
// Frappe later (see Marktresearch/digital/features/kundenportal.md):
//   entries     -> custom doctype "PH Planning Feedback" (child of Project)
//   audio files -> File (is_private=1, attached_to_doctype="PH Planning Feedback")
//   team replies-> same doctype, from="studio", written in the Desk UI.
// Every caller passes the customerId of the VERIFIED session.

const STORE = "planung";
export const VOICE_DIR = path.join(DATA_DIR, "feedback");

const empty = () => ({ version: 1, seeded: {}, entries: [] });

function strip(entry) {
  const { customerId: _owner, ...rest } = entry;
  if (rest.audio) rest.audio = { id: rest.audio.id, mime: rest.audio.mime, size: rest.audio.size, durationSec: rest.audio.durationSec };
  return rest;
}

/** Seeds the demo thread once per customer+project (mock adapter only). */
async function ensureSeed(customerId, projectId, customerName) {
  if (adapterName() !== "mock") return;
  const key = `${customerId}:${projectId}`;
  const data = await readJson(STORE, empty);
  if (data.seeded?.[key]) return;
  await updateJson(STORE, empty, (current) => {
    current.seeded = current.seeded || {};
    if (!current.seeded[key]) {
      current.seeded[key] = true;
      const demo = demoThread(projectId, customerName).map((e) => ({ ...e, customerId, projectId, demo: true }));
      current.entries = [...(current.entries || []), ...demo];
    }
    return { value: current, result: null };
  });
}

/** All entries of one project of one customer, oldest first. */
export async function listEntries(customerId, projectId, customerName = "Sie") {
  await ensureSeed(customerId, projectId, customerName);
  const { entries = [] } = await readJson(STORE, empty);
  return entries
    .filter((e) => e.customerId === customerId && e.projectId === projectId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map(strip);
}

/**
 * Appends a customer entry. `input` is re-validated here; `extra` carries
 * server-made fields (author, audio, adapterFeedbackId).
 */
export async function addEntry(customerId, input, extra = {}) {
  const data = input.kind === "sprachnachricht" ? input : feedbackEntrySchema.parse(input);
  const { confirm: _c, ...clean } = data;
  const entry = {
    id: `PF-${randomUUID()}`,
    customerId,
    from: "kunde",
    createdAt: new Date().toISOString(),
    ...clean,
    ...extra,
  };
  await updateJson(STORE, empty, (current) => {
    current.entries = [...(current.entries || []), entry];
    return { value: current, result: null };
  });
  return strip(entry);
}

/** Does the parent entry exist in this customer's project? */
export async function hasEntry(customerId, projectId, entryId) {
  const { entries = [] } = await readJson(STORE, empty);
  return entries.some((e) => e.id === entryId && e.customerId === customerId && e.projectId === projectId);
}

/** Stores the audio bytes and returns the audio descriptor (server-side). */
export async function saveVoice(buffer, { mime, ext, durationSec }) {
  const id = `VO-${randomUUID()}`;
  await mkdir(VOICE_DIR, { recursive: true });
  const file = `${id}.${ext}`;
  await writeFile(path.join(VOICE_DIR, file), buffer);
  return { id, mime, size: buffer.length, durationSec: Math.round(durationSec * 10) / 10, file };
}

/** Audio of a voice entry, only if it belongs to the customer. */
export async function readVoice(customerId, voiceId) {
  if (!entryIdSchema.safeParse(voiceId).success) return null;
  const { entries = [] } = await readJson(STORE, empty);
  const entry = entries.find((e) => e.customerId === customerId && e.audio?.id === voiceId);
  if (!entry) return null;
  const full = path.join(VOICE_DIR, path.basename(entry.audio.file));
  try {
    await stat(full);
  } catch {
    return null;
  }
  return { buffer: await readFile(full), mime: entry.audio.mime };
}
