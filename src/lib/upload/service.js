// src/lib/upload/service.js — server-side logic of "Handy-Upload per QR".
// Route handlers and server pages call only these functions; storage is
// behind `store` (local dev folder today, S3/Frappe later — see store.js).
import "server-only";
import { createHash } from "node:crypto";
import { CATEGORY_KEYS, CONSENT_VERSION, KINDS, UPLOAD_CONFIG, UPLOAD_PAUSED, limitsFor, uploadsAccepting } from "./config";
import { detectType } from "./magic";
import { stripJpegGps } from "./exif";
import { demoParts, expiryFromNow, newId, newRef, signToken, verifyTicket, verifyToken } from "./token";
import { store } from "./store";

const DAY = 24 * 60 * 60 * 1000;
// verifyToken reasons → HTTP status ("unavailable" = no UPLOAD_TOKEN_SECRET in production).
const TOKEN_STATUS = { expired: 410, unavailable: 503 };
const PURGE_EVERY_MS = 10 * 60 * 1000;
let purging = null;
let lastPurgeAt = 0;

/** Starts store.purgeExpired() without awaiting it (one run at a time, throttled). */
export function purgeInBackground(now = Date.now()) {
  if (purging || now - lastPurgeAt < PURGE_EVERY_MS) return purging;
  lastPurgeAt = now;
  purging = Promise.resolve()
    .then(() => store.purgeExpired())
    .catch(() => 0)
    .finally(() => {
      purging = null;
    });
  return purging;
}

export class UploadError extends Error {
  constructor(status, code, message) {
    super(message || code);
    this.status = status;
    this.code = code;
  }
}

/** Demo uploads are a development feature; in production only with UPLOAD_DEMO_ENABLED=1. */
export function demoUploadsEnabled() {
  return process.env.NODE_ENV !== "production" || process.env.UPLOAD_DEMO_ENABLED === "1";
}

function newSession({ kind, ref, id, expiresAt, hint }) {
  const now = new Date();
  const demo = kind === "demo";
  return {
    id,
    ref,
    kind,
    kindLabel: KINDS[kind].label,
    demo,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    // Demo folders go as soon as the demo link expires (1 h).
    deleteAfter: new Date(expiresAt.getTime() + (demo ? 0 : UPLOAD_CONFIG.retentionDays * DAY)).toISOString(),
    // Unverified hints from the browser that sent the inquiry, so the team
    // can match the folder to the backoffice record until the inquiry API
    // returns its document name itself (see feature doc).
    hint: hint || null,
    consent: null,
    note: "",
    submittedAt: null,
    files: [],
  };
}

/**
 * Upload link for the success screen. Needs the signed ticket that
 * /api/upload/inquiry/<kind> returns after the backoffice accepted the inquiry.
 * The same ticket always yields the same link (id derived from the ticket).
 */
export async function mintSession({ ticket }) {
  assertAccepting();
  const t = verifyTicket(ticket);
  if (!t.ok) throw new UploadError(t.reason === "unavailable" ? 503 : 403, t.reason);

  const existing = await store.getSession(t.id);
  if (!existing) {
    // QA fix2 P1-1: the clean-up of expired folders no longer blocks the
    // visitor's request — it runs in the background, at most once per 10 min.
    purgeInBackground();
    const stats = await store.stats();
    if (stats.sessionsLastDay >= UPLOAD_CONFIG.maxNewSessionsPerDay) throw new UploadError(429, "daily_limit");
    if (stats.bytes >= UPLOAD_CONFIG.maxStoreBytes) throw new UploadError(507, "storage_full");
  }
  const session = await store.ensureSession(t.id, () => {
    store.noteGrowth?.({ sessions: 1 });
    return newSession({
      kind: t.kind,
      ref: newRef(t.kind),
      id: t.id,
      expiresAt: expiryFromNow(),
      // Hints from the inquiry route (signed into the ticket): backoffice
      // document name if the API returned one, and the e-mail of the form.
      hint: t.leadRef || t.email ? { leadRef: t.leadRef, email: t.email } : null,
    });
  });
  const expiresAt = new Date(session.expiresAt);
  return { token: signToken({ kind: session.kind, ref: session.ref, id: session.id, expiresAt }), ref: session.ref, expiresAt };
}

/** Fresh demo link per view of /de/upload (nothing stored yet). */
export function demoSession() {
  const parts = demoParts();
  return { token: signToken(parts), ref: parts.ref, expiresAt: parts.expiresAt, parts };
}

