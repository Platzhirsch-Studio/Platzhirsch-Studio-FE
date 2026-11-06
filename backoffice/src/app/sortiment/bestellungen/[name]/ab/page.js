import { notFound } from "next/navigation";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Fehler from "@/components/Backoffice/Fehler";
import AbAssistent from "@/components/Backoffice/Sortiment/AbAssistent";
import { einstellungen, sortimentKontext } from "@/lib/backoffice/sortiment/daten";
import { bestellSperrgrund } from "@/lib/backoffice/sortiment/regeln";
import { ohneIntern } from "@/lib/backoffice/sortiment/rollen";
import { AB_ASSISTENT } from "@/lib/backoffice/sortiment/texte";
import { istBackofficeError } from "@/lib/backoffice/frappe/errors";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  return { title: `AB einlesen · ${decodeURIComponent((await params).name)}` };
}

export default async function AbEinlesenPage({ params }) {
  const name = decodeURIComponent((await params).name);
  const pfad = `/sortiment/bestellungen/${encodeURIComponent(name)}/ab`;
  const { session, client, leitung } = await sortimentKontext({ pfad, doctype: "PH Herstellerbestellung", aktion: "write" });
  let b;
  try {
    b = ohneIntern(await client.getDoc("PH Herstellerbestellung", name), session);
  } catch (err) {
    if (istBackofficeError(err) && err.code === "not_found") notFound();
    throw err;
  }
  const e = await einstellungen(client);
  const sperre = bestellSperrgrund(b, "abEinlesen");
  return (
    <Shell session={session}>
      <Seitenkopf titel={AB_ASSISTENT.titel} untertitel={`${b.name} · ${b.lieferant || "ohne Lieferant"} · ${b.kommission || "Lager"}`} krumen={[{ titel: "Sortiment", href: "/sortiment" }, { titel: "Bestellungen", href: "/sortiment/bestellungen" }, { titel: b.name, href: `/sortiment/bestellungen/${encodeURIComponent(b.name)}` }, { titel: AB_ASSISTENT.titel }]} />
      {sperre ? <Fehler code="invalid" message={sperre} zurueckHref={`/sortiment/bestellungen/${encodeURIComponent(b.name)}`} /> : <AbAssistent b={b} leitung={leitung} toleranz={{ toleranzPreis: Number(e.ab_toleranz_preis_prozent) || 0, toleranzTermin: Number(e.ab_toleranz_termin_tage) || 0 }} />}
    </Shell>
  );
}
