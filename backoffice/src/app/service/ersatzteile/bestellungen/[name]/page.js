// Akte Ersatzteilbestellung (10-konzept-service §2.7): Primär je Status, Positionen mit Ist/Soll, Wareneingang (S6).
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRecht } from "@/lib/backoffice/auth/dal";
import { istBackofficeError } from "@/lib/backoffice/frappe/errors";
import { isoDatum } from "@/lib/backoffice/format";
import { serviceClient, sicht } from "@/lib/backoffice/service/daten";
import { BESTELLUNG_STATUS, text as anzeigeText } from "@/lib/backoffice/service/labels";
import { datumLang, euro, zeitpunkt } from "@/lib/backoffice/service/anzeige";
import { T } from "@/lib/backoffice/service/texte";
import Shell from "@/components/Backoffice/Shell/Shell";
import Kachel from "@/components/Backoffice/Kachel";
import { AkteKopf } from "@/components/Backoffice/Akte";
import NurIntern from "@/components/Backoffice/Kundenmodus/NurIntern";
import { Fakten, Status } from "@/components/Backoffice/Service/Teile";
import { BestellungAktionen } from "@/components/Backoffice/Service/TeileAktionen";
import "@/components/Backoffice/Service/service.css";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }) {
  return { title: `${decodeURIComponent((await params).name)} · Bestellung` };
}

export default async function BestellungAkte({ params }) {
  const name = decodeURIComponent((await params).name);
  const session = await requireRecht("service", "read", `/service/ersatzteile/bestellungen/${encodeURIComponent(name)}`);
  const client = serviceClient(session);
  const s = sicht(session);
  let b;
  try {
    b = await client.getDoc("PH Ersatzteilbestellung", name);
  } catch (err) {
    if (istBackofficeError(err) && err.code === "not_found") notFound();
    throw err;
  }
  const positionen = (b.positionen || []).map((p, i) => ({ ...p, schluessel: String(p.name || p.idx || i + 1) }));
  const ueberf = ["Gesendet", "Bestaetigt", "Teilgeliefert"].includes(b.status) && b.erwartet_am && b.erwartet_am < isoDatum();
  return (
    <Shell session={session}>
      <div className="grid gap-6">
        <AkteKopf
          zurueck={{ href: "/service/ersatzteile?ansicht=bestellungen", titel: "Bestellungen" }}
          krumen={[{ titel: "Ersatzteile", href: "/service/ersatzteile" }, { titel: "Bestellungen", href: "/service/ersatzteile?ansicht=bestellungen" }, { titel: name }]}
          titel={b.lieferant}
          nummer={
            <span className="flex flex-wrap items-center gap-3">
              <span className="tabular-nums">
                {name} · {datumLang(b.datum)}
              </span>
              <Status wert={b.status} map={BESTELLUNG_STATUS} />
              {ueberf && <span className="bo-svc-gwl" data-ton="abgelaufen">überfällig seit {datumLang(b.erwartet_am)}</span>}
            </span>
          }
          aktionen={<BestellungAktionen bestellung={{ name, status: b.status, positionen, servicefall: b.servicefall, lieferant: b.lieferant }} darf={s.schreiben} />}
        />
        <div className="grid gap-(--bo-bento-gap) xl:grid-cols-[minmax(0,1fr)_360px]">
          <Kachel titel="Positionen" unter={`${positionen.length} Positionen`}>
            {positionen.length ? (
              <ul className="bo-svc-zeilen -mx-3">
                {positionen.map((p) => (
                  <li key={p.schluessel} className="bo-svc-zeile bo-svc-zeile--ohne-bild">
                    <span className="min-w-0">
                      <span className="bo-svc-zeile__titel">{p.bezeichnung}</span>
                      <span className="bo-svc-zeile__unter">
                        {p.hersteller_nr || "–"}
                        {p.eingetroffen_am ? ` · eingetroffen ${datumLang(p.eingetroffen_am)}` : ""}
                      </span>
                    </span>
                    <span className="bo-svc-zeile__rechts flex-col items-end">
                      <span className="bo-svc-zeile__zeit">
                        {p.menge_erhalten || 0} / {p.menge}
                      </span>
                      {s.kosten && <NurIntern><span className="text-[13px] text-bo-text-soft">{euro(p.ek_cent)}</span></NurIntern>}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[14px] text-bo-text-soft">{T.ersatzteile.keinePosition}</p>
            )}
          </Kachel>
          <aside className="grid content-start gap-(--bo-bento-gap)">
            <Kachel titel="Bestellung">
              <Fakten spalten={1} eintraege={[{ label: "Kostenträger", wert: anzeigeText(b.kostentraeger) }, { label: "Lieferadresse", wert: b.lieferadresse }, { label: "Kommission", wert: b.kommission }, { label: "Gesendet", wert: b.gesendet_am ? `${zeitpunkt(b.gesendet_am)} an ${b.gesendet_an || "–"}` : null }, { label: "AB-Referenz", wert: b.lieferant_referenz }, { label: "Erwartet", wert: datumLang(b.erwartet_am) }, s.kosten && { label: "Summe EK", wert: <NurIntern>{euro(b.summe_ek_cent)}</NurIntern> }]} />
            </Kachel>
            {b.servicefall && (
              <Kachel titel="Servicefall" href={`/service/faelle/${encodeURIComponent(b.servicefall)}`}>
                <Link className="text-[15px] font-semibold underline" href={`/service/faelle/${encodeURIComponent(b.servicefall)}`}>
                  {b.servicefall}
                </Link>
                <p className="mt-1 text-[13px] text-bo-text-soft">{T.ersatzteile.kommission}</p>
              </Kachel>
            )}
          </aside>
        </div>
      </div>
    </Shell>
  );
}
