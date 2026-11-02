import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, readdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { planSchema } from "../model";
import { PRUNE_EVERY_MS, isExpired, plansToPrune } from "./retention";

// Adapter for shared Sofa plans.
//
// Today: local development store in <repo>/.data/sofaplaner/plans/<id>.json
// (gitignored, never under public/). Later: swap the two functions below for
// calls to the Frappe backoffice (see Marktresearch/digital/features/sofaplaner.md,
// planned custom doctype "Sofa Plan" via /api/resource/Sofa Plan).
// Plans contain no personal data – contact details are never stored here.
// R2: retention (server/retention.js) – links expire after SOFAPLANER_TTL_DAYS
// (default 180) and old files are pruned at most every 6 h when a plan is saved.

const DIR = path.join(process.cwd(), ".data", "sofaplaner", "plans");
const ID_RE = /^[A-Za-z0-9_-]{16}$/;

let warned = false;
function secret() {
  const s = process.env.SOFAPLANER_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SOFAPLANER_SECRET is not set (min. 16 characters).");
  }
  if (!warned) {
    warned = true;
    console.warn("[sofaplaner] SOFAPLANER_SECRET fehlt – unsicheres Entwicklungs-Secret wird verwendet. Nicht für Produktion!");
  }
  return "dev-only-sofaplaner-secret-change-me";
}

function sign(id) {
  return createHmac("sha256", secret()).update(`sofaplan:${id}`).digest("base64url").slice(0, 22);
}

// Token = <id>.<hmac>. Only a correctly signed token is ever resolved to a
// file name, so a forged or guessed id never touches the file system.
export function verifyToken(token) {
  if (typeof token !== "string" || token.length > 64) return null;
  const [id, sig] = token.split(".");
  if (!id || !sig || !ID_RE.test(id)) return null;
  const expected = Buffer.from(sign(id));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  return id;
}

let lastPrune = 0;
/** Delete expired plans and the oldest ones above MAX_PLANS. Never throws. */
export async function pruneExpired(now = Date.now()) {
  lastPrune = now;
  try {
    const names = (await readdir(DIR)).filter((n) => n.endsWith(".json") && ID_RE.test(n.slice(0, -5)));
    const entries = [];
    for (const name of names) {
      try {
        entries.push({ name, time: (await stat(path.join(DIR, name))).mtimeMs });
      } catch {
        /* removed meanwhile */
      }
    }
    const doomed = plansToPrune(entries, { now });
    await Promise.all(doomed.map((n) => unlink(path.join(DIR, n)).catch(() => {})));
    return doomed.length;
  } catch {
    return 0; // no directory yet
  }
}

export async function savePlan(plan) {
  const parsed = planSchema.parse(plan);
  if (Date.now() - lastPrune > PRUNE_EVERY_MS) await pruneExpired();
  const id = randomBytes(12).toString("base64url");
  await mkdir(DIR, { recursive: true });
  await writeFile(
    path.join(DIR, `${id}.json`),
    JSON.stringify({ createdAt: new Date().toISOString(), plan: parsed }),
    "utf8"
  );
  return `${id}.${sign(id)}`;
}

export async function loadPlan(token) {
  const id = verifyToken(token);
  if (!id) return null;
  try {
    const raw = JSON.parse(await readFile(path.join(DIR, `${id}.json`), "utf8"));
    if (isExpired(raw.createdAt)) return null;
    const res = planSchema.safeParse(raw.plan);
    return res.success ? res.data : null;
  } catch {
    return null;
  }
}
