// src/lib/stilfinder/pdfWorker.mjs
// Worker thread that builds the Moodboard PDF (pdfPool.js starts it).
// Rendering ~28 pages and converting ~20 images takes 2–4 s of CPU; in the
// worker this never blocks the server's event loop (other page requests keep
// flowing). Plain Node ESM, loaded from disk (not bundled by Next), so it
// only imports bundler-free modules of src/lib/stilfinder.
import { parentPort } from "node:worker_threads";
import { buildMoodboardPdf } from "./build.js";
import { createCatalogImageLoader } from "./images.js";

const loaders = new Map();
const loaderFor = (server) => {
  if (!server) return null;
  if (!loaders.has(server)) loaders.set(server, createCatalogImageLoader({ server }));
  return loaders.get(server);
};

// imports are done: tell the pool (QA Runde 2, P2.6, workerStartMs)
parentPort.postMessage({ ready: true });

parentPort.on("message", async ({ id, job }) => {
  // QA Runde 3, P2.7: wall-clock stamps (shared between threads), so the pool
  // can tell waiting in the queue from building and from the way back
  const recvAt = Date.now();
  try {
    const out = await buildMoodboardPdf({ ...job, now: new Date(job.now || Date.now()), loadImage: loaderFor(job.server) });
    const buffer = new Uint8Array(out.buffer.buffer, out.buffer.byteOffset, out.buffer.byteLength).slice();
    parentPort.postMessage({ id, ok: true, out: { ...out, buffer, stamps: { recvAt, doneAt: Date.now() } } }, [buffer.buffer]);
  } catch (e) {
    parentPort.postMessage({ id, ok: false, error: String(e?.message || e) });
  }
});
