import { notFound } from "next/navigation";
import Link from "next/link";
import { requireDocRecht, requireSession } from "@/lib/backoffice/auth/dal";
import { backoffice, ladeMeta } from "@/lib/backoffice/frappe";
import Shell from "@/components/Backoffice/Shell/Shell";
import Kachel from "@/components/Backoffice/Kachel";
import Fehler from "@/components/Backoffice/Fehler";
import Zeitleiste from "@/components/Backoffice/Formular/Zeitleiste";
import { AkteGeruest, AkteKopf, RechteSpalte } from "@/components/Backoffice/Akte";
import { CrmStatus } from "@/components/Backoffice/Crm/Teile";
import { DatenschutzSchritte } from "@/components/Backoffice/Crm/DatenschutzTeile";
import { istLeitung, ladeDatenschutzanfrage } from "@/lib/backoffice/crm/daten";
import { CRM_TEXTE as T } from "@/lib/backoffice/crm/texte";
import { restTage } from "@/lib/backoffice/crm/vorgang";
import { datum } from "@/lib/backoffice/format";
import { istBackofficeError } from "@/lib/backoffice/frappe/errors";
import "@/components/Backoffice/Crm/crm.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Datenschutzanfrage · CRM" };

export default async function DatenschutzAkte({ params }) {
  const { name: roh } = await params;
  const name = decodeURIComponent(roh);
  const session = await requireSession(`/crm/datenschutz/${roh}`);
  const client = backoffice(session);
  await requireDocRecht(await ladeMeta(client, "PH Datenschutzanfrage"), "read", `/crm/datenschutz/${roh}`);
  let d;
  try {
    d = await ladeDatenschutzanfrage(session, client, name);
  } catch (err) {
    if (istBackofficeError(err) && err.code === "not_found") notFound();
    return <Shell session={session}><Fehler code={istBackofficeError(err) ? err.code : "unavailable"} message={err?.message} zurueckHref="/crm/datenschutz" /></Shell>;
  }
  const { doc: s, kontakt, personen } = d;
  const rest = restTage(s.frist);
  const offen = ["Offen", "In Arbeit"].includes(s.status);
  const stand = s.status === "Erledigt" || s.status === "Abgelehnt" ? 5 : !Number(s.identitaet_geprueft) ? 0 : s.status === "Offen" ? 1 : 2;
  return (
    <Shell session={session}>
      <AkteGeruest
        testid="crm-dsa-akte"
        kopf={
          <AkteKopf
            zurueck={{ href: "/crm/datenschutz", titel: T.seiten.datenschutz }}
            krumen={[{ titel: T.seiten.datenschutz, href: "/crm/datenschutz" }, { titel: s.name }]}
            titel={`${T.dsaArt[s.art] || s.art}: ${kontakt?.titel || s.kontakt}`}
            nummer={<span className={offen && rest <= 7 ? (rest < 0 ? "text-bo-danger-text" : "text-bo-warning-text") : ""}>{offen ? T.datenschutz.frist(datum(s.frist), rest) : `Frist ${datum(s.frist)}`}</span>}
            status={<CrmStatus objekt="datenschutz" wert={s.status} />}
            aktionen={<DatenschutzSchritte anfrage={{ name: s.name, status: s.status, identitaet_geprueft: s.identitaet_geprueft }} leitung={istLeitung(session)} />}
          />
        }
        rechts={
          <RechteSpalte
            details={
              <dl className="grid gap-3 text-[14px]">
                <div className="flex justify-between gap-3"><dt className="text-bo-text-soft">Eingang</dt><dd>{datum(s.eingang)}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-bo-text-soft">Kanal</dt><dd>{s.kanal || "–"}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-bo-text-soft">Zuständig</dt><dd>{personen[s.zugewiesen_an]?.name || "–"}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-bo-text-soft">{T.datenschutz.identitaet}</dt><dd>{Number(s.identitaet_geprueft) ? "ja" : "nein"}</dd></div>
              </dl>
            }
            bezuege={kontakt ? <Link href={`/kunden/${encodeURIComponent(kontakt.name)}`} className="block rounded-[16px] bg-bo-surface-2 px-4 py-3 font-semibold hover:bg-bo-fill-2">{kontakt.titel}</Link> : null}
            kachel={{ details: { titel: T.anfrageAkte.details }, bezuege: { titel: T.akte.bezuege } }}
          />
        }
      >
        <div className="grid gap-6">
          <Kachel titel="Ablauf" unter="Gesetzliche Frist: ein Monat ab Eingang">
            <ol className="bo-crm-schritte" data-testid="crm-dsa-schritte">
              {T.datenschutz.schritte.map((titel, i) => <li key={titel} className="bo-crm-schritt" data-zustand={i < stand ? "erledigt" : i === stand ? "aktuell" : "offen"} aria-current={i === stand ? "step" : undefined}>{i < stand ? "✓ " : `${i + 1}. `}{titel}</li>)}
            </ol>
            {s.beschreibung && <p className="mt-5 text-[15px] leading-[23px]">{s.beschreibung}</p>}
            {s.ergebnis && <p className="mt-3 text-[14px] text-bo-text-soft">Ergebnis: {s.ergebnis}</p>}
          </Kachel>
          <Zeitleiste doctype="PH Datenschutzanfrage" name={s.name} docinfo={d.docinfo} darfSchreiben feldLabels={{ status: "Status", identitaet_geprueft: "Identität geprüft" }} />
        </div>
      </AkteGeruest>
    </Shell>
  );
}
