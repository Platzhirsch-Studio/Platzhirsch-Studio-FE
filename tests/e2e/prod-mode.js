// Produktionsschalter für E2E-Erwartungen (R3 technik P1-4).
//
// Einige Seiten sind im Produktions-Build absichtlich aus (404 bzw. nicht gerendert),
// im Dev-Server aber sichtbar. Die Tests koppeln ihre Erwartung an dasselbe Kriterium
// wie die Seite, statt die Fälle zu löschen:
//   - /de/ratgeber: listPublicRatgeber() → in Produktion nur Artikel mit
//     `freigegeben: true` (src/lib/ratgeber/index.js, src/content/ratgeber/*.md).
//   - /de/adventsabend: eventPublic() → in Produktion erst mit EVENT.startTime
//     (src/app/[locale]/adventsabend/event.js).
//   - Concierge/KI-Knopf: isAvailable() → nur mit KI-Schlüssel; der Server meldet
//     das unter /api/labs/status (`concierge`), siehe conciergeOn().
// Produktionsmodus: PW_PROD=1, `npm run test:e2e:prod` oder BASE_URL auf :3100.
// Die Dateien werden direkt gelesen (die Module nutzen den @/-Alias und
// "server-only" und lassen sich in Playwright nicht importieren).
import fs from "node:fs";
import path from "node:path";

export const PROD =
  process.env.PW_PROD === "1" ||
  process.env.npm_lifecycle_event === "test:e2e:prod" ||
  /:3100\b/.test(process.env.BASE_URL || "");

const root = process.cwd();

function ratgeberReleased() {
  const dir = path.join(root, "src", "content", "ratgeber");
  try {
    return fs.readdirSync(dir).some((f) => f.endsWith(".md") && /^freigegeben:\s*true\s*$/m.test(fs.readFileSync(path.join(dir, f), "utf8")));
  } catch {
    return false;
  }
}

function eventHasStartTime() {
  try {
    const src = fs.readFileSync(path.join(root, "src", "app", "[locale]", "adventsabend", "event.js"), "utf8");
    return /\bstartTime:\s*["']\d{1,2}:\d{2}["']/.test(src);
  } catch {
    return false;
  }
}

/** Ist die Seite im aktuellen Modus erreichbar (200) oder absichtlich 404? */
export const RATGEBER_ON = !PROD || ratgeberReleased();
export const ADVENTSABEND_ON = !PROD || eventHasStartTime();

/** Seiten, die im aktuellen Modus absichtlich 404 liefern. */
export const OFF_PAGES = [...(RATGEBER_ON ? [] : ["/de/ratgeber"]), ...(ADVENTSABEND_ON ? [] : ["/de/adventsabend"])];

/** Concierge laut Server (gleiches Kriterium wie Launcher und KI-Knopf). */
export async function conciergeOn(request) {
  const res = await request.get("/api/labs/status");
  if (!res.ok()) return false;
  const body = await res.json().catch(() => ({}));
  return body.concierge === true;
}
