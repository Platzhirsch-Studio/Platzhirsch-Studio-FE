import { redirect } from "next/navigation";

// /kundenkarte/vorteile[/<name>] → 307 auf den Stufenplan (Konzept §2.1, P26): Vorteile leben dort im Katalog.
export const dynamic = "force-dynamic";

export default async function VorteileUmleitung({ params }) {
  const { rest } = await params;
  const name = Array.isArray(rest) && rest[0] ? decodeURIComponent(rest[0]) : "";
  redirect(name && /^[\w-]{3,60}$/.test(name) ? `/kundenkarte/stufen?panel=${encodeURIComponent(`vorteil:${name}`)}` : "/kundenkarte/stufen");
}
