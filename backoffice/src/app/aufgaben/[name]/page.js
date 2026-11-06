import Link from "next/link";
import { notFound } from "next/navigation";
import { requireDocRecht, requireSession } from "@/lib/backoffice/auth/dal";
import { backoffice, ladeMeta } from "@/lib/backoffice/frappe";
import { darfDoc } from "@/lib/backoffice/auth/rechte";
import { istBackofficeError } from "@/lib/backoffice/frappe/errors";
import { doctypeLabel } from "@/lib/backoffice/labels";
import { datumZeit } from "@/lib/backoffice/format";
import { tagIso } from "@/lib/backoffice/zentrale/fristen";
import { STATUS_TON } from "@/lib/backoffice/zentrale/aufgaben";
import { namenVon, objektHref } from "@/lib/backoffice/zentrale/daten";
import { AUFGABEN } from "@/lib/backoffice/zentrale/texte";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Kachel from "@/components/Backoffice/Kachel";
import StatusBadge from "@/components/Backoffice/StatusBadge";
import Avatar from "@/components/Backoffice/Avatar";
import Fehler from "@/components/Backoffice/Fehler";
import Zeitleiste from "@/components/Backoffice/Formular/Zeitleiste";
import { Icon } from "@/components/Backoffice/icons";
import AufgabeAkte from "@/components/Backoffice/Zentrale/AufgabeAkte";
import "@/components/Backoffice/Zentrale/zentrale.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { name } = await params;
  return { title: `${decodeURIComponent(name)} · Aufgaben · Platzhirsch Backoffice` };
}

/** Aufgabenakte (10-konzept-zentrale § 4.1). */
export default async function AufgabeSeite({ params }) {
  const { name: roh } = await params;
  const name = decodeURIComponent(roh);
  const session = await requireSession(`/aufgaben/${roh}`);
  const client = backoffice(session);
  const meta = await ladeMeta(client, "PH Aufgabe");
  await requireDocRecht(meta, "read", `/aufgaben/${roh}`);
  let doc;
  let docinfo = {};
  try {
    const r = await client.getDocMitInfo("PH Aufgabe", name);
    doc = r.doc || r;
    docinfo = r.docinfo || {};
  } catch (err) {
    if (istBackofficeError(err) && err.code === "not_found") notFound();
    return (
      <Shell session={session}>
        <Fehler code={istBackofficeError(err) ? err.code : "unavailable"} zurueckHref="/aufgaben" />
      </Shell>
    );
  }
  const heute = tagIso();
  const namen = await namenVon(client, [doc.zugewiesen_an, doc.erledigt_von]);
  const darfSchreiben = darfDoc(session, meta, "write");
  const bezugHref = doc.referenz_doctype && doc.referenz_name ? objektHref(doc.referenz_doctype, doc.referenz_name) : null;

  return (
    <Shell session={session}>
      <Seitenkopf
        titel={doc.titel || doc.name}
        krumen={[{ titel: "Zentrale", href: "/" }, { titel: AUFGABEN.titel, href: "/aufgaben" }, { titel: doc.name }]}
        zurueck="/aufgaben"
        titelZusatz={<StatusBadge wert={doc.status} ton={STATUS_TON[doc.status] || "grau"} groesse="m" />}
        untertitel={doc.name}
      />
      {doc.status === "Erledigt" && (
        <p className="zb-band mb-6" data-ton="ok" role="status">
          <Icon name="Check" className="mt-0.5 size-4 shrink-0" />
          {AUFGABEN.erledigtAm(datumZeit(doc.erledigt_am), namen.get(doc.erledigt_von))}
        </p>
      )}
      {doc.status === "Verworfen" && (
        <p className="zb-band mb-6" data-ton="info" role="status">
          {AUFGABEN.verworfenBand}
        </p>
      )}
      {doc.quelle && doc.quelle !== "manuell" && (
        <p className="zb-band mb-6" data-ton="info">
          <Icon name="Info" className="mt-0.5 size-4 shrink-0" />
          {AUFGABEN.automatisch}
        </p>
      )}
      <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Kachel titel={AUFGABEN.spalteAufgabe}>
          <AufgabeAkte aufgabe={{ name: doc.name, titel: doc.titel, status: doc.status, faellig: doc.faellig ? String(doc.faellig).slice(0, 10) : null, prioritaet: doc.prioritaet, beschreibung: doc.beschreibung, ergebnis: doc.ergebnis, quelle: doc.quelle }} heute={heute} darfSchreiben={darfSchreiben} />
        </Kachel>
        <div className="flex min-w-0 flex-col gap-6">
          <Kachel titel={AUFGABEN.bezug} dicht>
            {bezugHref ? (
              <Link href={bezugHref} className="zb-liste__i bg-bo-surface-2">
                <span className="min-w-0">
                  <span className="block text-[15px] font-medium">{doctypeLabel(doc.referenz_doctype)}</span>
                  <span className="zb-leise block truncate">{doc.referenz_name}</span>
                </span>
                <Icon name="ArrowUpRight" className="size-4" />
              </Link>
            ) : (
              <p className="zb-leise">{AUFGABEN.ohneBezug}</p>
            )}
            <div className="mt-4 flex items-center gap-3">
              <Avatar name={namen.get(doc.zugewiesen_an) || doc.zugewiesen_an || "?"} groesse={32} />
              <div className="min-w-0">
                <p className="zb-leise">{AUFGABEN.zustaendigFeld}</p>
                <p className="truncate text-[15px] font-medium">{namen.get(doc.zugewiesen_an) || doc.zugewiesen_an || "–"}</p>
              </div>
            </div>
          </Kachel>
          <Zeitleiste doctype="PH Aufgabe" name={doc.name} docinfo={docinfo} darfSchreiben={darfSchreiben} />
        </div>
      </div>
    </Shell>
  );
}
