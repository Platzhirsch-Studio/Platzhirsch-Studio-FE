// src/lib/concierge/rateLimit.js
// Rate-Limit und Tagesbudget des Concierge. Die Logik steckt in limiter.js,
// der Speicher hinter der Schnittstelle in limitStore.js:
// - Standard: Arbeitsspeicher dieser Instanz (pm2, eine Instanz).
// - Geteilter Speicher (mehrere Instanzen, Serverless, übersteht Neustarts):
//   beim Start einmal setLimitStore(createSharedStore(exec)) aufrufen, z. B. in
//   instrumentation.js, sobald der Betrieb Redis/Upstash bereitstellt. Bis dahin
//   bleibt es beim Arbeitsspeicher – es wird kein Paket und kein Dienst genutzt.
import "server-only";
import { RATE, TRUSTED_PROXY_HOPS } from "./config";
import { createLimiter, createRetryPass } from "./limiter.js";

// Eine Instanz pro Server-Prozess, auch über Dev-HMR hinweg.
const KEY = Symbol.for("platzhirsch.concierge.limiter");
const limiter =
  globalThis[KEY] ||
  (globalThis[KEY] = createLimiter({
    globalPerDay: RATE.globalPerDay,
    onStoreError: (error) =>
      console.error("[concierge] limit store failed, using in-memory fallback:", error?.message || error),
  }));

export function setLimitStore(store) {
  limiter.setStore(store);
}

export function limitStoreName() {
  return limiter.storeName;
}

// Client IP as seen by OUR proxy. nginx appends $remote_addr to
// X-Forwarded-For, so the trustworthy entry is the one TRUSTED_PROXY_HOPS from
// the end; anything left of it came from the client. Without the header
// (direct access, dev) there is no reliable IP -> "local".
export function clientIp(request) {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) {
    const list = fwd.split(",").map((x) => x.trim()).filter(Boolean);
    const ip = list[Math.max(0, list.length - TRUSTED_PROXY_HOPS)];
    if (ip) return ip;
  }
  return request.headers.get("x-real-ip") || "local";
}

const PASS_KEY = Symbol.for("platzhirsch.concierge.retryPass");
const retryPass = globalThis[PASS_KEY] || (globalThis[PASS_KEY] = createRetryPass());

// Chat request: per IP (burst + daily), per consent session, global budget.
// rid: the browser's silent second attempt of the same question is not
// counted again against IP/session (limiter.js, createRetryPass).
export async function checkChat({ ip, sid, rid }) {
  const key = rid ? `${sid}:${rid}` : null;
  if (key && retryPass.isRetry(key)) return limiter.take([], { global: true });
  const result = await limiter.take(
    [
      { key: `ip:${ip}`, rules: [RATE.burst, RATE.daily] },
      { key: `sid:${sid}`, rules: [RATE.burst, RATE.session], reason: "session" },
    ],
    { global: true }
  );
  if (key && result.ok) retryPass.remember(key);
  return result;
}

// Consent / revoke requests: per IP only.
export function checkConsent(ip) {
  return limiter.take([{ key: `consent:${ip}`, rules: [RATE.consent] }]);
}
