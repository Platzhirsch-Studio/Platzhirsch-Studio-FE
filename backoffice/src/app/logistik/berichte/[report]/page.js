import { notFound, redirect } from "next/navigation";
import Shell from "@/components/Backoffice/Shell/Shell";
import BerichtSeite, { ladeBericht } from "@/components/Backoffice/Bericht/BerichtSeite";
import { darf } from "@/lib/backoffice/auth/rechte";
import { bericht } from "@/lib/backoffice/logistik/daten";
import { BERICHTE } from "@/lib/backoffice/logistik/texte";
import { seite, werte } from "../../_teile";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }) {
  const { report } = await params;
  const b = BERICHTE.liste.find((x) => x.slug === report);
  return { title: b?.titel || "Bericht" };
}

// Bericht (§ 4.15, T8): Frappe getReport bzw. Mock-Rechnung mit denselben Spalten; Zeitlimit 8 s; Export nur mit Recht.
// Touren-Auslastung ohne Personenspalte (Q-A12).
export default async function LogistikBericht({ params, searchParams }) {
  const slug = (await params).report;
  const sp = werte(await searchParams);
  const def = BERICHTE.liste.find((b) => b.slug === slug);
  if (!def) notFound();
  const { session, client, leitung } = await seite(`/logistik/berichte/${slug}`);
  if (def.leitung && !leitung) redirect("/kein-zugriff?bereich=logistik&aktion=bericht");
  const spalten = [];
  const ergebnis = await ladeBericht(async () => {
    const r = await bericht(client, def.report, sp);
    spalten.push(...(r.columns || []).map((c) => ({ fieldname: c.fieldname, label: c.label, fieldtype: c.fieldtype === "Currency" ? "Int" : c.fieldtype, cent: !!c.cent, summe: ["Int", "Currency"].includes(c.fieldtype) })));
    return r.result || [];
  });
  return (
    <Shell session={session} breit>
    <BerichtSeite bericht={`logistik-${slug}`} bereich="logistik" titel={def.titel} untertitel={def.report.replace(/^PH /, "")} krumen={[{ titel: "Logistik", href: "/logistik" }, { titel: "Berichte", href: "/logistik/berichte" }, { titel: def.titel }]}
      ergebnis={ergebnis} spalten={spalten} darfExport={darf(session, "logistik", "export")} />
    </Shell>
  );
}
