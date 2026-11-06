import { notFound } from "next/navigation";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import { ZaehlModus } from "@/components/Backoffice/Logistik/Inventur";
import { inventurAction } from "@/lib/backoffice/logistik/actions";
import { inventurAkte } from "@/lib/backoffice/logistik/daten";
import { istBackofficeError } from "@/lib/backoffice/frappe/errors";
import { INVENTUR as T } from "@/lib/backoffice/logistik/texte";
import { seite } from "../../../_teile";

export const dynamic = "force-dynamic";
export const metadata = { title: "Zählen" };

// Zählmodus (§ 8.1) – mobil am iPhone/iPad: Scan, Zahlenfeld, Stückscan, Fund, Fortschritt; Blindzählung laut Einstellung.
export default async function Zaehlen({ params }) {
  const name = decodeURIComponent((await params).name);
  const { session, client, leitung } = await seite(`/logistik/inventur/${encodeURIComponent(name)}/zaehlen`);
  const a = await inventurAkte(client, name, { session, leitung }).catch((err) => {
    if (istBackofficeError(err) && err.code === "not_found") notFound();
    throw err;
  });
  return (
    <Shell session={session}>
      <Seitenkopf titel={T.zaehlen.titel} ueber={a.doc.titel || name} zurueck={`/logistik/inventur/${encodeURIComponent(name)}`} krumen={[{ titel: "Logistik", href: "/logistik" }, { titel: T.titel, href: "/logistik/inventur" }, { titel: name, href: `/logistik/inventur/${encodeURIComponent(name)}` }, { titel: T.zaehlen.titel }]} />
      <ZaehlModus inventur={name} titel={`${a.doc.lagerort} · ${a.doc.inventur_art}`} positionen={a.doc.positionen || []} sollAusblenden={a.sollAusblenden} aktion={inventurAction} laufend={a.doc.status === "Laufend"} />
    </Shell>
  );
}
