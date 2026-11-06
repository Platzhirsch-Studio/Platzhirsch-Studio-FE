// Alte Route (10-konzept-service §2.0.1) → 307 auf die neue Ansicht; Datensatz-Pfade auf die Akte.
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const AKTE = { ersatzteilbestellungen: "/service/ersatzteile/bestellungen/", "pflege-abos": "/service/vertraege/pflege/", auftraege: "/service/vertraege/auftraege/" };

export default async function Umleitung({ params }) {
  const { rest } = await params;
  const name = Array.isArray(rest) && rest[0] ? rest[0] : null;
  redirect(name ? `${AKTE["pflege-abos"]}${encodeURIComponent(decodeURIComponent(name))}` : "/service/vertraege?art=pflege");
}
