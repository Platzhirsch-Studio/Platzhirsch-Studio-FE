// src/lib/stilfinder/pdfPool.js
// Runs buildMoodboardPdf in ONE long-lived worker thread (pdfWorker.mjs), so
// the CPU-heavy part never blocks the server's event loop. Jobs queue inside
// the worker; withBuildSlot (limits.js) caps them at LIMITS.concurrent.
// The worker file is loaded from disk at runtime (process.cwd()/src/…):
// `next start` runs in the repo root (ecosystem.config.js), so it exists.
// If the worker cannot start, the caller falls back to rendering inline.
// No "@/..." imports.
import * as workerThreads from "node:worker_threads";
import path from "node:path";
import fs from "node:fs";

const WORKER_FILE = path.join(process.cwd(), "src", "lib", "stilfinder", "pdfWorker.mjs");

// QA Runde 2, P2.6: the result page (prewarm) and the API route are separate
// bundles in Next – module variables are NOT shared between them, so the
// pre-started worker was never found by the route. The pool lives on
// globalThis, one per process.
const G = (globalThis.__stilfinderPdfPool ||= { worker: null, seq: 0, pending: new Map(), startedAt: 0, readyAt: 0 });
const pending = G.pending;

function failAll(err, w) {
  for (const [id, p] of pending) {
    if (p.w !== w) continue;
    clearTimeout(p.timer);
    p.reject(err);
    pending.delete(id);
  }
}

// Development only: a worker on globalThis survives hot reloads, so it would
// keep old code. Restart it when a module of this folder changed.
const DIR = path.dirname(WORKER_FILE);
function codeStamp() {
  if (process.env.NODE_ENV === "production") return 0;
  try {
    return Math.max(...fs.readdirSync(DIR).filter((n) => /\.m?js$/.test(n)).map((n) => fs.statSync(path.join(DIR, n)).mtimeMs));
  } catch {
    return 0;
  }
}

function getWorker(reason = "Anfrage") {
  if (G.worker && G.stamp !== codeStamp() && !pending.size) {
    const old = G.worker;
    G.worker = null;
    old.terminate().catch(() => {});
  }
  if (G.worker) return G.worker;
  G.stamp = codeStamp();
  // Reflect.construct: the bundler (Turbopack) rewrites a literal `new Worker(…)`
  // into its own worker loader (needs __dirname, fails in ESM). This keeps the
  // plain Node worker on the file from disk.
  const w = Reflect.construct(workerThreads.Worker, [WORKER_FILE]);
  G.startedAt = Date.now();
  G.readyAt = 0;
  console.info(`[stilfinder] PDF-Worker gestartet (${reason})`);
  w.on("message", ({ id, ok, out, error, ready }) => {
    if (ready) {
      G.readyAt = Date.now();
      console.info(`[stilfinder] PDF-Worker bereit nach ${G.readyAt - G.startedAt} ms`);
      return;
    }
    const p = pending.get(id);
    if (!p) return;
    pending.delete(id);
    clearTimeout(p.timer);
    if (ok) {
      // QA Runde 3, P2.7: queueMs = posted → picked up by the worker (worker
      // start or a job in front), returnMs = finished → seen by the main
      // thread (a busy main event loop, e.g. dev compilation)
      const st = out.stamps || {};
      const queue = { queueMs: st.recvAt ? Math.max(0, st.recvAt - p.postAt) : null, returnMs: st.doneAt ? Math.max(0, Date.now() - st.doneAt) : null };
      p.resolve({ ...out, ...queue, buffer: Buffer.from(out.buffer.buffer, out.buffer.byteOffset, out.buffer.byteLength), workerCold: p.cold, workerStartMs: G.readyAt ? G.readyAt - G.startedAt : null });
    }
    else p.reject(new Error(error));
  });
  w.on("error", (e) => {
    if (G.worker === w) G.worker = null;
    failAll(e, w);
  });
  w.on("exit", () => {
    if (G.worker === w) G.worker = null;
    failAll(new Error("pdf worker exited"), w);
  });
  w.unref();
  G.worker = w;
  return w;
}

/**
 * Starts the worker ahead of the first PDF (QA Runde 1, P2.1): loading
 * @react-pdf and the fonts takes ~2–3 s, which the first customer would
 * otherwise wait for. Called from the result page via warm.js. Never throws.
 */
export function prewarmWorker() {
  try {
    getWorker("Vorstart Ergebnisseite");
  } catch {
    /* falls back to inline rendering on the request */
  }
}

/** job = serialisable options of buildMoodboardPdf plus `server` (image origin). */
/** State of the worker for the timings (QA Runde 2, P2.6). */
export function workerState() {
  return { running: Boolean(G.worker), ready: Boolean(G.worker && G.readyAt), startMs: G.readyAt ? G.readyAt - G.startedAt : null };
}

export function renderInWorker(job, { timeoutMs = 25_000 } = {}) {
  return new Promise((resolve, reject) => {
    let w;
    const cold = !(G.worker && G.readyAt);
    try {
      w = getWorker();
    } catch (e) {
      reject(e);
      return;
    }
    const id = ++G.seq;
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error("pdf worker timeout"));
      // a stuck render: start fresh next time
      w.terminate().catch(() => {});
    }, timeoutMs);
    pending.set(id, { resolve, reject, timer, cold, w, postAt: Date.now() });
    w.postMessage({ id, job });
  });
}
