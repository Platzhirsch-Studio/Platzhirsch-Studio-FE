// src/lib/upload/store.js — picks the storage adapter.
// UPLOAD_STORAGE=local (default) → .data/uploads/ or UPLOAD_LOCAL_DIR.
// Planned: "s3" (S3-compatible bucket in the EU, e.g. Exoscale/Hetzner/MinIO)
// and pushing finished files to Frappe — interface + plan in
// Marktresearch/digital/features/handy-upload.md and ./frappeAdapter.js.
// The s3 adapter is NOT built: it waits for the owner's OK on the provider.
// Live checklist: ./liveConfig.js (logged once in production when this module
// is first loaded, i.e. on the first upload request, not at server start).
import "server-only";
import { localStore } from "./localStore";
import { UPLOAD_CONFIG } from "./config";
import { liveReadiness, storageConfig } from "./liveConfig";

const adapters = { local: localStore };

const { adapter: wanted } = storageConfig(process.env);
if (!adapters[wanted]) {
  console.warn(`[upload] UPLOAD_STORAGE="${wanted}" ist noch nicht implementiert – nutze lokalen Speicher.`);
}
if (process.env.NODE_ENV === "production") {
  const LOGGED = Symbol.for("platzhirsch.upload.readinessLogged");
  if (!globalThis[LOGGED]) {
    globalThis[LOGGED] = true;
    const check = liveReadiness(process.env, { retentionConfirmed: UPLOAD_CONFIG.retentionConfirmed });
    const open = check.items.filter((i) => !i.ok);
    if (open.length) {
      const list = open.map((i) => ` - ${i.text}`).join("\n");
      console.warn(`[upload] Nicht bereit für den Live-Einsatz (${open.length} offen):\n${list}`);
    }
  }
}

export const store = adapters[wanted] || localStore;