/**
 * Verifies the token and returns the session. Read-only: a session that has
 * no folder yet (demo, or one already purged) is returned as an unsaved
 * blank, so page views never write to disk.
 */
export async function openSession(token) {
  const v = verifyToken(token);
  if (!v.ok) throw new UploadError(TOKEN_STATUS[v.reason] || 404, v.reason);
  const session = (await store.getSession(v.id)) || newSession({ ...v, hint: v.kind === "demo" ? { note: "Demo" } : null });
  return { v, session };
}

/**
 * r1-recht-inhalt P0-4: without a confirmed Löschfrist nothing is accepted
 * (no link minted, no file, no note). 503 + "upload_paused" for every caller.
 */
export function assertAccepting() {
  if (!uploadsAccepting()) throw new UploadError(503, UPLOAD_PAUSED);
}

/** Like openSession, but creates the folder (first upload / note). */
async function writableSession(token) {
  assertAccepting();
  const v = verifyToken(token);
  if (!v.ok) throw new UploadError(TOKEN_STATUS[v.reason] || 404, v.reason);
  if (v.kind === "demo" && !demoUploadsEnabled()) throw new UploadError(403, "demo_disabled");
  const session = await store.ensureSession(v.id, () => newSession({ ...v, hint: v.kind === "demo" ? { note: "Demo" } : null }));
  return { v, session };
}

export function publicSession(session) {
  const totalBytes = session.files.reduce((s, f) => s + (f.status === "complete" ? f.size : 0), 0);
  return {
    ref: session.ref,
    kindLabel: session.kindLabel,
    demo: session.demo,
    expiresAt: session.expiresAt,
    deleteAfter: session.deleteAfter,
    // A demo never inherits a consent (every view is a new demo anyway).
    consentGiven: !session.demo && Boolean(session.consent),
    note: session.note,
    submittedAt: session.submittedAt,
    totalBytes,
    files: session.files.map(publicFile),
    limits: { chunkSize: UPLOAD_CONFIG.chunkSize, ...limitsFor(session) },
    uploadsEnabled: uploadsAccepting() && (!session.demo || demoUploadsEnabled()),
  };
}

function publicFile(f) {
  return {
    fileId: f.fileId,
    name: f.name,
    size: f.size,
    category: f.category,
    mime: f.mime || null,
    status: f.status,
    received: f.received,
    totalChunks: f.totalChunks,
    gpsRemoved: f.gpsRemoved ?? null,
    fingerprint: f.fingerprint,
  };
}

function cleanName(name) {
  const base = String(name || "datei").normalize("NFC").replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_").trim();
  return (base || "datei").slice(0, 120);
}

function recordConsent(session, consentVersion) {
  if (consentVersion !== CONSENT_VERSION) throw new UploadError(400, "consent_required");
  if (!session.consent) session.consent = { version: CONSENT_VERSION, at: new Date().toISOString() };
}

