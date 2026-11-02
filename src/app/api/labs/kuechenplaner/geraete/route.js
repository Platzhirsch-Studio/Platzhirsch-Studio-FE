// Küchenplaner – schlanke Geräteliste aus dem statischen Herstellerkatalog
// (src/lib/katalog/, Welt kuechengeraete) für die Geräteauswahl im Planer.
// Keine Nutzerdaten, kein Backoffice: nur Daten aus dem Repo. Preise nur über
// preisAktiv() (KATALOG_PREISE, PREISE_PAUSIERT, Höchstalter) – Datum = Tag
// des (Re-)Validierens, deshalb stündlich neu (UVP-Ablauf greift taggenau).
import { NextResponse } from "next/server";
import { KATALOG_MARKEN, produkteByWelt } from "@/lib/katalog";
import { heuteIso, katalogPreiseAn } from "@/lib/katalog/config";
import { buildGeraeteIndex } from "@/lib/kuechenplaner/geraete";

export const revalidate = 3600;

export function GET() {
  const heute = heuteIso();
  const marken = Object.fromEntries(KATALOG_MARKEN.map((m) => [m.slug, m.name]));
  const list = buildGeraeteIndex(produkteByWelt("kuechengeraete"), { heute, an: katalogPreiseAn(), marken });
  return NextResponse.json(
    { v: 1, heute, list },
    { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400", "X-Robots-Tag": "noindex" } },
  );
}
