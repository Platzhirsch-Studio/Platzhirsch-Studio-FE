// Seitenrahmen des Shops (Server): Shell v2 (Leiste, Pillen-Reiter aus bereiche/shop.js, Kopfzeile) + Aktions-
// Zentrale (Dialoge, Undo). Jede Seite prüft ihre Sitzung selbst (kein Schutz im Layout).
import Shell from "@/components/Backoffice/Shell/Shell";
import { darfAnDieKassa } from "@/components/Backoffice/AnDieKassa";
import { istLeitung } from "@/lib/backoffice/shop/rechte";
import ShopAktionen from "./ShopAktionen";

export default function Rahmen({ session, modus = "mock", breit = true, children }) {
  return (
    <Shell session={session} breit={breit}>
      <ShopAktionen darfKassa={darfAnDieKassa(session)} leitung={istLeitung(session)} pdf={modus === "frappe"}>
        {children}
      </ShopAktionen>
    </Shell>
  );
}
