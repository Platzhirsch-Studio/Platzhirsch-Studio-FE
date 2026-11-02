import { json } from "@/lib/raumzwilling/api";
import { leseTeam, TEAM_COOKIE } from "@/lib/raumzwilling/team";
import { sucheKatalog } from "@/lib/raumzwilling/katalog";
import { rateLimit } from "@/lib/portal/rateLimit";

// GET /api/portal/raum/katalog?q=…  (nur Team)
// Treffer aus dem Katalog mit geprüften Herstellermaßen (oder „Maße fehlen“).

export async function GET(request) {
  const team = leseTeam(request.cookies.get(TEAM_COOKIE)?.value);
  if (!team) return json({ error: "Nicht angemeldet" }, 401);
  const limit = rateLimit("raum-katalog", { limit: 120, windowMs: 60 * 1000 });
  if (!limit.ok) return json({ error: "Zu viele Suchen" }, 429);
  const q = new URL(request.url).searchParams.get("q") || "";
  return json(await sucheKatalog(q));
}
