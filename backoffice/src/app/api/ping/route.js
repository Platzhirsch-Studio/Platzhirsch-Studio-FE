// Verbindungsprüfung der KioskShell (useVerbindung). Kein Inhalt, kein Cache.
export const dynamic = "force-dynamic";
export async function GET() {
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