/** Registers a file (or finds the interrupted one with the same fingerprint). */
export async function initFile(token, input) {
  const { v } = await writableSession(token);
  if (!CATEGORY_KEYS.includes(input.category)) throw new UploadError(400, "bad_category");
  const cat = UPLOAD_CONFIG.categories[input.category];
  if (input.size <= 0 || input.size > cat.maxBytes) throw new UploadError(413, "too_large");

  const name = cleanName(input.name);
  const fingerprint = createHash("sha256")
    .update(`${name}|${input.size}|${input.lastModified || 0}|${input.category}`)
    .digest("base64url")
    .slice(0, 22);

  return store.updateSession(v.id, async (session) => {
    recordConsent(session, input.consentVersion);
    const existing = session.files.find((f) => f.fingerprint === fingerprint);
    if (existing) return publicFile(existing);

    const active = session.files;
    const limits = limitsFor(session);
    if (active.length >= limits.maxFiles) throw new UploadError(409, "too_many_files");
    const used = active.reduce((s, f) => s + f.size, 0);
    if (used + input.size > limits.maxTotalBytes) throw new UploadError(413, "quota_exceeded");
    const stats = await store.stats();
    if (stats.bytes + input.size > UPLOAD_CONFIG.maxStoreBytes) throw new UploadError(507, "storage_full");
    store.noteGrowth?.({ bytes: input.size });

    const fileId = newId();
    const totalChunks = Math.ceil(input.size / UPLOAD_CONFIG.chunkSize);
    await store.createPart(v.id, fileId, input.size);
    const file = {
      fileId,
      name,
      size: input.size,
      category: input.category,
      declaredType: String(input.type || "").slice(0, 100),
      fingerprint,
      chunkSize: UPLOAD_CONFIG.chunkSize,
      totalChunks,
      received: [],
      status: "uploading",
      mime: null,
      ext: null,
      gpsRemoved: null,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
    session.files.push(file);
    return publicFile(file);
  });
}

/** Writes one chunk; on the last one checks the type and strips GPS. */
export async function putChunk(token, fileId, index, bytes) {
  const { v, session } = await writableSession(token);
  const file = session.files.find((f) => f.fileId === fileId);
  if (!file) throw new UploadError(404, "file_not_found");
  if (file.status !== "uploading") return publicFile(file);
  if (!Number.isInteger(index) || index < 0 || index >= file.totalChunks) throw new UploadError(400, "bad_index");
  const expected = index === file.totalChunks - 1 ? file.size - index * file.chunkSize : file.chunkSize;
  if (bytes.length !== expected) throw new UploadError(400, "bad_chunk_size");

  // Reject wrong file types at the first chunk, before 300 MB arrive.
  if (index === 0) {
    const type = detectType(bytes.subarray(0, 16));
    const families = UPLOAD_CONFIG.categories[file.category].families;
    if (!type || !families.includes(type.family)) {
      await removeFile(token, fileId).catch(() => {});
      throw new UploadError(415, "unsupported_type");
    }
  }

  await store.writeChunk(v.id, fileId, index * file.chunkSize, bytes);

  const updated = await store.updateSession(v.id, (s) => {
    const f = s.files.find((x) => x.fileId === fileId);
    if (!f) throw new UploadError(404, "file_not_found");
    if (!f.received.includes(index)) f.received.push(index);
    f.received.sort((a, b) => a - b);
    // Exactly one request moves the file on to finalising (retries can race).
    const finalize = f.status === "uploading" && f.received.length === f.totalChunks;
    if (finalize) f.status = "finalizing";
    return { file: { ...f }, finalize };
  });

  if (!updated.finalize) return publicFile(updated.file);
  try {
    return await finalizeFile(v.id, fileId);
  } catch (e) {
    await store.updateSession(v.id, (s) => {
      const f = s.files.find((x) => x.fileId === fileId);
      if (f && f.status === "finalizing") f.status = "uploading";
    }).catch(() => {});
    throw e;
  }
}

async function finalizeFile(id, fileId) {
  const head = await store.readHead(id, fileId, 16);
  const type = detectType(head);
  if (!type) throw new UploadError(415, "unsupported_type");
  const info = await store.finalize(id, fileId, type.ext, type.mime === "image/jpeg"
    ? (buf) => {
        const { hadGps } = stripJpegGps(buf);
        return { changed: hadGps, gpsRemoved: hadGps };
      }
    : null);
  return store.updateSession(id, (s) => {
    const f = s.files.find((x) => x.fileId === fileId);
    f.status = "complete";
    f.mime = type.mime;
    f.ext = type.ext;
    // true = GPS found and removed, false = JPEG without GPS, null = format not rewritten.
    f.gpsRemoved = type.mime === "image/jpeg" ? Boolean(info.gpsRemoved) : null;
    f.completedAt = new Date().toISOString();
    return publicFile(f);
  });
}

export async function removeFile(token, fileId) {
  const { v } = await writableSession(token);
  return store.updateSession(v.id, async (s) => {
    const f = s.files.find((x) => x.fileId === fileId);
    if (!f) throw new UploadError(404, "file_not_found");
    await store.removeFile(v.id, fileId, f.ext || "part");
    s.files = s.files.filter((x) => x.fileId !== fileId);
    return { ok: true };
  });
}

/** Saves the note; `submit` marks the upload as done (confirmation). */
export async function saveNote(token, { note, submit, consentVersion }) {
  const { v } = await writableSession(token);
  return store.updateSession(v.id, (s) => {
    if (note && note.trim()) recordConsent(s, consentVersion);
    s.note = (note || "").trim().slice(0, UPLOAD_CONFIG.noteMaxLength);
    if (submit) {
      // Interrupted files stay resumable until the link expires; the team
      // only sees files with status "complete".
      s.submittedAt = new Date().toISOString();
      // TODO(Frappe): hier Benachrichtigung ans Team + Übertragung an das
      // Anfrage-Dokument auslösen (frappeAdapter.pushSession).
    }
    return publicSession(s);
  });
}
