// GET /hilfe/inhalt – Daten des Hilfe-Panels (K-24) und der Palette (Präfix „?“). Nur mit Sitzung.
//   ?pfad=/crm/anfragen → { artikel|null, wasTun:{titel, seiten[], aktionen[]}, kuerzel[] }
//   ?q=text             → { treffer:[{titel, bereich, href}] } (Titelsuche über alle Artikel)
import { requireApiSession } from "@/lib/backoffice/auth/dal";
import { darf } from "@/lib/backoffice/auth/rechte";
import { alleHilfeArtikel, kuerzelFuerSeite, ladeHilfe, normalisierePfad, wasKannIch } from "@/lib/backoffice/hilfe";

export const dynamic = "force-dynamic";

const KEIN_CACHE = { "Cache-Control": "no-store" };

export async function GET(request) {
  const auth = await requireApiSession(request);
  if (auth.response) return auth.response;
  const { session } = auth;
  const sp = new URL(request.url).searchParams;

  if (sp.has("q")) {
    const q = String(sp.get("q") || "").trim().toLowerCase().slice(0, 60);
    const gruppen = await alleHilfeArtikel();
    const treffer = gruppen
      .flatMap((g) => g.artikel.map((a) => ({ titel: a.titel, bereich: g.titel, href: a.href })))
      .filter((a) => !q || a.titel.toLowerCase().includes(q) || a.bereich.toLowerCase().includes(q))
      .slice(0, 8);
    return Response.json({ treffer }, { headers: KEIN_CACHE });
  }

  const pfad = normalisierePfad(sp.get("pfad") || "/");
  if (!/^\/[\w\-/.%~]*$/.test(pfad) || pfad.length > 300) return Response.json({ code: "invalid", message: "Ungültiger Pfad." }, { status: 400, headers: KEIN_CACHE });
  const artikel = await ladeHilfe(pfad);
  return Response.json(
    {
      artikel,
      wasTun: wasKannIch(pfad, (bereich, aktion) => darf(session, bereich, aktion)),
      kuerzel: kuerzelFuerSeite(pfad),
    },
    { headers: KEIN_CACHE }
  );
}
