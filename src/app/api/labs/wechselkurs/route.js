// GET /api/labs/wechselkurs → { base, quote, rate, date, source, fallback, ageDays, stale }
// EUR/CHF-Referenzkurs der EZB, serverseitig 12 h gecacht (siehe ecb.server.js).
// source: "ezb" | "zwischenspeicher" | "festwert" | "keiner". Ohne jeden gültigen
// Kurs: 503 mit rate: null – der Rechner rechnet dann nicht in CHF.
// Keine Eingaben, keine Personendaten.
import { getEurChf, RATE_TTL_SECONDS } from "@/components/Labs/Dreilaender/ecb.server";

export async function GET() {
  const data = await getEurChf();
  const none = data.rate == null;
  return Response.json(
    { base: "EUR", quote: "CHF", ...data },
    {
      status: none ? 503 : 200,
      headers: {
        "Cache-Control": none
          ? "no-store"
          : data.fallback
            ? "public, max-age=300"
            : `public, max-age=3600, s-maxage=${RATE_TTL_SECONDS}, stale-while-revalidate=86400`,
        "X-Robots-Tag": "noindex",
      },
    }
  );
}
