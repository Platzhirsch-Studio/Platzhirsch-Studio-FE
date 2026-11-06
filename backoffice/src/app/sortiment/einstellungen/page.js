import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import EinstellungenFormular from "@/components/Backoffice/Sortiment/EinstellungenFormular";
import { einstellungen, sortimentKontext } from "@/lib/backoffice/sortiment/daten";
import { EINSTELLUNGEN } from "@/lib/backoffice/sortiment/texte";

export const dynamic = "force-dynamic";
export const metadata = { title: "Einstellungen · Sortiment" };

const FELDER = ["website_revalidate_aktiv", "revalidate_drossel_sekunden", "claim_guard_aktiv", "preis_max_monate_verkaufspreis", "preis_max_monate_uvp", "preisliste_schwelle_prozent", "ab_toleranz_preis_prozent", "ab_toleranz_termin_tage", "eigene_gln", "standard_lieferadresse"];

export default async function EinstellungenPage() {
  const { session, client, leitung } = await sortimentKontext({ pfad: "/sortiment/einstellungen", doctype: "PH Sortiment Einstellungen" });
  const e = await einstellungen(client);
  const werte = Object.fromEntries(FELDER.map((f) => [f, e[f] ?? ""]));
  return (
    <Shell session={session}>
      <Seitenkopf titel={EINSTELLUNGEN.titel} untertitel={EINSTELLUNGEN.untertitel} krumen={[{ titel: "Zentrale", href: "/" }, { titel: "Sortiment", href: "/sortiment" }, { titel: "Einstellungen" }]} />
      <EinstellungenFormular werte={werte} darfSchreiben={leitung} />
    </Shell>
  );
}
