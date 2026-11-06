import { getGeraetToken } from "@/lib/backoffice/auth/dal";
import { geraetLebenszeichen } from "@/lib/backoffice/auth/geraet";

export const dynamic = "force-dynamic";

/**
 * Lebenszeichen des Kiosk-Geräts (ph_core touch_device): KioskShell ruft es alle 5 min,
 * solange ein Gerät registriert ist. Antwort ohne Token: {ok, geraet?, zuletzt_gesehen?, code?, gesperrt?}.
 */
export async function POST() {
  const token = await getGeraetToken();
  if (!token) return Response.json({ ok: false, code: "kein_geraet" }, { status: 200, headers: { "Cache-Control": "no-store" } });
  try {
    const r = await geraetLebenszeichen(token);
    return Response.json(r, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ ok: false, code: "unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
