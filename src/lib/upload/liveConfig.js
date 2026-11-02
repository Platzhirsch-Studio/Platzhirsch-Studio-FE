// src/lib/upload/liveConfig.js — what the upload feature needs before a
// public live launch (Abnahme R-9). Pure: reads only the `env` object it is
// given (no "server-only", no imports), so node --test checks it and
// store.js logs the open items once in production, when the module is first
// loaded (first upload request, also during `next build`), not at start.
// Feature doc: Marktresearch/digital/features/handy-upload.md, "Live-Einsatz".
//
// Nothing here connects to a cloud service. UPLOAD_STORAGE=s3 is a planned
// adapter: it stays unimplemented until the owner chose the provider (EU
// region, contract, processing agreement), see inhaber-entscheidungen.md.

export const STORAGE_ADAPTERS = ["local", "s3"];
export const IMPLEMENTED_STORAGE = new Set(["local"]);
export const S3_ENV = ["UPLOAD_S3_ENDPOINT", "UPLOAD_S3_REGION", "UPLOAD_S3_BUCKET", "UPLOAD_S3_ACCESS_KEY_ID", "UPLOAD_S3_SECRET_ACCESS_KEY"];

const isAbs = (p) => typeof p === "string" && (p.startsWith("/") || /^[A-Za-z]:[\\/]/.test(p));

/** Storage settings from env (no secrets in the result, only whether they are set). */
export function storageConfig(env = {}) {
  const adapter = (env.UPLOAD_STORAGE || "local").trim().toLowerCase();
  return {
    adapter,
    known: STORAGE_ADAPTERS.includes(adapter),
    implemented: IMPLEMENTED_STORAGE.has(adapter),
    // local: folder for .data/uploads. Live: an absolute path on a persistent
    // volume that is in the server backup (not inside the deploy folder,
    // which a redeploy may replace).
    localDir: env.UPLOAD_LOCAL_DIR ? String(env.UPLOAD_LOCAL_DIR) : null,
    localDirAbsolute: isAbs(env.UPLOAD_LOCAL_DIR),
    backupConfirmed: env.UPLOAD_BACKUP_CONFIRMED === "1",
    s3: {
      configured: S3_ENV.every((k) => Boolean(env[k])),
      missing: S3_ENV.filter((k) => !env[k]),
      bucket: env.UPLOAD_S3_BUCKET || null,
      region: env.UPLOAD_S3_REGION || null,
      prefix: env.UPLOAD_S3_PREFIX || "uploads/",
    },
  };
}

/** Rate-limit settings from env. */
export function rateLimitConfig(env = {}) {
  const backend = (env.UPLOAD_RATE_LIMIT_STORE || "memory").trim().toLowerCase();
  return {
    backend,
    // memory is correct for exactly one server process (pm2 instances: 1).
    singleInstance: env.UPLOAD_SINGLE_INSTANCE !== "0",
    trustedIpHeader: env.UPLOAD_TRUSTED_IP_HEADER || null,
  };
}

/**
 * Checklist for a public launch. Pass { retentionConfirmed } from
 * UPLOAD_CONFIG (config.js) so the Löschfrist is checked too.
 * items: { key, ok, text } (German, for the log and the feature doc);
 * `text` is only set for open items (ok: false), otherwise null (QM fix2
 * P3-5). `ready` only when every item is ok.
 */
export function liveReadiness(env = {}, { retentionConfirmed = false } = {}) {
  const storage = storageConfig(env);
  const rate = rateLimitConfig(env);
  const items = [];
  const add = (key, ok, text) => items.push({ key, ok: Boolean(ok), text: ok ? null : text });

  add("secret", (env.UPLOAD_TOKEN_SECRET || "").length >= 32, "UPLOAD_TOKEN_SECRET mit mindestens 32 Zeichen setzen.");
  add("baseUrl", /^https:\/\//.test(env.UPLOAD_PUBLIC_BASE_URL || env.NEXT_PUBLIC_SITE_URL || ""), "UPLOAD_PUBLIC_BASE_URL (oder NEXT_PUBLIC_SITE_URL) mit https:// setzen, sonst zeigt der QR-Code auf eine falsche Adresse.");
  add("demoOff", env.UPLOAD_DEMO_ENABLED !== "1", "UPLOAD_DEMO_ENABLED darf live nicht 1 sein.");
  add("storageKnown", storage.known && storage.implemented, storage.known
    ? `UPLOAD_STORAGE=${storage.adapter} ist noch nicht umgesetzt (Anbieter und Vertrag brauchen das OK des Inhabers).`
    : `UPLOAD_STORAGE=${storage.adapter} ist unbekannt (erlaubt: ${STORAGE_ADAPTERS.join(", ")}).`);
  if (storage.adapter === "local") {
    add("localDir", storage.localDirAbsolute, "UPLOAD_LOCAL_DIR auf einen absoluten Pfad außerhalb des Deploy-Ordners setzen (dauerhaftes Volume).");
    add("backup", storage.backupConfirmed, "Backup des Upload-Ordners einrichten und mit UPLOAD_BACKUP_CONFIRMED=1 bestätigen.");
    add("singleInstanceStorage", rate.singleInstance, "Lokaler Speicher funktioniert nur mit einer Server-Instanz (pm2 instances: 1).");
  } else if (storage.adapter === "s3") {
    add("s3Env", storage.s3.configured, `Fehlende S3-Variablen: ${storage.s3.missing.join(", ") || "keine"}.`);
  }
  if (rate.backend === "memory") {
    add("rateLimitScope", rate.singleInstance, "Rate-Limit im Arbeitsspeicher gilt nur pro Instanz. Bei mehreren Instanzen einen geteilten Speicher anschließen (setUploadLimitStore).");
  } else {
    // "shared" = the operator MEANT to wire setUploadLimitStore(createSharedStore(exec)).
    // env alone cannot prove that: http.js checks it on the first rateLimited()
    // call in production and logs an error when no shared store is attached
    // (limitStore.js sharedStoreMismatch, QM fix2 P2-2).
    add("rateLimitBackend", rate.backend === "shared", `UPLOAD_RATE_LIMIT_STORE=${rate.backend} ist unbekannt (erlaubt: memory, shared).`);
  }
  add("trustedIp", Boolean(rate.trustedIpHeader), "UPLOAD_TRUSTED_IP_HEADER (z. B. x-real-ip) setzen, wenn der Reverse-Proxy diesen Header überschreibt. Sonst teilen sich alle Besucher einen Topf (120 Links pro Stunde).");
  add("retention", retentionConfirmed, "Löschfrist durch das Unternehmen bestätigen lassen und in config.js retentionDays/retentionConfirmed setzen (bis dahin nimmt der Upload nichts an).");

  return { ready: items.every((i) => i.ok), items, storage, rate };
}
