import { getGeraetStatus, requireSession } from "@/lib/backoffice/auth/dal";
import { GERAET_TYPEN, geraeteListe } from "@/lib/backoffice/auth/geraet";
import { darfGeraeteVerwalten } from "@/lib/backoffice/auth/rechte";
import { geraetEntfernenAction } from "@/lib/backoffice/actions";
import { backoffice } from "@/lib/backoffice/frappe";
import { istBackofficeError } from "@/lib/backoffice/frappe/errors";
import { datumZeit, relativ } from "@/lib/backoffice/format";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Knopf from "@/components/Backoffice/Knopf";
import Fehler from "@/components/Backoffice/Fehler";
import { Icon } from "@/components/Backoffice/icons";
import GeraetForm from "./GeraetForm";
import GeraeteTabelle from "./GeraeteTabelle";

export const metadata = { title: "Gerät" };
export const dynamic = "force-dynamic";

// Geräte-Registrierung (Entscheidung Nr. 49) über ph_core (PH Geraet). Token im HttpOnly-Cookie,
// ein registriertes Gerät startet nach dem Login direkt im zugeordneten Arbeitsplatz.
// Admin und Leitungen sehen zusätzlich alle Geräte und können sie sperren/entsperren.
export default async function GeraetPage({ searchParams }) {
  const session = await requireSession("/geraet");
  const sp = await searchParams;
  const { status, geraet } = await getGeraetStatus();
  const verwalten = darfGeraeteVerwalten(session);
  let kassen = [];
  try {
    kassen = await backoffice(session).getList("PH Kasse", { fields: ["name", "bezeichnung"], limit: 50 });
  } catch {
    kassen = [];
  }
  let liste = null;
  let listenFehler = null;
  if (verwalten) {
    try {
      liste = await geraeteListe({ session });
    } catch (err) {
      listenFehler = { code: istBackofficeError(err) ? err.code : "unavailable", message: istBackofficeError(err) ? err.message : undefined };
    }
  }
  const typ = (t) => GERAET_TYPEN.find((x) => x.slug === t || x.phTyp === t)?.titel || t || "–";
  const zeilen =
    geraet && status === "ok"
      ? [
          ["Name", geraet.name],
          ["Geräte-Nr.", geraet.id || "–"],
          ["Standort", geraet.standort || "–"],
          ["Typ / Arbeitsplatz", `${typ(geraet.typ)} · ${geraet.arbeitsplatz || "–"}`],
          ["Kasse", geraet.kasse || "–"],
          ["Drucker", geraet.drucker || "–"],
          ["Zuletzt gesehen", geraet.zuletzt_gesehen ? `${relativ(geraet.zuletzt_gesehen)} (${datumZeit(geraet.zuletzt_gesehen)})` : "–"],
        ]
      : [];
  return (
    <Shell session={session}>
      <Seitenkopf titel="Dieses Gerät" untertitel="Einmalige Registrierung eines iPads oder Kassen-PCs für Kassa, Packtisch oder den mobilen Einsatz." krumen={[{ titel: "Zentrale", href: "/" }, { titel: "Gerät" }]} />
      {sp?.entfernt && (
        <p role="status" className="mb-4 rounded-bo bg-bo-surface-3 px-3 py-2 text-sm">
          Registrierung an diesem Gerät entfernt.
        </p>
      )}
      {status === "gesperrt" && (
        <div role="alert" className="mb-4 flex items-start gap-2 rounded-[10px] border border-bo-danger/40 bg-bo-danger-soft px-4 py-3 text-sm">
          <Icon name="AlertTriangle" className="mt-0.5 size-4 shrink-0 text-bo-danger" />
          <div>
            <p className="font-medium">Dieses Gerät ist gesperrt.</p>
            <p className="mt-0.5 text-bo-text-soft">{geraet?.gesperrt_grund || "Die Leitung hat das Gerät gesperrt."} Kiosk-Anmeldung und Bedienerwechsel sind hier nicht möglich.</p>
          </div>
        </div>
      )}
      {status === "fehler" && (
        <div className="mb-4">
          <Fehler kompakt code="unavailable" message="Der Gerätestatus ist gerade nicht prüfbar." />
        </div>
      )}
      {zeilen.length > 0 ? (
        <section className="rounded-[10px] border border-bo-line bg-bo-surface p-5" aria-label="Registriertes Gerät">
          <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            {zeilen.map(([k, v]) => (
              <div key={k} className="min-w-0">
                <dt className="text-xs text-bo-text-soft">{k}</dt>
                <dd className="truncate font-medium">{v}</dd>
              </div>
            ))}
          </dl>
          <form action={geraetEntfernenAction} className="mt-5 border-t border-bo-line pt-4">
            <Knopf type="submit" variant="danger">
              Registrierung an diesem Gerät entfernen
            </Knopf>
          </form>
        </section>
      ) : status !== "gesperrt" ? (
        <section className="rounded-[10px] border border-bo-line bg-bo-surface p-5" aria-label="Gerät registrieren">
          {verwalten ? (
            <GeraetForm typen={GERAET_TYPEN} kassen={kassen} />
          ) : (
            <p className="text-sm text-bo-text-soft">Dieses Gerät ist nicht registriert. Registrieren dürfen die Backoffice-Administration und die Leitungen.</p>
          )}
        </section>
      ) : null}

      {verwalten && (
        <section className="mt-8" aria-labelledby="h-geraete">
          <h2 id="h-geraete" className="mb-3 text-sm font-semibold">
            Alle Geräte
          </h2>
          {listenFehler ? <Fehler kompakt code={listenFehler.code} message={listenFehler.message} /> : <GeraeteTabelle geraete={liste || []} typen={GERAET_TYPEN} />}
        </section>
      )}
    </Shell>
  );
}
