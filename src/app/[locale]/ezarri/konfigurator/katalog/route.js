// GET /de/ezarri/konfigurator/katalog – vollständiger Konfigurator-Katalog als JSON
// (402 Referenzen mit gemessenen Steinfarben, Fugen, Patterns, Ezarri-Mischungen;
// ≈ 28 KB gzip). Lädt der Konfigurator im Leerlauf nach. Keine Personendaten,
// keine Preise. Nie indexiert (X-Robots-Tag).
import { ezarriLocaleEnabled } from "@/lib/ezarri/config";
import { getKonfiguratorKatalog } from "@/lib/ezarri/konfigurator/katalog";

export async function GET(_request, { params }) {
  const { locale } = await params;
  if (!ezarriLocaleEnabled(locale)) return new Response("Not found", { status: 404 });
  return Response.json(getKonfiguratorKatalog(), {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
