import { requireSession } from "@/lib/backoffice/auth/dal";
import { GERAET_TYPEN, geraeteListe } from "@/lib/backoffice/auth/geraet";
import { darfGeraeteVerwalten } from "@/lib/backoffice/auth/rechte";
import { istBackofficeError } from "@/lib/backoffice/frappe/errors";
import { GERAETE as T } from "@/lib/backoffice/zentrale/texte";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Knopf from "@/components/Backoffice/Knopf";
import Kachel from "@/components/Backoffice/Kachel";
import Leer from "@/components/Backoffice/Leer";
import Fehler from "@/components/Backoffice/Fehler";
import GeraeteTabelle from "../geraet/GeraeteTabelle";
import "@/components/Backoffice/Zentrale/zentrale.css";

export const metadata = { title: "Geräte · Zentrale · Platzhirsch Backoffice" };
export const dynamic = "force-dynamic";

/** Geräte (10-konzept-zentrale § 3.11): Liste aller registrierten Geräte mit Sperren/Entsperren; Registrieren auf /geraet. */
export default async function Geraete() {
  const session = await requireSession("/geraete");
  const verwalten = darfGeraeteVerwalten(session);
  let liste = [];
  let fehler = null;
  if (verwalten) {
    try {
      liste = await geraeteListe({ session });
    } catch (err) {
      fehler = istBackofficeError(err) ? err.code : "unavailable";
    }
  }
  const gesperrt = liste.filter((g) => !g.aktiv).length;
  return (
    <Shell session={session}>
      <Seitenkopf
        titel={T.titel}
        untertitel={T.unter}
        krumen={[{ titel: "Zentrale", href: "/" }, { titel: "Verwaltung", href: "/verwaltung" }, { titel: T.titel }]}
        kennzahlen={verwalten ? [{ wert: liste.length, text: T.titel }, { wert: gesperrt, text: T.gesperrt }] : []}
        aktionen={
          verwalten ? (
            <Knopf variant="primary" icon="Plus" href="/geraet">
              {T.registrieren}
            </Knopf>
          ) : null
        }
      />
      {!verwalten ? (
        <Leer art="recht" />
      ) : fehler ? (
        <Fehler code={fehler} />
      ) : liste.length === 0 ? (
        <Leer titel={T.leer} text={T.leerText} icon="Monitor" aktion={<Knopf variant="primary" icon="Plus" href="/geraet">{T.registrieren}</Knopf>} />
      ) : (
        <Kachel testid="geraete-liste">
          <GeraeteTabelle geraete={liste} typen={GERAET_TYPEN} />
        </Kachel>
      )}
    </Shell>
  );
}
